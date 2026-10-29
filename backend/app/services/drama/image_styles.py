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
        "Tông màu film 35mm trầm ấm, khói lửa chiến trường chân thực, làng quê mộc mạc, ánh sáng điện ảnh giàu cảm xúc, trang phục lính và thôn quê thời chiến chân thật, không làm mịn da hay màu mè bóng bẩy. 35mm film grain, warm muted tones, cinematic wartime realism."
    ),
    "retro-sci-fi-atompunk": (
        "Phong cách retro sci-fi atompunk, thẩm mỹ chủ nghĩa vị lai thập niên 1950, kim loại khí động học và biểu tượng năng lượng nguyên tử, ánh sáng neon rực rỡ, chất liệu kim loại, màu sắc tương phản cao, hạt phim nhẹ."
    ),
    "palace-intrigue-cold": (
        "Phong cách phim mưu quyền cung đình thâm trầm sắc lạnh, tông tối độ bão hòa thấp, ánh sáng kiềm chế, bố cục trang nghiêm, không khí cung đình xa hoa nhưng ngột ngạt, đường nét góc cạnh, ánh sáng bên giàu kịch tính."
    ),
    "domestic-suspense-cold": (
        "Phong cách phim ly kỳ giật gân tông lạnh, thiên về xám xanh, ánh sáng mờ tối, bóng đổ đậm, chất cảm nhiếp ảnh hiện thực, không khí căng thẳng nghẹt thở, chi tiết phong phú."
    ),
    "ancient-romance-soft": (
        "Phong cách phim tình cảm cổ trang duy mỹ ánh sáng mềm, làm mờ mơ màng, vầng sáng voan mỏng ấm áp, trang phục cổ trang tinh xảo, xóa phông hậu cảnh, không khí lãng mạn bay bổng."
    ),
    "ancient-chinese-mythology": (
        "Phong cách sử thi thần thoại cổ đại, khí chất hồng hoang thượng cổ, núi sông mờ mịt cùng mây mù thần quang, đồ đồng lễ khí và trang phục vải thô mộc mạc, tông màu thủy mặc thanh lục và khoáng chất, trang nghiêm thần thánh, đại cảnh sử thi, ánh sáng điện ảnh."
    ),
    "japanese-youth-film": (
        "Phong cách nhiếp ảnh phim nhựa thanh xuân Nhật Bản, tông màu Kodak film, ánh nắng tự nhiên, trường ảnh nông, hạt mịn, không khí thường nhật mộc mạc chân thành."
    ),
    "japanese-daily-natural": (
        "Phong cách tài liệu đời sống ánh sáng tự nhiên Nhật Bản, ánh sáng dịu, độ tương phản thấp, bối cảnh đời thường chân thực, tĩnh lặng chữa lành, chất cảm phim nhẹ."
    ),
    "korean-urban-soft": (
        "Phong cách phim truyền hình đô thị Hàn Quốc ánh sáng mềm, bộ lọc tông ấm, làn da trong trẻo, hậu cảnh đô thị xóa phông, không khí ánh sáng dịu dàng lãng mạn."
    ),
    "chinese-urban-realistic": (
        "Phong cách nhiếp ảnh hiện thực đô thị đời sống, ánh sáng tự nhiên, bối cảnh chân thực, tông màu trung tính, chi tiết sắc nét, không tô vẽ quá đà."
    ),
    "wuxia-realistic-photo": (
        "Phong cách nhiếp ảnh hiện thực kiếm hiệp giang hồ, ánh sáng tự nhiên, địa hình và chất cảm trang phục chân thật, bố cục động lực học, không khí giang hồ, trường ảnh điện ảnh."
    ),
    "90s-realistic-film": (
        "Phong cách phim điện ảnh hiện thực thập niên 1990, chất cảm phim nhựa, màu da tự nhiên, trang phục và bối cảnh đậm nét thời đại, tương phản êm dịu, tông màu hoài niệm."
    ),
    "retro-narrative-film": (
        "Phong cách phim điện ảnh tự sự cổ điển, bố cục điện ảnh kinh điển, phối màu phim nhựa, dàn cảnh giàu tính kể chuyện, ánh sáng chuẩn điện ảnh."
    ),
    "american-retro-hollywood": (
        "Phong cách thời hoàng kim Hollywood cổ điển Mỹ, ánh sáng tương phản cao, tông ấm rực rỡ hoặc đen trắng kinh điển, thần thái minh tinh, trường ảnh hoa lệ."
    ),
    "neon-cyberpunk-film": (
        "Phong cách phim điện ảnh cyberpunk neon, ánh đèn neon xanh tím, vệt phản chiếu đêm mưa, độ tương phản cao, đô thị tương lai, khói sương và hiệu ứng ánh sáng hologram."
    ),
    "90s-rural-china-film": (
        "Phong cách phim điện ảnh nông thôn thập niên 1990, ánh sáng tự nhiên, tông màu vàng đất và xanh lá, chất cảm thô mộc chân thực, không khí sinh hoạt thôn quê."
    ),
    "cgi-3d-animation": (
        "Phong cách hoạt hình 3D CGI chuẩn điện ảnh, tinh thần Pixar/DreamWorks, tạo hình bo tròn đường nét rõ ràng, ánh sáng khối mềm mại và tán xạ dưới bề mặt, chất liệu sạch màu sắc bão hòa, trường ảnh nông."
    ),
    "ghibli-handdrawn-anime": (
        "Khí chất hoạt hình 2D vẽ tay, hậu cảnh màu nước và bột màu, ánh sáng tự nhiên dịu nhẹ cùng hoàng hôn vàng óng, tỷ lệ cơ thể và ngũ quan mộc mạc, trang phục đời thường, cỏ cây tươi tốt, thảm cỏ lay động trong gió và mây trôi bềnh bồng, tông màu vàng đất ấm áp và xanh lam lục, phối cảnh không khí và bố cục điện ảnh."
    ),
    "tezuka-era-cartoon": (
        "Phong cách hoạt hình Nhật Bản kinh điển thời Osamu Tezuka, nét vẽ tối giản, mảng màu phẳng hoạt hình retro, chất cảm hoạt họa hoài niệm."
    ),
    "shanghai-animation": (
        "Phong cách hoạt hình kinh điển Xưởng phim Mỹ thuật Thượng Hải, phong vị hội họa dân tộc, kết hợp màu nước và công bút truyền thống, thi vị duy mỹ, màu sắc cổ phong."
    ),
    "pixel-art": (
        "Phong cách nghệ thuật pixel, khối điểm ảnh rõ ràng, thẩm mỹ game retro, bảng màu giới hạn, chất cảm 8-bit hoặc 16-bit hoài niệm."
    ),
    "shadow-puppet-illustration": (
        "Phong cách tranh minh họa múa rối bóng dân gian, đường nét bóng cắt, hoa văn chạm rỗng, ngược sáng ấm áp, tính trang trí nghệ thuật dân gian, hiệu ứng bóng đổ xếp lớp."
    ),
    "hard-sci-fi-interstellar": (
        "Phong cách khoa học viễn tưởng không gian sâu, trạm vũ trụ hiện thực và phi thuyền module phức tạp, ánh sáng lạnh của sao băng và tinh vân xa xôi, kính buồng lái phản chiếu vũ trụ, vật liệu composite và hợp kim mờ, hạt phim IMAX 70mm, cảm giác đơn độc hùng vĩ. Hard sci-fi interstellar realism, realistic space station and modular spacecraft, cold starlight, IMAX 70mm film grain, deep space cinematic lighting."
    ),
    "mystic-cyber-occult": (
        "Phong cách huyền bí công nghệ Cyber Occult, ký tự cổ phù chú phát quang neon kết hợp dây cáp mạng và vi mạch, bóng tối kỳ bí, khói sương huyền ảo, ánh sáng tím than và ngọc lục bảo ma mị, không khí siêu nhiên công nghệ. Mystic cyber occult aesthetic, glowing neon runes intertwined with cables and circuits, dark atmospheric fog, deep violet and emerald lighting, techno-sorcery."
    ),
    "steampunk-victorian-machinery": (
        "Phong cách Steampunk cơ khí Victoria, bánh răng đồng thau và ống hơi nước xì khói áp lực, đồng hồ cơ tinh xảo, trang phục quý tộc thế kỷ 19 kết hợp kính bảo hộ cơ khí, tông nâu đồng và hổ phách ấm áp, ánh sáng đèn khí đốt. Victorian steampunk machinery, brass gears, polished copper, pressure steam pipes, 19th-century attire with brass goggles, warm amber and gaslight tones."
    ),
    "biopunk-organic-tech": (
        "Phong cách công nghệ sinh học Biopunk, cấu trúc mô hữu cơ phát quang sinh học kết hợp vi mạch cấy ghép, ống nghiệm nuôi cấy phôi thai, ánh huỳnh quang xanh lục và xanh lam neon, phòng thí nghiệm tương lai bí ẩn, chất cảm nhớt ẩm ướt chân thực. Biopunk organic technology, bioluminescent tissues, cybernetic implants, embryo cultivation tanks, fluorescent cyan and green illumination, wet organic textures."
    ),
    "quantum-abstract-dimension": (
        "Phong cách không gian lượng tử đa chiều, đường chân trời fractal gãy khúc, sóng ánh sáng lượng tử đa sắc, hình học phi Euclide lơ lửng, trường năng lượng hạt phát sáng lộng lẫy, cảm giác siêu thực vi mô và vĩ mô hòa quyện. Quantum abstract multidimensional space, fractal folding geometry, vibrant quantum light waves, glowing particle fields, surreal physics defying."
    ),
    "holographic-futuristic-ui": (
        "Phong cách giao diện tương lai Hologram, màn hình quang học trong suốt lơ lửng 3D, biểu đồ và bản đồ số cyan và magenta rực rỡ, trung tâm điều khiển tối tân, ánh sáng phản chiếu trên mắt kính và gương mặt nhân vật, chiều sâu trường ảnh sắc nét. Holographic futuristic UI, floating 3D transparent displays, glowing cyan and magenta data interfaces, sleek command center, sharp cinematic depth of field."
    ),
    "cosmic-horror-lovecraftian": (
        "Phong cách kinh dị vũ trụ Lovecraftian, bầu trời tinh vân quái dị méo mó, bóng tối vực thẳm sâu thẳm, kiến trúc đá cự thạch phi nhân loại phủ rêu xanh u ám, sương mù dày đặc che khuất thực tại, ánh sáng lân tinh lạnh lẽo rùng rợn. Lovecraftian cosmic horror, cyclopean non-euclidean architecture, eerie twisted sky, suffocating fog, deep ominous shadows, faint eerie bioluminescence."
    ),
    "high-fashion-editorial": (
        "Phong cách thời trang cao cấp Haute Couture, ánh sáng studio chuẩn tạp chí Vogue/Harper's Bazaar, tương phản sắc nét, thần thái người mẫu góc cạnh kiêu kỳ, bố cục tối giản sang trọng, chất liệu vải nhung và lụa lấp lánh chi tiết. High-fashion editorial photography, Vogue magazine studio lighting, sharp contrast, statuesque model poses, haute couture garments, luxurious textures."
    ),
    "luxury-minimalist-gallery": (
        "Phong cách triển lãm nghệ thuật tối giản, không gian tường trắng bê tông vi mô tinh khiết, ánh sáng tự nhiên dịu nhẹ từ giếng trời trên cao, bóng đổ hình học sắc cạnh, tác phẩm điêu khắc nghệ thuật đương đại, trật tự và sang trọng tinh tế. Luxury minimalist art gallery, clean micro-cement walls, soft skylight illumination, sharp geometric shadows, contemporary sculptures, elegant spatial order."
    ),
    "vintage-parisian-couture": (
        "Phong cách thời trang cổ điển Paris thập niên 1960, hạt phim Kodak Portra mềm mại, đường phố đá cuội Paris và quán cà phê cổ, trang phục nhung dạ thanh lịch mang hơi thở thời đại, ánh nắng chiều thu mật ong lãng mạn hoài cổ. Vintage Parisian couture, 1960s Kodak Portra 35mm grain, cobblestone Paris streets, elegant woolen fashion, warm autumn golden light, timeless romanticism."
    ),
    "futuristic-avant-garde": (
        "Phong cách thời trang vị lai Avant-Garde, trang phục điêu khắc kim loại lỏng chrome bóng loáng, phom dáng bất đối xứng táo bạo, ánh sáng studio phân cực, chất liệu sợi quang và nhựa phản quang trong suốt, tính tương lai đột phá. Futuristic avant-garde fashion, liquid chrome sculptural garments, exaggerated silhouettes, polarized studio lighting, iridescent reflective materials."
    ),
    "commercial-product-cinematic": (
        "Phong cách quảng cáo thương mại điện ảnh, chụp cận cảnh macro sản phẩm cao cấp, giọt nước phản chiếu li ti, ánh sáng viền rim light sắc nét, nền tối mờ nhung mượt mà, độ phân giải chi tiết cực cao, tôn vinh chất liệu kim loại và thủy tinh. Cinematic commercial product photography, macro closeup, crisp rim lighting, droplet reflections, smooth velvety bokeh, luxury metallic and glass textures."
    ),
    "neon-runway-glow": (
        "Phong cách sàn diễn thời trang ánh sáng Neon, đường băng catwalk tráng gương đen phản chiếu dải đèn LED rực rỡ, ánh sáng tím hồng hiện đại, chuyển động bay bổng của vải voan lụa, góc chụp từ thấp lên đầy quyền uy lộng lẫy. Neon fashion runway show, glossy black reflective runway, glowing LED light strips, magenta and violet neon glow, dynamic flowing fabrics, low-angle model walk."
    ),
    "pop-art-color-block": (
        "Phong cách Pop Art tương phản khối, mảng màu nguyên bản rực rỡ vàng đỏ xanh lam, độ bão hòa cao, cảm hứng Andy Warhol và tạp chí thập niên 1980, viền nét đồ họa rõ ràng, phong cách thời thượng năng động. Pop art color block style, bold saturated primary colors, high contrast graphic framing, Andy Warhol aesthetic, clean illustrative contours, vibrant punchy mood."
    ),
    "documentary-natgeo-human": (
        "Phong cách phóng sự nhân văn National Geographic, ánh sáng tự nhiên chân thực, chân dung giàu cảm xúc với ánh mắt có hồn, nếp nhăn và nét mặt từng trải, bối cảnh đời thường xúc động, độ sâu trường ảnh điện ảnh tài liệu. National Geographic documentary portraiture, raw authentic lighting, soulful eyes, weathered facial texture, genuine human emotion, documentary realism."
    ),
    "warm-family-nostalgia": (
        "Phong cách ký ức gia đình ấm áp, tông màu vàng cam ấm cúng, tia nắng chiếu qua rèm cửa sổ, khoảnh khắc sum vầy tự nhiên không sắp đặt, hạt phim 16mm hoài niệm, ngập tràn tình yêu thương và sự bình yên. Warm family nostalgia, cozy amber and honey tones, sunlight streaming through curtains, candid family moments, soft 16mm film grain, heartfelt peaceful warmth."
    ),
    "street-life-candid": (
        "Phong cách khoảnh khắc đường phố chân thực, góc nhìn phóng viên ảnh đường phố Leica, bắt trọn nhịp sống vội vã, bóng đổ xiên buổi sớm và vũng nước phản chiếu, khoảnh khắc quyết định (decisive moment), chi tiết đời sống sinh động. Street life candid photography, Leica 35mm street perspective, urban hustle and bustle, decisive moment capture, puddle reflections, authentic urban textures."
    ),
    "cozy-coffee-indie": (
        "Phong cách quán cà phê Indie chiều mưa, hơi ấm ly cà phê bốc khói nhẹ, cửa kính đọng nước mưa mờ ảo, đèn sợi đốt Edison vàng dịu, sách và bàn gỗ thông mộc mạc, cảm giác thư thái yên tĩnh sâu lắng. Cozy indie coffeehouse, steaming artisanal coffee, rain-streaked window pane, warm Edison bulb glow, rustic wooden table, peaceful introspective warmth."
    ),
    "coastal-fishing-village": (
        "Phong cách làng chài ven biển mộc mạc, sương sớm mờ ảo trên bến cảng, thuyền gỗ cũ kỹ và lưới đánh cá đẫm nước biển, tông màu xanh ngọc bích hòa lẫn xám cát, con người lao động kiên cường giữa thiên nhiên bao la. Coastal fishing village documentary, morning mist over harbor, weathered wooden boats, wet fishing nets, muted seafoam and sandy grey tones, resilient coastal life."
    ),
    "workshop-artisan-craft": (
        "Phong cách nghệ nhân xưởng thủ công, bụi gỗ và mạt kim loại lơ lửng trong luồng sáng hắt xiên, bàn tay chai sạn tỉ mỉ gọt giũa đồ da hoặc gốm sứ, gam màu nâu da bò và gỗ mun trầm ấm, ánh sáng ven nổi khối sắc nét. Artisan craft workshop, dust particles suspended in dramatic sunbeam, weathered hands sculpting ceramics or leather, warm rich walnut tones, tactile craftsmanship."
    ),
    "autumn-golden-hour": (
        "Phong cách hoàng hôn mùa thu rực rỡ, thảm lá phong vàng cam trải dài, ánh nắng chiều tà mật ong ấm áp xuyên qua tán cây, trường ảnh nông mềm mại, bầu không khí lãng mạn êm đềm đầy chất thơ. Autumn golden hour, vibrant amber and russet foliage, honey-colored sunset backlight, dreamy creamy bokeh, poetic romantic warmth."
    ),
    "visual-diary-pov": (
        "Phong cách Nhật ký Thị giác góc nhìn POV chân thực, góc nhìn thứ nhất (point-of-view) chân thực như chính mắt người trải nghiệm, cắt góc ngẫu hứng tự nhiên, ánh sáng môi trường thực tế không dàn dựng, chi tiết cuộc sống thường nhật gần gũi và sống động. First-person POV visual diary realism, point-of-view perspective, spontaneous unposed composition, natural ambient room and outdoor light, authentic lived-in slice-of-life textures."
    ),
    "fly-on-the-wall-doc": (
        "Phong cách Phim tài liệu ẩn mình quan sát tự nhiên, ống kính quan sát thầm lặng từ xa không can thiệp, cử chỉ và biểu cảm hoàn toàn tự nhiên chân thực 100%, ánh sáng môi trường có sẵn không đèn flash, chiều sâu trường ảnh điện ảnh tài liệu mộc mạc. Fly-on-the-wall documentary photography, quiet unobtrusive observation from distance, completely unscripted natural gestures, available ambient light without flash, pure authentic cinéma vérité feel."
    ),
    "raw-transparent-portrait": (
        "Phong cách Chân dung mộc nguyên bản tả thực, cận cảnh ngang tầm mắt trung thực, giữ trọn vẹn kết cấu da, nếp nhăn, lỗ chân lông, sợi tóc rối và ánh mắt có hồn mà không qua chỉnh sửa làm đẹp, ánh sáng cửa sổ ban ngày dịu nhẹ hắt nghiêng. Raw and transparent portraiture, honest eye-level close-up, authentic skin texture, pores, fine lines, flyaway hair, soulful emotive eyes, unfiltered realism, soft window side light."
    ),
    "candid-unscripted-moments": (
        "Phong cách Bắt khoảnh khắc tức thì ngẫu hứng, tốc độ chụp cực nhanh bắt trọn chuyển động trong tích tắc, tiếng cười bộc phát hoặc ánh nhìn lơ đãng, độ mờ nhòe chuyển động (motion blur) tự nhiên gia tăng cảm giác sống động, nhịp sống chân thực tức thì. Candid unscripted moment capture, high-speed shutter catching fleeting instantaneous emotion, spontaneous burst of laughter, subtle natural motion blur, authentic kinetic energy."
    ),
    "cyber-tokyo-night": (
        "Phong cách đêm đô thị Tokyo lung linh, biển hiệu đèn lồng đỏ truyền thống hòa quyện dải LED neon khổng lồ Shinjuku đêm mưa, vũng nước phản chiếu đa sắc, nhịp sống sầm uất đa tầng lớp, chiều sâu điện ảnh ngoạn mục. Cyber Tokyo nightlife, traditional lanterns blending with towering neon billboards, rain-slicked asphalt reflections, dense urban depth, cinematic atmospheric haze."
    ),
    "traditional-heritage-festive": (
        "Phong cách lễ hội văn hóa truyền thống, hàng ngàn lồng đèn đỏ rực rỡ, pháo hoa nở rộ trên bầu trời đêm, trang phục cổ truyền thêu gấm lộng lẫy, điệu múa lân sư rồng sôi động, không khí sum vầy tưng bừng ấm áp. Traditional festive heritage, crimson lantern illuminations, sparkling fireworks in night sky, ornate embroidered garments, lion dance energy, joyous cultural warmth."
    ),
    "monochrome-noir-city": (
        "Phong cách phim Noir đô thị đen trắng, đen trắng tương phản cực cao (high contrast chiaroscuro), bóng đổ dài của người mặc áo măng-tô dưới đèn đường đêm sương, khói thuốc bảng lảng, vẻ bí ẩn cô đơn lạnh lùng. Monochrome noir city, dramatic high-contrast chiaroscuro, long shadows under streetlamps, trench coat silhouette in night mist, cigarette smoke, gritty detective mystery."
    ),
    "subway-metro-commute": (
        "Phong cách chuyến tàu điện ngầm đô thị, ánh đèn huỳnh quang toa tàu lạnh lùng, đoàn tàu lao nhanh vút qua sân ga mờ nhòe tốc độ, gương mặt trầm tư của hành khách đô thị, bố cục khung hình điện ảnh đương đại sắc sảo. Subway metro commute, cool fluorescent illumination, motion blur of rushing trains, contemplative commuter expressions, modern urban isolation, cinematic framing."
    ),
    "ancient-temple-zen": (
        "Phong cách chùa cổ thanh tịnh thiền định, sân đá rêu phong sau mưa, khói trầm hương lượn lờ trong nắng sớm, mái ngói cong cổ kính rũ giọt sương, tiếng chuông đồng tĩnh lặng an nhiên, gam màu xanh rêu và gỗ mun trầm lắng. Ancient Zen temple, mossy stone pavers, incense smoke curling in early morning sunbeams, weathered wooden eaves, dew drops, serene spiritual tranquility."
    ),
    "brutalist-concrete-architecture": (
        "Phong cách kiến trúc bê tông Brutalism, khối bê tông thô khổng lồ với các đường nét hình học sắc sảo, ánh sáng xiên mạnh mẽ đổ bóng góc cạnh, tông xám tro và bầu trời u ám tĩnh mịch, cảm giác hùng vĩ choáng ngợp và siêu thực. Brutalist concrete architecture, monumental geometric concrete forms, raw textured surfaces, sharp dramatic angular shadows, stoic overcast sky, majestic grandeur."
    ),
    "carnival-vintage-fair": (
        "Phong cách hội chợ đêm Vintage lung linh, vòng đu quay khổng lồ rực sáng đèn bóng tròn ấm áp, quầy trò chơi gỗ cổ điển và bóng bay rực rỡ, ánh sáng mờ ảo lung linh cổ tích, cảm giác hoài niệm tuổi thơ ngọt ngào. Vintage carnival night fair, illuminated Ferris wheel with incandescent bulbs, carousel glow, festive pennants, dreamy bokeh orbs, magical nostalgic childhood aura."
    ),
    "raw-urban-workforce": (
        "Phong cách Hiện thực đô thị và lao động đời thường, tái hiện nhịp sống người lao động và đường phố chân thực, vệt mồ hôi trên áo, khói bụi đô thị, hàng quán vỉa hè lúc hoàng hôn chạng vạng, ánh đèn đường cao áp vàng cam hắt trên nền bê tông và nhựa đường. Raw urban and workforce realism, working class everyday hustle, sweat stains on work clothes, gritty street atmosphere, twilight dusk street food stalls, warm sodium vapor streetlight on weathered concrete."
    ),
    "deep-space-nebula": (
        "Phong cách tinh vân vũ trụ sâu thẳm, dải ngân hà rực rỡ sắc màu tím hồng và xanh sapphire, bụi sao lấp lánh như kim cương, hành tinh khổng lồ với vành đai tráng lệ, quy mô vũ trụ kỳ vĩ bao la bất tận. Deep space cosmic nebula, breathtaking magenta and sapphire interstellar clouds, shimmering star clusters, ringed planetary giants, vast sublime celestial scale."
    ),
    "culinary-dark-moody": (
        "Phong cách nhiếp ảnh ẩm thực Dark Moody, nền gỗ hoặc đá phiến tối màu mộc mạc, ánh sáng ven hắt lên món ăn nóng hổi, khói bốc nghi ngút thơm lừng, gia vị rắc rơi tự nhiên đóng băng giữa không trung, ngon mắt và sang trọng. Dark moody culinary photography, rustic dark slate background, dramatic side rim light catching steam and textures, frozen sprinkle of seasonings, appetizing sophistication."
    ),
    "street-food-night-market": (
        "Phong cách chợ đêm ẩm thực đường phố, chảo gang xèo xèo bốc lửa ngùn ngụt, dầu mỡ óng ánh trên xiên que nướng, khói thơm nghi ngút dưới ánh đèn vàng ấm áp, dòng người tấp nập tràn trề sức sống đời thường. Street food night market, sizzling cast iron wok with dancing flames, glistening skewers, fragrant smoke under warm halogen bulbs, vibrant bustling night atmosphere."
    ),
    "extreme-sports-action": (
        "Phong cách thể thao mạo hiểm tốc độ cao, góc máy siêu rộng GoPro/Fish-eye kịch tính, hạt tuyết hoặc giọt nước bắn tung tóe đóng băng chuyển động sắc lẹm (high shutter speed), ánh sáng mặt trời ngược chói lòa, năng lượng bùng nổ. Extreme sports high-speed action, dynamic fisheye/wide-angle perspective, frozen water and snow spray at 1/8000s shutter, intense sun flare, adrenaline-fueled power."
    ),
    "stadium-epic-championship": (
        "Phong cách sân vận động đêm chung kết, dàn đèn pha công suất lớn hắt rực sáng mặt cỏ xanh mướt, mưa pháo giấy kim tuyến bay rợp trời, biển khán giả cuồng nhiệt vỡ òa cảm xúc, ánh sáng thể tích điện ảnh hùng tráng. Epic championship stadium night, blazing stadium floodlights, lush green pitch reflections, confetti rain falling from above, roaring crowd atmosphere, triumphant cinematic drama."
    ),
    "fine-dining-michelin": (
        "Phong cách ẩm thực cao cấp Michelin, đĩa sứ trắng hoặc đá mài tinh tế, bài trí món ăn nghệ thuật tối giản, nước xốt vẽ giọt điêu luyện, hoa lá ăn được trang trí thanh tao, ánh sáng khuếch tán dịu nhẹ sang trọng tột bậc. Fine dining Michelin plating art, exquisite minimalist presentation on custom ceramic plate, delicate sauce droplets, edible micro-flowers, soft diffuse lighting, haute gastronomy."
    ),
    "zen-tea-ceremony": (
        "Phong cách trà đạo thiền tịnh, ấm trà đất nung tử sa nghi ngút khói thơm thanh nhã, khay trà tre mộc mạc đọng giọt nước trong vắt, ánh ban mai xiên qua mành trúc, hoa trà trắng thả nhẹ trên mặt nước, thanh tịnh an nhiên. Zen tea ceremony, steaming handcrafted purple clay teapot, natural bamboo tea tray, morning sunlight filtering through bamboo blinds, floating white camellia, mindful tranquility."
    ),
}

