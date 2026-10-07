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

## 2026-10-02 — Chỉnh giá vé, tiền tệ "k", cân hành lý bấm giữ

- Quyết định: người chơi chỉnh giá vé từng tuyến ở Kho (−30%…+60%, bước 5%), luôn mở từ ngày 2 (có tutorial). Trần +30% so với giá gốc: vượt trần thì lượng khách tuyến đó nhân 1/2, và ~35% vé bán vượt trần bị huỷ lúc tổng kết (hoàn tiền vé + tip, ghế vẫn mất; hoàn tối đa bằng tiền còn trong quỹ). Dưới trần: cầu giảm dần theo giá (mỗi +1% giá → −1,5% khách ngày thường, −0,5% ngày lễ), giá rẻ thì đông khách. Bỏ hệ số tự động ×1.2 của ngày lễ.
- Ngày lễ (RUSH) có tên (Tết, Giỗ Tổ, 30/4–1/5, Quốc khánh, Trung thu, Giáng sinh) và 2 tuyến "nhu cầu cao" (ưu tiên ×3); báo trước ở Shop (ngày mai) và ở Kho (ngày hôm đó).
- Tiền đổi sang "k" (nghìn đồng), nhân 15 mọi số tiền cũ; giá vé theo mặt bằng Việt Nam (tra Vietnam Airlines/BestPrice/Traveloka), giá vốn giữ nguyên tỉ lệ cũ so với giá bán. Save nâng lên v2, migration v1→v2 nhân tiền ×15 và thêm trường mới (có test).
- Cân hành lý: bấm giữ, số kg chạy qua lại 0⇄30 kg (7 kg/giây), thả tay để chốt (không kéo).
- Lý do: yêu cầu của chủ dự án; cầu giảm dần để việc chọn giá là quyết định thật chứ không luôn đặt sát trần.
- Phương án đã loại: trần khác nhau ngày lễ/ngày thường (trái "không vượt 30%"); huỷ vé ngay lúc giao.

## 2026-10-02 — Cân bằng game bằng sim (tự chỉnh theo PLAN §13.3, chủ dự án đã giao quyền)

Kết quả `SEEDS=200 QUIET=1 npm run sim` sau khi chỉnh (mục tiêu PLAN §13.3 → kết quả):
- PERFECT: nâng cấp đầu tiên ngày 2 (✓ ≤2); mở BKK ngày 11 (✓ 11–13); TravelViet ngày 20 = 4.6 (✓ ≥4.5).
- AVERAGE: nâng cấp đầu tiên ngày 3 (✓); mở BKK ngày 13 (✓ 13–18); TravelViet ngày 20 = 4.0 (✓ 3.6–4.4); ngày lợi nhuận âm (kinh doanh) 15.9% (✓ ≤20%); ghế ế 27.1% (✓ 10–30%).
- POOR: lưới an toàn p50 = 1 lần/30 ngày (✓ ≤3).

Đã đổi số liệu game:
- `SEAT_COST_FACTOR` = 0.8 (giá vốn ghế ×0.8 so với bảng giá thật × tỉ lệ vốn cũ) — biên lợi nhuận mỏng quá khiến bot trung bình lỗ liên tục.
- `OUTCOME_STARS`: `REFUSED_NO_STOCK` 3→4, `REFUSED_CORRECT` 4→5 (hết ghế hoặc từ chối đúng hộ chiếu lỗi không đáng bị trừ điểm uy tín; trước đó trung bình sao của cả bot hoàn hảo chỉ ~3.7).
- `PATIENCE_SCALE` = 1.25 (kiên nhẫn khách ×1.25 mọi ngày).

