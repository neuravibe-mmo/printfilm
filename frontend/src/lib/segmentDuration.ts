/**
 * @duration phân tích, xác minh và xem trước phân đoạn trong kịch bản bảng phân cảnh khoa học phổ biến
 * Các hằng số được căn chỉnh với các phân đoạn hạt giống phụ trợ (phân đoạn đơn 3–12 giây, tổng phản chiếu 30 giây)
 */

/** Giới hạn dưới của thời lượng một phân đoạn (giây) */
export const SEGMENT_DURATION_MIN = 3

/** Thời lượng tối đa của một phân đoạn (giây) */
export const SEGMENT_DURATION_MAX = 12

/** Tổng giới hạn trên của @duration trong một tập lệnh nhân bản (giây) */
export const SHOT_DURATION_MAX = 30

/** Tùy chọn phím tắt thời lượng (giây) */
export const SEGMENT_DURATION_PRESETS = [4, 6, 8, 10, 12] as const

/** Dấu hiệu phụ đề phù hợp với phần phụ trợ (chồng chất hậu sản xuất, không ghi mô hình) */
export const SUBTITLE_CUE = '【字幕：后期叠旁白字幕，简体中文逐句同步】'

/** Tiền tố tường thuật nhất quán với phần phụ trợ (phổ biến khoa học đương nhiên là nhanh hơn; bản nháp cũ "chậm và rõ ràng" vẫn có thể được nhận ra) */
export const NARRATION_PREFIX = '【旁白·自然语速·同步字幕】'

/** Phần giữ chỗ vùng chỉnh sửa tập lệnh */
export const SEGMENT_SCRIPT_PLACEHOLDER = `${SUBTITLE_CUE}\n【BGM：后期混音 · 轻快专业，音量低于人声】\n@duration:4\n过肩工位操作画面…\n@duration:8\n${NARRATION_PREFIX}口播内容…`

const DURATION_TOKEN_PATTERN = /@duration:(\d+)/g

export type SegmentBeatView = { duration: number; text: string }

/**
 * Trích xuất tất cả @duration giây từ tập lệnh (giữ nguyên thứ tự)
 * @param nội dung văn bản kịch bản phân cảnh theo từng phần
 */
export function extractDurations(content: string): number[] {
  const durations: number[] = []
  for (const match of content.matchAll(DURATION_TOKEN_PATTERN)) {
    const seconds = Number(match[1])
    if (Number.isFinite(seconds) && seconds > 0) {
      durations.push(seconds)
    }
  }
  return durations
}

/**
 * Tổng số @duration giây trong tập lệnh
 * @param nội dung văn bản kịch bản phân cảnh theo từng phần
 */
export function sumDuration(content: string): number {
  return extractDurations(content).reduce((sum, value) => sum + value, 0)
}

/**
 * Xác minh xem một khoảng thời gian có nằm trong phạm vi pháp lý của phần khoa học phổ biến hay không
 * @param giây Thời lượng tính bằng giây
 */
export function isValidSegmentDuration(seconds: number): boolean {
  return (
    Number.isFinite(seconds) &&
    seconds >= SEGMENT_DURATION_MIN &&
    seconds <= SEGMENT_DURATION_MAX
  )
}

/**
 * Xác minh nhãn thời lượng trong tập lệnh: phạm vi phân đoạn đơn + tổng giới hạn trên phản chiếu
 * @param nội dung văn bản kịch bản phân cảnh theo từng phần
 */
export function validateSegmentScriptDuration(content: string): {
  valid: boolean
  total: number
  durations: number[]
  message?: string
} {
  const durations = extractDurations(content)
  const total = durations.reduce((sum, value) => sum + value, 0)

  if (durations.length === 0) {
    return { valid: true, total: 0, durations }
  }

  if (durations.some((value) => !isValidSegmentDuration(value))) {
    return {
      valid: false,
      total,
      durations,
      message: `单个 @duration 需在 ${SEGMENT_DURATION_MIN}–${SEGMENT_DURATION_MAX} 秒之间`,
    }
  }

  if (total > SHOT_DURATION_MAX) {
    return {
      valid: false,
      total,
      durations,
      message: `镜头时长合计不能超过 ${SHOT_DURATION_MAX} 秒（当前 ${total}s）`,
    }
  }

  return { valid: true, total, durations }
}

/**
 * Phân tích tập lệnh thành phụ đề/tín hiệu nhạc nền và đoạn văn bản có thời lượng (để xem trước danh sách)
 * @param script kịch bản phân cảnh theo từng phần
 */
export function parseSegmentScript(script: string | undefined | null): {
  cues: string[]
  beats: SegmentBeatView[]
} {
  /*
   * tín hiệu phụ đề/dòng BGM
   * đánh bại đoạn văn bản có thời lượng
   * đang chờ xử lý Giá trị @duration trước đó
   */
  const cues: string[] = []
  const beats: SegmentBeatView[] = []
  let pendingDur = 0

  const lines = String(script || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    if (
      line.startsWith('【字幕') ||
      line.startsWith('【Phụ đề') ||
      line.startsWith('【Subtitle') ||
      line.startsWith('【BGM') ||
      line.startsWith('【Nhạc nền') ||
      line.startsWith('【Music')
    ) {
      cues.push(line)
      continue
    }
    const m = line.match(/^@duration:(\d+)/)
    if (m) {
      pendingDur = Number(m[1]) || 0
      continue
    }
    if (pendingDur > 0 || beats.length === 0) {
      beats.push({ duration: pendingDur || 0, text: line })
      pendingDur = 0
    } else {
      beats.push({ duration: 0, text: line })
    }
  }

  return { cues, beats }
}

