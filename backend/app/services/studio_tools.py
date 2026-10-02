"""Các công cụ sáng tạo độc lập: Wen Sheng Tu / Tu Sheng Tu / Tu Sheng Product / Wen Sheng Video / Video Video Sheng Video / E-commerce Puzzle."""

from __future__ import annotations

import hashlib
import logging
import shutil
import subprocess
import uuid
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import ToolRun, User
from app.models_tasks import TaskRun
from app.services.ark import get_ark
from app.services.billing import record_line, run_billed_ephemeral
from app.services.drama.billing_util import record_seedream_image_usage
from app.services.billing.estimates import estimate_task_fen
from app.services.billing.settlement import billing_active
from app.services.ffmpeg_compose import extract_video_poster_frame
from app.services import storage

logger = logging.getLogger("app.studio_tools")

RATIO_SIZE = {
    "1:1": "1920x1920",
    "16:9": "2560x1440",
    "9:16": "1440x2560",
}

PRODUCT_PROMPTS = {
    "白底图": "Ảnh thương mại điện tử nền trắng tinh khiết, nền trắng không tì vết, chủ thể ở trung tâm, ánh sáng đồng đều, không có chữ, không watermark, không logo. E-commerce product on clean pure white background, centered, even lighting, no text, no watermark",
    "场景图": "Ảnh thương mại điện tử bối cảnh đời sống thực tế, ánh sáng tự nhiên, không khí sử dụng chân thực, chủ thể rõ ràng sắc nét, không có chữ, không watermark. E-commerce product in realistic lifestyle scene, natural light, clear subject, no text, no watermark",
    "详情长图": "Ảnh bố cục dọc hiển thị chi tiết sản phẩm, hậu cảnh sạch sẽ gọn gàng, chất liệu và chi tiết sắc nét, không chữ, không watermark. Vertical product detail shot, clean background, sharp textures and details, no text, no watermark",
}

ECOM_POSTER = "Ảnh poster quảng cáo điểm bán hàng bố cục dọc, chủ thể nổi bật, bố cục tinh tế sạch sẽ, không chữ, không phụ đề, không logo, không watermark. Vertical product showcase poster, prominent subject, clean composition, no text, no watermark"


# Thư mục đầu ra công cụ độc lập với người dùng (được treo trong p0/tools, không chiếm ID dự án)
def tools_dir(user_id: int) -> Path:
    path = storage.project_dir(0) / "tools" / f"u{user_id}"
    path.mkdir(parents=True, exist_ok=True)
    return path


# Seedream yêu cầu hình ảnh tham chiếu https của mạng công cộng và tải chúng lên OSS đồng thời.
def publish_public(path: Path) -> str:
    local = storage.publish_local(path, sync=True)
    return storage.republish_url(local, sync=True) or local


# URL kết quả phải được đặt trong OSS càng nhiều càng tốt (tải lên đồng bộ cục bộ/tĩnh)
def ensure_public_url(url: str | None) -> str | None:
    if not url:
        return url
    return storage.republish_url(url, sync=True) or url


# Đồng bộ hóa URL kết quả sang OSS theo đợt
def ensure_public_urls(urls: list[str] | None) -> list[str]:
    out: list[str] = []
    for raw in urls or []:
        if not raw:
            continue
        published = ensure_public_url(raw)
        if published:
            out.append(published)
    return out


# Chuyển đổi bản sao khung thành pixel kích thước Seedream
def ratio_to_size(ratio: str | None) -> str:
    return RATIO_SIZE.get((ratio or "").strip(), RATIO_SIZE["1:1"])


# Thời lượng chip (5s/10s/15s) đến giây
def duration_seconds(raw: str | None) -> int:
    text = (raw or "5s").strip().lower().replace("s", "")
    try:
        n = int(text)
    except ValueError:
        n = 5
    return max(4, min(n, 15))


# Độ tương tự giữa ảnh với ảnh: thấp = thay đổi lớn, cao = cố gắng càng gần với ảnh tham chiếu càng tốt
def strength_hint(level: str | None) -> str:
    raw = (level or "").strip()
    if raw in ("低", "Thấp", "Low"):
        return "cho phép thay đổi lớn về bố cục và phong cách, chỉ giữ lại các đặc trưng nhận diện của chủ thể"
    if raw in ("高", "Cao", "High"):
        return "cố gắng giữ nguyên hình dáng chủ thể, bố cục và màu sắc của ảnh tham khảo"
    return "trong điều kiện giữ nguyên đặc trưng nhận diện của chủ thể, biến đổi phong cách ở mức độ vừa phải"


