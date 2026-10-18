import { useEffect, useRef, type ChangeEvent } from 'react'
import { api } from '../../../api'
import { useI18n } from '../../../i18n'
import { IconClipboardPaste, IconSparkles } from '../../ui/Icons'

type CharacterConfigSectionProps = {
  characterPrompt: string
  onChangePrompt: (val: string) => void
  refImageUrl?: string | null
  uploadingRef: boolean
  aiGenerating?: boolean
  onUploadRefImage: (file: File) => Promise<void>
  onRemoveRefImage: () => Promise<void>
  onPasteRefImage: () => Promise<void>
  onAiGenerate?: () => Promise<void>
}

export default function CharacterConfigSection({
  characterPrompt,
  onChangePrompt,
  refImageUrl,
  uploadingRef,
  aiGenerating,
  onUploadRefImage,
  onRemoveRefImage,
  onPasteRefImage,
  onAiGenerate,
}: CharacterConfigSectionProps) {
  const { t } = useI18n()
  const charPromptTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const refImageInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const el = charPromptTextareaRef.current
    if (!el) return
    const adjust = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    adjust()
    window.addEventListener('resize', adjust)
    return () => window.removeEventListener('resize', adjust)
  }, [characterPrompt])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUploadRefImage(file)
    if (refImageInputRef.current) refImageInputRef.current.value = ''
  }

  return (
    <div className="pf-style-block">
      <h3>{t('studio.styleConfig.characterSection')}</h3>
      <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.65rem' }}>
        {t('studio.styleConfig.characterHint')}
      </p>

      <div className="pf-field" style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span className="pf-field-label" style={{ margin: 0 }}>
            {t('studio.styleConfig.characterPromptLabel')}
          </span>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
            title="AI Generate"
            disabled={aiGenerating || uploadingRef}
            onClick={onAiGenerate}
            style={{
              height: '26px',
              padding: '0 0.5rem',
              fontSize: '0.78rem',
              color: 'var(--pf-lime, #d4ff00)',
              cursor: aiGenerating ? 'not-allowed' : 'pointer',
              opacity: aiGenerating ? 0.7 : 1,
            }}
          >
            <IconSparkles size={13} />
            <span>{aiGenerating ? t('studio.styleConfig.generating') : 'AI Generate'}</span>
          </button>
        </div>
        <textarea
          ref={charPromptTextareaRef}
          className="pf-field-input"
          placeholder={t('studio.styleConfig.characterPromptPlaceholder')}
          value={characterPrompt}
          onChange={(e) => {
            onChangePrompt(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          rows={2}
          style={{
            resize: 'none',
            overflow: 'hidden',
            minHeight: '52px',
            lineHeight: '1.5',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginTop: '0.85rem' }}>
        <span
          className="pf-field-label"
          style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}
        >
          {t('studio.styleConfig.refImageLabel')}
        </span>
        <input
          ref={refImageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {refImageUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
            <img
              src={api.assetUrl(refImageUrl)}
              alt="Character Reference"
              style={{
                width: '72px',
                height: '72px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid var(--pf-border, rgba(255,255,255,0.12))',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm"
                  disabled={uploadingRef}
                  onClick={() => refImageInputRef.current?.click()}
                >
                  {uploadingRef ? t('studio.styleConfig.uploadingRefImage') : t('studio.styleConfig.changeRefImage')}
                </button>
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
                  title={t('studio.styleConfig.pasteRefImage')}
                  disabled={uploadingRef}
                  style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', flexShrink: 0 }}
                  onClick={onPasteRefImage}
                >
                  <IconClipboardPaste size={16} />
                </button>
              </div>
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                disabled={uploadingRef}
                style={{ color: '#ef4444' }}
                onClick={onRemoveRefImage}
              >
                {t('studio.styleConfig.removeRefImage')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                disabled={uploadingRef}
                onClick={() => refImageInputRef.current?.click()}
              >
                {uploadingRef ? t('studio.styleConfig.uploadingRefImage') : `📷 ${t('studio.styleConfig.uploadRefImage')}`}
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
                title={t('studio.styleConfig.pasteRefImage')}
                disabled={uploadingRef}
                style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', flexShrink: 0 }}
                onClick={onPasteRefImage}
              >
                <IconClipboardPaste size={16} />
              </button>
            </div>
            <p className="pf-muted" style={{ fontSize: '0.75rem', margin: '0.35rem 0 0' }}>
              {t('studio.styleConfig.refImageHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
