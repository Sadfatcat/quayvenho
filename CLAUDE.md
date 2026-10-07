# CLAUDE.md — Quầy Vé Nhỏ

## Dự án là gì

Game web mô phỏng quầy bán vé máy bay, chơi trên trình duyệt điện thoại (màn dọc). Lối chơi lấy cảm hứng từ các game quản lý tiệm (kiểu Tiệm Trà Nhỏ): mua trước lô ghế có "hạn dùng" (ghế mất giá trị khi máy bay cất cánh), đọc yêu cầu của khách, lắp vé đúng yêu cầu trước khi khách hết kiên nhẫn, cuối ngày tổng kết và nâng cấp quầy.

Người chơi chính là một người (bạn gái của chủ dự án). Game là quà tặng cá nhân, không thương mại, không có multiplayer.

Đặc tả đầy đủ nằm ở `docs/PLAN.md`. Đọc toàn bộ file đó trước khi viết dòng code đầu tiên. Khi CLAUDE.md và PLAN.md mâu thuẫn, CLAUDE.md thắng về quy trình, PLAN.md thắng về đặc tả game.

## Stack

- TypeScript (strict), Vite, Phaser 3 (pin phiên bản 3.x mới nhất trên npm tại thời điểm cài, ghi vào `docs/DECISIONS.md`)
- Vitest cho test, ESLint + Prettier
- zod để validate save/import
- vite-plugin-pwa cho PWA
- Không có backend. Lưu game bằng `localStorage`
- Deploy: Cloudflare Pages (static `dist/`)

Không tự ý thêm thư viện ngoài danh sách trên. Cần thư viện mới thì hỏi trước, nêu lý do và phương án không dùng thư viện.

## Lệnh

```bash
npm run dev          # dev server
npm run dev:host     # dev server mở ra LAN + HTTPS tự ký, để test trên điện thoại
npm run build        # typecheck + build production
npm run preview      # chạy bản build
npm run test         # vitest run
npm run test:watch
npm run lint
npm run typecheck    # tsc --noEmit
npm run sim          # mô phỏng kinh tế bằng bot, in bảng thống kê (xem PLAN §13.3)
```

## Luật kiến trúc (bắt buộc, không ngoại lệ)

1. `src/domain/**` là TypeScript thuần. Không import `phaser`, không đụng `window`, `document`, `localStorage`, `Date.now()`, `Math.random()`. Mọi thứ domain cần đều được truyền vào qua tham số.
2. Mọi phép random đi qua `Rng` trong `src/domain/rng.ts` (seeded). Cấm `Math.random()` ở bất kỳ đâu trong domain. Ở tầng presentation chỉ được dùng `Math.random()` cho hiệu ứng thuần hình ảnh (particle), không ảnh hưởng gameplay.
3. Tiền là số nguyên (đơn vị "xu"). Không bao giờ lưu số thực. Làm tròn ở đúng một chỗ: `src/domain/economy.ts`.
4. Thời gian gameplay dùng đồng hồ trong game (`GameClock`, tính bằng phút trong game, tiến theo delta đã clamp). Không dùng giờ hệ thống cho logic.
5. Scenes chỉ render và chuyển input thành command gọi domain. Scenes không tự tính tiền, tự chấm điểm, tự sinh đơn.
6. Nội dung game (tuyến bay, config theo ngày, nâng cấp, sự kiện, tên khách) nằm trong `src/data/*.ts` dạng dữ liệu, không hard-code trong logic.
7. Save có `version`. Đổi schema save thì phải thêm migration và test migration.

## Quy trình làm việc

- Làm theo đúng thứ tự giai đoạn và bước trong `docs/ROADMAP.md` (chia nhỏ từ PLAN §12). Không nhảy bước, mỗi lần chỉ làm một bước.
- Mỗi bước: viết test trước cho phần domain (hoặc cùng lúc), code, chạy `npm run typecheck && npm run lint && npm run test`. Chỉ báo xong khi cả ba xanh; tick ô trong ROADMAP, cập nhật `docs/STATUS.md`.
- Hết mỗi giai đoạn: làm bước Review theo mẫu trong ROADMAP (đối chiếu acceptance, tách phần lặp thành common component, cập nhật Registry, phân tích và điều chỉnh giai đoạn tiếp theo), rồi DỪNG và hỏi chủ dự án.
- Common component: theo "Luật common component" trong ROADMAP; code đã lặp ≥ 2 nơi thì tách, không tạo sẵn khi chưa có chỗ dùng.
- Làm tự động: code liên tục các bước trong một giai đoạn, không báo cáo sau từng bước. Chỉ dừng khi gặp mục "Phải hỏi trước" hoặc hết giai đoạn.
- Subagent `code-reviewer` (`.claude/agents/code-reviewer.md`): gọi đúng một lần ở bước Review cuối giai đoạn. Chỉ gửi mã giai đoạn, danh sách file, số mục PLAN; không gửi nội dung code. Tự kiểm chứng từng lỗi nó báo trước khi sửa; sửa P1, cân nhắc P2/P3, bỏ lỗi báo nhầm. Không gọi lại để review bản sửa trừ khi sửa P1 lớn.
- Playwright MCP: chỉ dùng ở bước Review cuối giai đoạn có UI, một lượt kiểm (mở `npm run dev`, chụp 360×640 và 430×932, đọc console). Không dùng trong các bước thường.
- Tiết kiệm quota: không đọc lại file vừa sửa, không chạy lại lệnh đã xanh khi không đổi code, một thao tác lỗi không thử quá 2 lần.
- Commit nhỏ, theo Conventional Commits (`feat(domain): ...`, `fix(counter): ...`, `test(orderGen): ...`).
- `docs/STATUS.md`: file trạng thái, được ghi đè — phase hiện tại, task đang làm, việc còn lại, blocker.
- `docs/DECISIONS.md`: append-only. Mỗi quyết định kỹ thuật: ngày, quyết định, lý do, phương án đã loại.

