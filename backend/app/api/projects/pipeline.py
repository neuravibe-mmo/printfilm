from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Project, ProjectStatus, Shot, UsageEvent, User, Work
from app.models_tasks import TaskRun
from app.schemas import ProjectOut, WorkOut
from app.schemas_tasks import TaskCreateRequest, TaskTargetBind
from app.services import pipeline
from app.services.billing.http import http_exception_for_value_error
from app.services.kepu_stages import resolve_kepu_billing_phase
from app.services.progress import redis_bridge, subscribe, unsubscribe
from app.services.tasks.service import cancel_tasks_for_scope, create_task

from .common import (
    _create_kepu_task,
    _ensure_compose_allowed,
    _get_owned_project,
    get_current_user,
)

router = APIRouter()


@router.post("/projects/{project_id}/generate", response_model=ProjectOut)
async def generate_project(
    project_id: int,
    restart: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Start or resume the pipeline.

    - First run / restart: script stage only, then pauses at SCRIPT_READY for review.
    - Continue: one billing stage per click — assets → videos → compose（各自预扣）。
    - restart=true: wipe shots/media and regenerate storyboard from scratch.
    """
    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="Tiến trình đang chạy, vui lòng thử lại sau")

    if restart:
        shot_ids = [s.id for s in project.shots]
        if shot_ids:
            await db.execute(
                update(TaskRun).where(TaskRun.shot_id.in_(shot_ids)).values(shot_id=None)
            )
        for shot in list(project.shots):
            await db.delete(shot)
        await db.flush()
        await pipeline.delete_project_assets(project_id)
        project.cover_url = None

    # Resume: clear error, keep existing shots/media (pipeline skips finished stages)
    project.error_msg = None
    project.final_video_url = None
    shots = list(project.shots or [])
    phase = "script" if (restart or not shots) else resolve_kepu_billing_phase(project)
    if phase == "compose":
        # Sử dụng các tác vụ soạn thảo chuyên dụng để tránh project_pipeline liên tục giữ lại toàn bộ video
        raise HTTPException(status_code=409, detail="Tất cả phân cảnh đã hoàn tất, vui lòng bấm Ghép video hoàn chỉnh")
    if restart or not shots:
        # First run / restart — actually splitting storyboard
        project.status = ProjectStatus.SCRIPTING
        project.progress = 1
    elif phase == "assets":
        project.status = ProjectStatus.IMAGING
        project.progress = max(project.progress or 0, 18)
    elif phase == "videos":
        project.status = ProjectStatus.VIDEOING
        project.progress = max(project.progress or 0, 55)
    try:
        await create_task(
            db,
            user,
            TaskCreateRequest(
                domain="kepu",
                task_type="project_pipeline",
                dedupe_key=f"kepu:project_pipeline:{project_id}:{int(bool(restart))}:{phase}",
                payload={
                    "project_id": project_id,
                    "restart": bool(restart),
                    "phase": phase,
                    "pipeline_mode": project.pipeline_mode or "full",
                },
                project_id=project_id,
                targets=[
                    TaskTargetBind(target_type="project", target_id=project_id),
                ],
            ),
        )
    except ValueError as exc:
        await db.rollback()
        raise http_exception_for_value_error(exc) from exc
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/cancel", response_model=ProjectOut)
async def cancel_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    running = {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }
    if project.status not in running:
        raise HTTPException(status_code=400, detail="当前状态不可取消")

    await cancel_tasks_for_scope(db, user.id, project_id=project_id)
    pipeline.cancel_pipeline(project_id)
    project.status = ProjectStatus.CANCELLED
    project.error_msg = "用户取消"
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Delete a kepu project after detaching billing/task FK rows that block CASCADE."""
    project = await _get_owned_project(db, project_id, user)
    running = {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }
    if project.status in running:
        pipeline.cancel_pipeline(project_id)
        await cancel_tasks_for_scope(db, user.id, project_id=project_id)

    # Keep billing/task history; only clear project FK and child shot FKs so DELETE projects can succeed.
    shot_ids = select(Shot.id).where(Shot.project_id == project.id)
    await db.execute(
        update(TaskRun).where(TaskRun.shot_id.in_(shot_ids)).values(shot_id=None)
    )
    await db.execute(
        update(UsageEvent).where(UsageEvent.project_id == project.id).values(project_id=None)
    )
    await db.execute(
        update(TaskRun).where(TaskRun.project_id == project.id).values(project_id=None, shot_id=None)
    )

    # Remove published work if any
    work_result = await db.execute(select(Work).where(Work.project_id == project.id))
    work = work_result.scalar_one_or_none()
    if work:
        await db.delete(work)

    await pipeline.delete_project_assets(project_id)
    await db.delete(project)
    await db.commit()
    return {"ok": True, "id": project_id}


@router.get("/projects/{project_id}/events")
async def project_events(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_project(db, project_id, user)
    queue = subscribe(project_id)
    bridge = asyncio.create_task(redis_bridge(project_id, queue))

    async def event_generator():
        try:
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {"event": "message", "data": json.dumps(payload, ensure_ascii=False)}
                    if payload.get("event") in {"done", "failed"}:
                        break
                except TimeoutError:
                    yield {"event": "ping", "data": "{}"}
        finally:
            bridge.cancel()
            unsubscribe(project_id, queue)

    return EventSourceResponse(event_generator())


@router.post("/projects/{project_id}/compose", response_model=ProjectOut)
async def compose_only(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Recompose final video from existing images/audio/(videos)."""
    project = await _get_owned_project(db, project_id, user)
    await _ensure_compose_allowed(db, user, project)
    if not project.shots or not (
        any(s.image_url for s in project.shots) or any(s.video_url for s in project.shots)
    ):
        raise HTTPException(status_code=400, detail="缺少分镜图或镜头视频，无法合成")
    project.status = ProjectStatus.COMPOSING
    project.progress = 90
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        task_type="project_compose_only",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/publish", response_model=WorkOut)
async def publish_work(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Work:
    project = await _get_owned_project(db, project_id, user)
    if project.status != ProjectStatus.DONE or not project.final_video_url:
        raise HTTPException(status_code=400, detail="成片未完成，无法发布")
    existing = await db.execute(select(Work).where(Work.project_id == project.id))
    work = existing.scalar_one_or_none()
    if work:
        work.title = project.title
        work.cover_url = project.cover_url
        work.video_url = project.final_video_url
    else:
        work = Work(
            project_id=project.id,
            user_id=user.id,
            title=project.title,
            cover_url=project.cover_url,
            video_url=project.final_video_url,
        )
        db.add(work)
    await db.commit()
    await db.refresh(work)
    return work


@router.get("/works", response_model=list[WorkOut])
async def list_works(db: AsyncSession = Depends(get_db)) -> list[Work]:
    result = await db.execute(
        select(Work).where(Work.visibility == "public").order_by(Work.id.desc()).limit(50)
    )
    return list(result.scalars().all())


@router.get("/quota")
async def quota(user: User = Depends(get_current_user)) -> dict:
    from app.config import get_settings

    settings = get_settings()
    return {
        "quota_left": user.quota_left,
        "quota_enabled": settings.quota_enabled,
        "unlimited": not settings.billing_enabled,
        "billing_enabled": settings.billing_enabled,
        "balance_fen": int(getattr(user, "balance_fen", 0) or 0),
        "frozen_fen": int(getattr(user, "frozen_fen", 0) or 0),
        "balance_yuan": round(int(getattr(user, "balance_fen", 0) or 0) / 100, 2),
        "markup": settings.billing_markup,
    }
