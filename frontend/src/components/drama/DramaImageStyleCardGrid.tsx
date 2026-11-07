/** Lưới thẻ kiểu ảnh: Bộ lọc danh mục + Không có kiểu + tùy chọn hình thu nhỏ */
import { useMemo, useState } from 'react'
import { AlertCircle, Check, Loader2, Sparkles, X } from 'lucide-react'
import { DramaImageStylePreviewImg } from './DramaImageStylePreviewImg'
import {
  getImageStyleLabel,
  IMAGE_STYLE_CATEGORIES,
  IMAGE_STYLE_OPTIONS,
  type ImageStyleCategoryId,
  type ImageStyleId,
} from '../../lib/dramaImageStyles'
import { dramaApi } from '../../api/drama'
import { useI18n } from '../../i18n'

type Props = {
  value: ImageStyleId | ''
  onChange: (id: ImageStyleId | '') => void
  allowNone?: boolean
  noneLabel?: string
  className?: string
  content?: string
  projectId?: number
}

// Hiển thị lưới thẻ kiểu màn hình có thể nhấp và lọc theo nhóm
export function DramaImageStyleCardGrid({
  value,
  onChange,
  allowNone = true,
  noneLabel,
  className,
  content,
  projectId,
}: Props) {
  const { t, locale } = useI18n()
  const defaultNoneLabel = noneLabel ?? t('drama.styleModal.none') ?? 'Không phong cách'
  const [selectedCategory, setSelectedCategory] = useState<ImageStyleCategoryId>('all')
  const [autoLoading, setAutoLoading] = useState(false)
  const [statusNotice, setStatusNotice] = useState<{
    type: 'error' | 'success'
    message: string
  } | null>(null)

  const hasContent = Boolean(content && content.trim().length > 0)

  const filteredOptions = useMemo(() => {
    if (selectedCategory === 'all') return IMAGE_STYLE_OPTIONS
    return IMAGE_STYLE_OPTIONS.filter((opt) => opt.categoryId === selectedCategory)
  }, [selectedCategory])

  async function handleAutoMatch() {
    if (!hasContent || autoLoading) return
    setAutoLoading(true)
    setStatusNotice(null)
    try {
      const res = await dramaApi.matchImageStyle(content!.trim(), projectId)
      if (res.ok && res.style_id) {
        const matchedId = res.style_id as ImageStyleId
        onChange(matchedId)
        // Tìm danh mục tương ứng để mở tab cho người dùng thấy ngay thẻ được chọn
        const opt = IMAGE_STYLE_OPTIONS.find((o) => o.id === matchedId)
        if (opt && selectedCategory !== 'all' && selectedCategory !== opt.categoryId) {
          setSelectedCategory(opt.categoryId)
        }
        const label = res.style_label || getImageStyleLabel(matchedId, locale) || matchedId
        setStatusNotice({
          type: 'success',
          message: res.reason
            ? `AI đã chọn phong cách "${label}": ${res.reason}`
            : `AI đã chọn phong cách "${label}" phù hợp nhất với nội dung của bạn.`,
        })
      } else {
        setStatusNotice({
          type: 'error',
          message:
            res.reason ||
            'Không tìm thấy phong cách phù hợp với nội dung này. Vui lòng thử chọn phong cách thủ công.',
        })
      }
    } catch (err) {
      setStatusNotice({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra lại mạng hoặc chọn thủ công.',
      })
    } finally {
      setAutoLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Thanh tab lọc theo nhóm thể loại + Nút Tự động chọn bằng AI */}
      <div
        className="drama-style-cat-pills"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          padding: '6px 2px 10px',
          scrollbarWidth: 'thin',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 2,
        }}
      >
        {/* Nút Tự động chọn phong cách bằng AI */}
        <button
          type="button"
          className={`drama-style-auto-btn ${autoLoading ? 'is-loading' : ''}`}
          disabled={!hasContent || autoLoading}
          onClick={() => void handleAutoMatch()}
          title={
            !hasContent
              ? 'Vui lòng nhập nội dung câu chuyện/ý tưởng trước để kích hoạt AI tự động chọn phong cách'
              : 'Yêu cầu AI phân tích nội dung và tự động chọn phong cách hình ảnh phù hợp nhất'
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: hasContent
              ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
              : '#f1f5f9',
            color: hasContent ? '#ffffff' : '#94a3b8',
            border: hasContent ? '1px solid #7c3aed' : '1px solid rgba(0, 0, 0, 0.08)',
            cursor: hasContent && !autoLoading ? 'pointer' : 'not-allowed',
            opacity: !hasContent ? 0.6 : 1,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: hasContent ? '0 1px 3px rgba(124, 58, 237, 0.25)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {autoLoading ? (
            <Loader2 size={14} className="pf-spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Sparkles size={14} />
          )}
          <span>{autoLoading ? 'Đang phân tích...' : 'Tự động'}</span>
        </button>

        <span
          style={{
            width: '1px',
            height: '20px',
            background: 'rgba(0, 0, 0, 0.12)',
            flexShrink: 0,
            margin: '0 2px',
          }}
          aria-hidden
        />

        {IMAGE_STYLE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              className={`drama-style-cat-pill ${isActive ? 'is-active' : ''}`}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                background: isActive ? '#7c3aed' : '#f1f5f9',
                color: isActive ? '#fff' : '#475569',
                border: isActive ? '1px solid #7c3aed' : '1px solid rgba(0, 0, 0, 0.08)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Thông báo kết quả AI tự động hoặc lỗi */}
      {statusNotice ? (
        <div
          className={`drama-style-auto-notice is-${statusNotice.type}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            lineHeight: 1.45,
            background: statusNotice.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: statusNotice.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
            color: statusNotice.type === 'error' ? '#b91c1c' : '#15803d',
            marginBottom: 2,
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {statusNotice.type === 'error' ? (
              <AlertCircle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
            ) : (
              <Sparkles size={16} style={{ flexShrink: 0, color: '#16a34a' }} />
            )}
            <span>{statusNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.7,
            }}
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className={['drama-style-modal-grid', className].filter(Boolean).join(' ')}>
        {allowNone && selectedCategory === 'all' ? (
          <button
            type="button"
            className={`drama-style-modal-none${!value ? ' is-selected' : ''}`}
            onClick={() => onChange('')}
          >
            {!value ? <Check className="drama-style-modal-check" size={12} strokeWidth={2.5} /> : null}
            {defaultNoneLabel}
          </button>
        ) : null}
        {filteredOptions.map((opt) => {
          const selected = value === opt.id
          const localizedLabel = getImageStyleLabel(opt.id, locale) || opt.label
          return (
            <button
              key={opt.id}
              type="button"
              className={`drama-style-modal-card${selected ? ' is-selected' : ''}`}
              onClick={() => onChange(opt.id)}
            >
              <DramaImageStylePreviewImg styleId={opt.id} alt={localizedLabel} />
              <span>{localizedLabel}</span>
              {selected ? (
                <Check className="drama-style-modal-check on-media" size={12} strokeWidth={2.5} />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

