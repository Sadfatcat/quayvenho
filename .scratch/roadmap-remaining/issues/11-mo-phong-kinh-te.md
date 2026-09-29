# 11: Mô phỏng kinh tế (`scripts/sim.ts`)

**What to build:** Một script chạy bot mô phỏng nhiều ngày/nhiều seed để kiểm tra cân bằng kinh tế của game (lợi nhuận, tỉ lệ khách bỏ đi/bỏ về vì đông, v.v.), in bảng thống kê theo PLAN §13.3.

**Blocked by:** 05, 06, 07, 08 (cần mọi cơ chế ảnh hưởng kinh tế đã hoạt động để số liệu có ý nghĩa)

**Status:** resolved — công cụ xong, cần chủ dự án duyệt số liệu trước khi đổi cân bằng game

- [x] Chạy được `npm run sim`, in bảng đúng format PLAN §13.3 (theo ngày, median; phần đối chiếu mục tiêu riêng)
- [x] Có đủ 3 hồ sơ bot PERFECT/AVERAGE/POOR (PLAN chỉ yêu cầu tối thiểu 2, đã làm đủ cả 3) — mở rộng `bots.ts`: `makeErrorProneDecide` (tỉ lệ lỗi nhẹ/nặng/bỏ đi có tham số), `playShift`/`playDay`/`buyForDay` nhận thêm `serveTimeMs`/`demandScale`/`avoidWeather`
- [x] Báo cáo kết quả — xem mục "Kết quả" bên dưới. **Có lệch khỏi khoảng mục tiêu** → theo đúng luật CLAUDE.md, KHÔNG tự sửa số liệu cân bằng game (giá, chi phí nâng cấp, hệ số RUSH...), chỉ báo cáo + đề xuất, chờ chủ dự án duyệt
- [ ] Mở BKK đúng ngày (PERFECT 11-13, AVERAGE 13-18) — **chưa đo được**, cần thêm cột theo dõi ngày mở từng tuyến nếu chủ dự án muốn xem chỉ số này

## Kết quả (20 seed × 30 ngày — giảm từ 200 seed của PLAN để chạy trong vài phút; tăng `SEEDS_PER_BOT` trong `scripts/sim.ts` để chạy đầy đủ hơn)

| Chỉ số | Mục tiêu | PERFECT | AVERAGE | POOR |
|---|---|---|---|---|
| Mua nâng cấp đầu tiên | PERFECT ≤ ngày 2; AVERAGE ~ngày 3 (≤4) | ngày 2 ✅ | **ngày 1 ❌ (sớm hơn mục tiêu)** | ngày 3 (không có mục tiêu) |
| TravelViet ngày 20 | PERFECT ≥4.5; AVERAGE 3.6-4.4 | **3.7 ❌ (thấp hơn)** | **3.2 ❌ (thấp hơn)** | 2.7 (không có mục tiêu) |
| Lưới an toàn / 30 ngày (median) | POOR p50 ≤ 3 | 0 | 0 | **6 ❌ (cao hơn gấp đôi)** |
| Lợi nhuận âm | AVERAGE ≤ 20% ngày | 40.8% | **43.8% ❌ (cao hơn nhiều)** | 48.2% (không có mục tiêu) |
| Ghế ế | AVERAGE 10-30% | 25.3% | 10% ✅ (sát biên dưới) | 6.4% (không có mục tiêu) |
| Khách bỏ về vì đông | Chỉ báo cáo (§15 D10) | 8.7% | 2.3% | 3.4% |

**Nhận xét** (không tự sửa số liệu game, chỉ đề xuất):
1. Cả 2 bot đều đạt TravelViet thấp hơn mục tiêu — có thể do bot PERFECT không ưu tiên mua `AIRLINE_RELATIONS` (thiên hướng ghế) sớm (chiến lược PLAN yêu cầu là "mua rẻ nhất trước", nên có thể không tối ưu sao); hoặc hệ số `demandFactor`/`ratingBonus` cần nới. Đề xuất: thử tách riêng chiến lược mua nâng cấp cho PERFECT (ưu tiên nâng cấp ảnh hưởng sao) trước khi kết luận là do số liệu game.
2. AVERAGE mua nâng cấp ngày 1 sớm hơn kỳ vọng — nhiều khả năng do bot dùng chung hàm `shop()` với PERFECT (không có logic "thận trọng hơn" cho AVERAGE); đây là giới hạn của bot mẫu, không hẳn là vấn đề cân bằng.
3. POOR kích hoạt lưới an toàn 6 lần/30 ngày (mục tiêu ≤3) và AVERAGE lỗ 43.8% số ngày — đáng chú ý nhất, gợi ý giá vé/chi phí ghế có thể hơi cao so với biên lợi nhuận của người chơi mắc lỗi, nhưng cần chạy đủ 200 seed (PLAN) trước khi kết luận chắc.

## Answer

`scripts/sim.ts` mới + mở rộng `src/domain/__integration__/bots.ts` (tương thích ngược — mọi tham số mới đều optional, test cũ không đổi). Thêm `"sim": "tsx scripts/sim.ts"` vào `package.json`, thêm override `no-console: off` cho `scripts/**` trong `eslint.config.js` (script CLI cần in báo cáo, đúng mục đích `npm run sim` PLAN yêu cầu). Đã sửa 1 bug thật lúc chạy: bot chậm (POOR, 30s/khách) có thể khiến khách hết kiên nhẫn ngay sau khi in vé xong (trước khi kịp giao) — `DELIVER_TICKET` bị domain từ chối đúng luật, code cũ crash vì coi mọi rejection là lỗi; đã sửa để coi đây là kết quả hợp lệ (khách bỏ đi). 134 test domain vẫn xanh, typecheck/lint/build xanh.

**Việc còn lại thuộc quyết định chủ dự án, không tự làm**: xem xét 3 nhận xét ở trên, quyết định có đổi số liệu cân bằng game hay không trước khi làm ticket 5.7 review cuối Giai đoạn 5.
