/** Nội dung truyện tranh đã có hình ảnh chưa (do AI tạo hoặc tải lên cục bộ) */
import type { DramaAsset } from '../api/drama'

// Đọc URL xem trước có thể có từ các thông số (đồng bộ hóa canvas, v.v.)
function readParamsMediaUrl(asset: DramaAsset): string {
  const params = asset.params
  if (!params || typeof params !== 'object') return ''
  const record = params as Record<string, unknown>
  for (const key of ['mediaUrl', 'previewUrl', 'imageUrl']) {
    const value = String(record[key] || '').trim()
    if (value) return value
  }
  const gen = record.generation
  if (gen && typeof gen === 'object') {
    const g = gen as Record<string, unknown>
    for (const key of ['cover', 'url', 'imageUrl']) {
      const value = String(g[key] || '').trim()
      if (value) return value
    }
  }
  return ''
}

// Nội dung đã có hình ảnh hợp lệ chưa
export function dramaAssetHasImage(asset: DramaAsset): boolean {
  if ((asset.cover || '').trim() || (asset.url || '').trim()) return true
  return Boolean(readParamsMediaUrl(asset))
}

// Bạn vẫn cần tạo hình ảnh (nếu không có hình ảnh và nội dung âm thanh không thuần túy, bạn có thể tham gia nhóm theo đợt)
export function dramaAssetNeedsImageGeneration(asset: DramaAsset): boolean {
  const kind = (asset.type || '').toLowerCase()
  if (['voice', 'video', 'audio', 'text'].includes(kind)) return false
  return !dramaAssetHasImage(asset)
}

// Sao chép nút hình ảnh thẻ/cửa sổ bật lên (queueLabel là bản sao trạng thái hàng đợi, ưu tiên được đưa ra khi có giá trị)
export function dramaAssetImageGenButtonLabel(
  asset: DramaAsset,
  queueLabel: string | null,
): string {
  if (queueLabel) return queueLabel
  return dramaAssetHasImage(asset) ? '重新生成形象' : '生成形象'
}
