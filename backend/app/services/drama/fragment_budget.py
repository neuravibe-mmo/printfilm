"""Số lượng bảng phân cảnh/ngân sách thời lượng cho toàn bộ tập: Hợp nhất các bản nháp rời rạc để kiểm soát độ dài của một tập duy nhất."""

from __future__ import annotations

import re
from typing import Any

from app.services.drama.build_fragments import (
    EPISODE_DURATION_BUDGET_SEC,
    EPISODE_FRAGMENT_MAX,
    FRAGMENT_DURATION_MAX,
    FRAGMENT_DURATION_MIN,
    FRAGMENT_TOTAL_MAX,
    parse_fragment_timed_blocks,
    repair_fragment_timed_layout,
    split_overlong_fragment_content,
)
from app.services.drama.fragment_asset_limit import (
    FRAGMENT_MAX_CHARACTERS,
    cap_asset_id_list,
)
from app.services.drama.fragment_content_duration import sum_fragment_content_duration_seconds

_DURATION_LINE = re.compile(r"^@duration:\d+\s*$")


def draft_duration_sec(draft: dict[str, Any]) -> int:
    content = str(draft.get("content") or "")
    tagged = sum_fragment_content_duration_seconds(content)
    if tagged > 0:
        return tagged
    try:
        return max(0, int(draft.get("duration_sec") or 0))
    except (TypeError, ValueError):
        return 0


def _merge_unique_ids(left: list[int], right: list[int]) -> list[int]:
    out: list[int] = []
    seen: set[int] = set()
    for raw in [*left, *right]:
        try:
            aid = int(raw)
        except (TypeError, ValueError):
            continue
        if aid in seen:
            continue
        seen.add(aid)
        out.append(aid)
    return out


