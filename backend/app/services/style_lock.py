"""Force visual style + character consistency across storyboard shots."""

from __future__ import annotations

import re
from urllib.parse import urlparse

# Các thuật ngữ gây ra hành động trực tiếp/hoạt ảnh/3D trôi qua các cảnh quay (dành cho mẫu minh họa)
_STYLE_DRIFT_ILLUS = re.compile(
    r"(写实照片|照片级真实|真人实拍|真实人脸|真人脸|摄影棚人像|电影真人剧照|"
    r"超写实皮肤|照片质感|live[\s-]?action|photoreal(?:istic)?|"
    r"赛璐璐二次元|日系动漫脸|动漫大眼睛|萌系二次元|3D超写实|CGI写实人像|"
    r"ảnh chụp thực tế|ảnh chân thực|người thật|gương mặt thật|chân dung studio|ảnh tĩnh điện ảnh|"
    r"da siêu thực|chất liệu ảnh|cel-shaded 2D|mặt anime nhật|mắt to anime|3D siêu thực)",
    re.IGNORECASE,
)

# Các thuật ngữ phá vỡ mẫu tả thực / người thật
_STYLE_DRIFT_PHOTO = re.compile(
    r"(卡通简笔画|儿童绘本扁平|赛璐璐二次元|日系动漫脸|萌系二次元|"
    r"剪纸扁平|像素块|水墨写意|贴纸拼贴|Q版三头身|"
    r"hoạt hình nét vẽ đơn giản|tranh truyện thiếu nhi phẳng|anime 2D|gương mặt anime nhật|"
    r"cắt giấy phẳng|khối pixel|thủy mặc|hình dán collage|chibi 3 đầu thân)",
    re.IGNORECASE,
)

_EXTRA_NEGATIVE_ILLUS = (
    "ảnh chụp thực tế, người thật, gương mặt thật, chân dung studio, ảnh tĩnh điện ảnh người thật, da chuẩn ảnh, "
    "phong cách lẫn lộn, nét vẽ nhảy giữa các cảnh, phong cách vẽ khác, pha trộn anime 2D và tả thực"
)

_EXTRA_NEGATIVE_PHOTO = (
    "hoạt hình, anime, cel-shaded, 2D, minh họa phẳng, cắt giấy, phong cách pixel, thủy mặc, "
    "phong cách lẫn lộn, nét vẽ nhảy giữa các cảnh, phong cách khác, pha trộn minh họa và tả thực"
)

_SCENE_TAG = re.compile(r"^【(?:Bối cảnh|场景)】\s*(.+?)(?=\n【|\Z)", re.MULTILINE | re.S)
_LOCK_LINE = re.compile(
    r"【(?:Khóa phong cách|Khoá phong cách|Gợi ý phong cách|Khóa nhân vật|Khoá nhân vật|Ràng buộc|风格锁定|人物锁定|约束|风格提示)】[^\n]*"
)
_PERSON_SETTING = re.compile(r"(?:Thiết lập nhân vật|Hình tượng nhân vật|人物设定|角色设定)[：:][^\n【]{0,400}")


def strip_style_drift(prompt: str, *, photoreal: bool = False) -> str:
    rx = _STYLE_DRIFT_PHOTO if photoreal else _STYLE_DRIFT_ILLUS
    out = rx.sub("", prompt or "")
    out = re.sub(r"[,，]{2,}", ", ", out)
    return out.strip(",，。 \n\t")


