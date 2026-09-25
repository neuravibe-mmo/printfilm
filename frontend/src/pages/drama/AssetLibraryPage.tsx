/** 全局漫剧资产库：按角色 / 场景 / 道具 / 音色分类，音色可试听 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import BillingErrorNotice from '../../components/billing/BillingErrorNotice'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import FilterSelect from '../../components/ui/FilterSelect'
import Pagination from '../../components/ui/Pagination'
import PillFilter from '../../components/ui/PillFilter'
import { CharacterVoicePreviewButton } from '../../components/drama/CharacterVoicePreviewButton'
import {
  dramaApi,
  resolveDramaMediaUrl,
  type DramaAsset,
  type DramaProjectListItem,
} from '../../api/drama'
import { readAssetVoiceBinding } from './CharacterVoiceBindModal'
import { DramaImageLightbox } from './DramaImageLightbox'
import { filterDramaLibraryAssets, isDramaLibraryAsset } from '../../lib/dramaLibraryAssets'
import { DRAMA_VOICE_BINDING_ENABLED } from '../../lib/dramaVoiceBinding'
import { pageCountOf } from '../../lib/pagination'
import RequireAuth from './RequireAuth'
import { useI18n } from '../../i18n'
import './drama.css'

type AssetTabKey = 'all' | 'character' | 'scene' | 'prop' | 'voice'

const PAGE_SIZE_DEFAULT = 12
const PAGE_SIZE_OPTIONS = [12, 24, 36] as const



const KIND_LABEL: Record<string, string> = {
  character: 'character',
  scene: 'scene',
  prop: 'prop',
  voice: 'voice',
}

export default function AssetLibraryPage() {
  return (
    <RequireAuth>
      <AssetLibraryInner />
    </RequireAuth>
  )
}

// 按资产 type 归入角色 / 场景 / 道具 / 音色
function assetKind(asset: DramaAsset): AssetTabKey | 'other' {
  if (!isDramaLibraryAsset(asset)) return 'other'
  const t = (asset.type || '').toLowerCase()
  if (t === 'character' || t === 'scene' || t === 'prop' || t === 'voice') return t
  return 'other'
}

function matchTab(asset: DramaAsset, tab: AssetTabKey): boolean {
  if (!isDramaLibraryAsset(asset)) return false
  if (!DRAMA_VOICE_BINDING_ENABLED && assetKind(asset) === 'voice') return false
  if (tab === 'all') return true
  return assetKind(asset) === tab
}

function fileMeta(asset: DramaAsset): string {
  const kind = assetKind(asset)
  if (kind !== 'other') return KIND_LABEL[kind]
  const url = (asset.cover || asset.url || '').toLowerCase()
  const ext = url.match(/\.([a-z0-9]{2,5})(\?|$)/)?.[1]
  if (ext) return `.${ext}`
  return asset.type || 'file'
}

// 音色资产或角色已绑定音色的试听地址
function voicePreviewUrl(asset: DramaAsset): string {
  if (assetKind(asset) === 'voice') return asset.url || ''
  return readAssetVoiceBinding(asset)?.url || ''
}

function isImageLike(asset: DramaAsset): boolean {
  const kind = assetKind(asset)
  return kind === 'character' || kind === 'scene' || kind === 'prop' || kind === 'other'
}

function AssetLibraryInner() {
  const { t } = useI18n()
  /*
   * assets 当前项目范围下的资产
   * projects 项目列表（筛选用）
   * projectId 选中的项目 id，空串表示全部
   * tab 角色/场景/道具/音色
   * query 搜索词
   * page 当前页
   * playingId 正在试听的资产 id
   * error 错误文案
   * loading 加载中
   */
  const [assets, setAssets] = useState<DramaAsset[]>([])
  const [projects, setProjects] = useState<DramaProjectListItem[]>([])
  const [projectId, setProjectId] = useState('')
  const [tab, setTab] = useState<AssetTabKey>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    dramaApi
      .listProjects()
      .then(setProjects)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const pid = projectId ? Number(projectId) : undefined
    dramaApi
      .listAssets(Number.isFinite(pid) ? pid : undefined, { libraryOnly: true })
      .then((rows) => {
        if (!cancelled) setAssets(filterDramaLibraryAssets(rows))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('common.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const projectNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const p of projects) map.set(p.id, p.title || `${t('drama.assetLibrary.projectPrefix')} #${p.id}`)
    return map
  }, [projects])

  const projectOptions = useMemo(
    () => [
      { value: '', label: t('drama.assetLibrary.allProjects') },
      ...projects.map((p) => ({
        value: String(p.id),
        label: p.title || `${t('drama.assetLibrary.projectPrefix')} #${p.id}`,
      })),
    ],
    [projects],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assets.filter((asset) => {
      if (!matchTab(asset, tab)) return false
      if (!q) return true
      const name = (asset.name || '').toLowerCase()
      const type = (asset.type || '').toLowerCase()
      const projectName = (projectNameById.get(asset.project_id) || '').toLowerCase()
      return (
        name.includes(q) ||
        type.includes(q) ||
        projectName.includes(q) ||
        String(asset.project_id).includes(q)
      )
    })
  }, [assets, tab, query, projectNameById])

  const pageCount = pageCountOf(filtered.length, pageSize)
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [tab, query, projectId, pageSize])

  // 卡片缩略图上试听 / 暂停音色
  function toggleVoice(asset: DramaAsset) {
    const src = resolveDramaMediaUrl(voicePreviewUrl(asset))
    if (!src) {
      setError(t('drama.assetLibrary.noVoiceSynth'))
      return
    }
    if (playingId === asset.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = src
    audioRef.current.onended = () => setPlayingId(null)
    void audioRef.current.play().catch(() => setError(t('common.playFailed')))
    setPlayingId(asset.id)
  }

  return (
    <AppShell active="assets">
      <div className="drama-page pf-asset-page">
        <header className="pf-drama-list-head">
          <div className="pf-drama-list-title-row">
            <div>
              <h1>{t('drama.assetLibrary.title')}</h1>
              <p className="pf-muted" style={{ margin: '0.35rem 0 0' }}>
                {t('drama.assetLibrary.subtitle')}
              </p>
            </div>
            <div className="pf-drama-list-actions">
              <Button to="/drama" variant="ghost" size="sm">
                {t('nav.drama')}
              </Button>
              <Button to="/history" variant="ghost" size="sm">
                {t('nav.history')}
              </Button>
              <Button to="/settings" variant="ghost" size="sm">
                {t('nav.settings')}
              </Button>
            </div>
          </div>

          <div className="pf-drama-list-toolbar">
            <PillFilter options={[
              { value: 'all', label: t('drama.assetLibrary.tabAll') },
              { value: 'character', label: t('drama.assetLibrary.tabCharacter') },
              { value: 'scene', label: t('drama.assetLibrary.tabScene') },
              { value: 'prop', label: t('drama.assetLibrary.tabProp') },
              ...(DRAMA_VOICE_BINDING_ENABLED ? [{ value: 'voice' as const, label: t('drama.assetLibrary.tabVoice') }] : []),
            ]} value={tab} onChange={(v) => setTab(v as AssetTabKey)} ariaLabel={t('drama.assetLibrary.tabsAria')} />
            <div className="pf-asset-toolbar-filters">
              <FilterSelect
                label={t('drama.assetLibrary.filterByProject')}
                value={projectId}
                options={projectOptions}
                onChange={setProjectId}
              />
              <label className="pf-drama-search">
                <span className="sr-only">{t('drama.assetLibrary.searchSrOnly')}</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('drama.assetLibrary.searchPlaceholder')}
                />
              </label>
            </div>
          </div>
        </header>

        {error ? <BillingErrorNotice message={error} className="drama-error" /> : null}

        <div className="pf-asset-toolbar-meta">
          <p className="pf-muted" style={{ margin: 0 }}>
            {loading
              ? t('common.loading')
              : t('drama.assetLibrary.stats').replace('{total}', String(assets.length)).replace('{filtered}', String(filtered.length)).replace('{page}', String(safePage)).replace('{pageCount}', String(pageCount))}
          </p>
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="pf-empty-state is-compact">
            <p className="pf-muted">{t('drama.assetLibrary.empty')}</p>
          </div>
        ) : (
          <>
            <div className="pf-asset-grid">
              {pageItems.map((asset) => {
                const kind = assetKind(asset)
                const mediaSrc = resolveDramaMediaUrl(asset.cover || (kind === 'voice' ? '' : asset.url))
                const projectLabel =
                  projectNameById.get(asset.project_id) || `${t('drama.assetLibrary.projectPrefix')} #${asset.project_id}`
                const previewUrl = voicePreviewUrl(asset)
                const isVoice = kind === 'voice'
                const playing = playingId === asset.id
                return (
                  <article key={asset.id} className="pf-asset-card">
                    <div className={`pf-asset-thumb is-${kind}`}>
                      {isVoice ? (
                        <button
                          type="button"
                          className={`pf-asset-play${playing ? ' is-playing' : ''}`}
                          onClick={() => toggleVoice(asset)}
                          disabled={!previewUrl}
                          title={previewUrl ? (playing ? t('drama.assetLibrary.stopPreview') : t('drama.assetLibrary.playPreview')) : t('drama.assetLibrary.noVoiceSynth')}
                        >
                          <span className="pf-asset-play-icon" aria-hidden>
                            {playing ? <Pause size={20} strokeWidth={2} /> : <Play size={20} strokeWidth={2} />}
                          </span>
                        </button>
                      ) : mediaSrc && isImageLike(asset) ? (
                        <button
                          type="button"
                          className="pf-asset-thumb-btn"
                          onClick={() =>
                            setLightbox({ src: mediaSrc, alt: asset.name || fileMeta(asset) })
                          }
                          title={t('drama.assetLibrary.viewLarge')}
                        >
                          <img src={mediaSrc} alt={asset.name || ''} />
                        </button>
                      ) : (
                        <span>{fileMeta(asset)}</span>
                      )}
                    </div>
                    <h3>{asset.name || t('common.unnamed')}</h3>
                    <p>
                      {fileMeta(asset)} · {projectLabel}
                    </p>
                    <div className="pf-asset-card-actions">
                      {DRAMA_VOICE_BINDING_ENABLED && previewUrl && !isVoice ? (
                        <CharacterVoicePreviewButton
                          url={previewUrl}
                          label={asset.name || undefined}
                          onError={setError}
                        />
                      ) : isVoice && !previewUrl ? (
                        <span className="pf-muted">{t('drama.assetLibrary.noVoiceSynth')}</span>
                      ) : null}
                      <Button to={`/drama/projects/${asset.project_id}`} variant="ghost" size="sm">
                        {t('drama.assetLibrary.openProject')}
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              onChange={setPage}
              ariaLabel={t('drama.assetLibrary.paginationAria')}
            />
          </>
        )}

        {lightbox ? (
          <DramaImageLightbox
            src={lightbox.src}
            alt={lightbox.alt}
            onClose={() => setLightbox(null)}
          />
        ) : null}
      </div>
    </AppShell>
  )
}
