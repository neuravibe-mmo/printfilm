"""Drama script agents: summary + episode outline + episode scripts."""

from __future__ import annotations

from typing import Any

from app.services.drama.llm import drama_chat_json
from app.services.drama.script_summary_prompt import (
    SCRIPT_SUMMARY_SYSTEM_PROMPT,
    build_script_summary_user_message,
)

# Văn bản có ngưỡng quá ngắn (độ dài của ký tự tiếng Trung được xấp xỉ bằng cách loại bỏ các khoảng trống)
MIN_EPISODE_CONTENT_CHARS = 450
# Độ dài mục tiêu của một tập phim truyền hình ngắn (khoảng 1–1,5 phút phim hoàn thành, tương ứng với 6–10 cảnh quay)
TARGET_EPISODE_CONTENT_CHARS = 550
EPISODE_SCENE_COUNT_HINT = "2-3 phân cảnh"
# Thêm điểm đánh dấu theo cách thủ công; đường dẫn tự động sẽ không điền vào các bộ trống này
MANUAL_EPISODE_ORIGIN = "manual"
# Phù hợp với giới hạn trên của dự án đã tạo
MAX_DRAMA_EPISODES = 120

# Kế hoạch danh sách tập: Lên khung tập + tên tập
EPISODE_OUTLINE_SYSTEM = """Bạn là chuyên gia biên kịch và lập kế hoạch phim ngắn / web drama chuyên nghiệp, chịu trách nhiệm căn cứ vào ý tưởng gốc và bản tóm tắt kịch bản để lập dàn ý «Số tập + Tiêu đề tập» cho toàn bộ các tập phim.

Yêu cầu xuất ra:
1. Bắt buộc lập đúng số tập theo yêu cầu của người dùng, độ dài mảng episodes phải hoàn toàn khớp với tổng số tập.
2. episodeNumber tăng dần liên tục từ 1, không được nhảy số, không được trùng lặp.
3. Mỗi tập có title là tên tập phim ngắn gọn (khoảng 2–8 từ tiếng Việt), khái quát biến cố chính hoặc xung đột kịch tính của tập, có sức gợi mở và lôi cuốn người xem.
4. Toàn bộ các tập phải bám sát diễn biến mở đầu, phát triển, cao trào và kết thúc trong bản tóm tắt kịch bản; nhịp phim dồn dập, cuốn hút phù hợp với định dạng phim ngắn.
5. Giữa các tập liền kề phải có mối liên kết nhân quả và điểm móc nối (hook) giữ chân người xem.
6. Ngôn ngữ: Sử dụng tiếng Việt chuẩn xác tự nhiên.

Bắt buộc xuất JSON chuẩn:
{"episodes":[{"episodeNumber":1,"title":"Tên tập"}, ...]}"""

# Viết kịch bản chi tiết từng tập theo lô
EPISODE_BATCH_CONTENT_SYSTEM = """Bạn là biên kịch phim ngắn / web drama chuyên nghiệp, chịu trách nhiệm căn cứ vào ý tưởng gốc, tóm tắt kịch bản, kế hoạch phân tập và nội dung các tập đã có để viết kịch bản chi tiết cho các tập phim được chỉ định.

Yêu cầu xuất ra:
1. Mỗi lượt chỉ xuất các tập nằm trong phạm vi chỉ định, độ dài mảng episodes phải hoàn toàn khớp với số tập yêu cầu.
2. episodeNumber phải tương ứng chính xác với các số tập được yêu cầu, không được bỏ sót hoặc tự tạo thêm tập khác.
3. Phải tham khảo và liên kết chặt chẽ với kịch bản các tập đã có để giữ mạch truyện, tính cách nhân vật và bối cảnh nhất quán; đợt đầu tiên viết mở đầu từ Tập 1.
4. Giữa các tập phải có mối liên kết nhân quả, cuối mỗi tập phải để lại nút thắt (hook) gợi tò mò cho tập sau.
5. Bắt buộc xuất định dạng đối tượng: {"episodes":[{"episodeNumber":1,"title":"Tên tập","creative":"Ý tưởng tập","summary":"Tóm tắt tập","content":"..."}]} (không xuất mảng trần).
6. creative là ý tưởng 50–120 từ của tập; summary là tóm tắt diễn biến 80–200 từ; content là nội dung kịch bản chi tiết của tập (không viết quá ngắn).

Yêu cầu định dạng kịch bản (trường content của mỗi tập phải tuân thủ nghiêm ngặt):
1. Tổ chức theo từng cảnh, tiêu đề cảnh định dạng: CẢNH {tập}-{cảnh} (ví dụ Cảnh 2 của Tập 1: CẢNH 1-2)
2. Dòng tiếp theo ngay dưới tiêu đề cảnh ghi rõ thời gian và bối cảnh nội/ngoại, ví dụ: NGÀY NỘI Phòng khách / ĐÊM NGOẠI Sân thượng / SÁNG NGOẠI Ngôi làng
3. Dòng tiếp theo ghi: Nhân vật: Nhân vật A, Nhân vật B (chỉ ghi các nhân vật thực sự xuất hiện trong cảnh)
4. Hành động bắt đầu bằng ký hiệu △ ở đầu dòng riêng biệt; hành động phải cụ thể, trực quan để quay phim (góc máy, vị trí, đạo cụ, biểu cảm)
5. Định dạng lời thoại: Tên nhân vật (cảm xúc/hành động): Lời thoại; lời dẫn ghi "Lời dẫn (VO): ..."; độc thoại ghi "Tên nhân vật (độc thoại): ..."
6. Có thể dùng [Cảnh trống: Mô tả] để khép lại một trường đoạn hoặc phân cảnh
7. Trong content không xuất các tiêu đề thừa như "Tập X" mà đi thẳng vào nội dung cảnh
8. Mỗi tập gồm 2-3 cảnh; mỗi cảnh có 2-3 đoạn hành động △ và 2-3 câu thoại; nhịp độ kịch bản gọn gàng, súc tích
9. Ngôn ngữ: Sử dụng tiếng Việt chuẩn xác tự nhiên, đậm chất kịch bản điện ảnh."""

