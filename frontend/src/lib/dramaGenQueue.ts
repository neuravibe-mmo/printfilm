/** Hàng đợi tạo loạt truyện tranh toàn cầu: hiển thị và phục hồi thống nhất hình ảnh/video và các tác vụ khác */
import { getActiveLocale } from '../i18n/detect'
import { messages } from '../i18n/messages'

function tQ(key: string): string {
  const locale = getActiveLocale()
  const m = messages[locale] as unknown as { drama?: { genQueue?: Record<string, string> } }
  return m?.drama?.genQueue?.[key] ?? key
}
import { useSyncExternalStore } from 'react'
import type { DramaTaskBrief } from '../api/drama'

export type DramaGenJobKind = 'image' | 'video'

export type DramaGenJobStatus = 'queued' | 'running' | 'done' | 'failed'

export type DramaGenJob = {
  id: string
  kind: DramaGenJobKind
  projectId: number
  /** Id nội dung hoặc id bảng phân cảnh */
  targetId: number
  episodeId?: number
  /** Nền tảng tác vụ hợp nhất task_runs.id, dùng để mở chi tiết */
  taskId?: number
  title: string
  /** Viết quảng cáo loại phụ: video nhân vật/cảnh/cảnh, v.v. */
  subtype: string
  status: DramaGenJobStatus
  message?: string
  error?: string
  createdAt: number
  finishedAt?: number
}

type Listener = () => void

const DONE_RETENTION_MS = 10 * 60 * 1000
const EMPTY: DramaGenJob[] = []

/*
 * danh sách công việc thống nhất
 * cachedSnapshot Ảnh chụp nhanh bên ngoài
 * người nghe đăng ký
 */
let jobs: DramaGenJob[] = []
let cachedSnapshot: DramaGenJob[] = EMPTY
const listeners = new Set<Listener>()
// Sau khi người dùng xóa nó theo cách thủ công, nó sẽ không còn được thăm dò/trạng thái sẽ được đồng bộ hóa và ghi lại vào hàng đợi.
const dismissedJobIds = new Set<string>()

// Hủy dấu "đã xóa" khi gia nhập lại đội
function undismissJob(jobId: string): void {
  dismissedJobIds.delete(jobId)
}

// Có bỏ qua việc ghi lại các mục đã hoàn thành hay không (không được người dùng theo dõi hoặc xóa)
function shouldSkipFinishedResync(
  jobId: string,
  rawStatus: string,
  existing: DramaGenJob | undefined,
  hasActiveTask: boolean,
): boolean {
  if (dismissedJobIds.has(jobId) && !['queued', 'running', 'generating'].includes(rawStatus)) {
    return true
  }
  if (existing || hasActiveTask) return false
  return ['done', 'failed', 'cancelled', 'idle'].includes(rawStatus)
}

// Ảnh chụp nhanh có tương đương không?
function snapshotsEqual(a: DramaGenJob[], b: DramaGenJob[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i]
    const y = b[i]
    if (
      x.id !== y.id ||
      x.status !== y.status ||
      x.message !== y.message ||
      x.error !== y.error ||
      x.finishedAt !== y.finishedAt ||
      x.title !== y.title ||
      x.taskId !== y.taskId
    ) {
      return false
    }
  }
  return true
}

// Dọn dẹp các mục đã hoàn thành/không đạt đã hết hạn (chưa bao giờ được xóa)
function pruneFinished() {
  const now = Date.now()
  jobs = jobs.filter((job) => {
    if (job.status === 'queued' || job.status === 'running') return true
    if (!job.finishedAt) return true
    return now - job.finishedAt < DONE_RETENTION_MS
  })
}

// Làm mới ảnh chụp nhanh và thông báo
function emit() {
  pruneFinished()
  const next = jobs.length === 0 ? EMPTY : [...jobs]
  if (snapshotsEqual(cachedSnapshot, next)) return
  cachedSnapshot = next
  listeners.forEach((fn) => fn())
}

