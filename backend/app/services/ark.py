"""Volcengine Ark gateway via HTTP (chat / Seedream / Seedance / TTS)."""

from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import logging
import re
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, NoReturn
from urllib.parse import urlparse

import httpx

from app.config import Settings, get_settings
from app.services.billing.pricing import parse_upstream_cost_fen, parse_usage_dict
from app.schemas_routing import ResolvedModelRoute
from app.services.logical_model_router import (
    resolve_logical_model,
    resolve_logical_model_id,
    resolve_upstream_model,
)
from app.services.tokenfree_audio import (
    TOKENFREE_DEFAULT_TTS_MODEL,
    build_omni_tts_chat_body,
    extract_chat_audio_bytes,
    extract_sse_audio_bytes,
    iter_tokenfree_tts_models,
    resolve_tokenfree_tts_model,
    tokenfree_speech_voice,
    tokenfree_tts_chat_model,
    tokenfree_tts_uses_chat_audio,
    tokenfree_tts_uses_omni_stream,
    uses_tokenfree_audio,
    wrap_pcm_s16le_wav,
)
from app.services.tokenfree_image import (
    build_tokenfree_image_body,
    extract_tokenfree_image_url,
    is_tokenfree_image_url,
    is_tokenfree_input_text_sensitive,
    is_tokenfree_rate_limit,
    post_until_not_rate_limited,
    raise_tokenfree_image_if_failed,
    tokenfree_image_slot,
    tokenfree_image_user_error,
    tokenfree_working_image_model,
    uses_tokenfree_image,
)
from app.services.voices import edge_tts_voice_for_speaker
from app.services.tokenfree_video import (
    extract_video_result_url,
    extract_video_task_id,
    format_video_task_error,
    is_tokenfree_content_url,
    normalize_video_task_status,
    prepare_video_create_body,
    remap_video_path,
    tokenfree_video_content_url,
    unwrap_video_task_payload,
    uses_tokenfree_video,
)
from app.services import storage
from app.services.drama.seedance_i2v_role import resolve_seedance_i2v_image_role
from app.services.ffmpeg_compose import is_near_silent_audio
from app.services.drama.llm import _extract_json
from app.services.llm_client import (
    chat_completions,
    chatgpt2api_completions,
    is_chatgpt2api_configured,
)
from app.services import seedance_segments as segplan

logger = logging.getLogger(__name__)

# TokenFree /v1/responses đồng bộ hóa và chờ ảnh; Kie sunburst thỉnh thoảng phải hơn 10 phút mới trả lời
IMAGE_GEN_READ_SEC = 1200.0
# Tạo tác vụ video sẽ trả về task_id; khi TokenFree lấy hình ảnh tham chiếu, có thể mất một hoặc hai phút.
VIDEO_CREATE_READ_SEC = 180.0
# Thăm dò ý kiến/truy vấn đơn chỉ cần trạng thái JSON
VIDEO_POLL_READ_SEC = 60.0
VIDEO_FETCH_READ_SEC = 30.0


def _upstream_timeout(read_sec: float, *, connect: float = 30.0) -> httpx.Timeout:
    """Thời gian chờ HTTP ngược dòng: ngắn khi thiết lập kết nối và dài khi chờ kết quả, để tránh ReadTimeout bị coi là lỗi kết nối."""
    return httpx.Timeout(connect=connect, read=float(read_sec), write=60.0, pool=30.0)


def reraise_upstream_timeout(exc: BaseException, *, kind: str, read_sec: float) -> NoReturn:
    """Chuyển đổi thời gian chờ httpx thành RuntimeError có thể đọc được; ReadTimeout có nghĩa là nó được kết nối nhưng hết thời gian chờ kết quả."""
    if isinstance(exc, httpx.ReadTimeout):
        raise RuntimeError(
            f"{kind} chờ phản hồi quá thời gian (ReadTimeout): Đã kết nối TokenFree nhưng trong {read_sec:.0f} giây chưa có kết quả, vui lòng thử lại sau"
        ) from exc
    if isinstance(exc, httpx.WriteTimeout):
        raise RuntimeError(
            f"{kind} gửi yêu cầu quá thời gian (WriteTimeout): Đã kết nối TokenFree nhưng trong {read_sec:.0f} giây chưa gửi xong yêu cầu, vui lòng thử lại sau"
        ) from exc
    name = type(exc).__name__
    raise RuntimeError(
        f"{kind} không thể kết nối tới máy chủ AI ({name}): Vui lòng kiểm tra mạng, proxy hoặc tính khả dụng của TokenFree"
    ) from exc


def _raise_seedream_http_error(
    status_code: int,
    body: str,
    *,
    model: str = "",
    tokenfree: bool = False,
) -> None:
    """Chuyển đổi lỗi HTTP hình ảnh thành RuntimeError có thể đọc được; Bản sao chép của TokenFree được tách ra khỏi Ark chính thức."""
    snippet = (body or "")[:800]
    if status_code == 403 and "AccountOverdueError" in snippet:
        logger.error("Seedream AccountOverdueError — upstream Ark account overdue: %s", snippet[:200])
        raise RuntimeError(
            "Tài khoản Seedream đã hết số dư (AccountOverdueError), tạm thời không thể tạo ảnh, vui lòng liên hệ quản trị viên để nạp tài khoản TokenFree"
        )
    logger.warning(
        "Tạo ảnh từ máy chủ AI thất bại model=%s tokenfree=%s status=%s body=%s",
        (model or "").strip() or "-",
        tokenfree,
        status_code,
        snippet[:200],
    )
    if tokenfree:
        if is_tokenfree_input_text_sensitive(status_code=status_code, body=snippet):
            raise RuntimeError(
                "Mô tả tạo ảnh không vượt qua kiểm duyệt nội dung (có thể chứa từ ngữ nhạy cảm hoặc nhân vật nổi tiếng), "
                "vui lòng chỉnh sửa lại prompt và thử lại."
                f" Chi tiết: {snippet[:240]}"
            )
        raise RuntimeError(tokenfree_image_user_error(model=model, status_code=status_code, body=snippet))
    if "InputTextSensitive" in snippet or "InputTextSensitiveContentDetected" in snippet:
        raise RuntimeError(
            "Mô tả tạo ảnh không vượt qua kiểm duyệt nội dung (có thể chứa từ ngữ nhạy cảm hoặc nhân vật nổi tiếng), "
            "vui lòng chỉnh sửa lại prompt và thử lại."
            f" Chi tiết: {snippet[:240]}"
        )
    raise RuntimeError(f"Seedream error {status_code}: {snippet}")


def _fallback_overlay_title(text: str, shot_no: int) -> str:
    """Last resort when LLM omits title — never blind-slice mid-word (e.g. ERP→ER)."""
    raw = re.sub(r"\s+", "", (text or "").strip())
    if not raw:
        return f"Phân cảnh {shot_no}"
    clause = re.split(r"[，。；！？、,:;]", raw, maxsplit=1)[0].strip()
    if 2 <= len(clause) <= 10 and not _looks_truncated_token(clause, raw):
        return clause
    return f"Phân cảnh {shot_no}"


def _fallback_overlay_subtitle(text: str) -> str:
    raw = (text or "").strip()
    if not raw:
        return ""
    cleaned = re.sub(r"\s+", "", raw)
    clause = re.split(r"[，。；！？、,:;]", cleaned, maxsplit=1)[0].strip()
    if 4 <= len(clause) <= 22:
        return clause
    if len(clause) > 22:
        # Prefer a trailing noun-ish chunk over a head that cuts mid-phrase
        for n in range(18, 7, -1):
            tail = clause[-n:].lstrip(" vàvớicùng")
            if 6 <= len(tail) <= 18 and not re.match(r"[A-Za-z0-9]", tail[:1] or ""):
                if not _looks_truncated_token(tail, clause):
                    return tail
        head = clause[:18]
        if re.search(r"[A-Za-z0-9]$", head) and re.match(r"[A-Za-z0-9]", clause[18:19] or ""):
            m = re.search(r"[A-Za-z0-9]+$", head)
            if m and m.start() > 6:
                head = head[: m.start()]
        return head
    return cleaned[:22] if len(cleaned) > 22 else cleaned


def _looks_truncated_token(title: str, full_text: str) -> bool:
    """Đúng nếu tiêu đề là tiền tố của câu chuyện cắt ngang một từ tiếng Latin/kỹ thuật số."""
    t = re.sub(r"\s+", "", (title or "").strip())
    full = re.sub(r"\s+", "", (full_text or "").strip())
    if not t or not full.startswith(t):
        return False
    if len(full) <= len(t):
        return False
    # Truncated mid-ASCII token: title ends with alnum and next char is alnum
    if re.search(r"[A-Za-z0-9]$", t) and re.match(r"[A-Za-z0-9]", full[len(t)]):
        return True
    # Obvious raw prefix grab of long narration
    if len(t) <= 12 and len(full) > len(t) + 8 and full.startswith(t):
        return True
    return False


def _normalize_overlay_title(title: str, text: str, shot_no: int) -> str:
    t = (title or "").strip()
    if not t or _looks_truncated_token(t, text):
        return _fallback_overlay_title(text, shot_no)
    return t[:32]


def _normalize_overlay_subtitle(subtitle: str, text: str) -> str:
    s = (subtitle or "").strip()
    if not s or _looks_truncated_token(s, text):
        return _fallback_overlay_subtitle(text)[:64]
    return s[:64]


# Soften brand / IP names that Seedream often rejects as copyright
_SEEDREAM_SANITIZE: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"(?i)\bspacex\b"), "công ty hàng không vũ trụ tư nhân"),
    (re.compile(r"(?i)\bspace\s*x\b"), "công ty hàng không vũ trụ tư nhân"),
    (re.compile(r"(?i)\bfalcon\s*heavy\b"), "tên lửa đẩy hạng nặng"),
    (re.compile(r"(?i)\bfalcon\s*1\b"), "tên lửa đẩy thử nghiệm đầu tiên"),
    (re.compile(r"(?i)\bfalcon\s*9\b"), "tên lửa đẩy có thể tái sử dụng"),
    (re.compile(r"(?i)\bfalcon\b"), "tên lửa đẩy thử nghiệm"),
    (re.compile(r"(?i)\bstarship\b"), "phi thuyền không gian khổng lồ"),
    (re.compile(r"(?i)\belon\s*musk\b"), "doanh nhân hàng không vũ trụ"),
    (re.compile(r"(?i)\btesla\b"), "hãng xe điện"),
    (re.compile(r"猎鹰一号"), "tên lửa đẩy thử nghiệm đầu tiên"),
    (re.compile(r"猎鹰\s*9"), "tên lửa đẩy có thể tái sử dụng"),
    (re.compile(r"猎鹰重型"), "tên lửa đẩy hạng nặng"),
    (re.compile(r"猎鹰"), "tên lửa đẩy thử nghiệm"),
    (re.compile(r"马斯克"), "doanh nhân hàng không vũ trụ"),
    (re.compile(r"埃隆"), "doanh nhân hàng không vũ trụ"),
    (re.compile(r"Space\s*X"), "công ty hàng không vũ trụ tư nhân"),
]

# Hướng dẫn bổ sung về phong cách vẽ sau khi đánh giá khuôn mặt thật/thực, giảm xác suất kích hoạt các khuôn mặt giống như ảnh thật
_SEEDREAM_CG_STYLE = (
    "Hình ảnh phong cách digital art CG, phong cách game CG chất lượng cao, màu sắc nhiều lớp phong phú, chất cảm tinh tế chân thực, "
    "hiệu ứng ánh sáng chân thực mang lại chiều sâu sống động cho khung hình"
)


def storyboard_name_policy(allow_source_names: bool) -> str:
    """Liệu lời tường thuật có giữ lại tên cửa hàng/tên sản phẩm trong bản sao của người dùng hay không; logo không bao giờ bị ghi vào màn hình."""
    if allow_source_names:
        return (
            "Tên cửa hàng, địa chỉ, tên sản phẩm, tên người xuất hiện trong nội dung của người dùng phải được giữ nguyên trong lời bình (text) và title, "
            "không được tự ý đổi thành tên chung chung; tuyệt đối không tự bịa thêm các tên không có trong nội dung. "
            "Trong img_prompt nghiêm cấm yêu cầu vẽ logo thật, biểu tượng thương hiệu hoặc chữ đọc được trên màn hình."
        )
    return "Nghiêm cấm dùng nhãn hiệu/tên công ty/tên người thật (hãy dùng danh từ chung)."


@dataclass
class ShotPlan:
    shot: int
    duration: float
    text: str
    img_prompt: str
    video_prompt: str
    camera: str
    bgm: str
    overlay_title: str = ""
    overlay_subtitle: str = ""
    segment_script: str = ""


@dataclass
class StoryboardResult:
    shots: list[ShotPlan]
    character_bible: str = ""
    bgm_lock: str = ""


@dataclass
class TaskResult:
    status: str  # pending | running | succeeded | failed
    url: str | None = None
    last_frame_url: str | None = None
    error: str | None = None
    total_tokens: int = 0
    completion_tokens: int = 0
    raw_usage: dict[str, Any] | None = None
    provider_task_id: str | None = None
    # Tín dụng Kie và các chi phí ngược dòng được quy đổi khác (xu); nếu có một giá trị, nó sẽ được ưu tiên hơn ước tính mã thông báo
    upstream_cost_fen: int | None = None


# Trạng thái HTTP tức thời của truy vấn tác vụ: giới hạn hiện tại/lỗi cổng, bản thân tác vụ có thể vẫn đang chạy,
# Nó phải được chuyển sang chế độ bỏ phiếu lùi (người thăm dò có tổng thời gian chờ) và một lần truy cập không được đánh giá là thất bại.
def _is_transient_http_status(status_code: int) -> bool:
    """Giới hạn hiện tại 429 hoặc lỗi cổng/ngược dòng 5xx được coi là có thể thử lại."""
    return status_code == 429 or status_code >= 500


def _retry_after_seconds(resp: httpx.Response, default: float) -> float:
    """Tôn trọng Thử lại sau (delta-giây); khi bị thiếu hoặc ở dạng ngày HTTP, khoảng thời gian mặc định sẽ được sử dụng, với giới hạn trên là 60 giây."""
    raw = resp.headers.get("Retry-After")
    if raw:
        try:
            return max(0.0, min(60.0, float(raw.strip())))
        except ValueError:
            pass
    return default


