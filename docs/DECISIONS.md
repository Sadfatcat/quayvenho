# DECISIONS

Append-only. Mỗi mục: ngày, quyết định, lý do, phương án đã loại.

## 2026-09-28 — `dev:host` bật HTTPS qua `--mode https`

- Quyết định: `vite --host --mode https`; `vite.config.ts` bật `basicSsl()` khi `mode === 'https'`.
- Lý do: cú pháp `HTTPS=1 vite` (PLAN Phase 0 task 6) không chạy trong npm script trên Windows.
- Đã loại: `cross-env` (thêm dependency), đọc `process.env.HTTPS` (vẫn cần cách set biến đa nền tảng).

## 2026-09-28 — Gộp cấu hình Vitest vào `vite.config.ts`

- Quyết định: không tạo `vitest.config.ts`; khối `test` nằm trong `vite.config.ts`.
- Lý do: dùng chung alias, một nguồn cấu hình. PLAN §6.1 có liệt kê `vitest.config.ts` riêng.
- Đã loại: `vitest.config.ts` + `mergeConfig` (lặp alias hoặc phải export config dạng hàm).

## 2026-09-28 — ESLint chỉ dùng `typescript-eslint`

- Quyết định: flat config với `tseslint.configs.recommended` + `no-non-null-assertion` + `no-console`; không thêm `@eslint/js`, `eslint-config-prettier`.
- Lý do: config recommended của ESLint 9 không còn rule định dạng nên không xung đột Prettier; giữ đúng danh sách dependency trong CLAUDE.md.
- Rule riêng cho `src/domain/**`:
  - `no-restricted-imports`: cấm `phaser`, `@scenes/*`, `@ui/*`, `@platform/*`, `@save/*` và đường dẫn tương đối tới các thư mục đó (luật kiến trúc 1).
  - `no-restricted-globals`: cấm `window`, `document`, `localStorage`, `navigator`, `performance`, `Date` (luật 1, 4 — không dùng giờ hệ thống).
  - `no-restricted-properties`: cấm `Math.random` (luật 2).

## 2026-09-28 — `vite.config.ts` không nằm trong `tsc --noEmit`

- Quyết định: `tsconfig.json` chỉ include `src`, `scripts`.
- Lý do: config dùng `node:url`, typecheck nó cần `@types/node` (dependency ngoài danh sách). Vite tự bundle config bằng esbuild.
- Đã loại: thêm `@types/node` + `tsconfig.node.json`.

## 2026-09-28 — Phiên bản dependency (Phase 0)

- Node 24.19 (LTS, `.nvmrc` = 24), npm 11.17.
- `phaser` 3.90.0 (bản 3.x mới nhất), `zod` 4.6.5.
- Dev: `typescript` 6.0.3, `vite` 8.3.1, `vitest` 5.0.2, `@vitest/coverage-v8` 5.0.2, `eslint` 10.11.0, `typescript-eslint` 8.70.1, `prettier` 3.9.9, `vite-plugin-pwa` 1.3.0, `@vitejs/plugin-basic-ssl` 2.3.0, `tsx` 4.23.15, `eruda` 3.4.3.
- Tất cả pin chính xác (`-E`).
- `@vitest/coverage-v8`, `tsx`, `eruda` được chủ dự án duyệt (PLAN §15 D10).
- npm 11 chặn postinstall của `esbuild`; build Vite 8 không cần nó (dùng rolldown), nên không duyệt script.

## 2026-09-28 — Chủ dự án chốt thiết kế, viết lại `docs/PLAN.md`

- Nguồn: `prompt.md` và trả lời trong hội thoại. Chi tiết nằm trong PLAN; mục này chỉ ghi điểm đổi so với bản cũ.
- Ca làm 08:00–19:00; chuyến bay đêm 21:30–01:30, không cất cánh trong ca; ghế chưa bán lúc SUMMARY là ghế ế.
- Số khách: không có "sinh đủ khách"; base 5, +1–3/ngày đến ngày 10, +1–2/ngày sau đó; TravelViet (thang 1–5) từ ngày 11: < 3.0 → 30%, 3.0–3.5 → 45%, 3.6–4.4 → 100%, từ 4.5 cộng bonus theo tầng ×3; trần 300 khách/ngày.
- Chấm khách 1–5 sao. POOR không thu tiền. Tip chỉ khách BUSINESS PERFECT = 0.8 × giá vé. BUSINESS trừ điểm gấp đôi.
- Bỏ: chế độ Thư giãn, khách đi đôi, VIP_GROUP, DELAY, màn kết thúc ngày 7. Sự kiện: RUSH, WEATHER (dự báo ở PREP, chốt khi mở cửa: 40% tốt, 40% mất 1/3 ghế tuyến đó, 20% mất hết), có từ ngày 1.
- Chi tiêu SHOP ghi vào ngày hôm sau. Lưới an toàn chỉ còn điều kiện tiền.
- Thêm Onboarding (tên người chơi, tên thương hiệu), cốt truyện genz, nhân vật dẫn truyện Béo.
- Máy bay/cơ trưởng/nhân viên, nợ/phá sản, DELAY: đưa vào backlog §17.
- Chọn "3.0–3.5 → 45%" cho khoảng 3.5–3.6 chủ dự án chưa nói rõ.

