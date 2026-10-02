/** Lớp đàn hồi số cài đặt tùy chỉnh: mặc định + điền thủ công 1–999 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { EPISODE_COUNT_PRESETS } from '../../lib/dramaImageStyles'
import { useI18n } from '../../i18n'

const CUSTOM_MIN = 1
const CUSTOM_MAX = 999

type Props = {
  value: number
  onChange: (count: number) => void
  disabled?: boolean
}

// Đây có phải là số tập mặc định không?
function isPreset(count: number) {
  return (EPISODE_COUNT_PRESETS as readonly number[]).includes(count)
}

// Phân tích số bộ tùy chỉnh
function parseCustom(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(n) || n < CUSTOM_MIN || n > CUSTOM_MAX) return null
  return n
}

// Kết xuất lớp đàn hồi chọn số bộ kết xuất
export function DramaEpisodeCountPopover({ value, onChange, disabled = false }: Props) {
  const { t } = useI18n()
  /*
   * công tắc lớp đàn hồi mở
   * customInput tùy chỉnh đầu vào
   * rootRef / panelRef Nhấp vào bên ngoài để đóng
   */
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState(isPreset(value) ? '' : String(value))

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node | null
      if (rootRef.current && t && !rootRef.current.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Chuyển đổi
  function toggle() {
    if (disabled) return
    setOpen((cur) => {
      const next = !cur
      if (next && !isPreset(value)) setCustomInput(String(value))
      return next
    })
  }

  // Chọn mặc định
  function selectPreset(count: number) {
    onChange(count)
    setCustomInput('')
    setOpen(false)
  }

  // Áp dụng tùy chỉnh
  function applyCustom() {
    const parsed = parseCustom(customInput)
    if (parsed == null) return
    onChange(parsed)
    setOpen(false)
  }

  function onCustomKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      applyCustom()
    }
  }

  const usingCustom = !isPreset(value)

  return (
    <div ref={rootRef} className="drama-ep-count-popover">
      <button
        type="button"
        className={`drama-agent-opt-trigger${open ? ' is-active' : ''}`}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        <span>{t('drama.episodeCount.unit', { n: value })}</span>
        <ChevronDown size={13} strokeWidth={2} className={open ? 'is-open' : ''} />
      </button>

      {open ? (
        <div className="drama-ep-count-panel" role="dialog" aria-label={t('drama.episodeCount.label')}>
          <p className="drama-ep-count-title">{t('drama.episodeCount.label')}</p>
          <div className="drama-ep-count-presets">
            {EPISODE_COUNT_PRESETS.map((count) => (
              <button
                key={count}
                type="button"
                className={value === count ? 'is-active' : ''}
                onClick={() => selectPreset(count)}
              >
                {t('drama.episodeCount.unit', { n: count })}
              </button>
            ))}
          </div>
          <div className="drama-ep-count-custom">
            <p>{t('drama.episodeCount.custom')}</p>
            <div className="drama-ep-count-custom-row">
              <input
                type="number"
                min={CUSTOM_MIN}
                max={CUSTOM_MAX}
                value={customInput}
                placeholder={`${CUSTOM_MIN}-${CUSTOM_MAX}`}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={onCustomKeyDown}
                className={usingCustom ? 'is-custom' : ''}
              />
              <button type="button" className="drama-ep-count-confirm" onClick={applyCustom}>
                {t('drama.episodeCount.confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
