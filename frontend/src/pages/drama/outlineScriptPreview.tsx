/** Trang phác thảo: Phân tích kịch bản và hiển thị bằng cách chỉnh sửa cảnh/phân đoạn/xem trước cửa sổ bật lên */
import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useI18n } from '../../i18n'

export type OutlineSceneBlock = {
  /** Toàn bộ đoạn văn gốc (bao gồm cả dòng tiêu đề), được ghép lại như khi viết lại */
  raw: string
  label: string
  title: string
  body: string
}

export type ScriptLineKind = 'meta' | 'action' | 'dialogue' | 'empty' | 'other'

export type ParsedScriptLine = {
  kind: ScriptLineKind
  text: string
  speaker?: string
  paren?: string
  dialogue?: string
}

/** Thống kê từng cảnh sau khi phân tích: ước tính thời gian / lời thoại / hành động / ngoại hình / cảnh nội ngoại thất */
export type OutlineSceneStats = {
  estimatedSec: number
  dialogueCount: number
  actionCount: number
  cast: string[]
  location: string
}

/** Tổng số lần quay khi viết kịch bản phân cảnh (ưu tiên hơn ước tính văn bản) */
export type OutlineShotDurationStats = {
  fragmentCount: number
  totalSec: number
}

const SPEAKER_COLORS = ['#059669', '#dc2626', '#ea580c', '#2563eb', '#7c3aed', '#db2777']
const SCENE_DURATION_MIN = 4
const SCENE_DURATION_MAX = 120
/** Căn chỉnh với giới hạn trên của kẹp/đóng gói độ dài dòng build_fragments phụ trợ */
const LINE_DURATION_MIN = 3
const LINE_DURATION_MAX = 15
const FRAGMENT_SOFT_MAX = 15
const FRAGMENT_TOTAL_MAX = 15

// Màu sắc ổn định của tên nhân vật
export function speakerColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return SPEAKER_COLORS[h % SPEAKER_COLORS.length]
}

