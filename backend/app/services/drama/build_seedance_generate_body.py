"""Tập hợp nội dung yêu cầu đa phương thức để gửi bảng phân cảnh truyện tranh cho Seedance."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, TypedDict

from app.config import get_settings
from app.services.logical_model_router import resolve_logical_model_id, resolve_upstream_model
from app.models_drama import DramaAsset
from app.services.drama.build_fragments import rewrite_dialogue_action_lines
from app.services.drama.fragment_content_duration import (
    replace_duration_mentions_with_time_ranges,
    resolve_seedance_duration_from_content,
)
from app.services.drama.image_styles import (
    STYLE_BOARD_PROMPT_HINT,
    resolve_image_style_prompt,
)
from app.services.seedance_segments import (
    VOICE_CUE_PREFIX_RE,
    build_seedance_production_section,
    classify_voice_body,
    is_production_meta_line,
    rewrite_misclassified_visual_voice_lines,
    script_has_narration_cue,
    strip_character_intro_cues,
    strip_model_burn_subtitle_cues,
)

ASSET_MENTION_TOKEN_PATTERN = re.compile(r"@asset:(\d+)")
# Chỉ nén khoảng trắng trong dòng và giữ lại các ngắt dòng để Seedance có thể thực hiện theo các đoạn dòng thời gian
INLINE_WHITESPACE_PATTERN = re.compile(r"[^\S\n]+")

SEEDANCE_VISUAL_STYLE_SECTION_INTRO = (
    "【Ràng buộc bắt buộc: Phong cách hình ảnh video / 强制约束：视频画面风格】Toàn bộ hình ảnh video phải tuân thủ nghiêm ngặt mô tả phong cách sau, "
    "nghiêm cấm đi chệch hướng, làm suy yếu hoặc pha trộn phong cách nghệ thuật và thẩm mỹ máy quay khác:"
)
# Âm sắc khó kiểm soát: reference_audio sẽ không được gửi và các ràng buộc về âm sắc sẽ không được viết vào lúc này; việc phát sóng bằng miệng được thực hiện bởi Seedance generate_audio.
# Đã thay đổi về True khi khôi phục ràng buộc/cam kết.
SEEDANCE_ATTACH_REFERENCE_AUDIO = False
SEEDANCE_CHARACTER_VOICE_SECTION_HEADER = (
    "【Ràng buộc bắt buộc: Giọng nhân vật / 强制约束：角色音色】Giọng nói, ngữ điệu, nhịp điệu và chất âm của các nhân vật sau phải khớp chính xác với âm thanh tham chiếu tương ứng, "
    "tốc độ nói tự nhiên hơi chậm, phát âm rõ ràng, nghiêm cấm nói vội, thay thế hoặc dùng giọng khác:"
)
SEEDANCE_NARRATION_VOICE_SECTION_HEADER = (
    "【Ràng buộc bắt buộc: Giọng lời dẫn / 强制约束：旁白音色】Giọng nói, ngữ điệu, nhịp điệu và chất âm của lời dẫn sau phải khớp chính xác với âm thanh tham chiếu tương ứng, "
    "tốc độ nói tự nhiên hơi chậm, phát âm rõ ràng, nghiêm cấm nói vội hoặc dùng giọng khác:"
)
SEEDANCE_CHARACTER_APPEARANCE_SECTION_HEADER = (
    "【Ràng buộc bắt buộc: Ngoại hình nhân vật / 强制约束：角色形象】Khuôn mặt, vóc dáng, kiểu tóc, trang phục và thần thái tổng thể của các nhân vật sau phải khớp chính xác với ảnh tham chiếu tương ứng, "
    "nghiêm cấm đổi mặt, lệch hình tượng hoặc vẽ lại thành người khác:"
)
SEEDANCE_SCENE_SECTION_HEADER = (
    "【Ràng buộc bắt buộc: Bối cảnh / 强制约束：场景】Cấu trúc không gian, bài trí môi trường, ánh sáng và không khí của các bối cảnh sau phải khớp chính xác với ảnh tham chiếu tương ứng, "
    "nghiêm cấm đổi cảnh khác hoặc sai lệch đáng kể so với ảnh tham chiếu:"
)
SEEDANCE_PROP_SECTION_HEADER = (
    "【Ràng buộc bắt buộc: Đạo cụ / 强制约束：道具】Hình dáng, chất liệu và chi tiết then chốt của các đạo cụ sau phải khớp chính xác với ảnh tham chiếu tương ứng, "
    "nghiêm cấm thay thế bằng vật khác hoặc làm mất đi đặc trưng nhận diện:"
)


class BuildSeedanceGenerateBodyInput(TypedDict, total=False):
    content: str | None
    reference: list[dict[str, Any]] | None
    model_id: str | None
    aspect_ratio: str | None
    resolution: str | None
    video_style_id: str | None
    duration_fallback: int | None
    # URL công khai/cục bộ của khung cuối cùng; khi có phương tiện tham chiếu, hãy sử dụng nó làm reference_image (không thể trộn lẫn với first_frame)
    continuity_first_frame_url: str | None
    # URL trang web công khai của bảng định kiểu (sau biểu đồ nhân vật/cảnh và trước khi kết nối với khung cuối cùng)
    style_board_url: str | None
    # True=Đốt mô hình phụ đề; Sai=Chồng chồng sau (cấm phụ đề trên màn hình)
    burn_subtitles: bool
    # True=Thẻ giới thiệu nhân vật có các từ trùng nhau đều bị cấm; Sai=Thẻ từ giới thiệu nhân vật bị cấm
    character_intro: bool


# Tương thích với lịch sử Boolean/chuỗi, chuyển đổi thông số đa dạng phân tích cú pháp
def _resolve_episode_bool_flag(
    params: dict[str, Any] | None,
    *,
    mode_key: str,
    enabled_key: str,
    on_mode: str,
    off_mode: str,
    default: bool = True,
) -> bool:
    raw = params if isinstance(params, dict) else {}
    mode = raw.get(mode_key)
    if mode == off_mode:
        return False
    if mode == on_mode:
        return True
    enabled = raw.get(enabled_key)
    if enabled is None:
        return default
    if isinstance(enabled, str):
        return enabled.strip().lower() not in {"0", "false", "no", "off", ""}
    if isinstance(enabled, (int, float)):
        return enabled != 0
    return bool(enabled)


# Phân tích cú pháp từ các thông số của tập xem phụ đề có bị mô hình ghi hay không (ghép nối sau mặc định → Sai)
def resolve_episode_burn_subtitles(params: dict[str, Any] | None) -> bool:
    return _resolve_episode_bool_flag(
        params,
        mode_key="subtitleMode",
        enabled_key="subtitleEnabled",
        on_mode="model",
        off_mode="post",
        default=False,
    )


# Phân tích xem có chèn phần giới thiệu nhân vật trùng lặp từ thông số tập hay không (mặc định là tắt → Sai)
def resolve_episode_character_intro(params: dict[str, Any] | None) -> bool:
    return _resolve_episode_bool_flag(
        params,
        mode_key="characterIntroMode",
        enabled_key="characterIntroEnabled",
        on_mode="model",
        off_mode="off",
        default=False,
    )


@dataclass
class SeedanceReferenceFile:
    asset_id: int
    url: str


@dataclass
class SeedanceReferenceCatalog:
    images: list[SeedanceReferenceFile] = field(default_factory=list)
    audios: list[SeedanceReferenceFile] = field(default_factory=list)
    image_index_by_asset_id: dict[int, int] = field(default_factory=dict)
    audio_index_by_asset_id: dict[int, int] = field(default_factory=dict)


# Chuyển đổi nội dung ORM thành tải trọng tham chiếu Seedance
def drama_asset_to_payload(asset: DramaAsset) -> dict[str, Any]:
    return {
        "id": asset.id,
        "type": asset.type,
        "assetType": asset.asset_type,
        "name": asset.name,
        "cover": asset.cover,
        "url": asset.url,
        "params": asset.params or {},
    }


# Đọc URL âm thanh tham chiếu của liên kết ký tự (tương thích với voiceAudio và canvas.voiceAudio)
def read_asset_voice_audio_url(params: Any) -> str | None:
    if not isinstance(params, dict):
        return None

    for key in ("voiceAudio",):
        voice_audio = params.get(key)
        if isinstance(voice_audio, dict):
            url = voice_audio.get("url") or voice_audio.get("previewUrl")
            if isinstance(url, str) and url.strip():
                return url.strip()

    canvas = params.get("canvas")
    if isinstance(canvas, dict):
        voice_audio = canvas.get("voiceAudio")
        if isinstance(voice_audio, dict):
            url = voice_audio.get("url") or voice_audio.get("previewUrl")
            if isinstance(url, str) and url.strip():
                return url.strip()

    return None


# Phân tích URL hình ảnh có sẵn cho nội dung
def resolve_reference_image_url(asset: dict[str, Any]) -> str | None:
    cover = (asset.get("cover") or "").strip()
    url = (asset.get("url") or "").strip()
    asset_type = asset.get("assetType")
    category_type = asset.get("type")

    if asset_type == "image" or category_type in ("character", "scene", "prop", "material"):
        return cover or url or None

    return cover or None


# Phân tích tên tài sản được viết trong từ nhắc
def resolve_asset_prompt_name(asset: dict[str, Any], fallback: str) -> str:
    params = asset.get("params") if isinstance(asset.get("params"), dict) else {}
    entity = ""
    if isinstance(params, dict):
        entity = str(params.get("entityName") or params.get("name") or "").strip()
    return entity or (asset.get("name") or "").strip() or fallback


def resolve_character_prompt_name(asset: dict[str, Any]) -> str:
    return resolve_asset_prompt_name(asset, "角色")


def resolve_narration_prompt_name(asset: dict[str, Any]) -> str:
    return resolve_asset_prompt_name(asset, "旁白")


def resolve_scene_prompt_name(asset: dict[str, Any]) -> str:
    return resolve_asset_prompt_name(asset, "场景")


def resolve_other_asset_prompt_name(asset: dict[str, Any]) -> str:
    return resolve_asset_prompt_name(asset, f"资产#{asset.get('id')}")


def _prepare_voice_script(content: str | None) -> str:
    """Kịch bản trước khi gửi: bỏ hướng dẫn sân khấu, sửa các cảnh trống, lời thoại của nhân vật thay đổi."""
    normalized = rewrite_dialogue_action_lines(content or "")
    return rewrite_misclassified_visual_voice_lines(normalized)


def collect_speaking_character_names(
    script: str,
    reference: list[dict[str, Any]] | None,
) -> set[str]:
    """Thu thập tên nhân vật (bao gồm cả tài liệu tham khảo @asset) của phần mở đầu của cảnh này từ các dòng đối thoại/tường thuật/độc thoại."""
    names_by_id: dict[int, str] = {}
    aliases: list[str] = []
    for asset in reference or []:
        if asset.get("type") != "character":
            continue
        prompt_name = resolve_character_prompt_name(asset)
        names_by_id[int(asset["id"])] = prompt_name
        aliases.append(prompt_name)
        raw_name = str(asset.get("name") or "").strip()
        if raw_name:
            aliases.append(raw_name)
    aliases = sorted({name for name in aliases if name}, key=len, reverse=True)
    spoken: set[str] = set()
    for raw in (script or "").replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if not line or line.startswith("@duration:") or is_production_meta_line(line):
            continue
        if line.startswith("【画面") or line.startswith("【空镜"):
            continue
        body = VOICE_CUE_PREFIX_RE.sub("", line).strip()
        kind = classify_voice_body(body)
        if kind not in {"dialogue", "inner"}:
            continue
        for token in ASSET_MENTION_TOKEN_PATTERN.findall(body):
            mapped = names_by_id.get(int(token))
            if mapped:
                spoken.add(mapped)
        for name in aliases:
            if _name_is_token_prefix(body, name):
                spoken.add(name)
                break
    return spoken


def _should_attach_reference_audio(
    asset: dict[str, Any],
    *,
    filter_audio: bool,
    speaking: set[str],
    has_narration: bool,
) -> bool:
    """Nhân vật chưa nói sẽ không có giọng nói; nếu không có người thứ ba kể thì giọng kể sẽ không có âm điệu."""
    if not filter_audio:
        return True
    kind = asset.get("type")
    if kind == "character":
        prompt_name = resolve_character_prompt_name(asset)
        raw_name = str(asset.get("name") or "").strip()
        return prompt_name in speaking or raw_name in speaking
    if kind == "narration":
        return has_narration
    return True


# Xây dựng danh mục hình ảnh/âm thanh tham chiếu từ nội dung tham chiếu
def build_seedance_reference_catalog(
    reference: list[dict[str, Any]] | None,
    script: str | None = None,
) -> SeedanceReferenceCatalog:
    catalog = SeedanceReferenceCatalog()
    seen_image_asset_ids: set[int] = set()
    seen_audio_asset_ids: set[int] = set()
    filter_audio = script is not None
    voice_script = _prepare_voice_script(script) if filter_audio else ""
    speaking = (
        collect_speaking_character_names(voice_script, reference) if filter_audio else set()
    )
    has_narration = script_has_narration_cue(voice_script) if filter_audio else True

    for asset in reference or []:
        asset_id = int(asset["id"])
        image_url = resolve_reference_image_url(asset)

        if image_url and asset_id not in seen_image_asset_ids:
            seen_image_asset_ids.add(asset_id)
            catalog.images.append(SeedanceReferenceFile(asset_id=asset_id, url=image_url))

        # Hiện tại, buổi thử giọng bị ràng buộc sẽ không được liên kết với nội dung[] để tránh reference_audio lấy mô hình để phát sóng bằng miệng.
        if SEEDANCE_ATTACH_REFERENCE_AUDIO and asset.get("type") in {"character", "narration"}:
            if not _should_attach_reference_audio(
                asset,
                filter_audio=filter_audio,
                speaking=speaking,
                has_narration=has_narration,
            ):
                continue
            voice_audio_url = read_asset_voice_audio_url(asset.get("params"))
            if voice_audio_url and asset_id not in seen_audio_asset_ids:
                seen_audio_asset_ids.add(asset_id)
                catalog.audios.append(SeedanceReferenceFile(asset_id=asset_id, url=voice_audio_url))

    catalog.image_index_by_asset_id = {
        item.asset_id: index + 1 for index, item in enumerate(catalog.images)
    }
    catalog.audio_index_by_asset_id = {
        item.asset_id: index + 1 for index, item in enumerate(catalog.audios)
    }
    return catalog


_KIND_ZH = {
    "character": "角色",
    "scene": "场景",
    "prop": "道具",
    "narration": "旁白",
}


# Tạo các thẻ có thể đọc được theo chỉ số dưới content[] (cùng thứ tự với build_seedance_content_items)
def describe_seedance_content_slots(
    reference: list[dict[str, Any]] | None,
    continuity_first_frame_url: str | None = None,
    *,
    has_text: bool = True,
    style_board_url: str | None = None,
    content: str | None = None,
) -> list[str]:
    catalog = build_seedance_reference_catalog(reference, script=content)
    asset_by_id = {
        int(asset["id"]): asset
        for asset in (reference or [])
        if isinstance(asset, dict) and asset.get("id") is not None
    }
    labels: list[str] = []
    if has_text:
        labels.append("分镜文案")
    for image in catalog.images:
        asset = asset_by_id.get(image.asset_id) or {}
        kind = str(asset.get("type") or "").lower()
        kind_zh = _KIND_ZH.get(kind, "参考图")
        name = str(asset.get("name") or "").strip() or f"资产#{image.asset_id}"
        labels.append(f"{kind_zh}「{name}」")
    board = (style_board_url or "").strip() if catalog.images else ""
    if board:
        labels.append("画风板")
    for audio in catalog.audios:
        asset = asset_by_id.get(audio.asset_id) or {}
        kind = str(asset.get("type") or "").lower()
        kind_zh = _KIND_ZH.get(kind, "音色")
        name = str(asset.get("name") or "").strip() or f"资产#{audio.asset_id}"
        labels.append(f"{kind_zh}音色「{name}」")
    if (continuity_first_frame_url or "").strip():
        labels.append("上一镜尾帧")
    return labels


# @bản sao thay thế nội dung trong văn bản
def format_body_asset_mention(name: str, image_index: int | None) -> str:
    if image_index is not None:
        return f"{name}（参考图{image_index}）"
    return name


def _asset_prompt_name_for_mention(asset: dict[str, Any] | None) -> str:
    """Phân tích cú pháp và viết tên hiển thị của từ nhắc theo loại nội dung."""
    if not asset:
        return ""
    category = asset.get("type")
    if category == "character":
        return resolve_character_prompt_name(asset)
    if category == "scene":
        return resolve_scene_prompt_name(asset)
    return resolve_other_asset_prompt_name(asset)


_NAME_TOKEN_BOUNDARIES = frozenset(" \t，,、；;：:。．.!！?？）)]】」』\"'（([【「『“”和与跟及同在到向对把被让给的地得了着过也又再就都还从带")


def _name_is_token_suffix(text: str, name: str) -> bool:
    """Liệu văn bản có kết thúc bằng một tên độc lập hay không (để tránh Dayu ăn Yu)."""
    if not name or not text.endswith(name):
        return False
    prefix = text[: -len(name)]
    return (not prefix) or prefix[-1] in _NAME_TOKEN_BOUNDARIES


def _name_is_token_prefix(text: str, name: str) -> bool:
    """Liệu văn bản có bắt đầu bằng một tên độc lập hay không (để tránh việc Vua Yu bị coi là Yu)."""
    if not name or not text.startswith(name):
        return False
    rest = text[len(name) :]
    return (not rest) or rest[0] in _NAME_TOKEN_BOUNDARIES


# Thay thế phần giữ chỗ @asset bằng phần mô tả nội dung
def replace_asset_mention_token(
    asset_id: int,
    asset_by_id: dict[int, dict[str, Any]],
    catalog: SeedanceReferenceCatalog,
) -> str:
    asset = asset_by_id.get(asset_id)
    if not asset:
        return ""
    index_map = getattr(catalog, "image_index_by_asset_id", {}) or {}
    image_index = index_map.get(int(asset["id"]))
    return format_body_asset_mention(_asset_prompt_name_for_mention(asset), image_index)


def replace_asset_mentions_without_duplicate_names(
    text: str,
    asset_by_id: dict[int, dict[str, Any]],
    catalog: SeedanceReferenceCatalog,
) -> str:
    """Thay thế @asset:id bằng "name (tham khảo Hình N)" và nuốt cùng tên đã được viết trước và sau."""
    pieces: list[str] = []
    pos = 0
    for match in ASSET_MENTION_TOKEN_PATTERN.finditer(text):
        pieces.append(text[pos : match.start()])
        asset_id = int(match.group(1))
        token = replace_asset_mention_token(asset_id, asset_by_id, catalog)
        name = _asset_prompt_name_for_mention(asset_by_id.get(asset_id))
        index_map = getattr(catalog, "image_index_by_asset_id", {}) or {}
        image_index = index_map.get(asset_id)
        if name and _name_is_token_suffix("".join(pieces).rstrip(), name):
            token = f"（参考图{image_index}）" if image_index is not None else ""
        end = match.end()
        skip = 0
        if name:
            rest = text[end:]
            stripped = rest.lstrip()
            ws = len(rest) - len(stripped)
            if _name_is_token_prefix(stripped, name):
                skip = ws + len(name)
        pieces.append(token)
        pos = end + skip
    pieces.append(text[pos:])
    return "".join(pieces)


# Lắp ráp khối tuyên bố kiểu hình ảnh; khi có bảng phong cách thì nhấn mạnh chỉ mượn khí chất và cấm sao chép đề tài.
def build_visual_style_section(
    video_style_id: str | None,
    *,
    has_style_board: bool = False,
) -> str | None:
    style_prompt = resolve_image_style_prompt(video_style_id)
    if not style_prompt:
        return None
    extra = f"\n{STYLE_BOARD_PROMPT_HINT}" if has_style_board else ""
    return f"{SEEDANCE_VISUAL_STYLE_SECTION_INTRO}\n{style_prompt}{extra}"


def build_reference_index_section(
    reference: list[dict[str, Any]] | None,
    category_type: str,
    index_map: dict[int, int],
    header: str,
    index_label: str,
    resolve_name: Any,
) -> str | None:
    lines: list[str] = []
    seen_asset_ids: set[int] = set()

    for asset in reference or []:
        asset_id = int(asset["id"])
        if asset.get("type") != category_type or asset_id in seen_asset_ids:
            continue
        seen_asset_ids.add(asset_id)
        reference_index = index_map.get(asset_id)
        if reference_index is None:
            continue
        lines.append(f"{resolve_name(asset)}：{index_label}{reference_index}")

    if not lines:
        return None
    return "\n".join([header, *lines])


# Chuyển bảng phân cảnh thành lời nhắc bằng văn bản
def _normalize_body_whitespace(text: str) -> str:
    lines = [
        INLINE_WHITESPACE_PATTERN.sub(" ", raw).strip()
        for raw in text.replace("\r\n", "\n").split("\n")
    ]
    return "\n".join(line for line in lines if line).strip()


def build_seedance_body_text(
    content: str | None,
    reference: list[dict[str, Any]] | None,
    catalog: SeedanceReferenceCatalog,
) -> str:
    # Tách hướng sân khấu trong đoạn hội thoại và sửa những dòng cảnh trống bị gắn nhãn sai thành đoạn hội thoại/tường thuật
    normalized = rewrite_dialogue_action_lines(content or "")
    normalized = rewrite_misclassified_visual_voice_lines(normalized)
    asset_by_id = {int(asset["id"]): asset for asset in (reference or [])}
    replaced = replace_duration_mentions_with_time_ranges(normalized)
    replaced = replace_asset_mentions_without_duplicate_names(replaced, asset_by_id, catalog)
    return _normalize_body_whitespace(replaced)


def build_seedance_prompt_text(
    content: str | None,
    reference: list[dict[str, Any]] | None,
    catalog: SeedanceReferenceCatalog | None = None,
    video_style_id: str | None = None,
    *,
    burn_subtitles: bool = True,
    character_intro: bool = True,
    has_style_board: bool = False,
) -> str:
    # Tách hướng dẫn giai đoạn hội thoại trước khi gửi và sửa lỗi gắn nhãn sai cho các cảnh trống để đảm bảo các ràng buộc bắt buộc nhất quán với văn bản
    normalized = rewrite_dialogue_action_lines(content or "")
    normalized = rewrite_misclassified_visual_voice_lines(normalized)
    if not burn_subtitles:
        # Chế độ hậu kỳ: Xóa tiền tố phụ đề/"phụ đề được đồng bộ hóa" để ngăn mô hình vẫn làm cháy màn hình có chữ.
        normalized = strip_model_burn_subtitle_cues(normalized)
    if not character_intro:
        normalized = strip_character_intro_cues(normalized)
    resolved_catalog = catalog or build_seedance_reference_catalog(reference, script=normalized)
    sections = [
        build_visual_style_section(video_style_id, has_style_board=has_style_board),
        build_seedance_production_section(
            normalized,
            burn_subtitles=burn_subtitles,
            character_intro=character_intro,
        ),
        *(
            [
                build_reference_index_section(
                    reference,
                    "character",
                    resolved_catalog.audio_index_by_asset_id,
                    SEEDANCE_CHARACTER_VOICE_SECTION_HEADER,
                    "参考音频",
                    resolve_character_prompt_name,
                ),
                build_reference_index_section(
                    reference,
                    "narration",
                    resolved_catalog.audio_index_by_asset_id,
                    SEEDANCE_NARRATION_VOICE_SECTION_HEADER,
                    "参考音频",
                    resolve_narration_prompt_name,
                ),
            ]
            if SEEDANCE_ATTACH_REFERENCE_AUDIO
            else []
        ),
        build_reference_index_section(
            reference,
            "character",
            resolved_catalog.image_index_by_asset_id,
            SEEDANCE_CHARACTER_APPEARANCE_SECTION_HEADER,
            "参考图",
            resolve_character_prompt_name,
        ),
        build_reference_index_section(
            reference,
            "scene",
            resolved_catalog.image_index_by_asset_id,
            SEEDANCE_SCENE_SECTION_HEADER,
            "参考图",
            resolve_scene_prompt_name,
        ),
        build_reference_index_section(
            reference,
            "prop",
            resolved_catalog.image_index_by_asset_id,
            SEEDANCE_PROP_SECTION_HEADER,
            "参考图",
            resolve_other_asset_prompt_name,
        ),
        build_seedance_body_text(normalized, reference, resolved_catalog),
    ]
    return "\n\n".join(section for section in sections if section)


# Tập hợp mảng đa phương thức nội dung Seedance từ nội dung tham chiếu
def build_seedance_content_items(
    content: str | None,
    reference: list[dict[str, Any]] | None,
    video_style_id: str | None = None,
    continuity_first_frame_url: str | None = None,
    *,
    burn_subtitles: bool = True,
    character_intro: bool = True,
    style_board_url: str | None = None,
) -> list[dict[str, Any]]:
    catalog = build_seedance_reference_catalog(reference, script=content)
    # Không treo bảng kiểu khi không có hình ảnh nhân vật/cảnh để tránh việc bảng trở thành hình ảnh tham khảo duy nhất
    board = (style_board_url or "").strip() if catalog.images else ""
    prompt_text = build_seedance_prompt_text(
        content,
        reference,
        catalog,
        video_style_id,
        burn_subtitles=burn_subtitles,
        character_intro=character_intro,
        has_style_board=bool(board),
    )
    items: list[dict[str, Any]] = []

    continuity = (continuity_first_frame_url or "").strip()
    has_reference_media = bool(catalog.images or catalog.audios)

    if continuity and prompt_text:
        # Seedance: không thể trộn lẫn first/last_frame với reference_*; thay vào đó, khi có tham chiếu nhân vật/cảnh, hãy treo reference_image
        if has_reference_media:
            prompt_text = (
                "【Ràng buộc bắt buộc: Nối tiếp cảnh quay / 强制约束：镜头衔接】Đính kèm thêm khung hình cuối của cảnh trước làm ảnh tham chiếu (ảnh cuối cùng trong chuỗi ảnh tham chiếu). "
                "Mở đầu đoạn này phải tiếp nối tự nhiên từ khung hình cuối đó, giữ chủ thể, bối cảnh và ánh sáng liền mạch, nghiêm cấm chuyển cảnh giật sang khung hình không liên quan.\n\n"
                + prompt_text
            )
        else:
            prompt_text = (
                "【Ràng buộc bắt buộc: Nối tiếp cảnh quay / 强制约束：镜头衔接】Đoạn video này bắt buộc phải lấy ảnh khung hình đầu làm cảnh mở đầu và tiếp nối tự nhiên, "
                "giữ chủ thể, bối cảnh và ánh sáng liền mạch, nghiêm cấm chuyển cảnh giật sang khung hình không liên quan.\n\n"
                + prompt_text
            )

    if prompt_text:
        items.append({"type": "text", "text": prompt_text})

    for image in catalog.images:
        items.append(
            {"type": "image_url", "image_url": {"url": image.url}, "role": "reference_image"}
        )

    if board:
        items.append(
            {"type": "image_url", "image_url": {"url": board}, "role": "reference_image"}
        )

    for audio in catalog.audios:
        items.append(
            {"type": "audio_url", "audio_url": {"url": audio.url}, "role": "reference_audio"}
        )

    if continuity:
        if has_reference_media:
            items.append(
                {
                    "type": "image_url",
                    "image_url": {"url": continuity},
                    "role": "reference_image",
                }
            )
        else:
            # first_frame có thể được sử dụng khi không có phương tiện tham chiếu và tỷ lệ bị bỏ qua ở lớp bên ngoài
            items.append(
                {
                    "type": "image_url",
                    "image_url": {"url": continuity},
                    "role": "first_frame",
                }
            )

    return items


def resolve_seedance_model_endpoint(model_id: str | None) -> str:
    settings = get_settings()
    raw = (model_id or "").strip()
    logical_id = resolve_logical_model_id("video", model_id)
    routed = resolve_upstream_model("video", logical_id or (raw if raw else None))
    if routed:
        return routed
    if not raw:
        return settings.model_video or (settings.model_video_2 or "").strip()
    lowered = raw.lower()
    if lowered in {"seedance-2", "seedance-1.5", "seedance-1"}:
        return (settings.model_video_2 or "").strip() or settings.model_video or raw
    if lowered == "seedance-2.5":
        return settings.model_video or (settings.model_video_2 or "").strip() or raw
    return raw


def resolve_seedance_ratio(aspect_ratio: str | None) -> str:
    # Phù hợp với màn hình dọc mặc định trong truyện tranh; thiếu thì không quay về màn hình ngang 16:9 được
    return (aspect_ratio or "9:16").strip() or "9:16"


def resolve_seedance_resolution(resolution: str | None) -> str:
    return (resolution or "480p").strip() or "480p"


# Chuyển đổi các tham số của bảng phân cảnh thành nội dung yêu cầu Seedance
def build_seedance_generate_body(input_params: BuildSeedanceGenerateBodyInput) -> dict[str, Any]:
    content = input_params.get("content")
    fallback = int(input_params.get("duration_fallback") or 8)
    continuity = (input_params.get("continuity_first_frame_url") or "").strip() or None
    reference = input_params.get("reference")
    catalog = build_seedance_reference_catalog(reference, script=content)
    # Bỏ qua tỷ lệ khi chỉ "khung hình đầu tiên thuần túy, không có phương tiện tham chiếu"; tỷ lệ phải được giữ lại khi sử dụng tham chiếu hỗn hợp và tham chiếu_image được sử dụng cho khung cuối cùng
    style_board_url = (input_params.get("style_board_url") or "").strip() or None
    if not catalog.images:
        style_board_url = None
    use_first_frame_mode = bool(continuity) and not (catalog.images or catalog.audios)
    burn_subtitles = input_params.get("burn_subtitles")
    if burn_subtitles is None:
        burn_subtitles = True
    character_intro = input_params.get("character_intro")
    if character_intro is None:
        character_intro = True

    body: dict[str, Any] = {
        "model": resolve_seedance_model_endpoint(input_params.get("model_id")),
        "content": build_seedance_content_items(
            content,
            reference,
            input_params.get("video_style_id"),
            continuity_first_frame_url=continuity,
            burn_subtitles=bool(burn_subtitles),
            character_intro=bool(character_intro),
            style_board_url=style_board_url,
        ),
        "duration": resolve_seedance_duration_from_content(content, fallback=fallback),
        "resolution": resolve_seedance_resolution(input_params.get("resolution")),
        "watermark": False,
        # Bản lồng tiếng gốc của Seedance; các từ chồng chéo giới thiệu phụ đề/nhân vật được điều khiển bằng các công tắc tương ứng.
        "generate_audio": True,
        "return_last_frame": True,
    }
    if not use_first_frame_mode:
        body["ratio"] = resolve_seedance_ratio(input_params.get("aspect_ratio"))
    return body
