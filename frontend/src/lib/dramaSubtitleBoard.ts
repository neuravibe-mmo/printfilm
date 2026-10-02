/** Bảng phụ đề của bảng phân cảnh: Trích xuất phụ đề bằng giọng nói từ văn bản bảng phân cảnh để xem trước và xuất. */

import type { DramaFragment } from '../api/drama'

export type DramaSubtitleMode = 'model' | 'post'

export type DramaSubtitleCue = {
  fragmentId: number
  fragmentIndex: number
  startSec: number
  endSec: number
  speaker: string
  text: string
}

// Xác định xem chế độ phụ đề hiện tại có tạo phụ đề trực tiếp từ mô hình hay không.
export function subtitleModeUsesModelOutput(mode: DramaSubtitleMode): boolean {
  return mode === 'model'
}

// Tương thích với các giá trị Boolean lịch sử, đọc phụ đề tập phim; mặc định là ghép phụ đề sau.
export function readEpisodeSubtitleMode(
  params: Record<string, unknown> | null | undefined,
): DramaSubtitleMode {
  const mode = params?.subtitleMode
  if (mode === 'model' || mode === 'post') return mode
  return readEpisodeSubtitleEnabled(params) ? 'model' : 'post'
}

// Tương thích với các giá trị Boolean/chuỗi lịch sử, phụ đề ghi mô hình bị tắt theo mặc định (nối sau sản xuất).
export function readEpisodeSubtitleEnabled(params: Record<string, unknown> | null | undefined): boolean {
  const value = params?.subtitleEnabled
  if (value == null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['0', 'false', 'no', 'off', ''].includes(normalized)) return false
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  }
  return Boolean(value)
}

