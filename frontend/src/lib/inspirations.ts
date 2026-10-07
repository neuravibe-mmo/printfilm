export type Inspiration = {
  title: string
  theme: string
  script: string
}

/**
 * Danh sách gợi ý cảm hứng được "may đo" trực tiếp cho TOÀN BỘ 27 Template của hệ thống.
 * Mỗi Template ID có bộ chủ đề và kịch bản mẫu hoàn chỉnh đúng chuẩn phong cách thị giác và cấu trúc.
 */
export const INSPIRATIONS_BY_TEMPLATE: Record<string, Inspiration[]> = {
  // 1. TikTok / Reels · Giữ chân 3s
  huoke_douyin_hook: [
    {
      title: 'Top 3 mẹo công nghệ bạn ước mình biết sớm',
      theme: '3 mẹo dùng smartphone cực hay giúp tiết kiệm pin và dọn dẹp bộ nhớ trong 30 giây. Hook 3s đầu: "Đừng lướt vội nếu bạn đang dùng điện thoại này!", nhịp dồn dập, kết thúc kêu gọi lưu lại.',
      script:
        'Đừng lướt vội nếu điện thoại của bạn dạo này chạy chậm như rùa!\n\n' +
        'Mẹo thứ nhất: Tắt ngay tính năng làm mới ứng dụng nền trong cài đặt chung, pin sẽ tăng thêm ít nhất 2 tiếng mỗi ngày.\n\n' +
        'Mẹo thứ hai: Xóa bộ nhớ cache của các app mạng xã hội, bạn sẽ giải phóng ngay 5 đến 10 GB bộ nhớ rác.\n\n' +
        'Mẹo thứ ba: Bật chế độ tối màn hình OLED để giảm tiêu hao năng lượng tối đa.\n\n' +
        'Lưu video này lại trước khi nó bị trôi mất trên bảng tin nhé!',
    },
    {
      title: '3 sai lầm tai hại khi phối đồ đi làm',
      theme: 'Vạch trần 3 lỗi phối đồ công sở phổ biến khiến bạn trông già đi 5 tuổi. Hook 3s: "90% người đi làm mắc lỗi số 2!", chỉ ra chi tiết tương phản màu sắc và độ vừa vặn trang phục.',
      script:
        'Bạn có tự hỏi vì sao mua đồ đắt tiền mà mặc lên vẫn thấy kỳ không? 90% người đi làm đều mắc phải lỗi này.\n\n' +
        'Sai lầm 1: Chọn áo quá rộng che mất đường eo, vô tình làm tỉ lệ cơ thể bạn bị chia đôi.\n\n' +
        'Sai lầm 2: Đi tất trắng với giày tây tối màu — điểm trừ thị giác cực lớn trong các buổi họp quan trọng.\n\n' +
        'Sai lầm 3: Quá nhiều phụ kiện rườm rà. Quy tắc chuẩn chỉ cần: đồng hồ thanh lịch và thắt lưng cùng tông màu giày.\n\n' +
        'Thử thay đổi ngay ngày mai, bạn sẽ thấy phong thái tự tin hơn hẳn!',
    },
    {
      title: 'Điều bạn chưa biết về iPhone 16',
      theme: 'Khám phá nút Camera Control và chụp ảnh phơi sáng trên iPhone mới. 3s đầu hé lộ góc máy độc lạ, hướng dẫn thao tác bằng một ngón tay, nhạc nền cuốn hút.',
      script:
        'Cầm iPhone mới trên tay cả tháng, liệu bạn đã biết mẹo này với nút Camera Control chưa?\n\n' +
        'Chỉ cần vuốt nhẹ ngón tay để zoom mượt mà như máy quay điện ảnh, nhấn đúp nhẹ để chuyển nhanh giữa các bộ lọc màu chuyên nghiệp.\n\n' +
        'Kết hợp với chế độ quay Spatial Video, bạn có thể lưu giữ những khoảnh khắc sống động như đang đứng tại hiện trường.\n\n' +
        'Chia sẻ cho đứa bạn vừa tậu máy mới cùng biết ngay đi!',
    },
    {
      title: 'Tại sao bạn luôn cảm thấy mệt mỏi?',
      theme: '3 thói quen buổi sáng đang âm thầm hút cạn năng lượng của bạn. Hook trực diện đánh trúng tâm lý dân văn phòng, đưa ra giải pháp 1 phút thay đổi ngay lập tức.',
      script:
        'Vừa thức dậy đã cảm thấy kiệt sức? Thủ phạm không phải do bạn ngủ ít, mà là 3 thói quen này.\n\n' +
        'Thứ nhất: Vớ ngay lấy điện thoại lướt mạng khi mắt vừa mở, khiến não bị quá tải dopamine ngay từ phút đầu tiên.\n\n' +
        'Thứ hai: Uống cà phê khi bụng đang đói cồn cào làm tăng vọt cortisol gây căng thẳng kéo dài.\n\n' +
        'Thứ ba: Thiếu ánh sáng tự nhiên. Chỉ cần bước ra ban công hít thở 2 phút nắng sớm, đồng hồ sinh học của bạn sẽ được kích hoạt lại ngay.\n\n' +
        'Thử áp dụng trong 3 ngày tới và cảm nhận sự khác biệt nhé!',
    },
    {
      title: 'Bí quyết tiết kiệm 5 triệu mỗi tháng',
      theme: 'Quy tắc 50/30/20 phiên bản thực tế cho người trẻ mới đi làm. Phân cảnh nhanh, bảng biểu đồ họa trực quan, gợi ý cách cắt giảm chi tiêu mua sắm cảm xúc.',
      script:
        'Lương về tài khoản được 3 ngày là bốc hơi sạch? Đây là cách người thông minh quản lý dòng tiền.\n\n' +
        'Chia ngay lương làm 3 tài khoản: 50% cho chi phí cố định nhà cửa ăn uống, 30% cho chi tiêu linh hoạt và sở thích.\n\n' +
        'Quan trọng nhất là 20% còn lại: tự động chuyển vào tài khoản tiết kiệm hoặc đầu tư ngay khi nhận lương, coi như khoản tiền không tồn tại.\n\n' +
        'Áp dụng quy tắc "trì hoãn 48 giờ" trước khi bấm mua bất kỳ món đồ nào online. Sau 6 tháng, bạn sẽ ngạc nhiên với số dư của mình!',
    },
    {
      title: 'Một ngày làm việc của lập trình viên AI',
      theme: 'Trải nghiệm thực tế một ngày làm việc linh hoạt của kỹ sư công nghệ: từ viết prompt, chạy mô hình đến thưởng thức cà phê, phong cách hiện đại lôi cuốn.',
      script:
        'Một ngày của người làm việc cùng AI sẽ diễn ra như thế nào? Bắt đầu từ 8 giờ sáng với một ly espresso đậm vị.\n\n' +
        'Thay vì ngồi gõ từng dòng mã nhàm chán, 80% công việc giờ là định hình ý tưởng và ra lệnh cho các trợ lý AI phối hợp cùng nhau.\n\n' +
        'Giải quyết một tính năng phức tạp chỉ trong 15 phút, thời gian còn lại là dành cho sáng tạo và tối ưu trải nghiệm người dùng.\n\n' +
        'Kỷ nguyên số đang thay đổi từng ngày, bạn đã sẵn sàng làm chủ công nghệ chưa?',
    },
  ],

  // 2. Review & Đề xuất sản phẩm
  huoke_xhs_recommend: [
    {
      title: 'Cách quay check-in quán chuẩn viral',
      theme: 'Biến điểm mạnh của một quán local thành video viral TikTok: 3 giây hook, cảnh quán, 1-2 trải nghiệm thực tế, lời kêu gọi đến quán. Chỉ viết những gì đã biết.',
      script:
        'Đi qua con đường này chục lần, lần này mới bước vào.\n\n' +
        'Quán nhỏ nhưng biển hiệu rõ ràng, ngay gần ga metro.\n\n' +
        'Tôi gọi món chủ lực của quán, cảm nhận thật lòng: vị chuẩn, lên đồ nhanh.\n\n' +
        'Muốn thử thì tự xem menu, đừng nghe những lời hứa cường điệu.',
    },
    {
      title: 'Trải nghiệm quán cà phê phong cách Nhật mới mở',
      theme: 'Đánh giá chân thực quán cà phê tone gỗ tối giản: không gian làm việc yên tĩnh, hương vị hạt cà phê rang thủ công và góc chụp ảnh sống ảo hút mắt.',
      script:
        'Nếu bạn đang tìm một góc trốn ồn ào giữa lòng thành phố, hãy ghé thử không gian này.\n\n' +
        'Tone gỗ ấm, ánh nắng xuyên qua rèm lụa và tiếng nhạc jazz nhẹ nhàng tạo cảm giác cực kỳ thư thái.\n\n' +
        'Ly matcha latte béo ngậy kết hợp với bánh phô mai nướng thủ công vị ngọt vừa phải, rất đáng để quay lại.\n\n' +
        'Rất phù hợp để mang laptop làm việc hoặc đọc một cuốn sách vào chiều cuối tuần.',
    },
    {
      title: 'Review kiểu bạn thân giới thiệu',
      theme: 'Video review kiểu Xiaohongshu: tiêu đề hook, ấn tượng đầu tiên, trải nghiệm cụ thể từng điểm, phù hợp ai. Chỉ nêu điểm mạnh khách quan.',
      script:
        'Ban đầu chỉ định đi qua, cuối cùng ngồi trong quán mãi.\n\n' +
        'Ấn tượng đầu là ánh sáng sạch, ghế ngồi không chật.\n\n' +
        'Tôi gọi món signature, khẩu phần thật lòng mà nói; không gian yên tĩnh, thích hợp nói chuyện.\n\n' +
        'Hợp với người muốn ngồi lâu; ai vội thì xem menu trước rồi tính.',
    },
    {
      title: 'Đánh giá kem chống nắng cho da dầu mụn',
      theme: 'Thử nghiệm thực tế kem chống nắng: kết cấu mỏng nhẹ, khả năng nâng tone tự nhiên, độ kiềm dầu sau 4 tiếng và độ an toàn cho làn da nhạy cảm.',
      script:
        'Tìm được tuýp kem chống nắng chân ái cho mùa hè quả thực không hề dễ dàng.\n\n' +
        'Chất kem mỏng như sữa, thoa lên tiệp ngay vào da chỉ sau 30 giây mà không để lại bất kỳ vệt trắng hay cảm giác bết dính nào.\n\n' +
        'Sau 4 tiếng làm việc trong phòng máy lạnh, vùng chữ T vẫn khô thoáng bất ngờ.\n\n' +
        'Chỉ số SPF 50+ bảo vệ toàn diện, thành phần lành tính không gây kích ứng cho da dầu mụn.',
    },
    {
      title: 'Mở hộp máy lọc không khí mini để bàn',
      theme: 'Review chi tiết máy lọc khí cá nhân: kích thước nhỏ gọn, độ ồn khi ngủ, khả năng khử mùi phòng kín và chi phí thay lõi lọc hàng năm.',
      script:
        'Góc làm việc nhỏ cần một chiếc máy lọc khí mini thế này để hít thở sảng khoái hơn.\n\n' +
        'Thiết kế hình trụ tối giản, đặt cạnh màn hình máy tính vừa vặn như một món decor công nghệ.\n\n' +
        'Cấp độ quạt gió ban đêm êm ru dưới 25dB, không làm phiền giấc ngủ hay sự tập trung khi làm việc.\n\n' +
        'Lọc sạch bụi mịn màng lọc HEPA cao cấp, rất đáng giá cho sức khỏe đường hô hấp.',
    },
  ],

  // 3. Giới thiệu phần mềm & App
  opensource_showcase: [
    {
      title: 'Cách tự tạo chatbot AI cá nhân trong 5 phút',
      theme: 'Hướng dẫn từng bước thiết lập trợ lý ảo thông minh: kết nối API, nạp tài liệu riêng và tự động trả lời email hỗ trợ khách hàng không cần lập trình phức tạp.',
      script:
        'Tự xây dựng một trợ lý AI thông minh cho doanh nghiệp của bạn, tại sao không?\n\n' +
        'Bước một: Tải tài liệu hướng dẫn và bảng câu hỏi thường gặp của sản phẩm lên hệ thống.\n\n' +
        'Bước hai: Thiết lập nhân cách cho bot, quy định giọng điệu thân thiện và chuyên nghiệp.\n\n' +
        'Bước ba: Nhúng đoạn mã vào website hoặc fanpage với một cú nhấp chuột.\n\n' +
        'Từ nay, khách hàng của bạn sẽ được hỗ trợ 24/7 tức thì mà không cần bạn phải túc trực bên máy tính.',
    },
    {
      title: 'Top 5 extension VS Code tăng tốc độ lập trình',
      theme: 'Trình diễn thao tác trên màn hình IDE: phím tắt tiện lợi, gợi ý code tự động bằng AI và công cụ quản lý Git trực quan giúp lập trình viên tiết kiệm 2 giờ mỗi ngày.',
      script:
        'Muốn tăng gấp đôi tốc độ viết code, hãy cài ngay 5 tiện ích mở rộng không thể thiếu này trên VS Code.\n\n' +
        'Đầu tiên là tính năng tự động hoàn thiện mã nguồn thông minh, gợi ý chuẩn xác cả đoạn logic phức tạp.\n\n' +
        'Tiếp theo là công cụ tô màu dấu ngoặc và định dạng code tự động khi lưu file, giúp cấu trúc dự án luôn gọn gàng, sáng sủa.\n\n' +
        'Thao tác mượt mà, hạn chế tối đa lỗi cú pháp và giúp bạn tập trung hoàn toàn vào tư duy thuật toán.',
    },
    {
      title: 'Giới thiệu phần mềm quản lý công việc thế hệ mới',
      theme: 'Trải nghiệm giao diện ứng dụng: bảng điều khiển Kanban trực quan, tự động giao việc theo lịch trình và đồng bộ thông báo thời gian thực giữa các thành viên.',
      script:
        'Quản lý nhóm hiệu quả chưa bao giờ đơn giản đến thế với nền tảng làm việc số thông minh.\n\n' +
        'Giao diện trực quan cho phép kéo thả nhiệm vụ linh hoạt, theo dõi tiến độ từng dự án theo thời gian thực.\n\n' +
        'Tích hợp thông báo tự động nhắc nhở deadline và phân tích hiệu suất làm việc bằng biểu đồ trực quan.\n\n' +
        'Giải pháp hoàn hảo giúp đội ngũ của bạn tối ưu quy trình và tăng trưởng đột phá.',
    },
    {
      title: 'Khám phá quy trình tự động hóa với Notion',
      theme: 'Cách thiết lập hệ thống ghi chú và quản lý mục tiêu cá nhân: liên kết cơ sở dữ liệu, theo dõi thói quen hàng ngày và bảng tổng kết tài chính tự động.',
      script:
        'Biến Notion thành bộ não thứ hai giúp cuộc sống của bạn luôn ngăn nắp và khoa học.\n\n' +
        'Tạo bảng theo dõi thói quen 21 ngày với các thanh tiến độ tự động cập nhật.\n\n' +
        'Liên kết ghi chú dự án trực tiếp với danh sách việc cần làm, không bao giờ bỏ sót bất kỳ ý tưởng sáng tạo nào.\n\n' +
        'Làm chủ thời gian của chính mình bắt đầu từ việc sắp xếp thông tin một cách thông minh.',
    },
  ],

  // 4. Đánh giá & So sánh chi tiết
  huoke_review_facts: [
    {
      title: 'Phân tích review để quyết định',
      theme: 'Video review kiểu phân tích: đánh giá tổng thể, không gian & phục vụ, món gợi ý kèm lý do, giá trị tiền, phù hợp ai. Giá không biết thì không đoán.',
      script:
        'Tổng thể: sạch, quy trình rõ ràng, phù hợp người lần đầu đến.\n\n' +
        'Không gian thoáng, nhân viên chủ động hướng dẫn chọn đồ.\n\n' +
        'Gợi ý món chủ lực vì tôi đã dùng thử, quy trình dễ hiểu.\n\n' +
        'Giá theo niêm yết tại quán. Đi theo nhóm phù hợp hơn đi một mình.',
    },
    {
      title: 'Mở hộp tai nghe chống ồn phân khúc 1 triệu',
      theme: 'Đánh giá chi tiết tai nghe không dây: độ êm khi đeo lâu, khả năng khử tiếng ồn ngoài phố, thời lượng pin thực tế và chất âm đối với người dùng phổ thông.',
      script:
        'Bỏ ra hơn một triệu cho chiếc tai nghe này, liệu có đáng tiền hay không?\n\n' +
        'Điểm cộng lớn nhất là đệm tai cực kỳ êm ái, đeo liên tục 3 tiếng làm việc không bị đau vành tai.\n\n' +
        'Bật tính năng chống ồn chủ động ANC lên, tiếng còi xe và tiếng ồn văn phòng lập tức giảm đi 80%.\n\n' +
        'Chất âm bass đánh chắc, pin trọn vẹn 30 tiếng. Một món đầu tư rất hời cho học sinh sinh viên và dân văn phòng.',
    },
    {
      title: 'So sánh 2 dòng nồi chiên không dầu bán chạy',
      theme: 'Đặt lên bàn cân về dung tích, độ giòn của món ăn, độ ồn và độ dễ vệ sinh sau khi nấu. Chỉ ra ưu nhược điểm thực tế để người mua dễ chọn.',
      script:
        'Cùng tầm giá 2 triệu, nên mua dòng có kính nhìn xuyên thấu hay dòng nhiệt đối lưu hai mặt?\n\n' +
        'Dòng kính trong giúp bạn quan sát độ vàng của thức ăn cực chuẩn, không sợ cháy khét.\n\n' +
        'Nhưng dòng đối lưu hai mặt lại giúp thịt chín đều giòn rụm mà không cần trở mặt nửa chừng.\n\n' +
        'Gia đình 4 người nên chọn mẫu dung tích 6 lít để nướng gà nguyên con thoải mái.',
    },
  ],

  // 5. Thao tác máy tính công sở
  opensource_live_work: [
    {
      title: 'Quy trình xử lý bảng dữ liệu Excel 10.000 dòng',
      theme: 'Thao tác thực tế trên laptop văn phòng: dùng hàm XLOOKUP, Pivot Table và định dạng có điều kiện để hoàn thành báo cáo tháng trong 10 phút.',
      script:
        'Gặp bảng tính Excel hàng vạn dòng, đừng ngồi dò tay từng ô một!\n\n' +
        'Áp dụng ngay hàm tra cứu thông minh kết hợp bảng tổng hợp đa chiều Pivot Table.\n\n' +
        'Chỉ vài cú nhấp chuột, toàn bộ dữ liệu doanh thu theo khu vực đã được phân tích tự động.\n\n' +
        'Tối ưu kỹ năng tin học văn phòng giúp bạn giải quyết công việc nhanh gấp 5 lần.',
    },
    {
      title: 'Thiết lập không gian làm việc hai màn hình chuẩn công thái học',
      theme: 'Trình diễn góc làm việc hiệu quả: bố trí màn hình chính phụ, phím tắt chuyển vùng làm việc và tư thế ngồi bảo vệ cột sống cho dân IT.',
      script:
        'Bố trí hai màn hình thế nào để tăng năng suất làm việc mà không bị mỏi cổ?\n\n' +
        'Màn hình chính ngang tầm mắt chứa cửa sổ làm việc trực tiếp, màn hình phụ dọc hiển thị tài liệu tham khảo và chat nội bộ.\n\n' +
        'Góc máy gọn gàng, dây cáp đi ngầm tinh tế mang lại cảm hứng làm việc dồi dào mỗi ngày.',
    },
  ],

  // 6. Vlog đời thường · Chia sẻ tự nhiên
  huoke_soft_invite: [
    {
      title: 'Giới thiệu nhẹ trong nhóm bạn',
      theme: 'Video ngắn cho mạng xã hội: một câu cảm nhận thật, một chi tiết cụ thể, một lời giới thiệu nhẹ. Kiềm chế, không giống quảng cáo.',
      script:
        'Hôm nay ghé qua tiện đường, ngồi một lúc, yên hơn tưởng.\n\n' +
        'Bàn cạnh cửa sổ có nắng tự nhiên, thích hợp nghỉ chân.\n\n' +
        'Bạn nào gần đây thì tự ghé xem thử nhé.',
    },
    {
      title: 'Một chú mèo hoang mùa xuân',
      theme: 'Mùa xuân của một chú mèo hoang: dùng lời dẫn nhân cách hóa kể về hệ sinh thái đô thị, ranh giới cho ăn và cùng sống với vật nuôi, khoa học ấm áp.',
      script:
        'Xuân về, chú mèo vàng đầu hẻm bắt đầu thay lông, tìm kiếm góc an toàn hơn.\n\n' +
        'Động vật hoang trong thành phố tồn tại nhờ bản năng còn sót và lòng tốt vô tình của con người. Cho ăn khoa học, triệt sản và tôn trọng khoảng cách — quan trọng hơn hành động bột phát.\n\n' +
        'Chúng không phải phong cảnh, cũng không phải phiền toái, mà là một phần hệ sinh thái đô thị.\n\n' +
        'Mùa xuân này, chúc mỗi chú mèo đều gặp được ngày mai an ổn hơn.',
    },
  ],

  // 7. Phỏng vấn đường phố (Street Talk)
  live_street_interview: [
    {
      title: 'Bạn kiếm được bao nhiêu tiền ở tuổi 25?',
      theme: 'Phỏng vấn người qua đường ngoài phố đi bộ: mic cầm tay, góc máy chân thực, câu trả lời bất ngờ về mức lương và áp lực tài chính của người trẻ.',
      script:
        'Chào bạn, bạn có thể chia sẻ mức thu nhập hiện tại của mình ở tuổi 25 không?\n\n' +
        'Có bạn kiếm 8 triệu, có bạn đã tự làm chủ thu nhập 50 triệu mỗi tháng.\n\n' +
        'Nhưng điểm chung lớn nhất: Ai cũng đang nỗ lực hết mình để khẳng định giá trị bản thân nơi thành phố lớn.\n\n' +
        'Còn bạn, mục tiêu tài chính của bạn năm nay là bao nhiêu?',
    },
    {
      title: 'Điều hối tiếc lớn nhất trong tình yêu của bạn là gì?',
      theme: 'Phỏng vấn cảm xúc người trẻ lúc hoàng hôn trên cầu đi bộ: câu chuyện chân thành, lời nhắn gửi đến người yêu cũ và bài học trưởng thành.',
      script:
        'Nếu được quay lại quá khứ, bạn muốn nói điều gì với người từng rất quan trọng?\n\n' +
        'Đôi khi điều làm chúng ta day dứt nhất không phải là lời chia tay, mà là những lời xin lỗi chưa kịp nói thành câu.\n\n' +
        'Hãy học cách trân trọng những người đang ở bên cạnh bạn ngay ngày hôm nay.',
    },
  ],

  // 8. Trên tay & Trình diễn bàn làm việc
  live_product_desk: [
    {
      title: 'Bàn làm việc thông minh nâng hạ tự động',
      theme: 'Trình diễn tay bấm bảng điều khiển: mặt bàn gỗ sồi cao cấp, động cơ kép nâng hạ êm ái, góc setup tối giản công nghệ cao cho dân đồ họa.',
      script:
        'Nâng hạ từ tư thế ngồi sang đứng làm việc chỉ với một chạm nhẹ nhàng.\n\n' +
        'Mặt bàn gỗ sồi nguyên khối phủ sơn mờ chống bám vân tay, tích hợp khe đi dây giấu kín cực kỳ gọn gàng.\n\n' +
        'Thay đổi tư thế làm việc linh hoạt giúp giảm 80% áp lực lên cột sống thắt lưng.',
    },
    {
      title: 'Đế sạc không dây đa năng 3 trong 1',
      theme: 'Thao tác đặt điện thoại, đồng hồ và tai nghe lên đế sạc: sạc nhanh từ tính MagSafe, gập gọn mang đi du lịch tiện lợi.',
      script:
        'Góc bàn làm việc không còn dây cáp chằng chịt với đế sạc từ tính 3 trong 1.\n\n' +
        'Hút dính chắc chắn, hỗ trợ sạc nhanh đồng thời cả iPhone, Apple Watch và AirPods.\n\n' +
        'Thiết kế gập phẳng chỉ dày 2cm, dễ dàng nhét vào balo cho mọi chuyến công tác xa.',
    },
  ],

  // 9. Hoạt hình 3D (Pixar Style)
  anim_3d: [
    {
      title: 'Hành trình của chú gấu bông tìm lại màu sắc',
      theme: 'Phong cách 3D hoạt hình Pixar ấm áp: chú gấu bông phiêu lưu qua thế giới đồ chơi kỳ thú để tìm lại chiếc nơ đỏ đã mất.',
      script:
        'Trong một căn phòng gác mái ngập tràn ánh nắng, có một chú gấu bông nhỏ ấp ủ giấc mơ nhìn thấy thế giới bên ngoài.\n\n' +
        'Chú bước chân vào chuyến hành trình kỳ thú qua xứ sở của những khối xếp hình rực rỡ và những chiếc xe đồ chơi biết bay.\n\n' +
        'Vượt qua bao thử thách hài hước, chú gấu nhỏ nhận ra điều quý giá nhất không phải chiếc nơ đỏ, mà là những người bạn đồng hành tốt bụng.\n\n' +
        'Một câu chuyện ấm áp về lòng dũng cảm và tình bạn dành cho cả gia đình.',
    },
    {
      title: 'Sức mạnh kỳ diệu của giấc mơ',
      theme: 'Nhân vật 3D đáng yêu khám phá chu kỳ ngủ, REM và cách não bộ biến ký ức ban ngày thành những xứ sở thần tiên diệu kỳ.',
      script:
        'Khi bạn ngủ, não không hề nghỉ ngơi.\n\n' +
        'Vào giấc ngủ REM, não như đang phát lại những thước phim ban ngày, ghép thành giấc mơ kỳ ảo. Các nhà khoa học cho rằng điều này giúp sắp xếp ký ức, điều tiết cảm xúc.\n\n' +
        'Ngủ không đủ giấc, khả năng tập trung và sáng tạo đều giảm sút; ngủ đúng giờ giấc như bảo trì đêm cho não bộ.\n\n' +
        'Lần sau mơ kỳ lạ, đừng vội thấy vô nghĩa — đó có thể là não đang tăng ca học bài.',
    },
    {
      title: 'Chuyến phiêu lưu dưới đáy đại dương',
      theme: 'Thế giới hoạt hình rực rỡ dưới lòng biển sâu: rạn san hô phát sáng, chú rùa biển thông thái và bài học giữ sạch môi trường biển.',
      script:
        'Dưới làn nước xanh ngắt của đại dương bao la, một rạn san hô lấp lánh như thành phố ngầm trong truyện cổ tích.\n\n' +
        'Chú cá nhỏ tinh nghịch cùng người bạn rùa biển thông thái bắt đầu cuộc phiêu lưu khám phá những hang đá bí ẩn.\n\n' +
        'Mỗi sinh vật biển đều có một nhiệm vụ kỳ diệu để giữ cho đại dương luôn trong lành và xanh tươi.\n\n' +
        'Hãy cùng nhau gìn giữ vẻ đẹp diệu kỳ của thế giới biển cả muôn màu!',
    },
  ],

  // 10. Kể chuyện hình ảnh (Màn dọc)
  portrait_story: [
    {
      title: 'Góc nhìn một người trẻ xa quê lập nghiệp',
      theme: 'Khung hình dọc 9:16 nghệ thuật: ánh đèn đường vàng ấm, lời độc thoại nội tâm về những bữa cơm một mình và khát vọng vươn lên giữa đô thị.',
      script:
        'Tám giờ tối, bước ra khỏi tòa nhà cao tầng, dòng xe cộ vẫn hối hả như chưa từng dừng lại.\n\n' +
        'Những bữa cơm một mình bên khung cửa sổ phòng trọ, đôi khi nhớ vị canh chua mẹ nấu đến nghẹn lòng.\n\n' +
        'Nhưng mỗi khó khăn hôm nay đều là viên gạch xây dựng tương lai tự lập ngày mai.\n\n' +
        'Cố lên tôi ơi, thành phố này luôn có chỗ cho những người kiên trì.',
    },
    {
      title: 'Lời hứa dưới cơn mưa rào mùa hạ',
      theme: 'Màn hình dọc cảm xúc: giọt mưa rơi bên hiên trường, chiếc ô che nghiêng và ký ức trong trẻo của mối tình đầu tuổi thanh xuân.',
      script:
        'Cơn mưa rào bất chợt của mùa hạ năm ấy đã giữ hai chúng mình ở lại dưới mái hiên suốt một giờ đồng hồ.\n\n' +
        'Tiếng mưa rơi tí tách hòa cùng nhịp tim đập vội vã bên chiếc ô che nghiêng.\n\n' +
        'Thanh xuân như cơn mưa rào, dù có bị cảm lạnh, người ta vẫn muốn được ướt mưa thêm một lần nữa.',
    },
  ],

  // 11. Thước phim điện ảnh (Cinematic)
  live_cinematic: [
    {
      title: 'Bình minh trên đỉnh Tà Xùa săn mây',
      theme: 'Góc máy flycam rộng: biển mây bồng bềnh cuồn cuộn dưới ánh nắng vàng cam rực rỡ, âm nhạc hùng tráng khơi gợi tinh thần khám phá.',
      script:
        'Vượt qua hàng trăm cây số đèo dốc hiểm trở trong màn đêm lạnh buốt, phần thưởng hiện ra trước mắt đẹp tựa chốn bồng lai.\n\n' +
        'Khi những tia nắng đầu tiên xuyên qua lớp sương mù, cả một đại dương mây trắng bồng bềnh thức giấc dưới chân thung lũng.\n\n' +
        'Đứng trước thiên nhiên hùng vĩ, mọi mệt mỏi thường nhật bỗng chốc tan biến thành làn khói nhẹ tênh.',
    },
    {
      title: 'Hành trình phượt xuyên rừng thông Đà Lạt',
      theme: 'Màu phim điện ảnh teal-orange: vệt nắng chiếu xuyên tán thông già, con đường đèo uốn lượn và tiếng gió vi vu ngát hương nhựa thông.',
      script:
        'Tiếng động cơ gầm vang trên con đường đèo uốn lượn giữa bạt ngàn thông reo.\n\n' +
        'Mùi sương sớm mát lạnh hòa quyện cùng hương nhựa thông thơm nồng nàn đánh thức mọi giác quan.\n\n' +
        'Tự do không phải là đích đến, mà là từng khoảnh khắc bạn hòa mình trọn vẹn vào chuyến đi.',
    },
  ],

  // 12. Ký sự người thật đời thường
  live_person: [
    {
      title: 'Một ngày của bác tài xế công nghệ',
      theme: 'Góc nhìn chân thực từ tay lái xe máy: nụ cười dưới nắng gắt, những cuốc xe chở khách qua từng con hẻm và câu chuyện mưu sinh ấm áp tình người.',
      script:
        'Từ 6 giờ sáng, chiếc áo đồng phục bạc màu đã lăn bánh cùng những chuyến xe mưu sinh trên khắp nẻo đường thành phố.\n\n' +
        'Đón học sinh kịp giờ thi, chở bác gái đi chợ sớm, mỗi chuyến xe là một mảnh ghép đời thường bình dị.\n\n' +
        'Giọt mồ hôi rơi trên yên xe đổi lấy nụ cười của con thơ khi chiều về, đó là niềm hạnh phúc giản dị mà thiêng liêng nhất.',
    },
    {
      title: 'Nồi bánh chưng đêm giao thừa vùng cao',
      theme: 'Ánh lửa bập bùng trong đêm đông lạnh giá: tiếng cười giòn tan của trẻ nhỏ quanh nồi bánh nghi ngút khói và hương vị Tết sum vầy ấm cúng.',
      script:
        'Bếp củi đỏ lửa tí tách suốt đêm canh nồi bánh chưng xanh ngát mùi lá dong.\n\n' +
        'Những câu chuyện năm cũ được ôn lại bên tách trà thơm, tiếng trẻ con nô đùa đợi củ khoai nướng vùi tro ấm.\n\n' +
        'Tết chỉ thực sự về khi cả gia đình được quây quần ấm áp bên nhau.',
    },
  ],

  // 13. Nhiếp ảnh chân thực (Photo Realism)
  photo_realism: [
    {
      title: 'Chân dung người phụ nữ vùng cao Tây Bắc',
      theme: 'Độ chi tiết từng nếp nhăn thời gian, ánh mắt lấp lánh nụ cười hiền hậu và hoa văn thổ cẩm thêu tay sặc sỡ dưới ánh nắng tự nhiên.',
      script:
        'Từng nếp nhăn nơi khóe mắt là dấu ấn của biết bao mùa ngô trên nương rẫy dốc đá.\n\n' +
        'Tấm áo thổ cẩm tự dệt mang theo hoa văn của núi rừng, tỉ mỉ trong từng đường kim mũi chỉ qua bao tháng ngày.\n\n' +
        'Vẻ đẹp mộc mạc, thuần khiết của con người Tây Bắc tỏa sáng rạng ngời giữa đất trời bao la.',
    },
    {
      title: 'Giọt sương sớm đọng trên cánh hoa sen',
      theme: 'Góc chụp macro siêu thực: độ tương phản ánh sáng sớm mai, giọt nước trong vắt phản chiếu bầu trời và từng đường gân hoa sen thanh tao.',
      script:
        'Sáng sớm khi mặt hồ còn phủ mờ làn sương mỏng, hoa sen hé nở đón nhận tinh hoa của đất trời.\n\n' +
        'Một giọt sương mai trong suốt đọng trên cánh hoa hồng phớt, phản chiếu ánh bình minh lấp lánh như viên ngọc bích.\n\n' +
        'Vẻ đẹp tĩnh lặng và thanh khiết mang lại sự bình an cho tâm hồn người chiêm ngưỡng.',
    },
  ],

  // 14. Điện ảnh phim nhựa 35mm
  film_cinematic: [
    {
      title: 'Chuyến tàu đêm muộn thành phố',
      theme: 'Những mảnh đời trên toa tàu cuối ngày: ánh đèn vàng, khung cửa kính mờ sương và câu chuyện trở về nhà sau một ngày dài mưu sinh.',
      script:
        'Chuyến tàu cuối cùng lăn bánh rời ga khi thành phố đã chìm vào màn đêm tĩnh mịch.\n\n' +
        'Bên khung cửa sổ đọng sương, những ánh mắt xa xăm mang theo bao trăn trở của một ngày dài mưu sinh nơi đô hội.\n\n' +
        'Mỗi con người là một câu chuyện riêng, nhưng tất cả đều chung một đích đến: trở về với mái ấm thân thương.\n\n' +
        'Thành phố không bao giờ ngủ, và những chuyến tàu đêm vẫn âm thầm chuyên chở những giấc mơ.',
    },
    {
      title: 'Ký ức quán trà chiều mùa thu',
      theme: 'Tông màu film ấm áp: tia nắng cuối ngày xuyên qua tán lá vàng, tách trà bốc khói và hoài niệm về những mùa thu đã qua.',
      script:
        'Góc quán cũ vẫn vẹn nguyên chiếc bàn gỗ mộc mạc bên hè phố rợp bóng cây phong.\n\n' +
        'Tách trà nóng lan tỏa hơi ấm giữa tiết trời se lạnh đầu mùa.\n\n' +
        'Thời gian như ngừng trôi trong giây lát, để tâm hồn được lắng lại sau những ồn ào phố thị.',
    },
  ],

  // 15. Trinh thám & Kịch tính (Noir)
  noir_thriller: [
    {
      title: 'Bí mật căn phòng khóa kín',
      theme: 'Tông màu noir kịch tính: tiếng mưa rơi bên ô cửa sổ, bước chân trên hành lang và manh mối bức thư cũ hé lộ sự thật bị chôn vùi.',
      script:
        'Cơn mưa đêm tầm tã như muốn cuốn trôi mọi dấu vết còn sót lại của ngày hôm qua.\n\n' +
        'Chiếc chìa khóa đồng gỉ sét xoay nhẹ trong ổ, cánh cửa gỗ kêu cót két mở ra một bí mật đã ngủ quên suốt ba thập kỷ.\n\n' +
        'Bụi thời gian phủ mờ chiếc bàn làm việc, nơi bức thư dang dở vẫn nằm im lìm dưới ánh đèn vàng leo lét.\n\n' +
        'Sự thật không bao giờ biến mất, nó chỉ kiên nhẫn chờ đợi người đủ dũng cảm để lật mở.',
    },
    {
      title: 'Vết tích trong màn sương mù',
      theme: 'Bóng dáng thám tử dưới cột đèn đường mờ ảo, vệt giày trên con hẻm lát đá và cuộc điều tra vụ án lúc nửa đêm.',
      script:
        'Màn sương dày đặc bao phủ bến cảng cũ, che giấu những tiếng bước chân vội vã trong đêm.\n\n' +
        'Một chiếc áo khoác đen lướt nhanh qua ngã tư vắng, để lại manh mối duy nhất là mặt dây chuyền bạc rơi bên rãnh nước.\n\n' +
        'Mỗi chi tiết nhỏ đều ẩn chứa câu trả lời cho bức màn bí ẩn đang dần được vén lên.',
    },
  ],

  // 16. Giải thích đồ họa (Vox Explainer)
  vox_papercut: [
    {
      title: 'Lỗ đen hình thành như thế nào',
      theme: 'Lỗ đen hình thành như thế nào? Giải thích dễ hiểu về sự sụp đổ của ngôi sao, chân trời sự kiện và cong không-thời gian, dùng đồ họa cắt dán trực quan.',
      script:
        'Một trong những thiên thể bí ẩn nhất bầu đêm, đó là lỗ đen.\n\n' +
        'Khi một ngôi sao đủ lớn cạn kiệt nhiên liệu, lõi sẽ sụp đổ dữ dội dưới trọng lực, mật độ cao đến mức ánh sáng cũng không thoát được — chân trời sự kiện ra đời.\n\n' +
        'Nó không phải máy hút bụi vũ trụ, mà là vùng không-thời gian bị bẻ cong nghiêm trọng. Đến gần đó, thời gian trôi cũng trở nên kỳ lạ.\n\n' +
        'Nhớ nhé: khối lượng đủ lớn, sụp đổ đủ mạnh — lỗ đen xuất hiện.',
    },
    {
      title: 'Tại sao bầu trời lại có màu xanh',
      theme: 'Tại sao bầu trời màu xanh? Dùng hiện tượng tán xạ Rayleigh giải thích ánh sáng mặt trời, phân tử không khí và ráng chiều, minh họa đồ họa chuyển động.',
      script:
        'Nhìn lên, ban ngày bầu trời thường xanh — có phải ngẫu nhiên không?\n\n' +
        'Ánh nắng trông trắng nhưng thực ra chứa nhiều màu. Các phân tử không khí tán xạ ánh sáng xanh mạnh hơn, xanh dễ bị "bắn" ra bốn phía hơn, nên mắt ta thấy bầu trời xanh.\n\n' +
        'Sáng sớm và chiều tà, mặt trời thấp, ánh sáng xuyên qua tầng khí quyển dày hơn, xanh tán hết, còn lại đỏ cam nhuộm đỏ chân trời.\n\n' +
        'Màu sắc của bầu trời là sự hợp tác giữa ánh sáng và không khí.',
    },
    {
      title: 'Một ngày trên Sao Hỏa',
      theme: 'Một ngày trên Sao Hỏa trông như thế nào? So sánh độ dài ngày, nhiệt độ, bão cát và trí tưởng tượng về căn cứ con người, làm thành video khoa học theo cảnh.',
      script:
        'Hãy tưởng tượng bạn thức dậy trên Sao Hỏa: mặt trời xa hơn, nhỏ hơn, bầu trời màu kem nhạt, một ngày khoảng 24 giờ 39 phút.\n\n' +
        'Ban ngày có thể "ấm" đến âm độ, ban đêm lạnh hơn nhiều. Bầu khí quyển CO₂ mỏng không giữ được nhiệt, bão cát thỉnh thoảng phủ kín trời.\n\n' +
        'Các nhà khoa học vẫn đang lên kế hoạch căn cứ: cần chắn bức xạ, tạo oxy, trồng thực phẩm.\n\n' +
        'Hiểu một ngày trên Sao Hỏa là đang tập dượt cho chuyến đi xa tiếp theo của nhân loại.',
    },
    {
      title: 'Phải làm gì khi động đất',
      theme: 'Phải làm gì khi động đất: dùng tình huống thực tế dạy chuẩn bị trước động đất, tư thế tránh nạn và nhận biết tin đồn, khoa học an toàn thực dụng.',
      script:
        'Mặt đất đột ngột rung lên, phản ứng đầu tiên thường là hoảng loạn.\n\n' +
        'Cách đúng là cúi thấp, che chắn, bám chặt, tránh xa cửa sổ và đồ vật cao; đừng chen nhau vào thang máy. Chuẩn bị túi khẩn cấp từ trước hiệu quả hơn ứng phó tức thời.\n\n' +
        'Sau động đất còn phải đề phòng dư chấn và tin đồn. Thông tin chính thống, trật tự hỗ trợ lẫn nhau — mới là sự an toàn thực sự.\n\n' +
        'Biết chút kiến thức động đất, lúc quan trọng sẽ bình tĩnh hơn một phần.',
    },
  ],

  // 17. Phim tài liệu nhân văn
  docu_warm: [
    {
      title: 'Ký sự người thợ gốm cuối cùng',
      theme: 'Nhịp điệu điện ảnh lắng đọng: đôi bàn tay nhào đất, vòng quay bàn gốm và câu chuyện gìn giữ ngọn lửa nghề suốt 40 năm bên dòng sông.',
      script:
        'Bên dòng sông cũ, lò gốm đã đỏ lửa qua hơn bốn mươi mùa mưa nắng.\n\n' +
        'Đôi bàn tay nhăn nheo nhưng vững chãi, nhào từng thớ đất sét mịn màng như đang vỗ về ký ức tuổi trẻ.\n\n' +
        'Bàn xoay quay đều dưới nhịp chân chậm rãi, một chiếc bình gốm mộc mạc dần thành hình trong làn khói mờ ảo.\n\n' +
        'Thời gian có thể trôi mau, nhưng tâm huyết của người thợ thủ công vẫn mãi lắng đọng trong từng đường nét men gốm.',
    },
    {
      title: 'Người giữ ngọn hải đăng nơi đầu sóng',
      theme: 'Khắc họa cuộc sống cô đơn nhưng kiên cường của người canh giữ ngọn hải đăng suốt ba thập kỷ dẫn đường cho những chuyến tàu an toàn cập bến.',
      script:
        'Giữa muôn trùng sóng vỗ, ngọn tháp trắng sừng sững đứng đón gió biển qua bao mùa bão dữ.\n\n' +
        'Mỗi buổi hoàng hôn buông xuống, ánh đèn xoay đều trong đêm tối như ngọn lửa của niềm tin và sự bình an.\n\n' +
        'Sự kiên nhẫn thầm lặng của những người giữ đèn đã mang lại hơi ấm cho hàng ngàn chuyến tàu ngoài khơi xa.',
    },
  ],

  // 18. Minh họa thiếu nhi & Giáo dục
  kids_flat: [
    {
      title: 'Bé học đếm số cùng các bạn động vật vui nhộn',
      theme: 'Hình vẽ 2D màu sắc tươi sáng, giọng đọc ngọt ngào, âm thanh rộn rã giúp trẻ mầm non nhận biết các con số từ 1 đến 10 qua câu chuyện muông thú.',
      script:
        'Chào các bạn nhỏ! Hôm nay chúng mình cùng vào rừng xanh đếm số nhé.\n\n' +
        'Một chú sóc nhỏ ôm hạt dẻ, hai bạn thỏ trắng tai dài nhảy nhót trên bãi cỏ xanh.\n\n' +
        'Ba chú vịt con nối đuôi nhau lội nước bì bõm dưới hồ sen.\n\n' +
        'Toán học thật là vui và thú vị khi chúng mình cùng học mỗi ngày!',
    },
    {
      title: 'Tại sao chúng ta phải rửa tay trước khi ăn?',
      theme: 'Giải thích dễ thương về các bạn vi khuẩn tinh nghịch, bong bóng xà phòng dũng cảm và thói quen giữ gìn vệ sinh cho trẻ em.',
      script:
        'Bàn tay nhỏ của bé sau khi chơi đồ chơi có những bạn vi khuẩn tí hon đang ẩn nấp đấy.\n\n' +
        'Chỉ cần bạn xà phòng thơm và nước sạch xuất hiện, các vi khuẩn xấu sẽ bị cuốn trôi ngay lập tức.\n\n' +
        'Rửa tay sạch sẽ giúp bụng bé luôn khỏe mạnh và ăn cơm ngon miệng hơn nhé!',
    },
  ],

  // 19. Anime Nhật Bản (Ghibli Style)
  soft_anime: [
    {
      title: 'Khu vườn bí mật trên đồi thông',
      theme: 'Phong cách hoạt hình Ghibli: đồng cỏ xanh ngát, gió thổi bay tà áo trắng, ngôi nhà gỗ cổ kính và linh hồn hộ mệnh của khu rừng.',
      script:
        'Men theo con đường mòn phủ đầy hoa dại, bạn sẽ tìm thấy một ngôi nhà gỗ nhỏ nằm ẩn mình trên đỉnh đồi.\n\n' +
        'Nơi đó có những cơn gió mát lành mang theo hương thơm của cỏ cây và tiếng suối reo trong trẻo.\n\n' +
        'Thiên nhiên luôn dang rộng vòng tay đón nhận những ai tìm kiếm sự bình yên và trong sáng của tâm hồn.',
    },
    {
      title: 'Chuyến xe buýt trên mây',
      theme: 'Thế giới huyền ảo anime: chuyến xe lướt trên những đám mây ngũ sắc lúc hoàng hôn, chở những ước mơ tuổi thơ bay về phía chân trời.',
      script:
        'Khi mặt trời lặn nhuộm hồng bầu trời, chuyến xe đặc biệt bắt đầu khởi hành từ sân ga bí mật.\n\n' +
        'Bánh xe lướt nhẹ trên những tầng mây bồng bềnh, mở ra khung cảnh xứ sở diệu kỳ ngoài sức tưởng tượng.\n\n' +
        'Hãy giữ vững niềm tin vào những điều kỳ diệu, bởi giấc mơ đẹp nhất luôn chờ bạn ở phía trước.',
    },
  ],

  // 20. Bảng vẽ phấn & Bài giảng
  chalk_whiteboard: [
    {
      title: 'Bí mật của quang hợp',
      theme: 'Bí mật quang hợp: lá cây biến ánh sáng thành đường như thế nào, vẽ sơ đồ lục lạp, chuyển hóa năng lượng và nguồn oxy của Trái Đất.',
      script:
        'Lá cây không chỉ là trang trí, chúng là nhà máy hóa chất yên tĩnh nhất hành tinh.\n\n' +
        'Lục lạp bắt lấy ánh sáng, biến nước và CO₂ thành đường, đồng thời giải phóng oxy. Không có quá trình này, phần lớn chuỗi thức ăn sẽ đứt gãy.\n\n' +
        'Oxy bạn hít thở, cơm và rau trên bàn ăn — đều gián tiếp đến từ phép màu ánh sáng này.\n\n' +
        'Hiểu quang hợp là hiểu cuốn sổ cái vận hành của sự sống.',
    },
    {
      title: 'Định luật vạn vật hấp dẫn của Newton',
      theme: 'Dùng hình ảnh quả táo rơi và quỹ đạo Mặt Trăng để giải thích lực hút vũ trụ, công thức cơ bản và ứng dụng phóng vệ tinh nhân tạo.',
      script:
        'Tại sao Trái Đất quay quanh Mặt Trời mà không bay mất vào không gian?\n\n' +
        'Mọi vật thể có khối lượng trong vũ trụ đều hút nhau bằng một lực vô hình gọi là lực hấp dẫn.\n\n' +
        'Khối lượng càng lớn, khoảng cách càng gần thì lực hút càng mạnh mẽ.\n\n' +
        'Chính lực hút này giữ cho bước chân chúng ta đứng vững trên mặt đất mỗi ngày.',
    },
  ],

  // 21. Cyberpunk Viễn tưởng
  cyber_neon: [
    {
      title: 'Thành phố ánh sáng năm 2088',
      theme: 'Đô thị tương lai rực rỡ ánh đèn neon: những tòa nhà chọc trời xuyên mây, làn xe bay tấp nập và trợ lý hình ảnh 3 chiều tương tác khắp đường phố.',
      script:
        'Bước chân vào năm 2088, ranh giới giữa thực và ảo đã hoàn toàn hòa làm một.\n\n' +
        'Những dòng xe bay lướt đi êm ái giữa những tầng tháp chọc trời rực sáng ánh đèn neon tím biếc.\n\n' +
        'Dữ liệu và trí tuệ nhân tạo chảy tràn qua từng ngõ ngách, định hình một kỷ nguyên mới của nhân loại.',
    },
    {
      title: 'Chiến binh thầm lặng của thế giới ảo',
      theme: 'Bối cảnh hacker công nghệ cao: áo khoác da phát quang, kính thực tế tăng cường và cuộc rượt đuổi bảo vệ dữ liệu bí mật trong mạng lưới ngầm.',
      script:
        'Dưới cơn mưa axit của thành phố ngầm, những dòng mã số xanh lục cuộn trào trên chiếc kính thông minh.\n\n' +
        'Một cuộc chiến thầm lặng diễn ra trong từng nano giây để bảo vệ sự thật của thế giới kỹ thuật số.',
    },
  ],

  // 22. Thế giới kỳ ảo (Fantasy)
  epic_fantasy: [
    {
      title: 'Huyền thoại thanh kiếm rồng cổ xưa',
      theme: 'Lâu đài trên mây mù tuyết phủ: hiệp sĩ giáp bạc, rồng lửa thức giấc trong lòng núi lửa và sứ mệnh tìm lại thanh cổ kiếm ngàn năm.',
      script:
        'Ngàn năm trước, thanh kiếm rồng đã phong ấn bóng tối dưới đáy vực sâu thăm thẳm.\n\n' +
        'Khi những vì tinh tú trên đỉnh núi tuyết xếp thành đường thẳng, tiếng gầm của loài rồng lại vang vọng giữa bầu trời đêm.\n\n' +
        'Một hiệp sĩ trẻ bước vào cuộc hành trình định mệnh, nơi lòng dũng cảm sẽ thắp sáng lại hy vọng cho toàn vương quốc.',
    },
    {
      title: 'Bí mật khu rừng cấm của tộc Tiên',
      theme: 'Cây thần đại ngàn phát sáng lấp lánh ánh trăng, sinh vật huyền bí trong sương mờ và lời nguyền bảo vệ nguồn cội sự sống.',
      script:
        'Sâu trong khu rừng cấm, nơi con người chưa từng đặt chân tới, những chiếc lá bồ đề vẫn lấp lánh bụi tiên ngũ sắc.\n\n' +
        'Dòng suối pha lê chảy róc rách mang theo sinh khí nuôi dưỡng cả một vùng đất kỳ diệu.\n\n' +
        'Những bí mật của thế giới tự nhiên chỉ mở ra với những trái tim chân thành và thuần khiết.',
    },
  ],

  // 23. Cắt dán tạp chí (Collage Pop)
  magazine_collage: [
    {
      title: 'Xu hướng thời trang đường phố Gen Z 2026',
      theme: 'Phong cách Pop Art cắt dán năng động: phối màu neon rực rỡ, font chữ typography ấn tượng, kết hợp phụ kiện retro và cá tính thời trang.',
      script:
        'Thời trang đường phố năm nay là sàn diễn của sự tự do và phá cách không giới hạn.\n\n' +
        'Sự kết hợp táo bạo giữa áo khoác dù vintage thập niên 90 và phụ kiện kim loại mang hơi thở tương lai.\n\n' +
        'Không có quy chuẩn nào bắt buộc, phong cách đẹp nhất chính là phong cách tự tin là chính mình.',
    },
    {
      title: 'Cẩm nang du lịch cuối tuần cho người bận rộn',
      theme: 'Cắt dán vé máy bay, tách cà phê, bản đồ mini và ảnh polaroid: gợi ý 48 giờ khám phá ẩm thực và ngắm hoàng hôn tại thành phố biển.',
      script:
        'Chỉ cần 48 giờ cuối tuần để bạn hoàn toàn F5 lại bản thân sau chuỗi ngày làm việc căng thẳng.\n\n' +
        'Sáng cà phê ngắm sóng vỗ, trưa thưởng thức hải sản tươi ngon và chiều đạp xe lộng gió dọc bờ biển.\n\n' +
        'Xách balo lên và đi ngay thôi, những chuyến đi bất chợt luôn đem lại nhiều kỷ niệm đáng nhớ nhất!',
    },
  ],

  // 24. Quảng cáo thương hiệu tối giản
  brand_clean: [
    {
      title: 'Nước hoa hương gỗ tự nhiên cao cấp',
      theme: 'Góc chụp studio tối giản: ánh sáng mềm dịu, chai thủy tinh trong suốt tinh xảo, giọt nước tinh khiết và thông điệp thanh lịch sang trọng.',
      script:
        'Sự quyến rũ đích thực bắt đầu từ sự tinh tế và tối giản đến thuần khiết.\n\n' +
        'Hương gỗ tuyết tùng trầm ấm hòa quyện cùng chút cay nồng của tiêu hồng, tạo nên dấu ấn độc bản khó phai.\n\n' +
        'Tôn vinh khí chất lịch lãm và phong thái đĩnh đạc của người đàn ông hiện đại.',
    },
    {
      title: 'Bộ sưu tập thời trang bền vững từ sợi tre',
      theme: 'Tone màu be nhã nhặn: thớ vải mịn màng thoáng mát, đường may thủ công tỉ mỉ và cam kết thân thiện với môi trường tự nhiên.',
      script:
        'Mặc đẹp không chỉ vì bản thân, mà còn vì sự bền vững của Trái Đất ngày mai.\n\n' +
        'Chất liệu sợi tre hữu cơ mềm mại như lụa, thấm hút mồ hôi tối đa và tự phân hủy sinh học tự nhiên.\n\n' +
        'Lựa chọn sống xanh bắt đầu từ chính bộ trang phục bạn khoác lên người mỗi ngày.',
    },
  ],

  // 25. Game Pixel 8-bit / 16-bit
  pixel_retro: [
    {
      title: 'Hành trình hiệp sĩ giải cứu công chúa retro',
      theme: 'Đồ họa pixel hoài niệm: âm thanh 8-bit chiptune rộn rã, hiệp sĩ tí hon nhảy qua chướng ngại vật và nhặt đồng xu vàng kinh điển.',
      script:
        'Sẵn sàng cầm tay cầm lên và bước vào chuyến phiêu lưu tuổi thơ chưa các game thủ?\n\n' +
        'Vượt qua 8 ải hầm ngục dung nham, tránh bẫy gai nhọn và thu thập đủ 100 đồng xu vàng may mắn.\n\n' +
        'Trận đấu trùm cuối cùng đang chờ đợi, hãy tung chiêu kiếm lửa để ghi tên mình lên bảng vàng điểm cao nhất!',
    },
    {
      title: 'Cuộc chiến tàu vũ trụ ngoài không gian Pixel',
      theme: 'Bắn thiên thạch và tàu địch: nâng cấp súng laser màu sắc rực rỡ, đồ họa pixel arcade phong cách máy gạt xèng thùng thập niên 80.',
      script:
        'Cảnh báo: Hạm đội thiên thạch đang tràn vào quỹ đạo phòng thủ Trái Đất!\n\n' +
        'Lái con tàu vũ trụ pixel luồn lách qua làn mưa đạn laser và nhặt các hộp nâng cấp khiên chắn.\n\n' +
        'Giữ vững phong độ ngón tay trên nút bắn để phá kỷ lục điểm số toàn server ngay hôm nay!',
    },
  ],

  // 26. Băng từ VHS thập niên 90
  retro_vhs: [
    {
      title: 'Bản tin dự báo thời tiết năm 1995',
      theme: 'Vệt nhiễu từ scanline VHS, màu sắc ngả vàng hoài cổ, phông chữ truyền hình analog thập niên 90 và lời dẫn chương trình mang đậm dấu ấn thời gian.',
      script:
        'Xin kính chào quý vị và các bạn đang theo dõi bản tin truyền hình buổi tối ngày hôm nay.\n\n' +
        'Dự báo một đợt gió mùa đông bắc sắp tràn về mang theo những cơn mưa phùn đầu mùa se lạnh.\n\n' +
        'Chúc quý khán giả có một buổi tối ấm áp bên chiếc tivi gia đình thân thương.',
    },
    {
      title: 'Kỷ niệm chuyến du lịch gia đình hè năm 1998',
      theme: 'Camcorder quay tay rung nhẹ, dòng ngày giờ góc màn hình nhấp nháy, nụ cười thơ ngây trên bãi biển và cảm xúc hoài niệm xúc động.',
      script:
        'Những thước phim cũ quay bằng cuộn băng từ đã phai màu theo năm tháng.\n\n' +
        'Tiếng cười giòn tan của bố mẹ khi đưa chúng mình đi tắm biển lần đầu tiên trong đời.\n\n' +
        'Công nghệ có thể đổi thay, nhưng những kỷ niệm yêu thương của gia đình sẽ luôn sống mãi với thời gian.',
    },
  ],

  // 27. Tranh thủy mặc nghệ thuật
  ink_guofeng: [
    {
      title: 'Ngàn dặm giang sơn dưới nét cọ thủy mặc',
      theme: 'Nét mực đen loang trên nền giấy xuyến chỉ trắng: đỉnh núi mây mù ẩn hiện, người chèo thuyền cô độc giữa dòng sông và tiếng đàn tranh thanh tao.',
      script:
        'Chỉ với một giọt mực đen và nước suối trong lành, cả một bức tranh non sông ngàn dặm bỗng hiện ra sinh động.\n\n' +
        'Đỉnh núi nhấp nhô ẩn hiện giữa biển mây trắng bồng bềnh, con thuyền nan lướt nhẹ trên làn nước bạc tĩnh lặng.\n\n' +
        'Nghệ thuật thủy mặc không vẽ cái hình bên ngoài, mà vẽ cái thần thái và sự an yên của vạn vật đất trời.',
    },
    {
      title: 'Hạc trắng bay qua rặng trúc xanh',
      theme: 'Phong cách cổ phong thanh tao: nét cọ đậm nhạt ước lệ, đôi chim hạc lượn cánh trên rừng trúc, làn sương sớm và triết lý sống tĩnh tại vô vi.',
      script:
        'Rặng trúc xanh nghiêng mình đón gió đông thoang thoảng hương sương mai.\n\n' +
        'Đôi cánh hạc trắng lượn vòng thanh thoát giữa trời xanh, biểu tượng của sự thanh cao và trường thọ ngàn năm.\n\n' +
        'Giữ cho lòng mình tĩnh tại như mặt hồ phẳng lặng, mọi phong ba bão táp rồi cũng sẽ nhẹ nhàng trôi qua.',
    },
    {
      title: 'Mưa xuân trên bến đò Giang Nam',
      theme: 'Cảnh sắc cổ kính thơ mộng: cầu đá rêu phong, mái ngói âm dương phủ mưa bụi và cánh hoa đào trôi theo dòng nước trong tranh thủy mặc.',
      script:
        'Cơn mưa phùn mùa xuân giăng mắc mờ ảo trên bến sông cũ.\n\n' +
        'Từng giọt nước mưa rơi trên phiến ngói âm dương rêu phong, làm rơi rụng vài cánh đào phai trôi theo dòng nước biếc.\n\n' +
        'Một nét chấm phá đơn sơ mà gói trọn cả nét đẹp đượm buồn và lãng mạn của vùng sông nước nghìn năm.',
    },
  ],
}

