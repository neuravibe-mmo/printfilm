"""Drama project CRUD."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import UsageEvent, User
from app.models_drama import DramaAsset, DramaEpisode, DramaEpisodeFragment, DramaProject, DramaScript
from app.models_tasks import TaskRun
from app.schemas_drama import (
    DramaProjectCreate,
    DramaProjectListItem,
    DramaProjectOut,
    DramaProjectUpdate,
    DramaProjectUsageStats,
    DramaScriptOut,
)
from app.services.drama.access import get_owned_drama_project
from app.services.drama.generation import project_link_last_frame_enabled
from app.services.drama.project_cover import resolve_drama_project_cover
from app.services.drama.usage_stats import (
    aggregate_drama_usage_by_project_ids,
    empty_usage_stats,
    get_drama_project_usage,
)
from app.services.drama.workflow import build_project_params, resolve_drama_workflow
from app.services.tasks.service import cancel_tasks_for_scope, rebalance_project_fragment_video_queue

router = APIRouter()


def _project_out(project: DramaProject, usage: DramaProjectUsageStats | None = None) -> DramaProjectOut:
    # Phản hồi chi tiết về dự án lắp ráp, với số liệu thống kê sử dụng
    script = None
    if project.script:
        script = DramaScriptOut.model_validate(project.script)
    return DramaProjectOut(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        description=project.description,
        content=project.content,
        params=project.params,
        created_at=project.created_at,
        updated_at=project.updated_at,
        script=script,
        asset_count=len(project.assets) if project.assets is not None else 0,
        episode_count=len(project.episodes) if project.episodes is not None else 0,
        workflow=resolve_drama_workflow(project),
        usage=usage or empty_usage_stats(),
    )


@router.get("/projects", response_model=list[DramaProjectListItem])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DramaProjectListItem]:
    # List current user's drama projects
    result = await db.execute(
        select(DramaProject)
        .where(DramaProject.user_id == user.id)
        .options(
            selectinload(DramaProject.script),
            selectinload(DramaProject.assets),
            selectinload(DramaProject.episodes).selectinload(DramaEpisode.fragments),
        )
        .order_by(DramaProject.updated_at.desc())
    )
    rows = list(result.scalars().all())
    usage_map = await aggregate_drama_usage_by_project_ids(
        db, user_id=user.id, project_ids=[p.id for p in rows]
    )
    items: list[DramaProjectListItem] = []
    for p in rows:
        cover_url, cover_pending = resolve_drama_project_cover(p)
        items.append(
            DramaProjectListItem(
                id=p.id,
                title=p.title,
                description=p.description,
                created_at=p.created_at,
                updated_at=p.updated_at,
                episode_count=len(p.episodes or []),
                asset_count=len(p.assets or []),
                has_script=p.script is not None,
                cover_url=cover_url,
                cover_pending=cover_pending and not cover_url,
                workflow=resolve_drama_workflow(p),
                usage=usage_map.get(p.id) or empty_usage_stats(),
            )
        )
    return items


@router.post("/projects", response_model=DramaProjectOut)
async def create_project(
    body: DramaProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaProjectOut:
    # Create project + empty script draft from creative source
    source = (body.source or "").strip()
    if len(source) < 20:
        raise HTTPException(status_code=400, detail="原始创意至少需要 20 个字")
    title = (body.title or "").strip()
    if not title:
        title = source[:40] + ("…" if len(source) > 40 else "")
    workflow = (body.workflow or "script").strip().lower()
    if workflow not in ("script", "canvas"):
        workflow = "script"
    project_params = build_project_params(
        workflow=workflow,
        episode_count=body.episode_count,
        image_style_id=body.image_style_id,
        extra=body.params,
    )
    project = DramaProject(
        user_id=user.id,
        title=title or ("自由画布项目" if workflow == "canvas" else "未命名漫剧"),
        description=body.description,
        params=project_params,
    )
    db.add(project)
    await db.flush()
    script = DramaScript(
        project_id=project.id,
        name=project.title,
        source=source,
        params={
            "episode_count": project_params.get("episode_count") or body.episode_count,
            "image_style_id": body.image_style_id,
            "summary_status": "skipped" if workflow == "canvas" else "pending",
            "episode_content_status": "skipped" if workflow == "canvas" else "pending",
            "workflow": workflow,
        },
    )
    db.add(script)
    await db.commit()
    project = await get_owned_drama_project(
        db, project.id, user, with_script=True, with_assets=True, with_episodes=True
    )
    return _project_out(project)


@router.get("/projects/{project_id}", response_model=DramaProjectOut)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaProjectOut:
    project = await get_owned_drama_project(
        db, project_id, user, with_script=True, with_assets=True, with_episodes=True
    )
    usage = await get_drama_project_usage(db, user_id=user.id, project_id=project.id)
    return _project_out(project, usage)


@router.patch("/projects/{project_id}", response_model=DramaProjectOut)
async def update_project(
    project_id: int,
    body: DramaProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DramaProjectOut:
    project = await get_owned_drama_project(db, project_id, user, with_script=True)
    prev_link = project_link_last_frame_enabled(project)
    if body.title is not None:
        project.title = body.title.strip() or project.title
    if body.description is not None:
        project.description = body.description
    if body.content is not None:
        project.content = body.content
    if body.params is not None:
        project.params = body.params
    if body.flow_project_id is not None:
        # Đồng bộ cả cột riêng lẫn params JSON
        project.flow_project_id = body.flow_project_id or None
        cur_params: dict = dict(project.params or {})
        if body.flow_project_id:
            cur_params["flow_project_id"] = body.flow_project_id
        else:
            cur_params.pop("flow_project_id", None)
        project.params = cur_params
    elif body.params is not None:
        # Nếu params có chứa flow_project_id thì đồng bộ ngược lại vào cột
        fid = (project.params or {}).get("flow_project_id")
        if fid:
            project.flow_project_id = str(fid)

    # Khi người dùng thay đổi ngôn ngữ video (video_language: 'vi' hoặc 'auto'),
    # sửa trực tiếp các dòng thoại trong tất cả các phân cảnh (fragments) của dự án.
    if body.params is not None and "video_language" in body.params:
        target_lang = str(body.params.get("video_language") or "").strip().lower()
        from app.services.drama.build_fragments import (
            apply_vietnamese_voice_language,
            remove_vietnamese_voice_language,
        )
        ep_stmt = select(DramaEpisode.id).where(DramaEpisode.project_id == project_id)
        ep_ids = (await db.execute(ep_stmt)).scalars().all()
        if ep_ids:
            frags_stmt = select(DramaEpisodeFragment).where(
                DramaEpisodeFragment.episode_id.in_(ep_ids)
            )
            frags = (await db.execute(frags_stmt)).scalars().all()
            for frag in frags:
                if frag.content:
                    if target_lang == "vi":
                        frag.content = apply_vietnamese_voice_language(frag.content)
                    else:
                        frag.content = remove_vietnamese_voice_language(frag.content)

    await db.commit()

    # Khi công tắc kết nối giữa các máy nhân bản thay đổi, các tác vụ video trong bảng phân cảnh vẫn đang xếp hàng sẽ được sắp xếp lại một cách linh hoạt.
    next_link = project_link_last_frame_enabled(project)
    if body.params is not None and prev_link != next_link:
        await rebalance_project_fragment_video_queue(
            db,
            project_id,
            sequential=next_link,
            user_id=user.id,
        )

    project = await get_owned_drama_project(
        db, project_id, user, with_script=True, with_assets=True, with_episodes=True
    )
    usage = await get_drama_project_usage(db, user_id=user.id, project_id=project.id)
    return _project_out(project, usage)


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Xóa dự án truyện tranh; trước tiên hãy hủy liên kết nhiệm vụ/khóa ngoại hóa đơn để tránh FK chặn CASCADE."""
    project = await get_owned_drama_project(db, project_id, user)
    await cancel_tasks_for_scope(db, user.id, drama_project_id=project_id)

    # Giữ lịch sử tác vụ và sử dụng, chỉ xóa các khóa ngoại trỏ đến dự án này và các bảng phụ
    await db.execute(
        update(UsageEvent)
        .where(UsageEvent.drama_project_id == project_id)
        .values(drama_project_id=None)
    )
    await db.execute(
        update(TaskRun)
        .where(TaskRun.drama_project_id == project_id)
        .values(
            drama_project_id=None,
            script_id=None,
            episode_id=None,
            fragment_id=None,
            asset_id=None,
        )
    )
    # Dòng dưới cùng: các nhiệm vụ trong đó drama_project_id trống nhưng vẫn được treo trên bảng phụ
    ep_ids = select(DramaEpisode.id).where(DramaEpisode.project_id == project_id)
    asset_ids = select(DramaAsset.id).where(DramaAsset.project_id == project_id)
    script_ids = select(DramaScript.id).where(DramaScript.project_id == project_id)
    await db.execute(
        update(TaskRun).where(TaskRun.episode_id.in_(ep_ids)).values(episode_id=None, fragment_id=None)
    )
    await db.execute(update(TaskRun).where(TaskRun.asset_id.in_(asset_ids)).values(asset_id=None))
    await db.execute(update(TaskRun).where(TaskRun.script_id.in_(script_ids)).values(script_id=None))

    await db.delete(project)
    await db.commit()
    return {"ok": True}


