# 10: Cài đặt (SettingsOverlay)

**What to build:** Một overlay Cài đặt thật (thay vì nút ⚙ hiện đang tạm mở PauseOverlay), cho đổi âm lượng nhạc/hiệu ứng và bật/tắt rung, lưu ngay khi đổi.

**Blocked by:** 04

**Status:** resolved

- [x] `ui/Toggle.ts`, `ui/Slider.ts` mới (kiểm tra chưa có sẵn — đúng, chưa có)
- [x] Đổi âm lượng nhạc, âm lượng hiệu ứng, bật/tắt rung — lưu ngay lập tức qua `SETTINGS_UPDATE` (mốc lưu đã có ở ticket 03); slider chỉ dispatch lúc thả tay (commit-on-release) để không spam ghi save mỗi pixel kéo, toggle dispatch ngay khi bấm
- [x] Nút ⚙ ở Kho trỏ thẳng vào `SettingsOverlay` (không qua PauseOverlay nữa — Kho không có khái niệm "tạm dừng" vì không có đồng hồ chạy); nút ⚙ ở Quầy vẫn qua PauseOverlay → "Cài đặt" → `SettingsOverlay` (PauseOverlay giữ nguyên vì Quầy cần pause thật)
- [x] Vì Kho không còn đường vào `PauseOverlay` (mất luôn "Về màn hình chính"), `SettingsOverlay` nhận thêm tuỳ chọn `onExitToTitle` — chỉ Kho truyền vào, Quầy không cần vì Pause đã có sẵn
- [x] Kiểm bằng Playwright: mở đúng, kéo slider nhạc đổi giá trị đúng (0.7 → 0.227), toggle/nút Về màn hình chính hiện đúng — 0 lỗi console

## Answer

`ui/Toggle.ts`, `ui/Slider.ts` (mẫu theo `BaggageSlider.ts` đã có — kéo/thả, commit lúc buông tay), `scenes/overlays/SettingsOverlay.ts` mới. Sửa `PrepScene` (bỏ hẳn `PauseOverlay`, dọn code chết) và `CounterScene` (nối `onSettings` của `PauseOverlay` — trước đây bấm "Cài đặt" trong Pause không làm gì). typecheck/lint/test(134)/build đều xanh.
