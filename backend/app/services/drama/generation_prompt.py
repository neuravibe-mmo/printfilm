"""漫剧资产生图提示词拼接（角色/场景结构前缀 + 内置风格）。

与 manju generationPrompt.ts 对齐：character/scene 加结构强制前缀。
ai_movie 扩展：prop/material 增加静物/空镜前缀（manju 无此前缀）。
风格不写进结构前缀，由 append_style_prompt 追加项目风格。
"""

from __future__ import annotations

from app.services.drama.image_styles import STYLE_BOARD_PROMPT_HINT, resolve_image_style_prompt

# CHARACTER_PROMPT_PREFIX Yêu cầu bố cục bảng tạo hình nhân vật
CHARACTER_PROMPT_PREFIX = (
    "【Yêu cầu bố cục: Bảng tạo hình nhân vật】"
    "Nền trắng tinh, không bối cảnh phức tạp, không che khuất, không chữ/watermark. "
    "Bên trái khung hình là hình ảnh toàn thân 3 góc nhìn của cùng một nhân vật, chiếm diện tích thị giác chính, cố định từ trái sang phải: "
    "1. Đứng toàn thân chính diện; 2. Đứng toàn thân nghiêng trái; 3. Đứng toàn thân từ phía sau. "
    "Cả ba phải là cùng một nhân vật: ngũ quan, kiểu tóc, trang phục, vóc dáng, tỷ lệ chiều cao hoàn toàn đồng nhất. "
    "Tư thế đứng tự nhiên, đứng thẳng chính diện, hai tay buông tự nhiên, không động tác khác, không biểu cảm phóng đại, chụp trọn vẹn toàn thân (từ đầu đến chân). "
    "Cùng trong ảnh bắt buộc phải có thêm: ① Ảnh cận cảnh đặc tả khuôn mặt (ngũ quan, màu da, trang điểm và đường chân tóc rõ nét, dùng làm tham chiếu khuôn mặt); "
    "② Ảnh đặc tả bán thân (từ đầu vai đến thắt lưng, phần trên trang phục và tư thế rõ nét). "
    "Góc máy ngang tầm mắt, ánh sáng studio trung tính, không phối cảnh phóng đại. "
    "Đường viền nhân vật sắc nét, phom dáng trang phục rõ ràng, khoảng trống xung quanh thoáng đãng, tương tự trang bố cục tham chiếu tạo mẫu nhân vật. "
    "Nghiêm cấm: chỉ có 1 hình toàn thân đơn lẻ hoặc thiếu 3 góc nhìn; thiếu cận mặt hoặc thiếu bán thân; lấy phong cảnh/đạo cụ làm chủ thể; bối cảnh phức tạp. "
    "Dù người dùng mô tả thiên về bối cảnh, đồ vật hay phân đoạn hành động, cũng phải chuyển đổi thành bảng tạo hình nhân vật nền trắng có thể nhận diện được để trình bày, "
    "và dựa vào đó hoàn thiện diện mạo, vóc dáng và trang phục. Vui lòng căn cứ theo mô tả của người dùng dưới đây để tạo bảng tạo hình nhân vật: "
)

# SCENE_PROMPT_PREFIX Yêu cầu bố cục ảnh tham khảo thiết kế bối cảnh
SCENE_PROMPT_PREFIX = (
    "【Yêu cầu bố cục: Ảnh tham khảo thiết kế bối cảnh】"
    "Trong một bức ảnh đồng thời bao gồm góc nhìn ngang tầm mắt và góc nhìn từ trên cao xuống (top-down). "
    "Bên trái khung hình: Thiết kế mặt đứng đa diện của không gian bao quanh (bao gồm trải rộng diện tường), phải thể hiện rõ ô cửa, cửa ra vào và kết cấu kiến trúc nội thất khác. "
    "Bên phải khung hình: Chi tiết trải rộng của 2 đến 4 khu vực chức năng (chất liệu, đồ nội thất hoặc cục bộ không gian rõ ràng, phân biệt được). "
    "Lấy không gian môi trường và kết cấu kiến trúc làm chủ thể, nghiêm cấm đặc tả nhân vật, tranh nhân vật đứng hoặc lấy nhân vật làm trung tâm thị giác. "
    "Dù người dùng mô tả có liên quan đến nhân vật hoặc hành động, cũng phải bóc tách chủ thể con người ra, chỉ giữ lại thông tin không gian và kết cấu có thể đứng độc lập. "
    "Vui lòng căn cứ chặt chẽ theo mô tả của người dùng dưới đây để tạo bản thiết kế bối cảnh: "
)