## Phải hỏi trước, không tự quyết

Chủ dự án muốn được hỏi ý kiến với các quyết định kiến trúc còn mơ hồ. Khi gặp một trong các tình huống sau, dừng lại, trình bày 2–3 phương án kèm trade-off, đề xuất một phương án, và chờ trả lời:

- Bất kỳ mục nào trong PLAN §15 "Quyết định còn mở"
- Thay đổi schema save sau khi Phase 3 đã xong
- Thêm dependency mới
- Đổi cấu trúc thư mục hoặc luật kiến trúc ở trên
- Đặc tả trong PLAN thiếu, mâu thuẫn, hoặc không khả thi khi code
- Con số cân bằng game khi `npm run sim` cho kết quả nằm ngoài khoảng mục tiêu

Những việc được tự quyết: đặt tên biến/hàm nội bộ, chia nhỏ file, viết thêm test, refactor không đổi hành vi.

## Quy ước code

- Tên code (biến, hàm, type, file) bằng tiếng Anh. Chuỗi hiển thị cho người chơi bằng tiếng Việt, gom hết vào `src/data/strings.ts`.
- Không dùng `any`. Không dùng non-null assertion `!` trừ khi có comment giải thích.
- Hàm domain trả kết quả dạng discriminated union (`{ ok: true, ... } | { ok: false, reason: ... }`), không throw cho lỗi nghiệp vụ. Chỉ throw cho lỗi lập trình (invariant vỡ).
- Mỗi file domain có file test tương ứng `*.test.ts` cùng thư mục.
- Không để `console.log` trong code commit, trừ logger có kiểm tra `import.meta.env.DEV`.

## Definition of Done cho một task

- Typecheck, lint, test đều xanh
- Domain mới có test, gồm cả happy case và các awful case liên quan trong PLAN §14
- Chạy được trên `npm run dev` không có lỗi console
- Nếu task có UI: kiểm tra ở viewport 360×640 và 430×932 trong DevTools
- STATUS.md đã cập nhật

---

## Communication Style
Alway answer me in Vietnamese
Direct answers only. No filler, manners, hedging, summaries, or prefaces. Thinking process: concise, no deliberation narration.

- Format: bullet points / single sentences.
- Max 2 sentences per code block (0 if self-explanatory).
- Never generate boilerplates, setups, or configs.
- Use modern shorthand to minimize code.
- Never rewrite entire files/components; output ONLY modified methods or added lines.
- Multi-layer bug fixes: outline a 3-bullet plan and wait for confirmation before coding.

## Stop and Ask Immediately If

- Core business logic rules (e.g., Rent, Deposit, Invoice) are missing.
- Database queries require unlisted foreign keys (ask for schema clarification).
- Implementing FE/UI/UX features: ask for role access and restrictions first.

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Code Conventions

Write code that is easy to read, debug, and extend.

- Keep each file, class, and function focused on one clear responsibility.
- Use descriptive names, even if they are long. A name should explain what the code does without needing extra comments. Prefer names like `getActiveUsersByOrganizationId`, `calculateInvoiceTotalAfterDiscount`, or `validateUserPermissionBeforeUpdate`.
- Keep functions small, with early returns and minimal nesting.
- Avoid magic numbers, hardcoded strings, and hidden side effects. Move them into constants, config, or clearly named helpers.
- Follow a consistent flow: validate → authorize → execute → transform → return.
- Separate business logic from UI, framework, database, and external services.
- Handle errors clearly: fail fast, include useful context, and never silently ignore exceptions.
- Reuse shared logic through utilities, services, or modules instead of duplicating code.
- Prioritize maintainability over cleverness. Code should be simple to debug today and easy to upgrade later.


các ô hiện thông tin trong game không bao giờ được quá mờ nhạt, luôn phải có màu và ở trong 1 khung và có size đủ to để xem