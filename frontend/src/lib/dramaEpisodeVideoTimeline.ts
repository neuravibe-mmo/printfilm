/** Xem trước video tập: Công cụ dòng thời gian toàn cầu xuyên câu chuyện */
import type { DramaFragment } from '../api/drama'

// DramaEpisodeVideoTimelineSegment Phần cốt truyện trên dòng thời gian của tập
export type DramaEpisodeVideoTimelineSegment = {
  fragmentId: number
  index: number
  durationSec: number
  startSec: number
  endSec: number
  hasVideo: boolean
}

// Tổng số @duration giây từ văn bản bảng phân cảnh
function sumFragmentContentDuration(content: string): number {
  const re = /@duration:(\d+)/g
  let total = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content || ''))) {
    const sec = Number(m[1])
    if (sec > 0) total += sec
  }
  return total
}

// Phân tích thời lượng của storyboard trên dòng thời gian (giây)
function resolveEpisodeFragmentTimelineDuration(fragment: DramaFragment): number {
  const fromTags = sumFragmentContentDuration(fragment.content)
  if (fromTags > 0) return Math.min(15, Math.max(4, fromTags))
  const fallback = fragment.duration_sec && fragment.duration_sec > 0 ? fragment.duration_sec : 8
  return Math.min(15, Math.max(4, fallback))
}

// Xây dựng các phân đoạn dòng thời gian dựa trên tất cả các cảnh quay của tập
export function buildEpisodeVideoTimelineSegments(
  fragments: DramaFragment[],
): DramaEpisodeVideoTimelineSegment[] {
  let cursor = 0

  return fragments.flatMap((fragment, index) => {
    const durationSec = resolveEpisodeFragmentTimelineDuration(fragment)

    if (durationSec <= 0) {
      return []
    }

    const startSec = cursor
    const endSec = cursor + durationSec

    cursor = endSec

    return [
      {
        fragmentId: fragment.id,
        index,
        durationSec,
        startSec,
        endSec,
        hasVideo: Boolean(fragment.video),
      },
    ]
  })
}

// Tính tổng thời lượng của dòng thời gian của tập
export function resolveEpisodeVideoTimelineTotalDuration(
  segments: DramaEpisodeVideoTimelineSegment[],
): number {
  if (segments.length === 0) {
    return 0
  }

  return segments[segments.length - 1]?.endSec ?? 0
}

// Ánh xạ thời gian phát lại trong bảng phân cảnh tới vị trí dòng thời gian chung
export function resolveGlobalTimeFromFragmentPlayback(
  segment: DramaEpisodeVideoTimelineSegment,
  localTimeSec: number,
  localDurationSec: number,
): number {
  if (localDurationSec <= 0) {
    return segment.startSec
  }

  const ratio = Math.min(1, Math.max(0, localTimeSec / localDurationSec))

  return segment.startSec + ratio * segment.durationSec
}

// Ánh xạ vị trí dòng thời gian toàn cầu tới thời gian phát lại trong bảng phân cảnh
export function resolveFragmentPlaybackFromGlobalTime(
  segments: DramaEpisodeVideoTimelineSegment[],
  globalTimeSec: number,
): {
  segment: DramaEpisodeVideoTimelineSegment
  localTimeSec: number
} | null {
  if (segments.length === 0) {
    return null
  }

  const clampedGlobalTime = Math.min(
    Math.max(0, globalTimeSec),
    resolveEpisodeVideoTimelineTotalDuration(segments),
  )

  const segment =
    segments.find(
      (item) => clampedGlobalTime >= item.startSec && clampedGlobalTime < item.endSec,
    ) ?? segments[segments.length - 1]

  if (!segment) {
    return null
  }

  const localTimeSec = Math.min(
    segment.durationSec,
    Math.max(0, clampedGlobalTime - segment.startSec),
  )

  return {
    segment,
    localTimeSec,
  }
}

// Phân tích chỉ mục bảng phân cảnh nơi đặt thời gian toàn cầu hiện tại
export function resolveEpisodeVideoTimelineSegmentIndex(
  segments: DramaEpisodeVideoTimelineSegment[],
  globalTimeSec: number,
): number {
  if (segments.length === 0) {
    return 0
  }

  const matched = segments.find(
    (segment) => globalTimeSec >= segment.startSec && globalTimeSec < segment.endSec,
  )

  return matched?.index ?? segments[segments.length - 1]?.index ?? 0
}

// Tính tỷ lệ được phát (0–1) trong một khoảng thời gian của bảng phân cảnh
export function resolveEpisodeTimelineSegmentFillRatio(
  segment: DramaEpisodeVideoTimelineSegment,
  globalTimeSec: number,
): number {
  if (globalTimeSec >= segment.endSec) {
    return 1
  }

  if (globalTimeSec <= segment.startSec) {
    return 0
  }

  const span = segment.endSec - segment.startSec

  if (span <= 0) {
    return 0
  }

  return (globalTimeSec - segment.startSec) / span
}

// Định dạng giây dưới dạng mm:ss
export function formatVideoTimelineClock(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainSeconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`
}

// Ánh xạ tỷ lệ nhấp vào thanh tiến trình với thời gian phát toàn cầu
export function resolveVideoTimelineSeekTime(ratio: number, totalDurationSec: number): number {
  if (totalDurationSec <= 0) {
    return 0
  }

  const clampedRatio = Math.min(1, Math.max(0, ratio))

  return clampedRatio * totalDurationSec
}

// Tìm ID bảng phân cảnh của video có thể phát tiếp theo
export function resolveNextPlayableFragmentId(
  segments: DramaEpisodeVideoTimelineSegment[],
  currentFragmentId: number,
): number | null {
  const currentIndex = segments.findIndex((segment) => segment.fragmentId === currentFragmentId)

  if (currentIndex < 0) {
    return null
  }

  for (let index = currentIndex + 1; index < segments.length; index += 1) {
    const segment = segments[index]

    if (segment?.hasVideo) {
      return segment.fragmentId
    }
  }

  return null
}
