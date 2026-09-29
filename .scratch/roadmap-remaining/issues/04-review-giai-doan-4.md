# 04: Review Giai đoạn 4

**What to build:** Không phải code mới — chốt Giai đoạn 4: review code (subagent code-reviewer), kiểm UI bằng Playwright một lượt, cập nhật tài liệu, commit đóng giai đoạn.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Gọi `code-reviewer` subagent đúng 1 lần, chỉ gửi danh sách file + số mục PLAN
- [ ] Tự kiểm chứng từng lỗi được báo trước khi sửa; sửa P1, cân nhắc P2/P3
- [ ] Playwright kiểm 1 lượt ở 360×640 và 430×932 cho toàn bộ luồng Giai đoạn 4 (Onboarding → Kho → Quầy → Tổng kết → ngày mới)
- [ ] Cập nhật `docs/ROADMAP.md` (tick ô, bảng Registry, ghi chú review cho Giai đoạn 5)
- [ ] Cập nhật `docs/STATUS.md`, `docs/DECISIONS.md` nếu có quyết định kỹ thuật mới
- [ ] Commit + push
