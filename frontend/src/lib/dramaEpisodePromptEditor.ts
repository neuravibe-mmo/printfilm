/** Trình chỉnh sửa tập lệnh tập: hiển thị và tuần tự hóa thẻ nội dung/thời lượng nội tuyến */
export type DramaMentionChipData = {
  assetId: number
  label: string
  previewUrl: string | null
}

export const DURATION_CHIP_SELECTOR = '[data-duration-sec]'
export const MENTION_CHIP_SELECTOR = "[data-mention='true']"
export const CONTENT_TOKEN_PATTERN = /@(asset:\d+|duration:\d+)/g
export const DURATION_PRESET_OPTIONS = [3, 4, 5, 8, 10, 12, 15] as const
/** Đề xuất bảng phân cảnh mới: Tổng giới hạn trên trong @duration trong khung (giây) */
export const FRAGMENT_CONTENT_DURATION_MAX = 15
/** Giới hạn trên cứng của ống kính đơn Seedance/API (giây); bản nháp cũ có thể cao hơn giá trị đề xuất */
export const DRAMA_SHOT_DURATION_HARD_MAX = 30
/** Phân đoạn đơn @duration giới hạn dưới (giây) */
export const DRAMA_SEGMENT_DURATION_MIN = 3
/** Đề xuất bảng phân cảnh mới: giới hạn trên @duration phân đoạn đơn (giây) */
export const DRAMA_SEGMENT_DURATION_MAX = 15
/** Giới hạn trên cứng của API @duration phân đoạn đơn (giây) */
export const DRAMA_SEGMENT_DURATION_HARD_MAX = 30

const BLOCK_ELEMENT_TAGS = new Set(['DIV', 'P'])

export type MentionCaretRect = {
  top: number
  left: number
  bottom: number
}

// Biểu tượng Slate (SVG nội tuyến, tránh phụ thuộc vào Reac-dom/server)
function createClapperboardIconElement() {
  const iconWrap = document.createElement('span')
  iconWrap.className = 'drama-ep-chip-icon'
  iconWrap.setAttribute('aria-hidden', 'true')
  iconWrap.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>'
  return iconWrap
}

// Xác định xem nút có nằm trong nhãn tham chiếu hay không
function isInsideMentionChip(node: Node | null) {
  if (!node) return false
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  return Boolean(element?.closest(MENTION_CHIP_SELECTOR))
}

// Đó có phải là phần tử chip nội dung/thời lượng hay không
function isEditorChipElement(node: Node | null): node is HTMLElement {
  return Boolean(
    node &&
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).dataset?.mention === 'true',
  )
}

// Đã bỏ qua văn bản trống/ký tự có độ rộng bằng 0
function isIgnorableEditorText(node: Node | null) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return false
  return !(node.textContent || '').replace(/[\u200b\uFEFF]/g, '')
}

// Các nút văn bản chỉ chứa khoảng trắng bình thường (phân định khoảng trắng được chèn sau chip)
function isSpacerTextNode(node: Node | null): node is Text {
  if (!node || node.nodeType !== Node.TEXT_NODE) return false
  const text = node.textContent || ''
  return text.length > 0 && /^[\s\u00a0]+$/.test(text)
}

// Tìm chip tương ứng từ nút trở lên
function closestEditorChip(node: Node | null, root: HTMLElement): HTMLElement | null {
  if (!node || !root.contains(node)) return null
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  const chip = element?.closest(MENTION_CHIP_SELECTOR) as HTMLElement | null
  return chip && root.contains(chip) ? chip : null
}

/**
 * Xóa thẻ contentEditable=false liền kề với con trỏ.
 * Các trình duyệt thường không có tác dụng Backspace/Xóa các chip không thể chỉnh sửa và cần phải xóa thủ công.
 * Trả về true để cho biết nó đã được xử lý.
 */
