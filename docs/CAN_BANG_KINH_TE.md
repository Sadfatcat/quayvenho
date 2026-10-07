# Cân bằng kinh tế — nhật ký tự chạy

Ghi theo thứ tự: mỗi phương án gồm **quyết định**, **kết quả sim** và **đánh giá**. Phương án sau kế thừa phương án trước (cộng dồn) trừ khi ghi rõ bỏ.

## Yêu cầu của chủ dự án (đích)

1. Giữ nguyên lượng khách hiện tại (không đổi `BASE_CUSTOMERS_DAY_1`, `EARLY_GROWTH`, `LATE_GROWTH`, hệ số khách đầu game).
2. Biên lợi nhuận trên giá bán gốc: tuyến nội địa **15%**, tuyến quốc tế **25–30%** (hiện ~45–57% vì giá vốn thấp và lạm phát lệch giá/vốn).
3. Vẫn duy trì được sự phát triển của người chơi (mua nâng cấp, mở tuyến, thuê nhân viên).
4. TravelViet khó tăng hơn (khách khó tính hơn khi chấm sao), không đẩy game đi quá nhanh.
5. "Giàu vô lo" từ khoảng **ngày 50 trở đi**, không phải ngày 30. Quy ước đo: tiền median của bot AVERAGE đạt ≥ 300.000 xu (đủ mua hết nâng cấp, tuyến, nhân viên) quanh ngày 45–55.

## Cách đo

`DAYS=60 SEEDS=500 QUIET=1 npm run sim` in ba bot PERFECT / AVERAGE / POOR. Các dòng cần xem:
- `MILESTONES`: ngày đạt ngưỡng giàu (`richDay`), tiền và TravelViet median ở ngày 10, 20, … 70.
- `METRICS`: ngày mua nâng cấp đầu tiên, ngày mở Bangkok (`bkkDay`), TravelViet ngày 20, tỉ lệ ghế ế, tỉ lệ khách bỏ về.
- Bảng "tiền kiếm được trung bình mỗi 5 ngày" và "tăng trưởng mỗi 3 ngày".

Bot AVERAGE là đại diện cho người chơi bình thường; PERFECT là trần, POOR là sàn.

## Phương án A0 — chỉ đổi biên theo tuyến (100 seed, 60 ngày)

**Quyết định.** Bỏ `SEAT_COST_FACTOR`. Giá vốn mỗi vé = giá bán gốc × (1 − biên): nội địa 15%; quốc tế 25% (Bangkok), 27% (Seoul), 28% (Tokyo), 30% (Paris) (`SEAT_MARGIN_BY_ROUTE` trong `balance.ts`, tính ở `data/routes.ts`). Giữ nguyên mọi thứ khác (lạm phát +8% giá / +4% vốn mỗi 3 ngày, tip Business 0,8, phí hành lý).

**Kết quả.**

| Bot | Ngày giàu (≥300k) | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 17 | 63k | 1.2tr | 5.9tr | 13.6tr | 25.6tr | 42.4tr | 4.8 / 4.9 / 5 | 8 | 11 | 28.1% | 17.2% | 0.4% |
| AVERAGE | 30 | 35k | 63k | 312k | 1.3tr | 3.0tr | 6.0tr | 4.1 / 4.1 / 3.9 | 13 | 17 | 29.3% | 22.2% | 16.4% |
| POOR | không | 8k | 6k | 8k | 9k | 13k | 35k | 3.4 / 3.6 / 3.3 | — | không | 2.1% | 17.6% | 42.5% |

**Đánh giá.** Chưa đạt. Biên chỉ đúng ở ngày 1; lạm phát lệch (giá +8%, vốn +4%) đẩy biên thật lên ~53% ở ngày 50, nên tiền vẫn bùng nổ: AVERAGE giàu ở ngày 30 và 6 triệu ngày 60, PERFECT 42 triệu. Bot POOR gần như không phát triển (tiền ngày 60 chỉ 35k, lưới an toàn kích hoạt 11 lần). Tiếp theo: cho vốn tăng cùng tốc độ với giá bán và giảm tip Business.

