"""Seed drama assets / episodes from script."""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models_drama import (
    DramaAsset,
    DramaAssetEpisode,
    DramaEpisode,
    DramaEpisodeFragment,
    DramaFragmentAssetRef,
    DramaProject,
)
from app.services.drama.build_fragments import (
    CAST_LINE_RE,
    build_fragments_from_episode_body,
    extract_introduced_names_from_content,
    is_raw_screenplay_fragment,
    parse_cast_names,
    split_episode_content_into_scenes,
)
from app.services.drama.access import detach_task_fragment_refs
from app.services.drama.agents import MIN_EPISODE_CONTENT_CHARS
from app.services.drama.extract_props_materials import extract_props_materials
from app.services.drama.seed_asset_params import (
    build_character_params,
    build_named_image_params,
    build_scene_params,
)

logger = logging.getLogger(__name__)

# PROMPT_REFRESH_CONCURRENCY dấu nhắc từ biểu đồ đồng thời Số LLM
PROMPT_REFRESH_CONCURRENCY = 3

# Loại thư viện nội dung (không bao gồm giọng nói, v.v.)
LIBRARY_ASSET_TYPES = frozenset({"character", "scene", "prop", "material", "none"})

# Tên giữ chỗ âm thanh thuần túy (không được tích hợp vào ký tự)
VOICE_ONLY_NAMES = frozenset({"音色", "声音", "语音", "旁白音色", "旁白声音", "voice"})

# Dấu âm sắc ở cuối tên: chẳng hạn như "Âm sắc Lý Bạch" "Lời kể khoa học hiện đại (giọng nói)"
VOICE_LIKE_NAME_RE = re.compile(
    r"(?:音色|的声音|语音)$|"
    r"[\(（]\s*(?:声音|音色|语音|旁白音色|voice)\s*[\)）]\s*$",
    re.IGNORECASE,
)


def _normalize_asset_name(name: str) -> str:
    """Thống nhất tên tài sản trống để tránh việc lưu trữ trùng lặp "Zhang San" và "Zhang San"."""
    return re.sub(r"\s+", " ", (name or "").strip())


def _is_voice_like_character_name(name: str) -> bool:
    """Xác định xem tên có phải là nhãn âm sắc/âm thanh hay không và không được sử dụng làm nội dung ký tự."""
    norm = _normalize_asset_name(name)
    if not norm:
        return False
    if norm.lower() in VOICE_ONLY_NAMES or norm in VOICE_ONLY_NAMES:
        return True
    return bool(VOICE_LIKE_NAME_RE.search(norm))


def _character_name_for_seed(name: str) -> str | None:
    """Chuẩn hóa tên ký tự có thể tạo thư viện; chiếm giữ âm sắc thuần túy trả về Không có, với hậu tố (giọng nói) / âm sắc trả về tên cơ sở."""
    norm = _normalize_asset_name(name)
    if not norm:
        return None
    if norm.lower() in {x.lower() for x in VOICE_ONLY_NAMES} or norm in VOICE_ONLY_NAMES:
        return None
    if VOICE_LIKE_NAME_RE.search(norm):
        base = _normalize_asset_name(VOICE_LIKE_NAME_RE.sub("", norm))
        if not base or base in VOICE_ONLY_NAMES:
            return None
        return base
    return norm


def _asset_dedupe_key(asset_type: str, name: str) -> tuple[str, str]:
    """(loại, tên chuẩn hóa) đóng vai trò là khóa chống trùng lặp; không có và vật liệu được coi là cùng loại."""
    kind = (asset_type or "").lower()
    if kind == "none":
        kind = "material"
    return (kind, _normalize_asset_name(name))


# Xếp hạng: Ưu tiên nội dung có bìa/URL và ràng buộc âm thanh; những người có cùng số điểm sẽ nhận được ID nhỏ hơn (được tạo trước đó)
def _duplicate_asset_keep_score(asset: DramaAsset) -> tuple[int, int, int]:
    has_media = 1 if ((asset.cover or "").strip() or (asset.url or "").strip()) else 0
    params = asset.params if isinstance(asset.params, dict) else {}
    has_voice = 0
    if isinstance(params.get("voiceAudio"), dict) and params["voiceAudio"]:
        has_voice = 1
    canvas = params.get("canvas") if isinstance(params.get("canvas"), dict) else {}
    if isinstance(canvas.get("voiceAudio"), dict) and canvas["voiceAudio"]:
        has_voice = 1
    return (has_media, has_voice, -int(asset.id or 0))


async def merge_duplicate_library_assets(db: AsyncSession, project_id: int) -> int:
    """Hợp nhất các tài sản thư viện cùng loại và cùng tên trong cùng một dự án: Thay đổi tham chiếu đến các mục dành riêng và xóa các hàng trùng lặp."""
    assets = list(
        (
            await db.execute(select(DramaAsset).where(DramaAsset.project_id == int(project_id)))
        )
        .scalars()
        .all()
    )
    groups: dict[tuple[str, str], list[DramaAsset]] = {}
    for asset in assets:
        kind = (asset.type or "").lower()
        if kind not in LIBRARY_ASSET_TYPES:
            continue
        name = _normalize_asset_name(asset.name or "")
        if not name:
            continue
        groups.setdefault(_asset_dedupe_key(kind, name), []).append(asset)

    removed = 0
    for group in groups.values():
        if len(group) < 2:
            continue
        ranked = sorted(group, key=_duplicate_asset_keep_score, reverse=True)
        keep = ranked[0]
        keep_id = int(keep.id)
        for dup in ranked[1:]:
            dup_id = int(dup.id)
            refs = list(
                (
                    await db.execute(
                        select(DramaFragmentAssetRef).where(
                            DramaFragmentAssetRef.asset_id == dup_id
                        )
                    )
                )
                .scalars()
                .all()
            )
            for ref in refs:
                exists = (
                    await db.execute(
                        select(DramaFragmentAssetRef.id).where(
                            DramaFragmentAssetRef.fragment_id == ref.fragment_id,
                            DramaFragmentAssetRef.asset_id == keep_id,
                        )
                    )
                ).scalar_one_or_none()
                if exists is not None:
                    await db.delete(ref)
                else:
                    ref.asset_id = keep_id
            links = list(
                (
                    await db.execute(
                        select(DramaAssetEpisode).where(DramaAssetEpisode.asset_id == dup_id)
                    )
                )
                .scalars()
                .all()
            )
            for link in links:
                exists = (
                    await db.execute(
                        select(DramaAssetEpisode.id).where(
                            DramaAssetEpisode.asset_id == keep_id,
                            DramaAssetEpisode.episode_id == link.episode_id,
                        )
                    )
                ).scalar_one_or_none()
                if exists is not None:
                    await db.delete(link)
                else:
                    link.asset_id = keep_id
            await db.delete(dup)
            removed += 1
            logger.info(
                "合并重复资产 keep_id=%s removed_id=%s type=%s name=%s",
                keep_id,
                dup_id,
                keep.type,
                keep.name,
            )
    if removed:
        await db.flush()
    return removed


