"""TokenFree Giới hạn trên của số lượng hình ảnh tham chiếu video (tách rời khỏi quy tắc nội dung bảng phân cảnh truyện tranh)."""

from __future__ import annotations

# Giới hạn trên cứng cho các plug-in xuôi dòng: có thể gửi tối đa 9 hình ảnh tham chiếu cùng một lúc
MAX_REFERENCE_IMAGES = 9


def cap_url_list(urls: list[str] | None, *, limit: int = MAX_REFERENCE_IMAGES) -> list[str]:
    """Loại bỏ các ảnh trùng lặp và cắt bỏ số lượng ảnh có thể upload lên upstream."""
    out: list[str] = []
    seen: set[str] = set()
    for raw in urls or []:
        url = str(raw or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        out.append(url)
        if len(out) >= max(1, int(limit)):
            break
    return out


def subject_image_budget(*, has_style_board: bool = False, has_continuity: bool = False) -> int:
    """Số lượng ảnh tham khảo chính: tổng số ảnh trừ bảng kiểu và khung kết nối cuối cùng."""
    n = MAX_REFERENCE_IMAGES
    if has_style_board:
        n -= 1
    if has_continuity:
        n -= 1
    return max(1, n)