## Phương án B — vốn lạm phát cùng giá bán + giảm tip Business (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên A0: `COST_RISE_PER_STEP` 0,04 → 0,08 (bằng `FARE_RISE_PER_STEP`, biên không còn phình theo thời gian) và `BUSINESS_TIP_RATIO` 0,8 → 0,2 (tip Business từng bằng 80% giá vé, lớn hơn cả biên mục tiêu).

**Kết quả.**

| Bot | Ngày giàu (≥300k) | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 23 | 56k | 189k | 1.2tr | 3.2tr | 5.4tr | 7.5tr | 4.6 / 4.9 / 5 | 11 | 15 | 26.7% | 15.7% | 12.2% |
| AVERAGE | không | 31k | 46k | 64k | 98k | 132k | 167k | 4.1 / 4 / 4 | — | không | 8.9% | 23.4% | 34.9% |
| POOR | không | 7k | 5k | 6k | 7k | 6k | 8k | 3.5 / 3.7 / 3.7 | — | không | 0.2% | 19.8% | 45.6% |

**Đánh giá B.** Chưa đạt, và lệch hai phía: PERFECT vẫn giàu từ ngày 23 (7,5 triệu ngày 60) còn AVERAGE không bao giờ mua được nâng cấp, không mở Bangkok, 35% ngày lãi âm và chỉ 167k ngày 60. Biên 15% quá mỏng so với ghế ế và phạt của người chơi thường, trong khi người chơi giỏi hưởng thêm (a) giá bán +15–30%, (b) TravelViet 4,9 kéo thêm khách thưởng sao. Hướng tiếp: làm TravelViet khó tăng và chậm đổi (cửa sổ tính điểm hiện chỉ 30 khách ≈ 1 ngày) để thu hẹp khoảng cách PERFECT/AVERAGE.

## Phương án C — TravelViet khó và chậm đổi (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên B: `TRAVELVIET_WINDOW` 30 → 200 khách (điểm là trung bình 200 đánh giá gần nhất, ≈ 5–6 ngày, thay vì chưa đầy 1 ngày; schema save dùng chung hằng này), `PERFECT_MIN_SPEED` 0,5 → 0,7 (phải giao nhanh hơn mới được 5 sao) và `ACCURACY_GOOD` 80 → 85.

**Kết quả.**

| Bot | Ngày giàu (≥300k) | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 22 | 56k | 232k | 1.4tr | 3.3tr | 5.8tr | 8.7tr | 4.7 / 4.9 / 4.8 | 11 | 15 | 25.3% | 16.7% | 10.7% |
| AVERAGE | không | 31k | 45k | 70k | 96k | 127k | 165k | 3.7 / 3.8 / 3.8 | — | không | 8.6% | 23% | 34.4% |
| POOR | không | 7k | 5k | 5k | 7k | 5k | 7k | 3.5 / 3.6 / 3.7 | — | không | 0.2% | 19.1% | 45.3% |

**Đánh giá C.** TravelViet của AVERAGE giảm 4,1 → 3,7–3,8 (sát ngưỡng 3,5 làm khách giảm một nửa), nhưng PERFECT vẫn 4,7–4,9 vì bot giao với 80% kiên nhẫn còn lại, vượt ngưỡng 0,7. Tiền gần như không đổi so với B. Chẩn đoán gốc: ROI vận hành (lãi / vốn mua ghế) của AVERAGE chỉ còn ~4% (PERFECT ~20%, POOR ~3%) vì biên 15% bị ghế ế, vé hỏng (POOR không thu tiền, FAILED bị phạt) và phạt ăn hết, nên người chơi thường không tích lũy được. Cần nâng hiệu quả cho người chơi thường mà không đụng biên danh nghĩa: hoàn một phần tiền ghế ế, giảm mức phạt, bỏ ngưỡng quá chặt của `ACCURACY_GOOD`, tăng tốc lạm phát đồng đều giá/vốn.