## 2026-09-28 — Domain: GameSession sửa state tại chỗ

- Quyết định: `applyCommand` / `advanceTime` (`dayCycle.ts`) sửa `GameState` tại chỗ qua holder `Session`; lệnh bị từ chối kiểm tra hết trước khi sửa nên không để state dở dang. Không có hàm reducer thuần clone state.
- Lý do: `tick` chạy mỗi frame và sim chạy hàng triệu tick; clone toàn bộ state mỗi tick quá tốn. Tính xác định (replay test) vẫn giữ.
- Đã loại: `structuredClone` mỗi command/tick; immutable update thủ công toàn bộ cây state.

## 2026-09-28 — Domain: sub-stream RNG và các chi tiết nhỏ

- Sub-stream: `schedule:{flightId}`, `purchase:{n}`, `weather` (kết quả) + `weather:loss` (chọn ghế mất), `demand` (base) + `demand:bonus`, `support` (lưới an toàn), `routes`, `orders`, `names`, `spawn`. Tách nhỏ để một hệ thống thêm/bớt lời gọi random không làm lệch hệ thống khác.
- `DayRuntime` (routeBag + rng đơn/tên) tạo lại khi `OPEN_COUNTER`, không lưu vào save.
- Điều kiện Shop (ngày mở, TravelViet) tính theo ngày kế tiếp (`day + 1`), vì mua ở Shop có hiệu lực từ ngày sau.
- Tiền dùng `0 - x` khi đổi dấu tổng chi, tránh `-0`.
- Bot test (`__integration__/bots.ts`) là nền cho `scripts/sim.ts` ở bước 5.7.

## 2026-09-28 — UI: PlaygroundScene chỉ tồn tại ở bản dev

- Quyết định: `main.ts` gọi `import('@dev/PlaygroundScene')` trong `if (import.meta.env.DEV)`, bên trong một hàm `async function bootstrap()` gọi bằng `void bootstrap()` — không dùng top-level await. Bản production không có PlaygroundScene trong bundle (đã kiểm bằng `npm run build`: kích thước bundle không đổi khi thêm Playground).
- **Sửa ngày 2026-09-28 (cùng ngày):** bản đầu dùng top-level await (`await import(...)` ở cấp module, không bọc hàm). Chủ dự án báo không mở được qua `dev:host` trên điện thoại dù mạng/tường lửa đều ổn (đã tự kiểm bằng `curl` tới LAN IP, nhận HTTP 200 — server và tường lửa không phải nguyên nhân). Top-level await là cú pháp ES2022 mới, một số WebView trong ứng dụng nhắn tin và trình duyệt Android đời cũ trên máy tầm trung chưa hỗ trợ; lỗi cú pháp ở cấp module khiến toàn bộ script không chạy, không có thông báo lỗi hiển thị cho người dùng. Đổi sang `async function` + `void bootstrap()` để tương thích rộng hơn (PLAN §1.2: Safari iOS + Chrome Android tầm trung), hành vi loại PlaygroundScene khỏi bundle production không đổi.
- Thêm alias `@dev/*` → `src/dev/*` trong `tsconfig.json` và `vite.config.ts`, khớp cây thư mục PLAN §6.1 (`dev/debug.ts`).
- `BootScene` chuyển sang `Playground` khi URL có `?playground` và đang ở DEV; không có nhánh này trong build production (dead-code-eliminated).

## 2026-09-28 — UI: DragController dựa vào Phaser `input.windowEvents`

- Quyết định: không tự đăng ký listener `window.addEventListener('pointerup', ...)` thủ công. Phaser InputManager mặc định lắng nghe `pointerup`/`blur` trên `window` (`game.config.input.windowEvents`, mặc định `true`, không bị tắt ở `main.ts`), nên `pointerup`/`pointerupoutside` của Phaser đã tự kết thúc kéo khi thả ngoài canvas, đúng PLAN §11.1.
- `DragController` chỉ theo dõi đúng `pointer.id` bắt đầu kéo; `target` phải tự `setInteractive()` trước khi tạo controller (kiểm bằng `invariant`).
- Tự dọn qua sự kiện `Phaser.GameObjects.Events.DESTROY` của target, tránh rò rỉ listener toàn cục trên `scene.input` khi target bị huỷ mà quên gọi `destroy()`.

