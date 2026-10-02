# -*- coding: utf-8 -*-
"""Ánh xạ ngoại lệ HTTP liên quan đến thanh toán."""
from __future__ import annotations

from fastapi import HTTPException


def http_exception_for_value_error(exc: ValueError) -> HTTPException:
    """Số dư không đủ → 402, ValueError còn lại → 400."""
    detail = str(exc)
    status = 402 if detail.startswith("余额不足") else 400
    return HTTPException(status_code=status, detail=detail)
