import { useMemo, useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { CurlCodeBox } from '../../components/studio/storyboard/StoryboardCurlModal'
import { useI18n } from '../../i18n'
import type { DramaAsset, DramaFragment } from '../../api/drama'
import { resolveDramaMediaUrl } from '../../api/drama'
import { api, type ExtractedPromptResult } from '../../api'
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react'

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
  projectFlowId?: string | null
  videoLanguage?: string
}

/**
 * Chuyển đổi tên tiếng Việt có dấu thành dạng viết liền không dấu (PascalCase).
 * Ví dụ: 'Nguyễn Văn Lâm' -> 'NguyenVanLam', 'Hộp kim loại' -> 'HopKimLoai'
 */
export function toVietnameseSlug(text: string): string {
  if (!text) return ''
  let s = text.replace(/đ/g, 'd').replace(/Đ/g, 'D')
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = s.match(/[a-zA-Z0-9]+/g) || []
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

/**
 * Ánh xạ loại asset sang slug tiếng Việt chuẩn: NhanVat, CanhQuay, DaoCu.
 */
export function getAssetTypeSlug(type?: string): string {
  const t = (type || '').toLowerCase().trim()
  if (t === 'character') return 'NhanVat'
  if (t === 'scene' || t === 'location') return 'CanhQuay'
  if (t === 'prop') return 'DaoCu'
  return 'NhanVat'
}

/**
 * Khử lặp chuỗi slug nếu bị lặp (vd: @asset:14_NhanVat_NguyenVanLam_NhanVat_NguyenVanLam -> @asset:14_NhanVat_NguyenVanLam).
 */
export function deduplicateAssetSlug(token: string): string {
  const match = token.match(/^@asset:(\d+)_(.+)$/)
  if (!match) return token
  const [_, aid, slug] = match
  const parts = slug.split('_')
  const half = parts.length / 2
  if (parts.length >= 2 && Number.isInteger(half)) {
    const firstHalf = parts.slice(0, half).join('_')
    const secondHalf = parts.slice(half).join('_')
    if (firstHalf === secondHalf) {
      return `@asset:${aid}_${firstHalf}`
    }
  }
  return token
}

/**
 * Thay thế @asset:<id> thành @asset:<ID>_<LoaiAsset>_<TênViếtLiềnKhôngDấu> theo danh sách tài sản (assets).
 * Ví dụ: @asset:14_NhanVat_NguyenVanLam, @asset:58_CanhQuay_NgoiLangDoNatThoiChien, @asset:32_DaoCu_ChiecCaoSat
 * Đảm bảo tính idempotent: nếu đã có slug hoặc bị lặp thì thu gọn chuẩn xác, không bao giờ nhân đôi.
 */
export function replaceAssetTokensWithSlugs(text: string, assets: DramaAsset[] = []): string {
  if (!text) return ''
  const assetMap = new Map<number, { slug: string; typeSlug: string }>()
  if (assets && assets.length > 0) {
    for (const a of assets) {
      if (a && a.id) {
        const typeSlug = getAssetTypeSlug(a.type)
        const nameSlug = a.name ? toVietnameseSlug(a.name) : `Asset${a.id}`
        assetMap.set(a.id, { slug: nameSlug, typeSlug })
      }
    }
  }
  return text.replace(/@asset:(\d+)(?:_[a-zA-Z0-9_]+)?/g, (fullMatch, idStr) => {
    const aid = Number(idStr)
    const info = assetMap.get(aid)
    if (info) {
      return `@asset:${aid}_${info.typeSlug}_${info.slug}`
    }
    return deduplicateAssetSlug(fullMatch)
  })
}

/**
 * Làm sạch kịch bản phân cảnh thô thành prompt chuẩn cho Google Flow (Veo 3.1):
 * - Loại bỏ các khối chú thích kỹ thuật đạo diễn: 【Nhạc nền...】, 【Hình ảnh...】, 【Phụ đề...】
 * - Loại bỏ các chỉ thị thời lượng: @duration:3...
 * - Bảo tồn thẻ 【Thoại · Lồng tiếng tiếng Việt】 khi chọn tiếng Việt để Flow/Veo phát âm tiếng Việt.
 * - Thay thế thẻ @asset:<id> thành @asset:<ID>_<LoaiAsset>_<TênViếtLiềnKhôngDấu>
 * - Giữ nguyên các mô tả bối cảnh, hành động và lời thoại.
 */
export function cleanFlowScript(text: string, assets: DramaAsset[] = [], videoLanguage?: string): string {
  if (!text) return ''
  const isVi = videoLanguage ? videoLanguage !== 'auto' : true
  const lines = text.split('\n')
  const outLines: string[] = []

  for (const raw of lines) {
    let line = raw.trim()
    if (!line) continue
    line = line.replace(/@duration:\d+/g, '').replace(/^[📹🎬🎥]\s*\d+\s*s$/i, '').trim()
    if (!line) continue

    // Bỏ BGM, phụ đề và các dòng giới thiệu tiêu đề đầu phim
    if (
      line.startsWith('【Nhạc nền') ||
      line.startsWith('【BGM') ||
      line.startsWith('【Phụ đề') ||
      line.startsWith('【字幕') ||
      line.startsWith('【Subtitle') ||
      line.startsWith('【Đầu phim') ||
      line.startsWith('【片头') ||
      line.startsWith('【Intro') ||
      line.startsWith('【Giới thiệu') ||
      line.startsWith('【Background') ||
      line.startsWith('【背景介绍') ||
      line.startsWith('【人物介绍')
    ) {
      continue
    }

    // Bỏ thẻ hình ảnh/cảnh trống nhưng giữ lại nội dung mô tả
    line = line.replace(/^【(?:Hình ảnh|画面|空镜|Cảnh trống|Visual|Shot)[^】]*】\s*/i, '')
    if (!line) continue

    // Xử lý dòng thoại
    if (isVi) {
      if (/^【Thoại[·\s]*Lồng tiếng tiếng Việt】/i.test(line)) {
        line = line.replace(/^【Thoại[·\s]*Lồng tiếng tiếng Việt】\s*/i, '【Thoại · Lồng tiếng tiếng Việt】 ')
      } else if (/^【(?:Thoại|Đối thoại|对白|Dialogue|Lời dẫn|旁白|Độc thoại nội tâm|内心独白)[^】]*】/i.test(line)) {
        line = line.replace(
          /^【(?:Thoại|Đối thoại|对白|Dialogue|Lời dẫn|旁白|Độc thoại nội tâm|内心独白)[^】]*】\s*/i,
          '【Thoại · Lồng tiếng tiếng Việt】 '
        )
      } else if (
        /^(@asset:\S+|(?:Lời dẫn|Người dẫn|Thuyết minh)(?:\s*\([^)]*\))?|[^\s:：]{1,24}(?:\s*\([^)]*\))?)\s*[:：]/.test(line) &&
        !line.startsWith('【')
      ) {
        line = `【Thoại · Lồng tiếng tiếng Việt】 ${line}`
      }
    } else {
      // Auto / non-vi: xóa các thẻ đối thoại thông thường nếu không cần
      line = line.replace(/^【(?:Thoại|Đối thoại|对白|Dialogue)[^】]*】\s*/i, '')
    }

    // Xóa các thẻ 【...】 phụ khác nhưng bảo tồn 【Thoại · Lồng tiếng tiếng Việt】
    line = line.replace(/【(?!Thoại · Lồng tiếng tiếng Việt)[^】]*】/g, '').trim()
    if (line) {
      outLines.push(line)
    }
  }

  return replaceAssetTokensWithSlugs(outLines.join('\n'), assets)
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
  projectFlowId,
  videoLanguage,
}: EpisodeEditCurlModalProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'flow' | 'upstream' | 'internal'>('flow')
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
    return cleanFlowScript(raw, assets, videoLanguage) || raw.trim()
  }, [fragment, assets, videoLanguage])

  // Lệnh cURL gửi trực tiếp sang cổng Flow API (neuravibemmo.dpdns.org)
  const upstreamCurl = useMemo(() => {
    const refImg = refAssets[0]?.cover || refAssets[0]?.url
    const refUrl = refImg ? resolveDramaMediaUrl(refImg) : ''

    const FLOW_FALLBACK = '746c4f17-5aa9-4cf1-b824-f8d0bd7aa6c4'
    const payloadObj = {
      reference_media_ids: refUrl ? ['media_ref_id_from_upload'] : [],
      prompt: promptText,
      project_id: projectFlowId || FLOW_FALLBACK,
      scene_id: `scene_${(fragmentIndex + 1).toString().padStart(2, '0')}`,
      aspect_ratio: aspectRatio || '9:16',
      duration_sec: duration || 8,
      model_key: 'abra_r2v_10s',
    }

    let curl = ''
    if (refUrl) {
      const firstAsset = refAssets[0]
      const assetTypeSlug = firstAsset ? getAssetTypeSlug(firstAsset.type) : 'Asset'
      const assetNameSlug = firstAsset?.name ? toVietnameseSlug(firstAsset.name) : (firstAsset ? `Asset${firstAsset.id}` : 'ref')
      const sampleFileName = firstAsset ? `${firstAsset.id}_${assetTypeSlug}_${assetNameSlug}.jpg` : 'ref_image.jpg'

      curl += `# Bước 1: Upload ảnh tham chiếu nhân vật / bối cảnh lên Flow API\n`
      curl += `curl -X POST "https://neuravibemmo.dpdns.org/api/flow/upload-image-b64" \\\n`
      curl += `  -H "Content-Type: application/json" \\\n`
      curl += `  -d '{"image_base64": "data:image/jpeg;base64,...", "project_id": "${projectFlowId || FLOW_FALLBACK}", "mime_type": "image/jpeg", "file_name": "${sampleFileName}"}'\n\n`
      curl += `# Bước 2: Gọi API tạo video Google Veo 3.1\n`
    }

    curl += `curl -X POST "https://neuravibemmo.dpdns.org/api/flow/generate-video-veo_3_1_r2v_lite_low_priority" \\\n`
    curl += `  -H "Content-Type: application/json" \\\n`
    curl += `  -d '${JSON.stringify(payloadObj, null, 2)}'`

    return curl
  }, [refAssets, promptText, fragmentIndex, aspectRatio, duration, projectFlowId])

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

  async function handleDownloadAsset(url: string, name: string) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${name.replace(/\s+/g, '_')}_ref.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
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

  // Lệnh cURL gọi qua backend GenCine
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

  const activePrompt = useMemo(() => {
    const raw = extractedPromptInfo?.prompt || fragment?.content || ''
    return cleanFlowScript(raw, assets, videoLanguage)
  }, [extractedPromptInfo?.prompt, fragment?.content, assets, videoLanguage])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Dữ liệu Phân cảnh ${(fragmentIndex + 1).toString().padStart(2, '0')} · Tạo video Google Flow & cURL`}
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
        {/* Tab chuyển đổi Google Flow / Upstream / Internal */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`drama-ep-btn ${tab === 'flow' ? 'drama-ep-btn-dark' : 'drama-ep-btn-ghost'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', height: 'auto', fontWeight: 600 }}
            onClick={() => setTab('flow')}
          >
            ✨ Tạo trên Google Flow (flow.google.com)
          </button>
          <button
            type="button"
            className={`drama-ep-btn ${tab === 'upstream' ? 'drama-ep-btn-dark' : 'drama-ep-btn-ghost'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', height: 'auto' }}
            onClick={() => setTab('upstream')}
          >
            🌐 Upstream API cURL (Veo 3.1)
          </button>
          <button
            type="button"
            className={`drama-ep-btn ${tab === 'internal' ? 'drama-ep-btn-dark' : 'drama-ep-btn-ghost'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', height: 'auto' }}
            onClick={() => setTab('internal')}
          >
            🖥️ Internal Backend cURL
          </button>
        </div>

        {/* TAB 1: GOOGLE FLOW HƯỚNG DẪN & DỮ LIỆU */}
        {tab === 'flow' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Khối hướng dẫn từng bước */}
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '0.9rem 1.1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.6rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} color="#2563eb" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e3a8a' }}>
                    Quy trình 4 bước tạo video bằng Google Flow và đưa về hệ thống:
                  </span>
                </div>
                <a
                  href="https://flow.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="drama-ep-btn drama-ep-btn-ghost"
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.25rem 0.65rem',
                    height: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: '#1d4ed8',
                    borderColor: '#93c5fd',
                    background: '#fff',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} />
                  Mở Google Flow ↗
                </a>
              </div>

              <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.6 }}>
                <li>
                  <strong>Tải ảnh tham chiếu:</strong> Nhấn nút <em>"Tải ảnh về máy"</em> ở mục Ảnh tham chiếu bên dưới.
                </li>
                <li>
                  <strong>Sao chép Prompt:</strong> Nhấn <em>"Sao chép prompt"</em> để copy câu lệnh mô tả phân cảnh đã tối ưu.
                </li>
                <li>
                  <strong>Nhập vào Google Flow (flow.google.com):</strong>
                  <ul style={{ margin: '0.2rem 0', paddingLeft: '1.1rem' }}>
                    <li>
                      Chọn mô hình <strong>Google Veo</strong>.
                    </li>
                    <li>
                      Dán văn bản vào ô <strong>Prompt</strong>.
                    </li>
                    <li>
                      Tải ảnh tham chiếu nhân vật/bối cảnh vừa lưu vào mục <strong>Reference / Ingredients</strong> (chọn vai trò <em>Character/Subject</em> để giữ đồng nhất khuôn mặt).
                    </li>
                    <li>
                      Chọn tỷ lệ <strong>{aspectRatio || '9:16'}</strong>, thời lượng <strong>{duration || 8}s</strong> và bấm <strong>Generate</strong>.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Tải video về GenCine:</strong> Tải file <code>.mp4</code> từ Google Flow về máy tính → quay lại GenCine và bấm nút <strong style={{ color: '#2563eb' }}>"Tải video lên"</strong> trên phân cảnh này.
                </li>
              </ol>
            </div>

            {/* Khối Ảnh tham chiếu */}
            <div
              style={{
                background: '#ffffff',
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
                  marginBottom: '0.7rem',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ImageIcon size={16} color="#059669" />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                    Ảnh tham chiếu nhân vật & bối cảnh ({refAssets.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Đưa ảnh này vào mục Reference Image trên Google Flow
                </span>
              </div>

              {refAssets.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {refAssets.map((asset) => {
                    const imgUrl = resolveDramaMediaUrl(asset.cover || asset.url || '')
                    const assetName = asset.name || 'Tài sản'
                    return (
                      <div
                        key={asset.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.5rem',
                          border: '1px solid #f1f5f9',
                          background: '#f8fafc',
                          borderRadius: '8px',
                        }}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={assetName}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '6px',
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '6px',
                              background: '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <ImageIcon size={18} color="#94a3b8" />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              color: '#1e293b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={assetName}
                          >
                            {assetName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                            {asset.type === 'character' ? 'Nhân vật' : asset.type === 'scene' ? 'Cảnh quay' : 'Đạo cụ'}
                          </div>
                          {imgUrl && (
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                              <button
                                type="button"
                                className="drama-ep-btn drama-ep-btn-ghost"
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.45rem',
                                  height: 'auto',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  color: '#2563eb',
                                }}
                                onClick={() => handleDownloadAsset(imgUrl, assetName)}
                                title="Tải ảnh tham chiếu này về máy tính"
                              >
                                <Download size={11} />
                                Tải ảnh
                              </button>
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="drama-ep-btn drama-ep-btn-ghost"
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.45rem',
                                  height: 'auto',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  color: '#64748b',
                                  textDecoration: 'none',
                                }}
                                title="Xem ảnh kích thước gốc"
                              >
                                <ExternalLink size={11} />
                                Xem
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.8rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  Phân cảnh này chưa gắn thẻ nhân vật nào. Hãy gắn thẻ nhân vật ở cột bên trái hoặc tải ảnh nhân vật trực tiếp từ bảng tài sản.
                </div>
              )}
            </div>

            {/* Khối Prompt Text cho Google Flow */}
            <div
              style={{
                background: '#ffffff',
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
                  marginBottom: '0.6rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <Sparkles size={16} color="#6366f1" />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                    Prompt văn bản cho Google Flow (Veo 3.1)
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#166534',
                      background: '#dcfce7',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 500,
                    }}
                  >
                    Đã lọc chuẩn Flow
                  </span>
                </div>
                <button
                  type="button"
                  className="drama-ep-btn"
                  style={{
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.82rem',
                    height: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 500,
                  }}
                  onClick={() => handleCopyPrompt(activePrompt)}
                  title="Sao chép toàn bộ Prompt text"
                >
                  {promptCopied ? <Check size={14} color="#fff" /> : <Copy size={14} />}
                  <span>{promptCopied ? 'Đã sao chép!' : 'Sao chép Prompt'}</span>
                </button>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  color: '#0f172a',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                }}
              >
                {activePrompt || (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    Chưa có nội dung prompt cho phân cảnh này.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Khối thông tin chi tiết Upstream */}
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
              Endpoint GenCine Backend:
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
