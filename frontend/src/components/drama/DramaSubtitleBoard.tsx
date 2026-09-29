/** 分镜字幕板：预览整集口播字幕，支持折叠与导出。 */
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { DramaFragment } from '../../api/drama'
import { useI18n } from '../../i18n'
import { sanitizeMediaBasename } from '../../lib/canvasNodeMedia'
import { triggerBlobDownload } from '../../lib/clientDownload'
import {
  buildDramaSubtitleBoard,
  exportDramaSubtitleBoardSrt,
  formatSubtitleClock,
  subtitleModeUsesModelOutput,
  type DramaSubtitleMode,
} from '../../lib/dramaSubtitleBoard'
import { formatFragName } from '../../pages/drama/dramaEpisodeEditUtils'

type Props = {
  fragments: DramaFragment[]
  episodeName?: string
  subtitleMode: DramaSubtitleMode
}

// 渲染可折叠的分集字幕板预览与导出按钮。
export function DramaSubtitleBoard({
  fragments,
  episodeName,
  subtitleMode,
}: Props) {
  const { t } = useI18n()
  const displayEpisodeName = episodeName || t('drama.projectOutput.thisEpisode')
  const cues = buildDramaSubtitleBoard(fragments)
  const modelOutput = subtitleModeUsesModelOutput(subtitleMode)
  // collapsed 默认折叠，减少右侧预览占位
  const [collapsed, setCollapsed] = useState(true)

  return (
    <section className={`drama-subtitle-board${collapsed ? ' is-collapsed' : ''}`}>
      <div className="drama-subtitle-board__header">
        <button
          type="button"
          className="drama-subtitle-board__toggle"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <span className="drama-subtitle-board__title-wrap">
            <h4>{t('drama.subtitleBoard.title')}</h4>
            <p>
              {modelOutput ? t('drama.subtitleBoard.modelOutput') : t('drama.subtitleBoard.postStitch')} ·{' '}
              {t('drama.subtitleBoard.linesCount', { n: cues.length })}
            </p>
          </span>
          {collapsed ? (
            <ChevronDown size={16} strokeWidth={1.8} aria-hidden />
          ) : (
            <ChevronUp size={16} strokeWidth={1.8} aria-hidden />
          )}
        </button>
        <button
          type="button"
          className="drama-subtitle-board__export"
          disabled={cues.length === 0}
          title={t('drama.subtitleBoard.exportTooltip')}
          onClick={(event) => {
            event.stopPropagation()
            const srt = exportDramaSubtitleBoardSrt(fragments)
            if (!srt) return
            // 剪映桌面版可识别 UTF-8 BOM 的 .srt
            const blob = new Blob(['\uFEFF', srt], { type: 'application/x-subrip;charset=utf-8' })
            triggerBlobDownload(
              blob,
              `${sanitizeMediaBasename(displayEpisodeName)}_${t('drama.subtitleBoard.fileSuffix')}.srt`,
            )
          }}
        >
          {t('drama.subtitleBoard.exportSrt')}
        </button>
      </div>
      {!collapsed ? (
        cues.length === 0 ? (
          <div className="drama-subtitle-board__empty">{t('drama.subtitleBoard.empty')}</div>
        ) : (
          <div className="drama-subtitle-board__list">
            {cues.map((cue, index) => (
              <div
                key={`${cue.fragmentId}-${cue.startSec}-${index}`}
                className="drama-subtitle-board__item"
              >
                <div className="drama-subtitle-board__meta">
                  <span>
                    {formatSubtitleClock(cue.startSec)} - {formatSubtitleClock(cue.endSec)}
                  </span>
                  <span>{formatFragName(cue.fragmentIndex, t)}</span>
                  <span>{cue.speaker}</span>
                </div>
                <div className="drama-subtitle-board__text">{cue.text}</div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </section>
  )
}
