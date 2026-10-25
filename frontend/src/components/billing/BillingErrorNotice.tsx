import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { isBillingError, PRICING_PATH } from '../../lib/billingError'
import { localizeErrorMessage } from '../../lib/apiError'
import { useI18n } from '../../i18n'

type Props = {
  message: string | null | undefined
  className?: string
  style?: CSSProperties
  /** Viết bài liên kết nội tuyến */
  linkText?: string
  /** Sử dụng span thay vì div/p (lỗi nội tuyến trên thanh công cụ) */
  inline?: boolean
  /** Callback khi bấm nút đóng (X) */
  onClose?: () => void
}

/** Thông báo lỗi: Tự động dịch đa ngôn ngữ, gắn liên kết nạp tiền và hỗ trợ nút đóng (X) */
export default function BillingErrorNotice({
  message,
  className = 'pf-error',
  style,
  linkText,
  inline = false,
  onClose,
}: Props) {
  const { locale } = useI18n()
  const rawText = String(message || '').trim()
  if (!rawText) return null

  const text = localizeErrorMessage(rawText)

  const Tag = inline ? 'span' : 'div'
  const defaultLinkText = locale === 'vi' ? 'Nạp tiền ngay →' : locale === 'en' ? 'Top up now →' : '去充值 →'
  const actionText = linkText || defaultLinkText

  return (
    <Tag
      className={className}
      style={
        onClose
          ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              ...style,
            }
          : style
      }
      role={inline ? undefined : 'alert'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {text}{' '}
        {isBillingError(text) ? (
          <Link to={PRICING_PATH} className="pf-link pf-billing-topup-link">
            {actionText}
          </Link>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px',
            margin: 0,
            cursor: 'pointer',
            color: 'currentColor',
            opacity: 0.65,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            flexShrink: 0,
            transition: 'opacity 0.15s, background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.65')}
          title="Đóng thông báo lỗi"
          aria-label="Đóng thông báo lỗi"
        >
          <X size={16} />
        </button>
      ) : null}
    </Tag>
  )
}
