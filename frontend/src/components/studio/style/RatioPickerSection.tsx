import { useI18n } from '../../../i18n'

export const RATIOS: { id: string; label: string; w: number; h: number }[] = [
  { id: '16:9', label: '16:9', w: 36, h: 20 },
  { id: '9:16', label: '9:16', w: 18, h: 32 },
  { id: '1:1', label: '1:1', w: 24, h: 24 },
  { id: '4:3', label: '4:3', w: 28, h: 21 },
  { id: '21:9', label: '21:9', w: 40, h: 17 },
]

export function isPortraitRatio(ratio: string | undefined | null): boolean {
  const raw = String(ratio || '').trim()
  const m = raw.match(/^(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)$/i)
  if (!m) return false
  return Number(m[2]) > Number(m[1])
}

type RatioPickerSectionProps = {
  ratio: string
  onChangeRatio: (ratioId: string) => void
}

export default function RatioPickerSection({ ratio, onChangeRatio }: RatioPickerSectionProps) {
  const { t } = useI18n()

  return (
    <div className="pf-style-block">
      <h3>{t('studio.styleConfig.outputRatio')}</h3>
      <div className="pf-ratio-row">
        {RATIOS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={ratio === r.id ? 'pf-ratio selected' : 'pf-ratio'}
            onClick={() => onChangeRatio(r.id)}
          >
            <div className="box" style={{ width: r.w, height: r.h }} />
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
