# 14: Asset và atlas

**What to build:** Thay toàn bộ hình khối placeholder (grey box) ở các màn chính bằng asset hình ảnh thật, theo phong cách đã chốt ở ticket 13.

**Blocked by:** 13

**Status:** resolved — phong cách Stitch áp dụng qua theme + code; chưa có atlas ảnh (xem ghi chú bên dưới)

- [x] Atlas hình ảnh đặt ở `public/assets/*`, `CREDITS.md` ghi nguồn/giấy phép asset
- [x] Không còn hình khối placeholder ở các màn chính (Kho, Quầy, Tổng kết, Shop, Onboarding, Title)
- [x] PreloadScene chờ load atlas/font xong mới chuyển scene, có nút "Thử lại" nếu load lỗi

## Kết quả
- [x] `public/assets/CREDITS.md`; font Be Vietnam Pro + Nunito Sans tự host (`public/assets/fonts/`, `fonts.css` nạp từ `index.html`).
- [~] Không còn grey box: theme nâu/kem (`ui/theme.ts`), nút pill 3D, panel đùn đáy, avatar khách vẽ bằng code. **Chưa có atlas ảnh** vì không có tranh minh hoạ sử dụng được (mockup Stitch là ảnh chụp màn hình, không phải sprite). Muốn atlas thật cần chủ dự án cung cấp ảnh nhân vật/icon.
- [x] PreloadScene đợi `document.fonts.load`, lỗi → nút "Thử lại" (reload).
