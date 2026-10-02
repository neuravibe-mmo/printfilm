/** Canvas toàn màn hình của bảng phân cảnh tập: được kết nối bằng bảng phân cảnh, các nút bao gồm video/nội dung bên ngoài/từ nhắc nhở */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  dramaApi,
  resolveDramaAssetPreviewUrl,
  type DramaAsset,
  type DramaEpisode,
  type DramaFragment,
} from '../../../api/drama'
import Modal from '../../../components/ui/Modal'
import { useI18n } from '../../../i18n'
import {
  collectFragmentAssetIds,
  getAssetTabLabel,
  normalizeAssetTab,
} from '../dramaEpisodeEditUtils'
import { isDefaultEpisodeTitle } from '../dramaWorkspaceUtils'
import RequireAuth from '../RequireAuth'
import {
  buildEpisodeFragmentFlow,
  type EpisodeFragmentNodeData,
  type EpisodeFlowNodeData,
} from './buildEpisodeFlow'
import { EpisodeAssetNode } from './EpisodeAssetNode'
import { EpisodeFragmentNode } from './EpisodeFragmentNode'
import './episodeCanvas.css'

const SAVE_DEBOUNCE_MS = 800

// Thêm @asset đề cập đến văn bản
function ensureAssetMention(content: string, assetId: number): string {
  const token = `@asset:${assetId}`
  if ((content || '').includes(token)) return content || ''
  const trimmed = (content || '').trimEnd()
  return trimmed ? `${trimmed} ${token}` : token
}

