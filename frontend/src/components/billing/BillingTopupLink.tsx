import { Link } from 'react-router-dom'
import { PRICING_PATH } from '../../lib/billingError'
import { useI18n } from '../../i18n'

type Props = {
  className?: string
  children?: string
}

/** Nhảy nhanh "đi nạp tiền" nội tuyến */
export default function BillingTopupLink({ className = 'pf-link pf-billing-topup-link', children }: Props) {
  const { t } = useI18n()
  const label = children || t('billing.goToTopup')
  return (
    <Link to={PRICING_PATH} className={className}>
      {label}
    </Link>
  )
}
