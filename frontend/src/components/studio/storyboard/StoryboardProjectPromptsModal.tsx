import { useI18n } from '../../../i18n'

export interface StoryboardProjectPromptsModalProps {
  promptEdit: { style_prompt: string; character_prompt: string; extra_prompt: string } | null
  busy: boolean
  onChangePromptEdit: (p: {
    style_prompt: string
    character_prompt: string
    extra_prompt: string
  }) => void
  onSave: () => void
  onRestoreTemplate: () => void
  onClose: () => void
}

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

export default function StoryboardProjectPromptsModal({
  promptEdit,
  busy,
  onChangePromptEdit,
  onSave,
  onRestoreTemplate,
  onClose,
}: StoryboardProjectPromptsModalProps) {
  const { t } = useI18n()

  if (!promptEdit) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal pf-prompt-modal pf-project-prompts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{t('studio.storyboard.projectPrompts')}</h3>
        <p className="pf-muted" style={{ fontSize: '0.8rem', marginTop: 0 }}>
          {t('studio.storyboard.promptsNote')}
        </p>
        <label>
          {t('studio.storyboard.stylePromptLabel')}
          <textarea
            ref={autoGrow}
            value={promptEdit.style_prompt}
            onInput={(e) => autoGrow(e.currentTarget)}
            onChange={(e) => {
              onChangePromptEdit({ ...promptEdit, style_prompt: e.target.value })
              autoGrow(e.currentTarget)
            }}
            rows={1}
          />
        </label>
        <label>
          {t('studio.storyboard.charPromptLabel')}
          <textarea
            ref={autoGrow}
            autoFocus
            value={promptEdit.character_prompt}
            onInput={(e) => autoGrow(e.currentTarget)}
            onChange={(e) => {
              onChangePromptEdit({ ...promptEdit, character_prompt: e.target.value })
              autoGrow(e.currentTarget)
            }}
            rows={1}
          />
        </label>
        <label>
          {t('studio.storyboard.extraPromptLabel')}
          <textarea
            ref={autoGrow}
            value={promptEdit.extra_prompt}
            onInput={(e) => autoGrow(e.currentTarget)}
            onChange={(e) => {
              onChangePromptEdit({ ...promptEdit, extra_prompt: e.target.value })
              autoGrow(e.currentTarget)
            }}
            rows={1}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button type="button" className="pf-btn pf-btn-lime" disabled={busy} onClick={onSave}>
            {t('common.save')}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-ghost"
            disabled={busy}
            onClick={onRestoreTemplate}
          >
            {t('studio.storyboard.restoreTemplate')}
          </button>
          <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
