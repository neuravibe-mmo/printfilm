"""API công cụ soạn thảo độc lập: /api/tools/*"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import ToolRun, User
from app.schemas_tools import ToolRunListOut, ToolRunOut, ToolRunRecordOut, ToolTaskOut
from app.services.billing import run_billed_ephemeral_deferred, settle_deferred_video_poll
from app.services.studio_tools import (
    enqueue_image_tool,
    get_tool_run,
    list_tool_runs,
    persist_tool_run,
    poll_image_tool_task,
    poll_video_task,
    save_upload,
    start_video_tool,
    update_tool_run_task,
)

router = APIRouter(prefix="/tools", tags=["tools"])

IMAGE_TOOLS = {"t2i", "i2i", "i2p", "ecom"}
VIDEO_TOOLS = {"t2v", "v2v"}


# Gửi công cụ tạo công cụ độc lập (hình ảnh được tạo trên nền tảng tác vụ thống nhất; việc tạo video trả về Seedance task_id để bỏ phiếu)
@router.post("/run", response_model=ToolRunOut)
async def run_tool(
    tool_id: str = Form(...),
    prompt: str = Form(""),
    negative: str = Form(""),
    ratio: str = Form(""),
    strength: str = Form(""),
    mode: str = Form(""),
    pack: str = Form(""),
    duration: str = Form(""),
    motion: str = Form(""),
    files: list[UploadFile] | None = File(default=None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ToolRunOut:
    tid = (tool_id or "").strip()
    saved: list[Path] = []
    tool_params = {
        "negative": negative,
        "ratio": ratio,
        "strength": strength,
        "mode": mode,
        "pack": pack,
        "duration": duration,
        "motion": motion,
    }
    try:
        for item in files or []:
            raw = await item.read()
            if not raw:
                continue
            if len(raw) > 40 * 1024 * 1024:
                raise ValueError("单个文件不能超过 40MB")
            saved.append(save_upload(user.id, raw, item.filename or "upload.bin"))
        if tid in IMAGE_TOOLS:
            try:
                data = await enqueue_image_tool(
                    db,
                    user,
                    tool_id=tid,
                    prompt=prompt,
                    negative=negative,
                    ratio=ratio or None,
                    strength=strength or None,
                    mode=mode or None,
                    pack=pack or None,
                    files=saved,
                    params=tool_params,
                )
            except ValueError as exc:
                raise HTTPException(status_code=402, detail=str(exc)) from exc
        elif tid in VIDEO_TOOLS:
            async def _exec_video() -> dict:
                return await start_video_tool(
                    db,
                    user,
                    tool_id=tid,
                    prompt=prompt,
                    ratio=ratio or None,
                    duration_raw=duration or None,
                    motion=motion or None,
                    files=saved,
                )

            try:
                billing_task, data = await run_billed_ephemeral_deferred(
                    db,
                    user,
                    domain="studio",
                    task_type="tool_video",
                    executor=_exec_video,
                    payload=tool_params,
                    commit=False,
                )
            except ValueError as exc:
                raise HTTPException(status_code=402, detail=str(exc)) from exc
            data = {**data, "billing_task_id": billing_task.id}
            await persist_tool_run(
                db,
                user_id=user.id,
                tool_id=tid,
                prompt=prompt,
                params={**tool_params, "billing_task_id": billing_task.id},
                data=data,
            )
        else:
            raise ValueError("未知工具")
        await db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)[:400]) from exc
    return ToolRunOut.model_validate(data)


# Các tác vụ không đồng bộ của công cụ truy vấn (nền tảng tác vụ tạo hình ảnh / Seedance tạo video) và ghi lại các bản ghi tạo
@router.get("/tasks/{task_id}", response_model=ToolTaskOut)
async def get_tool_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ToolTaskOut:
    if not task_id.strip():
        raise HTTPException(status_code=400, detail="缺少任务")
    tid = task_id.strip()
    row = (
        await db.execute(
            select(ToolRun).where(ToolRun.user_id == user.id, ToolRun.task_id == tid).limit(1)
        )
    ).scalar_one_or_none()
    billing_task_id: int | None = None
    # Nếu không có hồ sơ quyền sở hữu cục bộ, nó sẽ bị từ chối: task_id ngược dòng có thể được đoán và chuyển bởi những người không phải là chủ sở hữu.
    # Không thể truy vấn ngược dòng mà không có thông tin xác thực ghi công (URL video sẽ được kéo).
    if not row:
        raise HTTPException(status_code=404, detail="任务不存在")
    if isinstance(row.params, dict):
        raw_bid = row.params.get("billing_task_id")
        if raw_bid is not None:
            try:
                billing_task_id = int(raw_bid)
            except (TypeError, ValueError):
                billing_task_id = None
    if row.kind == "image":
        data = await poll_image_tool_task(db, user, tid)
    else:
        data = await poll_video_task(user, tid)
        await settle_deferred_video_poll(
            db,
            user,
            provider_task_id=tid,
            poll_status=str(data.get("status") or ""),
            error=str(data.get("error") or "") or None,
            billing_task_id=billing_task_id,
            usage_tokens=int((data.get("usage") or {}).get("total_tokens") or 0),
            completion_tokens=int((data.get("usage") or {}).get("completion_tokens") or 0),
            raw_usage=data.get("raw_usage") if isinstance(data.get("raw_usage"), dict) else None,
        )
    await update_tool_run_task(db, user.id, tid, data)
    await db.commit()
    return ToolTaskOut.model_validate(data)


# Chuyển đổi bản ghi ORM thành danh sách/chi tiết (ISO được sử dụng cho thời gian)
def _record_out(row: ToolRun) -> ToolRunRecordOut:
    created = row.created_at.isoformat() if row.created_at else ""
    return ToolRunRecordOut(
        id=row.id,
        tool_id=row.tool_id,
        kind=row.kind,
        status=row.status,
        prompt=row.prompt or "",
        preview_url=row.preview_url,
        urls=list(row.urls or []),
        task_id=row.task_id,
        params=row.params if isinstance(row.params, dict) else None,
        error=row.error,
        created_at=created,
    )


# Trung tâm cá nhân: Bản ghi tạo công cụ của người dùng hiện tại (phân trang phía máy chủ)
@router.get("/runs", response_model=ToolRunListOut)
async def list_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ToolRunListOut:
    rows, total = await list_tool_runs(db, user.id, page=page, page_size=page_size)
    await db.commit()
    return ToolRunListOut(
        items=[_record_out(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


# Trung tâm cá nhân: Chi tiết tạo đơn lẻ (bao gồm địa chỉ kết quả OSS)
@router.get("/runs/{run_id}", response_model=ToolRunRecordOut)
async def get_run(
    run_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ToolRunRecordOut:
    row = await get_tool_run(db, user.id, run_id)
    if not row:
        raise HTTPException(status_code=404, detail="记录不存在")
    await db.commit()
    return _record_out(row)
