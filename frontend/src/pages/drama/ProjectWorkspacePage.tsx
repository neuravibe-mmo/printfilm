/** Quy trình làm việc của dự án phim truyền hình truyện tranh: phác thảo cốt truyện → bảng phân cảnh → tạo video; thư viện tài sản là một lối vào độc lập */
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Boxes, ChevronLeft } from 'lucide-react'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import AppShell from '../../components/layout/AppShell'
import { useI18n } from '../../i18n'
import { dramaApi, type DramaProject } from '../../api/drama'
import {
  getInitialProjectStep,
  isEpisodesRouteStep,
  isProjectStepKey,
  normalizeWorkspaceStep,
  type ProjectStepKey,
  type WorkspaceLocationState,
} from '../../lib/dramaProjectSteps'
import { formatDramaUsageBrief } from '../../lib/dramaUsage'
import { resolveStoryboardPath } from '../../lib/dramaStoryboardNav'
import { isCanvasWorkflow } from '../../lib/dramaWorkflow'
import { AssetsStep } from './AssetsStep'
import { OutlineStep } from './OutlineStep'
import RequireAuth from './RequireAuth'
import './drama.css'

export default function ProjectWorkspacePage() {
  return (
    <RequireAuth>
      <WorkspaceInner />
    </RequireAuth>
  )
}

// Nội dung chính của bàn làm việc dự án
function WorkspaceInner() {
  const { t } = useI18n()
  const { projectId } = useParams()
  const id = Number(projectId)
  const navigate = useNavigate()
  const location = useLocation()
  /*
   * dự án chi tiết dự án
   * activeStep bước hiện tại (phác thảo/tập)
   * assetsMở chế độ xem độc lập của thư viện nội dung
   * titleTiêu đề có thể chỉnh sửa được
   * editTitle Liệu tiêu đề có đang được chỉnh sửa hay không
   * trạng thái tải / tải lỗi
   */
  const [project, setProject] = useState<DramaProject | null>(null)
  const [activeStep, setActiveStep] = useState<ProjectStepKey>('outline')
  const [assetsOpen, setAssetsOpen] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const locationApplied = useRef(false)

  // Trạng thái định tuyến ứng dụng: bước nhảy nội dung/bảng phân cảnh
  function applyLocationState(state: WorkspaceLocationState | null) {
    const normalized = normalizeWorkspaceStep(state?.activeStep || state?.returnStep)
    if (normalized === 'assets' || state?.activeStep === 'assets') {
      setAssetsOpen(true)
      return
    }
    if (normalized && isEpisodesRouteStep(normalized)) {
      void resolveStoryboardPath(id)
        .then((path) => navigate(path, { replace: true }))
        .catch((err) => setError(err instanceof Error ? err.message : t('drama.workspace.enterStoryboardFailed')))
      return
    }
    if (normalized && isProjectStepKey(normalized)) {
      setAssetsOpen(false)
      setActiveStep(normalized)
    }
  }

  // Tải dự án; dự án canvas miễn phí buộc phải vào trang canvas
  async function reload() {
    const p = await dramaApi.getProject(id)
    if (isCanvasWorkflow(p)) {
      navigate(`/drama/projects/${id}/canvas`, { replace: true })
      return null
    }
    setProject(p)
    setTitleDraft(p.title)
    return p
  }

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return
    setLoading(true)
    reload()
      .then((p) => {
        if (!p) return
        if (!locationApplied.current) {
          const state = location.state as WorkspaceLocationState | null
          if (state?.activeStep || state?.returnStep) applyLocationState(state)
          else {
            const initial = getInitialProjectStep(Boolean(p.script))
            if (isEpisodesRouteStep(initial)) {
              void resolveStoryboardPath(id)
                .then((path) => navigate(path, { replace: true }))
                .catch((err) => setError(err instanceof Error ? err.message : t('drama.workspace.enterStoryboardFailed')))
              return
            }
            setActiveStep(initial)
          }
          locationApplied.current = true
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadFailed')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    applyLocationState(location.state as WorkspaceLocationState | null)
  }, [location.state])

  // Làm mới mức sử dụng khi chuyển đổi các bước (số thanh trên cùng được đồng bộ hóa sau khi tạo ảnh/video)
  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0 || loading || !project) return
    void dramaApi
      .getProject(id)
      .then((p) => {
        setProject((prev) => (prev ? { ...prev, usage: p.usage } : p))
      })
      .catch(() => undefined)
    // eslint-disable-next-line Reac-hooks/exhaustive-deps -- chỉ làm mới khi có thay đổi về chế độ xem
  }, [activeStep, assetsOpen, id])

  // Lưu tiêu đề
  async function saveTitle() {
    const next = titleDraft.trim()
    if (!next || !project) {
      setEditingTitle(false)
      setTitleDraft(project?.title || '')
      return
    }
    try {
      const updated = await dramaApi.updateProject(id, { title: next })
      setProject(updated)
      setTitleDraft(updated.title)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.workspace.saveTitleFailed'))
    } finally {
      setEditingTitle(false)
    }
  }

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <AppShell active="drama" flush>
        <div className="drama-workspace-status">{t('drama.workspace.invalidProjectId')}</div>
      </AppShell>
    )
  }

  if (loading) {
    return (
      <AppShell active="drama" flush>
        <div className="drama-workspace-status">{t('common.loading')}</div>
      </AppShell>
    )
  }

  if (error && !project) {
    return (
      <AppShell active="drama" flush>
        <div className="drama-workspace-status drama-error">{error}</div>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell active="drama" flush>
        <div className="drama-workspace-status">{t('drama.workspace.projectNotFound')}</div>
      </AppShell>
    )
  }

  return (
    <AppShell active="drama" flush wide>
      <div className="drama-workspace">
        <header className="drama-workspace-top">
          <div className="drama-workspace-top-left">
            <button
              type="button"
              className="drama-icon-btn"
              aria-label={t('common.back')}
              onClick={() => navigate('/drama/dramas')}
            >
              <ChevronLeft size={20} strokeWidth={1.75} />
            </button>
            {editingTitle ? (
              <input
                className="drama-title-input"
                value={titleDraft}
                autoFocus
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => void saveTitle()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveTitle()
                  if (e.key === 'Escape') {
                    setTitleDraft(project.title)
                    setEditingTitle(false)
                  }
                }}
              />
            ) : (
              <button type="button" className="drama-title-display" onClick={() => setEditingTitle(true)}>
                {project.title}
              </button>
            )}
          </div>

          <div className="drama-workspace-top-right">
            {project.usage ? (
              <span className="drama-usage-chip" title={t('drama.workspace.usageTooltip')}>
                {formatDramaUsageBrief(project.usage)}
              </span>
            ) : null}
            <button
              type="button"
              className={`drama-assets-entry-btn${assetsOpen ? ' is-active' : ''}`}
              onClick={() => setAssetsOpen((open) => !open)}
            >
              <Boxes size={15} strokeWidth={2} aria-hidden />
              {t('drama.workspace.assets')}
            </button>
          </div>
        </header>

        {error ? <BillingErrorNotice message={error} className="drama-error drama-workspace-banner" /> : null}

        <main className="drama-workspace-main">
          {assetsOpen ? <AssetsStep projectId={id} onError={setError} /> : null}
          {!assetsOpen && activeStep === 'outline' ? (
            <OutlineStep
              projectId={id}
              project={project}
              onProjectChange={(p) => {
                setProject(p)
                setTitleDraft(p.title)
              }}
              onError={setError}
            />
          ) : null}
        </main>
      </div>
    </AppShell>
  )
}