Đã sửa bot (không phải số liệu game, nhưng ảnh hưởng kết luận): mua ghế xen kẽ giữa các tuyến (trước đây tuyến cuối bị bỏ đói), giữ lại tiền nhập ghế ngày mai trước khi mua nâng cấp, trừ phần khách hộ chiếu lỗi khỏi nhu cầu, giao vé ở đúng patienceRatio 0.8/0.5/0.25 theo PLAN (trước đó dùng thời gian cố định nên PERFECT toàn nhận 4★), làm tròn ghế ECO theo nhu cầu kỳ vọng. Metric "lợi nhuận âm" tính theo lợi nhuận kinh doanh (không tính tiền chi Shop vì đó là đầu tư); ngày mở tuyến = ngày ghi nhận + 1 (mua cuối ngày N dùng từ ngày N+1).

Thí nghiệm giá (40–100 seed): bot hoàn hảo lời nhất ở giá −10%…+15%, +30% kém hơn một chút vì khách đông hơn mà bot phục vụ không xuể; +45% (vượt trần) sụp đổ (tiền ngày 30 giảm từ ~2,2M xuống ~65k). Bot trung bình lời nhất ở +15%…+30% (ít khách → ít quá tải). Ngày lễ: ROI nâng giá +30% ở tuyến nóng = 130.9% so với 112.8% khi chỉ +15% — nâng giá ngày lễ có lợi thật.
Còn tồn: bot hoàn hảo tích luỹ rất nhiều tiền ở cuối (~2,2 triệu k) — chưa có khoản chi lớn để tiêu ở cuối game (cần backlog PLAN §17: mua máy bay, thuê nhân viên).

## 2026-10-04 — Quầy làm việc nhiều vùng (thay luồng 4 bước)
- Quyết định: Counter dùng `CustomerCard` (avatar tròn + khung yêu cầu từng dòng) và `CounterDesk` (kho vé thường/thương gia, chỗ đặt vé, khay con dấu điểm đến + giờ bay, sơ đồ ghế 2-2 không cuộn, cân hành lý, khay vé dịch vụ). Vé chỉ xác định chuyến khi đã đóng đủ hai con dấu.
- Sơ đồ ghế: hạng phổ thông 10 hàng (32 ghế), mọi ghế còn bán được đều chọn được (`holdSeat` gán lại đơn vị ghế dự phòng). Khách khó tính (từ ngày 7) đòi vị trí đầu/giữa/cuối, cửa sổ, lối đi.
- Lý do: yêu cầu của chủ dự án sau khi test; giảm cuộn, giảm số bước.
- Đã loại: giữ StepIndicator/FlightList (đã xoá). Lệnh BUILD_GOTO_STEP còn trong domain nhưng UI không dùng.

## 2026-10-04 — Màn quản lý 4 mục + nhân viên (save v3)
- Quyết định: Mua vé (Prep), Giá vé (Price), Đồ hỗ trợ (Shop), Nhân viên (Staff) là 4 scene dùng chung thanh mục `ManagementTabs` và khung `managementChrome`, chuyển qua lại bất cứ lúc nào. Ở phase SHOP (sau tổng kết) mục Mua vé và Giá vé bị khoá vì chưa có chuyến của ngày mới.
- `SHOP_BUY_UPGRADE`, `SHOP_UNLOCK_ROUTE`, `HIRE_STAFF` chạy được ở cả PREP (có hiệu lực ngay, ghi vào giao dịch hôm nay) lẫn SHOP (tính cho ngày mai). `PriceOverlay` đổi thành `PriceScene`.
- Nhân viên (`src/data/staff.ts`, `src/domain/staff.ts`): thuê một lần + lương mỗi ngày trừ lúc tổng kết (không âm quỹ). Nhân viên rảnh nhận khách đầu tiên trong hàng chờ mà họ xử lý được (không dịch vụ thêm, hộ chiếu đúng, không khách đặc biệt; tập sự không xử lý khách đòi vị trí ghế), bán ngay ghế khớp đơn, chấm điểm sau `serveMs`, sai cân hành lý theo `accuracyPct`.
- Save v3: thêm `staff`, `today.staffTasks`, `lastSummary.staffWages` + migration v2→v3 và test.
- Sim (`HIRE=1 npm run sim`): bot trung bình +25% tiền ngày 30, bot hoàn hảo −22% (lương tốn hơn lợi) — số tiền thuê/lương/độ chính xác mới ước lượng, chưa cân kỹ.

