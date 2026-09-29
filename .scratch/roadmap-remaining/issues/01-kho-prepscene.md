# 01: Kho (PrepScene) hoạt động đầy đủ

**What to build:** Người chơi vào Kho sau Onboarding (hoặc sau khi bấm "Chơi tiếp" với save ở phase PREP), xem danh sách chuyến bay đêm nay nhóm theo tuyến, mua ghế ECO/BIZ bằng stepper (có chiết khấu theo số lượng, giới hạn theo ghế còn trống và tiền hiện có), xác nhận mua, rồi bấm "Mở cửa" để sang Quầy.

**Blocked by:** None (làm được ngay)

**Status:** ready-for-agent

- [ ] Danh sách chuyến cuộn dọc, nhóm theo tuyến, mỗi dòng hiện mã chuyến/giờ/giá vốn ECO,BIZ/số ghế đã sở hữu, tuyến bị dự báo xấu có icon riêng
- [ ] Stepper ECO/BIZ disable đúng lúc (hết ghế trống, hoặc tiền không đủ mua thêm một ghế), hiện nhãn chiết khấu khi đạt ngưỡng
- [ ] Banner sự kiện (RUSH hoặc dự báo thời tiết) chỉ hiện khi ngày đó có sự kiện
- [ ] "Xác nhận nhập ghế" trừ tiền đúng, cập nhật lại danh sách (owned tăng, pending về 0)
- [ ] "Mở cửa" khi kho trống (không có ghế khả dụng nào): hộp thoại xác nhận trước khi mở
- [ ] "Mở cửa" khi còn pending chưa xác nhận: hộp thoại 3 lựa chọn (nhập và mở / bỏ và mở / huỷ)
- [ ] "Mở cửa" bình thường: chuyển thẳng sang Quầy
- [ ] Kiểm bằng Playwright ở 360×640 và 430×932, 0 lỗi console
