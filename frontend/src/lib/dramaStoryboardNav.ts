/** Lối vào cốt truyện: Bỏ qua các trang giữa tập và đi thẳng đến phần biên tập tập đầu tiên */
import { dramaApi, type DramaEpisode } from '../api/drama'

/** Nếu đã có tập rồi thì chúng ta sẽ chỉ đọc thôi; nếu không có tập nào chúng tôi sẽ cắt một lần theo kịch bản. Lực được sử dụng để thực hiện các vết cắt nặng. */
export async function loadDramaEpisodes(
  projectId: number,
  force = false,
): Promise<DramaEpisode[]> {
  if (!force) {
    const existing = await dramaApi.listEpisodes(projectId)
    if (existing.length) return existing
  }
  return dramaApi.seedEpisodes(projectId, force)
}

/** Hãy chắc chắn rằng nó đã được chia và quay lại đường dẫn chỉnh sửa của tập đầu tiên (hoặc tập được chỉ định); nếu không có tập thì quay lại đề cương */
export async function resolveStoryboardPath(
  projectId: number,
  preferredEpisodeId?: number | null,
): Promise<string> {
  const rows = await loadDramaEpisodes(projectId, false)
  if (preferredEpisodeId && rows.some((r) => r.id === preferredEpisodeId)) {
    return `/drama/projects/${projectId}/episodes/${preferredEpisodeId}`
  }
  const first = rows[0]
  if (first?.id) return `/drama/projects/${projectId}/episodes/${first.id}`
  return `/drama/projects/${projectId}`
}
