"""Phiên bản nguồn mở được kết nối cố định với API mới TokenFree và không được phép chuyển sang các phiên bản ngược dòng khác."""

from __future__ import annotations

from typing import Any

from app.schemas_routing import SystemModelChannel

TOKENFREE_CHANNEL_ID = "tokenfree"
TOKENFREE_CHANNEL_NAME = "TokenFree New API"
# Đường dẫn gốc tương thích với API mới OpenAI (/channels là bảng điều khiển, không phải giao diện)
TOKENFREE_BASE_URL = "https://www.tokenfree.com/v1"
TOKENFREE_CONSOLE_URL = "https://www.tokenfree.com/channels"
# Hạn ngạch nội bộ API mới: 500000 hạn ngạch = 1 USD
TOKENFREE_QUOTA_PER_USD = 500_000


def tokenfree_site_origin(base_url: str | None = None) -> str:
    """Thu thập đường dẫn gốc tương thích /v1 vào nguồn gốc của trang web để thanh toán /api/* và trang tổng quan."""
    raw = (base_url or TOKENFREE_BASE_URL).strip().rstrip("/")
    if raw.endswith("/v1"):
        return raw[: -len("/v1")].rstrip("/")
    return raw


def resolve_tokenfree_api_key() -> str:
    """Ưu tiên được dành cho Khóa kênh, theo sau là các biến môi trường/lớp phủ thời gian chạy."""
    try:
        from app.services.model_settings import get_routing_snapshot

        channels = get_routing_snapshot().channels
    except Exception:  # noqa: BLE001
        channels = []
    for channel in channels:
        if channel.id == TOKENFREE_CHANNEL_ID and (channel.api_key or "").strip():
            return (channel.api_key or "").strip()
    from app.config import get_settings

    s = get_settings()
    return (s.openai_api_key or s.ark_api_key or "").strip()


def locked_tokenfree_channel(
    *,
    api_key: str = "",
    has_api_key: bool | None = None,
    models: list[str] | None = None,
    enabled: bool = True,
) -> SystemModelChannel:
    """Cách duy nhất để xây dựng URL/giao thức cơ sở không thể thay đổi."""
    key = (api_key or "").strip()
    return SystemModelChannel(
        id=TOKENFREE_CHANNEL_ID,
        name=TOKENFREE_CHANNEL_NAME,
        base_url=TOKENFREE_BASE_URL,
        api_key=key,
        has_api_key=bool(key) if has_api_key is None else bool(has_api_key),
        api_format="openai",
        protocol="auto",
        models=list(dict.fromkeys(m.strip() for m in (models or []) if m and m.strip())),
        enabled=enabled,
        sort_order=0,
    )


def pick_migratable_api_key(channels: list[SystemModelChannel]) -> str:
    """Chỉ di chuyển kênh TokenFree hoặc base_url chứa Khóa của tokenfree.com và tránh ghi Khóa Moonshot/Ark vào đó."""
    for channel in channels:
        if channel.id == TOKENFREE_CHANNEL_ID and (channel.api_key or "").strip():
            return (channel.api_key or "").strip()
    for channel in channels:
        key = (channel.api_key or "").strip()
        base = (channel.base_url or "").strip().lower()
        if key and "tokenfree.com" in base:
            return key
    return ""


def apply_tokenfree_flat_overlay(flat: dict[str, Any], channels: list[SystemModelChannel]) -> dict[str, Any]:
    """Đồng bộ hóa TokenFree Key / Base với các trường được chia sẻ bởi ứng dụng khách LLM và Ark trong thời gian chạy."""
    channel = next((item for item in channels if item.id == TOKENFREE_CHANNEL_ID), None)
    if channel is None:
        return flat
    out = dict(flat)
    out["openai_base_url"] = TOKENFREE_BASE_URL
    out["ark_base_url"] = TOKENFREE_BASE_URL
    key = (channel.api_key or "").strip()
    if key:
        out["openai_api_key"] = key
        out["ark_api_key"] = key
    return out
