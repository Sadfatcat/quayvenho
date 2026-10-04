# 15: Juice

**What to build:** Thêm hiệu ứng chuyển động (tween) cho các tương tác chính để game "đã tay" hơn — nút, ghế, vé, đồng xu, sao, rung màn khi có lỗi — vẫn giữ 60fps trên máy Android tầm trung.

**Blocked by:** 14

**Status:** resolved — chưa đo được 60fps trên Android thật (cần máy, thuộc ticket 23)

- [x] Tween cho: nhấn nút, chọn ghế, vé trượt ra khỏi máy in, đồng xu bay lên, sao hiện lần lượt
- [x] Rung màn hình nhẹ khi chấm điểm sai
- [ ] Đo được 60fps ổn định trên máy Android tầm trung khi các hiệu ứng chạy cùng lúc
- [x] Coin particle có pooling (yêu cầu bắt buộc duy nhất về hiệu năng theo PLAN §11.4)

## Kết quả
- [x] Nhấn nút: mặt nút lún xuống đáy (`ui/Button.ts`); chọn ghế: ghế "nảy" 1.2× (`SeatMapView`); vé trượt xuống từ máy in (`CounterScene.renderReadyToDeliver`); đồng xu bay lên (`ui/CoinBurst.ts`); sao Tổng kết hiện lần lượt (`SummaryScene.showStars`).
- [x] Rung màn hình 180ms khi POOR/FAILED/SOLD_INVALID/REFUSED_WRONG.
- [x] Coin có pooling theo scene (tối đa 6 xu/lần).
- [ ] Đo 60fps Android: chưa làm, cần máy thật (ticket 23).
