import { FileText, MoreVertical, Scissors, Volume2 } from 'lucide-react'
import { useI18n } from '../../../i18n'
import { api } from '../../../api'
import type { Project, Shot } from '../../../api'
import { IconPlay } from '../../ui/Icons'
import {
  formatMmSs,
  isShotGenerating,
  shotDisplayDone,
  shotDisplayKind,
  shotDisplayLabel,
} from '../../../lib/status'
import { parseSegmentScript } from '../../../lib/segmentDuration'
import { scenePromptForDisplay } from '../../../promptDisplay'
import {
  localizeBeatText,
  localizeCueText,
  shotCaption,
} from './storyboardUtils'
import type { PreviewState } from './StoryboardPreviewModal'

export interface StoryboardShotRowProps {
  shot: Shot
  project: Project
  busyShotIds: Set<number>
  pipelineLocked: boolean
  pageBusy: boolean
  isFullPipeline: boolean
  videoDurations: Record<number, number>
  imgMenuShotId: number | null
  menuShotId: number | null
  onSetImgMenuShotId: React.Dispatch<React.SetStateAction<number | null>>
  onSetMenuShotId: React.Dispatch<React.SetStateAction<number | null>>
  onOpenPreview: (preview: PreviewState) => void
  onOpenShotEdit: (shot: Shot, focus?: string) => void
  onOpenTrimModal: (shot: Shot, dur: number) => void
  onOpenPromptModal: (shot: Shot, tab?: 'image' | 'video') => void
  onRegenImage: (shot: Shot) => void
  onRegenVideo: (shot: Shot) => void
  onRegenAudio: (shot: Shot) => void
}

