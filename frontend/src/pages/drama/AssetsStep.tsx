/** Các bước của thư viện nội dung: Tự động khởi tạo khi không có nội dung lần đầu tiên, Tab phân loại + hàng đợi tạo hình ảnh + liên kết tông màu ký tự */
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { Sparkles, ChevronLeft, Loader2, Mic, UploadCloud } from 'lucide-react'
import { dramaApi, type DramaAsset, type DramaAssetUsage, type DramaProject } from '../../api/drama'
import { api, type BillingPreflight } from '../../api'
import { useDramaImageGenQueue } from '../../hooks/useDramaImageGenQueue'
import { enqueueDramaImageGen, resumeDramaImageGensFromAssets } from '../../lib/dramaImageGenQueue'
import {
  defaultOptionsForAssetKind,
  type ImageGenerationOptions,
} from '../../lib/dramaGenerationOptions'
import { getImageStyleId } from './dramaWorkspaceUtils'
import { DramaImageGenOptionsBar } from './canvas/nodes/DramaImageGenOptionsBar'
import { readAssetVoiceBinding, readVoicePrompt } from './CharacterVoiceBindModal'
import { importGlobalAssetToProject } from './GlobalAssetPickerModal'
import { DramaVoiceAssetCard } from './DramaVoiceAssetCard'
import { DramaVisualAssetCard } from './DramaVisualAssetCard'
import { DramaAssetDownloadButton } from './DramaAssetDownloadButton'
import { DramaAssetsModals } from './DramaAssetsModals'
import type { DramaAssetCurlTab } from './DramaAssetDetailModal'
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
import { useDramaAssetFlowUpload } from './hooks/useDramaAssetFlowUpload'
import { useDramaAssetVoiceActions } from './hooks/useDramaAssetVoiceActions'
import './assetsStep.css'

type AssetTabKey = 'character' | 'scene' | 'prop' | 'voice'

const PAGE_SIZE_DEFAULT = 12
const PAGE_SIZE_OPTIONS = [12, 24, 36] as const

// Tránh việc gieo hạt đồng thời các thư viện trống trên StrictMode
const seedingProjectIds = new Set<number>()

type AssetsStepProps = {
  projectId: number
  onError: (m: string) => void
  onBack?: () => void
}

// Chuẩn hóa giao diện trả về dưới dạng mảng nội dung để tránh sự cố undefined
function normalizeAssetList(value: unknown): DramaAsset[] {
  const list = filterDramaLibraryAssets(Array.isArray(value) ? (value as DramaAsset[]) : [])
  return [...list].sort((a, b) => a.id - b.id)
}

// Xác định xem tài sản chưa được xuất bản hay không
function needsImageGeneration(asset: DramaAsset): boolean {
  return dramaAssetNeedsImageGeneration(asset)
}

