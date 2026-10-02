/** Từ nhắc canvas: contentEditable, @asset được hiển thị dưới dạng nhãn có hình ảnh nhỏ */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { resolveDramaMediaUrl } from '../../../../api/drama'
import {
  deleteAdjacentEditorChip,
  detectActiveMentionTrigger,
  insertMentionChipAtRange,
  renderPromptEditorContent,
  serializePromptEditorContent,
} from '../../../../lib/dramaEpisodePromptEditor'
import {
  CanvasMentionPopover,
  filterCanvasMentionItems,
  type CanvasMentionItem,
} from './CanvasMentionPopover'
import { useI18n } from '../../../../i18n'

type CanvasPromptEditorProps = {
  value: string
  placeholder: string
  disabled?: boolean
  allowMention: boolean
  mentionItems: CanvasMentionItem[]
  onChange: (next: string) => void
  onSubmit: () => void
}

type MentionUi = {
  open: boolean
  query: string
  activeIndex: number
}

const EMPTY_MENTION: MentionUi = { open: false, query: '', activeIndex: 0 }

/** Viết nội dung đã chọn vào văn bản và hiển thị nhãn hình thu nhỏ */
function applyMentionToken(content: string, token: string) {
  const trimmed = content.replace(/\s+$/u, '')
  if (/@(?!(?:asset|duration):\d+)[^\s@]*$/.test(trimmed)) {
    return trimmed.replace(/@(?!(?:asset|duration):\d+)[^\s@]*$/, `${token} `)
  }
  return trimmed ? `${trimmed} ${token} ` : `${token} `
}

/** Từ nhắc nhở có thể chỉnh sửa: chèn @ rồi hiển thị nhãn hình thu nhỏ của nội dung */
export function CanvasPromptEditor({
  value,
  placeholder,
  disabled = false,
  allowMention,
  mentionItems,
  onChange,
  onSubmit,
}: CanvasPromptEditorProps) {
  const { t } = useI18n()
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmittedRef = useRef(value)
  const [mention, setMention] = useState<MentionUi>(EMPTY_MENTION)

  const byAssetId = useMemo(
    () => new Map(mentionItems.map((item) => [item.assetId, item])),
    [mentionItems],
  )

  /** Phân tích cú pháp @asset:id vào dữ liệu chip */
  const resolveChip = useCallback(
    (assetId: number) => {
      const item = byAssetId.get(assetId)
      if (!item) return null
      return {
        assetId,
        label: item.label,
        previewUrl: resolveDramaMediaUrl(item.mediaUrl) || null,
      }
    },
    [byAssetId],
  )

  /** Xoá giá trị vào trình soạn thảo DOM */
  const paint = useCallback(
    (next: string) => {
      const editor = editorRef.current
      if (!editor) return
      renderPromptEditorContent(editor, next, resolveChip)
    },
    [resolveChip],
  )

  const paintedRef = useRef(false)
  useEffect(() => {
    if (paintedRef.current && value === lastEmittedRef.current) return
    paint(value)
    lastEmittedRef.current = value
    paintedRef.current = true
  }, [paint, value])

  /** Đóng @ lớp đàn hồi */
  const closeMention = useCallback(() => {
    setMention(EMPTY_MENTION)
  }, [])

  /** Trình soạn thảo nối tiếp và viết lại */
  const emitContent = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return ''
    const next = serializePromptEditorContent(editor)
    lastEmittedRef.current = next
    onChange(next)
    return next
  }, [onChange])

  /** Làm mới lớp bật lên @ dựa trên văn bản trước con trỏ */
  const syncMention = useCallback(() => {
    const editor = editorRef.current
    if (!editor || disabled || !allowMention) {
      closeMention()
      return
    }
    const hit = detectActiveMentionTrigger(editor)
    if (!hit) {
      closeMention()
      return
    }
    setMention({
      open: true,
      query: hit.query,
      activeIndex: 0,
    })
  }, [allowMention, closeMention, disabled])

  /** Chèn nhãn hình thu nhỏ của nội dung (trước tiên thay thế @ tại con trỏ để tránh không thể kích hoạt toàn bộ phần sau khi vẽ lại) */
  const insertMention = useCallback(
    (item: CanvasMentionItem) => {
      const editor = editorRef.current
      if (!editor) return
      const token = `@asset:${item.assetId}`
      const chip = resolveChip(item.assetId) || {
        assetId: item.assetId,
        label: item.label,
        previewUrl: resolveDramaMediaUrl(item.mediaUrl) || null,
      }
      const hit = detectActiveMentionTrigger(editor)
      if (hit?.range) {
        insertMentionChipAtRange(hit.range, chip)
      } else {
        const next = applyMentionToken(serializePromptEditorContent(editor), token)
        paint(next)
        requestAnimationFrame(() => {
          editor.focus()
          const sel = window.getSelection()
          if (!sel) return
          const range = document.createRange()
          range.selectNodeContents(editor)
          range.collapse(false)
          sel.removeAllRanges()
          sel.addRange(range)
        })
      }
      const next = serializePromptEditorContent(editor)
      lastEmittedRef.current = next
      onChange(next)
      closeMention()
      requestAnimationFrame(() => {
        editor.focus()
      })
    },
    [closeMention, onChange, paint, resolveChip],
  )

  const filtered = filterCanvasMentionItems(mentionItems, mention.query)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      !disabled &&
      (event.key === 'Backspace' || event.key === 'Delete') &&
      editorRef.current
    ) {
      const removed = deleteAdjacentEditorChip(
        editorRef.current,
        event.key === 'Backspace' ? 'backward' : 'forward',
      )
      if (removed) {
        event.preventDefault()
        emitContent()
        closeMention()
        return
      }
    }

    if (mention.open && filtered.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setMention((m) => ({
          ...m,
          activeIndex: Math.min(m.activeIndex + 1, filtered.length - 1),
        }))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setMention((m) => ({
          ...m,
          activeIndex: Math.max(m.activeIndex - 1, 0),
        }))
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMention()
        return
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        const pick = filtered[mention.activeIndex]
        if (pick) insertMention(pick)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  const empty = !value.trim()

  return (
    <div className="fc-generate-input-wrap">
      <div
        ref={editorRef}
        className={`fc-generate-input fc-generate-editor nodrag nopan nowheel${empty ? ' is-empty' : ''}`}
        role="textbox"
        aria-multiline="true"
        aria-label={t('drama.canvas.promptPlaceholder') || 'Prompt'}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => {
          emitContent()
          syncMention()
        }}
        onKeyUp={syncMention}
        onClick={syncMention}
        onKeyDown={(event) => {
          event.stopPropagation()
          handleKeyDown(event)
        }}
        onBlur={() => {
          emitContent()
        }}
      />
      <CanvasMentionPopover
        open={mention.open}
        query={mention.query}
        items={mentionItems}
        activeIndex={mention.activeIndex}
        onActiveIndexChange={(index) => setMention((m) => ({ ...m, activeIndex: index }))}
        onSelect={insertMention}
        onClose={closeMention}
      />
    </div>
  )
}
