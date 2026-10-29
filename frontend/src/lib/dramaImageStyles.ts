/** Drama image style options (aligned with manju imageStyles). */

import { getActiveLocale } from '../i18n/detect'
import { messages } from '../i18n/messages'

export const IMAGE_STYLE_IDS = [
  // Nhóm 1: Điện ảnh, Cổ trang & Hoạt họa (Gốc)
  'wartime-epic-film',
  'retro-sci-fi-atompunk',
  'palace-intrigue-cold',
  'domestic-suspense-cold',
  'ancient-romance-soft',
  'ancient-chinese-mythology',
  'japanese-youth-film',
  'japanese-daily-natural',
  'korean-urban-soft',
  'chinese-urban-realistic',
  'wuxia-realistic-photo',
  '90s-realistic-film',
  'retro-narrative-film',
  'american-retro-hollywood',
  'neon-cyberpunk-film',
  '90s-rural-china-film',
  'cgi-3d-animation',
  'ghibli-handdrawn-anime',
  'tezuka-era-cartoon',
  'shanghai-animation',
  'pixel-art',
  'shadow-puppet-illustration',

  // Nhóm 2: Khoa học, Huyền bí & Công nghệ
  'hard-sci-fi-interstellar',
  'mystic-cyber-occult',
  'steampunk-victorian-machinery',
  'biopunk-organic-tech',
  'quantum-abstract-dimension',
  'holographic-futuristic-ui',
  'cosmic-horror-lovecraftian',

  // Nhóm 3: Thương mại, Thời trang & Triển lãm
  'high-fashion-editorial',
  'luxury-minimalist-gallery',
  'vintage-parisian-couture',
  'futuristic-avant-garde',
  'commercial-product-cinematic',
  'neon-runway-glow',
  'pop-art-color-block',

  // Nhóm 4: Đời sống Thực tế & Con người
  'documentary-natgeo-human',
  'warm-family-nostalgia',
  'street-life-candid',
  'cozy-coffee-indie',
  'coastal-fishing-village',
  'workshop-artisan-craft',
  'autumn-golden-hour',
  'visual-diary-pov',
  'fly-on-the-wall-doc',
  'raw-transparent-portrait',
  'candid-unscripted-moments',

  // Nhóm 5: Đô thị, Văn hóa & Xã hội
  'cyber-tokyo-night',
  'traditional-heritage-festive',
  'monochrome-noir-city',
  'subway-metro-commute',
  'ancient-temple-zen',
  'brutalist-concrete-architecture',
  'carnival-vintage-fair',
  'raw-urban-workforce',

  // Nhóm 6: Không gian, Ẩm thực & Thể thao
  'deep-space-nebula',
  'culinary-dark-moody',
  'street-food-night-market',
  'extreme-sports-action',
  'stadium-epic-championship',
  'fine-dining-michelin',
  'zen-tea-ceremony',
] as const

export type ImageStyleId = (typeof IMAGE_STYLE_IDS)[number]

export type ImageStyleCategoryId =
  | 'all'
  | 'cinema_period_anime'
  | 'scifi_mystic_tech'
  | 'fashion_commercial'
  | 'human_real_life'
  | 'urban_culture'
  | 'space_food_sports'

export type ImageStyleCategory = {
  id: ImageStyleCategoryId
  label: string
}

export const IMAGE_STYLE_CATEGORIES: ImageStyleCategory[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'cinema_period_anime', label: 'Điện ảnh & Cổ trang' },
  { id: 'scifi_mystic_tech', label: 'Khoa học & Huyền bí' },
  { id: 'fashion_commercial', label: 'Thời trang & Triển lãm' },
  { id: 'human_real_life', label: 'Đời sống & Con người' },
  { id: 'urban_culture', label: 'Đô thị & Văn hóa' },
  { id: 'space_food_sports', label: 'Không gian & Ẩm thực' },
]

export type ImageStyleOption = {
  id: ImageStyleId
  label: string
  categoryId: ImageStyleCategoryId
}

