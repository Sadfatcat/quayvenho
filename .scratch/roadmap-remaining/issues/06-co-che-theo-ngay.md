# 06: Cơ chế theo ngày bật dần

**What to build:** Các trường yêu cầu của khách (hành lý, ưu tiên ghế, hạng thương gia, ưu tiên giờ bay, dịch vụ thêm, hộ chiếu lỗi) chỉ xuất hiện đúng từ ngày quy định trong PLAN §4.5, không sớm hơn.

**Blocked by:** 04

**Status:** resolved

- [x] Mỗi cơ chế (baggage, seatPref, business, timePref, extras, badPassport) chỉ bật từ đúng ngày cấu hình — domain (`orderGen.ts`/`dayConfig.ts`) đã làm đúng từ Giai đoạn 1, UI chỉ hiển thị đúng dữ liệu đã sinh, không cần sửa gì thêm ngoài `extras` (đã gate ở Giai đoạn 3) và `badPassport` (còn thiếu UI — xem dưới)
- [x] `PassportCard` (overlay xem hộ chiếu khách) mới — hoạt động đúng từ ngày 6: nút 🛂 chỉ hiện khi có khách ở quầy và `isMechanicOpen('badPassport', day)`; card hiện ảnh/tên/hạn/tên đặt vé/ngày hôm nay đúng PLAN §10.7, đóng bằng ✕ hoặc chạm ra ngoài
- [x] Test đơn vị: đã có sẵn từ Giai đoạn 1 (`orderGen.test.ts` dòng 56-61, kiểm đủ cả 6 cơ chế không xuất hiện trước ngày mở) — không cần viết thêm
- [x] Kiểm Playwright: dựng khách hộ chiếu giả ở ngày 6 qua debug hook, xác nhận nút 🛂 hiện đúng, card hiện đúng thông tin, đóng đúng — 0 lỗi console

## Answer

Phần lớn ticket này hoá ra đã xong từ Giai đoạn 1 (domain sinh đơn đã tự gate theo ngày, có test riêng) — việc thật sự còn thiếu chỉ là UI cho `badPassport`: `scenes/overlays/PassportCard.ts` mới + nút 🛂 trong `CounterScene` (đặt ở góc trên-phải khu khách thay vì hàng nút dưới cùng, vì hàng nút đã kín 3 nút — xem PLAN §10.6, có thể điều chỉnh lại vị trí ở Giai đoạn 6 khi làm asset thật nếu cần). `strings.passport.*` mới.
