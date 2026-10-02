/** Thanh công cụ được căn giữa theo chiều dọc ở phía bên trái của canvas và bảng Add Node */
import { useEffect, useRef, useState } from 'react'
import { FolderOpen, Plus, X } from 'lucide-react'
import { useCanvasStore } from './CanvasStore'
import { ADD_NODE_OPTIONS, CANVAS_NODE_OPTION_BY_KIND, getNodeKindLabel, type CanvasNodeKind } from './canvasTypes'
import { useI18n } from '../../../i18n'

type CanvasLeftToolbarProps = {
  onSelectNode: (kind: CanvasNodeKind) => void
}

/** Hiển thị thanh công cụ nổi ở phía bên trái của khung vẽ */
export function CanvasLeftToolbar({ onSelectNode }: CanvasLeftToolbarProps) {
  const { t, locale } = useI18n()
  const { nodes, requestFocusNode } = useCanvasStore()
  /*
   * bảngMở Thêm bảng nút
   * thư mụcMở bảng danh sách nút
   */
  const [panelOpen, setPanelOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const addAnchorRef = useRef<HTMLDivElement>(null)

  // Nhấp vào bên ngoài để đóng bảng thêm
  useEffect(() => {
    if (!panelOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const root = addAnchorRef.current
      if (!root) return
      if (event.target instanceof Node && root.contains(event.target)) return
      setPanelOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [panelOpen])

  return (
    <div className="fc-overlay fc-left-toolbar">
      <div className="fc-left-stack">
        <div
          ref={addAnchorRef}
          className={`fc-add-anchor${panelOpen ? ' is-open' : ''}`}
          onMouseEnter={() => setPanelOpen(true)}
          onMouseLeave={() => setPanelOpen(false)}
        >
          <button
            type="button"
            className={`fc-icon-btn is-primary${panelOpen ? ' is-open' : ''}`}
            aria-label={panelOpen ? t('drama.canvas.closeAddNode') : t('drama.canvas.addNodeTitle')}
            aria-expanded={panelOpen}
            title={t('drama.canvas.addNodeTitle')}
            onClick={(event) => {
              event.stopPropagation()
              setPanelOpen((v) => !v)
              setFolderOpen(false)
            }}
          >
            {panelOpen ? <X size={18} strokeWidth={2} /> : <Plus size={18} strokeWidth={2} />}
          </button>

          {panelOpen ? (
            <div className="fc-add-panel-bridge" role="menu" aria-label={t('drama.canvas.addNodeType')}>
              <div className="fc-add-panel">
                {ADD_NODE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSelectNode(option.id)
                        setPanelOpen(false)
                      }}
                    >
                      <span className="fc-add-panel-icon">
                        <Icon size={14} strokeWidth={1.8} />
                      </span>
                      {getNodeKindLabel(option.id, locale)}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className={`fc-icon-btn${folderOpen ? ' is-active' : ''}`}
          aria-label={t('drama.canvas.assetFolder')}
          title={t('drama.canvas.assetFolder')}
          aria-expanded={folderOpen}
          onClick={() => {
            setFolderOpen((v) => !v)
            setPanelOpen(false)
          }}
        >
          <FolderOpen size={18} strokeWidth={1.8} />
        </button>

        {folderOpen ? (
          <div className="fc-folder-panel" role="dialog" aria-label={t('drama.canvas.canvasNodes')}>
            <h4>{t('drama.canvas.canvasNodes')}</h4>
            {nodes.length === 0 ? (
              <p className="fc-folder-empty">{t('drama.canvas.noNodesHint')}</p>
            ) : (
              nodes.map((node) => {
                const option = CANVAS_NODE_OPTION_BY_KIND[node.data.kind]
                const Icon = option.icon
                return (
                  <button
                    key={node.id}
                    type="button"
                    className="fc-folder-item"
                    onClick={() => {
                      requestFocusNode(node.id)
                      setFolderOpen(false)
                    }}
                  >
                    <Icon size={14} strokeWidth={1.8} />
                    <span>
                      {getNodeKindLabel(node.data.kind, locale)} · {node.data.label}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
