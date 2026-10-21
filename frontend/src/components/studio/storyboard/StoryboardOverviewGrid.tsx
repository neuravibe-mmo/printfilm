import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText } from 'lucide-react'
import { useI18n } from '../../../i18n'
import type { Project } from '../../../api'
import { statusLabel } from '../../../lib/status'

export interface StoryboardOverviewGridProps {
  project: Project
  structure: Array<{ label: string; text: string }>
  progressItems: Array<{ label: string; done: boolean; run?: boolean; pct?: number }>
}

export default function StoryboardOverviewGrid({
  project,
  structure,
  progressItems,
}: StoryboardOverviewGridProps) {
  const { t } = useI18n()
  const [showFullOutlineTooltip, setShowFullOutlineTooltip] = useState(false)
  const [outlineTooltipPos, setOutlineTooltipPos] = useState<{
    top: number
    left: number
  } | null>(null)
  const outlineRef = useRef<HTMLDivElement | null>(null)
  const outlineLeaveTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleOutlineMouseEnter = useCallback(() => {
    if (outlineLeaveTimeout.current) {
      clearTimeout(outlineLeaveTimeout.current)
      outlineLeaveTimeout.current = null
    }
    const el = outlineRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tooltipWidth = Math.min(520, window.innerWidth - 32)
    const tooltipHeight = 400

    const spaceRight = window.innerWidth - rect.right
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    let top = 0
    let left = 0

    if (spaceRight >= tooltipWidth + 24) {
      left = rect.right + 12
      top = Math.max(16, Math.min(rect.top, window.innerHeight - tooltipHeight - 16))
    } else if (spaceBelow >= tooltipHeight + 16 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8
      left = Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16))
    } else {
      top = Math.max(16, rect.top - tooltipHeight - 8)
      left = Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16))
    }

    setOutlineTooltipPos({ top, left })
    setShowFullOutlineTooltip(true)
  }, [])

  const handleOutlineMouseLeave = useCallback(() => {
    outlineLeaveTimeout.current = setTimeout(() => {
      setShowFullOutlineTooltip(false)
    }, 200)
  }, [])

  const handleTooltipMouseEnter = useCallback(() => {
    if (outlineLeaveTimeout.current) {
      clearTimeout(outlineLeaveTimeout.current)
      outlineLeaveTimeout.current = null
    }
  }, [])

  const handleTooltipMouseLeave = useCallback(() => {
    outlineLeaveTimeout.current = setTimeout(() => {
      setShowFullOutlineTooltip(false)
    }, 200)
  }, [])

  const sourceText = project.source_text || ''
  const isTruncated = sourceText.length > 700
  const displaySourceText = isTruncated ? `${sourceText.slice(0, 700)}...` : sourceText

  return (
    <div className="pf-outline-grid">
      <article className="pf-create-col">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.45rem',
          }}
        >
          <h3 style={{ margin: 0 }}>{t('studio.storyboard.aiOutline')}</h3>
          {isTruncated ? (
            <span
              className="pf-outline-badge"
              onMouseEnter={handleOutlineMouseEnter}
              onMouseLeave={handleOutlineMouseLeave}
              onClick={() => setShowFullOutlineTooltip((prev) => !prev)}
            >
              Xem đầy đủ ({sourceText.length.toLocaleString()} ký tự)
            </span>
          ) : null}
        </div>
        <div
          ref={outlineRef}
          className={isTruncated ? 'pf-outline-hoverable' : ''}
          onMouseEnter={isTruncated ? handleOutlineMouseEnter : undefined}
          onMouseLeave={isTruncated ? handleOutlineMouseLeave : undefined}
          onClick={isTruncated ? () => setShowFullOutlineTooltip((prev) => !prev) : undefined}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
          >
            {displaySourceText}
          </p>
        </div>
        <div className="pf-tags">
          <span>{t('studio.storyboard.coreTheme')}</span>
          <span>
            {project.source_type === 'script'
              ? t('studio.storyboard.fullScript')
              : t('studio.storyboard.oneLineTheme')}
          </span>
        </div>
      </article>

      {showFullOutlineTooltip && outlineTooltipPos && sourceText && createPortal(
        <div
          className="pf-full-outline-tooltip-portal"
          style={{
            position: 'fixed',
            top: `${outlineTooltipPos.top}px`,
            left: `${outlineTooltipPos.left}px`,
            width: `${Math.min(520, window.innerWidth - 32)}px`,
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          role="tooltip"
        >
          <div className="pf-full-outline-tooltip-bubble">
            <div className="pf-full-outline-tooltip-header">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                }}
              >
                <FileText size={15} />
                <span>{t('studio.storyboard.aiOutline')} (Đầy đủ)</span>
              </div>
              <span className="pf-char-count-badge">
                {sourceText.length.toLocaleString()} ký tự
              </span>
            </div>
            <div className="pf-full-outline-tooltip-body">{sourceText}</div>
          </div>
        </div>,
        document.body,
      )}

      <article className="pf-create-col">
        <h3>{t('studio.storyboard.structureSummary')}</h3>
        <ul className="pf-meta-list">
          {structure.length ? (
            structure.map((s) => (
              <li key={s.label}>
                <span>{s.label}</span>
                <span style={{ maxWidth: '72%', textAlign: 'right' }} title={s.text}>
                  {s.text}
                </span>
              </li>
            ))
          ) : (
            <li>
              <span>{t('studio.storyboard.waitingShots')}</span>
              <span>—</span>
            </li>
          )}
        </ul>
      </article>

      <aside className="pf-create-col pf-board-settings">
        <h3>{t('studio.storyboard.genProgress')}</h3>
        <ul className="pf-progress-list">
          {progressItems.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <span>
                {item.done ? (
                  <span className="pf-check">✓</span>
                ) : item.run ? (
                  `${item.pct ?? 0}%`
                ) : (
                  '…'
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="pf-meter" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <i style={{ width: `${Math.min(100, project.progress)}%` }} />
        </div>
        <p className="pf-muted" style={{ margin: '0.35rem 0 0', fontSize: '0.78rem' }}>
          {statusLabel(project)}
        </p>
      </aside>
    </div>
  )
}
