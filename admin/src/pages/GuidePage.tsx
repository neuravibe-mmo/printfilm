import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Cpu,
  CreditCard,
  Film,
  Layers,
  TrendingUp,
  Shapes,
  Search,
  Lightbulb,
} from "lucide-react";
import { useI18n } from "@/i18n/useI18n";
import { cn } from "@/lib/utils";

type CategoryId = "all" | "ai" | "payment" | "drama" | "templates" | "queues" | "finance";

type GuideStep = {
  num: number;
  title: string;
  desc: string;
  codeOrKey?: string;
};

type GuideItem = {
  id: string;
  category: CategoryId;
  icon: typeof BookOpen;
  title: string;
  summary: string;
  estimatedTime: string;
  targetLink: string;
  targetLinkLabel: string;
  proTip?: string;
  steps: GuideStep[];
};

export function GuidePage() {
  const { locale } = useI18n();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("ai-routing");

  const categories = useMemo(() => {
    if (locale === "vi") {
      return [
        { id: "all" as CategoryId, label: "Tất cả hướng dẫn" },
        { id: "ai" as CategoryId, label: "Định tuyến AI" },
        { id: "payment" as CategoryId, label: "Cổng thanh toán & Giá" },
        { id: "drama" as CategoryId, label: "Sản xuất Phim Drama" },
        { id: "templates" as CategoryId, label: "Mẫu Video Song ngữ" },
        { id: "queues" as CategoryId, label: "Hàng đợi & Tạm giữ" },
        { id: "finance" as CategoryId, label: "Tài chính & Đối soát" },
      ];
    }
    if (locale === "en") {
      return [
        { id: "all" as CategoryId, label: "All Guides" },
        { id: "ai" as CategoryId, label: "AI Routing" },
        { id: "payment" as CategoryId, label: "Payment & Pricing" },
        { id: "drama" as CategoryId, label: "Short Drama Studio" },
        { id: "templates" as CategoryId, label: "Bilingual Templates" },
        { id: "queues" as CategoryId, label: "Queues & Pre-auth" },
        { id: "finance" as CategoryId, label: "Finance & Audit" },
      ];
    }
    return [
      { id: "all" as CategoryId, label: "全部指南" },
      { id: "ai" as CategoryId, label: "AI 路由配置" },
      { id: "payment" as CategoryId, label: "支付与加价" },
      { id: "drama" as CategoryId, label: "漫剧生产流程" },
      { id: "templates" as CategoryId, label: "双语模板管理" },
      { id: "queues" as CategoryId, label: "队列与预扣" },
      { id: "finance" as CategoryId, label: "财务与对账" },
    ];
  }, [locale]);

  const guides: GuideItem[] = useMemo(() => {
    if (locale === "vi") {
      return [
        {
          id: "ai-routing",
          category: "ai",
          icon: Cpu,
          title: "1. Cấu hình Khóa API & Định tuyến Mô hình AI (TokenFree)",
          summary: "Kết nối hệ thống với TokenFree New API để cấp quyền sinh văn bản kịch bản, ảnh nhân vật và video AI.",
          estimatedTime: "3 phút",
          targetLink: "/settings",
          targetLinkLabel: "Mở Cài đặt hệ thống →",
          proTip: "TokenFree đóng vai trò là upstream gateway. Hãy đảm bảo tài khoản TokenFree còn đủ số dư USD/CNY trước khi mở hệ thống cho người dùng.",
          steps: [
            {
              num: 1,
              title: "Truy cập Cài đặt hệ thống",
              desc: "Vào menu 'Cài đặt hệ thống' ở thanh bên trái, chọn tab 'Định tuyến mô hình'.",
            },
            {
              num: 2,
              title: "Nhập TokenFree API Key & Kiểm tra số dư",
              desc: "Điền API Key do TokenFree cấp vào trường 'TokenFree API Key'. Bấm nút 'Kiểm tra số dư/Quota' để hệ thống xác thực và hiển thị số dư khả dụng.",
            },
            {
              num: 3,
              title: "Thiết lập mô hình mặc định cho từng tác vụ",
              desc: "Chọn mô hình AI tối ưu cho từng công đoạn: Kịch bản (GPT-4o/Claude-3.5), Sinh ảnh nhân vật (Midjourney/FLUX), Chuyển động video (Runway/Kling/Luma), và Giọng đọc (CosyVoice/TTS).",
            },
            {
              num: 4,
              title: "Lưu cấu hình",
              desc: "Bấm nút 'Lưu cài đặt' ở góc trên bên phải. Cấu hình mới sẽ có hiệu lực ngay lập tức cho toàn bộ các tác vụ mới.",
            },
          ],
        },
        {
          id: "pricing-markup",
          category: "payment",
          icon: CreditCard,
          title: "2. Cấu hình Thanh toán & Tỷ lệ Giá (Markup Rate)",
          summary: "Cài đặt cổng nạp Xu tự động cho người dùng và thiết lập hệ số nhân lợi nhuận cho từng mô hình AI.",
          estimatedTime: "2 phút",
          targetLink: "/settings",
          targetLinkLabel: "Mở Cấu hình thanh toán →",
          proTip: "100 fen = 1 Xu (hoặc 1 Credit). Hệ số nhân Markup 1.2 tương đương lợi nhuận gộp khoảng 16.7%, Markup 1.3 mang lại hơn 23% lợi nhuận.",
          steps: [
            {
              num: 1,
              title: "Mở tab Thanh toán trong Cài đặt",
              desc: "Vào 'Cài đặt hệ thống' → chọn tab 'Thanh toán'.",
            },
            {
              num: 2,
              title: "Cấu hình cổng thanh toán trực tuyến",
              desc: "Bật cổng thanh toán (Epay / QR Code / Chuyển khoản), điền mã đối tác Merchant ID và Khóa bí mật API.",
            },
            {
              num: 3,
              title: "Điều chỉnh hệ số nhân lợi nhuận (Markup)",
              desc: "Tại bảng giá mô hình, nhập hệ số nhân (VD: 1.25x). Giá khấu trừ người dùng sẽ tự động tính = Chi phí đối tác x Hệ số nhân.",
            },
            {
              num: 4,
              title: "Kiểm tra bảng quy đổi Xu thực tế",
              desc: "Rà soát cột 'Chi phí người dùng (Xu)' để đảm bảo mức giá hiển thị hợp lý và cạnh tranh trước khi lưu.",
            },
          ],
        },
        {
          id: "templates-management",
          category: "templates",
          icon: Shapes,
          title: "3. Quản lý & Xuất bản Mẫu Phim Song ngữ (Templates)",
          summary: "Tạo và biên tập các mẫu video có sẵn để người dùng có thể tạo phim nhanh với 1 cú click chuột.",
          estimatedTime: "4 phút",
          targetLink: "/templates",
          targetLinkLabel: "Mở Quản lý mẫu →",
          proTip: "Hệ thống hỗ trợ song ngữ hoàn toàn trong cơ sở dữ liệu: hãy luôn nhập cả hai trường Tiếng Việt và Tiếng Anh để người dùng nước ngoài trải nghiệm tốt nhất.",
          steps: [
            {
              num: 1,
              title: "Tạo mẫu mới hoặc sửa mẫu có sẵn",
              desc: "Vào mục 'Quản lý mẫu' trên menu, bấm nút 'Tạo mẫu mới' hoặc bấm nút Sửa trên thẻ mẫu hiện có.",
            },
            {
              num: 2,
              title: "Nhập thông tin song ngữ (Việt - Anh)",
              desc: "Điền Tên mẫu (Tiếng Việt & English), Mô tả ngắn gọn (Việt & Anh) và Danh mục (VD: Khoa học / Science, Cổ tích / Fairy Tale).",
            },
            {
              num: 3,
              title: "Thiết lập kịch bản mẫu & Tham số AI",
              desc: "Cấu hình kịch bản mẫu, Prompt tạo phong cách ảnh, tỷ lệ khung hình (16:9 cho máy tính/TV, 9:16 cho TikTok/Reels) và giọng đọc mặc định.",
            },
            {
              num: 4,
              title: "Tải ảnh bìa (Cover) & Đặt trạng thái Hiển thị",
              desc: "Tải ảnh đại diện mẫu sắc nét, chọn trạng thái 'Hoạt động / Công khai' và bấm 'Lưu mẫu'. Mẫu sẽ xuất hiện tức thì trên giao diện người dùng.",
            },
          ],
        },
        {
          id: "drama-production",
          category: "drama",
          icon: Film,
          title: "4. Quy trình Sản xuất Phim ngắn AI (Short Drama Studio)",
          summary: "Quy trình trọn vẹn 5 bước từ ý tưởng, kịch bản, tạo nhân vật đồng nhất đến render video hoàn chỉnh.",
          estimatedTime: "5 phút",
          targetLink: "/drama-projects",
          targetLinkLabel: "Mở Dự án phim ngắn →",
          proTip: "Tính nhất quán của nhân vật (Character Consistency) phụ thuộc vào ảnh chân dung gốc trong Thư viện tài sản. Hãy chọn góc chụp rõ mặt và chất lượng cao.",
          steps: [
            {
              num: 1,
              title: "Khởi tạo kịch bản & Phân tập (Episodes)",
              desc: "Tạo dự án phim mới, nhập tóm tắt cốt truyện. AI sẽ tự động phân bổ câu chuyện thành các tập (Episodes) và các phân cảnh con (Fragments).",
            },
            {
              num: 2,
              title: "Tạo nhân vật AI & Gán giọng đọc (Assets)",
              desc: "Trong Thư viện tài sản, tạo các nhân vật chính/phụ. Chọn phong cách ảnh (anime, 3D, chân thực) và gán mẫu giọng đọc AI (TTS) phù hợp.",
            },
            {
              num: 3,
              title: "Sinh ảnh phân cảnh (Storyboard Grid)",
              desc: "Xem từng câu thoại, AI tự động gợi ý góc máy và bối cảnh. Bấm 'Sinh ảnh hàng loạt' để tạo toàn bộ storyboard nhanh chóng.",
            },
            {
              num: 4,
              title: "Tạo chuyển động video (AI Video Motion)",
              desc: "Với các cảnh cao trào hoặc hành động, bấm biểu tượng 'Sinh video AI' từ ảnh tĩnh để tạo clip chuyển động 4s - 8s mượt mà.",
            },
            {
              num: 5,
              title: "Render & Xuất bản thành phẩm",
              desc: "Kiểm tra bản xem trước gồm hình ảnh, video, lồng tiếng và phụ đề tự động. Bấm 'Xuất video' để hệ thống tiến hành render file MP4 độ phân giải cao.",
            },
          ],
        },
        {
          id: "queues-billing-safety",
          category: "queues",
          icon: Layers,
          title: "5. Giám sát Hàng đợi & Cơ chế Tạm giữ / Hoàn tiền Tự động",
          summary: "Hiểu rõ vòng đời tác vụ chạy ngầm và cơ chế bảo vệ tài chính an toàn tuyệt đối cho người dùng.",
          estimatedTime: "3 phút",
          targetLink: "/queues",
          targetLinkLabel: "Mở Hàng đợi tác vụ →",
          proTip: "Người dùng không bao giờ bị mất tiền oan nếu tác vụ AI gặp sự cố. Hệ thống tự động hoàn 100% số Xu đã tạm giữ ngay khi task chuyển sang trạng thái failed.",
          steps: [
            {
              num: 1,
              title: "Theo dõi tiến trình tác vụ thời gian thực",
              desc: "Tại trang 'Hàng đợi tác vụ', quản trị viên có thể lọc theo trạng thái: Chờ xử lý (queued), Đang chạy (running), Thành công (succeeded) hoặc Thất bại (failed).",
            },
            {
              num: 2,
              title: "Cơ chế Tạm giữ số dư (Pre-authorization)",
              desc: "Khi người dùng bắt đầu sinh ảnh/video nặng, hệ thống tạm giữ (đóng băng) số Xu ước tính tối đa để đảm bảo tài khoản có đủ khả năng thanh toán.",
            },
            {
              num: 3,
              title: "Quyết toán theo mức dùng thực tế (Settlement)",
              desc: "Sau khi tác vụ kết thúc, hệ thống đối soát lượng Token/Model thực tế tiêu thụ, trừ số Xu chính xác và giải phóng phần Xu dư thừa lại ví người dùng.",
            },
            {
              num: 4,
              title: "Xử lý khi tác vụ Thất bại (Failed & Auto-Refund)",
              desc: "Nếu API AI bên thứ ba bị timeout hoặc trả lỗi, hệ thống tự động hoàn lại 100% số Xu đã tạm giữ. Bấm vào chi tiết tác vụ để xem mã lỗi chi tiết và log gọi API.",
            },
          ],
        },
        {
          id: "finance-audit",
          category: "finance",
          icon: TrendingUp,
          title: "6. Đối soát Tài chính & Giám sát Lợi nhuận (Finance Audit)",
          summary: "Kiểm soát doanh thu, chi phí gốc nhà cung cấp và tỷ suất lợi nhuận ròng của toàn hệ thống.",
          estimatedTime: "2 phút",
          targetLink: "/finance",
          targetLinkLabel: "Mở Trang tài chính →",
          proTip: "Dữ liệu chi phí TokenFree được cập nhật tự động. Bạn cũng có thể bấm 'Làm mới chi phí đối tác' bất cứ lúc nào để ép đồng bộ hóa đơn mới nhất.",
          steps: [
            {
              num: 1,
              title: "Chọn chu kỳ đối soát",
              desc: "Tại trang 'Tài chính', chọn bộ lọc thời gian: 7 ngày, 14 ngày, 30 ngày hoặc 90 ngày vừa qua.",
            },
            {
              num: 2,
              title: "Đối chiếu Doanh thu vs Chi phí thực tế",
              desc: "So sánh cột 'Khấu trừ (Xu)' (tiền thu từ user) với cột 'Chi phí thực tế (Xu)' (tiền thực trả cho TokenFree) để thấy lợi nhuận ròng từng ngày.",
            },
            {
              num: 3,
              title: "Giám sát tỷ suất lợi nhuận (Profit Margin)",
              desc: "Cột 'Lợi nhuận (Xu)' hiển thị số tiền lãi và phần trăm lợi nhuận màu xanh lá. Nếu tỷ lệ thấp hơn kỳ vọng, hãy cân nhắc tăng hệ số Markup trong Cài đặt.",
            },
            {
              num: 4,
              title: "Làm mới dữ liệu từ nhà cung cấp",
              desc: "Bấm nút 'Làm mới chi phí đối tác' ở góc trên bên phải bảng tài chính để kéo dữ liệu đối soát tức thì từ TokenFree New API.",
            },
          ],
        },
      ];
    }

    if (locale === "en") {
      return [
        {
          id: "ai-routing",
          category: "ai",
          icon: Cpu,
          title: "1. API Key & AI Model Routing Setup (TokenFree)",
          summary: "Connect your platform to TokenFree New API upstream to enable AI script writing, portrait rendering, and motion video generation.",
          estimatedTime: "3 min",
          targetLink: "/settings",
          targetLinkLabel: "Open System Settings →",
          proTip: "TokenFree serves as the upstream AI gateway. Make sure your TokenFree account balance is funded before opening access to end users.",
          steps: [
            {
              num: 1,
              title: "Open System Settings",
              desc: "Go to 'System Settings' on the left navigation bar and switch to the 'Model Routing' tab.",
            },
            {
              num: 2,
              title: "Enter TokenFree API Key & Test Quota",
              desc: "Paste your TokenFree API Key into the designated field. Click 'Check Quota / Balance' to verify connection and available upstream credits.",
            },
            {
              num: 3,
              title: "Set Default Models for Each Capability",
              desc: "Select the preferred model for each stage: Scripting (GPT-4o/Claude), Portrait (Midjourney/FLUX), Motion Video (Runway/Kling), and Narration (CosyVoice/TTS).",
            },
            {
              num: 4,
              title: "Save Configuration",
              desc: "Click 'Save Settings' at the top right. Changes will take effect immediately for all subsequent generation requests.",
            },
          ],
        },
        {
          id: "pricing-markup",
          category: "payment",
          icon: CreditCard,
          title: "2. Payment Gateways & Profit Markup Configuration",
          summary: "Configure automated user credit top-ups and set profit markups on AI model costs.",
          estimatedTime: "2 min",
          targetLink: "/settings",
          targetLinkLabel: "Open Payment Settings →",
          proTip: "100 fen = 1 Credit. A 1.25x markup yields approximately 20% gross margin.",
          steps: [
            {
              num: 1,
              title: "Navigate to Payment Settings",
              desc: "In 'System Settings', select the 'Payment' tab.",
            },
            {
              num: 2,
              title: "Enable Payment Gateways",
              desc: "Toggle active payment providers (Epay, QR, Wire Transfer) and enter Merchant ID & Secret Key.",
            },
            {
              num: 3,
              title: "Set Model Markup Rate",
              desc: "In the model rates table, configure markup multipliers (e.g., 1.25x). User Charge = Upstream Cost x Markup.",
            },
            {
              num: 4,
              title: "Review User-Facing Credit Pricing",
              desc: "Check the 'User Charge (Credits)' column to ensure pricing is competitive and profitable before saving.",
            },
          ],
        },
        {
          id: "templates-management",
          category: "templates",
          icon: Shapes,
          title: "3. Bilingual Template Creation & Publishing",
          summary: "Build ready-to-use video templates for users to create videos in 1-click.",
          estimatedTime: "4 min",
          targetLink: "/templates",
          targetLinkLabel: "Open Template Manager →",
          proTip: "Database columns support Vietnamese and English natively: fill in both language fields to serve global creators.",
          steps: [
            {
              num: 1,
              title: "Create or Edit a Template",
              desc: "Click 'Create Template' or click Edit on any existing template card in Template Management.",
            },
            {
              num: 2,
              title: "Fill in Bilingual Details",
              desc: "Enter template names, descriptions, and category tags in both Vietnamese and English.",
            },
            {
              num: 3,
              title: "Configure Prompt Presets & AI Options",
              desc: "Define storyline prompts, aspect ratio (16:9 or 9:16), visual style presets, and default voiceover profile.",
            },
            {
              num: 4,
              title: "Upload Cover & Publish",
              desc: "Upload a high-definition thumbnail cover, set status to Active, and save.",
            },
          ],
        },
        {
          id: "drama-production",
          category: "drama",
          icon: Film,
          title: "4. AI Short Drama Production Pipeline",
          summary: "The full 5-step workflow from storyline idea, consistent character generation, to finished HD export.",
          estimatedTime: "5 min",
          targetLink: "/drama-projects",
          targetLinkLabel: "Open Drama Projects →",
          proTip: "Character consistency relies on the base portrait stored in the Asset Library. Choose clean, front-facing reference images.",
          steps: [
            {
              num: 1,
              title: "Create Project & Break Down Script",
              desc: "Create a new project. Input your synopsis or full script. AI automatically divides it into Episodes and scene Fragments.",
            },
            {
              num: 2,
              title: "Generate Consistent Characters & Assign Voices",
              desc: "In the Asset Library, create characters, select a visual style, generate reference portraits, and link custom TTS voices.",
            },
            {
              num: 3,
              title: "Generate Storyboard Frames",
              desc: "Review scene prompts and camera angles. Click 'Batch Generate Images' to generate all scene frames.",
            },
            {
              num: 4,
              title: "Turn Key Frames into Motion Video",
              desc: "For dynamic scenes, click 'Generate AI Video' on still frames to produce fluid 4-8 second clips.",
            },
            {
              num: 5,
              title: "Compose, Subtitle, and Render",
              desc: "Preview stitched scenes, auto-generated subtitles, and voice narration. Click 'Export Video' to render the final MP4.",
            },
          ],
        },
        {
          id: "queues-billing-safety",
          category: "queues",
          icon: Layers,
          title: "5. Queue Monitoring & Pre-authorization Safety",
          summary: "Understand background task lifecycle and how the automated refund guarantee protects user balances.",
          estimatedTime: "3 min",
          targetLink: "/queues",
          targetLinkLabel: "Open Task Queues →",
          proTip: "Users never lose credits on failed AI jobs. The system automatically triggers a 100% refund of the frozen amount whenever a task fails.",
          steps: [
            {
              num: 1,
              title: "Monitor Real-Time Task Queues",
              desc: "In 'Task Queues', track background jobs filtered by status: queued, running, succeeded, or failed.",
            },
            {
              num: 2,
              title: "Balance Pre-authorization",
              desc: "When a generation job starts, an estimated maximum amount of Credits is temporarily frozen to prevent overdrafts.",
            },
            {
              num: 3,
              title: "Actual Usage Settlement",
              desc: "Upon task completion, the system deducts the exact Credits used based on actual token/model consumption and unfreezes any leftover Credits.",
            },
            {
              num: 4,
              title: "Auto-Refund on Failure",
              desc: "If an upstream provider errors or times out, 100% of the frozen credits are returned to the user wallet immediately.",
            },
          ],
        },
        {
          id: "finance-audit",
          category: "finance",
          icon: TrendingUp,
          title: "6. Financial Auditing & Profit Reconciliation",
          summary: "Monitor platform revenue, official vendor costs, and net margins across daily billing cycles.",
          estimatedTime: "2 min",
          targetLink: "/finance",
          targetLinkLabel: "Open Finance Page →",
          proTip: "TokenFree cost sync runs periodically. You can also click 'Sync Partner Cost' at any time to force an immediate update.",
          steps: [
            {
              num: 1,
              title: "Select Audit Date Range",
              desc: "Filter financial records by 7 days, 14 days, 30 days, or 90 days.",
            },
            {
              num: 2,
              title: "Compare User Charges vs Official Costs",
              desc: "Examine 'Charge (Credits)' against 'Actual Cost (Credits)' to inspect daily gross margins.",
            },
            {
              num: 3,
              title: "Track Profit Margins",
              desc: "Check profit amounts and percentages. If margins drop, adjust markup multipliers in System Settings.",
            },
            {
              num: 4,
              title: "Sync Upstream Invoices",
              desc: "Click 'Sync Partner Cost' at the top right to fetch latest upstream billed costs from TokenFree New API.",
            },
          ],
        },
      ];
    }

    // Default to Chinese
    return [
      {
        id: "ai-routing",
        category: "ai",
        icon: Cpu,
        title: "1. API 密钥与 AI 模型路由配置 (TokenFree)",
        summary: "连接上游 TokenFree New API 服务，开启脚本生成、角色出图与动态视频生成能力。",
        estimatedTime: "3 分钟",
        targetLink: "/settings",
        targetLinkLabel: "打开系统设置 →",
        proTip: "TokenFree 为系统上游服务网关，请先确保账户内有足够的代币或余额，再对用户开放生成功能。",
        steps: [
          {
            num: 1,
            title: "进入系统设置",
            desc: "在左侧菜单点击「系统设置」，切换至「模型路由」标签页。",
          },
          {
            num: 2,
            title: "填写 TokenFree API Key 并查验余额",
            desc: "输入 API Key，点击「查询余额/Quota」验证连接与可用额度。",
          },
          {
            num: 3,
            title: "设置各功能默认模型",
            desc: "为剧本生成、角色生图、视频动态生成和配音选择最优模型。",
          },
          {
            num: 4,
            title: "保存设置",
            desc: "点击右上角保存，配置立即对后续所有生成任务生效。",
          },
        ],
      },
      {
        id: "pricing-markup",
        category: "payment",
        icon: CreditCard,
        title: "2. 支付配置与模型加价率 (Markup)",
        summary: "配置用户充值渠道，并为模型设置合理的毛利加价系数。",
        estimatedTime: "2 分钟",
        targetLink: "/settings",
        targetLinkLabel: "打开支付设置 →",
        proTip: "100 fen = 1 元/点数。设置 1.25 倍加价即对应约 20% 毛利率。",
        steps: [
          {
            num: 1,
            title: "切换至支付标签页",
            desc: "在系统设置中选择「支付与计费」面板。",
          },
          {
            num: 2,
            title: "配置在线支付渠道",
            desc: "启用易支付或微信/支付宝渠道，配置商户 ID 与密钥。",
          },
          {
            num: 3,
            title: "配置模型加价系数",
            desc: "在模型费率表中设置加价倍数，用户扣费 = 上游成本 x 加价系数。",
          },
          {
            num: 4,
            title: "校验用户端售价",
            desc: "检查表格中的扣费额度是否合理，核对无误后保存。",
          },
        ],
      },
      {
        id: "templates-management",
        category: "templates",
        icon: Shapes,
        title: "3. 双语视频模板管理与发布",
        summary: "创建现成视频模板，让用户在前台一键生成高质量短视频。",
        estimatedTime: "4 分钟",
        targetLink: "/templates",
        targetLinkLabel: "打开模板管理 →",
        proTip: "数据库原生支持中英越三语，请务必填写双语名称与描述，提升海外用户体验。",
        steps: [
          {
            num: 1,
            title: "新建或编辑模板",
            desc: "在模板管理页面点击「新建模板」或编辑现有模板卡片。",
          },
          {
            num: 2,
            title: "输入多语言名称与分类",
            desc: "输入中文、越南语及英语名称、简介与分类标签。",
          },
          {
            num: 3,
            title: "设定提示词与画面画幅",
            desc: "配置系统提示词、画面比例（16:9 或 9:16）及默认配音风格。",
          },
          {
            num: 4,
            title: "上传封面并设为公开",
            desc: "上传高清晰度预览封面，切换为启用状态并保存。",
          },
        ],
      },
      {
        id: "drama-production",
        category: "drama",
        icon: Film,
        title: "4. AI 漫剧全流程生产指南",
        summary: "从故事梗概、一致性角色、分镜出图到最终导出视频的五步闭环流程。",
        estimatedTime: "5 分钟",
        targetLink: "/drama-projects",
        targetLinkLabel: "打开漫剧项目 →",
        proTip: "角色一致性关键在于资产库中的基准正脸图，建议选用高清正脸参考图。",
        steps: [
          {
            num: 1,
            title: "创建项目并生成剧本分集",
            desc: "创建项目并粘贴故事，AI 自动拆解分集与分镜场景。",
          },
          {
            num: 2,
            title: "生成固定角色并绑定音色",
            desc: "在资产库创建角色，选定画风，生成基准参考图并关联 TTS 声音。",
          },
          {
            num: 3,
            title: "批量生成分镜画面",
            desc: "检查各分镜提示词与镜头语言，点击批量生图完成画面生成。",
          },
          {
            num: 4,
            title: "关键帧生视频动态",
            desc: "对动作场景点击生成 AI 视频，获得 4-8 秒的连贯动态镜头。",
          },
          {
            num: 5,
            title: "合成字幕配音并导出",
            desc: "预览音视频对齐与自动字幕，点击导出渲染完整高画质视频。",
          },
        ],
      },
      {
        id: "queues-billing-safety",
        category: "queues",
        icon: Layers,
        title: "5. 任务中心与预扣款/退款机制",
        summary: "实时排队任务监控，以及确保用户资金安全的预扣与全额退款保障。",
        estimatedTime: "3 分钟",
        targetLink: "/queues",
        targetLinkLabel: "打开任务中心 →",
        proTip: "任务一旦因上游故障失败，系统会触发自动全额退还已预扣额度，用户零资金风险。",
        steps: [
          {
            num: 1,
            title: "实时查看运行中与排队任务",
            desc: "在任务中心查看 queued、running、succeeded 和 failed 状态的任务。",
          },
          {
            num: 2,
            title: "预扣款机制 (Pre-authorization)",
            desc: "在耗时耗费任务开始前，系统按预估上限冻结额度，防止欠费透支。",
          },
          {
            num: 3,
            title: "实际消耗核销 (Settlement)",
            desc: "任务成功后，根据实际消耗 Token/时长扣除真实金额，差额即刻解冻退还。",
          },
          {
            num: 4,
            title: "失败自动退款与故障日志排查",
            desc: "遇超时或模型报错，自动退还 100% 冻结额度。点击任务行可查看上游原始返回日志。",
          },
        ],
      },
      {
        id: "finance-audit",
        category: "finance",
        icon: TrendingUp,
        title: "6. 财务对账与毛利监控",
        summary: "全面掌握平台充值、用户消耗、上游官方成本与实际利润率。",
        estimatedTime: "2 分钟",
        targetLink: "/finance",
        targetLinkLabel: "打开财务列表 →",
        proTip: "支持随时点击「刷新官方成本」强制与 TokenFree New API 账单同步。",
        steps: [
          {
            num: 1,
            title: "选择对账周期",
            desc: "在财务列表选择 7 天、14 天、30 天或 90 天对账范围。",
          },
          {
            num: 2,
            title: "核对扣费与官方成本",
            desc: "比对用户扣费与上游实际成本，清晰查看每日毛利差额。",
          },
          {
            num: 3,
            title: "监控毛利率波动",
            desc: "通过毛利率百分比评估收益健康度，及时调整加价策略。",
          },
          {
            num: 4,
            title: "同步上游账单",
            desc: "点击右上角「刷新官方成本」即时同步最新账单明细。",
          },
        ],
      },
    ];
  }, [locale]);

  const filteredGuides = useMemo(() => {
    return guides.filter((item) => {
      const matchCat = activeCategory === "all" || item.category === activeCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchStep = item.steps.some((s) => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
      return matchTitle || matchSummary || matchStep;
    });
  }, [guides, activeCategory, searchQuery]);

  const pageTitle =
    locale === "vi"
      ? "Hướng dẫn sử dụng hệ thống"
      : locale === "en"
        ? "System User Guide"
        : "系统使用指南";

  const pageDesc =
    locale === "vi"
      ? "Hướng dẫn từng bước thực tế cho các quy trình quan trọng, cấu hình nâng cao và vận hành sản xuất phim AI."
      : locale === "en"
        ? "Step-by-step practical guides for key workflows, system configurations, and AI short video production."
        : "关键业务流程、系统高级配置与 AI 漫剧制作的实用步骤指南。";

  return (
    <div className="admin-page space-y-6">
      {/* Hero Header */}
      <header className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(31,92,72,0.12)] text-[#1f5c48]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--admin-fg)]">{pageTitle}</h1>
            </div>
            <p className="text-xs text-[var(--admin-muted)] md:text-sm">{pageDesc}</p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === "vi"
                  ? "Tìm kiếm quy trình, từ khóa..."
                  : locale === "en"
                    ? "Search guides & workflows..."
                    : "搜索指南或功能关键词..."
              }
              className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] py-2 pl-9 pr-3 text-xs text-[var(--admin-fg)] placeholder-[var(--admin-muted)] transition focus:border-[#1f5c48] focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-4">
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-[#1f5c48] text-white shadow-sm"
                    : "bg-[var(--admin-bg)] text-[var(--admin-muted)] hover:bg-[rgba(31,92,72,0.08)] hover:text-[var(--admin-fg)]"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Guide Cards */}
      <div className="space-y-4">
        {filteredGuides.length === 0 ? (
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-12 text-center text-sm text-[var(--admin-muted)]">
            {locale === "vi"
              ? "Không tìm thấy hướng dẫn phù hợp với từ khóa tìm kiếm."
              : locale === "en"
                ? "No guides found matching your search query."
                : "未找到符合搜索条件的指南。"}
          </div>
        ) : (
          filteredGuides.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedId === item.id;
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-sm transition hover:border-[rgba(31,92,72,0.3)]"
              >
                {/* Header bar */}
                <div
                  className="flex cursor-pointer flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(31,92,72,0.08)] text-[#1f5c48]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--admin-fg)]">{item.title}</h2>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">{item.summary}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                    <span className="inline-flex items-center rounded-md bg-[rgba(31,92,72,0.06)] px-2.5 py-1 text-[11px] font-medium text-[#1f5c48]">
                      ⏱ {item.estimatedTime}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#1f5c48] hover:underline"
                    >
                      {isExpanded
                        ? locale === "vi"
                          ? "Thu gọn ▲"
                          : locale === "en"
                            ? "Collapse ▲"
                            : "收起 ▲"
                        : locale === "vi"
                          ? "Xem chi tiết ▼"
                          : locale === "en"
                            ? "View Steps ▼"
                            : "查看步骤 ▼"}
                    </button>
                  </div>
                </div>

                {/* Expanded Steps Body */}
                {isExpanded && (
                  <div className="border-t border-[var(--admin-border)] bg-[var(--admin-bg)]/40 p-5 sm:p-6">
                    {/* Steps list */}
                    <div className="space-y-4">
                      {item.steps.map((step) => (
                        <div key={step.num} className="flex items-start gap-3.5">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f5c48] text-xs font-bold text-white shadow-sm">
                            {step.num}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-[var(--admin-fg)]">{step.title}</h3>
                            <p className="text-xs leading-relaxed text-[var(--admin-muted)]">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pro Tip Callout */}
                    {item.proTip && (
                      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-[#e2d5b8] bg-[#fbf9f4] p-3 text-xs text-[#70552b] dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                        <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                          <strong className="font-semibold">
                            {locale === "vi" ? "Lưu ý quan trọng: " : locale === "en" ? "Pro Tip: " : "重要提示："}
                          </strong>
                          <span>{item.proTip}</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Action Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-[var(--admin-border)] pt-4">
                      <span className="text-xs text-[var(--admin-muted)]">
                        {locale === "vi"
                          ? "Truy cập nhanh chức năng để thực hành:"
                          : locale === "en"
                            ? "Jump directly to this module:"
                            : "快速前往该功能模块操作："}
                      </span>
                      <Link
                        to={item.targetLink}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f5c48] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#163f33]"
                      >
                        <span>{item.targetLinkLabel}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
