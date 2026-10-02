"""Unified task platform API: /api/tasks/*."""

from __future__ import annotations
import asyncio

from app.config import get_settings
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas_tasks import MockDelayTaskRequest, TaskCreateRequest, TaskListOut, TaskRunOut
from app.services.billing.http import http_exception_for_value_error
from app.services.tasks.service import (
    cancel_task_for_user,
    count_active_tasks_for_user,
    create_task,
    get_task_for_user,
    list_tasks_for_user,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])
_mock_delay_create_lock = asyncio.Lock()


# Tạo một tác vụ mô phỏng bị trì hoãn để tạo điều kiện cho việc gỡ lỗi chung của nền tảng tác vụ.
@router.post("/mock-delay", response_model=TaskRunOut)
async def create_mock_delay_task(
    body: MockDelayTaskRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskRunOut:
    settings = get_settings()
    if not settings.ark_mock and str(user.role or "") != "admin":
        raise HTTPException(status_code=404, detail="任务不存在")
    try:
        async with _mock_delay_create_lock:
            active_count = await count_active_tasks_for_user(
                db,
                user,
                domain="tools",
                task_type="mock_delay",
            )
            if active_count >= 3:
                raise HTTPException(status_code=429, detail="模拟延时任务最多同时运行 3 个")
            task = await create_task(
                db,
                user,
                TaskCreateRequest(
                    domain="tools",
                    task_type="mock_delay",
                    dedupe_key=body.dedupe_key,
                    payload={
                        "delay_seconds": body.delay_seconds,
                        "succeed": body.succeed,
                        "result_payload": body.result_payload,
                        "error_message": body.error_message,
                    },
                ),
            )
    except ValueError as exc:
        raise http_exception_for_value_error(exc) from exc
    return TaskRunOut.model_validate(task)


# Truy vấn chi tiết của một nhiệm vụ (bao gồm các bước/mục tiêu/sự kiện)
@router.get("/{task_id}", response_model=TaskRunOut)
async def get_task_run(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskRunOut:
    try:
        task = await get_task_for_user(db, user, task_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="任务不存在") from exc
    return TaskRunOut.model_validate(task)


# Danh sách nhiệm vụ thống nhất cho người dùng hiện tại, hỗ trợ lọc thứ nguyên miền/mục tiêu/dự án
@router.get("", response_model=TaskListOut)
async def list_task_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    domain: str | None = Query(default=None),
    status: str | None = Query(default=None),
    task_type: str | None = Query(default=None),
    target_type: str | None = Query(default=None),
    target_id: int | None = Query(default=None, ge=1),
    project_id: int | None = Query(default=None, ge=1),
    drama_project_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskListOut:
    rows, total = await list_tasks_for_user(
        db,
        user,
        page=page,
        page_size=page_size,
        domain=domain,
        status=status,
        task_type=task_type,
        target_type=target_type,
        target_id=target_id,
        project_id=project_id,
        drama_project_id=drama_project_id,
    )
    return TaskListOut(
        items=[TaskRunOut.model_validate(item) for item in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


# Mục hủy hợp nhất: đánh dấu cancel_requested và chờ cộng tác thời gian chạy hội tụ
@router.post("/{task_id}/cancel", response_model=TaskRunOut)
async def cancel_task_run(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskRunOut:
    try:
        task = await cancel_task_for_user(db, user, task_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="任务不存在") from exc
    except ValueError as exc:
        raise http_exception_for_value_error(exc) from exc
    return TaskRunOut.model_validate(task)