def _merge_unique_names(left: list[str], right: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for raw in [*left, *right]:
        name = str(raw or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        out.append(name)
    return out


def _strip_leading_cues(content: str) -> str:
    """Khi hợp nhất, hãy xóa gợi ý tiêu đề trùng lặp khỏi các khối tiếp theo và giữ lại văn bản @duration."""
    lines = (content or "").replace("\r\n", "\n").split("\n")
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if not stripped:
            i += 1
            continue
        if _DURATION_LINE.match(stripped):
            break
        if stripped.startswith("【") or stripped.startswith("@asset:"):
            i += 1
            continue
        break
    return "\n".join(lines[i:]).strip()


def _proportional_int_durations(
    raw: list[int],
    target: int,
    *,
    min_d: int = FRAGMENT_DURATION_MIN,
    max_d: int = FRAGMENT_DURATION_MAX,
) -> list[int]:
    """Phân bổ số nguyên giây theo tỷ lệ ban đầu và tổng số phải bằng mục tiêu càng nhiều càng tốt."""
    if not raw or target <= 0:
        return raw
    if len(raw) == 1:
        return [min(max_d, max(min_d, target))]
    total = sum(raw)
    if total <= 0:
        return [min(max_d, max(min_d, target)) for _ in raw]
    if total == target:
        return [min(max_d, max(min_d, d)) for d in raw]
    scaled = [max(min_d, min(max_d, round(d * target / total))) for d in raw]
    guard = 0
    while sum(scaled) > target and guard < 512:
        guard += 1
        idx = max(range(len(scaled)), key=lambda i: scaled[i])
        if scaled[idx] <= min_d:
            break
        scaled[idx] -= 1
    guard = 0
    while sum(scaled) < target and guard < 512:
        guard += 1
        idx = max(range(len(scaled)), key=lambda i: raw[i])
        if scaled[idx] >= max_d:
            break
        scaled[idx] += 1
    return scaled


def _rescale_fragment_duration_tags(content: str, target_sec: int) -> str:
    """Giữ nhiều phân đoạn @duration sau khi hợp nhất/nén, chỉ chia tỷ lệ sao cho tổng bằng target_sec."""
    header, blocks = parse_fragment_timed_blocks(content)
    if not blocks:
        return content
    current = sum(d for d, _ in blocks)
    if current <= 0:
        return content
    target = max(FRAGMENT_DURATION_MIN, min(FRAGMENT_TOTAL_MAX, int(target_sec)))
    new_durs = (
        [min(FRAGMENT_DURATION_MAX, max(FRAGMENT_DURATION_MIN, d)) for d, _ in blocks]
        if current == target
        else _proportional_int_durations([d for d, _ in blocks], target)
    )
    rebuilt: list[str] = [*header]
    for (_, rows), new_d in zip(blocks, new_durs):
        for ln in rows:
            if _DURATION_LINE.match(ln.strip()):
                rebuilt.append(f"@duration:{new_d}")
            else:
                rebuilt.append(ln)
    return "\n".join(rebuilt).strip()


def merge_fragment_drafts(
    a: dict[str, Any],
    b: dict[str, Any],
    *,
    compress: bool = False,
) -> dict[str, Any]:
    tail = _strip_leading_cues(str(b.get("content") or ""))
    head = str(a.get("content") or "").rstrip()
    content = f"{head}\n{tail}".strip() if tail else head
    dur_a = draft_duration_sec(a)
    dur_b = draft_duration_sec(b)
    if compress:
        # Nén vượt quá ngân sách: Thời lượng kết hợp sẽ lớn hơn (chẳng hạn như 15+15→15) và một phần thời gian làm phim về cơ bản sẽ bị xóa.
        duration = min(FRAGMENT_TOTAL_MAX, max(dur_a, dur_b, 1))
    else:
        duration = min(FRAGMENT_TOTAL_MAX, max(dur_a + dur_b, 1))
    tagged = sum_fragment_content_duration_seconds(content)
    if tagged != duration and tagged > 0:
        content = _rescale_fragment_duration_tags(content, duration)
    elif tagged <= 0 and duration > 0:
        content = _rescale_fragment_duration_tags(
            f"{content}\n@duration:{duration}".strip(),
            duration,
        )
    return {
        "content": content,
        "duration_sec": duration,
        "asset_ids": cap_asset_id_list(
            _merge_unique_ids(
                list(a.get("asset_ids") or []),
                list(b.get("asset_ids") or []),
            )
        ),
        "scene_name": a.get("scene_name") or b.get("scene_name"),
        "character_names": _merge_unique_names(
            list(a.get("character_names") or []),
            list(b.get("character_names") or []),
        )[:FRAGMENT_MAX_CHARACTERS],
        "is_opening": bool(a.get("is_opening")),
    }


def _pick_merge_index(drafts: list[dict[str, Any]], *, compress: bool = False) -> int | None:
    best_idx: int | None = None
    best_score = -1
    for i in range(len(drafts) - 1):
        a, b = drafts[i], drafts[i + 1]
        dur_a = draft_duration_sec(a)
        dur_b = draft_duration_sec(b)
        if compress:
            combined = min(FRAGMENT_TOTAL_MAX, max(dur_a, dur_b, 1))
            saved = dur_a + dur_b - combined
            if saved <= 0:
                continue
        else:
            raw = dur_a + dur_b
            # Sau khi hợp nhất, thời lượng được giới hạn ở giới hạn trên cứng của một gương đơn (chẳng hạn như 8+8→15) và số lượng gương vẫn phải được phép nén
            combined = min(raw, FRAGMENT_TOTAL_MAX)
            if raw > FRAGMENT_TOTAL_MAX and combined <= max(dur_a, dur_b):
                continue
            saved = raw - combined
        score = saved * 10 + (100 - combined)
        if str(a.get("scene_name") or "") and str(a.get("scene_name") or "") == str(
            b.get("scene_name") or ""
        ):
            score += 40
        if bool(a.get("is_opening")):
            score -= 50
        if score > best_score:
            best_score = score
            best_idx = i
    return best_idx


def trim_episode_fragment_drafts(
    drafts: list[dict[str, Any]],
    *,
    max_count: int = EPISODE_FRAGMENT_MAX,
    max_total_sec: int = EPISODE_DURATION_BUDGET_SEC,
) -> list[dict[str, Any]]:
    """Hợp nhất các cảnh ngắn liền kề để làm cho số lượng và tổng thời lượng gần với ngân sách phát ngắn."""
    if not drafts:
        return drafts
    merged = [dict(d) for d in drafts]

    while len(merged) > max_count:
        idx = _pick_merge_index(merged)
        if idx is None:
            break
        merged[idx] = merge_fragment_drafts(merged[idx], merged[idx + 1])
        merged.pop(idx + 1)

    while sum(draft_duration_sec(d) for d in merged) > max_total_sec and len(merged) > 1:
        idx = _pick_merge_index(merged, compress=True)
        if idx is None:
            break
        merged[idx] = merge_fragment_drafts(merged[idx], merged[idx + 1], compress=True)
        merged.pop(idx + 1)

    # Sau khi hợp nhất, nếu một dòng vẫn vượt quá giới hạn cứng, hãy nhấn @duration để tách lại (hiếm khi)
    expanded: list[dict[str, Any]] = []
    for draft in merged:
        content = repair_fragment_timed_layout(
            str(draft.get("content") or ""),
            duration_sec=draft_duration_sec(draft),
        )
        draft = {**draft, "content": content}
        if draft_duration_sec(draft) <= FRAGMENT_TOTAL_MAX:
            expanded.append(draft)
            continue
        for chunk, dur in split_overlong_fragment_content(content):
            expanded.append(
                {
                    **draft,
                    "content": chunk,
                    "duration_sec": dur,
                    "asset_ids": cap_asset_id_list(list(draft.get("asset_ids") or [])),
                    "character_names": list(draft.get("character_names") or [])[:FRAGMENT_MAX_CHARACTERS],
                    "is_opening": bool(draft.get("is_opening")) and not expanded,
                }
            )
    for item in expanded:
        item["asset_ids"] = cap_asset_id_list(list(item.get("asset_ids") or []))
        item["character_names"] = list(item.get("character_names") or [])[:FRAGMENT_MAX_CHARACTERS]
    return expanded


def cap_llm_fragment_items(items: list[Any], max_items: int = EPISODE_FRAGMENT_MAX) -> list[Any]:
    """Khi LLM trả về nhiều dòng, hãy hợp nhất các dòng trước rồi chuẩn hóa chúng để tránh chia một tập thành hàng chục cảnh."""
    if len(items) <= max_items:
        return items
    merged: list[dict[str, Any]] = [dict(x) for x in items if isinstance(x, dict)]
    while len(merged) > max_items:
        idx = len(merged) - 2
        if idx < 0:
            break
        a, b = merged[idx], merged[idx + 1]
        a_lines = a.get("lines") or a.get("content") or []
        b_lines = b.get("lines") or b.get("content") or []
        if isinstance(a_lines, str):
            a_lines = [a_lines]
        if isinstance(b_lines, str):
            b_lines = [b_lines]
        a["lines"] = [*list(a_lines), *list(b_lines)]
        dur_a = int(a.get("duration_sec") or 0)
        dur_b = int(b.get("duration_sec") or 0)
        if dur_a or dur_b:
            a["duration_sec"] = min(FRAGMENT_TOTAL_MAX, dur_a + dur_b)
        merged.pop(idx + 1)
    return merged
