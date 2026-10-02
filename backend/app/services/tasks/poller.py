"""Bộ chọn kiểu NIO: Các tác vụ ngược dòng chờ đợi bỏ phiếu không chặn tập trung."""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import UTC, datetime, timedelta

from sqlalchemy import or_, select

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models_tasks import TaskRun
from app.services.billing.settlement import settle_task
from app.services.tasks.service import append_task_event

# Phù hợp với trạng thái yêu cầu cuối cùng của drama.jobs: không rút ngắn next_action_at vẫn đang hoàn tất khi có ngoại lệ.
_FRAGMENT_FINALIZE_STEP = "finalizing"

logger = logging.getLogger("app.tasks.poller")

# Bộ điều khiển vòng lặp chọn, tín hiệu tắt, cổng đồng thời và nhịp tim
_poller_task: asyncio.Task | None = None
_stop_event = asyncio.Event()
_poll_inflight: set[int] = set()
_selector_sem: asyncio.Semaphore | None = None
_last_poll_mono: float = 0.0
_intentionally_stopped: bool = True


# Bắt đầu vòng kiểm tra vòng chọn của Bộ chọn.
async def start_poller() -> None:
    global _poller_task, _selector_sem, _intentionally_stopped, _last_poll_mono
    if _poller_task and not _poller_task.done():
        return
    _intentionally_stopped = False
    limit = max(1, int(get_settings().task_poll_max_concurrency or 20))
    _selector_sem = asyncio.Semaphore(limit)
    _stop_event.clear()
    _last_poll_mono = time.monotonic()
    _poller_task = asyncio.create_task(_poller_loop(), name="task-poller")


# Dừng vòng bỏ phiếu của Bộ chọn.
async def stop_poller() -> None:
    global _intentionally_stopped
    _intentionally_stopped = True
    _stop_event.set()
    if _poller_task and not _poller_task.done():
        _poller_task.cancel()
        try:
            await _poller_task
        except asyncio.CancelledError:
            pass


# Cơ quan giám sát sẽ đưa ra vòng lặp Selector bị kẹt hoặc đã thoát.
async def restart_poller_loop(*, reason: str = "watchdog") -> None:
    global _poller_task, _intentionally_stopped, _last_poll_mono, _selector_sem
    if _intentionally_stopped:
        return
    logger.warning("restarting task poller loop reason=%s", reason)
    _stop_event.set()
    if _poller_task and not _poller_task.done():
        _poller_task.cancel()
        try:
            await _poller_task
        except asyncio.CancelledError:
            pass
    limit = max(1, int(get_settings().task_poll_max_concurrency or 20))
    _selector_sem = asyncio.Semaphore(limit)
    _stop_event.clear()
    _last_poll_mono = time.monotonic()
    _poller_task = asyncio.create_task(_poller_loop(), name="task-poller")


# Trả về trạng thái hiện tại của Selector.
def poller_status() -> str:
    if _intentionally_stopped:
        return "stopped"
    if _poller_task and not _poller_task.done():
        return "running"
    return "stopped"


# Số giây kể từ khi cuộc thăm dò Bộ chọn cuối cùng được hoàn thành.
def poller_tick_age_sec() -> float:
    if _last_poll_mono <= 0:
        return 1e9
    return max(0.0, time.monotonic() - _last_poll_mono)


# Bộ chọn Liệu nhịp tim đã hết chưa.
def poller_tick_stale() -> bool:
    if _intentionally_stopped:
        return False
    poll_interval = max(1.0, float(get_settings().ark_video_poll_interval or 8.0))
    stale_sec = max(30.0, float(get_settings().task_poll_stale_sec), poll_interval * 4)
    if _poll_inflight:
        # Nhịp tim sẽ ngừng đập khi kéo thành một mảnh; thư giãn đến giới hạn trên của thời gian chờ đọc, nhưng vẫn phải kéo lên sau khi hết thời gian chờ
        stale_sec = max(stale_sec, 720.0)
    return poller_tick_age_sec() > stale_sec