# Video mẹo về cường độ tập luyện, được đánh vần trong Seedance copywriting
def motion_hint(level: str | None) -> str:
    raw = (level or "").strip()
    if raw in ("弱", "Yếu", "Weak"):
        return "máy quay gần như tĩnh, chỉ có dao động thở nhẹ nhàng, chuyển động tinh tế"
    if raw in ("强", "Mạnh", "Strong"):
        return "chuyển động máy quay rõ rệt, đẩy kéo hoặc xoay quanh chủ thể, tiết tấu nhanh và năng động"
    return "chuyển động máy quay vừa phải, bám theo chủ thể ổn định mượt mà"


# Thả file đã tải lên vào thư mục công cụ người dùng
def save_upload(user_id: int, data: bytes, filename: str) -> Path:
    ext = Path(filename or "bin").suffix.lower() or ".bin"
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".webm"}:
        raise ValueError("仅支持 png / jpg / webp / gif / mp4 / mov / webm")
    dest = tools_dir(user_id) / f"{uuid.uuid4().hex[:12]}{ext}"
    dest.write_bytes(data)
    return dest


# Sử dụng ffmpeg để kết hợp nhiều ảnh thành một (ảnh chính ngang/chi tiết dọc)
def collage_images(paths: list[Path], dest: Path, *, vertical: bool) -> None:
    ffmpeg = shutil.which(get_settings().ffmpeg_path) or shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("未找到 ffmpeg，无法拼接图片")
    if len(paths) < 2:
        shutil.copy2(paths[0], dest)
        return
    inputs: list[str] = []
    for p in paths[:4]:
        inputs.extend(["-i", str(p)])
    n = min(len(paths), 4)
    scaled = "".join(f"[{i}:v]scale=720:-2[s{i}];" for i in range(n))
    labels = "".join(f"[s{i}]" for i in range(n))
    layout = "vstack" if vertical else "hstack"
    filt = f"{scaled}{labels}{layout}=inputs={n}[out]"
    cmd = [ffmpeg, "-y", *inputs, "-filter_complex", filt, "-map", "[out]", str(dest)]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not dest.exists():
        raise RuntimeError((proc.stderr or "拼接失败")[-800:])


# Vincent Picture / Picture Picture / Picture Picture / Câu đố thương mại điện tử: Gọi đồng bộ Seedream hoặc ffmpeg
async def run_image_tool(
    db: AsyncSession,
    user: User,
    *,
    tool_id: str,
    prompt: str,
    negative: str,
    ratio: str | None,
    strength: str | None,
    mode: str | None,
    pack: str | None,
    files: list[Path],
) -> dict:
    ark = get_ark()
    size = ratio_to_size(ratio)
    refs: list[str] = []
    full_prompt = (prompt or "").strip()

    if tool_id == "t2i":
        if len(full_prompt) < 4:
            raise ValueError("请填写提示词")
    elif tool_id in {"i2i", "i2p"}:
        if not files:
            raise ValueError("请上传参考图")
        refs = [publish_public(files[0])]
        if tool_id == "i2i":
            full_prompt = f"{full_prompt or '保持主体，生成风格一致的变体'}。{strength_hint(strength)}"
        else:
            mode_prompt = PRODUCT_PROMPTS.get(mode or "白底图", PRODUCT_PROMPTS["白底图"])
            full_prompt = f"{mode_prompt}。{full_prompt}".strip("。")
            if (mode or "白底图") == "详情长图":
                size = RATIO_SIZE["9:16"]
            elif mode == "场景图":
                size = RATIO_SIZE["16:9"]
    elif tool_id == "ecom":
        pack_name = pack or "主图拼接"
        if pack_name == "卖点海报":
            if not files:
                raise ValueError("请上传商品图")
            refs = [publish_public(files[0])]
            full_prompt = f"{ECOM_POSTER}。{full_prompt}".strip("。")
        else:
            if len(files) < 2:
                raise ValueError("拼接至少上传 2 张图片")
            dest = tools_dir(user.id) / f"collage_{uuid.uuid4().hex[:8]}.jpg"
            collage_images(files, dest, vertical=pack_name == "详情排版")
            url = publish_public(dest)
            return {"kind": "image", "urls": [url], "status": "succeeded"}
    else:
        raise ValueError("不支持的生图工具")

    result = await ark.gen_image(
        full_prompt,
        negative,
        refs or None,
        project_id=0,
        shot_no=user.id,
        size=size,
    )
    await record_seedream_image_usage(
        db,
        user_id=user.id,
        model=get_settings().model_image,
        domain="studio",
        image_result=result,
        extra_raw={"tool_id": tool_id},
    )
    url = result.local_url or result.remote_url or ""
    if url:
        url = ensure_public_url(url) or url
    return {"kind": "image", "urls": [url], "status": "succeeded"}