// Đọc ảnh chụp nhanh
export function getDramaGenQueue(): DramaGenJob[] {
  pruneFinished()
  if (jobs.length === 0) {
    cachedSnapshot = EMPTY
    return EMPTY
  }
  if (!snapshotsEqual(cachedSnapshot, jobs)) {
    cachedSnapshot = [...jobs]
  }
  return cachedSnapshot
}

// Đăng ký
export function subscribeDramaGenQueue(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Hook
export function useDramaGenQueue(): DramaGenJob[] {
  return useSyncExternalStore(subscribeDramaGenQueue, getDramaGenQueue, getDramaGenQueue)
}

// Số lượng tác vụ đang hoạt động (chỉ số dưới)
export function getDramaGenActiveCount(): number {
  return jobs.filter((j) => j.status === 'queued' || j.status === 'running').length
}

// Các trường hiển thị của hai tác vụ có giống nhau không?
function jobDisplayEqual(a: DramaGenJob, b: DramaGenJob): boolean {
  return (
    a.id === b.id &&
    a.kind === b.kind &&
    a.projectId === b.projectId &&
    a.targetId === b.targetId &&
    a.episodeId === b.episodeId &&
    a.title === b.title &&
    a.subtype === b.subtype &&
    a.status === b.status &&
    a.message === b.message &&
    a.error === b.error &&
    a.finishedAt === b.finishedAt &&
    a.taskId === b.taskId
  )
}

// Viết hoặc cập nhật một tác vụ; khi im lặng, chỉ có bộ nhớ bị thay đổi và người gọi sẽ phát ra nó một cách đồng đều
export function upsertDramaGenJob(
  patch: Omit<DramaGenJob, 'createdAt' | 'finishedAt'> & {
    createdAt?: number
    finishedAt?: number
  },
  options?: { silent?: boolean },
): void {
  if (dismissedJobIds.has(patch.id)) {
    if (patch.status === 'queued' || patch.status === 'running') {
      undismissJob(patch.id)
    } else {
      return
    }
  }
  const idx = jobs.findIndex((j) => j.id === patch.id)
  const prev = idx >= 0 ? jobs[idx] : null
  const status = patch.status
  const finishedAt =
    status === 'done' || status === 'failed'
      ? patch.finishedAt ?? prev?.finishedAt ?? Date.now()
      : undefined
  const next: DramaGenJob = {
    id: patch.id,
    kind: patch.kind,
    projectId: patch.projectId,
    targetId: patch.targetId,
    episodeId: patch.episodeId,
    taskId: patch.taskId ?? prev?.taskId,
    title: patch.title,
    subtype: patch.subtype,
    status,
    message: patch.message,
    error: patch.error,
    createdAt: patch.createdAt ?? prev?.createdAt ?? Date.now(),
    finishedAt,
  }
  if (prev && jobDisplayEqual(prev, next)) return
  if (idx >= 0) {
    jobs = jobs.map((j, i) => (i === idx ? next : j))
  } else {
    jobs = [...jobs, next]
  }
  if (!options?.silent) emit()
}

// Id tác vụ hình ảnh
export function imageJobId(assetId: number): string {
  return `image:${assetId}`
}

// Id tác vụ bảng phân cảnh video
export function videoJobId(fragmentId: number): string {
  return `video:${fragmentId}`
}

// Đồng bộ hóa các tác vụ tạo hình ảnh nội dung với hàng đợi thống nhất (gọi lại bởi dramaImageGenQueue)
export function syncImageJobToUnified(input: {
  assetId: number
  projectId: number
  assetName: string
  assetType: string
  status: DramaGenJobStatus
  taskId?: number
  error?: string
}): void {
  upsertDramaGenJob({
    id: imageJobId(input.assetId),
    kind: 'image',
    projectId: input.projectId,
    targetId: input.assetId,
    title: input.assetName || `${tQ('assetPrefix')} ${input.assetId}`,
    subtype: input.assetType || 'image',
    status: input.status,
    taskId: input.taskId,
    error: input.error,
    message:
      input.status === 'running'
        ? tQ('genImage')
        : input.status === 'queued'
          ? tQ('queued')
          : undefined,
  })
}

// ID tác vụ nội dung video canvas (khác với video bảng phân cảnh:{fragmentId})
export function assetVideoJobId(assetId: number): string {
  return `video-asset:${assetId}`
}

// Đồng bộ hóa nội dung canvas để tạo video vào hàng đợi hợp nhất
export function syncAssetVideoJobToUnified(input: {
  assetId: number
  projectId: number
  assetName: string
  status: DramaGenJobStatus
  error?: string
}): void {
  upsertDramaGenJob({
    id: assetVideoJobId(input.assetId),
    kind: 'video',
    projectId: input.projectId,
    targetId: input.assetId,
    title: input.assetName || `${tQ('videoPrefix')} ${input.assetId}`,
    subtype: tQ('canvasVideo'),
    status: input.status,
    error: input.error,
    message:
      input.status === 'running'
        ? tQ('genVideo')
        : input.status === 'queued'
          ? tQ('queued')
          : undefined,
  })
}

type FragmentStatusItem = {
  fragment_id: number
  status: string
  message?: string
  phase?: string
  error?: string
  video?: string
  cover?: string
}

// Phân tích số thứ tự hiển thị dựa trên danh sách bảng phân cảnh; trả về null khi không thể xác định một cách đáng tin cậy để tránh bỏ phiếu và đổi tiêu đề thành "Clip 01"
function resolveFragmentLabel(
  fragId: number,
  fragments: Array<{ id: number; sort_order?: number }>,
): string | null {
  const frag = fragments.find((f) => f.id === fragId)
  if (frag && typeof frag.sort_order === 'number' && frag.sort_order >= 0) {
    return `${tQ('fragment')} ${String(frag.sort_order + 1).padStart(2, '0')}`
  }
  // Chỉ cho phép đăng ký khi đã có thứ tự sắp xếp đáng tin cậy trong danh sách (danh sách được sắp xếp đầy đủ)
  const hasAnySortOrder = fragments.some((f) => typeof f.sort_order === 'number' && f.sort_order >= 0)
  if (!hasAnySortOrder) return null
  const idx = fragments.findIndex((f) => f.id === fragId)
  if (idx < 0) return null
  return `${tQ('fragment')} ${String(idx + 1).padStart(2, '0')}`
}

// Tiêu đề hàng đợi hội: ghi/sửa khi có sẵn chuỗi nhân bản đáng tin cậy; mặt khác giữ lại tiêu đề hiện có
function resolveVideoJobTitle(
  existing: DramaGenJob | undefined,
  episodeName: string | undefined,
  fragmentLabel: string | null,
): string {
  if (fragmentLabel) {
    const prefix = (episodeName || '').trim()
    if (prefix) return `${prefix} · ${fragmentLabel}`
    if (existing?.title) {
      const sep = existing.title.indexOf(' · ')
      if (sep >= 0) return `${existing.title.slice(0, sep)} · ${fragmentLabel}`
    }
    return fragmentLabel
  }
  if (existing?.title) return existing.title
  const prefix = (episodeName || '').trim()
  return prefix ? `${prefix} · ${tQ('storyboardVideo')}` : tQ('storyboardVideo')
}

type FragmentTaskItem = DramaTaskBrief

export type EpisodeGenerateStatusPayload = {
  episode_id: number
  done: number
  failed: number
  running: number
  total: number
  tasks: DramaTaskBrief[]
  fragments: FragmentStatusItem[]
}
export function syncEpisodeVideoJobs(input: {
  projectId: number
  episodeId: number
  episodeName?: string
  fragments: Array<{ id: number; sort_order?: number; content?: string }>
  statusItems: FragmentStatusItem[]
  taskItems?: FragmentTaskItem[]
}): void {
  const fragLabel = (fragId: number) => resolveFragmentLabel(fragId, input.fragments)

  const activeTaskByFragmentId = new Map<number, FragmentTaskItem>()
  // Mỗi cảnh sẽ nhận tác vụ nền tảng mới nhất (bao gồm cả lỗi) để liên kết hàng đợi taskId/sao chép lỗi
  const latestTaskByFragmentId = new Map<number, FragmentTaskItem>()
  for (const task of input.taskItems || []) {
    if (task.task_type !== 'fragment_video') continue
    if (typeof task.fragment_id !== 'number') continue
    const prev = latestTaskByFragmentId.get(task.fragment_id)
    if (!prev || (task.id || 0) > (prev.id || 0)) {
      latestTaskByFragmentId.set(task.fragment_id, task)
    }
    if (task.cancel_requested) continue
    if (!['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review'].includes(task.status))
      continue
    activeTaskByFragmentId.set(task.fragment_id, task)
  }

  for (const item of input.statusItems) {
    const raw = String(item.status || 'idle')
    const jobId = videoJobId(item.fragment_id)
    const existing = jobs.find((j) => j.id === jobId)
    const activeTask = activeTaskByFragmentId.get(item.fragment_id)
    const latestTask = latestTaskByFragmentId.get(item.fragment_id)
    const boundTaskId = activeTask?.id ?? latestTask?.id ?? existing?.taskId
    if (shouldSkipFinishedResync(jobId, raw, existing, Boolean(activeTask))) {
      continue
    }
    // không hoạt động: Máy chủ không có nhiệm vụ nào. Nếu việc tham gia tích cực bị gián đoạn, hãy xóa nó khỏi "Đang tạo"
    if (raw === 'idle') {
      if (activeTask) {
        upsertDramaGenJob(
          {
            id: videoJobId(item.fragment_id),
            kind: 'video',
            projectId: input.projectId,
            targetId: item.fragment_id,
            episodeId: input.episodeId,
            taskId: activeTask.id,
            title: resolveVideoJobTitle(existing, input.episodeName, fragLabel(item.fragment_id)),
            subtype: tQ('storyboardVideo'),
            status: activeTask.status === 'pending' || activeTask.status === 'leased' ? 'queued' : 'running',
            message:
              activeTask.current_step_key === 'assets'
                ? tQ('genRef')
                : activeTask.status === 'pending' || activeTask.status === 'leased'
                  ? tQ('queued')
                  : tQ('generating'),
          },
          { silent: true },
        )
        continue
      }
      if (existing && (existing.status === 'queued' || existing.status === 'running')) {
        upsertDramaGenJob(
          {
            id: existing.id,
            kind: existing.kind,
            projectId: existing.projectId,
            targetId: existing.targetId,
            episodeId: existing.episodeId,
            taskId: boundTaskId,
            title: existing.title,
            subtype: existing.subtype,
            status: 'failed',
            error: latestTask?.error_message || tQ('interrupted'),
          },
          { silent: true },
        )
      }
      continue
    }
    let status: DramaGenJobStatus = 'running'
    if (raw === 'done') status = 'done'
    else if (raw === 'failed' || raw === 'cancelled') status = 'failed'
    else if (activeTask) {
      // Khi tác vụ đã được gửi lên thượng nguồn, giá trị xếp hàng đợi bị trì hoãn của các thông số trong bảng phân cảnh sẽ không được áp dụng.
      status =
        activeTask.status === 'pending' || activeTask.status === 'leased' ? 'queued' : 'running'
    } else if (raw === 'queued') status = 'queued'
    else status = 'running'

    const errText =
      item.error ||
      (raw === 'cancelled' || status === 'failed'
        ? latestTask?.error_message || undefined
        : undefined) ||
      (raw === 'cancelled' ? tQ('cancelled') : undefined)

    const messageFromTask =
      activeTask && status === 'running'
        ? activeTask.current_step_key === 'assets'
          ? tQ('genRef')
          : item.message || (item.phase === 'assets' ? tQ('genRef') : tQ('generating'))
        : item.message || (item.phase === 'assets' ? tQ('genRef') : undefined)

    upsertDramaGenJob(
      {
        id: videoJobId(item.fragment_id),
        kind: 'video',
        projectId: input.projectId,
        targetId: item.fragment_id,
        episodeId: input.episodeId,
        taskId: boundTaskId,
        title: resolveVideoJobTitle(existing, input.episodeName, fragLabel(item.fragment_id)),
        subtype: tQ('storyboardVideo'),
        status,
        message: status === 'queued' ? item.message || tQ('queued') : messageFromTask,
        error: errText,
      },
      { silent: true },
    )
  }
  emit()
  ensureEpisodeVideoStatusPoll()
}

// Ghi vào hàng ngay khi vào hàng (hiển thị lạc quan, không phụ thuộc vào vòng bỏ phiếu đầu tiên)
export function enqueueEpisodeVideoJobs(input: {
  projectId: number
  episodeId: number
  episodeName?: string
  fragments: Array<{ id: number; sort_order?: number }>
  fragmentIds: number[]
}): void {
  for (const fid of input.fragmentIds) {
    undismissJob(videoJobId(fid))
  }
  const idSet = new Set(input.fragmentIds)
  const items = input.fragments
    .filter((f) => idSet.has(f.id))
    .map((f) => ({
      fragment_id: f.id,
      status: 'queued',
      message: tQ('enqueued'),
    }))
  syncEpisodeVideoJobs({
    projectId: input.projectId,
    episodeId: input.episodeId,
    episodeName: input.episodeName,
    fragments: input.fragments,
    statusItems: items,
  })
  requestOpenDramaGenQueue()
  ensureEpisodeVideoStatusPoll()
}

/** Khoảng thời gian bỏ phiếu tạo_status đa dạng (duy nhất trên toàn cầu, để tránh các yêu cầu lặp lại đối với trang chỉnh sửa) */
export const GENERATE_STATUS_POLL_MS = 8000

type GenerateStatusSubscriber = (episodeId: number, status: EpisodeGenerateStatusPayload) => void

/*
 * videoPollTimer vẫn thăm dò generate_status sau khi rời khỏi trang tập
 * videoPollInFlight tránh các yêu cầu chồng chéo
 * generateStatusSubscribers Chỉnh sửa trang và giao diện người dùng đồng bộ hóa người đăng ký khác
 */
let videoPollTimer = 0
let videoPollInFlight = false
const generateStatusSubscribers = new Set<GenerateStatusSubscriber>()

// Đăng ký theo dõi kết quả thăm dò tập generate_status (chia sẻ yêu cầu tương tự với EnsureEpisodeVideoStatusPoll)
export function subscribeEpisodeGenerateStatus(listener: GenerateStatusSubscriber): () => void {
  generateStatusSubscribers.add(listener)
  return () => generateStatusSubscribers.delete(listener)
}

// Thăm dò ý kiến của video kịch bản phân cảnh đang diễn ra ở chế độ nền (không chặn trang chỉnh sửa)
export function ensureEpisodeVideoStatusPoll(): void {
  if (typeof window === 'undefined') return
  if (videoPollTimer) return
  videoPollTimer = window.setInterval(() => {
    void pollActiveEpisodeVideoJobs()
  }, GENERATE_STATUS_POLL_MS)
  void pollActiveEpisodeVideoJobs()
}

// Kéo trạng thái theo tập và ghi lại vào hàng đợi
async function pollActiveEpisodeVideoJobs(): Promise<void> {
  if (videoPollInFlight) return
  const active = jobs.filter(
    (job) =>
      job.kind === 'video' &&
      job.subtype === tQ('storyboardVideo') &&
      (job.status === 'queued' || job.status === 'running') &&
      typeof job.episodeId === 'number',
  )
  if (active.length === 0) {
    if (videoPollTimer) {
      window.clearInterval(videoPollTimer)
      videoPollTimer = 0
    }
    return
  }
  videoPollInFlight = true
  try {
    const { dramaApi } = await import('../api/drama')
    const episodeIds = [...new Set(active.map((job) => job.episodeId as number))]
    await Promise.all(
      episodeIds.map(async (episodeId) => {
        const epJobs = active.filter((job) => job.episodeId === episodeId)
        const st = await dramaApi.generateStatus(episodeId)
        // Các cảnh của tập này đã có trong hàng đợi (bao gồm cả những tập đã hoàn thành) được sử dụng để giữ nguyên trình tự của các cảnh và tránh bỏ phiếu và chỉ đưa tập hợp con đang diễn ra.
        const tracked = jobs.filter(
          (job) =>
            job.kind === 'video' &&
            job.subtype === tQ('storyboardVideo') &&
            job.episodeId === episodeId,
        )
        const trackedIds = new Set(tracked.map((job) => job.targetId))
        const named = tracked.find((job) => job.title.includes(' · '))
        const episodeName = named?.title.split(' · ')[0]
        syncEpisodeVideoJobs({
          projectId: epJobs[0].projectId,
          episodeId,
          episodeName,
          // Đừng vượt qua thứ tự sắp xếp: bỏ phiếu không thể biết được trình tự các cảnh quay một cách đáng tin cậy, tránh trường hợp tiêu đề bị coi là "Clip 01"
          fragments: tracked.map((job) => ({ id: job.targetId })),
          // Chỉ đồng bộ hóa các gương đã được xếp hàng cho tập này để tránh việc tạo_status toàn bộ tập khỏi việc đưa các gương không liên quan vào hàng đợi và đổi tên chúng.
          statusItems: st.fragments.filter((row) => trackedIds.has(row.fragment_id)),
          taskItems: st.tasks,
        })
        generateStatusSubscribers.forEach((fn) => {
          try {
            fn(episodeId, st)
          } catch {
            /* Ngoại lệ của người đăng ký không ảnh hưởng đến việc bỏ phiếu */
          }
        })
      }),
    )
  } catch {
    /* Bỏ phiếu không thành công và thử lại ở vòng tiếp theo */
  } finally {
    videoPollInFlight = false
  }
}

// Yêu cầu mở bảng xếp hàng ở góc dưới bên phải
let openRequestSeq = 0
const openListeners = new Set<() => void>()

export function requestOpenDramaGenQueue(): void {
  openRequestSeq += 1
  openListeners.forEach((fn) => fn())
}

export function subscribeDramaGenQueueOpen(listener: () => void): () => void {
  openListeners.add(listener)
  return () => openListeners.delete(listener)
}

export function getDramaGenQueueOpenRequestSeq(): number {
  return openRequestSeq
}

// Quá trình thanh toán đã kết thúc (hoàn thành + thất bại) và ghi nhớ id để ngăn việc bỏ phiếu viết lại
export function clearFinishedDramaGenJobs(): void {
  for (const job of jobs) {
    if (job.status === 'done' || job.status === 'failed') {
      dismissedJobIds.add(job.id)
    }
  }
  jobs = jobs.filter((j) => j.status === 'queued' || j.status === 'running')
  emit()
}

// Đánh dấu các tác vụ video đang diễn ra/xếp hàng đợi là đã hủy (đồng bộ hóa hàng đợi cục bộ)
export function markVideoJobsCancelled(fragmentIds?: number[]): void {
  const idSet = fragmentIds ? new Set(fragmentIds.map((id) => videoJobId(id))) : null
  jobs = jobs.map((job) => {
    if (job.kind !== 'video') return job
    if (idSet && !idSet.has(job.id)) return job
    if (job.status !== 'queued' && job.status !== 'running') return job
    return {
      ...job,
      status: 'failed' as const,
      error: tQ('cancelled'),
      finishedAt: Date.now(),
    }
  })
  emit()
}
