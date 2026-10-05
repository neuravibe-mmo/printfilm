"""Cài đặt trước giọng nói TTS có thể lựa chọn (openpeech túi đậu + bí danh mẫu)."""

from __future__ import annotations

import hashlib
from typing import Any

# id used in API / project.voice_id; speaker is openspeech speaker id
VOICE_PRESETS: list[dict[str, Any]] = [
    {
        "id": "zh_female_cancan_uranus_bigtts",
        "label": "Cancan · Nữ thuyết minh",
        "gender": "female",
        "speaker": "zh_female_cancan_uranus_bigtts",
    },
    {
        "id": "zh_female_tianmeixiaoyuan_uranus_bigtts",
        "label": "Nữ ngọt ngào · Kể chuyện",
        "gender": "female",
        "speaker": "zh_female_tianmeixiaoyuan_uranus_bigtts",
    },
    {
        "id": "zh_female_shuangkuaisisi_uranus_bigtts",
        "label": "Nữ hoạt bát · Đô thị",
        "gender": "female",
        "speaker": "zh_female_shuangkuaisisi_uranus_bigtts",
    },
    {
        "id": "zh_female_vv_uranus_bigtts",
        "label": "Vivi · Nữ cổ phong",
        "gender": "female",
        "speaker": "zh_female_vv_uranus_bigtts",
    },
    {
        "id": "zh_female_xiaohe_uranus_bigtts",
        "label": "Tiểu Hà · Nữ tiêu chuẩn",
        "gender": "female",
        "speaker": "zh_female_xiaohe_uranus_bigtts",
    },
    {
        "id": "zh_male_shaonianzixin_uranus_bigtts",
        "label": "Tử Tân · Thiếu niên nam",
        "gender": "male",
        "speaker": "zh_male_shaonianzixin_uranus_bigtts",
    },
    {
        "id": "zh_male_m191_uranus_bigtts",
        "label": "Vân Chu · Nam trầm ấm",
        "gender": "male",
        "speaker": "zh_male_m191_uranus_bigtts",
    },
    {
        "id": "zh_male_taocheng_uranus_bigtts",
        "label": "Tiểu Thiên · Nam trẻ trung",
        "gender": "male",
        "speaker": "zh_male_taocheng_uranus_bigtts",
    },
    {
        "id": "zh_male_ruyayichen_uranus_bigtts",
        "label": "Dực Thần · Nam nho nhã",
        "gender": "male",
        "speaker": "zh_male_ruyayichen_uranus_bigtts",
    },
    {
        "id": "zh_male_baqiqingshu_uranus_bigtts",
        "label": "Bá Khí · Nam trung niên",
        "gender": "male",
        "speaker": "zh_male_baqiqingshu_uranus_bigtts",
    },
]

