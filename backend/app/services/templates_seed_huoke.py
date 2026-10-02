"""Mẫu video ngắn thu hút khách hàng (được tích hợp vào thư viện mẫu khoa học phổ biến).

结构来自共创营销 Demo 四平台骨架（小红书 / 抖音 / 点评 / 朋友圈）：
钩子→印象→分点体验→推荐给谁；0–3 秒钩子→画面→1–2 体验→CTA；
总体评价→环境服务→推荐理由→性价比→适合谁；一句感受→一个细节→轻推荐。

铁律：不编造用户没写的体验；卖点只能客观陈述；不用广告法绝对化用语。
category[0] 固定为「科普」，便于首页科普筛选；另挂「获客」「商业」。
sort_order 0–3：创建页「热门推荐」与默认模板会优先落到这四条。
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
        "category": ["科普", "获客", "商业"],
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
        name="获客·抖音钩子",
        description="竖屏口播节奏：前 3 秒钩子→场景画面→1–2 个可核验体验→到店/下单号召。适合投放获客。",
        style_prefix=(
            "竖屏获客短视频静帧：门店外立面、产品特写、服务动作或操作界面交替出现，"
            "强对比自然光，主体清晰、留白便于叠大字，电影级产品演示质感，非卡通非动漫"
        ),
        negative_prompt=(
            "卡通，动漫，赛璐璐，二次元，霓虹赛博大屏，任务清单，画面乱码文字，"
            "字幕水印，logo 乱码，虚假奖杯证书，夸张促销海报堆叠"
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
                "竖屏主体清晰，顶部与底部留白叠字；各镜构图必须不同；画面内不要出现文字"
            ),
        },
        seedance_config={
            "motion_bias": "轻微手持推进，产品或门店细节切换",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "urban_editorial", "bgm_mood": "轻快专业"},
        subtitle_config=dict(_HUOKE_SUB_SPLIT),
        sort_order=0,
        photoreal=True,
        shot_count_min=3,
        shot_count_max=4,
    ),
    _tpl(
        tid="huoke_xhs_recommend",
        name="获客·小红书安利",
        description="竖屏闺蜜安利结构：钩子Tiêu đề→第一印象→分点真实体验→推荐给谁。封面信息量高、口语化。",
        style_prefix=(
            "竖屏生活安利静帧：明亮自然光，浅色桌面或门店角落，产品/空间细节清楚，"
            "杂志封面气质、留白分层，适合叠Tiêu đề，非浓妆棚拍、非卡通"
        ),
        negative_prompt=(
            "阴暗脏乱，赛博霓虹，卡通动漫，硬广海报堆字，假抠图，水印乱码"
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
            "extra_prompt": "明亮竖屏，顶部大留白叠Tiêu đề，画面内不要出现文字，各镜场景不同",
        },
        seedance_config={
            "motion_bias": "缓慢平移与轻微推近细节",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "warm_storyteller", "bgm_mood": "温暖人文"},
        subtitle_config=dict(_HUOKE_SUB_SPLIT),
        sort_order=1,
        photoreal=True,
        shot_count_min=3,
        shot_count_max=5,
    ),
    _tpl(
        tid="huoke_review_facts",
        name="获客·口碑拆解",
        description="横屏客观详实：总体评价→环境/服务→推荐项+理由→性价比→适合谁。帮别人做决策，不抒情。",
        style_prefix=(
            "干净讲解静帧：浅色桌面或门店信息分区，产品/空间/价目氛围（无可读文字），"
            "信息层级清楚、光线均匀，纪录片式克制，非卡通非霓虹"
        ),
        negative_prompt=(
            "卡通，动漫，夸张表情包，霓虹赛博，假证书奖杯，画面乱码文字，促销爆炸贴"
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
            "extra_prompt": "横屏讲解构图，左右或上下留白叠字，画面内不要出现文字，各镜明显不同",
        },
        seedance_config={
            "motion_bias": "缓慢推近产品或空间细节",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "narrator_calm", "bgm_mood": "冷静纪实"},
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
        name="获客·熟人轻推",
        description="竖屏生活化短片：一句真实感受→一个具体细节→一句轻推荐。克制、不像广告，适合转发给熟人。",
        style_prefix=(
            "竖屏生活纪实静帧：窗光、街角、桌面一角或门店日常，暖色克制，"
            "真实材质与皮肤，像随手拍的一张，非棚拍硬广、非卡通"
        ),
        negative_prompt=(
            "棚拍浓妆，硬广海报，卡通动漫，霓虹赛博，假笑模特，水印乱码，爆炸贴"
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
            "character_prompt": "生活感路人视角，可露侧脸或只出手部与场景，着装日常，全片气质统一",
            "extra_prompt": "暖色窗光，竖屏生活感，顶部可留白，画面内不要出现文字",
        },
        seedance_config={
            "motion_bias": "轻微手持呼吸感，缓慢平移",
            "character_consistency": False,
            "generate_audio": True,
        },
        audio_config={"voice_preset": "warm_storyteller", "bgm_mood": "温暖人文"},
        subtitle_config={"font": "SourceHanSans", "position": "top", "caption_scale": 1.25},
        sort_order=3,
        photoreal=True,
        shot_count_min=2,
        shot_count_max=3,
    ),
]
