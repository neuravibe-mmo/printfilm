/** Loại nút canvas và định nghĩa tùy chọn bộ chọn */
import type { LucideIcon } from 'lucide-react'
import {
  AudioLines,
  Image as ImageIcon,
  Landmark,
  PlaySquare,
  Text,
  UserRound,
} from 'lucide-react'

export type CanvasNodeKind = 'character' | 'scene' | 'video' | 'image' | 'text' | 'audio'

export type CanvasNodeOption = {
  id: CanvasNodeKind
  label: string
  icon: LucideIcon
}

export type CanvasAssetNodeData = {
  kind: CanvasNodeKind
  label: string
  assetId?: number
  mediaUrl?: string | null
  textContent?: string
  generating?: boolean
  /** Tham số tạo hạt giống của nút video */
  videoOptions?: Record<string, unknown>
  [key: string]: unknown
}

/** Các loại nút hỗ trợ tải lên hình ảnh cục bộ */
export const CANVAS_UPLOADABLE_KINDS = new Set<CanvasNodeKind>([
  'character',
  'scene',
  'image',
  'video',
])

/** Hỗ trợ các từ nhắc nhở + các loại nút do AI tạo */
export const CANVAS_GENERATABLE_KINDS = new Set<CanvasNodeKind>([
  'character',
  'scene',
  'image',
  'video',
])

/** Drama assets_type tương ứng với loại nút */
export function canvasKindToAssetType(kind: CanvasNodeKind): string {
  if (kind === 'video') return 'video'
  if (kind === 'audio') return 'audio'
  if (kind === 'text') return 'text'
  return 'image'
}

import { getActiveLocale } from '../../../i18n/detect'

export const CANVAS_NODE_KIND_LABELS: Record<string, Record<CanvasNodeKind, string>> = {
  vi: {
    character: 'Nhân vật',
    scene: 'Bối cảnh',
    video: 'Video',
    image: 'Hình ảnh',
    text: 'Văn bản',
    audio: 'Âm thanh',
  },
  en: {
    character: 'Character',
    scene: 'Scene',
    video: 'Video',
    image: 'Image',
    text: 'Text',
    audio: 'Audio',
  },
  zh: {
    character: '角色',
    scene: '场景',
    video: '视频',
    image: '图片',
    text: '文本',
    audio: '音频',
  },
}

export function getNodeKindLabel(kind: CanvasNodeKind, locale?: string): string {
  const loc = locale || getActiveLocale()
  return (CANVAS_NODE_KIND_LABELS[loc] || CANVAS_NODE_KIND_LABELS.vi)[kind] || kind
}

/** Tạo nhanh các tùy chọn mới ở giữa canvas trống (thứ tự phù hợp với bản phác thảo thiết kế) */
export const CANVAS_NODE_OPTIONS: CanvasNodeOption[] = [
  { id: 'character', get label() { return getNodeKindLabel('character') }, icon: UserRound },
  { id: 'scene', get label() { return getNodeKindLabel('scene') }, icon: Landmark },
  { id: 'video', get label() { return getNodeKindLabel('video') }, icon: PlaySquare },
  { id: 'image', get label() { return getNodeKindLabel('image') }, icon: ImageIcon },
  { id: 'text', get label() { return getNodeKindLabel('text') }, icon: Text },
  { id: 'audio', get label() { return getNodeKindLabel('audio') }, icon: AudioLines },
]

/** Thêm tùy chọn bảng điều khiển ở bên trái */
export const ADD_NODE_OPTIONS: CanvasNodeOption[] = [
  { id: 'character', get label() { return getNodeKindLabel('character') }, icon: UserRound },
  { id: 'scene', get label() { return getNodeKindLabel('scene') }, icon: Landmark },
  { id: 'text', get label() { return getNodeKindLabel('text') }, icon: Text },
  { id: 'image', get label() { return getNodeKindLabel('image') }, icon: ImageIcon },
  { id: 'video', get label() { return getNodeKindLabel('video') }, icon: PlaySquare },
  { id: 'audio', get label() { return getNodeKindLabel('audio') }, icon: AudioLines },
]

export const CANVAS_NODE_OPTION_BY_KIND = Object.fromEntries(
  CANVAS_NODE_OPTIONS.map((option) => [option.id, option]),
) as Record<CanvasNodeKind, CanvasNodeOption>

export const CANVAS_NODE_DEFAULT_LABEL_I18N: Record<string, Record<CanvasNodeKind, string>> = {
  vi: {
    character: 'Nhân vật mới',
    scene: 'Bối cảnh mới',
    video: 'Video mới',
    image: 'Hình ảnh mới',
    text: 'Văn bản',
    audio: 'Âm thanh mới',
  },
  en: {
    character: 'New Character',
    scene: 'New Scene',
    video: 'New Video',
    image: 'New Image',
    text: 'Text',
    audio: 'New Audio',
  },
  zh: {
    character: '新角色',
    scene: '新场景',
    video: '新视频',
    image: '新图片',
    text: '文本',
    audio: '新音频',
  },
}

export function getDefaultNodeLabel(kind: CanvasNodeKind, locale?: string): string {
  const loc = locale || getActiveLocale()
  return (CANVAS_NODE_DEFAULT_LABEL_I18N[loc] || CANVAS_NODE_DEFAULT_LABEL_I18N.vi)[kind] || kind
}

/** Các loại tên hiển thị mặc định: trả về theo ngôn ngữ hiện tại của user */
export const CANVAS_NODE_DEFAULT_LABEL: Record<CanvasNodeKind, string> = new Proxy(
  {} as Record<CanvasNodeKind, string>,
  {
    get(_target, prop: string) {
      return getDefaultNodeLabel(prop as CanvasNodeKind)
    },
  },
)

/** Kích thước thẻ nút (chiều rộng × chiều cao, dùng để căn giữa điểm thả) */
export const CANVAS_NODE_SIZE: Record<CanvasNodeKind, { width: number; height: number }> = {
  character: { width: 200, height: 280 },
  scene: { width: 200, height: 280 },
  video: { width: 160, height: 240 },
  image: { width: 160, height: 240 },
  text: { width: 280, height: 140 },
  audio: { width: 200, height: 100 },
}

/** Kích thước bước hấp phụ của lưới */
export const CANVAS_SNAP_GRID: [number, number] = [20, 20]

/** Tự động lưu lại mili giây chống rung */
export const CANVAS_AUTO_SAVE_MS = 2000

/** Độ sâu tối đa của ngăn xếp lịch sử */
export const MAX_CANVAS_HISTORY = 50
