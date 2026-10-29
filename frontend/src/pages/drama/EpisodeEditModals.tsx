import React from 'react'
import type { DramaAsset, DramaFragment } from '../../api/drama'
import type { DramaGenJob } from '../../lib/dramaGenQueue'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import { FragmentPlanSkillModal } from '../../components/drama/FragmentPlanSkillModal'
import { DramaGenTaskDetail } from '../../components/drama/DramaGenTaskDetail'
import { DramaAssetDetailModal } from './DramaAssetDetailModal'
import { CharacterVoiceBindModal } from './CharacterVoiceBindModal'
import { GlobalAssetPickerModal } from './GlobalAssetPickerModal'
import { EpisodeEditCurlModal } from './EpisodeEditCurlModal'
import { useI18n } from '../../i18n'

export type EpisodeEditModalsProps = {
  projectId: number
  episodeId: number
  planModalOpen: boolean
  onCancelPlanModal: () => void
  onConfirmPlanModal: (skillIds: number[]) => void
  detailAsset: DramaAsset | null
  imageBusyIds: Set<number>
  assetImageGenLabel: (a: DramaAsset) => string
  onCloseDetailAsset: () => void
  onCharacterUpdated: (a: DramaAsset) => void
  onEnqueueAssetImage: (a: DramaAsset) => void
  onSetVoiceBindAsset?: (a: DramaAsset) => void
  onError: (message: string) => void
  voiceBindAsset: DramaAsset | null
  onCloseVoiceBind: () => void
  libraryPickerOpen: boolean
  onCloseLibraryPicker: () => void
  resolveCreateAssetTab: () => 'character' | 'scene' | 'prop'
  onImportSideAsset: (asset: DramaAsset) => void | Promise<void>
  failReasonJob: DramaGenJob | null
  onCloseFailReasonJob: () => void
  showCurlModal: boolean
  onCloseCurlModal: () => void
  selected: DramaFragment | null
  selectedIndex: number
  assets: DramaAsset[]
  aspectRatio: string
  selectedDuration: number
  modelId: string
  projectFlowId?: string | null
  videoLanguage?: string
}

export const EpisodeEditModals: React.FC<EpisodeEditModalsProps> = React.memo(
  function EpisodeEditModals({
    projectId,
    episodeId,
    planModalOpen,
    onCancelPlanModal,
    onConfirmPlanModal,
    detailAsset,
    imageBusyIds,
    assetImageGenLabel,
    onCloseDetailAsset,
    onCharacterUpdated,
    onEnqueueAssetImage,
    onSetVoiceBindAsset,
    onError,
    voiceBindAsset,
    onCloseVoiceBind,
    libraryPickerOpen,
    onCloseLibraryPicker,
    resolveCreateAssetTab,
    onImportSideAsset,
    failReasonJob,
    onCloseFailReasonJob,
    showCurlModal,
    onCloseCurlModal,
    selected,
    selectedIndex,
    assets,
    aspectRatio,
    selectedDuration,
    modelId,
    projectFlowId,
    videoLanguage,
  }) {
    const { t } = useI18n()

    return (
      <>
        <FragmentPlanSkillModal
          open={planModalOpen}
          message={t('drama.episodeEdit.replanMessage')}
          onCancel={onCancelPlanModal}
          onConfirm={onConfirmPlanModal}
        />

        {detailAsset && (detailAsset.type || '').toLowerCase() !== 'voice' ? (
          <DramaAssetDetailModal
            asset={detailAsset}
            open
            busy={imageBusyIds.has(detailAsset.id)}
            genLabel={assetImageGenLabel(detailAsset)}
            onClose={onCloseDetailAsset}
            onUpdated={onCharacterUpdated}
            onGenerate={onEnqueueAssetImage}
            onBindVoice={DRAMA_VOICE_BINDING_ENABLED && onSetVoiceBindAsset ? onSetVoiceBindAsset : undefined}
            onError={onError}
          />
        ) : null}

        {DRAMA_VOICE_BINDING_ENABLED && voiceBindAsset ? (
          <CharacterVoiceBindModal
            asset={voiceBindAsset}
            projectId={projectId}
            open
            onClose={onCloseVoiceBind}
            onBound={(updated) => {
              onCharacterUpdated(updated)
              onCloseVoiceBind()
            }}
            onError={onError}
          />
        ) : null}

        <GlobalAssetPickerModal
          open={libraryPickerOpen}
          onClose={onCloseLibraryPicker}
          projectId={projectId}
          defaultTab={resolveCreateAssetTab()}
          allowedTypes={
            resolveCreateAssetTab() === 'prop'
              ? ['prop', 'material', 'none']
              : [resolveCreateAssetTab()]
          }
          title={t('drama.episodeEdit.importAssetTitle').replace(
            '{type}',
            resolveCreateAssetTab() === 'scene'
              ? t('drama.episodeEdit.scene')
              : resolveCreateAssetTab() === 'prop'
                ? t('drama.episodeEdit.prop')
                : t('drama.episodeEdit.character'),
          )}
          confirmLabel={t('drama.episodeEdit.importToEpisode')}
          onPick={onImportSideAsset}
        />

        {failReasonJob ? (
          <div className="drama-ep-fail-reason-pop">
            <DramaGenTaskDetail job={failReasonJob} onClose={onCloseFailReasonJob} />
          </div>
        ) : null}

        <EpisodeEditCurlModal
          open={showCurlModal}
          onClose={onCloseCurlModal}
          episodeId={episodeId}
          fragment={selected}
          fragmentIndex={selectedIndex}
          assets={assets}
          aspectRatio={aspectRatio}
          duration={selectedDuration}
          modelId={modelId}
          projectFlowId={projectFlowId}
          videoLanguage={videoLanguage}
        />
      </>
    )
  },
)
