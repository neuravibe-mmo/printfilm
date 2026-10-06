import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import type { Project, Shot } from '../../api'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import AppShell from '../../components/layout/AppShell'
import ComingSoon from '../../components/ui/ComingSoon'
import { IconChevronLeft, IconPlus, IconRedo, IconUndo } from '../../components/ui/Icons'
import { STATUS_CN, shotsByNo } from '../../lib/status'
import { downloadSingleVideo } from '../../lib/clientDownload'

type PanelTab = 'script' | 'image' | 'voice' | 'transition'

type UndoAction =
  | {
      type: 'narration'
      label: string
      shotId: number
      prevText: string
      nextText: string
      persisted: boolean
    }
  | {
      type: 'add_shot'
      label: string
      createdShotId: number
      prevActiveShotId: number | null
    }
  | {
      type: 'image_change'
      label: string
      shotId: number
      prevImageUrl: string | null
      prevVideoUrl: string | null
      nextImageUrl: string | null
      nextVideoUrl: string | null
    }
  | {
      type: 'audio_change'
      label: string
      shotId: number
      prevAudioUrl: string | null
      nextAudioUrl: string | null
    }

export default function EditorPage() {
  const { t } = useI18n()
  const PANEL_TABS: PanelTab[] = ['script', 'image', 'voice', 'transition']

  const { id } = useParams()
  const projectId = Number(id)
  const nav = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [activeShotId, setActiveShotId] = useState<number | null>(null)
  const [tab, setTab] = useState<PanelTab>('script')
  const [narration, setNarration] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const [redoStack, setRedoStack] = useState<UndoAction[]>([])
  const lastCommittedNarrationRef = useRef<{ shotId: number; text: string }>({ shotId: 0, text: '' })
  const narrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shotFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      nav('/auth')
      return
    }
    if (!projectId) {
      nav('/studio/new')
      return
    }
    api
      .getProject(projectId)
      .then((p) => {
        setProject(p)
        const first = p.shots[0]
        if (first) {
          setActiveShotId(first.id)
          setNarration(first.narration || '')
          lastCommittedNarrationRef.current = { shotId: first.id, text: first.narration || '' }
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadFailed')))
  }, [nav, projectId])

  const orderedShots = useMemo(() => shotsByNo(project?.shots), [project?.shots])
  const shot: Shot | undefined = useMemo(
    () => orderedShots.find((s) => s.id === activeShotId),
    [orderedShots, activeShotId],
  )

  const totalDuration = useMemo(
    () => (project?.shots || []).reduce((s, x) => s + (Number(x.duration) || 0), 0),
    [project?.shots],
  )

  function selectShot(s: Shot) {
    if (shot && narration !== lastCommittedNarrationRef.current.text && lastCommittedNarrationRef.current.shotId === shot.id) {
      const prev = lastCommittedNarrationRef.current.text
      const next = narration
      setUndoStack((prevStack) => [
        ...prevStack,
        {
          type: 'narration',
          label: 'Sửa kịch bản',
          shotId: shot.id,
          prevText: prev,
          nextText: next,
          persisted: false,
        },
      ])
      setRedoStack([])
    }
    setActiveShotId(s.id)
    setNarration(s.narration || '')
    lastCommittedNarrationRef.current = { shotId: s.id, text: s.narration || '' }
  }

  function handleNarrationChange(value: string) {
    setNarration(value)
    if (!shot) return

    if (narrationTimerRef.current) {
      clearTimeout(narrationTimerRef.current)
    }
    narrationTimerRef.current = setTimeout(() => {
      if (shot && value !== lastCommittedNarrationRef.current.text && lastCommittedNarrationRef.current.shotId === shot.id) {
        const prev = lastCommittedNarrationRef.current.text
        const next = value
        setUndoStack((prevStack) => [
          ...prevStack,
          {
            type: 'narration',
            label: 'Sửa kịch bản',
            shotId: shot.id,
            prevText: prev,
            nextText: next,
            persisted: false,
          },
        ])
        setRedoStack([])
        lastCommittedNarrationRef.current = { shotId: shot.id, text: value }
      }
    }, 1200)
  }

  async function saveNarration() {
    if (!project || !shot) return
    if (narrationTimerRef.current) clearTimeout(narrationTimerRef.current)
    const prevText = shot.narration || ''
    const nextText = narration
    setBusy(true)
    setError('')
    try {
      await api.updateShot(project.id, shot.id, { narration: nextText })
      const next = await api.getProject(project.id)
      setProject(next)
      lastCommittedNarrationRef.current = { shotId: shot.id, text: nextText }
      if (prevText !== nextText) {
        setUndoStack((prevStack) => [
          ...prevStack,
          {
            type: 'narration',
            label: 'Lưu kịch bản',
            shotId: shot.id,
            prevText,
            nextText,
            persisted: true,
          },
        ])
        setRedoStack([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function regenImage() {
    if (!project || !shot) return
    setBusy(true)
    setError('')
    const prevData = {
      shotId: shot.id,
      prevImageUrl: shot.image_url,
      prevVideoUrl: shot.video_url,
    }
    try {
      await api.regenImage(project.id, shot.id)
      const next = await api.getProject(project.id)
      setProject(next)
      const updatedShot = next.shots.find((s) => s.id === shot.id)
      setUndoStack((prevStack) => [
        ...prevStack,
        {
          type: 'image_change',
          label: 'Vẽ lại hình ảnh',
          ...prevData,
          nextImageUrl: updatedShot?.image_url || null,
          nextVideoUrl: updatedShot?.video_url || null,
        },
      ])
      setRedoStack([])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.editor.regenFailed'))
    } finally {
      setBusy(false)
    }
  }

  /** Thêm cảnh quay vào cuối phim và chọn Cảnh quay mới. */
  async function addShot() {
    if (!project) return
    setBusy(true)
    setError('')
    try {
      const prevActiveId = activeShotId
      const created = await api.createShot(project.id)
      const next = await api.getProject(project.id)
      setProject(next)
      const s = next.shots.find((x) => x.id === created.id)
      if (s) selectShot(s)
      setUndoStack((prevStack) => [
        ...prevStack,
        {
          type: 'add_shot',
          label: 'Thêm cảnh',
          createdShotId: created.id,
          prevActiveShotId: prevActiveId,
        },
      ])
      setRedoStack([])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.editor.addShotFailed'))
    } finally {
      setBusy(false)
    }
  }

  /** Upload khung tĩnh của gương này lên. Bạn cần phát lại video sau khi thay thế nó. */
  async function onShotImageFile(file: File | null) {
    if (!project || !shot || !file) return
    setBusy(true)
    setError('')
    const prevData = {
      shotId: shot.id,
      prevImageUrl: shot.image_url,
      prevVideoUrl: shot.video_url,
    }
    try {
      const updated = await api.uploadShotImage(project.id, shot.id, file)
      setProject(updated)
      const updatedShot = updated.shots.find((s) => s.id === shot.id)
      setUndoStack((prevStack) => [
        ...prevStack,
        {
          type: 'image_change',
          label: 'Thay đổi hình ảnh',
          ...prevData,
          nextImageUrl: updatedShot?.image_url || null,
          nextVideoUrl: updatedShot?.video_url || null,
        },
      ])
      setRedoStack([])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.editor.uploadFailed'))
    } finally {
      setBusy(false)
      if (shotFileRef.current) shotFileRef.current.value = ''
    }
  }

  /** Tải phim tổng hợp về. */
  async function exportFilm() {
    if (!project?.final_video_url) return
    setBusy(true)
    setError('')
    try {
      await downloadSingleVideo({
        projectId: project.id,
        title: project.title,
        url: api.assetUrl(project.final_video_url, project.updated_at),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.editor.exportFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function regenAudio() {
    if (!project || !shot) return
    setBusy(true)
    setError('')
    const prevAudioUrl = shot.audio_url
    try {
      await api.regenAudio(project.id, shot.id)
      const next = await api.getProject(project.id)
      setProject(next)
      const updatedShot = next.shots.find((s) => s.id === shot.id)
      setUndoStack((prevStack) => [
        ...prevStack,
        {
          type: 'audio_change',
          label: 'Lồng tiếng lại',
          shotId: shot.id,
          prevAudioUrl,
          nextAudioUrl: updatedShot?.audio_url || null,
        },
      ])
      setRedoStack([])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.storyboard.redubFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleUndo() {
    if (busy || !project) return

    // 1. If currently unsaved typing in active shot's narration differs from last checkpoint
    if (shot && narration !== lastCommittedNarrationRef.current.text) {
      const currentText = narration
      const targetText = lastCommittedNarrationRef.current.text
      setNarration(targetText)
      setRedoStack((prev) => [
        ...prev,
        {
          type: 'narration',
          label: 'Sửa kịch bản',
          shotId: shot.id,
          prevText: targetText,
          nextText: currentText,
          persisted: false,
        },
      ])
      return
    }

    if (undoStack.length === 0) return

    const action = undoStack[undoStack.length - 1]
    const nextUndoStack = undoStack.slice(0, -1)
    setBusy(true)
    setError('')

    try {
      if (action.type === 'narration') {
        if (action.persisted) {
          await api.updateShot(project.id, action.shotId, { narration: action.prevText })
          const next = await api.getProject(project.id)
          setProject(next)
        }
        setActiveShotId(action.shotId)
        setNarration(action.prevText)
        lastCommittedNarrationRef.current = { shotId: action.shotId, text: action.prevText }
      } else if (action.type === 'add_shot') {
        const next = await api.deleteShot(project.id, action.createdShotId)
        setProject(next)
        const targetId = action.prevActiveShotId && next.shots.some((s) => s.id === action.prevActiveShotId)
          ? action.prevActiveShotId
          : next.shots[0]?.id || null
        setActiveShotId(targetId)
        const s = next.shots.find((x) => x.id === targetId)
        if (s) {
          setNarration(s.narration || '')
          lastCommittedNarrationRef.current = { shotId: s.id, text: s.narration || '' }
        }
      } else if (action.type === 'image_change') {
        await api.updateShot(project.id, action.shotId, {
          image_url: action.prevImageUrl || undefined,
          video_url: action.prevVideoUrl || undefined,
        })
        const next = await api.getProject(project.id)
        setProject(next)
        setActiveShotId(action.shotId)
      } else if (action.type === 'audio_change') {
        await api.updateShot(project.id, action.shotId, {
          audio_url: action.prevAudioUrl || undefined,
        })
        const next = await api.getProject(project.id)
        setProject(next)
        setActiveShotId(action.shotId)
      }

      setUndoStack(nextUndoStack)
      setRedoStack((prev) => [...prev, action])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hoàn tác thất bại')
    } finally {
      setBusy(false)
    }
  }

  async function handleRedo() {
    if (busy || !project || redoStack.length === 0) return

    const action = redoStack[redoStack.length - 1]
    const nextRedoStack = redoStack.slice(0, -1)
    setBusy(true)
    setError('')

    try {
      if (action.type === 'narration') {
        if (action.persisted) {
          await api.updateShot(project.id, action.shotId, { narration: action.nextText })
          const next = await api.getProject(project.id)
          setProject(next)
        }
        setActiveShotId(action.shotId)
        setNarration(action.nextText)
        lastCommittedNarrationRef.current = { shotId: action.shotId, text: action.nextText }
      } else if (action.type === 'add_shot') {
        const created = await api.createShot(project.id)
        const next = await api.getProject(project.id)
        setProject(next)
        setActiveShotId(created.id)
        setNarration(created.narration || '')
        lastCommittedNarrationRef.current = { shotId: created.id, text: created.narration || '' }
        action.createdShotId = created.id
      } else if (action.type === 'image_change') {
        await api.updateShot(project.id, action.shotId, {
          image_url: action.nextImageUrl || undefined,
          video_url: action.nextVideoUrl || undefined,
        })
        const next = await api.getProject(project.id)
        setProject(next)
        setActiveShotId(action.shotId)
      } else if (action.type === 'audio_change') {
        await api.updateShot(project.id, action.shotId, {
          audio_url: action.nextAudioUrl || undefined,
        })
        const next = await api.getProject(project.id)
        setProject(next)
        setActiveShotId(action.shotId)
      }

      setRedoStack(nextRedoStack)
      setUndoStack((prev) => [...prev, action])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Làm lại thất bại')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          void handleRedo()
        } else {
          const isTextarea = (e.target as HTMLElement)?.tagName === 'TEXTAREA'
          if (!isTextarea || narration === lastCommittedNarrationRef.current.text) {
            e.preventDefault()
            void handleUndo()
          }
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        void handleRedo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undoStack, redoStack, busy, project, narration, shot])

  if (!project && !error) {
    return (
      <AppShell active="studio" flush>
        <p className="pf-muted" style={{ padding: '2rem' }}>
          {t('common.loading')}
        </p>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell active="studio">
        <BillingErrorNotice message={error} />
      </AppShell>
    )
  }

  const isPortrait = (project.output_ratio || '') === '9:16' || (!project.output_ratio && project.pipeline_mode === 'image_text')
  // Prefer current shot media; final film is for dedicated preview, not shot editing.
  const shotVideo = shot?.video_url ? api.assetUrl(shot.video_url, shot.version) : null
  const shotImage = shot?.image_url ? api.assetUrl(shot.image_url, shot.version) : null

  return (
    <AppShell active="studio" flush>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--pf-line)',
          background: '#fff',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
            onClick={() => nav(`/studio/${project.id}`)}
          >
            <IconChevronLeft size={16} />
            {t('studio.editor.backToProject').replace(/^[←\s]+/, '')}
          </button>
          <strong>{project.title}</strong>
          <span className="pf-muted" style={{ fontSize: '0.8rem' }}>
            {STATUS_CN[project.status] || project.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm"
            disabled={busy || (undoStack.length === 0 && (!shot || narration === lastCommittedNarrationRef.current.text))}
            onClick={() => void handleUndo()}
            title={undoStack.length > 0 ? `Hoàn tác: ${undoStack[undoStack.length - 1].label} (Ctrl+Z)` : 'Hoàn tác (Ctrl+Z)'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <IconUndo size={14} />
            {t('studio.editor.undo')}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm"
            disabled={busy || redoStack.length === 0}
            onClick={() => void handleRedo()}
            title={redoStack.length > 0 ? `Làm lại: ${redoStack[redoStack.length - 1].label} (Ctrl+Y)` : 'Làm lại (Ctrl+Y)'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <IconRedo size={14} />
            {t('studio.editor.redo')}
          </button>
          <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" disabled>
            {t('studio.editor.saveDraft')} <ComingSoon />
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-sm"
            disabled={!shot?.video_url && !project.final_video_url}
            onClick={() => {
              const el = document.getElementById('pf-editor-player') as HTMLVideoElement | null
              if (el) {
                el.play()
                return
              }
              if (project.final_video_url) {
                window.open(api.assetUrl(project.final_video_url, project.updated_at), '_blank')
              }
            }}
          >
            {t('studio.editor.previewPlay')}
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-lime pf-btn-sm"
            disabled={busy || !project.final_video_url}
            onClick={() => void exportFilm()}
          >
            {t('studio.editor.exportVideo')}
          </button>
        </div>
      </div>

      {error ? (
        <BillingErrorNotice message={error} style={{ padding: '0.5rem 1.25rem' }} />
      ) : null}

      <div className="pf-editor">
        <aside>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '0.96rem' }}>{t('studio.editor.shotList')}</strong>
            <button
              type="button"
              className="pf-btn-circle-add"
              disabled={busy}
              onClick={() => void addShot()}
              title={t('studio.editor.addShot')}
              aria-label={t('studio.editor.addShot')}
            >
              <IconPlus size={15} />
            </button>
          </div>
          {orderedShots.map((s) => (
            <button
              key={s.id}
              type="button"
              className={activeShotId === s.id ? 'pf-scene-item active' : 'pf-scene-item'}
              onClick={() => selectShot(s)}
            >
              {s.image_url ? (
                <img src={api.assetUrl(s.image_url, s.version)} alt="" />
              ) : (
                <div className="ph" />
              )}
              <div>
                <strong style={{ fontSize: '0.82rem' }}>
                  {String(s.shot_no).padStart(2, '0')} {s.overlay_title || t('studio.editor.shotLabel')}
                </strong>
                <div className="pf-muted" style={{ fontSize: '0.72rem' }}>
                  {(s.narration || '').slice(0, 52)}
                </div>
              </div>
            </button>
          ))}
          <p className="pf-muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {t('studio.storyboard.totalDuration')}{' '}
            {Math.floor(totalDuration / 60)
              .toString()
              .padStart(2, '0')}
            :
            {Math.floor(totalDuration % 60)
              .toString()
              .padStart(2, '0')}
          </p>
        </aside>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <strong>
              {shot ? t('studio.storyboard.shotNo').replace('{no}', String(shot.shot_no)) : t('studio.editor.previewLabel')} · {isPortrait ? '9:16' : '16:9'}
            </strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={shotFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => void onShotImageFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm"
                disabled={busy || !shot}
                onClick={() => shotFileRef.current?.click()}
              >
                {t('studio.editor.uploadImage')}
              </button>
              <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" disabled={busy} onClick={regenImage}>
                {t('studio.editor.aiRedraw')}
              </button>
            </div>
          </div>
          <div className={isPortrait ? 'pf-editor-preview portrait' : 'pf-editor-preview'}>
            {shotVideo ? (
              <video
                id="pf-editor-player"
                key={`v-${shot?.id}-${shot?.version}`}
                src={shotVideo}
                poster={shotImage || undefined}
                controls
                playsInline
              />
            ) : shotImage ? (
              <img key={`i-${shot?.id}-${shot?.version}`} src={shotImage} alt="" />
            ) : (
              <span className="empty">{t('studio.editor.noImage')}</span>
            )}
          </div>
          {shot?.audio_url ? (
            <audio
              src={api.assetUrl(shot.audio_url)}
              controls
              style={{ width: '100%', marginTop: '0.65rem' }}
            />
          ) : null}

          <div
            style={{
              marginTop: '0.85rem',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {orderedShots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectShot(s)}
                style={{
                  border: activeShotId === s.id ? '2px solid var(--pf-lime)' : '1px solid var(--pf-line)',
                  borderRadius: 8,
                  padding: 0,
                  background: 'transparent',
                }}
              >
                {s.image_url ? (
                  <img
                    src={api.assetUrl(s.image_url, s.version)}
                    alt=""
                    style={{ width: 88, height: 50, objectFit: 'cover', display: 'block', borderRadius: 6 }}
                  />
                ) : (
                  <div style={{ width: 88, height: 50, background: '#eee', borderRadius: 6 }} />
                )}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: '0.85rem',
              border: '1px dashed var(--pf-line)',
              borderRadius: 12,
              padding: '1.25rem',
              textAlign: 'center',
              color: 'var(--pf-muted)',
              fontSize: '0.9rem',
            }}
          >
            {t('studio.editor.imageHint')}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div className="pf-panel-tabs">
              {[t('studio.editor.assetLib'), t('studio.editor.favorites'), t('studio.editor.aiAssets'), t('studio.editor.myUploads')].map((tabLabel) => (
                <button key={tabLabel} type="button" disabled>
                  {tabLabel}
                </button>
              ))}
            </div>
            <p className="pf-muted" style={{ fontSize: '0.85rem' }}>
              {t('studio.editor.assetLibComingSoon')}
            </p>
          </div>
        </section>

        <aside>
          <div className="pf-panel-tabs">
            {PANEL_TABS.map((panelTab) => (
              <button
                key={panelTab}
                type="button"
                className={tab === panelTab ? 'active' : ''}
                onClick={() => setTab(panelTab)}
              >
                {panelTab}
              </button>
            ))}
          </div>

          {tab === 'script' ? (
            <>
              <label className="pf-muted" style={{ fontSize: '0.85rem', display: 'block' }}>
                {t('studio.editor.scriptContent')}
                <textarea
                  value={narration}
                  onChange={(e) => handleNarrationChange(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%',
                    marginTop: 6,
                    borderRadius: 10,
                    border: '1px solid var(--pf-line)',
                    padding: '0.65rem',
                  }}
                />
              </label>
              <button
                type="button"
                className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-block"
                style={{ marginTop: 8 }}
                disabled
              >
                {t('studio.editor.aiOptimize')} <ComingSoon />
              </button>
              <div style={{ marginTop: '0.85rem' }}>
                <strong style={{ fontSize: '0.88rem' }}>
                  {t('studio.editor.styleSettings')} <ComingSoon />
                </strong>
                <p className="pf-muted" style={{ fontSize: '0.8rem' }}>
                  {t('studio.editor.fontPlaceholder')}
                </p>
              </div>
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-block"
                style={{ marginTop: '1rem' }}
                disabled={busy}
                onClick={saveNarration}
              >
                {t('studio.editor.saveScript')}
              </button>
            </>
          ) : null}

          {tab === 'image' ? (
            <>
              <p className="pf-muted" style={{ fontSize: '0.88rem' }}>
                {t('studio.editor.imageHint')}
              </p>
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-block"
                disabled={busy}
                onClick={regenImage}
              >
                {t('studio.editor.regenShot')}
              </button>
            </>
          ) : null}

          {tab === 'voice' ? (
            <>
              <p className="pf-muted" style={{ fontSize: '0.88rem' }}>
                {t('studio.editor.voiceHint')}
              </p>
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-block"
                disabled={busy}
                onClick={regenAudio}
              >
                {t('studio.editor.replaceVoice')}
              </button>
            </>
          ) : null}

          {tab === 'transition' ? (
            <div className="pf-hint">
              {t('studio.editor.transitionComingSoon')}
            </div>
          ) : null}

          <button
            type="button"
            className="pf-btn pf-btn-ghost pf-btn-block"
            style={{ marginTop: '1rem' }}
            disabled
          >
            {t('studio.editor.applyToAll')} <ComingSoon />
          </button>
        </aside>
      </div>
    </AppShell>
  )
}
