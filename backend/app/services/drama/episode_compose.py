"""Phim đa dạng về truyện tranh và phim truyền hình: mã hóa lại khung hình thống nhất rồi ghép nối (tương thích với các thông số HEVC không nhất quán của từng ống kính)."""

from __future__ import annotations

import asyncio
import logging
import tempfile
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models_drama import DramaEpisode, DramaProject
from app.services import storage as storage_svc
from app.services.drama.output_settings import resolve_episode_video_output, target_pixel_size
from app.services.ffmpeg_compose import _run, _scale_pad, _which

logger = logging.getLogger("app.drama.episode_compose")


# Chuẩn hóa ống kính đơn thành độ phân giải mục tiêu (H.264 + AAC) để tạo điều kiện thuận lợi cho việc ghép nối sao chép luồng tiếp theo
def _normalize_clip(src: Path, dest: Path, width: int, height: int) -> None:
    ffmpeg = _which("ffmpeg")
    vf = _scale_pad(width, height)
    _run(
        [
            ffmpeg,
            "-y",
            "-i",
            str(src),
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-ar",
            "44100",
            "-ac",
            "2",
            "-movflags",
            "+faststart",
            str(dest),
        ]
    )


# Nối các đoạn đã chuẩn hóa (sao chép luồng)
def _concat_normalized(paths: list[Path], output: Path) -> None:
    ffmpeg = _which("ffmpeg")
    with tempfile.TemporaryDirectory(prefix="drama_ep_concat_") as tmp:
        tmp_path = Path(tmp)
        concat_list = tmp_path / "concat.txt"
        concat_list.write_text(
            "\n".join(f"file '{p.resolve().as_posix()}'" for p in paths),
            encoding="utf-8",
        )
        merged = tmp_path / "merged.mp4"
        _run(
            [
                ffmpeg,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_list),
                "-c",
                "copy",
                "-movflags",
                "+faststart",
                str(merged),
            ]
        )
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(merged.read_bytes())


# Đảm bảo video từ xa/cục bộ rơi vào đường dẫn cục bộ mà ffmpeg có thể đọc được
async def _ensure_clip_local(url: str, cache_dir: Path, index: int) -> Path:
    local = storage_svc.local_path_from_url(url)
    if local is not None:
        if not local.exists():
            await storage_svc.ensure_local_media(url, local)
        if local.exists() and local.stat().st_size > 0:
            return local
    dest = cache_dir / f"src_{index:03d}.mp4"
    await storage_svc.ensure_local_media(url, dest)
    if not dest.exists() or dest.stat().st_size <= 0:
        raise RuntimeError(f"Không thể tải video phân cảnh: {url[:120]}")
    return dest


# Mã hóa lại và ghép nối thống nhất theo cài đặt tập; quay lại URL có thể tải xuống
async def compose_episode_video(
    db: AsyncSession,
    *,
    episode: DramaEpisode,
    project: DramaProject,
    fragment_ids: list[int] | None = None,
) -> str:
    frags = sorted(episode.fragments or [], key=lambda f: f.sort_order)
    if fragment_ids:
        allow = {int(x) for x in fragment_ids}
        frags = [f for f in frags if f.id in allow]
    clips = [(f.id, (f.video or "").strip()) for f in frags if (f.video or "").strip()]
    if not clips:
        raise RuntimeError("Tập này chưa có video phân cảnh nào để ghép")

    ratio, resolution = resolve_episode_video_output(episode.params, project.params)
    width, height = target_pixel_size(ratio, resolution)

    out_dir = storage_svc.project_dir(project.id)
    out_path = out_dir / f"episode_{episode.id}_compose.mp4"

    with tempfile.TemporaryDirectory(prefix=f"drama_ep_{episode.id}_") as tmp:
        tmp_path = Path(tmp)
        src_dir = tmp_path / "src"
        norm_dir = tmp_path / "norm"
        src_dir.mkdir()
        norm_dir.mkdir()

        local_srcs: list[Path] = []
        for idx, (_fid, url) in enumerate(clips):
            local_srcs.append(await _ensure_clip_local(url, src_dir, idx))

        normalized: list[Path] = []
        for idx, src in enumerate(local_srcs):
            dest = norm_dir / f"seg_{idx:03d}.mp4"
            await asyncio.to_thread(_normalize_clip, src, dest, width, height)
            normalized.append(dest)

        await asyncio.to_thread(_concat_normalized, normalized, out_path)

    published = storage_svc.publish_local(out_path, sync=True)
    if published and str(published).startswith(("http://", "https://", "/static/")):
        url = str(published)
    else:
        rel = "/static/" + str(out_path.relative_to(storage_svc.STATIC_ROOT)).replace("\\", "/")
        url = storage_svc.to_public_url(rel)
    logger.info(
        "episode compose done episode_id=%s clips=%s size=%sx%s url=%s",
        episode.id,
        len(clips),
        width,
        height,
        url[:120],
    )
    return url


# Đang tải các tập (bao gồm cả các đoạn) để tổng hợp
async def load_episode_for_compose(db: AsyncSession, episode_id: int) -> DramaEpisode | None:
    from sqlalchemy import select

    return (
        await db.execute(
            select(DramaEpisode)
            .where(DramaEpisode.id == episode_id)
            .options(selectinload(DramaEpisode.fragments))
        )
    ).scalar_one_or_none()
