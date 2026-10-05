"""Thư mục mô hình hình ảnh/video giao diện người dùng: từ ảnh chụp nhanh định tuyến TokenFree, không còn hiển thị Kie/Ark nữa."""

from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.schemas_routing import DefaultModels, LogicalModel, LogicalModelCapability, SystemModelChannel
from app.services.model_routing_config import infer_model_capability, normalize_model_name


def _row(*, model_id: str, label: str, recommended: bool, description: str = "", provider: str = "TokenFree") -> dict[str, Any]:
    """Lắp ráp một tùy chọn mô hình mặt trước."""
    return {
        "id": model_id,
        "label": (label or model_id).strip() or model_id,
        "description": description,
        "provider": provider,
        "recommended": recommended,
    }


def build_media_catalog(
    *,
    logical_models: list[LogicalModel],
    channels: list[SystemModelChannel],
    defaults: DefaultModels,
    fallback_image: str = "",
    fallback_video: str = "",
) -> dict[str, Any]:
    """Chọn mô hình logic + kênh để tạo thư mục hình ảnh/video."""
    images: list[dict[str, Any]] = []
    videos: list[dict[str, Any]] = []
    seen_image: set[str] = set()
    seen_video: set[str] = set()

    # REST API mới tích hợp: Ưu tiên đặt làm mặc định
    images.append(
        _row(
            model_id="chatgpt2api",
            label="ChatGPT Image",
            recommended=True,
            description="Mô hình REST API tạo ảnh (neuravibemmo.dpdns.org)",
            provider="REST API",
        )
    )
    seen_image.add(normalize_model_name("chatgpt2api"))

    videos.append(
        _row(
            model_id="flow-veo",
            label="Google Veo 3.1",
            recommended=True,
            description="Mô hình REST API tạo video Flow API (neuravibemmo.dpdns.org)",
            provider="REST API",
        )
    )
    seen_video.add(normalize_model_name("flow-veo"))

    friendly_alias_ids = {"seedream-5.0", "seedream-4.5", "seedance-2.5", "seedance-2"}
    aliased_upstreams = {
        normalize_model_name(binding.upstream_model)
        for model in logical_models
        if model.id in friendly_alias_ids
        for binding in model.bindings
    }

    default_image = (defaults.image_model or "").strip() or "chatgpt2api"
    default_video = (defaults.video_model or "").strip() or "flow-veo"
    if default_image in ("seedream-5.0", ""):
        default_image = "chatgpt2api"
    if default_video in ("seedance-2.5", ""):
        default_video = "flow-veo"

    for model in logical_models:
        if not model.enabled:
            continue
        mid = (model.id or "").strip()
        if not mid:
            continue
        key = normalize_model_name(mid)
        label = (model.name or mid).strip() or mid
        if model.capability == "image" and key not in seen_image:
            seen_image.add(key)
            images.append(_row(model_id=mid, label=label, recommended=mid == default_image, provider="TokenFree"))
        elif model.capability == "video" and key not in seen_video:
            seen_video.add(key)
            videos.append(_row(model_id=mid, label=label, recommended=mid == default_video, provider="TokenFree"))

    for channel in channels:
        if not channel.enabled:
            continue
        for raw in channel.models:
            mid = (raw or "").strip()
            if not mid:
                continue
            key = normalize_model_name(mid)
            cap = infer_model_capability(mid)
            if cap == "image" and key not in seen_image:
                if key in aliased_upstreams:
                    continue
                seen_image.add(key)
                images.append(_row(model_id=mid, label=mid, recommended=mid == default_image))
            elif cap == "video" and key not in seen_video:
                if key in aliased_upstreams:
                    continue
                seen_video.add(key)
                videos.append(_row(model_id=mid, label=mid, recommended=mid == default_video))

    if not default_image:
        default_image = images[0]["id"] if images else (fallback_image or "").strip()
    if not default_video:
        default_video = videos[0]["id"] if videos else (fallback_video or "").strip()

    def _ensure_default_in_list(default_id: str, bucket: list[dict[str, Any]]) -> None:
        did = (default_id or "").strip()
        if not did:
            return
        norm = normalize_model_name(did)
        if any(normalize_model_name(str(row.get("id") or "")) == norm for row in bucket):
            return
        bucket.insert(0, _row(model_id=did, label=did, recommended=True))

    _ensure_default_in_list(default_image, images)
    _ensure_default_in_list(default_video, videos)
    if not images and default_image:
        images.append(_row(model_id=default_image, label=default_image, recommended=True))
    if not any(normalize_model_name(r["id"]) == normalize_model_name("seedream-5.0") for r in images):
        images.append(_row(model_id="seedream-5.0", label="Seedream 5.0", recommended=False, description="Mô hình tạo ảnh ByteDance Seedream", provider="TokenFree"))
    if not any(normalize_model_name(r["id"]) == normalize_model_name("seedance-2.5") for r in videos):
        videos.append(_row(model_id="seedance-2.5", label="Seedance 2.5", recommended=False, description="Mô hình chuyển ảnh sang video ByteDance Seedance", provider="TokenFree"))

    return {
        "image_models": images,
        "video_models": videos,
        "defaults": {
            "image_model": default_image,
            "video_model": default_video,
        },
    }


def catalog_payload() -> dict[str, Any]:
    """JSON thư mục công khai cho giao diện người dùng /api/media-models."""
    from app.services.model_settings import get_routing_snapshot

    snap = get_routing_snapshot()
    settings = get_settings()
    return build_media_catalog(
        logical_models=list(snap.logical_models),
        channels=list(snap.channels),
        defaults=snap.default_models,
        fallback_image=settings.model_image,
        fallback_video=settings.model_video,
    )


def is_valid_project_media_model(model_id: str | None, capability: LogicalModelCapability) -> bool:
    """Dự án khoa học phổ biến image_model / video_model: phù hợp với /api/media-models và định tuyến TokenFree."""
    mid = (model_id or "").strip()
    if not mid:
        return True
    from app.services.logical_model_router import resolve_logical_model_candidates

    cat = catalog_payload()
    list_key = "image_models" if capability == "image" else "video_models"
    norm_mid = normalize_model_name(mid)
    for row in cat.get(list_key) or []:
        if normalize_model_name(str(row.get("id") or "")) == norm_mid:
            return True
    defaults = cat.get("defaults") if isinstance(cat.get("defaults"), dict) else {}
    def_key = "image_model" if capability == "image" else "video_model"
    if normalize_model_name(str(defaults.get(def_key) or "")) == norm_mid:
        return True
    if resolve_logical_model_candidates(capability, mid):
        return True
    # Nó có cùng nguồn gốc với /api/media-models giao diện người dùng; nếu khả năng suy luận nhất quán thì được phép lưu và tuyến đường cụ thể được phân tích cú pháp trong giai đoạn tạo.
    if infer_model_capability(mid) == capability:
        return True
    settings = get_settings()
    fallback = (settings.model_image if capability == "image" else settings.model_video) or ""
    if normalize_model_name(fallback) == norm_mid:
        return True
    return False
