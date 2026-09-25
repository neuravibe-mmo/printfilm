/** 帮助中心共用文案：分类、上手步骤、常见问题 */
import { getActiveLocale } from '../i18n/detect'

export type HelpFaqItem = {
  q: string
  a: string
}

export type HelpCatItem = {
  id: string
  title: string
  desc: string
  href: string
}

export type HelpGuideStep = {
  n: string
  title: string
  body: string
}

const HELP_CATS_ZH: HelpCatItem[] = [
  { id: 'start', title: '快速开始', desc: '工作台选产品入口', href: '/' },
  { id: 'drama', title: '漫剧创作', desc: '剧本 · 分集 · 成片', href: '/drama' },
  { id: 'kepu', title: 'AI短视频', desc: '分镜流水线与成片', href: '/history' },
  { id: 'tools', title: '创作工具', desc: '文生图 / 图生图 / 视频', href: '/tools' },
  { id: 'settings', title: '个人中心', desc: '项目 · 记录 · 下载', href: '/settings?tab=tools' },
  { id: 'billing', title: '充值说明', desc: '按量计费，余额永久有效', href: '/pricing' },
]

const HELP_CATS_VI: HelpCatItem[] = [
  { id: 'start', title: 'Bắt đầu nhanh', desc: 'Chọn sản phẩm trong bàn làm việc', href: '/' },
  { id: 'drama', title: 'Sáng tác phim hoạt hình', desc: 'Kịch bản · Tập phim · Thành phẩm', href: '/drama' },
  { id: 'kepu', title: 'Video AI ngắn', desc: 'Pipeline phân cảnh và thành phẩm', href: '/history' },
  { id: 'tools', title: 'Công cụ sáng tác', desc: 'Text-to-Image / Image-to-Image / Video', href: '/tools' },
  { id: 'settings', title: 'Hồ sơ cá nhân', desc: 'Dự án · Lịch sử · Tải xuống', href: '/settings?tab=tools' },
  { id: 'billing', title: 'Hướng dẫn nạp tiền', desc: 'Tính phí theo lượng, số dư không hết hạn', href: '/pricing' },
]

const HELP_CATS_EN: HelpCatItem[] = [
  { id: 'start', title: 'Quick start', desc: 'Pick a product in the studio', href: '/' },
  { id: 'drama', title: 'AI drama', desc: 'Script · Episodes · Film', href: '/drama' },
  { id: 'kepu', title: 'AI short video', desc: 'Board pipeline and film', href: '/history' },
  { id: 'tools', title: 'Creation tools', desc: 'T2I / I2I / Video', href: '/tools' },
  { id: 'settings', title: 'Account', desc: 'Projects · History · Downloads', href: '/settings?tab=tools' },
  { id: 'billing', title: 'Top-up', desc: 'Usage billing, no expiry', href: '/pricing' },
]

export function getHelpCats(): HelpCatItem[] {
  const locale = getActiveLocale()
  if (locale === 'vi') return HELP_CATS_VI
  if (locale === 'en') return HELP_CATS_EN
  return HELP_CATS_ZH
}

/** @deprecated use getHelpCats() */
export const HELP_CATS: HelpCatItem[] = new Proxy([] as HelpCatItem[], {
  get(_, prop) {
    const arr = getHelpCats()
    if (prop === 'length') return arr.length
    if (typeof prop === 'string' && !isNaN(Number(prop))) return arr[Number(prop)]
    return (arr as unknown as Record<string | symbol, unknown>)[prop]
  },
})

const HELP_GUIDE_STEPS_ZH: HelpGuideStep[] = [
  {
    n: '01',
    title: '选创作入口',
    body: '工作台进入「AI 漫剧」或「AI短视频」；单点能力也可从顶栏「工具」进入文生图、图生图、文生视频等。',
  },
  {
    n: '02',
    title: '配置并生成',
    body: '漫剧：创意 → 大纲 → 资产 → 分集；AI短视频：主题 → 风格 → 分镜 → 成片；工具：填提示词或上传素材后点生成。',
  },
  {
    n: '03',
    title: '审阅与迭代',
    body: '漫剧 / AI短视频可单镜重绘、重生视频或重配音，不必整片重做。工具结果可在工作台预览后再次生成。',
  },
  {
    n: '04',
    title: '保存与下载',
    body: '结果会写入云端存储。AI短视频在历史页下载；漫剧在项目工作台查看；工具创作在个人中心查看详情并下载。',
  },
]

