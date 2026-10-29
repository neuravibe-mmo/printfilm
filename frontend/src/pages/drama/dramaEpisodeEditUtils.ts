/** Hỗ trợ trang chỉnh sửa tập: phân loại nội dung, phân tích tham chiếu, viết nhãn */
import type { DramaAsset, DramaFragment } from '../../api/drama'
import { getActiveLocale } from '../../i18n/detect'
import {
  DRAMA_RATIO_OPTIONS,
  DRAMA_RES_OPTIONS,
  readEpisodeAspectRatio,
  readEpisodeResolution,
  readProjectAspectRatio,
  readProjectResolution,
} from '../../lib/dramaProjectOutputSettings'

export type AssetScope = 'episode' | 'series'
export type AssetTab = 'character' | 'scene' | 'prop'

export function getAssetTabLabel(key: AssetTab, locale?: string): string {
  const loc = locale || getActiveLocale()
  if (key === 'character') return loc === 'vi' ? 'Nhân vật' : loc === 'en' ? 'Characters' : '角色'
  if (key === 'scene') return loc === 'vi' ? 'Cảnh quay' : loc === 'en' ? 'Scenes' : '场景'
  if (key === 'prop') return loc === 'vi' ? 'Đạo cụ' : loc === 'en' ? 'Props' : '道具'
  return key
}

export const ASSET_TABS: Array<{ key: AssetTab; label: string }> = [
  { key: 'character', label: '角色' },
  { key: 'scene', label: '场景' },
  { key: 'prop', label: '道具' },
]

export const RATIO_OPTIONS = DRAMA_RATIO_OPTIONS
export const RES_OPTIONS = DRAMA_RES_OPTIONS
export { readProjectAspectRatio, readProjectResolution, readEpisodeAspectRatio, readEpisodeResolution }

// Trích xuất @asset:id từ văn bản bảng phân cảnh
export function extractAssetIds(content: string): number[] {
  const ids: number[] = []
  const re = /@asset:(\d+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    ids.push(Number(m[1]))
  }
  return ids
}

// Hợp nhất văn bản @asset và assets_ids, loại bỏ trùng lặp và giữ nguyên trật tự
export function collectFragmentAssetIds(frag: DramaFragment | null | undefined): number[] {
  if (!frag) return []
  const seen = new Set<number>()
  const out: number[] = []
  for (const id of [...extractAssetIds(frag.content || ''), ...(frag.asset_ids || [])]) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export type FragmentRefStripItem = {
  assetId: number
  name: string
  type: string
  previewUrl: string
  isCharacter?: boolean
  voiceLabel?: string
  voiceUrl?: string
}

// Lắp ráp dải nội dung được liên kết với bảng phân cảnh hiện tại
export function buildFragmentRefStripItems(
  frag: DramaFragment | null | undefined,
  assets: DramaAsset[],
  resolveUrl: (url: string | null | undefined) => string,
  readVoice?: (asset: DramaAsset) => { label: string; url: string } | null,
): FragmentRefStripItem[] {
  const byId = new Map(assets.map((a) => [a.id, a]))
  return collectFragmentAssetIds(frag).map((assetId) => {
    const asset = byId.get(assetId)
    const preview = asset ? resolveUrl(asset.cover || asset.url) : ''
    const isCharacter = asset ? normalizeAssetTab(asset.type) === 'character' : false
    const voice = asset && readVoice ? readVoice(asset) : null
    const loc = getActiveLocale()
    const fallbackName = loc === 'vi' ? `Tài sản ${assetId}` : loc === 'en' ? `Asset ${assetId}` : `资产 ${assetId}`
    return {
      assetId,
      name: asset?.name || fallbackName,
      type: asset?.type || '',
      previewUrl: preview,
      isCharacter,
      voiceLabel: voice?.label,
      voiceUrl: voice?.url,
    }
  })
}

// Phân loại tài sản được chuẩn hóa
export function normalizeAssetTab(type: string): AssetTab | null {
  const t = (type || '').toLowerCase()
  if (t === 'character' || t === '角色') return 'character'
  if (t === 'scene' || t === '场景') return 'scene'
  if (t === 'prop' || t === '道具') return 'prop'
  return null
}

// Tổng số @duration giây từ văn bản bảng phân cảnh (phù hợp với đoạn phụ trợ Fragment_content_duration)
export function sumFragmentContentDuration(content: string): number {
  const re = /@duration:(\d+)/g
  let total = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content || ''))) {
    const sec = Number(m[1])
    if (sec > 0) total += sec
  }
  return total
}

