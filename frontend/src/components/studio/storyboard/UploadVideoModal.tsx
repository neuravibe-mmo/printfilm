import { useEffect, useRef, useState } from 'react'
import { Upload, X, CheckCircle, AlertTriangle, Film } from 'lucide-react'
import { api, type Shot } from '../../../api'
import { useI18n } from '../../../i18n'
import { IconClipboardPaste } from '../../ui/Icons'
import Modal from '../../ui/Modal'

export interface UploadVideoModalProps {
  projectId: number
  shot: Shot
  open: boolean
  onClose: () => void
  onUploaded: (updatedShot: Shot) => void
}

const ACCEPTED = '.mp4,.webm,.mov,.mkv'
const MAX_MB = 500

export default function UploadVideoModal({
  projectId,
  shot,
  open,
  onClose,
  onUploaded,
}: UploadVideoModalProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const reset = () => {
    setFile(null)
    setError(null)
    setDone(false)
    setUploading(false)
  }

  const handleClose = () => {
    if (uploading) return
    reset()
    onClose()
  }

  const validateFile = (f: File): string | null => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['mp4', 'webm', 'mov', 'mkv'].includes(ext) && !f.type.startsWith('video/')) {
      return t('studio.storyboard.uploadVideoInvalidType') || 'Chỉ hỗ trợ MP4, WebM, MOV, MKV'
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return t('studio.storyboard.uploadVideoTooLarge') || `Video không được vượt quá ${MAX_MB}MB`
    }
    return null
  }

  const pickFile = (f: File) => {
    setError(null)
    setDone(false)
    const err = validateFile(f)
    if (err) { setError(err); return }
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const handlePasteVideo = async () => {
    if (uploading || done) return
    setError(null)

    // 1. Thử đọc trực tiếp từ navigator.clipboard.read()
    if (navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          const videoType = item.types.find(
            (t) => t.startsWith('video/') || t === 'application/x-matroska'
          )
          if (videoType) {
            const blob = await item.getType(videoType)
            const ext = videoType.includes('quicktime')
              ? 'mov'
              : videoType.includes('matroska')
              ? 'mkv'
              : videoType.split('/')[1] || 'mp4'
            const pastedFile = new File([blob], `pasted_video_${Date.now()}.${ext}`, {
              type: videoType,
            })
            pickFile(pastedFile)
            return
          }
        }
      } catch (err) {
        console.warn('navigator.clipboard.read failed or permission denied:', err)
      }
    }

    // 2. Thử đọc URL video từ clipboard
    try {
      if (navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText().catch(() => '')).trim()
        if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('blob:') || text.startsWith('/static/'))) {
          const match = text.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i)
          if (match) {
            try {
              const res = await fetch(text)
              const blob = await res.blob()
              const ext = match[1].toLowerCase()
              const filename = text.split('/').pop()?.split('?')[0] || `video_${Date.now()}.${ext}`
              const pastedFile = new File([blob], filename, {
                type: blob.type || `video/${ext}`,
              })
              pickFile(pastedFile)
              return
            } catch (fetchErr) {
              console.warn('Failed to fetch video URL from clipboard:', fetchErr)
            }
          }
        }
      }
    } catch {
      // ignore
    }

    setError(
      t('studio.storyboard.uploadVideoPasteHint') ||
        'Không tìm thấy file video trong clipboard. Hãy sao chép file video và nhấn Ctrl+V (Cmd+V) để dán.'
    )
  }

  // Hỗ trợ phím tắt dán trực tiếp (Ctrl+V / Cmd+V) khi modal đang mở
  useEffect(() => {
    if (!open) return
    const onPaste = (e: ClipboardEvent) => {
      if (uploading || done) return
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const f = e.clipboardData.files[i]
          if (f.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(f.name)) {
            e.preventDefault()
            pickFile(f)
            return
          }
        }
      }
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i]
          if (item.kind === 'file') {
            const f = item.getAsFile()
            if (f && (f.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(f.name))) {
              e.preventDefault()
              pickFile(f)
              return
            }
          }
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [open, uploading, done])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const updatedShot = await api.uploadShotVideo(projectId, shot.id, file)
      setDone(true)
      setUploading(false)
      onUploaded(updatedShot)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || (t('studio.storyboard.uploadVideoFailed') || 'Upload thất bại'))
      setUploading(false)
    }
  }

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        t('studio.storyboard.uploadVideoModalTitle', { no: shot.shot_no }) ||
        `Upload Video · Cảnh ${String(shot.shot_no).padStart(2, '0')}`
      }
      size="md"
      footer={
        <div className="pf-prompt-modal-footer">
          <button type="button" className="pf-btn pf-btn-secondary" onClick={handleClose} disabled={uploading}>
            {t('common.cancel') || 'Huỷ'}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-primary"
            disabled={!file || uploading || done}
            onClick={handleUpload}
          >
            {uploading ? (
              <><span className="pf-spinner pf-spinner-sm" />{t('studio.storyboard.uploadVideoUploading') || 'Đang tải lên...'}</>
            ) : done ? (
              <><CheckCircle size={15} />{t('studio.storyboard.uploadVideoSuccess') || 'Thành công!'}</>
            ) : (
              <><Upload size={15} />{t('studio.storyboard.uploadVideoBtn') || 'Tải lên'}</>
            )}
          </button>
        </div>
      }
    >
      <div className="pf-upload-video-body">
        {/* Shot info & Paste button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="pf-badge pf-badge-scene">
              {t('studio.storyboard.promptMetaScene', { no: String(shot.shot_no).padStart(2, '0') }) ||
                `Cảnh ${String(shot.shot_no).padStart(2, '0')}`}
            </span>
            {shot.video_url && (
              <span className="pf-badge pf-badge-info">
                {t('studio.storyboard.uploadVideoHasExisting') || 'Đang có video – sẽ bị thay thế'}
              </span>
            )}
          </div>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
            onClick={handlePasteVideo}
            disabled={uploading || done}
            title={t('studio.storyboard.uploadVideoPasteTip') || 'Dán file video từ clipboard (Ctrl+V / Cmd+V)'}
            style={{ height: '30px', padding: '0 0.65rem', fontSize: '0.82rem', gap: '0.35rem' }}
          >
            <IconClipboardPaste size={15} />
            <span>{t('studio.storyboard.uploadVideoPasteBtn') || 'Dán video'}</span>
          </button>
        </div>

        {/* Drop zone */}
        <div
          className={`pf-upload-dropzone ${dragging ? 'is-drag' : ''} ${file ? 'has-file' : ''} ${done ? 'is-done' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && !done && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
          aria-label={t('studio.storyboard.uploadVideoDropLabel') || 'Kéo thả hoặc chọn file video'}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
          />
          {done ? (
            <div className="pf-upload-dropzone-inner">
              <CheckCircle size={40} className="pf-upload-icon pf-upload-icon-success" />
              <p className="pf-upload-hint pf-upload-hint-success">
                {t('studio.storyboard.uploadVideoSuccessMsg') || 'Video đã được lưu thành công!'}
              </p>
            </div>
          ) : file ? (
            <div className="pf-upload-dropzone-inner">
              <Film size={36} className="pf-upload-icon pf-upload-icon-file" />
              <p className="pf-upload-filename">{file.name}</p>
              <p className="pf-upload-hint">{fileSizeMB} MB</p>
              {!uploading && (
                <button
                  type="button"
                  className="pf-upload-clear-btn"
                  onClick={(e) => { e.stopPropagation(); reset() }}
                  aria-label={t('common.remove') || 'Xoá'}
                >
                  <X size={14} />{t('common.remove') || 'Xoá'}
                </button>
              )}
            </div>
          ) : (
            <div className="pf-upload-dropzone-inner">
              <Upload size={36} className="pf-upload-icon" />
              <p className="pf-upload-main-text">
                {t('studio.storyboard.uploadVideoDrop') || 'Kéo thả video vào đây,'}{' '}
                <span className="pf-upload-link">
                  {t('studio.storyboard.uploadVideoBrowse') || 'chọn từ máy tính'}
                </span>
                {' '}{t('studio.storyboard.uploadVideoOr') || 'hoặc'}{' '}
                <button
                  type="button"
                  className="pf-upload-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePasteVideo()
                  }}
                  title={t('studio.storyboard.uploadVideoPasteTip') || 'Dán file video từ clipboard (Ctrl+V / Cmd+V)'}
                >
                  <IconClipboardPaste size={14} />
                  <span>{t('studio.storyboard.uploadVideoPasteInline') || 'dán từ clipboard'}</span>
                </button>
              </p>
              <p className="pf-upload-hint">
                {t('studio.storyboard.uploadVideoHint') || `MP4, WebM, MOV, MKV · Tối đa ${MAX_MB}MB`}
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="pf-prompt-alert pf-prompt-alert-warning" style={{ marginTop: '0.75rem' }}>
            <AlertTriangle size={15} strokeWidth={2} className="pf-alert-icon-svg" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload progress hint */}
        {uploading && (
          <div className="pf-prompt-loading" style={{ marginTop: '0.75rem' }}>
            <span className="pf-spinner" />
            <span>{t('studio.storyboard.uploadVideoUploadingHint') || 'Đang tải lên, vui lòng chờ...'}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
