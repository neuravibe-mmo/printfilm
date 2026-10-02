/** Nút nội dung gửi đi: thẻ hình thu nhỏ, có thể liên kết với nhiều bảng phân cảnh */
import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { X } from 'lucide-react'
import { useI18n } from '../../../i18n'
import type { EpisodeAssetNodeData } from './buildEpisodeFlow'

type Props = NodeProps<Node<EpisodeAssetNodeData>> & {
  onUnlinkAsset?: (fragmentId: number, assetId: number) => void
}

// Hiển thị các nút nội dung gửi đi (chỉ một thẻ được hiển thị trên toàn cầu cho cùng một nội dung)
function EpisodeAssetNodeComponent({ data, selected, onUnlinkAsset }: Props) {
  const { t } = useI18n()
  const links = data.linkedFragments || []

  return (
    <div className={`ep-asset-node${selected ? ' is-selected' : ''}`}>
      <div className="ep-asset-node-head">
        <span>{data.typeLabel}</span>
        {links.length > 1 ? (
          <span className="ep-asset-node-count" title={t('drama.episodeEdit.linkedFrags')}>
            {links.length} {t('drama.episodeEdit.shotKeyword')}
          </span>
        ) : null}
      </div>
      <div className="ep-asset-node-thumb">
        {data.previewUrl ? (
          <img src={data.previewUrl} alt="" draggable={false} />
        ) : (
          <span>{(data.name || '?')[0]}</span>
        )}
      </div>
      <div className="ep-asset-node-name">{data.name}</div>
      {selected && links.length > 0 ? (
        <div className="ep-asset-node-links nodrag nopan">
          {links.map((link) => (
            <button
              key={link.fragmentId}
              type="button"
              className="ep-asset-node-unlink-chip"
              aria-label={t('drama.episodeEdit.unlinkAssetLabel', { label: link.label })}
              title={t('drama.episodeEdit.unlinkAssetLabel', { label: link.label })}
              onClick={() => onUnlinkAsset?.(link.fragmentId, data.assetId)}
            >
              {link.label}
              <X size={11} strokeWidth={2.4} aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
      <Handle className="ep-frag-handle" type="source" position={Position.Right} />
    </div>
  )
}

export const EpisodeAssetNode = memo(EpisodeAssetNodeComponent)