export function deleteAdjacentEditorChip(
  root: HTMLElement,
  direction: 'backward' | 'forward',
): boolean {
  const selection = window.getSelection()
  if (!selection || !selection.isCollapsed || selection.rangeCount === 0) return false
  const { anchorNode, anchorOffset } = selection
  if (!anchorNode || !root.contains(anchorNode)) return false

  const inside = closestEditorChip(anchorNode, root)
  if (inside) {
    placeCaretAndRemoveChip(selection, inside, null)
    return true
  }

  let chip: HTMLElement | null = null
  let spacer: Node | null = null

  if (direction === 'backward') {
    if (anchorNode.nodeType === Node.TEXT_NODE) {
      const text = anchorNode.textContent || ''
      if (anchorOffset === 0) {
        let prev: Node | null = anchorNode.previousSibling
        while (prev && isIgnorableEditorText(prev)) prev = prev.previousSibling
        if (isSpacerTextNode(prev) && isEditorChipElement(prev.previousSibling)) {
          chip = prev.previousSibling
          spacer = prev
        } else if (isEditorChipElement(prev)) {
          chip = prev
        }
      } else if (anchorOffset === text.length && isSpacerTextNode(anchorNode) && text.length <= 2) {
        /* Con trỏ ở cuối khoảng cách ngăn cách sau chip: xóa dấu cách + chip cùng một lúc */
        const prev = anchorNode.previousSibling
        if (isEditorChipElement(prev)) {
          chip = prev
          spacer = anchorNode
        }
      } else if (
        anchorOffset > 0 &&
        isSpacerTextNode(anchorNode) &&
        /^[\s\u00a0]$/.test(text.slice(anchorOffset - 1, anchorOffset)) &&
        isEditorChipElement(anchorNode.previousSibling)
      ) {
        /* Con trỏ gần đến khoảng cách ngăn cách: xóa dấu cách và chip */
        chip = anchorNode.previousSibling
        spacer = anchorNode
      }
    } else if (anchorNode.nodeType === Node.ELEMENT_NODE && anchorOffset > 0) {
      let prev: Node | null = anchorNode.childNodes[anchorOffset - 1] || null
      while (prev && isIgnorableEditorText(prev)) {
        prev = prev.previousSibling
      }
      if (isSpacerTextNode(prev) && isEditorChipElement(prev.previousSibling)) {
        chip = prev.previousSibling
        spacer = prev
      } else if (isEditorChipElement(prev)) {
        chip = prev
      }
    }
  } else if (direction === 'forward') {
    if (anchorNode.nodeType === Node.TEXT_NODE) {
      const text = anchorNode.textContent || ''
      if (anchorOffset >= text.length) {
        let next: Node | null = anchorNode.nextSibling
        while (next && isIgnorableEditorText(next)) next = next.nextSibling
        if (isEditorChipElement(next)) {
          chip = next
          const after = next.nextSibling
          if (isSpacerTextNode(after)) spacer = after
        } else if (isSpacerTextNode(next) && isEditorChipElement(next.nextSibling)) {
          spacer = next
          chip = next.nextSibling
        }
      }
    } else if (anchorNode.nodeType === Node.ELEMENT_NODE) {
      let next: Node | null = anchorNode.childNodes[anchorOffset] || null
      while (next && isIgnorableEditorText(next)) next = next.nextSibling
      if (isEditorChipElement(next)) {
        chip = next
        const after = next.nextSibling
        if (isSpacerTextNode(after)) spacer = after
      } else if (isSpacerTextNode(next) && isEditorChipElement(next.nextSibling)) {
        spacer = next
        chip = next.nextSibling
      }
    }
  }

  if (!chip || !root.contains(chip)) return false
  placeCaretAndRemoveChip(selection, chip, spacer)
  return true
}

// Loại bỏ chip (và khoảng cách ngăn cách tùy chọn) và con trỏ sẽ được đặt ở vị trí ban đầu
function placeCaretAndRemoveChip(
  selection: Selection,
  chip: HTMLElement,
  spacer: Node | null,
) {
  const caretRange = document.createRange()
  caretRange.setStartBefore(chip)
  caretRange.collapse(true)
  spacer?.parentNode?.removeChild(spacer)
  chip.remove()
  selection.removeAllRanges()
  selection.addRange(caretRange)
}

// Nối văn bản có ngắt dòng dưới dạng Text + <br>
function appendTextWithLineBreaks(root: HTMLElement, text: string) {
  const parts = text.split('\n')
  parts.forEach((part, index) => {
    if (part) root.appendChild(document.createTextNode(part))
    if (index < parts.length - 1) root.appendChild(document.createElement('br'))
  })
}

// Tạo thẻ tham chiếu nội dung nội tuyến
export function createMentionChipElement(chip: DramaMentionChipData) {
  const chipEl = document.createElement('span')
  chipEl.className = 'drama-ep-mention-chip drama-ep-editor-chip'
  chipEl.contentEditable = 'false'
  chipEl.dataset.mention = 'true'
  chipEl.dataset.assetId = String(chip.assetId)

  const thumbEl = document.createElement('span')
  thumbEl.className = 'drama-ep-mention-chip-thumb'
  if (chip.previewUrl) {
    const image = document.createElement('img')
    image.src = chip.previewUrl
    image.alt = chip.label
    image.draggable = false
    thumbEl.appendChild(image)
  } else {
    thumbEl.className += ' is-fallback'
    thumbEl.textContent = chip.label[0] || '资'
  }
  chipEl.appendChild(thumbEl)

  const labelEl = document.createElement('span')
  labelEl.className = 'drama-ep-mention-chip-label'
  labelEl.textContent = chip.label
  chipEl.appendChild(labelEl)
  return chipEl
}

