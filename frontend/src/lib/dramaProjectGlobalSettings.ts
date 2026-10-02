/** Đọc cài đặt sản xuất toàn cầu của dự án: thông số dự án được ưu tiên và sau đó khôi phục giá trị lịch sử tập */
import {
  readEpisodeCharacterIntroMode,
  type DramaCharacterIntroMode,
} from './dramaCharacterIntro'
import { readEpisodeSubtitleMode, type DramaSubtitleMode } from './dramaSubtitleBoard'

/** Phương pháp phụ đề hiệu quả: ưu tiên toàn cầu của dự án, sau đó quay lại giá trị lịch sử tập */
export function readEffectiveSubtitleMode(
  episodeParams?: Record<string, unknown> | null,
  projectParams?: Record<string, unknown> | null,
): DramaSubtitleMode {
  const fromProject = projectParams?.subtitleMode
  if (fromProject === 'model' || fromProject === 'post') return fromProject
  return readEpisodeSubtitleMode(episodeParams)
}

/** Giới thiệu nhân vật hiệu quả: Ưu tiên dự án tổng thể, sau đó quay lại giá trị lịch sử của tập phim */
export function readEffectiveCharacterIntroMode(
  episodeParams?: Record<string, unknown> | null,
  projectParams?: Record<string, unknown> | null,
): DramaCharacterIntroMode {
  const fromProject = projectParams?.characterIntroMode
  if (fromProject === 'model' || fromProject === 'off') return fromProject
  return readEpisodeCharacterIntroMode(episodeParams)
}
