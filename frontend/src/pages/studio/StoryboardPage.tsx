import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import ShotTrimModal from '../../components/studio/ShotTrimModal'
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
  const header = ['Số cảnh', 'Lời dẫn', 'Mô tả hình ảnh', 'Thời lượng (s)', 'Trạng thái', 'Tiêu đề cảnh']
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

function localizeCueText(text: string): string {
  if (!text) return ''
  return text
    .replace('字幕：后期叠旁白字幕，简体中文逐句同步', 'Phụ đề: Ghép chữ lời dẫn ở hậu kỳ, đồng bộ từng câu')
    .replace('字幕：底部居中·简体中文·逐句轮换·与口播同步', 'Phụ đề: Căn giữa phía dưới · Đồng bộ lời thoại')
    .replace('字幕：底部居中·简体中文', 'Phụ đề: Căn giữa phía dưới')
    .replace('后期混音', 'Hòa âm hậu kỳ')
    .replace(/，?音量低于人声/, ', âm lượng nhỏ hơn giọng nói')
}

function localizeBeatText(text: string): string {
  if (!text) return ''
  return text
    .replace(/^【旁白[·・•\s]*自然语速[·・•\s]*同步字幕】/, '【Lời dẫn · Tốc độ tự nhiên · Phụ đề đồng bộ】')
    .replace(/^【旁白[·・•\s]*慢速清晰[·・•\s]*同步字幕】/, '【Lời dẫn · Chậm rõ · Phụ đề đồng bộ】')
    .replace(/^【旁白[·・•\s]*自然语速】/, '【Lời dẫn · Tốc độ tự nhiên】')
    .replace(/^【旁白[·・•\s]*慢速清晰】/, '【Lời dẫn · Chậm rõ】')
    .replace(/^【对白[·・•\s]*慢速清晰[·・•\s]*同步字幕】/, '【Đối thoại · Chậm rõ · Phụ đề đồng bộ】')
    .replace(/^【画面[·・•\s]*无配音仅环境音】/, '【Hình ảnh · Âm thanh môi trường】')
    .replace(/^【空镜[·・•\s]*可仅环境音与\s*BGM】/, '【Cảnh trống · Âm thanh môi trường & BGM】')
}

