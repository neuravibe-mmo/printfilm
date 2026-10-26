import { useState } from 'react'
import { useI18n } from '../../../i18n'
import {
  dramaApi,
  type DramaAsset,
  type DramaEpisode,
  type DramaFragment,
} from '../../../api/drama'
import { dialog } from '../../../lib/dialog'
import {
  collectDramaGenerateGateIssues,
  formatDramaGateMessage,
} from '../../../lib/dramaEpisodeScriptValidate'
import {
  enqueueEpisodeVideoJobs,
  ensureEpisodeVideoStatusPoll,
} from '../../../lib/dramaGenQueue'
import {
  subtitleModeUsesModelOutput,
  type DramaSubtitleMode,
} from '../../../lib/dramaSubtitleBoard'
import {
  formatFragLabel,
  resolveFragmentDurationSec,
} from '../dramaEpisodeEditUtils'

export function readFragmentPlanStatus(ep: DramaEpisode | null): string {
  // Ưu tiên đọc các nhiệm vụ lập kế hoạch bảng phân cảnh trong trung tâm nhiệm vụ thống nhất; trạng thái thông số cũ được sử dụng làm bản sao lưu
  const active = (ep?.active_tasks || []).find((task) => task.task_type === 'fragment_plan')
  if (
    active &&
    !active.cancel_requested &&
    ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review'].includes(active.status)
  ) {
    return 'generating'
  }
  const st = ep?.params?.fragment_plan_status
  return typeof st === 'string' ? st : ''
}

interface UseEpisodeGenerationParams {
  pid: number
  eid: number
  episode: DramaEpisode | null
  displayEpisodeName: string
  selected: DramaFragment | null
  selectedIndex: number
  selectedDuration: number
  fragments: DramaFragment[]
  assets: DramaAsset[]
  modelId: string
  subtitleMode: DramaSubtitleMode
  linkLastFrame: boolean
  continuityBlockedReason: string
  continuityQueueHint: string
  selectedIsGenerating: boolean
  selectedGenerateLocked: boolean
  generateAllLocked: boolean
  planFragmentsLocked: boolean
  episodeParamsRef: React.MutableRefObject<Record<string, unknown>>
  save: () => Promise<DramaEpisode>
  setEpisode: React.Dispatch<React.SetStateAction<DramaEpisode | null>>
  setEpisodeParams: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  setFragments: React.Dispatch<React.SetStateAction<DramaFragment[]>>
  setSelectedIndex: (index: number) => void
  setEditing: (editing: boolean) => void
  setPreviewVersionId: (id: string | null) => void
  setBusy: (busy: boolean) => void
  setStatus: (status: string) => void
  setError: (error: string) => void
}

