import { useEffect, useRef, useState } from 'react'
import { Download, ChevronDown, Folder, Archive, Loader2 } from 'lucide-react'
import { resolveDramaAssetPreviewUrl, getDramaApiBase, type DramaAsset } from '../../api/drama'
import { dialog } from '../../lib/dialog'
import { getAssetTypeSlug, toVietnameseSlug } from './EpisodeEditCurlModal'

export interface DramaAssetDownloadButtonProps {
  assets: DramaAsset[]
  projectTitle?: string
  disabled?: boolean
}

/** Tạo tên file download chuẩn cú pháp: <ID>_<LoaiAsset>_<TenVietLienKhongDau>.<ext> */
export function getAssetDownloadFileName(asset: DramaAsset, mimeType?: string): string {
  const typeSlug = getAssetTypeSlug(asset.type)
  const nameSlug = asset.name ? toVietnameseSlug(asset.name) : `Asset${asset.id}`
  let ext = 'jpg'
  if (mimeType) {
    if (mimeType.includes('png')) ext = 'png'
    else if (mimeType.includes('webp')) ext = 'webp'
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg'
  } else {
    const url = asset.cover || asset.url || ''
    if (url.toLowerCase().endsWith('.png')) ext = 'png'
    else if (url.toLowerCase().endsWith('.webp')) ext = 'webp'
  }
  return `${asset.id}_${typeSlug}_${nameSlug}.${ext}`
}

/**
 * Nút tải tài sản dự án:
 * - Hỗ trợ lưu trực tiếp vào thư mục tự chọn (File System Access API)
 * - Tải trực tiếp tuần tự từng file vào Downloads
 * - Xuất file ZIP toàn bộ ảnh
 */
