"""Task handler registry for the de-workerized task platform."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
import asyncio
from dataclasses import dataclass
from typing import Any

from app.models_tasks import TaskRun
from app.schemas_tasks import TaskCreateRequest, TaskStepCreate

TaskExecutor = Callable[[TaskRun], Awaitable[dict[str, Any] | None]]


@dataclass(frozen=True)
class TaskHandler:
    """Describe how one task type is planned and executed."""

    domain: str
    task_type: str
    executor: TaskExecutor

    # Tạo các bước mặc định khi tạo tác vụ
    def plan_steps(self, body: TaskCreateRequest) -> list[TaskStepCreate]:
        return [TaskStepCreate(step_key=body.task_type, step_type="job")]


# Thực hiện nhiệm vụ tóm tắt kịch bản truyện tranh.
async def _run_drama_script_summary(task: TaskRun) -> dict[str, Any] | None:
    from app.services.drama.jobs import run_script_summary_job

    return await run_script_summary_job(_require_int(task.drama_project_id, "drama_project_id"))


# Thực hiện nhiệm vụ tạo kịch bản cho các tập phim truyện tranh.
async def _run_drama_episode_script(task: TaskRun) -> dict[str, Any] | None:
    from app.services.drama.jobs import run_episode_scripts_job

    payload = task.payload or {}
    episode_raw = payload.get("episode_number")
    try:
        episode_number = int(episode_raw) if episode_raw not in (None, "") else None
    except (TypeError, ValueError):
        episode_number = None
    draft = str(payload.get("draft") or "").strip() or None
    generate_mode = str(payload.get("generate_mode") or "").strip() or None
    return await run_episode_scripts_job(
        _require_int(task.drama_project_id, "drama_project_id"),
        force=bool(payload.get("force")),
        task_id=int(task.id),
        episode_number=episode_number,
        draft=draft,
        generate_mode=generate_mode,
    )


# Thực hiện nhiệm vụ lập kế hoạch cho từng tập phim.
async def _run_drama_fragment_plan(task: TaskRun) -> dict[str, Any] | None:
    from app.services.drama.jobs import run_episode_fragment_plan_job

    payload = task.payload or {}
    return await run_episode_fragment_plan_job(
        _require_int(task.episode_id, "episode_id"),
        fallback_rules=bool(payload.get("fallback_rules", True)),
        subtitle_enabled=payload.get("subtitle_enabled"),
        force=bool(payload.get("force")),
    )


# Thực thi tác vụ video bảng phân cảnh truyện tranh (NIO + thanh toán nền tảng tác vụ; mỗi tác vụ chỉ xử lý một đoạn).
async def _run_drama_fragment_video(task: TaskRun) -> dict[str, Any] | None:
    from app.services.drama.jobs import submit_fragment_video_task

    payload = task.payload or {}
    fragment_ids = payload.get("fragment_ids") or []
    if fragment_ids and not isinstance(fragment_ids, list):
        raise ValueError("fragment_ids 必须为数组")
    return await submit_fragment_video_task(task)


# Thực hiện nhiệm vụ sản xuất hình ảnh cho các sản phẩm truyện tranh.
async def _run_drama_asset_image(task: TaskRun) -> dict[str, Any] | None:
    from app.services.drama.jobs import run_asset_image_job

    payload = task.payload or {}
    return await run_asset_image_job(
        _require_int(task.drama_project_id, "drama_project_id"),
        int(task.requested_by),
        str(payload.get("prompt") or "").strip(),
        asset_id=task.asset_id,
        name=(payload.get("name") or None),
        kind=str(payload.get("kind") or "character"),
        image_style_id=(payload.get("image_style_id") or None),
        model_id=(payload.get("model_id") or None),
        aspect_ratio=(payload.get("aspect_ratio") or None),
        resolution=(payload.get("resolution") or None),
    )


# Thực hiện nhiệm vụ tạo video từ nội dung truyện tranh.
async def _run_drama_asset_video(task: TaskRun) -> dict[str, Any] | None:
    from app.services.drama.jobs import run_asset_video_job

    payload = task.payload or {}
    reference_asset_ids = payload.get("reference_asset_ids") or []
    if not isinstance(reference_asset_ids, list):
        raise ValueError("reference_asset_ids 必须为数组")
    return await run_asset_video_job(
        _require_int(task.drama_project_id, "drama_project_id"),
        int(task.requested_by),
        str(payload.get("prompt") or "").strip(),
        _require_int(task.asset_id, "asset_id"),
        model_id=(payload.get("model_id") or None),
        aspect_ratio=(payload.get("aspect_ratio") or None),
        resolution=(payload.get("resolution") or None),
        duration_sec=payload.get("duration_sec"),
        image_style_id=(payload.get("image_style_id") or None),
        reference_asset_ids=[int(item) for item in reference_asset_ids],
    )


# Thực hiện nhiệm vụ trích xuất nội dung truyện tranh.
async def _run_drama_seed_assets(task: TaskRun) -> dict[str, Any] | None:
    from app.services.drama.jobs import run_seed_assets_job

    payload = task.payload or {}
    return await run_seed_assets_job(
        _require_int(task.drama_project_id, "drama_project_id"),
        refresh_prompts=bool(payload.get("refresh_prompts")),
        reextract_props=bool(payload.get("reextract_props")),
    )


# Thực thi quy trình con có thể hủy được trong khoa học phổ biến: Khi dự án bị hủy theo yêu cầu của người dùng, PipelineCancelled hội tụ đến
# {"cancelled": True} (người thực thi thoát khỏi trạng thái tương ứng và quay lại trạng thái đóng băng); các trường hợp ngoại lệ khác được đưa ra như bình thường.
async def _await_kepu(task: TaskRun, aw: Awaitable[Any], **extra: Any) -> dict[str, Any]:
    from app.services.pipeline import PipelineCancelled

    try:
        await aw
    except PipelineCancelled:
        if task.cancel_requested:
            return {"cancelled": True, "project_id": task.project_id, **extra}
        raise
    return {"ok": True, "project_id": task.project_id, **extra}


# Thực hiện quy trình phổ biến khoa học theo giai đoạn (tuân thủ nghiêm ngặt việc giữ lại payload.phase của giai đoạn tương ứng).
async def _run_kepu_project_pipeline(task: TaskRun) -> dict[str, Any] | None:
    from app.services.pipeline import run_pipeline

    payload = task.payload if isinstance(task.payload, dict) else {}
    phase = payload.get("phase")
    return await _await_kepu(
        task,
        run_pipeline(
            _require_int(task.project_id, "project_id"),
            phase=str(phase) if phase is not None else None,
        ),
        phase=phase,
    )


# Thực hiện nhiệm vụ tạo ra những bức ảnh ống kính đơn về khoa học phổ thông.
async def _run_kepu_shot_image(task: TaskRun) -> dict[str, Any] | None:
    from app.services.pipeline import regen_shot_image

    return await _await_kepu(
        task,
        regen_shot_image(
            _require_int(task.project_id, "project_id"),
            _require_int(task.shot_id, "shot_id"),
        ),
        shot_id=task.shot_id,
    )


# Thực hiện nhiệm vụ video ống kính đơn về khoa học phổ biến.
async def _run_kepu_shot_video(task: TaskRun) -> dict[str, Any] | None:
    from app.services.pipeline import regen_shot_video

    return await _await_kepu(
        task,
        regen_shot_video(
            _require_int(task.project_id, "project_id"),
            _require_int(task.shot_id, "shot_id"),
        ),
        shot_id=task.shot_id,
    )


# Thực hiện nhiệm vụ lồng tiếng bằng ống kính đơn về khoa học phổ biến.
async def _run_kepu_shot_audio(task: TaskRun) -> dict[str, Any] | None:
    from app.services.pipeline import regen_shot_audio

    return await _await_kepu(
        task,
        regen_shot_audio(
            _require_int(task.project_id, "project_id"),
            _require_int(task.shot_id, "shot_id"),
        ),
        shot_id=task.shot_id,
    )


# Thực hiện nhiệm vụ lồng tiếng cho toàn bộ bộ phim khoa học nổi tiếng.
async def _run_kepu_project_audio(task: TaskRun) -> dict[str, Any] | None:
    from app.services.pipeline import regen_project_audio_and_compose

    return await _await_kepu(
        task,
        regen_project_audio_and_compose(_require_int(task.project_id, "project_id")),
    )


# Thực hiện các nhiệm vụ tổng hợp chỉ phổ biến khoa học.
async def _run_kepu_compose(task: TaskRun) -> dict[str, Any] | None:
    from app.services.pipeline import compose_only

    return await _await_kepu(
        task,
        compose_only(_require_int(task.project_id, "project_id")),
    )


# Thực thi các tác vụ mô phỏng bị trì hoãn để tạo điều kiện xác minh luồng trạng thái nền tảng tác vụ.
async def _run_tools_mock_delay(task: TaskRun) -> dict[str, Any] | None:
    payload = task.payload or {}
    delay_seconds = int(payload.get("delay_seconds") or 10)
    if delay_seconds < 1 or delay_seconds > 600:
        raise ValueError("delay_seconds 必须在 1-600 秒之间")
    await asyncio.sleep(delay_seconds)
    succeed = payload.get("succeed", True)
    if not isinstance(succeed, bool):
        raise ValueError("succeed 必须为布尔值")
    if not succeed:
        raise RuntimeError(str(payload.get("error_message") or "mock delayed task failed"))
    result_payload = payload.get("result_payload")
    return {
        "ok": True,
        "delay_seconds": delay_seconds,
        "echo": (
            {"message": "mock delayed task finished"}
            if result_payload is None
            else result_payload
        ),
    }


# Trình xử lý giữ chỗ tác vụ nhẹ (thực sự được thực thi nội tuyến bởi run_billed_ephemeral).
async def _noop_ephemeral(task: TaskRun) -> dict[str, Any] | None:
    return {"ok": True, "ephemeral": True}


# Đảm bảo tồn tại các trường khóa chính chính.
def _require_int(value: int | None, field_name: str) -> int:
    if isinstance(value, int) and value > 0:
        return value
    raise ValueError(f"任务缺少 {field_name}")


TASK_HANDLERS: dict[tuple[str, str], TaskHandler] = {
    ("drama", "script_summary"): TaskHandler("drama", "script_summary", _run_drama_script_summary),
    ("drama", "episode_script"): TaskHandler("drama", "episode_script", _run_drama_episode_script),
    ("drama", "fragment_plan"): TaskHandler("drama", "fragment_plan", _run_drama_fragment_plan),
    ("drama", "fragment_video"): TaskHandler("drama", "fragment_video", _run_drama_fragment_video),
    ("drama", "asset_image"): TaskHandler("drama", "asset_image", _run_drama_asset_image),
    ("drama", "asset_video"): TaskHandler("drama", "asset_video", _run_drama_asset_video),
    ("drama", "seed_assets"): TaskHandler("drama", "seed_assets", _run_drama_seed_assets),
    ("drama", "agent_chat"): TaskHandler("drama", "agent_chat", _noop_ephemeral),
    ("drama", "skill_optimize"): TaskHandler("drama", "skill_optimize", _noop_ephemeral),
    ("drama", "voice_prompt"): TaskHandler("drama", "voice_prompt", _noop_ephemeral),
    ("drama", "voice_synthesis"): TaskHandler("drama", "voice_synthesis", _noop_ephemeral),
    ("kepu", "content_expand"): TaskHandler("kepu", "content_expand", _noop_ephemeral),
    ("api", "v1_image"): TaskHandler("api", "v1_image", _noop_ephemeral),
    ("api", "v1_video"): TaskHandler("api", "v1_video", _noop_ephemeral),
    ("api", "v1_seedance"): TaskHandler("api", "v1_seedance", _noop_ephemeral),
    ("studio", "tool_image"): TaskHandler("studio", "tool_image", _noop_ephemeral),
    ("studio", "tool_video"): TaskHandler("studio", "tool_video", _noop_ephemeral),
    ("kepu", "project_pipeline"): TaskHandler("kepu", "project_pipeline", _run_kepu_project_pipeline),
    ("kepu", "shot_regen_image"): TaskHandler("kepu", "shot_regen_image", _run_kepu_shot_image),
    ("kepu", "shot_regen_video"): TaskHandler("kepu", "shot_regen_video", _run_kepu_shot_video),
    ("kepu", "shot_regen_audio"): TaskHandler("kepu", "shot_regen_audio", _run_kepu_shot_audio),
    ("kepu", "project_regen_audio"): TaskHandler("kepu", "project_regen_audio", _run_kepu_project_audio),
    ("kepu", "project_compose_only"): TaskHandler("kepu", "project_compose_only", _run_kepu_compose),
    ("tools", "mock_delay"): TaskHandler("tools", "mock_delay", _run_tools_mock_delay),
}


# Nhấn domain + task_type để tìm trình xử lý nền tảng.
def get_task_handler(domain: str, task_type: str) -> TaskHandler | None:
    return TASK_HANDLERS.get((domain, task_type))
