import type { MouseEvent } from 'react'
import type { VoicePreset } from '../../../api'
import { useI18n } from '../../../i18n'
import { IconPlay } from '../../ui/Icons'

export function voiceKey(v: VoicePreset): string {
  return v.speaker || v.id
}

type VoicePickerSectionProps = {
  voices: VoicePreset[]
  voiceId: string
  onSelectVoice: (v: VoicePreset) => void
  onPreviewVoice: (v: VoicePreset, e: MouseEvent) => void
  previewBusy: string | null
  playingId: string | null
  busy: boolean
}

export default function VoicePickerSection({
  voices,
  voiceId,
  onSelectVoice,
  onPreviewVoice,
  previewBusy,
  playingId,
  busy,
}: VoicePickerSectionProps) {
  const { t } = useI18n()
  const selectedVoice = voices.find((v) => voiceKey(v) === voiceId || v.id === voiceId)

  return (
    <div className="pf-style-block">
      <h3>{t('studio.styleConfig.voiceLabel')}</h3>
      <div className="pf-voice-row">
        {voices.map((v) => {
          const vid = voiceKey(v)
          const selected = voiceId === vid
          const loading = previewBusy === vid
          const playing = playingId === vid
          return (
            <div
              key={v.id}
              className={selected ? 'pf-voice-card selected' : 'pf-voice-card'}
              role="button"
              tabIndex={0}
              onClick={() => onSelectVoice(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectVoice(v)
                }
              }}
            >
              <strong className="pf-voice-name">{v.label}</strong>
              <span className="pf-voice-meta">
                {v.gender === 'female'
                  ? t('studio.styleConfig.female')
                  : v.gender === 'male'
                    ? t('studio.styleConfig.male')
                    : v.gender}
              </span>
              <button
                type="button"
                className={[
                  'pf-btn',
                  'pf-btn-sm',
                  'pf-btn-icon',
                  playing ? 'pf-btn-lime' : 'pf-btn-ghost',
                  'pf-voice-preview',
                ].join(' ')}
                disabled={loading || busy}
                onClick={(e) => onPreviewVoice(v, e)}
              >
                {loading ? (
                  t('studio.styleConfig.generating')
                ) : playing ? (
                  t('studio.styleConfig.playing')
                ) : (
                  <>
                    <IconPlay size={12} />
                    {t('studio.styleConfig.preview')}
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
      {selectedVoice ? (
        <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0.55rem 0 0' }}>
          {t('studio.styleConfig.currentVoiceHint').replace('{label}', selectedVoice.label)}
        </p>
      ) : null}
    </div>
  )
}
