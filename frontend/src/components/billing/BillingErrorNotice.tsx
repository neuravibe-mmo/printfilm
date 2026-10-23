import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { isBillingError, PRICING_PATH } from '../../lib/billingError'
import { localizeErrorMessage } from '../../lib/apiError'
import { useI18n } from '../../i18n'

type Props = {
  message: string | null | undefined
  className?: string
  style?: CSSProperties
  /** Viết bài liên kết nội tuyến */
  linkText?: string
  /** Sử dụng span thay vì p (lỗi nội tuyến trên thanh công cụ) */
  inline?: boolean
}

/** Thông báo lỗi: Tự động dịch đa ngôn ngữ và gắn liên kết nạp tiền khi số dư không đủ */
export default function BillingErrorNotice({
  message,
  className = 'pf-error',
  style,
  linkText,
  inline = false,
}: Props) {
  const { locale } = useI18n()
  const rawText = String(message || '').trim()
  if (!rawText) return null

  const text = localizeErrorMessage(rawText)

  const Tag = inline ? 'span' : 'p'
  const defaultLinkText = locale === 'vi' ? 'Nạp tiền ngay →' : locale === 'en' ? 'Top up now →' : '去充值 →'
  const actionText = linkText || defaultLinkText

  if (!isBillingError(text)) {
    return (
      <Tag className={className} style={style} role={inline ? undefined : 'alert'}>
        {text}
      </Tag>
    )
  }
  return (
    <Tag className={className} style={style} role={inline ? undefined : 'alert'}>
      {text}{' '}
      <Link to={PRICING_PATH} className="pf-link pf-billing-topup-link">
        {actionText}
      </Link>
    </Tag>
  )
}
