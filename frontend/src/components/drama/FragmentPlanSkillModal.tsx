import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AgentSkillPicker } from './AgentSkillPicker'
import { useAgentSkillSelection } from '../../hooks/useAgentSkillSelection'
import { useI18n } from '../../i18n'

type FragmentPlanSkillModalProps = {
  open: boolean
  title?: string
  message: string
  confirmText?: string
  onCancel: () => void
  onConfirm: (skillIds: number[]) => void
}

/** 覆盖分镜前让用户勾选 Skill */
export function FragmentPlanSkillModal({
  open,
  title,
  message,
  confirmText,
  onCancel,
  onConfirm,
}: FragmentPlanSkillModalProps) {
  const { t } = useI18n()
  const displayTitle = title || t('drama.episodeEdit.aiReplan')
  const displayConfirm = confirmText || t('drama.episodeEdit.startReplan')

  const { skills, selectedIds, toggleSkill, selectAll, selectNone, uploadSkill, uploading, uploadError } =
    useAgentSkillSelection()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="pf-dialog-root" role="presentation">
      <div className="pf-dialog-veil" aria-hidden onMouseDown={onCancel} />
      <form
        className="pf-dialog pf-dialog--danger pf-dialog--skills"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fragment-plan-skill-title"
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(selectedIds)
        }}
      >
        <div className="pf-dialog-glow" aria-hidden />
        <div className="pf-dialog-header">
          <div className="pf-dialog-mark" aria-hidden>
            <AlertTriangle size={22} strokeWidth={1.75} />
          </div>
          <div className="pf-dialog-body">
            <h2 id="fragment-plan-skill-title" className="pf-dialog-title">
              {displayTitle}
            </h2>
            <p className="pf-dialog-message">{message}</p>
          </div>
        </div>
        <div className="pf-dialog-skill-block">
          <div className="pf-dialog-skill-label">{t('drama.episodeEdit.skillUsed')}</div>
          <AgentSkillPicker
            skills={skills}
            selectedIds={selectedIds}
            onToggle={toggleSkill}
            onSelectAll={selectAll}
            onSelectNone={selectNone}
            onUpload={(file) => void uploadSkill(file)}
            uploading={uploading}
            uploadError={uploadError}
            emptyText={t('drama.episodeEdit.noSkillHint')}
          />
        </div>
        <div className="pf-dialog-actions">
          <button type="button" className="pf-dialog-btn pf-dialog-btn-ghost" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="pf-dialog-btn pf-dialog-btn-danger">
            {displayConfirm}
          </button>
        </div>
      </form>
    </div>
  )
}
