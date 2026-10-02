/** Phương tiện nút Canvas: xác định loại có thể phát và tên tệp tải xuống */
import { fetchMediaBlob, triggerBlobDownload } from './clientDownload'

const VIDEO_EXT = /\.(mp4|webm|mov)(\?|#|$)/i
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i

/** Liệu URL phim đã hoàn thành có thể phát dưới dạng video hay không */
export function isPlayableVideoUrl(url: string) {
  return VIDEO_EXT.test(url)
}

/** URL có phải là tệp âm thanh không? */
export function isAudioUrl(url: string) {
  return AUDIO_EXT.test(url)
}

/** Tạo xương sống tên tệp an toàn từ tên hiển thị */
export function sanitizeMediaBasename(label: string) {
  const cleaned = (label || '未命名')
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
  return cleaned || '未命名'
}

/** Suy ra phần mở rộng từ URL */
export function extFromMediaUrl(url: string, fallback: string) {
  const path = url.split('?')[0]?.split('#')[0] || ''
  const match = path.match(/\.([a-z0-9]{2,5})$/i)
  return match ? match[1].toLowerCase() : fallback
}

/** Tên file tải xuống tổng hợp */
export function canvasMediaFilename(label: string, url: string, fallbackExt: string) {
  return `${sanitizeMediaBasename(label)}.${extFromMediaUrl(url, fallbackExt)}`
}

/** Kéo và kích hoạt tải xuống trình duyệt; mở một tab mới khi tên miền chéo không thành công */
export async function downloadCanvasMedia(url: string, filename: string) {
  try {
    const blob = await fetchMediaBlob(url)
    triggerBlobDownload(blob, filename)
  } catch {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener noreferrer'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}

/** Lưu văn bản dưới dạng tệp và tải xuống */
export function downloadCanvasText(text: string, label: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  triggerBlobDownload(blob, `${sanitizeMediaBasename(label)}.txt`)
}
