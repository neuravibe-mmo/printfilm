import React from 'react'
import { ChevronDown, Terminal } from 'lucide-react'
import { useI18n } from '../../i18n'
import { dramaApi, type DramaAsset, type DramaEpisode, type DramaFragment } from '../../api/drama'
import { hasNonLocalizedCues, localizeScriptCues } from '../../lib/dramaCueI18n'
import type { DramaScriptIssue } from '../../lib/dramaEpisodeScriptValidate'
import {
  formatProjectOutputLabel,
  readEpisodeAspectRatio,
  readEpisodeResolution,
} from '../../lib/dramaProjectOutputSettings'
import {
  extractAssetIds,
  formatFragLabel,
  sumFragmentContentDuration,
  syncContentDurations,
  type FragmentRefStripItem,
  type FragmentVideoVersion,
} from './dramaEpisodeEditUtils'
import { EpisodeEditReferenceStrip } from './EpisodeEditReferenceStrip'
import { EpisodeEditPromptEditor } from './EpisodeEditPromptEditor'
import { EpisodeVersionsHistory } from './EpisodeVersionsHistory'

interface EpisodeEditScriptSectionProps {
  eid: number
  selected: DramaFragment | null
  selectedIndex: number
  selectedDuration: number
  episodeParams: Record<string, unknown>
  projectParams: Record<string, unknown>
  fragments: DramaFragment[]
  assets: DramaAsset[]
  referencedIds: Set<number>
  selectedRefItems: FragmentRefStripItem[]
  selectedGateIssues: DramaScriptIssue[]
  linkLastFrame: boolean
  continuityBlockedReason: string
  continuityQueueHint: string
  prevLastFrameUrl: string
  editing: boolean
  busy: boolean
  selectedIsGenerating: boolean
  selectedHasVideo: boolean
  selectedGenerateLocked: boolean
  selectedVersions: FragmentVideoVersion[]
  previewVersionId: string | null
  onPreviewVersion: (id: string | null) => void
  onFocusLinkedAsset: (assetId: number) => void
  onUpdateSelected: (patch: Partial<DramaFragment>) => void
  onSave: () => Promise<DramaEpisode>
  onReload: () => Promise<void>
  onSetEditing: (editing: boolean) => void
  onGenerateSelected: () => void | Promise<void>
  onShowCurlModal: () => void
  onSetFragments: React.Dispatch<React.SetStateAction<DramaFragment[]>>
  onSetStatus: (status: string) => void
  onSeedFromScript?: () => void | Promise<void>
  onPlanFragmentsWithLlm?: () => void
  videoUploading?: boolean
  onUploadVideo?: (file: File) => void
}

