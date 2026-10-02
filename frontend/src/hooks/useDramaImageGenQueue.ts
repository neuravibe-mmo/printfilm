/** Đăng ký xem ảnh chụp nhanh hàng đợi toàn cầu về phim truyền hình truyện tranh */
import { useSyncExternalStore } from 'react'
import {
  getDramaImageGenQueue,
  subscribeDramaImageGenQueue,
  type DramaImageGenJob,
} from '../lib/dramaImageGenQueue'

// Hook: Trả về danh sách hàng đợi tạo hình ảnh hiện tại
export function useDramaImageGenQueue(): DramaImageGenJob[] {
  return useSyncExternalStore(subscribeDramaImageGenQueue, getDramaImageGenQueue, getDramaImageGenQueue)
}

// Hook: Nội dung đang được xếp hàng hay được tạo
export function useDramaAssetImageBusy(assetId: number): boolean {
  const queue = useDramaImageGenQueue()
  return queue.some(
    (job) =>
      job.assetId === assetId && (job.status === 'queued' || job.status === 'running'),
  )
}
