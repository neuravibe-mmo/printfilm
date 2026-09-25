import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { useNavigate, useParams } from 'react-router-dom'
import { api, defaultsFromTemplate } from '../../api'
import type { Project, Shot, Template } from '../../api'
import AppShell from '../../components/layout/AppShell'
import Stepper from '../../components/ui/Stepper'
import {
  IconChevronLeft,
  IconDownload,
  IconEdit,
  IconImage,
  IconMonitor,
  IconPlay,
  IconRefresh,
  IconSliders,
  IconTrash,
} from '../../components/ui/Icons'
import { scenePromptForDisplay } from '../../promptDisplay'
import { dialog } from '../../lib/dialog'
import { handleBillingError } from '../../lib/billingError'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import {
  effectiveStatus,
  formatMmSs,
  isRunning,
  kepuBillingPhase,
  kepuPhaseHint,
  kepuStepIndex,
  kepuSteps,
  isProjectWideBusy,
  isShotGenerating,
  shotsByNo,
  shotDisplayDone,
  shotDisplayKind,
  shotDisplayLabel,
  statusLabel,
} from '../../lib/status'
import {
  SEGMENT_SCRIPT_PLACEHOLDER,
  SHOT_DURATION_MAX,
  firstVisualFromScript,
  narrationFromScript,
  parseSegmentScript,
  replaceFirstVisualInScript,
  replaceNarrationInScript,
  validateSegmentScriptDuration,
} from '../../lib/segmentDuration'

