/** Menu "Thêm" của thẻ dự án: Nhấp vào Tùy chọn, Chuyển ra ngoài hoặc nhấp vào Bên ngoài để thu gọn */
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { useI18n } from '../../i18n'

type Props = {
  onRename: () => void
  onDelete: () => void
}

// Trì hoãn việc đóng chuột sau khi rời chuột để tránh bị đóng ngay lập tức khi trượt vào mục menu
const HIDE_DELAY_MS = 120

// Hiển thị menu đổi tên/xóa thẻ dự án
export function DramaProjectCardMenu({ onRename, onDelete }: Props) {
  const { t } = useI18n()
  /*
   * mở Menu có được mở rộng không
   * rootRef được sử dụng để đóng điểm bên ngoài
   * HideTimerRef Đóng chậm sau khi xóa
   * ignToggleRef chặn cùng một lượt nhấp chuột thâm nhập vào "⋯" sau khi xóa menu
   */
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoreToggleRef = useRef(false)

  // Đã hủy để đóng
  function cancelHide() {
    if (!hideTimerRef.current) return
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = null
  }

  // Trì hoãn đóng menu
  function scheduleHide() {
    cancelHide()
    hideTimerRef.current = setTimeout(() => {
      setOpen(false)
      hideTimerRef.current = null
    }, HIDE_DELAY_MS)
  }

  // Hãy đóng nó ngay lập tức trước khi thực hiện thao tác để tránh menu vẫn bị treo sau khi cửa sổ bật lên được mở.
  function closeThenRun(action: () => void) {
    cancelHide()
    ignoreToggleRef.current = true
    flushSync(() => setOpen(false))
    action()
    window.setTimeout(() => {
      ignoreToggleRef.current = false
    }, 0)
  }

  useEffect(() => () => cancelHide(), [])

  // Thu gọn khi ở bên ngoài, cuộn hoặc Esc
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      const node = event.target
      if (node instanceof Node && rootRef.current?.contains(node)) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onScroll() {
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className="drama-project-row-more"
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
    >
      <button
        type="button"
        className="drama-project-row-more-btn"
        aria-label={t('drama.cardMenu.moreActions')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation()
          if (ignoreToggleRef.current) return
          cancelHide()
          setOpen((curr) => !curr)
        }}
      >
        <MoreHorizontal size={16} strokeWidth={1.8} />
      </button>
      {open ? (
        <div className="drama-project-row-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              closeThenRun(onRename)
            }}
            onClick={(event) => {
              event.stopPropagation()
              if (ignoreToggleRef.current) return
              closeThenRun(onRename)
            }}
          >
            {t('drama.cardMenu.rename')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              closeThenRun(onDelete)
            }}
            onClick={(event) => {
              event.stopPropagation()
              if (ignoreToggleRef.current) return
              closeThenRun(onDelete)
            }}
          >
            {t('drama.cardMenu.delete')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
