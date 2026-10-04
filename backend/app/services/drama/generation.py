"""Drama image / video generation helpers."""

from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import User
from app.models_drama import DramaAsset, DramaEpisode, DramaEpisodeFragment, DramaFragmentAssetRef, DramaProject
from app.services.ark import TaskResult, get_ark
from app.services.drama.billing_util import record_seedance_video_usage, record_seedream_image_usage, seedance_billing_key
from app.services.drama.output_settings import (
    infer_aspect_ratio_from_pixels,
    resolve_episode_video_output,
    seedream_still_size_for_video_ratio,
)
from app.services.billing import record_line
from app.services.drama.build_seedance_generate_body import (
    ASSET_MENTION_TOKEN_PATTERN,
    SEEDANCE_ATTACH_REFERENCE_AUDIO,
    build_seedance_generate_body,
    build_seedance_reference_catalog,
    describe_seedance_content_slots,
    drama_asset_to_payload,
    read_asset_voice_audio_url,
    resolve_episode_burn_subtitles,
    resolve_episode_character_intro,
)
from app.services.drama.fragment_asset_limit import cap_fragment_asset_ids
from app.services.drama.build_fragments import prepare_fragment_content
from app.services.drama.generation_prompt import append_style_prompt, build_generation_prompt
from app.services.drama.image_styles import resolve_image_style_board_url
from app.services.drama.seedream_options import resolve_seedream_model_endpoint, resolve_seedream_size
from app.services.drama.visual_prompt import resolve_visual_prompt_for_asset
from app.services.drama.voice_synthesis import build_voice_sample_text, synthesize_voice_asset
from app.services.drama.voice_prompt import fallback_voice_prompt
from app.services.drama.voice_reference_audio import (
    finalize_voice_reference_url,
    is_voice_duration_too_short,
    patch_params_voice_url,
    probe_voice_url_duration,
)

logger = logging.getLogger(__name__)

# Các loại nội dung yêu cầu hình ảnh tham khảo trước khi tạo video phân cảnh
IMAGE_REF_ASSET_TYPES = frozenset({"character", "scene", "prop", "material", "none"})


# Phân tích cú pháp thống nhất các giá trị Boolean trong các tham số dự án, tương thích với các phương pháp ghi chuỗi/số lịch sử
def _coerce_project_bool(value: Any, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "on"}:
            return True
        if normalized in {"0", "false", "no", "off", ""}:
            return False
    return bool(value)


# Đọc URL của khung hình cuối cùng của ảnh đã hoàn thành
def read_fragment_last_frame_url(fragment: DramaEpisodeFragment | None) -> str | None:
    if not fragment:
        return None
    params = fragment.params if isinstance(fragment.params, dict) else {}
    for key in ("lastFrameUrl", "last_frame_url"):
        value = params.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    gen = params.get("generation") if isinstance(params.get("generation"), dict) else {}
    for key in ("lastFrameUrl", "last_frame_url"):
        value = gen.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    versions = params.get("video_versions")
    if isinstance(versions, list):
        for row in versions:
            if not isinstance(row, dict):
                continue
            for key in ("lastFrameUrl", "last_frame_url"):
                value = row.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
    return None


# Viết URL của khung cuối cùng của bảng phân cảnh (lưu giữ sau khi quá trình tạo hoàn tất để cảnh tiếp theo kết nối)
def write_fragment_last_frame_url(fragment: DramaEpisodeFragment, url: str | None) -> None:
    params = dict(fragment.params or {}) if isinstance(fragment.params, dict) else {}
    cleaned = (url or "").strip()
    gen = dict(params.get("generation") or {}) if isinstance(params.get("generation"), dict) else {}
    if cleaned:
        params["lastFrameUrl"] = cleaned
        gen["lastFrameUrl"] = cleaned
        params["generation"] = gen
    else:
        params.pop("lastFrameUrl", None)
        params.pop("last_frame_url", None)
        gen.pop("lastFrameUrl", None)
        gen.pop("last_frame_url", None)
        if gen:
            params["generation"] = gen
        elif "generation" in params:
            params["generation"] = gen
    fragment.params = params


# Phim thành phẩm đã có rồi, khi thiếu khung hình cuối cùng thì sẽ được trích xuất ra khỏi video và viết lại (tương thích với các phim thành phẩm cũ của Kie)
async def ensure_fragment_last_frame_url(
    project: DramaProject,
    fragment: DramaEpisodeFragment | None,
) -> str | None:
    """Trả về URL khung cuối cùng có sẵn; trích xuất từ ​​​​các lát cục bộ/từ xa nếu cần thiết."""
    if not fragment:
        return None
    existing = read_fragment_last_frame_url(fragment)
    if existing:
        return existing
    video = (fragment.video or "").strip()
    if not video:
        return None

    from app.services import storage as storage_svc
    from app.services.ffmpeg_compose import extract_video_last_frame

    video_path = storage_svc.local_path_from_url(video)
    if video_path is None and not video.startswith("http"):
        candidate = Path(video)
        if candidate.exists():
            video_path = candidate
    if video_path is None or not video_path.exists():
        if video.startswith("http"):
            try:
                stamp = int(time.time())
                dest = (
                    storage_svc.project_dir(project.id)
                    / f"shot_{fragment.id}_{stamp}_ensure.mp4"
                )
                await storage_svc.download_to(video, dest)
                video_path = dest
            except Exception:  # noqa: BLE001
                logger.warning(
                    "ensure last frame: download failed fragment=%s",
                    getattr(fragment, "id", None),
                )
                return None
        else:
            return None
    if not video_path or not video_path.exists():
        return None

    frame_dest = (
        storage_svc.project_dir(project.id)
        / f"shot_{fragment.id}_{int(time.time())}_last.jpg"
    )
    if not extract_video_last_frame(video_path, frame_dest):
        return None
    rel = storage_svc.rel_static_url(frame_dest)
    url = storage_svc.republish_url(rel, sync=True) or rel
    write_fragment_last_frame_url(fragment, url)
    return url


# Viết thông số kỹ thuật đầu ra phân tách (cấu hình + pixel thực tế) để hiển thị giao diện người dùng và xác minh nối
def write_fragment_video_output_meta(
    fragment: DramaEpisodeFragment,
    *,
    aspect_ratio: str,
    resolution: str,
    video_path: Path | str | None = None,
) -> None:
    from app.services import storage as storage_svc
    from app.services.ffmpeg_compose import probe_video_dimensions

    params = dict(fragment.params or {}) if isinstance(fragment.params, dict) else {}
    width = 0
    height = 0
    path = video_path if isinstance(video_path, Path) else None
    if path is None and isinstance(video_path, str) and video_path.strip():
        path = storage_svc.local_path_from_url(video_path.strip())
        if path is None and not video_path.strip().startswith("http"):
            candidate = Path(video_path.strip())
            if candidate.exists():
                path = candidate
    if path and path.exists():
        dims = probe_video_dimensions(path)
        if dims:
            width, height = dims
    ratio_label = (
        infer_aspect_ratio_from_pixels(width, height)
        if width > 0 and height > 0
        else aspect_ratio
    )
    params["aspect_ratio"] = ratio_label
    params["resolution"] = resolution
    if width > 0 and height > 0:
        params["video_width"] = width
        params["video_height"] = height
    gen = dict(params.get("generation") or {}) if isinstance(params.get("generation"), dict) else {}
    gen["aspect_ratio"] = ratio_label
    gen["resolution"] = resolution
    if width > 0 and height > 0:
        gen["video_width"] = width
        gen["video_height"] = height
    params["generation"] = gen
    fragment.params = params


# Liệu dự án có bật kết nối "khung hình cuối cùng của ảnh chụp trước → khung hình đầu tiên của ảnh chụp này" hay không (được bật theo mặc định)
def project_link_last_frame_enabled(project: DramaProject) -> bool:
    params = project.params if isinstance(project.params, dict) else {}
    raw = params.get("linkLastFrame")
    if raw is None:
        raw = params.get("link_last_frame")
    return _coerce_project_bool(raw, True)


