import { useEffect, useRef } from 'react'
import { useI18n } from '../../../i18n'
import type { Shot } from '../../../api'
import { SEGMENT_SCRIPT_PLACEHOLDER, SHOT_DURATION_MAX } from '../../../lib/segmentDuration'

export interface StoryboardShotEditModalProps {
  editing: Shot | null
  editMode: 'narration' | 'segment' | 'full'
  editFocus: string
  editDurationCheck: { valid: boolean; total: number; message?: string; durations: number[] }
  busy: boolean
  onChangeEditing: (shot: Shot) => void
  onPatchNarration: (text: string) => void
  onPatchVisual: (text: string) => void
  onPatchScript: (text: string) => void
  onChangeMode: (mode: 'narration' | 'segment' | 'full', focus: string) => void
  onSave: () => void
  onClose: () => void
}

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

export default function StoryboardShotEditModal({
  editing,
  editMode,
  editFocus,
  editDurationCheck,
  busy,
  onChangeEditing,
  onPatchNarration,
  onPatchVisual,
  onPatchScript,
  onChangeMode,
  onSave,
  onClose,
}: StoryboardShotEditModalProps) {
  const { t } = useI18n()
  const imagePromptTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const segScriptTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = segScriptTextareaRef.current
    if (!el) return
    autoGrow(el)
  }, [editing?.segment_script, editing?.video_prompt, editMode])

  useEffect(() => {
    const el = imagePromptTextareaRef.current
    if (!el) return
    autoGrow(el)
  }, [editing?.img_prompt, editMode])

  if (!editing) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={[
          'modal',
          'pf-prompt-modal',
          editMode === 'narration' ? 'pf-prompt-modal--narration' : '',
          editMode === 'segment' ? 'pf-prompt-modal--segment' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>
          {editMode === 'narration'
            ? t('studio.storyboard.editShotNarr').replace('{no}', String(editing.shot_no))
            : editMode === 'segment'
              ? t('studio.storyboard.editShotSeg').replace('{no}', String(editing.shot_no))
              : t('studio.storyboard.editShotAll').replace('{no}', String(editing.shot_no))}
        </h3>
        <div className="pf-prompt-modal-scroll">
          {editMode === 'narration' || editMode === 'full' ? (
            <>
              <label>
                {t('studio.storyboard.shotTitle')}
                <input
                  autoFocus={editFocus === 'title' || editMode === 'narration'}
                  value={editing.overlay_title || ''}
                  onChange={(e) => onChangeEditing({ ...editing, overlay_title: e.target.value })}
                />
                <span className="pf-muted pf-prompt-hint">
                  {t('studio.storyboard.shotTitleTip')}
                </span>
              </label>
              <label>
                {t('studio.storyboard.subtitle')}
                <input
                  value={editing.overlay_subtitle || ''}
                  onChange={(e) => onChangeEditing({ ...editing, overlay_subtitle: e.target.value })}
                />
                <span className="pf-muted pf-prompt-hint">
                  {t('studio.storyboard.subtitleTip')}
                </span>
              </label>
              <label>
                {t('studio.storyboard.narration')}
                <textarea
                  autoFocus={editFocus === 'narration'}
                  value={editing.narration}
                  onChange={(e) => onPatchNarration(e.target.value)}
                  rows={editMode === 'narration' ? 6 : 3}
                />
                <span className="pf-muted pf-prompt-hint">
                  {t('studio.storyboard.narrationTip')}
                </span>
              </label>
            </>
          ) : null}
          {editMode === 'full' ? (
            <label>
              {t('studio.storyboard.imagePrompt')}
              <textarea
                ref={(el) => {
                  imagePromptTextareaRef.current = el
                  autoGrow(el)
                }}
                className="pf-prompt-image"
                autoFocus={editFocus === 'img_prompt'}
                value={editing.img_prompt}
                onInput={(e) => autoGrow(e.currentTarget)}
                onChange={(e) => {
                  onPatchVisual(e.target.value)
                  autoGrow(e.currentTarget)
                }}
                rows={2}
              />
              <span className="pf-muted pf-prompt-hint">
                {t('studio.storyboard.imagePromptTip')}
              </span>
            </label>
          ) : null}
          {editMode === 'segment' || editMode === 'full' ? (
            <>
              <label>
                {t('studio.storyboard.segScript')}
                <textarea
                  ref={segScriptTextareaRef}
                  className="pf-prompt-segment"
                  autoFocus={editFocus === 'segment_script' || editMode === 'segment'}
                  value={editing.segment_script || editing.video_prompt || ''}
                  onChange={(e) => {
                    onPatchScript(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  rows={editMode === 'segment' ? 8 : 5}
                  placeholder={SEGMENT_SCRIPT_PLACEHOLDER}
                />
              </label>
              <div className="pf-chips pf-prompt-duration-chips">
                {editDurationCheck.durations.length > 0 ? (
                  editDurationCheck.durations.map((sec, i) => (
                    <span key={`${sec}-${i}`} className="pf-chip" style={{ cursor: 'default' }}>
                      {sec}s
                    </span>
                  ))
                ) : (
                  <span className="pf-muted" style={{ fontSize: '0.8rem' }}>
                    {t('studio.storyboard.noDurationTag')}
                  </span>
                )}
                <span
                  className="pf-muted"
                  style={{
                    fontSize: '0.8rem',
                    marginLeft: 'auto',
                    color: editDurationCheck.valid ? undefined : 'var(--pf-danger, #c0392b)',
                  }}
                >
                  {t('studio.storyboard.totalDurationCheck')
                    .replace('{total}', String(editDurationCheck.total))
                    .replace('{max}', String(SHOT_DURATION_MAX))}
                </span>
              </div>
              {!editDurationCheck.valid && editDurationCheck.message ? (
                <p className="pf-error pf-prompt-duration-error">{editDurationCheck.message}</p>
              ) : null}
              <label>
                {t('studio.storyboard.cameraNote')}
                <input
                  value={editing.camera || ''}
                  onChange={(e) => onChangeEditing({ ...editing, camera: e.target.value })}
                />
              </label>
              <label>
                {t('studio.storyboard.durationNote')}
                <input
                  type="number"
                  value={editing.duration}
                  onChange={(e) =>
                    onChangeEditing({ ...editing, duration: Number(e.target.value) })
                  }
                />
              </label>
            </>
          ) : null}
        </div>
        <div className="pf-prompt-modal-foot">
          <div className="pf-prompt-modal-foot-tabs">
            {editMode !== 'segment' ? (
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                onClick={() => onChangeMode('segment', 'segment_script')}
              >
                {t('studio.storyboard.segTab')}
              </button>
            ) : null}
            {editMode !== 'narration' ? (
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                onClick={() => onChangeMode('narration', 'narration')}
              >
                {t('studio.storyboard.narrTab')}
              </button>
            ) : null}
            {editMode !== 'full' ? (
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                onClick={() => onChangeMode('full', '')}
              >
                {t('studio.storyboard.allFields')}
              </button>
            ) : null}
          </div>
          <div className="pf-prompt-modal-foot-actions">
            <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="pf-btn pf-btn-lime"
              disabled={busy || !editDurationCheck.valid}
              onClick={onSave}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
