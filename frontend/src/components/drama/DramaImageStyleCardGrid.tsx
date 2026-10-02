/** Lưới thẻ kiểu ảnh: Không có kiểu + tùy chọn hình thu nhỏ */
import { Check } from 'lucide-react'
import { DramaImageStylePreviewImg } from './DramaImageStylePreviewImg'
import { getImageStyleLabel, IMAGE_STYLE_OPTIONS, type ImageStyleId } from '../../lib/dramaImageStyles'
import { useI18n } from '../../i18n'

type Props = {
  value: ImageStyleId | ''
  onChange: (id: ImageStyleId | '') => void
  allowNone?: boolean
  noneLabel?: string
  className?: string
}

// Hiển thị lưới thẻ kiểu màn hình có thể nhấp
export function DramaImageStyleCardGrid({
  value,
  onChange,
  allowNone = true,
  noneLabel,
  className,
}: Props) {
  const { t, locale } = useI18n()
  const defaultNoneLabel = noneLabel ?? t('drama.styleModal.none') ?? 'Không phong cách'

  return (
    <div className={['drama-style-modal-grid', className].filter(Boolean).join(' ')}>
      {allowNone ? (
        <button
          type="button"
          className={`drama-style-modal-none${!value ? ' is-selected' : ''}`}
          onClick={() => onChange('')}
        >
          {!value ? <Check className="drama-style-modal-check" size={12} strokeWidth={2.5} /> : null}
          {defaultNoneLabel}
        </button>
      ) : null}
      {IMAGE_STYLE_OPTIONS.map((opt) => {
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
  )
}
