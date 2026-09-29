# 01: Kho (PrepScene) hoạt động đầy đủ

**What to build:** Người chơi vào Kho sau Onboarding (hoặc sau khi bấm "Chơi tiếp" với save ở phase PREP), xem danh sách chuyến bay đêm nay nhóm theo tuyến, mua ghế ECO/BIZ bằng stepper (có chiết khấu theo số lượng, giới hạn theo ghế còn trống và tiền hiện có), xác nhận mua, rồi bấm "Mở cửa" để sang Quầy.

**Blocked by:** None (làm được ngay)

**Status:** resolved

- [x] Danh sách chuyến cuộn dọc, nhóm theo tuyến, mỗi dòng hiện mã chuyến/giờ/giá vốn ECO,BIZ/số ghế đã sở hữu, tuyến bị dự báo xấu có icon riêng
- [x] Stepper ECO/BIZ disable đúng lúc (hết ghế trống, hoặc tiền không đủ mua thêm một ghế), hiện nhãn chiết khấu khi đạt ngưỡng
- [x] Banner sự kiện (RUSH hoặc dự báo thời tiết) chỉ hiện khi ngày đó có sự kiện
- [x] "Xác nhận nhập ghế" trừ tiền đúng, cập nhật lại danh sách (owned tăng, pending về 0)
- [x] "Mở cửa" khi kho trống (không có ghế khả dụng nào): hộp thoại xác nhận trước khi mở
- [x] "Mở cửa" khi còn pending chưa xác nhận: hộp thoại 3 lựa chọn (nhập và mở / bỏ và mở / huỷ)
- [x] "Mở cửa" bình thường: chuyển thẳng sang Quầy
- [ ] Kiểm bằng Playwright ở 360×640 và 430×932, 0 lỗi console — dời sang ticket 04 (Review Giai đoạn 4, kiểm 1 lượt toàn bộ luồng thay vì mỗi ticket 1 lượt, tiết kiệm quota)

## Answer

`src/scenes/PrepScene.ts` mới, đăng ký trong `main.ts`. Dùng `ScrollList` + `Stepper` (mới) + `TopBar`/`Panel`/`Button`/`DialogOverlay` đã có sẵn. Giới hạn stepper tính bằng `maxPurchasable` (ghế) và một vòng lặp nhỏ gọi `purchaseCost` (tiền) — không tự tính tiền trong scene. typecheck/lint/test(123)/build đều xanh.
