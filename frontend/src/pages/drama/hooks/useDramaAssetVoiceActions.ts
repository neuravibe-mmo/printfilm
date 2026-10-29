import { useState } from 'react'
import { dramaApi, type DramaAsset } from '../../../api/drama'
import { generateAndBindCharacterVoice } from '../../../lib/characterVoiceGenerate'
import { readVoicePrompt } from '../CharacterVoiceBindModal'
import { dialog } from '../../../lib/dialog'

interface UseDramaAssetVoiceActionsParams {
  projectId: number
  setAssets: React.Dispatch<React.SetStateAction<DramaAsset[]>>
  onError: (msg: string) => void
  t: (key: string, ...args: any[]) => string
}

export function useDramaAssetVoiceActions({
  projectId,
  setAssets,
  onError,
  t,
}: UseDramaAssetVoiceActionsParams) {
  const [voiceAsset, setVoiceAsset] = useState<DramaAsset | null>(null)
  const [voiceSynthBusyId, setVoiceSynthBusyId] = useState<number | null>(null)
  const [voicePromptDrafts, setVoicePromptDrafts] = useState<Record<number, string>>({})
  const [characterVoiceBusyIds, setCharacterVoiceBusyIds] = useState<Set<number>>(() => new Set())
  const [batchVoiceBusy, setBatchVoiceBusy] = useState(false)

  // Làm mới các mục danh sách sau khi âm sắc được liên kết thành công.
  function handleVoiceBound(updated: DramaAsset) {
    setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
  }

  function handleVoiceCreated(voice: DramaAsset) {
    setAssets((prev) => {
      const list = prev ?? []
      if (list.some((a) => a.id === voice.id)) return list
      return [...list, voice]
    })
  }

  // AI chỉ bằng một cú nhấp chuột sẽ tạo ra âm thanh và liên kết chúng
  async function handleGenerateCharacterVoice(asset: DramaAsset) {
    if (characterVoiceBusyIds.has(asset.id) || batchVoiceBusy) return
    setCharacterVoiceBusyIds((prev) => new Set(prev).add(asset.id))
    try {
      const { character, voice } = await generateAndBindCharacterVoice(projectId, asset)
      handleVoiceBound(character)
      handleVoiceCreated(voice)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.voiceGenFailed'))
    } finally {
      setCharacterVoiceBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(asset.id)
        return next
      })
    }
  }

  // Tự động tạo giọng cho tất cả nhân vật chưa có giọng đọc (bỏ qua những nhân vật đã có)
  async function handleAutoGenerateVoices(targets: DramaAsset[]) {
    if (targets.length === 0) {
      if (characterVoiceBusyIds.size > 0 || batchVoiceBusy) {
        onError('Hệ thống đang trong quá trình tạo giọng đọc, vui lòng chờ trong giây lát.')
      } else {
        onError('Tất cả nhân vật đã có giọng đọc. Những nhân vật đã có giọng đọc được bỏ qua.')
      }
      return
    }

    const ok = await dialog.confirm({
      title: 'Tự động tạo giọng đọc',
      message:
        `Hệ thống sẽ tự động tạo giọng cho ${targets.length} nhân vật chưa có giọng đọc.\n\n` +
        `Những nhân vật đã có giọng đọc rồi sẽ được bỏ qua.`,
      confirmText: 'Bắt đầu tạo',
      cancelText: 'Hủy',
      tone: 'success',
    })
    if (!ok) return

    setBatchVoiceBusy(true)
    let failCount = 0
    const CONCURRENCY = 2
    let index = 0

    async function worker() {
      while (index < targets.length) {
        const asset = targets[index++]
        if (!asset) break
        setCharacterVoiceBusyIds((prev) => new Set(prev).add(asset.id))
        try {
          const { character, voice } = await generateAndBindCharacterVoice(projectId, asset)
          handleVoiceBound(character)
          handleVoiceCreated(voice)
        } catch {
          failCount += 1
        } finally {
          setCharacterVoiceBusyIds((prev) => {
            const next = new Set(prev)
            next.delete(asset.id)
            return next
          })
        }
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker())
    await Promise.all(workers)

    setBatchVoiceBusy(false)
    if (failCount > 0) {
      onError(`Có ${failCount} nhân vật tạo giọng thất bại, vui lòng thử lại sau.`)
    }
  }

  // Lưu mô tả âm sắc vào thông số nội dung
  async function persistVoicePrompt(asset: DramaAsset, prompt: string) {
    const nextParams = { ...(asset.params || {}), voicePrompt: prompt.trim() }
    const updated = await dramaApi.updateAsset(asset.id, { params: nextParams })
    setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)))
  }

  // Tổng hợp thử nội dung giọng nói theo lời nhắc
  async function handleSynthVoice(asset: DramaAsset) {
    const prompt = (voicePromptDrafts[asset.id] ?? readVoicePrompt(asset)).trim()
    if (!prompt) {
      onError(t('drama.assetsStep.fillVoiceDesc'))
      return
    }
    setVoiceSynthBusyId(asset.id)
    try {
      await persistVoicePrompt(asset, prompt)
      const result = await dramaApi.generateVoice({
        project_id: projectId,
        asset_id: asset.id,
        voice_prompt: prompt,
      })
      setAssets((prev) => (prev ?? []).map((a) => (a.id === asset.id ? result.asset : a)))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.assetsStep.synthVoiceFailed'))
    } finally {
      setVoiceSynthBusyId(null)
    }
  }

  // Xóa nội dung âm thanh
  async function handleDeleteVoice(asset: DramaAsset) {
    const ok = await dialog.confirm({
      title: t('drama.assetsStep.deleteVoiceTitle'),
      message: t('drama.assetsStep.deleteVoiceMessage').replace('{name}', asset.name || t('common.unnamed')),
      tone: 'danger',
      confirmText: t('common.delete'),
    })
    if (!ok) return
    try {
      await dramaApi.deleteAsset(asset.id)
      setAssets((prev) => (prev ?? []).filter((a) => a.id !== asset.id))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('common.deleteFailed'))
    }
  }

  return {
    voiceAsset,
    setVoiceAsset,
    voiceSynthBusyId,
    voicePromptDrafts,
    setVoicePromptDrafts,
    characterVoiceBusyIds,
    batchVoiceBusy,
    handleVoiceBound,
    handleVoiceCreated,
    handleGenerateCharacterVoice,
    handleAutoGenerateVoices,
    persistVoicePrompt,
    handleSynthVoice,
    handleDeleteVoice,
  }
}

