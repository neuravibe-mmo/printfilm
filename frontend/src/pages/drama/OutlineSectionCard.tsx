import React, { type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Pencil,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useI18n } from '../../i18n'

export type SectionKey = 'creative' | 'summary' | 'body'

export type SectionCardProps = {
  sectionKey: SectionKey
  icon: ReactNode
  title: string
  subtitle: string
  text: string
  editing: boolean
  draft: string
  open: boolean
  busy: boolean
  /** Tắt nút "Tạo"; tập này vẫn có thể được chỉnh sửa trong khi các tập khác đang được tạo */
  generateBusy?: boolean
  placeholder: string
  regenerateLabel?: string
  regenerateIcon?: ReactNode
  highlighted?: boolean
  containerRef?: React.Ref<HTMLElement>
  onToggle: () => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onDraftChange: (v: string) => void
  onRegenerate?: () => void
  onCopy: () => void
  /** Vùng tập lệnh: xem trước phân tích + chỉnh sửa phân đoạn */
  scriptPreview?: ReactNode
}

export const SectionCard: React.FC<SectionCardProps> = React.memo(function SectionCard({

  sectionKey,
  icon,
  title,
  subtitle,
  text,
  editing,
  draft,
  open,
  busy,
  generateBusy,
  placeholder,
  regenerateLabel,
  regenerateIcon,
  highlighted,
  containerRef,
  onToggle,
  onEdit,
  onCancel,
  onSave,
  onDraftChange,
  onRegenerate,
  onCopy,
  scriptPreview,
}: SectionCardProps) {
  const { t } = useI18n()
  const genBusy = generateBusy ?? busy
  return (
    <article
      ref={containerRef}
      className={`drama-outline-section is-${sectionKey}${open ? ' is-open' : ''}${highlighted ? ' is-highlighted' : ''}`}
    >
      <header className="drama-outline-section-head">
        <div className="drama-outline-section-title">
          <span className={`drama-outline-section-icon is-${sectionKey}`} aria-hidden>
            {icon}
          </span>
          <div>
            <strong>{title}</strong>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="drama-outline-section-actions">
          <button type="button" className="drama-outline-text-btn" disabled={busy} onClick={onEdit}>
            <Pencil size={14} strokeWidth={2} />
            {t('common.edit')}
          </button>
          {onRegenerate && regenerateLabel ? (
            <button
              type="button"
              className={`drama-outline-text-btn${regenerateLabel === 'AI Generate' ? ' is-ai-btn' : ''}`}
              disabled={genBusy}
              onClick={onRegenerate}
            >
              {regenerateIcon || <RefreshCw size={14} strokeWidth={2} />}
              {regenerateLabel}
            </button>
          ) : null}
          <button type="button" className="drama-outline-text-btn" onClick={onCopy}>
            <Copy size={14} strokeWidth={2} />
            {t('common.copy')}
          </button>
          <button
            type="button"
            className="drama-outline-text-btn drama-outline-text-btn-icon"
            onClick={onToggle}
            aria-label={open ? t('drama.outlinePanel.collapse') : t('drama.outlinePanel.expand')}
          >
            {open ? (
              <ChevronUp size={14} strokeWidth={2} />
            ) : (
              <ChevronDown size={14} strokeWidth={2} />
            )}
            {open ? t('drama.outlinePanel.collapse') : t('drama.outlinePanel.expand')}
          </button>
        </div>
      </header>
      {open ? (
        <div className="drama-outline-section-body">
          {editing ? (
            <>
              <textarea
                className="drama-ep-section-textarea"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                rows={sectionKey === 'body' ? 14 : 8}
                placeholder={placeholder}
                disabled={busy}
              />
              <div className="drama-ep-section-edit-actions">
                <button type="button" className="drama-btn-ghost" disabled={busy} onClick={onCancel}>
                  {t('common.cancel')}
                </button>
                <button type="button" className="drama-btn-primary" disabled={busy} onClick={onSave}>
                  {t('common.save')}
                </button>
              </div>
            </>
          ) : scriptPreview ? (
            scriptPreview
          ) : !text.trim() && onRegenerate ? (
            <div className="drama-outline-empty-creative">
              <p className="drama-pre drama-outline-section-text">{placeholder}</p>
              <button
                type="button"
                className="drama-outline-ai-gen-btn"
                disabled={genBusy}
                onClick={onRegenerate}
              >
                {regenerateIcon || <Sparkles size={14} />}
                <span>{regenerateLabel || 'AI Generate'}</span>
              </button>
            </div>
          ) : (
            <p className="drama-pre drama-outline-section-text">{text.trim() || placeholder}</p>
          )}
        </div>
      ) : null}
    </article>
  )
})

export const OutlineSectionCard = SectionCard
