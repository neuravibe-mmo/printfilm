/** Lựa chọn kiểu màn hình: Kích hoạt + Lưới thẻ phương thức */
import { useState } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { DramaImageStyleCardGrid } from '../../components/drama/DramaImageStyleCardGrid'
import { DramaImageStylePreviewImg } from '../../components/drama/DramaImageStylePreviewImg'
import Modal from '../../components/ui/Modal'
import { getImageStyleLabel, type ImageStyleId } from '../../lib/dramaImageStyles'
import { useI18n } from '../../i18n'

type Props = {
  value: ImageStyleId | ''
  onChange: (id: ImageStyleId | '') => void
  disabled?: boolean
  /** thanh công cụ: nút trang danh sách; trường: trang phác thảo với trường hình thu nhỏ */
  variant?: 'toolbar' | 'field'
  /** Bản sao bên trái của biến thể trường, "kiểu dự án" mặc định */
  fieldLabel?: string
  /** Tiêu đề phương thức */
  title?: string
  /** Kích hoạt sao chép khi không được chọn */
  emptyLabel?: string
}

// Trình kích hoạt thư viện kiểu kết xuất và kiểu hình ảnh Modal
export function DramaImageStyleModal({
  value,
  onChange,
  disabled = false,
  variant = 'toolbar',
  fieldLabel,
  title,
  emptyLabel,
}: Props) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const styleLabel = getImageStyleLabel(value, locale)
  const resolvedFieldLabel = fieldLabel ?? t('drama.styleModal.projectStyle')
  const resolvedTitle = title ?? t('drama.styleModal.title')
  const triggerLabel =
    styleLabel || emptyLabel || (variant === 'field' ? t('drama.styleModal.select') : t('drama.styleModal.library'))
  const active = Boolean(value) || open

  // Chọn kiểu và đóng nó
  function select(id: ImageStyleId | '') {
    onChange(id)
    setOpen(false)
  }

  return (
    <>
      {variant === 'field' ? (
        <div className="drama-style-picker-field">
          <span className="drama-style-picker-field-label">{resolvedFieldLabel}</span>
          <button
            type="button"
            className={`drama-style-picker-trigger${active ? ' is-active' : ''}`}
            disabled={disabled}
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            {value ? (
              <span className="drama-style-picker-thumb" aria-hidden>
                <DramaImageStylePreviewImg styleId={value} alt="" loading="lazy" />
              </span>
            ) : (
              <span className="drama-style-picker-thumb is-empty" aria-hidden />
            )}
            <span className="drama-style-picker-text">{triggerLabel}</span>
            <ChevronDown size={14} strokeWidth={2} className={open ? 'is-open' : undefined} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`drama-agent-opt-trigger${active ? ' is-active' : ''}`}
          disabled={disabled}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <BookOpen size={15} strokeWidth={1.8} />
          <span className="drama-agent-opt-label">{triggerLabel}</span>
          <ChevronDown size={13} strokeWidth={2} />
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={resolvedTitle} size="md" className="drama-style-modal">
        {/* 封面即画风参考图，避免用户以为只是缩略预览 */}
        <p className="drama-style-modal-hint">
          {t('drama.styleModal.hint')}
        </p>
        <DramaImageStyleCardGrid value={value} onChange={select} noneLabel={t('drama.styleModal.none')} />
      </Modal>
    </>
  )
}
