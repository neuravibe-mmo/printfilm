import type { Project, Shot } from '../../../api'
import { scenePromptForDisplay } from '../../../promptDisplay'
import { shotDisplayKind, shotDisplayLabel, isRunning } from '../../../lib/status'

export function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadStoryboardCsv(project: Project, t: (key: string) => string): void {
  const header = [
    t('studio.storyboard.csvShotNo'),
    t('studio.storyboard.csvNarr'),
    t('studio.storyboard.csvImage'),
    t('studio.storyboard.csvDurSec'),
    t('studio.storyboard.csvStatus'),
    t('studio.storyboard.csvTitle'),
  ]
  const rows = (project.shots || [])
    .slice()
    .sort((a, b) => a.shot_no - b.shot_no)
    .map((s) =>
      [
        s.shot_no,
        s.narration,
        scenePromptForDisplay(s.img_prompt || s.video_prompt || ''),
        s.duration,
        shotDisplayLabel(shotDisplayKind(s, { pipelineMode: project.pipeline_mode })),
        s.overlay_title || '',
      ]
        .map(csvEscape)
        .join(','),
    )
  const bom = '\uFEFF'
  const blob = new Blob([bom + [header.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${project.title || `project_${project.id}`}_storyboard.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function localizeCueText(text: string, locale?: string): string {
  if (!text) return ''
  if (locale === 'zh') return text
  if (locale === 'en') {
    return text
      .replace(
        '字幕：后期叠旁白字幕，简体中文逐句同步',
        'Subtitles: Post-production voiceover overlay, sentence-by-sentence sync',
      )
      .replace(
        '字幕：底部居中·简体中文·逐句轮换·与口播同步',
        'Subtitles: Bottom center · Synced with voiceover',
      )
      .replace('字幕：底部居中·简体中文', 'Subtitles: Bottom center')
      .replace('后期混音', 'Post-mix')
      .replace(/，?音量低于人声/, ', volume lower than voice')
  }
  return text
    .replace('字幕：后期叠旁白字幕，简体中文逐句同步', 'Phụ đề: Ghép chữ lời dẫn ở hậu kỳ, đồng bộ từng câu')
    .replace('字幕：底部居中·简体中文·逐句轮换·与口播同步', 'Phụ đề: Căn giữa phía dưới · Đồng bộ lời thoại')
    .replace('字幕：底部居中·简体中文', 'Phụ đề: Căn giữa phía dưới')
    .replace('后期混音', 'Hòa âm hậu kỳ')
    .replace(/，?音量低于人声/, ', âm lượng nhỏ hơn giọng nói')
}

export function localizeBeatText(text: string, locale?: string): string {
  if (!text) return ''
  if (locale === 'zh') return text
  if (locale === 'en') {
    return text
      .replace(/^【旁白[·・•\s]*自然语速[·・•\s]*同步字幕】/, '【Voiceover · Natural pace · Synced subtitles】')
      .replace(/^【旁白[·・•\s]*慢速清晰[·・•\s]*同步字幕】/, '【Voiceover · Slow & clear · Synced subtitles】')
      .replace(/^【旁白[·・•\s]*自然语速】/, '【Voiceover · Natural pace】')
      .replace(/^【旁白[·・•\s]*慢速清晰】/, '【Voiceover · Slow & clear】')
      .replace(/^【对白[·・•\s]*慢速清晰[·・•\s]*同步字幕】/, '【Dialogue · Slow & clear · Synced subtitles】')
      .replace(/^【画面[·・•\s]*无配音仅环境音】/, '【Visuals · Ambient sound only】')
      .replace(/^【空镜[·・•\s]*可仅环境音与\s*BGM】/, '【Cutaway · Ambient sound & BGM】')
  }
  return text
    .replace(/^【旁白[·・•\s]*自然语速[·・•\s]*同步字幕】/, '【Lời dẫn · Tốc độ tự nhiên · Phụ đề đồng bộ】')
    .replace(/^【旁白[·・•\s]*慢速清晰[·・•\s]*同步字幕】/, '【Lời dẫn · Chậm rõ · Phụ đề đồng bộ】')
    .replace(/^【旁白[·・•\s]*自然语速】/, '【Lời dẫn · Tốc độ tự nhiên】')
    .replace(/^【旁白[·・•\s]*慢速清晰】/, '【Lời dẫn · Chậm rõ】')
    .replace(/^【对白[·・•\s]*慢速清晰[·・•\s]*同步字幕】/, '【Đối thoại · Chậm rõ · Phụ đề đồng bộ】')
    .replace(/^【画面[·・•\s]*无配音仅环境音】/, '【Hình ảnh · Âm thanh môi trường】')
    .replace(/^【空镜[·・•\s]*可仅环境音与\s*BGM】/, '【Cảnh trống · Âm thanh môi trường & BGM】')
}

export function shotCaption(shot: Shot, t?: (k: string) => string): string {
  if (shot.overlay_title) {
    const label = t ? t('studio.storyboard.narrationLabel') : '旁白'
    return `${shot.overlay_title}${
      shot.overlay_subtitle ? ` · ${shot.overlay_subtitle}` : ''
    }${shot.narration ? `｜${label}：${shot.narration}` : ''}`
  }
  return shot.narration || ''
}

export function hasActiveUnifiedTasks(project: Project | null): boolean {
  const activeStatuses = ['pending', 'leased', 'running', 'awaiting_poll', 'awaiting_review']
  return Boolean(
    project?.active_tasks?.some(
      (task) => !task.cancel_requested && activeStatuses.includes(task.status),
    ),
  )
}

/** Khi có dữ liệu nền tảng tác vụ, active_tasks sẽ chiếm ưu thế; nếu không có nhiệm vụ nào trong COMPOSING, nó sẽ được coi là phần còn lại của lỗi nối và có thể được thử lại. */
export function isProjectBusy(project: Project | null): boolean {
  if (!project) return false
  if (hasActiveUnifiedTasks(project)) return true
  if (Array.isArray(project.active_tasks) && project.active_tasks.length === 0) {
    return false
  }
  return isRunning(project.status)
}
