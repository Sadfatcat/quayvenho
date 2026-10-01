# 28: Chạy với dữ liệu thật + Review Giai đoạn 8

**What to build:** Chủ dự án tự điền nội dung cá nhân thật vào `data/personal.ts`; Claude Code kiểm chơi lại các ngày đặc biệt không lỗi, rồi chốt Giai đoạn 8 (giai đoạn cuối).

**Blocked by:** 27

**Status:** chờ chủ dự án điền nội dung (phần review code đã xong)

- [ ] Chủ dự án điền `specialCustomers`/`scriptedMoments`/`customRoutes` thật (việc [TAY], không phải Claude Code bịa)
- [ ] Chơi lại đúng các ngày đặc biệt, không lỗi console, không vỡ luồng
- [ ] `code-reviewer` subagent 1 lần cho phần domain đọc `personal.ts`
- [ ] Cập nhật `docs/ROADMAP.md`, `docs/STATUS.md`, `docs/DECISIONS.md` lần cuối — đóng toàn bộ ROADMAP
- [ ] Commit + push

## Kết quả một phần
- [x] Review code domain bằng `code-reviewer` (đã sửa P1 trùng slot, thêm test) — ghi ở ROADMAP 8.R.
- [ ] **Chủ dự án điền** `specialCustomers`/`scriptedMoments`/`customRoutes` thật vào `src/data/personal.ts` và đặt `enabled = true` (Claude Code không bịa nội dung cá nhân). Khi điền: `order` phải hợp lệ (tuyến đã mở khoá, hạng/khung giờ có chuyến) — nếu không khách không phục vụ được.
- [ ] Sau khi điền: chơi lại các ngày đặc biệt, kiểm console, đóng ROADMAP.
