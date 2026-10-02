"""Ứng dụng khách mô hình văn bản tương thích OpenAI (bất kỳ ứng dụng ngược dòng tương thích nào: Kimi / DeepSeek / OpenAI, v.v.)."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import get_settings
from app.services.logical_model_router import resolve_logical_model, resolve_logical_model_id

logger = logging.getLogger(__name__)

# DEFAULT_MAX_TOKENS Đầu ra có cấu trúc như nội dung tập yêu cầu đủ không gian hoàn thành
DEFAULT_MAX_TOKENS = 32768


class LlmUnavailableError(RuntimeError):
    """LLM theo nghĩa đen chưa được định cấu hình hoặc không khả dụng."""


# Giải quyết Khóa API LLM (căn chỉnh với manju ResolveOpenaiApiKey)
def resolve_llm_api_key() -> str:
    key = (get_settings().openai_api_key or "").strip()
    if not key:
        raise LlmUnavailableError(
            "未配置 OPENAI_API_KEY，无法调用文字模型。"
            "请在管理后台「系统设置 → 模型」填写 TokenFree API Key 并选择文本模型。"
        )
    return key


# Phân tích URL cơ sở tương thích với OpenAI
def resolve_llm_base_url() -> str:
    base = (get_settings().openai_base_url or "").strip().rstrip("/")
    if base:
        return base
    return "https://api.openai.com/v1"


# kimi / deepseek-v4 suy nghĩ mặc định sẽ chiếm mã thông báo, nội dung thường trống; đầu ra có cấu trúc bị tắt đồng đều
def _llm_extra_body(model: str) -> dict[str, Any]:
    mid = (model or "").strip().lower()
    if mid.startswith("kimi") or mid.startswith("deepseek"):
        return {"thinking": {"type": "disabled"}}
    return {}


# Trích xuất nội dung từ phản hồi trò chuyện/hoàn thành
def _message_content(data: dict[str, Any]) -> str:
    choices = data.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message") or {}
    content = message.get("content")
    if content:
        return str(content)
    # Một số cổng tương thích đưa kết quả vào Reason_content
    reasoning = message.get("reasoning_content")
    return str(reasoning or "")


# Gọi trò chuyện/hoàn thành tương thích với OpenAI
async def chat_completions(
    system: str,
    user: str,
    *,
    temperature: float = 0.6,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    timeout: float = 300.0,
    response_format: dict[str, Any] | None = None,
) -> str:
    settings = get_settings()
    logical_id = resolve_logical_model_id("text", None)
    route = resolve_logical_model("text", logical_id)
    if route:
        api_key = route.api_key
        model = (route.upstream_model or "").strip()
        base = route.base_url.rstrip("/") or resolve_llm_base_url()
    else:
        api_key = resolve_llm_api_key()
        model = (settings.model_llm or "").strip()
        base = resolve_llm_base_url()
    if not model:
        raise LlmUnavailableError(
            "未解析到可用文字模型。请在管理后台填写 TokenFree API Key，拉取并选择文本模型。"
        )
    # dòng kimi chỉ cho phép nhiệt độ = 0,6, các giá trị khác sẽ là 400
    effective_temperature = 0.6 if model.lower().startswith("kimi") else temperature

    payload: dict[str, Any] = {
        "model": model,
        "temperature": effective_temperature,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    extra = _llm_extra_body(model)
    if extra:
        payload.update(extra)
    if response_format:
        payload["response_format"] = response_format

    logger.info(
        "调用文字 LLM model=%s base=%s user_len=%s max_tokens=%s",
        model,
        base,
        len(user or ""),
        max_tokens,
    )
    async with httpx.AsyncClient(timeout=timeout) as client:
        res = await client.post(
            f"{base}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if res.status_code >= 400:
            raise RuntimeError(f"LLM error {res.status_code}: {res.text[:800]}")
        body = (res.text or "").strip()
        if not body:
            raise RuntimeError(f"LLM trả về phản hồi rỗng (HTTP {res.status_code})")
        lowered = body[:256].lower()
        if lowered.startswith("<!doctype") or lowered.startswith("<html"):
            raise RuntimeError(
                f"Cấu hình Base URL kênh LLM bị sai (trả về trang web HTML thay vì JSON API). "
                f"Hiện tại base={base}, vui lòng kiểm tra Base URL trong trang quản trị 'Kênh mô hình' xem có phải là địa chỉ API tương thích OpenAI "
                f"(ví dụ https://api.deepseek.com hoặc https://api.moonshot.cn/v1), không phải trang chủ của website."
            )
        try:
            data = res.json()
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Phản hồi LLM không phải JSON hợp lệ: {body[:200]}") from exc
    content = _message_content(data)
    logger.info("LLM văn bản trả về content_len=%s", len(content))
    return content
