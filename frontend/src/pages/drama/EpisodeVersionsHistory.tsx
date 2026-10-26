import React from 'react'
import { useI18n } from '../../i18n'
import { resolveDramaMediaUrl, type DramaFragment } from '../../api/drama'
import type { FragmentVideoVersion } from './dramaEpisodeEditUtils'

interface EpisodeVersionsHistoryProps {
  selected: DramaFragment | null
  selectedVersions: FragmentVideoVersion[]
  previewVersionId: string | null
  busy: boolean
  selectedIsGenerating: boolean
  selectedHasVideo: boolean
  onPreviewVersion: (versionId: string | null) => void
}

export const EpisodeVersionsHistory: React.FC<EpisodeVersionsHistoryProps> = React.memo(
  function EpisodeVersionsHistory({
    selected,
    selectedVersions,
    previewVersionId,
    busy,
    selectedIsGenerating,
    selectedHasVideo,
    onPreviewVersion,
  }) {
    const { t } = useI18n()

    if (!selectedVersions.length || !selected?.id) {
      return null
    }

    return (
      <div className="drama-ep-versions">
        <span className="drama-ep-versions-label">{t('drama.episodeEdit.history')}</span>
        <div className="drama-ep-versions-list">
          {selectedHasVideo && selected.video ? (
            <button
              type="button"
              className={`drama-ep-version is-active${!previewVersionId ? ' is-current' : ''}`}
              disabled={busy || selectedIsGenerating}
              title={t('drama.episodeEdit.currentVersion')}
              onClick={() => onPreviewVersion(null)}
            >
              {selected.cover ? (
                <img src={resolveDramaMediaUrl(selected.cover)} alt="" />
              ) : (
                <video src={resolveDramaMediaUrl(selected.video)} muted />
              )}
              <em>{t('drama.episodeEdit.current')}</em>
            </button>
          ) : null}
          {selectedVersions.map((ver, index) => {
            const cover = ver.cover ? resolveDramaMediaUrl(ver.cover) : ''
            const video = resolveDramaMediaUrl(ver.video)
            const versionNo = selectedVersions.length - index
            return (
              <button
                key={ver.id}
                type="button"
                className={`drama-ep-version${previewVersionId === ver.id ? ' is-previewing' : ''}`}
                disabled={busy || selectedIsGenerating}
                title={t('drama.episodeEdit.previewOrSwitch')}
                onClick={() => onPreviewVersion(ver.id)}
              >
                {cover ? <img src={cover} alt="" /> : <video src={video} muted />}
                <em>v{versionNo}</em>
              </button>
            )
          })}
        </div>
      </div>
    )
  },
)
