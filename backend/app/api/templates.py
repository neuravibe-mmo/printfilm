from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Template
from app.schemas import TemplateDetailOut, TemplateOut

router = APIRouter(prefix="/templates", tags=["templates"])


def _detect_locale(request: Request, explicit: str | None = None) -> str:
    if explicit and explicit.strip():
        loc = explicit.strip().lower()
        if "vi" in loc:
            return "vi"
        if "en" in loc:
            return "en"
        return "zh"
    al = (request.headers.get("x-locale") or request.headers.get("accept-language") or "").lower()
    if "vi" in al:
        return "vi"
    if "en" in al:
        return "en"
    return "zh"


def _localize_template(tpl: Template, locale: str) -> dict:
    data = {
        "id": tpl.id,
        "name": tpl.name,
        "name_en": tpl.name_en,
        "name_vi": tpl.name_vi,
        "description": tpl.description,
        "description_en": tpl.description_en,
        "description_vi": tpl.description_vi,
        "category": tpl.category or [],
        "category_en": tpl.category_en,
        "category_vi": tpl.category_vi,
        "preview_cover": tpl.preview_cover,
        "default_ratio": tpl.default_ratio,
        "shot_duration_min": tpl.shot_duration_min,
        "shot_duration_max": tpl.shot_duration_max,
        "is_premium": tpl.is_premium,
        "sort_order": tpl.sort_order,
        "style_prefix": tpl.style_prefix,
        "negative_prompt": tpl.negative_prompt,
        "llm_system_addon": tpl.llm_system_addon,
        "seedream_config": tpl.seedream_config or {},
        "seedance_config": tpl.seedance_config or {},
        "audio_config": tpl.audio_config or {},
        "subtitle_config": tpl.subtitle_config or {},
    }
    if locale == "vi":
        if tpl.name_vi:
            data["name"] = tpl.name_vi
        if tpl.description_vi:
            data["description"] = tpl.description_vi
        if tpl.category_vi:
            data["category"] = tpl.category_vi
    elif locale == "en":
        if tpl.name_en:
            data["name"] = tpl.name_en
        if tpl.description_en:
            data["description"] = tpl.description_en
        if tpl.category_en:
            data["category"] = tpl.category_en
    return data


@router.get("", response_model=list[TemplateDetailOut])
async def list_templates(
    request: Request,
    locale: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    loc = _detect_locale(request, locale)
    result = await db.execute(
        select(Template).where(Template.is_active.is_(True)).order_by(Template.sort_order)
    )
    return [_localize_template(t, loc) for t in result.scalars().all()]


@router.get("/{template_id}", response_model=TemplateDetailOut)
async def get_template(
    template_id: str,
    request: Request,
    locale: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    loc = _detect_locale(request, locale)
    tpl = await db.get(Template, template_id)
    if not tpl or not tpl.is_active:
        raise HTTPException(status_code=404, detail="模板不存在")
    return _localize_template(tpl, loc)
