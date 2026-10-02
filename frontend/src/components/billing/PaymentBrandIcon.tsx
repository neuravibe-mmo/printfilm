type PayBrand = 'alipay' | 'wxpay' | 'unionpay'

type Props = {
  brand: PayBrand
  /** sm được sử dụng trong nút; md được sử dụng trong tiêu đề cửa sổ bật lên */
  size?: 'sm' | 'md'
  className?: string
}

const BRAND_META: Record<PayBrand, { src: string; alt: string }> = {
  alipay: { src: '/payment/alipay.svg', alt: '支付宝' },
  wxpay: { src: '/payment/wechatpay.svg', alt: '微信支付' },
  unionpay: { src: '/payment/unionpay.svg', alt: '银联支付' },
}

/** Biểu tượng thương hiệu kênh thanh toán */
export default function PaymentBrandIcon({ brand, size = 'sm', className = '' }: Props) {
  const meta = BRAND_META[brand]
  return (
    <img
      src={meta.src}
      alt={meta.alt}
      className={`pf-pay-brand-icon is-${size}${className ? ` ${className}` : ''}`}
      width={size === 'md' ? 28 : 22}
      height={size === 'md' ? 28 : 22}
      loading="lazy"
      decoding="async"
    />
  )
}
