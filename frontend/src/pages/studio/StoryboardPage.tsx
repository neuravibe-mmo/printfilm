import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import type { Shot } from '../../api'
import { X } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import Stepper from '../../components/ui/Stepper'
import {
  IconChevronLeft,
  IconDownload,
  IconEdit,
  IconMonitor,
  IconPlay,
  IconRefresh,
  IconSliders,
  IconTrash,
} from '../../components/ui/Icons'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import ShotTrimModal from '../../components/studio/ShotTrimModal'
import ShotPromptModal from '../../components/studio/ShotPromptModal'
import {
  formatMmSs,
  kepuPhaseHint,
  kepuSteps,
  isProjectWideBusy,
} from '../../lib/status'
import { downloadStoryboardCsv } from '../../components/studio/storyboard/storyboardUtils'
import StoryboardSidebar from '../../components/studio/storyboard/StoryboardSidebar'
import StoryboardOverviewGrid from '../../components/studio/storyboard/StoryboardOverviewGrid'
import StoryboardBatchModal from '../../components/studio/storyboard/StoryboardBatchModal'
import StoryboardShotEditModal from '../../components/studio/storyboard/StoryboardShotEditModal'
import StoryboardProjectPromptsModal from '../../components/studio/storyboard/StoryboardProjectPromptsModal'
import StoryboardPreviewModal, {
  type PreviewState,
} from '../../components/studio/storyboard/StoryboardPreviewModal'
import StoryboardShotRow from '../../components/studio/storyboard/StoryboardShotRow'
import UploadImageModal from '../../components/studio/storyboard/UploadImageModal'
import UploadVideoModal from '../../components/studio/storyboard/UploadVideoModal'
import StoryboardCurlModal from '../../components/studio/storyboard/StoryboardCurlModal'
import { useStoryboardProject } from '../../components/studio/storyboard/useStoryboardProject'
import { useStoryboardShotActions } from '../../components/studio/storyboard/useStoryboardShotActions'

