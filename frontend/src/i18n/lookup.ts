/** Lấy bản sao dựa trên đường dẫn điểm và sử dụng {name} để nội suy */

export type TVars = Record<string, string | number>

// Nhận chuỗi từ đối tượng lồng nhau bằng "nav.home"
export function lookupMessage(source: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = source
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

// Thay thế {key} trong mẫu bằng vars
export function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  )
}
