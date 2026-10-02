"""TokenFree / Bài phát biểu API mới: /audio/speech của Qwen-TTS không được triển khai và trò chuyện trực tuyến Omni được sử dụng thay thế."""

from __future__ import annotations

import base64
import json
import struct
from typing import Any

from app.services.tokenfree_gateway import TOKENFREE_CHANNEL_ID

# Tên logic của bên quản lý vẫn là qwen-tts; khi thực sự gửi yêu cầu, hãy sử dụng Omni (Ali ConvertAudioRequest không được triển khai)
TOKENFREE_DEFAULT_TTS_MODEL = "qwen-tts-2025-05-22"
TOKENFREE_OMNI_TTS_MODEL = "qwen3-omni-flash"

# Hãy thử theo thứ tự khi lồng tiếng: model mặc định bên quản lý được ưu tiên, các kênh khác giống nhau.
TOKENFREE_TTS_FALLBACKS: tuple[str, ...] = (
    "qwen-tts-2025-05-22",
    "qwen3-omni-flash",
    "qwen3-tts-flash",
    "gemini-3.1-flash-tts",
    "gemini-2.5-pro-preview-tts",
    "elevenlabs-tts",
    "elevenlabs/text-to-speech-multilingual-v2",
)

# Phát sóng trực tuyến Omni: cấm viết lại văn bản gốc
TOKENFREE_OMNI_TTS_SYSTEM = "Bạn là bộ tổng hợp giọng nói. Chỉ đọc to nguyên văn văn bản do người dùng cung cấp, tuyệt đối không viết lại, không giải thích và không thêm bất kỳ câu từ nào khác."
# PCM phát trực tuyến Omni được đo ở 24 kHz / 16-bit / mono
TOKENFREE_OMNI_PCM_RATE = 24000

_SEED_TTS_MARKERS = ("seed-tts",)


def uses_tokenfree_audio(*, base_url: str = "", channel_id: str = "") -> bool:
    """Xác định xem TTS có nên sử dụng TokenFree (URL/Khóa cơ sở giống như video và LLM hay không)."""
    if (channel_id or "").strip().lower() == TOKENFREE_CHANNEL_ID:
        return True
    raw = (base_url or "").strip().lower()
    if "tokenfree.com" in raw:
        return True
    if "volces.com" in raw or "volcengineapi.com" in raw:
        return False
    return False


def resolve_tokenfree_tts_model(model: str | None) -> str:
    """Thay thế các hạt giống ngoại tuyến bằng TTS Qwen mặc định trong thư mục."""
    mid = (model or "").strip()
    low = mid.lower()
    if not mid or any(mark in low for mark in _SEED_TTS_MARKERS):
        return TOKENFREE_DEFAULT_TTS_MODEL
    return mid


def tokenfree_tts_chat_model(model: str) -> str:
    """qwen-tts /audio/speech không được triển khai trên kênh TokenFree Ali và trò chuyện trực tuyến Omni được sử dụng thay thế."""
    low = (model or "").casefold()
    if "qwen-tts" in low:
        return TOKENFREE_OMNI_TTS_MODEL
    return model


def iter_tokenfree_tts_models(preferred: str | None) -> list[str]:
    """Mô hình giọng nói mặc định + TTS khác trong thư mục TokenFree, chống trùng lặp và bảo toàn trật tự; qwen-tts được xếp vào Omni."""
    seen: set[str] = set()
    out: list[str] = []
    for raw in (preferred, *TOKENFREE_TTS_FALLBACKS):
        mid = tokenfree_tts_chat_model(resolve_tokenfree_tts_model(raw))
        key = mid.casefold()
        if not mid or key in seen:
            continue
        seen.add(key)
        out.append(mid)
    return out


def tokenfree_tts_uses_chat_audio(model: str) -> bool:
    """Gemini TTS / Qwen-TTS / Qwen-Omni đều sử dụng trò chuyện để xuất âm thanh, không gõ /audio/speech."""
    low = (model or "").casefold()
    if "gemini" in low and "tts" in low:
        return True
    if "qwen-tts" in low:
        return True
    return "omni" in low


def tokenfree_tts_uses_omni_stream(model: str) -> bool:
    """Qwen-Omni yêu cầu âm thanh truyền phát + phương thức. Nếu nó không được phát trực tuyến, input.text sẽ bị thiếu hoặc không có âm thanh."""
    low = (model or "").casefold()
    return "omni" in low or "qwen-tts" in low


# qwen-tts Tên âm thanh thực tế được nhận dạng; Beanbao zh_* / S_ không được đưa vào đây
_TOKENFREE_NATIVE_VOICES = frozenset({"Cherry", "Serena", "Ethan", "Chelsie", "alloy"})
_TOKENFREE_NATIVE_VOICES_FOLD = {v.casefold(): v for v in _TOKENFREE_NATIVE_VOICES}


def tokenfree_speech_honors_speaker(speaker: str) -> bool:
    """qwen-tts chỉ chấp nhận một vài âm tiếng Anh; id túi đậu sẽ được ép vào Ethan/Cherry."""
    return (speaker or "").strip().casefold() in _TOKENFREE_NATIVE_VOICES_FOLD


def _speaker_is_male(speaker: str) -> bool:
    """ID người nói Doubao / Liệu tên âm sắc tiếng Anh có được ánh xạ tới giọng nam hay không."""
    low = (speaker or "").strip().lower()
    return low.startswith("zh_male") or "_male_" in low


