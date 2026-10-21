import { useI18n } from '../../../i18n'
import { api } from '../../../api'

export type PreviewState =
  | { kind: 'final'; url: string; title: string; bust?: string }
  | {
      kind: 'shot'
      shotNo: number
      imageUrl?: string | null
      videoUrl?: string | null
      audioUrl?: string | null
      caption?: string
      version?: number
    }
  | null

export interface StoryboardPreviewModalProps {
  preview: PreviewState
  onClose: () => void
}

export default function StoryboardPreviewModal({
  preview,
  onClose,
}: StoryboardPreviewModalProps) {
  const { t } = useI18n()

  if (!preview) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>
            {preview.kind === 'final'
              ? preview.title
              : t('studio.storyboard.shotNo').replace('{no}', String(preview.shotNo))}
          </h3>
          <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
        {preview.kind === 'final' ? (
          <video className="preview-media" src={preview.url} controls autoPlay />
        ) : preview.videoUrl ? (
          <video
            className="preview-media"
            src={api.assetUrl(preview.videoUrl, preview.version)}
            poster={
              preview.imageUrl ? api.assetUrl(preview.imageUrl, preview.version) : undefined
            }
            controls
            autoPlay
          />
        ) : preview.imageUrl ? (
          <img
            className="preview-media"
            src={api.assetUrl(preview.imageUrl, preview.version)}
            alt=""
          />
        ) : (
          <p className="pf-muted">{t('studio.storyboard.noPreview')}</p>
        )}
        {preview.kind === 'shot' && preview.audioUrl && !preview.videoUrl ? (
          <audio src={api.assetUrl(preview.audioUrl)} controls style={{ width: '100%' }} />
        ) : null}
        {preview.kind === 'shot' ? <p className="pf-muted">{preview.caption}</p> : null}
      </div>
    </div>
  )
}
