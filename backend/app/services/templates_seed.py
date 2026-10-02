"""内置风格模板 — 提示词与风格描述统一中文。

分类约定（category[0] 为主分类，用于首页筛选）：
电影感 / 真人感 / 写实感 / 科普 / 儿童 / 国风 / 科幻 / 动漫 / 3D / 商业 / 复古 / 纪录片 / 奇幻 / 图文 / 悬疑 / 开源 / 获客
获客短视频四条在 templates_seed_huoke.py，并入 TEMPLATES 末尾；category[0] 仍为科普。
真人感、写实感模板须在 seedream_config 设 photoreal: true。

一致性（seedream_config.consistency_mode）：
- character：人物+画风锁定，镜间图生图链式参考（叙事默认）
- style：仅画风气质，不锁人物、不链式参考
- diverse：按内容动态规划独立场景（开源/产品演示），禁止镜间雷同
未设置时回退 seedance/seedream 的 character_consistency。

成片方式（是否生成 AI 视频）由用户在风格配置页选择，不再由模板锁定。
模板 default_ratio 仅作画幅默认建议。
"""

from app.services.templates_seed_huoke import HUOKE_TEMPLATES

TEMPLATES: list[dict] = [
    {
        "id": "opensource_showcase",
        "name": "开源项目展示",
        "description": "按项目内容动态规划：人物操作系统界面与真实使用场景，适合开源工具与平台介绍。",
        "category": ["开源", "图文", "商业"],
        "preview_cover": "/static/templates/covers/opensource_showcase.png",
        "style_prefix": (
            "高品质产品演示静帧：人物在真实工位前操作软件/文档站/工作台，"
            "手部点击与屏幕界面清晰，排版克制、信息层级清楚，"
            "材质与配色由内容决定（浅色SaaS、纸感文档、深色IDE、终端均可），"
            "电影级产品演示质感，干净留白便于叠字，非任务清单界面"
        ),
        "negative_prompt": (
            "任务列表，todolist，勾选框，看板卡片堆叠，"
            "霓虹蓝，赛博朋克蓝光，全屏蓝紫渐变，发光网格地板，科幻HUD堆叠，"
            "卡通夸张，动漫美少女，手绘潦草，画面乱码文字，字幕水印，logo乱码，模糊，"
            "空界面无操作者，纯抽象色块"
        ),
        "default_ratio": "9:16",
        "shot_duration_min": 5,
        "shot_duration_max": 12,
        "llm_system_addon": (
            "Đây là video giới thiệu sản phẩm / mã nguồn mở. Trước tiên hãy 【Phân tích】nội dung của người dùng: loại dự án, tính năng cốt lõi, người dùng điển hình và quy trình sử dụng, "
            "sau đó mới lên kế hoạch phân cảnh và thị giác, không rập khuôn màn hình xanh neon. "
            "【Yêu cầu cứng về hình ảnh】Mỗi cảnh bắt buộc phải xuất hiện «người đang thao tác hệ thống»: "
            "người thao tác ngồi trước bàn làm việc dùng máy tính / laptop / tablet, nhấp chuột vào giao diện, điền cấu hình, xem bảng dashboard, "
            "trình diễn quy trình cốt lõi, triển khai phát hành hoặc đọc tài liệu; có thể kết hợp đặc tả màn hình, nhưng cấm cả video chỉ có giao diện trống không có người. "
            "【Từng đoạn】Mỗi cảnh xuất mảng segments: xen kẽ visual và narration; mỗi đoạn 3-12 giây, tổng thời lượng cảnh khớp với lời đọc thoại. "
            "【Thị giác】Bảng màu và phong cách giao diện đi theo nội dung (giao diện sáng màu, IDE, trang tài liệu, terminal...), cấm mặc định màu xanh neon. "
            "【Phân cảnh】Mỗi cảnh tương ứng với một tính năng hoặc kịch bản thao tác khác nhau, bố cục phải khác biệt rõ rệt, cấm danh sách việc cần làm / kịch bản drama tình cảm. "
            "title=tên ngắn của module (2-8 từ), subtitle=điểm bán năng lực (8-20 từ), text=lời đọc thuyết minh; "
            "img_prompt viết rõ tư thế nhân vật, loại giao diện trước mặt, động tác thao tác và màu sắc chủ đạo bằng tiếng Việt."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "consistency_mode": "diverse",
            "character_prompt": (
                "产品演示操作员：侧脸或过肩视角，坐在工位前操作笔记本电脑或双屏，"
                "商务休闲着装，手部与屏幕为视觉重点，五官不必抢戏，全片气质统一"
            ),
            "extra_prompt": (
                "主体为人操作系统界面，手部点击可读，禁止霓虹蓝赛博大屏；"
                "顶部与底部留白便于叠大字，画面内不要出现任何文字；"
                "本镜布局与操作动作须与其他镜头明显不同"
            ),
        },
        "seedance_config": {
            "motion_bias": "手部轻微点击与屏幕内容切换，缓慢推近工位",
            "character_consistency": False,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "轻快专业"},
        "subtitle_config": {
            "font": "SourceHanSans",
            "position": "split",
            "title_scale": 1.7,
            "sub_scale": 1.55,
            "caption_scale": 1.3,
        },
        "sort_order": 1,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "opensource_live_work",
        "name": "真人工作场景",
        "description": "真人写实工位操作：侧脸/过肩操作系统，适合开源工具与产品工作流科普。",
        "category": ["开源", "真人感", "写实感"],
        "preview_cover": "/static/templates/covers/opensource_live_work.png",
        "style_prefix": (
            "真人写实摄影，真实办公室工位，侧脸或过肩视角操作笔记本电脑/双屏，"
            "手部点击与屏幕界面清晰，自然窗光与显示器补光，商务休闲着装，"
            "皮肤与材质真实，非卡通非动漫，干净留白便于叠字"
        ),
        "negative_prompt": (
            "卡通，动漫，赛璐璐，二次元，美颜过度磨皮，CGI假人，"
            "霓虹蓝赛博大屏，任务清单堆叠，空界面无操作者，画面文字水印，模糊"
        ),
        "default_ratio": "16:9",
        "shot_duration_min": 6,
        "shot_duration_max": 12,
        "llm_system_addon": (
            "Đây là video mã nguồn mở «Bối cảnh người thật làm việc». Hãy phân tích tính năng dự án và lộ trình sử dụng trước, sau đó chia thành nhiều cảnh ngắn. "
            "【Yêu cầu cứng】Mỗi cảnh bắt buộc xuất hiện người thật thao tác hệ thống tại bàn làm việc (góc nhìn nghiêng / qua vai / tiêu điểm bàn tay, hạn chế cận cảnh mặt). "
            "【Từng đoạn】Mỗi cảnh bắt buộc xuất mảng segments: xen kẽ visual (cỡ cảnh + hành động + loại giao diện) và narration (lời đọc); "
            "mỗi đoạn thời lượng 3-12 giây, tổng thời lượng trong cảnh không quá 12 giây; lời dẫn ước tính khoảng 3-4 từ/giây, cấm kéo dài rườm rà. "
            "【Tiết tấu】Bàn làm việc giải quyết nỗi đau → cấu hình kết nối → bảng làm việc cốt lõi → kết quả quy trình → cộng tác/triển khai; bố cục và động tác cấm lặp lại giống nhau. "
            "title=tên ngắn module, subtitle=câu điểm bán, bgm toàn phim thống nhất phong cách chuyên nghiệp nhẹ nhàng."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "photoreal": True,
            "consistency_mode": "diverse",
            "character_prompt": (
                "写实产品演示操作员：侧脸或过肩，坐在工位前操作笔记本或双屏，"
                "商务休闲着装，手部与屏幕为视觉重点，五官不抢戏，气质全片统一"
            ),
            "extra_prompt": (
                "真人写实工位，手部点击可读，界面类型随内容变化；"
                "禁止正脸大特写与霓虹赛博大屏；画面内不要出现文字"
            ),
        },
        "seedance_config": {
            "motion_bias": "手部轻微点击与屏幕内容切换，缓慢推近工位",
            "character_consistency": False,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "轻快专业"},
        "subtitle_config": {
            "font": "SourceHanSans",
            "position": "split",
            "title_scale": 1.6,
            "sub_scale": 1.45,
            "caption_scale": 1.25,
        },
        "sort_order": 2,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "live_street_interview",
        "name": "真人街访口播",
        "description": "街头/通勤场景的真人出镜口播感，适合观点、体验与轻访谈科普。",
        "category": ["真人感", "纪录片"],
        "preview_cover": "/static/templates/covers/live_street_interview.png",
        "style_prefix": (
            "真人纪实街访摄影，自然光与轻微手持感，城市街道或通勤场景，"
            "真实皮肤与环境噪音感克制，非棚拍浓妆，非卡通非动漫"
        ),
        "negative_prompt": "卡通，动漫，赛璐璐，二次元，棚拍浓妆，CGI假人，霓虹赛博，画面文字水印",
        "default_ratio": "9:16",
        "shot_duration_min": 5,
        "shot_duration_max": 12,
        "llm_system_addon": (
            "Tiết tấu phỏng vấn đường phố / thuyết minh người thật. Mỗi cảnh xuất segments: thiết lập bối cảnh visual → narration thuyết minh → phản ứng/chi tiết visual. "
            "Ngoại hình nhân vật đồng nhất toàn phim; hạn chế đặc tả khuôn mặt quá mức. title ngắn gọn, subtitle là câu quan điểm."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "photoreal": True,
            "character_prompt": "真人街访主角：年龄气质、发型服装日常感固定，自然表情，全片同一人",
            "extra_prompt": "自然光街景或通勤场景，竖屏主体清晰，顶部可留白叠字",
        },
        "seedance_config": {
            "motion_bias": "轻微手持感，缓慢推近",
            "character_consistency": True,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "温暖人文"},
        "subtitle_config": {"font": "SourceHanSans", "position": "top", "caption_scale": 1.3},
        "sort_order": 3,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "live_product_desk",
        "name": "真人桌面演示",
        "description": "桌面俯拍/斜俯写实：真人双手演示产品或笔记本流程，适合工具评测与教程。",
        "category": ["真人感", "写实感", "商业"],
        "preview_cover": "/static/templates/covers/live_product_desk.png",
        "style_prefix": (
            "真人桌面产品演示摄影，斜俯或过肩，木质/浅色桌面，笔记本与手部清晰，"
            "柔和棚灯或窗光，材质真实，非卡通非插画"
        ),
        "negative_prompt": "卡通，动漫，赛璐璐，二次元，空桌无手，霓虹赛博，画面乱码文字水印",
        "default_ratio": "16:9",
        "shot_duration_min": 5,
        "shot_duration_max": 12,
        "llm_system_addon": (
            "Video trình diễn trên bàn làm việc. Mỗi cảnh segments bắt buộc có visual thao tác bàn tay + narration; "
            "Cỡ cảnh chuyển đổi linh hoạt giữa toàn cảnh mặt bàn, đặc tả bàn tay và nội dung màn hình, cấm các cảnh giống nhau."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "photoreal": True,
            "consistency_mode": "diverse",
            "character_prompt": "写实双手与小臂为主，可露侧脸；着装简洁，全片气质统一",
            "extra_prompt": "桌面斜俯，手部与产品/屏幕清晰，画面内无文字",
        },
        "seedance_config": {
            "motion_bias": "手部点击滑动，轻微推近屏幕",
            "character_consistency": False,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "冷静纪实"},
        "subtitle_config": {
            "font": "SourceHanSans",
            "position": "split",
            "title_scale": 1.5,
            "sub_scale": 1.4,
            "caption_scale": 1.25,
        },
        "sort_order": 4,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "portrait_story",
        "name": "竖屏图文故事",
        "description": "竖屏插画叙事，电影感构图，适合历史人文短片。",
        "category": ["图文", "电影感", "故事"],
        "preview_cover": "/static/templates/covers/portrait_story.png",
        "style_prefix": "统一二维概念插画，细腻光影与电影感构图，非写实摄影、非日系赛璐璐动漫，竖屏主体偏中下，顶部留白便于叠字，画面干净无文字",
        "negative_prompt": "写实照片，真人，真实人脸，摄影棚，电影真人剧照，日系动漫赛璐璐，画面文字，字幕，水印，标题字，logo，模糊",
        "default_ratio": "9:16",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Phân chia cảnh theo tiết tấu câu chuyện: Khởi - Thừa - Chuyển - Hợp. Mỗi cảnh có title tiêu đề ngắn, subtitle phụ đề ngắn gọn, text là lời thuyết minh đọc được. Hình ảnh toàn phim phải đồng nhất phong cách tranh minh họa và ngoại hình nhân vật, nghiêm cấm cảnh này đột ngột biến thành ảnh người thật hay phong cách anime khác.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "故事主角外形固定：年龄感、发型发色、服装配色与辨识物全片一致，细腻插画五官，非真人照片",
            "extra_prompt": "竖屏构图，主体偏中下，顶部约1/4留白，电影感光影，画面内无文字",
        },
        "seedance_config": {
            "motion_bias": "缓慢推近或轻拉远",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "叙事氛围"},
        "subtitle_config": {
            "font": "SourceHanSans",
            "position": "top",
            "title_scale": 1.4,
            "sub_scale": 1.35,
            "caption_scale": 1.3,
        },
        "sort_order": 5,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "anim_3d",
        "name": "3D 动画",
        "description": "电影级三维动画质感，圆润造型与柔和体积光，适合科普讲解与故事短片。",
        "category": ["3D", "动漫", "科普"],
        "preview_cover": "/static/templates/covers/anim_3d.png",
        "style_prefix": (
            "电影级三维动画渲染，皮克斯/梦工厂气质，圆润造型与清晰轮廓，"
            "柔和体积光与次表面散射，干净材质与饱和配色，浅景深，"
            "非写实摄影、非日系赛璐璐平面、非剪纸扁平"
        ),
        "negative_prompt": (
            "写实照片，真人皮肤毛孔，摄影棚实拍，日系赛璐璐，二次元平涂，"
            "剪纸扁平，像素风，手绘潦草，血腥恐怖，水印，画面文字，字幕乱码"
        ),
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": (
            "Tiết tấu tự sự hoạt hình 3D: Thiết lập bối cảnh → Hành động nhân vật → Trình diễn then chốt / Điểm kiến thức. "
            "【Phong cách】Toàn phim bắt buộc đồng nhất phong cách hoạt hình 3D CGI và tạo hình nhân vật, cấm cảnh này biến thành ảnh người thật hay 2D phẳng. "
            "Khi liên quan đến phần mềm/hệ thống/khoa học, ưu tiên nhân vật 3D ngồi tại bàn hoặc trong bối cảnh thao tác giao diện, trình diễn quy trình. "
            "Mỗi cảnh title ngắn, subtitle là câu điểm bán; img_prompt viết rõ chất liệu 3D, ánh sáng và tư thế nhân vật."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "consistency_mode": "character",
            "character_prompt": (
                "固定 3D 动画角色：圆润比例、简洁五官、识别度高的发型发色与服装配色，"
                "塑料感柔和皮肤与布料材质，全片同一人物设定"
            ),
            "extra_prompt": (
                "三维渲染体积光，干净材质，饱和但不刺眼，主体清晰，"
                "画面内不要出现文字；可留白便于叠字"
            ),
        },
        "seedance_config": {
            "motion_bias": "轻微布料与发丝飘动，缓慢推近，动画感运镜平滑",
            "character_consistency": True,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "轻快专业"},
        "subtitle_config": {
            "font": "SourceHanSans",
            "position": "bottom",
            "title_scale": 1.5,
            "sub_scale": 1.4,
            "caption_scale": 1.25,
        },
        "sort_order": 5,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "live_cinematic",
        "name": "真人电影感",
        "description": "真人实拍电影质感，戏剧光影与浅景深，适合叙事短片。",
        "category": ["电影感", "真人感"],
        "preview_cover": "/static/templates/covers/live_cinematic.png",
        "style_prefix": "真人电影感摄影，电影级打光与浅景深，胶片质感与轻微颗粒，青橙调色，写实皮肤与真实材质，宽银幕构图，非卡通非动漫",
        "negative_prompt": "卡通，动漫，赛璐璐，二次元，扁平插画，剪纸，像素，夸张五官，塑料皮肤，水印，画面文字",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Phân cảnh theo chuẩn điện ảnh người thật: Cảnh toàn thiết lập → Trung cảnh → Cận cảnh. Toàn phim bắt buộc đồng nhất phong cách hiện thực người thật và ngoại hình diễn viên, cấm cảnh nào biến thành hoạt hình.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.75,
            "photoreal": True,
            "character_prompt": "真人演员外形固定：年龄、发型发色、面部特征、服装全片一致，写实皮肤质感",
            "extra_prompt": "电影打光、浅景深、胶片颗粒，真实场景材质",
        },
        "seedance_config": {
            "motion_bias": "电影感推轨或轻微横移，自然运动模糊",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "电影氛围"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom", "caption_scale": 1.3},
        "sort_order": 6,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "live_person",
        "name": "真人感叙事",
        "description": "生活化真人出镜感，适合人物故事、口播与纪实短片。",
        "category": ["真人感", "故事"],
        "preview_cover": "/static/templates/covers/live_person.png",
        "style_prefix": "真人感生活摄影，自然光与柔和环境光，真实人物五官与皮肤质感，纪实构图，非棚拍浓妆，非卡通非动漫",
        "negative_prompt": "卡通，动漫，赛璐璐，二次元，美颜过度磨皮，CGI假人，扁平插画，水印，画面文字",
        "default_ratio": "9:16",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tiết tấu tự sự nhân vật, lời dẫn khẩu ngữ tự nhiên gần gũi. Toàn phim đồng nhất phong cách hiện thực người thật và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "photoreal": True,
            "character_prompt": "真人出镜主角：年龄气质、发型发色、服装日常感固定，自然表情，全片同一人",
            "extra_prompt": "自然光、生活场景、竖屏主体清晰，顶部可留白叠字",
        },
        "seedance_config": {
            "motion_bias": "轻微手持感，缓慢推近",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "温暖人文"},
        "subtitle_config": {"font": "SourceHanSans", "position": "top"},
        "sort_order": 7,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "photo_realism",
        "name": "写实摄影",
        "description": "照片级写实质感，适合产品、风光与纪实科普。",
        "category": ["写实感", "摄影"],
        "preview_cover": "/static/templates/covers/photo_realism.png",
        "style_prefix": "照片级写实摄影，清晰细节与真实材质，自然色彩，高动态范围，微距或风光皆可，非卡通非插画非动漫",
        "negative_prompt": "卡通，动漫，赛璐璐，扁平插画，油画笔触，剪纸，像素，过度HDR伪色，水印，画面文字",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Ngôn ngữ ống kính nhiếp ảnh hiện thực: Toàn cảnh thiết lập → Đặc tả chi tiết. Nếu có nhân vật phải đồng nhất ngoại hình toàn phim; có thể là cảnh thuần bối cảnh không người. Cấm phong cách hoạt hình.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "photoreal": True,
            "character_prompt": "若出现人物：写实五官与发型服装固定；若无人物则专注真实场景与材质",
            "extra_prompt": "照片级细节、真实材质、自然色彩，清晰主体",
        },
        "seedance_config": {
            "motion_bias": "缓慢推近或轻微横移，真实空间感",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "冷静纪实"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 7,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "film_cinematic",
        "name": "电影感胶片",
        "description": "宽银幕胶片质感与戏剧光影，适合叙事短片与氛围故事。",
        "category": ["电影感", "胶片"],
        "preview_cover": "/static/templates/covers/film_cinematic.png",
        "style_prefix": "电影感概念插画，宽银幕构图，胶片颗粒与轻微暗角，戏剧光影（侧光/逆光），青橙调色倾向，浅景深氛围，非写实摄影、非赛璐璐动漫",
        "negative_prompt": "写实照片，真人，真实人脸，日系动漫，赛璐璐，扁平贴纸风，过曝，水印，画面文字，卡通简笔画",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Theo tiết tấu phân cảnh điện ảnh: Cảnh toàn thiết lập → Cận cảnh → Cảnh phản ứng. Thoại tiết chế, nhường không gian cho hình ảnh. Toàn phim đồng nhất phong cách minh họa film nhựa và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "电影感插画主角，明确年龄与发型发色，服装轮廓与辨识物固定，面部细节适中非照片，全片同一人设",
            "extra_prompt": "胶片颗粒、暗角、戏剧光影，青橙氛围，宽银幕主体明确",
        },
        "seedance_config": {
            "motion_bias": "缓慢推轨或轻微横移，电影感运镜，避免抖动",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "电影氛围"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 8,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "noir_thriller",
        "name": "黑色悬疑",
        "description": "高对比光影与冷调氛围，适合悬疑、案件与暗夜叙事。",
        "category": ["悬疑", "电影感"],
        "preview_cover": "/static/templates/covers/noir_thriller.png",
        "style_prefix": "黑色电影概念插画，高对比明暗交界，冷青灰与少量暖光点缀，雨夜或室内台灯氛围，剪影与侧脸，非写实摄影",
        "negative_prompt": "明亮粉彩，儿童绘本，日系美少女，写实照片，真人，血腥特写，水印，画面文字",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Tiết tấu hồi hộp giật gân: Manh mối → Bước ngoặt đảo chiều → Căng thẳng dồn dập. Thoại câu ngắn, khung hình tận dụng bóng đổ và sức căng bố cục. Toàn phim đồng nhất phong cách minh họa phim noir.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "Noir 风插画角色，轮廓清晰，大衣或标志性剪影，面部少光，外形全片一致",
            "extra_prompt": "高对比阴影、冷调、雨夜或台灯，强构图张力",
        },
        "seedance_config": {
            "motion_bias": "极慢推近，烟雾或雨丝轻微飘动",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "悬疑低沉"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 9,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "vox_papercut",
        "name": "Vox剪纸科普",
        "description": "低饱和扁平剪纸，以人物操作电脑/系统界面为主画面，适合硬核科普与产品讲解。",
        "category": ["科普", "剪纸"],
        "preview_cover": "/static/templates/covers/vox_papercut.png",
        "style_prefix": (
            "Vox剪纸扁平插画，层叠剪纸边缘，低饱和，干净剪影，科普解说片气质；"
            "画面以人物操作电脑或业务系统为主：工位前操作、手指点击界面、多屏监控、"
            "配置参数、流程演示，屏幕与手部动作清晰，信息图表为辅"
        ),
        "negative_prompt": (
            "写实照片，真人照片级皮肤，三维写实渲染，日系动漫，模糊，噪点，水印，"
            "画面乱码文字，空镜风景无人物无界面，纯抽象色块无操作场景"
        ),
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 15,
        "llm_system_addon": (
            "Phân cảnh theo tiết tấu thuyết minh khoa học, lời dẫn tự nhiên, mật độ thông tin vừa phải. "
            "【Yêu cầu cứng về hình ảnh】Mỗi cảnh bắt buộc xuất hiện «người đang thao tác hệ thống»: "
            "nhân vật phong cách cắt giấy ngồi trước bàn/bảng điều khiển dùng máy tính/tablet, nhấp chuột, gõ phím, chuyển menu, "
            "kiểm tra dashboard, điền biểu mẫu, so sánh trước sau, trình diễn quy trình then chốt... "
            "Có thể kết hợp đặc tả màn hình hoặc sơ đồ cấu trúc, nhưng cấm cả phim chỉ có hình khái niệm rỗng không có người thao tác. "
            "title/subtitle tóm tắt kiến thức của cảnh; img_prompt viết rõ tư thế nhân vật, loại nội dung màn hình trước mặt và thao tác hành động. "
            "Toàn phim đồng nhất phong cách cắt giấy và một tạo hình người thao tác duy nhất."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": (
                "固定剪纸操作员：简洁人形剪影、低细节面部、工装或休闲色块服装固定，"
                "常坐工位前操作笔记本电脑或双屏控制台，发型与配色全片一致"
            ),
            "extra_prompt": (
                "主体为人操作电脑/系统界面，屏幕区块与点击手势可读，"
                "层叠纸片边缘清晰，低饱和，单镜一个视觉焦点，避免写实皮肤"
            ),
        },
        "seedance_config": {
            "motion_bias": "手部轻微点击与光标移动感，屏幕内容轻切换，缓慢推近工位",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "好奇纪录片"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 10,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "docu_warm",
        "name": "温暖纪实",
        "description": "纪实插画气质与暖色调，适合人物故事与人文纪录短片。",
        "category": ["纪录片", "电影感"],
        "preview_cover": "/static/templates/covers/docu_warm.png",
        "style_prefix": "温暖纪实概念插画，自然光感，柔和暖棕与米白，生活场景细节，纪录片构图，非写实照片、非动漫赛璐璐",
        "negative_prompt": "赛博霓虹，日系美少女，血腥，夸张卡通，写实照片，真人，水印，画面文字",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 14,
        "llm_system_addon": "Tiết tấu tài liệu nhân văn: Quan sát → Chi tiết → Điểm chạm cảm xúc. Lời dẫn ôn hòa, chân thành. Toàn phim đồng nhất phong cách tranh minh họa tài liệu ấm áp và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.68,
            "character_prompt": "纪实插画人物，生活化发型服装，亲切五官，年龄感明确，全片同一人设",
            "extra_prompt": "暖色自然光，生活场景，纪录片式构图，柔和颗粒",
        },
        "seedance_config": {
            "motion_bias": "手持感极轻晃动或缓慢横移，纪实运镜",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "温暖人文"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 12,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "kids_flat",
        "name": "儿童绘本扁平",
        "description": "柔和配色与圆润造型，适合儿童科普与故事。",
        "category": ["儿童", "绘本"],
        "preview_cover": "/static/templates/covers/kids_flat.png",
        "style_prefix": "儿童绘本扁平插画，柔和粉彩，圆润造型，友好角色，简洁背景",
        "negative_prompt": "恐怖，阴暗，写实照片，复杂纹理，血腥",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Dùng các câu ngắn trẻ em dễ hiểu, mỗi cảnh làm nổi bật một yếu tố hình ảnh đáng yêu, tiết tấu vui tươi nhanh nhẹn.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.65,
            "character_prompt": "圆润可爱卡通角色，大眼睛简化五官，柔和配色服装，友好表情，全片同一角色外形",
            "extra_prompt": "粉彩柔光，背景简洁，造型圆润，适合儿童观看",
        },
        "seedance_config": {
            "motion_bias": "轻微弹跳感，柔和镜头漂移",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "俏皮轻快"},
        "subtitle_config": {"font": "RoundedSans", "position": "bottom"},
        "sort_order": 20,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "soft_anime",
        "name": "柔光动漫",
        "description": "日系柔光赛璐璐，适合青春故事与情感短片。",
        "category": ["动漫", "故事"],
        "preview_cover": "/static/templates/covers/soft_anime.png",
        "style_prefix": "日系柔光赛璐璐动漫，干净线稿，柔和渐变天空，大眼睛精致五官，统一角色设定，非写实摄影、非水墨、非剪纸",
        "negative_prompt": "写实照片，真人，真实人脸，水墨，剪纸，像素风，血腥恐怖，水印，画面文字，三头身Q版混用",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tự sự anime thanh xuân: Xen kẽ cảnh cảm xúc + cảnh đối thoại. Toàn phim bắt buộc đồng nhất phong cách cel-shaded anime và tạo hình nhân vật, cấm cảnh này biến thành người thật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "日系动漫主角，发型发色瞳色固定，校服或常服配色固定，赛璐璐五官，全片同一人设",
            "extra_prompt": "柔光、干净线稿、柔和天空，统一赛璐璐上色",
        },
        "seedance_config": {
            "motion_bias": "轻微发丝与衣袂飘动，缓慢推近",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "青春轻音乐"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 22,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "chalk_whiteboard",
        "name": "粉笔白板手绘",
        "description": "黑板粉笔讲解风，突出人物操作系统/画流程图的课堂演示。",
        "category": ["科普", "手绘"],
        "preview_cover": "/static/templates/covers/chalk_whiteboard.png",
        "style_prefix": (
            "黑板粉笔与白板手绘讲解风，粉笔笔触，示意图箭头；"
            "画面常含简笔人物在白板或电脑前操作系统、画流程、指点界面"
        ),
        "negative_prompt": "写实照片，光滑三维，杂乱界面，空教室无人物",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 15,
        "llm_system_addon": (
            "Thiên về cấu trúc giảng giải: Định nghĩa → Ví dụ → So sánh. "
            "Mỗi cảnh cố gắng xuất hiện nhân vật nét vẽ phấn thao tác hệ thống hoặc trình diễn quy trình trên bảng trắng "
            "(chỉ tay vào màn hình, vẽ mũi tên module, so sánh trước sau thao tác), tránh việc chỉ có ký hiệu trừu tượng mà không có người thao tác."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.6,
            "character_prompt": (
                "粉笔简笔讲解者/操作员，线条简洁特征固定，"
                "常站在白板前或坐在电脑前指点界面"
            ),
            "extra_prompt": "黑板/白板底，人物操作系统或画流程图，箭头清晰，教学感构图",
        },
        "seedance_config": {
            "motion_bias": "手部指点与线条逐步显现，镜头基本固定或轻推",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "teacher_clear", "bgm_mood": "专注氛围"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 30,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "cyber_neon",
        "name": "赛博霓虹",
        "description": "霓虹夜城与未来感，适合科技、都市与科幻话题。",
        "category": ["科幻", "赛博"],
        "preview_cover": "/static/templates/covers/cyber_neon.png",
        "style_prefix": "赛博朋克概念插画，霓虹粉青对比，雨夜反光街道，未来都市剪影，高对比夜景，非写实摄影、非儿童绘本",
        "negative_prompt": "日光沙滩，田园水彩，儿童粉彩，写实照片，真人，水墨留白，水印，画面文字",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tiết tấu công nghệ / đô thị nhanh, mỗi cảnh một biểu tượng thị giác mạnh mẽ (neon, màn hình, đêm mưa). Toàn phim đồng nhất phong cách minh họa cyberpunk.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "赛博风插画角色，外套剪裁与发色固定，霓虹边缘光，面部非照片，全片同一人设",
            "extra_prompt": "霓虹粉青、雨夜反光、未来都市，强对比夜景",
        },
        "seedance_config": {
            "motion_bias": "霓虹闪烁，雨丝下落，缓慢穿梭运镜",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "赛博电子"},
        "subtitle_config": {"font": "DisplaySans", "position": "bottom"},
        "sort_order": 35,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "epic_fantasy",
        "name": "奇幻史诗",
        "description": "宏大场景与奇幻光影，适合神话、冒险与世界观短片。",
        "category": ["奇幻", "电影感"],
        "preview_cover": "/static/templates/covers/epic_fantasy.png",
        "style_prefix": "奇幻史诗概念插画，宏大远景与英雄中景，暮光与神性光束，岩石城堡与云海，戏剧构图，非写实摄影、非现代都市",
        "negative_prompt": "现代城市，手机界面，写实照片，真人，儿童简笔画，赛博霓虹，水印，画面文字",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 14,
        "llm_system_addon": "Tự sự sử thi: Đại cảnh thiết lập thế giới quan → Nhân vật xuất hiện → Xung đột cao trào. Thoại mang âm hưởng trang trọng. Toàn phim đồng nhất phong cách minh họa kỳ ảo.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "奇幻主角外形固定：盔甲或斗篷轮廓、发色、武器辨识物全片一致，插画五官非照片",
            "extra_prompt": "宏大场景、暮光神性光束、戏剧构图，史诗氛围",
        },
        "seedance_config": {
            "motion_bias": "缓慢升降镜头，云雾与旗帜飘动",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "史诗管弦"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 38,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "magazine_collage",
        "name": "杂志拼贴",
        "description": "剪报拼贴与印刷纹理，适合文化话题与品牌故事。",
        "category": ["商业", "拼贴"],
        "preview_cover": "/static/templates/covers/magazine_collage.png",
        "style_prefix": "杂志纸质拼贴，撕边，网纹印刷质感，层叠剪贴，大胆平面构图",
        "negative_prompt": "纯净矢量，写实皮肤，脏污发灰的色彩",
        "default_ratio": "9:16",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Ưu tiên tác động thị giác, mỗi cảnh một bố cục ấn tượng, lời văn ngắn gọn và mạnh mẽ.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.75,
            "character_prompt": "杂志剪贴人像剪影或印刷半调人物，外形与配色全片统一",
            "extra_prompt": "撕边纸质、网纹印刷、大胆色块，竖屏强构图",
        },
        "seedance_config": {
            "motion_bias": "图层轻微滑动旋转，纸张沙沙感",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "时髦轻电子"},
        "subtitle_config": {"font": "DisplaySans", "position": "center"},
        "sort_order": 40,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "brand_clean",
        "name": "极简品牌",
        "description": "干净色块与强留白，适合产品解说与品牌短片。",
        "category": ["商业", "极简"],
        "preview_cover": "/static/templates/covers/brand_clean.png",
        "style_prefix": "极简品牌概念插画，大面积留白，有限色板（黑白+一强调色），几何构图，干净产品感，非写实摄影、非杂乱拼贴",
        "negative_prompt": "杂乱纹理，霓虹赛博，血腥，儿童粉彩堆砌，写实照片，真人，水印，画面乱文字",
        "default_ratio": "9:16",
        "shot_duration_min": 3,
        "shot_duration_max": 10,
        "llm_system_addon": "Câu thương mại ngắn gọn: Điểm bán → Bối cảnh → Đúc kết. Mỗi cảnh một tiêu điểm thị giác. Toàn phim đồng nhất phong cách minh họa thương hiệu tối giản.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.68,
            "character_prompt": "极简几何化人物或手部剪影，配色固定，低细节面部，全片外形一致",
            "extra_prompt": "大留白、有限色板、几何构图，竖屏品牌感",
        },
        "seedance_config": {
            "motion_bias": "色块轻移，极慢推近，干净无抖动",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "极简电子"},
        "subtitle_config": {"font": "DisplaySans", "position": "center"},
        "sort_order": 42,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "pixel_retro",
        "name": "像素复古科普",
        "description": "8-bit/16-bit 像素风，适合科技史与游戏化讲解。",
        "category": ["复古", "像素"],
        "preview_cover": "/static/templates/covers/pixel_retro.png",
        "style_prefix": "复古像素画，16位有限色板，清晰像素块，简单游戏场景，无抗锯齿",
        "negative_prompt": "平滑渐变，写实照片，模糊像素",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": (
            "Tiết tấu mang cảm giác vượt ải game, các điểm thông tin chuyển thành icon pixel dễ nhận biết. "
            "Khi liên quan đến phần mềm / hệ thống / công cụ, ưu tiên nhân vật pixel ngồi trước máy tính thao tác, nhấp menu, trình diễn quy trình kiểu qua màn."
        ),
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "16位像素小人操作员，坐在电脑前，有限色板，外形与调色全片不变",
            "extra_prompt": "像素小人操作系统界面，清晰像素块，无抗锯齿，游戏关卡式场景",
        },
        "seedance_config": {
            "motion_bias": "逐帧点击与屏幕切换，轻微视差滚动",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "retro_host", "bgm_mood": "8位好奇"},
        "subtitle_config": {"font": "PixelFont", "position": "bottom"},
        "sort_order": 50,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "retro_vhs",
        "name": "复古 VHS",
        "description": "磁带录像与扫描线质感，适合怀旧故事与年代感内容。",
        "category": ["复古", "电影感"],
        "preview_cover": "/static/templates/covers/retro_vhs.png",
        "style_prefix": "复古 VHS 概念插画，轻微色差与扫描线暗示，1980–90s 色调，圆角电视框感构图，怀旧氛围，非写实照片、非现代超清UI",
        "negative_prompt": "超清现代广告，赛博霓虹堆砌，写实照片，真人，儿童粉彩，水印，画面乱码文字",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tự sự hoài niệm, lời dẫn mang cảm giác thời đại. Toàn phim đồng nhất chất cảm minh họa băng VHS và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "怀旧风插画人物，年代感发型服装固定，轻微色差边缘，非照片，全片同一人设",
            "extra_prompt": "扫描线暗示、轻微色差、80/90年代色调，怀旧构图",
        },
        "seedance_config": {
            "motion_bias": "轻微磁带抖动感，慢推，色差微闪",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "retro_host", "bgm_mood": "怀旧合成器"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 52,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "ink_guofeng",
        "name": "水墨国风",
        "description": "水墨留白与写意笔触，适合历史与文化短故事。",
        "category": ["国风", "水墨"],
        "preview_cover": "/static/templates/covers/ink_guofeng.png",
        "style_prefix": "中国水墨写意插画，富有表现力的笔触，大量留白，诗意氛围，淡雅墨色，非写实摄影",
        "negative_prompt": "写实照片，真人，真实人脸，霓虹，赛博朋克，日系动漫，欧美卡通，画面文字，字幕，水印",
        "default_ratio": "9:16",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Tự sự thiên về ý cảnh và bước ngoặt, lời thoại đậm chất văn học, tiết tấu khoảng lặng giàu cảm xúc. Thích hợp video đồ họa chữ màn hình dọc: Mỗi cảnh tiêu đề ngắn + phụ đề thơ mộng, kèm lời thuyết minh có thể đọc được.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "水墨写意人物，简笔眉眼，宽袍或古装轮廓固定，墨色淡雅，全片同一人设",
            "extra_prompt": "大量留白，淡墨渲染，诗意意境，竖屏顶部可叠字",
        },
        "seedance_config": {
            "motion_bias": "墨晕渗开与消散，缓慢升降镜头，薄雾飘动",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "guqin_narrator", "bgm_mood": "古筝氛围"},
        "subtitle_config": {"font": "KaiTi", "position": "top"},
        "sort_order": 60,
        "is_active": True,
        "is_premium": False,
    },
]

TEMPLATES.extend(HUOKE_TEMPLATES)
