/** Trình chỉnh sửa tập: Tái tạo bố cục bốn cột của dự án gốc (Assets/Script/Preview/Storyboard) */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  dramaApi,
  resolveDramaMediaUrl,
  type DramaAsset,
  type DramaEpisode,
  type DramaFragment,
} from '../../api/drama'
import { type ImageStyleId } from '../../lib/dramaImageStyles'
import {
  RATIO_OPTIONS,
  buildFragmentRefStripItems,
  collectFragmentAssetIds,
  extractAssetIds,
  filterEpisodeAssets,
  formatFragLabel,
  isFragmentGenerationBusy,
  readFragmentGenerationStatus,
  readFragmentVideoVersions,
  resolveFragmentDurationSec,
  type AssetScope,
  type AssetTab,
} from './dramaEpisodeEditUtils'
import {
  ensureEpisodeVideoStatusPoll,
  subscribeEpisodeGenerateStatus,
  syncEpisodeVideoJobs,
  useDramaGenQueue,
  videoJobId,
  type DramaGenJob,
} from '../../lib/dramaGenQueue'
import { hasNonLocalizedCues, localizeScriptCues } from '../../lib/dramaCueI18n'
import { collectDramaGenerateGateIssues } from '../../lib/dramaEpisodeScriptValidate'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import { dialog } from '../../lib/dialog'
import {
  formatProjectOutputLabel,
  readEpisodeAspectRatio,
  readEpisodeResolution,
} from '../../lib/dramaProjectOutputSettings'
import { FragmentPlanSkillModal } from '../../components/drama/FragmentPlanSkillModal'
import { DramaGenTaskDetail } from '../../components/drama/DramaGenTaskDetail'
import { EpisodeEditCurlModal } from './EpisodeEditCurlModal'
import { EpisodeStoryboardFooter } from './EpisodeStoryboardFooter'
import { EpisodeEditScriptSection } from './EpisodeEditScriptSection'
import { useEpisodeContinuity } from './hooks/useEpisodeContinuity'
import { useEpisodeAssetActions } from './hooks/useEpisodeAssetActions'
import { useEpisodeGeneration, readFragmentPlanStatus } from './hooks/useEpisodeGeneration'
import { useDramaImageGenQueue } from '../../hooks/useDramaImageGenQueue'
import { useMediaModelsCatalog } from '../../hooks/useMediaModelsCatalog'
import { getImageStyleId, isDefaultEpisodeTitle } from './dramaWorkspaceUtils'
import { EpisodeEditAssetPanel } from './EpisodeEditAssetPanel'
import { EpisodeEditHeaderControls } from './EpisodeEditHeaderControls'
import { EpisodeEditSidePane } from './EpisodeEditSidePane'
import { GlobalAssetPickerModal } from './GlobalAssetPickerModal'
import {
  applySubtitleModeToFragments,
  subtitleModeUsesModelOutput,
  type DramaSubtitleMode,
} from '../../lib/dramaSubtitleBoard'
import {
  applyCharacterIntroModeToFragments,
  characterIntroModeEnabled,
  type DramaCharacterIntroMode,
} from '../../lib/dramaCharacterIntro'
import {
  readEffectiveCharacterIntroMode,
  readEffectiveSubtitleMode,
} from '../../lib/dramaProjectGlobalSettings'
import {
  CharacterVoiceBindModal,
  readAssetVoiceBinding,
} from './CharacterVoiceBindModal'
import { DramaAssetDetailModal } from './DramaAssetDetailModal'
import { buildEpisodeDirItems, DramaEpisodeDir } from './DramaEpisodeDir'
import RequireAuth from './RequireAuth'
import { useI18n } from '../../i18n'
import './drama.css'

export default function EpisodeEditPage() {
  return (
    <RequireAuth>
      <EpisodeEditInner />
    </RequireAuth>
  )
}



// Phân tích cú pháp thống nhất các giá trị Boolean trong các tham số dự án, tương thích với các phương pháp ghi chuỗi/số lịch sử.
function coerceProjectBool(value: unknown, defaultValue: boolean): boolean {
  if (value == null) return defaultValue
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off', ''].includes(normalized)) return false
  }
  return Boolean(value)
}

