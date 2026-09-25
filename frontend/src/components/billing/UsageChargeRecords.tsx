import { useCallback, useEffect, useState } from 'react'
import { api, type UsageChargeRecord } from '../../api'
import Pagination from '../ui/Pagination'
import { pageCountOf } from '../../lib/pagination'
import { useI18n, type Locale } from '../../i18n'

const BILLING_LABEL_MAP: Record<string, Record<Locale, string>> = {
  'LLM 对话': { zh: 'LLM 对话', en: 'LLM Chat', vi: 'Đối thoại LLM' },
  '图片生成': { zh: '图片生成', en: 'Image Generation', vi: 'Tạo hình ảnh' },
  '视频生成': { zh: '视频生成', en: 'Video Generation', vi: 'Tạo video' },
  '语音合成': { zh: '语音合成', en: 'Voice Synthesis', vi: 'Tổng hợp giọng nói' },
  '其他': { zh: '其他', en: 'Other', vi: 'Khác' },
}

function formatBillingLabel(label: string, locale: Locale): string {
  return BILLING_LABEL_MAP[label]?.[locale] ?? label
}

function formatContext(context: string, locale: Locale): string {
  if (locale === 'zh') return context
  if (context === '工具创作') {
    return locale === 'vi' ? 'Sáng tác công cụ' : 'Tool Creation'
  }
  if (context.startsWith('漫剧 · ')) {
    const rest = context.replace(/^漫剧 · /, '')
    const prefix = locale === 'vi' ? 'Phim ngắn' : 'Drama'
    return `${prefix} · ${rest.replace(/项目 #/g, locale === 'vi' ? 'Dự án #' : 'Project #')}`
  }
  if (context.startsWith('科普 · ')) {
    const rest = context.replace(/^科普 · /, '')
    const prefix = locale === 'vi' ? 'Khoa học' : 'Explainer'
    return `${prefix} · ${rest.replace(/项目 #/g, locale === 'vi' ? 'Dự án #' : 'Project #')}`
  }
  return context
}

/** 格式化相对时间展示 */
function formatWhen(iso?: string | null, locale: Locale = 'zh') {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const locMap: Record<Locale, string> = { zh: 'zh-CN', en: 'en-US', vi: 'vi-VN' }
  return d.toLocaleString(locMap[locale] || 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 格式化 token 数量 */
function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 10_000) return `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k`
  return n.toLocaleString('zh-CN')
}

type UsageChargeRecordsProps = {
  /** 嵌入设置页时为 compact */
  variant?: 'panel' | 'compact'
}

/** 使用扣费记录列表：按次展示 LLM / 生图 / 生视频等计费明细 */
export default function UsageChargeRecords({ variant = 'compact' }: UsageChargeRecordsProps) {
  const { t, locale } = useI18n()
  const [items, setItems] = useState<UsageChargeRecord[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pageCount = pageCountOf(total, pageSize)

  // 拉取指定页
  const loadPage = useCallback(async (nextPage: number, size: number) => {
    if (!localStorage.getItem('token')) {
      setItems([])
      setTotal(0)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.usageEvents(nextPage, size)
      setTotal(res.meta.total)
      setPage(nextPage)
      setItems(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('billing.usageRecords.loadFailed'))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadPage(page, pageSize)
  }, [loadPage, page, pageSize])

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize)
    setPage(1)
  }

  return (
    <section className={`pf-usage-records${variant === 'compact' ? ' is-compact' : ''}`}>
      <header className="pf-usage-records-head">
        <h3>{t('billing.usageRecords.title')}</h3>
        <p className="pf-muted">{t('billing.usageRecords.subtitle')}</p>
      </header>

      {loading ? <p className="pf-muted">{t('billing.usageRecords.loading')}</p> : null}
      {error ? <p className="pf-error">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="pf-settings-empty">
          <p>{t('billing.usageRecords.empty')}</p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="pf-settings-list pf-usage-records-list">
          {items.map((item) => (
            <li key={item.id}>
              <div className="pf-settings-list-row pf-usage-record-row">
                <span className="pf-settings-list-main">
                  <strong>{formatBillingLabel(item.billing_label, locale)}</strong>
                  <em className="pf-muted">
                    {formatContext(item.context, locale)}
                    {item.total_tokens > 0 ? ` · ${formatTokens(item.total_tokens)} tokens` : ''}
                    {item.estimated ? ` · ${t('billing.usageRecords.estimated')}` : ''}
                  </em>
                </span>
                <span className="pf-settings-list-meta pf-usage-record-meta">
                  <strong className="pf-usage-record-charge">
                    {item.charge_fen > 0 ? `-¥${item.charge_yuan.toFixed(2)}` : '—'}
                  </strong>
                  <em className="pf-muted">{formatWhen(item.created_at, locale)}</em>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && total > 0 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onChange={setPage}
          ariaLabel={t('billing.usageRecords.paginationAria')}
        />
      ) : null}
    </section>
  )
}
