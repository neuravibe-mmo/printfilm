import React from 'react'
import { CircleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { DramaFragmentClipSpec } from '../../components/drama/DramaFragmentClipSpec'
import { resolveDramaMediaUrl, type DramaFragment, type DramaTaskBrief } from '../../api/drama'
import {
  formatFragLabel,
  fragmentQueueBadgeLabel,
  readFragmentGenerationStatus,
  resolveFragmentDurationSec,
} from './dramaEpisodeEditUtils'

interface EpisodeStoryboardFooterProps {
  fragments: DramaFragment[]
  selectedIndex: number
  generatingIds: Set<number>
  activeTasks?: DramaTaskBrief[]
  busy: boolean
  episodeParams: Record<string, unknown>
  projectParams: Record<string, unknown>
  onSelectIndex: (index: number) => void
  onInsertFrag: (index: number) => void
  onDuplicateFrag: (index: number) => void
  onDeleteFrag: (index: number) => void
  onOpenFailReason: (frag: DramaFragment, index: number) => void
}

export const EpisodeStoryboardFooter: React.FC<EpisodeStoryboardFooterProps> = React.memo(
  function EpisodeStoryboardFooter({
    fragments,
    selectedIndex,
    generatingIds,
    activeTasks = [],
    busy,
    episodeParams,
    projectParams,
    onSelectIndex,
    onInsertFrag,
    onDuplicateFrag,
    onDeleteFrag,
    onOpenFailReason,
  }) {
    const { t } = useI18n()

    return (
      <footer className="drama-ep-storyboard">
        <div className="drama-ep-storyboard-row">
          <button
            type="button"
            className="drama-ep-insert"
            title={t('drama.episodeEdit.insertAtTop')}
            aria-label={t('drama.episodeEdit.insertAtTop')}
            onClick={() => onInsertFrag(0)}
          >
            +
          </button>
          {fragments.map((frag, index) => {
            const genInfo = readFragmentGenerationStatus(frag)
            const fragStatus = genInfo.status
            const activeVideoTask = activeTasks.find(
              (task) =>
                task.task_type === 'fragment_video' &&
                task.fragment_id === frag.id &&
                !task.cancel_requested &&
                ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review'].includes(
                  task.status,
                ),
            )
            // Trạng thái cuối cùng được ưu tiên; chỉ bị ghi đè bởi tác vụ nền tảng khi đang thực hiện
            const displayStatus =
              fragStatus === 'done' ||
              fragStatus === 'failed' ||
              fragStatus === 'cancelled'
                ? fragStatus
                : activeVideoTask
                  ? activeVideoTask.status === 'pending' || activeVideoTask.status === 'leased'
                    ? 'queued'
                    : 'running'
                  : fragStatus
            const fragBusy =
              Boolean(frag.id && generatingIds.has(frag.id)) &&
              displayStatus !== 'done' &&
              displayStatus !== 'failed' &&
              displayStatus !== 'cancelled'
            const badge = fragmentQueueBadgeLabel(displayStatus, t)
            const clipVideo = frag.video ? resolveDramaMediaUrl(frag.video) : ''
            const clipCover = frag.cover ? resolveDramaMediaUrl(frag.cover) : ''
            const showFailHint = displayStatus === 'failed' && !fragBusy
            const fragParams =
              frag.params && typeof frag.params === 'object' && !Array.isArray(frag.params)
                ? (frag.params as Record<string, unknown>)
                : {}

            return (
              <div key={`${frag.id}-${index}`} className="drama-ep-clip-wrap">
                <div
                  className={`drama-ep-clip-shell ${selectedIndex === index ? 'active' : ''}${
                    fragBusy ? ' is-generating' : ''
                  }${displayStatus === 'queued' ? ' is-queued' : ''}${
                    displayStatus === 'failed' ? ' is-failed' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="drama-ep-clip"
                    onClick={() => onSelectIndex(index)}
                  >
                    {clipCover ? (
                      <img src={clipCover} alt="" />
                    ) : clipVideo ? (
                      <video src={clipVideo} muted />
                    ) : (
                      <span className="drama-ep-clip-empty">
                        {fragBusy ? '…' : showFailHint ? (
                          <CircleAlert size={22} strokeWidth={2} aria-hidden />
                        ) : (
                          '+'
                        )}
                      </span>
                    )}
                    {badge ? <span className="drama-ep-clip-badge">{badge}</span> : null}
                    <em>
                      {formatFragLabel(index, resolveFragmentDurationSec(frag.content, frag.duration_sec), t)}
                      <DramaFragmentClipSpec
                        fragmentParams={fragParams}
                        episodeParams={episodeParams}
                        projectParams={projectParams}
                        videoUrl={clipVideo}
                      />
                    </em>
                  </button>
                  {showFailHint ? (
                    <button
                      type="button"
                      className="drama-ep-clip-fail-btn"
                      title={t('drama.episodeEdit.viewError')}
                      aria-label={t('drama.episodeEdit.viewFragError').replace('{i}', String(index + 1))}
                      onClick={() => onOpenFailReason(frag, index)}
                    >
                      <CircleAlert size={14} strokeWidth={2.25} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <div className="drama-ep-clip-ops">
                  <button
                    type="button"
                    aria-label={t('drama.episodeEdit.insert')}
                    onClick={() => onInsertFrag(index + 1)}
                    disabled={busy}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label={t('common.copy')}
                    onClick={() => onDuplicateFrag(index)}
                    disabled={busy}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    disabled={busy || fragments.length <= 1}
                    onClick={() => onDeleteFrag(index)}
                  >
                    ⌫
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </footer>
    )
  },
)