async def _rebind_and_delete_asset(
    db: AsyncSession,
    *,
    remove: DramaAsset,
    keep_id: int | None,
) -> None:
    """Trước khi xóa nội dung, hãy thay đổi liên kết tập/tham chiếu bảng phân cảnh của nó thành keep_id (nếu có)."""
    remove_id = int(remove.id)
    refs = list(
        (
            await db.execute(
                select(DramaFragmentAssetRef).where(DramaFragmentAssetRef.asset_id == remove_id)
            )
        )
        .scalars()
        .all()
    )
    for ref in refs:
        if keep_id is None:
            await db.delete(ref)
            continue
        exists = (
            await db.execute(
                select(DramaFragmentAssetRef.id).where(
                    DramaFragmentAssetRef.fragment_id == ref.fragment_id,
                    DramaFragmentAssetRef.asset_id == keep_id,
                )
            )
        ).scalar_one_or_none()
        if exists is not None:
            await db.delete(ref)
        else:
            ref.asset_id = keep_id
    links = list(
        (
            await db.execute(select(DramaAssetEpisode).where(DramaAssetEpisode.asset_id == remove_id))
        )
        .scalars()
        .all()
    )
    for link in links:
        if keep_id is None:
            await db.delete(link)
            continue
        exists = (
            await db.execute(
                select(DramaAssetEpisode.id).where(
                    DramaAssetEpisode.asset_id == keep_id,
                    DramaAssetEpisode.episode_id == link.episode_id,
                )
            )
        ).scalar_one_or_none()
        if exists is not None:
            await db.delete(link)
        else:
            link.asset_id = keep_id
    await db.delete(remove)


async def purge_voice_like_character_assets(db: AsyncSession, project_id: int) -> int:
    """Làm sạch nội dung tên âm thanh bị tạo nhầm thành ký tự (chẳng hạn như "So-and-so (giọng nói)") và cố gắng hợp nhất các tham chiếu trở lại ký tự cơ sở có cùng tên."""
    assets = list(
        (
            await db.execute(select(DramaAsset).where(DramaAsset.project_id == int(project_id)))
        )
        .scalars()
        .all()
    )
    # base_character_ids tên ký tự chuẩn hóa → id nội dung (không phải tên âm thanh)
    base_character_ids: dict[str, int] = {}
    for asset in assets:
        if (asset.type or "").lower() != "character":
            continue
        name = _normalize_asset_name(asset.name or "")
        if not name or _is_voice_like_character_name(name):
            continue
        prev = base_character_ids.get(name)
        if prev is None or int(asset.id) < prev:
            base_character_ids[name] = int(asset.id)

    removed = 0
    for asset in assets:
        if (asset.type or "").lower() != "character":
            continue
        name = _normalize_asset_name(asset.name or "")
        if not _is_voice_like_character_name(name):
            continue
        # Sau khi xóa dấu âm đuôi, hãy thử và quay lại vai trò cơ bản
        base = VOICE_LIKE_NAME_RE.sub("", name).strip()
        base = _normalize_asset_name(base)
        keep_id = base_character_ids.get(base) if base else None
        if keep_id is not None and keep_id == int(asset.id):
            keep_id = None
        await _rebind_and_delete_asset(db, remove=asset, keep_id=keep_id)
        removed += 1
        logger.info(
            "清理音色名角色资产 removed_id=%s name=%s keep_id=%s",
            asset.id,
            name,
            keep_id,
        )
    if removed:
        await db.flush()
    return removed


@dataclass
class SeedAssetsResult:
    assets: list[DramaAsset]
    created_count: int = 0
    prompts_refreshed: int = 0
    props_updated: int = 0
    llm_calls_props: int = 0
    llm_errors: list[str] = field(default_factory=list)


@dataclass
class EpisodeBodySeedResult:
    """Hạt giống tăng văn bản một tập: sử dụng lại cùng tên, tạo sơ khai với tên mới (sẽ không có đạo cụ nào được rút ra)."""

    created: list[dict[str, str]] = field(default_factory=list)
    reused: list[dict[str, str]] = field(default_factory=list)

    @property
    def created_count(self) -> int:
        return len(self.created)

    @property
    def reused_count(self) -> int:
        return len(self.reused)


# Giữ trạng thái tạo và liên kết âm sắc khi làm mới thông số
def _merge_preserved_asset_params(old: dict[str, Any], fresh: dict[str, Any]) -> dict[str, Any]:
    merged = dict(fresh)
    for key in ("generation", "voiceAudio"):
        if key in old:
            merged[key] = old[key]
    old_canvas = old.get("canvas") if isinstance(old.get("canvas"), dict) else {}
    new_canvas = merged.get("canvas") if isinstance(merged.get("canvas"), dict) else {}
    canvas = dict(new_canvas)
    if isinstance(old_canvas, dict) and old_canvas.get("voiceAudio"):
        canvas["voiceAudio"] = old_canvas["voiceAudio"]
    merged["canvas"] = canvas
    return merged


# Viết các từ nhắc nhở do LLM/quy tắc tạo ra trở lại thông số nội dung
def _write_visual_prompt_to_asset(asset: DramaAsset, prompt: str) -> None:
    params = dict(asset.params or {})
    params["visualPrompt"] = prompt
    params["visualImage"] = prompt
    canvas = params.get("canvas")
    if isinstance(canvas, dict):
        canvas = dict(canvas)
        gen = canvas.get("generation")
        if isinstance(gen, dict):
            canvas["generation"] = {**dict(gen), "prompt": prompt}
        else:
            canvas["generation"] = {"prompt": prompt}
        params["canvas"] = canvas
    asset.params = params


