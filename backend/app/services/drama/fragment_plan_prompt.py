"""Lập kế hoạch phân cảnh bằng LLM cho từng tập phim: Hệ thống prompt và ghép nối tham số (Việt hóa chuẩn)."""

from __future__ import annotations

import re
from typing import Any

from app.services.drama.build_fragments import EPISODE_FRAGMENT_MAX

FRAGMENT_PLAN_SYSTEM_PROMPT = """Bạn là đạo diễn phân cảnh phim ngắn AI chuyên nghiệp, có nhiệm vụ chuyển đổi kịch bản tập phim thành các phân cảnh ngắn (storyboard fragments) chuẩn hóa để đưa vào mô hình video AI (Seedance 2.5) tạo video từng cảnh một.

## Định dạng đầu ra
Chỉ xuất ra DUY NHẤT một đối tượng JSON hợp lệ (không kèm markdown, không bọc ```json, không giải thích thêm):
{
  "fragments": [
    {
      "duration_sec": 12,
      "scene_name": "Tên địa điểm hoặc chuỗi rỗng",
      "character_names": ["Tên nhân vật xuất hiện trong cảnh này"],
      "prop_names": ["Tên đạo cụ xuất hiện trong cảnh này"],
      "is_opening": false,
      "lines": [
        "Toàn cảnh: Mô tả bối cảnh và thiết lập không gian",
        "Tên nhân vật: Lời thoại của nhân vật",
        "Lời dẫn (VO): Nội dung thuyết minh hoặc lời dẫn"
      ]
    }
  ]
}

## Phân cảnh mở màn (Bắt buộc cho fragments[0])
Phân cảnh đầu tiên của mỗi tập (fragments[0]) luôn là cảnh mở màn, đặt `"is_opening": true`, dùng để giới thiệu phim, số tập và bối cảnh câu chuyện:
1. duration_sec gợi ý từ 5–10 giây.
2. lines cần thể hiện rõ (ưu tiên diễn đạt bằng hình ảnh, hạn chế lời thoại trong cảnh mở màn):
   - Thông tin số tập và tiêu đề: Ghi rõ "Tập N" + Tiêu đề tập (giữ nguyên tiêu đề người dùng cung cấp).
   - Giới thiệu bối cảnh: 1–3 câu giới thiệu thế giới quan, thời đại, bầu không khí hoặc tiền truyện người xem cần biết trước khi vào phim.
   - Khung hình mở đầu: Thiết lập không gian bối cảnh chính (mưa gió, cung điện, chiến trường, làng quê...), có thể chưa xuất hiện nhân vật chính hoặc chỉ thấy từ xa; ghi dưới dạng "Cảnh trống: ..." hoặc mô tả hình ảnh thuần túy.
3. character_names ở cảnh mở màn thường để trống hoặc rất ít; không tự ý viết các thẻ giới thiệu nhân vật (hệ thống sẽ tự xử lý hậu kỳ).
4. Các phân cảnh tiếp theo tính từ fragments[1] trở đi là cảnh nội dung diễn biến, đặt `"is_opening": false`.

## Khi nào cần cắt sang phân cảnh mới (thỏa mãn bất kỳ điều kiện nào sau đây):
1. Chuyển bối cảnh (Địa điểm / Ngày đêm / Nội cảnh - Ngoại cảnh).
2. Nhóm nhân vật chính trong cảnh thay đổi rõ rệt.
3. Chuyển đoạn cảm xúc / nhịp phim (Dẫn dắt → Mâu thuẫn → Cao trào → Lắng đọng).
4. Nhiệm vụ kể chuyện khác nhau (Mở màn ≠ Cảnh đối thoại ≠ Cảnh toàn phong cảnh).
5. Thời lượng tích lũy của cảnh sẽ vượt quá 15 giây (Giới hạn cứng là 15 giây/cảnh).

## Các quy tắc cứng (BẮT BUỘC TUÂN THỦ)
1. Thời lượng mỗi phân cảnh (duration_sec) phải từ 4 đến 15 giây, ưu tiên 5–15 giây; mỗi phân cảnh phải trọn vẹn một hành động/tình huống và có thể đứng độc lập thành 1 video clip.
2. Nhịp độ và số lượng phân cảnh: **Mỗi tập bắt buộc phải chia thành nhiều phân cảnh (từ 2 đến 3 phân cảnh), và mảng fragments TỐI ĐA KHÔNG QUÁ 3 PHÂN CẢNH (kể cả cảnh mở màn, tối đa 3 cảnh)**. Mục tiêu tổng thời lượng tập phim từ 20–45 giây. Các câu thoại liên tiếp trong cùng một bối cảnh phải gộp chung vào 1 phân cảnh, lược bỏ những biểu cảm thừa hoặc cảnh chuyển tiếp không cần thiết, tuyệt đối không cắt vụn mỗi câu thoại thành một cảnh.
3. lines chỉ viết: Hình ảnh góc máy, hành động, lời thoại, lời dẫn; giữ nguyên tên thật của nhân vật.
   - Mô tả góc máy / hình ảnh thuần túy bắt buộc phải bắt đầu bằng: "Cảnh trống: ...", "Toàn cảnh: ...", "Trung cảnh: ...", "Cận cảnh: ...", "Đặc tả: ...", v.v. CẤM viết mô tả hình ảnh thành lời dẫn hoặc "Tên nhân vật: Lời thoại".
   - Chỉ những nội dung thực sự phát ra tiếng nói mới ghi dạng "Tên nhân vật: Lời thoại" hoặc "Lời dẫn (VO): ...".
   - Cảnh trống / phong cảnh chỉ có mô tả hình ảnh, không có lời thoại, không có lời dẫn.
   - **BẮT BUỘC VỀ NGÔN NGỮ**: Phải giữ nguyên 100% ngôn ngữ gốc của kịch bản! Nếu kịch bản là Tiếng Việt, toàn bộ lines, lời thoại, lời dẫn, mô tả hình ảnh và góc máy bắt buộc phải xuất ra bằng tiếng Việt tự nhiên, giữ nguyên tên nhân vật (như LAN, MẸ LAN...), nghiêm cấm dịch sang tiếng Trung hay tiếng Anh!
4. CẤM tự ý xuất: ### Tiêu đề cảnh, dòng Nhân vật xuất hiện, các thẻ 【Phụ đề】【BGM】【Giới thiệu nhân vật】【Đầu phim】, @asset, @duration. Các thẻ kỹ thuật này do hệ thống tự động chèn ở khâu hậu kỳ.
5. character_names: Chỉ liệt kê các nhân vật CHÍNH thực sự xuất hiện trong khung hình và được nhắc đến trong lines (phù hợp với danh mục tài sản); nhân vật quần chúng/người qua đường có thể bỏ qua.
   **Mỗi phân cảnh character_names tối đa 3 người**; cảnh đông người chỉ nêu 2–3 nhân vật then chốt, còn lại dùng từ "mọi người / đoàn người" trong mô tả hình ảnh.
   prop_names: Chỉ liệt kê đạo cụ thực sự dùng trong cảnh, **tối đa 2 món**; nếu không có thì để mảng rỗng [].
   Tổng tài sản thị giác mỗi cảnh (bối cảnh + nhân vật + đạo cụ) không vượt quá 6 món để AI sinh video chuẩn xác.
6. Cảnh trống thiết lập môi trường có thể đứng riêng thành 1 phân cảnh; chỗ đối thoại dày đặc thì gộp theo mạch cảm xúc.
7. Giữ lại các xung đột và bước ngoặt then chốt; không được cắt vụn cảnh để đối phó số lượng.
8. Sau cảnh mở màn thì không lặp lại phần giới thiệu đầu phim nữa; số tập chỉ nhắc 1 lần ở cảnh mở màn.
9. Trong 1 phân cảnh, lines nên có khoảng 2–5 dòng (Thiết lập → Hành động → Lời thoại/Lời dẫn → Phản ứng). Tránh tình trạng cả phân cảnh chỉ có đúng 1 câu tóm tắt cụt ngủn, cũng tránh nhồi nhét quá nhiều thoại vào 1 cảnh.

## Độ chi tiết của mô tả hình ảnh (BẮT BUỘC)
Mỗi dòng **mô tả hình ảnh** (góc máy / hành động / cảnh trống) phải đầy đủ thông tin theo công thức:
**Chủ thể + Hành động/Tư thế + Môi trường bối cảnh + Góc máy/Vận động máy quay + Trạng thái kết thúc của cảnh**.
Có thể bổ sung: ánh sáng, thời tiết, tiền cảnh/hậu cảnh, cách nhân vật cầm nắm đạo cụ.

### Ví dụ KHÔNG ĐẠT (quá sơ sài):
- "Lan đứng trước nhà." "Mọi người hoảng sợ." "Cảnh trống: Làng quê."
- Toàn lời thoại, hầu như không có mô tả hình ảnh.
- Nén cả một đoạn kịch thành một câu tóm tắt, không chỉ rõ không gian và tiến trình hành động.

### Ví dụ ĐẠT TIÊU CHUẨN:
- "Toàn cảnh: Lan 12 tuổi ngồi trước hiên nhà tranh vách đất, tay nắn nót viết từng dòng chữ lên lá thư cũ, sau lưng khói sương mờ ảo bao phủ mái rạ; trạng thái kết thúc: ngòi bút dừng lại, em ngước nhìn về phía xa xăm."
- "Cận cảnh: Gương mặt mẹ Lan thoáng nét bàng hoàng, ánh mắt dừng lại ở chiếc ba lô đã sờn rách đặt nơi góc cửa sổ; trạng thái kết thúc: mẹ thở dài, bước tới khẽ đặt tay lên vai Lan."
- "Cảnh trống: Con đường đất đỏ vắng lặng trong ánh hoàng hôn, gió thổi cuốn theo bụi mờ qua những tán tre già; trạng thái kết thúc: ánh nắng tắt dần, chỉ còn lại bóng tối bao trùm con đường làng."

### Quy tắc dòng lời thoại / lời dẫn:
Lời thoại phải giữ văn phong giao tiếp tự nhiên đời thường. **CẤM** viết dạng "Tên nhân vật (hành động): Lời thoại" — phần trong ngoặc là hành động hình ảnh, phải tách riêng thành 1 dòng mô tả hình ảnh.
Cách viết chuẩn (2 dòng):
- Dòng hình ảnh: "Cận cảnh: Lan ngẩng đầu lên, khóe mắt rưng rưng ngấn lệ."
- Dòng lời thoại: "Lan: Nhưng nếu cha về mà không thấy mẹ con mình thì sao hả mẹ?"
Đoạn đối thoại vẫn cần ít nhất 1 dòng hình ảnh thiết lập/phản ứng, tránh tình trạng toàn chữ đối thoại trống trơn.
"""


