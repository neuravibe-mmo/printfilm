import { getActiveLocale, type Locale } from '../i18n'

export type TemplateMeta = {
  name: Record<Locale, string>
  description?: Record<Locale, string>
}

export const TEMPLATE_TRANSLATIONS: Record<string, TemplateMeta> = {
  opensource_showcase: {
    name: {
      zh: '开源项目展示',
      en: 'Open Source Showcase',
      vi: 'Trưng bày dự án mã nguồn mở',
    },
    description: {
      zh: '按项目内容动态规划：人物操作系统界面与真实使用场景，适合开源工具与平台介绍。',
      en: 'Dynamic planning: human operating system interface and real usage scenarios, suitable for open source tools and platform introduction.',
      vi: 'Quy hoạch theo nội dung: nhân vật thao tác giao diện hệ thống & tình huống thực tế, phù hợp giới thiệu công cụ và nền tảng mã nguồn mở.',
    },
  },
  opensource_live_work: {
    name: {
      zh: '真人工作场景',
      en: 'Live Work Scene',
      vi: 'Bối cảnh làm việc người thật',
    },
    description: {
      zh: '真人写实工位操作：侧脸/过肩操作系统，适合开源工具与产品工作流科普。',
      en: 'Realistic workstation operations with side/over-shoulder views, suitable for open source tools and workflow walkthroughs.',
      vi: 'Thao tác tại bàn làm việc người thật: góc nhìn nghiêng/qua vai thao tác hệ thống, phù hợp hướng dẫn công cụ và quy trình làm việc.',
    },
  },
  live_street_interview: {
    name: {
      zh: '真人街访口播',
      en: 'Street Interview',
      vi: 'Phỏng vấn đường phố người thật',
    },
    description: {
      zh: '街头/通勤场景的真人出镜口播感，适合观点、体验与轻访谈科普。',
      en: 'Street or commute setting with realistic host presentation, suitable for opinions, reviews, and short interviews.',
      vi: 'Phong cách người thật xuất hiện nói chuyện trên đường phố/đi làm, phù hợp chia sẻ quan điểm, trải nghiệm và phỏng vấn ngắn.',
    },
  },
  live_product_desk: {
    name: {
      zh: '真人桌面演示',
      en: 'Desk Product Demo',
      vi: 'Trình diễn bàn làm việc người thật',
    },
    description: {
      zh: '桌面俯拍/斜俯写实：真人双手演示产品或笔记本流程，适合工具评测与教程。',
      en: 'Top-down or angled desk view: hands demonstrating products or laptop workflows, suitable for reviews and tutorials.',
      vi: 'Góc quay từ trên xuống bàn làm việc: hai tay người thật thao tác sản phẩm hoặc laptop, phù hợp đánh giá công cụ và hướng dẫn.',
    },
  },
  portrait_story: {
    name: {
      zh: '竖屏图文故事',
      en: 'Portrait Story',
      vi: 'Câu chuyện hình ảnh màn dọc',
    },
    description: {
      zh: '竖屏插画叙事，电影感构图，适合历史人文短片。',
      en: 'Vertical illustration narrative with cinematic framing, suitable for historical and cultural stories.',
      vi: 'Kể chuyện bằng tranh minh họa màn hình dọc, bố cục điện ảnh, phù hợp video ngắn lịch sử nhân văn.',
    },
  },
  anim_3d: {
    name: {
      zh: '3D 动画',
      en: '3D Animation',
      vi: 'Hoạt hình 3D',
    },
    description: {
      zh: '电影级三维动画质感，圆润造型与柔和体积光，适合科普讲解与故事短片。',
      en: 'Cinematic 3D animation quality with rounded shapes and soft volumetric lighting, suitable for explainers and short stories.',
      vi: 'Chất lượng hoạt hình 3D chuẩn điện ảnh, tạo hình tròn trịa với ánh sáng thể tích dịu nhẹ, phù hợp giải thích khoa học và truyện ngắn.',
    },
  },
  live_cinematic: {
    name: {
      zh: '真人电影感',
      en: 'Live Cinematic',
      vi: 'Điện ảnh người thật',
    },
    description: {
      zh: '真人实拍电影质感，戏剧光影与浅景深，适合叙事短片。',
      en: 'Cinematic live-action film texture with dramatic lighting and shallow depth of field, suitable for narrative shorts.',
      vi: 'Chất lượng phim điện ảnh người thật quay thực tế, ánh sáng kịch tính và độ sâu trường ảnh nông, phù hợp phim ngắn tự sự.',
    },
  },
  live_person: {
    name: {
      zh: '真人感叙事',
      en: 'Life Story',
      vi: 'Tự sự người thật đời thường',
    },
    description: {
      zh: '生活化真人出镜感，适合人物故事、口播与纪实短片。',
      en: 'Everyday realistic lifestyle feel, suitable for personal stories, vlogs, and documentary shorts.',
      vi: 'Cảm giác người thật đời thường xuất hiện trước ống kính, phù hợp chuyện nhân vật, vlog nói chuyện và phóng sự tài liệu ngắn.',
    },
  },
  photo_realism: {
    name: {
      zh: '写实摄影',
      en: 'Photorealism',
      vi: 'Nhiếp ảnh chân thực',
    },
    description: {
      zh: '照片级写实质感，适合产品、风光与纪实科普。',
      en: 'Photo-realistic texture, suitable for products, landscapes, and factual documentaries.',
      vi: 'Chất lượng ảnh chụp chân thực từng chi tiết, phù hợp sản phẩm, phong cảnh và khoa học phổ biến thực tế.',
    },
  },
  film_cinematic: {
    name: {
      zh: '电影感胶片',
      en: 'Film Cinematic',
      vi: 'Thước phim nhựa điện ảnh',
    },
    description: {
      zh: '宽银幕胶片质感与戏剧光影，适合叙事短片与氛围故事。',
      en: 'Widescreen film grain with dramatic atmosphere, suitable for storytelling and moody pieces.',
      vi: 'Chất lượng phim nhựa màn ảnh rộng với ánh sáng giàu cảm xúc, phù hợp phim ngắn tự sự và câu chuyện giàu bầu không khí.',
    },
  },
  noir_thriller: {
    name: {
      zh: '黑色悬疑',
      en: 'Noir Thriller',
      vi: 'Trinh thám u tối (Noir)',
    },
    description: {
      zh: '高对比光影与冷调氛围，适合悬疑、案件与暗夜叙事。',
      en: 'High contrast lighting with cool tones, suitable for suspense, mystery, and nighttime tales.',
      vi: 'Ánh sáng tương phản cao và bầu không khí tông lạnh, phù hợp chủ đề ly kỳ, phá án và câu chuyện màn đêm.',
    },
  },
  vox_papercut: {
    name: {
      zh: 'Vox剪纸科普',
      en: 'Vox Papercut',
      vi: 'Vox cắt giấy khoa học',
    },
    description: {
      zh: '低饱和扁平剪纸，以人物操作电脑/系统界面为主画面，适合硬核科普与产品讲解。',
      en: 'Low-saturation flat papercut style focusing on computer and UI operations, suitable for explainers and product guides.',
      vi: 'Cắt giấy phẳng độ bão hòa thấp, lấy thao tác giao diện máy tính làm khung hình chính, phù hợp khoa học chuyên sâu và giới thiệu sản phẩm.',
    },
  },
  docu_warm: {
    name: {
      zh: '温暖纪实',
      en: 'Warm Documentary',
      vi: 'Ký sự ấm áp',
    },
    description: {
      zh: '纪实插画气质与暖色调，适合人物故事与人文纪录短片。',
      en: 'Documentary illustration tone with warm palette, suitable for human interest and cultural stories.',
      vi: 'Minh họa phóng sự với tông màu ấm áp, phù hợp câu chuyện con người và phim tài liệu nhân văn ngắn.',
    },
  },
  kids_flat: {
    name: {
      zh: '儿童绘本扁平',
      en: 'Kids Flat Picture Book',
      vi: 'Sách tranh phẳng trẻ em',
    },
    description: {
      zh: '柔和配色与圆润造型，适合儿童科普与故事。',
      en: 'Soft colors and rounded shapes, suitable for kids education and storytelling.',
      vi: 'Phối màu dịu nhẹ và hình khối bo tròn, phù hợp kiến thức và câu chuyện cho trẻ em.',
    },
  },
  soft_anime: {
    name: {
      zh: '柔光动漫',
      en: 'Soft Anime',
      vi: 'Anime ánh sáng dịu',
    },
    description: {
      zh: '日系柔光赛璐璐，适合青春故事与情感短片。',
      en: 'Japanese soft anime cel shading, suitable for youth stories and emotional narratives.',
      vi: 'Phong cách cel-shading ánh sáng dịu kiểu Nhật, phù hợp câu chuyện thanh xuân và cảm xúc.',
    },
  },
  chalk_whiteboard: {
    name: {
      zh: '粉笔白板手绘',
      en: 'Chalkboard Sketch',
      vi: 'Bảng phấn vẽ tay',
    },
    description: {
      zh: '黑板粉笔讲解风，突出人物操作系统/画流程图的课堂演示。',
      en: 'Chalkboard explainer style highlighting teacher/user diagramming and flow demonstrations.',
      vi: 'Phong cách giảng giải bảng đen phấn trắng, làm nổi bật thao tác vẽ sơ đồ tư duy trên lớp học.',
    },
  },
  cyber_neon: {
    name: {
      zh: '赛博霓虹',
      en: 'Cyber Neon',
      vi: 'Cyber neon tương lai',
    },
    description: {
      zh: '霓虹夜城与未来感，适合科技、都市与科幻话题。',
      en: 'Neon nightscapes with futuristic vibes, suitable for tech, urban, and sci-fi topics.',
      vi: 'Thành phố đêm rực rỡ neon và hơi thở tương lai, phù hợp công nghệ, đô thị và khoa học viễn tưởng.',
    },
  },
  epic_fantasy: {
    name: {
      zh: '奇幻史诗',
      en: 'Epic Fantasy',
      vi: 'Sử thi kỳ ảo',
    },
    description: {
      zh: '宏大场景与奇幻光影，适合神话、冒险与世界观短片。',
      en: 'Grand scales and mystical lighting, suitable for mythology, adventure, and fantasy world-building.',
      vi: 'Bối cảnh hoành tráng và ánh sáng ma mị huyền ảo, phù hợp thần thoại, phiêu lưu và thế giới giả tưởng.',
    },
  },
  magazine_collage: {
    name: {
      zh: '杂志拼贴',
      en: 'Magazine Collage',
      vi: 'Cắt dán tạp chí',
    },
    description: {
      zh: '剪报拼贴与印刷纹理，适合文化话题与品牌故事。',
      en: 'Newspaper clipping collages with print textures, suitable for cultural topics and brand stories.',
      vi: 'Cắt dán báo chí kết hợp vân in ấn cổ điển, phù hợp chủ đề văn hóa và câu chuyện thương hiệu.',
    },
  },
  brand_clean: {
    name: {
      zh: '极简品牌',
      en: 'Clean Brand',
      vi: 'Thương hiệu tối giản',
    },
    description: {
      zh: '干净色块与强留白，适合产品解说与品牌短片。',
      en: 'Clean solid colors with ample negative space, suitable for product explainers and brand videos.',
      vi: 'Mảng màu sạch sẽ và khoảng trống tinh tế, phù hợp giải thích sản phẩm và video thương hiệu.',
    },
  },
  pixel_retro: {
    name: {
      zh: '像素复古科普',
      en: 'Pixel Retro',
      vi: 'Pixel cổ điển khoa học',
    },
    description: {
      zh: '8-bit/16-bit 像素风，适合科技史与游戏化讲解。',
      en: '8-bit/16-bit pixel art style, suitable for tech history and gamified explainers.',
      vi: 'Phong cách pixel 8-bit / 16-bit, phù hợp lịch sử công nghệ và diễn giải dạng trò chơi.',
    },
  },
  retro_vhs: {
    name: {
      zh: '复古 VHS',
      en: 'Retro VHS',
      vi: 'Băng từ VHS hoài niệm',
    },
    description: {
      zh: '磁带录像与扫描线质感，适合怀旧故事与年代感内容。',
      en: 'Tape recording with scanlines, suitable for nostalgia and period pieces.',
      vi: 'Chất cảm băng từ và đường quét scanlines, phù hợp câu chuyện hoài niệm và nội dung dấu ấn thời đại.',
    },
  },
  ink_guofeng: {
    name: {
      zh: '水墨国风',
      en: 'Ink Guofeng',
      vi: 'Thủy mặc cổ phong',
    },
    description: {
      zh: '水墨留白与写意笔触，适合历史与文化短故事。',
      en: 'Ink wash textures with expressive strokes, suitable for historical and cultural stories.',
      vi: 'Khoảng trắng thủy mặc và nét bút phóng khoáng tao nhã, phù hợp lịch sử và các câu chuyện văn hóa.',
    },
  },
  huoke_douyin_hook: {
    name: {
      zh: '获客·抖音钩子',
      en: 'Customer Acquisition · Hook',
      vi: 'Thu hút khách · Hook mở đầu',
    },
    description: {
      zh: '竖屏口播节奏：前 3 秒钩子→场景画面→1–2 个可核验体验→到店/下单号召。适合投放获客。',
      en: 'Vertical talking-head pacing: 3-second hook -> scene footage -> 1-2 verifiable proof points -> CTA to visit or order. Suitable for lead generation.',
      vi: 'Nhịp điệu màn dọc: 3 giây đầu giữ chân → bối cảnh trải nghiệm → 1–2 điểm kiểm chứng thực tế → kêu gọi ghé quán/đặt hàng. Phù hợp chạy quảng cáo thu hút khách.',
    },
  },
  huoke_xhs_recommend: {
    name: {
      zh: '获客·小红书安利',
      en: 'Customer Acquisition · Review',
      vi: 'Thu hút khách · Đề xuất chia sẻ',
    },
    description: {
      zh: '竖屏闺蜜安利结构：钩子标题→第一印象→分点真实体验→推荐给谁。封面信息量高、口语化。',
      en: 'Friendly recommendation structure: hook title -> first impression -> real breakdown -> who it is for. High-info cover, conversational tone.',
      vi: 'Cấu trúc chia sẻ gần gũi màn dọc: tiêu đề lôi cuốn → ấn tượng đầu tiên → phân tích trải nghiệm thật → phù hợp với ai. Bìa nhiều thông tin, lời thoại tự nhiên.',
    },
  },
  huoke_review_facts: {
    name: {
      zh: '获客·口碑拆解',
      en: 'Customer Acquisition · Fact Breakdown',
      vi: 'Thu hút khách · Phân tích đánh giá',
    },
    description: {
      zh: '横屏客观详实：总体评价→环境/服务→推荐项+理由→性价比→适合谁。帮别人做决策，不抒情。',
      en: 'Objective landscape breakdown: overall rating -> environment/service -> recommendations -> ROI -> target fit. Helps decision making.',
      vi: 'Khách quan chi tiết màn ngang: đánh giá tổng quan → không gian/dịch vụ → gợi ý kèm lý do → giá trị mang lại → phù hợp ai. Giúp người xem quyết định.',
    },
  },
  huoke_soft_invite: {
    name: {
      zh: '获客·熟人轻推',
      en: 'Customer Acquisition · Soft Referral',
      vi: 'Thu hút khách · Gợi ý nhẹ nhàng',
    },
    description: {
      zh: '竖屏生活化短片：一句真实感受→一个具体细节→一句轻推荐。克制、不像广告，适合转发给熟人。',
      en: 'Lifestyle vertical short: one true feeling -> one specific detail -> one subtle recommendation without feeling like an ad. Great for friends and chat groups.',
      vi: 'Video ngắn đời thường màn dọc: một cảm nhận thật → một chi tiết cụ thể → lời gợi ý tự nhiên. Tinh tế, không lộ liễu quảng cáo, phù hợp gửi cho bạn bè.',
    },
  },
}

