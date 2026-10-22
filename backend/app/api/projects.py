import asyncio
import io
import json
import logging
import re
import subprocess
import time
import zipfile
from datetime import datetime

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.deps import get_current_user
from app.models import Project, ProjectStatus, Shot, ShotStatus, UsageEvent, User, Work
from app.models_tasks import TaskRun
from app.schemas import (
    CharacterPromptGenerateOut,
    CharacterPromptGenerateRequest,
    ContentExpandOut,
    ContentExpandRequest,
    PageMeta,
    ProjectCreate,
    ProjectDownloadRequest,
    ProjectListItem,
    ProjectListOut,
    ProjectListStats,
    ProjectOut,
    ProjectUpdate,
    ShotOut,
    ShotReorderIn,
    ShotTrimIn,
    ShotUpdate,
    VoicePreviewOut,
    VoicePreviewRequest,
    WorkOut,
)

logger = logging.getLogger(__name__)
from app.schemas_tasks import TaskCreateRequest, TaskTargetBind
from app.services import pipeline, storage
from app.services.bgm import clip_shot_bgm
from app.services.ark import get_ark
from app.services.progress import redis_bridge, subscribe, unsubscribe
from app.services.billing import record_llm_chat_line, run_billed_ephemeral
from app.services.billing.http import http_exception_for_value_error
from app.services.tasks.service import (
    ACTIVE_TASK_STATUSES,
    cancel_tasks_for_scope,
    create_task,
    list_active_tasks_for_owner,
)
from app.services.voices import ensure_voice_preview, list_voices
from app.services.kepu_stages import resolve_kepu_billing_phase

router = APIRouter(tags=["projects"])


def _demote_after_edit(project: Project) -> None:
    """Sau khi thay đổi camera/nhạc phim, nó bị loại bỏ và chuyển thành phim, trạng thái cuối cùng được trả về script/assets/videos/compose theo tài liệu."""
    project.final_video_url = None
    if project.status not in {
        ProjectStatus.DONE,
        ProjectStatus.AUDITING,
        ProjectStatus.COMPOSING,
        ProjectStatus.VIDEO_READY,
        ProjectStatus.FAILED,
        ProjectStatus.CANCELLED,
    }:
        return
    phase = resolve_kepu_billing_phase(project)
    if phase == "script":
        project.status = ProjectStatus.SCRIPT_READY if project.shots else ProjectStatus.DRAFT
    elif phase == "assets":
        project.status = ProjectStatus.SCRIPT_READY
    elif phase == "videos":
        project.status = ProjectStatus.IMAGE_READY
    else:
        project.status = ProjectStatus.VIDEO_READY


@router.get("/voices")
async def get_voices() -> list[dict]:
    return list_voices()


@router.get("/media-models")
async def get_media_models() -> dict:
    """Danh mục mô hình hình ảnh/video tùy chọn tại quầy lễ tân khoa học phổ biến (TokenFree đã chọn các mô hình)."""
    from app.services.media_catalog import catalog_payload

    return catalog_payload()


@router.post("/voices/preview", response_model=VoicePreviewOut)
async def preview_voice(
    body: VoicePreviewRequest,
    user: User = Depends(get_current_user),
) -> VoicePreviewOut:
    """Generate a short cached TTS sample for audition."""
    _ = user
    try:
        url = await ensure_voice_preview(body.voice_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"试听生成失败：{exc}") from exc
    return VoicePreviewOut(url=url, voice_id=body.voice_id)


