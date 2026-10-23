import { notifyBillingErrorIfNeeded } from './billingError'
import { getActiveLocale } from '../i18n/detect'

type TranslationVal = string | ((m: RegExpMatchArray) => string)

type TranslationMap = {
  vi: TranslationVal
  en: TranslationVal
  zh?: TranslationVal
}

const ERROR_TRANSLATIONS: Array<[RegExp, TranslationMap]> = [
  // --- Video Generation & Flow Service ---
  [
    /NO_AT_TOKEN|Lỗi gửi lệnh tạo video.*NO_AT_TOKEN/i,
    {
      vi: 'Dịch vụ tạo video Google Veo tạm thời chưa khả dụng (thiếu hoặc hết hạn token xác thực trên máy chủ Flow). Vui lòng chuyển sang mô hình video khác (như Seedance 2.5) trong Cài đặt phong cách hoặc thử lại sau.',
      en: 'Google Veo video generation service is temporarily unavailable (missing or expired authentication token on Flow server). Please switch to another video model (such as Seedance 2.5) in Style settings or try again later.',
      zh: 'Google Veo 视频生成服务暂不可用（Flow 凭据缺失或过期）。请在风格配置中切换到其他视频模型（如 Seedance 2.5）或稍后重试。',
    },
  ],
  [
    /Flow HTTP (500|502|503|504)/i,
    {
      vi: 'Máy chủ tạo video Flow đang quá tải hoặc gặp sự cố kết nối. Vui lòng thử lại sau hoặc chuyển sang mô hình video khác (như Seedance 2.5).',
      en: 'Flow video server is temporarily overloaded or experiencing connection issues. Please try again later or switch to another video model (such as Seedance 2.5).',
      zh: 'Flow 视频服务器连接异常或过载。请稍后重试或切换至其他视频模型（如 Seedance 2.5）。',
    },
  ],
  [
    /未解析到可用文字模型.*TokenFree API Key/i,
    {
      vi: 'Chưa cấu hình mô hình văn bản khả dụng. Vui lòng điền TokenFree API Key trong trang quản trị, đồng bộ và chọn mô hình văn bản.',
      en: 'No available text model configured. Please enter TokenFree API Key in admin console, fetch and select a text model.',
      zh: '未解析到可用文字模型。请在管理控制台填写 TokenFree API Key，拉取并选择文字模型。',
    },
  ],
  [
    /未配置 OPENAI_API_KEY/i,
    {
      vi: 'Chưa cấu hình OPENAI_API_KEY, không thể gọi mô hình văn bản. Vui lòng điền TokenFree API Key và chọn mô hình văn bản trong trang quản trị.',
      en: 'OPENAI_API_KEY not configured. Please fill in TokenFree API Key and select text model in admin console.',
      zh: '未配置 OPENAI_API_KEY。请在管理控制台填写 TokenFree API Key 并选择文字模型。',
    },
  ],

  // --- Project / Studio Status & Lifecycle ---
  [
    /生成进行中，无法修改|Dự án đang trong quá trình tạo.*không thể (chỉnh )?sửa/i,
    {
      vi: 'Dự án đang trong quá trình tạo, không thể chỉnh sửa.',
      en: 'Generation in progress, cannot modify project.',
      zh: '生成进行中，无法修改',
    },
  ],
  [
    /生成进行中，无法更换封面/i,
    {
      vi: 'Dự án đang trong quá trình tạo, không thể thay đổi ảnh bìa.',
      en: 'Generation in progress, cannot change cover image.',
      zh: '生成进行中，无法更换封面',
    },
  ],
  [
    /生成进行中，请稍后|Tiến trình đang chạy.*vui lòng thử lại sau|Dự án đang tạo toàn bộ.*vui lòng thử lại sau/i,
    {
      vi: 'Tiến trình đang được tạo, vui lòng đợi trong giây lát.',
      en: 'Generation in progress, please wait.',
      zh: '生成进行中，请稍后',
    },
  ],
  [
    /素材已齐，请点击合成成片/i,
    {
      vi: 'Tất cả phân cảnh đã hoàn tất, vui lòng bấm "Ghép video hoàn chỉnh".',
      en: 'All assets ready, please click "Compose final video".',
      zh: '素材已齐，请点击合成成片',
    },
  ],
  [
    /当前状态不可取消/i,
    {
      vi: 'Trạng thái hiện tại không thể hủy bỏ.',
      en: 'Current status cannot be cancelled.',
      zh: '当前状态不可取消',
    },
  ],
  [
    /缺少分镜图或镜头视频，无法合成/i,
    {
      vi: 'Thiếu hình ảnh phân cảnh hoặc video phân cảnh, không thể ghép video.',
      en: 'Missing storyboard images or shot videos, unable to compose.',
      zh: '缺少分镜图或镜头视频，无法合成',
    },
  ],
  [
    /成片未完成，无法发布/i,
    {
      vi: 'Video hoàn chỉnh chưa hoàn thành, không thể xuất bản.',
      en: 'Final video not finished, unable to publish.',
      zh: '成片未完成，无法发布',
    },
  ],
  [
    /Dự án đang trong quá trình tạo video, không thể đổi ảnh/i,
    {
      vi: 'Dự án đang trong quá trình tạo video, không thể đổi ảnh.',
      en: 'Project is generating video, cannot change image.',
      zh: '项目正在生成视频中，无法更换图片',
    },
  ],

  // --- Project / Studio Form Validation ---
  [
    /无效模板/i,
    {
      vi: 'Mẫu phong cách không hợp lệ.',
      en: 'Invalid template.',
      zh: '无效模板',
    },
  ],
  [
    /无效封面地址/i,
    {
      vi: 'Địa chỉ ảnh bìa không hợp lệ.',
      en: 'Invalid cover URL.',
      zh: '无效封面地址',
    },
  ],
  [
    /无效图片模型/i,
    {
      vi: 'Mô hình ảnh không hợp lệ.',
      en: 'Invalid image model.',
      zh: '无效图片模型',
    },
  ],
  [
    /无效视频模型/i,
    {
      vi: 'Mô hình video không hợp lệ.',
      en: 'Invalid video model.',
      zh: '无效视频模型',
    },
  ],
  [
    /仅支持 JPG \/ PNG \/ WebP \/ GIF|Chỉ hỗ trợ.*JPG \/ PNG \/ WebP \/ GIF/i,
    {
      vi: 'Chỉ hỗ trợ định dạng ảnh JPG / PNG / WebP / GIF.',
      en: 'Only JPG / PNG / WebP / GIF formats are supported.',
      zh: '仅支持 JPG / PNG / WebP / GIF',
    },
  ],
  [
    /空文件|Tập tin rỗng/i,
    {
      vi: 'Tệp rỗng hoặc không có dữ liệu.',
      en: 'File is empty.',
      zh: '空文件',
    },
  ],
  [
    /封面不能超过 8MB|画面不能超过 8MB|Ảnh tham chiếu không được vượt quá 8MB/i,
    {
      vi: 'Kích thước ảnh không được vượt quá 8MB.',
      en: 'Image cannot exceed 8MB.',
      zh: '图片不能超过 8MB',
    },
  ],
  [
    /文件不能超过 20MB/i,
    {
      vi: 'Kích thước tệp không được vượt quá 20MB.',
      en: 'File cannot exceed 20MB.',
      zh: '文件不能超过 20MB',
    },
  ],
  [
    /文件不能超过 200KB/i,
    {
      vi: 'Kích thước tệp không được vượt quá 200KB.',
      en: 'File cannot exceed 200KB.',
      zh: '文件不能超过 200KB',
    },
  ],
  [
    /文件不是有效图片/i,
    {
      vi: 'Tệp tải lên không phải là hình ảnh hợp lệ.',
      en: 'File is not a valid image.',
      zh: '文件不是有效图片',
    },
  ],
  [
    /镜头列表不完整/i,
    {
      vi: 'Danh sách phân cảnh không đầy đủ.',
      en: 'Incomplete shot list.',
      zh: '镜头列表不完整',
    },
  ],
  [
    /分镜不存在|Cảnh không tồn tại/i,
    {
      vi: 'Phân cảnh không tồn tại.',
      en: 'Storyboard shot does not exist.',
      zh: '分镜不存在',
    },
  ],
  [
    /分集不存在/i,
    {
      vi: 'Tập phim không tồn tại.',
      en: 'Episode does not exist.',
      zh: '分集不存在',
    },
  ],
  [
    /剧本不存在/i,
    {
      vi: 'Kịch bản không tồn tại.',
      en: 'Script does not exist.',
      zh: '剧本不存在',
    },
  ],
  [
    /资产不存在/i,
    {
      vi: 'Tài nguyên không tồn tại.',
      en: 'Asset does not exist.',
      zh: '资产不存在',
    },
  ],
  [
    /项目不存在|Dự án không tồn tại/i,
    {
      vi: 'Dự án không tồn tại.',
      en: 'Project does not exist.',
      zh: '项目不存在',
    },
  ],
  [
    /请选择要下载的作品/i,
    {
      vi: 'Vui lòng chọn tác phẩm cần tải về.',
      en: 'Please select projects to download.',
      zh: '请选择要下载的作品',
    },
  ],
  [
    /一次最多打包 50 个/i,
    {
      vi: 'Mỗi lần chỉ có thể tải tối đa 50 tác phẩm.',
      en: 'Maximum 50 projects per package.',
      zh: '一次最多打包 50 个',
    },
  ],

  // --- Dynamic Episode / Script Warnings ---
  [
    /找不到第\s*(\d+)\s*集剧本/i,
    {
      vi: (m) => `Không tìm thấy kịch bản tập ${m[1]}.`,
      en: (m) => `Script for episode ${m[1]} not found.`,
      zh: (m) => `找不到第 ${m[1]} 集剧本`,
    },
  ],
  [
    /第\s*(\d+)\s*集正文过短/i,
    {
      vi: (m) => `Nội dung tập ${m[1]} quá ngắn, vui lòng hoàn thiện hoặc dùng AI tối ưu hóa trước khi vào phân cảnh.`,
      en: (m) => `Content of episode ${m[1]} is too short, please complete or AI-optimize it first.`,
      zh: (m) => `第 ${m[1]} 集正文过短，请完善后再进行分镜。`,
    },
  ],
  [
    /余额不足.*充值/i,
    {
      vi: 'Số dư hiện tại không đủ để bắt đầu tạo, vui lòng nạp thêm.',
      en: 'Current balance is insufficient to start generation, please top up.',
      zh: '当前余额不足，请充值后重试。',
    },
  ],

  // --- Script & Drama Workflow ---
  [
    /请先生成剧本摘要/i,
    {
      vi: 'Vui lòng tạo tóm tắt kịch bản trước.',
      en: 'Please generate script summary first.',
      zh: '请先生成剧本摘要',
    },
  ],
  [
    /请先生成分集剧本/i,
    {
      vi: 'Vui lòng tạo kịch bản tập trước.',
      en: 'Please generate episode script first.',
      zh: '请先生成分集剧本',
    },
  ],
  [
    /请先填写.*(创意或摘要|Ý tưởng)/i,
    {
      vi: 'Vui lòng điền ý tưởng hoặc tóm tắt của tập này trước.',
      en: 'Please fill in this episode creative or summary first.',
      zh: '请先填写本集创意或摘要',
    },
  ],
  [
    /请先输入.*剧本草稿/i,
    {
      vi: 'Vui lòng nhập bản thảo kịch bản tập này trước rồi để AI tối ưu.',
      en: 'Please enter this episode script draft before AI optimization.',
      zh: '请先输入本集剧本草稿',
    },
  ],
  [
    /请先有本集剧本内容/i,
    {
      vi: 'Vui lòng có nội dung kịch bản tập này trước rồi mới bổ sung ý tưởng và tóm tắt.',
      en: 'Please have episode script content before adding creative and summary.',
      zh: '请先有本集剧本内容',
    },
  ],
  [
    /全集剧本正在生成/i,
    {
      vi: 'Kịch bản toàn tập đang được tạo, vui lòng chờ hoàn thành trước khi thêm tập mới.',
      en: 'All episode scripts are generating, please wait until complete before adding episodes.',
      zh: '全集剧本正在生成，请稍后',
    },
  ],
  [
    /资产抽取进行中，请稍后再确认/i,
    {
      vi: 'Đang trích xuất tài nguyên, vui lòng chờ trong giây lát.',
      en: 'Asset extraction in progress, please wait.',
      zh: '资产抽取进行中，请稍后再确认',
    },
  ],
  [
    /本集含已生成视频或手改分镜，请确认后强制重新分镜/i,
    {
      vi: 'Tập này đã có video hoặc phân cảnh sửa thủ công, vui lòng xác nhận để tạo lại phân cảnh.',
      en: 'Episode contains generated videos or edited shots, please confirm to regenerate.',
      zh: '本集含已生成视频或手改分镜，请确认后强制重新分镜',
    },
  ],
  [
    /分镜正在生成，请完成后再切换版本/i,
    {
      vi: 'Phân cảnh đang được tạo, vui lòng đợi hoàn tất trước khi đổi phiên bản.',
      en: 'Storyboard is generating, please wait before switching version.',
      zh: '分镜正在生成，请完成后再切换版本',
    },
  ],
  [
    /所选分镜正在生成，请等待完成后再试/i,
    {
      vi: 'Các phân cảnh đã chọn đang được tạo, vui lòng đợi hoàn tất rồi thử lại.',
      en: 'Selected shots are generating, please wait until complete.',
      zh: '所选分镜正在生成，请等待完成后再试',
    },
  ],
  [
    /已开启尾帧衔接：请先生成上一镜并等待尾帧就绪后，再点本镜生成/i,
    {
      vi: 'Đã bật nối khung hình cuối: vui lòng tạo cảnh trước và đợi khung hình cuối sẵn sàng.',
      en: 'Tail frame transition enabled: please generate the previous shot first.',
      zh: '已开启尾帧衔接：请先生成上一镜并等待尾帧就绪后，再点本镜生成',
    },
  ],
  [
    /形象生成中，请稍后再更换图片/i,
    {
      vi: 'Hình ảnh nhân vật đang tạo, vui lòng đợi hoàn tất trước khi đổi ảnh.',
      en: 'Avatar generation in progress, please wait before changing image.',
      zh: '形象生成中，请稍后再更换图片',
    },
  ],
  [
    /形象生成中，无法切换历史版本/i,
    {
      vi: 'Hình ảnh nhân vật đang tạo, không thể chuyển đổi phiên bản lịch sử.',
      en: 'Avatar generation in progress, cannot switch history version.',
      zh: '形象生成中，无法切换历史版本',
    },
  ],
  [
    /仅支持角色资产/i,
    {
      vi: 'Chỉ hỗ trợ tài nguyên kiểu nhân vật.',
      en: 'Only character assets are supported.',
      zh: '仅支持角色资产',
    },
  ],
  [
    /缺少 prompt|缺少 voice_prompt|缺少剧本/i,
    {
      vi: 'Thiếu mô tả gợi ý (prompt) hoặc kịch bản cần thiết.',
      en: 'Missing prompt or script.',
      zh: '缺少必要参数或剧本',
    },
  ],
  [
    /原始创意至少需要 20 个字|创意文案至少 20 字/i,
    {
      vi: 'Ý tưởng sáng tạo cần có ít nhất 20 ký tự.',
      en: 'Creative concept must be at least 20 characters.',
      zh: '创意文案至少 20 字',
    },
  ],
  [
    /AI 生成失败|AI tạo mô tả.*thất bại/i,
    {
      vi: 'AI tạo nội dung thất bại, vui lòng thử lại sau.',
      en: 'AI generation failed, please try again later.',
      zh: 'AI 生成失败，请稍后重试',
    },
  ],

  // --- Skills & OSS ---
  [
    /Skill 不存在/i,
    {
      vi: 'Kỹ năng (Skill) không tồn tại.',
      en: 'Skill does not exist.',
      zh: 'Skill 不存在',
    },
  ],
  [
    /不能修改他人 Skill/i,
    {
      vi: 'Không thể chỉnh sửa Skill của người khác.',
      en: 'Cannot modify another user\'s skill.',
      zh: '不能修改他人 Skill',
    },
  ],
  [
    /系统内置 Skill 不能删除/i,
    {
      vi: 'Skill mặc định của hệ thống không thể xóa, chỉ có thể tắt.',
      en: 'System built-in skills cannot be deleted.',
      zh: '系统内置 Skill 不能删除',
    },
  ],
  [
    /不能删除他人 Skill/i,
    {
      vi: 'Không thể xóa Skill của người khác.',
      en: 'Cannot delete another user\'s skill.',
      zh: '不能删除他人 Skill',
    },
  ],
  [
    /OSS 未启用，无法上传资产媒体/i,
    {
      vi: 'Dịch vụ lưu trữ OSS chưa được kích hoạt, không thể tải lên tệp tin.',
      en: 'OSS storage not enabled, cannot upload media assets.',
      zh: 'OSS 未启用，无法上传资产媒体',
    },
  ],

  // --- Auth & Account ---
  [
    /登录已失效|登录过期|登录已过期|未登录或登录已失效/i,
    {
      vi: 'Đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      en: 'Login session has expired, please log in again.',
      zh: '登录已过期，请重新登录。',
    },
  ],
  [
    /未登录/i,
    {
      vi: 'Chưa đăng nhập, vui lòng đăng nhập để tiếp tục.',
      en: 'Not logged in, please log in to continue.',
      zh: '未登录，请先登录。',
    },
  ],
  [
    /邮箱或密码错误/i,
    {
      vi: 'Email hoặc mật khẩu không chính xác.',
      en: 'Incorrect email or password.',
      zh: '邮箱或密码错误',
    },
  ],
  [
    /邮箱已注册|该邮箱已被使用/i,
    {
      vi: 'Email này đã được đăng ký hoặc sử dụng.',
      en: 'This email is already in use.',
      zh: '该邮箱已被使用',
    },
  ],
  [
    /当前密码不正确/i,
    {
      vi: 'Mật khẩu hiện tại không chính xác.',
      en: 'Current password is incorrect.',
      zh: '当前密码不正确',
    },
  ],
  [
    /新密码不能与当前密码相同/i,
    {
      vi: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      en: 'New password cannot be the same as the current password.',
      zh: '新密码不能与当前密码相同',
    },
  ],
  [
    /缺少.*API Key/i,
    {
      vi: 'Thiếu API Key.',
      en: 'Missing API Key.',
      zh: '缺少 API Key',
    },
  ],
  [
    /API Key.*(无效|已撤销)/i,
    {
      vi: 'API Key không hợp lệ hoặc đã bị thu hồi.',
      en: 'API Key is invalid or has been revoked.',
      zh: 'API Key 无效或已撤销',
    },
  ],
  [
    /需要管理员权限|该账号没有管理员权限/i,
    {
      vi: 'Cần có quyền quản trị viên.',
      en: 'Admin privileges required.',
      zh: '需要管理员权限',
    },
  ],
  [
    /用户不存在/i,
    {
      vi: 'Tài khoản không tồn tại.',
      en: 'User does not exist.',
      zh: '用户不存在',
    },
  ],
  [
    /用户已被禁用/i,
    {
      vi: 'Tài khoản đã bị vô hiệu hóa.',
      en: 'User has been disabled.',
      zh: '用户已被禁用',
    },
  ],
]