// Xóa đề cập đến @asset khỏi văn bản
function removeAssetMention(content: string, assetId: number): string {
  return (content || '')
    .replace(new RegExp(`\\s*@asset:${assetId}\\b`, 'g'), ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Nhập bảng phân cảnh sau khi xác thực
export default function EpisodeStoryboardPage() {
  return (
    <RequireAuth>
      <ReactFlowProvider>
        <EpisodeStoryboardInner />
      </ReactFlowProvider>
    </RequireAuth>
  )
}

// Tải tập và hiển thị bảng phân cảnh toàn màn hình
function EpisodeStoryboardInner() {
  const { t, locale } = useI18n()
  const { projectId, episodeId } = useParams()
  const pid = Number(projectId)
  const eid = Number(episodeId)
  const navigate = useNavigate()
  const { fitView } = useReactFlow()

  /*
   * tập/đoạn/dữ liệu nội dung
   * linkTargetFragId đang chọn bảng phân cảnh liên quan đến nội dung.
   * bẩn / bận / lỗi / trạng thái
   */
  const [episode, setEpisode] = useState<DramaEpisode | null>(null)
  const [fragments, setFragments] = useState<DramaFragment[]>([])
  const [assets, setAssets] = useState<DramaAsset[]>([])
  const [linkTargetFragId, setLinkTargetFragId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)
  const fittedRef = useRef(false)
  const fragmentsRef = useRef<DramaFragment[]>([])
  const assetsRef = useRef<DramaAsset[]>([])
  const saveTimer = useRef<number | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EpisodeFlowNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    fragmentsRef.current = fragments
  }, [fragments])

  useEffect(() => {
    assetsRef.current = assets
  }, [assets])

  // Khóa cấu trúc: thành từng phần + được xây dựng lại khi tài sản liên quan thay đổi; trình soạn thảo từ nhắc nhở thực hiện cập nhật một phần
  const structureKey = fragments
    .map((f) => {
      const aids = collectFragmentAssetIds(f).join(',')
      return `${f.id}:${f.sort_order}:${f.video || ''}:${f.cover || ''}:${f.duration_sec ?? 0}:${aids}`
    })
    .join('|')

  useEffect(() => {
    const flow = buildEpisodeFragmentFlow(fragmentsRef.current, assetsRef.current)
    setNodes(flow.nodes)
    setEdges(flow.edges)
  }, [structureKey, assets, setNodes, setEdges])

  useEffect(() => {
    fittedRef.current = false
  }, [eid])

  useEffect(() => {
    if (fittedRef.current || nodes.length === 0) return
    fittedRef.current = true
    void fitView({ padding: 0.22, duration: 280 })
  }, [nodes.length, fitView])

  // Kéo các tập + nội dung dự án
  useEffect(() => {
    if (!eid || !pid) return
    let cancelled = false
    setBusy(true)
    setError('')
    Promise.all([dramaApi.getEpisode(eid), dramaApi.listAssets(pid)])
      .then(([ep, assetList]) => {
        if (cancelled) return
        setEpisode(ep)
        setFragments(ep.fragments || [])
        setAssets(assetList || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('common.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [eid, pid])

  // Kiên trì tất cả các bản sao (giữ trật tự, giữ lại các lát cắt và tham chiếu)
  const persistFragments = useCallback(
    async (next: DramaFragment[]) => {
      if (!eid) return
      setBusy(true)
      setError('')
      try {
        const saved = await dramaApi.saveFragments(
          eid,
          next.map((f, index) => {
            const prevParams =
              f.params && typeof f.params === 'object' && !Array.isArray(f.params)
                ? (f.params as Record<string, unknown>)
                : {}
            return {
              id: typeof f.id === 'number' && f.id > 0 ? f.id : undefined,
              sort_order: index,
              content: f.content || '',
              cover: f.cover || '',
              video: f.video || '',
              duration_sec: f.duration_sec ?? 8,
              params: prevParams,
              asset_ids: collectFragmentAssetIds(f),
            }
          }),
        )
        setEpisode(saved)
        setFragments(saved.fragments || [])
        setDirty(false)
        setStatus(t('common.saved'))
        window.setTimeout(() => setStatus(''), 1600)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.saveFailed'))
      } finally {
        setBusy(false)
      }
    },
    [eid],
  )

  // Lưu chống rung
  const scheduleSave = useCallback(() => {
    setDirty(true)
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void persistFragments(fragmentsRef.current)
    }, SAVE_DEBOUNCE_MS)
  }, [persistFragments])

  // Làm mới lời nhắc của một nút bảng phân cảnh (các thay đổi nội dung liên quan được xây dựng lại bằng StructureKey)
  const patchFragmentPrompt = useCallback(
    (fragmentId: number, content: string) => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.type !== 'episodeFragment') return node
          const data = node.data as EpisodeFragmentNodeData
          if (data.fragmentId !== fragmentId) return node
          return { ...node, data: { ...data, content } }
        }),
      )
    },
    [setNodes],
  )

  // Thay đổi lời nhắc
  const handlePromptChange = useCallback(
    (fragmentId: number, content: string) => {
      setFragments((prev) =>
        prev.map((f) => {
          if (f.id !== fragmentId) return f
          const updated = { ...f, content }
          return { ...updated, asset_ids: collectFragmentAssetIds(updated) }
        }),
      )
      patchFragmentPrompt(fragmentId, content)
      scheduleSave()
    },
    [patchFragmentPrompt, scheduleSave],
  )

  // Hủy liên kết nội dung gửi đi
  const handleUnlinkAsset = useCallback(
    (fragmentId: number, assetId: number) => {
      setFragments((prev) =>
        prev.map((f) => {
          if (f.id !== fragmentId) return f
          const content = removeAssetMention(f.content || '', assetId)
          const asset_ids = (f.asset_ids || []).filter((id) => id !== assetId)
          return { ...f, content, asset_ids }
        }),
      )
      scheduleSave()
    },
    [scheduleSave],
  )

  // Mở lựa chọn liên quan
  const handleRequestLinkAsset = useCallback((fragmentId: number) => {
    setLinkTargetFragId(fragmentId)
  }, [])

  // Xác nhận nội dung liên quan
  const handlePickAsset = useCallback(
    (asset: DramaAsset) => {
      if (linkTargetFragId == null) return
      const fragmentId = linkTargetFragId
      setFragments((prev) =>
        prev.map((f) => {
          if (f.id !== fragmentId) return f
          const content = ensureAssetMention(f.content || '', asset.id)
          const asset_ids = Array.from(new Set([...(f.asset_ids || []), asset.id]))
          return { ...f, content, asset_ids }
        }),
      )
      setLinkTargetFragId(null)
      scheduleSave()
    },
    [linkTargetFragId, scheduleSave],
  )

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      episodeFragment: (props) => (
        <EpisodeFragmentNode
          {...props}
          onPromptChange={handlePromptChange}
          onRequestLinkAsset={handleRequestLinkAsset}
        />
      ),
      episodeAsset: (props) => (
        <EpisodeAssetNode {...props} onUnlinkAsset={handleUnlinkAsset} />
      ),
    }),
    [handlePromptChange, handleRequestLinkAsset, handleUnlinkAsset],
  )

  const linkFrag = fragments.find((f) => f.id === linkTargetFragId) || null
  const linkedIdSet = new Set(linkFrag ? collectFragmentAssetIds(linkFrag) : [])
  const pickerAssets = assets.filter((a) => {
    const tab = normalizeAssetTab(a.type || '')
    return Boolean(tab) && !linkedIdSet.has(a.id)
  })

  const epNumber = Number(episode?.params?.episodeNumber) || 0
  const rawEpisodeName = (episode?.name || '').trim()
  const displayEpisodeName =
    rawEpisodeName && !isDefaultEpisodeTitle(rawEpisodeName, epNumber)
      ? rawEpisodeName
      : epNumber >= 1
        ? t('drama.episodes.episode', { n: epNumber, no: epNumber })
        : locale === 'vi'
          ? `Tập ${eid}`
          : locale === 'en'
            ? `Episode ${eid}`
            : `分集 ${eid}`

  const backHref = `/drama/projects/${pid}/episodes/${eid}`

  return (
    <div className="ep-storyboard-page">
      <header className="ep-storyboard-topbar">
        <div className="ep-storyboard-topbar-left">
          <button
            type="button"
            className="ep-storyboard-back"
            aria-label={t('drama.canvas.backToEpisode')}
            title={t('drama.canvas.backToEpisode')}
            onClick={() => navigate(backHref)}
          >
            <ChevronLeft size={20} strokeWidth={1.8} />
          </button>
          <div className="ep-storyboard-title">
            <strong>{displayEpisodeName}</strong>
            <span>
              {t('drama.canvas.storyboardTitle')} · {t('drama.canvas.shotCount', { n: fragments.length })}
              {dirty ? ` · ${t('drama.canvas.unsaved')}` : status ? ` · ${status}` : ''}
            </span>
          </div>
        </div>
        <div className="ep-storyboard-actions">
          <button
            type="button"
            className="ep-storyboard-btn ghost"
            onClick={() => navigate(`/drama/projects/${pid}/canvas`)}
          >
            {t('drama.canvas.assetCanvas')}
          </button>
          <button
            type="button"
            className="ep-storyboard-btn dark"
            disabled={busy || !dirty}
            onClick={() => void persistFragments(fragments)}
          >
            {busy ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </header>

      <div className="ep-storyboard-flow">
        {fragments.length === 0 && !busy ? (
          <div className="ep-storyboard-empty">
            <strong>{t('drama.canvas.noShots')}</strong>
            <span>{t('drama.canvas.noShotsHint')}</span>
          </div>
        ) : null}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.35}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'default' }}
        >
          <Background gap={20} size={1} color="#dbe2ea" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
        {error ? (
          <p className="ep-storyboard-toast" role="alert">
            {error}
          </p>
        ) : null}
        {busy && fragments.length === 0 ? (
          <p className="ep-storyboard-toast">{t('common.loading')}</p>
        ) : null}
      </div>

      <Modal
        open={linkTargetFragId != null}
        onClose={() => setLinkTargetFragId(null)}
        title={t('drama.canvas.linkAssetTitle')}
        size="lg"
      >
        <p className="ep-storyboard-picker-hint">{t('drama.canvas.pickAssetHint')}</p>
        {pickerAssets.length === 0 ? (
          <p className="ep-storyboard-picker-empty">{t('drama.canvas.noPickerAssets')}</p>
        ) : (
          <div className="ep-storyboard-picker-grid">
            {pickerAssets.map((asset) => {
              const cover = resolveDramaAssetPreviewUrl(asset)
              const fallbackName =
                locale === 'vi' ? `Tài sản ${asset.id}` : locale === 'en' ? `Asset ${asset.id}` : `资产 ${asset.id}`
              return (
                <button
                  key={asset.id}
                  type="button"
                  className="ep-storyboard-picker-card"
                  onClick={() => handlePickAsset(asset)}
                >
                  <div className="ep-storyboard-picker-thumb">
                    {cover ? <img src={cover} alt="" /> : <span>{(asset.name || '?')[0]}</span>}
                  </div>
                  <strong>{asset.name || fallbackName}</strong>
                  <em>{getAssetTabLabel(normalizeAssetTab(asset.type || '') || 'character', locale)}</em>
                </button>
              )
            })}
          </div>
        )}
      </Modal>
    </div>
  )
}
