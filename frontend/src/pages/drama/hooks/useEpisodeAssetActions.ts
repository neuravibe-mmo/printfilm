import { useState } from 'react'
import { useI18n } from '../../../i18n'
import { dramaApi, type DramaAsset, type DramaFragment } from '../../../api/drama'
import { dialog } from '../../../lib/dialog'
import { defaultOptionsForAssetKind } from '../../../lib/dramaGenerationOptions'
import { dramaAssetHasImage, dramaAssetImageGenButtonLabel } from '../../../lib/dramaAssetImage'
import { enqueueDramaImageGen, type DramaImageGenJob } from '../../../lib/dramaImageGenQueue'
import { readVisualPrompt } from '../../../lib/dramaVisualPrompt'
import { generateAndBindCharacterVoice } from '../../../lib/characterVoiceGenerate'
import { importGlobalAssetToProject } from '../GlobalAssetPickerModal'
import {
  getAssetTabLabel,
  highlightCharacterNamesInContent,
  normalizeAssetTab,
  type AssetScope,
  type AssetTab,
} from '../dramaEpisodeEditUtils'

interface UseEpisodeAssetActionsParams {
  pid: number
  eid: number
  selected: DramaFragment | null
  selectedIndex: number
  fragments: DramaFragment[]
  assets: DramaAsset[]
  assetTab: AssetTab | null
  videoStyleId?: string
  imageGenQueue: DramaImageGenJob[]
  imageBusyIds: Set<number>
  setFragments: React.Dispatch<React.SetStateAction<DramaFragment[]>>
  setAssets: React.Dispatch<React.SetStateAction<DramaAsset[]>>
  setAssetTab: (tab: AssetTab | null) => void
  setAssetScope: (scope: AssetScope) => void
  setEditing: (editing: boolean) => void
  setStatus: (status: string) => void
  setError: (error: string) => void
  updateSelected: (patch: Partial<DramaFragment>) => void
}