# Vòng lặp chính của bộ chọn: kênh hết hạn chọn định kỳ.
async def _poller_loop() -> None:
    global _last_poll_mono
    interval = max(1.0, float(get_settings().ark_video_poll_interval or 8.0))
    while not _stop_event.is_set():
        _last_poll_mono = time.monotonic()
        try:
            # Không thể sử dụng Wait_for ngắn cho toàn bộ vòng chọn: quá trình tải xuống kết thúc bảng phân cảnh thường mất >80 giây và sẽ bị kẹt khi hoàn tất sau khi hủy.
            await _select_and_poll_due()
            await _poll_ephemeral_deferred_tasks()
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            logger.exception("task selector failed")
        finally:
            _last_poll_mono = time.monotonic()
        await asyncio.sleep(interval)


# Kéo các tác vụ đang chờ_poll đã hết hạn và đồng thời thăm dò không chặn (tương tự như NIO select + xử lý bộ sẵn sàng).
async def _select_and_poll_due() -> None:
    now = datetime.now(UTC)
    batch_limit = max(1, int(get_settings().task_poll_max_concurrency or 20))
    async with AsyncSessionLocal() as db:
        # Chỉ đoạn phim truyền hình_video sử dụng bỏ phiếu kết thúc phim truyền hình; hoãn lại nhẹ của api/studio
        # Video được xử lý bởi _poll_ephemeral_deferred_tasks. Nếu nó được gửi nhầm đến người bình chọn phim truyền hình, nó sẽ ngay lập tức bị đánh giá là thất bại.
        stmt = (
            select(TaskRun.id)
            .where(
                TaskRun.status == "awaiting_poll",
                TaskRun.task_type == "fragment_video",
                TaskRun.next_action_at.is_not(None),
                TaskRun.next_action_at <= now,
            )
            .order_by(TaskRun.next_action_at.asc(), TaskRun.id.asc())
            .limit(batch_limit)
        )
        task_ids = [int(item) for item in (await db.execute(stmt)).scalars().all()]

    if not task_ids:
        return

    async def _guarded_poll(task_id: int) -> None:
        global _last_poll_mono
        if task_id in _poll_inflight:
            return
        _poll_inflight.add(task_id)
        sem = _selector_sem or asyncio.Semaphore(1)
        try:
            async with sem:
                _last_poll_mono = time.monotonic()
                await _poll_one_task(task_id)
                _last_poll_mono = time.monotonic()
        finally:
            _poll_inflight.discard(task_id)

    await asyncio.gather(*[_guarded_poll(task_id) for task_id in task_ids])


# Thực hiện truy vấn trạng thái không chặn cho một tác vụ ngược dòng đã đăng ký.
async def _poll_one_task(task_id: int) -> None:
    from app.services.drama.jobs import poll_fragment_video_task

    async with AsyncSessionLocal() as db:
        task = await db.get(TaskRun, task_id)
        if not task or task.status != "awaiting_poll":
            return
        if not task.provider_task_id:
            task.status = "failed"
            task.error_code = "missing_provider_task_id"
            task.error_message = "缺少上游任务 ID，无法轮询"
            task.finished_at = datetime.now(UTC)
            await append_task_event(
                db,
                task.id,
                event_type="task.failed",
                status=task.status,
                phase=task.current_step_key,
                message=task.error_message,
            )
            try:
                await settle_task(db, task.id)
            except Exception:  # noqa: BLE001
                logger.exception("settle_task failed task_id=%s", task.id)
            await db.commit()
            return

    try:
        await poll_fragment_video_task(task_id)
    except Exception:  # noqa: BLE001
        logger.exception("selector poll failed task_id=%s", task_id)
        async with AsyncSessionLocal() as db:
            task = await db.get(TaskRun, task_id)
            if not task or task.status != "awaiting_poll":
                return
            # Vẫn trong tuyên bố cuối cùng: giữ TTL dài để tránh những người thăm dò đồng thời tập trung vào cửa sổ tải xuống
            if (task.current_step_status or "") == _FRAGMENT_FINALIZE_STEP:
                return
            poll_interval = max(1.0, float(get_settings().ark_video_poll_interval or 8.0))
            task.next_action_at = datetime.now(UTC) + timedelta(seconds=poll_interval)
            await db.commit()


