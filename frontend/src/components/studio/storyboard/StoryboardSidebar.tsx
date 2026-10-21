import { useRef } from 'react'
import { useI18n } from '../../../i18n'
import { api } from '../../../api'
import type { Project, Shot, Template } from '../../../api'
import { IconDownload, IconImage } from '../../ui/Icons'
import { statusLabel } from '../../../lib/status'

export interface StoryboardSidebarProps {
  project: Project
  template?: Template | null
  shots: Shot[]
  busy: boolean
  running: boolean
  totalDuration: number
  displayPrompts: {
    style_prompt: string
    character_prompt: string
    extra_prompt: string
  }
  onCoverFile: (file: File | null) => void
  useFirstShotCover: () => void
  onDownloadCsv: () => void
  onEditSettings: () => void
  onOpenPromptEdit: (prompts: {
    style_prompt: string
    character_prompt: string
    extra_prompt: string
  }) => void
}

export default function StoryboardSidebar({
  project,
  template,
  shots,
  busy,
  running,
  totalDuration,
  displayPrompts,
  onCoverFile,
  useFirstShotCover,
  onDownloadCsv,
  onEditSettings,
  onOpenPromptEdit,
}: StoryboardSidebarProps) {
  const { t } = useI18n()
  const coverInputRef = useRef<HTMLInputElement>(null)

  return (
    <aside className="pf-create-col">
      <h3>{t('studio.storyboard.projectSettings')}</h3>
      {project.cover_url || template?.preview_cover ? (
        <img
          src={api.assetUrl(project.cover_url || template?.preview_cover)}
          alt=""
          style={{ width: '100%', borderRadius: 12, aspectRatio: '16/10', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '16/10',
            borderRadius: 12,
            background: '#e8eaee',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--pf-muted)',
          }}
        >
          <IconImage size={28} />
        </div>
      )}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          onCoverFile(e.target.files?.[0] || null)
          e.target.value = ''
        }}
      />
      <div className="pf-side-actions">
        <button
          type="button"
          className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
          disabled={busy || running}
          onClick={() => coverInputRef.current?.click()}
        >
          <IconImage size={14} />
          {t('studio.storyboard.changeCover')}
        </button>
        <button
          type="button"
          className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
          disabled={busy || running || !shots.some((s) => s.image_url)}
          onClick={useFirstShotCover}
          title={t('studio.storyboard.firstFrameCoverTip')}
        >
          <IconImage size={14} />
          {t('studio.storyboard.firstFrameCover')}
        </button>
        <button
          type="button"
          className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
          disabled={shots.length === 0}
          onClick={onDownloadCsv}
        >
          <IconDownload size={14} />
          {t('studio.storyboard.exportDraft')}
        </button>
      </div>
      <ul className="pf-meta-list" style={{ marginTop: '0.85rem' }}>
        <li>
          <span>{t('studio.storyboard.projectName')}</span>
          <span>{project.title}</span>
        </li>
        <li>
          <span>{t('studio.storyboard.status')}</span>
          <span>{statusLabel(project)}</span>
        </li>
        <li>
          <span>{t('studio.storyboard.progress')}</span>
          <span>{project.progress}%</span>
        </li>
        <li>
          <span>{t('studio.storyboard.duration')}</span>
          <span>
            {Math.floor(totalDuration / 60)
              .toString()
              .padStart(2, '0')}
            :
            {Math.floor(totalDuration % 60)
              .toString()
              .padStart(2, '0')}
          </span>
        </li>
        <li>
          <span>{t('studio.storyboard.aspectRatio')}</span>
          <span>{project.output_ratio || (project.pipeline_mode === 'image_text' ? '9:16' : '16:9')}</span>
        </li>
        <li>
          <span>{t('studio.storyboard.outputMode')}</span>
          <span>
            {project.pipeline_mode === 'image_text'
              ? t('studio.storyboard.imageText')
              : t('studio.storyboard.aiVideo')}
          </span>
        </li>
        <li>
          <span>{t('studio.storyboard.style')}</span>
          <span>{template?.name || project.template_id}</span>
        </li>
      </ul>
      <button
        type="button"
        className="pf-btn pf-btn-ghost pf-btn-block pf-btn-sm"
        onClick={onEditSettings}
        disabled={running}
      >
        {t('studio.storyboard.editSettings')}
      </button>
      <div className="pf-prompt-panel">
        <h4>{t('studio.storyboard.builtinPrompts')}</h4>
        <p className="pf-muted" style={{ fontSize: '0.72rem', margin: '0 0 0.45rem' }}>
          {t('studio.storyboard.promptsTip')}
        </p>
        {(
          [
            [t('studio.storyboard.promptStyle'), displayPrompts.style_prompt],
            [t('studio.storyboard.promptCharacter'), displayPrompts.character_prompt],
            [t('studio.storyboard.promptExtra'), displayPrompts.extra_prompt],
          ] as const
        ).map(([label, value]) => (
          <button
            key={label}
            type="button"
            className="pf-prompt-chip"
            disabled={busy || running}
            title={(value || '').trim() || t('studio.storyboard.promptEmpty')}
            onClick={() =>
              onOpenPromptEdit({
                style_prompt: displayPrompts.style_prompt,
                character_prompt: displayPrompts.character_prompt,
                extra_prompt: displayPrompts.extra_prompt,
              })
            }
          >
            <strong>{label}</strong>
            <span>{(value || '').trim() || t('studio.storyboard.promptEmpty')}</span>
          </button>
        ))}
      </div>
      <p className="pf-muted" style={{ fontSize: '0.75rem', marginTop: '0.75rem' }}>
        {t('studio.storyboard.aiDisclaimer')}
      </p>
    </aside>
  )
}
