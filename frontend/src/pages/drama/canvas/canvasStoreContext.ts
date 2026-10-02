/** Canvas store Bối cảnh: tệp độc lập để tránh Nhà cung cấp/móc mỗi người giữ một bản sao Bối cảnh sau khi cập nhật nóng CanvasStore */
import { createContext, useContext } from 'react'

export const CanvasStoreContext = createContext<unknown>(null)

/** Đọc trạng thái canvas; phải được gói trong CanvasStoreProvider */
export function useCanvasStore<T>(): T {
  const ctx = useContext(CanvasStoreContext)
  if (!ctx) {
    throw new Error('useCanvasStore must be used within CanvasStoreProvider')
  }
  return ctx as T
}