async def refresh_asset_prompts_from_script(
    db: AsyncSession,
    project: DramaProject,
    assets: list[DramaAsset],
) -> tuple[int, list[str]]:
    """Tạo lời nhắc hình ảnh hoàn chỉnh cho nội dung hiện có theo tập lệnh mới nhất (không xóa bìa/video)."""
    from app.services.drama.visual_prompt import resolve_visual_prompt_for_asset

    targets = [
        a
        for a in assets
        if (a.type or "").lower() not in {"voice", "video", "audio", "text"}
    ]
    if not targets:
        return 0, []

    sem = asyncio.Semaphore(PROMPT_REFRESH_CONCURRENCY)
    updated = 0
    errors: list[str] = []

    async def _refresh_one(asset: DramaAsset) -> None:
        nonlocal updated
        async with sem:
            kind = (asset.type or "").lower()
            name = asset.name or "未命名"
            try:
                prompt = await resolve_visual_prompt_for_asset(
                    asset,
                    project,
                    None,
                    force_refresh=True,
                    strict_llm=True,
                )
            except Exception as exc:  # noqa: BLE001
                cause = exc.__cause__ or exc.__context__
                detail = f"{exc}" + (f" ← {cause}" if cause else "")
                errors.append(f"{kind}/{name}: {detail}")
                logger.warning("资产提示词 AI 刷新失败 asset_id=%s err=%s", asset.id, detail)
                return
            _write_visual_prompt_to_asset(asset, prompt)
            updated += 1

    await asyncio.gather(*[_refresh_one(a) for a in targets])
    if updated:
        await db.flush()
    return updated, errors


async def seed_assets_from_script(
    db: AsyncSession,
    project: DramaProject,
    *,
    refresh_prompts: bool = False,
    reextract_props: bool = False,
) -> SeedAssetsResult:
    # Create character/scene/prop/material assets from script if missing
    script = project.script
    if not script or not script.summary:
        raise ValueError("请先生成剧本摘要")

    summary = script.summary if isinstance(script.summary, dict) else {}
    story_type = str(summary.get("storyType") or "").strip()
    # Trước tiên, hãy hợp nhất các bản sao có cùng tên do hạt giống đồng thời lịch sử để lại và xóa các tên âm thanh bị nhập nhầm vào vai trò.
    merged = await merge_duplicate_library_assets(db, int(project.id))
    purged = await purge_voice_like_character_assets(db, int(project.id))
    if merged or purged:
        logger.info(
            "seed 前清理资产 project_id=%s merged=%s voice_like_purged=%s",
            project.id,
            merged,
            purged,
        )
    existing = list(
        (await db.execute(select(DramaAsset).where(DramaAsset.project_id == project.id)))
        .scalars()
        .all()
    )
    existing_by_key: dict[tuple[str, str], DramaAsset] = {}
    for asset in existing:
        name = _normalize_asset_name(asset.name or "")
        if not name:
            continue
        key = _asset_dedupe_key(asset.type or "", name)
        prev = existing_by_key.get(key)
        if prev is None or _duplicate_asset_keep_score(asset) > _duplicate_asset_keep_score(prev):
            existing_by_key[key] = asset

    project_params = dict(project.params or {}) if isinstance(project.params, dict) else {}
    has_prop = any((a.type or "") == "prop" for a in existing)
    props_seeded = bool(project_params.get("props_materials_seeded"))
    if reextract_props:
        props_seeded = False
        project_params["props_materials_seeded"] = False
        project.params = project_params

    created: list[DramaAsset] = []
    props_updated = 0
    llm_calls_props = 0
    llm_errors: list[str] = []
    logger.info(
        "seed_assets project_id=%s refresh_prompts=%s reextract_props=%s existing=%s",
        project.id,
        refresh_prompts,
        reextract_props,
        len(existing),
    )

    # làm mới: Trước tiên, hãy đồng bộ hóa các trường ký tự/cảnh tóm tắt với nội dung hiện có
    if refresh_prompts:
        for ch in summary.get("characters") or []:
            if not isinstance(ch, dict):
                continue
            name = str(ch.get("name") or "").strip()
            asset = existing_by_key.get(_asset_dedupe_key("character", name))
            if asset:
                asset.params = _merge_preserved_asset_params(
                    dict(asset.params or {}),
                    build_character_params(ch),
                )

    # Extract scene names from episode bodies
    bodies = _episode_bodies(script.episode_content)
    # summary_by_name Tóm tắt tiểu sử nhân vật, ưu tiên tạo nhân vật
    summary_by_name: dict[str, dict[str, Any]] = {}
    for ch in summary.get("characters") or []:
        if not isinstance(ch, dict):
            continue
        name = str(ch.get("name") or "").strip()
        if name:
            summary_by_name[name] = ch
    # cast_names Danh sách đầy đủ các "Nhân vật" trong tập (bỏ sót phần tóm tắt bổ sung)
    cast_names = _extract_cast_names_from_bodies(bodies)
    # character_names Tóm tắt + Các ký tự được hợp nhất để giữ nguyên trật tự (bỏ qua tên chú thích âm sắc/âm thanh)
    character_names: list[str] = []
    for name in list(summary_by_name.keys()) + cast_names:
        seed_name = _character_name_for_seed(name)
        if seed_name and seed_name not in character_names:
            character_names.append(seed_name)

    scene_names: list[str] = []
    for body in bodies:
        for m in re.finditer(
            r"^(?:日|夜|晨|黄昏|傍晚|凌晨|清晨|午|晚)?[ \t]*(?:内|外|内外)[ \t]+(.+)$",
            body,
            re.M,
        ):
            scene = m.group(1).strip().split("／")[0].split("/")[0].strip()
            if scene and scene not in scene_names:
                scene_names.append(scene)

    if refresh_prompts:
        for scene in scene_names:
            asset = existing_by_key.get(_asset_dedupe_key("scene", scene))
            if asset:
                asset.params = _merge_preserved_asset_params(
                    dict(asset.params or {}),
                    build_scene_params(scene, story_type),
                )

    for name in character_names:
        norm = _character_name_for_seed(name)
        if not norm:
            continue
        char_key = _asset_dedupe_key("character", norm)
        if char_key in existing_by_key:
            continue
        ch = summary_by_name.get(name) or summary_by_name.get(norm) or _character_stub_from_cast(
            norm, story_type, summary=summary, bodies=bodies,
        )
        asset = DramaAsset(
            project_id=project.id,
            type="character",
            asset_type="image",
            name=norm,
            params=build_character_params(ch),
        )
        db.add(asset)
        created.append(asset)
        existing_by_key[char_key] = asset

    for scene in scene_names[:40]:
        norm = _normalize_asset_name(scene)
        if not norm:
            continue
        scene_key = _asset_dedupe_key("scene", norm)
        if scene_key in existing_by_key:
            continue
        asset = DramaAsset(
            project_id=project.id,
            type="scene",
            asset_type="image",
            name=norm,
            params=build_scene_params(norm, story_type),
        )
        db.add(asset)
        created.append(asset)
        existing_by_key[scene_key] = asset

    # Props: Chưa có props nào, hoặc LLM được gọi khi buộc phải vẽ lại (tài liệu đã bị vô hiệu hóa và sẽ không được tạo nữa)
    need_props = not has_prop
    should_extract_props = not props_seeded and (need_props or reextract_props)
    if should_extract_props:
        llm_calls_props = 1
        try:
            extracted = await extract_props_materials(summary=summary, episode_bodies=bodies)
        except Exception:
            if reextract_props:
                raise
            logger.exception("道具 LLM 抽取失败 project_id=%s", project.id)
            extracted = {"props": [], "materials": []}
        if need_props or reextract_props:
            for item in extracted.get("props") or []:
                name = _normalize_asset_name(str(item.get("name") or ""))
                visual = str(item.get("visualPrompt") or "").strip()
                if not name:
                    continue
                prop_key = _asset_dedupe_key("prop", name)
                existing_asset = existing_by_key.get(prop_key)
                if existing_asset and reextract_props and visual:
                    existing_asset.params = _merge_preserved_asset_params(
                        dict(existing_asset.params or {}),
                        build_named_image_params(visual, "1:1", kind="prop"),
                    )
                    props_updated += 1
                    continue
                if prop_key in existing_by_key:
                    continue
                asset = DramaAsset(
                    project_id=project.id,
                    type="prop",
                    asset_type="image",
                    name=name,
                    params=build_named_image_params(visual, "1:1", kind="prop"),
                )
                db.add(asset)
                created.append(asset)
                existing_by_key[prop_key] = asset
        project_params["props_materials_seeded"] = True
        project.params = project_params

    if refresh_prompts or created or reextract_props:
        await db.flush()

    prompts_refreshed = 0
    if refresh_prompts:
        all_assets = list(
            (
                await db.execute(
                    select(DramaAsset)
                    .where(DramaAsset.project_id == project.id)
                    .order_by(DramaAsset.id.asc())
                )
            ).scalars().all()
        )
        prompts_refreshed, refresh_errors = await refresh_asset_prompts_from_script(
            db, project, all_assets
        )
        llm_errors.extend(refresh_errors)

    await db.commit()
    result = await db.execute(
        select(DramaAsset).where(DramaAsset.project_id == project.id).order_by(DramaAsset.id.asc())
    )
    return SeedAssetsResult(
        assets=list(result.scalars().all()),
        created_count=len(created),
        prompts_refreshed=prompts_refreshed,
        props_updated=props_updated,
        llm_calls_props=llm_calls_props,
        llm_errors=llm_errors,
    )


