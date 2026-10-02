/** Hợp nhất nội dung dự án với bố cục canvas đã lưu vào các nút/cạnh React Flow */
import type { Edge, Node } from '@xyflow/react'
import { resolveDramaMediaUrl, type DramaAsset } from '../../../api/drama'
import { readEditableVisualPrompt } from '../../../lib/dramaVisualPrompt'
import { readVideoGenerationOptions } from '../../../lib/dramaVideoGenerationOptions'
import { readAssetVoiceBinding } from '../CharacterVoiceBindModal'
import {
  CANVAS_NODE_DEFAULT_LABEL,
  CANVAS_NODE_SIZE,
  type CanvasAssetNodeData,
  type CanvasNodeKind,
} from './canvasTypes'
import { normalizeCanvasEdges, normalizeCanvasNodes } from './canvasNormalize'

/** Loại nội dung phim truyền hình → loại nút canvas */
export function dramaAssetTypeToKind(type: string | null | undefined): CanvasNodeKind {
  const t = String(type || '').toLowerCase()
  if (t === 'character') return 'character'
  if (t === 'scene') return 'scene'
  if (t === 'video') return 'video'
  if (t === 'audio') return 'audio'
  if (t === 'text') return 'text'
  /* prop / chất liệu / none / other → thẻ hình */
  return 'image'
}

/** Tạo ID nút ổn định dựa trên ID nội dung */
export function getCanvasNodeId(assetId: number) {
  return `asset-${assetId}`
}

/** Xây dựng dữ liệu nút từ nội dung */
export function buildNodeDataFromAsset(asset: DramaAsset): CanvasAssetNodeData {
  const kind = dramaAssetTypeToKind(asset.type)
  const params = (asset.params || {}) as Record<string, unknown>
  const promptHint = readEditableVisualPrompt(asset)
  const videoOptions =
    kind === 'video' ? readVideoGenerationOptions(params.videoOptions || params) : undefined
  const label =
    (typeof asset.name === 'string' && asset.name.trim()) || CANVAS_NODE_DEFAULT_LABEL[kind]
  const voice = kind === 'character' ? readAssetVoiceBinding(asset) : null

  return {
    kind,
    label,
    assetId: asset.id,
    mediaUrl: resolveDramaMediaUrl(asset.url || asset.cover) || null,
    textContent: kind === 'text' ? String(params.textContent || '') : undefined,
    promptHint,
    videoOptions,
    characterName: kind === 'character' ? label : undefined,
    voiceLabel: voice?.label || null,
    voiceUrl: voice?.url || null,
  }
}

type SavedLayoutIndex = {
  byAssetId: Map<number, Node<CanvasAssetNodeData>>
  orphanNodes: Node<CanvasAssetNodeData>[]
  edges: Edge[]
}

/** Nút canvas đã lưu chỉ mục (theo assetsId) */
function indexSavedLayout(rawNodes: unknown, rawEdges: unknown): SavedLayoutIndex {
  const nodes = normalizeCanvasNodes(rawNodes)
  const edges = normalizeCanvasEdges(rawEdges)
  const byAssetId = new Map<number, Node<CanvasAssetNodeData>>()
  const orphanNodes: Node<CanvasAssetNodeData>[] = []

  for (const node of nodes) {
    const assetId = node.data.assetId
    if (typeof assetId === 'number' && assetId > 0) {
      byAssetId.set(assetId, node)
    } else {
      orphanNodes.push(node)
    }
  }

  return { byAssetId, orphanNodes, edges }
}

/**
 * Hợp nhất nội dung dự án với bố cục đã lưu:
 * - Dự án thông thường: danh sách tài sản xác định các nút; bố cục đã lưu cung cấp vị trí và kết nối
 * - Canvas miễn phí: Chỉ khôi phục các nút tài sản đã được "lưu trên canvas" để tránh xuất hiện lại sau khi làm mới sau khi xóa.
 */
export function mergeAssetsWithCanvasLayout(
  assets: DramaAsset[],
  savedNodes: unknown,
  savedEdges: unknown,
  options?: { freeCanvas?: boolean },
): { nodes: Node<CanvasAssetNodeData>[]; edges: Edge[] } {
  const freeCanvas = Boolean(options?.freeCanvas)
  const saved = indexSavedLayout(savedNodes, savedEdges)
  const nodes: Node<CanvasAssetNodeData>[] = []
  let maxRight = 0
  const assetById = new Map(assets.map((a) => [a.id, a]))

  if (freeCanvas) {
    /* Canvas miễn phí: chỉ hiển thị các nút vẫn tồn tại trong bố cục và có nội dung chưa bị xóa (không chèn lấp theo danh sách nội dung) */
    for (const [assetId, savedNode] of saved.byAssetId) {
      const asset = assetById.get(assetId)
      if (!asset) continue
      const data = buildNodeDataFromAsset(asset)
      const size = CANVAS_NODE_SIZE[data.kind]
      nodes.push({
        ...savedNode,
        id: getCanvasNodeId(asset.id),
        type: 'asset',
        data: {
          ...savedNode.data,
          ...data,
          label: (savedNode.data.label as string) || data.label,
          promptHint: data.promptHint || savedNode.data.promptHint || '',
          videoOptions: data.videoOptions || savedNode.data.videoOptions,
          textContent:
            data.kind === 'text'
              ? savedNode.data.textContent ?? data.textContent
              : data.textContent,
        },
      })
      maxRight = Math.max(maxRight, savedNode.position.x + size.width + 40)
    }
    /* Các nút mồ côi không có assetsId vẫn được giữ lại */
    for (const orphan of saved.orphanNodes) {
      nodes.push(orphan)
    }
  } else {
    for (const asset of assets) {
      const data = buildNodeDataFromAsset(asset)
      const kind = data.kind
      const size = CANVAS_NODE_SIZE[kind]
      const savedNode = saved.byAssetId.get(asset.id)

      if (savedNode) {
        nodes.push({
          ...savedNode,
          id: getCanvasNodeId(asset.id),
          type: 'asset',
          data: {
            ...savedNode.data,
            ...data,
            textContent:
              kind === 'text'
                ? savedNode.data.textContent ?? data.textContent
                : data.textContent,
          },
        })
        maxRight = Math.max(maxRight, savedNode.position.x + size.width + 40)
      } else {
        nodes.push({
          id: getCanvasNodeId(asset.id),
          type: 'asset',
          position: {
            x: maxRight,
            y: 80,
          },
          data,
        })
        maxRight += size.width + 40
      }
    }

    /* Nút miễn phí cũ không có assetsId vẫn được giữ nguyên, được xếp bên dưới hàng nội dung */
    for (const orphan of saved.orphanNodes) {
      nodes.push({
        ...orphan,
        position: {
          x: orphan.position.x,
          y: Math.max(orphan.position.y, 420),
        },
      })
    }

    /* Toàn bộ hàng được xếp theo chiều ngang khi vào lần đầu (không lưu vị trí nào) */
    if (saved.byAssetId.size === 0 && assets.length > 0) {
      let i = 0
      for (const node of nodes) {
        if (typeof node.data.assetId !== 'number') continue
        const size = CANVAS_NODE_SIZE[node.data.kind]
        node.position = { x: i * (size.width + 40), y: 80 }
        i += 1
      }
    }
  }

  /* Lọc ra các cạnh trỏ đến nội dung đã xóa */
  const nodeIds = new Set(nodes.map((n) => n.id))
  const edges = saved.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))

  return { nodes, edges }
}
