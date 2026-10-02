"""TokenFree / Nhiệm vụ video API mới: ánh xạ đường dẫn và đóng gói nội dung yêu cầu Seedance.

方舟原生是 POST /contents/generations/tasks。TokenFree 走 OpenAI Videos 兼容接口：
POST /v1/videos、GET /v1/videos/:id、GET /v1/videos/:id/content。
"""

from __future__ import annotations

from typing import Any

from app.services.media_ref_limits import MAX_REFERENCE_IMAGES
from app.services.tokenfree_gateway import TOKENFREE_CHANNEL_ID

# Tiền tố tác vụ video không đồng bộ gốc của Ark
ARK_VIDEO_TASK_PREFIX = "/contents/generations/tasks"
# Tiền tố tương thích với Video OpenAI của TokenFree (liên quan đến /v1)
NEWAPI_VIDEO_TASK_PREFIX = "/videos"
# Trạng thái nhiệm vụ thành công (Ark + API mới / Video OpenAI)
VIDEO_SUCCESS_STATUSES = {"succeeded", "success", "completed", "complete"}
# Trạng thái nhiệm vụ không thành công
VIDEO_FAILED_STATUSES = {"failed", "cancelled", "canceled", "expired", "failure"}


def uses_tokenfree_video(*, base_url: str = "", channel_id: str = "") -> bool:
    """Xác định xem địa chỉ/kênh cơ sở có sử dụng đường dẫn video API mới (chứ không phải địa chỉ Ark gốc) hay không."""
    if (channel_id or "").strip().lower() == TOKENFREE_CHANNEL_ID:
        return True
    raw = (base_url or "").strip().lower()
    if "tokenfree.com" in raw:
        return True
    if "volces.com" in raw or "volcengineapi.com" in raw:
        return False
    return False


def remap_video_path(path: str, *, base_url: str = "", channel_id: str = "") -> str:
    """Viết lại đường dẫn nhiệm vụ Ark trên TokenFree thành /videos và /videos/{id}."""
    normalized = path if str(path).startswith("/") else f"/{path}"
    if not uses_tokenfree_video(base_url=base_url, channel_id=channel_id):
        return normalized
    if normalized == ARK_VIDEO_TASK_PREFIX or normalized.startswith(ARK_VIDEO_TASK_PREFIX + "/"):
        return NEWAPI_VIDEO_TASK_PREFIX + normalized[len(ARK_VIDEO_TASK_PREFIX) :]
    return normalized


def tokenfree_video_content_url(base_url: str, task_id: str) -> str:
    """Nối địa chỉ tải xuống GET /v1/videos/{task_id}/content."""
    base = (base_url or "").rstrip("/")
    tid = (task_id or "").strip().lstrip("/")
    return f"{base}/videos/{tid}/content"


def is_tokenfree_content_url(url: str) -> bool:
    """Đây có phải là địa chỉ kéo TokenFree /video/:id/content không (Cần có Bearer để tải xuống)."""
    raw = (url or "").strip().lower()
    if "/videos/" not in raw:
        return False
    return raw.rstrip("/").endswith("/content")


def _media_url_from_item(item: dict[str, Any], key: str) -> str | None:
    """Lấy địa chỉ mạng công cộng của image_url/audio_url từ mục nội dung."""
    raw = item.get(key)
    url = raw.get("url") if isinstance(raw, dict) else None
    if isinstance(url, str) and url.strip():
        return url.strip()
    return None


