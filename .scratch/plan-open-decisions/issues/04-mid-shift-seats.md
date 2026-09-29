# D4 — Cho mua thêm ghế trong ca (OPEN), giá đắt hơn?

Type: grilling
Status: open

## Question

PLAN §15 D4: "Có cho mua thêm ghế trong ca (OPEN) không, với giá đắt hơn?" Phương án mặc định nếu "tuỳ bạn": **Không**.

Code hiện tại (`src/domain/dayCycle.ts`) đã build đúng theo mặc định: lệnh `PREP_SET_QTY`/`PREP_CONFIRM_PURCHASE` chỉ hợp lệ khi `state.phase === 'PREP'`, không có đường nào mua ghế trong `OPEN`/`CLOSING`.

Nếu câu trả lời là **có cho phép**: cần thêm command mới (ví dụ `OPEN_BUY_SEAT`), giá phụ thu, và một chỗ trong CounterScene (Giai đoạn 3, đã xong) để thao tác — ảnh hưởng domain đã có test lẫn UI đã có Playwright-verify, nên đổi câu trả lời ở đây kéo theo việc sửa lại phần đã hoàn thành, không chỉ thêm mới.

Nếu giữ mặc định (Không): chỉ ghi nhận vào DECISIONS.md.