def tokenfree_speech_voice(speaker: str, model: str = "") -> str:
    """ID loa Doubao → Âm thanh được nhận dạng bởi mẫu TTS hiện tại."""
    raw = (speaker or "").strip()
    native = _TOKENFREE_NATIVE_VOICES_FOLD.get(raw.casefold())
    mid = (model or "").casefold()
    if native and "gemini" not in mid and "eleven" not in mid:
        return native
    male = _speaker_is_male(raw)
    if "gemini" in mid:
        return "Puck" if male else "Kore"
    if "eleven" in mid:
        return "Adam" if male else "Rachel"
    if native:
        return native
    return "Ethan" if male else "Cherry"


def extract_chat_audio_bytes(payload: dict[str, Any]) -> bytes | None:
    """Nhận byte âm thanh từ gói trò chuyện/hoàn thành hoặc gói DashScope."""
    if not isinstance(payload, dict):
        return None
    choices = payload.get("choices")
    if isinstance(choices, list) and choices:
        msg = choices[0].get("message") if isinstance(choices[0], dict) else None
        if isinstance(msg, dict):
            got = _audio_bytes_from_obj(msg.get("audio"))
            if got:
                return got
            got = _audio_bytes_from_obj(msg.get("content"))
            if got:
                return got
    output = payload.get("output")
    if isinstance(output, dict):
        got = _audio_bytes_from_obj(output.get("audio"))
        if got:
            return got
    return _audio_bytes_from_obj(payload.get("audio") or payload.get("data"))


def _audio_bytes_from_obj(raw: Any) -> bytes | None:
    """Phân tích base64/URL dữ liệu/trường dữ liệu lồng nhau."""
    if isinstance(raw, str) and raw.strip():
        text = raw.strip()
        if text.startswith("data:") and "," in text:
            text = text.split(",", 1)[1]
        try:
            data = base64.b64decode(text, validate=False)
        except Exception:  # noqa: BLE001
            return None
        return data if len(data) >= 1000 else None
    if isinstance(raw, dict):
        for key in ("data", "b64_json", "audio"):
            got = _audio_bytes_from_obj(raw.get(key))
            if got:
                return got
    return None


def _decode_audio_chunk(raw: Any) -> bytes:
    """Các đoạn SSE có thể nhỏ hơn 1KB rất nhiều và không bị loại bỏ theo toàn bộ ngưỡng âm thanh tại đây."""
    if isinstance(raw, str) and raw.strip():
        text = raw.strip()
        if text.startswith("data:") and "," in text:
            text = text.split(",", 1)[1]
        try:
            return base64.b64decode(text, validate=False)
        except Exception:  # noqa: BLE001
            return b""
    if isinstance(raw, dict):
        for key in ("data", "b64_json", "audio"):
            got = _decode_audio_chunk(raw.get(key))
            if got:
                return got
    return b""


def extract_sse_audio_bytes(raw: str) -> bytes | None:
    """Ghép delta.audio.data từ Omni/chat SSE."""
    chunks: list[bytes] = []
    for line in (raw or "").splitlines():
        line = line.strip()
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if not payload or payload == "[DONE]":
            continue
        try:
            obj = json.loads(payload)
        except Exception:  # noqa: BLE001
            continue
        if not isinstance(obj, dict):
            continue
        if isinstance(obj.get("error"), dict) and not chunks:
            return None
        for choice in obj.get("choices") or []:
            if not isinstance(choice, dict):
                continue
            delta = choice.get("delta") if isinstance(choice.get("delta"), dict) else {}
            message = choice.get("message") if isinstance(choice.get("message"), dict) else {}
            blob = _decode_audio_chunk((delta or {}).get("audio") or (message or {}).get("audio"))
            if blob:
                chunks.append(blob)
    joined = b"".join(chunks)
    return joined if len(joined) >= 1000 else None


def _looks_like_mpeg(raw: bytes) -> bool:
    """Nhận dạng tiêu đề khung MP3 không có ID3 (bao gồm \\xff\\xfa, v.v.)."""
    return len(raw) >= 2 and raw[0] == 0xFF and (raw[1] & 0xE0) == 0xE0


def wrap_pcm_s16le_wav(pcm: bytes, *, sample_rate: int = TOKENFREE_OMNI_PCM_RATE, channels: int = 1) -> bytes:
    """Gói Omni phát trực tiếp PCM sang WAV; nếu là RIFF/MP3, hãy trả lại nguyên trạng."""
    if len(pcm) < 1000:
        return b""
    if pcm[:4] == b"RIFF" or pcm[:3] == b"ID3" or _looks_like_mpeg(pcm):
        return pcm
    byte_rate = sample_rate * channels * 2
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + len(pcm),
        b"WAVE",
        b"fmt ",
        16,
        1,
        channels,
        sample_rate,
        byte_rate,
        channels * 2,
        16,
        b"data",
        len(pcm),
    )
    return header + pcm


def build_omni_tts_chat_body(text: str, voice: str, model: str) -> dict[str, Any]:
    """Xây dựng nội dung yêu cầu lồng tiếng phát trực tuyến Qwen-Omni."""
    return {
        "model": model,
        "messages": [
            {"role": "system", "content": TOKENFREE_OMNI_TTS_SYSTEM},
            {"role": "user", "content": text},
        ],
        "modalities": ["text", "audio"],
        "audio": {"voice": voice, "format": "wav"},
        "stream": True,
        "stream_options": {"include_usage": True},
    }
