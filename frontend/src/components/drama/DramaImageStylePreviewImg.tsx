/** Xem trước kiểu màn hình truyện tranh: nhấn jpg → png → phụ trợ tĩnh → svg để quay lại theo trình tự */
import { useMemo, useState } from 'react'
import { getDramaImageStylePreviewCandidates } from '../../lib/dramaImageStylePreviews'
import type { ImageStyleId } from '../../lib/dramaImageStyles'

type Props = {
  styleId: ImageStyleId
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

// Hiển thị bản xem trước kiểu với dự phòng đa cấp
export function DramaImageStylePreviewImg({
  styleId,
  alt = '',
  className,
  loading = 'lazy',
}: Props) {
  const candidates = useMemo(() => getDramaImageStylePreviewCandidates(styleId), [styleId])
  const [index, setIndex] = useState(0)

  return (
    <img
      key={`${styleId}-${index}`}
      src={candidates[Math.min(index, candidates.length - 1)]}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        setIndex((current) => (current < candidates.length - 1 ? current + 1 : current))
      }}
    />
  )
}