def _extract_scene_names_from_bodies(bodies: list[str]) -> list[str]:
    """Trích xuất tên cảnh từ các dòng cảnh bên trong và bên ngoài thời gian bắt đầu cảnh (loại bỏ trùng lặp và giữ nguyên trật tự)."""
    scene_names: list[str] = []
    for body in bodies:
        for m in re.finditer(
            r"^(?:日|夜|晨|黄昏|傍晚|凌晨|清晨|午|晚)?[ \t]*(?:内|外|内外)[ \t]+(.+)$",
            body,
            re.M,
        ):
            scene = m.group(1).strip().split("／")[0].split("/")[0].strip()
            if scene and scene not in scene_names:
                scene_names.append(scene)
    return scene_names


def collect_episode_seed_names(
    summary: dict[str, Any],
    body: str,
) -> tuple[list[str], list[str], dict[str, dict[str, Any]]]:
    """Hãy thu thập hạt giống của tập này bằng cách sử dụng tên nhân vật/tên cảnh và chỉ mục tiểu sử tóm tắt của nhân vật."""
    summary_by_name: dict[str, dict[str, Any]] = {}
    for ch in summary.get("characters") or []:
        if not isinstance(ch, dict):
            continue
        name = str(ch.get("name") or "").strip()
        if name:
            summary_by_name[name] = ch

    cast_names = _extract_cast_names_from_bodies([body or ""])
    character_names: list[str] = []
    for name in list(summary_by_name.keys()) + cast_names:
        seed_name = _character_name_for_seed(name)
        if seed_name and seed_name not in character_names:
            character_names.append(seed_name)

    scene_names = _extract_scene_names_from_bodies([body or ""])[:40]
    return character_names, scene_names, summary_by_name


def classify_episode_seed_ops(
    existing_keys: set[tuple[str, str]],
    character_names: list[str],
    scene_names: list[str],
) -> EpisodeBodySeedResult:
    """Chức năng thuần túy: Tạo/tái sử dụng theo tên tiêu chuẩn (đối với thử nghiệm đơn lẻ)."""
    result = EpisodeBodySeedResult()
    seen: set[tuple[str, str]] = set(existing_keys)
    for name in character_names:
        norm = _character_name_for_seed(name)
        if not norm:
            continue
        key = _asset_dedupe_key("character", norm)
        entry = {"type": "character", "name": norm}
        if key in seen:
            result.reused.append(entry)
        else:
            result.created.append(entry)
            seen.add(key)
    for scene in scene_names:
        norm = _normalize_asset_name(scene)
        if not norm:
            continue
        key = _asset_dedupe_key("scene", norm)
        entry = {"type": "scene", "name": norm}
        if key in seen:
            result.reused.append(entry)
        else:
            result.created.append(entry)
            seen.add(key)
    return result


