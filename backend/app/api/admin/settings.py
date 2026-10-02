# Admin model / provider settings API
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_admin
from app.models import User
from app.schemas_routing import AdminRoutingSettingsOut, AdminRoutingSettingsPatch, AdminRoutingSettingsSaveOut
from app.schemas_settings import (
    AdminModelSettingsImportEnvOut,
    AdminModelSettingsOut,
    AdminModelSettingsPatch,
    AdminModelSettingsSaveOut,
)
from app.services.model_settings import (
    get_admin_model_settings,
    get_admin_routing_settings,
    import_admin_model_settings_from_env,
    patch_admin_model_settings,
    patch_admin_routing_settings,
)
from app.services.upstream_model_catalog import list_upstream_models

router = APIRouter()
logger = logging.getLogger(__name__)


class AdminUpstreamModelsRequest(BaseModel):
    """Kéo thư mục ngược dòng /models dựa trên thông tin đăng nhập kênh."""

    channel_id: str | None = Field(default=None, max_length=64)
    protocol: str = Field(default="auto", max_length=32)
    base_url: str = Field(default="", max_length=512)
    api_key: str | None = Field(default=None, max_length=512)
    capability: str = Field(default="all", max_length=32)


@router.get("/settings/routing", response_model=AdminRoutingSettingsOut)
async def admin_get_routing_settings(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminRoutingSettingsOut:
    # Đọc kênh + mô hình logic + cấu hình định tuyến hoàn chỉnh mô hình mặc định
    return await get_admin_routing_settings(db)


@router.patch("/settings/routing", response_model=AdminRoutingSettingsSaveOut)
async def admin_patch_routing_settings(
    body: AdminRoutingSettingsPatch,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminRoutingSettingsSaveOut:
    # Lưu kênh và tuyến đường hợp lý; tự động đồng bộ liên kết mô hình logic khi lưu
    try:
        settings, applied = await patch_admin_routing_settings(db, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AdminRoutingSettingsSaveOut(settings=settings, applied=applied)


@router.get("/settings/models", response_model=AdminModelSettingsOut)
async def admin_get_model_settings(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminModelSettingsOut:
    # Đọc cấu hình mô hình hiện có hiệu quả (DB trước, env trước)
    return await get_admin_model_settings(db)


@router.patch("/settings/models", response_model=AdminModelSettingsSaveOut)
async def admin_patch_model_settings(
    body: AdminModelSettingsPatch,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminModelSettingsSaveOut:
    # Cập nhật một phần cấu hình mô hình; để trống khóa để không sửa đổi nó
    try:
        settings, applied = await patch_admin_model_settings(db, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AdminModelSettingsSaveOut(settings=settings, applied_fields=applied)


@router.post("/settings/models/import-env", response_model=AdminModelSettingsImportEnvOut)
async def admin_import_model_settings_from_env(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminModelSettingsImportEnvOut:
    # Nhập các mục có thể quản lý trong các biến .env/environment vào DB chỉ bằng một cú nhấp chuột (các phím trống được bỏ qua để tránh ghi đè văn bản mã hóa hiện có)
    settings, imported, skipped = await import_admin_model_settings_from_env(db)
    return AdminModelSettingsImportEnvOut(
        settings=settings,
        imported_fields=imported,
        skipped_secret_fields=skipped,
    )


@router.post("/settings/upstream/models")
async def admin_list_upstream_models(
    body: AdminUpstreamModelsRequest,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Kéo các mô hình ngược dòng có sẵn theo thỏa thuận kênh (tương thích TokenFree / OpenAI)."""
    try:
        models = await list_upstream_models(
            db,
            channel_id=body.channel_id,
            protocol=body.protocol,
            base_url=body.base_url,
            api_key_override=body.api_key,
            capability=body.capability,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"models": models}


@router.get("/settings/billing/model-rates")
async def admin_billing_model_rates(
    _admin: User = Depends(get_current_admin),
) -> dict:
    """Kéo bảng giá chính thức của TokenFree và trả về tỷ lệ mô hình văn bản/hình ảnh/video được đề xuất."""
    from app.services.tokenfree_pricing import billing_official_rate_rows, tokenfree_pricing_url

    items = await billing_official_rate_rows()
    return {"items": items, "source": tokenfree_pricing_url()}


@router.get("/settings/tokenfree/quota")
async def admin_tokenfree_account_quota(
    _admin: User = Depends(get_current_admin),
) -> dict:
    """Truy vấn số dư còn lại của tài khoản TokenFree/API mới (cùng khóa với trang mô hình)."""
    from app.services.tokenfree_usage import fetch_tokenfree_account, tokenfree_usage_configured

    if not tokenfree_usage_configured():
        raise HTTPException(status_code=400, detail="未配置 TokenFree API Key（请先在「模型」填写）")
    try:
        return await fetch_tokenfree_account()
    except RuntimeError as exc:
        logger.warning("tokenfree quota query failed: %s", exc)
        raise HTTPException(status_code=502, detail="TokenFree 额度查询失败") from exc
