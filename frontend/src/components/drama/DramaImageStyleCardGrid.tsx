/** Lưới thẻ kiểu ảnh: Bộ lọc danh mục + Không có kiểu + tùy chọn hình thu nhỏ */
import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { DramaImageStylePreviewImg } from './DramaImageStylePreviewImg'
import {
  getImageStyleLabel,
  IMAGE_STYLE_CATEGORIES,
  IMAGE_STYLE_OPTIONS,
  type ImageStyleCategoryId,
  type ImageStyleId,
} from '../../lib/dramaImageStyles'
import { useI18n } from '../../i18n'

type Props = {
  value: ImageStyleId | ''
  onChange: (id: ImageStyleId | '') => void
  allowNone?: boolean
  noneLabel?: string
  className?: string
}

// Hiển thị lưới thẻ kiểu màn hình có thể nhấp và lọc theo nhóm
export function DramaImageStyleCardGrid({
  value,
  onChange,
  allowNone = true,
  noneLabel,
  className,
}: Props) {
  const { t, locale } = useI18n()
  const defaultNoneLabel = noneLabel ?? t('drama.styleModal.none') ?? 'Không phong cách'
  const [selectedCategory, setSelectedCategory] = useState<ImageStyleCategoryId>('all')

  const filteredOptions = useMemo(() => {
    if (selectedCategory === 'all') return IMAGE_STYLE_OPTIONS
    return IMAGE_STYLE_OPTIONS.filter((opt) => opt.categoryId === selectedCategory)
  }, [selectedCategory])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Thanh tab lọc theo nhóm thể loại */}
      <div
        className="drama-style-cat-pills"
        style={{
          display: 'flex',
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
