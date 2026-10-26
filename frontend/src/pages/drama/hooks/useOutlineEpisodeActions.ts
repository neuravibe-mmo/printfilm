import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  dramaApi,
  type DramaEpisodeBody,
  type DramaProject,
  type DramaScript,
} from '../../../api/drama'
import {
  buildEpisodeContentUpdate,
  isSubstantialEpisodeBody,
  isSubstantialEpisodeCreative,
  MIN_EPISODE_BODY_CHARS,
  MIN_EPISODE_CREATIVE_CHARS,
} from '../dramaWorkspaceUtils'
import type { SectionKey } from '../OutlineSectionCard'
import { useI18n } from '../../../i18n'

export type UseOutlineEpisodeActionsParams = {
  projectId: number
  script: DramaScript | null
  selected: DramaEpisodeBody | undefined
  displayEpisodes: DramaEpisodeBody[]
  editingSection: SectionKey | null
  sectionDraft: string
  titleDraft: string
  canAdd: boolean
  creativeCardRef: React.RefObject<HTMLElement | null>
  summaryCardRef: React.RefObject<HTMLElement | null>
  bodyCardRef: React.RefObject<HTMLElement | null>
  onScriptChange: (script: DramaScript) => void
  onProjectChange: (project: DramaProject) => void
  onError: (msg: string) => void
  onOpenEpisodes: () => void
  setActiveEpisodeNumber: (no: number) => void
  setEditingSection: (s: SectionKey | null) => void
  setSectionDraft: (s: string) => void
  setTitleDraft: (s: string) => void
  setOpenSections: React.Dispatch<React.SetStateAction<Set<SectionKey>>>
  setHighlightedSection: (s: SectionKey | null) => void
  setToastMessage: (msg: string | null) => void
}

