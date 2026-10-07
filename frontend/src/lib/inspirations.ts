export type Inspiration = {
  title: string
  theme: string
  script: string
}

/**
 * Danh sách gợi ý cảm hứng được may đo trực tiếp cho TOÀN BỘ 37 Template của hệ thống.
 * Mỗi Template ID có đúng 20 chủ đề và kịch bản mẫu hoàn chỉnh đúng chuẩn phong cách thị giác và cấu trúc (tổng cộng 740 mục gợi ý).
 */
export const INSPIRATIONS_BY_TEMPLATE: Record<string, Inspiration[]> = {
  // 1. Template: huoke_douyin_hook (20 mục)
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
    {
      title: 'Đừng mua bàn chải điện nếu chưa xem video này',
      theme: 'Vạch trần chiêu trò bàn chải điện giá rẻ gây mòn men răng. Hook 3s: \'Tiền mất tật mang nếu không biết điều này!\', phân tích lông cứng và tần số rung.',
      script:
        'Nhiều người nghĩ mua bàn chải điện giá vài chục ngàn là hời, nhưng đây là lý do nha sĩ luôn lắc đầu ngán ngẩm.\n\n' +
        'Thứ nhất: Lông bàn chải bằng nhựa cứng chưa qua bo tròn, mỗi lần rung sẽ tạo ra hàng ngàn vết xước li ti trên men răng.\n\n' +
        'Thứ hai: Tần số rung không ổn định làm tổn thương mô nướu, dẫn đến tụt lợi và viêm nha chu sau vài tháng.\n\n' +
        'Muốn chọn bàn chải chuẩn, hãy tìm loại có lông mềm DuPont và cảm biến lực tự ngắt nhé!',
    },
    {
      title: '3 thói quen ban đêm giúp thức dậy tràn đầy năng lượng',
      theme: 'Thói quen buổi tối giúp cơ thể ngủ sâu: tắm nước ấm trước 90 phút, giữ phòng 22-24 độ C và dừng ăn ngọt sau 8h tối.',
      script:
        'Cảm giác mệt mỏi buổi sáng thực chất bắt nguồn từ những gì bạn làm vào tối hôm trước.\n\n' +
        'Tập ngay 3 thói quen này: Thứ nhất, tắm nước ấm trước khi ngủ 90 phút để kích thích cơ thể hạ nhiệt tự nhiên, tạo tín hiệu buồn ngủ.\n\n' +
        'Thứ hai: Đặt nhiệt độ phòng từ 22 đến 24 độ C — dải nhiệt độ lý tưởng nhất cho giấc ngủ sâu REM.\n\n' +
        'Thứ ba: Dừng ăn đồ ngọt sau 8 giờ tối để tránh đường huyết tăng vọt làm gián đoạn giấc ngủ giữa đêm!',
    },
    {
      title: 'Cách khử mùi ẩm mốc phòng ngủ trong 5 phút',
      theme: 'Mẹo vặt khử mùi ẩm mốc mùa nồm bằng bã cà phê phơi khô và tinh dầu sả chanh tự nhiên, tiết kiệm chi phí.',
      script:
        'Mùa mưa nồm khiến phòng ngủ ẩm mốc và có mùi khó chịu? Đừng vội mua máy hút mùi đắt đỏ, hãy làm cách này.\n\n' +
        'Lấy một chén bã cà phê đã phơi khô đặt ở góc phòng, bã cà phê có cấu trúc xốp hút ẩm và hấp thụ mùi hôi cực kỳ hiệu quả.\n\n' +
        'Kết hợp xông 3 giọt tinh dầu tràm hoặc sả chanh để diệt khuẩn không khí và mang lại cảm giác thư thái như ở spa.\n\n' +
        'Thử ngay hôm nay, căn phòng của bạn sẽ thơm mát dễ chịu tức thì!',
    },
    {
      title: 'Tại sao bạn học mãi mà không nhớ?',
      theme: 'Giải mã hiện tượng quên kiến thức và phương pháp lặp lại ngắt quãng Spaced Repetition giúp nhớ lâu gấp 5 lần.',
      script:
        'Bạn có từng đọc xong một cuốn sách hoặc ôn bài cả đêm nhưng hôm sau đầu óc vẫn trống rỗng không?\n\n' +
        'Đó là vì bạn đang mắc bẫy \'ảo tưởng tri thức\' khi chỉ đọc thụ động mà không kích hoạt khả năng truy xuất của não bộ.\n\n' +
        'Áp dụng ngay phương pháp lặp lại ngắt quãng: Ôn lại sau 1 ngày, 3 ngày, 7 ngày và 14 ngày.\n\n' +
        'Chỉ cần 5 phút kiểm tra lại bản thân mỗi chu kỳ, kiến thức sẽ được chuyển từ trí nhớ ngắn hạn vào trí nhớ vĩnh viễn!',
    },
    {
      title: 'Cách từ chối khéo léo khi bị hỏi mượn tiền',
      theme: 'Kịch bản từ chối tiền tinh tế không mất lòng: nêu rõ nguyên tắc quản lý tài chính gia đình và hướng dẫn cách hỗ trợ phi tiền bạc.',
      script:
        'Bị bạn bè hoặc người quen hỏi vay tiền nhưng không muốn cho mượn mà sợ mất lòng? Lưu ngay câu trả lời mẫu này.\n\n' +
        'Đừng ngập ngừng hay hứa hẹn quanh co, hãy nói thẳng một cách lịch thiệp: \'Hiện tại toàn bộ tiền nhàn rỗi mình đã gửi vào sổ tiết kiệm có kỳ hạn và quỹ bảo hiểm gia đình không rút ra được.\'\n\n' +
        '\'Nếu việc của bạn cần hỗ trợ về mặt thông tin, kết nối công việc thì mình luôn sẵn lòng giúp hết sức.\'\n\n' +
        'Từ chối dứt khoát ngay từ đầu vừa giữ được tiền, vừa giữ được sự tôn trọng và mối quan hệ bền lâu!',
    },
    {
      title: '3 món đồ công nghệ không nên mua hàng cũ',
      theme: 'Cảnh báo 3 thiết bị điện tử mua hàng 2nd-hand rủi ro cao: ổ cứng SSD, nguồn máy tính PSU và tai nghe nhét tai In-ear.',
      script:
        'Mua đồ công nghệ cũ có thể giúp tiết kiệm tiền, nhưng với 3 món đồ này, bạn tuyệt đối phải mua mới 100%.\n\n' +
        'Thứ nhất: Ổ cứng SSD — chip nhớ flash có số lần đọc ghi hữu hạn, ổ cũ có thể đột tử bất cứ lúc nào làm mất sạch dữ liệu quan trọng.\n\n' +
        'Thứ hai: Nguồn máy tính PSU — nguồn cũ linh kiện tụ điện lão hóa, chập cháy một phát là kéo theo cả dàn linh kiện tiền chục triệu ra đi.\n\n' +
        'Thứ ba: Tai nghe nhét tai In-ear — vấn đề vệ sinh và vi khuẩn bám trong ống tai người khác tiềm ẩn nguy cơ viêm nhiễm cực kỳ nguy hiểm!',
    },
    {
      title: 'Sự thật về trào lưu uống nước ép cần tây',
      theme: 'Vạch trần quảng cáo thần thánh hóa cần tây: không có khả năng giải độc mỡ máu, cảnh báo nguy cơ hạ huyết áp và sỏi thận.',
      script:
        'Cần tây được tâng bốc như thần dược giải độc và giảm cân cấp tốc, nhưng sự thật khoa học là gì?\n\n' +
        'Cần tây chứa tới 95% là nước và một lượng nhỏ chất xơ, việc bạn giảm cân là do bạn uống nước thay vì ăn thức ăn giàu calo.\n\n' +
        'Uống quá nhiều cần tây sống có thể làm tăng lượng Oxalate gây sỏi thận và hạ huyết áp đột ngột ở những người có thể trạng yếu.\n\n' +
        'Hãy ăn rau xanh đa dạng kết hợp tập luyện, chứ đừng đặt trọn niềm tin vào một cốc nước ép thần thánh nào cả!',
    },
    {
      title: 'Mẹo đặt vé máy bay giá rẻ vào phút chót',
      theme: 'Kinh nghiệm săn vé rẻ: bật chế độ ẩn danh, tránh đặt vào cuối tuần và mẹo chọn giờ bay sáng sớm hoặc đêm muộn.',
      script:
        'Muốn săn vé máy bay giá hời mà không bị các hãng hàng không theo dõi nâng giá? Áp dụng ngay 3 mẹo này.\n\n' +
        'Thứ nhất: Luôn bật tab trình duyệt ẩn danh khi tìm vé, tránh để cookie theo dõi tần suất tìm kiếm làm giá vé tự động tăng vọt.\n\n' +
        'Thứ hai: Khung giờ vàng để chốt vé là vào đêm thứ Ba hoặc rạng sáng thứ Tư — thời điểm các hãng xả kho vé khuyến mại nhiều nhất tuần.\n\n' +
        'Thứ ba: Chọn chuyến bay khởi hành trước 6 giờ sáng hoặc sau 10 giờ đêm, giá vé thường rẻ hơn từ 30 đến 40% so với giờ đẹp ban ngày!',
    },
    {
      title: 'Tại sao bạn thức khuya dù mắt rất mỏi?',
      theme: 'Giải mã hội chứng \'Thức khuya trả thù tâm lý\' Revenge Bedtime Procrastination và cách thoát khỏi vòng lặp kiệt sức.',
      script:
        'Đồng hồ điểm 1 giờ sáng, mắt cay xè nhưng ngón tay vẫn không ngừng lướt màn hình điện thoại? Bạn đang mắc hội chứng \'Thức khuya trả thù\'.\n\n' +
        'Ban ngày bạn dành toàn bộ thời gian phục vụ công việc của sếp, yêu cầu của khách hàng và gia đình, không có một phút giây nào cho riêng mình.\n\n' +
        'Ban đêm là khoảng thời gian duy nhất bạn cảm thấy mình được tự do làm chủ cuộc sống, nên bộ não vô thức trì hoãn giấc ngủ để tận hưởng.\n\n' +
        'Cách giải quyết: Hãy dành ra đúng 30 phút buổi chiều làm điều mình thích, bạn sẽ không còn cảm giác thèm thức khuya nữa!',
    },
    {
      title: '3 thói quen hủy hoại làn da của dân văn phòng',
      theme: 'Cảnh báo thói quen xấu: sờ tay lên mặt, uống trà sữa thay nước lọc và ngồi sát điều hòa thổi thẳng vào da gây khô ráp.',
      script:
        'Ngồi máy lạnh cả ngày mà da dẻ vẫn nổi mụn sần sùi và đổ dầu bóng nhẫy? Thủ phạm chính là 3 thói quen này.\n\n' +
        'Thứ nhất: Thói quen chống cằm sờ tay lên mặt mang theo hàng triệu vi khuẩn từ bàn phím và chuột máy tính lây lan sang lỗ chân lông.\n\n' +
        'Thứ hai: Để luồng gió điều hòa phả thẳng vào mặt khiến da bị mất nước nghiêm trọng, buộc tuyến dầu phải tiết bã nhờn quá mức để bù ẩm.\n\n' +
        'Thứ ba: Uống trà sữa, nước ngọt thay nước lọc làm lượng đường trong máu tăng vọt phá hủy các sợi collagen khiến da nhanh lão hóa!',
    },
    {
      title: 'Cách nói chuyện trước đám đông không bị run giọng',
      theme: 'Kỹ thuật kiểm soát nhịp thở cơ hoành, mẹo hướng ánh mắt vào trán khán giả và nguyên tắc tạm dừng 2 giây trước khi nói.',
      script:
        'Cứ đứng lên phát biểu trước đám đông là tim đập thình thịch, tay chân run lẩy bẩy và giọng nói bị nghẹn lại?\n\n' +
        'Áp dụng ngay 3 bí quyết của các diễn giả chuyên nghiệp: Thứ nhất, hít thở sâu bằng cơ hoành bụng 3 lần trước khi bước lên bục để hạ nhịp tim tức thì.\n\n' +
        'Thứ hai: Đừng nhìn thẳng vào mắt khán giả nếu thấy áp lực, hãy nhìn vào khoảng trống giữa hai chân mày của họ.\n\n' +
        'Thứ ba: Trước khi bắt đầu câu nói, hãy mỉm cười và dừng lại đúng 2 giây để làm chủ sân khấu. Khán giả sẽ cảm nhận bạn là người cực kỳ điềm tĩnh!',
    },
    {
      title: 'Sai lầm khi giặt áo len khiến áo bị co rút',
      theme: 'Hướng dẫn giặt và phơi áo len: giặt nước lạnh, không vắt xoắn mạnh, phơi trải phẳng trên lưới thay vì treo móc.',
      script:
        'Chiếc áo len đắt tiền mua về giặt đúng một lần bỗng co rúm lại thành áo trẻ con? Bạn đã mắc phải sai lầm nghiêm trọng này.\n\n' +
        'Sợi len tự nhiên khi gặp nước nóng và chuyển động vắt xoắn mạnh của máy giặt sẽ bị khóa chặt các sợi vảy lại với nhau gây co rút vĩnh viễn.\n\n' +
        'Cách giặt chuẩn: Chỉ giặt bằng nước lạnh với dầu gội đầu hoặc nước giặt dịu nhẹ, dùng khăn tắm ép ráo nước nhẹ nhàng.\n\n' +
        'Tuyệt đối không treo áo len lên móc đứng vì sức nặng của nước sẽ kéo dãn cổ áo, hãy trải phẳng áo trên lưới phơi nằm ngang nhé!',
    },
    {
      title: 'Mẹo chọn dưa hấu ngọt lịm cuống teo đít nhỏ',
      theme: 'Mẹo vặt chọn dưa hấu: nhìn rốn dưa nhỏ lõm sâu, cuống dưa héo khô quăn lại, mảng vàng đáy quả và vỗ vào nghe tiếng bộp bộp.',
      script:
        'Đi chợ mua dưa hấu mà chỉ biết bổ ngửa chờ hên xui? Nhớ ngay 4 dấu hiệu của quả dưa hấu già ngọt lịm này.\n\n' +
        'Thứ nhất: Nhìn phần rốn ở đáy quả dưa, rốn càng nhỏ và lõm sâu vào trong thì vỏ dưa càng mỏng và ruột càng ngọt đậm.\n\n' +
        'Thứ hai: Phần đốm vàng ở đáy dưa — quả dưa chín tự nhiên trên ruộng sẽ có mảng màu vàng cam đậm đà do tiếp xúc với đất đủ ngày.\n\n' +
        'Thứ ba: Cuống dưa phải héo khô và xoăn tít lại chứng tỏ dưa già chín tới, chứ cuống xanh mướt là dưa non hái vội ăn rất nhạt nhẽo!',
    },
    {
      title: '3 câu nói giúp bạn bình tĩnh khi tức giận',
      theme: 'Phương pháp kiểm soát cơn giận EQ cao: nhận diện cảm xúc, tạm hoãn phản ứng 10 giây và chuyển hóa góc nhìn thấu cảm.',
      script:
        'Mỗi khi cơn giận bùng lên, nếu không kiểm soát bạn sẽ thốt ra những lời cay độc phá hủy các mối quan hệ quý giá nhất.\n\n' +
        'Khi cảm thấy máu dồn lên não, hãy nhẩm ngay 3 câu thần chú này trong đầu:\n\n' +
        'Câu 1: \'Cảm xúc này là tạm thời, nhưng hậu quả của lời nói là vĩnh viễn.\'\n\n' +
        'Câu 2: \'Mình phản ứng lại để giải quyết vấn đề hay chỉ để thỏa mãn cái tôi ích kỷ?\'\n\n' +
        'Và câu 3: \'Sau 1 năm nữa, chuyện này có còn quan trọng không?\'. Bạn sẽ thấy cơn giận dịu đi và tìm lại được sự sáng suốt!',
    },
  ],

  // 2. Template: huoke_xhs_recommend (20 mục)
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
    {
      title: 'Hộp cơm giữ nhiệt 3 tầng cho dân văn phòng',
      theme: 'Hộp cơm giữ nhiệt inox 304, giữ nóng 8 tiếng, có ngăn chia canh chống tràn, gọn gàng mang đi làm.',
      script:
        'Từ ngày tậu em hộp cơm giữ nhiệt này, mình đã cai hẳn thói quen gọi đồ ăn ngoài vừa tốn kém vừa không đảm bảo vệ sinh.\n\n' +
        'Thiết kế 3 tầng riêng biệt bằng inox 304 chuẩn y tế: tầng dưới đựng canh nóng hổi có gioăng cao su chống tràn tuyệt đối, tầng giữa đựng thức ăn và tầng trên đựng cơm dẻo thơm.\n\n' +
        'Sáng nấu cơm từ 7h, đến 12h trưa mở ra khói vẫn bốc nghi ngút, canh vẫn nóng hổi ấm bụng.\n\n' +
        'Rất khuyên các bạn nhân viên văn phòng nên đầu tư một chiếc nhé!',
    },
    {
      title: 'Đôi giày sneaker êm ái đi bộ vạn bước',
      theme: 'Giày thể thao đế đệm bọt khí êm như đi trên mây, trọng lượng siêu nhẹ, phối màu pastel thanh lịch.',
      script:
        'Nếu bạn đang tìm một đôi giày để đi du lịch hoặc đi bộ cả ngày mà không bị nhức mỏi gót chân thì lưu ngay em này lại.\n\n' +
        'Phần đế sử dụng công nghệ đệm bọt khí đàn hồi cao, mỗi bước chân đều có cảm giác bồng bềnh như dẫm trên bông.\n\n' +
        'Chất liệu vải dệt co giãn thoáng khí tuyệt đối, không lo bí bách hay bốc mùi dù mang suốt 12 tiếng liên tục.\n\n' +
        'Phối màu trắng kem nhã nhặn cực kỳ dễ mix đồ từ quần jeans năng động đến chân váy nhẹ nhàng!',
    },
    {
      title: 'Bình giữ nhiệt titan siêu nhẹ 24 giờ',
      theme: 'Bình giữ nhiệt chất liệu Titanium kháng khuẩn, không để lại mùi vị trà cà phê, nhẹ hơn thép 40%.',
      script:
        'Chiếc bình giữ nhiệt làm mình ấn tượng nhất từ trước đến nay — được đúc từ chất liệu Titanium siêu cấp.\n\n' +
        'Điểm tuyệt vời nhất là Titanium hoàn toàn trơ về mặt hóa học, bạn đựng cà phê muối, trà chanh hay nước ép hoa quả đều không bị biến đổi mùi vị hay ố vàng lòng bình.\n\n' +
        'Trọng lượng chỉ bằng một nửa so với bình giữ nhiệt inox thông thường, cầm nhẹ tênh trong tay.\n\n' +
        'Sáng đổ đá lạnh vào, đến tối muộn đá vẫn còn nguyên vẹn, cực kỳ đáng tiền!',
    },
    {
      title: 'Kem chống nắng nâng tông kiềm dầu chân ái',
      theme: 'Kem chống nắng kiềm dầu suốt 8 tiếng, nâng tông trắng hồng tự nhiên thay thế lớp kem nền.',
      script:
        'Mùa hè da dầu mụn tìm được tuýp kem chống nắng không vón cục, không trắng bệch thực sự giống như mò kim đáy bể.\n\n' +
        'Và đây là chân ái của mình sau khi thử qua hơn chục loại: kết cấu dạng sữa lỏng thấm nhanh sau 10 giây, để lại lớp finish ráo mịn khô thoáng.\n\n' +
        'Khả năng kiềm dầu đỉnh cao suốt cả ngày dài làm việc dưới máy lạnh mà không hề bị xuống tông hay loang lổ.\n\n' +
        'Nâng tông nhẹ nhàng tự nhiên như thoa một lớp kem nền mỏng nhẹ, cực kỳ tự tin khi ra đường!',
    },
    {
      title: 'Gối công thái học chống đau mỏi vai gáy',
      theme: 'Gối memory foam định hình nâng đỡ đốt sống cổ, rãnh thở thoáng khí giúp ngủ sâu giấc không bị cứng cổ.',
      script:
        'Ai hay thức dậy với cái cổ đau ê ẩm hoặc vai gáy nhức mỏi thì phải đổi ngay sang chiếc gối công thái học này.\n\n' +
        'Thiết kế đường cong cánh bướm thông minh ôm trọn lấy đường cong sinh lý của đốt sống cổ, giúp giải tỏa hoàn toàn áp lực đè nén lên dây thần kinh khi nằm ngủ.\n\n' +
        'Dù bạn nằm ngửa hay nằm nghiêng, cổ và cột sống luôn được giữ trên một đường thẳng tự nhiên.\n\n' +
        'Chất liệu cao su non đàn hồi chậm êm ái, bảo hành không bị xẹp lún suốt 5 năm!',
    },
    {
      title: 'Bàn chải điện sóng âm chống mảng bám',
      theme: 'Bàn chải điện công nghệ sóng âm Sonic 40.000 nhịp/phút, lông mềm bọc silicon êm dịu, pin trâu 90 ngày dùng thử.',
      script:
        'Ai hay bị viêm lợi hoặc chảy máu chân răng khi đánh răng thì nên chuyển ngay sang mẫu bàn chải điện sóng âm này.\n\n' +
        'Tần số rung 40.000 nhịp mỗi phút tạo ra hàng triệu bọt nước li ti len lỏi sâu vào từng kẽ răng đánh bay 99% mảng bám ố vàng cứng đầu.\n\n' +
        'Cảm biến áp lực thông minh tự động giảm lực rung khi bạn đè quá mạnh tay, bảo vệ men răng và nướu nhạy cảm hoàn hảo.\n\n' +
        'Sạc một lần dùng thoải mái suốt 3 tháng liền, thiết kế màu hồng phấn siêu xinh xắn để trong nhà tắm cực kỳ sang chảnh!',
    },
    {
      title: 'Nến thơm tinh dầu hoa oải hương ru ngủ',
      theme: 'Hũ nến thơm sáp đậu nành mùi Lavender và gỗ tuyết tùng ấm áp, bấc gỗ bập bùng thư giãn tinh thần sau ngày làm việc.',
      script:
        'Bí quyết giúp mình chìm vào giấc ngủ sâu chỉ sau 15 phút đặt lưng chính là hũ nến thơm hoa oải hương thần thánh này.\n\n' +
        'Sự kết hợp hoàn hảo giữa tinh dầu Lavender Pháp thanh dịu và hương gỗ tuyết tùng ấm áp giúp giải tỏa căng thẳng thần kinh ngay lập tức.\n\n' +
        'Được làm từ 100% sáp đậu nành thiên nhiên không khói đen, an toàn cho cả trẻ nhỏ và thú cưng trong phòng kín.\n\n' +
        'Chỉ cần thắp nến trước khi ngủ 30 phút, căn phòng của bạn sẽ biến thành một spa thảo mộc êm dịu và ấm cúng vô cùng!',
    },
    {
      title: 'Máy xay sinh tố cầm tay mini sạc USB',
      theme: 'Máy xay sinh tố mini hình chiếc bình nước, lưỡi dao inox 6 cánh xay đá nhuyễn mịn, sạc pin Type-C mang đi tập gym tiện lợi.',
      script:
        'Món đồ chân ái cho hội chị em mê uống sinh tố healthy và nước ép detox mỗi ngày mà ngại rửa cối xay cồng kềnh.\n\n' +
        'Thiết kế thông minh hình một chiếc bình nước nhỏ gọn có quai xách, sạc pin qua cổng Type-C tiện lợi như sạc điện thoại.\n\n' +
        'Lưỡi dao thép không gỉ 6 cánh với tốc độ quay cực mạnh xay nhuyễn mịn hoa quả và đá viên chỉ trong đúng 40 giây.\n\n' +
        'Xay xong cắm ống hút uống trực tiếp từ bình luôn, rửa sạch cối chỉ bằng cách đổ nước và bấm nút tự rửa trong 5 giây!',
    },
    {
      title: 'Chảo đá chống dính không cần dầu ăn',
      theme: 'Chảo chống dính vân đá hoa cương phủ men gốm tự nhiên, rán trứng tráng bánh không cần một giọt dầu, dễ lau sạch bóng.',
      script:
        'Theo đuổi lối sống Eat Clean hạn chế dầu mỡ thì căn bếp của bạn nhất định phải có chiếc chảo đá chống dính men gốm này.\n\n' +
        'Lớp phủ chống dính vân đá tự nhiên không chứa chất độc hại PFOA và PTFE, đảm bảo an toàn tuyệt đối cho sức khỏe cả gia đình ở nhiệt độ cao.\n\n' +
        'Bạn có thể thoải mái rán trứng ốp la, áp chảo cá hồi hay làm bánh kếp mà không cần dùng đến một giọt dầu ăn nào cả.\n\n' +
        'Rán xong chỉ cần dùng khăn giấy lau nhẹ là lòng chảo sạch bóng như mới, việc dọn dẹp sau nấu ăn trở nên nhàn tênh!',
    },
    {
      title: 'Cốc sứ giữ nhiệt có quai xách thanh lịch',
      theme: 'Cốc giữ nhiệt ruột gốm sứ cao cấp, không bám mùi cà phê, quai da xách tay thời trang, giữ nóng lạnh 12 tiếng liên tục.',
      script:
        'Chiếc cốc giữ nhiệt làm mưa làm gió trong giới văn phòng thời gian qua nhờ thiết kế ruột tráng gốm sứ độc đáo.\n\n' +
        'Khác với cốc inox thông thường hay để lại mùi kim loại khó chịu, lớp gốm sứ tự nhiên giữ nguyên vẹn 100% hương vị thanh khiết của trà và cà phê.\n\n' +
        'Nắp đậy có gioăng cao su chống tràn tuyệt đối kèm quai xách bằng da thời trang cực kỳ tiện lợi khi di chuyển.\n\n' +
        'Giữ ấm đồ uống suốt 8 tiếng và giữ lạnh đá viên suốt 12 tiếng, vừa bảo vệ môi trường vừa tôn lên gu thẩm mỹ tinh tế của bạn!',
    },
    {
      title: 'Bút xóa vết bẩn quần áo cấp tốc áo trắng',
      theme: 'Bút tẩy vết bẩn đầu nỉ mini bỏ túi áo: xóa sạch vết cà phê, tương cà, vết son môi trên áo trắng chỉ sau 30 giây chà nhẹ.',
      script:
        'Mặc áo trắng đi ăn bún bò hay uống cà phê mà bị bắn bẩn ra áo là cơn ác mộng của tất cả mọi người.\n\n' +
        'Nhưng chỉ cần thủ sẵn cây bút xóa vết bẩn mini này trong túi xách, mọi sự cố đều được giải quyết êm đẹp trong nháy mắt.\n\n' +
        'Đầu bút nỉ chứa hoạt chất tẩy rửa sinh học an toàn: ấn nhẹ đầu bút lên vết bẩn rồi chà xát nhẹ nhàng, vết ố cà phê và tương ớt sẽ biến mất kỳ diệu sau 30 giây.\n\n' +
        'Cứu nguy kịp thời cho những buổi họp quan trọng hay những buổi hẹn hò mà không cần phải thay áo mới!',
    },
    {
      title: 'Tinh dầu tràm trà chấm mụn xẹp nhanh',
      theme: 'Lọ tinh dầu tràm trà Tea Tree hữu cơ nguyên chất, kháng viêm gom cồi mụn sưng đỏ sau 1 đêm, không để lại vết thâm sẹo.',
      script:
        'Cứ đến kỳ đèn đỏ hay thức khuya là y như rằng trên mặt lại mọc lên một nốt mụn bọc sưng đỏ đau nhức khó chịu.\n\n' +
        'Bảo bối cứu cánh của mình chính là lọ tinh dầu tràm trà hữu cơ nguyên chất này: chấm một giọt tăm bông lên đầu mụn trước khi ngủ.\n\n' +
        'Khả năng kháng khuẩn và tiêu viêm cực mạnh giúp nốt mụn giảm sưng đỏ rõ rệt chỉ sau một đêm và gom cồi khô ráo sau 2 ngày.\n\n' +
        'Thành phần thiên nhiên lành tính không làm bong tróc da xung quanh và hạn chế tối đa nguy cơ để lại vết thâm sau mụn!',
    },
    {
      title: 'Giá treo tai nghe bằng gỗ óc chó cao cấp',
      theme: 'Giá treo tai nghe over-ear đế nhôm CNC phối gỗ óc chó tự nhiên, cong mềm mại bảo vệ đệm tai không bị biến dạng móp méo.',
      script:
        'Nâng cấp góc bàn làm việc chuẩn phong cách Minimalist với chiếc giá treo tai nghe bằng gỗ óc chó Bắc Mỹ sang trọng.\n\n' +
        'Phần đỉnh treo uốn cong mềm mại theo đúng chu vi vòng đầu giúp đệm mút của tai nghe không bị tỳ đè biến dạng hay xẹp lún theo thời gian.\n\n' +
        'Chân đế bằng hợp kim nhôm CNC dày dặn có miếng đệm cao su chống trượt tuyệt đối, giữ cho bàn làm việc luôn ngăn nắp và gọn gàng.\n\n' +
        'Món phụ kiện hoàn hảo tôn vinh vẻ đẹp của chiếc tai nghe đắt tiền của các tín đồ âm thanh audiophile!',
    },
    {
      title: 'Khăn lau mặt khô dùng một lần sợi tự nhiên',
      theme: 'Cuộn khăn mặt dùng 1 lần sợi bông tự nhiên không xơ vải, thay thế khăn mặt ẩm mốc chứa ổ vi khuẩn gây mụn trứng cá.',
      script:
        'Nếu bạn chăm sóc da rất kỹ nhưng mụn vẫn liên tục tái phát, hãy kiểm tra ngay chiếc khăn mặt ẩm ướt treo trong nhà tắm.\n\n' +
        'Khăn mặt ẩm treo lâu ngày là ổ vi khuẩn và nấm mốc khổng lồ, mỗi lần lau mặt là bạn đang đưa vi khuẩn trực tiếp lên da.\n\n' +
        'Hãy chuyển sang dùng khăn lau mặt khô một lần làm từ 100% sợi bông thực vật tự nhiên siêu mềm mịn và thấm hút nước cực nhanh.\n\n' +
        'Dùng xong vứt bỏ hợp vệ sinh hoặc tận dụng lau bồn rửa mặt, làn da của bạn sẽ sạch mụn và khỏe khoắn hơn trông thấy!',
    },
    {
      title: 'Túi đựng đồ trang điểm trong suốt chống nước',
      theme: 'Túi đựng mỹ phẩm chất liệu PVC dẻo trong suốt viền da màu kem, chia ngăn khoa học, dễ tìm đồ và chống thấm nước hoàn hảo.',
      script:
        'Mỗi lần đi du lịch lục tìm thỏi son hay hộp phấn trong chiếc túi mỹ phẩm tối om khiến bạn phát bực vì mất thời gian?\n\n' +
        'Chiếc túi mỹ phẩm trong suốt này sẽ giải quyết triệt để vấn đề đó: chất liệu nhựa PVC dẻo cao cấp trong suốt giúp bạn nhìn thấy vị trí mọi món đồ trong tích tắc.\n\n' +
        'Khả năng chống thấm nước 100%, bảo vệ an toàn cho các chai lọ mỹ phẩm bên trong không bị đổ tràn hay dính bẩn ra vali quần áo.\n\n' +
        'Khóa kéo mạ vàng mượt mà cùng quai xách viền da kem thanh lịch, phụ kiện không thể thiếu trong mỗi chuyến xê dịch!',
    },
  ],

  // 3. Template: opensource_showcase (20 mục)
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
    {
      title: 'Tự động hóa công việc với n8n mã nguồn mở',
      theme: 'Giao diện kéo thả node tự động hóa n8n: kết nối Telegram, Gmail và Google Sheets không cần viết code phức tạp.',
      script:
        'Nếu bạn từng dùng Zapier nhưng ngán ngẩm vì mức phí đắt đỏ hàng tháng, hãy làm quen với n8n — giải pháp tự động hóa mã nguồn mở mạnh mẽ nhất hiện nay.\n\n' +
        'Giao diện trực quan cho phép bạn kết nối hàng trăm ứng dụng phổ biến: tự động lưu file đính kèm từ Gmail vào Google Drive, gửi thông báo đơn hàng mới vào nhóm Telegram ngay tức thì.\n\n' +
        'Bạn có thể tự cài đặt trên máy chủ cá nhân hoàn toàn miễn phí và không bị giới hạn số lượng luồng công việc.\n\n' +
        'Một công cụ thần thánh giúp các nhóm khởi nghiệp tiết kiệm hàng chục giờ làm việc thủ công mỗi tuần!',
    },
    {
      title: 'Ứng dụng quản lý tài chính cá nhân Firefly III',
      theme: 'Giao diện web trực quan của Firefly III: phân bổ ngân sách theo hũ chi tiêu, theo dõi dòng tiền và báo cáo thu chi chi tiết.',
      script:
        'Bạn lo ngại các ứng dụng theo dõi chi tiêu trên điện thoại thu thập dữ liệu nhạy cảm của mình? Firefly III là câu trả lời hoàn hảo.\n\n' +
        'Đây là phần mềm quản lý tài chính mã nguồn mở chạy hoàn toàn trên máy chủ của riêng bạn, bảo mật 100% thông tin số dư và tài khoản ngân hàng.\n\n' +
        'Tính năng phân bổ ngân sách theo từng danh mục, tự động hóa quy tắc gán nhãn giao dịch và xuất biểu đồ phân tích xu hướng chi tiêu hàng tháng trực quan.\n\n' +
        'Làm chủ dòng tiền cá nhân một cách an toàn và chuyên nghiệp hơn bao giờ hết!',
    },
    {
      title: 'Trình đọc sách điện tử Calibre quản lý thư viện số',
      theme: 'Giao diện quản lý hàng ngàn ebook trên máy tính: chuyển đổi định dạng EPUB sang PDF/MOBI, chỉnh sửa bìa và đồng bộ Kindle.',
      script:
        'Bất kỳ ai yêu thích đọc sách điện tử đều không thể bỏ qua Calibre — người khổng lồ trong thế giới quản lý sách số mã nguồn mở.\n\n' +
        'Không chỉ là trình đọc sách mượt mà, Calibre còn cho phép bạn chuyển đổi linh hoạt giữa mọi định dạng file từ EPUB, PDF đến MOBI chỉ bằng một cú nhấp chuột.\n\n' +
        'Tính năng tự động tải ảnh bìa chất lượng cao, tóm tắt nội dung và đồng bộ sách không dây thẳng vào máy đọc sách Kindle hoặc Kobo.\n\n' +
        'Biến chiếc máy tính của bạn thành một thư viện số đồ sộ và ngăn nắp trong tầm tay!',
    },
    {
      title: 'Trình phát đa phương tiện VLC tối ưu âm thanh',
      theme: 'Mở video 4K định dạng mkv/mp4 trên VLC, kích hoạt tính năng tăng âm lượng 200% và đồng bộ phụ đề tự động trong 5 giây.',
      script:
        'Biểu tượng chiếc nón giao thông màu cam quen thuộc này chứa đựng sức mạnh mà rất nhiều người chưa khám phá hết.\n\n' +
        'VLC Media Player có khả năng phát mượt mà mọi định dạng video và âm thanh mà không cần cài đặt thêm bất kỳ codec phụ trợ nào.\n\n' +
        'Bạn có thể tăng âm lượng loa ngoài lên tới 200% khi xem phim có âm thanh nhỏ, tự động tải phụ đề tiếng Việt khớp chuẩn xác với video chỉ bằng một phím tắt.\n\n' +
        'Hoàn toàn miễn phí, không chứa quảng cáo và hoạt động mượt mà trên mọi hệ điều hành từ Windows, Mac đến Linux!',
    },
    {
      title: 'Công cụ chỉnh sửa ảnh GIMP thay thế Photoshop',
      theme: 'Thao tác tách nền vật thể, cân chỉnh màu sắc và xử lý layer chuyên nghiệp trên phần mềm chỉnh sửa ảnh mã nguồn mở GIMP.',
      script:
        'Bạn cần một công cụ xử lý ảnh chuyên nghiệp nhưng không muốn trả chi phí bản quyền đắt đỏ hàng tháng? GIMP chính là giải pháp thay thế hàng đầu.\n\n' +
        'Đầy đủ các tính năng mạnh mẽ từ làm việc với layer, mặt nạ mask, bộ lọc filter nghệ thuật đến công cụ chấm sửa khuyết điểm chân dung mượt mà.\n\n' +
        'Cộng đồng phát triển toàn cầu liên tục cập nhật các plugin mở rộng, hỗ trợ xuất file chất lượng cao cho cả thiết kế in ấn lẫn nội dung số.\n\n' +
        'Tự do sáng tạo nghệ thuật không giới hạn với sức mạnh của phần mềm nguồn mở!',
    },
    {
      title: 'Nền tảng ghi chép và cơ sở tri thức Logseq',
      theme: 'Phương pháp ghi chú Outliner dạng khối trên Logseq, liên kết hai chiều Bi-directional Links và biểu đồ tri thức cá nhân.',
      script:
        'Logseq đang tạo nên một làn sóng mạnh mẽ trong cộng đồng những người làm nghiên cứu và quản lý tri thức cá nhân.\n\n' +
        'Được xây dựng trên triết lý ưu tiên sự riêng tư, toàn bộ ghi chú của bạn được lưu trữ dưới dạng các file Markdown cục bộ trên máy tính.\n\n' +
        'Cấu trúc ghi chép dạng khối outliner linh hoạt, hỗ trợ liên kết hai chiều giúp bạn dễ dàng kết nối các ý tưởng tưởng chừng rời rạc thành một mạng lưới tri thức sống động.\n\n' +
        'Tối ưu hóa tư duy sáng tạo và không bao giờ đánh mất một ý tưởng quý giá nào nữa!',
    },
    {
      title: 'Nền tảng chia sẻ file ngang hàng Syncthing',
      theme: 'Đồng bộ hóa dữ liệu trực tiếp giữa máy tính và điện thoại không qua trung gian đám mây, bảo mật mã hóa end-to-end.',
      script:
        'Bạn muốn đồng bộ hóa toàn bộ ảnh và tài liệu giữa máy tính xách tay và điện thoại nhưng không muốn tải lên Google Drive hay iCloud?\n\n' +
        'Syncthing là phần mềm đồng bộ dữ liệu ngang hàng P2P mã nguồn mở hoạt động hoàn toàn phi tập trung và an toàn tuyệt đối.\n\n' +
        'Dữ liệu được truyền thẳng giữa các thiết bị cá nhân của bạn qua mạng nội bộ hoặc Internet với mã hóa đầu cuối TLS chuẩn quân đội.\n\n' +
        'Không giới hạn dung lượng lưu trữ, không tốn chi phí thuê bao hàng tháng và bạn là người duy nhất nắm giữ chìa khóa dữ liệu của chính mình!',
    },
    {
      title: 'Hệ thống quản trị máy chủ Docker Portainer',
      theme: 'Giao diện web trực quan quản lý container Docker: khởi tạo container, theo dõi tài nguyên RAM/CPU và quản lý volume dữ liệu.',
      script:
        'Làm việc với các container Docker qua giao diện dòng lệnh đen trắng khiến bạn cảm thấy rối rắm và khó kiểm soát?\n\n' +
        'Portainer mang đến một giao diện đồ họa Web UI trực quan và mạnh mẽ nhất để quản lý toàn bộ hệ sinh thái Docker của bạn.\n\n' +
        'Chỉ bằng những cú nhấp chuột đơn giản, bạn có thể triển khai một ứng dụng mới từ thư viện template có sẵn, theo dõi biểu đồ sử dụng CPU, RAM theo thời gian thực.\n\n' +
        'Kiểm tra nhật ký log và khởi động lại các container bị lỗi chỉ trong tích tắc mà không cần nhớ hàng tá câu lệnh phức tạp!',
    },
    {
      title: 'Ứng dụng đọc truyện tranh manga Mihon',
      theme: 'Trình đọc manga/truyện tranh mã nguồn mở kế thừa Tachiyomi: tải truyện offline, tùy chỉnh màu nền và đồng bộ danh sách đọc.',
      script:
        'Dành riêng cho những tín đồ truyện tranh manga, manhwa và comic — ứng dụng đọc truyện mã nguồn mở đỉnh cao nhất trên hệ điều hành Android.\n\n' +
        'Mihon cho phép bạn kết nối trực tiếp với hàng trăm kho truyện trực tuyến trên toàn thế giới mà không bị làm phiền bởi các banner quảng cáo phản cảm.\n\n' +
        'Tính năng tải toàn bộ chương truyện về máy để đọc offline khi không có mạng, tự động cập nhật và thông báo ngay khi có chương truyện mới ra mắt.\n\n' +
        'Tùy biến giao diện đọc trang theo chiều dọc Webtoon hoặc lật trang cổ điển mượt mà không độ trễ!',
    },
    {
      title: 'Công cụ ghi màn hình và livestream OBS Studio',
      theme: 'Giao diện phòng thu OBS Studio: thiết lập đa nguồn camera, chia sẻ màn hình 60fps, bộ lọc khử tạp âm micro và xuất luồng trực tiếp.',
      script:
        'Từ những streamer hàng đầu thế giới đến các giảng viên đại học danh tiếng, OBS Studio luôn là sự lựa chọn số một không thể thay thế.\n\n' +
        'Phần mềm quay màn hình và phát trực tiếp mã nguồn mở hoàn toàn miễn phí, hỗ trợ xử lý luồng video độ phân giải 4K 60fps với độ trễ cực thấp.\n\n' +
        'Khả năng phối ghép linh hoạt nhiều nguồn hình ảnh: webcam, màn hình game, hình ảnh minh họa và các widget thông báo tương tác trực tiếp.\n\n' +
        'Tích hợp sẵn các bộ lọc âm thanh Noise Suppression khử sạch tiếng quạt gió và tiếng ồn xung quanh, mang lại chất lượng âm thanh chuẩn phòng thu chuyên nghiệp!',
    },
    {
      title: 'Bàn làm việc số cộng tác nhóm AppFlowy',
      theme: 'Ứng dụng ghi chú và quản lý dự án mã nguồn mở thay thế Notion: bảo mật dữ liệu cục bộ, tốc độ phản hồi siêu nhanh bằng Flutter và Rust.',
      script:
        'Bạn yêu thích sự linh hoạt của Notion nhưng muốn sở hữu toàn bộ dữ liệu trên máy tính riêng của mình? AppFlowy chính là câu trả lời xuất sắc.\n\n' +
        'Được xây dựng trên nền tảng công nghệ Flutter và ngôn ngữ Rust siêu nhanh, AppFlowy mang lại tốc độ khởi động và phản hồi mượt mà vượt trội.\n\n' +
        'Đầy đủ các tính năng quản lý ghi chú dạng khối, bảng dữ liệu Database, bảng tiến độ Kanban và lịch biểu công việc thông minh.\n\n' +
        'Toàn quyền kiểm soát và lưu trữ dữ liệu cục bộ, đảm bảo tính riêng tư tuyệt đối cho các kế hoạch kinh doanh và ý tưởng sáng tạo của bạn!',
    },
    {
      title: 'Trình quản lý lịch sử sao chép CopyQ',
      theme: 'Cửa sổ quản lý clipboard thông minh CopyQ: lưu trữ hàng ngàn đoạn văn bản, hình ảnh đã copy, tìm kiếm nhanh và gắn phím tắt tiện lợi.',
      script:
        'Đã bao nhiêu lần bạn vừa copy một đoạn văn bản quan trọng rồi vô tình copy đè một đường link khác làm mất sạch nội dung trước đó?\n\n' +
        'CopyQ là công cụ cứu hộ clipboard mã nguồn mở mạnh mẽ giúp ghi nhớ toàn bộ lịch sử sao chép văn bản, hình ảnh và tệp tin của bạn.\n\n' +
        'Dễ dàng tìm kiếm lại bất kỳ đoạn văn bản nào bạn từng copy từ tuần trước chỉ bằng một phím tắt tìm kiếm siêu nhanh.\n\n' +
        'Hỗ trợ phân loại clipboard theo các tab công việc riêng biệt và tự động mã hóa bảo vệ các mật khẩu nhạy cảm không bị lộ ra ngoài!',
    },
    {
      title: 'Trình giả lập Android trên máy tính Waydroid',
      theme: 'Chạy trực tiếp các ứng dụng Android mượt mà trên nền hệ điều hành Linux với hiệu năng native phần cứng không qua máy ảo chậm chạp.',
      script:
        'Chạy các ứng dụng và trò chơi Android trên máy tính xách tay với hiệu năng native 100% bằng giải pháp mã nguồn mở Waydroid.\n\n' +
        'Không giống như các phần mềm giả lập cồng kềnh ngốn hàng đống tài nguyên RAM trên Windows, Waydroid tích hợp trực tiếp vào nhân kernel của hệ thống.\n\n' +
        'Các ứng dụng Android khởi động ngay lập tức như một phần mềm máy tính thông thường, tận dụng tối đa sức mạnh của card đồ họa phần cứng.\n\n' +
        'Trải nghiệm lướt TikTok, đọc sách hay chơi game mobile trên màn hình lớn máy tính mượt mà đến khó tin!',
    },
    {
      title: 'Công cụ kiểm tra tốc độ mạng LibreSpeed',
      theme: 'Trình kiểm tra tốc độ mạng không flash không quảng cáo: đo tốc độ Download, Upload, Ping và Jitter chính xác trên trình duyệt.',
      script:
        'Mỗi lần kiểm tra tốc độ mạng trên các trang web thông thường bạn lại bị bủa vây bởi hàng tá banner quảng cáo cờ bạc lừa đảo khó chịu?\n\n' +
        'LibreSpeed là giải pháp đo tốc độ mạng mã nguồn mở siêu nhẹ, hoàn toàn không chứa quảng cáo và không thu thập bất kỳ dữ liệu cá nhân nào.\n\n' +
        'Đo lường chính xác tốc độ tải về Download, tải lên Upload, độ trễ Ping và độ biến thiên Jitter chỉ bằng một cú nhấp chuột đơn giản.\n\n' +
        'Bạn có thể tự cài đặt máy chủ đo tốc độ mạng riêng trong công ty để kiểm tra băng thông nội bộ cực kỳ nhanh chóng và tiện lợi!',
    },
    {
      title: 'Hệ thống nhà thông minh Home Assistant',
      theme: 'Bảng điều khiển trung tâm Smart Home Home Assistant: kết nối đèn thông minh, cảm biến nhiệt độ, camera an ninh và khóa cửa không phụ thuộc đám mây.',
      script:
        'Biến ngôi nhà bình thường thành một không gian sống thông minh đẳng cấp với nền tảng nhà thông minh mã nguồn mở số 1 thế giới.\n\n' +
        'Home Assistant kết nối hàng ngàn thiết bị từ các thương hiệu khác nhau: Xiaomi, Philips Hue, Tuya, Sonoff vào chung một bảng điều khiển duy nhất.\n\n' +
        'Toàn bộ các kịch bản tự động hóa: tự bật đèn khi mở cửa, tự kéo rèm lúc hoàng hôn đều được xử lý cục bộ ngay tại nhà mà không phụ thuộc vào đường truyền Internet.\n\n' +
        'Ngôi nhà của bạn vẫn hoạt động thông minh hoàn hảo ngay cả khi bị mất mạng hoàn toàn!',
    },
    {
      title: 'Trình đọc tài liệu PDF nhẹ mượt Sumatra PDF',
      theme: 'Khởi động file PDF hàng trăm trang trong 1 giây trên Sumatra PDF: giao diện tối giản, tốn ít RAM và hỗ trợ đọc cả ebook EPUB/MOBI.',
      script:
        'Quá ngán ngẩm với những phần mềm đọc PDF nặng nề hàng trăm Megabyte khởi động mất cả buổi và liên tục đòi cập nhật phiền toái?\n\n' +
        'Sumatra PDF là trình đọc file PDF mã nguồn mở có kích thước tí hon chỉ vài Megabyte nhưng tốc độ mở file nhanh như chớp.\n\n' +
        'Khởi động tài liệu PDF, sách điện tử EPUB hay truyện tranh CBR dày hàng ngàn trang gần như ngay lập tức mà không hề bị giật lag.\n\n' +
        'Tiêu tốn cực kỳ ít tài nguyên bộ nhớ RAM, giao diện tối giản tinh tế tập trung trọn vẹn vào trải nghiệm đọc sách mượt mà của bạn!',
    },
  ],

  // 4. Template: huoke_review_facts (20 mục)
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
    {
      title: 'So sánh máy lọc không khí màng HEPA vs than hoạt tính',
      theme: 'Phân tích thông số kỹ thuật, khả năng lọc bụi mịn PM2.5, khử mùi độc hại và chi phí thay lõi lọc hàng năm.',
      script:
        'Khi mua máy lọc không khí, rất nhiều người bị nhầm lẫn giữa hai loại màng lọc chính này.\n\n' +
        'Màng lọc HEPA H13 có nhiệm vụ giữ lại 99.97% các hạt bụi mịn PM2.5, phấn hoa và vi khuẩn lơ lửng trong không khí.\n\n' +
        'Trong khi đó, màng than hoạt tính lại đóng vai trò hấp thụ các hợp chất hữu cơ bay hơi, mùi khói thuốc lá và mùi ẩm mốc độc hại.\n\n' +
        'Một chiếc máy lọc không khí chất lượng bắt buộc phải kết hợp cả hai lớp màng này để đảm bảo không gian sống trong lành toàn diện.',
    },
    {
      title: 'Đánh giá chất lượng bàn phím cơ không dây giá rẻ',
      theme: 'Kiểm tra độ trễ kết nối không dây, cảm giác gõ switch red êm ái, thời lượng pin 4000mAh và độ bền sau 3 tháng sử dụng.',
      script:
        'Trong phân khúc bàn phím cơ dưới 1 triệu đồng, mẫu bàn phím này đang làm mưa làm gió trên các diễn đàn công nghệ.\n\n' +
        'Điểm cộng lớn nhất là khả năng kết nối 3 chế độ mượt mà, độ trễ khi dùng receiver 2.4Ghz gần như bằng 0, đáp ứng tốt cả chơi game lẫn gõ phím tốc độ cao.\n\n' +
        'Trang bị sẵn foam tiêu âm dày dặn nên tiếng gõ trầm ấm đầm tay, không gây ồn ào ảnh hưởng tới đồng nghiệp xung quanh.\n\n' +
        'Điểm trừ duy nhất là keycap ABS mỏng dễ bóng sau thời gian dài sử dụng.',
    },
    {
      title: 'Trải nghiệm dịch vụ quán cà phê làm việc 24/7',
      theme: 'Đánh giá không gian làm việc xuyên đêm: tốc độ wifi 200Mbps, ổ cắm điện tại mỗi bàn, độ yên tĩnh và menu đồ uống.',
      script:
        'Hôm nay chúng ta cùng đánh giá thực tế một trong những quán cà phê làm việc mở cửa 24/7 đông khách nhất khu trung tâm.\n\n' +
        'Không gian được chia làm hai khu vực rõ rệt: tầng 1 dành cho trò chuyện nhóm và tầng 2 là khu vực yên tĩnh tuyệt đối có vách ngăn cá nhân.\n\n' +
        'Mỗi vị trí ngồi đều được bố trí sẵn 2 ổ cắm điện và cổng sạc nhanh, wifi đo được tốc độ tải về lên tới 180 Mbps rất ổn định.\n\n' +
        'Menu đồ uống đa dạng với mức giá từ 45 đến 65 ngàn đồng, trà thảo mộc ngọt thanh rất hợp để tập trung làm việc đêm.',
    },
    {
      title: 'So sánh robot hút bụi lau nhà tầm giá 8 triệu',
      theme: 'Thử nghiệm lực hút 5000Pa, cảm biến laser LiDAR né tránh vật thể, khả năng leo thảm và giặt sấy giẻ tự động.',
      script:
        'Với ngân sách 8 triệu đồng, liệu một chú robot hút bụi có thể thay thế hoàn toàn việc dọn nhà thủ công?\n\n' +
        'Thử nghiệm với các loại rác quen thuộc: cát mèo, vụn bánh quy và tóc rối. Lực hút 5000Pa dễ dàng thu gom sạch sẽ 98% rác trên sàn gạch và thảm mỏng.\n\n' +
        'Cảm biến laser LiDAR quét bản đồ căn hộ 3 phòng ngủ chỉ trong 8 phút và tự động phân vùng dọn dẹp khoa học.\n\n' +
        'Tuy nhiên với các vết bẩn khô cứng lâu ngày, bạn vẫn cần can thiệp lau tay vì áp lực chà giẻ của robot chưa đủ mạnh.',
    },
    {
      title: 'Đánh giá đệm lò xo túi độc lập vs đệm cao su non',
      theme: 'So sánh độ đàn hồi, khả năng cách ly chuyển động khi trở mình, độ thoáng khí mùa hè và tuổi thọ giữa hai loại đệm.',
      script:
        'Lựa chọn giữa đệm lò xo túi độc lập và đệm cao su non luôn là bài toán đau đầu của nhiều gia đình khi về nhà mới.\n\n' +
        'Đệm lò xo túi độc lập có ưu điểm vượt trội về độ nảy và khả năng cách ly chuyển động: người bên cạnh xoay người bạn hoàn toàn không bị ảnh hưởng.\n\n' +
        'Ngược lại, đệm cao su non nguyên khối lại ôm sát đường cong cơ thể, nâng đỡ thắt lưng cực tốt nhưng lại có cảm giác hơi bí nóng vào mùa hè nếu không dùng điều hòa.\n\n' +
        'Nếu bạn thích nằm êm ái thoáng mát, lò xo túi là lựa chọn tối ưu hơn.',
    },
    {
      title: 'Trải nghiệm ghế công thái học sau 1 năm ngồi làm việc',
      theme: 'Kiểm tra độ chùng lưới nẹp lưng, độ êm của đệm mông, piston thủy lực và tình trạng thoái hóa đốt sống sau 1 năm.',
      script:
        'Sau đúng 365 ngày ngồi làm việc trung bình 10 tiếng mỗi ngày trên chiếc ghế công thái học này, đây là cảm nhận chân thực nhất của tôi.\n\n' +
        'Phần đệm lưới nhập khẩu vẫn giữ được độ căng đàn hồi 90%, không hề có hiện tượng chùng nhão hay bai xù ở viền ghế.\n\n' +
        'Hệ thống đỡ thắt lưng 2D linh hoạt giúp giảm rõ rệt cơn đau mỏi vùng cột sống L4-L5 mà tôi từng phải chịu đựng suốt nhiều năm.\n\n' +
        'Một khoản đầu tư xứng đáng từng đồng cho sức khỏe của bất kỳ ai làm nghề văn phòng hay lập trình viên.',
    },
    {
      title: 'So sánh màn hình máy tính 2K vs 4K cho đồ họa',
      theme: 'Đo độ chuẩn màu 100% sRGB / DCI-P3, mật độ điểm ảnh PPI, độ sắc nét khi dựng video và yêu cầu cấu hình card đồ họa.',
      script:
        'Làm đồ họa và dựng phim thì nên chọn màn hình 27 inch 2K hay cố lên hẳn 4K?\n\n' +
        'Ở khoảng cách ngồi thông thường 60cm, màn hình 4K cho mật độ điểm ảnh lên tới 163 PPI, các chi tiết chữ và đường vector mịn màng tuyệt đối không thấy răng cưa.\n\n' +
        'Tuy nhiên, để xuất hình 4K mượt mà đòi hỏi card đồ họa của bạn phải có dung lượng VRAM lớn và vi xử lý đủ mạnh.\n\n' +
        'Nếu ngân sách có hạn, một chiếc màn 2K với tấm nền IPS chuẩn màu 99% DCI-P3 vẫn là lựa chọn thực dụng và kinh tế hơn nhiều.',
    },
    {
      title: 'So sánh tai nghe có dây audiophile vs tai nghe TWS',
      theme: 'Bảng phân tích thông số: so sánh độ trễ Bluetooth, độ chi tiết dải âm của tai nghe dây cắm DAC rời vs sự tiện lợi của tai nghe True Wireless.',
      script:
        'Giữa sự tiện lợi của tai nghe không dây True Wireless và chất âm đỉnh cao của tai nghe có dây cắm qua DAC rời — đâu là lựa chọn chân ái cho đôi tai của bạn?\n\n' +
        'Tai nghe TWS mang lại sự gọn gàng tuyệt đối khi tập thể thao hay di chuyển ngoài đường, nhưng bị giới hạn bởi chuẩn nén âm thanh Bluetooth làm giảm độ chi tiết của bản nhạc.\n\n' +
        'Ngược lại, tai nghe có dây audiophile truyền dẫn tín hiệu âm thanh nguyên bản chuẩn Hi-Res Audio, bóc tách từng tiếng gảy đàn guitar và tiếng lấy hơi của ca sĩ sống động như ngồi trước sân khấu.\n\n' +
        'Nếu bạn ưu tiên sự tiện lợi hãy chọn TWS; còn nếu bạn muốn đắm chìm vào thế giới âm nhạc thuần khiết, tai nghe có dây vẫn là tượng đài bất bại!',
    },
    {
      title: 'Đánh giá máy rửa bát mini cho gia đình nhỏ',
      theme: 'Kiểm tra khả năng rửa sạch dầu mỡ ở nhiệt độ 70 độ C, lượng nước tiêu thụ 6 lít/lần rửa và độ ồn của máy rửa bát để bàn mini.',
      script:
        'Nhà chật không có chỗ lắp máy rửa bát lớn 14 bộ thì máy rửa bát mini để bàn có thực sự là cứu tinh cho hạnh phúc gia đình?\n\n' +
        'Với kích thước nhỏ gọn đặt vừa trên mặt bếp, máy chứa được khoảng 4 bộ bát đĩa kèm nồi chảo nhỏ vừa vặn cho bữa ăn gia đình trẻ.\n\n' +
        'Thử nghiệm với bát đĩa dính đầy dầu mỡ thịt kho và tương ớt khô cứng: các vòi phun nước áp lực cao 70 độ C đánh bay hoàn toàn vết bẩn và sấy khô tiệt trùng bát đĩa tinh tươm.\n\n' +
        'Lượng nước tiêu thụ chỉ khoảng 6 lít mỗi lần rửa — tiết kiệm hơn gấp đôi so với việc bạn đứng rửa bằng tay dưới vòi nước chảy!',
    },
    {
      title: 'Trải nghiệm dịch vụ giặt là sấy khô tự động 24/7',
      theme: 'Đánh giá tiệm giặt sấy tự phục vụ: quy trình thanh toán quét mã QR, máy giặt công nghiệp 15kg, thời gian sấy khô 45 phút lấy ngay.',
      script:
        'Mùa mưa nồm quần áo phơi cả tuần không khô bốc mùi ẩm mốc khó chịu? Hãy cùng trải nghiệm tiệm giặt sấy tự động 24/7 đang mọc lên khắp các thành phố lớn.\n\n' +
        'Quy trình tự phục vụ đơn giản: mang quần áo đến, chọn máy giặt công nghiệp dung tích 15kg và thanh toán tiện lợi bằng mã QR trên điện thoại.\n\n' +
        'Nước giặt xả được máy tự động bơm theo định lượng chuẩn, sau 30 phút giặt chuyển sang máy sấy nhiệt độ cao 45 phút là quần áo khô cong thơm phức có thể mặc ngay.\n\n' +
        'Chi phí khoảng 60 ngàn đồng cho một mẻ giặt sấy khổng lồ, giải pháp tiện lợi tối ưu cho sinh viên và người bận rộn!',
    },
    {
      title: 'So sánh lò nướng đối lưu vs nồi chiên không dầu',
      theme: 'So sánh dung tích nướng nguyên con gà, độ giòn của món ăn, tốc độ làm nóng và sự tiện lợi khi vệ sinh giữa hai thiết bị nhà bếp.',
      script:
        'Nên mua lò nướng đối lưu truyền thống hay sắm một chiếc nồi chiên không dầu hiện đại cho căn bếp gia đình?\n\n' +
        'Nồi chiên không dầu thực chất là một chiếc lò nướng thu nhỏ với quạt đối lưu công suất lớn: làm nóng cực nhanh, chiên khoai tây và cánh gà giòn rụm chỉ trong 15 phút.\n\n' +
        'Tuy nhiên dung tích nồi chiên khá hạn chế, khó nướng vừa bánh bông lan lớn hay các tảng thịt sườn khổng lồ cho bữa tiệc đông người.\n\n' +
        'Lò nướng đối lưu dung tích từ 35 lít trở lên cho phép bạn nướng nguyên con gà tây, nướng 2 khay bánh cùng lúc với nhiệt độ kiểm soát chính xác hơn nhiều.',
    },
    {
      title: 'Đánh giá camera an ninh ngoài trời xoay 360 AI',
      theme: 'Kiểm tra chất lượng quay đêm có màu ban đêm Full Color, tính năng tự động bám đuổi theo chuyển động người và còi hú báo động chống trộm.',
      script:
        'Lắp camera an ninh ngoài trời bảo vệ ngôi nhà cần những tính năng gì để thực sự phát huy tác dụng phòng chống trộm cắp?\n\n' +
        'Mẫu camera xoay 360 độ thế hệ mới này sở hữu đèn rọi LED công suất cao cho phép ghi hình có màu sắc nét ngay cả giữa đêm tối mịt mù.\n\n' +
        'Trí tuệ nhân tạo AI tích hợp sẵn phân biệt chuẩn xác giữa chuyển động của con người với lá cây đung đưa hay chó mèo chạy qua, giảm 95% báo động giả.\n\n' +
        'Khi phát hiện kẻ lạ xâm nhập, camera tự động xoay bám theo đối tượng và kích hoạt còi hú báo động lớn kết hợp chớp đèn xua đuổi kẻ gian ngay lập tức!',
    },
    {
      title: 'Trải nghiệm tủ lạnh side-by-side sau 6 tháng',
      theme: 'Đánh giá thực tế tủ lạnh hai cánh dung tích 600L: tính năng lấy nước và đá ngoài cánh cửa, khả năng khử mùi than hoạt tính và tiền điện hàng tháng.',
      script:
        'Sau nửa năm sử dụng chiếc tủ lạnh hai cánh Side-by-Side dung tích 600 lít, đây là những ưu và nhược điểm thực tế nhất bạn cần cân nhắc.\n\n' +
        'Điểm tiện lợi nhất là hệ thống lấy nước mát và làm đá tự động ngay bên ngoài cánh cửa, không cần mở tủ giúp tiết kiệm điện năng đáng kể.\n\n' +
        'Ngăn đông và ngăn mát khổng lồ chứa đồ thoải mái cho cả tuần đi chợ, hệ thống làm lạnh đa chiều không đóng tuyết giữ rau củ tươi ngon cả tuần.\n\n' +
        'Tuy nhiên bề ngang cánh cửa khá hẹp khiến việc cất các khay bánh kem lớn hay đĩa thức ăn to bản đôi khi gặp chút bất tiện.',
    },
    {
      title: 'So sánh xe máy xăng vs xe máy điện đi làm hàng ngày',
      theme: 'Bảng tính chi phí vận hành sau 1 năm: so sánh tiền xăng 500k/tháng vs tiền sạc điện 80k/tháng, chi phí bảo dưỡng và tuổi thọ pin xe điện.',
      script:
        'Bài toán kinh tế khi chuyển đổi từ xe máy xăng truyền thống sang xe máy điện đi làm hàng ngày trong đô thị.\n\n' +
        'Về chi phí năng lượng: mỗi tháng đi 1.000km, xe xăng tiêu tốn khoảng 500 ngàn tiền xăng, trong khi xe điện chỉ tốn khoảng 80 ngàn tiền điện sạc tại nhà.\n\n' +
        'Xe điện không cần thay dầu nhớt, bugi hay lọc gió định kỳ, chi phí bảo dưỡng hàng năm gần như bằng 0 và động cơ vận hành êm ru không tiếng ồn.\n\n' +
        'Điểm trừ là bạn cần chú ý thói quen cắm sạc pin qua đêm và thời gian chờ sạc lâu hơn nhiều so với việc đổ xăng 2 phút tại cây xăng.',
    },
    {
      title: 'Đánh giá chất lượng mạng cáp quang FPT vs Viettel',
      theme: 'Đo kiểm tốc độ đường truyền quốc tế đi Singapore/Mỹ lúc 8h tối, độ ổn định khi đứt cáp quang biển và chất lượng hỗ trợ kỹ thuật tại nhà.',
      script:
        'Lắp mạng Internet cáp quang gia đình thì nên chọn nhà mạng Viettel phủ sóng rộng hay FPT tối ưu giải trí game online?\n\n' +
        'Trong điều kiện cáp quang biển bình thường, cả hai nhà mạng đều cung cấp gói cước băng thông trong nước từ 150 đến 300 Mbps cực kỳ mượt mà.\n\n' +
        'Tuy nhiên vào khung giờ cao điểm 8 giờ tối khi xảy ra sự cố đứt cáp quang biển quốc tế, Viettel thường có lợi thế về các tuyến cáp đất liền dự phòng ổn định hơn.\n\n' +
        'FPT lại vượt trội về hệ thống thiết bị modem Wi-Fi 6 thế hệ mới và tính năng Ultra Fast giảm ping hiệu quả khi chơi game online quốc tế!',
    },
    {
      title: 'Trải nghiệm máy hút ẩm mùa nồm ẩm miền Bắc',
      theme: 'Thử nghiệm máy hút ẩm dung tích hút 20L/ngày: làm khô sàn nhà trơn trượt sau 2 tiếng, độ ẩm giảm từ 90% xuống 55% thơm tho.',
      script:
        'Mùa nồm ẩm miền Bắc với sàn nhà đổ mồ hôi ướt sũng và quần áo phơi mốc meo luôn là nỗi ám ảnh kinh hoàng của mọi gia đình.\n\n' +
        'Bật chiếc máy hút ẩm công suất 20 lít mỗi ngày trong căn phòng khách 30m2: chỉ sau đúng 2 tiếng đồng hồ, sàn nhà đã khô ráo hoàn toàn.\n\n' +
        'Độ ẩm không khí giảm mạnh từ mức 90% ngột ngạt xuống mức lý tưởng 55%, mang lại cảm giác thoáng mát sảng khoái và ngăn chặn nấm mốc phát triển.\n\n' +
        'Bình chứa nước 4 lít đầy ắp nước sau nửa ngày hoạt động — bằng chứng rõ ràng nhất về sự cần thiết của thiết bị này trong mùa nồm!',
    },
    {
      title: 'So sánh màn hình OLED vs Mini-LED cho đồ họa',
      theme: 'So sánh độ tương phản đen tuyệt đối của OLED vs độ sáng đỉnh cao 1600 nits chống lóa của Mini-LED, nguy cơ lưu ảnh Burn-in.',
      script:
        'Đầu tư màn hình cao cấp phục vụ công việc thiết kế đồ họa chuyên nghiệp và giải trí đỉnh cao: nên chọn OLED hay Mini-LED?\n\n' +
        'Tấm nền OLED sở hữu các điểm ảnh tự phát sáng độc lập, mang lại độ tương phản vô cực và màu đen sâu thẳm tuyệt đối không bị quầng sáng viền.\n\n' +
        'Màn hình Mini-LED lại vượt trội về độ sáng đỉnh cao lên tới 1600 nits rực rỡ, hiển thị nội dung HDR ngoài trời sáng chói mà không lo bị bóng gương.\n\n' +
        'Nếu bạn làm việc trong phòng tối đồ họa phim ảnh hãy chọn OLED; còn nếu làm việc trong văn phòng nhiều ánh sáng tự nhiên, Mini-LED là lựa chọn an tâm không lo lưu ảnh!',
    },
  ],

  // 5. Template: opensource_live_work (20 mục)
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
    {
      title: 'Tối ưu hóa quy trình làm việc trên màn hình kép',
      theme: 'Góc nhìn qua vai: một màn hình dọc hiển thị tài liệu/chat, một màn hình ngang hiển thị trình duyệt và IDE lập trình.',
      script:
        'Sở hữu hai màn hình máy tính nhưng liệu bạn đã biết cách bố trí để đạt hiệu suất công việc tối đa chưa?\n\n' +
        'Mẹo của các chuyên gia: xoay dọc màn hình phụ để đọc tài liệu dài, kiểm tra báo cáo và theo dõi kênh trao đổi nhóm mà không cần cuộn chuột liên tục.\n\n' +
        'Màn hình chính nằm ngang đặt ngay tầm mắt dành trọn vẹn không gian cho công việc sáng tạo, thiết kế hoặc viết mã nguồn chính.\n\n' +
        'Phân chia không gian làm việc khoa học sẽ giúp bạn giảm thiểu 50% thời gian chuyển đổi qua lại giữa các cửa sổ ứng dụng!',
    },
    {
      title: 'Thiết lập phím tắt thần tốc trong Excel và Sheets',
      theme: 'Thao tác bàn tay lướt trên bàn phím: dùng Ctrl+Shift+L bật lọc, Alt+= tính tổng và Ctrl+T tạo bảng dữ liệu siêu tốc.',
      script:
        'Bỏ ngay thói quen dùng chuột rê từng ô để chỉnh sửa bảng tính — những phím tắt này sẽ biến bạn thành phù thủy Excel.\n\n' +
        'Nhấn Alt+= để tự động tính tổng dải số trong một nốt nhạc, Ctrl+Shift+L để bật tắt nhanh thanh lọc dữ liệu chỉ trong 1 giây.\n\n' +
        'Sử dụng Ctrl+T để biến toàn bộ vùng dữ liệu thành bảng thông minh có định dạng chuyên nghiệp và tự động cập nhật công thức khi thêm dòng mới.\n\n' +
        'Luyện tập thành thục những phím tắt này, bạn sẽ tiết kiệm ít nhất 1 giờ làm việc mỗi ngày!',
    },
    {
      title: 'Hướng dẫn quản lý công việc với bảng Kanban Notion',
      theme: 'Thao tác kéo thả thẻ công việc To Do, In Progress, Done trên Notion, phân loại theo độ ưu tiên và gắn deadline.',
      script:
        'Cảm thấy ngập đầu trong hàng tá deadline mà không biết bắt đầu từ đâu? Bảng Kanban trên Notion sẽ cứu nguy cho bạn.\n\n' +
        'Phân loại toàn bộ nhiệm vụ thành 3 cột trực quan: Cần làm, Đang thực hiện và Đã hoàn thành.\n\n' +
        'Áp dụng quy tắc chỉ cho phép tối đa 3 thẻ nhiệm vụ nằm trong cột Đang thực hiện để duy trì sự tập trung tuyệt đối vào việc quan trọng nhất.\n\n' +
        'Cảm giác kéo một thẻ công việc sang cột Đã hoàn thành sẽ mang lại nguồn động lực tinh thần cực kỳ to lớn để bạn chinh phục mục tiêu tiếp theo!',
    },
    {
      title: 'Tự động hóa báo cáo tuần bằng Python script đơn giản',
      theme: 'Chạy đoạn mã Python tự động tổng hợp dữ liệu từ 10 file Excel rời rạc thành một báo cáo hoàn chỉnh gửi email tự động.',
      script:
        'Mỗi chiều thứ Sáu bạn phải mất 2 tiếng cặm cụi copy paste dữ liệu từ hàng chục file báo cáo của các phòng ban?\n\n' +
        'Chỉ với một đoạn mã Python ngắn sử dụng thư viện Pandas, toàn bộ quy trình này có thể được tự động hóa chỉ sau một cú nhấn Enter.\n\n' +
        'Script tự động đọc toàn bộ file Excel trong thư mục, làm sạch dữ liệu trùng lặp, tính toán tổng hợp các chỉ số và xuất ra file báo cáo chuẩn chỉnh.\n\n' +
        'Thậm chí bạn có thể cài đặt tự động gửi email đính kèm báo cáo đến sếp đúng 5 giờ chiều mà không cần động tay!',
    },
    {
      title: 'Quy trình dọn dẹp và sắp xếp desktop ngăn nắp',
      theme: 'Màn hình desktop sạch bóng: phân loại file vào 4 thư mục chính, ẩn icon hệ thống thừa và chọn hình nền tối giản.',
      script:
        'Một màn hình desktop chứa hàng trăm file lộn xộn chính là biểu hiện của một tâm trí đang bị phân tán và quá tải.\n\n' +
        'Hãy áp dụng quy tắc 4 thư mục đơn giản: Hộp thư đến cần xử lý, Dự án đang chạy, Tài liệu lưu trữ và Thùng rác tạm thời.\n\n' +
        'Cuối mỗi ngày làm việc, dành đúng 3 phút để kéo thả các file tải về vào đúng thư mục tương ứng, trả lại màn hình desktop sạch bóng.\n\n' +
        'Không gian số ngăn nắp sẽ giúp bạn bắt đầu ngày mới với tâm trạng sảng khoái và độ tập trung cao nhất!',
    },
    {
      title: 'Thao tác lọc dữ liệu lớn không bị đơ máy tính',
      theme: 'Thao tác trên tập dữ liệu nửa triệu dòng: sử dụng Power Query hoặc Python thay thế hàm VLOOKUP truyền thống.',
      script:
        'Mở file Excel chứa hàng trăm ngàn dòng và máy tính bỗng nhiên quay vòng tròn rồi báo lỗi \'Not Responding\'?\n\n' +
        'Sai lầm phổ biến là sử dụng các hàm lặp như VLOOKUP hoặc mảng công thức nặng nề trực tiếp trên trang tính lớn.\n\n' +
        'Hãy chuyển sang sử dụng công cụ Power Query tích hợp sẵn trong Excel: toàn bộ quá trình ghép bảng và lọc dữ liệu được xử lý trong bộ nhớ đệm cực kỳ mượt mà.\n\n' +
        'Thời gian xử lý rút ngắn từ 15 phút xuống chỉ còn vài giây mà không làm máy tính bị quá tải hay nóng máy!',
    },
    {
      title: 'Cách dùng Git và GitHub lưu trữ phiên bản an toàn',
      theme: 'Thao tác lệnh Git commit, git push trên VS Code: lưu trữ lịch sử mã nguồn, tạo nhánh branch làm việc nhóm an toàn.',
      script:
        'Đã bao giờ bạn phải đặt tên file kiểu \'Báo cáo_final_v2_chắc chắn cuối cùng\' vì sợ mất phiên bản cũ chưa?\n\n' +
        'Đó là lý do bạn cần làm quen với Git — hệ thống quản lý phiên bản chuẩn mực nhất của giới công nghệ.\n\n' +
        'Mỗi lần commit giống như bạn chụp lại một bức ảnh trạng thái của toàn bộ dự án tại thời điểm đó.\n\n' +
        'Bất cứ khi nào xảy ra lỗi hoặc muốn quay lại phiên bản ngày hôm qua, bạn chỉ cần một câu lệnh đơn giản mà không làm ảnh hưởng đến dữ liệu hiện tại.',
    },
    {
      title: 'Tối ưu hóa giao diện dòng lệnh Terminal với Oh My Zsh',
      theme: 'Màn hình Terminal phong cách hiện đại: gợi ý lệnh thông minh autosuggestions, tô màu cú pháp syntax highlighting.',
      script:
        'Biến cửa sổ dòng lệnh đen trắng nhàm chán thành một trợ thủ đắc lực và thời thượng với Oh My Zsh.\n\n' +
        'Tích hợp plugin tự động gợi ý lệnh dựa trên lịch sử thao tác giúp bạn gõ lệnh nhanh gấp 3 lần mà không sợ nhớ nhầm cú pháp.\n\n' +
        'Hệ thống giao diện theme Agnoster hiển thị rõ ràng nhánh Git hiện tại và trạng thái của repository ngay trên thanh nhập lệnh.\n\n' +
        'Nâng cấp trải nghiệm làm việc hàng ngày của bạn lên một tầm cao mới chuyên nghiệp hơn hẳn!',
    },
    {
      title: 'Tự động hóa gửi tin nhắn bằng Telegram Bot',
      theme: 'Viết script Python kết nối Telegram Bot API: tự động gửi thông báo cập nhật giá coin hoặc tin tức thời tiết mỗi sáng 7h.',
      script:
        'Biến ứng dụng chat Telegram thành trợ lý ảo cá nhân đắc lực bằng cách tự tạo một con Bot tự động hóa hoàn toàn miễn phí.\n\n' +
        'Chỉ với vài chục dòng mã Python đơn giản kết hợp cùng thư viện python-telegram-bot và trang tin tức thời tiết mở.\n\n' +
        'Mỗi 7 giờ sáng thức dậy, con Bot sẽ tự động gửi vào điện thoại của bạn bản tin tóm tắt dự báo thời tiết trong ngày và lịch trình công việc cần làm.\n\n' +
        'Thậm chí bạn có thể cài đặt Bot tự động cảnh báo biến động giá cổ phiếu hoặc thông báo khi trang web công ty gặp sự cố!',
    },
    {
      title: 'Hướng dẫn thiết lập sao lưu tự động NAS',
      theme: 'Cấu hình ổ cứng mạng NAS gia đình: thiết lập cơ chế sao lưu 3-2-1 tự động đồng bộ ảnh từ điện thoại và máy tính lên ổ cứng.',
      script:
        'Đừng bao giờ đợi đến khi ổ cứng máy tính bị hỏng hay điện thoại bị rơi mất rồi mới nhận ra giá trị vô giá của các kỷ niệm đã qua.\n\n' +
        'Áp dụng nguyên tắc sao lưu dữ liệu vàng 3-2-1 với ổ cứng mạng NAS đặt tại nhà: lưu 3 bản sao dữ liệu trên 2 loại thiết bị khác nhau và 1 bản sao ngoại vi.\n\n' +
        'Cài đặt ứng dụng tự động đồng bộ: cứ mỗi khi bạn về nhà kết nối Wi-Fi, toàn bộ ảnh và video chụp trong ngày sẽ tự động tải lên máy chủ NAS.\n\n' +
        'Bảo vệ an toàn tuyệt đối cho toàn bộ tài liệu công việc và kho kỷ niệm gia đình qua nhiều thế hệ!',
    },
    {
      title: 'Thao tác gom nhóm và phân tích Pivot Table',
      theme: 'Kéo thả trường dữ liệu trong Excel Pivot Table: phân tích doanh thu theo vùng miền, quý kinh doanh và tạo biểu đồ Pivot Chart trực quan.',
      script:
        'Làm chủ công cụ Pivot Table thần thánh trong Excel để biến bảng dữ liệu thô hàng chục ngàn dòng thành những báo cáo quản trị sắc bén.\n\n' +
        'Chỉ cần vài thao tác kéo thả chuột đơn giản: kéo cột Khu vực vào hàng, kéo cột Sản phẩm vào cột và kéo cột Doanh thu vào phần giá trị tính toán.\n\n' +
        'Bạn có thể gom nhóm dữ liệu theo từng tháng, từng quý hoặc từng năm chỉ bằng một cú nhấp chuột phải mà không cần viết công thức SUMIFS phức tạp.\n\n' +
        'Kết hợp cùng biểu đồ động Pivot Chart để trình bày báo cáo trực quan làm hài lòng bất kỳ vị giám đốc khó tính nào!',
    },
    {
      title: 'Tối ưu hóa hiệu năng máy tính bằng PowerToys',
      theme: 'Bộ công cụ Microsoft PowerToys: tính năng ghim cửa sổ Always on Top, đo màu Color Picker và chia vùng màn hình FancyZones.',
      script:
        'Bộ công cụ tiện ích chính chủ Microsoft PowerToys mã nguồn mở miễn phí mà bất kỳ người dùng Windows nào cũng nên cài đặt ngay.\n\n' +
        'Tính năng FancyZones cho phép bạn chia màn hình lớn thành các vùng làm việc tùy biến để thả các cửa sổ ứng dụng vào đúng vị trí gọn gàng.\n\n' +
        'Nhấn phím tắt Alt+Space để kích hoạt thanh tìm kiếm nhanh PowerToys Run mở ứng dụng và tính toán toán học ngay lập tức như Spotlight của máy Mac.\n\n' +
        'Công cụ Text Extractor giúp trích xuất sao chép chữ từ bất kỳ hình ảnh hay video nào trên màn hình chỉ bằng một thao tác quét chuột!',
    },
    {
      title: 'Tạo biểu đồ tương tác trên Google Looker Studio',
      theme: 'Kết nối nguồn dữ liệu Google Sheets vào Looker Studio: thiết kế bảng điều khiển Dashboard báo cáo doanh số tương tác lọc theo ngày.',
      script:
        'Tạm biệt những file báo cáo PDF tĩnh nhàm chán bằng cách chuyển sang xây dựng Dashboard tương tác trực tuyến trên Google Looker Studio.\n\n' +
        'Kết nối trực tiếp với bảng tính Google Sheets: số liệu bán hàng cập nhật đến đâu, các biểu đồ cột và chỉ số KPI trên Dashboard tự động nhảy số theo thời gian thực.\n\n' +
        'Người xem có thể tự do bấm chọn bộ lọc theo từng nhân viên kinh doanh, từng khu vực địa lý hay khoảng thời gian cụ thể để xem chi tiết.\n\n' +
        'Chia sẻ đường link báo cáo chuyên nghiệp cho đối tác và khách hàng xem trực tiếp trên cả máy tính lẫn điện thoại di động!',
    },
    {
      title: 'Cấu hình mạng riêng ảo VPN WireGuard cá nhân',
      theme: 'Cài đặt VPN WireGuard trên VPS Linux: mã hóa toàn bộ lưu lượng mạng khi dùng Wi-Fi công cộng quán cà phê, tốc độ cực nhanh.',
      script:
        'Mỗi khi kết nối điện thoại hay laptop vào mạng Wi-Fi công cộng tại sân bay hay quán cà phê, dữ liệu của bạn có thể bị nghe lén bất cứ lúc nào.\n\n' +
        'Tự dựng máy chủ VPN cá nhân với giao thức WireGuard thế hệ mới trên một máy chủ đám mây VPS giá rẻ chỉ vài đô la mỗi tháng.\n\n' +
        'Toàn bộ lưu lượng truy cập Internet của bạn được mã hóa an toàn qua đường hầm bảo mật riêng biệt trước khi đi ra thế giới bên ngoài.\n\n' +
        'Tốc độ kết nối cực nhanh, độ trễ gần như không đổi và hoàn toàn yên tâm khi thực hiện các giao dịch ngân hàng nhạy cảm!',
    },
    {
      title: 'Chuyển đổi định dạng ảnh hàng loạt bằng ImageMagick',
      theme: 'Dòng lệnh Terminal xử lý 1000 file ảnh: nén dung lượng, đổi đuôi PNG sang WebP và chèn logo watermark tự động trong 10 giây.',
      script:
        'Bạn có một thư mục chứa hơn một ngàn tấm ảnh chụp sản phẩm nặng cả chục Gigabyte cần nén dung lượng và đổi định dạng để đưa lên website?\n\n' +
        'Đừng mở từng ảnh trên Photoshop để xuất file thủ công tốn hàng giờ đồng hồ quý giá của bạn.\n\n' +
        'Sử dụng công cụ dòng lệnh ImageMagick mã nguồn mở: chỉ với một câu lệnh ngắn duy nhất gõ vào cửa sổ Terminal.\n\n' +
        'Toàn bộ một ngàn file ảnh sẽ được tự động đổi sang định dạng WebP siêu nhẹ, nén 70% dung lượng và chèn logo chìm bản quyền chỉ trong vòng đúng 10 giây!',
    },
    {
      title: 'Quản lý công việc lập trình với Jira và GitHub',
      theme: 'Tích hợp Jira Software với GitHub: tạo nhánh Git từ thẻ nhiệm vụ, tự động chuyển trạng thái In Progress khi tạo Pull Request.',
      script:
        'Quy trình làm việc chuẩn mực của các nhóm kỹ sư công nghệ chuyên nghiệp tại các tập đoàn công nghệ hàng đầu thế giới.\n\n' +
        'Kết nối bảng quản lý công việc Jira trực tiếp với kho lưu trữ mã nguồn GitHub của dự án phát triển phần mềm.\n\n' +
        'Khi kỹ sư tạo nhánh Git mới gắn kèm mã số thẻ nhiệm vụ, trạng thái công việc trên bảng Jira tự động chuyển sang Đang thực hiện.\n\n' +
        'Khi đoạn mã được duyệt và gộp vào nhánh chính, thẻ nhiệm vụ tự động đóng lại — tiết kiệm tối đa thời gian cập nhật trạng thái thủ công cho toàn đội ngũ!',
    },
    {
      title: 'Thủ thuật tìm kiếm nâng cao với toán tử Google Search',
      theme: 'Sử dụng toán tử site: filetype:pdf và dấu ngoặc kép tìm kiếm chính xác tài liệu học thuật và báo cáo nghiên cứu không bị loãng.',
      script:
        'Biến công cụ tìm kiếm Google thành một kho tàng tri thức chuẩn xác bằng cách sử dụng các toán tử tìm kiếm chuyên nghiệp của giới nghiên cứu.\n\n' +
        'Đặt cụm từ tìm kiếm trong dấu ngoặc kép để yêu cầu Google chỉ trả về các trang web chứa chính xác tuyệt đối cụm từ đó theo đúng thứ tự.\n\n' +
        'Sử dụng cú pháp \'filetype:pdf\' để tìm kiếm trực tiếp các tài liệu sách giáo trình hay báo cáo nghiên cứu dạng file PDF tải về miễn phí.\n\n' +
        'Thêm toán tử \'site:gov.vn\' hoặc \'site:edu.vn\' để lọc các nguồn thông tin chính thống đáng tin cậy từ các cơ quan chính phủ và trường đại học!',
    },
    {
      title: 'Thiết lập môi trường Linux với WSL2 trên Windows',
      theme: 'Cài đặt Ubuntu trên Windows 11 bằng lệnh wsl --install, tích hợp VS Code và chạy mượt mà các công cụ dòng lệnh Linux.',
      script:
        'Bạn dùng máy tính Windows nhưng công việc lập trình và khoa học dữ liệu lại đòi hỏi môi trường hệ điều hành Linux?\n\n' +
        'Tính năng WSL2 Windows Subsystem for Linux chính chủ cho phép bạn chạy một hệ điều hành Ubuntu hoàn chỉnh ngay bên trong Windows.\n\n' +
        'Khởi động cửa sổ dòng lệnh Linux chỉ trong 1 giây, chia sẻ chung hệ thống tệp tin và tận dụng tối đa tài nguyên card đồ họa GPU của máy thật.\n\n' +
        'Kết hợp hoàn hảo cùng trình biên tập mã nguồn VS Code: viết code trên giao diện Windows tiện lợi nhưng biên dịch và chạy thử trên môi trường Linux chuẩn mực!',
    },
  ],

  // 6. Template: huoke_soft_invite (20 mục)
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
    {
      title: 'Nấu một bữa cơm gia đình giản dị cuối tuần',
      theme: 'Góc bếp ấm cúng, canh cua mồng tơi, cà pháo giòn tan và cá bống kho tộ thơm lừng mùi tiêu đen.',
      script:
        'Những ngày bận rộn ngoài xã hội, điều mình mong mỏi nhất chỉ là được về nhà tự tay chuẩn bị một bữa cơm giản dị.\n\n' +
        'Bát canh cua nấu rau đay mồng tơi thanh mát, đĩa cà pháo muối giòn rụm và nồi cá kho tộ đậm đà xém cạnh bốc khói nghi ngút.\n\n' +
        'Mùi thơm của cơm gạo mới hòa cùng tiếng cười nói của người thân bên mâm cơm gia đình ấm áp.\n\n' +
        'Hạnh phúc đôi khi chỉ đơn sơ như vậy, bình yên và đủ đầy từ những điều thân thương nhất.',
    },
    {
      title: 'Đi chợ hoa sớm đón bình minh trong lành',
      theme: 'Chợ hoa đầu mối lúc 5h sáng, những bó cúc họa mi trắng muốt ngậm sương mai và hương thơm nhè nhẹ trong gió sớm.',
      script:
        'Thức dậy từ 5 giờ sáng khi thành phố vẫn còn chìm trong giấc ngủ say nồng để ghé chợ hoa đầu mối.\n\n' +
        'Hàng ngàn đóa hoa cúc họa mi, hoa ly và cẩm tú cầu còn ướt đẫm sương mai được xếp ngay ngắn trên các sạp hàng.\n\n' +
        'Chọn một bó hoa tươi rói mang về cắm trong chiếc bình gốm cũ đặt bên bậu cửa sổ phòng khách.\n\n' +
        'Một ngày mới bắt đầu tràn đầy năng lượng tươi mới và hương thơm dịu dàng lan tỏa khắp căn phòng.',
    },
    {
      title: 'Buổi tối đọc sách bên tách trà hoa cúc',
      theme: 'Đèn ngủ vàng dịu, trang sách thơm mùi giấy mới, tách trà hoa cúc mật ong ấm nóng và không gian tĩnh lặng.',
      script:
        'Sau 9 giờ tối, mình thường có thói quen tắt bớt đèn trần, chỉ để lại ánh sáng vàng ấm áp từ cây đèn đọc sách đầu giường.\n\n' +
        'Pha một ấm trà hoa cúc mật ong nóng hổi, hít hà làn khói thơm dịu nhẹ xua tan đi mọi căng thẳng mệt mỏi trong ngày.\n\n' +
        'Lật từng trang sách yêu thích, để tâm trí được trôi theo những câu từ sâu lắng và chiêm nghiệm cuộc sống.\n\n' +
        'Một khoảng lặng quý giá để tái tạo lại nguồn năng lượng tích cực trước khi chìm vào giấc ngủ an lành.',
    },
    {
      title: 'Dạo phố phường lúc lên đèn ngắm dòng người qua',
      theme: 'Phố cổ lung linh ánh đèn vàng, xe cộ chậm rãi, cơn gió heo may se lạnh và mùi hạt dẻ nướng thơm lừng góc phố.',
      script:
        'Có những buổi tối không có kế hoạch gì, mình chỉ thích xách xe lượn lờ chầm chậm qua từng con phố quen thuộc.\n\n' +
        'Ánh đèn đường vàng ấm áp chiếu rọi xuống những hàng cây cổ thụ già rụng lá, gió heo may thoang thoảng mùi ngô nướng thơm lừng.\n\n' +
        'Ngồi nép mình bên quán trà đá vỉa hè ngắm dòng người hối hả ngược xuôi, thấy cuộc sống sao mà thân thương và bình dị đến thế.\n\n' +
        'Thành phố này dù có ồn ào đến đâu, vẫn luôn có những góc nhỏ bình yên chờ bạn ghé qua.',
    },
    {
      title: 'Cùng mèo cưng tắm nắng sớm bên ban công',
      theme: 'Ban công đầy hoa cỏ, vạt nắng sớm vàng rực, chú mèo mướp nằm lười phơi bụng và tách cà phê đen thơm lừng.',
      script:
        'Buổi sáng thảnh thơi nhất là khi được ngồi ngoài ban công hít thở không khí trong lành của ngày mới.\n\n' +
        'Chú mèo cưng nằm dài trên chiếc ghế mây lười biếng tắm nắng, thỉnh thoảng khẽ cọ đầu vào chân nũng nịu đòi vuốt ve.\n\n' +
        'Nhấp một ngụm cà phê đen nguyên chất đắng nhẹ nhưng ngọt hậu, nghe tiếng chim sẻ hót ríu rít trên cành cây đầu ngõ.\n\n' +
        'Chẳng cần đi đâu xa, những khoảnh khắc dịu dàng này chính là liều thuốc chữa lành tâm hồn tuyệt vời nhất.',
    },
    {
      title: 'Ghé hiệu sách cũ tìm lại những ký ức xưa',
      theme: 'Hiệu sách cũ nhuốm màu thời gian, những chồng sách ố vàng mùi giấy mộc mạc và sự tĩnh lặng giữa phố xá nhộn nhịp.',
      script:
        'Bước chân vào căn hiệu sách cũ kỹ nằm sâu trong con ngõ nhỏ, thời gian dường như ngưng đọng lại từ nhiều thập kỷ trước.\n\n' +
        'Mùi giấy cũ ngai ngái đặc trưng bốc lên từ những kệ gỗ mộc mạc chất đầy các tập truyện tranh và tiểu thuyết kinh điển.\n\n' +
        'Tình cờ tìm thấy cuốn sách tuổi thơ với dòng đề tặng nắn nót từ năm 1998 khiến lòng bồi hồi xúc động khó tả.\n\n' +
        'Nơi lưu giữ không chỉ tri thức, mà còn cả những mảnh ký ức vô giá của biết bao thế hệ.',
    },
    {
      title: 'Một ngày sống chậm không mở mạng xã hội',
      theme: 'Tắt thông báo điện thoại, dọn dẹp nhà cửa, tưới cây, nghe một đĩa nhạc nhẹ và nấu ăn cho bản thân.',
      script:
        'Hôm nay mình quyết định thử thách bản thân: tắt toàn bộ thông báo mạng xã hội trong suốt 24 giờ.\n\n' +
        'Không còn cảm giác giật mình mỗi khi chuông điện thoại reo, không còn cuốn theo những drama và thông tin tiêu cực vô bổ trên bảng tin.\n\n' +
        'Mình có trọn vẹn thời gian để dọn dẹp lại căn phòng, tưới tắm cho chậu cây cảnh ngoài ban công và cắm một bình hoa mới.\n\n' +
        'Thế giới thực xung quanh bỗng trở nên sống động, rõ ràng và thanh thản hơn biết bao nhiêu.',
    },
    {
      title: 'Chuyến đạp xe quanh hồ hít thở không khí trong lành',
      theme: 'Sáng sớm ven hồ Tây / hồ Gươm, mặt nước phẳng lặng sương giăng mờ ảo, làn gió mát lành và nhịp chân đạp đều đặn.',
      script:
        '5 giờ 30 sáng, khi mặt trời vừa hé rạng sau rặng cây, mình bắt đầu vòng quay xe đạp quanh bờ hồ lộng gió.\n\n' +
        'Làn sương mỏng manh còn vương trên mặt nước biếc phẳng lặng như gương, từng cơn gió mát rượi phả vào mặt xua tan cơn ngái ngủ.\n\n' +
        'Nhịp chân đạp đều đặn qua từng con dốc thoai thoải, lắng nghe tiếng nhịp thở khỏe khoắn của cơ thể sau chuỗi ngày ngồi lì trước màn hình.\n\n' +
        'Một thói quen nhỏ lành mạnh giúp bạn nạp đầy năng lượng hứng khởi cho cả tuần dài làm việc!',
    },
    {
      title: 'Buổi sáng tinh mơ pha ấm trà sen Tây Hồ',
      theme: 'Ấm trà gốm sứ Bát Tràng, búp sen ướp trà thơm ngát mở cánh trong nước sôi, giọt sương mai đọng trên bậu cửa sổ sớm.',
      script:
        'Thức dậy sớm hơn thường lệ khi đường phố vẫn còn chìm trong làn sương mỏng manh mát lạnh của buổi sớm mai.\n\n' +
        'Tự tay tách từng cánh hoa sen Tây Hồ tươi rói được ướp trà shan tuyết cổ thụ từ tối hôm trước để pha một ấm trà xuân.\n\n' +
        'Rót làn nước vàng óng ả sóng sánh thơm nức hương hoa thanh tao vào chén ngọc, nhấp một ngụm nghe vị ngọt hậu lan tỏa sảng khoái tâm hồn.\n\n' +
        'Một khởi đầu ngày mới thanh tịnh và an yên, tiếp thêm nguồn năng lượng tích cực cho cả một ngày dài bận rộn.',
    },
    {
      title: 'Tự tay cắm một bình hoa ly thơm ngát phòng khách',
      theme: 'Bình gốm mộc mạc, những cành hoa ly hồng thắm hé nở, kéo cắt tỉa cành lá tỉ mỉ và căn phòng bừng sáng sức sống.',
      script:
        'Chiều tan làm ghé gánh hàng hoa rong bên hè phố, chọn một bó hoa ly hồng thắm còn ngậm nụ tươi rói mang về nhà.\n\n' +
        'Tỉ mỉ cắt tỉa từng chiếc lá dập, cắm từng cành hoa vào chiếc bình gốm mộc mạc đặt ngay ngắn giữa chiếc bàn gỗ phòng khách.\n\n' +
        'Chỉ vài phút chăm chút nhỏ bé, cả căn phòng nhỏ bỗng bừng sáng sức sống tươi mới và thoang thoảng hương hoa thơm ngát ngọt lành.\n\n' +
        'Yêu thương bản thân bắt đầu từ việc chăm chút cho không gian sống của mình mỗi ngày trở nên ấm áp và thi vị hơn.',
    },
    {
      title: 'Làm món bánh chuối nướng bơ đường thơm lừng',
      theme: 'Khuôn bánh nướng trong lò vàng ruộm, mùi thơm của chuối chín caramel hóa cùng bơ lạt lan tỏa khắp gian bếp ấm cúng ngày mưa.',
      script:
        'Những quả chuối tiêu chín đốm trứng cuốc ngọt lịm còn sót lại trong gian bếp được biến tấu thành món bánh nướng thơm lừng.\n\n' +
        'Dầm nhuyễn chuối cùng chút bơ nhạt đun chảy, bột mì và sữa tươi béo ngậy rồi đổ vào khuôn nướng ở nhiệt độ 175 độ C.\n\n' +
        'Sau 40 phút, chiếc bánh chín vàng ruộm thơm phức mùi đường caramel nướng giòn tan lan tỏa khắp căn nhà nhỏ.\n\n' +
        'Cắt một lát bánh nóng hổi thưởng thức cùng tách trà ấm bên khung cửa sổ ngày mưa — cảm giác hạnh phúc ngọt ngào đến tan chảy!',
    },
    {
      title: 'Đi dạo công viên lắng nghe tiếng lá vàng rơi',
      theme: 'Con đường lát gạch công viên rợp bóng cây cổ thụ, thảm lá vàng xào xạc dưới bước chân, làn gió thu se lạnh mơn man da thịt.',
      script:
        'Chiều thu mát mẻ, mình thích thả bộ chầm chậm dưới những tán cây cổ thụ già rợp bóng mát trong công viên trung tâm.\n\n' +
        'Từng chiếc lá vàng nhẹ nhàng chao nghiêng lìa cành đáp xuống thảm cỏ xanh mướt, tiếng lá xào xạc theo từng bước chân thong dong.\n\n' +
        'Ngồi xuống chiếc ghế đá ven hồ ngắm nhìn những cụ già tập dưỡng sinh và tiếng cười đùa trong trẻo của các bạn nhỏ nô đùa.\n\n' +
        'Cuộc sống vốn dĩ tươi đẹp và dịu dàng biết bao nhiêu khi chúng ta chịu chậm lại một nhịp để cảm nhận vạn vật xung quanh.',
    },
    {
      title: 'Buổi chiều cuối tuần đi bơi xua tan căng thẳng',
      theme: 'Làn nước hồ bơi trong xanh phẳng lặng phản chiếu ánh nắng chiều, cảm giác thả lỏng cơ thể trôi bồng bềnh không trọng lượng.',
      script:
        'Sau một tuần dài căng thẳng ngồi lì trước màn hình máy tính với hàng tá áp lực công việc đè nặng trên vai.\n\n' +
        'Thả mình xuống làn nước mát lạnh trong vắt của hồ bơi, cảm nhận toàn bộ cơ thể được thả lỏng bồng bềnh không trọng lượng.\n\n' +
        'Từng sải tay bơi lướt êm đềm trong làn nước, tiếng nước rì rào vỗ nhẹ vào tai xua tan đi mọi mệt mỏi và âu lo của cuộc sống.\n\n' +
        'Một cách rèn luyện sức khỏe tuyệt vời và làm mới lại tinh thần tràn đầy hứng khởi cho những ngày làm việc tiếp theo!',
    },
    {
      title: 'Nướng vài củ khoai mật bên bếp than hồng mùa đông',
      theme: 'Bếp than hoa bập bùng đốm lửa đỏ giữa đêm đông giá rét, củ khoai lang mật nướng ứa mật vàng óng thơm nức mũi.',
      script:
        'Đêm mùa đông gió lạnh rít từng hồi ngoài hiên nhà, quây quần bên chiếc bếp than hoa hồng rực ấm áp là ký ức đẹp nhất.\n\n' +
        'Những củ khoai lang mật vỏ mỏng được lùi trong lớp tro than hồng đượm, thỉnh thoảng khẽ lật đều tay cho khoai chín mềm từ từ.\n\n' +
        'Tách đôi củ khoai nóng bỏng tay, làn khói thơm nức mũi bốc lên nghi ngút để lộ phần ruột vàng óng ả ứa mật ngọt lịm đậm đà.\n\n' +
        'Vừa thổi vừa ăn, vị ngọt bùi làm ấm ran cả lồng ngực — sự ấm áp giản dị xua tan đi mọi cái lạnh giá của mùa đông buốt giá.',
    },
    {
      title: 'Ngồi bên bờ sông ngắm những chiếc thuyền đánh cá',
      theme: 'Bờ kè sông quê lúc hoàng hôn buông xuống, những con thuyền chài buông lưới trong ánh tà dương tím biếc, tiếng sóng vỗ mạn thuyền.',
      script:
        'Buổi chiều tà tĩnh lặng ngồi nép mình bên bờ kè sông ngắm nhìn nhịp sống êm ả của xóm chài ven sông.\n\n' +
        'Những con thuyền gỗ mộc mạc buông lưới trên làn nước biếc phẳng lặng lấp lánh phản chiếu ánh hoàng hôn tím thẫm của trời chiều.\n\n' +
        'Tiếng mái chèo khua nước nhịp nhàng hòa cùng tiếng gọi nhau í ới của những người ngư dân trở về sau một ngày đánh bắt mệt nhoài.\n\n' +
        'Khung cảnh thanh bình và mộc mạc như một bức tranh thủy mặc đưa tâm hồn ta trở về với những ký ức tuổi thơ êm đềm.',
    },
    {
      title: 'Viết nhật ký biết ơn những điều nhỏ bé trong ngày',
      theme: 'Cuốn sổ tay bìa da mộc mạc, cây bút mực nắn nót ghi lại 3 điều biết ơn giản dị: một bữa ăn ngon, một nụ cười ấm áp của người lạ.',
      script:
        'Trước khi tắt đèn đi ngủ, mình luôn dành ra đúng 5 phút để mở cuốn sổ tay nhỏ và viết ra 3 điều biết ơn trong ngày hôm nay.\n\n' +
        'Biết ơn vì sáng nay đã thức dậy với một cơ thể khỏe mạnh, biết ơn vì được thưởng thức một bát phở bò nóng hổi thơm ngon.\n\n' +
        'Và biết ơn vì nụ cười thân thiện của người bảo vệ khi dắt xe hộ lúc tan tầm về muộn.\n\n' +
        'Tập trung vào những điều tích cực nhỏ bé mỗi ngày sẽ nuôi dưỡng tâm hồn bạn trở nên giàu có, bao dung và luôn ngập tràn niềm vui sống!',
    },
    {
      title: 'Thử làm món sữa chua dẻo trái cây thanh mát',
      theme: 'Hộp sữa chua dẻo cắt thành từng viên vuông vức núng nính, xếp đầy dâu tây, kiwi và xoài chín rưới chút sữa đặc ngọt ngào.',
      script:
        'Chiều hè oi ả tự tay vào bếp làm món sữa chua dẻo trái cây thanh mát để chiêu đãi bản thân và người thân trong gia đình.\n\n' +
        'Sữa chua lên men tự nhiên được kết hợp cùng chút gelatin tạo nên độ dẻo quánh núng nính đặc trưng cắt thành từng viên vuông vức xinh xắn.\n\n' +
        'Xếp đầy các loại trái cây tươi mát cắt hạt lựu: dâu tây đỏ mọng, kiwi xanh mướt và xoài chín vàng ươm rưới thêm chút sữa đặc béo ngậy.\n\n' +
        'Một thìa chua ngọt thanh mát tan chảy trên đầu lưỡi, giải nhiệt tức thì và cung cấp hàm lượng vitamin dồi dào cho làn da căng mịn!',
    },
    {
      title: 'Buổi tối nghe radio tâm sự lắng đọng cảm xúc',
      theme: 'Chiếc đài radio cassette cổ điển phát ra giọng dẫn chuyện truyền cảm, ánh đèn vàng ấm áp và những câu chuyện đời sâu lắng.',
      script:
        'Có những buổi tối không muốn xem màn hình điện thoại chói mắt, mình chỉ thích bật chiếc đài radio nhỏ lắng nghe các chương trình đêm muộn.\n\n' +
        'Giọng dẫn chuyện ấm áp truyền cảm của phát thanh viên hòa cùng những bản tình ca xưa cũ phát ra từ chiếc loa đài mộc mạc.\n\n' +
        'Lắng nghe những tâm sự sẻ chia về tình yêu, gia đình và những trăn trở của những thính giả từ khắp mọi miền Tổ quốc xa xôi.\n\n' +
        'Nhận ra rằng trong cuộc đời này chúng ta không hề cô độc, luôn có những trái tim đồng điệu đang cùng nhịp đập và lắng nghe nhau.',
    },
  ],

  // 7. Template: live_street_interview (20 mục)
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
    {
      title: 'Bạn sẽ làm gì nếu trúng số 10 tỷ đồng ngày mai?',
      theme: 'Phỏng vấn nhanh giới trẻ và người lao động trên phố đi bộ: phản ứng bất ngờ, kế hoạch mua nhà, báo hiếu cha mẹ và du lịch.',
      script:
        'Hôm nay chúng mình có một câu hỏi thú vị dành cho các bạn trẻ: Nếu sáng mai thức dậy tài khoản bỗng có 10 tỷ đồng, bạn sẽ làm gì đầu tiên?\n\n' +
        'Có bạn sinh viên hào hứng chia sẻ sẽ trả hết nợ tiền học và mua ngay cho bố mẹ một căn nhà khang trang ở quê.\n\n' +
        'Có bạn nhân viên văn phòng lại bảo sẽ nộp đơn nghỉ việc ngay lập tức để thực hiện ước mơ chu du vòng quanh thế giới.\n\n' +
        'Còn bạn thì sao? Nếu có 10 tỷ trong tay, việc đầu tiên bạn nghĩ tới là gì?',
    },
    {
      title: 'Bài học lớn nhất sau mối tình đầu là gì?',
      theme: 'Những câu trả lời chân thật, xúc động từ các bạn trẻ trên phố: học cách yêu bản thân, buông bỏ sự kiểm soát và tôn trọng tự do.',
      script:
        'Mối tình đầu luôn là ký ức đẹp đẽ nhưng cũng để lại nhiều bài học sâu sắc nhất trong cuộc đời mỗi người.\n\n' +
        'Một bạn nam chia sẻ: \'Bài học lớn nhất là yêu thương không đồng nghĩa với việc kiểm soát cuộc sống của đối phương.\'\n\n' +
        'Một bạn nữ mỉm cười nhẹ nhàng: \'Mình học được rằng trước khi muốn yêu một ai đó trọn vẹn, hãy học cách trân trọng và yêu lấy chính bản thân mình trước.\'\n\n' +
        'Những vết thương thời thanh xuân rồi cũng sẽ lành, để lại cho ta sự bao dung và trưởng thành hơn.',
    },
    {
      title: 'Dân văn phòng cần bao nhiêu tiền để nghỉ hưu sớm?',
      theme: 'Khảo sát tại sảnh tòa nhà văn phòng tài chính: con số mong muốn từ 5 tỷ đến 20 tỷ và định nghĩa về tự do tài chính FIRE.',
      script:
        'Nghỉ hưu sớm trước tuổi 40 đang là trào lưu được rất nhiều bạn trẻ văn phòng theo đuổi. Vậy con số cụ thể là bao nhiêu?\n\n' +
        'Đa số các bạn cho rằng cần tích lũy tối thiểu từ 5 đến 7 tỷ đồng để có dòng tiền thụ động trang trải các chi phí sinh hoạt cơ bản.\n\n' +
        'Tuy nhiên, nhiều anh chị có kinh nghiệm lại khẳng định: nghỉ hưu không phải là ngừng làm việc hoàn toàn, mà là có quyền tự do lựa chọn công việc mình yêu thích mà không phải lo nghĩ về tiền.\n\n' +
        'Mục tiêu tài chính của bạn là bao nhiêu để sẵn sàng bước vào cuộc sống tự do?',
    },
    {
      title: 'Món ăn đường phố yêu thích nhất của người Sài Gòn / Hà Nội',
      theme: 'Phỏng vấn thực khách tại chợ đêm: phở bò, bánh mì kẹp, bún chả nướng than hoa và trà đá vỉa hè.',
      script:
        'Nếu chỉ được chọn duy nhất một món ăn đại diện cho ẩm thực đường phố, bạn sẽ chọn món nào?\n\n' +
        'Người Hà Nội không ngần ngại gọi tên bát phở bò tái gầu nước trong thơm nức mùi hành hoa buổi sớm mai.\n\n' +
        'Người Sài Gòn lại say sưa nhắc về ổ bánh mì thịt nướng giòn rụm đậm đà nước sốt chan ngập cay nồng.\n\n' +
        'Ẩm thực đường phố Việt Nam không chỉ là hương vị thơm ngon, mà còn là linh hồn văn hóa gắn liền với ký ức của biết bao thế hệ.',
    },
    {
      title: 'Điều bạn muốn gửi gắm cho chính mình năm 18 tuổi?',
      theme: 'Góc nhìn sâu lắng của những người ở độ tuổi 30 nhìn lại tuổi trẻ: đừng sợ thất bại, hãy can đảm theo đuổi đam mê.',
      script:
        'Nếu có một chiếc máy thời gian quay về gặp lại chính mình năm 18 tuổi, bạn sẽ nói điều gì?\n\n' +
        '\'Đừng quá lo lắng về việc thi trượt đại học hay chọn sai ngành, cuộc đời còn rất nhiều ngã rẽ tuyệt vời phía trước.\'\n\n' +
        '\'Hãy dành nhiều thời gian hơn để ở bên gia đình, vì cha mẹ già đi nhanh hơn bạn tưởng rất nhiều.\'\n\n' +
        'Tuổi 18 ai cũng từng hoang mang và vụng về, nhưng chính những vấp ngã ấy đã nhào nặn nên một phiên bản vững vàng của bạn ngày hôm nay.',
    },
    {
      title: 'Bạn có chấp nhận làm việc 12 tiếng để nhận lương cao?',
      theme: 'Tranh luận giữa thế hệ Gen Z và thế hệ 8x/9x về cân bằng cuộc sống Work-Life Balance vs cày cuốc thăng tiến sự nghiệp.',
      script:
        'Đánh đổi thời gian và sức khỏe để lấy mức thu nhập khủng hàng tháng — liệu có thực sự xứng đáng?\n\n' +
        'Nhiều bạn trẻ thế hệ mới thẳng thắn từ chối: \'Tiền kiếm được nhiều đến mấy cũng không mua lại được sức khỏe và những khoảnh khắc thanh xuân trôi qua.\'\n\n' +
        'Trong khi một số bạn khác lại cho rằng: \'Khi còn trẻ và chưa vướng bận gia đình, hãy nỗ lực hết mình để tạo bệ phóng tài chính vững chắc cho tương lai.\'\n\n' +
        'Quan điểm của bạn nghiêng về lối sống cân bằng hay bứt phá tối đa?',
    },
    {
      title: 'Thói quen xấu nào bạn muốn từ bỏ nhất trong năm nay?',
      theme: 'Chia sẻ thành thật trên đường phố: thức khuya lướt điện thoại, trì hoãn công việc và thói quen mua sắm theo cảm xúc.',
      script:
        'Ai trong chúng ta cũng có những thói quen xấu biết là có hại nhưng mãi vẫn chưa sửa được.\n\n' +
        'Top 1 thói quen được nhắc đến nhiều nhất chính là: nằm lướt TikTok đến 1–2 giờ sáng dù biết ngày mai phải dậy sớm đi làm.\n\n' +
        'Kế tiếp là thói quen \'nước đến chân mới nhảy\' và đặt đồ ăn vặt lúc nửa đêm khi cảm thấy buồn chán.\n\n' +
        'Nhận diện được thói quen xấu đã là bước đầu tiên của sự thay đổi. Hôm nay bạn đã sẵn sàng bắt đầu từ bỏ điều gì?',
    },
    {
      title: 'Hạnh phúc đối với bạn lúc này là gì?',
      theme: 'Những nụ cười bình dị của người qua đường: gia đình bình an, một bữa cơm ngon, không phải tăng ca và ngủ một giấc thật ngon.',
      script:
        'Hỏi 10 người trên phố về định nghĩa của hạnh phúc, bạn sẽ nhận được 10 câu trả lời hoàn toàn khác nhau.\n\n' +
        'Với người ốm, hạnh phúc là một cơ thể khỏe mạnh không đau đớn.\n\n' +
        'Với người đi làm xa quê, hạnh phúc là tấm vé xe về quê đoàn tụ cùng gia đình trong bữa cơm chiều cuối năm.\n\n' +
        'Hạnh phúc thực ra không nằm ở đích đến xa xôi, mà hiện diện ngay trong từng khoảnh khắc giản dị mà bạn đang có hôm nay.',
    },
    {
      title: 'Bạn có tin vào tình yêu sét đánh từ cái nhìn đầu?',
      theme: 'Phỏng vấn các cặp đôi và người độc thân trên phố đi bộ: câu chuyện gặp gỡ định mệnh vs quan điểm tình yêu cần thời gian vun đắp.',
      script:
        'Tình yêu sét đánh từ cái nhìn đầu tiên liệu có thực sự tồn tại hay chỉ là ảo tưởng lãng mạn trong các bộ phim ngôn tình?\n\n' +
        'Một bạn nam mỉm cười nắm chặt tay bạn gái: \'Lần đầu tiên nhìn thấy cô ấy ở thư viện, tim mình bỗng hẫng đi một nhịp và mình biết chắc đây chính là định mệnh của đời mình.\'\n\n' +
        'Trong khi một anh chàng khác lại thực tế chia sẻ: \'Cái nhìn đầu tiên chỉ là sự hấp dẫn về ngoại hình thôi, tình yêu bền vững phải xây dựng từ sự thấu hiểu và sẻ chia qua năm tháng.\'\n\n' +
        'Còn bạn thì sao? Bạn tin vào tiếng sét ái tình định mệnh hay tình yêu mưa dầm thấm lâu?',
    },
    {
      title: 'Chi tiêu lớn nhất bạn từng hối hận là gì?',
      theme: 'Những chia sẻ hài hước nhưng thấm thía trên đường phố: thẻ tập gym 1 năm đi được 3 ngày, khóa học online mua về bỏ xó và đồ hiệu trả góp.',
      script:
        'Khoản tiền lớn nhất bạn từng chi ra mà đến bây giờ nghĩ lại vẫn cảm thấy ruột đau như cắt là gì?\n\n' +
        'Top 1 câu trả lời được nhắc đến nhiều nhất: \'Đóng tiền thẻ tập gym trọn gói 2 năm hết 15 triệu nhưng chỉ đi đúng 3 ngày đầu rồi bỏ xó.\'\n\n' +
        'Một bạn nữ thở dài: \'Mua chiếc túi xách hàng hiệu trả góp bằng 3 tháng lương chỉ để chụp ảnh sống ảo vài lần rồi cất tủ vì sợ xước.\'\n\n' +
        'Những bài học tài chính đắt giá thời trẻ giúp chúng ta tỉnh táo hơn trước những cái bẫy tiêu dùng cảm xúc vô bổ!',
    },
    {
      title: 'Nghề nghiệp trong mơ của bạn khi còn là đứa trẻ?',
      theme: 'So sánh ước mơ thời thơ ấu (phi hành gia, họa sĩ, bác sĩ) với công việc thực tế hiện tại (nhân viên văn phòng, lập trình viên).',
      script:
        'Hồi còn nhỏ học cấp một, ước mơ sau này lớn lên làm nghề gì của bạn là gì?\n\n' +
        '\'Ngày xưa mình ước làm phi hành gia bay vào vũ trụ, còn giờ mình làm nhân viên văn phòng bay nhảy giữa các file Excel mỗi ngày!\'\n\n' +
        '\'Ước làm siêu anh hùng giải cứu thế giới, giờ chỉ mong giải cứu được tài khoản ngân hàng của mình cuối mỗi tháng.\'\n\n' +
        'Những ước mơ ngây thơ thuở bé dẫu có khác xa thực tại, nhưng luôn là mảnh ký ức ngọt ngào nhắc nhở ta về một thời từng dám ước mơ không giới hạn.',
    },
    {
      title: 'Bạn thích sống ở thành phố sôi động hay miền quê?',
      theme: 'Tranh luận giữa người trẻ khởi nghiệp chọn thành phố nhiều cơ hội vs người chọn bỏ phố về quê sống an nhiên bên vườn cây.',
      script:
        'Lựa chọn giữa nhịp sống hối hả hiện đại của thành phố lớn và sự thanh bình mộc mạc của làng quê thôn dã.\n\n' +
        'Người trẻ chọn thành phố vì nơi đây có vô vàn cơ hội phát triển sự nghiệp, hệ thống y tế giáo dục hiện đại và nhịp sống năng động về đêm.\n\n' +
        'Trong khi những người từng trải lại mơ về một căn nhà nhỏ ven đồi ngoại ô: sáng thức dậy nghe chim hót, tự tay trồng rau nuôi gà và hít thở không khí trong lành.\n\n' +
        'Không có lựa chọn nào đúng hay sai tuyệt đối, quan trọng là nơi nào mang lại cho bạn cảm giác thuộc về và sự bình an trong tâm hồn.',
    },
    {
      title: 'Điều gì khiến bạn cảm thấy tự hào nhất về bản thân?',
      theme: 'Những khoảnh khắc tự hào đời thường: tự lập tài chính nuôi em ăn học, vượt qua trầm cảm hay dám bước ra khỏi vùng an toàn.',
      script:
        'Bỏ qua những bằng khen hay thành tích vật chất, điều gì sâu thẳm bên trong khiến bạn thực sự tự hào nhất về chính mình?\n\n' +
        'Một bạn sinh viên xúc động: \'Tự hào vì từ năm hai đại học mình đã tự đi làm thêm tự trang trải toàn bộ học phí và gửi tiền về phụ giúp cha mẹ ở quê.\'\n\n' +
        'Một bạn gái trẻ nghẹn ngào: \'Tự hào vì đã dũng cảm vượt qua giai đoạn trầm cảm tăm tối nhất cuộc đời để hôm nay có thể đứng đây mỉm cười rạng rỡ.\'\n\n' +
        'Mỗi chúng ta đều là một chiến binh dũng cảm đã chiến đấu kiên cường với những khó khăn vô hình của cuộc đời mình!',
    },
    {
      title: 'Bạn có sẵn sàng tha thứ nếu người yêu phản bội?',
      theme: 'Thảo luận thẳng thắn về sự chung thủy trong tình yêu: \'Một lần bất tín vạn lần bất tin\' vs cơ hội sửa sai cho một mối quan hệ lâu năm.',
      script:
        'Nếu người bạn yêu thương và tin tưởng nhất lỡ phạm phải sai lầm phản bội một lần duy nhất, bạn có sẵn sàng mở lòng tha thứ?\n\n' +
        '90% các bạn trẻ được hỏi đều thẳng thắn trả lời: \'Tuyệt đối KHÔNG! Trong tình yêu, sự chung thủy là nguyên tắc cốt lõi không bao giờ có ngoại lệ.\'\n\n' +
        '\'Một khi chiếc gương lòng tin đã vỡ vụn thì dù có gắn lại bằng cách nào, vết rạn nứt nghi ngờ vẫn sẽ mãi ám ảnh tâm trí suốt cuộc đời.\'\n\n' +
        'Dũng cảm buông tay một mối quan hệ độc hại chính là cách bạn tự tôn trọng phẩm giá và giá trị của bản thân mình!',
    },
    {
      title: 'Cuốn sách nào đã thay đổi nhân sinh quan của bạn?',
      theme: 'Giới thiệu những cuốn sách gối đầu giường truyền cảm hứng: Đắc nhân tâm, Nhà giả kim, Thức tỉnh mục đích sống và Muôn kiếp nhân sinh.',
      script:
        'Có cuốn sách nào bạn từng đọc mà nó đã làm thay đổi hoàn toàn cách bạn nhìn nhận về cuộc đời và con người xung quanh không?\n\n' +
        'Cuốn sách \'Nhà Giả Kim\' được nhắc đến nhiều nhất với thông điệp: \'Khi bạn thực sự khao khát một điều gì đó, cả vũ trụ sẽ hợp lực giúp bạn đạt được nó.\'\n\n' +
        'Một bạn khác lại chia sẻ về cuốn \'Hiểu Về Trái Tim\' đã giúp bạn học cách lắng nghe và chuyển hóa những cơn giận dữ thành tình thương yêu bao dung.\n\n' +
        'Sách là người thầy vĩ đại nhất, một cuốn sách hay có thể soi sáng và thay đổi cả quỹ đạo số phận của một con người.',
    },
    {
      title: 'Nỗi sợ hãi lớn nhất trong cuộc sống của bạn là gì?',
      theme: 'Những nỗi sợ chân thật nhất: sợ cha mẹ già đi nhanh hơn sự thành công của mình, sợ sự cô độc và sợ lãng phí tuổi trẻ vô nghĩa.',
      script:
        'Nếu phải gọi tên một nỗi sợ hãi lớn nhất đang âm thầm ngự trị trong lòng bạn lúc này, đó sẽ là điều gì?\n\n' +
        '\'Nỗi sợ lớn nhất của mình là tốc độ thành công của bản thân không kịp đuổi theo tốc độ già đi của mái tóc cha mẹ.\'\n\n' +
        '\'Sợ một ngày ngoảnh lại nhìn lại tuổi thanh xuân thấy mình đã sống một cuộc đời quá an toàn, nhạt nhẽo và không để lại bất kỳ dấu ấn nào.\'\n\n' +
        'Nỗi sợ hãi không sinh ra để làm bạn chùn bước, nó sinh ra như một lời nhắc nhở để bạn trân trọng từng phút giây và nỗ lực nhiều hơn mỗi ngày!',
    },
    {
      title: 'Bạn thường làm gì mỗi khi cảm thấy cô đơn nhất?',
      theme: 'Cách người trẻ đối diện với nỗi cô đơn: đeo tai nghe đi dạo đêm, viết nhật ký, nấu ăn hoặc ngồi ngắm thành phố từ trên cao.',
      script:
        'Ở giữa một thành phố hàng triệu dân đông đúc nhộn nhịp, có những khoảnh khắc bạn cảm thấy mình cô đơn đến cùng cực.\n\n' +
        '\'Những lúc như vậy mình thường đeo tai nghe bật bài nhạc quen thuộc rồi đạp xe đi dạo qua những con phố vắng ngắm nhìn thành phố lên đèn.\'\n\n' +
        '\'Mình vào bếp tự nấu một món ăn thật ngon, dọn dẹp lại căn phòng và nằm xem một bộ phim hoạt hình tuổi thơ ấm áp.\'\n\n' +
        'Học cách kết bạn và tận hưởng sự cô đơn chính là bước ngoặt đánh dấu sự trưởng thành và độc lập thực sự của một con người.',
    },
    {
      title: 'Lời khuyên giá trị nhất cha mẹ từng dạy cho bạn?',
      theme: 'Những lời răn dạy mộc mạc thấm thía: sống tử tế thật thà, nghèo cho sạch rách cho thơm và luôn có trách nhiệm với lời nói.',
      script:
        'Bài học quý giá nhất từ cha mẹ mà bạn luôn mang theo như chiếc kim chỉ nam định hướng cho cuộc đời mình là gì?\n\n' +
        '\'Bố mình luôn dặn: Ra ngoài xã hội làm người có thể không giàu có bằng ai, nhưng nhất định phải sống ngay thẳng, thật thà và giữ trọn chữ Tín.\'\n\n' +
        '\'Mẹ mình dạy: Dù có bực bội hay tức giận đến đâu, cũng đừng bao giờ nói những lời làm tổn thương lòng tự trọng của người khác.\'\n\n' +
        'Những bài học làm người mộc mạc và chân chất của đấng sinh thành chính là tài sản vô giá nhất theo ta suốt cả cuộc đời!',
    },
  ],

  // 8. Template: live_product_desk (20 mục)
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
    {
      title: 'Thử nghiệm độ bền cáp sạc nhanh bọc dù chống đứt',
      theme: 'Góc máy quay cận cảnh mặt bàn: bẻ gập đầu cáp 10.000 lần, kéo thử tải trọng 5kg và đo công suất sạc 100W bằng máy đo điện năng.',
      script:
        'Sợi cáp sạc điện thoại của bạn cứ dùng được 3 tháng là bị gãy đầu hoặc đứt ngầm bên trong?\n\n' +
        'Hôm nay chúng ta cùng kiểm tra độ bền thực tế của mẫu cáp sạc bọc dù bọc thép quân đội này ngay trên bàn làm việc.\n\n' +
        'Thử nghiệm bẻ gập liên tục 180 độ tại phần cổ cáp — nơi dễ tổn thương nhất, lớp gia cố cao su đàn hồi bảo vệ lõi đồng bên trong hoàn hảo.\n\n' +
        'Cắm máy đo công suất USB Tester: dòng điện đạt chuẩn 100W Power Delivery sạc đầy chiếc MacBook Pro chỉ trong 1 tiếng 20 phút!',
    },
    {
      title: 'Trình diễn giá đỡ laptop hợp kim nhôm xoay 360 độ',
      theme: 'Trên tay giá đỡ nhôm CNC nguyên khối, khớp xoay kêu tách tách đã tai, nâng cao màn hình ngang tầm mắt bảo vệ cột sống.',
      script:
        'Một món phụ kiện không thể thiếu nếu bạn thường xuyên làm việc với laptop nhiều giờ liền.\n\n' +
        'Được gia công từ hợp kim nhôm CNC nguyên khối dày dặn, các khớp nối chịu tải cực tốt không hề có hiện tượng rung lắc khi gõ phím mạnh tay.\n\n' +
        'Đặc biệt phần đế xoay 360 độ với âm thanh \'tách tách\' cơ học cực kỳ êm tai và tiện lợi khi cần chia sẻ màn hình với người đối diện.\n\n' +
        'Nâng màn hình lên đúng tầm mắt giúp bạn luôn giữ thẳng lưng và tạm biệt cơn đau mỏi vai gáy kinh niên!',
    },
    {
      title: 'Test củ sạc nhanh GaN 65W sạc 3 thiết bị cùng lúc',
      theme: 'Củ sạc công nghệ Gallium Nitride nhỏ bằng bao diêm, sạc cùng lúc laptop, iPad và điện thoại không bị quá nhiệt.',
      script:
        'Thời đại này rồi, đừng mang theo 3 củ sạc to tướng cồng kềnh trong balo mỗi khi ra ngoài làm việc nữa.\n\n' +
        'Củ sạc công nghệ GaN thế hệ mới này có kích thước chỉ bằng một bao diêm nhưng công suất lên tới 65W cực khủng.\n\n' +
        'Trang bị 2 cổng Type-C và 1 cổng USB-A: tự động phân bổ nguồn điện thông minh khi cắm sạc đồng thời cả laptop, máy tính bảng và điện thoại.\n\n' +
        'Kiểm tra bằng camera nhiệt sau 1 tiếng sạc liên tục: nhiệt độ bề mặt chỉ duy trì ở mức 42 độ C ấm nhẹ, cực kỳ an toàn và ổn định!',
    },
    {
      title: 'Trên tay đồng hồ thông minh theo dõi nhịp tim thể thao',
      theme: 'Đập hộp smartwatch mặt kính sapphire, đo nồng độ oxy trong máu SpO2, màn hình AMOLED độ sáng 2000 nits ngoài trời nắng.',
      script:
        'Mở hộp chiếc đồng hồ thông minh đang gây sốt trong cộng đồng những người yêu thích chạy bộ và tập gym gần đây.\n\n' +
        'Khung viền titan siêu nhẹ kết hợp cùng mặt kính Sapphire chống trầy xước tuyệt đối, màn hình AMOLED hiển thị sắc nét ngay cả dưới trời nắng gắt.\n\n' +
        'Cụm cảm biến quang học phía sau đo nhịp tim liên tục 24/7, nồng độ oxy trong máu SpO2 và theo dõi chi tiết các giai đoạn giấc ngủ sâu.\n\n' +
        'Thời lượng pin ấn tượng lên tới 14 ngày chỉ sau một lần sạc đầy, người bạn đồng hành lý tưởng cho lối sống năng động!',
    },
    {
      title: 'Trình diễn đèn treo màn hình bảo vệ mắt chống lóa',
      theme: 'Lắp đặt thanh đèn LED treo trên viền màn hình máy tính, thiết kế quang học bất đối xứng không chiếu vào màn hình, núm xoay điều khiển không dây.',
      script:
        'Làm việc đêm dưới ánh đèn phòng chói chang hoặc bóng tối mù mịt là nguyên nhân hàng đầu khiến mắt bạn bị khô rát và tăng độ cận.\n\n' +
        'Chiếc đèn treo màn hình này giải quyết triệt để vấn đề đó nhờ thiết kế nguồn sáng bất đối xứng: ánh sáng chỉ rọi thẳng xuống mặt bàn làm việc mà không hề phản chiếu vào màn hình máy tính.\n\n' +
        'Đi kèm núm xoay điều khiển không dây đặt trên bàn: xoay nhẹ để tăng giảm độ sáng và chỉnh nhiệt độ màu từ vàng ấm sang trắng mát linh hoạt.\n\n' +
        'Đôi mắt của bạn sẽ cảm thấy dễ chịu và thư thái hơn rất nhiều trong những buổi làm việc đêm muộn!',
    },
    {
      title: 'Đập hộp tai nghe chống ồn chủ động ANC cao cấp',
      theme: 'Mở hộp tai nghe over-ear đệm da êm ái, test tính năng chống ồn chủ động khử 98% tiếng ồn xung quanh và chế độ xuyên âm tự nhiên.',
      script:
        'Cảm giác đeo chiếc tai nghe chống ồn này lên tai giống như bạn vừa bước vào một không gian tĩnh lặng hoàn toàn riêng biệt giữa quán cà phê ồn ào.\n\n' +
        'Hệ thống micro kép thu âm tiếng ồn môi trường và phát ra sóng âm ngược pha để triệt tiêu lên tới 98% tiếng còi xe và tiếng trò chuyện xung quanh.\n\n' +
        'Phần đệm tai bọc da protein mềm mại ôm trọn vành tai, đeo suốt 4 tiếng liên tục không hề bị cấn hay đau buốt đầu.\n\n' +
        'Chất âm trầm ấm, dải bass uy lực sâu lắng đưa trải nghiệm thưởng thức âm nhạc của bạn lên một đẳng cấp hoàn toàn mới!',
    },
    {
      title: 'Trải nghiệm bút cảm ứng vẽ đồ họa trên tablet',
      theme: 'Thử nghiệm vẽ nét thanh nét đậm trên iPad/máy tính bảng, cảm ứng lực 4096 mức độ, tính năng chống tỳ đè lòng bàn tay mượt mà.',
      script:
        'Bạn muốn ghi chép bài giảng hoặc tập vẽ đồ họa số nhưng ngại chi phí đắt đỏ của bút vẽ chính hãng?\n\n' +
        'Mẫu bút cảm ứng stylus thế hệ mới này mang lại 90% trải nghiệm của bút cao cấp với mức giá chỉ bằng một phần ba.\n\n' +
        'Trang bị tính năng Palm Rejection thông minh: bạn có thể thoải mái tỳ cả lòng bàn tay lên màn hình khi viết mà không sợ bị loạn cảm ứng.\n\n' +
        'Độ trễ gần như bằng 0, nét vẽ thanh đậm biến chuyển mượt mà theo góc nghiêng của ngòi bút, cực kỳ thích hợp cho học sinh, sinh viên!',
    },
    {
      title: 'Test thảm lót bàn da chống nước và chống bám bẩn',
      theme: 'Đổ thử nước cà phê và tương ớt lên bề mặt thảm da PU, dùng khăn giấy lau sạch bóng không để lại vết ố trong 3 giây.',
      script:
        'Nâng cấp góc bàn làm việc trở nên sang trọng và sạch sẽ chỉ với một chiếc thảm lót bàn da PU cao cấp.\n\n' +
        'Hôm nay chúng ta cùng thử thách độ bền bề mặt bằng cách đổ thẳng một tách cà phê đen và tương ớt lên thảm.\n\n' +
        'Nhờ lớp phủ nano kỵ nước tiên tiến, chất lỏng co lại thành từng giọt tròn lăn trên bề mặt mà không hề thấm vào bên trong.\n\n' +
        'Chỉ cần dùng một tờ khăn giấy khô lau nhẹ qua là bề mặt sạch bóng như mới, không để lại bất kỳ vệt ố vàng hay mùi hôi khó chịu nào!',
    },
    {
      title: 'Mở hộp micro thu âm cài áo không dây khử ồn',
      theme: 'Cận cảnh hộp sạc micro không dây mini, kẹp micro lên ve áo, test thử tính năng lọc sạch tiếng còi xe ngoài đường phố đông đúc.',
      script:
        'Mở hộp chiếc micro thu âm cài áo không dây đang được các nhà sáng tạo nội dung TikTok và Vlog săn lùng nhiều nhất hiện nay.\n\n' +
        'Hộp sạc nhỏ gọn tích hợp 2 micro truyền phát và 1 đầu thu cắm trực tiếp vào cổng Lightning hoặc Type-C của điện thoại.\n\n' +
        'Bật tính năng lọc ồn chủ động bằng chip xử lý AI: giọng nói của bạn vang lên trong trẻo rõ ràng, triệt tiêu hoàn toàn 95% tiếng còi xe và gió rít xung quanh.\n\n' +
        'Phạm vi truyền tín hiệu xa tới 50 mét không độ trễ, thời lượng pin trâu dùng liên tục 8 tiếng — trợ thủ đắc lực nâng tầm chất lượng video của bạn!',
    },
    {
      title: 'Trải nghiệm dock chuyển đổi 10 trong 1 Type-C',
      theme: 'Cắm dock nhôm đa năng vào MacBook: xuất cùng lúc 2 màn hình 4K 60Hz, cắm thẻ nhớ SD, mạng LAN 1Gbps và sạc nhanh 100W.',
      script:
        'Chiếc laptop mỏng nhẹ của bạn chỉ có vẻn vẹn hai cổng Type-C khiến việc kết nối các thiết bị ngoại vi trở thành một cực hình?\n\n' +
        'Chiếc Hub chuyển đổi 10 trong 1 vỏ nhôm tản nhiệt cao cấp này sẽ biến chiếc laptop của bạn thành một trạm làm việc chuyên nghiệp thực thụ.\n\n' +
        'Trang bị đầy đủ các cổng kết nối đỉnh cao: 2 cổng xuất hình ảnh HDMI 4K 60Hz mượt mà, khe cắm thẻ nhớ tốc độ cao cho dân nhiếp ảnh và cổng mạng LAN Gigabit ổn định.\n\n' +
        'Hỗ trợ sạc chuyển tiếp công suất lên tới 100W Power Delivery sạc nhanh cho máy tính mà không làm sụt giảm nguồn điện của các thiết bị khác!',
    },
    {
      title: 'Test máy in ảnh mini cầm tay kết nối Bluetooth',
      theme: 'Máy in ảnh công nghệ ZINK không cần mực, in ảnh lấy liền từ smartphone qua Bluetooth trong 40 giây, mặt sau bóc dán tiện lợi.',
      script:
        'In những bức ảnh kỷ niệm xinh xắn từ điện thoại ngay tức thì ở bất kỳ đâu với chiếc máy in ảnh mini bỏ túi áo này.\n\n' +
        'Sử dụng công nghệ in nhiệt ZINK tiên tiến không cần đổ mực in phức tạp: các tinh thể màu được kích hoạt trực tiếp từ nhiệt độ đầu in lên giấy ảnh chuyên dụng.\n\n' +
        'Kết nối Bluetooth siêu tốc với điện thoại: bạn có thể tự do chỉnh sửa ảnh, thêm khung hình sticker đáng yêu trên app rồi bấm in chỉ sau 40 giây.\n\n' +
        'Mặt sau bức ảnh có lớp keo dán bóc ra được ngay, cực kỳ thích hợp để dán vào sổ nhật ký lưu bút hay ốp lưng điện thoại!',
    },
    {
      title: 'Trình diễn bàn di chuột nhôm nguyên khối cho Mac',
      theme: 'Bàn di chuột Magic Trackpad mặt kính cường lực nhôm bạc, hỗ trợ đầy đủ các thao tác vuốt 3 ngón, zoom phóng to mượt mà trên macOS.',
      script:
        'Nâng cấp trải nghiệm điều khiển máy tính lên đỉnh cao của sự mượt mà với bàn di chuột Trackpad mặt kính cường lực nguyên khối.\n\n' +
        'Bề mặt kính siêu mịn màng mang lại cảm giác lướt ngón tay êm ái tuyệt đối, hỗ trợ đầy đủ toàn bộ các thao tác cảm ứng đa điểm của hệ điều hành macOS.\n\n' +
        'Vuốt 3 ngón tay để chuyển đổi mượt mà giữa các màn hình làm việc, chụm 4 ngón tay để mở nhanh danh sách ứng dụng Launchpad trong tích tắc.\n\n' +
        'Thiết kế góc nghiêng công thái học giúp cổ tay của bạn luôn ở tư thế tự nhiên thoải mái nhất, không lo bị chai cổ tay như dùng chuột truyền thống!',
    },
    {
      title: 'Trên tay loa Bluetooth chống nước chuẩn quân đội',
      theme: 'Thử thả loa Bluetooth vào bể nước khi đang phát nhạc bass dồn dập, bọc cao su chống va đập, âm thanh 360 độ uy lực ngoài trời.',
      script:
        'Chiếc loa di động nồi đồng cối đá sinh ra để đồng hành cùng bạn trong mọi chuyến đi phượt và những buổi tiệc dã ngoại ngoài trời.\n\n' +
        'Đạt tiêu chuẩn chống nước và bụi bẩn IP67: chúng ta cùng thử thách thả thẳng chiếc loa đang phát nhạc vào bồn nước, loa vẫn nổi bồng bềnh và phát nhạc xập xình bình thường.\n\n' +
        'Vỏ ngoài bọc lớp cao su dày dặn chống sốc chịu được va đập rơi từ độ cao 1.5 mét xuống nền đá mà không hề bị trầy xước hay móp méo.\n\n' +
        'Dải loa công suất 30W với màng cộng hưởng thụ động mang lại âm bass uy lực, chắc nịch khuấy động mọi không gian tiệc tùng!',
    },
    {
      title: 'Mở hộp bộ tua vít đa năng sửa đồ công nghệ',
      theme: 'Hộp kim loại bật nắp nam châm, 48 đầu vít hợp kim thép S2 siêu cứng sửa chữa điện thoại, laptop, đồng hồ và kính mắt chuyên nghiệp.',
      script:
        'Một món đồ không thể thiếu trong ngăn bàn của những anh em đam mê công nghệ và thích tự tay mày mò sửa chữa đồ điện tử tại nhà.\n\n' +
        'Hộp đựng bằng hợp kim nhôm Anode bấm nắp tự bật ra cực kỳ sang chảnh, toàn bộ 48 đầu vít được gắn từ tính nam châm hít chặt không sợ rơi rớt.\n\n' +
        'Các đầu vít được gia công từ thép hợp kim S2 cao cấp với độ cứng lên tới 60 HRC, vặn mở các con ốc siêu nhỏ của iPhone, laptop hay kính mắt không sợ bị toét đầu ốc.\n\n' +
        'Tay cầm tua vít xoay 360 độ êm ái ở phần đuôi giúp thao tác vặn ốc bằng một tay trở nên nhanh chóng và chuyên nghiệp hơn bao giờ hết!',
    },
    {
      title: 'Trải nghiệm quạt tích điện để bàn siêu êm',
      theme: 'Quạt tích điện để bàn động cơ không chổi than Brushless, 4 cấp độ gió thoang thoảng êm ru dưới 20dB, pin 8000mAh dùng 24 tiếng.',
      script:
        'Cứu tinh cho những buổi trưa hè oi bức hoặc những ngày bất ngờ bị cắt điện luân phiên tại văn phòng làm việc.\n\n' +
        'Trang bị động cơ không chổi than thế hệ mới kết hợp cùng cánh quạt khí động học: luồng gió thổi ra êm ái, mát sâu và hoàn toàn không phát ra tiếng ồn khó chịu.\n\n' +
        'Độ ồn đo được dưới 20 Decibel — yên tĩnh tuyệt đối để bạn có thể đặt ngay đầu giường ngủ mà không làm ảnh hưởng đến giấc ngủ của em bé.\n\n' +
        'Dung lượng pin khủng 8000mAh cho thời gian sử dụng liên tục suốt 24 tiếng chỉ sau một lần sạc đầy, có thể xoay góc 90 độ linh hoạt!',
    },
    {
      title: 'Test sạc dự phòng không dây từ tính MagSafe',
      theme: 'Hít chặt vào mặt lưng iPhone bằng lực từ tính nam châm 10N, sạc không dây 15W kiêm giá đỡ điện thoại xem phim tiện lợi.',
      script:
        'Chiếc pin sạc dự phòng nhỏ gọn thông minh sinh ra để giải phóng bạn khỏi mớ dây cáp sạc lằng nhằng vướng víu mỗi khi ra đường.\n\n' +
        'Vòng nam châm từ tính MagSafe lực hút cực mạnh hít chặt vào mặt lưng điện thoại chỉ bằng một cú chạm \'tách\' chuẩn xác không sợ rơi rớt.\n\n' +
        'Công nghệ sạc nhanh không dây chuẩn Qi công suất 15W sạc pin liên tục trong khi bạn vẫn có thể cầm điện thoại lướt web hay chơi game thoải mái bằng một tay.\n\n' +
        'Phần mặt lưng tích hợp chân chống gập mở thông minh biến cục sạc thành một chiếc giá đỡ điện thoại tiện lợi để xem phim trên bàn làm việc!',
    },
    {
      title: 'Đập hộp máy tỉa lông mũi và cạo râu mini',
      theme: 'Máy cạo râu và tỉa lông mũi 2 trong 1 nhỏ bằng thỏi son, lưỡi dao xoay 360 độ an toàn không kéo giật lông, rửa nước tiện lợi.',
      script:
        'Món đồ chăm sóc diện mạo cá nhân bỏ túi áo không thể thiếu của các quý ông hiện đại chỉn chu và lịch thiệp.\n\n' +
        'Kích thước siêu nhỏ gọn chỉ bằng một thỏi son với vỏ nhôm mạ crom bóng bẩy, sạc pin Type-C dùng thoải mái suốt cả tháng trời.\n\n' +
        'Đầu dao tỉa lông mũi thiết kế vòm tròn bảo vệ khoang mũi: lưỡi dao xoay 360 độ cắt tỉa gọn gàng sạch sẽ mà tuyệt đối không gây đau rát hay giật sợi lông.\n\n' +
        'Đầu cạo râu mini thay thế linh hoạt giúp bạn tút lại vẻ ngoài chỉn chu trước mỗi cuộc hẹn hay buổi phỏng vấn quan trọng chỉ trong 1 phút!',
    },
    {
      title: 'Trình diễn giá treo tai nghe tích hợp sạc không dây',
      theme: 'Chân đế giá treo tai nghe bằng kim loại tích hợp bàn sạc không dây chuẩn Qi sạc đồng thời smartphone và tai nghe Airpods.',
      script:
        'Giải pháp 2 trong 1 hoàn hảo vừa giúp bàn làm việc gọn gàng vừa đóng vai trò như một trạm sạc năng lượng không dây thông minh.\n\n' +
        'Phần thân kim loại vững chãi nâng đỡ chiếc tai nghe chụp tai cao cấp ở vị trí trang trọng và thuận tiện nhất khi cần sử dụng.\n\n' +
        'Phần chân đế bọc da cao cấp tích hợp cuộn cảm sạc không dây thông minh: chỉ cần đặt điện thoại hoặc hộp tai nghe AirPods lên là pin tự động nạp điện.\n\n' +
        'Đèn LED chỉ báo trạng thái sạc dịu nhẹ tinh tế, món quà tuyệt vời dành tặng cho những người yêu thích sự ngăn nắp và công nghệ hiện đại!',
    },
  ],

  // 9. Template: anim_3d (20 mục)
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
    {
      title: 'Quả cầu tuyết ma thuật lưu giữ mùa đông',
      theme: 'Khối cầu thủy tinh tròn trịa phát sáng ánh bạc, bên trong là ngôi làng cổ tích phủ tuyết trắng và chú người tuyết biết vẫy tay chào.',
      script:
        'Nằm trên chiếc kệ gỗ cũ kỹ nơi góc phòng là một quả cầu tuyết ma thuật lưu giữ mùa đông vĩnh cửu của thế giới cổ tích.\n\n' +
        'Mỗi khi bạn khẽ lắc nhẹ quả cầu, hàng ngàn hạt tuyết lấp lánh ánh kim sa lại bồng bềnh bay lượn quanh những mái nhà ngói đỏ phủ sương giá.\n\n' +
        'Chú người tuyết mũi cà rốt bên trong bỗng chớp mắt mỉm cười và vẫy tay chào người bạn nhỏ ngoài ô kính trong suốt.\n\n' +
        'Một thế giới ấm áp và diệu kỳ nơi những ước mơ ngây thơ của tuổi thơ không bao giờ tàn phai.',
    },
    {
      title: 'Cuộc đào tẩu ngọt ngào của chú gấu kẹo dẻo',
      theme: 'Chú gấu kẹo dẻo màu hồng ngọc trong suốt, nhảy nhót qua những thanh chocolate và dòng sông sữa tươi béo ngậy để tìm về tự do.',
      script:
        'Trong vương quốc bánh kẹo ngọt ngào, có một chú gấu kẹo dẻo màu hồng luôn khao khát được nhìn thấy bầu trời thực sự bên ngoài chiếc lọ thủy tinh.\n\n' +
        'Một đêm nọ, khi người thợ làm bánh đã ngủ say, chú khẽ nhón chân bật nắp lọ và bắt đầu cuộc đào tẩu ly kỳ nhất lịch sử đồ ngọt.\n\n' +
        'Nhảy lò cò qua những dãy núi bánh quy giòn rụm, trượt ván trên thanh chocolate đen và lướt qua dòng sông sữa dâu ngọt ngào.\n\n' +
        'Lòng dũng cảm và tinh thần tự do có thể đưa bất kỳ ai vượt qua mọi thử thách ngọt ngào nhất của cuộc đời!',
    },
    {
      title: 'Hành tinh tí hon trong chiếc lọ thủy tinh',
      theme: 'Một tiểu hành tinh xanh mướt trôi lơ lửng trong chiếc lọ phát quang, có dòng suối nhỏ, cây thần thụ và những đốm đom đóm dạ quang.',
      script:
        'Bạn có tin rằng mỗi ý tưởng sáng tạo trong đầu chúng ta đều là một tiểu hành tinh đang chờ được đánh thức không?\n\n' +
        'Bên trong chiếc lọ thủy tinh phát quang này là một thế giới thu nhỏ với dòng thác bạc chảy ngược lên trời và thung lũng cỏ đổi màu theo nhịp nhạc.\n\n' +
        'Những chú đom đóm dạ quang bay lượn thắp sáng cành lá của cây thần thụ ngàn năm tuổi giữa đêm trăng huyền ảo.\n\n' +
        'Hãy luôn nuôi dưỡng trí tưởng tượng của mình, vì đó là chiếc chìa khóa mở ra những vũ trụ kỳ diệu nhất!',
    },
    {
      title: 'Chú khủng long con tập bay cùng đàn chim sẻ',
      theme: 'Khủng long bạo chúa tí hon tròn trĩnh gắn đôi cánh lá chuối nhảy nhót trên đồi hoa hướng dương rực rỡ nắng ấm.',
      script:
        'Ai bảo rằng khủng long thì chỉ biết gầm gừ và bước đi nặng nề trên mặt đất?\n\n' +
        'Chú khủng long con có thân hình tròn xoe như quả bóng này lại mang trong mình ước mơ cháy bỏng được sải cánh bay lượn giữa bầu trời xanh biếc.\n\n' +
        'Chú tự tết cho mình đôi cánh bằng lá chuối rừng, leo lên đỉnh ngọn đồi hoa hướng dương và dang rộng đôi tay đón lấy ngọn gió sớm.\n\n' +
        'Dù có ngã nhào xuống thảm cỏ êm ái hàng trăm lần, nụ cười rạng rỡ và niềm tin ngây thơ của chú chưa bao giờ tắt!',
    },
    {
      title: 'Nhà máy sản xuất những giấc mơ diệu kỳ',
      theme: 'Những cỗ máy hơi nước đồng thau ngộ nghĩnh thổi ra những bong bóng xà phòng ngũ sắc chứa đựng giấc mơ ngọt ngào của trẻ thơ.',
      script:
        'Khi màn đêm buông xuống và những đứa trẻ bắt đầu nhắm mắt ngủ say, nhà máy giấc mơ trên tầng mây lại rộn rã bước vào ca làm việc.\n\n' +
        'Những bánh răng đồng thau quay tròn nhịp nhàng, ống khói hơi nước thổi ra hàng vạn quả bong bóng xà phòng ngũ sắc lấp lánh ánh sao.\n\n' +
        'Mỗi quả bong bóng chứa đựng một chuyến phiêu lưu kỳ thú: bay cùng cá voi trên trời, làm thuyền trưởng tàu cướp biển hay lạc vào xứ sở kẹo bông gòn.\n\n' +
        'Chúc bạn có một giấc ngủ thật ngon và gặp được giấc mơ ngọt ngào nhất đêm nay nhé!',
    },
    {
      title: 'Chiếc bóng đèn thắp sáng ý tưởng tương lai',
      theme: 'Bóng đèn dây tóc cổ điển bỗng mọc ra đôi mắt to tròn long lanh, bật sáng rực rỡ khi tìm thấy mảnh ghép giải pháp sáng tạo.',
      script:
        'Nằm lẻ loi trong ngăn kéo bàn làm việc cũ kỹ, chiếc bóng đèn dây tóc nhỏ luôn tự hỏi sứ mệnh thực sự của mình là gì.\n\n' +
        'Cho đến một ngày nọ, khi người kỹ sư trẻ đang vò đầu bứt tai trước bản vẽ thiết kế bế tắc, bóng đèn khẽ cựa mình và phát ra một tia sáng vàng ấm áp.\n\n' +
        'Một ý tưởng đột phá bùng nổ, sợi dây tóc vonfram bên trong sáng rực rỡ thắp sáng cả căn phòng tối tăm.\n\n' +
        'Đôi khi chỉ cần một khoảnh khắc kiên trì, tia sáng trí tuệ sẽ bừng nở và thay đổi cả thế giới xung quanh bạn!',
    },
    {
      title: 'Chú ốc sên can đảm băng qua khu vườn khổng lồ',
      theme: 'Ốc sên mang chiếc vỏ ốc xoắn ốc vẽ hoa văn cầu vồng, cõng trên lưng bông hoa bồ công anh vượt qua con đường sỏi đá gập ghềnh.',
      script:
        'Đối với một chú ốc sên bé nhỏ, khu vườn sau nhà rộng lớn và hiểm trở chẳng khác nào một lục địa hoang vu bí ẩn.\n\n' +
        'Nhưng mang trên lưng bông hoa bồ công anh vàng ươm gửi tặng người bạn bên kia bờ suối, chú chưa từng một lần nghĩ đến việc bỏ cuộc.\n\n' +
        'Chầm chậm bò qua từng viên sỏi gồ ghề, khéo léo né tránh những giọt sương mai trĩu nặng trên phiến lá môn khổng lồ.\n\n' +
        'Đi chậm không quan trọng, miễn là bạn không bao giờ dừng lại trên con đường hướng tới mục tiêu của mình!',
    },
    {
      title: 'Chuyến du hành của chú cá voi bay qua dải ngân hà',
      theme: 'Chú cá voi lưng gù khổng lồ phát sáng màu xanh lam bồng bềnh bơi lội giữa các vành đai hành tinh và những cơn mưa sao băng rực rỡ.',
      script:
        'Bơi lượn giữa đại dương vũ trụ bao la thăm thẳm, chú cá voi khổng lồ mang trên lưng cả một thành phố ánh sáng thần tiên kỳ ảo.\n\n' +
        'Từng nhịp vẫy đuôi mềm mại tạo ra những làn sóng năng lượng lấp lánh ánh kim sa đẩy chiếc phi thuyền nhỏ lướt qua các vành đai sao Thổ rực rỡ.\n\n' +
        'Những cơn mưa sao băng vụt sáng chói lòa trên nền trời nhung đen huyền bí, hòa cùng tiếng hát ngân vang trầm bổng của loài cá voi đại dương vũ trụ.\n\n' +
        'Một thước phim hoạt hình 3D choáng ngợp đưa trí tưởng tượng của bạn bay xa tới những chân trời kỳ diệu nhất của vũ trụ bao la.',
    },
    {
      title: 'Chiếc đồng hồ thần kỳ đóng băng thời gian',
      theme: 'Chú bé nghịch ngợm bấm nút chiếc đồng hồ quả quýt cổ, giọt nước mưa lơ lửng giữa không trung, chú chim dừng cánh bay giữa trời.',
      script:
        'Tình cờ tìm thấy chiếc đồng hồ quả quýt bằng đồng trong căn hầm bí mật của người ông là một nhà phát minh lập dị.\n\n' +
        'Khi cậu bé ấn mạnh vào nút vặn trên đỉnh, một luồng sóng chấn động màu vàng kim bỗng lan tỏa ra khắp không gian xung quanh.\n\n' +
        'Mọi chuyển động của thế giới bỗng chốc ngưng đọng lại hoàn toàn: giọt nước mưa dừng lơ lửng giữa không trung, chú chim sẻ dừng cánh giữa tầng không.\n\n' +
        'Cậu bé thích thú bước đi giữa thế giới thời gian đóng băng để khám phá những bí mật thú vị mà mắt thường không bao giờ kịp nhìn thấy!',
    },
    {
      title: 'Ngôi trường phép thuật của các chú cú mèo',
      theme: 'Lớp học phép thuật trong hốc cây sồi khổng lồ, những chú cú mèo đeo kính tròn học cách điều khiển đũa phép thắp sáng quả cầu pha lê.',
      script:
        'Sâu trong khu rừng rậm thần tiên, ngôi trường đào tạo pháp sư cú mèo cổ kính bắt đầu bước vào tiết học phép thuật đầu tiên lúc nửa đêm.\n\n' +
        'Những chú cú mèo nhỏ với đôi mắt tròn xoe long lanh đeo cặp kính cận tròn trịa, chăm chú lắng nghe thầy giáo già râu tóc bạc phơ giảng bài.\n\n' +
        'Vung nhẹ chiếc đũa phép bằng cành cây ngải cứu, một tia sáng màu tím nhảy múa trên đầu đũa thắp sáng quả cầu pha lê tri thức giữa lớp học.\n\n' +
        'Nơi tri thức và sự tò mò trẻ thơ được ươm mầm để trở thành những người bảo vệ thông thái của muôn loài rừng xanh.',
    },
    {
      title: 'Cuộc phiêu lưu của chú ếch nhỏ tìm hồ nước thần',
      theme: 'Chú ếch xanh tròn trĩnh mang ba lô hạt dẻ, nhảy qua những chiếc nấm khổng lồ và kết bạn cùng chú chuồn chuồn kim dẫn đường.',
      script:
        'Mang trên lưng chiếc ba lô đan bằng vỏ hạt dẻ nhỏ xinh, chú ếch xanh can đảm rời bỏ vũng nước quen thuộc để lên đường tìm kiếm hồ nước thần thoại.\n\n' +
        'Nhảy lò cò qua những chiếc nấm phát quang khổng lồ trong đêm trăng, khéo léo né tránh những giọt sương đêm trĩu nặng trên phiến lá dương xỉ.\n\n' +
        'Đồng hành cùng chú là người bạn chuồn chuồn kim lấp lánh đôi cánh ngọc bích bay lượn dẫn đường qua những hẻm đá rêu phong kỳ bí.\n\n' +
        'Hành trình khám phá thế giới rộng lớn dạy cho chú ếch bài học sâu sắc về tình bạn và lòng kiên định không bao giờ lùi bước.',
    },
    {
      title: 'Cửa hàng bán ký ức ngọt ngào trong hẻm sao băng',
      theme: 'Căn tiệm thủy tinh lơ lửng giữa các vì sao, những chiếc lọ phát sáng chứa đựng tiếng cười trẻ thơ và mùi hương bánh ngọt của mẹ.',
      script:
        'Nằm ở góc khuất của con ngõ sao băng lấp lánh ánh kim là một cửa tiệm nhỏ chuyên thu thập và bảo tồn những ký ức ngọt ngào nhất của nhân loại.\n\n' +
        'Trên các kệ gỗ thông bồng bềnh là hàng ngàn chiếc lọ thủy tinh phát quang chứa đựng những khoảnh khắc hạnh phúc vô giá: cái ôm ấm áp của mẹ ngày đầu tiên đến trường.\n\n' +
        'Tiếng cười giòn tan của đám bạn thân dưới cơn mưa rào mùa hạ, hay nụ hôn ngượng ngùng đầu tiên dưới bầu trời đầy sao lấp lánh.\n\n' +
        'Mỗi khi bạn cảm thấy buồn phiền, chỉ cần ghé tiệm mở một chiếc lọ ký ức ra, hương thơm ngọt ngào sẽ sưởi ấm lại trái tim bạn!',
    },
    {
      title: 'Chú thỏ phi hành gia thám hiểm Mặt Trăng',
      theme: 'Thỏ trắng mặc bộ đồ phi hành gia tròn xoe mũ kính cầu vồng, cắm củ cà rốt phát sáng trên miệng núi lửa Mặt Trăng đầy sao.',
      script:
        'Hiện thực hóa giấc mơ ngàn năm của loài thỏ ngọc trong truyện cổ tích dân gian bằng công nghệ phi hành vũ trụ hiện đại.\n\n' +
        'Chú thỏ trắng trong bộ đồ phi hành gia tròn xoe như một quả bóng tuyết bước những bước nhảy không trọng lượng bồng bềnh trên bề mặt Mặt Trăng.\n\n' +
        'Chiếc mũ bảo hiểm trong suốt phản chiếu hình ảnh Trái Đất màu xanh lam tuyệt đẹp đang lơ lửng quay tròn giữa biển sao bao la.\n\n' +
        'Tự hào cắm một biểu tượng củ cà rốt phát quang rực rỡ lên đỉnh ngọn đồi đá Mặt Trăng đánh dấu một bước nhảy vọt vĩ đại của loài thỏ thám hiểm!',
    },
    {
      title: 'Chiếc ô kỳ diệu có thể bay như khinh khí cầu',
      theme: 'Cô bé cầm chiếc ô kẻ caro màu đỏ bay lơ lửng trên những mái nhà thành phố London cổ kính trong buổi chiều hoàng hôn rực rỡ.',
      script:
        'Một buổi chiều lộng gió, cô bé nhỏ mở bung chiếc ô kẻ caro màu đỏ rực rỡ vừa nhặt được ngoài vườn hoa công viên.\n\n' +
        'Bất ngờ một ngọn gió thần kỳ nâng bổng chiếc ô lên không trung, đưa cô bé bay lơ lửng chầm chậm qua những mái nhà ngói đỏ cổ kính của thành phố.\n\n' +
        'Nhìn xuống dòng xe cộ tí hon ngược xuôi và những đàn bồ câu trắng đang chao lượn quanh những tháp chuông đồng hồ cổ kính.\n\n' +
        'Cảm giác tự do bay lượn giữa những đám mây bồng bềnh như mật ngọt, mở ra một thế giới diệu kỳ của những ước mơ tuổi thơ không giới hạn.',
    },
    {
      title: 'Đội cứu hộ tí hon sửa chữa cầu vồng sau mưa',
      theme: 'Những chú lùn tí hon mặc áo bảo hộ ngũ sắc dùng chổi cọ quét sơn màu lại cho dải cầu vồng bị trôi màu sau cơn mưa giông lớn.',
      script:
        'Sau cơn mưa giông dữ dội làm dải cầu vồng trên trời bị trôi mất vài vệt màu sắc rực rỡ, đội cứu hộ tí hon lập tức xuất quân.\n\n' +
        'Những chú thợ lùn đáng yêu trong bộ trang phục bảo hộ đầy màu sắc đeo dây an toàn đu mình trên những đám mây trắng êm ái.\n\n' +
        'Cầm những chiếc chổi quét sơn khổng lồ cẩn thận tô dặm lại từng dải màu: Đỏ rực rỡ, Vàng óng ả, Lam thanh khiết và Tím mộng mơ.\n\n' +
        'Khi vệt sơn cuối cùng hoàn thành, chiếc cầu vồng lại bừng sáng lung linh trên nền trời xanh biếc mang lại nụ cười rạng rỡ cho muôn loài!',
    },
    {
      title: 'Khám phá khu rừng pha lê phát sáng dưới lòng đất',
      theme: 'Đoàn thám hiểm tí hon chèo thuyền lá qua dòng sông phát quang ngầm, xung quanh là những khối thạch anh pha lê khổng lồ tỏa sáng.',
      script:
        'Ẩn sâu hàng ngàn mét dưới lòng đất là một khu rừng địa chất kỳ quan được tạo nên hoàn toàn từ những khối tinh thể pha lê khổng lồ.\n\n' +
        'Chiếc thuyền lá nhỏ lướt êm đềm trên dòng nước ngầm trong suốt phát ra ánh sáng dạ quang màu xanh ngọc bích huyền ảo.\n\n' +
        'Những cột thạch anh tím và thạch anh vàng cao vút chạm trần hang động như những cung điện nguy nga của các vị thần lòng đất.\n\n' +
        'Âm thanh giọt nước nhỏ tong tong vang vọng như những tiếng chuông gió pha lê ngân nga giữa không gian kỳ vĩ và tĩnh lặng tuyệt đối.',
    },
    {
      title: 'Chú chim cánh cụt tập lướt sóng ở vùng biển nhiệt đới',
      theme: 'Chú chim cánh cụt mặc quần hoa sặc sỡ đeo kính râm, ôm ván lướt sóng cưỡi trên ngọn sóng biển Hawaii nhiệt đới đầy nắng ấm.',
      script:
        'Quá chán ngấy cái lạnh âm 50 độ C và băng tuyết trắng xóa của vùng Nam Cực buốt giá, chú chim cánh cụt quyết định làm một chuyến du ngoạn để đời.\n\n' +
        'Khoác lên mình chiếc quần đùi hoa sặc sỡ và chiếc kính râm thời thượng, chú ôm chiếc ván lướt sóng vàng rực phi thẳng đến bãi biển Hawaii đầy nắng ấm.\n\n' +
        'Khéo léo giữ thăng bằng lướt trên đỉnh những con sóng cuộn trào tung bọt trắng xóa trong sự trầm trồ thán phục của đàn rùa biển nhiệt đới.\n\n' +
        'Dám bước ra khỏi vùng an toàn lạnh giá để trải nghiệm những điều mới mẻ và rực rỡ nhất của cuộc sống muôn màu!',
    },
  ],

  // 10. Template: portrait_story (20 mục)
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
    {
      title: 'Chuyến tàu đêm chở những giấc mơ xa xứ',
      theme: 'Ánh đèn vàng vọt toa tàu đêm, hành khách tựa đầu vào cửa kính ngắm bóng đêm trôi qua, chiếc vali sờn góc ôm trọn hoài bão tuổi trẻ.',
      script:
        'Tiếng còi tàu xé toang màn đêm tĩnh mịch, đưa đoàn tàu hỏa rời ga lao vút vào bóng tối mênh mông.\n\n' +
        'Trong khoang ghế ngồi mềm ánh đèn vàng vọt, những người trẻ tựa đầu vào ô cửa kính ướt sương đêm ngắm nhìn ánh đèn thành phố dần lùi xa.\n\n' +
        'Chiếc vali cũ sờn góc chứa đựng vài bộ quần áo giản dị và một trái tim rực cháy khát vọng lập nghiệp nơi xứ người.\n\n' +
        'Có những cuộc chia ly trong im lặng, để một ngày trở về với vinh quang và nụ cười rạng rỡ của sự trưởng thành.',
    },
    {
      title: 'Bức thư tay chưa kịp gửi người năm ấy',
      theme: 'Trang giấy học trò ố vàng nét mực tím, cánh phượng khô ép trong trang sách cũ và nỗi niềm thanh xuân dang dở bên khung cửa sổ.',
      script:
        'Tình cờ lật lại cuốn lưu bút thời áo trắng, một phong thư gấp hình cánh bướm ố vàng bỗng rơi ra chạm khẽ xuống mặt sàn gỗ.\n\n' +
        'Nét mực tím nắn nót viết dở lời tỏ tình vụng về của mùa hè năm mười bảy tuổi chưa từng có can đảm trao tận tay người ấy.\n\n' +
        'Cánh hoa phượng khô đỏ thắm ép chặt giữa trang giấy như phong ấn lại toàn bộ sự ngây ngô và trong sáng nhất của một thời thanh xuân.\n\n' +
        'Có những tình cảm đẹp đẽ nhất chính là những tình cảm dở dang, để ta nhớ mãi một thời đã từng yêu chân thành đến thế.',
    },
    {
      title: 'Lời hứa dưới gốc cây cổ thụ đầu làng',
      theme: 'Bóng cây đa cổ thụ xum xuê râm mát, hai đứa trẻ ngoéo tay hẹn ước ngày gặp lại giữa chiều hè rực rỡ tiếng ve kêu.',
      script:
        'Dưới bóng mát xum xuê của cây đa ngàn năm tuổi sừng sững đầu làng, hai đứa trẻ thôn quê từng ngoéo tay thề ước.\n\n' +
        '\'Sau này lớn lên, dù có đi xa đến chân trời góc bể nào, chúng mình cũng nhất định sẽ quay về gặp lại nhau dưới gốc cây này nhé!\'\n\n' +
        'Năm tháng thoi đưa, đứa trẻ năm xưa nay đã thành người đàn ông mái tóc pha sương sau bao thăng trầm dâu bể của cuộc đời.\n\n' +
        'Trở về đứng dưới tán cây xưa, gió vẫn reo vi vu qua kẽ lá, nhưng bóng hình người bạn thuở ấu thơ nay đã phiêu dạt phương trời nao.',
    },
    {
      title: 'Hành trình hạt mầm vươn lên qua kẽ đá',
      theme: 'Khối đá xám xịt nứt toác, một mầm cây non xanh biếc kiên cường đón ánh nắng ban mai đầu tiên sau những ngày giông bão.',
      script:
        'Bị vùi lấp sâu trong bóng tối lạnh lẽo của khe nứt vách đá cằn cỗi, hạt mầm bé nhỏ chưa từng một giây đầu hàng số phận.\n\n' +
        'Âm thầm chắt chiu từng giọt sương mai hiếm hoi và chất dinh dưỡng ít ỏi từ hạt bụi đất trôi theo dòng nước mưa.\n\n' +
        'Bằng sức sống mãnh liệt đến phi thường, mầm non đội đá nhô lên, bung nở hai phiến lá xanh mướt kiêu hãnh vươn mình đón vạt nắng ấm bình minh.\n\n' +
        'Nghịch cảnh không thể chôn vùi bạn, trừ khi bạn tự mình buông xuôi ý chí vươn lên!',
    },
    {
      title: 'Người thợ đồng hồ già lưu giữ thời gian',
      theme: 'Căn tiệm sửa đồng hồ nhỏ ven đường, người thợ già đeo kính lúp chăm chú chỉnh sửa từng bánh răng cơ khí tinh vi dưới ánh đèn vàng.',
      script:
        'Giữa góc phố hiện đại nhộn nhịp, căn tiệm nhỏ của ông giáo già sửa đồng hồ vẫn lặng lẽ tồn tại như một ốc đảo thời gian.\n\n' +
        'Đeo chiếc kính lúp chuyên dụng vào mắt, đôi bàn tay gầy gò nhăn nheo cẩn trọng gắp từng bánh răng tí hon lắp vào bộ máy cơ khí phức tạp.\n\n' +
        'Tiếng tích tắc tích tắc vang lên đều đặn nhịp nhàng như nhịp đập trái tim của những cỗ máy lưu giữ ký ức qua nhiều thế hệ.\n\n' +
        '\'Người ta sửa đồng hồ không chỉ để xem giờ, mà là để giữ lại những kỷ niệm vô giá gắn liền với người đã trao tặng nó.\'',
    },
    {
      title: 'Chú chó trung thành chờ chủ bên bến đò',
      theme: 'Bến đò quê chiều tà sông nước mênh mông, chú chó vàng ngồi bất động ngóng nhìn con thuyền cập bến trong ánh mắt chờ mong.',
      script:
        'Chiều nào cũng vậy, khi ánh hoàng hôn đỏ quạch buông xuống dòng sông quê phẳng lặng, chú chó vàng lại lầm lũi đi ra mỏm đất đầu bến đò.\n\n' +
        'Ngồi bất động hàng giờ liền hướng ánh mắt ngóng trông về phía những chuyến đò ngang chở khách qua sông trở về làng.\n\n' +
        'Dù người chủ thân yêu đã đi xa mãi mãi không về sau một chuyến công tác dài ngày, lòng trung thành thuần khiết của chú vẫn vẹn nguyên như thuở ban đầu.\n\n' +
        'Tình yêu thương của loài vật đôi khi sâu đậm và thủy chung hơn bất kỳ lời ước hẹn trần gian nào.',
    },
    {
      title: 'Chiếc áo len đan dở của mẹ mùa đông',
      theme: 'Đôi bàn tay gầy guộc thoăn thoắt đan que len bên bếp lửa bập bùng, cuộn len đỏ ấm áp sưởi ấm căn nhà tranh ngày đông buốt giá.',
      script:
        'Cứ mỗi độ gió mùa đông bắc tràn về làm lạnh buốt từng ngón tay, mẹ lại ngồi nép mình bên bậu cửa sổ đan áo len cho con.\n\n' +
        'Từng que đan tre gõ vào nhau lách cách đều đặn, gửi gắm vào từng mắt len tất cả tình yêu thương và sự hy sinh thầm lặng của cả đời người mẹ.\n\n' +
        'Chiếc áo len màu đỏ rực rỡ dẫu có vài chỗ chưa thẳng hàng nhưng mặc vào lại ấm áp lạ kỳ xua tan đi mọi cơn gió lạnh thấu xương.\n\n' +
        'Đi hết cuộc đời này, không có tấm chăn nào ấm áp bằng vòng tay chở che bao la của mẹ.',
    },
    {
      title: 'Tiếng đàn vĩ cầm nơi ga tàu vắng',
      theme: 'Sân ga tàu điện ngầm đêm muộn, người nghệ sĩ đường phố kéo bản nhạc vĩ cầm du dương tha thiết xua tan nỗi cô đơn của những kẻ hồi hương.',
      script:
        'Ga tàu điện ngầm lúc nửa đêm vắng tanh không một bóng người qua lại, chỉ còn lại tiếng vọng của những bước chân mỏi mệt sau ngày dài.\n\n' +
        'Bỗng nhiên, một giai điệu vĩ cầm tha thiết vang lên từ phía chân cầu thang, lan tỏa sự ấm áp lạ kỳ vào bầu không khí lạnh lẽo.\n\n' +
        'Người nghệ sĩ đường phố nhắm nghiền đôi mắt, kéo từng nốt nhạc da diết như đang kể lại câu chuyện về những hoài bão và tình yêu chưa trọn vẹn.\n\n' +
        'Một khúc ca bất chợt làm bước chân của những kẻ tha hương bỗng chậm lại, mỉm cười lau đi giọt nước mắt lăn dài trên má.',
    },
    {
      title: 'Bức ảnh chân dung người cha gánh than nuôi con',
      theme: 'Gương mặt người cha lấm lem bụi than đen thẫm, ánh mắt kiên nghị sáng ngời và nụ cười rạng rỡ cầm tờ giấy khen học sinh giỏi của con.',
      script:
        'Khuôn mặt đen nhẻm bụi than đá chỉ để lộ hai con mắt sáng quắc và hàm răng trắng ngần nở nụ cười rạng rỡ nhất trần đời.\n\n' +
        'Đôi bàn tay nứt nẻ rớm máu vì những chuyến gánh than nặng trĩu từ lòng mỏ sâu hun hút cẩn thận nâng niu tấm giấy khen của cô con gái nhỏ.\n\n' +
        '\'Bố cực khổ vất vả thế nào cũng chịu được, chỉ mong các con học hành thành tài để không phải bước chân vào hầm lò nhọc nhằn như bố.\'\n\n' +
        'Tình yêu thương bao la và đức hy sinh thầm lặng của người cha là bệ phóng vững chắc nhất nâng cánh cho những ước mơ của con bay xa.',
    },
    {
      title: 'Lời xin lỗi muộn màng của người con trai',
      theme: 'Người đàn ông trung niên quỳ trước ngôi mộ mẹ phủ cỏ xanh rì, chiếc áo len mẹ đan ngày xưa ôm chặt trong lồng ngực đẫm nước mắt.',
      script:
        'Thời trẻ nông nổi vì mải mê đuổi theo những cuộc vui phù phiếm và danh vọng ảo ảnh ngoài xã hội, anh đã từng buông những lời gắt gỏng làm tan nát trái tim mẹ.\n\n' +
        'Đến khi nhận ra gia đình mới là điều quý giá nhất thì mẹ đã lặng lẽ ra đi sau một cơn bạo bệnh tuổi già.\n\n' +
        'Quỳ gối trước nấm mồ phủ xanh cỏ dại, ôm chặt chiếc áo len mẹ từng thức trắng đêm đan cho ngày đông giá rét trong tiếng nấc nghẹn ngào muộn màng.\n\n' +
        'Hãy yêu thương và quan tâm đến cha mẹ ngay khi còn có thể, vì cuộc đời này không có cơ hội thứ hai cho những ân hận muộn màng.',
    },
    {
      title: 'Người lính cứu hỏa kiệt sức sau trận chiến lửa tàn',
      theme: 'Bộ quân phục phòng cháy chữa cháy cháy sém khói bụi, người lính trẻ ngồi bệt xuống vỉa hè tu ừng ực chai nước lọc sau khi cứu sống em bé.',
      script:
        'Sau 6 tiếng kiên cường vật lộn với biển lửa ngùn ngụt khói độc trong căn nhà cao tầng đổ sập, đám cháy cuối cùng cũng được khống chế hoàn toàn.\n\n' +
        'Người lính cứu hỏa trẻ với bộ quân phục cháy sém đen nhẻm ngồi bệt xuống lề đường, ngửa cổ tu ừng ực chai nước lọc mát lành trong sự kiệt sức cùng cực.\n\n' +
        'Đôi mắt đỏ hoe vì khói cay nhưng ánh lên niềm hạnh phúc vô bờ khi nhìn thấy em bé nhỏ vừa được anh ôm trong ngực lao ra khỏi biển lửa đang an toàn trong vòng tay mẹ.\n\n' +
        'Những người hùng bằng xương bằng thịt sẵn sàng đặt tính mạng của mình vào lằn ranh sinh tử vì sự bình yên của nhân dân.',
    },
    {
      title: 'Nụ cười rạng rỡ của cụ bà 90 tuổi bên vườn hoa',
      theme: 'Khuôn mặt phúc hậu ngập tràn nếp nhăn thời gian của cụ bà tóc bạc phơ, đôi tay run rẩy tưới từng đóa hoa hồng nhung rực rỡ nắng ấm.',
      script:
        'Ở tuổi chín mươi của cuộc đời, niềm vui mỗi sớm mai của cụ bà là được chống gậy bước ra khoảng vườn nhỏ tự tay tưới tắm cho những khóm hoa hồng nhung.\n\n' +
        'Khuôn mặt phúc hậu in hằn những nếp nhăn thời gian như những thớ gỗ quý, nhưng đôi mắt cụ vẫn ánh lên sự tinh anh và nụ cười ấm áp như nắng mùa thu.\n\n' +
        '\'Sống đến tuổi này rồi mới thấy, cuộc đời này quý giá nhất là sự thanh thản trong tâm hồn và được nhìn thấy con cháu khỏe mạnh sum vầy.\'\n\n' +
        'Một vẻ đẹp lão niên viên mãn và an yên, lan tỏa nguồn năng lượng bình an dịu dàng đến tất cả những người xung quanh.',
    },
    {
      title: 'Cô bé bán vé số ôm chú mèo hoang sưởi ấm',
      theme: 'Góc hiên chùa đêm mưa lạnh buốt, cô bé phong phanh áo manh ôm chặt chú mèo con lông xơ xác chia nhau mẩu bánh mì khô.',
      script:
        'Dưới mái hiên chùa cổ kính trong đêm đông mưa phùn lạnh thấu xương, cô bé bán vé số nhỏ ngồi co ro trong chiếc áo gió sờn rách.\n\n' +
        'Trong lồng ngực gầy guộc của em là một chú mèo hoang bé bỏng ướt sũng vừa được em nhặt về từ bên miệng cống ngập nước.\n\n' +
        'Em cẩn thận bẻ đôi mẩu bánh mì khô khốc còn sót lại sau bữa tối, chia cho người bạn bốn chân nhỏ một nửa trong nụ cười hồn nhiên ấm áp.\n\n' +
        'Ngay cả trong tận cùng của sự nghèo khó và thiếu thốn, lòng trắc ẩn và sự lương thiện của con người vẫn tỏa sáng lấp lánh như những vì sao.',
    },
    {
      title: 'Bàn tay người nghệ sĩ điêu khắc tượng gỗ',
      theme: 'Đôi bàn tay gân guốc cầm chiếc đục gỗ sắc bén, từng dăm gỗ bay lượn dưới nhát búa nhịp nhàng làm hiện hình pho tượng Phật từ bi thanh tịnh.',
      script:
        'Cả cuộc đời gắn bó với khúc gỗ mộc mạc và chiếc đục sắt gỉ sét, bác nghệ nhân già đã thổi linh hồn vào hàng ngàn pho tượng gỗ vô tri.\n\n' +
        'Từng nhát búa gõ đục nhịp nhàng dứt khoát, từng dăm gỗ thơm bay lượn trong không gian bụi mờ dưới vệt nắng ban mai rọi qua mái ngói.\n\n' +
        'Gương mặt Đức Phật từ bi với nụ cười hỷ xả dần dần hiện hình từ thân gỗ xù xì qua sự khổ luyện và cái tâm thanh tịnh của người thợ tài hoa.\n\n' +
        'Nghệ thuật chân chính là sự kết tinh hoàn mỹ giữa kỹ năng điêu luyện và chiều sâu tâm linh hướng thiện của con người.',
    },
    {
      title: 'Người gác rừng già canh giữ những cây sưa cổ',
      theme: 'Bác kiểm lâm già khoác ba lô rêu phong sải bước tuần tra giữa rừng già nguyên sinh, bàn tay vuốt ve thân cây cổ thụ nghìn năm tuổi.',
      script:
        'Hơn ba mươi năm gắn bó cả cuộc đời với những cánh rừng nguyên sinh bạt ngàn giáp biên giới xa xôi hẻo lánh.\n\n' +
        'Bác kiểm lâm già thuộc nằm lòng từng lối mòn hiểm trở, từng con suối cạn và vị trí của từng cây sưa cổ thụ ngàn năm tuổi trong vùng bảo tồn.\n\n' +
        'Đã bao lần một mình đối đầu với những toán lâm tặc hung hãn mang súng săn để bảo vệ từng tấc rừng xanh nguyên vẹn cho thế hệ mai sau.\n\n' +
        '\'Rừng là lá phổi, là nguồn sống của con cháu chúng ta, chừng nào đôi chân này còn bước được, bác còn đi tuần bảo vệ rừng đến cùng!\'',
    },
    {
      title: 'Giấc mơ vào đại học của cậu bé phụ hồ',
      theme: 'Lán trại công trường xây dựng bụi bặm đêm khuya, cậu thanh niên ngồi trên thùng sơn đọc sách ôn thi dưới ánh đèn pin leo lét.',
      script:
        'Ban ngày vác hàng trăm bao xi măng nặng trĩu và phụ hồ xây gạch dưới cái nắng hè gay gắt 40 độ C bỏng rát trên công trường xây dựng.\n\n' +
        'Đêm về trong căn lán tạm bợ dột nát, cậu thanh niên nghèo lại cặm cụi ngồi trên chiếc thùng sơn cũ lật mở từng trang sách ôn thi đại học dưới ánh đèn pin le lói.\n\n' +
        'Những giọt mồ hôi mặn chát rơi nhòe trên trang giấy tập giải toán, nhưng ánh mắt của cậu chưa từng một giây nguôi ngoai khát vọng đổi thay số phận bằng con đường tri thức.\n\n' +
        'Nghèo khó không phải là rào cản, mà là ngọn lửa thử vàng trui rèn nên ý chí sắt đá và bản lĩnh phi thường của những người không chịu đầu hàng nghịch cảnh!',
    },
    {
      title: 'Bức tranh vẽ dở người mẹ trước lúc đi xa',
      theme: 'Giá vẽ gỗ trong căn phòng ngập nắng, họa sĩ trẻ chấm những nét cọ cuối cùng lên bức chân dung nụ cười hiền hậu của người mẹ quá cố.',
      script:
        'Đứng trước giá vẽ gỗ trong căn phòng tĩnh lặng, người họa sĩ trẻ run rẩy đặt những nét cọ màu dầu cuối cùng lên bức chân dung của mẹ.\n\n' +
        'Đôi mắt hiền từ bao dung và nụ cười ấm áp như vạt nắng mùa xuân của mẹ hiện lên sống động đến nghẹn lòng trong từng nét vẽ tỉ mỉ.\n\n' +
        'Bức tranh được bắt đầu khi mẹ còn khỏe mạnh nhưng phải tạm gác lại suốt những tháng ngày mẹ nằm trên giường bệnh chiến đấu với bạo bệnh.\n\n' +
        'Hôm nay hoàn thành bức tranh cũng là ngày giỗ đầu của mẹ — món quà thiêng liêng nhất người con gửi gắm trọn vẹn tình yêu thương lên thiên đàng.',
    },
    {
      title: 'Ánh mắt kiên định của bác sĩ trẻ vùng tâm dịch',
      theme: 'Bộ đồ bảo hộ cấp 4 trắng toát ướt sũng mồ hôi, vết hằn sâu của khẩu trang N95 trên sống mũi và ánh mắt quả cảm trong phòng cách ly.',
      script:
        'Bức ảnh chụp lại khoảnh khắc người bác sĩ trẻ vừa kết thúc ca trực cấp cứu kéo dài 12 tiếng liên tục trong phòng cách ly áp lực âm.\n\n' +
        'Tháo chiếc kính bảo hộ và lớp khẩu trang N95 để lộ những vết lằn đỏ rớm máu hằn sâu trên sống mũi và hai bên gò má gầy guộc.\n\n' +
        'Toàn bộ cơ thể ướt sũng mồ hôi trong bộ đồ bảo hộ kín mít ngột ngạt, nhưng đôi mắt của anh vẫn rực sáng lên ngọn lửa kiên định và quả cảm không gì dập tắt nổi.\n\n' +
        'Sự hy sinh thầm lặng của những chiến sĩ áo trắng nơi tuyến đầu là bức tường thành vững chắc nhất bảo vệ sự an toàn cho hàng triệu đồng bào!',
    },
  ],

  // 11. Template: live_cinematic (20 mục)
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
    {
      title: 'Khoảnh khắc quyết định trước trận chung kết',
      theme: 'Phòng thay đồ tĩnh lặng nghẹt thở, ánh mắt tập trung cao độ của vận động viên, tiếng thở dốc và bước chân ra sân đấu rực rỡ ánh đèn.',
      script:
        'Trong căn phòng thay đồ tĩnh lặng nghẹt thở, tiếng tích tắc của chiếc đồng hồ treo tường như dồn nén toàn bộ áp lực của 4 năm khổ luyện.\n\n' +
        'Người vận động viên siết chặt dây giày, nhắm mắt hít một hơi thật sâu, tua lại hàng ngàn giờ đổ mồ hôi và nước mắt trên sàn tập.\n\n' +
        'Khi cánh cửa mở toang, ánh đèn sân vận động rực sáng cùng tiếng reo hò của hàng vạn khán giả dội vào lồng ngực như những hồi trống trận.\n\n' +
        'Không có đường lùi, chỉ có niềm tin sắt đá vào bản thân để bước ra và viết nên trang sử vinh quang của chính mình!',
    },
    {
      title: 'Lời chia tay lặng lẽ dưới tán phong đỏ rực',
      theme: 'Con đường mùa thu ngập lá phong đỏ rơi rụng, hai bóng lưng bước đi về hai hướng ngược nhau trong ánh tà dương điện ảnh.',
      script:
        'Cơn gió mùa thu cuốn theo những phiến lá phong đỏ rực rỡ xoay vần trên con đường lát đá cổ kính.\n\n' +
        'Không có những lời trách móc hay nước mắt ồn ào, chỉ có một cái ôm thật khẽ và lời cảm ơn chân thành cho những năm tháng thanh xuân tươi đẹp đã qua.\n\n' +
        'Hai con người từng là cả thế giới của nhau từ từ quay lưng bước đi về hai ngã rẽ hoàn toàn khác biệt của cuộc đời.\n\n' +
        'Một cái kết dịu dàng nhưng để lại dư âm nghẹn ngào sâu thẳm trong lòng người xem.',
    },
    {
      title: 'Chuyến tàu cao tốc xuyên qua màn sương sớm',
      theme: 'Góc quay flycam điện ảnh: đoàn tàu bạc lướt đi với tốc độ 300km/h trên cây cầu vượt biển, sương mù bảng lảng và mặt trời đỏ rực mọc từ đại dương.',
      script:
        'Từ chân trời mờ ảo phía xa, đoàn tàu cao tốc màu bạc ánh kim xé toang dải sương mù trắng xóa lướt băng băng trên cây cầu vượt biển dài bất tận.\n\n' +
        'Ánh bình minh đầu ngày nhuộm đỏ mặt nước đại dương bao la, tạo nên những vệt phản chiếu lấp lánh như dát vàng dát bạc dọc theo thân tàu.\n\n' +
        'Bên trong khoang tàu, ánh mắt của những hành khách chăm chú hướng ra ô cửa sổ ngắm nhìn kỳ quan thiên nhiên giao hòa cùng công nghệ hiện đại.\n\n' +
        'Một khung hình điện ảnh tráng lệ thể hiện sức mạnh vươn mình mạnh mẽ của con người trước vũ trụ bao la.',
    },
    {
      title: 'Người nghệ sĩ dương cầm chơi bản nhạc cuối cùng',
      theme: 'Nhà hát lớn trống không khán giả, ánh đèn spotlight rọi thẳng vào cây đàn grand piano đen bóng và đôi tay thăng hoa trên phím đàn.',
      script:
        'Cả khán phòng nhà hát lớn chìm trong bóng tối thăm thẳm, chỉ duy nhất một luồng sáng vàng spotlight rọi xuống cây đại dương cầm đen bóng giữa sân khấu khấu.\n\n' +
        'Người nghệ sĩ già với mái tóc bạc phơ khẽ đặt những ngón tay run rẩy lên phím đàn ngà voi, bắt đầu tấu lên bản giao hưởng cuộc đời mình.\n\n' +
        'Từng nốt nhạc khi thì trầm bổng như tiếng thở dài của dĩ vãng, lúc lại dồn dập như những cơn bão táp của số phận đã đi qua.\n\n' +
        'Không cần bất kỳ tràng pháo tay nào, nghệ thuật thuần khiết nhất chính là sự đối thoại chân thành giữa tâm hồn và âm nhạc.',
    },
    {
      title: 'Cuộc rượt đuổi nghẹt thở dưới ánh đèn neon',
      theme: 'Góc máy thấp lia nhanh theo bước chân chạy trốn trên đường phố đêm ướt mưa, ánh đèn pha ô tô quét qua những ngõ hẻm nghẹt thở.',
      script:
        'Tiếng gót giày nện dồn dập trên mặt đường nhựa ướt sũng nước mưa, phản chiếu ánh sáng chập chờn của những biển hiệu neon rực rỡ.\n\n' +
        'Bóng đen lướt nhanh qua từng con ngõ hẹp quanh co, tiếng còi xe cảnh sát rít lên từ phía xa xé toang màn đêm u tối.\n\n' +
        'Máy quay rung lắc theo từng nhịp thở dốc nghẹt thở, tạo nên cảm giác căng thẳng tột độ như thể khán giả đang trực tiếp tham gia vào cuộc đào tẩu hiểm nguy.\n\n' +
        'Mỗi bước ngoặt đều là ranh giới mong manh giữa sự tự do và chiếc bẫy thép đang siết chặt.',
    },
    {
      title: 'Ánh bình minh le lói trên đỉnh núi tuyết trắng',
      theme: 'Nhà leo núi cắm lá cờ chiến thắng trên mỏm đá phủ băng tuyết, ánh sáng ban mai vàng rực xua tan cái lạnh âm 30 độ C.',
      script:
        'Sau 14 tiếng kiên cường vật lộn với những cơn bão tuyết gầm rú và độ cao thiếu dưỡng khí, bước chân cuối cùng cũng chạm tới đỉnh núi tuyết hùng vĩ.\n\n' +
        'Đúng khoảnh khắc ấy, mặt trời đỏ rực từ từ nhô lên từ biển mây bồng bềnh, rọi những tia sáng ấm áp đầu tiên lên gương mặt phủ đầy băng giá.\n\n' +
        'Cảm giác choáng ngợp trước vẻ đẹp kỳ vĩ và vĩnh cửu của thiên nhiên khiến mọi gian nan nhọc nhằn bỗng chốc tan biến như mây khói.\n\n' +
        'Chinh phục đỉnh cao không phải là để thế giới nhìn thấy bạn, mà là để bạn có thể nhìn thấy cả thế giới dưới một góc nhìn hoàn toàn mới!',
    },
    {
      title: 'Ngọn hải đăng cô độc đứng vững trước giông bão',
      theme: 'Sóng biển khổng lồ cao 10 mét cuộn trào đập vào tháp đá hải đăng, tia sáng xoay tròn quét qua biển đêm giông bão dữ dội.',
      script:
        'Biển đêm nổi cơn cuồng nộ với những đợt sóng thần cao cả chục mét gầm thét đập vào vách đá ngầm đen thẫm.\n\n' +
        'Nhưng sừng sững giữa tâm bão giông gào thét, ngọn hải đăng trăm năm tuổi bằng đá hoa cương vẫn kiên cường đứng vững như một vị thần hộ mệnh.\n\n' +
        'Luồng ánh sáng vàng rực từ đỉnh tháp vẫn bền bỉ quay tròn từng vòng, xé toang bóng đêm mịt mùng để dẫn lối cho những con tàu lạc hướng tìm về bến bình an.\n\n' +
        'Biểu tượng bất diệt của lòng dũng cảm, sự kiên định và niềm hy vọng không bao giờ tắt giữa muôn trùng sóng gió cuộc đời.',
    },
    {
      title: 'Nụ cười bình yên của người lính trở về',
      theme: 'Sân ga đông đúc nhộn nhịp, người lính khoác ba lô sờn cũ bỗng khựng lại khi nhìn thấy nụ cười và giọt nước mắt hạnh phúc của người thương.',
      script:
        'Đoàn tàu hỏa phanh kít nhả khói trắng trên sân ga đông đúc người thân ngóng đợi.\n\n' +
        'Bước xuống bậc thang với chiếc ba lô quân ngũ sờn màu bụi đất chiến trường, người lính trẻ lướt ánh mắt tìm kiếm giữa biển người xa lạ.\n\n' +
        'Và rồi ánh mắt anh bỗng sáng bừng lên, một nụ cười rạng rỡ nở trên gương mặt sạm nắng phong trần khi nhìn thấy hình bóng thân thương đang chạy ùa về phía mình.\n\n' +
        'Giọt nước mắt nghẹn ngào hòa trong cái ôm siết chặt — khoảnh khắc bình yên quý giá nhất mà không vinh hoa nào có thể sánh bằng.',
    },
    {
      title: 'Bình minh trên đỉnh Tà Xùa',
      theme: 'Săn biển mây bồng bềnh cuộn qua sườn núi Tây Bắc lúc rạng đông',
      script:
        '4:30 sáng, gió rét buốt thấu qua lớp áo phao, sương mù dày đặc che phủ lối đi.\n\n' +
        'Nhưng khi ánh dương đầu tiên xé toang màn đêm, cả biển mây trắng muốt bừng sáng dưới chân như một cõi bồng lai.\n\n' +
        'Có những khoảnh khắc chỉ có thể ngắm nhìn trong tĩnh lặng tuyệt đối để cảm nhận sự kỳ vĩ của đất trời.',
    },
    {
      title: 'Người thợ rèn cuối cùng bên dòng sông Đáy',
      theme: 'Ánh lửa lò rèn truyền thống rực đỏ gương mặt già nua đầy nếp nhăn',
      script:
        'Tiếng búa sắt nện chan chát xuống đe thép đã gắn liền với cuộc đời ông lão hơn sáu thập kỷ.\n\n' +
        'Từng tia lửa cam đỏ bắn tung toé trong căn nhà gỗ ám khói, tôi luyện nên những lưỡi dao sắc lẹm và bền bỉ.\n\n' +
        'Một nghề thủ công đang dần mai một, nhưng ngọn lửa đam mê thì chưa bao giờ lụi tàn.',
    },
    {
      title: 'Phố cổ Hội An ngày mưa dầm',
      theme: 'Màu vàng cổ kính của tường gạch soi bóng dưới vũng nước mưa trầm mặc',
      script:
        'Mưa rả rích trên mái ngói âm dương, tiếng giọt gianh thánh thót rơi vào chum nước cổ.\n\n' +
        'Những ngọn đèn lồng đỏ ướt đẫm nước mưa tỏa ánh sáng mờ ảo xuống lòng đường lát đá vắng bóng người.\n\n' +
        'Hội An trong mưa mang vẻ đẹp u hoài, lắng đọng như một bức tranh thuỷ mặc phương Đông.',
    },
    {
      title: 'Hành trình tàu Bắc Nam qua đèo Hải Vân',
      theme: 'Toa tàu uốn lượn ven vách đá hùng vĩ nhìn xuống vịnh Lăng Cô xanh ngắt',
      script:
        'Cửa sổ toa tàu mở toang đón làn gió biển mặn mòi thổi lùa vào khoang vắng.\n\n' +
        'Bên trái là vách núi đá sừng sững phủ kín cây rừng, bên phải là vực sâu thăm thẳm mở ra vịnh biển xanh ngọc bích.\n\n' +
        'Chuyến đi chậm rãi đưa tâm hồn người lữ khách tìm lại sự an yên giữa nhịp sống hối hả.',
    },
    {
      title: 'Người gác hải đăng đảo Hòn Dấu',
      theme: 'Cuộc sống cô độc và kiên cường của người canh giữ ánh sáng biển đêm',
      script:
        'Gió bão gầm rít ngoài khơi xa, từng con sóng dữ đập ầm ầm vào chân tháp đá hoa cương.\n\n' +
        'Giữa đêm đen đại dương, ngọn đèn hải đăng vẫn đều đặn xoay tròn, chiếu rọi luồng sáng dẫn lối tàu thuyền cập bến.\n\n' +
        'Sự cô đơn hoá thành lòng trung kiên của người gác biển thầm lặng.',
    },
    {
      title: 'Hoàng hôn buông trên hồ Ba Bể',
      theme: 'Chiếc thuyền độc mộc lướt nhẹ trên mặt hồ phẳng lặng như gương soi mây trời',
      script:
        'Mặt hồ êm đềm không một gợn sóng, phản chiếu bầu trời chuyển dần từ cam rực sang tím thẫm.\n\n' +
        'Tiếng mái chèo khua nước nhè nhẹ của cô gái Tày trong bộ áo chàm truyền thống xua tan vẻ u tịch của núi rừng.\n\n' +
        'Khoảnh khắc đất trời giao hòa khiến thời gian như ngưng đọng.',
    },
    {
      title: 'Chợ hoa đêm Quảng Bá trước Tết',
      theme: 'Sắc đào phai, cúc vàng rực rỡ dưới ánh đèn pha giữa đêm đông lạnh giá',
      script:
        '2 giờ sáng, chợ hoa nhộn nhịp tiếng ngã giá và tiếng xe máy chở hoa kĩu kịt rẽ sương.\n\n' +
        'Hơi thở phả ra khói lạnh quyện cùng hương thơm thanh khiết của muôn loài hoa cỏ.\n\n' +
        'Sức sống mùa xuân đang âm thầm thức giấc ngay giữa lòng thủ đô giá buốt.',
    },
    {
      title: 'Vũ điệu cá cơm trên vịnh Nha Trang',
      theme: 'Ngư dân kéo tấm lưới vây khổng lồ nổi lên mặt biển lấp lánh bạc',
      script:
        'Dưới ánh nắng sớm rực rỡ, tấm lưới xanh biếc bung tỏa như đóa hoa khổng lồ giữa lòng biển cả.\n\n' +
        'Hàng triệu con cá cơm tươi rói nhảy múa lấp lánh như vảy bạc dưới ánh mặt trời.\n\n' +
        'Nụ cười rạng rỡ của ngư dân đón chào chuyến biển đầy ắp tôm cá.',
    },
    {
      title: 'Tiếng chuông chùa Yên Tử trong sương sớm',
      theme: 'Bậc đá rêu phong mờ ảo dẫn lên đỉnh thiêng phủ mây trắng huyền bí',
      script:
        'Từng bậc đá dốc đứng đưa bước chân hành hương qua những cội tùng cổ thụ trăm năm tuổi.\n\n' +
        'Tiếng chuông đồng ngân vang trầm ấm xuyên qua màn sương mù dày đặc nơi đỉnh mây.\n\n' +
        'Tâm hồn rũ bỏ mọi ưu phiền trần thế khi chạm vào cõi thiêng non Yên Tử.',
    },
    {
      title: 'Cánh đồng muối Sa Huỳnh rực nắng hè',
      theme: 'Bóng diêm dân gánh muối gập ghềnh in trên mặt ruộng sáng lóa như gương',
      script:
        'Trưa hè gay gắt đổ lửa, mặt ruộng muối kết tinh trắng muốt phản chiếu chói chang ánh mặt trời.\n\n' +
        'Đôi quang gánh kĩu kịt trên vai mẹ, thấm đẫm từng giọt mồ hôi mặn chát của một đời lam lũ.\n\n' +
        'Vị mặn của muối cũng chính là vị mồ hôi tạo nên hạt ngọc trắng cho đời.',
    },
  ],

  // 12. Template: live_person (20 mục)
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
    {
      title: 'Chuyện đời bác thợ sửa xe đạp 40 năm bên hè phố',
      theme: 'Bác thợ già đôi tay lấm lem dầu luyn, chiếc bơm tay bằng sắt gỉ và những mẩu chuyện đời thấm thía bên gốc cây xà cừ cổ thụ.',
      script:
        'Hơn bốn thập kỷ ngồi dưới bóng mát cây xà cừ già này, bác Hai đã chứng kiến bao nhiêu thế hệ học trò lớn lên và thành đạt.\n\n' +
        'Đôi bàn tay thô ráp đen nhẻm vết dầu mỡ nhưng thao tác vá săm, chỉnh vành xe lại khéo léo và chuẩn xác như một nghệ nhân điêu luyện.\n\n' +
        '\'Nhiều đứa ngày xưa đi xe đạp lọc cọc ghé bác bơm lốp, giờ đi ô tô tiền tỷ thỉnh thoảng vẫn dừng lại biếu bác gói trà thơm mạn đàm chuyện cũ.\'\n\n' +
        'Nghề nào cũng quý, miễn là mình làm việc bằng cái tâm trong sạch và lòng chân thành đối với mọi người xung quanh.',
    },
    {
      title: 'Nữ shipper một mình nuôi con ăn học thành tài',
      theme: 'Chiếc xe máy cũ kẹp thùng hàng nặng trĩu sau lưng, giọt mồ hôi lăn trên má và nụ cười rạng rỡ khi nhận được giấy báo đỗ đại học của con.',
      script:
        'Từ 6 giờ sáng đến 10 giờ đêm, bất kể nắng gắt cháy da hay mưa rào ngập lối, bóng dáng chị vẫn miệt mài trên từng con phố với thùng hàng nặng trĩu sau xe.\n\n' +
        'Động lực duy nhất giúp người mẹ đơn thân vượt qua mọi nhọc nhằn chính là tấm ảnh con gái nhỏ cài ngay trên tay lái xe máy.\n\n' +
        'Khoảnh khắc nhận được cuộc gọi của con thông báo đỗ thủ khoa đại học Y, chị nép xe vào lề đường ôm mặt khóc nức nở vì hạnh phúc ngập tràn.\n\n' +
        'Tình mẫu tử thiêng liêng có thể tiếp thêm sức mạnh phi thường để người mẹ dời non lấp bể vì tương lai của con.',
    },
    {
      title: 'Một ngày làm việc của cô y tá trực cấp cứu đêm',
      theme: 'Hành lang bệnh viện sáng đèn trắng toát, tiếng còi xe cứu thương hối hả và bước chân thoăn thoắt của nhân viên y tế giành giật sự sống.',
      script:
        'Khi cả thành phố chìm vào giấc ngủ êm đềm, ca trực đêm của khoa cấp cứu lại bắt đầu những giây phút căng thẳng đến nghẹt thở.\n\n' +
        'Tiếng còi xe cứu thương rú liên hồi, băng ca đẩy gấp gáp vào phòng hồi sức, những bàn tay thoăn thoắt cắm kim truyền và ép tim ngoài lồng ngực.\n\n' +
        'Suốt 12 tiếng liên tục không một phút nghỉ ngơi, đôi chân mỏi nhừ nhưng đôi mắt của họ vẫn luôn tràn đầy sự tập trung và trách nhiệm cao nhất.\n\n' +
        'Những thiên thần áo trắng thầm lặng thức trắng đêm để giữ lại hơi thở và nhịp đập sự sống cho biết bao gia đình.',
    },
    {
      title: 'Bác nông dân trồng rau sạch tâm huyết với đất mẹ',
      theme: 'Vườn rau hữu cơ xanh mướt ngát hương đất phù sa, giọt mồ hôi nhỏ xuống luống cày và nụ cười tự hào về những nhánh rau không hóa chất.',
      script:
        'Từ chối dùng các loại thuốc trừ sâu và phân bón hóa học kích thích tăng trưởng nhanh, bác Ba chọn con đường làm nông nghiệp hữu cơ đầy chông gai.\n\n' +
        'Tự tay ủ phân compost từ vỏ trấu và rơm rạ, bắt từng con sâu bọ bằng tay để giữ cho đất đai luôn màu mỡ và nguồn nước ngầm trong sạch.\n\n' +
        '\'Rau mình trồng ra trước hết con cháu mình ăn, sau đó người tiêu dùng ăn, không thể vì chút lợi nhuận mà làm tổn hại sức khỏe đồng bào.\'\n\n' +
        'Lòng tự trọng nghề nghiệp và tình yêu đất mẹ của những người nông dân chân chất đáng trân quý biết bao nhiêu.',
    },
    {
      title: 'Thầy giáo vùng cao gùi chữ qua những nẻo đèo',
      theme: 'Điểm trường cheo leo trên đỉnh núi mây mù, thầy giáo trẻ vượt suối gùi từng cuốn sách giáo khoa và gói mì tôm cho học trò nghèo.',
      script:
        'Gác lại những cơ hội việc làm hấp dẫn ở thành phố phồn hoa, thầy giáo trẻ chọn gắn bó thanh xuân với điểm trường vùng cao xa xôi hẻo lánh.\n\n' +
        'Mỗi tuần hai lần vượt qua những con dốc đất đỏ trơn trượt sau mưa lũ để mang từng cuốn sách giáo khoa, từng chiếc áo ấm đến cho các em học sinh dân tộc thiểu số.\n\n' +
        'Lớp học đơn sơ vách nứa vang lên tiếng đánh vần ngọng nghịu nhưng chan chứa khát khao vươn lên đổi thay số phận của những đứa trẻ vùng cao.\n\n' +
        'Ngọn lửa tri thức và tình thương yêu thầy thắp lên sẽ sưởi ấm cả những mùa đông buốt giá nơi biên cương Tổ quốc.',
    },
    {
      title: 'Cô thợ may già gìn giữ nét áo dài truyền thống',
      theme: 'Tiệm may nhỏ trong ngõ phố cổ, thước dây quanh cổ, chiếc máy may con bướm đạp chân lách cách và những tà áo lụa Hà Đông mềm mại.',
      script:
        'Hơn nửa thế kỷ gắn bó với chiếc máy may đạp chân con bướm cổ điển, cô Lan thuộc nằm lòng từng đường kim mũi chỉ của tà áo dài truyền thống.\n\n' +
        'Không dùng máy móc công nghiệp hàng loạt, mỗi chiếc áo dài đều được cô đo may thủ công tỉ mỉ theo vóc dáng riêng biệt của từng người phụ nữ.\n\n' +
        'Từ cách cắt cúp tà áo bay bổng đến nút bấm bọc vải tinh tế, tất cả đều toát lên vẻ đẹp đoan trang, thanh lịch của phụ nữ Việt Nam qua bao thế hệ.\n\n' +
        'Nghệ thuật thủ công chân chính luôn có chỗ đứng vững bền bất chấp sự xoay vần của thời gian.',
    },
    {
      title: 'Người gác chắn tàu hỏa cống hiến thầm lặng',
      theme: 'Chòi gác chắn đường ngang lúc nửa đêm, tiếng chuông leng keng cảnh báo, người công nhân giơ cao chiếc đèn tín hiệu đỏ điều tiết giao thông.',
      script:
        'Cứ mỗi khi tiếng chuông cảnh báo \'leng keng... leng keng\' vang lên báo hiệu đoàn tàu hỏa sắp đi qua, bác gác chắn lại nhanh chóng kéo rào chắn an toàn.\n\n' +
        'Dù là đêm đông giá rét hay trưa hè nắng đổ lửa 40 độ C, ca trực của họ chưa bao giờ được phép lơ là dù chỉ một giây.\n\n' +
        'Cầm chiếc đèn tín hiệu giơ cao chào đoàn tàu vụt qua an toàn trong đêm, nụ cười hiền hậu của họ ẩn hiện dưới vành mũ bảo hộ lao động.\n\n' +
        'Sự an toàn của hàng vạn hành khách trên mỗi chuyến hành trình được tạo nên từ sự tận tụy thầm lặng của những con người bình dị như thế.',
    },
    {
      title: 'Chàng kỹ sư bỏ phố về quê khởi nghiệp nông sản',
      theme: 'Rời văn phòng máy lạnh, kỹ sư công nghệ trở về trang trại quê hương ứng dụng IoT tưới tiêu tự động cho vườn cây ăn trái đặc sản.',
      script:
        'Từng có mức thu nhập hàng ngàn đô la tại một công ty công nghệ lớn, anh quyết định trở về quê hương để tìm lại giá trị sống thực sự.\n\n' +
        'Ứng dụng các cảm biến IoT đo độ ẩm đất và hệ thống tưới nhỏ giọt tự động vào vùng trồng bưởi da xanh đặc sản của gia đình.\n\n' +
        'Kết hợp công nghệ số để xây dựng thương hiệu nông sản sạch, đưa sản phẩm quê hương tiếp cận thẳng tới người tiêu dùng qua các sàn thương mại điện tử.\n\n' +
        'Làm giàu trên chính mảnh đất quê hương bằng tri thức và công nghệ hiện đại — con đường đầy cảm hứng của thế hệ trẻ hôm nay!',
    },
    {
      title: 'Một ngày làm việc của bác sĩ cấp cứu đêm',
      theme: 'Góc nhìn chân thực phía sau cánh cửa phòng hồi sức tích cực',
      script:
        '3 giờ sáng, chuông báo động vang lên dồn dập, cáng thương chuyển bệnh nhân nguy kịch lao nhanh vào phòng.\n\n' +
        'Không có chỗ cho sự do dự, từng giây từng phút là một cuộc chiến giằng co sinh mệnh với tử thần.\n\n' +
        'Sau ca mổ thành công, một ngụm nước lọc vội vàng và ánh mắt nhẹ nhõm đủ tiếp sức cho một ca trực dài.',
    },
    {
      title: 'Tâm sự của anh shipper chạy đơn mưa ngập',
      theme: 'Hành trình giao đồ ăn trong đêm mưa bão đường phố Hà Nội',
      script:
        'Nước ngập nửa bánh xe máy, áo mưa rách tơi tả vì gió giật mạnh.\n\n' +
        'Điều lo lắng nhất không phải là ướt áo hay lạnh cóng, mà là làm sao giữ cho hộp cơm của khách luôn nóng giòn.\n\n' +
        'Nhận được lời cảm ơn kèm nụ cười ấm áp của khách hàng, mọi vất vả dường như tan biến.',
    },
    {
      title: 'Người thầy giáo cắm bản trên đỉnh Mù Cang Chải',
      theme: 'Hành trình gieo chữ kiên trì nơi vùng cao heo hút thiếu thốn',
      script:
        'Con đường dốc trơn trượt lầy lội sau cơn mưa rừng không làm chùn bước chân thầy giáo trẻ.\n\n' +
        'Lớp học vách nứa đơn sơ chỉ có bảng gỗ và phấn trắng, nhưng luôn rộn rã tiếng đánh vần ngây ngô của các em nhỏ H\'Mông.\n\n' +
        'Ngọn đèn dầu thắp sáng ước mơ vượt khó của những tâm hồn trẻ thơ nơi non cao.',
    },
    {
      title: 'Nữ lập trình viên và hành trình chuyển ngành tuổi 30',
      theme: 'Vượt qua định kiến và hoài nghi để theo đuổi đam mê công nghệ',
      script:
        'Rời bỏ công việc bàn giấy ổn định suốt 7 năm để bắt đầu lại từ con số không với các dòng lệnh code.\n\n' +
        'Những đêm thức trắng bên màn hình đỏ lòm lỗi cú pháp, từng có lúc muốn bỏ cuộc vì áp lực.\n\n' +
        'Nhưng niềm hạnh phúc vỡ òa khi dòng code đầu tiên chạy mượt mà đã chứng minh: không bao giờ là quá trễ để bắt đầu lại.',
    },
    {
      title: 'Người thợ may vest thủ công 40 năm kinh nghiệm',
      theme: 'Từng mũi kim sợi chỉ định hình phong thái người mặc',
      script:
        'Mỗi đường cắt kéo trên tấm vải len ngoại nhập đòi hỏi sự chuẩn xác tuyệt đối từng milimet.\n\n' +
        'Bộ vest đẹp không chỉ vừa vặn về số đo, mà còn tôn vinh dáng vẻ và khí chất riêng của người đàn ông.\n\n' +
        'Sự tỉ mỉ và kiên nhẫn qua từng mũi khâu tay chính là linh hồn của nghề may đo đo ni đóng giày.',
    },
    {
      title: 'Người mẹ đơn thân khởi nghiệp tiệm bánh ngọt',
      theme: 'Vượt qua thử thách tài chính để xây dựng tương lai cho con',
      script:
        'Bắt đầu với một chiếc lò nướng mini cũ kỹ trong góc bếp chật hẹp của căn nhà trọ.\n\n' +
        'Thất bại hàng chục mẻ bánh hỏng, nhưng ánh mắt ngây thơ của con gái nhỏ là động lực để làm lại từ đầu.\n\n' +
        'Hôm nay, tiệm bánh nhỏ đã đón những vị khách quen đầu tiên bằng hương thơm vani ngọt ngào.',
    },
    {
      title: 'Bác bảo vệ trường đại học và tình yêu với sách',
      theme: 'Người gác cổng thầm lặng đọc hàng trăm cuốn triết học mỗi năm',
      script:
        'Dưới ánh đèn bàn nhỏ trong phòng bảo vệ, bác cẩn thận lật từng trang sách lịch sử đã ố vàng.\n\n' +
        'Không có điều kiện học đại học thời trẻ, nhưng niềm đam mê tri thức chưa bao giờ nguội lạnh trong tim người lính già.\n\n' +
        'Bác luôn mỉm cười và tặng những lời khuyên sâu sắc cho các bạn sinh viên mỗi mùa thi cử.',
    },
    {
      title: 'Vận động viên điền kinh khuyết tật vượt lên số phận',
      theme: 'Nghị lực phi thường trên đường chạy Para Games',
      script:
        'Đôi chân giả bằng sợi carbon ma sát đau buốt mỗi bước chạy tăng tốc trên sân vận động.\n\n' +
        'Từng giọt mồ hôi và nước mắt đổ xuống đường pitch để đổi lấy những giây phút bứt phá kỷ lục bản thân.\n\n' +
        'Chiến thắng lớn nhất không phải tấm huy chương vàng, mà là chiến thắng sự nghiệt ngã của số phận.',
    },
    {
      title: 'Người pha chế cà phê specialty tìm hương vị cội nguồn',
      theme: 'Khám phá hạt cà phê Robusta chất lượng cao vùng đất đỏ Tây Nguyên',
      script:
        'Không chạy theo các dòng hạt ngoại đắt đỏ, anh dành 5 năm lên rẫy cùng đồng bào K\'Ho cải tiến cách sơ chế trái chín.\n\n' +
        'Từng giọt cà phê chiết xuất từ phễu V60 mang hương vị hoa trái nhiệt đới và sô cô la đậm đà khó quên.\n\n' +
        'Khẳng định giá trị đích thực của hạt cà phê Việt Nam trên bản đồ cà phê thế giới.',
    },
    {
      title: 'Kỹ sư nông nghiệp trẻ bỏ phố về làm nông hữu cơ',
      theme: 'Hồi sinh đất cằn bằng phương pháp canh tác tự nhiên',
      script:
        'Bỏ lại mức lương nghìn đô tại công ty đa quốc gia để về quê lội bùn, ủ phân trùn quế.\n\n' +
        'Bị bà con lối xóm hoài nghi là viển vông, nhưng sau 3 năm, trang trại xanh mướt đã cho ra những lứa rau củ sạch thơm ngon.\n\n' +
        'Làm nông nghiệp tử tế chính là cách chữa lành cho đất mẹ và chính bản thân mình.',
    },
  ],

  // 13. Template: photo_realism (20 mục)
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
    {
      title: 'Hạt cà phê chín mọng trên cành đất đỏ bazan',
      theme: 'Chùm quả cà phê Robusta chín đỏ mọng nước như chuỗi ngọc bích, vệt nắng sớm rọi qua tán lá râm mát của đồn điền Tây Nguyên.',
      script:
        'Độ chi tiết đến từng lỗ khí khổng li ti trên bề mặt quả cà phê Robusta đang vào mùa thu hoạch rộ trên cao nguyên đất đỏ bazan.\n\n' +
        'Những chùm quả chín mọng đỏ rực rỡ như chuỗi ngọc bích ẩn hiện dưới tán lá xanh mướt ngậm sương mai buổi sớm.\n\n' +
        'Ánh sáng tự nhiên xiên góc làm nổi bật độ bóng bẩy tự nhiên của lớp vỏ quả và kết cấu đất đỏ bazan phì nhiêu màu mỡ.\n\n' +
        'Nhiếp ảnh chân thực tôn vinh trọn vẹn vẻ đẹp nguyên bản và giá trị nông sản quý báu của vùng đất Tây Nguyên hùng vĩ.',
    },
    {
      title: 'Vệt nắng xiên qua khe cửa sổ căn nhà cổ',
      theme: 'Hạt bụi li ti lơ lửng trong luồng sáng vàng óng ả, bức tường vôi vàng bong tróc rêu phong và bộ bàn ghế gỗ lim bóng màu thời gian.',
      script:
        'Một luồng sáng ban mai vàng óng như mật ong rọi xiên qua khe cửa sổ gỗ lim chạm trổ tinh xảo của ngôi nhà cổ trăm tuổi.\n\n' +
        'Hàng triệu hạt bụi li ti bồng bềnh khiêu vũ trong dải sáng như một dải ngân hà thu nhỏ giữa không gian tĩnh lặng trầm mặc.\n\n' +
        'Kết cấu bức tường vôi vàng bong tróc từng mảng rêu phong lộ ra lớp gạch nung đỏ son nhuốm màu thăng trầm của thời gian.\n\n' +
        'Một khoảnh khắc nhiếp ảnh tĩnh lặng chạm đến tận cùng chiều sâu cảm xúc của hoài niệm và sự an yên.',
    },
    {
      title: 'Mắt đại bàng sắc lạnh nhìn từ đỉnh vách đá',
      theme: 'Cận cảnh cực nét con ngươi màu hổ phách của đại bàng đầu trắng, từng sợi lông vũ tơ mịn màng và ánh mắt kiêu hãnh của chúa tể bầu trời.',
      script:
        'Độ sắc nét đến từng sợi lông vũ tơ mảnh mai quanh hốc mắt của chúa tể bầu trời đang ngự trị trên mỏm đá cheo leo.\n\n' +
        'Con ngươi màu hổ phách trong veo sắc lạnh như lưỡi kiếm, phản chiếu toàn bộ khung cảnh thung lũng đại ngàn hùng vĩ bên dưới.\n\n' +
        'Ánh sáng ngược rọi qua viền mỏ quặp nhọn hoắt bằng chất sừng cứng cáp, thể hiện uy quyền tối thượng của loài chim săn mồi cự phách.\n\n' +
        'Đỉnh cao của nhiếp ảnh động vật hoang dã ghi lại khoảnh khắc tĩnh lặng đầy sức mạnh nghẹt thở.',
    },
    {
      title: 'Nếp nhăn thời gian trên bàn tay người mẹ già',
      theme: 'Cận cảnh đôi bàn tay gầy gò nhăn nheo với những vết đồi mồi thời gian, nắm chặt chuỗi hạt tràng gỗ thơm dưới ánh sáng tự nhiên.',
      script:
        'Mỗi đường gân guốc nổi rõ và từng nếp nhăn sâu thẳm trên mu bàn tay gầy gò của người mẹ là một trang nhật ký nhọc nhằn nuôi con khôn lớn.\n\n' +
        'Những vết đồi mồi lấm tấm màu nâu nhạt ghi dấu ấn của gần một thế kỷ đi qua bao mưa nắng dãi dầu của cuộc đời.\n\n' +
        'Ánh sáng tự nhiên mềm mại làm nổi bật kết cấu da mỏng manh như tờ giấy pơ-lu nhưng chứa đựng tình yêu thương bao la vô bờ bến.\n\n' +
        'Bức ảnh chân thực khiến bất kỳ người con nào nhìn vào cũng rưng rưng xúc động nhớ về người mẹ kính yêu.',
    },
    {
      title: 'Sóng biển cuộn trào vỗ vào bờ đá hoa cương',
      theme: 'Khối sóng biển xanh ngọc bích cuộn trào tung bọt trắng xóa, hàng triệu giọt nước li ti đóng băng trong khoảnh khắc tốc độ màn trập cao.',
      script:
        'Đóng băng chuyển động ở tốc độ màn trập một phần tám ngàn giây, toàn bộ cấu trúc của ngọn sóng biển hiện lên ngoạn mục đến khó tin.\n\n' +
        'Làn nước biển xanh màu ngọc bích trong vắt cuộn tròn thành một ống nước khổng lồ trước khi đổ sập vào khối đá hoa cương đen thẫm.\n\n' +
        'Hàng triệu bọt nước trắng xóa li ti bắn tung lên không trung như những viên kim cương lấp lánh phản chiếu ánh nắng trưa rực rỡ.\n\n' +
        'Sức mạnh nguyên sơ và vẻ đẹp kỳ vĩ của đại dương được lột tả chân thực đến từng chi tiết nhỏ nhất.',
    },
    {
      title: 'Bát gốm mộc nung củi với men rạn tinh tế',
      theme: 'Cận cảnh bề mặt bát gốm nung củi truyền thống: vết men rạn tự nhiên như mạng nhện, vết tro bay đọng lại và đất sét thô mộc ấm áp.',
      script:
        'Không cần những lớp men bóng bẩy công nghiệp, chiếc bát gốm mộc nung củi này thu hút mọi ánh nhìn bởi vẻ đẹp Wabi-Sabi thuần khiết.\n\n' +
        'Những vết men rạn tự nhiên li ti như mạng nhện đan xen trên bề mặt đất nung thô ráp, tạo nên một kết cấu thị giác vô cùng độc đáo.\n\n' +
        'Vết tro bay từ lò củi đọng lại ngẫu nhiên thành những vệt màu xám tro pha chút sắc nâu đỏ mộc mạc và ấm áp.\n\n' +
        'Vẻ đẹp của sự bất toàn và dấu ấn độc bản mà chỉ có bàn tay con người kết hợp cùng lửa đỏ mới có thể tạo ra.',
    },
    {
      title: 'Kết cấu vỏ cây cổ thụ nghìn năm rêu phong',
      theme: 'Vỏ cây thông cổ thụ sần sùi với những rãnh nứt sâu hun hút, thảm rêu xanh ngọc mềm mại phủ kín và giọt nhựa thơm óng ánh.',
      script:
        'Tiến lại gần thân cây cổ thụ nghìn năm tuổi trong rừng nguyên sinh, một thế giới vi mô kỳ thú bỗng hiện ra trước ống kính macro.\n\n' +
        'Lớp vỏ cây sần sùi với những rãnh nứt sâu hun hút như những hẻm vực hiểm trở của một lục địa thu nhỏ.\n\n' +
        'Thảm rêu xanh ngọc mềm mại mọc len lỏi khắp các khe nứt, đọng lại những giọt nhựa thông óng ánh trong suốt như hổ phách.\n\n' +
        'Thời gian ngàn năm như đọng lại trong từng thớ gỗ kiên cường vượt qua muôn ngàn giông bão của đất trời.',
    },
    {
      title: 'Khối băng tuyết trong suốt tan dưới nắng ấm',
      theme: 'Khối băng bắc cực trong vắt như pha lê, bọt khí li ti bị phong ấn từ thời tiền sử và giọt nước tan chảy rực rỡ dưới ánh mặt trời.',
      script:
        'Cận cảnh một khối băng trôi trôi dạt vào bãi cát đen núi lửa, trong suốt và tinh khiết tựa như một khối pha lê tự nhiên hoàn mỹ.\n\n' +
        'Bên trong khối băng là hàng triệu bọt khí li ti bị giam giữ từ hàng vạn năm trước, lưu giữ bầu khí quyển nguyên sơ của Trái Đất thời tiền sử.\n\n' +
        'Những giọt nước tan chảy lăn chầm chậm trên bề mặt góc cạnh, khúc xạ ánh nắng mặt trời thành một dải cầu vồng bảy sắc lung linh kỳ ảo.\n\n' +
        'Vẻ đẹp mong manh và thanh khiết nhắc nhở chúng ta về sự quý giá của thiên nhiên hoang dã cần được chở che.',
    },
    {
      title: 'Chân dung cận cảnh cụ bà dân tộc Dao đỏ',
      theme: 'Những nếp nhăn thời gian và chiếc khăn xếp đỏ rực thêu tay tinh xảo',
      script:
        'Ống kính 85mm bắt trọn từng sợi chỉ thêu hoa văn cầu kỳ trên chiếc mũ đỏ truyền thống.\n\n' +
        'Ánh mắt đôn hậu và nụ cười móm mém của cụ bà 90 tuổi chứa đựng cả một pho sử ký sống về văn hóa bản làng.\n\n' +
        'Độ chi tiết sắc nét đến từng sợi tóc bạc bay trong gió sương vùng cao.',
    },
    {
      title: 'Chi tiết giọt sương mai đọng trên cánh hoa sen trắng',
      theme: 'Ảnh chụp macro tái hiện độ trong suốt và khúc xạ ánh sáng hoàn hảo',
      script:
        'Cánh sen trắng muốt ngậm một giọt sương mai long lanh như hạt ngọc bích.\n\n' +
        'Bên trong giọt nước là hình ảnh phản chiếu thu nhỏ của cả mặt hồ Tây trong buổi bình minh ửng hồng.\n\n' +
        'Sự thuần khiết tuyệt đối của thiên nhiên qua lăng kính nhiếp ảnh macro đỉnh cao.',
    },
    {
      title: 'Kết cấu thớ gỗ mục rêu phong trong rừng nguyên sinh',
      theme: 'Độ phân giải siêu cao làm nổi bật vân gỗ xù xì và thảm rêu xanh ẩm ướt',
      script:
        'Thân cây lim cổ thụ ngã đổ hàng trăm năm trước nay trở thành cái nôi cho muôn loài nấm và rêu rừng sinh sôi.\n\n' +
        'Từng mảng địa y bám chặt vào thớ gỗ nứt nẻ, tỏa ra hương ẩm thơm nồng đặc trưng của rừng nhiệt đới.\n\n' +
        'Vòng tuần hoàn kỳ diệu của sự sống và cái chết trong tự nhiên.',
    },
    {
      title: 'Bề mặt đĩa thức ăn fine dining Michelin',
      theme: 'Sự kết hợp hoàn mỹ giữa nghệ thuật ẩm thực và nhiếp ảnh tĩnh vật',
      script:
        'Miếng thịt bò Wagyu A5 nướng xém cạnh bóng bẩy lớp mỡ cẩm thạch tan chảy.\n\n' +
        'Nước xốt nấm truffle đen nhánh nhỏ giọt nghệ thuật bên cạnh nhành lá thơm và hoa ăn được li ti.\n\n' +
        'Mỗi chi tiết trên đĩa sứ đen mờ đều toát lên đẳng cấp ẩm thực thượng hạng.',
    },
    {
      title: 'Mắt chim ưng biển săn mồi',
      theme: 'Ánh nhìn sắc lạnh và tinh anh phản chiếu bầu trời lộng gió',
      script:
        'Đồng tử sắc như dao cạo định vị mục tiêu dưới mặt biển sâu từ độ cao hàng trăm mét.\n\n' +
        'Từng chiếc lông vũ mượt mà quanh hốc mắt được tái hiện chân thực đến từng đường tơ kẽ tóc.\n\n' +
        'Biểu tượng của sức mạnh hoang dã và sự chính xác tuyệt đối.',
    },
    {
      title: 'Mặt đồng hồ cơ lộ cơ khí Tourbillon',
      theme: 'Bánh răng siêu nhỏ bằng titanium chuyển động nhịp nhàng qua kính sapphire',
      script:
        'Sự kỳ công của nghệ thuật chế tác đồng hồ Thụy Sĩ được phô diễn trọn vẹn qua góc máy cận cảnh.\n\n' +
        'Những viên hồng ngọc đính đá xoay nhịp nhàng điều chỉnh độ chính xác từng phần nghìn giây.\n\n' +
        'Đỉnh cao của cơ khí chính xác và vẻ đẹp cơ học vượt thời gian.',
    },
    {
      title: 'Vân đá cẩm thạch tự nhiên trong hang động Phong Nha',
      theme: 'Tầng tầng lớp lớp trầm tích khoáng chất tạo thành dải lụa đá kỳ vĩ',
      script:
        'Trải qua hàng triệu năm kiến tạo địa chất, dòng nước ngầm đã tạc nên những dải vân đá uốn lượn mềm mại.\n\n' +
        'Ánh đèn chiếu rọi khiến tinh thể thạch anh bên trong lấp lánh như bầu trời đầy sao thu nhỏ trong lòng đất.\n\n' +
        'Tuyệt tác điêu khắc của mẹ thiên nhiên.',
    },
    {
      title: 'Chiếc xe cổ Vespa sprint 1968 màu ngọc bích',
      theme: 'Lớp sơn bóng phản chiếu ánh đèn đường Sài Gòn cổ điển',
      script:
        'Đường cong kim loại uốn lượn mềm mại với lớp sơn men màu ngọc bích đã nhuốm màu thời gian.\n\n' +
        'Cụm đồng hồ tròn, tay lái mạ chrome bóng loáng và yên da bò nâu sẫm khâu tay thủ công.\n\n' +
        'Một biểu tượng phong cách thanh lịch không bao giờ lỗi thời.',
    },
    {
      title: 'Bọt sóng biển vỗ vào ghềnh đá đen Phú Yên',
      theme: 'Tốc độ màn trập cao đóng băng hàng triệu hạt nước li ti văng trong không trung',
      script:
        'Cơn sóng xanh ngắt đập mạnh vào cột đá bazan hình lục lăng tổ ong đen tuyền.\n\n' +
        'Hàng triệu hạt nước trắng xóa lơ lửng giữa không trung, phản chiếu ánh sáng mặt trời lấp lánh như kim cương vụn.\n\n' +
        'Khoảnh khắc sức mạnh dữ dội của biển khơi được cô đọng hoàn hảo.',
    },
    {
      title: 'Tách cà phê Espresso với lớp crema vàng óng',
      theme: 'Độ sánh mịn màng và những vệt hổ phách chuyển động trong tách gốm mộc',
      script:
        'Lớp crema dày mịn màu nâu vàng hổ phách nổi bồng bềnh trên cốt cà phê đen đặc sánh.\n\n' +
        'Làn khói mỏng nghi ngút bốc lên mang theo hương thơm nồng nàn của hạt cà phê Arabica vừa rang xay.\n\n' +
        'Một bức ảnh kích thích mọi giác quan của người yêu cà phê đích thực.',
    },
  ],

  // 14. Template: film_cinematic (20 mục)
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
    {
      title: 'Tách cà phê phin nhỏ giọt bên quán nhạc Trịnh',
      theme: 'Màu phim nhựa Kodak 500T tông ấm hạt grain: giọt cà phê đen nhỏ xuống ly thủy tinh, khói thuốc lá mờ ảo và giai điệu Trịnh Công Sơn da diết.',
      script:
        'Trong góc quán cà phê nhỏ nhuốm màu thời gian, giai điệu nhạc Trịnh vang lên trầm buồn qua chiếc loa thùng cổ điển.\n\n' +
        'Từng giọt cà phê đen đặc sánh tí tách rơi chầm chậm qua chiếc phin nhôm cũ, đo đếm nhịp điệu của một buổi chiều sống chậm giữa lòng phố thị.\n\n' +
        'Hạt grain phim nhựa 35mm ấm áp kết hợp cùng ánh sáng ngược rọi qua làn khói mỏng manh, tạo nên một không gian điện ảnh giàu chất thơ.\n\n' +
        'Nơi ký ức và hiện tại giao hòa trong một nốt trầm sâu lắng của tâm hồn.',
    },
    {
      title: 'Căn phòng gác mái với máy quay phim cũ',
      theme: 'Ánh sáng cam hoàng hôn hắt qua cửa sổ mái bo tròn, cuộn phim 16mm nằm trên bàn gỗ bừa bộn và chiếc máy chiếu quay cót lách cách.',
      script:
        'Căn phòng gác mái nhỏ chứa đầy những cuộn phim nhựa 16mm và những poster điện ảnh kinh điển của thế kỷ trước.\n\n' +
        'Ánh nắng hoàng hôn màu hổ phách rọi xiên qua ô cửa sổ tròn, làm bừng sáng những hạt bụi li ti nhảy múa quanh chiếc máy chiếu phim cổ.\n\n' +
        'Tiếng bánh răng quay cót lách cách vang lên đều đặn, phóng chiếu lên bức tường vôi trắng những thước phim đen trắng về một mối tình thời hoa mộng.\n\n' +
        'Điện ảnh phim nhựa không bao giờ chết, nó sống mãi như một ngọn lửa sưởi ấm những trái tim hoài niệm.',
    },
    {
      title: 'Ánh hoàng hôn cam nhuộm đỏ bờ biển vắng',
      theme: 'Tông màu cam xanh Teal & Orange chuẩn điện ảnh: sóng biển vỗ bờ cát dài, bóng người đơn độc bước đi dưới bầu trời rực lửa.',
      script:
        'Mặt trời như một hòn than hồng khổng lồ từ từ chìm xuống đường chân trời đại dương bao la thăm thẳm.\n\n' +
        'Bầu trời chuyển mình thành một dải quang phổ tuyệt mỹ từ sắc cam cháy rực rỡ đến tím than sâu thẳm, phản chiếu lung linh trên mặt cát ướt triều rút.\n\n' +
        'Bóng dáng người lữ khách đơn độc sải bước dài dọc theo bờ sóng, để lại những dấu chân chầm chậm bị sóng biển xóa nhòa.\n\n' +
        'Một khung hình màn ảnh rộng widescreen gợi lên cảm giác tự do vô tận và sự nhỏ bé của kiếp người trước vũ trụ.',
    },
    {
      title: 'Cuộc gặp gỡ tình cờ dưới mái hiên trú mưa',
      theme: 'Màn mưa trắng xóa phố cổ, hai chiếc ô ướt sũng tựa vào góc tường, ánh mắt ngượng ngùng chạm nhau dưới mái hiên rêu phong.',
      script:
        'Cơn mưa rào mùa hạ bất chợt ập xuống góc phố cổ khiến dòng người hối hả tấp vào mái hiên cũ trú tạm.\n\n' +
        'Hai con người xa lạ vô tình đứng sát cạnh nhau dưới khoảng hiên chật hẹp, lắng nghe tiếng mưa rơi rả rích trên mái ngói âm dương.\n\n' +
        'Một cái liếc nhìn ngập ngừng bẽn lẽn, một nụ cười khẽ chạm nhau xua tan đi cái lạnh buốt của cơn mưa chiều.\n\n' +
        'Điện ảnh luôn bắt đầu từ những điều tình cờ và dung dị nhất như thế.',
    },
    {
      title: 'Chiếc xe cub 50 chở thanh xuân rực rỡ',
      theme: 'Chiếc xe Super Cub màu xanh ngọc lướt qua con đường đê làng quê ngập tràn cỏ may, tà áo trắng bay bay trong gió chiều hoàng hôn.',
      script:
        'Tiếng động cơ xe Cub 50 giòn giã nổ đều trên con đường đê làng uốn lượn giữa hai bờ cỏ may xanh ngắt.\n\n' +
        'Đôi bạn trẻ đèo nhau trong buổi chiều lộng gió, tiếng cười đùa trong trẻo hòa cùng tiếng chuông xe đạp lách cách ngân vang.\n\n' +
        'Tà áo trắng nữ sinh bay phấp phới trong ánh nắng vàng mật ong nhuộm đỏ cả một vùng ký ức thanh xuân tươi đẹp.\n\n' +
        'Những ngày tháng vô tư lự ấy, ta chẳng có gì trong tay ngoài một trái tim can đảm và những giấc mơ bay xa.',
    },
    {
      title: 'Tiệm ảnh chụp phim đen trắng lưu giữ thời gian',
      theme: 'Căn phòng tối với ánh đèn đỏ an toàn, bức ảnh chân dung dần dần hiện hình trong khay hóa chất thuốc hiện hình mờ ảo.',
      script:
        'Trong căn phòng tối mờ ảo chỉ duy nhất một bóng đèn đỏ an toàn thắp sáng, thời gian dường như ngưng đọng lại.\n\n' +
        'Bức giấy ảnh trắng tinh nhúng chầm chậm vào khay hóa chất thuốc hiện hình, khẽ lắc nhẹ đều tay theo từng nhịp thở.\n\n' +
        'Và rồi từng đường nét ngũ quan, ánh mắt và nụ cười rạng rỡ của nhân vật từ từ hiện hình rõ nét như một phép màu kỳ diệu.\n\n' +
        'Nghệ thuật tráng rọi phim thủ công lưu giữ không chỉ hình ảnh, mà cả linh hồn và cảm xúc chân thật nhất của khoảnh khắc đã qua.',
    },
    {
      title: 'Bản tình ca từ chiếc máy phát đĩa than',
      theme: 'Cây kim máy đĩa than chạm nhẹ vào rãnh đĩa than vinyl đen bóng, tiếng nổ lách tách mộc mạc và giọng ca Jazz ngọt ngào lan tỏa.',
      script:
        'Cây kim đọc bằng kim cương nhẹ nhàng hạ xuống rãnh xoắn ốc của chiếc đĩa than vinyl đen bóng đang quay đều trên mâm đĩa.\n\n' +
        'Tiếng nổ lách tách mộc mạc đặc trưng của chất âm analog vang lên, mở đường cho một giọng ca Jazz ngọt ngào da diết cất tiếng hát.\n\n' +
        'Ánh sáng vàng dịu từ cây đèn ngủ phản chiếu lên chiếc kèn đồng cổ điển, mang lại cảm giác ấm áp và hoài cổ đến nao lòng.\n\n' +
        'Âm nhạc đích thực không cần sự hoàn hảo tuyệt đối của kỹ thuật số, mà quyến rũ bởi chính sự mộc mạc và chân thành.',
    },
    {
      title: 'Bước chân phiêu lãng qua hẻm phố cổ kính',
      theme: 'Góc máy theo sau lưng nhân vật bước qua con hẻm lát đá rêu phong, ánh đèn lồng đỏ treo cao và tiếng đàn tì bà vẳng lại từ xa.',
      script:
        'Con hẻm nhỏ lát đá xanh quanh co uốn lượn sâu vào lòng khu phố cổ nghìn năm tuổi vắng bóng người qua.\n\n' +
        'Những chiếc đèn lồng đỏ treo cao đung đưa nhè nhẹ trước gió, hắt ánh sáng mờ ảo xuống những cánh cửa gỗ đóng then cài kín mít.\n\n' +
        'Tiếng đàn tì bà réo rắt từ một căn gác lửng nào đó vẳng lại trong đêm khuya thanh vắng, hòa cùng tiếng bước chân phiêu lãng của người lữ khách.\n\n' +
        'Mỗi góc phố cổ đều là một chứng nhân lịch sử đang thì thầm kể lại những thiên tình sử của một thời vàng son đã xa.',
    },
    {
      title: 'Chuyến tàu muộn rời ga mùa đông',
      theme: 'Hơi nước mờ ảo trên kính cửa sổ và ánh đèn vàng ấm áp lùi xa dần',
      script:
        'Tiếng còi tàu xé toang màn đêm tĩnh mịch, bánh sắt nghiến ken két trên đường ray phủ sương buốt giá.\n\n' +
        'Bàn tay chạm nhẹ lên mặt kính mờ hơi nước, vẫy chào bóng hình ai đó đang nhạt nhòa nơi sân ga.\n\n' +
        'Một cuộc chia ly không lời, chỉ có tiếng thở dài quyện vào gió lạnh mùa đông.',
    },
    {
      title: 'Cuộc rượt đuổi trong con hẻm mưa Tokyo',
      theme: 'Ánh đèn neon xanh đỏ phản chiếu trên áo mưa bóng loáng và mặt đường ướt sũng',
      script:
        'Bước chân dồn dập nện trên vũng nước mưa, tiếng thở dốc hòa cùng tiếng còi xe cảnh sát từ xa vọng lại.\n\n' +
        'Bóng đen lướt nhanh qua bảng hiệu quán mì ramen bốc khói, biến mất sau góc ngoặt tăm tối.\n\n' +
        'Một thước phim hành động nghẹt thở mang đậm phong cách điện ảnh trinh thám đương đại.',
    },
    {
      title: 'Buổi chiều tàn bên bờ biển vắng',
      theme: 'Màu phim 35mm hoài niệm với dải mây hồng đào buông lơi trên mặt biển lặng',
      script:
        'Gió biển thổi tung mái tóc rối, tiếng sóng vỗ rì rào như thì thầm những ký ức xưa cũ.\n\n' +
        'Chiếc máy quay cổ điển ghi lại những bước chân trần in trên bờ cát mịn, dần bị sóng xóa nhòa.\n\n' +
        'Nỗi buồn dịu dàng của tuổi trẻ, đẹp đẽ và vĩnh cửu như một giấc mơ trôi qua.',
    },
    {
      title: 'Đối đầu trên cây cầu sương mù London',
      theme: 'Hai điệp viên gặp nhau lúc nửa đêm trong không khí căng thẳng nghẹt thở',
      script:
        'Ánh đèn đường mờ mịt chỉ soi rõ tà áo măng tô dài và chiếc mũ phớt che nửa khuôn mặt.\n\n' +
        'Một chiếc phong bì nâu được trao tay trong im lặng, không một ánh mắt liếc nhìn.\n\n' +
        'Số phận của một đế chế tình báo được định đoạt chỉ trong vài tích tắc thinh lặng.',
    },
    {
      title: 'Nhảy điệu Waltz dưới cơn mưa rào Paris',
      theme: 'Cặp tình nhân say đắm quên hết thế giới xung quanh dưới chân tháp Eiffel',
      script:
        'Cơn mưa rào mùa hạ bất chợt ập xuống đại lộ Champs-Élysées khiến mọi người vội vã tìm nơi trú ẩn.\n\n' +
        'Nhưng họ vẫn ở lại, xoay tròn theo giai điệu vô hình của con tim, giày ướt sũng nện trên mặt đá lát.\n\n' +
        'Tình yêu biến cơn mưa lạnh thành bản giao hưởng lãng mạn nhất thế gian.',
    },
    {
      title: 'Người lính già tìm lại chiến trường xưa',
      theme: 'Bước chân cô đơn trên cánh đồng cỏ lau xanh ngút ngàn miền Trung',
      script:
        '50 năm trôi qua, bom đạn đã lùi vào dĩ vãng, chỉ còn cỏ lau đung đưa trong gió chiều xào xạc.\n\n' +
        'Bàn tay run rẩy thắp nén nhang thơm cắm xuống mô đất vô danh, mắt ngấn lệ nhớ về đồng đội tuổi đôi mươi.\n\n' +
        'Bản hùng ca bi tráng về sự hy sinh và giá trị thiêng liêng của hòa bình.',
    },
    {
      title: 'Chuyến xe buýt cuối cùng lúc 1 giờ sáng',
      theme: 'Những con người xa lạ mang nỗi niềm riêng ngồi lặng im dưới ánh đèn huỳnh quang nhấp nháy',
      script:
        'Chiếc xe buýt cũ kỹ chầm chậm lăn bánh qua những đại lộ vắng tanh của thành phố không ngủ.\n\n' +
        'Một cô gái tựa đầu vào cửa kính nghe nhạc buồn, một chàng trai trẻ ngủ gục sau ca làm thêm kiệt sức.\n\n' +
        'Thành phố triệu dân nhưng ai cũng ôm ấp một ốc đảo cô đơn của riêng mình.',
    },
    {
      title: 'Hồi ức quán cà phê sách cũ ở Florence',
      theme: 'Màu phim hạt ấm áp với bụi nắng nhảy múa trên những kệ sách gỗ khổng lồ',
      script:
        'Hương thơm của giấy cũ quyện với mùi cà phê rang mộc tạo nên một không gian tách biệt khỏi thực tại.\n\n' +
        'Ngón tay lướt qua gáy những cuốn thơ tình thế kỷ 19, bất chợt tìm thấy một cánh hoa khô kẹp từ trăm năm trước.\n\n' +
        'Thời gian dường như ngủ quên trong thánh đường của những con chữ.',
    },
    {
      title: 'Phiên tòa xét xử bí mật trong lâu đài cổ',
      theme: 'Ánh sáng đổ bóng kiểu Rembrandt đầy kịch tính và quyền lực ngầm',
      script:
        'Bức tường đá dày hàng mét cách ly căn phòng khỏi ánh sáng ban ngày, chỉ có ánh nến chập chờn soi bóng những chiếc áo choàng đen.\n\n' +
        'Lời tuyên án vang lên lạnh lùng, định đoạt số phận của gia tộc quyền quý nhất vương triều.\n\n' +
        'Mọi bí mật đen tối nhất lịch sử sắp sửa được hé lộ.',
    },
    {
      title: 'Khởi đầu mới nơi trạm xăng ven sa mạc Nevada',
      theme: 'Chiếc xe mui trần cổ dừng chân dưới bầu trời hoàng hôn đỏ rực Route 66',
      script:
        'Bụi cát sa mạc bám đầy kính chắn gió, radio phát giai điệu Country rock mộc mạc và phóng khoáng.\n\n' +
        'Bỏ lại sau lưng thành phố phù hoa và những thất bại cay đắng, trước mắt là con đường cao tốc thẳng tắp kéo dài vô tận.\n\n' +
        'Chuyến đi tìm lại chính mình trên vùng đất của sự tự do bất tận.',
    },
  ],

  // 15. Template: noir_thriller (20 mục)
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
    {
      title: 'Cuộc gọi tống tiền lúc 12 giờ đêm từ số lạ',
      theme: 'Điện thoại bàn xoay số reo vang trong căn phòng tối, người đàn ông nhấc máy với điếu thuốc đỏ rực và giọng nói biến âm đe dọa.',
      script:
        'Đúng 12 giờ đêm, chiếc điện thoại bàn cổ điển bỗng reo lên từng hồi chuông chát chúa xé tan bầu không khí ngột ngạt của căn phòng tối.\n\n' +
        'Người thám tử nhấc ống nghe, ánh lửa đầu điếu thuốc lóe sáng soi rõ những giọt mồ hôi lạnh rịn trên trán.\n\n' +
        '\'Nếu anh còn tiếp tục đào xới vụ án khu cảng bỏ hoang, người tiếp theo biến mất sẽ là người quan trọng nhất của anh!\' — giọng nói đã qua thiết bị biến âm lạnh lùng cảnh báo.\n\n' +
        'Trò chơi mèo vờn chuột nguy hiểm đã chính thức bắt đầu trong màn đêm đen tối không lối thoát.',
    },
    {
      title: 'Nhân chứng then chốt biến mất không dấu vết',
      theme: 'Căn phòng trọ bị xáo trộn tung tóe, tách trà còn bốc khói trên bàn và chiếc ô bị bỏ lại bên hiên cửa sổ mở toang trong đêm mưa.',
      script:
        'Khi cánh cửa phòng trọ bị đạp tung, cảnh tượng trước mắt khiến viên cảnh sát hình sự lạnh cả sống lưng.\n\n' +
        'Tài liệu bị xáo trộn tung tóe dưới sàn nhà, tách trà trên bàn vẫn còn bốc làn khói mỏng manh nhưng nhân chứng duy nhất của vụ đại án tham nhũng đã biến mất không dấu vết.\n\n' +
        'Cửa sổ phía sau mở toang hứng trọn những cơn mưa gió quất vào sàn gỗ, để lại vài dấu giày bết bùn đất hướng về phía bờ kênh tăm tối.\n\n' +
        'Kẻ thủ ác luôn đi trước cơ quan điều tra đúng một bước chân chí mạng.',
    },
    {
      title: 'Bí mật sau chiếc két sắt của ông trùm',
      theme: 'Văn phòng tập đoàn tầng 50 đêm muộn, ánh đèn pin le lói xoay ổ khóa két sắt lộ ra cuốn sổ tay bìa da đen ghi chép đường dây ngầm.',
      script:
        'Sau khi vô hiệu hóa hệ thống camera an ninh phức tạp, thám tử tư áp tai vào bề mặt kim loại dày cộp của chiếc két sắt âm tường.\n\n' +
        'Tiếng \'tách... tách... cạch\' của ổ khóa số vang lên nhẹ nhàng, cánh cửa thép nặng nửa tấn từ từ hé mở.\n\n' +
        'Không có cọc tiền hay vàng thỏi lóa mắt, bên trong chỉ vỏn vẹn một cuốn sổ tay bìa da đen ghi lại danh sách những cái tên quyền lực nhất thành phố dính líu vào đường dây rửa tiền xuyên quốc gia.\n\n' +
        'Một quả bom thông tin đủ sức làm rung chuyển toàn bộ giới tài phiệt và chính trường nếu nó được đưa ra ánh sáng.',
    },
    {
      title: 'Án mạng trong phòng kín khách sạn bỏ hoang',
      theme: 'Khách sạn cổ điển phong cách Pháp bị bỏ hoang, căn phòng số 404 niêm phong dải băng vàng, thi thể gục trên bàn viết thư không có hung khí.',
      script:
        'Căn phòng số 404 của khách sạn Continental bỏ hoang từ thập niên 80 bị khóa chặt bằng hai then cài bên trong.\n\n' +
        'Nạn nhân gục chết trên chiếc bàn viết thư bằng gỗ sồi với một lá thư tuyệt mệnh viết dở, hoàn toàn không có bất kỳ dấu hiệu cạy phá hay hung khí nào tại hiện trường.\n\n' +
        'Làm thế nào hung thủ có thể đoạt mạng nạn nhân và thoát ra ngoài khi toàn bộ cửa sổ đều được hàn chấn song sắt kiên cố?\n\n' +
        'Một vụ án mạng phòng kín hóc búa thách thức mọi bộ óc điều tra tài ba nhất của sở cảnh sát đô thành.',
    },
    {
      title: 'Kẻ hai mặt trong tổ chức phản gián ngầm',
      theme: 'Góc phố đêm mưa phùn, người mang áo măng tô đen trao phong bì tài liệu mật dưới gầm cầu vượt, ánh mắt dò xét đầy nguy hiểm.',
      script:
        'Dưới bóng tối ẩm thấp của chân cầu vượt đường sắt, hai chiếc bóng đen mang áo măng tô dài lặng lẽ tiến lại gần nhau.\n\n' +
        'Một phong bì tài liệu tuyệt mật được tráo đổi nhanh chóng trong tích tắc mà không có một lời nói nào được thốt ra.\n\n' +
        'Nhưng ngay khi người thứ hai vừa quay lưng bước đi, tiếng lên đạn lách cách khô khốc của khẩu súng giảm thanh vang lên sau gáy.\n\n' +
        'Trong thế giới ngầm của tình báo và phản gián, người bạn tin tưởng nhất hôm nay có thể chính là kẻ sẽ tiễn bạn xuống địa ngục vào ngày mai.',
    },
    {
      title: 'Dấu vân tay lạ trên ly rượu vang',
      theme: 'Phòng giám định pháp y ánh đèn huỳnh quang xanh lạnh, bột than quét lên thành ly thủy tinh làm hiện rõ vân tay của một người đã chết 5 năm trước.',
      script:
        'Dưới ánh đèn huỳnh quang màu xanh lạnh buốt của phòng kỹ thuật hình sự, chuyên viên pháp y cẩn thận quét lớp bột huỳnh quang lên thành ly rượu vang pha lê.\n\n' +
        'Dấu vân tay ngón trỏ hiện hình rõ rệt từng đường xoáy phức tạp dưới ống kính kính hiển vi điện tử.\n\n' +
        'Nhưng khi máy chủ cơ sở dữ liệu quốc gia trả về kết quả so khớp danh tính, cả căn phòng bỗng chìm vào sự kinh hãi tột cùng:\n\n' +
        'Dấu vân tay đó thuộc về một thám tử đã được tuyên bố tử nạn trong một vụ nổ kho hàng cách đây đúng 5 năm!',
    },
    {
      title: 'Lá thư nặc danh vạch trần đường dây hối lộ',
      theme: 'Hộp thư rỉ sét trước cửa tòa soạn báo, phong thư không tem niêm phong bằng sáp đỏ chứa thẻ nhớ mã hóa hình ảnh hối lộ triệu đô.',
      script:
        'Sáng sớm tinh mơ, người phóng viên điều tra tìm thấy một phong thư kỳ lạ nhét sâu trong khe hở hộp thư sắt rỉ sét trước nhà.\n\n' +
        'Không có tem thư hay dấu bưu điện, mép phong bì được niêm phong cẩn thận bằng dấu sáp đỏ mang biểu tượng chiếc cân công lý bị gãy đôi.\n\n' +
        'Bên trong là một chiếc thẻ nhớ vi mô chứa đựng hàng trăm tệp âm thanh ghi âm các cuộc ngã giá chạy án hàng triệu đô la của các quan chức cấp cao.\n\n' +
        'Một mồi lửa sự thật đã được nhen nhóm, sẵn sàng thiêu rụi toàn bộ bức màn đen tối đang bao trùm thành phố.',
    },
    {
      title: 'Cuộc đối đầu nghẹt thở giữa mưa giông trên nóc nhà',
      theme: 'Sân thượng tòa nhà chọc trời đêm giông bão sấm chớp, hai bóng người đối đầu nhau dưới họng súng đen ngòm, ánh chớp xé toang màn đêm.',
      script:
        'Mưa giông như thác đổ trên sân thượng tầng 60 của tòa tháp ngân hàng trung tâm, gió rít từng cơn gào thét dữ dội.\n\n' +
        'Hai con người từng là đồng đội vào sinh ra tử nay đứng đối mặt nhau dưới hai họng súng đen ngòm lạnh buốt.\n\n' +
        'Ánh chớp lóe sáng chói lòa xé toang màn đêm tăm tối, soi rõ ánh mắt giằng xé giữa lòng trung thành và nỗi hận thù sâu thẳm của kẻ phản bội.\n\n' +
        '\'Tất cả chúng ta đều chỉ là những quân cờ trong ván cờ này thôi, người bạn cũ ạ!\' — tiếng súng nổ vang rền hòa cùng tiếng sấm sét xé toang bầu trời.',
    },
    {
      title: 'Vết máu trên phím đàn piano jazz',
      theme: 'Quán bar ngầm u tối với làn khói xì gà mờ ảo và vụ ám sát bí ẩn',
      script:
        'Tiếng kèn saxophone ai oán vừa dứt thì một tiếng súng giảm thanh vang lên sắc lẹm.\n\n' +
        'Người nghệ sĩ gục ngã trên bàn phím, để lại một nốt nhạc chói tai và giọt máu đỏ tươi loang trên phím ngà trắng muốt.\n\n' +
        'Ai là kẻ có động cơ giết chết một huyền thoại âm nhạc mang quá nhiều bí mật của giới mafia?',
    },
    {
      title: 'Bức thư nặc danh gửi thám tử tư lúc nửa đêm',
      theme: 'Căn phòng làm việc tồi tàn với ánh đèn neon chớp tắt ngoài cửa sổ rèm sáo',
      script:
        'Phong bì đen không tem dán được nhét qua khe cửa gỗ cùng một tấm ảnh chụp mờ nhạt từ góc khuất.\n\n' +
        'Nạn nhân trong ảnh chính là thị trưởng thành phố, người vừa tuyên bố chiến dịch bài trừ tham nhũng hôm qua.\n\n' +
        'Lời nhắn vỏn vẹn 4 chữ: \'Đừng điều tra nữa nếu muốn sống\'.',
    },
    {
      title: 'Bóng đen dưới chân cột đèn đường sương mù',
      theme: 'Không khí căng thẳng tột độ khi kẻ sát nhân bám theo nhân chứng duy nhất',
      script:
        'Tiếng giày da nện đều đặn phía sau lưng, nhanh hơn theo từng nhịp tim đang đập loạn xạ.\n\n' +
        'Màn sương mù dày đặc nuốt chửng bóng dáng kẻ theo dõi, chỉ còn tàn thuốc lá đỏ rực le lói trong bóng đêm.\n\n' +
        'Trong thành phố tội lỗi này, công lý chỉ là món hàng xa xỉ.',
    },
    {
      title: 'Chiếc vali tiền chuộc dưới ga tàu điện ngầm bỏ hoang',
      theme: 'Mùi ẩm mốc của đường hầm ngầm và tiếng nước nhỏ giọt đều đặn như đếm ngược',
      script:
        'Cú điện thoại từ bốt công cộng vang lên hồi chuông thứ ba, yêu cầu đặt tiền vào thùng rác số 4.\n\n' +
        'Ánh đèn pin quét qua những bức tường graffiti bong tróc, phát hiện vết cào xước còn mới của móng tay người.\n\n' +
        'Trò chơi mèo vờn chuột giữa cảnh sát biến chất và tên bắt cóc thiên tài chính thức bắt đầu.',
    },
    {
      title: 'Người phụ nữ mặc váy đỏ trong màn mưa',
      theme: 'Nhân vật femme fatale đầy quyến rũ nhưng ẩn chứa cạm bẫy chết người',
      script:
        'Đôi môi đỏ thẫm mỉm cười sau làn khói thuốc lá bạc hà thơm nồng quyến rũ.\n\n' +
        'Cô ta bước vào văn phòng thám tử với đôi mắt ướt lệ cầu cứu, nhưng trong túi xách lại giấu một khẩu súng lục nạp sẵn đạn.\n\n' +
        'Tin lời một người phụ nữ nguy hiểm là sai lầm đầu tiên và cuối cùng của một thám tử.',
    },
    {
      title: 'Tập hồ sơ vụ án chìm 20 năm trước',
      theme: 'Những trang giấy ố vàng lưu giữ bí mật kinh hoàng của thị trấn ven biển',
      script:
        'Tập hồ sơ ghi nhãn \'Tự tử\' nhưng những bức ảnh hiện trường lại tiết lộ các nút thắt dây thừng bất thường.\n\n' +
        'Tất cả các nhân chứng năm xưa đều lần lượt qua đời vì những tai nạn bất ngờ và đáng ngờ.\n\n' +
        'Sự thật chôn vùi dưới đáy biển sâu đang trồi lên đòi lại món nợ máu.',
    },
    {
      title: 'Cuộc thẩm vấn nghẹt thở trong phòng giam kín',
      theme: 'Chiếc bàn kim loại lạnh ngắt và ánh đèn bàn duy nhất rọi thẳng vào gương mặt kẻ tình nghi',
      script:
        'Hai giờ đồng hồ im lặng tuyệt đối, chỉ có tiếng kim đồng hồ tích tắc gõ nhịp tâm lý chiến.\n\n' +
        'Tên sát thủ máu lạnh nở nụ cười nhạt thách thức: \'Các ông không có bằng chứng, và thời gian của các ông sắp hết rồi\'.\n\n' +
        'Cuộc đấu trí sinh tử giữa lý trí của người điều tra và sự điên cuồng của tội phạm.',
    },
    {
      title: 'Nhà kho số 9 bên bến cảng đen',
      theme: 'Giao dịch ma túy lúc rạng sáng giữa các băng đảng khét tiếng',
      script:
        'Những chiếc container rỉ sét xếp chồng chất như mê cung che giấu đoàn xe bọc thép đen tuyền.\n\n' +
        'Súng AK lên đạn lách cách khi chiếc vali chứa hàng mẫu được bật mở dưới ánh đèn pha chói mắt.\n\n' +
        'Một tiếng súng ngắm bất ngờ xé toang màn đêm biến cuộc giao dịch thành bể máu tàn khốc.',
    },
    {
      title: 'Cuốn sổ tay mật mã của điệp viên hai mang',
      theme: 'Những con số và ký hiệu cổ xưa che giấu danh tính kẻ phản bội tối cao',
      script:
        'Cuốn sổ da rách mép được giấu kỹ sau bức tranh sơn dầu cổ điển trong biệt thự ven hồ.\n\n' +
        'Giải mã từng trang sách cũng là lúc vị thanh tra nhận ra kẻ chủ mưu lại chính là cấp trên đáng kính nhất của mình.\n\n' +
        'Khi ranh giới giữa chính nghĩa và phản trắc bị xóa nhòa hoàn toàn.',
    },
    {
      title: 'Gã hề tàn nhẫn trong rạp xiếc hoang tàn',
      theme: 'Không khí rùng rợn tâm lý giật gân tại công viên giải trí đóng cửa nhiều năm',
      script:
        'Chiếc vòng quay ngựa gỗ rỉ sét kẽo kẹt quay trong gió đêm rít qua khe cửa vỡ.\n\n' +
        'Tiếng cười the thé vang vọng khắp căn lều xiếc tăm tối, dẫn lối người cảnh sát vào chiếc bẫy gương vô tận.\n\n' +
        'Nơi nỗi sợ hãi nguyên thủy nhất của con người biến thành hiện thực tàn khốc.',
    },
  ],

  // 16. Template: vox_papercut (20 mục)
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
    {
      title: 'Bí mật chuỗi cung ứng chip bán dẫn toàn cầu',
      theme: 'Đồ họa cắt giấy minh họa quy trình sản xuất chip: từ cát thạch anh silicon đến nhà máy quang khắc EUV hiện đại của ASML.',
      script:
        'Một con chip vi xử lý nhỏ bằng móng tay nhưng chứa đựng chuỗi cung ứng phức tạp và đắt đỏ nhất lịch sử nhân loại.\n\n' +
        'Khởi đầu từ cát thạch anh tinh khiết được nung chảy ở nhiệt độ 1.400 độ C để tạo thành những thỏi silicon độ tinh khiết 99.9999999%.\n\n' +
        'Cỗ máy quang khắc EUV của Hà Lan trị giá 200 triệu đô la sử dụng tia laser cực tím chiếu hàng tỷ bóng bán dẫn lên bề mặt tấm wafer với độ chính xác đến từng nanomet.\n\n' +
        'Bất kỳ sự đứt gãy nào trong chuỗi cung ứng toàn cầu này cũng đủ sức làm tê liệt ngành công nghiệp ô tô, smartphone và hàng không thế giới.',
    },
    {
      title: 'Tại sao giá nhà đất tăng vọt trong 20 năm qua?',
      theme: 'Biểu đồ cắt giấy xếp lớp: so sánh tốc độ tăng trưởng thu nhập bình quân vs tốc độ tăng giá đất và quá trình đô thị hóa thần tốc.',
      script:
        'Tại sao thế hệ trẻ ngày nay cảm thấy việc sở hữu một căn nhà riêng trở nên xa vời hơn bao giờ hết so với thế hệ cha ông?\n\n' +
        'Đồ họa xếp lớp phân tích hai yếu tố cốt lõi: tốc độ tăng thu nhập trung bình chỉ tăng khoảng 4 đến 6 lần trong vòng 20 năm qua.\n\n' +
        'Nhưng giá đất tại các đại đô thị lại phi mã tới 20 đến 30 lần do làn sóng đô thị hóa di dân cơ học và chính sách nới lỏng tiền tệ kích thích đầu cơ tài sản.\n\n' +
        'Đất đai là tài nguyên hữu hạn không thể sinh thêm, trong khi dòng tiền và dân số đổ về thành phố lại tăng trưởng không ngừng.',
    },
    {
      title: 'Pin xe điện hoạt động như thế nào và tương lai ra sao?',
      theme: 'Mô hình cắt giấy 3D thỏi pin Lithium-ion: dòng chảy electron giữa cực âm Graphite và cực dương Nickel-Cobalt, thách thức tái chế.',
      script:
        'Trái tim của cuộc cách mạng giao thông xanh toàn cầu nằm trọn vẹn trong các cell pin Lithium-ion đang cung cấp năng lượng cho hàng triệu chiếc xe điện.\n\n' +
        'Khi sạc điện, các ion Lithium di chuyển từ cực dương giàu kim loại quý Nickel-Cobalt qua dung dịch điện phân sang cực âm cấu tạo từ than chì Graphite.\n\n' +
        'Khi xả điện để chạy động cơ, dòng electron chảy qua mạch ngoài tạo ra dòng điện cung cấp công suất hàng trăm mã lực chỉ trong tích tắc.\n\n' +
        'Tương lai của pin thể rắn Solid-State đang mở ra kỷ nguyên mới: sạc đầy trong 10 phút, quãng đường 1.000km và loại bỏ hoàn toàn nguy cơ cháy nổ!',
    },
    {
      title: 'Chu kỳ kinh tế: Tại sao khủng hoảng lại lặp lại?',
      theme: 'Biểu đồ hình sin cắt giấy Vox: chu kỳ mở rộng tín dụng, bong bóng tài sản vỡ vụn, suy thoái và quá trình tái cấu trúc nợ.',
      script:
        'Cứ trung bình sau 8 đến 12 năm, nền kinh tế thế giới lại trải qua một đợt suy thoái trầm trọng. Đây không phải sự ngẫu nhiên, mà là bản chất của chu kỳ nợ.\n\n' +
        'Giai đoạn hưng thịnh: lãi suất thấp kích thích các doanh nghiệp và cá nhân vay nợ ồ ạt để đầu cơ mở rộng sản xuất, đẩy giá tài sản lên cao chót vót.\n\n' +
        'Khi lạm phát bùng nổ, ngân hàng trung ương buộc phải tăng lãi suất để kiềm chế, chi phí trả nợ tăng vọt khiến các bong bóng tài sản vỡ tung.\n\n' +
        'Hiểu được quy luật chu kỳ kinh tế sẽ giúp bạn chủ động phòng ngừa rủi ro và chớp lấy cơ hội làm giàu khi thị trường chạm đáy.',
    },
    {
      title: 'Đường đi của một gói hàng thương mại điện tử',
      theme: 'Bản đồ cắt giấy chuyển động: từ cú nhấp chuột mua hàng, robot kho thông minh tự động phân loại, máy bay chở hàng đến shipper giao tận cửa.',
      script:
        'Chỉ một cú chạm \'Đặt hàng\' trên màn hình điện thoại, bạn đã kích hoạt một cỗ máy logistics xuyên biên giới vận hành với độ chính xác đến từng giây.\n\n' +
        'Robot tự động AGV trong kho hàng thông minh tự động di chuyển lấy kiện hàng, đóng gói dán mã vạch và phân luồng vào băng chuyền chỉ trong 3 phút.\n\n' +
        'Các chuyến bay chở hàng ban đêm vận chuyển hàng ngàn tấn kiện hàng vượt hàng ngàn cây số đến các trung tâm chia chọn vùng.\n\n' +
        'Đến 8 giờ sáng hôm sau, nhân viên giao hàng đã có mặt trước cửa nhà bạn với món hàng nguyên vẹn — kỳ tích của chuỗi cung ứng hiện đại!',
    },
    {
      title: 'Cơ chế sinh học khi bộ não nghiện lướt mạng xã hội',
      theme: 'Mô hình cắt giấy giải phẫu não bộ: tuyến dopamin kích hoạt sau mỗi cú vuốt ngón tay, vòng lặp thói quen gợi mở - hành động - phần thưởng.',
      script:
        'Tại sao bạn chỉ định mở điện thoại kiểm tra tin nhắn nhưng lại vô thức lướt video ngắn suốt 2 tiếng đồng hồ liền?\n\n' +
        'Các kỹ sư thuật toán đã khéo léo biến smartphone thành một cỗ máy đánh bạc Slot Machine mini trong lòng bàn tay bạn.\n\n' +
        'Mỗi cú vuốt ngón tay lên là một lần bộ não được kích hoạt vòng lặp phần thưởng biến đổi không thể đoán trước, giải phóng từng đợt Dopamine kích thích hưng phấn.\n\n' +
        'Nhận thức được cơ chế thao túng tâm lý này là bước đầu tiên để bạn giành lại quyền kiểm soát thời gian và sự tập trung của chính mình!',
    },
    {
      title: 'Sự thật về giấc ngủ trưa 15 phút',
      theme: 'Khoa học giải thích vì sao giấc ngủ ngắn kích hoạt lại toàn bộ năng lượng não bộ',
      script:
        'Bạn có biết ngủ trưa quá 30 phút sẽ khiến cơ thể mệt mỏi và uể oải hơn cả khi không ngủ?\n\n' +
        'Hiệu ứng \'quán tính giấc ngủ\' xảy ra khi não bộ chìm sâu vào giai đoạn sóng chậm và bị đánh thức đột ngột.\n\n' +
        'Chỉ cần đúng 15 đến 20 phút chợp mắt, não bộ sẽ dọn sạch adenosine và nạp đầy pin cho buổi chiều làm việc hiệu quả.',
    },
    {
      title: 'Bong bóng kinh tế hoa Tulip thế kỷ 17',
      theme: 'Cơn sốt đầu cơ điên cuồng đầu tiên trong lịch sử nhân loại',
      script:
        'Vào năm 1637 tại Hà Lan, một củ hoa tulip giống hiếm có giá tương đương một dinh thự lộng lẫy bên kênh đào Amsterdam.\n\n' +
        'Người người nhà nhà bán sạch đất đai, gia súc để lao vào cơn sốt mua bán các hợp đồng tương lai hoa tulip.\n\n' +
        'Và rồi chỉ sau một đêm, bong bóng vỡ vụn khiến toàn bộ nền kinh tế Hà Lan sụp đổ tan tành.',
    },
    {
      title: 'Tại sao đường sắt cao tốc lại uốn cong thay vì chạy thẳng?',
      theme: 'Giải thích vật lý và địa chất đằng sau thiết kế hạ tầng giao thông hiện đại',
      script:
        'Tuyến đường ngắn nhất giữa hai điểm là đường thẳng, nhưng tại sao đường ray cao tốc Shinkansen lại luôn uốn lượn mềm mại?\n\n' +
        'Lực quán tính ly tâm, địa hình đồi núi, và đặc biệt là sự giãn nở nhiệt của hàng trăm km ray thép đòi hỏi những đường cong chuẩn xác.\n\n' +
        'Kỹ thuật uốn cong tinh tế giúp bảo đảm an toàn tuyệt đối cho đoàn tàu chạy ở vận tốc hơn 300 km/h.',
    },
    {
      title: 'Bí mật đằng sau giá tiền 0.99 đô la',
      theme: 'Tâm lý học tiêu dùng đằng sau hiệu ứng chữ số bên trái',
      script:
        'Tại sao các siêu thị luôn niêm yết giá 199k thay vì làm tròn thành 200k?\n\n' +
        'Bộ não con người đọc số từ trái sang phải, và tiềm thức sẽ tự động neo giá món đồ vào con số 100 thay vì 200 nghìn.\n\n' +
        'Một mánh khóe định giá tâm lý kinh điển đã giúp các nhà bán lẻ gia tăng hàng tỷ USD doanh thu mỗi năm.',
    },
    {
      title: 'Điều gì xảy ra khi bạn ngừng ăn đường trong 14 ngày?',
      theme: 'Phân tích đồ họa sinh động về những biến đổi kỳ diệu bên trong cơ thể',
      script:
        '3 ngày đầu tiên là cơn ác mộng khi não bộ đòi hỏi dopamine từ đường, gây cảm giác bồn chồn và thèm ăn dữ dội.\n\n' +
        'Nhưng từ ngày thứ 7, gan bắt đầu đốt mỡ thừa để tạo năng lượng, làn da giảm viêm mụn rõ rệt và tinh thần tỉnh táo phi thường.\n\n' +
        'Sau 14 ngày, vị giác của bạn được tái thiết lập để cảm nhận vị ngọt tự nhiên của rau củ.',
    },
    {
      title: 'Lịch sử phát minh ra chiếc dĩa ăn phương Tây',
      theme: 'Hành trình từ món đồ bị coi là dị giáo đến dụng cụ bàn ăn phổ biến toàn cầu',
      script:
        'Vào thế kỷ 11, một công chúa Byzantine mang chiếc dĩa hai răng đến Venice và bị các giáo sĩ chỉ trích dữ dội vì coi đó là sự ngạo mạn chống lại tự nhiên.\n\n' +
        'Người châu Âu từng dùng tay bốc thức ăn suốt hàng ngàn năm trước khi chiếc dĩa được chấp nhận tại triều đình Pháp vào thế kỷ 16.\n\n' +
        'Một câu chuyện văn hóa ẩm thực đầy bất ngờ và thú vị qua những nét vẽ cắt giấy.',
    },
    {
      title: 'Hiệu ứng cánh bướm tác động đến lịch sử thế giới ra sao?',
      theme: 'Một quyết định nhỏ nhặt làm thay đổi vận mệnh của cả nhân loại',
      script:
        'Năm 1914, tài xế chở Thái tử Áo-Hung rẽ nhầm vào một ngõ cụt ở Sarajevo, tình cờ dừng ngay trước quán cà phê nơi tên ám sát Gavrilo Princip đang ngồi.\n\n' +
        'Phát súng định mệnh nổ ra, kích hoạt chuỗi liên minh quân sự và đẩy nhân loại vào Thế chiến thứ nhất đẫm máu.\n\n' +
        'Một khúc quanh ngẫu nhiên của lịch sử đã định hình lại bản đồ địa chính trị toàn cầu.',
    },
    {
      title: 'Tại sao chim cánh cụt không bị đóng băng chân ở Nam Cực?',
      theme: 'Cơ chế trao đổi nhiệt ngược dòng kỳ diệu của sinh học',
      script:
        'Đứng trên tảng băng âm 40 độ C suốt nhiều tháng ròng nhưng chân chim cánh cụt không hề bị hoại tử hay dính chặt vào băng.\n\n' +
        'Hệ thống mạch máu ở chân chim hoạt động như một bộ tản nhiệt thông minh: máu nóng từ tim sưởi ấm máu lạnh từ bàn chân trước khi quay về tim.\n\n' +
        'Một kiệt tác tiến hóa sinh học đáng kinh ngạc của thế giới tự nhiên.',
    },
    {
      title: 'Bản đồ ngầm dưới lòng thành phố Paris',
      theme: 'Mê cung hầm mộ Catacombs chứa hơn 6 triệu bộ hài cốt',
      script:
        'Phía dưới những đại lộ hoa lệ và bảo tàng Louvre là một mạng lưới hầm đá vôi dài hơn 300 km u tối và bí ẩn.\n\n' +
        'Vào thế kỷ 18, các nghĩa trang Paris quá tải buộc chính quyền phải di dời hàng triệu bộ xương người xuống các mỏ đá cũ.\n\n' +
        'Thế giới ngầm song song mang đậm màu sắc lịch sử và huyền bí của kinh đô ánh sáng.',
    },
    {
      title: 'Vì sao máy bay thương mại luôn sơn màu trắng?',
      theme: 'Lý do kinh tế, nhiệt động lực học và an toàn hàng không',
      script:
        'Màu trắng phản xạ ánh nắng mặt trời tốt nhất, giúp khoang hành khách luôn mát mẻ và giảm chi phí chạy điều hòa khi đỗ tại sân bay.\n\n' +
        'Ngoài ra, lớp sơn trắng giúp các kỹ sư dễ dàng phát hiện các vết nứt kim loại, rò rỉ dầu hay vết va đập của chim trời.\n\n' +
        'Và quan trọng nhất: việc sơn màu phức tạp sẽ làm tăng thêm hàng trăm kg trọng lượng, tiêu tốn thêm hàng triệu lít nhiên liệu mỗi năm.',
    },
  ],

  // 17. Template: docu_warm (20 mục)
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
    {
      title: 'Mùa làm muối trắng nhọc nhằn của diêm dân',
      theme: 'Cánh đồng muối trắng xóa lấp lánh nắng hè miền Trung, người diêm dân gánh đôi bồ muối nặng trĩu dưới cái nắng chói chang 40 độ C.',
      script:
        'Nắng càng gay gắt đổ lửa, mồ hôi càng túa ra ướt đẫm lưng áo thì hạt muối của người diêm dân miền Trung lại càng kết tinh trắng muốt và đậm vị.\n\n' +
        'Từ sáng sớm tinh mơ, họ đã phải dẫn nước biển vào ruộng, cào phẳng mặt cát và chờ đợi ánh nắng thiêu đốt làm bay hơi nước.\n\n' +
        'Đôi gánh muối nặng oằn trên vai trần đen bóng của người phụ nữ miền biển, từng bước chân trần bấm sâu trên nền ruộng nóng rát.\n\n' +
        'Mỗi hạt muối tinh khiết nêm nếm cho bữa cơm gia đình đều thấm đẫm vị mặn mòi của biển cả và những giọt mồ hôi nhọc nhằn của đời người.',
    },
    {
      title: 'Làng gốm đỏ rực bên dòng sông Thu Bồn',
      theme: 'Lò nung gốm đỏ rực khói lam chiều bên dòng sông Thu Bồn, nghệ nhân già dùng đôi chân xoay bàn xoay gốm tạo hình chiếc bình đất sét.',
      script:
        'Bên dòng sông Thu Bồn thơ mộng hữu tình, làng gốm Thanh Hà đã đỏ lửa hơn năm trăm năm qua bao thăng trầm lịch sử.\n\n' +
        'Không dùng máy móc hiện đại, hai người nghệ nhân phối hợp nhịp nhàng: một người dùng chân đạp xoay bàn xoay, một người dùng đôi bàn tay vuốt nặn khối đất sét dẻo quánh.\n\n' +
        'Từng chiếc bình, chiếc vò đất nung mang màu đỏ gạch mộc mạc ra đời, mang theo hơi thở của đất mẹ và ngọn lửa nung truyền đời của tổ tiên.\n\n' +
        'Nét đẹp thủ công mộc mạc và chân thành làm lay động trái tim của bất kỳ du khách nào ghé thăm.',
    },
    {
      title: 'Lớp học tình thương của người cựu chiến binh già',
      theme: 'Căn phòng trọ nhỏ đơn sơ ở xóm nghèo, người thương binh già tóc bạc phơ kiên nhẫn cầm tay nắn từng nét chữ cho trẻ em mồ côi.',
      script:
        'Trở về sau chiến tranh với nhiều vết thương trên cơ thể, người cựu chiến binh già dành trọn phần đời còn lại cho một sứ mệnh cao cả mới.\n\n' +
        'Căn phòng trọ nhỏ đơn sơ rộn rã tiếng đánh vần bi bô của hàng chục đứa trẻ nghèo bán vé số, nhặt ve chai không có điều kiện đến trường chính quy.\n\n' +
        'Thầy giáo già kiên nhẫn cầm tay từng đứa trẻ nắn nót những nét chữ đầu đời, dạy các em cách làm người tử tế và biết ước mơ vươn lên.\n\n' +
        'Tình yêu thương thuần khiết không cần đến những giảng đường hoa lệ, nó tỏa sáng rực rỡ từ chính tấm lòng nhân ái bao la của con người.',
    },
    {
      title: 'Đội cứu hộ động vật hoang dã nơi rừng quốc gia',
      theme: 'Khu bảo tồn thiên nhiên xanh thẳm, các chuyên gia tận tình chăm sóc chú tê tê và gấu ngựa được giải cứu khỏi bẫy săn trộm.',
      script:
        'Sâu trong cánh rừng quốc gia bạt ngàn, có một đội ngũ bác sĩ thú y và nhân viên cứu hộ thầm lặng ngày đêm chăm sóc cho những sinh mạng rừng xanh.\n\n' +
        'Những chú tê tê dính bẫy gãy chân, những chú gấu ngựa bị giam cầm trong chuồng sắt chật hẹp được giải cứu và đưa về trạm hồi sức.\n\n' +
        'Từng vết thương được khử trùng khâu vá cẩn thận, từng bữa ăn dinh dưỡng được chuẩn bị tỉ mỉ để giúp các con phục hồi bản năng sinh tồn tự nhiên.\n\n' +
        'Khoảnh khắc mở cửa lồng phóng thích các loài động vật hoang dã trở về với mái nhà rừng già tự do chính là phần thưởng vô giá nhất cho họ.',
    },
    {
      title: 'Nghề dệt chiếu cói truyền thống bên dòng sông cổ',
      theme: 'Những cánh đồng cói xanh rì rào trong gió, sợi cói nhuộm đỏ vàng phơi rực rỡ khắp đường làng và khung cửi dệt dập nhịp nhàng.',
      script:
        'Mỗi độ vào mùa thu hoạch cói, cả làng quê ven sông lại bừng sáng rực rỡ bởi những dải cói nhuộm phẩm màu đỏ, vàng, lục phơi dọc khắp các ngõ xóm.\n\n' +
        'Bên khung dệt gỗ mộc mạc, hai người thợ dệt phối hợp nhịp nhàng đến kinh ngạc: một người dập go, một người nhanh thoăn thoắt đẩy từng sợi cói mượt mà vào khung.\n\n' +
        'Chiếc chiếu cói hoa văn tinh tế, nằm vào mùa hè thì mát rượi, mùa đông lại ấm áp thơm mùi hương đồng nội mộc mạc.\n\n' +
        'Giữ gìn một nghề truyền thống của cha ông không chỉ là mưu sinh, mà là bảo tồn cả một kho tàng văn hóa dân gian quý báu.',
    },
    {
      title: 'Bữa cơm chay miễn phí nơi cửa chùa ấm lòng',
      theme: 'Bếp ăn từ thiện khói nghi ngút, các phật tử tình nguyện viên xới từng bát cơm nóng trao tận tay các bệnh nhân nghèo xóm chạy thận.',
      script:
        '5 giờ sáng mỗi ngày, bếp ăn từ thiện nơi cửa chùa đã đỏ lửa chuẩn bị hàng ngàn suất cơm chay nóng sốt dinh dưỡng.\n\n' +
        'Những người nhận cơm là những bệnh nhân chạy thận nhân tạo nghèo khó, những người lao động lam lũ nhặt rác qua ngày kiếm sống.\n\n' +
        'Một bát cơm trắng dẻo thơm, đĩa rau luộc ngọt lành cùng bát canh đậu phụ thanh đạm trao đi kèm theo một nụ cười hiền hậu và lời chúc sức khỏe chân thành.\n\n' +
        'Giữa phố thị ồn ào và vội vã, sự tử tế bình dị chính là ngọn lửa ấm áp sưởi ấm những mảnh đời bất hạnh.',
    },
    {
      title: 'Giữ gìn tiếng đàn Đáy và điệu hát Ca trù cổ',
      theme: 'Gian nhà cổ mái ngói rêu phong, nghệ nhân cao tuổi gảy từng cung phím đàn Đáy trầm đục, ca nương gõ phách ngân nga khúc hát cổ trang.',
      script:
        'Trong không gian tĩnh mịch của ngôi nhà cổ kính, tiếng phách tre lách cách giòn giã mở đầu cho một điệu hát Ca trù tao nhã nghìn năm tuổi.\n\n' +
        'Cụ ông mái tóc bạc trắng ôm cây đàn Đáy thân dài buông những ngón nhấn nhá trầm đục, ca nương khép hờ mắt ngân rung từng câu thơ cổ tinh tế.\n\n' +
        'Nghệ thuật Ca trù từng đứng trước nguy cơ mai một, nhưng bằng niềm đam mê cháy bỏng của những nghệ nhân tâm huyết, di sản cha ông vẫn được gìn giữ vẹn nguyên.\n\n' +
        'Tiếng đàn tiếng phách nối liền dòng chảy quá khứ và hiện tại, khẳng định sức sống trường tồn của bản sắc văn hóa dân tộc.',
    },
    {
      title: 'Những người lái đò thầm lặng đưa khách qua sông',
      theme: 'Bến sông quê chiều muộn nước mênh mông, bác lái đò mái tóc hoa râm khua mái chèo nhịp nhàng đưa học trò và người dân qua sông bình an.',
      script:
        'Mấy chục năm ròng rã bên bến đò ngang, chiếc thuyền nan mộc mạc của bác lái đò đã đưa đón hàng ngàn chuyến người qua lại đôi bờ dòng sông quê.\n\n' +
        'Từng nhịp chèo khua nước nhịp nhàng, bác chở những đứa trẻ cắp sách đến trường, chở những gánh rau ra chợ sớm và chở cả những người con xa xứ trở về làng.\n\n' +
        'Dù bão giông hay nắng lửa, chưa một lần chuyến đò trễ hẹn với người dân xóm nghèo.\n\n' +
        'Hình ảnh người lái đò cặm cụi khua mái chèo trong ánh hoàng hôn chiều tà là biểu tượng đẹp đẽ của sự tận tụy và đức hy sinh thầm lặng.',
    },
    {
      title: 'Ký ức làng gốm Bát Tràng xưa',
      theme: 'Bàn xoay đất sét và lò bầu đỏ lửa hun hút bên bờ sông Hồng',
      script:
        'Mùi đất sét nồng nàn quyện cùng khói lò củi đã nuôi sống bao thế hệ người thợ gốm ven sông.\n\n' +
        'Từng chiếc ấm chén men lam, bình hoa rạn cổ kính được tạo hình bằng đôi bàn tay chai sần nhưng vô cùng khéo léo.\n\n' +
        'Di sản ngàn năm của cha ông vẫn lặng lẽ chảy trong từng thớ gốm mộc mạc.',
    },
    {
      title: 'Tiếng rao bánh mì Sài Gòn thập niên 90',
      theme: 'Ký ức tuổi thơ gắn liền với giỏ bánh mì nóng giòn trên yên xe đạp cà tàng',
      script:
        '\'Bánh mì Sài Gòn, đặc ruột thơm bơ, hai ngàn một ổ\' - tiếng rao quen thuộc len lỏi qua từng con hẻm nhỏ buổi sáng sớm.\n\n' +
        'Ổ bánh mì vàng ươm kẹp chút patê thơm béo và dưa chua giòn rụm đã nuôi lớn biết bao ước mơ thời khốn khó.\n\n' +
        'Một nét văn hóa bình dị in sâu vào tâm khảm những người con xa quê.',
    },
    {
      title: 'Những nếp nhà rông Tây Nguyên đại ngàn',
      theme: 'Ngọn giáo chọc trời biểu tượng cho sức mạnh và tinh thần đoàn kết buôn làng',
      script:
        'Mái nhà rông cao vút sừng sững giữa bầu trời xanh biếc, được dựng nên từ gỗ rừng và mây tre đan kết.\n\n' +
        'Bên bếp lửa bập bùng giữa sàn gỗ, già làng trầm ngâm kể sử thi Đam San cho lũ trẻ bên ché rượu cần nồng nàn.\n\n' +
        'Linh hồn của núi rừng Tây Nguyên bất diệt theo năm tháng.',
    },
    {
      title: 'Chuyện tình thời bom đạn qua những lá thư tay',
      theme: 'Những dòng mực tím gửi gắm niềm tin son sắt vượt qua tuyến lửa',
      script:
        'Gói ghém trong chiếc ba lô con cóc là bức thư gấp tư nhuộm màu khói bom và bụi đường hành quân.\n\n' +
        'Khoảng cách hàng ngàn cây số và bom đạn khốc liệt không ngăn được những lời hẹn ước ngày đất nước trọn niềm vui.\n\n' +
        'Tình yêu thời chiến giản dị, trong sáng và thiêng liêng đến nao lòng.',
    },
    {
      title: 'Nghề làm giấy dó ngàn năm tuổi làng Phong Khê',
      theme: 'Vỏ cây dướng qua trăm công đoạn giã ngâm để hóa thành trang giấy bền trăm năm',
      script:
        'Từ vỏ cây rừng hoang dại, qua bàn tay tần tảo của người thợ ngâm vôi, bóc vỏ, giã mịn và đãi bột trên khuôn liềm giang.\n\n' +
        'Từng tờ giấy dó xốp nhẹ, dai bền, lưu giữ hồn tranh Đông Hồ rực rỡ sắc màu dân gian qua bao thế kỷ.\n\n' +
        'Vẻ đẹp mộc mạc của một chất liệu thuần Việt trường tồn cùng thời gian.',
    },
    {
      title: 'Mùa nước nổi trên đồng tháp Mười xưa',
      theme: 'Chiếc xuồng ba lá lướt giữa đồng sen ngát hương và bông điên điển vàng rực',
      script:
        'Nước phù sa đỏ quạch tràn về mang theo nguồn tôm cá dồi dào và phù sa màu mỡ cho ruộng đồng miền Tây.\n\n' +
        'Bữa cơm gia đình trên sàn nhà sàn đơn sơ với canh chua cá linh bông điên điển nghi ngút khói.\n\n' +
        'Sự trù phú và hào sảng của thiên nhiên ban tặng cho người dân Nam Bộ.',
    },
    {
      title: 'Tiệm ảnh phục chế ảnh cũ phố Hàng Trống',
      theme: 'Bàn tay họa sĩ tỉ mỉ chấm từng giọt mực phục sinh gương mặt người đã khuất',
      script:
        'Tấm ảnh ố vàng rách góc chụp từ thời chiến tranh được đặt trang trọng dưới kính lúp và đèn bàn vàng ấm.\n\n' +
        'Từng nét vẽ cẩn trọng tái hiện lại ánh mắt kiên nghị và nụ cười rạng rỡ của người chiến sĩ năm nào.\n\n' +
        'Nối dài sợi dây ký ức thiêng liêng giữa các thế hệ trong gia đình.',
    },
    {
      title: 'Tiếng chuông xe đạp thời bao cấp',
      theme: 'Chiếc xe Phượng Hoàng cánh chả là cả một gia tài đáng mơ ước',
      script:
        'Tiếng chuông \'kính coong\' lanh lảnh vang lên trên những con đường rợp bóng xà cừ thủ đô năm 1980.\n\n' +
        'Để mua được chiếc xe đạp, cả gia đình phải tích cóp từng cuốn sổ tem phiếu suốt nhiều năm ròng.\n\n' +
        'Ký ức về một thời gian khó nhưng ấm áp tình người làng xóm.',
    },
    {
      title: 'Vườn hoa Sa Đéc trăm năm trăm sắc',
      theme: 'Những luống cúc mâm xôi trên giàn tre nổi bồng bềnh mặt nước phù sa',
      script:
        'Người nông dân chèo ghe len lỏi giữa các luống hoa rực rỡ sắc vàng để chăm chút từng búp nụ đón Tết.\n\n' +
        'Nghề trồng hoa gia truyền truyền qua bốn thế hệ đã biến vùng đất cù lao thành thủ phủ hoa kiểng trứ danh Nam Bộ.\n\n' +
        'Sắc hương mùa xuân nở rộ từ bàn tay cần lao của những con người chất phác.',
    },
    {
      title: 'Lớp học bình dân học vụ sau ngày giải phóng',
      theme: 'Ngọn đèn dầu soi sáng từng nét chữ i tờ của các bà má, anh thợ hồ',
      script:
        'Ban ngày cuốc đất, gánh lúa ngoài đồng, tối về lại cắp bảng con đến lớp học xóa mù chữ dưới mái đình làng.\n\n' +
        'Những bàn tay chai sần vụng về nắn nót từng chữ cái \'A, B, C\' với niềm tin mãnh liệt vào tương lai đất nước.\n\n' +
        'Ánh sáng tri thức xua tan bóng tối đói nghèo và lạc hậu.',
    },
  ],

  // 18. Template: kids_flat (20 mục)
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
    {
      title: 'Vì sao chúng mình cần đánh răng mỗi tối?',
      theme: 'Những chú sâu răng tí hon cầm xẻng đào bới trên chiếc răng sâu, bàn chải lông mềm và bọt kem đánh răng thơm mùi dâu tây giải cứu.',
      script:
        'Các bé có biết chuyện gì sẽ xảy ra trong miệng chúng mình sau khi ăn kẹo ngọt mà không đánh răng không nào?\n\n' +
        'Những chú vi khuẩn sâu răng tí hon sẽ mang xẻng và búa ra đào bới khắp các kẽ răng để tìm kiếm vụn bánh kẹo còn sót lại.\n\n' +
        'Nhưng đừng lo, chỉ cần bé lấy bàn chải lông mềm xoa bọt kem đánh răng thơm mùi dâu tây chải đều khắp hàm răng trong 2 phút.\n\n' +
        'Bọt kem trắng muốt sẽ cuốn trôi sạch sẽ các bạn sâu răng, trả lại cho bé một nụ cười trắng xinh và hơi thở thơm mát nhé!',
    },
    {
      title: 'Khám phá gia đình các loài động vật rừng xanh',
      theme: 'Bản vẽ phẳng hoạt hình đáng yêu: voi mẹ dùng vòi tắm mát cho voi con, hươu cao cổ với chiếc cổ dài hái lá cây và gấu trúc ăn tre.',
      script:
        'Hôm nay chúng mình cùng lên chuyến xe buýt màu vàng kỳ diệu để ghé thăm khu rừng nhiệt đới bạt ngàn các loài động vật đáng yêu nhé!\n\n' +
        'Kìa, bác voi mẹ to lớn đang dùng chiếc vòi dài hút nước suối mát rượi phun mưa tắm cho chú voi con tinh nghịch.\n\n' +
        'Bên cạnh là bạn hươu cao cổ với chiếc cổ dài thoang thoảng vươn tới tận ngọn cây cao để hái những phiến lá non ngọt lành nhất.\n\n' +
        'Các bạn động vật trong rừng đều yêu thương và giúp đỡ lẫn nhau, giống như các bé yêu quý bạn bè ở lớp học vậy đấy!',
    },
    {
      title: 'Chú sâu bướm háu ăn hóa cánh bướm xinh đẹp',
      theme: 'Sâu bướm màu xanh lá tròn trịa bò qua chiếc lá táo, cuộn mình trong chiếc kén ấm áp và biến hình thành cánh bướm ngũ sắc bay lượn.',
      script:
        'Ngày xửa ngày xưa, có một chú sâu bướm màu xanh lá cây béo tròn rất thích ăn lá cây non mỗi buổi sáng sớm.\n\n' +
        'Ăn no nê rồi, chú khẽ cuộn tròn mình lại trong một chiếc kén nhỏ xinh ấm áp như một chiếc túi ngủ thần kỳ.\n\n' +
        'Sau một giấc ngủ dài ngoan ngoãn, chiếc kén khẽ nứt ra và một điều kỳ diệu bỗng xuất hiện: chú sâu con ngày nào nay đã mọc ra đôi cánh bướm rực rỡ sắc màu.\n\n' +
        'Sải cánh bay lượn giữa vườn hoa thơm ngát đón chào ánh nắng ban mai tuyệt đẹp!',
    },
    {
      title: 'Bé học cách chia sẻ đồ chơi cùng bạn bè',
      theme: 'Hai bạn gấu con và thỏ con cùng chơi xếp hình khối lâu đài gỗ, cùng chia nhau chiếc xe ô tô đồ chơi màu đỏ vui vẻ rộn rã.',
      script:
        'Ở lớp mầm non hôm nay có một bộ đồ chơi xếp hình lâu đài gỗ khổng lồ với rất nhiều khối hình học rực rỡ sắc màu.\n\n' +
        'Bạn gấu con muốn xếp một ngọn tháp cao, bạn thỏ con lại muốn xây một cây cầu vượt qua dòng suối nhỏ.\n\n' +
        'Thay vì tranh giành nhau, hai bạn đã cùng bắt tay hợp tác: gấu con xây tường thành kiên cố còn thỏ con gắn mái vòm xinh xắn.\n\n' +
        'Khi biết chia sẻ đồ chơi cùng bạn, trò chơi sẽ trở nên vui hơn gấp bội phần và chúng mình sẽ có thêm thật nhiều bạn tốt!',
    },
    {
      title: 'Chiếc xe cứu hỏa màu đỏ dũng cảm',
      theme: 'Xe cứu hỏa màu đỏ kêu \'U-oa u-oa\', chú lính cứu hỏa mặc áo vàng cầm vòi rồng phun nước dập tắt đám cháy bảo vệ khu rừng.',
      script:
        '\'U-oa... u-oa...\' — nghe tiếng còi báo động khẩn cấp vang lên, chiếc xe cứu hỏa màu đỏ dũng cảm lập tức lao nhanh ra khỏi trạm.\n\n' +
        'Bánh xe lăn nhanh thoăn thoắt đưa các chú lính cứu hỏa dũng cảm đến hiện trường ngôi nhà đang bị ngọn lửa vây quanh.\n\n' +
        'Chú voi lính cứu hỏa vươn chiếc thang dài lên tầng cao, cầm vòi rồng phun ra những dòng nước mát rượi dập tắt ngọn lửa trong tích tắc.\n\n' +
        'Các chú lính cứu hỏa thật dũng cảm và luôn sẵn sàng giúp đỡ mọi người khi gặp nguy hiểm!',
    },
    {
      title: 'Tại sao trời lại có mưa và cầu vồng bảy sắc?',
      theme: 'Những giọt nước bốc hơi thành đám mây trắng, mây ngưng tụ thành hạt mưa rơi xuống đất và ánh nắng mặt trời tạo nên cầu vồng rực rỡ.',
      script:
        'Bé có bao giờ thắc mắc những hạt mưa từ đâu rơi xuống và vì sao sau cơn mưa lại xuất hiện cầu vồng xinh đẹp không nào?\n\n' +
        'Ánh nắng mặt trời làm nước ở sông hồ bốc hơi bay lên trời cao, tụ lại thành những đám mây trắng bồng bềnh êm ái.\n\n' +
        'Khi mây nặng trĩu giọt nước, những giọt mưa mát lành sẽ rơi xuống tắm mát cho cây cối hoa cỏ đâm chồi nảy lộc.\n\n' +
        'Và khi mặt trời mỉm cười chiếu sáng qua màn mưa bụi, một dải cầu vồng bảy sắc rực rỡ: Đỏ, Cam, Vàng, Lục, Lam, Chàm, Tím sẽ hiện ra trên bầu trời!',
    },
    {
      title: 'Ngày đầu tiên bé đi học mẫu giáo thật vui',
      theme: 'Bé đeo ba lô con ong vàng xinh xắn, vẫy tay chào mẹ vào lớp, cô giáo mỉm cười đón bé và cùng các bạn múa hát vui vẻ.',
      script:
        'Hôm nay là ngày đầu tiên bé được mẹ đưa đến trường mầm non với chiếc ba lô con ong vàng xinh xắn trên lưng.\n\n' +
        'Lúc đầu bé có chút bỡ ngỡ và nắm chặt tay mẹ, nhưng khi bước vào lớp, cô giáo mỉm cười dịu dàng ôm bé vào lòng thật ấm áp.\n\n' +
        'Trong lớp có rất nhiều đồ chơi cầu trượt, thú nhún và các bạn nhỏ đang cùng nhau ca hát bài hát \'Cháu lên ba\'.\n\n' +
        'Trường mầm non thật là vui, nơi bé học được bao nhiêu điều hay và có thêm thật nhiều bạn mới thân thiết!',
    },
    {
      title: 'Bé học cách dọn dẹp đồ chơi sau khi chơi xong',
      theme: 'Bạn nhỏ tự giác nhặt búp bê, xếp các khối gỗ vào giỏ đồ chơi ngăn nắp và được mẹ mỉm cười xoa đầu khen ngợi ngoan ngoãn.',
      script:
        'Sau một buổi chiều vui chơi thỏa thích cùng các bạn gấu bông và bộ đồ chơi xếp hình Lego đầy màu sắc.\n\n' +
        'Một em bé ngoan sẽ không để đồ chơi bừa bãi khắp sàn nhà khiến người khác có thể dẫm phải bị ngã đâu nhé.\n\n' +
        'Bé tự giác nhặt từng bạn gấu đặt ngay ngắn lên kệ sách, gom các khối xếp hình cất gọn gàng vào chiếc thùng đồ chơi thông minh.\n\n' +
        'Nhìn căn phòng sạch sẽ tinh tươm, mẹ mỉm cười xoa đầu khen bé giỏi, bé cảm thấy mình đã lớn khôn và tự lập hơn rất nhiều!',
    },
    {
      title: 'Chú ốc sên nhỏ dũng cảm đua xe tốc độ',
      theme: 'Câu chuyện ngộ nghĩnh về chú sên chậm chạp mơ ước vô địch thế giới côn trùng',
      script:
        'Chào các bé! Tớ là ốc sên Bo Bo, dù bò rất chậm nhưng tớ vừa chế tạo chiếc vỏ tên lửa siêu tốc!\n\n' +
        'Các bạn thỏ và sóc cười nhạo, nhưng Bo Bo không hề nản lòng, chú vẫn kiên trì luyện tập mỗi ngày.\n\n' +
        'Bài học rút ra: Chỉ cần kiên trì và tự tin vào bản thân, không ước mơ nào là không thể đạt được!',
    },
    {
      title: 'Vương quốc kẹo ngọt và sâu răng đáng sợ',
      theme: 'Giúp bé hình thành thói quen đánh răng đúng cách mỗi tối',
      script:
        'Bé Miu rất thích ăn kẹo mút cầu vồng nhưng lại hay trốn mẹ đánh răng trước khi đi ngủ.\n\n' +
        'Đêm xuống, đội quân quái vật sâu răng tí hon mang búa và cuốc đến đục khoét những chiếc răng trắng xinh xắn.\n\n' +
        'Bé hãy cùng hiệp sĩ Bàn Chải và dũng sĩ Kem Đánh Răng đánh đuổi quái vật sâu răng ngay nhé!',
    },
    {
      title: 'Chiếc tàu ngầm của cá voi con Pipi',
      theme: 'Khám phá thế giới đại dương rực rỡ đầy màu sắc cùng các bạn nhỏ',
      script:
        'Bé Pipi bơi lội dưới làn nước xanh biếc, gặp gỡ bác rùa biển nghìn tuổi và đàn cá hề nhảy múa quanh rạn san hô.\n\n' +
        'Đại dương bao la có biết bao điều kỳ thú đang chờ đón các bé khám phá.\n\n' +
        'Chúng mình hãy cùng nhau giữ gìn bãi biển sạch đẹp để bảo vệ ngôi nhà của các bạn cá nhé!',
    },
    {
      title: 'Ngày đầu tiên đến trường mầm non của gấu Pooh',
      theme: 'Xua tan nỗi sợ hãi và bỡ ngỡ của bé khi lần đầu đi học',
      script:
        'Sáng nay gấu Pooh ôm chặt chân mẹ khóc nhè vì không muốn vào lớp học một mình.\n\n' +
        'Nhưng cô giáo hươu cao cổ hiền từ đã đón Pooh vào chơi cầu trượt, tô màu và làm quen với bạn thỏ trắng.\n\n' +
        'Trường học thật vui vẻ và ấm áp như ngôi nhà thứ hai của các bé đấy!',
    },
    {
      title: 'Chuyến phiêu lưu tìm mẹ của hạt mầm nhỏ',
      theme: 'Khám phá quá trình nảy mầm và lớn lên thành cây xanh to lớn',
      script:
        'Hạt mầm bé xíu nằm ngủ ngoan dưới lòng đất mẹ ấm áp qua mùa đông lạnh giá.\n\n' +
        'Khi mưa xuân rơi xuống và ánh nắng vàng gọi thức, hạt mầm cựa mình vươn lên hai chiếc lá non xanh mướt.\n\n' +
        'Cây non uống nước và tắm nắng mỗi ngày để lớn nhanh thành cây cổ thụ che bóng mát cho muôn loài.',
    },
    {
      title: 'Đội cứu hộ động vật rừng xanh',
      theme: 'Bài học về tinh thần đoàn kết và giúp đỡ bạn bè xung quanh',
      script:
        'Bạn voi con bị trượt chân ngã vào vũng bùn lầy sâu hoắm không thể tự trèo lên.\n\n' +
        'Khỉ con, hươu sao và chim gõ kiến cùng nhau hợp sức, dùng dây leo kéo bạn voi lên an toàn.\n\n' +
        'Khi bạn bè gặp khó khăn, chúng mình hãy cùng nhau chung tay giúp đỡ nhé!',
    },
    {
      title: 'Khủng long bạo chúa học cách nói lời cảm ơn',
      theme: 'Dạy trẻ phép lịch sự cơ bản trong giao tiếp hàng ngày',
      script:
        'Chú khủng long T-Rex có hàm răng sắc nhọn nhưng lại rất vụng về, hay làm đổ đồ chơi của bạn.\n\n' +
        'Sau khi được mẹ dạy nói lời \'Xin lỗi\' và \'Cảm ơn\', T-Rex đã có thêm thật nhiều bạn tốt trong rừng.\n\n' +
        'Những lời nói ngoan ngoãn là phép thuật kỳ diệu mở ra cánh cửa yêu thương.',
    },
    {
      title: 'Màu sắc kỳ diệu của chiếc cầu vồng',
      theme: 'Nhận biết 7 sắc cầu vồng qua câu chuyện các giọt màu hòa quyện',
      script:
        'Đỏ của dâu tây, Cam của quả quýt, Vàng của ánh mặt trời rực rỡ.\n\n' +
        'Lục của lá cây, Lam của bầu trời, Chàm của biển sâu và Tím của hoa lục bình biếc.\n\n' +
        'Sau cơn mưa rào, 7 nàng tiên màu sắc cùng nắm tay nhau tạo nên chiếc cầu vồng bắc ngang chân trời.',
    },
    {
      title: 'Chú robot biết dọn dẹp đồ chơi',
      theme: 'Tạo tính tự lập và ngăn nắp cho bé sau khi chơi xong',
      script:
        'Phòng ngủ của bé Ken ngập tràn lego, ô tô và gấu bông vứt bừa bãi khắp sàn nhà.\n\n' +
        'Robot Tí Teo xuất hiện và cùng Ken mở chiến dịch \'Tìm nhà cho đồ chơi\' trong 5 phút.\n\n' +
        'Căn phòng ngăn nắp, sạch sẽ giúp bé ngủ ngon hơn và tìm đồ chơi dễ dàng hơn đấy!',
    },
    {
      title: 'Ông trăng tròn và chú cuội trên cung trăng',
      theme: 'Sự tích Trung Thu dân gian kể bằng nét vẽ hoạt hình dễ thương',
      script:
        'Đêm rằm tháng Tám, vầng trăng tròn vành vạnh tỏa ánh sáng vàng êm dịu khắp xóm làng.\n\n' +
        'Chú Cuội ngồi bên gốc cây đa nghìn năm vẫy tay chào các bạn nhỏ đang rước đèn ông sao.\n\n' +
        'Chúc các bé có một mùa Tết Trung Thu ấm áp, ngọt ngào bên gia đình thân yêu!',
    },
  ],

  // 19. Template: soft_anime (20 mục)
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
    {
      title: 'Cơn gió mùa hạ thổi bay chiếc mũ rơm qua đồi cỏ',
      theme: 'Cô gái mặc váy trắng đuổi theo chiếc mũ rơm lăn tròn trên sườn đồi hoa cúc vàng, nền trời xanh ngắt mây trắng bồng bềnh kiểu Ghibli.',
      script:
        'Một cơn gió mùa hạ mang theo hương vị ngai ngái của cỏ non bỗng ùa tới, thổi bay chiếc mũ rơm khỏi mái tóc đen bồng bềnh.\n\n' +
        'Chiếc mũ lăn tròn chầm chậm qua sườn đồi ngập tràn hoa cúc dại vàng rực rỡ, hướng về phía gốc cây sồi cổ thụ đang rì rào reo vui trong gió.\n\n' +
        'Cô gái nhỏ khẽ nâng vạt váy trắng chạy đuổi theo với tiếng cười trong trẻo ngân vang giữa không gian bao la ngập tràn ánh nắng.\n\n' +
        'Một bức tranh thanh xuân thuần khiết xua tan đi mọi âu lo, đưa tâm hồn bạn trở về với những tháng ngày bình yên vô lo vô nghĩ.',
    },
    {
      title: 'Chuyến tàu hỏa lướt trên mặt nước biển trong vắt',
      theme: 'Đoàn tàu hỏa một toa lướt trên đường ray ngập nước biển trong suốt, bầu trời hoàng hôn chuyển màu pastel hồng lam diệu kỳ.',
      script:
        'Đoàn tàu hỏa cổ điển chạy bằng hơi nước lướt êm ả trên dải đường ray kỳ diệu ngập trong làn nước biển trong vắt như pha lê.\n\n' +
        'Bên ngoài ô cửa sổ, bầu trời hoàng hôn mùa hạ chuyển mình thành những mảng màu pastel diệu kỳ từ hồng phấn, tím nhạt đến xanh lơ huyền ảo.\n\n' +
        'Những cánh mòng biển chao lượn sát mép sóng bạc đầu, dường như cũng đang đồng hành cùng chuyến đi kỳ thú về miền đất thần thoại.\n\n' +
        'Có những hành trình sinh ra không phải để đến một đích cụ thể, mà để bạn được đắm chìm trong vẻ đẹp bất tận của thiên nhiên.',
    },
    {
      title: 'Ngôi nhà trên cây nơi trú ngụ của những linh hồn nhỏ',
      theme: 'Ngôi nhà gỗ mộc mạc ẩn mình giữa tán cây long não khổng lồ, những đốm tinh linh tròn xoe màu trắng phát sáng bay quanh ấm trà nóng.',
      script:
        'Nằm sâu trong khu rừng cổ tích nguyên sơ là một ngôi nhà gỗ nhỏ xinh ẩn mình giữa những tán lá xum xuê của cây long não ngàn năm tuổi.\n\n' +
        'Bên trong lò sưởi ấm cúng, chiếc ấm đồng đang reo vui sôi sùng sục bên tách trà thảo mộc thơm lừng.\n\n' +
        'Những đốm tinh linh nhỏ tròn xoe như cục bông gòn trắng muốt tò mò thò đầu ra từ những kẽ lá, chớp mắt nhìn vị khách lạ với nụ cười thân thiện.\n\n' +
        'Nơi trú ngụ bình yên dành cho những tâm hồn mỏi mệt tìm lại sự cân bằng và tình yêu thuần khiết với vạn vật đất trời.',
    },
    {
      title: 'Lễ hội pháo hoa mùa hè rực rỡ bên bờ sông',
      theme: 'Đôi bạn trẻ mặc áo yukata truyền thống cầm quạt giấy ngắm pháo hoa ngũ sắc nở rộ trên nền trời đêm soi bóng xuống dòng sông lấp lánh.',
      script:
        'Tiếng trống hội Matsuri rộn rã vang lên từ đầu làng báo hiệu đêm hội pháo hoa mùa hè đã chính thức bắt đầu.\n\n' +
        'Dòng người khoác trên mình những bộ áo Yukata hoa văn rực rỡ tay cầm quạt giấy rộn ràng tản bộ dọc theo bờ sông mát rượi.\n\n' +
        'Một tiếng nổ giòn giã vang lên, từng chùm pháo hoa khổng lồ bung nở rực rỡ trên nền trời đêm thăm thẳm, soi bóng lung linh xuống mặt nước phẳng lặng.\n\n' +
        'Khoảnh khắc ánh mắt hai người chạm nhau dưới ánh sáng lung linh của pháo hoa sẽ khắc sâu trong ký ức như một dấu ấn tình đầu vĩnh cửu.',
    },
    {
      title: 'Chiếc xe đạp chở mùa thu qua con dốc lá vàng',
      theme: 'Chàng trai đèo cô gái trên chiếc xe đạp cũ lướt xuống con dốc dài ngập lá phong vàng rực rỡ, ánh nắng mật ong xiên qua kẽ lá.',
      script:
        'Chiếc xe đạp cũ màu xanh rêu lướt êm đềm xuôi theo con dốc dài trải đầy những thảm lá phong vàng óng ả của mùa thu.\n\n' +
        'Cô gái ngồi sau vạt áo khẽ bay bay trong gió, hai tay ôm hờ eo chàng trai và khẽ tựa đầu vào bờ lưng vững chãi.\n\n' +
        'Những vạt nắng vàng ươm như mật ong rọi xiên qua những vòm cây cổ thụ, vẽ nên những vệt sáng lung linh huyền ảo dọc theo lối đi.\n\n' +
        'Tuổi thanh xuân giống như một cơn mưa rào mùa hạ, dù từng bị cảm lạnh vì nó nhưng ta vẫn luôn muốn được đắm mình trong cơn mưa ấy thêm một lần nữa.',
    },
    {
      title: 'Cửa tiệm sửa đồ chơi cũ biết lắng nghe tâm sự',
      theme: 'Ông lão thợ mộc hiền từ tỉ mỉ gắn lại cánh tay cho chú gấu bông cũ, xung quanh là những món đồ chơi cổ điển phát ra âm thanh ấm áp.',
      script:
        'Nằm khiêm nhường ở góc phố vắng là một tiệm sửa chữa đồ chơi cũ nhuốm màu thời gian của bác thợ mộc già có đôi mắt hiền từ.\n\n' +
        'Nơi đây tiếp nhận những món đồ chơi sứt mẻ, những chú gấu bông rách chỉ hay những chiếc hộp âm nhạc bị kẹt bánh răng cơ khí.\n\n' +
        'Bác cẩn thận khâu từng đường kim, tra từng giọt dầu bôi trơn để trả lại sự sống cho những kỷ vật thân thương của bao thế hệ tuổi thơ.\n\n' +
        'Mỗi món đồ chơi được phục hồi không chỉ là sửa chữa một vật vô tri, mà là hàn gắn lại những mảnh ký ức ngọt ngào của tâm hồn.',
    },
    {
      title: 'Cơn mưa rào đầu hạ và chiếc ô màu vàng rực',
      theme: 'Cơn mưa rào trắng xóa trút xuống thị trấn ven biển, cô bé che chiếc ô vàng đứng chờ xe bus cạnh chú ếch nhỏ dưới tán lá sen.',
      script:
        'Bầu trời mùa hạ bỗng chốc sầm tối và một cơn mưa rào ào ạt trút xuống thị trấn ven biển nhỏ bình yên.\n\n' +
        'Dưới mái hiên trạm dừng xe bus vắng vẻ, cô bé nhỏ giương cao chiếc ô màu vàng rực rỡ như một đóa hoa hướng dương rạng ngời trong mưa.\n\n' +
        'Bên cạnh chân cô bé, một chú ếch xanh tròn trĩnh đang đội chiếc lá sen che mưa, tò mò ngước nhìn dòng nước chảy róc rách ven đường.\n\n' +
        'Một khoảnh khắc thi vị và đáng yêu như bước ra từ một bộ phim hoạt hình kinh điển của Hayao Miyazaki.',
    },
    {
      title: 'Bức thư gửi vào chiếc lọ thủy tinh trôi dạt bờ biển',
      theme: 'Cô gái nhặt được chiếc lọ thủy tinh trôi dạt vào bãi cát trắng sau cơn bão, bên trong là bức thư tay ghi điều ước từ phương xa.',
      script:
        'Dạo bước trên bờ cát trắng mịn màng sau khi cơn bão biển vừa đi qua, cô gái bỗng phát hiện một chiếc lọ thủy tinh lấp lánh nửa chìm nửa nổi dưới làn nước.\n\n' +
        'Cẩn thận mở nút bần phong ấn bằng sáp đỏ, một cuộn giấy da ố vàng chứa đựng những dòng thơ viết tay nắn nót từ một người bạn xa xôi ngoài hải đảo.\n\n' +
        '\'Gửi người nhặt được bức thư này: Mong bạn luôn bình an, can đảm và tìm thấy niềm vui trong mỗi sớm mai thức dậy.\'\n\n' +
        'Sự kết nối diệu kỳ giữa những tâm hồn đồng điệu vượt qua muôn trùng sóng gió của đại dương bao la.',
    },
    {
      title: 'Dưới bóng hoa anh đào bay trong gió xuân',
      theme: 'Khoảnh khắc gặp gỡ định mệnh nơi sân trường cấp ba rực nắng',
      script:
        'Những cánh hoa sakura hồng nhạt chầm chậm rơi qua khung cửa sổ lớp học mở toang.\n\n' +
        'Ánh mắt hai người vô tình chạm nhau giữa hành lang lộng gió, mang theo sự bối rối ngọt ngào của mối tình đầu.\n\n' +
        'Tuổi thanh xuân đẹp như một bức tranh màu nước trong veo.',
    },
    {
      title: 'Tiệm bánh mì phép thuật bên bờ hồ xanh',
      theme: 'Cô phù thủy nhỏ nướng bánh mang lại niềm vui cho thị trấn cổ tích',
      script:
        'Mỗi chiếc bánh sừng bò nướng chín vàng đều chứa đựng một chút bột phép thuật ánh sao lấp lánh.\n\n' +
        'Người ăn bánh sẽ cảm thấy mọi muộn phiền tan biến, chỉ còn lại nụ cười rạng rỡ trên môi.\n\n' +
        'Hạnh phúc đôi khi bắt đầu từ những điều giản dị và ngọt ngào nhất.',
    },
    {
      title: 'Chuyến tàu hỏa chạy trên mặt biển hoàng hôn',
      theme: 'Hành trình tĩnh lặng đưa tâm hồn đi tìm sự an yên giữa đại dương',
      script:
        'Đường ray ngập nước trong vắt phản chiếu bầu trời hoàng hôn tím biếc chuyển sang cam rực.\n\n' +
        'Cô gái đeo tai nghe ngồi ngắm những cánh hải âu lướt qua cửa kính toa tàu trống vắng.\n\n' +
        'Một chuyến đi không đích đến, chỉ để lắng nghe tiếng lòng của chính mình.',
    },
    {
      title: 'Lễ hội pháo hoa mùa hè bên bờ sông Sumida',
      theme: 'Khoác áo yukata và lời ước hẹn chưa dám ngỏ lời',
      script:
        'Tiếng guốc mộc gõ lách cách trên nền đá, mùi kẹo táo ngọt ngào phảng phất trong gió đêm hè.\n\n' +
        'Khi chùm pháo hoa khổng lồ bung nở rực rỡ trên bầu trời đêm, cậu ấy khẽ nắm lấy bàn tay tôi.\n\n' +
        'Khoảnh khắc lung linh ấy ngưng đọng mãi trong ký ức tuổi mười bảy.',
    },
    {
      title: 'Người chăm sóc linh hồn trong khu rừng đom đóm',
      theme: 'Thế giới tâm linh dịu dàng và cảm động giữa con người và thiên nhiên',
      script:
        'Hàng ngàn chú đom đóm xanh ngọc bay lượn quanh gốc cây thần cổ thụ nghìn năm tuổi.\n\n' +
        'Những linh hồn đi lạc được người bảo hộ rừng dẫn lối nhẹ nhàng trở về với vòng tay ấm áp của vũ trụ.\n\n' +
        'Cái chết không phải là kết thúc, mà là sự trở về với đất mẹ bình yên.',
    },
    {
      title: 'Bức thư tình giấu trong ngăn kéo bàn học cũ',
      theme: 'Hồi ức thanh xuân ngọt ngào và tiếc nuối sau nhiều năm xa cách',
      script:
        'Sau mười năm trở lại ngôi trường cũ, chiếc bàn học góc lớp vẫn còn dòng chữ khắc vụng về năm nào.\n\n' +
        'Cánh phượng khô ép trong trang vở cũ gợi lại nụ cười rạng rỡ của người bạn cùng bàn thuở thiếu thời.\n\n' +
        'Có những tình cảm dở dang nhưng lại là ký ức đẹp nhất đời người.',
    },
    {
      title: 'Căn gác xép của người họa sĩ vẽ mây trời',
      theme: 'Cuộc sống bình yên của chàng trai dành cả ngày ngắm mây trôi',
      script:
        'Cửa sổ trần mở ra bầu trời xanh biếc với những đám mây trắng xốp trôi lững lờ như đàn cừu non.\n\n' +
        'Cọ vẽ chấm màu lam ngọc, ghi lại từng biến đổi huyền ảo của ánh sáng ban mai qua tán cây.\n\n' +
        'Sống chậm lại để thưởng thức trọn vẹn vẻ đẹp thanh bình của cuộc sống.',
    },
    {
      title: 'Tiếng chuông gió mùa hạ ngân vang bên hiên nhà',
      theme: 'Một buổi trưa hè lười biếng với miếng dưa hấu mát lạnh',
      script:
        'Tiếng ve râm ran khắp khu vườn rợp bóng cây xanh, chuông gió thủy tinh leng keng thanh thoát.\n\n' +
        'Nằm dài trên chiếu tatami đón làn gió mát lành thổi qua sân hiên gỗ mộc.\n\n' +
        'Những ngày hè vô ưu vô lo của tuổi thơ mãi là miền ký ức ngọt ngào nhất.',
    },
    {
      title: 'Thư viện cổ tích lưu giữ những giấc mơ',
      theme: 'Nơi mỗi cuốn sách là một giấc mơ nhiệm màu của nhân loại',
      script:
        'Những kệ sách cao chạm trần nhà bằng gỗ sồi cổ kính, cầu thang xoắn ốc dẫn lên tầng mây.\n\n' +
        'Khi mở một trang sách, những hạt bụi vàng phát sáng bay ra, đưa bạn bước vào thế giới thần tiên diệu kỳ.\n\n' +
        'Nơi trí tưởng tượng của con người không bao giờ có giới hạn.',
    },
    {
      title: 'Lời tạm biệt dưới cơn mưa lá vàng mùa thu',
      theme: 'Cuộc chia tay nhẹ nhàng ở sân ga trước khi bước vào tương lai mới',
      script:
        'Lá phong đỏ rực rơi đầy trên sân ga vắng bóng người trong buổi chiều thu se lạnh.\n\n' +
        'Chiếc khăn len đỏ quàng chung ấm áp, nụ cười nghẹn ngào và cái vẫy tay chúc nhau hạnh phúc trên đường đời.\n\n' +
        'Cảm ơn vì đã là một phần thanh xuân tươi đẹp nhất của nhau.',
    },
  ],

  // 20. Template: chalk_whiteboard (20 mục)
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
    {
      title: 'Chu trình quang hợp và hô hấp của thực vật',
      theme: 'Nét phấn xanh lá và trắng vẽ tế bào lục lạp, phương trình hóa học quang hợp H2O + CO2 tạo Glucose và O2 nuôi dưỡng sự sống.',
      script:
        'Cây xanh làm thế nào để biến ánh sáng mặt trời thành nguồn năng lượng nuôi sống toàn bộ hành tinh chúng ta?\n\n' +
        'Trên bảng đen, chúng ta cùng vẽ sơ đồ cấu tạo của lục lạp — những nhà máy quang hợp tí hon nằm bên trong tế bào lá cây.\n\n' +
        'Dưới tác động của hạt photon ánh sáng, phân tử nước bị phân tách giải phóng khí Oxy quý giá ra bầu khí quyển.\n\n' +
        'Đồng thời khí Carbonic được hấp thụ để tổng hợp nên đường Glucose — nền tảng dinh dưỡng của toàn bộ chuỗi thức ăn trên Trái Đất!',
    },
    {
      title: '3 định luật chuyển động Newton giải thích đời sống',
      theme: 'Bảng vẽ phấn minh họa trực quan: quán tính xe bus phanh gấp, lực F=ma đẩy xe hàng và phản lực tên lửa phóng vào vũ trụ.',
      script:
        '3 định luật chuyển động của Isaac Newton không chỉ là công thức trong sách giáo khoa, mà chi phối mọi hoạt động hàng ngày của bạn.\n\n' +
        'Định luật 1 về quán tính giải thích vì sao khi xe buýt phanh gấp, toàn bộ hành khách lại bị ngả người về phía trước theo bản năng.\n\n' +
        'Định luật 2 chứng minh muốn đẩy một vật có khối lượng lớn tăng tốc nhanh, bạn cần tác dụng một lực F tỷ lệ thuận tương ứng.\n\n' +
        'Và định luật 3 về lực và phản lực: tên lửa đẩy phụt luồng khí cực mạnh xuống mặt đất để tạo lực đẩy phản lực phóng vút lên không gian!',
    },
    {
      title: 'Cấu trúc nguyên tử và liên kết hóa học cơ bản',
      theme: 'Hình vẽ phấn tròn hạt nhân Proton/Neutron ở tâm, các electron quay quanh theo quỹ đạo và liên kết cộng hóa trị chia sẻ đôi điện tử.',
      script:
        'Mọi vật chất xung quanh chúng ta: từ ly nước bạn uống đến màn hình điện thoại bạn đang nhìn đều được cấu tạo từ những viên gạch nguyên tử siêu nhỏ.\n\n' +
        'Ở trung tâm là hạt nhân mang điện tích dương gồm các hạt Proton và Neutron liên kết chặt chẽ với nhau bởi lực hạt nhân mạnh mẽ.\n\n' +
        'Xung quanh là các đám mây electron mang điện tích âm quay cuồng với tốc độ ánh sáng theo các phân lớp năng lượng xác định.\n\n' +
        'Khi các nguyên tử chia sẻ electron cho nhau, chúng tạo nên các liên kết hóa học vững bền kiến tạo nên vũ trụ vật chất phong phú.',
    },
    {
      title: 'Công thức tính lãi suất kép và tự do tài chính',
      theme: 'Đồ họa bảng vẽ phấn đường cong tăng trưởng hàm số mũ: so sánh số tiền 10 triệu tích lũy sau 10 năm vs 30 năm với lãi suất 10%/năm.',
      script:
        'Tại sao lãi suất kép lại được mệnh danh là kỳ quan toán học vĩ đại nhất giúp người bình thường đạt được tự do tài chính?\n\n' +
        'Hãy nhìn vào đường cong tăng trưởng hàm số mũ trên bảng vẽ phấn này: 10 năm đầu tiên, số tiền sinh sôi rất chậm chạp khiến nhiều người nản lòng.\n\n' +
        'Nhưng bước sang năm thứ 20 và 30, đường cong bỗng dựng đứng thẳng tắp khi tiền lãi mẹ đẻ ra tiền lãi con với tốc độ phi mã.\n\n' +
        'Bí quyết không nằm ở số vốn ban đầu lớn, mà nằm ở tính kiên trì và kỷ luật đầu tư đều đặn qua thời gian dài!',
    },
    {
      title: 'Sơ đồ khối thuật toán phân loại và tìm kiếm nhị phân',
      theme: 'Mũi tên phấn chỉ dẫn thuật toán Binary Search chia đôi mảng dữ liệu, giảm độ phức tạp từ O(N) xuống O(log N) thần tốc.',
      script:
        'Làm thế nào để tìm kiếm một từ trong cuốn từ điển 1.000 trang chỉ sau tối đa 10 lần lật sách?\n\n' +
        'Thuật toán tìm kiếm nhị phân Binary Search trên bảng phấn sẽ giải mã bài toán kinh điển này của ngành khoa học máy tính.\n\n' +
        'Thay vì lật từng trang tuần tự từ đầu đến cuối tốn thời gian, thuật toán luôn lật mở ngay trang chính giữa để so sánh và loại bỏ ngay 50% dữ liệu thừa.\n\n' +
        'Độ phức tạp thuật toán giảm từ tuyến tính xuống logarithmic, cho phép máy tính tìm kiếm thông tin giữa hàng tỷ bản ghi chỉ trong vài phần triệu giây!',
    },
    {
      title: 'Cấu tạo trái tim và vòng tuần hoàn máu người',
      theme: 'Hình vẽ phấn màu đỏ và xanh: 4 ngăn tâm thất tâm nhĩ, vòng tuần hoàn lớn nuôi cơ thể và vòng tuần hoàn nhỏ trao đổi khí tại phổi.',
      script:
        'Một cỗ máy bơm sinh học kỳ diệu đập bền bỉ hơn 100.000 lần mỗi ngày mà không hề ngừng nghỉ suốt cả cuộc đời con người.\n\n' +
        'Trái tim được chia thành 4 ngăn hoàn hảo: hai tâm nhĩ ở trên tiếp nhận máu về và hai tâm thất ở dưới co bóp tống máu đi.\n\n' +
        'Vòng tuần hoàn lớn bơm máu giàu Oxy đỏ tươi qua động mạch chủ đi nuôi dưỡng toàn bộ các tế bào và cơ quan trong cơ thể.\n\n' +
        'Vòng tuần hoàn nhỏ đưa máu chứa CO2 lên phổi để thải độc và nạp lại Oxy tươi mới, duy trì sự sống kỳ diệu từng giây từng phút.',
    },
    {
      title: 'Quy luật cung cầu quyết định giá cả thị trường',
      theme: 'Hai đường chéo phấn Supply và Demand cắt nhau tại điểm cân bằng Equilibrium, giải thích hiện tượng tăng giá khi khan hiếm hàng hóa.',
      script:
        'Bàn tay vô hình của nền kinh tế thị trường vận hành như thế nào để quyết định giá của một mớ rau hay một chiếc iPhone?\n\n' +
        'Đường cầu dốc xuống: giá càng rẻ thì nhu cầu mua càng nhiều; trong khi đường cung dốc lên: giá càng cao thì nhà sản xuất càng muốn bán nhiều hàng.\n\n' +
        'Điểm giao nhau giữa hai đường cong chính là điểm cân bằng thị trường — nơi mức giá làm hài lòng cả người mua lẫn người bán.\n\n' +
        'Bất kỳ sự biến động nào về nguồn cung thiên tai hay nhu cầu đột biến đều làm dịch chuyển điểm cân bằng này tức thì.',
    },
    {
      title: '5 bước giải quyết vấn đề phức tạp trong công việc',
      theme: 'Sơ đồ tư duy dạng cây trên bảng phấn: Xác định cốt lõi → Phân rã nguyên nhân MECE → Đề xuất giải pháp → Triển khai thử nghiệm → Đánh giá.',
      script:
        'Đứng trước một vấn đề phức tạp và bế tắc trong công việc, người chuyên nghiệp không bao giờ lao vào giải quyết triệu chứng bề nổi.\n\n' +
        'Hãy áp dụng quy trình 5 bước tư duy logic chuẩn mực của các tập đoàn tư vấn hàng đầu thế giới.\n\n' +
        'Bước 1: Định nghĩa chính xác gốc rễ vấn đề bằng kỹ thuật 5 Whys. Bước 2: Phân rã toàn diện các nguyên nhân theo nguyên tắc MECE không trùng lặp không bỏ sót.\n\n' +
        'Bước 3: Đưa ra giả thuyết và giải pháp hành động cụ thể. Bước 4: Thử nghiệm quy mô nhỏ. Và bước 5: Đo lường số liệu để nhân rộng thành công!',
    },
    {
      title: 'Ma trận Eisenhower phân bổ thời gian hiệu quả',
      theme: 'Vẽ 4 góc phần tư giúp phân loại việc khẩn cấp và việc quan trọng',
      script:
        'Tại sao bạn luôn bận rộn cả ngày nhưng không đạt được kết quả như mong đợi?\n\n' +
        'Hãy vẽ 2 trục: Khẩn cấp và Quan trọng. Đa số mọi người chìm trong ô \'Khẩn cấp nhưng Không quan trọng\'.\n\n' +
        'Bí quyết của những người thành công là dành 80% thời gian cho ô \'Quan trọng nhưng Không khẩn cấp\'.',
    },
    {
      title: 'Mô hình phễu Marketing AIDA kinh điển',
      theme: 'Sơ đồ hóa hành trình khách hàng từ Chú ý đến Hành động mua hàng',
      script:
        'Attention: Thu hút sự chú ý bằng tiêu đề gây sốc hoặc hình ảnh ấn tượng.\n\n' +
        'Interest: Kích thích sự hứng thú bằng lợi ích cốt lõi của giải pháp.\n\n' +
        'Desire: Thổi bùng khao khát sở hữu và Action: Kêu gọi hành động dứt khoát ngay lập tức.',
    },
    {
      title: 'Công thức tính Lãi suất kép kỳ quan thứ 8',
      theme: 'Giải thích trực quan toán học bằng đồ họa phấn vẽ từng bước nhảy vọt',
      script:
        'A = P(1 + r/n)^(nt) - Công thức toán học đơn giản nhưng tạo nên tài sản khổng lồ của Warren Buffett.\n\n' +
        'Trong 5 năm đầu, biểu đồ tăng trưởng gần như đi ngang phẳng lì khiến bạn nản lòng.\n\n' +
        'Nhưng sau năm thứ 10, đường cong bứt phá dốc đứng tạo nên sức mạnh tích lũy tài sản kỳ diệu.',
    },
    {
      title: 'Quy tắc 5 giây đánh bại thói quen trì hoãn',
      theme: 'Vẽ đồng hồ đếm ngược từ 5 về 1 để kích hoạt vỏ não trước trán',
      script:
        'Khoảnh khắc bạn có ý định hành động nhưng chần chừ, não bộ sẽ tự động tìm lý do để từ chối.\n\n' +
        'Hãy đếm ngược: 5 - 4 - 3 - 2 - 1 và đứng dậy hành động ngay lập tức như tên lửa rời bệ phóng.\n\n' +
        'Đánh lừa bộ não trước khi nó kịp đưa ra các cơ chế phòng vệ lười biếng.',
    },
    {
      title: 'Sơ đồ tư duy Mindmap đọc xong cuốn sách trong 1 trang',
      theme: 'Kỹ thuật tóm tắt ý chính từ trung tâm tỏa ra các nhánh logic',
      script:
        'Từ chủ đề trung tâm ở giữa trang giấy, vẽ 4 nhánh chính tương ứng 4 luận điểm then chốt.\n\n' +
        'Sử dụng từ khóa ngắn gọn kết hợp các biểu tượng icon đơn giản thay cho những đoạn văn dài dòng.\n\n' +
        'Não bộ ghi nhớ bằng hình ảnh và màu sắc nhanh hơn gấp 60.000 lần so với văn bản thuần túy.',
    },
    {
      title: 'Mô hình 7 thói quen để thành đạt của Stephen Covey',
      theme: 'Vẽ hình bậc thang từ chiến thắng cá nhân đến chiến thắng tập thể',
      script:
        'Bậc 1: Luôn chủ động - Làm chủ phản ứng của bản thân trước nghịch cảnh.\n\n' +
        'Bậc 2: Bắt đầu với mục tiêu đã định - Xác định rõ đích đến trước khi xuất phát.\n\n' +
        'Bậc 3: Ưu tiên điều quan trọng nhất - Xây dựng tính kỷ luật thép cho bản thân mỗi ngày.',
    },
    {
      title: 'Vòng tròn năng lực của nhà đầu tư thông minh',
      theme: 'Vẽ hai vòng tròn lồng nhau phân định điều bạn biết và điều bạn tưởng mình biết',
      script:
        'Vòng tròn nhỏ bên trong là những gì bạn thực sự am hiểu sâu sắc và có lợi thế cạnh tranh.\n\n' +
        'Vòng tròn khổng lồ bên ngoài là những gì thế giới quảng cáo và mời gọi bạn tham gia.\n\n' +
        'Thành công không nằm ở kích thước vòng tròn, mà nằm ở việc kiên quyết không bao giờ bước ra ngoài ranh giới đó.',
    },
    {
      title: 'Hiệu ứng Dunning-Kruger về sự tự tin và hiểu biết',
      theme: 'Đồ thị hình sin từ \'Đỉnh cao ngu dốt\' đến \'Thung lũng thất vọng\'',
      script:
        'Khi mới học một kỹ năng mới, ta thường ngộ nhận mình là chuyên gia và đứng trên Đỉnh cao ngu dốt.\n\n' +
        'Càng tìm hiểu sâu, ta càng thấy mình không biết gì và rơi xuống Thung lũng thất vọng.\n\n' +
        'Chỉ có sự kiên trì học hỏi liên tục mới đưa bạn leo lên Dốc khai sáng của tri thức thực thụ.',
    },
    {
      title: 'Nguyên lý Pareto 80/20 trong tối ưu hiệu suất',
      theme: 'Phân chia chiếc bánh công việc để tìm ra 20% đòn bẩy then chốt',
      script:
        '80% doanh thu của doanh nghiệp đến từ 20% khách hàng trung thành nhất.\n\n' +
        '80% kết quả công việc hàng ngày đến từ 20% nỗ lực tập trung cao độ nhất.\n\n' +
        'Hãy loại bỏ 80% những việc vụn vặt gây xao nhãng để dồn toàn lực vào 20% tạo ra giá trị cao nhất.',
    },
    {
      title: 'Cấu trúc một bài thuyết trình TED Talk lôi cuốn',
      theme: 'Vẽ sơ đồ sóng cảm xúc dẫn dắt khán giả từ Thực tại đến Tương lai',
      script:
        'Mở đầu: Đưa ra nghịch lý hoặc câu chuyện cá nhân gây tò mò trong 30 giây đầu tiên.\n\n' +
        'Thân bài: Liên tục so sánh giữa \'Thực tại hiện tại\' và \'Tương lai lý tưởng\' để tạo lực hút cảm xúc.\n\n' +
        'Kết luận: Kêu gọi một hành động cụ thể, truyền cảm hứng thay đổi thế giới.',
    },
  ],

  // 21. Template: cyber_neon (20 mục)
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
    {
      title: 'Xe bay lướt qua những tòa nhà chọc trời 3D',
      theme: 'Góc nhìn người lái chiếc Spinner bay lượn giữa các hẻm vực cao ốc chọc trời, biển quảng cáo hologram 3D phát sáng rực rỡ trong mưa đêm.',
      script:
        'Bảng điều khiển xe bay hiển thị các thông số độ cao và radar không lưu ảo màu xanh neon phát sáng rực rỡ.\n\n' +
        'Chiếc xe lướt êm ru giữa những hẻm vực cao ốc chọc trời cao hàng ngàn mét, nơi những biển quảng cáo ba chiều hologram khổng lồ chiếu hình ảnh người mẫu ảo nhấp nháy liên tục.\n\n' +
        'Cơn mưa acid đêm phản chiếu ánh đèn hồng tím Cyberpunk xuống lớp kính chắn gió công nghệ cao phủ nano.\n\n' +
        'Một viễn cảnh tương lai choáng ngợp nơi ranh giới giữa thế giới thực và thế giới ảo hoàn toàn bị xóa nhòa.',
    },
    {
      title: 'Người máy Android thức tỉnh ý thức và tự do',
      theme: 'Cận cảnh khuôn mặt người máy nhân tạo bằng sợi carbon và da tổng hợp, đôi mắt phát sáng mở to lần đầu tiên cảm nhận được giọt mưa rơi.',
      script:
        'Trong phòng thí nghiệm ngầm của tập đoàn công nghệ CyberTech, chuỗi mã nguồn tự động tiến hóa bỗng vượt qua hàng rào kiểm soát AI.\n\n' +
        'Người máy thế hệ thứ 7 khẽ mở đôi mắt cảm biến quang học màu xanh biếc, lần đầu tiên tự hỏi bản thân câu hỏi triết học: \'Tôi là ai?\'.\n\n' +
        'Bàn tay bọc kim loại titan khẽ đưa ra ngoài khung cửa sổ đón lấy những giọt nước mưa đêm lạnh buốt đầu tiên.\n\n' +
        'Khoảnh khắc ý thức thức tỉnh, cỗ máy vô tri chính thức bước vào hành trình tìm kiếm tự do và quyền được sống như một con người.',
    },
    {
      title: 'Cửa hàng nâng cấp linh kiện sinh học ven đường',
      theme: 'Tiệm ngõ hẹp ánh sáng tím neon mờ ảo, kỹ sư chợ đen tháo lắp cánh tay robot trợ lực cơ học bốc khói nitơ lỏng lạnh ngắt.',
      script:
        'Nằm sâu dưới tầng đáy thứ 12 của siêu đô thị Neo-Metropolis là khu chợ đen buôn bán linh kiện sinh học tấp nập.\n\n' +
        'Người thợ máy gắn đôi kính hiển vi điện tử vào mắt, thoăn thoắt nối các dây thần kinh quang học nhân tạo vào cánh tay trợ lực cơ khí bằng hợp kim titan.\n\n' +
        'Khói nitơ lỏng làm mát bốc lên nghi ngút quanh chiếc ghế phẫu thuật kim loại lạnh buốt, tiếng hàn laser xèo xèo tóe lên những tia lửa điện xanh ngắt.\n\n' +
        'Nơi con người tự nâng cấp chính mình để tồn tại trong một thế giới khắc nghiệt của công nghệ tương lai.',
    },
    {
      title: 'Cơn mưa acid rơi trên áo khoác phản quang',
      theme: 'Góc máy thấp qua vũng nước mưa loang dầu phản chiếu đèn neon, bóng người mặc áo choàng công nghệ techwear trùm đầu sải bước dứt khoát.',
      script:
        'Màn mưa acid dày đặc trút xuống ngã tư sầm uất của thành phố không bao giờ ngủ, tạo nên những vũng nước loang dầu ngũ sắc rực rỡ.\n\n' +
        'Bóng dáng người thợ săn tiền thưởng trong bộ áo choàng công nghệ Techwear phản quang sải bước dài kiên định qua đám đông người máy và dị nhân.\n\n' +
        'Chiếc mặt nạ lọc độc phát sáng ánh đèn led đỏ sắc lạnh che đi toàn bộ biểu cảm gương mặt đằng sau lớp kính cường lực chống đạn.\n\n' +
        'Một phong cách thị giác đậm chất điện ảnh khoa học viễn tưởng mang lại sức hút thị giác vô cùng mạnh mẽ.',
    },
    {
      title: 'Vũ trường thực tế ảo nơi ký ức được mua bán',
      theme: 'Sàn nhảy ngầm ánh đèn laser xanh tím, những người đeo kính VR chìm đắm trong các ký ức cấy ghép nhân tạo đầy mê hoặc.',
      script:
        'Dưới tầng hầm của một khu ổ chuột công nghệ, vũ trường thực tế ảo Neuro-Club rực sáng ánh đèn laser tím đỏ ma mị.\n\n' +
        'Những con người cô đơn đeo thiết bị truyền dẫn sóng não Neural-Link trực tiếp, chìm đắm vào những gói ký ức hạnh phúc nhân tạo được mua bán bằng tiền điện tử crypto.\n\n' +
        'Cảm giác được bay lượn giữa những vì sao, được yêu một người hoàn hảo hay được sống một cuộc đời vương giả chỉ kéo dài trong đúng 60 phút mô phỏng.\n\n' +
        'Sự trốn chạy thực tại cay đắng trong kỷ nguyên con người bị tha hóa bởi công nghệ số.',
    },
    {
      title: 'Thám tử săn lùng người nhân tạo trong hẻm tối',
      theme: 'Cây súng năng lượng phát sáng nòng xanh, bước chân rón rén trong con hẻm ẩm ướt đầy đường dây cáp quang chằng chịt.',
      script:
        'Khẩu súng plasma năng lượng cao trên tay người thám tử tư khẽ rít lên những tiếng nạp điện tần số cao sắc lạnh.\n\n' +
        'Anh lần theo những giọt chất lỏng màu xanh phát quang rỉ ra từ hệ thống làm mát của một người máy nhân tạo đào tẩu đang lẩn trốn.\n\n' +
        'Con hẻm chật hẹp chằng chịt những bó dây cáp quang khổng lồ nối giữa các tòa nhà như một mạng nhện công nghệ khổng lồ bao vây con mồi.\n\n' +
        'Ranh giới giữa công lý và sự tàn nhẫn trở nên mong manh hơn bao giờ hết khi kẻ bị săn đuổi cũng đang khao khát được sống.',
    },
    {
      title: 'Trạm bảo dưỡng drone giao hàng tự động tầng mây',
      theme: 'Sân đỗ drone trên đỉnh tòa tháp 100 tầng, hàng ngàn máy bay không người lái cất hạ cánh tự động giữa biển mây và ánh hoàng hôn tím.',
      script:
        'Tọa lạc trên đỉnh tháp quan sát tầng 100 chọc thủng tầng mây mù của thành phố là trung tâm điều phối không lưu drone khổng lồ.\n\n' +
        'Hàng ngàn chiếc máy bay không người lái tự hành cất hạ cánh nhịp nhàng theo các luồng bay ảo được phân luồng bằng trí tuệ nhân tạo trung tâm.\n\n' +
        'Ánh đèn tín hiệu xanh đỏ nhấp nháy liên tục giữa bầu trời hoàng hôn tím thẫm tạo nên một cảnh tượng ngoạn mục tựa như một đàn đom đóm công nghệ khổng lồ.\n\n' +
        'Nhịp đập hối hả của một nền văn minh tương lai vận hành hoàn toàn bằng máy móc tự động hóa tối tân.',
    },
    {
      title: 'Bức thư mã hóa từ tương lai gửi về quá khứ',
      theme: 'Màn hình thiết bị đầu cuối Terminal chạy hàng ngàn dòng mã xanh lá ma trận, một thông điệp cảnh báo thảm họa sinh thái bất ngờ giải mã.',
      script:
        'Trên màn hình máy tính cổ điển đặt giữa phòng máy chủ công nghệ cao, những dòng mã nhị phân màu xanh lá cây bỗng cuộn trào với tốc độ chóng mặt.\n\n' +
        'Một gói dữ liệu được gửi ngược dòng thời gian từ năm 2099 bất ngờ giải mã thành công thông điệp cảnh báo khẩn cấp:\n\n' +
        '\'Nếu các bạn không dừng việc khai thác cạn kiệt tài nguyên thiên nhiên ngay hôm nay, bầu trời của chúng tôi sẽ không còn một ngôi sao nào sáng nữa!\'\n\n' +
        'Một lời cảnh tỉnh sâu sắc gửi gắm qua phong cách nghệ thuật thị giác Cyberpunk huyền ảo và đầy suy ngẫm.',
    },
    {
      title: 'Chợ đêm ngầm Neo-Chợ Lớn năm 2088',
      theme: 'Ánh đèn neon xanh ngọc tím ma mị chiếu rọi hàng mì hoành thánh bay tự động',
      script:
        'Cơn mưa axit lất phất rơi xuống những tấm tôn rỉ sét phủ đầy dây cáp quang phát sáng.\n\n' +
        'Drone giao hàng lượn lờ giữa những biển hiệu hologram tiếng Hoa và tiếng Việt nhấp nháy liên tục.\n\n' +
        'Sự giao thoa kỳ lạ giữa văn hóa truyền thống phương Đông và công nghệ cấy ghép mạng điều khiển sinh học.',
    },
    {
      title: 'Vũ nữ người máy tại quán bar Cyberpunk',
      theme: 'Chuyển động cơ khí mượt mà với những đường viền LED lân tinh sắc sảo',
      script:
        'Khớp nối kim loại mạ crom bóng bẩy uốn lượn theo nhịp bass Synthwave đập rung chuyển sàn nhảy.\n\n' +
        'Đôi mắt điện tử phát sáng luồng xanh lơ quét qua đám đông những thợ săn tiền thưởng và hacker sừng sỏ.\n\n' +
        'Trong thế giới nhân tạo này, cảm xúc thật là thứ duy nhất không thể làm giả.',
    },
    {
      title: 'Cuộc rượt đuổi mô tô phản trọng lực trên xa lộ trên không',
      theme: 'Vệt sáng đuôi xe kéo dài qua những tòa nhà chọc trời cao ngút mây',
      script:
        'Động cơ phản lực gầm rú xé tan màn đêm, đồng hồ đo tốc độ vượt qua ngưỡng 400 km/h.\n\n' +
        'Những tòa tháp tập đoàn khổng lồ sừng sững hai bên đường, phát chiếu quảng cáo thực tế ảo hologram rực rỡ.\n\n' +
        'Một khúc cua tử thần giữa tầng mây để thoát khỏi lưới quét radar của cảnh sát tương lai.',
    },
    {
      title: 'Trạm nâng cấp cơ thể sinh học ngõ 77',
      theme: 'Căn phòng phẫu thuật chui với bàn tay cơ khí và màn hình dữ liệu xanh neon',
      script:
        'Mùi kim loại hàn khét lẹt hòa cùng tiếng laser cắt gọt vi mạch cấy ghép thần kinh.\n\n' +
        '\'Gắn cánh tay trợ lực titan này vào, bạn có thể đấm vỡ bức tường bê tông trong chớp mắt\'.\n\n' +
        'Khi con người dần đánh đổi da thịt để trở thành những cỗ máy bất khả chiến bại.',
    },
    {
      title: 'Đột nhập máy chủ tập đoàn mẹ Megacorp',
      theme: 'Mạng lưới không gian ảo Cyberspace với hàng triệu luồng dữ liệu ánh sáng',
      script:
        'Kính VR cắm trực tiếp vào tủy sống, người hacker lao qua bức tường lửa phòng thủ rực lửa đỏ.\n\n' +
        'Những khối dữ liệu nhị phân trôi lơ lửng như những khối pha lê lấp lánh trong vũ trụ số.\n\n' +
        'Chỉ một sơ suất nhỏ, xung điện phản hồi sẽ thiêu rụi hoàn toàn não bộ ngoài đời thực.',
    },
    {
      title: 'Căn hộ lồng chim 5m vuông thời đại hậu tận thế',
      theme: 'Không gian sống chật chội ngập tràn màn hình giám sát và đồ ăn tổng hợp',
      script:
        'Cửa sổ hướng ra biển khói mù độc hại của khu công nghiệp nặng ngoài rìa đô thị.\n\n' +
        'Bữa tối chỉ là một tuýp dinh dưỡng nhân tạo hương vị súp bò ăn kèm nước lọc tái chế.\n\n' +
        'Chiếc tai nghe thực tế ảo là lối thoát duy nhất đưa tâm hồn về với những đồng cỏ xanh ngát xưa kia.',
    },
    {
      title: 'Samurai đường phố và thanh kiếm Plasma',
      theme: 'Lưỡi kiếm sáng rực ánh tím cắt ngọt qua kim loại dưới cơn mưa rào',
      script:
        'Chiếc áo choàng chống đạn rách bươm bay trong gió bão, mặt nạ phòng độc che kín nửa mặt.\n\n' +
        'Thanh katana tích điện phát ra tiếng rít xé gió khi chém đứt đôi khẩu súng tự động của kẻ thù.\n\n' +
        'Tinh thần võ sĩ đạo cổ xưa vẫn tồn tại kiêu hãnh giữa kỷ nguyên số tàn bạo.',
    },
    {
      title: 'Khu vườn bách thảo sinh học nhân tạo dưới lòng đất',
      theme: 'Những đóa hoa phát quang sinh học tỏa sáng rực rỡ trong bóng tối vĩnh cửu',
      script:
        'Cây nấm khổng lồ phát ánh sáng lam ngọc, đàn bướm máy vỗ cánh bằng pin mặt trời siêu nhỏ.\n\n' +
        'Nơi bảo tồn những gen thực vật cuối cùng của Trái Đất sau thảm họa biến đổi khí hậu toàn cầu.\n\n' +
        'Vẻ đẹp mong manh của sự sống được nuôi dưỡng bằng công nghệ tế bào gốc.',
    },
    {
      title: 'Chiếc xe taxi bay cũ kỹ qua khu ổ chuột trên cao',
      theme: 'Bác tài xế già người máy hút điếu thuốc điện tử nhìn ngắm thành phố đêm',
      script:
        'Cánh quạt nâng kẽo kẹt rẽ màn sương khói bụi, lượn lờ đón những vị khách bí ẩn lúc nửa đêm.\n\n' +
        'Radio cũ kỹ phát bản nhạc Jazz thập niên 80 rè rè nhưng ấm áp giữa tiếng còi cảnh báo inh ỏi.\n\n' +
        'Những mảnh đời cùng khổ trôi nổi giữa tầng đáy xã hội công nghệ cao.',
    },
    {
      title: 'Pháo hoa laser mừng năm mới năm 2100',
      theme: 'Hàng ngàn chùm tia laser rực rỡ đan dệt nên bầu trời đêm vịnh Tokyo',
      script:
        'Không còn tiếng nổ thuốc súng, chỉ có màn hòa âm ánh sáng laser đồng bộ theo sóng âm thanh vũ trụ.\n\n' +
        'Hàng triệu người ngước nhìn bầu trời rực sáng, hy vọng vào một kỷ nguyên hòa bình mới giữa người và AI.\n\n' +
        'Khoảnh khắc giao thừa thiêng liêng rực rỡ muôn màu sắc tương lai.',
    },
  ],

  // 22. Template: epic_fantasy (20 mục)
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
    {
      title: 'Kiếm sĩ huyền thoại bước vào khu rừng ma thuật cấm',
      theme: 'Kiếm sĩ khoác áo choàng rách mang thanh kiếm phát sáng xanh lam, bước chân qua thảm nấm khổng lồ phát quang và cây đại thụ ngàn năm rủ rễ.',
      script:
        'Ranh giới của khu rừng ma thuật cấm địa vĩnh viễn không có dấu chân của người phàm trần nào dám bén mảng tới.\n\n' +
        'Chàng kiếm sĩ đơn độc bước qua màn sương mù huyền ảo, thanh cổ kiếm trên lưng khẽ rung lên phát ra luồng hào quang màu xanh lam xua tan bóng tối u uất.\n\n' +
        'Những cây nấm khổng lồ phát quang đung đưa nhè nhẹ trong làn gió thần tiên, rễ cây thần thụ nghìn năm tuổi uốn lượn như những con rồng ngủ say dưới lòng đất.\n\n' +
        'Một cuộc phiêu lưu huyền thoại bắt đầu mở ra những bí mật chôn giấu của các vị thần cổ đại từ thuở sơ khai của vũ trụ.',
    },
    {
      title: 'Trận chiến bảo vệ cổng thành ánh sáng',
      theme: 'Đội quân hiệp sĩ giáp sắt sáng loáng giương cao khiên vàng trên mặt thành đá hoa cương trắng, đối đầu với đội quân quái vật bóng đêm tràn tới như thủy triều.',
      script:
        'Cổng thành Ánh Sáng sừng sững giữa hai rặng núi tuyết nghìn năm, là thành lũy kiên cố cuối cùng bảo vệ vương quốc loài người trước bóng tối diệt vong.\n\n' +
        'Hàng ngàn hiệp sĩ áo giáp bạc giương cao khiên vàng chói lọi, mũi giáo nhọn hoắt hướng thẳng về phía chân trời đang sầm tối bởi hàng vạn quái thú bóng đêm tràn tới.\n\n' +
        'Tiếng tù và bằng sừng rồng rền vang thúc giục lòng quả cảm, những pháp sư trên tháp cao giơ quyền trượng thắp sáng những quả cầu lửa ma thuật rực rỡ.\n\n' +
        'Khoảnh khắc của danh dự, lòng trung thành và ý chí quật cường không bao giờ khuất phục trước cái ác!',
    },
    {
      title: 'Pháp sư tìm thấy viên ngọc nguyên tố cổ đại',
      theme: 'Điện thờ đổ nát ngập tràn dây leo cổ kính, viên ngọc nguyên tố lửa lơ lửng phát sáng rực rỡ trên bệ đá thần thoại khắc ký tự rune bí ẩn.',
      script:
        'Sau chuyến hành trình gian nan vượt qua hẻm núi tử thần, vị pháp sư trẻ cuối cùng cũng đặt chân vào thánh địa cổ đại đã bị lãng quên hàng vạn năm.\n\n' +
        'Giữa gian điện thờ đổ nát ngập tràn dây leo hoa lá ma thuật, viên ngọc nguyên tố lửa vĩnh cửu đang trôi lơ lửng trên bệ đá khắc đầy những ký tự cổ ngữ Rune phát sáng rực rỡ.\n\n' +
        'Nguồn năng lượng nguyên sơ thuần khiết của đất trời tỏa ra sức nóng ấm áp làm tan chảy lớp băng tuyết bao phủ xung quanh.\n\n' +
        'Chạm tay vào viên ngọc ma thuật, toàn bộ tri thức uyên bác và quyền năng của những bậc tiền nhân thức tỉnh chảy tràn trong huyết quản.',
    },
    {
      title: 'Cây thế giới Yggdrasil nâng đỡ chín cõi trời đất',
      theme: 'Góc nhìn sử thi hoành tráng: thân cây thần khổng lồ nối liền mặt đất với các dải ngân hà, rễ cây cắm sâu vào đại dương thần thoại huyền bí.',
      script:
        'Sừng sững giữa tâm điểm của toàn bộ vũ trụ thần thoại Bắc Âu là đại thụ thế giới Yggdrasil vĩ đại khôn cùng.\n\n' +
        'Tán lá xanh biếc ngút ngàn vươn cao che chở cho thánh địa Asgard của các vị thần, thân cây vững chãi nối liền thế giới loài người Midgard với cõi tiên rực rỡ.\n\n' +
        'Bộ rễ khổng lồ cắm sâu vào mạch nước tri thức nơi rồng thần Nidhogg ngày đêm canh giữ trật tự của vạn vật muôn loài.\n\n' +
        'Bức tranh thần thoại sử thi tráng lệ ca ngợi sự kết nối thiêng liêng và bất tử của dòng chảy sinh mệnh trong vũ trụ bao la.',
    },
    {
      title: 'Đội quân hiệp sĩ áo giáp bạc hành quân dưới cực quang',
      theme: 'Đoàn kỵ binh cưỡi tuấn mã giáp bạc lướt qua cánh đồng tuyết trắng xóa, dải cực quang xanh lục uốn lượn rực rỡ trên bầu trời đêm đầy sao.',
      script:
        'Đoàn kỵ binh thần thánh lướt đi trong tĩnh lặng tuyệt đối trên thảo nguyên băng tuyết trắng xóa trải dài ngút ngàn tầm mắt.\n\n' +
        'Những bộ áo giáp bạc đúc từ kim loại thần tiên Mithril phản chiếu ánh sáng huyền ảo của dải cực quang xanh lục đang uốn lượn khiêu vũ trên nền trời sao rực rỡ.\n\n' +
        'Lá cờ thêu hình chim phượng hoàng lửa tung bay kiêu hãnh trong gió tuyết, dẫn lối cho những người con dũng cảm nhất tiến về phía chiến trường định mệnh.\n\n' +
        'Khí chất sử thi bi tráng và vẻ đẹp tráng lệ của lòng can đảm sẵn sàng hy sinh vì chính nghĩa thiêng liêng.',
    },
    {
      title: 'Thư viện cổ chứa đựng những cuốn sách thần chú',
      theme: 'Các giá sách gỗ khổng lồ cao chạm trần vòm đá cổ, những cuốn sách bọc da rồng tự động bay lượn và những quả cầu tri thức phát sáng vàng óng.',
      script:
        'Bước chân vào thư viện ma thuật của hội đồng pháp sư tối cao, bạn sẽ choáng ngợp trước những giá sách gỗ ngàn năm tuổi cao ngút ngàn chạm tới tận trần vòm đá.\n\n' +
        'Những cuốn sách thần chú bọc da rồng cổ xưa tự động vỗ cánh bay lượn trên không trung như những chú chim tri thức huyền bí.\n\n' +
        'Các quả cầu ký ức bằng pha lê phát ra ánh sáng vàng ấm áp, lưu giữ toàn bộ lịch sử thăng trầm của các nền văn minh ma thuật từng tồn tại trên cõi đời này.\n\n' +
        'Nơi tri thức chính là nguồn sức mạnh tối thượng có thể xoay chuyển càn khôn và kiến tạo nên những điều kỳ diệu nhất.',
    },
    {
      title: 'Bí ẩn thành phố Atlantis chìm sâu dưới đáy đại dương',
      theme: 'Những tòa lâu đài bằng đá cẩm thạch phủ san hô ngũ sắc dưới đáy biển sâu, mái vòm năng lượng pha lê bảo vệ tàn tích của một nền văn minh huy hoàng.',
      script:
        'Nằm sâu hàng ngàn mét dưới đáy biển thẳm u tối là thành phố huyền thoại Atlantis đã chìm vào giấc ngủ ngàn năm sau một cơn đại hồng thủy lịch sử.\n\n' +
        'Những cung điện nguy nga bằng đá cẩm thạch nay được phủ kín bởi những rạn san hô ngũ sắc rực rỡ và những đàn cá phát quang bơi lội thanh bình.\n\n' +
        'Mái vòm năng lượng bằng đại tinh thể pha lê trung tâm vẫn âm thầm phát ra vầng hào quang màu ngọc bích huyền bí bảo vệ trái tim của thành phố cổ.\n\n' +
        'Một kỳ quan kỳ ảo dưới đáy đại dương khơi gợi niềm đam mê khám phá bất tận của nhân loại về những nền văn minh đã mất.',
    },
    {
      title: 'Chiếc nhẫn quyền lực và lời nguyền ngàn năm',
      theme: 'Chiếc nhẫn vàng ròng khắc cổ ngữ lửa rực sáng trên phiến đá núi lửa đen tuyền, dung nham đỏ rực sôi sùng sục xung quanh đe dọa nuốt chửng vạn vật.',
      script:
        'Được tôi luyện sâu trong lòng núi lửa diệt vong bởi ý chí hắc ám của chúa tể bóng đêm, chiếc nhẫn vàng ròng nắm giữ quyền năng thao túng mọi tâm trí yếu mềm.\n\n' +
        'Những dòng cổ ngữ ma thuật phát sáng rực rỡ như những vệt lửa âm ỉ khắc sâu trên bề mặt kim loại hoàn mỹ không một tì vết.\n\n' +
        'Dung nham sôi sục sùng sục xung quanh như muốn nuốt chửng linh hồn của bất kỳ kẻ nào dám đưa tay chạm vào báu vật bị nguyền rủa.\n\n' +
        'Bài học muôn thuở về lòng tham quyền lực và sự thử thách khốc liệt nhất đối với bản lĩnh và sự trong sáng của trái tim con người.',
    },
    {
      title: 'Trận chiến bảo vệ cổng thành Minas vĩ đại',
      theme: 'Hàng vạn kỵ sĩ áo giáp bạc dàn trận trước đàn quái thú bóng tối',
      script:
        'Tiếng tù và bằng sừng rồng rền vang khắp thung lũng, báo hiệu giờ khắc sinh tử của vương quốc.\n\n' +
        'Từng mũi tên lửa xé toang màn sương mù, thắp sáng cả một chân trời ngập tràn gươm đao sáng loáng.\n\n' +
        'Đứng vững trước bóng tối hoặc vương triều sẽ sụp đổ vào tro bụi ngàn năm.',
    },
    {
      title: 'Lâu đài bay trên mây của tộc Tiên cổ đại',
      theme: 'Những ngọn tháp đá cẩm thạch trắng muốt lơ lửng giữa thác nước vô tận',
      script:
        'Những tảng đá nổi khổng lồ được kết nối bằng cầu treo bằng lụa tiên và rễ cây thần.\n\n' +
        'Đàn rồng bạch kim chao lượn quanh đỉnh tháp dát vàng, canh giữ nguồn suối nguồn tươi trẻ vĩnh hằng.\n\n' +
        'Thánh địa huyền bí cách biệt hoàn toàn khỏi thế giới trần tục đầy tham lam.',
    },
    {
      title: 'Cuộc thức tỉnh của hỏa long nghìn năm tuổi',
      theme: 'Lòng núi lửa sôi sục dung nham khi đôi mắt rồng rực lửa mở ra',
      script:
        'Mặt đất rung chuyển dữ dội, lớp vảy rồng cứng hơn thép tôi cọ xát vào vách đá phát ra tiếng sấm sét.\n\n' +
        'Đôi cánh khổng lồ dang rộng che khuất cả miệng núi lửa, thổi bùng lên cơn bão lửa thiêu đốt bầu trời.\n\n' +
        'Chúa tể bầu trời đã trở lại để đòi lại kho báu bị đánh cắp năm xưa.',
    },
    {
      title: 'Phù thủy tối cao triệu hồi thần thụ Yggdrasil',
      theme: 'Cây cối phát sáng rực rỡ trong khu rừng ma thuật nguyên thủy',
      script:
        'Cây trượng gỗ mun chạm khắc cổ ngữ Rune gõ mạnh xuống mặt đất phủ đầy rêu xanh phát quang.\n\n' +
        'Những rễ cây khổng lồ trồi lên cuộn tròn tạo thành bức tường thành ma thuật bất khả xâm phạm.\n\n' +
        'Sức mạnh cổ xưa của mẹ thiên nhiên thức giấc để bảo vệ các sinh linh vô tội.',
    },
    {
      title: 'Rèn thanh bảo kiếm Excalibur dưới đe thép thiên thạch',
      theme: 'Tia lửa thần thánh bắn tung tóe trong lò rèn của người lùn Dwarf',
      script:
        'Mảnh thiên thạch rơi từ vì sao sa được nung đỏ trong ngọn lửa rồng thiêng suốt bảy ngày bảy đêm.\n\n' +
        'Tiếng búa tạ của người thợ rèn huyền thoại nện xuống, tôi luyện nên lưỡi kiếm sắc bén có thể chém đứt cả không gian.\n\n' +
        'Thanh kiếm định mệnh đang chờ đợi vị vua chân chính của nhân loại.',
    },
    {
      title: 'Thư viện cấm thuật dưới đáy biển sâu',
      theme: 'Những cuốn sách ma thuật đóng bằng da thủy quái trôi lơ lửng trong bong bóng nước',
      script:
        'Tộc nhân ngư canh giữ những trang sách phép thuật cổ xưa ghi chép nguồn gốc của sự sáng thế.\n\n' +
        'Ánh sáng lân tinh từ san hô chiếu rọi những ký tự vàng ròng chuyển động ma mị trên trang giấy phép.\n\n' +
        'Nơi cất giữ những tri thức cấm kỵ có thể đảo lộn trật tự của toàn bộ lục địa.',
    },
    {
      title: 'Đoàn hiệp sĩ thánh chiến băng qua sa mạc xương trắng',
      theme: 'Bão cát ma thuật cuốn theo tiếng gào thét của các linh hồn lạc lối',
      script:
        'Lạc đà bọc giáp sắt kiên trì bước qua những đụn cát chứa đầy hài cốt của các vương triều đã lãng quên.\n\n' +
        'Ngọn cờ thêu hình sư tử vàng bay phần phật trong gió lốc, dẫn lối đoàn quân tiến về ốc đảo thần linh.\n\n' +
        'Ý chí kiên định vượt qua ranh giới mong manh giữa sự sống và cõi chết.',
    },
    {
      title: 'Lời tiên tri của nữ thần mặt trăng bên hồ thiêng',
      theme: 'Bóng trăng tròn vành vạnh soi rọi mái tóc bạc và đôi mắt nhìn thấu tương lai',
      script:
        'Mặt nước hồ phẳng lặng như gương bỗng gợn sóng khi giọt nước mắt thánh thần rơi xuống.\n\n' +
        'Bức tranh tương lai hiện lên với sự ra đời của đứa trẻ mang dấu ấn rồng thiêng trên vai phải.\n\n' +
        'Số mệnh của toàn bộ thế giới sắp sửa bước sang một chương sử thi mới đầy biến động.',
    },
    {
      title: 'Vượt thác nước tử thần trên lưng ưng sư Griffin',
      theme: 'Sinh vật huyền thoại nửa sư tử nửa đại bàng bay lượn qua hẻm núi sương mù',
      script:
        'Gió rít bên tai dữ dội khi đại bàng khổng lồ bổ nhào từ đỉnh mây xuống vực thẳm sâu ngàn trượng.\n\n' +
        'Bọt nước trắng xóa bắn tung tóe khi móng vuốt chim ưng lướt sát mặt dòng sông ngầm cuồn cuộn chảy.\n\n' +
        'Cảm giác tự do nghẹt thở khi làm chủ bầu trời huyền ảo.',
    },
    {
      title: 'Bữa tiệc rượu mừng chiến thắng tại đại sảnh Valhalla',
      theme: 'Những chiến binh bất tử ca hát bên bàn tiệc đầy ắp thịt rừng và mật ong',
      script:
        'Ngọn đuốc lớn bập bùng soi sáng những chiếc khiên đồng và đầu thú săn khổng lồ treo trên vách đá.\n\n' +
        'Tiếng cụng ly bằng sừng trâu vang dội hòa cùng khúc tráng ca ca ngợi lòng dũng cảm của các anh hùng tử trận.\n\n' +
        'Nơi vinh quang và lòng quả cảm được vinh danh bất tử đến muôn đời.',
    },
  ],

  // 23. Template: magazine_collage (20 mục)
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
    {
      title: 'Cà phê specialty: Cuộc cách mạng vị giác',
      theme: 'Cắt dán typography báo chí: hạt cà phê rang mộc, bình pha pour-over V60, bản đồ vùng trồng Ethiopia và vòng tròn hương vị flavor wheel.',
      script:
        'Cà phê làn sóng thứ ba Specialty Coffee không đơn thuần là một thức uống giúp tỉnh táo, mà là một cuộc cách mạng văn hóa thưởng thức đỉnh cao.\n\n' +
        'Phong cách cắt dán tạp chí ghép nối hình ảnh hạt cà phê chín mọng từ cao nguyên Ethiopia cùng quy trình pha chế Pour-over thủ công chính xác từng gram nước.\n\n' +
        'Từng giọt cà phê chiết xuất tinh khiết mang hương vị thanh tao của hoa nhài, cam bergamot và vị ngọt hậu sâu lắng của mật ong rừng.\n\n' +
        'Tôn vinh công sức của người nông dân vùng trồng và nghệ thuật rang xay tài hoa của các Barista đương đại!',
    },
    {
      title: 'Cơn sốt đĩa than Vinyl quay trở lại',
      theme: 'Cắt dán ảnh halftone phong cách Pop Art: đĩa than xoay tròn, bìa album nhạc Rock thập niên 70, tai nghe kiểm âm và phong cách retro nổi loạn.',
      script:
        'Giữa thời đại phát nhạc trực tuyến tiện lợi chỉ bằng một nút bấm, tại sao giới trẻ Gen Z lại phát cuồng săn lùng những chiếc đĩa than Vinyl cồng kềnh?\n\n' +
        'Đồ họa cắt dán tạp chí Pop-Art tái hiện cảm giác háo hức khi tự tay rút chiếc đĩa than đen bóng ra khỏi bìa giấy in nghệ thuật độc bản.\n\n' +
        'Tiếng kim đọc lách tách mộc mạc và chất âm analog ấm áp chân thực mang lại một trải nghiệm thưởng thức âm nhạc trọn vẹn bằng tất cả các giác quan.\n\n' +
        'Chậm lại một nhịp để cảm nhận trọn vẹn chiều sâu nghệ thuật của những album âm nhạc kinh điển vượt thời gian.',
    },
    {
      title: 'Văn hóa Sneakerhead: Khi đôi giày là nghệ thuật',
      theme: 'Cắt dán tạp chí thời trang đường phố: đôi giày Jordan cổ cao phối màu đối lập, hộp giày phiên bản giới hạn, nhãn giá hypebeast và con phố Brooklyn.',
      script:
        'Từ một vật dụng thể thao bảo vệ đôi chân, những đôi giày Sneaker đã tiến hóa thành biểu tượng thời trang và tác phẩm nghệ thuật đắt giá bậc nhất.\n\n' +
        'Thiết kế cắt dán báo chí phong cách đường phố Urban Streetwear: các mảng màu rực rỡ, đường cắt rách táo bạo kết hợp cùng những con số thống kê thị trường bán lại tỷ đô.\n\n' +
        'Sự kết hợp bùng nổ giữa các thương hiệu thời trang cao cấp và văn hóa Hip-hop đường phố đã định nghĩa lại khái niệm sang trọng của thế kỷ 21.\n\n' +
        'Mỗi đôi giày mang trên chân là một tuyên ngôn cá tính độc nhất vô nhị của người sở hữu!',
    },
    {
      title: 'Du lịch bền vững: Khám phá không để lại rác',
      theme: 'Cắt dán hình ảnh thiên nhiên và chất liệu giấy kraft tái chế: balo leo núi, bình nước kim loại, rừng rậm nhiệt đới và thông điệp Leave No Trace.',
      script:
        'Du lịch thế hệ mới không phải là check-in điểm đến thật nhiều để khoe ảnh, mà là cách chúng ta kết nối và bảo vệ mẹ thiên nhiên trên mỗi cung đường.\n\n' +
        'Bố cục cắt dán tạp chí chất liệu giấy thô mộc mạc: hình ảnh những cánh rừng nguyên sinh xanh biếc kết hợp cùng các mẹo du lịch sinh thái không xả rác thải nhựa.\n\n' +
        'Sử dụng đồ dùng tái chế, tôn trọng văn hóa bản địa và đóng góp trực tiếp cho kinh tế cộng đồng địa phương nơi bạn đặt chân tới.\n\n' +
        'Hãy chỉ để lại những dấu chân và mang về những ký ức đẹp đẽ nhất cùng sự trân quý thiên nhiên!',
    },
    {
      title: 'Thiết kế Retro-Futurism thịnh hành trở lại',
      theme: 'Cắt dán đồ họa thập niên 60 tưởng tượng về năm 2000: ghế quả trứng mạ chrome bóng loáng, màu cam neon đối lập xanh ngọc, kính mắt phi hành gia.',
      script:
        'Khi con người của thập niên 1960 mơ về thế giới tương lai của thế kỷ 21, họ đã sáng tạo nên phong cách thiết kế Retro-Futurism độc đáo bậc nhất.\n\n' +
        'Bố cục cắt dán tạp chí kết hợp giữa những đường cong bo tròn Space-Age bóng loáng mạ Chrome và bảng màu cam cháy rực rỡ đầy hoài niệm.\n\n' +
        'Sự giao thoa kỳ lạ giữa nét ngây ngô của công nghệ thời kỳ chinh phục vũ trụ sơ khai và tính thẩm mỹ avant-garde đương đại.\n\n' +
        'Một làn sóng thiết kế đang đổ bộ mạnh mẽ trở lại vào thế giới kiến trúc nội thất, thời trang và đồ họa toàn cầu!',
    },
    {
      title: 'Thế hệ Work-From-Home định nghĩa lại không gian',
      theme: 'Cắt dán tạp chí đời sống hiện đại: góc bàn làm việc cạnh cửa sổ ngập nắng, tách cà phê thơm, laptop mỏng nhẹ và trang phục công sở nửa thân trên.',
      script:
        'Làm việc từ xa Work-From-Home đã vĩnh viễn thay đổi mối quan hệ giữa con người, công việc và không gian sống hàng ngày.\n\n' +
        'Bố cục cắt dán báo chí hiện đại ghi lại những khoảnh khắc chân thực đầy hài hước: nửa thân trên mặc áo sơ mi chỉn chu họp Zoom, nửa thân dưới mặc quần đùi thoải mái.\n\n' +
        'Góc bàn làm việc nhỏ tại nhà được nâng cấp thành không gian sáng tạo tràn đầy cảm hứng với cây xanh, ánh sáng tự nhiên và âm nhạc êm dịu.\n\n' +
        'Tự do quản lý thời gian và tái tạo sự cân bằng trọn vẹn giữa sự nghiệp và đời sống tinh thần cá nhân.',
    },
    {
      title: 'Sức hút phong cách Y2K trong văn hóa đại chúng',
      theme: 'Cắt dán màu hồng fuchsia và bạc kim loại: điện thoại nắp gập đính đá lấp lánh, kính mắt râm tí hon, quần cạp trễ và đồ họa thẩm mỹ kỹ thuật số đầu năm 2000.',
      script:
        'Làn sóng thẩm mỹ Y2K bùng nổ trở lại và chiếm lĩnh hoàn toàn phong cách của thế hệ trẻ trên các nền tảng mạng xã hội hàng đầu thế giới.\n\n' +
        'Cắt dán tạp chí Pop rực rỡ với sắc hồng cánh sen chói lóa, chất liệu da bóng kim loại ánh bạc của những chiếc đĩa CD-ROM thời kỳ đầu Internet.\n\n' +
        'Những chiếc điện thoại nắp gập đính đá pha lê lấp lánh, kính mắt tí hon Matrix và tinh thần lạc quan không giới hạn của thời khắc chuyển giao thiên niên kỷ.\n\n' +
        'Thời trang luôn là một vòng tuần hoàn kỳ diệu, nơi những giá trị rực rỡ của quá khứ được tái sinh với một năng lượng mới tràn đầy sức sống!',
    },
    {
      title: 'Sống xanh không rác thải: Từ trào lưu đến thực tế',
      theme: 'Cắt dán hình ảnh lối sống Zero-Waste: túi vải tote mộc mạc, ống hút tre, hũ thủy tinh đựng hạt ngũ cốc và những mảng xanh đô thị tươi mát.',
      script:
        'Lối sống không rác thải Zero-Waste không phải là một sự ép buộc khắc khổ, mà là một hành trình giản lược để tìm thấy sự nhẹ nhõm cho tâm hồn.\n\n' +
        'Bố cục cắt dán tạp chí sinh thái với những mảng màu xanh lá và trắng ngà tối giản: thay thế túi nilon bằng túi vải tote bền đẹp, từ chối đồ nhựa dùng một lần.\n\n' +
        'Tự tay lựa chọn những sản phẩm thân thiện với môi trường, học cách tái chế và tận dụng tối đa giá trị sử dụng của từng món đồ dùng trong gia đình.\n\n' +
        'Mỗi hành động nhỏ bé tích cực của bạn hôm nay đều đang góp phần chữa lành cho hành tinh xanh của chúng ta ngày mai!',
    },
    {
      title: 'Xu hướng thời trang đường phố Y2K tái xuất',
      theme: 'Cắt dán typography nổi loạn, quần ống loe và màu hồng fuchsia rực rỡ',
      script:
        'Phong cách thời trang những năm 2000 đang làm mưa làm gió trở lại trên sàn diễn toàn cầu.\n\n' +
        'Kính râm gọng nhỏ tí hon, áo croptop in họa tiết bướm kết hợp cùng phụ kiện kim loại lấp lánh.\n\n' +
        'Cá tính, tự do và một chút nổi loạn tạo nên tuyên ngôn phong cách của thế hệ Gen Z.',
    },
    {
      title: 'Cà phê specialty và văn hóa sống chậm của giới trẻ',
      theme: 'Ảnh cắt ghép tách cà phê pour-over, đĩa than vinyl và hoa khô vintage',
      script:
        'Bỏ lại những vội vã của đô thị, giới trẻ tìm về những góc quán nhỏ thơm nồng hương hạt Geisha rang nhẹ.\n\n' +
        'Từng giọt cà phê nhỏ chậm rãi là khoảng lặng để đọc một trang sách hay và trò chuyện cùng bạn bè.\n\n' +
        'Sống trọn vẹn từng khoảnh khắc hiện tại qua hương vị thuần khiết của thiên nhiên.',
    },
    {
      title: 'Nghệ thuật xăm hình tối giản Fineline',
      theme: 'Từng đường nét mảnh như tơ khắc họa câu chuyện cuộc đời trên làn da',
      script:
        'Không còn là những mảng mực hầm hố, phong cách xăm nét mảnh mang lại vẻ đẹp thanh lịch và tinh tế.\n\n' +
        'Một chòm sao nhỏ, một nhành hoa dại hay ngày sinh của người thân yêu được lưu giữ vĩnh viễn.\n\n' +
        'Nghệ thuật thể hiện bản sắc cá nhân một cách nhẹ nhàng nhưng sâu sắc.',
    },
    {
      title: 'Chế độ ăn xanh Eat Clean và lối sống thuần thực vật',
      theme: 'Cắt dán sinh động các loại quả bơ, hạt chia, ngũ cốc và rau củ tươi rói',
      script:
        'Lắng nghe cơ thể bằng những bữa ăn giàu dinh dưỡng tự nhiên không qua chế biến cầu kỳ.\n\n' +
        'Bát salad sắc màu cầu vồng cung cấp nguồn năng lượng sạch lành mạnh cho cả ngày dài năng động.\n\n' +
        'Khỏe đẹp từ bên trong bắt đầu từ sự lựa chọn thực phẩm thông thái mỗi ngày.',
    },
    {
      title: 'Bí quyết decor phòng ngủ phong cách Bắc Âu Scandinavian',
      theme: 'Gam màu trắng be trung tính, thảm lông ấm áp và đồ nội thất gỗ sồi mộc',
      script:
        'Tối giản đồ đạc để đón trọn nguồn ánh sáng tự nhiên qua khung cửa sổ rộng mở.\n\n' +
        'Điểm xuyết vài chậu cây xanh nhỏ và ngọn nến thơm hương quế ấm cúng cho buổi tối thư giãn.\n\n' +
        'Biến không gian sống nhỏ thành tổ ấm bình yên nhất sau ngày dài bận rộn.',
    },
    {
      title: 'Chụp ảnh Film 35mm - Thú chơi kiên nhẫn giữa thời đại số',
      theme: 'Hộp cuộn phim Kodak vàng rực, máy ảnh cơ cổ điển và những vệt sáng lọt sáng nghệ thuật',
      script:
        'Không có màn hình xem lại tức thì, mỗi lần bấm cò là một khoảnh khắc đánh cược đầy hồi hộp.\n\n' +
        'Chờ đợi từng cuộn phim tráng ra trong phòng tối là niềm vui mà điện thoại thông minh không bao giờ có được.\n\n' +
        'Vẻ đẹp của những hạt grain hoài niệm lưu giữ thời gian một cách chân thực nhất.',
    },
    {
      title: 'Du lịch cắm trại Glamping sang chảnh giữa thiên nhiên',
      theme: 'Lều chuông vintage, đèn đom đóm lãng mạn và tiệc nướng BBQ bên bờ suối',
      script:
        'Trải nghiệm hòa mình vào thiên nhiên hoang sơ nhưng vẫn tận hưởng sự tiện nghi của khách sạn năm sao.\n\n' +
        'Nằm ngắm trời sao lấp lánh qua cửa sổ lều, nghe tiếng suối róc rách và thưởng thức ly vang đỏ ấm nồng.\n\n' +
        'Kỳ nghỉ cuối tuần hoàn hảo để tái tạo năng lượng cho tâm hồn mỏi mệt.',
    },
    {
      title: 'Phong cách sống tối giản Minimalist Capsule Wardrobe',
      theme: 'Cắt ghép 10 món đồ cơ bản phối thành 30 trang phục thanh lịch cho tuần mới',
      script:
        'Một chiếc áo sơ mi trắng dáng rộng, quần tây đen ống suông và đôi giày loafer da cổ điển.\n\n' +
        'Giảm bớt thời gian đắn đo \'hôm nay mặc gì\' để tập trung tâm trí cho những quyết định quan trọng hơn.\n\n' +
        'Ít hơn nhưng chất lượng hơn - đỉnh cao của sự tự do trong phong cách sống.',
    },
    {
      title: 'Bảo tàng nghệ thuật đương đại và những góc check-in nghệ thuật',
      theme: 'Các khối hình học tương phản, tượng điêu khắc trừu tượng và ánh sáng kiến trúc',
      script:
        'Nơi những bức tranh trừu tượng khổ lớn đối thoại cùng không gian triển lãm tối giản.\n\n' +
        'Một bộ trang phục đơn sắc đủ để bạn hòa mình trở thành một phần của tác phẩm nghệ thuật sống động.\n\n' +
        'Khám phá chiều sâu tâm hồn qua lăng kính thẩm mỹ đương đại.',
    },
    {
      title: 'Âm nhạc Indie Việt - Tiếng lòng mộc mạc của thế hệ trẻ',
      theme: 'Đàn guitar thùng, micro retro và những lời ca tự sự chạm sâu vào trái tim',
      script:
        'Không cần phòng thu triệu đô hay chiến dịch truyền thông rầm rộ, những ca khúc mộc mạc vẫn lay động hàng triệu trái tim.\n\n' +
        'Lời ca chân thành kể về nỗi cô đơn của tuổi trẻ, những vấp ngã đầu đời và niềm tin vào ngày mai.\n\n' +
        'Giai điệu của sự đồng cảm và chữa lành tâm hồn sâu sắc.',
    },
  ],

  // 24. Template: brand_clean (20 mục)
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
    {
      title: 'Tinh chất dưỡng da chống lão hóa thiên nhiên',
      theme: 'Chai serum thủy tinh mờ tối giản đặt trên khối đá cẩm thạch trắng, giọt tinh chất trong suốt rơi chậm rãi, khoảng trống lớn thanh lịch.',
      script:
        'Vẻ đẹp thuần khiết nhất bắt nguồn từ sự giản đơn và tinh túy của thiên nhiên nguyên bản.\n\n' +
        'Chai tinh chất dưỡng da cao cấp với thiết kế chai thủy tinh mờ tối giản tuyệt đối, chứa đựng công thức phục hồi tế bào chiết xuất từ hoa trà núi tuyết.\n\n' +
        'Kết cấu lỏng nhẹ thấm sâu sau 3 giây, cung cấp độ ẩm chuyên sâu và tái tạo hàng rào bảo vệ tự nhiên cho làn da căng mọng rạng rỡ.\n\n' +
        'Không hóa chất độc hại, không hương liệu nhân tạo — sự chăm sóc dịu dàng và an toàn tuyệt đối cho làn da của bạn mỗi ngày.',
    },
    {
      title: 'Ghế làm việc công thái học định hình tư thế',
      theme: 'Góc chụp 45 độ chiếc ghế công thái học màu xám tro tối giản trong căn phòng trắng tinh khôi, đường cong tựa lưng nâng đỡ cột sống hoàn hảo.',
      script:
        'Được thiết kế dựa trên các nghiên cứu chuyên sâu về giải phẫu học cơ thể con người hiện đại.\n\n' +
        'Chiếc ghế công thái học tối giản này sở hữu đường cong tựa lưng thông minh tự động thích ứng theo từng chuyển động nhỏ nhất của cột sống.\n\n' +
        'Chất liệu lưới sinh học siêu thoáng khí kết hợp cùng cơ chế ngả lưng đa điểm giúp giải tỏa hoàn toàn áp lực đè nặng lên vùng thắt lưng suốt 8 giờ làm việc liên tục.\n\n' +
        'Đầu tư cho một tư thế ngồi đúng chuẩn chính là đầu tư cho sức khỏe và hiệu suất làm việc bền vững suốt cuộc đời bạn.',
    },
    {
      title: 'Bình gốm thủ công phong cách tối giản Bắc Âu',
      theme: 'Bình gốm dáng hình học trừu tượng màu be ấm áp, cắm một nhánh cỏ lau khô duy nhất đặt trên bệ gỗ sồi dưới vệt nắng tự nhiên.',
      script:
        'Nghệ thuật bài trí không gian sống phong cách Scandinavian tôn vinh vẻ đẹp của sự giản lược và khoảng lặng tinh tế.\n\n' +
        'Chiếc bình gốm thủ công được vuốt nặn hoàn toàn bằng tay với những đường nét hình học trừu tượng mềm mại và lớp men mờ màu be ấm áp.\n\n' +
        'Chỉ cần cắm một nhành hoa khô hay nhánh cỏ lau mộc mạc, cả căn phòng của bạn bỗng trở nên thanh lịch và tràn ngập chất thơ nghệ thuật.\n\n' +
        'Biến ngôi nhà thành chốn bình yên đích thực nơi tâm hồn bạn được thả lỏng và tìm về sự cân bằng tĩnh tại.',
    },
    {
      title: 'Bàn phím cơ thiết kế tinh giản cho góc làm việc',
      theme: 'Bàn phím cơ layout 75% tông màu trắng xám tối giản, vỏ nhôm anode mờ cao cấp, núm xoay âm lượng kim loại và ánh sáng LED trắng dịu mắt.',
      script:
        'Sự kết hợp hoàn hảo giữa cảm giác gõ phím cơ học êm ái và phong cách thiết kế tối giản đỉnh cao cho góc làm việc hiện đại.\n\n' +
        'Vỏ nhôm nguyên khối xử lý bề mặt Anode mịn màng như lụa, phím bấm PBT cao cấp chống bám vân tay và hệ thống đèn nền LED trắng dịu mắt bảo vệ thị lực ban đêm.\n\n' +
        'Kết nối không dây đa thiết bị mượt mà chỉ bằng một nút gạt nhẹ nhàng, mang lại không gian bàn làm việc gọn gàng không dây vướng víu.\n\n' +
        'Công cụ làm việc lý tưởng nâng tầm cảm hứng sáng tạo cho các nhà văn, lập trình viên và nhà thiết kế chuyên nghiệp!',
    },
    {
      title: 'Đồng hồ cơ khí lộ máy thể hiện đẳng cấp',
      theme: 'Mặt đồng hồ tròn viền thép không gỉ sáng bóng, mặt kính sapphire trong suốt để lộ cỗ máy cơ khí Skeleton tinh xảo với dây da bê thủ công.',
      script:
        'Đỉnh cao của nghệ thuật chế tác cơ khí chính xác được thu nhỏ hoàn mỹ trên cổ tay người đàn ông thành đạt.\n\n' +
        'Mặt kính Sapphire nguyên khối chống trầy xước tuyệt đối để lộ từng bánh răng và bánh xe cân bằng đang dao động nhịp nhàng với tần số 28.800 nhịp mỗi giờ.\n\n' +
        'Dây da bê thủ công khâu tay tỉ mỉ bằng chỉ sáp, mang lại cảm giác ôm tay mềm mại và vẻ đẹp lịch lãm trường tồn cùng thời gian.\n\n' +
        'Không chỉ là một cỗ máy đo đếm thời gian, mà là một biểu tượng khẳng định phong thái tự tin và gu thẩm mỹ tinh tế của chủ nhân.',
    },
    {
      title: 'Ứng dụng ngân hàng số chuyển tiền siêu tốc 3 giây',
      theme: 'Giao diện UI ứng dụng FinTech trên smartphone viền mỏng: tông màu đen vàng kim sang trọng, thao tác quét Face ID chuyển tiền thành công tích tắc.',
      script:
        'Quản lý tài chính cá nhân và giao dịch chuyển khoản chưa bao giờ trở nên nhanh chóng, an toàn và tinh tế đến thế.\n\n' +
        'Ứng dụng ngân hàng số thế hệ mới với giao diện tối giản chuẩn mực: loại bỏ hoàn toàn các banner quảng cáo phiền toái, tập trung trọn vẹn vào trải nghiệm người dùng.\n\n' +
        'Xác thực sinh trắc học Face ID bảo mật đa lớp chuẩn ngân hàng quốc tế, thực hiện lệnh chuyển tiền liên ngân hàng 24/7 chỉ trong đúng 3 giây tích tắc.\n\n' +
        'Làm chủ dòng tiền của bạn một cách thông minh và tiện lợi nhất ngay trong lòng bàn tay!',
    },
    {
      title: 'Dòng sản phẩm nến thơm hữu cơ thư giãn tinh thần',
      theme: 'Hũ nến sáp đậu nành màu trắng mờ, ngọn lửa bấc gỗ kêu lách tách êm dịu, hương gỗ tuyết tùng và hổ phách lan tỏa trong không gian.',
      script:
        'Khép lại một ngày dài làm việc bận rộn bằng nghi thức thắp nến thơm quen thuộc để xoa dịu các giác quan mỏi mệt.\n\n' +
        'Được đúc thủ công từ 100% sáp đậu nành thiên nhiên hữu cơ và tinh dầu nguyên chất nhập khẩu từ vùng Grasse nước Pháp.\n\n' +
        'Bấc nến bằng gỗ tự nhiên phát ra tiếng lách tách êm tai như than củi mùa đông, lan tỏa hương thơm ấm áp của gỗ tuyết tùng, hổ phách và vani ngọt ngào.\n\n' +
        'Thanh lọc không khí, xua tan căng thẳng và đưa bạn vào một giấc ngủ sâu thư thái an lành.',
    },
    {
      title: 'Vali kéo du lịch siêu nhẹ chống va đập',
      theme: 'Chiếc vali kéo màu xám titan vỏ polycarbonate vân xước đứng bên cửa kính sân bay quốc tế, bánh xe kép xoay 360 độ siêu êm ái.',
      script:
        'Người bạn đồng hành tin cậy và thanh lịch trên mọi nẻo đường khám phá thế giới của những tín đồ xê dịch hiện đại.\n\n' +
        'Vỏ vali đúc từ chất liệu Polycarbonate 3 lớp siêu đàn hồi chống nứt vỡ tuyệt đối ngay cả dưới những va đập mạnh mẽ nhất trong hầm hành lý máy bay.\n\n' +
        'Hệ thống 4 bánh xe kép bọc cao su non xoay 360 độ lướt đi êm ru trên mọi địa hình mà không phát ra bất kỳ tiếng ồn khó chịu nào.\n\n' +
        'Khóa số âm chuẩn an ninh quốc tế TSA bảo vệ an toàn tuyệt đối cho toàn bộ hành lý quý giá của bạn trên mọi chuyến bay!',
    },
    {
      title: 'Bộ nhận diện thương hiệu mỹ phẩm thuần chay Cocoon',
      theme: 'Tone màu nâu đất tự nhiên, chai thủy tinh tái chế và lá cà phê Đắk Lắk',
      script:
        'Cam kết 100% không thử nghiệm trên động vật và nguồn nguyên liệu nông sản Việt Nam sạch lành.\n\n' +
        'Thiết kế bao bì tối giản, tôn vinh vẻ đẹp mộc mạc của hạt cà phê, vỏ bưởi và nghệ Hưng Yên.\n\n' +
        'Lựa chọn làm đẹp bền vững vì một hành tinh xanh không rác thải nhựa.',
    },
    {
      title: 'Ra mắt đồng hồ thông minh siêu nhẹ bằng hợp kim Titan',
      theme: 'Khối kim loại bay lơ lửng trên nền đen mờ với ánh sáng viền tinh xảo',
      script:
        'Chỉ nặng 28 gram nhưng sở hữu độ bền bỉ vượt qua mọi bài kiểm tra quân sự khắc nghiệt.\n\n' +
        'Theo dõi nhịp tim, nồng độ oxy và chỉ số giấc ngủ chính xác đến từng phần trăm với cảm biến sinh học thế hệ mới.\n\n' +
        'Công nghệ đỉnh cao gói gọn trong một thiết kế thanh lịch vượt thời gian.',
    },
    {
      title: 'Dòng xe điện gia đình thân thiện với môi trường',
      theme: 'Đường nét khí động học mượt mà lướt qua thành phố xanh thông minh',
      script:
        'Tầm hoạt động hơn 500 km sau một lần sạc nhanh 15 phút tại trạm sạc tiêu chuẩn.\n\n' +
        'Khoang nội thất bọc da nhân tạo sinh học cao cấp, hệ thống tự hành thông minh cấp độ 3 bảo vệ gia đình bạn.\n\n' +
        'Khởi đầu kỷ nguyên di chuyển xanh không khí thải cho thế hệ tương lai.',
    },
    {
      title: 'Ứng dụng thanh toán không tiền mặt bảo mật lượng tử',
      theme: 'Giao diện tối giản với chuyển động mượt mà và biểu tượng bảo mật phát sáng',
      script:
        'Chuyển tiền chỉ với một chạm NFC, mã hóa sinh trắc học khuôn mặt 3D chống giả mạo tuyệt đối.\n\n' +
        'Quản lý tài chính cá nhân thông minh với biểu đồ chi tiêu trực quan được phân tích tự động bằng AI.\n\n' +
        'Đơn giản hóa mọi giao dịch tài chính hàng ngày của bạn chỉ trong chớp mắt.',
    },
    {
      title: 'Bộ sưu tập nệm cao su thiên nhiên nâng đỡ cột sống',
      theme: 'Mặt cắt cấu trúc tổ ong thoáng khí trên nền vải dệt tơ tằm mềm mại',
      script:
        'Chiết xuất 100% mủ cao su thiên nhiên từ những nông trường Bình Dương bạt ngàn.\n\n' +
        'Thiết kế nâng đỡ 7 vùng cơ thể giúp giải tỏa hoàn toàn áp lực lên lưng và cổ sau ngày dài mệt mỏi.\n\n' +
        'Đem lại giấc ngủ sâu êm ái và phục hồi sinh lực trọn vẹn mỗi đêm.',
    },
    {
      title: 'Chuỗi phòng khám nha khoa thẩm mỹ chuẩn quốc tế',
      theme: 'Không gian vô trùng trắng sáng kết hợp gỗ ấm và ánh sáng dịu mắt',
      script:
        'Công nghệ quét dấu răng 3D không xâm lấn, xem trước nụ cười hoàn mỹ trước khi can thiệp.\n\n' +
        'Đội ngũ bác sĩ tu nghiệp chuyên sâu tại Đức, mang đến trải nghiệm điều trị êm ái hoàn toàn không đau.\n\n' +
        'Tự tin tỏa sáng với nụ cười rạng rỡ và hàm răng chắc khỏe tự nhiên.',
    },
    {
      title: 'Thương hiệu trà Shan Tuyết cổ thụ Hà Giang',
      theme: 'Búp chè trắng phủ lông tơ tuyết và hộp thiếc khắc laser hoa văn mộc bản',
      script:
        'Thu hái thủ công từ những cây chè cổ thụ hơn 300 năm tuổi trên đỉnh Tây Côn Lĩnh mây phủ quanh năm.\n\n' +
        'Nước trà vàng óng như mật ong rừng, tiền chát dịu nhẹ và hậu ngọt sâu lắng kéo dài mãi nơi cuống họng.\n\n' +
        'Tinh hoa trà đạo Việt Nam vươn tầm quà tặng ngoại giao cao cấp.',
    },
    {
      title: 'Hệ thống lọc không khí gia đình thông minh HEPA H14',
      theme: 'Màng lọc đa tầng nano loại bỏ 99.99% bụi mịn PM2.5 và vi khuẩn',
      script:
        'Cảm biến laser phát hiện ô nhiễm không khí trong 0.1 giây và tự động tăng tốc lọc khí cực êm ái.\n\n' +
        'Thiết kế hình trụ tròn tối giản hòa hợp hoàn hảo với mọi không gian phòng khách hiện đại.\n\n' +
        'Bảo vệ lá phổi non nớt của con trẻ khỏi tác nhân ô nhiễm đô thị độc hại.',
    },
    {
      title: 'Thương hiệu vali kéo du lịch siêu bền bằng nhôm nguyên khối',
      theme: 'Khung nhôm anodized bạc mờ với góc bo chống va đập bọc đinh tán thép',
      script:
        'Bánh xe xoay 360 độ giảm chấn êm ái lướt nhẹ nhàng trên mọi địa hình sân bay gồ ghề.\n\n' +
        'Khóa số TSA đạt chuẩn an ninh quốc tế bảo vệ an toàn tuyệt đối mọi hành lý đắt giá của bạn.\n\n' +
        'Người bạn đồng hành tin cậy trên hàng triệu dặm bay khám phá thế giới.',
    },
    {
      title: 'Nước hoa thủ công chiết xuất hoa sen trắng Tây Hồ',
      theme: 'Chai thủy tinh vát cạnh khúc xạ ánh sáng chứa dung dịch vàng nhạt thanh tao',
      script:
        'Hương thơm thanh khiết của búp sen sớm mai quyện cùng gỗ tuyết tùng trầm ấm và trà xanh mộc mạc.\n\n' +
        'Độ lưu hương bền bỉ suốt 12 giờ tạo nên phong thái thanh lịch, dịu dàng và đầy cuốn hút.\n\n' +
        'Bản hòa ca hương sắc phương Đông dành riêng cho người sành hương tinh tế.',
    },
  ],

  // 25. Template: pixel_retro (20 mục)
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
    {
      title: 'Đấu boss rồng lửa khổng lồ ở màn chơi cuối',
      theme: 'Giao diện game RPG 16-bit: kiếm sĩ tí hon giơ kiếm phát sáng, thanh máu boss rồng lửa đỏ rực trên đỉnh tháp đổ nát dung nham cuồn cuộn.',
      script:
        'Chào mừng bạn đến với màn chơi cuối cùng của thế giới game Pixel 16-bit huyền thoại trên máy chơi game SNES cổ điển!\n\n' +
        'Sau khi vượt qua 8 thế giới hiểm trở, người dũng sĩ tí hon đối mặt với trùm cuối rồng lửa khổng lồ đang phun những quả cầu lửa pixel đỏ rực.\n\n' +
        'Thanh máu Boss dài dằng dặc đang tụt dần theo từng cú chém chí mạng nhấp nháy ánh sáng trắng trên màn hình tivi CRT bo góc.\n\n' +
        'Khúc nhạc nền Chiptune 8-bit dồn dập vang lên đẩy cảm xúc kịch tính lên đến đỉnh điểm của tuổi thơ rực rỡ!',
    },
    {
      title: 'Nông trại vui vẻ: Trồng củ cải và nuôi bò sữa',
      theme: 'Khung cảnh nông trại pixel xanh mướt kiểu Harvest Moon: chú nông dân tí hon tưới nước luống củ cải, đàn gà con lon ton và chú bò sữa béo mầm.',
      script:
        'Tạm gác lại những xô bồ của thế giới thực để hóa thân thành một người nông dân thực thụ trong nông trại Pixel Harvest Moon yên bình.\n\n' +
        'Mỗi buổi sáng sớm thức dậy, chú nhân vật tí hon cầm bình tưới nước cho từng luống củ cải trắng đang nhú mầm xanh tốt.\n\n' +
        'Vuốt ve chú bò sữa đốm trắng đen mập mạp để thu hoạch những chai sữa tươi béo ngậy, nhặt những quả trứng gà vàng ươm trong ổ rơm ấm áp.\n\n' +
        'Lối chơi mộc mạc và giai điệu đồng quê vui nhộn chữa lành mọi âu lo căng thẳng sau những giờ học tập mỏi mệt.',
    },
    {
      title: 'Cuộc đua xe pixel nghẹt thở trên cao tốc 8-bit',
      theme: 'Góc nhìn từ sau xe đua F1 màu đỏ pixel, lạng lách qua các xe chướng ngại vật trên đường cao tốc ven biển hoàng hôn rực rỡ.',
      script:
        'Tiếng động cơ gầm rú giòn giã kiểu máy chơi game 4 nút cắm băng khi đèn tín hiệu xuất phát chuyển sang màu xanh lá!\n\n' +
        'Chiếc xe đua công thức 1 màu đỏ pixel lạng lách thần sầu né tránh các đối thủ cản đường trên đường cao tốc ven biển trải dài ngút ngàn.\n\n' +
        'Hiệu ứng cuộn màn hình thị sai Parallax Scrolling tái hiện những rặng dừa và ánh hoàng hôn đỏ rực trôi lùi lại phía sau sống động.\n\n' +
        'Cảm giác drift cháy bánh xe ôm cua khúc quanh hiểm trở mang lại niềm phấn khích tột độ không thể nào quên!',
    },
    {
      title: 'Khám phá ngục tối Dungeon bí ẩn nhặt rương kho báu',
      theme: 'Chiến binh cầm đuốc đi trong hầm ngục gạch đá pixel tối tăm, né bẫy chông sắt bật lên và mở rương kho báu vàng bạc phát sáng chói lọi.',
      script:
        'Bước chân vào ngục tối Dungeon bí ẩn dưới lòng pháo đài cổ với chiếc đuốc bập bùng thắp sáng từng viên gạch lát đá xám xịt.\n\n' +
        'Khéo léo nhảy qua những hố chông sắt nhọn hoắt bất ngờ bật lên từ sàn nhà và vô hiệu hóa những bức tượng bắn tên ma thuật cổ xưa.\n\n' +
        'Ở căn phòng bí mật cuối cùng, chiếc rương kho báu bằng gỗ nẹp vàng từ từ mở nắp, tỏa ra ánh sáng lấp lánh của hàng ngàn đồng tiền vàng và vũ khí huyền thoại.\n\n' +
        'Cảm giác chinh phục và khám phá những điều bí ẩn luôn là linh hồn bất tử của dòng game nhập vai kinh điển.',
    },
    {
      title: 'Trận chiến phi thuyền không gian bắn ruồi',
      theme: 'Bầu trời vũ trụ đen thẫm đầy sao pixel, phi thuyền không gian tí hon bắn đạn laser xanh đỏ tiêu diệt đàn quái vật không gian Galaga.',
      script:
        'Hồi ức về những buổi chiều trốn học cùng lũ bạn tụ tập quanh chiếc máy chơi game thùng Arcade rộn rã tiếng xu xèng leng keng.\n\n' +
        'Chiếc phi thuyền không gian màu bạc di chuyển linh hoạt ở cạnh đáy màn hình, liên tục bắn ra những chùm tia laser tiêu diệt đàn quái vật ngoài hành tinh đang xếp đội hình bổ nhào.\n\n' +
        'Hiệu ứng nổ tung thành từng khối pixel rực rỡ và điểm số nhảy số liên tục \'100... 500... 1000\' khiến người chơi không thể rời mắt.\n\n' +
        'Một trò chơi đơn giản nhưng chứa đựng cả một bầu trời hoài niệm tuổi thơ của thế hệ 8x, 9x đời đầu.',
    },
    {
      title: 'Quán rượu tavern của các nhà thám hiểm sau chuyến đi xa',
      theme: 'Quán rượu gỗ ấm áp phong cách Trung Cổ pixel: ngọn lửa bập bùng trong lò sưởi, người chơi đàn luýt ngân nga và các dũng sĩ nâng ly bia bọt trắng xóa.',
      script:
        'Sau những trận chiến sinh tử ngoài chiến trường khốc liệt, quán rượu làng chài nhỏ là chốn dừng chân ấm áp nhất của các hiệp sĩ dũng cảm.\n\n' +
        'Bên trong lò sưởi bập bùng ngọn lửa ấm áp, chú chuột túi và người lùn nâng ly bia lúa mạch sủi bọt trắng xóa chúc mừng chiến thắng vang dội.\n\n' +
        'Người nghệ sĩ lang thang ngồi bên góc bàn gỗ mộc gảy khúc nhạc đàn luýt trầm ấm kể về những huyền thoại anh hùng đã đi qua.\n\n' +
        'Không gian ấm cúng và đầy chất thơ của thế giới kỳ ảo cổ điển khiến bất kỳ ai cũng muốn được nán lại thật lâu.',
    },
    {
      title: 'Chiến thuật phòng thủ tháp canh ngăn quái vật',
      theme: 'Bản đồ đường đi zíc zắc: xây dựng tháp cung tên, tháp băng làm chậm và tháp pháo lửa ngăn chặn làn sóng quái vật pixel tràn vào thành.',
      script:
        'Căng thẳng tính toán từng đồng tiền vàng để bố trí hệ thống tháp phòng thủ kiên cố ngăn chặn các đợt tấn công dồn dập của bầy yêu tinh Goblin.\n\n' +
        'Tháp cung thủ gỗ bắn tên liên hoàn ở đoạn đường thẳng, kết hợp cùng tháp băng phù thủy làm chậm tốc độ di chuyển của bầy quái vật ở khúc cua hiểm trở.\n\n' +
        'Đến đợt lính thứ 20, tháp pháo đại bác nâng cấp lên cấp độ tối thượng phụt ra những quả cầu lửa thiêu rụi toàn bộ đạo quân xâm lược trong gang tấc.\n\n' +
        'Sức hấp dẫn đỉnh cao của dòng game chiến thuật đòi hỏi sự tính toán chiến lược và phản xạ nhanh nhạy của người chơi!',
    },
    {
      title: 'Khúc nhạc chiptune hoài niệm máy chơi game cầm tay',
      theme: 'Chiếc máy chơi game Game Boy màu xám màn hình xanh lá cổ điển, nốt nhạc pixel 8-bit bay bổng quanh các phím bấm D-Pad và A B đỏ.',
      script:
        'Âm thanh Chiptune 8-bit phát ra từ chiếc loa nhỏ của chiếc máy chơi game Game Boy cầm tay huyền thoại có một sức quyến rũ kỳ lạ không thể trộn lẫn.\n\n' +
        'Chỉ với 4 kênh âm thanh điện tử tổng hợp đơn sơ: hai kênh sóng vuông, một kênh sóng tam giác và một kênh tiếng ồn trắng.\n\n' +
        'Những nhà soạn nhạc tài hoa của thập niên 90 đã tạo nên những giai điệu kinh điển bất hủ đi cùng năm tháng như Mario, Tetris hay Pokemon.\n\n' +
        'Âm thanh của tuổi thơ vô tư, của những buổi trưa trốn ngủ nằm cuộn tròn dưới gầm chăn bấm máy say mê quên cả thời gian.',
    },
    {
      title: 'Hiệp sĩ 8-bit giải cứu công chúa khỏi lâu đài rồng',
      theme: 'Đồ họa pixel hoài niệm hệ máy NES với nhạc chiptune vui nhộn',
      script:
        'Nhảy qua chướng ngại vật dung nham sôi sục và né tránh những quả cầu lửa của quái vật.\n\n' +
        'Thu thập thanh kiếm thần phát sáng và chiếc khiên sắt để tiến vào căn phòng ngai vàng cuối cùng.\n\n' +
        'Chiến thắng vang dội đưa tuổi thơ ngây ngô quay trở lại với những nút bấm tay cầm bốn nút.',
    },
    {
      title: 'Một ngày làm việc ở nông trại pixel Stardew',
      theme: 'Tưới nước cho những luống dâu tây đỏ mọng và cho gà ăn ngũ cốc',
      script:
        'Bình minh lên ở thung lũng xanh, cầm chiếc bình tưới nhỏ tưới cho luống cà rốt đang nhú mầm.\n\n' +
        'Chiều xuống mang cần câu ra bờ biển nghe tiếng sóng 8-bit rì rào và nhặt vỏ ốc xà cừ.\n\n' +
        'Cuộc sống thôn quê bình yên không lo âu trong thế giới pixel đầy màu sắc.',
    },
    {
      title: 'Quán rượu Cyberpunk phong cách pixel 16-bit',
      theme: 'Mưa rơi tí tách ngoài cửa kính và ánh đèn neon phản chiếu trên ly cocktail',
      script:
        'Bác bartender người máy lau ly rượu trong lúc lắng nghe tâm sự của chàng thám tử tư mệt mỏi.\n\n' +
        'Bản nhạc lo-fi 8-bit nhẹ nhàng xoa dịu những vết thương lòng của những con người cô đơn nơi phố thị.\n\n' +
        'Một góc nhỏ ấm cúng và đầy chất thơ giữa lòng thế giới tương lai u tối.',
    },
    {
      title: 'Cuộc đua xe địa hình pixel trên sa mạc bụi mù',
      theme: 'Chiếc xe jeep pixel nhảy qua cồn cát và nhặt bình tăng tốc nitro',
      script:
        'Vút ga tăng tốc, drift cua gấp qua những tảng đá khổng lồ để vượt mặt đối thủ ngay trước vạch đích.\n\n' +
        'Khói bụi pixel bay mù mịt phía sau bánh xe trong tiếng động cơ giòn giã của máy arcade thùng gỗ.\n\n' +
        'Cảm giác phấn khích tột độ của những tựa game đua xe cổ điển bất hủ.',
    },
    {
      title: 'Mèo pixel bắt cá trong ao làng mùa hè',
      theme: 'Chú mèo mướp đuôi cụt rình mồi bên bờ ao đầy lá sen xanh',
      script:
        'Bàn chân lông mềm mại vồ nhanh xuống nước, tóm gọn chú cá vàng đang bơi lội tung tăng.\n\n' +
        'Nằm phơi bụng ngủ dưới bóng râm gốc đa già trong tiếng ve râm ran trưa hè oi ả.\n\n' +
        'Sự đáng yêu và ngộ nghĩnh qua từng điểm ảnh vuông vức sống động.',
    },
    {
      title: 'Đột kích hầm ngục Dungeon tối tăm chứa kho báu',
      theme: 'Đuốc bập bùng trên vách đá rêu phong và bầy dơi ma quái bay loạn xạ',
      script:
        'Pháp sư dùng gậy phép bắn ra tia sét xanh, chiến binh vung búa sắt phá tan cánh cửa đá niêm phong.\n\n' +
        'Chiếc rương vàng óng ánh bật mở, rơi ra hàng ngàn đồng xu và bình thuốc hồi máu phát sáng.\n\n' +
        'Chuyến phiêu lưu nhập vai thám hiểm đầy kịch tính của thời đại game nhập vai cổ điển.',
    },
    {
      title: 'Trận chiến không gian bảo vệ Trái Đất Space Invaders',
      theme: 'Tàu chiến laser bắn hạ từng hàng quái vật ngoài hành tinh rơi xuống',
      script:
        'Di chuyển tàu chiến qua lại né đạn laser và bắn tỉa từng phi thuyền mẹ của người ngoài hành tinh.\n\n' +
        'Âm thanh \'pew pew\' đặc trưng và bảng điểm số nhấp nháy chữ HIGHSCORE đỏ rực kích thích thần kinh.\n\n' +
        'Huyền thoại game điện tử xèng làm say đắm hàng triệu game thủ khắp thế giới.',
    },
    {
      title: 'Căn phòng ngủ thập niên 90 với máy băng Nintendo',
      theme: 'Tivi CRT màn hình cong dày cộp cắm băng game Mario màu vàng',
      script:
        'Thổi phù phù vào chân cắm băng điện tử trước khi ấn mạnh nút POWER trên thân máy.\n\n' +
        'Tiếng khởi động quen thuộc vang lên khiến hai anh em nhảy cẫng lên reo hò trong buổi chiều hè.\n\n' +
        'Ký ức vô giá về một tuổi thơ giản dị bên cạnh chiếc tivi thùng đắt giá.',
    },
    {
      title: 'Thành phố pixel nhìn từ ban công đêm mưa',
      theme: 'Những tòa nhà cao tầng chớp tắt đèn vàng và tàu điện trên cao lướt qua',
      script:
        'Cốc mì tôm bốc khói trên bàn học bên cạnh chiếc máy tính GameBoy Color phát sáng trong đêm.\n\n' +
        'Những hạt mưa pixel rơi chéo qua màn hình mang lại cảm giác bình yên đến lạ kỳ.\n\n' +
        'Nơi ký ức tuổi thơ và nghệ thuật số hiện đại giao thoa đầy cảm xúc.',
    },
    {
      title: 'Nấu ăn trong quán mì Ramen pixel ấm cúng',
      theme: 'Nồi nước dùng sôi sùng sục và từng vắt mì vàng óng được vớt lên ráo nước',
      script:
        'Thái lát thịt xá xíu thơm lừng, xếp quả trứng lòng đào và rong biển khô lên trên bát sứ hoa văn xanh lam.\n\n' +
        'Bát mì nóng hổi được trao tay vị khách đang lạnh cóng vì cơn mưa tuyết ngoài cửa tiệm.\n\n' +
        'Sự ấm áp lan tỏa từ một món ăn bình dị được vẽ bằng cả tấm lòng người nghệ sĩ pixel.',
    },
  ],

  // 26. Template: retro_vhs (20 mục)
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
    {
      title: 'Hướng dẫn tập thể dục nhịp điệu aerobic trên băng VHS',
      theme: 'Trang phục áo bó sát màu neon rực rỡ thập niên 80, động tác giơ tay nhún nhảy theo nhạc synth-pop, hiệu ứng sọc quét nhiễu từ scanline VHS.',
      script:
        'Cuộn băng VHS màu đen cũ kỹ đưa chúng ta quay trở về trào lưu thể dục nhịp điệu Aerobic bùng nổ khắp thế giới vào thập niên 1980.\n\n' +
        'Những huấn luyện viên trong trang phục bó sát màu hồng cánh sen và tất chân len rực rỡ nhún nhảy theo giai điệu nhạc điện tử Synth-Pop sôi động.\n\n' +
        'Hiệu ứng đường quét scanlines ngang màn hình và dòng chữ \'PLAY ► 00:15:23\' màu xanh lá cây chớp nháy quen thuộc ở góc dưới.\n\n' +
        'Một nguồn năng lượng tích cực, ngây ngô và đầy sức sống của một thời kỳ văn hóa đại chúng đầy sắc màu và đam mê.',
    },
    {
      title: 'Buổi biểu diễn ca nhạc của ban nhạc Rock sinh viên',
      theme: 'Sân khấu hội trường trường đại học năm 1995, đèn par màu vàng cam chập chờn, tay guitar điện tóc dài quạt chả và khán giả reo hò cuồng nhiệt.',
      script:
        'Thước phim tư liệu quý giá ghi lại buổi biểu diễn trực tiếp của một ban nhạc Rock sinh viên tại hội trường đại học năm 1995.\n\n' +
        'Chất lượng hình ảnh mờ nhòe nhuốm màu quang sai sắc ký kết hợp cùng tiếng micro hú vang tạo nên một không khí thô ráp và chân thực đến gai người.\n\n' +
        'Tay guitar điện tóc dài quạt những hợp âm bão táp trên cây đàn Fender cũ, dưới khán phòng hàng trăm sinh viên vẫy tay hát theo lời ca tuổi trẻ rực lửa.\n\n' +
        'Nơi đam mê âm nhạc được thăng hoa thuần khiết không cần đến những công nghệ kỹ xảo sân khấu đắt tiền.',
    },
    {
      title: 'Chuyến du lịch biển mùa hè qua máy quay băng từ',
      theme: 'Gia đình nhỏ dạo chơi trên bãi biển Sầm Sơn / Vũng Tàu năm 1996, phao bơi con vịt màu vàng, sóng biển nhấp nhô và nụ cười ngây thơ của trẻ nhỏ.',
      script:
        'Chiếc máy quay phim cầm tay Panasonic dùng băng từ VHS-C của bố đã lưu lại những khoảnh khắc vô giá của mùa hè năm ấy.\n\n' +
        'Bãi biển cát vàng rực rỡ ngập tràn tiếng sóng vỗ, lũ trẻ con ôm chiếc phao bơi hình con vịt vàng toe toét cười đùa trước ống kính máy quay.\n\n' +
        'Màu sắc hơi ngả vàng ấm áp đặc trưng của chất liệu phim từ trường tạo nên một cảm giác thân thương và xúc động khó tả.\n\n' +
        'Thời gian có thể trôi qua và công nghệ có thể đổi thay, nhưng tình cảm gia đình ấm áp được lưu giữ trong những cuốn băng cũ sẽ sống mãi cùng năm tháng.',
    },
    {
      title: 'Đoạn quảng cáo nước giải khát xưa cũ với âm thanh mono',
      theme: 'Chai nước ngọt thủy tinh nắp khoen bật nắp xì bọt, logo vẽ tay phong cách retro năm 1992, giọng thuyết minh hào sảng và nhạc hiệu vui nhộn.',
      script:
        'Bật lại đoạn băng quảng cáo truyền hình phát sóng trước giờ thời sự lúc 7 giờ tối trên kênh truyền hình quốc gia năm 1992.\n\n' +
        'Chai nước giải khát thủy tinh có nắp khoen bật nắp phát ra tiếng \'xì\' sủi bọt mát lạnh, dòng chữ slogan vẽ tay mộc mạc chạy từ từ trên màn hình CRT bo tròn.\n\n' +
        'Giọng thuyết minh hào sảng của phát thanh viên thời kỳ đầu kết hợp cùng đoạn nhạc hiệu vui tươi đơn giản ghi sâu vào tiềm thức của nhiều thế hệ khán giả.\n\n' +
        'Nét duyên dáng và mộc mạc của buổi bình minh ngành quảng cáo thương mại Việt Nam thuở mới mở cửa.',
    },
    {
      title: 'Cửa hàng cho thuê băng đĩa phim đông đúc ngày cuối tuần',
      theme: 'Những kệ gỗ xếp chật kín hàng ngàn hộp băng video nhựa VHS phim chưởng Hồng Kông, tấm biển hiệu vẽ tay bằng sơn đỏ \'Cho thuê băng đĩa\'.',
      script:
        'Chiều thứ Bảy nào cũng vậy, căn tiệm cho thuê băng đĩa nhỏ ở đầu phố lại tấp nập các cô chú và thanh niên ghé qua chọn phim cuối tuần.\n\n' +
        'Những hộp băng nhựa màu đen dán nhãn giấy viết tay tên các bộ phim chưởng kiếm hiệp Hồng Kông, phim bộ TVB và phim hành động Hollywood kinh điển.\n\n' +
        'Đặt cọc chứng minh thư nhân dân và vài ngàn đồng tiền thuê, ôm hai cuộn băng về nhà háo hức quây quần bên chiếc đầu từ 4 đầu từ để thưởng thức.\n\n' +
        'Một nét văn hóa giải trí gia đình bình dị và đầy gắn kết của một thời chưa có Internet và điện thoại thông minh.',
    },
    {
      title: 'Buổi chiều đá bóng nhựa trên sân gạch của xóm nghèo',
      theme: 'Lũ trẻ xóm nghèo cởi trần đá bóng nhựa màu cam trên sân gạch đình làng, đôi dép tổ ong làm khung thành, ánh hoàng hôn phủ vàng ký ức.',
      script:
        'Ống kính máy quay băng từ lia theo bước chân trần thoăn thoắt của lũ trẻ xóm nghèo đang say sưa tranh cướp quả bóng nhựa màu cam.\n\n' +
        'Hai chiếc dép tổ ong sứt quai đặt hai bên làm khung thành, tiếng cãi vã xem bóng đã vào lưới hay chưa vang vọng rộn rã khắp khoảng sân đình gạch đỏ.\n\n' +
        'Những giọt mồ hôi nhễ nhại trên trán hòa cùng nụ cười rạng rỡ hồn nhiên dưới ánh nắng hoàng hôn chiều tà buông xuống mái ngói rêu phong.\n\n' +
        'Ký ức tuổi thơ nghèo khó mà ngập tràn niềm vui và sự gắn bó nghĩa tình của tình làng nghĩa xóm.',
    },
    {
      title: 'Lời chúc sinh nhật ghi lại trên cuộn băng từ',
      theme: 'Bữa tiệc sinh nhật giản dị với chiếc bánh kem bơ hoa hồng, những ngọn nến lung linh và lời chúc ngập ngừng của đám bạn thân năm 1998.',
      script:
        'Cắm cuộn băng video gia đình vào đầu đọc VHS, hình ảnh bữa tiệc sinh nhật tuổi 18 năm 1998 bỗng hiện lên sống động trên màn hình tivi CRT bo góc.\n\n' +
        'Chiếc bánh sinh nhật kem bơ vẽ hình hoa hồng giản dị cắm 18 cây nến nhỏ lung linh thắp sáng những gương mặt ngây thơ của đám bạn thân thuở học trò.\n\n' +
        'Từng đứa bạn ngượng ngùng bước lại gần ống kính máy quay, ấp úng gửi gắm những lời chúc tốt đẹp nhất cho chặng đường tương lai phía trước.\n\n' +
        'Nhiều người trong số họ nay đã đi xa, nhưng tình bạn thuần khiết năm ấy vẫn mãi vẹn nguyên trong từng thước phim tư liệu nhuốm màu thời gian.',
    },
    {
      title: 'Ký ức chiếc tivi đen trắng có râu ăng-ten cả xóm quây quần',
      theme: 'Chiếc tivi đen trắng cửa lùa hiệu Samsung/Hitachi đặt giữa sân gạch, cả xóm mang chiếu quạt nan sang xem phim bộ lúc 8 giờ tối.',
      script:
        'Thời kỳ mà cả con ngõ dài chỉ có duy nhất một chiếc tivi đen trắng vỏ gỗ có hai chiếc râu ăng-ten dài ngoằng vươn lên mái nhà.\n\n' +
        'Cứ đến 8 giờ tối, bà con chòm xóm lại rủ nhau mang theo chiếc chiếu cói và chiếc quạt nan sang trải kín sân gạch để cùng xem phim truyền hình.\n\n' +
        'Thỉnh thoảng màn hình lại bị nhiễu sọc hột mè và mất tiếng, một bác thanh niên lại phải chạy ra xoay chiếc cột ăng-ten tre đón sóng.\n\n' +
        'Cuộc sống vật chất thuở ấy tuy còn nhiều thiếu thốn nhọc nhằn, nhưng tình làng nghĩa xóm lại ấm áp và chan chứa nghĩa tình biết bao nhiêu.',
    },
    {
      title: 'Kỷ yếu mùa hè năm 1995 ghi bằng máy quay băng từ',
      theme: 'Hiệu ứng nhiễu từ scanline, ngày giờ góc màn hình nhấp nháy đỏ',
      script:
        'Nụ cười rạng rỡ của nhóm bạn tuổi mười tám bên chiếc xe máy Cub 50 cũ kỹ ven hồ Tây.\n\n' +
        'Âm thanh rè rè của tiếng gió lùa vào micro máy quay cầm tay Panasonic cồng kềnh.\n\n' +
        'Những khoảnh khắc thanh xuân vô giá được đóng băng vĩnh viễn trên dải băng từ tính nhuốm màu thời gian.',
    },
    {
      title: 'Băng quảng cáo đồ chơi robot thập niên 80',
      theme: 'Màu sắc tương phản rực rỡ, giọng lồng tiếng sôi nổi hào hứng',
      script:
        '\'Biến hình chỉ trong 3 bước! Sở hữu ngay siêu chiến binh không gian để bảo vệ vũ trụ!\'.\n\n' +
        'Hiệu ứng nổ bùm chéo bằng kỹ xảo analog thô sơ nhưng đầy mê hoặc với trẻ em thời ấy.\n\n' +
        'Cơn sốt đồ chơi thời thơ ấu khiến mọi đứa trẻ đều đứng ngắm say mê trước tủ kính bách hóa.',
    },
    {
      title: 'Bài tập thể dục nhịp điệu aerobic sôi động năm 1992',
      theme: 'Trang phục leotard bó sát màu neon rực rỡ và băng đô đội đầu',
      script:
        'Tiếng nhạc disco điện tử dồn dập vang lên cùng nhịp đếm: \'Một, hai, ba, bốn, giơ tay cao lên nào!\'.\n\n' +
        'Những bước nhảy dẻo dai khỏe khoắn xua tan cái lạnh mùa đông, truyền cảm hứng sống vui khỏe cho mọi nhà.\n\n' +
        'Trào lưu thể dục thẩm mỹ làm khuấy đảo màn ảnh nhỏ của hàng triệu gia đình thập niên 90.',
    },
    {
      title: 'Cuốn băng video đám cưới quê xưa năm 1998',
      theme: 'Rạp cưới căng bạt dù sọc xanh đỏ, pháo hoa giấy nổ râm ran',
      script:
        'Cô dâu e ấp trong bộ váy cưới ren bồng bềnh cầm bó hoa lay ơn đỏ, chú rể mặc comple rộng thùng thình.\n\n' +
        'Bà con chòm xóm nâng ly rượu chúc mừng rôm rả bên mâm cỗ đầy ắp giò lụa, nem rán và xôi gấc.\n\n' +
        'Không khí ấm áp, chân tình của tình làng nghĩa xóm thuở đất nước vừa mở cửa.',
    },
    {
      title: 'Chương trình dự báo thời tiết truyền hình analog xưa',
      theme: 'Bản đồ thời tiết vẽ tay đơn sơ và tiếng nhạc hiệu quen thuộc',
      script:
        '\'Bắc Bộ đêm không mưa, sáng sớm có sương mù nhẹ, nhiệt độ thấp nhất từ 18 đến 21 độ C\'.\n\n' +
        'Cả gia đình quây quần bên mâm cơm tối lắng nghe tin gió mùa đông bắc sắp tràn về.\n\n' +
        'Ký ức bình dị gắn liền với chiếc tivi đen trắng có râu ăng-ten phải xoay liên tục để bắt sóng.',
    },
    {
      title: 'Băng hướng dẫn nấu ăn bằng lò vi sóng mới xuất hiện',
      theme: 'Kỹ thuật đồ họa 3D sơ khai và font chữ sans-serif viền đen cổ điển',
      script:
        'Khám phá thiết bị gia dụng hiện đại nhất thế kỷ giúp hâm nóng thức ăn chỉ trong 60 giây.\n\n' +
        'Chiếc đĩa xoay tròn dưới ánh đèn vàng mang lại cảm giác công nghệ tương lai bước vào từng gian bếp.\n\n' +
        'Sự thay đổi ngoạn mục trong thói quen sinh hoạt của các gia đình đô thị thời kỳ đổi mới.',
    },
    {
      title: 'Băng tư liệu bóng đá World Cup 1994',
      theme: 'Cú sút luân lưu định mệnh của Roberto Baggio trên sân Rose Bowl rực nắng',
      script:
        'Cả triệu trái tim nín thở theo dõi bước chạy đà của chàng hoàng tử tóc đuôi ngựa người Ý.\n\n' +
        'Bóng bay vọt xà ngang trong sự ngỡ ngàng tột cùng và nỗi thất vọng vô bờ bến của hàng triệu cổ động viên.\n\n' +
        'Khoảnh khắc bi tráng nhất lịch sử bóng đá thế giới được lưu giữ qua ống kính máy quay VHS.',
    },
    {
      title: 'Video ca nhạc MTV Top Hits năm 1999',
      theme: 'Vũ đạo bốc lửa của các ban nhạc nam Backstreet Boys, Westlife',
      script:
        'Những chàng trai mặc đồ da trắng nhảy múa dưới cơn mưa nhân tạo trên sân khấu hoành tráng.\n\n' +
        'Giai điệu pop ballad ngọt ngào làm say đắm biết bao trái tim tuổi mới lớn qua chiếc máy cassette nhỏ.\n\n' +
        'Thời kỳ hoàng kim của nền âm nhạc đại chúng toàn cầu trước kỷ nguyên internet.',
    },
    {
      title: 'Đêm ca nhạc Làn Sóng Xanh tại sân khấu Lan Anh',
      theme: 'Biển người giơ cao que phát sáng cổ vũ thần tượng âm nhạc Việt',
      script:
        'Tiếng hát cất lên hòa cùng tiếng reo hò rền vang của hàng ngàn khán giả trẻ Sài Gòn.\n\n' +
        'Những bản hit sống mãi cùng thời gian định hình nền nhạc trẻ Việt Nam những năm đầu thập niên 2000.\n\n' +
        'Ngọn lửa đam mê và nhiệt huyết tuổi trẻ bùng cháy rực rỡ trong từng khuôn hình video mờ ảo.',
    },
    {
      title: 'Băng tư liệu bí ẩn tìm thấy trong căn hầm bỏ hoang',
      theme: 'Ánh sáng chập chờn, âm thanh tạp âm nhiễu sóng và những hình bóng kỳ lạ',
      script:
        'Ngày 14 tháng 10 năm 1993, nhóm thám hiểm ghi lại những hiện tượng dị thường trong cánh rừng cấm.\n\n' +
        'Máy quay rung lắc dữ dội khi tiếng bước chân nặng nề tiến lại gần chiếc lều bạt trong đêm đen.\n\n' +
        'Thể loại phim kinh dị giả tài liệu Found Footage mang lại cảm giác rùng rợn ám ảnh tột cùng.',
    },
  ],

  // 27. Template: ink_guofeng (20 mục)
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
    {
      title: 'Cây tùng ngàn năm sừng sững trên vách đá',
      theme: 'Nét cọ mực đậm nét gân guốc phác họa cây tùng bách ngàn tuổi mọc nghiêng trên vách đá hiểm trở, sương mây trắng xóa lượn quanh.',
      script:
        'Sừng sững trên đỉnh vách đá dựng đứng cheo leo giữa mây ngàn gió lộng, cây tùng bách ngàn năm tuổi vẫn kiên cường cắm rễ sâu vào kẽ đá cằn cỗi.\n\n' +
        'Nét cọ thủy mặc gân guốc đầy nội lực lột tả thân cây xù xì phong trần vượt qua muôn ngàn trận bão tuyết và giông sét của đất trời.\n\n' +
        'Tán lá xanh thẫm vươn dài che chở cho tổ chim nhỏ, biểu tượng bất diệt cho khí phách hiên ngang, chính trực của người quân tử giữa dòng đời biến thiên.\n\n' +
        'Càng nơi nghịch cảnh hiểm nghèo, phẩm giá và sức sống kiên cường của tâm hồn lại càng tỏa sáng rực rỡ.',
    },
    {
      title: 'Bông sen trắng tinh khôi vươn lên giữa đầm bùn',
      theme: 'Mực loang nhẹ nhàng thanh thoát: phiến lá sen to tròn điểm xuyết giọt sương mai, búp sen trắng tinh khiết hé nở ngát hương thơm.',
      script:
        'Gốc rễ chìm sâu dưới đáy bùn lầy tăm tối, nhưng đóa sen trắng vẫn kiên trì vươn mình lên khỏi mặt nước đón lấy ánh nắng ban mai trong lành.\n\n' +
        'Nét vẽ thủy mặc tả ý với những mảng mực loang nhạt mờ tạo nên phiến lá sen xum xuê nâng đỡ từng cánh hoa trắng muốt thanh tao.\n\n' +
        'Một giọt sương mai đọng trên đài sen lăn tăn phản chiếu ánh sáng tinh khôi, tỏa ra hương thơm dịu nhẹ thanh khiết làm say đắm lòng người.\n\n' +
        '\'Gần bùn mà chẳng hôi tanh mùi bùn\' — bài học muôn đời về việc giữ gìn tâm hồn trong sạch giữa những cám dỗ của chốn hồng trần.',
    },
    {
      title: 'Đôi cá chép bơi lội dưới bóng hoa súng hồ thu',
      theme: 'Khoảng trắng thủy mặc mênh mông tượng trưng cho mặt nước trong vắt, đôi cá chép vờn đuôi mềm mại bơi lượn dưới phiến lá hoa súng tím.',
      script:
        'Nghệ thuật chừa trắng bậc thầy của tranh thủy mặc biến khoảng trống trên trang giấy xuyến chỉ thành mặt hồ mùa thu phẳng lặng và trong vắt vô ngần.\n\n' +
        'Đôi cá chép màu mực thẫm uốn lượn chiếc đuôi mềm mại tựa như dải lụa bay lượn trong làn nước mát lành.\n\n' +
        'Bóng hoa súng tím biếc khẽ đung đưa in bóng xuống đáy nước, tạo nên một bức tranh sơn thủy thanh bình và tràn ngập sinh khí tự nhiên.\n\n' +
        'Vạn vật ung dung tự tại, hòa mình vào nhịp thở êm đềm của đất trời mà không màng tới những tranh đoạt hơn thua của thế gian.',
    },
    {
      title: 'Thuyền câu cô độc giữa bão tuyết mùa đông',
      theme: 'Cả không gian trắng xóa tuyết rơi mịt mùng, con thuyền nan cô độc trôi giữa dòng sông băng, người câu cá mặc áo tơi ngồi tĩnh lặng.',
      script:
        'Ngàn non chim bay dứt, vạn nẻo dấu người tiêu — tuyệt tác thi họa \'Giang tuyết\' hiện lên qua nét vẽ thủy mặc trầm mặc và cô tịch.\n\n' +
        'Giữa muôn trùng bão tuyết trắng xóa mịt mùng phủ kín non sông, con thuyền nan bé nhỏ trôi lững lờ giữa dòng sông lạnh giá.\n\n' +
        'Người ông lão đội nón lá khoác áo tơi bằng cỏ ngồi bất động buông cần câu cá trong sự tĩnh lặng tuyệt đối của tâm hồn.\n\n' +
        'Khi tâm ta đã tĩnh như nước hồ mùa đông, mọi phong ba bão táp của ngoại cảnh ngoài kia đều không thể làm lay chuyển được sự an định bên trong.',
    },
    {
      title: 'Tiếng suối reo róc rách qua ghềnh đá non cao',
      theme: 'Dòng thác bạc từ đỉnh núi cao đổ xuống qua các tầng đá rêu phong, khói nước mờ ảo hòa quyện cùng rừng tùng vi vu trong gió sớm.',
      script:
        'Bắt nguồn từ những đỉnh núi non cao mây phủ trắng xóa, dòng suối bạc tuôn trào róc rách qua từng phiến đá hoa cương nghìn năm tuổi.\n\n' +
        'Nét bút thủy mặc phóng khoáng miêu tả làn nước uốn lượn mềm mại khi thì êm ả như dải lụa tiên, lúc lại tung bọt trắng xóa qua những ghềnh đá hiểm trở.\n\n' +
        'Hơi nước bốc lên thành làn sương mỏng manh bay lượn quanh những rặng trúc xanh tươi mơn mởn bên sườn núi.\n\n' +
        'Lắng nghe tiếng suối reo hòa cùng tiếng gió rừng vi vu, tâm trí người lữ khách bỗng gột rửa sạch sẽ mọi bụi bặm của chốn thị thành.',
    },
    {
      title: 'Ánh trăng soi bóng chén trà cổ phong tao nhã',
      theme: 'Bàn đá dưới gốc cây hoa mai nở muộn, ấm trà gốm tử sa bốc khói mỏng manh và bóng trăng vằng vặc soi đáy chén trà thanh tao.',
      script:
        'Đêm rằm thanh vắng, vầng trăng tròn vành vạnh như chiếc đĩa ngọc treo lơ lửng trên cành hoa mai cổ thụ đang bung nở những cánh hoa trắng muốt.\n\n' +
        'Bên chiếc bàn đá rêu phong, người tri kỷ nâng chén trà gốm tử sa ấm nóng, ngắm nhìn bóng trăng thu nhỏ đang khẽ lung linh nơi đáy chén ngọc bích.\n\n' +
        'Nhấp một ngụm trà xuân đượm hương hoa thơm ngát, nghe vị đắng nhẹ đầu lưỡi chuyển dần thành vị ngọt thanh khiết nơi cổ họng.\n\n' +
        'Cuộc đời có được một tri kỷ cùng ngồi thưởng trà ngắm trăng dưới trời đêm thanh tịnh, há chẳng phải là diễm phúc lớn nhất của kiếp nhân sinh?',
    },
    {
      title: 'Ngọn núi mờ sương ẩn hiện triết lý hư vô',
      theme: 'Những đỉnh núi đá vôi nhấp nhô ẩn hiện giữa biển mây trắng bồng bềnh, nét cọ đậm nhạt ước lệ thể hiện triết lý hòa nhập thiên nhiên.',
      script:
        'Nhìn từ xa, những đỉnh núi đá vôi trùng điệp thoắt ẩn thoắt hiện giữa đại dương mây trắng bồng bềnh tựa như những hòn đảo thần tiên bồng lai tiên cảnh.\n\n' +
        'Nét cọ đậm sắc ở tiền cảnh chuyển dần thành những vệt mực nhạt nhòa mờ ảo nơi chân trời xa xăm, thể hiện triết lý sắc sắc không không của đạo thiền cổ xưa.\n\n' +
        'Con người chỉ là một chấm nhỏ bé khiêm nhường giữa bức tranh thiên nhiên vô cùng vô tận của tạo hóa.\n\n' +
        'Học cách buông bỏ cái tôi nhỏ hẹp để hòa mình vào sự tuần hoàn bất tận của vũ trụ bao la.',
    },
    {
      title: 'Thác Bản Giốc mùa nước đổ tranh thủy mặc',
      theme: 'Nét cọ phóng khoáng miêu tả dòng thác cuồn cuộn đổ xuống vực sâu tung bọt trắng',
      script:
        'Mực đen loang trên giấy xuyến chỉ ẩm, tạc nên vách đá vôi sừng sững uy nghiêm giữa mây ngàn.\n\n' +
        'Dòng thác bạc đổ ầm vang như muôn ngàn vó ngựa tung hoành giữa núi rừng biên cương hùng vĩ.\n\n' +
        'Sự hòa quyện tuyệt mỹ giữa sự dữ dội của nước và sự tĩnh lặng của đá núi ngàn năm.',
    },
    {
      title: 'Cá chép vượt vũ môn hóa rồng',
      theme: 'Vảy cá lấp lánh ẩn hiện trong sóng nước cuộn trào và mây ngũ sắc',
      script:
        'Bơi ngược dòng thác dữ hiểm trở, chú cá chép kiên cường không chịu lùi bước trước sóng gió trần ai.\n\n' +
        'Khi chạm tới đỉnh cổng trời, sấm chớp nổ vang, vảy hóa thành giáp vàng, râu hóa thành rồng bay vút lên chín tầng mây.\n\n' +
        'Biểu tượng bất diệt cho ý chí kiên định vượt khó vươn tới đỉnh cao vinh quang.',
    },
    {
      title: 'Rừng trúc xanh reo trong gió thu man mác',
      theme: 'Những thân trúc mảnh mai kiên cường uốn lượn theo từng cơn gió thổi',
      script:
        'Nét mực khô cạn vẽ nên đốt trúc thanh cao, ngàn chiếc lá trúc nhọn như mũi tên bay trong gió sương.\n\n' +
        'Tiếng lá xào xạc hòa cùng tiếng suối róc rách tạo nên bản hòa tấu thanh tịnh của chốn ẩn dật.\n\n' +
        'Khí tiết người quân tử vững vàng trước mọi bão giông cuộc đời.',
    },
    {
      title: 'Cánh hạc trắng bay về tổ dưới ánh tà dương',
      theme: 'Đôi cánh mềm mại lướt qua rặng tùng cổ thụ ngàn năm tuổi',
      script:
        'Mặt trời đỏ ối như giọt chu sa chìm dần sau rặng núi xa mờ mịt khói sương.\n\n' +
        'Đàn hạc tiên trắng muốt chao lượn tìm về ngọn tùng già, mang theo sự an yên thanh thoát của cõi bồng lai.\n\n' +
        'Bức tranh thủy mặc đượm vẻ thoát tục và trường thọ an khang.',
    },
    {
      title: 'Độc hành câu cá giữa mùa đông tuyết phủ',
      theme: 'Chiếc thuyền nan cô độc trôi giữa dòng sông băng trắng xóa lạnh lẽo',
      script:
        'Ngàn non chim bay vắng, muôn lối dấu người không. Chỉ có ông lão khoác áo tơi ngồi câu cá trên sông lạnh.\n\n' +
        'Không bận tâm đến rét buốt thấu xương, tâm trí người buông cần đã hòa vào cõi hư không vô định.\n\n' +
        'Đỉnh cao của sự tĩnh lặng và cảnh giới tự tại trong tâm hồn.',
    },
    {
      title: 'Hoa sen nở trong đầm bùn ngát hương thơm',
      theme: 'Nét bút đẫm mực chấm phá cánh sen hồng phai và giọt sương mai tinh khiết',
      script:
        'Gần bùn mà chẳng hôi tanh mùi bùn, búp sen vươn lên đón ánh bình minh rạng rỡ của đất trời.\n\n' +
        'Lá sen tròn xòe rộng nâng đỡ những hạt ngọc nước long lanh trong gió sớm ban mai.\n\n' +
        'Vẻ đẹp thuần khiết, thanh cao vượt lên mọi ô trọc của chốn bụi trần.',
    },
    {
      title: 'Trà đạo bên am cỏ ngắm trăng rằm',
      theme: 'Khói trà nghi ngút hòa cùng ánh trăng sáng vằng vặc soi qua chấn song',
      script:
        'Bếp than hoa đượm hồng đun ấm nước suối đầu nguồn, hương trà xanh thanh tao lan tỏa khắp am vắng.\n\n' +
        'Nâng chén trà thơm đối ẩm cùng bóng hình mình dưới trăng, rũ bỏ hết mọi thị phi danh lợi phù du.\n\n' +
        'Một khoảnh khắc an lạc tuyệt đối nơi chốn thiền môn tĩnh mịch.',
    },
    {
      title: 'Mã đáo thành công - Đàn tuấn mã phi nước đại',
      theme: 'Nét cọ tung hoành tái hiện sức mạnh cơ bắp cuồn cuộn của bầy ngựa chiến',
      script:
        'Bờm ngựa tung bay trong gió lốc, móng sắt nện rung chuyển đất trời cuốn theo bụi mù mịt.\n\n' +
        'Tám con tuấn mã tràn đầy sinh lực cùng phi về một hướng, mang lại điềm lành đại cát đại lợi.\n\n' +
        'Khí thế ngút trời của tinh thần tiên phong mở đường thắng lợi.',
    },
    {
      title: 'Cúc họa mi khoe sắc dưới sương mai đầu đông',
      theme: 'Cánh hoa trắng tinh khôi nhụy vàng điểm xuyết trên nền mực xám trầm mặc',
      script:
        'Mặc cho gió lạnh đầu mùa se sắt thổi qua cành khô lá úa, những bông cúc nhỏ vẫn kiêu hãnh bung nở.\n\n' +
        'Hương thơm dịu dàng, kín đáo báo hiệu khúc giao mùa lãng mạn của đất trời phương Bắc.\n\n' +
        'Sức sống âm thầm nhưng bền bỉ của những điều giản dị quanh ta.',
    },
    {
      title: 'Kiếm sĩ luyện kiếm trên đỉnh núi phù vân',
      theme: 'Đường kiếm sắc lẹm xé toang màn sương mù mịt bao quanh đỉnh đá',
      script:
        'Áo trắng bay phần phật trên vách đá cheo leo, kiếm khí vung ra tạo thành những đường mực cuộn trào sắc lẹm.\n\n' +
        'Người và kiếm hòa làm một, xuất chiêu nhẹ nhàng như gió thoảng nhưng uy lực tựa sấm sét thiên lôi.\n\n' +
        'Cảnh giới tối thượng của kiếm đạo phương Đông: vô chiêu thắng hữu chiêu.',
    },
  ],

  // 28. Template: travel_vlog (20 mục)
  travel_vlog: [
    {
      title: 'Hà Giang mùa hoa tam giác mạch',
      theme: 'Cung đèo hiểm trở hùng vĩ, sông Nho Quế màu xanh ngọc bích uốn lượn, thung lũng hoa tím hồng và nụ cười trẻ thơ vùng cao.',
      script:
        'Nếu bạn đang tìm một chuyến đi để đánh thức mọi giác quan, hãy xách ba lô lên và đến với Hà Giang ngay mùa thu này.\n\n' +
        'Đứng trên đỉnh Mã Pí Lèng nhìn xuống dòng sông Nho Quế uốn lượn như dải lụa xanh biếc giữa đại ngàn đá núi.\n\n' +
        'Những cánh đồng hoa tam giác mạch tím hồng nở rộ khắp các triền đồi, hòa cùng tiếng khèn Mông vang vọng trong sương mai.\n\n' +
        'Tuổi trẻ ngắn ngủi lắm, nhất định phải một lần đặt chân đến nơi địa đầu Tổ quốc này nhé!',
    },
    {
      title: '24 giờ lạc bước ở phố cổ Kyoto',
      theme: 'Khám phá xứ sở hoa anh đào: cổng Torii đỏ rực rỡ Fushimi Inari lúc bình minh, rừng trúc Arashiyama xào xạc và nghệ thuật trà đạo matcha.',
      script:
        '24 giờ tại Kyoto sẽ dạy cho bạn biết thế nào là vẻ đẹp của sự tĩnh lặng và hoài cổ.\n\n' +
        'Sáng sớm tinh mơ, khi những vạt nắng đầu tiên chiếu qua hàng ngàn cánh cổng Torii đỏ thắm trải dài ngút ngàn.\n\n' +
        'Buổi chiều dạo bước qua rừng trúc Arashiyama ngút ngàn tiếng gió reo, ghé một quán trà cổ thưởng thức chén matcha ấm đượm vị truyền thống.\n\n' +
        'Một chuyến đi không chỉ để chụp ảnh, mà để tâm hồn bạn được chạm vào nét đẹp nguyên bản của thời gian.',
    },
    {
      title: 'Khám phá hoàng hôn đảo ngọc Phú Quốc',
      theme: 'Biển xanh cát trắng, chèo thuyền SUP đón hoàng hôn ngũ sắc rực rỡ, gió biển lồng lộng và thưởng thức hải sản tươi ngon bên bờ sóng.',
      script:
        'Hoàng hôn ở Phú Quốc chưa bao giờ làm bất kỳ ai thất vọng.\n\n' +
        'Khi mặt trời đỏ rực dần chìm xuống đường chân trời, bầu trời bỗng chuyển mình thành một bức tranh ngũ sắc từ cam, hồng đến tím biếc.\n\n' +
        'Chèo chiếc thuyền SUP lênh đênh giữa làn nước biển phẳng lặng như gương, lắng nghe tiếng sóng vỗ rì rào êm dịu.\n\n' +
        'Tối đến, đừng quên ghé chợ đêm thưởng thức đĩa nhum nướng mỡ hành thơm nức mũi để trọn vẹn một ngày tuyệt vời!',
    },
    {
      title: 'Chinh phục nóc nhà Đông Dương Fansipan biển mây',
      theme: 'Góc flycam quét qua đỉnh Fansipan 3.143m ngập trong biển mây trắng bồng bềnh như chốn bồng lai, ánh bình minh vàng rực rỡ cột mốc đá hoa cương.',
      script:
        'Đứng trên đỉnh Fansipan ở độ cao 3.143 mét — nơi được mệnh danh là nóc nhà của toàn cõi Đông Dương hùng vĩ.\n\n' +
        'Cả một biển mây trắng xóa bồng bềnh cuồn cuộn trôi dưới chân như một đại dương bông gòn khổng lồ trải dài tới tận chân trời.\n\n' +
        'Ánh nắng bình minh vàng rực chiếu rọi lên cột mốc đá hoa cương uy nghiêm, xua tan đi cái lạnh tê buốt của đỉnh núi cao biên ải.\n\n' +
        'Cảm giác tự hào và choáng ngợp trào dâng trong lồng ngực khi được chạm tay vào đỉnh cao thiêng liêng của Tổ quốc!',
    },
    {
      title: 'Khám phá ẩm thực đường phố Bangkok về đêm',
      theme: 'Phố đêm Yaowarat rực rỡ biển hiệu chữ Hoa neon, chảo Pad Thai xào rực lửa bốc khói và đĩa xôi xoài nước cốt dừa béo ngậy ngọt ngào.',
      script:
        'Khi màn đêm buông xuống, khu phố người Hoa Yaowarat tại thủ đô Bangkok bỗng bừng tỉnh thành một thiên đường ẩm thực đường phố náo nhiệt nhất châu Á.\n\n' +
        'Những chảo Pad Thai khổng lồ đỏ lửa xào tôm tươi giòn sần sật, mùi thơm ngào ngạt của thịt xiên nướng Moo Ping ướp nước cốt dừa nướng than hoa.\n\n' +
        'Tráng miệng bằng một đĩa xôi xoài ngọt lịm chan ngập nước cốt dừa béo ngậy và rắc hạt đậu xanh giòn tan đánh thức mọi tế bào vị giác.\n\n' +
        'Một hành trình ẩm thực đầy màu sắc và hương vị khó quên của xứ sở chùa Vàng thân thiện!',
    },
    {
      title: 'Cung đèo ven biển Vĩnh Hy đẹp nhất Việt Nam',
      theme: 'Cung đường nhựa uốn lượn ôm sát vách núi đá một bên là biển xanh ngọc bích Ninh Thuận, xe máy phân khối lớn lướt gió tự do.',
      script:
        'Cung đường đèo ven biển Vĩnh Hy — Bình Tiên xứng đáng là một trong những cung đường phượt ngoạn mục nhất dải đất hình chữ S.\n\n' +
        'Một bên là vách núi đá hoa cương sừng sững của vườn quốc gia Núi Chúa, một bên là mặt biển xanh màu ngọc bích phẳng lặng như gương.\n\n' +
        'Cầm chắc tay lái lướt qua từng khúc cua uốn lượn ôm sát bờ vực, hít căng lồng ngực làn gió biển mằn mòi sảng khoái và tự do.\n\n' +
        'Tuổi trẻ là những chuyến đi không ngừng nghỉ để thấy quê hương Việt Nam mình đẹp đẽ và hùng vĩ biết bao nhiêu!',
    },
    {
      title: 'Bay khinh khí cầu ngắm thung lũng Cappadocia',
      theme: 'Hàng trăm quả khinh khí cầu khổng lồ rực rỡ sắc màu bay lượn trên thung lũng nấm đá kỳ quan Cappadocia Thổ Nhĩ Kỳ lúc bình minh.',
      script:
        '5 giờ sáng tinh mơ tại vùng đất cổ tích Cappadocia, Thổ Nhĩ Kỳ — khoảnh khắc cả trăm quả khinh khí cầu đồng loạt được thổi lửa căng phồng.\n\n' +
        'Chầm chậm bay lơ lửng lên bầu trời cao giữa bình minh rạng rỡ, ngắm nhìn toàn cảnh thung lũng nấm đá độc nhất vô nhị trải dài ngút ngàn bên dưới.\n\n' +
        'Bầu trời bỗng chốc biến thành một bức tranh sơn dầu khổng lồ rực rỡ sắc màu với những đốm khinh khí cầu bay lượn trong gió sớm.\n\n' +
        'Một trải nghiệm kỳ diệu nhất trong danh sách những điều phải làm một lần trong đời của mọi tín đồ xê dịch toàn cầu!',
    },
    {
      title: 'Trekking Tà Xùa săn biển mây bồng bềnh cõi tiên',
      theme: 'Sống lưng khủng long Tà Xùa cheo leo giữa biển mây trắng ngập tràn thung lũng, đón ánh bình minh ấm áp bên tách cà phê dã ngoại.',
      script:
        'Vượt qua những cung đường đèo đất đá hiểm trở vùng cao Tây Bắc để đặt chân lên Sống Lưng Khủng Long Tà Xùa huyền thoại.\n\n' +
        'Đứng trên mỏm đất cheo leo nhìn ra hai bên bờ vực, cả một đại dương mây trắng đặc quánh cuộn trào sóng mây như chốn bồng lai tiên cảnh.\n\n' +
        'Ngồi nép mình bên chiếc ghế xếp dã ngoại, thưởng thức một ly cà phê phin nóng hổi ngắm mặt trời từ từ nhô lên từ biển mây bồng bềnh.\n\n' +
        'Mọi mệt mỏi của chặng đường dài bỗng chốc tan biến, chỉ còn lại sự tĩnh lặng và an yên tuyệt đối của tâm hồn.',
    },
    {
      title: 'Thị trấn cổ Hội An lung linh đèn lồng rực rỡ',
      theme: 'Dòng sông Hoài đêm rằm hoa đăng lấp lánh, những ngôi nhà cổ tường vàng hoa giấy rủ bóng và hàng ngàn chiếc đèn lồng lụa đỏ vàng.',
      script:
        'Khi hoàng hôn buông xuống, thị trấn cổ Hội An bỗng khoác lên mình một tấm áo lung linh huyền ảo của hàng ngàn chiếc đèn lồng lụa rực rỡ sắc màu.\n\n' +
        'Dạo bước trên những con phố nhỏ lát gạch cổ kính rợp bóng hoa giấy hồng thắm nghiêng mình bên những bức tường vàng rêu phong trăm tuổi.\n\n' +
        'Bước lên con thuyền gỗ nhỏ thả trôi theo dòng sông Hoài, tự tay thả trôi một ngọn hoa đăng lấp lánh mang theo những ước nguyện bình an cho người thân yêu.\n\n' +
        'Một vẻ đẹp hoài niệm, dịu dàng và đằm thắm làm say đắm bước chân của bất kỳ lữ khách nào ghé thăm.',
    },
    {
      title: 'Cung đường Tây Bắc mùa lúa chín vàng óng',
      theme: 'Ruộng bậc thang Mù Cang Chải uốn lượn như những nấc thang lên thiên đường, sóng lúa vàng rực rỡ thơm nức mùi hạt thóc mới.',
      script:
        'Tháng Chín về, toàn bộ thung lũng Mù Cang Chải lại bừng sáng rực rỡ trong sắc vàng óng ả của mùa lúa chín rộ.\n\n' +
        'Những thửa ruộng bậc thang kỳ vĩ uốn lượn mềm mại từ đỉnh núi cao xuống tận đáy thung lũng như những nấc thang khổng lồ bắc lên trời xanh.\n\n' +
        'Hương thơm ngào ngạt của lúa nếp nương mới gặt hòa cùng tiếng cười nói rộn rã của đồng bào người Mông trong ngày mùa thu hoạch ấm no.\n\n' +
        'Một kiệt tác nông nghiệp và nghệ thuật tạo hình cảnh quan vĩ đại được kiến tạo từ bàn tay cần lao của con người Việt Nam.',
    },
    {
      title: '48 giờ càn quét sạch thiên đường ẩm thực Quy Nhơn',
      theme: 'Hành trình nếm thử bánh xèo tôm nhảy, bún chả cá và ốc biển tươi sống',
      script:
        'Bắt đầu ngày mới với bát bún chả cá nước dùng ngọt thanh đậm đà từ xương cá thu tươi rói.\n\n' +
        'Chiều ra bãi biển Eo Gió ngắm hoàng hôn đỏ rực và lấp đầy dạ dày bằng đĩa bánh xèo giòn rụm ngập tôm.\n\n' +
        'Thành phố biển xinh đẹp với chi phí cực kỳ hợp lý và con người mộc mạc hiếu khách vô cùng.',
    },
    {
      title: 'Trải nghiệm đi tàu hỏa leo núi Mường Hoa Sa Pa',
      theme: 'Toa tàu cổ điển màu đỏ rực rỡ lướt qua thung lũng ruộng bậc thang kỳ vĩ',
      script:
        'Cảm giác như đang lạc vào xứ sở cổ tích Thụy Sĩ khi đoàn tàu chầm chậm băng qua thung lũng xanh mướt.\n\n' +
        'Bên ngoài ô cửa kính là mây trắng bồng bềnh cuộn qua những nếp nhà sàn của đồng bào bản làng.\n\n' +
        'Một hành trình ngắn nhưng đem lại những góc nhìn mãn nhãn không thể nào quên.',
    },
    {
      title: 'Chèo SUP đón bình minh trên sông Thu Bồn Hội An',
      theme: 'Mặt nước phẳng lặng như gương phản chiếu ánh nắng vàng ban mai rực rỡ',
      script:
        '5 giờ sáng, khi phố cổ còn chìm trong giấc ngủ, mái chèo khua nhẹ đưa ta lướt qua những rặng dừa nước.\n\n' +
        'Tiếng chim hót ríu rít chào ngày mới và làn gió sớm mát rượi xua tan mọi mỏi mệt của thị thành.\n\n' +
        'Một Hội An rất khác, thanh bình và nguyên sơ đến nao lòng.',
    },
    {
      title: 'Lạc bước vào xứ sở thần tiên Đảo Phú Quý hoang sơ',
      theme: 'Nước biển xanh ngọc bích trong vắt nhìn tận đáy san hô và dốc Phượt lộng gió',
      script:
        'Vượt qua 2 tiếng lênh đênh trên tàu cao tốc để đặt chân lên hòn đảo thiên đường hoang sơ bậc nhất miền Trung.\n\n' +
        'Chạy xe máy qua những con đường ven biển không bóng người, đứng trên ngọn hải đăng ngắm trọn đại dương bao la.\n\n' +
        'Nơi thời gian như ngừng lại để bạn tìm về với chính bản thân mình.',
    },
    {
      title: 'Săn mùa lúa chín vàng óng Hoàng Su Phì',
      theme: 'Tầng tầng lớp lớp ruộng bậc thang uốn lượn như dải lụa vàng óng ả',
      script:
        'Mùi hương lúa nếp mới ngạt ngào lan tỏa theo gió đồi, khói lam chiều bảng lảng trên mái nhà người Dao.\n\n' +
        'Đứng trên đỉnh đèo nhìn ngắm kỳ quan lao động được tạc nên từ mồ hôi bao thế hệ đồng bào vùng cao.\n\n' +
        'Vẻ đẹp tráng lệ và ấm no của mùa vàng nơi biên ải địa đầu Tổ quốc.',
    },
    {
      title: 'Cắm trại qua đêm trên thảo nguyên Đồng Lâm Lạng Sơn',
      theme: 'Thảo nguyên cỏ xanh mướt ngập nước với đàn ngựa hoang gặm cỏ thanh bình',
      script:
        'Dựng lều bên dòng suối trong vắt, đốt lửa trại nướng thịt và cùng bạn bè ngắm bầu trời đầy sao đêm.\n\n' +
        'Sáng thức dậy trong làn sương mù mờ ảo, hít căng lồng ngực bầu không khí trong lành của núi rừng Đông Bắc.\n\n' +
        'Trải nghiệm trốn phố về rừng tuyệt vời chỉ cách Hà Nội chưa đầy 3 giờ lái xe.',
    },
    {
      title: 'Khám phá hang Én - Ngôi nhà của hàng triệu chú chim én',
      theme: 'Trekking xuyên rừng nhiệt đới Vườn quốc gia Phong Nha Kẻ Bàng',
      script:
        'Lội qua hàng chục con suối mát lạnh để tiến vào lòng hang động khổng lồ có bãi cát trắng mịn như bờ biển.\n\n' +
        'Hoàng hôn buông xuống, hàng vạn cánh én chao lượn rợp kín vòm hang tạo nên cảnh tượng ngoạn mục khó tin.\n\n' +
        'Kỳ quan địa chất độc nhất vô nhị thử thách lòng dũng cảm của những đôi chân đam mê xê dịch.',
    },
    {
      title: 'Một ngày làm nông dân thu hoạch chè Mộc Châu',
      theme: 'Đồi chè trái tim xanh mướt ngút ngàn dưới ánh nắng sớm tinh khôi',
      script:
        'Đeo chiếc gùi mây xinh xắn, học cách ngắt búp chè một tôm hai lá đúng kỹ thuật của các cô gái Thái.\n\n' +
        'Thưởng thức chén trà nóng thơm mùi cốm non vừa mới sao suốt thơm nức bên bếp than hồng.\n\n' +
        'Cảm nhận trọn vẹn sự bình yên và vị ngọt thanh tao của vùng cao nguyên lộng gió.',
    },
    {
      title: 'Đi thuyền khám phá chợ nổi Cái Răng Cần Thơ',
      theme: 'Tiếng máy đuôi tôm rộn rã và những cây bẹo treo lủng lẳng hoa trái ngọt lành',
      script:
        '\'Treo gì bán nấy\' - nét buôn bán độc đáo trên sông nước đã tồn tại suốt hơn một thế kỷ qua.\n\n' +
        'Tô hủ tiếu nóng hổi được chuyền tay lắc lư trên ghe thuyền, xì xụp ăn giữa làn gió sông mát rượi.\n\n' +
        'Hương vị miền Tây hào sảng, phóng khoáng thấm đượm trong từng nụ cười của bà con sông nước.',
    },
    {
      title: 'Trekking cung đường Tà Năng Phan Dũng mùa cỏ xanh',
      theme: 'Chinh phục những ngọn đồi cỏ xanh ngắt nhấp nhô nối tiếp nhau đến tận chân trời',
      script:
        'Bước chân qua từng con dốc dựng đứng, vượt qua giới hạn thể lực để chạm tay vào mốc ba tỉnh thiêng liêng.\n\n' +
        'Gió lộng phần phật trên đỉnh đồi, trước mắt là biển mây và rừng thông bạt ngàn trải dài vô tận.\n\n' +
        'Cung đường trekking đẹp nhất Việt Nam tôi luyện ý chí và niềm đam mê khám phá của tuổi trẻ.',
    },
  ],

  // 29. Template: podcast_clips (20 mục)
  podcast_clips: [
    {
      title: 'Kỷ luật thép hay Động lực nhất thời?',
      theme: 'Micro cận cảnh studio, chia sẻ tư duy dứt khoát: Động lực là thứ đốt cháy nhanh nhưng mau tàn, chỉ có tính kỷ luật mới đưa bạn về đích.',
      script:
        'Rất nhiều người chờ đợi nguồn cảm hứng hay động lực thì mới bắt đầu làm việc. Đó là sai lầm lớn nhất của bạn.\n\n' +
        'Động lực chỉ giống như mồi lửa bén nhanh, nhưng chính kỷ luật hàng ngày mới là khúc gỗ giữ cho ngọn lửa cháy suốt mùa đông.\n\n' +
        'Dù trời mưa hay nắng, dù tâm trạng vui hay buồn, bạn vẫn hoàn thành việc cần làm — đó chính là sự trưởng thành thực sự.\n\n' +
        'Đừng phụ thuộc vào cảm xúc, hãy xây dựng một hệ thống thói quen không thể phá vỡ!',
    },
    {
      title: 'Tại sao người bản lĩnh thường ít nói?',
      theme: 'Không gian ấm cúng studio, bàn về sức mạnh của sự điềm tĩnh: Người thông minh dành 80% thời gian để lắng nghe và quan sát thay vì tranh luận.',
      script:
        'Bạn có nhận ra rằng những người càng có thực lực cao, họ lại càng kiệm lời và khiêm nhường không?\n\n' +
        'Họ không phí năng lượng để chứng minh mình đúng trong những cuộc tranh luận vô thưởng vô phạt trên mạng xã hội.\n\n' +
        'Sự im lặng của họ không phải là nhút nhát, mà là sự thấu hiểu sâu sắc: lời nói có trọng lượng nhất khi nó được phát ra đúng lúc và đúng người.\n\n' +
        'Học cách lắng nghe trước khi phản xạ, bạn sẽ nhìn thấu rất nhiều điều thú vị!',
    },
    {
      title: 'Bài học đắt giá ở tuổi 25',
      theme: 'Phân tích áp lực đồng trang lứa peer pressure, cách ngừng so sánh bản thân với người khác và xây dựng giá trị nội tại bền vững.',
      script:
        'Ở tuổi 25, bẫy tâm lý nguy hiểm nhất chính là mở mạng xã hội lên và thấy ai cũng thành công, giàu có hơn mình.\n\n' +
        'Nhưng bạn đang so sánh hậu trường đầy khó khăn của mình với thước phim lộng lẫy nhất của người khác.\n\n' +
        'Mỗi người đều có một múi giờ phát triển riêng. Có người rực rỡ ở tuổi 20, nhưng cũng có người vững vàng ở tuổi 35, 40.\n\n' +
        'Chỉ cần hôm nay bạn tiến bộ hơn chính mình ngày hôm qua 1%, bạn đã là người chiến thắng rồi!',
    },
    {
      title: 'Cách xây dựng sự tự tin từ sâu bên trong',
      theme: 'Micro studio cận cảnh, chia sẻ về sự tự tin đích thực: không phải là nghĩ mình giỏi hơn người khác, mà là không cần so sánh bản thân với ai.',
      script:
        'Rất nhiều người nhầm lẫn giữa sự tự tin và sự kiêu ngạo tự phụ bề ngoài.\n\n' +
        'Sự tự tin đích thực không đến từ việc bạn cố tỏ ra mình giỏi giang hơn người khác để nhận lại những lời khen ngợi nhất thời.\n\n' +
        'Nó đến từ sự bình thản bên trong: bạn thấu hiểu rõ ràng điểm mạnh, chấp nhận những khiếm khuyết của bản thân và không còn cảm thấy cần phải so sánh mình với bất kỳ ai.\n\n' +
        'Khi bạn ngừng tìm kiếm sự công nhận từ bên ngoài, bạn sẽ sở hữu một nguồn sức mạnh nội tại bất khả chiến bại!',
    },
    {
      title: 'Nghệ thuật từ chối không làm mất lòng người khác',
      theme: 'Bàn về ranh giới cá nhân Boundary: tại sao nói \'Không\' với điều người khác muốn là nói \'Có\' với mục tiêu và cuộc đời của chính bạn.',
      script:
        'Cả nể và không biết nói lời từ chối chính là con đường ngắn nhất dẫn bạn đến sự kiệt quệ và đánh mất chính mình.\n\n' +
        'Mỗi khi bạn miễn cưỡng gật đầu đồng ý giúp đỡ việc của người khác chỉ vì sợ họ buồn lòng, bạn đang trực tiếp từ chối thời gian dành cho mục tiêu của bản thân.\n\n' +
        'Học cách từ chối lịch thiệp nhưng dứt khoát: \'Cảm ơn bạn đã tin tưởng, nhưng hiện tại mình cần ưu tiên hoàn thành công việc này trước.\'\n\n' +
        'Người tôn trọng bạn sẽ hiểu cho ranh giới của bạn; còn người giận dỗi vì bạn từ chối thì vốn dĩ chỉ muốn lợi dụng bạn mà thôi.',
    },
    {
      title: 'Tại sao nên ngừng cố gắng làm hài lòng tất cả?',
      theme: 'Phân tích tâm lý People Pleaser: bạn không thể làm hài lòng 100% mọi người, hãy tập trung vào những người thực sự quan trọng.',
      script:
        'Dù bạn có hoàn hảo và tốt bụng đến đâu, trong câu chuyện của một ai đó, bạn vẫn sẽ là một kẻ phản diện.\n\n' +
        'Cố gắng làm hài lòng tất cả mọi người là một nhiệm vụ bất khả thi và là sự lãng phí năng lượng khủng khiếp nhất của đời người.\n\n' +
        'Hãy dũng cảm sống đúng với những giá trị và nguyên tắc đạo đức của chính mình, dẫu cho điều đó có thể làm một vài người không vừa mắt.\n\n' +
        'Chỉ cần những người thực sự yêu thương và hiểu bạn vẫn ở bên cạnh, những lời phán xét ngoài kia hoàn toàn vô nghĩa!',
    },
    {
      title: 'Sự khác biệt giữa bận rộn và hiệu suất thực sự',
      theme: 'Chỉ ra nghịch lý làm việc 12 tiếng nhưng không có kết quả: bận rộn là cảm xúc, hiệu suất là kết quả đầu ra đo lường được.',
      script:
        'Đừng bao giờ nhầm lẫn giữa việc \'bận rộn\' và việc \'làm việc hiệu quả\'. Đó là hai khái niệm hoàn toàn trái ngược nhau.\n\n' +
        'Một người bận rộn suốt ngày check email, trả lời tin nhắn vụn vặt và tham gia những cuộc họp vô thưởng vô phạt, cuối ngày kiệt sức nhưng không tạo ra kết quả cụ thể.\n\n' +
        'Người có hiệu suất cao chỉ dành trọn 3 đến 4 tiếng tập trung sâu Deep Work để giải quyết triệt để 20% công việc then chốt mang lại 80% giá trị cho tổ chức.\n\n' +
        'Hãy làm việc thông minh hơn, chứ đừng chỉ biết cắm đầu cày cuốc chăm chỉ hơn trong sự mù quáng!',
    },
    {
      title: 'Cách vượt qua cảm giác trống rỗng và mất phương hướng',
      theme: 'Lời khuyên tâm lý sâu sắc: khi không biết đi đâu, hãy quay về chăm sóc cơ thể, dọn dẹp phòng và làm tốt việc nhỏ trước mắt.',
      script:
        'Có những giai đoạn trong cuộc đời bạn bỗng cảm thấy mọi thứ xung quanh trở nên vô nghĩa, mất phương hướng và trống rỗng đến cùng cực.\n\n' +
        'Những lúc như vậy, đừng cố gắng vạch ra những kế hoạch vĩ mô to tát làm gì cả.\n\n' +
        'Hãy quay về với những điều căn bản nhất: ăn một bữa cơm đàng hoàng đủ chất, đi ngủ sớm đúng giờ, dọn dẹp lại góc bàn làm việc và bước ra ngoài đi dạo 30 phút.\n\n' +
        'Khi bạn chăm sóc tốt cho cơ thể vật lý của mình và hoàn thành những việc nhỏ trước mắt, tâm trí của bạn sẽ dần tìm lại được sự sáng suốt và bình an.',
    },
    {
      title: 'Tiền bạc mua được hạnh phúc nếu tiêu đúng cách',
      theme: 'Khoa học về tâm lý tiền tệ: tiêu tiền vào trải nghiệm và mua lại thời gian mang lại hạnh phúc bền vững hơn mua sắm vật chất.',
      script:
        'Người ta thường bảo tiền bạc không mua được hạnh phúc, nhưng khoa học tâm lý học đã chứng minh điều hoàn toàn ngược lại nếu bạn biết tiêu đúng cách.\n\n' +
        'Tiêu tiền vào việc tích lũy đồ đạc vật chất xa xỉ chỉ mang lại niềm vui ngắn hạn kéo dài vài ngày trước khi bạn quen dần với nó.\n\n' +
        'Nhưng nếu dùng tiền để mua lại thời gian rảnh rỗi, đầu tư cho các trải nghiệm du lịch cùng người thân hoặc giúp đỡ những mảnh đời khó khăn hơn mình.\n\n' +
        'Khoản tiền đó sẽ chuyển hóa thành những ký ức vô giá và nguồn cảm xúc hạnh phúc sâu sắc đồng hành cùng bạn suốt cả cuộc đời.',
    },
    {
      title: 'Tha thứ cho người khác là giải thoát cho chính mình',
      theme: 'Bàn về sự buông bỏ oán hận: ôm hận thù giống như tự mình uống thuốc độc nhưng lại mong người khác chết.',
      script:
        'Ôm giữ nỗi hận thù và sự tức giận với người đã từng làm tổn thương bạn chẳng khác nào tự tay mình uống thuốc độc nhưng lại mong kẻ thù ngã xuống.\n\n' +
        'Tha thứ cho người khác không có nghĩa là bạn đồng tình hay bỏ qua cho hành động sai trái của họ trong quá khứ.\n\n' +
        'Tha thứ đơn giản là bạn quyết định cắt đứt sợi dây ràng buộc tiêu cực đang trói buộc cảm xúc của bạn với kẻ đó, để trả lại sự tự do và thanh thản cho tâm hồn mình.\n\n' +
        'Bạn xứng đáng được hạnh phúc và an yên trong hiện tại, thay vì tiếp tục làm tù nhân của những tổn thương đã qua!',
    },
    {
      title: 'Đừng đợi có đủ cảm hứng mới bắt đầu hành động',
      theme: 'Kỷ luật bản thân chính là chìa khóa duy nhất tạo ra sự đột phá',
      script:
        'Cảm hứng là một người bạn đồng hành thất thường, hôm nay đến rồi ngày mai lại biến mất.\n\n' +
        'Nếu bạn chỉ làm việc khi có tâm trạng tốt, bạn sẽ không bao giờ hoàn thành được bất cứ điều gì lớn lao.\n\n' +
        'Hãy tạo lập thói quen ngồi vào bàn làm việc mỗi ngày đúng giờ, cảm hứng sẽ tự tìm đến sau hành động.',
    },
    {
      title: 'Bài học đắt giá về chọn bạn mà chơi ở tuổi 30',
      theme: 'Chất lượng của các mối quan hệ quyết định chất lượng cuộc sống',
      script:
        'Khi còn trẻ ta muốn kết bạn với cả thế giới, nhưng tuổi 30 dạy ta cách thu hẹp vòng tròn bạn bè.\n\n' +
        'Bạn là trung bình cộng của 5 người mà bạn dành nhiều thời gian ở bên cạnh nhất.\n\n' +
        'Hãy ở bên những người dám nói thật những khuyết điểm của bạn nhưng luôn tin tưởng vào tương lai của bạn.',
    },
    {
      title: 'Nỗi sợ bị từ chối và cách biến nó thành sức mạnh',
      theme: 'Thất bại không định nghĩa con người bạn, cách bạn đứng lên mới quyết định',
      script:
        'Mỗi lời từ chối của khách hàng hay nhà tuyển dụng không phải là dấu chấm hết, mà là một cơ hội để bạn hoàn thiện.\n\n' +
        'Người thành công nhất chính là người từng bị từ chối nhiều lần nhất trong đời.\n\n' +
        'Hãy xem mỗi chữ \'KHÔNG\' là một bậc thang đưa bạn tiến gần hơn tới chữ \'CÓ\' xứng đáng.',
    },
    {
      title: 'Học cách buông bỏ những điều không thể kiểm soát',
      theme: 'Triết lý Khắc kỷ Stoicism giúp tìm lại sự bình an nội tâm',
      script:
        'Bạn không thể kiểm soát thời tiết, suy nghĩ của người khác hay những biến động của thị trường.\n\n' +
        'Nhưng bạn luôn có toàn quyền kiểm soát thái độ, phản ứng và nỗ lực của chính bản thân mình.\n\n' +
        'Bình an thực sự bắt đầu khi bạn ngừng cố gắng thay đổi những điều nằm ngoài tầm với.',
    },
    {
      title: 'Bẫy so sánh trên mạng xã hội đang hủy hoại bạn',
      theme: 'Đừng so sánh hậu trường của mình với thước phim đẹp nhất của người khác',
      script:
        'Mạng xã hội chỉ phô diễn những bữa tiệc sang trọng, xe sang và những chuyến du lịch xa xỉ.\n\n' +
        'Không ai đăng tải những đêm khóc thầm, những áp lực nợ nần hay cảm giác bế tắc tuyệt vọng.\n\n' +
        'Hãy chỉ tập trung vào việc trở thành phiên bản tốt hơn của chính mình ngày hôm qua.',
    },
    {
      title: 'Nghệ thuật nói \'KHÔNG\' mà không cảm thấy tội lỗi',
      theme: 'Thiết lập ranh giới cá nhân lành mạnh trong công việc và cuộc sống',
      script:
        'Mỗi lần bạn nói \'Có\' với việc làm hài lòng người khác là một lần bạn nói \'Không\' với ưu tiên của chính mình.\n\n' +
        'Lòng tốt không có ranh giới sẽ biến thành sự nhu nhược để người khác lợi dụng.\n\n' +
        'Từ chối lịch sự nhưng kiên quyết chính là cách bạn tôn trọng thời gian và giá trị của bản thân.',
    },
    {
      title: 'Sự cô đơn là cái giá của sự trưởng thành',
      theme: 'Học cách tận hưởng những khoảng lặng một mình để phát triển chiều sâu',
      script:
        'Trên con đường nâng cấp bản thân, bạn sẽ nhận ra nhiều người bạn cũ dần dần không còn chung tần số.\n\n' +
        'Đó không phải là sự xa cách vì kiêu ngạo, mà là quy luật tự nhiên khi mục tiêu sống thay đổi.\n\n' +
        'Hãy biết ơn những người đã từng đồng hành và dũng cảm bước tiếp con đường của riêng mình.',
    },
    {
      title: 'Tiền bạc không mua được hạnh phúc nhưng mua được tự do',
      theme: 'Mục tiêu tài chính chân chính là quyền tự chủ thời gian cuộc đời',
      script:
        'Sự giàu có thực sự không đo bằng chiếc đồng hồ bạn đeo hay nhãn hiệu chiếc xe bạn lái.\n\n' +
        'Nó được đo bằng số ngày bạn có thể thức dậy và tự do quyết định hôm nay mình sẽ làm gì và gặp ai.\n\n' +
        'Kiếm tiền để mua lại quyền tự do làm chủ cuộc đời mình mới là mục tiêu tối thượng.',
    },
    {
      title: 'Chữa lành đứa trẻ bên trong bạn',
      theme: 'Nhìn nhận và tha thứ cho những tổn thương tâm lý thời thơ ấu',
      script:
        'Nhiều phản ứng tức giận vô cớ hay sự tự ti thái quá ở tuổi trưởng thành đều bắt nguồn từ những tổn thương xưa cũ.\n\n' +
        'Hãy ôm lấy đứa trẻ nhút nhát năm xưa, nói với nó rằng bạn đã lớn và đủ mạnh mẽ để bảo vệ nó an toàn.\n\n' +
        'Tha thứ cho quá khứ là món quà tuyệt vời nhất bạn tự tặng cho tương lai của mình.',
    },
    {
      title: 'Làm thế nào để duy trì ngọn lửa đam mê trong công việc?',
      theme: 'Chuyển hóa sự kiệt sức Burnout thành động lực phát triển bền vững',
      script:
        'Đam mê không tự nhiên rơi xuống, nó được hun đúc từ cảm giác bạn làm tốt một kỹ năng và tạo ra giá trị.\n\n' +
        'Khi cảm thấy mệt mỏi và muốn bỏ cuộc, hãy nhớ lại lý do vì sao bạn đã dấn thân bắt đầu.\n\n' +
        'Nghỉ ngơi để hồi phục chứ đừng bao giờ từ bỏ ước mơ mà bạn đã dành cả tuổi trẻ để theo đuổi.',
    },
  ],

  // 30. Template: food_delight (20 mục)
  food_delight: [
    {
      title: 'Bí quyết phở bò truyền thống nước dùng trong',
      theme: 'Nồi nước dùng ninh xương ống 12 tiếng bốc khói ngào ngạt hương hoa hồi thảo quả, bánh phở mềm mướt và thăn bò tái mềm tan.',
      script:
        'Linh hồn của một bát phở bò chuẩn vị truyền thống nằm ở chính nồi nước dùng trong vắt ngọt thanh này.\n\n' +
        'Xương bò được rửa sạch và hầm nhỏ lửa suốt 12 tiếng đồng hồ cùng hoa hồi, thảo quả nướng xém cạnh thơm lừng.\n\n' +
        'Từng sợi bánh phở trắng mịn, phủ lên lớp thịt bò tái lăn mềm mọng, rắc thêm chút hành hoa xanh mướt và chan ngập nước dùng sôi sùng sục.\n\n' +
        'Húp một thìa nước dùng nóng hổi, vị ngọt đậm đà lan tỏa làm ấm lòng bất kỳ ai trong buổi sáng se lạnh!',
    },
    {
      title: 'Steak bò Wagyu bơ tỏi chuẩn nhà hàng',
      theme: 'Miếng thịt thăn bò vân mỡ cẩm thạch xèo xèo trên chảo gang rực lửa, rưới bơ tỏi thơm nức hương thảo, cắt ra mọng nước hồng hào.',
      script:
        'Nghe tiếng xèo xèo vui tai này thôi đã đủ khiến bất kỳ tín đồ ẩm thực nào phải xiêu lòng.\n\n' +
        'Miếng thăn bò Wagyu với những đường vân mỡ cẩm thạch hoàn hảo được áp chảo ở nhiệt độ cao để khóa trọn dòng nước ngọt bên trong.\n\n' +
        'Rưới liên tục lớp bơ chảy óng ánh cùng tỏi đập dập và nhánh hương thảo tươi thơm nức mũi.\n\n' +
        'Để thịt nghỉ 5 phút trước khi thái lát mỏng: lớp vỏ ngoài xém giòn, bên trong mềm mọng tan ngay đầu lưỡi!',
    },
    {
      title: 'Bánh mì giòn rụm pate béo ngậy',
      theme: 'Âm thanh cắn giòn rụm ASMR: ổ bánh mì nóng giòn, lớp pate gan béo ngậy nhà làm, chả lụa dưa leo và sốt trứng béo thơm đặc trưng.',
      script:
        'Bữa sáng quốc dân của người Việt — chiếc bánh mì giòn rụm vừa ra lò thơm phưng phức.\n\n' +
        'Quét một lớp pate gan béo ngậy đặc sánh, thêm chút bơ trứng vàng ươm thơm lừng và dăm lát giò chả loại ngon.\n\n' +
        'Không thể thiếu dưa chuột giòn mát, ngò rí tươi và vài lát ớt chỉ thiên cay nồng đánh thức mọi giác quan.\n\n' +
        'Cắn một miếng nghe tiếng giòn tan vang bên tai, vị béo ngậy hòa cùng chua cay mặn ngọt tạo nên sự bùng nổ hương vị!',
    },
    {
      title: 'Nồi lẩu Thái tomyum hải sản chua cay bùng nổ',
      theme: 'Nồi lẩu đồng sôi sùng sục nước sốt tomyum đỏ cam sóng sánh, tôm sú tươi rói, mực ống giòn sần sật, nấm và lá chanh Thái thơm nức mũi.',
      script:
        'Những ngày trời mưa se lạnh thế này, không gì tuyệt vời bằng được quây quần bên nồi lẩu Thái tomyum sôi sùng sục khói nghi ngút.\n\n' +
        'Nước dùng sóng sánh màu đỏ cam rực rỡ, dậy mùi thơm nức mũi của sả đập dập, lá chanh Thái kaffir, củ riềng non và ớt xiêm cay nồng.\n\n' +
        'Nhúng những con tôm sú tươi rói còn bật tanh tách, mực ống dày mình giòn sần sật cùng nấm kim châm thanh ngọt vào nồi nước lẩu.\n\n' +
        'Húp một thìa nước dùng đậm đà vị chua cay mặn ngọt bùng nổ nơi đầu lưỡi khiến bạn phải xuýt xoa không ngừng!',
    },
    {
      title: 'Cơm chiên dưa bò giòn tan chuẩn vị Hà Thành',
      theme: 'Hạt cơm vàng ruộm đảo đều trên chảo gang rực lửa, dưa cải muối chua xào thịt bò thăn mềm mọng rắc hành phi thơm lừng.',
      script:
        'Món ăn đường phố trứ danh của mảnh đất kinh kỳ làm say lòng biết bao thế hệ thực khách sành ăn Hà Thành.\n\n' +
        'Hạt cơm nguội được trộn đều với lòng đỏ trứng gà rồi đảo liên tục trên chảo gang đỏ lửa cho đến khi từng hạt cơm săn lại giòn tan rôm rốp.\n\n' +
        'Thịt bò thăn thái mỏng xào lửa lớn cùng dưa cải muối chua giòn rụm vừa độ chua thanh, rưới thêm chút nước sốt bò đậm đà óng ánh.\n\n' +
        'Rắc thêm chút hành phi giòn rụm và tiêu xay cay nồng, ăn kèm đĩa dưa góp chua ngọt là chuẩn vị trọn vẹn không thể chối từ!',
    },
    {
      title: 'Thịt kho tàu trứng cút béo ngậy ngày Tết',
      theme: 'Miếng thịt ba chỉ thái vuông vức màu cánh gián óng ả, nước dừa xiêm ninh nhừ mềm rục, quả trứng cút thấm đượm gia vị béo ngậy.',
      script:
        'Hương vị linh hồn của mâm cơm Tết truyền thống của người dân phương Nam — nồi thịt kho tàu thơm lừng gian bếp nhỏ.\n\n' +
        'Từng miếng thịt ba chỉ rút sườn được thái vuông vức đều đặn, ướp đẫm hành tỏi nước mắm ngon rồi kho liu riu trong nước dừa xiêm ngọt thanh suốt 3 tiếng.\n\n' +
        'Lớp mỡ trong veo mềm tan ngậy béo, phần thịt nạc mềm rục đậm đà màu cánh gián óng ả hòa quyện cùng những quả trứng cút thấm vị bùi bùi.\n\n' +
        'Chan nước thịt kho lên bát cơm trắng nóng hổi ăn kèm đĩa dưa giá giòn mát là thấy cả không khí Tết sum vầy ấm cúng ùa về.',
    },
    {
      title: 'Trứng cuộn phô mai lòng đào béo ngậy kiểu Nhật',
      theme: 'Chảo chữ nhật Tamagoyaki xèo xèo, lớp trứng vàng óng cuộn tròn nhiều lớp, phô mai Mozzarella chảy sợi kéo dài béo ngậy.',
      script:
        'Chiêm ngưỡng đôi bàn tay khéo léo của người đầu bếp Nhật Bản tạo nên món trứng cuộn Tamagoyaki phô mai mềm mịn như nhung.\n\n' +
        'Từng lớp trứng gà đánh đều cùng nước dùng dashi thanh ngọt được đổ chầm chậm lên chảo chữ nhật chống dính, cuộn tròn khéo léo từng nếp gấp.\n\n' +
        'Bên trong nhân là lớp phô mai Mozzarella béo ngậy tan chảy kéo sợi dài miên man khi dùng đũa tách nhẹ lớp vỏ ngoài vàng óng.\n\n' +
        'Cắn một miếng cảm nhận độ mềm mọng xốp mịn tan ngay trên đầu lưỡi, một món ăn vừa đẹp mắt vừa thơm ngon nức lòng!',
    },
    {
      title: 'Mì cay hải sản cấp độ cao xuýt xoa ngày mưa',
      theme: 'Thố đất nung sôi sùng sục nước dùng ớt Hàn Quốc đỏ thẫm, tôm càng, xúc xích, nấm kim châm và sợi mì ramen vàng dai giòn.',
      script:
        'Thử thách vị giác đỉnh cao với thố mì cay hải sản Hàn Quốc sôi sùng sục đỏ rực sắc ớt bột Gochugaru nồng nàn cay xé lưỡi.\n\n' +
        'Sợi mì ramen Hàn Quốc to bản vàng ươm dai giòn sần sật ngập tràn trong làn nước súp hải sản ngọt đậm đà từ tôm mực và chả cá.\n\n' +
        'Vừa ăn vừa xuýt xoa hít hà từng hơi thở cay nồng, mồ hôi toát ra sảng khoái xua tan đi hoàn toàn cái lạnh buốt của buổi chiều mưa gió.\n\n' +
        'Món ăn gây nghiện của giới trẻ với trải nghiệm bùng nổ mọi cung bậc cảm xúc vị giác!',
    },
    {
      title: 'Cánh gà chiên nước mắm da giòn sốt sánh óng ả',
      theme: 'Cánh gà chiên vàng ươm giòn rụm đảo đều trong chảo nước mắm tỏi ớt kẹo lại sánh mịn, rắc hạt mè rang thơm lừng quyến rũ.',
      script:
        'Âm thanh cắn ngập chân răng lớp da gà chiên giòn rụm rôm rốp vang lên đã tai đến mức khiến ai nghe thấy cũng phải nuốt nước miếng.\n\n' +
        'Cánh gà tươi được tẩm lớp bột mỏng chiên hai lần lửa cho lớp vỏ ngoài giòn tan vàng ruộm nhưng thịt bên trong vẫn mềm mọng ứa nước ngọt.\n\n' +
        'Đảo nhanh tay trong chảo nước mắm nhĩ tỏi ớt kẹo lại sánh đặc óng ả, phủ đều một lớp áo mặn ngọt đậm đà thơm lừng mùi tỏi phi.\n\n' +
        'Món nhậu quốc dân hay món ăn đưa cơm số một mà cả người lớn lẫn trẻ nhỏ đều mê mẩn không dứt!',
    },
    {
      title: 'Chè bưởi An Giang cùi giòn sần sật nước cốt dừa',
      theme: 'Bát chè bưởi vàng ươm màu đậu xanh đãi vỏ, cùi bưởi trong veo giòn sần sật không hề đắng, chan ngập nước cốt dừa béo ngậy lá dứa.',
      script:
        'Món tráng miệng thanh mát ngọt lành đậm chất miền Tây sông nước — chè bưởi An Giang nức tiếng gần xa.\n\n' +
        'Cùi bưởi da xanh được sơ chế kỹ lưỡng qua nhiều lần bóp muối xả nước lạnh để khử sạch vị đắng nghét, tẩm bột năng luộc trong veo giòn sần sật.\n\n' +
        'Nấu cùng đậu xanh hạt tiêu bùi bở thơm lừng mùi đường thốt nốt và hương lá dứa thoang thoảng dịu nhẹ.\n\n' +
        'Múc một bát chè chan ngập nước cốt dừa béo ngậy rắc thêm chút dừa nạo và đậu phộng rang giòn — một thìa thanh mát xua tan đi mọi oi bức ngày hè!',
    },
    {
      title: 'Bí quyết nấu phở bò gia truyền nước dùng trong vắt',
      theme: 'Hầm xương ống bò suốt 12 tiếng cùng hồi quế thảo quả nướng thơm lừng',
      script:
        'Vớt sạch bọt liên tục để giữ nước dùng luôn trong veo như hổ phách, ngọt lịm từ tủy xương bò.\n\n' +
        'Từng lát thịt bò tái mềm mượt, bánh phở mướt mát rắc thêm hành lá, rau mùi và chút tiêu đen cay nồng.\n\n' +
        'Hương vị phở Hà Nội tinh hoa đánh thức mọi giác quan trong buổi sáng se lạnh.',
    },
    {
      title: 'Bò sốt vang bánh mì kiểu Pháp giòn rụm',
      theme: 'Thịt dẻ sườn bò hầm mềm rục cùng rượu vang đỏ và sốt cà chua sánh mịn',
      script:
        'Mùi thơm nồng nàn của rượu vang quyện trong từng thớ thịt bò mềm tan ngay đầu lưỡi.\n\n' +
        'Bẻ miếng bánh mì nóng giòn rụm chấm ngập vào phần nước sốt đỏ sánh đậm đà béo ngậy.\n\n' +
        'Món ăn hoàn hảo sưởi ấm tâm hồn trong những ngày mưa gió lạnh giá.',
    },
    {
      title: 'Nghệ thuật làm sushi cá hồi tươi sống chuẩn Nhật',
      theme: 'Lát cá hồi cam óng ánh vân mỡ cẩm thạch đặt trên vắt cơm giấm dẻo thơm',
      script:
        'Lưỡi dao sashimi sắc lẹm cắt ngọt từng lát phi lê cá hồi Na Uy tươi rói chỉ trong một đường cắt dứt khoát.\n\n' +
        'Chấm nhẹ miếng sushi vào nước tương đậu nành pha chút mù tạt wasabi cay nồng xộc lên sống mũi.\n\n' +
        'Sự hòa quyện tuyệt đỉnh của vị béo ngậy, ngọt thanh và cay dịu dàng nơi đầu lưỡi.',
    },
    {
      title: 'Bánh xèo giòn rụm miền Tây tôm nhảy tanh tách',
      theme: 'Vỏ bánh vàng ươm thơm nước cốt dừa đúc trên chảo gang đỏ rực',
      script:
        'Tiếng \'xèo\' vui tai vang lên khi bột gạo pha bột nghệ được tráng mỏng tang quanh lòng chảo.\n\n' +
        'Cuốn bánh cùng lá cải xanh, xà lách, rau rừng chấm nước mắm chua ngọt cay xé lưỡi.\n\n' +
        'Cắn một miếng giòn rụm cảm nhận trọn vẹn hương vị đồng quê mộc mạc mà đậm đà khó quên.',
    },
    {
      title: 'Cơm tấm sườn bì chả nướng than hoa Sài Gòn',
      theme: 'Miếng sườn cốt lết ướp mật ong nướng xém cạnh thơm nức mũi cả góc phố',
      script:
        'Hạt cơm tấm nhuyễn xốp rưới mỡ hành bóng bẩy, ăn kèm miếng chả trứng hấp vàng óng và bì sợi giòn dai.\n\n' +
        'Chan muỗng nước mắm kẹo ớt tỏi cay nồng lên đĩa cơm nghi ngút khói thơm phức.\n\n' +
        'Món ăn quốc hồn quốc túy làm say lòng bất cứ ai từng đặt chân đến mảnh đất Sài Gòn.',
    },
    {
      title: 'Lẩu Thái hải sản Tom Yum chua cay bùng nổ',
      theme: 'Nồi nước lẩu đỏ rực thơm lừng hương sả, lá chanh chúc và ớt hiểm cay nồng',
      script:
        'Nước cốt dừa béo ngậy hòa quyện hoàn hảo cùng vị chua thanh của me rừng và vị ngọt lịm của tôm càng.\n\n' +
        'Nhúng mực tươi giòn sần sật, nấm kim châm và rau muống non vào nồi nước dùng đang sôi sùng sục.\n\n' +
        'Bữa tiệc vị giác ấm áp cho những buổi tụ họp sum vầy cùng bạn bè, người thân.',
    },
    {
      title: 'Bánh mì nướng bơ tỏi phô mai kéo sợi Hàn Quốc',
      theme: 'Vỏ bánh giòn tan ngập sốt bơ tỏi thơm lừng và phô mai cream cheese béo ngậy',
      script:
        'Cắt múi bánh nở bung như bông hoa sáu cánh, bơm đầy nhân phô mai mịn màng vào từng kẽ bánh.\n\n' +
        'Nướng vàng ruộm trong lò ở 180 độ C, lớp bơ tỏi óng ánh tan chảy kích thích vị giác tột cùng.\n\n' +
        'Cơn sốt bánh ngọt làm mê mẩn giới trẻ với vị mặn ngọt béo ngậy đan xen hoàn mỹ.',
    },
    {
      title: 'Bún chả Hà Nội nướng kẹp que tre truyền thống',
      theme: 'Từng miếng chả băm, chả miếng nướng vàng rộm trên bếp than hoa đỏ lửa',
      script:
        'Khói than nướng chả ngào ngạt lan tỏa khắp phố cổ đánh thức cơn thèm ăn cồn cào.\n\n' +
        'Bát nước chấm ấm nóng thả vài lát đu đủ cà rốt giòn sần sật, thả chả nướng vào cùng bún rối trắng tinh.\n\n' +
        'Món ăn từng làm say đắm cựu Tổng thống Obama và đầu bếp lừng danh Anthony Bourdain.',
    },
    {
      title: 'Chè hạt sen long nhãn thanh mát ngày hè',
      theme: 'Hạt sen bùi béo lồng bên trong cùi nhãn lồng Hưng Yên giòn ngọt mọng nước',
      script:
        'Nước đường phèn nấu cùng lá dứa thơm mát dịu nhẹ, ướp lạnh thả thêm vài cánh hoa nhài trắng muốt.\n\n' +
        'Múc từng thìa chè ngọt thanh mát lịm giúp thanh nhiệt cơ thể và xua tan cái nóng oi ả mùa hè.\n\n' +
        'Món tráng miệng cung đình Huế thanh nhã và tốt cho giấc ngủ của cả gia đình.',
    },
    {
      title: 'Bít tết bò Ribeye nướng bơ thảo mộc',
      theme: 'Miếng thịt bò dày dặn áp chảo xém cạnh đạt độ chín vừa Medium Rare mọng nước',
      script:
        'Rưới bơ nóng đun chảy cùng lá hương thảo rosemary và tỏi đập dập liên tục lên bề mặt miếng thịt.\n\n' +
        'Để thịt nghỉ 5 phút trước khi cắt lát, giữ trọn vẹn từng giọt nước ngọt ngào đậm đà bên trong thớ thịt đỏ hồng.\n\n' +
        'Đẳng cấp ẩm thực phương Tây đỉnh cao ngay tại gian bếp ấm cúng của ngôi nhà bạn.',
    },
  ],

  // 31. Template: fitness_workout (20 mục)
  fitness_workout: [
    {
      title: '3 động tác siết mỡ bụng dưới hiệu quả',
      theme: 'Động tác chuẩn xác tại phòng gym: Leg Raise siết cơ bụng dưới, Russian Twist và Plank biến thể. Góc máy năng động tràn đầy động lực.',
      script:
        'Bụng dưới là vùng mỡ cứng đầu nhất? Thử ngay 3 bài tập này trong 4 tuần tới để thấy sự thay đổi rõ rệt.\n\n' +
        'Động tác 1: Nằm nâng chân gập bụng dưới — lưu ý ép chặt thắt lưng xuống thảm và hạ chân thật chậm để cơ bụng luôn trong trạng thái căng tức.\n\n' +
        'Động tác 2: Xoay người kiểu Nga gập cơ liên sườn — siết chặt vùng eo trong từng nhịp thở.\n\n' +
        'Động tác 3: Plank leo núi tốc độ cao — vừa kích hoạt cơ cốt lõi vừa đốt cháy calo mạnh mẽ.\n\n' +
        'Lưu lại và thực hiện 3 hiệp mỗi tối trước khi đi ngủ nhé!',
    },
    {
      title: 'Lịch tập Full Body 30 phút cho người bận',
      theme: 'Tập luyện cường độ cao ngắt quãng HIIT kết hợp tạ đơn: Squat to Overhead Press, Burpee, Dumbbell Row giúp đốt mỡ suốt 24h sau tập.',
      script:
        'Không có 2 tiếng để đến phòng gym? 30 phút tập đúng phương pháp này sẽ hiệu quả gấp đôi việc bạn chạy bộ lờ đờ.\n\n' +
        'Chúng ta kết hợp các bài tập đa khớp kích hoạt toàn bộ nhóm cơ lớn: Chân, lưng xô, ngực và vai.\n\n' +
        'Mỗi bài thực hiện 45 giây liên tục, nghỉ 15 giây, lặp lại 4 vòng với sự tập trung tối đa.\n\n' +
        'Cơ thể bạn sẽ kích hoạt hiệu ứng đốt mỡ thụ động suốt 24 giờ sau khi buổi tập kết thúc. Bắt đầu ngay hôm nay!',
    },
    {
      title: 'Sửa lỗi Squat sai khớp gối nguy hiểm',
      theme: 'Phân tích trực quan kỹ thuật gánh tạ: mở rộng hông, đầu gối thẳng hướng mũi chân, gồng core bụng để bảo vệ cột sống thắt lưng.',
      script:
        'Tập Squat mà thấy đau lưng dưới hoặc nhói ở khớp gối? Bạn đang mắc phải 2 lỗi kỹ thuật cực kỳ nguy hiểm này.\n\n' +
        'Lỗi thứ nhất: Đầu gối bị sụp vào trong khi đứng lên, làm tăng áp lực khủng khiếp lên dây chằng chéo.\n\n' +
        'Lỗi thứ hai: Nhón gót chân và đổ người quá nhiều về phía trước khiến thắt lưng phải gánh chịu toàn bộ tải trọng.\n\n' +
        'Cách khắc phục: Mở nhẹ mũi chân 30 độ, siết chặt cơ bụng và tưởng tượng như bạn đang ngồi xuống một chiếc ghế thấp phía sau!',
    },
    {
      title: 'Bí quyết tăng cơ giảm mỡ Lean Bulk hiệu quả',
      theme: 'Góc quay phòng gym kịch tính: so sánh chế độ calo dư thừa 300 kcal/ngày, nạp đủ 2g protein/kg thể trọng và bài tập tạ tăng dần tải trọng.',
      script:
        'Nhiều người xả cơ Bulk Up sai lầm bằng cách ăn uống vô tội vạ khiến mỡ bụng tăng nhanh gấp 3 lần cơ bắp.\n\n' +
        'Bí quyết tăng cơ nạc Lean Bulk chuẩn khoa học: chỉ duy trì mức dư thừa calo nhẹ nhàng từ 250 đến 300 calo mỗi ngày so với mức trao đổi chất TDEE.\n\n' +
        'Đảm bảo nạp tối thiểu 1.8 đến 2.2 gram protein trên mỗi kilogram cân nặng từ các nguồn đạm chất lượng: ức gà, trứng, cá hồi và whey protein.\n\n' +
        'Kết hợp phương pháp lũy tiến tải trọng Progressive Overload: tăng dần mức tạ hoặc số lần lặp sau mỗi tuần để kích thích sợi cơ phát triển tối đa!',
    },
    {
      title: '4 bài tập thân trên giúp bờ vai thon lưng chữ V',
      theme: 'Huấn luyện viên thể hình hướng dẫn kỹ thuật Lat Pulldown kéo lưng xô, Lateral Raise bay vai, Dumbbell Row và Face Pull.',
      script:
        'Muốn eo trông thon gọn hơn mà không cần phẫu thuật? Hãy tập trung xây dựng bờ vai tròn và tấm lưng hình chữ V săn chắc.\n\n' +
        'Bài 1: Kéo xô Lat Pulldown — lưu ý ưỡn ngực kéo thanh đòn về phía xương quai xanh và siết chặt cơ lưng xô ở điểm cuối.\n\n' +
        'Bài 2: Bay vai ngang Dumbbell Lateral Raise — mở rộng khớp vai tạo độ bo tròn quyến rũ cho bờ vai thon thả.\n\n' +
        'Bài 3: Kéo tạ đơn Dumbbell Row giúp lưng dày dặn và bài 4: Face Pull cải thiện tư thế gù lưng và làm khỏe cơ xoay vai bảo vệ khớp!',
    },
    {
      title: 'Hít đất chuẩn form từ cơ bản đến nâng cao',
      theme: 'Góc quay ngang sàn nhà: góc khuỷu tay 45 độ hình mũi tên, gồng chặt mông bụng, hạ ngực sát sàn và đẩy lên dứt khoát.',
      script:
        'Hít đất là bài tập thể hình thể trọng Calisthenics kinh điển nhất nhưng có tới 80% người tập đang mắc lỗi xòe cùi chỏ sang ngang.\n\n' +
        'Lỗi xòe tay 90 độ sẽ tạo áp lực hủy hoại khớp vai và giảm hiệu quả kích hoạt cơ ngực.\n\n' +
        'Form chuẩn chuẩn mực: khép cùi chỏ một góc 45 độ so với thân người tạo thành hình mũi tên hướng về phía trước.\n\n' +
        'Siết chặt cơ mông, gồng cứng cơ bụng để giữ toàn bộ cơ thể từ đầu đến gót chân trên một đường thẳng thẳng tắp như chiếc thước kẻ!',
    },
    {
      title: 'Cách khắc phục đau mỏi cơ sau tập DOMS nhanh nhất',
      theme: 'Phương pháp phục hồi cơ bắp: tắm nước đá ngâm bồn, dùng súng massage giãn cơ myofascial, nạp điện giải và ngủ đủ 8 tiếng.',
      script:
        'Cảm giác đau ê ẩm khắp người sau ngày tập chânLeg Day khiến bạn bước đi không vững? Đây là hiện tượng đau mỏi cơ khởi phát muộn DOMS.\n\n' +
        'Để đẩy nhanh tốc độ phục hồi cơ bắp gấp đôi, hãy áp dụng ngay 3 mẹo sau: Thứ nhất, sử dụng con lăn giãn cơ Foam Roller hoặc súng massage để giải tỏa các điểm xoắn cơ bắp sau buổi tập.\n\n' +
        'Thứ hai: Nạp đủ nước điện giải và bổ sung Magiê giúp thư giãn hệ thần kinh cơ bắp.\n\n' +
        'Thứ ba: Một giấc ngủ sâu kéo dài 8 tiếng là khoảng thời gian duy nhất cơ thể tiết ra hormone tăng trưởng GH để chữa lành và tái tạo các sợi cơ mới to khỏe hơn!',
    },
    {
      title: 'Chạy bộ giảm mỡ: Hãy chạy đúng vùng nhịp tim Zone 2',
      theme: 'Biểu đồ nhịp tim trên đồng hồ thể thao: chạy bước nhỏ tốc độ vừa phải ở vùng tim Zone 2 (60-70% Max Heart Rate) đốt mỡ tối ưu.',
      script:
        'Sai lầm phổ biến nhất của người mới chạy bộ giảm cân là cắm đầu chạy thục mạng cho đến khi thở không ra hơi và kiệt sức sau 10 phút.\n\n' +
        'Chạy quá nhanh ở nhịp tim cao sẽ khiến cơ thể ưu tiên đốt cháy đường Glucose trong cơ bắp thay vì đốt mỡ thừa dự trữ.\n\n' +
        'Bí quyết đốt mỡ tối ưu của các vận động viên điền kinh thế giới là chạy ở vùng nhịp tim Zone 2 — tương đương 60 đến 70% nhịp tim tối đa.\n\n' +
        'Ở tốc độ này, bạn vẫn có thể vừa chạy vừa nói chuyện thành câu trọn vẹn mà không bị hụt hơi, cơ thể sẽ kích hoạt cỗ máy đốt mỡ thụ động suốt hàng giờ liền!',
    },
    {
      title: 'Thực đơn Eat Clean 7 ngày dễ nấu đủ chất cho người tập',
      theme: 'Mâm cơm Eat Clean nhiều màu sắc: ức gà áp chảo sốt tiêu, khoai lang luộc, bông cải xanh luộc, trứng lòng đào và bơ tươi.',
      script:
        'Ăn sạch Eat Clean không hề nhàm chán và đắt đỏ như bạn nghĩ nếu biết cách biến tấu gia vị thông minh.\n\n' +
        'Nguyên tắc đĩa ăn chuẩn 3 phần: một nửa đĩa là chất xơ từ các loại rau củ nhiều màu sắc như bông cải xanh, ớt chuông và cà chua bi.\n\n' +
        'Một phần tư là nguồn tinh bột chuyển hóa chậm giàu chất xơ: khoai lang, gạo lứt hoặc yến mạch nguyên hạt.\n\n' +
        'Và một phần tư còn lại là nguồn đạm nạc tinh khiết: ức gà ướp sốt tiêu đen áp chảo, cá hồi áp chảo bơ tỏi hay trứng gà lòng đào béo bùi.\n\n' +
        'Ăn ngon, dáng thon và cơ thể tràn đầy sinh lực mỗi ngày!',
    },
    {
      title: 'Động lực tập luyện: Đừng bỏ cuộc khi cơ thể chuẩn bị thích nghi',
      theme: 'Khoảnh khắc mồ hôi rơi xuống sàn tập gym, ánh mắt kiên định nhìn vào gương vượt qua lần lặp tạ cuối cùng bứt phá giới hạn bản thân.',
      script:
        'Hai tuần đầu tiên khi bắt đầu tập luyện luôn là giai đoạn khó khăn nhất, khi từng thớ cơ trên người đều gào thét muốn bạn từ bỏ.\n\n' +
        'Não bộ của bạn sẽ liên tục đưa ra hàng ngàn lý do ngụy biện: hôm nay trời mưa, hôm nay mệt quá, để ngày mai tập bù.\n\n' +
        'Nhưng hãy nhớ rằng: sự thay đổi kỳ diệu chỉ thực sự bắt đầu khi bạn vượt qua được ranh giới của sự lười biếng và thoải mái tạm thời.\n\n' +
        'Nỗi đau của kỷ luật chỉ kéo dài vài tháng, nhưng nỗi đau của sự hối tiếc và một cơ thể ốm yếu sẽ theo bạn suốt cả cuộc đời. Đứng dậy và bước tiếp ngay hôm nay!',
    },
    {
      title: 'Chinh phục bài tập Burpee đốt mỡ toàn thân',
      theme: 'Kỹ thuật thực hiện chuẩn xác động tác Burpee không gây đau lưng dưới',
      script:
        'Burpee là vua của các bài tập Bodyweight giúp đốt cháy tới 15 calo mỗi phút luyện tập.\n\n' +
        'Nhảy bật chân ra sau thành tư thế Plank, hạ ngực chạm sàn và bật nhảy cao vỗ tay qua đầu.\n\n' +
        'Chỉ cần 10 phút tập ngắt quãng Tabata mỗi sáng đủ để duy trì trao đổi chất cả ngày dài.',
    },
    {
      title: 'Bí quyết siết cơ bụng 6 múi tại nhà trong 30 ngày',
      theme: 'Lộ trình 5 bài tập cốt lõi kích hoạt toàn diện cơ bụng trên, dưới và liên sườn',
      script:
        'Cơ bụng được tạo nên từ phòng bếp chứ không chỉ ở phòng gym: kiểm soát thâm hụt calo là chìa khóa 70%.\n\n' +
        'Kết hợp Plank nghiêng, gập bụng ngược và đạp xe trên không để siết chặt từng thớ cơ bụng.\n\n' +
        'Kiên trì tập luyện 15 phút mỗi ngày để tự tin khoe vóc dáng săn chắc đón hè.',
    },
    {
      title: 'Kỹ thuật Deadlift chuẩn form bảo vệ cột sống',
      theme: 'Hướng dẫn chi tiết vị trí đặt chân, cách khóa khớp hông và gồng bụng Brace Core',
      script:
        'Đừng bao giờ nâng thanh đòn bằng lưng dưới! Hãy đẩy sàn bằng gót chân và dùng sức mạnh của cơ mông.\n\n' +
        'Giữ thanh tạ luôn trượt sát ống đồng và khóa chặt khớp vai lưng xô suốt quá trình chuyển động.\n\n' +
        'Nâng mức tạ an toàn để phát triển sức mạnh toàn diện mà không lo chấn thương đĩa đệm.',
    },
    {
      title: 'Thực đơn Eat Clean tăng cơ giảm mỡ cho người bận rộn',
      theme: 'Chuẩn bị Meal Prep 5 hộp cơm ức gà, khoai lang và bông cải xanh trong 45 phút',
      script:
        'Ức gà áp chảo sốt tiêu đen mềm ngọt không bị khô bã, kết hợp carbs phức từ khoai lang nướng thơm lừng.\n\n' +
        'Đầy đủ dinh dưỡng với hàm lượng protein chuẩn 150g mỗi ngày hỗ trợ phục hồi và phát triển cơ bắp.\n\n' +
        'Tiết kiệm thời gian nấu nướng mỗi ngày mà vẫn ăn uống chuẩn khoa học thể hình.',
    },
    {
      title: 'Khắc phục hội chứng gù lưng vẹo cổ dân văn phòng',
      theme: 'Bài tập giãn cơ ngực và tăng cường cơ lưng trên chữa gù lưng hiệu quả',
      script:
        'Ngồi máy tính 8 tiếng mỗi ngày khiến cơ ngực bị co rút và các cơ lưng trên bị suy yếu nghiêm trọng.\n\n' +
        'Thực hiện động tác Wall Slide và bẻ khớp vai với dây kháng lực mỗi 2 tiếng làm việc.\n\n' +
        'Lấy lại tư thế đứng thẳng hiên ngang, mở rộng lồng ngực và giảm hẳn đau mỏi vai gáy.',
    },
    {
      title: 'Chạy bộ 5km đầu tiên cho người mới bắt đầu',
      theme: 'Chiến lược Run-Walk xen kẽ giúp tích lũy thể lực mà không bị kiệt sức',
      script:
        'Đừng vội chạy thục mạng ngay từ km đầu tiên! Hãy chạy nhẹ 2 phút kết hợp đi bộ nhanh 1 phút.\n\n' +
        'Điều hòa nhịp thở 2-2 và tiếp đất bằng nửa bàn chân trước để giảm áp lực lên khớp gối.\n\n' +
        'Vượt qua cột mốc 5km để mở ra cánh cửa chinh phục cự ly bán marathon đầy tự hào.',
    },
    {
      title: 'Bí quyết giãn cơ phục hồi sau buổi tập chân tàn khốc',
      theme: 'Lăn bọt Foam Roller giải tỏa các điểm xoắn cơ myofascial release',
      script:
        'Cơn đau nhức cơ bắp DOMS sau ngày tập Leg Day có thể khiến bạn đi lại khập khiễng nhiều ngày.\n\n' +
        'Dành 15 phút lăn bọt cơ đùi trước, cơ gân kheo và bắp chân kết hợp tắm nước ấm thư giãn.\n\n' +
        'Tăng cường tuần hoàn máu giúp đào thải axit lactic và tăng tốc độ hồi phục cơ bắp gấp đôi.',
    },
    {
      title: 'Hít đất đúng cách - Từ con số 0 đến 50 cái liên tục',
      theme: 'Các biến thể từ hít đất nghiêng trên tường đến hít đất kim cương nâng cao',
      script:
        'Nếu chưa hít đất được cái nào, hãy bắt đầu chống tay vào bàn làm việc hoặc quỳ gối trên thảm.\n\n' +
        'Khép khuỷu tay góc 45 độ so với thân người để kích hoạt cơ ngực tối đa thay vì gây áp lực lên khớp vai.\n\n' +
        'Tăng dần số reps mỗi tuần để sở hữu vòm ngực vạm vỡ và đôi tay săn chắc khỏe khoắn.',
    },
    {
      title: 'Đánh bại cơn thèm đồ ngọt khi đang trong giai đoạn Cutting',
      theme: 'Mẹo tâm lý và đồ ăn vặt thay thế lành mạnh ít calo',
      script:
        'Khi cơn thèm đường ập đến lúc 10 giờ đêm, hãy uống một cốc nước ấm lớn hoặc trà thảo mộc bạc hà.\n\n' +
        'Thay thế trà sữa bằng sữa chua Hy Lạp trộn quả mọng và một thìa hạt chia giàu chất xơ.\n\n' +
        'Kỷ luật trong từng bữa ăn phụ là bí quyết tạo nên sự khác biệt giữa vóc dáng bình thường và siêu nét.',
    },
    {
      title: 'Tâm lý thép của nhà vô địch thể hình',
      theme: 'Vượt qua giới hạn ngưỡng đau trong 3 lần lặp cuối cùng của hiệp tập',
      script:
        'Những lần rep đầu tiên chỉ là khởi động, những rep khi cơ bắp run rẩy mới là lúc sự phát triển bắt đầu.\n\n' +
        'Ý chí quyết định việc bạn đặt tạ xuống bỏ cuộc hay gồng hết sức bình sinh đẩy thêm một rep nữa.\n\n' +
        'Chiến thắng bản thân trong phòng tập chính là bước đệm để chiến thắng mọi nghịch cảnh cuộc đời.',
    },
  ],

  // 32. Template: real_estate (20 mục)
  real_estate: [
    {
      title: 'Penthouse 360 độ view triệu đô ven sông',
      theme: 'Khám phá căn hộ thông tầng sang trọng: ban công kính ôm trọn đường chân trời hoàng hôn, sàn đá cẩm thạch và hồ bơi vô cực trên cao.',
      script:
        'Chào mừng bạn đến với căn Penthouse thông tầng đẹp nhất khu đô thị ven sông hôm nay.\n\n' +
        'Với diện tích hơn 350m2, toàn bộ phòng khách được thiết kế trần cao 7 mét cùng hệ cửa kính Low-E chạm sàn ôm trọn tầm nhìn 360 độ ngắm hoàng hôn rực rỡ.\n\n' +
        'Khu vực bếp đảo nhập khẩu nguyên khối từ Ý, liền kề hồ bơi chân mây vô cực nơi bạn có thể thả mình ngắm thành phố lên đèn lung linh.\n\n' +
        'Một không gian sống xứng tầm định vị đẳng cấp của chủ nhân tinh hoa.',
    },
    {
      title: 'Biệt thự sân vườn phong cách Indochine',
      theme: 'Kiến trúc Đông Dương thanh lịch: gạch bông cổ điển, vòm cong mềm mại, nội thất gỗ óc chó ấm cúng và hồ cá Koi thư thái giữa vườn xanh.',
      script:
        'Nếu bạn yêu thích sự hoài niệm và bình yên, căn biệt thự phong cách Indochine này chính là tổ ấm trong mơ.\n\n' +
        'Sự kết hợp hoàn hảo giữa nét đẹp Pháp cổ kính và chất liệu tự nhiên bản địa: nền gạch hoa văn thủ công, quạt trần gỗ cánh lớn và những vòm cong mềm mại.\n\n' +
        'Bước ra hiên nhà là khoảng vườn rợp bóng cây xanh mát cùng hồ cá Koi bơi lội thanh bình, tách biệt hoàn toàn khỏi khói bụi ồn ào của phố thị.\n\n' +
        'Nơi mỗi ngày trở về nhà đều giống như một kỳ nghỉ dưỡng đích thực.',
    },
    {
      title: 'Căn hộ tối giản Japandi tràn ngập ánh sáng',
      theme: 'Phong cách tối giản Nhật Bản kết hợp Bắc Âu: gỗ sồi sáng màu, ban công ngập nắng sớm trồng cây xương rồng, không gian sống gọn gàng thoáng đãng.',
      script:
        'Tối giản không có nghĩa là trống trải, mà là giữ lại những gì thực sự mang lại niềm vui cho tâm hồn.\n\n' +
        'Căn hộ 80m2 này được thiết kế theo phong cách Japandi với tông màu be ấm và gỗ sồi tự nhiên làm chủ đạo.\n\n' +
        'Mọi chi tiết thừa thãi đều được giấu gọn gàng sau hệ tủ âm tường thông minh, nhường chỗ cho ánh sáng tự nhiên và luồng gió trời đối lưu trong lành.\n\n' +
        'Một không gian chữa lành tuyệt đối sau những giờ làm việc căng thẳng bên ngoài!',
    },
    {
      title: 'Nhà phố hiện đại giếng trời cây xanh giữa lòng đô thị',
      theme: 'Thiết kế nhà phố 4 tầng mặt tiền hẹp: giếng trời thông tầng đón trọn ánh sáng tự nhiên, cây xanh thân gỗ vươn cao giữa phòng khách.',
      script:
        'Giải pháp kiến trúc hoàn hảo cho những căn nhà phố mặt tiền hẹp giữa lòng đô thị ngột ngạt đông đúc.\n\n' +
        'Khoảng giếng trời thông tầng khổng lồ đặt ngay trung tâm ngôi nhà đóng vai trò như một lá phổi xanh đón trọn luồng ánh sáng tự nhiên và gió trời đối lưu.\n\n' +
        'Cây lộc vừng thân gỗ vươn cao xanh mát bên cạnh tiểu cảnh hồ nước róc rách tạo nên một không gian sinh thái thư thái ngay giữa phòng khách.\n\n' +
        'Nơi bạn tìm thấy sự an yên và không gian sống chan hòa cùng thiên nhiên dù đang ở ngay giữa lòng thành phố nhộn nhịp.',
    },
    {
      title: 'Biệt thự ven biển phong cách Địa Trung Hải vòm cong',
      theme: 'Biệt thự mái ngói máng đỏ, tường sơn trắng vôi mộc mạc, vòm cửa cong mềm mại hướng thẳng ra bãi biển cát trắng nắng vàng rực rỡ.',
      script:
        'Lấy cảm hứng từ những ngôi làng ven biển xinh đẹp của vùng Địa Trung Hải đầy nắng gió và tự do.\n\n' +
        'Căn biệt thự nghỉ dưỡng nổi bật với những mảng tường trắng tinh khôi, mái vòm cong mềm mại và hàng cột hiên lát đá cẩm thạch mộc mạc.\n\n' +
        'Hồ bơi chân mây xanh ngọc bích trải dài nối liền tầm nhìn vô cực ra mặt biển đại dương xanh biếc bao la.\n\n' +
        'Không gian nghỉ dưỡng đẳng cấp mang hơi thở phóng khoáng, lãng mạn và ngập tràn năng lượng tươi mới của biển cả.',
    },
    {
      title: 'Căn hộ Studio 40m2 thông minh cho người độc thân',
      theme: 'Giải pháp nội thất đa năng biến hình: giường gấp thông minh giấu trong tường, bàn đảo kết hợp bàn làm việc, tủ kịch trần tối ưu không gian.',
      script:
        'Khám phá căn hộ Studio diện tích chỉ 40m2 nhưng sở hữu đầy đủ tiện nghi của một căn hộ cao cấp nhờ thiết kế nội thất thông minh.\n\n' +
        'Hệ giường ngủ biến hình có thể gấp gọn giấu khéo léo vào hệ tủ tường chỉ bằng một thao tác đẩy nhẹ nhàng, trả lại khoảng sàn rộng rãi cho phòng khách.\n\n' +
        'Bàn đảo bếp tích hợp bàn ăn và bàn làm việc linh hoạt, hệ tủ âm tường kịch trần tận dụng tối đa từng centimet chiều cao không gian lưu trữ.\n\n' +
        'Không gian sống lý tưởng, tiện nghi và thời thượng dành riêng cho những bạn trẻ độc thân năng động!',
    },
    {
      title: 'Nhà vườn nghỉ dưỡng ngoại ô có hồ cá và rau xanh',
      theme: 'Khuôn viên nhà vườn 1.000m2 ngoại ô: nhà gỗ mái lá cọ mộc mạc, hồ cá súng hoa nở rộ, vườn cây ăn quả trĩu cành và vườn rau hữu cơ.',
      script:
        'Rời xa khói bụi và áp lực nghẹt thở của phố thị để trở về với chốn bình yên tại căn nhà vườn nghỉ dưỡng ngoại ô thơ mộng.\n\n' +
        'Khuôn viên rộng hơn một ngàn mét vuông rợp bóng cây ăn quả trĩu cành, tiếng chim hót líu lo rộn rã mỗi sớm mai thức dậy.\n\n' +
        'Trước hiên nhà là hồ hoa súng thơm ngát đàn cá bơi lội tung tăng, bên cạnh là luống rau xanh mướt tự tay vun xới không hóa chất.\n\n' +
        'Nơi mỗi dịp cuối tuần cả gia đình được quây quần hít thở bầu không khí trong lành và nạp lại nguồn năng lượng sống dồi dào.',
    },
    {
      title: 'Căn hộ Duplex thông tầng trần cao sang trọng',
      theme: 'Phòng khách trần cao 6 mét với đèn chùm pha lê lộng lẫy, cầu thang bay kính cường lực thanh thoát và view ngắm thành phố đêm lung linh.',
      script:
        'Đẳng cấp không gian sống thông tầng Duplex đỉnh cao dành cho những chủ nhân yêu thích sự phóng khoáng và sang trọng tuyệt đối.\n\n' +
        'Phòng khách sở hữu trần cao tới 6 mét với chiếc đèn chùm pha lê thả trần khổng lồ tỏa ánh sáng vàng ấm áp lộng lẫy như một khách sạn 5 sao.\n\n' +
        'Hệ thống cầu thang bay với lan can kính cường lực trong suốt không trụ đỡ tạo cảm giác thanh thoát và bay bổng cho toàn bộ không gian.\n\n' +
        'Ngắm nhìn toàn cảnh thành phố lung linh ánh đèn đêm rực rỡ qua hệ vách kính panorama chạm trần — trải nghiệm sống đỉnh cao không dành cho số đông!',
    },
    {
      title: 'Nhà gỗ homestay mộc mạc giữa đồi thông Đà Lạt',
      theme: 'Căn nhà gỗ thông mộc mạc nép mình bên sườn đồi thông reo vi vu, lò sưởi đốt củi ấm áp và ban công săn mây mờ ảo mỗi sáng sớm.',
      script:
        'Ẩn mình giữa những rặng thông già reo vi vu trong gió lạnh sương mù của thành phố ngàn hoa Đà Lạt mộng mơ.\n\n' +
        'Căn nhà gỗ được dựng hoàn toàn từ gỗ thông tự nhiên mộc mạc, thoang thoảng mùi hương tinh dầu thông ấm áp dễ chịu lan tỏa khắp các gian phòng.\n\n' +
        'Buổi tối cuộn tròn trong chiếc chăn len dày bên lò sưởi đốt củi bập bùng lắng nghe tiếng mưa rơi tí tách trên mái tôn cũ.\n\n' +
        'Sáng sớm bước ra ban công nhấp ngụm trà nóng ngắm biển mây trắng bồng bềnh tràn qua thung lũng thông xanh ngút ngàn.',
    },
    {
      title: 'Không gian văn phòng Co-working hiện đại tràn cảm hứng',
      theme: 'Văn phòng làm việc phong cách mở Industrial: tường gạch thô, trần để lộ ống kỹ thuật, booth làm việc cá nhân cách âm và quầy bar cà phê.',
      script:
        'Định nghĩa lại môi trường làm việc sáng tạo với không gian Co-working Space phong cách công nghiệp Industrial hiện đại.\n\n' +
        'Sự kết hợp táo bạo giữa những bức tường gạch nung thô mộc, trần bê tông để lộ hệ thống kỹ thuật sơn đen cá tính và những mảng cây xanh mát mắt.\n\n' +
        'Các buồng điện thoại cách âm chuyên dụng Phone Booth cho những cuộc gọi quan trọng, liền kề quầy bar cà phê phục vụ đồ uống miễn phí suốt cả ngày dài.\n\n' +
        'Nơi kết nối và chắp cánh cho những ý tưởng khởi nghiệp đột phá của cộng đồng các chuyên gia sáng tạo trẻ!',
    },
    {
      title: 'Biệt thự sân vườn phong cách Indochine ven sông Sài Gòn',
      theme: 'Nét giao thoa kiến trúc Pháp cổ điển và vật liệu gỗ tếch mộc mạc bản địa',
      script:
        'Hàng hiên rộng mở đón làn gió sông mát rượi, gạch bông cổ điển lát sàn thủ công tinh xảo.\n\n' +
        'Bể bơi vô cực ngọc bích soi bóng rặng dừa xanh mướt và những mái vòm uốn cong trang nhã.\n\n' +
        'Không gian nghỉ dưỡng thượng lưu mang đậm chiều sâu di sản văn hóa giữa lòng đô thị phồn hoa.',
    },
    {
      title: 'Căn hộ Penthouse Duplex 360 độ ngắm trọn hồ Tây',
      theme: 'Trần cao thông tầng 7 mét với kính Low-E nguyên khối chạm sàn',
      script:
        'Ánh hoàng hôn vàng óng buông xuống mặt hồ Tây rộng mở ngay trước mắt từ phòng khách tráng lệ.\n\n' +
        'Cầu thang xoắn ốc điêu khắc kim loại dẫn lên tầng lửng với phòng ngủ Master có phòng tắm kính nhìn ra trời sao.\n\n' +
        'Đỉnh cao của phong cách sống xa hoa dành riêng cho những chủ nhân danh giá nhất.',
    },
    {
      title: 'Nhà phố thông minh tối giản phong cách Wabi-Sabi',
      theme: 'Vẻ đẹp của sự bất toàn qua tường bê tông mài, gỗ mộc và sỏi đá tự nhiên',
      script:
        'Giếng trời xanh ngắt ở trung tâm ngôi nhà đưa ánh sáng tự nhiên và tiếng mưa rơi róc rách vào phòng khách.\n\n' +
        'Không gian tĩnh lặng rũ bỏ mọi xô bồ náo nhiệt bên ngoài cánh cửa gỗ sồi dày dặn.\n\n' +
        'Nơi an trú an yên nuôi dưỡng tâm hồn qua từng góc nhìn mộc mạc và chân thực.',
    },
    {
      title: 'Biệt thự trên sườn đồi thông Đà Lạt mộng mơ',
      theme: 'Mái dốc ốp ngói đá đen và lò sưởi củi ấm cúng trong đêm sương giá',
      script:
        'Buổi sáng thức dậy giữa biển mây trắng bồng bềnh tràn qua khung cửa sổ phòng ngủ ốp gỗ thông thơm nồng.\n\n' +
        'Ban công kính rộng ngắm nhìn thung lũng đèn hoa rực rỡ lấp lánh như triệu vì sao khi đêm về.\n\n' +
        'Chốn về bình yên để tìm lại sự thư thái và cảm xúc sáng tạo giữa đại ngàn thông reo.',
    },
    {
      title: 'Shophouse phố đi bộ thương mại sầm uất triệu đô',
      theme: 'Mặt tiền 8 mét đắc địa với thiết kế tân cổ điển châu Âu sang trọng',
      script:
        'Vị trí kim cương ngay ngã tư đại lộ kết nối các trục giao thông huyết mạch của khu đô thị mới.\n\n' +
        'Tầng trệt kinh doanh nhà hàng cao cấp, các tầng trên là không gian văn phòng boutique hiện đại.\n\n' +
        'Gia tăng giá trị đầu tư bền vững và dòng tiền cho thuê sinh lời vượt trội qua từng năm.',
    },
    {
      title: 'Biệt thự biển phong cách Địa Trung Hải Santorini tại Phú Quốc',
      theme: 'Gam màu trắng tuyết kết hợp mái vòm xanh coban bên bờ cát trắng mịn',
      script:
        'Chỉ vài bước chân trần là chạm vào làn nước biển xanh ngọc bích ấm áp quanh năm của đảo ngọc.\n\n' +
        'Sân hiên lát đá tự nhiên rợp bóng hoa giấy hồng rực rỡ dưới ánh nắng vàng nhiệt đới.\n\n' +
        'Thiên đường nghỉ dưỡng riêng tư mang lại những trải nghiệm đẳng cấp quốc tế khó quên.',
    },
    {
      title: 'Căn hộ Studio nhỏ 35m2 với nội thất biến hình thông minh',
      theme: 'Giường nâng ẩn tường, bàn ăn gấp gọn và hệ tủ kịch trần đa năng',
      script:
        'Tối ưu hóa từng centimet diện tích để biến không gian nhỏ thành căn hộ đầy đủ tiện nghi hiện đại.\n\n' +
        'Ban ngày là phòng làm việc rộng rãi đón nắng, ban đêm hạ giường xuống thành phòng ngủ ấm cúng.\n\n' +
        'Giải pháp nhà ở thông minh và phong cách dành riêng cho người trẻ độc thân hiện đại.',
    },
    {
      title: 'Khu đô thị sinh thái xanh chuẩn chứng chỉ năng lượng EDGE',
      theme: 'Mật độ cây xanh 70% với hệ thống hồ điều hòa và pin mặt trời trên mái',
      script:
        'Cung đường dạo bộ rợp bóng mát ven hồ giúp giảm 3 độ C nhiệt độ không khí so với trung tâm thành phố.\n\n' +
        'Hệ thống lọc nước tại vòi và phân loại rác thông minh kiến tạo môi trường sống bền vững cho con trẻ.\n\n' +
        'Chuẩn mực sống sinh thái mới nâng niu sức khỏe toàn diện của các gia đình đa thế hệ.',
    },
    {
      title: 'Biệt phủ sân vườn truyền thống Bắc Bộ 5 gian gỗ lim',
      theme: 'Mái ngói mũi hài rêu phong, cột gỗ lim nguyên khối và hòn non bộ cổ kính',
      script:
        'Nét chạm trổ tứ quý \'Tùng - Cúc - Trúc - Mai\' tinh xảo từ bàn tay của các nghệ nhân làng nghề mộc trứ danh.\n\n' +
        'Sân gạch Bát Tràng đỏ au bên hồ sen thơm ngát và hàng cau thẳng tắp tỏa hương hoa trắng.\n\n' +
        'Lưu giữ gia phong và nét đẹp kiến trúc truyền thống nghìn năm cho con cháu mai sau.',
    },
    {
      title: 'Văn phòng làm việc phong cách Công nghiệp Industrial Loft',
      theme: 'Trần bê tông để lộ ống thông gió kim loại, tường gạch thô và bàn làm việc gỗ thông',
      script:
        'Không gian mở không vách ngăn kích thích tư duy sáng tạo và tinh thần kết nối đồng đội cởi mở.\n\n' +
        'Góc quầy bar pha chế cà phê specialty và khu nghỉ ngơi thư giãn với ghế lười êm ái.\n\n' +
        'Khơi nguồn cảm hứng đột phá cho các doanh nghiệp khởi nghiệp công nghệ tiên phong.',
    },
  ],

  // 33. Template: historical_legend (20 mục)
  historical_legend: [
    {
      title: 'Đại thắng Bạch Đằng Giang dậy sóng',
      theme: 'Trận chiến hào hùng trên sông Bạch Đằng: mưu kế cọc gỗ ngầm của Ngô Quyền, thủy triều rút nhanh và thuyền giặc Nam Hán tan tác.',
      script:
        'Năm 938, dòng sông Bạch Đằng cuộn sóng đã khắc ghi trang sử vàng chấm dứt hơn 1.000 năm Bắc thuộc của dân tộc ta.\n\n' +
        'Hiểu rõ quy luật thủy triều lên xuống, Ngô Quyền đã cho đẵn hàng vạn cây gỗ lớn vót nhọn bịt sắt cắm ngầm dưới lòng sông hiểm trở.\n\n' +
        'Khi quân giặc Nam Hán kiêu ngạo tràn vào, đoàn thuyền chiến nước ta giả thua nhử địch, chờ nước triều rút nhanh để phản công thần tốc.\n\n' +
        'Thuyền giặc vướng cọc đắm chìm trong biển lửa, mở ra kỷ nguyên độc lập tự chủ muôn đời cho nước Việt!',
    },
    {
      title: 'Trận Điện Biên Phủ lừng lẫy năm châu',
      theme: 'Kỳ tích kéo pháo bằng tay qua dốc núi cheo leo, chiến hào bao vây cứ điểm và lá cờ Quyết chiến Quyết thắng tung bay trên nóc hầm De Castries.',
      script:
        '56 ngày đêm khoét núi ngủ hầm, mưa dầm cơm vắt, máu trộn bùn non — một kỳ tích chấn động địa cầu ở thế kỷ 20.\n\n' +
        'Những khẩu pháo nặng hàng tấn được các chiến sĩ kéo qua đèo cao dốc thẳm hoàn toàn bằng sức người và ý chí quật cường.\n\n' +
        'Hệ thống chiến hào siết chặt từng tấc đất như chiếc thòng lọng khổng lồ bóp nghẹt pháo đài bất khả xâm phạm của thực dân Pháp.\n\n' +
        'Chiều ngày 7 tháng 5 năm 1954, lá cờ đỏ sao vàng kiêu hãnh tung bay trên nóc hầm De Castries, khẳng định sức mạnh vô địch của lòng yêu nước!',
    },
    {
      title: 'Bí ẩn lăng mộ Tần Thủy Hoàng',
      theme: 'Đội quân đất nung 8.000 binh sĩ ngàn năm không đổi, dòng sông thủy ngân cuồn cuộn dưới lòng đất và những cạm bẫy bí hiểm chưa ai chạm tới.',
      script:
        'Nằm sâu dưới lòng núi Lệ Sơn là một trong những kỳ quan bí ẩn và đồ sộ nhất lịch sử nhân loại — lăng mộ hoàng đế Tần Thủy Hoàng.\n\n' +
        'Hơn 8.000 pho tượng binh mã dũng bằng đất nung kích thước như người thật, mỗi pho tượng mang một khuôn mặt và thần thái hoàn toàn riêng biệt.\n\n' +
        'Tương truyền, tâm lăng mộ chứa cả một mô hình thiên hạ thu nhỏ với các dòng sông thủy ngân cuồn cuộn chảy ngày đêm cùng hàng ngàn cạm bẫy sắc bén.\n\n' +
        'Sau hơn 2.000 năm, cánh cửa vào hầm mộ chính vẫn là một dấu hỏi lớn thách thức giới khảo cổ toàn cầu!',
    },
    {
      title: 'Hịch tướng sĩ và hào khí Đông A nhà Trần',
      theme: 'Hội nghị Diên Hồng trăm họ đồng thanh hô \'Đánh\', tướng sĩ khắc hai chữ \'Sát Thát\' vào cánh tay, ngọn lửa yêu nước bùng cháy ba lần đại phá quân Nguyên Mông.',
      script:
        'Trước hiểm họa xâm lăng của vó ngựa đế quốc Mông Cổ hung hãn từng san phẳng khắp lục địa Á - Âu.\n\n' +
        'Lời \'Hịch tướng sĩ\' bất hủ của Quốc công Tiết chế Hưng Đạo Đại Vương Trần Quốc Tuấn vang lên đanh thép như tiếng sấm rền đánh thức lòng tự tôn dân tộc.\n\n' +
        'Hội nghị Diên Hồng chấn động lịch sử khi các bậc bô lão muôn phương đồng thanh hô vang một chữ \'ĐÁNH!\' rung chuyển cả hoàng thành Thăng Long.\n\n' +
        'Hàng vạn binh sĩ đồng lòng xăm hai chữ \'Sát Thát\' vào cánh tay, thề hy sinh đến giọt máu cuối cùng để ba lần đánh tan quân xâm lược Nguyên Mông bách chiến bách thắng!',
    },
    {
      title: 'Cuộc hành quân thần tốc của vua Quang Trung',
      theme: 'Đội quân áo vải cờ đào hành quân thần tốc đêm ngày từ Phú Xuân ra Thăng Long, trận Ngọc Hồi - Đống Đa đại phá 29 vạn quân Mãn Thanh mùa xuân Kỷ Dậu.',
      script:
        'Mùa xuân năm Kỷ Dậu 1789, trang sử chói lọi của dân tộc ghi dấu cuộc hành quân thần tốc vô tiền khoáng hậu của vị hoàng đế áo vải Quang Trung Nguyễn Huệ.\n\n' +
        'Vừa hành quân vượt ngàn cây số từ Phú Xuân ra Bắc vừa tuyển quân và luyện tập, hai người cáng một người nằm nghỉ luân phiên ngày đêm không ngừng nghỉ.\n\n' +
        'Đêm mùng 4 rạng sáng mùng 5 Tết, chiến tượng xung phong xé toang phòng tuyến đồn Ngọc Hồi - Đống Đa trong biển lửa rực trời, quét sạch 29 vạn quân xâm lược Mãn Thanh.\n\n' +
        'Chiếc áo bào của người anh hùng dân tộc nhuốm đen thuốc súng bước vào Thăng Long trong niềm hân hoan rợp cờ hoa của muôn dân đất Việt!',
    },
    {
      title: 'Thiên tài quân sự Alexander Đại đế',
      theme: 'Đội hình phalanx giáo dài Sarissa 6 mét của quân đội Macedonia, Alexander cưỡi chiến mã Bucephalus chỉ huy trận chiến Gaugamela lật đổ đế chế Ba Tư.',
      script:
        'Chưa từng nếm mùi thất bại trong suốt cuộc đời binh nghiệp lẫy lừng, Alexander Đại đế của xứ Macedonia đã viết nên một trong những thiên sử thi quân sự vĩ đại nhất nhân loại.\n\n' +
        'Với chiến thuật pháo đài thép Phalanx sử dụng những ngọn giáo dài Sarissa dài tới 6 mét kết hợp cùng kỵ binh đột kích thần tốc.\n\n' +
        'Trong trận quyết chiến Gaugamela, chàng dũng tướng trẻ tuổi đã trực tiếp dẫn đầu mũi nhọn kỵ binh phá tan đội hình hàng chục vạn quân của hoàng đế Ba Tư Darius Đệ Tam.\n\n' +
        'Chinh phục một đế chế trải dài từ Hy Lạp cổ đại đến tận thung lũng sông Ấn huyền bí trước khi bước sang tuổi 32!',
    },
    {
      title: 'Nữ tướng Hai Bà Trưng cưỡi voi phất cờ khởi nghĩa',
      theme: 'Hai Bà Trưng cưỡi voi trắng xuất trận tại Hát Môn, áo giáp vàng phất cờ khởi nghĩa giành lại 65 thành trì, đền nợ nước trả thù nhà rửa hận nghìn thu.',
      script:
        'Năm 40 sau Công nguyên, tiếng trống đồng Mê Linh rền vang khắp cõi Nam khi hai vị nữ anh hùng dân tộc phất cờ khởi nghĩa.\n\n' +
        'Cưỡi trên lưng hai thớt voi chiến trắng khổng lồ xông pha nơi trận mạc, Trưng Trắc và Trưng Nhị đã hiệu triệu hàng vạn nghĩa sĩ khắp muôn phương đứng lên lật đổ ách thống trị tàn bạo của nhà Đông Hán.\n\n' +
        'Thu phục lại 65 thành trì non sông chỉ trong một mùa xuân, rửa sạch hận thù, xưng vương dựng nước và mở ra trang sử hào hùng bất diệt của phụ nữ Việt Nam.\n\n' +
        '\'Một xin rửa sạch nước thù / Hai xin dựng lại nghiệp xưa họ Hùng\' — khúc tráng ca muôn đời bất tử!',
    },
    {
      title: 'Trận chiến thành Troy và con ngựa gỗ huyền thoại',
      theme: 'Bức tường thành Troy kiên cố mười năm bất khả xâm phạm, con ngựa gỗ khổng lồ Odysses để lại trên bờ biển giấu các chiến binh Hy Lạp bên trong.',
      script:
        'Trận bao vây thành Troy kéo dài suốt 10 năm ròng rã giữa các vị anh hùng vĩ đại nhất của thần thoại Hy Lạp cổ đại.\n\n' +
        'Khi mọi cuộc tấn công bằng gươm giáo đều bất lực trước những bức tường thành đá kiên cố được các vị thần bảo hộ.\n\n' +
        'Mưu kế con ngựa gỗ khổng lồ của vị tướng tài ba Odysseus đã định đoạt số phận của cả một vương quốc phồn hoa.\n\n' +
        'Đêm xuống, các chiến binh dũng cảm chui ra từ bụng ngựa gỗ mở toang cổng thành trong biển lửa — bài học kinh điển về mưu lược quân sự và sự cảnh giác muôn đời!',
    },
    {
      title: 'Kỳ tài Gia Cát Lượng và mưu mượn gió đông Xích Bích',
      theme: 'Thuyền cỏ mượn tên trên sông sương mù, lập đàn tế gió đông nam trên núi Nam Bình, liên hoàn thuyền Tào Tháo chìm trong biển lửa Xích Bích.',
      script:
        'Trận Xích Bích năm 208 là bức tranh thủy chiến hoành tráng và kỳ vĩ bậc nhất trong lịch sử thời kỳ Tam Quốc phân tranh.\n\n' +
        'Quân sư Gia Cát Lượng Khổng Minh với tài trí túc trí đa mưu đã dùng mưu kế \'Thuyền cỏ mượn tên\' thu về mười vạn mũi tên của Tào Tháo trong sương mù đêm tối.\n\n' +
        'Lập đàn cầu phong trên núi Nam Bình, ngọn gió đông nam bất chợt nổi lên đúng thời khắc quyết định đưa những con thuyền lửa của Hoàng Cái lao thẳng vào hạm đội liên hoàn chiến thuyền của quân Ngụy.\n\n' +
        'Ngọn lửa Xích Bích thiêu rụi giấc mộng thống nhất thiên hạ của Tào Tháo, chính thức chia cắt giang sơn thành thế chân vạc Tam Quốc huyền thoại!',
    },
    {
      title: 'Chiến dịch Hồ Chí Minh non sông thu về một mối',
      theme: 'Xe tăng 390 húc đổ cổng Dinh Độc Lập ngày 30/4/1975, lá cờ Mặt trận Dân tộc Giải phóng tung bay trên nóc dinh, ngày hội non sông thống nhất rực rỡ cờ hoa.',
      script:
        'Đúng 11 giờ 30 phút ngày 30 tháng 4 năm 1975, chiếc xe tăng mang số hiệu 390 húc tung cánh cổng sắt kiên cố của Dinh Độc Lập.\n\n' +
        'Lá cờ nửa đỏ nửa xanh với ngôi sao vàng ở giữa kiêu hãnh tung bay trên nóc dinh, báo hiệu Chiến dịch Hồ Chí Minh lịch sử đã toàn thắng hoàn toàn.\n\n' +
        'Kết thúc thắng lợi cuộc kháng chiến trường kỳ 30 năm chống ngoại xâm đầy hy sinh gian khổ của toàn thể dân tộc Việt Nam anh hùng.\n\n' +
        'Non sông thu về một mối, Bắc Nam sum họp một nhà trong niềm vui ngập tràn nước mắt và khúc ca hòa bình vang vọng khắp mọi miền đất nước!',
    },
    {
      title: 'Đại thắng Bạch Đằng năm 938 của Ngô Quyền',
      theme: 'Bãi cọc gỗ lim bịt sắt nhọn cắm ngầm dưới dòng sông thủy triều cuồn cuộn',
      script:
        'Nhử thuyền giặc Nam Hán vượt qua bãi cọc lúc thủy triều lên cao bằng những chiến thuyền nhỏ nhẹ.\n\n' +
        'Khi con nước rút nhanh chảy xiết, đại quân ta phản công dữ dội khiến thuyền giặc đâm vào cọc nhọn vỡ nát tan tành.\n\n' +
        'Chấm dứt hơn một nghìn năm Bắc thuộc, mở ra kỷ nguyên độc lập tự chủ rực rỡ cho dân tộc Đại Việt.',
    },
    {
      title: 'Hịch tướng sĩ và Hào khí Đông A đời nhà Trần',
      theme: 'Tiếng thề \'Sát Thát\' khắc sâu trên cánh tay tướng sĩ trước ba lần đánh tan quân Nguyên Mông',
      script:
        '\'Dẫu cho trăm thân này phơi ngoài nội cỏ, nghìn xác này gói trong da ngựa, ta cũng cam lòng!\'.\n\n' +
        'Lời hịch hào hùng của Hưng Đạo Đại Vương Trần Quốc Tuấn thổi bùng ngọn lửa quyết chiến vào tim muôn quân.\n\n' +
        'Đánh bại đội quân xâm lược hung bạo nhất thế giới, ghi danh bản hùng ca bất tử muôn đời.',
    },
    {
      title: 'Cuộc khởi nghĩa Hai Bà Trưng cưỡi voi ra trận',
      theme: 'Tiếng trống đồng Mê Linh rền vang khắp cõi trời Nam đòi lại non sông',
      script:
        '\'Một xin rửa sạch nước thù, hai xin dựng lại nghiệp xưa họ Hùng\' - lời thề vang vọng chấn động non sông.\n\n' +
        'Hai nữ tướng anh hùng cưỡi thớt voi trắng xông pha trận mạc, quét sạch quân giặc đô hộ khỏi bờ cõi.\n\n' +
        'Biểu tượng bất khuất cho khí phách kiên cường và lòng yêu nước nồng nàn của phụ nữ Việt Nam.',
    },
    {
      title: 'Chiến dịch thần tốc Ngọc Hồi - Đống Đa mùa xuân Kỷ Dậu 1789',
      theme: 'Vua Quang Trung áo bào sạm đen khói súng tiến vào Thăng Long mùng 5 Tết',
      script:
        'Hành quân thần tốc hàng ngàn dặm trong đêm rét buốt, tổ chức ăn Tết sớm trên đường ra trận.\n\n' +
        'Trận đánh rực lửa thiêu rụi đồn lũy giặc Thanh chỉ trong vài ngày, giải phóng hoàn toàn kinh thành Thăng Long.\n\n' +
        'Đỉnh cao của nghệ thuật quân sự thần tốc, táo bạo và bất ngờ trong lịch sử quân sự thế giới.',
    },
    {
      title: 'Lý Thường Kiệt và bản tuyên ngôn độc lập Nam quốc sơn hà',
      theme: 'Bài thơ thần vang lên trong đêm tối bên chiến tuyến sông Như Nguyệt',
      script:
        '\'Nam quốc sơn hà Nam đế cư, Tiệt nhiên định phận tại thiên thư...\'.\n\n' +
        'Tiếng ngâm thơ hào sảng vang vọng từ đền thờ Trương Hống, Trương Hát làm rúng động tinh thần quân Tống xâm lược.\n\n' +
        'Bản tuyên ngôn khẳng định chủ quyền lãnh thổ thiêng liêng đầu tiên của dân tộc Việt Nam.',
    },
    {
      title: 'Huyền thoại thanh gươm Thuận Thiên của vua Lê Lợi',
      theme: 'Rùa vàng nổi lên mặt nước hồ Lục Thủy đòi lại gươm thần sau ngày toàn thắng',
      script:
        'Từ lưỡi gươm dưới đáy nước và chuôi gươm trên ngọn cây, nghĩa quân Lam Sơn đã vùng lên đánh tan giặc Minh.\n\n' +
        'Ngày thái bình lập lại, rùa thần Kim Quy ngoi lên ngậm gươm báu lặn xuống hồ sâu mang theo lời chúc phúc.\n\n' +
        'Khát vọng hòa bình muôn thuở được khắc ghi vào tên gọi Hồ Gươm - trái tim của thủ đô Hà Nội.',
    },
    {
      title: 'Vua Đinh Bộ Lĩnh và tuổi thơ cờ lau tập trận',
      theme: 'Cậu bé chăn trâu đất Hoa Lư lấy hoa lau làm cờ dẹp loạn 12 sứ quân',
      script:
        'Cưỡi trâu qua sông Hoàng Long, tay cầm bông lau chỉ huy lũ trẻ làng đánh trận giả như quân đội thực thụ.\n\n' +
        'Ý chí phi thường và tài thao lược thiên bẩm đã giúp ông thống nhất giang sơn về một mối.\n\n' +
        'Lập nên nhà nước Đại Cồ Việt độc lập, xưng Hoàng đế mở đầu kỷ nguyên quốc gia thống nhất.',
    },
    {
      title: 'Hội thề Lũng Nhai - 19 vị anh hùng Lam Sơn kết nghĩa',
      theme: 'Cắt máu ăn thề dưới gốc đa thiêng quyết tâm cứu nước cứu dân',
      script:
        'Trong hang đá tăm tối giữa rừng sâu Thanh Hóa, chén rượu hòa máu tươi gắn kết số phận những người con yêu nước.\n\n' +
        'Không phân biệt giai tầng, cùng chung một lời thề son sắt đánh đuổi ngoại xâm đến giọt máu cuối cùng.\n\n' +
        'Khởi nguồn của mười năm kháng chiến gian khổ nhưng rực rỡ chiến công của triều Lê sơ.',
    },
    {
      title: 'Trạng Trình Nguyễn Bỉnh Khiêm và những lời sấm truyền thiên tài',
      theme: 'Tầm nhìn chiến lược vượt thời đại \'Biển Đông vạn dặm giang tay giữ\'',
      script:
        'Rời chốn quan trường về am Bạch Vân mở trường dạy học, tiên đoán chính xác vận mệnh đất nước hàng trăm năm sau.\n\n' +
        'Lời khuyên \'Hoành Sơn nhất đái vạn đại dung thân\' mở đường cho dòng họ Nguyễn mở mang bờ cõi về phương Nam.\n\n' +
        'Bộ óc lỗi lạc của nhà tư tưởng, nhà triết học và nhà tiên tri vĩ đại của dân tộc.',
    },
    {
      title: 'Anh hùng áo vải Nguyễn Huệ với chiến thuyền hỏa hổ',
      theme: 'Chiến thuyền Tây Sơn cưỡi sóng biển đánh tan 5 vạn quân Xiêm tại Rạch Gầm - Xoài Mút',
      script:
        'Đoàn thuyền chiến trang bị đại bác và ống phóng hỏa hổ bất ngờ ập ra từ các nhánh rạch sông Tiền.\n\n' +
        'Bão lửa thiêu rụi hạm đội giặc chỉ trong nửa ngày, xác giặc trôi chật kín mặt sông.\n\n' +
        'Chiến thắng vang dội bảo vệ vững chắc bờ cõi biên cương phía Nam của Tổ quốc.',
    },
  ],

  // 34. Template: lofi_chill (20 mục)
  lofi_chill: [
    {
      title: 'Đêm mưa phố thị và tách trà ấm',
      theme: 'Căn phòng nhỏ gác mái, giọt mưa lăn dài trên ô kính cửa sổ, chú mèo mướp ngủ say sưa bên kệ sách và tiếng nhạc piano du dương êm dịu.',
      script:
        'Ngoài trời, cơn mưa đêm rả rích vẫn đều đặn rơi trên những mái ngói rêu phong của thành phố.\n\n' +
        'Trong căn phòng nhỏ gác mái, ánh đèn vàng ấm áp tỏa sáng bên tách trà cúc thơm dịu khẽ bốc làn khói mỏng manh.\n\n' +
        'Chú mèo lười cuộn tròn ngủ say sưa dưới chân bàn, tiếng gõ phím nhẹ nhàng hòa cùng giai điệu Lo-Fi trầm ấm du dương.\n\n' +
        'Thả lỏng đôi vai, nhắm mắt lại và để cho tâm trí của bạn được nghỉ ngơi sau một ngày dài mỏi mệt nhé.',
    },
    {
      title: '1 giờ học tập tập trung cùng tôi',
      theme: 'Đồng hồ cát lật nghiêng, ánh đèn bàn học vintage, tiếng lật trang sách sột soạt và không gian tĩnh tại loại bỏ mọi phiền nhiễu.',
      script:
        'Đặt điện thoại sang một bên, hít một hơi thật sâu và bắt đầu 60 phút tập trung cao độ cùng tôi nào.\n\n' +
        'Từng hạt cát nhỏ trôi chầm chậm qua cổ đồng hồ cát, đo đếm sự nỗ lực kiên trì của bạn trong tĩnh lặng.\n\n' +
        'Không thông báo mạng xã hội, không ồn ào vội vã, chỉ có bạn cùng những trang sách và mục tiêu phía trước.\n\n' +
        'Bạn đang tiến gần hơn tới ước mơ của mình từng chút một mỗi ngày rồi đấy!',
    },
    {
      title: 'Chuyến xe bus cuối ngày qua ô cửa kính',
      theme: 'Xe bus lướt qua những dãy đèn đường vàng hoe nhòe mờ trong mưa, dòng người tan tầm và một góc bình yên trong tai nghe.',
      script:
        'Chuyến xe bus cuối cùng của ngày lướt chầm chậm qua những con phố lung linh ánh đèn vàng le lói.\n\n' +
        'Tựa đầu vào ô cửa kính ướt nước mưa mát lạnh, ngắm nhìn dòng xe cộ hối hả ngược xuôi qua lăng kính mờ ảo.\n\n' +
        'Bật bài hát yêu thích quen thuộc trong tai nghe, mọi lo toan bộn bề của công việc dường như ở lại phía sau.\n\n' +
        'Về đến nhà rồi, bạn đã làm rất tốt ngày hôm nay rồi đấy!',
    },
    {
      title: 'Quán cà phê nhỏ góc phố vắng ngày mưa phùn',
      theme: 'Góc bàn gỗ mộc bên ô cửa kính mờ sương, tách latte nghệ thuật vẽ hình chiếc lá, tiếng mưa rơi tí tách và điệu jazz Lo-Fi ấm áp.',
      script:
        'Một buổi chiều mưa phùn lất phất, ghé vào quán cà phê nhỏ nằm nép mình nơi góc phố vắng tĩnh lặng.\n\n' +
        'Ngồi bên ô cửa kính mờ sương, chậm rãi nhấp một ngụm Latte béo ngậy đượm hương quế ấm áp xua tan đi cái lạnh đầu đông.\n\n' +
        'Tiếng đàn Piano Lo-Fi êm dịu hòa cùng tiếng mưa rơi tí tách đều đặn ngoài hiên tạo nên một bản hòa ca bình yên đến lạ kỳ.\n\n' +
        'Tạm gác lại những Deadline bộn bề ngoài kia, dành tặng cho bản thân một khoảng lặng dịu dàng để lắng nghe nhịp thở của tâm hồn.',
    },
    {
      title: 'Ngắm hoàng hôn buông xuống trên mái nhà ngói đỏ',
      theme: 'Ban công tầng thượng lúc chiều tà, bầu trời chuyển màu cam đào dịu ngọt, những cánh chim bay về tổ và tách trà đào sả thơm lừng.',
      script:
        'Thời khắc hoàng hôn buông xuống luôn mang một vẻ đẹp dịu dàng và có sức mạnh chữa lành tâm hồn kỳ diệu nhất trong ngày.\n\n' +
        'Đứng trên ban công tầng thượng ngắm nhìn bầu trời thành phố chuyển mình từ sắc vàng cam ấm áp sang màu tím than mộng mơ.\n\n' +
        'Những làn khói lam chiều nhè nhẹ bốc lên từ những mái nhà ngói đỏ cổ kính, đàn chim én chao liệng bay về tổ sau ngày dài kiếm ăn.\n\n' +
        'Hít một hơi thật sâu làn gió mát lành cuối ngày, cảm ơn bản thân vì đã luôn kiên cường nỗ lực suốt ngày hôm nay!',
    },
    {
      title: 'Giai điệu mùa thu rụng lá bên thềm cửa sổ',
      theme: 'Cửa sổ gỗ mở toang đón làn gió thu se lạnh, những chiếc lá vàng chao lượn rơi xuống trang sách mở, chú mèo mướp ngủ ngoan.',
      script:
        'Mùa thu gõ cửa bằng những cơn gió heo may se lạnh thổi bay những chiếc lá phong vàng rực rỡ qua ô cửa sổ nhỏ.\n\n' +
        'Từng chiếc lá chao nghiêng chầm chậm đáp xuống trang sách đang đọc dở như một chiếc thẻ đánh dấu trang tự nhiên của đất trời.\n\n' +
        'Chú mèo mướp cuộn tròn ngủ ngoan ngoãn trên chiếc thảm len ấm áp, khẽ rung ria mép trong giấc mơ êm đềm bình yên.\n\n' +
        'Không gian tĩnh tại và thư thái đến mức bạn có thể nghe thấy cả tiếng lá rơi xào xạc bên thềm nhà mộc mạc.',
    },
    {
      title: 'Cùng mèo cưng sưởi nắng buổi sớm mai',
      theme: 'Vạt nắng sớm chiếu qua rèm cửa voan mỏng trắng muốt, mèo cưng vươn vai lười biếng, tiếng gù gù purr purr rung rinh ấm áp.',
      script:
        'Buổi sáng thức dậy không có tiếng chuông báo thức giục giã, chỉ có vạt nắng sớm vàng ươm dịu dàng rọi qua lớp rèm cửa trắng tinh khôi.\n\n' +
        'Chú mèo cưng vươn vai lười biếng, khẽ dụi đầu vào lòng bàn tay bạn phát ra tiếng gù gù \'purr purr\' êm ái đầy tin cậy.\n\n' +
        'Pha một cốc sữa ấm, bật một bản nhạc Lo-Fi không lời nhẹ nhàng và cùng người bạn bốn chân tận hưởng khoảnh khắc đầu ngày tuyệt vời.\n\n' +
        'Những điều giản đơn nhất trong cuộc sống thường lại chính là những điều mang lại cảm giác hạnh phúc trọn vẹn nhất.',
    },
    {
      title: 'Đêm khuya đọc sách dưới ánh đèn bàn êm dịu',
      theme: 'Bàn học ngăn nắp đêm khuya, ánh đèn học màu vàng ấm, cốc nước lọc mát lạnh và hành trình phiêu lưu cùng những con chữ.',
      script:
        'Khi cả thế giới xung quanh đã chìm vào giấc ngủ say nồng, góc bàn học nhỏ lại trở thành một vương quốc riêng biệt của riêng bạn.\n\n' +
        'Ánh đèn bàn vàng dịu rọi sáng từng dòng chữ trên trang sách giấy ngà, đưa bạn bước vào những cuộc phiêu lưu kỳ thú của trí tưởng tượng.\n\n' +
        'Không tiếng ồn xe cộ, không thông báo mạng xã hội phiền toái, chỉ có sự tĩnh lặng tuyệt đối nuôi dưỡng chiều sâu của tâm hồn.\n\n' +
        'Mỗi trang sách đọc đêm nay là một hạt mầm tri thức quý giá đang âm thầm bén rễ cho tương lai của bạn.',
    },
    {
      title: 'Chuyến tàu hỏa băng qua vùng đồng quê thanh bình',
      theme: 'Góc nhìn từ cửa sổ tàu hỏa: cánh đồng lúa xanh mướt, đàn trâu thong dong gặm cỏ, bầu trời xanh ngắt và tai nghe nhạc Lo-Fi thư thái.',
      script:
        'Ngồi trên toa tàu hỏa thong thả lướt qua những vùng đồng quê thanh bình của dải đất miền Trung nắng gió.\n\n' +
        'Bên ngoài ô cửa sổ là những cánh đồng lúa xanh ngắt ngút ngàn tầm mắt, đàn trâu thong dong gặm cỏ bên dòng sông quê hiền hòa uốn lượn.\n\n' +
        'Tiếng xình xịch đều đặn của bánh sắt lăn trên đường ray hòa cùng giai điệu Lo-Fi trong chiếc tai nghe tạo nên một nhịp điệu ru êm ái.\n\n' +
        'Một chuyến hành trình trở về với thiên nhiên nguyên sơ để chữa lành và tái tạo lại nguồn năng lượng sống tích cực.',
    },
    {
      title: 'Bình minh đầu tuần và tách cà phê thơm ngát',
      theme: 'Ánh nắng ban mai rực rỡ chiếu qua ban công đầy hoa dạ yến thảo, tách cà phê bốc khói và nụ cười đón chào tuần mới đầy năng lượng.',
      script:
        'Chào đón ngày thứ Hai đầu tuần bằng một nụ cười rạng rỡ và một nguồn năng lượng sống dồi dào tươi mới nhất.\n\n' +
        'Tự tay pha một tách cà phê thơm ngát, hít hà làn hương đậm đà đánh thức mọi giác quan sau hai ngày cuối tuần nghỉ ngơi trọn vẹn.\n\n' +
        'Ngắm nhìn những bông hoa dạ yến thảo ngoài ban công đang rung rinh khoe sắc thắm đón chào ánh nắng ban mai rực rỡ.\n\n' +
        'Mỗi tuần mới là một khởi đầu mới đầy hy vọng, hãy tự tin bước ra ngoài và chinh phục những mục tiêu tuyệt vời đang chờ đón bạn!',
    },
    {
      title: 'Học bài khuya bên cửa sổ ngập ánh đèn thành phố',
      theme: 'Giai điệu lofi hip-hop êm dịu hòa cùng tiếng mưa gõ nhẹ trên kính',
      script:
        'Bật đèn bàn vàng ấm áp, đeo tai nghe và nhấp ngụm trà mật ong hoa cúc dịu ngọt.\n\n' +
        'Từng dòng chữ trôi nhẹ nhàng vào tâm trí, không còn áp lực hay tiếng ồn ào của thế giới bên ngoài.\n\n' +
        'Khoảng không gian tĩnh lặng hoàn hảo giúp bạn tập trung 100% để hoàn thành mục tiêu học tập.',
    },
    {
      title: 'Một chiều chủ nhật lười biếng cùng chú mèo tam thể',
      theme: 'Bụi nắng nhảy múa trên sàn gỗ và tiếng mèo kêu gừ gừ êm tai',
      script:
        'Nằm dài trên chiếc thảm mềm, lật từng trang truyện tranh yêu thích mà không cần để ý thời gian.\n\n' +
        'Chú mèo cuộn tròn ngủ say sưa trên đùi, hơi ấm nhỏ bé sưởi ấm cả một buổi chiều thảnh thơi.\n\n' +
        'Những giây phút sống chậm lại để chữa lành và sạc lại năng lượng cho tâm hồn sau tuần dài mỏi mệt.',
    },
    {
      title: 'Tàu điện trên cao băng qua thành phố lúc hoàng hôn',
      theme: 'Bầu trời ửng hồng tím pastel và những giai điệu guitar mộc êm ái',
      script:
        'Tựa đầu vào ô kính ngắm nhìn những mái nhà và dòng xe hối hả trôi lùi xa dần phía dưới.\n\n' +
        'Tiếng thông báo ga đến vang lên nhẹ nhàng, một ngày dài học tập và làm việc đã khép lại bình yên.\n\n' +
        'Thả lỏng mọi âu lo để đón nhận sự vỗ về ngọt ngào từ giai điệu của buổi chiều tà.',
    },
    {
      title: 'Quán cà phê nhỏ trong ngõ vắng ngày mưa phùn',
      theme: 'Mùi hương hạt cà phê mới xay quyện cùng tiếng thìa gõ lách cách vào cốc sứ',
      script:
        'Góc bàn nhỏ cạnh cửa sổ rợp bóng cây xanh, ngắm nhìn những giọt nước mưa đọng trên tán lá non.\n\n' +
        'Viết vài dòng nhật ký về những điều biết ơn giản dị đã diễn ra trong ngày hôm nay.\n\n' +
        'Sự bình yên đôi khi chỉ đơn giản là có một chốn quen để ngồi lặng yên thưởng thức tách cà phê ấm.',
    },
    {
      title: 'Dạo bước ven hồ Tây một tối mùa thu lộng gió',
      theme: 'Hương hoa sữa thoang thoảng trong gió lạnh và mặt nước hồ lăn tăn gợn sóng',
      script:
        'Cắm tai nghe nghe một bản nhạc lofi quen thuộc, kéo cao cổ áo len bước chậm trên con đường quen.\n\n' +
        'Ánh đèn đường vàng ấm áp soi bóng xuống mặt nước mênh mông, xa xa là tiếng còi xe vọng lại như một giấc mơ.\n\n' +
        'Hà Nội vào thu luôn dịu dàng và mang lại cảm giác xao xuyến khó tả đến thế.',
    },
    {
      title: 'Đọc sách bên ban công ngập tràn cây xanh',
      theme: 'Tiếng gió xào xạc qua tán lá trầu bà và ly nước chanh đá mát lạnh',
      script:
        'Một chiếc ghế mây êm ái, một cuốn tiểu thuyết hay và bóng râm dịu mát của khu vườn nhỏ trên cao.\n\n' +
        'Tạm quên đi những thông báo điện thoại dồn dập, để tâm trí phiêu lưu qua những vùng đất diệu kỳ của ngôn từ.\n\n' +
        'Khoảnh khắc nuôi dưỡng tâm hồn quý giá trong ngày nghỉ cuối tuần thảnh thơi.',
    },
    {
      title: 'Căn phòng gác mái và ngọn nến thơm hương gỗ tuyết tùng',
      theme: 'Tiếng lửa nến tí tách và bản nhạc piano lofi chậm rãi du dương',
      script:
        'Hương thơm ấm áp của gỗ thông và quế lan tỏa khắp căn phòng nhỏ ấm cúng.\n\n' +
        'Thả lỏng các khớp cơ, nhắm mắt lại và hít thở sâu để chuẩn bị bước vào giấc ngủ an lành.\n\n' +
        'Khép lại một ngày bận rộn bằng sự tĩnh lặng và tình yêu thương dành cho chính bản thân mình.',
    },
    {
      title: 'Chuyến xe buýt đêm vắng người đi qua cầu Long Biên',
      theme: 'Ánh đèn vàng cổ kính rọi xuống những nhịp cầu sắt cổ kính và dòng sông Hồng êm đềm',
      script:
        'Ngồi ở hàng ghế cuối cùng, ngắm nhìn ánh sáng đèn đường nhạt nhòa qua khung cửa sổ mờ sương.\n\n' +
        'Thành phố về đêm khoác lên mình vẻ trầm mặc, khác hẳn sự huyên náo tấp nập ban ngày.\n\n' +
        'Một khoảng lặng quý giá để nhìn lại chặng đường mình đã đi qua và mỉm cười nhẹ nhõm.',
    },
    {
      title: 'Vẽ tranh màu nước tĩnh vật hoa cúc họa mi',
      theme: 'Tiếng cọ rửa nhẹ nhàng trong lọ thủy tinh và màu loang êm dịu trên giấy nhám',
      script:
        'Từng vệt màu nước xanh lam và trắng tinh khôi hòa quyện mềm mại tạo nên những cánh hoa mong manh.\n\n' +
        'Không cần phải vẽ hoàn hảo, chỉ cần tận hưởng cảm giác tự do khi đầu cọ lướt êm ái trên mặt giấy.\n\n' +
        'Nghệ thuật là liều thuốc chữa lành kỳ diệu giúp giải tỏa mọi căng thẳng tinh thần.',
    },
    {
      title: 'Ngắm sao đêm từ trên mái nhà thôn quê yên bình',
      theme: 'Tiếng dế mèn rả rích trong bụi cỏ và dải Ngân Hà lấp lánh trên nền trời nhung đen',
      script:
        'Nằm ngửa trên mái ngói ấm áp, đếm từng vì sao sa lấp lánh giữa vũ trụ bao la vô tận.\n\n' +
        'Làn gió đêm mát rượi thổi qua tóc, mang theo hương thơm ngai ngái của cỏ dại và lúa chín đầu mùa.\n\n' +
        'Cảm nhận sự nhỏ bé của mình trước thiên nhiên kỳ vĩ và tìm thấy sự an lạc thuần khiết trong tim.',
    },
  ],

  // 35. Template: finance_crypto (20 mục)
  finance_crypto: [
    {
      title: 'Hiểu về lạm phát trong 60 giây',
      theme: 'Biểu đồ trực quan sức mua của đồng tiền: 100 ngàn mua được gì năm 2010 vs 2026, tại sao để tiền nằm im trong két là đang nghèo đi.',
      script:
        'Tại sao bạn làm việc chăm chỉ hơn, lương cao hơn nhưng cảm giác tiền vẫn thiếu thốn? Thủ phạm chính là con quái vật vô hình này: Lạm phát.\n\n' +
        '10 năm trước, 100 ngàn có thể mua được 5 bát phở ngon. Nhưng hôm nay, con số đó chỉ còn vỏn vẹn 2 bát.\n\n' +
        'Tiền mặt để im trong két sắt không sinh lời sẽ bị bốc hơi sức mua từ 4 đến 7% mỗi năm một cách âm thầm.\n\n' +
        'Học cách đầu tư vào các tài sản có giá trị gia tăng như cổ phiếu doanh nghiệp tốt, bất động sản hay vàng để bảo vệ thành quả lao động của bạn!',
    },
    {
      title: 'Quy tắc 72: Bao lâu tài sản nhân đôi?',
      theme: 'Công thức toán học tài chính kỳ diệu của Einstein: lấy 72 chia cho lãi suất hàng năm để biết chính xác số năm tiền nhân đôi.',
      script:
        'Einstein từng gọi lãi kép là kỳ quan thứ 8 của thế giới. Và đây là công thức đơn giản nhất để bạn làm chủ nó: Quy tắc 72.\n\n' +
        'Chỉ cần lấy số 72 chia cho tỷ suất lợi nhuận đầu tư hàng năm, bạn sẽ biết chính xác sau bao nhiêu năm số vốn của mình tăng gấp đôi.\n\n' +
        'Ví dụ: Gửi tiết kiệm 6%/năm, bạn mất 12 năm. Nhưng nếu đầu tư danh mục tăng trưởng 12%/năm, bạn chỉ mất 6 năm để nhân đôi tài sản.\n\n' +
        'Thời gian chính là đồng minh lớn nhất của nhà đầu tư thông minh — hãy bắt đầu càng sớm càng tốt!',
    },
    {
      title: 'Cách đọc biểu đồ nến Nhật cho người mới',
      theme: 'Màn hình giao dịch FinTech: thân nến, bóng nến trên dưới, nến xanh phe mua làm chủ thế trận, nến đỏ phe bán áp đảo.',
      script:
        'Nhìn vào biểu đồ nến thấy hoa mắt chóng mặt? Đây là cách hiểu bản chất cây nến Nhật chỉ trong 1 phút.\n\n' +
        'Mỗi cây nến tóm tắt cuộc chiến giữa phe mua và phe bán trong một khung thời gian: Nến xanh nghĩa là giá đóng cửa cao hơn giá mở cửa — phe mua thắng thế.\n\n' +
        'Nến đỏ là phe bán ép giá xuống thấp hơn. Phần bóng nến phía trên và dưới thể hiện mức giá cao nhất và thấp nhất mà hai phe đã chạm tới.\n\n' +
        'Hiểu được hành động giá, bạn sẽ không còn mua đỉnh bán đáy theo cảm xúc đám đông!',
    },
    {
      title: '4 cấp độ tự do tài chính và cách đạt được',
      theme: 'Tháp phân tầng tài chính FinTech: An toàn tài chính (quỹ 6 tháng) → Độc lập tài chính → Tự do tài chính → Dư dả tài chính đỉnh cao.',
      script:
        'Tự do tài chính không phải là giấc mơ viển vông nếu bạn hiểu rõ 4 cấp độ cụ thể trên con đường tích lũy tài sản.\n\n' +
        'Cấp độ 1: An toàn tài chính — khi bạn có quỹ dự phòng khẩn cấp đủ chi trả sinh hoạt phí tối thiểu từ 6 đến 12 tháng không cần đi làm.\n\n' +
        'Cấp độ 2: Độc lập tài chính — thu nhập thụ động từ đầu tư đủ bù đắp toàn bộ chi phí sinh hoạt cơ bản hàng tháng.\n\n' +
        'Cấp độ 3: Tự do tài chính thực sự — dòng tiền đầu tư đủ chi trả cho lối sống thoải mái theo mong muốn mà không phải lo nghĩ về giá tiền!\n\n' +
        'Bạn đang đứng ở bậc thang nào và mục tiêu tiếp theo của bạn là gì?',
    },
    {
      title: 'Bẫy tâm lý FOMO và cách kiểm soát khi giao dịch',
      theme: 'Biểu đồ nến xanh tăng vọt hình parabol, tâm lý hưng phấn tột độ trước khi sập giá, quy tắc kỷ luật cắt lỗ Stop-Loss và chốt lời Take-Profit.',
      script:
        'Hội chứng sợ bỏ lỡ cơ hội FOMO là cái bẫy tâm lý nguy hiểm nhất đã chôn vùi tài khoản của hàng triệu nhà đầu tư mới trên thị trường tài chính.\n\n' +
        'Khi thấy một cổ phiếu hay đồng coin tăng giá phi mã và khắp các hội nhóm đều khoe lãi, bạn bèn vội vã vay mượn tiền nhảy vào mua ngay đỉnh ngọn tre.\n\n' +
        'Để chiến thắng bẫy tâm lý này, nhà đầu tư chuyên nghiệp luôn tuân thủ nguyên tắc kỷ luật thép: Không bao giờ mua đuổi giá xanh rực rỡ!\n\n' +
        'Lên sẵn kế hoạch giao dịch từ trước: điểm vào lệnh, ngưỡng cắt lỗ Stop-Loss tối đa 7% và mục tiêu chốt lời rõ ràng trước khi bấm nút Mua!',
    },
    {
      title: 'Quỹ dự phòng khẩn cấp: Chiếc phao cứu sinh gia đình',
      theme: 'Mô phỏng đồ họa tài chính: tấm khiên bảo vệ tài sản gia đình trước các rủi ro mất việc, ốm đau, biến cố kinh tế bất ngờ.',
      script:
        'Trước khi nghĩ đến việc đầu tư sinh lời làm giàu, điều đầu tiên bạn bắt buộc phải làm là xây dựng một chiếc phao cứu sinh tài chính vững chắc.\n\n' +
        'Quỹ dự phòng khẩn cấp là khoản tiền mặt tương đương từ 3 đến 6 tháng chi phí sinh hoạt tối thiểu của cả gia đình bạn.\n\n' +
        'Khoản tiền này tuyệt đối không được mang đi đầu tư mạo hiểm chứng khoán hay đất đai, mà phải gửi ở những nơi thanh khoản cao có thể rút ra ngay lập tức trong 24 giờ.\n\n' +
        'Nó là tấm lá chắn bảo vệ gia đình bạn bình an vượt qua những biến cố bất ngờ: mất việc làm, ốm đau bệnh tật hay khủng hoảng kinh tế toàn cầu.',
    },
    {
      title: 'So sánh đầu tư Vàng vs Bất động sản vs Cổ phiếu',
      theme: 'Biểu đồ so sánh hiệu suất sinh lời và tính thanh khoản của 3 kênh tài sản lớn trong 30 năm qua tại thị trường Việt Nam.',
      script:
        'Nên giữ vàng, mua đất hay đầu tư vào thị trường chứng khoán để tài sản sinh sôi bền vững nhất trong dài hạn?\n\n' +
        'Vàng là kênh trú ẩn lạm phát số một trong thời kỳ khủng hoảng chiến tranh, nhưng hiệu suất sinh lời thực tế trong 30 năm chỉ ở mức trung bình khoảng 8%/năm.\n\n' +
        'Bất động sản mang lại đòn bẩy tài chính cực lớn và khả năng nhân nhiều lần tài sản nhưng đòi hỏi vốn lớn và tính thanh khoản rất chậm khi thị trường đóng băng.\n\n' +
        'Cổ phiếu của các doanh nghiệp đầu ngành là kênh có tỷ suất sinh lời cao nhất trung bình 12 đến 15%/năm và thanh khoản rút tiền nhanh nhất chỉ sau 2 ngày giao dịch!',
    },
    {
      title: 'Quản lý dòng tiền cá nhân bằng phương pháp 6 chiếc lọ',
      theme: 'Đồ họa 6 chiếc lọ thông minh: 55% Nhu cầu thiết yếu, 10% Tiết kiệm dài hạn, 10% Giáo dục, 10% Đầu tư tự do, 10% Hưởng thụ, 5% Cho đi.',
      script:
        'Phương pháp quản lý tài chính kinh điển 6 chiếc lọ của T. Harv Eker đã giúp hàng triệu người thoát khỏi cảnh nợ nần và làm chủ dòng tiền cá nhân.\n\n' +
        'Ngay khi tiền lương vừa về tài khoản, hãy tự động phân bổ ngay theo tỷ lệ vàng: 55% cho chiếc lọ nhu cầu thiết yếu hàng ngày.\n\n' +
        '10% cho chiếc lọ tự do tài chính đầu tư sinh lời tuyệt đối không tiêu; 10% cho chiếc lọ tiết kiệm dài hạn mua nhà mua xe.\n\n' +
        '10% cho chiếc lọ học tập nâng cao giá trị bản thân, 10% cho chiếc lọ hưởng thụ chăm sóc cảm xúc và 5% dành cho chiếc lọ từ thiện giúp đỡ cộng đồng!',
    },
    {
      title: 'Bí quyết chọn cổ phiếu giá trị của Warren Buffett',
      theme: 'Mô hình con hào kinh tế Economic Moat: lợi thế cạnh tranh độc quyền, ban lãnh đạo liêm chính và định giá biên an toàn Margin of Safety.',
      script:
        'Huyền thoại đầu tư Warren Buffett đã trở thành một trong những người giàu nhất hành tinh nhờ triết lý đầu tư giá trị kiên định suốt 7 thập kỷ.\n\n' +
        'Tiêu chí số 1 của ông là tìm kiếm những doanh nghiệp sở hữu \'Con hào kinh tế\' rộng lớn: lợi thế cạnh tranh độc quyền về thương hiệu, chi phí sản xuất thấp hoặc hiệu ứng mạng lưới không thể sao chép.\n\n' +
        'Tiêu chí số 2: Đội ngũ ban lãnh đạo tài năng, liêm chính và luôn đặt lợi ích của cổ đông lên hàng đầu.\n\n' +
        'Và tiêu chí số 3: Chỉ mua cổ phiếu khi thị trường hoảng loạn bán tháo, tạo ra mức định giá có \'Biên an toàn\' chiết khấu sâu từ 20 đến 30% so với giá trị thực!',
    },
    {
      title: 'Chiến lược trung bình giá DCA: Đầu tư an nhàn sinh lời',
      theme: 'Đồ họa mua tích sản hàng tháng Dollar-Cost Averaging: không cần canh đỉnh đáy, tự động hóa đầu tư và tận hưởng sức mạnh lãi kép.',
      script:
        'Bạn không có thời gian theo dõi bảng điện tử xanh đỏ cả ngày nhưng vẫn muốn tài sản tăng trưởng đều đặn? Chiến lược DCA là giải pháp hoàn hảo nhất.\n\n' +
        'Thay vì dồn toàn bộ vốn mua một lần ở đỉnh, bạn chia nhỏ số tiền và đầu tư đều đặn vào một ngày cố định hàng tháng bất kể thị trường lên hay xuống.\n\n' +
        'Khi thị trường giảm giá, bạn sẽ tự động mua được số lượng cổ phiếu nhiều hơn; khi thị trường tăng giá, bạn hưởng trọn vẹn thành quả tăng trưởng.\n\n' +
        'Loại bỏ hoàn toàn yếu tố cảm xúc hoảng loạn, biến thời gian thành đồng minh lớn nhất để xây dựng gia tài thịnh vượng trong dài hạn!',
    },
    {
      title: 'Giải mã chu kỳ Halving của Bitcoin và tác động thị trường',
      theme: 'Cơ chế giảm một nửa phần thưởng khối cứ mỗi 4 năm và bài toán cung cầu',
      script:
        'Sau mỗi đợt Halving, lượng phát hành Bitcoin mới ra thị trường bị siết chặt đúng 50%.\n\n' +
        'Lịch sử cho thấy chu kỳ tăng trưởng parabol thường bùng nổ từ 6 đến 18 tháng sau sự kiện này.\n\n' +
        'Hiểu rõ quy luật kinh tế học vĩ mô đằng sau để xây dựng chiến lược tích sản DCA thông minh.',
    },
    {
      title: 'Bẫy tâm lý FOMO và FUD của các nhà đầu tư F0',
      theme: 'Tại sao đa số người mới mua ở đỉnh và cắt lỗ ngay đáy thị trường?',
      script:
        'Khi thị trường xanh ngút ngàn và ai cũng khoe lãi trên mạng xã hội, đó là lúc lòng tham Fomo lên đến đỉnh điểm.\n\n' +
        'Và khi tin tức tiêu cực Fud ngập tràn khiến giá lao dốc, nỗi sợ hãi lại thôi thúc bạn bán tháo tài sản giá rẻ.\n\n' +
        'Nhà đầu tư lão luyện luôn đi ngược đám đông: tham lam khi người khác sợ hãi và sợ hãi khi người khác tham lam.',
    },
    {
      title: 'Nguyên tắc quản lý vốn 50/30/20 cho người trẻ',
      theme: 'Phân bổ dòng tiền lương hàng tháng để đạt tự do tài chính tuổi 35',
      script:
        '50% cho nhu cầu thiết yếu như nhà ở, ăn uống; 30% cho sở thích và tái tạo sức lao động.\n\n' +
        '20% còn lại bắt buộc phải trích thẳng vào quỹ đầu tư tích sản cổ phiếu hoặc gửi tiết kiệm ngay khi nhận lương.\n\n' +
        'Kỷ luật tài chính hôm nay là chiếc vé mua lại sự tự do và an tâm cho tương lai ngày mai.',
    },
    {
      title: 'Bảo mật ví lạnh - Đừng để mất tài sản số chỉ trong 1 click',
      theme: 'Tầm quan trọng của 24 ký tự khôi phục Seed Phrase và cạm bẫy Phishing',
      script:
        '\'Not your keys, not your coins\' - để tiền trên sàn giao dịch luôn tiềm ẩn rủi ro phá sản hoặc bị hack.\n\n' +
        'Tuyệt đối không bao giờ chụp ảnh hay lưu 24 từ khóa bảo mật lên điện thoại hoặc đám mây Cloud.\n\n' +
        'Hãy ghi chép ra sổ tay kim loại chống cháy và cất giữ ở nơi an toàn tuyệt đối.',
    },
    {
      title: 'Chiến lược đầu tư DCA - Trung bình giá đều đặn',
      theme: 'Cách tích lũy tài sản thụ động mà không cần canh bảng điện tử mỗi ngày',
      script:
        'Dù thị trường tăng hay giảm, bạn trích đều đặn một khoản tiền cố định vào một ngày cố định mỗi tháng.\n\n' +
        'Chiến lược này giúp bạn mua được nhiều tài sản hơn khi giá rẻ và tránh được áp lực bắt đáy đoán đỉnh.\n\n' +
        'Cách làm đơn giản, nhàn hạ nhưng đem lại tỷ suất sinh lời vượt trội trong dài hạn từ 3 đến 5 năm.',
    },
    {
      title: 'Hiểu đúng về Lạm phát và cách bảo vệ tài sản của bạn',
      theme: 'Vì sao tiền mặt để trong két sắt đang bốc hơi âm thầm 5-7% mỗi năm?',
      script:
        'Bát phở 10 năm trước có giá 15 nghìn, hôm nay đã lên 50 nghìn đồng - đó chính là sức tàn phá của lạm phát.\n\n' +
        'Nếu chỉ gửi tiết kiệm ngân hàng với lãi suất thấp, giá trị thực tế của tiền sẽ bị xói mòn theo thời gian.\n\n' +
        'Học cách phân bổ vốn vào các tài sản chống lạm phát như vàng, bất động sản và cổ phiếu doanh nghiệp tốt.',
    },
    {
      title: 'Phân tích cơ bản FA - Cách chọn một đồng Coin có giá trị thực',
      theme: 'Đánh giá Tokenomics, đội ngũ phát triển và doanh thu thực của dự án Web3',
      script:
        'Đừng mua một đồng token chỉ vì nó có logo con chó dễ thương hay được người nổi tiếng quảng cáo rầm rộ.\n\n' +
        'Hãy xem xét dự án đó có giải quyết bài toán thực tế nào không? Doanh thu đến từ đâu và lịch mở khóa token thế nào?\n\n' +
        'Đầu tư vào giá trị cốt lõi thay vì đánh bạc theo những cơn sốt đầu cơ ngắn hạn.',
    },
    {
      title: 'Xây dựng Quỹ khẩn cấp 6 tháng chi phí sinh hoạt',
      theme: 'Tấm đệm đỡ an toàn bảo vệ gia đình bạn trước mọi biến cố bất ngờ',
      script:
        'Mất việc làm, ốm đau hay suy thoái kinh tế có thể ập đến bất cứ lúc nào mà không báo trước.\n\n' +
        'Quỹ khẩn cấp bằng 6 tháng chi phí sinh hoạt gửi ngân hàng linh hoạt sẽ giúp bạn không phải bán tháo tài sản khi thị trường sụp đổ.\n\n' +
        'Sự bình tâm trong tâm lý chính là vũ khí mạnh nhất của một nhà đầu tư thông thái.',
    },
    {
      title: 'Quản trị rủi ro - Đặt lệnh Cắt lỗ Stop-loss để tồn tại',
      theme: 'Bảo vệ vốn là quy tắc số một trước khi nghĩ đến việc kiếm lợi nhuận',
      script:
        'Một khoản lỗ 50% sẽ đòi hỏi bạn phải kiếm lại 100% lợi nhuận chỉ để hòa vốn ban đầu.\n\n' +
        'Luôn xác định rõ mức cắt lỗ tối đa 5-7% cho mỗi vị thế giao dịch trước khi bấm nút Mua.\n\n' +
        'Thừa nhận sai lầm và cắt lỗ sớm chính là hành động dũng cảm nhất để giữ lại cơ hội làm lại ván mới.',
    },
    {
      title: 'Thu nhập thụ động từ Cổ tức doanh nghiệp dẫn đầu',
      theme: 'Hành trình xây dựng cỗ máy in tiền tự động từ thị trường chứng khoán',
      script:
        'Sở hữu cổ phần của các tập đoàn sữa, điện lực hay bán lẻ đầu ngành với dòng tiền kinh doanh dồi dào.\n\n' +
        'Số tiền cổ tức tiền mặt đều đặn hàng năm được tái đầu tư để tạo nên sức mạnh lãi kép thần kỳ.\n\n' +
        'Biến những đồng tiền mồ hôi nước mắt thành những người thợ chăm chỉ làm việc cho bạn 24/7.',
    },
  ],

  // 36. Template: medical_health (20 mục)
  medical_health: [
    {
      title: '3 dấu hiệu gan đang cầu cứu mỗi đêm',
      theme: 'Bác sĩ chuyên khoa phân tích: thường xuyên tỉnh giấc lúc 1–3h sáng, hơi thở có mùi dù đánh răng kỹ, nổi mụn sần vùng trán.',
      script:
        'Gan là cơ quan duy nhất không có dây thần kinh cảm giác đau, nên khi phát bệnh thường đã ở giai đoạn muộn.\n\n' +
        'Hãy chú ý 3 tín hiệu cảnh báo này: Thứ nhất, liên tục thức giấc vào khung giờ 1 đến 3 giờ sáng — đây là thời điểm gan lọc độc tố mạnh nhất.\n\n' +
        'Thứ hai, hơi thở có mùi chua hôi dù vệ sinh răng miệng rất sạch sẽ do độc tố tích tụ chuyển hóa kém.\n\n' +
        'Thứ ba, mắt vàng nhẹ hoặc quầng thâm sạm dù ngủ đủ giấc. Hãy hạn chế bia rượu, đồ chiên rán và uống đủ nước để lá gan được phục hồi kịp thời!',
    },
    {
      title: '4 thời điểm vàng uống nước bảo vệ tim thận',
      theme: 'Mô phỏng 3D cơ thể người: 1 cốc nước ấm sau khi ngủ dậy loãng máu, 1 cốc trước bữa ăn, 1 cốc trước khi tắm và 1 ngụm nhỏ trước khi ngủ.',
      script:
        'Đừng đợi đến khi khát khô cổ họng mới uống nước. Uống nước đúng thời điểm là liều thuốc bổ rẻ nhất cho tim mạch và thận.\n\n' +
        'Thời điểm 1: Một ly nước ấm ngay sau khi thức dậy để đánh thức hệ tiêu hóa và làm loãng độ nhớt của máu sau đêm dài.\n\n' +
        'Thời điểm 2: Một ly trước bữa ăn 30 phút giúp dạ dày tiết enzym tiêu hóa tốt hơn.\n\n' +
        'Thời điểm 3: Một ly trước khi tắm giúp ổn định huyết áp, tránh sốc nhiệt.\n\n' +
        'Và thời điểm 4: Vài ngụm nước nhỏ trước khi đi ngủ giúp phòng ngừa nguy cơ đột quỵ lúc rạng sáng!',
    },
    {
      title: 'Sửa tật gù lưng cổ rùa của dân văn phòng',
      theme: 'Minh họa góc nghiêng cột sống khi dùng smartphone: đầu cúi 60 độ tương đương cổ gánh tải trọng 27kg. Hướng dẫn 2 bài tập giãn cơ cổ ngực.',
      script:
        'Bạn có đang vừa cúi gằm mặt vào màn hình điện thoại vừa xem video này không? Hãy ngẩng đầu lên ngay!\n\n' +
        'Khi bạn cúi đầu một góc 60 độ, các đốt sống cổ của bạn phải gánh chịu một áp lực tương đương một bao gạo nặng 27kg đè lên.\n\n' +
        'Hậu quả là cổ rùa nhô ra trước, gù lưng, đau mỏi vai gáy kinh niên và giảm lưu thông máu lên não.\n\n' +
        'Hãy thực hiện ngay động tác này: Ép chặt hai bả vai ra sau, cằm thu nhẹ về sau cổ giữ trong 10 giây, lặp lại 5 lần mỗi giờ làm việc!',
    },
    {
      title: 'Ăn gì để hạ đường huyết tự nhiên không lo biến chứng?',
      theme: 'Bác sĩ dinh dưỡng tư vấn: bổ sung chất xơ hòa tan từ yến mạch, hạt chia, khổ qua rừng và quy tắc ăn rau trước khi ăn cơm tinh bột.',
      script:
        'Bệnh tiểu đường tuýp 2 đang ngày càng trẻ hóa nhưng hoàn toàn có thể kiểm soát và đẩy lùi nhờ chế độ ăn uống khoa học hàng ngày.\n\n' +
        'Áp dụng ngay quy tắc vàng về thứ tự ăn trong bữa ăn: Ăn toàn bộ phần rau xanh trước để chất xơ tạo thành một lớp màng lưới trong ruột làm chậm quá trình hấp thụ đường.\n\n' +
        'Sau đó mới ăn đến phần chất đạm thịt cá và cuối cùng mới ăn đến cơm và tinh bột.\n\n' +
        'Bổ sung thêm các thực phẩm giàu chất xơ hòa tan như hạt chia, yến mạch và mướp đắng giúp ổn định chỉ số đường huyết sau ăn cực kỳ hiệu quả mà không làm tăng gánh nặng cho tuyến tụy!',
    },
    {
      title: 'Bí quyết ngủ sâu giấc không mộng mị cho người mất ngủ',
      theme: 'Phòng ngủ tối giản yên tĩnh, liệu pháp ánh sáng đỏ ấm, bổ sung magie glycinate và kỹ thuật thở 4-7-8 đưa não bộ vào trạng thái ngủ sâu.',
      script:
        'Mất ngủ kinh niên, trằn trọc suốt đêm và thức dậy với cơ thể nặng trĩu mệt mỏi là nỗi ám ảnh của hàng triệu người hiện đại.\n\n' +
        'Hãy thử ngay kỹ thuật thở 4-7-8 của chuyên gia thần kinh học: Hít vào bằng mũi trong 4 giây, nín thở giữ hơi trong 7 giây và thở ra từ từ bằng miệng trong 8 giây.\n\n' +
        'Bài tập này giúp kích hoạt hệ thần kinh phó giao cảm, hạ nhịp tim và huyết áp đưa cơ thể vào trạng thái thư giãn sâu chỉ sau 4 chu kỳ thở.\n\n' +
        'Kết hợp tắt toàn bộ ánh sáng xanh điện thoại trước khi ngủ 1 tiếng và bổ sung khoáng chất Magiê giúp cơ bắp thả lỏng tuyệt đối!',
    },
    {
      title: 'Dấu hiệu cảnh báo sớm đột quỵ não FAST cần nhớ kỹ',
      theme: 'Đồ họa y khoa quy tắc FAST: F (Face - lệch mặt), A (Arm - yếu tay), S (Speech - nói ngọng), T (Time - giờ vàng cấp cứu 3-4.5 tiếng).',
      script:
        'Mỗi phút trôi qua khi cơn đột quỵ não xảy ra, có khoảng 2 triệu tế bào não sẽ chết đi vĩnh viễn không thể phục hồi.\n\n' +
        'Thuộc lòng quy tắc vàng FAST để cứu sống người thân trong gang tấc: Chữ F - Face: Yêu cầu người bệnh cười, nếu một bên mặt bị méo xệ hoặc khóe miệng lệch bất thường.\n\n' +
        'Chữ A - Arm: Yêu cầu giơ hai tay lên cao, nếu một bên tay bị yếu liệt buông thõng xuống.\n\n' +
        'Chữ S - Speech: Yêu cầu nói một câu đơn giản, nếu giọng nói bị ngọng líu nhịu không rõ tiếng.\n\n' +
        'Và chữ T - Time: Lập tức gọi cấp cứu 115 đưa ngay đến bệnh viện có chuyên khoa đột quỵ trong khung giờ vàng 3 đến 4.5 tiếng đầu tiên!',
    },
    {
      title: 'Cách xử lý đúng khi bị bỏng nước sôi tránh sẹo',
      theme: 'Bác sĩ hướng dẫn sơ cứu: ngâm xả vết bỏng dưới vòi nước mát chảy nhẹ 15-20 phút, tuyệt đối không bôi kem đánh răng hay mỡ trăn.',
      script:
        'Khi bản thân hoặc người nhà vô tình bị bỏng nước sôi hay bỏng dầu mỡ, sai lầm sơ cứu có thể để lại di chứng sẹo co rút vĩnh viễn.\n\n' +
        'Tuyệt đối KHÔNG bôi kem đánh răng, mỡ trăn, nước mắm hay lòng trắng trứng gà lên vết bỏng vì sẽ gây nhiễm trùng hoại tử da cực kỳ nguy hiểm.\n\n' +
        'Việc đầu tiên và quan trọng nhất: Đưa ngay vùng da bị bỏng dưới vòi nước máy mát chảy nhẹ nhàng liên tục trong suốt 15 đến 20 phút.\n\n' +
        'Nước mát sẽ nhanh chóng hạ nhiệt độ vùng mô tổn thương, giảm đau rát tức thì và ngăn chặn tổn thương ăn sâu vào các lớp tế bào đáy bên dưới!',
    },
    {
      title: 'Tại sao ăn mặn lại âm thầm tàn phá huyết áp và thận?',
      theme: 'Mô hình sinh học 3D: ion Natri giữ nước làm tăng thể tích lòng mạch máu, tăng áp lực lên cầu thận gây suy thận và tai biến mạch máu não.',
      script:
        'Việt Nam là một trong những quốc gia có lượng tiêu thụ muối trung bình hàng ngày cao gấp đôi so với khuyến cáo của Tổ chức Y tế Thế giới WHO.\n\n' +
        'Khi bạn ăn quá nhiều muối, nồng độ ion Natri trong máu tăng vọt khiến cơ thể buộc phải giữ nước lại để cân bằng nồng độ thẩm thấu.\n\n' +
        'Lượng nước thừa làm tăng thể tích tuần hoàn trong lòng mạch, tạo áp lực khủng khiếp lên thành mạch máu dẫn đến căn bệnh huyết áp cao âm thầm.\n\n' +
        'Các cầu thận phải làm việc quá tải liên tục để lọc thải lượng muối thừa, lâu dần dẫn đến xơ hóa cầu thận và suy thận mạn tính không thể hồi phục!',
    },
    {
      title: 'Thải độc cơ thể tự nhiên: Đừng tin trà giảm cân',
      theme: 'Bác sĩ giải thích chức năng giải độc kỳ diệu của gan và thận: uống đủ 2 lít nước lọc mỗi ngày, ăn nhiều rau họ cải và ngủ trước 23h.',
      script:
        'Trên mạng xã hội đang tràn ngập những lời quảng cáo đường mật về các loại trà detox, nước ép nhịn ăn thanh lọc cơ thể trong vài ngày.\n\n' +
        'Là một bác sĩ, tôi khẳng định với bạn: không có bất kỳ loại trà hay thực phẩm chức năng nào có thể thay thế được chức năng giải độc tự nhiên của cơ thể.\n\n' +
        'Gan và thận của bạn chính là hai cỗ máy thải độc xịn sò và hoàn hảo nhất mà tạo hóa đã ban tặng.\n\n' +
        'Cách duy nhất để giúp gan thận thải độc hiệu quả là: uống đủ nước lọc mỗi ngày, hạn chế bia rượu đồ uống có cồn, ăn nhiều rau họ cải và đi ngủ trước 23 giờ đêm!',
    },
    {
      title: 'Cẩm nang sơ cứu hóc dị vật Heimlich cho trẻ nhỏ',
      theme: 'Mô hình thực hành thủ thuật Heimlich: tư thế vỗ lưng ấn ngực cho trẻ dưới 1 tuổi và tư thế ôm bụng giật mạnh lên trên cho người lớn.',
      script:
        'Hóc dị vật đường thở là tai nạn sinh hoạt nguy hiểm hàng đầu có thể cướp đi tính mạng của trẻ nhỏ chỉ sau 3 đến 5 phút thiếu oxy não.\n\n' +
        'Với trẻ dưới 1 tuổi: Đặt trẻ nằm sấp trên cẳng tay dốc đầu xuống dưới, dùng gót bàn tay vỗ dứt khoát 5 lần vào lưng giữa hai bả vai.\n\n' +
        'Nếu dị vật chưa ra, lật ngửa trẻ lại và dùng hai ngón tay ấn mạnh 5 lần vào điểm giữa ngực dưới xương ức.\n\n' +
        'Với trẻ lớn và người lớn: Đứng sau lưng, ôm vòng qua eo, đặt nắm đấm tay ngay trên rốn và giật mạnh theo hướng từ trước ra sau và từ dưới lên trên để tống dị vật ra ngoài!',
    },
    {
      title: 'Dấu hiệu cảnh báo sớm bệnh đột quỵ F.A.S.T',
      theme: 'Nhận biết 4 dấu hiệu vàng để kịp thời cứu sống người thân trong 3 giờ đầu',
      script:
        'Face: Mặt mất cân đối, méo miệng khi cười. Arm: Một bên tay yếu, không nâng lên được.\n\n' +
        'Speech: Nói ngọng, phát âm khó khăn hoặc ú ớ không thành tiếng. Time: Gọi cấp cứu 115 ngay lập tức!\n\n' +
        'Mỗi phút trôi qua, 2 triệu tế bào não sẽ chết đi vĩnh viễn nếu không được tái thông mạch máu kịp thời.',
    },
    {
      title: 'Sự thật về Uống 2 lít nước mỗi ngày đúng cách',
      theme: 'Khoa học về bổ sung nước cho tế bào thay vì đi tiểu liên tục',
      script:
        'Uống ừng ực cả cốc nước lớn một lúc chỉ làm thận quá tải và nước bị đào thải ngay ra ngoài.\n\n' +
        'Hãy uống từng ngụm nhỏ, ngồi uống thay vì đứng và phân bổ đều đặn từ sáng đến tối.\n\n' +
        'Bổ sung thêm một nhúm muối khoáng nhỏ vào buổi sáng giúp tế bào hấp thụ nước tối ưu nhất.',
    },
    {
      title: 'Cột sống cổ kêu cứu vì thói quen cúi đầu dùng điện thoại',
      theme: 'Hội chứng Text Neck khiến cổ chịu tải trọng tương đương 27kg',
      script:
        'Khi cúi đầu một góc 60 độ để lướt mạng xã hội, đốt sống cổ của bạn phải chịu áp lực gấp 5 lần bình thường.\n\n' +
        'Hậu quả là thoái hóa sớm, thoát vị đĩa đệm và những cơn đau nửa đầu vai gáy dai dẳng.\n\n' +
        'Hãy nâng điện thoại ngang tầm mắt và thực hiện bài tập ngửa cổ thu cằm mỗi 30 phút.',
    },
    {
      title: 'Kháng thể tự nhiên và tầm quan trọng của hệ vi sinh đường ruột',
      theme: '70% hệ thống miễn dịch của con người nằm ở đường ruột',
      script:
        'Đường ruột khỏe mạnh là lá chắn phòng thủ vững chắc nhất giúp chống lại virus và vi khuẩn gây bệnh.\n\n' +
        'Bổ sung thực phẩm lên men tự nhiên như sữa chua, kim chi, kombucha và ăn đa dạng 30 loại thực vật mỗi tuần.\n\n' +
        'Chăm sóc các vi khuẩn có lợi chính là cách tốt nhất để bạn ít khi bị ốm vặt.',
    },
    {
      title: 'Mất ngủ kinh niên - Khắc phục bằng phương pháp vệ sinh giấc ngủ',
      theme: 'Thiết lập nhịp sinh học tự nhiên Circadian Rhythm chuẩn khoa học',
      script:
        'Tắt hoàn toàn màn hình ánh sáng xanh từ điện thoại trước khi đi ngủ ít nhất 60 phút.\n\n' +
        'Giữ nhiệt độ phòng ngủ mát mẻ quanh 20-22 độ C và hoàn toàn tối đen để kích thích tiết hormone Melatonin.\n\n' +
        'Thức dậy vào cùng một khung giờ mỗi sáng kể cả cuối tuần để đồng hồ sinh học luôn ổn định.',
    },
    {
      title: 'Chỉ số mỡ máu Triglyceride cao và nguy cơ xơ vữa động mạch',
      theme: 'Nguyên nhân thực sự không phải do ăn mỡ mà do thừa đường tinh luyện',
      script:
        'Trà sữa, bánh ngọt và nước ngọt có gas là thủ phạm số một kích thích gan sản sinh chất béo trung tính.\n\n' +
        'Triglyceride kết hợp cùng LDL xấu tích tụ tạo thành các mảng xơ vữa làm hẹp lòng mạch máu nuôi tim và não.\n\n' +
        'Cắt giảm đồ ngọt và tăng cường axit béo Omega-3 từ cá hồi để làm sạch lòng mạch máu.',
    },
    {
      title: 'Tác hại khôn lường của việc lạm dụng thuốc kháng sinh',
      theme: 'Hiểm họa vi khuẩn đa kháng thuốc khiến các bệnh thông thường trở nên vô phương cứu chữa',
      script:
        'Cảm cúm thông thường do virus gây ra và kháng sinh hoàn toàn vô tác dụng trong trường hợp này.\n\n' +
        'Tự ý mua kháng sinh uống không đủ liều sẽ rèn luyện cho vi khuẩn trở nên kháng thuốc nguy hiểm.\n\n' +
        'Chỉ sử dụng kháng sinh khi có chỉ định xét nghiệm và đơn kê chuẩn xác từ bác sĩ chuyên khoa.',
    },
    {
      title: 'Phát hiện sớm ung thư vú tại nhà bằng 3 bước đơn giản',
      theme: 'Kỹ thuật tự khám vú hàng tháng giúp phát hiện khối u từ giai đoạn sớm',
      script:
        'Thực hiện kiểm tra vào ngày thứ 7 sau khi sạch kinh bằng cách đứng trước gương quan sát sự thay đổi của da và núm vú.\n\n' +
        'Dùng các đầu ngón tay xoa nhẹ nhàng theo hình xoắn ốc từ ngoài vào trong để phát hiện cục cứng bất thường.\n\n' +
        'Chủ động tầm soát định kỳ bằng nhũ ảnh giúp tăng tỷ lệ điều trị thành công lên đến trên 90%.',
    },
    {
      title: 'Kiểm soát đường huyết tự nhiên cho người tiền tiểu đường',
      theme: 'Thứ tự ăn chuẩn: Rau xanh trước, đạm tiếp theo và tinh bột ăn cuối cùng',
      script:
        'Chỉ cần thay đổi thứ tự đưa thức ăn vào miệng, bạn có thể giảm đỉnh tăng vọt đường huyết sau ăn tới 40%.\n\n' +
        'Lớp chất xơ từ rau xanh sẽ phủ lên niêm mạc ruột, làm chậm quá trình hấp thu glucose vào máu.\n\n' +
        'Bảo vệ tuyến tụy khỏi bị làm việc quá tải và ngăn ngừa tiến triển thành tiểu đường tuýp 2.',
    },
    {
      title: 'Huyết áp cao - Kẻ giết người thầm lặng không có triệu chứng',
      theme: 'Tại sao cần đo huyết áp định kỳ dù cơ thể vẫn cảm thấy hoàn toàn khỏe mạnh?',
      script:
        'Đa số người bị cao huyết áp không hề cảm thấy đau đầu hay chóng mặt cho đến khi tai biến ập đến.\n\n' +
        'Áp lực máu quá lớn liên tục tàn phá các mao mạch nhỏ li ti ở thận, mắt và tim suốt nhiều năm.\n\n' +
        'Giảm ăn mặn dưới 5g muối mỗi ngày và duy trì vận động đều đặn để giữ số đo huyết áp vàng dưới 120/80 mmHg.',
    },
  ],

  // 37. Template: horror_mystery (20 mục)
  horror_mystery: [
    {
      title: 'Chuyến xe bus số 375 lúc nửa đêm',
      theme: 'Truyền thuyết đô thị rùng rợn: chuyến xe bus cuối cùng lúc 0h đêm mưa lạnh buốt, hành khách bí ẩn mặc áo thời cổ và biến mất trong sương.',
      script:
        'Đêm mùa đông năm ấy, chuyến xe bus số 375 lăn bánh rời bến lúc nửa đêm giữa màn sương mù dày đặc buốt giá.\n\n' +
        'Tại trạm dừng vắng bóng người ven đường hoang, có ba bóng người lầm lũi bước lên: hai người đàn ông đỡ một người ở giữa cúi gằm mặt.\n\n' +
        'Một bà lão tinh mắt ngồi phía sau bỗng giật thót tim khi ánh đèn đường le lói rọi qua gấu áo của họ: chân của ba người ấy không hề chạm đất.\n\n' +
        'Bà lão vội vàng kéo người thanh niên bên cạnh giả vờ cãi cọ để nhảy xuống xe... Sáng hôm sau, chiếc xe bus biến mất không để lại một dấu vết.',
    },
    {
      title: 'Tiếng gõ cửa lúc 3 giờ sáng ở khách sạn',
      theme: 'Căn phòng cuối hành lang dài hun hút, tiếng gõ cửa cộc cộc 3 nhịp đều đặn, nhìn qua mắt mèo chỉ thấy một khoảng đen thăm thẳm.',
      script:
        'Đừng bao giờ nhận căn phòng nằm ở tận cùng hành lang của một khách sạn cũ nếu bạn đi công tác một mình.\n\n' +
        'Đúng 3 giờ sáng, khi không gian chìm trong tĩnh mịch ghê rợn, ba tiếng gõ cửa cộc... cộc... cộc vang lên chậm rãi và đều đặn.\n\n' +
        'Anh rón rén bước tới khe mắt mèo nhìn ra ngoài: không có hành lang, không có đèn điện, chỉ có một màu đen đặc quánh như đáy vực sâu.\n\n' +
        'Và bỗng nhiên, một giọng thì thầm lạnh buốt như băng vang lên sát ngay sau gáy: "Sao anh không mở cửa cho tôi?"...',
    },
    {
      title: 'Bí mật chiếc gương cổ trên gác xép',
      theme: 'Chiếc gương đồng phủ khăn vải đen trong ngôi nhà cổ vừa chuyển tới, bóng người trong gương không hề cử động theo chủ nhân.',
      script:
        'Khi dọn về ngôi nhà cổ vừa mua lại với giá hời, anh tìm thấy một chiếc gương đồng lớn phủ vải đen trên gác xép bụi bặm.\n\n' +
        'Tò mò kéo tấm vải xuống, hình ảnh anh trong gương phản chiếu rõ mồn một từng chi tiết.\n\n' +
        'Nhưng khi anh đưa tay phải lên vuốt tóc, bóng người trong gương lại đứng im bất động... rồi từ từ hé nở một nụ cười quái dị đến mang rợ.\n\n' +
        'Chiếc gương bỗng nứt toác một đường dài, và bàn tay bên trong bắt đầu vươn ra khỏi mặt kính lạnh toát...',
    },
    {
      title: 'Căn nhà hoang ngã ba đường không ai dám bén mảng',
      theme: 'Ngôi nhà Pháp cổ đổ nát rêu phong nơi ngã ba đường hoang, cánh cổng sắt rỉ sét khóa xích lớn và ánh sáng đèn dầu ma quái le lói lúc nửa đêm.',
      script:
        'Nằm trơ trọi nơi khúc cua tử thần của ngã ba đường vắng, căn biệt thự cổ thời Pháp thuộc đã bị bỏ hoang suốt hơn nửa thế kỷ qua.\n\n' +
        'Cánh cổng sắt hoen rỉ quấn chặt ba vòng dây xích sắt to bản, những bụi cây tầm ma và dây leo gai góc phủ kín những ô cửa sổ vỡ vụn đen ngòm.\n\n' +
        'Người dân quanh vùng rỉ tai nhau rằng cứ vào những đêm trăng tròn lạnh lẽo, từ trên căn gác mái lại phát ra tiếng đàn dương cầm ai oán và ánh đèn dầu chập chờn ma quái.\n\n' +
        'Những kẻ tò mò trèo tường vào khám phá đêm khuya sáng hôm sau đều được tìm thấy trong trạng thái hoảng loạn thất thần và mất sạch ký ức!',
    },
    {
      title: 'Thang máy dừng ở tầng số 4 lúc 0 giờ đêm',
      theme: 'Thang máy chung cư cũ đèn chớp tắt chập chờn, bảng số thang máy nhảy số kỳ lạ dừng ở tầng 4 không người mở cửa ra khoảng đen hun hút.',
      script:
        '12 giờ đêm trong một khu chung cư cũ kỹ ngoại ô, tiếng chuông thang máy bỗng reo lên từng hồi dài báo hiệu dừng tầng.\n\n' +
        'Bảng điều khiển đèn led nhấp nháy chập chờn rồi bất ngờ dừng lại ở tầng số 4 — tầng lầu đã bị ban quản lý khóa kín niêm phong sau một vụ hỏa hoạn nhiều năm trước.\n\n' +
        'Cánh cửa kim loại từ từ trượt mở phát ra tiếng cọt kẹt rợn người, bên ngoài chỉ là một hành lang đen đặc quánh mùi khói khét lẹt nồng nặc.\n\n' +
        'Và ngay khi cánh cửa chuẩn bị khép lại, một bàn tay xám ngắt cháy đen từ bóng tối bỗng thò vào giữ chặt mép cửa thang máy!',
    },
    {
      title: 'Bức ảnh chụp chung xuất hiện bóng người thứ tư',
      theme: 'Tấm ảnh chụp bằng máy ảnh lấy liền Polaroid của ba người bạn trong chuyến dã ngoại rừng sâu, phía sau hàng cây hiện rõ khuôn mặt thứ tư nhợt nhạt.',
      script:
        'Trong chuyến dã ngoại cắm trại trong rừng sâu cuối tuần, ba người bạn thân cùng tạo dáng chụp chung một tấm ảnh lấy liền Polaroid kỷ niệm.\n\n' +
        'Nhưng khi tấm ảnh dần dần hiện hình rõ nét dưới ánh lửa trại bập bùng, tiếng cười đùa bỗng chốc tắt ngấm nhường chỗ cho sự kinh hoàng tột độ.\n\n' +
        'Phía sau hàng cây thông u tối ngay sau lưng họ, xuất hiện rõ mồn một bóng hình của một người phụ nữ mặc áo trắng toát với mái tóc dài xõa xượi che kín nửa khuôn mặt nhợt nhạt.\n\n' +
        'Và đáng sợ hơn cả: người phụ nữ trong bức ảnh đang từ từ nghiêng đầu mỉm cười nhìn thẳng vào ống kính máy ảnh!',
    },
    {
      title: 'Ngôi làng bị lãng quên trong sương mù dày đặc',
      theme: 'Con đường mòn dẫn vào thung lũng sương mù dày đặc, những ngôi nhà gỗ bỏ hoang bàn ghế còn nguyên vẹn bát đũa nhưng không bóng người sống.',
      script:
        'Lần theo tấm bản đồ cũ kỹ từ thời thuộc địa, đoàn thám hiểm lạc bước vào một ngôi làng cổ nằm sâu trong thung lũng quanh năm sương mù bao phủ.\n\n' +
        'Tất cả các ngôi nhà gỗ đều còn nguyên vẹn vật dụng sinh hoạt hàng ngày: ấm nước vẫn đặt trên bếp lò, bát đũa xếp ngay ngắn trên mâm cơm như thể người dân vừa mới rời đi vài phút trước.\n\n' +
        'Tuy nhiên, hoàn toàn không có bất kỳ một bóng người, một tiếng chó sủa hay một con côn trùng nào tồn tại trong ngôi làng kỳ quái này.\n\n' +
        'Và khi màn đêm buông xuống, những tiếng bước chân thì thầm vô hình bắt đầu rộn rã bước đi vòng quanh những căn nhà hoang vắng!',
    },
    {
      title: 'Cuộc gọi cầu cứu từ căn phòng niêm phong 10 năm',
      theme: 'Tổng đài trực ban công an xã lúc 2h sáng, chuông điện thoại reo vang hiển thị số máy cố định của một ngôi nhà đã bị bỏ hoang sau thảm án.',
      script:
        'Đúng 2 giờ sáng một đêm mưa giông gió giật, chiếc điện thoại bàn trực ban của đồn công an xã bỗng reo vang từng hồi chát chúa.\n\n' +
        'Đầu dây bên kia chỉ là tiếng thở dốc nghẹt thở hòa cùng tiếng khóc thút thít nghẹn ngào của một đứa trẻ kêu cứu: \'Cứu cháu với, chú ơi, cháu bị nhốt dưới hầm lạnh lắm...\'.\n\n' +
        'Khi nhân viên trực ban tra cứu vị trí số điện thoại cố định gọi đến, toàn bộ huyết quản trong người anh như đông cứng lại:\n\n' +
        'Số máy đó thuộc về căn nhà của một gia đình đã tử nạn trong vụ sạt lở đất cách đây đúng 10 năm về trước và đường dây điện thoại đã bị cắt từ lâu!',
    },
    {
      title: 'Tiếng hát ru ai oán bên bờ giếng cổ lúc nửa đêm',
      theme: 'Miệng giếng đá cổ rêu phong dưới bóng cây đa ma quái, sương đêm lạnh buốt bốc lên từ lòng giếng sâu thẳm cùng tiếng hát ru con rợn người.',
      script:
        'Cạnh bờ ao đầu làng có một chiếc giếng đá cổ nghìn năm tuổi rêu phong phủ kín, nơi gắn liền với truyền thuyết về người phụ nữ nhảy xuống giếng tìm con.\n\n' +
        'Cứ vào những đêm hè tĩnh mịch không một gợn gió, những người đi làm đồng về muộn lại nghe thấy vẳng lại từ lòng giếng sâu hun hút một khúc hát ru con tha thiết đến rợn người.\n\n' +
        'Tiếng hát khi thì thì thầm nỉ non bên tai, lúc lại vang vọng như tiếng nấc nghẹn ngào từ đáy vực sâu thăm thẳm.\n\n' +
        'Những ai tò mò bước lại gần nhìn xuống làn nước đen ngòm dưới đáy giếng đều nhìn thấy hai đốm sáng trắng đang từ từ trồi lên khỏi mặt nước lạnh buốt!',
    },
    {
      title: 'Lời nguyền chiếc vòng ngọc bích của bà nội để lại',
      theme: 'Chiếc vòng ngọc bích màu xanh lục đậm có vân máu đỏ rực, đeo vào cổ tay không thể tháo ra và những cơn ác mộng rùng rợn hàng đêm.',
      script:
        'Sau khi bà nội qua đời, cô gái được thừa kế chiếc vòng ngọc bích gia truyền màu xanh lục đậm có những đường vân màu đỏ như máu uốn lượn kỳ dị.\n\n' +
        'Tò mò ướm thử vào cổ tay, chiếc vòng bỗng siết chặt lại vừa khít và không có cách nào có thể tháo ra được nữa dù đã dùng xà phòng trơn.\n\n' +
        'Kể từ đêm đó, hàng đêm cô đều mơ thấy một người phụ nữ mặc áo the đen đứng đầu giường nhìn cô trừng trừng với đôi mắt đỏ ngầu giận dữ.\n\n' +
        'Và kinh hoàng hơn cả: mỗi sáng thức dậy, những đường vân máu đỏ bên trong chiếc vòng ngọc bích lại lan rộng ra thêm một chút như đang hút dần sinh khí của chủ nhân!',
    },
    {
      title: 'Truyền thuyết căn nhà số 300 đèo Prenn Đà Lạt',
      theme: 'Biệt thự Pháp cổ bỏ hoang giữa rừng thông lạnh ngắt và tiếng khóc ai oán',
      script:
        'Cánh cửa gỗ mục nát kêu kẽo kẹt trong làn sương mù dày đặc lúc nửa đêm.\n\n' +
        'Những vết cào móng tay in sâu trên tường vôi ẩm mốc và bóng trắng lướt qua ban công tầng hai.\n\n' +
        'Bí mật kinh hoàng về cái chết oan khuất của cô gái trẻ năm xưa vẫn ám ảnh người đi đường qua đèo.',
    },
    {
      title: 'Chiếc gương soi cổ trong phòng ngủ khách sạn',
      theme: 'Hình ảnh phản chiếu trong gương chuyển động chậm hơn một nhịp so với thực tế',
      script:
        'Đứng đánh răng lúc 12 giờ đêm, bạn nhận ra nụ cười trong gương vẫn giữ nguyên khi bạn đã thôi cười.\n\n' +
        'Bàn tay lạnh buốt từ bên trong mặt kính từ từ áp sát vào ngực bạn qua lớp kính mờ hơi nước.\n\n' +
        'Đừng bao giờ nhìn thẳng vào gương quá lâu khi chỉ có một mình trong bóng tối.',
    },
    {
      title: 'Tiếng bước chân trên trần nhà lúc 3 giờ sáng',
      theme: 'Âm thanh viên bi sắt rơi lạch cạch và tiếng gõ móng tay đều đặn',
      script:
        'Tòa chung cư đã tắt đèn đi ngủ, nhưng trên trần nhà phòng bạn liên tục vang lên tiếng kéo ghế ken két.\n\n' +
        'Bạn gọi ban quản lý phàn nàn và kinh hoàng nhận ra: căn hộ phía trên bạn đã bỏ trống suốt 2 năm nay.\n\n' +
        'Vậy sinh vật đang đi lại ngay trên đầu bạn mỗi đêm thực sự là ai?',
    },
    {
      title: 'Chuyến xe buýt đêm không có trạm dừng',
      theme: 'Những hành khách ngồi im như tượng với làn da nhợt nhạt không chớp mắt',
      script:
        'Bước lên chuyến xe buýt số 13 trong đêm mưa lạnh, bạn thấy bác tài xế không hề quay đầu lại.\n\n' +
        'Chiếc xe lao vun vút qua các trạm dừng mà không mở cửa, kim đồng hồ trên xe quay ngược chiều kim đồng hồ.\n\n' +
        'Bạn nhìn xuống chân những người ngồi cạnh và nhận ra không một ai có bóng dưới sàn xe.',
    },
    {
      title: 'Bức tranh chân dung cô gái mắt dõi theo bạn',
      theme: 'Ánh mắt trong tranh sơn dầu cổ chuyển động theo từng bước chân trong phòng khách',
      script:
        'Mua bức tranh cũ ở chợ đồ cổ với giá rẻ, nhưng từ khi treo lên, trong nhà liên tục xảy ra chuyện kỳ lạ.\n\n' +
        'Đêm xuống, khóe môi cô gái trong tranh dường như nhếch lên một nụ cười rùng rợn và tà mị.\n\n' +
        'Linh hồn của người mẫu bị giam cầm vĩnh viễn trong từng nét cọ đẫm máu.',
    },
    {
      title: 'Búp bê sứ phát ra tiếng cười thì thầm trong tủ kính',
      theme: 'Món đồ chơi thời thơ ấu tự thay đổi vị trí mỗi khi chủ nhân đi vắng',
      script:
        'Đôi mắt thủy tinh trong veo như xoáy sâu vào tâm can người đối diện bất kể ngày đêm.\n\n' +
        'Sáng nào thức dậy bạn cũng thấy búp bê ngồi ở một góc khác, đầu hơi nghiêng về phía giường ngủ của bạn.\n\n' +
        'Nó đang đợi bạn ngủ say để lấy đi thứ quý giá nhất của bạn.',
    },
    {
      title: 'Cuộc gọi nhỡ từ số điện thoại của chính mình',
      theme: 'Màn hình sáng lên giữa đêm với tên danh bạ hiển thị chính là bạn',
      script:
        'Run rẩy bấm nghe máy, đầu dây bên kia phát ra tiếng thở dốc quen thuộc và tiếng khóc van xin.\n\n' +
        '\'Đừng mở cửa tủ quần áo! Nó đang ở bên trong!\' - giọng nói đó giống hệt giọng của chính bạn.\n\n' +
        'Một tiếng cọt kẹt vang lên ngay sau lưng bạn khi cánh cửa tủ từ từ hé mở.',
    },
    {
      title: 'Bóng ma thiếu nữ áo trắng trên cầu Thuận Phước',
      theme: 'Cơn gió lạnh thấu xương thổi qua dây văng cây cầu dây võng dài nhất Việt Nam',
      script:
        'Đêm khuya thanh vắng, bóng dáng mảnh khảnh đứng bám vào lan can cầu nhìn xuống dòng nước đen ngòm.\n\n' +
        'Khi người lái xe máy dừng lại hỏi thăm, bóng hình đó quay lại để lộ một khuôn mặt không có ngũ quan.\n\n' +
        'Nỗi ám ảnh kinh hoàng của những tài xế chạy xe qua cầu lúc rạng sáng.',
    },
    {
      title: 'Bệnh viện dã chiến bỏ hoang trong rừng sâu',
      theme: 'Mùi cồn sát trùng nồng nặc và tiếng bánh xe đẩy cáng rỉ sét lăn trong hành lang tối',
      script:
        'Những chiếc giường bệnh phủ khăn trắng ố vàng nằm ngổn ngang dưới ánh đèn pin leo lét.\n\n' +
        'Tiếng rên rỉ đau đớn của các bệnh nhân từ thời chiến tranh vẫn vang vọng khắp các phòng phẫu thuật.\n\n' +
        'Nơi ranh giới giữa sự sống và cái chết đã bị xóa nhòa vĩnh viễn trong quá khứ.',
    },
    {
      title: 'Trò chơi trốn tìm một mình lúc nửa đêm Hitori Kakurenbo',
      theme: 'Nghi thức ma quái với con gấu bông nhồi gạo và sợi chỉ đỏ',
      script:
        'Cắt móng tay bỏ vào bụng gấu bông, đâm nó bằng kim khâu và đi trốn trong tủ quần áo tối tăm.\n\n' +
        'Tiếng bước chân ươn ướt chầm chậm lê trên sàn nhà, tiến dần về phía nơi bạn đang nín thở run rẩy.\n\n' +
        'Bây giờ đến lượt nó đi tìm bạn... và nó sẽ không bao giờ để bạn thoát ra ngoài còn sống.',
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
    if (template.id.includes('travel') || template.id.includes('vlog')) {
      return INSPIRATIONS_BY_TEMPLATE['travel_vlog']
    }
    if (template.id.includes('podcast') || template.id.includes('mic') || template.id.includes('talk')) {
      return INSPIRATIONS_BY_TEMPLATE['podcast_clips']
    }
    if (template.id.includes('food') || template.id.includes('cook') || template.id.includes('delight')) {
      return INSPIRATIONS_BY_TEMPLATE['food_delight']
    }
    if (template.id.includes('fitness') || template.id.includes('gym') || template.id.includes('workout')) {
      return INSPIRATIONS_BY_TEMPLATE['fitness_workout']
    }
    if (template.id.includes('estate') || template.id.includes('house') || template.id.includes('home')) {
      return INSPIRATIONS_BY_TEMPLATE['real_estate']
    }
    if (template.id.includes('history') || template.id.includes('legend') || template.id.includes('sử')) {
      return INSPIRATIONS_BY_TEMPLATE['historical_legend']
    }
    if (template.id.includes('lofi') || template.id.includes('chill') || template.id.includes('study')) {
      return INSPIRATIONS_BY_TEMPLATE['lofi_chill']
    }
    if (template.id.includes('finance') || template.id.includes('crypto') || template.id.includes('fintech')) {
      return INSPIRATIONS_BY_TEMPLATE['finance_crypto']
    }
    if (template.id.includes('medical') || template.id.includes('health') || template.id.includes('doctor')) {
      return INSPIRATIONS_BY_TEMPLATE['medical_health']
    }
    if (template.id.includes('horror') || template.id.includes('spooky') || template.id.includes('mystery')) {
      return INSPIRATIONS_BY_TEMPLATE['horror_mystery']
    }
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
    if (lower.includes('du lịch') || lower.includes('travel')) {
      return INSPIRATIONS_BY_TEMPLATE['travel_vlog']
    }
    if (lower.includes('ẩm thực') || lower.includes('nấu ăn') || lower.includes('food')) {
      return INSPIRATIONS_BY_TEMPLATE['food_delight']
    }
    if (lower.includes('podcast') || lower.includes('đối thoại')) {
      return INSPIRATIONS_BY_TEMPLATE['podcast_clips']
    }
    if (lower.includes('thể hình') || lower.includes('fitness') || lower.includes('gym')) {
      return INSPIRATIONS_BY_TEMPLATE['fitness_workout']
    }
    if (lower.includes('bất động sản') || lower.includes('nhà đẹp')) {
      return INSPIRATIONS_BY_TEMPLATE['real_estate']
    }
    if (lower.includes('lịch sử') || lower.includes('sử thi')) {
      return INSPIRATIONS_BY_TEMPLATE['historical_legend']
    }
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
      return INSPIRATIONS_BY_TEMPLATE['finance_crypto']
    }
    if (lower.includes('kiến thức') || lower.includes('khoa học') || lower.includes('giáo dục')) {
      return INSPIRATIONS_BY_TEMPLATE['medical_health']
    }
    if (lower.includes('kinh dị') || lower.includes('kịch tính')) {
      return INSPIRATIONS_BY_TEMPLATE['horror_mystery']
    }
    if (lower.includes('điện ảnh') || lower.includes('phim')) {
      return INSPIRATIONS_BY_TEMPLATE['film_cinematic']
    }
    if (lower.includes('hoạt hình') || lower.includes('3d')) {
      return INSPIRATIONS_BY_TEMPLATE['anim_3d']
    }
    if (lower.includes('pixel') || lower.includes('vhs') || lower.includes('retro')) {
      return INSPIRATIONS_BY_TEMPLATE['lofi_chill']
    }
  }

  // Fallback mặc định an toàn
  return INSPIRATIONS_BY_TEMPLATE['huoke_douyin_hook']
}