// Phân bổ lại danh sách thời lượng cũ theo tổng thời lượng mới (targetTotal)
export function distributeDurations(oldDurations: number[], targetTotal: number): number[] {
  const k = oldDurations.length
  if (k === 0) return []
  if (k === 1) return [Math.max(1, targetTotal)]

  const minPerSeg = targetTotal >= 3 * k ? 3 : 1
  const oldSum = oldDurations.reduce((a, b) => a + b, 0) || 1

  let allocated = oldDurations.map((d) => Math.max(minPerSeg, Math.round((d / oldSum) * targetTotal)))
  let currentSum = allocated.reduce((a, b) => a + b, 0)

  let guard = 0
  while (currentSum < targetTotal && guard < 50) {
    let bestIdx = 0
    let maxRatio = -Infinity
    for (let i = 0; i < k; i++) {
      const targetRatio = (oldDurations[i] / oldSum) * targetTotal
      const diff = targetRatio - allocated[i]
      if (diff > maxRatio) {
        maxRatio = diff
        bestIdx = i
      }
    }
    allocated[bestIdx] += 1
    currentSum += 1
    guard++
  }

  while (currentSum > targetTotal && guard < 100) {
    let bestIdx = -1
    let maxVal = -1
    for (let i = 0; i < k; i++) {
      if (allocated[i] > minPerSeg && allocated[i] > maxVal) {
        maxVal = allocated[i]
        bestIdx = i
      }
    }
    if (bestIdx === -1) {
      for (let i = 0; i < k; i++) {
        if (allocated[i] > 1 && allocated[i] > maxVal) {
          maxVal = allocated[i]
          bestIdx = i
        }
      }
    }
    if (bestIdx === -1) break
    allocated[bestIdx] -= 1
    currentSum -= 1
    guard++
  }

  return allocated
}

// Cập nhật/đồng bộ các thẻ @duration trong content theo targetTotal
export function syncContentDurations(content: string, targetTotal: number): string {
  if (!content) return `@duration:${targetTotal}\n`
  const re = /@duration:(\d+)/g
  const oldDurations: number[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    oldDurations.push(Number(match[1]))
  }

  if (oldDurations.length === 0) {
    return `@duration:${targetTotal}\n${content}`
  }

  const newDurations = distributeDurations(oldDurations, targetTotal)
  let idx = 0
  return content.replace(/@duration:(\d+)/g, () => {
    const val = newDurations[idx++] ?? targetTotal
    return `@duration:${val}`
  })
}

// Phân tích trạng thái tạo bảng phân cảnh (params. Generation được ưu tiên hơn các video hiện có và hỗ trợ tái tạo)
export function readFragmentGenerationStatus(
  frag: DramaFragment,
): { status: string; error?: string; message?: string; phase?: string } {
  const gen = frag.params?.generation
  if (gen && typeof gen === 'object') {
    const row = gen as Record<string, unknown>
    const status = typeof row.status === 'string' ? row.status : 'idle'
    if (['queued', 'running', 'generating', 'failed', 'cancelled'].includes(status)) {
      const surface = typeof row.error === 'string' ? row.error : undefined
      const root = typeof row.root_error === 'string' ? row.root_error.trim() : ''
      const error =
        status === 'failed' &&
        root &&
        (!surface || /重试超过|超过重试/.test(surface))
          ? root
          : surface
      return {
        status,
        error,
        message: typeof row.message === 'string' ? row.message : undefined,
        phase: typeof row.phase === 'string' ? row.phase : undefined,
      }
    }
    if (status === 'done') {
      return {
        status: 'done',
        message: typeof row.message === 'string' ? row.message : undefined,
      }
    }
  }
  if (frag.video) return { status: 'done' }
  return { status: 'idle' }
}

// Nó có đang được xếp hàng/được tạo không?
export function isFragmentGenerationBusy(status: string): boolean {
  return ['queued', 'running', 'generating', 'pending', 'leased', 'awaiting_poll', 'awaiting_review'].includes(
    status,
  )
}

export type FragmentVideoVersion = {
  id: string
  video: string
  cover?: string
  lastFrameUrl?: string | null
  createdAt?: string
  source?: string
}

// Đọc lịch sử storyboard và bản hoàn thiện
export function readFragmentVideoVersions(frag: DramaFragment | null | undefined): FragmentVideoVersion[] {
  if (!frag?.params || typeof frag.params !== 'object') return []
  const raw = (frag.params as Record<string, unknown>).video_versions
  if (!Array.isArray(raw)) return []
  const out: FragmentVideoVersion[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const id = typeof row.id === 'string' ? row.id : ''
    const video = typeof row.video === 'string' ? row.video.trim() : ''
    if (!id || !video) continue
    out.push({
      id,
      video,
      cover: typeof row.cover === 'string' ? row.cover : '',
      lastFrameUrl: typeof row.lastFrameUrl === 'string' ? row.lastFrameUrl : null,
      createdAt: typeof row.createdAt === 'string' ? row.createdAt : undefined,
      source: typeof row.source === 'string' ? row.source : undefined,
    })
  }
  return out
}

