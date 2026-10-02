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
  fragmentQueueBadgeLabel,
  isFragmentGenerationBusy,
  normalizeAssetTab,
  readFragmentGenerationStatus,
  readFragmentVideoVersions,
  resolveFragmentDurationSec,
  type AssetScope,
  type AssetTab,
} from './dramaEpisodeEditUtils'
import {
  enqueueEpisodeVideoJobs,
  ensureEpisodeVideoStatusPoll,
  subscribeEpisodeGenerateStatus,
  syncEpisodeVideoJobs,
  useDramaGenQueue,
  videoJobId,
  type DramaGenJob,
} from '../../lib/dramaGenQueue'
import { hasChineseCues, localizeScriptCues } from '../../lib/dramaCueI18n'
import {
  collectDramaGenerateGateIssues,
  formatDramaGateMessage,
} from '../../lib/dramaEpisodeScriptValidate'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import { dialog } from '../../lib/dialog'
import {
  formatProjectOutputLabel,
  readEpisodeAspectRatio,
  readEpisodeResolution,
} from '../../lib/dramaProjectOutputSettings'
import { DramaFragmentClipSpec } from '../../components/drama/DramaFragmentClipSpec'
import { FragmentPlanSkillModal } from '../../components/drama/FragmentPlanSkillModal'
import { DramaGenTaskDetail } from '../../components/drama/DramaGenTaskDetail'
import { CircleAlert } from 'lucide-react'
import { useDramaImageGenQueue } from '../../hooks/useDramaImageGenQueue'
import { useMediaModelsCatalog } from '../../hooks/useMediaModelsCatalog'
import { enqueueDramaImageGen } from '../../lib/dramaImageGenQueue'
import { defaultOptionsForAssetKind } from '../../lib/dramaGenerationOptions'
import { dramaAssetImageGenButtonLabel } from '../../lib/dramaAssetImage'
import { readVisualPrompt } from '../../lib/dramaVisualPrompt'
import { generateAndBindCharacterVoice } from '../../lib/characterVoiceGenerate'
import { getImageStyleId, isDefaultEpisodeTitle } from './dramaWorkspaceUtils'
import { EpisodeEditAssetPanel } from './EpisodeEditAssetPanel'
import { EpisodeEditHeaderControls } from './EpisodeEditHeaderControls'
import { EpisodeEditPromptEditor } from './EpisodeEditPromptEditor'
import { EpisodeEditReferenceStrip } from './EpisodeEditReferenceStrip'
import { EpisodeEditSidePane } from './EpisodeEditSidePane'
import {
  GlobalAssetPickerModal,
  importGlobalAssetToProject,
} from './GlobalAssetPickerModal'
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

