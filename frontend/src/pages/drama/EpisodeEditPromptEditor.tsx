/** Nội dung tập lệnh có thể chỉnh sửa: thời lượng/chip nội dung + lớp đàn hồi @ */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { resolveDramaMediaUrl, type DramaAsset } from '../../api/drama'
import {
  deleteAdjacentEditorChip,
  detectMentionTriggerFromSelection,
  getCaretClientRect,
  insertDurationChipAtRange,
  insertMentionChipAtRange,
  insertPlainTextAtRange,
  nextDurationPresetSeconds,
  renderPromptEditorContent,
  resolveChipFromAsset,
  serializePromptEditorContent,
  sumContentDurationSeconds,
  updateDurationChipElement,
  type MentionCaretRect,
} from '../../lib/dramaEpisodePromptEditor'
import type { AssetScope } from './dramaEpisodeEditUtils'
import { EpisodeEditMentionPopover } from './EpisodeEditMentionPopover'

type Props = {
  content: string
  assets: DramaAsset[]
  referencedIds: Set<number>
  editing: boolean
  placeholder?: string
  onContentChange: (content: string) => void
  onOpenAsset?: (assetId: number) => void
}

// Hiển thị kịch bản bảng phân cảnh có thể chỉnh sửa
export function EpisodeEditPromptEditor({
  content,
  assets,
  referencedIds,
  editing,
  placeholder,
  onContentChange,
  onOpenAsset,
}: Props) {
  const { t } = useI18n()
  const effectivePlaceholder = placeholder ?? t('drama.episodeEdit.scriptPlaceholder')
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmittedRef = useRef(content)
  const mentionTriggerRangeRef = useRef<Range | null>(null)

  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionAnchorRect, setMentionAnchorRect] = useState<MentionCaretRect | null>(null)
  const [mentionScope, setMentionScope] = useState<AssetScope>('episode')
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0)
  const [mentionItemsCount, setMentionItemsCount] = useState(0)

  // Phân tích dữ liệu hiển thị chip theo id nội dung
  const resolveChip = useCallback(
    (assetId: number) => {
      const asset = assets.find((a) => a.id === assetId)
      if (!asset) return null
      return resolveChipFromAsset(asset, resolveDramaMediaUrl(asset.cover || asset.url))
    },
    [assets],
  )

  // Đóng @ lớp đàn hồi
  const closeMentionPopover = useCallback(() => {
    setMentionOpen(false)
    setMentionQuery('')
    setMentionActiveIndex(0)
    setMentionScope('episode')
    mentionTriggerRangeRef.current = null
  }, [])

  // Đưa nội dung vào trình soạn thảo DOM
  const paint = useCallback(
    (next: string) => {
      const editor = editorRef.current
      if (!editor) return
      renderPromptEditorContent(editor, next, resolveChip)
    },
    [resolveChip],
  )

  // Đồng bộ hóa với DOM khi nội dung bên ngoài thay đổi (bài viết lại của biên tập viên này bị bỏ qua trong quá trình chỉnh sửa)
  useEffect(() => {
    if (editing && content === lastEmittedRef.current) return
    paint(content)
    lastEmittedRef.current = content
  }, [content, editing, paint])

  // Làm mới màn hình chip khi danh sách tài sản chỉ đọc thay đổi
  useEffect(() => {
    if (editing) return
    paint(content)
  }, [assets, content, editing, paint])

  // Tập trung khi vào chỉnh sửa
  useEffect(() => {
    if (!editing) {
      closeMentionPopover()
      return
    }
    requestAnimationFrame(() => editorRef.current?.focus())
  }, [closeMentionPopover, editing])

  // Đồng bộ hóa @ trạng thái kích hoạt
  const syncMentionTrigger = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !editing) {
      closeMentionPopover()
      return
    }
    const trigger = detectMentionTriggerFromSelection(editor)
    const caretRect = getCaretClientRect()
    if (!trigger || !caretRect) {
      closeMentionPopover()
      return
    }
    mentionTriggerRangeRef.current = trigger.range
    setMentionOpen(true)
    setMentionQuery(trigger.query)
    setMentionAnchorRect(caretRect)
    setMentionActiveIndex(0)
  }, [closeMentionPopover, editing])

  // Viết nội dung soạn thảo lại cho phụ huynh
  const emitContent = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const next = serializePromptEditorContent(editor)
    lastEmittedRef.current = next
    onContentChange(next)
  }, [onContentChange])

  // Chọn nội dung và chèn chip
  const handleSelectAsset = useCallback(
    (asset: DramaAsset) => {
      const editor = editorRef.current
      const triggerRange = mentionTriggerRangeRef.current
      if (!editor || !triggerRange) return
      const chip = resolveChipFromAsset(asset, resolveDramaMediaUrl(asset.cover || asset.url))
      insertMentionChipAtRange(triggerRange, chip)
      mentionTriggerRangeRef.current = null
      closeMentionPopover()
      emitContent()
      editor.focus()
    },
    [closeMentionPopover, emitContent],
  )

  // Chọn thời lượng gắn chip
  const handleSelectDuration = useCallback(
    (seconds: number) => {
      const editor = editorRef.current
      const triggerRange = mentionTriggerRangeRef.current
      if (!editor || !triggerRange) return
      insertDurationChipAtRange(triggerRange, seconds)
      mentionTriggerRangeRef.current = null
      closeMentionPopover()
      emitContent()
      editor.focus()
    },
    [closeMentionPopover, emitContent],
  )

  // Chèn văn bản đơn giản của tiền tố cảnh/chuyển động
  const handleSelectCameraPhrase = useCallback(
    (text: string) => {
      const editor = editorRef.current
      const triggerRange = mentionTriggerRangeRef.current
      if (!editor || !triggerRange || !text) return
      insertPlainTextAtRange(triggerRange, text)
      mentionTriggerRangeRef.current = null
      closeMentionPopover()
      emitContent()
      editor.focus()
    },
    [closeMentionPopover, emitContent],
  )

  const contentDurationTotal = sumContentDurationSeconds(
    mentionOpen && editorRef.current
      ? serializePromptEditorContent(editorRef.current)
      : content,
  )

  return (
    <>
      <div
        ref={editorRef}
        className={`drama-ep-prompt-editor${editing ? ' is-editing' : ''}`}
        role="textbox"
        aria-multiline="true"
        aria-label={t('drama.episodeEdit.scriptLabel')}
        aria-readonly={!editing}
        contentEditable={editing}
        suppressContentEditableWarning
        data-placeholder={effectivePlaceholder}
        onInput={() => {
          emitContent()
          syncMentionTrigger()
        }}
        onKeyUp={syncMentionTrigger}
        onClick={(e) => {
          if (!editing) {
            const chip = (e.target as HTMLElement).closest<HTMLElement>('[data-asset-id]')
            if (chip?.dataset.assetId) onOpenAsset?.(Number(chip.dataset.assetId))
            return
          }
          const durationChip = (e.target as HTMLElement).closest<HTMLElement>('[data-duration-sec]')
          if (durationChip && editorRef.current?.contains(durationChip)) {
            e.preventDefault()
            const current = Number(durationChip.dataset.durationSec)
            updateDurationChipElement(durationChip, nextDurationPresetSeconds(current))
            emitContent()
            closeMentionPopover()
            return
          }
          syncMentionTrigger()
        }}
        onKeyDown={(e) => {
          if (editing && (e.key === 'Backspace' || e.key === 'Delete') && editorRef.current) {
            const removed = deleteAdjacentEditorChip(
              editorRef.current,
              e.key === 'Backspace' ? 'backward' : 'forward',
            )
            if (removed) {
              e.preventDefault()
              emitContent()
              closeMentionPopover()
              return
            }
          }
          if (!mentionOpen) return
          if (e.key === 'Escape') {
            e.preventDefault()
            closeMentionPopover()
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setMentionActiveIndex((i) => Math.min(i + 1, Math.max(mentionItemsCount - 1, 0)))
            return
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setMentionActiveIndex((i) => Math.max(i - 1, 0))
            return
          }
          if (e.key === 'Enter' && mentionItemsCount > 0) {
            e.preventDefault()
            // Enter được xử lý bởi danh sách tài sản lớp đàn hồi thông qua activeIndex ở cấp độ gốc, việc này phức tạp hơn. Ở đây chúng tôi chỉ chặn trình kích hoạt để tránh ngắt dòng.
          }
        }}
      />

      <EpisodeEditMentionPopover
        open={mentionOpen && editing}
        query={mentionQuery}
        scope={mentionScope}
        assets={assets}
        referencedIds={referencedIds}
        anchorRect={mentionAnchorRect}
        activeIndex={mentionActiveIndex}
        contentDurationTotal={contentDurationTotal}
        onScopeChange={setMentionScope}
        onActiveIndexChange={setMentionActiveIndex}
        onItemsCountChange={setMentionItemsCount}
        onSelectAsset={handleSelectAsset}
        onSelectDuration={handleSelectDuration}
        onSelectCameraPhrase={handleSelectCameraPhrase}
        onClose={closeMentionPopover}
      />
    </>
  )
}
