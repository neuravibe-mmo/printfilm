import { type MutableRefObject } from 'react'
import { dramaApi, type DramaEpisode, type DramaFragment } from '../../../api/drama'
import { dialog } from '../../../lib/dialog'
import {
  formatProjectOutputLabel,
  readEpisodeAspectRatio,
  readEpisodeResolution,
} from '../../../lib/dramaProjectOutputSettings'
import {
  applySubtitleModeToFragments,
  subtitleModeUsesModelOutput,
  type DramaSubtitleMode,
} from '../../../lib/dramaSubtitleBoard'
import {
  applyCharacterIntroModeToFragments,
  characterIntroModeEnabled,
  type DramaCharacterIntroMode,
} from '../../../lib/dramaCharacterIntro'
import {
  readEffectiveCharacterIntroMode,
  readEffectiveSubtitleMode,
} from '../../../lib/dramaProjectGlobalSettings'
import { resolveFragmentDurationSec } from '../dramaEpisodeEditUtils'
import { useI18n } from '../../../i18n'

export function coerceProjectBool(value: unknown, defaultValue: boolean): boolean {
  if (value == null) return defaultValue
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  }
  return defaultValue
}

export type UseEpisodeSettingsParams = {
  pid: number
  eid: number
  projectParams: Record<string, unknown>
  setProjectParams: (p: Record<string, unknown>) => void
  projectParamsRef: MutableRefObject<Record<string, unknown>>
  episodeParams: Record<string, unknown>
  setEpisodeParams: (p: Record<string, unknown>) => void
  episodeParamsRef: MutableRefObject<Record<string, unknown>>
  linkLastFrame: boolean
  setLinkLastFrame: (v: boolean) => void
  subtitleMode: DramaSubtitleMode
  setSubtitleMode: (v: DramaSubtitleMode) => void
  characterIntroMode: DramaCharacterIntroMode
  setCharacterIntroMode: (v: DramaCharacterIntroMode) => void
  setAspectRatio: (v: any) => void
  fragments: DramaFragment[]
  setFragments: React.Dispatch<React.SetStateAction<DramaFragment[]>>
  setEpisode: (ep: DramaEpisode) => void
  setStatus: (s: string) => void
  setError: (s: string) => void
  generateAll: (opts?: { forceRegen?: boolean; skipConfirm?: boolean }) => Promise<void>
}

