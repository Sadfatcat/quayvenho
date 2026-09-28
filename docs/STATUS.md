# STATUS

- Phase hiện tại: 0 — Scaffold (chưa xong)
- Vừa làm: viết lại `docs/PLAN.md` theo `prompt.md` và các quyết định của chủ dự án (xem DECISIONS 2026-09-28); tạo `docs/ROADMAP.md` chia giai đoạn/bước, Review, Registry common component
- Bước tiếp theo: ROADMAP 0.1
- Đã có: `package.json` (scripts), `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc.json`, `index.html`, `src/main.ts`, `src/scenes/BootScene.ts`, `src/ui/theme.ts`, `src/data/strings.ts`
- Việc còn lại Phase 0:
  - `npm install` dependency, chạy typecheck, lint, test, dev; thử rule ESLint với `src/domain`
  - Cây thư mục §6.1 dạng placeholder
  - `git init`, GitHub Actions, `.nvmrc`, hướng dẫn deploy Cloudflare Pages
- Blocker:
  - Chủ dự án duyệt `docs/PLAN.md` mới
  - Chủ dự án xoá hoặc giữ `PLAN.md` và `prompt.md` ở thư mục gốc (đã gộp vào `docs/PLAN.md`)
  - PLAN §15 D10: duyệt `@vitest/coverage-v8`, runner cho sim, `eruda`