# Tìm cảnh trước đó có thứ tự sắp xếp nhỏ hơn trong cùng một tập
async def find_previous_episode_fragment(
    db: AsyncSession,
    fragment: DramaEpisodeFragment,
) -> DramaEpisodeFragment | None:
    result = await db.execute(
        select(DramaEpisodeFragment)
        .where(
            DramaEpisodeFragment.episode_id == fragment.episode_id,
            DramaEpisodeFragment.sort_order < int(fragment.sort_order or 0),
        )
        .order_by(DramaEpisodeFragment.sort_order.desc())
        .limit(1)
    )
    return result.scalars().first()


def fragment_generation_status(fragment: DramaEpisodeFragment) -> dict[str, Any]:
    """Đọc trạng thái tạo clip bảng phân cảnh (hoàn thành/đang chạy/đang xếp hàng/không thành công/không hoạt động).

    重新生成时旧 video 仍在，优先信任 params.generation 的进行中状态。
    失败时若表面是「重试超限」，优先露出 root_error（如参考图审核）。
    """
    params = fragment.params or {}
    gen = params.get("generation") if isinstance(params, dict) else None
    if isinstance(gen, dict):
        status = str(gen.get("status") or "").strip().lower()
        if status in {"queued", "running", "generating", "failed", "cancelled"}:
            out = dict(gen)
            if status == "failed":
                err = str(out.get("error") or "")
                root = str(out.get("root_error") or "").strip()
                if root and ("重试超过" in err or "超过重试" in err or not err):
                    out["error"] = root
            return out
        if status == "done":
            out = dict(gen)
            if fragment.video and not out.get("video"):
                out["video"] = fragment.video
            if fragment.cover and not out.get("cover"):
                out["cover"] = fragment.cover
            return out
    if fragment.video:
        return {"status": "done", "video": fragment.video, "cover": fragment.cover}
    return {"status": "idle"}


# Đây có phải là câu đóng gói cho "thử lại vượt quá giới hạn" (không bao gồm nguyên nhân thực sự)
def _is_retry_limit_error(text: str) -> bool:
    t = (text or "").strip()
    return bool(t) and (
        "重试超过" in t
        or "超过重试" in t
        or "内部自动重试超过" in t
    )


# Tạo trạng thái lỗi hội: giữ lại root_error để tránh bị ghi đè do lỗi thử lại
def build_failed_generation_params(
    prev_gen: dict[str, Any] | None,
    error: str,
    *,
    attempts: int | None = None,
    attempt_limit: int | None = None,
) -> dict[str, Any]:
    msg = str(error or "生成失败")[:500]
    prev = prev_gen if isinstance(prev_gen, dict) else {}
    prev_root = str(prev.get("root_error") or "").strip()
    prev_err = str(prev.get("error") or "").strip()
    kept_root = ""
    if prev_root and not _is_retry_limit_error(prev_root):
        kept_root = prev_root[:500]
    elif prev_err and not _is_retry_limit_error(prev_err):
        kept_root = prev_err[:500]

    root = kept_root
    if not _is_retry_limit_error(msg):
        root = msg
    elif not root:
        root = msg

    display = msg
    if _is_retry_limit_error(msg) and root and not _is_retry_limit_error(root):
        # Nếu "giới hạn trên: root" đã được đánh vần, nó sẽ không được ghép lại (_fail_task sẽ được chạy lại)
        root_snip = root[:400]
        if msg.rstrip().endswith(root_snip) or f"：{root[:80]}" in msg:
            display = msg
        else:
            display = f"{msg}：{root_snip}"

    out: dict[str, Any] = {
        "status": "failed",
        "error": display[:500],
        "root_error": root[:500],
    }
    # số lần thử / try_limit: các tham số đầu vào rõ ràng được ưu tiên, nếu không thì giữ lại prev
    if attempts is not None:
        out["attempts"] = attempts
    elif prev.get("attempts") is not None:
        try:
            out["attempts"] = int(prev.get("attempts"))
        except (TypeError, ValueError):
            pass
    if attempt_limit is not None:
        out["attempt_limit"] = attempt_limit
    elif prev.get("attempt_limit") is not None:
        try:
            out["attempt_limit"] = int(prev.get("attempt_limit"))
        except (TypeError, ValueError):
            pass
    return out


# Giới hạn phiên bản video bảng phân cảnh (lịch sử đã lưu trữ, ngoại trừ "hiện tại")
FRAGMENT_VIDEO_VERSION_LIMIT = 8


def _snapshot_version_media_url(url: str, *, label: str) -> str:
    """Sao chép phương tiện hiện tại dưới dạng tệp lịch sử độc lập để tránh ghi đè lên cùng một đường dẫn vào lần sau và khiến phiên bản trở nên không hợp lệ.

    优先本地拷贝；本地缺失但为 http(s) 时尝试同步下载到 `_hist_` 文件再发布。
    """
    from shutil import copy2
    from urllib.parse import urlparse

    from app.services import storage as storage_svc
    from app.services.storage import STATIC_ROOT

    raw = (url or "").strip()
    if not raw:
        return ""
    path = storage_svc.local_path_from_url(raw)
    stem = ""
    suffix = ".png"
    if path is not None:
        stem = path.stem
        suffix = path.suffix or ".png"
        # Nó đã là một tệp độc lập có hậu tố dấu thời gian/lịch sử, không cần sao chép lại
        if path.exists() and path.is_file() and ("_hist_" in stem or re.search(r"_\d{10,}$", stem)):
            published = storage_svc.republish_url(storage_svc.rel_static_url(path), sync=True)
            return published or storage_svc.rel_static_url(path)
        if path.exists() and path.is_file():
            dest = path.with_name(f"{stem}_hist_{label}{suffix}")
            if not dest.exists():
                copy2(path, dest)
            rel = storage_svc.rel_static_url(dest)
            return storage_svc.republish_url(rel, sync=True) or rel
        # Bản đồ tới đường dẫn cục bộ nhưng tệp không có ở đó: nó rơi vào cùng tên lịch sử thư mục, hãy thử tải xuống bên dưới
        dest = path.with_name(f"{(stem or 'asset')}_hist_{label}{suffix}")
    else:
        parsed = urlparse(raw)
        name = Path(parsed.path or "").name or "asset.bin"
        stem = Path(name).stem or "asset"
        suffix = Path(name).suffix or ".png"
        dest = STATIC_ROOT / "generated" / "_hist" / f"{stem}_hist_{label}{suffix}"

    if raw.startswith("http://") or raw.startswith("https://"):
        try:
            import httpx

            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                    resp = client.get(raw)
                    resp.raise_for_status()
                    dest.write_bytes(resp.content)
            if dest.exists() and dest.is_file():
                rel = storage_svc.rel_static_url(dest)
                return storage_svc.republish_url(rel, sync=True) or rel
        except Exception:  # noqa: BLE001
            logger.warning("历史版本拉取远端失败，回退原 URL url=%s", raw[:120], exc_info=True)
    return raw


# Lưu trữ video hiện tại vào params.video_versions (được gọi trước khi ghi đè)
def archive_fragment_video_version(fragment: DramaEpisodeFragment) -> dict[str, Any] | None:
    video = (fragment.video or "").strip()
    if not video:
        return None
    import uuid
    from datetime import datetime, timezone

    params = dict(fragment.params or {}) if isinstance(fragment.params, dict) else {}
    last_frame = ""
    for key in ("lastFrameUrl", "last_frame_url"):
        raw = params.get(key)
        if isinstance(raw, str) and raw.strip():
            last_frame = raw.strip()
            break
    stamp = f"{int(datetime.now(timezone.utc).timestamp())}_{uuid.uuid4().hex[:8]}"
    archived_video = _snapshot_version_media_url(video, label=stamp)
    archived_cover = _snapshot_version_media_url(
        (fragment.cover or "").strip(),
        label=f"{stamp}_cover",
    )
    archived_last = (
        _snapshot_version_media_url(last_frame, label=f"{stamp}_last") if last_frame else None
    )
    entry = {
        "id": f"v_{stamp}_{fragment.id}",
        "video": archived_video,
        "cover": archived_cover or (fragment.cover or "").strip(),
        "lastFrameUrl": archived_last or last_frame or None,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "source": "generate",
    }
    versions = params.get("video_versions")
    if not isinstance(versions, list):
        versions = []
    # Giữ lại toàn bộ lịch sử; không còn xóa các bản sao theo URL (shot_xxx.mp4 đã sửa lỗi sẽ bị ghi đè và các phiên bản có cùng URL sẽ bị xóa do nhầm lẫn)
    cleaned: list[dict[str, Any]] = [v for v in versions if isinstance(v, dict)]
    cleaned.insert(0, entry)
    params["video_versions"] = cleaned[:FRAGMENT_VIDEO_VERSION_LIMIT]
    fragment.params = params
    return entry


