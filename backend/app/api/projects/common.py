from __future__ import annotations

import logging
from typing import Any
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.deps import get_current_user
from app.models import Project, ProjectStatus, User
from app.schemas_tasks import TaskCreateRequest, TaskTargetBind
from app.services.billing.http import http_exception_for_value_error
from app.services.kepu_stages import resolve_kepu_billing_phase
from app.services.tasks.service import (
    ACTIVE_TASK_STATUSES,
    create_task,
    list_active_tasks_for_owner,
)

logger = logging.getLogger(__name__)

_RUNNING_STATUSES = {
    ProjectStatus.SCRIPTING,
    ProjectStatus.IMAGING,
    ProjectStatus.VIDEOING,
    ProjectStatus.AUDIOING,
    ProjectStatus.COMPOSING,
    ProjectStatus.AUDITING,
}

_PROJECT_WIDE_TASK_TYPES = {
    "project_pipeline",
    "project_compose_only",
    "project_regen_audio",
    "shot_regen_audio",
}


def _demote_after_edit(project: Project) -> None:
    """Sau khi thay đổi camera/nhạc phim, trạng thái được cập nhật tương ứng."""
    project.final_video_url = None
    if project.status not in {
        ProjectStatus.DONE,
        ProjectStatus.AUDITING,
        ProjectStatus.COMPOSING,
        ProjectStatus.VIDEO_READY,
        ProjectStatus.FAILED,
        ProjectStatus.CANCELLED,
    }:
        return
    phase = resolve_kepu_billing_phase(project)
    if phase == "script":
        project.status = ProjectStatus.SCRIPT_READY if project.shots else ProjectStatus.DRAFT
    elif phase == "assets":
        project.status = ProjectStatus.SCRIPT_READY
    elif phase == "videos":
        project.status = ProjectStatus.IMAGE_READY
    else:
        project.status = ProjectStatus.VIDEO_READY


async def _get_owned_project(db: AsyncSession, project_id: int, user: User) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.user_id == user.id)
        .options(selectinload(Project.shots))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Dự án không tồn tại")
    project.active_tasks = await list_active_tasks_for_owner(db, user.id, project_id=project.id)
    runtime_status, runtime_progress, runtime_error = _project_runtime_view(project)
    project.status = runtime_status
    project.progress = runtime_progress
    project.error_msg = runtime_error
    return project


def _image_ext_from_magic(raw: bytes) -> str:
    """Xác định phần mở rộng hình ảnh dựa trên magic bytes."""
    if raw.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if raw.startswith(b"GIF87a") or raw.startswith(b"GIF89a"):
        return ".gif"
    if len(raw) >= 12 and raw.startswith(b"RIFF") and raw[8:12] == b"WEBP":
        return ".webp"
    return ""


def _ensure_side_task_allowed(project: Project) -> None:
    """Nhiệm vụ phụ bị từ chối trước khi toàn bộ nhiệm vụ được hoàn thành."""
    for task in getattr(project, "active_tasks", []) or []:
        if str(getattr(task, "status", "") or "") not in ACTIVE_TASK_STATUSES:
            continue
        if str(getattr(task, "task_type", "") or "") in _PROJECT_WIDE_TASK_TYPES:
            raise HTTPException(status_code=409, detail="Dự án đang tạo toàn bộ, vui lòng thử lại sau")


async def _ensure_compose_allowed(db: AsyncSession, user: User, project: Project) -> None:
    active = await list_active_tasks_for_owner(db, user.id, project_id=project.id)
    if active:
        raise HTTPException(status_code=409, detail="Tiến trình đang chạy, vui lòng thử lại sau")
    running = {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.AUDITING,
    }
    if project.status in running:
        raise HTTPException(status_code=409, detail="Tiến trình đang chạy, vui lòng thử lại sau")


def _project_runtime_view(project: Project) -> tuple[str, int, str | None]:
    active_tasks = list(getattr(project, "active_tasks", []) or [])
    if not active_tasks:
        return str(project.status), int(project.progress or 0), project.error_msg
    task = active_tasks[0]
    task_type = str(getattr(task, "task_type", "") or "")
    status = str(getattr(task, "status", "") or "")
    progress = int(getattr(task, "progress_percent", 0) or 0)
    if task_type == "project_pipeline":
        label = ProjectStatus.SCRIPTING
    elif task_type == "shot_regen_image":
        label = ProjectStatus.IMAGING
    elif task_type == "shot_regen_video":
        label = ProjectStatus.VIDEOING
    elif task_type == "shot_regen_audio":
        label = ProjectStatus.AUDIOING
    elif task_type == "project_regen_audio":
        label = ProjectStatus.AUDIOING
    elif task_type == "project_compose_only":
        label = ProjectStatus.COMPOSING
    else:
        label = str(project.status)
    if status in {"failed", "cancelled"}:
        return status.upper(), progress, getattr(task, "error_message", None) or project.error_msg
    if status in {"pending", "leased", "running", "awaiting_poll", "cancel_requested"}:
        return label, max(progress, int(project.progress or 0)), getattr(task, "error_message", None)
    return str(project.status), int(project.progress or 0), project.error_msg


async def _create_kepu_task(
    db: AsyncSession,
    user: User,
    *,
    project_id: int,
    task_type: str,
    shot_id: int | None = None,
    payload: dict | None = None,
) -> int:
    targets = [TaskTargetBind(target_type="project", target_id=project_id)]
    if shot_id is not None:
        targets.append(TaskTargetBind(target_type="shot", target_id=shot_id))
    try:
        task = await create_task(
            db,
            user,
            TaskCreateRequest(
                domain="kepu",
                task_type=task_type,
                dedupe_key=f"kepu:{task_type}:project:{project_id}:shot:{shot_id or 0}",
                payload={"project_id": project_id, "shot_id": shot_id, **(payload or {})},
                project_id=project_id,
                shot_id=shot_id,
                targets=targets,
            ),
        )
    except ValueError as exc:
        await db.rollback()
        raise http_exception_for_value_error(exc) from exc
    return int(task.id)


async def list_active_tasks_for_user_rows(
    db: AsyncSession,
    user_id: int,
    project_ids: list[int],
) -> dict[int, list]:
    by_project_id: dict[int, list] = {}
    for project_id in project_ids:
        by_project_id[int(project_id)] = await list_active_tasks_for_owner(
            db,
            user_id,
            project_id=int(project_id),
        )
    return by_project_id
