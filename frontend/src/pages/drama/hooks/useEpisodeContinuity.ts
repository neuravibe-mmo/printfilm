import { useMemo } from 'react'
import { useI18n } from '../../../i18n'
import type { DramaFragment } from '../../../api/drama'
import { readFragmentGenerationStatus, readFragmentVideoVersions } from '../dramaEpisodeEditUtils'

interface UseEpisodeContinuityParams {
  fragments: DramaFragment[]
  selectedIndex: number
  linkLastFrame: boolean
  generatingIds: Set<number>
}

export function useEpisodeContinuity({
  fragments,
  selectedIndex,
  linkLastFrame,
  generatingIds,
}: UseEpisodeContinuityParams) {
  const { t } = useI18n()

  // prevLastFrameUrl: Khung hình cuối của phân cảnh liền trước
  const prevLastFrameUrl = useMemo(() => {
    if (selectedIndex <= 0) return ''
    const prev = fragments[selectedIndex - 1]
    const params = prev?.params
    if (!params || typeof params !== 'object') return ''
    const rec = params as Record<string, unknown>
    const fromTop = rec.lastFrameUrl
    if (typeof fromTop === 'string' && fromTop.trim()) return fromTop.trim()
    const gen = rec.generation
    if (gen && typeof gen === 'object') {
      const fromGen = (gen as Record<string, unknown>).lastFrameUrl
      if (typeof fromGen === 'string' && fromGen.trim()) return fromGen.trim()
    }
    const versions = readFragmentVideoVersions(prev)
    for (const ver of versions) {
      if (ver.lastFrameUrl && ver.lastFrameUrl.trim()) return ver.lastFrameUrl.trim()
    }
    return ''
  }, [fragments, selectedIndex])

  // Lý do bị chặn tạo video nếu bật nối khung hình
  const continuityBlockedReason = useMemo(() => {
    if (!linkLastFrame || selectedIndex <= 0) return ''
    const prev = fragments[selectedIndex - 1]
    if (!prev) return t('drama.episodeEdit.noPrevFrame')
    if (prev.id && generatingIds.has(prev.id)) {
      return ''
    }
    const prevDone =
      Boolean((prev.video || '').trim()) ||
      readFragmentGenerationStatus(prev).status === 'done' ||
      Boolean(prevLastFrameUrl)
    if (!prevDone) {
      const prevNum = String(selectedIndex).padStart(2, '0')
      const currNum = String(selectedIndex + 1).padStart(2, '0')
      return t('drama.episodeEdit.waitPrevFrame')
        .replace('{prev}', prevNum)
        .replace('{curr}', currNum)
    }
    return ''
  }, [linkLastFrame, selectedIndex, fragments, generatingIds, prevLastFrameUrl, t])

  const continuityQueueHint = useMemo(() => {
    if (!linkLastFrame || selectedIndex <= 0) return ''
    const prev = fragments[selectedIndex - 1]
    if (!prev?.id || !generatingIds.has(prev.id)) return ''
    return t('drama.episodeEdit.prevQueueing')
  }, [linkLastFrame, selectedIndex, fragments, generatingIds, t])

  return {
    prevLastFrameUrl,
    continuityBlockedReason,
    continuityQueueHint,
  }
}
