"""Tham số đầu vào và đầu ra của Agent Skill API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AgentSkillOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str = ""
    tasks: list[str] = Field(default_factory=list)
    is_builtin: bool = False
    is_active: bool = True
    user_id: int | None = None
    body: str = ""
    created_at: str | None = None
    updated_at: str | None = None


class AgentSkillListOut(BaseModel):
    items: list[AgentSkillOut]


class AgentSkillUploadBody(BaseModel):
    """Kỹ năng tải lên: đánh dấu hoàn chỉnh (có thể bao gồm tiêu đề YAML)."""

    markdown: str = Field(min_length=8, max_length=80000)


class AgentSkillUpdateBody(BaseModel):
    markdown: str | None = Field(default=None, max_length=80000)
    is_active: bool | None = None


class AgentSkillOptimizeBody(BaseModel):
    """Nhấp để kiểm tra từ nhắc nhở Tối ưu hóa kỹ năng."""

    prompt: str = Field(min_length=1, max_length=8000)
    skill_ids: list[int] = Field(default_factory=list)
    task: str = Field(default="video_prompt", max_length=64)


class AgentSkillOptimizeOut(BaseModel):
    prompt: str
    task_id: int | None = None
