import React from 'react'
import { Check, MoreHorizontal, Pencil, Plus } from 'lucide-react'
import type { DramaEpisodeBody } from '../../api/drama'
import { isSubstantialEpisodeBody, type OutlineDirectoryEpisode } from './dramaWorkspaceUtils'
import { useI18n } from '../../i18n'

export function formatOutlineShotDuration(sec: number, t: (k: string) => string): string {
  if (sec <= 0) return '—'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s
    ? t('drama.outlinePanel.minSec').replace('{m}', String(m)).replace('{s}', String(s))
    : t('drama.outlinePanel.min').replace('{m}', String(m))
}

export type OutlineEpisodeSidebarProps = {
  directoryEpisodes: OutlineDirectoryEpisode[]
  displayEpisodes: DramaEpisodeBody[]
  activeEpisodeNumber: number
  summaryReady: boolean
  canAdd: boolean
  adding: boolean
  episodeShotStats: Record<number, { fragmentCount: number; totalSec: number }>
  episodeCovers: Record<number, string>
  menuEpNumber: number | null
  renamingEpisodeNumber: number | null
  renameDraft: string
  menuRef: React.RefObject<HTMLDivElement | null>
  onAddEpisode: () => void
  onSelectEpisode: (epNo: number) => void
  onMenuToggle: (epNo: number) => void
  onStartRename: (epNo: number, currentTitle: string) => void
  onRenameDraftChange: (v: string) => void
  onConfirmRename: (epNo: number) => void
  onCancelRename: () => void
}

export const OutlineEpisodeSidebar: React.FC<OutlineEpisodeSidebarProps> = React.memo(
  function OutlineEpisodeSidebar({
    directoryEpisodes,
    displayEpisodes,
    activeEpisodeNumber,
    summaryReady,
    canAdd,
    adding,
    episodeShotStats,
    episodeCovers,
    menuEpNumber,
    renamingEpisodeNumber,
    renameDraft,
    menuRef,
    onAddEpisode,
    onSelectEpisode,
    onMenuToggle,
    onStartRename,
    onRenameDraftChange,
    onConfirmRename,
    onCancelRename,
  }) {
    const { t } = useI18n()

    return (
      <aside className="drama-outline-sidebar">
        <div className="drama-outline-sidebar-head">
          <div>
            <h3>{t('drama.outlinePanel.directory')}</h3>
            <p>{t('drama.outlinePanel.totalEps').replace('{n}', String(directoryEpisodes.length))}</p>
          </div>
          {summaryReady ? (
            <button
              type="button"
              className="drama-outline-add-btn"
              disabled={!canAdd}
              onClick={onAddEpisode}
            >
              <Plus size={14} strokeWidth={2.5} />
              {adding ? t('drama.outlinePanel.adding') : t('drama.outlinePanel.addEp')}
            </button>
          ) : null}
        </div>
        <ul className="drama-outline-ep-list">
          {directoryEpisodes.map((ep) => {
            const body = displayEpisodes.find((x) => x.episodeNumber === ep.episodeNumber)
            const ready = isSubstantialEpisodeBody(body?.body)
            const active = activeEpisodeNumber === ep.episodeNumber
            const shot = episodeShotStats[ep.episodeNumber || 0]
            const statusLabel =
              shot && shot.fragmentCount > 0 && shot.totalSec > 0
                ? t('drama.outlinePanel.shotStat')
                    .replace('{n}', String(shot.fragmentCount))
                    .replace('{dur}', formatOutlineShotDuration(shot.totalSec, t))
                : ready
                  ? t('drama.outlinePanel.bodyReady')
                  : body?.creative
                    ? t('drama.outlinePanel.pendingScript')
                    : t('drama.outlinePanel.pendingCreative')
            return (
              <li key={ep.episodeNumber}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`drama-outline-ep-card${active ? ' is-active' : ''}`}
                  onClick={() => onSelectEpisode(ep.episodeNumber)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectEpisode(ep.episodeNumber)
                    }
                  }}
                >
                  <span className="drama-outline-ep-thumb" aria-hidden>
                    {(() => {
                      const cover = episodeCovers[ep.episodeNumber || 0]
                      if (!cover) return ep.episodeNumber
                      if (/\.(mp4|webm|mov)(\?|$)/i.test(cover)) {
                        return <video src={cover} muted playsInline preload="metadata" />
                      }
                      return <img src={cover} alt="" />
                    })()}
                  </span>
                  <span className="drama-outline-ep-meta">
                    <strong>
                      {t('drama.outlinePanel.epLabel').replace('{no}', String(ep.episodeNumber))}
                    </strong>
                    {renamingEpisodeNumber === ep.episodeNumber ? (
                      <div className="drama-outline-ep-rename-row" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className="drama-outline-ep-rename-input"
                          value={renameDraft}
                          autoFocus
                          placeholder={t('drama.outlinePanel.epNamePlaceholder')}
                          onChange={(e) => onRenameDraftChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              onConfirmRename(ep.episodeNumber)
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault()
                              onCancelRename()
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="drama-outline-ep-rename-btn"
                          title={t('common.confirm')}
                          onClick={(e) => {
                            e.stopPropagation()
                            onConfirmRename(ep.episodeNumber)
                          }}
                        >
                          <Check size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      <small>{ep.title || t('common.unnamed')}</small>
                    )}
                    <em className={shot && shot.fragmentCount > 0 ? 'is-shot' : undefined}>
                      {statusLabel}
                    </em>
                  </span>
                  <div
                    className="drama-outline-ep-more-wrap"
                    ref={menuEpNumber === ep.episodeNumber ? menuRef : undefined}
                  >
                    <button
                      type="button"
                      className="drama-outline-ep-more"
                      aria-label={t('common.more')}
                      onClick={(e) => {
                        e.stopPropagation()
                        onMenuToggle(ep.episodeNumber)
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuEpNumber === ep.episodeNumber ? (
                      <div className="drama-outline-ep-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="drama-outline-ep-menu-item"
                          onClick={(e) => {
                            e.stopPropagation()
                            onStartRename(ep.episodeNumber, ep.title || '')
                          }}
                        >
                          <Pencil size={13} strokeWidth={2} />
                          {t('drama.outlinePanel.renameEp')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </aside>
    )
  },
)
