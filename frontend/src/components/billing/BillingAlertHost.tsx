import { useCallback, useEffect, useRef } from 'react'
import { api } from '../../api'
import { dialog } from '../../lib/dialog'
import { useI18n } from '../../i18n'

type BillingAlertItem = {
  id: number
  kind: string
  title: string
  message: string
  milestone_fen: number
  milestone_yuan: number
  created_at?: string | null
}

/** Thăm dò ý kiến ​​để hiển thị cảnh báo hạn ngạch người dùng và lời nhắc bật lên. */
export default function BillingAlertHost() {
  const { t } = useI18n()
  // Khóa trước khi bắt đầu các yêu cầu đang chờ xử lý để tránh việc truy cập lại đồng thời tiêu điểm/khoảng thời gian/Chế độ nghiêm ngặt
  const showingRef = useRef(false)

  const checkAlerts = useCallback(async () => {
    if (!localStorage.getItem('token') || showingRef.current) return
    showingRef.current = true
    try {
      const res = await api.billingAlertsPending()
      const items = (res.items ?? []) as BillingAlertItem[]
      if (!items.length) return
      for (const item of items) {
        await dialog.alert({
          title: item.title || t('billing.consumptionAlert'),
          message: item.message,
          confirmText: t('common.gotIt'),
        })
        try {
          await api.billingAlertAck(item.id)
        } catch {
          // Bỏ qua khi 404 xảy ra do xác nhận hoặc xác nhận đồng thời để tránh việc thử lại nhiều lần để làm mới màn hình
        }
      }
    } catch {
      // Bỏ qua một cách im lặng khi chưa đăng nhập hoặc khi mạng có vấn đề bất thường.
    } finally {
      showingRef.current = false
    }
  }, [t])

  useEffect(() => {
    void checkAlerts()
    const timer = window.setInterval(() => void checkAlerts(), 30_000)
    const onFocus = () => void checkAlerts()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [checkAlerts])

  return null
}