// Tách khối cảnh khỏi văn bản chính của kịch bản quay phim
export function parseOutlineSceneBlocks(text: string): OutlineSceneBlock[] {
  const raw = (text || '').trim()
  if (!raw) return []
  const scenePattern = /(?=^(?:#{1,3}\s*)?(?:cảnh|phân cảnh|scene|field|场|第\s*\d+\s*场)\b)/im
  const hasSceneHeading = scenePattern.test(raw)
  const parts = raw.split(scenePattern).map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1 && !hasSceneHeading) {
    return [{ raw, label: 'Toàn văn', title: '', body: raw }]
  }
  return parts.map((part, index) => {
    const lines = part.split(/\r?\n/)
    const head = (lines[0] || '').replace(/^#+\s*/, '').trim()
    const labelMatch = head.match(/^(?:场|cảnh|phân cảnh|scene|field)\s*([^\s：:]+)/i)
    const label = labelMatch ? `Cảnh ${labelMatch[1]}` : `Cảnh ${index + 1}`
    const title = head.replace(/^(?:场|cảnh|phân cảnh|scene|field)\s*[^\s：:]+[：:\s—\-]*/i, '').trim()
    const body = lines.slice(1).join('\n').trim()
    return { raw: part, label, title, body }
  })
}

// Khối sự kiện dùng để đánh vần văn bản hoàn chỉnh
export function joinOutlineSceneBlocks(blocks: OutlineSceneBlock[]): string {
  return blocks.map((b) => b.raw.trim()).filter(Boolean).join('\n\n')
}

// Phân tích một dòng: hành động/đối thoại/thông tin meta
export function parseScriptLine(line: string): ParsedScriptLine {
  const text = line ?? ''
  const trimmed = text.trim()
  if (!trimmed) return { kind: 'empty', text }
  if (
    /^(出场人物|时间|地点|内外景|Nhân vật|Thời gian|Địa điểm|Bối cảnh|Ngoại cảnh|Nội cảnh)/i.test(trimmed) ||
    /^[日夜早晚晨黄昏傍晚凌晨清晨午晚]\s*[内外]/.test(trimmed) ||
    /^(Ngày|Đêm|Sáng|Tối|Chiều)\s*[—\-–\s]*(Nội|Ngoại)/i.test(trimmed)
  ) {
    return { kind: 'meta', text: trimmed }
  }
  if (/^[△▲■□●○]/.test(trimmed) || trimmed.startsWith('△')) {
    return { kind: 'action', text: trimmed }
  }
  if (/^【/.test(trimmed)) {
    return { kind: 'action', text: trimmed }
  }
  const dlg = trimmed.match(/^([^：:(（]{1,20})\s*(?:[（(]([^)）]*)[)）])?\s*[：:]\s*(.*)$/)
  if (dlg) {
    return {
      kind: 'dialogue',
      text: trimmed,
      speaker: dlg[1].trim(),
      paren: (dlg[2] || '').trim() || undefined,
      dialogue: (dlg[3] || '').trim(),
    }
  }
  return { kind: 'other', text: trimmed }
}

function compactLen(text: string): number {
  return (text || '').replace(/\s+/g, '').length
}

/** Ước tính sơ bộ một dòng về số giây (được căn chỉnh theo cường độ build_fragments phụ trợ để xem trước phác thảo) */
function estimateLineSec(line: ParsedScriptLine): number {
  if (line.kind === 'empty' || line.kind === 'meta') return 0
  if (line.kind === 'action') {
    const t = line.text.trim()
    if (t.startsWith('【空镜')) return 4
    if (t.startsWith('△') || /^[△▲]/.test(t)) return 2
    return Math.min(10, Math.max(2, Math.floor(compactLen(t) / 12)))
  }
  if (line.kind === 'dialogue') {
    const body = `${line.paren || ''}${line.dialogue || line.text}`
    return Math.min(12, Math.max(3, Math.floor(compactLen(body) / 10)))
  }
  return Math.min(10, Math.max(2, Math.floor(compactLen(line.text) / 12)))
}

function clampLineDuration(sec: number): number {
  if (sec <= 0) return 0
  return Math.min(LINE_DURATION_MAX, Math.max(LINE_DURATION_MIN, sec))
}

/** Tóm tắt thời lượng theo quy tắc đóng gói storyboard (tránh việc "bổ sung từng dòng" không khớp với số cảnh quay thực tế) */
function packEstimatedSec(lineSecs: number[]): number {
  let total = 0
  let used = 0
  for (const raw of lineSecs) {
    const block = clampLineDuration(raw)
    if (block <= 0) continue
    if (used > 0 && used >= FRAGMENT_SOFT_MAX && used + block > FRAGMENT_SOFT_MAX) {
      total += used
      used = 0
    }
    if (used > 0 && used + block > FRAGMENT_TOTAL_MAX) {
      total += used
      used = 0
    }
    let take = block
    if (take > FRAGMENT_TOTAL_MAX) take = FRAGMENT_TOTAL_MAX
    if (used + take > FRAGMENT_TOTAL_MAX) take = FRAGMENT_TOTAL_MAX - used
    if (take <= 0) {
      total += used
      used = 0
      take = Math.min(block, FRAGMENT_TOTAL_MAX)
    }
    used += take
  }
  if (used > 0) total += used
  return total
}

function parseCastNames(raw: string): string[] {
  return raw
    .split(/[、,，/／|｜]+/)
    .map((n) => n.trim())
    .filter(Boolean)
}

/** Thống kê một cảnh: thời gian ước tính, số lời thoại/hành động, nhân vật, cảnh trong và ngoài */
export function summarizeOutlineScene(body: string): OutlineSceneStats {
  const lines = (body || '').split(/\r?\n/).map((line) => parseScriptLine(line))
  const lineSecs: number[] = []
  let dialogueCount = 0
  let actionCount = 0
  let cast: string[] = []
  let location = ''

  for (const line of lines) {
    lineSecs.push(estimateLineSec(line))
    if (line.kind === 'dialogue') dialogueCount += 1
    if (line.kind === 'action') actionCount += 1
    if (line.kind === 'meta') {
      const castMatch = line.text.match(/^(?:出场人物|Nhân vật xuất hiện|Nhân vật)[：:]\s*(.+)$/i)
      if (castMatch) cast = parseCastNames(castMatch[1])
      const locMatch = line.text.match(
        /^(?:日|夜|晨|黄昏|傍晚|凌晨|清晨|午|晚|Ngày|Đêm|Sáng|Chiều|Tối)?\s*(?:内|外|内外|Nội|Ngoại|Nội ngoại)\s+(.+)$/i,
      )
      if (locMatch && !location) location = locMatch[1].split(/[／/]/)[0].trim()
      else if (/^[日夜早晚]/.test(line.text) && !location) location = line.text
    }
  }

  let estimatedSec = packEstimatedSec(lineSecs)
  if (estimatedSec > 0) {
    estimatedSec = Math.min(SCENE_DURATION_MAX, Math.max(SCENE_DURATION_MIN, estimatedSec))
  }

  return { estimatedSec, dialogueCount, actionCount, cast, location }
}

function formatClockDuration(sec: number, minLabel: string, minSecLabel: string): string {
  if (sec <= 0) return '—'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s
    ? minSecLabel.replace('{m}', String(m)).replace('{s}', String(s))
    : minLabel.replace('{m}', String(m))
}

function formatEstimateDuration(sec: number, approxLabel: string, minLabel: string, minSecLabel: string): string {
  if (sec <= 0) return approxLabel.replace('{dur}', '—')
  return approxLabel.replace('{dur}', formatClockDuration(sec, minLabel, minSecLabel))
}

// Hiển thị các dòng script được phân tích cú pháp
function ScriptLines({ text }: { text: string }) {
  const lines = useMemo(
    () => text.split(/\r?\n/).map((line) => parseScriptLine(line)),
    [text],
  )
  return (
    <div className="drama-outline-script-lines">
      {lines.map((line, i) => {
        if (line.kind === 'empty') return <div key={i} className="drama-outline-script-gap" />
        if (line.kind === 'meta') {
          return (
            <p key={i} className="drama-outline-script-meta">
              {line.text}
            </p>
          )
        }
        if (line.kind === 'action') {
          return (
            <p key={i} className="drama-outline-script-action">
              {line.text}
            </p>
          )
        }
        if (line.kind === 'dialogue' && line.speaker) {
          return (
            <p key={i} className="drama-outline-script-dialogue">
              <span className="drama-outline-script-speaker" style={{ color: speakerColor(line.speaker) }}>
                {line.speaker}
                {line.paren ? `（${line.paren}）` : ''}
              </span>
              <span className="drama-outline-script-colon">：</span>
              <span>{line.dialogue}</span>
            </p>
          )
        }
        return (
          <p key={i} className="drama-outline-script-other">
            {line.text}
          </p>
        )
      })}
    </div>
  )
}

/** Thanh thông tin cảnh: Lời thoại/ Hành động/ Cảnh trong ngoài/ Ngoại hình */
function SceneStatsBar({ stats }: { stats: OutlineSceneStats }) {
  const { t } = useI18n()
  const items: string[] = []
  if (stats.dialogueCount > 0) items.push(t('drama.scriptPreview.dialogueStat').replace('{n}', String(stats.dialogueCount)))
  if (stats.actionCount > 0) items.push(t('drama.scriptPreview.actionStat').replace('{n}', String(stats.actionCount)))
  if (stats.location) items.push(stats.location)
  if (stats.cast.length) items.push(stats.cast.slice(0, 6).join('、'))
  if (!items.length) return null
  return (
    <div className="drama-outline-scene-stats" aria-label={t('drama.scriptPreview.sceneStatsAria')}>
      {items.map((item) => (
        <span key={item} className="drama-outline-scene-stat">
          {item}
        </span>
      ))}
    </div>
  )
}

type OutlineScriptPreviewProps = {
  text: string
  empty: string
  busy?: boolean
  /** Khi chia thành các bảng phân cảnh, tổng thời lượng của cảnh quay sẽ được hiển thị đầu tiên */
  shotStats?: OutlineShotDurationStats | null
  /** Lưu phân đoạn: trả về phần nội dung hoàn chỉnh đã cập nhật */
  onSaveScenes?: (nextBody: string) => Promise<void> | void
}

// Danh sách thẻ sự kiện + chỉnh sửa theo phân đoạn
export function OutlineScriptPreview({
  text,
  empty,
  busy,
  shotStats,
  onSaveScenes,
}: OutlineScriptPreviewProps) {
  const { t, locale } = useI18n()
  const minLabel = t('drama.outlinePanel.min')
  const minSecLabel = t('drama.outlinePanel.minSec')
  const blocks = useMemo(() => parseOutlineSceneBlocks(text), [text])
  const blockStats = useMemo(
    () => blocks.map((b) => summarizeOutlineScene(b.body)),
    [blocks],
  )
  const estimateTotalSec = useMemo(
    () => blockStats.reduce((sum, s) => sum + (s.estimatedSec || 0), 0),
    [blockStats],
  )
  const hasShotDuration = Boolean(shotStats && shotStats.fragmentCount > 0 && shotStats.totalSec > 0)
  const displayTotalSec = hasShotDuration ? shotStats!.totalSec : estimateTotalSec
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit(index: number) {
    setEditingIndex(index)
    setDraft(blocks[index]?.raw || '')
  }

  async function saveEdit() {
    if (editingIndex == null || !onSaveScenes) return
    setSaving(true)
    try {
      const next = blocks.map((b, i) =>
        i === editingIndex ? { ...b, raw: draft.trim() } : b,
      )
      await onSaveScenes(joinOutlineSceneBlocks(next))
      setEditingIndex(null)
    } finally {
      setSaving(false)
    }
  }

  if (!text.trim()) {
    return <p className="drama-outline-section-empty">{empty}</p>
  }

  const isSingleFullTextBlock =
    blocks.length === 1 &&
    (blocks[0].label === '全文' || blocks[0].label === 'Toàn văn' || blocks[0].label === 'Full text')

  const summaryBar =
    blocks.length > 0 ? (
      <div className="drama-outline-script-summary">
        <span>{isSingleFullTextBlock ? t('drama.scriptPreview.fullText') : t('drama.scriptPreview.sceneCount').replace('{n}', String(blocks.length))}</span>
        {hasShotDuration ? (
          <span>
            {t('drama.scriptPreview.shotTotal').replace('{n}', String(shotStats!.fragmentCount)).replace('{dur}', formatClockDuration(displayTotalSec, minLabel, minSecLabel))}
          </span>
        ) : displayTotalSec > 0 ? (
          <span>{t('drama.scriptPreview.totalDur').replace('{dur}', formatClockDuration(displayTotalSec, minLabel, minSecLabel))}</span>
        ) : null}
        <span className="drama-outline-script-summary-hint">
          {hasShotDuration
            ? t('drama.scriptPreview.durationFromShot')
            : t('drama.scriptPreview.durationEstimate')}
        </span>
      </div>
    ) : null

  if (isSingleFullTextBlock) {
    return (
      <div className="drama-outline-scene">
        {summaryBar}
        <div className="drama-outline-scene-toolbar">
          {onSaveScenes ? (
            <button
              type="button"
              className="drama-outline-text-btn"
              disabled={busy || saving}
              onClick={() => startEdit(0)}
            >
              <Pencil size={13} />
              {t('drama.scriptPreview.editSection')}
            </button>
          ) : null}
        </div>
        {editingIndex === 0 ? (
          <SceneEditBox
            draft={draft}
            saving={saving || Boolean(busy)}
            onChange={setDraft}
            onCancel={() => setEditingIndex(null)}
            onSave={() => void saveEdit()}
          />
        ) : (
          <>
            <SceneStatsBar stats={blockStats[0]} />
            <ScriptLines text={blocks[0].body} />
          </>
        )}
      </div>
    )
  }

function formatSceneBlockLabel(label: string, locale: string): string {
  const m = label.match(/^(?:场|Scene|Cảnh|Phân cảnh)\s*(.+)$/i)
  if (m) {
    if (locale === 'vi') return `Cảnh ${m[1]}`
    if (locale === 'en') return `Scene ${m[1]}`
    return `场 ${m[1]}`
  }
  if (label === '全文' || label === 'Toàn văn' || label === 'Full text') {
    if (locale === 'vi') return 'Toàn văn'
    if (locale === 'en') return 'Full text'
    return '全文'
  }
  return label
}

  return (
    <div className="drama-outline-scenes">
      {summaryBar}
      {blocks.map((block, i) => (
        <article key={`${block.label}-${i}`} className="drama-outline-scene">
          <header className="drama-outline-scene-head">
            <span className="drama-outline-scene-badge">{formatSceneBlockLabel(block.label, locale)}</span>
            {block.title ? <strong>{block.title}</strong> : null}
              {blockStats[i]?.estimatedSec && !hasShotDuration ? (
                <span className="drama-outline-scene-duration">
                  {formatEstimateDuration(blockStats[i].estimatedSec, t('drama.scriptPreview.approx'), minLabel, minSecLabel)}
                </span>
              ) : null}
            {onSaveScenes ? (
                <button
                type="button"
                className="drama-outline-text-btn drama-outline-scene-edit"
                disabled={busy || saving}
                onClick={() => startEdit(i)}
              >
                <Pencil size={13} />
                {t('drama.scriptPreview.editScene')}
              </button>
            ) : null}
          </header>
          {editingIndex === i ? (
            <SceneEditBox
              draft={draft}
              saving={saving || Boolean(busy)}
              onChange={setDraft}
              onCancel={() => setEditingIndex(null)}
              onSave={() => void saveEdit()}
            />
          ) : (
            <>
              <SceneStatsBar stats={blockStats[i]} />
              <ScriptLines text={block.body} />
            </>
          )}
        </article>
      ))}
    </div>
  )
}

function SceneEditBox({
  draft,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: string
  saving: boolean
  onChange: (v: string) => void
  onCancel: () => void
  onSave: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="drama-outline-scene-edit-box">
      <textarea
        className="drama-ep-section-textarea"
        rows={12}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
      />
      <div className="drama-ep-section-edit-actions">
        <button type="button" className="drama-btn-ghost" disabled={saving} onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className="drama-btn-primary" disabled={saving} onClick={onSave}>
          {saving ? t('common.saving') : t('drama.scriptPreview.saveSection')}
        </button>
      </div>
    </div>
  )
}

/** Chỉ xem trước phân tích cú pháp cửa sổ bật lên */
export function OutlineScriptParseModal({
  open,
  onClose,
  title,
  text,
}: {
  open: boolean
  onClose: () => void
  title: string
  text: string
}) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onClose} title={title} size="xl" className="drama-outline-script-modal">
      <div className="drama-outline-script-modal-body">
        <OutlineScriptPreview text={text} empty={t('drama.scriptPreview.noScript')} />
      </div>
    </Modal>
  )
}
