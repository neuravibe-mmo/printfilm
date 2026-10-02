"""根据角色/场景设定解析资产生图提示词（规则 + LLM）。"""

from __future__ import annotations

import logging
import re
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models_drama import DramaAsset, DramaProject
from app.services.billing import record_llm_chat_line
from app.services.drama.llm import drama_chat_text
from app.services.llm_client import LlmUnavailableError
from app.services.drama.seed import _episode_bodies
from app.services.drama.seed_asset_params import (
    build_scene_params,
    compose_character_visual_text,
)
from app.services.drama.voice_prompt import find_summary_character

logger = logging.getLogger(__name__)

WEAK_PROMPT_PATTERN = re.compile(
    r"^(character|scene|prop|material|none|image|audio|video)\s+\S+$",
    re.IGNORECASE,
)

# 模板化套话：出现且总长偏短则视为需 AI 重写
GENERIC_TEMPLATE_MARKERS = (
    "影视级写实环境空间",
    "构图层次分明、光影有戏剧张力",
    "适合短剧横屏拍摄",
    "影视级写实人物",
    "白底全身定妆照",
    "材质与氛围清晰，构图简洁",
    "影视级静物/空镜",
)

MIN_PROMPT_LEN: dict[str, int] = {
    "character": 120,
    "scene": 100,
    "prop": 70,
    "material": 70,
}

CHARACTER_VISUAL_SYSTEM = """Bạn là đạo diễn chỉ đạo tạo hình mỹ thuật phim ngắn, viết «Mô tả hình ảnh trực quan» cho việc tạo ảnh nhân vật (Seedream).

Ví dụ tốt (chỉ dùng tham khảo về độ chi tiết và cách viết, không sao chép nguyên văn):
"Nam, khoảng hai mươi tuổi, vóc dáng thanh mảnh, gương mặt mang nét mộc mạc và anh dũng của thiếu niên miền sơn cước, làn da bánh mật khỏe khoắn. Tóc búi bằng trâm gỗ mộc, mặc giáp nhẹ kết bằng lông vũ, khoác áo vải thô nâu ngoài, eo thắt dây da thú, chân mang dép cỏ. Khí chất nhanh nhẹn, hóm hỉnh, ánh mắt sáng rực, khóe miệng luôn nở nụ cười, như một thợ săn trẻ tuổi có thể thấu hiểu tiếng thú."

Yêu cầu xuất ra:
1. Chỉ xuất ra một đoạn văn bằng tiếng Việt, từ 150–380 từ, không JSON, không tiêu đề, không để trong dấu ngoặc kép, không dùng nhãn trường như "Tính cách:".
2. Phải cụ thể và khả thi để quay/vẽ: giới tính, độ tuổi, khuôn mặt, ngũ quan, kiểu tóc, vóc dáng, lớp trang phục (chất liệu/màu sắc/hoa văn), phụ kiện, đạo cụ, tư thế, thần thái.
3. Chuyển hóa thân phận, tính cách, quan hệ thành đặc điểm thị giác nhìn thấy được (ví dụ "điềm tĩnh" → vai lưng thẳng tắp, ánh mắt nhìn sâu lắng).
4. Phù hợp thể loại câu chuyện và phong cách mỹ thuật dự án; mô tả phải tương thích với bảng tạo hình nhân vật nền trắng (3 góc nhìn toàn thân chính diện/nghiêng/lưng + ảnh cận mặt + ảnh bán thân), không viết các chỉ lệnh bố cục kỹ thuật.
5. Nghiêm cấm sáo rỗng chung chung (như "ngũ quan rõ nét", "khí chất xuất chúng"), cấm tóm tắt cốt truyện và lời thoại."""

