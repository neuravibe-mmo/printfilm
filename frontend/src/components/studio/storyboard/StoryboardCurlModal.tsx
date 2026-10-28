import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../i18n'
import {
  api,
  getApiBase,
  type ExtractedPromptResult,
  type Project,
  type ReferenceImageItem,
  type Shot,
  type UpstreamCurlInfo,
} from '../../../api'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Images,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import Modal from '../../ui/Modal'

export function CurlCodeBox({ code, style }: { code: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <div style={{ position: 'relative' }}>
      <pre className="pf-curl-box" style={{ paddingRight: '2.8rem', ...style }}>
        {code}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '0.6rem',
          right: '0.6rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          padding: 0,
          borderRadius: '6px',
          border: '1px solid #334155',
          background: 'rgba(30, 41, 59, 0.9)',
          color: copied ? '#4ade80' : '#cbd5e1',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.15s ease',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#334155'
          e.currentTarget.style.color = '#ffffff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)'
          e.currentTarget.style.color = copied ? '#4ade80' : '#cbd5e1'
        }}
        title={copied ? 'Đã sao chép cURL!' : 'Sao chép cURL'}
        aria-label="Sao chép cURL"
      >
        {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export interface StoryboardCurlModalProps {
  open: boolean
  shot: Shot | null
  tab: 'image' | 'video'
  project: Project
  onClose: () => void
  onPreviewImage?: (url: string) => void
}

export default function StoryboardCurlModal({
  open,
  shot,
  tab,
  project,
  onClose,
  onPreviewImage,
}: StoryboardCurlModalProps) {
  const { t } = useI18n()
  const [curlCopied, setCurlCopied] = useState(false)
  const [upstreamCurl, setUpstreamCurl] = useState<UpstreamCurlInfo | null>(null)
  const [upstreamLoading, setUpstreamLoading] = useState(false)
  const [extractedPromptInfo, setExtractedPromptInfo] = useState<ExtractedPromptResult | null>(null)
  const [extractingPrompt, setExtractingPrompt] = useState(false)
  const [extractPromptError, setExtractPromptError] = useState<string | null>(null)
  const [showRawGoogleFlow, setShowRawGoogleFlow] = useState(false)
  const [curlViewMode, setCurlViewMode] = useState<'upstream' | 'internal'>('upstream')

  function getShotCurlCommand(s: Shot, targetTab: 'image' | 'video') {
    const baseUrl = getApiBase()
    const token = localStorage.getItem('token') || '<YOUR_TOKEN>'
    const loc = localStorage.getItem('printfilm.locale') || 'vi'
    const endpoint = targetTab === 'video' ? 'regen-video' : 'regen-image'

    return `curl -X POST "${baseUrl}/api/projects/${project.id}/shots/${s.id}/${endpoint}" \\
  -H "Accept-Language: ${loc}" \\
  -H "Authorization: Bearer ${token}"`
  }

  useEffect(() => {
    if (!open || !shot) {
      setUpstreamCurl(null)
      setExtractedPromptInfo(null)
      return
    }
    setCurlViewMode('upstream')
    setUpstreamLoading(true)
    api.getShotUpstreamCurl(project.id, shot.id, tab)
      .then((res) => {
        setUpstreamCurl(res)
      })
      .catch(() => {
        setUpstreamCurl(null)
      })
      .finally(() => {
        setUpstreamLoading(false)
      })
  }, [open, shot, tab, project.id])

  const activeCurlRefs = useMemo<ReferenceImageItem[]>(() => {
    if (upstreamCurl?.reference_images && upstreamCurl.reference_images.length > 0) {
      return upstreamCurl.reference_images
    }
    if (!open || !shot) return []
    const list: ReferenceImageItem[] = []
    if (tab === 'video') {
      if (shot.image_url || shot.image_ark_url) {
        list.push({
          url: shot.image_url || shot.image_ark_url || '',
          type: 'keyframe',
          label: `Ảnh phân cảnh #${String(shot.shot_no).padStart(2, '0')} (Khung hình gốc / First frame)`,
          description: `Ảnh tham chiếu chính (ID: ref_${String(shot.id).padStart(3, '0')}) bắt buộc để Google Veo (r2v) tạo video`,
          shot_no: shot.shot_no,
        })
      }
      const prevShot = project.shots
        .slice()
        .sort((a, b) => a.shot_no - b.shot_no)
        .filter((s) => s.shot_no < shot.shot_no && (s.image_url || s.image_ark_url))
        .pop()
      if (prevShot && (prevShot.last_frame_url || prevShot.image_url || prevShot.image_ark_url)) {
        list.push({
          url: prevShot.last_frame_url || prevShot.image_url || prevShot.image_ark_url || '',
          type: 'previous_tail_frame',
          label: `Khung hình nối từ cảnh trước (Cảnh ${String(prevShot.shot_no).padStart(2, '0')})`,
          description: 'Tham chiếu khung hình liền kề',
          shot_no: prevShot.shot_no,
        })
      }
    } else {
      if (shot.image_url || shot.image_ark_url) {
        list.push({
          url: shot.image_url || shot.image_ark_url || '',
          type: 'current_image',
          label: `Ảnh hiện tại (Cảnh ${String(shot.shot_no).padStart(2, '0')})`,
          description: 'Ảnh tham chiếu hiện có của cảnh khi vẽ lại',
          shot_no: shot.shot_no,
        })
      }
    }
    if (project.ref_image_url) {
      list.push({
        url: project.ref_image_url,
        type: 'character_ref',
        label: 'Nhân vật tham chiếu (Character Bible)',
        description: 'Đồng bộ ngoại hình nhân vật theo thiết lập dự án',
      })
    }
    if (project.product_image_url) {
      list.push({
        url: project.product_image_url,
        type: 'product_ref',
        label: 'Sản phẩm tham chiếu',
        description: 'Đồng bộ nhận diện sản phẩm',
      })
    }
    if (project.scene_image_url) {
      list.push({
        url: project.scene_image_url,
        type: 'scene_ref',
        label: 'Bối cảnh tham chiếu',
        description: 'Đồng bộ không gian bối cảnh',
      })
    }
    return list
  }, [upstreamCurl, open, shot, tab, project])

  async function copyCurl() {
    if (!shot) return
    const textToCopy =
      curlViewMode === 'upstream'
        ? (upstreamCurl?.curl || '')
        : getShotCurlCommand(shot, tab)
    if (!textToCopy) return
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCurlCopied(true)
      setTimeout(() => setCurlCopied(false), 2000)
    } catch {}
  }

  useEffect(() => {
    if (upstreamCurl?.extracted_flow) {
      setExtractedPromptInfo(upstreamCurl.extracted_flow)
      setExtractPromptError(null)
      setExtractingPrompt(false)
    } else if (upstreamCurl?.curl) {
      setExtractingPrompt(true)
      setExtractPromptError(null)
      api.extractPromptFromCurl(upstreamCurl.curl, upstreamCurl.domain)
        .then((res) => {
          setExtractedPromptInfo(res)
        })
        .catch((err: any) => {
          setExtractPromptError(err.message || 'Không thể trích xuất prompt từ cURL')
        })
        .finally(() => {
          setExtractingPrompt(false)
        })
    } else {
      setExtractedPromptInfo(null)
      setExtractPromptError(null)
      setExtractingPrompt(false)
    }
  }, [upstreamCurl])

  async function handleReExtractPrompt() {
    if (!upstreamCurl?.curl) return
    setExtractingPrompt(true)
    setExtractPromptError(null)
    try {
      const res = await api.extractPromptFromCurl(upstreamCurl.curl, upstreamCurl.domain)
      setExtractedPromptInfo(res)
    } catch (err: any) {
      setExtractPromptError(err.message || 'Lỗi gọi API extract-prompt-from-curl')
    } finally {
      setExtractingPrompt(false)
    }
  }

  if (!open || !shot) return null

  const modalTitle =
    tab === 'video'
      ? curlViewMode === 'upstream'
        ? 'Lệnh cURL API Tạo video (neuravibemmo.dpdns.org)'
        : 'Lệnh cURL API Tạo video'
      : curlViewMode === 'upstream'
        ? 'Lệnh cURL API Tạo ảnh (neuravibemmo.dpdns.org)'
        : 'Lệnh cURL API Tạo ảnh'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
          <button
            type="button"
            className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
            onClick={copyCurl}
          >
            {curlCopied ? <Check size={14} /> : <Copy size={14} />}
            <span>{curlCopied ? (t('studio.createProject.copiedCurl') || 'Đã sao chép cURL!') : 'Copy cURL'}</span>
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm"
            onClick={onClose}
          >
            {t('common.close') || 'Đóng'}
          </button>
        </div>
      }
    >
      <div style={{ padding: '0.25rem 0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={['pf-pill', curlViewMode === 'internal' ? 'lime active' : ''].join(' ')}
            style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}
            onClick={() => setCurlViewMode('internal')}
          >
            🖥️ Internal API (GenCine Backend)
          </button>
          <button
            type="button"
            className={['pf-pill', curlViewMode === 'upstream' ? 'lime active' : ''].join(' ')}
            style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}
            onClick={() => setCurlViewMode('upstream')}
          >
            🌐 Upstream API (neuravibemmo.dpdns.org)
          </button>
        </div>

        {/* Khối hiển thị ảnh tham chiếu cần có */}
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.86rem', color: '#1e293b' }}>
              <Images size={16} color="#0d9488" />
              <span>
                {tab === 'video'
                  ? 'Ảnh tham chiếu tạo Video (Reference Media)'
                  : 'Ảnh tham chiếu tạo Hình ảnh'}
              </span>
              {activeCurlRefs.length > 0 ? (
                <span style={{ fontSize: '0.74rem', background: '#e2e8f0', color: '#475569', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                  {activeCurlRefs.length} ảnh
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
              {tab === 'video'
                ? 'Google Veo (r2v) lấy ảnh làm khung hình gốc (First frame)'
                : 'Đồng bộ nhân vật, bối cảnh & phong cách'}
            </div>
          </div>

          {activeCurlRefs.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {activeCurlRefs.map((r, idx) => {
                const fullUrl = r.url?.startsWith('http') ? r.url : `${getApiBase()}${r.url}`
                return (
                  <div
                    key={`${r.url}-${idx}`}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '65%',
                        background: '#0f172a',
                        cursor: onPreviewImage ? 'pointer' : 'default',
                      }}
                      onClick={() => onPreviewImage && onPreviewImage(fullUrl)}
                    >
                      <img
                        src={fullUrl}
                        alt={r.label}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                    <div style={{ padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: r.type === 'keyframe' ? '#047857' : '#64748b',
                          background: r.type === 'keyframe' ? '#d1fae5' : '#f1f5f9',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          alignSelf: 'flex-start',
                        }}
                      >
                        {r.type === 'keyframe'
                          ? '⭐ Khung hình gốc (First frame)'
                          : r.type === 'previous_tail_frame'
                          ? 'Nối cảnh trước'
                          : r.type === 'character_ref'
                          ? 'Nhân vật tham chiếu'
                          : r.type === 'product_ref'
                          ? 'Sản phẩm tham chiếu'
                          : r.type === 'scene_ref'
                          ? 'Bối cảnh tham chiếu'
                          : 'Ảnh tham chiếu'}
                      </span>
                      <div
                        title={r.label}
                        style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}
                      >
                        {r.label}
                      </div>
                      {r.description ? (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
                          {r.description}
                        </div>
                      ) : null}
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="pf-prompt-ref-link"
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: '0.2rem', fontSize: '0.72rem' }}
                      >
                        <span>Mở ảnh gốc</span>
                        <ExternalLink size={11} strokeWidth={2} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.75rem',
                background: tab === 'video' ? '#fef2f2' : '#f1f5f9',
                border: tab === 'video' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                borderRadius: '8px',
                color: tab === 'video' ? '#991b1b' : '#475569',
                fontSize: '0.82rem',
              }}
            >
              <AlertCircle size={16} />
              <span>
                {tab === 'video'
                  ? '⚠️ Cảnh này chưa có ảnh phân cảnh (First frame). Google Veo r2v yêu cầu phải có ảnh tham chiếu để tạo video. Vui lòng bấm "Vẽ ảnh" trước.'
                  : 'Không có ảnh tham chiếu nào. Ảnh được vẽ hoàn toàn từ mô tả văn bản (Text-to-Image).'}
              </span>
            </div>
          )}
        </div>

        {curlViewMode === 'upstream' ? (
          <>
            {upstreamLoading ? (
              <div className="pf-prompt-loading" style={{ padding: '1.5rem 0' }}>
                <span className="pf-spinner" />
                <span>Đang tải nội dung API gửi tới neuravibemmo.dpdns.org...</span>
              </div>
            ) : upstreamCurl ? (
              <>
                <p className="pf-muted" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                  <strong>{upstreamCurl.title}</strong> — <code>{upstreamCurl.method} {upstreamCurl.url}</code>
                </p>
                <CurlCodeBox code={upstreamCurl.curl} />

                {upstreamCurl.upload_step ? (
                  <div style={{ marginTop: '1rem' }}>
                    <p className="pf-muted" style={{ margin: '0 0 0.4rem', fontSize: '0.82rem' }}>
                      <em>Bước 1 (chuẩn bị ảnh tham chiếu nếu cần):</em> <code>POST {upstreamCurl.upload_step.url}</code>
                    </p>
                    <CurlCodeBox code={upstreamCurl.upload_step.curl} style={{ fontSize: '0.75rem' }} />
                  </div>
                ) : null}

                {/* Khối trích xuất Prompt text gửi lên Google Flow */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.65rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
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
                      <button
                        type="button"
                        className="pf-btn pf-btn-ghost pf-btn-sm"
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
                      <span className="pf-spinner" style={{ marginRight: '0.5rem' }} />
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
                        className="pf-btn pf-btn-ghost pf-btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
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
              </>
            ) : (
              <p className="pf-muted">Không thể tải thông tin upstream cURL</p>
            )}
          </>
        ) : (
          <>
            <p className="pf-muted" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
              {tab === 'video' ? (t('studio.storyboard.regenVideo') || 'Tạo lại video') : (t('studio.storyboard.redrawImage') || 'Vẽ lại hình ảnh')} - <code>POST /api/projects/{project.id}/shots/{shot.id}/{tab === 'video' ? 'regen-video' : 'regen-image'}</code> · Cảnh {String(shot.shot_no).padStart(2, '0')}
            </p>
            <p className="pf-muted" style={{ margin: '0 0 0.75rem', fontSize: '0.78rem' }}>
              API nội bộ này kích hoạt background task trên backend GenCine, sau đó hệ thống sẽ chuẩn bị prompt và gửi tiếp sang neuravibemmo.dpdns.org.
            </p>
            <CurlCodeBox code={getShotCurlCommand(shot, tab)} />
          </>
        )}
      </div>
    </Modal>
  )
}
