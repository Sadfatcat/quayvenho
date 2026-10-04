# 16: Audio

**What to build:** Nhạc nền và hiệu ứng âm thanh, đúng phong cách đã chốt ở ticket 13, hoạt động đúng trên Safari iOS (cần một chạm đầu tiên mới mở khoá audio).

**Blocked by:** 13

**Status:** resolved — âm thanh tổng hợp bằng Web Audio (không file asset), chưa nghe thử trên Safari iOS thật (ticket 23)

- [x] `platform/audio.ts`, `platform/haptics.ts` mới
- [x] Nhạc nền + hiệu ứng cho các sự kiện chính (bán vé thành công, sai, mở cửa, tổng kết...)
- [ ] Chạy đúng trên Safari iOS sau lần chạm đầu tiên trong game (TitleScene, theo PLAN §10.3)
- [x] Tôn trọng cài đặt âm lượng/rung từ ticket 10

## Kết quả
- `platform/audio.ts` (SFX + nhạc nền lofi 2 nhịp calm/busy, crossfade 800ms, tổng hợp bằng oscillator nên không cần file), `platform/haptics.ts`, `scenes/audioBridge.ts` nối sự kiện domain → SFX/rung và mở khoá audio ở lần `pointerdown` đầu tiên (mọi nơi, kể cả Title).
- Âm lượng/rung đọc từ `settings` (đồng bộ mỗi khi có sự kiện, gồm `SETTINGS_UPDATED`). Nhạc: Kho/Shop `calm`, Quầy `busy`.
- Chạy trong Chromium không lỗi console. **Chưa kiểm nghe thật** trên Safari iOS và chưa kiểm chất lượng âm thanh bằng tai — cần chủ dự án nghe thử; nếu muốn nhạc/SFX thật phải cung cấp file.
