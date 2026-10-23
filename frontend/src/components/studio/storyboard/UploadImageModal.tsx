import { useEffect, useRef, useState } from 'react'
import { Upload, X, CheckCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import { api, type Project, type Shot } from '../../../api'
import { useI18n } from '../../../i18n'
import { IconClipboardPaste } from '../../ui/Icons'
import Modal from '../../ui/Modal'

export interface UploadImageModalProps {
  projectId: number
  shot: Shot
  open: boolean
  onClose: () => void
  onUploaded: (updatedProject: Project) => void
}

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.gif'
const MAX_MB = 25

export default function UploadImageModal({
  projectId,
  shot,
  open,
  onClose,
  onUploaded,
}: UploadImageModalProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const reset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl(null)
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
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) && !f.type.startsWith('image/')) {
      return t('studio.storyboard.uploadImageInvalidType') || 'Chỉ hỗ trợ JPG, PNG, WebP, GIF'
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return t('studio.storyboard.uploadImageTooLarge') || `Hình ảnh không được vượt quá ${MAX_MB}MB`
    }
    return null
  }

  const pickFile = (f: File) => {
    setError(null)
    setDone(false)
    const err = validateFile(f)
    if (err) {
      setError(err)
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const handlePasteImage = async () => {
    if (uploading || done) return
    setError(null)

    // 1. Thử đọc trực tiếp từ navigator.clipboard.read()
    if (navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'))
          if (imageType) {
            const blob = await item.getType(imageType)
            const ext = imageType.split('/')[1] || 'png'
            const pastedFile = new File([blob], `pasted_image_${Date.now()}.${ext}`, {
              type: imageType,
            })
            pickFile(pastedFile)
            return
          }
        }
      } catch (err) {
        console.warn('navigator.clipboard.read failed or permission denied:', err)
      }
    }

    // 2. Thử đọc URL ảnh từ clipboard
    try {
      if (navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText().catch(() => '')).trim()
        if (
          text &&
          (text.startsWith('http://') ||
            text.startsWith('https://') ||
            text.startsWith('blob:') ||
            text.startsWith('/static/'))
        ) {
          const match = text.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)
          if (match) {
            try {
              const res = await fetch(text)
              const blob = await res.blob()
              const ext = match[1].toLowerCase()
              const filename = text.split('/').pop()?.split('?')[0] || `image_${Date.now()}.${ext}`
              const pastedFile = new File([blob], filename, {
                type: blob.type || `image/${ext}`,
              })
              pickFile(pastedFile)
              return
            } catch (fetchErr) {
              console.warn('Failed to fetch image URL from clipboard:', fetchErr)
            }
          }
        }
      }
    } catch {
      // ignore
    }

    setError(
      t('studio.storyboard.uploadImagePasteHint') ||
        'Không tìm thấy file ảnh trong clipboard. Hãy sao chép file ảnh và nhấn Ctrl+V (Cmd+V) để dán.',
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
          if (f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)) {
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
            if (f && (f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))) {
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
  }, [open, uploading, done, previewUrl])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const updatedProject = await api.uploadShotImage(projectId, shot.id, file)
      setDone(true)
      setUploading(false)
      onUploaded(updatedProject)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || (t('studio.storyboard.uploadImageFailed') || 'Upload thất bại'))
      setUploading(false)
    }
  }

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        t('studio.storyboard.uploadImageModalTitle', { no: shot.shot_no }) ||
        `Upload Hình ảnh · Cảnh ${String(shot.shot_no).padStart(2, '0')}`
      }
      size="md"
      footer={
        <div className="pf-prompt-modal-footer">
          <button
            type="button"
            className="pf-btn pf-btn-secondary"
            onClick={handleClose}
            disabled={uploading}
          >
            {t('common.cancel') || 'Huỷ'}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-primary"
            disabled={!file || uploading || done}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <span className="pf-spinner pf-spinner-sm" />
                {t('studio.storyboard.uploadImageUploading') || 'Đang tải lên...'}
              </>
            ) : done ? (
              <>
                <CheckCircle size={15} />
                {t('studio.storyboard.uploadImageSuccess') || 'Thành công!'}
              </>
            ) : (
              <>
                <Upload size={15} />
                {t('studio.storyboard.uploadImageBtn') || 'Tải lên'}
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="pf-upload-video-body">
        {/* Shot info & Paste button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="pf-badge pf-badge-scene">
              {t('studio.storyboard.promptMetaScene', { no: String(shot.shot_no).padStart(2, '0') }) ||
                `Cảnh ${String(shot.shot_no).padStart(2, '0')}`}
            </span>
            {shot.image_url && (
              <span className="pf-badge pf-badge-info">
                {t('studio.storyboard.uploadImageHasExisting') || 'Đang có ảnh – sẽ bị thay thế'}
              </span>
            )}
          </div>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
            onClick={handlePasteImage}
            disabled={uploading || done}
            title={t('studio.storyboard.uploadImagePasteTip') || 'Dán file ảnh từ clipboard (Ctrl+V / Cmd+V)'}
            style={{ height: '30px', padding: '0 0.65rem', fontSize: '0.82rem', gap: '0.35rem' }}
          >
            <IconClipboardPaste size={15} />
            <span>{t('studio.storyboard.uploadImagePasteBtn') || 'Dán ảnh'}</span>
          </button>
        </div>

        {/* Drop zone */}
        <div
          className={`pf-upload-dropzone ${dragging ? 'is-drag' : ''} ${file ? 'has-file' : ''} ${done ? 'is-done' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && !done && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
          aria-label={t('studio.storyboard.uploadImageDropLabel') || 'Kéo thả hoặc chọn file hình ảnh'}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) pickFile(f)
            }}
          />
          {done ? (
            <div className="pf-upload-dropzone-inner">
              <CheckCircle size={40} className="pf-upload-icon pf-upload-icon-success" />
              <p className="pf-upload-hint pf-upload-hint-success">
                {t('studio.storyboard.uploadImageSuccessMsg') || 'Hình ảnh đã được lưu thành công!'}
              </p>
            </div>
          ) : file ? (
            <div className="pf-upload-dropzone-inner">
              {previewUrl ? (
                <div
                  style={{
                    position: 'relative',
                    maxWidth: '280px',
                    maxHeight: '160px',
                    margin: '0 auto 0.65rem',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--pf-border, #334155)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '160px',
                      objectFit: 'contain',
                      display: 'block',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
              ) : (
                <ImageIcon size={36} className="pf-upload-icon pf-upload-icon-file" />
              )}
              <p className="pf-upload-filename">{file.name}</p>
              <p className="pf-upload-hint">{fileSizeMB} MB</p>
              {!uploading && (
                <button
                  type="button"
                  className="pf-upload-clear-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    reset()
                  }}
                  aria-label={t('common.remove') || 'Xóa'}
                >
                  <X size={14} />
                  {t('common.remove') || 'Xóa'}
                </button>
              )}
            </div>
          ) : (
            <div className="pf-upload-dropzone-inner">
              <Upload size={36} className="pf-upload-icon" />
              <p className="pf-upload-main-text">
                {t('studio.storyboard.uploadImageDrop') || 'Kéo thả hình ảnh vào đây,'}{' '}
                <span className="pf-upload-link">
                  {t('studio.storyboard.uploadImageBrowse') || 'chọn từ máy tính'}
                </span>{' '}
                {t('studio.storyboard.uploadVideoOr') || 'hoặc'}{' '}
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
                    handlePasteImage()
                  }}
                  title={t('studio.storyboard.uploadImagePasteTip') || 'Dán file ảnh từ clipboard (Ctrl+V / Cmd+V)'}
                >
                  <IconClipboardPaste size={14} />
                  <span>{t('studio.storyboard.uploadImagePasteInline') || 'dán từ clipboard'}</span>
                </button>
              </p>
              <p className="pf-upload-hint">
                {t('studio.storyboard.uploadImageHint') || `JPG, PNG, WebP, GIF · Tối đa ${MAX_MB}MB`}
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
            <span>
              {t('studio.storyboard.uploadImageUploadingHint') || 'Đang tải lên, vui lòng chờ...'}
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}
