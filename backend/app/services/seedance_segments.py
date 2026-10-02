"""Manju-style segment planning for Seedance 2.5 multi-shot pipeline.

Each shot stores a ``segment_script`` with production cues and ``@duration`` beats.
Before calling Seedance, durations are expanded to time ranges (00:00-00:04, …).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

SEGMENT_DURATION_MIN = 3
SEGMENT_DURATION_MAX = 12
SHOT_DURATION_MIN = 4
SHOT_DURATION_MAX = 30
# Giới hạn trên của một lần quay video AI khoa học phổ biến: tránh 16–20 giây của một lần quay dẫn đến trì hoãn
KEPU_FULL_SHOT_DURATION_MAX = 12

DURATION_TOKEN_RE = re.compile(r"@duration:(\d+)")
# Tường thuật khoa học phổ biến: Nhanh hơn một cách tự nhiên; truyện tranh vẫn sử dụng tiền tố chậm (xem drama/build_fragments)
NARRATION_PREFIX = "【旁白·自然语速·同步字幕】"
LEGACY_NARRATION_PREFIX = "【旁白·慢速清晰·同步字幕】"
DIALOGUE_PREFIX = "【对白·慢速清晰·同步字幕】"
VISUAL_PREFIX = "【画面·无配音仅环境音】"
VISUAL_PREFIX_VI = "【Hình ảnh · Không lồng tiếng, chỉ có âm thanh môi trường】"
VISUAL_PREFIX_EN = "【Visual · Ambient sound only, no voiceover】"

VISUAL_PREFIXES = (
    VISUAL_PREFIX,
    VISUAL_PREFIX_VI,
    VISUAL_PREFIX_EN,
    "【画面·无配音仅环境音】",
    "【画面·仅环境音】",
    "【画面·",
    "【Hình ảnh · Không lồng tiếng, chỉ có âm thanh môi trường】",
    "【Hình ảnh · Không lồng tiếng chỉ có âm thanh môi trường】",
    "【Hình ảnh · Chỉ âm thanh môi trường】",
    "【Hình ảnh ·",
    "【Visual · Ambient sound only, no voiceover】",
    "【Visual · Ambient sound only】",
    "【Visual ·",
    "【空镜·可仅环境音与 BGM】",
    "【空镜·",
    "【Cảnh trống·",
    "【Empty shot·",
)

EMPTY_SHOT_PREFIX = "【空镜·可仅环境音与 BGM】"
SUBTITLE_CUE = "【字幕：后期叠旁白字幕，简体中文逐句同步】"
DRAMA_SUBTITLE_CUE = "【字幕：底部居中·简体中文·逐句轮换·与口播同步】"
DRAMA_SUBTITLE_CUE_VI = "【Phụ đề: Căn giữa phía dưới · Tiếng Việt · Luân chuyển từng câu · Đồng bộ lời thoại】"
# Dấu hiệu lịch sử, thay thế thống nhất bằng bản hiện tại trước khi gửi
LEGACY_KEPU_SUBTITLE_CUES = (
    "【字幕：全程简体中文字幕，旁白逐句同步烧录】",
)
LEGACY_DRAMA_SUBTITLE_CUES = (
    "【字幕：底部居中·简体中文·仅标记段落同步】",
    "【字幕：底部居中·简体中文】",
)
DEFAULT_BGM_MOOD = "贴合内容的轻量配乐，情绪平稳，不抢旁白"
DEFAULT_BGM_MOOD_VI = "Nhạc nền nhẹ nhàng phù hợp nội dung, cảm xúc êm đềm, không lấn át lời dẫn"
SEEDANCE_PRODUCTION_SECTION_HEADER = "【Ràng buộc bắt buộc: Âm thanh, Phụ đề và Nhạc nền / 强制约束：音频、字幕与配乐】"

# Thẻ dấu hai chấm trong gương/phong cảnh trống: Nếu văn bản bắt đầu bằng thẻ này thì không được phép lồng tiếng hoặc phụ đề (hỗ trợ nhiều ngôn ngữ)
VISUAL_SHOT_LABEL_RE = re.compile(
    r"^(?:"
    r"空镜|画面|远景|近景|中景|全景|特写|大特写|"
    r"跟拍|俯拍|仰拍|航拍|推镜|拉镜|摇镜|环境|镜头|动作|转场|闪回|"
    r"建立镜头|气氛镜头|"
    r"Cảnh|Cảnh trống|Toàn cảnh|Cận cảnh|Trung cảnh|Đặc tả|Đại đặc tả|"
    r"Góc quay|Góc rộng|Góc nhìn|Theo dõi|Từ trên xuống|Từ dưới lên|Quay trên không|"
    r"Đẩy máy|Kéo máy|Lướt máy|Môi trường|Hành động|Chuyển cảnh|Hồi tưởng|Khung hình|"
    r"Visual|Shot|Wide shot|Close-up|Extreme close-up|Medium shot|Pan|Tilt|Zoom"
    r")\s*[：:]",
    re.IGNORECASE,
)
VOICE_CUE_PREFIX_RE = re.compile(
    r"^【(?:对白|旁白|内心独白|Thoại|Lời dẫn|Độc thoại nội tâm|Dialogue|Narration|Monologue)[^】]*】\s*",
    re.IGNORECASE,
)
# Vai trò (võ, xuống). ---Chỉ hướng dẫn sân khấu, không có lời thoại
STAGE_ONLY_SPEAKER_RE = re.compile(
    r"^(?P<speaker>[^：:\n（(\s]{1,16})"
    r"[（(](?P<paren>[^）)]+)[）)]\s*[。．.…]?\s*$"
)
# vai trò: dòng / vai trò (vo): dòng
SPEAKER_DIALOGUE_RE = re.compile(
    r"^(?P<speaker>[^：:\n（(\s]{1,16})"
    r"(?P<paren>[（(][^）)]+[）)])?"
    r"\s*[：:]\s*(?P<text>.+)$"
)
GENERIC_NARRATOR_NAMES = frozenset({
    "旁白", "解说", "narrator", "旁白a", "旁白b", "vo", "os",
    "lời dẫn", "người dẫn", "thuyết minh", "voiceover",
})
_TIME_OR_DURATION_PREFIX_RE = re.compile(
    r"^(?:@duration:\d+|\d{2}:\d{2}-\d{2}:\d{2})\s*"
)

PRODUCTION_META_PREFIXES = (
    "【字幕",
    "【Phụ đề",
    "【Subtitle",
    "【BGM",
    "【Nhạc nền",
    "【Music",
    "【配乐",
    "【人物介绍",
    "【Giới thiệu nhân vật",
    "【Character intro",
    "【片头",
    "【Đầu phim",
    "【Intro",
    "【背景介绍",
    "【Giới thiệu bối cảnh",
    "【Background",
    "【强制约束",
    "【Ràng buộc",
    "【Constraints",
)


def is_production_meta_line(line: str) -> bool:
    stripped = (line or "").strip()
    return any(stripped.startswith(prefix) for prefix in PRODUCTION_META_PREFIXES)


def _strip_voice_cue_prefix(line: str) -> str:
    # Bỏ tiền tố đối thoại/tường thuật/độc thoại nội tâm
    return VOICE_CUE_PREFIX_RE.sub("", (line or "").strip()).strip()


def is_visual_description_body(text: str) -> bool:
    # Xác định xem văn bản có phải là mô tả hình ảnh/cảnh trống thuần túy hay không (không bao gồm ý định lồng tiếng, hỗ trợ thẻ đa ngôn ngữ)
    body = _strip_voice_cue_prefix(text or "").strip()
    body = re.sub(r"^【(?:画面|空镜|Hình ảnh|Cảnh trống|Visual|Shot)[^】]*】\s*", "", body, flags=re.IGNORECASE).strip()
    if not body:
        return False
    if VISUAL_SHOT_LABEL_RE.match(body):
        return True
    if (
        body.startswith("空镜")
        or body.startswith("Cảnh trống")
        or body.startswith("△")
        or body.startswith("Δ")
    ):
        return True
    return False


def normalize_kepu_subtitle_cue(content: str) -> str:
    """Hợp nhất các tín hiệu phụ đề lịch sử khoa học phổ biến thành "phụ đề tường thuật sau chồng"."""
    text = content or ""
    for old in LEGACY_KEPU_SUBTITLE_CUES:
        if old in text:
            text = text.replace(old, SUBTITLE_CUE)
    return text


def normalize_drama_subtitle_cue(content: str) -> str:
    """Thống nhất các tín hiệu phụ đề lịch sử vào bản sao "xoay từng câu" hiện tại."""
    text = content or ""
    for old in LEGACY_DRAMA_SUBTITLE_CUES:
        if old in text:
            text = text.replace(old, DRAMA_SUBTITLE_CUE)
    return text


def normalize_character_intro_cue(content: str) -> str:
    """Thống nhất các gợi ý giới thiệu nhân vật lịch sử vào vị trí “cạnh nhân vật”."""
    # Nhìn về phía trước tiêu cực: Đây là sự thay thế thứ hai của "·Bên cạnh nhân vật"
    return re.sub(
        r"【人物介绍·画面叠字】(?!·角色身旁)",
        "【人物介绍·画面叠字·角色身旁】",
        content or "",
    )


def is_generic_narrator_name(name: str) -> bool:
    """Tên của giọng nói ngôi thứ ba như người kể chuyện/bình luận viên chứ không phải nhân vật xuất hiện trong cảnh."""
    return (name or "").strip().lower() in GENERIC_NARRATOR_NAMES


def paren_voice_kind(paren: str) -> str:
    """Kiểu phát thanh trong ngoặc: os/vo/other. Phân tách các từ bằng dấu phẩy để tránh cận cảnh đánh os."""
    for part in re.split(r"[,，、/\s]+", (paren or "").strip()):
        token = part.strip().strip("（）()").lower()
        if token in {"os"}:
            return "os"
        if token in {"vo", "旁白"}:
            return "vo"
    return "other"


def classify_voice_body(body: str) -> str:
    """Phân loại văn bản truyền miệng: hình ảnh/đối thoại/nội tâm/tường thuật/lưu giữ."""
    text = (body or "").strip()
    if not text:
        return "keep"
    if VISUAL_SHOT_LABEL_RE.match(text) or text.startswith("空镜") or text.startswith("△"):
        return "visual"
    stage = STAGE_ONLY_SPEAKER_RE.match(text)
    if stage and not is_generic_narrator_name(stage.group("speaker")):
        if paren_voice_kind(stage.group("paren")) == "os":
            return "inner"
        return "visual"
    spoken = SPEAKER_DIALOGUE_RE.match(text)
    if spoken:
        speaker = spoken.group("speaker").strip()
        if VISUAL_SHOT_LABEL_RE.match(f"{speaker}："):
            return "visual"
        if is_generic_narrator_name(speaker):
            return "narration"
        if paren_voice_kind(spoken.group("paren") or "") == "os":
            return "inner"
        return "dialogue"
    return "keep"


def _dialogue_prefix_like(src_prefix: str) -> str:
    """Tạo tín hiệu hội thoại dựa trên việc tiền tố gốc có chứa "phụ đề được đồng bộ hóa" hay không."""
    if "同步字幕" in (src_prefix or ""):
        return DIALOGUE_PREFIX
    return "【对白·慢速清晰】"


def rewrite_character_vo_voice_lines(content: str) -> str:
    """Thay đổi lời thoại khi ký tự VO bị đánh dấu nhầm là tường thuật; thay đổi màn hình theo hướng sân khấu thuần túy (vo, cảm xúc); thêm tiền tố vào các dòng không được đánh dấu."""
    out: list[str] = []
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if not line or line.startswith("@duration:") or is_production_meta_line(line):
            out.append(raw)
            continue
        if line.startswith("【画面") or line.startswith("【空镜"):
            out.append(raw)
            continue
        match = VOICE_CUE_PREFIX_RE.match(line)
        prefix = match.group(0) if match else ""
        body = line[len(prefix) :].strip() if match else line
        kind = classify_voice_body(body)
        if kind == "visual":
            if prefix.startswith("【画面"):
                out.append(raw)
            else:
                out.append(f"{VISUAL_PREFIX}{body}")
            continue
        if kind == "dialogue" and not prefix.startswith("【对白"):
            out.append(f"{_dialogue_prefix_like(prefix)}{body}")
            continue
        if kind == "inner" and not prefix.startswith("【内心独白"):
            inner = "【内心独白·同步字幕】" if "同步字幕" in prefix else "【内心独白】"
            out.append(f"{inner}{body}")
            continue
        if kind == "narration" and not prefix.startswith("【旁白"):
            out.append(f"【旁白·慢速清晰】{body}")
            continue
        out.append(raw)
    return "\n".join(out)


def normalize_cues_for_seedance(content: str) -> str:
    """Chuẩn hóa thẻ tín hiệu sản xuất tiếng Việt/tiếng Anh thành thẻ tiếng Trung tiêu chuẩn được ByteDance Seedance công nhận,
    保证 Seedance 2.5 模型精准识别【画面·无配音仅环境音】等指令，不把画面描写当口播念出。
    """
    if not content:
        return content or ""
    out: list[str] = []
    for raw in content.replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if not line:
            out.append(raw)
            continue
        # tín hiệu màn hình
        if (
            line.startswith("【Hình ảnh")
            or line.startswith("【Visual")
            or line.startswith("【Cảnh trống")
        ):
            cue_body = re.sub(
                r"^【(?:Hình ảnh|Visual|Cảnh trống)[^】]*】\s*",
                "",
                line,
                flags=re.IGNORECASE,
            ).strip()
            out.append(f"{VISUAL_PREFIX}{cue_body}")
            continue
        # Gợi ý đối thoại
        if line.startswith("【Thoại") or line.startswith("【Dialogue"):
            cue_body = re.sub(
                r"^【(?:Thoại|Dialogue)[^】]*】\s*",
                "",
                line,
                flags=re.IGNORECASE,
            ).strip()
            out.append(f"{DIALOGUE_PREFIX}{cue_body}")
            continue
        # Tín hiệu của người kể chuyện
        if line.startswith("【Lời dẫn") or line.startswith("【Narration"):
            cue_body = re.sub(
                r"^【(?:Lời dẫn|Narration)[^】]*】\s*",
                "",
                line,
                flags=re.IGNORECASE,
            ).strip()
            out.append(f"{NARRATION_PREFIX}{cue_body}")
            continue
        # Tín hiệu độc thoại nội tâm
        if line.startswith("【Độc thoại nội tâm") or line.startswith("【Monologue"):
            cue_body = re.sub(
                r"^【(?:Độc thoại nội tâm|Monologue)[^】]*】\s*",
                "",
                line,
                flags=re.IGNORECASE,
            ).strip()
            out.append(f"【内心独白·同步字幕】{cue_body}")
            continue
        # tín hiệu phụ đề
        if line.startswith("【Phụ đề") or line.startswith("【Subtitle"):
            out.append(DRAMA_SUBTITLE_CUE)
            continue
        # BGM / Nhạc nền cue
        if line.startswith("【Nhạc nền：") or line.startswith("【Nhạc nền:"):
            mood = re.sub(r"^【Nhạc nền[：:]\s*", "", line).removesuffix("】").strip()
            out.append(f"【BGM：{mood}】")
            continue
        if line.startswith("【BGM:"):
            mood = re.sub(r"^【BGM:\s*", "", line).removesuffix("】").strip()
            out.append(f"【BGM：{mood}】")
            continue
        out.append(raw)
    return "\n".join(out)


def rewrite_misclassified_visual_voice_lines(content: str) -> str:
    """
    纠正「空镜：…」等被误打成对白/Tiền tố tường thuật的行。
    供 Seedance 提交前兜底，使旧分镜也能按画面-only 约束生成。
    """
    text = normalize_character_intro_cue(normalize_drama_subtitle_cue(content))
    text = normalize_cues_for_seedance(text)
    out: list[str] = []
    for raw in text.replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if not line:
            out.append(raw)
            continue
        if line.startswith("@duration:") or is_production_meta_line(line):
            out.append(raw)
            continue
        if VOICE_CUE_PREFIX_RE.match(line) and is_visual_description_body(line):
            body = _strip_voice_cue_prefix(line)
            out.append(f"{VISUAL_PREFIX}{body}")
            continue
        out.append(raw)
    return rewrite_character_vo_voice_lines("\n".join(out))


def script_has_narration_cue(content: str) -> bool:
    """Phát hiện xem tập lệnh có chứa tín hiệu tường thuật hay không (bỏ qua các dòng siêu dữ liệu như phụ đề/BGM)."""
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if not line or line.startswith("@duration:") or is_production_meta_line(line):
            continue
        if is_visual_description_body(line):
            continue
        if (
            NARRATION_PREFIX in line
            or line.startswith("【旁白")
            or line.startswith("【Lời dẫn")
            or line.startswith("【Narration")
        ):
            return True
    return False


def script_has_dialogue_cue(content: str) -> bool:
    """Kiểm tra xem kịch bản có chứa tín hiệu hội thoại hay không."""
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if not line or line.startswith("@duration:") or is_production_meta_line(line):
            continue
        if is_visual_description_body(line):
            continue
        if (
            DIALOGUE_PREFIX in line
            or line.startswith("【对白")
            or line.startswith("【Thoại")
            or line.startswith("【Dialogue")
        ):
            return True
    return False


def script_is_drama_mixed(segment_script: str) -> bool:
    """Diễn tập kết hợp giữa truyện tranh và kịch: mô tả cảnh + phân đoạn hội thoại/tường thuật, thay vì tường thuật toàn cảnh."""
    content = segment_script or ""
    if script_has_visual_only_cue(content):
        return True
    if script_has_dialogue_cue(content):
        return True
    if DRAMA_SUBTITLE_CUE in content or DRAMA_SUBTITLE_CUE_VI in content:
        return True
    if "仅标记段落同步" in content:
        return True
    if "逐句轮换" in content or "Luân chuyển từng câu" in content:
        return True
    if "对白旁白同步" in content or "Đồng bộ lời thoại" in content:
        return True
    return False


def script_has_visual_only_cue(content: str) -> bool:
    """Kiểm tra xem tập lệnh có chứa tín hiệu mô tả cảnh hay không (kết hợp hài kịch)"""
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if (
            any(line.startswith(pfx) for pfx in VISUAL_PREFIXES)
            or line.startswith("【画面")
            or line.startswith("【Hình ảnh")
            or line.startswith("【Visual")
            or line.startswith("【空镜")
            or line.startswith("【Cảnh trống")
            or EMPTY_SHOT_PREFIX in line
            or is_visual_description_body(line)
        ):
            return True
    return False

BGM_MOOD_KEYWORDS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"紧张|危机|压迫|悬疑"), "低沉紧张、鼓点渐强，烘托压迫感，音量低于人声"),
    (re.compile(r"温暖|人文|故事|情感"), "温暖人文、钢琴弦乐铺底，音量低于人声"),
    (re.compile(r"赛博|科技|未来|霓虹"), "轻电子氛围，克制不抢戏，音量低于人声"),
    (re.compile(r"开源|产品|工作|工位|配置|部署"), "轻快专业、干净电子铺底，音量低于人声"),
    (re.compile(r"史诗|奇幻|宏大"), "史诗弦乐铺底，气势克制，音量低于人声"),
]


@dataclass
class SegmentBeat:
    duration: int
    kind: str  # visual | narration | action
    text: str


def suggested_kepu_shot_range(source_text: str, *, pipeline_mode: str = "full") -> tuple[int, int]:
    """Đưa ra phạm vi số lượng bảng phân cảnh khoa học phổ biến dựa trên số từ trong bản sao (chế độ đầy đủ ưu tiên nhiều cảnh quay và cảnh quay ngắn)."""
    # n Số lượng từ sau khi loại bỏ khoảng trắng, dùng để phân loại tài liệu ngắn/trung bình/dài
    n = len(re.sub(r"\s+", "", source_text or ""))
    if pipeline_mode == "image_text":
        if n < 180:
            return 5, 8
        if n < 400:
            return 6, 10
        return 8, 10
    if n < 180:
        return 6, 8
    if n < 400:
        return 7, 10
    return 8, 10


def clamp_segment_duration(seconds: float | int) -> int:
    return int(max(SEGMENT_DURATION_MIN, min(int(round(float(seconds))), SEGMENT_DURATION_MAX)))


def clamp_shot_total(
    seconds: float | int, *, lo: int = SHOT_DURATION_MIN, hi: int = SHOT_DURATION_MAX
) -> int:
    return int(max(lo, min(int(round(float(seconds))), hi)))


def estimate_narration_duration(text: str) -> int:
    """Khoảng 4,5–5 từ/giây (khoa học đại chúng đương nhiên thích phát sóng nhanh hơn); được kẹp vào một phạm vi thời lượng phân đoạn duy nhất."""
    clean = re.sub(r"\s+", "", (text or "").strip())
    clean = re.sub(r"^【[^】]*】", "", clean).strip()
    if not clean:
        return SEGMENT_DURATION_MIN
    # (n + 4) // 5 ≈ 5 từ/giây, chừa lại nửa nhịp để thở
    secs = max(SEGMENT_DURATION_MIN, int((len(clean) + 4) // 5) + 1)
    return clamp_segment_duration(secs)


def estimate_visual_duration(text: str) -> int:
    clean = (text or "").strip()
    if not clean:
        return SEGMENT_DURATION_MIN
    if len(clean) < 20:
        return SEGMENT_DURATION_MIN
    if len(clean) < 50:
        return 4
    return clamp_segment_duration(6)


def infer_bgm_mood(*hints: str) -> str:
    blob = "\n".join(h for h in hints if h).strip()
    if not blob:
        return DEFAULT_BGM_MOOD
    for pattern, mood in BGM_MOOD_KEYWORDS:
        if pattern.search(blob):
            return mood
    return DEFAULT_BGM_MOOD


def _strip_time_or_duration_prefix(line: str) -> str:
    """Xóa @duration:N hoặc 00:00-00:07 ở đầu dòng để dễ dàng xác định [nhạc phim]."""
    return _TIME_OR_DURATION_PREFIX_RE.sub("", (line or "").strip()).strip()


def parse_peiyue_mood(line: str) -> str:
    """Phân tích [Nhạc phim]｜Guitar acoustic... hoặc [Nhạc phim:...]."""
    text = _strip_time_or_duration_prefix(line)
    if not text.startswith("【配乐"):
        return ""
    if text.startswith("【配乐：") or text.startswith("【配乐:"):
        inner = text.split("】", 1)[0]
        sep = "：" if "：" in inner else ":"
        return inner.split(sep, 1)[-1].strip()
    rest = text.split("】", 1)[-1].lstrip(" |｜:：").strip()
    return rest.removesuffix("】").strip()


def script_bgm_mood(segment_script: str) -> str:
    """Lấy nhạc nền từ [BGM:], [Nhạc nền:] hoặc [Nhạc]; nếu không, hãy suy ra từ văn bản."""
    for raw in (segment_script or "").replace("\r\n", "\n").split("\n"):
        line = _strip_time_or_duration_prefix(raw)
        if line.startswith("【BGM：") or line.startswith("【BGM:"):
            mood = re.sub(r"^【BGM[：:]\s*", "", line).removesuffix("】").strip()
            if mood:
                return mood
        if line.startswith("【Nhạc nền：") or line.startswith("【Nhạc nền:"):
            mood = re.sub(r"^【Nhạc nền[：:]\s*", "", line).removesuffix("】").strip()
            if mood:
                return mood
        peiyue = parse_peiyue_mood(raw)
        if peiyue:
            return peiyue
    return infer_bgm_mood(segment_script)


def build_production_cues(bgm_mood: str) -> list[str]:
    mood = (bgm_mood or "").strip() or DEFAULT_BGM_MOOD
    if "音量低于人声" not in mood:
        mood = f"{mood}，音量低于人声"
    return [SUBTITLE_CUE, f"【BGM：后期混音 · {mood}】"]


# Chế độ hậu phụ đề: Loại bỏ tiền tố Cue/"phụ đề đồng bộ" trước khi gửi để tránh trường hợp mô hình vẫn cháy màn hình theo ký tự.
_POST_SUBTITLE_PREFIX_MAP = (
    ("【对白·慢速清晰·同步字幕】", "【对白·慢速清晰】"),
    ("【旁白·慢速清晰·同步字幕】", "【旁白·慢速清晰】"),
    ("【旁白·自然语速·同步字幕】", "【旁白·自然语速】"),
    ("【内心独白·同步字幕】", "【内心独白】"),
)


def strip_model_burn_subtitle_cues(content: str) -> str:
    """Xóa lời nhắc phụ đề để ghi mô hình và giữ lại đoạn hội thoại/tường thuật (để phủ lên sau)."""
    out: list[str] = []
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        stripped = raw.strip()
        if not stripped:
            out.append(raw)
            continue
        if stripped.startswith("【字幕"):
            continue
        line = stripped
        for src, dest in _POST_SUBTITLE_PREFIX_MAP:
            if line.startswith(src):
                line = dest + line[len(src) :]
                break
        out.append(line)
    return "\n".join(out).replace("\n\n\n", "\n\n").strip()


# Tắt chế độ giới thiệu nhân vật: bỏ gợi ý chữ chồng bên cạnh nhân vật tránh trường hợp người mẫu vẫn ấn thẻ từ làm cháy màn hình
def strip_character_intro_cues(content: str) -> str:
    out: list[str] = []
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        stripped = raw.strip()
        if stripped.startswith("【人物介绍"):
            continue
        out.append(raw)
    return "\n".join(out).replace("\n\n\n", "\n\n").strip()


def build_seedance_production_section(
    segment_script: str,
    *,
    ambient_only: bool = False,
    burn_subtitles: bool = True,
    character_intro: bool = True,
) -> str:
    """Lắp ráp các ràng buộc bắt buộc về âm thanh/phụ đề/BGM của Seedance (tường thuật khoa học phổ biến/cảnh truyện tranh + sắp xếp hỗn hợp hội thoại).

    ambient_only：科普后期 TTS 模式——模型只出操作环境音，禁止口播与 BGM。
    burn_subtitles=False：成片后再烧 SRT——保留口播，禁止画面内字幕。
    character_intro=False：禁止人物介绍叠字/字卡（与字幕开关独立）。
    """
    if ambient_only:
        lines = [
            "1. Lồng tiếng / 配音: Lời thoại cảnh này do TTS bên ngoài thực hiện; video nghiêm cấm mọi lời dẫn, đối thoại, giải thích, ngân nga hay giọng người.",
            "2. Phụ đề / 字幕: Nghiêm cấm ghi phụ đề, tiêu đề, watermark hoặc chữ lời thoại vào trong hình ảnh.",
            "3. Nhạc nền / 背景音乐: Nghiêm cấm mọi BGM, nhạc đệm, giai điệu hoặc nhạc nền ngân nga.",
            "4. Hiệu ứng âm thanh / 音效: Bắt buộc tạo âm thanh môi trường thao tác đồng bộ với hình ảnh (gõ phím, click chuột, chuyển giao diện, tiếng ồn văn phòng nhẹ); âm lượng tiết chế, không lấn át tiếng người (tiếng người sẽ ghép vào sau).",
        ]
        return f"{SEEDANCE_PRODUCTION_SECTION_HEADER}\n" + "\n".join(lines)

    has_vo = script_has_narration_cue(segment_script)
    has_dialogue = script_has_dialogue_cue(segment_script)
    drama_mixed = script_is_drama_mixed(segment_script)
    bgm_mood = script_bgm_mood(segment_script)

    if "âm lượng thấp hơn giọng người" not in bgm_mood and "音量低于人声" not in bgm_mood:
        bgm_mood = f"{bgm_mood}，âm lượng thấp hơn giọng người"

    # Phụ đề hậu kỳ: phát sóng bằng miệng được giữ lại và không được phép có văn bản trên màn hình (phụ đề được chuyển giao cho biên tập/xuất SRT)
    no_burn = (
        "Nghiêm cấm ghi phụ đề, tiêu đề, watermark, thẻ chữ hoặc chữ lời thoại vào trong hình ảnh; "
        "lời thoại chỉ phát ra tiếng, phần chữ phụ đề do khâu hậu kỳ thực hiện."
    )

    if drama_mixed:
        lines = [
            "1. Phạm vi lồng tiếng / 配音范围: Chỉ các đoạn đánh dấu 【Lời dẫn / 旁白·…】【Đối thoại / 对白·…】 mới cần lồng tiếng; "
            "các đoạn 【Hình ảnh / 画面·…】 hoặc không có tiền tố lồng tiếng là miêu tả hình ảnh/hành động, chỉ thể hiện thị giác và âm thanh môi trường, "
            "nghiêm cấm tạo lồng tiếng, nghiêm cấm in phụ đề, nghiêm cấm đọc to miêu tả hình ảnh.",
            "2. Tốc độ nói / 语速: Lời dẫn/đối thoại có tốc độ nói tự nhiên hơi chậm, phát âm rõ ràng, có nhịp thở và ngắt nghỉ; nghiêm cấm nói vội, đẩy nhanh tốc độ.",
            (
                f"3. Phụ đề / 字幕: {no_burn}"
                if not burn_subtitles
                else (
                    "3. Phụ đề / 字幕: Chỉ nội dung lồng tiếng 【Lời dẫn / 旁白·…】【Đối thoại / 对白·…】 mới ghi phụ đề (theo ngôn ngữ gốc của lời thoại như Tiếng Việt / 中文), căn giữa phía dưới; "
                    "tại một thời điểm chỉ hiển thị một dòng (một câu), luân chuyển từng câu theo tiến độ lời thoại, nghiêm cấm xếp kín toàn bộ hội thoại lên màn hình; "
                    "nghiêm cấm lặp từ, nói lắp; phụ đề phải khớp từng chữ với câu đang nói; phần miêu tả hình ảnh không xuất hiện phụ đề."
                )
            ),
        ]
        if has_vo:
            lines.append(
                "4. Lời dẫn / 旁白: Đoạn 【Lời dẫn / 旁白·…】 lồng tiếng ngôi thứ ba chậm rãi rõ ràng; "
                + ("chỉ phát tiếng, hình ảnh không chèn phụ đề." if not burn_subtitles else "phụ đề luân chuyển từng câu, đồng bộ với câu thoại hiện tại.")
            )
        elif has_dialogue:
            lines.append(
                "4. Đối thoại / 对白: Đoạn 【Đối thoại / 对白·…】 lồng tiếng theo nhân vật; "
                + (
                    "chỉ phát tiếng, hình ảnh không chèn phụ đề; khi không có đánh dấu đối thoại thì chỉ giữ âm thanh môi trường."
                    if not burn_subtitles
                    else "phụ đề luân chuyển từng câu, đồng bộ với câu thoại hiện tại; khi không có đánh dấu đối thoại thì chỉ giữ âm thanh môi trường."
                )
            )
        else:
            lines.append(
                "4. Giọng người / 人声: Cảnh này nếu không có đánh dấu lời dẫn/đối thoại thì toàn bộ cảnh không lồng tiếng, chỉ có âm thanh môi trường và BGM."
            )
        lines.append(
            f"5. Nhạc nền / 背景音乐: {bgm_mood}; âm lượng BGM thấp hơn giọng người khoảng 30%."
        )
        lines.append(
            "6. Hiệu ứng âm thanh / 音效: Âm thanh môi trường và hiệu ứng động tác đồng bộ với hình ảnh, tầng âm lượng thấp hơn giọng người."
        )
        if character_intro and any(k in (segment_script or "") for k in ("【人物介绍", "【Giới thiệu nhân vật", "【giới thiệu nhân vật")):
            lines.append(
                "7. Chữ giới thiệu nhân vật / 人物介绍叠字: 【Giới thiệu nhân vật · Chữ trên hình bên cạnh nhân vật / 人物介绍·画面叠字·角色身旁】 phải gắn sát bên cạnh nhân vật tương ứng "
                "(chữ nhỏ bên vai/bên người), xuất hiện ngắn khi nhân vật lần đầu vào khung hình; "
                "nghiêm cấm tiêu đề lớn chính giữa, nghiêm cấm tranh vị trí phụ đề phía dưới; "
                "nghiêm cấm lồng tiếng đọc toàn văn giới thiệu."
            )
        elif not character_intro:
            lines.append(
                "7. Giới thiệu nhân vật / 人物介绍: Cảnh này nghiêm cấm mọi chữ/thẻ giới thiệu nhân vật; thông tin danh tính không ghi vào khung hình."
            )
        return f"{SEEDANCE_PRODUCTION_SECTION_HEADER}\n" + "\n".join(lines)

    # Chế độ tường thuật khoa học phổ biến: Toàn bộ khung cảnh bị chi phối bởi các phân đoạn tường thuật (tốc độ nói nhanh tự nhiên để tránh bị trì hoãn)
    lines = [
        "1. Tốc độ nói / 语速: Lời dẫn có tốc độ nói tự nhiên hơi nhanh, phát âm rõ ràng, nhịp điệu gọn gàng có nhịp thở; "
        "tránh cố ý nói quá chậm hoặc dừng quá lâu; không ép tốc độ đến mức nuốt chữ và không tăng tốc độ phát video.",
        (
            f"2. Phụ đề / 字幕: {no_burn}"
            if not burn_subtitles
            else (
                "2. Phụ đề / 字幕: In phụ đề toàn bộ cảnh (theo ngôn ngữ gốc của lời thoại như Tiếng Việt / 中文), vị trí căn giữa phía dưới, cỡ chữ rõ ràng dễ đọc; "
                "lời dẫn hiển thị đồng bộ từng câu, phụ đề khớp hoàn toàn với lời nói."
            )
        ),
    ]
    if has_vo:
        lines.append(
            "3. Lời dẫn / 旁白: Khi kịch bản có đoạn lời dẫn thì lồng tiếng ngôi thứ ba, điềm tĩnh rõ ràng, tốc độ tự nhiên; "
            "trong video không tự ý thêm các đoạn đối thoại ồn ào; "
            + ("lời thoại chỉ phát tiếng, màn hình không in phụ đề." if not burn_subtitles else "khi lời dẫn xuất hiện thì phụ đề hiển thị toàn văn đồng bộ.")
        )
    else:
        lines.append(
            "3. Lời dẫn / 旁白: Nếu kịch bản có đánh dấu lời dẫn, lồng tiếng ngôi thứ ba tự nhiên rõ ràng"
            + ("; lời thoại chỉ phát tiếng, màn hình không in phụ đề;" if not burn_subtitles else ", đồng thời in phụ đề đồng bộ;")
            + " trong video không tự ý thêm đối thoại ồn ào."
        )
    lines.append(
        f"4. Nhạc nền / 背景音乐: {bgm_mood}; âm lượng BGM thấp hơn giọng người khoảng 30%, không lấn át lời dẫn và âm hiệu then chốt."
    )
    lines.append(
        "5. Hiệu ứng âm thanh / 音效: Âm thanh môi trường và hiệu ứng động tác đồng bộ với hình ảnh, tầng âm lượng thấp hơn giọng người."
    )
    return f"{SEEDANCE_PRODUCTION_SECTION_HEADER}\n" + "\n".join(lines)


def format_segment_line(kind: str, text: str) -> str:
    clean = (text or "").strip()
    if not clean:
        return ""
    if clean.startswith("【"):
        return clean
    k = (kind or "visual").strip().lower()
    if k in {"narration", "vo", "旁白"}:
        return f"{NARRATION_PREFIX}{clean}"
    return clean


def extract_durations(content: str) -> list[int]:
    out: list[int] = []
    for match in DURATION_TOKEN_RE.finditer(content or ""):
        secs = int(match.group(1))
        if secs > 0:
            out.append(secs)
    return out


def sum_duration(content: str) -> int:
    return sum(extract_durations(content))


def replace_duration_with_time_ranges(content: str) -> str:
    elapsed = 0

    def _repl(match: re.Match[str]) -> str:
        nonlocal elapsed
        secs = int(match.group(1))
        if secs <= 0:
            return " "
        start = elapsed
        end = elapsed + secs
        elapsed = end
        return f"{_fmt_ts(start)}-{_fmt_ts(end)}"

    return DURATION_TOKEN_RE.sub(_repl, content or "")


def _fmt_ts(seconds: int) -> str:
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes:02d}:{secs:02d}"


def narration_from_script(content: str) -> str:
    lines: list[str] = []
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if (
            not line
            or line.startswith("@duration:")
            or line.startswith("【字幕")
            or line.startswith("【BGM")
        ):
            continue
        if NARRATION_PREFIX in line or "旁白" in line[:20]:
            text = re.sub(r"^【[^】]*】", "", line).strip()
            if text:
                lines.append(text)
    return "".join(lines) if lines else ""


def first_visual_prompt(content: str) -> str:
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if (
            not line
            or line.startswith("@duration:")
            or line.startswith("【字幕")
            or line.startswith("【BGM")
        ):
            continue
        if NARRATION_PREFIX in line or line.startswith("【旁白"):
            continue
        cleaned = re.sub(r"^【[^】]*】", "", line).strip()
        if cleaned:
            return cleaned
    for raw in (content or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if line and not line.startswith("@") and not line.startswith("【字幕") and not line.startswith("【BGM"):
            return re.sub(r"^【[^】]*】", "", line).strip()
    return ""


def _is_narration_script_line(line: str) -> bool:
    """Xác định xem dòng kịch bản có phải là lời tường thuật hay không (bao gồm tiền tố cũ và tiền tố mới); mặc dù gợi ý phụ đề có chứa từ "tường thuật" nhưng nó không được tính."""
    stripped = (line or "").strip()
    if not stripped or stripped.startswith("【字幕") or stripped.startswith("【BGM"):
        return False
    return stripped.startswith("【旁白") or NARRATION_PREFIX in stripped or LEGACY_NARRATION_PREFIX in stripped


def replace_narration_in_script(content: str, narration: str) -> str:
    """Viết lời tường thuật trong cửa sổ bật lên chỉnh sửa quay lại phần tường thuật của kịch bản. Việc lồng tiếng và quay phim phải tuân theo kịch bản."""
    text = (narration or "").strip()
    lines = (content or "").replace("\r\n", "\n").split("\n")
    out: list[str] = []
    replaced = False
    for raw in lines:
        stripped = raw.strip()
        if text and _is_narration_script_line(stripped) and not replaced:
            prefix_m = re.match(r"^(【[^】]*】)\s*", stripped)
            prefix = prefix_m.group(1) if prefix_m else NARRATION_PREFIX
            out.append(f"{prefix}{text}")
            replaced = True
            continue
        out.append(raw.rstrip())
    if text and not replaced:
        dur = estimate_narration_duration(text)
        out.append(f"@duration:{dur}")
        out.append(f"{NARRATION_PREFIX}{text}")
    return "\n".join(out).strip()


def replace_first_visual_in_script(content: str, visual: str) -> str:
    """Viết khung hình đầu tiên trong cửa sổ bật lên chỉnh sửa trở lại đoạn trực quan đầu tiên của tập lệnh."""
    text = (visual or "").strip()
    if not text:
        return (content or "").strip()
    lines = (content or "").replace("\r\n", "\n").split("\n")
    out: list[str] = []
    replaced = False
    # Cue_end Điểm chèn sau dòng phụ đề/BGM
    cue_end = 0
    for i, raw in enumerate(lines):
        stripped = raw.strip()
        if stripped.startswith("【字幕") or stripped.startswith("【BGM") or not stripped:
            cue_end = i + 1
            continue
        break
    for i, raw in enumerate(lines):
        stripped = raw.strip()
        if (
            not replaced
            and stripped
            and not stripped.startswith("@duration:")
            and not stripped.startswith("【字幕")
            and not stripped.startswith("【BGM")
            and not _is_narration_script_line(stripped)
        ):
            out.append(text)
            replaced = True
            continue
        out.append(raw.rstrip())
    if not replaced:
        insert_at = min(cue_end, len(out))
        extra = [f"@duration:{SEGMENT_DURATION_MIN}", text]
        out = out[:insert_at] + extra + out[insert_at:]
    return "\n".join(out).strip()


def build_segment_script(
    beats: list[SegmentBeat],
    *,
    bgm_mood: str,
    max_total: int = SHOT_DURATION_MAX,
) -> str:
    lines = build_production_cues(bgm_mood)
    used = 0
    for beat in beats:
        text = format_segment_line(beat.kind, beat.text)
        if not text:
            continue
        if beat.kind in {"narration", "vo", "旁白"}:
            dur = clamp_segment_duration(beat.duration or estimate_narration_duration(beat.text))
        else:
            dur = clamp_segment_duration(beat.duration or estimate_visual_duration(beat.text))
        if used + dur > max_total:
            dur = max_total - used
            if dur < SEGMENT_DURATION_MIN:
                break
        lines.append(f"@duration:{dur}")
        lines.append(text)
        used += dur
        if used >= max_total:
            break
    if used == 0:
        lines.append(f"@duration:{SEGMENT_DURATION_MIN}")
        lines.append("画面轻微动态，保持主体稳定")
    return "\n".join(lines).strip()


def parse_beats_from_llm_shot(item: dict[str, Any], narration_fallback: str = "") -> list[SegmentBeat]:
    """Accept either segments[] or legacy flat text/img_prompt/video_prompt."""
    beats: list[SegmentBeat] = []
    segs = item.get("segments")
    if isinstance(segs, list) and segs:
        for seg in segs:
            if not isinstance(seg, dict):
                continue
            kind = str(seg.get("kind") or seg.get("type") or "visual").strip().lower()
            text = str(seg.get("text") or seg.get("content") or "").strip()
            if not text:
                continue
            raw_dur = seg.get("duration")
            if kind in {"narration", "vo", "旁白"}:
                # est được ước tính dựa trên số lượng từ; giá trị LLM được giới hạn ở [est, est+1] và không được phép điền toàn bộ câu ngắn.
                est = estimate_narration_duration(text)
                if raw_dur:
                    given = int(raw_dur)
                    dur = max(est, min(given, est + 1))
                else:
                    dur = est
            else:
                dur = int(raw_dur) if raw_dur else estimate_visual_duration(text)
            beats.append(
                SegmentBeat(duration=clamp_segment_duration(dur), kind=kind, text=text)
            )
        return beats

    img = str(item.get("img_prompt") or item.get("visual") or "").strip()
    video = str(item.get("video_prompt") or "").strip()
    text = str(item.get("text") or item.get("audio_text") or narration_fallback or "").strip()
    camera = str(item.get("camera") or "").strip()

    if img:
        beats.append(SegmentBeat(duration=estimate_visual_duration(img), kind="visual", text=img))
    elif video:
        visual = video if not camera else f"{video}，运镜：{camera}"
        beats.append(SegmentBeat(duration=estimate_visual_duration(visual), kind="visual", text=visual))
    if text:
        beats.append(
            SegmentBeat(duration=estimate_narration_duration(text), kind="narration", text=text)
        )
    if not beats and video:
        beats.append(SegmentBeat(duration=4, kind="action", text=video))
    return beats


def seedance_timeline_without_voice(segment_script: str) -> str:
    """Dòng thời gian giữ nguyên màn hình; các dòng tường thuật/phụ đề/BGM được thay đổi thành âm thanh môi trường vận hành mà không phát giọng nói để tránh đọc mô hình."""
    last_visual = "工位操作，手部点击界面，保持主体稳定"
    out: list[str] = []
    for raw in (segment_script or "").replace("\r\n", "\n").split("\n"):
        stripped = raw.strip()
        if stripped.startswith("【字幕") or stripped.startswith("【BGM"):
            continue
        if _is_narration_script_line(stripped):
            out.append(
                f"【画面·无配音仅环境音】{last_visual}；"
                "持续键盘、点击、界面操作音效，禁止人声禁止配乐禁止字幕"
            )
            continue
        if stripped and not stripped.startswith("@"):
            visual = re.sub(r"^【[^】]*】", "", stripped).strip()
            if visual:
                last_visual = visual
        out.append(raw.rstrip())
    return "\n".join(out).strip()


def build_seedance_prompt(
    segment_script: str,
    *,
    style_prefix: str = "",
    motion_bias: str = "",
    camera: str = "",
    ambient_only: bool = False,
    burn_subtitles: bool = True,
    character_intro: bool = True,
) -> str:
    """Assemble final Seedance text: style lock + production constraints + timed body."""
    parts: list[str] = []
    style = (style_prefix or "").strip()
    if style:
        parts.append(
            "【强制约束：视频画面风格】全片画面必须严格遵循以下风格描述，"
            f"严禁偏离或混用其他画风：{style}"
        )
    script_for_rules = segment_script or ""
    if not burn_subtitles and not ambient_only:
        script_for_rules = strip_model_burn_subtitle_cues(script_for_rules)
    if not character_intro and not ambient_only:
        script_for_rules = strip_character_intro_cues(script_for_rules)
    parts.append(
        build_seedance_production_section(
            script_for_rules,
            ambient_only=ambient_only,
            burn_subtitles=burn_subtitles and not ambient_only,
            character_intro=character_intro and not ambient_only,
        )
    )
    parts.append(
        "【强制约束：节奏与画面】严格按时间轴段落演绎画面；"
        "保持主体外形与首帧一致，动作自然。"
    )
    if motion_bias or camera:
        bits = [b for b in (motion_bias.strip(), camera.strip()) if b]
        parts.append("【运镜】" + "；".join(bits))
    body_src = (
        seedance_timeline_without_voice(segment_script)
        if ambient_only
        else script_for_rules
    )
    body = replace_duration_with_time_ranges(body_src)
    parts.append(body.strip())
    return "\n".join(p for p in parts if p).strip()


def resolve_api_duration(
    segment_script: str,
    *,
    fallback: float | int = 8,
    lo: int = SHOT_DURATION_MIN,
    hi: int = SHOT_DURATION_MAX,
) -> int:
    total = sum_duration(segment_script)
    if total <= 0:
        total = int(round(float(fallback)))
    return clamp_shot_total(total, lo=lo, hi=hi)


def apply_segment_script_edit(script: str, *, bgm_mood: str | None = None) -> dict[str, Any]:
    """Normalize an edited script: ensure cues, recompute duration/narration/img."""
    content = normalize_kepu_subtitle_cue((script or "").strip())
    if not content:
        content = build_segment_script(
            [SegmentBeat(duration=4, kind="visual", text="画面轻微动态，保持主体稳定")],
            bgm_mood=bgm_mood or DEFAULT_BGM_MOOD,
        )
    else:
        cues = build_production_cues(bgm_mood or infer_bgm_mood(content))
        body_lines = [
            ln
            for ln in content.splitlines()
            if not ln.strip().startswith("【字幕") and not ln.strip().startswith("【BGM")
        ]
        content = "\n".join(cues + body_lines).strip()
        if not extract_durations(content):
            body = "\n".join(
                ln
                for ln in content.splitlines()
                if not ln.strip().startswith("【字幕") and not ln.strip().startswith("【BGM")
            ).strip()
            content = build_segment_script(
                [
                    SegmentBeat(
                        duration=estimate_narration_duration(body),
                        kind="narration",
                        text=body or "平稳推进",
                    )
                ],
                bgm_mood=bgm_mood or infer_bgm_mood(content),
            )
    return {
        "segment_script": content,
        "duration": float(resolve_api_duration(content)),
        "narration": narration_from_script(content),
        "img_prompt": first_visual_prompt(content),
        "video_prompt": content,
    }
