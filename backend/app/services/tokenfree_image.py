"""TokenFree / Hình ảnh thế hệ API mới: Kênh KIE sử dụng POST /v1/responses, không phải Ark /images/thế hệ."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from collections.abc import Awaitable, Callable
from typing import Any

from app.services.tokenfree_gateway import TOKENFREE_CHANNEL_ID
from app.services.tokenfree_video import uses_tokenfree_video

logger = logging.getLogger(__name__)

# Chỉ còn lại một vị trí quan sát trong toàn bộ quá trình để tránh API mới "Quá nhiều quan sát tác vụ đang hoạt động"
_image_slot: asyncio.Semaphore | None = None
# Số giây chờ sau 429 (khe không được giải phóng để ngăn các gương khác tiếp tục đạt giới hạn)
TOKENFREE_IMAGE_RETRY_DELAYS = (3.0, 6.0, 12.0, 20.0)

_IMG_SRC_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)
_URL_RE = re.compile(r"https?://[^\s\"'<>]+", re.IGNORECASE)


def uses_tokenfree_image(*, base_url: str = "", channel_id: str = "") -> bool:
    """Tương tự như video: Máy chủ TokenFree hoặc kênh tokenfree."""
    return uses_tokenfree_video(base_url=base_url, channel_id=channel_id)


def is_seedream_family(model: str) -> bool:
    """TokenFree trên Seedream sẽ /phản hồi sẽ task_protocol_error."""
    mid = (model or "").strip().lower()
    return "seedream" in mid


# TokenFree là Hình ảnh GPT thực sự có thể vượt qua trong nhóm; sunburst là tên giá Kie, nhóm mặc định không có nhà phân phối
TOKENFREE_WORKING_IMAGE_MODEL = "gpt-image-2-5"
TOKENFREE_KIE_IMAGE_MODEL = "gpt-image-2-5-sunburst"


def tokenfree_working_image_model(model: str) -> str:
    """Seedream / sunburst đã đổi thành gpt-image-2-5, có thể vượt qua trong thử nghiệm thực tế; thanh toán vẫn dựa trên điểm Kie."""
    raw = (model or "").strip()
    low = raw.lower()
    if (
        not raw
        or is_seedream_family(raw)
        or low in {
            "gpt-image-2-5",
            "gpt-image-2.5",
            TOKENFREE_KIE_IMAGE_MODEL,
            "gpt-image-2.5-sunburst",
            "gpt-image-2",
            "gpt-image-2.0",
        }
    ):
        return TOKENFREE_WORKING_IMAGE_MODEL
    return raw


def build_tokenfree_image_body(
    *,
    model: str,
    prompt: str,
    size: str = "",
    ref_urls: list[str] | None = None,
    style_ref_urls: list[str] | None = None,
) -> dict[str, Any]:
    """Cơ quan thành công trực tuyến chỉ cần mô hình + đầu vào ngôn ngữ tự nhiên, không cần kích thước: các trường giao thức."""
    text = (prompt or "").strip() or "Hình ảnh sắc nét, chủ thể ổn định"
    size_s = (size or "").strip()
    if size_s:
        text = f"{text}。Độ phân giải đầu ra {size_s}"
    refs = [u.strip() for u in (ref_urls or []) if (u or "").strip()]
    style_refs = [u.strip() for u in (style_ref_urls or []) if (u or "").strip()]
    if style_refs:
        text = f"{text}。Ảnh tham chiếu phong cách (chỉ lấy tông màu, nét vẽ, ánh sáng; cấm sao chép chủ thể và bố cục / 画风参考图：只借色调、笔触、光影，禁止抄主体与构图）：{' '.join(style_refs)}"
    if refs:
        text = f"{text}。Tham chiếu bố cục và chủ thể (构图与主体参考)：{' '.join(refs)}"
    return {"model": tokenfree_working_image_model(model), "input": text}


def extract_tokenfree_image_url(data: dict[str, Any]) -> str | None:
    """Trích xuất URL hình ảnh từ /v1/responses hoặc gói tương thích."""
    if not isinstance(data, dict):
        return None
    for item in data.get("output") or []:
        if not isinstance(item, dict):
            continue
        for block in item.get("content") or []:
            if not isinstance(block, dict):
                continue
            url = block.get("url")
            image_url = block.get("image_url")
            if not url and isinstance(image_url, dict):
                url = image_url.get("url")
            if isinstance(url, str) and url.startswith("http"):
                return url.strip()
            text = str(block.get("text") or "")
            found = _IMG_SRC_RE.search(text) or _URL_RE.search(text)
            if found:
                return found.group(1).strip()
    if data.get("data"):
        first = data["data"][0]
        if isinstance(first, dict):
            raw = first.get("url")
            if isinstance(raw, str) and raw.startswith("http"):
                return raw.strip()
    return None


def _parse_json_object(body: str) -> dict[str, Any] | None:
    """Phân tích đối tượng JSON; trả về Không có khi thất bại."""
    text = (body or "").strip()
    if not text.startswith("{"):
        return None
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def is_tokenfree_image_task_failed(data: dict[str, Any]) -> bool:
    """/v1/responses HTTP 200 hoặc status=failed (không có kết quả)."""
    if not isinstance(data, dict):
        return False
    status = str(data.get("status") or "").lower()
    if status in {"failed", "cancelled"}:
        return True
    meta = data.get("metadata")
    if isinstance(meta, dict) and str(meta.get("task_status") or "").lower() in {"failed", "cancelled"}:
        return True
    err = data.get("error")
    if isinstance(err, dict) and (err.get("code") or err.get("message")):
        output = data.get("output")
        if not output:
            return True
    return False


def tokenfree_image_failed_task_message(data: dict[str, Any]) -> str:
    """Một câu tiếng Trung ngắn được cung cấp cho người dùng khi /responses status=failed, ngoại trừ JSON / resp_id."""
    err = data.get("error") if isinstance(data.get("error"), dict) else {}
    body = json.dumps(data, ensure_ascii=False)
    if is_tokenfree_input_text_sensitive(status_code=200, body=body):
        return "生图文案未通过内容审核（可能含敏感或历史名人相关表述），请修Thay đổi lời nhắc后重试。"
    code = str((err or {}).get("code") or "").lower()
    msg = str((err or {}).get("message") or "")
    if code in {"server_error", "internal_error"} or "task failed" in msg.lower():
        return "出图上游任务失败，请稍后再点「生成画面」"
    snippet = (msg or code or "failed")[:200]
    return f"出图失败：{snippet}"


def raise_tokenfree_image_if_failed(data: dict[str, Any]) -> None:
    """Ném các câu ngắn tiếng Trung khi tác vụ thất bại và không ném resp_id/JSON cho người dùng."""
    if not is_tokenfree_image_task_failed(data):
        return
    err = data.get("error") if isinstance(data.get("error"), dict) else {}
    logger.warning(
        "TokenFree 生图任务失败 model=%s code=%s message=%s",
        data.get("model"),
        (err or {}).get("code"),
        str((err or {}).get("message") or "")[:160],
    )
    raise RuntimeError(tokenfree_image_failed_task_message(data))


def is_tokenfree_rate_limit(*, status_code: int = 0, body: str = "") -> bool:
    """429, hoặc xóa bit quan sát/nội dung lỗi giới hạn hiện tại; trường rate_limit trong nội dung thành công 2xx không được tính."""
    if int(status_code or 0) == 429:
        return True
    text = body or ""
    if "too many active task observations" in text.lower():
        return True
    try:
        payload = json.loads(text) if text.strip().startswith("{") else None
    except json.JSONDecodeError:
        payload = None
    err = payload.get("error") if isinstance(payload, dict) else None
    code = ""
    if isinstance(err, dict):
        code = str(err.get("code") or "")
    elif isinstance(payload, dict):
        code = str(payload.get("code") or "")
    return code.lower() == "rate_limit_exceeded"


def is_tokenfree_protocol_error(*, status_code: int = 0, body: str = "") -> bool:
    """KIE / Giao thức tác vụ API mới không thành công (thường gặp với Seedream hoặc tạm thời 502)."""
    text = (body or "").lower()
    if "task_protocol_error" in text or "task protocol request failed" in text:
        return True
    try:
        payload = json.loads(body) if (body or "").strip().startswith("{") else None
    except json.JSONDecodeError:
        payload = None
    err = payload.get("error") if isinstance(payload, dict) else None
    code = str((err or {}).get("code") or "") if isinstance(err, dict) else ""
    return int(status_code or 0) == 502 and code.lower() == "task_protocol_error"


def is_tokenfree_no_distributor(*, status_code: int = 0, body: str = "") -> bool:
    """Không có nhà phân phối nào trong nhóm API mới (yêu cầu 404/502/503 và model_not_found + không có dòng)."""
    if int(status_code or 0) not in {404, 502, 503}:
        return False
    text = body or ""
    lowered = text.lower()
    if "model_not_found" not in lowered:
        return False
    return "distributor" in lowered or "无可用" in text


def is_tokenfree_retryable_image_error(*, status_code: int = 0, body: str = "") -> bool:
    """Giới hạn hiện tại hoặc lỗi server_error ngược dòng HTTP 200 có thể được sao lưu; giao thức/đường dây không dây bị lỗi ngay lập tức."""
    if is_tokenfree_rate_limit(status_code=status_code, body=body):
        return True
    if int(status_code or 0) != 200:
        return False
    payload = _parse_json_object(body)
    if not payload or not is_tokenfree_image_task_failed(payload):
        return False
    err = payload.get("error") if isinstance(payload.get("error"), dict) else {}
    code = str(err.get("code") or "").lower()
    return code in {"server_error", "internal_error"}


def tokenfree_image_channel_dead(*, status_code: int = 0, body: str = "") -> bool:
    """TokenFree Kênh vẽ hiện không khả dụng (giao thức không thành công hoặc không có nhà phân phối)."""
    return is_tokenfree_protocol_error(status_code=status_code, body=body) or is_tokenfree_no_distributor(
        status_code=status_code, body=body
    )


def is_tokenfree_input_text_sensitive(*, status_code: int = 0, body: str = "") -> bool:
    """Đánh giá và đánh chặn Copywriting; lỗi giao thức, giới hạn dòng điện và đường dây không dây không được tính, vì vậy có thể sử dụng compact/style_only."""
    if is_tokenfree_rate_limit(status_code=status_code, body=body):
        return False
    if tokenfree_image_channel_dead(status_code=status_code, body=body):
        return False
    text = body or ""
    if "InputTextSensitive" in text or "InputTextSensitiveContentDetected" in text:
        return True
    lowered = text.lower()
    if any(token in lowered for token in ("content_filter", "content_policy", "text sensitive", "sensitive content")):
        return True
    return "内容审核" in text or "敏感内容" in text


def tokenfree_image_user_error(*, model: str = "", status_code: int = 0, body: str = "") -> str:
    """Người dùng có thể nhìn thấy bản sao chép về lỗi vẽ TokenFree; nếu kênh bị hỏng, nó sẽ không còn khiến bạn nhầm lẫn để thay đổi mô hình."""
    if is_tokenfree_rate_limit(status_code=status_code, body=body):
        return "出图通道繁忙，同时进行的任务过多，请稍后再点「生成画面」"
    if tokenfree_image_channel_dead(status_code=status_code, body=body):
        # TokenFree đã thay đổi Seedream thành gpt-image. Sẽ gây hiểu lầm khi nhắc lại "vui lòng sử dụng nó thay thế".
        return "出图通道暂时失败，请稍后再点「生成画面」"
    payload = _parse_json_object(body)
    if payload and is_tokenfree_image_task_failed(payload):
        return tokenfree_image_failed_task_message(payload)
    snippet = (body or "")[:800]
    return f"出图失败 {status_code}: {snippet}"


def tokenfree_image_slot() -> asyncio.Semaphore:
    """Toàn bộ quá trình đồ thị TokenFree loại trừ lẫn nhau (mặc định 1 chiều)."""
    global _image_slot
    if _image_slot is None:
        from app.config import get_settings

        n = max(1, int(getattr(get_settings(), "tokenfree_image_concurrency", 1) or 1))
        _image_slot = asyncio.Semaphore(n)
    return _image_slot


async def post_until_not_rate_limited(
    post: Callable[[], Awaitable[Any]],
    *,
    delays: tuple[float, ...] = TOKENFREE_IMAGE_RETRY_DELAYS,
    sleep: Callable[[float], Awaitable[Any]] = asyncio.sleep,
) -> Any:
    """Nếu POST gặp giới hạn hiện tại của bit quan sát hoặc lỗi HTTP 200+server_error, nó sẽ tắt và thử lại; nếu vẫn thất bại, phản hồi cuối cùng sẽ được trả về."""
    last: Any = None
    for attempt in range(len(delays) + 1):
        last = await post()
        status = int(getattr(last, "status_code", 0) or 0)
        body = str(getattr(last, "text", "") or "")
        if not is_tokenfree_retryable_image_error(status_code=status, body=body):
            return last
        if attempt >= len(delays):
            break
        wait = delays[attempt]
        logger.warning("TokenFree 生图暂不可用，%.0fs 后重试（%s/%s）", wait, attempt + 1, len(delays))
        await sleep(wait)
    return last


def is_tokenfree_image_url(url: str) -> bool:
    """Địa chỉ sản phẩm đang hoạt động của TokenFree, nên mang theo Bearer để tải xuống."""
    raw = (url or "").strip().lower()
    if "tokenfree.com" not in raw:
        return False
    return "/tasks/" in raw or "/responses/" in raw or "/artifacts/" in raw
