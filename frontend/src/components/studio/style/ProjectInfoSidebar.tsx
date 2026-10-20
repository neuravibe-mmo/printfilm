import { useState } from 'react'
import { api, type Project, type Template } from '../../../api'
import { useI18n } from '../../../i18n'
import { getCategoryLabel } from '../../../lib/categories'
import { getTemplateName } from '../../../lib/templates'
import HoverTooltip from '../../ui/HoverTooltip'
import { IconPlay } from '../../ui/Icons'
import { isPortraitRatio } from './RatioPickerSection'
import TemplatePreviewModal from './TemplatePreviewModal'

type ProjectInfoSidebarProps = {
  project: Project
  template?: Template
}

export default function ProjectInfoSidebar({ project, template }: ProjectInfoSidebarProps) {
  const { t, locale } = useI18n()
  const [showPreview, setShowPreview] = useState(false)

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
              onClick={() => setShowPreview(true)}
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
          {project.source_text ? (
            <HoverTooltip
              title={t('studio.styleConfig.theme')}
              content={project.source_text}
              width={280}
            >
              <span className="pf-theme-clamped">
                {project.source_text}
              </span>
            </HoverTooltip>
          ) : (
            <span>—</span>
          )}
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
      <button
        type="button"
        className="pf-tpl-preview-btn"
        disabled={!template}
        onClick={() => setShowPreview(true)}
      >
        <span className="pf-tpl-preview-btn-icon">
          <IconPlay size={13} />
        </span>
        <span>{t('studio.styleConfig.previewTemplate')}</span>
      </button>

      <TemplatePreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        template={template}
      />
    </aside>
  )
}
