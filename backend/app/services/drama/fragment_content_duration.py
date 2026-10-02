"""@duration phân tích cú pháp thẻ trong tập lệnh bảng phân cảnh (phù hợp với EpisodeFragmentDuration ở giao diện người dùng)."""

from __future__ import annotations

import re

from app.services.drama.build_fragments import FRAGMENT_TOTAL_MAX

# Giới hạn trên được đề xuất cho việc lập kế hoạch bảng phân cảnh mới (viết lại bảng phân cảnh/tách quy tắc)
FRAGMENT_CONTENT_DURATION_MAX = FRAGMENT_TOTAL_MAX
# Giới hạn trên của API thế hệ đơn Seedance (các tập lệnh cũ vẫn có thể được gửi tại đây)
SEEDANCE_DURATION_MIN = 4
SEEDANCE_DURATION_MAX = 30

DURATION_MENTION_TOKEN_PATTERN = re.compile(r"@duration:(\d+)")


# Đếm tổng số giây của thẻ thời lượng trong nội dung
def sum_fragment_content_duration_seconds(content: str) -> int:
    total = 0
    for match in DURATION_MENTION_TOKEN_PATTERN.finditer(content or ""):
        seconds = int(match.group(1))
        if seconds > 0:
            total += seconds
    return total


# Định dạng giây thành dấu thời gian MM:SS
def format_duration_timestamp(seconds: int) -> str:
    return f"{seconds // 60:02d}:{seconds % 60:02d}"


# Thay thế thẻ @duration bằng khoảng thời gian lũy tiến
def replace_duration_mentions_with_time_ranges(content: str) -> str:
    elapsed_seconds = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal elapsed_seconds
        seconds = int(match.group(1))
        if seconds <= 0:
            return " "
        range_start = elapsed_seconds
        elapsed_seconds += seconds
        return (
            f"{format_duration_timestamp(range_start)}-{format_duration_timestamp(elapsed_seconds)}"
        )

    return DURATION_MENTION_TOKEN_PATTERN.sub(replace, content or "")


# Phân tích thời lượng của Seedance đã gửi; sử dụng dự phòng khi không có nhãn
def resolve_seedance_duration_from_content(content: str | None, fallback: int = 8) -> int:
    total = sum_fragment_content_duration_seconds(content or "")
    if total <= 0:
        return max(SEEDANCE_DURATION_MIN, min(int(fallback), SEEDANCE_DURATION_MAX))
    return max(SEEDANCE_DURATION_MIN, min(total, SEEDANCE_DURATION_MAX))
