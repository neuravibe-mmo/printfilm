/** Sơ lược cốt truyện: Mục lục các tập ở cột bên trái + Quảng cáo/tóm tắt/kịch bản của tập ở cột bên phải */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Lightbulb,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import {
  dramaApi,
  resolveDramaMediaUrl,
  type DramaProject,
  type DramaScript,
} from '../../api/drama'
import { FragmentPlanSkillModal } from '../../components/drama/FragmentPlanSkillModal'
import Modal from '../../components/ui/Modal'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import {
  buildOutlineDirectory,
  episodeBodyCharLen,
  isSubstantialEpisodeCreative,
  mergeDirectoryEpisodeBodies,
  MIN_EPISODE_BODY_CHARS,
  MIN_EPISODE_CREATIVE_CHARS,
  parseEpisodeBodies,
} from './dramaWorkspaceUtils'
import { sumFragmentContentDuration } from './dramaEpisodeEditUtils'
import { OutlineScriptPreview } from './outlineScriptPreview'
import { OutlineSectionCard, type SectionKey } from './OutlineSectionCard'
import { OutlineEpisodeSidebar } from './OutlineEpisodeSidebar'
import { OutlineEpisodeHeader } from './OutlineEpisodeHeader'
import { useOutlineEpisodeActions } from './hooks/useOutlineEpisodeActions'
import { useI18n } from '../../i18n'

type OutlineEpisodePanelProps = {
  projectId: number
  script: DramaScript | null
  episodeCount: number
  summaryReady: boolean
  episodeGenerating: boolean
  imageStyleLabel?: string
  storyType?: string
  onScriptChange: (script: DramaScript) => void
  onProjectChange: (project: DramaProject) => void
  onError: (msg: string) => void
  onOpenEpisodes: () => void
  children?: (parts: { directory: ReactNode; bodies: ReactNode }) => ReactNode
}

