import { dialog } from './dialog'

export const PRICING_PATH = '/pricing'

/** Đây có phải là lỗi chặn số dư/thanh toán không đủ? */
export function isBillingError(message: string) {
  return /余额不足|请先充值|402|insufficient_balance/i.test(message)
}

/** Chuyển tới trang định giá để nạp tiền */
export function goToTopup() {
  if (typeof window !== 'undefined') {
    window.location.assign(PRICING_PATH)
  }
}

/**
 * Một thông báo nhắc nhở về số dư không đủ sẽ hiện lên; nếu người dùng chọn nạp tiền, trang định giá sẽ được chuyển hướng.
 * @returns Liệu lỗi thanh toán đã được xử lý chưa
 */
export async function handleBillingError(
  err: unknown,
  navigate?: (path: string) => void,
): Promise<boolean> {
  const message = err instanceof Error ? err.message : String(err || '')
  if (!isBillingError(message)) return false
  const go = await dialog.confirm({
    title: '余额不足',
    message: message || '当前余额不足以开始生成，请先充值。',
    confirmText: '去充值',
    cancelText: '知道了',
    tone: 'danger',
  })
  if (go) {
    if (navigate) navigate(PRICING_PATH)
    else goToTopup()
  }
  return true
}

/**
 * Chặn toàn cầu lớp API: 402 / Hướng dẫn nạp tiền sẽ bật lên khi số dư không đủ (lỗi ban đầu sẽ không được nuốt).
 */
export function notifyBillingErrorIfNeeded(status: number, message: string) {
  if (status === 402 || isBillingError(message)) {
    void handleBillingError(new Error(message))
  }
}