const HELP_GUIDE_STEPS_VI: HelpGuideStep[] = [
  {
    n: '01',
    title: 'Chọn điểm vào sáng tác',
    body: 'Vào bàn làm việc chọn "Phim hoạt hình AI" hoặc "Video AI ngắn"; các công cụ đơn lẻ có thể truy cập từ "Công cụ" trên thanh điều hướng: Text-to-Image, Image-to-Image, Video, v.v.',
  },
  {
    n: '02',
    title: 'Cấu hình và tạo',
    body: 'Phim hoạt hình: Ý tưởng → Đề cương → Tài sản → Tập phim; Video AI: Chủ đề → Phong cách → Phân cảnh → Thành phẩm; Công cụ: nhập prompt hoặc tải tài nguyên rồi nhấn Tạo.',
  },
  {
    n: '03',
    title: 'Xem lại và tinh chỉnh',
    body: 'Phim hoạt hình / Video AI có thể vẽ lại cảnh đơn, tạo lại video hoặc lồng tiếng lại, không cần làm lại toàn bộ phim. Kết quả công cụ có thể xem trước trong bàn làm việc rồi tạo lại.',
  },
  {
    n: '04',
    title: 'Lưu và tải xuống',
    body: 'Kết quả được lưu vào cloud. Video AI ngắn tải xuống tại trang Lịch sử; Phim hoạt hình xem trong bàn làm việc dự án; Sáng tác công cụ xem chi tiết và tải xuống tại Hồ sơ cá nhân.',
  },
]

const HELP_GUIDE_STEPS_EN: HelpGuideStep[] = [
  {
    n: '01',
    title: 'Pick an entry point',
    body: 'Open the studio and choose AI drama or AI short video. Single tools are in the top-bar Tools menu: text-to-image, image-to-image, text-to-video, etc.',
  },
  {
    n: '02',
    title: 'Configure and generate',
    body: 'Drama: idea → outline → assets → episodes. Short video: topic → style → boards → film. Tools: fill in a prompt or upload assets, then click generate.',
  },
  {
    n: '03',
    title: 'Review and iterate',
    body: 'Drama and short video support per-shot regeneration of still, video, or voice without remaking the film. Tool results can be previewed in the studio before re-generating.',
  },
  {
    n: '04',
    title: 'Save and download',
    body: 'Results are saved to cloud storage. Short video: download from History. Drama: check in the project workspace. Tool runs: view details and download in Account.',
  },
]

export function getHelpGuideSteps(): HelpGuideStep[] {
  const locale = getActiveLocale()
  if (locale === 'vi') return HELP_GUIDE_STEPS_VI
  if (locale === 'en') return HELP_GUIDE_STEPS_EN
  return HELP_GUIDE_STEPS_ZH
}

/** @deprecated use getHelpGuideSteps() */
export const HELP_GUIDE_STEPS: HelpGuideStep[] = new Proxy([] as HelpGuideStep[], {
  get(_, prop) {
    const arr = getHelpGuideSteps()
    if (prop === 'length') return arr.length
    if (typeof prop === 'string' && !isNaN(Number(prop))) return arr[Number(prop)]
    return (arr as unknown as Record<string | symbol, unknown>)[prop]
  },
})

const HELP_FAQ_ITEMS_ZH: HelpFaqItem[] = [
  {
    q: '第一次使用从哪开始？',
    a: '打开工作台，选择「AI 漫剧」或「AI短视频」。漫剧适合分集叙事与角色一致性；AI短视频定位获客，适合卖点讲解与分镜流水线。若只要单张图或短片段，可直接进入「工具」。',
  },
  {
    q: '「AI 视频」和「静图成片」有什么区别？',
    a: 'AI 视频镜头运动更强、成本更高；静图成片（图文视频）以画面 + 旁白为主，更快更稳，适合讲解类获客短片。新建 AI短视频项目时按需求选择即可。',
  },
  {
    q: '生成中可以离开页面吗？',
    a: '可以。任务在服务端继续执行。AI短视频可回历史页看进度；漫剧回对应项目工作台；工具视频任务请尽量停留在当前页等待完成，或稍后在个人中心查看状态。',
  },
  {
    q: '工具中心能做什么？',
    a: '已开放文生图、图生图、图生产品、文生视频、视频生视频与电商拼图。登录后进入「工具」选择对应能力，填写提示词或上传素材即可生成。',
  },
  {
    q: '工具生成结果保存在哪里？',
    a: '每次成功生成都会写入创作记录，媒体文件同步到云端对象存储（OSS）。可在头像 → 个人中心 →「工具创作」查看封面、状态与提示词。',
  },
  {
    q: '如何查看和下载工具结果？',
    a: '打开个人中心「工具创作」，点击「查看」可预览大图或视频；点击「下载」将从云端地址保存到本地。生成页右侧成功后也会提示可前往个人中心回看。',
  },
  {
    q: '成片或素材在哪里下载？',
    a: 'AI短视频：顶栏「AI短视频」历史页，已完成项目可下载或打包。漫剧：进入对应项目工作台查看分镜与成片。全局资产：顶栏「资产」管理角色、场景、道具与音色。',
  },
  {
    q: '个人中心有哪些内容？',
    a: '包含账号信息、漫剧项目、AI短视频历史、工具创作记录、资产管理入口，以及订阅与余额。团队、API、通知偏好等能力仍在建设中。',
  },
  {
    q: '如何充值？余额怎么扣？',
    a: '打开「定价」选择充值档位，支持支付宝与微信支付；未登录会先引导登录。按实际调用量扣费，余额永久有效，无强制订阅。用量可在定价页或个人中心「订阅与余额」查看。',
  },
  {
    q: '生成失败或画面不符合预期怎么办？',
    a: '可调整提示词、反向提示词或参考图后重试；漫剧 / AI短视频支持单镜重生。若反复失败，请检查网络与余额，或稍后重试。敏感内容可能被模型安全策略拦截。',
  },
]

