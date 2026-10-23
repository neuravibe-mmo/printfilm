import { useRef, useState } from 'react'
import { Upload, X, CheckCircle, AlertTriangle, Film } from 'lucide-react'
import { api, type Shot } from '../../../api'
import { useI18n } from '../../../i18n'
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
        {/* Shot info */}
        <div className="pf-prompt-meta-bar" style={{ marginBottom: '1rem' }}>
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
                {t('studio.storyboard.uploadVideoDrop') || 'Kéo thả video vào đây hoặc'}
                {' '}
                <span className="pf-upload-link">
                  {t('studio.storyboard.uploadVideoBrowse') || 'chọn từ máy tính'}
                </span>
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
