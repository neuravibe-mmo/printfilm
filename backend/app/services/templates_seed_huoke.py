"""Mẫu video ngắn thu hút khách hàng (được tích hợp vào thư viện mẫu video).

Cấu trúc gồm 4 khung sườn tiếp thị (TikTok / Review / Đánh giá / Bạn bè):
Móc câu → Ấn tượng → Trải nghiệm theo điểm → Gợi ý cho ai; 0–3s Móc câu → Bối cảnh → 1–2 Trải nghiệm → Kêu gọi hành động;
Đánh giá chung → Môi trường dịch vụ → Lý do khuyên dùng → Tính tương xứng chi phí → Phù hợp với ai; Cảm nhận → Chi tiết → Gợi ý nhẹ nhàng.

Nguyên tắc: Không bịa đặt trải nghiệm người dùng chưa viết; điểm bán hàng chỉ tường thuật khách quan.
category[0] là "Kiến thức", phục vụ bộ lọc trang chủ; thêm danh mục "Thu hút khách", "Thương mại".
sort_order 0–3: Ưu tiên hiển thị tại mục "Gợi ý thịnh hành" trên trang tạo dự án.
"""

# Bốn mẫu được chia sẻ: ranh giới thực tế + ranh giới con người + tuân thủ (viết tiền tố llm_system_addon)
HUOKE_IRON_RULES = (
    "【Quy tắc tiếp thị khách hàng】Chỉ sử dụng những sự thật có trong nội dung của người dùng; "
    "tuyệt đối không tự bịa giá cả, sản phẩm, hiệu quả hay dịch vụ chưa được đề cập. "
    "Thông tin không đủ thì viết ngắn gọn, tuyệt đối không dùng trí tưởng tượng để bù đắp. "
    "【Giới hạn ngôi xưng】Ngôi thứ nhất (tôi đã thử / tôi thấy) chỉ được lấy từ nguyên văn của người dùng; "
    "Điểm bán hàng của nhà bán chỉ được viết theo lời tường thuật khách quan, cấm viết kiểu thổi phồng. "
    "【Tuân thủ】Nghiêm cấm các từ tuyệt đối hóa như số 1, tốt nhất, vĩnh viễn, triệt để; "
    "Nghiêm cấm bịa đặt tỷ lệ thành công hay người nổi tiếng chứng thực. "
    "【Tên gọi】Tên quán, địa chỉ, tên sản phẩm xuất hiện trong bài viết phải giữ nguyên vẹn. "
    "【Lời dẫn】Câu ngắn gọn, khẩu ngữ tự nhiên, ngôn ngữ tiếng Việt."
)

# Các ký tự chồng chéo: các ký tự lớn ở đầu video thu hút khách hàng màn hình dọc + phụ đề giọng nói ở phía dưới
_HUOKE_SUB_SPLIT = {
    "font": "SourceHanSans",
    "position": "split",
    "title_scale": 1.65,
    "sub_scale": 1.45,
    "caption_scale": 1.28,
}


def _tpl(
    *,
    tid: str,
    name: str,
    description: str,
    style_prefix: str,
    negative_prompt: str,
    default_ratio: str,
    shot_duration_min: int,
    shot_duration_max: int,
    structure_addon: str,
    seedream_config: dict,
    seedance_config: dict,
    audio_config: dict,
    subtitle_config: dict,
    sort_order: int,
    photoreal: bool = False,
    shot_count_min: int = 3,
    shot_count_max: int = 5,
) -> dict:
    """Tập hợp một mẫu khoa học thu hút khách hàng, các trường nhất quán với các mục nhập TEMPLATES."""
    cfg = dict(seedream_config)
    if photoreal:
        cfg["photoreal"] = True
    cfg["shot_count_min"] = shot_count_min
    cfg["shot_count_max"] = shot_count_max
    cfg["allow_source_names"] = True
    return {
        "id": tid,
        "name": name,
        "description": description,
        "category": ["Kiến thức", "Thu hút khách", "Thương mại"],
        "preview_cover": f"/static/templates/covers/{tid}.png",
        "style_prefix": style_prefix,
        "negative_prompt": negative_prompt,
        "default_ratio": default_ratio,
        "shot_duration_min": shot_duration_min,
        "shot_duration_max": shot_duration_max,
        "llm_system_addon": HUOKE_IRON_RULES + structure_addon,
        "seedream_config": cfg,
        "seedance_config": seedance_config,
        "audio_config": audio_config,
        "subtitle_config": subtitle_config,
        "sort_order": sort_order,
        "is_active": True,
        "is_premium": False,
    }