export default function StoryboardPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const projectId = Number(id)
  const nav = useNavigate()

  const {
    project,
    setProject,
    template,
    busy,
    setBusy,
    error,
    setError,
    dismissedError,
    setDismissedError,
    videoDurations,
    setVideoDurations,
    promptEdit,
    setPromptEdit,
    running,
    step,
    totalDuration,
    shots,
    displayPrompts,
    isFullPipeline,
    readyToCompose,
    needsScriptConfirm,
    hasFinal,
    primaryAction,
    generateLabel,
    progressItems,
    continueGenerate,
    restartGenerate,
    deleteProject,
    composeOnly,
    publish,
    onCoverFile,
    useFirstShotCover,
    saveProjectPrompts,
    restoreTemplatePrompts,
  } = useStoryboardProject(projectId)

  const {
    busyShotIds,
    regenImage,
    regenVideo,
    regenAudio,
    editing,
    setEditing,
    editFocus,
    setEditFocus,
    editMode,
    setEditMode,
    editDurationCheck,
    openShotEdit,
    closeShotEdit,
    patchEditingNarration,
    patchEditingVisual,
    patchEditingScript,
    saveShot,
    batchOpen,
    setBatchOpen,
    batchSelected,
    setBatchSelected,
    batchDuration,
    setBatchDuration,
    batchRegenAudio,
    setBatchRegenAudio,
    minAllowedDuration,
    maxAllowedDuration,
    batchDurationError,
    canApplyBatch,
    openBatchAdjust,
    applyBatchAdjust,
  } = useStoryboardShotActions({
    project,
    setProject,
    busy,
    setBusy,
    setError,
    template,
    onOpenEdit: () => setMenuShotId(null),
  })

  const [preview, setPreview] = useState<PreviewState>(null)
  const [menuShotId, setMenuShotId] = useState<number | null>(null)
  const [imgMenuShotId, setImgMenuShotId] = useState<number | null>(null)
  const [promptModalShot, setPromptModalShot] = useState<{ shot: Shot; tab?: 'image' | 'video' } | null>(null)
  const [curlModalShot, setCurlModalShot] = useState<{ shot: Shot; tab: 'image' | 'video' } | null>(null)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [trimmingShot, setTrimmingShot] = useState<{
    shot: Shot
    videoDuration: number
  } | null>(null)
  const [uploadVideoShot, setUploadVideoShot] = useState<Shot | null>(null)
  const [uploadImageShot, setUploadImageShot] = useState<Shot | null>(null)

  useEffect(() => {
    if (menuShotId == null && imgMenuShotId == null) return
    function onDoc() {
      setMenuShotId(null)
      setImgMenuShotId(null)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [menuShotId, imgMenuShotId])

  function openFinalPreview() {
    if (!project?.final_video_url) return
    setPreview({
      kind: 'final',
      url: api.assetUrl(project.final_video_url, project.updated_at),
      title: project.title,
      bust: project.updated_at,
    })
  }

  function openTrimModal(shot: Shot, initialDuration?: number) {
    const vDur = initialDuration || videoDurations[shot.id] || 10
    setTrimmingShot({ shot, videoDuration: vDur })
  }

  if (!project && !error) {
    return (
      <AppShell active="studio">
        <p className="pf-muted">{t('common.loading')}</p>
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

  const structure = (project.shots || []).slice(0, 5).map((s, i) => {
    const labels = [t('studio.storyboard.act1'), t('studio.storyboard.act2'), t('studio.storyboard.act3'), t('studio.storyboard.act4'), t('studio.storyboard.act5')]
    return { label: labels[i] || `${t('studio.storyboard.sectionLabel')} ${i + 1}`, text: s.narration || s.overlay_title || '—' }
  })

  return (
    <AppShell active="studio" wide hideFooter>
      <header className="pf-page-head">
        <div className="pf-page-head-row">
          <div>
            <button type="button" className="pf-back" onClick={() => nav(`/studio/${project.id}/style`)}>
              <IconChevronLeft size={18} />
              {t('studio.storyboard.title')}
            </button>
            <h1 className="pf-page-title">{project.title}</h1>
          </div>
          <div className="pf-toolbar">
            {primaryAction === 'preview' ? (
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
                disabled={busy || !hasFinal}
                onClick={openFinalPreview}
              >
                <IconMonitor size={14} />
                {t('studio.storyboard.previewBtn')}
              </button>
            ) : primaryAction === 'compose' ? (
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
                disabled={busy || running}
                onClick={composeOnly}
              >
                <IconPlay size={14} />
                {t('studio.storyboard.spliceBtn')}
              </button>
            ) : (
              <button
                type="button"
                className="pf-btn pf-btn-lime pf-btn-sm pf-btn-icon"
                disabled={busy || running}
                onClick={() =>
                  shots.length === 0 ? nav(`/studio/${project.id}/style`) : void continueGenerate()
                }
              >
                <IconPlay size={14} />
                {generateLabel}
              </button>
            )}
            <button
              type="button"
              className="pf-btn-text"
              disabled={busy || running || shots.length === 0}
              onClick={openBatchAdjust}
            >
              <IconSliders size={15} />
              {t('studio.storyboard.batchAdjust')}
            </button>
            <button
              type="button"
              className="pf-btn-text"
              disabled={busy || running}
              onClick={restartGenerate}
            >
              <IconRefresh size={15} />
              {t('studio.storyboard.redo')}
            </button>
            {primaryAction !== 'preview' && hasFinal ? (
              <button type="button" className="pf-btn-text" onClick={openFinalPreview}>
                <IconMonitor size={15} />
                {t('studio.storyboard.previewBtn')}
              </button>
            ) : null}
            {primaryAction === 'preview' && readyToCompose ? (
              <button
                type="button"
                className="pf-btn-text"
                disabled={busy || running}
                onClick={composeOnly}
                title={t('studio.storyboard.respliceTip')}
              >
                {t('studio.storyboard.resplice')}
              </button>
            ) : null}
            {primaryAction !== 'generate' && !readyToCompose ? (
              <button
                type="button"
                className="pf-btn-text"
                disabled={busy || running}
                onClick={continueGenerate}
              >
                {generateLabel === t('studio.storyboard.generating') ? t('studio.storyboard.continueGen') : generateLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="pf-btn pf-btn-outline pf-btn-sm pf-btn-icon"
              onClick={() => nav(`/studio/${project.id}/editor`)}
            >
              <IconEdit size={14} />
              {t('studio.storyboard.openEditor')}
            </button>
          </div>
        </div>
        <Stepper
          steps={kepuSteps(project.pipeline_mode)}
          current={step}
          doneThrough={Math.max(0, step - 1)}
        />
        <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0.55rem 0 0' }}>
          {kepuPhaseHint(project)}
        </p>
      </header>

      {error ? (
        <BillingErrorNotice
          message={error}
          className="pf-error pf-board-error"
          onClose={() => setError('')}
        />
      ) : null}
      {project.error_msg && project.error_msg !== dismissedError ? (
        <BillingErrorNotice
          message={project.error_msg}
          className="pf-error pf-board-error"
          onClose={() => {
            setDismissedError(project.error_msg || null)
            setProject((p) => (p ? { ...p, error_msg: null } : p))
          }}
        />
      ) : null}

      <div className="pf-board">
        <StoryboardSidebar
          project={project}
          template={template}
          shots={shots}
          busy={busy}
          running={running}
          totalDuration={totalDuration}
          displayPrompts={displayPrompts}
          onCoverFile={onCoverFile}
          useFirstShotCover={useFirstShotCover}
          onDownloadCsv={() => downloadStoryboardCsv(project, t)}
          onEditSettings={() => nav(`/studio/${project.id}/style`)}
          onOpenPromptEdit={(prompts) => setPromptEdit(prompts)}
        />

        <div className="pf-board-main">
          <StoryboardOverviewGrid
            project={project}
            structure={structure}
            progressItems={progressItems}
          />

          <section className="pf-shot-card">
            <div className="pf-shot-card-head">
              <h3>{t('studio.storyboard.shotListTitle').replace('{n}', String(project.shots.length))}</h3>
              <div className="pf-toolbar">
                {project.status === 'DONE' && hasFinal ? (
                  <button type="button" className="pf-btn pf-btn-lime pf-btn-sm" disabled={busy} onClick={publish}>
                    {t('studio.storyboard.publish')}
                  </button>
                ) : null}
                {hasFinal ? (
                  <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" onClick={openFinalPreview}>
                    {t('studio.storyboard.previewBtn')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pf-btn pf-btn-ghost pf-btn-sm"
                    disabled={busy || running || !readyToCompose}
                    onClick={composeOnly}
                  >
                    {t('studio.storyboard.spliceBtn')}
                  </button>
                )}
              </div>
            </div>
            {project.shots.length === 0 ? (
              <p className="pf-muted" style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                {running
                  ? t('studio.storyboard.splitting')
                  : t('studio.storyboard.noShots')}
              </p>
            ) : needsScriptConfirm ? (
              <p className="pf-muted" style={{ margin: '0 0 1rem' }}>
                {t('studio.storyboard.shotReadyHint')}
              </p>
            ) : null}
            {project.shots.length === 0 ? null : (
              <div className="pf-shot-table-wrap">
                <table className="pf-shot-table">
                  <thead>
                    <tr>
                      <th className="col-no">{t('studio.storyboard.thScene')}</th>
                      <th className="col-thumb">{t('studio.storyboard.thImage')}</th>
                      <th className="col-narr">{t('studio.storyboard.thNarr')}</th>
                      <th className="col-seg">{t('studio.storyboard.thSeg')}</th>
                      <th className="col-dur">{t('studio.storyboard.thDur')}</th>
                      <th className="col-status">{t('studio.storyboard.thStatus')}</th>
                      <th className="col-ops">{t('studio.storyboard.thOps')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shots.map((shot) => (
                      <StoryboardShotRow
                        key={shot.id}
                        shot={shot}
                        project={project}
                        busyShotIds={busyShotIds}
                        pipelineLocked={isProjectWideBusy(project)}
                        pageBusy={busy}
                        isFullPipeline={isFullPipeline}
                        videoDurations={videoDurations}
                        imgMenuShotId={imgMenuShotId}
                        menuShotId={menuShotId}
                        onSetImgMenuShotId={setImgMenuShotId}
                        onSetMenuShotId={setMenuShotId}
                        onOpenPreview={setPreview}
                        onOpenShotEdit={openShotEdit}
                        onOpenTrimModal={openTrimModal}
                        onOpenPromptModal={(shot, tab) => setPromptModalShot({ shot, tab })}
                        onOpenCurlModal={(shot, tab) => setCurlModalShot({ shot, tab })}
                        onRegenImage={regenImage}
                        onRegenVideo={regenVideo}
                        onRegenAudio={regenAudio}
                        onUploadVideo={setUploadVideoShot}
                        onUploadImage={setUploadImageShot}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pf-shot-footer">
              <span className="pf-muted" style={{ fontSize: '0.82rem' }}>
                {t('studio.storyboard.totalDuration')}: {formatMmSs(totalDuration)} | {t('studio.storyboard.imagesCount')}: {project.shots.length} {t('studio.storyboard.imagesCount')} | {t('studio.storyboard.audioCount')}:{' '}
                {project.shots.filter((s) => s.audio_url).length} {t('studio.storyboard.segs')} | {t('studio.storyboard.resolution')}: {t('studio.storyboard.previewRes')}
              </span>
              <div className="pf-toolbar">
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon"
                  disabled={shots.length === 0}
                  onClick={() => downloadStoryboardCsv(project, t)}
                >
                  <IconDownload size={15} />
                  {t('studio.storyboard.exportScript')}
                </button>
                <button
                  type="button"
                  className="pf-btn-text"
                  disabled={busy || running}
                  onClick={deleteProject}
                >
                  <IconTrash size={15} />
                  {t('studio.storyboard.deleteProject')}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <StoryboardBatchModal
        open={batchOpen && Boolean(project)}
        busy={busy}
        project={project}
        batchSelected={batchSelected}
        onSelectAll={(checked) => setBatchSelected(checked ? project.shots.map((s) => s.id) : [])}
        onToggleShot={(shotId) =>
          setBatchSelected((prev) =>
            prev.includes(shotId) ? prev.filter((id) => id !== shotId) : [...prev, shotId],
          )
        }
        batchDuration={batchDuration}
        onChangeBatchDuration={setBatchDuration}
        batchDurationError={batchDurationError}
        minAllowedDuration={minAllowedDuration}
        maxAllowedDuration={maxAllowedDuration}
        batchRegenAudio={batchRegenAudio}
        onChangeBatchRegenAudio={setBatchRegenAudio}
        canApplyBatch={canApplyBatch}
        onApply={applyBatchAdjust}
        onClose={() => !busy && setBatchOpen(false)}
      />

      <StoryboardShotEditModal
        editing={editing}
        editMode={editMode}
        editFocus={editFocus}
        editDurationCheck={editDurationCheck}
        busy={busy}
        onChangeEditing={setEditing}
        onPatchNarration={patchEditingNarration}
        onPatchVisual={patchEditingVisual}
        onPatchScript={patchEditingScript}
        onChangeMode={(mode, focus) => {
          setEditMode(mode)
          setEditFocus(focus)
        }}
        onSave={saveShot}
        onClose={closeShotEdit}
      />

      <StoryboardProjectPromptsModal
        promptEdit={promptEdit}
        busy={busy}
        onChangePromptEdit={setPromptEdit}
        onSave={saveProjectPrompts}
        onRestoreTemplate={() => void restoreTemplatePrompts()}
        onClose={() => setPromptEdit(null)}
      />

      <StoryboardPreviewModal
        preview={preview}
        onClose={() => setPreview(null)}
      />

      {trimmingShot && project ? (
        <ShotTrimModal
          projectId={project.id}
          shot={trimmingShot.shot}
          initialVideoDuration={trimmingShot.videoDuration}
          onClose={() => setTrimmingShot(null)}
          onSuccess={(nextProject, newDuration) => {
            setProject(nextProject)
            setVideoDurations((prev) => ({ ...prev, [trimmingShot.shot.id]: newDuration }))
            setTrimmingShot(null)
          }}
        />
      ) : null}

      {promptModalShot && project ? (
        <ShotPromptModal
          projectId={project.id}
          shot={promptModalShot.shot}
          tab={promptModalShot.tab}
          open={Boolean(promptModalShot)}
          onClose={() => setPromptModalShot(null)}
          onEditShot={(s) => openShotEdit(s)}
        />
      ) : null}

      {uploadVideoShot && project ? (
        <UploadVideoModal
          projectId={project.id}
          shot={uploadVideoShot}
          open={Boolean(uploadVideoShot)}
          onClose={() => setUploadVideoShot(null)}
          onUploaded={(updatedShot) => {
            setProject((prev) =>
              prev
                ? {
                    ...prev,
                    shots: prev.shots.map((s) =>
                      s.id === updatedShot.id ? { ...s, ...updatedShot } : s,
                    ),
                  }
                : prev,
            )
            setUploadVideoShot(null)
          }}
        />
      ) : null}

      {uploadImageShot && project ? (
        <UploadImageModal
          projectId={project.id}
          shot={uploadImageShot}
          open={Boolean(uploadImageShot)}
          onClose={() => setUploadImageShot(null)}
          onUploaded={(updatedProject) => {
            setProject(updatedProject)
            setUploadImageShot(null)
          }}
        />
      ) : null}

      {curlModalShot && project ? (
        <StoryboardCurlModal
          open={Boolean(curlModalShot)}
          shot={curlModalShot.shot}
          tab={curlModalShot.tab}
          project={project}
          onClose={() => setCurlModalShot(null)}
          onPreviewImage={(url) => setPreviewImg(url)}
        />
      ) : null}

      {/* Lightbox / Preview ảnh lớn */}
      {previewImg ? (
        <div
          className="pf-lightbox-backdrop"
          onClick={() => setPreviewImg(null)}
          style={{ zIndex: 100000 }}
        >
          <div className="pf-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pf-lightbox-close"
              onClick={() => setPreviewImg(null)}
              aria-label="Đóng"
            >
              <X size={20} strokeWidth={2} />
            </button>
            <img src={previewImg} alt="Preview" className="pf-lightbox-img" />
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
