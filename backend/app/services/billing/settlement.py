# -*- coding: utf-8 -*-
"""Khấu trừ và quyết toán ở cấp độ nhiệm vụ."""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.models import UsageEvent, User, WalletLedger
from app.models_tasks import TaskRun
from app.services.billing.estimates import estimate_task_fen

logger = logging.getLogger(__name__)

# Các nhiệm vụ đang thực hiện vẫn chiếm số dư cam kết và chưa bị giữ lại và đóng băng
_PENDING_BILLING_TASK_STATUSES = frozenset(
    {
        "pending",
        "leased",
        "running",
        "awaiting_poll",
        "awaiting_review",
        "cancel_requested",
    }
)


def billing_active(user: User | None = None, settings: Settings | None = None) -> bool:
    """Chuyển đổi thanh toán toàn cầu; tham số người dùng vẫn tương thích với người gọi và các khoản khấu trừ không còn bị bỏ qua cho mỗi người dùng."""
    _ = user
    s = settings or get_settings()
    return bool(s.billing_enabled)


async def _ledger(
    db: AsyncSession,
    user: User,
    delta_fen: int,
    kind: str,
    *,
    ref_type: str = "",
    ref_id: str = "",
    note: str = "",
) -> None:
    user.balance_fen = int(user.balance_fen or 0) + int(delta_fen)
    db.add(
        WalletLedger(
            user_id=user.id,
            delta_fen=int(delta_fen),
            balance_after=int(user.balance_fen),
            kind=kind,
            ref_type=ref_type,
            ref_id=ref_id,
            note=note[:255],
        )
    )