## 2026-10-04 — Nhân viên v4: phụ việc, lương tăng chia 3, lạm phát giá vé
- Quyết định: nhân viên không còn tự bán trọn vé (bản v3 bị bỏ). Mỗi bậc phụ trách việc riêng trên vé nháp của khách đang ở quầy (Junior: hạng vé; Middle: dấu điểm đến + giờ bay và cân hành lý, sai 40%; Senior: chọn ghế và vé dịch vụ); người chơi luôn tự in và giao vé. Tối đa 2 nhân viên quầy; marketing không tính vào 2 chỗ. Cho nghỉ miễn phí, thuê lại trả đủ tiền thuê.
- Lương: mỗi 3 ngày, lương mỗi người tăng thêm 40% phần lợi nhuận/ngày vừa tăng thêm, **chia đều cho 3 người** (2 nhân viên quầy + marketing) để tổng quỹ lương tối đa chỉ tăng 40% lợi nhuận tăng thêm. Lý do: không chia thì 3 người ăn tới ~120% lợi nhuận, bot trong sim phá sản (đã đo bằng `HIRE=1 npm run sim`). Phương án đã loại: mỗi người tăng 40% độc lập.
- Lạm phát: giá bán +8%, giá vốn ghế +4% mỗi 3 ngày (`routeOnDay` làm tròn một chỗ trong `economy.ts`); chi phí mở tuyến, nâng cấp, thuê nhân viên không đổi theo.
- Nghỉ ngẫu nhiên (ốm 4%, gia đình 3%, thai sản 0,5% nghỉ 5 ngày) quyết lúc tổng kết cho ngày mai, báo đích danh nhân viên và việc phụ trách; ngày nghỉ không lương, không tính ngày công.
- Save v4: `staff` là danh sách thực thể, thêm `staffSerial`, `wageRaise`, `profitHistory`, `lastSummary.staffNotices`; bỏ `today.staffTasks`.

