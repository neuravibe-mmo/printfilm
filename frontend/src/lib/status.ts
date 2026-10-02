import { getActiveLocale } from '../i18n/detect'
import { messages } from '../i18n/messages'

export const RUNNING = new Set([
  'SCRIPTING',
  'IMAGING',
  'VIDEOING',
  'AUDIOING',
  'COMPOSING',
  'AUDITING',
  'PARALLEL_ASSETS',
])

// Lấy bản sao trạng thái theo ngôn ngữ giao diện hiện tại (tương thích với cách viết STATUS_CN[code] cũ)
export const STATUS_CN: Record<string, string> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      const map = messages[getActiveLocale()].status as Record<string, string>
      return map[prop] || prop
    },
  },
)

export function isRunning(status: string) {
  return RUNNING.has(status)
}

export function hasActiveTasks(project: {
  active_tasks?: Array<{ status: string; cancel_requested?: boolean | null }> | null
}) {
  const activeStatuses = ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review']
  return Boolean(
    project.active_tasks?.some(
      (task) => !task.cancel_requested && activeStatuses.includes(task.status),
    ),
  )
}

/**
 * Prefer stage inferred from shot assets when status is still SCRIPTING
 * (e.g. continue-generate briefly labeled wrong, or worker lag).
 */
export function effectiveStatus(project: {
  status: string
  pipeline_mode?: string | null
  shots?: Array<{ image_url?: string | null; audio_url?: string | null; video_url?: string | null }>
}): string {
  const status = project.status
  const shots = project.shots || []
  if (status !== 'SCRIPTING' || shots.length === 0) return status

  const full = project.pipeline_mode !== 'image_text'
  const imgs = shots.filter((s) => s.image_url).length
  const auds = shots.filter((s) => s.audio_url).length
  const vids = shots.filter((s) => s.video_url).length
  const n = shots.length
  // Việc lồng tiếng toàn bộ Pipeline được thực hiện bằng mô hình video, không cần TTS audio_url
  const assetsOk = full ? imgs === n : imgs === n && auds === n

  if (assetsOk) {
    if (full && vids < n) return 'VIDEOING'
    if (full && vids === n) return 'COMPOSING'
    if (!full) return 'COMPOSING'
  }
  if (imgs > 0 || auds > 0) return 'IMAGING'
  return status
}

export function statusLabel(projectOrStatus: string | Parameters<typeof effectiveStatus>[0]) {
  const status = typeof projectOrStatus === 'string' ? projectOrStatus : effectiveStatus(projectOrStatus)
  return STATUS_CN[status] || status
}

export function statusTone(status: string): 'ok' | 'bad' | 'run' | 'idle' {
  if (status === 'DONE') return 'ok'
  if (status === 'FAILED' || status === 'REJECTED' || status === 'CANCELLED') return 'bad'
  if (isRunning(status)) return 'run'
  return 'idle'
}

/** Per-shot statuses from pipeline */
export const SHOT_STATUS_CN: Record<string, string> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      const map = messages[getActiveLocale()].shotStatus as Record<string, string>
      return map[prop] || STATUS_CN[prop] || prop
    },
  },
)

// Tương thích với các cuộc gọi cũ: dịch trực tiếp shot.status
export function shotStatusLabel(status: string) {
  return SHOT_STATUS_CN[status] || STATUS_CN[status] || status
}

// Phán quyết "bắn trạng thái cuối cùng" cũ; vui lòng sử dụng shotDisplayDone cho bảng phân cảnh
export function shotIsDone(status: string) {
  return ['AUDIO_READY', 'VIDEO_READY', 'DONE', 'IMAGE_READY'].includes(status)
}

/** Storyboard được hiển thị theo độ đầy đủ của tư liệu, đừng mù quáng tin vào shot.status (AUDIO_READY chỉ thể hiện lồng tiếng) */
export type ShotDisplayKind =
  | 'failed'
  | 'generating'
  | 'wait_image'
  | 'wait_video'
  | 'image_ready'
  | 'video_ready'

export type ShotAssetLike = {
  status?: string | null
  image_url?: string | null
  video_url?: string | null
}