// Tạo thẻ thời lượng nội tuyến
export function createDurationChipElement(seconds: number) {
  const chipEl = document.createElement('span')
  chipEl.className = 'drama-ep-duration-chip drama-ep-editor-chip'
  chipEl.contentEditable = 'false'
  chipEl.dataset.mention = 'true'
  chipEl.dataset.durationSec = String(seconds)
  chipEl.title = `时长 ${seconds}s，编辑时点击切换`

  const labelEl = document.createElement('span')
  labelEl.dataset.durationLabel = 'true'
  labelEl.textContent = `${seconds}s`

  chipEl.appendChild(createClapperboardIconElement())
  chipEl.appendChild(labelEl)
  return chipEl
}

// Cập nhật nhãn thời lượng hiện có giây
export function updateDurationChipElement(chipEl: HTMLElement, seconds: number) {
  chipEl.dataset.durationSec = String(seconds)
  chipEl.title = `时长 ${seconds}s，编辑时点击切换`
  const labelEl = chipEl.querySelector<HTMLElement>('[data-duration-label]')
  if (labelEl) labelEl.textContent = `${seconds}s`
}

// Khi nhấp vào nhãn thời lượng phương tiện chặn, hãy chuyển qua các giây đặt trước
export function nextDurationPresetSeconds(current: number) {
  const presets = DURATION_PRESET_OPTIONS
  const idx = presets.findIndex((sec) => sec === current)
  if (idx < 0) {
    const next = presets.find((sec) => sec > current)
    return next ?? presets[presets.length - 1]
  }
  return presets[(idx + 1) % presets.length]
}

// Chèn nhãn thời lượng tại Phạm vi
export function insertDurationChipAtRange(range: Range, seconds: number) {
  const selection = window.getSelection()
  range.deleteContents()
  const chipEl = createDurationChipElement(seconds)
  const trailingSpace = document.createTextNode(' ')
  range.insertNode(trailingSpace)
  range.insertNode(chipEl)
  if (!selection) return
  const caretRange = document.createRange()
  caretRange.setStartAfter(trailingSpace)
  caretRange.collapse(true)
  selection.removeAllRanges()
  selection.addRange(caretRange)
}

// Chèn văn bản thuần túy tại Phạm vi (tiền tố chuyển động/cảnh của camera, v.v.)
export function insertPlainTextAtRange(range: Range, text: string) {
  const selection = window.getSelection()
  range.deleteContents()
  const node = document.createTextNode(text)
  range.insertNode(node)
  if (!selection) return
  const caretRange = document.createRange()
  caretRange.setStartAfter(node)
  caretRange.collapse(true)
  selection.removeAllRanges()
  selection.addRange(caretRange)
}

// Chèn thẻ nội dung tại Phạm vi
export function insertMentionChipAtRange(range: Range, chip: DramaMentionChipData) {
  const selection = window.getSelection()
  range.deleteContents()
  const chipEl = createMentionChipElement(chip)
  const trailingSpace = document.createTextNode(' ')
  range.insertNode(trailingSpace)
  range.insertNode(chipEl)
  if (!selection) return
  const caretRange = document.createRange()
  caretRange.setStartAfter(trailingSpace)
  caretRange.collapse(true)
  selection.removeAllRanges()
  selection.addRange(caretRange)
}

// Tuần tự hóa DOM của trình soạn thảo thành chuỗi nội dung
export function serializePromptEditorContent(root: HTMLElement) {
  let result = ''

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (isInsideMentionChip(node)) return
      result += node.textContent ?? ''
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const element = node as HTMLElement
    if (element.tagName === 'BR') {
      result += '\n'
      return
    }
    if (element.dataset.mention === 'true' && element.dataset.durationSec) {
      result += `@duration:${element.dataset.durationSec}`
      return
    }
    if (element.dataset.mention === 'true' && element.dataset.assetId) {
      result += `@asset:${element.dataset.assetId}`
      return
    }
    if (BLOCK_ELEMENT_TAGS.has(element.tagName) && element !== root) {
      if (result.length > 0 && !result.endsWith('\n')) result += '\n'
      element.childNodes.forEach((child) => walk(child))
      return
    }
    element.childNodes.forEach((child) => walk(child))
  }

  root.childNodes.forEach((child) => walk(child))
  return result
}

