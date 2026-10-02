/** Tạo nội dung truyện tranh: thăm dò ý kiến ngay sau khi gửi và sử dụng URL mới để phản hồi trong thời gian thực sau khi thành công (không phải xếp hàng để gửi) */
import { dramaApi, type DramaAsset } from '../api/drama'
import type { ImageGenerationOptions } from './dramaGenerationOptions'
import { syncImageJobToUnified } from './dramaGenQueue'

export type DramaImageGenStatus = 'queued' | 'running' | 'done' | 'failed'

export type DramaImageGenJob = {
  id: string
  projectId: number
  assetId: number
  assetName: string
  assetType: string
  prompt: string
  options: Partial<ImageGenerationOptions>
  status: DramaImageGenStatus
  error?: string
  createdAt: number
  finishedAt?: number
}

type EnqueueInput = {
  projectId: number
  assetId: number
  assetName?: string
  assetType?: string
  prompt: string
  options?: Partial<ImageGenerationOptions>
  /** Chỉ tiếp tục bỏ phiếu (phần phụ trợ đã được tạo, POST sẽ không được lặp lại) */
  resumeOnly?: boolean
  /** Ghi lại nội dung khi xếp hàng/thay đổi trạng thái (được sử dụng để tạo hiển thị thời gian thực trên giao diện người dùng/hình ảnh mới) */
  onAssetUpdate?: (asset: DramaAsset) => void
}

type InternalJob = DramaImageGenJob & {
  resumeOnly: boolean
  taskId?: number
  baselineUrl: string
  onAssetUpdate?: (asset: DramaAsset) => void
  resolve: (asset: DramaAsset) => void
  reject: (err: Error) => void
}

/* Việc bỏ phiếu có thể được thực hiện song song trên nhiều kênh; bài gửi không còn bị giới hạn và xếp hàng đợi, chỉ cần nhấp và ĐĂNG */
const MAX_POLL_CONCURRENT = 12
const DONE_RETENTION_MS = 45_000
const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 10 * 60 * 1000

/** Tiếp xúc với thế giới bên ngoài (để viết quảng cáo) */
export const DRAMA_IMAGE_GEN_MAX_CONCURRENT = MAX_POLL_CONCURRENT

/*
 * hàng đợi công việc cục bộ (UI + bỏ phiếu)
 * cachedSnapshot useSyncExternalStore snapshot
 * người nghe đăng ký
 * pollingCount Số lượng waitForAssetImage
 * bơm Bơm thăm dò ý kiến đã được lên lịch chưa?
 */
let jobs: InternalJob[] = []
const EMPTY_SNAPSHOT: DramaImageGenJob[] = []
let cachedSnapshot: DramaImageGenJob[] = EMPTY_SNAPSHOT
const listeners = new Set<() => void>()
let pollingCount = 0
let pumping = false

// Chuyển đổi công việc nội bộ sang cấu trúc bên ngoài
function toPublicJob(job: InternalJob): DramaImageGenJob {
  return {
    id: job.id,
    projectId: job.projectId,
    assetId: job.assetId,
    assetName: job.assetName,
    assetType: job.assetType,
    prompt: job.prompt,
    options: job.options,
    status: job.status,
    error: job.error,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
  }
}

// Nội dung của hai ảnh chụp nhanh có nhất quán không?
function snapshotsEqual(a: DramaImageGenJob[], b: DramaImageGenJob[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i]
    const right = b[i]
    if (
      left.id !== right.id ||
      left.status !== right.status ||
      left.error !== right.error ||
      left.finishedAt !== right.finishedAt
    ) {
      return false
    }
  }
  return true
}

// Dọn dẹp các mục đã hoàn thành hết hạn
function pruneFinished() {
  const now = Date.now()
  jobs = jobs.filter((job) => {
    if (job.status === 'queued' || job.status === 'running') return true
    if (!job.finishedAt) return true
    return now - job.finishedAt < DONE_RETENTION_MS
  })
}

// Xây dựng lại và lưu vào bộ nhớ đệm các ảnh chụp nhanh bên ngoài
function refreshSnapshot() {
  pruneFinished()
  const next = jobs.length === 0 ? EMPTY_SNAPSHOT : jobs.map((job) => toPublicJob(job))
  if (!snapshotsEqual(cachedSnapshot, next)) {
    cachedSnapshot = next
  }
}

// Thông báo cho thuê bao và đồng bộ vào hàng đợi thế hệ thống nhất
function emit() {
  refreshSnapshot()
  listeners.forEach((listener) => listener())
  for (const job of jobs) {
    if (job.status === 'queued' || job.status === 'running' || job.finishedAt) {
      syncImageJobToUnified({
        assetId: job.assetId,
        projectId: job.projectId,
        assetName: job.assetName,
        assetType: job.assetType,
        status: job.status,
        taskId: job.taskId,
        error: job.error,
      })
    }
  }
}

