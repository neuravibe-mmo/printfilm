"""Lưu trữ kỹ năng đặc vụ: hướng dẫn sử dụng tích hợp + kỹ năng đánh dấu do người dùng tải lên."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AgentSkill(Base):
    """Một Kỹ năng đặc vụ có thể được đưa vào LLM (ảnh chụp lập kế hoạch, lời nhắc video, v.v.)."""

    __tablename__ = "agent_skills"
    __table_args__ = (UniqueConstraint("user_id", "slug", name="uq_agent_skill_user_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # tên ngắn của sên, chẳng hạn như cinedance-seedance
    slug: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(String(1024), default="")
    # body nội dung markdown đầy đủ (không bao gồm tiêu đề YAML)
    body: Mapped[str] = mapped_column(Text, default="")
    # nhiệm vụ Nhiệm vụ áp dụng: shot_plan / video_prompt / all
    tasks: Mapped[list] = mapped_column(JSON, default=list)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Nếu user_id trống, nghĩa là hệ thống đã được tích hợp sẵn; nếu người dùng tải nó lên, nó sẽ bị ràng buộc với chủ sở hữu.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
