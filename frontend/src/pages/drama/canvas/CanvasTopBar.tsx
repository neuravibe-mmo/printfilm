/** Thanh trên cùng của canvas: trả về, tiêu đề, chỉ báo đã lưu, cài đặt giữ chỗ */
import { useState } from 'react'
import { ChevronLeft, Maximize2, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCanvasStore } from './CanvasStore'
import { useI18n } from '../../../i18n'
import LanguageSwitch from '../../../components/layout/LanguageSwitch'

type Props = {
  variant?: 'fullscreen' | 'embedded'
}

/** Hiển thị thanh công cụ trên cùng của trang canvas */
export function CanvasTopBar({ variant = 'fullscreen' }: Props) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { saveStatusVisible, projectId, freeCanvasMode } = useCanvasStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const embedded = variant === 'embedded'

  return (
    <>
      <div className="fc-overlay fc-topbar">
        <div className="fc-topbar-left">
          {embedded ? null : (
            <button
              type="button"
              className="fc-icon-btn"
              aria-label={t('common.back')}
              title={t('common.back')}
              onClick={() => {
                if (freeCanvasMode) {
                  navigate('/drama')
                  return
                }
                if (window.history.length > 1) navigate(-1)
                else navigate(`/drama/projects/${projectId}`)
              }}
            >
              <ChevronLeft size={20} strokeWidth={1.8} />
            </button>
          )}
          <span className="fc-topbar-title">
            {embedded ? t('drama.canvas.assetCanvas') : freeCanvasMode ? t('drama.canvas.freeCanvas') : t('drama.canvas.assetOrchestration')}
          </span>
          {saveStatusVisible ? (
            <span className="fc-save-pill">
              <span className="fc-save-dot" />
              {t('drama.canvas.saved')}
            </span>
          ) : null}
        </div>

        <div className="fc-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitch />
          {embedded ? (
            <button
              type="button"
              className="fc-icon-btn"
              aria-label={t('drama.canvas.fullscreen')}
              title={t('drama.canvas.fullscreen')}
              onClick={() => navigate(`/drama/projects/${projectId}/canvas`)}
            >
              <Maximize2 size={18} strokeWidth={1.8} />
            </button>
          ) : null}
          <button
            type="button"
            className="fc-icon-btn"
            aria-label={t('common.settings')}
            title={t('common.settings')}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((v) => !v)}
          >
            <Settings size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {settingsOpen ? (
        <div className="fc-settings-pop" role="dialog" aria-label={t('drama.canvas.settingsTitle')}>
          <strong>{t('drama.canvas.settingsTitle')}</strong>
          {freeCanvasMode
            ? t('drama.canvas.freeCanvasDesc')
            : t('drama.canvas.embeddedDesc')}
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="fc-icon-btn is-sm"
              style={{ width: 'auto', padding: '0 12px', borderRadius: 10 }}
              onClick={() => setSettingsOpen(false)}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