// Đọc ảnh chụp nhanh hàng đợi
export function getDramaImageGenQueue(): DramaImageGenJob[] {
  refreshSnapshot()
  return cachedSnapshot
}

// Tài sản có bận không?
export function isDramaAssetImageBusy(assetId: number): boolean {
  return jobs.some(
    (job) =>
      job.assetId === assetId && (job.status === 'queued' || job.status === 'running'),
  )
}

// Hàng đợi hiện tại + số đang được xử lý
export function getDramaImageGenActiveCount(): number {
  return jobs.filter((job) => job.status === 'queued' || job.status === 'running').length
}

// Đăng ký thay đổi hàng đợi
export function subscribeDramaImageGenQueue(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Tạo id tác vụ cục bộ
function makeJobId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Đọc trạng thái tạo tài sản
function readGenerationStatus(asset: DramaAsset): string {
  const gen = (asset.params || {}).generation as { status?: string } | undefined
  return String(gen?.status || '')
}

// URL xem trước hiện tại của nội dung
function assetMediaUrl(asset: DramaAsset): string {
  return String(asset.url || asset.cover || '').trim()
}

/**
 * Bỏ phiếu cho đến khi thực sự kết thúc lần sinh nở này.
 * Khi có hình ảnh cũ, bạn phải xem các thay đổi được xếp hàng/tạo hoặc URL so với đường cơ sở, để tránh khôi phục hình ảnh cũ ngay lập tức khi thành công.
 * Trước tiên phải xác định thất bại/bị hủy: khi thử lại không thành công, url/bìa cũ vẫn còn đó và không thể coi là thành công.
 */
async function waitForAssetImage(
  projectId: number,
  assetId: number,
  baselineUrl: string,
  onRemoteStatus?: (status: string) => void,
  onAssetUpdate?: (asset: DramaAsset) => void,
): Promise<DramaAsset> {
  const started = Date.now()
  let sawInFlight = false
  let lastNotifiedUrl = baselineUrl

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const list = await dramaApi.listAssets(projectId)
    const latest = list.find((a) => a.id === assetId)
    if (!latest) throw new Error('资产不存在')

    const status = readGenerationStatus(latest)
    const currentUrl = assetMediaUrl(latest)
    onRemoteStatus?.(status)

    if (status === 'queued' || status === 'generating') {
      sawInFlight = true
      if (currentUrl !== lastNotifiedUrl) {
        lastNotifiedUrl = currentUrl
        onAssetUpdate?.(latest)
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      continue
    }

    if (status === 'failed' || status === 'cancelled') {
      const gen = (latest.params || {}).generation as { error?: string } | undefined
      const raw = String(gen?.error || '').trim()
      throw new Error(raw || (status === 'cancelled' ? '生图已取消' : '生图失败'))
    }

    const urlChanged = Boolean(currentUrl) && currentUrl !== baselineUrl
    const finishedFresh =
      status === 'done' &&
      Boolean(currentUrl) &&
      (sawInFlight || urlChanged || !baselineUrl)

    if (finishedFresh) {
      onAssetUpdate?.(latest)
      return latest
    }

    // Vẫn là ảnh cũ và chưa đưa lên máy bay: tiếp tục chờ (trạng thái có thể không hiển thị sau POST)
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
  throw new Error('生图超时，请刷新后重试')
}

const waitingPoll: InternalJob[] = []

// Kết quả phụ trợ bỏ phiếu đồng thời có giới hạn
async function pollJob(job: InternalJob) {
  pollingCount += 1
  try {
    const asset = await waitForAssetImage(
      job.projectId,
      job.assetId,
      job.baselineUrl,
      (remoteStatus) => {
        if (remoteStatus === 'generating' && job.status !== 'running') {
          job.status = 'running'
          emit()
        }
        if (remoteStatus === 'queued' && job.status === 'running') {
          job.status = 'queued'
          emit()
        }
      },
      job.onAssetUpdate,
    )
    job.status = 'done'
    job.finishedAt = Date.now()
    emit()
    job.resolve(asset)
  } catch (err) {
    const message = err instanceof Error ? err.message : '生图失败'
    job.status = 'failed'
    job.error = message
    job.finishedAt = Date.now()
    emit()
    job.reject(err instanceof Error ? err : new Error(message))
  } finally {
    pollingCount -= 1
    pumpPoll()
    emit()
  }
}

// Lên lịch bỏ phiếu
function pumpPoll() {
  if (pumping) return
  pumping = true
  queueMicrotask(() => {
    pumping = false
    while (pollingCount < MAX_POLL_CONCURRENT && waitingPoll.length > 0) {
      const next = waitingPoll.shift()
      if (!next) break
      if (next.status === 'failed' || next.status === 'done') continue
      void pollJob(next)
    }
    emit()
  })
}

// POST ngay lập tức để tham gia hàng đợi (không có giới hạn hiện tại), sau đó tham gia bỏ phiếu
async function submitJob(job: InternalJob) {
  try {
    if (!job.resumeOnly) {
      const resp = await dramaApi.generateImage({
        project_id: job.projectId,
        asset_id: job.assetId,
        prompt: job.prompt,
        name: job.assetName || undefined,
        asset_type_kind: job.assetType,
        image_style_id: job.options.image_style_id,
        model_id: job.options.model_id,
        aspect_ratio: job.options.aspect_ratio,
        resolution: job.options.resolution,
      })
      job.taskId = resp.task_id != null ? Number(resp.task_id) : undefined
      const queuedAsset = (resp as { asset?: DramaAsset }).asset
      if (queuedAsset) {
        job.onAssetUpdate?.(queuedAsset)
      }
    }
    if (job.status === 'queued') {
      job.status = 'running'
    }
    waitingPoll.push(job)
    pumpPoll()
  } catch (err) {
    const message = err instanceof Error ? err.message : '生图失败'
    job.status = 'failed'
    job.error = message
    job.finishedAt = Date.now()
    emit()
    job.reject(err instanceof Error ? err : new Error(message))
  } finally {
    emit()
  }
}

/**
 * Thêm biểu đồ nội dung vào hàng đợi: POST vào phần phụ trợ ngay lập tức, sau đó thăm dò kết quả cục bộ.
 * Sử dụng lại cùng một Lời hứa khi cùng một nội dung đã được xếp hàng/được tạo (để tránh bị ngược dòng nhiều lần).
 */
export function enqueueDramaImageGen(input: EnqueueInput): Promise<DramaAsset> {
  const existing = jobs.find(
    (job) =>
      job.assetId === input.assetId &&
      (job.status === 'queued' || job.status === 'running'),
  )
  if (existing) {
    if (input.onAssetUpdate) {
      const prev = existing.onAssetUpdate
      existing.onAssetUpdate = (asset) => {
        prev?.(asset)
        input.onAssetUpdate?.(asset)
      }
    }
    return new Promise((resolve, reject) => {
      const prevResolve = existing.resolve
      const prevReject = existing.reject
      existing.resolve = (asset) => {
        prevResolve(asset)
        resolve(asset)
      }
      existing.reject = (err) => {
        prevReject(err)
        reject(err)
      }
    })
  }

  return new Promise<DramaAsset>((resolve, reject) => {
    const job: InternalJob = {
      id: makeJobId(),
      projectId: input.projectId,
      assetId: input.assetId,
      assetName: (input.assetName || '').trim() || `资产 ${input.assetId}`,
      assetType: input.assetType || 'character',
      prompt: input.prompt,
      options: input.options || {},
      status: 'queued',
      createdAt: Date.now(),
      resumeOnly: Boolean(input.resumeOnly),
      baselineUrl: '',
      onAssetUpdate: input.onAssetUpdate,
      resolve,
      reject,
    }
    jobs = [...jobs, job]
    emit()
    // Trước tiên hãy lấy ảnh hiện tại làm đường cơ sở, sau đó gửi/bỏ phiếu để ngăn ảnh cũ được coi là thành công.
    void (async () => {
      try {
        const list = await dramaApi.listAssets(input.projectId)
        const current = list.find((a) => a.id === input.assetId)
        job.baselineUrl = current ? assetMediaUrl(current) : ''
      } catch {
        job.baselineUrl = ''
      }
      if (job.resumeOnly) {
        waitingPoll.push(job)
        pumpPoll()
        return
      }
      void submitJob(job)
    })()
  })
}

/**
 * Tiếp tục tác vụ "phụ trợ vẫn đang tạo" từ danh sách tài sản (được gọi sau khi làm mới trang).
 * Không còn lặp lại POST nữa, chỉ kết nối giao diện người dùng bỏ phiếu và xếp hàng.
 */
export function resumeDramaImageGensFromAssets(
  projectId: number,
  assets: DramaAsset[],
  onAssetUpdate?: (asset: DramaAsset) => void,
): void {
  for (const asset of assets) {
    if (asset.project_id !== projectId) continue
    /* Nội dung video sẽ được đưa vào hàng đợi Seedance để tránh việc vô tình ĐĂNG hình ảnh sau khi làm mới. */
    if ((asset.type || '').toLowerCase() === 'video') continue
    const status = readGenerationStatus(asset)
    if (status !== 'generating' && status !== 'queued') continue
    if (isDramaAssetImageBusy(asset.id)) continue
    void enqueueDramaImageGen({
      projectId,
      assetId: asset.id,
      assetName: asset.name || undefined,
      assetType: asset.type,
      prompt: '',
      resumeOnly: true,
      onAssetUpdate,
    }).catch(() => {
      /* Bảng điều khiển sẽ hiển thị lỗi; lớp trang có thể được nướng lại */
    })
  }
}

// Xóa các mục đã hoàn thành
export function clearFinishedDramaImageGenJobs() {
  jobs = jobs.filter((job) => job.status === 'queued' || job.status === 'running')
  emit()
}