export function useOutlineEpisodeActions({
  projectId,
  script,
  selected,
  displayEpisodes,
  editingSection,
  sectionDraft,
  titleDraft,
  canAdd,
  creativeCardRef,
  summaryCardRef,
  bodyCardRef,
  onScriptChange,
  onProjectChange,
  onError,
  onOpenEpisodes,
  setActiveEpisodeNumber,
  setEditingSection,
  setSectionDraft,
  setTitleDraft,
  setOpenSections,
  setHighlightedSection,
  setToastMessage,
}: UseOutlineEpisodeActionsParams) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [generatingMode, setGeneratingMode] = useState<string | null>(null)
  const [generatingEpisodeNumber, setGeneratingEpisodeNumber] = useState<number | null>(null)
  const [enterSkillOpen, setEnterSkillOpen] = useState(false)
  const [regenFullConfirmOpen, setRegenFullConfirmOpen] = useState(false)
  const [regenCreativeConfirmOpen, setRegenCreativeConfirmOpen] = useState(false)
  const [localError, setLocalError] = useState('')
  const [localNotice, setLocalNotice] = useState('')

  const highlightTimerRef = useRef<number | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  async function pollOptimize(tokenEpisode: number) {
    const started = Date.now()
    let lastErr: Error | null = null
    while (Date.now() - started < 8 * 60 * 1000) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const cur = await dramaApi.getScript(projectId)
        onScriptChange(cur)
        lastErr = null
        const st = String((cur.params || {}).episode_optimize_status || '')
        const num = Number((cur.params || {}).episode_optimize_number || 0)
        if (num === tokenEpisode && st === 'completed') return cur
        if (num === tokenEpisode && st === 'failed') {
          throw new Error(String((cur.params || {}).episode_optimize_error || t('drama.outlinePanel.genFailed')))
        }
        if (st !== 'generating') return cur
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(t('drama.outlinePanel.pollFailed'))
      }
    }
    throw lastErr || new Error(t('drama.outlinePanel.genTimeout'))
  }

  async function saveBodies(nextBodies: DramaEpisodeBody[]) {
    const updated = await dramaApi.updateScript(projectId, {
      episode_content: buildEpisodeContentUpdate(script, nextBodies),
    })
    onScriptChange(updated)
    return updated
  }

  async function handleAddEpisode() {
    if (!canAdd) return
    setAdding(true)
    setLocalError('')
    try {
      const res = await dramaApi.addEpisode({ project_id: projectId })
      onScriptChange(res.script)
      const p = await dramaApi.getProject(projectId)
      onProjectChange(p)
      setActiveEpisodeNumber(res.episode_number)
      setEditingSection('creative')
      setSectionDraft('')
      onOpenEpisodes()
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('drama.outlinePanel.addEpisodeFailed')
      setLocalError(msg)
      onError(msg)
    } finally {
      setAdding(false)
    }
  }

  async function handleSaveSection(section: SectionKey) {
    if (!selected?.episodeNumber) return
    setSaving(true)
    setLocalError('')
    try {
      const num = selected.episodeNumber
      const next = displayEpisodes.map((ep) => {
        if (ep.episodeNumber !== num) return ep
        if (section === 'creative') return { ...ep, creative: sectionDraft, title: titleDraft || ep.title }
        if (section === 'summary') return { ...ep, summary: sectionDraft, title: titleDraft || ep.title }
        return { ...ep, body: sectionDraft, title: titleDraft || ep.title }
      })
      await saveBodies(next)
      setEditingSection(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('drama.outlinePanel.saveFailed')
      setLocalError(msg)
      onError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function executeGenerate(mode: 'summary' | 'body' | 'full' | 'brief' | 'creative') {
    if (!selected?.episodeNumber) return
    const hadExistingBody = Boolean(selected.body?.trim())
    const creative = editingSection === 'creative' ? sectionDraft : selected.creative || ''
    if ((mode === 'summary' || mode === 'full') && !isSubstantialEpisodeCreative(creative)) {
      setLocalError(t('drama.outlinePanel.creativeMinChars').replace('{n}', String(MIN_EPISODE_CREATIVE_CHARS)))
      return
    }
    if (mode === 'brief' && !isSubstantialEpisodeBody(selected.body)) {
      setLocalError(t('drama.outlinePanel.bodyMinCharsBrief').replace('{n}', String(MIN_EPISODE_BODY_CHARS)))
      return
    }
    const targetEpisode = selected.episodeNumber
    setGeneratingMode(mode)
    setGeneratingEpisodeNumber(targetEpisode)
    setLocalError('')
    setLocalNotice('')
    try {
      if (editingSection === 'creative' || titleDraft !== selected.title) {
        const next = displayEpisodes.map((ep) =>
          ep.episodeNumber === targetEpisode
            ? {
                ...ep,
                creative: editingSection === 'creative' ? sectionDraft : ep.creative,
                title: titleDraft || ep.title,
              }
            : ep,
        )
        await saveBodies(next)
        setEditingSection(null)
      }
      await dramaApi.episodeScript({
        project_id: projectId,
        episode_number: targetEpisode,
        generate_mode: mode,
        creative: creative || undefined,
        title: titleDraft || selected.title,
      })
      const cur = await pollOptimize(targetEpisode)
      const created = Number((cur.params || {}).episode_optimize_assets_created || 0)
      if ((mode === 'body' || mode === 'full') && created > 0) {
        setLocalNotice(t('drama.outlinePanel.assetsCreated').replace('{n}', String(created)))
      }
      if (mode === 'creative') {
        setOpenSections((prev) => new Set([...prev, 'creative']))
        if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
        setHighlightedSection('creative')
        highlightTimerRef.current = window.setTimeout(() => {
          setHighlightedSection(null)
          highlightTimerRef.current = null
        }, 5000)

        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
        setToastMessage(t('drama.outlinePanel.creativeGeneratedSuccess') || 'Ý tưởng tập đã được tạo thành công')
        toastTimerRef.current = window.setTimeout(() => {
          setToastMessage(null)
          toastTimerRef.current = null
        }, 5000)

        window.setTimeout(() => {
          creativeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 50)
      }
      if (mode === 'summary') {
        setOpenSections((prev) => new Set([...prev, 'summary']))
        if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
        setHighlightedSection('summary')
        highlightTimerRef.current = window.setTimeout(() => {
          setHighlightedSection(null)
          highlightTimerRef.current = null
        }, 5000)

        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
        setToastMessage(t('drama.outlinePanel.summaryGeneratedSuccess') || 'Tóm tắt cốt truyện đã được tạo thành công')
        toastTimerRef.current = window.setTimeout(() => {
          setToastMessage(null)
          toastTimerRef.current = null
        }, 5000)

        window.setTimeout(() => {
          summaryCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 50)
      }
      if (mode === 'body') {
        setOpenSections((prev) => new Set([...prev, 'body']))
        if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
        setHighlightedSection('body')
        highlightTimerRef.current = window.setTimeout(() => {
          setHighlightedSection(null)
          highlightTimerRef.current = null
        }, 5000)

        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
        const msg = hadExistingBody
          ? (t('drama.outlinePanel.scriptRegeneratedSuccess') || 'Kịch bản đã được tạo lại thành công')
          : (t('drama.outlinePanel.scriptGeneratedSuccess') || 'Kịch bản đã được tạo thành công')
        setToastMessage(msg)
        toastTimerRef.current = window.setTimeout(() => {
          setToastMessage(null)
          toastTimerRef.current = null
        }, 5000)

        window.setTimeout(() => {
          bodyCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 50)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('drama.outlinePanel.genFailed')
      setLocalError(msg)
      onError(msg)
    } finally {
      setGeneratingMode(null)
      setGeneratingEpisodeNumber(null)
    }
  }

  function handleGenerate(mode: 'summary' | 'body' | 'full' | 'brief' | 'creative') {
    if (mode === 'creative' && selected?.creative?.trim()) {
      setRegenCreativeConfirmOpen(true)
      return
    }
    if (mode === 'full' && selected?.body?.trim()) {
      setRegenFullConfirmOpen(true)
      return
    }
    void executeGenerate(mode)
  }

  async function handleConfirmEnter() {
    if (!selected?.episodeNumber) return
    if (!isSubstantialEpisodeBody(selected.body)) {
      setLocalError(t('drama.outlinePanel.bodyMinCharsEnter').replace('{n}', String(MIN_EPISODE_BODY_CHARS)))
      return
    }
    setLocalError('')
    setConfirming(true)
    try {
      const rows = await dramaApi.listEpisodes(projectId)
      const existing = rows.find(
        (ep) => Number(ep.params?.episodeNumber) === Number(selected.episodeNumber),
      )
      const hasMeaningfulFragments = (existing?.fragments || []).some(
        (f) => Boolean((f.content || '').trim() || (f.video || '').trim() || (f.cover || '').trim()),
      )
      if (existing && hasMeaningfulFragments) {
        navigate(`/drama/projects/${projectId}/episodes/${existing.id}`)
        return
      }
      setEnterSkillOpen(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('drama.outlinePanel.enterFailed')
      setLocalError(msg)
      onError(msg)
    } finally {
      setConfirming(false)
    }
  }

  async function startEnterWithSkills(skillIds: number[]) {
    if (!selected?.episodeNumber) return
    setEnterSkillOpen(false)
    setConfirming(true)
    setLocalError('')
    try {
      const res = await dramaApi.confirmEpisodeFromScript({
        project_id: projectId,
        episode_number: selected.episodeNumber,
      })
      const episodeId = res.episode.id
      try {
        await dramaApi.planEpisodeFragments(episodeId, {
          force: true,
          fallback_rules: true,
          skill_ids: skillIds,
        })
      } catch (planErr) {
        onError(planErr instanceof Error ? planErr.message : t('drama.outlinePanel.planQueueFailed'))
      }
      navigate(`/drama/projects/${projectId}/episodes/${episodeId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('drama.outlinePanel.enterFailed')
      setLocalError(msg)
      onError(msg)
    } finally {
      setConfirming(false)
    }
  }

  async function handleConfirmRename(epNo: number, nextTitle: string) {
    const trimmed = nextTitle.trim()
    setSaving(true)
    try {
      const next = displayEpisodes.map((ep) =>
        ep.episodeNumber === epNo ? { ...ep, title: trimmed } : ep,
      )
      if (selected?.episodeNumber === epNo) {
        setTitleDraft(trimmed)
      }
      await saveBodies(next)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('drama.outlinePanel.saveFailed')
      setLocalError(msg)
      onError(msg)
    } finally {
      setSaving(false)
    }
  }

  return {
    saving,
    adding,
    confirming,
    generatingMode,
    generatingEpisodeNumber,
    enterSkillOpen,
    setEnterSkillOpen,
    regenFullConfirmOpen,
    setRegenFullConfirmOpen,
    regenCreativeConfirmOpen,
    setRegenCreativeConfirmOpen,
    localError,
    setLocalError,
    localNotice,
    saveBodies,
    handleAddEpisode,
    handleSaveSection,
    handleGenerate,
    executeGenerate,
    handleConfirmEnter,
    startEnterWithSkills,
    handleConfirmRename,
  }
}
