import { useMemo, useRef, useState } from 'react'
import { dramaApi, type DramaAsset, type DramaProject } from '../../../api/drama'

interface UseDramaAssetFlowUploadParams {
  projectId: number
  project: DramaProject | null
  assets: DramaAsset[]
  setAssets: React.Dispatch<React.SetStateAction<DramaAsset[]>>
  locale: string
  onError: (msg: string) => void
}

export function useDramaAssetFlowUpload({
  project,
  assets,
  setAssets,
  locale,
  onError,
}: UseDramaAssetFlowUploadParams) {
  // Google Flow upload states
  const [flowUploading, setFlowUploading] = useState(false)
  const [flowUploadProgress, setFlowUploadProgress] = useState<{
    current: number
    total: number
    assetName: string
  } | null>(null)
  const [flowUploadingAssetId, setFlowUploadingAssetId] = useState<number | null>(null)
  const [flowUploadErrors, setFlowUploadErrors] = useState<Record<number, string>>({})
  const [copiedAssetId, setCopiedAssetId] = useState<number | null>(null)
  const flowCancelRef = useRef(false)

  // Danh sách các tài sản có hình ảnh để upload
  const uploadableImageAssets = useMemo(() => {
    return assets.filter((a) => (a.cover || a.url) && a.type !== 'voice')
  }, [assets])

  // Số lượng tài sản đã có mã Flow Media ID
  const uploadedFlowCount = useMemo(() => {
    return uploadableImageAssets.filter((a) => Boolean(a.flow_media_id || (a.params as any)?.flow_media_id)).length
  }, [uploadableImageAssets])

  async function handleCopyMediaId(e: React.MouseEvent, assetId: number, mediaId: string) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(mediaId)
      setCopiedAssetId(assetId)
      setTimeout(() => setCopiedAssetId((cur) => (cur === assetId ? null : cur)), 2000)
    } catch {
      // fallback
    }
  }

  async function handleUploadSingleAssetToFlow(asset: DramaAsset) {
    if (!asset.cover && !asset.url) {
      onError('Tài sản chưa có hình ảnh để upload')
      return
    }

    const hasExistingMedia = Boolean(asset.flow_media_id || (asset.params as any)?.flow_media_id)
    if (hasExistingMedia) {
      const confirmMsg =
        locale === 'vi'
          ? `Tài sản "${asset.name || 'này'}" đã có Flow ID. Bạn có chắc chắn muốn upload lại lên Google Flow không?`
          : locale === 'en'
            ? `Asset "${asset.name || 'this'}" already has a Flow ID. Are you sure you want to re-upload it to Google Flow?`
            : `素材「${asset.name || '此素材'}」已有 Flow ID。确定要重新上传到 Google Flow 吗？`
      const ok = window.confirm(confirmMsg)
      if (!ok) return
    }

    setFlowUploadingAssetId(asset.id)
    setFlowUploadErrors((prev) => {
      const copy = { ...prev }
      delete copy[asset.id]
      return copy
    })
    try {
      const flowPid = project?.flow_project_id || undefined
      const res = await dramaApi.uploadAssetToFlow(asset.id, { flow_project_id: flowPid })
      if (res.ok && res.media_id) {
        setAssets((prev) =>
          (prev ?? []).map((a) =>
            a.id === asset.id
              ? { ...a, flow_media_id: res.media_id, params: { ...(a.params || {}), flow_media_id: res.media_id } }
              : a,
          ),
        )
      }
    } catch (err: any) {
      const msg = err.message || 'Lỗi upload ảnh lên Google Flow'
      onError(msg)
      setFlowUploadErrors((prev) => ({ ...prev, [asset.id]: msg }))
    } finally {
      setFlowUploadingAssetId(null)
    }
  }

  async function handleBatchUploadFlowAssets() {
    if (uploadableImageAssets.length === 0) {
      onError('Chưa có tài sản nào có hình ảnh để upload lên Google Flow')
      return
    }

    const unuploaded = uploadableImageAssets.filter((a) => !a.flow_media_id && !(a.params as any)?.flow_media_id)
    let targets = unuploaded
    if (targets.length === 0) {
      const ok = window.confirm(
        `Tất cả ${uploadableImageAssets.length} tài sản đã có mã Flow Media ID. Bạn có muốn upload và cập nhật lại toàn bộ không?`,
      )
      if (!ok) return
      targets = uploadableImageAssets
    }

    flowCancelRef.current = false
    setFlowUploading(true)

    for (let i = 0; i < targets.length; i++) {
      if (flowCancelRef.current) break
      const asset = targets[i]
      setFlowUploadProgress({
        current: i + 1,
        total: targets.length,
        assetName: asset.name || `Tài sản #${asset.id}`,
      })
      setFlowUploadingAssetId(asset.id)

      try {
        const flowPid = project?.flow_project_id || undefined
        const res = await dramaApi.uploadAssetToFlow(asset.id, { flow_project_id: flowPid })
        if (res.ok && res.media_id) {
          setAssets((prev) =>
            (prev ?? []).map((a) =>
              a.id === asset.id
                ? { ...a, flow_media_id: res.media_id, params: { ...(a.params || {}), flow_media_id: res.media_id } }
                : a,
            ),
          )
        }
      } catch (err: any) {
        const msg = err.message || 'Lỗi upload'
        setFlowUploadErrors((prev) => ({ ...prev, [asset.id]: msg }))
      }
    }

    setFlowUploading(false)
    setFlowUploadingAssetId(null)
    setFlowUploadProgress(null)
  }

  function handleCancelFlowUpload() {
    flowCancelRef.current = true
  }

  return {
    uploadableImageAssets,
    uploadedFlowCount,
    flowUploading,
    flowUploadProgress,
    flowUploadingAssetId,
    flowUploadErrors,
    copiedAssetId,
    handleCopyMediaId,
    handleUploadSingleAssetToFlow,
    handleBatchUploadFlowAssets,
    handleCancelFlowUpload,
  }
}

