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


DETECT_SCENE_SYSTEM = """Bạn là chuyên gia phân tích bối cảnh kịch bản phim.
Nhiệm vụ của bạn là đọc nội dung của một phân cảnh cụ thể và xác định BỐI CẢNH / ĐỊA ĐIỂM (Scene / Location) chính diễn ra phân cảnh đó.

Đầu vào gồm:
1. Nội dung phân cảnh.
2. Danh sách các bối cảnh (cảnh quay) ĐÃ CÓ trong Kho tài sản của dự án (nếu có).

Quy tắc:
1. Xác định địa điểm chính diễn ra phân cảnh (ví dụ: "Phòng khách", "Phòng thí nghiệm", "Quán cà phê", "Bệnh viện", "Văn phòng cảnh sát", "Đường phố ban đêm"...).
2. Nếu địa điểm này tương đồng hoặc trùng khớp với một bối cảnh trong danh sách ĐÃ CÓ (dù tên viết khác đôi chút, ví dụ "Phòng Lab" vs "Phòng thí nghiệm"), hãy CHỌN bối cảnh ĐÃ CÓ đó (trả về matched_id và matched_name).
3. Nếu địa điểm này CHƯA CÓ trong danh sách ĐÃ CÓ: hãy trích xuất một bối cảnh MỚI:
   - name: Tên ngắn gọn của địa điểm (2-5 từ, ví dụ "Phòng thí nghiệm bí mật", "Quán cà phê", "Văn phòng cảnh sát").
   - prompt: Mô tả trực quan ngắn gọn về bối cảnh này để vẽ ảnh minh họa chất lượng cao (ánh sáng, phong cách, chi tiết không gian, nội thất, góc nhìn rộng 16:9).
4. Nếu phân cảnh hoàn toàn trừu tượng hoặc không thể xác định được địa điểm, trả về matched_id: null, new_scene: null.

Trả về kết quả dưới định dạng JSON thuần túy (không kèm markdown):
{
  "matched_id": 123,
  "matched_name": "Tên bối cảnh đã có",
  "new_scene": {
    "name": "Tên bối cảnh mới",
    "prompt": "Mô tả chi tiết bối cảnh"
  }
}
Lưu ý: Nếu đã có matched_id thì new_scene là null; nếu là bối cảnh mới thì matched_id và matched_name là null.
"""


def _fallback_scene_detect(
    content: str,
    candidates: list[dict[str, Any]],
) -> dict[str, Any]:
    """Phát hiện khẩn cấp dự phòng cho bối cảnh khi LLM không khả dụng."""
    text = (content or "").strip()
    if not text:
        return {"matched_id": None, "matched_name": None, "new_scene": None}

    # 1. Kiểm tra xem tên bối cảnh có sẵn nào xuất hiện trong text
    for c in candidates:
        cid = int(c.get("id") or 0)
        cname = str(c.get("name") or "").strip()
        if not cname:
            continue
        if re.search(rf"(?:\b|(?<=\W)){re.escape(cname.lower())}(?:\b|(?=\W))", text.lower()):
            return {"matched_id": cid, "matched_name": cname, "new_scene": None}

    # 2. Quét regex các thẻ phân cảnh phổ biến (Tiếng Việt, Tiếng Anh, Tiếng Trung)
    scene_regexes = [
        r"【(?:Bối cảnh|Cảnh|Địa điểm|Bối cảnh chính|Scene)[:：]\s*([^】\n]+)】",
        r"^(?:NỘI|NGOẠI|NỘI\/NGOẠI|INT|EXT|INT\/EXT)[. \t\/-]+(?:NGÀY|ĐÊM|SÁNG|TỐI|CHIỀU)?[. \t\/-]*(.+)$",
        r"^(?:NGÀY|ĐÊM|SÁNG|TỐI|CHIỀU)?[. \t\/-]*(?:NỘI|NGOẠI|NỘI\/NGOẠI|INT|EXT|INT\/EXT)[. \t\/-]+(.+)$",
        r"^Cảnh\s*\d*[:.]\s*(.+)$",
        r"^(?:日|夜|晨|黄昏|傍晚|凌晨|清晨|午|晚)?[ \t]*(?:内|外|内外)[ \t]+(.+)$",
    ]
    for pattern in scene_regexes:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            raw_name = m.group(1).strip().split("／")[0].split("/")[0].split("-")[0].strip()
            raw_name = re.sub(r"^[0-9]+[.:\s]*", "", raw_name).strip()
            if len(raw_name) >= 2:
                for c in candidates:
                    if str(c.get("name") or "").strip().lower() == raw_name.lower():
                        return {"matched_id": int(c.get("id") or 0), "matched_name": c.get("name"), "new_scene": None}
                return {
                    "matched_id": None,
                    "matched_name": None,
                    "new_scene": {
                        "name": raw_name,
                        "prompt": f"Bối cảnh: {raw_name}, phong cách điện ảnh chân thực, góc rộng, 16:9",
                    },
                }

    # 3. Quét thẻ hình ảnh: 【Hình ảnh: ...】 tìm từ chỉ nơi chốn
    img_match = re.search(r"【Hình ảnh[：:]\s*([^】\n]+)】", text, re.IGNORECASE)
    if img_match:
        img_desc = img_match.group(1).strip()
        loc_match = re.search(r"(?:tại|ở|trong|bên trong|ngoài|bên ngoài)\s+([^,.;]+)", img_desc, re.IGNORECASE)
        if loc_match:
            loc_name = loc_match.group(1).strip().capitalize()
            if 2 <= len(loc_name.split()) <= 6:
                return {
                    "matched_id": None,
                    "matched_name": None,
                    "new_scene": {
                        "name": loc_name,
                        "prompt": f"Bối cảnh: {loc_name}, {img_desc}, góc rộng 16:9",
                    },
                }

    return {"matched_id": None, "matched_name": None, "new_scene": None}


