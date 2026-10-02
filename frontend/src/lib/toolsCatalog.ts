import { Clapperboard, Image, Images, Play, ShoppingBag, Sparkles, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Messages } from '../i18n'

export type ToolId = 't2i' | 'i2i' | 'i2p' | 't2v' | 'v2v' | 'ecom'

export type ToolField = {
  key: string
  label: string
  kind: 'textarea' | 'upload' | 'chips'
  options?: string[]
  multiple?: boolean
  accept?: string
  placeholder?: string
}

export type ToolDef = {
  id: ToolId
  title: string
  desc: string
  soon: boolean
  icon: LucideIcon
  /** 左侧控件区文案提示 */
  panelHint: string
  fields: ToolField[]
  cta: string
}

export const TOOL_DEFS: ToolDef[] = [
  {
    id: 't2i',
    title: 'Tạo ảnh từ văn bản',
    desc: 'Dùng văn bản mô tả để tạo hình ảnh chất lượng cao',
    soon: false,
    icon: Image,
    panelHint: 'Mô tả hình ảnh bằng văn bản, chọn tỷ lệ khung hình rồi bấm tạo.',
    fields: [
      { key: 'prompt', label: 'Prompt', kind: 'textarea', placeholder: 'Mô tả chủ thể, bối cảnh, ánh sáng và phong cách…' },
      { key: 'negative', label: 'Prompt phủ định', kind: 'textarea', placeholder: 'Nội dung không muốn xuất hiện như chữ, watermark…' },
      { key: 'ratio', label: 'Tỷ lệ khung hình', kind: 'chips', options: ['1:1', '16:9', '9:16'] },
    ],
    cta: 'Tạo ảnh',
  },
  {
    id: 'i2i',
    title: 'Biến đổi ảnh (Image to Image)',
    desc: 'Tải ảnh tham chiếu lên để tạo biến thể phong cách đồng nhất',
    soon: false,
    icon: Sparkles,
    panelHint: 'Tải ảnh tham chiếu, mô tả phần muốn giữ lại hoặc thay đổi.',
    fields: [
      { key: 'ref', label: 'Ảnh tham chiếu', kind: 'upload', accept: 'image/*' },
      { key: 'prompt', label: 'Prompt', kind: 'textarea', placeholder: 'Giữ nguyên chủ thể, đổi sang cảnh đêm phong cách điện ảnh…' },
      { key: 'strength', label: 'Độ tương đồng', kind: 'chips', options: ['低', '中', '高'] },
    ],
    cta: 'Tạo biến thể',
  },
  {
    id: 'i2p',
    title: 'Tạo ảnh sản phẩm',
    desc: 'Tạo ảnh nền trắng và ảnh sản phẩm phối cảnh nhanh chóng',
    soon: false,
    icon: ShoppingBag,
    panelHint: 'Tải ảnh sản phẩm, chọn ảnh nền trắng, cảnh phối hoặc ảnh dài chi tiết.',
    fields: [
      { key: 'product', label: 'Ảnh sản phẩm', kind: 'upload', accept: 'image/*' },
      { key: 'mode', label: 'Loại đầu ra', kind: 'chips', options: ['白底图', '场景图', '详情长图'] },
      { key: 'prompt', label: 'Mô tả bổ sung (tùy chọn)', kind: 'textarea', placeholder: 'Chất liệu, cách sắp đặt, ngữ cảnh sử dụng…' },
    ],
    cta: 'Tạo ảnh sản phẩm',
  },
  {
    id: 't2v',
    title: 'Tạo video từ văn bản',
    desc: 'Tạo đoạn video ngắn từ kịch bản phân cảnh',
    soon: false,
    icon: Play,
    panelHint: 'Điền kịch bản để tạo khung hình mẫu, sau đó xuất video ngắn (khoảng 1–3 phút).',
    fields: [
      { key: 'script', label: 'Kịch bản video', kind: 'textarea', placeholder: 'Mô tả chuyển động máy quay, hành động chủ thể và không khí…' },
      { key: 'duration', label: 'Thời lượng', kind: 'chips', options: ['5s', '10s', '15s'] },
      { key: 'ratio', label: 'Tỷ lệ khung hình', kind: 'chips', options: ['16:9', '9:16'] },
    ],
    cta: 'Tạo video',
  },
  {
    id: 'v2v',
    title: 'Biến đổi video (Video to Video)',
    desc: 'Biến đổi phong cách và chuyển động cho video có sẵn',
    soon: false,
    icon: Clapperboard,
    panelHint: 'Tải video nguồn hoặc khung hình đầu, mô tả phong cách và cường độ chuyển động.',
    fields: [
      {
        key: 'source',
        label: 'Video nguồn / Khung hình đầu',
        kind: 'upload',
        accept: 'video/mp4,video/quicktime,video/webm,image/*',
      },
      { key: 'prompt', label: 'Mô tả biến đổi', kind: 'textarea', placeholder: 'Đổi sang cảnh đêm Cyberpunk, máy quay từ từ tiến tới…' },
      { key: 'motion', label: 'Cường độ chuyển động', kind: 'chips', options: ['弱', '中', '强'] },
    ],
    cta: 'Bắt đầu biến đổi',
  },
  {
    id: 'ecom',
    title: 'Công cụ thương mại điện tử',
    desc: 'Ghép ảnh chính, dàn trang chi tiết và áp phích bán hàng',
    soon: false,
    icon: Images,
    panelHint: 'Ghép ít nhất 2 ảnh; với áp phích bán hàng chỉ cần tải 1 ảnh sản phẩm.',
    fields: [
      { key: 'pack', label: 'Gói công cụ', kind: 'chips', options: ['主图拼接', '详情排版', '卖点海报'] },
      { key: 'images', label: 'Hình ảnh', kind: 'upload', multiple: true, accept: 'image/*' },
      { key: 'prompt', label: 'Mô tả điểm bán (áp phích tùy chọn)', kind: 'textarea', placeholder: 'Làm nổi bật chất liệu và công năng sử dụng…' },
    ],
    cta: 'Bắt đầu tạo',
  },
]

