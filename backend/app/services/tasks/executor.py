"""In-process task executor for the de-workerized task platform."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

from app.database import AsyncSessionLocal
from app.services.billing.context import billing_scope
from app.services.billing.settlement import freeze_for_task, settle_task
from app.services.tasks.handlers import get_task_handler
from app.services.tasks.service import append_task_event, get_task_for_runtime, set_task_step_state

logger = logging.getLogger(__name__)


# Thực hiện một tác vụ duy nhất và ghi lại trạng thái nền tảng.
async def execute_task_run(task_id: int) -> None:
    async with AsyncSessionLocal() as db:
        task = await get_task_for_runtime(db, task_id)
        if not task:
            return
        if task.cancel_requested and task.status == "cancel_requested":
            await _mark_cancelled(db, task)
            return
        handler = get_task_handler(task.domain, task.task_type)
        if handler is None:
            task.status = "failed"
            task.error_code = "handler_missing"
            task.error_message = f"未注册任务处理器: {task.domain}/{task.task_type}"
            task.finished_at = datetime.now(UTC)
            # Không bị khấu trừ, không giữ lại
            task.billing_status = "none"
            await append_task_event(
                db,
                task.id,
                event_type="task.failed",
                status=task.status,
                phase=task.current_step_key,
                message=task.error_message,
            )
            await db.commit()
            return

        # Đọc các bước trước Freeze_for_task: _lock_task(populate_being=True)
        # sẽ xóa mối quan hệ được tải trước và sau đó truy cập task.steps sẽ kích hoạt tải chậm không đồng bộ và ném MissingGreenlet.
        step = task.steps[0] if task.steps else None

        try:
            await freeze_for_task(db, task)
        except ValueError as exc:
            # Số dư không đủ: Có thể xảy ra lỗi. Mã lỗi chuyên dụng tạo điều kiện thuận lợi cho hướng dẫn phía trước về việc sạc lại.
            await _fail_task_before_start(
                db, task, step, error_code="insufficient_balance", message=str(exc)
            )
            return
        except Exception as exc:  # noqa: BLE001
            # Non-ValueError chẳng hạn như DB bị gián đoạn tức thời không thể thoát trần: nếu không tác vụ sẽ bị kẹt vĩnh viễn trong Rented và chỉ có thể đợi chu trình giám sát tìm ra.
            logger.exception("freeze_for_task failed task_id=%s", task.id)
            from app.services.exc_format import format_exception_message

            await _fail_task_before_start(
                db,
                task,
                step,
                error_code=type(exc).__name__,
                message=format_exception_message(exc, fallback="预扣失败", limit=500),
            )
            return

        now = datetime.now(UTC)
        task.status = "running"
        task.started_at = task.started_at or now
        task.next_action_at = None
        task.lease_until = None
        set_task_step_state(task, step, status="submitting", now=now)
        await append_task_event(
            db,
            task.id,
            event_type="task.started",
            status=task.status,
            phase=task.current_step_key,
            message="任务开始执行",
        )
        await db.commit()

    try:
        async with billing_scope(task_id):
            async with AsyncSessionLocal() as db:
                task = await get_task_for_runtime(db, task_id)
                if not task:
                    return
                handler = get_task_handler(task.domain, task.task_type)
                result = await handler.executor(task) if handler else {"ok": False, "error": "missing_handler"}
                # Tải lại (bao gồm các bước chọn tải); không làm mới, nó sẽ xóa mối quan hệ và kích hoạt tải chậm.
                task = await get_task_for_runtime(db, task_id)
                if not task:
                    return
                if isinstance(result, dict) and (result.get("deferred") or result.get("awaiting_poll")):
                    await db.commit()
                    return
                if task.status == "awaiting_poll":
                    await db.commit()
                    return
                if isinstance(result, dict) and result.get("cancelled"):
                    await _mark_cancelled(db, task)
                    return
                # Trình xử lý phải không hội tụ khi trả về ok:Sai (không coi là thành công)
                if isinstance(result, dict) and result.get("ok") is False:
                    err_text = str(result.get("error") or "任务执行失败").strip()[:500] or "任务执行失败"
                    await _fail_task(db, task, RuntimeError(err_text))
                    return
                await _complete_task(db, task, result or {"ok": True})
    except asyncio.CancelledError:
        async with AsyncSessionLocal() as db:
            task = await get_task_for_runtime(db, task_id)
            if task:
                if task.cancel_requested:
                    await _mark_cancelled(db, task)
                else:
                    await _requeue_interrupted_task(db, task)
        raise
    except Exception as exc:  # noqa: BLE001
        async with AsyncSessionLocal() as db:
            task = await get_task_for_runtime(db, task_id)
            if task:
                await _fail_task(db, task, exc)


# Hội tụ nhiệm vụ đến trạng thái thành công.
async def _complete_task(db, task, result: dict) -> None:
    now = datetime.now(UTC)
    step = task.steps[0] if task.steps else None
    set_task_step_state(task, step, status="done", now=now)
    task.status = "cancelled" if task.cancel_requested else "succeeded"
    task.progress_percent = 100 if task.status == "succeeded" else task.progress_percent
    task.result_payload = result
    task.error_code = None
    task.error_message = None
    task.finished_at = now
    await append_task_event(
        db,
        task.id,
        event_type="task.completed" if task.status == "succeeded" else "task.cancelled",
        status=task.status,
        phase=task.current_step_key,
        message="任务执行完成" if task.status == "succeeded" else "任务已取消",
        payload=result,
    )
    try:
        await settle_task(db, task.id)
    except Exception:  # noqa: BLE001
        logger.exception("settle_task failed task_id=%s", task.id)
    await db.commit()


# Không thể hội tụ trong giai đoạn giữ lại (trình xử lý chưa được thực thi): _lock_task(populate_being) đã bị xóa tại thời điểm này
# Mối quan hệ Task.steps, task.steps[0] không thể truy cập được như _fail_task, bước này được người gọi đọc trước và chuyển vào.
async def _fail_task_before_start(db, task, step, *, error_code: str, message: str) -> None:
    now = datetime.now(UTC)
    set_task_step_state(task, step, status="failed", now=now)
    task.status = "failed"
    task.error_code = error_code
    task.error_message = message[:500]
    task.finished_at = now
    # Các trường hợp ngoại lệ sau khi bị đóng băng (chẳng hạn như không rơi xuống nước) vẫn bị đóng băng và được gửi đến giải quyết_task để đối chiếu; nếu việc khấu trừ không thành công thì không giữ lại
    if task.billing_status != "frozen":
        task.billing_status = "none"
    await append_task_event(
        db,
        task.id,
        event_type="task.failed",
        status=task.status,
        phase=task.current_step_key,
        message=task.error_message,
    )
    # Tạo hình ảnh/video nội dung: Ghi lại nội dung một cách đồng bộ để tránh giao diện người dùng chỉ nhìn thấy "tạo hình ảnh không thành công"
    await _fail_drama_asset_generation_if_needed(db, task, task.error_message)
    try:
        await settle_task(db, task.id)
    except Exception:  # noqa: BLE001
        logger.exception("settle_task failed task_id=%s", task.id)
    await db.commit()


# Hội tụ nhiệm vụ về trạng thái không thành công.
async def _fail_task(db, task, exc: Exception) -> None:
    from app.services.exc_format import format_exception_message

    now = datetime.now(UTC)
    step = task.steps[0] if task.steps else None
    set_task_step_state(task, step, status="failed", now=now)
    task.status = "failed"
    task.error_code = type(exc).__name__
    task.error_message = format_exception_message(exc, fallback="任务执行失败", limit=500)
    task.finished_at = now
    await append_task_event(
        db,
        task.id,
        event_type="task.failed",
        status=task.status,
        phase=task.current_step_key,
        message=task.error_message,
    )
    # Tạo hình ảnh/video nội dung: Ghi lại nội dung một cách đồng bộ để tránh giao diện người dùng chỉ nhìn thấy "tạo hình ảnh không thành công"
    await _fail_drama_asset_generation_if_needed(db, task, task.error_message or str(exc))
    if task.fragment_id:
        from app.models_drama import DramaEpisodeFragment
        from app.services.drama.generation import build_failed_generation_params

        frag = await db.get(DramaEpisodeFragment, int(task.fragment_id))
        if frag:
            params = dict(frag.params or {})
            prev_gen = params.get("generation") if isinstance(params.get("generation"), dict) else None
            # Giữ root_error (để tránh những lý do thực sự như "thử lại nội bộ vượt quá giới hạn" che đậy việc đánh giá của người thực)
            params["generation"] = build_failed_generation_params(
                prev_gen if isinstance(prev_gen, dict) else None,
                task.error_message or str(exc),
            )
            frag.params = params
    if task.domain == "kepu" and task.project_id:
        from app.models import Project, ProjectStatus

        running = {
            ProjectStatus.SCRIPTING,
            ProjectStatus.IMAGING,
            ProjectStatus.VIDEOING,
            ProjectStatus.AUDIOING,
            ProjectStatus.COMPOSING,
            ProjectStatus.AUDITING,
        }
        project = await db.get(Project, int(task.project_id))
        if project and project.status in running:
            project.status = ProjectStatus.FAILED
            project.error_msg = (task.error_message or str(exc))[:2000]
    payload = task.payload if isinstance(task.payload, dict) else {}
    if payload.get("sequential") and task.batch_key:
        from app.services.tasks.service import fail_remaining_sequential_batch

        batch_index = int(payload.get("batch_index", 0))
        await fail_remaining_sequential_batch(
            db,
            task.batch_key,
            batch_index,
            "上一镜失败，无法衔接尾帧",
        )
    try:
        await settle_task(db, task.id)
    except Exception:  # noqa: BLE001
        logger.exception("settle_task failed task_id=%s", task.id)
    await db.commit()


# Hội tụ tác vụ về trạng thái bị hủy.
async def _mark_cancelled(db, task) -> None:
    # Quá trình hoàn thiện nhường chỗ trong cửa sổ hoàn thiện: coroutine của người thăm dò có thể đang tải xuống phim và triển khai cách sử dụng thực tế.
    # Tại thời điểm này, việc hoàn lại toàn bộ số tiền sẽ khiến các sự kiện sử dụng bị bỏ trống và tiền cũng như hàng hóa sẽ bị mất; coroutine sẽ được giải quyết theo quyết toán thực tế hoặc quay trở lại bỏ phiếu.
    # Nhiệm vụ vẫn bị hủy_requested, bộ lập lịch sẽ thử lại ở vòng tiếp theo và đảm bảo thời lượng TTL (10 phút).
    from app.services.tasks.service import task_finalizing_window_open

    if task_finalizing_window_open(task):
        logger.info(
            "cancel deferred: task %s inside finalizing window, poller will settle",
            task.id,
        )
        return
    now = datetime.now(UTC)
    step = task.steps[0] if task.steps else None
    set_task_step_state(task, step, status="cancelled", now=now)
    task.status = "cancelled"
    task.finished_at = now
    task.next_action_at = None
    task.lease_until = None
    await append_task_event(
        db,
        task.id,
        event_type="task.cancelled",
        status=task.status,
        phase=task.current_step_key,
        message="任务已取消",
    )
    try:
        await settle_task(db, task.id)
    except Exception:  # noqa: BLE001
        logger.exception("settle_task failed task_id=%s", task.id)
    await db.commit()


async def _fail_drama_asset_generation_if_needed(db, task, error: str) -> None:
    """Nhiệm vụ không thành công trước khi bắt đầu thực thi và trạng thái tạo nội dung truyện tranh được cập nhật đồng thời."""
    if (task.domain or "") != "drama" or not task.asset_id:
        return
    if (task.task_type or "") not in {"asset_image", "asset_video"}:
        return
    from app.models_drama import DramaAsset

    asset = await db.get(DramaAsset, int(task.asset_id))
    if not asset:
        return
    msg = (error or "").strip() or "生成失败"
    params = dict(asset.params or {})
    params["generation"] = {"status": "failed", "error": msg[:400]}
    asset.params = params


# Khi ứng dụng được khởi động lại hoặc cập nhật nóng bị gián đoạn, tác vụ sẽ được đưa trở lại trạng thái thực thi đang chờ xử lý.
async def _requeue_interrupted_task(db, task) -> None:
    now = datetime.now(UTC)
    step = task.steps[0] if task.steps else None
    set_task_step_state(task, step, status="pending", now=now)
    task.status = "pending"
    task.next_action_at = now
    task.lease_token = None
    task.lease_until = None
    await append_task_event(
        db,
        task.id,
        event_type="task.requeued",
        status=task.status,
        phase=task.current_step_key,
        message="任务被中断，已重新排队",
    )
    await db.commit()
