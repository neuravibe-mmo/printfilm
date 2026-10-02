"""TokenFree / Hạn ngạch ngược dòng API mới, mức sử dụng hàng ngày và chuyển đổi điểm RMB."""

from __future__ import annotations

import json
import logging
import math
from datetime import UTC, date, datetime, timedelta
from typing import Any

import httpx

from app.config import Settings, get_settings
from app.services.tokenfree_gateway import (
    TOKENFREE_BASE_URL,
    TOKENFREE_CONSOLE_URL,
    TOKENFREE_QUOTA_PER_USD,
    resolve_tokenfree_api_key,
    tokenfree_site_origin,
)

logger = logging.getLogger(__name__)

DEFAULT_USD_CNY = 7.0


def usd_cny_rate(settings: Settings | None = None) -> float:
    """USD sang RMB, được sử dụng để chuyển đổi hạn ngạch API mới/USD thành chi phí ngược dòng (xu)."""
    s = settings or get_settings()
    try:
        rate = float(getattr(s, "billing_usd_cny", None) or DEFAULT_USD_CNY)
    except (TypeError, ValueError):
        rate = DEFAULT_USD_CNY
    return max(0.01, rate)


def tokenfree_usage_configured() -> bool:
    """Khi bạn đã điền Khóa API TokenFree, bạn có thể sử dụng chính thức mà không cần Volcano AK/SK."""
    return bool(resolve_tokenfree_api_key())


def quota_to_cost_fen(quota: Any, settings: Settings | None = None) -> int:
    """Hạn ngạch API mới → Điểm RMB; Hạn ngạch 500000 = 1 USD."""
    try:
        amount = int(quota or 0)
    except (TypeError, ValueError):
        return 0
    if amount <= 0:
        return 0
    usd = amount / float(TOKENFREE_QUOTA_PER_USD)
    return max(1, int(math.ceil(usd * usd_cny_rate(settings) * 100)))


def billing_usage_to_cost_fen(total_usage: Any, settings: Settings | None = None) -> int:
    """Total_usage tương thích với OpenAI (đơn vị 0,01 USD) → Điểm RMB."""
    try:
        raw = float(total_usage)
    except (TypeError, ValueError):
        return 0
    if raw <= 0:
        return 0
    return max(1, int(math.ceil((raw / 100.0) * usd_cny_rate(settings) * 100)))


def usage_dates_are_ignored(first: float, second: float, window: float, *, eps: float = 0.05) -> bool:
    """Việc sử dụng trong một ngày gần giống như trong toàn bộ cửa sổ, có nghĩa là trang web bỏ qua ngày bắt đầu/ngày kết thúc."""
    if abs(window) <= eps:
        return False
    return abs(first - second) <= eps and abs(first - window) <= eps


def _item_day_key(item: dict[str, Any]) -> str | None:
    """Phân tích cú pháp YYYY-MM-DD từ dòng Quota_data/log API mới."""
    for key in ("date", "Day", "day"):
        raw = item.get(key)
        if isinstance(raw, str) and len(raw) >= 10:
            return raw[:10]
    created = item.get("created_at") or item.get("CreatedAt")
    if isinstance(created, str) and len(created) >= 10 and created[4] == "-":
        return created[:10]
    try:
        ts = int(created or 0)
    except (TypeError, ValueError):
        return None
    if ts <= 0:
        return None
    if ts > 10_000_000_000:
        ts = ts // 1000
    return datetime.fromtimestamp(ts, tz=UTC).date().isoformat()


def aggregate_quota_data_by_day(
    items: list[dict[str, Any]],
    settings: Settings | None = None,
) -> dict[str, dict[str, Any]]:
    """Tóm tắt hàng ngày Hạn ngạch_data/nhật ký tiêu thụ API mới."""
    out: dict[str, dict[str, Any]] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        day = _item_day_key(item)
        if not day:
            continue
        slot = out.setdefault(day, {"quota": 0, "tokens": 0})
        try:
            slot["quota"] += int(item.get("quota") or 0)
        except (TypeError, ValueError):
            pass
        try:
            tokens = int(item.get("total_tokens") or 0)
        except (TypeError, ValueError):
            tokens = 0
        if tokens <= 0:
            try:
                tokens = int(item.get("token_used") or 0)
            except (TypeError, ValueError):
                tokens = 0
        if tokens <= 0:
            try:
                tokens = int(item.get("prompt_tokens") or 0) + int(item.get("completion_tokens") or 0)
            except (TypeError, ValueError):
                tokens = 0
        if tokens:
            slot["tokens"] += tokens
    for slot in out.values():
        slot["cost_fen"] = quota_to_cost_fen(slot["quota"], settings)
        slot["source"] = "quota_data"
    return out