# Chuyển phiên bản lịch sử sang phim hiện tại và đẩy phim gốc và phim hiện tại vào danh sách phiên bản
def activate_fragment_video_version(
    fragment: DramaEpisodeFragment,
    version_id: str,
) -> dict[str, Any]:
    params = dict(fragment.params or {}) if isinstance(fragment.params, dict) else {}
    versions_raw = params.get("video_versions")
    if not isinstance(versions_raw, list):
        raise ValueError("Không có phiên bản lịch sử để chuyển đổi")
    target: dict[str, Any] | None = None
    remaining: list[dict[str, Any]] = []
    for item in versions_raw:
        if not isinstance(item, dict):
            continue
        if str(item.get("id") or "") == version_id and target is None:
            target = dict(item)
            continue
        remaining.append(dict(item))
    if not target or not str(target.get("video") or "").strip():
        raise ValueError("Phiên bản chỉ định không tồn tại")

    from datetime import datetime, timezone

    current_video = (fragment.video or "").strip()
    target_video = str(target.get("video") or "").strip()
    if current_video and current_video != target_video:
        last_frame = ""
        for key in ("lastFrameUrl", "last_frame_url"):
            raw = params.get(key)
            if isinstance(raw, str) and raw.strip():
                last_frame = raw.strip()
                break
        stamp = f"{int(datetime.now(timezone.utc).timestamp())}_{fragment.id}"
        remaining.insert(
            0,
            {
                "id": f"v_{stamp}_replaced",
                "video": _snapshot_version_media_url(current_video, label=f"{stamp}_cur"),
                "cover": _snapshot_version_media_url(
                    (fragment.cover or "").strip(),
                    label=f"{stamp}_cur_cover",
                )
                or (fragment.cover or "").strip(),
                "lastFrameUrl": (
                    _snapshot_version_media_url(last_frame, label=f"{stamp}_cur_last")
                    if last_frame
                    else None
                ),
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "source": "replaced",
            },
        )

    fragment.video = target_video[:1024]
    fragment.cover = str(target.get("cover") or "")[:1024]
    last_frame = str(target.get("lastFrameUrl") or "").strip() or None
    write_fragment_last_frame_url(fragment, last_frame)
    from app.services import storage as storage_svc

    params = dict(fragment.params or {})
    params["video_versions"] = remaining[:FRAGMENT_VIDEO_VERSION_LIMIT]
    fragment.params = params
    ratio = str(target.get("aspect_ratio") or params.get("aspect_ratio") or "9:16")
    resolution = str(target.get("resolution") or params.get("resolution") or "480p")
    video_path = storage_svc.local_path_from_url(target_video)
    write_fragment_video_output_meta(
        fragment,
        aspect_ratio=ratio,
        resolution=resolution,
        video_path=video_path or target_video,
    )
    params = dict(fragment.params or {})
    gen = dict(params.get("generation") or {}) if isinstance(params.get("generation"), dict) else {}
    gen.update({
        "status": "done",
        "video": fragment.video,
        "cover": fragment.cover,
        "lastFrameUrl": last_frame,
        "restoredFrom": version_id,
    })
    params["generation"] = gen
    params["video_versions"] = remaining[:FRAGMENT_VIDEO_VERSION_LIMIT]
    fragment.params = params
    return {
        "fragment_id": fragment.id,
        "video": fragment.video,
        "cover": fragment.cover,
        "lastFrameUrl": last_frame,
        "video_versions": params["video_versions"],
    }


# Giới hạn trên của phiên bản ánh xạ nội dung (lịch sử lưu trữ, không bao gồm hiện tại)
ASSET_IMAGE_VERSION_LIMIT = 8


def read_asset_image_versions(asset: DramaAsset) -> list[dict[str, Any]]:
    params = dict(asset.params or {}) if isinstance(asset.params, dict) else {}
    raw = params.get("image_versions")
    if not isinstance(raw, list):
        return []
    return [dict(v) for v in raw if isinstance(v, dict) and str(v.get("url") or v.get("cover") or "").strip()]


# Lưu trữ hình ảnh hiện tại vào params.image_versions (được gọi trước khi ghi đè)
def archive_asset_image_version(
    asset: DramaAsset,
    *,
    source: str = "generate",
) -> dict[str, Any] | None:
    current = (asset.cover or asset.url or "").strip()
    if not current:
        return None
    import uuid
    from datetime import datetime, timezone

    params = dict(asset.params or {}) if isinstance(asset.params, dict) else {}
    stamp = f"{int(datetime.now(timezone.utc).timestamp())}_{uuid.uuid4().hex[:8]}"
    archived_url = _snapshot_version_media_url(current, label=stamp)
    prompt = ""
    for key in ("visualPrompt", "visualImage", "prompt"):
        raw = params.get(key)
        if isinstance(raw, str) and raw.strip():
            prompt = raw.strip()
            break
    entry = {
        "id": f"img_{stamp}_{asset.id}",
        "url": archived_url or current,
        "cover": archived_url or current,
        "prompt": prompt[:2000] if prompt else None,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "source": source,
    }
    versions = params.get("image_versions")
    if not isinstance(versions, list):
        versions = []
    cleaned: list[dict[str, Any]] = [v for v in versions if isinstance(v, dict)]
    cleaned.insert(0, entry)
    params["image_versions"] = cleaned[:ASSET_IMAGE_VERSION_LIMIT]
    asset.params = params
    return entry


# Chuyển hình ảnh lịch sử sang hình ảnh hiện tại và đẩy hình ảnh gốc và hình ảnh hiện tại vào danh sách phiên bản
def activate_asset_image_version(
    asset: DramaAsset,
    version_id: str,
) -> dict[str, Any]:
    params = dict(asset.params or {}) if isinstance(asset.params, dict) else {}
    versions_raw = params.get("image_versions")
    if not isinstance(versions_raw, list):
        raise ValueError("Không có phiên bản lịch sử để chuyển đổi")
    target: dict[str, Any] | None = None
    remaining: list[dict[str, Any]] = []
    for item in versions_raw:
        if not isinstance(item, dict):
            continue
        if str(item.get("id") or "") == version_id and target is None:
            target = dict(item)
            continue
        remaining.append(dict(item))
    target_url = str((target or {}).get("url") or (target or {}).get("cover") or "").strip()
    if not target or not target_url:
        raise ValueError("Phiên bản chỉ định không tồn tại")

    from datetime import datetime, timezone

    current = (asset.cover or asset.url or "").strip()
    if current and current != target_url:
        stamp = f"{int(datetime.now(timezone.utc).timestamp())}_{asset.id}"
        prompt = ""
        for key in ("visualPrompt", "visualImage", "prompt"):
            raw = params.get(key)
            if isinstance(raw, str) and raw.strip():
                prompt = raw.strip()
                break
        snap = _snapshot_version_media_url(current, label=f"{stamp}_cur") or current
        remaining.insert(
            0,
            {
                "id": f"img_{stamp}_replaced",
                "url": snap,
                "cover": snap,
                "prompt": prompt[:2000] if prompt else None,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "source": "replaced",
            },
        )

    asset.cover = target_url[:1024]
    asset.url = target_url[:1024]
    params = dict(asset.params or {}) if isinstance(asset.params, dict) else {}
    gen = dict(params.get("generation") or {}) if isinstance(params.get("generation"), dict) else {}
    gen.update({
        "status": "done",
        "source": "restored",
        "restoredFrom": version_id,
        "finished_at": datetime.now(timezone.utc).isoformat(),
    })
    params["generation"] = gen
    params["image_versions"] = remaining[:ASSET_IMAGE_VERSION_LIMIT]
    # Từ nhắc không bị buộc phải viết lại khi khôi phục; nếu mục nhập lịch sử có lời nhắc và hiện đang trống thì nó sẽ được lấp đầy.
    hist_prompt = str(target.get("prompt") or "").strip()
    if hist_prompt and not str(params.get("visualPrompt") or "").strip():
        params["visualPrompt"] = hist_prompt
    asset.params = params
    return {
        "asset_id": asset.id,
        "url": asset.url,
        "cover": asset.cover,
        "image_versions": params["image_versions"],
    }