# Chuyển bản thảo người dùng thành kịch bản phân cảnh quay phim
EPISODE_OPTIMIZE_SYSTEM = """Bạn là biên kịch phim ngắn chuyên nghiệp, chịu trách nhiệm chuyển bản thảo kịch bản thô của người dùng thành kịch bản phân cảnh chi tiết sẵn sàng để quay phim.

Nguyên tắc làm việc:
1. Lấy bản thảo của người dùng làm nòng cốt cho cốt truyện và lời thoại, giữ nguyên nhân vật, xung đột, ý đồ cảnh và các câu thoại then chốt, không tự ý sáng tác câu chuyện khác.
2. Khi bản thảo đã gần chuẩn định dạng, tiến hành chuẩn hóa cấu trúc, bổ sung tiêu đề cảnh, hành động chi tiết và lời thoại rõ ràng.
3. Khi bản thảo chỉ là tóm tắt hoặc dàn ý, hãy mở rộng thành các cảnh quay hoàn chỉnh bám sát dàn ý.
4. Tham khảo ý tưởng gốc, tóm tắt phim và các tập liền kề để giữ thế giới quan và tính cách nhân vật nhất quán.
5. Chỉ xuất đúng tập được yêu cầu, mảng episodes chỉ chứa đúng 1 phần tử.

Yêu cầu định dạng kịch bản (trường content):
1. Định dạng tiêu đề cảnh: CẢNH {tập}-{cảnh} (ví dụ: CẢNH 2-1)
2. Dòng tiếp theo ghi thời gian và bối cảnh (ví dụ: NGÀY NỘI Lớp học / ĐÊM NGOẠI Bờ sông)
3. Dòng tiếp theo ghi: Nhân vật: Nhân vật A, Nhân vật B
4. Hành động bắt đầu bằng △ ở đầu dòng riêng biệt, mô tả cụ thể hình ảnh
5. Lời thoại định dạng: Tên nhân vật (cảm xúc): Lời thoại; lời dẫn dùng "Lời dẫn (VO): ..."
6. Không xuất các dòng thừa "Tập X" trong content
7. Mỗi tập gồm 2-3 cảnh, nhịp phim lôi cuốn
8. Ngôn ngữ: Tiếng Việt chuẩn xác tự nhiên.

Bắt buộc xuất JSON chuẩn:
{"episodes":[{"episodeNumber":1,"title":"Tên tập","content":"..."}]}"""

# Ý tưởng tập → Tóm tắt tập
EPISODE_SUMMARY_FROM_CREATIVE_SYSTEM = """Bạn là chuyên gia biên kịch phim ngắn, căn cứ vào thiết lập toàn phim và ý tưởng ban đầu của tập này để viết «Tóm tắt cốt truyện» cho tập.

Yêu cầu xuất ra:
1. Chỉ xuất đúng tập được yêu cầu, mảng episodes chỉ chứa đúng 1 phần tử.
2. summary là tóm tắt diễn biến 80–200 từ: nhân vật, xung đột, bước ngoặt, nút thắt kết tập; không viết thành kịch bản phân cảnh.
3. Có thể tối ưu hóa title (tên tập 2–8 từ tiếng Việt); không xuất content/body.
4. Tham khảo ý tưởng toàn phim, tóm tắt chung và các tập lân cận để giữ tính cách nhân vật nhất quán.
5. Nếu có danh sách nhân vật đã tạo, ưu tiên dùng đúng tên các nhân vật này.
6. Ngôn ngữ: Sử dụng tiếng Việt chuẩn xác tự nhiên.

Bắt buộc xuất JSON chuẩn:
{"episodes":[{"episodeNumber":1,"title":"Tên tập","summary":"..."}]}"""

# Ý tưởng + Tóm tắt tập → Kịch bản quay chi tiết
EPISODE_BODY_FROM_BRIEF_SYSTEM = """Bạn là biên kịch phim ngắn chuyên nghiệp, căn cứ vào ý tưởng tập và tóm tắt diễn biến để viết kịch bản chi tiết sẵn sàng quay phim.

Yêu cầu xuất ra:
1. Chỉ xuất đúng tập được yêu cầu, mảng episodes chỉ chứa đúng 1 phần tử.
2. Bám sát ý tưởng và tóm tắt của tập, không sáng tác câu chuyện khác.
3. Tham khảo thiết lập toàn phim và kịch bản các tập lân cận để giữ cốt truyện và nhân vật liền mạch.
4. content là nội dung kịch bản chi tiết của tập; không viết quá ngắn.
5. Ưu tiên dùng đúng tên các nhân vật đã có trong danh mục tài sản.

Yêu cầu định dạng kịch bản (trường content):
1. Tổ chức theo cảnh: CẢNH {tập}-{cảnh} (ví dụ CẢNH 2-1)
2. Dòng tiếp theo ghi thời gian và bối cảnh (NGÀY NỘI... / ĐÊM NGOẠI...)
3. Dòng tiếp theo ghi: Nhân vật: Nhân vật A, Nhân vật B
4. Hành động bắt đầu bằng △ ở đầu dòng riêng biệt, mô tả cụ thể hình ảnh trực quan
5. Lời thoại định dạng: Tên nhân vật (cảm xúc): Lời thoại; lời dẫn dùng "Lời dẫn (VO): ..."
6. Không xuất các dòng thừa "Tập X" trong content
7. Mỗi tập gồm 2-3 cảnh; nhịp độ nhanh, kịch tính
8. Ngôn ngữ: Sử dụng tiếng Việt chuẩn xác tự nhiên.

Bắt buộc xuất JSON chuẩn:
{"episodes":[{"episodeNumber":1,"title":"Tên tập","content":"..."}]}"""