export function useEpisodeAssetActions({
  pid,
  eid,
  selected,
  selectedIndex,
  fragments,
  assets,
  assetTab,
  videoStyleId,
  imageGenQueue,
  imageBusyIds,
  setFragments,
  setAssets,
  setAssetTab,
  setAssetScope,
  setEditing,
  setStatus,
  setError,
  updateSelected,
}: UseEpisodeAssetActionsParams) {
  const { t } = useI18n()
  const [detailAsset, setDetailAsset] = useState<DramaAsset | null>(null)
  const [voiceBindAsset, setVoiceBindAsset] = useState<DramaAsset | null>(null)
  const [assetCreateBusy, setAssetCreateBusy] = useState(false)
  const [detectBusy, setDetectBusy] = useState(false)
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false)
  const [characterVoiceBusyIds, setCharacterVoiceBusyIds] = useState<Set<number>>(() => new Set())

  function resolveCreateAssetTab(): AssetTab {
    return assetTab || 'character'
  }

  function assetImageGenLabel(asset: DramaAsset): string {
    const job = imageGenQueue.find(
      (j) => j.assetId === asset.id && (j.status === 'queued' || j.status === 'running'),
    )
    let queueLabel: string | null = null
    if (job) {
      if (job.status === 'running') queueLabel = t('drama.episodeEdit.generating')
      else {
        const queuedOnly = imageGenQueue.filter(
          (j) => j.status === 'queued' || j.status === 'running',
        )
        const pos = queuedOnly.findIndex((j) => j.id === job.id) + 1
        queueLabel =
          pos > 1
            ? t('drama.episodeEdit.queuePos').replace('{pos}', String(pos))
            : t('drama.episodeEdit.queueing')
      }
    }
    return dramaAssetImageGenButtonLabel(asset, queueLabel, t)
  }

  function handleCharacterUpdated(updated: DramaAsset) {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setDetailAsset((prev) => (prev?.id === updated.id ? updated : prev))
  }

  function mentionAsset(asset: DramaAsset) {
    if (!selected) return
    const mention = `@asset:${asset.id}`
    const raw = selected.content || ''
    const already = new RegExp(`@asset:${asset.id}(?!\\d)`).test(raw)
    const content = already ? raw : raw ? `${raw.trimEnd()}\n${mention}` : mention
    const ids = Array.from(new Set([...(selected.asset_ids || []), asset.id]))
    updateSelected({ content, asset_ids: ids })
    setEditing(true)
  }

  function adoptCreatedAsset(created: DramaAsset, kind: AssetTab) {
    setAssets((prev) => (prev.some((a) => a.id === created.id) ? prev : [...prev, created]))
    setAssetTab(kind)
    mentionAsset(created)
    if ((created.type || '').toLowerCase() !== 'voice') {
      setDetailAsset(created)
    }
  }

  async function handleCreateSideAsset() {
    const kind = resolveCreateAssetTab()
    const label =
      kind === 'scene'
        ? t('drama.episodeEdit.scene')
        : kind === 'prop'
          ? t('drama.episodeEdit.prop')
          : t('drama.episodeEdit.character')
    const name = await dialog.prompt({
      title: t('drama.episodeEdit.createAssetTitle').replace('{label}', label),
      message: t('drama.episodeEdit.createAssetMsg').replace('{label}', label),
      placeholder:
        kind === 'scene'
          ? t('drama.episodeEdit.scenePlaceholder')
          : kind === 'prop'
            ? t('drama.episodeEdit.propPlaceholder')
            : t('drama.episodeEdit.characterPlaceholder'),
      confirmText: t('drama.episodeEdit.createConfirm'),
    })
    if (!name?.trim()) return
    setAssetCreateBusy(true)
    setError('')
    try {
      const created = await dramaApi.createAsset({
        project_id: pid,
        type: kind,
        asset_type: 'image',
        name: name.trim(),
        params: { kind },
      })
      adoptCreatedAsset(created, kind)
      setStatus(
        t('drama.episodeEdit.assetCreated')
          .replace('{label}', label)
          .replace('{name}', created.name || ''),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('drama.episodeEdit.assetCreateFailed').replace('{label}', label),
      )
    } finally {
      setAssetCreateBusy(false)
    }
  }

  async function handleImportSideAsset(source: DramaAsset) {
    const kind = normalizeAssetTab(source.type) || resolveCreateAssetTab()
    setAssetCreateBusy(true)
    setError('')
    try {
      const created = await importGlobalAssetToProject(pid, source)
      adoptCreatedAsset(created, kind)
      setLibraryPickerOpen(false)
      setStatus(t('drama.episodeEdit.assetImported').replace('{name}', created.name || ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.importFailed'))
      throw err
    } finally {
      setAssetCreateBusy(false)
    }
  }

  function unlinkSelectedAsset(assetId: number) {
    if (!selected) return
    const content = (selected.content || '')
      .replace(new RegExp(`\\s*@asset:${assetId}(?!\\d)`, 'g'), ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    const asset_ids = (selected.asset_ids || []).filter((id) => id !== assetId)
    updateSelected({ content, asset_ids })
    setEditing(true)
    const name = assets.find((a) => a.id === assetId)?.name
    setStatus(
      name
        ? t('drama.episodeEdit.unlinkAsset').replace('{name}', name)
        : t('drama.episodeEdit.unlinkNoName'),
    )
  }

  async function handleAutoDetectAssets() {
    if (!selected) {
      setError(t('drama.episodeEdit.selectFragmentFirst'))
      return
    }
    const content = (selected.content || '').trim()
    if (!content) {
      setError('Phân cảnh chưa có nội dung để AI nhận diện.')
      return
    }
    const currentTab = assetTab || 'character'
    const targetKind = currentTab === 'scene' ? 'scene' : currentTab === 'prop' ? 'prop' : 'character'
    const pool = (assets ?? []).filter((a) => (a.type || '').toLowerCase() === targetKind)
    if (pool.length === 0) {
      const kindLabel = getAssetTabLabel(currentTab)
      setStatus(t('drama.episodeEdit.noAssetsInLibrary').replace('{kind}', kindLabel))
      return
    }

    setDetectBusy(true)
    setError('')
    try {
      const candidates = pool.map((a) => {
        const p = (a.params || {}) as Record<string, unknown>
        const intro = String(p.intro || p.visualPrompt || p.prompt || '')
        const aliases: string[] = []
        if (typeof p.alias === 'string') aliases.push(p.alias)
        if (Array.isArray(p.aliases)) aliases.push(...p.aliases.map(String))
        if (typeof p.nickname === 'string') aliases.push(p.nickname)
        return {
          id: a.id,
          name: a.name || '',
          type: a.type || 'character',
          intro,
          aliases,
        }
      })

      const res = await dramaApi.detectAssets({
        content,
        asset_type: targetKind,
        candidate_assets: candidates,
        project_id: pid,
      })

      const detectedIds = res.detected_ids || []
      const detected = pool.filter((a) => detectedIds.includes(a.id))
      const kindLabel = getAssetTabLabel(currentTab)
      if (detected.length === 0) {
        setStatus(t('drama.episodeEdit.noDetectedAssets').replace('{kind}', kindLabel))
        return
      }

      const existingIds = selected.asset_ids || []
      const newIds = detectedIds.filter((id) => !existingIds.includes(id))

      let nextContent = (selected.content || '').replace(/(?:\s*@asset:\d+\s*)+$/g, '').trimEnd()

      const detectedNames: string[] = []
      for (const a of detected) {
        if (a.name) detectedNames.push(a.name)
        const p = (a.params || {}) as Record<string, unknown>
        if (typeof p.alias === 'string') detectedNames.push(p.alias)
        if (Array.isArray(p.aliases)) detectedNames.push(...p.aliases.map(String))
        if (typeof p.nickname === 'string') detectedNames.push(p.nickname)
      }
      if (Array.isArray(res.detected_names)) {
        detectedNames.push(...res.detected_names)
      }

      nextContent = highlightCharacterNamesInContent(nextContent, detectedNames)

      const mergedIds = Array.from(new Set([...existingIds, ...detectedIds]))

      const nextFragments = fragments.map((f, i) =>
        i === selectedIndex ? { ...f, content: nextContent, asset_ids: mergedIds } : f,
      )
      setFragments(nextFragments)
      setEditing(true)

      try {
        await dramaApi.saveFragments(eid, nextFragments)
      } catch {
        /* ignore autosave error */
      }

      const names = detected.map((a) => a.name || `ID ${a.id}`).join(', ')
      if (newIds.length === 0) {
        setStatus(t('drama.episodeEdit.detectedAlreadyLinked').replace('{names}', names))
      } else {
        setStatus(
          t('drama.episodeEdit.detectedSuccess')
            .replace('{n}', String(newIds.length))
            .replace('{names}', names),
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gọi AI nhận diện nhân vật')
    } finally {
      setDetectBusy(false)
    }
  }

  function focusLinkedAsset(assetId: number) {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return
    const tab = normalizeAssetTab(asset.type)
    if (tab) setAssetTab(tab)
    setAssetScope('series')
    if ((asset.type || '').toLowerCase() !== 'voice') {
      setDetailAsset(asset)
    }
  }

  async function enqueueAssetImage(asset: DramaAsset) {
    if (imageBusyIds.has(asset.id)) return
    if (dramaAssetHasImage(asset)) {
      const ok = await dialog.confirm({
        title: t('drama.assetsStep.regenConfirmTitle'),
        message: t('drama.assetsStep.regenConfirmMessage').replace(
          '{name}',
          asset.name || t('common.unnamed'),
        ),
        confirmText: t('drama.assets.regenImage'),
        cancelText: t('common.cancel'),
      })
      if (!ok) return
    }
    const options = {
      ...defaultOptionsForAssetKind(asset.type),
      image_style_id: videoStyleId || undefined,
    }
    void enqueueDramaImageGen({
      projectId: pid,
      assetId: asset.id,
      assetName: asset.name || undefined,
      assetType: asset.type,
      prompt: readVisualPrompt(asset),
      options,
      onAssetUpdate: handleCharacterUpdated,
    })
      .then((updated) => handleCharacterUpdated(updated))
      .catch((err) =>
        setError(err instanceof Error ? err.message : t('drama.episodeEdit.genImageFailed')),
      )
  }

  async function handleGenerateCharacterVoice(asset: DramaAsset) {
    if (characterVoiceBusyIds.has(asset.id)) return
    setCharacterVoiceBusyIds((prev) => new Set(prev).add(asset.id))
    setError('')
    try {
      const { character, voice } = await generateAndBindCharacterVoice(pid, asset)
      handleCharacterUpdated(character)
      setAssets((prev) => (prev.some((a) => a.id === voice.id) ? prev : [...prev, voice]))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.voiceFailed'))
    } finally {
      setCharacterVoiceBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(asset.id)
        return next
      })
    }
  }

  return {
    detailAsset,
    setDetailAsset,
    voiceBindAsset,
    setVoiceBindAsset,
    assetCreateBusy,
    detectBusy,
    libraryPickerOpen,
    setLibraryPickerOpen,
    characterVoiceBusyIds,
    resolveCreateAssetTab,
    handleCharacterUpdated,
    mentionAsset,
    handleCreateSideAsset,
    handleImportSideAsset,
    unlinkSelectedAsset,
    handleAutoDetectAssets,
    focusLinkedAsset,
    enqueueAssetImage,
    handleGenerateCharacterVoice,
    assetImageGenLabel,
  }
}
