"""Nhấp để kiểm tra Kỹ năng viết lại từ nhắc người dùng và giữ tham chiếu @asset."""

from __future__ import annotations

import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agent.runner import run_task_text

# ASSET_TOKEN_RE Tham chiếu nội dung trong canvas/bảng phân cảnh
ASSET_TOKEN_RE = re.compile(r"@asset:\d+")

VIDEO_OPTIMIZE_SYSTEM = """Bạn là đạo diễn viết prompt video Seedance. Căn cứ vào các Agent Skill đã kích hoạt, hãy viết lại prompt của người dùng thành mô tả cảnh quay bằng tiếng Việt phù hợp nhất để tạo video AI.

Quy tắc bắt buộc:
1. Chỉ xuất ra nội dung prompt đã được tối ưu, không tiêu đề, không giải thích, không dùng khối mã markdown, không bọc trong dấu ngoặc kép.
2. BẮT BUỘC giữ nguyên vẹn từng mã tham chiếu `@asset:số` trong prompt của người dùng, không được xóa, sửa, dịch hoặc tách rời.
3. Không tự tiện bịa tên nhân vật hoặc tên bối cảnh chưa xuất hiện; dùng mã tham chiếu @asset thay thế cho việc lặp lại tên người.
4. Giữ đúng ý định ban đầu của người dùng (ai, ở đâu, làm gì), dựa theo Skill để bổ sung khung hình đầu tiên, vị trí đứng, hướng nhìn, ánh sáng, chuyển động máy quay và tương tác vật lý.
5. Ngôn ngữ cụ thể, khả thi để quay/dựng, sử dụng tiếng Việt.
"""

IMAGE_OPTIMIZE_SYSTEM = """Bạn là đạo diễn viết prompt hình ảnh. Căn cứ vào các Agent Skill đã kích hoạt, hãy viết lại prompt của người dùng thành mô tả hình ảnh bằng tiếng Việt phù hợp nhất để tạo ảnh tĩnh AI.

Quy tắc bắt buộc:
1. Chỉ xuất ra nội dung prompt đã được tối ưu, không tiêu đề, không giải thích, không dùng khối mã markdown, không bọc trong dấu ngoặc kép.
2. BẮT BUỘC giữ nguyên vẹn từng mã tham chiếu `@asset:số` trong prompt của người dùng, không được xóa, sửa, dịch hoặc tách rời.
3. Không tự tiện bịa tên nhân vật hoặc tên bối cảnh chưa xuất hiện; dùng mã tham chiếu @asset thay thế cho việc lặp lại tên người.
4. Giữ đúng ý định ban đầu của người dùng, dựa theo Skill để bổ sung bố cục, vị trí ánh sáng, tư thế đứng và hướng nhìn.
5. Ngôn ngữ cụ thể, khả thi để vẽ/dựng, sử dụng tiếng Việt.
"""


def extract_asset_tokens(prompt: str) -> list[str]:
    # Xóa các bản sao và trích xuất @asset:id theo thứ tự xuất hiện
    seen: set[str] = set()
    tokens: list[str] = []
    for match in ASSET_TOKEN_RE.finditer(prompt or ""):
        token = match.group(0)
        if token in seen:
            continue
        seen.add(token)
        tokens.append(token)
    return tokens


def strip_optimize_fences(text: str) -> str:
    # Loại bỏ các khối mã đôi khi có trong mô hình
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-zA-Z]*\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return raw.strip().strip('"').strip("“”")


def restore_asset_tokens(original: str, rewritten: str) -> str:
    # @asset còn thiếu trong mô hình sẽ được trích dẫn ở cuối bài viết
    text = strip_optimize_fences(rewritten)
    missing = [token for token in extract_asset_tokens(original) if token not in text]
    if missing:
        text = f"{text.rstrip()} {' '.join(missing)}".strip()
    return text


def system_prompt_for_task(task: str) -> str:
    # Tối ưu hóa lời nhắc hệ thống theo tác vụ
    if task == "image_prompt":
        return IMAGE_OPTIMIZE_SYSTEM
    return VIDEO_OPTIMIZE_SYSTEM


async def optimize_prompt_with_skills(
    db: AsyncSession,
    user_id: int,
    *,
    prompt: str,
    skill_ids: list[int],
    task: str = "video_prompt",
) -> str:
    """Sử dụng kỹ năng đã chọn để viết lại từ gợi ý; để trống kỹ năng và trả lại như cũ."""
    source = (prompt or "").strip()
    if not source:
        return ""
    if not skill_ids:
        return source
    rewritten = await run_task_text(
        db,
        user_id,
        task=task,
        system=system_prompt_for_task(task),
        user=source,
        temperature=0.4,
        max_tokens=2048,
        skill_ids=skill_ids,
    )
    return restore_asset_tokens(source, rewritten)
