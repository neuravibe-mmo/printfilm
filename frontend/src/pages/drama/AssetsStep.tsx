/** Các bước của thư viện nội dung: Tự động khởi tạo khi không có nội dung lần đầu tiên, Tab phân loại + hàng đợi tạo hình ảnh + liên kết tông màu ký tự */
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { Link } from 'react-router-dom'
import { Boxes, Sparkles } from 'lucide-react'
import { dramaApi, resolveDramaAssetPreviewUrl, type DramaAsset, type DramaProject } from '../../api/drama'
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
}

// Chuẩn hóa giao diện trả về dưới dạng mảng nội dung để tránh sự cố không xác định.filter
function normalizeAssetList(value: unknown): DramaAsset[] {
  return filterDramaLibraryAssets(Array.isArray(value) ? (value as DramaAsset[]) : [])
}

// Xác định xem tài sản chưa được xuất bản hay không (không có ảnh bìa/ảnh chính hợp lệ, việc tải lên hoặc tạo AI sẽ được coi là đã xuất bản)
function needsImageGeneration(asset: DramaAsset): boolean {
  return dramaAssetNeedsImageGeneration(asset)
}

// Hiển thị các bước thư viện nội dung
export function AssetsStep({ projectId, onError }: AssetsStepProps) {
  const { t } = useI18n()
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
  const [reseedBusy, setReseedBusy] = useState(false)
  const [project, setProject] = useState<DramaProject | null>(null)
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>([])
  const [characterVoiceBusyIds, setCharacterVoiceBusyIds] = useState<Set<number>>(() => new Set())
  const [batchVoiceBusy, setBatchVoiceBusy] = useState(false)
  const [narratorVoiceOpen, setNarratorVoiceOpen] = useState(false)
  const genQueue = useDramaImageGenQueue()

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
    if (tab !== 'character') {
      setSelectedCharacterIds([])
    }
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
  const narrationVoiceLabel =
    project?.params && typeof project.params === 'object'
      ? String(
          ((project.params as Record<string, unknown>).narrationVoiceAudio as Record<string, unknown> | undefined)?.label ||
            t('drama.assetsStep.notSet'),
        )
      : t('drama.assetsStep.notSet')
  const filtered = assetList.filter((a) => {
    const t = (a.type || '').toLowerCase()
    if (tab === 'voice') return t === 'voice'
    return t === tab
  })
  const selectedCharacterAssets = assetList.filter(
    (a) => (a.type || '').toLowerCase() === 'character' && selectedCharacterIds.includes(a.id),
  )
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
      onError(t('drama.assetsStep.noPendingAssets'))
      return
    }
    const pre = await ensureImageGenBalance(targets.length)
    if (!pre) return
    const unitYuan = pre.unit_estimate_yuan ?? pre.unit_estimate_fen / 100
    const totalYuan = pre.requested_total_yuan ?? pre.requested_total_fen / 100
    const balanceYuan = pre.balance_yuan ?? pre.balance_fen / 100
    const ok = await dialog.confirm({
      title: t('drama.assetsStep.batchGenTitle'),
      message:
        `${t('drama.assetsStep.batchGenMessage').replace('{label}', ASSET_TABS.find((tab2) => tab2.key === tab)?.label || t('drama.assetsStep.category')).replace('{n}', String(targets.length))}${t('drama.assetsStep.batchGenParallel')}\n\n` +
        `${t('drama.assetsStep.batchGenBilling').replace('{unit}', unitYuan.toFixed(2)).replace('{total}', totalYuan.toFixed(2)).replace('{balance}', balanceYuan.toFixed(2))}${t('drama.assetsStep.batchGenAdjust')}`,
      confirmText: t('drama.assetsStep.startGen'),
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

  // Tạo âm thanh theo nhóm dựa trên cài đặt ký tự
  async function batchGenerateCharacterVoices() {
    if (batchVoiceBusy || selectedCharacterAssets.length === 0) return
    const ok = await dialog.confirm({
      title: t('drama.assetsStep.batchVoiceTitle'),
      message: t('drama.assetsStep.batchVoiceMessage').replace('{n}', String(selectedCharacterAssets.length)),
      confirmText: t('drama.assetsStep.startGen'),
    })
    if (!ok) return
    setBatchVoiceBusy(true)
    let failCount = 0
    for (const asset of selectedCharacterAssets) {
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
    setBatchVoiceBusy(false)
    setSelectedCharacterIds([])
    if (failCount > 0) {
      onError(t('drama.assetsStep.batchVoiceFailed').replace('{n}', String(failCount)))
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

  // Đã thêm nội dung âm thanh
  async function handleAddVoice() {
    const name = await dialog.prompt({
      title: t('drama.assetsStep.addVoiceTitle'),
      message: t('drama.assetsStep.addVoiceMessage'),
      placeholder: t('drama.assetsStep.addVoicePlaceholder'),
      confirmText: t('drama.assetsStep.create'),
    })
    if (!name?.trim()) return
    try {
      const created = await dramaApi.createAsset({
        project_id: projectId,
        type: 'voice',
        asset_type: 'audio',
        name: name.trim(),
        params: { voicePrompt: '' },
      })
      setAssets((prev) => [...(prev ?? []), created])
      setVoicePromptDrafts((prev) => ({ ...prev, [created.id]: '' }))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.createVoiceFailed'))
    }
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

  // Vai trò mới
  async function handleAddCharacter() {
    const name = await dialog.prompt({
      title: t('drama.assetsStep.addCharTitle'),
      message: t('drama.assetsStep.addCharMessage'),
      placeholder: t('drama.assetsStep.addCharPlaceholder'),
      confirmText: t('drama.assetsStep.create'),
    })
    if (!name?.trim()) return
    try {
      const created = await dramaApi.createAsset({
        project_id: projectId,
        type: 'character',
        asset_type: 'image',
        name: name.trim(),
        params: { kind: 'character' },
      })
      setAssets((prev) => [...(prev ?? []), created])
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.createCharFailed'))
    }
  }

  // Xóa vai trò
  async function handleDeleteCharacter(asset: DramaAsset) {
    const ok = await dialog.confirm({
      title: t('drama.assetsStep.deleteCharTitle'),
      message: t('drama.assetsStep.deleteCharMessage').replace('{name}', asset.name || t('common.unnamed')),
      tone: 'danger',
      confirmText: t('common.delete'),
    })
    if (!ok) return
    if (busyAssetIds.has(asset.id)) {
      onError(t('drama.assetsStep.charGenerating'))
      return
    }
    try {
      await dramaApi.deleteAsset(asset.id)
      setAssets((prev) => (prev ?? []).filter((a) => a.id !== asset.id))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('common.deleteFailed'))
    }
  }

  // Trích xuất lại nội dung từ tập lệnh và làm mới tất cả lời nhắc vẽ bằng AI
  async function handleReseedAssets() {
    if (reseedBusy || batchBusy) return
    const ok = await dialog.confirm({
      title: t('drama.assetsStep.reseedTitle'),
      message:
        t('drama.assetsStep.reseedMessage'),
      confirmText: t('drama.assetsStep.startSeed'),
      tone: 'danger',
    })
    if (!ok) return
    setReseedBusy(true)
    try {
      const result = await dramaApi.seedAssets(projectId, {
        refreshPrompts: true,
        reextractProps: true,
      })
      if (result.status === 'generating') {
        let seedStatus = 'generating'
        for (let i = 0; i < 90; i += 1) {
          await new Promise((r) => window.setTimeout(r, 2000))
          const p = await dramaApi.getProject(projectId)
          seedStatus = String(
            (p.params as Record<string, unknown> | undefined)?.assets_seed_status || '',
          )
          if (seedStatus === 'done' || seedStatus === 'failed') break
        }
        const list = normalizeAssetList(
          await dramaApi.listAssets(projectId, { libraryOnly: true }),
        )
        setAssets(list)
        const p = await dramaApi.getProject(projectId)
        const params = (p.params || {}) as Record<string, unknown>
        const created = Number(params.assets_seed_created ?? 0)
        const refreshed = Number(params.assets_seed_refreshed ?? 0)
        const propsUpdated = Number(params.assets_seed_props_updated ?? 0)
        const llmErrors = Array.isArray(params.assets_seed_llm_errors)
          ? (params.assets_seed_llm_errors as string[])
          : []
        const failed = seedStatus === 'failed'
        const parts = [t('drama.assetsStep.seeded').replace('{n}', String(created)), t('drama.assetsStep.refreshed').replace('{n}', String(refreshed))]
        if (propsUpdated > 0) {
          parts.push(t('drama.assetsStep.updatedProps').replace('{n}', String(propsUpdated)))
        }
        let detail = failed
          ? String(params.assets_seed_error || t('drama.assetsStep.seedFailed'))
          : parts.join('，') + '。'
        if (!failed && created === 0 && refreshed === 0 && llmErrors.length === 0) {
          detail +=
            t('drama.assetsStep.seedNoResult')
        } else if (!failed && llmErrors.length > 0) {
          detail += '\n\n' + t('drama.assetsStep.llmErrorPrefix') + '\n' + llmErrors.slice(0, 5).join('\n') + (llmErrors.length > 5 ? ('\n' + t('drama.assetsStep.llmErrorTotal').replace('{n}', String(llmErrors.length))) : '')
        } else if (!failed) {
          detail += t('drama.assetsStep.seedCheckCanvas')
        }
        await dialog.alert({
          title: failed || llmErrors.length > 0 ? t('drama.assetsStep.seedDonePartial') : t('drama.assetsStep.seedDone'),
          message: detail,
          tone: failed || llmErrors.length > 0 ? 'danger' : 'success',
        })
        return
      }
      setAssets(normalizeAssetList(result?.assets))
      const created = result.created_count ?? 0
      const refreshed = result.prompts_refreshed ?? 0
      const propsUpdated = result.props_updated ?? 0
      const llmErrors = Array.isArray(result.llm_errors) ? result.llm_errors : []
      const parts = [t('drama.assetsStep.seeded').replace('{n}', String(created)), t('drama.assetsStep.refreshed').replace('{n}', String(refreshed))]
      if (propsUpdated > 0) {
        parts.push(t('drama.assetsStep.updatedProps').replace('{n}', String(propsUpdated)))
      }
      let detail = parts.join('，') + '。'
      if (created === 0 && refreshed === 0 && llmErrors.length === 0) {
        detail +=
          t('drama.assetsStep.seedNoResult')
      } else if (llmErrors.length > 0) {
        detail += '\n\n' + t('drama.assetsStep.llmErrorPrefix') + '\n' + llmErrors.slice(0, 5).join('\n') + (llmErrors.length > 5 ? ('\n' + t('drama.assetsStep.llmErrorTotal').replace('{n}', String(llmErrors.length))) : '')
      } else {
        detail += t('drama.assetsStep.seedCheckCanvas')
      }
      await dialog.alert({
        title: llmErrors.length > 0 ? t('drama.assetsStep.seedDonePartial') : t('drama.assetsStep.seedDone'),
        message: detail,
        tone: llmErrors.length > 0 ? 'danger' : 'success',
      })
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.reseedFailed'))
    } finally {
      setReseedBusy(false)
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
    return dramaAssetImageGenButtonLabel(asset, queueLabel)
  }

  const imageAssetCount = assetList.filter((a) => {
    const t = (a.type || '').toLowerCase()
    return !['voice', 'video', 'audio', 'text'].includes(t)
  }).length

  return (
    <div className="drama-assets-step">
      <header className="drama-assets-hero">
        <div className="drama-step-hero-main">
          <div className="drama-step-hero-icon" aria-hidden>
            <Boxes size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2>{t('drama.assetsStep.title')}</h2>
            <p className="drama-step-hero-sub">
              {t('drama.assetsStep.headerInfo').replace('{all}', String(assetList.length)).replace('{n}', String(filtered.length)).replace('{pending}', String(pending.length))}
            </p>
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
          {tab === 'character' ? (
            <button type="button" className="pf-btn" onClick={() => void handleAddCharacter()}>
              {t('drama.assetsStep.addChar')}
            </button>
          ) : null}
          {DRAMA_VOICE_BINDING_ENABLED && tab === 'voice' ? (
            <button type="button" className="pf-btn" onClick={() => void handleAddVoice()}>
              {t('drama.assetsStep.addVoice')}
            </button>
          ) : null}
          {DRAMA_VOICE_BINDING_ENABLED && tab !== 'voice' ? (
            <button
              type="button"
              className="pf-btn"
              onClick={() => setNarratorVoiceOpen(true)}
              title={t('drama.assetsStep.narratorVoiceTip')}
              disabled={!project}
            >
              {t('drama.assetsStep.narratorVoice')}：{narrationVoiceLabel}
            </button>
          ) : null}
          <button type="button" className="pf-btn" onClick={() => setPickerOpen(true)}>
            {t('drama.assetsStep.selectFromLib')}
          </button>
          <Link className="pf-btn" to="/drama/assets">
            {t('drama.assetsStep.browseAll')}
          </Link>
          <button
            type="button"
            className="pf-btn"
            disabled={reseedBusy || batchBusy}
            onClick={() => void handleReseedAssets()}
          >
            {reseedBusy
              ? t('drama.assetsStep.seeding').replace('{n}', String(Math.max(imageAssetCount, 1)))
              : t('drama.assetsStep.reseed')}
          </button>
          {/* 一键生成未出图：暂时隐藏，恢复时去掉 && false */}
          {tab !== 'voice' && false ? (
            <button
              type="button"
              className="drama-btn-primary"
              disabled={batchBusy || pending.length === 0}
              onClick={() => void batchGenerate()}
              title={
                pending.length > 0
                  ? t('drama.assetsStep.batchGenHint').replace('{n}', String(pending.length))
                  : t('drama.assetsStep.noUngenerated')
              }
            >
              {batchBusy || queueBusy
                ? t('drama.assetsStep.generatingCount').replace('{n}', String(busyAssetIds.size))
                : pending.length > 0
                  ? t('drama.assetsStep.genPending').replace('{n}', String(pending.length))
                  : t('drama.assetsStep.genAllPending')}
            </button>
          ) : null}

          {DRAMA_VOICE_BINDING_ENABLED && tab === 'character' ? (
            <button
              type="button"
              className="pf-btn pf-btn-lime"
              disabled={batchBusy || batchVoiceBusy || selectedCharacterIds.length === 0}
              onClick={() => void batchGenerateCharacterVoices()}
              title={t('drama.assetsStep.batchVoiceTip')}
            >
              {batchVoiceBusy
                ? t('drama.assetsStep.batchGenerating')
                : t('drama.assetsStep.batchGenVoice').replace('{n}', String(selectedCharacterIds.length))}
            </button>
          ) : null}
          <Link className="pf-btn" to={`/drama/projects/${projectId}/canvas`}>
            {t('drama.assetsStep.openCanvas')}
          </Link>
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
        <p className="drama-muted drama-assets-page-meta">
          {t('drama.assetsStep.pageInfo').replace('{page}', String(safePage)).replace('{total_pages}', String(pageCount)).replace('{n}', String(filtered.length))}
        </p>
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
              <p>
                {asset.type}
                {isCharacter && voice ? ` · ${voice.label}` : ''}
              </p>
              <div
                className="drama-asset-card-actions"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {tab === 'character' && isCharacter ? (
                  <label
                    className="drama-voice-multi-select"
                    style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginRight: 8, cursor: 'pointer' }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCharacterIds.includes(asset.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        setSelectedCharacterIds((prev) =>
                          prev.includes(asset.id) ? prev.filter((id) => id !== asset.id) : [...prev, asset.id],
                        )
                      }}
                    />
                    <span className="drama-muted">{t('common.selected')}</span>
                  </label>
                ) : null}
                <button
                  type="button"
                  className="pf-btn pf-btn-sm"
                  disabled={busy || batchBusy}
                  onClick={() => enqueueOne(asset)}
                >
                  {genButtonLabel(asset)}
                </button>
                {isCharacter ? (
                  <>
                    {DRAMA_VOICE_BINDING_ENABLED ? (
                      voice ? (
                        <CharacterVoicePreviewButton
                          url={voice.url}
                          label={voice.label}
                          onError={onError}
                        />
                      ) : (
                        <button
                          type="button"
                          className="pf-btn pf-btn-sm pf-btn-lime"
                          disabled={
                            batchBusy ||
                            batchVoiceBusy ||
                            characterVoiceBusyIds.has(asset.id)
                          }
                          onClick={() => void handleGenerateCharacterVoice(asset)}
                        >
                          {characterVoiceBusyIds.has(asset.id) ? t('drama.assetsStep.generating') : t('drama.assetsStep.genVoice')}
                        </button>
                      )
                    ) : null}
                    <button
                      type="button"
                      className="pf-btn pf-btn-sm drama-btn-danger-text"
                      disabled={busy || batchBusy || batchVoiceBusy}
                      onClick={() => void handleDeleteCharacter(asset)}
                    >
                      {t('common.delete')}
                    </button>
                  </>
                ) : null}
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
            void handleDeleteCharacter(a)
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
