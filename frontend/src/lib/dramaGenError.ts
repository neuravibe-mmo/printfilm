/** 漫剧生成队列：把上游/平台原始错误翻成可读中文，并附处理建议 */

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
  /** 短标题 */
  title: string
  /** 用户可读说明 */
  message: string
  /** 建议操作 */
  suggestion?: string
  /** 是否余额不足（展示充值跳转） */
  billingBlocked?: boolean
  /** 是否上游模型账户欠费（提醒管理员，非用户钱包） */
  upstreamAccountBlocked?: boolean
}

/** 是否为上游 Seedream 账户欠费 */
export function isUpstreamAccountError(message: string): boolean {
  return /AccountOverdueError|上游 Seedream 账户欠费|上游.*账户欠费/i.test(message)
}

// 从 Seedance JSON 文案里取出 content[n]
function extractContentIndex(raw: string): number | null {
  const m = raw.match(/content\[(\d+)\]/i)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/** 判断文案是否像「具体根因」（优先于「重试上限」等包装句） */
function looksLikeRootCause(text: string): boolean {
  return /PrivacyInformation|InputImageSensitive|SensitiveContentDetected|参考图疑似|参考音频过短|may contain real person|Seedance create error|上一镜失败|无法衔接|分镜已变更|分镜上下文|InputTextSensitive|resource download failed|audio_url|audio duration|Credits insufficient|File type not supported|参考图格式不支持/i.test(
    text,
  )
}

// 从错误里尽量抽出已标注的槽位名（后端 content_labels）
function extractNamedSlot(text: string): string | null {
  const named = text.match(/(角色|场景|道具|旁白|参考图|音色)「([^」]+)」/)
  if (named) return `${named[1]}「${named[2]}」`
  return null
}

/**
 * 从多条候选错误里挑出最具体的根因（例如隐私图审核），
 * 避免只展示「重试超过上限」这类包装文案。
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
 * 将任务 error / error_message 转为前端展示文案。
 * 已是中文短句时尽量保留，仅补建议。
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

  if (/ReadTimeout|WriteTimeout|等待上游超时|响应超时/i.test(text)) {
    return {
      title: te('upstreamTimeout'),
      message: text.length > 200 ? `${text.slice(0, 200)}…` : text,
      suggestion:
        te('suggTimeout'),
    }
  }

  if (/网络错误|ConnectError|ConnectTimeout|无法连接上游|tokenfree\.com|api\.kie\.ai/i.test(text)) {
    return {
      title: te('noConnect'),
      message: text.length > 200 ? `${text.slice(0, 200)}…` : text,
      suggestion:
        te('suggConnect'),
    }
  }

  if (/^生图失败$/.test(text)) {
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
      message: /余额不足|请先充值/.test(text) ? text : te('insufficientMsg'),
      suggestion: te('suggInsufficient'),
      billingBlocked: true,
    }
  }

  if (
    /参考图疑似真人|PrivacyInformation|InputImageSensitive|SensitiveContentDetected|may contain real person/i.test(
      text,
    )
  ) {
    const idx = extractContentIndex(text)
    const named = text.match(/(角色|场景|道具|参考图)「([^」]+)」/)
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

  if (/重试超过上限|超过重试上限|内部自动重试超过上限/.test(text)) {
    return {
      title: te('retryExhausted'),
      message: text,
      suggestion:
        te('suggRetryExhausted'),
    }
  }

  if (/上一镜失败|无法衔接尾帧/.test(text)) {
    return {
      title: te('prevShotFailed'),
      message: te('prevShotFailedMsg'),
      suggestion: te('suggPrevShot'),
    }
  }

  if (/分镜已变更|分镜上下文丢失|分镜不存在/.test(text)) {
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

  // Seedance r2v：reference_audio 须 ≥ 1.8 秒（不是参考图）
  if (/audio duration|参考音频过短|1\.8/i.test(text) && /audio|音色|reference_audio|content\[/i.test(text)) {
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

  if (/Credits insufficient|积分不足|余额不足.*[Kk]ie|Kie.*积分/i.test(text)) {
    return {
      title: te('creditsInsufficient'),
      message: te('creditsInsufficientMsg'),
      suggestion: te('suggCredits'),
      upstreamAccountBlocked: true,
    }
  }

  if (/File type not supported|参考图格式不支持|不支持 SVG/i.test(text)) {
    return {
      title: te('fileTypeUnsupported'),
      message: text.includes('参考图格式不支持') ? text : te('fileTypeUnsupportedMsg'),
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

  if (/Seedance|上游生成失败/i.test(text)) {
    return {
      title: te('videoGenFailed'),
      message: text.length > 160 ? `${text.slice(0, 160)}…` : text,
      suggestion: te('suggVideo'),
    }
  }

  if (/跳过重复任务|分镜已生成完成/.test(text)) {
    return {
      title: te('skippedDup'),
      message: te('skippedDupMsg'),
      suggestion: te('suggSkipped'),
    }
  }

  if (/已取消|任务已中断/.test(text)) {
    return {
      title: text.includes('取消') ? te('cancelled') : te('interrupted'),
      message: text,
      suggestion: te('suggCancelled'),
    }
  }

  // 已是较短中文：原样展示，补通用建议
  if (!/[{\\[\]"]/.test(text) && text.length <= 120 && /[\u4e00-\u9fff]/.test(text)) {
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

/** 弹窗展示生成失败（含上游欠费 / 用户余额不足等） */
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
