/** Trang chủ đại lý truyện tranh kịch: AI Script / Canvas miễn phí + Dự án của tôi (Nhiều lựa chọn để xóa) */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Film,
  FolderOpen,
  LayoutGrid,
  Library,
  Search,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { CurlCodeBox } from '../../components/studio/storyboard/StoryboardCurlModal'
import { getApiBase } from '../../api'
import PillFilter, { type PillOption } from '../../components/ui/PillFilter'
import { dramaApi, resolveDramaMediaUrl, type DramaProjectListItem } from '../../api/drama'
import { dialog } from '../../lib/dialog'
import { type ImageStyleId } from '../../lib/dramaImageStyles'
import { formatDramaUsageBrief } from '../../lib/dramaUsage'
import {
  dramaProjectEntryPath,
  formatDramaCardMeta,
  isCanvasWorkflow,
} from '../../lib/dramaWorkflow'
import RequireAuth from './RequireAuth'
import { useI18n } from '../../i18n'
import { DramaEpisodeCountPopover } from './DramaEpisodeCountPopover'
import { DramaImageStyleModal } from './DramaImageStyleModal'
import { DramaProjectCardMenu } from './DramaProjectCardMenu'
import './drama.css'

const CREATIVE_MIN_LENGTH = 20
const CREATIVE_MAX_LENGTH = 2000

type AgentTab = 'ai' | 'canvas'

// Thời gian cập nhật định dạng
function formatUpdatedAt(raw?: string) {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}


type ProjectFilter = 'all' | 'running' | 'done' | 'draft'

const FILTER_KEYS: ProjectFilter[] = ['all', 'running', 'done', 'draft']

export default function DramaListPage() {
  return (
    <RequireAuth>
      <DramaListInner />
    </RequireAuth>
  )
}

