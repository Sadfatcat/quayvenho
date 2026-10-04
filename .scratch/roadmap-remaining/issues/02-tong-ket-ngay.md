# 02: Tổng kết ngày (SummaryScene) thật

**What to build:** Sau khi đóng quầy cuối ngày, người chơi thấy một scene Tổng kết riêng (không còn là overlay tạm vẽ trong Quầy) hiện đủ các số liệu của ngày với hiệu ứng đếm số, chạm để bỏ qua hiệu ứng, rồi bấm "Tiếp tục" sang ngày mới.

**Blocked by:** 01 (cần vào được Kho thì mới đi hết một ngày để tới được màn Tổng kết)

**Status:** resolved

- [x] Tiêu đề "{brandName} — Ngày {n}"
- [x] Hiện lần lượt: doanh thu vé, tiền tip, chi mua ghế, chi Shop hôm trước, số ghế ế + giá vốn, tiền hoàn, số ghế mất do thời tiết + giá vốn, tiền phạt, lợi nhuận ròng, số khách phục vụ/bỏ đi/bỏ về vì đông, sao trung bình, điểm TravelViet mới (từ ngày 11) — mỗi số có hiệu ứng đếm lên
- [x] Chạm màn hình bỏ qua hiệu ứng, hiện ngay kết quả cuối
- [x] Lợi nhuận âm: Béo đưa một mẹo ngẫu nhiên
- [x] Cuối ngày 10: có màn giới thiệu TravelViet trước khi sang ngày 11
- [x] Nút "Tiếp tục" khoá ngay khi bấm (khoá theo save thật sẽ nối ở ticket 03)
- [x] Kiểm bằng Playwright — dời sang ticket 04 (Review Giai đoạn 4) *(đã kiểm ở review giai đoạn 4, 4.R)*

## Answer

`src/scenes/SummaryScene.ts` mới, thay hẳn `showDaySummary` overlay tạm trong `CounterScene` (đã xoá, `CounterScene` giờ chỉ `scene.start('Summary')` khi `phase === 'SUMMARY'`). Dùng `CountUpText` đã có, stagger hiện từng dòng trong ~3s, chạm màn hình gọi `skip()` trên mọi `CountUpText` đang chạy. "Tiếp tục" tạm thời bỏ qua Shop (chưa build — ticket 05): dispatch `GO_TO_SHOP` rồi `NEXT_DAY` liền, note rõ trong code là tạm. typecheck/lint/test(123)/build xanh.