# Giọng nhân vật truyện tranh: ghép các giọng nói khác nhau cho các nhân vật khác nhau theo từ khóa (tránh trường hợp tất cả các thành viên đều có giọng giống nhau)
DRAMA_SPEAKER_RULES: list[dict[str, Any]] = [
    {
        "speaker": "zh_male_baqiqingshu_uranus_bigtts",  # Bá Khí · Nam trung niên / Lão niên uy nghiêm
        "gender": "male",
        "keywords": (
            "già", "ông", "lão", "ông lão", "trưởng lão", "tộc trưởng", "thủ lĩnh", "chú", "bác", "trung niên",
            "uy nghiêm", "ông nội", "ông ngoại", "tuổi già", "già nua", "bá khí", "vững chãi",
            "老", "翁", "族老", "长者", "首领", "青叔", "大叔", "威严", "苍", "应龙",
            "爷爷", "祖父", "暮年", "苍老",
        ),
    },
    {
        "speaker": "zh_male_m191_uranus_bigtts",  # Vân Chu · Nam trầm ấm / Đế vương sử thi
        "gender": "male",
        "keywords": (
            "lãnh tụ", "đế vương", "quân chủ", "đại vương", "vua", "trang trọng", "hùng hồn", "sử thi", "thống soái",
            "trầm ấm", "hùng vĩ", "nam trưởng thành", "bi tráng", "dày dặn", "nghiêm nghị", "uy dũng", "trầm",
            "领袖", "帝王", "君主", "大王", "治水", "禹", "庄重", "浑厚", "史诗", "统帅",
            "低沉", "恢弘", "成年男", "管风琴", "悲悯", "厚重",
        ),
    },
    {
        "speaker": "zh_male_ruyayichen_uranus_bigtts",  # Dực Thần · Nam nho nhã / Thư sinh
        "gender": "male",
        "keywords": (
            "nho nhã", "thư sinh", "mưu sĩ", "học giả", "ôn hòa", "thanh tao", "điềm đạm", "tham mưu",
            "kiềm chế", "trầm tĩnh", "lạnh lùng", "thanh lịch", "văn nhã",
            "儒雅", "书生", "谋士", "伯益", "文士", "温和", "清朗", "参谋",
            "克制", "颗粒", "偏冷",
        ),
    },
    {
        "speaker": "zh_male_shaonianzixin_uranus_bigtts",  # Tử Tân · Thiếu niên nam / Trong trẻo
        "gender": "male",
        "keywords": (
            "thiếu niên", "giọng thiếu niên", "trong trẻo", "tươi sáng", "ngây thơ", "tuổi trẻ", "dậy thì",
            "thanh niên trẻ", "lanh lợi", "nhiệt huyết",
            "少年", "少年音", "清亮", "梓辛", "稚", "青春期", "青壮",
        ),
    },
    {
        "speaker": "zh_male_taocheng_uranus_bigtts",  # Tiểu Thiên · Nam trẻ trung / Nắng ấm
        "gender": "male",
        "keywords": (
            "trẻ trung", "thanh niên", "chàng trai", "nhanh nhẹn", "tươi vui", "nắng ấm", "sảng khoái", "bé trai",
            "trẻ em", "chân chất", "tháo vát", "cậu bạn", "ấm áp", "hoạt bát",
            "年轻", "青年", "小哥", "明快", "阳光", "清爽", "童声", "男孩", "儿童",
            "圆润", "憨厚", "小伙",
        ),
    },
    {
        "speaker": "zh_female_vv_uranus_bigtts",  # Vivi · Nữ cổ phong / Nữ vương / Tiên nữ
        "gender": "female",
        "keywords": (
            "cổ trang", "cổ phong", "thần thoại", "chị đại", "nữ vương", "tiên nữ", "nữ thần", "quý phái",
            "kiêu kỳ", "huyền bí", "cao quý",
            "国风", "古风", "神话", "御姐", "女王", "仙", "神女",
        ),
    },
    {
        "speaker": "zh_female_shuangkuaisisi_uranus_bigtts",  # Nữ hoạt bát · Đô thị / Nhanh nhẹn
        "gender": "female",
        "keywords": (
            "sảng khoái", "dứt khoát", "hiện đại", "đô thị", "nhanh nhẹn", "tháo vát", "trong trẻo", "tự tin",
            "hoạt bát", "năng động", "cá tính",
            "爽快", "利落", "都市", "干练", "清脆",
        ),
    },
    {
        "speaker": "zh_female_tianmeixiaoyuan_uranus_bigtts",  # Nữ ngọt ngào · Kể chuyện / Dịu dàng
        "gender": "female",
        "keywords": (
            "dịu dàng", "ngọt ngào", "nhẹ nhàng", "thân thiện", "thiếu nữ", "cô gái", "đáng yêu",
            "ấm áp", "trong sáng", "hiền hậu",
            "温柔", "甜美", "柔和", "亲和", "少女", "姑娘",
        ),
    },
    {
        "speaker": "zh_female_xiaohe_uranus_bigtts",  # Tiểu Hà · Nữ tiêu chuẩn / Bình dân
        "gender": "female",
        "keywords": (
            "phổ thông", "người dân", "quần chúng", "bình dân", "thôn nữ", "phụ nữ", "người mẹ",
            "mộc mạc", "chân thật", "đời thường",
            "通用", "百姓", "群众", "平民", "村妇", "妇人",
        ),
    },
    {
        "speaker": "zh_female_cancan_uranus_bigtts",  # Cancan · Nữ thuyết minh / Lời dẫn
        "gender": "female",
        "keywords": (
            "lời dẫn", "người dẫn chuyện", "thuyết minh", "tường thuật", "phát thanh", "kể chuyện", "dẫn chương trình",
            "chính luận", "tin tức",
            "旁白", "解说", "叙述", "播报",
        ),
    },
]