// Build reverse lookup maps for zh names to key
const NAME_TO_KEY: Record<string, string> = {}
for (const [key, meta] of Object.entries(TEMPLATE_TRANSLATIONS)) {
  NAME_TO_KEY[meta.name.zh] = key
  // also normalize dot variants: 获客·抖音钩子 vs 获客 · 抖音钩子
  const spaced = meta.name.zh.replace(/·/g, ' · ')
  if (spaced !== meta.name.zh) NAME_TO_KEY[spaced] = key
  const unspaced = meta.name.zh.replace(/ · /g, '·')
  if (unspaced !== meta.name.zh) NAME_TO_KEY[unspaced] = key
}

function resolveKey(target: { id?: string; name?: string } | string): string | undefined {
  if (typeof target === 'string') {
    if (TEMPLATE_TRANSLATIONS[target]) return target
    return NAME_TO_KEY[target] || NAME_TO_KEY[target.trim()]
  }
  if (target.id && TEMPLATE_TRANSLATIONS[target.id]) return target.id
  if (target.name) {
    return NAME_TO_KEY[target.name] || NAME_TO_KEY[target.name.trim()]
  }
  return undefined
}

/** Lấy tên hiển thị theo ngôn ngữ hiện tại */
export function getTemplateName(
  target: { id?: string; name?: string } | string,
  explicitLocale?: Locale,
): string {
  const locale = explicitLocale || getActiveLocale()
  const key = resolveKey(target)
  if (key && TEMPLATE_TRANSLATIONS[key]?.name?.[locale]) {
    return TEMPLATE_TRANSLATIONS[key].name[locale]
  }
  if (typeof target === 'string') return target
  return target.name || target.id || ''
}

/** Lấy mô tả hiển thị theo ngôn ngữ hiện tại */
export function getTemplateDescription(
  target: { id?: string; description?: string } | string,
  explicitLocale?: Locale,
): string {
  const locale = explicitLocale || getActiveLocale()
  const key = resolveKey(target)
  if (key && TEMPLATE_TRANSLATIONS[key]?.description?.[locale]) {
    return TEMPLATE_TRANSLATIONS[key].description[locale]
  }
  if (typeof target === 'string') return target
  return target.description || ''
}
