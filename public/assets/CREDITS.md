# Nguồn và giấy phép asset

| Asset | Nguồn | Giấy phép |
|---|---|---|
| Be Vietnam Pro (700, 800; tập con latin + vietnamese) | Google Fonts — Be Vietnam Pro, The Be Vietnam Pro Project Authors | SIL Open Font License 1.1 |
| Nunito Sans (500–800; tập con latin + vietnamese) | Google Fonts — Nunito Sans, The Nunito Sans Project Authors | SIL Open Font License 1.1 |
| Gương mặt khách | Vẽ bằng code (`src/ui/CustomerAvatar.ts`), không dùng ảnh ngoài | Thuộc dự án |

Ghi chú: font tải từ Google Fonts một lần rồi tự host ở `public/assets/fonts/` để chạy offline. Chưa có atlas hình ảnh; bộ mockup Stitch (`.scratch/.../stitch_chibi_game_ui_design`) chỉ dùng làm tham chiếu phong cách, không nhúng vào game.

## Ảnh nhân vật (atlas `public/assets/atlas/characters.*`)

| Asset | Nguồn | Ghi chú |
|---|---|---|
| 16 khách thường (3 biểu cảm, ảnh độ phân giải cao, mỗi file 1 khách × 3 mặt) | Do chủ dự án tạo bằng AI (Gemini/ChatGPT), cắt bằng `tools/processTriple.mjs` | Quyền sử dụng theo điều khoản của công cụ tạo ảnh |
| 2 khách VIP, Béo (Hà Mã) 6 tư thế, logo "Quầy Vé Nhỏ" | Do chủ dự án tạo bằng ChatGPT (sheet `DESIGN/stitch_chibi_game_ui_design/ảnh/ChatGPT Image 11_04_03 4 thg 10, 2026.png`), cắt bằng `tools/buildAtlas.mjs` | Quyền sử dụng theo điều khoản của công cụ tạo ảnh; ảnh gốc độ phân giải thấp (~70×95 px mỗi khách) |

## Ảnh nhân viên (atlas `public/assets/atlas/staff.*`)

| Asset | Nguồn | Ghi chú |
|---|---|---|
| 5 nhân viên (Thực tập sinh, Junior, Middle, Senior, Marketing) × 3 biểu cảm (tập trung, vui, mệt) | Do chủ dự án tạo bằng AI, cắt bằng `tools/buildStaffAtlas.mjs` | Quyền sử dụng theo điều khoản của công cụ tạo ảnh |