# Tên hiển thị kiểu IMAGE_STYLE_LABELS
IMAGE_STYLE_LABELS: dict[str, str] = {
    "wartime-epic-film": "Điện ảnh chiến tranh bi tráng",
    "retro-sci-fi-atompunk": "Khoa học viễn tưởng retro Atompunk",
    "palace-intrigue-cold": "Cung đấu âm mưu lạnh lùng",
    "domestic-suspense-cold": "Phim trinh thám nội địa tông lạnh",
    "ancient-romance-soft": "Cổ trang lãng mạn ánh sáng mềm",
    "ancient-chinese-mythology": "Thần thoại Trung Hoa cổ đại sử thi",
    "japanese-youth-film": "Phim tuổi trẻ Nhật Bản phong cách film",
    "japanese-daily-natural": "Đời thường Nhật Bản tự nhiên",
    "korean-urban-soft": "Phim Hàn đô thị ánh sáng mềm",
    "chinese-urban-realistic": "Phim đô thị Trung Quốc hiện thực",
    "wuxia-realistic-photo": "Võ hiệp giang hồ phong cách ảnh thực",
    "90s-realistic-film": "Phim hiện thực thập niên 90",
    "retro-narrative-film": "Phim tự sự retro",
    "american-retro-hollywood": "Hollywood retro kiểu Mỹ",
    "neon-cyberpunk-film": "Phim Cyberpunk ánh đèn neon",
    "90s-rural-china-film": "Phim nông thôn Trung Quốc thập niên 90",
    "cgi-3d-animation": "Hoạt hình 3D CGI",
    "ghibli-handdrawn-anime": "Hoạt hình vẽ tay phong cách Ghibli",
    "tezuka-era-cartoon": "Phong cách hoạt hình thời Tezuka",
    "shanghai-animation": "Phong cách hoạt hình Thượng Hải",
    "pixel-art": "Pixel Art",
    "shadow-puppet-illustration": "Minh họa múa rối bóng",
    "hard-sci-fi-interstellar": "Khoa học viễn tưởng không gian sâu",
    "mystic-cyber-occult": "Huyền bí công nghệ Cyber Occult",
    "steampunk-victorian-machinery": "Steampunk cơ khí Victoria",
    "biopunk-organic-tech": "Công nghệ sinh học Biopunk",
    "quantum-abstract-dimension": "Không gian lượng tử đa chiều",
    "holographic-futuristic-ui": "Giao diện tương lai Hologram",
    "cosmic-horror-lovecraftian": "Kinh dị vũ trụ Lovecraftian",
    "high-fashion-editorial": "Thời trang cao cấp Haute Couture",
    "luxury-minimalist-gallery": "Triển lãm nghệ thuật tối giản",
    "vintage-parisian-couture": "Thời trang cổ điển Paris",
    "futuristic-avant-garde": "Thời trang vị lai Avant-Garde",
    "commercial-product-cinematic": "Quảng cáo thương mại điện ảnh",
    "neon-runway-glow": "Sàn diễn thời trang ánh sáng Neon",
    "pop-art-color-block": "Phong cách Pop Art tương phản khối",
    "documentary-natgeo-human": "Phóng sự nhân văn NatGeo",
    "warm-family-nostalgia": "Ký ức gia đình ấm áp",
    "street-life-candid": "Khoảnh khắc đường phố chân thực",
    "cozy-coffee-indie": "Quán cà phê Indie chiều mưa",
    "coastal-fishing-village": "Làng chài ven biển mộc mạc",
    "workshop-artisan-craft": "Nghệ nhân xưởng thủ công",
    "autumn-golden-hour": "Hoàng hôn mùa thu rực rỡ",
    "visual-diary-pov": "Nhật ký thị giác góc nhìn POV",
    "fly-on-the-wall-doc": "Tài liệu ẩn mình quan sát tự nhiên",
    "raw-transparent-portrait": "Chân dung mộc nguyên bản tả thực",
    "candid-unscripted-moments": "Bắt khoảnh khắc tức thì ngẫu hứng",
    "cyber-tokyo-night": "Đêm đô thị Tokyo lung linh",
    "traditional-heritage-festive": "Lễ hội văn hóa truyền thống",
    "monochrome-noir-city": "Phim Noir đô thị đen trắng",
    "subway-metro-commute": "Chuyến tàu điện ngầm đô thị",
    "ancient-temple-zen": "Chùa cổ thanh tịnh thiền định",
    "brutalist-concrete-architecture": "Kiến trúc bê tông Brutalism",
    "carnival-vintage-fair": "Hội chợ đêm Vintage lung linh",
    "raw-urban-workforce": "Hiện thực đô thị lao động đời thường",
    "deep-space-nebula": "Tinh vân vũ trụ sâu thẳm",
    "culinary-dark-moody": "Nhiếp ảnh ẩm thực Dark Moody",
    "street-food-night-market": "Chợ đêm ẩm thực đường phố",
    "extreme-sports-action": "Thể thao mạo hiểm tốc độ cao",
    "stadium-epic-championship": "Sân vận động đêm chung kết",
    "fine-dining-michelin": "Ẩm thực cao cấp Michelin",
    "zen-tea-ceremony": "Trà đạo thiền tịnh",
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