def strip_lock_blocks(prompt: str) -> str:
    """Xóa các thẻ khóa nội bộ khi hiển thị trên giao diện hoặc lưu trữ lời nhắc cảnh."""
    raw = (prompt or "").strip()
    if not raw:
        return ""
    # Định dạng thẻ mới
    m = _SCENE_TAG.search(raw)
    if m:
        return m.group(1).strip("，,。 \n\t")
    # Bỏ các dòng thẻ khóa
    out = _LOCK_LINE.sub("", raw)
    out = _PERSON_SETTING.sub("", out)
    # Tương thích cũ: bỏ các phân đoạn bắt đầu bằng thẻ khóa / boilerplate
    lock_prefixes = (
        "【Khóa phong cách】", "【Khoá phong cách】", "【Gợi ý phong cách】",
        "【Khóa nhân vật】", "【Khoá nhân vật】", "【Ràng buộc】", "【Bối cảnh】",
        "【风格锁定】", "【人物锁定】", "【约束】", "【风格提示】", "【场景】",
        "Thiết lập nhân vật", "Hình tượng nhân vật", "人物设定", "角色设定",
    )
    if any(p in raw for p in lock_prefixes):
        kept: list[str] = []
        for part in re.split(r"[，,\n]", raw):
            p = part.strip()
            if not p:
                continue
            if p.startswith(lock_prefixes):
                continue
            if p.startswith((
                "Cùng một phong cách", "Cùng phong cách", "Toàn phim phải giữ", "Toàn phim đồng nhất",
                "Mỗi khi xuất hiện", "Cấm tả thực", "Cấm đổi mặt", "Hình ảnh sạch không chữ",
                "同一画风", "全片必须保持", "凡出现人物", "禁止写实", "禁止换脸", "画面干净无文字",
            )):
                continue
            # Bỏ các đoạn giữa khóa
            if any(k in p for k in (
                "Cấm chuyển đổi giữa các cảnh", "phải tuân thủ nghiêm ngặt ngoại hình trên",
                "禁止镜头间切换", "必须严格沿用以上外形",
            )):
                continue
            kept.append(p)
        out = ", ".join(kept)
    out = re.sub(r"[,，]{2,}", ", ", out)
    out = re.sub(r"\s{2,}", " ", out)
    return out.strip("，,。；; \n\t")


def build_locked_image_prompt(
    style_prefix: str,
    img_prompt: str,
    character_bible: str = "",
    *,
    photoreal: bool = False,
    lock_character: bool = True,
    lock_style: bool = True,
) -> str:
    """Tạo prompt cho Seedream. lock_* có thể nới lỏng cho các mẫu đa dạng / showcase."""
    body = strip_lock_blocks(strip_style_drift(img_prompt, photoreal=photoreal))
    if style_prefix and style_prefix in body:
        body = body.replace(style_prefix, "", 1).strip("，, ")
    parts: list[str] = []
    if lock_style and style_prefix:
        if photoreal:
            parts.append(
                f"【Khóa phong cách】{style_prefix}。Toàn phim đồng nhất phong cách này, cấm hoạt hình anime và nhảy phong cách"
            )
        elif lock_character:
            parts.append(
                f"【Khóa phong cách】{style_prefix}。Toàn phim đồng nhất phong cách này, cấm nhiếp ảnh tả thực và nhảy phong cách"
            )
        else:
            parts.append(
                f"【Gợi ý phong cách】{style_prefix}。"
                "Phối màu và loại giao diện ưu tiên tuân theo mô tả bối cảnh; cấm áp đặt bừa bãi màn hình lớn cyber xanh neon"
            )
    if lock_character and (character_bible or "").strip():
        parts.append(
            f"【Khóa nhân vật】{(character_bible or '').strip()}。Mỗi khi xuất hiện nhân vật phải tuân thủ nghiêm ngặt ngoại hình trên, cấm đổi mặt đổi trang phục"
        )
    if body:
        parts.append(f"【Bối cảnh】{body}")
    if lock_character:
        parts.append("【Ràng buộc】Cùng một phong cách cùng một nhân vật, hình ảnh sạch không chữ")
    else:
        parts.append("【Ràng buộc】Bối cảnh cảnh quay này phải độc đáo, bố cục khác biệt rõ rệt với các cảnh khác, hình ảnh sạch không chữ")
    return "\n".join(parts)


def merge_negative(
    template_negative: str,
    *,
    image_text: bool = False,
    photoreal: bool = False,
) -> str:
    base = (template_negative or "").strip("，, ")
    extra = _EXTRA_NEGATIVE_PHOTO if photoreal else _EXTRA_NEGATIVE_ILLUS
    parts = [p for p in (base, extra) if p]
    merged = ", ".join(parts)
    if image_text and not any(k in merged for k in ("chữ", "văn bản", "tiêu đề", "文字")):
        merged = f"{merged}, chữ trên hình, phụ đề, watermark, chữ tiêu đề"
    return merged


def template_consistency_mode(tpl) -> str:
    """Return character | style | diverse.

    - character: cast lock + shot-to-shot image ref chaining (mặc định dẫn truyện)
    - style: keep style only, no cast lock, no ref chaining
    - diverse: content-driven independent scenes (mã nguồn mở / demo sản phẩm)
    """
    if tpl is None:
        return "character"
    cfg = getattr(tpl, "seedream_config", None) or {}
    if not isinstance(cfg, dict):
        cfg = {}
    mode = str(cfg.get("consistency_mode") or "").strip().lower()
    if mode in {"character", "style", "diverse", "none"}:
        return "diverse" if mode == "none" else mode
    for conf in (cfg, getattr(tpl, "seedance_config", None) or {}):
        if isinstance(conf, dict) and "character_consistency" in conf:
            return "character" if conf.get("character_consistency") else "diverse"
    return "character"


