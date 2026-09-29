# 07: Sự kiện RUSH và thời tiết

**What to build:** Sự kiện ngày (RUSH hoặc dự báo/kết quả thời tiết) hiển thị rõ ràng ở cả Kho và Quầy, và tác động đúng luật khi mở cửa (RUSH tăng khách + giá bán; thời tiết BAD/SEVERE làm mất ghế của tuyến bị ảnh hưởng).

**Blocked by:** 04

**Status:** resolved

- [x] Banner ở Kho khi có RUSH hoặc dự báo thời tiết (đã có từ ticket 01); badge ở Quầy khi có RUSH hoặc kết quả thời tiết đã chốt (đã có từ Giai đoạn 3) — kiểm lại bằng Playwright, badge hiện đúng "⛈ {tên tuyến}: BAD"
- [x] RUSH: số khách ×1.4, giá bán ×1.2 — domain đã làm từ Giai đoạn 1 (`RUSH_CUSTOMER_MULT`, `RUSH_PRICE_MULT`), không cần sửa
- [x] Thời tiết BAD: tuyến bị ảnh hưởng mất round(n/3) ghế đã mua, không hoàn tiền — đã đúng từ Giai đoạn 1 (`openCounter()` trong `dayCycle.ts`), **nhưng chưa có test riêng** — đã bổ sung
- [x] Thời tiết SEVERE: mọi chuyến của tuyến bị huỷ (CANCELLED), mất hết ghế tuyến đó — đã đúng, đã bổ sung test riêng (trước đây chỉ có test RUSH, không có test WEATHER áp dụng thật)
- [x] Debug hook: dùng trực tiếp `window.__sessionBridge` (đã có từ Giai đoạn 3) để gán `today.event`/`today.seats` khi kiểm Playwright — không cần thêm hook riêng
- [x] Test đơn vị: `src/domain/events.test.ts` mới (trước đây **chưa có file test cho `events.ts`** — vi phạm quy ước "mỗi file domain có test tương ứng") — hội tụ đúng RUSH 0.15/WEATHER 0.25/NONE 0.6 và GOOD 0.4/BAD 0.4/SEVERE 0.2; `dayCycle.test.ts` thêm 2 test SEVERE/BAD áp dụng đúng, chỉ đúng 1 tuyến bị ảnh hưởng

## Answer

Phần lớn ticket này (domain logic + UI banner/badge) đã đúng sẵn từ các Giai đoạn trước — việc thật sự làm ở đây là **lấp lỗ hổng test**: `events.ts` chưa từng có file test, và không có test nào xác nhận thật sự BAD/SEVERE áp dụng đúng khi mở cửa (chỉ có RUSH được test). Thêm fixture `seedWithWeatherOutcome()` vào `__integration__/fixtures.ts` để tìm seed cho outcome cụ thể. 130 test domain (từ 123), typecheck/lint/build đều xanh.
