/**
 * Liên kết giọng nói tường thuật: Chọn từ nội dung giọng nói truyện tranh và ghi vào project.params.narrationVoiceAudio
 * Được đưa vào dưới dạng tham chiếu toàn cầu_audio khi Seedance được tạo.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines } from 'lucide-react'
import { dramaApi, resolveDramaMediaUrl, type DramaAsset, type DramaProject } from '../../api/drama'
import Modal from '../../components/ui/Modal'
import type { VoiceBinding } from './CharacterVoiceBindModal'
import { useI18n } from '../../i18n'
import { getActiveLocale } from '../../i18n/detect'

type Props = {
  project: DramaProject
  open: boolean
  onClose: () => void
  onUpdated: (project: DramaProject) => void
  onError: (message: string) => void
}

function readNarrationVoiceBinding(project: DramaProject): VoiceBinding | null {
  const params = project.params || {}
  const raw = (params as Record<string, unknown>).narrationVoiceAudio
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const sourceAssetId = typeof data.sourceAssetId === 'number' ? data.sourceAssetId : null
  const url = typeof data.url === 'string' ? data.url : ''
  const fallbackLabel =
    getActiveLocale() === 'vi' ? 'Giọng lời dẫn' : getActiveLocale() === 'en' ? 'Narrator voice' : '旁白音色'
  const label = typeof data.label === 'string' ? data.label : fallbackLabel
  if (!sourceAssetId || !url) return null
  return {
    sourceAssetId,
    url,
    label,
    voicePrompt: typeof data.voicePrompt === 'string' ? data.voicePrompt : undefined,
  }
}

export function NarratorVoiceBindModal({ project, open, onClose, onUpdated, onError }: Props) {
  const { t } = useI18n()
  const [voiceAssets, setVoiceAssets] = useState<DramaAsset[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const current = useMemo(() => readNarrationVoiceBinding(project), [project])

  const selectedVoice = useMemo(
    () => voiceAssets.find((v) => v.id === selectedId) || null,
    [voiceAssets, selectedId],
  )
  const previewUrl = selectedVoice?.url ? resolveDramaMediaUrl(selectedVoice.url) : ''

  const boundRef = useRef(false)
  useEffect(() => {
    if (!open) {
      boundRef.current = false
      return
    }
    if (boundRef.current) return
    boundRef.current = true

    setSelectedId(current?.sourceAssetId ?? null)
    dramaApi
      .listAssets(project.id)
      .then((list) => {
        const voices = list.filter((a) => (a.type || '').toLowerCase() === 'voice')
        setVoiceAssets(voices)
      })
      .catch((err) => onError(err instanceof Error ? err.message : t('drama.voiceBind.loadFailed')))
  }, [current?.sourceAssetId, onError, open, project.id, t])

  const handleConfirm = useCallback(async () => {
    if (!selectedVoice?.url || busy) {
      onError(t('drama.voiceBind.selectRequired'))
      return
    }
    setBusy(true)
    try {
      const binding: VoiceBinding = {
        sourceAssetId: selectedVoice.id,
        url: selectedVoice.url,
        label: selectedVoice.name || t('drama.voiceBind.narratorVoice'),
        // Phía Trình tường thuật hiện không dựa vào voicePrompt; nhưng trường này được dành riêng cho việc mở rộng tiếp theo
        voicePrompt:
          selectedVoice.params && typeof selectedVoice.params === 'object' && typeof (selectedVoice.params as any).voicePrompt === 'string'
            ? (selectedVoice.params as any).voicePrompt
            : undefined,
      }
      const nextParams = {
        ...(project.params || {}),
        narrationVoiceAudio: binding,
      }
      const updated = await dramaApi.updateProject(project.id, { params: nextParams })
      onUpdated(updated)
      onClose()
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.voiceBind.bindFailed'))
    } finally {
      setBusy(false)
    }
  }, [busy, onClose, onError, onUpdated, project.id, project.params, selectedVoice, t])

  const handleUnbind = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const nextParams = { ...(project.params || {}) }
      delete (nextParams as Record<string, unknown>).narrationVoiceAudio
      const updated = await dramaApi.updateProject(project.id, { params: nextParams })
      onUpdated(updated)
      onClose()
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.voiceBind.unbindFailed'))
    } finally {
      setBusy(false)
    }
  }, [busy, onClose, onError, onUpdated, project.id, project.params, t])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('drama.voiceBind.narratorTitle')}
      size="lg"
      dismissible={!busy}
      footer={
        <>
          <button type="button" className="pf-btn" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          {current ? (
            <button type="button" className="pf-btn" onClick={() => void handleUnbind()} disabled={busy}>
              {t('drama.voiceBind.unbind')}
            </button>
          ) : null}
          <button
            type="button"
            className="pf-btn pf-btn-lime"
            onClick={() => void handleConfirm()}
            disabled={!selectedVoice?.url || busy}
          >
            {busy ? t('drama.voiceBind.binding') : t('drama.voiceBind.confirmBind')}
          </button>
        </>
      }
    >
      <p className="drama-muted">
        {t('drama.voiceBind.narratorHint')}
      </p>

      <div className="drama-voice-mode-tabs" style={{ marginTop: 12 }}>
        <button type="button" className="active">
          {t('drama.voiceBind.pickExisting')}
        </button>
      </div>

      <div className="drama-voice-list" style={{ marginTop: 10 }}>
        {voiceAssets.length === 0 ? (
          <p className="drama-muted">{t('drama.voiceBind.noVoicesHint')}</p>
        ) : (
          voiceAssets.map((voice) => {
            const hasAudio = Boolean(voice.url)
            const selected = selectedId === voice.id
            return (
              <label key={voice.id} className="drama-voice-option" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="drama-narrator-voice"
                  checked={selected}
                  onChange={() => setSelectedId(voice.id)}
                />
                <span>
                  {voice.name || `${t('drama.assets.voice')} #${voice.id}`} <small>{hasAudio ? t('drama.voiceBind.synthesized') : t('drama.voiceBind.notSynthesized')}</small>
                </span>
              </label>
            )
          })
        )}
      </div>

      {previewUrl ? (
        <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <AudioLines size={16} />
          <audio className="drama-voice-audio" controls src={previewUrl} />
        </div>
      ) : null}
    </Modal>
  )
}

