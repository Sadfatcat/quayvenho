# STATUS

Cập nhật: 2026-10-07.

- **Giai đoạn hiện tại:** 9 (làm lại Quầy, màn quản lý 4 mục, nhân viên, lạm phát giá vé) — code xong 9.1–9.7. Còn 9.8 (chủ dự án chơi thử rồi duyệt số cân bằng) và 9.9 (ảnh + tutorial nhân viên, chờ ảnh).
- **Roadmap giai đoạn 1–8:** mọi bước làm được bằng code đã xong. Các ô còn mở đều cần chủ dự án hoặc thiết bị thật: duyệt `docs/STYLE.md` (13) và văn bản `docs/STORY_DRAFT.md` (18), đo 60 fps/audio Safari/cài PWA/bàn phím ảo trên điện thoại thật (15, 16, 20, 21, 23), deploy Cloudflare Pages (24), điền `src/data/personal.ts` rồi chơi lại các ngày đặc biệt (28).
- **Chất lượng:** typecheck, lint, test (235) xanh. Save version 4 (migration v0→v4 có test).
- **Mới (2026-10-05):** cân bằng lại kinh tế theo yêu cầu (biên 15% nội địa / 25–30% quốc tế, TravelViet khó hơn, giàu vô lo từ ~ngày 50; nhật ký đầy đủ ở `docs/CAN_BANG_KINH_TE.md`), khoá chỉnh giá 12 ngày đầu, nhạc tự soạn "Gió Qua Chiều Nhẹ", quầy có máy in vé (bỏ 3 nút đáy), khay điểm đến cuộn được. Chưa commit; `npm run build` đã chạy được (precache 4 MiB).
- **Cần chủ dự án quyết:** số cân bằng nhân viên/lạm phát (`docs/PLAN_NHAN_VIEN.md` mục 12).
- **Blocker:** không có blocker kỹ thuật; xem danh sách chi tiết ở `docs/VIEC_CHUA_LAM.md`.
- Playwright chỉ dùng cho các bước kiểm UI cần thiết (theo yêu cầu chủ dự án, hạn chế dùng).

- **Mới (2026-10-07):** vé 3 ngày + đóng cửa sớm, khách đầu game +15..30, biên hạ 12/22–27%, save v5 có sao lưu và 4 fixture save thật, Shop mở thẳng sang ngày mới (mọi mục mua được, nút Ngày tiếp theo có xác nhận), ảnh nhân viên, giao diện ô thông tin có khung. Sim 400 seed: xem  phương án K. Chưa push/deploy. Còn thư mục worktree tạm  cần xoá tay.