function csvEscape(value: string | number | null | undefined) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadStoryboardCsv(project: Project) {
  const header = ['镜号', '旁白', '画面描述', '时长秒', '状态', '镜头标题']
  const rows = (project.shots || [])
    .slice()
    .sort((a, b) => a.shot_no - b.shot_no)
    .map((s) =>
      [
        s.shot_no,
        s.narration,
        scenePromptForDisplay(s.img_prompt || s.video_prompt || ''),
        s.duration,
        shotDisplayLabel(shotDisplayKind(s, { pipelineMode: project.pipeline_mode })),
        s.overlay_title || '',
      ]
        .map(csvEscape)
        .join(','),
    )
  const bom = '\uFEFF'
  const blob = new Blob([bom + [header.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${project.title || `project_${project.id}`}_storyboard.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

type PreviewState =
  | {
      kind: 'shot'
      shotNo: number
      imageUrl: string | null
      videoUrl: string | null
      audioUrl: string | null
      caption: string
    }
  | { kind: 'final'; url: string; title: string; bust?: string }
  | null

function shotCaption(shot: Shot, t?: (k: string) => string) {
  if (shot.overlay_title) {
    const label = t ? t('studio.storyboard.narrationLabel') : '旁白'
    return `${shot.overlay_title}${
      shot.overlay_subtitle ? ` · ${shot.overlay_subtitle}` : ''
    }${shot.narration ? `｜${label}：${shot.narration}` : ''}`
  }
  return shot.narration
}

function hasActiveUnifiedTasks(project: Project | null): boolean {
  const activeStatuses = ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review']
  return Boolean(
    project?.active_tasks?.some(
      (task) => !task.cancel_requested && activeStatuses.includes(task.status),
    ),
  )
}

/** 有任务平台数据时以 active_tasks 为准；COMPOSING 无任务视为拼接失败残留，可重试 */
function isProjectBusy(project: Project | null): boolean {
  if (!project) return false
  if (hasActiveUnifiedTasks(project)) return true
  if (Array.isArray(project.active_tasks) && project.active_tasks.length === 0) {
    return false
  }
  return isRunning(project.status)
}

export default function StoryboardPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const projectId = Number(id)
  const nav = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [busy, setBusy] = useState(false)
  // busyShotIds 正在提交单镜图/视频的镜号，可并行，finally 只删自己
  const [busyShotIds, setBusyShotIds] = useState<Set<number>>(() => new Set())
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Shot | null>(null)
  const [editFocus, setEditFocus] = useState<string>('')
  /** 表格入口：旁白列 / 逐段分镜列 / 操作栏「编辑」 */
  const [editMode, setEditMode] = useState<'full' | 'narration' | 'segment'>('full')
  const [promptEdit, setPromptEdit] = useState<{
    style_prompt: string
    character_prompt: string
    extra_prompt: string
  } | null>(null)
  const [preview, setPreview] = useState<PreviewState>(null)
  const [menuShotId, setMenuShotId] = useState<number | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSelected, setBatchSelected] = useState<number[]>([])
  const [batchDuration, setBatchDuration] = useState('')
  const [batchRegenAudio, setBatchRegenAudio] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      nav('/auth')
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
          setTemplate(list.find((t) => t.id === p.template_id) || null)
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadFailed')))
  }, [nav, projectId])

  useEffect(() => {
    if (!project) return
    // Only poll while pipeline is actively running — idle checkpoints
    // (IMAGE_READY / VIDEO_READY / SCRIPT_READY) must not spin forever.
    if (!isProjectBusy(project)) return
    const timer = setInterval(() => {
      api
        .getProject(project.id)
        .then(setProject)
        .catch(() => undefined)
    }, 1500)
    return () => clearInterval(timer)
  }, [project?.id, project?.status, project?.active_tasks])

  useEffect(() => {
    if (menuShotId == null) return
    function onDoc() {
      setMenuShotId(null)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [menuShotId])

  const running = isProjectBusy(project)
  const step = project ? kepuStepIndex('board', project) : 2
  const totalDuration = useMemo(
    () => (project?.shots || []).reduce((s, x) => s + (Number(x.duration) || 0), 0),
    [project?.shots],
  )

  // editScriptText 弹窗中当前编辑的逐段脚本
  const editScriptText = editing?.segment_script || editing?.video_prompt || ''
  // editDurationCheck 弹窗脚本时长校验
  const editDurationCheck = useMemo(
    () => validateSegmentScriptDuration(editScriptText),
    [editScriptText],
  )

  const shots = useMemo(() => shotsByNo(project?.shots), [project?.shots])
  /** 项目字段为空时回显模板默认（与后端 _effective_* 一致） */
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
  /**
   * Full pipeline: need AI videos before compose.
   * VIDEO_READY+ means video stage finished (incl. privacy skips without video_url).
   * image_text skips the video stage entirely.
   */
  const phase = project ? kepuBillingPhase(project) : 'script'
  const readyToCompose = phase === 'compose'
  const needsVideos = phase === 'videos'
  const needsScriptConfirm = phase === 'assets'
  const hasFinal = Boolean(project?.final_video_url)
  /** Primary CTA: confirm script → generate → (videos) → compose → preview */
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

  // 工作台进度：完整模式要镜头视频 + 外部 TTS，静图模式只配音合成
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
      { label: t('studio.storyboard.stepScript'), done: list.length > 0 || !['DRAFT', 'SCRIPTING'].includes(project.status) },
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
  }, [project])

  function openFinalPreview() {
    if (!project?.final_video_url) return
    setPreview({
      kind: 'final',
      url: api.assetUrl(project.final_video_url, project.updated_at),
      title: project.title,
      bust: project.updated_at,
    })
  }

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
      if (coverInputRef.current) coverInputRef.current.value = ''
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

  function openBatchAdjust() {
    if (!project) return
    setBatchSelected((project.shots || []).map((s) => s.id))
    setBatchDuration('')
    setBatchRegenAudio(false)
    setBatchOpen(true)
  }

  async function applyBatchAdjust() {
    if (!project || batchSelected.length === 0) return
    const durationVal = batchDuration.trim() === '' ? null : Number(batchDuration)
    if (durationVal != null && (!Number.isFinite(durationVal) || durationVal <= 0)) {
      setError(t('studio.storyboard.invalidDuration'))
      return
    }
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

  // 标记本镜请求进行中，不覆盖其它镜
  function markShotBusy(shotId: number) {
    setBusyShotIds((ids) => new Set(ids).add(shotId))
  }

  // 只清自己，避免并行请求互相冲掉锁
  function markShotIdle(shotId: number) {
    setBusyShotIds((ids) => {
      const next = new Set(ids)
      next.delete(shotId)
      return next
    })
  }

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
    // 重配音会重写整片口播，锁整表避免两路抢写
    setBusy(true)
    try {
      setProject(await api.regenAudio(project.id, shot.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.redubFailed'))
    } finally {
      setBusy(false)
    }
  }

  function openShotEdit(shot: Shot, focus = '') {
    setEditFocus(focus)
    if (focus === 'narration') setEditMode('narration')
    else if (focus === 'segment_script') setEditMode('segment')
    else setEditMode('full')
    setEditing({ ...shot })
    setMenuShotId(null)
  }

  function closeShotEdit() {
    setEditing(null)
    setEditFocus('')
    setEditMode('full')
  }

  // 改旁白时同步写入脚本旁白段
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

  // 改首帧画面时同步写入脚本第一段 visual
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

  // 改脚本时回填旁白与首帧画面
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
    // scriptText 当前编辑中的逐段脚本
    const scriptText = editing.segment_script || editing.video_prompt || ''
    // durationCheck 时长校验结果
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

  // 保存项目提示词；与后台模板相同则清空覆盖
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

  // 清空项目覆盖，后续生成跟随后台模板
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

  if (!project && !error) {
    return (
      <AppShell active="studio">
        <p className="pf-muted">{t('common.loading')}</p>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell active="studio">
        <BillingErrorNotice message={error} />
      </AppShell>
    )
  }

  const structure = (project.shots || []).slice(0, 5).map((s, i) => {
    const labels = [t('studio.storyboard.act1'), t('studio.storyboard.act2'), t('studio.storyboard.act3'), t('studio.storyboard.act4'), t('studio.storyboard.act5')]
    return { label: labels[i] || `${t('studio.storyboard.sectionLabel')} ${i + 1}`, text: s.narration || s.overlay_title || '—' }
  })

  return (
    <AppShell active="studio" wide>
      <header className="pf-page-head">
        <div className="pf-page-head-row">
          <div>
            <button type="button" className="pf-back" onClick={() => nav(`/studio/${project.id}/style`)}>
              <IconChevronLeft size={18} />
              {t('studio.storyboard.title')}
            </button>
            <h1 className="pf-page-title">{project.title}</h1>
          </div>
          <div className="pf-toolbar">
            {primaryAction === 'preview' ? (
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
                disabled={busy || !hasFinal}
                onClick={openFinalPreview}
              >
                <IconMonitor size={14} />
                {t('studio.storyboard.previewBtn')}
              </button>
            ) : primaryAction === 'compose' ? (
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
                disabled={busy || running}
                onClick={composeOnly}
              >
                <IconPlay size={14} />
                {t('studio.storyboard.spliceBtn')}
              </button>
            ) : (
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
                disabled={busy || running}
                onClick={() =>
                  shots.length === 0 ? nav(`/studio/${project.id}/style`) : void continueGenerate()
                }
              >
                <IconPlay size={14} />
                {generateLabel}
              </button>
            )}
            <button
              type="button"
              className="pf-btn-text"
              disabled={busy || running || shots.length === 0}
              onClick={openBatchAdjust}
            >
              <IconSliders size={15} />
              {t('studio.storyboard.batchAdjust')}
            </button>
            <button
              type="button"
              className="pf-btn-text"
              disabled={busy || running}
              onClick={restartGenerate}
            >
              <IconRefresh size={15} />
              {t('studio.storyboard.redo')}
            </button>
            {primaryAction !== 'preview' && hasFinal ? (
              <button type="button" className="pf-btn-text" onClick={openFinalPreview}>
                <IconMonitor size={15} />
                {t('studio.storyboard.previewBtn')}
              </button>
            ) : null}
            {primaryAction === 'preview' && readyToCompose ? (
              <button
                type="button"
                className="pf-btn-text"
                disabled={busy || running}
                onClick={composeOnly}
title={t('studio.storyboard.respliceTip')}
            >
              {t('studio.storyboard.resplice')}
            </button>
            ) : null}
            {primaryAction !== 'generate' && !readyToCompose ? (
              <button
                type="button"
                className="pf-btn-text"
                disabled={busy || running}
                onClick={continueGenerate}
              >
                {generateLabel === t('studio.storyboard.generating') ? t('studio.storyboard.continueGen') : generateLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="pf-btn pf-btn-outline pf-btn-sm pf-btn-icon"
              onClick={() => nav(`/studio/${project.id}/editor`)}
            >
              <IconEdit size={14} />
              {t('studio.storyboard.openEditor')}
            </button>
          </div>
        </div>
        <Stepper
          steps={kepuSteps(project.pipeline_mode)}
          current={step}
          doneThrough={Math.max(0, step - 1)}
        />
        <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0.55rem 0 0' }}>
          {kepuPhaseHint(project)}
        </p>
      </header>

      {error ? <BillingErrorNotice message={error} /> : null}
      {project.error_msg ? <p className="pf-error">{project.error_msg}</p> : null}

      <div className="pf-board">
        <aside className="pf-create-col">
          <h3>{t('studio.storyboard.projectSettings')}</h3>
          {(project.cover_url || template?.preview_cover) ? (
            <img
              src={api.assetUrl(project.cover_url || template?.preview_cover)}
              alt=""
              style={{ width: '100%', borderRadius: 12, aspectRatio: '16/10', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '16/10',
                borderRadius: 12,
                background: '#e8eaee',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--pf-muted)',
              }}
            >
              <IconImage size={28} />
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => onCoverFile(e.target.files?.[0] || null)}
          />
          <div className="pf-side-actions">
            <button
              type="button"
              className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
              disabled={busy || running}
              onClick={() => coverInputRef.current?.click()}
            >
              <IconImage size={14} />
              {t('studio.storyboard.changeCover')}
            </button>
            <button
              type="button"
              className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
              disabled={busy || running || !shots.some((s) => s.image_url)}
              onClick={useFirstShotCover}
              title={t('studio.storyboard.firstFrameCoverTip')}
            >
              <IconImage size={14} />
              {t('studio.storyboard.firstFrameCover')}
            </button>
            <button
              type="button"
              className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
              disabled={shots.length === 0}
              onClick={() => downloadStoryboardCsv(project)}
            >
              <IconDownload size={14} />
              {t('studio.storyboard.exportDraft')}
            </button>
          </div>
          <ul className="pf-meta-list" style={{ marginTop: '0.85rem' }}>
            <li>
              <span>{t('studio.storyboard.projectName')}</span>
              <span>{project.title}</span>
            </li>
            <li>
              <span>{t('studio.storyboard.status')}</span>
              <span>{statusLabel(project)}</span>
            </li>
            <li>
              <span>{t('studio.storyboard.progress')}</span>
              <span>{project.progress}%</span>
            </li>
            <li>
              <span>{t('studio.storyboard.duration')}</span>
              <span>
                {Math.floor(totalDuration / 60)
                  .toString()
                  .padStart(2, '0')}
                :
                {Math.floor(totalDuration % 60)
                  .toString()
                  .padStart(2, '0')}
              </span>
            </li>
            <li>
              <span>{t('studio.storyboard.aspectRatio')}</span>
              <span>{project.output_ratio || (project.pipeline_mode === 'image_text' ? '9:16' : '16:9')}</span>
            </li>
            <li>
              <span>{t('studio.storyboard.outputMode')}</span>
              <span>{project.pipeline_mode === 'image_text' ? t('studio.storyboard.imageText') : t('studio.storyboard.aiVideo')}</span>
            </li>
            <li>
              <span>{t('studio.storyboard.style')}</span>
              <span>{template?.name || project.template_id}</span>
            </li>
          </ul>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-block pf-btn-sm"
            onClick={() => nav(`/studio/${project.id}/style`)}
            disabled={running}
          >
            {t('studio.storyboard.editSettings')}
          </button>
          <div className="pf-prompt-panel">
            <h4>{t('studio.storyboard.builtinPrompts')}</h4>
            <p className="pf-muted" style={{ fontSize: '0.72rem', margin: '0 0 0.45rem' }}>
              {t('studio.storyboard.promptsTip')}
            </p>
            {(
              [
                [t('studio.storyboard.promptStyle'), displayPrompts.style_prompt],
                [t('studio.storyboard.promptCharacter'), displayPrompts.character_prompt],
                [t('studio.storyboard.promptExtra'), displayPrompts.extra_prompt],
              ] as const
            ).map(([label, value]) => (
              <button
                key={label}
                type="button"
                className="pf-prompt-chip"
                disabled={busy || running}
                onClick={() =>
                  setPromptEdit({
                    style_prompt: displayPrompts.style_prompt,
                    character_prompt: displayPrompts.character_prompt,
                    extra_prompt: displayPrompts.extra_prompt,
                  })
                }
              >
                <strong>{label}</strong>
                <span>{(value || '').trim() || t('studio.storyboard.promptEmpty')}</span>
              </button>
            ))}
          </div>
          <p className="pf-muted" style={{ fontSize: '0.75rem', marginTop: '0.75rem' }}>
            {t('studio.storyboard.aiDisclaimer')}
          </p>
        </aside>

        <div className="pf-board-main">
          <div className="pf-outline-grid">
            <article className="pf-create-col">
              <h3>{t('studio.storyboard.aiOutline')}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.65 }}>
                {project.source_text}
              </p>
              <div className="pf-tags">
                <span>{t('studio.storyboard.coreTheme')}</span>
                <span>{project.source_type === 'script' ? t('studio.storyboard.fullScript') : t('studio.storyboard.oneLineTheme')}</span>
              </div>
            </article>
            <article className="pf-create-col">
              <h3>{t('studio.storyboard.structureSummary')}</h3>
              <ul className="pf-meta-list">
                {structure.length ? (
                  structure.map((s) => (
                    <li key={s.label}>
                      <span>{s.label}</span>
                      <span style={{ maxWidth: '60%', textAlign: 'right' }}>{s.text.slice(0, 36)}</span>
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
          </div>

          <section className="pf-shot-card">
            <div className="pf-shot-card-head">
              <h3>{t('studio.storyboard.shotListTitle').replace('{n}', String(project.shots.length))}</h3>
              <div className="pf-toolbar">
                {project.status === 'DONE' && hasFinal ? (
                  <button type="button" className="pf-btn pf-btn-lime pf-btn-sm" disabled={busy} onClick={publish}>
                    {t('studio.storyboard.publish')}
                  </button>
                ) : null}
                {hasFinal ? (
                  <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" onClick={openFinalPreview}>
                    {t('studio.storyboard.previewBtn')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pf-btn pf-btn-ghost pf-btn-sm"
                    disabled={busy || running || !readyToCompose}
                    onClick={composeOnly}
                  >
                    {t('studio.storyboard.spliceBtn')}
                  </button>
                )}
              </div>
            </div>
            {project.shots.length === 0 ? (
              <p className="pf-muted" style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                {running
                  ? t('studio.storyboard.splitting')
                  : t('studio.storyboard.noShots')}
              </p>
            ) : needsScriptConfirm ? (
              <p className="pf-muted" style={{ margin: '0 0 1rem' }}>
                {t('studio.storyboard.shotReadyHint')}
              </p>
            ) : null}
            {project.shots.length === 0 ? null : (
              <div className="pf-shot-table-wrap">
                <table className="pf-shot-table">
                  <thead>
                    <tr>
                      <th className="col-no">{t('studio.storyboard.thScene')}</th>
                      <th className="col-thumb">{t('studio.storyboard.thImage')}</th>
                      <th className="col-narr">{t('studio.storyboard.thNarr')}</th>
                      <th className="col-seg">{t('studio.storyboard.thSeg')}</th>
                      <th className="col-dur">{t('studio.storyboard.thDur')}</th>
                      <th className="col-status">{t('studio.storyboard.thStatus')}</th>
                      <th className="col-ops">{t('studio.storyboard.thOps')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shots.map((shot) => {
                      /*
                       * localBusy 本镜请求已发出、任务尚未回写
                       * shotGenerating 本镜任务或本地提交中
                       * pipelineLocked 整片流水线/配音占用
                       * displayKind / done / failed 按素材完备度展示
                       */
                      const localBusy = busyShotIds.has(shot.id)
                      const shotGenerating = isShotGenerating(project, shot.id) || localBusy
                      const pipelineLocked = isProjectWideBusy(project)
                      const rowBusy = busy || pipelineLocked || shotGenerating
                      const displayKind = shotDisplayKind(shot, {
                        pipelineMode: project.pipeline_mode,
                        generating: shotGenerating,
                      })
                      const done = shotDisplayDone(displayKind)
                      const failed = displayKind === 'failed'
                      const sceneTitle =
                        shot.overlay_title?.trim() || `${t('studio.storyboard.sceneLabel')} ${String(shot.shot_no).padStart(2, '0')}`
                      const narration = (shot.narration || '').trim()
                      const script = shot.segment_script || shot.video_prompt || ''
                      const { cues, beats } = parseSegmentScript(script)
                      const desc = scenePromptForDisplay(shot.img_prompt).trim()
                      return (
                        <tr key={shot.id}>
                          <td className="col-no">{String(shot.shot_no).padStart(2, '0')}</td>
                          <td className="col-thumb">
                            <button
                              type="button"
                              className="pf-shot-thumb-btn"
                              onClick={() =>
                                setPreview({
                                  kind: 'shot',
                                  shotNo: shot.shot_no,
                                  imageUrl: shot.image_url,
                                  videoUrl: shot.video_url,
                                  audioUrl: shot.audio_url,
                                  caption: shotCaption(shot, t),
                                })
                              }
                            >
                              {shot.image_url ? (
                                <img
                                  className="pf-shot-thumb"
                                  src={api.assetUrl(shot.image_url, shot.version)}
                                  alt=""
                                />
                              ) : (
                                <div className="pf-shot-thumb empty">
                                  {shotGenerating ? t('studio.storyboard.generating') : t('studio.storyboard.pending')}
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="col-narr">
                            <button
                              type="button"
                              className="pf-shot-narration pf-shot-editable"
                              disabled={rowBusy}
                              title={t('studio.storyboard.editNarrTip')}
                              onClick={() => openShotEdit(shot, 'narration')}
                            >
                              <span className="title">{sceneTitle}</span>
                              <span className="line">
                                {narration ? `“${narration}”` : '—'}
                              </span>
                            </button>
                          </td>
                          <td className="col-seg">
                            <button
                              type="button"
                              className="pf-shot-desc pf-shot-editable"
                              disabled={rowBusy}
                              title={t('studio.storyboard.editSegTip')}
                              onClick={() => openShotEdit(shot, 'segment_script')}
                              style={{ textAlign: 'left', width: '100%' }}
                            >
                              {cues.length > 0 ? (
                                <span className="pf-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                                  {cues[0]?.replace(/^【|】$/g, '').slice(0, 28)}
                                  {cues[1]
                                    ? ` · ${cues[1].replace(/^【BGM：|】$/g, '').slice(0, 16)}`
                                    : ''}
                                </span>
                              ) : null}
                              {beats.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                  {beats.slice(0, 4).map((b, i) => (
                                    <span key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                      {b.duration > 0 ? (
                                        <span
                                          style={{
                                            flex: '0 0 auto',
                                            fontSize: '0.72rem',
                                            background: '#111',
                                            color: '#fff',
                                            borderRadius: 4,
                                            padding: '1px 5px',
                                          }}
                                        >
                                          {b.duration}s
                                        </span>
                                      ) : null}
                                      <span style={{ fontSize: '0.82rem' }}>
                                        {b.text.length > 42 ? `${b.text.slice(0, 42)}…` : b.text}
                                      </span>
                                    </span>
                                  ))}
                                  {beats.length > 4 ? (
                                    <span className="pf-muted" style={{ fontSize: '0.75rem' }}>
                                      {t('studio.storyboard.moreSegs').replace('{n}', String(beats.length - 4))}
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                desc || t('studio.storyboard.segPlaceholder')
                              )}
                            </button>
                          </td>
                          <td className="col-dur">{formatMmSs(shot.duration)}</td>
                          <td className="col-status">
                            <span
                              className={[
                                'pf-shot-status',
                                failed ? 'bad' : done ? '' : 'warn',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {done && !failed ? <span className="mark">✓</span> : null}
                              {shotDisplayLabel(displayKind)}
                            </span>
                          </td>
                          <td className="col-ops">
                            <div className="pf-shot-ops">
                              <button
                                type="button"
                                className="op"
                                disabled={rowBusy}
                                onClick={() => openShotEdit(shot)}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                className="op"
                                disabled={rowBusy}
                                onClick={() => regenImage(shot)}
                              >
                                {shot.image_url ? t('studio.storyboard.redrawImage') : t('studio.storyboard.genImage')}
                              </button>
                              {isFullPipeline ? (
                                <button
                                  type="button"
                                  className="op op-video"
                                  disabled={rowBusy || !shot.image_url}
                                  title={!shot.image_url ? t('studio.storyboard.needImageFirst') : undefined}
                                  onClick={() => regenVideo(shot)}
                                >
                                  {shot.video_url ? t('studio.storyboard.regenVideo') : t('studio.storyboard.genVideo')}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="more"
                                aria-label={t('studio.storyboard.moreOps')}
                                disabled={rowBusy}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMenuShotId((id) => (id === shot.id ? null : shot.id))
                                }}
                              >
                                ⋮
                              </button>
                              {menuShotId === shot.id ? (
                                <div className="pf-shot-menu" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    disabled={rowBusy}
                                    onClick={() => {
                                      setMenuShotId(null)
                                      regenAudio(shot)
                                    }}
                                  >
                                    {t('studio.storyboard.redub')}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pf-shot-footer">
              <span className="pf-muted" style={{ fontSize: '0.82rem' }}>
                {t('studio.storyboard.totalDuration')}: {formatMmSs(totalDuration)} | {t('studio.storyboard.imagesCount')}: {project.shots.length} {t('studio.storyboard.imagesCount')} | {t('studio.storyboard.audioCount')}:{' '}
                {project.shots.filter((s) => s.audio_url).length} {t('studio.storyboard.segs')} | {t('studio.storyboard.resolution')}: {t('studio.storyboard.previewRes')}
              </span>
              <div className="pf-toolbar">
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
                  disabled={shots.length === 0}
                  onClick={() => downloadStoryboardCsv(project)}
                >
                  <IconDownload size={15} />
                  {t('studio.storyboard.exportScript')}
                </button>
                <button
                  type="button"
                  className="pf-btn-text"
                  disabled={busy || running}
                  onClick={deleteProject}
                >
                  <IconTrash size={15} />
                  {t('studio.storyboard.deleteProject')}
                </button>
              </div>
            </div>
          </section>
        </div>

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
          <div className="pf-meter" style={{ marginTop: '1rem' }}>
            <i style={{ width: `${Math.min(100, project.progress)}%` }} />
          </div>
          <p className="pf-muted" style={{ fontSize: '0.82rem' }}>
            {statusLabel(project)}
          </p>
        </aside>
      </div>

      {batchOpen && project ? (
        <div className="modal-backdrop" onClick={() => !busy && setBatchOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('studio.storyboard.batchPanel')}</h3>
            <p className="pf-muted" style={{ marginTop: 0 }}>
              {t('studio.storyboard.batchSelected').replace('{n}', String(batchSelected.length)).replace('{total}', String(project.shots.length))}
            </p>
            <div
              style={{
                maxHeight: 160,
                overflow: 'auto',
                border: '1px solid var(--pf-border, #e5e7eb)',
                borderRadius: 10,
                padding: '0.5rem 0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={batchSelected.length === project.shots.length && project.shots.length > 0}
                  onChange={(e) =>
                    setBatchSelected(e.target.checked ? project.shots.map((s) => s.id) : [])
                  }
                />
                {t('studio.storyboard.selectAll')}
              </label>
              {project.shots
                .slice()
                .sort((a, b) => a.shot_no - b.shot_no)
                .map((s) => (
                  <label
                    key={s.id}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}
                  >
                    <input
                      type="checkbox"
                      checked={batchSelected.includes(s.id)}
                      onChange={(e) =>
                        setBatchSelected((prev) =>
                          e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                        )
                      }
                    />
                    {t('studio.storyboard.shotLabel')} {String(s.shot_no).padStart(2, '0')} · {formatMmSs(Number(s.duration) || 0)}
                  </label>
                ))}
            </div>
            <label>
              {t('studio.storyboard.uniformDuration')}
              <input
                type="number"
                min={1}
                step={0.5}
                placeholder={t('studio.storyboard.durationPlaceholder')}
                value={batchDuration}
                onChange={(e) => setBatchDuration(e.target.value)}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={batchRegenAudio}
                onChange={(e) => setBatchRegenAudio(e.target.checked)}
              />
              {t('studio.storyboard.redubSelected')}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="pf-btn pf-btn-lime"
                disabled={busy || batchSelected.length === 0}
                onClick={applyBatchAdjust}
              >
                {t('common.apply')}
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-ghost"
                disabled={busy}
                onClick={() => setBatchOpen(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="modal-backdrop" onClick={closeShotEdit}>
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
                      onChange={(e) => setEditing({ ...editing, overlay_title: e.target.value })}
                    />
                    <span className="pf-muted pf-prompt-hint">
                      {t('studio.storyboard.shotTitleTip')}
                    </span>
                  </label>
                  <label>
                    {t('studio.storyboard.subtitle')}
                    <input
                      value={editing.overlay_subtitle || ''}
                      onChange={(e) => setEditing({ ...editing, overlay_subtitle: e.target.value })}
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
                      onChange={(e) => patchEditingNarration(e.target.value)}
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
                    autoFocus={editFocus === 'img_prompt'}
                    value={editing.img_prompt}
                    onChange={(e) => patchEditingVisual(e.target.value)}
                    rows={3}
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
                      className="pf-prompt-segment"
                      autoFocus={editFocus === 'segment_script' || editMode === 'segment'}
                      value={editing.segment_script || editing.video_prompt || ''}
                      onChange={(e) => patchEditingScript(e.target.value)}
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
                      {t('studio.storyboard.totalDurationCheck').replace('{total}', String(editDurationCheck.total)).replace('{max}', String(SHOT_DURATION_MAX))}
                    </span>
                  </div>
                  {!editDurationCheck.valid && editDurationCheck.message ? (
                    <p className="pf-error pf-prompt-duration-error">{editDurationCheck.message}</p>
                  ) : null}
                  <label>
                    {t('studio.storyboard.cameraNote')}
                    <input
                      value={editing.camera || ''}
                      onChange={(e) => setEditing({ ...editing, camera: e.target.value })}
                    />
                  </label>
                  <div className="pf-prompt-modal-row">
                    <label>
                      {t('studio.storyboard.durationNote')}
                      <input
                        type="number"
                        value={editing.duration}
                        onChange={(e) => setEditing({ ...editing, duration: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </div>
            <div className="pf-prompt-modal-foot">
              {editMode !== 'segment' ? (
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm"
                  onClick={() => {
                    setEditMode('segment')
                    setEditFocus('segment_script')
                  }}
                >
                  {t('studio.storyboard.segTab')}
                </button>
              ) : null}
              {editMode !== 'narration' ? (
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm"
                  onClick={() => {
                    setEditMode('narration')
                    setEditFocus('narration')
                  }}
                >
                  {t('studio.storyboard.narrTab')}
                </button>
              ) : null}
              {editMode !== 'full' ? (
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm"
                  onClick={() => {
                    setEditMode('full')
                    setEditFocus('')
                  }}
                >
                  {t('studio.storyboard.allFields')}
                </button>
              ) : null}
              <span className="pf-prompt-modal-foot-spacer" />
              <button
                type="button"
                className="pf-btn pf-btn-lime"
                disabled={busy || !editDurationCheck.valid}
                onClick={saveShot}
              >
                {t('common.save')}
              </button>
              <button type="button" className="pf-btn pf-btn-ghost" onClick={closeShotEdit}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {promptEdit ? (
        <div className="modal-backdrop" onClick={() => setPromptEdit(null)}>
          <div className="modal pf-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('studio.storyboard.projectPrompts')}</h3>
            <p className="pf-muted" style={{ fontSize: '0.8rem', marginTop: 0 }}>
              {t('studio.storyboard.promptsNote')}
            </p>
            <label>
              {t('studio.storyboard.stylePromptLabel')}
              <textarea
                value={promptEdit.style_prompt}
                onChange={(e) => setPromptEdit({ ...promptEdit, style_prompt: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              {t('studio.storyboard.charPromptLabel')}
              <textarea
                autoFocus
                value={promptEdit.character_prompt}
                onChange={(e) => setPromptEdit({ ...promptEdit, character_prompt: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              {t('studio.storyboard.extraPromptLabel')}
              <textarea
                value={promptEdit.extra_prompt}
                onChange={(e) => setPromptEdit({ ...promptEdit, extra_prompt: e.target.value })}
                rows={2}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="pf-btn pf-btn-lime"
                disabled={busy}
                onClick={saveProjectPrompts}
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-ghost"
                disabled={busy}
                onClick={() => void restoreTemplatePrompts()}
              >
                {t('studio.storyboard.restoreTemplate')}
              </button>
              <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setPromptEdit(null)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                {preview.kind === 'final' ? preview.title : t('studio.storyboard.shotNo').replace('{no}', String(preview.shotNo))}
              </h3>
              <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => setPreview(null)}>
                {t('common.close')}
              </button>
            </div>
            {preview.kind === 'final' ? (
              <video className="preview-media" src={preview.url} controls autoPlay />
            ) : preview.videoUrl ? (
              <video
                className="preview-media"
                src={api.assetUrl(preview.videoUrl)}
                poster={preview.imageUrl ? api.assetUrl(preview.imageUrl) : undefined}
                controls
                autoPlay
              />
            ) : preview.imageUrl ? (
              <img className="preview-media" src={api.assetUrl(preview.imageUrl)} alt="" />
            ) : (
              <p className="pf-muted">{t('studio.storyboard.noPreview')}</p>
            )}
            {preview.kind === 'shot' && preview.audioUrl ? (
              <audio src={api.assetUrl(preview.audioUrl)} controls style={{ width: '100%' }} />
            ) : null}
            {preview.kind === 'shot' ? <p className="pf-muted">{preview.caption}</p> : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
