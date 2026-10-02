# -*- coding: utf-8 -*-
"""Số tiền giữ lại ước tính theo TaskRun."""
from __future__ import annotations

import math

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import Settings, get_settings
from app.models import Project
from app.models_tasks import TaskRun
from app.services.billing.pricing import charge_fen_for_tokens
from app.services.tokenfree_pricing import (
    charge_fen_official_image,
    charge_fen_official_llm,
    charge_fen_official_video,
    ensure_official_rates,
    resolve_billing_image_size,
)
from app.services.kepu_stages import (
    normalize_kepu_pipeline_phase,
    project_audio_ready,
    resolve_kepu_billing_phase,
    shot_image_ready,
    shot_video_ready,
)

__all__ = [
    "estimate_phase_fen",
    "estimate_task_fen",
    "resolve_kepu_billing_phase",
]


def _kepu_video_resolution(project: Project | None, settings: Settings) -> str:
    """Độ phân giải phim khoa học phổ biến: mục cài đặt; khi HD được định cấu hình là 480p, nó sẽ tăng lên 720p (phù hợp với quy trình)."""
    raw = str(getattr(settings, "ark_video_resolution", "") or "480p")
    mode = str(getattr(project, "resolution_mode", "") or "")
    if mode == "hd" and raw.strip().lower() == "480p":
        return "720p"
    return raw


def _drama_video_resolution(payload: dict) -> str:
    """Cài đặt mặc định cho truyện tranh đã hoàn thành là 720p, giống với cài đặt mặc định của giao diện người dùng và nội dung video."""
    prepared = payload.get("prepared") if isinstance(payload.get("prepared"), dict) else {}
    raw = str((prepared or {}).get("resolution") or payload.get("resolution") or "").strip()
    return raw or "720p"


_VIDEO_SIZE_LABELS = {"480p", "720p", "1080p"}


def _payload_image_size(payload: dict) -> str:
    """Nhận độ phân giải của hình ảnh thô từ tải trọng tác vụ; bỏ qua các tập tin video như 480p."""
    prepared = payload.get("prepared") if isinstance(payload.get("prepared"), dict) else {}
    gen = payload.get("generation") if isinstance(payload.get("generation"), dict) else {}
    canvas = payload.get("canvas") if isinstance(payload.get("canvas"), dict) else {}
    canvas_gen = canvas.get("generation") if isinstance(canvas.get("generation"), dict) else {}
    for val in (
        payload.get("size"),
        payload.get("image_size"),
        gen.get("size"),
        gen.get("resolution"),
        canvas_gen.get("size"),
        canvas_gen.get("resolution"),
        prepared.get("size"),
        prepared.get("image_size"),
    ):
        text = str(val or "").strip()
        if text:
            return text
    res = str(payload.get("resolution") or "").strip()
    if res and res.lower() not in _VIDEO_SIZE_LABELS:
        return res
    return ""


def _billing_image_size(settings: Settings, *, model: str = "", size: str = "") -> str:
    """Chi phí thanh toán rõ ràng: Phù hợp với phía thế hệ Ark, kẹp Pro/sunburst 3K·4K đến 2K."""
    return resolve_billing_image_size(settings, model=model, size=size)


def _buffered_fen(fen: int, settings: Settings) -> int:
    """token / Định giá loại thời lượng nhân với bộ đệm; kết quả là ít nhất 1 điểm."""
    buf = float(settings.billing_estimate_buffer or 1.2)
    return max(1, math.ceil(max(0, int(fen)) * buf))


def _catalog_image_fen(settings: Settings, *, model: str = "", size: str = "", payload: dict | None = None) -> int:
    """Giá chính thức sẽ được giữ lại và không nhân với 1,2. Bộ đệm dùng để định giá thấp mã thông báo và giá đã là giá thanh toán."""
    body = payload if isinstance(payload, dict) else {}
    mid = model or settings.model_image
    resolved = _billing_image_size(settings, model=mid, size=size or _payload_image_size(body))
    return max(1, int(charge_fen_official_image(settings, model=mid, size=resolved)))


def _estimate_assets_fen(project: Project, settings: Settings) -> int:
    """Chỉ những hình ảnh + lồng tiếng chưa hoàn thiện của toàn bộ phim (không bao gồm cảnh quay và video) mới được đánh giá."""
    shots = list(project.shots or [])
    need_img = sum(1 for s in shots if not shot_image_ready(s))
    # Toàn bộ phim TTS được ước tính một lần; nếu lời tường thuật đã sẵn sàng (toàn bộ tệp phim hoặc tất cả các tệp ống kính), sẽ không bị giữ lại.
    need_tts = 0 if project_audio_ready(project) else 1
    if need_img <= 0 and need_tts <= 0:
        return 1
    total = 0
    for _ in range(max(need_img, 0)):
        total += _catalog_image_fen(settings)
    if need_tts > 0:
        n = max(len(shots), 1)
        _, c_tts = charge_fen_for_tokens(
            settings.billing_est_tts_tokens * n,
            "tts",
            settings=settings,
        )
        total += _buffered_fen(c_tts, settings)
    return max(total, 1)


def _estimate_videos_fen(project: Project, settings: Settings) -> int:
    """Chỉ đánh giá những cảnh quay và video chưa ra mắt."""
    shots = [s for s in list(project.shots or []) if not shot_video_ready(s)]
    if not shots:
        return 1
    total = 0
    for sh in shots:
        secs = max(float(sh.duration or 4), 2.0)
        total += charge_fen_official_video(
            secs, settings, resolution=_kepu_video_resolution(project, settings)
        )
    return _buffered_fen(total, settings)


