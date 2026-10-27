import { useMemo, useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { CurlCodeBox } from '../../components/studio/storyboard/StoryboardCurlModal'
import { useI18n } from '../../i18n'
import type { DramaAsset, DramaFragment } from '../../api/drama'
import { resolveDramaMediaUrl } from '../../api/drama'
import { api, type ExtractedPromptResult } from '../../api'
import { Sparkles, RefreshCw, AlertCircle, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

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
  const [extractedPromptInfo, setExtractedPromptInfo] = useState<ExtractedPromptResult | null>(null)
  const [extractingPrompt, setExtractingPrompt] = useState(false)
  const [extractPromptError, setExtractPromptError] = useState<string | null>(null)
  const [promptCopied, setPromptCopied] = useState(false)
  const [showRawGoogleFlow, setShowRawGoogleFlow] = useState(false)

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

  // Trích riêng câu lệnh cURL generate-video để gửi vào API extract-prompt-from-curl
  const generateCurlOnly = useMemo(() => {
    const idx = upstreamCurl.indexOf('curl -X POST "https://neuravibemmo.dpdns.org/api/flow/generate-video')
    if (idx !== -1) {
      return upstreamCurl.slice(idx)
    }
    return upstreamCurl
  }, [upstreamCurl])

  useEffect(() => {
    if (!open) {
      setExtractedPromptInfo(null)
      setExtractPromptError(null)
      setExtractingPrompt(false)
      return
    }

    setExtractingPrompt(true)
    setExtractPromptError(null)
    api.extractPromptFromCurl(generateCurlOnly, 'https://neuravibemmo.dpdns.org')
      .then((res) => {
        setExtractedPromptInfo(res)
      })
      .catch((err: any) => {
        setExtractPromptError(err.message || 'Không thể trích xuất prompt từ cURL')
      })
      .finally(() => {
        setExtractingPrompt(false)
      })
  }, [open, generateCurlOnly])

  async function handleReExtractPrompt() {
    setExtractingPrompt(true)
    setExtractPromptError(null)
    try {
      const res = await api.extractPromptFromCurl(generateCurlOnly, 'https://neuravibemmo.dpdns.org')
      setExtractedPromptInfo(res)
    } catch (err: any) {
      setExtractPromptError(err.message || 'Lỗi gọi API extract-prompt-from-curl')
    } finally {
      setExtractingPrompt(false)
    }
  }

  async function handleCopyPrompt(text: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    } catch {}
  }

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

            {/* Khối trích xuất Prompt text gửi lên Google Flow */}
            <div
              style={{
                marginTop: 14,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <Sparkles size={16} color="#6366f1" />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>
                    Nội dung Prompt text gửi lên Google Flow
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      fontFamily: 'monospace',
                    }}
                  >
                    POST /api/flow/extract-prompt-from-curl
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {extractedPromptInfo?.prompt && (
                    <button
                      type="button"
                      className="drama-ep-btn drama-ep-btn-ghost"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => handleCopyPrompt(extractedPromptInfo.prompt)}
                      title="Sao chép toàn bộ Prompt text"
                    >
                      {promptCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{promptCopied ? 'Đã chép' : 'Sao chép prompt'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="drama-ep-btn drama-ep-btn-ghost"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={handleReExtractPrompt}
                    disabled={extractingPrompt}
                    title="Gọi lại API extract-prompt-from-curl"
                  >
                    <RefreshCw size={13} style={{ animation: extractingPrompt ? 'pf-spin 0.8s linear infinite' : 'none' }} />
                    <span>{extractingPrompt ? 'Đang trích xuất...' : 'Trích xuất lại'}</span>
                  </button>
                </div>
              </div>

              {/* Các tag metadata đã trích xuất từ cURL */}
              {extractedPromptInfo ? (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                  {extractedPromptInfo.google_flow?.rpc_id ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: '#fef3c7',
                        color: '#92400e',
                        fontWeight: 500,
                      }}
                    >
                      RPC: <code>{extractedPromptInfo.google_flow.rpc_id}</code> ({extractedPromptInfo.google_flow.rpc_id === 'MZZa6b' ? 'r2v - có ảnh tham chiếu' : 't2v - thuần text'})
                    </span>
                  ) : null}
                  {extractedPromptInfo.model_key || extractedPromptInfo.google_flow?.model ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#334155',
                      }}
                    >
                      Model: <strong>{extractedPromptInfo.model_key || extractedPromptInfo.google_flow?.model}</strong>
                    </span>
                  ) : null}
                  {extractedPromptInfo.aspect_ratio ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#334155',
                      }}
                    >
                      Tỉ lệ: <strong>{extractedPromptInfo.aspect_ratio}</strong>
                    </span>
                  ) : null}
                  {extractedPromptInfo.reference_media_ids && extractedPromptInfo.reference_media_ids.length > 0 ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: '#ecfdf5',
                        color: '#065f46',
                      }}
                    >
                      Media tham chiếu: {extractedPromptInfo.reference_media_ids.join(', ')}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {extractingPrompt ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  <span className="pf-spinner" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                  Đang gọi API extract-prompt-from-curl để lấy prompt text...
                </div>
              ) : extractPromptError ? (
                <div
                  style={{
                    padding: '0.6rem 0.75rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#991b1b',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={15} />
                    <span>{extractPromptError}</span>
                  </div>
                  <button
                    type="button"
                    className="drama-ep-btn drama-ep-btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', height: 'auto' }}
                    onClick={handleReExtractPrompt}
                  >
                    Thử lại
                  </button>
                </div>
              ) : extractedPromptInfo?.prompt ? (
                <>
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      fontSize: '0.84rem',
                      lineHeight: 1.6,
                      color: '#0f172a',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'inherit',
                    }}
                  >
                    {extractedPromptInfo.prompt}
                  </div>

                  {extractedPromptInfo.google_flow ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#6366f1',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                        onClick={() => setShowRawGoogleFlow(!showRawGoogleFlow)}
                      >
                        {showRawGoogleFlow ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        <span>{showRawGoogleFlow ? 'Ẩn cấu trúc Google Flow RPC gốc' : 'Xem cấu trúc Google Flow RPC gốc (inner_task_prompt_structure)'}</span>
                      </button>
                      {showRawGoogleFlow ? (
                        <pre
                          className="pf-curl-box"
                          style={{
                            marginTop: '0.4rem',
                            fontSize: '0.73rem',
                            height: 'auto',
                            maxHeight: 'none',
                            overflowY: 'visible',
                          }}
                        >
                          {JSON.stringify(extractedPromptInfo.google_flow, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  Chưa có thông tin prompt trích xuất.
                </div>
              )}
            </div>

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