export function OutlineEpisodePanel({
  projectId,
  script,
  episodeCount,
  summaryReady,
  episodeGenerating,
  imageStyleLabel,
  storyType,
  onScriptChange,
  onProjectChange,
  onError,
  onOpenEpisodes,
  children,
}: OutlineEpisodePanelProps) {
  const { t } = useI18n()
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState(1)
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    () => new Set(['creative', 'summary', 'body']),
  )
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null)
  const [sectionDraft, setSectionDraft] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [episodeCovers, setEpisodeCovers] = useState<Record<number, string>>({})
  const [episodeShotStats, setEpisodeShotStats] = useState<
    Record<number, { fragmentCount: number; totalSec: number }>
  >({})
  const [menuEpNumber, setMenuEpNumber] = useState<number | null>(null)
  const [renamingEpisodeNumber, setRenamingEpisodeNumber] = useState<number | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [highlightedSection, setHighlightedSection] = useState<SectionKey | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const creativeCardRef = useRef<HTMLElement | null>(null)
  const summaryCardRef = useRef<HTMLElement | null>(null)
  const bodyCardRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (menuEpNumber === null) return
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuEpNumber(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuEpNumber])

  const parsedBodies = useMemo(
    () => parseEpisodeBodies(script),
    [script],
  )
  const directoryEpisodes = useMemo(
    () => buildOutlineDirectory(parsedBodies, episodeCount),
    [parsedBodies, episodeCount],
  )
  const displayEpisodes = useMemo(
    () => mergeDirectoryEpisodeBodies(directoryEpisodes, parsedBodies),
    [directoryEpisodes, parsedBodies],
  )

  useEffect(() => {
    if (!displayEpisodes.some((e) => e.episodeNumber === activeEpisodeNumber)) {
      setActiveEpisodeNumber(displayEpisodes[0]?.episodeNumber ?? 1)
    }
  }, [displayEpisodes, activeEpisodeNumber])

  const selected = useMemo(
    () => displayEpisodes.find((e) => e.episodeNumber === activeEpisodeNumber),
    [displayEpisodes, activeEpisodeNumber],
  )

  useEffect(() => {
    setTitleDraft(selected?.title ?? '')
    setEditingSection(null)
    setSectionDraft('')
  }, [selected?.episodeNumber, selected?.title])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const rows = await dramaApi.listEpisodes(projectId)
        if (cancelled) return
        const map: Record<number, string> = {}
        const shotMap: Record<number, { fragmentCount: number; totalSec: number }> = {}
        for (const ep of rows) {
          const epNo = Number(ep.params?.episodeNumber) || 0
          if (!epNo) continue
          const frags = [...(ep.fragments || [])].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          )
          const meaningfulFrags = frags.filter(
            (f) => Boolean((f.content || '').trim() || (f.video || '').trim() || (f.cover || '').trim()),
          )
          if (meaningfulFrags.length > 0) {
            const totalSec = meaningfulFrags.reduce((sum, f) => {
              const stored = Number(f.duration_sec)
              if (Number.isFinite(stored) && stored > 0) return sum + Math.round(stored)
              return sum + sumFragmentContentDuration(f.content || '')
            }, 0)
            shotMap[epNo] = { fragmentCount: meaningfulFrags.length, totalSec }
          }
          const first = frags.find((f) => (f.cover || '').trim() || (f.video || '').trim())
          if (!first) continue
          const raw = (first.cover || first.video || '').trim()
          if (raw) map[epNo] = resolveDramaMediaUrl(raw)
        }
        setEpisodeCovers(map)
        setEpisodeShotStats(shotMap)
      } catch {
        if (!cancelled) {
          setEpisodeCovers({})
          setEpisodeShotStats({})
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, script?.id, script?.episode_content])

  const canAdd =
    summaryReady &&
    !episodeGenerating &&
    directoryEpisodes.length < 120

  const {
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
    localNotice,
    saveBodies,
    handleAddEpisode,
    handleSaveSection,
    handleGenerate,
    executeGenerate,
    handleConfirmEnter,
    startEnterWithSkills,
    handleConfirmRename,
  } = useOutlineEpisodeActions({
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
  })

  const selectedGenerating =
    Boolean(generatingMode) && generatingEpisodeNumber === (selected?.episodeNumber ?? null)
  const anyEpisodeGenerating = Boolean(generatingMode)
  const busy = selectedGenerating || confirming || saving || adding
  const generateBusy = episodeGenerating || anyEpisodeGenerating || confirming || saving || adding
  const bodyReady = Boolean(selected && selected.body && selected.body.trim().length >= MIN_EPISODE_BODY_CHARS)

  function toggleSection(k: SectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  function startEdit(section: SectionKey) {
    if (!selected) return
    setEditingSection(section)
    if (section === 'creative') setSectionDraft(selected.creative || '')
    else if (section === 'summary') setSectionDraft(selected.summary || '')
    else setSectionDraft(selected.body || '')
    setOpenSections((prev) => new Set([...prev, section]))
  }

  async function copyText(str: string) {
    try {
      await navigator.clipboard.writeText(str)
      setToastMessage(t('common.copied'))
      window.setTimeout(() => setToastMessage(null), 3000)
    } catch {
      onError(t('common.copyFailed'))
    }
  }

  async function handleSaveScenes(nextFullBody: string) {
    if (!selected?.episodeNumber) return
    const num = selected.episodeNumber
    const next = displayEpisodes.map((ep) =>
      ep.episodeNumber === num ? { ...ep, body: nextFullBody } : ep,
    )
    await saveBodies(next)
  }

  const metaTags = useMemo(() => {
    const tags: string[] = []
    const summary = script?.summary as Record<string, unknown> | undefined
    if (summary && typeof summary === 'object') {
      const core = (summary.core_conflict || summary.conflict) as string | undefined
      if (core && typeof core === 'string') {
        const parts = core.split(/[+/&]+/).map((s) => s.trim()).filter(Boolean)
        for (const p of parts.slice(0, 3)) tags.push(p)
      }
    }
    if (storyType) tags.push(storyType)
    return tags.slice(0, 3)
  }, [script?.summary, storyType])

  const charHint = selected
    ? [
        selected.creative ? t('drama.outlinePanel.charHintCreative').replace('{n}', String(episodeBodyCharLen(selected.creative))) : null,
        selected.summary ? t('drama.outlinePanel.charHintSummary').replace('{n}', String(episodeBodyCharLen(selected.summary))) : null,
        selected.body ? t('drama.outlinePanel.charHintBody').replace('{n}', String(episodeBodyCharLen(selected.body))) : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  const directory = (
    <OutlineEpisodeSidebar
      directoryEpisodes={directoryEpisodes}
      displayEpisodes={displayEpisodes}
      activeEpisodeNumber={activeEpisodeNumber}
      summaryReady={summaryReady}
      canAdd={canAdd && !adding}
      adding={adding}
      episodeShotStats={episodeShotStats}
      episodeCovers={episodeCovers}
      menuEpNumber={menuEpNumber}
      renamingEpisodeNumber={renamingEpisodeNumber}
      renameDraft={renameDraft}
      menuRef={menuRef}
      onAddEpisode={() => void handleAddEpisode()}
      onSelectEpisode={(epNo) => {
        onOpenEpisodes()
        setActiveEpisodeNumber(epNo)
      }}
      onMenuToggle={(epNo) => setMenuEpNumber((prev) => (prev === epNo ? null : epNo))}
      onStartRename={(epNo, title) => {
        setMenuEpNumber(null)
        setRenamingEpisodeNumber(epNo)
        setRenameDraft(title)
      }}
      onRenameDraftChange={setRenameDraft}
      onConfirmRename={(epNo) => {
        setRenamingEpisodeNumber(null)
        void handleConfirmRename(epNo, renameDraft)
      }}
      onCancelRename={() => setRenamingEpisodeNumber(null)}
    />
  )

  const bodies = !selected ? (
    <div className="drama-outline-detail-empty">
      <p>{summaryReady ? t('drama.outlinePanel.noEpisodes') : t('drama.outlinePanel.summaryNotReady')}</p>
    </div>
  ) : (
    <section className="drama-outline-detail">
      <OutlineEpisodeHeader
        selected={selected}
        editingSection={editingSection}
        titleDraft={titleDraft}
        imageStyleLabel={imageStyleLabel}
        charHint={charHint}
        metaTags={metaTags}
        bodyReady={bodyReady}
        saving={saving}
        busy={busy}
        generateBusy={generateBusy}
        selectedGenerating={selectedGenerating}
        generatingMode={generatingMode}
        confirming={confirming}
        onTitleDraftChange={setTitleDraft}
        onGenerateBrief={() => void handleGenerate('brief')}
        onGenerateFull={() => handleGenerate('full')}
        onConfirmEnter={() => void handleConfirmEnter()}
      />

      {localError ? <BillingErrorNotice message={localError} className="drama-error" /> : null}
      {localNotice ? <p className="drama-outline-notice">{localNotice}</p> : null}
      {episodeGenerating ? <p className="drama-loader">{t('drama.outlinePanel.allGenerating')}</p> : null}
      {selectedGenerating ? (
        <p className="drama-loader">{t('drama.outlinePanel.thisGenerating').replace('{mode}', generatingMode || '')}</p>
      ) : anyEpisodeGenerating && generatingEpisodeNumber ? (
        <p className="drama-loader">
          {t('drama.outlinePanel.otherGenerating').replace('{no}', String(generatingEpisodeNumber))}
        </p>
      ) : null}

      <div className="drama-outline-sections">
        <OutlineSectionCard
          sectionKey="creative"
          containerRef={creativeCardRef}
          highlighted={highlightedSection === 'creative'}
          icon={<Lightbulb size={18} strokeWidth={1.9} />}
          title={t('drama.outlinePanel.creativeTitle')}
          subtitle={t('drama.outlinePanel.creativeSubtitle')}
          text={selected.creative || ''}
          editing={editingSection === 'creative'}
          draft={sectionDraft}
          open={openSections.has('creative')}
          busy={busy}
          generateBusy={generateBusy}
          placeholder={t('drama.outlinePanel.creativePlaceholder').replace('{n}', String(MIN_EPISODE_CREATIVE_CHARS))}
          regenerateLabel={
            selectedGenerating && generatingMode === 'creative'
              ? t('drama.outlinePanel.generating')
              : !selected.creative?.trim()
                ? 'AI Generate'
                : t('drama.outlinePanel.regenCreative') || 'Tạo lại ý tưởng'
          }
          regenerateIcon={
            selectedGenerating && generatingMode === 'creative' ? (
              <RefreshCw size={14} className="drama-spin" />
            ) : !selected.creative?.trim() ? (
              <Sparkles size={14} />
            ) : (
              <RefreshCw size={14} strokeWidth={2} />
            )
          }
          onToggle={() => toggleSection('creative')}
          onEdit={() => startEdit('creative')}
          onCancel={() => setEditingSection(null)}
          onSave={() => void handleSaveSection('creative')}
          onDraftChange={setSectionDraft}
          onRegenerate={() => void handleGenerate('creative')}
          onCopy={() => void copyText(selected.creative || '')}
        />
        <OutlineSectionCard
          sectionKey="summary"
          containerRef={summaryCardRef}
          highlighted={highlightedSection === 'summary'}
          icon={<BookOpen size={18} strokeWidth={1.9} />}
          title={t('drama.outlinePanel.summaryTitle')}
          subtitle={t('drama.outlinePanel.summarySubtitle')}
          text={selected.summary || ''}
          editing={editingSection === 'summary'}
          draft={sectionDraft}
          open={openSections.has('summary')}
          busy={busy}
          generateBusy={generateBusy}
          placeholder={t('drama.outlinePanel.summaryPlaceholder')}
          regenerateLabel={
            selectedGenerating && generatingMode === 'brief'
              ? t('drama.outlinePanel.filling')
              : selectedGenerating && generatingMode === 'summary'
                ? t('drama.outlinePanel.generating')
                : selected.summary?.trim()
                  ? t('drama.outlinePanel.regen')
                  : t('drama.outlinePanel.genSummary')
          }
          onToggle={() => toggleSection('summary')}
          onEdit={() => startEdit('summary')}
          onCancel={() => setEditingSection(null)}
          onSave={() => void handleSaveSection('summary')}
          onDraftChange={setSectionDraft}
          onRegenerate={() =>
            void handleGenerate(
              isSubstantialEpisodeCreative(selected.creative) ? 'summary' : 'brief',
            )
          }
          onCopy={() => void copyText(selected.summary || '')}
        />
        <OutlineSectionCard
          sectionKey="body"
          containerRef={bodyCardRef}
          highlighted={highlightedSection === 'body'}
          icon={<FileText size={18} strokeWidth={1.9} />}
          title={t('drama.outlinePanel.bodyTitle')}
          subtitle={t('drama.outlinePanel.bodySubtitle')}
          text={selected.body || ''}
          editing={editingSection === 'body'}
          draft={sectionDraft}
          open={openSections.has('body')}
          busy={busy}
          generateBusy={generateBusy}
          placeholder={t('drama.outlinePanel.bodyPlaceholder').replace('{n}', String(MIN_EPISODE_BODY_CHARS))}
          regenerateLabel={
            selectedGenerating && generatingMode === 'body'
              ? t('drama.outlinePanel.generating')
              : selected.body?.trim()
                ? t('drama.outlinePanel.regenScript')
                : t('drama.outlinePanel.genScript')
          }
          onToggle={() => toggleSection('body')}
          onEdit={() => startEdit('body')}
          onCancel={() => setEditingSection(null)}
          onSave={() => void handleSaveSection('body')}
          onDraftChange={setSectionDraft}
          onRegenerate={() => void handleGenerate('body')}
          onCopy={() => void copyText(selected.body || '')}
          scriptPreview={
            <OutlineScriptPreview
              text={selected.body || ''}
              empty={t('drama.outlinePanel.bodyPlaceholder').replace('{n}', String(MIN_EPISODE_BODY_CHARS))}
              busy={busy}
              shotStats={episodeShotStats[selected.episodeNumber || 0] || null}
              onSaveScenes={handleSaveScenes}
            />
          }
        />
      </div>
    </section>
  )

  const toastElement = toastMessage ? (
    <div
      className="drama-outline-toast"
      role="status"
      aria-live="polite"
      onClick={() => setToastMessage(null)}
    >
      <CheckCircle2 size={16} className="drama-outline-toast-icon" />
      <span>{toastMessage}</span>
    </div>
  ) : null

  const regenFullConfirmModal = (
    <Modal
      open={regenFullConfirmOpen}
      onClose={() => setRegenFullConfirmOpen(false)}
      title={t('drama.outlinePanel.regenFullTitle')}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
          <button
            type="button"
            className="drama-btn-ghost"
            onClick={() => setRegenFullConfirmOpen(false)}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="drama-btn-primary"
            style={{ background: '#dc2626', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              setRegenFullConfirmOpen(false)
              void executeGenerate('full')
            }}
          >
            <RefreshCw size={14} />
            {t('drama.outlinePanel.regenFullConfirm')}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '8px 0 4px' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={22} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 650, color: '#0f172a' }}>
            {selected?.title
              ? `Tập ${selected.episodeNumber}: ${selected.title}`
              : `Tập ${selected?.episodeNumber || ''}`}
          </h4>
          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
            {t('drama.outlinePanel.regenFullMessage')}
          </p>
          {selected?.body?.trim() ? (
            <div
              style={{
                fontSize: '12px',
                color: '#b91c1c',
                background: '#fff1f2',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #fecdd3',
                lineHeight: 1.5,
              }}
            >
              ⚠️ Kịch bản hiện tại ({selected.body.trim().length} ký tự) sẽ bị xóa và ghi đè hoàn toàn. Nếu tập này đã vào phân cảnh, toàn bộ phân cảnh video cũ sẽ bị làm mới.
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )

  const regenCreativeConfirmModal = (
    <Modal
      open={regenCreativeConfirmOpen}
      onClose={() => setRegenCreativeConfirmOpen(false)}
      title={t('drama.outlinePanel.regenCreativeTitle')}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
          <button
            type="button"
            className="drama-btn-ghost"
            onClick={() => setRegenCreativeConfirmOpen(false)}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="drama-btn-primary"
            style={{ background: '#dc2626', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              setRegenCreativeConfirmOpen(false)
              void executeGenerate('creative')
            }}
          >
            <RefreshCw size={14} />
            {t('drama.outlinePanel.regenCreativeConfirm')}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '8px 0 4px' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={22} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 650, color: '#0f172a' }}>
            {selected?.title
              ? `Tập ${selected.episodeNumber}: ${selected.title}`
              : `Tập ${selected?.episodeNumber || ''}`}
          </h4>
          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
            {t('drama.outlinePanel.regenCreativeMessage')}
          </p>
          {selected?.creative?.trim() ? (
            <div
              style={{
                fontSize: '12px',
                color: '#475569',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                borderRadius: '8px',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4, color: '#0f172a' }}>Ý tưởng hiện tại:</strong>
              {selected.creative.trim()}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )

  const modals = (
    <>
      <FragmentPlanSkillModal
        open={enterSkillOpen}
        title={t('drama.outlinePanel.enterShot')}
        message={t('drama.outlinePanel.enterShotMessage')}
        confirmText={confirming ? t('drama.outlinePanel.entering') : t('drama.outlinePanel.startShot')}
        onCancel={() => {
          if (!confirming) setEnterSkillOpen(false)
        }}
        onConfirm={(skillIds) => void startEnterWithSkills(skillIds)}
      />
      {regenFullConfirmModal}
      {regenCreativeConfirmModal}
    </>
  )

  if (children) {
    return (
      <>
        {children({ directory, bodies })}
        {toastElement}
        {modals}
      </>
    )
  }
  return (
    <div className="drama-outline drama-outline-v2">
      {directory}
      <div className="drama-outline-main">{bodies}</div>
      {toastElement}
      {modals}
    </div>
  )
}