export function useEpisodeSettings({
  pid,
  eid,
  projectParams,
  setProjectParams,
  projectParamsRef,
  episodeParams,
  setEpisodeParams,
  episodeParamsRef,
  linkLastFrame,
  setLinkLastFrame,
  subtitleMode,
  setSubtitleMode,
  characterIntroMode,
  setCharacterIntroMode,
  setAspectRatio,
  fragments,
  setFragments,
  setEpisode,
  setStatus,
  setError,
  generateAll,
}: UseEpisodeSettingsParams) {
  const { t } = useI18n()

  // Kết nối liên gương liên tục chuyển sang thông số dự án và để phần phụ trợ sắp xếp lại các tác vụ chưa bắt đầu
  async function handleLinkLastFrameChange(enabled: boolean) {
    const prevEnabled = linkLastFrame
    const prevParams = projectParams
    const nextParams = { ...projectParams, linkLastFrame: enabled }
    setLinkLastFrame(enabled)
    setProjectParams(nextParams)
    try {
      const updated = await dramaApi.updateProject(pid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object'
          ? (updated.params as Record<string, unknown>)
          : (nextParams as Record<string, unknown>)
      setProjectParams(updatedParams)
      setLinkLastFrame(coerceProjectBool(updatedParams.linkLastFrame ?? updatedParams.link_last_frame, enabled))
      // Làm mới trạng thái nhiệm vụ của tập này để thanh gương phía dưới phản ánh ngay việc điều chỉnh nối tiếp/song song
      try {
        const ep = await dramaApi.getEpisode(eid)
        setEpisode(ep)
        if (Array.isArray(ep.fragments)) {
          setFragments(
            ep.fragments.map((f) => ({
              ...f,
              duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
            })),
          )
        }
      } catch {
        /* ignore refresh errors */
      }
      setStatus(
        enabled
          ? t('drama.episodeEdit.tailEnabled')
          : t('drama.episodeEdit.tailDisabled'),
      )
    } catch (err) {
      setLinkLastFrame(prevEnabled)
      setProjectParams(prevParams)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveTailFailed'))
    }
  }

  // Duy trì khung/định nghĩa của tập này thành tập.params; nhắc nhở tái sinh khi phim đã hoàn thành
  async function handleEpisodeOutputChange(nextParams: Record<string, unknown>) {
    const prevRatio = readEpisodeAspectRatio(episodeParams, projectParams)
    const prevRes = readEpisodeResolution(episodeParams, projectParams)
    const nextRatio = readEpisodeAspectRatio(nextParams, projectParams)
    const nextRes = readEpisodeResolution(nextParams, projectParams)
    if (prevRatio === nextRatio && prevRes === nextRes) return

    const prevLabel = formatProjectOutputLabel(prevRatio, prevRes)
    const nextLabel = formatProjectOutputLabel(nextRatio, nextRes)
    const generatedCount = fragments.filter((frag) => Boolean(frag.video)).length
    const ok = await dialog.confirm({
      title: t('drama.episodeEdit.switchOutputTitle'),
      message:
        generatedCount > 0
          ? t('drama.episodeEdit.switchOutputWithGen')
              .replace('{prev}', prevLabel)
              .replace('{next}', nextLabel)
              .replace('{n}', String(generatedCount))
          : t('drama.episodeEdit.switchOutputNoGen')
              .replace('{prev}', prevLabel)
              .replace('{next}', nextLabel),
      confirmText: generatedCount > 0 ? t('drama.episodeEdit.saveAndRegen') : t('common.save'),
      cancelText: t('common.cancel'),
      tone: generatedCount > 0 ? 'danger' : 'default',
    })
    if (!ok) return

    const prevParams = episodeParams
    setEpisodeParams(nextParams)
    episodeParamsRef.current = nextParams
    setAspectRatio(nextRatio)
    try {
      const updated = await dramaApi.updateEpisode(eid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object' && !Array.isArray(updated.params)
          ? (updated.params as Record<string, unknown>)
          : nextParams
      setEpisode(updated)
      setEpisodeParams(updatedParams)
      episodeParamsRef.current = updatedParams
      setAspectRatio(readEpisodeAspectRatio(updatedParams, projectParams))
      setStatus(
        generatedCount > 0
          ? t('drama.episodeEdit.outputUpdatedRegen').replace('{label}', nextLabel)
          : t('drama.episodeEdit.outputUpdated').replace('{label}', nextLabel),
      )
      setError('')
      if (generatedCount > 0) {
        await generateAll({ forceRegen: true, skipConfirm: true })
      }
    } catch (err) {
      setEpisodeParams(prevParams)
      episodeParamsRef.current = prevParams
      setAspectRatio(readEpisodeAspectRatio(prevParams, projectParams))
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveOutputFailed'))
      throw err
    }
  }

  // Kiên trì phương pháp phụ đề của tập này và tự động viết lại các từ gợi ý phụ đề trong bảng phân cảnh hiện tại
  async function handleEpisodeSubtitleChange(mode: DramaSubtitleMode) {
    if (mode === subtitleMode) return
    const prevParams = episodeParams
    const prevFragments = fragments
    const nextParams = {
      ...episodeParams,
      subtitleMode: mode,
      subtitleEnabled: subtitleModeUsesModelOutput(mode),
    }
    const nextFragments = applySubtitleModeToFragments(fragments, mode)
    setSubtitleMode(mode)
    setEpisodeParams(nextParams)
    episodeParamsRef.current = nextParams
    setFragments(nextFragments)
    try {
      const updated = await dramaApi.updateEpisode(eid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object' && !Array.isArray(updated.params)
          ? (updated.params as Record<string, unknown>)
          : nextParams
      setEpisode(updated)
      setEpisodeParams(updatedParams)
      episodeParamsRef.current = updatedParams
      setSubtitleMode(readEffectiveSubtitleMode(updatedParams, projectParamsRef.current))
      const contentChanged = nextFragments.some(
        (frag, index) => frag.content !== prevFragments[index]?.content,
      )
      if (contentChanged) {
        const ep = await dramaApi.saveFragments(
          eid,
          nextFragments.map((f, i) => {
            const prevFragParams =
              f.params && typeof f.params === 'object' && !Array.isArray(f.params)
                ? (f.params as Record<string, unknown>)
                : {}
            return {
              id: typeof f.id === 'number' && f.id > 0 ? f.id : undefined,
              sort_order: i,
              content: f.content,
              cover: f.cover,
              video: f.video,
              duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
              params: { ...prevFragParams, user_edited: true },
              asset_ids: f.asset_ids || [],
            }
          }),
        )
        setEpisode(ep)
        setFragments(
          (ep.fragments || nextFragments).map((f) => ({
            ...f,
            duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
          })),
        )
      }
      setStatus(
        mode === 'model'
          ? t('drama.episodeEdit.subtitleModel')
          : t('drama.episodeEdit.subtitlePost'),
      )
      setError('')
    } catch (err) {
      setSubtitleMode(readEffectiveSubtitleMode(prevParams, projectParamsRef.current))
      setEpisodeParams(prevParams)
      episodeParamsRef.current = prevParams
      setFragments(prevFragments)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveSubtitleFailed'))
    }
  }

  // Duy trì chuyển đổi chồng chéo cho phần giới thiệu nhân vật trong tập này và tự động xóa các dòng giới thiệu trong bảng phân cảnh hiện tại
  async function handleEpisodeCharacterIntroChange(mode: DramaCharacterIntroMode) {
    if (mode === characterIntroMode) return
    const prevParams = episodeParams
    const prevFragments = fragments
    const nextParams = {
      ...episodeParams,
      characterIntroMode: mode,
      characterIntroEnabled: characterIntroModeEnabled(mode),
    }
    const nextFragments = applyCharacterIntroModeToFragments(fragments, mode)
    setCharacterIntroMode(mode)
    setEpisodeParams(nextParams)
    episodeParamsRef.current = nextParams
    setFragments(nextFragments)
    try {
      const updated = await dramaApi.updateEpisode(eid, { params: nextParams })
      const updatedParams =
        updated.params && typeof updated.params === 'object' && !Array.isArray(updated.params)
          ? (updated.params as Record<string, unknown>)
          : nextParams
      setEpisode(updated)
      setEpisodeParams(updatedParams)
      episodeParamsRef.current = updatedParams
      setCharacterIntroMode(readEffectiveCharacterIntroMode(updatedParams, projectParamsRef.current))
      const contentChanged = nextFragments.some(
        (frag, index) => frag.content !== prevFragments[index]?.content,
      )
      if (contentChanged) {
        const ep = await dramaApi.saveFragments(
          eid,
          nextFragments.map((f, i) => {
            const prevFragParams =
              f.params && typeof f.params === 'object' && !Array.isArray(f.params)
                ? (f.params as Record<string, unknown>)
                : {}
            return {
              id: typeof f.id === 'number' && f.id > 0 ? f.id : undefined,
              sort_order: i,
              content: f.content,
              cover: f.cover,
              video: f.video,
              duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
              params: { ...prevFragParams, user_edited: true },
              asset_ids: f.asset_ids || [],
            }
          }),
        )
        setEpisode(ep)
        setFragments(
          (ep.fragments || nextFragments).map((f) => ({
            ...f,
            duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
          })),
        )
      }
      setStatus(
        mode === 'model'
          ? t('drama.episodeEdit.charIntroEnabled')
          : t('drama.episodeEdit.charIntroDisabled'),
      )
      setError('')
    } catch (err) {
      setCharacterIntroMode(readEffectiveCharacterIntroMode(prevParams, projectParamsRef.current))
      setEpisodeParams(prevParams)
      episodeParamsRef.current = prevParams
      setFragments(prevFragments)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveCharIntroFailed'))
    }
  }

  return {
    handleLinkLastFrameChange,
    handleEpisodeOutputChange,
    handleEpisodeSubtitleChange,
    handleEpisodeCharacterIntroChange,
  }
}
