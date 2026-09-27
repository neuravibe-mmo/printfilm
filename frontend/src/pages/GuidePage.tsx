import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Film,
  Users,
  Video,
  Sparkles,
  ArrowRight,
  Camera,
  Lightbulb,
} from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useI18n } from '../i18n'

type Category = 'all' | 'drama' | 'consistency' | 'kepu' | 'canvas' | 'tips'

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  'character-consistency': Users,
  'drama-episodes-workflow': Film,
  'kepu-pipeline-repair': Video,
  'canvas-camera-control': Camera,
  'mock-and-cost-saving': Sparkles,
}

const ACTION_LINKS: Record<string, string> = {
  'character-consistency': '/assets',
  'drama-episodes-workflow': '/drama',
  'kepu-pipeline-repair': '/history',
}

export default function GuidePage() {
  const { m } = useI18n()
  const g = m.guide
  const [selectedCat, setSelectedCat] = useState<Category>('all')

  const catTabs: Array<{ id: Category; label: string }> = [
    { id: 'all', label: g.tabs.all },
    { id: 'consistency', label: g.tabs.consistency },
    { id: 'drama', label: g.tabs.drama },
    { id: 'kepu', label: g.tabs.kepu },
    { id: 'canvas', label: g.tabs.canvas },
    { id: 'tips', label: g.tabs.tips },
  ]

  const filteredItems = selectedCat === 'all'
    ? g.items
    : g.items.filter((item) => item.category === selectedCat)

  return (
    <AppShell active="guide">
      <div className="pf-guide-page" style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '3.5rem' }}>
        {/* Header Hero */}
        <header
          style={{
            textAlign: 'center',
            padding: '2.5rem 1.25rem 2rem',
            background: 'linear-gradient(180deg, rgba(196, 241, 53, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
            borderRadius: '24px',
            marginBottom: '2rem',
            border: '1px solid rgba(196, 241, 53, 0.3)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: 'var(--pf-lime-soft, #f4fed2)',
              color: '#3f6212',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '0.85rem',
            }}
          >
            <Sparkles size={14} />
            <span>{g.heroBadge}</span>
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
            {g.heroTitle}
          </h1>
          <p
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              color: 'var(--pf-muted, #64748b)',
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            {g.heroLead}
          </p>
        </header>

        {/* Categories Tab Navigation */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '2.5rem',
          }}
        >
          {catTabs.map((tab) => {
            const active = selectedCat === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCat(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: active ? '1px solid #65a30d' : '1px solid var(--pf-line, #e2e8f0)',
                  background: active ? '#c4f135' : '#ffffff',
                  color: active ? '#1a2e05' : 'var(--pf-ink, #0f172a)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 2px 8px rgba(196, 241, 53, 0.35)' : 'none',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Guides List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {filteredItems.map((guide) => {
            const Icon = ICONS[guide.id] || Sparkles
            const actionUrl = ACTION_LINKS[guide.id]

            return (
              <article
                key={guide.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid var(--pf-line, #e2e8f0)',
                  padding: '1.75rem 2rem',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#f4fed2',
                        color: '#3f6212',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#4d7c0f',
                          letterSpacing: '0.04em',
                          marginBottom: '2px',
                        }}
                      >
                        {guide.badge}
                      </div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--pf-ink, #0f172a)' }}>
                        {guide.title}
                      </h2>
                    </div>
                  </div>

                  {actionUrl && guide.actionText && (
                    <Link
                      to={actionUrl}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1a2e05',
                        background: '#c4f135',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                    >
                      <span>{guide.actionText}</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>

                <p style={{ color: 'var(--pf-muted, #64748b)', margin: '0 0 1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {guide.desc}
                </p>

                {/* Steps List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {guide.steps.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr',
                        gap: '12px',
                        alignItems: 'start',
                        background: 'rgba(248, 250, 252, 0.8)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: '#e2e8f0',
                          color: '#334155',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1e293b', marginBottom: '2px' }}>
                          {step.title}
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pro Tip Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#fefce8',
                    border: '1px solid #fef08a',
                  }}
                >
                  <Lightbulb size={20} color="#ca8a04" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.88rem', color: '#854d0e', lineHeight: 1.5 }}>
                    <strong>{g.proTipLabel}</strong>
                    {guide.proTip}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
