/** Chọn phần cuối của nút: Bảng nổi từ nhắc nhở AI (hình ảnh thô/video thô) */
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowUp, CircleHelp, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { SeedanceRulesModal } from '../../../../components/drama/SeedanceRulesModal'
import { useCanvasStore } from '../CanvasStore'
import { CANVAS_GENERATABLE_KINDS, type CanvasNodeKind } from '../canvasTypes'
import {
  defaultOptionsForAssetKind,
  type ImageGenerationOptions,
} from '../../../../lib/dramaGenerationOptions'
import {
  DEFAULT_VIDEO_GENERATION_OPTIONS,
  readVideoGenerationOptions,
  type VideoGenerationOptions,
} from '../../../../lib/dramaVideoGenerationOptions'
import { optimizePromptWithSkills } from '../../../../api/agentSkills'
import { useAgentSkillSelection } from '../../../../hooks/useAgentSkillSelection'
import { DramaImageGenOptionsBar } from './DramaImageGenOptionsBar'
import { DramaSkillOptionsBar } from './DramaSkillOptionsBar'
import { DramaVideoGenOptionsBar } from './DramaVideoGenOptionsBar'
import { CanvasPromptEditor } from './CanvasPromptEditor'

type CanvasNodeGeneratePanelProps = {
  nodeId: string
  kind: CanvasNodeKind
  generating?: boolean
  defaultPrompt?: string
  /** Tên hiển thị nút, dùng để lọc các từ nhắc giữ chỗ yếu */
  label?: string
  /** Bạn đã có ảnh tham khảo chưa (thư viện nội dung/tải lên) */
  hasMedia?: boolean
  /** Tham số Seedance đã lưu của nút video */
  videoOptions?: Record<string, unknown>
}

import { useI18n } from '../../../../i18n'

/** Trả về bản sao bảng điều khiển theo loại nút */
function panelCopy(kind: CanvasNodeKind, hasMedia: boolean, t: (k: string) => string) {
  if (kind === 'video') {
    return {
      title: hasMedia ? t('drama.canvas.editRegenVideo') : t('drama.canvas.aiGenVideo'),
      placeholder: t('drama.canvas.videoPlaceholder'),
      hint: t('drama.canvas.videoHint'),
    }
  }
  if (kind === 'character') {
    return {
      title: hasMedia ? t('drama.canvas.editRegenChar') : t('drama.canvas.aiGenChar'),
      placeholder: t('drama.canvas.charPlaceholder'),
      hint: t('drama.canvas.charHint'),
    }
  }
  if (kind === 'scene') {
    return {
      title: hasMedia ? t('drama.canvas.editRegenScene') : t('drama.canvas.aiGenScene'),
      placeholder: t('drama.canvas.scenePlaceholder'),
      hint: t('drama.canvas.sceneHint'),
    }
  }
  return {
    title: hasMedia ? t('drama.canvas.editRegenImg') : t('drama.canvas.aiGenImg'),
    placeholder: t('drama.canvas.imgPlaceholder'),
    hint: t('drama.canvas.imgHint'),
  }
}

const PLACEHOLDER_PROMPT = /^(character|scene|prop|material|none|image|audio|video)\s+\S+$/i

/** Làm sạch các từ nhắc nhở mặc định: chỉ xóa các phần giữ chỗ như "video video mới" và giữ lại mô tả ngắn gọn cũng như tham chiếu @ của người dùng */
function sanitizePrompt(raw: string, kind: CanvasNodeKind, label: string): string {
  const text = (raw || '').trim()
  if (!text) return ''
  if (PLACEHOLDER_PROMPT.test(text)) return ''
  if (label && (text === `${kind} ${label}` || text === label)) return ''
  return text
}