## Phương án D — hoàn tiền ghế ế, phạt nhẹ hơn, lạm phát 10% đồng đều, 5 sao khó hơn (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên C: hoàn 25% giá vốn ghế ế mặc định (`BASE_MODIFIERS.refundRate` 0 → 0,25; nâng cấp Chính sách hoàn tiền 0,3 → 0,5); tỉ lệ phạt theo giá vé giảm (FAILED 0,25, SOLD_INVALID 0,4, REFUSED_WRONG 0,2, LEFT 0,1); lạm phát giá và vốn cùng +10% mỗi 3 ngày (biên không đổi); `PERFECT_MIN_SPEED` 0,85 (muốn 5 sao phải giao rất nhanh), `ACCURACY_GOOD` về 80.

**Kết quả.**

| Bot | Ngày giàu (≥300k) | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 27 | 59k | 110k | 500k | 1.3tr | 2.9tr | 5.6tr | 4.2 / 4.2 / 4.2 | 11 | 15 | 15.1% | 1.2% | 3.4% |
| AVERAGE | không | 35k | 57k | 88k | 129k | 192k | 260k | 3.7 / 3.8 / 3.8 | — | không | 10.5% | 23.9% | 32.8% |
| POOR | không | 11k | 7k | 8k | 12k | 11k | 14k | 3.5 / 3.6 / 3.7 | — | không | 0.4% | 18.5% | 45.3% |

**Đánh giá D.** Gần hơn nhưng chưa đạt. Lạm phát đồng đều giữ biên đúng như yêu cầu; ROI vận hành của AVERAGE chỉ ~4,7% còn PERFECT ~22% (chênh gần 5 lần). Phần lớn khoảng cách đến từ chỉnh giá: biên nội địa chỉ 15% nên bán +15–30% là gần như nhân đôi lãi trên mỗi vé, người chơi giỏi hưởng hết, người thường thì không. Cũng ghi nhận: metric "giàu theo tiền mặt" gây hiểu nhầm vì bot dồn gần hết tiền vào vốn mua ghế mỗi ngày (AVERAGE có 260k mà không mua nâng cấp vì phải giữ vốn cho ngày sau); từ phương án E dùng thêm "ngày lãi tích luỹ đạt 300k" (một seed đã kiếm đủ để mua hết cửa hàng) làm thước đo chính. Quyết định tiếp: thu hẹp quyền lực của chỉnh giá (trần +20%, tối đa +40%) và đặt lại các chiến lược giá của bot cho khớp.

## Phương án E — thu hẹp chỉnh giá (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên D: `PRICE_CAP_PCT` 30 → 20, `PRICE_MAX_PCT` 60 → 40. Bot: PERFECT +10% ngày thường / +20% ngày lễ, AVERAGE +5% cố định, POOR +30% (vượt trần mới) ở ngày lễ.

**Kết quả.**

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 25 / 27 | 59k | 110k | 443k | 1.2tr | 2.5tr | 4.8tr | 4.2 / 4.2 / 4.2 | 11 | 15 | 14.7% | 1.7% | 4.2% |
| AVERAGE | không / không | 35k | 55k | 80k | 121k | 174k | 240k | 3.7 / 3.8 / 3.8 | — | không | 8.6% | 25.8% | 32.6% |
| POOR | không / không | 11k | 7k | 8k | 11k | 10k | 16k | 3.5 / 3.6 / 3.7 | — | không | 0.4% | 18.6% | 45.2% |

