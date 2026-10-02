"""API thiết kế âm thanh động cơ núi lửa (POST /api/v3/tts/voice_design)."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from app.config import Settings, get_settings
from app.services import storage

logger = logging.getLogger(__name__)

VOICE_DESIGN_SUCCESS_STATUS = {2, 4}


@dataclass
class VoiceDesignResult:
    """Giao diện thiết kế âm thanh trả về bản tóm tắt."""

    speaker_id: str
    demo_audio_url: str
    status: int
    log_id: str
    available_training_times: int | None = None


# Phân tích nhóm loa S_ được bảng điều khiển mua (phân tách bằng dấu phẩy)
def parse_speaker_pool(raw: str) -> list[str]:
    return [item.strip() for item in (raw or "").split(",") if item.strip().startswith("S_")]


# Bạn đã định cấu hình thông tin xác thực và khe cắm loa cần thiết cho thiết kế âm thanh chưa?
def voice_design_enabled(settings: Settings | None = None) -> bool:
    cfg = settings or get_settings()
    if not parse_speaker_pool(cfg.volc_tts_voice_design_speaker_ids):
        return False
    if (cfg.volc_tts_api_key or "").strip():
        return True
    return bool((cfg.volc_tts_app_id or "").strip() and (cfg.volc_tts_access_key or "").strip())


# Chọn hoặc sử dụng lại khe loa S_ cho nội dung giọng nói
def resolve_speaker_slot(
    asset_id: int,
    params: dict[str, Any] | None,
    pool: list[str],
) -> str:
    blob = params if isinstance(params, dict) else {}
    existing = str(blob.get("designedSpeakerId") or blob.get("speaker") or "").strip()
    if existing.startswith("S_"):
        return existing
    if not pool:
        raise ValueError("未配置 VOLC_TTS_VOICE_DESIGN_SPEAKER_IDS（控制台购买的 S_ 音色槽）")
    return pool[asset_id % len(pool)]


# Xây dựng tiêu đề xác thực voice_design (phiên bản mới của X-Api-Key hoặc phiên bản cũ của AppId + AccessKey)
def build_voice_design_headers(settings: Settings) -> dict[str, str]:
    headers = {
        "Content-Type": "application/json",
        "X-Api-Request-Id": str(uuid.uuid4()),
    }
    api_key = (settings.volc_tts_api_key or "").strip()
    if api_key:
        headers["X-Api-Key"] = api_key
        return headers
    headers["X-Api-App-Key"] = settings.volc_tts_app_id
    headers["X-Api-Access-Key"] = settings.volc_tts_access_key
    return headers


# Cắt bớt các từ nhắc nhở trong văn bản và dòng thử giọng đến giới hạn trên của giao diện
def clamp_voice_design_prompt(text_prompt: str, sample_text: str) -> tuple[str, str]:
    prompt = (text_prompt or "").strip()[:200]
    text = (sample_text or "").strip()[:300]
    if not prompt:
        raise ValueError("音色描述 text_prompt 不能为空")
    if not text:
        raise ValueError("试听台词 text 不能为空")
    return prompt, text


# Gọi giao diện HTTP thiết kế âm thanh
async def design_voice(
    *,
    speaker_id: str,
    text_prompt: str,
    sample_text: str,
    image_url: str | None = None,
    settings: Settings | None = None,
) -> VoiceDesignResult:
    cfg = settings or get_settings()
    prompt, text = clamp_voice_design_prompt(text_prompt, sample_text)
    body: dict[str, Any] = {
        "speaker_id": speaker_id,
        "text": text,
        "prompt": {"text_prompt": prompt},
    }
    image = (image_url or "").strip()
    if image.startswith("http://") or image.startswith("https://"):
        body["prompt"]["image_prompt"] = {"image_url": image}

    url = (cfg.volc_tts_voice_design_url or "").strip()
    headers = build_voice_design_headers(cfg)

    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(url, headers=headers, json=body)

    log_id = resp.headers.get("X-Tt-Logid", "")
    try:
        payload = resp.json()
    except Exception:  # noqa: BLE001
        payload = {}

    if resp.status_code >= 400:
        code = payload.get("code")
        message = payload.get("message") or resp.text[:400]
        logger.error(
            "voice_design HTTP %s code=%s logid=%s speaker=%s msg=%s",
            resp.status_code,
            code,
            log_id,
            speaker_id,
            message,
        )
        raise RuntimeError(f"音色设计失败({code}): {message}")

    status = int(payload.get("status") or 0)
    designed_speaker = str(payload.get("speaker_id") or speaker_id).strip()
    demo_audio = str(payload.get("demo_audio") or "").strip()

    logger.info(
        "voice_design ok logid=%s speaker=%s status=%s training_left=%s",
        log_id,
        designed_speaker,
        status,
        payload.get("available_training_times"),
    )

    if status not in VOICE_DESIGN_SUCCESS_STATUS:
        raise RuntimeError(f"音色设计未完成 status={status} logid={log_id}")

    if not demo_audio:
        raise RuntimeError(f"音色设计未返回 demo_audio logid={log_id}")

    return VoiceDesignResult(
        speaker_id=designed_speaker,
        demo_audio_url=demo_audio,
        status=status,
        log_id=log_id,
        available_training_times=payload.get("available_training_times"),
    )


# Tải demo_audio xuống cục bộ và trả về /URL tĩnh
async def persist_demo_audio(
    demo_url: str,
    *,
    project_id: int,
    asset_id: int,
) -> str:
    dest_dir = storage.project_dir(project_id or 0)
    dest = dest_dir / f"voice_design_{asset_id:04d}.mp3"
    await storage.download_to(demo_url, dest)
    return storage.publish_local(dest, sync=True)