def template_is_photoreal(tpl) -> bool:
    """True when template opts into live-action / photoreal style."""
    if tpl is None:
        return False
    cfg = getattr(tpl, "seedream_config", None) or {}
    if isinstance(cfg, dict) and cfg.get("photoreal"):
        return True
    cats = getattr(tpl, "category", None) or []
    return any(c in {"Người thật", "Tả thực", "真人感", "写实感"} for c in cats)


def _seedream_cfg(tpl) -> dict:
    """Lấy mẫu seedream_config ra và trả về một lệnh trống theo mặc định hoặc nếu loại không chính xác."""
    cfg = getattr(tpl, "seedream_config", None) or {}
    return cfg if isinstance(cfg, dict) else {}


def template_shot_range(tpl) -> tuple[int, int] | None:
    """Phạm vi số lượng ảnh bị khóa theo mẫu; nếu không được định cấu hình, nó sẽ trả về Không có và số lượng ảnh chụp mặc định là 6–10 ảnh."""
    if tpl is None:
        return None
    cfg = _seedream_cfg(tpl)
    raw_lo = cfg.get("shot_count_min")
    if raw_lo is None:
        return None
    lo = max(1, int(raw_lo))
    raw_hi = cfg.get("shot_count_max")
    hi = max(lo, int(raw_hi)) if raw_hi is not None else lo
    return lo, hi


def template_allow_source_names(tpl) -> bool:
    """Mẫu thu hút khách hàng: Lời tường thuật giữ nguyên tên cửa hàng/tên sản phẩm trong bản sao của người dùng."""
    if tpl is None:
        return False
    return bool(_seedream_cfg(tpl).get("allow_source_names"))


def template_prompt_defaults(tpl) -> dict[str, str]:
    """Canonical style / character / extra prompts from a template.

    style ← style_prefix; nhân vật/yêu cầu thêm ← seedream_config.
    """
    if tpl is None:
        return {"style_prompt": "", "character_prompt": "", "extra_prompt": ""}
    cfg = getattr(tpl, "seedream_config", None) or {}
    if not isinstance(cfg, dict):
        cfg = {}
    return {
        "style_prompt": (getattr(tpl, "style_prefix", None) or "").strip(),
        "character_prompt": str(cfg.get("character_prompt") or "").strip(),
        "extra_prompt": str(cfg.get("extra_prompt") or "").strip(),
    }


def seedream_ref_urls(*candidates: str | None, limit: int = 2) -> list[str]:
    """Normalize refs for Seedream — **public https only**.

    Skip data: URIs (multi‑MB base64 often hangs Seedream) and LAN/localhost URLs
    (Ark cloud cannot fetch them). Prefer prior shot `image_ark_url` CDN links.
    limit mặc định 2 (phân cảnh neo kiến thức); chủ thể phim ngắn drama + bảng phong cách dùng split_seedream_subject_style_refs.
    """
    out: list[str] = []
    seen: set[str] = set()
    for raw in candidates:
        if not raw:
            continue
        u = raw.strip()
        if not u or u in seen:
            continue
        if not (u.startswith("https://") or u.startswith("http://")):
            continue
        host = (urlparse(u).hostname or "").lower()
        if not host or host in {"localhost", "127.0.0.1", "::1"}:
            continue
        if host.startswith("192.168.") or host.startswith("10."):
            continue
        if re.match(r"^172\.(1[6-9]|2\d|3[0-1])\.", host):
            continue
        out.append(u)
        seen.add(u)
    cap = max(0, int(limit))
    return out[:cap]


def split_seedream_subject_style_refs(
    subject_urls: list[str] | None,
    style_urls: list[str] | None,
    *,
    max_total: int = 6,
) -> tuple[list[str], list[str]]:
    """Tài liệu tham khảo chính sẽ được ưu tiên nhưng 1 vị trí sẽ được dành cho bảng định kiểu."""
    cap = max(1, int(max_total))
    style_refs = seedream_ref_urls(*(style_urls or []), limit=1)
    budget = cap - len(style_refs)
    subject_refs = seedream_ref_urls(*(subject_urls or []), limit=budget)
    return subject_refs, style_refs