// Viết logo hàng đợi bảng phân cảnh
export function fragmentQueueBadgeLabel(
  status: string,
  tOrLocale?: ((key: string, params?: any) => string) | string,
): string {
  const loc = (typeof tOrLocale === 'string' ? tOrLocale : null) || getActiveLocale()
  if (status === 'queued' || status === 'pending' || status === 'leased') {
    return loc === 'vi' ? 'Đang chờ' : loc === 'en' ? 'Queued' : '排队'
  }
  if (status === 'running' || status === 'generating' || status === 'awaiting_poll') {
    return loc === 'vi' ? 'Đang tạo' : loc === 'en' ? 'Generating' : '生成中'
  }
  if (status === 'failed') {
    return loc === 'vi' ? 'Thất bại' : loc === 'en' ? 'Failed' : '失败'
  }
  return ''
}

// Trước khi lưu: Khi có thẻ @duration, hãy sử dụng tổng giá trị là thời lượng_sec
export function resolveFragmentDurationSec(
  content: string,
  durationSec: number | null | undefined,
): number {
  const fromTags = sumFragmentContentDuration(content)
  if (fromTags > 0) return Math.min(30, Math.max(1, fromTags))
  const fallback = durationSec && durationSec > 0 ? durationSec : 8
  return Math.min(30, Math.max(1, fallback))
}

// Định dạng thẻ phân đoạn
export function formatFragLabel(
  index: number,
  durationSec: number | null | undefined,
  tOrLocale?: ((key: string, params?: any) => string) | string,
) {
  const n = String(index + 1).padStart(2, '0')
  const sec = durationSec && durationSec > 0 ? durationSec : 8
  if (typeof tOrLocale === 'function') {
    const prefix = tOrLocale('drama.episodeEdit.fragmentPrefix', 'Phân cảnh')
    return `${prefix} ${n} · ${sec}s`
  }
  const loc = (typeof tOrLocale === 'string' ? tOrLocale : null) || getActiveLocale()
  const prefix = loc === 'vi' ? 'Phân cảnh' : loc === 'en' ? 'Scene' : '片段'
  return `${prefix} ${n} · ${sec}s`
}

// Định dạng tên đoạn (không có thời lượng)
export function formatFragName(
  index: number,
  tOrLocale?: ((key: string, params?: any) => string) | string,
) {
  const n = String(index + 1).padStart(2, '0')
  if (typeof tOrLocale === 'function') {
    const prefix = tOrLocale('drama.episodeEdit.fragmentPrefix', 'Phân cảnh')
    return `${prefix} ${n}`
  }
  const loc = (typeof tOrLocale === 'string' ? tOrLocale : null) || getActiveLocale()
  const prefix = loc === 'vi' ? 'Phân cảnh' : loc === 'en' ? 'Scene' : '片段'
  return `${prefix} ${n}`
}

// Lọc nội dung theo tập/bộ hoàn chỉnh và danh mục này
export function filterEpisodeAssets(
  assets: DramaAsset[],
  scope: AssetScope,
  tab: AssetTab | null,
  referencedIds: Set<number>,
): DramaAsset[] {
  let list = assets.filter((a) => normalizeAssetTab(a.type))
  if (scope === 'episode') {
    list = list.filter((a) => referencedIds.has(a.id))
  }
  if (tab) {
    list = list.filter((a) => normalizeAssetTab(a.type) === tab)
  }
  return list
}

/**
 * In đậm (highlight) tên các nhân vật xuất hiện trong nội dung phân cảnh.
 * Sử dụng cú pháp **Tên nhân vật** để vừa tương thích Markdown vừa hiển thị in đậm trên giao diện.
 */
export function highlightCharacterNamesInContent(
  content: string,
  names: string[],
): string {
  if (!content || !names.length) return content
  const validNames = Array.from(
    new Set(names.map((n) => (n || '').trim()).filter((n) => n.length >= 2)),
  ).sort((a, b) => b.length - a.length)

  if (!validNames.length) return content

  const parts = content.split(/(\*\*[^*]+\*\*|@[a-zA-Z0-9_:]+)/g)
  const pattern = validNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(
    '(?:^|(?<=[^a-zA-Z0-9\\u00C0-\\u1EF9]))(' + pattern + ')(?=[^a-zA-Z0-9\\u00C0-\\u1EF9]|$)',
    'gi',
  )

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('**') && parts[i].endsWith('**')) continue
    if (parts[i].startsWith('@')) continue
    parts[i] = parts[i].replace(regex, '**$1**')
  }
  return parts.join('')
}



