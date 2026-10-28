/** Phác thảo "Cài đặt dự án": khung/kiểu/phụ đề/giới thiệu nhân vật/kết nối khung cuối cùng (có thể thay đổi toàn cục; trang bảng phân cảnh ở chế độ chỉ đọc) */
import { useState, useEffect } from 'react'
import { Link, ClipboardPaste, RotateCcw, Check, ExternalLink } from 'lucide-react'

export const FLOW_PROJECT_ID_DEFAULT = '746c4f17-5aa9-4cf1-b824-f8d0bd7aa6c4'

import { useI18n } from '../../i18n'
import Modal from '../../components/ui/Modal'
import { DramaImageStyleModal } from './DramaImageStyleModal'
import {
  characterIntroModeEnabled,
  readEpisodeCharacterIntroMode,
  type DramaCharacterIntroMode,
} from '../../lib/dramaCharacterIntro'
import { type ImageStyleId } from '../../lib/dramaImageStyles'
import {
  DRAMA_RATIO_OPTIONS,
  DRAMA_RES_OPTIONS,
  readProjectAspectRatio,
  readProjectResolution,
  type DramaAspectRatio,
  type DramaResolution,
} from '../../lib/dramaProjectOutputSettings'
import {
  readEpisodeSubtitleMode,
  subtitleModeUsesModelOutput,
  type DramaSubtitleMode,
} from '../../lib/dramaSubtitleBoard'
import type { DramaProject, DramaScript } from '../../api/drama'
import { dramaApi } from '../../api/drama'

type Props = {
  open: boolean
  projectId: number
  project: DramaProject
  script: DramaScript | null
  onClose: () => void
  onProjectChange: (p: DramaProject) => void
  onScriptChange: (s: DramaScript) => void
  onError: (msg: string) => void
}

type ChoiceProps<T extends string | boolean> = {
  options: Array<{ value: T; label: string }>
  value: T
  disabled?: boolean
  onChange: (value: T) => void
}

function coerceLinkLastFrame(params: Record<string, unknown> | null | undefined): boolean {
  const raw = params?.linkLastFrame ?? params?.link_last_frame
  if (raw == null) return true
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw !== 0
  if (typeof raw === 'string') {
    const n = raw.trim().toLowerCase()
    if (['0', 'false', 'no', 'off', ''].includes(n)) return false
  }
  return Boolean(raw)
}

