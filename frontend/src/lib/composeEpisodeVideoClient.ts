/** Ghép nối MP4 của tập này một cách dễ dàng trong trình duyệt; nếu mã hóa không nhất quán, hãy quay lại máy chủ để mã hóa lại thống nhất */

import type { DramaFragment } from '../api/drama'
import { dramaApi, resolveDramaMediaUrl } from '../api/drama'
import { fetchMediaBlob } from './clientDownload'
import { sanitizeMediaBasename } from './canvasNodeMedia'

export type EpisodeComposeClip = {
  id: number
  label: string
  url: string
}

export type EpisodeComposeProgress = {
  phase: 'download' | 'concat' | 'server'
  done: number
  total: number
}

/** Thu thập các địa chỉ video có thể ghép nối theo trình tự. */
export function listEpisodeComposeClips(fragments: DramaFragment[]): EpisodeComposeClip[] {
  const clips: EpisodeComposeClip[] = []
  fragments.forEach((fragment, index) => {
    const url = resolveDramaMediaUrl(fragment.video)
    if (!url || fragment.id == null) return
    clips.push({
      id: fragment.id,
      label: `分镜${index + 1}`,
      url,
    })
  })
  return clips
}

/** Tên file tải phim đầy đủ */
export function episodeComposeFilename(episodeName: string) {
  return `${sanitizeMediaBasename(episodeName || '本集')}_全片.mp4`
}

/** Máy chủ mã hóa lại, ghép nối và kéo lại blob một cách thống nhất */
async function composeEpisodeVideoServer(
  episodeId: number,
  clips: EpisodeComposeClip[],
  onProgress?: (progress: EpisodeComposeProgress) => void,
): Promise<Blob> {
  onProgress?.({ phase: 'server', done: 0, total: clips.length })
  const result = await dramaApi.composeEpisode(
    episodeId,
    clips.map((c) => c.id),
  )
  const url = resolveDramaMediaUrl(result.video_url)
  if (!url) throw new Error('服务端合成未返回可下载地址')
  const blob = await fetchMediaBlob(url)
  onProgress?.({ phase: 'server', done: clips.length, total: clips.length })
  return blob
}

/** Kéo từng gương và lắp ráp cục bộ thành MP4; nếu không bị mất thì nó sẽ tự động về máy chủ. */
export async function composeEpisodeVideoClient(
  clips: EpisodeComposeClip[],
  onProgress?: (progress: EpisodeComposeProgress) => void,
  options?: { episodeId?: number },
): Promise<Blob> {
  if (clips.length === 0) {
    throw new Error('本集还没有可拼接的分镜视频')
  }

  const buffers: Uint8Array[] = new Array(clips.length)
  let downloaded = 0
  await Promise.all(
    clips.map(async (clip, index) => {
      const blob = await fetchMediaBlob(clip.url)
      buffers[index] = new Uint8Array(await blob.arrayBuffer())
      downloaded += 1
      onProgress?.({ phase: 'download', done: downloaded, total: clips.length })
    }),
  )

  if (clips.length === 1) {
    const single = buffers[0]
    return new Blob([copyToArrayBuffer(single)], { type: 'video/mp4' })
  }

  onProgress?.({ phase: 'concat', done: 0, total: clips.length })
  const { concatMp4, isMp4, mp4Compat } = await import('mp4cat')
  const names = clips.map((clip) => clip.label)
  for (let i = 0; i < buffers.length; i++) {
    if (!isMp4(buffers[i])) {
      throw new Error(`${names[i]} 不是可拼接的 MP4`)
    }
  }
  const compat = mp4Compat(buffers, { names })
  if (!compat.ok) {
    const episodeId = options?.episodeId
    if (episodeId != null && episodeId > 0) {
      // Seedance HEVC SPS/PPS của mỗi máy nhân bản thường không nhất quán, máy chủ có thể mã hóa lại một cách thống nhất
      return composeEpisodeVideoServer(episodeId, clips, onProgress)
    }
    throw new Error(
      `各镜编码不一致，无法在浏览器里无损拼接。请用同一模型、比例和清晰度生成后再试。${
        compat.reason ? `（${compat.reason}）` : ''
      }`,
    )
  }
  const merged = concatMp4(buffers)
  onProgress?.({ phase: 'concat', done: clips.length, total: clips.length })
  return new Blob([copyToArrayBuffer(merged)], { type: 'video/mp4' })
}

// Sao chép nó vào một ArrayBuffer độc lập để ngăn chế độ xem Uint8Array bị sử dụng làm BlobPart trong TS
function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copy).set(bytes)
  return copy
}
