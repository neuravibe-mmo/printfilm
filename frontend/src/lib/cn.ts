/** Hợp nhất tên lớp, lọc giá trị sai */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