// Trích xuất toàn bộ tín hiệu phụ đề của tập (dòng thời gian tích lũy theo thứ tự @duration).
export function buildDramaSubtitleBoard(fragments: DramaFragment[]): DramaSubtitleCue[] {
  const cues: DramaSubtitleCue[] = []
  let globalSec = 0

  fragments.forEach((fragment, index) => {
    const lines = String(fragment.content || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    let blockDuration = 0
    let blockStart = globalSec
    const flushTimeOnly = () => {
      if (blockDuration > 0) {
        globalSec += blockDuration
      }
      blockDuration = 0
      blockStart = globalSec
    }

    for (const line of lines) {
      const durationMatch = line.match(/^@duration:(\d+)/)
      if (durationMatch) {
        flushTimeOnly()
        blockDuration = Math.max(0, Number(durationMatch[1]) || 0)
        blockStart = globalSec
        continue
      }
      const spoken = parseSubtitleLine(line)
      if (!spoken || blockDuration <= 0) continue
      cues.push({
        fragmentId: fragment.id,
        fragmentIndex: index,
        startSec: blockStart,
        endSec: blockStart + blockDuration,
        speaker: spoken.speaker,
        text: spoken.text,
      })
    }

    flushTimeOnly()
  })

  return cues
}

// Xuất văn bản thuần túy của bảng phụ đề (để xem trước).
export function exportDramaSubtitleBoardText(fragments: DramaFragment[]): string {
  const cues = buildDramaSubtitleBoard(fragments)
  if (cues.length === 0) return '暂无可导出的字幕内容'
  return cues
    .map(
      (cue) =>
        `${formatSubtitleClock(cue.startSec)}-${formatSubtitleClock(cue.endSec)} 片段 ${String(
          cue.fragmentIndex + 1,
        ).padStart(2, '0')} ${cue.speaker}：${cue.text}`,
    )
    .join('\n')
}

// Xuất các đoạn cắt và SRT có thể nhập được (chỉ văn bản, không bao gồm loa).
export function exportDramaSubtitleBoardSrt(fragments: DramaFragment[]): string {
  const cues = buildDramaSubtitleBoard(fragments)
    .map((cue) => ({
      ...cue,
      text: sanitizeSrtCaptionText(cue.text),
    }))
    .filter((cue) => cue.text.length > 0)
  if (cues.length === 0) return ''
  return cues
    .map((cue, index) => {
      const start = formatSrtTimestamp(cue.startSec)
      const end = formatSrtTimestamp(Math.max(cue.endSec, cue.startSec + 0.4))
      return `${index + 1}\n${start} --> ${end}\n${cue.text}`
    })
    .join('\n\n')
}

// Giây được định dạng là 00:00.
export function formatSubtitleClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Giây được định dạng là dòng thời gian SRT 00:00:00.000.
export function formatSrtTimestamp(totalSec: number): string {
  const msTotal = Math.max(0, Math.round(totalSec * 1000))
  const hours = Math.floor(msTotal / 3_600_000)
  const minutes = Math.floor((msTotal % 3_600_000) / 60_000)
  const seconds = Math.floor((msTotal % 60_000) / 1000)
  const millis = msTotal % 1000
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    seconds,
  ).padStart(2, '0')},${String(millis).padStart(3, '0')}`
}

// Dọn sạch các dấu ngoặc đơn như mô tả hành động và giữ lại văn bản bằng miệng có thể hiển thị trên màn hình.
function sanitizeSrtCaptionText(raw: string): string {
  return String(raw || '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseSubtitleLine(
  line: string,
): {
  speaker: string
  text: string
} | null {
  const normalized = String(line || '')
    .replace(/@asset:\d+\s*/g, '')
    .trim()
  const stripped = normalized.replace(/^【[^】]+】/, '').trim()
  if (!stripped) return null
  if (stripped.startsWith('旁白（VO）：')) {
    return { speaker: '旁白', text: stripped.slice('旁白（VO）：'.length).trim() }
  }
  if (stripped.startsWith('旁白：')) {
    return { speaker: '旁白', text: stripped.slice('旁白：'.length).trim() }
  }
  if (stripped.startsWith('内心独白：')) {
    return { speaker: '内心独白', text: stripped.slice('内心独白：'.length).trim() }
  }
  const dialogue = stripped.match(/^([^：]{1,24})：(.+)$/)
  if (!dialogue) return null
  const speaker = dialogue[1].trim()
  const text = dialogue[2].trim()
  if (!speaker || !text) return null
  if (['空镜', '远景', '近景', '特写', '全景', '中景'].includes(speaker)) return null
  return { speaker, text }
}

const DRAMA_SUBTITLE_CUE = '【字幕：底部居中·简体中文·逐句轮换·与口播同步】'
const LEGACY_SUBTITLE_CUES = [
  '【字幕：底部居中·简体中文·仅标记段落同步】',
  '【字幕：底部居中·简体中文】',
  '【字幕：全程简体中文字幕，旁白逐句同步烧录】',
]

const STRIP_PREFIX_MAP: Array<[string, string]> = [
  ['【对白·慢速清晰·同步字幕】', '【对白·慢速清晰】'],
  ['【旁白·慢速清晰·同步字幕】', '【旁白·慢速清晰】'],
  ['【旁白·自然语速·同步字幕】', '【旁白·自然语速】'],
  ['【内心独白·同步字幕】', '【内心独白】'],
  ['【Thoại · Chậm rõ · Đồng bộ phụ đề】', '【Thoại · Chậm rõ】'],
  ['【Lời dẫn · Chậm rõ · Đồng bộ phụ đề】', '【Lời dẫn · Chậm rõ】'],
  ['【Độc thoại nội tâm · Đồng bộ phụ đề】', '【Độc thoại nội tâm】'],
]

// Xác định xem đó có phải là dòng gợi ý phụ đề hay không (bao gồm bản sao lịch sử và đa ngôn ngữ).
function isSubtitleCueLine(line: string): boolean {
  const trimmed = line.trim()
  if (
    !trimmed.startsWith('【字幕') &&
    !trimmed.startsWith('【Phụ đề') &&
    !trimmed.startsWith('【Subtitle')
  ) {
    return false
  }
  return (
    trimmed === DRAMA_SUBTITLE_CUE ||
    LEGACY_SUBTITLE_CUES.includes(trimmed) ||
    /同步|烧录|底部居中|Đồng bộ|Phụ đề|Căn giữa/.test(trimmed)
  )
}

// Xóa các từ gợi ý phụ đề mẫu khỏi văn bản bảng phân cảnh duy nhất và giữ lại đoạn hội thoại/tường thuật.
export function stripSubtitlePromptsFromContent(content: string): string {
  const lines = String(content || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
  const next: string[] = []
  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) {
      next.push(raw)
      continue
    }
    if (isSubtitleCueLine(trimmed)) continue
    let line = trimmed
    for (const [src, dest] of STRIP_PREFIX_MAP) {
      if (line.startsWith(src)) {
        line = line.replace(src, dest)
        break
      }
    }
    next.push(line)
  }
  return next.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()
}

// Bổ sung từ nhắc phụ đề mẫu cho một văn bản trong bảng phân cảnh (nếu đã tồn tại thì sẽ không lặp lại).
export function applySubtitlePromptsToContent(content: string): string {
  const source = String(content || '').replace(/\r\n/g, '\n')
  if (!source.trim()) return source
  const lines = source.split('\n')
  const next: string[] = []
  let hasCue = false
  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) {
      next.push(raw)
      continue
    }
    if (isSubtitleCueLine(trimmed)) {
      if (!hasCue) {
        next.push(DRAMA_SUBTITLE_CUE)
        hasCue = true
      }
      continue
    }
    let line = trimmed
    for (const [withSub, withoutSub] of STRIP_PREFIX_MAP) {
      if (line.startsWith(withoutSub) && !line.startsWith(withSub)) {
        line = line.replace(withoutSub, withSub)
        break
      }
    }
    next.push(line)
  }
  if (!hasCue) {
    const insertAt = next.findIndex(
      (line) => line.trim().startsWith('【BGM') || line.trim().startsWith('【Nhạc nền'),
    )
    if (insertAt >= 0) next.splice(insertAt, 0, DRAMA_SUBTITLE_CUE)
    else next.unshift(DRAMA_SUBTITLE_CUE)
  }
  return next.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()
}

// Viết lại hàng loạt nội dung bảng phân cảnh theo phụ đề.
export function applySubtitleModeToFragments<T extends { content?: string | null }>(
  fragments: T[],
  mode: DramaSubtitleMode,
): T[] {
  const transform =
    mode === 'model' ? applySubtitlePromptsToContent : stripSubtitlePromptsFromContent
  return fragments.map((fragment) => {
    const prev = String(fragment.content || '')
    const next = transform(prev)
    if (next === prev) return fragment
    return { ...fragment, content: next }
  })
}
