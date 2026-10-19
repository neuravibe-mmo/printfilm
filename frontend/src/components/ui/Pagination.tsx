import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../lib/pagination'
import { useI18n } from '../../i18n'

type Props = {
  page: number
  pageCount: number
  onChange: (page: number) => void
  /** Tổng số mục, bản tóm tắt sẽ được hiển thị sau khi nhập */
  total?: number
  /** Số mục hiện tại trên mỗi trang */
  pageSize?: number
  /** Tùy chọn số mục trên mỗi trang; trình chuyển đổi hiển thị với onPageSizeChange */
  pageSizeOptions?: readonly number[]
  onPageSizeChange?: (pageSize: number) => void
  className?: string
  ariaLabel?: string
  /** Có hiển thị tóm tắt "Tổng cộng trang x / y · z mục" hay không */
  showSummary?: boolean
}

// Tạo chuỗi số trang bằng dấu chấm lửng
function buildPageItems(page: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const items: Array<number | '…'> = [1]
  if (page > 3) items.push('…')
  for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) {
    items.push(i)
  }
  if (page < pageCount - 2) items.push('…')
  items.push(pageCount)
  return items
}

/** Kiểm soát phân trang thống nhất: điều hướng trang + số mục tùy chọn trên mỗi trang + tóm tắt */
export default function Pagination({
  page,
  pageCount,
  onChange,
  total,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  className,
  ariaLabel,
  showSummary = true,
}: Props) {
  const { t } = useI18n()
  const navLabel = ariaLabel || t('common.pagination')
  const sizeOptions = onPageSizeChange ? pageSizeOptions : undefined
  const canPickSize = Boolean(sizeOptions?.length && pageSize && onPageSizeChange)
  const showNav = pageCount > 1
  const summaryVisible = showSummary && total != null && total >= 0

  const [sizeOpen, setSizeOpen] = useState(false)
  const sizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sizeOpen) return
    const onPointer = (e: MouseEvent) => {
      if (!sizeRef.current?.contains(e.target as Node)) {
        setSizeOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSizeOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [sizeOpen])

  if (!showNav && !canPickSize && !summaryVisible) return null

  const items = buildPageItems(page, pageCount)
  const pageSizeBefore = t('common.pageSizeBefore')
  const pageSizeAfter = t('common.pageSizeAfter')

  return (
    <div className={cn('pf-list-pagination', className)}>
      {summaryVisible ? (
        <p className="pf-list-pagination-summary">
          {t('common.pageSummary', { page, pageCount, total: total ?? 0 })}
        </p>
      ) : null}

      {(showNav || canPickSize) && (
        <div className="pf-list-pagination-bar">
          {canPickSize ? (
            <div className="pf-page-size">
              {pageSizeBefore ? <span>{pageSizeBefore}</span> : null}
              <div className={cn('pf-page-size-picker', sizeOpen && 'is-open')} ref={sizeRef}>
                <button
                  type="button"
                  className="pf-page-size-trigger"
                  aria-label={t('common.pageSize')}
                  aria-haspopup="listbox"
                  aria-expanded={sizeOpen}
                  onClick={() => setSizeOpen((v) => !v)}
                >
                  <span className="pf-page-size-val">{pageSize}</span>
                  <ChevronDown size={13} strokeWidth={2.2} className="pf-page-size-chevron" aria-hidden />
                </button>
                {sizeOpen ? (
                  <ul className="pf-page-size-menu" role="listbox">
                    {sizeOptions!.map((n) => {
                      const selected = n === pageSize
                      return (
                        <li key={n} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={cn('pf-page-size-option', selected && 'is-selected')}
                            onClick={() => {
                              onPageSizeChange?.(n)
                              setSizeOpen(false)
                            }}
                          >
                            <span>{n}</span>
                            {selected ? (
                              <Check size={13} strokeWidth={2.5} className="pf-page-size-check" aria-hidden />
                            ) : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
              {pageSizeAfter ? <span>{pageSizeAfter}</span> : null}
            </div>
          ) : null}

          {showNav ? (
            <nav className="pf-pagination" aria-label={navLabel}>
              <button
                type="button"
                className="pf-page-btn"
                disabled={page <= 1}
                aria-label={t('common.prevPage')}
                onClick={() => onChange(Math.max(1, page - 1))}
              >
                ‹
              </button>
              {items.map((item, i) =>
                item === '…' ? (
                  <span key={`e-${i}`} className="pf-page-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={cn('pf-page-btn', page === item && 'active')}
                    aria-current={page === item ? 'page' : undefined}
                    onClick={() => onChange(item)}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                className="pf-page-btn"
                disabled={page >= pageCount}
                aria-label={t('common.nextPage')}
                onClick={() => onChange(Math.min(pageCount, page + 1))}
              >
                ›
              </button>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  )
}
