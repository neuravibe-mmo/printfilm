/**
 * Tiện ích đa ngôn ngữ cho các thẻ lệnh phân cảnh / kịch bản (Seedance production cues).
 * Hỗ trợ chuyển đổi giữa Tiếng Việt, Tiếng Trung và Tiếng Anh.
 */

export const CUE_PAIRS = {
  bgm: {
    zh: '【BGM：贴合剧情氛围的轻量配乐，情绪随画面起伏；音量低于人声】',
    vi: '【Nhạc nền: Nhạc nền nhẹ nhàng phù hợp không khí cốt truyện, cảm xúc biến chuyển theo khung hình; âm lượng nhỏ hơn giọng nói】',
    en: '【Background Music: Subtle background music matching the narrative atmosphere, emotions ebbing and flowing with the visuals; volume lower than voice】',
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
  characterIntro: {
    zh: '【人物介绍·画面叠字·角色身旁】',
    vi: '【Giới thiệu nhân vật · Chữ trên hình · Bên cạnh nhân vật】',
    en: '【Character intro · Overlay text · Beside character】',
  },
  emptyShot: {
    zh: '【空镜·可仅环境音与 BGM】',
    vi: '【Cảnh trống · Chỉ âm thanh môi trường & BGM】',
    en: '【Empty shot · Ambient sound & BGM】',
  },
} as const

/**
 * Kiểm tra xem kịch bản có chứa thẻ lệnh tiếng Trung hay không.
 */
export function hasChineseCues(content: string): boolean {
  if (!content) return false
  return (
    content.includes('【画面') ||
    content.includes('【对白') ||
    content.includes('【旁白') ||
    content.includes('【内心独白') ||
    content.includes('【字幕') ||
    content.includes('【片头') ||
    content.includes('【背景交代') ||
    content.includes('【背景介绍') ||
    content.includes('【人物介绍') ||
    content.includes('【空镜') ||
    content.includes('【配乐') ||
    content.includes('【强制约束') ||
    content.includes('画面叠字') ||
    content.includes('角色身旁') ||
    content.includes('音量低于人声')
  )
}

/**
 * Kiểm tra xem kịch bản có chứa thẻ lệnh chưa được bản địa hóa hay không.
 */
export function hasNonLocalizedCues(content: string, targetLocale: 'vi' | 'zh' | 'en' = 'vi'): boolean {
  if (!content) return false
  if (targetLocale === 'vi') {
    return (
      hasChineseCues(content) ||
      content.includes('【BGM') ||
      content.includes('【Background Music')
    )
  }
  if (targetLocale === 'en') {
    return (
      hasChineseCues(content) ||
      content.includes('【BGM') ||
      content.includes('【Nhạc nền')
    )
  }
  return content.includes('【Nhạc nền') || content.includes('【Background Music')
}

/**
 * Chuyển đổi các thẻ lệnh sản xuất sang ngôn ngữ mục tiêu (mặc định 'vi').
 */
export function localizeScriptCues(
  content: string,
  targetLocale: 'vi' | 'zh' | 'en' = 'vi',
  videoLanguage?: string
): string {
  if (!content) return content
  let text = content

  if (targetLocale === 'vi') {
    const isViVoice = videoLanguage ? videoLanguage !== 'auto' : true
    const dialogueCue = isViVoice ? '【Thoại · Lồng tiếng tiếng Việt】' : '【Thoại · Chậm rõ · Đồng bộ phụ đề】'
    const shortDialogueCue = isViVoice ? '【Thoại · Lồng tiếng tiếng Việt】' : '【Thoại · Chậm rõ】'

    // BGM / Background Music -> Nhạc nền
    text = text.replace(
      /【(?:BGM|Background Music|Nhạc nền)[：:]\s*(?:贴合剧情氛围的轻量配乐，情绪随画面起伏；音量低于人声|Subtle background music matching the narrative atmosphere[^】]*)】/g,
      CUE_PAIRS.bgm.vi,
    )
    text = text.replace(/【(?:BGM|Background Music|配乐)[：:]\s*([^】]*)】/g, '【Nhạc nền: $1】')
    text = text.replace(/【配乐】/g, '【Nhạc nền】')
    text = text.replace(/[；;]\s*音量低于人声/g, '; âm lượng nhỏ hơn giọng nói')
    text = text.replace(/音量低于人声/g, 'âm lượng nhỏ hơn giọng nói')

    // Visual
    text = text.replace(
      /【(?:画面·无配音仅环境音|Visual · Ambient sound only, no voiceover)】/g,
      CUE_PAIRS.visual.vi,
    )
    text = text.replace(/【画面(?:·|:|\s*)([^】]*)】/g, '【Hình ảnh · $1】')
    text = text.replace(/【画面】/g, '【Hình ảnh】')

    // Subtitle
    text = text.replace(
      /【(?:字幕[：:]\s*底部居中·简体中文·逐句轮换·与口播同步|Subtitle[：:]\s*Bottom center[^】]*)】/g,
      CUE_PAIRS.subtitle.vi,
    )
    text = text.replace(/【字幕[：:][^】]*】/g, CUE_PAIRS.subtitle.vi)

    // Dialogue
    text = text.replace(
      /【(?:对白·(?:慢速清晰|自然语速)·同步字幕|Dialogue · [^】]*Synced subtitles)】/g,
      dialogueCue,
    )
    text = text.replace(
      /【(?:对白·(?:慢速清晰|自然语速)|Dialogue · Clear[^】]*)】/g,
      shortDialogueCue,
    )
    if (isViVoice) {
      text = text.replace(
        /【(?:Thoại · Chậm rõ · Đồng bộ phụ đề|Thoại · Chậm rõ|Thoại|Đối thoại|对白|Dialogue)(?:[·:：\s][^】]*)?】/g,
        '【Thoại · Lồng tiếng tiếng Việt】',
      )
    } else {
      text = text.replace(/【(?:对白|Dialogue)(?:·|:|\s*)([^】]*)】/g, '【Thoại · $1】')
      text = text.replace(/【(?:对白|Dialogue)】/g, '【Thoại】')
    }

    // Narration
    text = text.replace(
      /【(?:旁白·(?:慢速清晰|自然语速)·同步字幕|Narration · [^】]*Synced subtitles)】/g,
      '【Lời dẫn · Chậm rõ · Đồng bộ phụ đề】',
    )
    text = text.replace(
      /【(?:旁白·(?:慢速清晰|自然语速)|Narration · Clear[^】]*)】/g,
      '【Lời dẫn · Chậm rõ】',
    )
    text = text.replace(/【(?:旁白|Narration)(?:·|:|\s*)([^】]*)】/g, '【Lời dẫn · $1】')
    text = text.replace(/【(?:旁白|Narration)】/g, '【Lời dẫn】')

    // Inner monologue
    text = text.replace(
      /【(?:内心独白·同步字幕|Inner monologue · Synced subtitles)】/g,
      '【Độc thoại nội tâm · Đồng bộ phụ đề】',
    )
    text = text.replace(/【(?:内心独白|Inner monologue)(?:·|:|\s*)([^】]*)】/g, '【Độc thoại nội tâm · $1】')
    text = text.replace(/【(?:内心独白|Inner monologue)】/g, '【Độc thoại nội tâm】')

    // Production cues
    text = text.replace(/【片头·集数】/g, '【Đầu phim · Chữ số tập】')
    text = text.replace(/【片头·片名】/g, '【Đầu phim · Chữ tên phim】')
    text = text.replace(/【片头·类型】/g, '【Đầu phim · Thể loại】')
    text = text.replace(/【片头(?:·|:|\s*)([^】]*)】/g, '【Đầu phim · $1】')
    text = text.replace(/【(?:背景交代|背景介绍)·画面叠字】/g, '【Giới thiệu bối cảnh · Chữ trên hình】')
    text = text.replace(/【(?:背景交代|背景介绍)(?:·|:|\s*)([^】]*)】/g, '【Giới thiệu bối cảnh · $1】')
    text = text.replace(/【(?:背景交代|背景介绍)】/g, '【Giới thiệu bối cảnh】')

    // Character intro cues (hỗ trợ cả ·角色身旁 và các biến thể)
    text = text.replace(
      /【(?:人物介绍·画面叠字·角色身旁|Character intro · Overlay text · Beside character)】/g,
      CUE_PAIRS.characterIntro.vi,
    )
    text = text.replace(
      /【人物介绍·画面叠字】/g,
      '【Giới thiệu nhân vật · Chữ trên hình】',
    )
    text = text.replace(
      /【人物介绍·角色身旁】/g,
      '【Giới thiệu nhân vật · Bên cạnh nhân vật】',
    )
    text = text.replace(/【人物介绍(?:·|:|\s*)([^】]*)】/g, (_, rest) => {
      const cleanRest = (rest || '')
        .replace(/画面叠字/g, 'Chữ trên hình')
        .replace(/角色身旁/g, 'Bên cạnh nhân vật')
        .trim()
      return cleanRest ? `【Giới thiệu nhân vật · ${cleanRest}】` : '【Giới thiệu nhân vật】'
    })
    text = text.replace(/【人物介绍】/g, '【Giới thiệu nhân vật】')
    text = text.replace(/【Giới thiệu nhân vật([^】]*)】/g, (_, rest) => {
      const cleanRest = rest
        .replace(/画面叠字/g, 'Chữ trên hình')
        .replace(/角色身旁/g, 'Bên cạnh nhân vật')
      return `【Giới thiệu nhân vật${cleanRest}】`
    })

    // Empty shot
    text = text.replace(
      /【(?:空镜·可仅环境音与\s*BGM|Empty shot · Ambient sound & BGM[^】]*)】/g,
      CUE_PAIRS.emptyShot.vi,
    )
    text = text.replace(
      /【(?:空镜|Empty shot)(?:·|:|\s*)([^】]*)】/g,
      '【Cảnh trống · $1】',
    )
    text = text.replace(/【强制约束[：:][^】]*】/g, '【Ràng buộc bắt buộc: Âm thanh, Phụ đề và Nhạc nền】')
    text = text.replace(/【强制约束】/g, '【Ràng buộc bắt buộc】')
    text = text.replace(/画面叠字/g, 'Chữ trên hình')
    text = text.replace(/角色身旁/g, 'Bên cạnh nhân vật')
  } else if (targetLocale === 'zh') {
    text = text.replace(
      /【(?:BGM|Background Music|Nhạc nền)[：:]\s*(?:Nhạc nền nhẹ nhàng phù hợp không khí cốt truyện[^】]*|Subtle background music matching[^】]*)】/g,
      CUE_PAIRS.bgm.zh,
    )
    text = text.replace(/【(?:Nhạc nền|Background Music)[：:]\s*([^】]*)】/g, '【BGM：$1】')
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
    text = text.replace(
      /【(?:Giới thiệu nhân vật · Chữ trên hình · Bên cạnh nhân vật|Character intro · Overlay text · Beside character|Giới thiệu nhân vật[^】]*)】/g,
      CUE_PAIRS.characterIntro.zh,
    )
    text = text.replace(
      /【(?:Cảnh trống · Chỉ âm thanh môi trường & BGM|Empty shot · Ambient sound & BGM[^】]*)】/g,
      CUE_PAIRS.emptyShot.zh,
    )
  } else if (targetLocale === 'en') {
    text = text.replace(
      /【(?:BGM|Background Music|Nhạc nền)[：:]\s*(?:贴合剧情氛围的轻量配乐，情绪随画面起伏；音量低于人声|Nhạc nền nhẹ nhàng phù hợp không khí cốt truyện[^】]*)】/g,
      CUE_PAIRS.bgm.en,
    )
    text = text.replace(/【(?:BGM|Nhạc nền)[：:]\s*([^】]*)】/g, '【Background Music: $1】')
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
    text = text.replace(
      /【(?:人物介绍·画面叠字·角色身旁|Giới thiệu nhân vật · Chữ trên hình · Bên cạnh nhân vật|Giới thiệu nhân vật[^】]*)】/g,
      CUE_PAIRS.characterIntro.en,
    )
    text = text.replace(
      /【(?:空镜·可仅环境音与\s*BGM|Cảnh trống · Chỉ âm thanh môi trường & BGM[^】]*)】/g,
      CUE_PAIRS.emptyShot.en,
    )
  }

  return text
}
