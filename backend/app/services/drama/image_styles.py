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
