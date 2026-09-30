/**
 * Tiện ích đa ngôn ngữ cho các thẻ lệnh phân cảnh / kịch bản (Seedance production cues).
 * Hỗ trợ chuyển đổi giữa Tiếng Việt, Tiếng Trung và Tiếng Anh.
 */

export const CUE_PAIRS = {
  bgm: {
    zh: '【BGM：贴合剧情氛围的轻量配乐，情绪随画面起伏；音量低于人声】',
    vi: '【BGM: Nhạc nền nhẹ nhàng phù hợp không khí cốt truyện, cảm xúc biến chuyển theo khung hình; âm lượng nhỏ hơn giọng nói】',
    en: '【BGM: Subtle background music matching the narrative atmosphere, emotions ebbing and flowing with the visuals; volume lower than voice】',
  },
  visual: {
    zh: '【画面·无配音仅环境音】',
    vi: '【Hình ảnh · Không lồng tiếng, chỉ có âm thanh môi trường】',
    en: '【Visual · Ambient sound only, no voiceover】',
  },
  subtitle: {
    zh: '【字幕：底部居中·简体中文·逐句轮换·与口播同步】',
    vi: '【Phụ đề: Căn giữa phía dưới · Tiếng Việt · Luân chuyển từng câu · Đồng bộ lời thoại】',
    en: '【Subtitle: Bottom center · English · Line by line · Synced with speech】',
  },
  dialogue: {
    zh: '【对白·慢速清晰·同步字幕】',
    vi: '【Thoại · Chậm rõ · Đồng bộ phụ đề】',
    en: '【Dialogue · Clear & measured pace · Synced subtitles】',
  },
  narration: {
    zh: '【旁白·慢速清晰·同步字幕】',
    vi: '【Lời dẫn · Chậm rõ · Đồng bộ phụ đề】',
    en: '【Narration · Clear & measured pace · Synced subtitles】',
  },
  innerMonologue: {
    zh: '【内心独白·同步字幕】',
    vi: '【Độc thoại nội tâm · Đồng bộ phụ đề】',
    en: '【Inner monologue · Synced subtitles】',
  },
} as const

/**
 * Kiểm tra xem kịch bản có chứa thẻ lệnh tiếng Trung hay không.
 */
export function hasChineseCues(content: string): boolean {
  if (!content) return false
  return (
    content.includes('【画面·') ||
    content.includes('【对白·') ||
    content.includes('【旁白·') ||
    content.includes('【内心独白') ||
    content.includes('【字幕：') ||
    content.includes('【BGM：') ||
    content.includes('音量低于人声')
  )
}

/**
 * Chuyển đổi các thẻ lệnh sản xuất sang ngôn ngữ mục tiêu (mặc định 'vi').
 */
export function localizeScriptCues(content: string, targetLocale: 'vi' | 'zh' | 'en' = 'vi'): string {
  if (!content) return content
  let text = content

  if (targetLocale === 'vi') {
    // BGM
    text = text.replace(
      /【BGM[：:]\s*(?:贴合剧情氛围的轻量配乐，情绪随画面起伏；音量低于人声|Subtle background music matching the narrative atmosphere[^】]*)】/g,
      CUE_PAIRS.bgm.vi,
    )
    // Visual
    text = text.replace(
      /【(?:画面·无配音仅环境音|Visual · Ambient sound only, no voiceover)】/g,
      CUE_PAIRS.visual.vi,
    )
    // Subtitle
    text = text.replace(
      /【(?:字幕[：:]\s*底部居中·简体中文·逐句轮换·与口播同步|Subtitle[：:]\s*Bottom center[^】]*)】/g,
      CUE_PAIRS.subtitle.vi,
    )
    // Dialogue
    text = text.replace(
      /【(?:对白·慢速清晰·同步字幕|Dialogue · Clear & measured pace · Synced subtitles)】/g,
      CUE_PAIRS.dialogue.vi,
    )
    // Narration
    text = text.replace(
      /【(?:旁白·慢速清晰·同步字幕|Narration · Clear & measured pace · Synced subtitles)】/g,
      CUE_PAIRS.narration.vi,
    )
    // Inner monologue
    text = text.replace(
      /【(?:内心独白·同步字幕|Inner monologue · Synced subtitles)】/g,
      CUE_PAIRS.innerMonologue.vi,
    )
  } else if (targetLocale === 'zh') {
    text = text.replace(
      /【BGM[：:]\s*(?:Nhạc nền nhẹ nhàng phù hợp không khí cốt truyện[^】]*|Subtle background music matching[^】]*)】/g,
      CUE_PAIRS.bgm.zh,
    )
    text = text.replace(
      /【(?:Hình ảnh · Không lồng tiếng[^】]*|Visual · Ambient sound only[^】]*)】/g,
      CUE_PAIRS.visual.zh,
    )
    text = text.replace(
      /【(?:Phụ đề[：:]\s*Căn giữa phía dưới[^】]*|Subtitle[：:]\s*Bottom center[^】]*)】/g,
      CUE_PAIRS.subtitle.zh,
    )
    text = text.replace(
      /【(?:Thoại · Chậm rõ[^】]*|Dialogue · Clear[^】]*)】/g,
      CUE_PAIRS.dialogue.zh,
    )
    text = text.replace(
      /【(?:Lời dẫn · Chậm rõ[^】]*|Narration · Clear[^】]*)】/g,
      CUE_PAIRS.narration.zh,
    )
    text = text.replace(
      /【(?:Độc thoại nội tâm[^】]*|Inner monologue[^】]*)】/g,
      CUE_PAIRS.innerMonologue.zh,
    )
  } else if (targetLocale === 'en') {
    text = text.replace(
      /【BGM[：:]\s*(?:贴合剧情氛围的轻量配乐，情绪随画面起伏；音量低于人声|Nhạc nền nhẹ nhàng phù hợp không khí cốt truyện[^】]*)】/g,
      CUE_PAIRS.bgm.en,
    )
    text = text.replace(
      /【(?:画面·无配音仅环境音|Hình ảnh · Không lồng tiếng[^】]*)】/g,
      CUE_PAIRS.visual.en,
    )
    text = text.replace(
      /【(?:字幕[：:]\s*底部居中·简体中文·逐句轮换·与口播同步|Phụ đề[：:]\s*Căn giữa phía dưới[^】]*)】/g,
      CUE_PAIRS.subtitle.en,
    )
    text = text.replace(
      /【(?:对白·慢速清晰·同步字幕|Thoại · Chậm rõ[^】]*)】/g,
      CUE_PAIRS.dialogue.en,
    )
    text = text.replace(
      /【(?:旁白·慢速清晰·同步字幕|Lời dẫn · Chậm rõ[^】]*)】/g,
      CUE_PAIRS.narration.en,
    )
    text = text.replace(
      /【(?:内心独白·同步字幕|Độc thoại nội tâm[^】]*)】/g,
      CUE_PAIRS.innerMonologue.en,
    )
  }

  return text
}
