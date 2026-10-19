import { api, type Project, type Template } from '../../../api'
import { useI18n } from '../../../i18n'
import { getCategoryLabel } from '../../../lib/categories'
import { getTemplateName } from '../../../lib/templates'
import ComingSoon from '../../ui/ComingSoon'
import HoverTooltip from '../../ui/HoverTooltip'
import { isPortraitRatio } from './RatioPickerSection'

type ProjectInfoSidebarProps = {
  project: Project
  template?: Template
}

export default function ProjectInfoSidebar({ project, template }: ProjectInfoSidebarProps) {
  const { t, locale } = useI18n()

  return (
    <aside className="pf-create-col">
      <h3>{t('studio.styleConfig.projectInfo')}</h3>
      {template ? (
        <div>
          <HoverTooltip
            title={t('studio.styleConfig.templateCoverTooltipTitle')}
            content={t('studio.styleConfig.templateCoverTooltip')}
          >
            <div
              className={[
                'pf-style-side-thumb',
                isPortraitRatio(template.default_ratio) ? 'portrait' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ cursor: 'pointer' }}
            >
              <img src={api.assetUrl(template.preview_cover)} alt="" />
            </div>
          </HoverTooltip>
          <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{getTemplateName(template, locale)}</p>
          <div className="pf-tags">
            {template.category.map((c) => (
              <span key={c}>{getCategoryLabel(c)}</span>
            ))}
          </div>
        </div>
      ) : null}
      <ul className="pf-meta-list" style={{ marginTop: '0.85rem' }}>
        <li>
          <span>{t('studio.styleConfig.theme')}</span>
          <span style={{ maxWidth: '55%', textAlign: 'right' }}>
            {(project.source_text || '').slice(0, 40)}
          </span>
        </li>
        <li>
          <span>{t('studio.styleConfig.duration')}</span>
          <span>{t('studio.styleConfig.durationVal')}</span>
        </li>
        <li>
          <span>{t('studio.styleConfig.shotsCount')}</span>
          <span>{t('studio.styleConfig.shotsAuto')}</span>
        </li>
      </ul>
      <button type="button" className="pf-btn pf-btn-ghost pf-btn-block pf-btn-sm" disabled>
        {t('studio.styleConfig.previewTemplate')} <ComingSoon />
      </button>
    </aside>
  )
}
