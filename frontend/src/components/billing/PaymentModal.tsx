import { useEffect, useEffectEvent, useState } from 'react'
import QRCode from 'qrcode'
import Modal from '../ui/Modal'
import PaymentBrandIcon from './PaymentBrandIcon'
import { api } from '../../api'
import { useI18n } from '../../i18n'

export type PayCheckout = {
  out_trade_no: string
  sku_id: string
  sku_name: string
  pay_type: 'alipay' | 'wxpay' | string
  amount_fen: number
  credit_fen: number
  /** qr=弹窗扫码；redirect=新开易支付收银台 */
  pay_mode?: 'qr' | 'redirect' | string
  qr_payload: string
  payurl?: string
  img?: string
  expire_seconds?: number
}

type Props = {
  open: boolean
  checkout: PayCheckout | null
  onClose: () => void
  onPaid: () => void
}

function yuan(fen: number) {
  return (fen / 100).toFixed(2)
}

function formatRemain(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 扫码支付弹窗：展示二维码或等待收银台回跳，并轮询订单状态 */
export default function PaymentModal({ open, checkout, onClose, onPaid }: Props) {
  const { t } = useI18n()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [remain, setRemain] = useState(300)
  const [status, setStatus] = useState<'waiting' | 'paid' | 'expired'>('waiting')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const handlePaid = useEffectEvent(() => {
    onPaid()
  })

  async function handleCancel() {
    const tradeNo = checkout?.out_trade_no
    if (tradeNo && status !== 'paid') {
      try {
        await api.closeBillingOrder(tradeNo)
      } catch {
        /* ignore close errors */
      }
    }
    onClose()
  }

  function openCashier() {
    const url = (checkout?.payurl || '').trim()
    if (!url) {
      setError(t('billing.payment.noPayLink'))
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (!open || !checkout) return
    const expiredAt = Date.now() + (checkout.expire_seconds ?? 300) * 1000
    const payurl = (checkout.payurl || '').trim()
    const isRedirect = checkout.pay_mode === 'redirect' || (!checkout.qr_payload && !!payurl)
    setRemain(checkout.expire_seconds ?? 300)
    setStatus('waiting')
    setError('')
    setChecking(false)
    setQrDataUrl('')

    const payload = checkout.qr_payload || checkout.img || ''
    let cancelled = false

    async function paintQr() {
      if (isRedirect) {
        if (!cancelled && payurl) {
          window.open(payurl, '_blank', 'noopener,noreferrer')
        }
        return
      }
      if (!payload) {
        setQrDataUrl('')
        setError(t('billing.payment.noQrCode'))
        return
      }
      if (/^https?:\/\//i.test(payload) && /\.(png|jpe?g|gif|webp)(\?|$)/i.test(payload)) {
        if (!cancelled) setQrDataUrl(payload)
        return
      }
      try {
        const url = await QRCode.toDataURL(payload, {
          width: 220,
          margin: 2,
          color: { dark: '#111318', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        })
        if (!cancelled) setQrDataUrl(url)
      } catch {
        if (!cancelled) setError(t('billing.payment.qrFailed'))
      }
    }

    void paintQr()

    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((expiredAt - Date.now()) / 1000))
      setRemain(left)
      if (left <= 0) {
        setStatus('expired')
        window.clearInterval(tick)
        void api.getBillingOrder(checkout.out_trade_no).catch(() => undefined)
      }
    }, 250)

    const poll = window.setInterval(async () => {
      if (!checkout.out_trade_no) return
      try {
        const order = await api.getBillingOrder(checkout.out_trade_no)
        if (order.status === 'paid') {
          setStatus('paid')
          window.clearInterval(poll)
          window.clearInterval(tick)
          handlePaid()
        } else if (order.status === 'closed') {
          setStatus('expired')
          window.clearInterval(poll)
          window.clearInterval(tick)
        }
      } catch {
        /* ignore transient poll errors */
      }
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(tick)
      window.clearInterval(poll)
    }
  }, [open, checkout])

  async function confirmPaid() {
    if (!checkout) return
    setChecking(true)
    setError('')
    try {
      const order = await api.getBillingOrder(checkout.out_trade_no)
      if (order.status === 'paid') {
        setStatus('paid')
        handlePaid()
      } else {
        setError(
          checkout.pay_mode === 'redirect'
            ? t('billing.payment.waitingPayment')
            : t('billing.payment.waitingRetry'),
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('billing.payment.queryFailed'))
    } finally {
      setChecking(false)
    }
  }

  if (!checkout) return null

  const isAlipay = checkout.pay_type === 'alipay'
  const isRedirect = checkout.pay_mode === 'redirect' || (!checkout.qr_payload && !!checkout.payurl)
  const title = isRedirect
    ? isAlipay
      ? t('billing.payment.alipay')
      : t('billing.payment.wechat')
    : isAlipay
      ? t('billing.payment.alipayQr')
      : t('billing.payment.wechatQr')
  const tip = isRedirect
    ? t('billing.payment.tipRedirect')
    : isAlipay
      ? t('billing.payment.tipAlipay')
      : t('billing.payment.tipWechat')

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={status !== 'waiting'}
      className="pf-pay-modal"
      size="md"
    >
      <div className="pf-pay-sheet">
        <header className="pf-pay-sheet-head">
          <div className="pf-pay-sheet-title">
            <PaymentBrandIcon brand={isAlipay ? 'alipay' : 'wxpay'} size="md" />
            <strong>{title}</strong>
          </div>
          <button type="button" className="pf-pay-sheet-close" onClick={() => void handleCancel()} aria-label={t('common.close')}>
            ×
          </button>
        </header>

        <div className="pf-pay-sku-box">
          <strong>{checkout.sku_name}</strong>
          <span>{t('billing.history.creditLabel').replace('{amount}', yuan(checkout.credit_fen))}</span>
        </div>

        <div className="pf-pay-amount">
          <span>{t('billing.payment.payAmount')}</span>
          <em>¥{yuan(checkout.amount_fen)}</em>
        </div>

        <div className="pf-pay-qr-wrap">
          {isRedirect ? (
            <div className="pf-pay-qr is-empty pf-pay-redirect-box">
              <p>{t('billing.payment.redirectOpened')}</p>
              <button type="button" className="pf-pay-btn primary" onClick={openCashier}>
                {t('billing.payment.openCashier')}
              </button>
            </div>
          ) : qrDataUrl ? (
            <div className="pf-pay-qr">
              <img src={qrDataUrl} alt={t('billing.payment.scanToPay')} width={220} height={220} />
              <span className={`pf-pay-qr-badge ${isAlipay ? 'alipay' : 'wxpay'}`} aria-hidden />
            </div>
          ) : (
            <div className="pf-pay-qr is-empty">{error || t('billing.payment.qrLoading')}</div>
          )}
          <p className="pf-pay-tip">{tip}</p>
          <p className={`pf-pay-expire${status === 'expired' ? ' is-expired' : ''}`}>
            <span className="pf-pay-clock" aria-hidden />
            {status === 'expired'
              ? isRedirect
                ? t('billing.payment.expiredRedirect')
                : t('billing.payment.expiredQr')
              : isRedirect
                ? t('billing.payment.countdownRedirect').replace('{time}', formatRemain(remain))
                : t('billing.payment.countdownQr').replace('{time}', formatRemain(remain))}
          </p>
          <p className={`pf-pay-wait${status === 'paid' ? ' is-paid' : ''}`}>
            <span className="pf-pay-dot" aria-hidden />
            {status === 'paid'
              ? t('billing.payment.paidSuccess')
              : status === 'expired'
                ? t('billing.payment.orderExpired')
                : t('billing.payment.waitingResult')}
          </p>
        </div>

        {error ? <p className="pf-error pf-pay-error">{error}</p> : null}

        <div className="pf-pay-actions">
          <button type="button" className="pf-pay-btn ghost" onClick={() => void handleCancel()}>
            {t('billing.payment.cancelPay')}
          </button>
          <button
            type="button"
            className="pf-pay-btn primary"
            disabled={checking || status === 'paid' || status === 'expired'}
            onClick={() => void confirmPaid()}
          >
            {checking ? t('billing.payment.confirming') : status === 'paid' ? t('billing.payment.credited') : t('billing.payment.confirmPaid')}
          </button>
        </div>

        <p className="pf-pay-secure-line">
          <span className="pf-pay-shield" aria-hidden />
          {t('billing.payment.secureNote')}
        </p>
      </div>
    </Modal>
  )
}