@router.post("/content/expand", response_model=ContentExpandOut)
async def expand_content(
    body: ContentExpandRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ContentExpandOut:
    """AI-expand a short topic into a project title + theme brief or full script."""
    from app.models import Template

    topic = (body.topic or "").strip()
    tpl = None
    if body.template_id:
        tpl = await db.get(Template, body.template_id)

    tpl_name = body.template_name or (tpl.name_vi or tpl.name if tpl else "")
    tpl_desc = body.template_description or (tpl.description_vi or tpl.description if tpl else "")
    cats = tpl.category_vi or tpl.category if tpl else []
    tpl_cat = body.template_category or (", ".join(cats) if isinstance(cats, list) else str(cats or ""))
    llm_addon = getattr(tpl, "llm_system_addon", "") if tpl else ""

    if not topic:
        if tpl_name:
            topic = f"Sản phẩm hoặc chủ đề phù hợp cho mẫu {tpl_name}"
        else:
            raise HTTPException(status_code=400, detail="Vui lòng nhập chủ đề")

    async def _do_expand() -> dict[str, str]:
        try:
            result = await get_ark().expand_content(
                topic,
                body.mode,
                template_name=tpl_name,
                template_category=tpl_cat,
                template_description=tpl_desc,
                llm_addon=llm_addon,
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail=f"AI 生成失败：{exc}") from exc
        await record_llm_chat_line(
            db,
            user_id=user.id,
            domain="kepu",
        )
        return result

    try:
        task, result = await run_billed_ephemeral(
            db,
            user,
            domain="kepu",
            task_type="content_expand",
            executor=_do_expand,
            payload={
                "mode": body.mode,
                "topic_len": len(topic),
                "template_id": body.template_id,
                "template_name": tpl_name,
            },
            commit=True,
        )
    except ValueError as exc:
        raise http_exception_for_value_error(exc) from exc
    return ContentExpandOut(
        title=result["title"],
        content=result["content"],
        task_id=task.id,
    )


def _smart_character_prompt_fallback(
    topic: str,
    template_name: str,
    template_style: str,
    seed: str,
    visual_analysis: str = "",
) -> str:
    if visual_analysis:
        return f"Nhân vật có diện mạo: {visual_analysis}. Phong cách nhất quán, tự nhiên và sắc nét."

    if seed:
        return f"{seed.strip().rstrip('.')}, biểu cảm sống động, ánh sáng tự nhiên và phong cách hình ảnh nhất quán qua các phân cảnh."

    context = f"{template_name} {template_style} {topic}".lower()
    if any(k in context for k in ["review", "bán hàng", "sản phẩm", "đề xuất", "huoke", "mở hộp", "đập hộp", "unboxing", "bình giữ nhiệt"]):
        return "Người dẫn chuyện trẻ trung, phong thái tự nhiên và thân thiện, khoảng 24-28 tuổi, trang phục thường ngày thanh lịch (áo sơ mi hoặc polo sáng màu), nụ cười tự tin, biểu cảm hào hứng chia sẻ trải nghiệm thực tế trước ống kính."
    if any(k in context for k in ["công nghệ", "tech", "ai", "phần mềm", "lập trình"]):
        return "Chuyên gia công nghệ trẻ khoảng 26-30 tuổi, vẻ ngoài thông minh và hiện đại, đeo kính gọng mỏng, mặc áo thun polo hoặc hoodie tối giản, phong thái tự tin và chuyên nghiệp."
    if any(k in context for k in ["tiktok", "reels", "viral", "người thật"]):
        return "Nhà sáng tạo nội dung năng động khoảng 22-26 tuổi, gương mặt tươi sáng, nụ cười rạng rỡ, phong cách thời trang trẻ trung năng động, cử chỉ tự tin và cuốn hút người xem."
    if any(k in context for k in ["kiến thức", "lịch sử", "tài liệu", "khoa học"]):
        return "Diễn giả hoặc người kể chuyện điềm đạm khoảng 28-35 tuổi, ánh mắt tập trung và truyền cảm hứng, trang phục lịch sự tối giản, phong thái đĩnh đạc và uy tín."
    if any(k in context for k in ["hoạt hình", "3d", "anime"]):
        return "Nhân vật hoạt hình 3D phong cách Pixar tươi sáng, đôi mắt to tròn biểu cảm sinh động, nụ cười ấm áp, trang phục nhiều màu sắc hài hòa và đường nét mềm mại."

    return "Nhân vật chính khoảng 24-28 tuổi, diện mạo trẻ trung và sáng sủa, trang phục gọn gàng hiện đại, ánh mắt tự tin và nụ cười thân thiện trước ống kính."


def _smart_product_prompt_fallback(
    topic: str,
    template_name: str,
    template_style: str,
    seed: str,
    visual_analysis: str = "",
) -> str:
    if visual_analysis:
        return f"Sản phẩm có đặc điểm: {visual_analysis}. Thiết kế cao cấp, chi tiết sắc nét và ánh sáng studio tôn lên vẻ đẹp sản phẩm."

    if seed:
        return f"{seed.strip().rstrip('.')}, chi tiết sắc nét, ánh sáng studio làm nổi bật chất liệu và thương hiệu."

    context = f"{template_name} {template_style} {topic}".lower()
    if any(k in context for k in ["mỹ phẩm", "skincare", "serum", "kem", "son", "nước hoa", "làm đẹp"]):
        return "Sản phẩm mỹ phẩm cao cấp với bao bì tinh tế, vỏ chai thủy tinh sang trọng, chi tiết nhãn mác tối giản sắc nét và ánh sáng phản chiếu dịu nhẹ."
    if any(k in context for k in ["bình giữ nhiệt", "bình nước", "ly", "cốc", "thủy tinh"]):
        return "Bình giữ nhiệt phong cách tối giản hiện đại, bề mặt sơn tĩnh điện nhám mịn cao cấp, nắp đậy kim loại sáng bóng và kiểu dáng công thái học sang trọng."
    if any(k in context for k in ["công nghệ", "tai nghe", "điện thoại", "laptop", "chuột", "bàn phím", "loa"]):
        return "Thiết bị công nghệ thiết kế nguyên khối tinh xảo, đường viền kim loại cắt sắc sảo, bề mặt mờ nhám chống bám vân tay và đèn LED trạng thái tinh tế."
    if any(k in context for k in ["cà phê", "trà", "đồ uống", "nước giải khát", "thực phẩm", "bánh"]):
        return "Sản phẩm đồ uống/thực phẩm bày trí bắt mắt và tươi ngon, bao bì đóng gói hiện đại, hạt nước đọng tươi mát và màu sắc hấp dẫn kích thích thị giác."
    if any(k in context for k in ["thời trang", "áo", "quần", "giày", "túi", "ví", "đồng hồ"]):
        return "Sản phẩm thời trang cao cấp với đường may tỉ mỉ, chất liệu vải/da thượng hạng sắc nét từng thớ vân, phom dáng chuẩn chỉ và khóa kim loại sáng bóng."

    return "Sản phẩm chính có thiết kế sắc sảo, bao bì hiện đại và cao cấp, đường nét chi tiết rõ ràng với ánh sáng studio tôn lên đặc tính nổi bật."


def _smart_scene_prompt_fallback(
    topic: str,
    template_name: str,
    template_style: str,
    seed: str,
    visual_analysis: str = "",
) -> str:
    if visual_analysis:
        return f"Không gian bối cảnh: {visual_analysis}. Bố cục điện ảnh có chiều sâu, ánh sáng tự nhiên và hài hòa."

    if seed:
        return f"{seed.strip().rstrip('.')}, bố cục góc rộng có chiều sâu, ánh sáng mềm mại và màu sắc điện ảnh hài hòa."

    context = f"{template_name} {template_style} {topic}".lower()
    if any(k in context for k in ["studio", "review", "đập hộp", "unboxing", "bán hàng", "huoke"]):
        return "Không gian studio review hiện đại và tối giản, bàn trưng bày phẳng mịn với ánh sáng 3 điểm chuyên nghiệp, hậu cảnh mờ nhẹ tạo chiều sâu điện ảnh."
    if any(k in context for k in ["công nghệ", "tech", "ai", "lập trình"]):
        return "Góc làm việc công nghệ hiện đại với bàn làm việc tối giản, ánh sáng viền LED dịu mắt, hậu cảnh tinh tế tạo cảm giác tri thức và chuyên nghiệp."
    if any(k in context for k in ["vlog", "đời sống", "nhà", "gia đình", "bếp", "nấu ăn"]):
        return "Không gian phòng khách và bếp hiện đại, nội thất gỗ ấm cúng phong cách Bắc Âu, ánh sáng tự nhiên dịu mát tràn ngập qua cửa sổ kính lớn."
    if any(k in context for k in ["cà phê", "thư giãn", "chill", "sách", "học tập"]):
        return "Không gian quán cà phê phong cách tối giản mộc mạc, bàn gỗ ấm áp cạnh cửa sổ, cây xanh trang trí nhỏ và ánh nắng vàng ươm thư thái."
    if any(k in context for k in ["ngoài trời", "du lịch", "thiên nhiên", "đường phố"]):
        return "Khung cảnh ngoài trời thoáng đãng, ánh sáng ban ngày trong trẻo tự nhiên, không gian có chiều sâu và góc nhìn rộng mở sinh động."

    return "Không gian bối cảnh hiện đại và trang nhã, ánh sáng mềm mại tự nhiên, hậu cảnh được sắp xếp gọn gàng với chiều sâu điện ảnh sắc nét."


@router.post("/content/character-prompt", response_model=CharacterPromptGenerateOut)
@router.post("/content/reference-prompt", response_model=CharacterPromptGenerateOut)
async def generate_character_prompt_endpoint(
    body: CharacterPromptGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CharacterPromptGenerateOut:
    """Generate a rich, cinematic reference prompt (character, product, or scene) using vision analysis + LLM API with fallback."""
    import base64
    import httpx
    from app.services.llm_client import chatgpt2api_completions, chat_completions, is_chatgpt2api_configured
    from app.config import get_settings
    from app.services import storage

    settings = get_settings()
    topic = (body.topic or "").strip()
    if len(topic) > 3000:
        topic = topic[:3000]
    template_name = (body.template_name or "").strip()
    template_style = (body.template_style or "").strip()
    seed = (body.seed_prompt or "").strip()
    ref_url = (body.ref_image_url or "").strip()
    target_type = (body.target_type or "character").lower().strip()
    if target_type not in ["character", "product", "scene"]:
        target_type = "character"

    if not ref_url and body.project_id:
        proj = await db.get(Project, body.project_id)
        if proj:
            if target_type == "product" and proj.product_image_url:
                ref_url = proj.product_image_url
            elif target_type == "scene" and proj.scene_image_url:
                ref_url = proj.scene_image_url
            elif target_type == "character" and proj.ref_image_url:
                ref_url = proj.ref_image_url

    # 1. Trích xuất ảnh tham chiếu nếu có để chạy Vision API
    img_bytes: bytes | None = None
    mime = "image/png"
    if ref_url:
        if ref_url.startswith("data:image/"):
            try:
                header, b64 = ref_url.split(",", 1)
                mime = header.split(";")[0].replace("data:", "")
                img_bytes = base64.b64decode(b64)
            except Exception as e:
                logger.warning("Lỗi giải mã base64 ref_image_url: %s", e)
        elif ref_url.startswith("http://") or ref_url.startswith("https://"):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    r = await client.get(ref_url)
                    if r.status_code == 200:
                        img_bytes = r.content
                        mime = r.headers.get("content-type", "image/png")
            except Exception as e:
                logger.warning("Lỗi tải ảnh tham chiếu từ %s: %s", ref_url, e)
        else:
            p = storage.local_path_from_url(ref_url)
            if (not p or not p.exists()) and body.project_id:
                p = storage.project_dir(body.project_id) / Path(ref_url).name
            if p and p.is_file():
                img_bytes = p.read_bytes()
                mime = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"

    if not img_bytes and body.project_id:
        p_dir = storage.project_dir(body.project_id)
        patterns = (
            ["product_image.*", "ref_image_product.*"]
            if target_type == "product"
            else ["scene_image.*", "ref_image_scene.*"]
            if target_type == "scene"
            else ["ref_image.*"]
        )
        for pattern in patterns:
            for cand in p_dir.glob(pattern):
                if cand.is_file():
                    img_bytes = cand.read_bytes()
                    mime = "image/png" if cand.suffix.lower() == ".png" else "image/jpeg"
                    break
            if img_bytes:
                break

    # 2. Phân tích đặc điểm đối tượng qua Vision API (neuravibemmo.dpdns.org)
    visual_analysis = ""
    if img_bytes:
        try:
            if target_type == "product":
                vision_prompt = (
                    "Phân tích chi tiết sản phẩm / vật thể trong ảnh: tên loại sản phẩm, kiểu dáng thiết kế, bao bì hoặc vỏ ngoài, màu sắc chủ đạo, chất liệu bề mặt, chi tiết tem nhãn hoặc logo bằng tiếng Việt để làm prompt tạo hình sản phẩm AI."
                )
            elif target_type == "scene":
                vision_prompt = (
                    "Phân tích chi tiết không gian bối cảnh trong ảnh: loại phòng hoặc địa điểm ngoài trời, phong cách kiến trúc và nội thất, ánh sáng chủ đạo, màu sắc và đạo cụ bày trí bằng tiếng Việt để làm prompt dựng bối cảnh video AI."
                )
            else:
                vision_prompt = (
                    "Phân tích chi tiết đặc điểm ngoại hình nhân vật trong ảnh: "
                    "giới tính, độ tuổi ước tính, kiểu và màu tóc, khuôn mặt, biểu cảm, trang phục, dáng người, phong cách tổng thể "
                    "bằng tiếng Việt để làm prompt vẽ nhân vật."
                )

            async with httpx.AsyncClient(timeout=8.0) as client:
                vision_url = f"{settings.domain_web_2_api.rstrip('/')}/api/custom/detect-character-gender"
                vision_resp = await client.post(
                    vision_url,
                    files={"image": ("ref_image.png", img_bytes, mime)},
                    data={"prompt": vision_prompt},
                )
                if vision_resp.status_code == 200:
                    v_json = vision_resp.json()
                    raw_data = v_json.get("raw") or ""
                    if isinstance(raw_data, str) and raw_data.strip().startswith("{"):
                        try:
                            parsed = json.loads(raw_data)
                            if not parsed.get("error"):
                                lines = []
                                field_labels = {
                                    "gender": "Giới tính",
                                    "estimated_age": "Độ tuổi",
                                    "hair_style_color": "Kiểu tóc và màu tóc",
                                    "hair_description": "Kiểu tóc và màu tóc",
                                    "hair": "Kiểu tóc và màu tóc",
                                    "face_features": "Khuôn mặt",
                                    "face_description": "Khuôn mặt",
                                    "expression": "Biểu cảm và thần thái",
                                    "demeanor": "Biểu cảm và thần thái",
                                    "clothing": "Trang phục",
                                    "body_shape": "Vóc dáng",
                                    "overall_style": "Phong cách tổng thể",
                                    "product_name": "Tên sản phẩm",
                                    "category": "Loại sản phẩm",
                                    "color": "Màu sắc",
                                    "material": "Chất liệu",
                                    "packaging": "Bao bì",
                                    "scene_type": "Loại bối cảnh",
                                    "lighting": "Ánh sáng",
                                    "atmosphere": "Bầu không khí",
                                }
                                for k, val in parsed.items():
                                    if val and not str(val).lower().startswith("không"):
                                        label = field_labels.get(k, k)
                                        lines.append(f"- {label}: {val}")
                                if lines:
                                    visual_analysis = "\n".join(lines)
                        except Exception:
                            visual_analysis = raw_data
                    elif isinstance(raw_data, str) and raw_data.strip():
                        visual_analysis = raw_data
        except Exception as err:
            logger.warning("Lỗi phân tích ảnh tham chiếu bằng Vision API: %s", err)

    # 3. Xây dựng prompt cho LLM
    if target_type == "product":
        system_prompt = (
            "Bạn là chuyên gia thiết kế sản phẩm và đạo diễn hình ảnh video thương mại (CGI, VFX, Midjourney, Kling). "
            "Nhiệm vụ của bạn là tạo ra một đoạn mô tả chi tiết, sắc nét (1-2 câu tiếng Việt) về sản phẩm chính trong video, "
            "bao gồm: kiểu dáng thiết kế, màu sắc nhận diện, chất liệu hoàn thiện (kim loại xước, thủy tinh trong suốt, sơn nhám mờ...), "
            "chi tiết bao bì tem nhãn và hiệu ứng ánh sáng tôn lên vẻ cao cấp, chân thực. "
            "Nếu có thông tin từ ảnh tham chiếu, BẮT BUỘC PHẢI giữ đúng 100% đặc điểm nhận dạng của sản phẩm trong ảnh tham chiếu. "
            "Yêu cầu: CHỈ trả về trực tiếp đoạn văn bản mô tả sản phẩm, không thêm ngoặc kép hay lời dẫn."
        )
    elif target_type == "scene":
        system_prompt = (
            "Bạn là chuyên gia thiết kế bối cảnh và đạo diễn hình ảnh (Cinematographer / Set Designer) cho video điện ảnh. "
            "Nhiệm vụ của bạn là tạo ra một đoạn mô tả không gian bối cảnh (1-2 câu tiếng Việt) phù hợp nhất với chủ đề video, "
            "bao gồm: loại không gian (studio hiện đại, phòng khách ấm cúng, quán cà phê, góc làm việc...), phong cách kiến trúc / nội thất, "
            "nguồn ánh sáng (ánh sáng tự nhiên qua cửa sổ, đèn neon, ánh sáng studio 3 điểm dịu nhẹ) và chiều sâu không gian. "
            "Nếu có thông tin từ ảnh tham chiếu, BẮT BUỘC PHẢI bám sát không gian và tone màu của ảnh tham chiếu. "
            "Yêu cầu: CHỈ trả về trực tiếp đoạn văn bản mô tả bối cảnh, không thêm ngoặc kép hay lời dẫn."
        )
    else:
        system_prompt = (
            "Bạn là chuyên gia thiết kế nhân vật và đạo diễn hình ảnh cho video AI (Midjourney, Stable Diffusion, Veo, Kling). "
            "Nhiệm vụ của bạn là tạo ra một đoạn mô tả ngoại hình ngắn gọn, súc tích (1-2 câu tiếng Việt) về nhân vật chính, "
            "bao gồm: độ tuổi, vóc dáng, kiểu tóc, trang phục đặc trưng, biểu cảm và thần thái phù hợp nhất. "
            "ĐẶC BIỆT LƯU Ý: Nếu có thông tin phân tích từ ảnh tham chiếu, bạn BẮT BUỘC PHẢI giữ chính xác 100% các đặc điểm nhận dạng cốt lõi "
            "(giới tính, kiểu tóc, màu tóc, trang phục, độ tuổi, cử chỉ biểu cảm) của ảnh tham chiếu, tuyệt đối không tự ý thay đổi giới tính hay trang phục khác. "
            "Yêu cầu định dạng: CHỈ trả về trực tiếp đoạn văn bản mô tả nhân vật, tuyệt đối không thêm lời chào, không thêm ngoặc kép, không thêm lời dẫn."
        )

    user_parts = []
    if visual_analysis:
        header_text = (
            "ĐẶC ĐIỂM SẢN PHẨM TỪ ẢNH THAM CHIẾU (PHẢI TUÂN THỦ TUYỆT ĐỐI):"
            if target_type == "product"
            else "ĐẶC ĐIỂM KHÔNG GIAN BỐI CẢNH TỪ ẢNH THAM CHIẾU (PHẢI TUÂN THỦ TUYỆT ĐỐI):"
            if target_type == "scene"
            else "ĐẶC ĐIỂM NHẬN DIỆN TỪ ẢNH THAM CHIẾU (PHẢI TUÂN THỦ TUYỆT ĐỐI 100% CÁC CHI TIẾT NÀY):"
        )
        user_parts.append(f"{header_text}\n{visual_analysis}")
    if topic:
        user_parts.append(f"Chủ đề / nội dung video: {topic}")
    if template_name:
        user_parts.append(f"Phong cách mẫu: {template_name}")
    if template_style:
        user_parts.append(f"Gợi ý phong cách: {template_style}")
    if seed:
        user_parts.append(f"Ý tưởng ban đầu của người dùng (hãy mở rộng và tinh chỉnh từ ý này): {seed}")

    if not user_parts:
        if target_type == "product":
            user_parts.append("Sản phẩm cao cấp, tinh xảo, bắt mắt phù hợp video quảng cáo ngắn.")
        elif target_type == "scene":
            user_parts.append("Không gian bối cảnh hiện đại, ánh sáng tự nhiên và hài hòa cho video ngắn.")
        else:
            user_parts.append("Nhân vật trẻ trung, hiện đại, năng động phù hợp làm video ngắn.")

    user_prompt = "\n\n".join(user_parts)

    result_text = ""
    if is_chatgpt2api_configured():
        try:
            result_text = await chatgpt2api_completions(
                system=system_prompt,
                user=user_prompt,
                base=f"{settings.domain_web_2_api.rstrip('/')}/api/chatgpt2api",
                timeout=10.0,
            )
        except Exception as exc:
            logger.warning("Lỗi gọi chatgpt2api %s prompt: %s, chuyển sang thử chat_completions", target_type, exc)

    if not result_text:
        try:
            result_text = await chat_completions(
                system=system_prompt,
                user=user_prompt,
                temperature=0.6,
                max_tokens=512,
                timeout=12.0,
            )
        except Exception as exc:
            logger.warning("Lỗi gọi chat_completions %s prompt: %s, dùng fallback thông minh", target_type, exc)

    if not result_text or not result_text.strip():
        if target_type == "product":
            result_text = _smart_product_prompt_fallback(
                topic=topic,
                template_name=template_name,
                template_style=template_style,
                seed=seed,
                visual_analysis=visual_analysis,
            )
        elif target_type == "scene":
            result_text = _smart_scene_prompt_fallback(
                topic=topic,
                template_name=template_name,
                template_style=template_style,
                seed=seed,
                visual_analysis=visual_analysis,
            )
        else:
            result_text = _smart_character_prompt_fallback(
                topic=topic,
                template_name=template_name,
                template_style=template_style,
                seed=seed,
                visual_analysis=visual_analysis,
            )

    cleaned = result_text.strip().strip('"').strip("'")
    return CharacterPromptGenerateOut(character_prompt=cleaned, prompt=cleaned)


async def _get_owned_project(db: AsyncSession, project_id: int, user: User) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.user_id == user.id)
        .options(selectinload(Project.shots))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    project.active_tasks = await list_active_tasks_for_owner(db, user.id, project_id=project.id)
    runtime_status, runtime_progress, runtime_error = _project_runtime_view(project)
    project.status = runtime_status
    project.progress = runtime_progress
    project.error_msg = runtime_error
    return project


def _image_ext_from_magic(raw: bytes) -> str:
    """Xác định hậu tố hình ảnh dựa trên tiêu đề tệp; nếu không thể xác định được, nó sẽ trả về trống."""
    if raw.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if raw.startswith(b"GIF87a") or raw.startswith(b"GIF89a"):
        return ".gif"
    if len(raw) >= 12 and raw.startswith(b"RIFF") and raw[8:12] == b"WEBP":
        return ".webp"
    return ""


# Khi toàn bộ nhiệm vụ cấp chip chiếm giữ dự án, việc bắt đầu các nhiệm vụ phụ bị cấm (bao gồm cả cancel_requested, đường ống có thể vẫn đang ghi)
_PROJECT_WIDE_TASK_TYPES = {
    "project_pipeline",
    "project_compose_only",
    "project_regen_audio",
    "shot_regen_audio",
}


def _ensure_side_task_allowed(project: Project) -> None:
    """Nhiệm vụ phụ bị từ chối trước khi toàn bộ nhiệm vụ được hoàn thành; việc vẽ lại ống kính đơn có thể được thực hiện song song và sẽ không bị kẹt do HÌNH ẢNH còn sót lại."""
    for task in getattr(project, "active_tasks", []) or []:
        if str(getattr(task, "status", "") or "") not in ACTIVE_TASK_STATUSES:
            continue
        if str(getattr(task, "task_type", "") or "") in _PROJECT_WIDE_TASK_TYPES:
            raise HTTPException(status_code=409, detail="整片生成进行中，请稍后")


# COMPOSING Khi không có tác vụ nào đang diễn ra, việc ghép nối được coi là không thành công và bị kẹt và được phép bắt đầu lại.
async def _ensure_compose_allowed(db: AsyncSession, user: User, project: Project) -> None:
    active = await list_active_tasks_for_owner(db, user.id, project_id=project.id)
    if active:
        raise HTTPException(status_code=409, detail="生成进行中，请稍后")
    running = {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.AUDITING,
    }
    if project.status in running:
        raise HTTPException(status_code=409, detail="生成进行中，请稍后")
    # COMPOSING / FAILED / VIDEO_READY / DONE, v.v. có thể được thử lại để ghép nối (không có tác vụ hoạt động)


# Sử dụng trung tâm tác vụ hợp nhất để chiếu trạng thái đang chạy của dự án nhằm tránh việc giao diện người dùng chỉ dựa vào Project.status cũ.
def _project_runtime_view(project: Project) -> tuple[str, int, str | None]:
    active_tasks = list(getattr(project, "active_tasks", []) or [])
    if not active_tasks:
        return str(project.status), int(project.progress or 0), project.error_msg
    task = active_tasks[0]
    task_type = str(getattr(task, "task_type", "") or "")
    status = str(getattr(task, "status", "") or "")
    progress = int(getattr(task, "progress_percent", 0) or 0)
    if task_type == "project_pipeline":
        label = ProjectStatus.SCRIPTING
    elif task_type == "shot_regen_image":
        label = ProjectStatus.IMAGING
    elif task_type == "shot_regen_video":
        label = ProjectStatus.VIDEOING
    elif task_type == "shot_regen_audio":
        label = ProjectStatus.AUDIOING
    elif task_type == "project_regen_audio":
        label = ProjectStatus.AUDIOING
    elif task_type == "project_compose_only":
        label = ProjectStatus.COMPOSING
    else:
        label = str(project.status)
    if status in {"failed", "cancelled"}:
        return status.upper(), progress, getattr(task, "error_message", None) or project.error_msg
    if status in {"pending", "leased", "running", "awaiting_poll", "cancel_requested"}:
        return label, max(progress, int(project.progress or 0)), getattr(task, "error_message", None)
    return str(project.status), int(project.progress or 0), project.error_msg


# Tạo các nhiệm vụ thống nhất cho các dự án/ống kính khoa học phổ biến, được bộ lập lịch nền tảng thực hiện tự động
async def _create_kepu_task(
    db: AsyncSession,
    user: User,
    *,
    project_id: int,
    task_type: str,
    shot_id: int | None = None,
    payload: dict | None = None,
) -> int:
    targets = [TaskTargetBind(target_type="project", target_id=project_id)]
    if shot_id is not None:
        targets.append(TaskTargetBind(target_type="shot", target_id=shot_id))
    try:
        task = await create_task(
            db,
            user,
            TaskCreateRequest(
                domain="kepu",
                task_type=task_type,
                dedupe_key=f"kepu:{task_type}:project:{project_id}:shot:{shot_id or 0}",
                payload={"project_id": project_id, "shot_id": shot_id, **(payload or {})},
                project_id=project_id,
                shot_id=shot_id,
                targets=targets,
            ),
        )
    except ValueError as exc:
        await db.rollback()
        raise http_exception_for_value_error(exc) from exc
    return int(task.id)


# Đọc các nhiệm vụ hoạt động dự án theo lô để tránh truy vấn từng mục trên trang danh sách.
async def list_active_tasks_for_user_rows(
    db: AsyncSession,
    user_id: int,
    project_ids: list[int],
) -> dict[int, list]:
    by_project_id: dict[int, list] = {}
    for project_id in project_ids:
        by_project_id[int(project_id)] = await list_active_tasks_for_owner(
            db,
            user_id,
            project_id=int(project_id),
        )
    return by_project_id


@router.post("/projects", response_model=ProjectOut)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    from app.models import Template

    tpl = await db.get(Template, body.template_id)
    if not tpl or not tpl.is_active:
        raise HTTPException(status_code=400, detail="无效模板")
    project = Project(
        user_id=user.id,
        template_id=body.template_id,
        title=body.title,
        source_type=body.source_type,
        source_text=body.source_text,
        resolution_mode=body.resolution_mode,
        pipeline_mode=body.pipeline_mode,
        output_ratio=(body.output_ratio or "").strip(),
        voice_id=(body.voice_id or "").strip(),
        # Nếu trống, hãy đọc mẫu nền khi tạo; không sao chép khi tạo, để tránh việc thay đổi mẫu nền không ảnh hưởng đến các dự án hiện có
        style_prompt=(body.style_prompt or "").strip(),
        character_prompt=(body.character_prompt or "").strip(),
        extra_prompt=(body.extra_prompt or "").strip(),
        image_model=(body.image_model or "").strip(),
        video_model=(body.video_model or "").strip(),
        ref_image_url=body.ref_image_url,
        status=ProjectStatus.DRAFT,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    result = await db.execute(
        select(Project).where(Project.id == project.id).options(selectinload(Project.shots))
    )
    return result.scalar_one()


_RUNNING_STATUSES = {
    ProjectStatus.SCRIPTING,
    ProjectStatus.IMAGING,
    ProjectStatus.VIDEOING,
    ProjectStatus.AUDIOING,
    ProjectStatus.COMPOSING,
    ProjectStatus.AUDITING,
}


@router.get("/projects", response_model=ProjectListOut)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=50),
    status: str | None = Query(
        None,
        description="all|draft|running|done|published",
    ),
    q: str | None = Query(None, description="title search"),
    pipeline_mode: str | None = Query(
        None,
        description="full|image_text；空=全部类型",
    ),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProjectListOut:
    """Paginated project list with status / published / type filters."""
    published_exists = (
        select(Work.id)
        .where(Work.project_id == Project.id, Work.user_id == user.id)
        .correlate(Project)
        .exists()
    )

    base = select(Project).where(Project.user_id == user.id)
    count_base = select(func.count()).select_from(Project).where(Project.user_id == user.id)

    mode = (pipeline_mode or "").strip().lower()
    if mode in {"full", "image_text"}:
        base = base.where(Project.pipeline_mode == mode)
        count_base = count_base.where(Project.pipeline_mode == mode)

    keyword = (q or "").strip()
    if keyword:
        like = f"%{keyword}%"
        filt = or_(Project.title.ilike(like), Project.error_msg.ilike(like))
        base = base.where(filt)
        count_base = count_base.where(filt)

    tab = (status or "all").strip().lower()
    if tab == "draft":
        base = base.where(Project.status == ProjectStatus.DRAFT)
        count_base = count_base.where(Project.status == ProjectStatus.DRAFT)
    elif tab == "running":
        base = base.where(Project.status.in_(_RUNNING_STATUSES))
        count_base = count_base.where(Project.status.in_(_RUNNING_STATUSES))
    elif tab == "done":
        base = base.where(Project.status == ProjectStatus.DONE)
        count_base = count_base.where(Project.status == ProjectStatus.DONE)
    elif tab == "published":
        base = base.where(published_exists)
        count_base = count_base.where(published_exists)

    total = int((await db.execute(count_base)).scalar_one() or 0)
    rows = list(
        (
            await db.execute(
                base.order_by(Project.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        .scalars()
        .all()
    )

    published_ids: set[int] = set()
    if rows:
        pub_result = await db.execute(
            select(Work.project_id).where(
                Work.user_id == user.id,
                Work.project_id.in_([p.id for p in rows]),
            )
        )
        published_ids = {int(x) for x in pub_result.scalars().all()}
        active_tasks = await list_active_tasks_for_user_rows(db, user.id, [p.id for p in rows])
        for project in rows:
            project.active_tasks = active_tasks.get(int(project.id), [])

    items = [
        ProjectListItem(
            id=p.id,
            title=p.title,
            template_id=p.template_id,
            status=_project_runtime_view(p)[0],
            progress=_project_runtime_view(p)[1],
            cover_url=p.cover_url,
            final_video_url=p.final_video_url,
            error_msg=_project_runtime_view(p)[2],
            pipeline_mode=p.pipeline_mode or "full",
            output_ratio=p.output_ratio or "",
            published=p.id in published_ids,
            created_at=p.created_at,
            updated_at=p.updated_at,
            active_tasks=list(getattr(p, "active_tasks", []) or []),
        )
        for p in rows
    ]

    # Stats ignore status tab but keep type + search scope
    stats_filter = [Project.user_id == user.id]
    if mode in {"full", "image_text"}:
        stats_filter.append(Project.pipeline_mode == mode)
    if keyword:
        like = f"%{keyword}%"
        stats_filter.append(or_(Project.title.ilike(like), Project.error_msg.ilike(like)))

    async def _count(*extra):
        stmt = select(func.count()).select_from(Project).where(*stats_filter, *extra)
        return int((await db.execute(stmt)).scalar_one() or 0)

    stats_total = await _count()
    stats_generating = await _count(Project.status.in_(_RUNNING_STATUSES))
    stats_done = await _count(Project.status == ProjectStatus.DONE)
    pub_stmt = (
        select(func.count())
        .select_from(Work)
        .join(Project, Project.id == Work.project_id)
        .where(Work.user_id == user.id, *stats_filter)
    )
    stats_published = int((await db.execute(pub_stmt)).scalar_one() or 0)
    stats = ProjectListStats(
        total=stats_total,
        generating=stats_generating,
        done=stats_done,
        published=stats_published,
    )

    return ProjectListOut(
        items=items,
        meta=PageMeta(page=page, page_size=page_size, total=total),
        stats=stats,
    )


def _safe_zip_name(title: str, project_id: int) -> str:
    raw = (title or "未命名作品").strip() or "未命名作品"
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', "_", raw)
    cleaned = cleaned.strip(" .")[:60] or "未命名作品"
    return f"p{project_id}_{cleaned}.mp4"


@router.post("/projects/download-zip")
async def download_projects_zip(
    body: ProjectDownloadRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Zip final videos for selected owned projects (DONE with final_video_url)."""
    ids = list(dict.fromkeys(int(i) for i in body.ids if int(i) > 0))
    if not ids:
        raise HTTPException(status_code=400, detail="请选择要下载的作品")
    if len(ids) > 50:
        raise HTTPException(status_code=400, detail="一次最多打包 50 个")

    result = await db.execute(
        select(Project).where(Project.user_id == user.id, Project.id.in_(ids))
    )
    projects = list(result.scalars().all())
    by_id = {p.id: p for p in projects}
    missing = [i for i in ids if i not in by_id]
    if missing:
        raise HTTPException(status_code=404, detail=f"项目不存在: {missing[:5]}")

    entries: list[tuple[str, bytes]] = []
    skipped: list[str] = []
    for pid in ids:
        p = by_id[pid]
        if p.status != ProjectStatus.DONE or not p.final_video_url:
            skipped.append(f"#{pid}")
            continue
        path = storage.local_path_from_url(p.final_video_url)
        try:
            if (not path or not path.exists()) and str(p.final_video_url).startswith("http"):
                dest = storage.project_dir(p.id) / "final.mp4"
                path = await storage.ensure_local_media(p.final_video_url, dest)
        except Exception:  # noqa: BLE001
            path = None
        if not path or not path.exists():
            skipped.append(f"#{pid}")
            continue
        entries.append((_safe_zip_name(p.title, p.id), path.read_bytes()))

    if not entries:
        raise HTTPException(
            status_code=400,
            detail="所选作品暂无成片可下载（需状态为已完成）",
        )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        used: set[str] = set()
        for name, data in entries:
            final_name = name
            n = 1
            while final_name in used:
                stem = name.rsplit(".", 1)[0]
                final_name = f"{stem}_{n}.mp4"
                n += 1
            used.add(final_name)
            zf.writestr(final_name, data)
        if skipped:
            zf.writestr(
                "skipped.txt",
                "以下项目未打包（未完成或缺少成片文件）：\n" + "\n".join(skipped),
            )
    buf.seek(0)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"framecut_videos_{stamp}.zip"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(buf, media_type="application/zip", headers=headers)


@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    return await _get_owned_project(db, project_id, user)


@router.patch("/projects/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="生成进行中，无法修改")

    data = body.model_dump(exclude_unset=True)
    if "template_id" in data:
        from app.models import Template

        tpl = await db.get(Template, data["template_id"])
        if not tpl or not tpl.is_active:
            raise HTTPException(status_code=400, detail="无效模板")
        # Xóa phạm vi dự án sau khi thay đổi mẫu và thế hệ tiếp theo sẽ tuân theo mẫu nền; nếu yêu cầu rõ ràng có chứa các từ nhắc nhở thì yêu cầu đó sẽ được giữ lại.
        if "style_prompt" not in data:
            data["style_prompt"] = ""
        if "character_prompt" not in data:
            data["character_prompt"] = ""
        if "extra_prompt" not in data:
            data["extra_prompt"] = ""
    if "cover_url" in data and data["cover_url"]:
        url = str(data["cover_url"]).strip()
        if not (url.startswith("/static/") or url.startswith("http://") or url.startswith("https://")):
            raise HTTPException(status_code=400, detail="无效封面地址")
    for key in ("style_prompt", "character_prompt", "extra_prompt", "product_prompt", "scene_prompt", "image_model", "video_model"):
        if key in data:
            data[key] = str(data[key] or "").strip()
    if "image_model" in data and data["image_model"]:
        from app.services.media_catalog import is_valid_project_media_model

        if not is_valid_project_media_model(data["image_model"], "image"):
            raise HTTPException(status_code=400, detail="无效图片模型")
    if "video_model" in data and data["video_model"]:
        from app.services.media_catalog import is_valid_project_media_model

        if not is_valid_project_media_model(data["video_model"], "video"):
            raise HTTPException(status_code=400, detail="无效视频模型")
    if "bgm_lock" in data:
        data["bgm_lock"] = str(data["bgm_lock"] or "").strip()
    if "subtitle_preset" in data:
        data["subtitle_preset"] = str(data["subtitle_preset"] or "").strip()
    if "bgm_lock" in data or "subtitle_preset" in data:
        _demote_after_edit(project)
    for k, v in data.items():
        setattr(project, k, v)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/cover", response_model=ProjectOut)
async def upload_project_cover(
    project_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Upload a custom cover image for the project."""
    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="生成进行中，无法更换封面")

    content_type = (file.content_type or "").lower()
    allowed = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = allowed.get(content_type)
    if not ext:
        # Fallback from filename
        suffix = Path(file.filename or "").suffix.lower()
        if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            ext = ".jpg" if suffix == ".jpeg" else suffix
        else:
            raise HTTPException(status_code=400, detail="仅支持 JPG / PNG / WebP / GIF")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="空文件")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="封面不能超过 8MB")

    dest = storage.project_dir(project_id) / f"cover{ext}"
    dest.write_bytes(raw)
    project.cover_url = storage.publish_local(dest)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/ref-image", response_model=ProjectOut)
async def upload_project_ref_image(
    project_id: int,
    file: UploadFile = File(...),
    ref_type: str = Query("character", pattern="^(character|product|scene)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Upload a character, product, or scene reference image for the project."""
    project = await _get_owned_project(db, project_id, user)
    if project.status in _RUNNING_STATUSES:
        raise HTTPException(status_code=409, detail="生成进行中，无法更换参考图")

    content_type = (file.content_type or "").lower()
    allowed = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = allowed.get(content_type)
    if not ext:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            ext = ".jpg" if suffix == ".jpeg" else suffix
        else:
            raise HTTPException(status_code=400, detail="仅支持 JPG / PNG / WebP / GIF")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="空文件")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="参考图不能超过 8MB")

    filename = f"{ref_type}_image{ext}" if ref_type != "character" else f"ref_image{ext}"
    dest = storage.project_dir(project_id) / filename
    dest.write_bytes(raw)
    url = storage.publish_local(dest)
    if ref_type == "product":
        project.product_image_url = url
    elif ref_type == "scene":
        project.scene_image_url = url
    else:
        project.ref_image_url = url
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/generate", response_model=ProjectOut)
async def generate_project(
    project_id: int,
    restart: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Start or resume the pipeline.

    - First run / restart: script stage only, then pauses at SCRIPT_READY for review.
    - Continue: one billing stage per click — assets → videos → compose（各自预扣）。
    - restart=true: wipe shots/media and regenerate storyboard from scratch.
    """
    from app.services.kepu_stages import resolve_kepu_billing_phase

    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="生成进行中，请稍后")

    if restart:
        shot_ids = [s.id for s in project.shots]
        if shot_ids:
            await db.execute(
                update(TaskRun).where(TaskRun.shot_id.in_(shot_ids)).values(shot_id=None)
            )
        for shot in list(project.shots):
            await db.delete(shot)
        await db.flush()
        await pipeline.delete_project_assets(project_id)
        project.cover_url = None

    # Resume: clear error, keep existing shots/media (pipeline skips finished stages)
    project.error_msg = None
    project.final_video_url = None
    shots = list(project.shots or [])
    phase = "script" if (restart or not shots) else resolve_kepu_billing_phase(project)
    if phase == "compose":
        # Sử dụng các tác vụ soạn thảo chuyên dụng để tránh project_pipeline liên tục giữ lại toàn bộ video
        raise HTTPException(status_code=409, detail="素材已齐，请点击合成成片")
    if restart or not shots:
        # First run / restart — actually splitting storyboard
        project.status = ProjectStatus.SCRIPTING
        project.progress = 1
    elif phase == "assets":
        project.status = ProjectStatus.IMAGING
        project.progress = max(project.progress or 0, 18)
    elif phase == "videos":
        project.status = ProjectStatus.VIDEOING
        project.progress = max(project.progress or 0, 55)
    try:
        await create_task(
            db,
            user,
            TaskCreateRequest(
                domain="kepu",
                task_type="project_pipeline",
                dedupe_key=f"kepu:project_pipeline:{project_id}:{int(bool(restart))}:{phase}",
                payload={
                    "project_id": project_id,
                    "restart": bool(restart),
                    "phase": phase,
                    "pipeline_mode": project.pipeline_mode or "full",
                },
                project_id=project_id,
                targets=[
                    TaskTargetBind(target_type="project", target_id=project_id),
                ],
            ),
        )
    except ValueError as exc:
        await db.rollback()
        raise http_exception_for_value_error(exc) from exc
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/cancel", response_model=ProjectOut)
async def cancel_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    running = {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }
    if project.status not in running:
        raise HTTPException(status_code=400, detail="当前状态不可取消")

    await cancel_tasks_for_scope(db, user.id, project_id=project_id)
    pipeline.cancel_pipeline(project_id)
    project.status = ProjectStatus.CANCELLED
    project.error_msg = "用户取消"
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Delete a kepu project after detaching billing/task FK rows that block CASCADE."""
    project = await _get_owned_project(db, project_id, user)
    running = {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }
    if project.status in running:
        pipeline.cancel_pipeline(project_id)
        await cancel_tasks_for_scope(db, user.id, project_id=project_id)

    # Keep billing/task history; only clear project FK and child shot FKs so DELETE projects can succeed.
    shot_ids = select(Shot.id).where(Shot.project_id == project.id)
    await db.execute(
        update(TaskRun).where(TaskRun.shot_id.in_(shot_ids)).values(shot_id=None)
    )
    await db.execute(
        update(UsageEvent).where(UsageEvent.project_id == project.id).values(project_id=None)
    )
    await db.execute(
        update(TaskRun).where(TaskRun.project_id == project.id).values(project_id=None, shot_id=None)
    )

    # Remove published work if any
    work_result = await db.execute(select(Work).where(Work.project_id == project.id))
    work = work_result.scalar_one_or_none()
    if work:
        await db.delete(work)

    await pipeline.delete_project_assets(project_id)
    await db.delete(project)
    await db.commit()
    return {"ok": True, "id": project_id}


@router.get("/projects/{project_id}/events")
async def project_events(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _get_owned_project(db, project_id, user)
    queue = subscribe(project_id)
    bridge = asyncio.create_task(redis_bridge(project_id, queue))

    async def event_generator():
        try:
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {"event": "message", "data": json.dumps(payload, ensure_ascii=False)}
                    if payload.get("event") in {"done", "failed"}:
                        break
                except TimeoutError:
                    yield {"event": "ping", "data": "{}"}
        finally:
            bridge.cancel()
            unsubscribe(project_id, queue)

    return EventSourceResponse(event_generator())


@router.post("/projects/{project_id}/shots", response_model=ShotOut)
async def create_shot(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Shot:
    """Thêm một storyboard trống ở cuối phim."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shots = sorted(project.shots, key=lambda s: s.shot_no)
    next_no = (shots[-1].shot_no + 1) if shots else 1
    from app.services.seedance_segments import SegmentBeat, build_segment_script

    bgm = clip_shot_bgm(getattr(project, "bgm_lock", None))
    visual = "画面轻微动态，保持主体稳定"
    script = build_segment_script(
        [SegmentBeat(duration=4, kind="visual", text=visual)],
        bgm_mood=bgm,
    )
    shot = Shot(
        project_id=project.id,
        shot_no=next_no,
        duration=4,
        narration="",
        overlay_title=f"场景 {next_no:02d}",
        overlay_subtitle="",
        img_prompt=visual,
        video_prompt=script,
        segment_script=script,
        camera="slow pan",
        bgm_mood=bgm,
        status=ShotStatus.PENDING,
    )
    db.add(shot)
    await db.flush()
    await db.refresh(project, attribute_names=["shots"])
    _demote_after_edit(project)
    await db.commit()
    await db.refresh(shot)
    return shot


@router.delete("/projects/{project_id}/shots/{shot_id}", response_model=ProjectOut)
async def delete_shot(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Xóa một cảnh quay khỏi dự án và sắp xếp lại số thứ tự."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="Cảnh không tồn tại")
    if len(project.shots) <= 1:
        raise HTTPException(status_code=400, detail="Không thể xóa cảnh duy nhất còn lại của dự án")
    await db.execute(
        update(TaskRun).where(TaskRun.shot_id == shot.id).values(shot_id=None)
    )
    await db.delete(shot)
    await db.flush()
    await db.refresh(project, attribute_names=["shots"])
    ordered = sorted(project.shots, key=lambda s: s.shot_no)
    for idx, s in enumerate(ordered, start=1):
        s.shot_no = idx
    _demote_after_edit(project)
    await db.commit()
    await db.refresh(project, attribute_names=["shots"])
    return project


@router.post("/projects/{project_id}/shots/reorder", response_model=ProjectOut)
async def reorder_shots(
    project_id: int,
    body: ShotReorderIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Sắp xếp lại số lượt bắn theo shot_ids."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    existing = {s.id: s for s in project.shots}
    if set(body.shot_ids) != set(existing.keys()):
        raise HTTPException(status_code=400, detail="镜头列表不完整")
    for i, sid in enumerate(body.shot_ids, start=1):
        existing[sid].shot_no = i
    _demote_after_edit(project)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/image", response_model=ProjectOut)
async def upload_shot_image(
    project_id: int,
    shot_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Tải lên hình ảnh phản chiếu thay thế."""
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    content_type = (file.content_type or "").lower()
    allowed = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = allowed.get(content_type)
    if not ext:
        suffix = Path(file.filename or "").suffix.lower()
        ext = ".jpg" if suffix == ".jpeg" else suffix if suffix in {".jpg", ".png", ".webp", ".gif"} else ""
    if not ext:
        raise HTTPException(status_code=400, detail="仅支持 JPG / PNG / WebP / GIF")
    raw = await file.read(8 * 1024 * 1024 + 1)
    if not raw:
        raise HTTPException(status_code=400, detail="空文件")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="画面不能超过 8MB")
    sniffed = _image_ext_from_magic(raw)
    if not sniffed:
        raise HTTPException(status_code=400, detail="文件不是有效图片")
    ext = sniffed
    dest = storage.project_dir(project_id) / f"shot_{shot.id}_upload{ext}"
    dest.write_bytes(raw)
    shot.image_url = storage.publish_local(dest)
    shot.image_ark_url = None
    shot.video_url = None
    shot.last_frame_url = None
    shot.status = ShotStatus.IMAGE_READY
    shot.version += 1
    _demote_after_edit(project)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.patch("/projects/{project_id}/shots/{shot_id}", response_model=ShotOut)
async def update_shot(
    project_id: int,
    shot_id: int,
    body: ShotUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Shot:
    from app.models import Template
    from app.services.pipeline import clamp_shot_duration

    project = await _get_owned_project(db, project_id, user)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    data = body.model_dump(exclude_unset=True)
    if "segment_script" in data and data["segment_script"] is not None:
        from app.services.seedance_segments import (
            apply_segment_script_edit,
            replace_first_visual_in_script,
            replace_narration_in_script,
        )

        bgm = clip_shot_bgm(getattr(project, "bgm_lock", None) or shot.bgm_mood)
        script = str(data["segment_script"])
        # Tường thuật bật lên/khung hình đầu tiên được ghi lại vào tập lệnh trước để tránh bị ghi đè bởi tập lệnh cũ khi lưu.
        if "narration" in data and data["narration"] is not None:
            script = replace_narration_in_script(script, str(data["narration"]))
        if "img_prompt" in data and data["img_prompt"] is not None:
            script = replace_first_visual_in_script(script, str(data["img_prompt"]))
        normalized = apply_segment_script_edit(script, bgm_mood=bgm)
        data["segment_script"] = normalized["segment_script"]
        data["duration"] = normalized["duration"]
        data["video_prompt"] = normalized["video_prompt"]
        if normalized.get("narration"):
            data["narration"] = normalized["narration"]
        if normalized.get("img_prompt"):
            data["img_prompt"] = normalized["img_prompt"]
    if "duration" in data and data["duration"] is not None:
        from app.services.pipeline import get_shot_duration_bounds

        tpl = await db.get(Template, project.template_id)
        lo, hi = get_shot_duration_bounds(
            pipeline_mode=project.pipeline_mode or "full",
            tpl_min=tpl.shot_duration_min if tpl else 2,
            tpl_max=tpl.shot_duration_max if tpl else 8,
        )
        val = float(data["duration"])
        if val < lo or val > hi:
            tpl_name = tpl.name if tpl else ""
            raise HTTPException(
                status_code=400,
                detail=f"Thời lượng cảnh phải từ {int(lo)}s đến {int(hi)}s ({tpl_name or 'theo mẫu phong cách'}).",
            )
        data["duration"] = val
    if "bgm_mood" in data and data["bgm_mood"] is not None:
        data["bgm_mood"] = clip_shot_bgm(str(data["bgm_mood"]))
    # Khi văn bản tường thuật thực sự thay đổi (thay đổi trực tiếp tường thuật hoặc tường thuật mới do chuẩn hóa kịch bản đưa ra), toàn bộ đoạn âm thanh liên tục sẽ bị vô hiệu:
    # Bộ đệm chỉ kiểm tra sự tồn tại của tệp và không so sánh văn bản. Nếu không xóa sẽ dẫn đến lồng tiếng cũ và phụ đề mới.
    new_narration = data.get("narration")
    audio_dirty = (
        new_narration is not None
        and str(new_narration).strip() != str(shot.narration or "").strip()
    )
    for k, v in data.items():
        setattr(shot, k, v)
    # Invalidate downstream if visual prompts changed
    if "img_prompt" in data:
        shot.image_url = None
        shot.video_url = None
        shot.last_frame_url = None
        shot.video_skip_reason = None  # Màn hình thay đổi và kết luận chặn quyền riêng tư trở nên không hợp lệ.
        shot.status = ShotStatus.PENDING
    elif (
        "video_prompt" in data
        or "segment_script" in data
        or "duration" in data
        or "camera" in data
    ):
        shot.video_url = None
        shot.last_frame_url = None
        shot.video_skip_reason = None
    if audio_dirty:
        full_narration = storage.project_dir(project_id) / "full_narration.mp3"
        full_narration.unlink(missing_ok=True)
        for sibling in project.shots:
            sibling.audio_url = None
    # Thống nhất đưa trạng thái cuối cùng về giai đoạn tương ứng theo tiến độ vật chất và hủy nó vào phim (điểm cuối này đã bị bỏ qua trước đó và trạng thái sẽ bị kẹt ở DONE)
    _demote_after_edit(project)
    shot.version += 1
    await db.commit()
    await db.refresh(shot)
    return shot


@router.get("/projects/{project_id}/shots/{shot_id}/prompt-preview")
async def get_shot_prompt_preview(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lấy thông tin chi tiết prompt và các ảnh tham chiếu được dùng khi tạo ảnh cho phân cảnh."""
    cond = [Project.id == project_id]
    if not getattr(user, "is_admin", False):
        cond.append(Project.user_id == user.id)

    result = await db.execute(
        select(Project)
        .where(*cond)
        .options(selectinload(Project.shots), selectinload(Project.template))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Dự án không tồn tại")
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="Phân cảnh không tồn tại")

    from app.services.pipeline import (
        _locked_shot_prompt,
        _project_base_refs,
        previous_usable_shot,
        _project_image_negative,
        _image_size_for,
        _project_output_ratio,
    )
    from app.services.kepu_continuity import image_refs_for_shot, shot_image_ref

    shot_no = shot.shot_no
    prev = previous_usable_shot(list(project.shots), shot_no)
    base_refs = _project_base_refs(project)
    ref_urls = image_refs_for_shot(prev, base_refs)

    detailed_refs = []
    prev_ref = (prev.image_url or prev.image_ark_url) if prev else None
    if prev_ref:
        detailed_refs.append({
            "url": prev_ref,
            "type": "previous_shot",
            "label": f"Cảnh liền trước (Cảnh {prev.shot_no:02d})",
            "shot_no": prev.shot_no,
        })
    if project.ref_image_url:
        detailed_refs.append({
            "url": project.ref_image_url,
            "type": "project_ref",
            "label": "Ảnh tham chiếu dự án (Sản phẩm / Nhân vật)",
            "shot_no": None,
        })
    tpl_refs = list(((project.template.seedream_config or {}).get("ref_images") or [])) if project.template else []
    for idx, t_url in enumerate(tpl_refs, start=1):
        detailed_refs.append({
            "url": t_url,
            "type": "template_ref",
            "label": f"Ảnh mẫu phong cách #{idx}",
            "shot_no": None,
        })

    full_prompt = _locked_shot_prompt(project, shot.img_prompt)
    negative = _project_image_negative(project)
    aspect_ratio = _project_output_ratio(project) or "16:9"
    image_size = _image_size_for(project)
    image_model = (getattr(project, "image_model", None) or "").strip()
    style_prefix = project.template.style_prefix if project.template else ""

    return {
        "shot_id": shot.id,
        "shot_no": shot.shot_no,
        "full_prompt": full_prompt,
        "raw_prompt": shot.img_prompt,
        "style_prefix": style_prefix,
        "negative_prompt": negative,
        "ref_urls": ref_urls,
        "detailed_refs": detailed_refs,
        "image_model": image_model,
        "aspect_ratio": aspect_ratio,
        "image_size": image_size,
    }


@router.post("/projects/{project_id}/shots/{shot_id}/regen-image", response_model=ProjectOut)
async def regen_image(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    project.status = ProjectStatus.IMAGING
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        shot_id=shot_id,
        task_type="shot_regen_image",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/regen-video", response_model=ProjectOut)
async def regen_video(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    if (project.pipeline_mode or "full") == "image_text":
        raise HTTPException(status_code=400, detail="图文模式无需生成 AI 视频，请直接重新合成成片")
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot or not (shot.image_url or shot.image_ark_url):
        raise HTTPException(status_code=400, detail="请先生成该镜画面")
    project.status = ProjectStatus.VIDEOING
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        shot_id=shot_id,
        task_type="shot_regen_video",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/trim", response_model=ProjectOut)
async def trim_shot_video(
    project_id: int,
    shot_id: int,
    payload: ShotTrimIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot or not shot.video_url:
        raise HTTPException(status_code=400, detail="Cảnh quay chưa có video để cắt")
    if payload.end_sec <= payload.start_sec:
        raise HTTPException(status_code=400, detail="Thời gian kết thúc phải lớn hơn thời gian bắt đầu")

    src_path = storage.local_path_from_url(shot.video_url)
    pdir = storage.project_dir(project_id)
    if not src_path or not src_path.exists():
        if shot.video_url.startswith("http"):
            src_path = await storage.ensure_local_media(shot.video_url, pdir / f"shot_{shot.shot_no:03d}_src.mp4")
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy tệp video nguồn")

    ts = int(time.time())
    dest_filename = f"shot_{shot.shot_no:03d}_{ts}_trim.mp4"
    dest_path = pdir / dest_filename

    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{payload.start_sec:.3f}",
        "-to", f"{payload.end_sec:.3f}",
        "-i", str(src_path),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-movflags", "+faststart",
        str(dest_path),
    ]
    proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not dest_path.exists():
        logger.error("FFmpeg trim error: %s", proc.stderr)
        raise HTTPException(status_code=500, detail="Lỗi khi cắt video")

    target_dur = payload.end_sec - payload.start_sec
    shot.video_url = storage.publish_local(dest_path)
    shot.duration = round(target_dur, 3)
    shot.version += 1
    project.final_video_url = None
    _demote_after_edit(project)
    await db.commit()
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/shots/{shot_id}/regen-audio", response_model=ProjectOut)
async def regen_audio(
    project_id: int,
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = await _get_owned_project(db, project_id, user)
    _ensure_side_task_allowed(project)
    shot = next((s for s in project.shots if s.id == shot_id), None)
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")
    project.status = ProjectStatus.AUDIOING
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        shot_id=shot_id,
        task_type="shot_regen_audio",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/regen-audio", response_model=ProjectOut)
async def regen_all_audio(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Re-TTS all shots with current voice_id, then recompose final video."""
    project = await _get_owned_project(db, project_id, user)
    if project.status in {
        ProjectStatus.SCRIPTING,
        ProjectStatus.IMAGING,
        ProjectStatus.VIDEOING,
        ProjectStatus.AUDIOING,
        ProjectStatus.COMPOSING,
        ProjectStatus.AUDITING,
    }:
        raise HTTPException(status_code=409, detail="生成进行中，请稍后")
    if not project.shots:
        raise HTTPException(status_code=400, detail="暂无分镜，请先生成")
    project.status = ProjectStatus.AUDIOING
    project.progress = 80
    project.error_msg = None
    project.final_video_url = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        task_type="project_regen_audio",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/compose", response_model=ProjectOut)
async def compose_only(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Recompose final video from existing images/audio/(videos)."""
    project = await _get_owned_project(db, project_id, user)
    await _ensure_compose_allowed(db, user, project)
    if not project.shots or not (
        any(s.image_url for s in project.shots) or any(s.video_url for s in project.shots)
    ):
        raise HTTPException(status_code=400, detail="缺少分镜图或镜头视频，无法合成")
    project.status = ProjectStatus.COMPOSING
    project.progress = 90
    project.error_msg = None
    await db.commit()
    await _create_kepu_task(
        db,
        user,
        project_id=project_id,
        task_type="project_compose_only",
    )
    return await _get_owned_project(db, project_id, user)


@router.post("/projects/{project_id}/publish", response_model=WorkOut)
async def publish_work(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Work:
    project = await _get_owned_project(db, project_id, user)
    if project.status != ProjectStatus.DONE or not project.final_video_url:
        raise HTTPException(status_code=400, detail="成片未完成，无法发布")
    existing = await db.execute(select(Work).where(Work.project_id == project.id))
    work = existing.scalar_one_or_none()
    if work:
        work.title = project.title
        work.cover_url = project.cover_url
        work.video_url = project.final_video_url
    else:
        work = Work(
            project_id=project.id,
            user_id=user.id,
            title=project.title,
            cover_url=project.cover_url,
            video_url=project.final_video_url,
        )
        db.add(work)
    await db.commit()
    await db.refresh(work)
    return work


@router.get("/works", response_model=list[WorkOut])
async def list_works(db: AsyncSession = Depends(get_db)) -> list[Work]:
    result = await db.execute(
        select(Work).where(Work.visibility == "public").order_by(Work.id.desc()).limit(50)
    )
    return list(result.scalars().all())


@router.get("/quota")
async def quota(user: User = Depends(get_current_user)) -> dict:
    from app.config import get_settings

    settings = get_settings()
    return {
        "quota_left": user.quota_left,
        "quota_enabled": settings.quota_enabled,
        "unlimited": not settings.billing_enabled,
        "billing_enabled": settings.billing_enabled,
        "balance_fen": int(getattr(user, "balance_fen", 0) or 0),
        "frozen_fen": int(getattr(user, "frozen_fen", 0) or 0),
        "balance_yuan": round(int(getattr(user, "balance_fen", 0) or 0) / 100, 2),
        "markup": settings.billing_markup,
    }