/*
 * SHOT_TASK_ACTIVE Trung tâm tác vụ đang trong trạng thái tiến hành
 * PROJECT_WIDE_TASKS chiếm toàn bộ chip, cần tránh việc tạo ra ống kính đơn
 */
const SHOT_TASK_ACTIVE = [
  'pending',
  'leased',
  'running',
  'awaiting_poll',
  'awaiting_review',
  'cancel_requested',
]
const PROJECT_WIDE_TASKS = new Set([
  'project_pipeline',
  'project_compose_only',
  'project_regen_audio',
  'shot_regen_audio',
])

/** Suy ra trạng thái hiển thị của ống kính đơn dựa trên việc hình ảnh/video có nhất quán hay không */
export function shotDisplayKind(
  shot: ShotAssetLike,
  opts?: { pipelineMode?: string | null; generating?: boolean },
): ShotDisplayKind {
  if (opts?.generating) return 'generating'
  if (shot.status === 'FAILED') return 'failed'
  if (!shot.image_url) return 'wait_image'
  const full = opts?.pipelineMode !== 'image_text'
  if (full && !shot.video_url) return 'wait_video'
  if (full) return 'video_ready'
  return 'image_ready'
}

/** Chất liệu gương đã sẵn sàng chưa? (Xem hình ảnh tĩnh, xem video toàn bộ quá trình) */
export function shotDisplayDone(kind: ShotDisplayKind) {
  return kind === 'image_ready' || kind === 'video_ready'
}

/** Bản sao tài liệu cho bảng phân cảnh/CSV */
export function shotDisplayLabel(kind: ShotDisplayKind) {
  const key = {
    failed: 'FAILED',
    generating: 'GENERATING',
    wait_image: 'WAIT_IMAGE',
    wait_video: 'WAIT_VIDEO',
    image_ready: 'IMAGE_READY',
    video_ready: 'VIDEO_READY',
  }[kind]
  return SHOT_STATUS_CN[key] || key
}

type TaskLike = {
  status: string
  task_type?: string | null
  shot_id?: number | null
  cancel_requested?: boolean | null
}

/** Toàn bộ dây chuyền lắp ráp/tổng hợp/lồng tiếng toàn bộ phim đang được tiến hành */
export function isProjectWideBusy(project: {
  status?: string
  active_tasks?: TaskLike[] | null
}) {
  const tasks = project.active_tasks
  if (Array.isArray(tasks)) {
    return tasks.some(
      (task) =>
        SHOT_TASK_ACTIVE.includes(task.status) && PROJECT_WIDE_TASKS.has(task.task_type || ''),
    )
  }
  return isRunning(project.status || '')
}

/** Chiếc gương này có nhiệm vụ gương đơn đang diễn ra không? */
export function isShotGenerating(
  project: { active_tasks?: TaskLike[] | null } | null | undefined,
  shotId: number,
) {
  return Boolean(
    project?.active_tasks?.some(
      (task) => task.shot_id === shotId && SHOT_TASK_ACTIVE.includes(task.status),
    ),
  )
}

