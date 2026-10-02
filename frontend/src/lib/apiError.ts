import { notifyBillingErrorIfNeeded } from './billingError'

/** Phân tích chi tiết FastAPI và đưa ra; 402/ Hướng dẫn nạp tiền hiện lên khi số dư không đủ */
export function throwApiError(status: number, detail: unknown, fallback = '请求失败'): never {
  const message =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ')
        : fallback
  const finalMessage = message || fallback
  notifyBillingErrorIfNeeded(status, finalMessage)
  throw new Error(finalMessage)
}