async def _lock_user(db: AsyncSession, user_id: int) -> User | None:
    """Line khóa ví của người dùng để tránh thấu chi thanh toán/giữ lại đồng thời; populate_being ngăn số dư hết hạn trong phiên."""
    return (
        await db.execute(
            select(User)
            .where(User.id == int(user_id))
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()


async def _lock_task(db: AsyncSession, task_id: int) -> TaskRun | None:
    """Khóa hàng TaskRun, đảm bảo giải quyết/giữ lại tính bình thường; populate_being ngăn không cho trạng thái thanh toán hết hạn trong phiên."""
    return (
        await db.execute(
            select(TaskRun)
            .where(TaskRun.id == int(task_id))
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()


async def pending_task_commitment_fen(
    db: AsyncSession,
    user_id: int,
    *,
    exclude_task_id: int | None = None,
) -> int:
    """Tóm tắt thời gian chiếm dụng ước tính (phút) của các nhiệm vụ mà người dùng đang thực hiện và chưa bị giữ lại và đóng băng."""
    stmt = select(TaskRun).where(
        TaskRun.requested_by == int(user_id),
        TaskRun.billing_status == "none",
        TaskRun.status.in_(_PENDING_BILLING_TASK_STATUSES),
    )
    if exclude_task_id is not None:
        stmt = stmt.where(TaskRun.id != int(exclude_task_id))
    rows = list((await db.execute(stmt)).scalars().all())
    total = 0
    for row in rows:
        est = int(row.billing_estimate_fen or 0)
        if est <= 0:
            est = await estimate_task_fen(db, row)
        total += est
    return total


async def ensure_balance_for_task(db: AsyncSession, user: User, task: TaskRun) -> int:
    """Kiểm tra số dư đồng bộ trước khi tham gia hàng đợi (bao gồm cả ước tính chưa đóng băng trong hàng đợi). Nếu không đủ, ValueError sẽ được ném ra; số điểm ước tính của nhiệm vụ này sẽ được trả về."""
    if not billing_active(user):
        return 0
    locked = await _lock_user(db, int(user.id))
    if locked is None:
        raise ValueError("用户不存在")
    # Đồng bộ hóa số dư của đối tượng người dùng do người gọi nắm giữ
    user.balance_fen = int(locked.balance_fen or 0)
    user.frozen_fen = int(locked.frozen_fen or 0)
    need = await estimate_task_fen(db, task)
    pending = await pending_task_commitment_fen(db, int(user.id))
    available = int(locked.balance_fen or 0)
    required = pending + need
    if available < required:
        if pending > 0:
            raise ValueError(
                f"余额不足：本次需要 ¥{need/100:.2f}（含排队中 ¥{pending/100:.2f}），"
                f"当前 ¥{available/100:.2f}，请先充值"
            )
        raise ValueError(f"余额不足：需要 ¥{need/100:.2f}，当前 ¥{available/100:.2f}，请先充值")
    return need


async def ensure_balance_for_task_batch(
    db: AsyncSession,
    user: User,
    task: TaskRun,
    count: int,
) -> dict[str, int]:
    """Xác minh trước khi xếp hàng loạt: đang chờ xử lý + số lượng đơn vị. Nếu không đủ, hãy ném ValueError."""
    if not billing_active(user):
        return {"unit_estimate_fen": 0, "required_total_fen": 0}
    qty = max(1, int(count))
    locked = await _lock_user(db, int(user.id))
    if locked is None:
        raise ValueError("用户不存在")
    user.balance_fen = int(locked.balance_fen or 0)
    user.frozen_fen = int(locked.frozen_fen or 0)
    unit = await estimate_task_fen(db, task)
    pending = await pending_task_commitment_fen(db, int(user.id))
    additional = unit * qty
    required = pending + additional
    available = int(locked.balance_fen or 0)
    if available < required:
        raise ValueError(
            f"余额不足：批量生成 {qty} 项需 ¥{additional/100:.2f}"
            f"（含排队中 ¥{pending/100:.2f}），当前 ¥{available/100:.2f}，请先充值"
        )
    return {
        "unit_estimate_fen": unit,
        "pending_commitment_fen": pending,
        "requested_total_fen": additional,
        "required_total_fen": required,
        "balance_fen": available,
    }


async def freeze_for_task(db: AsyncSession, task: TaskRun) -> int:
    """Ước tính được giữ lại trước khi nhiệm vụ bắt đầu; một ValueError được ném ra khi số dư không đủ. Nếu bị đóng băng, ước tính ban đầu sẽ được trả về bình thường."""
    locked_task = await _lock_task(db, int(task.id))
    if not locked_task:
        return 0
    # Viết lại tham chiếu tác vụ do người gọi nắm giữ
    if locked_task is not task:
        task.billing_status = locked_task.billing_status
        task.billing_estimate_fen = locked_task.billing_estimate_fen
    if task.billing_status == "frozen":
        return int(task.billing_estimate_fen or 0)

    user = await _lock_user(db, int(task.requested_by))
    if not user or not billing_active(user):
        task.billing_status = "skipped"
        task.billing_estimate_fen = 0
        await db.flush()
        return 0
    need = await estimate_task_fen(db, task)
    available = int(user.balance_fen or 0)
    if available < need:
        raise ValueError(f"余额不足：需要 ¥{need/100:.2f}，当前 ¥{available/100:.2f}，请先充值")
    # Chỉ trừ số dư qua _sổ cái để tránh bị trừ hai lần
    user.frozen_fen = int(user.frozen_fen or 0) + need
    task.billing_estimate_fen = need
    task.billing_status = "frozen"
    await _ledger(
        db,
        user,
        -need,
        "freeze",
        ref_type="task_run",
        ref_id=str(task.id),
        note=f"freeze:{task.domain}/{task.task_type}",
    )
    await db.flush()
    return need


async def settle_task(db: AsyncSession, task_id: int) -> dict[str, int]:
    """Khi kết thúc nhiệm vụ, việc thanh toán sẽ dựa trên sự kiện sử dụng và mọi khoản vượt quá sẽ được hoàn lại và số tiền còn lại sẽ được bồi thường cho số tiền bị đóng băng."""
    task = await _lock_task(db, task_id)
    if not task:
        return {"charged": 0, "refunded": 0}
    if task.billing_status == "settled":
        return {
            "charged": int(task.billing_charged_fen or 0),
            "refunded": int(task.billing_refunded_fen or 0),
        }

    # Phía ví không có tác dụng: Nếu đã giải phóng/giải quyết, giao dịch sẽ chỉ ở trạng thái căn chỉnh và lợi nhuận thứ cấp bị cấm.
    if task.billing_status == "frozen":
        prior = (
            await db.execute(
                select(WalletLedger.id)
                .where(
                    WalletLedger.ref_type == "task_run",
                    WalletLedger.ref_id == str(task_id),
                    WalletLedger.kind.in_(("unfreeze", "settle")),
                )
                .limit(1)
            )
        ).scalar_one_or_none()
        if prior is not None:
            result = await db.execute(
                select(UsageEvent).where(
                    UsageEvent.task_run_id == task_id,
                    UsageEvent.settled.is_(False),
                )
            )
            for e in result.scalars().all():
                e.settled = True
            task.billing_status = "settled"
            await db.flush()
            return {
                "charged": int(task.billing_charged_fen or 0),
                "refunded": int(task.billing_refunded_fen or 0),
            }

    result = await db.execute(
        select(UsageEvent).where(
            UsageEvent.task_run_id == task_id,
            UsageEvent.settled.is_(False),
        )
    )
    events = list(result.scalars().all())
    # Việc sử dụng đã được giải quyết nhưng trạng thái vẫn bị đóng băng (gián đoạn bất thường): phù hợp với các khoản khấu trừ thực tế đã được đưa vào tài khoản và không được coi toàn bộ khoản khấu trừ là một khoản hoàn lại
    if (
        task.billing_status == "frozen"
        and not events
        and int(task.billing_charged_fen or 0) > 0
    ):
        task.billing_status = "settled"
        await db.flush()
        return {
            "charged": int(task.billing_charged_fen or 0),
            "refunded": int(task.billing_refunded_fen or 0),
        }
    if task.billing_status == "skipped" and not events:
        # Tính năng thanh toán bị tắt trên toàn cầu và không có mục đích sử dụng: việc thanh toán đã hoàn tất, điểm thống nhất đã được giải quyết để dễ dàng hiển thị ở phía quản lý
        task.billing_status = "settled"
        task.billing_charged_fen = int(task.billing_charged_fen or 0)
        await db.flush()
        return {
            "charged": int(task.billing_charged_fen or 0),
            "refunded": 0,
        }

    charged = sum(int(e.charge_fen or 0) for e in events)
    for e in events:
        e.settled = True

    # Tắt tính năng thanh toán trên toàn cầu: đánh dấu việc sử dụng là đã giải quyết, giữ nguyên ví và đánh dấu nhiệm vụ là đã giải quyết
    if task.billing_status == "skipped":
        task.billing_charged_fen = charged
        task.billing_status = "settled"
        await db.flush()
        return {"charged": charged, "refunded": 0}

    user = await _lock_user(db, int(task.requested_by)) if task.requested_by else None
    if not user or task.billing_status != "frozen":
        # Không bị đóng băng (chẳng hạn như không có) nhưng đã được sử dụng: chỉ số tiền được ghi có và ví không được chạm vào
        task.billing_charged_fen = charged
        if events:
            task.billing_status = "settled"
        await db.flush()
        if charged > 0 and user:
            from app.services.billing.alerts import process_billing_alerts_after_charge

            await process_billing_alerts_after_charge(db, user, charged_fen=charged)
        return {"charged": charged, "refunded": 0}

    frozen_for_task = int(task.billing_estimate_fen or 0)
    user.frozen_fen = max(0, int(user.frozen_fen or 0) - frozen_for_task)
    extra = max(0, charged - frozen_for_task)
    refund = max(0, frozen_for_task - charged)

    if extra > 0:
        logger.warning(
            "settle overage user=%s task=%s extra_fen=%s balance=%s",
            user.id,
            task_id,
            extra,
            user.balance_fen,
        )
        await _ledger(
            db,
            user,
            -extra,
            "settle",
            ref_type="task_run",
            ref_id=str(task_id),
            note="settle_overage",
        )
    if refund > 0:
        await _ledger(
            db,
            user,
            refund,
            "unfreeze",
            ref_type="task_run",
            ref_id=str(task_id),
            note="refund_unused_freeze",
        )

    task.billing_charged_fen = charged
    task.billing_refunded_fen = refund
    task.billing_status = "settled"
    await _ledger(
        db,
        user,
        0,
        "settle",
        ref_type="task_run",
        ref_id=str(task_id),
        note=f"charged={charged} freeze={frozen_for_task} refund={refund}",
    )
    await db.flush()
    if charged > 0 and user:
        from app.services.billing.alerts import process_billing_alerts_after_charge

        await process_billing_alerts_after_charge(db, user, charged_fen=charged)
    return {"charged": charged, "refunded": refund}


# Cửa sổ bình thường giữa trạng thái cuối cùng và trạng thái xử lý: _complete/_fail/_mark_cancelled đều đặt trạng thái cuối cùng trước rồi mới xử lý.
# Quá trình quét đối chiếu phải vượt ra ngoài cửa sổ này để tránh cạnh tranh với quá trình đóng thông thường.
TERMINAL_FROZEN_RECONCILE_GRACE_SEC = 120

_RECONCILABLE_TERMINAL_STATUSES = ("succeeded", "failed", "cancelled")


async def reconcile_terminal_frozen_tasks(db: AsyncSession, *, limit: int = 100) -> int:
    """Bồi thường hòa giải: Các nhiệm vụ có trạng thái cuối cùng nhưng trạng thái thanh toán vẫn bị đóng băng sẽ được giải quyết lại.

    来源是 settle_task 异常中断（如结算瞬间 DB 故障）的遗留行；不处理会造成
    冻结额长期不退、usage_events 悬空。settle_task 自带钱包流水幂等门闩，重复调用安全。
    注意：finalizing 窗口内的任务状态是 awaiting_poll/cancel_requested（非终态），
    不会被本扫描误伤，窗口协程按实结算的语义不受影响。
    """
    cutoff = datetime.now(UTC) - timedelta(seconds=TERMINAL_FROZEN_RECONCILE_GRACE_SEC)
    stmt = (
        select(TaskRun)
        .where(
            TaskRun.billing_status == "frozen",
            TaskRun.status.in_(_RECONCILABLE_TERMINAL_STATUSES),
            TaskRun.finished_at.is_not(None),
            TaskRun.finished_at < cutoff,
        )
        .limit(limit)
    )
    rows = list((await db.execute(stmt)).scalars().all())
    fixed = 0
    for task in rows:
        try:
            await settle_task(db, int(task.id))
            fixed += 1
        except Exception:  # noqa: BLE001
            logger.exception("reconcile terminal frozen task failed task_id=%s", task.id)
    if fixed:
        await db.commit()
        logger.warning("reconciled terminal frozen task runs count=%s", fixed)
    return fixed


async def credit_topup(
    db: AsyncSession,
    user: User,
    credit_fen: int,
    *,
    ref_type: str,
    ref_id: str,
    note: str = "",
) -> None:
    locked = await _lock_user(db, int(user.id))
    target = locked or user
    await _ledger(db, target, int(credit_fen), "topup", ref_type=ref_type, ref_id=ref_id, note=note)
    if locked is not None and locked is not user:
        user.balance_fen = locked.balance_fen
        user.frozen_fen = locked.frozen_fen
    await db.flush()


async def close_expired_pending_orders(
    db: AsyncSession,
    *,
    user_id: int | None = None,
    out_trade_no: str | None = None,
) -> int:
    from datetime import datetime, timezone

    from app.models import Order

    now = datetime.now(timezone.utc)
    stmt = select(Order).where(Order.status == "pending")
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)
    if out_trade_no is not None:
        stmt = stmt.where(Order.out_trade_no == out_trade_no)
    rows = (await db.execute(stmt)).scalars().all()
    closed = 0
    for order in rows:
        created = order.created_at
        if created is None:
            continue
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if (now - created).total_seconds() < 300:
            continue
        order.status = "closed"
        closed += 1
    if closed:
        await db.commit()
    return closed


async def settle_usage_charge(
    db: AsyncSession,
    user: User,
    charge_fen: int,
    *,
    ref_type: str = "api",
    ref_id: str = "",
) -> None:
    """Khấu trừ ngay lập tức (chỉ tương thích khi được giải quyết trong nhiệm vụ)."""
    if not billing_active(user):
        return
    need = max(0, int(charge_fen))
    if need <= 0:
        return
    locked = await _lock_user(db, int(user.id))
    target = locked or user
    available = int(target.balance_fen or 0)
    if available < need:
        raise ValueError(f"余额不足：需要 ¥{need / 100:.2f}，当前 ¥{available / 100:.2f}，请先充值")
    await _ledger(
        db,
        target,
        -need,
        "settle",
        ref_type=ref_type,
        ref_id=ref_id,
        note="api_usage",
    )
    if locked is not None and locked is not user:
        user.balance_fen = locked.balance_fen
        user.frozen_fen = locked.frozen_fen
    await db.flush()
    from app.services.billing.alerts import process_billing_alerts_after_charge

    await process_billing_alerts_after_charge(db, target, charged_fen=need)


async def get_task_usage_lines(db: AsyncSession, task_id: int) -> list[UsageEvent]:
    result = await db.execute(
        select(UsageEvent)
        .where(UsageEvent.task_run_id == task_id)
        .order_by(UsageEvent.id.asc())
    )
    return list(result.scalars().all())


async def get_task_billing_summary(db: AsyncSession, task_id: int) -> dict[str, Any]:
    task = await db.get(TaskRun, task_id)
    if not task:
        return {}
    lines = await get_task_usage_lines(db, task_id)
    return {
        "billing_status": task.billing_status,
        "billing_estimate_fen": int(task.billing_estimate_fen or 0),
        "billing_charged_fen": int(task.billing_charged_fen or 0),
        "billing_refunded_fen": int(task.billing_refunded_fen or 0),
        "usage_count": len(lines),
        "total_tokens": sum(int(l.total_tokens or 0) for l in lines),
        "lines": lines,
    }
