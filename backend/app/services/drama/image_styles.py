"""Bộ truyện tranh có ID kiểu hình ảnh tích hợp và các đoạn từ gợi ý hình ảnh."""

from __future__ import annotations

import logging
import time
from pathlib import Path

logger = logging.getLogger(__name__)

# Bảng phong cách vẽ tranh chỉ đề cập đến khí chất. Nghiêm cấm sao chép các ký tự và bố cục trong ảnh tham khảo.
STYLE_BOARD_PROMPT_HINT = (
    "Kèm ảnh tham khảo phong cách mỹ thuật: Chỉ mượn tông màu, nét vẽ, ánh sáng và khí chất tổng thể, "
    "nghiêm cấm sao chép nhân vật, chủ thể bối cảnh và bố cục của ảnh đó."
)

_STYLE_BOARD_EXTS = (".png", ".jpg", ".jpeg", ".webp")
_board_url_cache: dict[tuple[str, int, int], str] = {}
_board_fail_cache: dict[tuple[str, int, int], float] = {}
_BOARD_FAIL_TTL_SEC = 60.0

# IMAGE_STYLE_IDS ID kiểu tích hợp (phù hợp với dramaImageStyles giao diện người dùng)
IMAGE_STYLE_IDS = (
    "wartime-epic-film",
    "retro-sci-fi-atompunk",
    "palace-intrigue-cold",
    "domestic-suspense-cold",
    "ancient-romance-soft",
    "ancient-chinese-mythology",
    "japanese-youth-film",
    "japanese-daily-natural",
    "korean-urban-soft",
    "chinese-urban-realistic",
    "wuxia-realistic-photo",
    "90s-realistic-film",
    "retro-narrative-film",
    "american-retro-hollywood",
    "neon-cyberpunk-film",
    "90s-rural-china-film",
    "cgi-3d-animation",
    "ghibli-handdrawn-anime",
    "tezuka-era-cartoon",
    "shanghai-animation",
    "pixel-art",
    "shadow-puppet-illustration",
    # Nhóm 2: Khoa học, Huyền bí & Công nghệ
    "hard-sci-fi-interstellar",
    "mystic-cyber-occult",
    "steampunk-victorian-machinery",
    "biopunk-organic-tech",
    "quantum-abstract-dimension",
    "holographic-futuristic-ui",
    "cosmic-horror-lovecraftian",
    # Nhóm 3: Thương mại, Thời trang & Triển lãm
    "high-fashion-editorial",
    "luxury-minimalist-gallery",
    "vintage-parisian-couture",
    "futuristic-avant-garde",
    "commercial-product-cinematic",
    "neon-runway-glow",
    "pop-art-color-block",
    # Nhóm 4: Đời sống Thực tế & Con người
    "documentary-natgeo-human",
    "warm-family-nostalgia",
    "street-life-candid",
    "cozy-coffee-indie",
    "coastal-fishing-village",
    "workshop-artisan-craft",
    "autumn-golden-hour",
    "visual-diary-pov",
    "fly-on-the-wall-doc",
    "raw-transparent-portrait",
    "candid-unscripted-moments",
    # Nhóm 5: Đô thị, Văn hóa & Xã hội
    "cyber-tokyo-night",
    "traditional-heritage-festive",
    "monochrome-noir-city",
    "subway-metro-commute",
    "ancient-temple-zen",
    "brutalist-concrete-architecture",
    "carnival-vintage-fair",
    "raw-urban-workforce",
    # Nhóm 6: Không gian, Ẩm thực & Thể thao
    "deep-space-nebula",
    "culinary-dark-moody",
    "street-food-night-market",
    "extreme-sports-action",
    "stadium-epic-championship",
    "fine-dining-michelin",
    "zen-tea-ceremony",
)

