/** Mục lục bên trái các tập truyện tranh (được chia sẻ với trang phác thảo/trang tập/trang phân cảnh) */
import type { ReactNode } from 'react'
import type { DramaEpisode } from '../../api/drama'
import { useI18n, type TFunction } from '../../i18n'
import { isDefaultEpisodeTitle } from './dramaWorkspaceUtils'

export type DramaEpisodeDirItem = {
  id: number
  label: string
  title: string
  meta?: string
}

type DramaEpisodeDirProps = {
  title?: string
  items: DramaEpisodeDirItem[]
  activeId: number | null
  onSelect: (id: number) => void
  footer?: ReactNode
  emptyText?: string
}

// Tạo mục nhập thư mục từ danh sách tập (sắp xếp theo số tập; số tập bị thiếu không được ngụy trang thành tập 1)
export function buildEpisodeDirItems(episodes: DramaEpisode[], t?: TFunction): DramaEpisodeDirItem[] {
  const sorted = [...episodes].sort((a, b) => {
    const an = Number(a.params?.episodeNumber) || 0
    const bn = Number(b.params?.episodeNumber) || 0
    if (an !== bn) return an - bn
    return a.id - b.id
  })
  return sorted.map((ep) => {
    const epNo = Number(ep.params?.episodeNumber) || 0
    const fragCount = (ep.fragments || []).length
    const rawName = (ep.name || '').trim()
    const cleanTitle = isDefaultEpisodeTitle(rawName, epNo)
      ? (t ? (epNo >= 1 ? t('drama.episodes.episode', { n: epNo, no: epNo }) : t('drama.episodes.episodeFallback', { id: ep.id })) : `Tập ${epNo || ep.id}`)
      : rawName
    return {
      id: ep.id,
      label: epNo >= 1 ? (t ? t('drama.episodes.episode', { n: epNo, no: epNo }) : `Tập ${epNo}`) : `ID · ${ep.id}`,
      title: cleanTitle,
      meta: fragCount > 0 ? `${fragCount} ${t ? t('drama.episodesStep.shots') : 'phân cảnh'}` : undefined,
    }
  })
}

// Thư mục tập bên trái
export function DramaEpisodeDir({
  title,
  items,
  activeId,
  onSelect,
  footer,
  emptyText,
}: DramaEpisodeDirProps) {
  const { t } = useI18n()
  const displayTitle = title ?? t('drama.outlinePanel.directory')
  const displayEmpty = emptyText ?? t('drama.episodes.noEpisodes')

  return (
    <aside className="drama-episode-dir">
      <div className="drama-episode-dir-head">
        <h3>{displayTitle}</h3>
        {footer}
      </div>
      {items.length === 0 ? (
        <p className="drama-episode-dir-empty">{displayEmpty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={activeId === item.id ? 'active' : ''}
                onClick={() => onSelect(item.id)}
              >
                <span>{item.label}</span>
                <small>
                  {item.title}
                  {item.meta ? ` · ${item.meta}` : ''}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
