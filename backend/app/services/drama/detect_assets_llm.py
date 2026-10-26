"""AI LLM service for detecting candidate assets in a drama fragment content."""

from __future__ import annotations

import logging
import re
from typing import Any

from app.services.drama.llm import drama_chat_json

logger = logging.getLogger(__name__)

DETECT_ASSETS_SYSTEM = """Bạn là trợ lý AI chuyên phân tích kịch bản điện ảnh, phim ngắn và hoạt hình.
Nhiệm vụ của bạn là đọc kỹ nội dung của một phân cảnh cụ thể và đối chiếu với danh sách các nhân vật (hoặc cảnh quay, đạo cụ) có trong Kho tài sản của dự án.
Hãy xác định chính xác những nhân vật nào THỰC SỰ xuất hiện, có mặt, tham gia hành động hoặc có lời thoại trong phân cảnh này.

Quy tắc bắt buộc:
1. CHỈ chọn những nhân vật THỰC SỰ có mặt, xuất hiện trong khung hình hoặc có lời thoại trực tiếp trong nội dung phân cảnh được cung cấp.
2. TUYỆT ĐỐI KHÔNG chọn nhân vật nếu họ chỉ được người khác nhắc tên gián tiếp qua lời nói mà bản thân không hề có mặt trong cảnh.
3. TUYỆT ĐỐI KHÔNG chọn tất cả danh sách nếu họ không có trong cảnh. Chỉ chọn những người thực sự xuất hiện.
4. Chỉ trả về ID và Tên của các nhân vật nằm trong danh sách ứng viên được cung cấp.
5. Trả về đúng định dạng JSON thuần túy (không kèm markdown):
{
  "detected_ids": [1, 2],
  "detected_names": ["Tên 1", "Tên 2"]
}
"""


def _fallback_strict_detect(
    content: str,
    candidates: list[dict[str, Any]],
) -> dict[str, list[Any]]:
    """Phát hiện khẩn cấp dự phòng khi LLM không khả dụng (chỉ so khớp chính xác tên người nói hoặc tên đầy đủ)."""
    if not content or not candidates:
        return {"detected_ids": [], "detected_names": []}

    text = content.lower()
    # Tìm tên người nói thoại: 【Thoại...】Tên: hoặc Tên:
    speaker_re = re.compile(
        r"(?:【(?:thoại|dialogue|đối thoại|lời thoại|hình ảnh|visual)[^】]*】\s*)?([^\n:：【】@()（）]+)(?:\s*[\(（][^\)）]*[\)）])?\s*[:：]",
        re.IGNORECASE,
    )
    speakers = {m.group(1).strip().lower() for m in speaker_re.finditer(content) if m.group(1).strip()}

    matched_ids: list[int] = []
    matched_names: list[str] = []

    for c in candidates:
        cid = int(c.get("id") or 0)
        cname = str(c.get("name") or "").strip()
        if not cname:
            continue
        cname_lower = cname.lower()

        # 1. So khớp người nói chính xác
        is_speaker = False
        for sp in speakers:
            if sp == cname_lower or (len(cname_lower) >= 4 and sp == cname_lower):
                is_speaker = True
                break

        # 2. So khớp từ nguyên vẹn trong văn bản (ranh giới từ để tránh match chuỗi con)
        pattern = rf"(?:\b|(?<=\W)){re.escape(cname_lower)}(?:\b|(?=\W))"
        in_text = bool(re.search(pattern, text))

        if is_speaker or in_text:
            if cid not in matched_ids:
                matched_ids.append(cid)
                matched_names.append(cname)

    return {"detected_ids": matched_ids, "detected_names": matched_names}


async def detect_assets_with_llm(
    content: str,
    candidate_assets: list[dict[str, Any]],
    *,
    asset_type: str = "character",
) -> dict[str, list[Any]]:
    """Gửi nội dung phân cảnh và danh sách tài sản ứng viên lên AI để nhận diện các mục xuất hiện."""
    cleaned_content = (content or "").strip()
    if not cleaned_content or not candidate_assets:
        return {"detected_ids": [], "detected_names": []}

    # Lọc ứng viên theo loại nếu được chỉ định
    candidates: list[dict[str, Any]] = []
    for item in candidate_assets:
        itype = str(item.get("type") or "character")
        if asset_type and asset_type != "all" and itype != asset_type:
            continue
        candidates.append(item)

    if not candidates:
        return {"detected_ids": [], "detected_names": []}

    candidate_id_map: dict[int, dict[str, Any]] = {
        int(c.get("id") or 0): c for c in candidates if int(c.get("id") or 0) > 0
    }
    candidate_name_map: dict[str, int] = {
        str(c.get("name") or "").strip().lower(): int(c.get("id") or 0)
        for c in candidates
        if str(c.get("name") or "").strip() and int(c.get("id") or 0) > 0
    }

    # Soạn prompt cho AI
    candidate_lines: list[str] = []
    for c in candidates:
        cid = c.get("id")
        cname = c.get("name")
        intro = c.get("intro") or ""
        aliases = c.get("aliases") or []
        alias_str = f", Tên gọi khác: {', '.join(aliases)}" if aliases else ""
        intro_str = f" - Giới thiệu/Vai trò: {intro}" if intro else ""
        candidate_lines.append(f"- ID {cid}: \"{cname}\"{intro_str}{alias_str}")

    candidates_block = "\n".join(candidate_lines)

    user_prompt = (
        f"【Nội dung phân cảnh cần phân tích】:\n"
        f"{cleaned_content}\n\n"
        f"【Danh sách ứng viên trong Kho tài sản ({asset_type})】:\n"
        f"{candidates_block}\n\n"
        f"Dựa vào nội dung phân cảnh trên, hãy phân tích xem nhân vật/tài sản nào trong danh sách trên THỰC SỰ xuất hiện.\n"
        f"Trả về kết quả dưới định dạng JSON:\n"
        f'{{"detected_ids": [id1, id2], "detected_names": ["Tên 1", "Tên 2"]}}'
    )

    try:
        raw_res = await drama_chat_json(
            DETECT_ASSETS_SYSTEM,
            user_prompt,
            temperature=0.1,
            max_tokens=1024,
        )
    except Exception as exc:
        logger.warning("Lỗi gọi LLM detect assets: %s, chuyển sang fallback đối soát nghiêm ngặt", exc)
        return _fallback_strict_detect(cleaned_content, candidates)

    if not isinstance(raw_res, dict):
        logger.warning("LLM trả về kết quả không phải dict: %s", raw_res)
        return _fallback_strict_detect(cleaned_content, candidates)

    detected_ids: list[int] = []
    detected_names: list[str] = []

    # 1. Trích xuất theo detected_ids
    raw_ids = raw_res.get("detected_ids") or []
    if isinstance(raw_ids, list):
        for raw_id in raw_ids:
            try:
                cid = int(raw_id)
                if cid in candidate_id_map and cid not in detected_ids:
                    detected_ids.append(cid)
                    detected_names.append(str(candidate_id_map[cid].get("name") or ""))
            except (ValueError, TypeError):
                continue

    # 2. Nếu LLM trả về detected_names mà chưa có trong detected_ids
    raw_names = raw_res.get("detected_names") or []
    if isinstance(raw_names, list):
        for raw_name in raw_names:
            name_clean = str(raw_name).strip().lower()
            if name_clean in candidate_name_map:
                cid = candidate_name_map[name_clean]
                if cid not in detected_ids:
                    detected_ids.append(cid)
                    detected_names.append(str(candidate_id_map[cid].get("name") or ""))

    return {
        "detected_ids": detected_ids,
        "detected_names": detected_names,
    }
