# HANDOFF — phiên làm việc đã chạm giới hạn quota

Ghi lúc: đang ở Giai đoạn 3 (Review xong), chuẩn bị Giai đoạn 4. Session limit reset lúc 12:50 sáng (giờ Bangkok) — mở lại phiên mới sau giờ đó, hoặc dùng `/loop` lại.

## Đã làm xong (đã commit + push lên `Sadfatcat/quayvenho`, nhánh `main`)

- **Giai đoạn 0 — Nền móng**: scaffold Vite+Phaser+TS, ESLint chặn domain lẫn UI, CI, deploy CLoudflare Pages **chưa làm** (còn nợ, xem mục "Còn thiếu" bên dưới).
- **Giai đoạn 1 — Domain core**: toàn bộ logic game thuần TypeScript trong `src/domain/`, 111 test, coverage 99%/94%. Không còn việc gì ở đây trừ khi PLAN đổi.
- **Giai đoạn 2 — Bộ UI dùng chung**: Button, Panel, IconLabel, BaseOverlay/DialogOverlay/Toast, DragController/ScrollList/ProgressBar, FloatingText/CountUpText, sessionBridge, visibility, PauseOverlay, PlaygroundScene (`?playground`, chỉ DEV).
- **Giai đoạn 3 — Quầy grey box**: `CounterScene` chơi được trọn một ngày (bootstrap cố định, bỏ qua Onboarding/Kho theo đúng scope). Đã kiểm bằng Playwright: chơi tay 1 khách hoàn chỉnh (đúng luồng 4 bước → in vé → kéo giao vé → PERFECT), chạy hết ngày 1 tới tổng kết không vỡ, quay lại bước trước, màn chờ khách hiện danh sách chỉ đọc. 0 lỗi console.
- **Sửa 2 lỗi thật do người dùng báo lại** (không phải trong ROADMAP nhưng quan trọng):
  1. `dev:host` đổi từ HTTPS tự ký sang HTTP thường — chứng chỉ cũ chỉ hợp lệ cho `localhost`, Safari trên điện thoại từ chối thẳng khi gọi qua địa chỉ LAN.
  2. `main.ts` bỏ top-level await (một số trình duyệt điện thoại không hỗ trợ, gây màn đen im lặng); lỗi nạp PlaygroundScene giờ không còn chặn được game thật nữa.
  3. Một bug thật trong `ScrollList`: tính vùng cắt hình bằng toạ độ TRƯỚC khi được gắn vào container cha, khiến danh sách bị ẩn mất — đã sửa bằng cách hoãn tính sang đúng 1 khung hình sau.
- Chủ dự án đã tự xác nhận xem được trên điện thoại thật qua `dev:host`.

## Đang dở / chưa commit

Không có gì dở — mọi thay đổi tính tới lúc viết file này đã ở trong 3 commit cuối (`d33814b` trở về trước) và đã push. Nếu khi đọc file này mà `git status` cho thấy còn thay đổi chưa commit trong `docs/ROADMAP.md` (mục Registry cập nhật TopBar/sessionBridge/SpeechBubble/StepIndicator/FlightList/PatienceBar/debug hook thành "xong"), hãy commit nốt trước khi làm gì khác — nội dung đã đúng, chỉ chưa kịp `git commit`.

## Còn thiếu / cần làm tiếp theo

1. **Giai đoạn 0 còn nợ**: chưa thật sự deploy lên Cloudflare Pages (chỉ mới hướng dẫn trong README). Cần chủ dự án có tài khoản Cloudflare.
2. **Giai đoạn 4 — Title, Onboarding, Kho, Tổng kết, Lưu game** (bước tiếp theo, xem chi tiết đầy đủ trong `docs/ROADMAP.md`):
   - 4.1 `save/storage.ts`, `schema.ts` (zod), `migrate.ts`
   - 4.2 `save/tabLock.ts` (BroadcastChannel)
   - 4.3 `BootScene`/`PreloadScene`/`TitleScene` thật — **quan trọng: phải xoá bootstrap cố định (`BOOTSTRAP_SEED`, `bootstrapFixedSession`) trong `src/scenes/BootScene.ts`**, thay bằng luồng thật: có save → nạp qua `sessionBridge.start()`; không có save → sang Onboarding.
   - 4.4 `OnboardingScene` (nhập tên người chơi + thương hiệu, `ui/TextInput.ts` chưa có)
   - 4.5 `PrepScene` (Kho) — tái dùng `TopBar` (đổi `leftLabel` sang "Ngày {n}", `icon` sang `STRINGS.common.settingsIcon`), thêm `ui/Stepper.ts`
   - 4.6 `SummaryScene` thật (tái dùng cấu trúc `lines` trong `CounterScene.showDaySummary`, thêm `CountUpText`)
   - 4.7 Nối mốc lưu theo PLAN §6.6, kiểm acceptance Phase 3 trong PLAN §12
   - 4.R Review giai đoạn 4
3. **Ghi chú kỹ thuật cần đọc trước khi làm Giai đoạn 4** — đã ghi đầy đủ trong `docs/ROADMAP.md` mục "Ghi chú review (từ 3.R)", tóm tắt:
   - `TopBar` khi dùng ở Kho: đổi `leftLabel`→"Ngày {n}", `icon`→⚙, `onIconTap`→mở SettingsOverlay (chưa có, làm ở 5.6) thay vì PauseOverlay.
   - `FlightList` đã có cờ `readOnly`, tái dùng nếu Shop/Kho cần xem-trước.
   - `src/dev/debug.ts` (expose `window.__sessionBridge`) rất hữu ích để test bằng Playwright: đọc thẳng state thay vì đoán toạ độ pixel — nên tiếp tục dùng cách này ở các giai đoạn sau.
   - Sau Giai đoạn 4, theo CLAUDE.md: **đổi schema save sau khi Phase 3 (~Giai đoạn 4) xong phải hỏi chủ dự án trước**.
4. **Sau Giai đoạn 4**: Giai đoạn 5 (Shop, cơ chế theo ngày, sự kiện, TravelViet, Cài đặt, `scripts/sim.ts`), 6 (art/audio/tutorial), 7 (PWA/mobile hardening), 8 (cá nhân hoá) — theo đúng thứ tự trong ROADMAP, không nhảy giai đoạn.

## Vòng lặp tự động

Đã đặt cron job `bb6ce570` (cứ phút thứ 3/23/43 mỗi giờ, tự nhắc tiếp tục ROADMAP) theo yêu cầu chủ dự án. **Job này chỉ tồn tại trong phiên hiện tại (session-only) — khi phiên đóng, job mất, không tự chạy lại được.** Nếu mở phiên mới, cần đặt lại `/loop` nếu muốn tiếp tục tự động.

## Việc chủ dự án cần làm để tiếp tục

1. Đọc `docs/STATUS.md` và `docs/ROADMAP.md` (mục Ghi chú review 3.R) trước khi giao tiếp tục.
2. Nếu muốn tiếp tục tự động: mở phiên Claude Code mới, gõ lại `/loop` hoặc yêu cầu tương tự, hoặc chỉ cần nói "tiếp tục Giai đoạn 4".
3. Chưa cần quyết định gì thêm ở giai đoạn 4 — mọi thứ đã rõ trong ROADMAP. Chỉ cần duyệt kết quả sau khi xong.
