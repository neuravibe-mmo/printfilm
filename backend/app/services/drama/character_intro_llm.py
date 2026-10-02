"""LLM Hoàn thành việc sao chép giới thiệu nhân vật (khi nhân vật sơ khai/tóm tắt thiếu tiểu sử)."""

from __future__ import annotations

import logging
from typing import Any

from app.services.drama.build_fragments import (
    build_summary_character_lookup,
    infer_character_intro_text,
    _find_summary_character,
    _is_generic_intro_text,
    _merge_params_with_summary,
    _shorten_intro,
)
from app.services.drama.llm import drama_chat_json

logger = logging.getLogger(__name__)

SUMMARY_TEXT_MAX = 3500
BODY_SAMPLE_MAX = 4000
BODY_PER_EPISODE_MAX = 1200

CHARACTER_INTRO_SYSTEM = """Bạn là trợ lý biên kịch phim ảnh, chịu trách nhiệm viết câu ngắn «Phụ đề giới thiệu nhân vật» (character intro overlay) cho phim ngắn/web drama.

Mục đích: Khi nhân vật lần đầu tiên xuất hiện trong phim, khung hình sẽ hiện một dòng chữ nhỏ cạnh bên nhân vật đó «Tên nhân vật | Thân phận / Vai trò» (không phải lời đọc lồng tiếng, không phải phụ đề thoại dưới đáy màn hình).

Yêu cầu:
1. Mỗi câu giới thiệu ngắn gọn từ 3 đến 8 từ tiếng Việt, nêu bật thân phận, địa vị hoặc mối quan hệ với cốt truyện chính.
2. Phong cách phù hợp với thể loại truyện và bối cảnh kịch bản, có thể dùng dấu "/" để nối 2 vế ngắn (ví dụ: "Thủ lĩnh trị thủy / Tổ phụ triều Hạ").
3. Nghiêm cấm các từ đệm vô nghĩa: "Nhân vật xuất hiện", "Nhân vật trong tập", "Vai phụ"...
4. Chỉ viết cho các nhân vật có tên trong danh sách được giao; không tự ý bịa thêm nhân vật ngoài danh sách.

Xuất ra đúng định dạng JSON (không dùng markdown):
{"intros": {"Tên nhân vật": "Nội dung giới thiệu ngắn"}}
"""


def _summary_blob(summary: dict[str, Any] | None) -> str:
    if not isinstance(summary, dict):
        return ""
    parts: list[str] = []
    for key in ("storyType", "oneLineStory", "coreHook", "synopsis"):
        val = str(summary.get(key) or "").strip()
        if val:
            parts.append(val)
    for ch in summary.get("characters") or []:
        if not isinstance(ch, dict):
            continue
        name = str(ch.get("name") or "").strip()
        if not name:
            continue
        bits = [
            str(ch.get("roleType") or "").strip(),
            str(ch.get("title") or "").strip(),
            str(ch.get("identityBackground") or "").strip(),
        ]
        line = " ".join(b for b in bits if b)
        if line:
            parts.append(f"{name}: {line}")
    blob = "\n".join(parts)
    return blob[:SUMMARY_TEXT_MAX]


def _bodies_sample(episode_bodies: list[str] | None) -> str:
    if not episode_bodies:
        return ""
    chunks: list[str] = []
    used = 0
    for body in episode_bodies:
        text = (body or "").strip()
        if not text:
            continue
        piece = text[:BODY_PER_EPISODE_MAX]
        if used + len(piece) > BODY_SAMPLE_MAX:
            piece = piece[: max(0, BODY_SAMPLE_MAX - used)]
        if not piece:
            break
        chunks.append(piece)
        used += len(piece)
    return "\n---\n".join(chunks)