MALE_HINTS = (
    "nam", "đàn ông", "chàng trai", "cậu bé", "ông", "ông lão", "lão", "bác", "chú", "anh", "cụ", "hoàng đế", "vua", "tướng", "chàng", "cha", "bố", "phụ thân", "thầy",
    "男", "少年", "青年男", "老年男", "公子", "王爷", "少爷", "少年音", "大叔", "青壮",
    "将", "伯", "公", "爷爷", "男孩",
)
FEMALE_HINTS = (
    "nữ", "phụ nữ", "cô gái", "bé gái", "bà", "bà lão", "cô", "chị", "em gái", "mẹ", "tiểu thư", "nàng", "hoàng hậu", "mẫu", "mẫu thân", "nữ hiệp",
    "女", "少女", "女声", "御姐", "小姐", "娘娘", "萝莉", "姑娘", "妇人", "村妇",
)

# Cấu hình giọng Edge-TTS chuẩn tiếng Việt cho từng chất giọng (vi-VN-HoaiMyNeural & vi-VN-NamMinhNeural)
EDGE_TTS_PARAMS_BY_SPEAKER: dict[str, dict[str, str]] = {
    "zh_female_cancan_uranus_bigtts": {"voice": "vi-VN-HoaiMyNeural", "rate": "+0%", "pitch": "+0Hz"},
    "zh_female_tianmeixiaoyuan_uranus_bigtts": {"voice": "vi-VN-HoaiMyNeural", "rate": "-4%", "pitch": "+4Hz"},
    "zh_female_shuangkuaisisi_uranus_bigtts": {"voice": "vi-VN-HoaiMyNeural", "rate": "+8%", "pitch": "+2Hz"},
    "zh_female_vv_uranus_bigtts": {"voice": "vi-VN-HoaiMyNeural", "rate": "-6%", "pitch": "-3Hz"},
    "zh_female_xiaohe_uranus_bigtts": {"voice": "vi-VN-HoaiMyNeural", "rate": "+0%", "pitch": "-1Hz"},
    "zh_male_shaonianzixin_uranus_bigtts": {"voice": "vi-VN-NamMinhNeural", "rate": "+6%", "pitch": "+6Hz"},
    "zh_male_m191_uranus_bigtts": {"voice": "vi-VN-NamMinhNeural", "rate": "-5%", "pitch": "-6Hz"},
    "zh_male_taocheng_uranus_bigtts": {"voice": "vi-VN-NamMinhNeural", "rate": "+5%", "pitch": "+2Hz"},
    "zh_male_ruyayichen_uranus_bigtts": {"voice": "vi-VN-NamMinhNeural", "rate": "-2%", "pitch": "-2Hz"},
    "zh_male_baqiqingshu_uranus_bigtts": {"voice": "vi-VN-NamMinhNeural", "rate": "-6%", "pitch": "-8Hz"},
}

EDGE_TTS_BY_SPEAKER: dict[str, str] = {
    k: v["voice"] for k, v in EDGE_TTS_PARAMS_BY_SPEAKER.items()
}

# Template audio_config.voice_preset aliases → speaker
VOICE_ALIASES: dict[str, str] = {
    "narrator_calm": "zh_female_cancan_uranus_bigtts",
    "warm_storyteller": "zh_female_tianmeixiaoyuan_uranus_bigtts",
    "teacher_clear": "zh_male_shaonianzixin_uranus_bigtts",
    "urban_editorial": "zh_female_shuangkuaisisi_uranus_bigtts",
    "retro_host": "zh_male_shaonianzixin_uranus_bigtts",
    "guqin_narrator": "zh_female_vv_uranus_bigtts",
}


def list_voices() -> list[dict[str, Any]]:
    return list(VOICE_PRESETS)


def infer_speaker_gender(speaker: str) -> str | None:
    """id người nói openspeech → nữ | male."""
    s = (speaker or "").strip().lower()
    if not s:
        return None
    if s.startswith("zh_female_") or s.startswith("saturn_female"):
        return "female"
    if s.startswith("zh_male_") or s.startswith("saturn_male"):
        return "male"
    return None


def edge_tts_params_for_speaker(speaker: str) -> tuple[str, str, str]:
    """Trả về (voice, rate, pitch) chuẩn tiếng Việt cho từng chất giọng."""
    s = (speaker or "").strip()
    if s in EDGE_TTS_PARAMS_BY_SPEAKER:
        p = EDGE_TTS_PARAMS_BY_SPEAKER[s]
        return p["voice"], p["rate"], p["pitch"]

    g = infer_speaker_gender(s)
    if g == "male":
        return "vi-VN-NamMinhNeural", "+0%", "+0Hz"
    return "vi-VN-HoaiMyNeural", "+0%", "+0Hz"