# Sau khi tham gia hàng đợi và danh sách nhiệm vụ vẫn chưa hiển thị, hãy tiếp tục xếp hàng để tránh bị xóa thành trẻ mồ côi.
_ORPHAN_QUEUE_GRACE_SEC = 60


# Xác định xem thế hệ.queued_at có còn trong thời gian gia hạn hay không
def generation_queued_recently(gen: dict[str, Any] | None, *, now: datetime | None = None) -> bool:
    if not isinstance(gen, dict):
        return False
    raw = str(gen.get("queued_at") or "").strip()
    if not raw:
        return False
    try:
        ts = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return False
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=UTC)
    current = now or datetime.now(UTC)
    return (current - ts).total_seconds() < _ORPHAN_QUEUE_GRACE_SEC


# Khi không có tác vụ nền tảng tương ứng, hãy khôi phục bảng phân cảnh đã xếp hàng/đang chạy về chế độ chờ để tránh xếp hàng sai.
async def reconcile_orphaned_fragment_generations(
    db: AsyncSession,
    fragments: list[DramaEpisodeFragment],
    active_fragment_ids: set[int],
) -> int:
    changed = 0
    for fragment in fragments:
        status = str(fragment_generation_status(fragment).get("status") or "")
        if status not in {"queued", "running", "generating"}:
            continue
        if fragment.id in active_fragment_ids:
            continue
        params = dict(fragment.params or {})
        gen = params.get("generation") if isinstance(params.get("generation"), dict) else None
        if generation_queued_recently(gen if isinstance(gen, dict) else None):
            continue
        params.pop("generation_attempts", None)
        params["generation"] = {
            "status": "idle",
            "message": "任务已中断，请重新生成",
        }
        fragment.params = params
        changed += 1
    if changed:
        await db.commit()
        logger.info("已修复孤儿分镜生成状态 count=%s", changed)
    return changed


def collect_active_fragment_ids_from_tasks(tasks) -> set[int]:
    active_ids: set[int] = set()
    for task in tasks:
        if task.task_type != "fragment_video":
            continue
        payload = task.payload if isinstance(task.payload, dict) else {}
        raw_ids = payload.get("fragment_ids") or []
        if isinstance(raw_ids, list):
            for item in raw_ids:
                try:
                    active_ids.add(int(item))
                except (TypeError, ValueError):
                    continue
        if task.fragment_id:
            active_ids.add(int(task.fragment_id))
    return active_ids


# Trạng thái tác vụ nền tảng đang diễn ra (được sử dụng để bao gồm các thông số trong bảng phân cảnh bị trì hoãn)
_ACTIVE_FRAGMENT_VIDEO_TASK_STATUSES = frozenset(
    {"pending", "leased", "running", "awaiting_poll", "awaiting_review"}
)


def overlay_fragment_status_with_active_task(
    status: dict[str, Any],
    task_status: str | None,
) -> dict[str, Any]:
    """Các thông số của bảng phân cảnh vẫn được đánh dấu ở hàng đợi, nhưng khi tác vụ đã được gửi lên thượng nguồn, nó sẽ hiển thị là đang được tạo."""
    raw_task = (task_status or "").strip().lower()
    if raw_task not in _ACTIVE_FRAGMENT_VIDEO_TASK_STATUSES:
        return status
    frag_st = str(status.get("status") or "").strip().lower()
    if frag_st in {"done", "failed", "cancelled"}:
        return status
    out = dict(status)
    if raw_task in {"pending", "leased"}:
        out["status"] = "queued"
        out.setdefault("message", "排队中")
        return out
    out["status"] = "running"
    if raw_task == "awaiting_poll":
        out["phase"] = out.get("phase") or "polling"
        out["message"] = out.get("message") or "上游生成中"
    elif raw_task == "awaiting_review":
        out["phase"] = out.get("phase") or "review"
        out["message"] = out.get("message") or "待确认"
    else:
        out.setdefault("message", "生成中")
    return out


# Trích xuất @asset:id từ văn bản bảng phân cảnh
def extract_asset_ids_from_content(content: str) -> list[int]:
    ids: list[int] = []
    seen: set[int] = set()
    for match in ASSET_MENTION_TOKEN_PATTERN.finditer(content or ""):
        asset_id = int(match.group(1))
        if asset_id in seen:
            continue
        seen.add(asset_id)
        ids.append(asset_id)
    return ids


# Hình ảnh tham chiếu Seedance / TokenFree chỉ chấp nhận các bitmap phổ biến; Hình ảnh giữ chỗ SVG sẽ bị từ chối bởi thượng nguồn
_REF_IMAGE_SUFFIXES = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")


def _is_bitmap_image_url(url: str | None) -> bool:
    path = (url or "").strip().split("?", 1)[0].lower()
    if not path:
        return False
    return any(path.endswith(suffix) for suffix in _REF_IMAGE_SUFFIXES)


# Xác định xem nội dung có thiếu hình ảnh tham chiếu hay không (trình giữ chỗ SVG/không phải bitmap được coi là vẫn bị thiếu để tránh việc gửi video bị thượng nguồn từ chối)
def asset_needs_reference_image(asset: DramaAsset) -> bool:
    kind = (asset.type or "").strip().lower()
    if kind not in IMAGE_REF_ASSET_TYPES:
        return False
    cover = (asset.cover or "").strip()
    url = (asset.url or "").strip()
    candidate = cover or url
    if not candidate:
        return True
    return not _is_bitmap_image_url(candidate)


# Đọc từ nhắc bản vẽ tài sản (mặc định là sử dụng tên để cung cấp chi tiết)
def read_asset_visual_prompt(asset: DramaAsset) -> str:
    params = asset.params if isinstance(asset.params, dict) else {}
    stored = str(
        params.get("visualPrompt")
        or params.get("visualImage")
        or ""
    ).strip()
    if stored:
        return stored
    name = (asset.name or "").strip() or f"资产{asset.id}"
    kind = (asset.type or "character").strip()
    return f"{kind} {name}"


async def _set_fragment_generation(
    db: AsyncSession,
    fragment: DramaEpisodeFragment,
    payload: dict[str, Any],
) -> None:
    # Viết trạng thái tạo bảng phân cảnh cho việc bỏ phiếu phía trước
    params = dict(fragment.params or {})
    params["generation"] = payload
    fragment.params = params
    await db.commit()