## 2026-10-05 — Cân bằng nhịp game ngắn hơn, phạt theo giá vé, nhạc nền file
- Ca quầy: `MS_PER_GAME_MINUTE` 500 → 364 (660 phút game ≈ 4 phút thật). Đã thử 270 (3 phút): ghế ế 37% và khách bỏ về vì đông 23% ở bot PERFECT, quá gắt; 4 phút đưa hai chỉ số về 22% và 7%.
- Kiên nhẫn khách: `PATIENCE_SCALE` 1,25 → 0,9, `PATIENCE_MIN_MS` 24000 → 16000, `PATIENCE_PER_COMPLEXITY_MS` 5000 → 3500, `QUEUE_PATIENCE_RATE` 0,5 → 0,3. Đã thử rate 0: hàng chờ kẹt đầy, khách bỏ về vì đông 50%, tiền ngày 30 của PERFECT giảm 90%.
- Khách 10 ngày đầu: `EARLY_DAYS_CUSTOMER_MULT` 1,2 → 1,5. Hàng chờ cơ bản 6, nâng cấp Quầy rộng 10.
- Nâng cấp ×1,5 giá. Phạt không còn số cố định: `OUTCOME_PENALTY_RATE` × giá vé của đơn (FAILED 0,35, SOLD_INVALID 0,55, REFUSED_WRONG 0,27, LEFT 0,14), làm tròn trong `economy.ts`. Bot POOR chịu nặng nhất (tiền ngày 30 −35%, lưới an toàn kích hoạt 2 lần).
- Sự kiện ngẫu nhiên: thời tiết 30% số ngày (tốt 30%, xấu 50%, nghiêm trọng 20% trong ngày có thời tiết → xấu 15%, nghiêm trọng 6% tổng số ngày), ngày lễ 15%. `npm run sim` báo thêm tỉ lệ và thiệt hại thời tiết.
- Nhạc nền tự soạn bằng code (không dùng file, tránh bản quyền C418 và không tăng dung lượng). `calm` theo thiết kế `mo-ta-nhac/Gio_Qua_Chieu_Nhe_Game_Music_Design.md` ("Gió Qua Chiều Nhẹ", 72 bpm, Rê trưởng, 47 ô nhịp ≈ 2:37, lặp được): intro piano + sáo, A sáo dẫn, B violin đối đáp, solo guitar clean ~17 s, C sáo + violin hòa giọng quãng ba, outro giảm dần; thêm trống nhẹ (trống đế, rim, hat) từ phần A và chũm chọe (chiêng) báo vào phần B, solo, C. `busy` dùng chung đúng bản này (chuyển màn không khởi động lại bài). Dữ liệu ở `src/data/music.ts`, nhạc cụ ở `src/platform/instruments.ts`. Đã thử dùng file CC0 "Infinite World" nhưng bỏ để tự soạn.
- Lỗi có sẵn từ trước, chưa xử lý: `npm run build` fail vì `assets/atlas/characters.png` 2,48 MB vượt giới hạn precache 2 MiB của workbox.
- Tuyến có dự báo thời tiết xấu (sự kiện WEATHER, trước khi biết kết quả) được giảm 50% giá vốn ghế (`WEATHER_FORECAST_COST_DISCOUNT`, tính ở `seatUnitCost` trong `economy.ts`). Ghế mua lưu `unitCost` đã giảm nên hoàn tiền và thiệt hại thời tiết tính theo giá thật đã trả. Dự báo xấu nhưng kết quả có thể là tốt (30%), nên người chơi được cược rủi ro.
- Chỉnh giá vé khoá trong 12 ngày đầu (`PRICING_UNLOCK_DAY = 13` trong `data/pricing.ts`): lệnh `SET_ROUTE_PRICE` bị từ chối `PRICING_LOCKED`, tab "Giá vé" bị vô hiệu ở màn quản lý. Lý do: giảm lợi nhuận đầu game (bot PERFECT dùng +15% đến +30% từ ngày 1). Bot trong sim bỏ qua bước chỉnh giá khi còn khoá.
- Sửa lỗi hiển thị quầy: khung yêu cầu của khách (`CustomerCard`) tạo container ở đầu danh sách vẽ nên che vé đang kéo; nay container nằm trong `CustomerCard` (dựng trước quầy) nên vé luôn nằm trên.
- Làm mềm cú nhảy khách ở ngày 11: hệ số TravelViet, thưởng sao và việc bỏ hệ số khách đầu game (`EARLY_DAYS_CUSTOMER_MULT`) trộn dần trong `TRAVELVIET_RAMP_DAYS = 10` ngày (`travelVietBlend` trong `demand.ts`). Ngày 1–10 không đổi (chỉ tăng, test kiểm). Kết quả với TravelViet 4,7: ngày 10 → 11 tăng +14% (trung bình, tối đa +29%) thay vì ~+37%. Sim 20 ngày: lãi 5 ngày 11–15 của PERFECT giảm từ 1,01 triệu xuống 0,82 triệu, còn lại do giá tuyến xa và biên lợi nhuận 45–57% chứ không phải số khách.

