# Admin finance daily ledger API
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_admin
from app.models import User
from app.schemas import AdminFinanceDailyOut
from app.services.admin.finance import build_finance_daily_list
from app.services.admin.upstream_usage import sync_upstream_usage

router = APIRouter(prefix="/finance", tags=["admin-finance"])


@router.get("/daily", response_model=AdminFinanceDailyOut)
async def admin_finance_daily(
    days: int = Query(30, ge=1, le=90),
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminFinanceDailyOut:
    """So sánh tài chính hàng ngày: các khoản khấu trừ địa phương, chi phí địa phương, mã thông báo, chi phí thực tế và lợi nhuận."""
    raw = await build_finance_daily_list(db, days=days)
    return AdminFinanceDailyOut(**raw)


@router.post("/daily/sync", response_model=AdminFinanceDailyOut)
async def admin_finance_daily_sync(
    days: int = Query(30, ge=1, le=90),
    force: bool = Query(False),
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminFinanceDailyOut:
    """Quay lại danh sách tài chính sau khi làm mới ảnh chụp nhanh chi phí ngược dòng chính thức."""
    try:
        await sync_upstream_usage(db, days=days, force=force)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    raw = await build_finance_daily_list(db, days=days)
    return AdminFinanceDailyOut(**raw)
