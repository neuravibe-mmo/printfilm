"""Đặt Kỹ năng đã kích hoạt vào lời nhắc của hệ thống LLM."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models_agent import AgentSkill
from app.services.agent.store import list_injectable_skills, list_skills_by_ids

# MAX_SKILL_INJECT_CHARS Giới hạn tiêm một lần để tránh làm nổ tung bối cảnh
MAX_SKILL_INJECT_CHARS = 14000
SKILL_HEADER = "\n\n## Agent Skill đã kích hoạt (Bắt buộc thủ thuật, không lặp lại tiêu đề này / Đã bật Agent Skill)\n"


def skill_matches_task(skill: AgentSkill, task: str) -> bool:
    # Khớp nhãn tác vụ: tất cả hoặc tên tác vụ chính xác
    tasks = skill.tasks if isinstance(skill.tasks, list) else []
    labels = {str(item).strip() for item in tasks if str(item).strip()}
    if not labels or "all" in labels:
        return True
    return task in labels


def render_skill_block(skills: list[AgentSkill], *, max_chars: int = MAX_SKILL_INJECT_CHARS) -> str:
    # Ưu tiên cài sẵn rồi ghép theo tên; cắt bớt các kỹ năng vượt quá giới hạn trên.
    if not skills:
        return ""
    chunks: list[str] = [SKILL_HEADER]
    used = len(SKILL_HEADER)
    for skill in skills:
        title = (skill.name or skill.slug or "Chưa đặt tên").strip()
        body = (skill.body or "").strip()
        piece = f"\n### {title}\n\n{body}\n"
        if used + len(piece) > max_chars:
            remain = max_chars - used - 24
            if remain < 200:
                break
            piece = f"\n### {title}\n\n{body[:remain].rstrip()}\n…（Phần sau đã được rút gọn / Phần tiếp theo đã bị cắt ngắn)\n"
        chunks.append(piece)
        used += len(piece)
    return "".join(chunks) if len(chunks) > 1 else ""


def parse_skill_ids(raw: Any) -> list[int] | None:
    # Không có nghĩa là không được chỉ định (bật tất cả); [] có nghĩa là lần này không tiêm
    if raw is None:
        return None
    if not isinstance(raw, list):
        return None
    out: list[int] = []
    seen: set[int] = set()
    for item in raw:
        try:
            skill_id = int(item)
        except (TypeError, ValueError):
            continue
        if skill_id <= 0 or skill_id in seen:
            continue
        seen.add(skill_id)
        out.append(skill_id)
    return out


async def compose_task_skills(
    db: AsyncSession | None,
    user_id: int | None,
    task: str,
    skill_ids: list[int] | None = None,
) -> str:
    """Tải kỹ năng để tạo thành phụ lục nhắc nhở hệ thống.

    skill_ids 为 None：全部启用且匹配任务；为 []：不注入；为 id 列表：按勾选注入。
    """
    if db is None:
        return ""
    if skill_ids is not None:
        rows = await list_skills_by_ids(db, user_id, skill_ids)
        return render_skill_block(rows)
    rows = await list_injectable_skills(db, user_id)
    matched = [row for row in rows if skill_matches_task(row, task)]
    return render_skill_block(matched)


def with_skill_system(base_system: str, skill_block: str) -> str:
    # Mẹo hệ thống cơ bản + phụ lục kỹ năng
    extra = (skill_block or "").strip()
    if not extra:
        return base_system
    return f"{base_system.rstrip()}\n{extra}"


def skill_to_public_dict(skill: AgentSkill) -> dict[str, Any]:
    # Danh sách/trường chi tiết API
    return {
        "id": skill.id,
        "slug": skill.slug,
        "name": skill.name,
        "description": skill.description or "",
        "tasks": list(skill.tasks or []),
        "is_builtin": bool(skill.is_builtin),
        "is_active": bool(skill.is_active),
        "user_id": skill.user_id,
        "body": skill.body or "",
        "created_at": skill.created_at.isoformat() if skill.created_at else None,
        "updated_at": skill.updated_at.isoformat() if skill.updated_at else None,
    }
