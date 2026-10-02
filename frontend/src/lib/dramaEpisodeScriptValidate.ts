/**
 * Xác minh kịch bản bảng phân cảnh truyện tranh (tài liệu căn chỉnh/EPISODE_RULES.md §3 / §9)
 * Được sử dụng để tạo cảnh báo trước: thời lượng, cảnh trống với đoạn hội thoại bị gắn nhãn sai, thiếu hình ảnh/thiếu âm thanh cho nội dung
 */
import type { DramaAsset, DramaFragment } from '../api/drama'
import {
  DRAMA_SEGMENT_DURATION_HARD_MAX,
  DRAMA_SEGMENT_DURATION_MAX,
  DRAMA_SEGMENT_DURATION_MIN,
  DRAMA_SHOT_DURATION_HARD_MAX,
  FRAGMENT_CONTENT_DURATION_MAX,
} from './dramaEpisodePromptEditor'
import { extractDurations, sumDuration } from './segmentDuration'
import { DRAMA_VOICE_BINDING_ENABLED } from './dramaVoiceBinding'

/** Tín hiệu phụ đề truyện tranh (phù hợp với phần phụ trợ DRAMA_SUBTITLE_CUE) */
export const DRAMA_SUBTITLE_CUE = '【字幕：底部居中·简体中文·逐句轮换·与口播同步】'
export const DRAMA_SUBTITLE_CUE_VI =
  '【Phụ đề: Căn giữa phía dưới · Tiếng Việt · Luân chuyển từng câu · Đồng bộ lời thoại】'

/** Màn hình không có tiền tố lồng tiếng */
export const VISUAL_PREFIX = '【画面·无配音仅环境音】'
export const VISUAL_PREFIX_VI = '【Hình ảnh · Không lồng tiếng, chỉ có âm thanh môi trường】'

/** Tiền tố hội thoại */
export const DIALOGUE_PREFIX = '【对白·慢速清晰·同步字幕】'
export const DIALOGUE_PREFIX_VI = '【Thoại · Chậm rõ · Đồng bộ phụ đề】'

/** Tiền tố tường thuật */
export const DRAMA_NARRATION_PREFIX = '【旁白·慢速清晰·同步字幕】'
export const DRAMA_NARRATION_PREFIX_VI = '【Lời dẫn · Chậm rõ · Đồng bộ phụ đề】'

// Nhãn dấu hai chấm trong gương / cảnh trống (căn chỉnh với phần phụ trợ VISUAL_SHOT_LABEL_RE, hỗ trợ tiếng Trung, tiếng Việt và tiếng Anh)
export const VISUAL_SHOT_LABEL_RE =
  /^(?:空镜|画面|远景|近景|中景|全景|特写|大特写|跟拍|俯拍|仰拍|航拍|推镜|拉镜|摇镜|环境|镜头|动作|转场|闪回|建立镜头|气氛镜头|Cảnh|Cảnh trống|Toàn cảnh|Cận cảnh|Trung cảnh|Đặc tả|Đại đặc tả|Góc quay|Góc rộng|Góc nhìn|Theo dõi|Từ trên xuống|Từ dưới lên|Quay trên không|Đẩy máy|Kéo máy|Lướt máy|Môi trường|Hành động|Chuyển cảnh|Hồi tưởng|Khung hình|Visual|Shot|Wide shot|Close-up|Medium shot|Extreme close-up|Pan|Tilt|Zoom)\s*[：:]/i

export const VOICE_CUE_PREFIX_RE =
  /^【(?:对白|旁白|内心独白|Thoại|Lời dẫn|Độc thoại nội tâm|Dialogue|Narration|Monologue)[^】]*】\s*/i

export function isProductionMetaLine(line: string): boolean {
  const trimmed = (line || '').trim()
  return (
    trimmed.startsWith('【字幕') ||
    trimmed.startsWith('【Phụ đề') ||
    trimmed.startsWith('【Subtitle') ||
    trimmed.startsWith('【BGM') ||
    trimmed.startsWith('【Nhạc nền') ||
    trimmed.startsWith('【Music') ||
    trimmed.startsWith('【人物介绍') ||
    trimmed.startsWith('【Giới thiệu nhân vật') ||
    trimmed.startsWith('【Character intro') ||
    trimmed.startsWith('【片头') ||
    trimmed.startsWith('【Intro') ||
    trimmed.startsWith('【背景介绍') ||
    trimmed.startsWith('【Background') ||
    trimmed.startsWith('【强制约束') ||
    trimmed.startsWith('【Ràng buộc') ||
    trimmed.startsWith('【Constraints')
  )
}