export const EpisodeEditScriptSection: React.FC<EpisodeEditScriptSectionProps> = React.memo(
  function EpisodeEditScriptSection({
    eid,
    selected,
    selectedIndex,
    selectedDuration,
    episodeParams,
    projectParams,
    fragments,
    assets,
    referencedIds,
    selectedRefItems,
    selectedGateIssues,
    linkLastFrame,
    continuityBlockedReason,
    continuityQueueHint,
    prevLastFrameUrl,
    editing,
    busy,
    selectedIsGenerating,
    selectedHasVideo,
    selectedGenerateLocked,
    selectedVersions,
    previewVersionId,
    onPreviewVersion,
    onFocusLinkedAsset,
    onUpdateSelected,
    onSave,
    onReload,
    onSetEditing,
    onGenerateSelected,
    onShowCurlModal,
    onSetFragments,
    onSetStatus,
    onSeedFromScript,
    onPlanFragmentsWithLlm,
  }) {
    const { t } = useI18n()
    const [showVideoMenu, setShowVideoMenu] = React.useState(false)
    const videoMenuRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (videoMenuRef.current && !videoMenuRef.current.contains(e.target as Node)) {
          setShowVideoMenu(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [])

    return (
      <section className="drama-ep-editor">
        <div className="drama-ep-editor-head">
          <div>
            <strong>{formatFragLabel(selectedIndex, selectedDuration, t)}</strong>
            <p>
              {t('drama.episodeEdit.tipAtRef')}{' '}
              {formatProjectOutputLabel(
                readEpisodeAspectRatio(episodeParams, projectParams),
                readEpisodeResolution(episodeParams, projectParams),
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {hasNonLocalizedCues(selected?.content || '', 'vi') && (
              <button
                type="button"
                className="drama-ep-btn drama-ep-btn-subtle"
                style={{ fontSize: '0.8rem', padding: '4px 10px', height: 'auto', whiteSpace: 'nowrap' }}
                onClick={async () => {
                  if (!selected) return
                  const videoLang = String(projectParams?.video_language || 'vi')
                  const localized = localizeScriptCues(selected.content || '', 'vi', videoLang)
                  const nextFragments = fragments.map((f, i) =>
                    i === selectedIndex ? { ...f, content: localized } : f,
                  )
                  try {
                    await dramaApi.saveFragments(eid, nextFragments)
                    onSetFragments(nextFragments)
                    onSetStatus(t('drama.episodeEdit.convertCuesSuccess'))
                  } catch (err) {
                    console.warn('Chuyển thẻ sang Tiếng Việt thất bại:', err)
                  }
                }}
                title={t('drama.episodeEdit.convertCuesToVi')}
              >
                🌐 {t('drama.episodeEdit.convertCuesToVi')}
              </button>
            )}
            <label className="drama-ep-duration">
              {t('drama.episodeEdit.duration')}
              <input
                type="number"
                min={3}
                max={10}
                value={selectedDuration || ''}
                disabled={!editing && !selected}
                onChange={(e) => {
                  const num = Number(e.target.value) || 0
                  const clamped = num > 0 ? Math.min(15, num) : 0
                  const curContent = selected?.content || ''
                  const nextContent = clamped > 0 ? syncContentDurations(curContent, clamped) : curContent
                  onUpdateSelected({
                    duration_sec: clamped,
                    ...(clamped > 0 ? { content: nextContent } : {}),
                  })
                }}
                onBlur={() => {
                  if (!selectedDuration || selectedDuration < 3) {
                    const fallback = 8
                    const curContent = selected?.content || ''
                    const nextContent = syncContentDurations(curContent, fallback)
                    onUpdateSelected({ duration_sec: fallback, content: nextContent })
                  }
                }}
              />
              s
            </label>
          </div>
        </div>

        <EpisodeEditReferenceStrip items={selectedRefItems} onSelect={onFocusLinkedAsset} />

        {!selected?.content?.trim() && fragments.every((f) => !(f.content || '').trim()) && (
          <div
            style={{
              margin: '8px 0 12px',
              padding: '12px 16px',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                ⚠️ {t('drama.episodeEdit.emptyScriptWarning')}
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--pf-text-secondary)' }}>
                {t('drama.episodeEdit.emptyScriptTip')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onSeedFromScript && (
                <button
                  type="button"
                  className="drama-ep-btn"
                  style={{ fontSize: '0.82rem', padding: '6px 12px', height: 'auto' }}
                  disabled={busy}
                  onClick={() => void onSeedFromScript()}
                >
                  ⚡ {t('drama.episodeEdit.seedFromScript')}
                </button>
              )}
              {onPlanFragmentsWithLlm && (
                <button
                  type="button"
                  className="drama-ep-btn drama-ep-btn-primary"
                  style={{ fontSize: '0.82rem', padding: '6px 12px', height: 'auto' }}
                  disabled={busy || selectedGenerateLocked}
                  onClick={() => onPlanFragmentsWithLlm()}
                >
                  ✨ {t('drama.episodeEdit.aiReplan')}
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`drama-ep-editor-box ${editing ? 'editing' : ''}`}>
          <EpisodeEditPromptEditor
            content={selected?.content || ''}
            assets={assets}
            referencedIds={referencedIds}
            editing={editing}
            onOpenAsset={onFocusLinkedAsset}
            onContentChange={(nextContent) => {
              const fromContent = extractAssetIds(nextContent)
              const prevContentIds = extractAssetIds(selected?.content || '')
              const removed = prevContentIds.filter((id) => !fromContent.includes(id))
              const prevContentIdSet = new Set(prevContentIds)
              const keptExtra = (selected?.asset_ids || []).filter(
                (id) => !prevContentIdSet.has(id) || fromContent.includes(id),
              )
              const contentDuration = sumFragmentContentDuration(nextContent)
              onUpdateSelected({
                content: nextContent,
                asset_ids: Array.from(new Set([...keptExtra, ...fromContent])),
                ...(contentDuration > 0 ? { duration_sec: contentDuration } : {}),
              })
              if (removed.length > 0) {
                onSetStatus(t('drama.episodeEdit.unlinkNoName'))
              }
            }}
          />

          {selectedGateIssues.length > 0 ? (
            <ul className="drama-ep-script-issues" aria-live="polite">
              {selectedGateIssues.map((issue) => (
                <li
                  key={`${issue.level}:${issue.message}`}
                  className={
                    issue.level === 'error'
                      ? 'drama-ep-script-issue is-error'
                      : 'drama-ep-script-issue is-warn'
                  }
                >
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}

          {linkLastFrame && selectedIndex > 0 ? (
            <p
              className={`drama-ep-continuity-hint${
                !continuityBlockedReason ? ' is-ready' : ' is-wait'
              }`}
            >
              {continuityBlockedReason
                ? t('drama.episodeEdit.continuityEnabled').replace('{reason}', continuityBlockedReason)
                : continuityQueueHint
                  ? continuityQueueHint
                  : prevLastFrameUrl
                    ? t('drama.episodeEdit.continuityWithPrev')
                    : t('drama.episodeEdit.continuityAutoTail')}
            </p>
          ) : !linkLastFrame ? (
            <p className="drama-ep-continuity-hint">
              {t('drama.episodeEdit.noTailContinuity')}
            </p>
          ) : null}

          <div className="drama-ep-editor-actions">
            {editing ? (
              <>
                <button
                  type="button"
                  className="drama-ep-btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    onSetEditing(false)
                    void onReload()
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="drama-ep-btn-dark"
                  disabled={busy}
                  onClick={() => void onSave()}
                >
                  {busy ? t('common.saving') : t('common.save')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="drama-ep-btn-ghost"
                  disabled={!selected || selectedIsGenerating || busy}
                  onClick={() => onSetEditing(true)}
                >
                  {t('common.edit')}
                </button>
                <div ref={videoMenuRef} className="drama-ep-video-split-wrap">
                  <button
                    type="button"
                    className="drama-ep-btn-dark drama-ep-video-split-main"
                    disabled={selectedGenerateLocked || !selected}
                    title={
                      continuityBlockedReason ||
                      continuityQueueHint ||
                      (selectedIsGenerating ? t('drama.episodeEdit.generating') : undefined)
                    }
                    onClick={() => void onGenerateSelected()}
                  >
                    {selectedIsGenerating
                      ? t('drama.episodeEdit.generating')
                      : busy
                        ? t('drama.episodeEdit.processing')
                        : continuityQueueHint
                          ? t('drama.episodeEdit.queued')
                          : continuityBlockedReason
                            ? t('drama.episodeEdit.waiting')
                            : selectedHasVideo
                              ? t('drama.episodeEdit.regenConfirm')
                              : t('drama.episodeEdit.genConfirm')}
                  </button>
                  <button
                    type="button"
                    className="drama-ep-btn-dark drama-ep-video-split-arrow"
                    disabled={!selected}
                    onClick={() => setShowVideoMenu((prev) => !prev)}
                    title="Tùy chọn tạo video"
                    aria-expanded={showVideoMenu}
                  >
                    <ChevronDown size={14} />
                  </button>

                  {showVideoMenu && (
                    <div className="drama-ep-video-dropdown-menu">
                      <button
                        type="button"
                        className="drama-ep-video-menu-item"
                        onClick={() => {
                          setShowVideoMenu(false)
                          onShowCurlModal()
                        }}
                      >
                        <Terminal size={15} className="drama-ep-video-menu-icon" />
                        <div className="drama-ep-video-menu-content">
                          <div className="drama-ep-video-menu-title">Lệnh cURL / Flow</div>
                          <div className="drama-ep-video-menu-desc">
                            Xem cURL tạo video, Prompt & dữ liệu Google Flow
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <EpisodeVersionsHistory
          selected={selected}
          selectedVersions={selectedVersions}
          previewVersionId={previewVersionId}
          busy={busy}
          selectedIsGenerating={selectedIsGenerating}
          selectedHasVideo={selectedHasVideo}
          onPreviewVersion={onPreviewVersion}
        />
      </section>
    )
  },
)
