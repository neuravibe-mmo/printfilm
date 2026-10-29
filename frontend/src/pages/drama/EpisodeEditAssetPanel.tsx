/** Biên tập tập: Cột nội dung bên trái (tập này/tập đầy đủ + thẻ danh mục) */
import { useI18n } from '../../i18n'
import { Workflow, Loader2, Link2Off, Plus, Mic } from 'lucide-react'
import { resolveDramaAssetPreviewUrl, type DramaAsset } from '../../api/drama'
import { CharacterVoicePreviewButton } from '../../components/drama/CharacterVoicePreviewButton'
import { formatVoiceLabel, readAssetVoiceBinding } from './CharacterVoiceBindModal'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import {
  ASSET_TABS,
  normalizeAssetTab,
  type AssetScope,
  type AssetTab,
} from './dramaEpisodeEditUtils'

type Props = {
  scope: AssetScope
  tab: AssetTab | null
  assets: DramaAsset[]
  activeIds?: Set<number>
  imageBusyIds?: ReadonlySet<number>
  createBusy?: boolean
  onScopeChange: (scope: AssetScope) => void
  onTabChange: (tab: AssetTab | null) => void
  onOpenCanvas: () => void
  /** Mở chi tiết nội dung: Chỉnh sửa lời nhắc / Tạo lại / Tải lên */
  onOpenAsset: (asset: DramaAsset) => void
  /** Chèn @asset vào bảng phân cảnh hiện tại */
  onMention: (asset: DramaAsset) => void
  /** Hủy liên kết bảng phân cảnh hiện tại với nội dung (mà không xóa nội dung) */
  onUnlinkAsset?: (assetId: number) => void
  onGenerateVoice?: (asset: DramaAsset) => void
  voiceBusyIds?: ReadonlySet<number>
  onVoiceError?: (message: string) => void
  /** Tùy chỉnh và tạo nội dung mới trong danh mục hiện tại */
  onCreateAsset?: () => void
  /** Nhập từ thư viện nội dung toàn cầu */
  onImportAsset?: () => void
  /** Tự động nhận diện tài sản từ phân cảnh hiện tại */
  onAutoDetect?: () => void
  detectBusy?: boolean
  hasLinkedScene?: boolean
}



