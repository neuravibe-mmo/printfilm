import { useMemo, useState } from 'react'
import { api } from '../../../api'
import type { Project, Shot, Template } from '../../../api'
import {
  firstVisualFromScript,
  narrationFromScript,
  replaceFirstVisualInScript,
  replaceNarrationInScript,
  validateSegmentScriptDuration,
} from '../../../lib/segmentDuration'
import { useI18n } from '../../../i18n'

interface UseStoryboardShotActionsOptions {
  project: Project | null
  setProject: React.Dispatch<React.SetStateAction<Project | null>>
  busy: boolean
  setBusy: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string>>
  template: Template | null
  onOpenEdit?: () => void
}

export function useStoryboardShotActions({
  project,
  setProject,
  busy,
  setBusy,
  setError,
  template,
  onOpenEdit,
}: UseStoryboardShotActionsOptions) {
  const { t } = useI18n()

  // 1. Single Shot Busy States (for parallel regeneration)
  const [busyShotIds, setBusyShotIds] = useState<Set<number>>(() => new Set())

  function markShotBusy(shotId: number) {
    setBusyShotIds((ids) => new Set(ids).add(shotId))
  }

  function markShotIdle(shotId: number) {
    setBusyShotIds((ids) => {
      const next = new Set(ids)
      next.delete(shotId)
      return next
    })
  }

  // 2. Regeneration Handlers
  async function regenImage(shot: Shot) {
    if (!project) return
    markShotBusy(shot.id)
    try {
      setProject(await api.regenImage(project.id, shot.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.genImageFailed'))
    } finally {
      markShotIdle(shot.id)
    }
  }

  async function regenVideo(shot: Shot) {
    if (!project) return
    markShotBusy(shot.id)
    try {
      setProject(await api.regenVideo(project.id, shot.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.genVideoFailed'))
    } finally {
      markShotIdle(shot.id)
    }
  }

  async function regenAudio(shot: Shot) {
    if (!project) return
    setBusy(true)
    try {
      setProject(await api.regenAudio(project.id, shot.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.redubFailed'))
    } finally {
      setBusy(false)
    }
  }

  // 3. Shot Edit Modal State & Handlers
  const [editing, setEditing] = useState<Shot | null>(null)
  const [editFocus, setEditFocus] = useState<string>('')
  const [editMode, setEditMode] = useState<'full' | 'narration' | 'segment'>('full')

  const editScriptText = editing?.segment_script || editing?.video_prompt || ''
  const editDurationCheck = useMemo(
    () => validateSegmentScriptDuration(editScriptText),
    [editScriptText],
  )

  function openShotEdit(shot: Shot, focus = '') {
    setEditFocus(focus)
    if (focus === 'narration') setEditMode('narration')
    else if (focus === 'segment_script') setEditMode('segment')
    else setEditMode('full')
    setEditing({ ...shot })
    onOpenEdit?.()
  }

  function closeShotEdit() {
    setEditing(null)
    setEditFocus('')
    setEditMode('full')
  }

  function patchEditingNarration(value: string) {
    if (!editing) return
    const script = editing.segment_script || editing.video_prompt || ''
    const next = replaceNarrationInScript(script, value)
    setEditing({
      ...editing,
      narration: value,
      segment_script: next,
      video_prompt: next,
    })
  }

  function patchEditingVisual(value: string) {
    if (!editing) return
    const script = editing.segment_script || editing.video_prompt || ''
    const next = replaceFirstVisualInScript(script, value)
    setEditing({
      ...editing,
      img_prompt: value,
      segment_script: next,
      video_prompt: next,
    })
  }

  function patchEditingScript(value: string) {
    if (!editing) return
    setEditing({
      ...editing,
      segment_script: value,
      video_prompt: value,
      narration: narrationFromScript(value),
      img_prompt: firstVisualFromScript(value) || editing.img_prompt,
    })
  }

  async function saveShot() {
    if (!project || !editing) return
    const scriptText = editing.segment_script || editing.video_prompt || ''
    const durationCheck = validateSegmentScriptDuration(scriptText)
    if (!durationCheck.valid) {
      setError(durationCheck.message || t('studio.storyboard.durationInvalid'))
      return
    }
    setBusy(true)
    try {
      await api.updateShot(project.id, editing.id, {
        narration: editing.narration,
        overlay_title: editing.overlay_title,
        overlay_subtitle: editing.overlay_subtitle,
        img_prompt: editing.img_prompt,
        video_prompt: editing.video_prompt,
        segment_script: editing.segment_script,
        duration: Number(editing.duration) || 4,
        camera: editing.camera,
      })
      closeShotEdit()
      setProject(await api.getProject(project.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  // 4. Batch Adjust Modal State & Handlers
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSelected, setBatchSelected] = useState<number[]>([])
  const [batchDuration, setBatchDuration] = useState('')
  const [batchRegenAudio, setBatchRegenAudio] = useState(false)

  const minAllowedDuration = template?.shot_duration_min ?? 2
  const maxAllowedDuration =
    project?.pipeline_mode === 'image_text'
      ? 30
      : (template?.shot_duration_max ?? 8)

  const batchDurationNum = batchDuration.trim() === '' ? null : Number(batchDuration)
  const batchDurationError = useMemo(() => {
    if (batchDurationNum === null) return null
    if (!Number.isFinite(batchDurationNum) || batchDurationNum <= 0) {
      return t('studio.storyboard.invalidDuration')
    }
    if (batchDurationNum < minAllowedDuration) {
      return t('studio.storyboard.batchDurationMin')
        .replace('{min}', String(minAllowedDuration))
        .replace('{template}', template?.name || '')
    }
    if (batchDurationNum > maxAllowedDuration) {
      return t('studio.storyboard.batchDurationMax')
        .replace('{max}', String(maxAllowedDuration))
        .replace('{template}', template?.name || '')
    }
    return null
  }, [batchDurationNum, minAllowedDuration, maxAllowedDuration, template?.name, t])

  const canApplyBatch =
    !busy &&
    batchSelected.length > 0 &&
    !batchDurationError &&
    (batchDurationNum !== null || batchRegenAudio)

  function openBatchAdjust() {
    if (!project) return
    setBatchSelected((project.shots || []).map((s) => s.id))
    setBatchDuration('')
    setBatchRegenAudio(false)
    setBatchOpen(true)
  }

  async function applyBatchAdjust() {
    if (!project || batchSelected.length === 0) return
    if (batchDurationError) {
      setError(batchDurationError)
      return
    }
    const durationVal = batchDurationNum
    if (durationVal == null && !batchRegenAudio) {
      setError(t('studio.storyboard.setDurationOrRedub'))
      return
    }
    setBusy(true)
    setError('')
    try {
      for (const shotId of batchSelected) {
        if (durationVal != null) {
          await api.updateShot(project.id, shotId, { duration: durationVal })
        }
        if (batchRegenAudio) {
          await api.regenAudio(project.id, shotId)
        }
      }
      setProject(await api.getProject(project.id))
      setBatchOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.batchFailed'))
      try {
        setProject(await api.getProject(project.id))
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false)
    }
  }

  return {
    busyShotIds,
    markShotBusy,
    markShotIdle,
    regenImage,
    regenVideo,
    regenAudio,
    editing,
    setEditing,
    editFocus,
    setEditFocus,
    editMode,
    setEditMode,
    editScriptText,
    editDurationCheck,
    openShotEdit,
    closeShotEdit,
    patchEditingNarration,
    patchEditingVisual,
    patchEditingScript,
    saveShot,
    batchOpen,
    setBatchOpen,
    batchSelected,
    setBatchSelected,
    batchDuration,
    setBatchDuration,
    batchRegenAudio,
    setBatchRegenAudio,
    minAllowedDuration,
    maxAllowedDuration,
    batchDurationNum,
    batchDurationError,
    canApplyBatch,
    openBatchAdjust,
    applyBatchAdjust,
  }
}
