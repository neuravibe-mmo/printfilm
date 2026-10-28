"""Tích hợp API tạo video Google Veo qua cổng Flow API (lưu trữ bền vững trên đĩa)."""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings
from app.services import storage

logger = logging.getLogger(__name__)


def get_flow_base_url() -> str:
    return f"{get_settings().domain_web_2_api.rstrip('/')}/api/flow"


FLOW_PROJECT_ID = "746c4f17-5aa9-4cf1-b824-f8d0bd7aa6c4"

# Thư mục lưu trạng thái tác vụ trên đĩa (tránh mất khi uvicorn reload)
FLOW_STORAGE_DIR = Path(__file__).resolve().parents[3] / "data" / "flow_tasks"
FLOW_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def _save_task_state(task_id: str, data: dict[str, Any]) -> None:
    try:
        f = FLOW_STORAGE_DIR / f"{task_id}.json"
        f.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.warning("Không thể lưu flow task state: %s", e)


def get_flow_video_result(task_id: str) -> dict[str, Any] | None:
    f = FLOW_STORAGE_DIR / f"{task_id}.json"
    if f.exists():
        try:
            return json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Không thể đọc flow task state %s: %s", task_id, e)
    return None


async def _to_base64_data_uri(image_path_or_url: str) -> str | None:
    raw = (image_path_or_url or "").strip()
    if not raw:
        return None
    if raw.startswith("data:image/"):
        return raw

    data: bytes | None = None
    mime = "image/png" if raw.lower().endswith(".png") else "image/jpeg"

    if raw.startswith("http://") or raw.startswith("https://"):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(raw)
                if res.status_code == 200:
                    data = res.content
        except Exception as e:
            logger.warning("Lỗi tải ảnh tham chiếu %s: %s", raw, e)
    else:
        p = Path(raw)
        if not p.is_file():
            p = storage.local_path_from_url(raw)
        if p and p.is_file():
            data = p.read_bytes()

    if data:
        b64 = base64.b64encode(data).decode("ascii")
        return f"data:{mime};base64,{b64}"
    return None


