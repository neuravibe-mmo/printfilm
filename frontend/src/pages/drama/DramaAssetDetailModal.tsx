/** Hộp thao tác chi tiết nội dung kết hợp lệnh cURL API: Cột trái hiển thị cURL API, Cột phải hiển thị xem trước và chỉnh sửa */
import { useEffect, useRef, useState, useMemo } from 'react'
import { useI18n } from '../../i18n'
import { dramaApi, resolveDramaAssetPreviewUrl, resolveDramaMediaUrl, type DramaAsset } from '../../api/drama'
import Modal from '../../components/ui/Modal'
import { readVisualPrompt } from '../../lib/dramaVisualPrompt'
import { dramaAssetHasImage } from '../../lib/dramaAssetImage'
import {
  formatAssetImageVersionLabel,
  readAssetImageVersions,
  resolveAssetImageVersionUrl,
} from '../../lib/dramaAssetImageVersions'
import { formatVoiceLabel, readAssetVoiceBinding, readVoicePrompt } from './CharacterVoiceBindModal'
import { DramaImageLightbox } from './DramaImageLightbox'
import { CurlCodeBox } from '../../components/studio/storyboard/StoryboardCurlModal'
import { Copy, Check, Code2, Sparkles, Mic, Image as ImageIcon } from 'lucide-react'
import type { ImageGenerationOptions } from '../../lib/dramaGenerationOptions'

export type DramaAssetCurlTab = 'image' | 'voice'

type Props = {
  asset: DramaAsset
  open: boolean
  projectId?: number
  initialCurlTab?: DramaAssetCurlTab
  genOptions?: Partial<ImageGenerationOptions>
  busy?: boolean
  genLabel?: string
  onClose: () => void
  onUpdated: (asset: DramaAsset) => void
  onGenerate: (asset: DramaAsset) => void
  onBindVoice?: (asset: DramaAsset) => void
  onDelete?: (asset: DramaAsset) => void
  onError: (message: string) => void
}

// Viết lại lời nhắc đã chỉnh sửa vào params.visualPrompt
function buildPromptParams(asset: DramaAsset, prompt: string): Record<string, unknown> {
  const prev = (asset.params || {}) as Record<string, unknown>
  const kind = (asset.type || '').toLowerCase()
  const next: Record<string, unknown> = {
    ...prev,
    visualPrompt: prompt.trim(),
  }
  if (kind === 'character' || kind === 'scene') {
    next.visualImage = prompt.trim()
  }
  return next
}

