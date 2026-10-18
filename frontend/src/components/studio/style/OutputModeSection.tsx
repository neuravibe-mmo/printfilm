import type { PipelineMode } from '../../../api'
import { useI18n } from '../../../i18n'

type OutputModeOption = {
  id: PipelineMode
  label: string
  desc: string
  image: string
}

type OutputModeSectionProps = {
  modes: OutputModeOption[]
  pipelineMode: PipelineMode
  onChangeMode: (mode: PipelineMode) => void
}

export default function OutputModeSection({ modes, pipelineMode, onChangeMode }: OutputModeSectionProps) {
  const { t } = useI18n()

  return (
    <div className="pf-style-block">
      <h3>{t('studio.styleConfig.pipelineSection')}</h3>
      <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.65rem' }}>
        {t('studio.styleConfig.pipelineHint')}
      </p>
      <div className="pf-style-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={pipelineMode === m.id ? 'pf-style-opt selected' : 'pf-style-opt'}
            onClick={() => onChangeMode(m.id)}
          >
            <img src={m.image} alt="" />
            <div className="cap">{m.label}</div>
            <div className="cap-sub">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