## 2026-09-28 — UI: ScrollList — kéo/chạm phân biệt ở Button, không phải ở list

- Quyết định: `ScrollList` chỉ bắt kéo qua một `viewport` Rectangle trong suốt nằm dưới các item; việc "chạm không nhầm thành kéo" (PLAN §10.4) do chính `Button` tự đảm bảo — `Button` so khoảng cách giữa điểm nhấn và điểm thả (ngưỡng `DRAG_TAP_THRESHOLD_PX`), không cần `ScrollList` biết về các Button con.
- Đã loại: cơ chế `ScrollList` phát cờ `isDragging` để các con tự kiểm tra (yêu cầu con phải biết về cha, tăng khớp nối) — đơn giản hơn vì Button vốn đã cần logic phân biệt kéo/chạm cho chính nó (BaggageSlider, kéo vé sau này).
- Đã kiểm bằng Playwright: kéo danh sách 20 mục ảo hoá đúng, bấm "Chọn" trên item sau khi cuộn vẫn ra đúng toast, không có false-tap trong quá trình kéo.

## 2026-09-28 — `dev:host` chuyển sang HTTP thường, không HTTPS tự ký

- Vấn đề: chủ dự án test trên điện thoại thật, Safari báo "kết nối mạng bị mất". Tự kiểm chứng chỉ do `@vitejs/plugin-basic-ssl` sinh ra: SAN chỉ gồm `localhost`, `127.0.0.1`, `::1` — không có địa chỉ LAN (`192.168.x.x`) mà điện thoại thực sự gọi vào. Plugin không cho cấu hình thêm SAN.
- Quyết định: `npm run dev:host` đổi thành `vite --host` (HTTP thường). Thêm script `dev:host:https` giữ nguyên bản HTTPS cũ, dùng khi cần test API đòi secure context.
- Lý do đổi mặc định sang HTTP: chưa có tính năng nào ở Phase 0–2 cần secure context (Service Worker/PWA là Phase 6). HTTP đơn giản, không phụ thuộc IP LAN thay đổi theo DHCP.
- Đã loại: `vite-plugin-mkcert` (cần cài mkcert hệ thống, phức tạp hơn mức cần ở giai đoạn này) — sẽ cân nhắc lại ở Phase 6 khi thật sự cần test PWA/Service Worker qua HTTPS trên điện thoại.
- Đã kiểm bằng Playwright, điều hướng thẳng tới địa chỉ LAN qua HTTP (giả lập đúng cách điện thoại gọi vào): tải đúng, không lỗi console.

## 2026-09-28 — main.ts: lỗi nạp PlaygroundScene không được chặn cả game

- Vấn đề: sau khi sửa top-level await, chủ dự án test qua HTTP vẫn thấy màn đen. Nguyên nhân: `await import('@dev/PlaygroundScene')` không có try/catch — nếu import lỗi (mạng, hoặc cú pháp thiết bị không hỗ trợ) thì `bootstrap()` ném lỗi trước dòng `new Phaser.Game(...)`, cả game không khởi tạo.
- Quyết định: bọc try/catch quanh import Playground; lỗi (nếu có) chỉ ghi log DEV, không chặn `new Phaser.Game(...)`.
- Thêm `src/platform/logger.ts` (`devError`) làm nơi duy nhất được phép gọi `console.*`, tự kiểm `import.meta.env.DEV`, đúng luật CLAUDE.md "console.log trừ logger có kiểm tra import.meta.env.DEV". ESLint `no-console` giữ nguyên chặn toàn dự án, chỉ file này có `eslint-disable-line` kèm giải thích.

## 2026-09-30 — Seed ván mới sinh bằng `Math.random()` ở TitleScene

- Vấn đề: luật kiến trúc 2 (CLAUDE.md) chỉ cho phép `Math.random()` ở tầng presentation cho hiệu ứng thuần hình ảnh; seed ván mới quyết định toàn bộ chuỗi RNG gameplay (weather/demand/spawn/orders), không phải hiệu ứng hình ảnh — nhưng domain (luật 1) không được đụng `Math.random`/`Date`/`window`, nên không có nơi nào trong domain có thể tự sinh entropy.
- Quyết định: chấp nhận `Math.random()` tại đúng một chỗ — `TitleScene.startNewGame()` — làm nguồn entropy biên (boundary) duy nhất để sinh seed cho `GameSession.newGame(seed)`. Không dùng ở nơi khác cho mục đích tương tự.
- Lý do: đây là ranh giới bắt buộc phải có entropy thật (không thể seed từ chính domain thuần), tương tự cách `BOOTSTRAP_SEED` cố định trước đây (Giai đoạn 3) chỉ là giá trị tạm cho grey box.
- Đã loại: `Date.now()` (cũng "impure" như `Math.random`, ít ngẫu nhiên hơn, không có lợi thế); `crypto.getRandomValues` (phức tạp hơn mức cần cho một seed 31-bit).