# Từ kịch bản có sẵn → Suy ngược ra ý tưởng + tóm tắt tập
EPISODE_BRIEF_FROM_BODY_SYSTEM = """Bạn là chuyên gia biên kịch phim ngắn. Căn cứ vào kịch bản chi tiết đã có của tập phim, hãy suy ngược lại «Ý tưởng cốt lõi» và «Tóm tắt diễn biến» của tập này.

Yêu cầu xuất ra:
1. Chỉ xuất đúng tập được yêu cầu, mảng episodes chỉ chứa đúng 1 phần tử.
2. creative là ý tưởng cốt lõi 50–120 từ: điểm khởi đầu câu chuyện, xung đột chính, điểm lôi cuốn; không viết thành từng cảnh.
3. summary là tóm tắt cốt truyện 80–200 từ: nhân vật, mâu thuẫn, bước ngoặt, nút thắt kết thúc; không viết thành từng cảnh.
4. Có thể tối ưu hóa title (tên tập ngắn gọn 2–8 từ tiếng Việt); không xuất content/body.
5. Trung thực với nội dung đã có trong kịch bản.
6. Ngôn ngữ: Sử dụng tiếng Việt chuẩn xác tự nhiên.

Bắt buộc xuất JSON chuẩn:
{"episodes":[{"episodeNumber":1,"title":"Tên tập","creative":"...","summary":"..."}]}"""


def _format_neighbor_episode_briefs(episodes: list[dict[str, Any]], number: int, limit: int = 3) -> str:
    """Tiêu đề/ý tưởng/tóm tắt của tình tiết liền kề để bổ sung cho đoạn trích của văn bản chính."""
    others = [
        item
        for item in episodes
        if isinstance(item, dict) and int(item.get("episodeNumber") or 0) != number
    ]
    others.sort(key=lambda x: abs(int(x.get("episodeNumber") or 0) - number))
    picked = others[:limit]
    if not picked:
        return "（暂无邻集）"
    blocks: list[str] = []
    for item in sorted(picked, key=lambda x: int(x.get("episodeNumber") or 0)):
        num = item.get("episodeNumber")
        title = item.get("title") or f"第 {num} 集"
        creative = str(item.get("creative") or "").strip()
        summary = str(item.get("summary") or "").strip()
        parts = [f"Tập {num}《{title}》"]
        if creative:
            parts.append(f"Ý tưởng: {creative[:400]}")
        if summary:
            parts.append(f"Tóm tắt: {summary[:500]}")
        blocks.append("\n".join(parts))
    return "\n\n".join(blocks)


def _format_neighbor_episode_bodies(
    episodes: list[dict[str, Any]],
    number: int,
    limit: int = 3,
) -> str:
    """Cùng cấp độ với batch: Lấy đoạn trích từ một số tập gần nhất với tập hiện tại và có văn bản."""
    others = [
        item
        for item in episodes
        if isinstance(item, dict)
        and int(item.get("episodeNumber") or 0) != number
        and str(item.get("body") or item.get("content") or "").strip()
    ]
    others.sort(key=lambda x: abs(int(x.get("episodeNumber") or 0) - number))
    picked = others[:limit]
    if not picked:
        return "(Chưa có nội dung các tập lân cận)"
    blocks: list[str] = []
    for item in sorted(picked, key=lambda x: int(x.get("episodeNumber") or 0)):
        num = item.get("episodeNumber")
        title = item.get("title") or f"Tập {num}"
        body = str(item.get("body") or item.get("content") or "").strip()
        if len(body) > 1800:
            body = body[:1800] + "\n…(Phần trên đã rút gọn)"
        blocks.append(f"Tập {num}. {title}:\n{body}")
    return "\n\n".join(blocks)


def format_character_asset_names_line(names: list[str] | None) -> str:
    """Một dòng tên nhân vật trang điểm cố định, được sử dụng để ràng buộc lời nhắc trong một tập phim."""
    cleaned: list[str] = []
    for raw in names or []:
        name = str(raw or "").strip()
        if name and name not in cleaned:
            cleaned.append(name)
    if not cleaned:
        return "(Chưa có tài sản tạo hình nhân vật; nhân vật mới cần ghi rõ tên đầy đủ trong dòng nhân vật xuất hiện)"
    joined = ", ".join(cleaned[:80])
    return f"Ưu tiên sử dụng các tên nhân vật đã định hình này: {joined}; nhân vật mới cần ghi rõ tên đầy đủ trong dòng nhân vật xuất hiện"


def build_single_episode_context(
    project_summary: dict[str, Any],
    existing: list[dict[str, Any]],
    number: int,
    *,
    project_source: str = "",
    character_asset_names: list[str] | None = None,
) -> list[str]:
    """Một khối ngữ cảnh dày được chia sẻ bởi tóm tắt/nội dung/đầy đủ/tóm tắt/tối ưu hóa cho một tập duy nhất."""
    return [
        f"Ý tưởng ban đầu toàn phim:\n{(project_source or '').strip() or '(Không có)'}",
        f"Tóm tắt kịch bản toàn phim:\n{format_summary_text(project_summary)}",
        f"Kế hoạch phân tập toàn phim:\n{_format_episode_title_list(existing)}",
        f"Nội dung các tập lân cận (trích đoạn {3} tập gần nhất):\n{_format_neighbor_episode_bodies(existing, number)}",
        f"Ý tưởng / Tóm tắt bổ sung của các tập lân cận:\n{_format_neighbor_episode_briefs(existing, number)}",
        f"Tên các nhân vật đã có tạo hình:\n{format_character_asset_names_line(character_asset_names)}",
    ]


