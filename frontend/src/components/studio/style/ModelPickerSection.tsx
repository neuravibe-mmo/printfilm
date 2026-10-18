import type { MediaModelOption, MediaModelsCatalog } from '../../../api'
import { useI18n } from '../../../i18n'

type ModelPickerSectionProps = {
  catalog: MediaModelsCatalog
  imageModel: string
  onChangeImageModel: (model: string) => void
  videoModel: string
  onChangeVideoModel: (model: string) => void
  showVideoModel: boolean
}

export default function ModelPickerSection({
  catalog,
  imageModel,
  onChangeImageModel,
  videoModel,
  onChangeVideoModel,
  showVideoModel,
}: ModelPickerSectionProps) {
  const { t } = useI18n()

  return (
    <>
      <div className="pf-style-block">
        <h3>{t('studio.styleConfig.imageModelSection')}</h3>
        <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.65rem' }}>
          {t('studio.styleConfig.imageModelHint')}
        </p>
        <div className="pf-model-grid">
          {catalog.image_models.map((m: MediaModelOption) => (
            <button
              key={m.id}
              type="button"
              className={imageModel === m.id ? 'pf-model-opt selected' : 'pf-model-opt'}
              onClick={() => onChangeImageModel(m.id)}
            >
              <div className="pf-model-opt-title">
                <span>{m.label}</span>
                {m.recommended ? <span className="pf-model-badge">{t('common.recommended')}</span> : null}
              </div>
              <div className="pf-model-opt-desc">{m.description}</div>
              <div className="pf-model-opt-provider">{m.provider || 'TokenFree'}</div>
            </button>
          ))}
        </div>
      </div>

      {showVideoModel ? (
        <div className="pf-style-block">
          <h3>{t('studio.styleConfig.videoModelSection')}</h3>
          <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.65rem' }}>
            {t('studio.styleConfig.videoModelHint')}
          </p>
          <div className="pf-model-grid">
            {catalog.video_models.map((m: MediaModelOption) => (
              <button
                key={m.id}
                type="button"
                className={videoModel === m.id ? 'pf-model-opt selected' : 'pf-model-opt'}
                onClick={() => onChangeVideoModel(m.id)}
              >
                <div className="pf-model-opt-title">
                  <span>{m.label}</span>
                  {m.recommended ? <span className="pf-model-badge">{t('common.recommended')}</span> : null}
                </div>
                <div className="pf-model-opt-desc">{m.description}</div>
                <div className="pf-model-opt-provider">{m.provider || 'TokenFree'}</div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
