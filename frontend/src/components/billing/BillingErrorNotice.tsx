import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { isBillingError, PRICING_PATH } from '../../lib/billingError'
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

/** Thông báo lỗi: Liên kết nạp tiền nhảy nhanh được đính kèm khi số dư không đủ. */
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

  let text = rawText
  if (/未解析到可用文字模型.*TokenFree API Key/i.test(rawText)) {
    text =
      locale === 'vi'
        ? 'Chưa cấu hình mô hình văn bản khả dụng. Vui lòng điền TokenFree API Key trong trang quản trị, đồng bộ và chọn mô hình văn bản.'
        : locale === 'en'
          ? 'No available text model configured. Please enter TokenFree API Key in admin console, fetch and select a text model.'
          : rawText
  } else if (/余额不足.*充值/i.test(rawText)) {
    text =
      locale === 'vi'
        ? 'Số dư hiện tại không đủ để bắt đầu tạo, vui lòng nạp thêm.'
        : locale === 'en'
          ? 'Current balance is insufficient to start generation, please top up.'
          : rawText
  } else if (/找不到第\s*(\d+)\s*集剧本/i.test(rawText)) {
    const num = rawText.match(/找不到第\s*(\d+)\s*集剧本/i)?.[1] || ''
    text =
      locale === 'vi'
        ? `Không tìm thấy kịch bản tập ${num}.`
        : locale === 'en'
          ? `Script for episode ${num} not found.`
          : rawText
  } else if (/第\s*(\d+)\s*集正文过短/i.test(rawText)) {
    const num = rawText.match(/第\s*(\d+)\s*集正文过短/i)?.[1] || ''
    text =
      locale === 'vi'
        ? `Nội dung tập ${num} quá ngắn, vui lòng hoàn thiện hoặc dùng AI tối ưu hóa trước khi vào phân cảnh.`
        : locale === 'en'
          ? `Content of episode ${num} is too short, please complete or AI-optimize it first.`
          : rawText
  }

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
