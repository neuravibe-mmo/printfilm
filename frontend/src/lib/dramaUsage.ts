import type { DramaProjectUsageStats } from '../api/drama'

/** 空用量占位，避免列表未返回 usage 时崩溃 */
export const EMPTY_DRAMA_USAGE: DramaProjectUsageStats = {
  charge_fen: 0,
  charge_yuan: 0,
  cost_fen: 0,
  cost_yuan: 0,
  tokens: 0,
  calls: 0,
  image_gens: 0,
  video_gens: 0,
}

import { getActiveLocale } from '../i18n/detect'

export function formatCredits(amount: number | undefined | null, locale?: string): string {
  const loc = locale || getActiveLocale()
  const n = Number(amount) || 0
  if (loc === 'vi') return `${n.toFixed(2)} Xu`
  if (loc === 'en') return `${n.toFixed(2)} Credits`
  return `¥${n.toFixed(2)}`
}

export function formatCreditsFen(fen: number | undefined | null, locale?: string): string {
  return formatCredits((Number(fen) || 0) / 100, locale)
}

/** 格式化漫剧费用展示 */
export function formatDramaChargeYuan(yuan: number | undefined | null, locale?: string): string {
  return formatCredits(yuan, locale)
}

/** 列表/工作台短文案：费用 · 生图 · 生视频 · 调用 */
export function formatDramaUsageBrief(usage?: DramaProjectUsageStats | null, locale?: string): string {
  const loc = locale || getActiveLocale()
  const u = usage || EMPTY_DRAMA_USAGE
  const calls = u.calls > 0 ? (loc === 'vi' ? ` · ${u.calls} lượt gọi` : loc === 'en' ? ` · ${u.calls} calls` : ` · 调用 ${u.calls}`) : ''
  const imgLabel = loc === 'vi' ? 'Sinh ảnh' : loc === 'en' ? 'Images' : '生图'
  const videoLabel = loc === 'vi' ? 'Sinh video' : loc === 'en' ? 'Videos' : '生视频'
  return `${formatDramaChargeYuan(u.charge_yuan, loc)} · ${imgLabel} ${u.image_gens} · ${videoLabel} ${u.video_gens}${calls}`
}