def _build_intro_user_prompt(
    names: list[str],
    *,
    summary: dict[str, Any] | None,
    episode_bodies: list[str] | None,
    story_type: str | None,
) -> str:
    genre = (story_type or "").strip()
    if not genre and isinstance(summary, dict):
        genre = str(summary.get("storyType") or "").strip()
    lines = [
        "Vui lòng viết cho mỗi nhân vật dưới đây một câu phụ đề giới thiệu nhân vật ngắn gọn:",
        ", ".join(names),
    ]
    if genre:
        lines.append(f"Thể loại câu chuyện: {genre}")
    summary_text = _summary_blob(summary)
    if summary_text:
        lines.append(f"Tóm tắt kịch bản:\n{summary_text}")
    body_text = _bodies_sample(episode_bodies)
    if body_text:
        lines.append(f"Trích đoạn kịch bản các tập:\n{body_text}")
    return "\n\n".join(lines)


def _parse_intro_response(raw: Any, names: list[str]) -> dict[str, str]:
    allowed = {n.strip() for n in names if n.strip()}
    result: dict[str, str] = {}
    if isinstance(raw, dict):
        intros = raw.get("intros")
        if isinstance(intros, dict):
            for key, val in intros.items():
                name = str(key or "").strip()
                intro = _shorten_intro(str(val or ""), max_len=28)
                if name in allowed and intro and not _is_generic_intro_text(intro):
                    result[name] = intro
        for key in ("characters", "items"):
            items = raw.get(key)
            if isinstance(items, list):
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    name = str(item.get("name") or "").strip()
                    intro = _shorten_intro(
                        str(item.get("intro") or item.get("title") or item.get("introText") or ""),
                        max_len=28,
                    )
                    if name in allowed and intro and not _is_generic_intro_text(intro):
                        result[name] = intro
    return result


async def llm_enrich_character_intros(
    names: list[str],
    *,
    summary: dict[str, Any] | None = None,
    episode_bodies: list[str] | None = None,
    story_type: str | None = None,
) -> dict[str, str]:
    """Batch LLM tạo ra các từ trùng nhau để giới thiệu nhân vật; trả về một lệnh trống nếu thất bại."""
    unique: list[str] = []
    seen: set[str] = set()
    for name in names:
        n = str(name or "").strip()
        if n and n not in seen:
            seen.add(n)
            unique.append(n)
    if not unique:
        return {}
    user = _build_intro_user_prompt(
        unique,
        summary=summary,
        episode_bodies=episode_bodies,
        story_type=story_type,
    )
    try:
        raw = await drama_chat_json(
            CHARACTER_INTRO_SYSTEM,
            user,
            temperature=0.35,
            max_tokens=1024,
        )
        parsed = _parse_intro_response(raw, unique)
        logger.info("LLM 人物介绍补齐 count=%s names=%s", len(parsed), list(parsed.keys()))
        return parsed
    except Exception:  # noqa: BLE001
        logger.exception("LLM 人物介绍补齐失败 names=%s", unique)
        return {}


def collect_names_needing_intro(
    character_assets: list[Any],
    *,
    summary: dict[str, Any] | None = None,
    episode_bodies: list[str] | None = None,
) -> list[str]:
    """Link quy tắc vẫn thiếu tên vai trò của bản giới thiệu (bảo quản đơn hàng)."""
    lookup = build_summary_character_lookup(summary)
    missing: list[str] = []
    seen: set[str] = set()
    for asset in character_assets:
        name = str(getattr(asset, "name", "") or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        params = getattr(asset, "params", None) or {}
        if not isinstance(params, dict):
            params = {}
        merged = _merge_params_with_summary(params, _find_summary_character(lookup, name))
        if infer_character_intro_text(name, merged, summary, episode_bodies):
            continue
        missing.append(name)
    return missing


async def prepare_character_intro_overrides(
    character_assets: list[Any],
    *,
    summary: dict[str, Any] | None = None,
    episode_bodies: list[str] | None = None,
    story_type: str | None = None,
) -> dict[str, str]:
    """Trước tiên hãy suy ra các quy tắc và điền vào những phần còn thiếu bằng LLM một lần."""
    names = collect_names_needing_intro(
        character_assets,
        summary=summary,
        episode_bodies=episode_bodies,
    )
    if not names:
        return {}
    return await llm_enrich_character_intros(
        names,
        summary=summary,
        episode_bodies=episode_bodies,
        story_type=story_type,
    )
