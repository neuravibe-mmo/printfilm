import React, { useState, useRef, useEffect } from 'react'
import {
  CheckCheck,
  Copy,
  AlertCircle,
  Loader2,
  UploadCloud,
  Terminal,
  ChevronDown,
  Mic,
  Trash2,
} from 'lucide-react'
import { resolveDramaAssetPreviewUrl, type DramaAsset } from '../../api/drama'
import { readAssetVoiceBinding } from './CharacterVoiceBindModal'
import { CharacterVoicePreviewButton } from '../../components/drama/CharacterVoicePreviewButton'
import { formatVoiceLabel } from './CharacterVoiceBindModal'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import { useI18n } from '../../i18n'
import type { DramaAssetCurlTab } from './DramaAssetDetailModal'

export interface DramaVisualAssetCardProps {
  asset: DramaAsset
  busy: boolean
  batchBusy: boolean
  batchVoiceBusy: boolean
  characterVoiceBusy: boolean
  flowUploading: boolean
  flowUploadingAssetId: number | null
  flowUploadError?: string
  copiedAssetId: number | null
  genButtonLabel: string
  onDetail: (asset: DramaAsset, tab?: DramaAssetCurlTab) => void
  onLightbox: (data: { src: string; alt: string }) => void
  onGenerate: (asset: DramaAsset) => void
  onGenerateVoice?: (asset: DramaAsset) => void
  onUploadFlow: (asset: DramaAsset) => void
  onCopyMediaId: (e: React.MouseEvent, assetId: number, mediaId: string) => void
  onDelete: (asset: DramaAsset) => void
  onError: (message: string) => void
}

/**
 * Thẻ hiển thị tài sản hình ảnh (Nhân vật, Bối cảnh, Đạo cụ)
 * Hỗ trợ tạo ảnh, xem phóng to, quản lý mã Google Flow, gán giọng nói và xóa tài sản.
 */
