/** Bộ chọn nút mặc định được hiển thị ở giữa khung vẽ trống */
import { MousePointer2 } from 'lucide-react'
import { CANVAS_NODE_OPTIONS, getNodeKindLabel, type CanvasNodeKind } from './canvasTypes'
import { useI18n } from '../../../i18n'

type CanvasNodeSelectorProps = {
  onSelect: (kind: CanvasNodeKind) => void
}

/** Hiển thị nhanh bộ chọn loại nút mới */
export function CanvasNodeSelector({ onSelect }: CanvasNodeSelectorProps) {
  const { t, locale } = useI18n()
  return (
    <div className="fc-overlay fc-node-selector">
      <div className="fc-node-selector-inner">
        <div className="fc-node-selector-row">
          {CANVAS_NODE_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                className="fc-node-chip"
                onClick={() => onSelect(option.id)}
              >
                <span className="fc-node-chip-icon">
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <span>{getNodeKindLabel(option.id, locale)}</span>
              </button>
            )
          })}
        </div>
        <p className="fc-node-hint">
          <MousePointer2 size={16} strokeWidth={1.8} />
          {t('drama.canvas.quickAddHint')}
        </p>
      </div>
    </div>
  )
}