**Đánh giá E.** Gần như không đổi so với D (PERFECT giàu ngày 25, AVERAGE chưa đủ 300k lãi tích luỹ ngày 60): chỉnh giá không phải nguồn chênh lệch chính. Điểm nghẽn thật: phí hành lý/dịch vụ là doanh thu thuần (không có giá vốn) nhưng cố định 300–530 xu trong khi giá vé tăng 10% mỗi 3 ngày, nên tỉ trọng của chúng co dần và lãi người chơi thường chỉ còn đúng biên mỏng 15%. Quyết định tiếp: cho phí hành lý và vé dịch vụ lạm phát cùng bậc với giá vé (`scaledFee` trong `economy.ts`; màn quầy hiện phí đã nhân lạm phát).

## Phương án F — phí dịch vụ lạm phát cùng giá vé (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên E: phí hành lý (300/380/530) và vé dịch vụ (80/0/230) nhân `(1 + FARE_RISE_PER_STEP)^bậc` giống giá vé.

**Kết quả.**

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 22 / 25 | 62k | 161k | 616k | 1.6tr | 3.4tr | 6.5tr | 4.2 / 4.2 / 4.2 | 10 | 14 | 15.1% | 1.7% | 2.4% |
| AVERAGE | 55 / 58 | 38k | 62k | 99k | 156k | 234k | 321k | 3.7 / 3.8 / 3.7 | 32 | không | 15.3% | 27.8% | 32.3% |
| POOR | không / không | 12k | 9k | 11k | 15k | 18k | 21k | 3.4 / 3.5 / 3.6 | — | không | 0.6% | 16.8% | 44.6% |

**Đánh giá F.** Tiến bộ rõ: AVERAGE đạt 300k lãi tích luỹ ở ngày 55 (tiền mặt ngày 58), sát mục tiêu "giàu từ ngày 50". Còn lệch: (1) PERFECT giàu từ ngày 22 vì khoảng cách kỹ năng: biên 15% khuếch đại chênh lệch (AVERAGE mất ~28% khách do hàng chờ đầy và ~10% do vé hỏng nên gần như chỉ đủ hoà vốn), chấp nhận vì PERFECT là bot lý tưởng không sai và không chậm; (2) Bangkok không mở được cho AVERAGE vì TravelViet 3,7 < ngưỡng 3,8 (TravelViet khó hơn nên các ngưỡng mở tuyến cần dịch xuống); (3) POOR vẫn kích hoạt lưới an toàn 14 lần/60 ngày. Quyết định tiếp: dịch ngưỡng TravelViet mở tuyến xuống 0,3 (Bangkok 3,5 / Seoul 3,7 / Tokyo 3,9 / Paris 4,1), hoàn tiền ghế ế mặc định 0,4 (nâng cấp 0,7) để người chơi thường bớt đau khi ghế ế.

## Phương án G — ngưỡng TravelViet mở tuyến thấp hơn, hoàn tiền ghế ế nhiều hơn (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên F: `minTravelViet` mở tuyến Bangkok 3,8 → 3,5, Seoul 4,0 → 3,7, Tokyo 4,2 → 3,9, Paris 4,5 → 4,1; hoàn 40% giá vốn ghế ế mặc định, nâng cấp Chính sách hoàn tiền 0,7.

**Kết quả.**

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 21 / 24 | 62k | 147k | 769k | 2.1tr | 4.9tr | 9.5tr | 4.2 / 4.2 / 4.1 | 10 | 13 | 15.5% | 1.6% | 1.7% |
| AVERAGE | 53 / 55 | 40k | 63k | 106k | 175k | 258k | 358k | 3.7 / 3.8 / 3.7 | 22 | không | 17.7% | 28.9% | 29.9% |
| POOR | không / không | 12k | 8k | 11k | 15k | 17k | 22k | 3.4 / 3.5 / 3.6 | — | không | 0.7% | 16.9% | 44.1% |

## Phương án G chạy 500 seed (kết quả chính thức của bản hiện tại)