// Nội dung trang chủ của Đại lý kết xuất
function DramaListInner() {
  const navigate = useNavigate()
  const { t, m } = useI18n()
  const filterOptions = useMemo<PillOption<ProjectFilter>[]>(
    () =>
      FILTER_KEYS.map((value) => ({
        value,
        label: m.dramaList.filters[value],
      })),
    [m],
  )
  /*
   * storyText Đầu vào sáng tạo AI
   * tậpĐếm số tập mục tiêu
   * phong cách hình ảnh imageStyleId
   * mục Danh sách dự án của tôi
   * loading Danh sách đang tải
   * đang bận tạo
   * canvasBusy Canvas đang được tạo
   * lỗi lỗi sao chép
   * đã chọn id nhiều lựa chọn
   * đang xóa Đang xóa hàng loạt
   * bộ lọc danh sách bộ lọc
   * truy vấn tìm kiếm
   * showCreate Có nên mở rộng bảng điều khiển mới hay không
   */
  const [storyText, setStoryText] = useState('')
  const [episodeCount, setEpisodeCount] = useState(12)
  const [imageStyleId, setImageStyleId] = useState<ImageStyleId | ''>('')
  const [items, setItems] = useState<DramaProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [canvasBusy, setCanvasBusy] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showCurlModal, setShowCurlModal] = useState(false)

  const curlCommand = useMemo(() => {
    const base = getApiBase() || window.location.origin
    const token = localStorage.getItem('token') || 'YOUR_AUTH_TOKEN'
    const body = JSON.stringify(
      {
        message:
          'Hãy viết 1 ý tưởng câu chuyện phim ngắn hấp dẫn khoảng 80-120 từ, đầy đủ bối cảnh, nhân vật chính, xung đột và kết thúc bất ngờ. Chỉ trả lời nội dung ý tưởng.',
      },
      null,
      2,
    )
    return `curl -X POST "${base}/api/drama/ai/chat" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${body}'`
  }, [])

  // Tải danh sách dự án
  async function loadProjects() {
    const rows = await dramaApi.listProjects()
    setItems(rows)
    setSelected((prev) => {
      const ids = new Set(rows.map((r) => r.id))
      return new Set([...prev].filter((id) => ids.has(id)))
    })
  }

  useEffect(() => {
    setLoading(true)
    loadProjects()
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadFailed')))
      .finally(() => setLoading(false))
  }, [])

  // AI Build Now: Tạo dự án và đi đến các bước phác thảo
  async function handleGenerate() {
    const source = storyText.trim()
    if (source.length < CREATIVE_MIN_LENGTH) {
      setError(t('drama.list.minLength').replace('{n}', String(CREATIVE_MIN_LENGTH)))
      const el = document.getElementById('drama-agent-story')
      el?.focus()
      return
    }
    if (source.length > CREATIVE_MAX_LENGTH) {
      setError(t('drama.list.maxLength').replace('{n}', String(CREATIVE_MAX_LENGTH)))
      return
    }
    setBusy(true)
    setError('')
    try {
      const project = await dramaApi.createProject({
        source,
        episode_count: episodeCount,
        image_style_id: imageStyleId || undefined,
        title: source.slice(0, 40),
      })
      navigate(`/drama/projects/${project.id}`, { state: { activeStep: 'outline' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.generateFailed'))
    } finally {
      setBusy(false)
    }
  }

  const [generatingIdea, setGeneratingIdea] = useState(false)

  const SAMPLE_STORIES = useMemo(
    () => [
      'Năm 2150, tại trạm không gian Kepler, kỹ sư trẻ Minh phát hiện một tín hiệu lạ từ vùng tối Mặt Trăng. Anh cùng cộng sự AI Maya giải mã và tìm ra bản đồ dẫn tới một nền văn minh cổ đại đã biến mất ngoài rìa hệ Mặt Trời.',
      'Thám tử Minh Quân nhận điều tra vụ mất tích kỳ bí của một họa sĩ thiên tài. Lần theo những bức tranh vẽ trước ngày biến mất, anh bàng hoàng nhận ra mỗi bức tranh đều tiên tri chính xác một vụ án mạng sắp sửa xảy ra trong thành phố.',
      'Thiếu niên Lạc Phong vô tình đánh thức thanh kiếm cổ bị phong ấn ngàn năm trong cấm địa gia tộc. Linh hồn kiếm sư thức tỉnh và trao cho anh sứ mệnh ngăn chặn cuộc xâm lăng của Ma giới trước đêm trăng máu.',
      'Một nhân viên văn phòng bình thường nhặt được chiếc đồng hồ cổ có khả năng quay ngược thời gian 10 phút. Ban đầu anh dùng nó để sửa chữa những sai lầm nhỏ, cho đến khi phát hiện mỗi lần quay ngược thời gian đều đánh đổi ký ức của người anh yêu nhất.',
      'Trong thành phố Cyberpunk ngập ánh đèn neon, một thợ săn tiền thưởng cyborg bất ngờ nhận nhiệm vụ bảo vệ đứa trẻ duy nhất mang trong mình mã nguồn có thể giải phóng toàn bộ nhân loại khỏi mạng lưới kiểm soát độc tài.',
    ],
    [],
  )

  async function handleGenerateIdea() {
    if (generatingIdea) return
    setGeneratingIdea(true)
    setError('')
    try {
      const timeoutPromise = new Promise<{ reply: string }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3500),
      )
      const chatPromise = dramaApi.chat(
        'Hãy viết 1 ý tưởng câu chuyện phim ngắn hấp dẫn khoảng 80-120 từ, đầy đủ bối cảnh, nhân vật chính, xung đột và kết thúc bất ngờ. Chỉ trả lời nội dung ý tưởng.',
      )
      const res = await Promise.race([chatPromise, timeoutPromise])
      if (res?.reply && res.reply.trim().length >= 25) {
        setStoryText(res.reply.trim())
      } else {
        throw new Error('empty reply')
      }
    } catch {
      const available = SAMPLE_STORIES.filter((s) => s !== storyText)
      const picked = available[Math.floor(Math.random() * available.length)] || SAMPLE_STORIES[0]
      setStoryText(picked)
    } finally {
      setGeneratingIdea(false)
      setTimeout(() => {
        const el = document.getElementById('drama-agent-story')
        el?.focus()
      }, 50)
    }
  }

  // Canvas miễn phí: Tạo các dự án sáng tạo giữ chỗ và nhập canvas
  async function handleEnterCanvas() {
    if (canvasBusy) return
    setCanvasBusy(true)
    setError('')
    try {
      const project = await dramaApi.createProject({
        source: t('dramaList.canvasPlaceholder'),
        episode_count: 1,
        title: t('dramaList.canvasTitle'),
        workflow: 'canvas',
      })
      navigate(`/drama/projects/${project.id}/canvas`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.generateFailed'))
    } finally {
      setCanvasBusy(false)
    }
  }

  // Chuyển tab; Tab Canvas được tạo và nhảy trực tiếp
  function handleTabClick(next: AgentTab) {
    if (next === 'canvas') {
      void handleEnterCanvas()
    }
  }

  const selectionMode = selected.size > 0
  const storyLen = storyText.trim().length
  const charCountClass =
    storyLen > CREATIVE_MAX_LENGTH
      ? ' is-over'
      : storyLen >= CREATIVE_MIN_LENGTH
        ? ' is-ok'
        : ''

  const filteredItems = items.filter((item) => {
    const canvas = isCanvasWorkflow(item)
    if (filter === 'draft') {
      if (canvas) return (item.asset_count || 0) === 0
      if (item.has_script) return false
    }
    if (filter === 'running') {
      if (canvas) return (item.asset_count || 0) > 0
      if (!(item.has_script && (item.episode_count || 0) > 0)) return false
    }
    if (filter === 'done') {
      if (canvas) return false
      if (!(item.has_script && (item.episode_count || 0) >= 8)) return false
    }
    const q = query.trim().toLowerCase()
    if (q && !(item.title || '').toLowerCase().includes(q)) return false
    return true
  })

  // Lựa chọn chuyển đổi
  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Mở dự án: nhập canvas miễn phí vào canvas và nhập dự án bình thường vào bàn làm việc
  function openProject(item: DramaProjectListItem) {
    if (selectionMode) {
      toggleSelect(item.id)
      return
    }
    navigate(dramaProjectEntryPath(item))
  }

  // Đổi tên
  async function handleRename(item: DramaProjectListItem) {
    const name = await dialog.prompt({
      title: t('dramaList.renameTitle'),
      message: t('dramaList.renameMessage'),
      defaultValue: item.title,
      confirmText: t('common.save'),
    })
    if (!name?.trim() || name.trim() === item.title) return
    try {
      await dramaApi.updateProject(item.id, { title: name.trim() })
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dramaList.renameFailed'))
    }
  }

  // Xóa một bài
  async function handleDeleteOne(item: DramaProjectListItem) {
    const ok = await dialog.confirm({
      title: t('dramaList.deleteTitle'),
      message: t('dramaList.deleteOne', { title: item.title }),
      confirmText: t('common.delete'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      await dramaApi.deleteProject(item.id)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dramaList.deleteFailed'))
    }
  }

  // Xóa hàng loạt
  async function handleDeleteSelected() {
    const ids = [...selected]
    if (ids.length === 0) return
    const ok = await dialog.confirm({
      title: t('dramaList.deleteTitle'),
      message: t('dramaList.deleteMany', { count: ids.length }),
      confirmText: t('common.delete'),
      tone: 'danger',
    })
    if (!ok) return
    setDeleting(true)
    try {
      await Promise.all(ids.map((id) => dramaApi.deleteProject(id)))
      setSelected(new Set())
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dramaList.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell active="drama">
      <div className="drama-page drama-agent-page pf-drama-list">
        <header className="pf-drama-list-head">
          <div className="pf-drama-list-title-row">
            <h1>{t('dramaList.title')}</h1>
            <div className="pf-drama-list-actions">
              <Button variant="ghost" size="sm" to="/drama/assets">
                <Library size={15} strokeWidth={1.75} aria-hidden />
                {t('dramaList.assets')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={canvasBusy}
                onClick={() => handleTabClick('canvas')}
              >
                <LayoutGrid size={15} strokeWidth={1.75} aria-hidden />
                {canvasBusy ? t('dramaList.creating') : t('dramaList.canvas')}
              </Button>
              <Button
                variant="lime"
                size="sm"
                onClick={() => {
                  setShowCreate(true)
                  handleTabClick('ai')
                }}
              >
                {t('dramaList.newProject')}
              </Button>
            </div>
          </div>

          <div className="pf-drama-list-toolbar">
            <PillFilter<ProjectFilter>
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              ariaLabel={t('dramaList.filterAria')}
            />
            <label className="pf-drama-search">
              <Search size={16} strokeWidth={2} aria-hidden />
              <span className="sr-only">{t('dramaList.searchAria')}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('dramaList.searchPlaceholder')}
              />
            </label>
          </div>
        </header>

        {showCreate ? (
          <section className="drama-agent-panel pf-drama-create-panel" aria-label={t('dramaList.createAria')}>
            <div className="drama-agent-panel-head">
              <div className="drama-agent-tabs" role="tablist" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="active"
                  disabled={generatingIdea}
                  onClick={() => void handleGenerateIdea()}
                  style={{
                    cursor: generatingIdea ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: generatingIdea ? 0.75 : 1,
                  }}
                  title={t('dramaList.aiGenerateIdea')}
                >
                  <Sparkles size={15} strokeWidth={1.75} aria-hidden />
                  {generatingIdea ? t('dramaList.generatingIdea') : t('dramaList.aiGenerateIdea')}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCurlModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '0.4rem 0.75rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(17, 19, 24, 0.15)',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc'
                    e.currentTarget.style.borderColor = '#94a3b8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff'
                    e.currentTarget.style.borderColor = 'rgba(17, 19, 24, 0.15)'
                  }}
                  title="Xem lệnh cURL gọi API AI tạo ý tưởng câu chuyện"
                >
                  <Terminal size={14} strokeWidth={2} aria-hidden />
                  <span>cURL</span>
                </button>
              </div>
              <button type="button" className="pf-link pf-drama-collapse" onClick={() => setShowCreate(false)}>
                {t('dramaList.collapse')}
              </button>
            </div>
            <div className="drama-agent-tips" role="note">
              <Sparkles size={15} strokeWidth={1.75} aria-hidden />
              <span>
                {t('dramaList.tipRest', {
                  a: t('dramaList.tipStrong1'),
                  b: t('dramaList.tipStrong2'),
                  c: t('dramaList.tipStrong3'),
                })}
              </span>
            </div>
            <div className="drama-agent-ai">
              <label className="drama-agent-ai-label" htmlFor="drama-agent-story">
                {t('dramaList.storyLabel')}
              </label>
              <div className={`drama-agent-ai-field${storyText.trim() ? ' has-value' : ''}`}>
                <textarea
                  id="drama-agent-story"
                  value={storyText}
                  onChange={(e) => {
                    setStoryText(e.target.value.slice(0, CREATIVE_MAX_LENGTH + 50))
                    if (error) setError('')
                  }}
                  disabled={busy}
                  placeholder={t('drama.list.storyPlaceholder')}
                  rows={7}
                  maxLength={CREATIVE_MAX_LENGTH + 50}
                />
                <span
                  className={`drama-agent-char-count${charCountClass}`}
                  aria-live="polite"
                >
                  {storyLen < CREATIVE_MIN_LENGTH && (
                    <span style={{ color: '#ef4444', marginRight: 8, fontSize: '12px', fontWeight: 500 }}>
                      ({t('dramaList.minCharactersRequired').replace('{n}', String(CREATIVE_MIN_LENGTH))})
                    </span>
                  )}
                  {storyLen}
                  <span className="drama-agent-char-sep">/</span>
                  {CREATIVE_MAX_LENGTH}
                </span>
              </div>
              {error ? (
                <div style={{ marginTop: 8 }}>
                  <BillingErrorNotice message={error} onClose={() => setError('')} className="drama-error drama-agent-error" />
                </div>
              ) : null}
              <div className="drama-agent-ai-footer">
                <div className="drama-agent-ai-options">
                  <DramaImageStyleModal value={imageStyleId} onChange={setImageStyleId} disabled={busy} />
                  <span className="drama-agent-opt-divider" aria-hidden />
                  <DramaEpisodeCountPopover value={episodeCount} onChange={setEpisodeCount} disabled={busy} />
                </div>
                <Button
                  variant="lime"
                  size="md"
                  className="drama-agent-generate-btn"
                  disabled={busy}
                  onClick={() => void handleGenerate()}
                >
                  <Sparkles size={16} strokeWidth={1.75} aria-hidden />
                  {busy ? t('dramaList.creating') : t('dramaList.generateNow')}
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {error && !showCreate ? <BillingErrorNotice message={error} onClose={() => setError('')} className="drama-error drama-agent-error" /> : null}

        {loading ? (
          <div className="pf-drama-card-grid" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pf-drama-card is-skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="pf-empty-state">
            <div className="pf-empty-illust" aria-hidden>
              <FolderOpen size={48} strokeWidth={1.2} />
            </div>
            <h2>{t('dramaList.emptyTitle')}</h2>
            <p className="pf-muted">{t('dramaList.emptyDesc')}</p>
            <Button
              variant="lime"
              onClick={() => {
                setShowCreate(true)
                handleTabClick('ai')
              }}
            >
              {t('dramaList.newProject')}
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="pf-empty-state is-compact">
            <p className="pf-muted">{t('dramaList.noFilterResult')}</p>
            <Button variant="ghost" size="sm" onClick={() => { setFilter('all'); setQuery('') }}>
              {t('dramaList.clearFilter')}
            </Button>
          </div>
        ) : (
          <div className="pf-drama-card-grid">
            <button
              type="button"
              className="pf-drama-card pf-drama-card-new"
              onClick={() => {
                setShowCreate(true)
                handleTabClick('ai')
              }}
            >
              <span className="pf-drama-card-plus" aria-hidden>
                +
              </span>
              <strong>{t('dramaList.newProject')}</strong>
            </button>
            {filteredItems.map((item) => {
              const isSelected = selected.has(item.id)
              const coverSrc = item.cover_url ? resolveDramaMediaUrl(item.cover_url) : ''
              const canvas = isCanvasWorkflow(item)
              return (
                <article
                  key={item.id}
                  className={`pf-drama-card${isSelected ? ' is-selected' : ''}${canvas ? ' is-canvas' : ''}`}
                >
                  <button
                    type="button"
                    className="pf-drama-card-cover"
                    onClick={() => openProject(item)}
                    aria-label={`${t('common.viewDetail')} ${item.title}`}
                  >
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt=""
                        className="pf-drama-card-cover-img"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="pf-drama-card-cover-fallback">
                        <div className="pf-drama-card-cover-pattern" />
                        <div className="pf-drama-card-cover-icon-wrap">
                          {canvas ? (
                            <LayoutGrid size={22} strokeWidth={1.8} />
                          ) : (
                            <Film size={22} strokeWidth={1.8} />
                          )}
                        </div>
                      </div>
                    )}
                    {canvas ? (
                      <span className="pf-drama-card-cover-badge is-canvas">
                        <LayoutGrid size={11} strokeWidth={2.2} />
                        {t('dramaList.canvasBadge')}
                      </span>
                    ) : null}
                    {!canvas && item.cover_pending ? (
                      <span className="pf-drama-card-cover-badge">{t('dramaList.coverPending')}</span>
                    ) : null}
                    {!canvas && !coverSrc && !item.cover_pending && item.asset_count > 0 ? (
                      <span className="pf-drama-card-cover-badge is-muted">{t('dramaList.pendingImage')}</span>
                    ) : null}
                    <label
                      className={`drama-project-row-check${isSelected || selectionMode ? ' is-visible' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} />
                    </label>
                  </button>
                  <div className="pf-drama-card-body">
                    <div className="pf-drama-card-top">
                      <button type="button" className="pf-drama-card-title" onClick={() => openProject(item)}>
                        {item.title}
                      </button>
                      <DramaProjectCardMenu
                        onRename={() => void handleRename(item)}
                        onDelete={() => void handleDeleteOne(item)}
                      />
                    </div>
                    <p className="pf-drama-card-meta">{formatDramaCardMeta(item, t)}</p>
                    <p className="pf-drama-card-usage" title={t('drama.list.usageTip')}>
                      {formatDramaUsageBrief(item.usage)}
                    </p>
                    <p className="pf-drama-card-time">{formatUpdatedAt(item.updated_at || item.created_at)}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {selected.size > 0 ? (
          <div className="drama-project-selection-bar">
            <div className="drama-project-selection-inner">
              <span>{t('dramaList.selectedCount').replace('{n}', String(selected.size))}</span>
              <button
                type="button"
                className="drama-project-selection-cancel"
                disabled={deleting}
                onClick={() => setSelected(new Set())}
              >
                {t('dramaList.cancelSelect')}
              </button>
              <button
                type="button"
                className="drama-project-selection-delete"
                disabled={deleting}
                onClick={() => void handleDeleteSelected()}
              >
                <Trash2 size={16} strokeWidth={1.8} />
                {deleting ? t('dramaList.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        ) : null}
        {showCurlModal ? (
          <Modal
            open={showCurlModal}
            onClose={() => setShowCurlModal(false)}
            title="Lệnh cURL API Tạo ý tưởng câu chuyện"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="pf-muted" style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
                Đây là lệnh cURL gửi yêu cầu đến backend để gọi mô hình AI (LLM) xây dựng ý tưởng câu chuyện phim ngắn.
              </p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                    Endpoint: POST /api/drama/ai/chat
                  </span>
                </div>
                <CurlCodeBox code={curlCommand} />
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Phản hồi mẫu (JSON Response):
                </div>
                <pre
                  className="pf-curl-box"
                  style={{
                    fontSize: '0.8rem',
                    margin: 0,
                    color: '#94a3b8',
                    background: '#0f172a',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
{`{
  "reply": "Năm 2150, tại trạm không gian Kepler, kỹ sư trẻ Minh phát hiện một tín hiệu lạ từ vùng tối Mặt Trăng. Anh cùng cộng sự AI Maya giải mã và tìm ra bản đồ dẫn tới một nền văn minh cổ đại đã biến mất ngoài rìa hệ Mặt Trời.",
  "task_id": 128
}`}
                </pre>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => setShowCurlModal(false)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}
      </div>
    </AppShell>
  )
}
