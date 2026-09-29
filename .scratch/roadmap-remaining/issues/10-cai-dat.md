# 10: Cài đặt (SettingsOverlay)

**What to build:** Một overlay Cài đặt thật (thay vì nút ⚙ hiện đang tạm mở PauseOverlay), cho đổi âm lượng nhạc/hiệu ứng và bật/tắt rung, lưu ngay khi đổi.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] `ui/Toggle.ts`, `ui/Slider.ts` mới (component dùng chung, kiểm tra chưa có sẵn trước khi tạo)
- [ ] Đổi âm lượng nhạc, âm lượng hiệu ứng, bật/tắt rung — lưu ngay lập tức (`SETTINGS_UPDATE`, mốc lưu đã có ở ticket 03)
- [ ] Nút ⚙ ở Kho và Quầy (trong PauseOverlay) trỏ đúng vào SettingsOverlay này thay vì mở PauseOverlay như hiện tại
- [ ] Kiểm bằng Playwright, 0 lỗi console
