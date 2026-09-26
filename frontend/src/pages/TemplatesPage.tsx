import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { Template } from '../api'
import BillingErrorNotice from '../components/billing/BillingErrorNotice'
import AppShell from '../components/layout/AppShell'
import PillTabs from '../components/ui/PillTabs'
import { CATEGORY_ORDER, HOME_CATEGORY_LABELS } from '../lib/categories'
import { getTemplateCategories, getTemplateDescription, getTemplateName } from '../lib/templates'
import { useI18n } from '../i18n'

export default function TemplatesPage() {
  const nav = useNavigate()
  const { locale } = useI18n()
  const [templates, setTemplates] = useState<Template[]>([])
  const [error, setError] = useState('')
  const [category, setCategory] = useState('全部')
  const [q, setQ] = useState('')

  useEffect(() => {
    api
      .templates(locale)
      .then(setTemplates)
      .catch((e) => setError(String(e.message || e)))
  }, [locale])

  const categoryKeys = useMemo(() => {
    const found = new Set<string>()
    for (const tpl of templates) {
      for (const c of tpl.category || []) {
        if (CATEGORY_ORDER.includes(c)) found.add(c)
      }
    }
    return ['全部', ...CATEGORY_ORDER.filter((c) => found.has(c))]
  }, [templates])

  const categoryLabels = categoryKeys.map((k) => HOME_CATEGORY_LABELS[k] || k)
  const labelToKey = useMemo(() => {
    const m = new Map<string, string>()
    for (const k of categoryKeys) m.set(HOME_CATEGORY_LABELS[k] || k, k)
    return m
  }, [categoryKeys])

  const filtered = useMemo(() => {
    let list = templates
    if (category !== '全部') list = list.filter((item) => (item.category || []).includes(category))
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((item) => {
        const name = getTemplateName(item, locale).toLowerCase()
        const desc = getTemplateDescription(item, locale).toLowerCase()
        return name.includes(s) || desc.includes(s)
      })
    }
    return list
  }, [templates, category, q, locale])

  function openTemplate(item: Template) {
    if (!localStorage.getItem('token')) {
      nav('/auth')
      return
    }
    nav(`/studio/new?template=${item.id}`)
  }

  return (
    <AppShell active="templates">
      <div className="pf-section-head">
        <div>
          <h2>{locale === 'vi' ? 'Kho mẫu phong cách' : locale === 'en' ? 'Template Library' : '模板库'}</h2>
          <p>
            {locale === 'vi'
              ? 'Chọn ngôn ngữ hình ảnh và phong cách phù hợp cho video của bạn'
              : locale === 'en'
                ? 'Choose visual styles and cinematic language for your videos'
                : '为科普与知识短片挑选画面语言'}
          </p>
        </div>
      </div>
      <div className="pf-search" style={{ maxWidth: 420, marginBottom: '1rem' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            locale === 'vi'
              ? 'Tìm kiếm tên mẫu hoặc mô tả...'
              : locale === 'en'
                ? 'Search template name or description...'
                : '搜索模板名称或描述'
          }
        />
      </div>
      <PillTabs
        items={categoryLabels}
        value={HOME_CATEGORY_LABELS[category] || category}
        onChange={(label) => setCategory(labelToKey.get(label) || '全部')}
        ariaLabel="模板分类"
      />
      {error ? <BillingErrorNotice message={error} /> : null}
      <div className="pf-template-grid" style={{ marginTop: '1rem' }}>
        {filtered.map((item) => (
          <button key={item.id} type="button" className="pf-template-card" onClick={() => openTemplate(item)}>
            <img src={api.assetUrl(item.preview_cover)} alt="" />
            <div className="body">
              <h3>{getTemplateName(item, locale)}</h3>
              <p>{getTemplateDescription(item, locale)}</p>
              <div className="pf-tags">
                {getTemplateCategories(item, locale).map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="pf-muted">
          {locale === 'vi' ? 'Không có mẫu phù hợp.' : locale === 'en' ? 'No matching templates found.' : '没有匹配的模板。'}
        </p>
      ) : null}
    </AppShell>
  )
}

