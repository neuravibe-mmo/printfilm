import { useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { api } from '../../api'
import type { Project, Shot } from '../../api'

export interface ShotTrimModalProps {
  projectId: number
  shot: Shot
  initialVideoDuration?: number
  onClose: () => void
  onSuccess: (updatedProject: Project, newDuration: number) => void
}

export default function ShotTrimModal({
  projectId,
  shot,
  initialVideoDuration = 10,
  onClose,
  onSuccess,
}: ShotTrimModalProps) {
  const { t } = useI18n()
  const trimVideoRef = useRef<HTMLVideoElement | null>(null)

  const [videoDuration, setVideoDuration] = useState<number>(initialVideoDuration)
  const [startSec, setStartSec] = useState<number>(0)
  const [endSec, setEndSec] = useState<number>(() =>
    Math.min(Number(shot.duration) || 3, initialVideoDuration),
  )
  const [trimBusy, setTrimBusy] = useState(false)
  const [error, setError] = useState('')

  function stepTime(field: 'start' | 'end', delta: number) {
    if (field === 'start') {
      const v = Math.max(0, Math.min(endSec - 0.2, Number((startSec + delta).toFixed(1))))
      setStartSec(v)
      if (trimVideoRef.current) trimVideoRef.current.currentTime = v
    } else {
      const v = Math.min(videoDuration, Math.max(startSec + 0.2, Number((endSec + delta).toFixed(1))))
      setEndSec(v)
      if (trimVideoRef.current) trimVideoRef.current.currentTime = v
    }
  }

  async function handleTrimSave() {
    setTrimBusy(true)
    setError('')
    try {
      const next = await api.trimVideo(projectId, shot.id, startSec, endSec)
      onSuccess(next, endSec - startSec)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'))
    } finally {
      setTrimBusy(false)
    }
  }

  async function handleSyncDurationToVideo() {
    setTrimBusy(true)
    setError('')
    try {
      const targetSec = Math.round(videoDuration)
      await api.updateShot(projectId, shot.id, { duration: targetSec })
      const next = await api.getProject(projectId)
      onSuccess(next, videoDuration)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'))
    } finally {
      setTrimBusy(false)
    }
  }

  const cutDuration = Math.max(0.1, endSec - startSec)
  const targetDuration = Math.min(Number(shot.duration) || 3, videoDuration)
  const midStart = Math.max(0, (videoDuration - targetDuration) / 2)
  const endStart = Math.max(0, videoDuration - targetDuration)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pf-trim-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pf-trim-modal-head">
          <h3 style={{ margin: 0 }}>
            ✂ {t('studio.storyboard.trimVideo')} · {t('studio.storyboard.shotNo').replace('{no}', String(shot.shot_no))}
          </h3>
          <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>

        {error && (
          <div
            style={{
              margin: '0.75rem 1.5rem 0',
              padding: '0.6rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <div className="pf-trim-modal-body">
          <div className="pf-trim-left">
            {/* 3 Overview Stat Badges */}
            <div className="pf-trim-stats-grid">
              <div className="pf-trim-stat-box">
                <span className="pf-trim-stat-label">Video gốc AI</span>
                <span className="pf-trim-stat-val">{videoDuration.toFixed(1)}s</span>
              </div>
              <div className="pf-trim-stat-box">
                <span className="pf-trim-stat-label">Cấu hình kịch bản</span>
                <span className="pf-trim-stat-val">{shot.duration}s</span>
              </div>
              <div className="pf-trim-stat-box pf-trim-stat-highlight">
                <span className="pf-trim-stat-label">Đoạn chọn cắt</span>
                <span className="pf-trim-stat-val">
                  {cutDuration.toFixed(1)}s
                  <small> ({startSec.toFixed(1)}s - {endSec.toFixed(1)}s)</small>
                </span>
              </div>
            </div>

            {/* Visual Timeline Track */}
            <div className="pf-trim-track-card">
              <div className="pf-trim-track-header">
                <span>Thanh tiến trình cắt video:</span>
                <strong>{((cutDuration / videoDuration) * 100).toFixed(0)}% độ dài video</strong>
              </div>
              <div className="pf-trim-timeline-track">
                <div
                  className="pf-trim-timeline-active"
                  style={{
                    left: `${(startSec / videoDuration) * 100}%`,
                    width: `${Math.max(1.5, (cutDuration / videoDuration) * 100)}%`,
                  }}
                />
              </div>
              <div className="pf-trim-timeline-ticks">
                <span>0s</span>
                <span>{(videoDuration * 0.25).toFixed(1)}s</span>
                <span>{(videoDuration * 0.5).toFixed(1)}s</span>
                <span>{(videoDuration * 0.75).toFixed(1)}s</span>
                <span>{videoDuration.toFixed(1)}s</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pf-trim-presets-container">
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                Chọn nhanh đoạn {targetDuration.toFixed(1)}s theo kịch bản:
              </div>
              <div className="pf-trim-presets-grid">
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost"
                  onClick={() => {
                    setStartSec(0)
                    setEndSec(targetDuration)
                    if (trimVideoRef.current) trimVideoRef.current.currentTime = 0
                  }}
                >
                  ⏮ Đoạn đầu (0s - {targetDuration.toFixed(1)}s)
                </button>
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost"
                  onClick={() => {
                    const s = Number(midStart.toFixed(1))
                    const e = Number((midStart + targetDuration).toFixed(1))
                    setStartSec(s)
                    setEndSec(e)
                    if (trimVideoRef.current) trimVideoRef.current.currentTime = s
                  }}
                >
                  ⏸ Đoạn giữa ({midStart.toFixed(1)}s - {(midStart + targetDuration).toFixed(1)}s)
                </button>
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost"
                  onClick={() => {
                    const s = Number(endStart.toFixed(1))
                    const e = Number(videoDuration.toFixed(1))
                    setStartSec(s)
                    setEndSec(e)
                    if (trimVideoRef.current) trimVideoRef.current.currentTime = s
                  }}
                >
                  ⏭ Đoạn cuối ({endStart.toFixed(1)}s - {videoDuration.toFixed(1)}s)
                </button>
              </div>
            </div>

            {/* Adjust Range Sliders with Steppers */}
            <div className="pf-trim-adjust-box">
              <div className="pf-trim-adjust-row">
                <div className="pf-trim-adjust-label">
                  <span>Điểm bắt đầu (Start):</span>
                  <strong>{startSec.toFixed(1)}s</strong>
                </div>
                <div className="pf-trim-stepper-control">
                  <button
                    type="button"
                    className="pf-step-btn"
                    onClick={() => stepTime('start', -0.1)}
                    title="-0.1s"
                  >
                    -0.1s
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, videoDuration - 0.5)}
                    step={0.1}
                    value={startSec}
                    onChange={(e) => {
                      const newStart = Number(e.target.value)
                      let newEnd = endSec
                      if (newStart >= newEnd) {
                        newEnd = Math.min(videoDuration, newStart + 0.5)
                      }
                      setStartSec(newStart)
                      setEndSec(newEnd)
                      if (trimVideoRef.current) trimVideoRef.current.currentTime = newStart
                    }}
                  />
                  <button
                    type="button"
                    className="pf-step-btn"
                    onClick={() => stepTime('start', 0.1)}
                    title="+0.1s"
                  >
                    +0.1s
                  </button>
                </div>
              </div>

              <div className="pf-trim-adjust-row">
                <div className="pf-trim-adjust-label">
                  <span>Điểm kết thúc (End):</span>
                  <strong>{endSec.toFixed(1)}s</strong>
                </div>
                <div className="pf-trim-stepper-control">
                  <button
                    type="button"
                    className="pf-step-btn"
                    onClick={() => stepTime('end', -0.1)}
                    title="-0.1s"
                  >
                    -0.1s
                  </button>
                  <input
                    type="range"
                    min={Math.min(videoDuration, startSec + 0.5)}
                    max={videoDuration}
                    step={0.1}
                    value={endSec}
                    onChange={(e) => {
                      const newEnd = Number(e.target.value)
                      setEndSec(newEnd)
                      if (trimVideoRef.current) trimVideoRef.current.currentTime = newEnd
                    }}
                  />
                  <button
                    type="button"
                    className="pf-step-btn"
                    onClick={() => stepTime('end', 0.1)}
                    title="+0.1s"
                  >
                    +0.1s
                  </button>
                </div>
              </div>
            </div>

            {/* Sync duration card */}
            <div className="pf-trim-sync-card">
              <div>
                <strong>Không muốn cắt ngắn video?</strong>
                <div className="pf-muted">
                  Giữ trọn video {videoDuration.toFixed(0)}s của AI và đổi thời lượng kịch bản thành {videoDuration.toFixed(0)}s.
                </div>
              </div>
              <button
                type="button"
                className="pf-btn pf-btn-outline pf-btn-sm"
                disabled={trimBusy}
                onClick={handleSyncDurationToVideo}
              >
                🔄 Đặt thời lượng = {videoDuration.toFixed(0)}s
              </button>
            </div>
          </div>

          {/* Right Column: Video Preview */}
          <div className="pf-trim-right">
            <div className="pf-trim-video-card">
              <div className="pf-trim-video-container">
                <video
                  ref={trimVideoRef}
                  src={api.assetUrl(shot.video_url!, shot.version)}
                  controls
                  playsInline
                  onLoadedMetadata={(e) => {
                    const d = (e.target as HTMLVideoElement).duration
                    if (d && !isNaN(d) && Math.abs(d - videoDuration) > 0.1) {
                      setVideoDuration(d)
                      setEndSec((prev) => Math.min(prev, d))
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const v = e.target as HTMLVideoElement
                    if (v.currentTime >= endSec) {
                      v.pause()
                      v.currentTime = startSec
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className="pf-trim-play-preview-btn"
                onClick={() => {
                  if (trimVideoRef.current) {
                    trimVideoRef.current.currentTime = startSec
                    trimVideoRef.current.play()
                  }
                }}
              >
                ▶ Xem thử đoạn đã chọn ({cutDuration.toFixed(1)}s)
              </button>
            </div>
          </div>
        </div>

        <div className="pf-trim-modal-foot">
          <div className="pf-trim-foot-summary">
            <span>
              Đoạn chọn: <strong>{startSec.toFixed(1)}s</strong> ➔ <strong>{endSec.toFixed(1)}s</strong>
            </span>
            <span className="pf-trim-foot-dur">({cutDuration.toFixed(1)} giây)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              className="pf-btn pf-btn-ghost"
              disabled={trimBusy}
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="pf-btn pf-btn-lime"
              disabled={trimBusy}
              onClick={handleTrimSave}
              style={{ minWidth: '130px', fontWeight: 600 }}
            >
              {trimBusy ? t('common.saving') : '✂ Cắt & Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
