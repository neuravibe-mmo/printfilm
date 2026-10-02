"""Vai trò hình ảnh Seedance i2v: Sử dụng reference_image để truyền tỷ lệ khi có khung mục tiêu."""

from __future__ import annotations


# Phân tích vai trò của hình ảnh i2v và liệu nó có đi kèm với tỷ lệ hay không
def resolve_seedance_i2v_image_role(ratio: str | None) -> tuple[str, str | None]:
    target = (ratio or "").strip() or None
    if target:
        return "reference_image", target
    return "first_frame", None
