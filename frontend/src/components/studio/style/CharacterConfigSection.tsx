import { Mountain, Package, UserRound } from 'lucide-react'
import { useI18n } from '../../../i18n'
import ReferenceItemCard from './ReferenceItemCard'

export type CharacterConfigSectionProps = {
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
  onOpenCurlCharacter?: () => void
  onOpenCurlProduct?: () => void
  onOpenCurlScene?: () => void
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
  onOpenCurlCharacter,
  onOpenCurlProduct,
  onOpenCurlScene,
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
        icon={<UserRound size={15} strokeWidth={1.8} />}
        promptLabel={t('studio.styleConfig.characterPromptLabel')}
        promptPlaceholder={t('studio.styleConfig.characterPromptPlaceholder')}
        promptValue={characterPrompt}
        onChangePrompt={onChangeCharacterPrompt}
        onAiGenerate={onAiGenerateCharacter}
        aiGenerating={aiGeneratingChar}
        onOpenCurl={onOpenCurlCharacter}
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
        icon={<Package size={15} strokeWidth={1.8} />}
        promptLabel={t('studio.styleConfig.productPromptLabel')}
        promptPlaceholder={t('studio.styleConfig.productPromptPlaceholder')}
        promptValue={productPrompt}
        onChangePrompt={onChangeProductPrompt}
        onAiGenerate={onAiGenerateProduct}
        aiGenerating={aiGeneratingProduct}
        onOpenCurl={onOpenCurlProduct}
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
        icon={<Mountain size={15} strokeWidth={1.8} />}
        promptLabel={t('studio.styleConfig.scenePromptLabel')}
        promptPlaceholder={t('studio.styleConfig.scenePromptPlaceholder')}
        promptValue={scenePrompt}
        onChangePrompt={onChangeScenePrompt}
        onAiGenerate={onAiGenerateScene}
        aiGenerating={aiGeneratingScene}
        onOpenCurl={onOpenCurlScene}
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