SCENE_VISUAL_SYSTEM = """Bạn là chỉ đạo mỹ thuật bối cảnh phim ngắn, viết «Mô tả không gian môi trường» cho việc tạo ảnh bối cảnh (Seedream).

Ví dụ tốt (chỉ dùng tham khảo độ chi tiết):
"Khu lều trại dã chiến của công trường trị thủy thời thượng cổ, ánh sáng tự nhiên gay gắt vào buổi chiều. Tiền cảnh là nền đất nện lầy lội với sọt tre đan, dây thừng rải rác; trung cảnh có nhiều lều bạt vải thô bố trí so le, ngoài lều cắm cọc gỗ treo da thú và cờ lông vũ. Hậu cảnh nhìn thấy rừng núi thưa thớt cùng ánh phản chiếu từ bãi sông xa xa, không khí phảng phất khói lửa và bụi đất, tông màu đất và xanh rêu xám, khung cảnh phim ngắn màn hình ngang toát lên sự khẩn trương của lao động."

Yêu cầu xuất ra:
1. Chỉ xuất ra một đoạn văn bằng tiếng Việt, từ 150–380 từ, không JSON, không tiêu đề, không để trong dấu ngoặc kép.
2. Phải nêu rõ: loại không gian, cảm giác thời đại, yếu tố bao quanh và mặt đứng (cửa ra vào/cửa sổ/bức tường/kiến trúc), phân khu chức năng, bài trí then chốt, ánh sáng, tông màu, không khí.
3. Lấy môi trường làm chủ thể, không mô tả đặc tả nhân vật; có thể tả dấu vết sinh hoạt (dấu chân, tàn tro, vệt sáng).
4. Mô tả phải tương thích với ảnh tham khảo thiết kế bối cảnh (kết hợp góc nhìn ngang + nhìn từ trên xuống, mặt đứng bên trái, chi tiết phân khu bên phải), không viết chỉ lệnh bố cục kỹ thuật.
5. Kết hợp các hành động △ và đạo cụ trong trích đoạn phân cảnh để tái hiện không gian có thể quay được.
6. Nghiêm cấm các câu sáo rỗng chung chung như "đẳng cấp điện ảnh", "bố cục phân tầng rõ ràng"."""

PROP_VISUAL_SYSTEM = """Bạn là chuyên viên mỹ thuật đạo cụ phim ngắn, viết «Mô tả thị giác bản thể đạo cụ» cho tạo ảnh Seedream.

Yêu cầu xuất ra:
1. Chỉ xuất ra một đoạn văn bằng tiếng Việt, từ 100–220 từ, không JSON, không tiêu đề, không để trong dấu ngoặc kép.
2. Phải nêu rõ: loại vật phẩm, hình dáng tổng thể và tỷ lệ, phân tầng chất liệu, màu sắc, kết cấu then chốt (khe hở/cơ quan/khắc chữ/hoa văn), độ hao mòn cũ kỹ, biểu tượng kịch tính.
3. Mô tả phải tương thích với bảng thiết kế đạo cụ nền trắng (3 góc nhìn chính diện/nghiêng/lưng + đặc tả bộ phận then chốt + đặc tả chất liệu kết cấu), không viết chỉ lệnh bố cục kỹ thuật.
4. Lấy vật phẩm làm chủ thể, không vẽ nhân vật cầm nắm hay chân dung người; nghiêm cấm sáo rỗng chung chung."""

MATERIAL_VISUAL_SYSTEM = """Bạn là chuyên viên mỹ thuật không khí phim ngắn, viết mô tả cảnh trống / ảnh tĩnh không khí cho Seedream.
Xuất ra 100–220 từ bằng tiếng Việt: cỡ cảnh, bố cục, ánh sáng, tông màu, cảm xúc bầu không khí, gợi ý chuyển động (khói/nước/ánh sáng), phù hợp tỷ lệ màn hình ngang 16:9. Không có cận cảnh mặt nhân vật. Không JSON."""


# 是否命中模板套话且整体偏短
def is_generic_template_prompt(text: str) -> bool:
    stripped = (text or "").strip()
    if len(stripped) >= 180:
        return False
    hits = sum(1 for marker in GENERIC_TEMPLATE_MARKERS if marker in stripped)
    return hits >= 1 or (stripped.startswith("场景：") and len(stripped) < 120)


