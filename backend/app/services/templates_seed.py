"""Template phong cách tích hợp sẵn — Lời nhắc prompt và mô tả phong cách chuẩn hóa.

Quy ước phân loại (category[0] là phân loại chính, dùng cho bộ lọc trang chủ):
Điện ảnh / Người thật / Hiện thực / Khoa học / Thiếu nhi / Cổ phong / Khoa học viễn tưởng / Anime / 3D / Thương mại / Hoài cổ / Phim tài liệu / Kỳ ảo / Đồ họa chữ / Giật gân / Mã nguồn mở / Tiếp cận khách hàng
Bốn mẫu video marketing tiếp cận khách hàng nằm trong templates_seed_huoke.py, được gộp vào cuối TEMPLATES; category[0] là Khoa học.
Các mẫu người thật và hiện thực cần đặt photoreal: true trong seedream_config.

Tính nhất quán (seedream_config.consistency_mode):
- character: Khóa nhân vật + phong cách, tham chiếu ảnh theo chuỗi giữa các cảnh (mặc định tự sự)
- style: Chỉ giữ phong thái phong cách, không khóa nhân vật, không tham chiếu theo chuỗi
- diverse: Lập kế hoạch cảnh độc lập linh hoạt theo nội dung (mã nguồn mở / demo sản phẩm), cấm trùng lặp giữa các cảnh
Khi chưa thiết lập sẽ quay về character_consistency của seedance/seedream.

Phương thức dựng phim (có tạo video AI hay không) do người dùng chọn trên trang cấu hình phong cách, không bị khóa bởi template.
default_ratio của template chỉ mang tính gợi ý tỷ lệ khung hình mặc định.
"""

from app.services.templates_seed_huoke import HUOKE_TEMPLATES

