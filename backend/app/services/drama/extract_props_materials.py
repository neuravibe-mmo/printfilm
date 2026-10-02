"""从剧本摘要与分集正文抽取道具（对齐 manju extractPropsMaterials，已停用素材）。"""

from __future__ import annotations

import json
from typing import Any

from app.services.drama.llm import drama_chat_json

SUMMARY_TEXT_MAX = 4000
EPISODE_SAMPLE_MAX = 2500

SYSTEM_PROMPT = """Bạn là điều phối viên mỹ thuật phim ngắn, chịu trách nhiệm tổng hợp danh sách tài sản «Đạo cụ» (props) từ bản tóm tắt kịch bản và nội dung các tập phim để phục vụ tạo ảnh AI tiếp theo.

Đạo cụ (props):
- Các vật phẩm có thể được nhân vật cầm nắm, trao tay, đặc tả (vũ khí, tín vật, công cụ hình phạt, thần khí, văn thư, đồ vật quan trọng...)
- Chỉ giữ lại các đạo cụ then chốt có độ nhận diện cao đối với cốt truyện, khống chế trong khoảng 8–20 món.
- Không xem địa điểm, nhân vật, hiện tượng thời tiết hay cảnh trống không khí là đạo cụ.

Yêu cầu xuất ra:
1. Tên ngắn gọn, dễ nhận diện; visualPrompt viết bằng tiếng Việt, mỗi mục 90–200 từ, có thể dùng trực tiếp làm prompt tạo ảnh.
2. visualPrompt phải bao gồm: chất liệu/hình dáng, màu sắc, kích thước/tỷ lệ, độ hao mòn hoặc cũ kỹ, biểu tượng kịch tính, gợi ý bố cục (cận cảnh/nhìn từ trên xuống...).
3. Phải xuất ra đúng đối tượng JSON (không dùng markdown): {"props":[{"name":"...","visualPrompt":"..."}]}
4. Không xuất ra trường materials / chất liệu cảnh.
"""


# 按名称去重（保留首次）
def _dedupe_by_name(items: list[dict[str, Any]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    result: list[dict[str, str]] = []
    for item in items:
        name = str(item.get("name") or "").strip()
        if not name or name in seen:
            continue
        prompt = str(item.get("visualPrompt") or item.get("visualImage") or "").strip()
        if len(prompt) < 8:
            continue
        seen.add(name)
        result.append({"name": name, "visualPrompt": prompt})
    return result


# 规范化 LLM 返回
def _normalize_payload(raw: Any) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(raw, dict):
        return {"props": [], "materials": []}

    def read_list(key: str) -> list[dict[str, Any]]:
        value = raw.get(key)
        if not isinstance(value, list):
            return []
        out: list[dict[str, Any]] = []
        for item in value:
            if isinstance(item, dict):
                out.append(item)
        return out

    return {"props": read_list("props"), "materials": []}


async def extract_props_materials(
    *,
    summary: dict[str, Any] | None,
    episode_bodies: list[str],
) -> dict[str, list[dict[str, str]]]:
    """调用 LLM 抽取道具（materials 恒为空，兼容旧调用方）。

    Returns:
        {"props": [{"name","visualPrompt"}], "materials": []}
    """
    summary_text = json.dumps(summary or {}, ensure_ascii=False)
    samples = [b.strip() for b in episode_bodies if (b or "").strip()][:6]
    if samples:
        episode_block = "\n\n".join(
            f"【Tập phim mẫu {i + 1}】\n{text[:EPISODE_SAMPLE_MAX]}" for i, text in enumerate(samples)
        )
    else:
        episode_block = "（Tạm thời chưa có nội dung kịch bản phân tập）"

    user = "\n".join(
        [
            "【Tóm tắt kịch bản】",
            summary_text[:SUMMARY_TEXT_MAX],
            "",
            episode_block,
            "",
            "Vui lòng trích xuất props (không xuất materials).",
        ]
    )
    raw = await drama_chat_json(SYSTEM_PROMPT, user, max_tokens=4096)
    normalized = _normalize_payload(raw)
    return {
        "props": _dedupe_by_name(normalized["props"]),
        "materials": [],
    }
