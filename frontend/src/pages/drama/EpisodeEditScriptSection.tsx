import React, { useRef, useState } from 'react'
import { Check, ExternalLink, FolderOpen, Loader2, Terminal, Upload } from 'lucide-react'
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
    videoUploading = false,
    onUploadVideo,
  }) {
    const { t } = useI18n()
    const uploadVideoInputRef = useRef<HTMLInputElement>(null)
    const [copiedType, setCopiedType] = useState<'project' | 'edit' | null>(null)

    const projectUrl =
      (selected?.params?.project_url as string) ||
      ((selected?.params?.generation as any)?.project_url as string) ||
      ''
    const editUrl =
      (selected?.params?.edit_url as string) ||
      ((selected?.params?.generation as any)?.edit_url as string) ||
      ''

    const handleCopyUrl = async (url: string, type: 'project' | 'edit') => {
      if (!url) return
      try {
        await navigator.clipboard.writeText(url)
        setCopiedType(type)
        setTimeout(() => setCopiedType(null), 2000)
      } catch {
        window.prompt('Sao chép liên kết:', url)
      }
    }

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
                  const localized = localizeScriptCues(selected.content || '', 'vi')
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
                min={4}
                max={15}
                value={selectedDuration}
                disabled={!editing && !selected}
                onChange={(e) =>
                  onUpdateSelected({ duration_sec: Number(e.target.value) || 8 })
                }
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
              onUpdateSelected({
                content: nextContent,
                asset_ids: Array.from(new Set([...keptExtra, ...fromContent])),
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
                <button
                  type="button"
                  className="drama-ep-btn-dark"
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
                  className="drama-ep-btn-ghost"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    minWidth: 'auto',
                    padding: '0 12px',
                    fontSize: '0.82rem',
                    color: '#334155',
                    background: '#fff',
                  }}
                  disabled={!selected}
                  onClick={onShowCurlModal}
                  title="Lấy Prompt, Ảnh tham chiếu & cURL để tạo video ngoài (Google Flow, Runway...)"
                >
                  <Terminal size={13} />
                  cURL / Flow
                </button>

                <input
                  ref={uploadVideoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && onUploadVideo) {
                      onUploadVideo(file)
                    }
                    if (uploadVideoInputRef.current) {
                      uploadVideoInputRef.current.value = ''
                    }
                  }}
                />
                <button
                  type="button"
                  className="drama-ep-btn-ghost"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    minWidth: 'auto',
                    padding: '0 12px',
                    fontSize: '0.82rem',
                    color: '#2563eb',
                    background: '#fff',
                  }}
                  disabled={!selected || videoUploading || selectedIsGenerating}
                  onClick={() => uploadVideoInputRef.current?.click()}
                  title="Tải lên video từ máy tính (tạo từ Google Flow, Runway, Sora...)"
                >
                  {videoUploading ? (
                    <Loader2 size={13} className="drama-ep-detect-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  {videoUploading ? 'Đang tải video…' : 'Tải video lên'}
                </button>

                {projectUrl && (
                  <button
                    type="button"
                    className="drama-ep-btn-ghost"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      minWidth: 'auto',
                      padding: '0 10px',
                      fontSize: '0.82rem',
                      color: '#4f46e5',
                      background: '#fff',
                    }}
                    onClick={() => void handleCopyUrl(projectUrl, 'project')}
                    title={`Sao chép Project URL (Google Flow):\n${projectUrl}`}
                  >
                    {copiedType === 'project' ? <Check size={13} color="#16a34a" /> : <FolderOpen size={13} />}
                    {copiedType === 'project' ? 'Đã chép Project URL' : 'Project URL'}
                  </button>
                )}

                {editUrl && (
                  <button
                    type="button"
                    className="drama-ep-btn-ghost"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      minWidth: 'auto',
                      padding: '0 10px',
                      fontSize: '0.82rem',
                      color: '#0891b2',
                      background: '#fff',
                    }}
                    onClick={() => void handleCopyUrl(editUrl, 'edit')}
                    title={`Sao chép Edit URL (Google Flow):\n${editUrl}`}
                  >
                    {copiedType === 'edit' ? <Check size={13} color="#16a34a" /> : <ExternalLink size={13} />}
                    {copiedType === 'edit' ? 'Đã chép Edit URL' : 'Edit URL'}
                  </button>
                )}
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
