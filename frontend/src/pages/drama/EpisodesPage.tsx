import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import { isCanvasWorkflow } from '../../lib/dramaWorkflow'
import { resolveStoryboardPath } from '../../lib/dramaStoryboardNav'
import { dramaApi } from '../../api/drama'
import { useI18n } from '../../i18n'
import RequireAuth from './RequireAuth'
import './drama.css'

export default function EpisodesPage() {
  return (
    <RequireAuth>
      <EpisodesRedirect />
    </RequireAuth>
  )
}

// Chuyển đến tập đầu tiên sau khi tải và không còn hiển thị trang giữa nữa
function EpisodesRedirect() {
  const { t } = useI18n()
  const { projectId } = useParams()
  const pid = Number(projectId)
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isFinite(pid) || pid <= 0) return
    let cancelled = false
    ;(async () => {
      try {
        const p = await dramaApi.getProject(pid)
        if (cancelled) return
        if (isCanvasWorkflow(p)) {
          navigate(`/drama/projects/${pid}/canvas`, { replace: true })
          return
        }
        const path = await resolveStoryboardPath(pid)
        if (!cancelled) navigate(path, { replace: true })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('drama.workspace.enterStoryboardFailed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pid, navigate, t])

  return (
    <AppShell active="drama" flush>
      <div className="drama-workspace-status">
        {error || t('drama.workspace.enteringStoryboard')}
      </div>
    </AppShell>
  )
}