Cấu hình = A0 + B + C + D + E + F + G (tóm tắt: biên 15% nội địa / 25–30% quốc tế; vốn và giá lạm phát +10% mỗi 3 ngày đồng đều; phí dịch vụ lạm phát theo; tip Business 0,2; phạt nhẹ hơn; hoàn 40% tiền ghế ế; TravelViet tính trên 200 khách gần nhất, 5 sao cần giao còn ≥85% kiên nhẫn; trần giá +20%, tối đa +40%; ngưỡng TravelViet mở tuyến 3,5 / 3,7 / 3,9 / 4,1). Lượng khách giữ nguyên.

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 21 / 24 | 61k | 147k | 763k | 2.2tr | 4.9tr | 9.5tr | 4.2 / 4.2 / 4.2 | 10 | 13 | 15.4% | 1.6% | 1.4% |
| AVERAGE | 53 / 56 | 40k | 66k | 104k | 167k | 252k | 347k | 3.7 / 3.7 / 3.7 | 20 | không | 17.4% | 29% | 30.5% |
| POOR | không / không | 11k | 8k | 11k | 14k | 16k | 22k | 3.4 / 3.5 / 3.6 | — | không | 0.6% | 17% | 44.2% |

**Đánh giá G (500 seed).** Đạt phần lớn yêu cầu cho người chơi thường: AVERAGE đủ lãi tích luỹ để mua hết cửa hàng ở ngày 53 và có 300k tiền mặt ở ngày 56 ("giàu vô lo từ ngày 50 trở đi"), mua nâng cấp đầu ngày 20, TravelViet ổn định 3,7 (khó hơn bản cũ, PERFECT giảm 4,8 → 4,2). Chưa hài lòng: (1) PERFECT vẫn giàu từ ngày 21–24; khoảng cách PERFECT/AVERAGE lớn một phần vì AVERAGE bị từ chối 29% khách do hàng chờ đầy (hàng chờ 6), trong khi PERFECT chỉ 1,6%; (2) POOR không tích luỹ. Hướng tiếp: nới sức chứa hàng chờ cơ bản để người chơi thường bán được nhiều hơn (thu hẹp khoảng cách), rồi giảm tốc lạm phát cho cả ba để lùi thời điểm giàu của PERFECT.

## Phương án H — hàng chờ rộng hơn (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên G: sức chứa hàng chờ cơ bản 6 → 8, nâng cấp Quầy rộng 10 → 12.

**Kết quả.**

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 21 / 25 | 62k | 147k | 776k | 2.2tr | 5.0tr | 9.8tr | 4.2 / 4.2 / 4.2 | 10 | 13 | 15% | 0.9% | 1.7% |
| AVERAGE | 50 / 52 | 44k | 69k | 115k | 186k | 284k | 383k | 3.7 / 3.8 / 3.7 | 17 | không | 16.3% | 23.3% | 28.6% |
| POOR | không / không | 12k | 8k | 11k | 13k | 14k | 22k | 3.4 / 3.6 / 3.7 | — | không | 0.5% | 13.1% | 44.5% |

**Đánh giá H.** AVERAGE 50/52 (đúng mục tiêu), khách bị từ chối 29% → 23%. PERFECT gần như không đổi (giàu ngày 21–25): khoảng cách chủ yếu do bot AVERAGE chậm tay và sai nhiều, không phải do kinh tế. Quyết định tiếp: giúp người chơi yếu có đà ở đầu game bằng ân hạn phạt (10 ngày đầu phạt ×0,5) rồi xem POOR có mua được nâng cấp và bớt phải nhờ lưới an toàn không.

## Phương án J — ân hạn phạt 10 ngày đầu (100 seed, 60 ngày)

**Quyết định.** Cộng dồn lên H: ngày 1–10 mức phạt nhân 0,5 (`PENALTY_GRACE_UNTIL_DAY`, `PENALTY_GRACE_MULT` trong `balance.ts`, áp trong `penaltyFor`).

