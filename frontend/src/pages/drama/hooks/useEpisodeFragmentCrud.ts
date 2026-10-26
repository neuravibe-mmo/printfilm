import { dramaApi, type DramaEpisode, type DramaFragment } from '../../../api/drama'
import { resolveFragmentDurationSec } from '../dramaEpisodeEditUtils'
import { useI18n } from '../../../i18n'

export type UseEpisodeFragmentCrudParams = {
  pid: number
  eid: number
  epNumber: number
  fragments: DramaFragment[]
  selectedIndex: number
  setFragments: React.Dispatch<React.SetStateAction<DramaFragment[]>>
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
  setEditing: (v: boolean) => void
  setBusy: (v: boolean) => void
  setStatus: (v: string) => void
  setError: (v: string) => void
  setEpisode: (ep: DramaEpisode) => void
  reload: () => Promise<void>
}

export function useEpisodeFragmentCrud({
  pid,
  eid,
  epNumber,
  fragments,
  selectedIndex,
  setFragments,
  setSelectedIndex,
  setEditing,
  setBusy,
  setStatus,
  setError,
  setEpisode,
  reload,
}: UseEpisodeFragmentCrudParams) {
  const { t } = useI18n()

  // Cập nhật bảng phân cảnh hiện tại
  function updateSelected(patch: Partial<DramaFragment>) {
    setFragments((prev) =>
      prev.map((f, i) => (i === selectedIndex ? { ...f, ...patch } : f)),
    )
  }

  // Chèn bảng phân cảnh trống
  function insertFrag(at: number) {
    setFragments((prev) => {
      const next = [...prev]
      next.splice(at, 0, {
        id: 0,
        episode_id: eid,
        sort_order: at,
        content: '',
        cover: '',
        video: '',
        duration_sec: 8,
        asset_ids: [],
      })
      return next
    })
    setSelectedIndex(at)
    setEditing(true)
  }

  // Sao chép bảng phân cảnh
  function duplicateFrag(index: number) {
    const source = fragments[index]
    if (!source) return
    setFragments((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, {
        ...source,
        id: 0,
        sort_order: index + 1,
      })
      return next
    })
    setSelectedIndex(index + 1)
  }

  // Xóa bảng phân cảnh
  function deleteFrag(index: number) {
    if (fragments.length <= 1) return
    setFragments((prev) => prev.filter((_, i) => i !== index))
    setSelectedIndex((cur) => {
      if (cur === index) return Math.max(0, index - 1)
      if (cur > index) return cur - 1
      return cur
    })
  }

  // Lưu tất cả các cảnh quay (được cập nhật bằng ID để tránh làm gián đoạn quá trình tạo trong quá trình mỗi khi ID được xây dựng lại; đánh dấu user_edited để ngăn việc tự động cắt lại và ghi đè)
  async function save() {
    setBusy(true)
    setError('')
    try {
      const ep = await dramaApi.saveFragments(
        eid,
        fragments.map((f, i) => {
          const prevParams =
            f.params && typeof f.params === 'object' && !Array.isArray(f.params)
              ? (f.params as Record<string, unknown>)
              : {}
          return {
            id: typeof f.id === 'number' && f.id > 0 ? f.id : undefined,
            sort_order: i,
            content: f.content,
            cover: f.cover,
            video: f.video,
            duration_sec: resolveFragmentDurationSec(f.content, f.duration_sec),
            params: { ...prevParams, user_edited: true },
            asset_ids: f.asset_ids || [],
          }
        }),
      )
      setEpisode(ep)
      setFragments(ep.fragments || [])
      setStatus(t('drama.episodeEdit.saved'))
      setEditing(false)
      return ep
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.episodeEdit.saveFailed'))
      throw err
    } finally {
      setBusy(false)
    }
  }

  // Cắt phân cảnh tự động từ kịch bản của tập
  async function handleSeedFromScript() {
    if (!epNumber || !pid) return
    setBusy(true)
    setStatus(t('drama.episodeEdit.seedingFromScript'))
    setError('')
    try {
      await dramaApi.confirmEpisodeFromScript({
        project_id: pid,
        episode_number: epNumber,
      })
      await reload()
      setStatus(t('drama.episodeEdit.seedSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('drama.outlinePanel.enterFailed'))
    } finally {
      setBusy(false)
    }
  }

  return {
    updateSelected,
    insertFrag,
    duplicateFrag,
    deleteFrag,
    save,
    handleSeedFromScript,
  }
}