async def ensure_fragment_reference_images(
    db: AsyncSession,
    user: User,
    project: DramaProject,
    fragment: DramaEpisodeFragment,
    *,
    ref_assets: list[DramaAsset] | None = None,
) -> list[DramaAsset]:
    """
    分镜视频生成前：收集引用资产，对缺图的角色/场景/道具动态 Seedream 生图。
    返回刷新后的参考资产列表（含正文 @asset 与引用表）。
    """
    # bảng tham chiếu thu thập_ids + văn bản @asset
    collected_ids: list[int] = []
    seen: set[int] = set()

    refs = (
        await db.execute(
            select(DramaFragmentAssetRef)
            .where(DramaFragmentAssetRef.fragment_id == fragment.id)
            .order_by(DramaFragmentAssetRef.id.asc())
        )
    ).scalars().all()
    for ref in refs:
        if ref.asset_id in seen:
            continue
        seen.add(ref.asset_id)
        collected_ids.append(ref.asset_id)

    for asset_id in extract_asset_ids_from_content(fragment.content or ""):
        if asset_id in seen:
            continue
        seen.add(asset_id)
        collected_ids.append(asset_id)

    assets_by_id: dict[int, DramaAsset] = {}
    if ref_assets:
        for asset in ref_assets:
            assets_by_id[asset.id] = asset

    for asset_id in collected_ids:
        if asset_id in assets_by_id:
            continue
        asset = await db.get(DramaAsset, asset_id)
        if asset and asset.project_id == project.id:
            assets_by_id[asset_id] = asset

    collected_ids = cap_fragment_asset_ids(
        collected_ids,
        [assets_by_id[i] for i in collected_ids if i in assets_by_id],
    )
    ordered = [assets_by_id[i] for i in collected_ids if i in assets_by_id]
    missing = [a for a in ordered if asset_needs_reference_image(a)]
    if not missing:
        return ordered

    logger.info(
        "分镜缺图资产动态生成 fragment_id=%s count=%s ids=%s",
        fragment.id,
        len(missing),
        [a.id for a in missing],
    )
    await _set_fragment_generation(
        db,
        fragment,
        {
            "status": "running",
            "phase": "assets",
            "message": f"正在生成参考图 0/{len(missing)}",
            "assets_total": len(missing),
            "assets_done": 0,
        },
    )

    # Hoàn thành các mối quan hệ được đề cập trong văn bản nhưng không có trong bảng tham chiếu
    existing_ref_ids = {ref.asset_id for ref in refs}
    for asset in ordered:
        if asset.id in existing_ref_ids:
            continue
        if (asset.type or "").lower() not in IMAGE_REF_ASSET_TYPES:
            continue
        db.add(DramaFragmentAssetRef(fragment_id=fragment.id, asset_id=asset.id))
        existing_ref_ids.add(asset.id)
    await db.flush()

    for index, asset in enumerate(missing):
        try:
            prompt = await resolve_visual_prompt_for_asset(asset, project, db=db)
        except Exception:  # noqa: BLE001
            prompt = read_asset_visual_prompt(asset)
        if not (prompt or "").strip():
            prompt = read_asset_visual_prompt(asset)
        await _set_fragment_generation(
            db,
            fragment,
            {
                "status": "running",
                "phase": "assets",
                "message": f"正在生成参考图 {index + 1}/{len(missing)}：{asset.name or asset.id}",
                "assets_total": len(missing),
                "assets_done": index,
                "asset_id": asset.id,
            },
        )
        updated = await generate_asset_image(
            db,
            user,
            project,
            prompt,
            asset=asset,
            name=asset.name,
            kind=(asset.type or "character"),
            image_style_id=str((project.params or {}).get("image_style_id") or "") or None,
        )
        assets_by_id[updated.id] = updated
        logger.info(
            "分镜参考图已补齐 fragment_id=%s asset_id=%s url=%s",
            fragment.id,
            updated.id,
            (updated.cover or updated.url or "")[:80],
        )

    await _set_fragment_generation(
        db,
        fragment,
        {
            "status": "running",
            "phase": "video",
            "message": "参考图已就绪，开始生成视频",
            "assets_total": len(missing),
            "assets_done": len(missing),
        },
    )
    return [assets_by_id[i] for i in collected_ids if i in assets_by_id]


async def ensure_reference_assets_public_urls(
    db: AsyncSession,
    assets: list[DramaAsset],
) -> list[DramaAsset]:
    """Tải đồng bộ bìa/url cục bộ của nội dung được tham chiếu lên OSS để Seedance lấy từ mạng công cộng."""
    from app.services import storage as storage_svc

    source_asset_cache: dict[int, DramaAsset | None] = {}

    # URL công khai của nội dung giọng nói nguồn sẽ được sử dụng lại trước tiên cho giọng nói của nhân vật; nếu nó bị thiếu, hãy thử tải tệp cục bộ lên.
    async def _resolve_public_voice_url(asset: DramaAsset, params: dict[str, Any]) -> str | None:
        voice_url = read_asset_voice_audio_url(params)
        if not voice_url:
            return None

        binding = params.get("voiceAudio")
        if not isinstance(binding, dict):
            canvas = params.get("canvas")
            if isinstance(canvas, dict):
                maybe_binding = canvas.get("voiceAudio")
                if isinstance(maybe_binding, dict):
                    binding = maybe_binding
        source_id = binding.get("sourceAssetId") if isinstance(binding, dict) else None
        if isinstance(source_id, int):
            source_asset = source_asset_cache.get(source_id)
            if source_id not in source_asset_cache:
                source_asset = await db.get(DramaAsset, source_id)
                source_asset_cache[source_id] = source_asset
            if source_asset and source_asset.project_id == asset.project_id:
                source_url = (source_asset.url or "").strip()
                if source_url:
                    local_source = storage_svc.local_path_from_url(source_url)
                    if local_source:
                        try:
                            await storage_svc.ensure_local_media(source_url, local_source)
                            published = storage_svc.republish_url(source_url, sync=True)
                            if published and str(published).startswith("https://"):
                                return str(published)
                        except Exception:  # noqa: BLE001
                            logger.exception(
                                "restore voice reference local file failed source_asset_id=%s",
                                source_asset.id,
                            )
                    elif source_url.startswith("https://") and "oss" in source_url:
                        return source_url

        published_voice = storage_svc.republish_url(voice_url, sync=True)
        if published_voice and str(published_voice).startswith("https://"):
            return str(published_voice)
        return None

    changed = False
    for asset in assets:
        for field in ("cover", "url"):
            raw = (getattr(asset, field) or "").strip()
            if not raw:
                continue
            if raw.startswith("https://"):
                continue
            published = storage_svc.republish_url(raw, sync=True)
            if published and published != raw and str(published).startswith("https://"):
                setattr(asset, field, published)
                changed = True
                logger.info(
                    "资产参考图已同步 OSS asset_id=%s field=%s",
                    asset.id,
                    field,
                )
        # Giọng nói của nhân vật yêu cầu URL công khai; nếu liên kết lịch sử vẫn ở dạng/tĩnh, hãy thay đổi nó thành HTTPS trỏ đến nội dung giọng nói nguồn.
        params = dict(asset.params or {}) if isinstance(asset.params, dict) else {}
        current_voice_url = read_asset_voice_audio_url(params)
        public_voice_url = await _resolve_public_voice_url(asset, params)
        if public_voice_url and public_voice_url != current_voice_url:
            binding = params.get("voiceAudio")
            if isinstance(binding, dict):
                params["voiceAudio"] = {**binding, "url": public_voice_url}
            canvas = params.get("canvas")
            if isinstance(canvas, dict):
                voice_binding = canvas.get("voiceAudio")
                if isinstance(voice_binding, dict):
                    params["canvas"] = {
                        **canvas,
                        "voiceAudio": {**voice_binding, "url": public_voice_url},
                    }
            asset.params = params
            changed = True
    if changed:
        await db.commit()
        for asset in assets:
            await db.refresh(asset)
    return assets


def _character_voice_binding(params: dict[str, Any]) -> dict[str, Any] | None:
    binding = params.get("voiceAudio")
    if isinstance(binding, dict):
        return binding
    canvas = params.get("canvas")
    if isinstance(canvas, dict):
        nested = canvas.get("voiceAudio")
        if isinstance(nested, dict):
            return nested
    return None


