/** Shared helpers for drama project workspace steps. */
import type { DramaEpisodeBody, DramaProject, DramaScript } from '../../api/drama'

/** Căn chỉnh với phần phụ trợ MIN_EPISODE_CONTENT_CHARS: văn bản quá ngắn được coi là không đầy đủ */
export const MIN_EPISODE_BODY_CHARS = 500
export const MIN_EPISODE_CREATIVE_CHARS = 20

export type OutlineDirectoryEpisode = {
  episodeNumber: number
  title: string
  creative?: string
  summary?: string
  body?: string
  origin?: string
}

// Phân tích tập_nội dung thành mảng tập
export function parseEpisodeBodies(script: DramaScript | null | undefined): DramaEpisodeBody[] {
  const raw = script?.episode_content
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.episodes)) return raw.episodes
  return []
}

// Số ký tự văn bản sau khi xóa khoảng trắng
export function episodeBodyCharLen(text: string | undefined): number {
  return (text || '').replace(/\s/g, '').length
}

// Việc bổ sung thủ công (chờ người dùng đăng tập lệnh) sẽ không được hệ thống tự động lấp đầy
export function isManualEpisode(ep: DramaEpisodeBody | undefined): boolean {
  return ep?.origin === 'manual'
}

// Văn bản có đủ dài để chuyển sang bước tiếp theo không?
export function isSubstantialEpisodeBody(body: string | undefined): boolean {
  return episodeBodyCharLen(body) >= MIN_EPISODE_BODY_CHARS
}

export function isSubstantialEpisodeCreative(creative: string | undefined): boolean {
  return episodeBodyCharLen(creative) >= MIN_EPISODE_CREATIVE_CHARS
}

// Đã có ít nhất một tập chưa?
export function hasSubstantialEpisode(bodies: DramaEpisodeBody[]): boolean {
  return bodies.some((ep) => isSubstantialEpisodeBody(ep.body))
}

// Số tập vẫn còn thiếu trong quy trình tự động (bỏ qua các tập trống thủ công)
export function autoMissingEpisodeCount(bodies: DramaEpisodeBody[], target: number): number {
  const byNumber = new Map<number, DramaEpisodeBody>()
  for (const ep of bodies) {
    const num = ep.episodeNumber || 0
    if (num >= 1) byNumber.set(num, ep)
  }
  let missing = 0
  const total = Math.max(target, 0)
  for (let num = 1; num <= total; num += 1) {
    const ep = byNumber.get(num)
    if (!ep) {
      missing += 1
      continue
    }
    if (isSubstantialEpisodeBody(ep.body)) continue
    if (isManualEpisode(ep)) continue
    missing += 1
  }
  return missing
}

// Xác định xem đó có phải là tiêu đề được đặt giữ chỗ hay không (chẳng hạn như "Tập 1", "Tập 1", "Tập 1", v.v.) để tránh rò rỉ ký tự tiếng Trung trong các giao diện không phải tiếng Trung
export function isDefaultEpisodeTitle(title?: string | null, epNo?: number): boolean {
  if (!title) return true
  const s = title.trim()
  if (!s) return true
  if (/^第\s*\d+\s*集[\s:：\-—]*$/i.test(s)) return true
  if (/^第\s*[0-9一二三四五六七八九十百]+\s*集[\s:：\-—]*$/i.test(s)) return true
  if (/^(tập|episode)\s*\d+[\s:：\-—]*$/i.test(s)) return true
  if (
    epNo !== undefined &&
    (s === `第${epNo}集` ||
      s === `第 ${epNo} 集` ||
      s === `Tập ${epNo}` ||
      s === `Episode ${epNo}`)
  ) {
    return true
  }
  return false
}

// Hoàn thiện thư mục theo số tập mục tiêu
export function buildOutlineDirectory(
  bodies: DramaEpisodeBody[],
  episodeCount: number,
): OutlineDirectoryEpisode[] {
  const byNumber = new Map(
    bodies.map((ep, i) => {
      const num = ep.episodeNumber || i + 1
      return [num, ep] as const
    }),
  )
  const total = Math.max(episodeCount, bodies.length, 0)
  if (total <= 0) return []
  return Array.from({ length: total }, (_, i) => {
    const episodeNumber = i + 1
    const ep = byNumber.get(episodeNumber)
    const rawTitle = (ep?.title || '').trim()
    const cleanTitle = isDefaultEpisodeTitle(rawTitle, episodeNumber) ? '' : rawTitle
    return {
      episodeNumber,
      title: cleanTitle,
      creative: ep?.creative,
      summary: ep?.summary,
      body: ep?.body,
      origin: ep?.origin,
    }
  })
}

// Hợp nhất các mục mục lục với văn bản chính (giữ lại quảng cáo/tóm tắt)
export function mergeDirectoryEpisodeBodies(
  directory: OutlineDirectoryEpisode[],
  bodies: DramaEpisodeBody[],
): DramaEpisodeBody[] {
  const byNumber = new Map(bodies.map((ep, i) => [ep.episodeNumber || i + 1, ep] as const))
  return directory.map((item) => {
    const found = byNumber.get(item.episodeNumber)
    const rawTitle = (found?.title || item.title || '').trim()
    const cleanTitle = isDefaultEpisodeTitle(rawTitle, item.episodeNumber) ? '' : rawTitle
    return {
      episodeNumber: item.episodeNumber,
      title: cleanTitle,
      creative: found?.creative || item.creative || '',
      summary: found?.summary || item.summary || '',
      body: found?.body || item.body || '',
      origin: found?.origin || (item.origin as 'auto' | 'manual' | undefined),
    }
  })
}

// Đọc trạng thái tóm tắt
export function getSummaryStatus(script: DramaScript | null | undefined): string {
  return String((script?.params || {}).summary_status || (script?.summary ? 'completed' : 'pending'))
}

// Đọc trạng thái kịch bản tập
export function getEpisodeContentStatus(script: DramaScript | null | undefined): string {
  return String((script?.params || {}).episode_content_status || 'pending')
}

// Đọc ID kiểu ảnh
export function getImageStyleId(
  script: DramaScript | null | undefined,
  project: DramaProject | null,
): string {
  const fromScript = (script?.params || {}).image_style_id
  const fromProject = (project?.params || {}).image_style_id
  return String(fromScript || fromProject || '')
}

// Khi viết lại văn bản của tập phải giữ nguyên cấu trúc ban đầu (mảng hoặc { tập })
export function buildEpisodeContentUpdate(
  script: DramaScript | null | undefined,
  bodies: DramaEpisodeBody[],
): DramaScript['episode_content'] {
  const raw = script?.episode_content
  if (Array.isArray(raw)) return bodies
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>), episodes: bodies }
  }
  return { episodes: bodies }
}