async def detect_or_create_scene_with_llm(
    content: str,
    candidate_scenes: list[dict[str, Any]],
) -> dict[str, Any]:
    """Phân tích nội dung phân cảnh để nhận diện bối cảnh đã có hoặc trích xuất bối cảnh mới."""
    cleaned_content = (content or "").strip()
    if not cleaned_content:
        return {"matched_id": None, "matched_name": None, "new_scene": None}

    candidate_lines: list[str] = []
    for c in candidate_scenes:
        cid = c.get("id")
        cname = c.get("name")
        intro = c.get("intro") or ""
        intro_str = f" - Mô tả: {intro}" if intro else ""
        candidate_lines.append(f"- ID {cid}: \"{cname}\"{intro_str}")

    candidates_block = "\n".join(candidate_lines) if candidate_lines else "(Kho dự án hiện chưa có bối cảnh nào)"

    user_prompt = (
        f"【Nội dung phân cảnh cần phân tích】:\n"
        f"{cleaned_content}\n\n"
        f"【Danh sách bối cảnh ĐÃ CÓ trong kho tài sản】:\n"
        f"{candidates_block}\n\n"
        f"Hãy đọc nội dung phân cảnh và thực hiện nhiệm vụ: nếu địa điểm đã có trong kho thì trả về matched_id, nếu chưa có thì trích xuất new_scene (name và prompt).\n"
        f"Trả về JSON:"
    )

    try:
        raw_res = await drama_chat_json(
            DETECT_SCENE_SYSTEM,
            user_prompt,
            temperature=0.1,
            max_tokens=1024,
        )
    except Exception as exc:
        logger.warning("Lỗi gọi LLM detect scene: %s, chuyển sang fallback", exc)
        return _fallback_scene_detect(cleaned_content, candidate_scenes)

    if not isinstance(raw_res, dict):
        return _fallback_scene_detect(cleaned_content, candidate_scenes)

    matched_id = raw_res.get("matched_id")
    matched_name = raw_res.get("matched_name")
    new_scene = raw_res.get("new_scene")

    if matched_id:
        try:
            mid = int(matched_id)
            c_hit = next((c for c in candidate_scenes if int(c.get("id") or 0) == mid), None)
            if c_hit:
                return {
                    "matched_id": mid,
                    "matched_name": str(c_hit.get("name") or matched_name or ""),
                    "new_scene": None,
                }
        except (ValueError, TypeError):
            pass

    if isinstance(new_scene, dict) and new_scene.get("name"):
        name_clean = str(new_scene.get("name") or "").strip()
        c_hit = next((c for c in candidate_scenes if str(c.get("name") or "").strip().lower() == name_clean.lower()), None)
        if c_hit:
            return {
                "matched_id": int(c_hit.get("id") or 0),
                "matched_name": str(c_hit.get("name") or ""),
                "new_scene": None,
            }
        return {
            "matched_id": None,
            "matched_name": None,
            "new_scene": {
                "name": name_clean,
                "prompt": str(new_scene.get("prompt") or f"Bối cảnh: {name_clean}, bối cảnh điện ảnh chân thực, góc rộng, 16:9").strip(),
            },
        }

    return _fallback_scene_detect(cleaned_content, candidate_scenes)