# Nhiệm vụ video nhẹ của api/studio thăm dò nền: tích cực kiểm tra trạng thái cuối cùng ngược dòng, không thành công và giải phóng nếu hết thời gian chờ.
async def _poll_ephemeral_deferred_tasks() -> None:
    from app.models import User
    from app.services.billing.ephemeral import settle_deferred_video_poll
    from app.services.studio_tools import poll_video_task

    now = datetime.now(UTC)
    timeout_sec = float(get_settings().ark_video_poll_timeout or 900.0)

    async with AsyncSessionLocal() as db:
        # next_action_at là NULL (không có thời gian chờ đợi nào được sắp xếp), nó được coi là đã hết hạn; nếu không, chỉ những nhiệm vụ đã hết hạn mới được kiểm tra.
        # Tránh yêu cầu ngược dòng cho tất cả các tác vụ đang chuyển tiếp trong mỗi chu kỳ kiểm soát vòng.
        stmt = (
            select(TaskRun)
            .where(
                TaskRun.status == "awaiting_poll",
                TaskRun.domain.in_(["api", "studio"]),
                TaskRun.billing_status == "frozen",
                or_(TaskRun.next_action_at.is_(None), TaskRun.next_action_at <= now),
            )
            .order_by(TaskRun.next_action_at.asc().nullsfirst(), TaskRun.id.asc())
            .limit(20)
        )
        rows = list((await db.execute(stmt)).scalars().all())

    for row in rows:
        task_id = int(row.id)
        try:
            await _poll_one_ephemeral_task(task_id, now=now, timeout_sec=timeout_sec)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            # Việc thất bại của một nhiệm vụ sẽ không ảnh hưởng đến các nhiệm vụ còn lại trong đợt này và sẽ được thử lại một cách tự nhiên trong chu kỳ tiếp theo.
            logger.exception("ephemeral deferred poll failed task_id=%s", task_id)


# Thăm dò ý kiến ​​một tác vụ video bị trì hoãn nhẹ api/studio: lỗi hết thời gian chờ, ghi lại trong khi chạy, giải quyết trạng thái cuối cùng.
async def _poll_one_ephemeral_task(task_id: int, *, now, timeout_sec: float) -> None:
    from app.models import User
    from app.services.billing.ephemeral import settle_deferred_video_poll
    from app.services.studio_tools import poll_video_task

    async with AsyncSessionLocal() as db:
        task = await db.get(TaskRun, task_id)
        if not task or task.status != "awaiting_poll":
            return

        started = task.started_at or task.created_at
        if started is not None and started.tzinfo is None:
            started = started.replace(tzinfo=UTC)
        if started and (now - started).total_seconds() > timeout_sec:
            task.status = "failed"
            task.error_code = "poll_timeout"
            task.error_message = "视频轮询超时，预扣已退回"
            task.finished_at = now
            await append_task_event(
                db,
                task.id,
                event_type="task.failed",
                status=task.status,
                phase=task.current_step_key,
                message=task.error_message,
            )
            try:
                await settle_task(db, task.id)
            except Exception:  # noqa: BLE001
                logger.exception("settle_task failed task_id=%s", task.id)
            await db.commit()
            return

        user = await db.get(User, task.requested_by)
        provider_id = (task.provider_task_id or "").strip()
        if not user or not provider_id:
            return

        data = await poll_video_task(user, provider_id)
        status = str(data.get("status") or "").strip().lower()
        if status in {"", "running", "queued"}:
            task.next_action_at = now + timedelta(
                seconds=max(1.0, float(get_settings().ark_video_poll_interval or 8.0))
            )
            await db.commit()
            return

        await settle_deferred_video_poll(
            db,
            user,
            provider_task_id=provider_id,
            poll_status=status,
            error=str(data.get("error") or "") or None,
            billing_task_id=task.id,
            usage_tokens=int((data.get("usage") or {}).get("total_tokens") or 0),
            completion_tokens=int((data.get("usage") or {}).get("completion_tokens") or 0),
            raw_usage=data.get("raw_usage") if isinstance(data.get("raw_usage"), dict) else None,
        )
        await db.commit()
