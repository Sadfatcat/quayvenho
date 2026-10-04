# 27: Khách đặc biệt và scripted moment

**What to build:** Domain đọc `PersonalConfig` và chèn đúng khách đặc biệt/scripted moment vào đúng ngày, đúng vị trí trong hàng, luôn phục vụ được (tự thêm ghế nếu thiếu, không tính tiền).

**Blocked by:** 26

**Status:** resolved

- [x] Khách đặc biệt thay đúng slot `atCustomerIndex` của đúng ngày; nếu vượt số khách trong ngày thì thành khách cuối
- [x] Không có ghế phù hợp: domain tự thêm ghế, không tính tiền, không ghi transaction chi
- [x] Làm sai đơn khách đặc biệt: không phạt, tối thiểu 3 sao, dùng thoại `fail` riêng
- [x] Ngày có khách đặc biệt/scripted moment không sinh thêm sự kiện ngẫu nhiên
- [x] Test đơn vị cho toàn bộ luật trên với `enabled = true` và dữ liệu giả lập

## Kết quả
- [x] `domain/personal.ts` (thuần, nhận `PersonalConfig` qua `Session.personal`/`GameSession(state, personal)`): chọn khách đặc biệt theo `day` + `atCustomerIndex` (vượt số khách → khách cuối, bỏ qua giới hạn hàng đợi), dựng đơn + hộ chiếu hợp lệ, tự thêm 1 ghế miễn phí (unitCost 0, không transaction) nếu chưa phục vụ được.
- [x] `scoring.ts`: khách đặc biệt không phạt, ≥3 sao, tip nhân `tipMultiplier` cả khi ECONOMY, `ScoreResult.specialId`.
- [x] Ngày có khách đặc biệt/scripted moment → sự kiện `NONE`.
- [x] `applyCustomRoutes` (data/personal.ts) đổi tên tuyến + `flavorText` (hiện ở mô tả thẻ tuyến trong Shop).
- [x] UI: thoại `arrive` dưới khách ở Quầy, `success`/`fail` dạng toast; scripted moments dùng bong bóng Béo ở Kho/Quầy/Tổng kết (một lần/lời).
- [x] 14 test trong `domain/personal.test.ts` (kể cả `enabled=false` giống hệt mặc định). `PERSONAL.enabled = false` nên game không đổi.