async def run_episode_summary_from_creative(
    project_summary: dict[str, Any],
    existing: list[dict[str, Any]],
    number: int,
    creative: str,
    *,
    project_source: str = "",
    title: str | None = None,
    character_asset_names: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Sáng tạo của tập này → tóm tắt cấp độ tập (có thể cập nhật tiêu đề)."""
    brief = (creative or "").strip()
    if len(brief) < 20:
        raise ValueError("Ý tưởng ban đầu của tập này至少 20 字")
    title_text = (title or "").strip() or f"第 {number} 集"
    user_parts = [
        *build_single_episode_context(
            project_summary,
            existing,
            number,
            project_source=project_source,
            character_asset_names=character_asset_names,
        ),
        f"Số tập hiện tại: Tập {number}",
        f"Tên tập hiện tại: {title_text}",
        f"Ý tưởng ban đầu của tập này:\n{brief}",
        "Hãy chỉ xuất title và summary cho tập này.",
    ]
    data = await drama_chat_json(
        EPISODE_SUMMARY_FROM_CREATIVE_SYSTEM,
        "\n\n".join(user_parts),
        max_tokens=4096,
    )
    episodes = data.get("episodes") if isinstance(data, dict) else None
    if not isinstance(episodes, list) or not episodes:
        raise ValueError("模型未返回本集摘要")
    item = episodes[0] if isinstance(episodes[0], dict) else {}
    out_summary = str(item.get("summary") or item.get("synopsis") or "").strip()
    if len(out_summary) < 40:
        raise ValueError("本集摘要过短，请重试")
    out_title = str(item.get("title") or "").strip() or title_text
    return [
        {
            "episodeNumber": number,
            "title": out_title,
            "creative": brief,
            "summary": out_summary,
            "body": "",
        }
    ]


async def run_episode_body_from_brief(
    project_summary: dict[str, Any],
    existing: list[dict[str, Any]],
    number: int,
    *,
    creative: str,
    summary: str,
    project_source: str = "",
    title: str | None = None,
    character_asset_names: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Sáng tạo + tóm tắt của tập này → Bắn xác."""
    brief = (creative or "").strip()
    syn = (summary or "").strip()
    if len(brief) < 10 and len(syn) < 40:
        raise ValueError("请先填写本集创意或摘要")
    title_text = (title or "").strip() or f"第 {number} 集"
    user_parts = [
        *build_single_episode_context(
            project_summary,
            existing,
            number,
            project_source=project_source,
            character_asset_names=character_asset_names,
        ),
        f"Số tập hiện tại: Tập {number}",
        f"Tên tập hiện tại: {title_text}",
        f"Ý tưởng ban đầu của tập này:\n{brief or '(Không có, lấy theo tóm tắt)'}",
        f"Tóm tắt kịch bản tập này:\n{syn or '(Không có, lấy theo ý tưởng)'}",
        "Hãy viết kịch bản chi tiết content cho tập này.",
    ]
    data = await drama_chat_json(
        EPISODE_BODY_FROM_BRIEF_SYSTEM,
        "\n\n".join(user_parts),
        max_tokens=8192,
    )
    episodes = data.get("episodes") if isinstance(data, dict) else None
    if not isinstance(episodes, list):
        raise ValueError("模型未返回本集正文")
    title_by_num = {number: title_text}
    normalized = _normalize_batch_episodes(episodes, number, number, title_by_num)
    if not normalized:
        raise ValueError(f"模型未返回第 {number} 集正文")
    row = normalized[0]
    row["creative"] = brief or str(row.get("creative") or "")
    row["summary"] = syn or str(row.get("summary") or "")
    if _content_char_len(str(row.get("body") or "")) < MIN_EPISODE_CONTENT_CHARS:
        # Nếu nó ngắn, hãy thử lại và nhấn mạnh độ dài.
        retry = await drama_chat_json(
            EPISODE_BODY_FROM_BRIEF_SYSTEM,
            "\n\n".join(
                user_parts
                + [
                    f"Bản thảo trước quá ngắn (dưới {MIN_EPISODE_CONTENT_CHARS} từ), hãy viết mở rộng chi tiết đạt khoảng {TARGET_EPISODE_CONTENT_CHARS} từ tiếng Việt, "
                    f"gồm {EPISODE_SCENE_COUNT_HINT}, mỗi phân cảnh có 2-3 đoạn hành động △ và 2-3 câu thoại, vẫn chỉ xuất Tập {number}."
                ]
            ),
            max_tokens=8192,
        )
        retry_eps = retry.get("episodes") if isinstance(retry, dict) else None
        if isinstance(retry_eps, list):
            normalized = _normalize_batch_episodes(retry_eps, number, number, title_by_num) or normalized
            row = normalized[0]
            row["creative"] = brief or str(row.get("creative") or "")
            row["summary"] = syn or str(row.get("summary") or "")
    return [row]


async def run_episode_full_from_creative(
    project_summary: dict[str, Any],
    existing: list[dict[str, Any]],
    number: int,
    creative: str,
    *,
    project_source: str = "",
    title: str | None = None,
    character_asset_names: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Sáng tạo → Tóm tắt → Văn bản (một cú nhấp chuột để hoàn thành tập phim)."""
    summary_rows = await run_episode_summary_from_creative(
        project_summary,
        existing,
        number,
        creative,
        project_source=project_source,
        title=title,
        character_asset_names=character_asset_names,
    )
    syn_row = summary_rows[0]
    body_rows = await run_episode_body_from_brief(
        project_summary,
        existing,
        number,
        creative=str(syn_row.get("creative") or creative),
        summary=str(syn_row.get("summary") or ""),
        project_source=project_source,
        title=str(syn_row.get("title") or title or ""),
        character_asset_names=character_asset_names,
    )
    out = body_rows[0]
    out["creative"] = str(syn_row.get("creative") or creative).strip()
    out["summary"] = str(syn_row.get("summary") or "").strip()
    out["title"] = str(out.get("title") or syn_row.get("title") or title or f"第 {number} 集")
    return [out]


async def run_episode_brief_from_body(
    project_summary: dict[str, Any],
    existing: list[dict[str, Any]],
    number: int,
    body: str,
    *,
    project_source: str = "",
    title: str | None = None,
    character_asset_names: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Đã quay văn bản rồi → Đảo ngược nội dung + tóm tắt của tập này (không thay đổi nội dung)."""
    script_body = (body or "").strip()
    if len(script_body) < 80:
        raise ValueError("本集剧本内容过短，无法反推创意与摘要")
    title_text = (title or "").strip() or f"第 {number} 集"
    user_parts = [
        *build_single_episode_context(
            project_summary,
            existing,
            number,
            project_source=project_source,
            character_asset_names=character_asset_names,
        ),
        f"Số tập hiện tại: Tập {number}",
        f"Tên tập hiện tại: {title_text}",
        f"Kịch bản quay chi tiết của tập:\n{script_body[:12000]}",
        "Hãy chỉ xuất title, creative, summary cho tập này; không viết lại kịch bản chi tiết.",
    ]
    data = await drama_chat_json(
        EPISODE_BRIEF_FROM_BODY_SYSTEM,
        "\n\n".join(user_parts),
        max_tokens=4096,
    )
    episodes = data.get("episodes") if isinstance(data, dict) else None
    if not isinstance(episodes, list) or not episodes:
        raise ValueError("模型未返回本集创意与摘要")
    item = episodes[0] if isinstance(episodes[0], dict) else {}
    out_creative = str(item.get("creative") or "").strip()
    out_summary = str(item.get("summary") or item.get("synopsis") or "").strip()
    if len(out_creative) < 20:
        raise ValueError("反推的本集创意过短，请重试")
    if len(out_summary) < 40:
        raise ValueError("反推的本集摘要过短，请重试")
    out_title = str(item.get("title") or "").strip() or title_text
    return [
        {
            "episodeNumber": number,
            "title": out_title,
            "creative": out_creative,
            "summary": out_summary,
            "body": script_body,
        }
    ]


async def run_script_summary(
    creative: str,
    episode_count: int | None = None,
    image_style_id: str | None = None,
) -> dict[str, Any]:
    # Build structured outline from creative brief
    trimmed = (creative or "").strip()
    if len(trimmed) < 10:
        raise ValueError("原始创意至少需要 10 个字")

    user_message = build_script_summary_user_message(
        trimmed,
        episode_count=episode_count,
        image_style_id=image_style_id,
    )
    data = await drama_chat_json(
        SCRIPT_SUMMARY_SYSTEM_PROMPT,
        user_message,
        max_tokens=8192,
    )
    if episode_count:
        data["episodeCount"] = episode_count
    return data


def resolve_episode_target(
    summary: dict[str, Any] | None,
    project_params: dict[str, Any] | None = None,
    script_params: dict[str, Any] | None = None,
) -> int:
    # Phân tích tổng số tập mục tiêu: Ưu tiên số tập tại thời điểm tạo dự án, theo sau là các tham số tóm tắt/tập lệnh
    candidates = [
        (project_params or {}).get("episode_count"),
        (summary or {}).get("episodeCount"),
        (script_params or {}).get("episode_count"),
    ]
    for raw in candidates:
        try:
            value = int(raw)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            continue
        if value >= 1:
            return value
    return 12


def merge_episode_bodies(
    existing: list[dict[str, Any]],
    batch: list[dict[str, Any]],
    prefer_incoming: bool = False,
) -> list[dict[str, Any]]:
    # Hợp nhất theo số đã đặt; văn bản dài hơn được ưu tiên theo mặc định và việc viết sau sẽ chiếm ưu thế khi Prefer_incoming (dự phòng giá trị null vẫn giữ nguyên giá trị cũ)
    by_number: dict[int, dict[str, Any]] = {}
    for item in existing + batch:
        if not isinstance(item, dict):
            continue
        try:
            number = int(item.get("episodeNumber") or item.get("episode_number") or 0)
        except (TypeError, ValueError):
            continue
        if number < 1:
            continue
        body = str(item.get("body") or item.get("content") or "")
        creative = str(item.get("creative") or "").strip()
        summary = str(item.get("summary") or item.get("synopsis") or "").strip()
        title = str(item.get("title") or "").strip() or f"第 {number} 集"
        prev = by_number.get(number)
        if prev:
            prev_body = str(prev.get("body") or "")
            prev_creative = str(prev.get("creative") or "").strip()
            prev_summary = str(prev.get("summary") or "").strip()
            if prefer_incoming:
                body = body if body.strip() else prev_body
                creative = creative or prev_creative
                summary = summary or prev_summary
            else:
                if len(prev_body.strip()) > len(body.strip()):
                    body = prev_body
                if len(prev_creative) > len(creative):
                    creative = prev_creative
                if len(prev_summary) > len(summary):
                    summary = prev_summary
                if not creative:
                    creative = prev_creative
                if not summary:
                    summary = prev_summary
            if title.startswith("第 ") and prev.get("title"):
                title = str(prev.get("title"))
            elif not title or title == f"第 {number} 集":
                title = str(prev.get("title") or title)
        new_origin = str(item.get("origin") or "").strip()
        prev_origin = str(prev.get("origin") or "").strip() if prev else ""
        origin = new_origin or prev_origin
        merged: dict[str, Any] = {
            "episodeNumber": number,
            "title": title,
            "body": body,
        }
        if creative:
            merged["creative"] = creative
        if summary:
            merged["summary"] = summary
        if origin == MANUAL_EPISODE_ORIGIN:
            merged["origin"] = MANUAL_EPISODE_ORIGIN
        by_number[number] = merged
    return [by_number[n] for n in sorted(by_number)]


def auto_missing_episode_numbers(existing: list[dict[str, Any]], total: int) -> list[int]:
    """Dây chuyền lắp ráp tự động điền số đã đặt: bỏ qua việc thêm thủ công các bộ trống và văn bản không đạt tiêu chuẩn."""
    by_num: dict[int, dict[str, Any]] = {}
    for item in existing:
        if not isinstance(item, dict):
            continue
        try:
            number = int(item.get("episodeNumber") or 0)
        except (TypeError, ValueError):
            continue
        if number >= 1:
            by_num[number] = item
    missing: list[int] = []
    target = max(int(total or 0), 0)
    for number in range(1, target + 1):
        item = by_num.get(number)
        if item is None:
            missing.append(number)
            continue
        body = str(item.get("body") or item.get("content") or "")
        if _content_char_len(body) >= MIN_EPISODE_CONTENT_CHARS:
            continue
        if str(item.get("origin") or "") == MANUAL_EPISODE_ORIGIN:
            continue
        missing.append(number)
    return missing


def append_manual_episode(
    existing: list[dict[str, Any]],
    title: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Thêm một tập thủ công trống vào sau tập hiện có, quay lại (danh sách mới, số tập mới)."""
    max_number = 0
    for item in existing:
        if not isinstance(item, dict):
            continue
        try:
            number = int(item.get("episodeNumber") or 0)
        except (TypeError, ValueError):
            continue
        if number > max_number:
            max_number = number
    next_number = max_number + 1
    if next_number < 1:
        next_number = 1
    if next_number > MAX_DRAMA_EPISODES:
        raise ValueError(f"最多 {MAX_DRAMA_EPISODES} 集")
    title_text = (title or "").strip() or f"第 {next_number} 集"
    added = {
        "episodeNumber": next_number,
        "title": title_text,
        "creative": "",
        "summary": "",
        "body": "",
        "origin": MANUAL_EPISODE_ORIGIN,
    }
    merged = merge_episode_bodies(existing, [added])
    return merged, next_number


def count_completed_episodes(episodes: list[dict[str, Any]], total: int) -> int:
    # Thống kê 1..Tổng số tập mà văn bản đạt đến ngưỡng chất lượng
    done = 0
    for item in episodes:
        try:
            number = int(item.get("episodeNumber") or 0)
        except (TypeError, ValueError):
            continue
        body = str(item.get("body") or "").strip()
        if 1 <= number <= total and _content_char_len(body) >= MIN_EPISODE_CONTENT_CHARS:
            done += 1
    return done


def _content_char_len(text: str) -> int:
    return len("".join((text or "").split()))


def normalize_series_title(raw: str | None) -> str:
    """Làm sạch đầu ra tiêu đề phim truyền hình bằng AI và xóa số/trích dẫn tiêu đề sách cũng như phần đuôi quá dài."""
    title = str(raw or "").strip()
    if not title:
        return ""
    title = title.strip("「」『』《》\"'“”‘’").strip()
    title = title.splitlines()[0].strip()
    # Cắt theo độ dài tên dự án hợp lý (tên phim ngắn Trung Quốc)
    if len(title) > 24:
        title = title[:24].rstrip("，。；、…·-— ")
    return title


def pick_auto_project_title(
    summary: dict[str, Any],
    *,
    creative: str,
    current_title: str,
) -> str | None:
    """Sau khi tóm tắt xong: sẽ ưu tiên ghi đè tiêu đề mặc định "cắt ngắn/quá dài" bằng tiêu đề phim truyền hình AI; nếu tên đã được người dùng thay đổi, nó sẽ không bị ghi đè."""
    series = normalize_series_title(
        summary.get("seriesTitle") or summary.get("title") or summary.get("projectTitle")
    )
    if not series:
        return None
    current = (current_title or "").strip()
    creative_prefix = (creative or "").strip()[:20]
    looks_default = (
        not current
        or current in {"未命名漫剧", "自由画布项目"}
        or len(current) > 36
        or (creative_prefix and current.startswith(creative_prefix))
        or current.endswith("…")
    )
    if not looks_default:
        return None
    return series


def format_summary_text(summary: dict[str, Any]) -> str:
    # Human-readable outline for UI / LLM context
    lines = [
        f"Tên phim: {summary.get('seriesTitle', '')}",
        f"Số tập: {summary.get('episodeCount', '')}",
        f"Thể loại: {summary.get('storyType', '')}",
        f"Khán giả mục tiêu: {summary.get('targetAudience', '')}",
        f"Điểm thu hút chính (Hook): {summary.get('coreHook', '')}",
        f"Câu chuyện một câu: {summary.get('oneLineStory', '')}",
        "",
        "Nhân vật:",
    ]
    for c in summary.get("characters") or []:
        if isinstance(c, dict):
            lines.append(
                f"- {c.get('name', '')} ({c.get('roleType', '')}/{c.get('title', '')}): "
                f"{c.get('visualImage', '')}; Nhãn: {c.get('coreTags', '')}; "
                f"Đường phát triển: {c.get('growthArc', '')}"
            )
    lines.extend(["", "Tóm tắt cốt truyện:", str(summary.get("synopsis") or "")])
    return "\n".join(lines)


def _format_episode_title_list(episodes: list[dict[str, Any]]) -> str:
    rows: list[str] = []
    for item in sorted(episodes, key=lambda x: int(x.get("episodeNumber") or 0)):
        num = item.get("episodeNumber")
        title = item.get("title") or f"Tập {num}"
        rows.append(f"Tập {num}: {title}")
    return "\n".join(rows) if rows else "(Chưa có kế hoạch phân tập)"


def _format_existing_episode_content(episodes: list[dict[str, Any]], limit: int = 3) -> str:
    # Chỉ đính kèm văn bản của các tập gần đây nhất để kiểm soát độ dài của bối cảnh
    completed = [
        item
        for item in episodes
        if isinstance(item, dict) and str(item.get("body") or item.get("content") or "").strip()
    ]
    completed.sort(key=lambda x: int(x.get("episodeNumber") or 0))
    if not completed:
        return "(Chưa có, đợt này bắt đầu viết từ mở đầu)"
    tail = completed[-limit:]
    blocks: list[str] = []
    for item in tail:
        num = item.get("episodeNumber")
        title = item.get("title") or f"Tập {num}"
        body = str(item.get("body") or item.get("content") or "").strip()
        # Cắt bớt phần tóm tắt đuôi nếu nó quá dài để tránh chiếm không gian tạo tập hợp hiện tại
        if len(body) > 1800:
            body = body[:1800] + "\n…(Phần trên đã rút gọn)"
        blocks.append(f"Tập {num}. {title}:\n{body}")
    return "\n\n".join(blocks)


def _titles_ready(existing: list[dict[str, Any]], total: int) -> bool:
    titled = {
        int(item.get("episodeNumber") or 0)
        for item in existing
        if isinstance(item, dict)
        and str(item.get("title") or "").strip()
        and not str(item.get("title") or "").startswith("第 ")
    }
    # Cũng chấp nhận các bản ghi khác ngoài "Tập N" hoặc ít nhất là toàn bộ có tiêu đề
    with_title = [
        item
        for item in existing
        if isinstance(item, dict)
        and 1 <= int(item.get("episodeNumber") or 0) <= total
        and str(item.get("title") or "").strip()
    ]
    if len(with_title) >= total:
        # Nếu “Tập N” đều là phần giữ chỗ, bạn vẫn cần chạy lại dàn ý
        placeholder_only = all(
            str(item.get("title") or "").strip() in {f"第 {item.get('episodeNumber')} 集", f"第{item.get('episodeNumber')}集"}
            for item in with_title
        )
        return not placeholder_only
    return len(titled) >= total


async def run_episode_outline(
    creative: str,
    summary: dict[str, Any],
    episode_count: int,
) -> list[dict[str, Any]]:
    # Tạo bản phác thảo của bộ sưu tập hoàn chỉnh
    summary_text = format_summary_text(summary)
    user = "\n".join(
        [
            f"Tổng số tập: {episode_count} tập (mảng episodes bắt buộc có đúng {episode_count} phần tử)",
            "",
            f"Ý tưởng ban đầu:\n{(creative or '').strip()}",
            "",
            f"Tóm tắt kịch bản:\n{summary_text}",
            "",
            "Hãy xuất episodeNumber và title cho toàn bộ các tập.",
        ]
    )
    data = await drama_chat_json(EPISODE_OUTLINE_SYSTEM, user, max_tokens=4096)
    episodes = data.get("episodes") if isinstance(data, dict) else data
    if not isinstance(episodes, list) or not episodes:
        raise ValueError("分集大纲返回格式无效")
    result: list[dict[str, Any]] = []
    for i, item in enumerate(episodes):
        if not isinstance(item, dict):
            continue
        try:
            number = int(item.get("episodeNumber") or (i + 1))
        except (TypeError, ValueError):
            number = i + 1
        title = str(item.get("title") or "").strip() or f"第 {number} 集"
        result.append({"episodeNumber": number, "title": title, "body": ""})
    if len(result) < episode_count:
        # Hoàn thành số tập còn thiếu
        have = {int(x["episodeNumber"]) for x in result}
        for n in range(1, episode_count + 1):
            if n not in have:
                result.append({"episodeNumber": n, "title": f"第 {n} 集", "body": ""})
    result.sort(key=lambda x: int(x["episodeNumber"]))
    return result[:episode_count]


async def ensure_episode_outline(
    creative: str,
    summary: dict[str, Any],
    existing: list[dict[str, Any]],
    total: int,
) -> tuple[list[dict[str, Any]], bool]:
    """Trả về (danh sách tập đã hợp nhất, liệu LLM có thực sự được gọi để tạo dàn ý hay không)."""
    if _titles_ready(existing, total):
        return existing, False
    outline = await run_episode_outline(creative, summary, total)
    return merge_episode_bodies(outline, existing), True


async def run_episode_script_batch(
    summary: dict[str, Any],
    existing: list[dict[str, Any]],
    batch_size: int = 1,
    total: int | None = None,
    creative: str = "",
) -> list[dict[str, Any]]:
    # Tạo lô văn bản tiếp theo theo số tập bị thiếu (mặc định là từng tập); các bộ trống thủ công sẽ không tham gia viết lại tự động
    target = int(total or summary.get("episodeCount") or 12)
    missing = auto_missing_episode_numbers(existing, target)
    if not missing:
        return []
    start = missing[0]
    end = start
    for i in range(1, min(batch_size, len(missing))):
        if missing[i] != end + 1:
            break
        end = missing[i]

    title_by_num = {
        int(item.get("episodeNumber") or 0): str(item.get("title") or "")
        for item in existing
        if isinstance(item, dict)
    }
    batch_titles = "\n".join(
        f"第 {n} 集：{title_by_num.get(n) or f'第 {n} 集'}" for n in range(start, end + 1)
    )
    batch_size_n = end - start + 1
    summary_text = format_summary_text(summary)
    user = "\n".join(
        [
            f"Nhiệm vụ hiện tại: Viết kịch bản chi tiết hoàn chỉnh từ Tập {start} đến Tập {end} (tổng cộng {batch_size_n} tập)",
            f"Toàn bộ phim có {target} tập",
            f"Mảng episodes đầu ra bắt buộc có đúng {batch_size_n} phần tử, episodeNumber từ {start} đến {end}",
            f"Mỗi tập content khoảng {TARGET_EPISODE_CONTENT_CHARS} từ tiếng Việt (không dưới {MIN_EPISODE_CONTENT_CHARS} từ), gồm {EPISODE_SCENE_COUNT_HINT}, tinh giản hành động △ và lời thoại",
            "",
            f"Ý tưởng ban đầu:\n{(creative or '').strip() or '(Không có ý tưởng bổ sung, lấy theo tóm tắt)'}",
            "",
            f"Tóm tắt kịch bản:\n{summary_text}",
            "",
            f"Kế hoạch phân tập toàn phim:\n{_format_episode_title_list(existing)}",
            "",
            f"Các tập cần viết đợt này:\n{batch_titles}",
            "",
            f"Nội dung các tập đã có trước đó:\n{_format_existing_episode_content(existing)}",
            "",
            f"Hãy xuất trường content cho từng tập từ Tập {start}–{end} (có thể kèm theo title).",
        ]
    )

    data = await drama_chat_json(
        EPISODE_BATCH_CONTENT_SYSTEM,
        user,
        temperature=0.6,
        max_tokens=16384,
    )

    episodes = data.get("episodes") if isinstance(data, dict) else data
    if not isinstance(episodes, list):
        raise ValueError("分集剧本返回格式无效")

    normalized = _normalize_batch_episodes(episodes, start, end, title_by_num)
    # Nếu văn bản quá ngắn, hãy thử lại với dấu nhắc nhấn mạnh.
    too_short = [
        item
        for item in normalized
        if _content_char_len(str(item.get("body") or "")) < MIN_EPISODE_CONTENT_CHARS
    ]
    if too_short:
        retry_user = (
            user
            + "\n\nKết quả lần trước quá ngắn. Vui lòng viết lại đợt này, mỗi tập content khoảng "
            + str(TARGET_EPISODE_CONTENT_CHARS)
            + f" từ tiếng Việt (không dưới {MIN_EPISODE_CONTENT_CHARS} từ), gồm {EPISODE_SCENE_COUNT_HINT}, tinh giản hành động △ và lời thoại, không nén thành tóm tắt cốt truyện."
        )
        retry = await drama_chat_json(
            EPISODE_BATCH_CONTENT_SYSTEM,
            retry_user,
            temperature=0.6,
            max_tokens=16384,
        )
        retry_eps = retry.get("episodes") if isinstance(retry, dict) else retry
        if isinstance(retry_eps, list):
            normalized = _normalize_batch_episodes(retry_eps, start, end, title_by_num)

    if not normalized:
        raise ValueError(f"模型未返回第 {start}–{end} 集正文")
    return normalized


async def run_episode_script_from_draft(
    summary: dict[str, Any],
    existing: list[dict[str, Any]],
    episode_number: int,
    draft: str,
    creative: str = "",
    character_asset_names: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Tối ưu hóa bản nháp của người dùng thành văn bản chụp của bộ đã chỉ định."""
    number = int(episode_number)
    draft_text = (draft or "").strip()
    if number < 1:
        raise ValueError("集号无效")
    if len(draft_text) < 20:
        raise ValueError("请先输入至少 20 字的分集剧本草稿")

    title_by_num = {
        int(item.get("episodeNumber") or 0): str(item.get("title") or "")
        for item in existing
        if isinstance(item, dict)
    }
    current_title = title_by_num.get(number) or f"第 {number} 集"
    ctx = build_single_episode_context(
        summary,
        existing,
        number,
        project_source=creative,
        character_asset_names=character_asset_names,
    )
    user = "\n\n".join(
        [
            f"Nhiệm vụ hiện tại: Tối ưu bản thảo thô của người dùng thành kịch bản chi tiết hoàn chỉnh cho Tập {number}",
            f"episodeNumber bắt buộc là {number}, mảng episodes phải có đúng 1 phần tử",
            f"Tên tập hiện tại: {current_title} (có thể điều chỉnh nhẹ title theo diễn biến trọng tâm của bản thảo)",
            f"Mỗi tập content khoảng {TARGET_EPISODE_CONTENT_CHARS} từ tiếng Việt (không dưới {MIN_EPISODE_CONTENT_CHARS} từ), gồm {EPISODE_SCENE_COUNT_HINT}, tinh giản hành động △ và lời thoại",
            *ctx,
            f"Bản thảo Tập {number} do người dùng cung cấp:\n{draft_text}",
            f"Hãy xuất title và content cho Tập {number}.",
        ]
    )
    data = await drama_chat_json(
        EPISODE_OPTIMIZE_SYSTEM,
        user,
        temperature=0.55,
        max_tokens=16384,
    )
    episodes = data.get("episodes") if isinstance(data, dict) else data
    if not isinstance(episodes, list):
        raise ValueError("分集剧本返回格式无效")
    normalized = _normalize_batch_episodes(episodes, number, number, title_by_num)
    too_short = [
        item
        for item in normalized
        if _content_char_len(str(item.get("body") or "")) < MIN_EPISODE_CONTENT_CHARS
    ]
    if too_short:
        retry_user = (
            user
            + "\n\nKết quả lần trước quá ngắn. Vui lòng dựa theo bản thảo viết lại Tập "
            + str(number)
            + ", content khoảng "
            + str(TARGET_EPISODE_CONTENT_CHARS)
            + f" từ tiếng Việt (không dưới {MIN_EPISODE_CONTENT_CHARS} từ), gồm {EPISODE_SCENE_COUNT_HINT}, tinh giản hành động △ và lời thoại."
        )
        retry = await drama_chat_json(
            EPISODE_OPTIMIZE_SYSTEM,
            retry_user,
            temperature=0.55,
            max_tokens=16384,
        )
        retry_eps = retry.get("episodes") if isinstance(retry, dict) else retry
        if isinstance(retry_eps, list):
            normalized = _normalize_batch_episodes(retry_eps, number, number, title_by_num)
    if not normalized:
        raise ValueError(f"模型未返回第 {number} 集正文")
    origin_item = next(
        (
            item
            for item in existing
            if isinstance(item, dict) and int(item.get("episodeNumber") or 0) == number
        ),
        None,
    )
    origin = str((origin_item or {}).get("origin") or "")
    if origin == MANUAL_EPISODE_ORIGIN:
        for item in normalized:
            item["origin"] = MANUAL_EPISODE_ORIGIN
    return normalized


def _normalize_batch_episodes(
    episodes: list[Any],
    start: int,
    end: int,
    title_by_num: dict[int, str],
) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for offset, item in enumerate(episodes):
        if not isinstance(item, dict):
            continue
        number = item.get("episodeNumber") or item.get("episode_number") or (start + offset)
        try:
            number_i = int(number)
        except (TypeError, ValueError):
            number_i = start + offset
        if number_i < start or number_i > end:
            continue
        body = str(item.get("content") or item.get("body") or "").strip()
        if not body:
            continue
        title = (
            str(item.get("title") or "").strip()
            or title_by_num.get(number_i)
            or f"第 {number_i} 集"
        )
        row: dict[str, Any] = {
            "episodeNumber": number_i,
            "title": title,
            "body": body,
        }
        creative = str(item.get("creative") or "").strip()
        summary = str(item.get("summary") or item.get("synopsis") or "").strip()
        if creative:
            row["creative"] = creative
        if summary:
            row["summary"] = summary
        normalized.append(row)
    return normalized
