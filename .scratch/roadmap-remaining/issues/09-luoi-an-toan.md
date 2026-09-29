# 09: Lưới an toàn

**What to build:** Khi người chơi bị kẹt (hết tiền và không đủ ghế để mua/phục vụ khách), game tự phát hiện và tặng ghế để tránh softlock, kèm hộp thoại giải thích cho người chơi biết vì sao được tặng.

**Blocked by:** 05, 06

**Status:** resolved

- [x] Phát hiện đúng tình huống kẹt (hết tiền, không mua nổi ghế nào) — domain (`safetyNet.ts`) đã có từ Giai đoạn 1, gọi đúng lúc (`createNewGame`, `NEXT_DAY`)
- [x] Hộp thoại kích hoạt lưới an toàn hiện rõ ràng, dễ hiểu — **chưa có UI, đây là phần thật sự làm ở ticket này**: `PrepScene` kiểm tra `today.transactions` có `SUPPORT_GIFT` của ngày hiện tại lúc vào màn, hiện `DialogOverlay` giải thích (không dùng event-subscribe vì `NEXT_DAY` dispatch xảy ra ở `ShopScene`, trước khi `PrepScene` kịp subscribe — đọc thẳng từ state tại `onCreate()` đáng tin cậy hơn)
- [x] Ép hết tiền (Playwright): được tặng đúng 3 ghế ECO (`SAFETY_NET_GIFT_SEATS`), transaction `SUPPORT_GIFT` số 0, hộp thoại hiện đúng, đóng đúng, Kho hiện "ECO đã có 3" ở tuyến rẻ nhất — 0 lỗi console
- [x] Test đơn vị: **chưa có file test cho `safetyNet.ts`** — đã bổ sung `safetyNet.test.ts` (ngưỡng kích hoạt đúng theo tuyến rẻ nhất trong các tuyến đã mở, tặng đúng chuyến sớm nhất, trả null khi không có chuyến)

## Answer

Domain đã đúng sẵn từ Giai đoạn 1 nhưng có 2 lỗ hổng thật: (1) không có file test cho `safetyNet.ts`, (2) không scene nào lắng nghe/hiện hộp thoại khi lưới an toàn kích hoạt dù domain đã phát sự kiện `SUPPORT_GIFT` — người chơi trước đây sẽ thấy ghế tự nhiên xuất hiện mà không hiểu vì sao. Đã lấp cả hai. 134 test domain, typecheck/lint/build đều xanh.