export function localizeErrorMessage(raw: string): string {
  const locale = getActiveLocale()
  let text = String(raw || '').trim()

  if (text.startsWith('RuntimeError:')) {
    text = text.substring('RuntimeError:'.length).trim()
  } else if (text.startsWith('Error:')) {
    text = text.substring('Error:'.length).trim()
  }

  const detailMatch = text.match(/\{["']detail["']\s*:\s*["']([^"']+)["']\}/)
  if (detailMatch) {
    text = detailMatch[1]
  }

  for (const [regex, map] of ERROR_TRANSLATIONS) {
    const match = text.match(regex)
    if (match) {
      const getVal = (val: TranslationVal | undefined) =>
        typeof val === 'function' ? val(match) : val
      if (locale === 'vi') return getVal(map.vi) || text
      if (locale === 'en') return getVal(map.en) || text
      return getVal(map.zh) || text
    }
  }

  return text
}

/** Phân tích chi tiết FastAPI và đưa ra; 402 / Hướng dẫn nạp tiền hiện lên khi số dư không đủ */
export function throwApiError(status: number, detail: unknown, fallback?: string): never {
  const locale = getActiveLocale()
  const defaultFallback = locale === 'vi' ? 'Yêu cầu thất bại' : locale === 'en' ? 'Request failed' : '请求失败'
  const fb = fallback || defaultFallback
  const rawMessage =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ')
        : fb
  const message = localizeErrorMessage(rawMessage || fb)
  notifyBillingErrorIfNeeded(status, message)
  throw new Error(message)
}
