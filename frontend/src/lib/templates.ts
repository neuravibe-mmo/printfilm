import { getActiveLocale, type Locale } from '../i18n'

export type TemplateMeta = {
  name: Record<Locale, string>
  description?: Record<Locale, string>
}

export const TEMPLATE_TRANSLATIONS: Record<string, TemplateMeta> = {
  huoke_douyin_hook: {
    name: {
      zh: '获客·抖音钩子',
      en: 'TikTok / Reels · Viral Hook',
      vi: 'TikTok / Reels · Giữ chân 3s',
    },
    description: {
      zh: '竖屏口播节奏：前 3 秒钩子→场景画面→1–2 个可核验体验→到店/下单号召。适合投放获客。',
      en: 'Vertical talking-head pacing: 3-second hook -> scene footage -> 1-2 verifiable proof points -> CTA to visit or order. Suitable for lead generation.',
      vi: 'Nhịp điệu video ngắn màn hình dọc: 3 giây đầu giữ chân người xem → Nêu bối cảnh/nỗi đau → Trải nghiệm thực tế → Kêu gọi hành động.',
    },
  },
  huoke_xhs_recommend: {
    name: {
      zh: '获客·小红书安利',
      en: 'Review & Product Showcase',
      vi: 'Review & Đề xuất sản phẩm',
    },
    description: {
      zh: '竖屏闺蜜安利结构：钩子标题→第一印象→分点真实体验→推荐给谁。封面信息量高、口语化。',
      en: 'Friendly recommendation structure: hook title -> first impression -> real breakdown -> who it is for. High-info cover, conversational tone.',
      vi: 'Cấu trúc video ngắn chia sẻ chân thật: Tiêu đề thu hút → Ấn tượng ban đầu → Phân tích trải nghiệm thực tế → Phù hợp với ai.',
    },
  },
  huoke_review_facts: {
    name: {
      zh: '获客·口碑拆解',
      en: 'In-Depth Product Review',
      vi: 'Đánh giá & So sánh chi tiết',
    },
    description: {
      zh: '横屏客观详实：总体评价→环境/服务→推荐项+理由→性价比→适合谁。帮别人做决策，不抒情。',
      en: 'Objective landscape breakdown: overall rating -> environment/service -> recommendations -> ROI -> target fit. Helps decision making.',
      vi: 'Khung hình ngang khách quan, chi tiết: Nhận định tổng quan → Phân tích dịch vụ/sản phẩm → So sánh giá trị → Khuyên dùng cho ai.',
    },
  },
  huoke_soft_invite: {
    name: {
      zh: '获客·熟人轻推',
      en: 'Everyday Life Vlog',
      vi: 'Vlog đời thường · Chia sẻ tự nhiên',
    },
    description: {
      zh: '竖屏生活化短片：一句真实感受→一个具体细节→一句轻推荐。克制、不像广告，适合转发给熟人。',
      en: 'Lifestyle vertical short: one true feeling -> one specific detail -> one subtle recommendation without feeling like an ad. Great for friends and chat groups.',
      vi: 'Video ngắn gần gũi: Một cảm nhận thật → Chi tiết không gian/sản phẩm → Gợi ý nhẹ nhàng, tự nhiên không gượng gạo.',
    },
  },
  opensource_showcase: {
    name: {
      zh: '开源项目展示',
      en: 'Software & App Demo',
      vi: 'Giới thiệu phần mềm & App',
    },
    description: {
      zh: '按项目内容动态规划：人物操作系统界面与真实使用场景，适合开源工具与平台介绍。',
      en: 'Dynamic planning: human operating system interface and real usage scenarios, suitable for software and tech products.',
      vi: 'Thao tác giao diện ứng dụng và bối cảnh sử dụng thực tế, phù hợp giới thiệu sản phẩm công nghệ và phần mềm.',
    },
  },
  opensource_live_work: {
    name: {
      zh: '真人工作场景',
      en: 'Workplace PC Operation',
      vi: 'Thao tác máy tính công sở',
    },
    description: {
      zh: '真人写实工位操作：侧脸/过肩操作系统，适合开源工具与产品工作流科普。',
      en: 'Realistic workstation operations with side/over-shoulder views, suitable for open source tools and workflow walkthroughs.',
      vi: 'Góc nhìn qua vai người thao tác laptop/PC tại bàn làm việc, phù hợp hướng dẫn và chia sẻ quy trình làm việc.',
    },
  },
  live_street_interview: {
    name: {
      zh: '真人街访口播',
      en: 'Street Interview & Talk',
      vi: 'Phỏng vấn đường phố (Street Talk)',
    },
    description: {
      zh: '街头/通勤场景的真人出镜口播感，适合观点、体验与轻访谈科普。',
      en: 'Street or commute setting with realistic host presentation, suitable for opinions, reviews, and short interviews.',
      vi: 'Phong cách người thật xuất hiện nói chuyện trên đường phố, phù hợp chia sẻ quan điểm, trải nghiệm và phỏng vấn ngắn.',
    },
  },
  live_product_desk: {
    name: {
      zh: '真人桌面演示',
      en: 'Hands-on Desk Demo',
      vi: 'Trên tay & Trình diễn bàn làm việc',
    },
    description: {
      zh: '桌面俯拍/斜俯写实：真人双手演示产品或笔记本流程，适合工具评测与教程。',
      en: 'Top-down or angled desk view: hands demonstrating products or laptop workflows, suitable for reviews and tutorials.',
      vi: 'Góc quay từ trên xuống bàn làm việc: Đôi bàn tay thao tác sản phẩm hoặc laptop, phù hợp unbox và hướng dẫn chi tiết.',
    },
  },
  portrait_story: {
    name: {
      zh: '竖屏图文故事',
      en: 'Portrait Storytelling',
      vi: 'Kể chuyện hình ảnh (Màn dọc)',
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
      en: '3D Animation (Pixar Style)',
      vi: 'Hoạt hình 3D (Pixar Style)',
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
      en: 'Cinematic Live-Action',
      vi: 'Thước phim điện ảnh (Cinematic)',
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
      en: 'Everyday People Life Story',
      vi: 'Ký sự người thật đời thường',
    },
    description: {
      zh: '生活化真人出镜感，适合人物故事、口播与纪实短片。',
      en: 'Everyday realistic lifestyle feel, suitable for personal stories, vlogs, and documentary shorts.',
      vi: 'Sinh hoạt đời thường chân thực, phù hợp câu chuyện nhân vật, tâm sự và video ngắn ký sự.',
    },
  },
  photo_realism: {
    name: {
      zh: '写实摄影',
      en: 'Photo Realism',
      vi: 'Nhiếp ảnh chân thực (Photo Realism)',
    },
    description: {
      zh: '照片级写实质感，适合产品、风光与纪实科普。',
      en: 'Photo-realistic texture, suitable for products, landscapes, and factual documentaries.',
      vi: 'Tái hiện độ chi tiết chân thực như ảnh chụp máy ảnh ống kính cao cấp, màu sắc tự nhiên.',
    },
  },
  film_cinematic: {
    name: {
      zh: '电影感胶片',
      en: '35mm Classic Film',
      vi: 'Điện ảnh phim nhựa 35mm',
    },
    description: {
      zh: '宽银幕胶片质感与戏剧光影，适合叙事短片与氛围故事。',
      en: 'Widescreen film grain with dramatic atmosphere, suitable for storytelling and moody pieces.',
      vi: 'Màu phim nhựa điện ảnh cổ điển, hiệu ứng hạt grain tự nhiên và độ tương phản giàu cảm xúc.',
    },
  },
  noir_thriller: {
    name: {
      zh: '黑色悬疑',
      en: 'Noir Thriller',
      vi: 'Trinh thám & Kịch tính (Noir)',
    },
    description: {
      zh: '高对比光影与冷调氛围，适合悬疑、案件与暗夜叙事。',
      en: 'High contrast lighting with cool tones, suitable for suspense, mystery, and nighttime tales.',
      vi: 'Tông màu tối, tương phản bóng đổ sắc nét bí ẩn, phù hợp chuyện trinh thám và án mạng.',
    },
  },
  vox_papercut: {
    name: {
      zh: 'Vox剪纸科普',
      en: 'Vox Motion Explainer',
      vi: 'Giải thích đồ họa (Vox Explainer)',
    },
    description: {
      zh: '低饱和扁平剪纸，以人物操作电脑/系统界面为主画面，适合硬核科普与产品讲解。',
      en: 'Low-saturation flat papercut style focusing on computer and UI operations, suitable for explainers and product guides.',
      vi: 'Đồ họa cắt giấy chuyển động sống động, rất phù hợp video giải thích kiến thức, khoa học và kinh tế.',
    },
  },
  docu_warm: {
    name: {
      zh: '温暖纪实',
      en: 'Humanitarian Documentary',
      vi: 'Phim tài liệu nhân văn',
    },
    description: {
      zh: '纪实插画气质与暖色调，适合人物故事与人文纪录短片。',
      en: 'Documentary illustration tone with warm palette, suitable for human interest and cultural stories.',
      vi: 'Tông màu điện ảnh ấm áp chân tình, phù hợp ghi lại nét đẹp lao động, làng nghề và con người.',
    },
  },
  kids_flat: {
    name: {
      zh: '儿童绘本扁平',
      en: 'Kids & Education Illustration',
      vi: 'Minh họa thiếu nhi & Giáo dục',
    },
    description: {
      zh: '柔和配色与圆润造型，适合儿童科普与故事。',
      en: 'Soft colors and rounded shapes, suitable for kids education and storytelling.',
      vi: 'Nét vẽ phẳng đáng yêu, màu sắc tươi sáng, phù hợp truyện tranh thiếu nhi và nội dung giáo dục.',
    },
  },
  soft_anime: {
    name: {
      zh: '柔光动漫',
      en: 'Japanese Anime (Ghibli Style)',
      vi: 'Anime Nhật Bản (Ghibli Style)',
    },
    description: {
      zh: '日系柔光赛璐璐，适合青春故事与情感短片。',
      en: 'Japanese soft anime cel shading, suitable for youth stories and emotional narratives.',
      vi: 'Nét vẽ 2D trong trẻo, phong cách hoạt hình Nhật Bản ấm áp, phù hợp video tự sự và cảm xúc.',
    },
  },
  chalk_whiteboard: {
    name: {
      zh: '粉笔白板手绘',
      en: 'Chalkboard & Lecture',
      vi: 'Bảng vẽ phấn & Bài giảng',
    },
    description: {
      zh: '黑板粉笔讲解风，突出人物操作系统/画流程图的课堂演示。',
      en: 'Chalkboard explainer style highlighting teacher/user diagramming and flow demonstrations.',
      vi: 'Nét vẽ phấn trên bảng đen truyền thống, phù hợp cho bài giảng học tập, công thức và hướng dẫn.',
    },
  },
  cyber_neon: {
    name: {
      zh: '赛博霓虹',
      en: 'Futuristic Cyberpunk',
      vi: 'Cyberpunk Viễn tưởng',
    },
    description: {
      zh: '霓虹夜城与未来感，适合科技、都市与科幻话题。',
      en: 'Neon nightscapes with futuristic vibes, suitable for tech, urban, and sci-fi topics.',
      vi: 'Ánh sáng neon tương lai, thành phố đêm viễn tưởng huyền ảo và công nghệ hiện đại.',
    },
  },
  epic_fantasy: {
    name: {
      zh: '奇幻史诗',
      en: 'Epic Fantasy World',
      vi: 'Thế giới kỳ ảo (Fantasy)',
    },
    description: {
      zh: '宏大场景与奇幻光影，适合神话、冒险与世界观短片。',
      en: 'Grand scales and mystical lighting, suitable for mythology, adventure, and fantasy world-building.',
      vi: 'Khung cảnh thần thoại hoành tráng, lâu đài, ma thuật và phong cách sử thi kỳ vĩ.',
    },
  },
  magazine_collage: {
    name: {
      zh: '杂志拼贴',
      en: 'Magazine Collage Pop',
      vi: 'Cắt dán tạp chí (Collage Pop)',
    },
    description: {
      zh: '剪报拼贴与印刷纹理，适合文化话题与品牌故事。',
      en: 'Newspaper clipping collages with print textures, suitable for cultural topics and brand stories.',
      vi: 'Phong cách cắt ghép hình ảnh và đồ họa báo chí hiện đại, cá tính, thời thượng.',
    },
  },
  brand_clean: {
    name: {
      zh: '极简品牌',
      en: 'Minimalist Brand Ad',
      vi: 'Quảng cáo thương hiệu tối giản',
    },
    description: {
      zh: '干净色块与强留白，适合产品解说与品牌短片。',
      en: 'Clean solid colors with ample negative space, suitable for product explainers and brand videos.',
      vi: 'Phong cách sạch sẽ, hiện đại và cao cấp, phù hợp video giới thiệu sản phẩm và thương hiệu.',
    },
  },
  pixel_retro: {
    name: {
      zh: '复古像素科普',
      en: 'Pixel Game 8-bit / 16-bit',
      vi: 'Game Pixel 8-bit / 16-bit',
    },
    description: {
      zh: '像素艺术与怀旧感，适合极客、游戏与趣味科普。',
      en: 'Pixel art with nostalgic vibes, suitable for geek culture, games, and fun science topics.',
      vi: 'Phong cách đồ họa điểm ảnh Pixel hoài niệm tuổi thơ, vui nhộn và độc đáo.',
    },
  },
  retro_vhs: {
    name: {
      zh: '复古磁带',
      en: '90s VHS Tape Retro',
      vi: 'Băng từ VHS thập niên 90',
    },
    description: {
      zh: '磁带噪点与扫描线质感，适合怀旧年代感叙事。',
      en: 'VHS tape noise and scanline textures, suitable for nostalgic period stories.',
      vi: 'Chất cảm băng từ và đường quét scanlines, phù hợp câu chuyện hoài niệm và dấu ấn thời đại.',
    },
  },
  ink_guofeng: {
    name: {
      zh: '水墨国风',
      en: 'Artistic Ink Wash',
      vi: 'Tranh thủy mặc nghệ thuật',
    },
    description: {
      zh: '水墨留白与写意笔触，适合历史与文化短故事。',
      en: 'Ink wash textures with expressive strokes, suitable for historical and cultural stories.',
      vi: 'Khoảng trắng thủy mặc và nét bút phóng khoáng tao nhã, phù hợp lịch sử và các câu chuyện văn hóa.',
    },
  },
  travel_vlog: {
    name: {
      zh: '旅行记录与探索',
      en: 'Travel Cinematic Vlog',
      vi: 'Vlog Du lịch & Trải nghiệm',
    },
    description: {
      zh: '壮丽风光与地方人文探索，适合旅行路线、美食与探索短片。',
      en: 'Cinematic travel landscapes and local culture, ideal for exploration and road trips.',
      vi: 'Khung cảnh du lịch hùng vĩ, trải nghiệm văn hóa địa phương, ẩm thực và những cung đường khám phá tuyệt đẹp.',
    },
  },
  podcast_clips: {
    name: {
      zh: '播客访谈切片',
      en: 'Studio Podcast Clips',
      vi: 'Podcast & Đối thoại sâu sắc',
    },
    description: {
      zh: '专业录音棚与麦克风近景，适合干货金句、深度对话与人生感悟。',
      en: 'Professional studio with mic close-up, perfect for insightful quotes and deep discussions.',
      vi: 'Không gian phòng thu podcast chuyên nghiệp với micro thu âm, chia sẻ quan điểm sâu sắc và bài học cuộc sống.',
    },
  },
  food_delight: {
    name: {
      zh: '美食烹饪与探店',
      en: 'Foodie & Cooking ASMR',
      vi: 'Mỹ vị Ẩm thực & Nấu ăn',
    },
    description: {
      zh: '热气腾腾的食物特写与诱人烹饪，适合美食探店、菜谱与治愈吃播。',
      en: 'Sizzling food close-ups and cooking craft, great for restaurant tours and culinary guides.',
      vi: 'Đặc tả cận cảnh món ăn thơm ngon bốc khói, công đoạn chế biến điêu luyện và cảm giác thưởng thức hấp dẫn.',
    },
  },
  fitness_workout: {
    name: {
      zh: '健身燃脂与运动',
      en: 'Fitness & Gym Motivation',
      vi: 'Thể hình & Năng lượng tích cực',
    },
    description: {
      zh: '高能运动氛围与动作示范，适合健身打卡、燃脂教程与自律生活。',
      en: 'High-energy workout atmosphere, ideal for fitness guides, exercise form, and gym motivation.',
      vi: 'Động lực tập luyện bùng nổ, hướng dẫn động tác thể hình chuẩn xác và phong cách sống lành mạnh.',
    },
  },
  real_estate: {
    name: {
      zh: '豪宅与空间美学',
      en: 'Luxury Home Tour',
      vi: 'Bất động sản & Nhà đẹp',
    },
    description: {
      zh: '高级公寓与别墅全景漫游，适合房屋带看、空间设计与居住美学。',
      en: 'Luxury interior walkthroughs and penthouse tours, perfect for architecture and property showcases.',
      vi: 'Tour tham quan căn hộ cao cấp, biệt thự sân vườn, thiết kế nội thất sang trọng và không gian sống mơ ước.',
    },
  },
  historical_legend: {
    name: {
      zh: '史诗历史与风云',
      en: 'Epic History & Legends',
      vi: 'Hào khí Lịch sử & Danh nhân',
    },
    description: {
      zh: '波澜壮阔的战争与名人生平，适合历史事件与纪实科普叙事。',
      en: 'Dramatic battle scenes and historical biography, suitable for historical events and cultural chronicles.',
      vi: 'Tái hiện những trận chiến hào hùng, chân dung các bậc vĩ nhân và dấu mốc lịch sử chấn động nhân loại.',
    },
  },
  lofi_chill: {
    name: {
      zh: 'Lo-Fi 自习与治愈',
      en: 'Lo-Fi Chill & Study',
      vi: 'Không gian Lo-Fi thư giãn & Học bài',
    },
    description: {
      zh: '雨夜暖灯书桌与慵懒猫咪，适合沉浸式学习、专注伴读与解压陪伴。',
      en: 'Cozy study desk on a rainy night, ideal for deep focus, chill beats, and relaxation.',
      vi: 'Căn phòng ngủ ấm cúng đêm mưa, góc học tập vintage bên ô cửa sổ, ánh đèn bàn êm dịu thư giãn tâm trí.',
    },
  },
  finance_crypto: {
    name: {
      zh: '商业金融与投资',
      en: 'FinTech & Smart Investing',
      vi: 'Tài chính & Đầu tư thông minh',
    },
    description: {
      zh: 'K线图表与经济脉络解析，适合财富认知、理财科普与行业观察。',
      en: 'Market charts and macroeconomic insights, suitable for investment tips and financial literacy.',
      vi: 'Phân tích thị trường tài chính, biểu đồ nến xanh đỏ, tư duy làm giàu và kiến thức đầu tư dễ hiểu.',
    },
  },
  medical_health: {
    name: {
      zh: '家庭医生与健康',
      en: 'Health & Wellness Guide',
      vi: 'Bác sĩ gia đình & Sống khỏe',
    },
    description: {
      zh: '专业医生出镜与人体结构解析，适合健康科普、日常护理与用药常识。',
      en: 'Professional medical advice and anatomical insights, great for wellness tips and healthcare education.',
      vi: 'Lời khuyên từ bác sĩ chuyên khoa, giải mã bệnh lý thường gặp và cẩm nang chăm sóc sức khỏe gia đình.',
    },
  },
  horror_mystery: {
    name: {
      zh: '惊悚怪谈与探秘',
      en: 'Urban Legend & Spooky Mystery',
      vi: 'Truyện ma & Bí ẩn đô thị',
    },
    description: {
      zh: '幽暗光影与未解之谜，适合民间怪谈、夜间探秘与悬疑恐怖故事。',
      en: 'Dark eerie atmosphere and urban legends, tailored for ghost stories and late-night mysteries.',
      vi: 'Chuyện ma rùng rợn đêm khuya, truyền thuyết đô thị bí ẩn, bầu không khí u tối nghẹt thở và bất ngờ.',
    },
  },
}

