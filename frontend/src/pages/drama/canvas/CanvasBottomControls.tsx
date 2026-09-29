/** 画布左下角缩放与撤销控制条 */
import { useCallback, useState } from 'react'
import { LocateFixed, Magnet, Map, Minus, Plus, Redo2, Scan, Undo2 } from 'lucide-react'
import { useOnViewportChange, useReactFlow } from '@xyflow/react'
import { useCanvasStore } from './CanvasStore'
import { useI18n } from '../../../i18n'

/** 渲染画布左下角控制条 */
export function CanvasBottomControls() {
  const { t } = useI18n()
  const {
    snapToGrid,
    showMinimap,
    canUndo,
    canRedo,
    toggleSnapToGrid,
    toggleMinimap,
    undo,
    redo,
  } = useCanvasStore()
  const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow()
  const [zoomPercent, setZoomPercent] = useState(100)

  useOnViewportChange({
    onChange: (viewport) => {
      setZoomPercent(Math.round(viewport.zoom * 100))
    },
  })

  const handleResetZoom = useCallback(() => {
    const viewport = getViewport()
    void setViewport({ ...viewport, zoom: 1 }, { duration: 200 })
  }, [getViewport, setViewport])

  return (
    <div className="fc-overlay fc-bottom-controls">
      <div className="fc-bottom-bar">
        <button
          type="button"
          className="fc-icon-btn is-sm"
          aria-label={t('drama.canvas.undo')}
          title={t('drama.canvas.undo')}
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className="fc-icon-btn is-sm"
          aria-label={t('drama.canvas.redo')}
          title={t('drama.canvas.redo')}
          disabled={!canRedo}
          onClick={redo}
        >
          <Redo2 size={16} strokeWidth={1.8} />
        </button>

        <span className="fc-bottom-sep" />

        <button
          type="button"
          className="fc-icon-btn is-sm"
          aria-label={t('drama.canvas.locateContent')}
          title={t('drama.canvas.locateContent')}
          onClick={() => void fitView({ duration: 200 })}
        >
          <LocateFixed size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className="fc-icon-btn is-sm"
          aria-label={t('drama.canvas.fitCanvas')}
          title={t('drama.canvas.fitCanvas')}
          onClick={() => void fitView({ duration: 200, padding: 0.2 })}
        >
          <Scan size={16} strokeWidth={1.8} />
        </button>

        <span className="fc-bottom-sep" />

        <button
          type="button"
          className={`fc-icon-btn is-sm${snapToGrid ? ' is-active' : ''}`}
          aria-label={snapToGrid ? t('drama.canvas.gridSnapOff') : t('drama.canvas.gridSnapOn')}
          title={snapToGrid ? t('drama.canvas.gridSnapOff') : t('drama.canvas.gridSnapOn')}
          aria-pressed={snapToGrid}
          onClick={toggleSnapToGrid}
        >
          <Magnet size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className={`fc-icon-btn is-sm${showMinimap ? ' is-active' : ''}`}
          aria-label={showMinimap ? t('drama.canvas.minimapOff') : t('drama.canvas.minimapOn')}
          title={showMinimap ? t('drama.canvas.minimapOff') : t('drama.canvas.minimapOn')}
          aria-pressed={showMinimap}
          onClick={toggleMinimap}
        >
          <Map size={16} strokeWidth={1.8} />
        </button>

        <span className="fc-bottom-sep" />

        <button
          type="button"
          className="fc-icon-btn is-sm"
          aria-label={t('drama.canvas.zoomOut')}
          title={t('drama.canvas.zoomOut')}
          onClick={() => zoomOut({ duration: 150 })}
        >
          <Minus size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className="fc-zoom-label"
          aria-label={t('drama.canvas.resetZoom')}
          title={t('drama.canvas.resetZoom')}
          onClick={handleResetZoom}
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          className="fc-icon-btn is-sm"
          aria-label={t('drama.canvas.zoomIn')}
          title={t('drama.canvas.zoomIn')}
          onClick={() => zoomIn({ duration: 150 })}
        >
          <Plus size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
