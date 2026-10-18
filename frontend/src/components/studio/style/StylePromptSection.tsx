import { useEffect, useRef } from 'react'
import { api, type Template } from '../../../api'
import { useI18n } from '../../../i18n'
import { getTemplateName } from '../../../lib/templates'
import { isPortraitRatio } from './RatioPickerSection'

type StylePromptSectionProps = {
  template?: Template
  stylePrompt: string
  onChangeStylePrompt: (val: string) => void
}

export default function StylePromptSection({
  template,
  stylePrompt,
  onChangeStylePrompt,
}: StylePromptSectionProps) {
  const { t, locale } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const adjust = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    adjust()
    window.addEventListener('resize', adjust)
    return () => window.removeEventListener('resize', adjust)
  }, [stylePrompt])

  return (
    <div className="pf-style-block">
      <h3>{t('studio.styleConfig.styleSection')}</h3>
      <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.65rem' }}>
        {t('studio.styleConfig.styleLocked')}
      </p>
      {template ? (
        <div
          className={[
            'pf-style-opt',
            'selected',
            isPortraitRatio(template.default_ratio) ? 'portrait' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ maxWidth: 280, textAlign: 'left' }}
        >
          <span className="pf-style-opt-media">
            <img src={api.assetUrl(template.preview_cover)} alt="" />
            {template.default_ratio ? (
              <span className="pf-style-opt-ratio">{template.default_ratio}</span>
            ) : null}
          </span>
          <div className="cap">{getTemplateName(template, locale)}</div>
          <div className="cap-sub">{t('studio.styleConfig.templateStyle')}</div>
        </div>
      ) : null}
      <label className="pf-field" style={{ marginTop: '0.75rem' }}>
        <span className="pf-field-label">{t('studio.styleConfig.stylePromptOverride')}</span>
        <textarea
          ref={textareaRef}
          className="pf-field-input"
          value={stylePrompt}
          onChange={(e) => {
            onChangeStylePrompt(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          rows={1}
          style={{
            resize: 'none',
            overflow: 'hidden',
            minHeight: '44px',
            lineHeight: '1.5',
            boxSizing: 'border-box',
          }}
        />
      </label>
    </div>
  )
}
