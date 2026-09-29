# 21: Thiết bị

**What to build:** Xử lý các đặc thù thiết bị thật: xoay ngang màn hình, nút Back vật lý trên Android, bàn phím ảo che ô nhập.

**Blocked by:** 19

**Status:** ready-for-agent

- [ ] `scenes/overlays/RotateOverlay.ts` mới: chặn chơi khi xoay ngang, gợi ý xoay dọc lại
- [ ] Nút Back Android hoạt động hợp lý (mở Pause thay vì thoát app đột ngột)
- [ ] Bàn phím ảo không che ô nhập ở Onboarding (`ui/TextInput.ts` đã có từ Giai đoạn 4 — bổ sung cuộn lên khi focus nếu máy thật cho thấy cần)
- [ ] Đối chiếu đủ các mục [TAY] liên quan trong PLAN §14
