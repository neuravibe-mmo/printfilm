import { useEffect, useRef, useState } from 'react'
import { Pause, Volume2 } from 'lucide-react'
import { resolveDramaMediaUrl } from '../../api/drama'
import { useI18n } from '../../i18n'

type Props = {
  url: string
  label?: string
  className?: string
  size?: 'sm' | 'md'
  variant?: 'button' | 'chip' | 'inline'
  onError?: (message: string) => void
}

/** Chỉ phát một lần thử giọng cùng lúc để tránh âm thanh chồng chéo từ nhiều thẻ */
let sharedAudio: HTMLAudioElement | null = null
let sharedStop: (() => void) | null = null

// Bấm để phát âm thanh thử giọng của âm giới hạn, sau đó bấm để tạm dừng
export function CharacterVoicePreviewButton({
  url,
  label,
  className = '',
  size = 'sm',
  variant = 'button',
  onError,
}: Props) {
  const { t } = useI18n()
  const [playing, setPlaying] = useState(false)
  const src = resolveDramaMediaUrl(url)
  const stopRef = useRef<() => void>(() => undefined)

  useEffect(() => {
    return () => {
      if (sharedStop === stopRef.current) {
        sharedAudio?.pause()
        sharedStop = null
      }
    }
  }, [])

  function stop() {
    sharedAudio?.pause()
    if (sharedAudio) sharedAudio.currentTime = 0
    setPlaying(false)
    if (sharedStop === stopRef.current) sharedStop = null
  }

  stopRef.current = stop

  function handlePreview() {
    if (!src) {
      onError?.(t('drama.assetsStep.voiceInvalidUrl'))
      return
    }
    if (playing) {
      stop()
      return
    }
    sharedStop?.()
    if (!sharedAudio) sharedAudio = new Audio()
    sharedAudio.src = src
    sharedAudio.onended = () => {
      setPlaying(false)
      if (sharedStop === stopRef.current) sharedStop = null
    }
    sharedStop = () => stop()
    setPlaying(true)
    void sharedAudio.play().catch(() => {
      setPlaying(false)
      onError?.(t('drama.assetsStep.voicePlayFailed'))
    })
  }

  if (!src) return null

  let btnClass = 'drama-voice-preview-btn'
  if (variant === 'button') {
    const sizeClass = size === 'md' ? 'pf-btn pf-btn-ghost' : 'pf-btn pf-btn-ghost pf-btn-sm'
    btnClass = `${sizeClass} drama-voice-preview-btn`
  } else if (variant === 'chip') {
    btnClass = 'fc-toolbar-chip'
  }
  if (playing) btnClass = `${btnClass} is-playing`
  if (className) btnClass = `${btnClass} ${className}`

  return (
    <button
      type="button"
      className={btnClass}
      onClick={(e) => {
        e.stopPropagation()
        handlePreview()
      }}
      title={label ? t('drama.assetsStep.voiceListenTitle', { label }) : t('drama.assetsStep.voiceListen')}
    >
      {playing ? <Pause size={14} strokeWidth={1.8} aria-hidden /> : <Volume2 size={14} strokeWidth={1.8} aria-hidden />}
      {playing ? t('drama.assetsStep.voiceStop') : t('drama.assetsStep.voiceListenBtn')}
    </button>
  )
}