## 2026-10-05 — Cân bằng lại kinh tế (biên lợi nhuận) và giao diện quầy
- Kinh tế: chi tiết từng phương án A0 → J và kết quả sim nằm trong `docs/CAN_BANG_KINH_TE.md`. Tóm tắt cấu hình cuối: giá vốn = giá bán × (1 − biên) với biên nội địa 15% và quốc tế 25–30% (`SEAT_MARGIN_BY_ROUTE`, bỏ `SEAT_COST_FACTOR`); lạm phát giá và vốn cùng +10% mỗi 3 ngày; phí hành lý và vé dịch vụ lạm phát theo; tip Business 0,2; phạt giảm (FAILED 0,25 …) và ân hạn ×0,5 trong 10 ngày đầu; hoàn 40% tiền ghế ế; trần giá +20%, tối đa +40%; TravelViet tính trên 200 khách gần nhất, 5 sao cần giao còn ≥85% kiên nhẫn, ngưỡng mở tuyến 3,5 / 3,7 / 3,9 / 4,1; hàng chờ 8 (nâng cấp 12). Lượng khách giữ nguyên.
- Giao diện quầy: bỏ ba nút ở đáy. Vé nháp (màu xám, nhãn "CHƯA IN") kéo vào **máy in** ở góc dưới phải; máy rung và có thanh tiến độ khi in; vé đã in (màu tươi, dấu "ĐÃ IN") chui ra bay về chỗ cũ rồi kéo (hoặc chạm) để giao khách. "Từ chối" chuyển sang khung khách, "Làm lại" thành nút nhỏ ở góc dưới trái. Ảnh máy in dởm/xịn (theo nâng cấp máy in nhanh) và ảnh vé nhập từ `DESIGN/.../ảnh` (đã cắt nền, nén) vào `public/assets/items/`.
- Khay điểm đến cuộn dọc (3 con dấu mỗi hàng, thấy 2 hàng, vuốt để xem thêm) nên thêm tuyến mới không vỡ bố cục; vị trí cuộn được giữ khi dựng lại.
- Sửa lỗi build có sẵn: `characters.png` 2,48 MB vượt giới hạn precache 2 MiB của workbox; nâng `maximumFileSizeToCacheInBytes` lên 4 MiB (`vite.config.ts`). `npm run build` chạy xong, precache 7,3 MB.