def edge_tts_voice_for_speaker(speaker: str) -> str:
    """Trả về voice Edge-TTS chuẩn tiếng Việt."""
    voice, _, _ = edge_tts_params_for_speaker(speaker)
    return voice


def resolve_speaker(voice_id: str | None, *, template_preset: str | None = None) -> str:
    """Map UI voice id / template alias to openspeech speaker."""
    raw = (voice_id or "").strip() or (template_preset or "").strip()
    if not raw:
        return "zh_female_cancan_uranus_bigtts"
    if raw in VOICE_ALIASES:
        return VOICE_ALIASES[raw]
    for preset in VOICE_PRESETS:
        if preset["id"] == raw or preset["speaker"] == raw:
            return str(preset["speaker"])
    # Pass-through custom speaker ids
    return raw


# Suy ra loa TTS mà nhân vật truyện tranh nên sử dụng (nhiều giọng nói + hàm băm ổn định để chia các ứng viên có cùng số điểm)
def infer_drama_speaker_from_prompt(
    voice_prompt: str,
    *,
    character_name: str = "",
    asset_id: int = 0,
) -> str:
    prompt = f"{character_name} {voice_prompt or ''}"
    prompt_lower = prompt.lower()
    male_score = sum(1 for k in MALE_HINTS if k in prompt or k in prompt_lower)
    female_score = sum(1 for k in FEMALE_HINTS if k in prompt or k in prompt_lower)
    if male_score > female_score:
        gender = "male"
    elif female_score > male_score:
        gender = "female"
    else:
        gender = "male" if asset_id % 2 else "female"

    scored: list[tuple[int, str]] = []
    for rule in DRAMA_SPEAKER_RULES:
        if rule["gender"] != gender:
            continue
        score = sum(1 for kw in rule["keywords"] if kw in prompt or kw.lower() in prompt_lower)
        if score > 0:
            scored.append((score, str(rule["speaker"])))

    if not scored:
        pool = [str(r["speaker"]) for r in DRAMA_SPEAKER_RULES if r["gender"] == gender]
        if not pool:
            return "zh_female_cancan_uranus_bigtts"
        digest = hashlib.md5(f"{asset_id}:{character_name}:{voice_prompt}".encode()).hexdigest()
        return pool[int(digest[:8], 16) % len(pool)]

    max_score = max(s for s, _ in scored)
    top = [speaker for s, speaker in scored if s == max_score]
    if len(top) == 1:
        return top[0]
    digest = hashlib.md5(f"{asset_id}:{character_name}".encode()).hexdigest()
    return top[int(digest[:8], 16) % len(top)]


# Tương thích với các cuộc gọi cũ
def infer_speaker_from_voice_prompt(voice_prompt: str, *, character_name: str = "", asset_id: int = 0) -> str:
    return infer_drama_speaker_from_prompt(voice_prompt, character_name=character_name, asset_id=asset_id)


PREVIEW_TEXT = "Xin chào các bạn, đây là hiệu ứng nghe thử của giọng đọc này, rất phù hợp cho lời dẫn thuyết minh video."
# Hậu tố tên tệp bộ đệm thử giọng: dùng vi_v1 cho giọng tiếng Việt chuẩn Hoài My / Nam Minh
PREVIEW_CACHE_TAG = "vi_v1"


async def ensure_voice_preview(voice_id: str) -> str:
    """Generate (or reuse cached) short TTS sample; return public URL."""
    import hashlib
    from pathlib import Path

    from app.services import storage
    from app.services.ark import get_ark

    speaker = resolve_speaker(voice_id)
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in speaker)[:80]
    cache_dir = Path(__file__).resolve().parents[2] / "static" / "voice_previews"
    cache_dir.mkdir(parents=True, exist_ok=True)
    dest = cache_dir / f"{safe}_{PREVIEW_CACHE_TAG}.mp3"
    if dest.exists() and dest.stat().st_size > 2000:
        return storage.publish_local(dest)

    ark = get_ark()
    shot_no = int(hashlib.md5(speaker.encode()).hexdigest()[:4], 16) % 800 + 100
    url = await ark.tts(PREVIEW_TEXT, speaker, project_id=0, shot_no=shot_no)
    src = storage.local_path_from_url(url)
    if src and src.exists():
        dest.write_bytes(src.read_bytes())
        return storage.publish_local(dest)
    if dest.exists() and dest.stat().st_size > 2000:
        return storage.publish_local(dest)
    return url
