import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, defaultsFromTemplate } from '../../api'
import type { Template } from '../../api'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import AppShell from '../../components/layout/AppShell'
import Stepper from '../../components/ui/Stepper'
import PillTabs from '../../components/ui/PillTabs'
import { IconChevronLeft, IconHelp, IconRefresh, IconSparkles } from '../../components/ui/Icons'
import { CATEGORY_ORDER, getCategoryLabel } from '../../lib/categories'
import { getTemplateDescription, getTemplateName } from '../../lib/templates'
import { kepuStepIndex, kepuSteps } from '../../lib/status'

import { getInspirationsForTemplate, type Inspiration } from '../../lib/inspirations'

const PAGE_SIZE = 6

function isDefaultTitle(value: string, untitled: string) {
  const trimmed = value.trim()
  return !trimmed || trimmed === untitled
}

function deriveTitle(text: string, untitled: string) {
  const line = text
    .trim()
    .split(/\n/)[0]
    .replace(/["""'']/g, '')
    .replace(/[。！？!?：:].*$/, '')
    .trim()
  if (!line) return untitled
  return line.slice(0, 18)
}

export default function CreateProjectPage() {
  const { t, locale } = useI18n()

  const nav = useNavigate()
  const [params] = useSearchParams()
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState(params.get('template') || '')
  const [category, setCategory] = useState(t('studio.createProject.all'))
  const [q, setQ] = useState('')
  const [inputTab, setInputTab] = useState(t('studio.createProject.tabTheme'))
  const [sourceText, setSourceText] = useState('')
  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [inspPage, setInspPage] = useState(0)
  const [selectedInspiration, setSelectedInspiration] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)

  const [error, setError] = useState('')
  const [showInspirationTooltip, setShowInspirationTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Tự động điều chỉnh chiều cao textarea theo nội dung, không xuất hiện thanh cuộn
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`
    }
  }, [sourceText, inputTab])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowInspirationTooltip(false)
      }
    }
    if (showInspirationTooltip) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showInspirationTooltip])

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      nav('/auth')
      return
    }
    api.me().catch(() => nav('/auth'))
    api.templates().then((list) => {
      setTemplates(list)
      const fromUrl = params.get('template') || ''
      setTemplateId((prev) => prev || fromUrl || list[0]?.id || '')
    })
  }, [nav, params])

  const categories = useMemo(() => {
    const found = new Set<string>()
    for (const tpl of templates) {
      for (const c of tpl.category || []) {
        if (CATEGORY_ORDER.includes(c)) found.add(c)
      }
    }
    return [t('studio.createProject.all'), t('studio.createProject.featured'), ...CATEGORY_ORDER.filter((c) => found.has(c)).map(getCategoryLabel)]
  }, [templates])

  const filtered = useMemo(() => {
    let list = templates
    if (category === t('studio.createProject.featured')) {
      list = [...templates].sort((a, b) => a.sort_order - b.sort_order).slice(0, 8)
    } else if (category !== t('studio.createProject.all')) {
      const rawKey = CATEGORY_ORDER.find((k) => getCategoryLabel(k) === category)
      list = list.filter((tpl) => {
        const cats = tpl.category || []
        return (rawKey && cats.includes(rawKey)) || cats.includes(category) || cats.some((c) => getCategoryLabel(c) === category)
      })
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(s) ||
          getTemplateName(tpl, locale).toLowerCase().includes(s) ||
          (tpl.description || '').toLowerCase().includes(s) ||
          getTemplateDescription(tpl, locale).toLowerCase().includes(s),
      )
    }
    return list
  }, [templates, category, q, locale, t])

  const selected = templates.find((t) => t.id === templateId)
  const sourceType = inputTab === t('studio.createProject.tabScript') ? 'script' : 'theme'

  const activeInspirations = useMemo(() => {
    return getInspirationsForTemplate(selected, category)
  }, [selected, category])

  const inspTotal = Math.max(1, Math.ceil(activeInspirations.length / PAGE_SIZE))
  const inspirations = useMemo(() => {
    return activeInspirations.slice(inspPage * PAGE_SIZE, inspPage * PAGE_SIZE + PAGE_SIZE)
  }, [activeInspirations, inspPage])

  // Reset trang và tự động cập nhật gợi ý ăn khớp với template khi đổi template/category
  useEffect(() => {
    setInspPage(0)
    if (!titleTouched && activeInspirations.length > 0) {
      const first = activeInspirations[0]
      setSelectedInspiration(first.title)
      setTitle(first.title.slice(0, 80))
      setSourceText(sourceType === 'script' ? first.script.slice(0, 8000) : first.theme.slice(0, 250))
    }
  }, [templateId, activeInspirations, titleTouched, sourceType])

  // Điền ví dụ cảm hứng vào chủ đề/bản sao và đồng bộ hóa tiêu đề ngắn
  function applyInspiration(item: Inspiration) {
    setSelectedInspiration(item.title)
    if (sourceType === 'script') {
      setInputTab(t('studio.createProject.tabScript'))
      setSourceText(item.script.slice(0, 8000))
    } else {
      setInputTab(t('studio.createProject.tabTheme'))
      setSourceText(item.theme.slice(0, 250))
    }
    setTitle(item.title.slice(0, 80))
    setTitleTouched(false)
    setError('')
  }

  function shuffleInspirations() {
    setInspPage((p) => (p + 1) % inspTotal)
  }

  async function aiExpand() {
    const seed = sourceText.trim() || title.trim() || t('studio.createProject.seedDefault')
    setAiBusy(true)
    setError('')
    try {
      const mode = sourceType === 'script' ? 'script' : 'theme'
      const result = await api.expandContent(seed, mode)
      setSourceText(result.content.slice(0, mode === 'theme' ? 250 : 8000))
      if (!titleTouched || isDefaultTitle(title, t('studio.createProject.untitled'))) {
        setTitle(result.title.slice(0, 80))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.createProject.aiGenFailed'))
    } finally {
      setAiBusy(false)
    }
  }

  async function next() {
    if (!templateId || !sourceText.trim()) {
      setError(t('studio.createProject.selectTemplateFirst'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const tpl = templates.find((t) => t.id === templateId)
      const d = tpl ? defaultsFromTemplate(tpl) : undefined
      const modeParam = params.get('mode')
      const pipeline_mode: 'full' | 'image_text' =
        modeParam === 'image_text' || modeParam === 'full' ? modeParam : 'full'
      const finalTitle =
        title.trim() || deriveTitle(sourceText, t('studio.createProject.untitled')) || sourceText.trim().slice(0, 24) || t('studio.createProject.untitled')
      const project = await api.createProject({
        template_id: templateId,
        title: finalTitle,
        source_type: sourceType,
        source_text: sourceText.trim(),
        resolution_mode: 'preview',
        pipeline_mode,
        output_ratio: d?.output_ratio || '16:9',
        voice_id: d?.voice_id,
      })
      nav(`/studio/${project.id}/style`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.createProject.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell active="studio" wide hideFooter>
      <header className="pf-page-head">
        <div className="pf-page-head-row">
          <div>
            <button type="button" className="pf-back" onClick={() => nav('/')}>
              <IconChevronLeft size={18} />
              {t('studio.createProject.backBtn')}
            </button>
            <h1 className="pf-page-title">{t('studio.createProject.pageTitle')}</h1>
          </div>
          <Stepper steps={kepuSteps()} current={kepuStepIndex('create')} doneThrough={-1} />
        </div>
      </header>

      <div className="pf-create">
        <aside className="pf-create-col">
          <h3>{t('studio.createProject.selectTemplate')}</h3>
          <div className="pf-search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('studio.createProject.searchPlaceholder')} />
          </div>
          <PillTabs items={categories.slice(0, 9)} value={category} onChange={setCategory} ariaLabel={t('studio.createProject.templateCategory')} />
          <div className="pf-tpl-list" style={{ marginTop: '0.75rem' }}>
            {filtered.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className={templateId === tpl.id ? 'pf-tpl-mini selected' : 'pf-tpl-mini'}
                onClick={() => setTemplateId(tpl.id)}
              >
                <img src={api.assetUrl(tpl.preview_cover, 'v2')} alt="" />
                <div>
                  <strong>{getTemplateName(tpl, locale)}</strong>
                  <span>
                    {tpl.default_ratio} · {getCategoryLabel((tpl.category || [])[0]) || t('studio.createProject.general')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="pf-create-col">
          <h3>{t('studio.createProject.inputContent')}</h3>
          <div className="pf-input-tabs">
            {[
              {
                id: 'theme',
                label: t('studio.createProject.tabTheme'),
                tooltip: t('studio.createProject.tabThemeTooltip'),
              },
              {
                id: 'script',
                label: t('studio.createProject.tabScript'),
                tooltip: t('studio.createProject.tabScriptTooltip'),
              },
            ].map((tab) => (
              <div key={tab.id} className="pf-tab-tooltip-wrapper">
                <button
                  type="button"
                  className={['pf-pill', inputTab === tab.label ? 'lime active' : ''].join(' ')}
                  onClick={() => setInputTab(tab.label)}
                >
                  {tab.label}
                </button>
                <div className="pf-tab-tooltip" role="tooltip">
                  {tab.tooltip}
                </div>
              </div>
            ))}
          </div>

          <div className="pf-inspire">
            <div className="pf-inspire-head">
              <div className="pf-inspire-title-wrap">
                <strong>{t('studio.createProject.inspirations')}</strong>
                <div className="pf-tooltip-wrapper" ref={tooltipRef}>
                  <button
                    type="button"
                    className={`pf-help-icon-btn ${showInspirationTooltip ? 'active' : ''}`}
                    aria-label="Thông tin gợi ý"
                    onClick={() => setShowInspirationTooltip((prev) => !prev)}
                  >
                    <IconHelp size={15} />
                  </button>
                  {showInspirationTooltip ? (
                    <div className="pf-tooltip-popover" role="tooltip">
                      <p>{t('studio.createProject.themeTip')}</p>
                    </div>
                  ) : null}
                </div>
              </div>
              <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm pf-btn-icon" onClick={shuffleInspirations}>
                <IconRefresh size={14} />
                {t('studio.createProject.changeBatch')}
              </button>
            </div>
            <div className="pf-chips">
              {inspirations.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className={['pf-chip', selectedInspiration === item.title ? 'active' : ''].filter(Boolean).join(' ')}
                  title={sourceType === 'script' ? item.script.slice(0, 80) : item.theme}
                  onClick={() => applyInspiration(item)}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <p className="pf-muted" style={{ fontSize: '0.78rem', margin: '0.55rem 0 0' }}>
              {t('studio.createProject.exampleTip').replace('{type}', sourceType === 'script' ? t('studio.createProject.script') : t('studio.createProject.theme'))}
            </p>
          </div>

          <label className="pf-field">
            <span className="pf-field-label">{t('studio.createProject.projectName')}</span>
            <input
              className="pf-field-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setTitleTouched(true)
              }}
              onBlur={() => {
                if (isDefaultTitle(title, t('studio.createProject.untitled')) && sourceText.trim()) {
                  setTitle(deriveTitle(sourceText, t('studio.createProject.untitled')))
                  setTitleTouched(false)
                }
              }}
              placeholder={t('studio.createProject.titlePlaceholder')}
            />
          </label>

          <div className="pf-textarea-wrap">
            <textarea
              ref={textareaRef}
              value={sourceText}
              onChange={(e) => {
                const next = e.target.value.slice(0, sourceType === 'theme' ? 250 : 8000)
                setSourceText(next)
                if (!titleTouched || isDefaultTitle(title, t('studio.createProject.untitled'))) {
                  setTitle(deriveTitle(next, t('studio.createProject.untitled')))
                }
              }}
              placeholder={
                sourceType === 'theme'
                  ? t('studio.createProject.exampleTheme')
                  : t('studio.createProject.exampleScript')
              }
            />
            {sourceType === 'theme' ? (
              <span className="pf-char-count">{sourceText.length}/250</span>
            ) : (
              <span className="pf-char-count">{sourceText.length} {t('studio.createProject.chars')}</span>
            )}
          </div>

          <div className="pf-ai-rewrite-footer">
            <button
              type="button"
              className="pf-btn pf-btn-ai pf-btn-sm pf-btn-icon"
              disabled={aiBusy || busy}
              onClick={aiExpand}
            >
              <IconSparkles size={14} />
              {aiBusy ? t('studio.createProject.aiGenerating2') : sourceType === 'script' ? t('studio.createProject.aiExpandScript') : t('studio.createProject.aiGenTheme')}
            </button>
            <span className="pf-muted pf-ai-rewrite-hint">
              {sourceType === 'script' ? t('studio.createProject.aiExpandHint') : t('studio.createProject.aiGenHint')}
            </span>
          </div>
          {error ? <BillingErrorNotice message={error} /> : null}
        </section>

        <aside className="pf-create-col">
          <h3>{t('studio.createProject.summary')}</h3>
          {selected ? (
            <div style={{ marginBottom: '0.85rem' }}>
              <img
                src={api.assetUrl(selected.preview_cover, 'v2')}
                alt=""
                style={{ width: '100%', borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover' }}
              />
              <strong style={{ display: 'block', marginTop: '0.5rem' }}>{getTemplateName(selected, locale)}</strong>
              <p className="pf-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                {getTemplateDescription(selected, locale)}
              </p>
            </div>
          ) : (
            <p className="pf-muted">{t('studio.createProject.pleaseSelectTemplate')}</p>
          )}
          <div className="pf-summary-row">
            <span>{t('studio.createProject.workTitle')}</span>
            <span>{title.trim() || t('studio.createProject.untitled')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.outputMode')}</span>
            <span>{selected?.default_ratio === '9:16' ? t('studio.createProject.video916') : t('studio.createProject.video169')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.estDuration')}</span>
            <span>{t('studio.createProject.estDurationVal')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.language')}</span>
            <span>{t('studio.createProject.languageVal')}</span>
          </div>
          <div className="pf-summary-row">
            <span>{t('studio.createProject.inputMode')}</span>
            <span>{inputTab}</span>
          </div>
          <button
            type="button"
            className="pf-btn pf-btn-lime pf-btn-block pf-btn-lg"
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.65rem 1rem',
              gap: '0.15rem',
              lineHeight: 1.25,
            }}
            disabled={busy || aiBusy || !templateId || !sourceText.trim()}
            onClick={next}
          >
            {busy ? (
              <span>{t('studio.createProject.creating')}</span>
            ) : (
              <>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.88, letterSpacing: '0.01em' }}>
                  {t('studio.createProject.nextStepPrefix')}
                </span>
                <span
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {t('studio.createProject.nextStepTitle')}
                  <span aria-hidden>→</span>
                </span>
              </>
            )}
          </button>
          <p className="pf-muted" style={{ fontSize: '0.78rem', marginTop: '0.75rem' }}>
            {t('studio.createProject.styleTip')}
          </p>
        </aside>
      </div>
    </AppShell>
  )
}
