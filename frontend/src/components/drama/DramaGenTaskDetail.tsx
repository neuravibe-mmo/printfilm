import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { tasksApi, type TaskRunOut } from '../../api/tasks'
import { formatDramaGenError, localizeDramaJobMessage, pickRootDramaGenError } from '../../lib/dramaGenError'
import BillingTopupLink from '../billing/BillingTopupLink'
import type { DramaGenJob } from '../../lib/dramaGenQueue'
import { useI18n } from '../../i18n'

type Props = {
  job: DramaGenJob
  onClose: () => void
}

// Kéo nhiều nhiệm vụ lịch sử liên quan đến mục tiêu (dùng để tìm ra nguyên nhân gốc rễ được đề cập trong "Retry Exceeded")
async function listRelatedTasks(job: DramaGenJob): Promise<TaskRunOut[]> {
  if (job.kind === 'video' && job.targetId > 0) {
    const list = await tasksApi.list({
      domain: 'drama',
      task_type: 'fragment_video',
      target_type: 'fragment',
      target_id: job.targetId,
      page: 1,
      page_size: 20,
    })
    return list.items || []
  }
  if (job.kind === 'image' && job.targetId > 0) {
    const list = await tasksApi.list({
      domain: 'drama',
      target_type: 'asset',
      target_id: job.targetId,
      page: 1,
      page_size: 20,
    })
    return list.items || []
  }
  if (job.taskId && job.taskId > 0) {
    try {
      const one = await tasksApi.get(job.taskId)
      return one ? [one] : []
    } catch {
      return []
    }
  }
  return []
}

// Mô tả tiến độ của các nhiệm vụ đang thực hiện
function activeJobHint(job: DramaGenJob, t: (key: string) => string): string {
  if (job.message?.trim()) return localizeDramaJobMessage(job.message.trim())
  if (job.status === 'queued') return t('drama.genQueue.hintQueued')
  if (job.kind === 'video') return t('drama.genQueue.hintVideo')
  return t('drama.genQueue.hintImage')
}

// Ngăn chi tiết nhiệm vụ (đang tiến hành = tiến trình; không thành công = sao chép lỗi)
export function DramaGenTaskDetail({ job, onClose }: Props) {
  const { t } = useI18n()
  const isFailed = job.status === 'failed'
  const isActive = job.status === 'queued' || job.status === 'running'
  const [loading, setLoading] = useState(isFailed)
  const [rawError, setRawError] = useState(job.error || '')
  const [showRaw, setShowRaw] = useState(false)

  const statusLabel: Record<DramaGenJob['status'], string> = {
    queued: t('drama.genQueue.queued'),
    running: t('drama.genQueue.running'),
    done: t('drama.genQueue.done'),
    failed: t('drama.genQueue.failed'),
  }

  useEffect(() => {
    // Đừng đào sâu các lỗi lịch sử đối với các nhiệm vụ không thất bại và tránh coi việc "bỏ qua các nhiệm vụ lặp lại" cũ là các lỗi hiện tại.
    if (!isFailed) {
      setRawError('')
      setLoading(false)
      return
    }

    let cancelled = false
    setRawError(job.error || '')
    setLoading(true)
    void (async () => {
      try {
        const tasks = await listRelatedTasks(job)
        if (cancelled) return
        const candidates: Array<string | null | undefined> = [job.error]
        for (const task of tasks) {
          // Ưu tiên những nhiệm vụ gắn liền với công việc hiện tại; "Bỏ qua các bản sao" bị hủy trong lịch sử không được coi là quyền ưu tiên nguyên nhân gốc rễ
          if (job.taskId && task.id === job.taskId) {
            candidates.unshift(task.error_message)
            continue
          }
          if (
            task.status === 'cancelled' &&
            /跳过重复任务|分镜已生成完成/.test(String(task.error_message || ''))
          ) {
            continue
          }
          candidates.push(task.error_message)
        }
        let best = pickRootDramaGenError(candidates)
        if (!best || /重试超过|超过上限/.test(best)) {
          for (const task of tasks.slice(0, 5)) {
            if (!task.id) continue
            if (
              task.status === 'cancelled' &&
              /跳过重复任务|分镜已生成完成/.test(String(task.error_message || ''))
            ) {
              continue
            }
            try {
              const detail = await tasksApi.get(task.id)
              if (cancelled) return
              candidates.push(detail.error_message)
              for (const ev of detail.events || []) {
                candidates.push(ev.message)
              }
            } catch {
              /* ignore */
            }
          }
          best = pickRootDramaGenError(candidates)
        }
        if (best) setRawError(best)
      } catch {
        /* vẫn sử dụng job.error khi không có tác vụ nền tảng */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [job, isFailed])

  const errView = isFailed ? formatDramaGenError(rawError || job.message) : null
  const panelTitle = isFailed
    ? t('drama.genQueue.failReason')
    : isActive
      ? t('drama.genQueue.taskProgress')
      : t('drama.genQueue.taskDetail')

  return (
    <div className="drama-gen-detail" role="dialog" aria-label={panelTitle}>
      <header className="drama-gen-detail-head">
        <div>
          <strong>{panelTitle}</strong>
          <span>{job.title}</span>
        </div>
        <button
          type="button"
          className="drama-gen-fab-icon-btn"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>
      </header>

      <div className="drama-gen-detail-body">
        {loading ? (
          <div className="drama-gen-detail-loading">
            <Loader2 size={18} className="drama-gen-detail-spin" />
            <span>{t('drama.genQueue.parsingError')}</span>
          </div>
        ) : null}

        {isFailed && errView ? (
          <section className="drama-gen-detail-card is-error">
            <h4>{errView.title}</h4>
            <p>{errView.message}</p>
            {errView.suggestion ? (
              <p className="drama-gen-detail-tip">
                <strong>{t('drama.genQueue.suggestionLabel')}</strong>
                {errView.suggestion}
                {errView.billingBlocked ? (
                  <>
                    {' '}
                    <BillingTopupLink />
                  </>
                ) : null}
                {errView.upstreamAccountBlocked ? (
                  <> {t('drama.genQueue.adminTopupNotice')}</>
                ) : null}
              </p>
            ) : errView.billingBlocked ? (
              <p className="drama-gen-detail-tip">
                <BillingTopupLink />
              </p>
            ) : errView.upstreamAccountBlocked ? (
              <p className="drama-gen-detail-tip">{t('drama.genQueue.adminTopupNoticeFull')}</p>
            ) : null}
            {rawError ? (
              <button
                type="button"
                className="drama-gen-detail-raw-toggle"
                onClick={() => setShowRaw((v) => !v)}
              >
                {showRaw ? t('drama.genQueue.collapseRawError') : t('drama.genQueue.viewRawError')}
              </button>
            ) : null}
            {showRaw && rawError ? <pre className="drama-gen-detail-raw">{rawError}</pre> : null}
          </section>
        ) : (
          <section className={`drama-gen-detail-card${isActive ? '' : ' is-done'}`}>
            <h4>{statusLabel[job.status]}</h4>
            <p>{activeJobHint(job, t)}</p>
            {job.status === 'done' ? (
              <p className="drama-gen-detail-tip">{t('drama.genQueue.doneTip')}</p>
            ) : null}
          </section>
        )}
      </div>
    </div>
  )
}
