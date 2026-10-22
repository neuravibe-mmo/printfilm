import { useEffect, useRef, type ChangeEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../../api'
import { useI18n } from '../../../i18n'
import { IconClipboardPaste, IconSparkles } from '../../ui/Icons'

export type ReferenceItemProps = {
  icon?: ReactNode
  promptLabel: string
  promptPlaceholder: string
  promptValue: string
  onChangePrompt: (val: string) => void
  onAiGenerate?: () => Promise<void>
  aiGenerating?: boolean
  imageUrl?: string | null
  imageHint: string
  uploadButtonText: string
  uploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  onPaste: () => void
  onGenerateImage?: () => Promise<void> | void
  generatingImage?: boolean
}

export function ReferenceItemCard({
  icon,
  promptLabel,
  promptPlaceholder,
  promptValue,
  onChangePrompt,
  onAiGenerate,
  aiGenerating,
  imageUrl,
  imageHint,
  uploadButtonText,
  uploading,
  onUpload,
  onRemove,
  onPaste,
  onGenerateImage,
  generatingImage,
}: ReferenceItemProps) {
  const { t } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const adjust = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    adjust()
    window.addEventListener('resize', adjust)
    return () => window.removeEventListener('resize', adjust)
  }, [promptValue])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      {/* Mô tả bên trên */}
      <div className="pf-field" style={{ marginTop: '0.75rem' }}>
        <div style={{ marginBottom: '0.35rem' }}>
          <span className="pf-field-label" style={{ margin: 0 }}>
            {promptLabel}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="pf-field-input"
            placeholder={promptPlaceholder}
            value={promptValue}
            onChange={(e) => {
              onChangePrompt(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            rows={2}
            style={{
              resize: 'none',
              overflow: 'hidden',
              minHeight: '56px',
              lineHeight: '1.5',
              boxSizing: 'border-box',
              paddingRight: onAiGenerate ? '40px' : '0.8rem',
            }}
          />
          {onAiGenerate && (
            <button
              type="button"
              className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
              title={aiGenerating ? t('studio.styleConfig.generating') : 'AI Generate'}
              disabled={aiGenerating || uploading}
              onClick={onAiGenerate}
              style={{
                position: 'absolute',
                top: '7px',
                right: '8px',
                width: '28px',
                height: '28px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(0, 0, 0, 0.65)',
                background: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                cursor: aiGenerating ? 'not-allowed' : 'pointer',
                opacity: aiGenerating ? 0.5 : 1,
                zIndex: 2,
              }}
            >
              {aiGenerating ? <Loader2 size={15} className="pf-tool-spin" /> : <IconSparkles size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Ảnh tham chiếu bên dưới */}
      <div style={{ marginTop: '0.75rem' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {imageUrl ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginTop: '0.4rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src={api.assetUrl(imageUrl)}
                alt="Reference"
                style={{
                  width: '64px',
                  height: '64px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid var(--pf-border, rgba(255,255,255,0.12))',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="pf-btn pf-btn-ghost pf-btn-sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? t('studio.styleConfig.uploadingRefImage') : t('studio.styleConfig.changeRefImage')}
                  </button>
                  <button
                    type="button"
                    className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
                    title={t('studio.styleConfig.pasteRefImage')}
                    disabled={uploading || generatingImage}
                    style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', flexShrink: 0 }}
                    onClick={onPaste}
                  >
                    <IconClipboardPaste size={16} />
                  </button>
                  {onGenerateImage && (
                    <button
                      type="button"
                      className="pf-btn pf-btn-ghost pf-btn-sm"
                      title={!promptValue.trim() ? 'Vui lòng nhập mô tả bên trên để tạo ảnh AI' : 'Tạo lại ảnh AI từ mô tả'}
                      disabled={!promptValue.trim() || generatingImage || uploading}
                      onClick={onGenerateImage}
                      style={{
                        height: '32px',
                        padding: '0 0.65rem',
                        fontSize: '0.78rem',
                        cursor: !promptValue.trim() || generatingImage ? 'not-allowed' : 'pointer',
                        opacity: !promptValue.trim() ? 0.45 : generatingImage ? 0.7 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {generatingImage ? <Loader2 size={14} className="pf-tool-spin" /> : <IconSparkles size={14} />}
                      <span>{generatingImage ? t('studio.styleConfig.generating') : 'AI Generate'}</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm"
                  disabled={uploading}
                  style={{
                    color: '#ef4444',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '0 0.65rem',
                    height: '26px',
                  }}
                  onClick={onRemove}
                >
                  {t('studio.styleConfig.removeRefImage')}
                </button>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--pf-muted, rgba(255, 255, 255, 0.4))',
                opacity: 0.75,
                marginLeft: 'auto',
                textAlign: 'right',
              }}
            >
              {imageHint}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="pf-tool-spin" />
                    <span>{t('studio.styleConfig.uploadingRefImage')}</span>
                  </>
                ) : (
                  <>
                    {icon}
                    <span>{uploadButtonText}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
                title={t('studio.styleConfig.pasteRefImage')}
                disabled={uploading || generatingImage}
                style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', flexShrink: 0 }}
                onClick={onPaste}
              >
                <IconClipboardPaste size={16} />
              </button>
              {onGenerateImage && (
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm"
                  title={!promptValue.trim() ? 'Vui lòng nhập mô tả bên trên để tạo ảnh AI' : 'Tạo ảnh AI từ mô tả'}
                  disabled={!promptValue.trim() || generatingImage || uploading}
                  onClick={onGenerateImage}
                  style={{
                    height: '32px',
                    padding: '0 0.65rem',
                    fontSize: '0.78rem',
                    cursor: !promptValue.trim() || generatingImage ? 'not-allowed' : 'pointer',
                    opacity: !promptValue.trim() ? 0.45 : generatingImage ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {generatingImage ? <Loader2 size={14} className="pf-tool-spin" /> : <IconSparkles size={14} />}
                  <span>{generatingImage ? t('studio.styleConfig.generating') : 'AI Generate'}</span>
                </button>
              )}
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--pf-muted, rgba(255, 255, 255, 0.4))',
                opacity: 0.75,
                marginLeft: 'auto',
                textAlign: 'right',
              }}
            >
              {imageHint}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReferenceItemCard
