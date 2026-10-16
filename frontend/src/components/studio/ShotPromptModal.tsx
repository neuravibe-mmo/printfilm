import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Copy,
  ExternalLink,
  FileText,
  Images,
  Info,
  Layers,
  Pencil,
  X,
  ZoomIn,
} from 'lucide-react'
import { api, type Shot, type ShotPromptPreview } from '../../api'
import { useI18n } from '../../i18n'
import Modal from '../ui/Modal'

export interface ShotPromptModalProps {
  projectId: number
  shot: Shot
  open: boolean
  onClose: () => void
  onEditShot?: (shot: Shot) => void
}

export default function ShotPromptModal({
  projectId,
  shot,
  open,
  onClose,
  onEditShot,
}: ShotPromptModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ShotPromptPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const helpAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setCopied(false)
    setShowBreakdown(false)

    api
      .getShotPromptPreview(projectId, shot.id)
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || t('common.loadFailed') || 'Không thể tải thông tin prompt')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, projectId, shot.id])

  useEffect(() => {
    if (!showBreakdown) return
    const handleClickOutside = (e: MouseEvent) => {
      if (helpAnchorRef.current && !helpAnchorRef.current.contains(e.target as Node)) {
        setShowBreakdown(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBreakdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showBreakdown])

  const copyPromptText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = textToCopy
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Dự phòng khi đang tải hoặc lỗi: lấy trực tiếp từ shot prop
  const activePrompt = data?.full_prompt || shot.img_prompt || ''
  const activeRaw = data?.raw_prompt || shot.img_prompt || ''
  const refs = data?.detailed_refs || []

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t('studio.storyboard.promptModalTitle', { no: shot.shot_no }) || `Chi tiết Prompt & Tham chiếu · Cảnh ${String(shot.shot_no).padStart(2, '0')}`}
        size="lg"
        footer={
          <div className="pf-prompt-modal-footer">
            {onEditShot ? (
              <button
                type="button"
                className="pf-btn pf-btn-secondary"
                onClick={() => {
                  onClose()
                  onEditShot(shot)
                }}
              >
                <Pencil size={14} strokeWidth={2} />
                <span>{t('common.edit') || 'Chỉnh sửa cảnh'}</span>
              </button>
            ) : null}
            <button
              type="button"
              className="pf-btn pf-btn-primary"
              onClick={onClose}
            >
              {t('common.close') || 'Đóng'}
            </button>
          </div>
        }
      >
        <div className="pf-prompt-modal-body">
          {/* Metadata badges */}
          <div className="pf-prompt-meta-bar">
            <span className="pf-badge pf-badge-scene">
              {t('studio.storyboard.promptMetaScene', { no: String(shot.shot_no).padStart(2, '0') }) || `Cảnh ${String(shot.shot_no).padStart(2, '0')}`}
            </span>
            {data?.image_model ? (
              <span className="pf-badge pf-badge-info">
                <strong>{t('studio.storyboard.promptMetaModel', { model: data.image_model }) || `Model: ${data.image_model}`}</strong>
              </span>
            ) : null}
            {data?.aspect_ratio ? (
              <span className="pf-badge pf-badge-info">
                <strong>{t('studio.storyboard.promptMetaRatio', { ratio: data.aspect_ratio }) || `Tỷ lệ: ${data.aspect_ratio}`}</strong>
              </span>
            ) : null}
            {data?.image_size ? (
              <span className="pf-badge pf-badge-info">
                <strong>{t('studio.storyboard.promptMetaSize', { size: data.image_size }) || `Kích thước: ${data.image_size}`}</strong>
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="pf-prompt-loading">
              <span className="pf-spinner" />
              <span>{t('studio.storyboard.promptLoading') || 'Đang tính toán Prompt & tham chiếu theo cấu hình hiện tại...'}</span>
            </div>
          ) : null}

          {error ? (
            <div className="pf-prompt-alert pf-prompt-alert-warning">
              <AlertTriangle size={16} strokeWidth={2} className="pf-alert-icon-svg" />
              <span>{error} {t('studio.storyboard.promptFallbackLocal') || '(Hiển thị prompt phân cảnh cục bộ)'}</span>
            </div>
          ) : null}

          {/* Section 1: Full Prompt */}
          <div className="pf-prompt-card">
            <div className="pf-prompt-card-header">
              <div className="pf-prompt-card-title">
                <FileText size={18} strokeWidth={2} className="pf-prompt-icon-svg pf-prompt-icon-blue" />
                <strong>{t('studio.storyboard.fullPromptLabel') || 'Nội dung Prompt đầy đủ (gửi tới AI)'}</strong>
                <div className="pf-prompt-help-anchor" ref={helpAnchorRef}>
                  <button
                    type="button"
                    className={`pf-prompt-help-btn ${showBreakdown ? 'is-active' : ''}`}
                    onClick={() => setShowBreakdown((prev) => !prev)}
                    title={t('studio.storyboard.viewBreakdown') || 'Xem phân rã thành phần Prompt'}
                    aria-label={t('studio.storyboard.viewBreakdown') || 'Xem phân rã thành phần Prompt'}
                    aria-expanded={showBreakdown}
                  >
                    <CircleHelp size={16} strokeWidth={2} />
                  </button>

                  {showBreakdown ? (
                    <div className="pf-prompt-tooltip-popover" role="tooltip">
                      <div className="pf-prompt-tooltip-arrow" />
                      <div className="pf-prompt-tooltip-header">
                        <div className="pf-prompt-tooltip-title">
                          <Layers size={15} strokeWidth={2} className="pf-prompt-icon-svg pf-prompt-icon-purple" />
                          <strong>{t('studio.storyboard.promptBreakdownTitle') || 'Phân rã thành phần Prompt'}</strong>
                        </div>
                        <button
                          type="button"
                          className="pf-prompt-tooltip-close"
                          onClick={() => setShowBreakdown(false)}
                          aria-label={t('common.close') || 'Đóng'}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="pf-prompt-tooltip-body">
                        <div className="pf-prompt-part">
                          <div className="pf-prompt-part-label">
                            <span className="pf-dot pf-dot-green" />
                            <strong>{t('studio.storyboard.breakdownSceneVisual') || 'Bối cảnh cảnh quay (Scene Visual Prompt):'}</strong>
                          </div>
                          <div className="pf-prompt-part-val">{activeRaw || t('studio.storyboard.emptyVal') || '(Trống)'}</div>
                        </div>

                        {data?.style_prefix ? (
                          <div className="pf-prompt-part">
                            <div className="pf-prompt-part-label">
                              <span className="pf-dot pf-dot-blue" />
                              <strong>{t('studio.storyboard.breakdownStylePrefix') || 'Khóa phong cách từ Mẫu (Style Prefix):'}</strong>
                            </div>
                            <div className="pf-prompt-part-val">{data.style_prefix}</div>
                          </div>
                        ) : null}

                        {data?.negative_prompt ? (
                          <div className="pf-prompt-part">
                            <div className="pf-prompt-part-label">
                              <span className="pf-dot pf-dot-red" />
                              <strong>{t('studio.storyboard.breakdownNegativePrompt') || 'Prompt loại trừ (Negative Prompt):'}</strong>
                            </div>
                            <div className="pf-prompt-part-val pf-prompt-neg">{data.negative_prompt}</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className={`pf-btn-copy ${copied ? 'is-copied' : ''}`}
                onClick={() => copyPromptText(activePrompt)}
                disabled={!activePrompt}
                title={t('studio.storyboard.copyPromptTitle') || 'Sao chép toàn bộ prompt vào bộ nhớ tạm'}
              >
                {copied ? (
                  <Check size={14} strokeWidth={2.4} className="pf-btn-copy-icon" />
                ) : (
                  <Copy size={14} strokeWidth={2} className="pf-btn-copy-icon" />
                )}
                <span>{copied ? (t('studio.storyboard.copiedPrompt') || 'Đã sao chép') : (t('studio.storyboard.copyPrompt') || 'Sao chép Prompt')}</span>
              </button>
            </div>
            <div className="pf-prompt-box">
              <pre className="pf-prompt-text">{activePrompt || t('studio.storyboard.emptyPrompt') || '(Chưa có nội dung prompt)'}</pre>
            </div>
          </div>

          {/* Section 3: Reference Images */}
          <div className="pf-prompt-card">
            <div className="pf-prompt-card-title">
              <Images size={18} strokeWidth={2} className="pf-prompt-icon-svg pf-prompt-icon-amber" />
              <strong>{t('studio.storyboard.refImagesTitle') || 'Ảnh tham chiếu (Reference Images)'}</strong>
              <span className="pf-prompt-count-pill">{t('studio.storyboard.imagesCountPill', { count: refs.length }) || `${refs.length} ảnh`}</span>
            </div>

            {refs.length > 0 ? (
              <div className="pf-prompt-refs-grid">
                {refs.map((r, idx) => {
                  const fullUrl = api.assetUrl(r.url)
                  return (
                    <div key={`${r.url}-${idx}`} className="pf-prompt-ref-card">
                      <div
                        className="pf-prompt-ref-thumb"
                        onClick={() => setPreviewImg(fullUrl)}
                        title={t('studio.storyboard.clickToZoom') || 'Nhấn để phóng to ảnh'}
                      >
                        <img src={fullUrl} alt={r.label} loading="lazy" />
                        <div className="pf-prompt-ref-overlay">
                          <ZoomIn size={15} strokeWidth={2} />
                          <span>{t('studio.storyboard.promptZoomIn') || 'Phóng to'}</span>
                        </div>
                      </div>
                      <div className="pf-prompt-ref-info">
                        <span className="pf-prompt-ref-tag">{r.type}</span>
                        <div className="pf-prompt-ref-label" title={r.label}>
                          {r.label}
                        </div>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="pf-prompt-ref-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{t('studio.storyboard.openOriginal') || 'Mở ảnh gốc'}</span>
                          <ExternalLink size={12} strokeWidth={2} />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="pf-prompt-no-refs">
                <Info size={20} strokeWidth={2} className="pf-no-refs-icon-svg" />
                <div className="pf-no-refs-text">
                  <strong>{t('studio.storyboard.noRefsTitle') || 'Không có ảnh tham chiếu nào cho cảnh này.'}</strong>
                  <p>
                    {t('studio.storyboard.noRefsDesc') || 'Ảnh được tạo hoàn toàn bằng phương thức Text-to-Image dựa trên câu lệnh mô tả văn bản ở trên.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Lightbox / Preview ảnh lớn */}
      {previewImg ? (
        <div
          className="pf-lightbox-backdrop"
          onClick={() => setPreviewImg(null)}
        >
          <div className="pf-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pf-lightbox-close"
              onClick={() => setPreviewImg(null)}
              aria-label={t('common.close') || 'Đóng'}
            >
              <X size={20} strokeWidth={2} />
            </button>
            <img src={previewImg} alt={t('studio.storyboard.previewImage') || 'Preview'} />
          </div>
        </div>
      ) : null}
    </>
  )
}