// Nội dung chính của trang chỉnh sửa tập
function EpisodeEditInner() {
  const { t } = useI18n()
  const { projectId, episodeId } = useParams()
  const pid = Number(projectId)
  const eid = Number(episodeId)
  const navigate = useNavigate()
  /*
   * tập các tập
   * các mảnh bảng phân cảnh
   * tài sản tài sản
   * đã chọnIndex bảng phân cảnh hiện tại
   * Bộ lọc thanh bên assetsScope / assetsTab
   * chỉnh sửa có nên chỉnh sửa chế độ không
   * Các thông số tạo videoStyleId / modelId / faspecRatio (UI)
   * bận / trạng thái / trạng thái lỗi
   */
  const [episode, setEpisode] = useState<DramaEpisode | null>(null)
  const [episodeList, setEpisodeList] = useState<DramaEpisode[]>([])
  const [fragments, setFragments] = useState<DramaFragment[]>([])
  const [assets, setAssets] = useState<DramaAsset[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [assetScope, setAssetScope] = useState<AssetScope>('episode')
  const [assetTab, setAssetTab] = useState<AssetTab | null>('character')
  const [editing, setEditing] = useState(false)
  const [showCurlModal, setShowCurlModal] = useState(false)
  const [videoStyleId, setVideoStyleId] = useState<ImageStyleId | ''>('')
  const [modelId, setModelId] = useState('')
  const mediaCatalog = useMediaModelsCatalog()
  const [aspectRatio, setAspectRatio] = useState<(typeof RATIO_OPTIONS)[number]>('9:16')
  // subtitleMode Chế độ phụ đề của tập này: mô hình tự sản xuất / ghép nối hậu kỳ (hậu kỳ mặc định)
  const [subtitleMode, setSubtitleMode] = useState<DramaSubtitleMode>('post')
  // characterIntroMode Giới thiệu nhân vật trong tập này: lớp phủ mô hình / tắt (mặc định tắt)
  const [characterIntroMode, setCharacterIntroMode] = useState<DramaCharacterIntroMode>('off')
  // linkLastFrame Có sử dụng khung hình cuối cùng của ảnh trước làm khung hình đầu tiên của ảnh này hay không (ghi vào project.params, được bật theo mặc định)
  const [linkLastFrame, setLinkLastFrame] = useState(true)
  // bộ nhớ đệm thông số dự án projectParams (kết nối giữa các máy nhân bản + dự phòng thông số đầu ra đa dạng)
  const [projectParams, setProjectParams] = useState<Record<string, unknown>>({})
  // epParams bộ nhớ đệm thông số tập (khung/định nghĩa được viết ở đây)
  const [episodeParams, setEpisodeParams] = useState<Record<string, unknown>>({})
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  /** failedReasonJob Nguyên nhân không mở được dấu chấm than gương dưới */
  const [failReasonJob, setFailReasonJob] = useState<DramaGenJob | null>(null)
  const imageGenQueue = useDramaImageGenQueue()
  const dramaGenQueue = useDramaGenQueue()
  const applyStatusRef = useRef<(st: Awaited<ReturnType<typeof dramaApi.generateStatus>>) => Awaited<
    ReturnType<typeof dramaApi.generateStatus>
  >>(() => ({ episode_id: 0, done: 0, failed: 0, running: 0, total: 0, tasks: [], fragments: [] }))
  const reloadRef = useRef<() => Promise<void>>(async () => {})
  const projectParamsRef = useRef<Record<string, unknown>>({})
  const episodeParamsRef = useRef<Record<string, unknown>>({})

  useEffect(() => {
    // Sau khi thư mục đến, hãy thay thế ID Kie/Ark cũ bằng mô hình video mặc định nền
    if (!mediaCatalog) return
    const ids = mediaCatalog.video_models.map((m) => m.id)
    if (!ids.length) return
    setModelId((prev) => (ids.includes(prev) ? prev : mediaCatalog.defaults.video_model || ids[0]))
  }, [mediaCatalog])

  const selected = fragments[selectedIndex] || null
  const selectedDuration = selected?.duration_sec ?? 8
  // generateIds Id tập hiện đang được xếp hàng/tạo
  const generatingIds = useMemo(() => {
    const ids = new Set<number>()
    for (const task of episode?.active_tasks || []) {
      if (
        typeof task.episode_id === 'number' &&
        task.episode_id > 0 &&
        task.episode_id !== eid
      ) {
        continue
      }
      if (
        task.task_type === 'fragment_video' &&
        typeof task.fragment_id === 'number' &&
        !task.cancel_requested &&
        ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review'].includes(task.status)
      ) {
        // Phim xong: Bỏ qua các task đang hoạt động còn lại để tránh logo bị "tạo" lâu
        const frag = fragments.find((f) => f.id === task.fragment_id)
        if (frag && readFragmentGenerationStatus(frag).status === 'done') continue
        if (!frag) continue
        ids.add(task.fragment_id)
      }
    }
    for (const frag of fragments) {
      if (!frag.id) continue
      const st = readFragmentGenerationStatus(frag).status
      if (st === 'done') continue
      if (isFragmentGenerationBusy(st)) ids.add(frag.id)
    }
    return ids
  }, [eid, fragments, episode?.active_tasks])
  // AnyFragmentGenerated Liệu có phân đoạn nào được xếp hàng/được tạo cho tập này hay không (chỉnh sửa không bị khóa, chỉ khóa tạo hàng loạt)
  const anyFragmentGenerating = generatingIds.size > 0
  const epNumber = Number(episode?.params?.episodeNumber) || 0
  const displayEpisodeName =
    episode?.name && !isDefaultEpisodeTitle(episode.name, epNumber)
      ? episode.name
      : epNumber >= 1
        ? t('drama.episodes.episode', { n: epNumber })
        : t('drama.episodeEdit.thisEpisode')

  // selectedIsGenerated Liệu máy nhân bản hiện được chọn có đang được tạo hay không
  const selectedIsGenerating = Boolean(selected?.id && generatingIds.has(selected.id))
  // selectedHasVideo Liệu video hiện tại đã được hoàn thành hay chưa (dùng để "tái tạo" copywriting)
  const selectedHasVideo = Boolean(selected?.video)
  // đã chọnPhiên bản Phim lịch sử gương hiện tại
  const selectedVersions = useMemo(() => readFragmentVideoVersions(selected), [selected])
  // PreviewVersion Bộ phim lịch sử hiện đang được chọn để xem trước
  const previewVersion = useMemo(
    () => selectedVersions.find((ver) => ver.id === previewVersionId) ?? null,
    [previewVersionId, selectedVersions],
  )
  const previewVideoUrl = previewVersion ? resolveDramaMediaUrl(previewVersion.video) : null
  const previewPosterUrl = previewVersion?.cover ? resolveDramaMediaUrl(previewVersion.cover) : null
  // generateAllLocked chỉ bị khóa khi nội dung gửi được xếp hàng đợi và quá trình tạo không chặn việc chỉnh sửa.
  const generateAllLocked = busy
  // planFragmentsLocked Chỉ tập này bị khóa khi quá trình tạo video hoặc viết kịch bản phân cảnh bằng AI đang diễn ra
  const planFragmentsLocked =
    busy || anyFragmentGenerating || readFragmentPlanStatus(episode) === 'generating'
  const selectedRefIds = useMemo(
    () => new Set(collectFragmentAssetIds(selected)),
    [selected],
  )
  const selectedRefItems = useMemo(
    () =>
      buildFragmentRefStripItems(selected, assets, resolveDramaMediaUrl, (asset) => {
        const voice = readAssetVoiceBinding(asset)
        return voice ? { label: voice.label, url: voice.url } : null
      }),
    [selected, assets],
  )
  // selectedGateIssues Kiểm soát truy cập tập lệnh/nội dung hiện tại (lời nhắc ngay lập tức trong khu vực chỉnh sửa)
  const selectedGateIssues = useMemo(() => {
    const { blocking, warnings } = collectDramaGenerateGateIssues(selected, assets)
    return [...blocking, ...warnings]
  }, [selected, assets])

  const { prevLastFrameUrl, continuityBlockedReason, continuityQueueHint } = useEpisodeContinuity({
    fragments,
    selectedIndex,
    linkLastFrame,
    generatingIds,
  })

  // selectedGenerateLocked Chỉ khóa nút "Tạo" của cảnh hiện tại (bao gồm kiểm soát truy cập kết nối khung cuối cùng)
  const selectedGenerateLocked = busy || selectedIsGenerating || Boolean(continuityBlockedReason)

  // Kết nối liên gương liên tục chuyển sang thông số dự án và để phần phụ trợ sắp xếp lại các tác vụ chưa bắt đầu
  async function handleLinkLastFrameChange(enabled: boolean) {
    const prevEnabled = linkLastFrame
    const prevParams = projectParams
    const nextParams = { ...projectParams, linkLastFrame: enabled }
    setLinkLastFrame(enabled)
    setProjectParams(nextParams)
    try {
      const updated = await dramaApi.updateProject(pid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object'
          ? (updated.params as Record<string, unknown>)
          : (nextParams as Record<string, unknown>)
      setProjectParams(updatedParams)
      setLinkLastFrame(coerceProjectBool(updatedParams.linkLastFrame ?? updatedParams.link_last_frame, enabled))
      // Làm mới trạng thái nhiệm vụ của tập này để thanh gương phía dưới phản ánh ngay việc điều chỉnh nối tiếp/song song
      try {
        const ep = await dramaApi.getEpisode(eid)
        setEpisode(ep)
        if (Array.isArray(ep.fragments)) setFragments(ep.fragments)
      } catch {
        /* ignore refresh errors */
      }
      setStatus(
        enabled
          ? t('drama.episodeEdit.tailEnabled')
          : t('drama.episodeEdit.tailDisabled'),
      )
    } catch (err) {
      setLinkLastFrame(prevEnabled)
      setProjectParams(prevParams)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveTailFailed'))
    }
  }

  // Duy trì khung/định nghĩa của tập này thành tập.params; nhắc nhở tái sinh khi phim đã hoàn thành
  async function handleEpisodeOutputChange(nextParams: Record<string, unknown>) {
    const prevRatio = readEpisodeAspectRatio(episodeParams, projectParams)
    const prevRes = readEpisodeResolution(episodeParams, projectParams)
    const nextRatio = readEpisodeAspectRatio(nextParams, projectParams)
    const nextRes = readEpisodeResolution(nextParams, projectParams)
    if (prevRatio === nextRatio && prevRes === nextRes) return

    const prevLabel = formatProjectOutputLabel(prevRatio, prevRes)
    const nextLabel = formatProjectOutputLabel(nextRatio, nextRes)
    const generatedCount = fragments.filter((frag) => Boolean(frag.video)).length
    const ok = await dialog.confirm({
      title: t('drama.episodeEdit.switchOutputTitle'),
      message:
        generatedCount > 0
          ? t('drama.episodeEdit.switchOutputWithGen').replace('{prev}', prevLabel).replace('{next}', nextLabel).replace('{n}', String(generatedCount))
          : t('drama.episodeEdit.switchOutputNoGen').replace('{prev}', prevLabel).replace('{next}', nextLabel),
      confirmText: generatedCount > 0 ? t('drama.episodeEdit.saveAndRegen') : t('common.save'),
      cancelText: t('common.cancel'),
      tone: generatedCount > 0 ? 'danger' : 'default',
    })
    if (!ok) return

    const prevParams = episodeParams
    setEpisodeParams(nextParams)
    episodeParamsRef.current = nextParams
    setAspectRatio(nextRatio)
    try {
      const updated = await dramaApi.updateEpisode(eid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object' && !Array.isArray(updated.params)
          ? (updated.params as Record<string, unknown>)
          : nextParams
      setEpisode(updated)
      setEpisodeParams(updatedParams)
      episodeParamsRef.current = updatedParams
      setAspectRatio(readEpisodeAspectRatio(updatedParams, projectParams))
      setStatus(
        generatedCount > 0
          ? t('drama.episodeEdit.outputUpdatedRegen').replace('{label}', nextLabel)
          : t('drama.episodeEdit.outputUpdated').replace('{label}', nextLabel),
      )
      setError('')
      if (generatedCount > 0) {
        await generateAll({ forceRegen: true, skipConfirm: true })
      }
    } catch (err) {
      setEpisodeParams(prevParams)
      episodeParamsRef.current = prevParams
      setAspectRatio(readEpisodeAspectRatio(prevParams, projectParams))
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveOutputFailed'))
      throw err
    }
  }

  // Kiên trì phương pháp phụ đề của tập này và tự động viết lại các từ gợi ý phụ đề trong bảng phân cảnh hiện tại
  async function handleEpisodeSubtitleChange(mode: DramaSubtitleMode) {
    if (mode === subtitleMode) return
    const prevParams = episodeParams
    const prevFragments = fragments
    const nextParams = {
      ...episodeParams,
      subtitleMode: mode,
      subtitleEnabled: subtitleModeUsesModelOutput(mode),
    }
    const nextFragments = applySubtitleModeToFragments(fragments, mode)
    setSubtitleMode(mode)
    setEpisodeParams(nextParams)
    episodeParamsRef.current = nextParams
    setFragments(nextFragments)
    try {
      const updated = await dramaApi.updateEpisode(eid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object' && !Array.isArray(updated.params)
          ? (updated.params as Record<string, unknown>)
          : nextParams
      setEpisode(updated)
      setEpisodeParams(updatedParams)
      episodeParamsRef.current = updatedParams
      setSubtitleMode(readEffectiveSubtitleMode(updatedParams, projectParamsRef.current))
      const contentChanged = nextFragments.some(
        (frag, index) => frag.content !== prevFragments[index]?.content,
      )
      if (contentChanged) {
        const ep = await dramaApi.saveFragments(
          eid,
          nextFragments.map((f, i) => {
            const prevFragParams =
              f.params && typeof f.params === 'object' && !Array.isArray(f.params)
                ? (f.params as Record<string, unknown>)
                : {}
            return {
              id: typeof f.id === 'number' && f.id > 0 ? f.id : undefined,
              sort_order: i,
              content: f.content,
              cover: f.cover,
              video: f.video,
              duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
              params: { ...prevFragParams, user_edited: true },
              asset_ids: f.asset_ids || [],
            }
          }),
        )
        setEpisode(ep)
        setFragments(ep.fragments || nextFragments)
      }
      setStatus(
        mode === 'model'
          ? t('drama.episodeEdit.subtitleModel')
          : t('drama.episodeEdit.subtitlePost'),
      )
      setError('')
    } catch (err) {
      setSubtitleMode(readEffectiveSubtitleMode(prevParams, projectParamsRef.current))
      setEpisodeParams(prevParams)
      episodeParamsRef.current = prevParams
      setFragments(prevFragments)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveSubtitleFailed'))
    }
  }

  // Duy trì chuyển đổi chồng chéo cho phần giới thiệu nhân vật trong tập này và tự động xóa các dòng giới thiệu trong bảng phân cảnh hiện tại
  async function handleEpisodeCharacterIntroChange(mode: DramaCharacterIntroMode) {
    if (mode === characterIntroMode) return
    const prevParams = episodeParams
    const prevFragments = fragments
    const nextParams = {
      ...episodeParams,
      characterIntroMode: mode,
      characterIntroEnabled: characterIntroModeEnabled(mode),
    }
    const nextFragments = applyCharacterIntroModeToFragments(fragments, mode)
    setCharacterIntroMode(mode)
    setEpisodeParams(nextParams)
    episodeParamsRef.current = nextParams
    setFragments(nextFragments)
    try {
      const updated = await dramaApi.updateEpisode(eid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object' && !Array.isArray(updated.params)
          ? (updated.params as Record<string, unknown>)
          : nextParams
      setEpisode(updated)
      setEpisodeParams(updatedParams)
      episodeParamsRef.current = updatedParams
      setCharacterIntroMode(readEffectiveCharacterIntroMode(updatedParams, projectParamsRef.current))
      const contentChanged = nextFragments.some(
        (frag, index) => frag.content !== prevFragments[index]?.content,
      )
      if (contentChanged) {
        const ep = await dramaApi.saveFragments(
          eid,
          nextFragments.map((f, i) => {
            const prevFragParams =
              f.params && typeof f.params === 'object' && !Array.isArray(f.params)
                ? (f.params as Record<string, unknown>)
                : {}
            return {
              id: typeof f.id === 'number' && f.id > 0 ? f.id : undefined,
              sort_order: i,
              content: f.content,
              cover: f.cover,
              video: f.video,
              duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
              params: { ...prevFragParams, user_edited: true },
              asset_ids: f.asset_ids || [],
            }
          }),
        )
        setEpisode(ep)
        setFragments(ep.fragments || nextFragments)
      }
      setStatus(
        mode === 'model'
          ? t('drama.episodeEdit.charIntroEnabled')
          : t('drama.episodeEdit.charIntroDisabled'),
      )
      setError('')
    } catch (err) {
      setCharacterIntroMode(readEffectiveCharacterIntroMode(prevParams, projectParamsRef.current))
      setEpisodeParams(prevParams)
      episodeParamsRef.current = prevParams
      setFragments(prevFragments)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveCharIntroFailed'))
    }
  }

  const referencedIds = useMemo(() => {
    const set = new Set<number>()
    for (const f of fragments) {
      for (const id of extractAssetIds(f.content || '')) set.add(id)
      for (const id of f.asset_ids || []) set.add(id)
    }
    return set
  }, [fragments])

  const filteredAssets = useMemo(
    () => filterEpisodeAssets(assets, assetScope, assetTab, referencedIds),
    [assets, assetScope, assetTab, referencedIds],
  )

  // Phần phụ trợ ứng dụng tạo tiến trình và đồng bộ hóa trạng thái bảng phân cảnh + hàng đợi chung
  function applyGenerateStatus(st: Awaited<ReturnType<typeof dramaApi.generateStatus>>) {
    setStatus(t('drama.episodeEdit.syncProgress').replace('{done}', String(st.done)).replace('{total}', String(st.total)).replace('{running}', String(st.running)).replace('{failed}', String(st.failed)))
    const byId = new Map(st.fragments.map((f) => [f.fragment_id, f.status]))
    setFragments((prev) => {
      const next = prev.map((f) => {
        if (!f.id) return f
        const genStatus = byId.get(f.id)
        if (!genStatus) return f
        const item = st.fragments.find((x) => x.fragment_id === f.id) as
          | {
              fragment_id: number
              status: string
              video?: string
              cover?: string
              message?: string
              phase?: string
              error?: string
            }
          | undefined
        return {
          ...f,
          video: item?.video || f.video,
          cover: item?.cover || f.cover,
          params: {
            ...(f.params || {}),
            generation: {
              status: genStatus,
              video: item?.video,
              cover: item?.cover,
              message: item?.message,
              phase: item?.phase,
              error: item?.error,
            },
          },
        }
      })
      syncEpisodeVideoJobs({
        projectId: pid,
        episodeId: eid,
        episodeName: episode?.name,
        fragments: next.map((f) => ({
          id: f.id,
          sort_order: f.sort_order,
          content: f.content,
        })),
        statusItems: st.fragments.map((f) => {
          const row = f as {
            fragment_id: number
            status: string
            message?: string
            phase?: string
            error?: string
            video?: string
            cover?: string
          }
          return {
            fragment_id: row.fragment_id,
            status: row.status,
            message: row.message,
            phase: row.phase,
            error: row.error,
            video: row.video,
            cover: row.cover,
          }
        }),
        taskItems: st.tasks,
      })
      return next
    })
    return st
  }

  applyStatusRef.current = applyGenerateStatus

  // Vào trang này để kiểm tra xem có bất kỳ tác vụ đang tạo hoặc bảng phân cảnh AI nào đang diễn ra không
  async function resumeGenerateIfNeeded() {
    try {
      const ep = await dramaApi.getEpisode(eid)
      if (readFragmentPlanStatus(ep) === 'generating') {
        setBusy(true)
        setStatus(t('drama.episodeEdit.aiPlanning'))
        const started = Date.now()
        while (Date.now() - started < 10 * 60 * 1000) {
          await new Promise((r) => setTimeout(r, 2500))
          const cur = await dramaApi.getEpisode(eid)
          const st = readFragmentPlanStatus(cur)
          if (st === 'completed') {
            setEpisode(cur)
            setFragments(cur.fragments || [])
            setSelectedIndex(0)
            setStatus(t('drama.episodeEdit.planAiDone').replace('{count}', String((cur.fragments || []).length)))
            setBusy(false)
            return
          }
          if (st === 'failed') {
            setError(String(cur.params?.fragment_plan_error || t('drama.episodeEdit.aiFailed')))
            setBusy(false)
            return
          }
        }
        setBusy(false)
        return
      }
      const st = applyGenerateStatus(await dramaApi.generateStatus(eid))
      if (st.running > 0) ensureEpisodeVideoStatusPoll()
    } catch {
      /* ignore */
    }
  }

  // Mở canvas bảng phân cảnh toàn màn hình
  function openEpisodeStoryboard() {
    navigate(`/drama/projects/${pid}/episodes/${eid}/canvas`)
  }

  // Tải lại các tập
  async function reload() {
    const ep = await dramaApi.getEpisode(eid)
    setEpisode(ep)
    const epParams =
      ep.params && typeof ep.params === 'object' && !Array.isArray(ep.params)
        ? (ep.params as Record<string, unknown>)
        : {}
    setEpisodeParams(epParams)
    episodeParamsRef.current = epParams
    setSubtitleMode(readEffectiveSubtitleMode(epParams, projectParamsRef.current))
    setCharacterIntroMode(readEffectiveCharacterIntroMode(epParams, projectParamsRef.current))
    setAspectRatio(readEpisodeAspectRatio(epParams, projectParamsRef.current))
    setFragments(ep.fragments || [])
    if ((ep.fragments || []).length === 0) {
      setFragments([
        {
          id: 0,
          episode_id: eid,
          sort_order: 0,
          content: '',
          cover: '',
          video: '',
          duration_sec: 8,
          asset_ids: [],
        },
      ])
    }
    await resumeGenerateIfNeeded()
  }

  reloadRef.current = reload

  // Cắt phân cảnh tự động từ kịch bản của tập
  async function handleSeedFromScript() {
    if (!epNumber || !pid) return
    setBusy(true)
    setStatus(t('drama.episodeEdit.seedingFromScript'))
    setError('')
    try {
      await dramaApi.confirmEpisodeFromScript({
        project_id: pid,
        episode_number: epNumber,
      })
      await reload()
      setStatus(t('drama.episodeEdit.seedSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.outlinePanel.enterFailed'))
    } finally {
      setBusy(false)
    }
  }

  // Sử dụng lại việc bỏ phiếu tạo_status toàn cầu để tránh các yêu cầu lặp lại với dramaGenQueue
  useEffect(() => {
    return subscribeEpisodeGenerateStatus(async (episodeId, st) => {
      if (episodeId !== eid) return
      const result = applyStatusRef.current(st)
      if (result.running === 0) {
        await reloadRef.current()
      }
    })
  }, [eid])

  // Thoát khỏi bản xem trước phiên bản lịch sử khi chuyển đổi bảng phân cảnh
  useEffect(() => {
    setPreviewVersionId(null)
  }, [selectedIndex, selected?.id])

  useEffect(() => {
    if (!eid || !pid) return
    setBusy(false)
    setStatus('')
    setError('')
    reload().catch((err) => setError(err instanceof Error ? err.message : t('common.loadFailed')))
    dramaApi
      .listAssets(pid)
      .then(setAssets)
      .catch(() => setAssets([]))
    dramaApi
      .listEpisodes(pid)
      .then((rows) => setEpisodeList(rows))
      .catch(() => setEpisodeList([]))
    // Tải kiểu hình ảnh mặc định của dự án / chờ kết nối giữa các gương với thanh trên cùng
    dramaApi
      .getProject(pid)
      .then((project) => {
        const styleId = getImageStyleId(project.script, project)
        if (styleId) setVideoStyleId(styleId as ImageStyleId)
        const params =
          project.params && typeof project.params === 'object' && !Array.isArray(project.params)
            ? (project.params as Record<string, unknown>)
            : {}
        setProjectParams(params)
        projectParamsRef.current = params
        const linkRaw = params.linkLastFrame ?? params.link_last_frame
        setLinkLastFrame(coerceProjectBool(linkRaw, true))
        setSubtitleMode(readEffectiveSubtitleMode(episodeParamsRef.current, params))
        setCharacterIntroMode(readEffectiveCharacterIntroMode(episodeParamsRef.current, params))
        setAspectRatio(readEpisodeAspectRatio(episodeParamsRef.current, params))
      })
      .catch(() => {
        /* ignore */
      })
  }, [eid, pid])

  // Cập nhật bảng phân cảnh hiện tại
  function updateSelected(patch: Partial<DramaFragment>) {
    setFragments((prev) =>
      prev.map((f, i) => (i === selectedIndex ? { ...f, ...patch } : f)),
    )
  }

  // ID bản vẽ nội dung hiện đang được xếp hàng/tạo
  const imageBusyIds = useMemo(() => {
    const ids = new Set<number>()
    for (const job of imageGenQueue) {
      if (job.status === 'queued' || job.status === 'running') ids.add(job.assetId)
    }
    return ids
  }, [imageGenQueue])

  const {
    detailAsset,
    setDetailAsset,
    voiceBindAsset,
    setVoiceBindAsset,
    assetCreateBusy,
    detectBusy,
    libraryPickerOpen,
    setLibraryPickerOpen,
    characterVoiceBusyIds,
    resolveCreateAssetTab,
    handleCharacterUpdated,
    mentionAsset,
    handleCreateSideAsset,
    handleImportSideAsset,
    unlinkSelectedAsset,
    handleAutoDetectAssets,
    focusLinkedAsset,
    enqueueAssetImage,
    handleGenerateCharacterVoice,
    assetImageGenLabel,
  } = useEpisodeAssetActions({
    pid,
    eid,
    selected,
    selectedIndex,
    fragments,
    assets,
    assetTab,
    videoStyleId,
    imageGenQueue,
    imageBusyIds,
    setFragments,
    setAssets,
    setAssetTab,
    setAssetScope,
    setEditing,
    setStatus,
    setError,
    updateSelected,
  })

  // Chèn bảng phân cảnh trống
  function insertFrag(at: number) {
    setFragments((prev) => {
      const next = [...prev]
      next.splice(at, 0, {
        id: 0,
        episode_id: eid,
        sort_order: at,
        content: '',
        cover: '',
        video: '',
        duration_sec: 8,
        asset_ids: [],
      })
      return next
    })
    setSelectedIndex(at)
    setEditing(true)
  }

  // Sao chép bảng phân cảnh
  function duplicateFrag(index: number) {
    const source = fragments[index]
    if (!source) return
    setFragments((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, {
        ...source,
        id: 0,
        sort_order: index + 1,
      })
      return next
    })
    setSelectedIndex(index + 1)
  }

  // Xóa bảng phân cảnh
  function deleteFrag(index: number) {
    if (fragments.length <= 1) return
    setFragments((prev) => prev.filter((_, i) => i !== index))
    setSelectedIndex((cur) => {
      if (cur === index) return Math.max(0, index - 1)
      if (cur > index) return cur - 1
      return cur
    })
  }

  // Lưu tất cả các cảnh quay (được cập nhật bằng ID để tránh làm gián đoạn quá trình tạo trong quá trình mỗi khi ID được xây dựng lại; đánh dấu user_edited để ngăn việc tự động cắt lại và ghi đè)
  async function save() {
    setBusy(true)
    setError('')
    try {
      const ep = await dramaApi.saveFragments(
        eid,
        fragments.map((f, i) => {
          const prevParams =
            f.params && typeof f.params === 'object' && !Array.isArray(f.params)
              ? (f.params as Record<string, unknown>)
              : {}
          return {
            id: typeof f.id === 'number' && f.id > 0 ? f.id : undefined,
            sort_order: i,
            content: f.content,
            cover: f.cover,
            video: f.video,
            duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
            params: { ...prevParams, user_edited: true },
            asset_ids: f.asset_ids || [],
          }
        }),
      )
      setEpisode(ep)
      setFragments(ep.fragments || [])
      setStatus(t('drama.episodeEdit.saved'))
      setEditing(false)
      return ep
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveFailed'))
      throw err
    } finally {
      setBusy(false)
    }
  }

  const {
    planModalOpen,
    setPlanModalOpen,
    generateSelected,
    generateAll,
    activateVideoVersion,
    planFragmentsWithLlm,
    startPlanFragments,
  } = useEpisodeGeneration({
    pid,
    eid,
    episode,
    displayEpisodeName,
    selected,
    selectedIndex,
    selectedDuration,
    fragments,
    assets,
    modelId,
    subtitleMode,
    linkLastFrame,
    continuityBlockedReason,
    continuityQueueHint,
    selectedIsGenerating,
    selectedGenerateLocked,
    generateAllLocked,
    planFragmentsLocked,
    episodeParamsRef,
    save,
    setEpisode,
    setEpisodeParams,
    setFragments,
    setSelectedIndex,
    setEditing,
    setPreviewVersionId,
    setBusy,
    setStatus,
    setError,
  })

  // Quay lại phần tóm tắt cốt truyện
  function handleBack() {
    navigate(`/drama/projects/${pid}`, { state: { activeStep: 'outline' } })
  }

  // Tập chuyển đổi thư mục bên trái
  function handleSelectEpisode(nextId: number) {
    if (nextId === eid) return
    navigate(`/drama/projects/${pid}/episodes/${nextId}`)
  }
  // Lý do không mở được bảng phân cảnh (tác vụ xếp hàng ưu tiên, nếu không thì sử dụng params.Generation.error của bảng phân cảnh)
  function openFragmentFailReason(frag: DramaFragment, index: number) {
    if (!frag.id) return
    const fromQueue = dramaGenQueue.find(
      (j) => j.id === videoJobId(frag.id!) || (j.kind === 'video' && j.targetId === frag.id),
    )
    const gen = readFragmentGenerationStatus(frag)
    const title = `${displayEpisodeName} · ${formatFragLabel(index, frag.duration_sec, t)}`
    setFailReasonJob({
      id: fromQueue?.id || videoJobId(frag.id),
      kind: 'video',
      projectId: pid,
      targetId: frag.id,
      episodeId: eid || undefined,
      taskId: fromQueue?.taskId,
      title: fromQueue?.title || title,
      subtype: t('drama.episodeEdit.shotVideo'),
      status: 'failed',
      error: fromQueue?.error || gen.error || t('drama.episodeEdit.genFailed'),
      createdAt: fromQueue?.createdAt || Date.now(),
    })
  }



  if (!episode) {
    return (
      <div className="drama-ep-fullscreen drama-ep-center">
        {error || t('common.loading')}
      </div>
    )
  }

  // Bản xem trước hiện tại/id bảng phân cảnh đã chọn (được liên kết với thanh chia dưới cùng và chỉnh sửa tập lệnh)
  const playingFragmentId = selected?.id ?? null

  // Đồng bộ hóa trạng thái đã chọn của phần chia dưới cùng khi chuyển đổi phần chia xem trước
  function handlePlayingFragmentChange(fragmentId: number) {
    const index = fragments.findIndex((f) => f.id === fragmentId)
    if (index >= 0) {
      setSelectedIndex(index)
    }
  }

  return (
    <div className="drama-ep-fullscreen">
      <header className="drama-ep-header">
        <div className="drama-ep-header-left">
          <button type="button" className="drama-ep-icon-btn" aria-label={t('drama.episodeEdit.back')} onClick={handleBack}>
            ‹
          </button>
          <h1>{displayEpisodeName}</h1>
        </div>
        <div className="drama-ep-header-controls">
          <EpisodeEditHeaderControls
            styleId={videoStyleId}
            modelId={modelId}
            episodeParams={episodeParams}
            projectParams={projectParams}
            linkLastFrame={linkLastFrame}
            subtitleMode={subtitleMode}
            characterIntroMode={characterIntroMode}
            onStyleChange={setVideoStyleId}
            onModelChange={setModelId}
            onEpisodeOutputChange={handleEpisodeOutputChange}
            onLinkLastFrameChange={(enabled) => void handleLinkLastFrameChange(enabled)}
            onSubtitleModeChange={(mode) => void handleEpisodeSubtitleChange(mode)}
            onCharacterIntroModeChange={(mode) => void handleEpisodeCharacterIntroChange(mode)}
            disabled={busy}
            globalSettingsReadOnly
          />
          <button
            type="button"
            className="drama-ep-btn-ghost"
            disabled={planFragmentsLocked}
            onClick={() => void planFragmentsWithLlm()}
          >
            {busy && status.includes(t('drama.episodeEdit.shotKeyword')) ? t('drama.episodeEdit.shotting') : t('drama.episodeEdit.aiReplan')}
          </button>
          {fragments.some((f) => hasNonLocalizedCues(f.content || '', 'vi')) && (
            <button
              type="button"
              className="drama-ep-btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={async () => {
                const nextFragments = fragments.map((f) => ({
                  ...f,
                  content: localizeScriptCues(f.content || '', 'vi'),
                }))
                setFragments(nextFragments)
                try {
                  await dramaApi.saveFragments(eid, nextFragments)
                  setStatus(t('drama.episodeEdit.convertAllCuesSuccess'))
                } catch {
                  setStatus(t('drama.episodeEdit.convertAllCuesSuccess'))
                }
              }}
              title={t('drama.episodeEdit.convertAllCuesToVi')}
            >
              🌐 {t('drama.episodeEdit.convertAllCuesToVi')}
            </button>
          )}
          {/* 一键生成：暂时隐藏，恢复时去掉 false && */}
          {false && (
            <button
              type="button"
              className="drama-ep-btn-dark drama-ep-header-gen-all"
              disabled={generateAllLocked || fragments.length === 0}
              onClick={() => void generateAll()}
            >
              {busy ? t('drama.episodeEdit.queueing') : t('drama.episodeEdit.genAll')}
            </button>
          )}
        </div>
      </header>

      {(status || error) && (
        <div className="drama-ep-banner">
          {error ? <BillingErrorNotice message={error} className="drama-ep-banner-error" inline /> : null}
          {!error && status ? <span>{status}</span> : null}
        </div>
      )}

      <div className="drama-ep-body">
        <DramaEpisodeDir
          items={buildEpisodeDirItems(episodeList.length ? episodeList : episode ? [episode] : [], t)}
          activeId={eid}
          onSelect={handleSelectEpisode}
        />
        <div className="drama-ep-workspace">
        <EpisodeEditAssetPanel
          scope={assetScope}
          tab={assetTab}
          assets={filteredAssets}
          activeIds={selectedRefIds}
          imageBusyIds={imageBusyIds}
          createBusy={assetCreateBusy}
          onScopeChange={setAssetScope}
          onTabChange={setAssetTab}
          onOpenCanvas={openEpisodeStoryboard}
          onOpenAsset={setDetailAsset}
          onMention={mentionAsset}
          onUnlinkAsset={unlinkSelectedAsset}
          onGenerateVoice={
            DRAMA_VOICE_BINDING_ENABLED
              ? (asset) => void handleGenerateCharacterVoice(asset)
              : undefined
          }
          voiceBusyIds={characterVoiceBusyIds}
          onVoiceError={(message) => setError(message)}
          onCreateAsset={() => void handleCreateSideAsset()}
          onImportAsset={() => setLibraryPickerOpen(true)}
          onAutoDetect={() => void handleAutoDetectAssets()}
          detectBusy={detectBusy}
        />

        <EpisodeEditScriptSection
          eid={eid}
          selected={selected}
          selectedIndex={selectedIndex}
          selectedDuration={selectedDuration}
          episodeParams={episodeParams}
          projectParams={projectParams}
          fragments={fragments}
          assets={assets}
          referencedIds={referencedIds}
          selectedRefItems={selectedRefItems}
          selectedGateIssues={selectedGateIssues}
          linkLastFrame={linkLastFrame}
          continuityBlockedReason={continuityBlockedReason}
          continuityQueueHint={continuityQueueHint}
          prevLastFrameUrl={prevLastFrameUrl}
          editing={editing}
          busy={busy}
          selectedIsGenerating={selectedIsGenerating}
          selectedHasVideo={selectedHasVideo}
          selectedGenerateLocked={selectedGenerateLocked}
          selectedVersions={selectedVersions}
          previewVersionId={previewVersionId}
          onPreviewVersion={setPreviewVersionId}
          onFocusLinkedAsset={focusLinkedAsset}
          onUpdateSelected={updateSelected}
          onSave={save}
          onReload={reload}
          onSetEditing={setEditing}
          onGenerateSelected={() => void generateSelected()}
          onShowCurlModal={() => setShowCurlModal(true)}
          onSetFragments={setFragments}
          onSetStatus={setStatus}
          onSeedFromScript={handleSeedFromScript}
          onPlanFragmentsWithLlm={planFragmentsWithLlm}
        />

        <EpisodeEditSidePane
          fragments={fragments}
          playingFragmentId={playingFragmentId}
          onPlayingFragmentChange={handlePlayingFragmentChange}
          aspectRatio={aspectRatio}
          episodeId={episode?.id}
          episodeName={displayEpisodeName}
          subtitleMode={subtitleMode}
          onOpenStoryboard={openEpisodeStoryboard}
          previewVideoUrl={previewVideoUrl}
          previewPosterUrl={previewPosterUrl}
          previewLabel={
            previewVersion
              ? `v${
                  selectedVersions.length -
                  selectedVersions.findIndex((ver) => ver.id === previewVersion.id)
                }`
              : ''
          }
          onClearPreview={() => setPreviewVersionId(null)}
          onActivatePreview={
            previewVersionId
              ? () => {
                  void activateVideoVersion(previewVersionId)
                }
              : undefined
          }
        />
        </div>
      </div>

      <EpisodeStoryboardFooter
        fragments={fragments}
        selectedIndex={selectedIndex}
        generatingIds={generatingIds}
        activeTasks={episode?.active_tasks}
        busy={busy}
        episodeParams={episodeParams}
        projectParams={projectParams}
        onSelectIndex={setSelectedIndex}
        onInsertFrag={insertFrag}
        onDuplicateFrag={duplicateFrag}
        onDeleteFrag={deleteFrag}
        onOpenFailReason={openFragmentFailReason}
      />

      <FragmentPlanSkillModal
        open={planModalOpen}
        message={t('drama.episodeEdit.replanMessage')}
        onCancel={() => setPlanModalOpen(false)}
        onConfirm={(skillIds) => void startPlanFragments(skillIds)}
      />

      {detailAsset && (detailAsset.type || '').toLowerCase() !== 'voice' ? (
        <DramaAssetDetailModal
          asset={detailAsset}
          open
          busy={imageBusyIds.has(detailAsset.id)}
          genLabel={assetImageGenLabel(detailAsset)}
          onClose={() => setDetailAsset(null)}
          onUpdated={handleCharacterUpdated}
          onGenerate={(a) => enqueueAssetImage(a)}
          onBindVoice={DRAMA_VOICE_BINDING_ENABLED ? (a) => setVoiceBindAsset(a) : undefined}
          onError={(message) => setError(message)}
        />
      ) : null}

      {DRAMA_VOICE_BINDING_ENABLED && voiceBindAsset ? (
        <CharacterVoiceBindModal
          asset={voiceBindAsset}
          projectId={pid}
          open
          onClose={() => setVoiceBindAsset(null)}
          onBound={(updated) => {
            handleCharacterUpdated(updated)
            setVoiceBindAsset(null)
          }}
          onError={(message) => setError(message)}
        />
      ) : null}

      <GlobalAssetPickerModal
        open={libraryPickerOpen}
        onClose={() => setLibraryPickerOpen(false)}
        projectId={pid}
        defaultTab={resolveCreateAssetTab()}
        allowedTypes={
          resolveCreateAssetTab() === 'prop'
            ? ['prop', 'material', 'none']
            : [resolveCreateAssetTab()]
        }
        title={t('drama.episodeEdit.importAssetTitle').replace('{type}', resolveCreateAssetTab() === 'scene' ? t('drama.episodeEdit.scene') : resolveCreateAssetTab() === 'prop' ? t('drama.episodeEdit.prop') : t('drama.episodeEdit.character'))}
        confirmLabel={t('drama.episodeEdit.importToEpisode')}
        onPick={handleImportSideAsset}
      />

      {failReasonJob ? (
        <div className="drama-ep-fail-reason-pop">
          <DramaGenTaskDetail job={failReasonJob} onClose={() => setFailReasonJob(null)} />
        </div>
      ) : null}

      <EpisodeEditCurlModal
        open={showCurlModal}
        onClose={() => setShowCurlModal(false)}
        episodeId={eid}
        fragment={selected}
        fragmentIndex={selectedIndex}
        assets={assets}
        aspectRatio={readEpisodeAspectRatio(episodeParams, projectParams)}
        duration={selectedDuration}
        modelId={modelId}
      />
    </div>
  )
}