async def seed_assets_from_episode_body(
    db: AsyncSession,
    project: DramaProject,
    episode_number: int,
) -> EpisodeBodySeedResult:
    """Hạt giống tăng dần sau khi tạo văn bản: chỉ quét các nhân vật/cảnh trong tập + nhân vật tóm tắt của toàn bộ phim; sẽ không có đạo cụ nào được rút ra."""
    script = project.script
    if not script or not script.summary:
        raise ValueError("请先生成剧本摘要")

    summary = script.summary if isinstance(script.summary, dict) else {}
    story_type = str(summary.get("storyType") or "").strip()
    bodies_list = _normalize_episode_list(script.episode_content)
    target = next(
        (
            item
            for item in bodies_list
            if isinstance(item, dict) and int(item.get("episodeNumber") or 0) == int(episode_number)
        ),
        None,
    )
    body = str((target or {}).get("body") or (target or {}).get("content") or "").strip()
    if len(body) < 40:
        return EpisodeBodySeedResult()

    character_names, scene_names, summary_by_name = collect_episode_seed_names(summary, body)
    existing = list(
        (await db.execute(select(DramaAsset).where(DramaAsset.project_id == project.id)))
        .scalars()
        .all()
    )
    existing_by_key: dict[tuple[str, str], DramaAsset] = {}
    for asset in existing:
        name = _normalize_asset_name(asset.name or "")
        if not name:
            continue
        key = _asset_dedupe_key(asset.type or "", name)
        prev = existing_by_key.get(key)
        if prev is None or _duplicate_asset_keep_score(asset) > _duplicate_asset_keep_score(prev):
            existing_by_key[key] = asset

    from app.services.drama.build_fragments import _find_asset_by_name

    result = EpisodeBodySeedResult()
    bodies_for_stub = [body]

    for name in character_names:
        norm = _character_name_for_seed(name)
        if not norm:
            continue
        char_key = _asset_dedupe_key("character", norm)
        hit = existing_by_key.get(char_key)
        if hit is None:
            # Mềm bao gồm kết hợp: tránh việc tạo cơ sở dữ liệu lặp lại bởi "Xiao Ming" và "Bạn cùng lớp của Xiao Ming"
            soft = _find_asset_by_name(
                [a for a in existing_by_key.values() if (a.type or "") == "character"],
                norm,
            )
            if soft is not None:
                hit = soft
        if hit is not None:
            result.reused.append({"type": "character", "name": norm})
            continue
        ch = summary_by_name.get(name) or summary_by_name.get(norm) or _character_stub_from_cast(
            norm, story_type, summary=summary, bodies=bodies_for_stub,
        )
        asset = DramaAsset(
            project_id=project.id,
            type="character",
            asset_type="image",
            name=norm,
            params=build_character_params(ch),
        )
        db.add(asset)
        existing_by_key[char_key] = asset
        result.created.append({"type": "character", "name": norm})

    for scene in scene_names:
        norm = _normalize_asset_name(scene)
        if not norm:
            continue
        scene_key = _asset_dedupe_key("scene", norm)
        hit = existing_by_key.get(scene_key)
        if hit is None:
            soft = _find_asset_by_name(
                [a for a in existing_by_key.values() if (a.type or "") == "scene"],
                norm,
            )
            if soft is not None:
                hit = soft
        if hit is not None:
            result.reused.append({"type": "scene", "name": norm})
            continue
        asset = DramaAsset(
            project_id=project.id,
            type="scene",
            asset_type="image",
            name=norm,
            params=build_scene_params(norm, story_type),
        )
        db.add(asset)
        existing_by_key[scene_key] = asset
        result.created.append({"type": "scene", "name": norm})

    if result.created:
        await db.flush()
    logger.info(
        "episode body seed project_id=%s ep=%s created=%s reused=%s",
        project.id,
        episode_number,
        result.created_count,
        result.reused_count,
    )
    return result


async def seed_episodes_from_script(
    db: AsyncSession,
    project: DramaProject,
    *,
    force: bool = False,
) -> list[DramaEpisode]:
    # Tạo / Chia lại bảng phân cảnh: chia thành ### cảnh và tạo bản sao bảng phân cảnh video
    script = project.script
    if not script:
        raise ValueError("缺少剧本")
    bodies = _normalize_episode_list(script.episode_content)
    if not bodies:
        raise ValueError("请先生成分集剧本")

    assets = list(
        (
            await db.execute(select(DramaAsset).where(DramaAsset.project_id == project.id))
        ).scalars().all()
    )
    summary = script.summary if isinstance(script.summary, dict) else None

    existing = list(
        (
            await db.execute(
                select(DramaEpisode)
                .where(DramaEpisode.project_id == project.id)
                .options(
                    selectinload(DramaEpisode.fragments).selectinload(
                        DramaEpisodeFragment.asset_references
                    )
                )
                .order_by(DramaEpisode.id.asc())
            )
        ).scalars().all()
    )

    # Dù có cắt lại hay không thì trước tiên hãy hợp nhất các hàng trùng lặp có cùng số tập để tránh hai "Tập 1" xuất hiện ở thanh bên.
    merged = await merge_duplicate_episodes_by_number(db, int(project.id))
    if merged:
        await db.commit()
        existing = await _reload_episodes(db, project.id)

    should_rebuild = force or _should_auto_replan(existing, bodies)
    if existing and not should_rebuild:
        return existing

    bodies = _dedupe_episode_body_items(bodies)
    body_by_number = {
        int(item.get("episodeNumber") or 0): item
        for item in bodies
        if isinstance(item, dict) and int(item.get("episodeNumber") or 0) >= 1
    }

    if not existing:
        created: list[DramaEpisode] = []
        # series_introduced Bộ truyện này đã giới thiệu các nhân vật (tích lũy theo số tập)
        series_introduced: set[str] = set()
        for item in bodies:
            ep_no = int(item.get("episodeNumber") or len(created) + 1)
            title = str(item.get("title") or f"第{ep_no}集")
            body = str(item.get("body") or item.get("content") or "")
            episode = DramaEpisode(
                project_id=project.id,
                name=title,
                params={"episodeNumber": ep_no},
            )
            db.add(episode)
            await db.flush()
            planned = await _replace_episode_fragments(
                db,
                episode,
                body,
                assets,
                already_introduced=series_introduced,
                summary=summary,
            )
            for frag in planned:
                series_introduced.update(
                    extract_introduced_names_from_content(str(frag.get("content") or ""))
                )
            created.append(episode)
        await db.commit()
        return await _reload_episodes(db, project.id)

    # Các tập hiện có: Đồng bộ hóa tên và bảng phân cảnh theo số tập (video/bảng phân cảnh do người dùng tạo do người dùng chỉnh sửa được giữ lại theo mặc định, trừ khi sử dụng vũ lực)
    # series_introduced Các nhân vật tích lũy được giới thiệu trong bộ phim này theo số tập
    series_introduced: set[str] = set()
    ordered_existing = sorted(
        existing,
        key=lambda ep: (
            int((ep.params or {}).get("episodeNumber") or 0) if isinstance(ep.params, dict) else 0,
            int(ep.id or 0),
        ),
    )
    for episode in ordered_existing:
        params = episode.params if isinstance(episode.params, dict) else {}
        ep_no = int(params.get("episodeNumber") or 0)
        item = body_by_number.get(ep_no)
        if item is None:
            for frag in episode.fragments or []:
                series_introduced.update(extract_introduced_names_from_content(frag.content or ""))
            continue
        title = str(item.get("title") or episode.name)
        body = str(item.get("body") or item.get("content") or "")
        episode.name = title
        if force or _episode_should_replace_fragments(episode, body):
            planned = await _replace_episode_fragments(
                db,
                episode,
                body,
                assets,
                already_introduced=series_introduced,
                summary=summary,
                preserve_protected=not force,
            )
            for frag in planned:
                series_introduced.update(
                    extract_introduced_names_from_content(str(frag.get("content") or ""))
                )
        else:
            for frag in episode.fragments or []:
                series_introduced.update(extract_introduced_names_from_content(frag.content or ""))

    # Bổ sung các tập có trong kịch bản nhưng chưa có trong thư viện
    existing_numbers = {
        int((ep.params or {}).get("episodeNumber") or 0)
        for ep in existing
        if isinstance(ep.params, dict)
    }
    for ep_no, item in sorted(body_by_number.items()):
        if ep_no in existing_numbers:
            continue
        title = str(item.get("title") or f"第{ep_no}集")
        body = str(item.get("body") or item.get("content") or "")
        episode = DramaEpisode(
            project_id=project.id,
            name=title,
            params={"episodeNumber": ep_no},
        )
        db.add(episode)
        await db.flush()
        planned = await _replace_episode_fragments(
            db,
            episode,
            body,
            assets,
            already_introduced=series_introduced,
            summary=summary,
        )
        for frag in planned:
            series_introduced.update(
                extract_introduced_names_from_content(str(frag.get("content") or ""))
            )
    await db.commit()
    return await _reload_episodes(db, project.id)


