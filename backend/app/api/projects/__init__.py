from __future__ import annotations

from fastapi import APIRouter

from .common import (
    _RUNNING_STATUSES,
    _create_kepu_task,
    _demote_after_edit,
    _ensure_compose_allowed,
    _ensure_side_task_allowed,
    _get_owned_project,
    _image_ext_from_magic,
    _project_runtime_view,
    get_current_user,
    list_active_tasks_for_user_rows,
)
from .crud import router as crud_router
from .pipeline import router as pipeline_router
from .references import router as references_router
from .shots import router as shots_router, update_shot

router = APIRouter(tags=["projects"])

# Order matters: register specific sub-paths before parametric /{project_id} where applicable
router.include_router(references_router)
router.include_router(crud_router)
router.include_router(shots_router)
router.include_router(pipeline_router)

__all__ = [
    "router",
    "update_shot",
    "_ensure_side_task_allowed",
    "_ensure_compose_allowed",
    "_demote_after_edit",
    "_get_owned_project",
    "_RUNNING_STATUSES",
    "_project_runtime_view",
    "_create_kepu_task",
    "_image_ext_from_magic",
    "list_active_tasks_for_user_rows",
    "get_current_user",
]
