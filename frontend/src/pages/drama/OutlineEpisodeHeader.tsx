import React from 'react'
import { Check, RefreshCw } from 'lucide-react'
import type { DramaEpisodeBody } from '../../api/drama'
import { episodeBodyCharLen, isSubstantialEpisodeCreative } from './dramaWorkspaceUtils'
import { useI18n } from '../../i18n'

export type OutlineEpisodeHeaderProps = {
  selected: DramaEpisodeBody
  editingSection: string | null
  titleDraft: string
  imageStyleLabel?: string
  charHint: string
  metaTags: string[]
  bodyReady: boolean
  saving: boolean
  busy: boolean
  generateBusy: boolean
  selectedGenerating: boolean
  generatingMode: string | null
  confirming: boolean
  onTitleDraftChange: (v: string) => void
  onGenerateBrief: () => void
  onGenerateFull: () => void
  onConfirmEnter: () => void
}

export const OutlineEpisodeHeader: React.FC<OutlineEpisodeHeaderProps> = React.memo(
  function OutlineEpisodeHeader({
    selected,
    editingSection,
    titleDraft,
    imageStyleLabel,
    charHint,
    metaTags,
    bodyReady,
    saving,
    busy,
    generateBusy,
    selectedGenerating,
    generatingMode,
    confirming,
    onTitleDraftChange,
    onGenerateBrief,
    onGenerateFull,
    onConfirmEnter,
  }) {
    const { t } = useI18n()

    return (
      <header className="drama-outline-detail-head">
        <div className="drama-outline-detail-title">
          {editingSection ? (
            <input
              className="drama-title-input"
              value={titleDraft}
              onChange={(e) => onTitleDraftChange(e.target.value)}
              placeholder={t('drama.outlinePanel.epNamePlaceholder')}
            />
          ) : (
            <h2>
              {t('drama.outlinePanel.epLabel').replace('{no}', String(selected.episodeNumber))}
              {selected.title ? `: ${selected.title}` : ''}
            </h2>
          )}
          {imageStyleLabel ? <span className="drama-outline-style-badge">{imageStyleLabel}</span> : null}
          <div className="drama-outline-detail-meta">
            {charHint ? <span>{charHint}</span> : <span>{t('drama.outlinePanel.noContent')}</span>}
            {metaTags.map((tag) => (
              <span key={tag} className="drama-outline-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="drama-outline-detail-actions">
          <span className={`drama-outline-saved${bodyReady ? ' is-ready' : ''}`}>
            <Check size={14} strokeWidth={2.5} />
            {bodyReady ? t('drama.outlinePanel.readyForShot') : saving ? t('common.saving') : t('drama.outlinePanel.synced')}
          </span>
          {bodyReady &&
          (!isSubstantialEpisodeCreative(selected.creative) ||
            episodeBodyCharLen(selected.summary) < 40) ? (
            <button
              type="button"
              className="drama-btn-ghost"
              disabled={generateBusy}
              onClick={onGenerateBrief}
            >
              {selectedGenerating && generatingMode === 'brief'
                ? t('drama.outlinePanel.filling')
                : t('drama.outlinePanel.fillBrief')}
            </button>
          ) : null}
          <button
            type="button"
            className="drama-outline-regen-btn"
            disabled={generateBusy || !isSubstantialEpisodeCreative(selected.creative)}
            onClick={onGenerateFull}
          >
            <RefreshCw size={15} strokeWidth={2.25} />
            {selectedGenerating && generatingMode === 'full'
              ? t('drama.outlinePanel.generating')
              : selected?.body?.trim()
                ? t('drama.outlinePanel.regenFull')
                : t('drama.outlinePanel.genFull')}
          </button>
          <button
            type="button"
            className="drama-btn-ghost"
            disabled={busy || !bodyReady}
            onClick={onConfirmEnter}
          >
            {confirming ? t('drama.outlinePanel.entering') : t('drama.outlinePanel.enterShot')}
          </button>
        </div>
      </header>
    )
  },
)
