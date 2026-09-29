# STATUS

- Giai đoạn hiện tại: 4 — Title, Onboarding, Kho, Tổng kết, Lưu game
- **Tạm dừng theo yêu cầu chủ dự án giữa bước 4.5. Xem `docs/HANDOFF.md` để biết thiết kế đã chốt và bước tiếp theo.**
- Đã xong trong Giai đoạn 4:
  - 4.1 Lưu trữ an toàn (`save/storage.ts`, `schema.ts`, `migrate.ts`) — round-trip, JSON hỏng → backup, version tương lai, clamp giá trị bẩn
  - 4.2 Khoá tab (`save/tabLock.ts`, BroadcastChannel)
  - 4.3 Boot/Preload/Title thật, thay bootstrap cố định của Giai đoạn 3
  - 4.4 OnboardingScene + `ui/TextInput.ts` (input HTML thật qua Phaser DOMElement)
  - typecheck/lint/test(123)/build đều xanh sau mỗi bước
- Đang dở: 4.5 Kho (PrepScene) — đã có `ui/Stepper.ts` và `strings.prep.*`, chưa viết `PrepScene.ts`. Thiết kế đầy đủ (layout, công thức giới hạn stepper, 3 hộp thoại "Mở cửa", cách re-render) đã ghi trong `docs/HANDOFF.md`.
- Còn lại: 4.6 (SummaryScene), 4.7 (nối mốc lưu vào sessionBridge), 4.R (Review)
- Từ giai đoạn 0 còn chờ: Cloudflare Pages (đã xác nhận điện thoại xem được qua `dev:host`)
- Bước tiếp theo: viết `src/scenes/PrepScene.ts` theo thiết kế trong `docs/HANDOFF.md`
