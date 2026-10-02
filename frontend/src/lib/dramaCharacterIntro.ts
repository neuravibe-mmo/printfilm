/** Công tắc lớp phủ giới thiệu nhân vật của tập: lớp phủ mô hình / tắt. */

export type DramaCharacterIntroMode = 'model' | 'off'

// Xác định xem bản sao giới thiệu nhân vật có được ghi vào mô hình hay không.
export function characterIntroModeEnabled(mode: DramaCharacterIntroMode): boolean {
  return mode === 'model'
}

// Tương thích với các giá trị Boolean lịch sử, hãy đọc cách giới thiệu nhân vật của tập phim; sao chép từ được tắt theo mặc định.
export function readEpisodeCharacterIntroMode(
  params: Record<string, unknown> | null | undefined,
): DramaCharacterIntroMode {
  const mode = params?.characterIntroMode
  if (mode === 'model' || mode === 'off') return mode
  return readEpisodeCharacterIntroEnabled(params) ? 'model' : 'off'
}

// Tương thích với các giá trị Boolean chuỗi/số lịch sử, tính năng sao chép giới thiệu ký tự bị tắt theo mặc định.
export function readEpisodeCharacterIntroEnabled(
  params: Record<string, unknown> | null | undefined,
): boolean {
  const value = params?.characterIntroEnabled
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

// Xác định xem đó có phải là dòng gợi ý giới thiệu nhân vật hay không.
export function isCharacterIntroCueLine(line: string): boolean {
  return line.trim().startsWith('【人物介绍')
}

// Loại bỏ các dòng giới thiệu nhân vật chồng chéo khỏi văn bản bảng phân cảnh đơn lẻ.
export function stripCharacterIntroFromContent(content: string): string {
  const next = String(content || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !isCharacterIntroCueLine(line))
  return next.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()
}

// Nhấn nút giới thiệu nhân vật để viết lại văn bản bảng phân cảnh theo đợt (loại bỏ các từ chồng chéo khi tắt; không chèn lấp khi bật và cần phải viết lại bảng phân cảnh).
export function applyCharacterIntroModeToFragments<T extends { content?: string | null }>(
  fragments: T[],
  mode: DramaCharacterIntroMode,
): T[] {
  if (mode === 'model') return fragments
  return fragments.map((fragment) => {
    const prev = String(fragment.content || '')
    const next = stripCharacterIntroFromContent(prev)
    if (next === prev) return fragment
    return { ...fragment, content: next }
  })
}
