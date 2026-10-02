/** Bên phải phần chỉnh sửa tập: xem trước video phân đoạn + lối vào để mở canvas bảng phân cảnh toàn màn hình */
import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import type { DramaFragment } from '../../api/drama'
import { DramaSubtitleBoard } from '../../components/drama/DramaSubtitleBoard'
import { DramaFragmentSegmentedVideoPlayer } from '../../components/drama/DramaFragmentSegmentedVideoPlayer'
import { triggerBlobDownload } from '../../lib/clientDownload'
import {
  composeEpisodeVideoClient,
  episodeComposeFilename,
  listEpisodeComposeClips,
  type EpisodeComposeProgress,
} from '../../lib/composeEpisodeVideoClient'
import { dialog } from '../../lib/dialog'
import type { DramaSubtitleMode } from '../../lib/dramaSubtitleBoard'
import { useI18n, type TFunction } from '../../i18n'

type Props = {
  fragments: DramaFragment[]
  playingFragmentId: number | null
  onPlayingFragmentChange: (fragmentId: number) => void
  aspectRatio: string
  episodeId?: number
  episodeName?: string
  subtitleMode: DramaSubtitleMode
  onOpenStoryboard: () => void
  /** Ghi đè src video nhân bản hiện tại khi xem trước các phiên bản lịch sử */
  previewVideoUrl?: string | null
  previewPosterUrl?: string | null
  previewLabel?: string
  onClearPreview?: () => void
  onActivatePreview?: () => void
}

/** Chuyển tiến trình tổng hợp thành bản sao nút */
function composeProgressLabel(progress: EpisodeComposeProgress | null, busy: boolean, t: TFunction) {
  if (!busy) return t('drama.episodeEdit.stitchAll')
  if (!progress) return t('drama.episodeEdit.stitching')
  if (progress.phase === 'download') return t('drama.episodeEdit.pullingShot', { done: progress.done, total: progress.total })
  if (progress.phase === 'server') return t('drama.episodeEdit.serverTranscoding')
  return t('drama.episodeEdit.stitching')
}

// Bản xem trước và mục nhập canvas ở phía bên phải của tập kết xuất
export function EpisodeEditSidePane({
  fragments,
  playingFragmentId,
  onPlayingFragmentChange,
  aspectRatio,
  episodeId,
  episodeName,
  subtitleMode,
  onOpenStoryboard,
  previewVideoUrl = null,
  previewPosterUrl = null,
  previewLabel = '',
  onClearPreview,
  onActivatePreview,
}: Props) {
  const { t } = useI18n()
  const resolvedEpisodeName = episodeName || t('drama.episodeEdit.thisEpisode')
  const hasSelection = playingFragmentId !== null
  /*
   * soạn bài Bận rộn nối cục bộ
   * soạn tiến trình kéo/nối tiến trình
   * nguyên nhân lỗi soạn thảoError
   */
  const [composeBusy, setComposeBusy] = useState(false)
  const [composeProgress, setComposeProgress] = useState<EpisodeComposeProgress | null>(null)
  const [composeError, setComposeError] = useState('')
  const composeClips = listEpisodeComposeClips(fragments)
  const missingCount = fragments.length - composeClips.length

  // Tính năng ghép nối trong trình duyệt đã tạo ra cảnh quay và tải nó thành phim
  async function handleComposeDownload() {
    if (composeBusy || composeClips.length === 0) return
    if (missingCount > 0) {
      const ok = await dialog.confirm({
        title: t('drama.episodeEdit.partialShotsTitle'),
        message: t('drama.episodeEdit.partialShotsMsg', { missing: missingCount, total: composeClips.length }),
        confirmText: t('drama.episodeEdit.continueCompose'),
      })
      if (!ok) return
    }
    setComposeError('')
    setComposeBusy(true)
    setComposeProgress({ phase: 'download', done: 0, total: composeClips.length })
    try {
      const blob = await composeEpisodeVideoClient(composeClips, setComposeProgress, {
        episodeId,
      })
      triggerBlobDownload(blob, episodeComposeFilename(resolvedEpisodeName))
    } catch (err) {
      setComposeError(err instanceof Error ? err.message : t('drama.episodeEdit.composeFailed'))
    } finally {
      setComposeBusy(false)
      setComposeProgress(null)
    }
  }

  return (
    <aside className="drama-ep-preview">
      <div className="drama-ep-side-header">
        <div className="drama-ep-side-tabs" role="tablist" aria-label={t('drama.episodeEdit.rightPanel')}>
          <button type="button" role="tab" aria-selected className="active">
            {t('common.preview')}
          </button>
          <button type="button" role="tab" onClick={onOpenStoryboard}>
            {t('drama.canvas.title')}
          </button>
        </div>
        <button
          type="button"
          className="drama-ep-compose-btn drama-ep-compose-btn--header"
          disabled={composeBusy || composeClips.length === 0}
          title={
            composeClips.length === 0
              ? t('drama.episodeEdit.genShotsFirst')
              : t('drama.episodeEdit.composeHint')
          }
          onClick={() => void handleComposeDownload()}
        >
          {composeBusy ? (
            <Loader2 size={14} className="drama-ep-compose-spin" />
          ) : (
            <Download size={14} strokeWidth={1.8} />
          )}
          {composeProgressLabel(composeProgress, composeBusy, t)}
        </button>
      </div>
      {composeError ? <p className="drama-ep-compose-error drama-ep-compose-error--header">{composeError}</p> : null}

      {previewVideoUrl ? (
        <div className="drama-ep-preview-banner">
          <span>{t('drama.episodeEdit.previewHistory')}{previewLabel ? ` · ${previewLabel}` : ''}</span>
          <div className="drama-ep-preview-banner-actions">
            {onActivatePreview ? (
              <button type="button" className="drama-ep-preview-banner-btn" onClick={onActivatePreview}>
                {t('drama.episodeEdit.setAsCurrent')}
              </button>
            ) : null}
            {onClearPreview ? (
              <button type="button" className="drama-ep-preview-banner-btn is-ghost" onClick={onClearPreview}>
                {t('drama.episodeEdit.exitPreview')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!hasSelection || fragments.length === 0 ? (
        <p className="drama-ep-empty">{t('drama.episodeEdit.selectShotHint')}</p>
      ) : (
        <>
          <div className="drama-ep-preview-inner">
            <DramaFragmentSegmentedVideoPlayer
              fragments={fragments}
              playingFragmentId={playingFragmentId}
              onPlayingFragmentChange={onPlayingFragmentChange}
              aspectRatio={aspectRatio}
              overrideVideoUrl={previewVideoUrl}
              overridePosterUrl={previewPosterUrl}
            />
            {!fragments.some((f) => f.video) && (
              <button type="button" className="drama-ep-open-canvas" onClick={onOpenStoryboard}>
                {t('drama.episodeEdit.openCanvas')}
              </button>
            )}
          </div>
          <DramaSubtitleBoard
            fragments={fragments}
            episodeName={resolvedEpisodeName}
            subtitleMode={subtitleMode}
          />
        </>
      )}
    </aside>
  )
}
