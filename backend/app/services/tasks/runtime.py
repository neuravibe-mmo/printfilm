"""Lifecycle helpers for the in-process task runtime."""

from __future__ import annotations

import asyncio
import logging

from app.config import get_settings
from app.services.tasks.poller import (
    poller_status,
    poller_tick_age_sec,
    poller_tick_stale,
    restart_poller_loop,
    start_poller,
    stop_poller,
)
from app.services.tasks.scheduler import (
    restart_scheduler_loop,
    running_count,
    scheduler_status,
    scheduler_tick_age_sec,
    scheduler_tick_stale,
    start_scheduler,
    stop_scheduler,
)

logger = logging.getLogger("app.tasks.runtime")

_watchdog_task: asyncio.Task | None = None
_watchdog_stop = asyncio.Event()
_watchdog_intentionally_stopped: bool = True


# Bắt đầu thời gian chạy nền tảng tác vụ hợp nhất (Lập lịch cho nhân viên + Bỏ phiếu chọn + cơ quan giám sát).
async def start_task_runtime() -> None:
    await start_scheduler()
    await start_poller()
    await start_watchdog()


# Dừng thời gian chạy của nền tảng tác vụ hợp nhất.
async def stop_task_runtime() -> None:
    await stop_watchdog()
    await stop_poller()
    await stop_scheduler()


# Bắt đầu cơ quan giám sát: tự động bắt đầu khi thoát khỏi vòng lập kế hoạch/bỏ phiếu hoặc hết nhịp tim.
async def start_watchdog() -> None:
    global _watchdog_task, _watchdog_intentionally_stopped
    if _watchdog_task and not _watchdog_task.done():
        return
    _watchdog_intentionally_stopped = False
    _watchdog_stop.clear()
    _watchdog_task = asyncio.create_task(_watchdog_loop(), name="task-runtime-watchdog")


# Dừng cơ quan giám sát lại.
async def stop_watchdog() -> None:
    global _watchdog_intentionally_stopped
    _watchdog_intentionally_stopped = True
    _watchdog_stop.set()
    if _watchdog_task and not _watchdog_task.done():
        _watchdog_task.cancel()
        try:
            await _watchdog_task
        except asyncio.CancelledError:
            pass


# Trạng thái cơ quan giám sát.
def watchdog_status() -> str:
    if _watchdog_intentionally_stopped:
        return "stopped"
    if _watchdog_task and not _watchdog_task.done():
        return "running"
    return "stopped"


# Định kỳ kiểm tra bộ lập lịch và Bộ chọn xem có tồn tại không và khởi động lại mềm nếu cần.
async def _watchdog_loop() -> None:
    while not _watchdog_stop.is_set():
        try:
            await _watchdog_once()
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            logger.exception("task runtime watchdog failed")
        interval = max(2.0, float(get_settings().task_runtime_watchdog_interval_sec))
        await asyncio.sleep(interval)


# Kiểm tra cơ quan giám sát duy nhất.
async def _watchdog_once() -> None:
    if scheduler_status() != "running" or scheduler_tick_stale():
        reason = "dead" if scheduler_status() != "running" else "tick_stale"
        await restart_scheduler_loop(reason=f"watchdog:{reason}")
    if poller_status() != "running" or poller_tick_stale():
        reason = "dead" if poller_status() != "running" else "tick_stale"
        await restart_poller_loop(reason=f"watchdog:{reason}")


# Trả về tóm tắt thời gian chạy của nền tảng tác vụ (khe + vòng lặp sống sót + tuổi nhịp tim).
def runtime_summary() -> dict[str, int | str | float | bool]:
    sched = scheduler_status()
    poll = poller_status()
    dog = watchdog_status()
    healthy = sched == "running" and poll == "running" and dog == "running"
    return {
        "healthy": healthy,
        "scheduler": sched,
        "scheduler_running_jobs": running_count(),
        "scheduler_tick_age_sec": round(scheduler_tick_age_sec(), 1),
        "poller": poll,
        "poller_tick_age_sec": round(poller_tick_age_sec(), 1),
        "watchdog": dog,
    }
