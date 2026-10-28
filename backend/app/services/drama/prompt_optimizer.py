"""Module tối ưu hóa prompt tạo video bằng ChatGPT2API cho Google Veo."""
from __future__ import annotations

import logging
import re
import unicodedata

from app.services.llm_client import chatgpt2api_completions

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert AI Video Prompt Engineer specializing in Google Veo and cinematic video generation.
Your job is to convert a Vietnamese drama script snippet or raw scene description into a single, cohesive, highly descriptive English visual prompt for video generation.

Rules:
1. Output ONLY the English prompt text. Do not add markdown headers, quotes, or conversational phrases.
2. Focus on visual storytelling: subject (who), specific action (what they are doing), setting/environment (where), camera movement (e.g. slow pan, close-up, dolly), lighting, mood, and realistic details.
3. Keep the prompt concise, vivid, and cinematic (around 40-90 words).
4. If there is dialogue, describe the character speaking with appropriate emotion and body language, and specify natural ambient sound.
"""


def to_vietnamese_slug(text: str) -> str:
    """Chuyển đổi tên tiếng Việt có dấu thành dạng viết liền không dấu (PascalCase).
    Ví dụ: 'Nguyễn Văn Lâm' -> 'NguyenVanLam', 'Hộp kim loại' -> 'HopKimLoai'
    """
    if not text:
        return ""
    s = text.replace("đ", "d").replace("Đ", "D")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    words = re.findall(r"[a-zA-Z0-9]+", s)
    return "".join(w.capitalize() for w in words)


def get_asset_type_slug(asset_type: str | None) -> str:
    """Ánh xạ loại asset sang slug tiếng Việt chuẩn: NhanVat, CanhQuay, DaoCu."""
    t = (asset_type or "").lower().strip()
    if t == "character":
        return "NhanVat"
    if t in ("scene", "location"):
        return "CanhQuay"
    if t == "prop":
        return "DaoCu"
    return "NhanVat"


def deduplicate_asset_slug(token: str) -> str:
    """Khử lặp chuỗi slug nếu bị lặp (vd: @asset:14_NhanVat_NguyenVanLam_NhanVat_NguyenVanLam -> @asset:14_NhanVat_NguyenVanLam)."""
    m = re.match(r"^@asset:(\d+)_(.+)$", token)
    if not m:
        return token
    aid, slug = m.group(1), m.group(2)
    parts = slug.split("_")
    half = len(parts) // 2
    if len(parts) >= 2 and len(parts) % 2 == 0:
        first_half = "_".join(parts[:half])
        second_half = "_".join(parts[half:])
        if first_half == second_half:
            return f"@asset:{aid}_{first_half}"
    return token


def replace_asset_tokens_with_slugs(text: str, asset_info_map: dict[int, tuple[str, str | None] | str] | None) -> str:
    """Thay thế @asset:<id> thành @asset:<ID>_<LoaiAsset>_<TênViếtLiềnKhôngDấu>.
    Ví dụ: @asset:14_NhanVat_NguyenVanLam, @asset:58_CanhQuay_NgoiLangDoNatThoiChien, @asset:32_DaoCu_ChiecCaoSat
    Đảm bảo tính idempotent: nếu đã có slug hoặc bị lặp thì thu gọn chuẩn xác, không bao giờ nhân đôi.
    """
    if not text:
        return text

    def _repl(m: re.Match) -> str:
        aid = int(m.group(1))
        info = asset_info_map.get(aid) if asset_info_map else None
        if info:
            if isinstance(info, tuple):
                name, atype = info
            else:
                name, atype = info, None
            type_slug = get_asset_type_slug(atype)
            slug = to_vietnamese_slug(name) if name else f"Asset{aid}"
            return f"@asset:{aid}_{type_slug}_{slug}"
        return deduplicate_asset_slug(m.group(0))

    return re.sub(r"@asset:(\d+)(?:_[a-zA-Z0-9_]+)?", _repl, text)


def clean_raw_script(text: str) -> str:
    """Loại bỏ các thẻ kỹ thuật, thời lượng và chú thích đạo diễn thừa."""
    if not text:
        return ""
    # Xóa các khối kỹ thuật như 【Hình ảnh...】, 【BGM...】
    cleaned = re.sub(r"【[^】]*】", "", text)
    # Xóa các chỉ thị thời lượng như @duration:3
    cleaned = re.sub(r"@duration:\d+", "", cleaned)
    # Xóa các dòng trống thừa
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    return "\n".join(lines)


async def optimize_video_prompt(
    raw_prompt: str,
    *,
    scene_name: str | None = None,
    character_names: list[str] | None = None,
) -> str:
    """Tối ưu kịch bản phân cảnh thô thành English Visual Prompt chuẩn điện ảnh cho Google Veo qua ChatGPT2API."""
    cleaned = clean_raw_script(raw_prompt)
    if not cleaned:
        cleaned = (raw_prompt or "").strip()

    # Nếu prompt đã ngắn gọn và hoàn toàn là tiếng Anh (dưới 200 ký tự không có dấu tiếng Việt)
    if cleaned and len(cleaned) < 200 and not re.search(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", cleaned, re.IGNORECASE):
        return cleaned

    user_input_parts = []
    if scene_name:
        user_input_parts.append(f"Scene: {scene_name}")
    if character_names:
        user_input_parts.append(f"Characters involved: {', '.join(character_names)}")
    user_input_parts.append(f"Script content:\n{cleaned[:2000]}")
    user_text = "\n\n".join(user_input_parts)

    try:
        logger.info("Bắt đầu tối ưu prompt qua ChatGPT2API (input len=%d)", len(cleaned))
        optimized = await chatgpt2api_completions(
            system=SYSTEM_PROMPT,
            user=f"Create a cinematic Google Veo video prompt for this scene:\n\n{user_text}",
            timeout=60.0,
        )
        result = (optimized or "").strip()
        # Loại bỏ ngoặc kép hoặc markdown bọc ngoài nếu có
        result = result.strip('"').strip("'").strip("`").strip()
        if result.startswith("```"):
            result = re.sub(r"^```[a-zA-Z]*\n?", "", result)
            result = re.sub(r"\n?```$", "", result).strip()

        if result:
            logger.info("Tối ưu prompt thành công: %s", result[:100])
            return result
    except Exception as exc:
        logger.warning("Không thể tối ưu prompt qua ChatGPT2API (%s), dùng nội dung rút gọn", exc)

    # Fallback nếu gọi AI gặp sự cố: lấy 300 ký tự nội dung đã dọn dẹp
    return cleaned[:300] if cleaned else "Cinematic drama scene, realistic lighting and emotional atmosphere, 4k"
