# -*- coding: utf-8 -*-
"""Việc xác định giai đoạn quy trình khoa học phổ biến: Khấu trừ thanh toán và quy trình có chung một bộ quy tắc sẵn sàng."""
from __future__ import annotations

from typing import Any

from app.services import storage
from app.services.ffmpeg_compose import is_near_silent_audio


# Quyền riêng tư của người thật đã bị Seedance chặn lại và xác nhận bỏ qua shot mark video AI (hình ảnh tĩnh được sử dụng trong phim)
VIDEO_SKIP_REASON_PRIVACY = "privacy"


def _is_image_text(project: Any) -> bool:
    return (getattr(project, "pipeline_mode", None) or "full") == "image_text"


def shot_image_ready(shot: Any) -> bool:
    """Bảng phân cảnh có sẵn bảng phân cảnh không?"""
    return bool(getattr(shot, "image_url", None) or getattr(shot, "image_ark_url", None))


def shot_video_skipped(shot: Any) -> bool:
    """Nếu bảng phân cảnh được xác nhận là bỏ qua các video AI (chẳng hạn như đánh chặn quyền riêng tư của người thật), thì không cần phải gửi nó lên cấp trên."""
    return getattr(shot, "video_skip_reason", None) == VIDEO_SKIP_REASON_PRIVACY


def shot_video_ready(shot: Any) -> bool:
    """Liệu video bảng phân cảnh đã được hội tụ hay chưa: Đã có video hay đã được xác nhận là bị bỏ qua (tổng hợp với hình ảnh tĩnh sau khi chặn quyền riêng tư)."""
    return bool(getattr(shot, "video_url", None)) or shot_video_skipped(shot)


def shot_audio_file_ok(shot: Any) -> bool:
    """Tệp tường thuật gương đơn tồn tại và gần như không ở chế độ im lặng (phù hợp với quy trình _resume_plan)."""
    audio_url = getattr(shot, "audio_url", None)
    if not audio_url:
        return False
    path = storage.local_path_from_url(str(audio_url))
    if not path or not path.exists():
        return False
    return not is_near_silent_audio(path)


def continuous_narration_ok(project_id: int) -> bool:
    """Liệu có sẵn toàn bộ tệp tường thuật liên tục hay không (phù hợp với quy trình _continuous_audio_ok)."""
    path = storage.project_dir(int(project_id)) / "full_narration.mp3"
    return path.exists() and path.stat().st_size > 2000 and not is_near_silent_audio(path)


def project_audio_ready(project: Any) -> bool:
    """Bản tường thuật dự án đã sẵn sàng chưa: toàn bộ tệp phim đều ổn, hoặc tất cả các tệp tường thuật cảnh quay đều ổn."""
    project_id = getattr(project, "id", None)
    if project_id is not None and continuous_narration_ok(int(project_id)):
        return True
    shots = list(getattr(project, "shots", None) or [])
    return bool(shots) and all(shot_audio_file_ok(s) for s in shots)


def resolve_kepu_billing_phase(project: Any) -> str:
    """Phân tích đoạn tiếp theo theo diễn biến của storyboard: script | tài sản | video | sáng tác."""
    shots = list(getattr(project, "shots", None) or [])
    if not shots:
        return "script"
    image_text = _is_image_text(project)
    need_images = any(not shot_image_ready(s) for s in shots)
    need_audio = not project_audio_ready(project)
    if need_images or need_audio:
        return "assets"
    if not image_text and any(not shot_video_ready(s) for s in shots):
        return "videos"
    return "compose"


def normalize_kepu_pipeline_phase(phase: str | None, project: Any | None = None) -> str:
    """Giai đoạn nhiệm vụ chuẩn hóa; sản phẩm tương thích với việc ánh xạ tới phân đoạn tiếp theo cần được thực thi hiện tại."""
    raw = (phase or "").strip().lower()
    if raw == "produce":
        if project is None:
            return "assets"
        return resolve_kepu_billing_phase(project)
    if raw in {"script", "assets", "videos", "compose"}:
        return raw
    if project is not None:
        return resolve_kepu_billing_phase(project)
    return "assets"
