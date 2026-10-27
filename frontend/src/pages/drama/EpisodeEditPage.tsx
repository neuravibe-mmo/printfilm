/** Trình chỉnh sửa tập: Tái tạo bố cục bốn cột của dự án gốc (Assets/Script/Preview/Storyboard) */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
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
import { readEpisodeAspectRatio } from '../../lib/dramaProjectOutputSettings'
import { EpisodeStoryboardFooter } from './EpisodeStoryboardFooter'
import { EpisodeEditScriptSection } from './EpisodeEditScriptSection'
import { useEpisodeContinuity } from './hooks/useEpisodeContinuity'
import { useEpisodeAssetActions } from './hooks/useEpisodeAssetActions'
import { useEpisodeGeneration, readFragmentPlanStatus } from './hooks/useEpisodeGeneration'
import { useEpisodeSettings, coerceProjectBool } from './hooks/useEpisodeSettings'
import { useEpisodeFragmentCrud } from './hooks/useEpisodeFragmentCrud'
import { EpisodeEditModals } from './EpisodeEditModals'
import { useDramaImageGenQueue } from '../../hooks/useDramaImageGenQueue'
import { useMediaModelsCatalog } from '../../hooks/useMediaModelsCatalog'
import { getImageStyleId, isDefaultEpisodeTitle } from './dramaWorkspaceUtils'
import { EpisodeEditAssetPanel } from './EpisodeEditAssetPanel'
import { EpisodeEditHeaderControls } from './EpisodeEditHeaderControls'
import { EpisodeEditSidePane } from './EpisodeEditSidePane'
import { type DramaSubtitleMode } from '../../lib/dramaSubtitleBoard'
import { type DramaCharacterIntroMode } from '../../lib/dramaCharacterIntro'
import {
  readEffectiveCharacterIntroMode,
  readEffectiveSubtitleMode,
} from '../../lib/dramaProjectGlobalSettings'
import { readAssetVoiceBinding } from './CharacterVoiceBindModal'
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

  // ID bản vẽ nội dung hiện đang được xếp hàng/tạo
  const imageBusyIds = useMemo(() => {
    const ids = new Set<number>()
    for (const job of imageGenQueue) {
      if (job.status === 'queued' || job.status === 'running') ids.add(job.assetId)
    }
    return ids
  }, [imageGenQueue])

  // Fragment CRUD operations
  const {
    updateSelected,
    insertFrag,
    duplicateFrag,
    deleteFrag,
    save,
    handleSeedFromScript,
  } = useEpisodeFragmentCrud({
    pid,
    eid,
    epNumber,
    fragments,
    selectedIndex,
    setFragments,
    setSelectedIndex,
    setEditing,
    setBusy,
    setStatus,
    setError,
    setEpisode,
    reload: async () => {
      await reloadRef.current()
    },
  })

  // Asset actions
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

  // Episode AI generation
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

  // Project & episode settings persistence
  const {
    handleLinkLastFrameChange,
    handleEpisodeOutputChange,
    handleEpisodeSubtitleChange,
    handleEpisodeCharacterIntroChange,
  } = useEpisodeSettings({
    pid,
    eid,
    projectParams,
    setProjectParams,
    projectParamsRef,
    episodeParams,
    setEpisodeParams,
    episodeParamsRef,
    linkLastFrame,
    setLinkLastFrame,
    subtitleMode,
    setSubtitleMode,
    characterIntroMode,
    setCharacterIntroMode,
    setAspectRatio,
    fragments,
    setFragments,
    setEpisode,
    setStatus,
    setError,
    generateAll,
  })

  // Phần phụ trợ ứng dụng tạo tiến trình và đồng bộ hóa trạng thái bảng phân cảnh + hàng đợi chung
  function applyGenerateStatus(st: Awaited<ReturnType<typeof dramaApi.generateStatus>>) {
    setStatus(
      t('drama.episodeEdit.syncProgress')
        .replace('{done}', String(st.done))
        .replace('{total}', String(st.total))
        .replace('{running}', String(st.running))
        .replace('{failed}', String(st.failed)),
    )
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
            setStatus(
              t('drama.episodeEdit.planAiDone').replace(
                '{count}',
                String((cur.fragments || []).length),
              ),
            )
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
          <button
            type="button"
            className="drama-ep-back-btn"
            aria-label={t('drama.episodeEdit.back')}
            title={t('drama.episodeEdit.back')}
            onClick={handleBack}
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
          <div className="drama-ep-header-title-wrap">
            <h1 className="drama-ep-header-title">{displayEpisodeName}</h1>
          </div>
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
            {busy && status.includes(t('drama.episodeEdit.shotKeyword'))
              ? t('drama.episodeEdit.shotting')
              : t('drama.episodeEdit.aiReplan')}
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

      <EpisodeEditModals
        projectId={pid}
        episodeId={eid}
        planModalOpen={planModalOpen}
        onCancelPlanModal={() => setPlanModalOpen(false)}
        onConfirmPlanModal={(skillIds) => void startPlanFragments(skillIds)}
        detailAsset={detailAsset}
        imageBusyIds={imageBusyIds}
        assetImageGenLabel={assetImageGenLabel}
        onCloseDetailAsset={() => setDetailAsset(null)}
        onCharacterUpdated={handleCharacterUpdated}
        onEnqueueAssetImage={enqueueAssetImage}
        onSetVoiceBindAsset={DRAMA_VOICE_BINDING_ENABLED ? (a) => setVoiceBindAsset(a) : undefined}
        onError={(message) => setError(message)}
        voiceBindAsset={voiceBindAsset}
        onCloseVoiceBind={() => setVoiceBindAsset(null)}
        libraryPickerOpen={libraryPickerOpen}
        onCloseLibraryPicker={() => setLibraryPickerOpen(false)}
        resolveCreateAssetTab={resolveCreateAssetTab}
        onImportSideAsset={handleImportSideAsset}
        failReasonJob={failReasonJob}
        onCloseFailReasonJob={() => setFailReasonJob(null)}
        showCurlModal={showCurlModal}
        onCloseCurlModal={() => setShowCurlModal(false)}
        selected={selected}
        selectedIndex={selectedIndex}
        assets={assets}
        aspectRatio={readEpisodeAspectRatio(episodeParams, projectParams)}
        selectedDuration={selectedDuration}
        modelId={modelId}
      />
    </div>
  )
}