/** Thanh tùy chọn trong cài đặt dự án (sử dụng lại kiểu chip phác thảo) */
function SettingsChoiceRow<T extends string | boolean>({
  options,
  value,
  disabled,
  onChange,
}: ChoiceProps<T>) {
  return (
    <div className="drama-project-settings-chips" role="group">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={`drama-outline-chip-btn${value === opt.value ? ' is-on' : ''}`}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** Cửa sổ bật lên bối cảnh phim toàn cầu cấp dự án */
export function DramaProjectSettingsModal({
  open,
  projectId,
  project,
  script,
  onClose,
  onProjectChange,
  onScriptChange,
  onError,
}: Props) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const projectParams = (project.params || {}) as Record<string, unknown>
  const styleId = (String(script?.params?.image_style_id || projectParams.image_style_id || '') ||
    '') as ImageStyleId | ''
  const aspectRatio = readProjectAspectRatio(projectParams)
  const resolution = readProjectResolution(projectParams)
  const subtitleMode = readEpisodeSubtitleMode(projectParams)
  const characterIntroMode = readEpisodeCharacterIntroMode(projectParams)
  const linkLastFrame = coerceLinkLastFrame(projectParams)
  const [flowProjectId, setFlowProjectId] = useState<string>(
    project.flow_project_id || String(projectParams.flow_project_id || '') || FLOW_PROJECT_ID_DEFAULT
  )
  const [flowProjectIdSaving, setFlowProjectIdSaving] = useState(false)
  const [flowSavedSuccess, setFlowSavedSuccess] = useState(false)

  const flowProjectUrl = flowProjectId?.trim()
    ? flowProjectId.trim().startsWith('http')
      ? flowProjectId.trim()
      : `https://flow.google.com/project/${flowProjectId.trim()}`
    : `https://flow.google.com/project/${FLOW_PROJECT_ID_DEFAULT}`

  useEffect(() => {
    if (open) {
      const cur = project.flow_project_id || String(projectParams.flow_project_id || '')
      setFlowProjectId(cur || FLOW_PROJECT_ID_DEFAULT)
      setFlowSavedSuccess(false)
    }
  }, [open, project.flow_project_id, projectParams.flow_project_id])

  async function patchProjectParams(patch: Record<string, unknown>) {
    setSaving(true)
    try {
      const nextParams = { ...projectParams, ...patch }
      const updated = await dramaApi.updateProject(projectId, { params: nextParams })
      onProjectChange(updated)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.projectSettings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  /** Bóc tách UUID từ Google Flow URL hoặc dùng trực tiếp nếu đã là UUID */
  function parseFlowProjectId(input: string): string {
    const trimmed = input.trim()
    // Thử bóc tách từ URL: https://flow.google.com/project/<uuid>/...
    const m = trimmed.match(/\/project\/([0-9a-f-]{32,})/i)
    if (m) return m[1]
    return trimmed
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const parsed = parseFlowProjectId(text)
        setFlowProjectId(parsed)
        setFlowSavedSuccess(false)
      }
    } catch {
      // ignore clipboard permission error
    }
  }

  function handleResetDefault() {
    setFlowProjectId(FLOW_PROJECT_ID_DEFAULT)
    setFlowSavedSuccess(false)
  }

  async function saveFlowProjectId() {
    setFlowProjectIdSaving(true)
    setFlowSavedSuccess(false)
    try {
      const parsed = parseFlowProjectId(flowProjectId) || FLOW_PROJECT_ID_DEFAULT
      const updated = await dramaApi.updateProject(projectId, {
        flow_project_id: parsed,
        params: { ...projectParams, flow_project_id: parsed },
      })
      onProjectChange(updated)
      setFlowProjectId(parsed)
      setFlowSavedSuccess(true)
      setTimeout(() => setFlowSavedSuccess(false), 2500)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.projectSettings.saveFailed'))
    } finally {
      setFlowProjectIdSaving(false)
    }
  }

  async function handleStyleChange(id: ImageStyleId | '') {
    setSaving(true)
    try {
      const updated = await dramaApi.updateScript(projectId, {
        image_style_id: id || undefined,
      })
      onScriptChange(updated)
      const p = await dramaApi.getProject(projectId)
      onProjectChange(p)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('drama.projectSettings.stylesSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('drama.projectSettings.title')}
      size="md"
      className="drama-project-settings-modal"
      footer={
        <button type="button" className="drama-btn-primary" onClick={onClose} disabled={saving}>
          {t('common.done')}
        </button>
      }
    >
      <div className="drama-project-settings">
        <p className="drama-muted drama-project-settings-lead">
          {t('drama.projectSettings.hint')}
        </p>

        <section className="drama-project-settings-section">
          <div className="drama-project-settings-head">
            <h4>{t('drama.projectSettings.aspect')}</h4>
          </div>
          <SettingsChoiceRow
            value={aspectRatio}
            disabled={saving}
            options={DRAMA_RATIO_OPTIONS.map((r) => ({ value: r as DramaAspectRatio, label: r }))}
            onChange={(ratio) => void patchProjectParams({ aspect_ratio: ratio })}
          />
          <div className="drama-project-settings-head">
            <h4>{t('drama.projectSettings.resolution')}</h4>
          </div>
          <SettingsChoiceRow
            value={resolution}
            disabled={saving}
            options={DRAMA_RES_OPTIONS.map((r) => ({ value: r as DramaResolution, label: r }))}
            onChange={(res) => void patchProjectParams({ resolution: res })}
          />
        </section>

        <section className="drama-project-settings-section">
          <div className="drama-project-settings-head">
            <h4>{t('drama.projectSettings.imageStyle')}</h4>
          </div>
          <DramaImageStyleModal
            variant="field"
            fieldLabel=""
            title={t('drama.projectSettings.selectStyle')}
            emptyLabel={t('drama.projectSettings.selectStyleEmpty')}
            value={styleId}
            disabled={saving}
            onChange={(id) => void handleStyleChange(id)}
          />
        </section>

        <section className="drama-project-settings-section">
          <div className="drama-project-settings-head">
            <h4>{t('drama.projectSettings.subtitleMode')}</h4>
          </div>
          <SettingsChoiceRow
            value={subtitleMode}
            disabled={saving}
            options={[
              { value: 'post' as DramaSubtitleMode, label: t('drama.projectSettings.subtitlePost') },
              { value: 'model' as DramaSubtitleMode, label: t('drama.projectSettings.subtitleModel') },
            ]}
            onChange={(mode) =>
              void patchProjectParams({
                subtitleMode: mode,
                subtitleEnabled: subtitleModeUsesModelOutput(mode),
              })
            }
          />
          <p className="drama-muted">{t('drama.projectSettings.subtitleHint')}</p>
        </section>

        <section className="drama-project-settings-section">
          <div className="drama-project-settings-head">
            <h4>{t('drama.projectSettings.charIntro')}</h4>
          </div>
          <SettingsChoiceRow
            value={characterIntroMode}
            disabled={saving}
            options={[
              { value: 'off' as DramaCharacterIntroMode, label: t('drama.projectSettings.charIntroOff') },
              { value: 'model' as DramaCharacterIntroMode, label: t('drama.projectSettings.charIntroOn') },
            ]}
            onChange={(mode) =>
              void patchProjectParams({
                characterIntroMode: mode,
                characterIntroEnabled: characterIntroModeEnabled(mode),
              })
            }
          />
        </section>

        <section className="drama-project-settings-section">
          <div className="drama-project-settings-head">
            <h4>{t('drama.projectSettings.tailFrame')}</h4>
          </div>
          <SettingsChoiceRow
            value={linkLastFrame}
            disabled={saving}
            options={[
              { value: true, label: t('drama.projectSettings.tailFrameOn') },
              { value: false, label: t('drama.projectSettings.tailFrameOff') },
            ]}
            onChange={(enabled) => void patchProjectParams({ linkLastFrame: enabled })}
          />
          <p className="drama-muted">{t('drama.projectSettings.tailFrameHint')}</p>
        </section>

        <section className="drama-project-settings-section">
          <div
            className="drama-project-settings-head"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h4>
                <Link size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: '#10b981' }} />
                Google Flow Project ID
              </h4>
              <a
                href={flowProjectUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="drama-flow-open-link"
                title={`Mở trên Google Flow (${flowProjectUrl})`}
              >
                <ExternalLink size={13} />
              </a>
            </div>
            {flowProjectId === FLOW_PROJECT_ID_DEFAULT && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  background: '#f3f4f6',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 500,
                }}
              >
                Mặc định
              </span>
            )}
          </div>

          <div className="drama-flow-input-group">
            <div className="drama-flow-input-wrapper">
              <input
                type="text"
                className="drama-flow-input"
                placeholder={`Mặc định: ${FLOW_PROJECT_ID_DEFAULT}`}
                value={flowProjectId}
                disabled={flowProjectIdSaving}
                onChange={(e) => {
                  setFlowProjectId(e.target.value)
                  setFlowSavedSuccess(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveFlowProjectId()
                }}
              />

              {flowProjectId !== FLOW_PROJECT_ID_DEFAULT && (
                <button
                  type="button"
                  className="drama-flow-icon-btn"
                  title="Khôi phục ID mặc định"
                  onClick={handleResetDefault}
                  disabled={flowProjectIdSaving}
                >
                  <RotateCcw size={14} />
                </button>
              )}

              <button
                type="button"
                className="drama-flow-icon-btn drama-flow-paste-btn"
                title="Dán từ Clipboard (tự bóc tách link Google Flow)"
                onClick={() => void handlePaste()}
                disabled={flowProjectIdSaving}
              >
                <ClipboardPaste size={15} />
              </button>
            </div>

            <button
              type="button"
              className={`drama-flow-save-btn ${flowSavedSuccess ? 'is-success' : ''}`}
              disabled={flowProjectIdSaving}
              onClick={() => void saveFlowProjectId()}
            >
              {flowProjectIdSaving ? (
                'Đang lưu…'
              ) : flowSavedSuccess ? (
                <>
                  <Check size={14} style={{ marginRight: 4 }} />
                  Đã lưu
                </>
              ) : (
                'Lưu'
              )}
            </button>
          </div>

          <p className="drama-muted" style={{ marginTop: 2 }}>
            Mỗi dự án phim được gắn riêng một Google Flow Project ID. Bạn có thể dán toàn bộ URL dự án Google Flow (hệ thống tự bóc tách UUID) hoặc bấm icon Dán.
          </p>
        </section>
      </div>
    </Modal>
  )
}