**Kết quả.**

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 21 / 25 | 62k | 147k | 776k | 2.2tr | 5.0tr | 9.8tr | 4.2 / 4.2 / 4.2 | 10 | 13 | 15% | 0.9% | 1.7% |
| AVERAGE | 49 / 52 | 45k | 68k | 115k | 186k | 280k | 399k | 3.7 / 3.7 / 3.7 | 16 | không | 16.2% | 23.1% | 28.8% |
| POOR | không / không | 18k | 10k | 11k | 13k | 15k | 23k | 3.3 / 3.6 / 3.7 | — | không | 0.7% | 13% | 44.3% |

## Kết quả chính thức: phương án J chạy 500 seed, 60 ngày

Cấu hình = A0 → J cộng dồn (xem các mục trên): biên 15% nội địa / 25–30% quốc tế; giá và vốn lạm phát +10% mỗi 3 ngày; phí dịch vụ lạm phát theo; tip Business 0,2; phạt nhẹ + ân hạn 10 ngày đầu; hoàn 40% tiền ghế ế; TravelViet 200 khách và 5 sao cần giao còn ≥85% kiên nhẫn; trần giá +20% / tối đa +40%; ngưỡng mở tuyến 3,5 / 3,7 / 3,9 / 4,1; hàng chờ 8 (nâng cấp 12). Lượng khách giữ nguyên.

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 21 / 24 | 62k | 147k | 765k | 2.2tr | 5.0tr | 9.8tr | 4.2 / 4.2 / 4.2 | 10 | 13 | 14.9% | 0.9% | 1.4% |
| AVERAGE | 49 / 52 | 45k | 69k | 114k | 186k | 287k | 391k | 3.7 / 3.7 / 3.7 | 16 | không | 16.2% | 23% | 28.8% |
| POOR | không / không | 18k | 9k | 11k | 14k | 15k | 21k | 3.3 / 3.6 / 3.7 | — | không | 0.7% | 12.8% | 44.2% |

## Kiểm chứng thêm: bot có thuê nhân viên (`HIRE=1`, 100 seed, 60 ngày)

Mục đích: xem người chơi "nghèo đi" sau khi thuê nhân viên như chủ dự án dự đoán. Cùng cấu hình J.

| Bot | Giàu theo lãi tích luỹ (≥300k) / theo tiền mặt | Tiền ngày 10 | 20 | 30 | 40 | 50 | 60 | TravelViet ngày 20 / 40 / 60 | Nâng cấp đầu | Mở BKK | Ghế ế | Khách bỏ về | Ngày lãi âm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFECT | 21 / 29 | 62k | 113k | 346k | 835k | 1.7tr | 2.7tr | 4.2 / 4 / 4 | 10 | 13 | 10.1% | 1.3% | 15.3% |
| AVERAGE | 49 / 52 | 45k | 68k | 115k | 182k | 277k | 387k | 3.7 / 3.7 / 3.7 | 16 | không | 15.3% | 23.2% | 29.3% |
| POOR | không / không | 18k | 10k | 11k | 13k | 15k | 23k | 3.3 / 3.6 / 3.7 | — | không | 0.7% | 13% | 44.3% |

## Kết luận (dừng ở phương án J)

**Đạt.**
- Lượng khách giữ nguyên (chỉ thêm đoạn làm mềm cú nhảy ngày 11, ngày 1–10 chỉ tăng).
- Biên danh nghĩa 15% nội địa, 25–30% quốc tế và giữ cố định theo thời gian (lạm phát giá = lạm phát vốn).
- Người chơi thường (AVERAGE) đủ lãi tích luỹ để mua hết cửa hàng ở **ngày 49** và có 300k tiền mặt ở **ngày 52**: đúng yêu cầu "giàu vô lo từ ngày 50 trở đi" (trước đây ngày 30). Tiền ngày 30 của AVERAGE chỉ còn 114k (trước 800k+).
- TravelViet khó và chậm đổi: tính trên 200 khách gần nhất, 5 sao cần giao rất nhanh, nên PERFECT từ 4,8 xuống 4,2 và AVERAGE từ 4,1 xuống 3,7; không còn thưởng khách ≥ 4,5 đẩy game đi quá nhanh.
- Khi thuê nhân viên người chơi giỏi nghèo đi đúng dự đoán: PERFECT còn 2,7 triệu ngày 60 (9,8 triệu nếu không thuê).

