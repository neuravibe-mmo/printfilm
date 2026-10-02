"""Nhật ký ứng dụng hợp nhất: nhật ký nghiệp vụ có thể đọc được, DEBUG SQL không bị xóa theo mặc định."""

from __future__ import annotations

import logging
import sys

_configured = False


def configure_logging(*, level: str = "INFO", sql_echo: bool = False) -> None:
    # Định cấu hình nhật ký gốc; có thể được gọi nhiều lần để làm mới cấp độ (vẫn có thể có hiệu lực sau khi tải lại)
    global _configured

    root = logging.getLogger()
    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                datefmt="%H:%M:%S",
            )
        )
        root.addHandler(handler)

    # Sử dụng INFO ở cấp độ gốc: DEBUG=true và không sử dụng thư viện của bên thứ ba.
    root.setLevel(logging.INFO)
    logging.getLogger("app").setLevel(getattr(logging, level.upper(), logging.INFO))

    # Trình điều khiển SQLAlchemy bị tắt theo mặc định
    for name in (
        "sqlalchemy",
        "sqlalchemy.engine",
        "sqlalchemy.pool",
        "sqlalchemy.dialects",
        "asyncpg",
    ):
        logging.getLogger(name).setLevel(logging.WARNING)

    if sql_echo:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
    else:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # Tiếng ồn khác
    for name in ("uvicorn.access", "httpx", "httpcore", "celery", "asyncio", "multipart"):
        logging.getLogger(name).setLevel(
            logging.INFO if name == "uvicorn.access" else logging.WARNING
        )
    logging.getLogger("celery").setLevel(logging.INFO)

    if not _configured:
        logging.getLogger("app").info(
            "日志已配置 app_level=%s sql_echo=%s（已关闭 SQL DEBUG）",
            level,
            sql_echo,
        )
    _configured = True