def used_quota_from_raw_json(raw_json: str | None) -> int | None:
    """Đọc used_quota tích lũy từ ảnh chụp nhanh hàng ngày raw_json."""
    if not raw_json:
        return None
    try:
        payload = json.loads(raw_json)
    except (TypeError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    raw = payload.get("used_quota")
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def day_start_used_quota_from_raw_json(raw_json: str | None) -> int | None:
    """Đọc hạn ngạch đã sử dụng tích lũy (đối với chênh lệch tích lũy) vào đầu ngày."""
    if not raw_json:
        return None
    try:
        payload = json.loads(raw_json)
    except (TypeError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    raw = payload.get("day_start_used_quota")
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def _list_from_payload(payload: Any) -> list[dict[str, Any]]:
    """Lấy danh sách đối tượng từ data/items/logs; thành công=false được coi là trống."""
    if isinstance(payload, dict) and payload.get("success") is False:
        return []
    inner = payload
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, (dict, list)):
            inner = data
    if isinstance(inner, list):
        return [item for item in inner if isinstance(item, dict)]
    if isinstance(inner, dict):
        for key in ("items", "data", "logs", "quota_data"):
            rows = inner.get(key)
            if isinstance(rows, list):
                return [item for item in rows if isinstance(item, dict)]
    return []


def _billing_dict(payload: Any) -> dict[str, Any] | None:
    """Giải nén JSON thanh toán trên trang tổng quan; trả về Không có nếu thất bại hoặc thành công=false."""
    if not isinstance(payload, dict):
        return None
    if payload.get("success") is False:
        return None
    data = payload.get("data")
    if isinstance(data, dict) and any(k in data for k in ("hard_limit_usd", "hard_limit", "total_usage", "quota")):
        return data
    return payload


async def _tokenfree_get(path: str, *, params: dict[str, Any] | None = None) -> Any:
    """NHẬN đường dẫn trang web TokenFree; Bearer sử dụng Key giống như trang mô hình."""
    key = resolve_tokenfree_api_key()
    if not key:
        raise RuntimeError("未配置 TokenFree API Key，请先在「模型」填写")
    origin = tokenfree_site_origin()
    url = path if path.startswith("http") else f"{origin}{path}"
    headers = {"Authorization": f"Bearer {key}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=headers, params=params)
    if resp.status_code >= 400:
        raise RuntimeError(f"TokenFree HTTP {resp.status_code}: {resp.text[:300]}")
    try:
        return resp.json()
    except ValueError as exc:
        raise RuntimeError("TokenFree 返回非 JSON") from exc


async def _try_tokenfree_get(path: str, *, params: dict[str, Any] | None = None) -> Any | None:
    """Giao diện tùy chọn: 401/Return None khi không được triển khai, không làm gián đoạn quá trình chính."""
    try:
        return await _tokenfree_get(path, params=params)
    except RuntimeError as exc:
        logger.info("tokenfree optional GET %s skipped: %s", path, exc)
        return None


async def fetch_tokenfree_account(settings: Settings | None = None) -> dict[str, Any]:
    """Truy vấn số dư còn lại của TokenFree (tái sử dụng Key mô hình)."""
    s = settings or get_settings()
    quota: int | None = None
    used_quota: int | None = None
    hard_limit_usd: float | None = None
    used_usd: float | None = None

    self_payload = await _try_tokenfree_get("/api/user/self")
    if isinstance(self_payload, dict):
        inner = self_payload.get("data") if isinstance(self_payload.get("data"), dict) else self_payload
        if isinstance(inner, dict) and inner.get("success") is not False:
            try:
                if inner.get("quota") is not None:
                    quota = int(inner.get("quota") or 0)
                if inner.get("used_quota") is not None:
                    used_quota = int(inner.get("used_quota") or 0)
            except (TypeError, ValueError):
                pass

    v1 = TOKENFREE_BASE_URL.rstrip("/")
    today = datetime.now(UTC).date()
    sub = _billing_dict(await _try_tokenfree_get(f"{v1}/dashboard/billing/subscription"))
    usage = _billing_dict(
        await _try_tokenfree_get(
            f"{v1}/dashboard/billing/usage",
            params={"start_date": "2000-01-01", "end_date": today.isoformat()},
        )
    )
    if usage is None:
        usage = _billing_dict(await _try_tokenfree_get(f"{v1}/dashboard/billing/usage"))
    if sub:
        raw_hard = sub.get("hard_limit_usd", sub.get("hard_limit"))
        try:
            if raw_hard is not None:
                hard_limit_usd = float(raw_hard)
        except (TypeError, ValueError):
            hard_limit_usd = None
    if usage and usage.get("total_usage") is not None:
        try:
            used_usd = float(usage["total_usage"]) / 100.0
        except (TypeError, ValueError):
            used_usd = None

    if used_quota is None and used_usd is not None:
        used_quota = int(round(used_usd * TOKENFREE_QUOTA_PER_USD))
    if quota is None and hard_limit_usd is not None and used_usd is not None:
        quota = int(round(max(0.0, hard_limit_usd - used_usd) * TOKENFREE_QUOTA_PER_USD))

    if quota is None and used_quota is None and hard_limit_usd is None and used_usd is None:
        raise RuntimeError("TokenFree 额度查询失败")

    remain_usd = None
    if quota is not None:
        remain_usd = quota / float(TOKENFREE_QUOTA_PER_USD)
    elif hard_limit_usd is not None and used_usd is not None:
        remain_usd = max(0.0, hard_limit_usd - used_usd)

    remain_fen = quota_to_cost_fen(quota or 0, s) if quota is not None else (
        billing_usage_to_cost_fen((remain_usd or 0) * 100, s) if remain_usd else 0
    )
    used_fen = quota_to_cost_fen(used_quota or 0, s) if used_quota is not None else (
        billing_usage_to_cost_fen((used_usd or 0) * 100, s) if used_usd else 0
    )
    return {
        "ok": True,
        "quota": quota,
        "used_quota": used_quota,
        "remain_usd": remain_usd,
        "used_usd": used_usd,
        "hard_limit_usd": hard_limit_usd,
        "remain_fen": remain_fen,
        "used_fen": used_fen,
        "remain_yuan": round(remain_fen / 100, 4),
        "used_yuan": round(used_fen / 100, 4),
        "quota_per_usd": TOKENFREE_QUOTA_PER_USD,
        "usd_cny": usd_cny_rate(s),
        "base_url": TOKENFREE_BASE_URL,
        "console_url": TOKENFREE_CONSOLE_URL,
    }


async def _fetch_billing_usage(start: date, end: date) -> float | None:
    """GET /v1/dashboard/billing/usage, trả về tổng_usage (0,01 USD)."""
    v1 = TOKENFREE_BASE_URL.rstrip("/")
    payload = await _try_tokenfree_get(
        f"{v1}/dashboard/billing/usage",
        params={"start_date": start.isoformat(), "end_date": end.isoformat()},
    )
    usage = _billing_dict(payload)
    if not usage or usage.get("total_usage") is None:
        return None
    try:
        return float(usage["total_usage"])
    except (TypeError, ValueError):
        return None


async def fetch_tokenfree_daily_usage(
    since: date,
    until: date,
    settings: Settings | None = None,
) -> dict[str, dict[str, Any]]:
    """Kéo mức sử dụng hàng ngày chính thức trong phạm vi; khi tham số ngày không hợp lệ, nó sẽ trả về trống và người gọi sẽ tạo ra sự khác biệt tích lũy."""
    s = settings or get_settings()
    start_ts = int(datetime.combine(since, datetime.min.time(), tzinfo=UTC).timestamp())
    end_ts = int(datetime.combine(until + timedelta(days=1), datetime.min.time(), tzinfo=UTC).timestamp())

    data_payload = await _try_tokenfree_get(
        "/api/data/self",
        params={"start_timestamp": start_ts, "end_timestamp": end_ts},
    )
    items = _list_from_payload(data_payload) if data_payload is not None else []
    if items:
        daily = aggregate_quota_data_by_day(items, s)
        if daily:
            return daily

    if since > until:
        return {}
    first = await _fetch_billing_usage(since, since)
    last_day = min(since + timedelta(days=1), until)
    second = await _fetch_billing_usage(last_day, last_day) if until > since else first
    window = await _fetch_billing_usage(since, until)
    if first is None or window is None:
        return {}
    if until > since and second is not None and usage_dates_are_ignored(first, second, window):
        return {}

    out: dict[str, dict[str, Any]] = {}
    cur = since
    while cur <= until:
        raw = await _fetch_billing_usage(cur, cur)
        if raw is None:
            cur += timedelta(days=1)
            continue
        out[cur.isoformat()] = {
            "quota": int(round(raw / 100.0 * TOKENFREE_QUOTA_PER_USD)),
            "tokens": 0,
            "cost_fen": billing_usage_to_cost_fen(raw, s),
            "source": "billing_usage",
        }
        cur += timedelta(days=1)
    return out