/** Hiển thị bảng chỉnh sửa từ nhắc nhở AI */
export function CanvasNodeGeneratePanel({
  nodeId,
  kind,
  generating = false,
  defaultPrompt = '',
  label = '',
  hasMedia = false,
  videoOptions: savedVideoOptions,
}: CanvasNodeGeneratePanelProps) {
  const {
    generateNodeImage,
    generateNodeVideo,
    setErrorMessage,
    projectImageStyleId,
    updateNodePrompt,
    updateNodeVideoOptions,
    mentionableNodes,
  } = useCanvasStore()
  const { t } = useI18n()
  const [prompt, setPrompt] = useState(() => sanitizePrompt(defaultPrompt, kind, label))
  /*
   * đang bận gửi thế hệ
   * quy tắcMở cửa sổ bật lên quy tắc Seedance
   * Việc tối ưu hóa Kỹ năng đang được viết lại
   */
  const [busy, setBusy] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const { skills, selectedIds, toggleSkill, selectAll, selectNone, uploadSkill, uploading, uploadError } =
    useAgentSkillSelection()
  // imageOptions Kiểu/mô hình/khung hình ảnh thô
  const [imageOptions, setImageOptions] = useState<ImageGenerationOptions>(() => ({
    ...defaultOptionsForAssetKind(kind),
    image_style_id: projectImageStyleId || undefined,
  }))
  // videoOpts Thời lượng/tỷ lệ/định nghĩa Seedance
  const [videoOpts, setVideoOpts] = useState<VideoGenerationOptions>(() => {
    const saved = readVideoGenerationOptions(savedVideoOptions)
    return {
      ...DEFAULT_VIDEO_GENERATION_OPTIONS,
      ...saved,
      image_style_id: saved.image_style_id || projectImageStyleId || undefined,
    }
  })
  const copy = useMemo(() => panelCopy(kind, hasMedia, t), [kind, hasMedia, t])
  const allowMention = kind === 'video' || kind === 'image'
  const isVideo = kind === 'video'

  /* Có thể trích dẫn: loại trừ chính nút hiện tại */
  const mentionItems = useMemo(
    () => mentionableNodes.filter((n) => n.nodeId !== nodeId),
    [mentionableNodes, nodeId],
  )

  const lastNodeIdRef = useRef(nodeId)

  /* Buộc đồng bộ hóa khi thay đổi nút; không sử dụng giá trị mặc định trống để xóa văn bản người dùng trên cùng một nút */
  useEffect(() => {
    const switched = lastNodeIdRef.current !== nodeId
    lastNodeIdRef.current = nodeId
    const next = sanitizePrompt(defaultPrompt, kind, label)
    if (switched) {
      setPrompt(next)
      return
    }
    setPrompt((prev) => next || prev)
  }, [defaultPrompt, nodeId, kind, label])

  /* Đồng bộ hóa các tùy chọn mặc định khi loại nút hoặc kiểu dự án thay đổi */
  useEffect(() => {
    setImageOptions((prev) => ({
      ...defaultOptionsForAssetKind(kind),
      image_style_id: prev.image_style_id || projectImageStyleId || undefined,
      model_id: prev.model_id,
      resolution: prev.resolution,
    }))
  }, [kind, nodeId, projectImageStyleId])

  useEffect(() => {
    const saved = readVideoGenerationOptions(savedVideoOptions)
    setVideoOpts({
      ...DEFAULT_VIDEO_GENERATION_OPTIONS,
      ...saved,
      image_style_id: saved.image_style_id || projectImageStyleId || undefined,
    })
    // Chỉ khôi phục các tham số đã lưu khi chuyển nút để tránh bị ghi đè bởi ghi đè khi chỉnh sửa tùy chọn
  }, [nodeId, projectImageStyleId])

  const isBusy = busy || generating || optimizing
  const canSubmit = prompt.trim().length > 0 && !isBusy
  const canOptimize = prompt.trim().length > 0 && selectedIds.length > 0 && !isBusy

  if (!CANVAS_GENERATABLE_KINDS.has(kind)) return null

  const stopFlowEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    try {
      updateNodePrompt(nodeId, prompt)
      if (isVideo) {
        updateNodeVideoOptions(nodeId, videoOpts)
      }
      if (isVideo) {
        await generateNodeVideo(nodeId, prompt, videoOpts)
      } else {
        await generateNodeImage(nodeId, prompt, imageOptions)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('drama.canvas.generateFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit()
  }

  // Nhấp để chọn Kỹ năng để viết lại từ nhắc hiện tại và giữ lại tham chiếu @asset.
  const optimizePrompt = async () => {
    if (!canOptimize) return
    setOptimizing(true)
    try {
      const result = await optimizePromptWithSkills({
        prompt,
        skill_ids: selectedIds,
        task: isVideo ? 'video_prompt' : 'image_prompt',
      })
      const next = (result.prompt || '').trim()
      if (next) {
        setPrompt(next)
        updateNodePrompt(nodeId, next)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : (t('drama.canvas.skillOptimizeFailed') || 'Tối ưu Skill thất bại'))
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <form
      className={`fc-generate-panel nodrag nopan nowheel${hasMedia ? ' has-media' : ''}`}
      onMouseDown={stopFlowEvent}
      onPointerDown={stopFlowEvent}
      onClick={stopFlowEvent}
      onSubmit={handleSubmit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          updateNodePrompt(nodeId, prompt)
        }
      }}
    >
      <div className="fc-generate-head">
        <Sparkles size={14} strokeWidth={1.8} />
        <span>{copy.title}</span>
        {hasMedia ? <em className="fc-generate-tag">{t('drama.canvas.canRegen')}</em> : null}
        {isVideo ? (
          <button
            type="button"
            className="fc-generate-help"
            title={t('drama.canvas.seedanceHelp')}
            aria-label={t('drama.canvas.seedanceHelp')}
            disabled={isBusy}
            onClick={() => setRulesOpen(true)}
          >
            <CircleHelp size={14} strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
      <CanvasPromptEditor
        value={prompt}
        placeholder={copy.placeholder}
        disabled={isBusy}
        allowMention={allowMention}
        mentionItems={mentionItems}
        onChange={(next) => {
          setPrompt(next)
        }}
        onSubmit={() => void submit()}
      />
      {isVideo ? (
        <DramaVideoGenOptionsBar
          value={videoOpts}
          disabled={isBusy}
          onChange={(next) => {
            setVideoOpts(next)
            updateNodeVideoOptions(nodeId, next)
          }}
        />
      ) : (
        <DramaImageGenOptionsBar value={imageOptions} onChange={setImageOptions} disabled={isBusy} />
      )}
      <DramaSkillOptionsBar
        skills={skills}
        selectedIds={selectedIds}
        disabled={isBusy}
        onToggle={toggleSkill}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        onUpload={(file) => void uploadSkill(file)}
        uploading={uploading}
        uploadError={uploadError}
      />
      <div className="fc-generate-actions">
        <span className="fc-generate-hint">{copy.hint}</span>
        <div className="fc-generate-action-btns">
          <button
            type="button"
            className="fc-generate-optimize"
            disabled={!canOptimize}
            title={selectedIds.length ? t('drama.canvas.optimizeWithSkill') : t('drama.canvas.selectSkillFirst')}
            onClick={() => void optimizePrompt()}
          >
            {optimizing ? <Loader2 size={14} className="fc-spin" /> : <Wand2 size={14} strokeWidth={1.8} />}
            {t('drama.canvas.optimizeSkill')}
          </button>
          <button type="submit" className="fc-generate-submit" disabled={!canSubmit} aria-label={t('drama.canvas.generate')}>
            {isBusy && !optimizing ? (
              <Loader2 size={16} className="fc-spin" />
            ) : (
              <ArrowUp size={16} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
      {isVideo ? <SeedanceRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} /> : null}
    </form>
  )
}