export function formatMmSs(seconds: number) {
  const s = Math.max(0, Math.round(seconds || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

/** Các bước để có được liên kết đầy đủ về phổ biến khoa học: chia sẻ dự án/phong cách/bảng phân cảnh */
export const KEPU_STEPS = [
  { key: 'topic', label: '选题' },
  { key: 'style', label: '风格' },
  { key: 'confirm', label: '确认分镜' },
  { key: 'assets', label: '画面与配音' },
  { key: 'videos', label: '镜头视频' },
  { key: 'compose', label: '合成预览' },
]

export function getKepuStepsLocalized() {
  const m = messages[getActiveLocale()] as unknown as { studio?: { steps?: Record<string, string> } }
  const steps = m.studio?.steps
  return [
    { key: 'topic', label: steps?.topic || '选题' },
    { key: 'style', label: steps?.style || '风格' },
    { key: 'confirm', label: steps?.confirm || '确认分镜' },
    { key: 'assets', label: steps?.assets || '画面与配音' },
    { key: 'videos', label: steps?.videos || '镜头视频' },
    { key: 'compose', label: steps?.compose || '合成预览' },
  ]
}

export const CREATE_STEPS = KEPU_STEPS
export const BOARD_STEPS = KEPU_STEPS

/** Bỏ qua bước "video ống kính" khi chuyển ảnh tĩnh thành phim */
export function kepuSteps(pipelineMode?: string | null) {
  const steps = getKepuStepsLocalized()
  if (pipelineMode === 'image_text') {
    return steps.filter((s) => s.key !== 'videos')
  }
  return steps
}

export type KepuWizardPage = 'create' | 'style' | 'board'

export type KepuBillingPhase = 'script' | 'assets' | 'videos' | 'compose'

/** Căn chỉnh với phần phụ trợ Resolve_kepu_billing_phase (giao diện người dùng không phát hiện các tệp gần như im lặng). */
export function kepuBillingPhase(project: {
  pipeline_mode?: string | null
  shots?: Array<{ image_url?: string | null; audio_url?: string | null; video_url?: string | null }>
}): KepuBillingPhase {
  const shots = project.shots || []
  if (!shots.length) return 'script'
  const full = project.pipeline_mode !== 'image_text'
  const needImages = shots.some((s) => !s.image_url)
  const needAudio = !full && shots.some((s) => !s.audio_url)
  if (needImages || needAudio) return 'assets'
  if (full && shots.some((s) => !s.video_url)) return 'videos'
  return 'compose'
}

export function shotsByNo<T extends { shot_no: number }>(shots: T[] | null | undefined): T[] {
  return [...(shots || [])].sort((a, b) => a.shot_no - b.shot_no)
}

/**
 * Chỉ số bước hiện tại; bảng phân cảnh được căn chỉnh theo kịch bản/nội dung/video/sáng tác.
 */
export function kepuStepIndex(
  page: KepuWizardPage,
  project?: {
    status: string
    pipeline_mode?: string | null
    final_video_url?: string | null
    shots?: Array<{ image_url?: string | null; audio_url?: string | null; video_url?: string | null }>
  } | null,
): number {
  const steps = kepuSteps(project?.pipeline_mode)
  const idx = (key: string) => {
    const n = steps.findIndex((s) => s.key === key)
    return n >= 0 ? n : 0
  }
  if (page === 'create') return idx('topic')
  if (page === 'style') return idx('style')
  if (!project) return idx('confirm')
  const status = effectiveStatus(project)
  const shots = project.shots || []
  if (isRunning(status)) {
    if (status === 'VIDEOING') return idx('videos')
    if (['IMAGING', 'AUDIOING', 'PARALLEL_ASSETS'].includes(status)) return idx('assets')
    if (['COMPOSING', 'AUDITING'].includes(status)) return idx('compose')
  }
  if (project.final_video_url && status === 'DONE') return idx('compose')
  const phase = kepuBillingPhase(project)
  if (phase === 'compose') return idx('compose')
  if (phase === 'videos') return idx('videos')
  if (phase === 'assets') return idx('assets')
  if (status === 'DRAFT' && shots.length === 0) return idx('style')
  return idx('confirm')
}

/** Bên cạnh nút chính của bảng phân cảnh: Việc cần làm trong bước này và có nên giữ lại hay không */
export function kepuPhaseHint(project: {
  status: string
  pipeline_mode?: string | null
  shots?: Array<{ image_url?: string | null; audio_url?: string | null; video_url?: string | null }>
}): string {
  const locale = getActiveLocale()
  const m = messages[locale] as unknown as { studio?: { board?: Record<string, string> } }
  const board = m.studio?.board
  if (isRunning(effectiveStatus(project))) {
    return board?.inProgress || '生成进行中，可在右侧查看各阶段进度。'
  }
  const phase = kepuBillingPhase(project)
  if (phase === 'script') return board?.hintScript || '先在风格页点「生成故事板」，本步只拆分镜脚本（预扣文字模型）。'
  if (phase === 'assets') return board?.hintAssets || '确认旁白与画面后开始生成：按镜头依次出图（后镜参考上一镜）+ 整片配音。'
  if (phase === 'videos') return board?.hintVideos || '画面与配音已齐。下一步按镜头依次出视频，后镜参考上一镜尾帧。'
  return board?.hintCompose || '素材已齐。拼接成片走后期合成（叠旁白字幕与配乐，扣费很少）。'
}
