/** Chọn phần trên cùng của nút: tải lên cục bộ + lựa chọn từ thư viện nội dung toàn cầu + tạo/nghe âm ký tự */
import { useCallback, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { AudioLines, FolderOpen, Loader2, Upload } from 'lucide-react'
import { dramaApi } from '../../../../api/drama'
import { CharacterVoicePreviewButton } from '../../../../components/drama/CharacterVoicePreviewButton'
import { generateAndBindCharacterVoice } from '../../../../lib/characterVoiceGenerate'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../../../lib/dramaVoiceBinding'
import { useCanvasStore } from '../CanvasStore'
import { CANVAS_UPLOADABLE_KINDS, type CanvasNodeKind } from '../canvasTypes'
import {
  canvasKindToLibraryTypes,
  GlobalAssetPickerModal,
} from '../../GlobalAssetPickerModal'
import { useI18n } from '../../../../i18n'

type CanvasNodeUploadBarProps = {
  nodeId: string
  kind: CanvasNodeKind
  /** Nút ký tự đã được gắn với tên âm thanh */
  voiceLabel?: string | null
  /** Nút ký tự đã được liên kết với địa chỉ thử âm sắc. */
  voiceUrl?: string | null
}

/** Hiển thị thanh thao tác thư viện tài sản và tải lên của nút đã chọn */
export function CanvasNodeUploadBar({
  nodeId,
  kind,
  voiceLabel,
  voiceUrl,
}: CanvasNodeUploadBarProps) {
  const { t } = useI18n()
  /*
   * đang tải lên Tải lên cục bộ
   * pickerMở cửa sổ bật lên thư viện nội dung
   * voiceLoading Tạo giọng nói hoặc lấy nội dung nhân vật
   */
  const {
    uploadNodeMedia,
    applyLibraryMediaToNode,
    syncNodeFromAsset,
    ensureNodeAsset,
    setErrorMessage,
    projectId,
  } = useCanvasStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)

  const stopFlowEvent = useCallback((event: MouseEvent) => {
    event.stopPropagation()
  }, [])

  if (!CANVAS_UPLOADABLE_KINDS.has(kind)) return null

  const isCharacter = kind === 'character'
  const hasVoice = Boolean(voiceUrl || voiceLabel)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage(t('drama.canvas.selectImageFile'))
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage(t('drama.canvas.imageSizeLimit'))
      return
    }

    setUploading(true)
    void uploadNodeMedia(nodeId, file)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : t('drama.canvas.uploadFailed')))
      .finally(() => setUploading(false))
  }

  // AI chỉ bằng một cú nhấp chuột sẽ tạo ra âm thanh và liên kết chúng với các nút ký tự
  async function handleGenerateVoice() {
    if (voiceLoading) return
    setVoiceLoading(true)
    try {
      const assetId = await ensureNodeAsset(nodeId)
      const list = await dramaApi.listAssets(projectId)
      const asset = list.find((a) => a.id === assetId)
      if (!asset) throw new Error(t('drama.canvas.charAssetNotFound'))
      const { character } = await generateAndBindCharacterVoice(projectId, asset)
      syncNodeFromAsset(nodeId, character)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('drama.canvas.voiceGenFailed'))
    } finally {
      setVoiceLoading(false)
    }
  }

  return (
    <>
      <div className="fc-node-toolbar nodrag nopan" onMouseDown={stopFlowEvent} onPointerDown={stopFlowEvent}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="fc-hidden-input"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="fc-toolbar-chip"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 size={14} className="fc-spin" /> : <Upload size={14} strokeWidth={1.8} />}
          {uploading ? t('common.uploading') : t('drama.canvas.uploadImage')}
        </button>
        <button
          type="button"
          className="fc-toolbar-chip"
          disabled={uploading}
          onClick={() => setPickerOpen(true)}
        >
          <FolderOpen size={14} strokeWidth={1.8} />
          {t('drama.canvas.pickFromLibrary')}
        </button>
        {DRAMA_VOICE_BINDING_ENABLED && isCharacter ? (
          hasVoice && voiceUrl ? (
            <CharacterVoicePreviewButton
              url={voiceUrl}
              label={voiceLabel || undefined}
              variant="chip"
              className="is-active"
              onError={setErrorMessage}
            />
          ) : (
            <button
              type="button"
              className="fc-toolbar-chip"
              disabled={uploading || voiceLoading}
              onClick={() => void handleGenerateVoice()}
              title={t('drama.canvas.genVoiceTooltip')}
            >
              {voiceLoading ? (
                <Loader2 size={14} className="fc-spin" />
              ) : (
                <AudioLines size={14} strokeWidth={1.8} />
              )}
              {voiceLoading ? t('drama.canvas.generating') : t('drama.canvas.genVoice')}
            </button>
          )
        ) : null}
      </div>

      <GlobalAssetPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        projectId={projectId}
        defaultTab="all"
        allowedTypes={canvasKindToLibraryTypes(kind)}
        title={t('drama.canvas.pickFromLibrary')}
        confirmLabel={t('common.confirm')}
        onPick={async (source) => {
          await applyLibraryMediaToNode(nodeId, source)
        }}
      />
    </>
  )
}