/**
 * Lấy danh sách gợi ý cảm hứng được "may đo" chính xác cho Template đang chọn.
 */
export function getInspirationsForTemplate(
  template?: { id: string; category?: string[] } | null,
  activeCategory?: string,
): Inspiration[] {
  // 1. Khớp trực tiếp 100% theo Template ID
  if (template?.id && INSPIRATIONS_BY_TEMPLATE[template.id]) {
    return INSPIRATIONS_BY_TEMPLATE[template.id]
  }

  // 2. Nếu template chưa có danh sách riêng, tìm theo họ hàng ID gần nhất
  if (template?.id) {
    if (template.id.includes('douyin') || template.id.includes('tiktok') || template.id.includes('hook')) {
      return INSPIRATIONS_BY_TEMPLATE['huoke_douyin_hook']
    }
    if (template.id.includes('xhs') || template.id.includes('recommend') || template.id.includes('product')) {
      return INSPIRATIONS_BY_TEMPLATE['huoke_xhs_recommend']
    }
    if (template.id.includes('review') || template.id.includes('facts')) {
      return INSPIRATIONS_BY_TEMPLATE['huoke_review_facts']
    }
    if (template.id.includes('opensource') || template.id.includes('software') || template.id.includes('app')) {
      return INSPIRATIONS_BY_TEMPLATE['opensource_showcase']
    }
    if (template.id.includes('guofeng') || template.id.includes('ink')) {
      return INSPIRATIONS_BY_TEMPLATE['ink_guofeng']
    }
    if (template.id.includes('vhs') || template.id.includes('retro_vhs')) {
      return INSPIRATIONS_BY_TEMPLATE['retro_vhs']
    }
    if (template.id.includes('pixel')) {
      return INSPIRATIONS_BY_TEMPLATE['pixel_retro']
    }
    if (template.id.includes('anime')) {
      return INSPIRATIONS_BY_TEMPLATE['soft_anime']
    }
    if (template.id.includes('3d') || template.id.includes('anim')) {
      return INSPIRATIONS_BY_TEMPLATE['anim_3d']
    }
    if (template.id.includes('film') || template.id.includes('cinematic') || template.id.includes('movie')) {
      return INSPIRATIONS_BY_TEMPLATE['film_cinematic']
    }
    if (template.id.includes('noir') || template.id.includes('thriller')) {
      return INSPIRATIONS_BY_TEMPLATE['noir_thriller']
    }
    if (template.id.includes('cyber') || template.id.includes('neon')) {
      return INSPIRATIONS_BY_TEMPLATE['cyber_neon']
    }
    if (template.id.includes('papercut') || template.id.includes('vox') || template.id.includes('chalk')) {
      return INSPIRATIONS_BY_TEMPLATE['vox_papercut']
    }
  }

  // 3. Fallback theo Category của Template hoặc activeCategory tab
  const categoryList = [...(template?.category || []), ...(activeCategory ? [activeCategory] : [])]
  for (const cat of categoryList) {
    const lower = cat.toLowerCase()
    if (lower.includes('thủy mặc') || lower.includes('cổ phong')) {
      return INSPIRATIONS_BY_TEMPLATE['ink_guofeng']
    }
    if (lower.includes('tiktok') || lower.includes('reels') || lower.includes('marketing')) {
      return INSPIRATIONS_BY_TEMPLATE['huoke_douyin_hook']
    }
    if (lower.includes('review') || lower.includes('bán hàng') || lower.includes('thương mại')) {
      return INSPIRATIONS_BY_TEMPLATE['huoke_xhs_recommend']
    }
    if (lower.includes('công nghệ') || lower.includes('phần mềm')) {
      return INSPIRATIONS_BY_TEMPLATE['opensource_showcase']
    }
    if (lower.includes('kiến thức') || lower.includes('khoa học') || lower.includes('giáo dục')) {
      return INSPIRATIONS_BY_TEMPLATE['vox_papercut']
    }
    if (lower.includes('điện ảnh') || lower.includes('phim')) {
      return INSPIRATIONS_BY_TEMPLATE['film_cinematic']
    }
    if (lower.includes('hoạt hình') || lower.includes('3d')) {
      return INSPIRATIONS_BY_TEMPLATE['anim_3d']
    }
    if (lower.includes('pixel') || lower.includes('vhs') || lower.includes('retro')) {
      return INSPIRATIONS_BY_TEMPLATE['pixel_retro']
    }
  }

  // Fallback mặc định an toàn
  return INSPIRATIONS_BY_TEMPLATE['huoke_douyin_hook']
}
