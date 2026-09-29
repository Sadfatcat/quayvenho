# 04: Review Giai đoạn 4

**What to build:** Không phải code mới — chốt Giai đoạn 4: review code (subagent code-reviewer), kiểm UI bằng Playwright một lượt, cập nhật tài liệu, commit đóng giai đoạn.

**Blocked by:** 03

**Status:** resolved

- [x] Gọi `code-reviewer` subagent đúng 1 lần, chỉ gửi danh sách file + số mục PLAN
- [x] Tự kiểm chứng từng lỗi được báo trước khi sửa; sửa P1, cân nhắc P2/P3 — 4/6 lỗi báo là thật và đã sửa (key localStorage sai tên, tabLock thiếu TAKEOVER, thiếu kiểm localStorage/persist, bug skip Tổng kết); 2 lỗi (Math.random cho seed, bỏ `qvn:lock`) ghi quyết định chấp nhận vào DECISIONS.md thay vì sửa
- [x] Playwright kiểm 1 lượt ở 360×640 và 430×932 cho toàn bộ luồng Giai đoạn 4 (Onboarding → Kho → Quầy → Tổng kết → ngày mới), thêm kiểm 2 tab thật cho tabLock — tự phát hiện 1 bug nữa (overlay khoá tab không bấm được nút), đã sửa và kiểm lại
- [x] Cập nhật `docs/ROADMAP.md` (tick ô, bảng Registry, ghi chú review cho Giai đoạn 5)
- [x] Cập nhật `docs/STATUS.md`, `docs/DECISIONS.md` (3 quyết định mới)
- [x] Commit + push

## Answer

Giai đoạn 4 đóng hoàn chỉnh. Chi tiết đầy đủ nằm trong `docs/ROADMAP.md` mục "Ghi chú review (từ 4.R)" và `docs/DECISIONS.md` (3 mục ngày 2026-09-30). Không có quyết định nào cần hỏi chủ dự án trước khi tiếp — tất cả sai lệch so với PLAN đã tự sửa hoặc tự ghi quyết định chấp nhận có lý do rõ ràng.
