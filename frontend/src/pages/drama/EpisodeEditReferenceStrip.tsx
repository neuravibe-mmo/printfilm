/** Đầu bảng phân cảnh: Thanh hình thu nhỏ của nội dung được liên kết */
import type { FragmentRefStripItem } from './dramaEpisodeEditUtils'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import { useI18n } from '../../i18n'

type Props = {
  items: FragmentRefStripItem[]
  onSelect?: (assetId: number) => void
}

// Hiển thị thanh nội dung được liên kết với bảng phân cảnh hiện tại
export function EpisodeEditReferenceStrip({ items, onSelect }: Props) {
  const { t } = useI18n()

  if (items.length === 0) {
    return (
      <div className="drama-ep-ref-strip is-empty">
        <span className="drama-ep-ref-strip-hint">{t('drama.episodeEdit.noLinkedAssets')}</span>
      </div>
    )
  }

  return (
    <div className="drama-ep-ref-strip" aria-label={t('drama.episodeEdit.shotAssets')}>
      {items.map((item) => (
        <button
          key={item.assetId}
          type="button"
          className={`drama-ep-ref-chip${item.isCharacter ? ' is-character' : ''}${
            item.voiceUrl ? ' has-voice' : item.isCharacter ? ' no-voice' : ''
          }`}
          title={`${item.name}${item.type ? ` · ${item.type}` : ''}${
            DRAMA_VOICE_BINDING_ENABLED && item.isCharacter
              ? item.voiceLabel
                ? ` · ${t('drama.assets.voice')}: ${item.voiceLabel}`
                : ` · ${t('drama.assets.voiceNotGenerated')}`
              : ''
          }`}
          onClick={() => onSelect?.(item.assetId)}
        >
          {item.previewUrl ? (
            <img src={item.previewUrl} alt="" draggable={false} />
          ) : (
            <span className="drama-ep-ref-chip-fallback">{(item.name || '?')[0]}</span>
          )}
          {DRAMA_VOICE_BINDING_ENABLED && item.isCharacter ? (
            <span className={`drama-ep-ref-voice-badge${item.voiceUrl ? ' bound' : ''}`}>
              {item.voiceUrl ? t('drama.assets.voiceShort') : t('drama.assets.noVoiceShort')}
            </span>
          ) : null}
          <em>{item.name}</em>
        </button>
      ))}
    </div>
  )
}