# Kiểu IMAGE_STYLE_PROMPTS → đoạn từ gợi ý
IMAGE_STYLE_PROMPTS: dict[str, str] = {
    "wartime-epic-film": (
        "35mm胶片电影质感，悲壮战争史诗风格，低饱和暖沉色调，真实战场硝烟与战火残垣，"
        "质朴乡村废墟与战时环境，富有情绪张力的自然电影光影，"
        "饱经战火风霜的写实人物与军装质感，粗粝真实皮肤肌理，忌过度美化、忌磨皮、忌偶像剧滤镜。"
        "Tông màu film 35mm trầm ấm, khói lửa chiến trường chân thực, làng quê mộc mạc, "
        "ánh sáng điện ảnh giàu cảm xúc, trang phục lính và thôn quê thời chiến chân thật, "
        "không làm mịn da hay màu mè bóng bẩy. 35mm film grain, warm muted tones, cinematic wartime realism."
    ),
    "retro-sci-fi-atompunk": (
        "Phong cách retro sci-fi atompunk, thẩm mỹ chủ nghĩa vị lai thập niên 1950, kim loại khí động học và biểu tượng năng lượng nguyên tử, "
        "ánh sáng neon rực rỡ, chất liệu kim loại, màu sắc tương phản cao, hạt phim nhẹ. "
        "复古科幻原子朋克风格，1950年代未来主义美学，流线型金属与原子能符号，霓虹高光，金属质感，高对比色彩，轻微胶片颗粒"
    ),
    "palace-intrigue-cold": (
        "Phong cách phim mưu quyền cung đình thâm trầm sắc lạnh, tông tối độ bão hòa thấp, ánh sáng kiềm chế, bố cục trang nghiêm, "
        "không khí cung đình xa hoa nhưng ngột ngạt, đường nét góc cạnh, ánh sáng bên giàu kịch tính. "
        "中国宫廷权谋题材冷峻风格，低饱和暗调，克制光影，庄重构图，华贵但压抑的宫廷氛围，硬朗轮廓，戏剧化侧光"
    ),
    "domestic-suspense-cold": (
        "Phong cách phim ly kỳ giật gân tông lạnh, thiên về xám xanh, ánh sáng mờ tối, bóng đổ đậm, chất cảm nhiếp ảnh hiện thực, không khí căng thẳng nghẹt thở, chi tiết phong phú. "
        "国产悬疑影视冷调风格，偏青灰色调，低调光，阴影浓重，写实摄影质感，紧张压抑氛围，细节丰富"
    ),
    "ancient-romance-soft": (
        "Phong cách phim tình cảm cổ trang duy mỹ ánh sáng mềm, làm mờ mơ màng, vầng sáng voan mỏng ấm áp, trang phục cổ trang tinh xảo, xóa phông hậu cảnh, không khí lãng mạn bay bổng. "
        "中国古代偶像剧唯美柔光风格，梦幻柔焦，暖色薄纱光晕，精致古装妆造，背景虚化，浪漫飘逸氛围"
    ),
    "ancient-chinese-mythology": (
        "Phong cách sử thi thần thoại cổ đại, khí chất hồng hoang thượng cổ, núi sông mờ mịt cùng mây mù thần quang, đồ đồng lễ khí và trang phục vải thô mộc mạc, "
        "tông màu thủy mặc thanh lục và khoáng chất, trang nghiêm thần thánh, đại cảnh sử thi, ánh sáng điện ảnh. "
        "中国古代神话史诗风格，上古洪荒气质，苍茫山河与云雾神光，青铜礼器与粗纻麻衣质感，水墨青绿与矿物颜料色调，庄严神圣，史诗大场面，电影级光影"
    ),
    "japanese-youth-film": (
        "Phong cách nhiếp ảnh phim nhựa thanh xuân Nhật Bản, tông màu Kodak film, ánh nắng tự nhiên, trường ảnh nông, hạt mịn, không khí thường nhật mộc mạc chân thành. "
        "日式青春题材胶片摄影风格，柯达胶片色调，自然阳光，浅景深，细腻颗粒，青涩真挚的日常氛围"
    ),
    "japanese-daily-natural": (
        "Phong cách tài liệu đời sống ánh sáng tự nhiên Nhật Bản, ánh sáng dịu, độ tương phản thấp, bối cảnh đời thường chân thực, tĩnh lặng chữa lành, chất cảm phim nhẹ. "
        "日式生活纪录片自然光影风格，柔和自然光，低对比，真实日常场景，安静治愈，轻微胶片质感"
    ),
    "korean-urban-soft": (
        "Phong cách phim truyền hình đô thị Hàn Quốc ánh sáng mềm, bộ lọc tông ấm, làn da trong trẻo, hậu cảnh đô thị xóa phông, không khí ánh sáng dịu dàng lãng mạn. "
        "韩剧都市题材柔光风格，暖色滤镜，通透肤质，都市背景虚化，浪漫温柔灯光氛围"
    ),
    "chinese-urban-realistic": (
        "Phong cách nhiếp ảnh hiện thực đô thị đời sống, ánh sáng tự nhiên, bối cảnh chân thực, tông màu trung tính, chi tiết sắc nét, không tô vẽ quá đà. "
        "国产都市现实题材写实摄影风格，自然光，真实生活场景，中性色调，细节锐利，无过度美化"
    ),
    "wuxia-realistic-photo": (
        "Phong cách nhiếp ảnh hiện thực kiếm hiệp giang hồ, ánh sáng tự nhiên, địa hình và chất cảm trang phục chân thật, bố cục động lực học, không khí giang hồ, trường ảnh điện ảnh. "
        "中国武侠江湖题材写实摄影风格，自然光影，真实地形与服饰质感，动态构图，江湖氛围，电影级景深"
    ),
    "90s-realistic-film": (
        "Phong cách phim điện ảnh hiện thực thập niên 1990, chất cảm phim nhựa, màu da tự nhiên, trang phục và bối cảnh đậm nét thời đại, tương phản êm dịu, tông màu hoài niệm. "
        "1990年代写实电影风格，胶片质感，自然肤色，时代感服装与环境，柔和对比，怀旧色调"
    ),
    "retro-narrative-film": (
        "Phong cách phim điện ảnh tự sự cổ điển, bố cục điện ảnh kinh điển, phối màu phim nhựa, dàn cảnh giàu tính kể chuyện, ánh sáng chuẩn điện ảnh. "
        "复古叙事电影风格，经典电影构图，胶片色彩分级，富有故事感的场景调度，电影级布光"
    ),
    "american-retro-hollywood": (
        "Phong cách thời hoàng kim Hollywood cổ điển Mỹ, ánh sáng tương phản cao, tông ấm rực rỡ hoặc đen trắng kinh điển, thần thái minh tinh, trường ảnh hoa lệ. "
        "美式复古好莱坞黄金年代风格，高对比布光，暖调彩色或经典黑白，明星质感，华丽景深"
    ),
    "neon-cyberpunk-film": (
        "Phong cách phim điện ảnh cyberpunk neon, ánh đèn neon xanh tím, vệt phản chiếu đêm mưa, độ tương phản cao, đô thị tương lai, khói sương và hiệu ứng ánh sáng hologram. "
        "霓虹赛博朋克电影风格，蓝紫霓虹灯光，雨夜反射，高对比，未来都市，烟雾与全息感光效"
    ),
    "90s-rural-china-film": (
        "Phong cách phim điện ảnh nông thôn thập niên 1990, ánh sáng tự nhiên, tông màu vàng đất và xanh lá, chất cảm thô mộc chân thực, không khí sinh hoạt thôn quê. "
        "1990年代中国农村题材电影风格，自然光，土黄与绿色调，粗糙真实质感，乡土生活氛围"
    ),
    "cgi-3d-animation": (
        "Phong cách hoạt hình 3D CGI chuẩn điện ảnh, tinh thần Pixar/DreamWorks, tạo hình bo tròn đường nét rõ ràng, ánh sáng khối mềm mại và tán xạ dưới bề mặt, chất liệu sạch màu sắc bão hòa, trường ảnh nông. "
        "电影级三维 CGI 动画风格，皮克斯/梦工厂气质，圆润造型与清晰轮廓，柔和体积光与次表面散射，干净材质与饱和配色，浅景深"
    ),
    "ghibli-handdrawn-anime": (
        "Khí chất hoạt hình 2D vẽ tay, hậu cảnh màu nước và bột màu, ánh sáng tự nhiên dịu nhẹ cùng hoàng hôn vàng óng, tỷ lệ cơ thể và ngũ quan mộc mạc, trang phục đời thường, cỏ cây tươi tốt, thảm cỏ lay động trong gió và mây trôi bềnh bồng, tông màu vàng đất ấm áp và xanh lam lục, phối cảnh không khí và bố cục điện ảnh. "
        "手绘二维动画电影气质，水彩与水粉背景，柔和自然光与金色黄昏，写实人体比例与朴素五官，生活化服饰，茂盛草木、风吹草地与流动云层，温暖土黄与青绿，空气透视与电影构图"
    ),
    "tezuka-era-cartoon": (
        "Phong cách hoạt hình Nhật Bản kinh điển thời Osamu Tezuka, nét vẽ tối giản, mảng màu phẳng hoạt hình retro, chất cảm hoạt họa hoài niệm. "
        "手冢治虫时代经典日式卡通画风，简洁线条，复古动画平涂着色，怀旧动画质感"
    ),
    "shanghai-animation": (
        "Phong cách hoạt hình kinh điển Xưởng phim Mỹ thuật Thượng Hải, phong vị hội họa dân tộc, kết hợp màu nước và công bút truyền thống, thi vị duy mỹ, màu sắc cổ phong. "
        "上海美术电影制片厂经典动画画风，中国民族绘画韵味，水彩与工笔结合，诗意唯美，传统色彩"
    ),
    "pixel-art": (
        "Phong cách nghệ thuật pixel, khối điểm ảnh rõ ràng, thẩm mỹ game retro, bảng màu giới hạn, chất cảm 8-bit hoặc 16-bit hoài niệm. "
        "像素艺术风格，清晰像素块，复古游戏美学，有限色板，8-bit 或 16-bit 质感"
    ),
    "shadow-puppet-illustration": (
        "Phong cách tranh minh họa múa rối bóng dân gian, đường nét bóng cắt, hoa văn chạm rỗng, ngược sáng ấm áp, tính trang trí nghệ thuật dân gian, hiệu ứng bóng đổ xếp lớp. "
        "中国皮影戏插画画风，剪影轮廓，镂空纹理，暖色背光，民间艺术装饰性，层叠投影效果"
    ),
    # Nhóm 2: Khoa học, Huyền bí & Công nghệ
    "hard-sci-fi-interstellar": (
        "Phong cách khoa học viễn tưởng không gian sâu, trạm vũ trụ hiện thực và phi thuyền module phức tạp, ánh sáng lạnh của sao băng và tinh vân xa xôi, kính buồng lái phản chiếu vũ trụ, vật liệu composite và hợp kim mờ, hạt phim IMAX 70mm, cảm giác đơn độc hùng vĩ. "
        "硬核科幻星际深空风格，写实空间站与精密模块飞船，冷调星光与深空星云，座舱玻璃反射，复合材料与哑光合金，70mm IMAX胶片颗粒，孤独宏大氛围。"
        "Hard sci-fi interstellar realism, realistic space station and modular spacecraft, cold starlight, IMAX 70mm film grain, deep space cinematic lighting."
    ),
    "mystic-cyber-occult": (
        "Phong cách huyền bí công nghệ Cyber Occult, ký tự cổ phù chú phát quang neon kết hợp dây cáp mạng và vi mạch, bóng tối kỳ bí, khói sương huyền ảo, ánh sáng tím than và ngọc lục bảo ma mị, không khí siêu nhiên công nghệ. "
        "赛博秘术超自然风格，霓虹发光符文结合数据电缆与微电路，神秘暗调，迷幻烟雾，深紫与荧光翡翠绿光效，科技巫术氛围。"
        "Mystic cyber occult aesthetic, glowing neon runes intertwined with cables and circuits, dark atmospheric fog, deep violet and emerald lighting, techno-sorcery."
    ),
    "steampunk-victorian-machinery": (
        "Phong cách Steampunk cơ khí Victoria, bánh răng đồng thau và ống hơi nước xì khói áp lực, đồng hồ cơ tinh xảo, trang phục quý tộc thế kỷ 19 kết hợp kính bảo hộ cơ khí, tông nâu đồng và hổ phách ấm áp, ánh sáng đèn khí đốt. "
        "维多利亚蒸汽朋克机械风格，黄铜齿轮与高压蒸汽管道，精密机械钟表，19世纪贵族服饰结合机械风镜，暖棕色与琥珀色调，煤气灯光影。"
        "Victorian steampunk machinery, brass gears, polished copper, pressure steam pipes, 19th-century attire with brass goggles, warm amber and gaslight tones."
    ),
    "biopunk-organic-tech": (
        "Phong cách công nghệ sinh học Biopunk, cấu trúc mô hữu cơ phát quang sinh học kết hợp vi mạch cấy ghép, ống nghiệm nuôi cấy phôi thai, ánh huỳnh quang xanh lục và xanh lam neon, phòng thí nghiệm tương lai bí ẩn, chất cảm nhớt ẩm ướt chân thực. "
        "生化朋克有机科技风格，生物荧光有机组织结合植入式芯片，胚胎培养舱，荧光绿与霓虹蓝光芒，神秘未来实验室，湿润质感细节。"
        "Biopunk organic technology, bioluminescent tissues, cybernetic implants, embryo cultivation tanks, fluorescent cyan and green illumination, wet organic textures."
    ),
    "quantum-abstract-dimension": (
        "Phong cách không gian lượng tử đa chiều, đường chân trời fractal gãy khúc, sóng ánh sáng lượng tử đa sắc, hình học phi Euclide lơ lửng, trường năng lượng hạt phát sáng lộng lẫy, cảm giác siêu thực vi mô và vĩ mô hòa quyện. "
        "量子多维抽象空间风格，分形几何折叠地平线，多彩量子光波，非欧几里得几何悬浮体，发光粒子能量场，微观与宏观交织的超现实感。"
        "Quantum abstract multidimensional space, fractal folding geometry, vibrant quantum light waves, glowing particle fields, surreal physics defying."
    ),
    "holographic-futuristic-ui": (
        "Phong cách giao diện tương lai Hologram, màn hình quang học trong suốt lơ lửng 3D, biểu đồ và bản đồ số cyan và magenta rực rỡ, trung tâm điều khiển tối tân, ánh sáng phản chiếu trên mắt kính và gương mặt nhân vật, chiều sâu trường ảnh sắc nét. "
        "全息未来交互界面风格，悬浮3D透明光电屏幕，亮青色与品红数字图表，高科技指挥中心，镜面与面部高光倒影，锐利景深。"
        "Holographic futuristic UI, floating 3D transparent displays, glowing cyan and magenta data interfaces, sleek command center, sharp cinematic depth of field."
    ),
    "cosmic-horror-lovecraftian": (
        "Phong cách kinh dị vũ trụ Lovecraftian, bầu trời tinh vân quái dị méo mó, bóng tối vực thẳm sâu thẳm, kiến trúc đá cự thạch phi nhân loại phủ rêu xanh u ám, sương mù dày đặc che khuất thực tại, ánh sáng lân tinh lạnh lẽo rùng rợn. "
        "洛夫克拉夫特宇宙克苏鲁风格，扭曲诡异星云天空，深渊暗调，覆满暗绿苔藓的非人巨石建筑，浓重迷雾，冰冷幽暗的磷光光效。"
        "Lovecraftian cosmic horror, cyclopean non-euclidean architecture, eerie twisted sky, suffocating fog, deep ominous shadows, faint eerie bioluminescence."
    ),
    # Nhóm 3: Thương mại, Thời trang & Triển lãm
    "high-fashion-editorial": (
        "Phong cách thời trang cao cấp Haute Couture, ánh sáng studio chuẩn tạp chí Vogue/Harper's Bazaar, tương phản sắc nét, thần thái người mẫu góc cạnh kiêu kỳ, bố cục tối giản sang trọng, chất liệu vải nhung và lụa lấp lánh chi tiết. "
        "高端时尚大片封面风格，Vogue/Harper杂志影棚布光，锐利高对比，超模高冷骨骼感轮廓，极简奢华构图，丝绒与丝绸精致质感。"
        "High-fashion editorial photography, Vogue magazine studio lighting, sharp contrast, statuesque model poses, haute couture garments, luxurious textures."
    ),
    "luxury-minimalist-gallery": (
        "Phong cách triển lãm nghệ thuật tối giản, không gian tường trắng bê tông vi mô tinh khiết, ánh sáng tự nhiên dịu nhẹ từ giếng trời trên cao, bóng đổ hình học sắc cạnh, tác phẩm điêu khắc nghệ thuật đương đại, trật tự và sang trọng tinh tế. "
        "极简当代艺术画廊风格，微水泥白墙纯净空间，天窗柔和自然天光，利落几何投影，当代雕塑艺术品，极简秩序与高级留白。"
        "Luxury minimalist art gallery, clean micro-cement walls, soft skylight illumination, sharp geometric shadows, contemporary sculptures, elegant spatial order."
    ),
    "vintage-parisian-couture": (
        "Phong cách thời trang cổ điển Paris thập niên 1960, hạt phim Kodak Portra mềm mại, đường phố đá cuội Paris và quán cà phê cổ, trang phục nhung dạ thanh lịch mang hơi thở thời đại, ánh nắng chiều thu mật ong lãng mạn hoài cổ. "
        "复古巴黎高定胶片风格，1960年代柯达Portra胶片颗粒，巴黎鹅卵石街道与复古咖啡馆，优雅毛呢与高定时装，秋日金色斜阳浪漫怀旧。"
        "Vintage Parisian couture, 1960s Kodak Portra 35mm grain, cobblestone Paris streets, elegant woolen fashion, warm autumn golden light, timeless romanticism."
    ),
    "futuristic-avant-garde": (
        "Phong cách thời trang vị lai Avant-Garde, trang phục điêu khắc kim loại lỏng chrome bóng loáng, phom dáng bất đối xứng táo bạo, ánh sáng studio phân cực, chất liệu sợi quang và nhựa phản quang trong suốt, tính tương lai đột phá. "
        "未来前卫先锋时装风格，流动液态铬金属雕塑时装，夸张不对称剪裁，偏振光影棚布光，光纤与透明反光材质，突破性未来感。"
        "Futuristic avant-garde fashion, liquid chrome sculptural garments, exaggerated silhouettes, polarized studio lighting, iridescent reflective materials."
    ),
    "commercial-product-cinematic": (
        "Phong cách quảng cáo thương mại điện ảnh, chụp cận cảnh macro sản phẩm cao cấp, giọt nước phản chiếu li ti, ánh sáng viền rim light sắc nét, nền tối mờ nhung mượt mà, độ phân giải chi tiết cực cao, tôn vinh chất liệu kim loại và thủy tinh. "
        "电影级商业静物广告风格，高奢产品微距特写，晶莹水珠反射，锐利轮廓光，柔和暗调绒面虚化背景，极致金属与玻璃材质细节。"
        "Cinematic commercial product photography, macro closeup, crisp rim lighting, droplet reflections, smooth velvety bokeh, luxury metallic and glass textures."
    ),
    "neon-runway-glow": (
        "Phong cách sàn diễn thời trang ánh sáng Neon, đường băng catwalk tráng gương đen phản chiếu dải đèn LED rực rỡ, ánh sáng tím hồng hiện đại, chuyển động bay bổng của vải voan lụa, góc chụp từ thấp lên đầy quyền uy lộng lẫy. "
        "炫彩霓虹T台大秀风格，黑色镜面T台倒影璀璨LED光带，紫红当代霓虹色调，轻盈飘逸薄纱动态，仰拍霸气高燃氛围。"
        "Neon fashion runway show, glossy black reflective runway, glowing LED light strips, magenta and violet neon glow, dynamic flowing fabrics, low-angle model walk."
    ),
    "pop-art-color-block": (
        "Phong cách Pop Art tương phản khối, mảng màu nguyên bản rực rỡ vàng đỏ xanh lam, độ bão hòa cao, cảm hứng Andy Warhol và tạp chí thập niên 1980, viền nét đồ họa rõ ràng, phong cách thời thượng năng động. "
        "波普艺术高反差色块风格，高饱和红黄蓝纯色撞色，安迪沃霍尔与80年代复古画报灵感，清晰粗轮廓线条，极具视觉冲击力与趣味性。"
        "Pop art color block style, bold saturated primary colors, high contrast graphic framing, Andy Warhol aesthetic, clean illustrative contours, vibrant punchy mood."
    ),
    # Nhóm 4: Đời sống Thực tế & Con người
    "documentary-natgeo-human": (
        "Phong cách phóng sự nhân văn National Geographic, ánh sáng tự nhiên chân thực, chân dung giàu cảm xúc với ánh mắt có hồn, nếp nhăn và nét mặt từng trải, bối cảnh đời thường xúc động, độ sâu trường ảnh điện ảnh tài liệu. "
        "国家地理人文纪实风格，真实自然光照，深刻眼眸的人文肖像，沧桑面部纹理与真挚情感，动人生活实景，纪实电影景深。"
        "National Geographic documentary portraiture, raw authentic lighting, soulful eyes, weathered facial texture, genuine human emotion, documentary realism."
    ),
    "warm-family-nostalgia": (
        "Phong cách ký ức gia đình ấm áp, tông màu vàng cam ấm cúng, tia nắng chiếu qua rèm cửa sổ, khoảnh khắc sum vầy tự nhiên không sắp đặt, hạt phim 16mm hoài niệm, ngập tràn tình yêu thương và sự bình yên. "
        "温馨家庭治愈怀旧风格，暖橙温润色调，窗帘透射丁达尔光束，不加雕琢的真诚团聚瞬间，16mm怀旧胶片颗粒，安宁祥和治愈感。"
        "Warm family nostalgia, cozy amber and honey tones, sunlight streaming through curtains, candid family moments, soft 16mm film grain, heartfelt peaceful warmth."
    ),
    "street-life-candid": (
        "Phong cách khoảnh khắc đường phố chân thực, góc nhìn phóng viên ảnh đường phố Leica, bắt trọn nhịp sống vội vã, bóng đổ xiên buổi sớm và vũng nước phản chiếu, khoảnh khắc quyết định (decisive moment), chi tiết đời sống sinh động. "
        "街头抓拍现实主义风格，徕卡人文街拍视角，捕捉匆匆市井生机，晨昏斜长阴影与地面水渍倒影，决定性瞬间，鲜活生活质感。"
        "Street life candid photography, Leica 35mm street perspective, urban hustle and bustle, decisive moment capture, puddle reflections, authentic urban textures."
    ),
    "cozy-coffee-indie": (
        "Phong cách quán cà phê Indie chiều mưa, hơi ấm ly cà phê bốc khói nhẹ, cửa kính đọng nước mưa mờ ảo, đèn sợi đốt Edison vàng dịu, sách và bàn gỗ thông mộc mạc, cảm giác thư thái yên tĩnh sâu lắng. "
        "独立咖啡馆慢生活风格，咖啡杯袅袅热气，雨雾水汽玻璃窗，爱迪生钨丝灯柔暖光晕，木质斑驳书卷桌台，慵懒惬意静谧氛围。"
        "Cozy indie coffeehouse, steaming artisanal coffee, rain-streaked window pane, warm Edison bulb glow, rustic wooden table, peaceful introspective warmth."
    ),
    "coastal-fishing-village": (
        "Phong cách làng chài ven biển mộc mạc, sương sớm mờ ảo trên bến cảng, thuyền gỗ cũ kỹ và lưới đánh cá đẫm nước biển, tông màu xanh ngọc bích hòa lẫn xám cát, con người lao động kiên cường giữa thiên nhiên bao la. "
        "质朴渔港海风纪实风格，晨雾缭绕的码头港湾，斑驳老木船与湿润渔网，青苍海蓝与沙灰沉稳色调，劳作身影与浩瀚大海的共鸣。"
        "Coastal fishing village documentary, morning mist over harbor, weathered wooden boats, wet fishing nets, muted seafoam and sandy grey tones, resilient coastal life."
    ),
    "workshop-artisan-craft": (
        "Phong cách nghệ nhân xưởng thủ công, bụi gỗ và mạt kim loại lơ lửng trong luồng sáng hắt xiên, bàn tay chai sạn tỉ mỉ gọt giũa đồ da hoặc gốm sứ, gam màu nâu da bò và gỗ mun trầm ấm, ánh sáng ven nổi khối sắc nét. "
        "传统匠人手作工坊风格，丁达尔光线中悬浮的木屑微尘，专注雕琢皮具或陶瓷的老茧双手，深褐牛皮与原木温润沉淀，立体侧逆光。"
        "Artisan craft workshop, dust particles suspended in dramatic sunbeam, weathered hands sculpting ceramics or leather, warm rich walnut tones, tactile craftsmanship."
    ),
    "autumn-golden-hour": (
        "Phong cách hoàng hôn mùa thu rực rỡ, thảm lá phong vàng cam trải dài, ánh nắng chiều tà mật ong ấm áp xuyên qua tán cây, trường ảnh nông mềm mại, bầu không khí lãng mạn êm đềm đầy chất thơ. "
        "金秋暖阳浪漫时刻风格，金黄落叶铺地，温暖蜜糖色斜阳穿透树林，如梦似幻浅景深，充满诗意的浪漫宁静氛围。"
        "Autumn golden hour, vibrant amber and russet foliage, honey-colored sunset backlight, dreamy creamy bokeh, poetic romantic warmth."
    ),
    "visual-diary-pov": (
        "Phong cách Nhật ký Thị giác góc nhìn POV chân thực, góc nhìn thứ nhất (point-of-view) chân thực như chính mắt người trải nghiệm, cắt góc ngẫu hứng tự nhiên, ánh sáng môi trường thực tế không dàn dựng, chi tiết cuộc sống thường nhật gần gũi và sống động. "
        "第一人称POV视觉日记风格，第一视角沉浸体验，随性真实生活切角构图，自然室内外环境光，未修饰的生动日常细节与临场感。"
        "First-person POV visual diary realism, point-of-view perspective, spontaneous unposed composition, natural ambient room and outdoor light, authentic lived-in slice-of-life textures."
    ),
    "fly-on-the-wall-doc": (
        "Phong cách Phim tài liệu ẩn mình quan sát tự nhiên, ống kính quan sát thầm lặng từ xa không can thiệp, cử chỉ và biểu cảm hoàn toàn tự nhiên chân thực 100%, ánh sáng môi trường có sẵn không đèn flash, chiều sâu trường ảnh điện ảnh tài liệu mộc mạc. "
        "墙上苍蝇静默观察纪录片风格，隐秘无干扰中远景机位，捕捉人物百分之百真实自然神态与举止，全现场环境光，纯粹质朴纪实影调。"
        "Fly-on-the-wall documentary photography, quiet unobtrusive observation from distance, completely unscripted natural gestures, available ambient light without flash, pure authentic cinéma vérité feel."
    ),
    "raw-transparent-portrait": (
        "Phong cách Chân dung mộc nguyên bản tả thực, cận cảnh ngang tầm mắt trung thực, giữ trọn vẹn kết cấu da, nếp nhăn, lỗ chân lông, sợi tóc rối và ánh mắt có hồn mà không qua chỉnh sửa làm đẹp, ánh sáng cửa sổ ban ngày dịu nhẹ hắt nghiêng. "
        "真实原生人像风格，平视特写，完整保留肌肤肌理、细纹、毛孔、凌乱发丝与深邃眼神，拒绝美颜滤镜，柔和侧窗自然漫射天光。"
        "Raw and transparent portraiture, honest eye-level close-up, authentic skin texture, pores, fine lines, flyaway hair, soulful emotive eyes, unfiltered realism, soft window side light."
    ),
    "candid-unscripted-moments": (
        "Phong cách Bắt khoảnh khắc tức thì ngẫu hứng, tốc độ chụp cực nhanh bắt trọn chuyển động trong tích tắc, tiếng cười bộc phát hoặc ánh nhìn lơ đãng, độ mờ nhòe chuyển động (motion blur) tự nhiên gia tăng cảm giác sống động, nhịp sống chân thực tức thì. "
        "动态即时抓拍瞬息瞬间风格，高速快门捕捉毫秒间真情流露，突发欢笑或漫不经心凝望，轻微自然动态模糊增添真实临场感，鲜活动感。"
        "Candid unscripted moment capture, high-speed shutter catching fleeting instantaneous emotion, spontaneous burst of laughter, subtle natural motion blur, authentic kinetic energy."
    ),
    # Nhóm 5: Đô thị, Văn hóa & Xã hội
    "cyber-tokyo-night": (
        "Phong cách đêm đô thị Tokyo lung linh, biển hiệu đèn lồng đỏ truyền thống hòa quyện dải LED neon khổng lồ Shinjuku đêm mưa, vũng nước phản chiếu đa sắc, nhịp sống sầm uất đa tầng lớp, chiều sâu điện ảnh ngoạn mục. "
        "东京赛博迷幻夜景风格，居酒屋红灯笼与新宿巨型霓虹屏交织，雨夜沥青路面彩色倒影，密集层次感都市天际线，浓厚电影质感。"
        "Cyber Tokyo nightlife, traditional lanterns blending with towering neon billboards, rain-slicked asphalt reflections, dense urban depth, cinematic atmospheric haze."
    ),
    "traditional-heritage-festive": (
        "Phong cách lễ hội văn hóa truyền thống, hàng ngàn lồng đèn đỏ rực rỡ, pháo hoa nở rộ trên bầu trời đêm, trang phục cổ truyền thêu gấm lộng lẫy, điệu múa lân sư rồng sôi động, không khí sum vầy tưng bừng ấm áp. "
        "东方传统民俗节庆风格，千门万户张灯结彩，漫天璀璨烟花，锦缎刺绣华美民俗服饰，舞龙舞狮热烈动态，喜庆祥和团聚氛围。"
        "Traditional festive heritage, crimson lantern illuminations, sparkling fireworks in night sky, ornate embroidered garments, lion dance energy, joyous cultural warmth."
    ),
    "monochrome-noir-city": (
        "Phong cách phim Noir đô thị đen trắng, đen trắng tương phản cực cao (high contrast chiaroscuro), bóng đổ dài của người mặc áo măng-tô dưới đèn đường đêm sương, khói thuốc bảng lảng, vẻ bí ẩn cô đơn lạnh lùng. "
        "黑白胶片黑色电影风格，极致明暗对比 chiaroscuro，路灯下风衣身影的修长影子，暗夜雨雾与缭绕烟雾，冷峻孤独的悬疑侦探氛围。"
        "Monochrome noir city, dramatic high-contrast chiaroscuro, long shadows under streetlamps, trench coat silhouette in night mist, cigarette smoke, gritty detective mystery."
    ),
    "subway-metro-commute": (
        "Phong cách chuyến tàu điện ngầm đô thị, ánh đèn huỳnh quang toa tàu lạnh lùng, đoàn tàu lao nhanh vút qua sân ga mờ nhòe tốc độ, gương mặt trầm tư của hành khách đô thị, bố cục khung hình điện ảnh đương đại sắc sảo. "
        "都市地下铁通勤纪实风格，车厢冷调荧光灯照耀，站台列车疾驰动态模糊，通勤者沉思侧影，现代都市孤独感电影构图。"
        "Subway metro commute, cool fluorescent illumination, motion blur of rushing trains, contemplative commuter expressions, modern urban isolation, cinematic framing."
    ),
    "ancient-temple-zen": (
        "Phong cách chùa cổ thanh tịnh thiền định, sân đá rêu phong sau mưa, khói trầm hương lượn lờ trong nắng sớm, mái ngói cong cổ kính rũ giọt sương, tiếng chuông đồng tĩnh lặng an nhiên, gam màu xanh rêu và gỗ mun trầm lắng. "
        "古刹青苔禅境沉思风格，雨后青石苔藓阶梯，晨曦幽微沉香青烟，古建飞檐滴水，古拙铜钟与幽静庭院，空灵禅意深远。"
        "Ancient Zen temple, mossy stone pavers, incense smoke curling in early morning sunbeams, weathered wooden eaves, dew drops, serene spiritual tranquility."
    ),
    "brutalist-concrete-architecture": (
        "Phong cách kiến trúc bê tông Brutalism, khối bê tông thô khổng lồ với các đường nét hình học sắc sảo, ánh sáng xiên mạnh mẽ đổ bóng góc cạnh, tông xám tro và bầu trời u ám tĩnh mịch, cảm giác hùng vĩ choáng ngợp và siêu thực. "
        "野兽派几何混凝土建筑风格，粗粝厚重混凝土几何巨构，强烈侧光雕刻硬朗阴影，冷灰极简与苍茫天空，震撼人心的纪念碑式力量感。"
        "Brutalist concrete architecture, monumental geometric concrete forms, raw textured surfaces, sharp dramatic angular shadows, stoic overcast sky, majestic grandeur."
    ),
    "carnival-vintage-fair": (
        "Phong cách hội chợ đêm Vintage lung linh, vòng đu quay khổng lồ rực sáng đèn bóng tròn ấm áp, quầy trò chơi gỗ cổ điển và bóng bay rực rỡ, ánh sáng mờ ảo lung linh cổ tích, cảm giác hoài niệm tuổi thơ ngọt ngào. "
        "复古游乐园童话夜风格，复古摩天轮旋转光轮，暖色泡泡钨丝灯环绕，彩旗与木质复古摊位，梦幻散景光斑，童真怀旧氛围。"
        "Vintage carnival night fair, illuminated Ferris wheel with incandescent bulbs, carousel glow, festive pennants, dreamy bokeh orbs, magical nostalgic childhood aura."
    ),
    "raw-urban-workforce": (
        "Phong cách Hiện thực đô thị và lao động đời thường, tái hiện nhịp sống người lao động và đường phố chân thực, vệt mồ hôi trên áo, khói bụi đô thị, hàng quán vỉa hè lúc hoàng hôn chạng vạng, ánh đèn đường cao áp vàng cam hắt trên nền bê tông và nhựa đường. "
        "市井都会劳动纪实风格，真实重现城市脉搏与劳动者身姿，汗渍浸透的工作服，市井烟火与街头尘嚣，暮色黄昏高压路灯下的混凝土与沥青路面。"
        "Raw urban and workforce realism, working class everyday hustle, sweat stains on work clothes, gritty street atmosphere, twilight dusk street food stalls, warm sodium vapor streetlight on weathered concrete."
    ),
    # Nhóm 6: Không gian, Ẩm thực & Thể thao
    "deep-space-nebula": (
        "Phong cách tinh vân vũ trụ sâu thẳm, dải ngân hà rực rỡ sắc màu tím hồng và xanh sapphire, bụi sao lấp lánh như kim cương, hành tinh khổng lồ với vành đai tráng lệ, quy mô vũ trụ kỳ vĩ bao la bất tận. "
        "深邃太空宇宙星云风格，紫红与宝蓝壮美星系星云，钻石般璀璨星尘粒子，拥有华丽光环的宏伟行星，浩瀚深空极致壮丽。"
        "Deep space cosmic nebula, breathtaking magenta and sapphire interstellar clouds, shimmering star clusters, ringed planetary giants, vast sublime celestial scale."
    ),
    "culinary-dark-moody": (
        "Phong cách nhiếp ảnh ẩm thực Dark Moody, nền gỗ hoặc đá phiến tối màu mộc mạc, ánh sáng ven hắt lên món ăn nóng hổi, khói bốc nghi ngút thơm lừng, gia vị rắc rơi tự nhiên đóng băng giữa không trung, ngon mắt và sang trọng. "
        "暗调高级美食摄影风格，深色石板与粗糙原木台面，聚焦侧逆光勾勒热气与多汁质感，微粒香料悬停定格，高级沉静食欲感。"
        "Dark moody culinary photography, rustic dark slate background, dramatic side rim light catching steam and textures, frozen sprinkle of seasonings, appetizing sophistication."
    ),
    "street-food-night-market": (
        "Phong cách chợ đêm ẩm thực đường phố, chảo gang xèo xèo bốc lửa ngùn ngụt, dầu mỡ óng ánh trên xiên que nướng, khói thơm nghi ngút dưới ánh đèn vàng ấm áp, dòng người tấp nập tràn trề sức sống đời thường. "
        "烟火人间夜市大排档风格，铁板镬气升腾爆炒火焰，金黄油脂滋滋作响，暖色大灯泡下的浓郁市井烟火气，热气腾腾生活气息。"
        "Street food night market, sizzling cast iron wok with dancing flames, glistening skewers, fragrant smoke under warm halogen bulbs, vibrant bustling night atmosphere."
    ),
    "extreme-sports-action": (
        "Phong cách thể thao mạo hiểm tốc độ cao, góc máy siêu rộng GoPro/Fish-eye kịch tính, hạt tuyết hoặc giọt nước bắn tung tóe đóng băng chuyển động sắc lẹm (high shutter speed), ánh sáng mặt trời ngược chói lòa, năng lượng bùng nổ. "
        "极限运动高速定格风格，超广角鱼眼动感构图，冰雪水花极速飞溅定格，高快门清晰动态，烈日逆光镜头眩光，爆发力与张力。"
        "Extreme sports high-speed action, dynamic fisheye/wide-angle perspective, frozen water and snow spray at 1/8000s shutter, intense sun flare, adrenaline-fueled power."
    ),
    "stadium-epic-championship": (
        "Phong cách sân vận động đêm chung kết, dàn đèn pha công suất lớn hắt rực sáng mặt cỏ xanh mướt, mưa pháo giấy kim tuyến bay rợp trời, biển khán giả cuồng nhiệt vỡ òa cảm xúc, ánh sáng thể tích điện ảnh hùng tráng. "
        "史诗体育场决战之夜风格，巨型球场探照灯光柱，绿茵草皮水滴反光，金色纸带漫天飞扬，万人欢呼呐喊沸腾全场，史诗级戏剧光影。"
        "Epic championship stadium night, blazing stadium floodlights, lush green pitch reflections, confetti rain falling from above, roaring crowd atmosphere, triumphant cinematic drama."
    ),
    "fine-dining-michelin": (
        "Phong cách ẩm thực cao cấp Michelin, đĩa sứ trắng hoặc đá mài tinh tế, bài trí món ăn nghệ thuật tối giản, nước xốt vẽ giọt điêu luyện, hoa lá ăn được trang trí thanh tao, ánh sáng khuếch tán dịu nhẹ sang trọng tột bậc. "
        "米其林艺术料理美学风格，极简雅致瓷盘盛放，几何结构点缀可食用花卉与酱汁拉花，柔和漫射光影，高端典雅美食品鉴质感。"
        "Fine dining Michelin plating art, exquisite minimalist presentation on custom ceramic plate, delicate sauce droplets, edible micro-flowers, soft diffuse lighting, haute gastronomy."
    ),
    "zen-tea-ceremony": (
        "Phong cách trà đạo thiền tịnh, ấm trà đất nung tử sa nghi ngút khói thơm thanh nhã, khay trà tre mộc mạc đọng giọt nước trong vắt, ánh ban mai xiên qua mành trúc, hoa trà trắng thả nhẹ trên mặt nước, thanh tịnh an nhiên. "
        "静心禅意茶道雅集风格，紫砂茶壶升腾袅袅清香，润泽竹制茶盘与晶莹水珠，竹帘漏下初晨光影，素雅白茶花静卧水面，幽静怡人。"
        "Zen tea ceremony, steaming handcrafted purple clay teapot, natural bamboo tea tray, morning sunlight filtering through bamboo blinds, floating white camellia, mindful tranquility."
    ),
}