export type DramaScriptIssue = {
  level: 'error' | 'warn'
  message: string
}

// Xóa tiền tố sản xuất hội thoại/tường thuật
function stripVoiceCuePrefix(line: string): string {
  return (line || '').replace(VOICE_CUE_PREFIX_RE, '').trim()
}

// Liệu nhân vật có âm thanh tham chiếu ràng buộc có thể được gửi hay không
function assetHasVoiceBinding(asset: DramaAsset): boolean {
  const params = (asset.params || {}) as Record<string, unknown>
  const raw = params.voiceAudio
  if (raw && typeof raw === 'object') {
    const data = raw as Record<string, unknown>
    const url =
      typeof data.url === 'string'
        ? data.url
        : typeof data.previewUrl === 'string'
          ? data.previewUrl
          : ''
    if (url.trim()) return true
  }
  const canvas = params.canvas
  if (canvas && typeof canvas === 'object') {
    const voiceAudio = (canvas as Record<string, unknown>).voiceAudio
    if (voiceAudio && typeof voiceAudio === 'object') {
      const url = (voiceAudio as Record<string, unknown>).url
      if (typeof url === 'string' && url.trim()) return true
    }
  }
  return false
}

// Hợp nhất nội dung @asset và assets_ids
function listFragmentAssetIds(frag: DramaFragment): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  const re = /@asset:(\d+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(frag.content || ''))) {
    const id = Number(m[1])
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  for (const id of frag.asset_ids || []) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

// Xác định xem văn bản có phải là mô tả hình ảnh thuần túy/gương trống không
export function isVisualDescriptionBody(text: string): boolean {
  let body = stripVoiceCuePrefix((text || '').trim())
  body = body.replace(/^【(?:画面|空镜|Hình ảnh|Cảnh trống|Visual|Shot)[^】]*】\s*/i, '').trim()
  if (!body) return false
  if (VISUAL_SHOT_LABEL_RE.test(body)) return true
  if (
    body.startsWith('空镜') ||
    body.startsWith('Cảnh trống') ||
    body.startsWith('△') ||
    body.startsWith('Δ')
  ) {
    return true
  }
  return false
}

// Liệu kịch bản có chứa ý định truyền miệng thực sự hay không (loại trừ dấu hai chấm trống)
function scriptLikelyNeedsVoice(content: string): boolean {
  for (const raw of (content || '').replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('@duration:')) continue
    if (isProductionMetaLine(line)) {
      continue
    }
    if (VOICE_CUE_PREFIX_RE.test(line)) {
      if (!isVisualDescriptionBody(line)) return true
      continue
    }
    if (isVisualDescriptionBody(line)) continue
    if (/^[^：:\n]{1,16}[：:]/.test(line) && !VISUAL_SHOT_LABEL_RE.test(line)) {
      return true
    }
  }
  return false
}

