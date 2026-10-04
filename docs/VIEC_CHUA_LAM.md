# Việc chưa làm được — ghi chú để chủ dự án xem sau

Cập nhật: 2026-10-02. Mỗi mục ghi lý do chưa làm và cần gì từ bạn.

## 1. Thiết kế (thư mục `DESIGN/`)

- **5 file ảnh bị hỏng** (nội dung là trang báo lỗi, chỉ 28 byte, không đọc được): `c_a_h_ng_n_ng_c_p_qu_y_v` (Shop), `kho_v_u_ng_y_allotment_prep` (Kho cũ), `m_n_16_t_ng_k_t_ca_tr_c_ng_y` (Tổng kết), `m_n_9_13_qu_y_ph_c_v_trao_v` (Quầy + trao vé), `qu_y_ph_c_v_b_n_v_m_y_bay`, `s_gh_ch_n_ch_kh_ch_h_ng` (chọn ghế). → Cần bạn xuất lại ảnh để dựng UI các màn này.
- **Chưa dựng lại bố cục theo thiết kế** cho các màn có ảnh hợp lệ (Title, Onboarding, Kho + chỉnh giá, soi hộ chiếu/thông báo ngày lễ, tutorial, cửa hàng quầy). Hiện game dùng đúng bảng màu, font, nút 3D, thẻ đùn đáy nhưng bố cục vẫn là bản cũ. Lý do: mỗi màn là một lượt dựng lại lớn, và nhiều phần cần quyết định của bạn (mục 2).
- **Chưa có hình ảnh thật:** logo, mascot Béo, avatar khách minh hoạ, icon, ảnh các tuyến bay, ảnh nâng cấp. Game đang dùng avatar vẽ bằng code. Cần bạn xuất ảnh/asset từ Stitch (prompt ở `docs/PROMPT_ANH.md`) rồi đặt vào `public/assets/`; tôi gom thành atlas.
- **Chưa làm các chi tiết mockup:** nút nhanh "Gốc / +15% / +30%" cạnh thanh giá, dòng "Doanh thu ước tính", tag giảm giá "−5% Sỉ" trên thẻ chuyến, biểu tượng trong ô thông tin đơn, vân giấy nền, đuôi bong bóng thoại, khía vé, chip nhãn tuyến.

## 2. Quyết định cần bạn (ảnh hưởng thiết kế/luật)

- **Thanh điều hướng 4 tab** (Phục vụ / Kho vé / Sơ đồ ghế / Nâng cấp) trong mockup: PLAN chuyển màn tuần tự, không có tab tự do. Có thêm không?
- **Hồ sơ khách** (hạng thẻ "Thẻ Bạc", tâm trạng, nút gọi chuông), **nút "Đổi ghế"**, **"Soạn hồ sơ"**: chưa có trong PLAN/domain.
- **Màu cảnh báo/lỗi** và màu mức khẩn khách: STYLE.md đang đề xuất, bạn chưa chốt.
- **Duyệt văn bản** `docs/STORY_DRAFT.md` (PLAN D11 bắt buộc bạn duyệt).
- **Mua máy bay / thuê nhân viên:** PLAN §17 ghi "không làm ở bản đầu"; làm thì cần mô tả luật.

## 3. Cần thiết bị thật hoặc tài khoản

- **Deploy Cloudflare Pages:** cần tài khoản của bạn, làm theo `docs/DEPLOY.md`.
- **Kiểm điện thoại thật** (điền `tests/e2e-manual.md`): xoay ngang, bàn phím ảo che ô nhập, cài PWA Android/iOS, audio trên Safari iOS, 60 fps Android, cảm giác nhịp ngày chơi.
- **Nghe thử audio:** SFX và nhạc là tổng hợp bằng code, chưa biết nghe có dễ chịu không.
- **Cân hành lý bấm giữ:** đã làm và đã kiểm trên trình duyệt (giữ 2 giây → 10 kg; mỗi lần bấm cân lại từ 0; thả ngoài thanh vẫn chốt). Chưa thử bằng ngón tay thật trên điện thoại; tốc độ chỉnh ở `BAGGAGE_HOLD_SPEED_KG_PER_S` (đang 5 kg/giây).

