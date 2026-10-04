/** Hàng đợi tạo truyện tranh: Dịch các lỗi gốc ở thượng nguồn/nền tảng sang tiếng Trung dễ đọc, kèm theo các đề xuất xử lý */

import { dialog } from './dialog'
import { isBillingError } from './billingError'
import { getActiveLocale } from '../i18n/detect'
import { messages } from '../i18n/messages'

function gErr() {
  const locale = getActiveLocale()
  const m = messages[locale] as unknown as { drama?: { genError?: Record<string, string> } }
  return m?.drama?.genError ?? {}
}
function te(key: string, vars?: Record<string, string | number>): string {
  const map = gErr()
  let str = map[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\{${k}\}`, 'g'), String(v))
    }
  }
  return str
}

export type DramaGenErrorView = {
  /** Tiêu đề ngắn */
  title: string
  /** Mô tả mà người dùng có thể đọc được */
  message: string
  /** Hành động được đề xuất */
  suggestion?: string
  /** Số dư có đủ không (hiển thị bước nhảy nạp tiền) */
  billingBlocked?: boolean
  /** Tài khoản mô hình ngược dòng có bị truy thu hay không (nhắc nhở quản trị viên, ví không phải của người dùng) */
  upstreamAccountBlocked?: boolean
}

/** Tài khoản Seedream ngược dòng có bị truy thu không? */
export function isUpstreamAccountError(message: string): boolean {
  return /AccountOverdueError|上游 Seedream 账户欠费|上游.*账户欠费|Tài khoản Seedream đã hết số dư|Tài khoản.*hết số dư/i.test(message)
}

// Nhận nội dung[n] từ bản sao JSON của Seedance
function extractContentIndex(raw: string): number | null {
  const m = raw.match(/content\[(\d+)\]/i)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/** Xác định xem bản sao có giống với "nguyên nhân gốc rễ cụ thể" hay không (ưu tiên các câu đóng gói như "giới hạn thử lại") */
function looksLikeRootCause(text: string): boolean {
  return /PrivacyInformation|InputImageSensitive|SensitiveContentDetected|参考图疑似|参考音频过短|may contain real person|Seedance create error|上一镜失败|无法衔接|分镜已变更|分镜上下文|InputTextSensitive|resource download failed|audio_url|audio duration|Credits insufficient|File type not supported|参考图格式不支持|Ảnh tham chiếu nghi ngờ|Âm thanh tham chiếu quá ngắn|Phân cảnh trước thất bại|Không thể nối khung hình cuối|Phân cảnh đã thay đổi|Ngữ cảnh phân cảnh|Định dạng ảnh tham chiếu không được hỗ trợ/i.test(
    text,
  )
}

// Hãy thử trích xuất các tên vị trí được gắn nhãn từ lỗi (nội dung phụ trợ)
function extractNamedSlot(text: string): string | null {
  const named = text.match(/(角色|场景|道具|旁白|参考图|音色|Nhân vật|Bối cảnh|Cảnh|Đạo cụ|Lời bình|Ảnh tham chiếu|Âm sắc)「([^」]+)」/)
  if (named) return `${named[1]}「${named[2]}」`
  return null
}

/**
 * Chọn nguyên nhân cốt lõi cụ thể nhất từ nhiều lỗi ứng cử viên (chẳng hạn như xem xét bản đồ quyền riêng tư),
 * Tránh chỉ hiển thị bản sao đóng gói như "Thử lại vượt quá giới hạn".
 */
export function pickRootDramaGenError(
  candidates: Array<string | null | undefined>,
): string {
  const cleaned = candidates.map((c) => String(c || '').trim()).filter(Boolean)
  const root = cleaned.find(looksLikeRootCause)
  if (root) return root
  return cleaned[0] || ''
}

/**
 * Dịch các trạng thái tiến độ hoặc thông báo ngắn của tác vụ sang ngôn ngữ hiện tại (tiếng Việt mặc định)
 */
export function localizeDramaJobMessage(raw: string | null | undefined): string {
  const text = String(raw || '').trim()
  if (!text) return ''

  const locale = getActiveLocale()
  const isEn = locale === 'en'
  const isZh = locale === 'zh'

  const dict: Record<string, { vi: string; en: string }> = {
    '上游生成中': { vi: 'Máy chủ AI đang tạo', en: 'Generating upstream' },
    '生图中': { vi: 'Đang tạo ảnh', en: 'Generating image' },
    '排队中': { vi: 'Đang xếp hàng', en: 'In queue' },
    '生成中': { vi: 'Đang tạo', en: 'Generating' },
    '待确认': { vi: 'Chờ xác nhận', en: 'Pending confirmation' },
    '参考图已就绪，开始生成视频': { vi: 'Ảnh tham chiếu đã sẵn sàng, bắt đầu tạo video', en: 'Reference images ready, starting video generation' },
    '已提交上游，正在检查结果': { vi: 'Đã gửi máy chủ AI, đang kiểm tra kết quả', en: 'Submitted upstream, checking results' },
    '参考资源已就绪，重新排队': { vi: 'Tài nguyên tham chiếu đã sẵn sàng, gửi lại vào hàng đợi', en: 'Reference resources ready, requeued' },
    '分镜已变更，请重新生成': { vi: 'Phân cảnh đã thay đổi, vui lòng tạo lại', en: 'Shot changed, please regenerate' },
    '上游生成失败': { vi: 'Máy chủ AI tạo thất bại', en: 'Upstream generation failed' },
    '生图失败': { vi: 'Tạo ảnh thất bại', en: 'Image generation failed' },
    '生成视频失败': { vi: 'Tạo video thất bại', en: 'Video generation failed' },
    '分集大纲已就绪，开始生成...': { vi: 'Đề cương phân tập đã sẵn sàng, bắt đầu tạo...', en: 'Episode outline ready, generating...' },
    '分集剧本已完成': { vi: 'Kịch bản phân tập đã hoàn thành', en: 'Episode script completed' },
    '任务已取消': { vi: 'Tác vụ đã bị hủy', en: 'Task cancelled' },
  }

  // Xử lý mẫu regex tiến độ ảnh tham chiếu
  const refImgZh = text.match(/正在生成参考图\s*(\d+\/\d+)/)
  if (refImgZh) {
    return isEn ? `Generating reference image ${refImgZh[1]}` : `Đang tạo ảnh tham chiếu ${refImgZh[1]}`
  }
  const refImgVi = text.match(/Đang tạo ảnh tham chiếu\s*(\d+\/\d+)/i)
  if (refImgVi && isEn) {
    return `Generating reference image ${refImgVi[1]}`
  }

  // Xử lý mẫu regex tiến độ kịch bản phân tập
  const scriptProgZh = text.match(/分集剧本进度\s*(\d+\/\d+)/)
  if (scriptProgZh) {
    return isEn ? `Episode script progress ${scriptProgZh[1]}` : `Tiến độ kịch bản phân tập ${scriptProgZh[1]}`
  }
  const scriptProgVi = text.match(/Tiến độ kịch bản phân tập\s*(\d+\/\d+)/i)
  if (scriptProgVi && isEn) {
    return `Episode script progress ${scriptProgVi[1]}`
  }

  if (dict[text]) {
    if (isZh) return text
    return isEn ? dict[text].en : dict[text].vi
  }

  return text
}

/**
 * Chuyển đổi tác vụ error / error_message thành bản sao chép hiển thị ở giao diện người dùng.
 * Nếu đó đã là một câu ngắn bằng tiếng Trung hoặc tiếng Việt, hãy cố gắng giữ lại và chỉ thêm gợi ý.
 */
export function formatDramaGenError(raw: string | null | undefined): DramaGenErrorView {
  const text = String(raw || '').trim()
  if (!text) {
    return {
      title: te('genFailed'),
      message: te('noErrorInfo'),
      suggestion: te('suggRetryNetwork'),
    }
  }

  if (/ReadTimeout|WriteTimeout|等待上游超时|响应超时|Hết thời gian chờ máy chủ AI|Hết thời gian phản hồi/i.test(text)) {
    return {
      title: te('upstreamTimeout'),
      message: text.length > 200 ? `${text.slice(0, 200)}…` : text,
      suggestion:
        te('suggTimeout'),
    }
  }

  if (/网络错误|ConnectError|ConnectTimeout|无法连接上游|Không thể kết nối máy chủ AI|Lỗi kết nối|tokenfree\.com|api\.kie\.ai/i.test(text)) {
    return {
      title: te('noConnect'),
      message: text.length > 200 ? `${text.slice(0, 200)}…` : text,
      suggestion:
        te('suggConnect'),
    }
  }

  if (/^(生图失败|Tạo ảnh thất bại)$/i.test(text)) {
    return {
      title: te('genImageFailed'),
      message: te('genImageFailedMsg'),
      suggestion: te('suggGenImageFailed'),
    }
  }

  if (isUpstreamAccountError(text) || (/Seedream error 403/i.test(text) && /AccountOverdue/i.test(text))) {
    return {
      title: te('upstreamOverdue'),
      message: te('upstreamOverdueMsg'),
      suggestion: te('suggUpstreamOverdue'),
      upstreamAccountBlocked: true,
    }
  }

  if (isBillingError(text)) {
    return {
      title: te('insufficient'),
      message: /余额不足|请先充值|Số dư không đủ|Vui lòng nạp tiền trước/.test(text) ? text : te('insufficientMsg'),
      suggestion: te('suggInsufficient'),
      billingBlocked: true,
    }
  }

  if (
    /参考图疑似真人|PrivacyInformation|InputImageSensitive|SensitiveContentDetected|may contain real person|Ảnh tham chiếu nghi ngờ người thật/i.test(
      text,
    )
  ) {
    const idx = extractContentIndex(text)
    const named = text.match(/(角色|场景|道具|参考图|Nhân vật|Bối cảnh|Cảnh|Đạo cụ|Ảnh tham chiếu)「([^」]+)」/)
    if (named) {
      return {
        title: te('privacyRef'),
        message: te('privacyRefNamedMsg', { type: named[1], name: named[2] }),
        suggestion: te('privacyRefNamedSugg', { name: named[2] }),
      }
    }
    const where =
      idx != null
        ? te('privacyWhereIdx', { i: idx + 1, idx })
        : te('privacyWhereUnknown')
    return {
      title: te('privacyRef'),
      message: `${te('privacyRefMsg')}${where}${te('privacyRefMsgSuffix')}`,
      suggestion: te('suggPrivacy'),
    }
  }

  if (/重试超过上限|超过重试上限|内部自动重试超过上限|vượt quá giới hạn thử lại|tự động thử lại.*vượt quá giới hạn/i.test(text)) {
    return {
      title: te('retryExhausted'),
      message: text,
      suggestion:
        te('suggRetryExhausted'),
    }
  }

  if (/上一镜失败|无法衔接尾帧|Phân cảnh trước thất bại|Không thể nối khung hình cuối/i.test(text)) {
    return {
      title: te('prevShotFailed'),
      message: te('prevShotFailedMsg'),
      suggestion: te('suggPrevShot'),
    }
  }

  if (/分镜已变更|分镜上下文丢失|分镜不存在|Phân cảnh đã thay đổi|Mất ngữ cảnh phân cảnh|Phân cảnh không tồn tại/i.test(text)) {
    return {
      title: te('shotChanged'),
      message: te('shotChangedMsg'),
      suggestion: te('suggShotChanged'),
    }
  }

  if (/InputTextSensitive|text.*sensitive|敏感/i.test(text) && /Seedance|create error/i.test(text)) {
    return {
      title: te('textSensitive'),
      message: te('textSensitiveMsg'),
      suggestion: te('suggTextSensitive'),
    }
  }

  if (/resource download failed|audio_url/i.test(text) && !/audio duration/i.test(text)) {
    return {
      title: te('audioDownloadFailed'),
      message: te('audioDownloadFailedMsg'),
      suggestion: te('suggAudioDownload'),
    }
  }

  // Seedance r2v: reference_audio phải ≥ 1,8 giây (không phải hình ảnh tham chiếu)
  if (/audio duration|参考音频过短|Âm thanh tham chiếu quá ngắn|1\.8/i.test(text) && /audio|音色|reference_audio|content\[|Âm thanh|Âm sắc/i.test(text)) {
    const idx = extractContentIndex(text)
    const named = extractNamedSlot(text)
    const where =
      named ||
      (idx != null ? te('audioWhereIdx', { i: idx + 1, idx }) : te('audioWhereUnknown'))
    return {
      title: te('audioTooShort'),
      message: `${te('audioTooShortMsg')}${where}。`,
      suggestion: te('suggAudioTooShort'),
    }
  }

  if (/only support adaptive aspect ratio|adaptive aspect ratio/i.test(text)) {
    return {
      title: te('aspectIncompat'),
      message: te('aspectIncompatMsg'),
      suggestion: te('suggAspect'),
    }
  }

  if (/Credits insufficient|积分不足|余额不足.*[Kk]ie|Kie.*积分|Điểm không đủ/i.test(text)) {
    return {
      title: te('creditsInsufficient'),
      message: te('creditsInsufficientMsg'),
      suggestion: te('suggCredits'),
      upstreamAccountBlocked: true,
    }
  }

  if (/File type not supported|参考图格式不支持|不支持 SVG|Định dạng ảnh tham chiếu không được hỗ trợ/i.test(text)) {
    return {
      title: te('fileTypeUnsupported'),
      message: text.includes('参考图格式不支持') || text.includes('Định dạng ảnh tham chiếu không được hỗ trợ') ? text : te('fileTypeUnsupportedMsg'),
      suggestion: te('suggFileType'),
    }
  }

  if (/Seedance create error\s*400|Kie createTask error/i.test(text)) {
    const idx = extractContentIndex(text)
    const named = extractNamedSlot(text)
    const where =
      named ||
      (idx != null ? te('createWhereIdx', { i: idx + 1, idx }) : '')
    return {
      title: te('createRejected'),
      message: `${te('createRejectedMsg')}${where}。`,
      suggestion: te('suggCreate'),
    }
  }

  if (/Seedance|上游生成失败|Máy chủ AI tạo thất bại/i.test(text)) {
    return {
      title: te('videoGenFailed'),
      message: text.length > 160 ? `${text.slice(0, 160)}…` : text,
      suggestion: te('suggVideo'),
    }
  }

  if (/跳过重复任务|分镜已生成完成|Bỏ qua tác vụ trùng lặp|Phân cảnh đã tạo hoàn thành/i.test(text)) {
    return {
      title: te('skippedDup'),
      message: te('skippedDupMsg'),
      suggestion: te('suggSkipped'),
    }
  }

  if (/已取消|任务已中断|Đã hủy|Tác vụ đã bị hủy|Tác vụ bị gián đoạn/i.test(text)) {
    return {
      title: /取消|hủy/i.test(text) ? te('cancelled') : te('interrupted'),
      message: text,
      suggestion: te('suggCancelled'),
    }
  }

  // Câu ngắn hiển thị nguyên trạng, kèm theo gợi ý bổ sung
  if (!/[{\\[\]"]/.test(text) && text.length <= 120) {
    return {
      title: te('genFailed'),
      message: text,
      suggestion: te('suggGeneric'),
    }
  }

  return {
    title: te('genFailed'),
    message: text.length > 200 ? `${text.slice(0, 200)}…` : text,
    suggestion: te('suggCheck'),
  }
}

/** Không thể tạo màn hình bật lên (bao gồm cả các khoản nợ ngược dòng/số dư người dùng không đủ, v.v.) */
export async function alertDramaGenError(raw: unknown): Promise<void> {
  const text = raw instanceof Error ? raw.message : String(raw || '')
  const view = formatDramaGenError(text)
  const body = [view.message, view.suggestion].filter(Boolean).join('\n\n')
  await dialog.alert({
    title: view.title,
    message: body || view.title,
    tone: 'danger',
  })
}