// Xác minh tập lệnh nhân bản đơn: thời lượng + lỗi nhân bản trống
export function validateDramaFragmentScript(content: string): DramaScriptIssue[] {
  const issues: DramaScriptIssue[] = []
  const durations = extractDurations(content || '')
  const total = sumDuration(content || '')

  const badSegment = durations.find(
    (value) =>
      !Number.isFinite(value) ||
      value < DRAMA_SEGMENT_DURATION_MIN ||
      value > DRAMA_SEGMENT_DURATION_HARD_MAX,
  )
  if (badSegment != null) {
    issues.push({
      level: 'error',
      message: `单个 @duration 需在 ${DRAMA_SEGMENT_DURATION_MIN}–${DRAMA_SEGMENT_DURATION_HARD_MAX} 秒之间`,
    })
  } else if (durations.some((value) => value > DRAMA_SEGMENT_DURATION_MAX)) {
    issues.push({
      level: 'warn',
      message: `部分 @duration 超过新分镜建议 ${DRAMA_SEGMENT_DURATION_MAX}s，旧稿可继续生成`,
    })
  }

  if (total > DRAMA_SHOT_DURATION_HARD_MAX) {
    issues.push({
      level: 'error',
      message: `本镜 @duration 合计 ${total}s，超过 Seedance 上限 ${DRAMA_SHOT_DURATION_HARD_MAX}s`,
    })
  } else if (total > FRAGMENT_CONTENT_DURATION_MAX) {
    issues.push({
      level: 'warn',
      message: `本镜 @duration 合计 ${total}s，超过新分镜建议 ${FRAGMENT_CONTENT_DURATION_MAX}s（旧稿可继续生成）`,
    })
  }

  for (const raw of (content || '').replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('@duration:')) continue
    if (isProductionMetaLine(line)) {
      continue
    }
    if (VOICE_CUE_PREFIX_RE.test(line) && isVisualDescriptionBody(line)) {
      issues.push({
        level: 'error',
        message:
          '检测到「空镜/景别」被标成对白或旁白（会口播并烧字幕）。请改为「【画面·无配音仅环境音】」或「【Hình ảnh · Không lồng tiếng, chỉ có âm thanh môi trường】」纯画面行',
      })
      break
    }
  }

  return issues
}

// Xác minh nội dung được liên kết với gương này: thiếu hình ảnh/thiếu giọng nói của nhân vật đang nói (mức cảnh báo, có thể tiếp tục được tạo)
export function validateDramaFragmentAssets(
  frag: DramaFragment | null | undefined,
  assets: DramaAsset[],
): DramaScriptIssue[] {
  const issues: DramaScriptIssue[] = []
  if (!frag) return issues

  const byId = new Map(assets.map((a) => [a.id, a]))
  const ids = listFragmentAssetIds(frag)
  const needsVoice = scriptLikelyNeedsVoice(frag.content || '')

  const missingImage: string[] = []
  const missingVoice: string[] = []

  for (const id of ids) {
    const asset = byId.get(id)
    if (!asset) {
      missingImage.push(`#${id}`)
      continue
    }
    const kind = (asset.type || '').toLowerCase()
    const hasImage = Boolean((asset.cover || asset.url || '').trim())
    if ((kind === 'character' || kind === 'scene' || kind === 'prop') && !hasImage) {
      missingImage.push(asset.name || `#${id}`)
    }
    if (DRAMA_VOICE_BINDING_ENABLED && kind === 'character' && needsVoice && !assetHasVoiceBinding(asset)) {
      missingVoice.push(asset.name || `#${id}`)
    }
  }

  if (missingImage.length > 0) {
    issues.push({
      level: 'warn',
      message: `以下资产缺少参考图，生成时可能自动补图或效果不稳定：${missingImage.slice(0, 5).join('、')}${missingImage.length > 5 ? '…' : ''}`,
    })
  }

  if (missingVoice.length > 0) {
    issues.push({
      level: 'warn',
      message: `脚本含对白，但以下角色尚未绑定音色：${missingVoice.slice(0, 5).join('、')}${missingVoice.length > 5 ? '…' : ''}`,
    })
  }

  return issues
}

// Sự cố khi hợp nhất tập lệnh và nội dung; nếu có lỗi thì không thể tạo trực tiếp được
export function collectDramaGenerateGateIssues(
  frag: DramaFragment | null | undefined,
  assets: DramaAsset[],
): { blocking: DramaScriptIssue[]; warnings: DramaScriptIssue[] } {
  const scriptIssues = validateDramaFragmentScript(frag?.content || '')
  const assetIssues = validateDramaFragmentAssets(frag, assets)
  const all = [...scriptIssues, ...assetIssues]
  return {
    blocking: all.filter((i) => i.level === 'error'),
    warnings: all.filter((i) => i.level === 'warn'),
  }
}

// Bỏ danh sách câu hỏi vào ô xác nhận copy
export function formatDramaGateMessage(
  blocking: DramaScriptIssue[],
  warnings: DramaScriptIssue[],
  baseMessage: string,
): string {
  const parts = [baseMessage]
  if (blocking.length > 0) {
    parts.push('', '【须先修复】', ...blocking.map((i) => `· ${i.message}`))
  }
  if (warnings.length > 0) {
    parts.push('', '【建议处理，仍可继续】', ...warnings.map((i) => `· ${i.message}`))
  }
  return parts.join('\n')
}