def estimate_phase_fen(project: Project, phase: str, settings: Settings | None = None) -> int:
    """Ước tính giai đoạn quy trình khoa học phổ biến: script | tài sản | video | soạn | sản xuất (tương thích → đoạn tiếp theo)."""
    s = settings or get_settings()
    raw = normalize_kepu_pipeline_phase(phase, project)

    if raw == "script":
        charge = charge_fen_official_llm(s.billing_est_llm_tokens, s)
        return _buffered_fen(charge, s)

    if raw == "assets":
        return _estimate_assets_fen(project, s)

    if raw == "videos":
        return _estimate_videos_fen(project, s)

    if raw == "compose":
        return 1

    return _estimate_assets_fen(project, s)


async def estimate_task_fen(db: AsyncSession, task: TaskRun, settings: Settings | None = None) -> int:
    """Ước tính số điểm giữ lại của một nhiệm vụ dựa trên miền + task_type."""
    s = settings or get_settings()
    await ensure_official_rates(s)
    domain = (task.domain or "").strip()
    task_type = (task.task_type or "").strip()
    payload = task.payload if isinstance(task.payload, dict) else {}

    if domain == "kepu" and task_type == "project_pipeline":
        project_id = task.project_id or payload.get("project_id")
        if not project_id:
            charge = charge_fen_official_llm(s.billing_est_llm_tokens, s)
            return _buffered_fen(charge, s)
        result = await db.execute(
            select(Project).where(Project.id == int(project_id)).options(selectinload(Project.shots))
        )
        project = result.scalar_one_or_none()
        if not project:
            charge = charge_fen_official_llm(s.billing_est_llm_tokens, s)
            return _buffered_fen(charge, s)
        phase = str(payload.get("phase") or "script")
        return estimate_phase_fen(project, phase, settings=s)

    if domain == "kepu":
        if task_type in {"shot_regen_image"}:
            return _catalog_image_fen(s, payload=payload)
        if task_type in {"shot_regen_video"}:
            dur = float(payload.get("duration") or 5)
            project_id = task.project_id or payload.get("project_id")
            project = await db.get(Project, int(project_id)) if project_id else None
            c = charge_fen_official_video(
                max(dur, 2.0), s, resolution=_kepu_video_resolution(project, s)
            )
            return _buffered_fen(c, s)
        if task_type in {"shot_regen_audio", "project_regen_audio"}:
            _, c = charge_fen_for_tokens(s.billing_est_tts_tokens * 3, "tts", settings=s)
            return _buffered_fen(c, s)
        if task_type == "project_compose_only":
            return 1

    if domain == "drama":
        if task_type in {"script_summary", "fragment_plan", "agent_chat"}:
            c = charge_fen_official_llm(s.billing_est_llm_tokens, s)
            return _buffered_fen(c, s)
        if task_type == "episode_script":
            total_eps = int(payload.get("total") or payload.get("episode_count") or 1)
            c = charge_fen_official_llm(s.billing_est_llm_tokens * max(total_eps, 1), s)
            return _buffered_fen(c, s)
        if task_type in {"asset_image", "seed_assets"}:
            if task_type == "seed_assets":
                c = charge_fen_official_llm(s.billing_est_llm_tokens * 3, s)
                return _buffered_fen(c, s)
            return _catalog_image_fen(s, payload=payload)
        if task_type in {"asset_video", "fragment_video"}:
            dur = float(payload.get("duration_sec") or payload.get("duration") or 0)
            if dur <= 0 and isinstance(payload.get("prepared"), dict):
                dur = float(payload["prepared"].get("duration") or 0)
            if dur <= 0:
                frag_id = task.fragment_id or (
                    (payload.get("fragment_ids") or [None])[0]
                    if isinstance(payload.get("fragment_ids"), list)
                    else None
                )
                if frag_id:
                    from app.models_drama import DramaEpisodeFragment
                    from app.services.drama.fragment_content_duration import (
                        resolve_seedance_duration_from_content,
                    )

                    frag = await db.get(DramaEpisodeFragment, int(frag_id))
                    if frag is not None:
                        dur = float(
                            resolve_seedance_duration_from_content(
                                frag.content or "",
                                fallback=int(frag.duration_sec or 8),
                            )
                        )
            if dur <= 0:
                dur = 8.0
            c = charge_fen_official_video(
                max(dur, 2.0), s, resolution=_drama_video_resolution(payload)
            )
            c = _buffered_fen(c, s)
            if task_type == "fragment_video":
                c += max(1, _catalog_image_fen(s, payload=payload) // 2)
            return c
        if task_type == "voice_synthesis":
            _, c = charge_fen_for_tokens(s.billing_est_tts_tokens, "tts", settings=s)
            return _buffered_fen(c, s)
        if task_type in {"skill_optimize", "voice_prompt"}:
            c = charge_fen_official_llm(s.billing_est_llm_tokens, s)
            return _buffered_fen(c, s)

    if domain == "kepu" and task_type == "content_expand":
        c = charge_fen_official_llm(s.billing_est_llm_tokens, s)
        return _buffered_fen(c, s)

    if domain in {"api", "studio"}:
        if task_type in {"v1_image", "tool_image"}:
            return _catalog_image_fen(s, payload=payload)
        if task_type in {"v1_video", "v1_seedance", "tool_video"}:
            dur = float(payload.get("duration") or 5)
            c = charge_fen_official_video(
                max(dur, 2.0),
                s,
                resolution=str(payload.get("resolution") or "").strip() or "480p",
            )
            return _buffered_fen(c, s)

    c = charge_fen_official_llm(s.billing_est_llm_tokens, s)
    return _buffered_fen(c, s)