@router.post("/projects/{project_id}/generate-cover")
async def generate_project_cover(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Tạo ảnh bìa riêng cho dự án phim ngắn bằng AI dựa trên tên phim và cốt truyện."""
    project = await get_owned_drama_project(db, project_id, user, with_script=True)
    summary = (project.script.params or {}).get("summary") if project.script else {}
    if not isinstance(summary, dict):
        summary = {}
    creative = (project.script.source if project.script else "") or project.title or ""
    hook = summary.get("coreHook") or summary.get("oneLineStory") or creative[:200]
    style_id = (project.params or {}).get("image_style_id")

    prompt = (
        f"Cinematic movie poster for drama series '{project.title}'. "
        f"Key premise: {hook}. "
        f"Epic composition, dramatic lighting, high quality cinematic visual art, masterpiece, 8k resolution."
    )
    if style_id:
        prompt += f", in {style_id} aesthetic style"

    from app.services.drama.chatgpt_image_api import generate_chatgpt_image

    try:
        cover_url = await generate_chatgpt_image(
            prompt=prompt,
            aspect_ratio="16:9",
            project_id=project.id,
            model="gpt-image-2",
        )
    except Exception as e:
        logger.error("Lỗi tạo ảnh bìa riêng cho dự án %s: %s", project_id, e)
        raise HTTPException(status_code=500, detail=f"Lỗi tạo ảnh bìa: {str(e)}")

    from sqlalchemy.orm.attributes import flag_modified

    params = dict(project.params or {})
    params["cover_url"] = cover_url
    project.params = params
    flag_modified(project, "params")
    await db.commit()

    return {"cover_url": cover_url, "project_id": project.id}