const HELP_FAQ_ITEMS_VI: HelpFaqItem[] = [
  {
    q: 'Lần đầu dùng nên bắt đầu từ đâu?',
    a: 'Mở bàn làm việc, chọn "Phim hoạt hình AI" hoặc "Video AI ngắn". Phim hoạt hình phù hợp với kể chuyện nhiều tập và nhất quán nhân vật; Video AI ngắn định vị thu hút khách, phù hợp giải thích điểm bán và pipeline phân cảnh. Nếu chỉ cần ảnh đơn hoặc đoạn clip ngắn, có thể vào thẳng "Công cụ".',
  },
  {
    q: '"Video AI" và "Ảnh tĩnh thành phim" khác nhau thế nào?',
    a: 'Video AI chuyển động camera mạnh hơn, chi phí cao hơn; Ảnh tĩnh thành phim (video hình ảnh + lời dẫn) nhanh hơn và ổn định hơn, phù hợp với video ngắn giải thích và thu hút khách. Khi tạo dự án Video AI mới, chọn theo nhu cầu.',
  },
  {
    q: 'Đang tạo có thể rời trang không?',
    a: 'Có thể. Tác vụ tiếp tục chạy trên máy chủ. Video AI ngắn có thể quay lại trang Lịch sử để xem tiến độ; Phim hoạt hình quay về bàn làm việc dự án tương ứng; Tác vụ video công cụ nên cố gắng ở lại trang hiện tại chờ hoàn thành, hoặc xem trạng thái sau tại Hồ sơ cá nhân.',
  },
  {
    q: 'Trung tâm công cụ có thể làm gì?',
    a: 'Đã mở: Text-to-Image, Image-to-Image, Image-to-Product, Text-to-Video, Video-to-Video và ghép ảnh thương mại. Đăng nhập rồi vào "Công cụ" chọn năng lực tương ứng, nhập prompt hoặc tải tài nguyên là tạo được.',
  },
  {
    q: 'Kết quả tạo từ công cụ được lưu ở đâu?',
    a: 'Mỗi lần tạo thành công đều được ghi vào lịch sử sáng tác, file media đồng bộ lên cloud object storage (OSS). Có thể xem thumbnail, trạng thái và prompt tại Avatar → Hồ sơ cá nhân → "Sáng tác công cụ".',
  },
  {
    q: 'Làm thế nào xem và tải kết quả công cụ?',
    a: 'Mở Hồ sơ cá nhân mục "Sáng tác công cụ", nhấn "Xem" để xem trước ảnh lớn hoặc video; nhấn "Tải xuống" sẽ lưu từ địa chỉ cloud về máy. Sau khi tạo thành công bên phải trang tạo cũng sẽ gợi ý đến Hồ sơ cá nhân để xem lại.',
  },
  {
    q: 'Tải thành phẩm hoặc tài nguyên ở đâu?',
    a: 'Video AI ngắn: trang Lịch sử "Video AI ngắn" trên thanh điều hướng, dự án đã hoàn thành có thể tải xuống hoặc đóng gói. Phim hoạt hình: vào bàn làm việc dự án tương ứng xem phân cảnh và thành phẩm. Tài sản toàn cục: "Tài sản" trên thanh điều hướng quản lý nhân vật, cảnh, đạo cụ và giọng đọc.',
  },
  {
    q: 'Hồ sơ cá nhân có những gì?',
    a: 'Bao gồm thông tin tài khoản, dự án phim hoạt hình, lịch sử Video AI ngắn, lịch sử sáng tác công cụ, điểm vào quản lý tài sản, và đăng ký & số dư. Các tính năng như nhóm, API, tùy chọn thông báo vẫn đang phát triển.',
  },
  {
    q: 'Nạp tiền như thế nào? Số dư trừ như thế nào?',
    a: 'Mở "Định giá" chọn mức nạp, hỗ trợ Alipay và WeChat Pay; chưa đăng nhập sẽ được hướng dẫn đăng nhập trước. Trừ phí theo lượng gọi thực tế, số dư không hết hạn, không có đăng ký bắt buộc. Lượng sử dụng có thể xem tại trang Định giá hoặc Hồ sơ cá nhân mục "Đăng ký & Số dư".',
  },
  {
    q: 'Tạo thất bại hoặc hình ảnh không như mong đợi thì làm gì?',
    a: 'Có thể điều chỉnh prompt, prompt phủ định hoặc ảnh tham chiếu rồi thử lại; Phim hoạt hình / Video AI ngắn hỗ trợ tạo lại từng cảnh. Nếu liên tục thất bại, kiểm tra mạng và số dư, hoặc thử lại sau. Nội dung nhạy cảm có thể bị chính sách an toàn của mô hình chặn.',
  },
]

