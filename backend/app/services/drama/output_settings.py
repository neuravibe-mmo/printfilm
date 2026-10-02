"""Thông số đầu ra của loạt truyện tranh: thông số tập được ưu tiên, thông số dự án dự phòng."""

from __future__ import annotations

from typing import Any

VALID_RATIOS = frozenset({"9:16", "16:9", "1:1"})
VALID_RESOLUTIONS = frozenset({"480p", "720p", "1080p"})


def _pick_ratio(raw: Any) -> str | None:
    value = str(raw or "").strip()
    return value if value in VALID_RATIOS else None


def _pick_resolution(raw: Any) -> str | None:
    value = str(raw or "").strip()
    return value if value in VALID_RESOLUTIONS else None


# Phân tích khung và định nghĩa đa dạng (đa dạng → dự án → mặc định)
def resolve_episode_video_output(
    episode_params: dict | None,
    project_params: dict | None,
) -> tuple[str, str]:
    ep = episode_params if isinstance(episode_params, dict) else {}
    proj = project_params if isinstance(project_params, dict) else {}
    ratio = _pick_ratio(ep.get("aspect_ratio")) or _pick_ratio(proj.get("aspect_ratio")) or "9:16"
    resolution = (
        _pick_resolution(ep.get("resolution"))
        or _pick_resolution(proj.get("resolution"))
        or "480p"
    )
    return ratio, resolution


# Seedance / Các pixel thường được sử dụng trong phim (các cạnh được đánh số chẵn)
_RATIO_RES_PIXELS: dict[tuple[str, str], tuple[int, int]] = {
    ("9:16", "480p"): (480, 854),
    ("9:16", "720p"): (720, 1280),
    ("9:16", "1080p"): (1080, 1920),
    ("16:9", "480p"): (854, 480),
    ("16:9", "720p"): (1280, 720),
    ("16:9", "1080p"): (1920, 1080),
    ("1:1", "480p"): (480, 480),
    ("1:1", "720p"): (720, 720),
    ("1:1", "1080p"): (1080, 1080),
}


# Chiều rộng và chiều cao của màng mục tiêu đa dạng (được sử dụng để chia tỷ lệ thống nhất trong quá trình nối)
def target_pixel_size(aspect_ratio: str, resolution: str) -> tuple[int, int]:
    key = (aspect_ratio if aspect_ratio in VALID_RATIOS else "9:16",
           resolution if resolution in VALID_RESOLUTIONS else "480p")
    return _RATIO_RES_PIXELS.get(key, (480, 854))


# Suy ra nhãn định dạng chuẩn gần nhất dựa trên kích thước pixel
def infer_aspect_ratio_from_pixels(width: int, height: int) -> str:
    if width <= 0 or height <= 0:
        return "9:16"
    ratio = width / height
    candidates = (("9:16", 9 / 16), ("16:9", 16 / 9), ("1:1", 1.0))
    best = min(candidates, key=lambda item: abs(ratio - item[1]))
    if abs(ratio - best[1]) <= 0.08:
        return best[0]
    return f"{width}×{height}"


# i2v Khung tĩnh không đáy: được tạo theo khung mục tiêu (Seedream 5.0 Pro 2K pixel, tránh vượt quá giới hạn diện tích 4624220)
def seedream_still_size_for_video_ratio(aspect_ratio: str | None) -> str:
    from app.services.drama.seedream_options import SEEDREAM_SIZE_2K

    ratio = _pick_ratio(aspect_ratio) or "9:16"
    return SEEDREAM_SIZE_2K.get(ratio, SEEDREAM_SIZE_2K["9:16"])