## 2026-10-07 — Vé 3 ngày, đóng cửa sớm, khách đầu game, save v5, luồng Shop mới
- Ghế có hạn 3 ngày (`SEAT_VALID_DAYS`, `expiresDay` trên từng ghế): ghế chưa bán được mang sang ngày sau (`carryOverSeats`, chuyến lặp hằng ngày theo cặp tuyến + khung giờ), hết hạn mới mất; tổng kết báo "ghế hết hạn ngày mai". Lưới an toàn không tặng ghế khi còn ghế bán được. Tác động: ghế ế của bot từ 13–17% xuống ~1%, nên phải hạ biên lợi nhuận.
- Đóng cửa sớm (`CLOSE_EARLY`, nút ⏭ cạnh nút tạm dừng ở Quầy): không phạt, vẫn trả lương; khách chưa phục vụ không tính là bỏ về. Gợi ý mỗi lần khi hết ghế bán được. Ngày hướng dẫn/ngày đặc biệt không đóng sớm được.
- Khách đầu game: `EARLY_CUSTOMER_BONUS = [15, 20, 25, 30, 20, 10, 5]` cộng thẳng vào số khách ngày 1–7 (sim: ngày 1–4 từ 8,5/11,3/14,5/17,8 lên 24,5/32,7/41,4/49,9). Một mình nó gần như không đổi thu nhập (bị giới hạn bởi vốn và tốc độ phục vụ).
- Biên lợi nhuận hạ: nội địa 15% → 12%, Bangkok 25 → 22%, Seoul 27 → 24%, Tokyo 28 → 25%, Paris 30 → 27%. Đã thử 10% và 8% (400/300 seed): AVERAGE ngày 40 giảm 28% và 37%, vượt ngưỡng ±25% nên loại. Kết quả 400 seed (cấu hình đã chọn): AVERAGE ngày 10 = 47,6k (−6%), ngày 40 = 453k (−18%), mở Bangkok ngày 19; PERFECT ngày 40 = 5,9 triệu (−8%); POOR lưới an toàn 9 lần/40 ngày. Chưa đạt tiêu chí phụ: PERFECT giàu vẫn ngày 18 (mục tiêu ≥ 23) — biên không phải đòn bẩy chính cho chỉ số này. Chờ chủ dự án chơi thử.
- Save v5: thêm `expiresDay`; `migrateV4ToV5` (ghế còn bán được được 3 ngày, ghế đã bán/hết hạn chỉ giữ trong ngày); bản sao lưu thô `qvn:save:before-v5` ghi một lần trước khi migrate; có 4 save v4 thật làm fixture (`src/save/__fixtures__`) và test migrate không mất dữ liệu.
- Luồng Shop: sau Tổng kết game sang ngày mới ngay (`GO_TO_SHOP` rồi `NEXT_DAY` trong `sessionBridge.enterNextDayPrep`), nên Mua vé, Giá vé, Đồ hỗ trợ, Nhân viên cùng dùng được ở phase PREP. Nút "Ngày tiếp theo" hỏi xác nhận rồi mở cửa luôn. Domain không đổi; save cũ đang ở phase SHOP được đưa về PREP lúc bấm Tiếp tục. Phương án đã loại: sinh sẵn chuyến ngày mai ngay ở phase SHOP (phải đổi domain và schema).
- Giao diện: quy tắc mới trong CLAUDE.md "ô hiện thông tin phải có màu, có khung, đủ to". Thêm `InfoBox`, đổi `textMuted` đậm hơn (0x6a4d38), "Dự kiến N khách" chỉ ở tab Mua vé, ô TravelViet là khung dài dưới ô tiền (ô tiền căn giữa), chữ thông tin cảnh/Nhân viên/Tổng kết tối thiểu 20px. Chưa nâng chữ nhỏ (14–17px) của các widget bàn quầy (con dấu, vé nháp, sơ đồ ghế) vì cần sửa bố cục từng cái.
- Ảnh nhân viên: atlas `staff` (5 nhân viên × 3 biểu cảm) cắt bằng `tools/buildStaffAtlas.mjs`, hiện ở màn Nhân viên và chip ở Quầy.

## 2026-10-07 — Bỏ nút "Làm lại", bỏ hạn hộ chiếu, khách nói tự nhiên, Béo hướng dẫn mọi nút
- Bỏ nút "Làm lại" và lệnh `BUILD_RESET`: mọi bước lắp vé đều chạm lại để đè được (đổi hạng hoặc dấu làm đổi chuyến thì ghế đang giữ tự trả về kho). Nhân viên không còn bị chặn làm lại sau một lần Làm lại, nhưng vẫn không ghi đè bước người chơi đã làm.
- Bỏ hạn hộ chiếu: hộ chiếu lỗi chỉ còn sai tên (`isPassportValid` không cần ngày, `Passport.expiresDay` bị bỏ khỏi model và schema save; save cũ vẫn đọc được vì zod bỏ qua khoá thừa). Tỉ lệ hộ chiếu lỗi `pBadPassport` giữ nguyên. Ngày sinh và quê quán trên thẻ hộ chiếu chỉ để trang trí, suy ra từ mã khách (`passportProfileOf`), không nằm trong save.
- Khung yêu cầu của khách là lời nói tự nhiên (`orderSpeech`), chỉ nhắc điều khách cần; tên ngoài quầy chỉ một chữ (chữ cuối của họ tên). Cảnh báo sự kiện chỉ hiện một lần lúc mở quầy rồi mờ dần.
- Nút Từ chối là nút tròn chỉ có ✋. Béo hướng dẫn mọi nút (Từ chối, ⏸ và ⏭, 🛂, 4 mục quản lý, ⚙, Đồ hỗ trợ, Nhân viên, Tổng kết); người chơi cũ thấy các lời mới một lần.