# 判断当前提示词是否过短、占位或模板化
def is_weak_visual_prompt(prompt: str, asset_name: str, kind: str) -> bool:
    text = (prompt or "").strip()
    kind_lower = (kind or "").strip().lower()
    min_len = MIN_PROMPT_LEN.get(kind_lower, 60)
    if len(text) < min_len:
        return True
    name = (asset_name or "").strip()
    if name and text.lower() in {f"{kind_lower} {name}".lower(), name.lower()}:
        return True
    if WEAK_PROMPT_PATTERN.match(text):
        return True
    if is_generic_template_prompt(text):
        return True
    # 角色若只有「身份：」「标签：」字段堆叠而无足够 visualImage 密度
    if kind_lower == "character" and text.count("：") >= 3 and len(text) < 160:
        label_hits = sum(1 for label in ("身份：", "定位：", "标签：", "性格：", "背景：") if label in text)
        if label_hits >= 2 and "，" not in text[:40]:
            return True
    return False


# 从资产 params 与摘要拼角色上下文
def build_character_visual_context(
    asset: DramaAsset,
    summary_char: dict[str, Any] | None = None,
    summary: dict[str, Any] | None = None,
) -> str:
    params = asset.params if isinstance(asset.params, dict) else {}
    summary_char = summary_char or {}

    def pick(*keys: str) -> str:
        for key in keys:
            raw = params.get(key)
            if raw is None and summary_char:
                raw = summary_char.get(key)
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
        ("Đường phát triển nhân vật", pick("growthArc")),
        ("Mô tả ngoại hình hiện có", pick("visualImage", "visualPrompt")),
    ]
    for label, value in mapping:
        if value:
            lines.append(f"{label}: {value}")
    if summary:
        for key, label in (
            ("storyType", "Thể loại câu chuyện"),
            ("oneLineStory", "Một câu tóm tắt"),
            ("coreHook", "Điểm lôi cuốn chính"),
        ):
            val = str(summary.get(key) or "").strip()
            if val:
                lines.append(f"{label}: {val}")
        syn = str(summary.get("synopsis") or "").strip()
        if syn:
            lines.append(f"Tóm tắt cốt truyện: {syn[:500]}")
    return "\n".join(lines)


# Từ params + tóm tắt kịch bản ghép prompt tạo ảnh nhân vật mặc định
def fallback_character_visual_prompt(
    asset: DramaAsset,
    summary_char: dict[str, Any] | None = None,
) -> str:
    params = asset.params if isinstance(asset.params, dict) else {}
    merged = {**(summary_char or {}), **{k: v for k, v in params.items() if v}}
    if asset.name and not merged.get("name"):
        merged["name"] = asset.name
    text = compose_character_visual_text(merged)
    if text:
        return normalize_visual_prompt_text(text)
    name = asset.name or "Nhân vật"
    return normalize_visual_prompt_text(
        f"{name}, thanh niên, vóc dáng cân đối, diện mạo rõ nét, trang phục và tóc tai phù hợp với bối cảnh kịch bản, "
        f"đứng toàn thân trên nền trắng, thần thái tự nhiên, ảnh tạo hình điện ảnh."
    )


# 从场戏正文提取与场景名相关的摘录
def collect_scene_excerpts(bodies: list[str], scene_name: str, max_chars: int = 3200) -> str:
    target = (scene_name or "").strip()
    if not target:
        return ""
    chunks: list[str] = []
    for body in bodies:
        if target not in body:
            continue
        for block in re.split(r"(?=###\s*场)", body):
            head = block[:280]
            if target in head or target in block[:160]:
                snippet = block.strip()
                if len(snippet) > 40:
                    chunks.append(snippet[:1200])
    if not chunks:
        for body in bodies:
            idx = body.find(target)
            if idx >= 0:
                start = max(0, idx - 200)
                chunks.append(body[start : idx + 600].strip())
    return "\n---\n".join(chunks[:5])[:max_chars]