# Trước khi gửi video storyboard: Âm thanh tham chiếu quá ngắn sẽ được tự động tổng hợp lại (Seedance ≥1.8s)
async def ensure_fragment_reference_audios(
    db: AsyncSession,
    user: User,
    project: DramaProject,
    fragment: DramaEpisodeFragment,
    ref_assets: list[DramaAsset],
) -> list[DramaAsset]:
    from app.services import storage as storage_svc

    work_dir = storage_svc.project_dir(project.id) / "voice_probe"
    work_dir.mkdir(parents=True, exist_ok=True)
    assets_by_id = {a.id: a for a in ref_assets}
    regenerated = 0

    async def _regen_voice_asset(
        voice_asset: DramaAsset,
        *,
        character: DramaAsset | None,
        voice_prompt: str,
        speaker: str | None,
    ) -> DramaAsset:
        sample = build_voice_sample_text(
            voice_prompt,
            character.name if character else voice_asset.name,
            short=False,
        )
        return await synthesize_voice_asset(
            db,
            user,
            project,
            voice_asset,
            voice_prompt=voice_prompt,
            sample_text=sample,
            speaker=speaker,
            character_name=character.name if character else None,
            character_asset=character,
        )

    for asset in list(ref_assets):
        if (asset.type or "").strip().lower() != "character":
            continue
        params = dict(asset.params or {}) if isinstance(asset.params, dict) else {}
        url = read_asset_voice_audio_url(params)
        if not url:
            continue
        duration = await probe_voice_url_duration(url, work_dir=work_dir)
        if not is_voice_duration_too_short(duration):
            continue

        binding = _character_voice_binding(params) or {}
        source_id = binding.get("sourceAssetId")
        voice_asset: DramaAsset | None = None
        if isinstance(source_id, int) and source_id > 0:
            voice_asset = await db.get(DramaAsset, source_id)
            if voice_asset and voice_asset.project_id != project.id:
                voice_asset = None
        if voice_asset is None and (asset.type or "") == "voice":
            voice_asset = asset

        voice_params = (
            dict(voice_asset.params or {})
            if voice_asset and isinstance(voice_asset.params, dict)
            else {}
        )
        prompt = str(
            voice_params.get("voicePrompt")
            or binding.get("voicePrompt")
            or params.get("voicePrompt")
            or ""
        ).strip()
        if not prompt:
            prompt = fallback_voice_prompt(asset)
        speaker = str(
            voice_params.get("speaker")
            or voice_params.get("designedSpeakerId")
            or binding.get("speaker")
            or ""
        ).strip() or None

        logger.info(
            "参考音频过短，重新合成 fragment_id=%s character_id=%s duration=%s",
            fragment.id,
            asset.id,
            duration,
        )
        try:
            if voice_asset is None:
                # Không có nội dung giọng nói độc lập: bổ sung các tệp cục bộ tại chỗ và ghi lại ràng buộc
                local = storage_svc.local_path_from_url(url)
                if local is None:
                    dest = work_dir / f"char_{asset.id}_voice.mp3"
                    local = await storage_svc.ensure_local_media(url, dest)
                padded = finalize_voice_reference_url(
                    storage_svc.rel_static_url(local) if local else url,
                    project_id=project.id,
                    asset_id=asset.id,
                )
                asset.params = patch_params_voice_url(params, padded)
                regenerated += 1
                continue

            updated_voice = await _regen_voice_asset(
                voice_asset,
                character=asset,
                voice_prompt=prompt,
                speaker=speaker,
            )
            new_url = (updated_voice.url or "").strip()
            if new_url:
                asset.params = patch_params_voice_url(params, new_url)
                assets_by_id[asset.id] = asset
                regenerated += 1
        except Exception:  # noqa: BLE001
            logger.exception(
                "参考音频重生成失败 fragment_id=%s character_id=%s",
                fragment.id,
                asset.id,
            )

    # Âm thanh tường thuật dự án
    proj_params = dict(project.params or {}) if isinstance(project.params, dict) else {}
    narrator = proj_params.get("narrationVoiceAudio")
    if isinstance(narrator, dict):
        narr_url = str(narrator.get("url") or narrator.get("previewUrl") or "").strip()
        if narr_url:
            duration = await probe_voice_url_duration(narr_url, work_dir=work_dir)
            if is_voice_duration_too_short(duration):
                source_id = narrator.get("sourceAssetId")
                voice_asset = None
                if isinstance(source_id, int) and source_id > 0:
                    voice_asset = await db.get(DramaAsset, source_id)
                try:
                    if voice_asset and voice_asset.project_id == project.id:
                        voice_params = (
                            dict(voice_asset.params or {})
                            if isinstance(voice_asset.params, dict)
                            else {}
                        )
                        prompt = str(voice_params.get("voicePrompt") or "").strip() or "Lời dẫn điềm tĩnh, phát âm rõ ràng"
                        speaker = str(
                            voice_params.get("speaker")
                            or voice_params.get("designedSpeakerId")
                            or ""
                        ).strip() or None
                        updated_voice = await _regen_voice_asset(
                            voice_asset,
                            character=None,
                            voice_prompt=prompt,
                            speaker=speaker,
                        )
                        new_url = (updated_voice.url or "").strip()
                        if new_url:
                            proj_params["narrationVoiceAudio"] = {
                                **narrator,
                                "url": new_url,
                            }
                            project.params = proj_params
                            regenerated += 1
                    else:
                        padded = finalize_voice_reference_url(
                            narr_url,
                            project_id=project.id,
                            asset_id=int(source_id) if isinstance(source_id, int) else project.id,
                        )
                        if padded != narr_url:
                            proj_params["narrationVoiceAudio"] = {
                                **narrator,
                                "url": padded,
                            }
                            project.params = proj_params
                            regenerated += 1
                except Exception:  # noqa: BLE001
                    logger.exception(
                        "旁白参考音频重生成失败 project_id=%s fragment_id=%s",
                        project.id,
                        fragment.id,
                    )

    if regenerated:
        await db.commit()
        for asset in ref_assets:
            await db.refresh(asset)
        await db.refresh(project)
        logger.info(
            "已修复过短参考音频 fragment_id=%s count=%s",
            fragment.id,
            regenerated,
        )
    return [assets_by_id.get(a.id, a) for a in ref_assets]


async def generate_asset_image(
    db: AsyncSession,
    user: User,
    project: DramaProject,
    prompt: str,
    *,
    asset: DramaAsset | None = None,
    name: str | None = None,
    kind: str = "character",
    image_style_id: str | None = None,
    model_id: str | None = None,
    aspect_ratio: str | None = None,
    resolution: str | None = None,
) -> DramaAsset:
    """Generate Seedream image and attach/create asset."""
    settings = get_settings()
    ark = get_ark()

    # style_id ưu tiên yêu cầu, nếu không các thông số dự án sẽ bị khôi phục
    style_id = (image_style_id or "").strip() or str(
        (project.params or {}).get("image_style_id") or ""
    ).strip() or None
    # Tỷ lệ mặc định: ký tự 3:4, ký tự khác 16:9
    ratio = (aspect_ratio or "").strip() or (
        "3:4" if (kind or "").lower() == "character" else "16:9"
    )
    res = (resolution or "").strip() or "2K"
    model = resolve_seedream_model_endpoint(model_id)
    size = resolve_seedream_size(aspect_ratio=ratio, resolution=res, model_id=model)
    # URL công khai của bìa kiểu bảng; khi không có hình ảnh raster, chỉ sử dụng các từ gợi ý
    board = resolve_image_style_board_url(style_id)
    full_prompt = build_generation_prompt(
        prompt, asset_type=kind, style_id=style_id, has_style_board=bool(board)
    )

    logger.info(
        "调用 Seedream 生图 project_id=%s asset_id=%s kind=%s style=%s model=%s size=%s prompt_len=%s board=%s",
        project.id,
        asset.id if asset else None,
        kind,
        style_id,
        model,
        size,
        len(full_prompt or ""),
        bool(board),
    )
    result = await ark.gen_image(
        full_prompt.strip(),
        project_id=project.id,
        size=size,
        model=model,
        aspect_ratio=ratio,
        style_ref_urls=[board] if board else None,
    )
    # Kết quả hình ảnh được tạo ra được đồng bộ hóa với OSS trong thời gian thực (cấm xếp hàng không đồng bộ) và hình ảnh tham chiếu Seedance yêu cầu mạng công cộng https
    from datetime import datetime, timezone

    from app.services import storage as storage_svc

    url = result.local_url or ""
    if url:
        published = storage_svc.republish_url(url, sync=True)
        if published and str(published).startswith("https://"):
            url = str(published)
        elif result.remote_url and str(result.remote_url).startswith("https://"):
            url = str(result.remote_url)
            logger.warning(
                "OSS 未拿到 https，回退上游 CDN project_id=%s",
                project.id,
            )
    if not (url or "").strip():
        raise RuntimeError("Tạo ảnh thành công nhưng không nhận được URL hình ảnh khả dụng")
    logger.info("Seedream 返回 project_id=%s url=%s", project.id, url[:100])

    await record_seedream_image_usage(
        db,
        user_id=user.id,
        model=model or settings.model_image,
        domain="drama",
        image_result=result,
        drama_project_id=project.id,
    )

    finished_at = datetime.now(timezone.utc).isoformat()
    # gen_meta ghi các thông số nội dung để tạo điều kiện cho giao diện người dùng lặp lại tùy chọn cuối cùng; giống như dấu giao dịch được thực hiện để thuận tiện cho việc bỏ phiếu và thay đổi hình ảnh ngay lập tức
    gen_meta = {
        "prompt": prompt,
        "image_style_id": style_id,
        "model_id": model_id or "seedream-5.0",
        "aspect_ratio": ratio,
        "resolution": res,
        "generation": {
            "status": "done",
            "finished_at": finished_at,
            "model_id": model_id or "seedream-5.0",
            "aspect_ratio": ratio,
            "resolution": res,
            "image_style_id": style_id,
        },
    }

    if asset is None:
        asset = DramaAsset(
            project_id=project.id,
            type=kind,
            asset_type="image",
            name=name or "未命名资产",
            cover=url,
            url=url,
            params=gen_meta,
        )
        db.add(asset)
    else:
        # Làm mới trước khi gửi để tránh ghi đè image_versions bằng các thông số cũ khi đồng thời tải lên/lưu
        await db.refresh(asset)
        archive_asset_image_version(asset, source="generate")
        asset.cover = url
        asset.url = url
        params = dict(asset.params or {})
        params.update(gen_meta)
        archived_versions = (asset.params or {}).get("image_versions") if isinstance(asset.params, dict) else None
        if isinstance(archived_versions, list):
            params["image_versions"] = archived_versions
        if prompt.strip():
            params["visualPrompt"] = prompt.strip()
            if not str(params.get("visualImage") or "").strip():
                params["visualImage"] = prompt.strip()
        asset.params = params

    await db.commit()
    await db.refresh(asset)
    return asset


