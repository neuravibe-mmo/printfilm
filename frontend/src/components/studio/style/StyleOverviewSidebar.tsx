import type { MouseEvent } from 'react'
import { api, type PipelineMode, type Project, type Template, type VoicePreset } from '../../../api'
import { useI18n } from '../../../i18n'
import { Loader2, Square } from 'lucide-react'
import BillingErrorNotice from '../../billing/BillingErrorNotice'
import HoverTooltip from '../../ui/HoverTooltip'
import { IconPlay } from '../../ui/Icons'
import { isPortraitRatio } from './RatioPickerSection'
import { voiceKey } from './VoicePickerSection'

type StyleOverviewSidebarProps = {
  project: Project
  template?: Template
  ratio: string
  characterPrompt: string
  selectedVoice?: VoicePreset
  pipelineMode: PipelineMode
  busy: boolean
  previewBusy: string | null
  playingId: string | null
  error: string
  onPreviewVoice: (v: VoicePreset, e: MouseEvent) => void
  onGenerate: () => void
}

export default function StyleOverviewSidebar({
  project,
  template,
  ratio,
  characterPrompt,
  selectedVoice,
  pipelineMode,
  busy,
  previewBusy,
  playingId,
  error,
  onPreviewVoice,
  onGenerate,
}: StyleOverviewSidebarProps) {
  const { t } = useI18n()

  return (
    <aside className="pf-create-col">
      <h3>{t('studio.styleConfig.livePreview')}</h3>
      {template ? (
        <HoverTooltip
          title={t('studio.styleConfig.templateCoverTooltipTitle')}
          content={t('studio.styleConfig.templateCoverTooltip')}
        >
          <div
            className={[
              'pf-editor-preview',
              isPortraitRatio(ratio) ? 'portrait' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ marginBottom: '0.85rem', cursor: 'pointer' }}
          >
            <img src={api.assetUrl(template.preview_cover)} alt="" />
          </div>
        </HoverTooltip>
      ) : (
        <div
          className={[
            'pf-editor-preview',
            isPortraitRatio(ratio) ? 'portrait' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ marginBottom: '0.85rem' }}
        >
          <span className="empty">{t('studio.styleConfig.previewPlaceholder')}</span>
        </div>
      )}
      <p className="pf-muted" style={{ fontSize: '0.8rem' }}>
        {t('studio.styleConfig.previewNote')}
      </p>

      <h3 style={{ marginTop: '1rem' }}>{t('studio.styleConfig.configOverview')}</h3>
      <ul className="pf-meta-list">
        <li>
          <span>{t('studio.styleConfig.style')}</span>
          <span>{template?.name || '—'}</span>
        </li>
        <li>
          <span>{t('studio.styleConfig.character')}</span>
          <span>
            {characterPrompt.trim() || project.ref_image_url || project.product_image_url || project.scene_image_url || project.product_prompt || project.scene_prompt
              ? t('studio.styleConfig.charCustom')
              : t('studio.styleConfig.charByAI')}
          </span>
        </li>
        <li>
          <span>{t('studio.styleConfig.voiceConfig')}</span>
          <span>{selectedVoice?.label || t('studio.styleConfig.default')}</span>
        </li>
        <li>
          <span>{t('studio.styleConfig.ratio')}</span>
          <span>{ratio}</span>
        </li>
        <li>
          <span>{t('studio.styleConfig.pipeline')}</span>
          <span>
            {pipelineMode === 'image_text'
              ? t('studio.styleConfig.modeImageTextLabel')
              : t('studio.styleConfig.modeFullLabel')}
          </span>
        </li>
      </ul>

      {selectedVoice ? (
        <button
          type="button"
          className={[
            'pf-btn',
            'pf-btn-block',
            'pf-btn-sm',
            playingId === voiceKey(selectedVoice) ? 'pf-btn-lime' : 'pf-btn-ghost',
          ].join(' ')}
          style={{
            marginTop: '0.75rem',
            height: 'auto',
            padding: '0.45rem 0.65rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.15rem',
            lineHeight: 1.25,
            whiteSpace: 'normal',
            textAlign: 'center',
          }}
          disabled={busy || previewBusy === voiceKey(selectedVoice)}
          onClick={(e) => onPreviewVoice(selectedVoice, e)}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem',
              fontWeight: 650,
            }}
          >
            {previewBusy === voiceKey(selectedVoice) ? (
              <Loader2 size={13} className="pf-tool-spin" />
            ) : playingId === voiceKey(selectedVoice) ? (
              <Square size={10} fill="currentColor" />
            ) : (
              <IconPlay size={13} />
            )}
            <span>
              {previewBusy === voiceKey(selectedVoice)
                ? t('studio.styleConfig.generating')
                : playingId === voiceKey(selectedVoice)
                  ? t('studio.styleConfig.stopPreview')
                  : t('studio.styleConfig.preview')}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              opacity: playingId === voiceKey(selectedVoice) ? 0.9 : 0.75,
              fontWeight: 500,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            &ldquo;{selectedVoice.label}&rdquo;
          </div>
        </button>
      ) : null}

      {error ? <BillingErrorNotice message={error} style={{ marginTop: '0.75rem' }} /> : null}

      <button
        type="button"
        className="pf-btn pf-btn-lime pf-btn-block pf-btn-lg pf-btn-icon"
        style={{ marginTop: '0.75rem' }}
        disabled={busy || Boolean(previewBusy)}
        onClick={onGenerate}
      >
        {busy
          ? t('studio.styleConfig.starting')
          : project.shots?.length
            ? t('studio.styleConfig.saveAndContinue')
            : t('studio.styleConfig.genStoryboard')}
        {!busy ? <span aria-hidden>→</span> : null}
      </button>
      <p className="pf-muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
        {t('studio.styleConfig.submitHint')}
      </p>
    </aside>
  )
}
