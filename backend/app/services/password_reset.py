# -*- coding: utf-8 -*-
"""Lấy lại mật khẩu qua email: Token Redis một lần + liên kết đặt lại SMTP."""
from __future__ import annotations

import hashlib
import logging
import secrets
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services.auth import get_user_by_email, get_user_by_id, hash_password
from app.services.email import send_email

logger = logging.getLogger(__name__)

# TTL của token / thời gian chờ giữa các lần gửi cho cùng một email
TOKEN_TTL_SECONDS = 30 * 60
COOLDOWN_SECONDS = 60

GENERIC_OK_MESSAGE = "Nếu email này đã được đăng ký, bạn sẽ nhận được email đặt lại mật khẩu"


class PasswordResetError(Exception):
    """Lỗi nghiệp vụ lấy lại/đặt lại mật khẩu."""


class RedisUnavailableError(PasswordResetError):
    """Redis không khả dụng, không thể cấp phát hoặc xác thực token đặt lại."""


class InvalidTokenError(PasswordResetError):
    """Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."""


def _token_hash(token: str) -> str:
    # Chỉ lưu sha256, token dạng văn bản rõ chỉ xuất hiện trong liên kết gửi qua email
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _token_key(token_hash: str) -> str:
    return f"pwdreset:{token_hash}"


def _user_key(user_id: int) -> str:
    return f"pwdreset:user:{user_id}"


def _cooldown_key(email: str) -> str:
    return f"pwdreset:cd:{email}"


def get_redis_client() -> Any:
    """Kết nối tới Redis; nếu thất bại sẽ ném lỗi RedisUnavailableError (không dự phòng bộ nhớ)."""
    try:
        import redis

        client = redis.Redis.from_url(
            get_settings().redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        client.ping()
        return client
    except Exception as exc:  # noqa: BLE001
        logger.warning("password reset redis unavailable: %s", exc)
        raise RedisUnavailableError("Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau") from exc


def create_reset_token(redis_client: Any, user_id: int) -> str:
    """Cấp phát token một lần, đồng thời vô hiệu hóa token cũ của người dùng này."""
    old_hash = redis_client.get(_user_key(user_id))
    if old_hash:
        redis_client.delete(_token_key(str(old_hash)))

    token = secrets.token_urlsafe(32)
    th = _token_hash(token)
    pipe = redis_client.pipeline()
    pipe.setex(_token_key(th), TOKEN_TTL_SECONDS, str(user_id))
    pipe.setex(_user_key(user_id), TOKEN_TTL_SECONDS, th)
    pipe.execute()
    return token


def consume_reset_token(redis_client: Any, token: str) -> int:
    """Xác thực và xóa token, trả về user_id; nếu không hợp lệ sẽ ném lỗi InvalidTokenError."""
    raw = (token or "").strip()
    if not raw:
        raise InvalidTokenError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")
    th = _token_hash(raw)
    key = _token_key(th)
    # GETDEL lấy và xóa nguyên tử: trong hai yêu cầu đặt lại đồng thời chỉ một yêu cầu lấy được user_id
    user_id_raw = redis_client.getdel(key)
    if not user_id_raw:
        raise InvalidTokenError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")
    try:
        user_id = int(user_id_raw)
    except (TypeError, ValueError) as exc:
        raise InvalidTokenError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn") from exc

    redis_client.delete(_user_key(user_id))
    return user_id


def build_reset_link(token: str) -> str:
    # Trang Auth phía người dùng: ?mode=reset&token=...
    base = str(get_settings().public_base_url or "").rstrip("/")
    return f"{base}/auth?mode=reset&token={token}"


async def request_password_reset(db: AsyncSession, email: str) -> dict[str, Any]:
    """
    Khởi tạo lấy lại mật khẩu: Ghi token vào Redis và thử gửi email.
    Luôn trả về thông báo thành công chung (chống dò quét tài khoản); ném lỗi khi Redis không khả dụng.
    """
    redis_client = get_redis_client()
    email_norm = str(email or "").strip().lower()
    cd_key = _cooldown_key(email_norm)

    # Thời gian chờ 60 giây: yêu cầu lặp lại trả về thành công trực tiếp, không gửi lại
    if redis_client.get(cd_key):
        return {"ok": True, "message": GENERIC_OK_MESSAGE}

    redis_client.setex(cd_key, COOLDOWN_SECONDS, "1")

    user = await get_user_by_email(db, email_norm)
    if not user:
        return {"ok": True, "message": GENERIC_OK_MESSAGE}

    token = create_reset_token(redis_client, int(user.id))
    link = build_reset_link(token)
    body = (
        "Bạn đang thực hiện đặt lại mật khẩu cho tài khoản PRINTFILM.\n\n"
        f"Vui lòng mở liên kết sau trong vòng 30 phút để thiết lập mật khẩu mới:\n{link}\n\n"
        "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email."
    )
    sent = await send_email(
        to_addrs=[email_norm],
        subject="PRINTFILM - Đặt lại mật khẩu",
        body=body,
    )
    if not sent:
        logger.warning(
            "password reset email not sent (smtp off or failed) user_id=%s email=%s",
            user.id,
            email_norm,
        )
    return {"ok": True, "message": GENERIC_OK_MESSAGE}


async def apply_password_reset(
    db: AsyncSession,
    *,
    token: str,
    new_password: str,
) -> None:
    """Xác thực token sau đó cập nhật mật khẩu; token chỉ được sử dụng một lần."""
    redis_client = get_redis_client()
    user_id = consume_reset_token(redis_client, token)
    user = await get_user_by_id(db, user_id)
    if not user:
        raise InvalidTokenError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")
    user.hashed_password = hash_password(new_password)
    await db.commit()
