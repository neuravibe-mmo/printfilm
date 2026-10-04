"""Tích hợp API tạo ảnh ChatGPT2API qua neuravibemmo.dpdns.org."""
from __future__ import annotations

import base64
import logging
import time
from pathlib import Path
from typing import Any

import httpx

from app.services import storage

logger = logging.getLogger(__name__)

CHATGPT_IMAGE_API_URL = "https://neuravibemmo.dpdns.org/api/chatgpt2api/generate"


async def _to_base64_data_uri(image_ref: str) -> str | None:
    raw = (image_ref or "").strip()
    if not raw:
        return None
    if raw.startswith("data:image/"):
        return raw

    data: bytes | None = None
    mime = "image/png" if raw.lower().endswith(".png") else "image/jpeg"

    if raw.startswith("http://") or raw.startswith("https://"):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(raw)
                if res.status_code == 200:
                    data = res.content
        except Exception as e:
            logger.warning("Lỗi tải ảnh tham chiếu %s: %s", raw, e)
    else:
        p = Path(raw)
        if not p.is_file():
            p = storage.to_local_path(raw)
        if p and p.is_file():
            data = p.read_bytes()

    if data:
        b64 = base64.b64encode(data).decode("ascii")
        return f"data:{mime};base64,{b64}"
    return None


def resolve_image_size(size: str | None, aspect_ratio: str | None) -> str:
    """Quy đổi kích thước phù hợp chuẩn OpenAI (1024x1792 dọc 9:16, 1792x1024 ngang 16:9, 1024x1024 vuông 1:1)."""
    ar = (aspect_ratio or "").strip().lower()
    sz = (size or "").strip().lower()

    if ar in {"9:16", "3:4"} or ("x" in sz and int(sz.split("x")[1]) > int(sz.split("x")[0])):
        return "1024x1792"
    if ar in {"16:9", "4:3"} or ("x" in sz and int(sz.split("x")[0]) > int(sz.split("x")[1])):
        return "1792x1024"
    return "1024x1024"


async def generate_chatgpt_image(
    prompt: str,
    *,
    ref_urls: list[str] | None = None,
    size: str | None = None,
    aspect_ratio: str | None = None,
    project_id: int | None = None,
    shot_no: int | None = None,
    model: str = "gpt-image-2",
) -> str:
    """Tạo ảnh qua ChatGPT2API và lưu về máy chủ local."""
    target_size = resolve_image_size(size, aspect_ratio)

    payload: dict[str, Any] = {
        "prompt": prompt,
        "model": model or "gpt-image-2",
        "size": target_size,
        "n": 1,
        "response_format": "b64_json",
    }

    # Nếu có ảnh tham chiếu -> nạp vào mảng images
    images_b64: list[str] = []
    if ref_urls:
        for ref in ref_urls:
            uri = await _to_base64_data_uri(ref)
            if uri:
                images_b64.append(uri)

    if images_b64:
        payload["images"] = images_b64

    logger.info("Gọi ChatGPT2API tạo ảnh: prompt=%s size=%s refs=%s", prompt[:50], target_size, len(images_b64))

    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(CHATGPT_IMAGE_API_URL, json=payload)
        if resp.status_code >= 400:
            err_msg = f"ChatGPT2API HTTP {resp.status_code}: {resp.text[:300]}"
            logger.error("Tạo ảnh thất bại: %s", err_msg)
            raise RuntimeError(err_msg)

        data = resp.json()

    # Trích xuất dữ liệu ảnh b64_json hoặc url
    img_item = (data.get("data") or [{}])[0] if isinstance(data.get("data"), list) else {}
    b64_str = img_item.get("b64_json") or data.get("b64_json")
    remote_url = img_item.get("url") or data.get("url")

    stamp = int(time.time())
    dest_dir = storage.project_dir(project_id or 0)
    dest_path = dest_dir / f"img_{(shot_no or 0):03d}_{stamp}.jpg"

    if b64_str:
        img_bytes = base64.b64decode(b64_str)
        dest_path.write_bytes(img_bytes)
        return storage.publish_local(dest_path)

    if remote_url:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(remote_url)
            if r.status_code == 200:
                dest_path.write_bytes(r.content)
                return storage.publish_local(dest_path)

    raise RuntimeError("ChatGPT2API không trả về b64_json hoặc URL hình ảnh hợp lệ")
