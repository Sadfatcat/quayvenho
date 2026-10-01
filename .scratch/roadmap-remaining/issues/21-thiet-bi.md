# 21: Thiết bị

**What to build:** Xử lý các đặc thù thiết bị thật: xoay ngang màn hình, nút Back vật lý trên Android, bàn phím ảo che ô nhập.

**Blocked by:** 19

**Status:** resolved — phần xoay ngang và bàn phím ảo cần máy thật (ticket 23)

- [ ] `scenes/overlays/RotateOverlay.ts` mới: chặn chơi khi xoay ngang, gợi ý xoay dọc lại
- [ ] Nút Back Android hoạt động hợp lý (mở Pause thay vì thoát app đột ngột)
- [ ] Bàn phím ảo không che ô nhập ở Onboarding (`ui/TextInput.ts` đã có từ Giai đoạn 4 — bổ sung cuộn lên khi focus nếu máy thật cho thấy cần)
- [ ] Đối chiếu đủ các mục [TAY] liên quan trong PLAN §14

## Kết quả
- [x] `scenes/overlays/RotateOverlay.ts`: trên thiết bị cảm ứng (`pointer: coarse`), xoay ngang → overlay + `holdPause()` tới khi xoay dọc (gắn ở `BaseScene.watchOrientation`). Chưa kiểm xoay thật trên điện thoại.
- [x] Nút Back: `platform/backButton.ts` (pushState + popstate) phát `BACK_PRESSED_EVENT`, CounterScene mở PauseOverlay. Đã kiểm `history.back()` ở Quầy trên Chromium: mở Pause, không thoát.
- [ ] Bàn phím ảo che ô nhập: chưa làm vì cần máy thật xem có che không (đúng ghi chú ticket); ô nhập đã đặt giữa màn hình.
- [ ] Đối chiếu mục [TAY] PLAN §14: ticket 23.
