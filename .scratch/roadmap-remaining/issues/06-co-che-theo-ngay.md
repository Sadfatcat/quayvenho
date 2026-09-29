# 06: Cơ chế theo ngày bật dần

**What to build:** Các trường yêu cầu của khách (hành lý, ưu tiên ghế, hạng thương gia, ưu tiên giờ bay, dịch vụ thêm, hộ chiếu lỗi) chỉ xuất hiện đúng từ ngày quy định trong PLAN §4.5, không sớm hơn.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Mỗi cơ chế (baggage, seatPref, business, timePref, extras, badPassport) chỉ bật từ đúng ngày cấu hình
- [ ] `PassportCard` (overlay xem hộ chiếu khách) hoạt động đúng từ ngày 6
- [ ] Test đơn vị: mỗi cơ chế không xuất hiện trước ngày mở, xuất hiện đúng từ ngày mở
- [ ] Kiểm tay/Playwright một vài ngày mốc (ngày mở cơ chế mới) để chắc UI phản ánh đúng