// Kết xuất DOM của trình soạn thảo dựa trên nội dung
export function renderPromptEditorContent(
  root: HTMLElement,
  content: string,
  resolveChip: (assetId: number) => DramaMentionChipData | null,
) {
  root.replaceChildren()
  if (!content) return

  let lastIndex = 0
  for (const match of content.matchAll(CONTENT_TOKEN_PATTERN)) {
    const matchIndex = match.index ?? 0
    const token = match[1]
    if (matchIndex > lastIndex) {
      appendTextWithLineBreaks(root, content.slice(lastIndex, matchIndex))
    }
    if (token.startsWith('duration:')) {
      const seconds = Number(token.slice('duration:'.length))
      if (Number.isFinite(seconds) && seconds > 0) {
        root.appendChild(createDurationChipElement(seconds))
      } else {
        appendTextWithLineBreaks(root, match[0])
      }
    } else if (token.startsWith('asset:')) {
      const assetId = Number(token.slice('asset:'.length))
      const chipData = resolveChip(assetId)
      if (chipData) root.appendChild(createMentionChipElement(chipData))
      else appendTextWithLineBreaks(root, match[0])
    } else {
      appendTextWithLineBreaks(root, match[0])
    }
    lastIndex = matchIndex + match[0].length
  }
  if (lastIndex < content.length) {
    appendTextWithLineBreaks(root, content.slice(lastIndex))
  }
}

// @asset:id / @duration:n được đặt không được tính là trình kích hoạt @ đầu vào
function isCompletedContentToken(token: string) {
  return /^@(asset|duration):\d+$/.test(token)
}

// Tuần tự hóa văn bản "từ đầu trình soạn thảo đến con trỏ" (chip vẫn là @asset:id)
export function serializePromptEditorContentBeforeCaret(root: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const anchorNode = selection.anchorNode
  if (!anchorNode || !root.contains(anchorNode) || isInsideMentionChip(anchorNode)) {
    return null
  }
  try {
    const range = document.createRange()
    range.setStart(root, 0)
    range.setEnd(anchorNode, selection.anchorOffset)
    const holder = document.createElement('div')
    holder.appendChild(range.cloneContents())
    return serializePromptEditorContent(holder)
  } catch {
    return null
  }
}

/**
 * Phân tích xem tham chiếu @ có đang được nhập hay không.
 * Nút văn bản nơi đặt con trỏ được sử dụng đầu tiên; mặt khác, kết quả được tuần tự hóa trước khi con trỏ được sử dụng (xóa dấu trống ở cuối để tránh dòng mới sau chip phá hủy kết quả khớp).
 */
export function detectActiveMentionTrigger(root: HTMLElement): {
  query: string
  range: Range | null
} | null {
  const fromSel = detectMentionTriggerFromSelection(root)
  if (fromSel) {
    if (/^(asset|duration):\d+$/.test(fromSel.query)) return null
    return { query: fromSel.query, range: fromSel.range }
  }
  const before = serializePromptEditorContentBeforeCaret(root)
  const text = (before ?? serializePromptEditorContent(root)).replace(/\s+$/u, '')
  const match = text.match(/@([^\s@]*)$/)
  if (!match || isCompletedContentToken(match[0])) return null
  return { query: match[1] || '', range: null }
}

// Được kích hoạt bằng cách phân tích cú pháp @ từ vùng chọn
export function detectMentionTriggerFromSelection(root: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const anchorNode = selection.anchorNode
  if (
    !anchorNode ||
    !root.contains(anchorNode) ||
    anchorNode.nodeType !== Node.TEXT_NODE ||
    isInsideMentionChip(anchorNode)
  ) {
    return null
  }
  const textNode = anchorNode as Text
  const textBefore = textNode.textContent?.slice(0, selection.anchorOffset) ?? ''
  const match = textBefore.match(/@([^\s@]*)$/)
  if (!match || match.index === undefined) return null
  const triggerRange = document.createRange()
  triggerRange.setStart(textNode, match.index)
  triggerRange.setEnd(textNode, selection.anchorOffset)
  return { query: match[1], range: triggerRange }
}

// Lấy tọa độ màn hình con trỏ
export function getCaretClientRect(): MentionCaretRect | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0).cloneRange()
  range.collapse(true)
  const rects = range.getClientRects()
  if (rects.length > 0) {
    const rect = rects[rects.length - 1]
    return { top: rect.top, left: rect.left, bottom: rect.bottom }
  }
  const marker = document.createElement('span')
  marker.textContent = '\u200b'
  range.insertNode(marker)
  const rect = marker.getBoundingClientRect()
  marker.parentNode?.removeChild(marker)
  selection.removeAllRanges()
  selection.addRange(range)
  return { top: rect.top, left: rect.left, bottom: rect.bottom }
}

// Tổng số giây của @duration trong nội dung thống kê
export function sumContentDurationSeconds(content: string) {
  let total = 0
  const re = /@duration:(\d+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    const sec = Number(m[1])
    if (Number.isFinite(sec) && sec > 0) total += sec
  }
  return total
}

// Xây dựng dữ liệu chip từ DramaAsset
export function resolveChipFromAsset(
  asset: { id: number; name?: string | null; cover?: string | null; url?: string | null },
  previewUrl: string,
): DramaMentionChipData {
  return {
    assetId: asset.id,
    label: asset.name || `资产 ${asset.id}`,
    previewUrl: previewUrl || null,
  }
}