export function DramaVisualAssetCard({
  asset,
  busy,
  batchBusy,
  batchVoiceBusy,
  characterVoiceBusy,
  flowUploading,
  flowUploadingAssetId,
  flowUploadError,
  copiedAssetId,
  genButtonLabel,
  onDetail,
  onLightbox,
  onGenerate,
  onGenerateVoice,
  onUploadFlow,
  onCopyMediaId,
  onDelete,
  onError,
}: DramaVisualAssetCardProps) {
  const { t, locale } = useI18n()
  const mediaSrc = resolveDramaAssetPreviewUrl(asset)
  const voice = readAssetVoiceBinding(asset)
  const isCharacter = (asset.type || '').toLowerCase() === 'character'
  const flowMediaId = asset.flow_media_id || (asset.params as any)?.flow_media_id
  const isUploadingFlowThis = flowUploadingAssetId === asset.id

  // Dropdown menus

  // Image Gen cURL dropdown state
  const [showGenMenu, setShowGenMenu] = useState(false)
  const genMenuRef = useRef<HTMLDivElement>(null)

  // Voice cURL dropdown state
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)
  const voiceMenuRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown Gen cURL khi click ra ngoài
  useEffect(() => {
    if (!showGenMenu) return
    function handleClickOutside(event: MouseEvent) {
      if (genMenuRef.current && !genMenuRef.current.contains(event.target as Node)) {
        setShowGenMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showGenMenu])

  // Đóng dropdown Voice khi click ra ngoài
  useEffect(() => {
    if (!showVoiceMenu) return
    function handleClickOutside(event: MouseEvent) {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(event.target as Node)) {
        setShowVoiceMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showVoiceMenu])

  return (
    <article
      className="drama-asset-card drama-asset-card-clickable"
      role="button"
      tabIndex={0}
      onClick={() => onDetail(asset, 'image')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDetail(asset, 'image')
        }
      }}
    >
      {mediaSrc ? (
        <button
          type="button"
          className="drama-asset-thumb-btn"
          title={t('common.enlarge')}
          onClick={(e) => {
            e.stopPropagation()
            onLightbox({ src: mediaSrc, alt: asset.name || t('common.preview') })
          }}
        >
          <img key={mediaSrc} src={mediaSrc} alt={asset.name || ''} />
        </button>
      ) : (
        <div className="drama-asset-placeholder">{t('drama.assetDetail.notGenerated')}</div>
      )}

      <h3>{asset.name || t('common.unnamed')}</h3>
      {isCharacter && voice ? (
        <p className="drama-asset-card-type">{formatVoiceLabel(voice.label, locale)}</p>
      ) : null}

      {DRAMA_VOICE_BINDING_ENABLED && isCharacter ? (
        <div
          className="drama-asset-card-voice"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {voice ? (
            <div ref={voiceMenuRef} className="drama-card-voice-wrap has-voice">
              <div className="drama-card-voice-preview-wrapper">
                <CharacterVoicePreviewButton
                  url={voice.url}
                  label={formatVoiceLabel(voice.label, locale)}
                  onError={onError}
                />
              </div>
              <button
                type="button"
                className="pf-btn pf-btn-sm drama-card-voice-arrow-btn"
                title="Tùy chọn cURL giọng đọc"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowVoiceMenu((prev) => !prev)
                }}
              >
                <ChevronDown size={11} />
              </button>

              {showVoiceMenu && (
                <div className="drama-card-curl-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="drama-card-curl-menu-item"
                    onClick={() => {
                      setShowVoiceMenu(false)
                      onDetail(asset, 'voice')
                    }}
                  >
                    <Terminal size={14} className="drama-card-curl-item-icon is-voice" />
                    <div className="drama-card-curl-item-text">
                      <div className="drama-card-curl-item-title">Lệnh cURL Tạo giọng</div>
                      <div className="drama-card-curl-item-desc">POST /api/drama/generation/voice</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div ref={voiceMenuRef} className="drama-card-voice-wrap">
              <button
                type="button"
                className="pf-btn pf-btn-sm drama-card-voice-main-btn"
                disabled={batchBusy || batchVoiceBusy || characterVoiceBusy}
                onClick={(e) => {
                  e.stopPropagation()
                  onGenerateVoice && onGenerateVoice(asset)
                }}
                title={characterVoiceBusy ? t('drama.assetsStep.generating') : t('drama.assetsStep.genVoice')}
              >
                {characterVoiceBusy ? (
                  <>
                    <Loader2 size={13} className="pf-spin" />
                    <span>{t('drama.assetsStep.generating')}</span>
                  </>
                ) : (
                  <>
                    <Mic size={13} />
                    <span>{t('drama.assetsStep.genVoice')}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-sm drama-card-voice-arrow-btn"
                title="Tùy chọn tạo giọng & cURL"
                disabled={characterVoiceBusy}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowVoiceMenu((prev) => !prev)
                }}
              >
                <ChevronDown size={11} />
              </button>

              {showVoiceMenu && (
                <div className="drama-card-curl-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="drama-card-curl-menu-item"
                    onClick={() => {
                      setShowVoiceMenu(false)
                      onDetail(asset, 'voice')
                    }}
                  >
                    <Terminal size={14} className="drama-card-curl-item-icon is-voice" />
                    <div className="drama-card-curl-item-text">
                      <div className="drama-card-curl-item-title">Lệnh cURL Tạo giọng</div>
                      <div className="drama-card-curl-item-desc">POST /api/drama/generation/voice</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      <div
        className="drama-asset-card-actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Nút Tạo ảnh / Tạo lại ảnh chính (Split button kèm dropdown cURL) */}
        <div ref={genMenuRef} className="drama-card-gen-wrap">
          <button
            type="button"
            className="pf-btn pf-btn-sm drama-asset-card-btn-gen drama-card-gen-main-btn"
            disabled={busy || batchBusy}
            onClick={(e) => {
              e.stopPropagation()
              onGenerate(asset)
            }}
          >
            {genButtonLabel}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-sm drama-card-gen-arrow-btn"
            disabled={busy || batchBusy}
            title="Tùy chọn tạo ảnh & cURL"
            onClick={(e) => {
              e.stopPropagation()
              setShowGenMenu((prev) => !prev)
            }}
          >
            <ChevronDown size={11} />
          </button>

          {showGenMenu && (
            <div className="drama-card-curl-menu" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="drama-card-curl-menu-item"
                onClick={() => {
                  setShowGenMenu(false)
                  onDetail(asset, 'image')
                }}
              >
                <Terminal size={14} className="drama-card-curl-item-icon is-image" />
                <div className="drama-card-curl-item-text">
                  <div className="drama-card-curl-item-title">Lệnh cURL Tạo ảnh</div>
                  <div className="drama-card-curl-item-desc">POST /api/drama/generation/image</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hàng công cụ phụ trợ (Upload Flow, Flow ID & Xóa) */}
        <div className="drama-asset-card-tools">
          <div className="drama-asset-card-tools-left">
            {mediaSrc ? (
              <button
                type="button"
                className={`pf-btn pf-btn-sm drama-card-flow-action-btn${flowMediaId ? ' is-uploaded' : ''}`}
                disabled={busy || batchBusy || flowUploading || isUploadingFlowThis}
                onClick={(e) => {
                  e.stopPropagation()
                  onUploadFlow(asset)
                }}
                title={
                  flowMediaId
                    ? 'Upload lại ảnh này lên Google Flow'
                    : 'Upload ảnh này lên Google Flow'
                }
              >
                {isUploadingFlowThis ? <Loader2 size={12} className="pf-spin" /> : <UploadCloud size={13} />}
              </button>
            ) : null}

            {isUploadingFlowThis ? (
              <div className="drama-card-flow-compact-status is-uploading">
                <Loader2 size={11} className="pf-spin" />
                <span>Uploading...</span>
              </div>
            ) : flowMediaId ? (
              <div
                className="drama-card-flow-compact-badge"
                title={`Google Flow Media ID: ${flowMediaId}`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="drama-card-flow-compact-code">{flowMediaId}</span>
                <button
                  type="button"
                  className={`drama-card-flow-compact-copy-btn${copiedAssetId === asset.id ? ' is-copied' : ''}`}
                  title="Sao chép Flow ID"
                  onClick={(e) => void onCopyMediaId(e, asset.id, String(flowMediaId))}
                >
                  {copiedAssetId === asset.id ? <CheckCheck size={11} /> : <Copy size={11} />}
                </button>
              </div>
            ) : flowUploadError ? (
              <div
                className="drama-card-flow-compact-status is-error"
                title={flowUploadError}
                onClick={(e) => e.stopPropagation()}
              >
                <AlertCircle size={11} />
                <span>Lỗi</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="pf-btn pf-btn-sm drama-card-btn-delete"
            disabled={busy || batchBusy || batchVoiceBusy || isUploadingFlowThis}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(asset)
            }}
            title={t('common.delete')}
          >
            <Trash2 size={12} />
            <span>{t('common.delete')}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

