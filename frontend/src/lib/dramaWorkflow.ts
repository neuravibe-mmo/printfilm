import type { DramaProject, DramaProjectListItem } from '../api/drama'
import type { TFunction } from '../i18n'

export type DramaWorkflow = 'script' | 'canvas'

const CANVAS_SOURCE_MARKER = '自由画布创作项目'
const CANVAS_TITLE_MARKER = '自由画布'

type WorkflowSource = {
  workflow?: string | null
  title?: string | null
  params?: Record<string, unknown> | null
  script?: { source?: string | null } | null
}

/** Phân tích quy trình làm việc của truyện tranh: canvas=free canvas; kịch bản=tập phác thảo */
export function resolveDramaWorkflow(item: WorkflowSource | null | undefined): DramaWorkflow {
  const raw = String(item?.workflow || item?.params?.workflow || '')
    .trim()
    .toLowerCase()
  if (raw === 'canvas' || raw === 'script') return raw

  const title = String(item?.title || '')
  if (title.includes(CANVAS_TITLE_MARKER)) return 'canvas'

  const source = String(item?.script?.source || '')
  if (source.includes(CANVAS_SOURCE_MARKER)) return 'canvas'

  return 'script'
}

/** Đây có phải là dự án canvas miễn phí không? */
export function isCanvasWorkflow(
  item: DramaProject | DramaProjectListItem | WorkflowSource | null | undefined,
): boolean {
  return resolveDramaWorkflow(item) === 'canvas'
}

/** Đường dẫn vào dự án: canvas chỉ vào canvas, bình thường vào bàn làm việc */
export function dramaProjectEntryPath(
  item: DramaProject | DramaProjectListItem | WorkflowSource,
): string {
  const id = Number((item as { id?: number }).id)
  if (!Number.isFinite(id) || id <= 0) return '/drama'
  if (isCanvasWorkflow(item)) return `/drama/projects/${id}/canvas`
  return `/drama/projects/${id}`
}

/** Bản sao meta thẻ danh sách (cần chuyển vào t() để hỗ trợ đa ngôn ngữ) */
export function formatDramaCardMeta(item: DramaProjectListItem, t: TFunction): string {
  if (isCanvasWorkflow(item)) {
    return `${t('drama.cardMeta.freeCanvas')} · ${t('drama.cardMeta.nodeAssets').replace('{n}', String(item.asset_count || 0))}`
  }
  if (item.has_script) {
    return `${t('drama.cardMeta.hasScript')} · ${t('drama.cardMeta.episodes').replace('{n}', String(item.episode_count || 0))} · ${t('drama.cardMeta.assets').replace('{n}', String(item.asset_count || 0))}`
  }
  return `${t('drama.cardMeta.draft')} · ${t('drama.cardMeta.pendingScript')} · ${t('drama.cardMeta.assets').replace('{n}', String(item.asset_count || 0))}`
}
