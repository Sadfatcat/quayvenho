# 23: Test tay trên máy thật

**What to build:** Soát toàn bộ danh sách hành vi cần kiểm tay trong PLAN §14 (mục đánh dấu [TAY]) trên điện thoại thật, ghi lại kết quả.

**Blocked by:** 20, 21, 22

**Status:** chờ chủ dự án — checklist đã có, cần điện thoại thật

- [ ] `tests/e2e-manual.md` mới, liệt kê từng mục [TAY] và kết quả kiểm
- [ ] Toàn bộ mục [TAY] trong PLAN §14 được tick hoặc ghi lý do rõ ràng nếu bỏ qua
- [ ] Kiểm trên ít nhất 1 máy Android và 1 máy iOS thật (chủ dự án hỗ trợ nếu Claude Code không có thiết bị)

## Kết quả
- [x] `tests/e2e-manual.md` đã tạo từ PLAN §14 (26 mục [TAY]/[CẢ HAI]) kèm cột những gì đã thử bằng Chromium.
- [ ] Kiểm trên Android + iOS thật: **chưa làm được** — Claude Code không có thiết bị. Chủ dự án chạy `npm run dev:host`/link deploy trên điện thoại và điền cột "Kết quả máy thật".
