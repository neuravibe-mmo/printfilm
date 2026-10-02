/** Nhãn thông số storyboard: Ưu tiên hiển thị pixel thực trong phim, phát hiện siêu dữ liệu video khi Legacy không có meta */
import { useEffect, useState } from 'react'
import {
  formatProjectOutputLabel,
  inferAspectRatioFromPixels,
  pickDramaResolution,
  readFragmentOutputLabel,
  readFragmentVideoDimensions,
} from '../../lib/dramaProjectOutputSettings'
import { probeVideoDimensionsFromUrl } from '../../lib/dramaVideoDimensions'

type DramaFragmentClipSpecProps = {
  fragmentParams: Record<string, unknown>
  episodeParams: Record<string, unknown>
  projectParams: Record<string, unknown>
  videoUrl?: string
}

// Kết xuất khung của một bảng phân cảnh · Thẻ rõ ràng
export function DramaFragmentClipSpec({
  fragmentParams,
  episodeParams,
  projectParams,
  videoUrl = '',
}: DramaFragmentClipSpecProps) {
  const stored = readFragmentVideoDimensions(fragmentParams)
  const [probed, setProbed] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (stored || !videoUrl.trim()) {
      setProbed(null)
      return
    }
    let cancelled = false
    void probeVideoDimensionsFromUrl(videoUrl).then((dims) => {
      if (!cancelled) setProbed(dims)
    })
    return () => {
      cancelled = true
    }
  }, [stored, videoUrl])

  const dims = stored ?? probed
  const resolution = pickDramaResolution(fragmentParams, episodeParams, projectParams)
  const label = dims
    ? formatProjectOutputLabel(inferAspectRatioFromPixels(dims.w, dims.h), resolution)
    : readFragmentOutputLabel(fragmentParams, episodeParams, projectParams)

  return <span className="drama-ep-clip-spec">{label}</span>
}
