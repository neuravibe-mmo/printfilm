from __future__ import annotations

import asyncio
import logging
import subprocess
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Project, ProjectStatus, Shot, ShotStatus, User
from app.models_tasks import TaskRun
from app.schemas import ProjectOut, ShotOut, ShotReorderIn, ShotTrimIn, ShotUpdate
from app.services import storage
from app.services.bgm import clip_shot_bgm

from .common import (
    _create_kepu_task,
    _demote_after_edit,
    _ensure_side_task_allowed,
    _get_owned_project,
    _image_ext_from_magic,
    get_current_user,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/projects/{project_id}/shots", response_model=ShotOut)
async def create_shot(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Shot:
    """Thêm một storyboard trống ở cuối phim."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shots = sorted(project.shots, key=lambda s: s.shot_no)
    next_no = (shots[-1].shot_no + 1) if shots else 1
    from app.services.seedance_segments import SegmentBeat, build_segment_script

    bgm = clip_shot_bgm(getattr(project, "bgm_lock", None))
    visual = "画面轻微动态，保持主体稳定"
    script = build_segment_script(
        [SegmentBeat(duration=4, kind="visual", text=visual)],
        bgm_mood=bgm,
    )
    shot = Shot(
        project_id=project.id,
        shot_no=next_no,
        duration=4,
        narration="",
        overlay_title=f"场景 {next_no:02d}",
        overlay_subtitle="",
        img_prompt=visual,
        video_prompt=script,
        segment_script=script,
        camera="slow pan",
        bgm_mood=bgm,
        status=ShotStatus.PENDING,
    )
    db.add(shot)
    await db.flush()
    await db.refresh(project, attribute_names=["shots"])
    _demote_after_edit(project)
    await db.commit()
    await db.refresh(shot)
    return shot


@router.delete("/projects/{project_id}/shots/{shot_id}", response_model=ProjectOut)
async def delete_shot(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Xóa một cảnh quay khỏi dự án và sắp xếp lại số thứ tự."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="Cảnh không tồn tại")
    if len(project.shots) <= 1:
        raise HTTPException(status_code=400, detail="Không thể xóa cảnh duy nhất còn lại của dự án")
    await db.execute(
        update(TaskRun).where(TaskRun.shot_id == shot.id).values(shot_id=None)
    )
    await db.delete(shot)
    await db.flush()
    await db.refresh(project, attribute_names=["shots"])
    ordered = sorted(project.shots, key=lambda s: s.shot_no)
    for idx, s in enumerate(ordered, start=1):
        s.shot_no = idx
    _demote_after_edit(project)
    await db.commit()
    await db.refresh(project, attribute_names=["shots"])
    return project


@router.post("/projects/{project_id}/shots/reorder", response_model=ProjectOut)
async def reorder_shots(
    project_id: int,
    body: ShotReorderIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Sắp xếp lại số lượt bắn theo shot_ids."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    existing = {s.id: s for s in project.shots}
    if set(body.shot_ids) != set(existing.keys()):
        raise HTTPException(status_code=400, detail="镜头列表不完整")
    for i, sid in enumerate(body.shot_ids, start=1):
        existing[sid].shot_no = i
    _demote_after_edit(project)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/image", response_model=ProjectOut)
async def upload_shot_image(
    project_id: int,
    shot_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Tải lên hình ảnh phản chiếu thay thế."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    content_type = (file.content_type or "").lower()
    allowed = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = allowed.get(content_type)
    if not ext:
        suffix = Path(file.filename or "").suffix.lower()
        ext = ".jpg" if suffix == ".jpeg" else suffix if suffix in {".jpg", ".png", ".webp", ".gif"} else ""
    if not ext:
        raise HTTPException(status_code=400, detail="仅支持 JPG / PNG / WebP / GIF")
    raw = await file.read(8 * 1024 * 1024 + 1)
    if not raw:
        raise HTTPException(status_code=400, detail="空文件")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="画面不能超过 8MB")
    sniffed = _image_ext_from_magic(raw)
    if not sniffed:
        raise HTTPException(status_code=400, detail="文件不是有效图片")
    ext = sniffed
    dest = storage.project_dir(project_id) / f"shot_{shot.id}_upload{ext}"
    dest.write_bytes(raw)
    shot.image_url = storage.publish_local(dest)
    shot.image_ark_url = None
    shot.video_url = None
    shot.last_frame_url = None
    shot.status = ShotStatus.IMAGE_READY
    shot.version += 1
    _demote_after_edit(project)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.patch("/projects/{project_id}/shots/{shot_id}", response_model=ShotOut)
async def update_shot(
    project_id: int,
    shot_id: int,
    body: ShotUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Shot:
    from app.models import Template
    from app.services.pipeline import clamp_shot_duration

    project = await _get_owned_project(db, project_id, user)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    data = body.model_dump(exclude_unset=True)
    if "segment_script" in data and data["segment_script"] is not None:
        from app.services.seedance_segments import (
            apply_segment_script_edit,
            replace_first_visual_in_script,
            replace_narration_in_script,
        )

        bgm = clip_shot_bgm(getattr(project, "bgm_lock", None) or shot.bgm_mood)
        script = str(data["segment_script"])
        # Tường thuật bật lên/khung hình đầu tiên được ghi lại vào tập lệnh trước để tránh bị ghi đè bởi tập lệnh cũ khi lưu.
        if "narration" in data and data["narration"] is not None:
            script = replace_narration_in_script(script, str(data["narration"]))
        if "img_prompt" in data and data["img_prompt"] is not None:
            script = replace_first_visual_in_script(script, str(data["img_prompt"]))
        normalized = apply_segment_script_edit(script, bgm_mood=bgm)
        data["segment_script"] = normalized["segment_script"]
        data["duration"] = normalized["duration"]
        data["video_prompt"] = normalized["video_prompt"]
        if normalized.get("narration"):
            data["narration"] = normalized["narration"]
        if normalized.get("img_prompt"):
            data["img_prompt"] = normalized["img_prompt"]
    if "duration" in data and data["duration"] is not None:
        from app.services.pipeline import get_shot_duration_bounds

        tpl = await db.get(Template, project.template_id)
        lo, hi = get_shot_duration_bounds(
            pipeline_mode=project.pipeline_mode or "full",
            tpl_min=tpl.shot_duration_min if tpl else 2,
            tpl_max=tpl.shot_duration_max if tpl else 8,
        )
        val = float(data["duration"])
        if val < lo or val > hi:
            tpl_name = tpl.name if tpl else ""
            raise HTTPException(
                status_code=400,
                detail=f"Thời lượng cảnh phải từ {int(lo)}s đến {int(hi)}s ({tpl_name or 'theo mẫu phong cách'}).",
            )
        data["duration"] = val
    if "bgm_mood" in data and data["bgm_mood"] is not None:
        data["bgm_mood"] = clip_shot_bgm(str(data["bgm_mood"]))
    # Khi văn bản tường thuật thực sự thay đổi (thay đổi trực tiếp tường thuật hoặc tường thuật mới do chuẩn hóa kịch bản đưa ra), toàn bộ đoạn âm thanh liên tục sẽ bị vô hiệu:
    # Bộ đệm chỉ kiểm tra sự tồn tại của tệp và không so sánh văn bản. Nếu không xóa sẽ dẫn đến lồng tiếng cũ và phụ đề mới.
    new_narration = data.get("narration")
    audio_dirty = (
        new_narration is not None
        and str(new_narration).strip() != str(shot.narration or "").strip()
    )
    for k, v in data.items():
        setattr(shot, k, v)
    # Invalidate downstream if visual prompts changed
    if "img_prompt" in data:
        shot.image_url = None
        shot.video_url = None
        shot.last_frame_url = None
        shot.video_skip_reason = None  # Màn hình thay đổi và kết luận chặn quyền riêng tư trở nên không hợp lệ.
        shot.status = ShotStatus.PENDING
    elif (
        "video_prompt" in data
        or "segment_script" in data
        or "duration" in data
        or "camera" in data
    ):
        shot.video_url = None
        shot.last_frame_url = None
        shot.video_skip_reason = None
    if audio_dirty:
        full_narration = storage.project_dir(project_id) / "full_narration.mp3"
        full_narration.unlink(missing_ok=True)
        for sibling in project.shots:
            sibling.audio_url = None
    # Thống nhất đưa trạng thái cuối cùng về giai đoạn tương ứng theo tiến độ vật chất và hủy nó vào phim (điểm cuối này đã bị bỏ qua trước đó và trạng thái sẽ bị kẹt ở DONE)
    _demote_after_edit(project)
    shot.version += 1
    await db.commit()
    await db.refresh(shot)
    return shot


@router.get("/projects/{project_id}/shots/{shot_id}/prompt-preview")
async def get_shot_prompt_preview(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lấy thông tin chi tiết prompt và các ảnh tham chiếu được dùng khi tạo ảnh cho phân cảnh."""
    cond = [Project.id == project_id]
    if not getattr(user, "is_admin", False):
        cond.append(Project.user_id == user.id)

    result = await db.execute(
        select(Project)
        .where(*cond)
        .options(selectinload(Project.shots), selectinload(Project.template))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Dự án không tồn tại")
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="Phân cảnh không tồn tại")

    from app.services.pipeline import (
        _effective_style,
        _image_size_for,
        _kepu_seedance_sfx_audio,
        _kepu_video_prompt,
        _locked_shot_prompt,
        _project_base_refs,
        _project_image_negative,
        _project_output_ratio,
        previous_usable_shot,
    )
    from app.services.kepu_continuity import image_refs_for_shot

    shot_no = shot.shot_no
    prev = previous_usable_shot(list(project.shots), shot_no)
    base_refs = _project_base_refs(project)
    ref_urls = image_refs_for_shot(prev, base_refs)

    detailed_refs = []
    prev_ref = (prev.image_url or prev.image_ark_url) if prev else None
    if prev_ref:
        detailed_refs.append({
            "url": prev_ref,
            "type": "previous_shot",
            "label": f"Cảnh liền trước (Cảnh {prev.shot_no:02d})",
            "shot_no": prev.shot_no,
        })
    if project.ref_image_url:
        detailed_refs.append({
            "url": project.ref_image_url,
            "type": "project_ref",
            "label": "Ảnh tham chiếu nhân vật",
            "shot_no": None,
        })
    if getattr(project, "product_image_url", None):
        detailed_refs.append({
            "url": project.product_image_url,
            "type": "product_ref",
            "label": "Ảnh tham chiếu sản phẩm",
            "shot_no": None,
        })
    if getattr(project, "scene_image_url", None):
        detailed_refs.append({
            "url": project.scene_image_url,
            "type": "scene_ref",
            "label": "Ảnh tham chiếu bối cảnh",
            "shot_no": None,
        })
    tpl_refs = list(((project.template.seedream_config or {}).get("ref_images") or [])) if project.template else []
    for idx, t_url in enumerate(tpl_refs, start=1):
        detailed_refs.append({
            "url": t_url,
            "type": "template_ref",
            "label": f"Ảnh mẫu phong cách #{idx}",
            "shot_no": None,
        })

    full_prompt = _locked_shot_prompt(project, shot.img_prompt)
    negative = _project_image_negative(project)
    aspect_ratio = _project_output_ratio(project) or "16:9"
    image_size = _image_size_for(project)
    image_model = (getattr(project, "image_model", None) or "").strip()
    style_prefix = project.template.style_prefix if project.template else ""

    # Tính toán Video Prompt & Tham chiếu video
    script = (getattr(shot, "segment_script", "") or shot.video_prompt or "").strip()
    video_motion = str(((project.template.seedance_config or {}) if project.template else {}).get("motion_bias", ""))
    video_generate_audio = _kepu_seedance_sfx_audio(project)
    video_prompt = _kepu_video_prompt(
        script,
        style_prefix=_effective_style(project),
        motion_bias=video_motion,
        camera=shot.camera or "",
        ambient_only=video_generate_audio,
    )
    video_model = (getattr(project, "video_model", None) or "").strip()

    video_detailed_refs = []
    if shot.image_url or shot.image_ark_url:
        video_detailed_refs.append({
            "url": shot.image_url or shot.image_ark_url,
            "type": "input_image",
            "label": f"Ảnh gốc phân cảnh (Cảnh {shot.shot_no:02d})",
            "shot_no": shot.shot_no,
        })
    if prev and (prev.image_url or prev.image_ark_url):
        video_detailed_refs.append({
            "url": prev.image_url or prev.image_ark_url,
            "type": "previous_tail_frame",
            "label": f"Frame nối cảnh trước (Cảnh {prev.shot_no:02d})",
            "shot_no": prev.shot_no,
        })

    return {
        "shot_id": shot.id,
        "shot_no": shot.shot_no,
        "full_prompt": full_prompt,
        "raw_prompt": shot.img_prompt,
        "style_prefix": style_prefix,
        "negative_prompt": negative,
        "ref_urls": ref_urls,
        "detailed_refs": detailed_refs,
        "image_model": image_model,
        "aspect_ratio": aspect_ratio,
        "image_size": image_size,
        "video_prompt": video_prompt,
        "raw_video_prompt": script,
        "video_model": video_model,
        "video_detailed_refs": video_detailed_refs,
    }


@router.post("/projects/{project_id}/shots/{shot_id}/regen-image", response_model=ProjectOut)
async def regen_image(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    project.status = ProjectStatus.IMAGING
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        shot_id=shot_id,
        task_type="shot_regen_image",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/regen-video", response_model=ProjectOut)
async def regen_video(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    if (project.pipeline_mode or "full") == "image_text":
        raise HTTPException(status_code=400, detail="图文模式无需生成 AI 视频，请直接重新合成成片")
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot or not (shot.image_url or shot.image_ark_url):
        raise HTTPException(status_code=400, detail="请先生成该镜画面")
    project.status = ProjectStatus.VIDEOING
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        shot_id=shot_id,
        task_type="shot_regen_video",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/trim", response_model=ProjectOut)
async def trim_shot_video(
    project_id: int,
    shot_id: int,
    payload: ShotTrimIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot or not shot.video_url:
        raise HTTPException(status_code=400, detail="Cảnh quay chưa có video để cắt")
    if payload.end_sec <= payload.start_sec:
        raise HTTPException(status_code=400, detail="Thời gian kết thúc phải lớn hơn thời gian bắt đầu")

    src_path = storage.local_path_from_url(shot.video_url)
    pdir = storage.project_dir(project_id)
    if not src_path or not src_path.exists():
        if shot.video_url.startswith("http"):
            src_path = await storage.ensure_local_media(shot.video_url, pdir / f"shot_{shot.shot_no:03d}_src.mp4")
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy tệp video nguồn")

    ts = int(time.time())
    dest_filename = f"shot_{shot.shot_no:03d}_{ts}_trim.mp4"
    dest_path = pdir / dest_filename

    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{payload.start_sec:.3f}",
        "-to", f"{payload.end_sec:.3f}",
        "-i", str(src_path),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-movflags", "+faststart",
        str(dest_path),
    ]
    proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not dest_path.exists():
        logger.error("FFmpeg trim error: %s", proc.stderr)
        raise HTTPException(status_code=500, detail="Lỗi khi cắt video")

    target_dur = payload.end_sec - payload.start_sec
    shot.video_url = storage.publish_local(dest_path)
    shot.duration = round(target_dur, 3)
    shot.version += 1
    project.final_video_url = None
    _demote_after_edit(project)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/regen-audio", response_model=ProjectOut)
async def regen_audio(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    project.status = ProjectStatus.AUDIOING
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        shot_id=shot_id,
        task_type="shot_regen_audio",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/regen-audio", response_model=ProjectOut)
async def regen_all_audio(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Re-TTS all shots with current voice_id, then recompose final video."""
    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="生成进行中，请稍后")
    if not project.shots:
        raise HTTPException(status_code=400, detail="暂无分镜，请先生成")
    project.status = ProjectStatus.AUDIOING
    project.progress = 80
    project.error_msg = None
    project.final_video_url = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        task_type="project_regen_audio",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/upload-video", response_model=ShotOut)
async def upload_shot_video(
    project_id: int,
    shot_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Shot:
    """Upload a video file manually to replace/set a shot's video_url."""
    from app.models import ShotStatus

    project = await _get_owned_project(db, project_id, user)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if shot is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy cảnh")

    content_type = (file.content_type or "").lower()
    allowed_mime = {
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/quicktime": ".mov",
        "video/x-matroska": ".mkv",
        "video/mpeg": ".mpeg",
    }
    ext = allowed_mime.get(content_type)
    if not ext:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix in {".mp4", ".webm", ".mov", ".mkv", ".mpeg"}:
            ext = suffix
        else:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ MP4, WebM, MOV, MKV")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Tập tin rỗng")
    max_size = 500 * 1024 * 1024  # 500 MB
    if len(raw) > max_size:
        raise HTTPException(status_code=400, detail="Video không được vượt quá 500MB")

    filename = f"shot_{shot_id}_manual{ext}"
    dest = storage.project_dir(project_id) / filename
    dest.write_bytes(raw)
    video_url = storage.publish_local(dest)

    shot.video_url = video_url
    shot.status = ShotStatus.VIDEO_READY
    await db.commit()
    await db.refresh(shot)
    return shot

