"""根据角色设定生成音色描述提示词（供 TTS / Seedance reference_audio）。"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.models_drama import DramaAsset, DramaProject
from app.services.drama.llm import drama_chat_text
from app.services.drama.voice_synthesis import build_voice_sample_text
from app.services.voices import infer_drama_speaker_from_prompt

logger = logging.getLogger(__name__)

VOICE_PROMPT_SYSTEM = """Bạn là đạo diễn lồng tiếng phim ngắn. Căn cứ vào thiết lập nhân vật, hãy xuất ra một đoạn «Mô tả chất giọng» dùng cho nghe thử TTS và âm thanh tham chiếu (reference_audio) của video Seedance.

Yêu cầu:
1. Chỉ xuất ra một mô tả bằng tiếng Việt, từ 50–120 từ, không JSON, không tiêu đề, không để trong dấu ngoặc kép.
2. Phải nêu rõ hoặc có thể suy đoán được: cảm giác độ tuổi, giới tính, chất giọng (trong trẻo/trầm ấm/khàn/giọng trẻ thơ...), tốc độ nói, độ nhả chữ, ngữ điệu và sắc thái cảm xúc chủ đạo.
3. Phải bám sát thân phận, tính cách nhân vật và thể loại câu chuyện (cổ trang, thần thoại, đô thị, huyền bí...).
4. Viết theo giọng điệu «Chỉ dẫn tuyển diễn viên lồng tiếng», giúp mô hình TTS và video dễ hiểu, tránh viết lời thoại hoặc tóm tắt cốt truyện."""

WHITESPACE_PATTERN = re.compile(r"\s+")


# 从剧本摘要中按名称查找角色
def find_summary_character(summary: dict[str, Any] | None, name: str) -> dict[str, Any] | None:
    if not summary or not name:
        return None
    target = name.strip()
    for ch in summary.get("characters") or []:
        if isinstance(ch, dict) and str(ch.get("name") or "").strip() == target:
            return ch
    return None


# 合并资产 params 与摘要字段，组装 LLM 输入
def build_character_voice_context(
    asset: DramaAsset,
    summary_char: dict[str, Any] | None = None,
) -> str:
    params = asset.params if isinstance(asset.params, dict) else {}
    summary = summary_char or {}

    def pick(*keys: str) -> str:
        for key in keys:
            raw = params.get(key)
            if raw is None and summary:
                raw = summary.get(key)
            text = str(raw or "").strip()
            if text:
                return text
        return ""

    lines = [f"Tên nhân vật: {asset.name or 'Chưa đặt tên'}"]
    mapping = [
        ("Danh xưng", pick("title")),
        ("Vai trò", pick("roleType")),
        ("Nhãn cốt lõi", pick("coreTags")),
        ("Thân thế bối cảnh", pick("identityBackground")),
        ("Quá trình trưởng thành", pick("growthExperience")),
        ("Tính cách", pick("personality")),
        ("Mối quan hệ", pick("relationships")),
        ("Đường phát triển", pick("growthArc")),
        ("Khí chất ngoại hình", pick("visualImage", "visualPrompt")),
        ("Giới thiệu nhân vật", pick("introText", "intro")),
    ]
    for label, value in mapping:
        if value:
            lines.append(f"{label}: {value}")
    return "\n".join(lines)


# 清洗 LLM 输出的音色描述
def normalize_voice_prompt_text(raw: str) -> str:
    text = (raw or "").strip()
    text = re.sub(r"^[\"'「『]|[\"'」』]$", "", text).strip()
    text = WHITESPACE_PATTERN.sub(" ", text)
    return text[:200]


# 无 LLM 时的规则兜底
def fallback_voice_prompt(asset: DramaAsset, summary_char: dict[str, Any] | None = None) -> str:
    params = asset.params if isinstance(asset.params, dict) else {}
    summary = summary_char or {}
    name = asset.name or "角色"
    role = str(params.get("roleType") or summary.get("roleType") or "").strip()
    personality = str(params.get("personality") or summary.get("personality") or "").strip()
    visual = str(params.get("visualImage") or summary.get("visualImage") or "").strip()

    age_gender = "青年"
    if any(k in f"{role}{personality}{visual}" for k in ("童", "少年", "幼")):
        age_gender = "少年"
    elif any(k in f"{role}{personality}{visual}" for k in ("老", "翁", "婆", "长")):
        age_gender = "中老年"
    if any(k in f"{role}{personality}{visual}" for k in ("女", "娘", "妃", "后", "妹")):
        tone = f"{age_gender}女声，吐字清晰，语速自然偏慢"
    elif any(k in f"{role}{personality}{visual}" for k in ("男", "公", "王", "将", "伯", "禹")):
        tone = f"{age_gender}男声，吐字清晰，语速沉稳"
    else:
        tone = f"{age_gender}声线，吐字清晰，语速适中"

    mood = "语气平和"
    if personality:
        if any(k in personality for k in ("冷", "峻", "狠", "刚")):
            mood = "语气冷峻克制"
        elif any(k in personality for k in ("温", "柔", "善", "仁")):
            mood = "语气温厚柔和"
        elif any(k in personality for k in ("活", "皮", "俏", "灵")):
            mood = "语气活泼清亮"

    return f"{name}：{tone}，{mood}，贴合{role or '角色'}身份。"


async def suggest_voice_prompt_for_character(
    asset: DramaAsset,
    project: DramaProject,
) -> tuple[str, str, str]:
    """根据角色资产与剧本摘要生成音色描述、推荐 speaker 与试听台词。"""
    summary = None
    if project.script and isinstance(project.script.summary, dict):
        summary = project.script.summary
    summary_char = find_summary_character(summary, asset.name or "")
    context = build_character_voice_context(asset, summary_char)

    logger.info(
        "生成音色提示词 project_id=%s asset_id=%s name=%s context_len=%s",
        project.id,
        asset.id,
        asset.name,
        len(context),
    )
    raw = await drama_chat_text(
        VOICE_PROMPT_SYSTEM,
        f"Vui lòng tạo mô tả chất giọng cho nhân vật sau:\n\n{context}",
        temperature=0.6,
        max_tokens=512,
    )
    prompt = normalize_voice_prompt_text(raw)
    if len(prompt) < 8:
        prompt = fallback_voice_prompt(asset, summary_char)
    name = asset.name or "角色"
    speaker = infer_drama_speaker_from_prompt(prompt, character_name=name, asset_id=asset.id)
    sample_text = build_voice_sample_text(prompt, name, short=False)
    return prompt, speaker, sample_text
