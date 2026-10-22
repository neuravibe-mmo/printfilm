import { useEffect, useRef, type ChangeEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../../api'
import { useI18n } from '../../../i18n'
import { IconClipboardPaste, IconSparkles } from '../../ui/Icons'

type ReferenceItemProps = {
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

function ReferenceItemCard({
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
                {uploading ? t('studio.styleConfig.uploadingRefImage') : `📷 ${uploadButtonText}`}
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

type CharacterConfigSectionProps = {
  characterPrompt: string
  onChangeCharacterPrompt: (val: string) => void
  characterImageUrl?: string | null

  productPrompt: string
  onChangeProductPrompt: (val: string) => void
  productImageUrl?: string | null

  scenePrompt: string
  onChangeScenePrompt: (val: string) => void
  sceneImageUrl?: string | null

  uploadingRef: string | null
  aiGeneratingChar?: boolean
  aiGeneratingProduct?: boolean
  aiGeneratingScene?: boolean
  generatingRefImage?: 'character' | 'product' | 'scene' | null

  onUploadRefImage: (file: File, refType: 'character' | 'product' | 'scene') => Promise<void>
  onRemoveRefImage: (refType: 'character' | 'product' | 'scene') => Promise<void>
  onPasteRefImage: (refType: 'character' | 'product' | 'scene') => Promise<void>
  onAiGenerateCharacter?: () => Promise<void>
  onAiGenerateProduct?: () => Promise<void>
  onAiGenerateScene?: () => Promise<void>
  onGenerateRefImage?: (refType: 'character' | 'product' | 'scene') => Promise<void>
}

export default function CharacterConfigSection({
  characterPrompt,
  onChangeCharacterPrompt,
  characterImageUrl,
  productPrompt,
  onChangeProductPrompt,
  productImageUrl,
  scenePrompt,
  onChangeScenePrompt,
  sceneImageUrl,
  uploadingRef,
  aiGeneratingChar,
  aiGeneratingProduct,
  aiGeneratingScene,
  generatingRefImage,
  onUploadRefImage,
  onRemoveRefImage,
  onPasteRefImage,
  onAiGenerateCharacter,
  onAiGenerateProduct,
  onAiGenerateScene,
  onGenerateRefImage,
}: CharacterConfigSectionProps) {
  const { t } = useI18n()

  const activeCount = [characterImageUrl, productImageUrl, sceneImageUrl].filter(Boolean).length

  return (
    <div className="pf-style-block" style={{ marginBottom: '2.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <h3 style={{ margin: 0 }}>{t('studio.styleConfig.characterSection')}</h3>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.6rem',
            borderRadius: '999px',
            background: activeCount > 0 ? 'rgba(212,255,0,0.15)' : 'rgba(255,255,255,0.06)',
            color: activeCount > 0 ? 'var(--pf-lime, #d4ff00)' : 'var(--pf-muted, #888)',
            fontWeight: 600,
          }}
        >
          {t('studio.styleConfig.refCountBadge').replace('{count}', String(activeCount))}
        </span>
      </div>
      <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0 0 1rem' }}>
        {t('studio.styleConfig.characterHint')}
      </p>

      {/* 1. Nhân vật */}
      <ReferenceItemCard
        promptLabel={t('studio.styleConfig.characterPromptLabel')}
        promptPlaceholder={t('studio.styleConfig.characterPromptPlaceholder')}
        promptValue={characterPrompt}
        onChangePrompt={onChangeCharacterPrompt}
        onAiGenerate={onAiGenerateCharacter}
        aiGenerating={aiGeneratingChar}
        imageUrl={characterImageUrl}
        imageHint={t('studio.styleConfig.refImageHint')}
        uploadButtonText={t('studio.styleConfig.uploadRefImage')}
        uploading={uploadingRef === 'character'}
        onUpload={(file) => onUploadRefImage(file, 'character')}
        onRemove={() => onRemoveRefImage('character')}
        onPaste={() => onPasteRefImage('character')}
        onGenerateImage={onGenerateRefImage ? () => onGenerateRefImage('character') : undefined}
        generatingImage={generatingRefImage === 'character'}
      />

      {/* Đường line fullwidth phân cách */}
      <div
        style={{
          height: '1px',
          width: '100%',
          margin: '2.25rem 0',
          backgroundImage:
            'repeating-linear-gradient(to right, #ef4444 0, #ef4444 6px, transparent 6px, transparent 16px)',
        }}
      />

      {/* 2. Sản phẩm */}
      <ReferenceItemCard
        promptLabel={t('studio.styleConfig.productPromptLabel')}
        promptPlaceholder={t('studio.styleConfig.productPromptPlaceholder')}
        promptValue={productPrompt}
        onChangePrompt={onChangeProductPrompt}
        onAiGenerate={onAiGenerateProduct}
        aiGenerating={aiGeneratingProduct}
        imageUrl={productImageUrl}
        imageHint={t('studio.styleConfig.productImageHint')}
        uploadButtonText={t('studio.styleConfig.uploadProductImage')}
        uploading={uploadingRef === 'product'}
        onUpload={(file) => onUploadRefImage(file, 'product')}
        onRemove={() => onRemoveRefImage('product')}
        onPaste={() => onPasteRefImage('product')}
        onGenerateImage={onGenerateRefImage ? () => onGenerateRefImage('product') : undefined}
        generatingImage={generatingRefImage === 'product'}
      />

      {/* Đường line fullwidth phân cách */}
      <div
        style={{
          height: '1px',
          width: '100%',
          margin: '2.25rem 0',
          backgroundImage:
            'repeating-linear-gradient(to right, #ef4444 0, #ef4444 6px, transparent 6px, transparent 16px)',
        }}
      />

      {/* 3. Bối cảnh không gian */}
      <ReferenceItemCard
        promptLabel={t('studio.styleConfig.scenePromptLabel')}
        promptPlaceholder={t('studio.styleConfig.scenePromptPlaceholder')}
        promptValue={scenePrompt}
        onChangePrompt={onChangeScenePrompt}
        onAiGenerate={onAiGenerateScene}
        aiGenerating={aiGeneratingScene}
        imageUrl={sceneImageUrl}
        imageHint={t('studio.styleConfig.sceneImageHint')}
        uploadButtonText={t('studio.styleConfig.uploadSceneImage')}
        uploading={uploadingRef === 'scene'}
        onUpload={(file) => onUploadRefImage(file, 'scene')}
        onRemove={() => onRemoveRefImage('scene')}
        onPaste={() => onPasteRefImage('scene')}
        onGenerateImage={onGenerateRefImage ? () => onGenerateRefImage('scene') : undefined}
        generatingImage={generatingRefImage === 'scene'}
      />
    </div>
  )
}
