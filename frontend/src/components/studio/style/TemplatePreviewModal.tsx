import { useEffect, useRef, useState } from 'react'
import { api, resolveVoiceId, type Template } from '../../../api'
import { useI18n } from '../../../i18n'
import { getCategoryLabel } from '../../../lib/categories'
import { getTemplateDescription, getTemplateName } from '../../../lib/templates'
import Modal from '../../ui/Modal'
import { IconPlay } from '../../ui/Icons'
import { isPortraitRatio } from './RatioPickerSection'

type TemplatePreviewModalProps = {
  open: boolean
  onClose: () => void
  template?: Template | null
  onApply?: () => void
}

export default function TemplatePreviewModal({
  open,
  onClose,
  template,
  onApply,
}: TemplatePreviewModalProps) {
  const { t, locale } = useI18n()
  const [activeSceneIdx, setActiveSceneIdx] = useState(0)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voices, setVoices] = useState<any[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (open) {
      api.voices().then(setVoices).catch(() => {})
    }
  }, [open])

  // Dừng phát âm thanh khi modal đóng hoặc đổi template
  useEffect(() => {
    if (!open) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlayingVoice(false)
      setActiveSceneIdx(0)
    }
  }, [open, template?.id])

  if (!template) return null

  const isPortrait = isPortraitRatio(template.default_ratio)
  const rawPreset = template.audio_config?.voice_preset || ''
  const resolvedVoiceId = resolveVoiceId(rawPreset, voices) || rawPreset
  const matchedVoice = voices.find((v) => v.id === resolvedVoiceId || v.speaker === resolvedVoiceId)
  const sampleScenes = template.sample_scenes || []
  const hasVideo = Boolean(template.preview_video && template.preview_video.trim())

  async function handleToggleVoice() {
    if (isPlayingVoice) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlayingVoice(false)
      return
    }

    if (!resolvedVoiceId) return
    setVoiceLoading(true)
    try {
      const res = await api.previewVoice(resolvedVoiceId)
      const url = api.assetUrl(res.url)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setIsPlayingVoice(false)
      audio.onerror = () => setIsPlayingVoice(false)
      setIsPlayingVoice(true)
      await audio.play()
    } catch {
      setIsPlayingVoice(false)
    } finally {
      setVoiceLoading(false)
    }
  }

  // Danh sách hình ảnh mẫu hiển thị (cover chính + sample scenes nếu có)
  const displayImages = [
    { image: template.preview_cover, caption: t('studio.styleConfig.previewStyleCover') },
    ...sampleScenes,
  ]

  const currentImage = displayImages[activeSceneIdx] || displayImages[0]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t('studio.styleConfig.previewModalTitle')} · ${getTemplateName(template, locale)}`}
      size="xl"
      className="pf-tpl-preview-modal-panel"
      footer={
        <div className="pf-tpl-modal-foot-row">
          <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" onClick={onClose}>
            {t('studio.styleConfig.previewClose')}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-lime pf-btn-sm"
            onClick={() => {
              if (onApply) onApply()
              onClose()
            }}
          >
            {t('studio.styleConfig.previewApply')}
          </button>
        </div>
      }
    >
      <div className="pf-tpl-modal-body">
        {/* CỘT TRÁI: VIDEO / HÌNH ẢNH MẪU */}
        <div className="pf-tpl-media-pane">
          <div
            className={[
              'pf-tpl-media-container',
              isPortrait ? 'is-portrait' : 'is-landscape',
            ].join(' ')}
          >
            {hasVideo ? (
              <video
                src={api.assetUrl(template.preview_video!)}
                poster={api.assetUrl(template.preview_cover)}
                controls
                autoPlay
                loop
                playsInline
                className="pf-tpl-video-player"
              />
            ) : (
              <div className="pf-tpl-image-wrapper">
                <img
                  src={api.assetUrl(currentImage.image)}
                  alt={currentImage.caption || getTemplateName(template, locale)}
                  className="pf-tpl-cover-img"
                />
                <div className="pf-tpl-media-overlay-badge">
                  <span>{currentImage.caption || t('studio.styleConfig.previewStyleCover')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dải thumbnail xem nhiều cảnh mẫu nếu có */}
          {displayImages.length > 1 ? (
            <div className="pf-tpl-thumb-strip">
              {displayImages.map((img, idx) => (
                <button
                  key={`${img.image}-${idx}`}
                  type="button"
                  className={[
                    'pf-tpl-thumb-btn',
                    activeSceneIdx === idx ? 'is-active' : '',
                  ].join(' ')}
                  onClick={() => setActiveSceneIdx(idx)}
                >
                  <img src={api.assetUrl(img.image)} alt="" />
                </button>
              ))}
            </div>
          ) : null}

          {/* Thông số kỹ thuật nhanh */}
          <div className="pf-tpl-quick-specs">
            <span className="pf-badge pf-badge-neutral">
              Tỷ lệ: <strong>{template.default_ratio}</strong>
            </span>
            <span className="pf-badge pf-badge-neutral">
              {t('studio.styleConfig.previewPacingVal')
                .replace('{min}', String(template.shot_duration_min))
                .replace('{max}', String(template.shot_duration_max))}
            </span>
            {template.is_premium ? (
              <span className="pf-badge pf-badge-lime">PRO</span>
            ) : null}
            {!hasVideo ? (
              <span className="pf-tpl-pending-hint">
                🎥 {t('studio.styleConfig.previewDemoVideoPending')}
              </span>
            ) : null}
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT CẤU HÌNH & DNA CỦA TEMPLATE */}
        <div className="pf-tpl-info-pane">
          <div className="pf-tpl-header-block">
            <h3>{getTemplateName(template, locale)}</h3>
            <div className="pf-tags" style={{ margin: '0.45rem 0' }}>
              {(template.category || []).map((c) => (
                <span key={c}>{getCategoryLabel(c)}</span>
              ))}
            </div>
            <p className="pf-tpl-desc">{getTemplateDescription(template, locale)}</p>
          </div>

          {/* Block: Giọng đọc & Nhạc nền */}
          <div className="pf-tpl-section-card">
            <h4>{t('studio.styleConfig.previewVoiceSample')} & Âm nhạc</h4>
            <div className="pf-tpl-audio-controls">
              {resolvedVoiceId ? (
                <>
                  <button
                    type="button"
                    className={[
                      'pf-btn pf-btn-sm',
                      isPlayingVoice ? 'pf-btn-danger' : 'pf-btn-ghost',
                    ].join(' ')}
                    onClick={handleToggleVoice}
                    disabled={voiceLoading}
                  >
                    <IconPlay size={14} />
                    {voiceLoading
                      ? t('studio.styleConfig.generating')
                      : isPlayingVoice
                        ? t('studio.styleConfig.previewStopVoice')
                        : t('studio.styleConfig.previewListenVoice')}
                  </button>
                  {matchedVoice ? (
                    <span className="pf-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                      {matchedVoice.label}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="pf-muted" style={{ fontSize: '0.82rem' }}>
                  {t('studio.styleConfig.default')}
                </span>
              )}

              {isPlayingVoice ? (
                <div className="pf-tpl-audio-wave">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
            </div>

            {template.audio_config?.bgm_mood ? (
              <div className="pf-tpl-bgm-row">
                <span className="pf-muted">{t('studio.styleConfig.previewBgmMood')}:</span>
                <strong>{template.audio_config.bgm_mood}</strong>
              </div>
            ) : null}
          </div>

          {/* Block: Prompt phong cách AI */}
          {template.style_prefix ? (
            <div className="pf-tpl-section-card">
              <h4>{t('studio.styleConfig.previewVisualPrompt')}</h4>
              <div className="pf-tpl-prompt-box">
                <code>{template.style_prefix}</code>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
