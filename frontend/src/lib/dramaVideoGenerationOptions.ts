/** Comic Canvas/Episode: Tùy chọn tạo video (danh sách mô hình lấy từ thư mục TokenFree phụ trợ) */

export type VideoGenerationModelId = string

export type VideoAspectRatio = '9:16' | '16:9' | '1:1'
export type VideoResolution = '480p' | '720p' | '1080p'

export type VideoGenerationOptions = {
  image_style_id?: string
  model_id: VideoGenerationModelId
  aspect_ratio: VideoAspectRatio
  resolution: VideoResolution
  duration_sec: number
}

export const VIDEO_ASPECT_RATIO_OPTIONS: VideoAspectRatio[] = ['9:16', '16:9', '1:1']
export const VIDEO_RESOLUTION_OPTIONS: VideoResolution[] = ['480p', '720p', '1080p']
export const VIDEO_DURATION_PRESETS = [5, 8, 10, 15] as const
export const VIDEO_DURATION_MIN = 4
export const VIDEO_DURATION_MAX = 30

export const DEFAULT_VIDEO_GENERATION_OPTIONS: VideoGenerationOptions = {
  model_id: '',
  aspect_ratio: '9:16',
  resolution: '720p',
  duration_sec: 8,
}

/** Thời gian kẹp đạt phạm vi cho phép */
export function clampVideoDuration(sec: number) {
  const n = Math.round(Number(sec) || DEFAULT_VIDEO_GENERATION_OPTIONS.duration_sec)
  return Math.min(VIDEO_DURATION_MAX, Math.max(VIDEO_DURATION_MIN, n))
}

/** Tỷ lệ định dạng · Rõ ràng */
export function formatVideoOutputLabel(
  aspectRatio: VideoAspectRatio,
  resolution: VideoResolution,
) {
  return `${aspectRatio} · ${resolution}`
}

/** Phân tích tên hiển thị mô hình (dự phòng id khi không có thư mục) */
export function getVideoModelLabel(modelId: string | undefined | null) {
  const id = (modelId || '').trim()
  return id || '视频模型'
}

/** Bất kỳ chuỗi nào không trống đều có thể được sử dụng làm id mô hình video (thư mục TokenFree phụ trợ) */
export function isVideoGenerationModelId(id: string): id is VideoGenerationModelId {
  return Boolean((id || '').trim())
}

/** Khôi phục tùy chọn video từ dữ liệu nút */
export function readVideoGenerationOptions(raw: unknown): VideoGenerationOptions {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const modelId = String(row.model_id || '').trim()
  const aspect = String(row.aspect_ratio || '')
  const resolution = String(row.resolution || '')
  return {
    image_style_id: typeof row.image_style_id === 'string' ? row.image_style_id : undefined,
    model_id: modelId || DEFAULT_VIDEO_GENERATION_OPTIONS.model_id,
    aspect_ratio: VIDEO_ASPECT_RATIO_OPTIONS.includes(aspect as VideoAspectRatio)
      ? (aspect as VideoAspectRatio)
      : DEFAULT_VIDEO_GENERATION_OPTIONS.aspect_ratio,
    resolution: VIDEO_RESOLUTION_OPTIONS.includes(resolution as VideoResolution)
      ? (resolution as VideoResolution)
      : DEFAULT_VIDEO_GENERATION_OPTIONS.resolution,
    duration_sec: clampVideoDuration(Number(row.duration_sec)),
  }
}
