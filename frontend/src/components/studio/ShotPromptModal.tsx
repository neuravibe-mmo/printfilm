import { useEffect, useState } from 'react'
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
  tab?: 'image' | 'video'
  open: boolean
  onClose: () => void
  onEditShot?: (shot: Shot) => void
}

export default function ShotPromptModal({
  projectId,
  shot,
  tab = 'image',
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
  const [showRefHelp, setShowRefHelp] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setCopied(false)
    setShowBreakdown(false)
    setShowRefHelp(false)

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
  }, [open, projectId, shot.id, t])

  useEffect(() => {
    if (!showBreakdown && !showRefHelp) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBreakdown(false)
        setShowRefHelp(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showBreakdown, showRefHelp])

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
  const isVideo = tab === 'video'
  const activePrompt = isVideo
    ? (data?.video_prompt || shot.video_prompt || '')
    : (data?.full_prompt || shot.img_prompt || '')
  const activeRaw = isVideo
    ? (data?.raw_video_prompt || shot.video_prompt || '')
    : (data?.raw_prompt || shot.img_prompt || '')
  const refs = isVideo
    ? (data?.video_detailed_refs || [])
    : (data?.detailed_refs || [])
  const activeModel = isVideo ? data?.video_model : data?.image_model

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          isVideo
            ? (t('studio.storyboard.videoPromptModalTitle', { no: shot.shot_no }) || `Chi tiết Video Prompt · Cảnh ${String(shot.shot_no).padStart(2, '0')}`)
            : (t('studio.storyboard.promptModalTitle', { no: shot.shot_no }) || `Chi tiết Prompt & Tham chiếu · Cảnh ${String(shot.shot_no).padStart(2, '0')}`)
        }
        size="xl"
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
            {activeModel ? (
              <span className="pf-badge pf-badge-info">
                <strong>{t('studio.storyboard.promptMetaModel', { model: activeModel }) || `Model: ${activeModel}`}</strong>
              </span>
            ) : null}
            {!isVideo && data?.aspect_ratio ? (
              <span className="pf-badge pf-badge-info">
                <strong>{t('studio.storyboard.promptMetaRatio', { ratio: data.aspect_ratio }) || `Tỷ lệ: ${data.aspect_ratio}`}</strong>
              </span>
            ) : null}
            {!isVideo && data?.image_size ? (
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
                <strong>{isVideo ? (t('studio.storyboard.videoPromptLabel') || 'Nội dung Video Prompt (gửi tới AI)') : (t('studio.storyboard.fullPromptLabel') || 'Nội dung Prompt đầy đủ (gửi tới AI)')}</strong>
                {!isVideo ? (
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
                ) : null}
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

            {!isVideo && showBreakdown ? (
              <div className="pf-prompt-breakdown-card" role="region" aria-label="Phân rã prompt">
                <div className="pf-prompt-breakdown-header">
                  <div className="pf-prompt-breakdown-title">
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
                <div className="pf-prompt-breakdown-body">
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
            <div className="pf-prompt-box">
              <pre className="pf-prompt-text">{activePrompt || t('studio.storyboard.emptyPrompt') || '(Chưa có nội dung prompt)'}</pre>
            </div>
          </div>

          {/* Section 2: Reference Images */}
          <div className="pf-prompt-card">
            <div className="pf-prompt-card-header">
              <div className="pf-prompt-card-title">
                <Images size={18} strokeWidth={2} className="pf-prompt-icon-svg pf-prompt-icon-amber" />
                <strong>{isVideo ? (t('studio.storyboard.videoRefImagesTitle') || 'Ảnh tham chiếu Video') : (t('studio.storyboard.refImagesTitle') || 'Ảnh tham chiếu (Reference Images)')}</strong>
                <button
                  type="button"
                  className={`pf-prompt-help-btn ${showRefHelp ? 'is-active' : ''}`}
                  onClick={() => setShowRefHelp((prev) => !prev)}
                  title={t('studio.storyboard.refHelpAria') || 'Xem nguồn gốc ảnh tham chiếu'}
                  aria-label={t('studio.storyboard.refHelpAria') || 'Xem nguồn gốc ảnh tham chiếu'}
                  aria-expanded={showRefHelp}
                >
                  <CircleHelp size={16} strokeWidth={2} />
                </button>
              </div>
              <span className="pf-prompt-count-pill">{t('studio.storyboard.imagesCountPill', { count: refs.length }) || `${refs.length} ảnh`}</span>
            </div>

            {showRefHelp ? (
              <div className="pf-prompt-breakdown-card is-ref" role="region" aria-label="Nguồn gốc ảnh tham chiếu">
                <div className="pf-prompt-breakdown-header">
                  <div className="pf-prompt-breakdown-title">
                    <Images size={15} strokeWidth={2} className="pf-prompt-icon-svg pf-prompt-icon-amber" />
                    <strong>{t('studio.storyboard.refHelpTitle') || 'Nguồn gốc ảnh tham chiếu'}</strong>
                  </div>
                  <button
                    type="button"
                    className="pf-prompt-tooltip-close"
                    onClick={() => setShowRefHelp(false)}
                    aria-label={t('common.close') || 'Đóng'}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
                <div className="pf-prompt-breakdown-body">
                  <div className="pf-prompt-part">
                    <div className="pf-prompt-part-label">
                      <span className="pf-dot pf-dot-blue" />
                      <strong>{t('studio.storyboard.refSourcePrevTitle') || '1. Ảnh của cảnh liền trước:'}</strong>
                    </div>
                    <div className="pf-prompt-part-val">
                      {t('studio.storyboard.refSourcePrevDesc') || 'Từ Cảnh 02 trở đi, hệ thống lấy ảnh cảnh trước để giữ tính nhất quán về nhân vật, trang phục và phong cách (Cảnh 01 không có).'}
                    </div>
                  </div>

                  <div className="pf-prompt-part">
                    <div className="pf-prompt-part-label">
                      <span className="pf-dot pf-dot-green" />
                      <strong>{t('studio.storyboard.refSourceProjTitle') || '2. Ảnh tham chiếu của Dự án:'}</strong>
                    </div>
                    <div className="pf-prompt-part-val">
                      {t('studio.storyboard.refSourceProjDesc') || 'Ảnh sản phẩm, nhân vật hoặc tài sản thương hiệu do bạn tải lên khi tạo/cài đặt dự án.'}
                    </div>
                  </div>

                  <div className="pf-prompt-part">
                    <div className="pf-prompt-part-label">
                      <span className="pf-dot pf-dot-amber" />
                      <strong>{t('studio.storyboard.refSourceTplTitle') || '3. Ảnh phong cách từ Template:'}</strong>
                    </div>
                    <div className="pf-prompt-part-val">
                      {t('studio.storyboard.refSourceTplDesc') || 'Ảnh mẫu phong cách được thiết lập sẵn trong Template để định hình tone màu và đường nét.'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

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
