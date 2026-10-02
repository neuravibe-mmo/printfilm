import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type UsageSummary } from '../../api'
import { useI18n } from '../../i18n'
import { formatCredits } from '../../lib/dramaUsage'

/** Định dạng số lượng token, sử dụng chữ viết tắt k/M nếu quá lớn */
function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 10_000) return `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k`
  return n.toLocaleString()
}

type MonthlyUsageCardProps = {
  /** thẻ cài đặt/giá cả được nhúng nhỏ gọn; kiểu thanh bên độc lập của bảng điều khiển */
  variant?: 'panel' | 'compact'
  /** Có hiển thị nút "Chuyển đến Nạp tiền" hay không (có thể đóng khi tính năng nạp tiền trực tiếp có sẵn trên trang định giá) */
  showTopup?: boolean
}

/** Thẻ sử dụng tháng này: Token/phí/số dư, để tái sử dụng trên trang định giá và trung tâm cá nhân */
export default function MonthlyUsageCard({
  variant = 'panel',
  showTopup = true,
}: MonthlyUsageCardProps) {
  const { t, locale } = useI18n()
  const [usage, setUsage] = useState<UsageSummary | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setUsage(null)
      return
    }
    api
      .usageSummary()
      .then(setUsage)
      .catch(() => setUsage(null))
  }, [])

  const tokenPct = Math.min(100, Math.log10((usage?.tokens || 0) + 1) * 18)
  const chargePct = Math.min(100, (usage?.charge_fen || 0) / 20)

  return (
    <div className={`pf-usage-card${variant === 'compact' ? ' is-compact' : ''}`}>
      <header className="pf-usage-card-head">
        <h3>{t('billing.monthlyUsage.title')}</h3>
        <p>{t('billing.monthlyUsage.subtitle')}</p>
      </header>

      <div className="pf-usage-row">
        <span>{t('billing.monthlyUsage.tokenUsage')}</span>
        <span className="pf-usage-val">{formatTokens(usage?.tokens ?? 0)}</span>
      </div>
      <div className="pf-meter">
        <i style={{ width: `${tokenPct}%` }} />
      </div>

      <div className="pf-usage-row">
        <span>{t('billing.monthlyUsage.monthCharge')}</span>
        <span className="pf-usage-val">{formatCredits(usage?.charge_yuan, locale)}</span>
      </div>
      <div className="pf-meter">
        <i style={{ width: `${chargePct}%` }} />
      </div>

      <div className="pf-usage-row">
        <span>{t('billing.monthlyUsage.balance')}</span>
        <span className="pf-usage-val">{formatCredits(usage?.balance_yuan, locale)}</span>
      </div>
      {(usage?.frozen_fen ?? 0) > 0 ? (
        <div className="pf-usage-row">
          <span>{t('billing.monthlyUsage.frozen')}</span>
          <span className="pf-muted">{formatCredits(usage?.frozen_yuan, locale)}</span>
        </div>
      ) : null}

      <div className="pf-usage-foot">
        <span className="pf-muted">{t('billing.monthlyUsage.calls').replace('{n}', String(usage?.calls ?? 0))}</span>
        {showTopup ? (
          <Link to="/pricing" className="pf-btn pf-btn-lime pf-btn-sm">
            {t('billing.monthlyUsage.topupBtn')}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
