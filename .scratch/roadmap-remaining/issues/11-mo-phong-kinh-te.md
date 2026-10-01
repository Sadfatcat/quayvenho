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
| Ghế ế | AVERAGE 10-30% | 25.3% | 9.9% ❌ (dưới biên, sát ngưỡng) | 6.4% (không có mục tiêu) |
| Khách bỏ về vì đông | Chỉ báo cáo (§15 D10) | 8.7% | 2.3% | 3.4% |

**Nhận xét** (không tự sửa số liệu game, chỉ đề xuất):
1. Cả 2 bot đều đạt TravelViet thấp hơn mục tiêu — có thể do bot PERFECT không ưu tiên mua `AIRLINE_RELATIONS` (thiên hướng ghế) sớm (chiến lược PLAN yêu cầu là "mua rẻ nhất trước", nên có thể không tối ưu sao); hoặc hệ số `demandFactor`/`ratingBonus` cần nới. Đề xuất: thử tách riêng chiến lược mua nâng cấp cho PERFECT (ưu tiên nâng cấp ảnh hưởng sao) trước khi kết luận là do số liệu game.
2. AVERAGE mua nâng cấp ngày 1 sớm hơn kỳ vọng — nhiều khả năng do bot dùng chung hàm `shop()` với PERFECT (không có logic "thận trọng hơn" cho AVERAGE); đây là giới hạn của bot mẫu, không hẳn là vấn đề cân bằng.
3. POOR kích hoạt lưới an toàn 6 lần/30 ngày (mục tiêu ≤3) và AVERAGE lỗ 43.8% số ngày — đáng chú ý nhất, gợi ý giá vé/chi phí ghế có thể hơi cao so với biên lợi nhuận của người chơi mắc lỗi, nhưng cần chạy đủ 200 seed (PLAN) trước khi kết luận chắc.

## Answer

`scripts/sim.ts` mới + mở rộng `src/domain/__integration__/bots.ts` (tương thích ngược — mọi tham số mới đều optional, test cũ không đổi). Thêm `"sim": "tsx scripts/sim.ts"` vào `package.json`, thêm override `no-console: off` cho `scripts/**` trong `eslint.config.js` (script CLI cần in báo cáo, đúng mục đích `npm run sim` PLAN yêu cầu). Đã sửa 1 bug thật lúc chạy: bot chậm (POOR, 30s/khách) có thể khiến khách hết kiên nhẫn ngay sau khi in vé xong (trước khi kịp giao) — `DELIVER_TICKET` bị domain từ chối đúng luật, code cũ crash vì coi mọi rejection là lỗi; đã sửa để coi đây là kết quả hợp lệ (khách bỏ đi). 134 test domain vẫn xanh, typecheck/lint/build xanh.

**Việc còn lại thuộc quyết định chủ dự án, không tự làm**: xem xét 3 nhận xét ở trên, quyết định có đổi số liệu cân bằng game hay không trước khi coi bước 5.7 là xong.

**Sửa ở 5.R (Review Giai đoạn 5)**: code-reviewer bắt 1 lỗi P1 thật — công thức "tỉ lệ ghế ế" thiếu `weatherLostSeats` ở mẫu số (ghế mất do thời tiết cũng là ghế đã mua). Đã sửa, số liệu AVERAGE đổi rất nhẹ (10% → 9.9%, không đổi kết luận).

## Chạy lại 200 seed × 30 ngày (đúng PLAN §13.3, ~1 phút 40 giây)

| Chỉ số | Mục tiêu | PERFECT | AVERAGE | POOR |
|---|---|---|---|---|
| Mua nâng cấp đầu tiên | PERFECT ≤ ngày 2; AVERAGE ~ngày 3 | ngày 1 ✅ | ngày 1 ❌ | ngày 3 |
| TravelViet ngày 20 | PERFECT ≥4.5; AVERAGE 3.6-4.4 | 3.7 ❌ | 3.2 ❌ | 2.7 |
| Lưới an toàn / 30 ngày | POOR ≤ 3 | 0 | 0 | 7 ❌ |
| Lợi nhuận âm | AVERAGE ≤ 20% ngày | 40.7% | 45.4% ❌ | 48.5% |
| Ghế ế | AVERAGE 10-30% | 24.9% | 10.0% ✅ (sát biên) | 6.6% |
| Khách bỏ về vì đông | chỉ báo cáo | 8.1% | 2.1% | 3.3% |

Kết luận: số liệu 200 seed khớp 20 seed, độ lệch không phải do nhiễu. Chờ chủ dự án duyệt hướng chỉnh cân bằng.