// 按 id 查找工具定义
export function getToolDef(id: string | undefined): ToolDef | undefined {
  return TOOL_DEFS.find((t) => t.id === id)
}

export const PRODUCT_ICONS = { drama: Clapperboard, kepu: Video }

// 芯片字段的默认选中项（取 options 第一项；值为中文枚举，给后端）
export function defaultToolChips(tool: ToolDef): Record<string, string> {
  const chips: Record<string, string> = {}
  for (const field of tool.fields) {
    if (field.kind === 'chips' && field.options?.[0]) chips[field.key] = field.options[0]
  }
  return chips
}

// 用当前语言覆盖工具标题、说明与字段文案（options 值保持中文给 API）
export function localizeToolDef(tool: ToolDef, m: Messages): ToolDef {
  const pack = m.tools.items[tool.id]
  return {
    ...tool,
    title: pack.title,
    desc: pack.desc,
    panelHint: pack.panelHint,
    cta: pack.cta,
    fields: tool.fields.map((field) => {
      const f = pack.fields[field.key as keyof typeof pack.fields] as
        | { label?: string; placeholder?: string }
        | undefined
      return {
        ...field,
        label: f?.label || field.label,
        placeholder: f?.placeholder || field.placeholder,
      }
    }),
  }
}

export function localizeToolDefs(m: Messages): ToolDef[] {
  return TOOL_DEFS.map((tool) => localizeToolDef(tool, m))
}

// 芯片展示文案；未知值原样返回
export function chipDisplayLabel(value: string, m: Messages): string {
  const chips = m.tools.chips as Record<string, string>
  return chips[value] || value
}