# Trạng thái phân tích cú pháp phản hồi truy vấn, URL phương tiện và cách sử dụng chính thức từ Seedance / tác vụ API mới
def _build_task_result_from_payload(data: dict[str, Any]) -> TaskResult:
    payload = unwrap_video_task_payload(data)
    status = normalize_video_task_status(str(payload.get("status", "") or "running"))
    usage_parsed = parse_usage_dict(payload)
    total_tokens = int(usage_parsed.get("total_tokens") or 0)
    completion_tokens = int(usage_parsed.get("completion_tokens") or 0)
    raw_usage = payload.get("usage") if isinstance(payload.get("usage"), dict) else None

    if status == "succeeded":
        return TaskResult(
            status="succeeded",
            url=extract_video_result_url(payload),
            last_frame_url=_extract_seedance_last_frame_url(payload),
            total_tokens=total_tokens,
            completion_tokens=completion_tokens,
            raw_usage=raw_usage,
        )
    if status == "failed":
        err = payload.get("error") or payload.get("message") or payload.get("fail_reason") or "failed"
        return TaskResult(
            status="failed",
            error=format_video_task_error(err),
            total_tokens=total_tokens,
            completion_tokens=completion_tokens,
            raw_usage=raw_usage,
        )
    return TaskResult(
        status="running",
        total_tokens=total_tokens,
        completion_tokens=completion_tokens,
        raw_usage=raw_usage,
    )


