"""Các loại quy trình làm việc truyện tranh: kịch bản (phác thảo → nội dung → tập) và canvas (canvas miễn phí)."""

from __future__ import annotations

from typing import Any

from app.models_drama import DramaProject

CANVAS_SOURCE_MARKER = "自由画布创作项目"
CANVAS_TITLE_MARKER = "自由画布"


def resolve_drama_workflow(project: DramaProject) -> str:
    """
    解析项目工作流。
    优先读 params.workflow；兼容旧自由画布项目（Tiêu đề/占位创意文案）。
    """
    params = project.params if isinstance(project.params, dict) else {}
    raw = str(params.get("workflow") or "").strip().lower()
    if raw in ("canvas", "script"):
        return raw

    title = str(project.title or "")
    if CANVAS_TITLE_MARKER in title:
        return "canvas"

    script = getattr(project, "script", None)
    source = str(getattr(script, "source", None) or "")
    if CANVAS_SOURCE_MARKER in source:
        return "canvas"

    return "script"


def build_project_params(
    *,
    workflow: str,
    episode_count: int,
    image_style_id: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Tập hợp các thông số được viết khi tạo dự án."""
    wf = workflow if workflow in ("canvas", "script") else "script"
    return {
        **(extra or {}),
        "workflow": wf,
        "episode_count": 0 if wf == "canvas" else episode_count,
        "image_style_id": image_style_id or "",
    }
