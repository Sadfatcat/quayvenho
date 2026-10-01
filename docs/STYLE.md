# STYLE — Phong cách hình ảnh và font

Trạng thái: **ĐỀ XUẤT, chờ chủ dự án duyệt** (ticket 13, PLAN §15 D2 + D3).
Nguồn: bộ mockup Stitch ở `.scratch/roadmap-remaining/issues/stitch_chibi_game_ui_design/` (DESIGN.md + 5 màn hình).

## 1. Quyết định

| Mục | Mặc định cũ (PLAN §15) | Đề xuất | Lý do |
|---|---|---|---|
| D2 Font | Nunito + Baloo 2 | **Be Vietnam Pro** (tiêu đề, 700–800) + **Nunito Sans** (nội dung, nhãn, 500–800) | Theo mockup Stitch; cả hai hỗ trợ đủ dấu tiếng Việt |
| D3 Phong cách | Flat pastel | **Chibi "đất nung – gỗ óc chó" (tactile)**: nền kem, viền nâu espresso, nút nổi 3D, không bóng mờ | Theo mockup Stitch; ấm, hợp quà tặng cá nhân |

Hệ quả: bảng màu xanh trời hiện tại trong `src/ui/theme.ts` là tạm thời và sẽ được thay (xem mục 6).

## 2. Bảng màu

| Vai trò | Mã | Dùng cho |
|---|---|---|
| Nền (Surface 0) | `#FDF6EC` | Nền toàn màn hình |
| Panel (Surface 1) | `#F5E8D3` + viền 2px `#6C4F3D` | Khay, panel |
| Thẻ (Surface 2) | `#FFFDF9`, bóng `#E6D2B5` | Thẻ vé, hộp thoại khách |
| Chính (Primary) | `#6C4F3D`, đáy nút `#4A3525` | Nút chính, viền, tiêu đề |
| Phụ (Secondary) | `#C86D51`, đáy nút `#8F4631` | Hành động nổi bật (In & trao vé, Đóng dấu) |
| Phụ 3 (Tertiary) | `#5B8A8C`, đáy nút `#3B5E60` | Khởi hành, tab điều hướng |
| Thành công | `#6E8B74` | Dấu tick, ghế khớp |
| Vạch/nhãn mờ | `#8D6E53` | Đường kẻ, chữ mờ, nhãn không hoạt động |
| Giấy kraft | `#E6D2B5` | Ô nhập, rãnh slider |

Quy tắc: không dùng đen thuần `#000000`; viền và bóng đều là `#4A3525` hoặc `#352317`. Chữ chính `#4A3525`.
Cần bổ sung ngoài mockup: màu **cảnh báo/lỗi** (mockup chỉ có `#ba1a1a` trong token) và màu mức khẩn khách (xanh/vàng/đỏ cho thanh kiên nhẫn) — chủ dự án chọn khi duyệt.

## 3. Font

- Tự host file `.woff2` trong `public/assets/fonts/` (PLAN §10.1: chạy offline); không tải từ Google Fonts lúc chạy.
- PreloadScene đợi `document.fonts.load` cho từng cỡ chữ dùng trước khi chuyển scene.
- Số tiền, giờ, đếm: `tabular-nums` (nếu Phaser Text không hỗ trợ thì dùng font Nunito Sans weight 800, chấp nhận số hơi rung).

| Kiểu | Font | Cỡ/dòng | Weight |
|---|---|---|---|
| headline-xl | Be Vietnam Pro | 36/44 (mobile 28) | 800 |
| headline-lg | Be Vietnam Pro | 28/36 (mobile 22) | 700 |
| headline-md | Be Vietnam Pro | 20/26 | 700 |
| headline-sm | Be Vietnam Pro | 18/24 | 700 |
| body-lg | Nunito Sans | 16/24 | 600 |
| body-md | Nunito Sans | 14/20 | 500 |
| body-sm | Nunito Sans | 12/18 | 500 |
| label-lg | Nunito Sans | 14/18 | 800 |
| label-md | Nunito Sans | 12/16 | 700 |
| label-sm | Nunito Sans | 10/14 | 700 |

Lưu ý: cỡ trên là CSS px của mockup. Canvas game là 720 logic (hiện hiển thị scale 0,5 ở 360 px), nên khi dựng vào Phaser nhân 2 và không để chữ nội dung dưới 24 px logic.

## 4. Hình khối và chiều sâu

- Bo góc: nút/chip/HUD = pill (9999); thẻ vé 16–20; hộp thoại, bong bóng 24–32. Cấm góc vuông 90° ở bề mặt người chơi thấy.
- Không bóng mờ. Chỉ dùng "đùn" phẳng:
  - Thẻ: viền 2px `#6C4F3D` + bóng đặc xuống 4px `#4A3525`.
  - Nút 3D: viền 2px + đáy đùn 5px, vệt sáng đỉnh `rgba(255,255,255,0.4)`.
  - Nhấn xuống: dịch xuống 3px, đáy còn 2px.
  - Hộp thoại: nền mờ `rgba(74,53,37,0.55)`, đáy đùn 8px.
  - Ô nhập/khe rỗng: lõm, viền 1,5px `#C4AE91`.
- Bong bóng thoại: viền 2,5px `#4A3525`, đuôi bo (bán kính ≥ 6), nhãn tên khách là tab nhỏ chồng góc trên trái.
- Vé: khía tròn bán kính 12 ở hai bên, đường đứt nét `#8D6E53`.
- Chip tuyến: nền nhạt (teal `#E8F2F2`, đất nung `#F9ECE8`, kraft `#EFE5D8`), viền 1,5px nâu.

## 5. Asset

- Nhân vật khách và avatar: minh hoạ chibi (đã có mẫu avatar và logo trong bộ Stitch). Cần chủ dự án quyết nguồn: tiếp tục dùng Stitch/AI sinh hay tự vẽ — ảnh hưởng ticket 14 (atlas).
- Logo: `logo_qu_y_v_nh_chibi` trong bộ Stitch là bản nháp, chưa dùng.
- Icon: nét nâu `#6C4F3D`, bo tròn, không đổ bóng mờ.

## 6. Khác biệt giữa mockup và PLAN — cần chủ dự án quyết

Mockup có các phần PLAN không có hoặc khác. Không tự thêm vào game:

1. Thanh điều hướng đáy 4 tab (Phục Vụ / Kho Vé / Sơ Đồ Ghế / Nâng Cấp). PLAN chia theo scene tuần tự (Kho → Quầy → Tổng kết → Shop), không có tab tự do.
2. Hồ sơ khách (Hạng thẻ "Thẻ Bạc", tâm trạng, nút Keeng/gọi chuông) và nút "Đổi Ghế", "Soạn Hồ Sơ" — chưa có trong PLAN.
3. Bố cục quầy trên một cuộn dài; PLAN §10 chia thành các bước A–D nằm ngang. Cần đối chiếu khi dựng.
4. HUD có điểm sao (4.8) cạnh tiền — khớp TravelViet, nhưng PLAN chỉ hiện từ ngày 11.

## 7. Việc làm tiếp theo khi được duyệt

1. Ghi D2 và D3 vào `docs/DECISIONS.md`, cập nhật PLAN §10.1 và §15.
2. Tải và đặt font vào `public/assets/fonts/` (file font không phải thư viện npm, không thêm dependency).
3. Thay `COLORS`, `FONT_FAMILY`, `RADIUS` trong `src/ui/theme.ts` và dựng lại `Button`, `Panel`, `Card`, `Toggle`, `Slider` theo mục 4 (thuộc ticket 14–15).