**Chưa đạt hẳn / cần chủ dự án quyết.**
- PERFECT (bot lý tưởng không sai, không chậm) vẫn đủ lãi để mua hết cửa hàng ở ngày 21 (ngày 29 nếu thuê nhân viên). Chênh lệch PERFECT/AVERAGE (~20 lần lãi/ngày ở ngày 30) chủ yếu do kỹ năng và tốc độ phục vụ (bot AVERAGE mất 23% khách do hàng chờ đầy), không phải do công thức kinh tế. Nếu người chơi thật giống PERFECT hơn AVERAGE thì cần giảm tốc lạm phát (`FARE_RISE_PER_STEP`/`COST_RISE_PER_STEP` 0,10 → 0,07–0,08, AVERAGE sẽ giàu quanh ngày 58–62) hoặc nâng giá cửa hàng.
- Bot POOR (35% lỗi nhỏ, 15% lỗi lớn, hay bỏ khách) không tích luỹ: tiền ngày 60 chỉ 21k, lưới an toàn kích hoạt nhiều. Coi là sàn; ân hạn phạt 10 ngày đầu chỉ giúp ngày 10 (18k thay 11k).
- Bangkok chưa mở trong 60 ngày với AVERAGE vì bot dồn gần hết tiền vào vốn mua ghế mỗi ngày (hành vi của bot), không phải do ngưỡng TravelViet.
- Thước đo "tiền mặt" của sim gồm cả vốn lưu động; dùng cột "lãi tích luỹ" khi so sánh.

**Cách chạy lại.** `DAYS=60 SEEDS=500 QUIET=1 npm run sim` (khoảng 7–8 phút); thêm `HIRE=1` để bot thuê nhân viên.

## Phương án K — vé 3 ngày + khách đầu game + hạ biên (400 seed, 40 ngày)

Gộp ba thay đổi (xem `docs/DECISIONS.md` 2026-10-07). Ghế 3 ngày làm ghế ế gần về 0 nên thu nhập tăng mạnh; để bù, biên giảm và khách ngày 1–7 tăng.

| Cấu hình | AVERAGE ngày 10 | AVERAGE ngày 40 | Bangkok (AVERAGE) | PERFECT ngày 40 | POOR lưới an toàn |
|---|---|---|---|---|---|
| Mốc trước (biên 15/25–30%, chưa có khách thêm) | 50,6k | 550k | ngày 17 | 6,45 triệu | 8 |
| Biên 15% + khách thêm | 48,8k | 555k | ngày 17 | 6,47 triệu | 7 |
| **Biên 12/22–27% + khách thêm (chọn)** | **47,6k** | **453k** | **ngày 19** | **5,91 triệu** | **9** |
| Biên 10/20–25% | 43,1k | 394k | ngày 21 | 5,57 triệu | 10 |
| Biên 8/18–23% | 39,4k | 345k | ngày 24 | 5,14 triệu | 11 |

Đánh giá: chọn biên 12% vì AVERAGE vẫn trong ±25% mốc cũ. Tồn tại: PERFECT giàu từ ngày 18 (chưa đạt mục tiêu ≥ 23), POOR vẫn nhờ lưới an toàn 9 lần. Khách thêm ngày 1–4 không đổi thu nhập đầu game vì bị chặn bởi vốn và tốc độ phục vụ.