export const IMAGE_STYLE_OPTIONS: Array<ImageStyleOption> = [
  // Nhóm 1: Điện ảnh, Cổ trang & Hoạt họa (Gốc)
  { id: 'wartime-epic-film', label: 'Điện ảnh chiến tranh bi tráng', categoryId: 'cinema_period_anime' },
  { id: 'retro-sci-fi-atompunk', label: 'Khoa học viễn tưởng retro Atompunk', categoryId: 'cinema_period_anime' },
  { id: 'palace-intrigue-cold', label: 'Cung đấu âm mưu lạnh lùng', categoryId: 'cinema_period_anime' },
  { id: 'domestic-suspense-cold', label: 'Phim trinh thám nội địa tông lạnh', categoryId: 'cinema_period_anime' },
  { id: 'ancient-romance-soft', label: 'Cổ trang lãng mạn ánh sáng mềm', categoryId: 'cinema_period_anime' },
  { id: 'ancient-chinese-mythology', label: 'Thần thoại Trung Hoa cổ đại sử thi', categoryId: 'cinema_period_anime' },
  { id: 'japanese-youth-film', label: 'Phim tuổi trẻ Nhật Bản phong cách film', categoryId: 'cinema_period_anime' },
  { id: 'japanese-daily-natural', label: 'Đời thường Nhật Bản tự nhiên', categoryId: 'cinema_period_anime' },
  { id: 'korean-urban-soft', label: 'Phim Hàn đô thị ánh sáng mềm', categoryId: 'cinema_period_anime' },
  { id: 'chinese-urban-realistic', label: 'Phim đô thị Trung Quốc hiện thực', categoryId: 'cinema_period_anime' },
  { id: 'wuxia-realistic-photo', label: 'Võ hiệp giang hồ phong cách ảnh thực', categoryId: 'cinema_period_anime' },
  { id: '90s-realistic-film', label: 'Phim hiện thực thập niên 90', categoryId: 'cinema_period_anime' },
  { id: 'retro-narrative-film', label: 'Phim tự sự retro', categoryId: 'cinema_period_anime' },
  { id: 'american-retro-hollywood', label: 'Hollywood retro kiểu Mỹ', categoryId: 'cinema_period_anime' },
  { id: 'neon-cyberpunk-film', label: 'Phim Cyberpunk ánh đèn neon', categoryId: 'cinema_period_anime' },
  { id: '90s-rural-china-film', label: 'Phim nông thôn Trung Quốc thập niên 90', categoryId: 'cinema_period_anime' },
  { id: 'cgi-3d-animation', label: 'Hoạt hình 3D CGI', categoryId: 'cinema_period_anime' },
  { id: 'ghibli-handdrawn-anime', label: 'Hoạt hình vẽ tay phong cách Ghibli', categoryId: 'cinema_period_anime' },
  { id: 'tezuka-era-cartoon', label: 'Phong cách hoạt hình thời Tezuka', categoryId: 'cinema_period_anime' },
  { id: 'shanghai-animation', label: 'Phong cách hoạt hình Thượng Hải', categoryId: 'cinema_period_anime' },
  { id: 'pixel-art', label: 'Pixel Art', categoryId: 'cinema_period_anime' },
  { id: 'shadow-puppet-illustration', label: 'Minh họa múa rối bóng', categoryId: 'cinema_period_anime' },

  // Nhóm 2: Khoa học, Huyền bí & Công nghệ
  { id: 'hard-sci-fi-interstellar', label: 'Khoa học viễn tưởng không gian sâu', categoryId: 'scifi_mystic_tech' },
  { id: 'mystic-cyber-occult', label: 'Huyền bí công nghệ Cyber Occult', categoryId: 'scifi_mystic_tech' },
  { id: 'steampunk-victorian-machinery', label: 'Steampunk cơ khí Victoria', categoryId: 'scifi_mystic_tech' },
  { id: 'biopunk-organic-tech', label: 'Công nghệ sinh học Biopunk', categoryId: 'scifi_mystic_tech' },
  { id: 'quantum-abstract-dimension', label: 'Không gian lượng tử đa chiều', categoryId: 'scifi_mystic_tech' },
  { id: 'holographic-futuristic-ui', label: 'Giao diện tương lai Hologram', categoryId: 'scifi_mystic_tech' },
  { id: 'cosmic-horror-lovecraftian', label: 'Kinh dị vũ trụ Lovecraftian', categoryId: 'scifi_mystic_tech' },

  // Nhóm 3: Thương mại, Thời trang & Triển lãm
  { id: 'high-fashion-editorial', label: 'Thời trang cao cấp Haute Couture', categoryId: 'fashion_commercial' },
  { id: 'luxury-minimalist-gallery', label: 'Triển lãm nghệ thuật tối giản', categoryId: 'fashion_commercial' },
  { id: 'vintage-parisian-couture', label: 'Thời trang cổ điển Paris', categoryId: 'fashion_commercial' },
  { id: 'futuristic-avant-garde', label: 'Thời trang vị lai Avant-Garde', categoryId: 'fashion_commercial' },
  { id: 'commercial-product-cinematic', label: 'Quảng cáo thương mại điện ảnh', categoryId: 'fashion_commercial' },
  { id: 'neon-runway-glow', label: 'Sàn diễn thời trang ánh sáng Neon', categoryId: 'fashion_commercial' },
  { id: 'pop-art-color-block', label: 'Phong cách Pop Art tương phản khối', categoryId: 'fashion_commercial' },

  // Nhóm 4: Đời sống Thực tế & Con người
  { id: 'documentary-natgeo-human', label: 'Phóng sự nhân văn NatGeo', categoryId: 'human_real_life' },
  { id: 'warm-family-nostalgia', label: 'Ký ức gia đình ấm áp', categoryId: 'human_real_life' },
  { id: 'street-life-candid', label: 'Khoảnh khắc đường phố chân thực', categoryId: 'human_real_life' },
  { id: 'cozy-coffee-indie', label: 'Quán cà phê Indie chiều mưa', categoryId: 'human_real_life' },
  { id: 'coastal-fishing-village', label: 'Làng chài ven biển mộc mạc', categoryId: 'human_real_life' },
  { id: 'workshop-artisan-craft', label: 'Nghệ nhân xưởng thủ công', categoryId: 'human_real_life' },
  { id: 'autumn-golden-hour', label: 'Hoàng hôn mùa thu rực rỡ', categoryId: 'human_real_life' },
  { id: 'visual-diary-pov', label: 'Nhật ký thị giác góc nhìn POV', categoryId: 'human_real_life' },
  { id: 'fly-on-the-wall-doc', label: 'Tài liệu ẩn mình quan sát tự nhiên', categoryId: 'human_real_life' },
  { id: 'raw-transparent-portrait', label: 'Chân dung mộc nguyên bản tả thực', categoryId: 'human_real_life' },
  { id: 'candid-unscripted-moments', label: 'Bắt khoảnh khắc tức thì ngẫu hứng', categoryId: 'human_real_life' },

  // Nhóm 5: Đô thị, Văn hóa & Xã hội
  { id: 'cyber-tokyo-night', label: 'Đêm đô thị Tokyo lung linh', categoryId: 'urban_culture' },
  { id: 'traditional-heritage-festive', label: 'Lễ hội văn hóa truyền thống', categoryId: 'urban_culture' },
  { id: 'monochrome-noir-city', label: 'Phim Noir đô thị đen trắng', categoryId: 'urban_culture' },
  { id: 'subway-metro-commute', label: 'Chuyến tàu điện ngầm đô thị', categoryId: 'urban_culture' },
  { id: 'ancient-temple-zen', label: 'Chùa cổ thanh tịnh thiền định', categoryId: 'urban_culture' },
  { id: 'brutalist-concrete-architecture', label: 'Kiến trúc bê tông Brutalism', categoryId: 'urban_culture' },
  { id: 'carnival-vintage-fair', label: 'Hội chợ đêm Vintage lung linh', categoryId: 'urban_culture' },
  { id: 'raw-urban-workforce', label: 'Hiện thực đô thị lao động đời thường', categoryId: 'urban_culture' },

  // Nhóm 6: Không gian, Ẩm thực & Thể thao
  { id: 'deep-space-nebula', label: 'Tinh vân vũ trụ sâu thẳm', categoryId: 'space_food_sports' },
  { id: 'culinary-dark-moody', label: 'Nhiếp ảnh ẩm thực Dark Moody', categoryId: 'space_food_sports' },
  { id: 'street-food-night-market', label: 'Chợ đêm ẩm thực đường phố', categoryId: 'space_food_sports' },
  { id: 'extreme-sports-action', label: 'Thể thao mạo hiểm tốc độ cao', categoryId: 'space_food_sports' },
  { id: 'stadium-epic-championship', label: 'Sân vận động đêm chung kết', categoryId: 'space_food_sports' },
  { id: 'fine-dining-michelin', label: 'Ẩm thực cao cấp Michelin', categoryId: 'space_food_sports' },
  { id: 'zen-tea-ceremony', label: 'Trà đạo thiền tịnh', categoryId: 'space_food_sports' },
]

export const EPISODE_COUNT_PRESETS = [1, 12, 24, 36, 48] as const

export function getImageStyleLabel(styleId: string | undefined | null, locale?: string): string | null {
  if (!styleId) return null
  const activeLoc = (locale as 'vi' | 'en' | 'zh') || getActiveLocale()
  const m = messages[activeLoc] as unknown as { drama?: { imageStyles?: Record<string, string> } }
  const localized = m?.drama?.imageStyles?.[styleId]
  if (localized) return localized
  // Fallback to Vietnamese if available, else options label
  const viLabel = (messages.vi as unknown as { drama?: { imageStyles?: Record<string, string> } })?.drama?.imageStyles?.[styleId]
  if (viLabel) return viLabel
  return IMAGE_STYLE_OPTIONS.find((o) => o.id === styleId)?.label ?? null
}
