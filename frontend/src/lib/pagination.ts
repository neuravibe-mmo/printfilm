/** Tùy chọn số mục mặc định của phân trang toàn cầu trên mỗi trang */
export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 8, 12, 20] as const

/** Tính số trang dựa trên tổng số và số mục trên mỗi trang */
export function pageCountOf(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)))
}