# Tên hiển thị kiểu IMAGE_STYLE_LABELS
IMAGE_STYLE_LABELS: dict[str, str] = {
    "wartime-epic-film": "悲壮战争史诗电影",
    "retro-sci-fi-atompunk": "复古科幻原子朋克",
    "palace-intrigue-cold": "宫斗权谋冷峻",
    "domestic-suspense-cold": "国产悬疑冷调",
    "ancient-romance-soft": "古偶唯美柔光",
    "ancient-chinese-mythology": "中国古代神话史诗",
    "japanese-youth-film": "日式青春胶片",
    "japanese-daily-natural": "日式生活自然",
    "korean-urban-soft": "韩剧都市柔光",
    "chinese-urban-realistic": "国产都市写实",
    "wuxia-realistic-photo": "武侠江湖写实摄影",
    "90s-realistic-film": "90年代写实电影",
    "retro-narrative-film": "复古叙事电影",
    "american-retro-hollywood": "美式复古好莱坞",
    "neon-cyberpunk-film": "霓虹赛博电影",
    "90s-rural-china-film": "90年代中国农村电影",
    "cgi-3d-animation": "3D 动画",
    "ghibli-handdrawn-anime": "宫崎骏气质手绘",
    "tezuka-era-cartoon": "手冢治虫时代卡通画风",
    "shanghai-animation": "上美画风",
    "pixel-art": "像素风",
    "shadow-puppet-illustration": "皮影戏插画",
    # Nhóm 2: Khoa học, Huyền bí & Công nghệ
    "hard-sci-fi-interstellar": "硬核科幻星际深空",
    "mystic-cyber-occult": "赛博秘术超自然",
    "steampunk-victorian-machinery": "维多利亚蒸汽朋克机械",
    "biopunk-organic-tech": "生化朋克有机科技",
    "quantum-abstract-dimension": "量子多维抽象空间",
    "holographic-futuristic-ui": "全息未来交互界面",
    "cosmic-horror-lovecraftian": "洛夫克拉夫特宇宙克苏鲁",
    # Nhóm 3: Thương mại, Thời trang & Triển lãm
    "high-fashion-editorial": "高端时尚大片封面",
    "luxury-minimalist-gallery": "极简当代艺术画廊",
    "vintage-parisian-couture": "复古巴黎高定胶片",
    "futuristic-avant-garde": "未来前卫先锋时装",
    "commercial-product-cinematic": "电影级商业静物广告",
    "neon-runway-glow": "炫彩霓虹T台大秀",
    "pop-art-color-block": "波普艺术高反差色块",
    # Nhóm 4: Đời sống Thực tế & Con người
    "documentary-natgeo-human": "国家地理人文纪实",
    "warm-family-nostalgia": "温馨家庭治愈怀旧",
    "street-life-candid": "街头抓拍现实主义",
    "cozy-coffee-indie": "独立咖啡馆慢生活",
    "coastal-fishing-village": "质朴渔港海风纪实",
    "workshop-artisan-craft": "传统匠人手作工坊",
    "autumn-golden-hour": "金秋暖阳浪漫时刻",
    "visual-diary-pov": "POV第一人称视觉日记",
    "fly-on-the-wall-doc": "静默观察墙蝇纪录片",
    "raw-transparent-portrait": "真实原生人像",
    "candid-unscripted-moments": "动态即时抓拍瞬间",
    # Nhóm 5: Đô thị, Văn hóa & Xã hội
    "cyber-tokyo-night": "东京赛博迷幻夜景",
    "traditional-heritage-festive": "东方传统民俗节庆",
    "monochrome-noir-city": "黑白胶片黑色电影",
    "subway-metro-commute": "都市地下铁通勤纪实",
    "ancient-temple-zen": "古刹青苔禅境沉思",
    "brutalist-concrete-architecture": "野兽派几何混凝土",
    "carnival-vintage-fair": "复古游乐园童话夜",
    "raw-urban-workforce": "市井都会劳动纪实",
    # Nhóm 6: Không gian, Ẩm thực & Thể thao
    "deep-space-nebula": "深邃太空宇宙星云",
    "culinary-dark-moody": "暗调高级美食摄影",
    "street-food-night-market": "烟火人间夜市大排档",
    "extreme-sports-action": "极限运动高速定格",
    "stadium-epic-championship": "史诗体育场决战之夜",
    "fine-dining-michelin": "米其林艺术料理美学",
    "zen-tea-ceremony": "静心禅意茶道雅集",
}


