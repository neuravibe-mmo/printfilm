"""Drama asset endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.models_drama import DramaAsset, DramaProject
from app.schemas_drama import (
    DramaActivateImageVersionRequest,
    DramaAssetCreate,
    DramaAssetOut,
    DramaAssetUpdate,
    DramaDetectAssetsRequest,
    DramaDetectAssetsResponse,
    SeedAssetsFromScriptOut,
    UploadAssetFlowRequest,
)
from app.services.drama.detect_assets_llm import (
    detect_assets_with_llm,
    detect_or_create_props_with_llm,
    detect_or_create_scene_with_llm,
)
from app.services.drama.seed_asset_params import build_named_image_params
from app.services.drama.access import get_owned_drama_project
from app.services.billing import run_billed_ephemeral
from app.services.billing.http import http_exception_for_value_error
from app.services.drama.billing_util import record_seed_assets_llm_usage
from app.services.drama.jobs import dispatch_seed_assets_job
from app.services.drama.seed import (
    _asset_dedupe_key,
    _normalize_asset_name,
    purge_voice_like_character_assets,
    seed_assets_from_script,
)

router = APIRouter()


@router.get("/assets", response_model=list[DramaAssetOut])
async def list_assets(
    project_id: int | None = None,
    library_only: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DramaAssetOut]:
    # Global library = all assets of user's drama projects; optional project filter
    from app.services.drama.seed import merge_duplicate_library_assets

    q = (
        select(DramaAsset)
        .join(DramaProject, DramaAsset.project_id == DramaProject.id)
        .where(DramaProject.user_id == user.id)
    )
    if project_id is not None:
        await get_owned_drama_project(db, project_id, user)
        # Khi vào thư viện nội dung, hãy hợp nhất các bản sao có cùng tên và xóa các tên âm thanh bị nhập nhầm vào ký tự.
        removed = await merge_duplicate_library_assets(db, int(project_id))
        purged = await purge_voice_like_character_assets(db, int(project_id))
        if removed or purged:
            await db.commit()
        q = q.where(DramaAsset.project_id == project_id).order_by(DramaAsset.id.asc())
    else:
        q = q.order_by(DramaAsset.updated_at.desc(), DramaAsset.id.desc())
    rows = list((await db.execute(q)).scalars().all())
    if library_only:
        canvas_only_types = {"video", "audio", "text"}
        rows = [
            asset
            for asset in rows
            if (asset.type or "").lower() not in canvas_only_types
            and (asset.asset_type or "").lower() != "video"
        ]
    return [DramaAssetOut.model_validate(a) for a in rows]


@router.post("/assets", response_model=DramaAssetOut)
async def create_asset(
    body: DramaAssetCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaAssetOut:
    await get_owned_drama_project(db, body.project_id, user)
    # Nếu đã tồn tại loại thẻ có cùng tên thì sẽ được trả lại trực tiếp để tránh việc sao chép thủ công/đồng thời các thẻ trùng lặp.
    want_name = _normalize_asset_name(body.name or "")
    if want_name:
        want_key = _asset_dedupe_key(body.type or "", want_name)
        existing_rows = list(
            (
                await db.execute(
                    select(DramaAsset).where(DramaAsset.project_id == body.project_id)
                )
            )
            .scalars()
            .all()
        )
        for row in existing_rows:
            key = _asset_dedupe_key(row.type or "", _normalize_asset_name(row.name or ""))
            if key == want_key:
                return DramaAssetOut.model_validate(row)
    asset = DramaAsset(
        project_id=body.project_id,
        type=body.type,
        asset_type=body.asset_type,
        name=body.name,
        cover=body.cover,
        url=body.url,
        params=body.params,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return DramaAssetOut.model_validate(asset)


def _merge_asset_params(prev: dict | None, incoming: dict | None) -> dict:
    """Hợp nhất các thông số nội dung: giữ lại image_versions / thế hệ đang diễn ra khi khách hàng ghi lại tất cả."""
    base = dict(prev or {}) if isinstance(prev, dict) else {}
    patch = dict(incoming or {}) if isinstance(incoming, dict) else {}
    out = {**base, **patch}

    prev_gen = base.get("generation") if isinstance(base.get("generation"), dict) else None
    prev_status = str((prev_gen or {}).get("status") or "").lower()
    if prev_status in {"queued", "running", "generating"}:
        # Không được phép ghi đè trạng thái máy khách cũ trong khi hình ảnh đang được tạo.
        out["generation"] = prev_gen

    prev_vers = base.get("image_versions")
    inc_vers = patch.get("image_versions") if "image_versions" in patch else None
    if isinstance(prev_vers, list) and prev_vers:
        if not isinstance(inc_vers, list):
            out["image_versions"] = prev_vers
        else:
            by_id: dict[str, dict] = {}
            order: list[str] = []
            for row in [*prev_vers, *inc_vers]:
                if not isinstance(row, dict):
                    continue
                vid = str(row.get("id") or "").strip()
                if not vid:
                    continue
                if vid not in by_id:
                    order.append(vid)
                by_id[vid] = row
            out["image_versions"] = [by_id[vid] for vid in order][:8]
    return out


@router.patch("/assets/{asset_id}", response_model=DramaAssetOut)
async def update_asset(
    asset_id: int,
    body: DramaAssetUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaAssetOut:
    from app.models_drama import DramaProject

    result = await db.execute(
        select(DramaAsset)
        .join(DramaProject, DramaAsset.project_id == DramaProject.id)
        .where(DramaAsset.id == asset_id, DramaProject.user_id == user.id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")
    for field in ("type", "asset_type", "name", "cover", "url", "params", "flow_media_id"):
        val = getattr(body, field)
        if val is None:
            continue
        if field == "params" and isinstance(val, dict):
            asset.params = _merge_asset_params(
                asset.params if isinstance(asset.params, dict) else {},
                val,
            )
        else:
            setattr(asset, field, val)
    await db.commit()
    await db.refresh(asset)
    return DramaAssetOut.model_validate(asset)


@router.post("/assets/{asset_id}/upload", response_model=DramaAssetOut)
async def upload_asset_media(
    asset_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaAssetOut:
    """Upload image/media for a drama asset directly to OSS (no local persist)."""
    from app.models_drama import DramaProject
    from app.services import oss as oss_svc

    if not oss_svc.oss_enabled():
        raise HTTPException(status_code=503, detail="OSS 未启用，无法上传资产媒体")

    result = await db.execute(
        select(DramaAsset)
        .join(DramaProject, DramaAsset.project_id == DramaProject.id)
        .where(DramaAsset.id == asset_id, DramaProject.user_id == user.id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")

    gen = (asset.params or {}).get("generation") if isinstance(asset.params, dict) else None
    status = str((gen or {}).get("status") or "").lower() if isinstance(gen, dict) else ""
    if status in {"queued", "running", "generating"}:
        raise HTTPException(status_code=409, detail="形象生成中，请稍后再更换图片")

    content_type = (file.content_type or "").lower()
    allowed = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = allowed.get(content_type)
    if not ext:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            ext = ".jpg" if suffix == ".jpeg" else suffix
            content_type = {
                ".jpg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp",
                ".gif": "image/gif",
            }.get(ext, "application/octet-stream")
        else:
            raise HTTPException(status_code=400, detail="仅支持 JPG / PNG / WebP / GIF")

    # Kiểm tra trực tiếp kích thước tệp tạm thời tải lên để tránh đọc toàn bộ tệp vào bộ nhớ trước.
    upload_fp = file.file
    try:
        upload_fp.seek(0, 2)
        size = upload_fp.tell()
        upload_fp.seek(0)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"无法读取上传文件：{exc}") from exc
    if size <= 0:
        raise HTTPException(status_code=400, detail="空文件")
    if size > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件不能超过 20MB")

    object_key = (
        f"{oss_svc.folder_prefix()}/generated/p{asset.project_id}/"
        f"asset_{asset.id}_{uuid.uuid4().hex[:10]}{ext}"
    )
    try:
        # OSS SDK chặn IO một cách đồng bộ và đặt nó vào nhóm luồng để tránh chặn vòng lặp sự kiện.
        url = await run_in_threadpool(
            oss_svc.upload_fileobj,
            upload_fp,
            object_key,
            content_type=content_type or "application/octet-stream",
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"OSS 上传失败：{exc}") from exc

    from app.services.drama.generation import archive_asset_image_version

    archive_asset_image_version(asset, source="upload")
    asset.url = url
    asset.cover = url
    if not asset.asset_type or asset.asset_type == "none":
        asset.asset_type = "image"
    params = dict(asset.params or {})
    gen = params.get("generation")
    if isinstance(gen, dict):
        params["generation"] = {**gen, "status": "done", "source": "upload"}
    else:
        params["generation"] = {"status": "done", "source": "upload"}
    asset.params = params
    await db.commit()
    await db.refresh(asset)
    return DramaAssetOut.model_validate(asset)


@router.post("/assets/{asset_id}/activate_image_version", response_model=DramaAssetOut)
async def activate_image_version(
    asset_id: int,
    body: DramaActivateImageVersionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaAssetOut:
    """Đặt phiên bản lịch sử hình ảnh nội dung thành hiện tại."""
    from app.services.drama.generation import activate_asset_image_version

    result = await db.execute(
        select(DramaAsset)
        .join(DramaProject, DramaAsset.project_id == DramaProject.id)
        .where(DramaAsset.id == asset_id, DramaProject.user_id == user.id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")

    gen = (asset.params or {}).get("generation") if isinstance(asset.params, dict) else None
    status = str((gen or {}).get("status") or "").lower() if isinstance(gen, dict) else ""
    if status in {"queued", "running", "generating"}:
        raise HTTPException(status_code=409, detail="形象生成中，无法切换历史版本")

    try:
        activate_asset_image_version(asset, body.version_id.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await db.commit()
    await db.refresh(asset)
    return DramaAssetOut.model_validate(asset)


@router.get("/assets/{asset_id}/usage")
async def get_asset_usage(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    from app.models_drama import DramaAsset, DramaEpisode, DramaEpisodeFragment, DramaFragmentAssetRef, DramaProject

    result = await db.execute(
        select(DramaAsset)
        .join(DramaProject, DramaAsset.project_id == DramaProject.id)
        .where(DramaAsset.id == asset_id, DramaProject.user_id == user.id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Tài sản không tồn tại")

    ref_stmt = (
        select(
            DramaEpisode.id.label("episode_id"),
            DramaEpisode.name.label("episode_name"),
            DramaEpisode.params.label("episode_params"),
            DramaEpisodeFragment.id.label("fragment_id"),
            DramaEpisodeFragment.sort_order.label("fragment_order"),
        )
        .select_from(DramaFragmentAssetRef)
        .join(DramaEpisodeFragment, DramaFragmentAssetRef.fragment_id == DramaEpisodeFragment.id)
        .join(DramaEpisode, DramaEpisodeFragment.episode_id == DramaEpisode.id)
        .where(DramaFragmentAssetRef.asset_id == asset_id)
    )
    ref_rows = (await db.execute(ref_stmt)).all()

    text_stmt = (
        select(
            DramaEpisode.id.label("episode_id"),
            DramaEpisode.name.label("episode_name"),
            DramaEpisode.params.label("episode_params"),
            DramaEpisodeFragment.id.label("fragment_id"),
            DramaEpisodeFragment.sort_order.label("fragment_order"),
        )
        .select_from(DramaEpisodeFragment)
        .join(DramaEpisode, DramaEpisodeFragment.episode_id == DramaEpisode.id)
        .where(
            DramaEpisode.project_id == asset.project_id,
            DramaEpisodeFragment.content.like(f"%@asset:{asset_id}%"),
        )
    )
    text_rows = (await db.execute(text_stmt)).all()

    frag_seen: set[int] = set()
    episode_map: dict[int, dict[str, Any]] = {}

    for r in list(ref_rows) + list(text_rows):
        fid = int(r.fragment_id)
        if fid in frag_seen:
            continue
        frag_seen.add(fid)

        eid = int(r.episode_id)
        if eid not in episode_map:
            ep_no = (r.episode_params or {}).get("episodeNumber") if isinstance(r.episode_params, dict) else None
            ep_label = f"Tập {ep_no}" if ep_no else (r.episode_name or f"Tập {eid}")
            episode_map[eid] = {
                "episode_id": eid,
                "label": ep_label,
                "fragment_count": 0,
                "_frag_orders": [],
            }
        episode_map[eid]["fragment_count"] += 1
        order_idx = int(r.fragment_order) if r.fragment_order is not None else 0
        episode_map[eid]["_frag_orders"].append(order_idx)

    episodes_list = []
    for ep in episode_map.values():
        frag_orders = sorted(set(ep.pop("_frag_orders", [])))
        ep["fragment_orders"] = [idx + 1 for idx in frag_orders]
        ep["fragments"] = [f"Phân cảnh {idx + 1:02d}" for idx in frag_orders]
        episodes_list.append(ep)

    episodes_list.sort(key=lambda x: x["episode_id"])

    return {
        "asset_id": asset_id,
        "asset_name": asset.name,
        "asset_type": asset.type,
        "linked_fragment_count": len(frag_seen),
        "episodes": episodes_list,
    }


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    from app.models_drama import DramaAsset, DramaAssetEpisode, DramaFragmentAssetRef, DramaProject
    from app.models_tasks import TaskRun
    from sqlalchemy import delete, update

    result = await db.execute(
        select(DramaAsset)
        .join(DramaProject, DramaAsset.project_id == DramaProject.id)
        .where(DramaAsset.id == asset_id, DramaProject.user_id == user.id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Tài sản không tồn tại")

    # 1. Bỏ liên kết các task runs đang tham chiếu tới asset này để tránh lỗi foreign key constraint
    await db.execute(
        update(TaskRun).where(TaskRun.asset_id == asset.id).values(asset_id=None)
    )

    # 2. Xóa các liên kết tham chiếu phân cảnh và tập
    await db.execute(
        delete(DramaFragmentAssetRef).where(DramaFragmentAssetRef.asset_id == asset.id)
    )
    await db.execute(
        delete(DramaAssetEpisode).where(DramaAssetEpisode.asset_id == asset.id)
    )

    # 3. Xóa chính asset
    await db.delete(asset)
    await db.commit()
    return {"ok": True}


@router.post("/assets/seed_from_script", response_model=SeedAssetsFromScriptOut)
async def seed_assets(
    project_id: int,
    refresh_prompts: bool = False,
    reextract_props: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SeedAssetsFromScriptOut:
    project = await get_owned_drama_project(db, project_id, user, with_script=True)
    heavy = bool(refresh_prompts or reextract_props)

    # Khóa hàng: Ngăn chặn việc chèn hạt giống đồng thời các vai trò có cùng tên trong các thư viện trống
    locked = (
        await db.execute(
            select(DramaProject).where(DramaProject.id == project.id).with_for_update()
        )
    ).scalar_one()
    params = dict(locked.params or {}) if isinstance(locked.params, dict) else {}
    if str(params.get("assets_seed_status") or "") == "generating":
        existing = list(
            (await db.execute(select(DramaAsset).where(DramaAsset.project_id == locked.id)))
            .scalars()
            .all()
        )
        return SeedAssetsFromScriptOut(
            assets=[DramaAssetOut.model_validate(a) for a in existing],
            status="generating",
            message="资产抽取进行中，请稍候刷新",
        )

    if heavy:
        params["assets_seed_status"] = "generating"
        params["assets_seed_generating_at"] = datetime.now(timezone.utc).isoformat()
        params.pop("assets_seed_error", None)
        locked.params = params
        try:
            await dispatch_seed_assets_job(
                db,
                user,
                project_id,
                refresh_prompts=refresh_prompts,
                reextract_props=reextract_props,
            )
        except ValueError as exc:
            await db.rollback()
            raise http_exception_for_value_error(exc) from exc
        existing = list(
            (await db.execute(select(DramaAsset).where(DramaAsset.project_id == locked.id)))
            .scalars()
            .all()
        )
        return SeedAssetsFromScriptOut(
            assets=[DramaAssetOut.model_validate(a) for a in existing],
            status="generating",
            message="资产抽取任务已提交，请稍候刷新",
        )

    params["assets_seed_status"] = "generating"
    params["assets_seed_generating_at"] = datetime.now(timezone.utc).isoformat()
    params.pop("assets_seed_error", None)
    locked.params = params
    await db.commit()
    try:
        async def _do_sync_seed():
            project_inner = await get_owned_drama_project(db, project_id, user, with_script=True)
            seed_result = await seed_assets_from_script(
                db,
                project_inner,
                refresh_prompts=refresh_prompts,
                reextract_props=reextract_props,
            )
            await record_seed_assets_llm_usage(db, user, project_id, seed_result)
            return seed_result

        _task, result = await run_billed_ephemeral(
            db,
            user,
            domain="drama",
            task_type="seed_assets",
            executor=_do_sync_seed,
            drama_project_id=project_id,
            payload={"sync": True, "refresh_prompts": refresh_prompts, "reextract_props": reextract_props},
            commit=False,
        )
        project = await get_owned_drama_project(db, project_id, user, with_script=True)
        params = dict(project.params or {}) if isinstance(project.params, dict) else {}
        params["assets_seed_status"] = "done"
        params.pop("assets_seed_error", None)
        params.pop("assets_seed_generating_at", None)
        project.params = params
        await db.commit()
    except ValueError as exc:
        project = await get_owned_drama_project(db, project_id, user, with_script=True)
        params = dict(project.params or {}) if isinstance(project.params, dict) else {}
        params["assets_seed_status"] = "failed"
        params["assets_seed_error"] = str(exc)[:500]
        params.pop("assets_seed_generating_at", None)
        project.params = params
        await db.commit()
        raise http_exception_for_value_error(exc) from exc
    except HTTPException:
        raise
    except RuntimeError as exc:
        project = await get_owned_drama_project(db, project_id, user, with_script=True)
        params = dict(project.params or {}) if isinstance(project.params, dict) else {}
        params["assets_seed_status"] = "failed"
        params["assets_seed_error"] = str(exc)[:500]
        params.pop("assets_seed_generating_at", None)
        project.params = params
        await db.commit()
        raise HTTPException(status_code=502, detail=str(exc)[:500]) from exc
    except Exception:
        project = await get_owned_drama_project(db, project_id, user, with_script=True)
        params = dict(project.params or {}) if isinstance(project.params, dict) else {}
        params["assets_seed_status"] = "failed"
        params["assets_seed_error"] = "资产抽取失败"
        params.pop("assets_seed_generating_at", None)
        project.params = params
        await db.commit()
        raise
    return SeedAssetsFromScriptOut(
        assets=[DramaAssetOut.model_validate(a) for a in result.assets],
        created_count=result.created_count,
        prompts_refreshed=result.prompts_refreshed,
        props_updated=result.props_updated,
        llm_errors=result.llm_errors,
        status="done",
    )


@router.post("/assets/detect", response_model=DramaDetectAssetsResponse)
async def detect_fragment_assets(
    body: DramaDetectAssetsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaDetectAssetsResponse:
    """Gửi nội dung phân cảnh và danh sách ứng viên trong Kho tài sản lên AI để nhận diện các mục xuất hiện."""
    # Xử lý riêng cho cảnh quay (bối cảnh): nếu chưa có trong kho thì tự động tạo mới
    if body.asset_type == "scene":
        existing_scenes: list[DramaAsset] = []
        if body.project_id:
            await get_owned_drama_project(db, body.project_id, user)
            stmt = select(DramaAsset).where(
                DramaAsset.project_id == body.project_id,
                DramaAsset.type == "scene",
            )
            existing_scenes = list((await db.execute(stmt)).scalars().all())

        candidates: list[dict[str, Any]] = []
        if body.candidate_assets:
            candidates = [c.model_dump() for c in body.candidate_assets if c.type == "scene"]
        if not candidates and existing_scenes:
            for a in existing_scenes:
                p = a.params or {}
                intro = str(p.get("visualPrompt") or p.get("prompt") or "") if isinstance(p, dict) else ""
                candidates.append({
                    "id": a.id,
                    "name": a.name or "",
                    "type": "scene",
                    "intro": intro,
                })

        scene_res = await detect_or_create_scene_with_llm(
            content=body.content,
            candidate_scenes=candidates,
        )

        matched_id = scene_res.get("matched_id")
        matched_name = scene_res.get("matched_name")
        new_scene = scene_res.get("new_scene")

        if matched_id:
            return DramaDetectAssetsResponse(
                detected_ids=[int(matched_id)],
                detected_names=[str(matched_name or "")],
                created_assets=[],
            )

        if isinstance(new_scene, dict) and new_scene.get("name") and body.project_id:
            norm_name = _normalize_asset_name(str(new_scene.get("name") or ""))
            if norm_name:
                matched_row = next(
                    (s for s in existing_scenes if _normalize_asset_name(s.name or "").lower() == norm_name.lower()),
                    None,
                )
                if matched_row:
                    return DramaDetectAssetsResponse(
                        detected_ids=[int(matched_row.id)],
                        detected_names=[str(matched_row.name or norm_name)],
                        created_assets=[],
                    )

                base_prompt = str(new_scene.get("prompt") or "").strip()
                if not base_prompt:
                    base_prompt = f"Bối cảnh {norm_name}, không gian bối cảnh phim điện ảnh chi tiết, chân thực, ánh sáng tự nhiên ấn tượng, góc quay rộng 16:9."
                if len(base_prompt) < 100:
                    base_prompt = f"{base_prompt}. Bối cảnh điện ảnh độ nét cao, bố cục không gian rõ ràng, chiều sâu điện ảnh, tỉ lệ khung hình 16:9, chất lượng 4K Ultra HD."
                prompt_text = base_prompt
                created_asset = DramaAsset(
                    project_id=body.project_id,
                    type="scene",
                    asset_type="image",
                    name=norm_name,
                    params=build_named_image_params(prompt_text, "16:9", kind="scene"),
                )
                db.add(created_asset)
                await db.commit()
                await db.refresh(created_asset)
                return DramaDetectAssetsResponse(
                    detected_ids=[int(created_asset.id)],
                    detected_names=[str(created_asset.name or norm_name)],
                    created_assets=[DramaAssetOut.model_validate(created_asset)],
                )

        return DramaDetectAssetsResponse(detected_ids=[], detected_names=[], created_assets=[])

    # Xử lý riêng cho đạo cụ: nếu chưa có trong kho thì tự động tạo mới, nếu đã có thì đối chiếu và dùng lại
    elif body.asset_type == "prop":
        existing_props: list[DramaAsset] = []
        if body.project_id:
            await get_owned_drama_project(db, body.project_id, user)
            stmt = select(DramaAsset).where(
                DramaAsset.project_id == body.project_id,
                DramaAsset.type == "prop",
            )
            existing_props = list((await db.execute(stmt)).scalars().all())

        candidates: list[dict[str, Any]] = []
        if body.candidate_assets:
            candidates = [c.model_dump() for c in body.candidate_assets if c.type == "prop"]
        if not candidates and existing_props:
            for a in existing_props:
                p = a.params or {}
                intro = str(p.get("intro") or p.get("visualPrompt") or p.get("prompt") or "") if isinstance(p, dict) else ""
                candidates.append({
                    "id": a.id,
                    "name": a.name or "",
                    "type": "prop",
                    "intro": intro,
                })

        prop_res = await detect_or_create_props_with_llm(
            content=body.content,
            candidate_props=candidates,
        )

        detected_ids: list[int] = []
        detected_names: list[str] = []
        created_assets: list[DramaAssetOut] = []

        # 1. Các đạo cụ đã có sẵn trong kho
        for mp in prop_res.get("matched_props", []):
            mid = int(mp.get("id") or 0)
            mname = str(mp.get("name") or "")
            if mid and mid not in detected_ids:
                detected_ids.append(mid)
                detected_names.append(mname)

        # 2. Các đạo cụ mới cần thêm vào kho
        new_props_to_create = prop_res.get("new_props", [])
        new_assets: list[DramaAsset] = []
        if new_props_to_create and body.project_id:
            for np in new_props_to_create:
                norm_name = _normalize_asset_name(str(np.get("name") or ""))
                if not norm_name:
                    continue

                # Đối chiếu lại với existing_props để tránh tạo trùng
                matched_row = next(
                    (s for s in existing_props if _normalize_asset_name(s.name or "").lower() == norm_name.lower()),
                    None,
                )
                if matched_row:
                    if matched_row.id not in detected_ids:
                        detected_ids.append(matched_row.id)
                        detected_names.append(str(matched_row.name or norm_name))
                    continue

                base_prompt = str(np.get("prompt") or "").strip()
                if not base_prompt:
                    base_prompt = f"Đạo cụ {norm_name}, vật phẩm điện ảnh chi tiết cao, chất liệu chân thực, chụp cận cảnh studio trên phông nền tối giản, ánh sáng nghệ thuật sắc nét, tỉ lệ 1:1."
                if len(base_prompt) < 80:
                    base_prompt = f"{base_prompt}. Thiết kế điện ảnh chi tiết cao, chất liệu tinh tế, ánh sáng studio sắc nét, tỉ lệ 1:1, chất lượng 4K Ultra HD."

                created_asset = DramaAsset(
                    project_id=body.project_id,
                    type="prop",
                    asset_type="image",
                    name=norm_name,
                    params=build_named_image_params(base_prompt, "1:1", kind="prop"),
                )
                db.add(created_asset)
                existing_props.append(created_asset)
                new_assets.append(created_asset)

            if new_assets:
                await db.commit()
                for na in new_assets:
                    await db.refresh(na)
                    if na.id not in detected_ids:
                        detected_ids.append(na.id)
                        detected_names.append(na.name or "")
                    created_assets.append(DramaAssetOut.model_validate(na))

        return DramaDetectAssetsResponse(
            detected_ids=detected_ids,
            detected_names=detected_names,
            created_assets=created_assets,
        )

    candidates: list[dict[str, Any]] = []
    if body.candidate_assets:
        candidates = [c.model_dump() for c in body.candidate_assets]
    elif body.project_id:
        await get_owned_drama_project(db, body.project_id, user)
        stmt = select(DramaAsset).where(DramaAsset.project_id == body.project_id)
        if body.asset_type and body.asset_type != "all":
            stmt = stmt.where(DramaAsset.type == body.asset_type)
        assets = list((await db.execute(stmt)).scalars().all())
        for a in assets:
            p = a.params or {}
            intro = ""
            aliases: list[str] = []
            if isinstance(p, dict):
                intro = str(p.get("intro") or p.get("visualPrompt") or p.get("prompt") or "")
                if p.get("alias"):
                    aliases.append(str(p.get("alias")))
                if isinstance(p.get("aliases"), list):
                    aliases.extend(str(x) for x in p.get("aliases"))
            candidates.append({
                "id": a.id,
                "name": a.name or "",
                "type": a.type,
                "intro": intro,
                "aliases": aliases,
            })

    result = await detect_assets_with_llm(
        content=body.content,
        candidate_assets=candidates,
        asset_type=body.asset_type,
    )
    return DramaDetectAssetsResponse(
        detected_ids=result.get("detected_ids", []),
        detected_names=result.get("detected_names", []),
        created_assets=[],
    )


@router.post("/assets/{asset_id}/upload-flow")
async def upload_asset_to_flow_endpoint(
    asset_id: int,
    body: UploadAssetFlowRequest | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Upload một hình ảnh tài sản lên Google Flow API (neuravibemmo.dpdns.org/api/flow/upload-image-b64)
    và lưu lại flow_media_id vào database.
    """
    from app.models_drama import DramaAsset, DramaProject
    from app.services.drama.flow_api import FLOW_PROJECT_ID, upload_image_to_flow

    result = await db.execute(
        select(DramaAsset, DramaProject)
        .join(DramaProject, DramaAsset.project_id == DramaProject.id)
        .where(DramaAsset.id == asset_id, DramaProject.user_id == user.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Tài sản không tồn tại")
    asset, project = row[0], row[1]

    img_ref = asset.cover or asset.url
    if not img_ref:
        raise HTTPException(status_code=400, detail="Tài sản chưa có hình ảnh để upload")

    user_flow_id = (body.flow_project_id.strip() if body and body.flow_project_id else None)
    target_flow_project_id = (
        user_flow_id
        or project.flow_project_id
        or (project.params or {}).get("flow_project_id")
        or FLOW_PROJECT_ID
    )

    media_id = await upload_image_to_flow(img_ref, project_id=target_flow_project_id)
    if not media_id:
        raise HTTPException(status_code=502, detail="Upload ảnh lên Google Flow thất bại. Vui lòng kiểm tra Flow API.")

    asset.flow_media_id = media_id
    cur_params = dict(asset.params or {})
    cur_params["flow_media_id"] = media_id
    asset.params = cur_params

    await db.commit()
    await db.refresh(asset)

    return {
        "ok": True,
        "asset_id": asset.id,
        "media_id": media_id,
        "flow_media_id": media_id,
        "flow_project_id": target_flow_project_id,
    }