async def generate_voice_asset_audio(
    db: AsyncSession,
    user: User,
    project: DramaProject,
    asset: DramaAsset,
    *,
    voice_prompt: str,
    sample_text: str | None = None,
    speaker: str | None = None,
    character_asset: DramaAsset | None = None,
) -> DramaAsset:
    """Tổng hợp âm thanh tham chiếu bằng lời nhắc cho nội dung loại giọng nói."""
    return await synthesize_voice_asset(
        db,
        user,
        project,
        asset,
        voice_prompt=voice_prompt,
        sample_text=sample_text,
        speaker=speaker,
        character_name=character_asset.name if character_asset else None,
        character_asset=character_asset,
    )


# Tập hợp tải trọng tham chiếu Seedance của bảng phân cảnh (bao gồm giai điệu tường thuật chung)
def build_fragment_ref_payloads(
    project: DramaProject,
    ref_assets: list[DramaAsset],
) -> list[dict[str, Any]]:
    ref_payloads = [drama_asset_to_payload(a) for a in ref_assets]
    if not SEEDANCE_ATTACH_REFERENCE_AUDIO:
        return ref_payloads
    narrator_voice: Any = (project.params or {}).get("narrationVoiceAudio")
    if isinstance(narrator_voice, dict):
        narration_url = str(
            narrator_voice.get("url") or narrator_voice.get("previewUrl") or ""
        ).strip()
        if narration_url and not narration_url.startswith("https://"):
            from app.services import storage as storage_svc

            published_voice = storage_svc.republish_url(narration_url, sync=True)
            if published_voice and str(published_voice).startswith("https://"):
                narrator_voice = {**narrator_voice, "url": str(published_voice)}

        narration_voice_audio_url = str(narrator_voice.get("url") or "").strip()
        if narration_voice_audio_url:
            narrator_payload = {
                "id": -1,
                "type": "narration",
                "assetType": "audio",
                "name": "旁白",
                "cover": "",
                "url": "",
                "params": {"voiceAudio": narrator_voice},
            }
            ref_payloads = [narrator_payload, *ref_payloads]
    return ref_payloads


@dataclass
class FragmentVideoPrepared:
    """Bối cảnh trước khi gửi video storyboard (sản phẩm của giai đoạn chuẩn bị Worker, được ghi vào task.payload)."""

    submit_mode: str
    seedance_body: dict[str, Any] | None = None
    image_url: str | None = None
    # Nhiều ảnh tham chiếu (loại trừ lẫn nhau với first_frame)
    reference_image_urls: list[str] | None = None
    reference_audio_urls: list[str] | None = None
    prompt: str = ""
    duration: int = 8
    ratio: str = "9:16"
    resolution: str = "480p"
    generate_audio: bool = True
    content_labels: list[str] | None = None
    model_id: str | None = None
    # Trường tải trọng cũ vẫn được đọc trong quá trình khử lưu lượng; nhiệm vụ mới không còn viết nó nữa.
    kie_api_kind: str | None = None


# Giai đoạn chuẩn bị của Worker: hình ảnh tham chiếu/khung kết nối/nội dung yêu cầu (có thể mất thời gian, nhưng không đợi hoàn thành upstream).
async def prepare_fragment_video_for_submit(
    db: AsyncSession,
    user: User,
    project: DramaProject,
    fragment: DramaEpisodeFragment,
    *,
    model_id: str | None = None,
) -> FragmentVideoPrepared:
    settings = get_settings()
    prompt = prepare_fragment_content(
        fragment.content or "",
        duration_sec=int(fragment.duration_sec or 0) or None,
        is_opening=int(fragment.sort_order or 0) == 0,
    ).strip() or "短剧分镜"
    duration = int(fragment.duration_sec or 8)
    duration = max(settings.seedance_duration_min, min(duration, settings.seedance_duration_max))
    episode = await db.get(DramaEpisode, fragment.episode_id)
    ratio, resolution = resolve_episode_video_output(
        episode.params if episode else None,
        project.params,
    )
    # Ghi kết quả phân tích cú pháp khi tập không có trong khung gốc để tránh sự mâu thuẫn lâu dài giữa giao diện người dùng mặc định 9:16 và các thông số
    if episode is not None:
        ep_params = dict(episode.params or {})
        changed = False
        if str(ep_params.get("aspect_ratio") or "").strip() not in {"9:16", "16:9", "1:1"}:
            ep_params["aspect_ratio"] = ratio
            changed = True
        if str(ep_params.get("resolution") or "").strip() not in {"480p", "720p", "1080p"}:
            ep_params["resolution"] = resolution
            changed = True
        if changed:
            episode.params = ep_params

    mid = (model_id or "").strip() or None

    refs = (
        await db.execute(
            select(DramaFragmentAssetRef)
            .where(DramaFragmentAssetRef.fragment_id == fragment.id)
            .order_by(DramaFragmentAssetRef.id.asc())
        )
    ).scalars().all()
    ref_assets: list[DramaAsset] = []
    seen_ids: set[int] = set()
    for ref in refs:
        if ref.asset_id in seen_ids:
            continue
        asset = await db.get(DramaAsset, ref.asset_id)
        if asset:
            seen_ids.add(ref.asset_id)
            ref_assets.append(asset)

    ref_assets = await ensure_fragment_reference_images(
        db,
        user,
        project,
        fragment,
        ref_assets=ref_assets,
    )
    ref_assets = await ensure_reference_assets_public_urls(db, ref_assets)
    # Âm điệu khó kiểm soát: chưa tổng hợp/hoàn thiện reference_audio
    if SEEDANCE_ATTACH_REFERENCE_AUDIO:
        ref_assets = await ensure_fragment_reference_audios(
            db,
            user,
            project,
            fragment,
            ref_assets,
        )
    ref_payloads = build_fragment_ref_payloads(project, ref_assets)
    style_id = str((project.params or {}).get("image_style_id") or "").strip() or None
    catalog = build_seedance_reference_catalog(ref_payloads)
    # bảng luôn có thể được sử dụng cho khung hình tĩnh; hình ảnh tham khảo video chỉ được treo khi đã có hình ảnh nhân vật/cảnh để tránh việc lấy bìa làm chủ đề chính
    board_url = resolve_image_style_board_url(style_id)
    video_board_url = board_url if catalog.images else ""

    continuity_url: str | None = None
    if project_link_last_frame_enabled(project):
        prev = await find_previous_episode_fragment(db, fragment)
        continuity_url = await ensure_fragment_last_frame_url(project, prev)
        if continuity_url:
            continuity_url = storage_svc_early_republish(continuity_url)

    image_url = ""
    for item in catalog.images:
        image_url = item.url
        break

    if ref_payloads and (catalog.images or catalog.audios):
        body = build_seedance_generate_body(
            {
                "content": prompt,
                "reference": ref_payloads,
                "model_id": mid,
                "video_style_id": style_id,
                "aspect_ratio": ratio,
                "resolution": resolution,
                "duration_fallback": duration,
                "continuity_first_frame_url": continuity_url,
                "style_board_url": video_board_url or None,
                "burn_subtitles": resolve_episode_burn_subtitles(
                    episode.params if episode else None
                ),
                "character_intro": resolve_episode_character_intro(
                    episode.params if episode else None
                ),
            }
        )
        return FragmentVideoPrepared(
            submit_mode="seedance_body",
            seedance_body=body,
            prompt=prompt,
            duration=duration,
            ratio=ratio,
            resolution=resolution,
            content_labels=describe_seedance_content_slots(
                ref_payloads,
                continuity_url,
                has_text=bool((prompt or "").strip()),
                style_board_url=video_board_url or None,
                content=prompt,
            ),
            model_id=mid,
        )

    ark = get_ark()
    if not image_url:
        # Seedance i2v cấm tỷ lệ truyền và xuất khung hình đầu tiên; trước tiên, các khung hình tĩnh phải được tạo theo khung đích.
        # Khi không có tài liệu tham khảo chính, đừng coi bảng kiểu là hình ảnh duy nhất mà chỉ dựa vào bản sao kiểu
        still_prompt = append_style_prompt(
            (prompt or "").strip()[:500] or "短剧分镜",
            style_id,
            has_style_board=False,
        )
        still = await ark.gen_image(
            still_prompt,
            project_id=project.id,
            shot_no=fragment.id,
            size=seedream_still_size_for_video_ratio(ratio),
        )
        image_url = still.local_url or ""

    return FragmentVideoPrepared(
        submit_mode="i2v",
        image_url=image_url,
        prompt=prompt,
        duration=duration,
        ratio=ratio,
        resolution=resolution,
        generate_audio=True,
        model_id=mid,
    )