def _dispatch_tool_image(run_id: int) -> str:
    """Bắt đầu tác vụ nền vẽ công cụ."""
    import asyncio

    asyncio.create_task(execute_image_tool_run(run_id))
    return f"local-{run_id}"


# Đồng bộ hóa xác minh số dư trước khi tham gia nhóm (phù hợp với ước tính khấu trừ run_billed_ephemeral)
async def _ensure_image_tool_balance(db: AsyncSession, user: User, tool_id: str) -> None:
    if not billing_active(user):
        return
    synthetic = TaskRun(domain="studio", task_type="tool_image", payload={"tool_id": tool_id})
    need = await estimate_task_fen(db, synthetic)
    available = int(user.balance_fen or 0)
    if available < need:
        raise ValueError(f"余额不足：需要 ¥{need/100:.2f}，当前 ¥{available/100:.2f}，请先充值")


# Gửi tác vụ tạo hình ảnh: task_id được trả về ngay lập tức và quá trình tạo thực tế được thực thi ở chế độ nền
async def enqueue_image_tool(
    db: AsyncSession,
    user: User,
    *,
    tool_id: str,
    prompt: str,
    negative: str,
    ratio: str | None,
    strength: str | None,
    mode: str | None,
    pack: str | None,
    files: list[Path],
    params: dict,
) -> dict:
    await _ensure_image_tool_balance(db, user, tool_id)
    row = ToolRun(
        user_id=user.id,
        tool_id=tool_id,
        kind="image",
        status="queued",
        prompt=(prompt or "").strip()[:2000],
        params={
            **(params or {}),
            "file_paths": [str(p) for p in files],
        },
    )
    db.add(row)
    await db.flush()
    task_id = _dispatch_tool_image(row.id)
    row.task_id = task_id
    await db.flush()
    return {
        "kind": "image",
        "urls": [],
        "task_id": task_id,
        "status": "queued",
        "message": "生图任务已提交，请稍候",
        "run_id": row.id,
    }


# Thực thi tác vụ tạo hình ảnh được xếp hàng đợi ở chế độ nền và ghi lại tool_runs
async def execute_image_tool_run(run_id: int) -> dict:
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        row = await db.get(ToolRun, run_id)
        if not row:
            return {"ok": False, "error": "run_not_found"}
        if row.status == "succeeded" and row.urls:
            return {"ok": True, "run_id": run_id}

        user = await db.get(User, row.user_id)
        if not user:
            row.status = "failed"
            row.error = "用户不存在"
            await db.commit()
            return {"ok": False, "error": row.error}

        stored = row.params if isinstance(row.params, dict) else {}
        file_paths = [Path(p) for p in stored.get("file_paths") or [] if p]
        row.status = "running"
        await db.commit()

        try:
            async def _exec() -> dict:
                return await run_image_tool(
                    db,
                    user,
                    tool_id=row.tool_id,
                    prompt=row.prompt or "",
                    negative=str(stored.get("negative") or ""),
                    ratio=stored.get("ratio") or None,
                    strength=stored.get("strength") or None,
                    mode=stored.get("mode") or None,
                    pack=stored.get("pack") or None,
                    files=file_paths,
                )

            billing_task, data = await run_billed_ephemeral(
                db,
                user,
                domain="studio",
                task_type="tool_image",
                executor=_exec,
                payload={"tool_id": row.tool_id, "run_id": run_id},
                commit=False,
            )
            urls = ensure_public_urls(list(data.get("urls") or []))
            row.kind = str(data.get("kind") or "image")
            row.status = str(data.get("status") or "succeeded")
            row.urls = urls
            row.preview_url = urls[0] if urls else row.preview_url
            row.error = None
            params = dict(row.params or {})
            params["billing_task_id"] = billing_task.id
            row.params = params
            await db.commit()
            return {"ok": True, "run_id": run_id, "urls": urls, "billing_task_id": billing_task.id}
        except Exception as exc:  # noqa: BLE001
            row.status = "failed"
            row.error = str(exc)[:512]
            await db.commit()
            logger.exception("execute_image_tool_run failed run_id=%s", run_id)
            return {"ok": False, "run_id": run_id, "error": row.error}


