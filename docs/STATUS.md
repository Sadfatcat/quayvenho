# STATUS

- Giai đoạn hiện tại: 4 — DONE (Review xong, chờ chủ dự án duyệt trước khi sang Giai đoạn 5)
- Đã xong toàn bộ Giai đoạn 4 (7 bước + Review):
  - 4.1 Lưu trữ an toàn (`save/storage.ts`, `schema.ts`, `migrate.ts`) — round-trip, JSON hỏng → backup + toast, version tương lai, clamp giá trị bẩn, kiểm localStorage khả dụng + `navigator.storage.persist()` lúc Boot
  - 4.2 Khoá tab (`save/tabLock.ts`) — đúng giao thức HELLO/ALIVE/TAKEOVER PLAN §9.5, đã kiểm bằng 2 tab trình duyệt thật
  - 4.3 Boot/Preload/Title thật — "Chơi tiếp"/"Chơi mới" đúng luật, thay bootstrap cố định của Giai đoạn 3
  - 4.4 OnboardingScene + `ui/TextInput.ts` (input HTML thật qua Phaser DOMElement)
  - 4.5 Kho (PrepScene) + `ui/Stepper.ts` — mua ghế, chiết khấu, giới hạn theo ghế+tiền, 3 nhánh "Mở cửa"
  - 4.6 SummaryScene thật (CountUpText, chạm bỏ qua hiệu ứng, mẹo Béo khi lỗ, giới thiệu TravelViet cuối ngày 10)
  - 4.7 Nối mốc lưu vào `sessionBridge` đúng PLAN §6.6 (7 mốc, không lưu giữa OPEN/CLOSING)
  - 4.R Review: code-reviewer subagent bắt 4 vấn đề thật (key localStorage sai tên, tabLock thiếu giao thức TAKEOVER, thiếu kiểm localStorage/persist, bug skip hiệu ứng Tổng kết) — đã sửa cả 4; tự phát hiện thêm 1 bug khi tự kiểm Playwright (overlay khoá tab không bấm được nút) — đã sửa
  - typecheck/lint/test(123)/build đều xanh
  - Kiểm bằng Playwright ở 360×640 và 430×932: trọn luồng Onboarding→Kho→Quầy→Tổng kết→Kho ngày 2, refresh giữ tiến trình, JSON hỏng tự khôi phục, mở 2 tab thật (TAKEOVER hoạt động đúng) — 0 lỗi console
- Từ giai đoạn 0 còn chờ: Cloudflare Pages (đã xác nhận điện thoại xem được qua `dev:host`)
- Bước tiếp theo: Giai đoạn 5 — Shop, cơ chế theo ngày, sự kiện, TravelViet, Lưới an toàn, Cài đặt, `scripts/sim.ts` (xem `docs/ROADMAP.md`, và 11 quyết định còn mở ở `.scratch/plan-open-decisions/`)
