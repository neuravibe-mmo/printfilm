import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, defaultsFromTemplate } from '../../../api'
import type { Project, Template } from '../../../api'
import { dialog } from '../../../lib/dialog'
import { handleBillingError } from '../../../lib/billingError'
import {
  effectiveStatus,
  kepuBillingPhase,
  kepuStepIndex,
  shotsByNo,
} from '../../../lib/status'
import { isProjectBusy } from './storyboardUtils'
import { useI18n } from '../../../i18n'

export function useStoryboardProject(projectId: number) {
  const { t } = useI18n()
  const nav = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>({})
  const [promptEdit, setPromptEdit] = useState<{
    style_prompt: string
    character_prompt: string
    extra_prompt: string
  } | null>(null)

  // 1. Initial Project & Template load
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      nav(`/auth?next=${encodeURIComponent(location.pathname)}`, { replace: true })
      return
    }
    if (!projectId) {
      nav('/studio/new')
      return
    }
    api
      .getProject(projectId)
      .then((p) => {
        setProject(p)
        return api.templates().then((list) => {
          setTemplate(list.find((item) => item.id === p.template_id) || null)
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadFailed')))
  }, [nav, projectId, t])

  // 2. Video Duration preloader
  useEffect(() => {
    project?.shots.forEach((s) => {
      if (s.video_url && !videoDurations[s.id]) {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.src = api.assetUrl(s.video_url, s.version)
        v.onloadedmetadata = () => {
          if (v.duration && !isNaN(v.duration) && v.duration > 0) {
            setVideoDurations((prev) => ({ ...prev, [s.id]: v.duration }))
          }
        }
      }
    })
  }, [project?.shots, videoDurations])

  // 3. Polling when project is busy
  useEffect(() => {
    if (!project) return
    if (!isProjectBusy(project)) return
    const timer = setInterval(() => {
      api
        .getProject(project.id)
        .then(setProject)
        .catch(() => undefined)
    }, 1500)
    return () => clearInterval(timer)
  }, [project?.id, project?.status, project?.active_tasks])

  // 4. Derived & Computed State
  const running = isProjectBusy(project)
  const step = project ? kepuStepIndex('board', project) : 2
  const totalDuration = useMemo(
    () => (project?.shots || []).reduce((s, x) => s + (Number(x.duration) || 0), 0),
    [project?.shots],
  )
  const shots = useMemo(() => shotsByNo(project?.shots), [project?.shots])

  const promptDefaults = useMemo(
    () => (template ? defaultsFromTemplate(template) : null),
    [template],
  )

  const displayPrompts = useMemo(() => {
    if (!project) {
      return { style_prompt: '', character_prompt: '', extra_prompt: '' }
    }
    return {
      style_prompt: (project.style_prompt || '').trim() || promptDefaults?.style_prompt || '',
      character_prompt:
        (project.character_prompt || '').trim() || promptDefaults?.character_prompt || '',
      extra_prompt: (project.extra_prompt || '').trim() || promptDefaults?.extra_prompt || '',
    }
  }, [project, promptDefaults])

  const isFullPipeline = project?.pipeline_mode !== 'image_text'
  const phase = project ? kepuBillingPhase(project) : 'script'
  const readyToCompose = phase === 'compose'
  const needsVideos = phase === 'videos'
  const needsScriptConfirm = phase === 'assets'
  const hasFinal = Boolean(project?.final_video_url)

  const primaryAction: 'generate' | 'compose' | 'preview' | 'busy' = running
    ? 'busy'
    : hasFinal
      ? 'preview'
      : readyToCompose
        ? 'compose'
        : 'generate'

  const generateLabel = running
    ? t('studio.storyboard.generating')
    : shots.length === 0
      ? t('studio.storyboard.goStylePage')
      : needsScriptConfirm
        ? t('studio.storyboard.confirmShots')
        : needsVideos
          ? t('studio.storyboard.shotVideo')
          : t('studio.storyboard.continueGen')

  const progressItems = useMemo(() => {
    if (!project) return []
    const list = project.shots || []
    const imgs = list.filter((s) => s.image_url).length
    const auds = list.filter((s) => s.audio_url).length
    const vids = list.filter((s) => s.video_url).length
    const full = project.pipeline_mode !== 'image_text'
    const stage = effectiveStatus(project)
    type ProgressItem = { label: string; done: boolean; run?: boolean; pct?: number }
    const items: ProgressItem[] = [
      { label: t('studio.storyboard.stepTheme'), done: true },
      {
        label: t('studio.storyboard.stepScript'),
        done: list.length > 0 || !['DRAFT', 'SCRIPTING'].includes(project.status),
      },
      {
        label: `${t('studio.storyboard.stepImages')} (${imgs}/${list.length || 0})`,
        done: list.length > 0 && imgs === list.length,
      },
    ]
    if (full) {
      items.push({
        label: `${t('studio.storyboard.stepVideos')} (${vids}/${list.length || 0})`,
        done:
          list.length > 0 &&
          (vids === list.length ||
            ['VIDEO_READY', 'COMPOSING', 'AUDITING', 'DONE'].includes(stage)),
        run: stage === 'VIDEOING',
        pct: stage === 'VIDEOING' ? project.progress : undefined,
      })
    }
    items.push({
      label: `${t('studio.storyboard.stepAudio')} (${auds}/${list.length || 0})`,
      done: list.length > 0 && auds === list.length,
      run: stage === 'AUDIOING',
      pct: stage === 'AUDIOING' ? project.progress : undefined,
    })
    items.push({
      label: full ? t('studio.storyboard.stepSplice') : t('studio.storyboard.stepRender'),
      done: Boolean(project.final_video_url) || project.status === 'DONE',
      run: stage === 'COMPOSING',
      pct: stage === 'COMPOSING' ? project.progress : undefined,
    })
    return items
  }, [project, t])

  // 5. Actions
  async function continueGenerate() {
    if (!project) return
    setBusy(true)
    setError('')
    try {
      setProject(await api.generate(project.id))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('studio.storyboard.continueGenFailed')
      if (msg.includes(t('studio.storyboard.composeKeyword'))) {
        try {
          setError('')
          setProject(await api.compose(project.id))
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : t('studio.storyboard.composeFailed'))
        }
        return
      }
      setError(msg)
      await handleBillingError(err, nav)
    } finally {
      setBusy(false)
    }
  }

  async function restartGenerate() {
    if (!project) return
    const ok = await dialog.confirm({
      title: t('studio.storyboard.redoTitle'),
      message: t('studio.storyboard.redoMessage'),
      confirmText: t('studio.storyboard.redoConfirm'),
      cancelText: t('studio.storyboard.redoCancel'),
      tone: 'danger',
    })
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      setProject(await api.generate(project.id, { restart: true }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('studio.storyboard.redoFailed')
      setError(msg)
      await handleBillingError(err, nav)
    } finally {
      setBusy(false)
    }
  }

  async function deleteProject() {
    if (!project) return
    const ok = await dialog.confirm({
      title: t('studio.storyboard.deleteTitle'),
      message: t('studio.storyboard.deleteMessage'),
      confirmText: t('studio.storyboard.deleteConfirm'),
      cancelText: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteProject(project.id)
      nav('/history')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.deleteFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function composeOnly() {
    if (!project) return
    setBusy(true)
    try {
      setProject(await api.compose(project.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.composeFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function onCoverFile(file: File | null) {
    if (!project || !file) return
    setBusy(true)
    setError('')
    try {
      setProject(await api.uploadCover(project.id, file))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.coverUploadFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function useFirstShotCover() {
    if (!project) return
    const first = [...(project.shots || [])]
      .sort((a, b) => a.shot_no - b.shot_no)
      .find((s) => s.image_url)
    if (!first?.image_url) {
      setError(t('studio.storyboard.noCoverFrame'))
      return
    }
    setBusy(true)
    setError('')
    try {
      setProject(await api.updateProject(project.id, { cover_url: first.image_url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.setCoverFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    if (!project) return
    setBusy(true)
    try {
      await api.publish(project.id)
      nav('/history')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.publishFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function saveProjectPrompts() {
    if (!project || !promptEdit) return
    setBusy(true)
    try {
      const d = promptDefaults
      const styleOut = promptEdit.style_prompt.trim()
      const charOut = promptEdit.character_prompt.trim()
      const extraOut = promptEdit.extra_prompt.trim()
      const updated = await api.updateProject(project.id, {
        style_prompt: d && styleOut === d.style_prompt ? '' : styleOut,
        character_prompt: d && charOut === d.character_prompt ? '' : charOut,
        extra_prompt: d && extraOut === d.extra_prompt ? '' : extraOut,
      })
      setProject(updated)
      setPromptEdit(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.savePromptFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function restoreTemplatePrompts() {
    if (!project) return
    setBusy(true)
    try {
      const updated = await api.updateProject(project.id, {
        style_prompt: '',
        character_prompt: '',
        extra_prompt: '',
      })
      setProject(updated)
      setPromptEdit(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.restoreTemplateFailed'))
    } finally {
      setBusy(false)
    }
  }

  return {
    project,
    setProject,
    template,
    busy,
    setBusy,
    error,
    setError,
    dismissedError,
    setDismissedError,
    videoDurations,
    setVideoDurations,
    promptEdit,
    setPromptEdit,
    running,
    step,
    totalDuration,
    shots,
    promptDefaults,
    displayPrompts,
    isFullPipeline,
    phase,
    readyToCompose,
    needsVideos,
    needsScriptConfirm,
    hasFinal,
    primaryAction,
    generateLabel,
    progressItems,
    continueGenerate,
    restartGenerate,
    deleteProject,
    composeOnly,
    publish,
    onCoverFile,
    useFirstShotCover,
    saveProjectPrompts,
    restoreTemplatePrompts,
  }
}
