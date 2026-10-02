/** Lõi canvas vô hạn React Flow */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Background,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { CanvasAssetNode } from './CanvasAssetNode'
import { useCanvasStore } from './CanvasStore'
import { CANVAS_SNAP_GRID } from './canvasTypes'

type FreeCanvasFlowProps = {
  projectId: number
}

/** Render React Flow canvas vô hạn */
export function FreeCanvasFlow({ projectId }: FreeCanvasFlowProps) {
  const nodeTypes = useMemo(() => ({ asset: CanvasAssetNode }), [])
  const {
    nodes,
    edges,
    snapToGrid,
    showMinimap,
    onNodesChange,
    onEdgesChange,
    onConnect,
    pushSnapshot,
    focusNodeId,
    clearFocusNode,
  } = useCanvasStore()
  const { fitView, setCenter, getNode } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dragSnapshotPushed = useRef(false)

  /* Tập trung vào nút được chọn trong thư mục */
  useEffect(() => {
    if (!focusNodeId) return
    const node = getNode(focusNodeId)
    if (!node) {
      clearFocusNode()
      return
    }
    const w = 200
    const h = 240
    void setCenter(node.position.x + w / 2, node.position.y + h / 2, {
      zoom: 1,
      duration: 280,
    })
    clearFocusNode()
  }, [focusNodeId, getNode, setCenter, clearFocusNode])

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    return connection.source !== connection.target
  }, [])

  const handlePaneClick = useCallback(() => {
    wrapperRef.current?.focus()
  }, [])

  /* Đẩy ảnh chụp nhanh lịch sử khi bắt đầu kéo (cùng thao tác kéo chỉ được đẩy một lần) */
  const handleNodeDragStart = useCallback(() => {
    if (!dragSnapshotPushed.current) {
      pushSnapshot()
      dragSnapshotPushed.current = true
    }
  }, [pushSnapshot])

  const handleNodeDragStop = useCallback(() => {
    dragSnapshotPushed.current = false
  }, [])

  /* Đảm bảo rằng vùng chứa có thể lấy nét được; thích ứng với chế độ xem khi có nút sau khi tải */
  useEffect(() => {
    wrapperRef.current?.focus()
  }, [projectId])

  const fittedRef = useRef(false)
  useEffect(() => {
    fittedRef.current = false
  }, [projectId])

  useEffect(() => {
    if (fittedRef.current || nodes.length === 0) return
    fittedRef.current = true
    void fitView({ padding: 0.2 })
  }, [nodes.length, fitView])

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      className="free-canvas-flow"
      style={{ width: '100%', height: '100%', outline: 'none' }}
      data-project-id={projectId}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        isValidConnection={isValidConnection}
        onPaneClick={handlePaneClick}
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid={snapToGrid}
        snapGrid={CANVAS_SNAP_GRID}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'default' }}
      >
        <Background gap={CANVAS_SNAP_GRID[0]} size={1.2} color="#cbd5e1" />
        {showMinimap ? (
          <MiniMap
            pannable
            zoomable
            style={{ bottom: 20, right: 20, borderRadius: 12, overflow: 'hidden' }}
          />
        ) : null}
      </ReactFlow>
    </div>
  )
}
