import { useEffect, useState } from 'react'
import { apiKeysApi, getPublicApiBase, type ApiKeyItem } from '../../api/apiKeys'
import { dialog } from '../../lib/dialog'
import { useI18n } from '../../i18n'

/** 格式化时间 */
function formatWhen(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 设置页 API：Key 管理与调用文档 */
export default function ApiKeysPanel() {
  const { t } = useI18n()
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createdSecret, setCreatedSecret] = useState('')
  const [copiedKey, setCopiedKey] = useState('')

  const base = getPublicApiBase()

  async function reload() {
    setError('')
    try {
      setKeys(await apiKeysApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : t('apiKeys.loadFailed'))
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleCreate() {
    if (busy) return
    setBusy(true)
    setError('')
    setCreatedSecret('')
    try {
      const row = await apiKeysApi.create(name.trim() || 'Default Key')
      setCreatedSecret(row.secret)
      setName('')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('apiKeys.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke(item: ApiKeyItem) {
    const ok = await dialog.confirm({
      title: t('apiKeys.revokeTitle'),
      message: t('apiKeys.revokeConfirm').replace('{name}', item.name),
      confirmText: t('apiKeys.revokeBtn'),
    })
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      await apiKeysApi.revoke(item.id)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('apiKeys.revokeFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(text)
      setTimeout(() => setCopiedKey(''), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="pf-settings-card">
      <h1>{t('apiKeys.title')}</h1>
      <p className="pf-muted">{t('apiKeys.lead')}</p>

      <div className="pf-api-create">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('apiKeys.namePlaceholder')}
          maxLength={64}
        />
        <button type="button" className="pf-btn pf-btn-lime pf-btn-sm" disabled={busy} onClick={() => void handleCreate()}>
          {busy ? t('apiKeys.creating') : t('apiKeys.createBtn')}
        </button>
      </div>

      {createdSecret ? (
        <div className="pf-api-secret">
          <p>
            <strong>{t('apiKeys.keyHint')}</strong>
          </p>
          <code>{createdSecret}</code>
          <button type="button" className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => void copyText(createdSecret)}>
            {copiedKey === createdSecret ? t('apiKeys.copied') : t('apiKeys.copyKey')}
          </button>
        </div>
      ) : null}

      {error ? <p className="pf-error">{error}</p> : null}

      {keys.length > 0 ? (
        <ul className="pf-settings-list pf-api-key-list">
          {keys.map((item) => (
            <li key={item.id}>
              <div className="pf-settings-list-row">
                <span className="pf-settings-list-main">
                  <strong>{item.name}</strong>
                  <em className="pf-muted">
                    {item.key_prefix}… · {t('apiKeys.createdAt').replace('{time}', formatWhen(item.created_at))}
                    {item.last_used_at ? ` · ${t('apiKeys.lastUsed').replace('{time}', formatWhen(item.last_used_at))}` : ` · ${t('apiKeys.neverUsed')}`}
                  </em>
                </span>
                <button
                  type="button"
                  className="pf-btn pf-btn-ghost pf-btn-sm"
                  disabled={busy}
                  onClick={() => void handleRevoke(item)}
                >
                  {t('apiKeys.revokeBtn')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="pf-settings-empty">
          <p>{t('apiKeys.noKeys')}</p>
        </div>
      )}

      <div className="pf-api-docs">
        <h3>{t('apiKeys.docsLink')}</h3>
        <p className="pf-muted">Authorization Header:</p>
        <pre>{`Authorization: Bearer pf_live_...\nX-Api-Key: pf_live_...`}</pre>

        <p className="pf-muted">Image generation (Seedream)</p>
        <pre>{`POST ${base}/api/v1/images/generations
Content-Type: application/json

{
  "prompt": "cyberpunk city night",
  "ratio": "16:9",
  "image_url": null
}`}</pre>

        <p className="pf-muted">Video generation (Seedance)</p>
        <pre>{`POST ${base}/api/v1/videos/generations

{
  "prompt": "slow camera push, neon lights",
  "image_url": "https://.../first_frame.jpg",
  "duration": 5,
  "resolution": "480p"
}`}</pre>

        <p className="pf-muted">Seedance relay (multimodal body)</p>
        <pre>{`POST ${base}/api/v1/seedance/tasks

{
  "content": [
    { "type": "text", "text": "describe..." },
    { "type": "image_url", "image_url": { "url": "https://..." }, "role": "first_frame" }
  ],
  "duration": 5,
  "resolution": "480p"
}`}</pre>

        <p className="pf-muted">Query task</p>
        <pre>{`GET ${base}/api/v1/tasks/{task_id}`}</pre>
      </div>
    </section>
  )
}