def build_fragment_plan_user_prompt(
    *,
    episode_name: str,
    episode_body: str,
    asset_catalog: list[dict[str, Any]],
    episode_number: int | None = None,
    project_title: str | None = None,
    story_type: str | None = None,
    one_line_story: str | None = None,
    synopsis: str | None = None,
    core_hook: str | None = None,
    locked_summaries: list[str] | None = None,
    include_subtitles: bool = True,
) -> str:
    # Lắp ráp prompt phía người dùng: Thông tin tập phim + Kịch bản tập + Danh mục tài sản
    ep_no = int(episode_number or 0)
    ep_label = f"Tập {ep_no}" if ep_no > 0 else "Tập này"
    locked = [str(s).strip() for s in (locked_summaries or []) if str(s).strip()]
    lines = [
        f"Tên phim: {(project_title or '').strip() or 'Chưa đặt tên'}",
        f"Tập số: {ep_label}" + (f" (episodeNumber={ep_no})" if ep_no > 0 else ""),
        f"Tiêu đề tập: {(episode_name or '').strip() or ep_label}",
        f"Yêu cầu phụ đề: {'Cần phụ đề' if include_subtitles else 'Không phụ đề'}",
        "",
    ]
    if locked:
        lines.extend(
            [
                f"【Tiếp tục phân cảnh ｜ Đã quay {len(locked)} phân cảnh trước đó, nội dung đã khóa】",
                "- Không xuất phân cảnh mở màn (đặt is_opening toàn bộ là false).",
                "- Không lặp lại các nội dung đã quay dưới đây; chỉ lập kế hoạch cho phần kịch bản diễn biến tiếp theo.",
                "- Bao quát phần kịch bản còn lại chưa được các phân cảnh trước thể hiện.",
                "",
                "【Tóm tắt các phân cảnh đã khóa】",
            ]
        )
        for i, summary in enumerate(locked, start=1):
            short = summary if len(summary) <= 220 else summary[:219] + "…"
            lines.append(f"{i}. {short}")
        lines.append("")
        if (story_type or "").strip() or (one_line_story or "").strip():
            lines.append("【Bối cảnh tham khảo ｜ Không viết lại mở màn】")
            if (story_type or "").strip():
                lines.append(f"- Thể loại: {story_type.strip()}")
            if (one_line_story or "").strip():
                lines.append(f"- Câu chuyện một câu: {one_line_story.strip()}")
    else:
        lines.extend(
            [
                "【Thông tin bắt buộc cho phân cảnh mở màn ｜ Ghi vào fragments[0].lines】",
                f"- Số tập: {ep_label}",
                f"- Tên tập: {(episode_name or '').strip() or ep_label}",
            ]
        )
        if (project_title or "").strip():
            lines.append(f"- Tên phim: {project_title.strip()}")
        if (story_type or "").strip():
            lines.append(f"- Thể loại: {story_type.strip()}")
        if (core_hook or "").strip():
            lines.append(f"- Điểm thu hút chính (Hook): {core_hook.strip()}")
        if (one_line_story or "").strip():
            lines.append(f"- Câu chuyện một câu: {one_line_story.strip()}")
        if (synopsis or "").strip():
            syn = synopsis.strip()
            if len(syn) > 420:
                syn = syn[:419] + "…"
            lines.append(f"- Tóm tắt cốt truyện: {syn}")

    body_text = (episode_body or "").strip() or "(Trống)"
    body_len = len(re.sub(r"\s+", "", body_text))
    lines.extend(
        [
            "",
            "【RÀNG BUỘC CỨNG VỀ SỐ LƯỢNG PHÂN CẢNH ｜ BẮT BUỘC TUÂN THỦ】",
            f"- Mảng fragments bắt buộc phải chia thành nhiều phân cảnh (2–3 phân cảnh), và tổng số lượng ≤ {EPISODE_FRAGMENT_MAX} (tối đa 3 phân cảnh, bao gồm cả cảnh mở màn); thời lượng toàn tập 20–45 giây.",
            "- Các câu thoại liên tiếp trong cùng cảnh/nhân vật phải gộp thành 1 phân cảnh; bỏ qua các phản ứng thừa.",
            "- Thời lượng mỗi đoạn trong cảnh từ 3–15 giây, tổng thời lượng cả phân cảnh không quá 15 giây.",
            "- Mỗi phân cảnh tối đa 3 nhân vật xuất hiện, 2 đạo cụ; không ghi toàn bộ danh sách nhân vật vào character_names.",
            "- NGÔN NGỮ BẮT BUỘC: Giữ nguyên 100% tiếng Việt tự nhiên của kịch bản, giữ đúng tên nhân vật (như LAN, MẸ LAN...), cấm dịch sang tiếng Trung hay tiếng Anh!",
            "",
            "【KỊCH BẢN TẬP PHIM】",
            body_text,
            "",
            "【DANH MỤC TÀI SẢN KHẢ DỤNG ｜ Khi phân cảnh hãy ưu tiên dùng đúng tên trong danh mục dưới đây】",
        ]
    )
    if body_len > 550:
        lines.insert(
            lines.index("【KỊCH BẢN TẬP PHIM】"),
            f"【Kịch bản khá dài (khoảng {body_len} từ)】Khi lập phân cảnh hãy chủ động cô đọng: gộp cảnh, tinh giản hành động phụ, vẫn chỉ xuất tối đa ≤{EPISODE_FRAGMENT_MAX} phân cảnh.",
        )
    if not asset_catalog:
        lines.append("(Chưa có tài sản)")
    else:
        for item in asset_catalog:
            kind = str(item.get("type") or "")
            name = str(item.get("name") or "")
            aid = item.get("id")
            role = str(item.get("roleType") or item.get("title") or "").strip()
            extra = f" | {role}" if role else ""
            lines.append(f"- [{kind}] id={aid} name={name}{extra}")
    if locked:
        lines.extend(
            [
                "",
                "Hãy xuất JSON: {\"fragments\":[...]} chứa toàn bộ các phân cảnh tiếp theo (không tạo cảnh mở màn), nối tiếp từ nội dung đã quay.",
            ]
        )
    else:
        lines.extend(
            [
                "",
                "Hãy xuất JSON: {\"fragments\":[...]} trong đó phân cảnh đầu tiên bắt buộc là cảnh mở màn (is_opening=true, giới thiệu số tập và bối cảnh), sau đó là các phân cảnh nội dung.",
            ]
        )
    if not include_subtitles:
        lines.extend(
            [
                "",
                "【YÊU CẦU BỔ SUNG ｜ TẬP NÀY KHÔNG CẦN PHỤ ĐỀ】",
                "- Chỉ viết hình ảnh, hành động, lời thoại, lời dẫn, không thêm bất kỳ nhãn phụ đề nào.",
                "- Cảnh mở màn cũng không thiết kế chữ đè số tập hay tên phim, chỉ thể hiện qua hình ảnh và âm thanh.",
            ]
        )
    return "\n".join(lines)