def wrap_seedance_payload_for_newapi(payload: dict[str, Any]) -> dict[str, Any]:
    """Chuyển đổi nội dung Ark Seedance thành nội dung yêu cầu TokenFree POST /v1/video.

    TokenFree 会把 metadata.input 转成下游插件 `{model, input}`。
    下游 Seedance 只认 reference_image_urls / first_frame_url，不认 content/images。
    多参考时禁止再写顶层 image / images，也不要把同一批图塞进 content，否则会按张数重复计数并触发参考图上限。
    """
    src = dict(payload)
    content = src.get("content")
    # nhắn tin đều sao chép; hình ảnh/âm thanh theo thứ tự nội dung; vai trò được sử dụng để phân biệt khung đầu tiên với nhiều tham chiếu
    texts: list[str] = []
    images: list[str] = []
    image_roles: list[str] = []
    audios: list[str] = []
    if isinstance(content, list):
        for item in content:
            if not isinstance(item, dict):
                continue
            if item.get("type") == "text":
                piece = str(item.get("text") or "").strip()
                if piece:
                    texts.append(piece)
            if item.get("type") == "image_url":
                url = _media_url_from_item(item, "image_url")
                if url:
                    images.append(url)
                    image_roles.append(str(item.get("role") or "").strip())
            if item.get("type") == "audio_url":
                url = _media_url_from_item(item, "audio_url")
                if url:
                    audios.append(url)
    prompt = "\n".join(texts) or str(src.get("prompt") or "").strip() or "."
    duration = src.get("duration")
    duration_text = ""
    if duration is not None:
        try:
            duration_text = str(int(duration))
        except (TypeError, ValueError):
            duration_text = str(duration).strip()
    ratio = str(src.get("ratio") or "").strip()
    uses_reference_images = any(role == "reference_image" for role in image_roles)
    capped_images: list[str] = []
    capped_roles: list[str] = []
    seen_urls: set[str] = set()
    for url, role in zip(images, image_roles):
        if url in seen_urls:
            continue
        seen_urls.add(url)
        capped_images.append(url)
        capped_roles.append(role)
        if len(capped_images) >= MAX_REFERENCE_IMAGES:
            break
    images = capped_images
    image_roles = capped_roles
    meta_input: dict[str, Any] = {}
    if duration_text:
        meta_input["duration"] = duration_text
    if ratio and ratio.lower() != "adaptive":
        meta_input["aspect_ratio"] = ratio
    resolution = str(src.get("resolution") or "").strip()
    if resolution:
        meta_input["resolution"] = resolution
    if "generate_audio" in src:
        meta_input["generate_audio"] = bool(src.get("generate_audio"))
    if "watermark" in src:
        meta_input["watermark"] = bool(src.get("watermark"))
    if "return_last_frame" in src:
        meta_input["return_last_frame"] = bool(src.get("return_last_frame"))
    if isinstance(content, list) and content:
        if uses_reference_images:
            # Downstream sẽ tính các hình ảnh trong nội dung vào giới hạn trên của hình ảnh tham chiếu. Đối với nhiều tài liệu tham khảo, chỉ bản sao/âm thanh sẽ được giữ lại.
            text_audio = [
                item
                for item in content
                if not (isinstance(item, dict) and item.get("type") == "image_url")
            ]
            if text_audio:
                meta_input["content"] = text_audio
        else:
            meta_input["content"] = content
    first_frame_url: str | None = None
    last_frame_url: str | None = None
    if images:
        if uses_reference_images:
            # Nhiều tham chiếu: chỉ reference_image_urls được sử dụng cho tất cả hình ảnh (bao gồm cả khung cuối cùng của kết nối)
            meta_input["reference_image_urls"] = images
        else:
            # Khung đầu tiên/cuối cùng thuần túy: loại trừ lẫn nhau với tham chiếu_*, điền theo vai trò
            meta_input["images"] = images
            for url, role in zip(images, image_roles):
                if role == "first_frame" and not first_frame_url:
                    first_frame_url = url
                elif role == "last_frame":
                    last_frame_url = url
            first_frame_url = first_frame_url or images[0]
            meta_input["first_frame_url"] = first_frame_url
            if last_frame_url:
                meta_input["last_frame_url"] = last_frame_url
    if audios:
        meta_input["reference_audio_urls"] = audios[:10]
    out: dict[str, Any] = {
        "model": src.get("model"),
        "prompt": prompt,
        "metadata": {"input": meta_input},
    }
    if duration_text:
        out["seconds"] = duration_text
    if first_frame_url:
        out["image"] = first_frame_url
    elif images and not uses_reference_images:
        out["image"] = images[0]
    return out


def prepare_video_create_body(
    body: dict[str, Any],
    *,
    base_url: str = "",
    channel_id: str = "",
) -> dict[str, Any]:
    """Xác định xem có nên đóng gói nội dung yêu cầu Seedance theo kênh hay không."""
    if uses_tokenfree_video(base_url=base_url, channel_id=channel_id):
        return wrap_seedance_payload_for_newapi(body)
    return body


def unwrap_video_task_payload(data: dict[str, Any] | None) -> dict[str, Any]:
    """Làm phẳng bao bì API mới `{data: {...}}` để dễ dàng truy cập vào trạng thái/url/task_id."""
    if not isinstance(data, dict):
        return {}
    inner = data.get("data")
    if isinstance(inner, dict) and any(
        key in inner for key in ("status", "url", "content", "task_id", "id", "video_url")
    ):
        merged = dict(data)
        merged.update(inner)
        return merged
    return data


def _scalar_task_id(value: Any) -> str | None:
    """Thu thập ID tác vụ vô hướng dưới dạng chuỗi không trống; bỏ qua các từ trạng thái rõ ràng không phải là ID."""
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (str, int)) and str(value).strip():
        text = str(value).strip()
        if text.lower() in {"success", "ok", "true", "none", "null", "0"}:
            return None
        return text
    return None


def extract_video_task_id(data: dict[str, Any] | None) -> str | None:
    """Nhận ID nhiệm vụ thăm dò ý kiến ​​từ phản hồi tạo/truy vấn.

    New API 可能同时给 `id`（视频对象）和 `task_id`（查询用）；优先 task_id。
    部分网关把 ID 放在字符串 `data` 里。
    """
    if not isinstance(data, dict):
        return None
    payload = unwrap_video_task_payload(data)
    for key in ("task_id", "taskId"):
        found = _scalar_task_id(payload.get(key))
        if found:
            return found
    found = _scalar_task_id(data.get("data"))
    if found:
        return found
    return _scalar_task_id(payload.get("id"))


def format_video_task_error(err: Any) -> str:
    """Thu thập đối tượng lỗi ngược dòng thành câu có thể đọc được."""
    if isinstance(err, dict):
        for key in ("message", "msg", "error"):
            value = err.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
            if isinstance(value, dict):
                nested = format_video_task_error(value)
                if nested:
                    return nested
        return "视频生成失败"
    text = str(err or "").strip()
    return text or "视频生成失败"


def extract_video_result_url(data: dict[str, Any]) -> str | None:
    """Nhận URL video (API mới `url` hoặc Ark `content.video_url`) từ phản hồi thành công của nhiệm vụ."""
    for key in ("url", "video_url"):
        value = data.get(key)
        if isinstance(value, str) and value.strip().startswith(("http://", "https://", "/")):
            return value.strip()
    content = data.get("content")
    if isinstance(content, dict):
        for key in ("video_url", "url"):
            value = content.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None


def normalize_video_task_status(status: str) -> str:
    """Bình thường hóa trạng thái ngược dòng thành đang chạy/thành công/không thành công."""
    raw = (status or "").strip().lower()
    if raw in VIDEO_SUCCESS_STATUSES:
        return "succeeded"
    if raw in VIDEO_FAILED_STATUSES:
        return "failed"
    return "running"