# Trích xuất URL khung kết thúc từ phản hồi thành công của nhiệm vụ Seedance
def _extract_seedance_last_frame_url(data: dict[str, Any]) -> str | None:
    content = data.get("content")
    if isinstance(content, dict):
        for key in ("last_frame_url", "last_frame_image_url", "lastFrameUrl"):
            value = content.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        nested = content.get("last_frame")
        if isinstance(nested, dict):
            nested_url = nested.get("url")
            if isinstance(nested_url, str) and nested_url.strip():
                return nested_url.strip()
        if isinstance(nested, str) and nested.strip():
            return nested.strip()
    for key in ("last_frame_url", "last_frame_image_url", "lastFrameUrl"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


# Phân tích nội dung[n] chỉ số dưới và thẻ tùy chọn từ văn bản lỗi
def _seedance_content_slot_label(
    text: str,
    content_labels: list[str] | None = None,
) -> tuple[int, str]:
    m = re.search(r"content\[(\d+)\]", text or "", re.I)
    idx = int(m.group(1)) if m else -1
    label = ""
    if idx >= 0 and content_labels and idx < len(content_labels):
        label = str(content_labels[idx] or "").strip()
    return idx, label


# Chuyển đổi phản hồi lỗi tạo Seedance sang tiếng Trung có thể đọc được (giữ lại mã khóa để hỗ trợ khớp giao diện người dùng)
def _format_seedance_create_error(
    status_code: int,
    body: str,
    content_labels: list[str] | None = None,
) -> str:
    text = (body or "")[:800]
    if any(
        k in text
        for k in ("PrivacyInformation", "InputImageSensitive", "SensitiveContentDetected", "real person")
    ):
        idx, label = _seedance_content_slot_label(text, content_labels)
        if label:
            return (
                f"Ảnh tham chiếu nghi ngờ là người thật: {label} (content[{idx}], PrivacyInformation), "
                "vui lòng thay thế hình ảnh đó bằng phong cách hoạt hình (anime) hoặc tranh vẽ minh họa rồi thử lại"
            )
        if idx >= 0:
            return (
                f"Ảnh tham chiếu nghi ngờ là người thật (mục thứ {idx + 1} / content[{idx}], PrivacyInformation), "
                "vui lòng thay thế hình ảnh nhân vật/bối cảnh tương ứng bằng phong cách hoạt hình hoặc tranh minh họa rồi thử lại"
            )
        return "Ảnh tham chiếu nghi ngờ là người thật (PrivacyInformation), vui lòng thay thế hình ảnh nhân vật/bối cảnh bằng phong cách hoạt hình hoặc minh họa rồi thử lại"
    if "InputTextSensitive" in text or "text sensitive" in text.lower():
        return "Kịch bản phân cảnh không vượt qua kiểm duyệt nội dung, vui lòng chỉnh sửa từ ngữ nhạy cảm và thử lại"
    if "resource download failed" in text and "audio" in text.lower():
        return "Không thể tải âm thanh tham chiếu, vui lòng kiểm tra lại liên kết giọng đọc của nhân vật rồi thử lại"
    # Seedance r2v: thời lượng reference_audio phải ≥ 1,8 giây
    if re.search(r"audio duration.*(?:1\.8|greater than or equal)", text, re.I) or (
        "audio duration" in text.lower() and "content[" in text.lower()
    ):
        idx, label = _seedance_content_slot_label(text, content_labels)
        who = label or (f"mục thứ {idx + 1} / content[{idx}]" if idx >= 0 else "âm thanh tham chiếu")
        return (
            f"Âm thanh tham chiếu quá ngắn: {who}, dịch vụ tạo video yêu cầu thời lượng ≥ 1.8 giây. "
            "Vui lòng vào phần nhân vật/lời bình, tạo lại hoặc tải lên file âm thanh nghe thử dài hơn trước khi tạo phân cảnh này."
        )
    return f"Seedance create error {status_code}: {text}"


@dataclass
class ImageResult:
    local_url: str
    remote_url: str | None = None
    total_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    raw_usage: dict[str, Any] | None = None
    upstream_cost_fen: int | None = None


class ArkGateway:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings_override = settings

    @property
    def settings(self) -> Settings:
        return self._settings_override or get_settings()

    # Ưu tiên phụ trợ TokenFree / Khóa kênh Ark, env chỉ dùng để rút ngắn kênh
    def _ark_api_key(self) -> str:
        try:
            from app.services.model_settings import get_routing_snapshot
            from app.services.tokenfree_gateway import TOKENFREE_CHANNEL_ID

            channels = get_routing_snapshot().channels
        except Exception:  # noqa: BLE001
            channels = []
            TOKENFREE_CHANNEL_ID = "tokenfree"
        enabled = [ch for ch in channels if ch.enabled and (ch.api_key or "").strip()]
        preferred = next((ch for ch in enabled if ch.id == TOKENFREE_CHANNEL_ID), None)
        if preferred is None:
            preferred = enabled[0] if enabled else None
        if preferred is not None:
            return (preferred.api_key or "").strip()
        return (self.settings.ark_api_key or "").strip()

    @property
    def mock(self) -> bool:
        return self.settings.ark_mock or not self._ark_api_key()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._ark_api_key()}",
            "Content-Type": "application/json",
        }

    def _url(self, path: str) -> str:
        """Địa chỉ cơ sở Splicing Ark/TokenFree; đường dẫn tác vụ video được ghi lại thành /video trên TokenFree."""
        path = remap_video_path(path, base_url=self.settings.ark_base_url)
        base = self.settings.ark_base_url.rstrip("/")
        if not path.startswith("/"):
            path = "/" + path
        return f"{base}{path}"

    # Phân tích chứng chỉ kênh ARK theo định tuyến logic
    def _resolve_ark_route(self, capability: str, model_id: str | None) -> ResolvedModelRoute | None:
        logical_id = resolve_logical_model_id(capability, model_id)
        return resolve_logical_model(capability, logical_id)

    def _route_headers(self, route: ResolvedModelRoute | None = None) -> dict[str, str]:
        if route and route.api_key:
            return {
                "Authorization": f"Bearer {route.api_key}",
                "Content-Type": "application/json",
            }
        return self._headers()

    def _route_url(self, path: str, route: ResolvedModelRoute | None = None) -> str:
        """Ghép nối URL theo địa chỉ cơ sở định tuyến logic; quay lại _url khi không có định tuyến."""
        if route and route.base_url:
            path = remap_video_path(
                path,
                base_url=route.base_url,
                channel_id=getattr(route, "channel_id", "") or "",
            )
            base = route.base_url.rstrip("/")
            if not path.startswith("/"):
                path = "/" + path
            return f"{base}{path}"
        return self._url(path)

    def _video_json(
        self,
        body: dict[str, Any],
        route: ResolvedModelRoute | None = None,
    ) -> dict[str, Any]:
        """TokenFree gói phần thân Seedance Ark vào phần thân yêu cầu POST /v1/videos."""
        base = (route.base_url if route and route.base_url else self.settings.ark_base_url) or ""
        channel_id = (route.channel_id if route else "") or ""
        return prepare_video_create_body(body, base_url=base, channel_id=channel_id)

    def _finalize_video_result(self, result: TaskResult, task_id: str) -> TaskResult:
        """Khi TokenFree thành công nhưng không có URL công khai, thay vào đó hãy sử dụng GET /video/{id}/content."""
        result.provider_task_id = task_id
        if result.status == "succeeded" and not result.url and uses_tokenfree_video(
            base_url=self.settings.ark_base_url
        ):
            result.url = tokenfree_video_content_url(self.settings.ark_base_url, task_id)
        return result

    async def download_result_media(self, url: str, dest: Path) -> None:
        """Tải xuống phương tiện được tạo; URL nội dung/tác vụ TokenFree có Bearer, thời gian chờ đọc được thoải mái."""
        headers = None
        timeout: float | httpx.Timeout = 300.0
        if is_tokenfree_content_url(url) or is_tokenfree_image_url(url):
            headers = {"Authorization": f"Bearer {self._ark_api_key()}"}
            timeout = httpx.Timeout(connect=30.0, read=600.0, write=60.0, pool=30.0)
        await storage.download_to(url, dest, headers=headers, timeout=timeout)

    async def chat_storyboard(
        self,
        source_text: str,
        source_type: str,
        style_prefix: str,
        llm_system_addon: str,
        duration_min: int,
        duration_max: int,
        max_shot_duration: int,
        *,
        pipeline_mode: str = "full",
        character_hint: str = "",
        extra_requirements: str = "",
        consistency_mode: str = "character",
        output_ratio: str = "16:9",
        shot_range_override: tuple[int, int] | None = None,
        allow_source_names: bool = False,
    ) -> StoryboardResult:
        if self.mock:
            return await asyncio.to_thread(
                self._mock_storyboard,
                source_text,
                source_type,
                style_prefix,
                duration_min,
                duration_max,
                pipeline_mode,
                shot_range_override,
            )

        user_constraints = ""
        if (character_hint or "").strip():
            user_constraints += (
                f"Thiết lập nhân vật do người dùng chỉ định (bắt buộc tuân thủ nghiêm ngặt, ghi vào character_bible): {(character_hint or '').strip()}."
            )
        if (extra_requirements or "").strip():
            user_constraints += f"Yêu cầu hình ảnh bổ sung của người dùng: {(extra_requirements or '').strip()}."

        mode = (consistency_mode or "character").strip().lower()
        if mode not in {"character", "style", "diverse"}:
            mode = "character"

        if mode == "diverse":
            if (character_hint or "").strip():
                person_rule = (
                    "character_bible: Tóm tắt thiết lập nhân vật của người dùng (có thể đổi cá nhân cụ thể nhưng phải cùng một nhóm đối tượng).\n"
                    "【YÊU CẦU BẮT BUỘC VỀ NHÂN VẬT】Mỗi phân cảnh phải xuất hiện người thật phù hợp với thiết lập, khuôn mặt rõ nét "
                    "(góc nghiêng 3/4 hoặc nửa người xóa phông), cấm chỉ quay bàn tay, sau gáy, sau lưng không thấy mặt hoặc màn hình trống không người.\n"
                    "img_prompt phải miêu tả rõ sắc tộc/kiểu tóc/trang phục và góc nhìn khuôn mặt của nhân vật, cùng bối cảnh giao diện trước mặt; các cảnh có thể đổi người."
                )
            else:
                person_rule = (
                    "character_bible: Dựa vào chủ đề và quy tắc mẫu để quyết định có xuất hiện nhân vật hay không, không mặc định cả video phải có người hoặc không có người.\n"
                    "Nếu mẫu yêu cầu có người thì miêu tả rõ dạng người thao tác; nếu chủ đề tập trung vào giao diện/bối cảnh/sơ đồ thì ghi \"Không có nhân vật cố định\".\n"
                    "img_prompt miêu tả rõ chủ thể và bố cục của cảnh này, tuyệt đối không đi ngược lại quy tắc của mẫu."
                )
            consistency = (
                "Bắt buộc xuất đối tượng JSON nghiêm ngặt (không dùng mảng, không dùng markdown, không dùng khối mã): "
                '{"character_bible":"...","shots":[...]}。'
                f"{person_rule}"
                f"Phong cách thị giác chỉ dùng làm tham khảo cơ bản: {style_prefix}."
                f"{user_constraints}"
                "【QUY HOẠCH ĐỘNG】Phân tích lĩnh vực, hình thái sản phẩm và tình huống sử dụng của nội dung, sau đó quyết định bảng màu và loại giao diện trước khi chia cảnh; \n"
                "mỗi cảnh tương ứng với một thao tác hoặc tính năng khác nhau (tổng quan, tích hợp, không gian làm việc, quy trình, kết quả, triển khai, hệ sinh thái...). \n"
                "Màu sắc và chất liệu phải bám sát nội dung (SaaS sáng màu, tài liệu hướng dẫn, IDE tối màu, terminal, sơ đồ kiến trúc, bảng vẽ...),\n"
                "cấm mặc định dùng màu xanh neon/màn hình cyber/HUD gradient tím xanh, cấm các cảnh hình ảnh giống nhau lặp lại, cấm danh sách việc cần làm (todo list),\n"
                "cấm sao chép cùng một dashboard rồi chỉ đổi chữ."
            )
        elif mode == "style":
            consistency = (
                "Bắt buộc xuất đối tượng JSON nghiêm ngặt (không dùng mảng, không dùng markdown, không dùng khối mã): "
                '{"character_bible":"...","shots":[...]}。'
                "character_bible: Có thể ghi ngắn gọn «Không có nhân vật chính cố định» hoặc để trống ghi chú; không cần gượng ép thống nhất ngoại hình nhân vật.\n"
                f"Phong cách nghệ thuật đồng nhất: {style_prefix}.\n"
                f"{user_constraints}"
                "Bối cảnh và bố cục từng cảnh phải thay đổi theo nội dung, chỉ cần giữ cùng loại phong cách nghệ thuật, cấm các cảnh có hình ảnh gần như y hệt nhau.\n"
                "Mỗi cảnh img_prompt chỉ viết bối cảnh và bố cục của riêng cảnh đó."
            )
        else:
            consistency = (
                "Bắt buộc xuất đối tượng JSON nghiêm ngặt (không dùng mảng, không dùng markdown, không dùng khối mã): "
                '{"character_bible":"...","shots":[...]}。'
                "character_bible: Viết khoảng 40-90 từ tiếng Việt, mô tả cố định ngoại hình nhân vật/chủ thể xuất hiện xuyên suốt video "
                "(độ tuổi, kiểu tóc màu tóc, thần thái gương mặt, vóc dáng, phối màu trang phục và vật nhận diện), đây là thiết lập duy nhất cho toàn bộ video, nghiêm cấm đổi thiết lập qua từng cảnh.\n"
                f"Yêu cầu phong cách nghệ thuật (bắt buộc thống nhất toàn video): {style_prefix}.\n"
                f"{user_constraints}"
                "Nghiêm cấm lẫn lộn giữa ảnh chụp người thật và tranh minh họa hoạt hình anime; nghiêm cấm tự ý đổi mặt, đổi trang phục hay đổi kiểu tóc giữa các cảnh.\n"
                "Mỗi cảnh img_prompt chỉ viết bối cảnh và bố cục của riêng cảnh đó (cảnh vật, hành động, ánh sáng), không sao chép lại đoạn mô tả phong cách/nhân vật dài dòng; "
                "khi nhân vật xuất hiện chỉ cần nhắc lại các nét đặc trưng chính khớp với character_bible."
            )
        # shot_cap Giới hạn trên của thời lượng bắn một lần (giây); shot_lo/shot_hi bị khóa theo số từ trong bản sao hoặc mẫu
        shot_cap = min(duration_max, max_shot_duration)
        if shot_range_override:
            shot_lo, shot_hi = shot_range_override
        else:
            shot_lo, shot_hi = segplan.suggested_kepu_shot_range(source_text, pipeline_mode=pipeline_mode)
        shot_range = f"{shot_lo}-{shot_hi}"
        # name_rule Mẫu chuyển đổi khách hàng giữ lại tên cửa hàng trong bản sao của người dùng; các mẫu khác sử dụng tên chung để tránh nhãn hiệu.
        name_rule = storyboard_name_policy(allow_source_names)
        # Seg_rules Các ràng buộc sản xuất kịch bản theo từng phân đoạn theo từng đoạn khoa học phổ biến (phù hợp với gợi ý truyện tranh, không có @asset)
        segment_rules = (
            "【QUY TẮC TẠO SEGMENTS】\n"
            "segments là mảng bắt buộc; hệ thống sẽ biên tập kịch bản gồm @duration + phụ đề lời bình + lồng nhạc nền BGM.\n"
            "Phụ đề và nhạc được ghép ở khâu hậu kỳ, không phải vẽ cứng vào video. Do đó kind/text/duration phải dùng được trực tiếp.\n"
            "Thứ tự các đoạn ưu tiên xen kẽ: hình ảnh -> lời bình, đoạn đầu tiên nên có kind=visual (đảm bảo khung hình đầu tiên có nội dung);\n"
            "text của visual/action phải chứa: cỡ cảnh + hành động chủ thể + loại bối cảnh/giao diện, cấm cảnh trống vô nghĩa hoặc từ ngữ mơ hồ;\n"
            "text của narration là câu thoại đọc trôi chảy, ước tính khoảng 3-4 từ tiếng Việt/giây cho duration (nhịp độ tự nhiên);\n"
            "duration của lời bình phải bám sát số lượng từ, chỉ thêm tối đa 1 giây nghỉ, cấm kéo dài câu ngắn chạm trần thời lượng;\n"
            "Mỗi phân đoạn duration từ 3-12 giây, tổng các đoạn trong cảnh xấp xỉ bằng duration của cảnh đó và không vượt quá "
            f"{shot_cap} giây.\n"
            f"{name_rule}"
            "character_bible và bgm_lock là duy nhất cho toàn phim, các cảnh không được tự ý đổi nhân vật hay trôi dạt cảm xúc BGM."
        )
        if pipeline_mode == "image_text":
            diversity_note = (
                f"Chia thành {shot_range} phân cảnh, mỗi cảnh là một khung cảnh thị giác độc lập; "
                + (
                    "Phong cách thị giác đồng nhất, nhưng bố cục giao diện/bối cảnh phải khác biệt rõ rệt."
                    if mode != "character"
                    else "Phong cách nghệ thuật và nhân vật phải đồng nhất toàn video."
                )
            )
            ratio = (output_ratio or "16:9").strip() or "16:9"
            orient = "khung dọc 9:16" if ratio == "9:16" else ("khung vuông 1:1" if ratio == "1:1" else "khung ngang 16:9")
            system = (
                f"Bạn là biên kịch video ngắn dạng hình ảnh + thuyết minh {orient}. Tất cả các trường (title, subtitle, text, img_prompt, segments...) bắt buộc viết bằng tiếng Việt.\n"
                f"{consistency}{llm_system_addon}"
                f"Mỗi phân cảnh duration trong khoảng {duration_min}-{shot_cap} giây.\n"
                "Đây là chế độ «Hình tĩnh + Chữ phụ đề + Lồng tiếng»: không sinh video AI, cần lời bình lồng tiếng;\n"
                "Khung hình cấm xuất hiện bất kỳ chữ viết/watermark/phụ đề vẽ cứng nào.\n"
                "Ý nghĩa các trường trong shots:\n"
                "- shot: Số thứ tự phân cảnh (số nguyên 1, 2, 3...)\n"
                "- duration: Thời lượng cảnh (giây)\n"
                "- title: Tiêu đề tóm tắt ngắn gọn nội dung cảnh, từ 3-8 từ tiếng Việt, mang tính đúc kết súc tích; cấm cắt cụt từ text\n"
                "- subtitle: Phụ đề tóm tắt ý chính/điểm nhấn của cảnh, từ 8-20 từ tiếng Việt\n"
                "- text: Lời bình/lời thoại của cảnh, văn phong tự nhiên truyền cảm để đọc TTS, độ dài tương ứng thời lượng cảnh (khoảng 20-50 từ tiếng Việt)\n"
                "- segments: Mảng chi tiết các phân đoạn trong cảnh: mỗi phần tử gồm duration (giây), kind=\"visual\" hoặc \"narration\", text (nội dung); visual mô tả cỡ cảnh và động tác, narration là câu đọc thoại\n"
                f"- img_prompt: Câu mô tả hình ảnh {orient} tỉ lệ {ratio} chi tiết (bối cảnh, ánh sáng, góc máy, chủ thể ở giữa, cấm yêu cầu vẽ chữ; {name_rule})\n"
                "- video_prompt: Có thể để trống hoặc mô tả zoom nhẹ, camera: góc máy (ví dụ: quay cận cảnh, lia máy chậm...), bgm: cảm xúc âm nhạc đồng điệu toàn video\n"
                "- Trường bgm_lock ở cấp ngoài cùng: tóm tắt 1 câu cảm xúc âm nhạc chủ đạo của toàn bộ video."
                f"{segment_rules}"
                f"{diversity_note}"
            )
        else:
            diversity_note = (
                f"Chia thành {shot_range} phân cảnh, nhịp cắt cảnh dứt khoát, bối cảnh từng cảnh bám sát nội dung, cấm các cảnh trống lặp lại."
                if mode != "character"
                else f"Phong cách nghệ thuật và nhân vật bắt buộc thống nhất toàn bộ video; chia thành {shot_range} phân cảnh."
            )
            system = (
                "Bạn là biên kịch phân cảnh video ngắn chuyên nghiệp. Tất cả các trường (bao gồm title, text, img_prompt, video_prompt, camera, bgm, segments) phải ưu tiên viết bằng tiếng Việt (hoặc ngôn ngữ của kịch bản đầu vào)."
                f"{consistency}{llm_system_addon}"
                f"Thời lượng duration mỗi cảnh trong khoảng {duration_min}-{shot_cap} giây, không kéo dài vô nghĩa để cố làm đầy thời lượng tối đa."
                "Mô tả các trường trong shots:"
                "shot (số thứ tự), duration (giây),"
                "title (tiêu đề ngắn tóm tắt lời bình của cảnh này, 2-8 từ, ngữ nghĩa hoàn chỉnh;"
                "bắt buộc phải là tóm tắt đúc kết, cấm cắt lấy tiền tố từ text, cấm ngắt cụm từ chuyên ngành như ERP→ER),"
                "subtitle (tùy chọn, một câu tóm tắt điểm chính 8-22 từ),"
                "text (lời thoại/lời bình lồng tiếng, đồng nhất với nội dung narration trong segments hoặc là bản tóm tắt của nó),"
                "segments (mảng bắt buộc, chính xác đến từng đoạn nhỏ: mỗi mục gồm duration, kind=visual|narration|action, text),"
                "img_prompt (prompt hình ảnh khung hình đầu tiên bằng tiếng Việt mô tả trực quan cụ thể, chi tiết cảnh vật và bố cục),"
                "video_prompt (prompt chuyển động video, có thể đồng nhất với tóm tắt hình ảnh trong segments),"
                "camera (chuyển động máy quay, ví dụ: pan chậm lên trên/push in nhẹ/lia ngang), bgm (cảm xúc âm nhạc, thống nhất toàn bộ video)."
                "Ở cấp cao nhất (root) xuất thêm trường bgm_lock (mô tả một câu về bầu không khí BGM thống nhất toàn video, đồng nhất với bgm của từng cảnh)."
                "img_prompt và video_prompt cấm dùng câu tiếng Anh, thuật ngữ/danh từ riêng có thể giữ nguyên."
                f"{segment_rules}"
                f"{diversity_note}"
            )
        user = (
            f"Thể loại đầu vào: {source_type}. Hãy thấu hiểu sâu sắc nội dung và bối cảnh sử dụng, sau đó chia thành các phân cảnh chi tiết "
            f"({shot_range} cảnh, nhịp cắt cảnh súc tích, không câu giờ vô nghĩa):\n{source_text}"
        )
        if is_chatgpt2api_configured():
            content = await chatgpt2api_completions(system, user, timeout=120.0)
            if not (content or "").strip():
                logger.warning("Mô hình phân cảnh LLM trả về rỗng, thử lại lần nữa source_type=%s", source_type)
                retry_user = (
                    f"{user}\n\n"
                    "【QUAN TRỌNG】Chỉ xuất một đối tượng JSON hợp lệ duy nhất, cấp cao nhất chứa character_bible, bgm_lock, mảng shots;\n"
                    "không dùng khối mã markdown, không xuống dòng không thoát chuỗi."
                )
                content = await chatgpt2api_completions(system, retry_user, timeout=120.0)
        else:
            json_format = {"type": "json_object"}
            try:
                content = await chat_completions(
                    system,
                    user,
                    temperature=0.6,
                    timeout=120.0,
                    response_format=json_format,
                )
            except RuntimeError as exc:
                if "response_format" not in str(exc).lower():
                    raise
                logger.warning("Mô hình LLM không hỗ trợ response_format, chuyển xuống gọi thông thường: %s", exc)
                content = await chat_completions(system, user, temperature=0.6, timeout=120.0)

            if not (content or "").strip():
                logger.warning("Mô hình phân cảnh LLM trả về rỗng, thử lại lần nữa source_type=%s", source_type)
                retry_user = (
                    f"{user}\n\n"
                    "【QUAN TRỌNG】Chỉ xuất một đối tượng JSON hợp lệ duy nhất, cấp cao nhất chứa character_bible, bgm_lock, mảng shots;\n"
                    "không dùng khối mã markdown, không xuống dòng không thoát chuỗi."
                )
                try:
                    content = await chat_completions(
                        system,
                        retry_user,
                        temperature=0.6,
                        timeout=120.0,
                        response_format=json_format,
                    )
                except RuntimeError as exc:
                    if "response_format" not in str(exc).lower():
                        raise
                    content = await chat_completions(
                        system, retry_user, temperature=0.6, timeout=120.0
                    )

        if not (content or "").strip():
            raise RuntimeError("Mô hình phân cảnh trả về nội dung rỗng, vui lòng kiểm tra cấu hình kênh mô hình văn bản hoặc thử lại sau")

        return self._parse_storyboard(
            content,
            style_prefix,
            duration_min,
            duration_max,
            max_shot_duration,
        )

    async def gen_image(
        self,
        prompt: str,
        negative: str = "",
        ref_urls: list[str] | None = None,
        *,
        project_id: int | None = None,
        shot_no: int | None = None,
        size: str | None = None,
        model: str | None = None,
        aspect_ratio: str | None = None,
        style_ref_urls: list[str] | None = None,
    ) -> ImageResult:
        """Gọi TokenFree để tạo ảnh (dòng Seedream tập trung tạo ảnh tại gateway).

        Chỉ làm mềm nội dung văn bản người dùng và giữ lại tiền tố bảng thiết lập; khi gặp InputTextSensitive vẫn thử lại bằng 3 góc nhìn (three-view) đơn giản hóa,
        mức cuối cùng mới rút gọn thành «3 góc nhìn + phong cách trang phục». Không dự phòng chủ thể rỗng / CG dày màu.
        """
        resolved = (model or "").strip()
        if not resolved or resolved in {"ark-seedream"} or resolved.startswith("kie-"):
            ark_model = None
        else:
            ark_model = resolved

        if self.mock:
            local = await asyncio.to_thread(self._write_mock_image, prompt, size)
            # _write_mock_image returns /static/...; publish to OSS when enabled
            path = storage.local_path_from_url(local)
            url = storage.publish_local(path) if path and path.exists() else local
            return ImageResult(local_url=url, remote_url=None)

        # Ưu tiên tạo ảnh qua ChatGPT2API
        try:
            from app.services.drama.chatgpt_image_api import generate_chatgpt_image

            local_url = await generate_chatgpt_image(
                prompt,
                ref_urls=ref_urls,
                size=size,
                aspect_ratio=aspect_ratio,
                project_id=project_id,
                shot_no=shot_no,
            )
            return ImageResult(local_url=local_url, remote_url=None)
        except Exception as chatgpt_err:
            logger.warning("ChatGPT2API tạo ảnh thất bại: %s; thử qua Seedream", chatgpt_err)

        from app.services.seedream_text_soften import (
            compact_seedream_prompt_for_retry,
            soften_seedream_input_text,
            style_only_seedream_prompt_for_retry,
        )

        # Chỉ làm mềm văn bản người dùng và giữ lại tiền tố cấu trúc ký tự/cảnh/prop (ba chế độ xem, v.v.)
        original = (prompt or "").strip()
        current = soften_seedream_input_text(original)
        if current != original:
            logger.info(
                "Seedream input softened shot=%s before=%s after=%s",
                shot_no,
                len(original),
                len(current),
            )

        attempts = [current]
        for builder in (
            compact_seedream_prompt_for_retry,
            style_only_seedream_prompt_for_retry,
        ):
            candidate = builder(current)
            if candidate and candidate not in attempts:
                attempts.append(candidate)

        last_err: Exception | None = None
        labels = ("softened", "compact", "style_only")
        for idx, candidate in enumerate(attempts):
            full_prompt = f"{candidate}. Tránh: {negative}" if negative else candidate
            try:
                return await self._seedream_once(
                    full_prompt,
                    ref_urls,
                    project_id=project_id,
                    shot_no=shot_no,
                    size=size,
                    model=ark_model,
                    aspect_ratio=aspect_ratio,
                    style_ref_urls=style_ref_urls,
                )
            except Exception as exc:  # noqa: BLE001
                last_err = exc
                msg = str(exc)
                # Chỉ xem xét văn bản mới có thể sử dụng tính năng nén/thử lại kiểu; các chiến lược/lỗi khác sẽ thất bại trực tiếp
                if not self._is_seedream_input_text_sensitive(msg):
                    if self._is_seedream_policy_error(msg):
                        logger.warning(
                            "Seedream policy hit shot=%s; failing without fallback",
                            shot_no,
                        )
                    raise
                if idx + 1 < len(attempts):
                    nxt = labels[idx + 1] if idx + 1 < len(labels) else "next"
                    logger.warning(
                        "Seedream InputTextSensitive shot=%s; retrying %s prompt",
                        shot_no,
                        nxt,
                    )
                    continue
                logger.warning(
                    "Seedream InputTextSensitive shot=%s; retries exhausted",
                    shot_no,
                )
                raise
        raise RuntimeError(str(last_err) if last_err else "Seedream failed")

    async def _seedream_once(
        self,
        full_prompt: str,
        ref_urls: list[str] | None,
        *,
        project_id: int | None,
        shot_no: int | None,
        size: str | None,
        model: str | None = None,
        aspect_ratio: str | None = None,
        style_ref_urls: list[str] | None = None,
    ) -> ImageResult:
        """Yêu cầu Seedream đơn lẻ và vị trí đĩa (tên tệp chứa uuid để tránh ghi đè do tái tạo)."""
        route = self._resolve_ark_route("image", model)
        upstream_model = route.upstream_model if route else ((model or "").strip() or self.settings.model_image)
        from app.services.drama.seedream_options import (
            clamp_seedream_pixel_size,
            is_seedream_pro_model,
        )

        resolved_size = size or self.settings.ark_image_size
        if is_seedream_pro_model(upstream_model):
            # Pro: Thiết bị 3K/4K là bất hợp pháp; tỷ lệ WxH quá khổ được kẹp ở mức 4624220
            tier = str(resolved_size or "").strip().upper()
            if tier in {"3K", "4K"}:
                resolved_size = "2K"
            else:
                resolved_size = clamp_seedream_pixel_size(str(resolved_size))
        from app.services.style_lock import split_seedream_subject_style_refs

        subject_refs, style_refs = split_seedream_subject_style_refs(ref_urls, style_ref_urls)
        refs = [*subject_refs, *style_refs]
        channel_id = (route.channel_id if route else "") or ""
        base = (route.base_url if route and route.base_url else self.settings.ark_base_url) or ""
        on_tokenfree = uses_tokenfree_image(base_url=base, channel_id=channel_id)
        chosen = tokenfree_working_image_model(upstream_model) if on_tokenfree else upstream_model
        if on_tokenfree and "gpt-image" in chosen.lower():
            # Kie / gpt-image thực sự nằm trong phạm vi 1K·2K; 3K/4K được giới hạn ở mức 2K, phù hợp với hóa đơn
            if str(resolved_size or "").strip().upper() in {"3K", "4K"}:
                resolved_size = "2K"
        if on_tokenfree:
            if chosen != (upstream_model or "").strip():
                logger.warning("Hệ thống chuyển %s sang %s để tránh lỗi giao thức Seedream", upstream_model, chosen)
            path = "/responses"
            body = build_tokenfree_image_body(
                model=chosen,
                prompt=full_prompt,
                size=str(resolved_size or ""),
                ref_urls=subject_refs,
                style_ref_urls=style_refs,
            )
        else:
            path = "/images/generations"
            body = {
                "model": upstream_model,
                "prompt": full_prompt,
                "size": resolved_size,
                "response_format": "url",
                "watermark": False,
            }
            if refs:
                body["image"] = refs if len(refs) > 1 else refs[0]

        try:
            async with httpx.AsyncClient(timeout=_upstream_timeout(IMAGE_GEN_READ_SEC)) as client:
                async def _post():
                    # POST ngược dòng đơn, việc thử lại giới hạn dòng điện được bao bọc bởi lớp bên ngoài
                    return await client.post(
                        self._route_url(path, route),
                        headers=self._route_headers(route),
                        json=body,
                    )

                if on_tokenfree:
                    async with tokenfree_image_slot():
                        resp = await post_until_not_rate_limited(_post)
                else:
                    resp = await _post()
                # Giới hạn hiện tại/4xx sử dụng tính năng sao chép HTTP; 200 + status=failed được để lại cho raise_tokenfree_image_if_failed
                if resp.status_code >= 400 or is_tokenfree_rate_limit(
                    status_code=resp.status_code, body=resp.text
                ):
                    _raise_seedream_http_error(
                        resp.status_code,
                        resp.text,
                        model=chosen,
                        tokenfree=on_tokenfree,
                    )
                data = resp.json()
        except httpx.TimeoutException as exc:
            reraise_upstream_timeout(exc, kind="Tạo ảnh", read_sec=IMAGE_GEN_READ_SEC)

        if on_tokenfree:
            raise_tokenfree_image_if_failed(data)

        usage_parsed = parse_usage_dict(data)
        raw_usage = data.get("usage") if isinstance(data.get("usage"), dict) else None
        if not raw_usage and isinstance(data.get("data"), list) and data["data"]:
            first = data["data"][0]
            if isinstance(first, dict) and isinstance(first.get("usage"), dict):
                raw_usage = first["usage"]
                usage_parsed = parse_usage_dict({"usage": raw_usage})
        upstream_cost_fen = parse_upstream_cost_fen(data)
        if upstream_cost_fen is None and raw_usage:
            upstream_cost_fen = parse_upstream_cost_fen({"usage": raw_usage})

        remote = extract_tokenfree_image_url(data) if on_tokenfree else self._extract_image_url(data)
        if not remote:
            remote = self._extract_image_url(data) or extract_tokenfree_image_url(data)
        if not remote:
            logger.warning("Phản hồi tạo ảnh không có URL ảnh: %s", json.dumps(data, ensure_ascii=False)[:500])
            raise RuntimeError("Tạo ảnh không trả về URL ảnh, vui lòng thử lại sau")

        dest_dir = storage.project_dir(project_id or 0)
        name = f"shot_{(shot_no or 0):03d}_{uuid.uuid4().hex[:12]}.png"
        dest = dest_dir / name
        dl_headers = None
        if is_tokenfree_image_url(remote) or is_tokenfree_content_url(remote):
            dl_headers = {"Authorization": f"Bearer {self._ark_api_key()}"}
        await storage.download_to(remote, dest, headers=dl_headers)
        merged_usage = dict(raw_usage or {})
        if resolved_size:
            merged_usage.setdefault("size", str(resolved_size))
        return ImageResult(
            local_url=storage.publish_local(dest, sync=True),
            remote_url=remote,
            total_tokens=int(usage_parsed.get("total_tokens") or 0),
            prompt_tokens=int(usage_parsed.get("prompt_tokens") or 0),
            completion_tokens=int(usage_parsed.get("completion_tokens") or 0),
            raw_usage=merged_usage or None,
            upstream_cost_fen=upstream_cost_fen,
        )

    @staticmethod
    def _is_seedream_input_text_sensitive(msg: str) -> bool:
        """Seedream Enter chặn đánh giá copywriting (từ nhắc nhở có thể nén để thử lại)."""
        text = msg or ""
        return (
            "InputTextSensitive" in text
            or "InputTextSensitiveContentDetected" in text
            or "生图文案未通过内容审核" in text
            or "Văn bản tạo ảnh không vượt qua kiểm duyệt nội dung" in text
        )

    @staticmethod
    def _is_seedream_input_privacy_error(msg: str) -> bool:
        """Hình ảnh tham chiếu / Chặn quyền riêng tư người thật từ phía đầu vào (thay đổi prompt văn bản cũng không hiệu quả)."""
        text = msg or ""
        return any(
            k in text
            for k in ("PrivacyInformation", "InputImageSensitive")
        )

    @staticmethod
    def _is_seedream_policy_error(msg: str) -> bool:
        """Chặn chính sách nội dung văn bản hoặc đầu ra (lỗi trực tiếp ở phía tạo ảnh, không thể dùng prompt dự phòng)."""
        text = msg or ""
        if ArkGateway._is_seedream_input_privacy_error(text):
            return False
        if ArkGateway._is_seedream_input_text_sensitive(text):
            return True
        return (
            "PolicyViolation" in text
            or "SensitiveContent" in text
            or "OutputImageSensitive" in text
        )

    @staticmethod
    def _is_seedance_input_privacy_error(msg: str) -> bool:
        """Seedance chặn quyền riêng tư người thật từ ảnh tham chiếu (thay đổi prompt kịch bản video sẽ không có tác dụng)."""
        text = msg or ""
        return any(
            k in text
            for k in (
                "PrivacyInformation",
                "InputImageSensitive",
                "参考图疑似真人",
                "Ảnh tham chiếu nghi vấn là người thật",
                "may contain real person",
            )
        )

    @staticmethod
    def _is_seedance_text_policy_error(msg: str) -> bool:
        """Seedance chặn nội dung kịch bản / chính sách (có thể thêm phong cách CG và thử lại)."""
        text = msg or ""
        if ArkGateway._is_seedance_input_privacy_error(text):
            return False
        lowered = text.lower()
        if (
            "分镜文案未通过内容审核" in text
            or "Văn bản phân cảnh không vượt qua kiểm duyệt nội dung" in text
        ):
            return True
        return any(
            k in lowered
            for k in (
                "inputtextsensitive",
                "text sensitive",
                "policyviolation",
                "outputimagesensitive",
                "sensitivecontentdetected",
                "sensitivecontent",
            )
        )

    @staticmethod
    def _with_seedream_cg_style(prompt: str) -> str:
        """Thêm kiểu impasto CG vào cuối từ nhắc (trả về như cũ nếu nó đã được đưa vào)."""
        base = (prompt or "").strip()
        if not base:
            return _SEEDREAM_CG_STYLE
        if _SEEDREAM_CG_STYLE in base:
            return base
        return f"{base}。{_SEEDREAM_CG_STYLE}"

    @staticmethod
    def _with_seedance_cg_style(prompt: str) -> str:
        """Các từ gợi ý video được thêm lớp phủ dày CG (cách viết quảng cáo giống như Seedream)."""
        return ArkGateway._with_seedream_cg_style(prompt)

    @staticmethod
    def _seedance_content_with_cg_style(
        content: list[Any] | None,
    ) -> list[dict[str, Any]] | None:
        """Thêm CG vào tất cả các mục văn bản trong nội dung[]; trả về Không nếu không có thay đổi."""
        if not isinstance(content, list):
            return None
        changed = False
        out: list[dict[str, Any]] = []
        for item in content:
            if not isinstance(item, dict):
                out.append(item)
                continue
            if item.get("type") != "text":
                out.append(dict(item))
                continue
            text = str(item.get("text") or "")
            cg = ArkGateway._with_seedance_cg_style(text)
            if cg != text:
                changed = True
                out.append({**item, "text": cg})
            else:
                out.append(dict(item))
        return out if changed else None

    @staticmethod
    def _sanitize_seedream_prompt(prompt: str) -> str:
        """Làm mềm thương hiệu/IP (tùy chọn để người gọi sử dụng chẳng hạn như bảng phân cảnh khoa học phổ biến; đường dẫn chính của bản vẽ sẽ không được viết lại)."""
        out = prompt or ""
        for pat, repl in _SEEDREAM_SANITIZE:
            out = pat.sub(repl, out)
        return out

    def _extract_image_url(self, data: dict[str, Any]) -> str | None:
        if "data" in data and data["data"]:
            item = data["data"][0]
            return item.get("url") or item.get("b64_json")
        if "url" in data:
            return data["url"]
        return None

    @staticmethod
    def _seedance_prompt_text(prompt: str) -> str:
        """Seedance 2.0 may require JSON text with summary_caption (BodyFormat)."""
        clean = (prompt or "").strip() or "Chuyển động nhẹ nhàng trong khung hình, giữ chủ thể ổn định"
        clean = re.sub(r"\s+", " ", clean).strip()
        if clean.startswith("{"):
            try:
                obj = json.loads(clean)
                if isinstance(obj, dict):
                    if not str(obj.get("summary_caption") or "").strip():
                        obj["summary_caption"] = str(
                            obj.get("prompt") or obj.get("text") or clean
                        )[:500]
                    return json.dumps(obj, ensure_ascii=False)
            except json.JSONDecodeError:
                pass
        return json.dumps({"summary_caption": clean[:500]}, ensure_ascii=False)

    @staticmethod
    def _seedance_duration(duration: int | float) -> int:
        s = get_settings()
        lo = int(getattr(s, "seedance_duration_min", 4) or 4)
        hi = int(getattr(s, "seedance_duration_max", 30) or 30)
        return int(max(lo, min(int(round(float(duration))), hi)))

    async def gen_video_i2v(
        self,
        image_url: str,
        prompt: str,
        duration: int,
        *,
        character_consistency: bool = True,
        resolution: str = "480p",
        ratio: str | None = None,
        prompt_as_json: bool = True,
        return_last_frame: bool = True,
        generate_audio: bool = False,
        extra_image_urls: list[str] | None = None,
        model: str | None = None,
    ) -> str:
        if self.mock:
            digest = hashlib.md5(f"{image_url}:{prompt}".encode()).hexdigest()[:10]
            return f"mock-task-{digest}"

        # Ưu tiên tạo video qua Flow API (Google Veo) nếu model là flow-veo hoặc không chỉ định
        if model in ("flow-veo", "flow", "veo", "google-veo"):
            try:
                from app.services.drama.flow_api import submit_flow_video

                return submit_flow_video(
                    prompt=prompt,
                    image_ref=image_url,
                    aspect_ratio=ratio or "9:16",
                )
            except Exception as flow_err:
                logger.warning("Flow API tạo video thất bại: %s; thử qua Seedance", flow_err)

        # Seedance needs a publicly reachable https image (data URI often rejected / odd errors)
        image_ref = await self._resolve_image_ref(image_url, prefer_https=True)
        # Prefer plain timed script for Seedance 2.5; JSON caption kept as fallback
        plain = (prompt or "").strip() or "Chuyển động nhẹ nhàng trong khung hình, giữ chủ thể ổn định"
        text = plain if not prompt_as_json else self._seedance_prompt_text(prompt)
        # If prompt looks like manju-style script, always send plain text
        if "@duration:" in plain or "00:" in plain or plain.startswith("【"):
            text = plain
            prompt_as_json = False
        # Sử dụng tham chiếu_image + tỷ lệ (có thể buộc 9:16) khi có khung mục tiêu.
        # Pure first_frame cấm truyền tỷ lệ và trong thử nghiệm thực tế, ngay cả khi khung tĩnh ở màn hình dọc, nó có thể hiển thị màn hình ngang.
        image_role, target_ratio = resolve_seedance_i2v_image_role(ratio)
        extra_refs: list[str] = []
        for raw in extra_image_urls or []:
            text_url = str(raw or "").strip()
            if not text_url:
                continue
            try:
                extra_refs.append(await self._resolve_image_ref(text_url, prefer_https=True))
            except Exception:  # noqa: BLE001
                logger.warning("Seedance extra ref resolve failed url=%s", text_url[:120])
        if extra_refs:
            # Nhiều hình ảnh chỉ có thể sử dụng reference_image và không thể trộn lẫn với first_frame.
            image_role = "reference_image"
            if not target_ratio:
                target_ratio = (ratio or "").strip() or "16:9"
        content: list[dict[str, Any]] = [
            {"type": "text", "text": text},
            {
                "type": "image_url",
                "image_url": {"url": image_ref},
                "role": image_role,
            },
        ]
        for extra in extra_refs[:2]:
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": extra},
                    "role": "reference_image",
                }
            )
        route = self._resolve_ark_route("video", self.settings.model_video)
        video_model = route.upstream_model if route else self.settings.model_video
        body: dict[str, Any] = {
            "model": video_model,
            "content": content,
            "duration": self._seedance_duration(duration),
            "resolution": resolution,
            "watermark": False,
            "generate_audio": bool(generate_audio),
            "return_last_frame": bool(return_last_frame),
        }
        if target_ratio:
            body["ratio"] = target_ratio
        # Do not send character_consistency — unknown fields have caused BodyFormat failures
        logger.info(
            "Seedance i2v create model=%s duration=%s resolution=%s ratio=%s role=%s generate_audio=%s",
            body["model"],
            body["duration"],
            resolution,
            body.get("ratio") or "(omit)",
            image_role,
            body["generate_audio"],
        )

        try:
            async with httpx.AsyncClient(timeout=_upstream_timeout(VIDEO_CREATE_READ_SEC)) as client:
                resp = await client.post(
                    self._route_url("/contents/generations/tasks", route),
                    headers=self._route_headers(route),
                    json=self._video_json(body, route),
                )
                if resp.status_code >= 400 and prompt_as_json:
                    # Fallback: plain text prompt
                    body["content"][0]["text"] = plain
                    resp = await client.post(
                        self._route_url("/contents/generations/tasks", route),
                        headers=self._route_headers(route),
                        json=self._video_json(body, route),
                    )
                # Chiến lược viết quảng cáo: Trước khi hoàn nguyên tỷ lệ/cấu trúc thích ứng, hãy thêm CG vào nội dung ý định hiện tại và thử lại.
                if resp.status_code >= 400:
                    raw_err = resp.text or ""
                    if self._is_seedance_input_privacy_error(raw_err):
                        raise RuntimeError(_format_seedance_create_error(resp.status_code, raw_err))
                    if self._is_seedance_text_policy_error(raw_err):
                        cg_content = self._seedance_content_with_cg_style(body.get("content"))
                        if cg_content is not None:
                            logger.warning("Seedance i2v text policy hit; retrying with CG style")
                            body = {**body, "content": cg_content}
                            resp = await client.post(
                                self._route_url("/contents/generations/tasks", route),
                                headers=self._route_headers(route),
                                json=self._video_json(body, route),
                            )
                        if resp.status_code >= 400:
                            raise RuntimeError(
                                _format_seedance_create_error(resp.status_code, resp.text)
                            )
                if resp.status_code >= 400:
                    err_text = resp.text or ""
                    # Chỉ xóa tỷ lệ khi "lạm dụng first_frame + tỷ lệ"; không quay lại màn hình ngang thích ứng khi có khung mục tiêu
                    if (
                        not target_ratio
                        and "ratio" in err_text.lower()
                        and "ratio" in body
                    ):
                        body.pop("ratio", None)
                        resp = await client.post(
                            self._route_url("/contents/generations/tasks", route),
                            headers=self._route_headers(route),
                            json=self._video_json(body, route),
                        )
                if resp.status_code >= 400 and not target_ratio:
                    # Dự phòng khả năng tương thích khi không có khung mục tiêu; vô hiệu hóa thích ứng khi có mục tiêu màn hình dọc để tránh màn hình ngang trở lại
                    body["content"][1].pop("role", None)
                    body["ratio"] = "adaptive"
                    resp = await client.post(
                        self._route_url("/contents/generations/tasks", route),
                        headers=self._route_headers(route),
                        json=self._video_json(body, route),
                    )
                if resp.status_code >= 400:
                    raise RuntimeError(_format_seedance_create_error(resp.status_code, resp.text))
                data = resp.json()
        except httpx.TimeoutException as exc:
            reraise_upstream_timeout(exc, kind="Tạo video", read_sec=VIDEO_CREATE_READ_SEC)

        task_id = extract_video_task_id(data)
        if not task_id:
            raise RuntimeError(f"Seedance missing task id: {data}")
        return task_id

    async def _resolve_media_ref(self, media_url: str, *, prefer_https: bool = False) -> str:
        """Phân tích URL hình ảnh/âm thanh để Seedance kéo."""
        return await self._resolve_image_ref(media_url, prefer_https=prefer_https)

    async def _resolve_seedance_content_items(
        self,
        items: list[dict[str, Any]],
        *,
        project_id: int = 0,
    ) -> list[dict[str, Any]]:
        resolved: list[dict[str, Any]] = []
        for item in items:
            copy = dict(item)
            if item.get("type") == "image_url":
                raw_url = (item.get("image_url") or {}).get("url") or ""
                copy["image_url"] = {
                    "url": await self._resolve_media_ref(str(raw_url), prefer_https=True)
                }
            elif item.get("type") == "audio_url":
                raw_url = (item.get("audio_url") or {}).get("url") or ""
                copy["audio_url"] = {
                    "url": await self._resolve_media_ref(str(raw_url), prefer_https=True)
                }
            resolved.append(copy)
        return resolved

    async def gen_video_seedance_body(
        self,
        body: dict[str, Any],
        *,
        project_id: int = 0,
        content_labels: list[str] | None = None,
    ) -> str:
        """Gửi nội dung yêu cầu đa phương thức Seedance (hình ảnh tham chiếu + reference_audio).

        Khi bị chặn bởi nội dung/chính sách, thêm prompt phong cách vẽ CG dày màu và thử lại một lần; không thử lại nếu bị chặn bởi quyền riêng tư do ảnh tham chiếu là người thật.
        """
        if self.mock:
            digest = hashlib.md5(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()[
                :10
            ]
            return f"mock-task-{digest}"

        payload = dict(body)
        content = payload.get("content")
        if isinstance(content, list):
            payload["content"] = await self._resolve_seedance_content_items(
                content,
                project_id=project_id,
            )
        payload["duration"] = self._seedance_duration(payload.get("duration", 8))
        route = self._resolve_ark_route("video", str(payload.get("model") or ""))

        logger.info(
            "Seedance multimodal create model=%s duration=%s items=%s",
            payload.get("model"),
            payload.get("duration"),
            len(payload.get("content") or []),
        )

        try:
            async with httpx.AsyncClient(timeout=_upstream_timeout(VIDEO_CREATE_READ_SEC)) as client:
                resp = await client.post(
                    self._route_url("/contents/generations/tasks", route),
                    headers=self._route_headers(route),
                    json=self._video_json(payload, route),
                )
                if resp.status_code >= 400:
                    raw_err = resp.text or ""
                    # Ảnh tham khảo người thật: Việc thay đổi bản sao không hợp lệ
                    if self._is_seedance_input_privacy_error(raw_err):
                        raise RuntimeError(
                            _format_seedance_create_error(
                                resp.status_code,
                                raw_err,
                                content_labels=content_labels,
                            )
                        )
                    cg_content = None
                    if self._is_seedance_text_policy_error(raw_err):
                        cg_content = self._seedance_content_with_cg_style(payload.get("content"))
                    if cg_content is not None:
                        logger.warning(
                            "Seedance text policy hit project=%s; retrying with CG style",
                            project_id,
                        )
                        payload = {**payload, "content": cg_content}
                        resp = await client.post(
                            self._route_url("/contents/generations/tasks", route),
                            headers=self._route_headers(route),
                            json=self._video_json(payload, route),
                        )
                    if resp.status_code >= 400:
                        raise RuntimeError(
                            _format_seedance_create_error(
                                resp.status_code,
                                resp.text,
                                content_labels=content_labels,
                            )
                        )
                data = resp.json()
        except httpx.TimeoutException as exc:
            reraise_upstream_timeout(exc, kind="Tạo video", read_sec=VIDEO_CREATE_READ_SEC)

        task_id = extract_video_task_id(data)
        if not task_id:
            raise RuntimeError(f"Seedance missing task id: {data}")
        return task_id

    async def gen_and_wait_seedance_body(
        self,
        body: dict[str, Any],
        *,
        project_id: int,
        shot_no: int,
        max_attempts: int = 2,
        content_labels: list[str] | None = None,
    ) -> tuple[str, str | None, TaskResult]:
        """Tạo tác vụ đa phương thức Seedance và chờ hoàn thành; return (URL video cục bộ, URL khung cuối cùng cục bộ tùy chọn, kết quả tác vụ)."""
        def _is_audio_download_error(err: Exception) -> bool:
            msg = str(err)
            return "audio_url" in msg and "resource download failed" in msg

        def _strip_reference_audio(src: dict[str, Any]) -> dict[str, Any] | None:
            content = src.get("content")
            if not isinstance(content, list):
                return None
            filtered: list[dict[str, Any]] = []
            removed = False
            for item in content:
                if not isinstance(item, dict):
                    filtered.append(item)
                    continue
                if item.get("type") == "audio_url" and item.get("role") == "reference_audio":
                    removed = True
                    continue
                if item.get("type") == "text":
                    text = str(item.get("text") or "")
                    cleaned_lines = [
                        line
                        for line in text.splitlines()
                        if "参考音频" not in line
                        and "角色音色" not in line
                        and "旁白音色" not in line
                        and "âm thanh tham chiếu" not in line.lower()
                        and "chất giọng nhân vật" not in line.lower()
                        and "chất giọng lời bình" not in line.lower()
                    ]
                    filtered.append({**item, "text": "\n".join(cleaned_lines).strip()})
                    continue
                filtered.append(item)
            if not removed:
                return None
            return {**src, "content": filtered}

        last_err: Exception | None = None
        fallback_body = body
        audio_fallback_used = False

        def _audio_fallback(exc: Exception, *, accepted: bool) -> bool:
            """Chỉ "tải xuống âm thanh tham chiếu không thành công" mới cho phép bạn xóa âm thanh tham chiếu và thử lại; đối với các lỗi khác, tác vụ sẽ không được xây dựng lại.

            Việc gửi lại sau khi upstream đã tiếp nhận tác vụ sẽ tạo ra tác vụ tính phí thứ hai, vì vậy bắt buộc phải dùng danh sách trắng (whitelist) nghiêm ngặt,
            các ngoại lệ như chặn quyền riêng tư/thất bại/hết thời gian chờ thăm dò phải được ném ra ngay lập tức để tránh trừ phí trùng lặp.
            """
            nonlocal fallback_body, audio_fallback_used, last_err
            last_err = exc
            if audio_fallback_used or not _is_audio_download_error(exc):
                return False
            stripped = _strip_reference_audio(fallback_body)
            if not stripped:
                return False
            logger.warning(
                "Seedance reference_audio download failed (%s); retry once without audio refs project=%s shot=%s",
                "after accept" if accepted else "at submit",
                project_id,
                shot_no,
            )
            fallback_body = stripped
            audio_fallback_used = True
            return True

        for _attempt in range(max_attempts):
            # Thất bại ở khâu gửi: Ngoại trừ lỗi âm thanh tham chiếu, hãy vứt nó đi ngay lập tức và đừng bao giờ tạo lại đơn hàng một cách mù quáng.
            try:
                task_id = await self.gen_video_seedance_body(
                    fallback_body,
                    project_id=project_id,
                    content_labels=content_labels,
                )
            except Exception as exc:  # noqa: BLE001
                if _audio_fallback(exc, accepted=False):
                    continue
                raise
            # Thất bại trong giai đoạn chờ đợi: quyền riêng tư/lỗi tác vụ/thời gian chờ, v.v. ngay lập tức bị loại bỏ; chỉ đề cập đến lỗi tải xuống âm thanh và nâng cao lại
            try:
                return await self.wait_video_assets(
                    task_id, project_id=project_id, shot_no=shot_no
                )
            except Exception as exc:  # noqa: BLE001
                if _audio_fallback(exc, accepted=True):
                    continue
                raise
        raise RuntimeError(str(last_err) if last_err else "Seedance multimodal failed")

    async def poll_task(self, task_id: str) -> TaskResult:
        if self.mock or task_id.startswith("mock-task-"):
            v_url, last_url = self._write_mock_video(task_id)
            return TaskResult(
                status="succeeded",
                url=v_url,
                last_frame_url=last_url,
            )

        if task_id.startswith("flow-"):
            from app.services.drama.flow_api import get_flow_video_result

            deadline = time.monotonic() + self.settings.ark_video_poll_timeout
            while time.monotonic() < deadline:
                res = get_flow_video_result(task_id)
                if res and res.get("status") == "succeeded":
                    return TaskResult(
                        status="succeeded",
                        url=res["video_url"],
                        last_frame_url=res.get("thumbnail_url"),
                        provider_task_id=task_id,
                    )
                if res and res.get("status") == "failed":
                    return TaskResult(
                        status="failed",
                        error=res.get("error", "Flow video failed"),
                        provider_task_id=task_id,
                    )
                await asyncio.sleep(float(self.settings.ark_video_poll_interval))
            return TaskResult(status="failed", error="poll timeout", provider_task_id=task_id)

        deadline = time.monotonic() + self.settings.ark_video_poll_timeout
        async with httpx.AsyncClient(timeout=_upstream_timeout(VIDEO_POLL_READ_SEC, connect=15.0)) as client:
            while time.monotonic() < deadline:
                try:
                    resp = await client.get(
                        self._url(f"/contents/generations/tasks/{task_id}"),
                        headers=self._headers(),
                    )
                except httpx.HTTPError as exc:
                    # Jitter mạng đơn: tiếp tục thăm dò sau khi lùi lại, hội tụ theo thời hạn, không trực tiếp xác định lỗi
                    logger.warning(
                        "Seedance poll network error task=%s: %s; backing off", task_id, exc
                    )
                    await asyncio.sleep(float(self.settings.ark_video_poll_interval))
                    continue
                if resp.status_code >= 400:
                    # 429/5xx là lỗi tạm thời ở thượng nguồn, trạng thái nhiệm vụ không xác định và quá trình chờ tiếp tục diễn ra theo khoảng thời gian kiểm tra vòng.
                    # Nó được hội tụ theo tổng thời gian chờ; 400/401/403/404, v.v. là trạng thái cuối cùng.
                    if _is_transient_http_status(resp.status_code):
                        logger.warning(
                            "Seedance poll transient HTTP %s task=%s; backing off",
                            resp.status_code,
                            task_id,
                        )
                        await asyncio.sleep(
                            _retry_after_seconds(
                                resp, float(self.settings.ark_video_poll_interval)
                            )
                        )
                        continue
                    return TaskResult(status="failed", error=resp.text[:500])
                data = resp.json()
                result = self._finalize_video_result(_build_task_result_from_payload(data), task_id)
                if result.status == "succeeded":
                    return result
                if result.status == "failed":
                    return result
                await asyncio.sleep(self.settings.ark_video_poll_interval)
        return TaskResult(status="failed", error="poll timeout", provider_task_id=task_id)

    async def fetch_task_once(self, task_id: str) -> TaskResult:
        """Nhiệm vụ Seedance/Flow truy vấn đơn, không chặn và chờ đợi."""
        if task_id.startswith("flow-"):
            from app.services.drama.flow_api import get_flow_video_result

            res = get_flow_video_result(task_id)
            if not res or res.get("status") == "running":
                return TaskResult(status="running", provider_task_id=task_id)
            if res.get("status") == "succeeded":
                return TaskResult(
                    status="succeeded",
                    url=res["video_url"],
                    last_frame_url=res.get("thumbnail_url"),
                    provider_task_id=task_id,
                )
            return TaskResult(
                status="failed",
                error=res.get("error", "Lỗi tạo video Flow"),
                provider_task_id=task_id,
            )

        if self.mock or task_id.startswith("mock-task-"):
            v_url, last_url = self._write_mock_video(task_id)
            return TaskResult(
                status="succeeded",
                url=v_url,
                last_frame_url=last_url,
            )
        try:
            async with httpx.AsyncClient(timeout=_upstream_timeout(VIDEO_FETCH_READ_SEC, connect=15.0)) as client:
                resp = await client.get(
                    self._url(f"/contents/generations/tasks/{task_id}"),
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            # Mạng jitter có nghĩa là người thăm dò sẽ thử lại ở vòng tiếp theo và điểm cuối đồng bộ hóa sẽ tiếp tục quay vòng, cả hai đều tốt hơn 500/thất bại đánh giá sai.
            logger.warning("Seedance fetch network error task=%s: %s", task_id, exc)
            return TaskResult(status="running", provider_task_id=task_id)
        if resp.status_code >= 400:
            if _is_transient_http_status(resp.status_code):
                logger.warning(
                    "Seedance fetch transient HTTP %s task=%s; treat as running",
                    resp.status_code,
                    task_id,
                )
                return TaskResult(status="running", provider_task_id=task_id)
            return TaskResult(status="failed", error=resp.text[:500], provider_task_id=task_id)
        return self._finalize_video_result(_build_task_result_from_payload(resp.json()), task_id)

    async def save_video_assets_from_result(
        self,
        result: TaskResult,
        *,
        project_id: int,
        shot_no: int,
    ) -> tuple[str, str | None]:
        """Lưu trữ kết quả thành công của một cuộc thăm dò dưới dạng video cục bộ và khung hình cuối cùng tùy chọn."""
        if result.status != "succeeded" or not result.url:
            raise RuntimeError(result.error or "video generation failed")

        if result.url.startswith("/static/"):
            video_local = result.url
        else:
            # Tạo tên tệp độc lập mỗi lần để tránh ghi đè lên tệp cũ và khiến các phiên bản lịch sử trở nên không hợp lệ.
            stamp = int(time.time())
            dest = storage.project_dir(project_id) / f"shot_{shot_no:03d}_{stamp}.mp4"
            await self.download_result_media(result.url, dest)
            video_local = storage.publish_local(dest)

        last_local: str | None = None
        if result.last_frame_url:
            try:
                if result.last_frame_url.startswith("/static/"):
                    last_local = result.last_frame_url
                else:
                    stamp = int(time.time())
                    frame_dest = (
                        storage.project_dir(project_id)
                        / f"shot_{shot_no:03d}_{stamp}_last.jpg"
                    )
                    await self.download_result_media(result.last_frame_url, frame_dest)
                    last_local = storage.publish_local(frame_dest)
            except Exception:  # noqa: BLE001
                logger.warning("failed to save last frame project=%s shot=%s", project_id, shot_no)

        # Nếu không có last_frame_url trả về từ API (ví dụ Flow API trả thumbnail null), trích xuất bằng ffmpeg
        if not last_local and dest.exists():
            try:
                stamp = int(time.time())
                frame_dest = (
                    storage.project_dir(project_id)
                    / f"shot_{shot_no:03d}_{stamp}_last.jpg"
                )
                import shutil, subprocess
                ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
                subprocess.run(
                    [ffmpeg_bin, "-y", "-sseof", "-0.5", "-i", str(dest), "-vframes", "1", "-q:v", "2", str(frame_dest)],
                    capture_output=True, timeout=10,
                )
                if frame_dest.exists():
                    last_local = storage.publish_local(frame_dest)
            except Exception as e:
                logger.warning("failed to extract fallback last frame: %s", e)

        return video_local, last_local

    async def wait_video_assets(
        self,
        task_id: str,
        *,
        project_id: int,
        shot_no: int,
    ) -> tuple[str, str | None, TaskResult]:
        """Đợi nhiệm vụ hoàn thành và tải video xuống; nếu có khung cuối cùng thì nó sẽ được tải xuống cùng nhau."""
        result = await self.poll_task(task_id)
        video_local, last_local = await self.save_video_assets_from_result(
            result,
            project_id=project_id,
            shot_no=shot_no,
        )
        return video_local, last_local, result

    async def wait_video(
        self,
        task_id: str,
        *,
        project_id: int,
        shot_no: int,
    ) -> tuple[str, TaskResult]:
        """Đợi phim chạy xong rồi ghi khung hình cuối cùng của phim trở lại kết quả trước để tham khảo ở lần quay tiếp theo."""
        video_local, last_local, result = await self.wait_video_assets(
            task_id, project_id=project_id, shot_no=shot_no
        )
        if last_local:
            result.last_frame_url = last_local
        return video_local, result

    async def gen_and_wait_video(
        self,
        image_url: str,
        prompt: str,
        duration: int,
        *,
        project_id: int,
        shot_no: int,
        character_consistency: bool = True,
        resolution: str = "480p",
        ratio: str | None = None,
        max_attempts: int = 3,
        generate_audio: bool = False,
        model: str | None = None,
        extra_image_urls: list[str] | None = None,
    ) -> tuple[str, TaskResult]:
        """Tạo tác vụ i2v và chờ đợi; phiên bản mã nguồn mở chỉ sử dụng TokenFree (không kết nối trực tiếp với Kie/Huoshan)."""
        last_err: Exception | None = None
        for attempt in range(max_attempts):
            use_json = attempt != 1  # attempt0 json, attempt1 plain, attempt2 json again
            try:
                task_id = await self.gen_video_i2v(
                    image_url,
                    prompt,
                    duration,
                    character_consistency=character_consistency,
                    resolution=resolution,
                    ratio=ratio,
                    prompt_as_json=use_json,
                    generate_audio=generate_audio,
                    extra_image_urls=extra_image_urls,
                    model=model,
                )
                return await self.wait_video(
                    task_id,
                    project_id=project_id,
                    shot_no=shot_no,
                )
            except Exception as exc:  # noqa: BLE001
                last_err = exc
                msg = str(exc)
                retryable = any(
                    k in msg
                    for k in (
                        "summary_caption",
                        "BodyFormat",
                        "InvalidParameter",
                        "poll timeout",
                    )
                )
                logger.warning(
                    "Seedance attempt %s/%s shot=%s failed: %s",
                    attempt + 1,
                    max_attempts,
                    shot_no,
                    msg[:300],
                )
                if not retryable or attempt >= max_attempts - 1:
                    break
                await asyncio.sleep(1.5 * (attempt + 1))
        raise RuntimeError(str(last_err) if last_err else "video generation failed")

    def _openspeech_configured(self) -> bool:
        """Liệu openpeech đã được định cấu hình chưa (Khóa API phiên bản mới hoặc phiên bản cũ AppId + AccessKey)."""
        if (self.settings.volc_tts_api_key or "").strip():
            return True
        return bool(self.settings.volc_tts_app_id and self.settings.volc_tts_access_key)

    def _resolved_audio_model(self) -> str:
        routed = (resolve_upstream_model("audio", None) or "").strip()
        mid = routed or (self.settings.model_audio or "").strip() or TOKENFREE_DEFAULT_TTS_MODEL
        if uses_tokenfree_audio(base_url=self.settings.ark_base_url or ""):
            return resolve_tokenfree_tts_model(mid)
        return mid

    async def _tts_openai_speech(
        self,
        text: str,
        voice: str,
        dest: Path,
        *,
        model: str | None = None,
    ) -> bool:
        """Qwen-TTS /audio/speech trên TokenFree không được triển khai và thay vào đó, trò chuyện Omni/Gemini được sử dụng."""
        base = (self.settings.ark_base_url or "").rstrip("/")
        key = (self.settings.ark_api_key or "").strip()
        if not base or not key:
            return False
        model_id = (model or self._resolved_audio_model()).strip()
        if uses_tokenfree_audio(base_url=base):
            model_id = tokenfree_tts_chat_model(resolve_tokenfree_tts_model(model_id))
            voice = tokenfree_speech_voice(voice, model_id)
            if tokenfree_tts_uses_chat_audio(model_id):
                return await self._tts_openai_chat_audio(text, voice, dest, model=model_id)
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{base}/audio/speech",
                headers=self._headers(),
                json={
                    "model": model_id,
                    "input": text,
                    "voice": voice,
                    "response_format": "mp3",
                },
            )
        if resp.status_code < 400 and resp.content and len(resp.content) >= 1000:
            dest.write_bytes(resp.content)
            return True
        if resp.status_code >= 400:
            logger.warning(
                "OpenAI speech HTTP %s model=%s: %s",
                resp.status_code,
                model_id,
                (resp.text or "")[:300],
            )
        if uses_tokenfree_audio(base_url=base) and tokenfree_tts_uses_chat_audio(model_id):
            return await self._tts_openai_chat_audio(text, voice, dest, model=model_id)
        return False

    async def _tts_openai_chat_audio(
        self,
        text: str,
        voice: str,
        dest: Path,
        *,
        model: str,
    ) -> bool:
        """Âm thanh đầu ra trò chuyện không phát trực tuyến của Gemini; Qwen-Omni phải phát trực tuyến SSE."""
        base = (self.settings.ark_base_url or "").rstrip("/")
        if not base:
            return False
        omni = tokenfree_tts_uses_omni_stream(model)
        body = (
            build_omni_tts_chat_body(text, voice, model)
            if omni
            else {
                "model": model,
                "messages": [{"role": "user", "content": text}],
                "modalities": ["audio"],
                "audio": {"voice": voice, "format": "mp3"},
            }
        )
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{base}/chat/completions", headers=self._headers(), json=body)
        if resp.status_code >= 400:
            logger.warning(
                "OpenAI chat-audio HTTP %s model=%s: %s",
                resp.status_code,
                model,
                (resp.text or "")[:300],
            )
            return False
        audio: bytes | None = extract_sse_audio_bytes(resp.text or "") if omni else None
        if not audio:
            try:
                payload = resp.json()
            except Exception:  # noqa: BLE001
                payload = None
            if isinstance(payload, dict):
                audio = extract_chat_audio_bytes(payload)
        if not audio:
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        wav = wrap_pcm_s16le_wav(audio)
        if not wav:
            return False
        return await asyncio.to_thread(self._persist_tts_mp3, dest, wav)

    @staticmethod
    def _build_tts_additions(speaker: str, emotion_hint: str | None) -> str | None:
        """Tập hợp các phần bổ sung openpeech (S_ clone + mood context_texts)."""
        additions: dict[str, Any] = {}
        if speaker.startswith("S_"):
            additions["model_type"] = 4
        hint = (emotion_hint or "").strip()
        if hint:
            additions["context_texts"] = [f"Đọc với ngữ điệu 「{hint}」"]
        if not additions:
            return None
        return json.dumps(additions, ensure_ascii=False)

    async def tts(
        self,
        text: str,
        voice: str,
        *,
        project_id: int | None = None,
        shot_no: int | None = None,
        duration_hint: float = 4.0,
        emotion_hint: str | None = None,
    ) -> str:
        """Lồng tiếng toàn bộ phim/một cảnh quay: doubao openpeech → TokenFree multi-TTS → edge-tts; nếu thất bại, một lỗi sẽ được đưa ra và chế độ tắt tiếng sẽ không được ghi."""
        voice_map = {
            "narrator_calm": "zh_female_cancan_uranus_bigtts",
            "warm_storyteller": "zh_female_tianmeixiaoyuan_uranus_bigtts",
            "teacher_clear": "zh_male_shaonianzixin_uranus_bigtts",
            "urban_editorial": "zh_female_shuangkuaisisi_uranus_bigtts",
            "retro_host": "zh_male_shaonianzixin_uranus_bigtts",
            "guqin_narrator": "zh_female_vv_uranus_bigtts",
        }
        speaker = (
            voice_map.get(voice, voice)
            or self.settings.volc_tts_speaker
            or "zh_female_cancan_uranus_bigtts"
        )
        clean = (text or "").strip() or "Phân cảnh này."

        if self.mock:
            digest = hashlib.md5(f"{speaker}:{clean}".encode()).hexdigest()[:8]
            dest = Path(__file__).resolve().parents[2] / "static" / "mock" / f"audio_{digest}.mp3"
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists() or dest.stat().st_size < 1000:
                await self._tts_edge(clean, dest, voice_hint=speaker)
            return f"/static/mock/audio_{digest}.mp3"

        dest_dir = storage.project_dir(project_id or 0)
        dest = dest_dir / f"shot_{(shot_no or 0):03d}_tts.mp3"

        async def _accept_if_audible(label: str) -> str | None:
            if not dest.exists() or dest.stat().st_size < 2000:
                return None
            if await asyncio.to_thread(is_near_silent_audio, dest):
                logger.warning("%s produced near-silence shot=%s", label, shot_no)
                return None
            return storage.publish_local(dest)

        audio_model = self._resolved_audio_model()
        on_tokenfree = uses_tokenfree_audio(base_url=self.settings.ark_base_url or "")

        # Doubao openpeech: ưu tiên loa chuẩn tránh /audio/speech bỏ qua id âm sắc
        if self._openspeech_configured():
            try:
                ok = await self._tts_openspeech(clean, speaker, dest, emotion_hint=emotion_hint)
                if ok:
                    url = await _accept_if_audible("openspeech")
                    if url:
                        logger.info("TTS openspeech ok shot=%s speaker=%s", shot_no, speaker)
                        return url
            except Exception as exc:  # noqa: BLE001
                logger.warning("openspeech TTS failed: %s", exc)

        # TokenFree: Mô hình mặc định + Gemini / ElevenLabs / Qwen TTS khác thử theo trình tự
        if on_tokenfree:
            for model_id in iter_tokenfree_tts_models(audio_model):
                try:
                    ok = await self._tts_openai_speech(clean, speaker, dest, model=model_id)
                    if ok:
                        url = await _accept_if_audible("tokenfree-speech")
                        if url:
                            logger.info(
                                "TTS tokenfree ok shot=%s model=%s bytes=%s",
                                shot_no,
                                model_id,
                                dest.stat().st_size,
                            )
                            return url
                except Exception as exc:  # noqa: BLE001
                    logger.warning("tokenfree speech failed model=%s: %s", model_id, exc)

        # edge-tts: Ánh xạ các nơ-ron thần kinh khác nhau tùy theo người nói và giọng nói của nhân vật vẫn có thể tách ra khi upstream không thành công.
        try:
            await self._tts_edge(clean, dest, voice_hint=speaker)
            url = await _accept_if_audible("edge-tts")
            if url:
                logger.info("TTS edge-tts ok shot=%s speaker=%s bytes=%s", shot_no, speaker, dest.stat().st_size)
                return url
        except Exception as exc:  # noqa: BLE001
            logger.warning("edge-tts failed: %s", exc)

        # Hãy thử lại khi /audio/speech không phải là TokenFree (Ark, v.v.)
        if not on_tokenfree:
            try:
                ok = await self._tts_openai_speech(clean, speaker, dest, model=audio_model)
                if ok:
                    url = await _accept_if_audible("ark-speech")
                    if url:
                        return url
            except Exception as exc:  # noqa: BLE001
                logger.warning("Ark TTS failed: %s", exc)

        logger.error("TTS all providers failed shot=%s", shot_no)
        raise RuntimeError("Lồng tiếng thất bại: Dịch vụ giọng nói tạm thời không khả dụng, vui lòng thử lại sau")

    def _tts_resource_id(self, speaker: str) -> str:
        if speaker.startswith("S_"):
            return "seed-icl-2.0"
        if "_uranus_" in speaker or speaker.startswith("saturn_"):
            return self.settings.volc_tts_resource_id or "seed-tts-2.0"
        return "seed-tts-1.0"

    async def _tts_openspeech(
        self,
        text: str,
        speaker: str,
        dest: Path,
        *,
        emotion_hint: str | None = None,
    ) -> bool:
        resource = self._tts_resource_id(speaker)
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "X-Api-Resource-Id": resource,
        }
        api_key = (self.settings.volc_tts_api_key or "").strip()
        if api_key:
            headers["X-Api-Key"] = api_key
        else:
            headers["X-Api-App-Id"] = self.settings.volc_tts_app_id
            headers["X-Api-Access-Key"] = self.settings.volc_tts_access_key
        body: dict[str, Any] = {
            "user": {"uid": "framecut"},
            "req_params": {
                "text": text,
                "speaker": speaker,
                "audio_params": {"format": "mp3", "sample_rate": 24000},
            },
        }
        additions = self._build_tts_additions(speaker, emotion_hint)
        if additions:
            body["req_params"]["additions"] = additions

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(self.settings.volc_tts_url, headers=headers, json=body)
            if resp.status_code >= 400:
                logger.warning("openspeech HTTP %s: %s", resp.status_code, resp.text[:400])
                return False
            audio = self._parse_openspeech_ndjson(resp.content)
            if not audio:
                logger.warning("openspeech empty audio body")
                return False
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(audio)
            return True

    @staticmethod
    def _parse_openspeech_ndjson(raw: bytes) -> bytes:
        chunks: list[bytes] = []
        text = raw.decode("utf-8", errors="ignore")
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            code = obj.get("code")
            if code == 0 and obj.get("data"):
                chunks.append(base64.b64decode(obj["data"]))
            elif code in {20000000, 20000001}:
                break
            elif code not in (None, 0):
                logger.warning("openspeech line error: %s", line[:300])
        return b"".join(chunks)

    async def _tts_edge(self, text: str, dest: Path, voice_hint: str = "") -> None:
        """Microsoft edge-tts chuẩn tiếng Việt (Hoài My & Nam Minh)."""
        import edge_tts
        from app.services.voices import edge_tts_params_for_speaker

        voice, rate, pitch = edge_tts_params_for_speaker(voice_hint)
        dest.parent.mkdir(parents=True, exist_ok=True)
        last_err: Exception | None = None
        for attempt in range(3):
            try:
                communicate = edge_tts.Communicate(
                    text,
                    voice,
                    rate=rate,
                    pitch=pitch,
                    connect_timeout=30,
                    receive_timeout=90,
                )
                await communicate.save(str(dest))
                return
            except Exception as exc:  # noqa: BLE001
                last_err = exc
                logger.warning("edge-tts attempt %s/3 failed: %s", attempt + 1, exc)
                if attempt < 2:
                    await asyncio.sleep(1.2 * (attempt + 1))
        raise RuntimeError(str(last_err) if last_err else "edge-tts failed")

    def _persist_tts_mp3(self, dest: Path, audio: bytes) -> bool:
        """Chuyển đổi Omni WAV sang lồng tiếng mp3; nếu là MPEG, hãy tải trực tiếp xuống. Trả về Sai nếu chuyển mã không thành công."""
        if len(audio) < 1000:
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        if audio[:3] == b"ID3" or (audio[0] == 0xFF and (audio[1] & 0xE0) == 0xE0):
            dest.write_bytes(audio)
            return True
        import shutil
        import subprocess
        import tempfile

        # Tệp thực thi ffmpeg/quá trình chuyển mã/wav tạm thời
        ffmpeg = shutil.which(self.settings.ffmpeg_path) or shutil.which("ffmpeg")
        if not ffmpeg:
            logger.warning("tts persist skipped: ffmpeg not found")
            return False
        with tempfile.TemporaryDirectory(prefix="pf_tts_") as tmp_dir:
            src = Path(tmp_dir) / "omni.wav"
            src.write_bytes(audio)
            proc = subprocess.run(
                [
                    ffmpeg,
                    "-nostdin",
                    "-y",
                    "-i",
                    str(src),
                    "-q:a",
                    "4",
                    "-acodec",
                    "libmp3lame",
                    str(dest),
                ],
                capture_output=True,
                check=False,
                stdin=subprocess.DEVNULL,
            )
        if proc.returncode == 0 and dest.exists() and dest.stat().st_size >= 1000:
            return True
        logger.warning(
            "tts persist ffmpeg failed code=%s stderr=%s",
            proc.returncode,
            (proc.stderr or b"").decode("utf-8", errors="replace")[:300],
        )
        if dest.exists():
            dest.unlink(missing_ok=True)
        return False

    def _write_silence_mp3(self, dest: Path, duration: float) -> None:
        import shutil
        import subprocess

        ffmpeg = shutil.which(self.settings.ffmpeg_path) or shutil.which("ffmpeg")
        if not ffmpeg:
            dest.write_bytes(b"")
            return
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=mono",
                "-t",
                f"{max(duration, 0.5):.3f}",
                "-q:a",
                "9",
                "-acodec",
                "libmp3lame",
                str(dest),
            ],
            capture_output=True,
            check=False,
        )

    async def _resolve_image_ref(self, image_url: str, *, prefer_https: bool = False) -> str:
        raw = (image_url or "").strip()
        if raw.startswith("https://"):
            return raw
        if raw.startswith("http://"):
            # Ark cloud cannot fetch LAN/localhost; keep only if public host
            host = (urlparse(raw).hostname or "").lower()
            if host and host not in {"localhost", "127.0.0.1", "::1"} and not host.startswith(
                ("192.168.", "10.")
            ):
                return raw
        if prefer_https:
            # Seedance 2.0: Cần có https mạng công cộng; local/static cần được đồng bộ hóa với OSS trước
            local = storage.local_path_from_url(raw)
            if local and local.exists():
                public = storage.republish_url(raw, sync=True)
                if public and str(public).startswith("https://"):
                    return str(public)
                raise RuntimeError(
                    "Seedance cần URL hình ảnh truy cập được từ internet (vui lòng bật OSS và đảm bảo ảnh tham chiếu đã được tải lên), "
                    "ảnh cục bộ /static không thể được hệ thống kéo về"
                )
            if raw.startswith("data:"):
                raise RuntimeError("Dịch vụ video không hỗ trợ ảnh data URI, vui lòng dùng liên kết https hợp lệ")
        if raw.startswith("http://") or raw.startswith("https://") or raw.startswith("data:"):
            return raw
        local = storage.local_path_from_url(raw)
        if local and local.exists():
            # Prefer data URI so Seedance can read without public CDN
            return storage.file_to_data_uri(local)
        # Last resort: absolute local public URL (only works if Ark can reach your machine)
        return storage.to_public_url(raw)

    def _write_mock_image(self, prompt: str, size: str | None = None) -> str:
        """Viết ra SVG mô phỏng theo chiều dọc; tên tệp duy nhất mỗi lần để tránh ghi đè bằng cách thử lại."""
        digest = uuid.uuid4().hex[:12]
        root = Path(__file__).resolve().parents[2] / "static" / "mock"
        root.mkdir(parents=True, exist_ok=True)
        path = root / f"image_{digest}.svg"
        hue = int(digest[:2], 16)
        label = (prompt[:42] + "…") if len(prompt) > 42 else prompt
        safe = (
            label.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
        # Portrait mock for image_text / 9:16
        portrait = bool(size and ("x" in size.lower()) and self._is_portrait_size(size))
        w, h = (720, 1280) if portrait else (960, 540)
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl({hue},28%,22%)"/>
      <stop offset="100%" stop-color="hsl({(hue + 40) % 360},22%,38%)"/>
    </linearGradient>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#g)"/>
  <rect x="{int(w*0.08)}" y="{int(h*0.28)}" width="{int(w*0.4)}" height="{int(h*0.28)}" rx="10" fill="hsl({(hue + 20) % 360},35%,72%)" opacity="0.9"/>
  <circle cx="{int(w*0.72)}" cy="{int(h*0.38)}" r="{int(w*0.14)}" fill="hsl({(hue + 80) % 360},30%,65%)" opacity="0.55"/>
  <text x="{int(w*0.08)}" y="{int(h*0.78)}" fill="#f2ebe0" font-family="Georgia, serif" font-size="28">Mock Storyboard</text>
  <text x="{int(w*0.08)}" y="{int(h*0.84)}" fill="#d7cfc3" font-family="sans-serif" font-size="18">{safe}</text>
</svg>"""
        path.write_text(svg, encoding="utf-8")
        # Convert SVG → JPEG so ffmpeg can process it in compose steps.
        # ffmpeg cannot decode SVG; we generate a colour-gradient JPEG instead.
        jpg_path = root / f"image_{digest}.jpg"
        try:
            import subprocess, shutil
            ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
            # Use lavfi solid colour matching the SVG gradient mid-tone
            bg_color = f"hsl({hue},25%,30%)"
            # Convert hsl to hex approximation for ffmpeg
            import colorsys
            h_f = hue / 360.0
            s_f, l_f = 0.25, 0.30
            # HSL to RGB
            if s_f == 0:
                r = g = b = l_f
            else:
                def _hue2rgb(p: float, q: float, t: float) -> float:
                    if t < 0: t += 1
                    if t > 1: t -= 1
                    if t < 1/6: return p + (q - p) * 6 * t
                    if t < 1/2: return q
                    if t < 2/3: return p + (q - p) * (2/3 - t) * 6
                    return p
                q2 = l_f * (1 + s_f) if l_f < 0.5 else l_f + s_f - l_f * s_f
                p2 = 2 * l_f - q2
                r, g, b = _hue2rgb(p2, q2, h_f + 1/3), _hue2rgb(p2, q2, h_f), _hue2rgb(p2, q2, h_f - 1/3)
            hex_color = "0x{:02x}{:02x}{:02x}".format(int(r*255), int(g*255), int(b*255))
            subprocess.run(
                [ffmpeg_bin, "-y", "-f", "lavfi",
                 "-i", f"color=c={hex_color}:size={w}x{h}:rate=1",
                 "-vframes", "1", "-q:v", "3", str(jpg_path)],
                capture_output=True, timeout=10,
            )
        except Exception:
            pass  # Fall back to SVG if conversion fails
        if jpg_path.exists():
            return f"/static/mock/image_{digest}.jpg"
        return f"/static/mock/image_{digest}.svg"

    def _write_mock_video(self, task_id: str) -> tuple[str, str]:
        """Tạo video và last frame JPEG mô phỏng thực tế trên đĩa."""
        suffix = task_id[-8:]
        root = Path(__file__).resolve().parents[2] / "static" / "mock"
        root.mkdir(parents=True, exist_ok=True)
        v_path = root / f"video_{suffix}.mp4"
        img_path = root / f"last_{suffix}.jpg"
        if not v_path.exists() or not img_path.exists():
            w, h = 720, 1280
            import subprocess, shutil
            ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
            try:
                subprocess.run(
                    [
                        ffmpeg_bin, "-y", "-f", "lavfi",
                        "-i", f"testsrc=size={w}x{h}:rate=24",
                        "-t", "4",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p",
                        str(v_path),
                    ],
                    capture_output=True, timeout=15,
                )
                subprocess.run(
                    [
                        ffmpeg_bin, "-y", "-sseof", "-0.5",
                        "-i", str(v_path),
                        "-vframes", "1",
                        "-q:v", "2",
                        str(img_path),
                    ],
                    capture_output=True, timeout=10,
                )
            except Exception as e:
                logger.warning("Failed to generate mock video files: %s", e)
        return f"/static/mock/video_{suffix}.mp4", f"/static/mock/last_{suffix}.jpg"

    @staticmethod
    def _is_portrait_size(size: str) -> bool:
        m = re.match(r"^(\d+)x(\d+)$", size.strip().lower())
        if not m:
            return False
        return int(m.group(2)) > int(m.group(1))

    def _mock_storyboard(
        self,
        source_text: str,
        source_type: str,
        style_prefix: str,
        duration_min: int,
        duration_max: int,
        pipeline_mode: str = "full",
        shot_range_override: tuple[int, int] | None = None,
    ) -> StoryboardResult:
        chunks = [c.strip() for c in re.split(r"[。！？\n\.\!\?]+", source_text) if c.strip()]
        if source_type == "theme" and len(chunks) <= 1:
            topic = source_text.strip()
            chunks = [
                f"Giới thiệu chủ đề: {topic}",
                f"Giải thích khái niệm cốt lõi: {topic}",
                f"Ví dụ minh họa thực tế cho {topic}",
                f"Hiểu lầm phổ biến và giải đáp",
                f"Tổng kết và bài học",
            ]
        if len(chunks) < 3:
            chunks = chunks + ["Chuyển cảnh bổ sung", "Tổng kết kết thúc"]
        # shot_lo/shot_hi phù hợp với phạm vi loại bỏ ống kính chính thức để tránh bị chế giễu và vẫn chỉ sản xuất 5 ống kính
        if shot_range_override:
            shot_lo, shot_hi = shot_range_override
        else:
            shot_lo, shot_hi = segplan.suggested_kepu_shot_range(source_text, pipeline_mode=pipeline_mode)
        chunks = chunks[:shot_hi]
        while len(chunks) < shot_lo:
            chunks.append("Chuyển cảnh bổ sung")
        mid = (duration_min + duration_max) // 2
        if pipeline_mode == "image_text":
            mid = min(mid, max(duration_min, 3))
        bible = (
            f"Nhân vật thống nhất: Nhân vật chính liên quan đến «{source_text.strip()[:24]}», "
            "vóc dáng cân đối, trang phục tối giản phối màu cố định, ngũ quan rõ nét, ngoại hình không đổi suốt video"
        )
        bgm_lock = segplan.infer_bgm_mood(source_text, style_prefix)
        plans: list[ShotPlan] = []
        for i, text in enumerate(chunks, start=1):
            # Mock: invent short summary titles, do not slice narration mid-token
            topic_bit = re.sub(r"^(Giới thiệu chủ đề|Giải thích khái niệm cốt lõi|Ví dụ minh họa thực tế cho|引入主题|核心概念解释|一个关键例子说明)[：:]?", "", text).strip()
            title = f"Ý chính {i}" if len(topic_bit) > 10 else (topic_bit[:12] or f"Cảnh {i}")
            if "：" in text or ":" in text:
                title = text.split("：", 1)[0].split(":", 1)[0][-6:] or title
            subtitle = _fallback_overlay_subtitle(text)
            img = f"{style_prefix}, {bible}, miêu tả cảnh: {text[:80]}, bố cục khung hình dọc, khoảng trống phía trên, hình ảnh không có chữ"
            beats = [
                segplan.SegmentBeat(duration=segplan.estimate_visual_duration(img), kind="visual", text=img),
                segplan.SegmentBeat(
                    duration=segplan.estimate_narration_duration(text),
                    kind="narration",
                    text=text[:120],
                ),
            ]
            script = segplan.build_segment_script(beats, bgm_mood=bgm_lock, max_total=min(duration_max, 30))
            dur = float(segplan.resolve_api_duration(script, fallback=mid, lo=duration_min, hi=duration_max))
            plans.append(
                ShotPlan(
                    shot=i,
                    duration=dur,
                    text=text[:120],
                    overlay_title=_normalize_overlay_title(title, text, i),
                    overlay_subtitle=_normalize_overlay_subtitle(subtitle, text),
                    img_prompt=img,
                    video_prompt=script,
                    segment_script=script,
                    camera="Zoom vào từ từ" if i % 2 else "Thu nhỏ góc máy nhẹ",
                    bgm=bgm_lock,
                )
            )
        return StoryboardResult(shots=plans, character_bible=bible, bgm_lock=bgm_lock)

    def _parse_storyboard(
        self,
        content: str,
        style_prefix: str,
        duration_min: int,
        duration_max: int,
        max_shot_duration: int,
    ) -> StoryboardResult:
        raw = (content or "").strip()
        if not raw:
            raise RuntimeError("JSON phân cảnh rỗng, không thể phân tích cú pháp")
        try:
            data = _extract_json(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Phân tích JSON phân cảnh thất bại: {exc}") from exc
        character_bible = ""
        bgm_lock = ""
        items = data
        if isinstance(data, dict):
            character_bible = str(
                data.get("character_bible") or data.get("characters") or data.get("cast") or ""
            ).strip()
            bgm_lock = str(data.get("bgm_lock") or data.get("bgm") or "").strip()
            items = data.get("shots") or data.get("storyboard") or data.get("scenes") or []
        if not isinstance(items, list):
            raise RuntimeError("Định dạng JSON storyboard không hợp lệ: cần mảng shots")
        if not items:
            raise RuntimeError("Mô hình phân cảnh không trả về cảnh quay nào (mảng shots rỗng)")
        hi = min(duration_max, max_shot_duration)
        plans: list[ShotPlan] = []
        for i, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                continue
            text = str(item.get("text") or item.get("audio_text") or f"Cảnh {i}")
            title = str(item.get("title") or item.get("overlay_title") or "").strip()
            subtitle = str(item.get("subtitle") or item.get("overlay_subtitle") or "").strip()
            title = _normalize_overlay_title(title, text, i)
            subtitle = _normalize_overlay_subtitle(subtitle, text)
            img = str(item.get("img_prompt") or f"{text}")
            camera = str(item.get("camera", "Lia máy ngang chậm"))
            bgm = str(item.get("bgm") or item.get("bgm_mood") or bgm_lock or "Nhẹ nhàng, ổn định")
            if not bgm_lock:
                bgm_lock = bgm
            beats = segplan.parse_beats_from_llm_shot(item, narration_fallback=text)
            script = segplan.build_segment_script(beats, bgm_mood=bgm_lock or bgm, max_total=hi)
            narr = segplan.narration_from_script(script) or text
            visual = segplan.first_visual_prompt(script) or img
            dur = float(
                segplan.resolve_api_duration(
                    script,
                    fallback=float(item.get("duration", (duration_min + duration_max) / 2)),
                    lo=duration_min,
                    hi=hi,
                )
            )
            plans.append(
                ShotPlan(
                    shot=int(item.get("shot", i)),
                    duration=dur,
                    text=narr,
                    overlay_title=title,
                    overlay_subtitle=subtitle,
                    img_prompt=visual,
                    video_prompt=script,
                    segment_script=script,
                    camera=camera,
                    bgm=bgm_lock or bgm,
                )
            )
        if not bgm_lock and plans:
            bgm_lock = plans[0].bgm
        return StoryboardResult(
            shots=plans,
            character_bible=character_bible,
            bgm_lock=bgm_lock or segplan.infer_bgm_mood(style_prefix),
        )

    async def expand_content(self, topic: str, mode: str = "theme") -> dict[str, str]:
        """Expand a short topic into title + theme brief or full narration script."""
        topic = (topic or "").strip() or "Trí tuệ nhân tạo đang thay đổi cuộc sống hàng ngày như thế nào"
        mode = "script" if mode == "script" else "theme"
        if self.mock:
            return self._mock_expand_content(topic, mode)

        if mode == "script":
            system = (
                "Bạn là tác giả biên kịch video ngắn. Căn cứ vào chủ đề của người dùng, hãy viết một kịch bản lời dẫn hoàn chỉnh sẵn sàng để đọc lồng tiếng bằng tiếng Việt. "
                "Chỉ xuất đối tượng JSON: {\"title\":\"Tên tác phẩm\",\"content\":\"Toàn bộ kịch bản\"}. "
                "title: 8-18 từ, hấp dẫn, không lạm dụng dấu câu. "
                "content: 300-700 từ, giọng văn tự nhiên gần gũi, chia 4-8 đoạn, có móc câu mở đầu, nội dung kiến thức/cốt truyện và đoạn kết; "
                "không dùng markdown, không đánh số phân cảnh, không thêm dòng tiêu đề."
            )
        else:
            system = (
                "Bạn là chuyên gia lập kế hoạch đề tài video ngắn. Hãy mở rộng nội dung người dùng nhập thành một chủ đề sáng tạo rõ ràng, cụ thể bằng tiếng Việt. "
                "Chỉ xuất đối tượng JSON: {\"title\":\"Tên tác phẩm\",\"content\":\"Câu chủ đề\"}. "
                "title: 8-18 từ. "
                "content: Một câu chủ đề hoàn chỉnh từ 30-80 từ, nêu rõ đối tượng khán giả và nội dung cốt lõi cần truyền tải; không xuống dòng."
            )
        if is_chatgpt2api_configured():
            content = await chatgpt2api_completions(
                system,
                f"Chủ đề/Ý tưởng: {topic}",
                timeout=90.0,
            )
        else:
            content = await chat_completions(
                system,
                f"Chủ đề/Ý tưởng: {topic}",
                temperature=0.6,
                max_tokens=4096,
                timeout=90.0,
            )
        return self._parse_expand_content(content or "{}", topic, mode)

    def _mock_expand_content(self, topic: str, mode: str) -> dict[str, str]:
        short = topic[:24].rstrip("？?。.!！") or "Video kiến thức đời sống"
        title = short if len(short) >= 4 else f"Khám phá về {short}"
        if mode == "script":
            content = (
                f"Bạn đã bao giờ tự hỏi: {topic.rstrip('？?')} chưa?\n\n"
                f"Hôm nay chúng ta hãy dành ít phút để làm sáng tỏ điều này.\n"
                f"Bắt đầu từ những hiện tượng quen thuộc nhất trong đời sống, bóc tách nguyên lý cốt lõi đằng sau và đúc kết thành bài học dễ nhớ.\n\n"
                f"Rất nhiều người thường suy nghĩ theo cảm tính, nhưng điểm mấu chốt nằm ở chuỗi nguyên nhân và kết quả chứ không phải bề nổi.\n"
                f"Khi hiểu rõ điều này, bạn sẽ dễ dàng giải thích những hiện tượng tương tự xung quanh mình.\n\n"
                f"Hãy ghi nhớ: Quan sát hiện tượng, đặt câu hỏi về cơ chế và kiểm chứng bằng thực tế.\n"
                f"Lần tới khi nhắc đến chủ đề {short}, bạn hoàn toàn có thể tự tin chia sẻ lại với mọi người."
            )
        else:
            content = (
                f"{topic.rstrip('？?')}: Dành cho khán giả đại chúng, dùng ví dụ đời sống để làm rõ nguyên lý cốt lõi và các hiểu lầm thường gặp."
            )[:100]
        return {"title": title[:24], "content": content}

    def _parse_expand_content(self, raw: str, topic: str, mode: str) -> dict[str, str]:
        text = (raw or "").strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            m = re.search(r"\{[\s\S]*\}", text)
            if not m:
                return self._mock_expand_content(topic, mode)
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                return self._mock_expand_content(topic, mode)
        title = str(data.get("title") or "").strip() or topic[:18]
        content = str(data.get("content") or "").strip()
        if not content:
            return self._mock_expand_content(topic, mode)
        if mode == "theme":
            content = content.replace("\n", " ").strip()[:100]
        else:
            content = content[:8000]
        return {"title": title[:24], "content": content}


_gateway: ArkGateway | None = None


def get_ark() -> ArkGateway:
    global _gateway
    if _gateway is None:
        _gateway = ArkGateway()
    return _gateway


def reset_ark() -> None:
    global _gateway
    _gateway = None
