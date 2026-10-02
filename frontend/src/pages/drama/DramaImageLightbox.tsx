import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../i18n'

type Props = {
  src: string
  alt?: string
  onClose: () => void
}

// Render lớp phóng đại hình ảnh
export function DramaImageLightbox({ src, alt, onClose }: Props) {
  const { t } = useI18n()
  const displayAlt = alt || t('drama.assetsStep.previewImage')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey, true)
    }
  }, [onClose])

  return createPortal(
    <div
      className="drama-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('drama.assetsStep.previewImage')}
      onClick={onClose}
    >
      <button
        type="button"
        className="drama-lightbox-close"
        aria-label={t('common.close')}
        onClick={onClose}
      >
        ×
      </button>
      <img
        className="drama-lightbox-img"
        src={src}
        alt={displayAlt}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  )
}
