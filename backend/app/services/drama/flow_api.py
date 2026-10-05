"""Tích hợp API tạo video Google Veo qua cổng Flow API (lưu trữ bền vững trên đĩa)."""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings
from app.services import storage

logger = logging.getLogger(__name__)


def get_flow_base_url() -> str:
    return f"{get_settings().domain_web_2_api.rstrip('/')}/api/flow"


FLOW_PROJECT_ID = "746c4f17-5aa9-4cf1-b824-f8d0bd7aa6c4"

# Thư mục lưu trạng thái tác vụ trên đĩa (tránh mất khi uvicorn reload)
FLOW_STORAGE_DIR = Path(__file__).resolve().parents[3] / "data" / "flow_tasks"
FLOW_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def _save_task_state(task_id: str, data: dict[str, Any]) -> None:
    try:
        f = FLOW_STORAGE_DIR / f"{task_id}.json"
        f.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.warning("Không thể lưu flow task state: %s", e)


def get_flow_video_result(task_id: str) -> dict[str, Any] | None:
    f = FLOW_STORAGE_DIR / f"{task_id}.json"
    if f.exists():
        try:
            return json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Không thể đọc flow task state %s: %s", task_id, e)
    return None


async def _to_base64_data_uri(image_path_or_url: str) -> str | None:
    raw = (image_path_or_url or "").strip()
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
            p = storage.local_path_from_url(raw)
        if p and p.is_file():
            data = p.read_bytes()

    if data:
        b64 = base64.b64encode(data).decode("ascii")
        return f"data:{mime};base64,{b64}"
    return None


async def upload_image_to_flow(image_ref: str, project_id: str = FLOW_PROJECT_ID) -> str | None:
    """Upload ảnh lên Flow API lấy media_id."""
    data_uri = await _to_base64_data_uri(image_ref)
    if not data_uri:
        return None
    mime = "image/png" if "image/png" in data_uri else "image/jpeg"
    payload = {
        "image_base64": data_uri,
        "project_id": project_id,
        "mime_type": mime,
        "file_name": f"ref_{mime.split('/')[-1]}",
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{get_flow_base_url()}/upload-image-b64", json=payload)
            if resp.status_code == 200:
                media_id = resp.json().get("media_id")
                logger.info("Upload ảnh Flow thành công media_id=%s", media_id)
                return media_id
            logger.error("Upload ảnh Flow thất bại: HTTP %s %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.error("Lỗi upload ảnh Flow: %s", e)
    return None


async def _run_flow_generation(
    task_id: str,
    prompt: str,
    image_ref: str | None,
    aspect_ratio: str = "9:16",
    project_id: str = FLOW_PROJECT_ID,
    model_key: str = "abra_r2v_10s",
) -> None:
    _save_task_state(task_id, {"status": "running", "created_at": time.time()})
    try:
        ref_ids: list[str] = []

        # Tự động tối ưu hóa prompt qua ChatGPT2API để Google Veo hiểu chính xác bối cảnh & chuyển động
        final_prompt = prompt or "Beauty Commercial"
        try:
            from app.services.drama.prompt_optimizer import optimize_video_prompt

            final_prompt = await optimize_video_prompt(prompt)
        except Exception as opt_err:
            logger.warning("Lỗi tối ưu prompt qua ChatGPT2API: %s", opt_err)

        if image_ref:
            mid = await upload_image_to_flow(image_ref, project_id=project_id)
            if mid:
                ref_ids.append(mid)

        payload = {
            "reference_media_ids": ref_ids,
            "prompt": final_prompt,
            "project_id": project_id,
            "scene_id": "",
            "aspect_ratio": aspect_ratio or "9:16",
            "model_key": model_key or "abra_r2v_10s",
        }
        logger.info("Bắt đầu gọi Flow API tạo video task=%s ref_ids=%s prompt=%s", task_id, ref_ids, final_prompt[:80])

        async with httpx.AsyncClient(timeout=240.0) as client:
            resp = await client.post(
                f"{get_flow_base_url()}/generate-video-veo_3_1_r2v_lite_low_priority",
                json=payload,
            )
            if resp.status_code >= 400:
                _save_task_state(
                    task_id,
                    {"status": "failed", "error": f"Flow HTTP {resp.status_code}: {resp.text[:200]}"},
                )
                return
            data = resp.json()
            video_url = data.get("video_url")
            if data.get("success") and video_url:
                logger.info("Flow tạo video thành công task=%s url=%s", task_id, video_url[:60])
                _save_task_state(
                    task_id,
                    {
                        "status": "succeeded",
                        "video_url": video_url,
                        "thumbnail_url": data.get("thumbnail_url"),
                    },
                )
            else:
                _save_task_state(task_id, {"status": "failed", "error": str(data)})
    except Exception as e:
        logger.error("Lỗi Flow tạo video task=%s: %s", task_id, e)
        _save_task_state(task_id, {"status": "failed", "error": str(e)})


def submit_flow_video(
    prompt: str,
    image_ref: str | None = None,
    aspect_ratio: str = "9:16",
) -> str:
    import uuid

    task_id = f"flow-{uuid.uuid4().hex[:12]}"
    asyncio.create_task(
        _run_flow_generation(
            task_id=task_id,
            prompt=prompt,
            image_ref=image_ref,
            aspect_ratio=aspect_ratio,
        )
    )
    return task_id