def require_confirmable_episode_body(
    episode_content: Any,
    episode_number: int,
) -> dict[str, Any]:
    """Lấy văn bản của bộ được chỉ định; nếu thiếu hoặc quá ngắn sẽ báo lỗi."""
    number = int(episode_number)
    if number < 1:
        raise ValueError("集号无效")
    item = None
    for row in _normalize_episode_list(episode_content):
        try:
            row_number = int(row.get("episodeNumber") or 0)
        except (TypeError, ValueError):
            continue
        if row_number == number:
            item = row
            break
    if item is None:
        raise ValueError(f"找不到第 {number} 集剧本")
    body = str(item.get("body") or item.get("content") or "")
    if _body_char_len(body) < MIN_EPISODE_CONTENT_CHARS:
        raise ValueError(
            f"第 {number} 集正文过短，请先写完或让 AI 优化后再确认进入分镜"
        )
    return item


def _body_char_len(text: str) -> int:
    return len("".join((text or "").split()))


def _episode_number_of(episode: DramaEpisode) -> int:
    params = episode.params if isinstance(episode.params, dict) else {}
    try:
        return int(params.get("episodeNumber") or 0)
    except (TypeError, ValueError):
        return 0


def _episode_keep_score(episode: DramaEpisode) -> tuple[int, int, int]:
    """Sẽ ưu tiên giữ lại những dòng tập có nhiều phim, nhiều cảnh và được tạo trước đó."""
    frags = list(episode.fragments or [])
    videos = sum(1 for f in frags if (getattr(f, "video", None) or "").strip())
    return (videos, len(frags), -int(episode.id or 0))