# 规则拼接场景生图提示词
def fallback_scene_visual_prompt(
    asset: DramaAsset,
    summary: dict[str, Any] | None,
    episode_bodies: list[str] | None = None,
) -> str:
    story_type = str((summary or {}).get("storyType") or "").strip()
    base = build_scene_params(asset.name or "场景", story_type)["visualPrompt"]
    excerpt = collect_scene_excerpts(episode_bodies or [], asset.name or "")
    if excerpt:
        return normalize_visual_prompt_text(f"{base}。场戏环境与动作参考：{excerpt[:400]}")
    return normalize_visual_prompt_text(base)


# 清洗 LLM 输出
def normalize_visual_prompt_text(raw: str) -> str:
    text = (raw or "").strip()
    text = re.sub(r"^[\"'「『]|[\"'」』]$", "", text).strip()
    text = re.sub(r"^(视觉形象描述|环境描述|道具描述)[:：]\s*", "", text)
    text = re.sub(r"\s+", " ", text)
    return text[:680]


# 合并规则稿与 LLM 稿，避免过短
def merge_visual_prompts(rule_prompt: str, llm_prompt: str, *, min_len: int = 100) -> str:
    rule = normalize_visual_prompt_text(rule_prompt)
    llm = normalize_visual_prompt_text(llm_prompt)
    if len(llm) >= min_len and not is_generic_template_prompt(llm):
        return llm
    if rule and llm:
        merged = normalize_visual_prompt_text(f"{llm}。{rule}" if len(llm) < len(rule) else f"{rule}。{llm}")
        if len(merged) >= min_len:
            return merged
    return llm or rule


async def _llm_visual_prompt(
    system: str,
    user: str,
    *,
    min_len: int = 80,
    db: AsyncSession | None = None,
    user_id: int | None = None,
    drama_project_id: int | None = None,
) -> str:
    raw = await drama_chat_text(system, user, temperature=0.6, max_tokens=1024)
    prompt = normalize_visual_prompt_text(raw)
    if db is not None and user_id is not None:
        await record_llm_chat_line(
            db,
            user_id=user_id,
            domain="drama",
            drama_project_id=drama_project_id,
        )
    return prompt if len(prompt) >= min_len else ""