type PreviewState =
  | {
      kind: 'shot'
      shotNo: number
      imageUrl: string | null
      videoUrl: string | null
      audioUrl: string | null
      caption: string
      version?: number
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

/** Khi có dữ liệu nền tảng tác vụ, active_tasks sẽ chiếm ưu thế; nếu không có nhiệm vụ nào trong COMPOSING, nó sẽ được coi là phần còn lại của lỗi nối và có thể được thử lại. */
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
  // busyShotIds đang gửi số lần quay của hình ảnh/video quay một lần, có thể song song, cuối cùng chỉ xóa chính nó
  const [busyShotIds, setBusyShotIds] = useState<Set<number>>(() => new Set())
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Shot | null>(null)
  const [editFocus, setEditFocus] = useState<string>('')
  /** Lối vào biểu mẫu: Cột tường thuật/phân đoạn theo cột phân đoạn/thanh thao tác "Chỉnh sửa" */
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
  const segScriptTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>({})
  const [trimmingShot, setTrimmingShot] = useState<{
    shot: Shot
    videoDuration: number
  } | null>(null)

  useEffect(() => {
    const el = segScriptTextareaRef.current
    if (!el) return
    const adjust = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    adjust()
    window.addEventListener('resize', adjust)
    return () => window.removeEventListener('resize', adjust)
  }, [editing?.segment_script, editing?.video_prompt, editMode])

  const autoGrowPrompt = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (!promptEdit) return
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLTextAreaElement>('.pf-project-prompts-modal textarea').forEach((ta) => {
        ta.style.height = 'auto'
        ta.style.height = `${ta.scrollHeight}px`
      })
    }, 0)
    return () => clearTimeout(timer)
  }, [promptEdit])

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
  }, [project?.shots])

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

  // editScriptText Tập lệnh theo từng phần hiện được chỉnh sửa trong cửa sổ bật lên
  const editScriptText = editing?.segment_script || editing?.video_prompt || ''
  // editDurationCheck Xác minh thời lượng của tập lệnh bật lên
  const editDurationCheck = useMemo(
    () => validateSegmentScriptDuration(editScriptText),
    [editScriptText],
  )

  const shots = useMemo(() => shotsByNo(project?.shots), [project?.shots])
  /** Khi trường dự án trống, mẫu sẽ được lặp lại theo mặc định (phù hợp với phần phụ trợ _hiệu quả_*) */
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

  // Tiến trình của Workbench: chế độ đầy đủ yêu cầu video ống kính + TTS bên ngoài, chế độ hình ảnh tĩnh chỉ yêu cầu tổng hợp lồng tiếng
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
      return `Thời lượng tối thiểu là ${minAllowedDuration}s (theo mẫu ${template?.name || ''}).`
    }
    if (batchDurationNum > maxAllowedDuration) {
      return `Thời lượng tối đa là ${maxAllowedDuration}s (theo mẫu ${template?.name || ''}).`
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

  // Đánh dấu yêu cầu nhân bản này là đang được tiến hành và không bao gồm các nhân bản khác
  function markShotBusy(shotId: number) {
    setBusyShotIds((ids) => new Set(ids).add(shotId))
  }

  // Chỉ xóa chính mình để tránh các yêu cầu song song xả ổ khóa của nhau
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
    // Việc lồng tiếng lại sẽ viết lại toàn bộ phim để phát sóng, khóa toàn bộ bàn để tránh viết vội hai chiều
    setBusy(true)
    try {
      setProject(await api.regenAudio(project.id, shot.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.redubFailed'))
    } finally {
      setBusy(false)
    }
  }

  function openTrimModal(shot: Shot, initialDuration?: number) {
    const vDur = initialDuration || videoDurations[shot.id] || 10
    setTrimmingShot({ shot, videoDuration: vDur })
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

  // Viết đồng bộ phần tường thuật kịch bản khi thay đổi lời tường thuật
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

  // Viết đồng bộ đoạn đầu tiên của kịch bản khi thay đổi hình ảnh khung hình đầu tiên
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

  // Lấp đầy lời tường thuật và khung hình đầu tiên khi sửa kịch bản
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
    // scriptText tập lệnh theo từng phần hiện đang được chỉnh sửa
    const scriptText = editing.segment_script || editing.video_prompt || ''
    // thời lượngKiểm tra kết quả kiểm tra thời lượng
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

  // Lưu từ nhắc dự án; nếu giống với mẫu nền thì sẽ bị xóa và ghi đè.
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

  // Xóa phạm vi dự án và thế hệ tiếp theo sẽ đi theo mẫu nền
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
                       * localBusy Yêu cầu nhân bản này đã được gửi nhưng tác vụ vẫn chưa được viết lại
                       * shotGenating Tác vụ nhân bản này hoặc quá trình gửi cục bộ đang được tiến hành
                       * pipeLocked Toàn bộ đường dẫn/lồng tiếng phim đã bị chiếm dụng
                       * displayKind / done / failed Hiển thị theo mức độ đầy đủ của vật liệu
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
                      const canTrim = Boolean(
                        shot.video_url &&
                        videoDurations[shot.id] &&
                        Math.abs(videoDurations[shot.id] - Number(shot.duration)) > 0.5
                      )
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
                                  version: shot.version,
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
                              {shot.video_url ? (
                                <span className="pf-shot-thumb-play-overlay" title={t('studio.storyboard.viewVideo')}>
                                  <span className="pf-shot-thumb-play-icon">
                                    <IconPlay size={14} />
                                  </span>
                                </span>
                              ) : null}
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
                                  {localizeCueText(cues[0])?.replace(/^【|】$/g, '')}
                                  {cues[1]
                                    ? ` · ${(() => {
                                        const clean = localizeCueText(cues[1])
                                          .replace(/^【(?:BGM[：:]\s*|Nhạc nền[：:]\s*)?/i, '')
                                          .replace(/】$/, '')
                                        return clean.length > 80 ? `${clean.slice(0, 80)}…` : clean
                                      })()}`
                                    : ''}
                                </span>
                              ) : null}
                              {beats.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                  {beats.slice(0, 6).map((b, i) => {
                                    const localizedText = localizeBeatText(b.text)
                                    return (
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
                                          {localizedText.length > 160 ? `${localizedText.slice(0, 160)}…` : localizedText}
                                        </span>
                                      </span>
                                    )
                                  })}
                                  {beats.length > 6 ? (
                                    <span className="pf-muted" style={{ fontSize: '0.75rem' }}>
                                      {t('studio.storyboard.moreSegs').replace('{n}', String(beats.length - 6))}
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
                            <div className="pf-shot-status-wrap">
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
                              {shot.video_url ? (
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    className="pf-shot-view-btn"
                                    onClick={() =>
                                      setPreview({
                                        kind: 'shot',
                                        shotNo: shot.shot_no,
                                        imageUrl: shot.image_url,
                                        videoUrl: shot.video_url,
                                        audioUrl: shot.audio_url,
                                        caption: shotCaption(shot, t),
                                        version: shot.version,
                                      })
                                    }
                                  >
                                    <IconPlay size={12} />
                                    {t('studio.storyboard.viewVideo')}
                                  </button>
                                  {canTrim ? (
                                    <button
                                      type="button"
                                      className="pf-shot-trim-btn"
                                      title={t('studio.storyboard.trimTip')}
                                      onClick={() => openTrimModal(shot, videoDurations[shot.id])}
                                    >
                                      ✂ {t('studio.storyboard.trimAction')}
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
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
                                  {canTrim ? (
                                    <button
                                      type="button"
                                      disabled={rowBusy}
                                      onClick={() => {
                                        setMenuShotId(null)
                                        openTrimModal(shot, videoDurations[shot.id])
                                      }}
                                    >
                                      ✂ {t('studio.storyboard.trimVideo')}
                                    </button>
                                  ) : null}
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
      </div>

      {batchOpen && project ? (
        <div className="modal-backdrop" onClick={() => !busy && setBatchOpen(false)}>
          <div className="modal pf-batch-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('studio.storyboard.batchPanel')}</h3>
            <div className="pf-batch-modal-head">
              <div className="pf-batch-select-all">
                <label className="pf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={batchSelected.length === project.shots.length && project.shots.length > 0}
                    onChange={(e) =>
                      setBatchSelected(e.target.checked ? project.shots.map((s) => s.id) : [])
                    }
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
                      onClick={() =>
                        setBatchSelected((prev) =>
                          isChecked ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                        )
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        onClick={(e) => {
                          e.stopPropagation()
                          setBatchSelected((prev) =>
                            isChecked ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                          )
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
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
                placeholder={`VD: ${minAllowedDuration} - ${maxAllowedDuration}`}
                value={batchDuration}
                onChange={(e) => setBatchDuration(e.target.value)}
                style={{
                  borderColor: batchDurationError ? 'var(--pf-danger, #ef4444)' : undefined,
                }}
              />
              {batchDurationError ? (
                <span style={{ color: 'var(--pf-danger, #ef4444)', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                  {batchDurationError}
                </span>
              ) : null}
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
                disabled={!canApplyBatch}
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
                      ref={segScriptTextareaRef}
                      className="pf-prompt-segment"
                      autoFocus={editFocus === 'segment_script' || editMode === 'segment'}
                      value={editing.segment_script || editing.video_prompt || ''}
                      onChange={(e) => {
                        patchEditingScript(e.target.value)
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
                  <label>
                    {t('studio.storyboard.durationNote')}
                    <input
                      type="number"
                      value={editing.duration}
                      onChange={(e) => setEditing({ ...editing, duration: Number(e.target.value) })}
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
              </div>
              <div className="pf-prompt-modal-foot-actions">
                <button type="button" className="pf-btn pf-btn-ghost" onClick={closeShotEdit}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="pf-btn pf-btn-lime"
                  disabled={busy || !editDurationCheck.valid}
                  onClick={saveShot}
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {promptEdit ? (
        <div className="modal-backdrop" onClick={() => setPromptEdit(null)}>
          <div className="modal pf-prompt-modal pf-project-prompts-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('studio.storyboard.projectPrompts')}</h3>
            <p className="pf-muted" style={{ fontSize: '0.8rem', marginTop: 0 }}>
              {t('studio.storyboard.promptsNote')}
            </p>
            <label>
              {t('studio.storyboard.stylePromptLabel')}
              <textarea
                ref={autoGrowPrompt}
                value={promptEdit.style_prompt}
                onInput={(e) => autoGrowPrompt(e.currentTarget)}
                onChange={(e) => {
                  setPromptEdit({ ...promptEdit, style_prompt: e.target.value })
                  autoGrowPrompt(e.currentTarget)
                }}
                rows={1}
              />
            </label>
            <label>
              {t('studio.storyboard.charPromptLabel')}
              <textarea
                ref={autoGrowPrompt}
                autoFocus
                value={promptEdit.character_prompt}
                onInput={(e) => autoGrowPrompt(e.currentTarget)}
                onChange={(e) => {
                  setPromptEdit({ ...promptEdit, character_prompt: e.target.value })
                  autoGrowPrompt(e.currentTarget)
                }}
                rows={1}
              />
            </label>
            <label>
              {t('studio.storyboard.extraPromptLabel')}
              <textarea
                ref={autoGrowPrompt}
                value={promptEdit.extra_prompt}
                onInput={(e) => autoGrowPrompt(e.currentTarget)}
                onChange={(e) => {
                  setPromptEdit({ ...promptEdit, extra_prompt: e.target.value })
                  autoGrowPrompt(e.currentTarget)
                }}
                rows={1}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
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
                src={api.assetUrl(preview.videoUrl, preview.version)}
                poster={preview.imageUrl ? api.assetUrl(preview.imageUrl, preview.version) : undefined}
                controls
                autoPlay
              />
            ) : preview.imageUrl ? (
              <img className="preview-media" src={api.assetUrl(preview.imageUrl, preview.version)} alt="" />
            ) : (
              <p className="pf-muted">{t('studio.storyboard.noPreview')}</p>
            )}
            {preview.kind === 'shot' && preview.audioUrl && !preview.videoUrl ? (
              <audio src={api.assetUrl(preview.audioUrl)} controls style={{ width: '100%' }} />
            ) : null}
            {preview.kind === 'shot' ? <p className="pf-muted">{preview.caption}</p> : null}
          </div>
        </div>
      ) : null}

      {trimmingShot && project ? (
        <ShotTrimModal
          projectId={project.id}
          shot={trimmingShot.shot}
          initialVideoDuration={trimmingShot.videoDuration}
          onClose={() => setTrimmingShot(null)}
          onSuccess={(nextProject, newDuration) => {
            setProject(nextProject)
            setVideoDurations((prev) => ({ ...prev, [trimmingShot.shot.id]: newDuration }))
            setTrimmingShot(null)
          }}
        />
      ) : null}
    </AppShell>
  )
}