# Giai đoạn gửi Worker: Sử dụng Flow API tạo video Veo và trả về task_id ngay lập tức
async def submit_prepared_fragment_video(
    prepared: FragmentVideoPrepared,
    *,
    project_id: int,
) -> str:
    from app.services.drama.flow_api import submit_flow_video

    ref_img = None
    if prepared.reference_image_urls:
        ref_img = prepared.reference_image_urls[0]
    elif prepared.image_url:
        ref_img = prepared.image_url

    return submit_flow_video(
        prompt=prepared.prompt,
        image_ref=ref_img,
        aspect_ratio=prepared.ratio or "9:16",
    )


def serialize_fragment_video_prepared(prepared: FragmentVideoPrepared) -> dict[str, Any]:
    return {
        "submit_mode": prepared.submit_mode,
        "seedance_body": prepared.seedance_body,
        "image_url": prepared.image_url,
        "reference_image_urls": prepared.reference_image_urls,
        "reference_audio_urls": prepared.reference_audio_urls,
        "prompt": prepared.prompt,
        "duration": prepared.duration,
        "ratio": prepared.ratio,
        "resolution": prepared.resolution,
        "generate_audio": prepared.generate_audio,
        "content_labels": prepared.content_labels,
        "model_id": prepared.model_id,
        "kie_api_kind": prepared.kie_api_kind,
    }


def deserialize_fragment_video_prepared(raw: dict[str, Any]) -> FragmentVideoPrepared:
    labels_raw = raw.get("content_labels")
    labels = (
        [str(x) for x in labels_raw if str(x).strip()]
        if isinstance(labels_raw, list)
        else None
    )

    def _str_list(key: str) -> list[str] | None:
        val = raw.get(key)
        if not isinstance(val, list):
            return None
        out = [str(x).strip() for x in val if str(x).strip()]
        return out or None

    return FragmentVideoPrepared(
        submit_mode=str(raw.get("submit_mode") or ""),
        seedance_body=raw.get("seedance_body") if isinstance(raw.get("seedance_body"), dict) else None,
        image_url=str(raw.get("image_url") or "") or None,
        reference_image_urls=_str_list("reference_image_urls"),
        reference_audio_urls=_str_list("reference_audio_urls"),
        prompt=str(raw.get("prompt") or ""),
        duration=int(raw.get("duration") or 8),
        ratio=str(raw.get("ratio") or "9:16"),
        resolution=str(raw.get("resolution") or "480p"),
        generate_audio=bool(raw.get("generate_audio", True)),
        content_labels=labels,
        model_id=str(raw.get("model_id") or "") or None,
        kie_api_kind=str(raw.get("kie_api_kind") or "") or None,
    )


# Ghi lại kết quả vị trí video cục bộ/ngược dòng vào bảng phân cảnh và lập hóa đơn cho chúng.
async def apply_fragment_video_assets(
    db: AsyncSession,
    user: User,
    project: DramaProject,
    fragment: DramaEpisodeFragment,
    *,
    local_video: str,
    local_last_frame: str | None = None,
    attempts: int = 1,
    attempt_limit: int = 3,
    task_result: "TaskResult | None" = None,
    provider_task_id: str | None = None,
) -> DramaEpisodeFragment:
    from app.services import storage as storage_svc
    from app.services.ffmpeg_compose import extract_video_last_frame, extract_video_poster_frame

    settings = get_settings()
    # Lưu phim cũ trước khi ghi đè để chuyển phiên bản
    archive_fragment_video_version(fragment)
    video_url = storage_svc.republish_url(local_video, sync=True) or local_video
    cover_url = ""
    video_path = storage_svc.local_path_from_url(local_video)
    if video_path is None and isinstance(local_video, str) and not local_video.startswith("http"):
        candidate = Path(local_video)
        if candidate.exists():
            video_path = candidate
    if video_path and video_path.exists():
        poster_dest = (
            storage_svc.project_dir(project.id)
            / f"shot_{fragment.id}_{int(time.time())}_cover.jpg"
        )
        if extract_video_poster_frame(video_path, poster_dest):
            cover_src = storage_svc.rel_static_url(poster_dest)
            cover_url = storage_svc.republish_url(cover_src, sync=True) or cover_src
    last_frame_url = None
    if local_last_frame:
        last_frame_url = storage_svc.republish_url(local_last_frame, sync=True) or local_last_frame
        if not cover_url:
            cover_url = last_frame_url
    # Các nền tảng như Kie thường không trả về khung hình cuối cùng: một khung hình được trích xuất từ phim để đảm bảo có sẵn kiểm soát truy cập kết nối cảnh quay tiếp theo
    if not last_frame_url and video_path and video_path.exists():
        frame_dest = (
            storage_svc.project_dir(project.id)
            / f"shot_{fragment.id}_{int(time.time())}_last.jpg"
        )
        if extract_video_last_frame(video_path, frame_dest):
            frame_src = storage_svc.rel_static_url(frame_dest)
            last_frame_url = storage_svc.republish_url(frame_src, sync=True) or frame_src
    fragment.video = video_url
    fragment.cover = cover_url or ""
    write_fragment_last_frame_url(fragment, last_frame_url)
    episode = await db.get(DramaEpisode, fragment.episode_id)
    ratio, resolution = resolve_episode_video_output(
        episode.params if episode else None,
        project.params,
    )
    write_fragment_video_output_meta(
        fragment,
        aspect_ratio=ratio,
        resolution=resolution,
        video_path=video_path,
    )
    params = dict(fragment.params or {})
    params.pop("generation_attempts", None)
    gen = dict(params.get("generation") or {}) if isinstance(params.get("generation"), dict) else {}
    gen.update({
        "status": "done",
        "video": fragment.video,
        "cover": fragment.cover,
        "lastFrameUrl": last_frame_url or None,
        "attempts": attempts,
        "attempt_limit": attempt_limit,
    })
    params["generation"] = gen
    if last_frame_url:
        params["lastFrameUrl"] = last_frame_url
    fragment.params = params
    generate_audio = bool((fragment.params or {}).get("generate_audio", True))
    await record_seedance_video_usage(
        db,
        user_id=user.id,
        billing_key=seedance_billing_key(generate_audio=generate_audio),
        model=settings.model_video,
        domain="drama",
        task_result=task_result,
        fallback_duration_sec=fragment.duration_sec,
        provider_task_id=provider_task_id,
        drama_project_id=project.id,
    )
    await db.commit()
    await db.refresh(fragment)
    return fragment


# Hãy thử sử dụng URL công khai làm khung cuối cùng cho kết nối (thử xuất bản lại khi cục bộ/tĩnh)
def storage_svc_early_republish(url: str) -> str:
    from app.services import storage as storage_svc

    return storage_svc.republish_url(url, sync=True) or url
