/** Đọc/tập hợp các từ nhắc nhở bằng đồ họa trực quan từ các thông số nội dung (căn chỉnh với manju buildCharacterParams + phát hiện dấu nhắc yếu) */
import type { DramaAsset } from '../api/drama'

const WEAK_PROMPT = /^(character|scene|prop|material|none|image|audio|video)\s+\S+$/i

const GENERIC_MARKERS = [
  '影视级写实环境空间',
  '构图层次分明、光影有戏剧张力',
  '适合短剧横屏拍摄',
  '影视级写实场景，构图清晰，适合短剧拍摄',
  '影视级写实人物',
  '白底全身定妆照',
]

const MIN_LEN: Record<string, number> = {
  character: 120,
  scene: 100,
  prop: 70,
  material: 70,
  video: 8,
}

// Đây có phải là biểu thức được tạo khuôn mẫu không?
function isGenericTemplate(text: string): boolean {
  if (text.length >= 180) return false
  return GENERIC_MARKERS.some((m) => text.includes(m))
}

// Xác định xem từ gợi ý có quá ngắn, quá ngắn hoặc quá khuôn mẫu không
function isWeakVisualPrompt(prompt: string, assetName: string, kind: string): boolean {
  const text = prompt.trim()
  /* Chứa @asset: Tham chiếu là văn bản của người dùng, không xóa nó vì phần giữ chỗ yếu */
  if (/@asset:\d+/.test(text)) return false
  const kindLower = kind.toLowerCase()
  const minLen = MIN_LEN[kindLower] ?? 60
  if (text.length < minLen) return true
  const name = assetName.trim()
  if (name && (text.toLowerCase() === `${kindLower} ${name}`.toLowerCase() || text === name)) {
    return true
  }
  if (WEAK_PROMPT.test(text)) return true
  if (isGenericTemplate(text)) return true
  return false
}

// Ghép nối theo quy tắc manju buildCharacterParams
function manjuJoinCharacterPrompt(params: Record<string, unknown>): string {
  const visual = String(params.visualImage || params.visualPrompt || '').trim()
  const title = String(params.title || '').trim()
  const roleType = String(params.roleType || '').trim()
  const coreTags = String(params.coreTags || '').trim()
  const personality = String(params.personality || '').trim()
  const parts = [
    visual,
    title ? `身份：${title}` : '',
    roleType ? `定位：${roleType}` : '',
    coreTags ? `标签：${coreTags}` : '',
    personality ? `性格：${personality}` : '',
  ].filter(Boolean)
  return parts.join('。')
}

/**
 * Đọc các từ nhắc nhở trực quan về nội dung: mô tả đầy đủ được ưu tiên, nếu quá ngắn/theo mẫu, nó sẽ được tập hợp từ trường vai trò.
 */
export function readVisualPrompt(asset: DramaAsset): string {
  const params = (asset.params || {}) as Record<string, unknown>
  const kind = (asset.type || '').toLowerCase()
  const name = asset.name || ''

  const canvas = params.canvas
  const canvasGen =
    canvas && typeof canvas === 'object'
      ? (canvas as Record<string, unknown>).generation
      : null
  const canvasPrompt =
    canvasGen && typeof canvasGen === 'object'
      ? String((canvasGen as Record<string, unknown>).prompt || '').trim()
      : ''
  const stored =
    String(params.visualPrompt || params.visualImage || canvasPrompt || '').trim()

  if (stored && !isWeakVisualPrompt(stored, name, kind)) {
    return stored
  }

  if (kind === 'character') {
    const composed = manjuJoinCharacterPrompt(params)
    if (composed && !isWeakVisualPrompt(composed, name, kind)) return composed
  }

  if (kind === 'scene' && name) {
    return `场景：${name}，影视级写实场景，构图清晰，适合短剧拍摄`
  }

  if (stored) return stored
  return `${kind} ${name}`.trim()
}

/**
 * Lời nhắc dành cho canvas/chỉnh sửa: Lọc các phần giữ chỗ yếu như "vai trò mới của nhân vật" để tránh điền nhầm.
 */
export function readEditableVisualPrompt(asset: DramaAsset): string {
  const kind = (asset.type || '').toLowerCase()
  const name = asset.name || ''
  const prompt = readVisualPrompt(asset).trim()
  if (!prompt || isWeakVisualPrompt(prompt, name, kind)) return ''
  return prompt
}

/** Liệu văn bản có phải là lời nhắc trực quan yếu hay không (giữ chỗ/quá ngắn/mẫu) */
export function isWeakEditablePrompt(prompt: string, name = '', kind = ''): boolean {
  return isWeakVisualPrompt(prompt, name, kind)
}
