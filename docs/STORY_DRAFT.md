# Bản nháp cốt truyện và thoại Béo (D11a)

Trạng thái: **bản nháp, chờ chủ dự án duyệt (D11b, PLAN §15)**. Đây là toàn bộ chữ Béo nói hiện đang có trong game, gom một chỗ để đọc và sửa. Sửa xong gửi lại, bản cuối sẽ chốt vào `src/data/strings.ts`.

Giọng văn: genz, thân mật, "cậu/mình", ngắn gọn, không giảng giải dài. Cốt truyện nền: PLAN §2.1 (bỏ việc văn phòng, săn vé đêm, leo TravelViet).

Chỗ còn thiếu so với PLAN §2.2: onboarding mới có 2 popup cốt truyện (PLAN muốn 3–4), và chưa có thoại riêng cho từng khách (PLAN §4.6).

### Mở đầu (OnboardingScene, `onboarding.introLines`)
- Béo: Ê, tỉnh chưa? Nghe vụ này chưa — vé bay đêm ế queo, mà dân đi bụi, dân về quê gấp thì cần rẻ.
- Béo: Hãng bán sỉ ghế giá bèo cho đại lý. Mình dựng quầy, săn vé, bán lại đúng người cần — ăn chênh lệch, không ai thiệt.
- Béo: Giờ xưng danh đi. Tên cậu, rồi tên cái quầy này, cho nó chất!

### Béo đọc tên quầy
- Béo: "<tên quầy>" nghe được đó! Mở quầy thôi!

### Tutorial (`tutorial.*`)
- **prepDay1**: Đây là Kho. Chạm + ở một chuyến để nhập ghế, rồi bấm "Xác nhận nhập ghế". Ngày đầu thử nhập vài ghế Đà Nẵng nhé, xong bấm "Mở cửa".
- **counterDay1**: Đọc đơn của khách, chọn đúng chuyến, chọn ghế, bấm Tiếp hai lần, rồi In vé và kéo vé lên trao cho khách. Khách đầu tiên rất kiên nhẫn, cứ thong thả.
- **baggageDay2**: Từ hôm nay khách có hành lý. Kéo thanh hành lý đến đúng vạch khách yêu cầu.
- **seatPrefDay3**: Có khách thích ghế cửa sổ hoặc lối đi. Nhìn biểu tượng trong đơn rồi chọn đúng loại ghế.
- **businessDay4**: Khách thương gia khó tính hơn nhưng tip rất hậu. Trao vé đúng hạng và thật nhanh để được tip.
- **timeAndExtrasDay5**: Khách có thể chọn khung giờ Tối hoặc Khuya, và thêm dịch vụ như suất ăn chay. Đọc kỹ đơn nha.
- **passportDay6**: Hôm nay có hộ chiếu! Hộ chiếu hết hạn hoặc sai tên thì bấm Từ chối, đừng bán vé.
- **rushFirst**: Cao điểm lễ hội! Khách đông hơn và giá vé cao hơn. Nhớ nhập đủ ghế.
- **weatherFirst**: Dự báo thời tiết xấu ở một tuyến. Có thể mất ghế khi mở cửa: tốt, xấu, hoặc rất xấu (huỷ cả chuyến). Cân nhắc đừng nhập nhiều ghế tuyến đó.

### Lưới an toàn
- Lưới an toàn
- Bạn sắp hết tiền! Được tặng miễn phí một ít ghế ECO để tiếp tục buôn bán.

### Mẹo khi lỗ (`summary.lossTips`)
- Béo: Thử nhập ít ghế hơn cho chuyến khuya xem sao.
- Béo: Để ý chuyến hay bị dự báo xấu, đừng ôm nhiều ghế tuyến đó.
- Béo: Khách bỏ đi nhiều quá thì thử tăng tốc lắp vé xem.

### Giới thiệu TravelViet (cuối ngày 10)
- TravelViet mở rồi!
- Béo: Từ giờ điểm đánh giá TravelViet sẽ quyết định có bao nhiêu khách tìm đến quầy mình mỗi ngày. Phục vụ càng ngon, điểm càng cao, khách càng đông!

### Banner Kho
- Cao điểm lễ hội: khách đông hơn, giá bán ×1.2
- Dự báo xấu ở một tuyến: có thể mất ghế khi mở cửa