export function DramaAssetDownloadButton({
  assets,
  projectTitle,
  disabled = false,
}: DramaAssetDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number
    total: number
    fileName: string
  } | null>(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const downloadCancelRef = useRef(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)

  // Danh sách các tài sản có hình ảnh hợp lệ để tải về
  const targets = assets.filter((a) => (a.cover || a.url) && a.type !== 'voice')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false)
      }
    }
    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadMenu])

  function handleCancelDownload() {
    downloadCancelRef.current = true
  }

  /** Phương án 1: Lưu trực tiếp vào thư mục do người dùng chọn trên máy tính */
  async function handleDownloadAssetsToFolder() {
    setShowDownloadMenu(false)
    if (targets.length === 0) {
      await dialog.alert({
        title: 'Thông báo',
        message: 'Không có tài sản nào có hình ảnh để tải về.',
      })
      return
    }

    const hasDirectoryPicker = typeof (window as any).showDirectoryPicker === 'function'
    if (!hasDirectoryPicker) {
      const chooseDirect = await dialog.confirm({
        title: 'Trình duyệt không hỗ trợ chọn thư mục',
        message:
          'Trình duyệt của bạn không hỗ trợ tính năng chọn thư mục lưu (File System Access API). Bạn có muốn tải trực tiếp từng file ảnh về máy tính không?',
        confirmText: 'Tải trực tiếp từng file',
        cancelText: 'Hủy',
      })
      if (chooseDirect) {
        await handleDownloadDirectSequential()
      }
      return
    }

    let dirHandle: any = null
    try {
      dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads',
      })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Người dùng bấm Hủy / Đóng hộp thoại
        return
      }

      const errMsg = String(err?.message || '').toLowerCase()
      const isRestricted =
        err.name === 'SecurityError' ||
        err.name === 'NotAllowedError' ||
        errMsg.includes('not allowed') ||
        errMsg.includes('restricted')

      if (isRestricted) {
        const chooseDirect = await dialog.confirm({
          title: 'Thư mục bị giới hạn bảo mật',
          message:
            'Trình duyệt Chrome không cho phép lưu trực tiếp vào thư mục gốc hệ thống (như Downloads, Desktop, Documents).\n\n' +
            '👉 Bạn hãy tạo 1 thư mục con bên trong Downloads (ví dụ: tạo folder "AnhPhim") rồi chọn folder đó.\n\n' +
            'Hoặc bấm "Tải trực tiếp" để tải ngay từng file ảnh về máy tính.',
          confirmText: 'Tải trực tiếp từng file',
          cancelText: 'Chọn lại thư mục con',
        })
        if (chooseDirect) {
          await handleDownloadDirectSequential()
        } else {
          setTimeout(() => void handleDownloadAssetsToFolder(), 200)
        }
        return
      }

      console.warn('showDirectoryPicker error:', err)
      const chooseDirect = await dialog.confirm({
        title: 'Không thể mở hộp thoại chọn thư mục',
        message: `${err.message || 'Lỗi mở thư mục'}. Bạn có muốn chuyển sang tải trực tiếp từng file ảnh về máy tính không?`,
        confirmText: 'Tải trực tiếp',
        cancelText: 'Đóng',
      })
      if (chooseDirect) {
        await handleDownloadDirectSequential()
      }
      return
    }

    if (!dirHandle) return

    downloadCancelRef.current = false
    setIsDownloading(true)
    let successCount = 0
    const errors: string[] = []

    try {
      for (let i = 0; i < targets.length; i++) {
        if (downloadCancelRef.current) break
        const asset = targets[i]
        let mediaUrl = resolveDramaAssetPreviewUrl(asset)
        if (!mediaUrl) continue

        if (mediaUrl.startsWith('/')) {
          const base = getDramaApiBase() || 'http://localhost:8001'
          mediaUrl = `${base}${mediaUrl}`
        }

        const sep = mediaUrl.includes('?') ? '&' : '?'
        const fetchUrl = `${mediaUrl}${sep}_dl=${Date.now()}`

        let blob: Blob
        try {
          const resp = await fetch(fetchUrl, { mode: 'cors', cache: 'no-cache' })
          if (!resp.ok) {
            errors.push(`Ảnh #${asset.id} (${asset.name}): Server phản hồi lỗi HTTP ${resp.status}`)
            continue
          }
          blob = await resp.blob()
        } catch (fetchErr: any) {
          console.error(`[Download] Không thể tải ảnh #${asset.id}:`, fetchErr)
          errors.push(
            `Ảnh #${asset.id} (${asset.name}): Lỗi kết nối tải ảnh (${fetchErr.message || 'Failed to fetch'})`,
          )
          continue
        }

        const fileName = getAssetDownloadFileName(asset, blob.type)
        setDownloadProgress({
          current: i + 1,
          total: targets.length,
          fileName,
        })

        try {
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
          successCount++
          console.log(`[Download] Đã lưu file: ${fileName} (${blob.size} bytes)`)
        } catch (fileErr: any) {
          console.error(`[Download] Lỗi khi lưu file cho asset #${asset.id} (${asset.name}):`, fileErr)
          errors.push(`Ảnh #${asset.id} (${asset.name || 'Tài sản'}): Lỗi ghi ổ đĩa (${fileErr.message || 'Lỗi ghi'})`)
        }
      }

      if (!downloadCancelRef.current) {
        if (successCount > 0) {
          const partialNotice =
            errors.length > 0 ? `\n\n(Lưu ý: Có ${errors.length} file gặp sự cố: ${errors.join(', ')})` : ''
          await dialog.alert({
            title: 'Tải thành công',
            message: `Đã lưu thành công ${successCount}/${targets.length} file tài sản vào thư mục "${dirHandle.name || 'đã chọn'}" trên máy tính.${partialNotice}`,
            tone: 'success',
          })
        } else if (errors.length > 0) {
          const switchDirect = await dialog.confirm({
            title: 'Không thể hoàn tất tải về',
            message: `${errors[0]}.\n\nBạn có muốn chuyển sang tải trực tiếp từng file về máy tính không?`,
            confirmText: 'Tải trực tiếp',
            cancelText: 'Đóng',
            tone: 'danger',
          })
          if (switchDirect) {
            await handleDownloadDirectSequential()
          }
        }
      }
    } catch (err: any) {
      console.error('[Download error]', err)
      await dialog.alert({
        title: 'Lỗi tải ảnh',
        message: err.message || 'Không thể lưu file vào thư mục đã chọn. Vui lòng thử lại.',
        tone: 'danger',
      })
    } finally {
      setIsDownloading(false)
      setDownloadProgress(null)
    }
  }

  /** Phương án 2: Tải trực tiếp tuần tự từng file vào thư mục Downloads của trình duyệt */
  async function handleDownloadDirectSequential() {
    setShowDownloadMenu(false)
    if (targets.length === 0) return

    downloadCancelRef.current = false
    setIsDownloading(true)
    let count = 0

    try {
      for (let i = 0; i < targets.length; i++) {
        if (downloadCancelRef.current) break
        const asset = targets[i]
        let mediaUrl = resolveDramaAssetPreviewUrl(asset)
        if (!mediaUrl) continue

        if (mediaUrl.startsWith('/')) {
          const base = getDramaApiBase() || 'http://localhost:8001'
          mediaUrl = `${base}${mediaUrl}`
        }

        const sep = mediaUrl.includes('?') ? '&' : '?'
        const fetchUrl = `${mediaUrl}${sep}_dl=${Date.now()}`

        try {
          const resp = await fetch(fetchUrl, { mode: 'cors', cache: 'no-cache' })
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const blob = await resp.blob()
          const fileName = getAssetDownloadFileName(asset, blob.type)

          setDownloadProgress({
            current: i + 1,
            total: targets.length,
            fileName,
          })

          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
          count++

          // Tránh bị browser chặn vì trigger download quá nhanh liên tục
          await new Promise((resolve) => setTimeout(resolve, 300))
        } catch (fetchErr: any) {
          console.warn(`[Direct Download fallback] asset #${asset.id}:`, fetchErr)
          const fileName = getAssetDownloadFileName(asset)
          const a = document.createElement('a')
          a.href = mediaUrl
          a.download = fileName
          a.target = '_blank'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          count++
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      if (!downloadCancelRef.current && count > 0) {
        await dialog.alert({
          title: 'Tải thành công',
          message: `Đã tải về máy tính ${count}/${targets.length} ảnh tài sản với định dạng tên chuẩn theo mẫu <ID>_<LoaiAsset>_<TenVietLienKhongDau>.`,
          tone: 'success',
        })
      }
    } finally {
      setIsDownloading(false)
      setDownloadProgress(null)
    }
  }

  /** Phương án 3: Đóng gói toàn bộ ảnh thành 1 file ZIP duy nhất */
  async function handleDownloadAsZip() {
    setShowDownloadMenu(false)
    if (targets.length === 0) return

    downloadCancelRef.current = false
    setIsDownloading(true)
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    let zipSuccessCount = 0

    try {
      for (let i = 0; i < targets.length; i++) {
        if (downloadCancelRef.current) break
        const asset = targets[i]
        let mediaUrl = resolveDramaAssetPreviewUrl(asset)
        if (!mediaUrl) continue

        if (mediaUrl.startsWith('/')) {
          const base = getDramaApiBase() || 'http://localhost:8001'
          mediaUrl = `${base}${mediaUrl}`
        }

        try {
          const resp = await fetch(mediaUrl)
          if (!resp.ok) continue
          const blob = await resp.blob()
          const fileName = getAssetDownloadFileName(asset, blob.type)

          setDownloadProgress({
            current: i + 1,
            total: targets.length,
            fileName,
          })

          zip.file(fileName, blob)
          zipSuccessCount++
        } catch (fetchErr) {
          console.error(`[Download ZIP] Lỗi tải ảnh asset ${asset.id}:`, fetchErr)
        }
      }

      if (!downloadCancelRef.current && zipSuccessCount > 0) {
        const content = await zip.generateAsync({ type: 'blob' })
        const zipUrl = URL.createObjectURL(content)
        const a = document.createElement('a')
        a.href = zipUrl
        a.download = `${projectTitle || 'assets'}_images.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(zipUrl)

        await dialog.alert({
          title: 'Đã xuất file ZIP',
          message: `Đã nén và tải về ${zipSuccessCount} ảnh tài sản dạng file ZIP.`,
          tone: 'success',
        })
      }
    } finally {
      setIsDownloading(false)
      setDownloadProgress(null)
    }
  }

  if (isDownloading) {
    return (
      <div className="drama-asset-download-progress-bar-container">
        <Loader2 size={15} className="pf-spin" />
        <span>
          Đang tải {downloadProgress?.current}/{downloadProgress?.total}
          {downloadProgress?.fileName ? ` (${downloadProgress.fileName})` : ''}...
        </span>
        <button
          type="button"
          onClick={handleCancelDownload}
          className="drama-asset-download-cancel-btn"
        >
          Dừng
        </button>
      </div>
    )
  }

  return (
    <div ref={downloadMenuRef} className="drama-asset-download-wrap">
      <button
        type="button"
        className="pf-btn drama-asset-download-main-btn"
        disabled={disabled || targets.length === 0}
        onClick={() => void handleDownloadAssetsToFolder()}
        title={`Mở Finder / File Explorer để chọn thư mục lưu và tải toàn bộ ${targets.length} file tài sản theo cú pháp <ID>_<LoaiAsset>_<TenVietLienKhongDau>.<ext>`}
      >
        <Download size={16} />
        <span>Download ({targets.length})</span>
      </button>
      <button
        type="button"
        className="pf-btn drama-asset-download-arrow-btn"
        disabled={disabled || targets.length === 0}
        onClick={() => setShowDownloadMenu((prev) => !prev)}
        title="Tùy chọn tải về"
      >
        <ChevronDown size={14} />
      </button>

      {showDownloadMenu && (
        <div className="drama-asset-download-menu">
          <button
            type="button"
            className="drama-asset-download-menu-item"
            onClick={() => void handleDownloadAssetsToFolder()}
          >
            <Folder size={16} className="drama-asset-download-icon is-folder" />
            <div>
              <div className="drama-asset-download-item-title">Lưu vào thư mục tự chọn</div>
              <div className="drama-asset-download-item-desc">
                Mở Finder / Explorer để chọn thư mục lưu trên máy
              </div>
            </div>
          </button>

          <button
            type="button"
            className="drama-asset-download-menu-item"
            onClick={() => void handleDownloadDirectSequential()}
          >
            <Download size={16} className="drama-asset-download-icon is-direct" />
            <div>
              <div className="drama-asset-download-item-title">Tải trực tiếp từng file</div>
              <div className="drama-asset-download-item-desc">
                Lưu thẳng từng file ảnh vào thư mục Downloads của máy
              </div>
            </div>
          </button>

          <button
            type="button"
            className="drama-asset-download-menu-item"
            onClick={() => void handleDownloadAsZip()}
          >
            <Archive size={16} className="drama-asset-download-icon is-zip" />
            <div>
              <div className="drama-asset-download-item-title">Tải file nén (.ZIP)</div>
              <div className="drama-asset-download-item-desc">
                Gói toàn bộ {targets.length} ảnh vào 1 file zip duy nhất
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

