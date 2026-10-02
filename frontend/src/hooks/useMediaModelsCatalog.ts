/** Kéo và lưu vào bộ đệm thư mục mô hình hình ảnh/video TokenFree giao diện người dùng. */
import { useEffect, useState } from 'react'
import { api, type MediaModelOption, type MediaModelsCatalog } from '../api'

let cached: MediaModelsCatalog | null = null
let inflight: Promise<MediaModelsCatalog> | null = null

function loadCatalog(): Promise<MediaModelsCatalog> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = api.mediaModels().then((cat) => {
      cached = cat
      return cat
    })
  }
  return inflight
}

export function useMediaModelsCatalog() {
  const [catalog, setCatalog] = useState<MediaModelsCatalog | null>(cached)

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then((cat) => {
        if (!cancelled) setCatalog(cat)
      })
      .catch(() => {
        if (!cancelled) setCatalog(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return catalog
}

/** Mô hình video trong thư mục hiện tại; nó trống khi thư mục chưa được truy cập. */
export function catalogVideoModels(catalog: MediaModelsCatalog | null): MediaModelOption[] {
  return catalog?.video_models ?? []
}

/** Mô hình ảnh trong thư mục hiện tại; nó trống khi thư mục chưa được truy cập. */
export function catalogImageModels(catalog: MediaModelsCatalog | null): MediaModelOption[] {
  return catalog?.image_models ?? []
}

/** Sử dụng nhãn thư mục để hiển thị tên model, nếu không tìm thấy thì id sẽ được hiển thị. */
export function catalogModelLabel(
  modelId: string | undefined | null,
  models: Array<{ id: string; label: string }>,
  fallback = '模型',
): string {
  const id = (modelId || '').trim()
  if (!id) return fallback
  return models.find((m) => m.id === id)?.label || id
}
