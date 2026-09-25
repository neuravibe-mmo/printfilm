/** 资产详情操作框：预览图、上传/生图提示词编辑、生成/音色、形象历史版本 */
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { dramaApi, resolveDramaAssetPreviewUrl, type DramaAsset } from '../../api/drama'
import Modal from '../../components/ui/Modal'
import { readVisualPrompt } from '../../lib/dramaVisualPrompt'
import { dramaAssetHasImage } from '../../lib/dramaAssetImage'
import {
  formatAssetImageVersionLabel,
  readAssetImageVersions,
  resolveAssetImageVersionUrl,
} from '../../lib/dramaAssetImageVersions'
import { readAssetVoiceBinding } from './CharacterVoiceBindModal'
import { DramaImageLightbox } from './DramaImageLightbox'

type Props = {
  asset: DramaAsset
  open: boolean
  busy?: boolean
  genLabel?: string
  onClose: () => void
  onUpdated: (asset: DramaAsset) => void
  onGenerate: (asset: DramaAsset) => void
  onBindVoice?: (asset: DramaAsset) => void
  onDelete?: (asset: DramaAsset) => void
  onError: (message: string) => void
}

// 将编辑后的提示词写回 params.visualPrompt
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

// 渲染资产详情操作弹窗
export function DramaAssetDetailModal({
  asset,
  open,
  busy = false,
  genLabel = t('drama.assetDetail.genLabel'),
  onClose,
  onUpdated,
  onGenerate,
  onBindVoice,
  onDelete,
  onError,
}: Props) {
  const { t } = useI18n()

  /*
   * promptDraft 提示词草稿
   * saving 保存中
   * uploading 上传图片中
   * restoringVersionId 正在还原的版本
   * lightboxSrc 放大预览图 URL
   */
  const [promptDraft, setPromptDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!open) return
    setPromptDraft(readVisualPrompt(asset))
    setLightboxSrc(null)
    setRestoringVersionId(null)
  }, [open, asset])

  // 保存提示词到资产 params
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

  // 先保存脏提示词再触发生图
  async function handleGenerate() {
    if (dirty) {
      const text = promptDraft.trim()
      if (!text) {
        onError('提示词不能为空')
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
        onError(err instanceof Error ? err.message : '保存提示词失败')
      } finally {
        setSaving(false)
      }
      return
    }
    onGenerate(asset)
  }

  // 本地上传图片，视为已出图
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

  // 将历史形象还原为当前
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
        title={asset.name || t('drama.assetDetail.title')}
        size="lg"
        className="drama-asset-detail-modal"
        dismissible={!lightboxSrc}
        footer={
          <div className="drama-modal-actions">
            <button type="button" className="pf-btn" onClick={onClose}>
              {t('common.close')}
            </button>
            <button
              type="button"
              className="pf-btn"
              disabled={saving || !dirty || actionBusy}
              onClick={() => void savePrompt()}
            >
              {saving ? t('common.saving') : t('drama.assetDetail.savePrompt')}
            </button>
            <button
              type="button"
              className="pf-btn drama-btn-primary"
              disabled={actionBusy || !promptDraft.trim()}
              onClick={() => void handleGenerate()}
            >
              {busy ? t('drama.assetsStep.generating') : genLabel}
            </button>
          </div>
        }
      >
        <div className="drama-asset-detail">
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
              <div className="drama-asset-placeholder">{asset.type || 'asset'}</div>
            )}
          </button>

          <p className="drama-muted drama-asset-detail-meta">
            {asset.type}
            {hasImage ? ' · ' + t('drama.assetDetail.generated') : ' · ' + t('drama.assetDetail.notGenerated')}
            {isCharacter && voice ? ' · ' + t('drama.assetDetail.voiceBound').replace('{label}', voice.label) : ''}
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
              rows={8}
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              placeholder={t('drama.assetDetail.promptPlaceholder')}
            />
          </label>
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
