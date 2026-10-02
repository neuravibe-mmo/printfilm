/** URL xem trước kiểu màn hình truyện tranh (jpg/png công khai → tĩnh phụ trợ → trình giữ chỗ svg) */
import type { ImageStyleId } from './dramaImageStyles'

// Quay lại đường dẫn gốc công khai ở giao diện người dùng
function publicBase(): string {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
}

// Trả về đường dẫn gốc API (để xem trước /static/…)
function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE
  if (typeof raw === 'string' && raw.trim()) {
    return raw.replace(/\/$/, '')
  }
  return ''
}

// Trả về danh sách các URL đề xuất xem trước kiểu (theo mức độ ưu tiên)
export function getDramaImageStylePreviewCandidates(styleId: ImageStyleId): string[] {
  const pub = publicBase()
  const urls = [
    `${pub}image-styles/${styleId}.jpg`,
    `${pub}image-styles/${styleId}.png`,
  ]
  const api = apiBase()
  if (api) {
    urls.push(`${api}/static/drama/image-styles/${styleId}.png`)
    urls.push(`${api}/static/drama/image-styles/${styleId}.jpg`)
  }
  urls.push(`${pub}image-styles/${styleId}.svg`)
  return urls
}

// Trả về URL xem trước kiểu (ưu tiên jpg)
export function getDramaImageStylePreviewUrl(styleId: ImageStyleId): string {
  return getDramaImageStylePreviewCandidates(styleId)[0]
}

// Quay lại phần giữ chỗ xem trước kiểu SVG
export function getDramaImageStylePreviewFallbackUrl(styleId: ImageStyleId): string {
  const candidates = getDramaImageStylePreviewCandidates(styleId)
  return candidates[candidates.length - 1]
}