const NARRATION_LINE_PREFIX = /^【(?:旁白|Lời dẫn|Narration)[^】]*】/i

/** Dòng kịch bản có được đọc bằng lời tường thuật hay không (phần phụ đề có chứa từ "tường thuật" nhưng không được tính) */
export function isNarrationScriptLine(line: string): boolean {
  const stripped = line.trim()
  if (
    stripped.startsWith('【字幕') ||
    stripped.startsWith('【Phụ đề') ||
    stripped.startsWith('【Subtitle') ||
    stripped.startsWith('【BGM') ||
    stripped.startsWith('【Nhạc nền') ||
    stripped.startsWith('【Music')
  ) {
    return false
  }
  return NARRATION_LINE_PREFIX.test(stripped)
}

/** Xóa tiền tố tường thuật và lấy văn bản có thể đọc to */
export function stripNarrationPrefix(line: string): string {
  return line.trim().replace(NARRATION_LINE_PREFIX, '').trim()
}

/** Trích xuất văn bản tường thuật từ kịch bản (ghép nhiều đoạn) */
export function narrationFromScript(script: string | undefined | null): string {
  const parts: string[] = []
  for (const line of String(script || '').replace(/\r\n/g, '\n').split('\n')) {
    if (isNarrationScriptLine(line)) {
      const text = stripNarrationPrefix(line)
      if (text) parts.push(text)
    }
  }
  return parts.join('')
}

/** Trích cảnh đầu tiên từ kịch bản (không tường thuật, không gợi ý) */
export function firstVisualFromScript(script: string | undefined | null): string {
  for (const line of String(script || '').replace(/\r\n/g, '\n').split('\n')) {
    const stripped = line.trim()
    if (
      !stripped ||
      stripped.startsWith('@duration:') ||
      stripped.startsWith('【字幕') ||
      stripped.startsWith('【Phụ đề') ||
      stripped.startsWith('【Subtitle') ||
      stripped.startsWith('【BGM') ||
      stripped.startsWith('【Nhạc nền') ||
      stripped.startsWith('【Music') ||
      isNarrationScriptLine(stripped)
    ) {
      continue
    }
    return stripped.replace(/^【[^】]*】/, '').trim() || stripped
  }
  return ''
}

/** Viết lời tường thuật pop-up quay lại phần tường thuật trong kịch bản */
export function replaceNarrationInScript(script: string, narration: string): string {
  const text = narration.trim()
  const lines = String(script || '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let replaced = false
  for (const raw of lines) {
    const stripped = raw.trim()
    if (text && isNarrationScriptLine(stripped) && !replaced) {
      const prefix = stripped.match(NARRATION_LINE_PREFIX)?.[0] || NARRATION_PREFIX
      out.push(`${prefix}${text}`)
      replaced = true
      continue
    }
    out.push(raw.replace(/\s+$/, ''))
  }
  if (text && !replaced) {
    out.push('@duration:6')
    out.push(`${NARRATION_PREFIX}${text}`)
  }
  return out.join('\n').trim()
}

/** Viết khung đầu tiên của cửa sổ bật lên trở lại đoạn đầu tiên của hình ảnh kịch bản */
export function replaceFirstVisualInScript(script: string, visual: string): string {
  const text = visual.trim()
  if (!text) return String(script || '').trim()
  const lines = String(script || '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let replaced = false
  let cueEnd = 0
  for (let i = 0; i < lines.length; i += 1) {
    const stripped = lines[i].trim()
    if (
      stripped.startsWith('【字幕') ||
      stripped.startsWith('【Phụ đề') ||
      stripped.startsWith('【Subtitle') ||
      stripped.startsWith('【BGM') ||
      stripped.startsWith('【Nhạc nền') ||
      stripped.startsWith('【Music') ||
      !stripped
    ) {
      cueEnd = i + 1
      continue
    }
    break
  }
  for (const raw of lines) {
    const stripped = raw.trim()
    if (
      !replaced &&
      stripped &&
      !stripped.startsWith('@duration:') &&
      !stripped.startsWith('【字幕') &&
      !stripped.startsWith('【Phụ đề') &&
      !stripped.startsWith('【Subtitle') &&
      !stripped.startsWith('【BGM') &&
      !stripped.startsWith('【Nhạc nền') &&
      !stripped.startsWith('【Music') &&
      !isNarrationScriptLine(stripped)
    ) {
      out.push(text)
      replaced = true
      continue
    }
    out.push(raw.replace(/\s+$/, ''))
  }
  if (!replaced) {
    const extra = [`@duration:${SEGMENT_DURATION_MIN}`, text]
    return [...out.slice(0, cueEnd), ...extra, ...out.slice(cueEnd)].join('\n').trim()
  }
  return out.join('\n').trim()
}
