/** Bản vẽ truyện tranh: tùy chọn mô hình/tỷ lệ/định nghĩa (danh sách mô hình lấy từ thư mục TokenFree phụ trợ) */

export type ImageGenerationModelId = string

export type GenerationAspectRatioId =
  | 'auto'
  | '16:9'
  | '21:9'
  | '9:16'
  | '4:3'
  | '3:4'
  | '1:1'

export type GenerationResolution = '3K' | '4K'

export type ImageGenerationOptions = {
  image_style_id?: string
  model_id: ImageGenerationModelId
  aspect_ratio: GenerationAspectRatioId
  resolution: GenerationResolution
}

/** Danh sách định nghĩa hình ảnh */
export const GENERATION_RESOLUTION_OPTIONS: GenerationResolution[] = ['3K', '4K']

/** Danh sách tỷ lệ */
export const GENERATION_ASPECT_RATIO_OPTIONS: Array<{
  id: GenerationAspectRatioId
  label: string
}> = [
  { id: 'auto', label: 'Tự động' },
  { id: '16:9', label: '16:9' },
  { id: '21:9', label: '21:9' },
  { id: '9:16', label: '9:16' },
  { id: '4:3', label: '4:3' },
  { id: '3:4', label: '3:4' },
  { id: '1:1', label: '1:1' },
]

/** Mô hình biểu đồ thô được cung cấp bởi /api/media-models; chỉ có id mặc định được sử dụng ở đây. */
export const IMAGE_GENERATION_MODELS: Array<{
  id: ImageGenerationModelId
  label: string
  description: string
}> = []

/** Tùy chọn ảnh thô mặc định (bố cục dọc của ký tự) */
export const DEFAULT_IMAGE_GENERATION_OPTIONS: ImageGenerationOptions = {
  model_id: '',
  aspect_ratio: '3:4',
  resolution: '3K',
}

/** Bố cục ngang mặc định của cảnh */
export function defaultOptionsForAssetKind(kind: string | undefined | null): ImageGenerationOptions {
  const k = String(kind || '').toLowerCase()
  if (k === 'scene') {
    return { model_id: DEFAULT_IMAGE_GENERATION_OPTIONS.model_id, aspect_ratio: '16:9', resolution: '3K' }
  }
  return { ...DEFAULT_IMAGE_GENERATION_OPTIONS }
}

/** Tỷ lệ định dạng·Bản sao kích hoạt độ rõ ràng */
export function formatOutputSettingsLabel(
  aspectRatio: GenerationAspectRatioId,
  resolution: GenerationResolution,
  autoLabel = 'Tự động',
): string {
  if (aspectRatio === 'auto') return `${autoLabel} · ${resolution}`
  return `${aspectRatio} · ${resolution}`
}

/** Phân tích tên hiển thị mô hình (dự phòng id khi không có thư mục) */
export function getImageModelLabel(modelId: string | undefined | null): string {
  const id = (modelId || '').trim()
  return id || '图片模型'
}

/** Bất kỳ chuỗi nào không trống đều có thể được sử dụng làm id mô hình biểu đồ */
export function isImageGenerationModelId(id: string): id is ImageGenerationModelId {
  return Boolean((id || '').trim())
}