async def resolve_visual_prompt_for_asset(
    asset: DramaAsset,
    project: DramaProject,
    incoming_prompt: str | None = None,
    *,
    force_refresh: bool = False,
    strict_llm: bool = False,
    db: AsyncSession | None = None,
) -> str:
    """解析资产生图用的用户描述（过短/模板化则规则 + LLM 补全）。"""
    kind = (asset.type or "character").lower()
    name = asset.name or ""
    params = asset.params if isinstance(asset.params, dict) else {}
    stored = str(
        params.get("visualPrompt") or params.get("visualImage") or incoming_prompt or ""
    ).strip()

    summary: dict[str, Any] | None = None
    if project.script and isinstance(project.script.summary, dict):
        summary = project.script.summary
    bodies = _episode_bodies(project.script.episode_content) if project.script else []

    if not force_refresh and stored and not is_weak_visual_prompt(stored, name, kind):
        return stored

    min_len = MIN_PROMPT_LEN.get(kind, 80)
    llm_bill = {"db": db, "user_id": project.user_id, "drama_project_id": project.id}

    if kind == "character":
        summary_char = find_summary_character(summary, name)
        rule_prompt = fallback_character_visual_prompt(asset, summary_char)

        context = build_character_visual_context(asset, summary_char, summary)
        style_id = str((project.params or {}).get("image_style_id") or "").strip()
        if style_id:
            context += f"\nID phong cách hình ảnh dự án: {style_id}"
        try:
            llm = await _llm_visual_prompt(
                CHARACTER_VISUAL_SYSTEM,
                f"Vui lòng tạo mô tả hình ảnh trực quan cho nhân vật sau:\n\n{context}",
                min_len=80,
                **llm_bill,
            )
            prompt = merge_visual_prompts(rule_prompt, llm, min_len=min_len)
            if len(prompt) >= min_len or len(prompt) >= 80:
                return prompt
            if strict_llm:
                raise RuntimeError(f"Prompt AI cho nhân vật '{name}' quá ngắn ({len(prompt)} ký tự)")
        except LlmUnavailableError:
            raise
        except Exception as exc:
            if strict_llm:
                raise RuntimeError(f"Tạo prompt AI cho nhân vật '{name}' thất bại") from exc
            logger.exception("角色视觉提示词 LLM 失败 asset_id=%s", asset.id)
        return rule_prompt

    if kind == "scene":
        rule_prompt = fallback_scene_visual_prompt(asset, summary, bodies)

        excerpt = collect_scene_excerpts(bodies, name)
        story_bits = []
        if summary:
            story_bits.append(f"Thể loại câu chuyện: {summary.get('storyType') or ''}")
            story_bits.append(f"Một câu tóm tắt: {summary.get('oneLineStory') or ''}")
            syn = str(summary.get("synopsis") or "").strip()
            if syn:
                story_bits.append(f"Tóm tắt: {syn[:500]}")
        user_msg = "\n".join(
            [
                f"Tên cảnh: {name}",
                *story_bits,
                f"Trích đoạn phân cảnh:\n{excerpt}" if excerpt else "（Tạm chưa có trích đoạn phân cảnh, hãy bổ sung hợp lý dựa vào tên cảnh và thể loại câu chuyện）",
            ]
        )
        try:
            llm = await _llm_visual_prompt(SCENE_VISUAL_SYSTEM, user_msg, min_len=80, **llm_bill)
            prompt = merge_visual_prompts(rule_prompt, llm, min_len=min_len)
            if len(prompt) >= min_len or len(prompt) >= 80:
                return prompt
            if strict_llm:
                raise RuntimeError(f"Prompt AI cho bối cảnh '{name}' quá ngắn ({len(prompt)} ký tự)")
        except LlmUnavailableError:
            raise
        except Exception as exc:
            if strict_llm:
                raise RuntimeError(f"Tạo prompt AI cho bối cảnh '{name}' thất bại") from exc
            logger.exception("场景视觉提示词 LLM 失败 asset_id=%s", asset.id)
        return rule_prompt

    if kind in {"prop", "material", "none"}:
        rule_prompt = stored or normalize_visual_prompt_text(
            f"{name}, {'đạo cụ then chốt' if kind == 'prop' else 'cảnh không khí'}, "
            f"chi tiết chất liệu rõ nét, giàu tính kịch, hậu cảnh đơn giản."
        )

        system = PROP_VISUAL_SYSTEM if kind == "prop" else MATERIAL_VISUAL_SYSTEM
        ctx = f"Tên: {name}\n"
        if summary:
            ctx += f"Thể loại câu chuyện: {summary.get('storyType') or ''}\n"
        if stored:
            ctx += f"Mô tả hiện có: {stored}\n"
        excerpt = collect_scene_excerpts(bodies, name)
        if excerpt:
            ctx += f"Trích đoạn kịch bản liên quan:\n{excerpt[:800]}"
        try:
            llm = await _llm_visual_prompt(system, ctx, min_len=60, **llm_bill)
            prompt = merge_visual_prompts(rule_prompt, llm, min_len=min_len)
            if len(prompt) >= 60:
                return prompt
            if strict_llm:
                raise RuntimeError(f"Prompt AI cho '{name}' quá ngắn ({len(prompt)} ký tự)")
        except LlmUnavailableError:
            raise
        except Exception as exc:
            if strict_llm:
                raise RuntimeError(f"Tạo prompt AI cho '{name}' thất bại") from exc
            logger.exception("%s 视觉提示词 LLM 失败 asset_id=%s", kind, asset.id)
        return rule_prompt

    if stored and len(stored) >= min_len:
        return stored
    return normalize_visual_prompt_text(f"{name}, cảnh tĩnh/vật thể điện ảnh, chất liệu và không khí rõ nét, bố cục súc tích.")