function readFragmentPlanStatus(ep: DramaEpisode | null): string {
  // Ưu tiên đọc các nhiệm vụ lập kế hoạch bảng phân cảnh trong trung tâm nhiệm vụ thống nhất; trạng thái thông số cũ được sử dụng làm bản sao lưu
  const active = (ep?.active_tasks || []).find((task) => task.task_type === 'fragment_plan')
  if (
    active &&
    !active.cancel_requested &&
    ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review'].includes(active.status)
  ) {
    return 'generating'
  }
  const st = ep?.params?.fragment_plan_status
  return typeof st === 'string' ? st : ''
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
  // planModalOpen Xác nhận lại bảng phân cảnh AI (bao gồm Kiểm tra kỹ năng)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [characterVoiceBusyIds, setCharacterVoiceBusyIds] = useState<Set<number>>(() => new Set())
  /*
   * chi tiết Chi tiết tài sản còn lại của tài sản (chỉnh sửa/tái tạo/tải lên)
   * voiceBindAsset Mục tiêu cửa sổ bật lên liên kết bằng giọng nói
   * imageGenQueue ảnh chụp nhanh hàng đợi tạo hình ảnh toàn cầu
   */
  const [detailAsset, setDetailAsset] = useState<DramaAsset | null>(null)
  const [voiceBindAsset, setVoiceBindAsset] = useState<DramaAsset | null>(null)
  /** failedReasonJob Nguyên nhân không mở được dấu chấm than gương dưới */
  const [failReasonJob, setFailReasonJob] = useState<DramaGenJob | null>(null)
  // assetsCreateBusy/libraryPickerOpen Tạo và nhập thanh bên
  const [assetCreateBusy, setAssetCreateBusy] = useState(false)
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false)
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

  // prevLastFrameUrl Khung cuối cùng của khung cuối cùng (được kết nối với điều kiện kích hoạt; tương thích với trường phiên bản tạo / lịch sử)
  const prevLastFrameUrl = useMemo(() => {
    if (selectedIndex <= 0) return ''
    const prev = fragments[selectedIndex - 1]
    const params = prev?.params
    if (!params || typeof params !== 'object') return ''
    const rec = params as Record<string, unknown>
    const fromTop = rec.lastFrameUrl
    if (typeof fromTop === 'string' && fromTop.trim()) return fromTop.trim()
    const gen = rec.generation
    if (gen && typeof gen === 'object') {
      const fromGen = (gen as Record<string, unknown>).lastFrameUrl
      if (typeof fromGen === 'string' && fromGen.trim()) return fromGen.trim()
    }
    const versions = readFragmentVideoVersions(prev)
    for (const ver of versions) {
      if (ver.lastFrameUrl && ver.lastFrameUrl.trim()) return ver.lastFrameUrl.trim()
    }
    return ''
  }, [fragments, selectedIndex])

  // Khi kết nối khung hình cuối cùng được bật: nó chỉ bị tắt nếu ảnh trước đó chưa bao giờ được tạo; trong khi ảnh trước đó đang được tạo/xếp hàng, ảnh này có thể được xếp hàng chờ.
  const continuityBlockedReason = useMemo(() => {
    if (!linkLastFrame || selectedIndex <= 0) return ''
    const prev = fragments[selectedIndex - 1]
    if (!prev) return t('drama.episodeEdit.noPrevFrame')
    if (prev.id && generatingIds.has(prev.id)) {
      return ''
    }
    const prevDone =
      Boolean((prev.video || '').trim()) ||
      readFragmentGenerationStatus(prev).status === 'done' ||
      Boolean(prevLastFrameUrl)
    if (!prevDone) {
      return t('drama.episodeEdit.waitPrevFrame')
    }
    return ''
  }, [linkLastFrame, selectedIndex, fragments, generatingIds, prevLastFrameUrl])

  const continuityQueueHint = useMemo(() => {
    if (!linkLastFrame || selectedIndex <= 0) return ''
    const prev = fragments[selectedIndex - 1]
    if (!prev?.id || !generatingIds.has(prev.id)) return ''
    return t('drama.episodeEdit.prevQueueing')
  }, [linkLastFrame, selectedIndex, fragments, generatingIds])

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

  // Xác định xem có thể bỏ qua "tạo bằng một cú nhấp chuột" một cách an toàn hay không: chỉ bỏ qua các bảng phân cảnh cũ chưa được thay đổi và đã hoàn thành.
  function shouldSkipGenerateAllFragment(frag: DramaFragment): boolean {
    if (!frag.video || !frag.id) return false
    const prev = (episode?.fragments || []).find((item) => item.id === frag.id)
    if (!prev?.video) return false
    const sameContent = (prev.content || '') === (frag.content || '')
    const sameCover = (prev.cover || '') === (frag.cover || '')
    const sameDuration =
      resolveFragmentDurationSec(prev.content || '', prev.duration_sec) ===
      resolveFragmentDurationSec(frag.content || '', frag.duration_sec)
    const prevAssetIds = [...(prev.asset_ids || [])].sort((a, b) => a - b)
    const nextAssetIds = [...(frag.asset_ids || [])].sort((a, b) => a - b)
    const sameAssets =
      prevAssetIds.length === nextAssetIds.length &&
      prevAssetIds.every((id, index) => id === nextAssetIds[index])
    return sameContent && sameCover && sameDuration && sameAssets
  }

  // Chỉ tạo storyboard hiện đang được chọn (lưu và cập nhật theo id, id trả về sau khi lưu vẫn được sử dụng trước khi tạo)
  async function generateSelected() {
    if (!selected) {
      setError(t('drama.episodeEdit.selectFrag'))
      return
    }
    if (selectedGenerateLocked) {
      if (continuityBlockedReason) {
        setError(continuityBlockedReason)
        await dialog.alert({
          title: t('drama.episodeEdit.cannotGenTitle'),
          message: `${continuityBlockedReason}. ${t('drama.episodeEdit.needPrevFrame')}`,
        })
      } else if (selectedIsGenerating) {
        setError(t('drama.episodeEdit.waitCurrent'))
      } else {
        setError(t('drama.episodeEdit.waitOp'))
      }
      return
    }

    const { blocking, warnings } = collectDramaGenerateGateIssues(selected, assets)
    if (blocking.length > 0) {
      setError(blocking.map((i) => i.message).join('；'))
      await dialog.alert({
        title: t('drama.episodeEdit.cannotGenTitle'),
        message: formatDramaGateMessage(blocking, warnings, t('drama.episodeEdit.fixScriptFirst')),
      })
      return
    }

    const fragLabel = formatFragLabel(selectedIndex, selectedDuration, t)
    const isRegen = Boolean(selected.video)
    const ok = await dialog.confirm({
      title: isRegen ? t('drama.episodeEdit.regenVideoTitle') : t('drama.episodeEdit.genVideoTitle'),
      message: formatDramaGateMessage(
        [],
        warnings,
        isRegen
          ? t('drama.episodeEdit.regenFragMsg').replace('{label}', fragLabel)
          : linkLastFrame
            ? continuityQueueHint
              ? t('drama.episodeEdit.saveQueueMsg').replace('{label}', fragLabel).replace('{hint}', continuityQueueHint)
              : t('drama.episodeEdit.saveTailMsg').replace('{label}', fragLabel)
            : t('drama.episodeEdit.saveIndepMsg').replace('{label}', fragLabel),
      ),
      confirmText: warnings.length > 0 ? t('drama.episodeEdit.genAnyway') : isRegen ? t('drama.episodeEdit.regenConfirm') : t('drama.episodeEdit.genConfirm'),
    })
    if (!ok) return
    setBusy(true)
    setError('')
    setStatus(isRegen ? t('drama.episodeEdit.statusRegenQueue') : t('drama.episodeEdit.statusGenQueue'))
    try {
      const ep = await save()
      setBusy(true)
      const frag = (ep.fragments || [])[selectedIndex]
      if (!frag?.id) {
        throw new Error(t('drama.episodeEdit.fragNotFound'))
      }
      await dramaApi.generateEpisode(eid, [frag.id], modelId)
      // Ghi tối ưu vào trạng thái xếp hàng để tránh tình trạng video cũ ghi đè lên trạng thái đã hoàn thành
      setFragments((prev) =>
        prev.map((f) =>
          f.id === frag.id
            ? {
                ...f,
                params: {
                  ...(f.params || {}),
                  generation: { status: 'queued', message: t('drama.episodeEdit.queued') },
                },
              }
            : f,
        ),
      )
      enqueueEpisodeVideoJobs({
        projectId: pid,
        episodeId: eid,
        episodeName: displayEpisodeName,
        fragments: (ep.fragments || []).map((f, i) => ({
          id: f.id,
          sort_order: f.sort_order ?? i,
        })),
        fragmentIds: [frag.id],
      })
      setBusy(false)
      setStatus(isRegen ? t('drama.episodeEdit.regenQueued').replace('{label}', fragLabel) : t('drama.episodeEdit.genQueued').replace('{label}', fragLabel))
      ensureEpisodeVideoStatusPoll()
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.genFailed'))
    }
  }

  // Chuyển video lịch sử sang video xem trước hiện tại
  async function activateVideoVersion(versionId: string) {
    if (!selected?.id || selectedIsGenerating) return
    const ok = await dialog.confirm({
      title: t('drama.episodeEdit.switchVersionTitle'),
      message: t('drama.episodeEdit.switchVersionMessage'),
      confirmText: t('drama.episodeEdit.switchVersionConfirm'),
    })
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      const result = await dramaApi.activateFragmentVideoVersion(selected.id, versionId)
      setFragments((prev) =>
        prev.map((f) =>
          f.id === selected.id
            ? {
                ...f,
                video: result.video,
                cover: result.cover || '',
                params: {
                  ...(f.params || {}),
                  video_versions: result.video_versions,
                  lastFrameUrl: result.lastFrameUrl || undefined,
                  generation: {
                    status: 'done',
                    video: result.video,
                    cover: result.cover,
                    lastFrameUrl: result.lastFrameUrl,
                  },
                },
              }
            : f,
        ),
      )
      setPreviewVersionId(null)
      setStatus(t('drama.episodeEdit.versionSwitched'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.switchVersionFailed'))
    } finally {
      setBusy(false)
    }
  }

  // Tạo bằng một cú nhấp chuột: Bảng phân cảnh cho tập này của "Force Regen" (forceRegen bao gồm các phim hiện có)
  async function generateAll(opts?: { forceRegen?: boolean; skipConfirm?: boolean }) {
    if (fragments.length === 0) {
      setError(t('drama.episodeEdit.noFrags'))
      return
    }
    if (generateAllLocked) {
      setError(t('drama.episodeEdit.submitting'))
      return
    }

    const allBlocking: string[] = []
    const allWarnings: string[] = []
    const doneIndices: number[] = []
    for (let i = 0; i < fragments.length; i++) {
      if (!opts?.forceRegen && shouldSkipGenerateAllFragment(fragments[i])) {
        doneIndices.push(i)
        continue
      }
      const { blocking, warnings } = collectDramaGenerateGateIssues(fragments[i], assets)
      const label = formatFragLabel(i, fragments[i]?.duration_sec, t)
      for (const issue of blocking) allBlocking.push(`${label}：${issue.message}`)
      for (const issue of warnings) allWarnings.push(`${label}：${issue.message}`)
    }
    const pendingCount = fragments.length - doneIndices.length
    if (pendingCount <= 0) {
      setStatus(t('drama.episodeEdit.allDoneSkip'))
      return
    }
    if (allBlocking.length > 0) {
      setError(allBlocking[0] || t('drama.episodeEdit.validateFailed'))
      await dialog.alert({
        title: t('drama.episodeEdit.cannotGenAllTitle'),
        message: [t('drama.episodeEdit.fixFirst'), '', ...allBlocking.slice(0, 8).map((m) => `· ${m}`)].join(
          '\n',
        ),
      })
      return
    }

    if (!opts?.skipConfirm) {
      const ok = await dialog.confirm({
        title: opts?.forceRegen ? t('drama.episodeEdit.regenAllTitle') : t('drama.episodeEdit.genAllTitle'),
        message: formatDramaGateMessage(
          [],
          allWarnings.slice(0, 8).map((message) => ({ level: 'warn' as const, message })),
          opts?.forceRegen
            ? t('drama.episodeEdit.regenAllMsg').replace('{n}', String(pendingCount))
            : linkLastFrame
              ? t('drama.episodeEdit.genAllSeqMsg').replace('{n}', String(pendingCount)).replace('{done}', String(doneIndices.length))
              : t('drama.episodeEdit.genAllParMsg').replace('{n}', String(pendingCount)).replace('{done}', String(doneIndices.length)),
        ),
        confirmText: allWarnings.length > 0 ? t('drama.episodeEdit.genAllAnyway') : opts?.forceRegen ? t('drama.episodeEdit.regenAllConfirm') : t('drama.episodeEdit.genAllConfirm'),
        tone: 'danger',
      })
      if (!ok) return
    }
    setBusy(true)
    setError('')
    setStatus(t('drama.episodeEdit.statusGenAll').replace('{n}', String(pendingCount)))
    try {
      const ep = await save()
      setBusy(true)
      const ids = (ep.fragments || [])
        .filter((_, index) => !doneIndices.includes(index))
        .map((f) => f.id)
        .filter((id): id is number => typeof id === 'number' && id > 0)
      if (ids.length === 0) {
        setStatus(t('drama.episodeEdit.allDoneAfterSave'))
        setBusy(false)
        return
      }
      const genResult = await dramaApi.generateEpisode(eid, ids, modelId)
      const queuedIds =
        Array.isArray(genResult.fragment_ids) && genResult.fragment_ids.length > 0
          ? genResult.fragment_ids
          : ids
      enqueueEpisodeVideoJobs({
        projectId: pid,
        episodeId: eid,
        episodeName: displayEpisodeName,
        fragments: (ep.fragments || []).map((f, i) => ({
          id: f.id,
          sort_order: f.sort_order ?? i,
        })),
        fragmentIds: queuedIds,
      })
      const deferred = Number(genResult.deferred_count || 0)
      const limit = Number(genResult.user_job_limit || 0)
      if (deferred > 0 && limit > 0) {
        setStatus(
          t('drama.episodeEdit.queuedWithLimit').replace('{n}', String(queuedIds.length)).replace('{limit}', String(limit)).replace('{deferred}', String(deferred)),
        )
      } else {
        setStatus(t('drama.episodeEdit.queuedN').replace('{n}', String(queuedIds.length)))
      }
      setBusy(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.genAllFailed'))
      setBusy(false)
    }
  }

  // Quay lại phần tóm tắt cốt truyện
  function handleBack() {
    navigate(`/drama/projects/${pid}`, { state: { activeStep: 'outline' } })
  }

  // Tập chuyển đổi thư mục bên trái
  function handleSelectEpisode(nextId: number) {
    if (nextId === eid) return
    navigate(`/drama/projects/${pid}/episodes/${nextId}`)
  }

  // Bản phân cảnh lại LLM một tập: Xác nhận và kiểm tra Kỹ năng trước khi tham gia nhóm
  function planFragmentsWithLlm() {
    if (planFragmentsLocked) {
      setError(t('drama.episodeEdit.genRunning'))
      return
    }
    setPlanModalOpen(true)
  }

  // Sau khi tham gia hàng đợi, hãy thăm dò cho đến khi hoàn thành (phương thức phụ đề tuân theo cài đặt hiện tại của thanh trên cùng)
  async function startPlanFragments(skillIds: number[]) {
    setPlanModalOpen(false)
    setBusy(true)
    setError('')
    setStatus(t('drama.episodeEdit.aiPlanning'))
    try {
      await dramaApi.planEpisodeFragments(eid, {
        force: true,
        fallback_rules: true,
        skill_ids: skillIds,
        subtitle_enabled: subtitleModeUsesModelOutput(subtitleMode),
      })
      const started = Date.now()
      while (Date.now() - started < 10 * 60 * 1000) {
        await new Promise((r) => setTimeout(r, 2500))
        const ep = await dramaApi.getEpisode(eid)
        const st = readFragmentPlanStatus(ep)
        if (st === 'completed') {
          setEpisode(ep)
          const nextParams = (ep.params as Record<string, unknown>) || {}
          setEpisodeParams(nextParams)
          episodeParamsRef.current = nextParams
          setFragments(ep.fragments || [])
          setSelectedIndex(0)
          setEditing(false)
          const mode = String(ep.params?.fragment_plan_mode || 'llm')
          const count = Number(ep.params?.fragment_plan_count) || (ep.fragments || []).length
          setStatus(
            mode === 'rules_fallback'
              ? t('drama.episodeEdit.planRulesFallback').replace('{count}', String(count))
              : t('drama.episodeEdit.planAiDone').replace('{count}', String(count)),
          )
          setBusy(false)
          return
        }
        if (st === 'failed') {
          const msg = String(ep.params?.fragment_plan_error || t('drama.episodeEdit.aiFailed'))
          setError(msg)
          setBusy(false)
          return
        }
        setStatus(t('drama.episodeEdit.aiPlanning'))
      }
      throw new Error(t('drama.episodeEdit.aiTimeout'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.aiFailed'))
      setBusy(false)
    }
  }

  // Nhấp vào nội dung để chèn tham chiếu @
  function mentionAsset(asset: DramaAsset) {
    if (!selected) return
    const mention = `@asset:${asset.id}`
    const raw = selected.content || ''
    const already = new RegExp(`@asset:${asset.id}(?!\\d)`).test(raw)
    const content = already ? raw : raw ? `${raw.trimEnd()}\n${mention}` : mention
    const ids = Array.from(new Set([...(selected.asset_ids || []), asset.id]))
    updateSelected({ content, asset_ids: ids })
    setEditing(true)
  }

  // Phân tích loại nội dung hiện được tạo trong thanh bên (vai trò mặc định khi không có danh mục nào được chọn)
  function resolveCreateAssetTab(): AssetTab {
    return assetTab || 'character'
  }

  // Sau khi tạo xong tập mới, hãy treo nó vào bảng phân cảnh hiện tại và mở phần chi tiết để có thể xem ngay danh sách tập này
  function adoptCreatedAsset(created: DramaAsset, kind: AssetTab) {
    setAssets((prev) => (prev.some((a) => a.id === created.id) ? prev : [...prev, created]))
    setAssetTab(kind)
    mentionAsset(created)
    if ((created.type || '').toLowerCase() !== 'voice') {
      setDetailAsset(created)
    }
  }

  // Tùy chỉnh nhân vật/cảnh/đạo cụ mới
  async function handleCreateSideAsset() {
    const kind = resolveCreateAssetTab()
    const label = kind === 'scene' ? t('drama.episodeEdit.scene') : kind === 'prop' ? t('drama.episodeEdit.prop') : t('drama.episodeEdit.character')
    const name = await dialog.prompt({
      title: t('drama.episodeEdit.createAssetTitle').replace('{label}', label),
      message: t('drama.episodeEdit.createAssetMsg').replace('{label}', label),
      placeholder: kind === 'scene' ? t('drama.episodeEdit.scenePlaceholder') : kind === 'prop' ? t('drama.episodeEdit.propPlaceholder') : t('drama.episodeEdit.characterPlaceholder'),
      confirmText: t('drama.episodeEdit.createConfirm'),
    })
    if (!name?.trim()) return
    setAssetCreateBusy(true)
    setError('')
    try {
      const created = await dramaApi.createAsset({
        project_id: pid,
        type: kind,
        asset_type: 'image',
        name: name.trim(),
        params: { kind },
      })
      adoptCreatedAsset(created, kind)
      setStatus(t('drama.episodeEdit.assetCreated').replace('{label}', label).replace('{name}', created.name || ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.assetCreateFailed').replace('{label}', label))
    } finally {
      setAssetCreateBusy(false)
    }
  }

  // Nhập từ thư viện nội dung toàn cầu vào dự án này và đính kèm vào bảng phân cảnh hiện tại
  async function handleImportSideAsset(source: DramaAsset) {
    const kind = normalizeAssetTab(source.type) || resolveCreateAssetTab()
    setAssetCreateBusy(true)
    setError('')
    try {
      const created = await importGlobalAssetToProject(pid, source)
      adoptCreatedAsset(created, kind)
      setLibraryPickerOpen(false)
      setStatus(t('drama.episodeEdit.assetImported').replace('{name}', created.name || ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.importFailed'))
      throw err
    } finally {
      setAssetCreateBusy(false)
    }
  }

  // Chỉ hủy liên kết bảng phân cảnh hiện tại với nội dung (không xóa nội dung dự án)
  function unlinkSelectedAsset(assetId: number) {
    if (!selected) return
    const content = (selected.content || '')
      .replace(new RegExp(`\\s*@asset:${assetId}(?!\\d)`, 'g'), ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    const asset_ids = (selected.asset_ids || []).filter((id) => id !== assetId)
    updateSelected({ content, asset_ids })
    setEditing(true)
    const name = assets.find((a) => a.id === assetId)?.name
    setStatus(
      name
        ? t('drama.episodeEdit.unlinkAsset').replace('{name}', name)
        : t('drama.episodeEdit.unlinkNoName'),
    )
  }

  // Chuyển từ thanh liên kết đến danh mục tương ứng và mở chi tiết tài sản
  function focusLinkedAsset(assetId: number) {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return
    const tab = normalizeAssetTab(asset.type)
    if (tab) setAssetTab(tab)
    setAssetScope('series')
    if ((asset.type || '').toLowerCase() !== 'voice') {
      setDetailAsset(asset)
    }
  }

  // Cập nhật nội dung (làm mới danh sách và chi tiết sau khi liên kết âm sắc/tải lên/tạo hình ảnh)
  function handleCharacterUpdated(updated: DramaAsset) {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setDetailAsset((prev) => (prev?.id === updated.id ? updated : prev))
  }

  // ID bản vẽ nội dung hiện đang được xếp hàng/tạo
  const imageBusyIds = useMemo(() => {
    const ids = new Set<number>()
    for (const job of imageGenQueue) {
      if (job.status === 'queued' || job.status === 'running') ids.add(job.assetId)
    }
    return ids
  }, [imageGenQueue])

  // Chi tiết sao chép nút hình ảnh cửa sổ bật lên
  function assetImageGenLabel(asset: DramaAsset): string {
    const job = imageGenQueue.find(
      (j) =>
        j.assetId === asset.id && (j.status === 'queued' || j.status === 'running'),
    )
    let queueLabel: string | null = null
    if (job) {
      if (job.status === 'running') queueLabel = t('drama.episodeEdit.generating')
      else {
        const queuedOnly = imageGenQueue.filter(
          (j) => j.status === 'queued' || j.status === 'running',
        )
        const pos = queuedOnly.findIndex((j) => j.id === job.id) + 1
        queueLabel = pos > 1 ? t('drama.episodeEdit.queuePos').replace('{pos}', String(pos)) : t('drama.episodeEdit.queueing')
      }
    }
    return dramaAssetImageGenButtonLabel(asset, queueLabel)
  }

  // Thêm biểu đồ tài sản vào hàng đợi chung
  function enqueueAssetImage(asset: DramaAsset) {
    if (imageBusyIds.has(asset.id)) return
    const options = {
      ...defaultOptionsForAssetKind(asset.type),
      image_style_id: videoStyleId || undefined,
    }
    void enqueueDramaImageGen({
      projectId: pid,
      assetId: asset.id,
      assetName: asset.name || undefined,
      assetType: asset.type,
      prompt: readVisualPrompt(asset),
      options,
      onAssetUpdate: handleCharacterUpdated,
    })
      .then((updated) => handleCharacterUpdated(updated))
      .catch((err) => setError(err instanceof Error ? err.message : t('drama.episodeEdit.genImageFailed')))
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

  // AI chỉ bằng một cú nhấp chuột sẽ tạo ra âm sắc của các ký tự và liên kết chúng (mỗi ký tự bận độc lập và không chặn lẫn nhau)
  async function handleGenerateCharacterVoice(asset: DramaAsset) {
    if (characterVoiceBusyIds.has(asset.id)) return
    setCharacterVoiceBusyIds((prev) => new Set(prev).add(asset.id))
    setError('')
    try {
      const { character, voice } = await generateAndBindCharacterVoice(pid, asset)
      handleCharacterUpdated(character)
      setAssets((prev) => (prev.some((a) => a.id === voice.id) ? prev : [...prev, voice]))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.voiceFailed'))
    } finally {
      setCharacterVoiceBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(asset.id)
        return next
      })
    }
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
          {fragments.some((f) => hasChineseCues(f.content || '')) && (
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
        />

        <section className="drama-ep-editor">
          <div className="drama-ep-editor-head">
            <div>
              <strong>{formatFragLabel(selectedIndex, selectedDuration, t)}</strong>
              <p>
                {t('drama.episodeEdit.tipAtRef')}{' '}
                {formatProjectOutputLabel(
                  readEpisodeAspectRatio(episodeParams, projectParams),
                  readEpisodeResolution(episodeParams, projectParams),
                )}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {hasChineseCues(selected?.content || '') && (
                <button
                  type="button"
                  className="drama-ep-btn drama-ep-btn-subtle"
                  style={{ fontSize: '0.8rem', padding: '4px 10px', height: 'auto', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    if (!selected) return
                    const localized = localizeScriptCues(selected.content || '', 'vi')
                    updateSelected({ content: localized })
                    setStatus(t('drama.episodeEdit.convertCuesSuccess'))
                  }}
                  title={t('drama.episodeEdit.convertCuesToVi')}
                >
                  🌐 {t('drama.episodeEdit.convertCuesToVi')}
                </button>
              )}
              <label className="drama-ep-duration">
                {t('drama.episodeEdit.duration')}
                <input
                  type="number"
                  min={4}
                  max={15}
                  value={selectedDuration}
                  disabled={!editing && !selected}
                  onChange={(e) =>
                    updateSelected({ duration_sec: Number(e.target.value) || 8 })
                  }
                />
                s
              </label>
            </div>
          </div>

          <EpisodeEditReferenceStrip items={selectedRefItems} onSelect={focusLinkedAsset} />

          <div className={`drama-ep-editor-box ${editing ? 'editing' : ''}`}>
            <EpisodeEditPromptEditor
              content={selected?.content || ''}
              assets={assets}
              referencedIds={referencedIds}
              editing={editing}
              onOpenAsset={focusLinkedAsset}
              onContentChange={(nextContent) => {
                const fromContent = extractAssetIds(nextContent)
                const prevContentIds = extractAssetIds(selected?.content || '')
                const removed = prevContentIds.filter((id) => !fromContent.includes(id))
                /* Các tham chiếu đã xóa trong văn bản sẽ được di chuyển đồng bộ ra khỏi assets_ids; chỉ các liên kết bổ sung tồn tại trong assets_ids mới được giữ lại. */
                const prevContentIdSet = new Set(prevContentIds)
                const keptExtra = (selected?.asset_ids || []).filter(
                  (id) => !prevContentIdSet.has(id) || fromContent.includes(id),
                )
                updateSelected({
                  content: nextContent,
                  asset_ids: Array.from(new Set([...keptExtra, ...fromContent])),
                })
                if (removed.length > 0) {
                  setStatus(t('drama.episodeEdit.unlinkNoName'))
                }
              }}
            />

          {selectedGateIssues.length > 0 ? (
            <ul className="drama-ep-script-issues" aria-live="polite">
              {selectedGateIssues.map((issue) => (
                <li
                  key={`${issue.level}:${issue.message}`}
                  className={
                    issue.level === 'error'
                      ? 'drama-ep-script-issue is-error'
                      : 'drama-ep-script-issue is-warn'
                  }
                >
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}

          {linkLastFrame && selectedIndex > 0 ? (
            <p
              className={`drama-ep-continuity-hint${
                !continuityBlockedReason ? ' is-ready' : ' is-wait'
              }`}
            >
              {continuityBlockedReason
                ? t('drama.episodeEdit.continuityEnabled').replace('{reason}', continuityBlockedReason)
                : continuityQueueHint
                  ? continuityQueueHint
                  : prevLastFrameUrl
                    ? t('drama.episodeEdit.continuityWithPrev')
                    : t('drama.episodeEdit.continuityAutoTail')}
            </p>
          ) : !linkLastFrame ? (
            <p className="drama-ep-continuity-hint">
              {t('drama.episodeEdit.noTailContinuity')}
            </p>
          ) : null}

          <div className="drama-ep-editor-actions">
            {editing ? (
              <>
                <button
                  type="button"
                  className="drama-ep-btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false)
                    void reload()
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="drama-ep-btn-dark"
                  disabled={busy}
                  onClick={() => void save()}
                >
                  {busy ? t('common.saving') : t('common.save')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="drama-ep-btn-ghost"
                  disabled={!selected || selectedIsGenerating || busy}
                  onClick={() => setEditing(true)}
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  className="drama-ep-btn-dark"
                  disabled={selectedGenerateLocked || !selected}
                  title={
                    continuityBlockedReason ||
                    continuityQueueHint ||
                    (selectedIsGenerating ? t('drama.episodeEdit.generating') : undefined)
                  }
                  onClick={() => void generateSelected()}
                >
                  {selectedIsGenerating
                    ? t('drama.episodeEdit.generating')
                    : busy
                      ? t('drama.episodeEdit.processing')
                      : continuityQueueHint
                        ? t('drama.episodeEdit.queued')
                        : continuityBlockedReason
                          ? t('drama.episodeEdit.waiting')
                          : selectedHasVideo
                          ? t('drama.episodeEdit.regenConfirm')
                          : t('drama.episodeEdit.genConfirm')}
                </button>
              </>
            )}
          </div>
          </div>

          {selectedVersions.length > 0 && selected?.id ? (
            <div className="drama-ep-versions">
              <span className="drama-ep-versions-label">{t('drama.episodeEdit.history')}</span>
              <div className="drama-ep-versions-list">
                {selectedHasVideo && selected.video ? (
                  <button
                    type="button"
                    className={`drama-ep-version is-active${!previewVersionId ? ' is-current' : ''}`}
                    disabled={busy || selectedIsGenerating}
                    title={t('drama.episodeEdit.currentVersion')}
                    onClick={() => setPreviewVersionId(null)}
                  >
                    {selected.cover ? (
                      <img src={resolveDramaMediaUrl(selected.cover)} alt="" />
                    ) : (
                      <video src={resolveDramaMediaUrl(selected.video)} muted />
                    )}
                    <em>{t('drama.episodeEdit.current')}</em>
                  </button>
                ) : null}
                {selectedVersions.map((ver, index) => {
                  const cover = ver.cover ? resolveDramaMediaUrl(ver.cover) : ''
                  const video = resolveDramaMediaUrl(ver.video)
                  const versionNo = selectedVersions.length - index
                  return (
                    <button
                      key={ver.id}
                      type="button"
                      className={`drama-ep-version${previewVersionId === ver.id ? ' is-previewing' : ''}`}
                      disabled={busy || selectedIsGenerating}
                      title={t('drama.episodeEdit.previewOrSwitch')}
                      onClick={() => setPreviewVersionId(ver.id)}
                    >
                      {cover ? <img src={cover} alt="" /> : <video src={video} muted />}
                      <em>v{versionNo}</em>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </section>

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

      <footer className="drama-ep-storyboard">
        <div className="drama-ep-storyboard-row">
          <button
            type="button"
            className="drama-ep-insert"
            aria-label={t('drama.episodeEdit.insertAtTop')}
            onClick={() => insertFrag(0)}
          >
            +
          </button>
          {fragments.map((frag, index) => {
            const genInfo = readFragmentGenerationStatus(frag)
            const fragStatus = genInfo.status
            const activeVideoTask = (episode?.active_tasks || []).find(
              (task) =>
                task.task_type === 'fragment_video' &&
                task.fragment_id === frag.id &&
                !task.cancel_requested &&
                ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review'].includes(
                  task.status,
                ),
            )
            // Trạng thái cuối cùng được ưu tiên; nó sẽ chỉ bị ghi đè bởi trạng thái tác vụ nền tảng khi nó đang được thực hiện (để tránh việc hoàn thành vẫn bị flash khi được tạo bởi tác vụ zombie)
            const displayStatus =
              fragStatus === 'done' ||
              fragStatus === 'failed' ||
              fragStatus === 'cancelled'
                ? fragStatus
                : activeVideoTask
                  ? activeVideoTask.status === 'pending' || activeVideoTask.status === 'leased'
                    ? 'queued'
                    : 'running'
                  : fragStatus
            const fragBusy =
              Boolean(frag.id && generatingIds.has(frag.id)) &&
              displayStatus !== 'done' &&
              displayStatus !== 'failed' &&
              displayStatus !== 'cancelled'
            const badge = fragmentQueueBadgeLabel(displayStatus, t)
            const clipVideo = frag.video ? resolveDramaMediaUrl(frag.video) : ''
            const clipCover = frag.cover ? resolveDramaMediaUrl(frag.cover) : ''
            const showFailHint = displayStatus === 'failed' && !fragBusy
            const fragParams =
              frag.params && typeof frag.params === 'object' && !Array.isArray(frag.params)
                ? (frag.params as Record<string, unknown>)
                : {}
            return (
            <div key={`${frag.id}-${index}`} className="drama-ep-clip-wrap">
              <div
                className={`drama-ep-clip-shell ${selectedIndex === index ? 'active' : ''}${
                  fragBusy ? ' is-generating' : ''
                }${displayStatus === 'queued' ? ' is-queued' : ''}${
                  displayStatus === 'failed' ? ' is-failed' : ''
                }`}
              >
                <button
                  type="button"
                  className="drama-ep-clip"
                  onClick={() => setSelectedIndex(index)}
                >
                  {clipCover ? (
                    <img src={clipCover} alt="" />
                  ) : clipVideo ? (
                    <video src={clipVideo} muted />
                  ) : (
                    <span className="drama-ep-clip-empty">
                      {fragBusy ? '…' : showFailHint ? (
                        <CircleAlert size={22} strokeWidth={2} aria-hidden />
                      ) : (
                        '+'
                      )}
                    </span>
                  )}
                  {badge ? <span className="drama-ep-clip-badge">{badge}</span> : null}
                  <em>
                    {formatFragLabel(index, frag.duration_sec, t)}
                    <DramaFragmentClipSpec
                      fragmentParams={fragParams}
                      episodeParams={episodeParams}
                      projectParams={projectParams}
                      videoUrl={clipVideo}
                    />
                  </em>
                </button>
                {showFailHint ? (
                  <button
                    type="button"
                    className="drama-ep-clip-fail-btn"
                    title={t('drama.episodeEdit.viewError')}
                    aria-label={t('drama.episodeEdit.viewFragError').replace('{i}', String(index + 1))}
                    onClick={() => openFragmentFailReason(frag, index)}
                  >
                    <CircleAlert size={14} strokeWidth={2.25} aria-hidden />
                  </button>
                ) : null}
              </div>
              <div className="drama-ep-clip-ops">
                <button type="button" aria-label={t('drama.episodeEdit.insert')} onClick={() => insertFrag(index + 1)} disabled={busy}>
                  +
                </button>
                <button type="button" aria-label={t('common.copy')} onClick={() => duplicateFrag(index)} disabled={busy}>
                  ⧉
                </button>
                <button
                  type="button"
                  aria-label={t('common.delete')}
                  disabled={busy || fragments.length <= 1}
                  onClick={() => deleteFrag(index)}
                >
                  ⌫
                </button>
              </div>
            </div>
            )
          })}
        </div>
      </footer>

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
    </div>
  )
}