def _dedupe_episode_body_items(bodies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Danh sách các tập trong kịch bản được loại bỏ theo số tập (cùng số thì giữ lại); số còn thiếu được phân bổ thêm vào số đã chiếm."""
    by_number: dict[int, dict[str, Any]] = {}
    missing: list[dict[str, Any]] = []
    for item in bodies:
        if not isinstance(item, dict):
            continue
        try:
            raw = int(item.get("episodeNumber") or 0)
        except (TypeError, ValueError):
            raw = 0
        if raw >= 1:
            row = dict(item)
            row["episodeNumber"] = raw
            by_number[raw] = row
        else:
            missing.append(dict(item))
    used = set(by_number)
    next_no = 1
    for item in missing:
        while next_no in used:
            next_no += 1
        row = dict(item)
        row["episodeNumber"] = next_no
        by_number[next_no] = row
        used.add(next_no)
        next_no += 1
    return [by_number[n] for n in sorted(by_number)]


async def merge_duplicate_episodes_by_number(db: AsyncSession, project_id: int) -> int:
    """Hợp nhất các DramaEpisodes trùng lặp của cùng một dự án với cùng số tập: giữ lại tập có phim/phân cảnh hoàn thiện tốt hơn và xóa phần còn lại."""
    episodes = list(
        (
            await db.execute(
                select(DramaEpisode)
                .where(DramaEpisode.project_id == int(project_id))
                .options(
                    selectinload(DramaEpisode.fragments).selectinload(
                        DramaEpisodeFragment.asset_references
                    )
                )
                .order_by(DramaEpisode.id.asc())
            )
        )
        .scalars()
        .all()
    )
    groups: dict[int, list[DramaEpisode]] = {}
    for ep in episodes:
        n = _episode_number_of(ep)
        if n < 1:
            continue
        groups.setdefault(n, []).append(ep)

    removed = 0
    for group in groups.values():
        if len(group) < 2:
            continue
        ranked = sorted(group, key=_episode_keep_score, reverse=True)
        keep = ranked[0]
        for dup in ranked[1:]:
            stale_ids = [int(f.id) for f in (dup.fragments or []) if f.id]
            if stale_ids:
                await detach_task_fragment_refs(db, stale_ids)
            await db.delete(dup)
            removed += 1
        logger.info(
            "合并重复分集 project_id=%s episodeNumber=%s keep_id=%s removed=%s",
            project_id,
            _episode_number_of(keep),
            keep.id,
            len(ranked) - 1,
        )
    if removed:
        await db.flush()
    return removed


async def seed_single_episode_from_script(
    db: AsyncSession,
    project: DramaProject,
    episode_number: int,
    *,
    force: bool = False,
) -> DramaEpisode:
    """Chỉ xây dựng các hàng/lát theo quy tắc cho tập hợp đã chỉ định. Các video hiện có và các sửa đổi thủ công sẽ được giữ lại khi không sử dụng vũ lực."""
    script = project.script
    if not script:
        raise ValueError("缺少剧本")
    item = require_confirmable_episode_body(script.episode_content, episode_number)
    title = str(item.get("title") or f"第{episode_number}集")
    body = str(item.get("body") or item.get("content") or "")

    assets = list(
        (await db.execute(select(DramaAsset).where(DramaAsset.project_id == project.id)))
        .scalars()
        .all()
    )
    summary = script.summary if isinstance(script.summary, dict) else None
    # Trước khi vào bảng phân cảnh, hãy xóa các số trùng lặp có cùng số để tránh tạo tập thứ N khác.
    await merge_duplicate_episodes_by_number(db, int(project.id))
    existing = list(
        (
            await db.execute(
                select(DramaEpisode)
                .where(DramaEpisode.project_id == project.id)
                .options(
                    selectinload(DramaEpisode.fragments).selectinload(
                        DramaEpisodeFragment.asset_references
                    )
                )
                .order_by(DramaEpisode.id.asc())
            )
        ).scalars().all()
    )
    ordered = sorted(
        existing,
        key=lambda ep: (_episode_number_of(ep), int(ep.id or 0)),
    )
    series_introduced: set[str] = set()
    target: DramaEpisode | None = None
    for episode in ordered:
        ep_no = _episode_number_of(episode)
        if ep_no < int(episode_number):
            for frag in episode.fragments or []:
                series_introduced.update(
                    extract_introduced_names_from_content(frag.content or "")
                )
            continue
        if ep_no == int(episode_number):
            target = episode
            break

    if target is None:
        target = DramaEpisode(
            project_id=project.id,
            name=title,
            params={"episodeNumber": int(episode_number)},
        )
        db.add(target)
        await db.flush()
        await _replace_episode_fragments(
            db,
            target,
            body,
            assets,
            already_introduced=series_introduced,
            summary=summary,
        )
    else:
        target.name = title
        if force or _episode_should_replace_fragments(target, body):
            await _replace_episode_fragments(
                db,
                target,
                body,
                assets,
                already_introduced=series_introduced,
                summary=summary,
                preserve_protected=not force,
            )
    await db.commit()
    reloaded = await _reload_episode(db, int(target.id))
    if reloaded is None:
        raise ValueError("分集写入后未能重新加载")
    logger.info(
        "单集切分镜完成 project_id=%s episode_number=%s episode_id=%s fragments=%s",
        project.id,
        episode_number,
        reloaded.id,
        len(reloaded.fragments or []),
    )
    return reloaded


async def _list_episode_fragments(
    db: AsyncSession,
    episode_id: int,
) -> list[DramaEpisodeFragment]:
    # Truy vấn rõ ràng các đoạn để tránh việc tải từng phần. các đoạn kích hoạt MissingGreenlet trong phiên không đồng bộ
    result = await db.execute(
        select(DramaEpisodeFragment)
        .where(DramaEpisodeFragment.episode_id == episode_id)
        .order_by(DramaEpisodeFragment.sort_order.asc())
    )
    return list(result.scalars().all())


async def _replace_episode_fragments(
    db: AsyncSession,
    episode: DramaEpisode,
    body: str,
    assets: list[DramaAsset],
    drafts: list[dict[str, Any]] | None = None,
    already_introduced: set[str] | None = None,
    summary: dict[str, Any] | None = None,
    *,
    preserve_protected: bool = False,
    continuation: bool = False,
) -> list[dict[str, Any]]:
    # Xóa bảng phân cảnh cũ và xây dựng lại nó; khi được bảo vệ_bảo vệ, hãy giữ lại video hiện có/thay đổi bảng phân cảnh theo cách thủ công
    existing = await _list_episode_fragments(db, episode.id)
    protected = (
        sorted(
            [f for f in existing if _fragment_is_protected(f)],
            key=lambda f: int(f.sort_order or 0),
        )
        if preserve_protected
        else []
    )
    protected_ids = {int(f.id) for f in protected}
    stale_ids = [int(f.id) for f in existing if int(f.id) not in protected_ids]
    if stale_ids:
        from app.services.tasks.service import cancel_fragment_video_tasks_for_fragments

        await cancel_fragment_video_tasks_for_fragments(db, stale_ids)
        await detach_task_fragment_refs(db, stale_ids)
    for old in existing:
        if int(old.id) not in protected_ids:
            await db.delete(old)
    await db.flush()

    planned = (
        drafts
        if drafts is not None
        else build_fragments_from_episode_body(
            body,
            assets,
            already_introduced=already_introduced,
            summary=summary,
        )
    )
    # Khi mở lại hoàn toàn, bỏ qua các bản nháp bằng tiền tố của cảnh quay; khi tiếp tục, các bản nháp đều là những cảnh quay tiếp theo.
    if protected and not continuation:
        skip = min(len(protected), len(planned))
        planned = planned[skip:]
    if protected:
        for i, frag in enumerate(protected):
            frag.sort_order = i

    base = len(protected)
    for i, frag in enumerate(planned):
        row = DramaEpisodeFragment(
            episode_id=episode.id,
            sort_order=base + i,
            content=str(frag.get("content") or ""),
            duration_sec=int(frag.get("duration_sec") or 8),
            params={
                "sceneName": frag.get("scene_name"),
                "characterNames": frag.get("character_names") or [],
                "user_edited": False,
            },
        )
        db.add(row)
        await db.flush()
        for asset_id in frag.get("asset_ids") or []:
            db.add(DramaFragmentAssetRef(fragment_id=row.id, asset_id=int(asset_id)))

    # Ghi lại danh tính của tập lệnh được sử dụng để phân đoạn để đưa ra đánh giá tiếp theo xem liệu có cần phân đoạn lại tự động hay không.
    ep_params = dict(episode.params) if isinstance(episode.params, dict) else {}
    ep_params["fragment_source_fp"] = _script_body_fingerprint(body)
    episode.params = ep_params
    return planned


def resolve_episode_script_body(episode_content: Any, episode: DramaEpisode) -> str:
    # Nhấn fileepNumber để lấy nội dung của tập này từ tập lệnhep_content
    ep_no = 0
    if isinstance(episode.params, dict):
        ep_no = int(episode.params.get("episodeNumber") or 0)
    for item in _normalize_episode_list(episode_content):
        if int(item.get("episodeNumber") or 0) == ep_no:
            return str(item.get("body") or item.get("content") or "")
    return ""


async def replace_episode_fragments_with_drafts(
    db: AsyncSession,
    episode: DramaEpisode,
    body: str,
    assets: list[DramaAsset],
    drafts: list[dict[str, Any]],
    *,
    preserve_protected: bool = True,
    continuation: bool = False,
) -> None:
    # Ghi đè lên bảng phân cảnh của tập này bằng bản nháp bên ngoài (LLM); giữ lại các sửa đổi video/thủ công đã tạo theo mặc định
    await _replace_episode_fragments(
        db,
        episode,
        body,
        assets,
        drafts=drafts,
        preserve_protected=preserve_protected,
        continuation=continuation,
    )


def _script_body_fingerprint(body: str) -> str:
    # Dấu vân tay văn bản của tập (dùng để xác định xem tập lệnh có bị thay đổi hay không)
    normalized = (body or "").replace("\r\n", "\n").strip()
    return hashlib.sha1(normalized.encode("utf-8")).hexdigest()[:16]


def _fragment_is_protected(frag: DramaEpisodeFragment) -> bool:
    # Các video hiện có hoặc bảng phân cảnh do người dùng sửa đổi sẽ không bị ghi đè trừ khi sử dụng vũ lực.
    if (frag.video or "").strip():
        return True
    params = frag.params if isinstance(frag.params, dict) else {}
    return bool(params.get("user_edited"))


def _episode_has_protected_fragments(episode: DramaEpisode) -> bool:
    return any(_fragment_is_protected(f) for f in (episode.fragments or []))


def _should_auto_replan(existing: list[DramaEpisode], bodies: list[dict[str, Any]]) -> bool:
    # Không có tập nào, bảng phân cảnh trống, kịch bản vẫn là nguyên văn của cảnh, kịch bản bị thay đổi và không có phân cảnh được bảo vệ, hoặc kịch bản tự động cắt lại khi có thêm tập.
    if not existing:
        return True
    body_by_number = {
        int(item.get("episodeNumber") or 0): item
        for item in bodies
        if isinstance(item, dict) and int(item.get("episodeNumber") or 0) >= 1
    }
    for episode in existing:
        params = episode.params if isinstance(episode.params, dict) else {}
        ep_no = int(params.get("episodeNumber") or 0)
        item = body_by_number.get(ep_no)
        body = str((item or {}).get("body") or (item or {}).get("content") or "") if item else ""
        if _episode_should_replace_fragments(episode, body):
            return True
    if len(bodies) > len(existing):
        return True
    return False


def _episode_should_replace_fragments(episode: DramaEpisode, script_body: str) -> bool:
    # Có nên áp dụng các quy tắc để cắt lại bảng phân cảnh của tập này hay không (bảo vệ việc sửa đổi video/thủ công)
    frags = list(episode.fragments or [])
    if not frags:
        return True
    if _episode_has_protected_fragments(episode):
        return False
    if all(is_raw_screenplay_fragment(f.content or "") for f in frags):
        # Toàn bộ tập phim vẫn phải được sao chép bằng bản gốc; không che toàn bộ tập phim bằng gương viết tay hoặc gương trống
        return True
    params = episode.params if isinstance(episode.params, dict) else {}
    stored_fp = str(params.get("fragment_source_fp") or "")
    current_fp = _script_body_fingerprint(script_body) if script_body else ""
    if stored_fp and current_fp and stored_fp != current_fp:
        return True
    if not stored_fp and script_body:
        # Dữ liệu cũ không có dấu vân tay: cắt lại khi số lượng cảnh lớn hơn 1 đáng kể và chỉ có 1 storyboard
        scene_count = len(split_episode_content_into_scenes(script_body))
        if scene_count > 1 and len(frags) == 1:
            return True
    return False


def _episode_needs_replan(episode: DramaEpisode) -> bool:
    # Tương thích với tên gọi cũ
    return _episode_should_replace_fragments(episode, "")


async def _reload_episodes(db: AsyncSession, project_id: int) -> list[DramaEpisode]:
    result = await db.execute(
        select(DramaEpisode)
        .where(DramaEpisode.project_id == project_id)
        .options(
            selectinload(DramaEpisode.fragments).selectinload(
                DramaEpisodeFragment.asset_references
            )
        )
        .order_by(DramaEpisode.id.asc())
    )
    return list(result.scalars().all())


async def _reload_episode(db: AsyncSession, episode_id: int) -> DramaEpisode | None:
    result = await db.execute(
        select(DramaEpisode)
        .where(DramaEpisode.id == episode_id)
        .options(
            selectinload(DramaEpisode.fragments).selectinload(
                DramaEpisodeFragment.asset_references
            )
        )
    )
    return result.scalar_one_or_none()


def _episode_bodies(episode_content: Any) -> list[str]:
    items = _normalize_episode_list(episode_content)
    return [str(x.get("body") or x.get("content") or "") for x in items]


def _extract_cast_names_from_bodies(bodies: list[str]) -> list[str]:
    """Thu thập tất cả tên nhân vật từ dòng "Nhân vật:" trong văn bản tập (xóa trùng lặp, giữ nguyên thứ tự và bỏ qua chú thích giọng nói)."""
    # đã thấy Đã bao gồm
    seen: set[str] = set()
    # tên kết quả bảo toàn trật tự
    names: list[str] = []
    for body in bodies:
        for line in (body or "").replace("\r\n", "\n").split("\n"):
            match = CAST_LINE_RE.match(line.strip())
            if not match:
                continue
            for name in parse_cast_names(match.group(1)):
                seed_name = _character_name_for_seed(name)
                if seed_name and seed_name not in seen:
                    seen.add(seed_name)
                    names.append(seed_name)
    return names


def _character_stub_from_cast(
    name: str,
    story_type: str = "",
    summary: dict[str, Any] | None = None,
    bodies: list[str] | None = None,
) -> dict[str, Any]:
    """Sơ khai nhân vật (nội dung xây dựng + lời nhắc AI tiếp theo) khi xuất hiện trong các tập phim nhưng không viết tiểu sử trong phần tóm tắt."""
    from app.services.drama.build_fragments import infer_character_intro_text

    genre = (story_type or "").strip() or "短剧"
    stub_params = {
        "name": name,
        "title": "出场人物",
        "roleType": "配角",
        "visualImage": (
            f"{name}，{genre}人物定妆，可辨识面容与服饰，体态与气质贴合身份，"
            "影视级写实，白底全身可拍摄"
        ),
        "coreTags": "出场人物",
        "personality": "",
        "identityBackground": f"剧本分集出场人物「{name}」",
        "growthExperience": "",
        "relationships": "",
        "growthArc": "出场 -> 卷入冲突 -> 结局余韵",
    }
    intro = infer_character_intro_text(name, stub_params, summary, bodies)
    if intro:
        stub_params["title"] = intro
        stub_params["identityBackground"] = intro
    return stub_params


def _normalize_episode_list(episode_content: Any) -> list[dict[str, Any]]:
    if isinstance(episode_content, dict) and isinstance(episode_content.get("episodes"), list):
        return [x for x in episode_content["episodes"] if isinstance(x, dict)]
    if isinstance(episode_content, list):
        return [x for x in episode_content if isinstance(x, dict)]
    return []
