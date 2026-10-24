from __future__ import annotations

import io
import re
import zipfile
from datetime import datetime
from pathlib import Path
import time

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Project, ProjectStatus, User, Work
from app.services import storage
from app.schemas import (
    PageMeta,
    ProjectCreate,
    ProjectDownloadRequest,
    ProjectListItem,
    ProjectListOut,
    ProjectListStats,
    ProjectOut,
    ProjectUpdate,
)

from .common import (
    _RUNNING_STATUSES,
    _demote_after_edit,
    _get_owned_project,
    _project_runtime_view,
    get_current_user,
    list_active_tasks_for_user_rows,
)

router = APIRouter()


@router.post("/projects", response_model=ProjectOut)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    from app.models import Template

    tpl = await db.get(Template, body.template_id)
    if not tpl or not tpl.is_active:
        raise HTTPException(status_code=400, detail="无效模板")
    project = Project(
        user_id=user.id,
        template_id=body.template_id,
        title=body.title,
        source_type=body.source_type,
        source_text=body.source_text,
        resolution_mode=body.resolution_mode,
        pipeline_mode=body.pipeline_mode,
        output_ratio=(body.output_ratio or "").strip(),
        voice_id=(body.voice_id or "").strip(),
        # Nếu trống, hãy đọc mẫu nền khi tạo; không sao chép khi tạo, để tránh việc thay đổi mẫu nền không ảnh hưởng đến các dự án hiện có
        style_prompt=(body.style_prompt or "").strip(),
        character_prompt=(body.character_prompt or "").strip(),
        extra_prompt=(body.extra_prompt or "").strip(),
        image_model=(body.image_model or "").strip(),
        video_model=(body.video_model or "").strip(),
        ref_image_url=body.ref_image_url,
        status=ProjectStatus.DRAFT,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    result = await db.execute(
        select(Project).where(Project.id == project.id).options(selectinload(Project.shots))
    )
    return result.scalar_one()


@router.get("/projects", response_model=ProjectListOut)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=50),
    status: str | None = Query(
        None,
        description="all|draft|running|done|published",
    ),
    q: str | None = Query(None, description="title search"),
    pipeline_mode: str | None = Query(
        None,
        description="full|image_text；空=全部类型",
    ),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProjectListOut:
    """Paginated project list with status / published / type filters."""
    published_exists = (
        select(Work.id)
        .where(Work.project_id == Project.id, Work.user_id == user.id)
        .correlate(Project)
        .exists()
    )

    base = select(Project).where(Project.user_id == user.id)
    count_base = select(func.count()).select_from(Project).where(Project.user_id == user.id)

    mode = (pipeline_mode or "").strip().lower()
    if mode in {"full", "image_text"}:
        base = base.where(Project.pipeline_mode == mode)
        count_base = count_base.where(Project.pipeline_mode == mode)

    keyword = (q or "").strip()
    if keyword:
        like = f"%{keyword}%"
        filt = or_(Project.title.ilike(like), Project.error_msg.ilike(like))
        base = base.where(filt)
        count_base = count_base.where(filt)

    tab = (status or "all").strip().lower()
    if tab == "draft":
        base = base.where(Project.status == ProjectStatus.DRAFT)
        count_base = count_base.where(Project.status == ProjectStatus.DRAFT)
    elif tab == "running":
        base = base.where(Project.status.in_(_RUNNING_STATUSES))
        count_base = count_base.where(Project.status.in_(_RUNNING_STATUSES))
    elif tab == "done":
        base = base.where(Project.status == ProjectStatus.DONE)
        count_base = count_base.where(Project.status == ProjectStatus.DONE)
    elif tab == "published":
        base = base.where(published_exists)
        count_base = count_base.where(published_exists)

    total = int((await db.execute(count_base)).scalar_one() or 0)
    rows = list(
        (
            await db.execute(
                base.order_by(Project.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        .scalars()
        .all()
    )

    published_ids: set[int] = set()
    if rows:
        pub_result = await db.execute(
            select(Work.project_id).where(
                Work.user_id == user.id,
                Work.project_id.in_([p.id for p in rows]),
            )
        )
        published_ids = {int(x) for x in pub_result.scalars().all()}
        active_tasks = await list_active_tasks_for_user_rows(db, user.id, [p.id for p in rows])
        for project in rows:
            project.active_tasks = active_tasks.get(int(project.id), [])

    items = [
        ProjectListItem(
            id=p.id,
            title=p.title,
            template_id=p.template_id,
            status=_project_runtime_view(p)[0],
            progress=_project_runtime_view(p)[1],
            cover_url=p.cover_url,
            final_video_url=p.final_video_url,
            error_msg=_project_runtime_view(p)[2],
            pipeline_mode=p.pipeline_mode or "full",
            output_ratio=p.output_ratio or "",
            published=p.id in published_ids,
            created_at=p.created_at,
            updated_at=p.updated_at,
            active_tasks=list(getattr(p, "active_tasks", []) or []),
        )
        for p in rows
    ]

    # Stats ignore status tab but keep type + search scope
    stats_filter = [Project.user_id == user.id]
    if mode in {"full", "image_text"}:
        stats_filter.append(Project.pipeline_mode == mode)
    if keyword:
        like = f"%{keyword}%"
        stats_filter.append(or_(Project.title.ilike(like), Project.error_msg.ilike(like)))

    async def _count(*extra):
        stmt = select(func.count()).select_from(Project).where(*stats_filter, *extra)
        return int((await db.execute(stmt)).scalar_one() or 0)

    stats_total = await _count()
    stats_generating = await _count(Project.status.in_(_RUNNING_STATUSES))
    stats_done = await _count(Project.status == ProjectStatus.DONE)
    pub_stmt = (
        select(func.count())
        .select_from(Work)
        .join(Project, Project.id == Work.project_id)
        .where(Work.user_id == user.id, *stats_filter)
    )
    stats_published = int((await db.execute(pub_stmt)).scalar_one() or 0)
    stats = ProjectListStats(
        total=stats_total,
        generating=stats_generating,
        done=stats_done,
        published=stats_published,
    )

    return ProjectListOut(
        items=items,
        meta=PageMeta(page=page, page_size=page_size, total=total),
        stats=stats,
    )


def _safe_zip_name(title: str, project_id: int) -> str:
    raw = (title or "未命名作品").strip() or "未命名作品"
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', "_", raw)
    cleaned = cleaned.strip(" .")[:60] or "未命名作品"
    return f"p{project_id}_{cleaned}.mp4"


@router.post("/projects/download-zip")
async def download_projects_zip(
    body: ProjectDownloadRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Zip final videos for selected owned projects (DONE with final_video_url)."""
    ids = list(dict.fromkeys(int(i) for i in body.ids if int(i) > 0))
    if not ids:
        raise HTTPException(status_code=400, detail="请选择要下载的作品")
    if len(ids) > 50:
        raise HTTPException(status_code=400, detail="一次最多打包 50 个")

    result = await db.execute(
        select(Project).where(Project.user_id == user.id, Project.id.in_(ids))
    )
    projects = list(result.scalars().all())
    by_id = {p.id: p for p in projects}
    missing = [i for i in ids if i not in by_id]
    if missing:
        raise HTTPException(status_code=404, detail=f"项目不存在: {missing[:5]}")

    entries: list[tuple[str, bytes]] = []
    skipped: list[str] = []
    for pid in ids:
        p = by_id[pid]
        if p.status != ProjectStatus.DONE or not p.final_video_url:
            skipped.append(f"#{pid}")
            continue
        path = storage.local_path_from_url(p.final_video_url)
        try:
            if (not path or not path.exists()) and str(p.final_video_url).startswith("http"):
                dest = storage.project_dir(p.id) / "final.mp4"
                path = await storage.ensure_local_media(p.final_video_url, dest)
        except Exception:  # noqa: BLE001
            path = None
        if not path or not path.exists():
            skipped.append(f"#{pid}")
            continue
        entries.append((_safe_zip_name(p.title, p.id), path.read_bytes()))

    if not entries:
        raise HTTPException(
            status_code=400,
            detail="所选作品暂无成片可下载（需状态为已完成）",
        )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        used: set[str] = set()
        for name, data in entries:
            final_name = name
            n = 1
            while final_name in used:
                stem = name.rsplit(".", 1)[0]
                final_name = f"{stem}_{n}.mp4"
                n += 1
            used.add(final_name)
            zf.writestr(final_name, data)
        if skipped:
            zf.writestr(
                "skipped.txt",
                "以下项目未打包（未完成或缺少成片文件）：\n" + "\n".join(skipped),
            )
    buf.seek(0)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"framecut_videos_{stamp}.zip"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(buf, media_type="application/zip", headers=headers)


@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    return await _get_owned_project(db, project_id, user)


@router.patch("/projects/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="Dự án đang trong quá trình tạo, không thể chỉnh sửa")

    data = body.model_dump(exclude_unset=True)
    if "template_id" in data:
        from app.models import Template

        tpl = await db.get(Template, data["template_id"])
        if not tpl or not tpl.is_active:
            raise HTTPException(status_code=400, detail="无效模板")
        # Xóa phạm vi dự án sau khi thay đổi mẫu và thế hệ tiếp theo sẽ tuân theo mẫu nền; nếu yêu cầu rõ ràng có chứa các từ nhắc nhở thì yêu cầu đó sẽ được giữ lại.
        if "style_prompt" not in data:
            data["style_prompt"] = ""
        if "character_prompt" not in data:
            data["character_prompt"] = ""
        if "extra_prompt" not in data:
            data["extra_prompt"] = ""
    if "cover_url" in data and data["cover_url"]:
        url = str(data["cover_url"]).strip()
        if not (url.startswith("/static/") or url.startswith("http://") or url.startswith("https://")):
            raise HTTPException(status_code=400, detail="无效封面地址")
    for key in ("style_prompt", "character_prompt", "extra_prompt", "product_prompt", "scene_prompt", "image_model", "video_model"):
        if key in data:
            data[key] = str(data[key] or "").strip()
    if "image_model" in data and data["image_model"]:
        from app.services.media_catalog import is_valid_project_media_model

        if not is_valid_project_media_model(data["image_model"], "image"):
            raise HTTPException(status_code=400, detail="无效图片模型")
    if "video_model" in data and data["video_model"]:
        from app.services.media_catalog import is_valid_project_media_model

        if not is_valid_project_media_model(data["video_model"], "video"):
            raise HTTPException(status_code=400, detail="无效视频模型")
    if "bgm_lock" in data:
        data["bgm_lock"] = str(data["bgm_lock"] or "").strip()
    if "subtitle_preset" in data:
        data["subtitle_preset"] = str(data["subtitle_preset"] or "").strip()
    if "bgm_lock" in data or "subtitle_preset" in data:
        _demote_after_edit(project)
    for k, v in data.items():
        setattr(project, k, v)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/cover", response_model=ProjectOut)
async def upload_project_cover(
    project_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Upload a custom cover image for the project."""
    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="Dự án đang trong quá trình tạo, không thể thay đổi ảnh bìa")

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
        # Fallback from filename
        suffix = Path(file.filename or "").suffix.lower()
        if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            ext = ".jpg" if suffix == ".jpeg" else suffix
        else:
            raise HTTPException(status_code=400, detail="仅支持 JPG / PNG / WebP / GIF")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="空文件")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="封面不能超过 8MB")

    stamp = int(time.time() * 1000)
    p_dir = storage.project_dir(project_id)
    for old_c in p_dir.glob("cover*"):
        try:
            if old_c.is_file():
                old_c.unlink()
        except Exception:
            pass

    dest = p_dir / f"cover_{stamp}{ext}"
    dest.write_bytes(raw)
    project.cover_url = storage.publish_local(dest)
    await db.commit()
    return await _get_owned_project(db, project_id, user)