const HELP_FAQ_ITEMS_EN: HelpFaqItem[] = [
  {
    q: 'Where do I start?',
    a: 'Open the studio and pick AI drama or AI short video. Drama suits multi-episode narrative and character consistency; short video targets lead-gen with a board pipeline. For a single image or clip, go straight to Tools.',
  },
  {
    q: 'What is the difference between AI video and stills-to-film?',
    a: 'AI video has stronger camera motion and higher cost. Stills-to-film (picture + narration) is faster and more stable, better for explainer lead-gen clips. Choose when creating a new project.',
  },
  {
    q: 'Can I leave the page while generating?',
    a: 'Yes. Tasks keep running on the server. Short video: check History. Drama: return to the project workspace. Tool video jobs: try to stay on the page, or check Account later.',
  },
  {
    q: 'What can I do in the tools hub?',
    a: 'Available now: text-to-image, image-to-image, image-to-product, text-to-video, video-to-video, and e-commerce stitch. Sign in, go to Tools, pick a capability, and fill in a prompt or upload assets.',
  },
  {
    q: 'Where are tool results saved?',
    a: 'Every successful generation is logged and the media file is synced to cloud storage. View the cover, status, and prompt in Account → Tool runs.',
  },
  {
    q: 'How do I view and download tool results?',
    a: 'Open Account → Tool runs, click View to preview the full image or video, click Download to save from the cloud URL. The generation page also links to Account after success.',
  },
  {
    q: 'Where do I download films or assets?',
    a: 'Short video: History page, finished projects can be downloaded or packed. Drama: open the project workspace for boards and film. Global assets: Assets in the top bar for characters, scenes, props, and voices.',
  },
  {
    q: 'What is in Account?',
    a: 'Account info, drama projects, short-video history, tool run history, asset management, and subscription & balance. Team, API, and notification preferences are still being built.',
  },
  {
    q: 'How do I top up? How is the balance deducted?',
    a: 'Open Pricing, choose an amount, pay with Alipay or WeChat Pay (login first if needed). Billed on actual usage; balance never expires; no forced subscription. Check usage on the Pricing page or in Account → Subscription & balance.',
  },
  {
    q: 'What do I do if generation fails or the output is not what I expected?',
    a: 'Adjust the prompt, negative prompt, or reference image and retry. Drama and short video support per-shot regeneration. If it keeps failing, check your network and balance, or retry later. Sensitive content may be blocked by model safety policies.',
  },
]

export function getHelpFaqItems(): HelpFaqItem[] {
  const locale = getActiveLocale()
  if (locale === 'vi') return HELP_FAQ_ITEMS_VI
  if (locale === 'en') return HELP_FAQ_ITEMS_EN
  return HELP_FAQ_ITEMS_ZH
}

/** @deprecated use getHelpFaqItems() */
export const HELP_FAQ_ITEMS: HelpFaqItem[] = new Proxy([] as HelpFaqItem[], {
  get(_, prop) {
    const arr = getHelpFaqItems()
    if (prop === 'length') return arr.length
    if (typeof prop === 'string' && !isNaN(Number(prop))) return arr[Number(prop)]
    return (arr as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// 按关键词过滤常见问题
export function filterHelpFaq(items: HelpFaqItem[], raw: string): HelpFaqItem[] {
  const needle = raw.trim().toLowerCase()
  if (!needle) return items
  return items.filter(
    (item) => item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle),
  )
}
