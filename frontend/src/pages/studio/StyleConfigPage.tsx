import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, defaultsFromTemplate, resolveVoiceId } from '../../api'
import type { MediaModelsCatalog, PipelineMode, Project, Template, VoicePreset } from '../../api'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import AppShell from '../../components/layout/AppShell'
import CharacterConfigSection from '../../components/studio/style/CharacterConfigSection'
import ModelPickerSection from '../../components/studio/style/ModelPickerSection'
import OutputModeSection from '../../components/studio/style/OutputModeSection'
import ProjectInfoSidebar from '../../components/studio/style/ProjectInfoSidebar'
import RatioPickerSection from '../../components/studio/style/RatioPickerSection'
import StyleOverviewSidebar from '../../components/studio/style/StyleOverviewSidebar'
import StylePromptSection from '../../components/studio/style/StylePromptSection'
import VoicePickerSection, { voiceKey } from '../../components/studio/style/VoicePickerSection'
import { IconChevronLeft } from '../../components/ui/Icons'
import Stepper from '../../components/ui/Stepper'
import { useI18n } from '../../i18n'
import { handleBillingError } from '../../lib/billingError'
import { kepuStepIndex, kepuSteps } from '../../lib/status'

export default function StyleConfigPage() {
  const { t } = useI18n()
  const OUTPUT_MODES: { id: PipelineMode; label: string; desc: string; image: string }[] = [
    {
      id: 'full',
      label: t('studio.styleConfig.modeFullLabel'),
      desc: t('studio.styleConfig.modeFullDesc'),
      image: '/mode-presets/full.jpg',
    },
    {
      id: 'image_text',
      label: t('studio.styleConfig.modeImageTextLabel'),
      desc: t('studio.styleConfig.modeImageTextDesc'),
      image: '/mode-presets/image_text.jpg',
    },
  ]

  const { id } = useParams()
  const projectId = Number(id)
  const nav = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [voices, setVoices] = useState<VoicePreset[]>([])
  const [stylePrompt, setStylePrompt] = useState('')
  const [characterPrompt, setCharacterPrompt] = useState('')
  const [productPrompt, setProductPrompt] = useState('')
  const [scenePrompt, setScenePrompt] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [pipelineMode, setPipelineMode] = useState<PipelineMode>('full')
  const [ratio, setRatio] = useState('16:9')
  const [imageModel, setImageModel] = useState('')
  const [videoModel, setVideoModel] = useState('')
  const [mediaCatalog, setMediaCatalog] = useState<MediaModelsCatalog | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadingRef, setUploadingRef] = useState<string | null>(null)
  const [aiGeneratingChar, setAiGeneratingChar] = useState(false)
  const [aiGeneratingProduct, setAiGeneratingProduct] = useState(false)
  const [aiGeneratingScene, setAiGeneratingScene] = useState(false)
  const [previewBusy, setPreviewBusy] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      nav(`/auth?next=${encodeURIComponent(location.pathname)}`, { replace: true })
      return
    }
    if (!projectId) {
      nav('/studio/new')
    }
    api.templates().then(setTemplates)
    api.voices().then(setVoices)
    api
      .mediaModels()
      .then((cat) => {
        setMediaCatalog(cat)
        setImageModel((prev) => prev || cat.defaults.image_model)
        setVideoModel((prev) => prev || cat.defaults.video_model)
      })
      .catch(() => setMediaCatalog(null))
    api
      .getProject(projectId)
      .then((p) => {
        setProject(p)
        setStylePrompt(p.style_prompt || '')
        setCharacterPrompt(p.character_prompt || '')
        setProductPrompt(p.product_prompt || '')
        setScenePrompt(p.scene_prompt || '')
        setExtraPrompt(p.extra_prompt || '')
        setVoiceId(p.voice_id || '')
        setPipelineMode(p.pipeline_mode || 'full')
        setRatio(p.output_ratio || (p.pipeline_mode === 'image_text' ? '9:16' : '16:9'))
        if (p.image_model) setImageModel(p.image_model)
        if (p.video_model) setVideoModel(p.video_model)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadFailed')))
  }, [nav, projectId])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!voices.length) return
    setVoiceId((prev) => {
      const next = resolveVoiceId(prev, voices)
      return next === prev ? prev : next
    })
  }, [voices])

  const currentTpl = useMemo(
    () => templates.find((t) => t.id === project?.template_id),
    [templates, project?.template_id],
  )

  const selectedVoice = voices.find((v) => voiceKey(v) === voiceId || v.id === voiceId)

  useEffect(() => {
    if (!project || !currentTpl) return
    if (!stylePrompt) {
      const d = defaultsFromTemplate(currentTpl)
      setStylePrompt((v) => v || d.style_prompt)
      setCharacterPrompt((v) => v || d.character_prompt)
      setExtraPrompt((v) => v || d.extra_prompt)
      setVoiceId((v) => v || d.voice_id)
    }
  }, [project, currentTpl])

  useEffect(() => {
    if (!project || project.output_ratio || !currentTpl?.default_ratio) return
    setRatio(currentTpl.default_ratio)
  }, [project?.id, project?.output_ratio, currentTpl?.default_ratio])

  function stopPreview() {
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingId(null)
  }

  function selectVoice(v: VoicePreset) {
    const vid = voiceKey(v)
    if (vid !== voiceId) stopPreview()
    setVoiceId(vid)
  }

  async function previewVoice(v: VoicePreset, e: MouseEvent) {
    e.stopPropagation()
    const vid = voiceKey(v)
    selectVoice(v)
    setError('')

    if (playingId === vid && audioRef.current && !audioRef.current.paused) {
      stopPreview()
      return
    }

    stopPreview()
    setPreviewBusy(vid)
    try {
      const res = await api.previewVoice(vid)
      const url = api.assetUrl(res.url)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setPlayingId(null)
      audio.onerror = () => {
        setPlayingId(null)
        setError(t('studio.styleConfig.previewPlayFailed'))
      }
      setPlayingId(vid)
      await audio.play()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.styleConfig.previewFailed'))
      setPlayingId(null)
    } finally {
      setPreviewBusy(null)
    }
  }

  async function handleUploadRefImage(file: File, refType: 'character' | 'product' | 'scene' = 'character') {
    if (!project) return
    setUploadingRef(refType)
    setError('')
    try {
      const updated = await api.uploadRefImage(project.id, file, refType)
      setProject(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingRef(null)
    }
  }

  async function handleRemoveRefImage(refType: 'character' | 'product' | 'scene') {
    if (!project) return
    setUploadingRef(refType)
    setError('')
    try {
      const patch =
        refType === 'product'
          ? { product_image_url: null }
          : refType === 'scene'
            ? { scene_image_url: null }
            : { ref_image_url: null }
      const updated = await api.updateProject(project.id, patch)
      setProject(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setUploadingRef(null)
    }
  }

  async function handlePasteRefImage(refType: 'character' | 'product' | 'scene' = 'character') {
    if (!project) return
    setError('')
    try {
      if (!navigator.clipboard?.read) {
        setError(t('studio.styleConfig.clipboardNotSupported'))
        return
      }
      setUploadingRef(refType)
      const items = await navigator.clipboard.read()
      let imageBlob: Blob | null = null
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (imageType) {
          imageBlob = await item.getType(imageType)
          break
        }
      }
      if (!imageBlob) {
        const text = await navigator.clipboard.readText().catch(() => '')
        if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('/static/'))) {
          const patch =
            refType === 'product'
              ? { product_image_url: text.trim() }
              : refType === 'scene'
                ? { scene_image_url: text.trim() }
                : { ref_image_url: text.trim() }
          const updated = await api.updateProject(project.id, patch)
          setProject(updated)
          return
        }
        setError(t('studio.styleConfig.noClipboardImage'))
        return
      }
      const file = new File([imageBlob], `pasted_${refType}.png`, { type: imageBlob.type || 'image/png' })
      const updated = await api.uploadRefImage(project.id, file, refType)
      setProject(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Paste failed')
    } finally {
      setUploadingRef(null)
    }
  }

  async function handleAiGenerateCharacter() {
    if (!project) return
    setAiGeneratingChar(true)
    setError('')
    try {
      const res = await api.generateReferencePrompt({
        topic: (project.source_text || project.title || '').slice(0, 3000),
        template_name: currentTpl?.name || '',
        template_style: currentTpl?.style_prefix || '',
        seed_prompt: (characterPrompt || '').trim().slice(0, 2000),
        ref_image_url: project.ref_image_url || '',
        project_id: project.id,
        target_type: 'character',
      })
      const promptVal = res.prompt || res.character_prompt
      if (promptVal) {
        setCharacterPrompt(promptVal)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI tạo mô tả nhân vật thất bại')
    } finally {
      setAiGeneratingChar(false)
    }
  }

  async function handleAiGenerateProduct() {
    if (!project) return
    setAiGeneratingProduct(true)
    setError('')
    try {
      const res = await api.generateReferencePrompt({
        topic: (project.source_text || project.title || '').slice(0, 3000),
        template_name: currentTpl?.name || '',
        template_style: currentTpl?.style_prefix || '',
        seed_prompt: (productPrompt || '').trim().slice(0, 2000),
        ref_image_url: project.product_image_url || '',
        project_id: project.id,
        target_type: 'product',
      })
      const promptVal = res.prompt || res.character_prompt
      if (promptVal) {
        setProductPrompt(promptVal)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI tạo mô tả sản phẩm thất bại')
    } finally {
      setAiGeneratingProduct(false)
    }
  }

  async function handleAiGenerateScene() {
    if (!project) return
    setAiGeneratingScene(true)
    setError('')
    try {
      const res = await api.generateReferencePrompt({
        topic: (project.source_text || project.title || '').slice(0, 3000),
        template_name: currentTpl?.name || '',
        template_style: currentTpl?.style_prefix || '',
        seed_prompt: (scenePrompt || '').trim().slice(0, 2000),
        ref_image_url: project.scene_image_url || '',
        project_id: project.id,
        target_type: 'scene',
      })
      const promptVal = res.prompt || res.character_prompt
      if (promptVal) {
        setScenePrompt(promptVal)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI tạo mô tả bối cảnh thất bại')
    } finally {
      setAiGeneratingScene(false)
    }
  }

  async function generate() {
    if (!project) return
    stopPreview()
    setBusy(true)
    setError('')
    try {
      const d = currentTpl ? defaultsFromTemplate(currentTpl) : null
      const styleOut = stylePrompt.trim()
      const charOut = characterPrompt.trim()
      const extraOut = extraPrompt.trim()
      const sameStyle = Boolean(d) && styleOut === d!.style_prompt
      const sameChar = Boolean(d) && charOut === (d!.character_prompt || '')
      const sameExtra = Boolean(d) && extraOut === d!.extra_prompt
      await api.updateProject(project.id, {
        style_prompt: sameStyle ? '' : styleOut,
        character_prompt: sameChar ? '' : charOut,
        product_prompt: productPrompt.trim(),
        scene_prompt: scenePrompt.trim(),
        extra_prompt: sameExtra ? '' : extraOut,
        voice_id: voiceId,
        pipeline_mode: pipelineMode,
        output_ratio: ratio,
        image_model: imageModel,
        video_model: videoModel,
      })
      const started = await api.generate(project.id)
      nav(`/studio/${started.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('studio.styleConfig.genFailed')
      if (msg.includes(t('studio.storyboard.composeKeyword'))) {
        try {
          const composed = await api.compose(project.id)
          nav(`/studio/${composed.id}`)
          return
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : t('studio.storyboard.composeFailed'))
          return
        }
      }
      setError(msg)
      await handleBillingError(err, nav)
    } finally {
      setBusy(false)
    }
  }

  if (!project) {
    return (
      <AppShell active="studio">
        {error ? <BillingErrorNotice message={error} /> : <p className="pf-muted">{t('common.loading')}</p>}
      </AppShell>
    )
  }

  return (
    <AppShell active="studio" wide hideFooter>
      <header className="pf-page-head">
        <div className="pf-page-head-row">
          <div>
            <button type="button" className="pf-back" onClick={() => nav('/studio/new')}>
              <IconChevronLeft size={18} />
              {t('studio.styleConfig.backBtn')}
            </button>
            <h1 className="pf-page-title">{project.title || t('studio.styleConfig.pageTitle')}</h1>
          </div>
          <Stepper
            steps={kepuSteps(pipelineMode)}
            current={kepuStepIndex('style', { status: 'DRAFT', pipeline_mode: pipelineMode })}
            doneThrough={0}
          />
        </div>
      </header>

      <div className="pf-style-layout">
        <ProjectInfoSidebar project={project} template={currentTpl} />

        <section className="pf-create-col">
          <StylePromptSection
            template={currentTpl}
            stylePrompt={stylePrompt}
            onChangeStylePrompt={setStylePrompt}
          />

          <CharacterConfigSection
            characterPrompt={characterPrompt}
            onChangeCharacterPrompt={setCharacterPrompt}
            characterImageUrl={project.ref_image_url}
            productPrompt={productPrompt}
            onChangeProductPrompt={setProductPrompt}
            productImageUrl={project.product_image_url}
            scenePrompt={scenePrompt}
            onChangeScenePrompt={setScenePrompt}
            sceneImageUrl={project.scene_image_url}
            uploadingRef={uploadingRef}
            aiGeneratingChar={aiGeneratingChar}
            aiGeneratingProduct={aiGeneratingProduct}
            aiGeneratingScene={aiGeneratingScene}
            onUploadRefImage={handleUploadRefImage}
            onRemoveRefImage={handleRemoveRefImage}
            onPasteRefImage={handlePasteRefImage}
            onAiGenerateCharacter={handleAiGenerateCharacter}
            onAiGenerateProduct={handleAiGenerateProduct}
            onAiGenerateScene={handleAiGenerateScene}
          />

          <VoicePickerSection
            voices={voices}
            voiceId={voiceId}
            onSelectVoice={selectVoice}
            onPreviewVoice={previewVoice}
            previewBusy={previewBusy}
            playingId={playingId}
            busy={busy}
          />

          <OutputModeSection
            modes={OUTPUT_MODES}
            pipelineMode={pipelineMode}
            onChangeMode={setPipelineMode}
          />

          {mediaCatalog ? (
            <ModelPickerSection
              catalog={mediaCatalog}
              imageModel={imageModel}
              onChangeImageModel={setImageModel}
              videoModel={videoModel}
              onChangeVideoModel={setVideoModel}
              showVideoModel={pipelineMode === 'full'}
            />
          ) : null}

          <RatioPickerSection ratio={ratio} onChangeRatio={setRatio} />
        </section>

        <StyleOverviewSidebar
          project={project}
          template={currentTpl}
          ratio={ratio}
          characterPrompt={characterPrompt}
          selectedVoice={selectedVoice}
          pipelineMode={pipelineMode}
          busy={busy}
          previewBusy={previewBusy}
          playingId={playingId}
          error={error}
          onPreviewVoice={previewVoice}
          onGenerate={generate}
        />
      </div>
    </AppShell>
  )
}