# Trạng thái tác vụ vẽ của công cụ thăm dò ý kiến.
async def poll_image_tool_task(db: AsyncSession, user: User, task_id: str) -> dict:
    stmt = select(ToolRun).where(ToolRun.user_id == user.id, ToolRun.task_id == task_id)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        return {"status": "failed", "kind": "image", "urls": [], "error": "任务不存在"}

    if row.status == "succeeded":
        row = await hydrate_tool_run_urls(db, row)
        return {"status": "succeeded", "kind": "image", "urls": list(row.urls or [])}
    if row.status == "failed":
        return {
            "status": "failed",
            "kind": "image",
            "urls": [],
            "error": row.error or "生成失败",
        }

    return {"status": "running", "kind": "image", "urls": []}


# Wen Sheng Video/Video Sheng Video: Đầu tiên lấy khung hình tĩnh ra rồi gửi Seedance, quay lại task_id
async def start_video_tool(
    db: AsyncSession,
    user: User,
    *,
    tool_id: str,
    prompt: str,
    ratio: str | None,
    duration_raw: str | None,
    motion: str | None,
    files: list[Path],
) -> dict:
    ark = get_ark()
    duration = duration_seconds(duration_raw)
    still_path: Path | None = None
    preview_url: str | None = None

    if tool_id == "t2v":
        text = (prompt or "").strip()
        if len(text) < 4:
            raise ValueError("请填写视频脚本")
        still = await ark.gen_image(
            f"{text}。电影感静帧，无文字",
            "文字，字幕，水印，logo",
            project_id=0,
            shot_no=user.id,
            size=ratio_to_size(ratio or "9:16"),
        )
        await record_seedream_image_usage(
            db,
            user_id=user.id,
            model=get_settings().model_image,
            domain="studio",
            image_result=still,
            extra_raw={"tool_id": "t2v-still"},
        )
        preview_url = still.local_url or still.remote_url
        if preview_url:
            published = storage.republish_url(preview_url, sync=True)
            if published:
                preview_url = published
        image_url = preview_url or still.remote_url
        video_prompt = text
    elif tool_id == "v2v":
        if not files:
            raise ValueError("请上传源视频或首帧图")
        src = files[0]
        if src.suffix.lower() in {".mp4", ".mov", ".webm"}:
            still_path = tools_dir(user.id) / f"frame_{uuid.uuid4().hex[:8]}.jpg"
            if not extract_video_poster_frame(src, still_path):
                raise ValueError("无法从视频抽取首帧")
        else:
            still_path = src
        image_url = publish_public(still_path)
        preview_url = image_url
        video_prompt = f"{(prompt or '保持主体，变换画面风格').strip()}。{motion_hint(motion)}"
    else:
        raise ValueError("不支持的视频工具")

    if not image_url:
        raise ValueError("缺少首帧图，无法生成视频")

    task_id = await ark.gen_video_i2v(
        image_url,
        video_prompt,
        duration,
        resolution="480p",
        generate_audio=False,
    )
    digest = hashlib.md5(f"{user.id}:{task_id}".encode()).hexdigest()[:8]
    logger.info("tool video queued user=%s tool=%s task=%s hash=%s", user.id, tool_id, task_id, digest)
    return {
        "kind": "video",
        "urls": [],
        "task_id": task_id,
        "status": "queued",
        "preview_url": preview_url,
        "message": "视频生成中，请稍候",
    }


