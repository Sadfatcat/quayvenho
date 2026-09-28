# STATUS

- Giai đoạn hiện tại: 1 — Domain core (Review xong, chờ chủ dự án)
- Đã xong giai đoạn 1:
  - 13 bước ROADMAP, 111 test xanh (3,5 s), coverage domain 99,2% lines / 94,4% branches
  - Acceptance Phase 1: ngày tích hợp khớp DaySummary; invariant tiền trên 1.000 ngày ngẫu nhiên; invariant §8.4 trên 2.000 seed × 30 ngày; bot hoàn hảo chơi 30 ngày (mở ≥ 2 tuyến, có TravelViet); replay giống hệt; không vi phạm rule ESLint domain
  - code-reviewer: 1 P1 + 2 P2, đã kiểm chứng và sửa cả 3 (redraw ngày 1–2 theo túi, bỏ điều kiện thừa khi chọn BUSINESS, thêm test trọng số)
  - Tách test fixture dùng chung (`__integration__/fixtures.ts`)
- Từ giai đoạn 0 còn chờ: thử `dev:host` trên điện thoại, Cloudflare Pages, reload VS Code để Playwright MCP chạy
- Bước tiếp theo: Giai đoạn 2, bước 2.1 (bộ UI dùng chung)
