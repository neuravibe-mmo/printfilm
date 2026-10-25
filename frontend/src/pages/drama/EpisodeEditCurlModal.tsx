import { useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { CurlCodeBox } from '../../components/studio/storyboard/StoryboardCurlModal'
import { useI18n } from '../../i18n'
import type { DramaAsset, DramaFragment } from '../../api/drama'
import { resolveDramaMediaUrl } from '../../api/drama'

interface EpisodeEditCurlModalProps {
  open: boolean
  onClose: () => void
  episodeId: number
  fragment: DramaFragment | null
  fragmentIndex: number
  assets: DramaAsset[]
  aspectRatio: string
  duration: number
  modelId: string
}

export function EpisodeEditCurlModal({
  open,
  onClose,
  episodeId,
  fragment,
  fragmentIndex,
  assets,
  aspectRatio,
  duration,
  modelId,
}: EpisodeEditCurlModalProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'upstream' | 'internal'>('upstream')

  // Tìm ảnh tham chiếu từ tài sản đính kèm
  const refAssets = useMemo(() => {
    if (!fragment?.asset_ids || fragment.asset_ids.length === 0) return []
    return assets.filter((a) => fragment.asset_ids?.includes(a.id))
  }, [fragment, assets])

  const promptText = useMemo(() => {
    const raw = fragment?.content || 'A cinematic sci-fi scene in deep space'
    return raw.trim()
  }, [fragment])

  // Lệnh cURL gửi trực tiếp sang cổng Flow API (neuravibemmo.dpdns.org)
  const upstreamCurl = useMemo(() => {
    const refImg = refAssets[0]?.cover || refAssets[0]?.url
    const refUrl = refImg ? resolveDramaMediaUrl(refImg) : ''
    const escapedPrompt = promptText.replace(/"/g, '\\"').replace(/\n/g, ' ')

    const payloadObj = {
      reference_media_ids: refUrl ? ['media_ref_id_from_upload'] : [],
      prompt: escapedPrompt,
      project_id: '746c4f17-5aa9-4cf1-b824-f8d0bd7aa6c4',
      scene_id: `scene_${(fragmentIndex + 1).toString().padStart(2, '0')}`,
      aspect_ratio: aspectRatio || '9:16',
      duration_sec: duration || 8,
      model_key: 'abra_r2v_10s',
    }

    let curl = ''
    if (refUrl) {
      curl += `# Bước 1: Upload ảnh tham chiếu nhân vật / bối cảnh lên Flow API\n`
      curl += `curl -X POST "https://neuravibemmo.dpdns.org/api/flow/upload-image-b64" \\\n`
      curl += `  -H "Content-Type: application/json" \\\n`
      curl += `  -d '{"image_base64": "data:image/jpeg;base64,...", "project_id": "746c4f17-5aa9-4cf1-b824-f8d0bd7aa6c4", "mime_type": "image/jpeg"}'\n\n`
      curl += `# Bước 2: Gọi API tạo video Google Veo 3.1\n`
    }

    curl += `curl -X POST "https://neuravibemmo.dpdns.org/api/flow/generate-video-veo_3_1_r2v_lite_low_priority" \\\n`
    curl += `  -H "Content-Type: application/json" \\\n`
    curl += `  -d '${JSON.stringify(payloadObj, null, 2)}'`

    return curl
  }, [refAssets, promptText, fragmentIndex, aspectRatio, duration])

  // Lệnh cURL gọi qua backend PrintFilm
  const internalCurl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8001'
    const fragId = fragment?.id || 0
    const body = {
      fragment_ids: [fragId],
      model: modelId || 'Google Veo 3.1',
    }

    return `curl -X POST "${origin}/api/drama/episodes/${episodeId}/generate" \\\n` +
      `  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '${JSON.stringify(body, null, 2)}'`
  }, [episodeId, fragment, modelId])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Lệnh cURL API Tạo video · Phân cảnh ${(fragmentIndex + 1).toString().padStart(2, '0')}`}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
          <button
            type="button"
            className="drama-ep-btn-dark"
            style={{ height: 32, padding: '0 16px', fontSize: '0.85rem' }}
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="pf-muted" style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
          Lệnh cURL gọi API để kết xuất video cho phân cảnh này bằng mô hình{' '}
          <strong>Google Veo 3.1</strong> qua cổng máy chủ <strong>neuravibemmo.dpdns.org</strong>.
        </p>

        {/* Tab chuyển đổi Upstream / Internal */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`drama-ep-btn ${tab === 'upstream' ? 'drama-ep-btn-dark' : 'drama-ep-btn-ghost'}`}
            style={{ fontSize: '0.82rem', padding: '4px 12px', height: 'auto' }}
            onClick={() => setTab('upstream')}
          >
            🌐 Upstream API (neuravibemmo.dpdns.org)
          </button>
          <button
            type="button"
            className={`drama-ep-btn ${tab === 'internal' ? 'drama-ep-btn-dark' : 'drama-ep-btn-ghost'}`}
            style={{ fontSize: '0.82rem', padding: '4px 12px', height: 'auto' }}
            onClick={() => setTab('internal')}
          >
            🖥️ Internal API (PrintFilm Backend)
          </button>
        </div>

        {/* Khối thông tin chi tiết */}
        {tab === 'upstream' ? (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Endpoint Flow API (Google Veo 3.1):
            </div>
            <CurlCodeBox code={upstreamCurl} />

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Phản hồi mẫu thành công (JSON Response):
              </div>
              <pre
                className="pf-curl-box"
                style={{
                  fontSize: '0.8rem',
                  margin: 0,
                  color: '#94a3b8',
                  background: '#0f172a',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
{`{
  "success": true,
  "video_url": "https://neuravibemmo.dpdns.org/media/videos/veo_output_746c4f17_scene01.mp4",
  "thumbnail_url": "https://neuravibemmo.dpdns.org/media/thumbnails/thumb_scene01.jpg",
  "media_id": "media_gen_9a12b3c4"
}`}
              </pre>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Endpoint PrintFilm Backend:
            </div>
            <CurlCodeBox code={internalCurl} />

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Phản hồi mẫu thành công (JSON Response):
              </div>
              <pre
                className="pf-curl-box"
                style={{
                  fontSize: '0.8rem',
                  margin: 0,
                  color: '#94a3b8',
                  background: '#0f172a',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
{`{
  "created_task_ids": [142],
  "batch_key": "drama:episode:${episodeId}:video:a1b2c3d4",
  "message": "Đã xếp hàng tạo video cho phân cảnh"
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