// Kết xuất tập chỉnh sửa cột nội dung bên trái
export function EpisodeEditAssetPanel({
  scope,
  tab,
  assets,
  activeIds,
  imageBusyIds,
  createBusy,
  onScopeChange,
  onTabChange,
  onOpenCanvas,
  onOpenAsset,
  onMention,
  onUnlinkAsset,
  onGenerateVoice,
  voiceBusyIds,
  onVoiceError,
  onCreateAsset,
  onImportAsset,
  onAutoDetect,
  detectBusy,
  hasLinkedScene,
}: Props) {
  const { t, locale } = useI18n()
  const createLabel = (tab: AssetTab | null): string => {
    if (tab === 'scene') return t('drama.mention.newScene')
    if (tab === 'prop') return t('drama.mention.newProp')
    return t('drama.mention.newCharacter')
  }
  const createTooltip = (tab: AssetTab | null): string => {
    if (tab === 'scene') return t('drama.mention.newSceneTip')
    if (tab === 'prop') return t('drama.mention.newPropTip')
    return t('drama.mention.newCharacterTip')
  }
  const detectLabel = (tab: AssetTab | null): string => {
    if (tab === 'scene') return t('drama.mention.autoDetectScenes')
    if (tab === 'prop') return t('drama.mention.autoDetectProps')
    return t('drama.mention.autoDetectCharacters')
  }

  const isSceneLinked =
    hasLinkedScene ??
    assets.some((a) => normalizeAssetTab(a.type) === 'scene' && activeIds?.has(a.id))
  const isDetectDisabled =
    createBusy || detectBusy || (tab === 'scene' && isSceneLinked)
  const isActionsDisabled =
    createBusy || detectBusy || (tab === 'scene' && isSceneLinked)
  const actionDisabledTip =
    tab === 'scene' && isSceneLinked
      ? t('drama.mention.sceneAlreadyLinkedTip')
      : undefined
  const detectTip =
    tab === 'scene' && isSceneLinked
      ? t('drama.mention.sceneAlreadyLinkedTip')
      : t('drama.mention.autoDetectTip')
  return (
    <aside className="drama-ep-assets">
      <div className="drama-ep-assets-top">
        <div className="drama-ep-scope">
          <button
            type="button"
            className={scope === 'episode' ? 'active' : ''}
            onClick={() => onScopeChange('episode')}
          >
            {t('drama.mention.thisEpisode')}
          </button>
          <button
            type="button"
            className={scope === 'series' ? 'active' : ''}
            onClick={() => onScopeChange('series')}
          >
            {t('drama.mention.allEpisodes')}
          </button>
        </div>
        <button
          type="button"
          className="drama-ep-icon-btn solid"
          aria-label={t('drama.mention.openCanvas')}
          title={t('drama.mention.openCanvas')}
          onClick={onOpenCanvas}
        >
          <Workflow size={16} strokeWidth={1.9} />
        </button>
      </div>
      <div className="drama-ep-asset-tabs">
        {ASSET_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={tab === item.key ? 'active' : ''}
            onClick={() => onTabChange(tab === item.key ? null : item.key)}
          >
            {item.key === 'character'
              ? t('drama.assetsStep.character')
              : item.key === 'scene'
              ? t('drama.assetsStep.scene')
              : item.key === 'prop'
              ? t('drama.assetsStep.prop')
              : item.label}
          </button>
        ))}
      </div>
      {onCreateAsset || onImportAsset || onAutoDetect ? (
        <div className="drama-ep-asset-actions">
          {onCreateAsset ? (
            <button
              type="button"
              className="drama-ep-asset-action-btn"
              disabled={isActionsDisabled}
              onClick={onCreateAsset}
              title={actionDisabledTip || createTooltip(tab)}
            >
              {createBusy ? t('common.creating') : createLabel(tab)}
            </button>
          ) : null}
          {onImportAsset ? (
            <button
              type="button"
              className="drama-ep-asset-action-btn is-ghost"
              disabled={isActionsDisabled}
              onClick={onImportAsset}
              title={actionDisabledTip || t('drama.mention.importBtn')}
            >
              {t('drama.mention.importBtn')}
            </button>
          ) : null}
          {onAutoDetect ? (
            <button
              type="button"
              className="drama-ep-asset-action-btn drama-ep-asset-action-detect"
              disabled={isDetectDisabled}
              onClick={onAutoDetect}
              title={detectTip}
            >
              {detectBusy ? (
                <>
                  <Loader2 size={15} className="drama-ep-detect-spin" />
                  <span>{t('drama.mention.autoDetecting')}</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>{detectLabel(tab)}</span>
                </>
              )}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="drama-ep-asset-grid">
        {assets.length === 0 ? (
          <p className="drama-ep-empty">
            {scope === 'episode'
              ? t('drama.mention.episodeEmpty')
              : t('drama.mention.noAssets')}
          </p>
        ) : (
          assets.map((asset) => {
            const cover = resolveDramaAssetPreviewUrl(asset)
            const isScene = normalizeAssetTab(asset.type) === 'scene'
            const isCharacter = normalizeAssetTab(asset.type) === 'character'
            const voice = isCharacter ? readAssetVoiceBinding(asset) : null
            const isActive = activeIds?.has(asset.id)
            const voiceGenerating = voiceBusyIds?.has(asset.id) ?? false
            const imageBusy = imageBusyIds?.has(asset.id) ?? false
            return (
              <div
                key={asset.id}
                className={`drama-ep-asset-card-wrap${isScene ? ' scene' : ''}${isActive ? ' is-linked' : ''}${
                  imageBusy ? ' is-gen' : ''
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className={`drama-ep-asset-card ${isScene ? 'scene' : ''}${isActive ? ' is-linked' : ''}${
                    imageBusy ? ' is-gen' : ''
                  }`}
                  onClick={() => onOpenAsset(asset)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpenAsset(asset)
                    }
                  }}
                  title={t('drama.mention.assetSettings')}
                >
                  <div className="drama-ep-asset-thumb">
                    {cover ? (
                      <img key={cover} src={cover} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span>{(asset.name || '?')[0]}</span>
                    )}
                    {imageBusy ? <em className="drama-ep-asset-gen-badge">{t('drama.assetsStep.generating')}</em> : null}
                  </div>
                  <span className="drama-ep-asset-name">{asset.name || `${t('drama.genQueue.assetPrefix')} ${asset.id}`}</span>
                  {isActive ? <span className="drama-ep-asset-linked">{t('drama.mention.linked')}</span> : null}
                  {DRAMA_VOICE_BINDING_ENABLED && voice ? (
                    <span className="drama-ep-asset-voice">{t('drama.assets.voice')}</span>
                  ) : null}
                  <span className="drama-ep-asset-settings">{t('common.settings')}</span>
                </div>
                <div className="drama-ep-asset-ops">
                  {isActive && onUnlinkAsset ? (
                    <button
                      type="button"
                      className="drama-ep-asset-op-btn"
                      onClick={() => onUnlinkAsset(asset.id)}
                      title={`${t('drama.mention.unlink')} (${t('drama.mention.unlinkTitle')})`}
                      aria-label={t('drama.mention.unlink')}
                    >
                      <Link2Off size={13} strokeWidth={2} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="drama-ep-asset-op-btn"
                      onClick={() => onMention(asset)}
                      title={t('drama.mention.insertToScript')}
                      aria-label={t('drama.mention.insertToScript')}
                    >
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  )}
                  {isCharacter && onGenerateVoice ? (
                    voice ? (
                      <CharacterVoicePreviewButton
                        url={voice.url}
                        label={formatVoiceLabel(voice.label, locale)}
                        variant="inline"
                        iconOnly
                        className="drama-ep-asset-voice-btn is-bound"
                        onError={onVoiceError}
                      />
                    ) : (
                      <button
                        type="button"
                        className="drama-ep-asset-voice-btn"
                        disabled={voiceGenerating}
                        onClick={() => onGenerateVoice(asset)}
                        title={voiceGenerating ? t('common.generating') : t('drama.mention.genVoice')}
                        aria-label={voiceGenerating ? t('common.generating') : t('drama.mention.genVoice')}
                      >
                        {voiceGenerating ? <Loader2 size={13} className="animate-spin" /> : <Mic size={13} strokeWidth={2} />}
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
