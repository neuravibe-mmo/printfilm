import type { DramaAsset } from '../api/drama'

/** Loại nội dung dành riêng cho Canvas, không xuất hiện trong danh sách thư viện nội dung toàn cầu/dự án */
export const DRAMA_CANVAS_ONLY_ASSET_TYPES = new Set(['video', 'audio', 'text'])

/** Loại thư viện đã ngừng hoạt động (tài liệu lịch sử/không có tài liệu nào sẽ không còn được hiển thị) */
export const DRAMA_LIBRARY_DISABLED_TYPES = new Set(['material', 'none'])

// Xác định xem nội dung có xuất hiện trong thư viện nội dung hay không (nhân vật/cảnh/prop/âm thanh, v.v.)
export function isDramaLibraryAsset(asset: DramaAsset): boolean {
  const type = (asset.type || '').toLowerCase()
  if (DRAMA_CANVAS_ONLY_ASSET_TYPES.has(type)) return false
  if (DRAMA_LIBRARY_DISABLED_TYPES.has(type)) return false
  const assetType = (asset.asset_type || '').toLowerCase()
  if (assetType === 'video') return false
  return true
}

// Lọc các mục hiển thị trong thư viện nội dung
export function filterDramaLibraryAssets(assets: DramaAsset[]): DramaAsset[] {
  return assets.filter(isDramaLibraryAsset)
}
