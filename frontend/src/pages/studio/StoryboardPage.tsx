import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { useNavigate, useParams } from 'react-router-dom'
import { api, defaultsFromTemplate, getApiBase, type ReferenceImageItem, type UpstreamCurlInfo } from '../../api'
import type { Project, Shot, Template } from '../../api'
import { AlertCircle, Check, Copy, ExternalLink, Images, X, ZoomIn } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import AppShell from '../../components/layout/AppShell'
import Stepper from '../../components/ui/Stepper'
import {
  IconChevronLeft,
  IconDownload,
  IconEdit,
  IconMonitor,
  IconPlay,
  IconRefresh,
  IconSliders,
  IconTrash,
} from '../../components/ui/Icons'
import { dialog } from '../../lib/dialog'
import { handleBillingError } from '../../lib/billingError'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import ShotTrimModal from '../../components/studio/ShotTrimModal'
import ShotPromptModal from '../../components/studio/ShotPromptModal'
import {
  effectiveStatus,
  formatMmSs,
  kepuBillingPhase,
  kepuPhaseHint,
  kepuStepIndex,
  kepuSteps,
  isProjectWideBusy,
  shotsByNo,
} from '../../lib/status'
import {
  firstVisualFromScript,
  narrationFromScript,
  replaceFirstVisualInScript,
  replaceNarrationInScript,
  validateSegmentScriptDuration,
} from '../../lib/segmentDuration'
import {
  downloadStoryboardCsv,
  isProjectBusy,
} from '../../components/studio/storyboard/storyboardUtils'
import StoryboardSidebar from '../../components/studio/storyboard/StoryboardSidebar'
import StoryboardOverviewGrid from '../../components/studio/storyboard/StoryboardOverviewGrid'
import StoryboardBatchModal from '../../components/studio/storyboard/StoryboardBatchModal'
import StoryboardShotEditModal from '../../components/studio/storyboard/StoryboardShotEditModal'
import StoryboardProjectPromptsModal from '../../components/studio/storyboard/StoryboardProjectPromptsModal'
import StoryboardPreviewModal, {
  type PreviewState,
} from '../../components/studio/storyboard/StoryboardPreviewModal'
import StoryboardShotRow from '../../components/studio/storyboard/StoryboardShotRow'
import UploadImageModal from '../../components/studio/storyboard/UploadImageModal'
import UploadVideoModal from '../../components/studio/storyboard/UploadVideoModal'

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
  const [imgMenuShotId, setImgMenuShotId] = useState<number | null>(null)
  const [promptModalShot, setPromptModalShot] = useState<{ shot: Shot; tab?: 'image' | 'video' } | null>(null)
  const [curlModalShot, setCurlModalShot] = useState<{ shot: Shot; tab: 'image' | 'video' } | null>(null)
  const [curlCopied, setCurlCopied] = useState(false)
  const [upstreamCurl, setUpstreamCurl] = useState<UpstreamCurlInfo | null>(null)
  const [upstreamLoading, setUpstreamLoading] = useState(false)
  const [curlViewMode, setCurlViewMode] = useState<'upstream' | 'internal'>('internal')
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSelected, setBatchSelected] = useState<number[]>([])
  const [batchDuration, setBatchDuration] = useState('')
  const [batchRegenAudio, setBatchRegenAudio] = useState(false)
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>({})
  const [trimmingShot, setTrimmingShot] = useState<{
    shot: Shot
    videoDuration: number
  } | null>(null)
  const [uploadVideoShot, setUploadVideoShot] = useState<Shot | null>(null)
  const [uploadImageShot, setUploadImageShot] = useState<Shot | null>(null)

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
    if (menuShotId == null && imgMenuShotId == null) return
    function onDoc() {
      setMenuShotId(null)
      setImgMenuShotId(null)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [menuShotId, imgMenuShotId])

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

  function getShotCurlCommand(shot: Shot, tab: 'image' | 'video') {
    if (!project) return ''
    const baseUrl = getApiBase()
    const token = localStorage.getItem('token') || '<YOUR_TOKEN>'
    const loc = localStorage.getItem('printfilm.locale') || 'vi'
    const endpoint = tab === 'video' ? 'regen-video' : 'regen-image'

    return `curl -X POST "${baseUrl}/api/projects/${project.id}/shots/${shot.id}/${endpoint}" \\
  -H "Accept-Language: ${loc}" \\
  -H "Authorization: Bearer ${token}"`
  }

  useEffect(() => {
    if (!curlModalShot || !project) {
      setUpstreamCurl(null)
      return
    }
    setCurlViewMode('internal')
    setUpstreamLoading(true)
    api.getShotUpstreamCurl(project.id, curlModalShot.shot.id, curlModalShot.tab)
      .then((res) => {
        setUpstreamCurl(res)
      })
      .catch(() => {
        setUpstreamCurl(null)
      })
      .finally(() => {
        setUpstreamLoading(false)
      })
  }, [curlModalShot, project])

  const activeCurlRefs = useMemo<ReferenceImageItem[]>(() => {
    if (upstreamCurl?.reference_images && upstreamCurl.reference_images.length > 0) {
      return upstreamCurl.reference_images
    }
    if (!curlModalShot || !project) return []
    const list: ReferenceImageItem[] = []
    const shot = curlModalShot.shot
    if (curlModalShot.tab === 'video') {
      if (shot.image_url || shot.image_ark_url) {
        list.push({
          url: shot.image_url || shot.image_ark_url || '',
          type: 'keyframe',
          label: `Ảnh phân cảnh #${String(shot.shot_no).padStart(2, '0')} (Khung hình gốc / First frame)`,
          description: `Ảnh tham chiếu chính (ID: ref_${String(shot.id).padStart(3, '0')}) bắt buộc để Google Veo (r2v) tạo video`,
          shot_no: shot.shot_no,
        })
      }
      const prevShot = project.shots
        .slice()
        .sort((a, b) => a.shot_no - b.shot_no)
        .filter((s) => s.shot_no < shot.shot_no && (s.image_url || s.image_ark_url))
        .pop()
      if (prevShot && (prevShot.last_frame_url || prevShot.image_url || prevShot.image_ark_url)) {
        list.push({
          url: prevShot.last_frame_url || prevShot.image_url || prevShot.image_ark_url || '',
          type: 'previous_tail_frame',
          label: `Khung hình nối từ cảnh trước (Cảnh ${String(prevShot.shot_no).padStart(2, '0')})`,
          description: 'Tham chiếu khung hình liền kề',
          shot_no: prevShot.shot_no,
        })
      }
    } else {
      if (shot.image_url || shot.image_ark_url) {
        list.push({
          url: shot.image_url || shot.image_ark_url || '',
          type: 'current_image',
          label: `Ảnh hiện tại (Cảnh ${String(shot.shot_no).padStart(2, '0')})`,
          description: 'Ảnh tham chiếu hiện có của cảnh khi vẽ lại',
          shot_no: shot.shot_no,
        })
      }
    }
    if (project.ref_image_url) {
      list.push({
        url: project.ref_image_url,
        type: 'character_ref',
        label: 'Nhân vật tham chiếu (Character Bible)',
        description: 'Đồng bộ ngoại hình nhân vật theo thiết lập dự án',
      })
    }
    if (project.product_image_url) {
      list.push({
        url: project.product_image_url,
        type: 'product_ref',
        label: 'Sản phẩm tham chiếu',
        description: 'Đồng bộ nhận diện sản phẩm',
      })
    }
    if (project.scene_image_url) {
      list.push({
        url: project.scene_image_url,
        type: 'scene_ref',
        label: 'Bối cảnh tham chiếu',
        description: 'Đồng bộ không gian bối cảnh',
      })
    }
    return list
  }, [upstreamCurl, curlModalShot, project])

  async function copyCurl() {
    if (!curlModalShot) return
    const textToCopy =
      curlViewMode === 'upstream'
        ? (upstreamCurl?.curl || '')
        : getShotCurlCommand(curlModalShot.shot, curlModalShot.tab)
    if (!textToCopy) return
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCurlCopied(true)
      setTimeout(() => setCurlCopied(false), 2000)
    } catch {
      // fallback
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
    <AppShell active="studio" wide hideFooter>
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

      {error ? <BillingErrorNotice message={error} className="pf-error pf-board-error" /> : null}
      {project.error_msg ? (
        <BillingErrorNotice message={project.error_msg} className="pf-error pf-board-error" />
      ) : null}

      <div className="pf-board">
        <StoryboardSidebar
          project={project}
          template={template}
          shots={shots}
          busy={busy}
          running={running}
          totalDuration={totalDuration}
          displayPrompts={displayPrompts}
          onCoverFile={onCoverFile}
          useFirstShotCover={useFirstShotCover}
          onDownloadCsv={() => downloadStoryboardCsv(project, t)}
          onEditSettings={() => nav(`/studio/${project.id}/style`)}
          onOpenPromptEdit={(prompts) => setPromptEdit(prompts)}
        />

        <div className="pf-board-main">
          <StoryboardOverviewGrid
            project={project}
            structure={structure}
            progressItems={progressItems}
          />

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
                    {shots.map((shot) => (
                      <StoryboardShotRow
                        key={shot.id}
                        shot={shot}
                        project={project}
                        busyShotIds={busyShotIds}
                        pipelineLocked={isProjectWideBusy(project)}
                        pageBusy={busy}
                        isFullPipeline={isFullPipeline}
                        videoDurations={videoDurations}
                        imgMenuShotId={imgMenuShotId}
                        menuShotId={menuShotId}
                        onSetImgMenuShotId={setImgMenuShotId}
                        onSetMenuShotId={setMenuShotId}
                        onOpenPreview={setPreview}
                        onOpenShotEdit={openShotEdit}
                        onOpenTrimModal={openTrimModal}
                        onOpenPromptModal={(shot, tab) => setPromptModalShot({ shot, tab })}
                        onOpenCurlModal={(shot, tab) => setCurlModalShot({ shot, tab })}
                        onRegenImage={regenImage}
                        onRegenVideo={regenVideo}
                        onRegenAudio={regenAudio}
                        onUploadVideo={setUploadVideoShot}
                        onUploadImage={setUploadImageShot}
                      />
                    ))}
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
                  onClick={() => downloadStoryboardCsv(project, t)}
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

      <StoryboardBatchModal
        open={batchOpen && Boolean(project)}
        busy={busy}
        project={project}
        batchSelected={batchSelected}
        onSelectAll={(checked) => setBatchSelected(checked ? project.shots.map((s) => s.id) : [])}
        onToggleShot={(shotId) =>
          setBatchSelected((prev) =>
            prev.includes(shotId) ? prev.filter((id) => id !== shotId) : [...prev, shotId],
          )
        }
        batchDuration={batchDuration}
        onChangeBatchDuration={setBatchDuration}
        batchDurationError={batchDurationError}
        minAllowedDuration={minAllowedDuration}
        maxAllowedDuration={maxAllowedDuration}
        batchRegenAudio={batchRegenAudio}
        onChangeBatchRegenAudio={setBatchRegenAudio}
        canApplyBatch={canApplyBatch}
        onApply={applyBatchAdjust}
        onClose={() => !busy && setBatchOpen(false)}
      />

      <StoryboardShotEditModal
        editing={editing}
        editMode={editMode}
        editFocus={editFocus}
        editDurationCheck={editDurationCheck}
        busy={busy}
        onChangeEditing={setEditing}
        onPatchNarration={patchEditingNarration}
        onPatchVisual={patchEditingVisual}
        onPatchScript={patchEditingScript}
        onChangeMode={(mode, focus) => {
          setEditMode(mode)
          setEditFocus(focus)
        }}
        onSave={saveShot}
        onClose={closeShotEdit}
      />

      <StoryboardProjectPromptsModal
        promptEdit={promptEdit}
        busy={busy}
        onChangePromptEdit={setPromptEdit}
        onSave={saveProjectPrompts}
        onRestoreTemplate={() => void restoreTemplatePrompts()}
        onClose={() => setPromptEdit(null)}
      />

      <StoryboardPreviewModal
        preview={preview}
        onClose={() => setPreview(null)}
      />

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

      {promptModalShot && project ? (
        <ShotPromptModal
          projectId={project.id}
          shot={promptModalShot.shot}
          tab={promptModalShot.tab}
          open={Boolean(promptModalShot)}
          onClose={() => setPromptModalShot(null)}
          onEditShot={(s) => openShotEdit(s)}
        />
      ) : null}

      {uploadVideoShot && project ? (
        <UploadVideoModal
          projectId={project.id}
          shot={uploadVideoShot}
          open={Boolean(uploadVideoShot)}
          onClose={() => setUploadVideoShot(null)}
          onUploaded={(updatedShot) => {
            setProject((prev) =>
              prev
                ? {
                    ...prev,
                    shots: prev.shots.map((s) =>
                      s.id === updatedShot.id ? { ...s, ...updatedShot } : s,
                    ),
                  }
                : prev,
            )
            setUploadVideoShot(null)
          }}
        />
      ) : null}

      {uploadImageShot && project ? (
        <UploadImageModal
          projectId={project.id}
          shot={uploadImageShot}
          open={Boolean(uploadImageShot)}
          onClose={() => setUploadImageShot(null)}
          onUploaded={(updatedProject) => {
            setProject(updatedProject)
            setUploadImageShot(null)
          }}
        />
      ) : null}

      {curlModalShot && project ? (
        <Modal
          open={Boolean(curlModalShot)}
          onClose={() => setCurlModalShot(null)}
          title={
            curlViewMode === 'upstream'
              ? 'Lệnh cURL API (neuravibemmo.dpdns.org)'
              : (t('studio.createProject.curlModalTitle') || 'Lệnh cURL API')
          }
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
                onClick={copyCurl}
              >
                {curlCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{curlCopied ? (t('studio.createProject.copiedCurl') || 'Đã sao chép cURL!') : 'Copy cURL'}</span>
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                onClick={() => setCurlModalShot(null)}
              >
                {t('common.close') || 'Đóng'}
              </button>
            </div>
          }
        >
          <div style={{ padding: '0.25rem 0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={['pf-pill', curlViewMode === 'internal' ? 'lime active' : ''].join(' ')}
                style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}
                onClick={() => setCurlViewMode('internal')}
              >
                🖥️ Internal API (PrintFilm Backend)
              </button>
              <button
                type="button"
                className={['pf-pill', curlViewMode === 'upstream' ? 'lime active' : ''].join(' ')}
                style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}
                onClick={() => setCurlViewMode('upstream')}
              >
                🌐 Upstream API (neuravibemmo.dpdns.org)
              </button>
            </div>

            {/* Khối hiển thị ảnh tham chiếu cần có */}
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.85rem 1rem',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.86rem', color: '#1e293b' }}>
                  <Images size={16} color="#0d9488" />
                  <span>
                    {curlModalShot.tab === 'video'
                      ? 'Ảnh tham chiếu tạo Video (Reference Media)'
                      : 'Ảnh tham chiếu tạo Hình ảnh'}
                  </span>
                  <span className="pf-prompt-count-pill" style={{ marginLeft: '0.2rem' }}>
                    {activeCurlRefs.length} ảnh
                  </span>
                </div>
                {curlModalShot.tab === 'video' ? (
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Google Veo (r2v) lấy ảnh làm khung hình gốc (First frame)
                  </span>
                ) : null}
              </div>

              {activeCurlRefs.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {activeCurlRefs.map((r, idx) => {
                    const fullUrl = api.assetUrl(r.url)
                    return (
                      <div
                        key={`${r.url}-${idx}`}
                        className="pf-prompt-ref-card"
                        style={{ border: '1px solid #cbd5e1', background: '#fff' }}
                      >
                        <div
                          className="pf-prompt-ref-thumb"
                          style={{
                            maxHeight: '170px',
                            aspectRatio: project.output_ratio === '16:9' ? '16 / 9' : '9 / 16',
                          }}
                          onClick={() => setPreviewImg(fullUrl)}
                          title="Nhấn để xem phóng to"
                        >
                          <img src={fullUrl} alt={r.label} loading="lazy" />
                          <div className="pf-prompt-ref-overlay">
                            <ZoomIn size={15} strokeWidth={2} />
                            <span>Phóng to</span>
                          </div>
                        </div>
                        <div className="pf-prompt-ref-info" style={{ padding: '0.5rem 0.6rem' }}>
                          <span
                            className="pf-prompt-ref-tag"
                            style={{
                              background: r.type === 'keyframe' ? '#dcfce7' : '#f1f5f9',
                              color: r.type === 'keyframe' ? '#166534' : '#475569',
                              fontWeight: r.type === 'keyframe' ? 700 : 500,
                              fontSize: '0.7rem',
                            }}
                          >
                            {r.type === 'keyframe'
                              ? '⭐ Khung hình gốc (First Frame)'
                              : r.type === 'character_ref'
                              ? 'Nhân vật tham chiếu'
                              : r.type === 'product_ref'
                              ? 'Sản phẩm tham chiếu'
                              : r.type === 'scene_ref'
                              ? 'Bối cảnh tham chiếu'
                              : r.type === 'previous_tail_frame'
                              ? 'Nối cảnh trước'
                              : r.type === 'current_image'
                              ? 'Ảnh hiện tại'
                              : r.type}
                          </span>
                          <div
                            className="pf-prompt-ref-label"
                            title={r.label}
                            style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}
                          >
                            {r.label}
                          </div>
                          {r.description ? (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
                              {r.description}
                            </div>
                          ) : null}
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="pf-prompt-ref-link"
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginTop: '0.2rem', fontSize: '0.72rem' }}
                          >
                            <span>Mở ảnh gốc</span>
                            <ExternalLink size={11} strokeWidth={2} />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    background: curlModalShot.tab === 'video' ? '#fef2f2' : '#f1f5f9',
                    border: curlModalShot.tab === 'video' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: curlModalShot.tab === 'video' ? '#991b1b' : '#475569',
                    fontSize: '0.82rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>
                    {curlModalShot.tab === 'video'
                      ? '⚠️ Cảnh này chưa có ảnh phân cảnh (First frame). Google Veo r2v yêu cầu phải có ảnh tham chiếu để tạo video. Vui lòng bấm "Vẽ ảnh" trước.'
                      : 'Không có ảnh tham chiếu nào. Ảnh được vẽ hoàn toàn từ mô tả văn bản (Text-to-Image).'}
                  </span>
                </div>
              )}
            </div>

            {curlViewMode === 'upstream' ? (
              <>
                {upstreamLoading ? (
                  <div className="pf-prompt-loading" style={{ padding: '1.5rem 0' }}>
                    <span className="pf-spinner" />
                    <span>Đang tải nội dung API gửi tới neuravibemmo.dpdns.org...</span>
                  </div>
                ) : upstreamCurl ? (
                  <>
                    <p className="pf-muted" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                      <strong>{upstreamCurl.title}</strong> — <code>{upstreamCurl.method} {upstreamCurl.url}</code>
                    </p>
                    <pre className="pf-curl-box">{upstreamCurl.curl}</pre>

                    {upstreamCurl.upload_step ? (
                      <div style={{ marginTop: '1rem' }}>
                        <p className="pf-muted" style={{ margin: '0 0 0.4rem', fontSize: '0.82rem' }}>
                          <em>Bước 1 (chuẩn bị ảnh tham chiếu nếu cần):</em> <code>POST {upstreamCurl.upload_step.url}</code>
                        </p>
                        <pre className="pf-curl-box" style={{ fontSize: '0.75rem' }}>
                          {upstreamCurl.upload_step.curl}
                        </pre>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="pf-muted">Không thể tải thông tin upstream cURL</p>
                )}
              </>
            ) : (
              <>
                <p className="pf-muted" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                  {curlModalShot.tab === 'video' ? (t('studio.storyboard.regenVideo') || 'Tạo lại video') : (t('studio.storyboard.redrawImage') || 'Vẽ lại hình ảnh')} - <code>POST /api/projects/{project.id}/shots/{curlModalShot.shot.id}/{curlModalShot.tab === 'video' ? 'regen-video' : 'regen-image'}</code> · Cảnh {String(curlModalShot.shot.shot_no).padStart(2, '0')}
                </p>
                <p className="pf-muted" style={{ margin: '0 0 0.75rem', fontSize: '0.78rem' }}>
                  API nội bộ này kích hoạt background task trên backend PrintFilm, sau đó hệ thống sẽ chuẩn bị prompt và gửi tiếp sang neuravibemmo.dpdns.org.
                </p>
                <pre className="pf-curl-box">{getShotCurlCommand(curlModalShot.shot, curlModalShot.tab)}</pre>
              </>
            )}
          </div>
        </Modal>
      ) : null}

      {/* Lightbox / Preview ảnh lớn */}
      {previewImg ? (
        <div
          className="pf-lightbox-backdrop"
          onClick={() => setPreviewImg(null)}
          style={{ zIndex: 100000 }}
        >
          <div className="pf-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pf-lightbox-close"
              onClick={() => setPreviewImg(null)}
              aria-label="Đóng"
            >
              <X size={20} strokeWidth={2} />
            </button>
            <img src={previewImg} alt="Preview" className="pf-lightbox-img" />
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