TEMPLATES: list[dict] = [
    {
        "id": "opensource_showcase",
        "name": "Giới thiệu dự án mã nguồn mở",
        "description": "Lập kế hoạch linh hoạt theo nội dung: người thao tác giao diện phần mềm và bối cảnh sử dụng thực tế, phù hợp cho công cụ và nền tảng mã nguồn mở.",
        "category": ["Mã nguồn mở", "Đồ họa chữ", "Thương mại"],
        "preview_cover": "/static/templates/covers/opensource_showcase.png",
        "style_prefix": (
            "Ảnh tĩnh trình diễn sản phẩm chất lượng cao: Nhân vật ngồi trước bàn làm việc thực tế thao tác phần mềm/trang tài liệu/bảng làm việc, "
            "tay nhấp chuột và giao diện màn hình rõ ràng, bố cục tiết chế, phân cấp thông tin mạch lạc, "
            "chất liệu và phối màu theo nội dung (SaaS sáng màu, tài liệu giấy, IDE tối màu, terminal), "
            "chất lượng trình diễn sản phẩm điện ảnh, khoảng trống sạch sẽ dễ chèn chữ, không phải giao diện danh sách công việc"
        ),
        "negative_prompt": (
            "Danh sách công việc, todolist, ô tích chọn, thẻ kanban xếp chồng, "
            "xanh neon, ánh sáng xanh cyberpunk, dải màu xanh tím toàn màn hình, sàn lưới phát sáng, HUD viễn tưởng xếp chồng, "
            "hoạt hình phóng đại, anime, vẽ tay nguệch ngoạc, chữ rác trên hình, watermark phụ đề, logo nhòe, mờ, "
            "giao diện trống không có người thao tác, mảng màu trừu tượng"
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
                "Người thao tác trình diễn sản phẩm: Góc nhìn nghiêng hoặc qua vai, ngồi trước bàn làm việc thao tác laptop hoặc hai màn hình, "
                "trang phục công sở thoải mái, bàn tay và màn hình là trọng tâm thị giác, đường nét khuôn mặt không quá nổi bật, phong thái đồng nhất toàn phim"
            ),
            "extra_prompt": (
                "Chủ thể là người thao tác giao diện hệ thống, động tác nhấp chuột rõ ràng, cấm màn hình lớn cyber xanh neon; "
                "phía trên và dưới có khoảng trống để chèn chữ lớn, không xuất hiện chữ trong hình; "
                "bố cục và thao tác của cảnh này phải khác biệt rõ rệt với các cảnh khác"
            ),
        },
        "seedance_config": {
            "motion_bias": "Bàn tay nhấp nhẹ và nội dung màn hình chuyển đổi, máy quay từ từ tiến lại gần bàn làm việc",
            "character_consistency": False,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "Nhanh nhẹn chuyên nghiệp"},
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
        "name": "Bối cảnh người thật làm việc",
        "description": "Người thật thao tác tại bàn làm việc: Góc nhìn nghiêng/qua vai thao tác hệ thống, phù hợp cho công cụ mã nguồn mở và quy trình làm việc sản phẩm.",
        "category": ["Mã nguồn mở", "Người thật", "Hiện thực"],
        "preview_cover": "/static/templates/covers/opensource_live_work.png",
        "style_prefix": (
            "Nhiếp ảnh người thật hiện thực, bàn làm việc văn phòng thực tế, góc nhìn nghiêng hoặc qua vai thao tác laptop/màn hình đôi, "
            "động tác nhấp tay và giao diện màn hình rõ ràng, ánh sáng cửa sổ tự nhiên và ánh sáng màn hình, trang phục công sở thoải mái, "
            "da và chất liệu chân thực, không hoạt hình anime, khoảng trống sạch sẽ dễ chèn chữ"
        ),
        "negative_prompt": (
            "Hoạt hình, anime, cel-shaded, 2D, làm mịn da quá đà, người giả CGI, "
            "màn hình lớn cyber xanh neon, danh sách công việc xếp chồng, giao diện trống không có người, watermark chữ trên hình, mờ"
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
                "Người thao tác trình diễn sản phẩm hiện thực: Góc nhìn nghiêng hoặc qua vai, ngồi trước bàn làm việc thao tác laptop hoặc màn hình đôi, "
                "trang phục công sở thoải mái, bàn tay và màn hình là trọng tâm thị giác, ngũ quan hài hòa, phong thái đồng nhất toàn phim"
            ),
            "extra_prompt": (
                "Bàn làm việc người thật hiện thực, động tác tay rõ ràng, loại giao diện thay đổi theo nội dung; "
                "cấm đặc tả lớn chính diện khuôn mặt và màn hình cyber neon; không xuất hiện chữ trong hình"
            ),
        },
        "seedance_config": {
            "motion_bias": "Bàn tay nhấp nhẹ và nội dung màn hình chuyển đổi, máy quay từ từ tiến lại gần bàn làm việc",
            "character_consistency": False,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "Nhanh nhẹn chuyên nghiệp"},
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
        "name": "Phỏng vấn đường phố người thật",
        "description": "Cảm giác người thật xuất hiện nói chuyện trên đường phố hoặc khi đi làm, phù hợp chia sẻ quan điểm, trải nghiệm và phỏng vấn ngắn.",
        "category": ["Người thật", "Phim tài liệu"],
        "preview_cover": "/static/templates/covers/live_street_interview.png",
        "style_prefix": (
            "Nhiếp ảnh phỏng vấn tài liệu đường phố người thật, ánh sáng tự nhiên và cảm giác máy quay cầm tay nhẹ, đường phố đô thị hoặc khung cảnh đi làm, "
            "kết cấu da chân thực và tiếng ồn môi trường tiết chế, không trang điểm đậm kiểu studio, không hoạt hình anime"
        ),
        "negative_prompt": "Hoạt hình, anime, cel-shaded, 2D, trang điểm đậm kiểu studio, người giả CGI, cyber neon, watermark chữ trên hình",
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
            "character_prompt": "Nhân vật chính phỏng vấn đường phố người thật: Độ tuổi phong thái, kiểu tóc trang phục đời thường cố định, biểu cảm tự nhiên, toàn phim cùng một người",
            "extra_prompt": "Cảnh đường phố ánh sáng tự nhiên hoặc cảnh đi lại, chủ thể màn hình dọc rõ ràng, phía trên có thể chừa khoảng trống chèn chữ",
        },
        "seedance_config": {
            "motion_bias": "Cảm giác cầm tay nhẹ, từ từ tiến lại gần",
            "character_consistency": True,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "Ấm áp nhân văn"},
        "subtitle_config": {"font": "SourceHanSans", "position": "top", "caption_scale": 1.3},
        "sort_order": 3,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "live_product_desk",
        "name": "Người thật trình diễn trên bàn",
        "description": "Góc quay từ trên xuống hoặc chéo xuống hiện thực: Hai bàn tay người thật thao tác sản phẩm hoặc laptop, phù hợp đánh giá công cụ và hướng dẫn.",
        "category": ["Người thật", "Hiện thực", "Thương mại"],
        "preview_cover": "/static/templates/covers/live_product_desk.png",
        "style_prefix": (
            "Nhiếp ảnh người thật trình diễn sản phẩm trên bàn, góc nhìn chéo xuống hoặc qua vai, mặt bàn gỗ/sáng màu, laptop và bàn tay rõ ràng, "
            "ánh sáng đèn studio dịu nhẹ hoặc ánh sáng cửa sổ, chất liệu chân thực, không hoạt hình tranh vẽ"
        ),
        "negative_prompt": "Hoạt hình, anime, cel-shaded, 2D, bàn trống không có tay, cyber neon, watermark chữ loạn trên hình",
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
            "character_prompt": "Chủ yếu là hai bàn tay và cẳng tay hiện thực, có thể lộ góc mặt nghiêng; trang phục gọn gàng, phong thái đồng nhất toàn phim",
            "extra_prompt": "Góc chéo mặt bàn, bàn tay và sản phẩm/màn hình rõ ràng, trong hình không có chữ",
        },
        "seedance_config": {
            "motion_bias": "Bàn tay nhấp chuột lướt màn hình, máy quay tiến nhẹ về phía màn hình",
            "character_consistency": False,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Điềm tĩnh tài liệu"},
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
        "name": "Câu chuyện tranh chữ màn hình dọc",
        "description": "Tự sự bằng tranh minh họa màn hình dọc, bố cục điện ảnh, phù hợp cho video lịch sử nhân văn ngắn.",
        "category": ["Đồ họa chữ", "Điện ảnh", "Câu chuyện"],
        "preview_cover": "/static/templates/covers/portrait_story.png",
        "style_prefix": "Tranh minh họa khái niệm 2D đồng nhất, ánh sáng tinh tế và bố cục điện ảnh, không nhiếp ảnh hiện thực, không anime cel-shaded Nhật Bản, chủ thể màn hình dọc lệch giữa xuống dưới, phía trên chừa khoảng trống để chèn chữ, hình ảnh sạch sẽ không có chữ",
        "negative_prompt": "Ảnh chụp hiện thực, người thật, khuôn mặt người thật, studio nhiếp ảnh, ảnh đoàn phim người thật, anime cel-shaded Nhật, chữ trên hình, phụ đề, watermark, tiêu đề chữ, logo, mờ",
        "default_ratio": "9:16",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Phân chia cảnh theo tiết tấu câu chuyện: Khởi - Thừa - Chuyển - Hợp. Mỗi cảnh có title tiêu đề ngắn, subtitle phụ đề ngắn gọn, text là lời thuyết minh đọc được. Hình ảnh toàn phim phải đồng nhất phong cách tranh minh họa và ngoại hình nhân vật, nghiêm cấm cảnh này đột ngột biến thành ảnh người thật hay phong cách anime khác.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "Ngoại hình nhân vật chính câu chuyện cố định: Độ tuổi, kiểu tóc màu tóc, phối màu trang phục và vật nhận diện đồng nhất toàn phim, ngũ quan minh họa tinh tế, không phải ảnh người thật",
            "extra_prompt": "Bố cục màn hình dọc, chủ thể lệch giữa dưới, phía trên chừa khoảng 1/4 khoảng trống, ánh sáng điện ảnh, trong hình không có chữ",
        },
        "seedance_config": {
            "motion_bias": "Từ từ đẩy tới gần hoặc kéo ra xa nhẹ",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Không khí tự sự"},
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
        "name": "Hoạt hình 3D",
        "description": "Chất lượng hoạt hình 3D điện ảnh, tạo hình tròn trịa và ánh sáng thể tích dịu nhẹ, phù hợp giải thích khoa học và phim ngắn cốt truyện.",
        "category": ["3D", "Anime", "Khoa học"],
        "preview_cover": "/static/templates/covers/anim_3d.png",
        "style_prefix": (
            "Kết xuất hoạt hình 3D điện ảnh, phong cách Pixar/DreamWorks, tạo hình tròn trịa đường nét rõ ràng, "
            "ánh sáng thể tích dịu nhẹ và tán xạ dưới bề mặt, chất liệu sạch sẽ phối màu bão hòa, độ sâu trường ảnh nông, "
            "không nhiếp ảnh hiện thực, không 2D cel-shaded, không cắt giấy phẳng"
        ),
        "negative_prompt": (
            "Ảnh chụp hiện thực, lỗ chân lông da người thật, chụp studio thực tế, anime cel-shaded, tranh tô màu phẳng 2D, "
            "cắt giấy phẳng, pixel art, vẽ tay nguệch ngoạc, máu me kinh dị, watermark, chữ trên hình, phụ đề lỗi"
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
                "Nhân vật hoạt hình 3D cố định: Tỷ lệ tròn trịa, ngũ quan tinh gọn, kiểu tóc màu tóc và màu trang phục có độ nhận diện cao, "
                "làn da và chất vải mềm mại, toàn phim cùng một thiết kế nhân vật"
            ),
            "extra_prompt": (
                "Ánh sáng thể tích kết xuất 3D, chất liệu sạch sẽ, màu sắc bão hòa không chói mắt, chủ thể rõ ràng, "
                "trong hình không xuất hiện chữ; có thể chừa khoảng trống chèn chữ"
            ),
        },
        "seedance_config": {
            "motion_bias": "Vải áo và lọn tóc khẽ bay, từ từ tiến lại gần, chuyển động máy quay hoạt hình mượt mà",
            "character_consistency": True,
            "generate_audio": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "Nhanh nhẹn chuyên nghiệp"},
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
        "name": "Điện ảnh người thật",
        "description": "Chất lượng phim điện ảnh quay người thật, ánh sáng kịch tính và độ sâu trường ảnh nông, phù hợp phim ngắn tự sự.",
        "category": ["Điện ảnh", "Người thật"],
        "preview_cover": "/static/templates/covers/live_cinematic.png",
        "style_prefix": "Nhiếp ảnh điện ảnh người thật, đánh sáng chuẩn điện ảnh và độ sâu trường ảnh nông, chất cảm phim nhựa hạt nhẹ, chỉnh màu cam xanh teal-orange, da hiện thực và chất liệu chân thực, bố cục màn hình rộng, không hoạt hình anime",
        "negative_prompt": "Hoạt hình, anime, cel-shaded, 2D, tranh minh họa phẳng, cắt giấy, pixel, ngũ quan phóng đại, da bóng nhựa, watermark, chữ trên hình",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Phân cảnh theo chuẩn điện ảnh người thật: Cảnh toàn thiết lập → Trung cảnh → Cận cảnh. Toàn phim bắt buộc đồng nhất phong cách hiện thực người thật và ngoại hình diễn viên, cấm cảnh nào biến thành hoạt hình.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.75,
            "photoreal": True,
            "character_prompt": "Ngoại hình diễn viên người thật cố định: Độ tuổi, kiểu tóc màu tóc, đặc điểm khuôn mặt, trang phục toàn phim đồng nhất, kết cấu da chân thực",
            "extra_prompt": "Ánh sáng điện ảnh, độ sâu trường ảnh nông, hạt film nhựa, chất liệu bối cảnh chân thực",
        },
        "seedance_config": {
            "motion_bias": "Trượt ray điện ảnh hoặc lia máy nhẹ, làm mờ chuyển động tự nhiên",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Không khí điện ảnh"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom", "caption_scale": 1.3},
        "sort_order": 6,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "live_person",
        "name": "Tự sự người thật đời sống",
        "description": "Cảm giác người thật đời sống, phù hợp cho câu chuyện nhân vật, thuyết minh và phim tài liệu ngắn.",
        "category": ["Người thật", "Câu chuyện"],
        "preview_cover": "/static/templates/covers/live_person.png",
        "style_prefix": "Nhiếp ảnh đời sống người thật, ánh sáng tự nhiên và ánh sáng môi trường dịu nhẹ, ngũ quan và kết cấu da chân thực, bố cục tài liệu, không trang điểm đậm studio, không hoạt hình anime",
        "negative_prompt": "Hoạt hình, anime, cel-shaded, 2D, làm mịn da quá đà, người giả CGI, tranh minh họa phẳng, watermark, chữ trên hình",
        "default_ratio": "9:16",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tiết tấu tự sự nhân vật, lời dẫn khẩu ngữ tự nhiên gần gũi. Toàn phim đồng nhất phong cách hiện thực người thật và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "photoreal": True,
            "character_prompt": "Nhân vật chính người thật: Độ tuổi phong thái, kiểu tóc màu tóc, trang phục đời thường cố định, biểu cảm tự nhiên, toàn phim cùng một người",
            "extra_prompt": "Ánh sáng tự nhiên, bối cảnh đời sống, chủ thể màn hình dọc rõ ràng, phía trên có thể để trống chèn chữ",
        },
        "seedance_config": {
            "motion_bias": "Cảm giác cầm tay nhẹ, từ từ tiến lại gần",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "Ấm áp nhân văn"},
        "subtitle_config": {"font": "SourceHanSans", "position": "top"},
        "sort_order": 7,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "photo_realism",
        "name": "Nhiếp ảnh hiện thực",
        "description": "Chất lượng hiện thực cấp độ ảnh chụp, phù hợp cho sản phẩm, phong cảnh và khoa học tài liệu.",
        "category": ["Hiện thực", "Nhiếp ảnh"],
        "preview_cover": "/static/templates/covers/photo_realism.png",
        "style_prefix": "Nhiếp ảnh hiện thực cấp độ ảnh chụp, chi tiết sắc nét và chất liệu chân thực, màu sắc tự nhiên, dải tương phản động cao HDR, chụp cận cảnh hoặc phong cảnh, không hoạt hình không tranh vẽ không anime",
        "negative_prompt": "Hoạt hình, anime, cel-shaded, tranh minh họa phẳng, nét cọ sơn dầu, cắt giấy, pixel, sai màu HDR quá đà, watermark, chữ trên hình",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Ngôn ngữ ống kính nhiếp ảnh hiện thực: Toàn cảnh thiết lập → Đặc tả chi tiết. Nếu có nhân vật phải đồng nhất ngoại hình toàn phim; có thể là cảnh thuần bối cảnh không người. Cấm phong cách hoạt hình.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "photoreal": True,
            "character_prompt": "Nếu xuất hiện nhân vật: Ngũ quan hiện thực, kiểu tóc và trang phục cố định; nếu không có nhân vật thì tập trung vào bối cảnh và chất liệu chân thực",
            "extra_prompt": "Chi tiết chuẩn ảnh chụp, chất liệu chân thực, màu sắc tự nhiên, chủ thể sắc nét",
        },
        "seedance_config": {
            "motion_bias": "Từ từ tiến lại gần hoặc lia ngang nhẹ, cảm giác không gian chân thực",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Điềm tĩnh tài liệu"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 7,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "film_cinematic",
        "name": "Phim nhựa điện ảnh",
        "description": "Chất cảm phim nhựa màn ảnh rộng và ánh sáng kịch tính, phù hợp cho phim ngắn tự sự và câu chuyện giàu bầu không khí.",
        "category": ["Điện ảnh", "Phim nhựa"],
        "preview_cover": "/static/templates/covers/film_cinematic.png",
        "style_prefix": "Tranh minh họa khái niệm điện ảnh, bố cục màn ảnh rộng, hạt film nhựa và tối góc nhẹ, ánh sáng kịch tính (sáng nghiêng/ngược sáng), tông màu cam xanh, độ sâu trường ảnh nông giàu không khí, không nhiếp ảnh hiện thực, không anime cel-shaded",
        "negative_prompt": "Ảnh chụp hiện thực, người thật, khuôn mặt người thật, anime Nhật Bản, cel-shaded, nhãn dán phẳng, cháy sáng, watermark, chữ trên hình, hoạt hình nét vẽ đơn giản",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Theo tiết tấu phân cảnh điện ảnh: Cảnh toàn thiết lập → Cận cảnh → Cảnh phản ứng. Thoại tiết chế, nhường không gian cho hình ảnh. Toàn phim đồng nhất phong cách minh họa film nhựa và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "Nhân vật chính minh họa điện ảnh, độ tuổi rõ ràng và kiểu tóc màu tóc cố định, đường nét trang phục và vật nhận diện cố định, chi tiết khuôn mặt vừa phải không phải ảnh chụp, toàn phim cùng thiết kế nhân vật",
            "extra_prompt": "Hạt film nhựa, tối góc, ánh sáng kịch tính, không khí cam xanh, chủ thể màn ảnh rộng rõ ràng",
        },
        "seedance_config": {
            "motion_bias": "Trượt ray chậm hoặc lia ngang nhẹ, góc máy điện ảnh, tránh rung lắc",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Không khí điện ảnh"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 8,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "noir_thriller",
        "name": "Noir giật gân hồi hộp",
        "description": "Ánh sáng tương phản cao và bầu không khí lạnh, phù hợp cho trinh thám, vụ án và tự sự đêm tối.",
        "category": ["Giật gân", "Điện ảnh"],
        "preview_cover": "/static/templates/covers/noir_thriller.png",
        "style_prefix": "Tranh minh họa khái niệm phim đen Noir, ranh giới sáng tối tương phản cao, tông xám xanh lạnh điểm xuyết ít ánh sáng ấm, không khí đêm mưa hoặc đèn bàn trong phòng, bóng đen và góc nghiêng mặt, không nhiếp ảnh hiện thực",
        "negative_prompt": "Màu phấn tươi sáng, tranh truyện thiếu nhi, thiếu nữ anime Nhật, ảnh chụp hiện thực, người thật, cận cảnh máu me, watermark, chữ trên hình",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Tiết tấu hồi hộp giật gân: Manh mối → Bước ngoặt đảo chiều → Căng thẳng dồn dập. Thoại câu ngắn, khung hình tận dụng bóng đổ và sức căng bố cục. Toàn phim đồng nhất phong cách minh họa phim noir.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "Nhân vật minh họa phong cách Noir, đường nét rõ ràng, áo khoác dài hoặc bóng đen biểu tượng, khuôn mặt ít ánh sáng, ngoại hình toàn phim đồng nhất",
            "extra_prompt": "Bóng tối tương phản cao, tông màu lạnh, đêm mưa hoặc đèn bàn, lực căng bố cục mạnh mẽ",
        },
        "seedance_config": {
            "motion_bias": "Rất chậm tiến lại gần, làn khói hoặc hạt mưa khẽ bay",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Hồi hộp trầm lắng"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 9,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "vox_papercut",
        "name": "Vox cắt giấy khoa học",
        "description": "Cắt giấy phẳng độ bão hòa thấp, với nhân vật thao tác máy tính/giao diện hệ thống làm khung hình chính, phù hợp giải thích kiến thức chuyên sâu và sản phẩm.",
        "category": ["Khoa học", "Cắt giấy"],
        "preview_cover": "/static/templates/covers/vox_papercut.png",
        "style_prefix": (
            "Tranh minh họa phẳng cắt giấy Vox, viền giấy xếp lớp, độ bão hòa thấp, bóng cắt sạch sẽ, phong thái video thuyết minh khoa học; "
            "hình ảnh lấy nhân vật thao tác máy tính hoặc hệ thống làm chủ đạo: thao tác trước bàn làm việc, ngón tay nhấp giao diện, giám sát đa màn hình, "
            "cấu hình tham số, trình diễn quy trình, màn hình và động tác tay rõ ràng, biểu đồ thông tin phụ trợ"
        ),
        "negative_prompt": (
            "Ảnh chụp hiện thực, da cấp độ ảnh người thật, kết xuất 3D hiện thực, anime Nhật, mờ, nhiễu hạt, watermark, "
            "chữ rác trên hình, cảnh trống phong cảnh không có người không có giao diện, mảng màu thuần trừu tượng không có bối cảnh thao tác"
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
                "Người thao tác cắt giấy cố định: Bóng người đơn giản, khuôn mặt tối giản chi tiết, trang phục mảng màu công sở hoặc thường ngày cố định, "
                "thường ngồi trước bàn thao tác laptop hoặc bảng điều khiển màn hình đôi, kiểu tóc và phối màu toàn phim đồng nhất"
            ),
            "extra_prompt": (
                "Chủ thể là người thao tác máy tính/giao diện hệ thống, phân khu màn hình và cử chỉ nhấp chuột rõ ràng, "
                "viền giấy xếp lớp sắc nét, độ bão hòa thấp, mỗi cảnh một tiêu điểm thị giác, tránh da hiện thực"
            ),
        },
        "seedance_config": {
            "motion_bias": "Bàn tay nhấp nhẹ và cảm giác con trỏ chuột di chuyển, nội dung màn hình chuyển đổi nhẹ, máy quay từ từ tiến lại gần bàn làm việc",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Phim tài liệu tò mò"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 10,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "docu_warm",
        "name": "Tài liệu ấm áp",
        "description": "Chất cảm tranh minh họa tài liệu và tông màu ấm, phù hợp câu chuyện nhân vật và phim tài liệu ngắn nhân văn.",
        "category": ["Phim tài liệu", "Điện ảnh"],
        "preview_cover": "/static/templates/covers/docu_warm.png",
        "style_prefix": "Tranh minh họa khái niệm tài liệu ấm áp, cảm giác ánh sáng tự nhiên, tông nâu ấm và trắng be dịu nhẹ, chi tiết bối cảnh đời sống, bố cục phim tài liệu, không ảnh chụp hiện thực, không anime cel-shaded",
        "negative_prompt": "Cyber neon, thiếu nữ anime Nhật, máu me, hoạt hình phóng đại, ảnh chụp hiện thực, người thật, watermark, chữ trên hình",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 14,
        "llm_system_addon": "Tiết tấu tài liệu nhân văn: Quan sát → Chi tiết → Điểm chạm cảm xúc. Lời dẫn ôn hòa, chân thành. Toàn phim đồng nhất phong cách tranh minh họa tài liệu ấm áp và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.68,
            "character_prompt": "Nhân vật minh họa tài liệu, kiểu tóc trang phục đời thường, ngũ quan gần gũi, độ tuổi rõ ràng, toàn phim cùng một thiết kế nhân vật",
            "extra_prompt": "Ánh sáng tự nhiên tông ấm, bối cảnh đời sống, bố cục phong cách tài liệu, hạt nhẹ dịu",
        },
        "seedance_config": {
            "motion_bias": "Rung nhẹ cảm giác cầm tay hoặc lia ngang chậm, góc máy tài liệu",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "Ấm áp nhân văn"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 12,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "kids_flat",
        "name": "Tranh truyện thiếu nhi phẳng",
        "description": "Phối màu dịu nhẹ và tạo hình tròn trịa, phù hợp cho khoa học và câu chuyện thiếu nhi.",
        "category": ["Thiếu nhi", "Tranh truyện"],
        "preview_cover": "/static/templates/covers/kids_flat.png",
        "style_prefix": "Tranh minh họa phẳng phong cách tranh truyện thiếu nhi, màu phấn dịu nhẹ, tạo hình tròn trịa, nhân vật thân thiện, hậu cảnh tinh giản",
        "negative_prompt": "Kinh dị, tăm tối, ảnh chụp hiện thực, kết cấu phức tạp, máu me",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Dùng các câu ngắn trẻ em dễ hiểu, mỗi cảnh làm nổi bật một yếu tố hình ảnh đáng yêu, tiết tấu vui tươi nhanh nhẹn.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.65,
            "character_prompt": "Nhân vật hoạt hình tròn trịa đáng yêu, mắt to ngũ quan đơn giản hóa, trang phục phối màu dịu nhẹ, biểu cảm thân thiện, toàn phim cùng một ngoại hình nhân vật",
            "extra_prompt": "Ánh sáng dịu màu phấn, hậu cảnh tinh giản, tạo hình tròn trịa, phù hợp cho trẻ em xem",
        },
        "seedance_config": {
            "motion_bias": "Cảm giác nhún nhảy nhẹ, máy quay trôi dịu dàng",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "Hóm hỉnh vui tươi"},
        "subtitle_config": {"font": "RoundedSans", "position": "bottom"},
        "sort_order": 20,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "soft_anime",
        "name": "Anime ánh sáng dịu",
        "description": "Anime cel-shaded ánh sáng dịu Nhật Bản, phù hợp câu chuyện thanh xuân và phim ngắn cảm xúc.",
        "category": ["Anime", "Câu chuyện"],
        "preview_cover": "/static/templates/covers/soft_anime.png",
        "style_prefix": "Anime cel-shaded ánh sáng dịu Nhật Bản, nét vẽ sạch sẽ, bầu trời chuyển màu dịu dàng, mắt to ngũ quan tinh tế, thiết lập nhân vật đồng nhất, không nhiếp ảnh hiện thực, không thủy mặc, không cắt giấy",
        "negative_prompt": "Ảnh chụp hiện thực, người thật, khuôn mặt người thật, thủy mặc, cắt giấy, pixel art, máu me kinh dị, watermark, chữ trên hình, pha trộn phong cách Chibi Q-version",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tự sự anime thanh xuân: Xen kẽ cảnh cảm xúc + cảnh đối thoại. Toàn phim bắt buộc đồng nhất phong cách cel-shaded anime và tạo hình nhân vật, cấm cảnh này biến thành người thật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "Nhân vật chính anime Nhật Bản, kiểu tóc màu tóc màu mắt cố định, phối màu đồng phục học sinh hoặc thường phục cố định, ngũ quan cel-shaded, toàn phim cùng một thiết kế nhân vật",
            "extra_prompt": "Ánh sáng dịu, nét vẽ sạch sẽ, bầu trời dịu nhẹ, tô màu cel-shaded đồng nhất",
        },
        "seedance_config": {
            "motion_bias": "Lọn tóc và vạt áo khẽ bay, máy quay từ từ tiến lại gần",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "warm_storyteller", "bgm_mood": "Nhạc nhẹ thanh xuân"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 22,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "chalk_whiteboard",
        "name": "Bút phấn bảng trắng vẽ tay",
        "description": "Phong cách giảng giải bút phấn bảng đen, làm nổi bật nhân vật thao tác hệ thống / vẽ sơ đồ quy trình.",
        "category": ["Khoa học", "Vẽ tay"],
        "preview_cover": "/static/templates/covers/chalk_whiteboard.png",
        "style_prefix": (
            "Phong cách giảng giải bảng phấn đen và bảng trắng vẽ tay, nét cọ phấn, mũi tên sơ đồ; "
            "hình ảnh thường có nhân vật nét vẽ đơn giản trước bảng trắng hoặc máy tính thao tác hệ thống, vẽ quy trình, chỉ dẫn giao diện"
        ),
        "negative_prompt": "Ảnh chụp hiện thực, 3D nhẵn bóng, giao diện rối rắm, phòng học trống không có người",
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
                "Người giảng giải/thao tác vẽ nét phấn đơn giản, đường nét tinh gọn đặc điểm cố định, "
                "thường đứng trước bảng trắng hoặc ngồi trước máy tính chỉ vào giao diện"
            ),
            "extra_prompt": "Nền bảng đen/bảng trắng, nhân vật thao tác hệ thống hoặc vẽ sơ đồ quy trình, mũi tên rõ ràng, bố cục mang tính giảng dạy",
        },
        "seedance_config": {
            "motion_bias": "Bàn tay chỉ trỏ và đường nét dần xuất hiện, máy quay cơ bản cố định hoặc đẩy nhẹ",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "teacher_clear", "bgm_mood": "Tập trung chú ý"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 30,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "cyber_neon",
        "name": "Cyber Neon",
        "description": "Thành phố đêm ánh sáng neon và cảm giác tương lai, phù hợp cho chủ đề công nghệ, đô thị và khoa học viễn tưởng.",
        "category": ["Khoa học viễn tưởng", "Cyber"],
        "preview_cover": "/static/templates/covers/cyber_neon.png",
        "style_prefix": "Tranh minh họa khái niệm Cyberpunk, tương phản hồng xanh neon, đường phố đêm mưa phản chiếu, bóng hình đô thị tương lai, cảnh đêm tương phản cao, không nhiếp ảnh hiện thực, không tranh truyện thiếu nhi",
        "negative_prompt": "Bãi biển nắng ban ngày, màu nước đồng quê, màu phấn trẻ em, ảnh chụp hiện thực, người thật, thủy mặc chừa trắng, watermark, chữ trên hình",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tiết tấu công nghệ / đô thị nhanh, mỗi cảnh một biểu tượng thị giác mạnh mẽ (neon, màn hình, đêm mưa). Toàn phim đồng nhất phong cách minh họa cyberpunk.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "Nhân vật minh họa phong cách Cyber, kiểu áo khoác và màu tóc cố định, ánh sáng viền neon, khuôn mặt không phải ảnh chụp, toàn phim cùng một thiết kế nhân vật",
            "extra_prompt": "Hồng xanh neon, đêm mưa phản chiếu, đô thị tương lai, cảnh đêm tương phản mạnh",
        },
        "seedance_config": {
            "motion_bias": "Ánh đèn neon nhấp nháy, hạt mưa rơi, góc máy từ từ lướt qua",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "Điện tử Cyber"},
        "subtitle_config": {"font": "DisplaySans", "position": "bottom"},
        "sort_order": 35,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "epic_fantasy",
        "name": "Sử thi kỳ ảo",
        "description": "Bối cảnh hùng vĩ và ánh sáng kỳ ảo, phù hợp cho thần thoại, phiêu lưu và phim ngắn thế giới quan.",
        "category": ["Kỳ ảo", "Điện ảnh"],
        "preview_cover": "/static/templates/covers/epic_fantasy.png",
        "style_prefix": "Tranh minh họa khái niệm sử thi kỳ ảo, đại cảnh hùng vĩ và trung cảnh người hùng, ánh hoàng hôn và luồng sáng thần thánh, lâu đài đá và biển mây, bố cục kịch tính, không nhiếp ảnh hiện thực, không đô thị hiện đại",
        "negative_prompt": "Thành phố hiện đại, giao diện điện thoại, ảnh chụp hiện thực, người thật, nét vẽ đơn giản trẻ em, cyber neon, watermark, chữ trên hình",
        "default_ratio": "16:9",
        "shot_duration_min": 4,
        "shot_duration_max": 14,
        "llm_system_addon": "Tự sự sử thi: Đại cảnh thiết lập thế giới quan → Nhân vật xuất hiện → Xung đột cao trào. Thoại mang âm hưởng trang trọng. Toàn phim đồng nhất phong cách minh họa kỳ ảo.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.72,
            "character_prompt": "Ngoại hình nhân vật chính kỳ ảo cố định: Đường nét áo giáp hoặc áo choàng, màu tóc, vũ khí nhận diện toàn phim đồng nhất, ngũ quan minh họa không phải ảnh chụp",
            "extra_prompt": "Bối cảnh hùng vĩ, ánh sáng thần thánh hoàng hôn, bố cục kịch tính, không khí sử thi",
        },
        "seedance_config": {
            "motion_bias": "Máy quay nâng hạ chậm, mây mù và cờ bay phấp phới",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "narrator_calm", "bgm_mood": "Dàn nhạc giao hưởng sử thi"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 38,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "magazine_collage",
        "name": "Cắt dán tạp chí",
        "description": "Cắt dán báo và vân in ấn, phù hợp cho chủ đề văn hóa và câu chuyện thương hiệu.",
        "category": ["Thương mại", "Cắt dán"],
        "preview_cover": "/static/templates/covers/magazine_collage.png",
        "style_prefix": "Cắt dán chất liệu giấy tạp chí, viền rách xé, chất cảm in lưới chấm hạt, cắt dán xếp lớp, bố cục đồ họa phẳng táo bạo",
        "negative_prompt": "Vector thuần khiết, da hiện thực, màu sắc bẩn thỉu xám xịt",
        "default_ratio": "9:16",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Ưu tiên tác động thị giác, mỗi cảnh một bố cục ấn tượng, lời văn ngắn gọn và mạnh mẽ.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.75,
            "character_prompt": "Bóng người cắt dán tạp chí hoặc nhân vật bán sắc in ấn halftone, ngoại hình và phối màu toàn phim thống nhất",
            "extra_prompt": "Giấy rách viền, in lưới halftone, mảng màu táo bạo, bố cục màn hình dọc mạnh mẽ",
        },
        "seedance_config": {
            "motion_bias": "Các lớp hình khẽ trượt và xoay nhẹ, tiếng sột soạt chất liệu giấy",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "Điện tử thời thượng nhẹ nhàng"},
        "subtitle_config": {"font": "DisplaySans", "position": "center"},
        "sort_order": 40,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "brand_clean",
        "name": "Thương hiệu tối giản",
        "description": "Mảng màu sạch sẽ và khoảng trống lớn, phù hợp giải thích sản phẩm và phim ngắn thương hiệu.",
        "category": ["Thương mại", "Tối giản"],
        "preview_cover": "/static/templates/covers/brand_clean.png",
        "style_prefix": "Tranh minh họa khái niệm thương hiệu tối giản, diện tích khoảng trống lớn, bảng màu giới hạn (trắng đen + 1 màu nhấn), bố cục hình học, cảm giác sản phẩm tinh tế, không nhiếp ảnh hiện thực, không cắt dán lộn xộn",
        "negative_prompt": "Chất liệu lộn xộn, cyber neon, máu me, màu phấn trẻ em xếp đống, ảnh chụp hiện thực, người thật, watermark, chữ loạn trên hình",
        "default_ratio": "9:16",
        "shot_duration_min": 3,
        "shot_duration_max": 10,
        "llm_system_addon": "Câu thương mại ngắn gọn: Điểm bán → Bối cảnh → Đúc kết. Mỗi cảnh một tiêu điểm thị giác. Toàn phim đồng nhất phong cách minh họa thương hiệu tối giản.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.68,
            "character_prompt": "Nhân vật hình học tối giản hoặc bóng bàn tay, phối màu cố định, khuôn mặt ít chi tiết, ngoại hình toàn phim nhất quán",
            "extra_prompt": "Khoảng trống lớn, bảng màu giới hạn, bố cục hình học, cảm giác thương hiệu màn hình dọc",
        },
        "seedance_config": {
            "motion_bias": "Mảng màu di chuyển nhẹ, từ từ tiến lại rất chậm, sạch sẽ không rung lắc",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "urban_editorial", "bgm_mood": "Điện tử tối giản"},
        "subtitle_config": {"font": "DisplaySans", "position": "center"},
        "sort_order": 42,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "pixel_retro",
        "name": "Pixel hoài cổ khoa học",
        "description": "Phong cách pixel 8-bit/16-bit, phù hợp cho lịch sử công nghệ và giải thích dạng trò chơi.",
        "category": ["Hoài cổ", "Pixel"],
        "preview_cover": "/static/templates/covers/pixel_retro.png",
        "style_prefix": "Tranh pixel hoài cổ, bảng màu giới hạn 16-bit, các khối pixel sắc nét, bối cảnh trò chơi đơn giản, không khử răng cưa",
        "negative_prompt": "Dải chuyển màu mượt mà, ảnh chụp hiện thực, pixel bị nhòe mờ",
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
            "character_prompt": "Người thao tác tí hon pixel 16-bit, ngồi trước máy tính, bảng màu giới hạn, ngoại hình và tông màu toàn phim không đổi",
            "extra_prompt": "Nhân vật pixel tí hon thao tác giao diện hệ thống, các khối pixel sắc nét, không khử răng cưa, bối cảnh dạng màn chơi game",
        },
        "seedance_config": {
            "motion_bias": "Nhấp chuột từng khung hình và chuyển đổi màn hình, cuộn thị sai nhẹ",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "retro_host", "bgm_mood": "Tò mò 8-bit"},
        "subtitle_config": {"font": "PixelFont", "position": "bottom"},
        "sort_order": 50,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "retro_vhs",
        "name": "Băng từ VHS hoài cổ",
        "description": "Chất cảm băng từ video và đường quét scanline, phù hợp cho câu chuyện hoài niệm và nội dung mang tính thời đại.",
        "category": ["Hoài cổ", "Điện ảnh"],
        "preview_cover": "/static/templates/covers/retro_vhs.png",
        "style_prefix": "Tranh minh họa khái niệm VHS hoài cổ, quang sai màu nhẹ và gợi ý đường quét scanline, tông màu thập niên 1980–90, bố cục khung tivi bo góc, bầu không khí hoài niệm, không ảnh chụp hiện thực, không UI siêu nét hiện đại",
        "negative_prompt": "Quảng cáo hiện đại siêu nét, cyber neon xếp đống, ảnh chụp hiện thực, người thật, màu phấn trẻ em, watermark, chữ rác trên hình",
        "default_ratio": "16:9",
        "shot_duration_min": 3,
        "shot_duration_max": 12,
        "llm_system_addon": "Tự sự hoài niệm, lời dẫn mang cảm giác thời đại. Toàn phim đồng nhất chất cảm minh họa băng VHS và ngoại hình nhân vật.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "Nhân vật minh họa phong cách hoài cổ, kiểu tóc trang phục mang tính thời đại cố định, viền quang sai màu nhẹ, không phải ảnh chụp, toàn phim cùng một thiết kế nhân vật",
            "extra_prompt": "Gợi ý đường quét scanline, quang sai màu nhẹ, tông màu thập niên 80/90, bố cục hoài niệm",
        },
        "seedance_config": {
            "motion_bias": "Cảm giác rung giật nhẹ của băng từ, đẩy chậm, viền màu chớp nhẹ",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "retro_host", "bgm_mood": "Synth hoài cổ"},
        "subtitle_config": {"font": "SourceHanSans", "position": "bottom"},
        "sort_order": 52,
        "is_active": True,
        "is_premium": False,
    },
    {
        "id": "ink_guofeng",
        "name": "Thủy mặc cổ phong",
        "description": "Thủy mặc chừa trắng và nét vẽ ý cảnh, phù hợp cho lịch sử và câu chuyện văn hóa ngắn.",
        "category": ["Cổ phong", "Thủy mặc"],
        "preview_cover": "/static/templates/covers/ink_guofeng.png",
        "style_prefix": "Tranh minh họa thủy mặc tả ý, nét cọ giàu sức biểu cảm, khoảng trống chừa trắng lớn, bầu không khí thi vị, sắc mực thanh nhã, không nhiếp ảnh hiện thực",
        "negative_prompt": "Ảnh chụp hiện thực, người thật, khuôn mặt người thật, neon, cyberpunk, anime Nhật, hoạt hình Âu Mỹ, chữ trên hình, phụ đề, watermark",
        "default_ratio": "9:16",
        "shot_duration_min": 4,
        "shot_duration_max": 12,
        "llm_system_addon": "Tự sự thiên về ý cảnh và bước ngoặt, lời thoại đậm chất văn học, tiết tấu khoảng lặng giàu cảm xúc. Thích hợp video đồ họa chữ màn hình dọc: Mỗi cảnh tiêu đề ngắn + phụ đề thơ mộng, kèm lời thuyết minh có thể đọc được.",
        "seedream_config": {
            "ref_images": [],
            "strength": 0.7,
            "character_prompt": "Nhân vật thủy mặc tả ý, nét vẽ giản lược lông mày ánh mắt, áo thụng hoặc trang phục cổ trang dáng cố định, sắc mực thanh nhã, toàn phim cùng một thiết kế nhân vật",
            "extra_prompt": "Nhiều khoảng trống chừa trắng, loang mực thanh nhã, ý cảnh thi vị, màn hình dọc phía trên có thể chèn chữ",
        },
        "seedance_config": {
            "motion_bias": "Vết mực loang ra và tan biến, máy quay nâng hạ chậm, sương mỏng lượn lờ",
            "character_consistency": True,
        },
        "audio_config": {"voice_preset": "guqin_narrator", "bgm_mood": "Cổ cầm cổ tranh"},
        "subtitle_config": {"font": "KaiTi", "position": "top"},
        "sort_order": 60,
        "is_active": True,
        "is_premium": False,
    },
]

TEMPLATES.extend(HUOKE_TEMPLATES)