# Trả về tên hiển thị dựa trên ID kiểu
def get_image_style_label(style_id: str) -> str:
    return IMAGE_STYLE_LABELS.get(style_id, style_id)


# Trả về đoạn từ gợi ý hình ảnh theo ID kiểu và trả về một chuỗi trống nếu ID không hợp lệ.
def resolve_image_style_prompt(style_id: str | None = None) -> str:
    if not style_id:
        return ""
    return IMAGE_STYLE_PROMPTS.get(style_id, "")


def _first_raster(directory: Path, style_id: str) -> Path | None:
    """Tìm bảng kiểu theo các hậu tố lưới phổ biến trong thư mục và bỏ qua phần giữ chỗ svg."""
    if not directory.is_dir():
        return None
    for ext in _STYLE_BOARD_EXTS:
        path = directory / f"{style_id}{ext}"
        if path.is_file() and path.stat().st_size > 1024:
            return path
    return None


# Trì hoãn nhập để tránh phụ thuộc vòng tròn vào bộ nhớ
def _static_root() -> Path:
    from app.services.storage import STATIC_ROOT

    return STATIC_ROOT


def _safe_image_style_id(style_id: str | None) -> str | None:
    """Chỉ chấp nhận ID kiểu tích hợp và từ chối truyền tải đường dẫn."""
    sid = (style_id or "").strip()
    if not sid or sid not in IMAGE_STYLE_IDS:
        return None
    if any(part in sid for part in ("/", "\\", "..")):
        return None
    return sid


