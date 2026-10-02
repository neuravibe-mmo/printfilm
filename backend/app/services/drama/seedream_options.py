"""Tùy chọn giao diện người dùng Seedream → Phân tích mô hình/kích thước TokenFree."""

from __future__ import annotations

import math
import re

from app.config import get_settings
from app.services.logical_model_router import resolve_logical_model_id, resolve_upstream_model

# Tỷ lệ được hỗ trợ SeedreamAspectRatio
SeedreamAspectRatio = str
# SeedreamResolution rõ ràng
SeedreamResolution = str

# Seedream 5.0 Pro có thể tùy chỉnh tổng diện tích pixel (tài liệu chính thức)
SEEDREAM_PRO_MAX_PIXELS = 4_624_220

# Pixel được đề xuất 1K / 2K chính thức (tất cả đều nằm trong giới hạn Pro)
SEEDREAM_SIZE_1K: dict[str, str] = {
    "auto": "1K",
    "1:1": "1024x1024",
    "16:9": "1424x800",
    "9:16": "800x1424",
    "4:3": "1152x864",
    "3:4": "864x1152",
    "3:2": "1248x832",
    "2:3": "832x1248",
    "21:9": "1568x672",
}
SEEDREAM_SIZE_2K: dict[str, str] = {
    "auto": "2K",
    "1:1": "2048x2048",
    "16:9": "2816x1584",
    "9:16": "1584x2816",
    "4:3": "2368x1776",
    "3:4": "1776x2368",
    "3:2": "2496x1664",
    "2:3": "1664x2496",
    "21:9": "3136x1344",
}
# Lite / có sẵn 4,5 pixel cao hơn (trên giới hạn Pro, chỉ khả dụng trên các mẫu không phải Pro)
SEEDREAM_SIZE_3K: dict[str, str] = {
    "auto": "3K",
    "1:1": "3072x3072",
    "16:9": "4096x2304",
    "21:9": "4704x2016",
    "9:16": "2304x4096",
    "4:3": "3456x2592",
    "3:4": "2592x3456",
}
SEEDREAM_SIZE_4K: dict[str, str] = {
    "auto": "4K",
    "1:1": "4096x4096",
    "16:9": "5404x3040",
    "21:9": "6198x2656",
    "9:16": "3040x5404",
    "4:3": "4694x3520",
    "3:4": "3520x4694",
}

SEEDREAM_SIZE_MAP: dict[str, dict[str, str]] = {
    "1K": SEEDREAM_SIZE_1K,
    "2K": SEEDREAM_SIZE_2K,
    "3K": SEEDREAM_SIZE_3K,
    "4K": SEEDREAM_SIZE_4K,
}

_PIXEL_SIZE_RE = re.compile(r"^(\d+)\s*[xX×]\s*(\d+)$")


# Xác định xem điểm truy cập có phải là Seedream 5.0 Pro hay không (chỉ hỗ trợ 1K/2K, vùng pixel 4624220)
def is_seedream_pro_model(model: str | None) -> bool:
    mid = (model or "").strip().lower()
    if not mid:
        return True
    if "seedream-4" in mid or "4.5" in mid or "4-5" in mid:
        return False
    if "lite" in mid:
        return False
    if "kie-" in mid:
        return False
    if "5-0-pro" in mid or "5.0-pro" in mid or "seedream-5.0" in mid:
        return True
    if "seedream-5" in mid or "seedream/5" in mid:
        return "lite" not in mid
    # Mô hình hình ảnh chính của dự án mặc định là Pro
    return True


# Chia tỷ lệ WxH vượt quá giới hạn trong phạm vi max_pixels (các cạnh được đánh số chẵn)
def clamp_seedream_pixel_size(
    size: str,
    *,
    max_pixels: int = SEEDREAM_PRO_MAX_PIXELS,
) -> str:
    raw = (size or "").strip()
    matched = _PIXEL_SIZE_RE.match(raw)
    if not matched:
        return raw
    width = int(matched.group(1))
    height = int(matched.group(2))
    if width <= 0 or height <= 0:
        return raw
    area = width * height
    if area <= max_pixels:
        return f"{width}x{height}"
    scale = math.sqrt(max_pixels / area)
    new_w = max(2, int(width * scale) // 2 * 2)
    new_h = max(2, int(height * scale) // 2 * 2)
    while new_w * new_h > max_pixels and (new_w > 2 or new_h > 2):
        if new_w >= new_h and new_w > 2:
            new_w -= 2
        elif new_h > 2:
            new_h -= 2
        else:
            break
    return f"{new_w}x{new_h}"


# Phân giải ID mô hình giao diện người dùng thành tên mô hình ngược dòng TokenFree
def resolve_seedream_model_endpoint(model_id: str | None) -> str:
    raw = (model_id or "").strip()
    settings = get_settings()
    mid = raw.lower()
    logical_id = resolve_logical_model_id("image", model_id)
    routed = resolve_upstream_model("image", logical_id)
    if routed and routed != logical_id:
        return routed
    if mid in {"", "seedream-5.0", "seedream-5", "5.0"}:
        return resolve_upstream_model("image", "seedream-5.0") or settings.model_image
    if mid in {"seedream-4.5", "seedream-4", "4.5"}:
        return resolve_upstream_model("image", "seedream-4.5") or (settings.model_image_45 or "").strip() or settings.model_image
    return model_id or settings.model_image


# Giải quyết độ sắc nét + tỷ lệ với kích thước Ark; Pro tự động giảm xuống 2K
def resolve_seedream_size(
    *,
    aspect_ratio: str | None = None,
    resolution: str | None = None,
    model_id: str | None = None,
) -> str:
    settings = get_settings()
    res = (resolution or "2K").strip().upper()
    if res not in SEEDREAM_SIZE_MAP:
        res = "2K"
    # Pro không hỗ trợ tệp 3K/4K và pixel siêu lớn và được giới hạn đồng đều ở 2K
    endpoint = resolve_seedream_model_endpoint(model_id) if model_id is not None else settings.model_image
    if is_seedream_pro_model(endpoint) and res in {"3K", "4K"}:
        res = "2K"
    ratio = (aspect_ratio or "3:4").strip() or "3:4"
    mapped = SEEDREAM_SIZE_MAP[res].get(ratio)
    if not mapped:
        mapped = settings.ark_image_size or "2K"
    if is_seedream_pro_model(endpoint):
        if mapped.upper() in {"3K", "4K"}:
            mapped = "2K"
        return clamp_seedream_pixel_size(mapped)
    return mapped