# Nhiệm vụ video truy vấn đơn; nếu thành công, hãy tải xuống và đồng bộ hóa OSS
async def poll_video_task(user: User, task_id: str) -> dict:
    ark = get_ark()
    result = await ark.fetch_task_once(task_id)
    usage = {
        "total_tokens": int(result.total_tokens or 0),
        "completion_tokens": int(result.completion_tokens or 0),
    }
    if result.status == "succeeded" and result.url:
        dest = tools_dir(user.id) / f"v_{task_id[-10:]}.mp4"
        if result.url.startswith("/static/"):
            url = ensure_public_url(result.url) or result.url
        elif dest.exists() and dest.stat().st_size > 1000:
            url = publish_public(dest)
        else:
            await ark.download_result_media(result.url, dest)
            url = publish_public(dest)
        return {
            "status": "succeeded",
            "kind": "video",
            "urls": [url],
            "usage": usage,
            "raw_usage": result.raw_usage,
        }
    if result.status == "failed":
        return {
            "status": "failed",
            "kind": "video",
            "urls": [],
            "error": result.error or "生成失败",
            "usage": usage,
            "raw_usage": result.raw_usage,
        }
    return {"status": "running", "kind": "video", "urls": [], "usage": usage}


# Viết một thế hệ công cụ vào tool_runs (URL kết quả được ưu tiên trong OSS)
async def persist_tool_run(
    db: AsyncSession,
    *,
    user_id: int,
    tool_id: str,
    prompt: str,
    params: dict,
    data: dict,
) -> ToolRun:
    urls = ensure_public_urls(list(data.get("urls") or []))
    preview = ensure_public_url(data.get("preview_url")) or (urls[0] if urls else None)
    row = ToolRun(
        user_id=user_id,
        tool_id=tool_id,
        kind=str(data.get("kind") or "image"),
        status=str(data.get("status") or "succeeded"),
        prompt=(prompt or "").strip()[:2000],
        preview_url=preview,
        urls=urls,
        task_id=data.get("task_id"),
        params=params or None,
        error=data.get("error"),
    )
    db.add(row)
    await db.flush()
    return row


# Nhấn Seedance task_id để ghi lại kết quả video (đồng bộ OSS)
async def update_tool_run_task(db: AsyncSession, user_id: int, task_id: str, data: dict) -> None:
    stmt = select(ToolRun).where(ToolRun.user_id == user_id, ToolRun.task_id == task_id)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        return
    row.status = str(data.get("status") or row.status)
    if data.get("urls"):
        urls = ensure_public_urls(list(data["urls"]))
        row.urls = urls
        if not row.preview_url and urls:
            row.preview_url = urls[0]
        elif row.preview_url:
            row.preview_url = ensure_public_url(row.preview_url)
    if data.get("error"):
        row.error = str(data["error"])[:512]
    await db.flush()


# Khi đọc, chuyển URL cục bộ tới OSS và ghi lại vào thư viện
async def hydrate_tool_run_urls(db: AsyncSession, row: ToolRun) -> ToolRun:
    changed = False
    urls = ensure_public_urls(list(row.urls or []))
    if urls != list(row.urls or []):
        row.urls = urls
        changed = True
    preview = ensure_public_url(row.preview_url) or (urls[0] if urls else None)
    if preview != row.preview_url:
        row.preview_url = preview
        changed = True
    if changed:
        await db.flush()
    return row


# Nhận bản ghi tạo của người dùng hiện tại theo id
async def get_tool_run(db: AsyncSession, user_id: int, run_id: int) -> ToolRun | None:
    stmt = select(ToolRun).where(ToolRun.user_id == user_id, ToolRun.id == run_id)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        return None
    return await hydrate_tool_run_urls(db, row)


# Liệt kê các bản ghi tạo công cụ của người dùng hiện tại trong các trang
async def list_tool_runs(
    db: AsyncSession,
    user_id: int,
    *,
    page: int,
    page_size: int,
) -> tuple[list[ToolRun], int]:
    where = ToolRun.user_id == user_id
    total = int(await db.scalar(select(func.count()).select_from(ToolRun).where(where)) or 0)
    stmt = (
        select(ToolRun)
        .where(where)
        .order_by(ToolRun.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = list((await db.execute(stmt)).scalars().all())
    hydrated: list[ToolRun] = []
    for row in rows:
        hydrated.append(await hydrate_tool_run_urls(db, row))
    return hydrated, total
