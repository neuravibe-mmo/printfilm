/** Các bước của thư viện nội dung: Tự động khởi tạo khi không có nội dung lần đầu tiên, Tab phân loại + hàng đợi tạo hình ảnh + liên kết tông màu ký tự */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { Sparkles, ChevronLeft, Loader2, Mic, UploadCloud, Check, Copy, CheckCheck, AlertCircle, Download } from 'lucide-react'
import { getAssetTypeSlug, toVietnameseSlug } from './EpisodeEditCurlModal'
import { dramaApi, resolveDramaAssetPreviewUrl, getDramaApiBase, type DramaAsset, type DramaAssetUsage, type DramaProject } from '../../api/drama'
import { api, type BillingPreflight } from '../../api'
import { useDramaImageGenQueue } from '../../hooks/useDramaImageGenQueue'
import { enqueueDramaImageGen, resumeDramaImageGensFromAssets } from '../../lib/dramaImageGenQueue'
import {
  defaultOptionsForAssetKind,
  type ImageGenerationOptions,
} from '../../lib/dramaGenerationOptions'
import { getImageStyleId } from './dramaWorkspaceUtils'
import { DramaImageGenOptionsBar } from './canvas/nodes/DramaImageGenOptionsBar'
import {
  CharacterVoiceBindModal,
  readAssetVoiceBinding,
  readVoicePrompt,
} from './CharacterVoiceBindModal'
import { CharacterVoicePreviewButton } from '../../components/drama/CharacterVoicePreviewButton'
import { generateAndBindCharacterVoice } from '../../lib/characterVoiceGenerate'
import { NarratorVoiceBindModal } from './NarratorVoiceBindModal'
import { DramaAssetDetailModal } from './DramaAssetDetailModal'
import { DramaImageLightbox } from './DramaImageLightbox'
import { GlobalAssetPickerModal, importGlobalAssetToProject } from './GlobalAssetPickerModal'
import { DramaVoiceAssetCard } from './DramaVoiceAssetCard'
import Pagination from '../../components/ui/Pagination'
import { dialog } from '../../lib/dialog'
import { handleBillingError, isBillingError } from '../../lib/billingError'
import { alertDramaGenError, formatDramaGenError, isUpstreamAccountError } from '../../lib/dramaGenError'
import { pageCountOf } from '../../lib/pagination'
import { readVisualPrompt } from '../../lib/dramaVisualPrompt'
import { filterDramaLibraryAssets } from '../../lib/dramaLibraryAssets'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import {
  dramaAssetHasImage,
  dramaAssetImageGenButtonLabel,
  dramaAssetNeedsImageGeneration,
} from '../../lib/dramaAssetImage'

type AssetTabKey = 'character' | 'scene' | 'prop' | 'voice'


const PAGE_SIZE_DEFAULT = 12
const PAGE_SIZE_OPTIONS = [12, 24, 36] as const

// Kể lại phần chia sẻ trên StrictMode để tránh việc gieo hạt đồng thời các thư viện trống
const seedingProjectIds = new Set<number>()

type AssetsStepProps = {
  projectId: number
  onError: (m: string) => void
  onBack?: () => void
}

// Chuẩn hóa giao diện trả về dưới dạng mảng nội dung để tránh sự cố không xác định.filter
function normalizeAssetList(value: unknown): DramaAsset[] {
  const list = filterDramaLibraryAssets(Array.isArray(value) ? (value as DramaAsset[]) : [])
  return [...list].sort((a, b) => a.id - b.id)
}

// Xác định xem tài sản chưa được xuất bản hay không (không có ảnh bìa/ảnh chính hợp lệ, việc tải lên hoặc tạo AI sẽ được coi là đã xuất bản)
function needsImageGeneration(asset: DramaAsset): boolean {
  return dramaAssetNeedsImageGeneration(asset)
}