// Build reverse lookup maps for zh names to key
const NAME_TO_KEY: Record<string, string> = {}
for (const [key, meta] of Object.entries(TEMPLATE_TRANSLATIONS)) {
  NAME_TO_KEY[meta.name.zh] = key
  const spaced = meta.name.zh.replace(/·/g, ' · ')
  if (spaced !== meta.name.zh) NAME_TO_KEY[spaced] = key
  const unspaced = meta.name.zh.replace(/ · /g, '·')
  if (unspaced !== meta.name.zh) NAME_TO_KEY[unspaced] = key
  if (meta.name.vi) NAME_TO_KEY[meta.name.vi] = key
  if (meta.name.en) NAME_TO_KEY[meta.name.en] = key
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

/** Lấy tên hiển thị theo ngôn ngữ hiện tại: ưu tiên prop từ database (name_vi, name_en) */
export function getTemplateName(
  target: { id?: string; name?: string; name_en?: string; name_vi?: string } | string,
  explicitLocale?: Locale,
): string {
  const locale = explicitLocale || getActiveLocale()
  const key = resolveKey(target)
  if (key && TEMPLATE_TRANSLATIONS[key]?.name?.[locale]) {
    return TEMPLATE_TRANSLATIONS[key].name[locale]
  }
  if (typeof target === 'object' && target !== null) {
    if (locale === 'vi' && target.name_vi) return target.name_vi
    if (locale === 'en' && target.name_en) return target.name_en
    if (locale === 'zh' && target.name) return target.name
    if (target.name) return target.name
  }
  if (typeof target === 'string') return target
  return target.id || ''
}

/** Lấy mô tả hiển thị theo ngôn ngữ hiện tại: ưu tiên prop từ database (description_vi, description_en) */
export function getTemplateDescription(
  target: { id?: string; description?: string; description_en?: string; description_vi?: string } | string,
  explicitLocale?: Locale,
): string {
  const locale = explicitLocale || getActiveLocale()
  const key = resolveKey(target)
  if (key && TEMPLATE_TRANSLATIONS[key]?.description?.[locale]) {
    return TEMPLATE_TRANSLATIONS[key].description[locale]
  }
  if (typeof target === 'object' && target !== null) {
    if (locale === 'vi' && target.description_vi) return target.description_vi
    if (locale === 'en' && target.description_en) return target.description_en
    if (locale === 'zh' && target.description) return target.description
    if (target.description) return target.description
  }
  if (typeof target === 'string') return target
  return ''
}

/** Lấy danh mục hiển thị theo ngôn ngữ hiện tại: ưu tiên prop từ database (category_vi, category_en) */
export function getTemplateCategories(
  target: { category?: string[]; category_en?: string[]; category_vi?: string[] },
  explicitLocale?: Locale,
): string[] {
  const locale = explicitLocale || getActiveLocale()
  if (locale === 'vi' && target.category_vi?.length) return target.category_vi
  if (locale === 'en' && target.category_en?.length) return target.category_en
  return target.category || []
}