// Cửa sổ thao tác kết hợp: Trái hiển thị cURL API, Phải hiển thị Chi tiết & Tạo ảnh
export function DramaAssetDetailModal({
  asset,
  open,
  projectId,
  initialCurlTab = 'image',
  genOptions,
  busy = false,
  genLabel: genLabelProp,
  onClose,
  onUpdated,
  onGenerate,
  onBindVoice,
  onDelete,
  onError,
}: Props) {
  const { t, locale } = useI18n()
  const genLabel = genLabelProp || t('drama.assetDetail.genLabel')

  const [promptDraft, setPromptDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [curlTab, setCurlTab] = useState<DramaAssetCurlTab>(initialCurlTab)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [suggestedVoicePrompt, setSuggestedVoicePrompt] = useState<string>('')
  const [sampleText, setSampleText] = useState<string>('')
  const [previewInfo, setPreviewInfo] = useState<{
    full_prompt: string
    reference_images?: Array<{ type: string; label: string; url: string }>
  } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [copiedFullPrompt, setCopiedFullPrompt] = useState(false)

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  const mediaSrc = resolveDramaAssetPreviewUrl(asset)
  const hasImage = dramaAssetHasImage(asset)
  const voice = readAssetVoiceBinding(asset)
  const isCharacter = (asset.type || '').toLowerCase() === 'character'
  const isScene = (asset.type || '').toLowerCase() === 'scene'
  const isProp =
    (asset.type || '').toLowerCase() === 'prop' ||
    (asset.type || '').toLowerCase() === 'material'
  const deleteLabel = isScene ? t('drama.assetDetail.deleteScene') : isProp ? t('drama.assetDetail.deleteProp') : t('drama.assetDetail.deleteChar')
  const canDelete = Boolean(onDelete) && (isCharacter || isScene || isProp)
  const dirty = promptDraft.trim() !== readVisualPrompt(asset).trim()
  const imageVersions = readAssetImageVersions(asset)
  const actionBusy = busy || saving || uploading || Boolean(restoringVersionId)
  const pid = projectId || asset.project_id

  useEffect(() => {
    if (!open) return
    setPromptDraft(readVisualPrompt(asset))
    setLightboxSrc(null)
    setRestoringVersionId(null)
    setCurlTab(initialCurlTab)
  }, [open, asset, initialCurlTab])

  useEffect(() => {
    if (!open) return
    const el = promptInputRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.max(el.scrollHeight, 100)}px`
    }
  }, [open, promptDraft])

  // Tải voice prompt khi cần cURL Tạo giọng
  useEffect(() => {
    if (!open || !asset) return
    const existing = readVoicePrompt(asset)
    if (existing) {
      setSuggestedVoicePrompt(existing)
      return
    }
    if (curlTab === 'voice' && pid && isCharacter) {
      dramaApi
        .suggestVoicePrompt({
          project_id: pid,
          asset_id: asset.id,
        })
        .then((res) => {
          if (res.voice_prompt) setSuggestedVoicePrompt(res.voice_prompt)
          if (res.sample_text) setSampleText(res.sample_text)
        })
        .catch(() => {})
    }
  }, [open, asset, curlTab, pid, isCharacter])

  // Lệnh cURL Tạo ảnh (cập nhật theo thời gian thực khi chỉnh sửa prompt ở cột phải)
  const imageCurl = useMemo(() => {
    if (!asset || !pid) return ''
    const token = localStorage.getItem('token') || 'YOUR_AUTH_TOKEN'
    const origin = window.location.origin
    const effectivePrompt = promptDraft.trim() || readVisualPrompt(asset)
    const kind = (asset.type || '').toLowerCase()
    const payload = {
      project_id: pid,
      asset_id: asset.id,
      name: asset.name || undefined,
      asset_type_kind: kind,
      prompt: effectivePrompt,
      image_style_id: genOptions?.image_style_id || undefined,
      model_id: genOptions?.model_id || 'chatgpt2api',
      aspect_ratio: genOptions?.aspect_ratio || '9:16',
      resolution: genOptions?.resolution || '3K',
    }
    return `curl -X POST "${origin}/api/drama/generation/image" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${JSON.stringify(payload, null, 2)}'`
  }, [asset, pid, promptDraft, genOptions])

  // Tải nội dung Prompt thực tế gửi lên AI
  useEffect(() => {
    if (!open || !asset || !pid) return
    const currentPrompt = promptDraft.trim() || readVisualPrompt(asset)
    if (!currentPrompt) return

    let cancelled = false
    const timer = setTimeout(() => {
      setLoadingPreview(true)
      dramaApi
        .previewImagePrompt({
          project_id: pid,
          asset_id: asset.id,
          prompt: currentPrompt,
          name: asset.name || undefined,
          asset_type_kind: (asset.type || '').toLowerCase(),
          image_style_id: genOptions?.image_style_id || undefined,
          model_id: genOptions?.model_id || 'chatgpt2api',
          aspect_ratio: genOptions?.aspect_ratio || '9:16',
          resolution: genOptions?.resolution || '3K',
        })
        .then((res) => {
          if (!cancelled && res.ok) {
            setPreviewInfo({
              full_prompt: res.full_prompt,
              reference_images: res.reference_images,
            })
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadingPreview(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, asset, pid, promptDraft, genOptions])

  const handleCopyFullPrompt = async () => {
    if (!previewInfo?.full_prompt) return
    try {
      await navigator.clipboard.writeText(previewInfo.full_prompt)
      setCopiedFullPrompt(true)
      setTimeout(() => setCopiedFullPrompt(false), 2000)
    } catch {}
  }

  // Lệnh cURL Tạo giọng
  const voiceCurl = useMemo(() => {
    if (!asset || !pid) return ''
    const token = localStorage.getItem('token') || 'YOUR_AUTH_TOKEN'
    const origin = window.location.origin
    const charName = asset.name || 'Nhân vật'
    const voicePrompt =
      suggestedVoicePrompt ||
      readVoicePrompt(asset) ||
      `Giọng đọc phù hợp cho nhân vật ${charName}, truyền cảm và tự nhiên.`
    const payload = {
      project_id: pid,
      character_asset_id: asset.id,
      name: `Giọng ${charName}`,
      voice_prompt: voicePrompt,
      sample_text: sampleText || `Xin chào, tôi là ${charName}.`,
    }
    return `curl -X POST "${origin}/api/drama/generation/voice" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${JSON.stringify(payload, null, 2)}'`
  }, [asset, pid, suggestedVoicePrompt, sampleText])

  const currentCurl = curlTab === 'image' ? imageCurl : voiceCurl

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(currentCurl)
      setCopiedCurl(true)
      setTimeout(() => setCopiedCurl(false), 2000)
    } catch {}
  }

  // Lưu prompt
  async function savePrompt() {
    const text = promptDraft.trim()
    if (!text) {
      onError(t('drama.assetDetail.promptRequired'))
      return
    }
    setSaving(true)
    try {
      const updated = await dramaApi.updateAsset(asset.id, {
        params: buildPromptParams(asset, text),
      })
      onUpdated(updated)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetDetail.savePromptFailed'))
    } finally {
      setSaving(false)
    }
  }

  // Lưu và tạo ảnh
  async function handleGenerate() {
    if (dirty) {
      const text = promptDraft.trim()
      if (!text) {
        onError(t('drama.assetDetail.promptRequired'))
        return
      }
      setSaving(true)
      try {
        const updated = await dramaApi.updateAsset(asset.id, {
          params: buildPromptParams(asset, text),
        })
        onUpdated(updated)
        onGenerate(updated)
      } catch (err) {
        onError(err instanceof Error ? err.message : t('drama.assetDetail.savePromptFailed'))
      } finally {
        setSaving(false)
      }
      return
    }
    onGenerate(asset)
  }

  // Tải ảnh lên cục bộ
  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const updated = await dramaApi.uploadAssetMedia(asset.id, file)
      onUpdated(updated)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetDetail.uploadFailed'))
    } finally {
      setUploading(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
    }
  }

  // Khôi phục hình ảnh lịch sử về hiện tại
  async function handleRestoreVersion(versionId: string) {
    setRestoringVersionId(versionId)
    try {
      const updated = await dramaApi.activateAssetImageVersion(asset.id, versionId)
      onUpdated(updated)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetDetail.restoreFailed'))
    } finally {
      setRestoringVersionId(null)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`${asset.name || t('drama.assetDetail.title')} · Lệnh cURL API & Chi tiết`}
        size="xl"
        className="drama-asset-detail-modal"
        dismissible={!lightboxSrc}
        footer={
          <div className="drama-asset-detail-footer">
            <div className="drama-asset-detail-footer-left">
              <button type="button" className="pf-btn" onClick={onClose}>
                {t('common.close')}
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-outline"
                onClick={handleCopyCurl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {copiedCurl ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copiedCurl ? 'Đã sao chép cURL!' : 'Sao chép cURL'}</span>
              </button>
            </div>

            <div className="drama-asset-detail-footer-right">
              {dirty && (
                <button
                  type="button"
                  className="pf-btn"
                  disabled={saving || actionBusy}
                  onClick={() => void savePrompt()}
                >
                  {saving ? t('common.saving') : t('drama.assetDetail.savePrompt')}
                </button>
              )}
              <button
                type="button"
                className="pf-btn drama-btn-primary"
                disabled={actionBusy || !promptDraft.trim()}
                onClick={() => void handleGenerate()}
              >
                {busy ? t('drama.assetsStep.generating') : genLabel}
              </button>
            </div>
          </div>
        }
      >
        <div className="drama-asset-detail-split" onClick={(e) => e.stopPropagation()}>
          {/* CỘT TRÁI: Hình 1 (Lệnh cURL API) */}
          <div className="drama-asset-curl-col">
            {/* Chuyển đổi cURL Tạo ảnh / Tạo giọng nếu là nhân vật */}
            {isCharacter ? (
              <div className="drama-asset-curl-tabs">
                <button
                  type="button"
                  className={`drama-asset-curl-tab${curlTab === 'image' ? ' is-active' : ''}`}
                  onClick={() => setCurlTab('image')}
                >
                  <Sparkles size={14} />
                  <span>cURL Tạo ảnh</span>
                </button>
                <button
                  type="button"
                  className={`drama-asset-curl-tab${curlTab === 'voice' ? ' is-active' : ''}`}
                  onClick={() => setCurlTab('voice')}
                >
                  <Mic size={14} />
                  <span>cURL Tạo giọng</span>
                </button>
              </div>
            ) : null}

            {/* Thông tin Endpoint & Nút Sao chép cURL */}
            <div className="drama-asset-curl-endpoint-bar">
              <div className="drama-asset-curl-endpoint-info">
                <span className="drama-asset-curl-method">POST</span>
                <code>
                  {curlTab === 'image' ? '/api/drama/generation/image' : '/api/drama/generation/voice'}
                </code>
              </div>
              <button
                type="button"
                className="drama-asset-curl-quick-copy"
                onClick={handleCopyCurl}
              >
                {copiedCurl ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                <span>{copiedCurl ? 'Đã chép!' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Khung cURL Code */}
            <div className="drama-asset-curl-section">
              <div className="drama-asset-curl-section-head">
                <Code2 size={14} />
                <span>Lệnh cURL thực thi:</span>
              </div>
              <CurlCodeBox code={currentCurl} />
            </div>

            {/* Nội dung Prompt thực tế gửi lên ChatGPT2API & Ảnh tham chiếu */}
            {curlTab === 'image' && (
              <div className="drama-asset-curl-section">
                <div
                  className="drama-asset-curl-section-head"
                  style={{ justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color="#6366f1" />
                    <span style={{ color: '#0f172a' }}>
                      Prompt thực tế gửi tới ChatGPT2API:
                    </span>
                  </div>
                  <button
                    type="button"
                    className="drama-asset-curl-quick-copy"
                    onClick={() => void handleCopyFullPrompt()}
                    title="Sao chép toàn bộ Prompt thực tế"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  >
                    {copiedFullPrompt ? (
                      <Check size={12} color="#16a34a" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedFullPrompt ? 'Đã chép!' : 'Sao chép Prompt'}</span>
                  </button>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    color: '#1e293b',
                    maxHeight: 180,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {loadingPreview ? (
                    <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Đang phân tích và tạo Prompt thực tế...
                    </span>
                  ) : previewInfo?.full_prompt ? (
                    previewInfo.full_prompt
                  ) : (
                    <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Chưa có nội dung prompt.
                    </span>
                  )}
                </div>

                {/* Nếu có ảnh tham chiếu */}
                {previewInfo?.reference_images && previewInfo.reference_images.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#475569',
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ImageIcon size={13} />
                      <span>
                        Ảnh tham chiếu gửi kèm AI ({previewInfo.reference_images.length}):
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {previewInfo.reference_images.map((refImg, idx) => {
                        const imgUrl = resolveDramaMediaUrl(refImg.url)
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                            onClick={() => imgUrl && setLightboxSrc(imgUrl)}
                            title="Bấm để xem phóng to ảnh tham chiếu"
                          >
                            <img
                              src={imgUrl}
                              alt={refImg.label}
                              style={{
                                width: 36,
                                height: 36,
                                objectFit: 'cover',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                              }}
                            />
                            <div style={{ maxWidth: 220 }}>
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {refImg.label}
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                Bấm để phóng to
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phản hồi mẫu từ API */}
            <div className="drama-asset-curl-section">
              <div className="drama-asset-curl-section-head">
                <span>Phản hồi mẫu (JSON Response):</span>
              </div>
              <pre className="pf-curl-box drama-asset-curl-response-box">
                {curlTab === 'image'
                  ? `{
  "task_id": 482,
  "status": "queued",
  "message": "Đã đưa vào hàng đợi tạo ảnh",
  "asset": {
    "id": ${asset.id},
    "project_id": ${pid || 0},
    "name": "${asset.name || 'Tài sản'}",
    "type": "${asset.type}"
  }
}`
                  : `{
  "status": "success",
  "asset": {
    "id": 105,
    "name": "Giọng ${asset.name || 'Nhân vật'}",
    "type": "voice",
    "url": "http://localhost:8001/static/generated/voice_${asset.id}.mp3"
  }
}`}
              </pre>
            </div>
          </div>

          {/* CỘT PHẢI: Hình 2 (Chi tiết tài sản & Thao tác) */}
          <div className="drama-asset-detail-col">
            <button
              type="button"
              className="drama-asset-detail-media"
              disabled={!mediaSrc}
              title={mediaSrc ? t('common.enlarge') : undefined}
              onClick={() => mediaSrc && setLightboxSrc(mediaSrc)}
            >
              {mediaSrc ? (
                <img key={mediaSrc} src={mediaSrc} alt={asset.name || ''} />
              ) : (
                <div className="drama-asset-placeholder">{t('drama.assetDetail.notGenerated')}</div>
              )}
            </button>

            <p className="drama-muted drama-asset-detail-meta">
              {hasImage ? t('drama.assetDetail.generated') : t('drama.assetDetail.notGenerated')}
              {isCharacter && voice ? ' · ' + t('drama.assetDetail.voiceBound').replace('{label}', formatVoiceLabel(voice.label, locale)) : ''}
              {mediaSrc ? ' · ' + t('drama.assetDetail.clickToEnlarge') : ''}
            </p>

            <div className="drama-asset-detail-extra">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={actionBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                }}
              />
              <button
                type="button"
                className="pf-btn pf-btn-sm"
                disabled={actionBusy}
                onClick={() => uploadInputRef.current?.click()}
              >
                {uploading ? t('drama.assetDetail.uploading') : hasImage ? t('drama.assetDetail.replaceImage') : t('drama.assetDetail.uploadImage')}
              </button>
              {isCharacter && onBindVoice ? (
                <button
                  type="button"
                  className="pf-btn pf-btn-sm"
                  onClick={() => onBindVoice(asset)}
                >
                  {voice ? t('drama.assetDetail.replaceVoice') : t('drama.assetDetail.bindVoice')}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  className="pf-btn pf-btn-sm drama-btn-danger-text"
                  disabled={actionBusy}
                  onClick={() => onDelete?.(asset)}
                >
                  {deleteLabel}
                </button>
              ) : null}
            </div>

            {imageVersions.length > 0 ? (
              <section className="drama-asset-image-versions" aria-label={t('drama.assetDetail.historyVersions')}>
                <header className="drama-asset-image-versions-head">
                  <strong>{t('drama.assetDetail.historyVersions')}</strong>
                  <span className="drama-muted">{imageVersions.length} {t('common.items')}</span>
                </header>
                <ul className="drama-asset-image-versions-list">
                  {imageVersions.map((version) => {
                    const thumb = resolveAssetImageVersionUrl(version)
                    const restoring = restoringVersionId === version.id
                    return (
                      <li key={version.id} className="drama-asset-image-version">
                        <button
                          type="button"
                          className="drama-asset-image-version-thumb"
                          title={t('common.enlarge')}
                          onClick={() => setLightboxSrc(thumb)}
                        >
                          <img src={thumb} alt="" />
                        </button>
                        <div className="drama-asset-image-version-meta">
                          <span>{formatAssetImageVersionLabel(version)}</span>
                          {version.createdAt ? (
                            <small className="drama-muted">
                              {version.createdAt.replace('T', ' ').slice(0, 16)}
                            </small>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="pf-btn pf-btn-sm"
                          disabled={actionBusy}
                          onClick={() => void handleRestoreVersion(version.id)}
                        >
                          {restoring ? t('drama.assetDetail.restoring') : t('drama.assetDetail.restore')}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            <label className="drama-field">
              <span>{t('drama.assetDetail.imagePrompt')}</span>
              <textarea
                ref={promptInputRef}
                className="drama-asset-detail-prompt"
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                placeholder={t('drama.assetDetail.promptPlaceholder')}
              />
            </label>
          </div>
        </div>
      </Modal>

      {lightboxSrc ? (
        <DramaImageLightbox
          src={lightboxSrc}
          alt={asset.name || t('common.preview')}
          onClose={() => setLightboxSrc(null)}
        />
      ) : null}
    </>
  )
}