def style_board_local_path(style_id: str | None) -> Path | None:
    """Các tệp cục bộ của bảng định kiểu: ưu tiên là phụ trợ/tĩnh, tiếp theo là bìa công khai ở mặt trước."""
    sid = _safe_image_style_id(style_id)
    if not sid:
        return None
    backend_dir = _static_root() / "drama" / "image-styles"
    found = _first_raster(backend_dir, sid)
    if found:
        return found
    repo_root = Path(__file__).resolve().parents[4]
    return _first_raster(repo_root / "frontend" / "public" / "image-styles", sid)


def resolve_image_style_board_url(style_id: str | None = None) -> str:
    """Gửi style board tới công chúng https để Seedream/Seedance vẽ; nếu thất bại, chuỗi sẽ trống (từ nhắc sẽ vẫn được sử dụng)."""
    path = style_board_local_path(style_id)
    if path is None:
        return ""
    cache_key = (str(path.resolve()), int(path.stat().st_mtime_ns), int(path.stat().st_size))
    cached = _board_url_cache.get(cache_key)
    if cached:
        return cached
    failed_at = _board_fail_cache.get(cache_key)
    if failed_at is not None and (time.monotonic() - failed_at) < _BOARD_FAIL_TTL_SEC:
        return ""
    from app.services import storage
    from app.services.style_lock import seedream_ref_urls

    dest = path
    static_root = _static_root()
    try:
        resolved = path.resolve()
        if static_root not in resolved.parents and static_root != resolved.parent:
            dest_dir = static_root / "drama" / "image-styles"
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / path.name
            if not dest.exists() or dest.stat().st_mtime < path.stat().st_mtime:
                dest.write_bytes(path.read_bytes())
        published = storage.publish_local(dest, sync=True)
    except Exception as exc:  # noqa: BLE001
        logger.warning("风格板未能发布为公网 URL style=%s: %s", style_id, exc)
        _board_fail_cache[cache_key] = time.monotonic()
        return ""
    urls = seedream_ref_urls(published, limit=1)
    url = urls[0] if urls else ""
    if not url:
        logger.warning("风格板 URL 不是上游可拉取的 https style=%s published=%s", style_id, published)
        _board_fail_cache[cache_key] = time.monotonic()
        return ""
    _board_fail_cache.pop(cache_key, None)
    _board_url_cache[cache_key] = url
    return url


def append_style_board_url(
    urls: list[str],
    board_url: str | None,
    *,
    max_total: int = 9,
) -> list[str]:
    """Sau khi nhận được bản vẽ nhân vật/cảnh trên bảng kiểu, hãy loại bỏ các bản sao trùng lặp và dành vị trí cuối cùng cho bảng."""
    board = (board_url or "").strip()
    out = [u.strip() for u in urls if (u or "").strip()]
    cap = max(1, int(max_total))
    if board:
        out = [u for u in out if u != board][: cap - 1]
        out.append(board)
        return out
    return out[:cap]