// Hiển thị các bước thư viện nội dung
export function AssetsStep({ projectId, onError, onBack }: AssetsStepProps) {
  const { t, locale } = useI18n()
  const ASSET_TABS: Array<{ key: AssetTabKey; label: string }> = [
    { key: 'character', label: t('drama.assetsStep.character') },
    { key: 'scene', label: t('drama.assetsStep.scene') },
    { key: 'prop', label: t('drama.assetsStep.prop') },
    ...(DRAMA_VOICE_BINDING_ENABLED ? [{ key: 'voice' as const, label: t('drama.assetsStep.voice') }] : []),
  ]

  /*
   * tài sản tài sản dự án
   * tab danh mục hiện tại
   * đang tải lần tải đầu tiên
   * batchBusy Một cú nhấp chuột để vào hàng đợi
   * genOptions Tùy chọn tạo hình ảnh
   * voiceAsset Vai trò mở cửa sổ bật lên bằng giọng nói
   * chi tiếtAsset mở nội dung của hộp thao tác chi tiết
   * xem trước phóng to hình ảnh hộp đèn
   * batchVoiceBusy đang tạo âm thanh theo đợt
   * trang số trang hiện tại
   * trangKích thước Số mục trên mỗi trang
   * genQueue hàng đợi tạo biểu đồ toàn cầu
   */
  const [assets, setAssets] = useState<DramaAsset[]>([])
  const [tab, setTab] = useState<AssetTabKey>('character')
  const [loading, setLoading] = useState(true)
  const [batchBusy, setBatchBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [genOptions, setGenOptions] = useState<ImageGenerationOptions>(() =>
    defaultOptionsForAssetKind('character'),
  )
  const [voiceAsset, setVoiceAsset] = useState<DramaAsset | null>(null)
  const [detailAsset, setDetailAsset] = useState<DramaAsset | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [voiceSynthBusyId, setVoiceSynthBusyId] = useState<number | null>(null)
  const [voicePromptDrafts, setVoicePromptDrafts] = useState<Record<number, string>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [project, setProject] = useState<DramaProject | null>(null)
  const [characterVoiceBusyIds, setCharacterVoiceBusyIds] = useState<Set<number>>(() => new Set())
  const [batchVoiceBusy, setBatchVoiceBusy] = useState(false)
  const [narratorVoiceOpen, setNarratorVoiceOpen] = useState(false)
  const genQueue = useDramaImageGenQueue()

  // Google Flow upload states
  const [flowUploading, setFlowUploading] = useState(false)
  const [flowUploadProgress, setFlowUploadProgress] = useState<{ current: number; total: number; assetName: string } | null>(null)
  const [flowUploadingAssetId, setFlowUploadingAssetId] = useState<number | null>(null)
  const [flowUploadErrors, setFlowUploadErrors] = useState<Record<number, string>>({})
  const [copiedAssetId, setCopiedAssetId] = useState<number | null>(null)
  const flowCancelRef = useRef(false)

  // Danh sách các tài sản có hình ảnh để upload
  const uploadableImageAssets = useMemo(() => {
    return assets.filter((a) => (a.cover || a.url) && a.type !== 'voice')
  }, [assets])

  // Số lượng tài sản đã có mã Flow Media ID
  const uploadedFlowCount = useMemo(() => {
    return uploadableImageAssets.filter((a) => Boolean(a.flow_media_id || (a.params as any)?.flow_media_id)).length
  }, [uploadableImageAssets])

  async function handleCopyMediaId(e: React.MouseEvent, assetId: number, mediaId: string) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(mediaId)
      setCopiedAssetId(assetId)
      setTimeout(() => setCopiedAssetId((cur) => (cur === assetId ? null : cur)), 2000)
    } catch {
      // fallback
    }
  }

  async function handleUploadSingleAssetToFlow(asset: DramaAsset) {
    if (!asset.cover && !asset.url) {
      onError('Tài sản chưa có hình ảnh để upload')
      return
    }
    setFlowUploadingAssetId(asset.id)
    setFlowUploadErrors((prev) => {
      const copy = { ...prev }
      delete copy[asset.id]
      return copy
    })
    try {
      const flowPid = project?.flow_project_id || undefined
      const res = await dramaApi.uploadAssetToFlow(asset.id, { flow_project_id: flowPid })
      if (res.ok && res.media_id) {
        setAssets((prev) =>
          (prev ?? []).map((a) =>
            a.id === asset.id
              ? { ...a, flow_media_id: res.media_id, params: { ...(a.params || {}), flow_media_id: res.media_id } }
              : a,
          ),
        )
      }
    } catch (err: any) {
      const msg = err.message || 'Lỗi upload ảnh lên Google Flow'
      onError(msg)
      setFlowUploadErrors((prev) => ({ ...prev, [asset.id]: msg }))
    } finally {
      setFlowUploadingAssetId(null)
    }
  }

  async function handleBatchUploadFlowAssets() {
    if (uploadableImageAssets.length === 0) {
      onError('Chưa có tài sản nào có hình ảnh để upload lên Google Flow')
      return
    }

    const unuploaded = uploadableImageAssets.filter((a) => !a.flow_media_id && !(a.params as any)?.flow_media_id)
    let targets = unuploaded
    if (targets.length === 0) {
      const ok = window.confirm(
        `Tất cả ${uploadableImageAssets.length} tài sản đã có mã Flow Media ID. Bạn có muốn upload và cập nhật lại toàn bộ không?`,
      )
      if (!ok) return
      targets = uploadableImageAssets
    }

    flowCancelRef.current = false
    setFlowUploading(true)

    for (let i = 0; i < targets.length; i++) {
      if (flowCancelRef.current) break
      const asset = targets[i]
      setFlowUploadProgress({
        current: i + 1,
        total: targets.length,
        assetName: asset.name || `Tài sản #${asset.id}`,
      })
      setFlowUploadingAssetId(asset.id)

      try {
        const flowPid = project?.flow_project_id || undefined
        const res = await dramaApi.uploadAssetToFlow(asset.id, { flow_project_id: flowPid })
        if (res.ok && res.media_id) {
          setAssets((prev) =>
            (prev ?? []).map((a) =>
              a.id === asset.id
                ? { ...a, flow_media_id: res.media_id, params: { ...(a.params || {}), flow_media_id: res.media_id } }
                : a,
            ),
          )
        }
      } catch (err: any) {
        const msg = err.message || 'Lỗi upload'
        setFlowUploadErrors((prev) => ({ ...prev, [asset.id]: msg }))
      }
    }

    setFlowUploading(false)
    setFlowUploadingAssetId(null)
    setFlowUploadProgress(null)
  }

  function handleCancelFlowUpload() {
    flowCancelRef.current = true
  }

  // Download assets states
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null)
  const downloadCancelRef = useRef(false)

  function getAssetDownloadFileName(asset: DramaAsset, mimeType?: string): string {
    const typeSlug = getAssetTypeSlug(asset.type)
    const nameSlug = asset.name ? toVietnameseSlug(asset.name) : `Asset${asset.id}`
    let ext = 'jpg'
    if (mimeType) {
      if (mimeType.includes('png')) ext = 'png'
      else if (mimeType.includes('webp')) ext = 'webp'
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg'
    } else {
      const url = asset.cover || asset.url || ''
      if (url.toLowerCase().endsWith('.png')) ext = 'png'
      else if (url.toLowerCase().endsWith('.webp')) ext = 'webp'
    }
    return `${asset.id}_${typeSlug}_${nameSlug}.${ext}`
  }

  async function handleDownloadAssetsToFolder() {
    if (uploadableImageAssets.length === 0) {
      await dialog.alert({
        title: 'Thông báo',
        message: 'Không có tài sản nào có hình ảnh để tải về.',
      })
      return
    }

    const targets = uploadableImageAssets
    const hasDirectoryPicker = typeof (window as any).showDirectoryPicker === 'function'

    let dirHandle: any = null
    if (hasDirectoryPicker) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        })
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Người dùng bấm Cancel / Hủy trong hộp thoại Finder / Explorer
          return
        }
        console.warn('showDirectoryPicker error, will fallback to ZIP:', err)
      }
    }

    // Yêu cầu xác thực quyền ghi ngay khi người dùng vừa chọn thư mục
    if (dirHandle && typeof dirHandle.queryPermission === 'function') {
      try {
        const q = await dirHandle.queryPermission({ mode: 'readwrite' })
        if (q !== 'granted' && typeof dirHandle.requestPermission === 'function') {
          const req = await dirHandle.requestPermission({ mode: 'readwrite' })
          if (req !== 'granted') {
            await dialog.alert({
              title: 'Cần cấp quyền ghi',
              message: 'Trình duyệt cần quyền ghi để lưu ảnh vào thư mục bạn chọn. Vui lòng thử lại và chọn Cho phép (Allow).',
              tone: 'danger',
            })
            return
          }
        }
      } catch (permErr) {
        console.warn('Permission query/request error:', permErr)
      }
    }

    downloadCancelRef.current = false
    setIsDownloading(true)
    let successCount = 0

    try {
      if (dirHandle) {
        for (let i = 0; i < targets.length; i++) {
          if (downloadCancelRef.current) break
          const asset = targets[i]
          let mediaUrl = resolveDramaAssetPreviewUrl(asset)
          if (!mediaUrl) continue

          if (mediaUrl.startsWith('/')) {
            const base = getDramaApiBase() || 'http://localhost:8001'
            mediaUrl = `${base}${mediaUrl}`
          }

          try {
            const resp = await fetch(mediaUrl)
            if (!resp.ok) {
              console.warn(`[Download] Không thể tải ảnh asset ${asset.id}: HTTP ${resp.status}`)
              continue
            }
            const blob = await resp.blob()
            const fileName = getAssetDownloadFileName(asset, blob.type)

            setDownloadProgress({
              current: i + 1,
              total: targets.length,
              fileName,
            })

            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
            const writable = await fileHandle.createWritable()
            await writable.write(blob)
            await writable.close()
            successCount++
            console.log(`[Download] Đã lưu file: ${fileName} (${blob.size} bytes)`)
          } catch (fileErr) {
            console.error(`[Download] Lỗi khi lưu file cho asset #${asset.id} (${asset.name}):`, fileErr)
          }
        }

        if (!downloadCancelRef.current) {
          if (successCount > 0) {
            await dialog.alert({
              title: 'Tải thành công',
              message: `Đã lưu thành công ${successCount}/${targets.length} file tài sản vào thư mục bạn đã chọn trên máy tính.`,
              tone: 'success',
            })
          } else {
            // Nếu không lưu được file nào qua dirHandle (do sandbox/bảo mật hệ điều hành), fallback sang xuất file ZIP
            console.warn('[Download] Không lưu được qua DirectoryHandle, tự động xuất file ZIP...')
            await handleDownloadAsZipFallback(targets)
          }
        }
      } else {
        // Fallback: nếu trình duyệt không hỗ trợ showDirectoryPicker hoặc không chọn được thư mục
        await handleDownloadAsZipFallback(targets)
      }
    } catch (err: any) {
      console.error('[Download error]', err)
      await dialog.alert({
        title: 'Lỗi tải ảnh',
        message: err.message || 'Không thể lưu file vào thư mục đã chọn. Vui lòng thử lại.',
        tone: 'danger',
      })
    } finally {
      setIsDownloading(false)
      setDownloadProgress(null)
    }
  }

  async function handleDownloadAsZipFallback(targets: DramaAsset[]) {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    let zipSuccessCount = 0

    for (let i = 0; i < targets.length; i++) {
      if (downloadCancelRef.current) break
      const asset = targets[i]
      let mediaUrl = resolveDramaAssetPreviewUrl(asset)
      if (!mediaUrl) continue

      if (mediaUrl.startsWith('/')) {
        const base = getDramaApiBase() || 'http://localhost:8001'
        mediaUrl = `${base}${mediaUrl}`
      }

      try {
        const resp = await fetch(mediaUrl)
        if (!resp.ok) continue
        const blob = await resp.blob()
        const fileName = getAssetDownloadFileName(asset, blob.type)

        setDownloadProgress({
          current: i + 1,
          total: targets.length,
          fileName,
        })

        zip.file(fileName, blob)
        zipSuccessCount++
      } catch (fetchErr) {
        console.error(`[Download ZIP] Lỗi tải ảnh asset ${asset.id}:`, fetchErr)
      }
    }

    if (!downloadCancelRef.current && zipSuccessCount > 0) {
      const content = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `${project?.title || 'assets'}_images.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(zipUrl)

      await dialog.alert({
        title: 'Đã xuất file ZIP',
        message: `Đã nén và tải về ${zipSuccessCount} ảnh tài sản dạng file ZIP.`,
        tone: 'success',
      })
    }
  }

  function handleCancelDownload() {
    downloadCancelRef.current = true
  }

  useEffect(() => {
    async function enter() {
      setLoading(true)
      try {
        const p = await dramaApi.getProject(projectId).catch(() => null)
        setProject(p)
        const styleId = p ? getImageStyleId(p.script, p) : ''
        setGenOptions((prev) => ({
          ...defaultOptionsForAssetKind(tab),
          image_style_id: styleId || prev.image_style_id,
          model_id: prev.model_id,
          resolution: prev.resolution,
        }))
        let list = normalizeAssetList(
          await dramaApi.listAssets(projectId, { libraryOnly: true }),
        )
        // Chỉ lần đầu tiên (thư viện nội dung trống và có tóm tắt tập lệnh), nó sẽ tự động được trích xuất từ tập lệnh; sau đó, bạn cần nhấp vào "Trích xuất lại tài sản" theo cách thủ công
        if (list.length === 0 && p?.script?.summary && !seedingProjectIds.has(projectId)) {
          seedingProjectIds.add(projectId)
          try {
            const seededResult = await dramaApi.seedAssets(projectId)
            list = normalizeAssetList(seededResult?.assets)
          } finally {
            seedingProjectIds.delete(projectId)
          }
        }
        setAssets(list)
        resumeDramaImageGensFromAssets(projectId, list, (next) => {
          setAssets((prev) => (prev ?? []).map((a) => (a.id === next.id ? next : a)))
        })
      } catch (err) {
        onError(err instanceof Error ? err.message : t('drama.assetsStep.loadFailed'))
        try {
          const list = normalizeAssetList(await dramaApi.listAssets(projectId, { libraryOnly: true }))
          setAssets(list)
          resumeDramaImageGensFromAssets(projectId, list, (next) => {
          setAssets((prev) => (prev ?? []).map((a) => (a.id === next.id ? next : a)))
        })
        } catch {
          /* ignore */
        }
      } finally {
        setLoading(false)
      }
    }
    void enter()
  }, [projectId, onError])

  useEffect(() => {
    setGenOptions((prev) => ({
      ...defaultOptionsForAssetKind(tab),
      image_style_id: prev.image_style_id,
      model_id: prev.model_id,
      resolution: prev.resolution,
    }))
  }, [tab])

  useEffect(() => {
    setPage(1)
  }, [tab])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  // Ghi lại bìa mới nhất vào thẻ khi xếp hàng xong
  useEffect(() => {
    const projectJobs = genQueue.filter((j) => j.projectId === projectId)
    const doneIds = new Set(
      projectJobs.filter((j) => j.status === 'done' || j.status === 'running').map((j) => j.assetId),
    )
    if (doneIds.size === 0) return
    let cancelled = false
    dramaApi
      .listAssets(projectId, { libraryOnly: true })
      .then((list) => {
        if (cancelled) return
        const next = normalizeAssetList(list)
        setAssets(next)
        setDetailAsset((prev) => (prev ? next.find((a) => a.id === prev.id) || prev : null))
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      cancelled = true
    }
  }, [genQueue, projectId])

  const assetList = assets ?? []
  const filtered = assetList.filter((a) => {
    const t = (a.type || '').toLowerCase()
    if (tab === 'voice') return t === 'voice'
    return t === tab
  })
  const busyAssetIds = new Set(
    genQueue
      .filter(
        (j) =>
          j.projectId === projectId && (j.status === 'queued' || j.status === 'running'),
      )
      .map((j) => j.assetId),
  )
  // Chưa được xuất bản: Không có bìa/url hợp lệ và nó hiện không có trong hàng đợi.
  const pending = filtered.filter((a) => needsImageGeneration(a) && !busyAssetIds.has(a.id))
  // Chưa có giọng đọc: là nhân vật, chưa có voice binding, và hiện không trong quá trình tạo
  const pendingVoiceCharacters = filtered.filter(
    (a) =>
      (a.type || '').toLowerCase() === 'character' &&
      !readAssetVoiceBinding(a) &&
      !characterVoiceBusyIds.has(a.id),
  )
  const queueBusy = busyAssetIds.size > 0
  const pageCount = pageCountOf(filtered.length, pageSize)
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  // Kiểu màn hình dự án liên tục
  async function persistStyle(styleId: string) {
    try {
      await dramaApi.updateScript(projectId, { image_style_id: styleId })
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.saveStyleFailed'))
    }
  }

  // Xác minh số dư trước khi tham gia nhóm (chung cho lô/mặt hàng đơn lẻ); trả lại chi tiết kiểm tra trước (bao gồm cả ước tính đơn lẻ) nếu thành công
  async function ensureImageGenBalance(count: number): Promise<BillingPreflight | null> {
    try {
      return await api.billingPreflight({
        domain: 'drama',
        task_type: 'asset_image',
        count,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err || '')
      if (isBillingError(message)) return null
      if (await handleBillingError(err)) return null
      onError(message || t('drama.assetsStep.balanceCheckFailed'))
      return null
    }
  }

  async function notifyImageGenFailure(err: unknown) {
    const message = err instanceof Error ? err.message : String(err || '')
    if (isBillingError(message)) return
    if (isUpstreamAccountError(message)) {
      await alertDramaGenError(err)
      onError(formatDramaGenError(message).message)
      return
    }
    if (await handleBillingError(err)) return
    const view = formatDramaGenError(message)
    if (view.upstreamAccountBlocked || view.billingBlocked) {
      await alertDramaGenError(err)
    }
    onError(view.message || message || t('drama.assetsStep.genImageFailed'))
  }

  // Tham gia hàng đợi tạo hình ảnh toàn cầu (không đẩy nhau)
  function enqueueOne(asset: DramaAsset, options = genOptions) {
    if (busyAssetIds.has(asset.id)) return
    void (async () => {
      if (dramaAssetHasImage(asset)) {
        const ok = await dialog.confirm({
          title: t('drama.assetsStep.regenConfirmTitle'),
          message: t('drama.assetsStep.regenConfirmMessage').replace(
            '{name}',
            asset.name || t('common.unnamed'),
          ),
          confirmText: t('drama.assets.regenImage'),
          cancelText: t('common.cancel'),
        })
        if (!ok) return
      }
      if (!(await ensureImageGenBalance(1))) return
      try {
        const updated = await enqueueDramaImageGen({
          projectId,
          assetId: asset.id,
          assetName: asset.name || undefined,
          assetType: asset.type,
          prompt: readVisualPrompt(asset),
          options,
          onAssetUpdate: (next) => {
            setAssets((prev) => (prev ?? []).map((a) => (a.id === next.id ? next : a)))
          },
        })
        setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
      } catch (err) {
        await notifyImageGenFailure(err)
      }
    })()
  }

  // Chỉ những nội dung "chưa được xuất bản trong danh mục hiện tại" mới được thêm vào hàng đợi chỉ bằng một cú nhấp chuột (đã có ảnh / bị bỏ qua trong hàng đợi)
  async function batchGenerate() {
    const targets = filtered.filter(
      (a) => needsImageGeneration(a) && !busyAssetIds.has(a.id),
    )
    if (targets.length === 0) {
      if (queueBusy) {
        onError(t('drama.assetsStep.generatingCount').replace('{n}', String(busyAssetIds.size)))
      } else {
        onError(
          tab === 'character'
            ? 'Tất cả nhân vật đã có ảnh đại diện. Những nhân vật đã có ảnh được bỏ qua.'
            : t('drama.assetsStep.noPendingAssets'),
        )
      }
      return
    }

    const pre = await ensureImageGenBalance(targets.length)
    if (!pre) return

    const itemLabel = tab === 'character' ? 'nhân vật' : tab === 'scene' ? 'bối cảnh' : 'đạo cụ'
    const ok = await dialog.confirm({
      title: 'Tự động tạo ảnh',
      message:
        `Hệ thống sẽ tự động tạo ảnh cho ${targets.length} ${itemLabel} chưa có ảnh.\n\n` +
        `Những ${itemLabel} đã có ảnh rồi sẽ được bỏ qua.`,
      confirmText: 'Bắt đầu tạo',
      cancelText: 'Hủy',
      tone: 'success',
    })
    if (!ok) return
    setBatchBusy(true)
    const tasks = targets.map((asset) =>
      enqueueDramaImageGen({
        projectId,
        assetId: asset.id,
        assetName: asset.name || undefined,
        assetType: asset.type,
        prompt: readVisualPrompt(asset),
        options: {
          ...genOptions,
          ...defaultOptionsForAssetKind(asset.type),
          image_style_id: genOptions.image_style_id,
          model_id: genOptions.model_id,
          resolution: genOptions.resolution,
        },
        onAssetUpdate: (next) => {
          setAssets((prev) => (prev ?? []).map((a) => (a.id === next.id ? next : a)))
        },
      }).then((updated) => {
        setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
      }),
    )
    void Promise.allSettled(tasks).then(async (results) => {
      setBatchBusy(false)
      const failed = results.find((r) => r.status === 'rejected')
      if (failed && failed.status === 'rejected') {
        await notifyImageGenFailure(failed.reason)
      }
    })
  }

  // Làm mới các mục danh sách sau khi âm sắc được liên kết thành công.
  function handleVoiceBound(updated: DramaAsset) {
    setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
  }

  function handleVoiceCreated(voice: DramaAsset) {
    setAssets((prev) => {
      const list = prev ?? []
      if (list.some((a) => a.id === voice.id)) return list
      return [...list, voice]
    })
  }

  // AI chỉ bằng một cú nhấp chuột sẽ tạo ra âm thanh và liên kết chúng (mỗi nhân vật bận độc lập và không chặn lẫn nhau)
  async function handleGenerateCharacterVoice(asset: DramaAsset) {
    if (characterVoiceBusyIds.has(asset.id) || batchVoiceBusy) return
    setCharacterVoiceBusyIds((prev) => new Set(prev).add(asset.id))
    try {
      const { character, voice } = await generateAndBindCharacterVoice(projectId, asset)
      handleVoiceBound(character)
      handleVoiceCreated(voice)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.voiceGenFailed'))
    } finally {
      setCharacterVoiceBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(asset.id)
        return next
      })
    }
  }

  // Tự động tạo giọng cho tất cả nhân vật chưa có giọng đọc (bỏ qua những nhân vật đã có)
  async function handleAutoGenerateVoices() {
    const targets = filtered.filter(
      (a) =>
        (a.type || '').toLowerCase() === 'character' &&
        !readAssetVoiceBinding(a) &&
        !characterVoiceBusyIds.has(a.id),
    )

    if (targets.length === 0) {
      if (characterVoiceBusyIds.size > 0 || batchVoiceBusy) {
        onError('Hệ thống đang trong quá trình tạo giọng đọc, vui lòng chờ trong giây lát.')
      } else {
        onError('Tất cả nhân vật đã có giọng đọc. Những nhân vật đã có giọng đọc được bỏ qua.')
      }
      return
    }

    const ok = await dialog.confirm({
      title: 'Tự động tạo giọng đọc',
      message:
        `Hệ thống sẽ tự động tạo giọng cho ${targets.length} nhân vật chưa có giọng đọc.\n\n` +
        `Những nhân vật đã có giọng đọc rồi sẽ được bỏ qua.`,
      confirmText: 'Bắt đầu tạo',
      cancelText: 'Hủy',
      tone: 'success',
    })
    if (!ok) return

    setBatchVoiceBusy(true)
    let failCount = 0
    const CONCURRENCY = 2
    let index = 0

    async function worker() {
      while (index < targets.length) {
        const asset = targets[index++]
        if (!asset) break
        setCharacterVoiceBusyIds((prev) => new Set(prev).add(asset.id))
        try {
          const { character, voice } = await generateAndBindCharacterVoice(projectId, asset)
          handleVoiceBound(character)
          handleVoiceCreated(voice)
        } catch {
          failCount += 1
        } finally {
          setCharacterVoiceBusyIds((prev) => {
            const next = new Set(prev)
            next.delete(asset.id)
            return next
          })
        }
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker())
    await Promise.all(workers)

    setBatchVoiceBusy(false)
    if (failCount > 0) {
      onError(`Có ${failCount} nhân vật tạo giọng thất bại, vui lòng thử lại sau.`)
    }
  }

  // Nhập từ thư viện tài sản toàn cầu vào dự án hiện tại
  async function handleImportFromLibrary(source: DramaAsset) {
    const dup = assetList.some(
      (a) =>
        (a.name || '').trim() === (source.name || '').trim() &&
        (a.type || '') === (source.type || ''),
    )
    if (dup) {
      const ok = await dialog.confirm({
        title: t('drama.assetsStep.maybeDuplicate'),
        message: t('drama.assetsStep.duplicateMessage').replace('{name}', source.name || ''),
        confirmText: t('drama.assetsStep.importAnyway'),
      })
      if (!ok) throw new Error('cancelled')
    }
    const created = await importGlobalAssetToProject(projectId, source)
    setAssets((prev) => [...(prev ?? []), created])
  }

  // Lưu mô tả âm sắc vào thông số nội dung
  async function persistVoicePrompt(asset: DramaAsset, prompt: string) {
    const nextParams = { ...(asset.params || {}), voicePrompt: prompt.trim() }
    const updated = await dramaApi.updateAsset(asset.id, { params: nextParams })
    setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
  }

  // Tổng hợp thử nội dung giọng nói theo lời nhắc
  async function handleSynthVoice(asset: DramaAsset) {
    const prompt = (voicePromptDrafts[asset.id] ?? readVoicePrompt(asset)).trim()
    if (!prompt) {
      onError(t('drama.assetsStep.fillVoiceDesc'))
      return
    }
    setVoiceSynthBusyId(asset.id)
    try {
      await persistVoicePrompt(asset, prompt)
      const result = await dramaApi.generateVoice({
        project_id: projectId,
        asset_id: asset.id,
        voice_prompt: prompt,
      })
      setAssets((prev) => (prev ?? []).map((a) => (a.id === asset.id ? result.asset : a)))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.synthVoiceFailed'))
    } finally {
      setVoiceSynthBusyId(null)
    }
  }

  // Xóa nội dung âm thanh
  async function handleDeleteVoice(asset: DramaAsset) {
    const ok = await dialog.confirm({
      title: t('drama.assetsStep.deleteVoiceTitle'),
      message: t('drama.assetsStep.deleteVoiceMessage').replace('{name}', asset.name || t('common.unnamed')),
      tone: 'danger',
      confirmText: t('common.delete'),
    })
    if (!ok) return
    try {
      await dramaApi.deleteAsset(asset.id)
      setAssets((prev) => (prev ?? []).filter((a) => a.id !== asset.id))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('common.deleteFailed'))
    }
  }

  // Xóa tài sản
  async function handleDeleteAsset(asset: DramaAsset) {
    if (busyAssetIds.has(asset.id)) {
      onError(t('drama.assetsStep.charGenerating'))
      return
    }

    const kind = (asset.type || '').toLowerCase()
    const isChar = kind === 'character' || kind === '角色'
    const isScene = kind === 'scene' || kind === '场景'
    const kindLabel = isChar
      ? (locale === 'zh' ? '角色' : locale === 'en' ? 'character' : 'nhân vật')
      : isScene
        ? (locale === 'zh' ? '场景' : locale === 'en' ? 'scene' : 'cảnh quay')
        : (locale === 'zh' ? '道具' : locale === 'en' ? 'prop' : 'đạo cụ')

    // Kiểm tra tài sản có đang được liên kết với phân cảnh nào không
    let usage: DramaAssetUsage | null = null
    try {
      usage = await dramaApi.getAssetUsage(asset.id)
    } catch {
      /* ignore usage query error */
    }

    const isLinked = Boolean(usage && usage.linked_fragment_count > 0)
    let title: string
    let message: string
    let confirmText = t('common.delete')

    if (isLinked && usage) {
      const fragPrefix = locale === 'zh' ? '片段' : locale === 'en' ? 'Scene' : 'Phân cảnh'
      const details = usage.episodes
        .map((ep) => {
          const fragList = (ep.fragment_orders || []).length > 0
            ? ep.fragment_orders!.map((num) => `${fragPrefix} ${String(num).padStart(2, '0')}`).join(', ')
            : ep.fragments && ep.fragments.length > 0
              ? ep.fragments.join(', ')
              : `${ep.fragment_count} ${fragPrefix.toLowerCase()}`
          return `• ${ep.label}: ${fragList}`
        })
        .join('\n')

      title = t('drama.assetsStep.deleteAssetInUseTitle', { kind: kindLabel })
      message = t('drama.assetsStep.deleteAssetInUseMessage', {
        name: asset.name || t('common.unnamed'),
        details,
        kind: kindLabel,
      })
      confirmText = t('drama.assetsStep.deleteAssetInUseConfirm')
    } else {
      title = isChar
        ? t('drama.assetsStep.deleteCharTitle')
        : isScene
          ? t('drama.assetsStep.deleteSceneTitle')
          : t('drama.assets.deleteAsset')
      message = isChar
        ? t('drama.assetsStep.deleteCharMessage', { name: asset.name || t('common.unnamed') })
        : isScene
          ? t('drama.assetsStep.deleteSceneMessage', { name: asset.name || t('common.unnamed') })
          : t('drama.assets.deleteConfirm')
    }

    const ok = await dialog.confirm({
      title,
      message,
      tone: 'danger',
      confirmText,
      cancelText: t('common.cancel'),
    })
    if (!ok) return

    try {
      await dramaApi.deleteAsset(asset.id)
      setAssets((prev) => (prev ?? []).filter((a) => a.id !== asset.id))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('common.deleteFailed'))
    }
  }

  // Sao chép nút thẻ ("Tạo lại hình ảnh" sẽ được hiển thị khi có hình ảnh)
  function genButtonLabel(asset: DramaAsset): string {
    const job = genQueue.find(
      (j) =>
        j.assetId === asset.id && (j.status === 'queued' || j.status === 'running'),
    )
    let queueLabel: string | null = null
    if (job) {
      if (job.status === 'running') queueLabel = t('drama.assetsStep.generating')
      else {
        const queuedOnly = genQueue.filter((j) => j.status === 'queued' || j.status === 'running')
        const pos = queuedOnly.findIndex((j) => j.id === job.id) + 1
        queueLabel = pos > 0 ? (pos > 1 ? t('drama.assetsStep.queuePos').replace('{pos}', String(pos)) : t('drama.assetsStep.queuing')) : t('drama.assetsStep.queuing')
      }
    }
    return dramaAssetImageGenButtonLabel(asset, queueLabel, t)
  }

  return (
    <div className="drama-assets-step">
      <header className="drama-assets-hero">
        <div className="drama-step-hero-main drama-assets-hero-main">
          <div className="drama-assets-hero-header-wrap">
            <div className="drama-assets-hero-title-row">
              {onBack && (
                <button
                  type="button"
                  className="drama-workspace-back-btn"
                  onClick={onBack}
                  title={t('common.back')}
                  aria-label={t('common.back')}
                >
                  <ChevronLeft size={18} strokeWidth={2.2} />
                </button>
              )}
              <h2>{t('drama.assetsStep.title')}</h2>
            </div>
            <p
              className={`drama-step-hero-sub${onBack ? ' has-back' : ''}`}
              dangerouslySetInnerHTML={{
                __html: t('drama.assetsStep.headerInfo')
                  .replace('{all}', String(assetList.length))
                  .replace('{n}', String(filtered.length))
                  .replace('{pending}', String(pending.length)),
              }}
            />
          </div>
        </div>
      </header>

      <div className="drama-assets-tips" role="note">
        <Sparkles size={15} strokeWidth={1.75} aria-hidden />
        <span>{t('drama.assetsStep.hint')}</span>
      </div>

      <div className="drama-assets-toolbar">
        <div className="drama-asset-tabs">
          {ASSET_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="drama-actions">
          {/* Nút Download tuần tự từng tài sản về máy tính */}
          {isDownloading ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: '0.82rem',
                color: '#334155',
              }}
            >
              <Loader2 size={15} className="pf-spin" />
              <span>
                Đang tải {downloadProgress?.current}/{downloadProgress?.total}
                {downloadProgress?.fileName ? ` (${downloadProgress.fileName})` : ''}...
              </span>
              <button
                type="button"
                onClick={handleCancelDownload}
                style={{
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                Dừng
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pf-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#ffffff',
                borderColor: '#cbd5e1',
                color: '#1e293b',
                fontWeight: 500,
              }}
              disabled={flowUploading || isDownloading || uploadableImageAssets.length === 0}
              onClick={() => void handleDownloadAssetsToFolder()}
              title={`Mở Finder / File Explorer để chọn thư mục lưu và tải toàn bộ ${uploadableImageAssets.length} file tài sản theo cú pháp <ID>_<LoaiAsset>_<TenVietLienKhongDau>.<ext>`}
            >
              <Download size={16} />
              <span>Download ({uploadableImageAssets.length})</span>
            </button>
          )}

          {flowUploading ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#e0f2fe',
                border: '1px solid #7dd3fc',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: '0.82rem',
                color: '#0369a1',
              }}
            >
              <Loader2 size={15} className="pf-spin" />
              <span>
                Đang upload {flowUploadProgress?.current}/{flowUploadProgress?.total}
                {flowUploadProgress?.assetName ? ` (${flowUploadProgress.assetName})` : ''}...
              </span>
              <button
                type="button"
                onClick={handleCancelFlowUpload}
                style={{
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                Dừng
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pf-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#0284c7',
                borderColor: '#0369a1',
                color: '#ffffff',
                fontWeight: 500,
              }}
              disabled={batchBusy || batchVoiceBusy || uploadableImageAssets.length === 0}
              onClick={() => void handleBatchUploadFlowAssets()}
              title={`Upload tuần tự từng hình ảnh trong danh sách tài sản lên Flow API (${uploadedFlowCount}/${uploadableImageAssets.length} đã có Media ID)`}
            >
              <UploadCloud size={16} />
              <span>
                Upload lên Flow ({uploadedFlowCount}/{uploadableImageAssets.length})
              </span>
            </button>
          )}
        </div>
      </div>

      {tab !== 'voice' ? (
        <div className="drama-assets-gen-opts">
          <DramaImageGenOptionsBar
            value={genOptions}
            onChange={setGenOptions}
            disabled={batchBusy}
            onStylePersist={persistStyle}
          />
        </div>
      ) : null}

      {loading ? <p className="drama-muted">{t('drama.assetsStep.extracting')}</p> : null}

      {!loading && filtered.length > 0 ? (
        <div className="drama-assets-meta-bar">
          <p className="drama-muted drama-assets-page-meta">
            {t('drama.assetsStep.pageInfo').replace('{page}', String(safePage)).replace('{total_pages}', String(pageCount)).replace('{n}', String(filtered.length))}
          </p>

          <div className="drama-assets-meta-actions">
            {DRAMA_VOICE_BINDING_ENABLED && tab === 'character' ? (
              <button
                type="button"
                className="pf-btn drama-assets-auto-voice-btn"
                disabled={batchVoiceBusy || (pendingVoiceCharacters.length === 0 && characterVoiceBusyIds.size === 0)}
                onClick={() => void handleAutoGenerateVoices()}
                title={
                  pendingVoiceCharacters.length > 0
                    ? `Tự động tạo giọng cho ${pendingVoiceCharacters.length} nhân vật chưa có giọng đọc`
                    : characterVoiceBusyIds.size > 0
                    ? 'Đang trong quá trình tạo giọng...'
                    : 'Tất cả nhân vật đã có giọng đọc'
                }
              >
                {batchVoiceBusy || characterVoiceBusyIds.size > 0 ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'pf-spin 1s linear infinite' }} />
                    <span>Đang tạo giọng ({characterVoiceBusyIds.size})...</span>
                  </>
                ) : (
                  <>
                    <Mic size={15} />
                    <span>Tự động tạo giọng</span>
                  </>
                )}
              </button>
            ) : null}

            {tab !== 'voice' ? (
              <button
                type="button"
                className="pf-btn pf-btn-lime drama-assets-auto-gen-btn"
                disabled={batchBusy || (pending.length === 0 && !queueBusy)}
                onClick={() => void batchGenerate()}
                title={
                  pending.length > 0
                    ? `Tự động tạo ảnh cho ${pending.length} ${tab === 'character' ? 'nhân vật' : 'tài sản'} chưa có ảnh`
                    : queueBusy
                    ? 'Đang trong quá trình tạo ảnh...'
                    : 'Tất cả nhân vật đã có ảnh'
                }
              >
                {batchBusy || queueBusy ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'pf-spin 1s linear infinite' }} />
                    <span>Đang tạo ảnh ({busyAssetIds.size})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Tự động tạo ảnh</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={`drama-asset-grid${tab === 'voice' ? ' is-voice' : ''}`}>
        {pageItems.map((asset) => {
          if (tab === 'voice') {
            const promptValue = voicePromptDrafts[asset.id] ?? readVoicePrompt(asset)
            const synthBusy = voiceSynthBusyId === asset.id
            return (
              <DramaVoiceAssetCard
                key={asset.id}
                asset={asset}
                promptValue={promptValue}
                synthBusy={synthBusy}
                onPromptChange={(value) =>
                  setVoicePromptDrafts((prev) => ({
                    ...prev,
                    [asset.id]: value,
                  }))
                }
                onPromptBlur={() => {
                  const draft = (voicePromptDrafts[asset.id] ?? '').trim()
                  if (draft && draft !== readVoicePrompt(asset)) {
                    void persistVoicePrompt(asset, draft).catch((err) =>
                      onError(err instanceof Error ? err.message : t('common.saveFailed')),
                    )
                  }
                }}
                onSynth={() => void handleSynthVoice(asset)}
                onDelete={() => void handleDeleteVoice(asset)}
                onError={onError}
              />
            )
          }

          const mediaSrc = resolveDramaAssetPreviewUrl(asset)
          const voice = readAssetVoiceBinding(asset)
          const isCharacter = (asset.type || '').toLowerCase() === 'character'
          const busy = busyAssetIds.has(asset.id)
          return (
            <article
              key={asset.id}
              className="drama-asset-card drama-asset-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => setDetailAsset(asset)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDetailAsset(asset)
                }
              }}
            >
              {mediaSrc ? (
                <button
                  type="button"
                  className="drama-asset-thumb-btn"
                  title={t('common.enlarge')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightbox({ src: mediaSrc, alt: asset.name || t('common.preview') })
                  }}
                >
                  <img key={mediaSrc} src={mediaSrc} alt={asset.name || ''} />
                </button>
              ) : (
                <div className="drama-asset-placeholder">{asset.type || 'asset'}</div>
              )}
              <h3>{asset.name || t('common.unnamed')}</h3>
              <p className="drama-asset-card-type">
                {asset.type}
                {isCharacter && voice ? ` · ${voice.label}` : ''}
              </p>

              {/* Hiển thị trạng thái Flow & Media ID */}
              <div
                className="drama-asset-flow-panel"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                style={{ margin: '4px 0 6px 0', minHeight: 24 }}
              >
                {flowUploadingAssetId === asset.id ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: '0.73rem',
                      color: '#0284c7',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: 4,
                      padding: '3px 6px',
                    }}
                  >
                    <Loader2 size={12} className="pf-spin" />
                    <span>Đang upload Flow...</span>
                  </div>
                ) : (asset.flow_media_id || (asset.params as any)?.flow_media_id) ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 4,
                      fontSize: '0.73rem',
                      color: '#15803d',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}
                    title={`Google Flow Media ID: ${asset.flow_media_id || (asset.params as any)?.flow_media_id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                      <Check size={12} color="#16a34a" />
                      <span style={{ fontWeight: 600 }}>Flow ID:</span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          maxWidth: 82,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {asset.flow_media_id || (asset.params as any)?.flow_media_id}
                      </span>
                    </div>
                    <button
                      type="button"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '1px 2px',
                        cursor: 'pointer',
                        color: copiedAssetId === asset.id ? '#15803d' : '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Sao chép Media ID"
                      onClick={(e) => void handleCopyMediaId(e, asset.id, String(asset.flow_media_id || (asset.params as any)?.flow_media_id))}
                    >
                      {copiedAssetId === asset.id ? <CheckCheck size={12} /> : <Copy size={11} />}
                    </button>
                  </div>
                ) : flowUploadErrors[asset.id] ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.72rem',
                      color: '#b91c1c',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}
                    title={flowUploadErrors[asset.id]}
                  >
                    <AlertCircle size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Lỗi upload
                    </span>
                  </div>
                ) : null}
              </div>

              {DRAMA_VOICE_BINDING_ENABLED && isCharacter ? (
                <div
                  className="drama-asset-card-voice"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {voice ? (
                    <CharacterVoicePreviewButton
                      url={voice.url}
                      label={voice.label}
                      onError={onError}
                    />
                  ) : (
                    <button
                      type="button"
                      className="pf-btn pf-btn-sm pf-btn-ghost drama-asset-card-btn-voice"
                      disabled={
                        batchBusy ||
                        batchVoiceBusy ||
                        characterVoiceBusyIds.has(asset.id)
                      }
                      onClick={() => void handleGenerateCharacterVoice(asset)}
                    >
                      {characterVoiceBusyIds.has(asset.id)
                        ? t('drama.assetsStep.generating')
                        : `🎙️ ${t('drama.assetsStep.genVoice')}`}
                    </button>
                  )}
                </div>
              ) : null}

              <div
                className="drama-asset-card-actions"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="pf-btn pf-btn-sm drama-asset-card-btn-gen"
                  disabled={busy || batchBusy}
                  onClick={() => enqueueOne(asset)}
                >
                  {genButtonLabel(asset)}
                </button>
                {mediaSrc ? (
                  <button
                    type="button"
                    className="pf-btn pf-btn-sm"
                    style={{
                      padding: '0 8px',
                      height: 28,
                      fontSize: '0.75rem',
                      background: (asset.flow_media_id || (asset.params as any)?.flow_media_id) ? '#f0fdf4' : '#f8fafc',
                      borderColor: (asset.flow_media_id || (asset.params as any)?.flow_media_id) ? '#86efac' : '#cbd5e1',
                      color: (asset.flow_media_id || (asset.params as any)?.flow_media_id) ? '#166534' : '#475569',
                    }}
                    disabled={busy || batchBusy || flowUploading || flowUploadingAssetId === asset.id}
                    onClick={() => void handleUploadSingleAssetToFlow(asset)}
                    title={
                      (asset.flow_media_id || (asset.params as any)?.flow_media_id)
                        ? 'Upload lại ảnh này lên Google Flow'
                        : 'Upload ảnh này lên Google Flow'
                    }
                  >
                    {flowUploadingAssetId === asset.id ? (
                      <Loader2 size={12} className="pf-spin" />
                    ) : (
                      <UploadCloud size={12} />
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="pf-btn pf-btn-sm drama-btn-danger-text drama-asset-card-btn-delete"
                  disabled={busy || batchBusy || batchVoiceBusy || flowUploadingAssetId === asset.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleDeleteAsset(asset)
                  }}
                  title={t('common.delete')}
                >
                  {t('common.delete')}
                </button>
              </div>
            </article>
          )
        })}
      </div>
      {!loading && filtered.length === 0 ? <p className="drama-muted">{t('drama.assetsStep.noAssets')}</p> : null}

      {!loading && filtered.length > 0 ? (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
          onChange={setPage}
          ariaLabel={t('drama.assetsStep.paginationLabel')}
          className="drama-assets-pagination"
        />
      ) : null}

      {detailAsset && (detailAsset.type || '').toLowerCase() !== 'voice' ? (
        <DramaAssetDetailModal
          asset={detailAsset}
          open
          busy={busyAssetIds.has(detailAsset.id)}
          genLabel={genButtonLabel(detailAsset)}
          onClose={() => setDetailAsset(null)}
          onUpdated={(updated) => {
            setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
            setDetailAsset(updated)
          }}
          onGenerate={(a) => enqueueOne(a)}
          onBindVoice={DRAMA_VOICE_BINDING_ENABLED ? (a) => setVoiceAsset(a) : undefined}
          onDelete={(a) => {
            setDetailAsset(null)
            void handleDeleteAsset(a)
          }}
          onError={onError}
        />
      ) : null}

      {lightbox ? (
        <DramaImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      ) : null}

      {DRAMA_VOICE_BINDING_ENABLED && voiceAsset ? (
        <CharacterVoiceBindModal
          asset={voiceAsset}
          projectId={projectId}
          open
          onClose={() => setVoiceAsset(null)}
          onBound={(updated) => {
            handleVoiceBound(updated)
            setDetailAsset((prev) => (prev?.id === updated.id ? updated : prev))
          }}
          onError={onError}
        />
      ) : null}

      {DRAMA_VOICE_BINDING_ENABLED && project ? (
        <NarratorVoiceBindModal
          project={project}
          open={narratorVoiceOpen}
          onClose={() => setNarratorVoiceOpen(false)}
          onUpdated={(p) => setProject(p)}
          onError={onError}
        />
      ) : null}

      <GlobalAssetPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        projectId={projectId}
        defaultTab={tab === 'voice' ? 'voice' : tab}
        title={t('drama.assetsStep.importFromLib')}
        confirmLabel={t('drama.assetsStep.importToProject')}
        onPick={handleImportFromLibrary}
      />
    </div>
  )
}
