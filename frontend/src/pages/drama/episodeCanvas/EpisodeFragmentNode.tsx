/** 分镜故事板节点：上方视频，下方提示词；出境资产通过左侧节点连线关联 */
import { memo, useCallback, type ChangeEvent } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Clapperboard, Plus } from 'lucide-react'
import { useI18n } from '../../../i18n'
import type { EpisodeFragmentNodeData } from './buildEpisodeFlow'

type Props = NodeProps<Node<EpisodeFragmentNodeData>> & {
  onPromptChange?: (fragmentId: number, content: string) => void
  onRequestLinkAsset?: (fragmentId: number) => void
}

// 渲染单个分镜视频节点
function EpisodeFragmentNodeComponent({
  data,
  selected,
  onPromptChange,
  onRequestLinkAsset,
}: Props) {
  const { t } = useI18n()
  const hasVideo = Boolean(data.videoUrl)
  const media = data.coverUrl || data.videoUrl

  const handlePromptChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onPromptChange?.(data.fragmentId, event.target.value)
    },
    [data.fragmentId, onPromptChange],
  )

  return (
    <div className={`ep-frag-node${selected ? ' is-selected' : ''}`}>
      <div className="ep-frag-node-head">
        <Clapperboard size={14} strokeWidth={1.8} aria-hidden />
        <span>{data.label}</span>
        {selected ? (
          <button
            type="button"
            className="ep-frag-link-btn nodrag nopan"
            title={t('drama.episodeEdit.linkAsset')}
            aria-label={t('drama.episodeEdit.linkAsset')}
            onClick={() => onRequestLinkAsset?.(data.fragmentId)}
          >
            <Plus size={14} strokeWidth={2} />
          </button>
        ) : (
          <em className="ep-frag-link-count">{data.linkedCount || 0} {t('drama.episodeEdit.assetsUnit')}</em>
        )}
      </div>

      <div className="ep-frag-media">
        {hasVideo ? (
          <video
            className="ep-frag-video"
            src={data.videoUrl}
            poster={data.coverUrl || undefined}
            controls
            playsInline
            preload="metadata"
          />
        ) : media ? (
          <img src={media} alt="" draggable={false} />
        ) : (
          <div className="ep-frag-media-empty">
            <span>{t('drama.episodeEdit.noClip')}</span>
            <small>{t('drama.episodeEdit.afterGenShow')}</small>
          </div>
        )}
      </div>

      <div className="ep-frag-prompt">
        <label>{t('drama.episodeEdit.promptLabel')}</label>
        {selected ? (
          <textarea
            className="ep-frag-prompt-input nodrag nowheel"
            value={data.content}
            onChange={handlePromptChange}
            placeholder={t('drama.episodeEdit.scriptPlaceholder')}
            rows={5}
          />
        ) : (
          <p className="ep-frag-prompt-text">
            {(data.content || '').trim() || `(${t('drama.episodeEdit.emptyPrompt')})`}
          </p>
        )}
      </div>

      <Handle
        className="ep-frag-handle"
        type="target"
        position={Position.Left}
        id="assets"
        style={{ top: '62%' }}
      />
      <Handle
        className="ep-frag-handle"
        type="target"
        position={Position.Left}
        id="seq-in-l"
        style={{ top: '38%' }}
      />
      <Handle className="ep-frag-handle" type="source" position={Position.Right} id="seq-out-r" />
      <Handle className="ep-frag-handle" type="target" position={Position.Top} id="seq-in-t" />
      <Handle className="ep-frag-handle" type="source" position={Position.Bottom} id="seq-out-b" />
    </div>
  )
}

export const EpisodeFragmentNode = memo(EpisodeFragmentNodeComponent)
