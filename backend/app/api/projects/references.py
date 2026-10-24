from __future__ import annotations

import json
import logging
from pathlib import Path
import time
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import Project, User
from app.schemas import (
    CharacterPromptGenerateOut,
    CharacterPromptGenerateRequest,
    ContentExpandOut,
    ContentExpandRequest,
    GenerateRefImageRequest,
    ProjectOut,
    VoicePreviewOut,
    VoicePreviewRequest,
)
from app.services import pipeline, storage
from app.services.ark import get_ark
from app.services.billing import record_llm_chat_line, run_billed_ephemeral
from app.services.billing.http import http_exception_for_value_error
from app.services.voices import ensure_voice_preview, list_voices
from app.api.projects.common import _RUNNING_STATUSES, _get_owned_project

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/voices")
async def get_voices() -> list[dict]:
    return list_voices()


@router.get("/media-models")
async def get_media_models() -> dict:
    from app.services.media_catalog import catalog_payload

    return catalog_payload()


@router.post("/voices/preview", response_model=VoicePreviewOut)
async def preview_voice(
    body: VoicePreviewRequest,
    user: User = Depends(get_current_user),
) -> VoicePreviewOut:
    try:
        url = await ensure_voice_preview(body.voice_id)
        return VoicePreviewOut(url=url, voice_id=body.voice_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


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
                    "Phân tích chi tiết không gian bối cảnh trong ảnh: loại phòng hoặc địa điểm ngoài trời, phong cách kiến trúc và nội thất, ánh sáng chủ đạo, màu sắc và đạo cụ bày trí bằng tiếng Việt để làm prompt dựng bối cảnh video AI. "
                    "CHỈ mô tả môi trường không gian xung quanh, BỎ QUA mọi sản phẩm / bỏ qua hàng hóa / bỏ qua vật thể thương mại và nhân vật / con người không được phép có trong ảnh."
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
            "Nhiệm vụ của bạn là tạo ra một đoạn mô tả THUẦN TÚY VỀ KHÔNG GIAN BỐI CẢNH (1-2 câu tiếng Việt) phù hợp nhất với chủ đề video, "
            "bao gồm: loại không gian (studio hiện đại, phòng khách ấm cúng, quán cà phê, góc làm việc...), phong cách kiến trúc / nội thất, "
            "nguồn ánh sáng (ánh sáng tự nhiên qua cửa sổ, đèn neon, ánh sáng studio 3 điểm dịu nhẹ) và chiều sâu không gian. "
            "TUYỆT ĐỐI KHÔNG được đề cập đến sản phẩm, tên sản phẩm, đặc điểm sản phẩm, chất liệu sản phẩm, bao bì sản phẩm hay bất kỳ vật thể hàng hóa nào trong mô tả. "
            "TUYỆT ĐỐI KHÔNG được đề cập đến nhân vật, con người, người mẫu, diễn viên hay bất kỳ hình dáng người nào trong mô tả. "
            "Chỉ mô tả môi trường xung quanh: phòng, bàn, tường, cửa sổ, cây cối, ánh sáng, màu sắc tổng thể của không gian. "
            "Nếu có thông tin từ ảnh tham chiếu, BẮT BUỘC PHẢI bám sát không gian và tone màu của ảnh tham chiếu, NHƯNG bỏ qua mọi sản phẩm/vật thể hàng hóa và nhân vật/con người có trong ảnh. "
            "Yêu cầu: CHỈ trả về trực tiếp đoạn văn bản mô tả bối cảnh không gian, không thêm ngoặc kép hay lời dẫn."
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
        if target_type == "scene":
            user_parts.append(
                f"Chủ đề video (CHỈ dùng để suy luận không gian phù hợp, KHÔNG mô tả sản phẩm trong chủ đề): {topic}"
            )
        else:
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
        raise HTTPException(status_code=409, detail="Dự án đang trong quá trình tạo video, không thể đổi ảnh")

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
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ JPG / PNG / WebP / GIF")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Tập tin rỗng")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ảnh tham chiếu không được vượt quá 8MB")

    stamp = int(time.time() * 1000)
    prefix = "ref_image" if ref_type == "character" else f"{ref_type}_image"
    filename = f"{prefix}_{stamp}{ext}"
    p_dir = storage.project_dir(project_id)

    # Dọn dẹp các ảnh tham chiếu cũ cùng loại trước đó để không bị trùng lặp và rác ổ đĩa
    old_patterns = [f"{prefix}_*", f"{prefix}.*"]
    for pat in old_patterns:
        for old_f in p_dir.glob(pat):
            try:
                if old_f.is_file():
                    old_f.unlink()
            except Exception:
                pass

    dest = p_dir / filename
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


@router.post("/projects/{project_id}/generate-ref-image", response_model=ProjectOut)
async def generate_project_ref_image(
    project_id: int,
    body: GenerateRefImageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Generate a reference image directly from prompt text via neuravibemmo.dpdns.org."""
    project = await _get_owned_project(db, project_id, user)
    if project.status in _RUNNING_STATUSES:
        raise HTTPException(status_code=409, detail="Dự án đang trong quá trình tạo video, không thể đổi ảnh")

    prompt = (body.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Mô tả không được để trống")

    ref_type = body.ref_type or "character"
    aspect_ratio = "1:1" if ref_type != "scene" else (project.output_ratio or "16:9")

    # Gọi API tạo ảnh ChatGPT2API (https://neuravibemmo.dpdns.org/api/chatgpt2api/generate)
    from app.services.drama.chatgpt_image_api import generate_chatgpt_image

    url = ""
    try:
        url = await generate_chatgpt_image(
            prompt,
            size="1024x1024" if ref_type != "scene" else None,
            aspect_ratio=aspect_ratio,
            project_id=project_id,
        )
    except Exception as chatgpt_err:
        logger.warning("ChatGPT2API tạo ảnh tham chiếu thất bại: %s; thử fallback qua Ark", chatgpt_err)
        try:
            from app.services.ark import get_ark

            ark = get_ark()
            res = await ark.gen_image(
                prompt,
                project_id=project_id,
                aspect_ratio=aspect_ratio,
            )
            url = res.local_url or res.remote_url or ""
        except Exception as ark_err:
            logger.error("Tạo ảnh tham chiếu thất bại: %s", ark_err)
            raise HTTPException(status_code=502, detail=f"Tạo ảnh tham chiếu thất bại: {str(ark_err)[:200]}") from ark_err

    if not url:
        raise HTTPException(status_code=502, detail="Không nhận được hình ảnh từ dịch vụ AI")

    if ref_type == "product":
        project.product_image_url = url
        project.product_prompt = prompt
    elif ref_type == "scene":
        project.scene_image_url = url
        project.scene_prompt = prompt
    else:
        project.ref_image_url = url
        project.character_prompt = prompt

    await db.commit()
    return await _get_owned_project(db, project_id, user)
