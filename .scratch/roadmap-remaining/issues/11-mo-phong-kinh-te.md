# 11: Mô phỏng kinh tế (`scripts/sim.ts`)

**What to build:** Một script chạy bot mô phỏng nhiều ngày/nhiều seed để kiểm tra cân bằng kinh tế của game (lợi nhuận, tỉ lệ khách bỏ đi/bỏ về vì đông, v.v.), in bảng thống kê theo PLAN §13.3.

**Blocked by:** 05, 06, 07, 08 (cần mọi cơ chế ảnh hưởng kinh tế đã hoạt động để số liệu có ý nghĩa)

**Status:** ready-for-agent

- [ ] Chạy được `npm run sim`, in bảng đúng format PLAN §13.3
- [ ] Có ít nhất 2 hồ sơ bot (PERFECT, AVERAGE) theo mô tả PLAN
- [ ] Báo cáo kết quả cho chủ dự án, đối chiếu với khoảng mục tiêu — nếu ngoài khoảng, dừng và hỏi (đúng luật "Phải hỏi trước" của CLAUDE.md)
- [ ] Đây chính là bước cần cho D12 ở wayfinder map `.scratch/plan-open-decisions/` (ticket 10 "Chạy sim" ở đó) — sau khi xong ticket này, quay lại chốt D12b ở map đó
