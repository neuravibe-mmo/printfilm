import type { DramaAsset, DramaProject } from '../../api/drama'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import { DramaAssetDetailModal, type DramaAssetCurlTab } from './DramaAssetDetailModal'
import { DramaImageLightbox } from './DramaImageLightbox'
import { CharacterVoiceBindModal } from './CharacterVoiceBindModal'
import { NarratorVoiceBindModal } from './NarratorVoiceBindModal'
import { GlobalAssetPickerModal } from './GlobalAssetPickerModal'
import { useI18n } from '../../i18n'
import type { ImageGenerationOptions } from '../../lib/dramaGenerationOptions'

interface DramaAssetsModalsProps {
  projectId: number
  project: DramaProject | null
  detailAsset: DramaAsset | null
  detailCurlTab?: DramaAssetCurlTab
  genOptions?: Partial<ImageGenerationOptions>
  busyAssetIds: Set<number>
  genButtonLabel: (asset: DramaAsset) => string
  onCloseDetail: () => void
  onAssetUpdated: (updated: DramaAsset) => void
  onGenerateImage: (asset: DramaAsset) => void
  onBindVoice?: (asset: DramaAsset) => void
  onDeleteAsset: (asset: DramaAsset) => void
  lightbox: { src: string; alt: string } | null
  onCloseLightbox: () => void
  voiceAsset: DramaAsset | null
  onCloseVoiceModal: () => void
  onVoiceBound: (updated: DramaAsset) => void
  narratorVoiceOpen: boolean
  onCloseNarratorModal: () => void
  onProjectUpdated: (p: DramaProject) => void
  pickerOpen: boolean
  onClosePicker: () => void
  currentTab: string
  onImportFromLibrary: (asset: DramaAsset) => Promise<void>
  onError: (msg: string) => void
}

export function DramaAssetsModals({
  projectId,
  project,
  detailAsset,
  detailCurlTab = 'image',
  genOptions,
  busyAssetIds,
  genButtonLabel,
  onCloseDetail,
  onAssetUpdated,
  onGenerateImage,
  onBindVoice,
  onDeleteAsset,
  lightbox,
  onCloseLightbox,
  voiceAsset,
  onCloseVoiceModal,
  onVoiceBound,
  narratorVoiceOpen,
  onCloseNarratorModal,
  onProjectUpdated,
  pickerOpen,
  onClosePicker,
  currentTab,
  onImportFromLibrary,
  onError,
}: DramaAssetsModalsProps) {
  const { t } = useI18n()

  return (
    <>
      {detailAsset && (detailAsset.type || '').toLowerCase() !== 'voice' ? (
        <DramaAssetDetailModal
          asset={detailAsset}
          open
          projectId={projectId}
          initialCurlTab={detailCurlTab}
          genOptions={genOptions}
          busy={busyAssetIds.has(detailAsset.id)}
          genLabel={genButtonLabel(detailAsset)}
          onClose={onCloseDetail}
          onUpdated={onAssetUpdated}
          onGenerate={onGenerateImage}
          onBindVoice={DRAMA_VOICE_BINDING_ENABLED ? onBindVoice : undefined}
          onDelete={onDeleteAsset}
          onError={onError}
        />
      ) : null}

      {lightbox ? (
        <DramaImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={onCloseLightbox}
        />
      ) : null}

      {DRAMA_VOICE_BINDING_ENABLED && voiceAsset ? (
        <CharacterVoiceBindModal
          asset={voiceAsset}
          projectId={projectId}
          open
          onClose={onCloseVoiceModal}
          onBound={onVoiceBound}
          onError={onError}
        />
      ) : null}

      {DRAMA_VOICE_BINDING_ENABLED && project ? (
        <NarratorVoiceBindModal
          project={project}
          open={narratorVoiceOpen}
          onClose={onCloseNarratorModal}
          onUpdated={onProjectUpdated}
          onError={onError}
        />
      ) : null}

      <GlobalAssetPickerModal
        open={pickerOpen}
        onClose={onClosePicker}
        projectId={projectId}
        defaultTab={currentTab === 'voice' ? 'voice' : (currentTab as any)}
        title={t('drama.assetsStep.importFromLib')}
        confirmLabel={t('drama.assetsStep.importToProject')}
        onPick={onImportFromLibrary}
      />
    </>
  )
}