## 4. Nội dung cá nhân hoá

- Tự điền `src/data/personal.ts` rồi đặt `enabled = true` (ticket 28). Đơn của khách đặc biệt phải hợp lệ (tuyến đã mở khoá, hạng/khung giờ có chuyến).

## 5. Lỗi/nợ kỹ thuật đã biết, chưa sửa

- Overlay khoá tab biến mất khi đổi scene sau khi bị chiếm tab (từ Giai đoạn 4).
- (Đã sửa) Seed ván mới dùng `platform/seed.ts` (crypto), không còn Math.random trong scene.
- Kiểm UI bằng Playwright chưa xong cho: giới thiệu TravelViet ngày 10, thời tiết SEVERE, Shop/Tổng kết sau đợt căn lại nút.
- Style chữ inline lặp ở nhiều scene (nên gom vào `TEXT_STYLES` khi dựng lại theo thiết kế).
- Kiểm tra cấu hình `personal.ts` lúc load (đơn không hợp lệ làm khách không phục vụ được) chưa có.

## 6. Gợi ý cho cân bằng game (từ sim)

- Bot hoàn hảo cuối game có ~2,2 triệu k (2,2 tỉ đồng): chưa có khoản chi lớn để tiêu. PLAN §17 (mua máy bay, thuê nhân viên, nợ/vay) là chỗ giải quyết; cần bạn mô tả luật nếu muốn làm.
- Người chơi chậm hoặc hay sai (POOR) gần như đứng yên ở ~10k, không mở thêm tuyến. Nếu muốn dễ hơn cho người mới: nâng `STARTING_MONEY` hoặc giảm `SEAT_COST_FACTOR` thêm.
- Kết quả sim phụ thuộc bot; người thật có thể chơi khác. Nên chơi thử và báo cảm giác (quá dễ/khó ở ngày nào) để chỉnh tiếp.

## 7. Ảnh đã nhận (sheet ChatGPT) — đã dùng / chưa dùng

- **Đã dùng** (atlas `public/assets/atlas`, tạo bằng `node tools/buildAtlas.mjs`): 16 khách + 2 VIP × 3 biểu cảm (đổi theo tâm trạng ở Quầy), Béo (bust dùng cho tutorial; 5 tư thế còn lại đã vào atlas, chưa gắn vào màn nào), logo ở màn Title.
- **Chưa dùng:** icon/nút/bảng/nền trong sheet (mỗi ảnh chỉ ~100×100 px, nền 170×140 px — quá nhỏ cho màn 720×1280). Cần ảnh độ phân giải cao hơn (prompt ở `docs/PROMPT_ANH.md`; nên xuất từng nhóm 2048 px, không gộp một sheet).
- **Chất lượng:** biểu cảm "angry" của khách chưa rõ giận (vẫn như đang cười); nên tạo lại 3 biểu cảm với nhấn mạnh "furrowed brows, frown, no smile". Béo là hà mã (mô tả trong prompt là gấu) — vẫn dùng được, bạn xác nhận giữ hà mã.
- Chưa có: Béo biểu cảm khác trong atlas (sheet 9 biểu cảm quá nhỏ), icon tuyến bay, ảnh nâng cấp, ảnh bưu thiếp.

## 8. Ảnh khách độ phân giải cao (đã nhận 2026-10-04)

- **Đã dùng:** 16 khách thường × 3 biểu cảm (c01–c16, nền đã tách, khung 192 px cao) thay hoàn toàn bản cũ. Tạo atlas: `node tools/buildAtlas.mjs`.
- **Còn dùng ảnh cũ độ phân giải thấp:** 2 khách VIP, Béo (6 tư thế), logo. Cần tạo lại theo `docs/PROMPT_ANH_V2.md` mục 1 (Béo), 2 (VIP), 3 (logo).
- **Chưa có:** nền màn hình (Quầy, Kho, Tổng kết, Shop, Title), icon, nút/bảng UI, bưu thiếp tuyến bay.
- Ghi chú: thứ tự gán c01–c16 theo `CUSTOMER_FILES` trong `tools/buildAtlas.mjs` (c10 là người đàn ông kính râm vest).
