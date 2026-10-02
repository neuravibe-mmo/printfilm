/** Chỉnh sửa tập: trình phát video có thanh tiến trình bảng phân cảnh (phát sóng tuần tự phía máy khách) */
import { Download, Maximize, Minimize, MonitorPlay, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { resolveDramaMediaUrl, type DramaFragment } from '../../api/drama'
import {
  buildEpisodeVideoTimelineSegments,
  formatVideoTimelineClock,
  resolveEpisodeTimelineSegmentFillRatio,
  resolveEpisodeVideoTimelineTotalDuration,
  resolveFragmentPlaybackFromGlobalTime,
  resolveGlobalTimeFromFragmentPlayback,
  resolveNextPlayableFragmentId,
  resolveVideoTimelineSeekTime,
  type DramaEpisodeVideoTimelineSegment,
} from '../../lib/dramaEpisodeVideoTimeline'

type Props = {
  fragments: DramaFragment[]
  playingFragmentId: number | null
  onPlayingFragmentChange: (fragmentId: number) => void
  aspectRatio: string
  /** Ghi đè địa chỉ video nhân bản hiện tại khi xem trước các phiên bản lịch sử */
  overrideVideoUrl?: string | null
  overridePosterUrl?: string | null
}

// Kết xuất trình phát video với thanh tiến trình phân đoạn bảng phân cảnh
export function DramaFragmentSegmentedVideoPlayer({
  fragments,
  playingFragmentId,
  onPlayingFragmentChange,
  aspectRatio,
  overrideVideoUrl = null,
  overridePosterUrl = null,
}: Props) {
  const { t } = useI18n()
  // tham chiếu phần tử video videoRef
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // screenRef vùng chứa màn hình xem trước (mục tiêu toàn màn hình)
  const screenRef = useRef<HTMLDivElement | null>(null)
  // trackRef tham chiếu vùng chứa thanh tiến trình được phân đoạn
  const trackRef = useRef<HTMLDivElement | null>(null)
  // đang tìm kiếm Thanh tiến trình có đang được kéo hay không
  const isSeekingRef = useRef(false)
  // autoLinkNextRef Có tự động kết nối với phân đoạn tiếp theo hay không
  const autoLinkNextRef = useRef(true)
  // playFragmentIdRef ID đoạn phát hiện tại
  const playingFragmentIdRef = useRef(playingFragmentId)
  // dòng thời gianSegmentsRef bộ đệm phân đoạn dòng thời gian
  const timelineSegmentsRef = useRef(buildEpisodeVideoTimelineSegments(fragments))
  // nênResumePlayRef Có nên tiếp tục chơi sau khi chuyển bảng phân cảnh hay không
  const shouldResumePlayRef = useRef(false)
  // đang chờ xử lýSeekTimeRef Giờ địa phương sẽ được nhảy sau khi chuyển bảng phân cảnh
  const pendingSeekTimeRef = useRef<number | null>(null)
  // autoPlayAttemptedRef Video hiện tại đã cố gắng phát tự động hay chưa
  const autoPlayAttemptedRef = useRef(false)
  // playSegmentRef phần phát hiện tại (để đọc lệnh gọi lại sự kiện, để tránh các đoạn làm mới thăm dò liên kết lại các sự kiện)
  const playingSegmentRef = useRef<DramaEpisodeVideoTimelineSegment | null>(null)
  // prevPlayingFragmentIdRef Công tắc chuyển đổi bảng phân cảnh được xử lý cuối cùng
  const prevPlayingFragmentIdRef = useRef<number | null>(playingFragmentId)
  // đang phát Có đang phát hay không
  const [isPlaying, setIsPlaying] = useState(false)
  // GlobalCurrentTime vị trí hiện tại của dòng thời gian toàn cầu (giây)
  const [globalCurrentTime, setGlobalCurrentTime] = useState(0)
  // autoLinkNext tự động phát đoạn tiếp theo sau khi phát đoạn hiện tại.
  const [autoLinkNext, setAutoLinkNext] = useState(true)
  // bị tắt tiếng Có tắt tiếng hay không
  const [muted, setMuted] = useState(false)
  // isFullscreen Liệu bản xem trước có ở chế độ toàn màn hình hay không
  const [isFullscreen, setIsFullscreen] = useState(false)

  playingFragmentIdRef.current = playingFragmentId
  autoLinkNextRef.current = autoLinkNext

  // dòng thời gianPhân đoạn Tất cả các phân đoạn dòng thời gian của các tập
  const timelineSegments = useMemo(
    () => buildEpisodeVideoTimelineSegments(fragments),
    [fragments],
  )

  timelineSegmentsRef.current = timelineSegments

  // tổng thời lượng Tổng thời lượng của dòng thời gian của tập
  const totalDuration = useMemo(
    () => resolveEpisodeVideoTimelineTotalDuration(timelineSegments),
    [timelineSegments],
  )

  // đang phát Đoạn đoạn đang phát
  const playingFragment = useMemo(
    () => fragments.find((fragment) => fragment.id === playingFragmentId) ?? null,
    [fragments, playingFragmentId],
  )

  // playSegment Khoảng thời gian trên dòng thời gian của bảng phân cảnh phát lại hiện tại
  const playingSegment = useMemo(
    () => timelineSegments.find((segment) => segment.fragmentId === playingFragmentId) ?? null,
    [playingFragmentId, timelineSegments],
  )

  playingSegmentRef.current = playingSegment

  // videoUrl địa chỉ video bảng phân cảnh hiện tại (có thể được ghi đè bằng bản xem trước phiên bản lịch sử)
  const videoUrl =
    overrideVideoUrl ||
    (playingFragment?.video ? resolveDramaMediaUrl(playingFragment.video) : null)
  // posterUrl địa chỉ bìa bảng phân cảnh hiện tại
  const posterUrl =
    overridePosterUrl ||
    (playingFragment?.cover ? resolveDramaMediaUrl(playingFragment.cover) : null)
  // hasCurrentVideo Liệu có thể phát bảng phân cảnh hiện tại hay không
  const hasCurrentVideo = Boolean(videoUrl)
  // hasAnyVideo Có video phân cảnh hay không
  const hasAnyVideo = timelineSegments.some((segment) => segment.hasVideo)

  // rateClass Frame Tên lớp CSS
  const ratioClass = `ratio-${aspectRatio.replace(':', 'x')}`

  // Chuyển phát hoặc tạm dừng
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current

    if (!video || !hasCurrentVideo) {
      return
    }

    if (video.paused) {
      void video.play().catch(() => undefined)
      return
    }

    video.pause()
  }, [hasCurrentVideo])

  // Chuyển đến vị trí dòng thời gian toàn cầu
  const seekToGlobalTime = useCallback(
    (globalTimeSec: number) => {
      const playback = resolveFragmentPlaybackFromGlobalTime(timelineSegments, globalTimeSec)

      if (!playback) {
        return
      }

      setGlobalCurrentTime(
        resolveGlobalTimeFromFragmentPlayback(
          playback.segment,
          playback.localTimeSec,
          playback.segment.durationSec,
        ),
      )

      if (playback.segment.fragmentId !== playingFragmentIdRef.current) {
        pendingSeekTimeRef.current = playback.localTimeSec
        shouldResumePlayRef.current = isPlaying
        onPlayingFragmentChange(playback.segment.fragmentId)
        return
      }

      const video = videoRef.current

      if (video && hasCurrentVideo) {
        video.currentTime = playback.localTimeSec
      }
    },
    [hasCurrentVideo, isPlaying, onPlayingFragmentChange, timelineSegments],
  )

  // Chuyển tới tiến trình phát lại dựa trên vị trí nhấp chuột
  const seekByClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current

      if (!track || totalDuration <= 0) {
        return
      }

      const rect = track.getBoundingClientRect()
      const ratio = (clientX - rect.left) / rect.width
      const nextGlobalTime = resolveVideoTimelineSeekTime(ratio, totalDuration)

      seekToGlobalTime(nextGlobalTime)
    },
    [seekToGlobalTime, totalDuration],
  )

  // Liên kết sự kiện video (chỉ đặt lại khi địa chỉ video hiện tại thay đổi)
  useEffect(() => {
    const video = videoRef.current

    if (!video || !videoUrl) {
      return
    }

    autoPlayAttemptedRef.current = false

    const tryAutoPlay = () => {
      if (autoPlayAttemptedRef.current) {
        return
      }

      autoPlayAttemptedRef.current = true

      if (shouldResumePlayRef.current) {
        void video.play().catch(() => undefined)
        shouldResumePlayRef.current = false
      }
    }

    const handleLoadedMetadata = () => {
      if (pendingSeekTimeRef.current !== null) {
        video.currentTime = pendingSeekTimeRef.current
        pendingSeekTimeRef.current = null
      }
    }

    const handleDurationChange = () => {
      if (pendingSeekTimeRef.current !== null) {
        video.currentTime = pendingSeekTimeRef.current
        pendingSeekTimeRef.current = null
      }
    }

    const handleCanPlay = () => {
      if (pendingSeekTimeRef.current !== null) {
        video.currentTime = pendingSeekTimeRef.current
        pendingSeekTimeRef.current = null
      }

      tryAutoPlay()
    }

    const handleTimeUpdate = () => {
      const segment = playingSegmentRef.current

      if (isSeekingRef.current || !segment) {
        return
      }

      const nextGlobalTime = resolveGlobalTimeFromFragmentPlayback(
        segment,
        video.currentTime,
        Number.isFinite(video.duration) ? video.duration : segment.durationSec,
      )

      setGlobalCurrentTime(nextGlobalTime)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      if (!autoLinkNextRef.current) {
        setIsPlaying(false)
        return
      }

      const nextFragmentId = resolveNextPlayableFragmentId(
        timelineSegmentsRef.current,
        playingFragmentIdRef.current ?? 0,
      )

      if (!nextFragmentId) {
        setIsPlaying(false)
        return
      }

      shouldResumePlayRef.current = true
      onPlayingFragmentChange(nextFragmentId)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      tryAutoPlay()
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onPlayingFragmentChange, videoUrl])

  // Chỉ đặt lại về điểm bắt đầu của bảng phân cảnh khi người dùng chuyển bảng phân cảnh (việc tạo các đoạn làm mới thăm dò không được làm gián đoạn quá trình phát lại)
  useEffect(() => {
    if (playingFragmentId === prevPlayingFragmentIdRef.current) {
      return
    }

    prevPlayingFragmentIdRef.current = playingFragmentId

    if (!playingSegment) {
      setGlobalCurrentTime(0)
      return
    }

    if (shouldResumePlayRef.current || pendingSeekTimeRef.current !== null) {
      return
    }

    setGlobalCurrentTime(playingSegment.startSec)

    const video = videoRef.current

    if (video && videoUrl) {
      video.pause()
      video.currentTime = 0
      setIsPlaying(false)
    }
  }, [playingFragmentId, playingSegment, videoUrl])

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    video.muted = muted
  }, [muted])

  // Đồng bộ trạng thái toàn màn hình trình duyệt
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === screenRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Chuyển màn hình xem trước sang toàn màn hình
  const handleToggleFullscreen = useCallback(async () => {
    const screen = screenRef.current

    if (!screen || !hasCurrentVideo) {
      return
    }

    try {
      if (document.fullscreenElement === screen) {
        await document.exitFullscreen()
        return
      }

      await screen.requestFullscreen()
    } catch {
      /* Trình duyệt có thể từ chối toàn màn hình */
    }
  }, [hasCurrentVideo])

  // Tải xuống video cốt truyện hiện tại
  const handleDownloadVideo = useCallback(() => {
    if (!videoUrl) {
      return
    }

    const link = document.createElement('a')

    link.href = videoUrl
    link.download = ''
    link.rel = 'noopener noreferrer'
    link.target = '_blank'
    link.click()
  }, [videoUrl])

  // playheadLeft Chơi phần trăm vị trí ngang của con trỏ
  const playheadLeft = totalDuration > 0 ? (globalCurrentTime / totalDuration) * 100 : 0

  return (
    <div className="drama-ep-segmented-player">
      <div
        ref={screenRef}
        className={`drama-ep-player drama-ep-segmented-screen ${ratioClass}${
          !hasCurrentVideo ? ' is-empty' : ''
        }${isFullscreen ? ' is-fullscreen' : ''}`}
      >
        {hasCurrentVideo ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl ?? undefined}
              poster={posterUrl ?? undefined}
              playsInline
              preload="auto"
            />
            <div className="drama-ep-video-overlay-actions">
              <button
                type="button"
                aria-label={isFullscreen ? t('drama.player.exitFullscreen') : t('drama.player.fullscreen')}
                className="drama-ep-video-overlay-btn"
                onClick={() => void handleToggleFullscreen()}
              >
                {isFullscreen ? (
                  <Minimize size={16} strokeWidth={1.8} />
                ) : (
                  <Maximize size={16} strokeWidth={1.8} />
                )}
              </button>
              <button
                type="button"
                aria-label={t('drama.player.downloadVideo')}
                className="drama-ep-video-overlay-btn"
                onClick={handleDownloadVideo}
              >
                <Download size={16} strokeWidth={1.8} />
              </button>
            </div>
          </>
        ) : posterUrl ? (
          <img src={posterUrl} alt={t('drama.player.shotPreview')} />
        ) : (
          <div className="drama-ep-player-placeholder">
            <span>{t('drama.player.videoPending')}</span>
          </div>
        )}
      </div>

      <div className="drama-ep-video-controls">
        <p className="drama-ep-video-clock">
          {formatVideoTimelineClock(globalCurrentTime)} / {formatVideoTimelineClock(totalDuration)}
        </p>

        <div className="drama-ep-video-toolbar">
          <button
            type="button"
            aria-label={isPlaying ? t('drama.player.pause') : t('drama.player.play')}
            disabled={!hasCurrentVideo}
            className="drama-ep-video-icon-btn"
            onClick={handleTogglePlay}
          >
            {isPlaying ? (
              <Pause size={16} strokeWidth={2} />
            ) : (
              <Play size={16} strokeWidth={2} />
            )}
          </button>

          <div
            ref={trackRef}
            className={`drama-ep-video-track${totalDuration <= 0 ? ' is-disabled' : ''}`}
            onPointerDown={(event) => {
              if (totalDuration <= 0) {
                return
              }

              isSeekingRef.current = true
              seekByClientX(event.clientX)
            }}
            onPointerMove={(event) => {
              if (totalDuration <= 0 || !isSeekingRef.current) {
                return
              }

              seekByClientX(event.clientX)
            }}
            onPointerUp={() => {
              isSeekingRef.current = false
            }}
            onPointerLeave={() => {
              isSeekingRef.current = false
            }}
          >
            {timelineSegments.map((segment, index) => (
              <div
                key={segment.fragmentId}
                className={`drama-ep-video-track-seg${
                  index < timelineSegments.length - 1 ? ' has-divider' : ''
                }`}
                style={{ flex: segment.durationSec }}
              >
                <div
                  className="drama-ep-video-track-fill"
                  style={{
                    width: `${resolveEpisodeTimelineSegmentFillRatio(segment, globalCurrentTime) * 100}%`,
                  }}
                />
              </div>
            ))}

            <div className="drama-ep-video-playhead" style={{ left: `${playheadLeft}%` }} />
          </div>

          <button
            type="button"
            aria-label={autoLinkNext ? t('drama.player.autoLinkOn') : t('drama.player.autoLinkOff')}
            title={
              autoLinkNext ? t('drama.player.autoLinkOnDesc') : t('drama.player.autoLinkOffDesc')
            }
            disabled={!hasAnyVideo}
            className={`drama-ep-video-autolink${autoLinkNext ? ' is-on' : ''}`}
            onClick={() => setAutoLinkNext((value) => !value)}
          >
            <MonitorPlay size={16} strokeWidth={1.8} />
            <span className="drama-ep-video-autolink-bar" />
          </button>

          <button
            type="button"
            aria-label={muted ? t('drama.player.unmute') : t('drama.player.mute')}
            disabled={!hasCurrentVideo}
            className="drama-ep-video-icon-btn is-muted"
            onClick={() => setMuted((value) => !value)}
          >
            {muted ? (
              <VolumeX size={16} strokeWidth={1.8} />
            ) : (
              <Volume2 size={16} strokeWidth={1.8} />
            )}
          </button>

          <button
            type="button"
            aria-label={isFullscreen ? t('drama.player.exitFullscreen') : t('drama.player.fullscreen')}
            title={isFullscreen ? t('drama.player.exitFullscreen') : t('drama.player.fullscreen')}
            disabled={!hasCurrentVideo}
            className="drama-ep-video-icon-btn"
            onClick={() => void handleToggleFullscreen()}
          >
            {isFullscreen ? (
              <Minimize size={16} strokeWidth={1.8} />
            ) : (
              <Maximize size={16} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
