# STATUS

- Giai đoạn hiện tại: 0 — Nền móng (Review xong, chờ chủ dự án)
- Đã xong:
  - Node 24.19, Git 2.55 cài qua winget; dependency cài và pin (DECISIONS 2026-09-28)
  - typecheck, lint, test (chưa có test), build xanh
  - Rule ESLint domain chặn đúng 5/5 vi phạm thử (phaser, @ui, Math.random, Date, window)
  - git init + commit đầu; CI workflow; `.nvmrc`; hướng dẫn deploy trong README
  - code-reviewer: OK
- Acceptance Phase 0 chưa kiểm được (cần chủ dự án):
  - `npm run dev` không lỗi console: chưa kiểm bằng Playwright (MCP kết nối lỗi vì Node được cài giữa phiên; cần reload VS Code)
  - `npm run dev:host` trên điện thoại
  - CI xanh: cần tạo repo GitHub và push
  - Deploy Cloudflare Pages: cần tài khoản
- Bước tiếp theo: Giai đoạn 1, bước 1.1