## 2026-09-30 — Tab lock: bỏ key `qvn:lock` trong localStorage

- PLAN §9.1 liệt kê `qvn:lock` là key localStorage cho khoá tab, nhưng §9.5 mô tả cơ chế thực tế chỉ dùng `BroadcastChannel('qvn')` (HELLO/ALIVE/TAKEOVER), không nhắc lại `qvn:lock` ở bước nào.
- Quyết định: không tạo key `qvn:lock`; toàn bộ khoá tab chỉ qua BroadcastChannel, đúng như §9.5 mô tả chi tiết.
- Lý do: PLAN §9.1 có vẻ là tài liệu dư/không nhất quán với §9.5; thêm một cơ chế localStorage song song không được §9.5 dùng tới sẽ chỉ tạo thêm trạng thái phải đồng bộ mà không giải quyết thêm rủi ro nào.

## 2026-10-01 — Review Giai đoạn 5: sửa P1, hoãn P2/P3

- Quyết định: sửa 2 P1 (ShopScene xử lý COMMAND_REJECTED; sim.ts đọc cờ SUPPORT_GIFT trước khi playDay) và P2 hard-code ngày TravelViet; hoãn chuyển chuỗi upgrades.ts sang strings.ts, bổ sung test dayCycle và gộp style lặp.
- Lý do: P1 ảnh hưởng hành vi/số liệu; phần còn lại không đổi hành vi, để Giai đoạn 6 (văn bản, D11) xử lý cùng lúc.

## 2026-10-02 — Chốt D2 (font) và D3 (phong cách hình ảnh)

- Quyết định: font Be Vietnam Pro (tiêu đề) + Nunito Sans (nội dung), tự host; phong cách chibi "đất nung – gỗ óc chó" theo bộ mockup Stitch (`docs/STYLE.md`). Thay cho mặc định cũ Nunito + Baloo 2 và flat pastel.
- Lý do: chủ dự án cung cấp bộ thiết kế Stitch và yêu cầu áp dụng.
- Phương án đã loại: giữ bảng xanh trời flat pastel.
- Ngoại lệ: chưa dùng mockup cho điều hướng 4 tab, hồ sơ khách, "Đổi ghế" (không có trong PLAN).

## 2026-10-02 — Audio tổng hợp bằng Web Audio, avatar vẽ bằng code

- Quyết định: SFX và nhạc lofi tạo bằng oscillator (`platform/audio.ts`); gương mặt khách vẽ bằng Graphics (`ui/CustomerAvatar.ts`).
- Lý do: không có file âm thanh/tranh dùng được; không thêm dependency; vẫn hoạt động offline.
- Phương án đã loại: Kenney/asset ngoài (cần chủ dự án chọn); atlas ảnh (cần tranh).

## 2026-10-02 — D1: không cloud save, chỉ xuất/nhập mã

- Quyết định: giữ mặc định PLAN §15 D1 — chỉ `localStorage` + xuất/nhập mã (`QVN1.<base64>.<checksum>`, `save/exportImport.ts`). Nút "Xuất mã save"/"Nhập mã save" nằm trong Cài đặt ở Kho (không hiện giữa ca).
- Lý do: CLAUDE.md "Không có backend"; chủ dự án chưa đề nghị cloud save.
- Phương án đã loại: cloud save (cần backend). Nhập mã dùng hộp thoại gốc của trình duyệt (`prompt`/`confirm`) cho gọn; có thể đổi sang ô nhập trong canvas nếu thấy xấu trên máy thật.

## 2026-10-02 — Cá nhân hoá: nhiều khách đặc biệt trùng slot

- Quyết định: khi nhiều khách đặc biệt cùng ngày cùng bị `atCustomerIndex` đẩy về slot cuối (hoặc trùng slot), khách đến sau lùi về slot trống gần nhất phía trước (`domain/personal.ts`, `slotsOfDay`).
- Lý do: PLAN §16 chỉ nói "thành khách cuối cùng", không nói khi có nhiều khách; cách này giữ mọi khách đặc biệt xuất hiện.
- Phương án đã loại: bỏ qua khách thứ hai.