## Phương án A (chỉnh bot, không đổi số game) — kết quả 200 seed

Đổi: PERFECT ưu tiên nâng cấp tăng kiên nhẫn/hàng đợi (`upgradeOrder`); AVERAGE giữ quỹ dự phòng 600 thay vì 250.

| Chỉ số | Mục tiêu | PERFECT | AVERAGE | POOR |
|---|---|---|---|---|
| Mua nâng cấp đầu tiên | AVERAGE ~ngày 3 | ngày 1 | ngày 4 ✅ | ngày 3 |
| TravelViet ngày 20 | PERFECT ≥4.5; AVERAGE 3.6-4.4 | 3.7 ❌ (không đổi) | 3.2 ❌ | 2.7 |
| Lợi nhuận âm | AVERAGE ≤20% | 42.3% | 43.1% ❌ | 48.5% |
| Lưới an toàn POOR | ≤3 | 0 | 0 | 7 ❌ |
| Ghế ế AVERAGE | 10-30% | 24.6% | 14.6% ✅ | 6.6% |

Kết luận: A chỉ sửa được chỉ số "mua nâng cấp sớm" (do bot). TravelViet, tỉ lệ ngày lỗ và lưới an toàn không đổi dù bot đã tối ưu → nguyên nhân nằm ở số liệu game, cần phương án B (giá ghế/vé) hoặc C (hệ số TravelViet).

## Thử B+C (200 seed) — KHÔNG hiệu quả, đã hoàn tác

Thử: giá vé mọi tuyến ×1,12; `DEMAND_FACTORS` ≤2.9: 0.3→0.5, ≤3.5: 0.45→0.7.

| Chỉ số | Trước | Sau B+C |
|---|---|---|
| PERFECT TravelViet ngày 20 | 3.7 | 3.7 |
| PERFECT ngày lỗ | 42.3% | 39.8% |
| AVERAGE TravelViet ngày 20 | 3.2 | 2.9 (tệ hơn) |
| AVERAGE ngày lỗ | 43.1% | 44.1% |
| POOR lưới an toàn | 7 | 5 |

Còn làm hỏng 7 test (doanh thu, tuyến). Đã `git checkout` hoàn tác, game giữ nguyên số liệu cũ.

**Chẩn đoán (PERFECT, 100 seed × 30 ngày):** kết quả khách = PERFECT 13.4k, GOOD 13.6k, **REFUSED_NO_STOCK 23.6k (3 sao)**, REFUSED_CORRECT 8.6k (4 sao), LEFT 3.7k (1 sao). Số khách "hết ghế" nhiều hơn khách phục vụ được → điểm sao bị kéo xuống ~3.7 bất kể bot làm đúng. Mua nhiều ghế hơn (×1.3, ×1.6) cũng không giảm (24.1k, 25.7k) → nguyên nhân không phải số lượng mua. Quan sát ngày 3-20: tiền chỉ 300-500 xu mà khách 10-30/ngày, bot chia ghế đều theo tuyến/chuyến (không theo khung giờ khách chọn), nên thiếu đúng loại ghế; từ ngày ~21 tiền tăng vọt (952 → 5000) rồi lại ế ghế (exp 21-32).

**Đề xuất tiếp (chờ chủ dự án):**
1. Sửa bot mua ghế theo đơn có thể xảy ra (chuyến theo `timePref`, hạng) thay vì chia đều — sửa bot, không đổi số game.
2. Hoặc xem lại luật PLAN §5.5: `REFUSED_NO_STOCK` = 3 sao có hợp lý không (đây là nguồn kéo TravelViet).

## Cập nhật 2026-10-02 — đã tự cân bằng (chủ dự án giao quyền)
Sửa bot (mua ghế xen kẽ tuyến, giữ tiền nhập ghế, giao vé theo patienceRatio) và chỉnh `SEAT_COST_FACTOR` 0.8, sao `REFUSED_NO_STOCK` 4 / `REFUSED_CORRECT` 5, `PATIENCE_SCALE` 1.25. Với 200 seed: mọi chỉ số PLAN §13.3 đạt (PERFECT nâng cấp ngày 2, BKK ngày 11, TV20 4.6; AVERAGE nâng cấp ngày 3, BKK ngày 13, TV20 4.0, lỗ 15.9%, ghế ế 27.1%; POOR lưới AT 1). Chi tiết ở `docs/DECISIONS.md`. `QUIET=1 SEEDS=n npm run sim` in nhanh dòng METRICS; `npm run soak` kiểm bất biến 12.000 ngày ngẫu nhiên (0 lỗi).
