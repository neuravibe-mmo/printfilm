import { useI18n } from '../../../i18n'
import { api } from '../../../api'
import type { Project } from '../../../api'
import { formatMmSs } from '../../../lib/status'

export interface StoryboardBatchModalProps {
  open: boolean
  busy: boolean
  project: Project
  batchSelected: number[]
  onSelectAll: (checked: boolean) => void
  onToggleShot: (shotId: number) => void
  batchDuration: string
  onChangeBatchDuration: (val: string) => void
  batchDurationError: string | null
  minAllowedDuration: number
  maxAllowedDuration: number
  batchRegenAudio: boolean
  onChangeBatchRegenAudio: (val: boolean) => void
  canApplyBatch: boolean
  onApply: () => void
  onClose: () => void
}

export default function StoryboardBatchModal({
  open,
  busy,
  project,
  batchSelected,
  onSelectAll,
  onToggleShot,
  batchDuration,
  onChangeBatchDuration,
  batchDurationError,
  minAllowedDuration,
  maxAllowedDuration,
  batchRegenAudio,
  onChangeBatchRegenAudio,
  canApplyBatch,
  onApply,
  onClose,
}: StoryboardBatchModalProps) {
  const { t } = useI18n()

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal pf-batch-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t('studio.storyboard.batchPanel')}</h3>
        <div className="pf-batch-modal-head">
          <div className="pf-batch-select-all">
            <label className="pf-checkbox-label">
              <input
                type="checkbox"
                checked={
                  batchSelected.length === project.shots.length && project.shots.length > 0
                }
                onChange={(e) => onSelectAll(e.target.checked)}
              />
              <span>{t('studio.storyboard.selectAll')}</span>
            </label>
            <span className="pf-muted">
              {t('studio.storyboard.batchSelected')
                .replace('{n}', String(batchSelected.length))
                .replace('{total}', String(project.shots.length))}
            </span>
          </div>
        </div>

        <div className="pf-batch-grid">
          {project.shots
            .slice()
            .sort((a, b) => a.shot_no - b.shot_no)
            .map((s) => {
              const isChecked = batchSelected.includes(s.id)
              return (
                <div
                  key={s.id}
                  className={`pf-batch-shot-item ${isChecked ? 'is-selected' : ''}`}
                  onClick={() => onToggleShot(s.id)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleShot(s.id)
                    }}
                  />
                  {s.image_url ? (
                    <img
                      src={api.assetUrl(s.image_url, s.version)}
                      alt=""
                      className="thumb"
                    />
                  ) : (
                    <div className="thumb empty">
                      <span>{String(s.shot_no).padStart(2, '0')}</span>
                    </div>
                  )}
                  <div className="meta">
                    <strong className="title">
                      {t('studio.storyboard.shotLabel')} {String(s.shot_no).padStart(2, '0')}
                    </strong>
                    <span className="dur">{formatMmSs(Number(s.duration) || 0)}</span>
                  </div>
                </div>
              )
            })}
        </div>
        <label>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.25rem',
            }}
          >
            <span>{t('studio.storyboard.uniformDuration')}</span>
            <span className="pf-muted" style={{ fontSize: '0.78rem' }}>
              ({minAllowedDuration}s - {maxAllowedDuration}s)
            </span>
          </div>
          <input
            type="number"
            min={minAllowedDuration}
            max={maxAllowedDuration}
            step={0.5}
            placeholder={t('studio.storyboard.batchDurationPlaceholder')
              .replace('{min}', String(minAllowedDuration))
              .replace('{max}', String(maxAllowedDuration))}
            value={batchDuration}
            onChange={(e) => onChangeBatchDuration(e.target.value)}
            style={{
              borderColor: batchDurationError ? 'var(--pf-danger, #ef4444)' : undefined,
            }}
          />
          {batchDurationError ? (
            <span
              style={{
                color: 'var(--pf-danger, #ef4444)',
                fontSize: '0.78rem',
                marginTop: '0.35rem',
                display: 'block',
              }}
            >
              {batchDurationError}
            </span>
          ) : null}
        </label>
        <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={batchRegenAudio}
            onChange={(e) => onChangeBatchRegenAudio(e.target.checked)}
          />
          {t('studio.storyboard.redubSelected')}
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="pf-btn pf-btn-lime"
            disabled={!canApplyBatch}
            onClick={onApply}
          >
            {t('common.apply')}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-ghost"
            disabled={busy}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
