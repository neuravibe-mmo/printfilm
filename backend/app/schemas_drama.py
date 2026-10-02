"""Pydantic schemas for the drama module."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas_tasks import TaskRunBriefOut


class DramaProjectCreate(BaseModel):
    title: str = Field(default="未命名漫剧", max_length=200)
    description: str | None = None
    source: str = Field(default="", description="原始创意文案")
    episode_count: int = Field(default=12, ge=1, le=120)
    image_style_id: str = Field(default="")
    # script=phác thảo quá trình đa dạng; canvas=vải miễn phí
    workflow: str = Field(default="script", description="script | canvas")
    params: dict[str, Any] | None = None


class DramaProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    content: dict | list | None = None
    params: dict[str, Any] | None = None


class DramaScriptOut(BaseModel):
    id: int
    name: str
    source: str | None = None
    summary: dict | None = None
    episode_content: dict | list | None = None
    params: dict | None = None
    project_id: int

    model_config = {"from_attributes": True}


class DramaAssetOut(BaseModel):
    id: int
    type: str
    asset_type: str
    name: str | None = None
    cover: str | None = None
    url: str | None = None
    params: dict | None = None
    derive_id: str | None = None
    project_id: int
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class DramaProjectUsageStats(BaseModel):
    """Mức sử dụng tích lũy của một truyện tranh: chi phí và số lượng hình ảnh/video."""

    charge_fen: int = 0
    charge_yuan: float = 0.0
    cost_fen: int = 0
    cost_yuan: float = 0.0
    tokens: int = 0
    calls: int = 0
    image_gens: int = 0
    video_gens: int = 0


class SeedAssetsFromScriptOut(BaseModel):
    """Thống kê kết quả trích xuất/làm mới nội dung từ tập lệnh."""

    assets: list[DramaAssetOut] = Field(default_factory=list)
    created_count: int = 0
    prompts_refreshed: int = 0
    props_updated: int = 0
    llm_errors: list[str] = Field(default_factory=list)
    status: str = "done"
    message: str | None = None


class DramaFragmentOut(BaseModel):
    id: int
    episode_id: int
    sort_order: int
    content: str
    cover: str = ""
    video: str = ""
    duration_sec: int | None = None
    params: dict | None = None
    asset_ids: list[int] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DramaEpisodeOut(BaseModel):
    id: int
    name: str
    params: dict | None = None
    project_id: int
    fragments: list[DramaFragmentOut] = Field(default_factory=list)
    active_tasks: list[TaskRunBriefOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DramaEpisodeUpdate(BaseModel):
    name: str | None = None
    params: dict | None = None


class DramaProjectOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None = None
    content: dict | list | None = None
    params: dict | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    script: DramaScriptOut | None = None
    asset_count: int = 0
    episode_count: int = 0
    # script | canvas
    workflow: str = "script"
    usage: DramaProjectUsageStats = Field(default_factory=lambda: DramaProjectUsageStats())
    active_tasks: list[TaskRunBriefOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DramaProjectListItem(BaseModel):
    id: int
    title: str
    description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    episode_count: int = 0
    asset_count: int = 0
    has_script: bool = False
    cover_url: str | None = None
    cover_pending: bool = False
    # script | canvas
    workflow: str = "script"
    usage: DramaProjectUsageStats = Field(default_factory=lambda: DramaProjectUsageStats())
    active_tasks: list[TaskRunBriefOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DramaScriptSummaryRequest(BaseModel):
    project_id: int
    creative: str | None = None
    episode_count: int | None = None
    image_style_id: str | None = None


class DramaEpisodeScriptRequest(BaseModel):
    project_id: int
    # Phù hợp với dự án ban đầu: được tạo theo từng tập theo mặc định, giảm nguy cơ "chỉ một nửa sản lượng" do hết thời gian/cắt ngắn
    batch_size: int = Field(default=1, ge=1, le=12)
    # Buộc viết lại: xóa văn bản hiện có (giữ lại tên bộ sưu tập), sau đó tạo một từ nhắc mới
    force: bool = False
    # Chỉ tối ưu hóa/tạo tập này; được sử dụng với bản nháp cho "Dán tập lệnh → Tối ưu hóa AI"
    episode_number: int | None = Field(default=None, ge=1, le=120)
    draft: str | None = Field(default=None, max_length=50000)
    # tối ưu hóa=tối ưu hóa dự thảo; tóm tắt=sáng tạo → trừu tượng; nội dung=sáng tạo + tóm tắt → văn bản chính; đầy đủ = tóm tắt bằng một cú nhấp chuột + văn bản chính; tóm tắt = văn bản chính → sáng tạo + tóm tắt
    generate_mode: str | None = Field(default=None, max_length=32)
    # Tùy chọn: Viết ý tưởng sáng tạo cho tập này trước khi tạo (và lưu)
    creative: str | None = Field(default=None, max_length=20000)
    title: str | None = Field(default=None, max_length=40)


class DramaAddEpisodeRequest(BaseModel):
    project_id: int
    title: str | None = Field(default=None, max_length=40)


class DramaConfirmEpisodeRequest(BaseModel):
    project_id: int
    episode_number: int = Field(ge=1, le=120)


class DramaConfirmEpisodeOut(BaseModel):
    episode: DramaEpisodeOut
    assets_status: str = "done"
    created_count: int = 0


class DramaAssetCreate(BaseModel):
    project_id: int
    type: str = "none"
    asset_type: str = "image"
    name: str | None = None
    cover: str | None = None
    url: str | None = None
    params: dict | None = None


class DramaAssetUpdate(BaseModel):
    type: str | None = None
    asset_type: str | None = None
    name: str | None = None
    cover: str | None = None
    url: str | None = None
    params: dict | None = None


class DramaImageGenerateRequest(BaseModel):
    project_id: int
    asset_id: int | None = None
    prompt: str
    name: str | None = None
    asset_type_kind: str = "character"
    # ID kiểu tích hợp (có thể được mặc định, dự án/tập lệnh dự phòng params.image_style_id)
    image_style_id: str | None = None
    # ID mô hình giao diện người dùng: seedream-5.0 / seedream-4.5
    model_id: str | None = None
    # Tỷ lệ đầu ra, ký tự mặc định 3:4
    aspect_ratio: str | None = None
    # Độ phân giải 3K / 4K
    resolution: str | None = None


class DramaVideoGenerateRequest(BaseModel):
    project_id: int
    asset_id: int
    prompt: str
    # Frontend tên ngắn hạt giống-2.5 / hạt giống-1.5 hoặc điểm truy cập đầy đủ
    model_id: str | None = None
    aspect_ratio: str | None = None
    resolution: str | None = None
    duration_sec: int | None = None
    image_style_id: str | None = None
    # Nội dung tham chiếu được đưa vào bởi kết nối canvas (được hợp nhất với văn bản @asset:id)
    reference_asset_ids: list[int] = Field(default_factory=list)


class DramaVoicePromptRequest(BaseModel):
    project_id: int
    asset_id: int


class DramaVoiceGenerateRequest(BaseModel):
    project_id: int
    asset_id: int | None = None
    name: str | None = None
    voice_prompt: str = Field(description="音色描述，用于 TTS 试听与 Seedance reference_audio")
    sample_text: str | None = Field(default=None, description="试听台词，缺省自动生成")
    speaker: str | None = Field(default=None, description="可选 TTS speaker 覆盖")
    character_asset_id: int | None = Field(
        default=None,
        description="关联角色资产 ID，用于 voice_design image_prompt",
    )


class DramaFragmentSaveItem(BaseModel):
    id: int | None = None
    sort_order: int = 0
    content: str = ""
    cover: str = ""
    video: str = ""
    duration_sec: int | None = None
    params: dict | None = None
    asset_ids: list[int] = Field(default_factory=list)


class DramaSaveFragmentsRequest(BaseModel):
    fragments: list[DramaFragmentSaveItem]


class DramaGenerateRequest(BaseModel):
    fragment_ids: list[int] | None = None
    # Model video: Id thư mục Backend TokenFree
    model_id: str | None = Field(default=None, max_length=64)


class DramaComposeEpisodeRequest(BaseModel):
    # Fragment_ids Chỉ ghép các đoạn phim được chỉ định; Không có nghĩa là tất cả cảnh quay từ các video hiện có trong tập này
    fragment_ids: list[int] | None = None


class DramaPlanFragmentsRequest(BaseModel):
    # buộc Có ghi đè các video/bảng phân cảnh được sửa đổi bằng tay hiện có hay không (mặc định việc cắt lại AI một tập là đúng)
    force: bool = True
    # fallback_rules Có quay lại phân đoạn quy tắc khi LLM không thành công hay không
    fallback_rules: bool = True
    # Skill_ids Kỹ năng đặc vụ được đưa vào lần này; Không có nghĩa là tất cả đều được bật, [] có nghĩa là không được tiêm
    skill_ids: list[int] | None = None
    # subtitle_enabled Có thêm lời nhắc phụ đề vào tập này hay không; Không có nghĩa là cài đặt hiện tại của tập sẽ được sử dụng.
    subtitle_enabled: bool | None = None


class DramaActivateVideoVersionRequest(BaseModel):
    # version_id Id phiên bản phim lịch sử (params.video_versions[].id)
    version_id: str = Field(..., min_length=1, max_length=128)


class DramaActivateImageVersionRequest(BaseModel):
    # version_id id phiên bản lịch sử hình ảnh nội dung (params.image_versions[].id)
    version_id: str = Field(..., min_length=1, max_length=128)


class DramaCanvasSaveRequest(BaseModel):
    project_id: int
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


class DramaChatRequest(BaseModel):
    message: str
    project_id: int | None = None


class DramaRouteRequest(BaseModel):
    message: str
