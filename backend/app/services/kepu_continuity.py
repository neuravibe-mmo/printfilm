"""Kết nối giữa các gương khoa học phổ biến: Gương sau đề cập đến khung hình tĩnh của ống kính trước khi xuất hình ảnh và đề cập đến khung hình cuối cùng của ống kính trước khi xuất video."""

from __future__ import annotations

import time
from typing import Any

from app.services.style_lock import seedream_ref_urls


def previous_shot(shots: list[Any], shot_no: int) -> Any | None:
    """Nhấn shot_no để chụp ảnh trước (không bao gồm ảnh này)."""
    prev = None
    for shot in sorted(shots, key=lambda item: int(getattr(item, "shot_no", 0) or 0)):
        no = int(getattr(shot, "shot_no", 0) or 0)
        if no >= int(shot_no):
            break
        prev = shot
    return prev


def previous_usable_shot(shots: list[Any], shot_no: int) -> Any | None:
    """Tìm ảnh gần đây nhất có khung hình tĩnh hoặc khung hình cuối cùng."""
    prev = None
    for shot in sorted(shots, key=lambda item: int(getattr(item, "shot_no", 0) or 0)):
        no = int(getattr(shot, "shot_no", 0) or 0)
        if no >= int(shot_no):
            break
        if shot_image_ref(shot) or shot_last_frame_ref(shot):
            prev = shot
    return prev


def _usable_seedream_url(raw: str | None, *, allow_republish: bool = False) -> str | None:
    """Chỉ những địa chỉ công khai mà Seedream có thể lấy mới được trả lại; Địa chỉ sản phẩm TokenFree không thể được sử dụng để tham khảo."""
    url = str(raw or "").strip()
    if not url:
        return None
    from app.services.tokenfree_image import is_tokenfree_image_url

    if is_tokenfree_image_url(url):
        return None
    if allow_republish and not (url.startswith("http://") or url.startswith("https://")):
        from app.services import storage

        url = str(storage.republish_url(url, sync=True) or "").strip()
        if is_tokenfree_image_url(url):
            return None
    ok = seedream_ref_urls(url)
    return ok[0] if ok else None


def shot_image_ref(shot: Any | None) -> str | None:
    """Ưu tiên là image_url của mạng công cộng, tiếp theo là ark CDN; local /static cố gắng đồng bộ hóa với OSS."""
    if shot is None:
        return None
    candidates = (getattr(shot, "image_url", None), getattr(shot, "image_ark_url", None))
    for raw in candidates:
        url = _usable_seedream_url(raw, allow_republish=False)
        if url:
            return url
    for raw in candidates:
        url = _usable_seedream_url(raw, allow_republish=True)
        if url:
            return url
    return None


def _any_shot_image(shot: Any) -> str | None:
    """Khung tĩnh bất kỳ địa chỉ có sẵn nào (bao gồm cả cục bộ/tĩnh); Sản phẩm TokenFree bị bỏ qua. Thích đường dẫn địa phương."""
    for raw in (getattr(shot, "image_url", None), getattr(shot, "image_ark_url", None)):
        url = _usable_video_ref(raw)
        if url:
            return url
    return None


def shot_last_frame_ref(shot: Any | None) -> str | None:
    """Khung hình cuối cùng của cảnh cuối; URL tác vụ TokenFree bị bỏ qua để tránh không thể kéo xuôi dòng mà không cần xác thực."""
    if shot is None:
        return None
    last = str(getattr(shot, "last_frame_url", None) or "").strip()
    if last and _usable_video_ref(last):
        return last
    return shot_image_ref(shot) or _any_shot_image(shot)


def _usable_video_ref(raw: str | None) -> str | None:
    """Đường dẫn cục bộ hoặc bản đồ mạng công cộng có thể được sử dụng làm tài liệu tham khảo cho bước tiếp theo; địa chỉ sản phẩm TokenFree không thể."""
    url = str(raw or "").strip()
    if not url:
        return None
    from app.services.tokenfree_image import is_tokenfree_image_url
    from app.services.tokenfree_video import is_tokenfree_content_url

    if is_tokenfree_image_url(url) or is_tokenfree_content_url(url):
        return None
    return url


def image_refs_for_shot(prev: Any | None, base_refs: list[str] | None = None) -> list[str]:
    """Tham chiếu Seedream của cảnh này: khung hình tĩnh của cảnh trước + hình ảnh cơ sở mẫu."""
    bases = list(base_refs or [])
    prev_url = shot_image_ref(prev)
    if prev_url:
        return seedream_ref_urls(prev_url, *bases)
    return seedream_ref_urls(*bases)


def video_extra_refs_for_shot(prev: Any | None) -> list[str]:
    """Tham khảo bổ sung cho video này: khung hình cuối cùng (hoặc khung hình tĩnh) của cảnh trước."""
    url = shot_last_frame_ref(prev)
    return [url] if url else []


def persist_last_frame_from_video(
    project_id: int,
    shot_no: int,
    video_url: str,
    preferred_url: str | None = None,
) -> str | None:
    """Ưu tiên dành cho khung cuối cùng của đĩa/mạng công cộng; URL tác vụ TokenFree không phải là khung cuối cùng của mạng công cộng và thay vào đó được lấy từ lát cắt."""
    from app.services import storage
    from app.services.ffmpeg_compose import extract_video_last_frame

    pref = str(preferred_url or "").strip()
    if pref:
        if (pref.startswith("http://") or pref.startswith("https://")) and _usable_video_ref(pref):
            return pref
        if _usable_video_ref(pref):
            https = storage.republish_url(pref, sync=True)
            published = _usable_video_ref(str(https or ""))
            if published and published.startswith("http"):
                return published
            if pref.startswith("/static/"):
                return pref
    path = storage.local_path_from_url(video_url)
    if path and path.exists():
        dest = storage.project_dir(int(project_id)) / f"shot_{int(shot_no):03d}_{int(time.time())}_last.jpg"
        if extract_video_last_frame(path, dest):
            published = storage.publish_local(dest, sync=True)
            https = storage.republish_url(published, sync=True)
            return https or published
    return None