HUOKE_TEMPLATES: list[dict] = [
    _tpl(
        tid="huoke_douyin_hook",
        name="Thu hút khách · Móc câu TikTok",
        description="Nhịp điệu video ngắn màn hình dọc: 3 giây đầu móc câu → hình ảnh bối cảnh → 1–2 trải nghiệm kiểm chứng → kêu gọi ghé quán/đặt hàng. Phù hợp chạy quảng cáo thu hút khách.",
        style_prefix=(
            "Khung hình tĩnh video ngắn thu hút khách màn hình dọc: Mặt tiền cửa hàng, cận cảnh sản phẩm, thao tác dịch vụ hoặc giao diện vận hành luân phiên xuất hiện, "
            "ánh sáng tự nhiên tương phản mạnh, chủ thể rõ ràng, chừa khoảng trống thuận tiện chèn chữ lớn, chất lượng trình diễn sản phẩm chuẩn điện ảnh, không hoạt hình không anime"
        ),
        negative_prompt=(
            "Hoạt hình, anime, cel-shaded, 2D, màn hình neon cyber, danh sách nhiệm vụ, chữ rác trên hình, "
            "watermark phụ đề, logo nhòe, huy hiệu chứng nhận giả, poster giảm giá phóng đại xếp chồng"
        ),
        default_ratio="9:16",
        shot_duration_min=3,
        shot_duration_max=6,
        structure_addon=(
            "Đây là video thuyết minh tiếp thị khách hàng ngắn. 【Số lượng phân cảnh】Chia theo 3–4 cảnh, bỏ qua khoảng mặc định dài hơn; "
            "Sự thật không đủ thì gộp nhịp phân cảnh, thà ít cảnh chứ tuyệt đối không bịa đặt. "
            "Nhịp điệu: ①【Móc câu 0-3 giây】Sự tương phản/bí ẩn/nỗi đau, title cực ngắn; "
            "②【Hình ảnh bối cảnh】Nêu rõ ở đâu, làm gì, chỉ viết các cảnh có trong văn bản của người dùng; "
            "③【Trải nghiệm cốt lõi】Tối đa 2 điểm có thể kiểm chứng, cấm bịa thêm cho đủ; "
            "④【Kêu gọi hành động】Bước tiếp theo cụ thể (đến cửa hàng / đặt hàng / nhắn tin), không hứa hẹn kết quả quá đà. "
            "Mỗi cảnh output segments: xen kẽ visual và narration; lời dẫn câu ngắn có thể đọc trong một hơi thở; "
            "title=từ móc câu, subtitle=câu điểm bán khách quan, text=lời dẫn lồng tiếng."
        ),
        seedream_config={
            "ref_images": [],
            "strength": 0.72,
            "consistency_mode": "style",
            "extra_prompt": (
                "Chủ thể màn hình dọc rõ ràng, khoảng trống phía trên và dưới thuận tiện chèn chữ; bố cục mỗi cảnh phải khác biệt; không xuất hiện chữ trong hình"
            ),
        },
        seedance_config={
            "motion_bias": "Đẩy nhẹ tay cầm, chuyển đổi chi tiết sản phẩm hoặc cửa hàng",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "urban_editorial", "bgm_mood": "Nhẹ nhàng chuyên nghiệp"},
        subtitle_config=dict(_HUOKE_SUB_SPLIT),
        sort_order=0,
        photoreal=True,
        shot_count_min=3,
        shot_count_max=4,
    ),
    _tpl(
        tid="huoke_xhs_recommend",
        name="Thu hút khách · Review gợi ý",
        description="Cấu trúc video ngắn chia sẻ gợi ý: Tiêu đề móc câu → ấn tượng ban đầu → trải nghiệm thực tế → gợi ý cho ai. Bìa giàu thông tin, câu từ khẩu ngữ tự nhiên.",
        style_prefix=(
            "Khung hình tĩnh video ngắn chia sẻ đời sống màn hình dọc: Ánh sáng tự nhiên tươi sáng, mặt bàn sáng màu hoặc góc cửa hàng, chi tiết sản phẩm/không gian rõ ràng, "
            "phong cách bìa tạp chí, khoảng trống phân tầng thuận tiện chèn tiêu đề, không trang điểm đậm studio, không hoạt hình"
        ),
        negative_prompt=(
            "U ám bừa bộn, cyber neon, hoạt hình anime, poster quảng cáo chèn chữ dày đặc, cắt ghép giả tạo, watermark nhòe mờ"
        ),
        default_ratio="9:16",
        shot_duration_min=4,
        shot_duration_max=8,
        structure_addon=(
            "Đây là video chia sẻ giới thiệu trải nghiệm tiếp thị khách hàng. 【Số lượng phân cảnh】Chia theo 3–5 cảnh; "
            "Sự thật không đủ thì giảm số cảnh, nghiêm cấm bịa đặt trải nghiệm để bù cảnh. "
            "Nhịp điệu: ①Tiêu đề móc câu (cảm xúc hoặc tương phản, không giống quảng cáo lộ liễu); "
            "②Tại sao tôi đến / Ấn tượng đầu tiên (chỉ lấy từ nguyên văn của người dùng); "
            "③Các điểm trải nghiệm chân thực (mỗi cảnh một chi tiết cụ thể); "
            "④Khuyên dùng cho ai / Có đáng giá không (bối cảnh lấy từ văn bản). "
            "Lời dẫn như đang trò chuyện tâm sự; title ngắn, subtitle kèm một chi tiết cụ thể. "
            "Mỗi cảnh output segments: xen kẽ visual và narration."
        ),
        seedream_config={
            "ref_images": [],
            "strength": 0.7,
            "consistency_mode": "style",
            "extra_prompt": "Màn hình dọc tươi sáng, phía trên chừa khoảng trống lớn chèn tiêu đề, trong hình không có chữ, bố cục mỗi cảnh khác biệt",
        },
        seedance_config={
            "motion_bias": "Lia máy chậm và đẩy nhẹ vào chi tiết",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "warm_storyteller", "bgm_mood": "Ấm áp nhân văn"},
        subtitle_config=dict(_HUOKE_SUB_SPLIT),
        sort_order=1,
        photoreal=True,
        shot_count_min=3,
        shot_count_max=5,
    ),
    _tpl(
        tid="huoke_review_facts",
        name="Thu hút khách · Đánh giá chi tiết",
        description="Khung hình ngang khách quan, cụ thể: Đánh giá chung → môi trường/dịch vụ → gợi ý trải nghiệm + lý do → độ tương xứng giá trị → phù hợp với ai. Giúp người xem đưa ra quyết định.",
        style_prefix=(
            "Khung hình tĩnh thuyết minh sạch sẽ: Mặt bàn sáng màu hoặc khu vực thông tin cửa hàng, không khí sản phẩm/không gian/bảng giá (không có chữ đọc được), "
            "phân cấp thông tin rõ ràng, ánh sáng đồng đều, tiết chế kiểu phim tài liệu, không hoạt hình không neon"
        ),
        negative_prompt=(
            "Hoạt hình, anime, biểu cảm phóng đại, cyber neon, giấy chứng nhận cúp giả, chữ rác trên hình, nhãn dán giảm giá nổ tung"
        ),
        default_ratio="16:9",
        shot_duration_min=5,
        shot_duration_max=10,
        structure_addon=(
            "Đây là video phân tích đánh giá khách quan tiếp thị khách hàng. 【Số lượng phân cảnh】Chia theo 3–5 cảnh; "
            "Mục nào chưa được nhắc đến thì bỏ qua, nghiêm cấm bịa đặt sự thật để bù cảnh. "
            "Nhịp điệu: ①Một câu đánh giá tổng thể (lấy từ bài viết của người dùng); "
            "②Môi trường hoặc dịch vụ (chỉ viết những gì được đề cập); "
            "③Mục khuyên dùng + lý do cụ thể (lý do phải bắt nguồn từ nguyên văn); "
            "④Chi phí và độ tương xứng giá trị (người dùng không viết giá thì không đoán mò, chuyển sang hướng dẫn chọn); "
            "⑤Bối cảnh phù hợp và kết luận (dành cho ai, không phù hợp với ai). "
            "Lời thuyết minh nghiêm túc, mật độ thông tin cao, ít tính từ sáo rỗng. "
            "Mỗi cảnh output segments: xen kẽ visual và narration; title=tên mục, subtitle=câu ngắn có thể kiểm chứng."
        ),
        seedream_config={
            "ref_images": [],
            "strength": 0.7,
            "consistency_mode": "style",
            "extra_prompt": "Bố cục thuyết minh khung hình ngang, chừa khoảng trống trái phải hoặc trên dưới để chèn chữ, không xuất hiện chữ trong hình, mỗi cảnh khác biệt rõ rệt",
        },
        seedance_config={
            "motion_bias": "Đẩy nhẹ từ từ vào chi tiết sản phẩm hoặc không gian",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "narrator_calm", "bgm_mood": "Điềm tĩnh tài liệu"},
        subtitle_config={
            "font": "SourceHanSans",
            "position": "split",
            "title_scale": 1.5,
            "sub_scale": 1.35,
            "caption_scale": 1.2,
        },
        sort_order=2,
        photoreal=True,
        shot_count_min=3,
        shot_count_max=5,
    ),
    _tpl(
        tid="huoke_soft_invite",
        name="Thu hút khách · Giới thiệu tự nhiên",
        description="Video ngắn đời thường màn hình dọc: Cảm nhận chân thực → chi tiết cụ thể → gợi ý nhẹ nhàng. Tự nhiên, không giống quảng cáo lộ liễu, phù hợp gửi bạn bè.",
        style_prefix=(
            "Khung hình tĩnh ký sự đời sống màn hình dọc: Ánh sáng bên cửa sổ, góc phố, một góc bàn hoặc đời thường tại cửa hàng, tông màu ấm tiết chế, "
            "chất liệu và làn da chân thực, tự nhiên như ảnh chụp ngẫu hứng, không quảng cáo studio cứng nhắc, không hoạt hình"
        ),
        negative_prompt=(
            "Trang điểm đậm studio, poster quảng cáo cứng nhắc, hoạt hình anime, cyber neon, người mẫu cười giả tạo, watermark nhòe mờ, nhãn dán giảm giá"
        ),
        default_ratio="9:16",
        shot_duration_min=4,
        shot_duration_max=8,
        structure_addon=(
            "Đây là video ngắn chia sẻ đời thường/cho người quen. 【Số lượng phân cảnh】Chia theo 2–3 cảnh; càng ngắn gọn càng tốt. "
            "Nhịp điệu: ①Một câu cảm nhận chân thực (gần gũi với giọng văn gốc của người dùng nhất có thể); "
            "②Một chi tiết hoặc hình ảnh cụ thể nhất trong bài; "
            "③Gợi ý nhẹ nhàng tùy chọn (nếu thích có thể hỏi mình / tự mình ghé xem), không chèn ép kêu gọi hay giảm giá dồn dập. "
            "Không dùng giọng văn gắn thẻ hashtag; không chèn emoji vào lời đọc thoại. "
            "Mỗi cảnh output segments: xen kẽ visual và narration; title cực ngắn gọn."
        ),
        seedream_config={
            "ref_images": [],
            "strength": 0.72,
            "consistency_mode": "style",
            "character_prompt": "Góc nhìn người qua đường giàu cảm giác đời sống, có thể lộ góc nghiêng hoặc chỉ lộ bàn tay và bối cảnh, trang phục thường ngày, phong thái toàn phim đồng nhất",
            "extra_prompt": "Ánh sáng ấm qua cửa sổ, cảm giác đời thường màn hình dọc, phía trên có thể chừa khoảng trống, không xuất hiện chữ trong hình",
        },
        seedance_config={
            "motion_bias": "Cảm giác rung tay nhẹ, lia máy chậm rãi",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "warm_storyteller", "bgm_mood": "Ấm áp nhân văn"},
        subtitle_config={"font": "SourceHanSans", "position": "top", "caption_scale": 1.25},
        sort_order=3,
        photoreal=True,
        shot_count_min=2,
        shot_count_max=3,
    ),
]