export function AssetsStep({ projectId, onError, onBack }: AssetsStepProps) {
  const { t, locale } = useI18n()
  const ASSET_TABS: Array<{ key: AssetTabKey; label: string }> = [
    { key: 'character', label: t('drama.assetsStep.character') },
    { key: 'scene', label: t('drama.assetsStep.scene') },
    { key: 'prop', label: t('drama.assetsStep.prop') },
    ...(DRAMA_VOICE_BINDING_ENABLED ? [{ key: 'voice' as const, label: t('drama.assetsStep.voice') }] : []),
  ]

  // Trạng thái dự án và tài sản
  const [project, setProject] = useState<DramaProject | null>(null)
  const [assets, setAssets] = useState<DramaAsset[]>([])
  const [tab, setTab] = useState<AssetTabKey>('character')
  const [loading, setLoading] = useState(true)
  const [batchBusy, setBatchBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [genOptions, setGenOptions] = useState<ImageGenerationOptions>(() =>
    defaultOptionsForAssetKind('character'),
  )

  // Modals & UI overlays
  const [detailAsset, setDetailAsset] = useState<DramaAsset | null>(null)
  const [detailCurlTab, setDetailCurlTab] = useState<DramaAssetCurlTab>('image')
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [narratorVoiceOpen, setNarratorVoiceOpen] = useState(false)

  // Global Image Gen Queue
  const genQueue = useDramaImageGenQueue()

  // Google Flow upload hook
  const {
    uploadableImageAssets,
    uploadedFlowCount,
    flowUploading,
    flowUploadProgress,
    flowUploadingAssetId,
    flowUploadErrors,
    copiedAssetId,
    handleCopyMediaId,
    handleUploadSingleAssetToFlow,
    handleBatchUploadFlowAssets,
    handleCancelFlowUpload,
  } = useDramaAssetFlowUpload({
    projectId,
    project,
    assets,
    setAssets,
    locale,
    onError,
  })

  // Voice actions hook
  const {
    voiceAsset,
    setVoiceAsset,
    voiceSynthBusyId,
    voicePromptDrafts,
    setVoicePromptDrafts,
    characterVoiceBusyIds,
    batchVoiceBusy,
    handleVoiceBound,
    handleGenerateCharacterVoice,
    handleAutoGenerateVoices,
    persistVoicePrompt,
    handleSynthVoice,
    handleDeleteVoice,
  } = useDramaAssetVoiceActions({
    projectId,
    setAssets,
    onError,
    t,
  })

  // Khởi tạo và tải tài sản dự án
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
        // Chỉ lần đầu tiên (thư viện nội dung trống và có tóm tắt tập lệnh), tự động trích xuất từ kịch bản
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

  // Cập nhật lại ảnh bìa mới nhất sau khi hoàn tất tạo ảnh trong hàng đợi
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

  // Chưa xuất ảnh: không có ảnh bìa/url hợp lệ và không nằm trong hàng đợi
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

  // Lưu cấu hình phong cách hình ảnh
  async function persistStyle(styleId: string) {
    try {
      await dramaApi.updateScript(projectId, { image_style_id: styleId })
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.saveStyleFailed'))
    }
  }

  // Xác minh số dư trước khi đưa vào hàng đợi
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

  // Thêm một tài sản vào hàng đợi tạo ảnh
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

  // Tự động tạo ảnh cho tất cả tài sản chưa có ảnh trong tab hiện tại
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

  // Xóa tài sản có kiểm tra liên kết phân cảnh
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

  // Nhãn trạng thái cho nút tạo ảnh
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
          {ASSET_TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              className={tab === tabItem.key ? 'active' : ''}
              onClick={() => setTab(tabItem.key)}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
        <div className="drama-actions">
          <DramaAssetDownloadButton
            assets={assetList}
            projectTitle={project?.title}
            disabled={flowUploading}
          />

          {flowUploading ? (
            <div className="drama-assets-flow-progress">
              <Loader2 size={15} className="pf-spin" />
              <span>
                Đang upload {flowUploadProgress?.current}/{flowUploadProgress?.total}
                {flowUploadProgress?.assetName ? ` (${flowUploadProgress.assetName})` : ''}...
              </span>
              <button
                type="button"
                className="drama-assets-flow-cancel-btn"
                onClick={handleCancelFlowUpload}
              >
                Dừng
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pf-btn drama-assets-flow-upload-btn"
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
            {t('drama.assetsStep.pageInfo')
              .replace('{page}', String(safePage))
              .replace('{total_pages}', String(pageCount))
              .replace('{n}', String(filtered.length))}
          </p>

          <div className="drama-assets-meta-actions">
            {DRAMA_VOICE_BINDING_ENABLED && tab === 'character' ? (
              <button
                type="button"
                className="pf-btn drama-assets-auto-voice-btn"
                disabled={batchVoiceBusy || (pendingVoiceCharacters.length === 0 && characterVoiceBusyIds.size === 0)}
                onClick={() => void handleAutoGenerateVoices(pendingVoiceCharacters)}
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
                    <Loader2 size={15} className="pf-spin" />
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
                    <Loader2 size={15} className="pf-spin" />
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

          return (
            <DramaVisualAssetCard
              key={asset.id}
              asset={asset}
              busy={busyAssetIds.has(asset.id)}
              batchBusy={batchBusy}
              batchVoiceBusy={batchVoiceBusy}
              characterVoiceBusy={characterVoiceBusyIds.has(asset.id)}
              flowUploading={flowUploading}
              flowUploadingAssetId={flowUploadingAssetId}
              flowUploadError={flowUploadErrors[asset.id]}
              copiedAssetId={copiedAssetId}
              genButtonLabel={genButtonLabel(asset)}
              onDetail={(a, tab = 'image') => {
                setDetailCurlTab(tab)
                setDetailAsset(a)
              }}
              onLightbox={(data) => setLightbox(data)}
              onGenerate={(a) => enqueueOne(a)}
              onGenerateVoice={(a) => void handleGenerateCharacterVoice(a)}
              onUploadFlow={(a) => void handleUploadSingleAssetToFlow(a)}
              onCopyMediaId={(e, id, mid) => void handleCopyMediaId(e, id, mid)}
              onDelete={(a) => void handleDeleteAsset(a)}
              onError={onError}
            />
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

      <DramaAssetsModals
        projectId={projectId}
        project={project}
        detailAsset={detailAsset}
        detailCurlTab={detailCurlTab}
        genOptions={genOptions}
        busyAssetIds={busyAssetIds}
        genButtonLabel={genButtonLabel}
        onCloseDetail={() => setDetailAsset(null)}
        onAssetUpdated={(updated) => {
          setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
          setDetailAsset(updated)
        }}
        onGenerateImage={(a) => enqueueOne(a)}
        onBindVoice={DRAMA_VOICE_BINDING_ENABLED ? (a) => setVoiceAsset(a) : undefined}
        onDeleteAsset={(a) => {
          setDetailAsset(null)
          void handleDeleteAsset(a)
        }}
        lightbox={lightbox}
        onCloseLightbox={() => setLightbox(null)}
        voiceAsset={voiceAsset}
        onCloseVoiceModal={() => setVoiceAsset(null)}
        onVoiceBound={(updated) => {
          handleVoiceBound(updated)
          setDetailAsset((prev) => (prev?.id === updated.id ? updated : prev))
        }}
        narratorVoiceOpen={narratorVoiceOpen}
        onCloseNarratorModal={() => setNarratorVoiceOpen(false)}
        onProjectUpdated={(p) => setProject(p)}
        pickerOpen={pickerOpen}
        onClosePicker={() => setPickerOpen(false)}
        currentTab={tab}
        onImportFromLibrary={handleImportFromLibrary}
        onError={onError}
      />
    </div>
  )
}
