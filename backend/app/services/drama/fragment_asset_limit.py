"""Giới hạn trên của nội dung hình ảnh trên mỗi ảnh: Sau khi đặt bảng kiểu và khung kết nối, tránh gửi nhiều hơn giới hạn trên của hình ảnh tham chiếu cùng một lúc."""

from __future__ import annotations

import re
from typing import Any

# Bảng kiểu dành riêng + nhân vật/cảnh/đạo cụ có thể gắn vào bảng phân cảnh sau khung hình cuối cùng của cảnh quay trước
FRAGMENT_MAX_VISUAL_ASSETS = 6
FRAGMENT_MAX_CHARACTERS = 3
FRAGMENT_MAX_PROPS = 2

_ASSET_MENTION_RE = re.compile(r"@asset:(\d+)")


def cap_asset_id_list(asset_ids: list[int] | None, *, limit: int = FRAGMENT_MAX_VISUAL_ASSETS) -> list[int]:
    """Loại bỏ trùng lặp và cắt ngắn bảo toàn trật tự (được sử dụng khi các loại không còn được phân biệt sau khi hợp nhất các cảnh)."""
    out: list[int] = []
    seen: set[int] = set()
    for raw in asset_ids or []:
        aid = int(raw or 0)
        if aid <= 0 or aid in seen:
            continue
        seen.add(aid)
        out.append(aid)
        if len(out) >= max(1, int(limit)):
            break
    return out


def cap_fragment_asset_ids(
    asset_ids: list[int],
    assets: list[Any],
    *,
    limit: int = FRAGMENT_MAX_VISUAL_ASSETS,
) -> list[int]:
    """Tham chiếu hình ảnh cho mỗi cảnh quay: 1 cảnh + tối đa 3 nhân vật + đạo cụ còn lại."""
    by_id = {int(getattr(item, "id", 0) or 0): item for item in assets if getattr(item, "id", None)}
    scenes: list[int] = []
    chars: list[int] = []
    props: list[int] = []
    other: list[int] = []
    seen: set[int] = set()
    for raw in asset_ids:
        aid = int(raw or 0)
        if aid <= 0 or aid in seen:
            continue
        seen.add(aid)
        kind = str(getattr(by_id.get(aid), "type", "") or "").strip().lower()
        if kind == "scene":
            scenes.append(aid)
        elif kind == "character":
            chars.append(aid)
        elif kind in {"prop", "material", "none"}:
            props.append(aid)
        else:
            other.append(aid)
    cap = max(1, int(limit))
    picked: list[int] = []
    if scenes:
        picked.append(scenes[0])
    remain = cap - len(picked)
    char_take = min(FRAGMENT_MAX_CHARACTERS, remain)
    picked.extend(chars[:char_take])
    remain = cap - len(picked)
    prop_take = min(FRAGMENT_MAX_PROPS, remain)
    picked.extend(props[:prop_take])
    remain = cap - len(picked)
    picked.extend(other[:remain])
    return picked


def strip_unlisted_asset_mentions(content: str, allowed_ids: list[int] | set[int]) -> str:
    """Chỉ @asset đã chọn mới được giữ lại trong văn bản để tránh lấy lại những nội dung đã bị cắt trong giai đoạn tạo."""
    allowed = {int(x) for x in allowed_ids if int(x) > 0}

    def _keep(match: re.Match[str]) -> str:
        aid = int(match.group(1))
        return match.group(0) if aid in allowed else ""

    cleaned = _ASSET_MENTION_RE.sub(_keep, content or "")
    return re.sub(r"[ \t]{2,}", " ", cleaned).strip()
