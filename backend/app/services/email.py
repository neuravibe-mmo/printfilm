# -*- coding: utf-8 -*-
"""Gửi email SMTP (cảnh báo của quản trị viên, v.v.)."""
from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


def _smtp_configured(settings: Settings | None = None) -> bool:
    s = settings or get_settings()
    return bool(
        s.smtp_enabled
        and str(s.smtp_host or "").strip()
        and str(s.smtp_from or "").strip()
    )


def _use_implicit_ssl(port: int) -> bool:
    """Các cổng như 465 là SSL ngầm (hộp thư QQ); 587 sử dụng STARTTLS."""
    return port in {465, 8465, 2465}


def _send_email_sync(
    *,
    to_addrs: list[str],
    subject: str,
    body: str,
    settings: Settings | None = None,
) -> None:
    s = settings or get_settings()
    if not _smtp_configured(s):
        raise RuntimeError("SMTP 未配置或未启用")
    recipients = [addr.strip() for addr in to_addrs if addr and addr.strip()]
    if not recipients:
        raise RuntimeError("无有效收件人")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = str(s.smtp_from).strip()
    msg["To"] = ", ".join(recipients)
    msg.set_content(body)

    host = str(s.smtp_host).strip()
    port = int(s.smtp_port or 587)
    use_tls = bool(s.smtp_use_tls)
    user = str(s.smtp_user or "").strip()
    password = str(s.smtp_password or "").strip()
    timeout = 30

    if _use_implicit_ssl(port):
        # Thường được sử dụng trong QQ/Thư công ty 465: SSL đầy đủ, SMTP văn bản thuần túy không thể được sử dụng trước rồi đến STARTTLS
        server: smtplib.SMTP = smtplib.SMTP_SSL(host, port, timeout=timeout)
        try:
            if user and password:
                server.login(user, password)
            server.send_message(msg)
        finally:
            server.quit()
        return

    server = smtplib.SMTP(host, port, timeout=timeout)
    try:
        server.ehlo()
        if use_tls:
            server.starttls()
            server.ehlo()
        if user and password:
            server.login(user, password)
        server.send_message(msg)
    finally:
        server.quit()


async def send_email(
    *,
    to_addrs: list[str],
    subject: str,
    body: str,
    settings: Settings | None = None,
) -> bool:
    """Gửi email không đồng bộ; ghi lại lỗi và trả về Sai."""
    if not _smtp_configured(settings):
        logger.warning("skip email: smtp not configured subject=%s", subject)
        return False
    try:
        await asyncio.to_thread(
            _send_email_sync,
            to_addrs=to_addrs,
            subject=subject,
            body=body,
            settings=settings,
        )
        return True
    except Exception:
        logger.exception("send email failed subject=%s", subject)
        return False
