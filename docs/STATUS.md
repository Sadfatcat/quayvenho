# STATUS

- Giai đoạn hiện tại: 3 — Quầy grey box (Review xong, chờ chủ dự án)
- **Phiên làm việc đã chạm giới hạn quota. Xem `docs/HANDOFF.md` để biết chi tiết và bước tiếp theo.**
- Đã xong giai đoạn 3:
  - 7 bước ROADMAP + Review: CounterScene chơi được trọn ngày 1 (bootstrap cố định, bỏ qua Onboarding/Kho theo đúng scope giai đoạn)
  - 9 UI component mới: TopBar (dùng ở Quầy), SpeechBubble, PatienceBar, StepIndicator (có quay lại bước trước), FlightList (có chế độ chỉ đọc), SeatMapView, BaggageSlider, ExtrasToggles, TicketView
  - Thêm `src/dev/debug.ts` (expose sessionBridge ra `window`, chỉ DEV) để test qua Playwright bằng cách đọc thẳng state
  - typecheck/lint/test(111)/build đều xanh
  - Kiểm bằng Playwright ở 360×640 và 430×932: chơi tay 1 khách trọn vẹn (4 bước → in vé → kéo giao vé → PERFECT, doanh thu khớp), chạy hết ngày 1 tới màn tổng kết không vỡ, quay lại bước trước, màn chờ khách hiện danh sách chỉ đọc — 0 lỗi console
  - code-reviewer: 2 P1 (StepIndicator không bấm lùi được, màn EMPTY thiếu Bước A chỉ đọc) + 1 P3 (TopBar viết sẵn nhưng không dùng) — đã sửa cả 3, đã kiểm lại bằng Playwright
  - Tự phát hiện và sửa 1 bug thật: ScrollList tính vùng cắt hình bằng toạ độ trước khi được gắn vào container cha, làm danh sách bị ẩn
- Từ giai đoạn 0 còn chờ: Cloudflare Pages (đã xác nhận điện thoại xem được qua `dev:host`)
- Bước tiếp theo: Giai đoạn 4, bước 4.1 (save/storage.ts) — xem `docs/HANDOFF.md`