export function useEpisodeGeneration({
  pid,
  eid,
  episode,
  displayEpisodeName,
  selected,
  selectedIndex,
  selectedDuration,
  fragments,
  assets,
  modelId,
  subtitleMode,
  linkLastFrame,
  continuityBlockedReason,
  continuityQueueHint,
  selectedIsGenerating,
  selectedGenerateLocked,
  generateAllLocked,
  planFragmentsLocked,
  episodeParamsRef,
  save,
  setEpisode,
  setEpisodeParams,
  setFragments,
  setSelectedIndex,
  setEditing,
  setPreviewVersionId,
  setBusy,
  setStatus,
  setError,
}: UseEpisodeGenerationParams) {
  const { t } = useI18n()
  const [planModalOpen, setPlanModalOpen] = useState(false)

  // Bỏ qua các phân cảnh cũ đã hoàn thành và không đổi khi sinh toàn bộ
  function shouldSkipGenerateAllFragment(frag: DramaFragment): boolean {
    if (!frag.video || !frag.id) return false
    const prev = (episode?.fragments || []).find((item) => item.id === frag.id)
    if (!prev?.video) return false
    const sameContent = (prev.content || '') === (frag.content || '')
    const sameCover = (prev.cover || '') === (frag.cover || '')
    const sameDuration =
      resolveFragmentDurationSec(prev.content || '', prev.duration_sec) ===
      resolveFragmentDurationSec(frag.content || '', frag.duration_sec)
    const prevAssetIds = [...(prev.asset_ids || [])].sort((a, b) => a - b)
    const nextAssetIds = [...(frag.asset_ids || [])].sort((a, b) => a - b)
    const sameAssets =
      prevAssetIds.length === nextAssetIds.length &&
      prevAssetIds.every((id, index) => id === nextAssetIds[index])
    return sameContent && sameCover && sameDuration && sameAssets
  }

  // Tạo storyboard hiện đang được chọn
  async function generateSelected() {
    if (!selected) {
      setError(t('drama.episodeEdit.selectFrag'))
      return
    }
    if (selectedGenerateLocked) {
      if (continuityBlockedReason) {
        setError(continuityBlockedReason)
        await dialog.alert({
          title: t('drama.episodeEdit.cannotGenTitle'),
          message: `${continuityBlockedReason}. ${t('drama.episodeEdit.needPrevFrame')}`,
        })
      } else if (selectedIsGenerating) {
        setError(t('drama.episodeEdit.waitCurrent'))
      } else {
        setError(t('drama.episodeEdit.waitOp'))
      }
      return
    }

    const { blocking, warnings } = collectDramaGenerateGateIssues(selected, assets)
    if (blocking.length > 0) {
      setError(blocking.map((i) => i.message).join('；'))
      await dialog.alert({
        title: t('drama.episodeEdit.cannotGenTitle'),
        message: formatDramaGateMessage(blocking, warnings, t('drama.episodeEdit.fixScriptFirst')),
      })
      return
    }

    const fragLabel = formatFragLabel(selectedIndex, selectedDuration, t)
    const isRegen = Boolean(selected.video)
    const ok = await dialog.confirm({
      title: isRegen
        ? t('drama.episodeEdit.regenVideoTitle')
        : t('drama.episodeEdit.genVideoTitle'),
      message: formatDramaGateMessage(
        [],
        warnings,
        isRegen
          ? t('drama.episodeEdit.regenFragMsg').replace('{label}', fragLabel)
          : linkLastFrame
            ? continuityQueueHint
              ? t('drama.episodeEdit.saveQueueMsg')
                  .replace('{label}', fragLabel)
                  .replace('{hint}', continuityQueueHint)
              : t('drama.episodeEdit.saveTailMsg').replace('{label}', fragLabel)
            : t('drama.episodeEdit.saveIndepMsg').replace('{label}', fragLabel),
      ),
      confirmText:
        warnings.length > 0
          ? t('drama.episodeEdit.genAnyway')
          : isRegen
            ? t('drama.episodeEdit.regenConfirm')
            : t('drama.episodeEdit.genConfirm'),
    })
    if (!ok) return
    setBusy(true)
    setError('')
    setStatus(
      isRegen
        ? t('drama.episodeEdit.statusRegenQueue')
        : t('drama.episodeEdit.statusGenQueue'),
    )
    try {
      const ep = await save()
      setBusy(true)
      const frag = (ep.fragments || [])[selectedIndex]
      if (!frag?.id) {
        throw new Error(t('drama.episodeEdit.fragNotFound'))
      }
      await dramaApi.generateEpisode(eid, [frag.id], modelId)
      setFragments((prev) =>
        prev.map((f) =>
          f.id === frag.id
            ? {
                ...f,
                params: {
                  ...(f.params || {}),
                  generation: { status: 'queued', message: t('drama.episodeEdit.queued') },
                },
              }
            : f,
        ),
      )
      enqueueEpisodeVideoJobs({
        projectId: pid,
        episodeId: eid,
        episodeName: displayEpisodeName,
        fragments: (ep.fragments || []).map((f, i) => ({
          id: f.id,
          sort_order: f.sort_order ?? i,
        })),
        fragmentIds: [frag.id],
      })
      setBusy(false)
      setStatus(
        isRegen
          ? t('drama.episodeEdit.regenQueued').replace('{label}', fragLabel)
          : t('drama.episodeEdit.genQueued').replace('{label}', fragLabel),
      )
      ensureEpisodeVideoStatusPoll()
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.genFailed'))
    }
  }

  // Chuyển video lịch sử sang video chính
  async function activateVideoVersion(versionId: string) {
    if (!selected?.id || selectedIsGenerating) return
    const ok = await dialog.confirm({
      title: t('drama.episodeEdit.switchVersionTitle'),
      message: t('drama.episodeEdit.switchVersionMessage'),
      confirmText: t('drama.episodeEdit.switchVersionConfirm'),
    })
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      const result = await dramaApi.activateFragmentVideoVersion(selected.id, versionId)
      setFragments((prev) =>
        prev.map((f) =>
          f.id === selected.id
            ? {
                ...f,
                video: result.video,
                cover: result.cover || '',
                params: {
                  ...(f.params || {}),
                  video_versions: result.video_versions,
                  lastFrameUrl: result.lastFrameUrl || undefined,
                  generation: {
                    status: 'done',
                    video: result.video,
                    cover: result.cover,
                    lastFrameUrl: result.lastFrameUrl,
                  },
                },
              }
            : f,
        ),
      )
      setPreviewVersionId(null)
      setStatus(t('drama.episodeEdit.versionSwitched'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.switchVersionFailed'))
    } finally {
      setBusy(false)
    }
  }

  // Tạo bằng một cú nhấp chuột cho toàn bộ tập
  async function generateAll(opts?: { forceRegen?: boolean; skipConfirm?: boolean }) {
    if (fragments.length === 0) {
      setError(t('drama.episodeEdit.noFrags'))
      return
    }
    if (generateAllLocked) {
      setError(t('drama.episodeEdit.submitting'))
      return
    }

    const allBlocking: string[] = []
    const allWarnings: string[] = []
    const doneIndices: number[] = []
    for (let i = 0; i < fragments.length; i++) {
      if (!opts?.forceRegen && shouldSkipGenerateAllFragment(fragments[i])) {
        doneIndices.push(i)
        continue
      }
      const { blocking, warnings } = collectDramaGenerateGateIssues(fragments[i], assets)
      const label = formatFragLabel(i, fragments[i]?.duration_sec, t)
      for (const issue of blocking) allBlocking.push(`${label}：${issue.message}`)
      for (const issue of warnings) allWarnings.push(`${label}：${issue.message}`)
    }
    const pendingCount = fragments.length - doneIndices.length
    if (pendingCount <= 0) {
      setStatus(t('drama.episodeEdit.allDoneSkip'))
      return
    }
    if (allBlocking.length > 0) {
      setError(allBlocking[0] || t('drama.episodeEdit.validateFailed'))
      await dialog.alert({
        title: t('drama.episodeEdit.cannotGenAllTitle'),
        message: [
          t('drama.episodeEdit.fixFirst'),
          '',
          ...allBlocking.slice(0, 8).map((m) => `· ${m}`),
        ].join('\n'),
      })
      return
    }

    if (!opts?.skipConfirm) {
      const ok = await dialog.confirm({
        title: opts?.forceRegen
          ? t('drama.episodeEdit.regenAllTitle')
          : t('drama.episodeEdit.genAllTitle'),
        message: formatDramaGateMessage(
          [],
          allWarnings.slice(0, 8).map((message) => ({ level: 'warn' as const, message })),
          opts?.forceRegen
            ? t('drama.episodeEdit.regenAllMsg').replace('{n}', String(pendingCount))
            : linkLastFrame
              ? t('drama.episodeEdit.genAllSeqMsg')
                  .replace('{n}', String(pendingCount))
                  .replace('{done}', String(doneIndices.length))
              : t('drama.episodeEdit.genAllParMsg')
                  .replace('{n}', String(pendingCount))
                  .replace('{done}', String(doneIndices.length)),
        ),
        confirmText:
          allWarnings.length > 0
            ? t('drama.episodeEdit.genAllAnyway')
            : opts?.forceRegen
              ? t('drama.episodeEdit.regenAllConfirm')
              : t('drama.episodeEdit.genAllConfirm'),
        tone: 'danger',
      })
      if (!ok) return
    }
    setBusy(true)
    setError('')
    setStatus(t('drama.episodeEdit.statusGenAll').replace('{n}', String(pendingCount)))
    try {
      const ep = await save()
      setBusy(true)
      const ids = (ep.fragments || [])
        .filter((_, index) => !doneIndices.includes(index))
        .map((f) => f.id)
        .filter((id): id is number => typeof id === 'number' && id > 0)
      if (ids.length === 0) {
        setStatus(t('drama.episodeEdit.allDoneAfterSave'))
        setBusy(false)
        return
      }
      const genResult = await dramaApi.generateEpisode(eid, ids, modelId)
      const queuedIds =
        Array.isArray(genResult.fragment_ids) && genResult.fragment_ids.length > 0
          ? genResult.fragment_ids
          : ids
      enqueueEpisodeVideoJobs({
        projectId: pid,
        episodeId: eid,
        episodeName: displayEpisodeName,
        fragments: (ep.fragments || []).map((f, i) => ({
          id: f.id,
          sort_order: f.sort_order ?? i,
        })),
        fragmentIds: queuedIds,
      })
      const deferred = Number(genResult.deferred_count || 0)
      const limit = Number(genResult.user_job_limit || 0)
      if (deferred > 0 && limit > 0) {
        setStatus(
          t('drama.episodeEdit.queuedWithLimit')
            .replace('{n}', String(queuedIds.length))
            .replace('{limit}', String(limit))
            .replace('{deferred}', String(deferred)),
        )
      } else {
        setStatus(t('drama.episodeEdit.queuedN').replace('{n}', String(queuedIds.length)))
      }
      setBusy(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.genAllFailed'))
      setBusy(false)
    }
  }

  function planFragmentsWithLlm() {
    if (planFragmentsLocked) {
      setError(t('drama.episodeEdit.genRunning'))
      return
    }
    setPlanModalOpen(true)
  }

  async function startPlanFragments(skillIds: number[]) {
    setPlanModalOpen(false)
    setBusy(true)
    setError('')
    setStatus(t('drama.episodeEdit.aiPlanning'))
    try {
      await dramaApi.planEpisodeFragments(eid, {
        force: true,
        fallback_rules: true,
        skill_ids: skillIds,
        subtitle_enabled: subtitleModeUsesModelOutput(subtitleMode),
      })
      const started = Date.now()
      while (Date.now() - started < 10 * 60 * 1000) {
        await new Promise((r) => setTimeout(r, 2500))
        const ep = await dramaApi.getEpisode(eid)
        const st = readFragmentPlanStatus(ep)
        if (st === 'completed') {
          setEpisode(ep)
          const nextParams = (ep.params as Record<string, unknown>) || {}
          setEpisodeParams(nextParams)
          episodeParamsRef.current = nextParams
          setFragments(ep.fragments || [])
          setSelectedIndex(0)
          setEditing(false)
          const mode = String(ep.params?.fragment_plan_mode || 'llm')
          const count = Number(ep.params?.fragment_plan_count) || (ep.fragments || []).length
          setStatus(
            mode === 'rules_fallback'
              ? t('drama.episodeEdit.planRulesFallback').replace('{count}', String(count))
              : t('drama.episodeEdit.planAiDone').replace('{count}', String(count)),
          )
          setBusy(false)
          return
        }
        if (st === 'failed') {
          const msg = String(ep.params?.fragment_plan_error || t('drama.episodeEdit.aiFailed'))
          setError(msg)
          setBusy(false)
          return
        }
        setStatus(t('drama.episodeEdit.aiPlanning'))
      }
      throw new Error(t('drama.episodeEdit.aiTimeout'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.aiFailed'))
      setBusy(false)
    }
  }

  return {
    planModalOpen,
    setPlanModalOpen,
    generateSelected,
    generateAll,
    activateVideoVersion,
    planFragmentsWithLlm,
    startPlanFragments,
  }
}
