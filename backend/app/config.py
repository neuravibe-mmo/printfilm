from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.is_file() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PRINTFILM"
    debug: bool = True
    # Có in SQL gốc SQLAlchemy hay không (tắt theo mặc định để tránh vuốt màn hình; đặt SQL_ECHO=true khi bạn cần khắc phục sự cố SQL)
    sql_echo: bool = False
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7

    database_url: str = "postgresql+asyncpg://printfilm:change-me-strong-db-password@127.0.0.1:15432/printfilm"
    database_url_sync: str = "postgresql+psycopg2://printfilm:change-me-strong-db-password@127.0.0.1:15432/printfilm"
    # Nhóm kết nối Postgres (nền tảng tác vụ/API chung thống nhất)
    db_pool_size: int = 5
    db_max_overflow: int = 5
    db_pool_recycle_sec: int = 1800
    db_pool_timeout_sec: int = 30
    redis_url: str = "redis://127.0.0.1:6379/0"

    ark_api_key: str = ""
    ark_base_url: str = "https://www.tokenfree.com/v1"
    # Mô hình văn bản: Phiên bản mã nguồn mở đã sửa lỗi API mới TokenFree, mô hình được chọn ở chế độ nền
    openai_api_key: str = ""
    openai_base_url: str = "https://www.tokenfree.com/v1"
    # Domain REST API dùng chung (Flow video, ChatGPT2API image/chat)
    domain_web_2_api: str = "https://neuravibemmo.dpdns.org"
    # Ví dụ mặc định là kimi; phiên bản cuối cùng thực tế tuân theo các mô hình kênh phụ trợ + mặc định và có thể được thay đổi thành trò chuyện tìm kiếm sâu, v.v.
    model_llm: str = "kimi-k2.6"
    model_image: str = "doubao-seedream-5-0-260128"
    # Điểm truy cập Seedream 4.5 (tùy chọn; nếu không được định cấu hình, hãy chuyển sang model_image)
    model_image_45: str = ""
    model_video: str = "doubao-seedance-2-5-260628"
    # Điểm truy cập Seedance 2.0 (tùy chọn; nếu không được định cấu hình, chỉ MODEL_VIDEO sẽ được sử dụng)
    model_video_2: str = ""
    # Seedance 2.5 Phạm vi chính thức ~4–30 giây
    seedance_duration_min: int = 4
    seedance_duration_max: int = 30
    model_audio: str = "qwen-tts-2025-05-22"
    # Doubao Voice (openspeech) - một dòng sản phẩm khác với ARK_API_KEY
    volc_tts_app_id: str = ""
    volc_tts_access_key: str = ""
    volc_tts_resource_id: str = "seed-tts-2.0"
    volc_tts_speaker: str = "zh_female_cancan_uranus_bigtts"
    volc_tts_url: str = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"
    # Phiên bản mới của Khóa API bảng điều khiển (chọn một từ app_id/access_key, api_key được ưu tiên)
    volc_tts_api_key: str = ""
    # Thiết kế âm thanh: Khe S_ mua trên console được phân tách bằng dấu phẩy; nếu nó được định cấu hình và xác thực hoàn tất, truyện tranh sẽ chuyển sang voice_design
    volc_tts_voice_design_url: str = "https://openspeech.bytedance.com/api/v3/tts/voice_design"
    volc_tts_voice_design_speaker_ids: str = ""
    # Seedream: 2k|3k|4k hoặc WIDTHxHEIGHT và tổng số pixel >= 3686400 (khoảng 2560x1440)
    ark_image_size: str = "2k"
    ark_video_resolution: str = "480p"
    ark_video_ratio: str = "16:9"
    ark_video_poll_interval: float = 8.0
    ark_video_poll_timeout: float = 900.0
    # Parallel generation concurrency (per project)
    pipeline_image_concurrency: int = 3
    # TokenFree / API mới Giới hạn trên của việc quan sát đồng thời các tác vụ tạo hình ảnh (vượt quá giới hạn sẽ là 429)
    tokenfree_image_concurrency: int = 1
    # Giới hạn đồng thời chính thức của Seedance 2.5 là khoảng 10
    pipeline_video_concurrency: int = 10
    pipeline_audio_concurrency: int = 4
    # Giới hạn trên của video truyện tranh đồng thời dành cho một người dùng (gửi/đang chờ_poll cùng lúc); phần vượt quá vẫn còn trong hàng đợi chờ xử lý
    drama_user_video_job_limit: int = 12
    # Số lần thử tối đa cho một video bảng phân cảnh; nếu vượt quá sẽ trực tiếp thất bại và tránh bị mắc kẹt trong cùng một cảnh quay trong thời gian dài.
    drama_fragment_max_attempts: int = 3
    # Khoa học phổ thông Seedance vẫn có bản âm thanh: chỉ có hiệu ứng âm thanh vận hành/môi trường, không có lời nói và BGM
    kepu_seedance_sfx_audio: bool = True

    ark_mock: bool = False
    # Giới hạn trên của tính đồng thời trong quá trình của nền tảng tác vụ tích hợp sẵn (các vị trí công nhân trong toàn bộ trang web).
    task_runtime_max_concurrency: int = 4
    # Các vị trí công nhân đang được tiến hành bởi một người dùng cùng lúc (không bao gồm mục đăng ký chờ_poll).
    task_user_max_concurrency: int = 4
    # Bộ chọn Giới hạn trên của các truy vấn không chặn đồng thời ngược dòng trong mỗi vòng (tương tự như xử lý hàng loạt kênh sẵn sàng chọn NIO).
    task_poll_max_concurrency: int = 20
    # Khôi phục mồ côi: Đã thuê/đang chạy được yêu cầu xếp hàng đợi khi không có bản cập nhật nào dài hơn số giây này và không có coroutine nào được thực thi trong quy trình này.
    task_runtime_recover_grace_sec: int = 30
    # Cần quét các tác vụ đơn lẻ trong bao nhiêu giây trong quá trình hoạt động (được thực hiện trong thời gian đánh dấu đã lên lịch).
    task_runtime_orphan_check_sec: int = 30
    # Đánh dấu lập lịch Nhịp tim vượt quá số giây này và không được làm mới → Phần mềm Watchdog khởi động lại chu kỳ lập lịch.
    task_runtime_tick_stale_sec: int = 60
    # Nhịp tim của Bộ chọn chưa được làm mới quá số giây này → Phần mềm Watchdog khởi động lại bộ thăm dò.
    task_poll_stale_sec: int = 600
    # Khoảng thời gian kiểm tra của cơ quan giám sát (giây).
    task_runtime_watchdog_interval_sec: float = 5.0

    max_shot_duration: int = 30
    default_preview_resolution: str = "480p"
    new_user_quota: int = 5
    # Legacy flag; prefer billing_enabled
    quota_enabled: bool = False

    # Thanh toán bằng mã thông báo: khoản khấu trừ của người dùng = chi phí chính thức của TokenFree (billing_markup vẫn tương thích và sẽ không được nhân lên)
    billing_enabled: bool = False
    billing_markup: float = 1.0
    # bộ đệm định giá mã thông báo / thời lượng video; theo giá chính thức của bức tranh Zhang Sheng, hệ số này sẽ không được nhân lên (nếu không tiền thưởng 5 nhân dân tệ không thể đóng băng một bức tranh)
    billing_estimate_buffer: float = 1.2
    # Yuan per million tokens (provider cost)
    billing_seedance_video0: float = 46.0
    billing_seedance_video1: float = 28.0
    billing_llm_per_m: float = 5.0
    billing_seedream_per_m: float = 8.0
    billing_tts_per_m: float = 2.0
    # Kie: 1 tín chỉ tương đương với điểm RMB (khoảng $0,005 ≈ ¥0,035 → 3,5)
    billing_kie_fen_per_credit: float = 3.5
    # TokenFree / API mới: hạn ngạch→USD→RMB (500000 hạn ngạch = 1 USD)
    billing_usd_cny: float = 7.0
    # Fallback tokens when API omits usage
    billing_est_llm_tokens: int = 80_000
    # Seedream / gpt-image Khi không có hạn ngạch, việc thanh toán sẽ dựa trên giá mỗi sản phẩm, không còn 45.000 token × 8 nhân dân tệ/triệu
    billing_est_seedream_tokens: int = 45_000
    billing_est_tts_tokens: int = 5_000
    billing_est_seedance_tokens_per_sec: int = 32_000
    # Signup grant (fen)
    billing_signup_grant_fen: int = 500

    # Cửa sổ bật lên về mốc tiêu dùng của người dùng (nhắc nhở mỗi phút khấu trừ tích lũy một lần; mặc định 10000 = ¥100)
    billing_user_alert_enabled: bool = True
    billing_user_alert_interval_fen: int = 10000

    # Thông báo qua email về tổng chi phí của nền tảng (được tổng hợp bởi cost_fen ngược dòng)
    billing_admin_cost_alert_enabled: bool = False
    billing_admin_cost_alert_threshold_fen: int = 0
    billing_admin_cost_alert_emails: str = ""
    billing_admin_cost_alert_period: str = "monthly"
    billing_admin_cost_alert_last_period_key: str = ""
    billing_admin_cost_alert_last_level: int = 0

    # SMTP (email cảnh báo phí quản trị viên)
    smtp_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True

    # Epay (pay.gitcc.com)
    epay_api_url: str = "https://pay.gitcc.com"
    epay_pid: str = ""
    epay_key: str = ""
    epay_notify_url: str = ""
    epay_return_url: str = ""

    public_base_url: str = "http://127.0.0.1:8001"
    ffmpeg_path: str = "ffmpeg"
    ffprobe_path: str = "ffprobe"

    tos_endpoint: str = ""
    tos_bucket: str = ""
    tos_access_key: str = ""
    tos_secret_key: str = ""
    cdn_base: str = "http://localhost:8001/static"

    # Aliyun OSS — Tải lên phim/bảng phân cảnh đã hoàn thành; FFmpeg vẫn đọc các tập tin cục bộ
    oss_enabled: bool = False
    oss_endpoint: str = "oss-cn-beijing.aliyuncs.com"
    oss_region: str = "cn-hangzhou"
    oss_bucket: str = ""
    oss_folder: str = "kepu"
    oss_access_key_id: str = ""
    oss_access_key_secret: str = ""
    # Tên miền tùy chỉnh tùy chọn; nếu trống, hãy sử dụng https://{bucket}.{endpoint}
    oss_public_base: str = ""
    # Tạo liên kết: đầu tiên đặt đĩa và quay lại /static, sau đó xếp hàng để tải lên không đồng bộ và chèn lấp URL OSS
    oss_upload_async: bool = True
    oss_upload_queue: str = "oss"

    cors_origins: str = (
        "http://localhost:5180,http://127.0.0.1:5180,"
        "http://localhost:5181,http://127.0.0.1:5181,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )
    # Comma-separated emails promoted to admin on startup (existing users only)
    admin_bootstrap_emails: str = ""


@lru_cache
def get_settings() -> Settings:
    base = Settings()
    try:
        from app.services.model_settings import get_overlay_dict

        overlay = get_overlay_dict()
        if overlay:
            return base.model_copy(update=overlay)
    except Exception:  # noqa: BLE001
        pass
    return base


def reload_settings() -> Settings:
    get_settings.cache_clear()
    try:
        from app.services.oss import reset_oss_client

        reset_oss_client()
    except Exception:  # noqa: BLE001
        pass
    return get_settings()
