import { Landmark, UserRound, Image as ImageIcon, PlaySquare } from 'lucide-react'
import { resolveDramaMediaUrl } from '../../../../api/drama'
import { getNodeKindLabel, type CanvasNodeKind } from '../canvasTypes'
import { useI18n } from '../../../../i18n'

export type CanvasMentionItem = {
  nodeId: string
  assetId: number
  kind: CanvasNodeKind
  label: string
  mediaUrl?: string | null
}

type CanvasMentionPopoverProps = {
  open: boolean
  query: string
  items: CanvasMentionItem[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onSelect: (item: CanvasMentionItem) => void
  onClose: () => void
}

/** 按节点类型返回图标 */
function KindIcon({ kind }: { kind: CanvasNodeKind }) {
  if (kind === 'character') return <UserRound size={14} strokeWidth={1.8} />
  if (kind === 'scene') return <Landmark size={14} strokeWidth={1.8} />
  if (kind === 'video') return <PlaySquare size={14} strokeWidth={1.8} />
  return <ImageIcon size={14} strokeWidth={1.8} />
}

/** 按查询过滤可引用节点 */
export function filterCanvasMentionItems(items: CanvasMentionItem[], query: string, locale?: string) {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => {
    const label = item.label.toLowerCase()
    const type = getNodeKindLabel(item.kind, locale).toLowerCase()
    return label.includes(q) || type.includes(q) || String(item.assetId).includes(q)
  })
}

/** 渲染 @ 引用候选列表 */
export function CanvasMentionPopover({
  open,
  query,
  items,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  onClose,
}: CanvasMentionPopoverProps) {
  const { t, locale } = useI18n()
  if (!open) return null

  const filtered = filterCanvasMentionItems(items, query, locale)

  return (
    <div
      className="fc-mention-popover nodrag nopan nowheel"
      role="listbox"
      aria-label={t('drama.canvas.mentionNode')}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div className="fc-mention-head">
        <span>{t('drama.canvas.referenceNode')}</span>
        <button
          type="button"
          className="fc-mention-close"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
          }}
          aria-label={t('common.close')}
        >
          ×
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="fc-mention-empty">{t('drama.canvas.noMatchingNodes')}</div>
      ) : (
        <ul className="fc-mention-list">
          {filtered.map((item, index) => {
            const thumb = resolveDramaMediaUrl(item.mediaUrl)
            const active = index === activeIndex
            return (
              <li key={item.nodeId}>
                <button
                  type="button"
                  className={`fc-mention-item${active ? ' is-active' : ''}`}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSelect(item)
                  }}
                >
                  <span className="fc-mention-thumb">
                    {thumb ? <img src={thumb} alt="" /> : <KindIcon kind={item.kind} />}
                  </span>
                  <span className="fc-mention-meta">
                    <strong>{item.label}</strong>
                    <em>{getNodeKindLabel(item.kind, locale)}</em>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
