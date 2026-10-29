"""Drama Seedream / voice / Seedance generation endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.models_drama import DramaAsset
from app.schemas_drama import (
    DramaAssetOut,
    DramaImageGenerateRequest,
    DramaVideoGenerateRequest,
    DramaVoiceGenerateRequest,
    DramaVoicePromptRequest,
)
from app.services.drama.access import get_owned_drama_project
from app.services.drama.generation import generate_voice_asset_audio
from app.services.billing import record_llm_chat_line, run_billed_ephemeral
from app.services.billing.http import http_exception_for_value_error
from app.services.drama.jobs import dispatch_asset_image_job, dispatch_asset_video_job
from app.services.drama.voice_prompt import suggest_voice_prompt_for_character

router = APIRouter()
logger = logging.getLogger("app.drama.generation")


@router.post("/generation/image")
async def generate_image(
    body: DramaImageGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    # Tham gia nhóm để tạo biểu đồ; quay trở lại hàng đợi, giao diện người dùng thăm dò nội dung params.thế hệ / làm mới danh sách
    project = await get_owned_drama_project(db, body.project_id, user, with_script=True)
    asset = None
    if body.asset_id:
        asset = await db.get(DramaAsset, body.asset_id)
        if not asset or asset.project_id != project.id:
            raise HTTPException(status_code=404, detail="资产不存在")
        params = dict(asset.params or {})
        from datetime import datetime, timezone

        params["generation"] = {
            "status": "queued",
            "queued_at": datetime.now(timezone.utc).isoformat(),
            "message": "已入队",
        }
        asset.params = params

    prompt = (body.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="缺少 prompt")

    kind = body.asset_type_kind or (asset.type if asset else "character")
    # style_id ưu tiên yêu cầu, nếu không các thông số dự án sẽ bị khôi phục
    style_id = (body.image_style_id or "").strip() or str(
        (project.params or {}).get("image_style_id") or ""
    ).strip() or None
    try:
        task_id = await dispatch_asset_image_job(
            db,
            user,
            project.id,
            user.id,
            prompt,
            asset_id=asset.id if asset else None,
            name=body.name,
            kind=kind,
            image_style_id=style_id,
            model_id=body.model_id,
            aspect_ratio=body.aspect_ratio,
            resolution=body.resolution,
        )
    except ValueError as exc:
        await db.rollback()
        raise http_exception_for_value_error(exc) from exc
    await db.commit()
    if asset is not None:
        await db.refresh(asset)
    logger.info(
        "已入队资产生图 project_id=%s asset_id=%s kind=%s style=%s model=%s size=%s/%s task_id=%s prompt_len=%s",
        project.id,
        asset.id if asset else None,
        kind,
        style_id,
        body.model_id,
        body.aspect_ratio,
        body.resolution,
        task_id,
        len(prompt),
    )
    return {
        "ok": True,
        "queued": True,
        "status": "queued",
        "task_id": task_id,
        "asset_id": asset.id if asset else None,
        "asset": DramaAssetOut.model_validate(asset).model_dump() if asset else None,
    }


@router.post("/generation/image/preview_prompt")
async def preview_image_prompt(
    body: DramaImageGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    from app.services.drama.generation_prompt import build_generation_prompt
    from app.services.drama.image_styles import get_image_style_label, resolve_image_style_board_url

    project = await get_owned_drama_project(db, body.project_id, user, with_script=True)
    asset = None
    if body.asset_id:
        asset = await db.get(DramaAsset, body.asset_id)
        if asset and asset.project_id != project.id:
            asset = None

    prompt = (body.prompt or "").strip()
    kind = body.asset_type_kind or (asset.type if asset else "character")
    style_id = (body.image_style_id or "").strip() or str(
        (project.params or {}).get("image_style_id") or ""
    ).strip() or None

    board_url = resolve_image_style_board_url(style_id)
    full_prompt = build_generation_prompt(
        prompt, asset_type=kind, style_id=style_id, has_style_board=bool(board_url)
    )

    reference_images = []
    if board_url:
        style_label = get_image_style_label(style_id) if style_id else "Phong cách"
        reference_images.append({
            "type": "style_board",
            "label": f"Ảnh tham chiếu phong cách: {style_label} ({style_id})",
            "url": board_url,
        })
    if asset and (asset.url or asset.cover):
        reference_images.append({
            "type": "asset_image",
            "label": f"Ảnh tài sản hiện tại ({asset.name or 'Asset'})",
            "url": asset.url or asset.cover,
        })

    target_size = "1024x1792" if (body.aspect_ratio or "9:16").strip() == "9:16" else "1792x1024"

    return {
        "ok": True,
        "full_prompt": full_prompt,
        "style_id": style_id,
        "model_id": body.model_id or "chatgpt2api",
        "target_size": target_size,
        "reference_images": reference_images,
    }


@router.post("/generation/video")
async def generate_video(
    body: DramaVideoGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    # Xếp hàng nội dung canvas để tạo video; thông số nội dung cuộc thăm dò giao diện người dùng.
    project = await get_owned_drama_project(db, body.project_id, user, with_script=True)
    asset = await db.get(DramaAsset, body.asset_id)
    if not asset or asset.project_id != project.id:
        raise HTTPException(status_code=404, detail="资产不存在")
    prompt = (body.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="缺少 prompt")

    params = dict(asset.params or {})
    params["generation"] = {"status": "generating"}
    params["visualPrompt"] = prompt
    asset.params = params

    style_id = (body.image_style_id or "").strip() or str(
        (project.params or {}).get("image_style_id") or ""
    ).strip() or None
    try:
        task_id = await dispatch_asset_video_job(
            db,
            user,
            project.id,
            user.id,
            prompt,
            asset.id,
            model_id=body.model_id,
            aspect_ratio=body.aspect_ratio,
            resolution=body.resolution,
            duration_sec=body.duration_sec,
            image_style_id=style_id,
            reference_asset_ids=body.reference_asset_ids,
        )
    except ValueError as exc:
        await db.rollback()
        raise http_exception_for_value_error(exc) from exc
    await db.commit()
    await db.refresh(asset)
    logger.info(
        "已入队资产生视频 project_id=%s asset_id=%s model=%s size=%s/%s duration=%s task_id=%s prompt_len=%s",
        project.id,
        asset.id,
        body.model_id,
        body.aspect_ratio,
        body.resolution,
        body.duration_sec,
        task_id,
        len(prompt),
    )
    return {
        "ok": True,
        "queued": True,
        "status": "generating",
        "task_id": task_id,
        "asset_id": asset.id,
        "asset": DramaAssetOut.model_validate(asset).model_dump(),
    }


@router.post("/generation/voice_prompt")
async def suggest_voice_prompt(
    body: DramaVoicePromptRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """AI tạo lời nhắc mô tả âm sắc dựa trên cài đặt ký tự."""
    project = await get_owned_drama_project(db, body.project_id, user, with_script=True)
    asset = await db.get(DramaAsset, body.asset_id)
    if not asset or asset.project_id != project.id:
        raise HTTPException(status_code=404, detail="资产不存在")
    if (asset.type or "").lower() != "character":
        raise HTTPException(status_code=400, detail="仅支持角色资产")

    async def _do_voice_prompt() -> tuple[str, str, str]:
        voice_prompt, speaker, sample_text = await suggest_voice_prompt_for_character(asset, project)
        await record_llm_chat_line(
            db,
            user_id=user.id,
            domain="drama",
            drama_project_id=project.id,
        )
        return voice_prompt, speaker, sample_text

    try:
        task, (voice_prompt, speaker, sample_text) = await run_billed_ephemeral(
            db,
            user,
            domain="drama",
            task_type="voice_prompt",
            executor=_do_voice_prompt,
            payload={"asset_id": asset.id},
            drama_project_id=project.id,
            asset_id=asset.id,
            commit=True,
        )
    except ValueError as exc:
        raise http_exception_for_value_error(exc) from exc

    logger.info(
        "音色提示词已生成 project_id=%s asset_id=%s len=%s speaker=%s task_id=%s",
        project.id,
        asset.id,
        len(voice_prompt),
        speaker,
        task.id,
    )
    return {
        "ok": True,
        "voice_prompt": voice_prompt,
        "speaker": speaker,
        "sample_text": sample_text,
        "asset_id": asset.id,
        "task_id": task.id,
    }


@router.post("/generation/voice")
async def generate_voice(
    body: DramaVoiceGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Tổng hợp âm thanh tham chiếu nội dung giọng nói theo các từ gợi ý (thư viện giọng nói độc lập cho truyện tranh, /api/voices khoa học không phổ biến)."""
    project = await get_owned_drama_project(db, body.project_id, user, with_script=True)
    prompt = (body.voice_prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="缺少 voice_prompt")

    asset = None
    if body.asset_id:
        asset = await db.get(DramaAsset, body.asset_id)
        if not asset or asset.project_id != project.id:
            raise HTTPException(status_code=404, detail="资产不存在")
    else:
        asset = DramaAsset(
            project_id=project.id,
            type="voice",
            asset_type="audio",
            name=(body.name or "").strip() or "未命名音色",
            params={"voicePrompt": prompt, "generation": {"status": "generating"}},
        )
        db.add(asset)
        await db.commit()
        await db.refresh(asset)

    params = dict(asset.params or {})
    params["generation"] = {"status": "generating"}
    params["voicePrompt"] = prompt
    asset.params = params
    await db.commit()
    await db.refresh(asset)

    character_asset = None
    if body.character_asset_id:
        character_asset = await db.get(DramaAsset, body.character_asset_id)
        if not character_asset or character_asset.project_id != project.id:
            raise HTTPException(status_code=404, detail="角色资产不存在")
        if (character_asset.type or "").lower() != "character":
            raise HTTPException(status_code=400, detail="character_asset_id 须为角色资产")

    try:
        updated = await generate_voice_asset_audio(
            db,
            user,
            project,
            asset,
            voice_prompt=prompt,
            sample_text=body.sample_text,
            speaker=body.speaker,
            character_asset=character_asset,
        )
    except Exception as exc:  # noqa: BLE001
        params = dict(asset.params or {})
        params["generation"] = {"status": "failed", "error": str(exc)[:500]}
        asset.params = params
        await db.commit()
        logger.exception("音色合成失败 project_id=%s asset_id=%s", project.id, asset.id)
        raise HTTPException(status_code=500, detail=str(exc)[:500]) from exc

    logger.info(
        "音色合成完成 project_id=%s asset_id=%s url=%s",
        project.id,
        updated.id,
        (updated.url or "")[:80],
    )
    return {
        "ok": True,
        "asset": DramaAssetOut.model_validate(updated).model_dump(),
    }
