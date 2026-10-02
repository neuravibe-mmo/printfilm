/** Xác minh biểu mẫu đăng nhập/đăng ký: lời nhắc thống nhất trên các trình duyệt, không dựa vào bong bóng email gốc. */
export function isValidEmailInput(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.includes('@')) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export function isValidAuthPassword(value: string): boolean {
  return value.length >= 6 && value.length <= 64
}