async def upload_image_to_flow(
    image_ref: str,
    project_id: str = FLOW_PROJECT_ID,
    file_name: str | None = None,
) -> str | None:
    """Upload ảnh lên Flow API lấy media_id.
    file_name: tên file gợi ý cho Google Flow, nếu không có đuôi sẽ tự động thêm .png/.jpg.
    Ví dụ: '14_NhanVat_NguyenVanLam.jpg'
    """
    data_uri = await _to_base64_data_uri(image_ref)
    if not data_uri:
        logger.warning("Không thể chuyển đổi ảnh sang data URI: %s", str(image_ref)[:100])
        return None
    is_png = "image/png" in data_uri
    mime = "image/png" if is_png else "image/jpeg"
    ext = "png" if is_png else "jpg"

    target_file_name = file_name.strip() if file_name and file_name.strip() else f"ref_{ext}"
    if not any(target_file_name.lower().endswith(e) for e in (".png", ".jpg", ".jpeg", ".webp")):
        target_file_name = f"{target_file_name}.{ext}"

    payload = {
        "image_base64": data_uri,
        "project_id": project_id,
        "mime_type": mime,
        "file_name": target_file_name,
    }
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(f"{get_flow_base_url()}/upload-image-b64", json=payload)
            if resp.status_code == 200:
                media_id = resp.json().get("media_id")
                logger.info(
                    "Upload ảnh Flow thành công media_id=%s file_name=%s project_id=%s (size=%d bytes)",
                    media_id,
                    target_file_name,
                    project_id,
                    len(data_uri),
                )
                return media_id
            logger.error("Upload ảnh Flow thất bại: HTTP %s %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.error("Lỗi upload ảnh Flow: %s", e)
    return None


async def _run_flow_generation(
    task_id: str,
    prompt: str,
    image_refs: list[str] | str | None = None,
    aspect_ratio: str = "9:16",
    project_id: str = FLOW_PROJECT_ID,
    model_key: str = "abra_r2v_10s",
    db_project_id: int | None = None,
) -> None:
    _save_task_state(task_id, {"status": "running", "created_at": time.time()})
    try:
        ref_ids: list[str] = []

        # Giữ nguyên nội dung tiếng Việt của phân cảnh, không dịch sang tiếng Anh
        from app.services.drama.prompt_optimizer import clean_raw_script, replace_asset_tokens_with_slugs

        cleaned = clean_raw_script(prompt)
        final_prompt = cleaned or (prompt or "").strip() or "Phim điện ảnh"

        # Tự động thay thế @asset:<id> thành @asset:<TênViếtLiềnKhôngDấu> và nạp danh sách tài sản dự án
        project_assets = []
        if db_project_id:
            try:
                from app.database import AsyncSessionLocal
                from app.models_drama import DramaAsset
                from sqlalchemy import select

                async with AsyncSessionLocal() as session:
                    res = await session.execute(
                        select(
                            DramaAsset.id,
                            DramaAsset.name,
                            DramaAsset.type,
                            DramaAsset.cover,
                            DramaAsset.url,
                            DramaAsset.flow_media_id,
                        ).where(DramaAsset.project_id == db_project_id)
                    )
                    rows = res.fetchall()
                    asset_map = {row[0]: (row[1], row[2]) for row in rows if row[1]}
                    if asset_map and re.search(r"@asset:\d+", final_prompt):
                        final_prompt = replace_asset_tokens_with_slugs(final_prompt, asset_map)
                        logger.info("Đã chuyển đổi thẻ @asset sang tên slug cho task=%s", task_id)
                    project_assets = rows
            except Exception as e:
                logger.warning("Không thể load asset map để chuyển đổi slug cho project %s: %s", db_project_id, e)

        # Chuẩn hoá danh sách ảnh tham chiếu
        raw_list: list[str] = []
        if isinstance(image_refs, list):
            raw_list = [str(r).strip() for r in image_refs if str(r).strip()]
        elif isinstance(image_refs, str) and image_refs.strip():
            raw_list = [image_refs.strip()]

        # Google Flow Veo 3.1 R2V khuyến nghị tối đa 3 ảnh tham chiếu
        refs_to_upload = raw_list[:3]
        if refs_to_upload:
            from app.services.drama.prompt_optimizer import get_asset_type_slug, to_vietnamese_slug

            logger.info(
                "Task=%s bắt đầu chuẩn bị %d ảnh tham chiếu cho Flow (project_id=%s)...",
                task_id,
                len(refs_to_upload),
                project_id,
            )
            for idx, img in enumerate(refs_to_upload):
                matched_row = None
                for a in project_assets:
                    # row: id, name, type, cover, url, flow_media_id
                    aid, aname, atype, acover, aurl, aflow_id = a[0], a[1], a[2], a[3], a[4], a[5]
                    if (acover and acover in img) or (aurl and aurl in img) or (img in str(acover)) or (img in str(aurl)):
                        matched_row = a
                        break

                mid = None
                if matched_row and matched_row[5]:
                    mid = str(matched_row[5]).strip()
                    logger.info("Tái sử dụng Flow Media ID đã đồng bộ: %s (Asset #%s %s)", mid, matched_row[0], matched_row[1])
                else:
                    if matched_row:
                        tslug = get_asset_type_slug(matched_row[2])
                        nslug = to_vietnamese_slug(matched_row[1]) if matched_row[1] else f"Asset{matched_row[0]}"
                        suggested_file_name = f"{matched_row[0]}_{tslug}_{nslug}"
                    else:
                        suggested_file_name = f"ref_scene_{idx + 1}"
                    mid = await upload_image_to_flow(img, project_id=project_id, file_name=suggested_file_name)

                if mid and mid not in ref_ids:
                    ref_ids.append(mid)
                    logger.info("Ảnh tham chiếu [%d/%d] media_id=%s", idx + 1, len(refs_to_upload), mid)
                else:
                    logger.warning("Ảnh [%d/%d] không lấy được media_id: %s", idx + 1, len(refs_to_upload), img[:80])

        payload = {
            "reference_media_ids": ref_ids,
            "prompt": final_prompt,
            "project_id": project_id,
            "scene_id": "",
            "aspect_ratio": aspect_ratio or "9:16",
            "model_key": model_key or "abra_r2v_10s",
        }
        logger.info(
            "Bắt đầu gọi Flow API tạo video task=%s ref_ids=%s prompt=%s",
            task_id,
            ref_ids,
            final_prompt[:80],
        )

        async with httpx.AsyncClient(timeout=360.0) as client:
            resp = await client.post(
                f"{get_flow_base_url()}/generate-video-veo_3_1_r2v_lite_low_priority",
                json=payload,
            )
            if resp.status_code >= 400:
                err_text = resp.text
                if "NO_AT_TOKEN" in err_text:
                    err_msg = (
                        "Dịch vụ tạo video Google Veo tạm thời chưa khả dụng (thiếu hoặc hết hạn token xác thực trên máy chủ Flow). "
                        "Vui lòng chuyển sang mô hình video khác (như Seedance 2.5) trong Cài đặt phong cách hoặc thử lại sau."
                    )
                else:
                    try:
                        detail = resp.json().get("detail")
                        err_msg = f"Lỗi máy chủ Flow: {detail}" if detail else f"Flow HTTP {resp.status_code}: {err_text[:200]}"
                    except Exception:
                        err_msg = f"Flow HTTP {resp.status_code}: {err_text[:200]}"
                _save_task_state(
                    task_id,
                    {"status": "failed", "error": err_msg},
                )
                return
            data = resp.json()
            video_url = data.get("video_url")
            if data.get("success") and video_url:
                returned_project_url: str = data.get("project_url") or ""
                logger.info("Flow tạo video thành công task=%s url=%s", task_id, video_url[:60])
                _save_task_state(
                    task_id,
                    {
                        "status": "succeeded",
                        "video_url": video_url,
                        "thumbnail_url": data.get("thumbnail_url"),
                        "media_id": data.get("media_id"),
                        "project_url": returned_project_url,
                        "edit_url": data.get("edit_url"),
                        "elapsed": data.get("elapsed"),
                    },
                )
                # Auto-capture: nếu dự án chưa có flow_project_id, bóc tách từ project_url và lưu vào DB
                if db_project_id and project_id == FLOW_PROJECT_ID and returned_project_url:
                    await _auto_capture_flow_project_id(db_project_id, returned_project_url)
            else:
                _save_task_state(task_id, {"status": "failed", "error": str(data)})
    except Exception as e:
        logger.error("Lỗi Flow tạo video task=%s: %s", task_id, e)
        err_msg = str(e).strip()
        if not err_msg:
            if isinstance(e, (httpx.TimeoutException, TimeoutError)):
                err_msg = "Quá thời gian chờ phản hồi từ máy chủ AI (Timeout sau 6 phút). Máy chủ Google Veo đang bị nghẽn hoặc quá tải."
            else:
                err_msg = f"Lỗi kết nối máy chủ AI: {type(e).__name__}"
        _save_task_state(task_id, {"status": "failed", "error": err_msg})


async def _auto_capture_flow_project_id(db_project_id: int, project_url: str) -> None:
    """Bóc tách flow_project_id từ project_url và lưu vào drama_projects nếu chưa có."""
    import re
    # Google Flow project URL dạng: https://flow.google.com/project/<uuid>/...
    m = re.search(r"/project/([0-9a-f-]{32,})", project_url)
    if not m:
        return
    captured_id = m.group(1)
    try:
        from app.database import AsyncSessionLocal
        from sqlalchemy import select, update
        from app.models_drama import DramaProject
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(DramaProject).where(
                    DramaProject.id == db_project_id,
                    DramaProject.flow_project_id.is_(None),
                )
            )
            proj = result.scalar_one_or_none()
            if proj:
                proj.flow_project_id = captured_id
                cur_params: dict = dict(proj.params or {})
                cur_params["flow_project_id"] = captured_id
                proj.params = cur_params
                await db.commit()
                logger.info("Auto-capture flow_project_id=%s cho db_project_id=%s", captured_id, db_project_id)
    except Exception as exc:
        logger.warning("Auto-capture flow_project_id thất bại: %s", exc)



def submit_flow_video(
    prompt: str,
    image_ref: str | None = None,
    image_refs: list[str] | str | None = None,
    aspect_ratio: str = "9:16",
    flow_project_id: str | None = None,
    db_project_id: int | None = None,
) -> str:
    import uuid

    # Gộp image_ref và image_refs để tương thích ngược
    combined_refs: list[str] = []
    if isinstance(image_refs, list):
        combined_refs.extend([str(r).strip() for r in image_refs if str(r).strip()])
    elif isinstance(image_refs, str) and image_refs.strip():
        combined_refs.append(image_refs.strip())
    if image_ref and str(image_ref).strip() not in combined_refs:
        combined_refs.append(str(image_ref).strip())

    task_id = f"flow-{uuid.uuid4().hex[:12]}"
    asyncio.create_task(
        _run_flow_generation(
            task_id=task_id,
            prompt=prompt,
            image_refs=combined_refs,
            aspect_ratio=aspect_ratio,
            project_id=flow_project_id or FLOW_PROJECT_ID,
            db_project_id=db_project_id,
        )
    )
    return task_id