# PROP_PROMPT_PREFIX Yêu cầu bố cục bảng thiết kế đạo cụ
PROP_PROMPT_PREFIX = (
    "【Yêu cầu bố cục: Bảng thiết kế đạo cụ】"
    "Nền trắng tinh, không bối cảnh phức tạp, không che khuất, không chữ/watermark. "
    "Bên trái khung hình là hình ảnh 3 góc nhìn hoàn chỉnh của cùng một đạo cụ, chiếm diện tích thị giác chính, cố định từ trái sang phải: "
    "1. Góc nhìn hoàn chỉnh chính diện; 2. Góc nhìn hoàn chỉnh nghiêng trái; 3. Góc nhìn hoàn chỉnh mặt sau. "
    "Cả 3 hình phải là cùng một đạo cụ: đường nét ngoại hình, phân vùng chất liệu, màu sắc, tỷ lệ, chi tiết hoàn toàn đồng nhất. "
    "Vật phẩm trọn vẹn trong khung hình, đặt ngay ngắn, không có người cầm nắm, không có động tác sử dụng, không phối cảnh phóng đại. "
    "Cùng trong ảnh bắt buộc phải có thêm: ① Ảnh đặc tả bộ phận then chốt (hoa văn khắc, cơ quan, mối nối, hoa văn hoặc dấu vết hao mòn...); "
    "② Ảnh đặc tả chất liệu/kết cấu (bề mặt chất liệu, mối ghép và độ dày rõ nét). "
    "Góc máy ngang tầm mắt, ánh sáng studio trung tính; viền vật phẩm rõ nét, kiểu dáng và tỷ lệ rõ ràng, khoảng trống xung quanh thoáng đãng, tương tự trang bố cục thiết kế sản phẩm/đạo cụ. "
    "Nghiêm cấm: chỉ xuất 1 góc nhìn hoặc thiếu 3 góc nhìn; thiếu đặc tả cục bộ; vẽ chân dung người; lấy phong cảnh làm chủ thể; bối cảnh phức tạp. "
    "Dù mô tả người dùng có nhắc đến việc nhân vật sử dụng hay hành động kịch bản, cũng phải lược bỏ nhân vật, chỉ giữ lại bản thể đạo cụ có thể đứng độc lập. "
    "Vui lòng căn cứ chặt chẽ theo mô tả của người dùng dưới đây để tạo bản thiết kế đạo cụ: "
)

# MATERIAL_PROMPT_PREFIX Yêu cầu hình ảnh tư liệu cảnh trống
MATERIAL_PROMPT_PREFIX = (
    "【Yêu cầu: Tạo hình ảnh tư liệu không khí/cảnh trống】Lần này bắt buộc tạo khung hình tĩnh môi trường/không khí, "
    "chú trọng bố cục, ánh sáng và không khí cảm xúc, dùng làm tư liệu cảnh trống cho phim ngắn. "
    "Nghiêm cấm tạo chân dung cận cảnh khuôn mặt nhận diện được hoặc tranh nhân vật đứng. "
    "Vui lòng căn cứ chặt chẽ theo mô tả của người dùng dưới đây để tạo hình ảnh tư liệu: "
)


# 将内置风格提示词追加到正文后；设定板类资产强调构图优先于风格场景
# has_style_board 为真时补一句：只借画风板气质，禁止抄主体
def append_style_prompt(
    prompt: str,
    style_id: str | None = None,
    *,
    structure_locked: bool = False,
    has_style_board: bool = False,
) -> str:
    style_prompt = resolve_image_style_prompt(style_id)
    if not style_prompt:
        return prompt
    board_hint = f"。{STYLE_BOARD_PROMPT_HINT}" if has_style_board else ""
    if structure_locked:
        return (
            f"{prompt}。Tham khảo chất liệu ngoại quan và phong cách: {style_prompt}{board_hint}"
            " (Phải tuân theo bố cục bảng tạo hình nền trắng ở trên, cấm đổi thành bối cảnh phức tạp hay thay thế nền trắng)"
        )
    return f"{prompt}。Yêu cầu phong cách hình ảnh: {style_prompt}{board_hint}"


# 按资产类型与风格 ID 组装完整 Seedream 提示词
def build_generation_prompt(
    user_prompt: str,
    asset_type: str | None = None,
    style_id: str | None = None,
    *,
    has_style_board: bool = False,
) -> str:
    trimmed = (user_prompt or "").strip()
    prompt = trimmed
    kind = (asset_type or "").strip().lower()
    structure_locked = False
    if kind == "character":
        prompt = f"{CHARACTER_PROMPT_PREFIX}{trimmed}"
        structure_locked = True
    elif kind == "scene":
        prompt = f"{SCENE_PROMPT_PREFIX}{trimmed}"
    elif kind == "prop":
        prompt = f"{PROP_PROMPT_PREFIX}{trimmed}"
        structure_locked = True
    elif kind in {"material", "none"}:
        prompt = f"{MATERIAL_PROMPT_PREFIX}{trimmed}"
    return append_style_prompt(
        prompt, style_id, structure_locked=structure_locked, has_style_board=has_style_board
    )