export default function StoryboardShotRow({
  shot,
  project,
  busyShotIds,
  pipelineLocked,
  pageBusy,
  isFullPipeline,
  videoDurations,
  imgMenuShotId,
  menuShotId,
  onSetImgMenuShotId,
  onSetMenuShotId,
  onOpenPreview,
  onOpenShotEdit,
  onOpenTrimModal,
  onOpenPromptModal,
  onRegenImage,
  onRegenVideo,
  onRegenAudio,
}: StoryboardShotRowProps) {
  const { t, locale } = useI18n()

  const localBusy = busyShotIds.has(shot.id)
  const shotGenerating = isShotGenerating(project, shot.id) || localBusy
  const rowBusy = pageBusy || pipelineLocked || shotGenerating
  const displayKind = shotDisplayKind(shot, {
    pipelineMode: project.pipeline_mode,
    generating: shotGenerating,
  })
  const done = shotDisplayDone(displayKind)
  const failed = displayKind === 'failed'
  const sceneTitle =
    shot.overlay_title?.trim() ||
    `${t('studio.storyboard.sceneLabel')} ${String(shot.shot_no).padStart(2, '0')}`
  const narration = (shot.narration || '').trim()
  const script = shot.segment_script || shot.video_prompt || ''
  const { cues, beats } = parseSegmentScript(script)
  const desc = scenePromptForDisplay(shot.img_prompt).trim()
  const canTrim = Boolean(
    shot.video_url &&
      videoDurations[shot.id] &&
      Math.abs(videoDurations[shot.id] - Number(shot.duration)) > 0.5,
  )

  return (
    <tr>
      <td className="col-no">{String(shot.shot_no).padStart(2, '0')}</td>
      <td className="col-thumb">
        <button
          type="button"
          className="pf-shot-thumb-btn"
          onClick={() =>
            onOpenPreview({
              kind: 'shot',
              shotNo: shot.shot_no,
              imageUrl: shot.image_url,
              videoUrl: shot.video_url,
              audioUrl: shot.audio_url,
              caption: shotCaption(shot, t),
              version: shot.version,
            })
          }
        >
          {shot.image_url ? (
            <img
              className="pf-shot-thumb"
              src={api.assetUrl(shot.image_url, shot.version)}
              alt=""
            />
          ) : (
            <div className="pf-shot-thumb empty">
              {shotGenerating ? t('studio.storyboard.generating') : t('studio.storyboard.pending')}
            </div>
          )}
          {shot.video_url ? (
            <span className="pf-shot-thumb-play-overlay" title={t('studio.storyboard.viewVideo')}>
              <span className="pf-shot-thumb-play-icon">
                <IconPlay size={14} />
              </span>
            </span>
          ) : null}
        </button>
      </td>
      <td className="col-narr">
        <button
          type="button"
          className="pf-shot-narration pf-shot-editable"
          disabled={rowBusy}
          title={t('studio.storyboard.editNarrTip')}
          onClick={() => onOpenShotEdit(shot, 'narration')}
        >
          <span className="title">{sceneTitle}</span>
          <span className="line">{narration ? `“${narration}”` : '—'}</span>
        </button>
      </td>
      <td className="col-seg">
        <button
          type="button"
          className="pf-shot-desc pf-shot-editable"
          disabled={rowBusy}
          title={t('studio.storyboard.editSegTip')}
          onClick={() => onOpenShotEdit(shot, 'segment_script')}
          style={{ textAlign: 'left', width: '100%' }}
        >
          {cues.length > 0 ? (
            <span className="pf-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
              {localizeCueText(cues[0], locale)?.replace(/^【|】$/g, '')}
              {cues[1]
                ? ` · ${(() => {
                    const clean = localizeCueText(cues[1], locale)
                      .replace(/^【(?:BGM[：:]\s*|Nhạc nền[：:]\s*)?/i, '')
                      .replace(/】$/, '')
                    return clean.length > 80 ? `${clean.slice(0, 80)}…` : clean
                  })()}`
                : ''}
            </span>
          ) : null}
          {beats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {beats.slice(0, 6).map((b, i) => {
                const localizedText = localizeBeatText(b.text, locale)
                return (
                  <span key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    {b.duration > 0 ? (
                      <span
                        style={{
                          flex: '0 0 auto',
                          fontSize: '0.72rem',
                          background: '#111',
                          color: '#fff',
                          borderRadius: 4,
                          padding: '1px 5px',
                        }}
                      >
                        {b.duration}s
                      </span>
                    ) : null}
                    <span style={{ fontSize: '0.82rem' }}>
                      {localizedText.length > 160
                        ? `${localizedText.slice(0, 160)}…`
                        : localizedText}
                    </span>
                  </span>
                )
              })}
              {beats.length > 6 ? (
                <span className="pf-muted" style={{ fontSize: '0.75rem' }}>
                  {t('studio.storyboard.moreSegs').replace('{n}', String(beats.length - 6))}
                </span>
              ) : null}
            </div>
          ) : (
            desc || t('studio.storyboard.segPlaceholder')
          )}
        </button>
      </td>
      <td className="col-dur">{formatMmSs(shot.duration)}</td>
      <td className="col-status">
        <div className="pf-shot-status-wrap">
          <span
            className={['pf-shot-status', failed ? 'bad' : done ? '' : 'warn']
              .filter(Boolean)
              .join(' ')}
          >
            {done && !failed ? <span className="mark">✓</span> : null}
            {shotDisplayLabel(displayKind)}
          </span>
          {shot.video_url ? (
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="pf-shot-view-btn"
                onClick={() =>
                  onOpenPreview({
                    kind: 'shot',
                    shotNo: shot.shot_no,
                    imageUrl: shot.image_url,
                    videoUrl: shot.video_url,
                    audioUrl: shot.audio_url,
                    caption: shotCaption(shot, t),
                    version: shot.version,
                  })
                }
              >
                <IconPlay size={12} />
                {t('studio.storyboard.viewVideo')}
              </button>
              {canTrim ? (
                <button
                  type="button"
                  className="pf-shot-trim-btn"
                  title={t('studio.storyboard.trimTip')}
                  onClick={() => onOpenTrimModal(shot, videoDurations[shot.id])}
                >
                  ✂ {t('studio.storyboard.trimAction')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </td>
      <td className="col-ops">
        <div className="pf-shot-ops">
          <button
            type="button"
            className="op"
            disabled={rowBusy}
            onClick={() => onOpenShotEdit(shot)}
          >
            {t('common.edit')}
          </button>
          <div className="pf-shot-op-row">
            <button
              type="button"
              className="op"
              disabled={rowBusy}
              onClick={() => onRegenImage(shot)}
            >
              {shot.image_url
                ? t('studio.storyboard.redrawImage')
                : t('studio.storyboard.genImage')}
            </button>
            <button
              type="button"
              className="more"
              aria-label={t('studio.storyboard.imageOps')}
              disabled={rowBusy}
              onClick={(e) => {
                e.stopPropagation()
                onSetMenuShotId(() => null)
                onSetImgMenuShotId((id) => (id === shot.id ? null : shot.id))
              }}
            >
              <MoreVertical size={16} strokeWidth={2} />
            </button>
            {imgMenuShotId === shot.id ? (
              <div className="pf-shot-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    onSetImgMenuShotId(() => null)
                    onOpenPromptModal(shot, 'image')
                  }}
                >
                  <FileText size={14} strokeWidth={2} />
                  <span>{t('studio.storyboard.viewPrompt')}</span>
                </button>
              </div>
            ) : null}
          </div>
          {isFullPipeline ? (
            <div className="pf-shot-op-row">
              <button
                type="button"
                className="op op-video"
                disabled={rowBusy || !shot.image_url}
                title={!shot.image_url ? t('studio.storyboard.needImageFirst') : undefined}
                onClick={() => onRegenVideo(shot)}
              >
                {shot.video_url
                  ? t('studio.storyboard.regenVideo')
                  : t('studio.storyboard.genVideo')}
              </button>
              <button
                type="button"
                className="more"
                aria-label={t('studio.storyboard.moreOps')}
                disabled={rowBusy}
                onClick={(e) => {
                  e.stopPropagation()
                  onSetImgMenuShotId(() => null)
                  onSetMenuShotId((id) => (id === shot.id ? null : shot.id))
                }}
              >
                <MoreVertical size={16} strokeWidth={2} />
              </button>
              {menuShotId === shot.id ? (
                <div className="pf-shot-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      onSetMenuShotId(() => null)
                      onOpenPromptModal(shot, 'video')
                    }}
                  >
                    <FileText size={14} strokeWidth={2} />
                    <span>{t('studio.storyboard.viewPrompt')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => {
                      onSetMenuShotId(() => null)
                      onRegenAudio(shot)
                    }}
                  >
                    <Volume2 size={14} strokeWidth={2} />
                    <span>{t('studio.storyboard.redub')}</span>
                  </button>
                  {canTrim ? (
                    <button
                      type="button"
                      disabled={rowBusy}
                      onClick={() => {
                        onSetMenuShotId(() => null)
                        onOpenTrimModal(shot, videoDurations[shot.id])
                      }}
                    >
                      <Scissors size={14} strokeWidth={2} />
                      <span>{t('studio.storyboard.trimVideo')}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
