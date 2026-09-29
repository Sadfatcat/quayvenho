# ROADMAP — Quầy Vé Nhỏ

Kế hoạch thực thi chia nhỏ theo giai đoạn và bước. Đặc tả game nằm ở `docs/PLAN.md`; file này chỉ nói làm gì, theo thứ tự nào, xong khi nào.

## Cách dùng

- Làm đúng thứ tự: giai đoạn → bước. Không nhảy bước, không gộp nhiều bước vào một lần code.
- Mỗi bước giới hạn theo phạm vi, không theo thời gian: một module (hoặc một nhóm nhỏ liên quan chặt) kèm test, một commit, diff đủ nhỏ để chủ dự án đọc duyệt trong khoảng 15 phút.
- Hết mỗi bước: chạy `npm run typecheck && npm run lint && npm run test`, tick ô trong file này, cập nhật `docs/STATUS.md`.
- Hết mỗi giai đoạn: làm bước **Review** (mẫu bên dưới), rồi dừng và hỏi chủ dự án trước khi sang giai đoạn sau.
- Trạng thái ô: `[ ]` chưa làm, `[~]` đang làm, `[x]` xong.

## Luật common component

- Common component là code dùng chung: helper domain, component UI Phaser, hàm tiện ích save/platform. Danh sách nằm ở mục **Registry** cuối file.
- Tạo common khi: đã có ≥ 2 chỗ dùng thực tế, hoặc Registry đã ghi rõ ≥ 2 chỗ sẽ dùng trong các bước đã lên kế hoạch.
- Không tạo common "phòng khi cần". Một chỗ dùng thì viết tại chỗ.
- Khi Review phát hiện một đoạn logic/UI lặp ở ≥ 2 nơi: tách thành common, sửa các chỗ dùng, thêm dòng vào Registry.
- Common UI nằm trong `src/ui/`, common domain nằm trong `src/domain/common/`, mỗi file có test (domain) hoặc có mặt trong UI Playground (UI).

## Mẫu bước Review (cuối mỗi giai đoạn)

1. Typecheck, lint, test xanh; đối chiếu từng acceptance của giai đoạn, ghi kết quả vào `STATUS.md`.
2. Quét trùng lặp trong code của giai đoạn vừa xong: logic, style, layout, pattern xử lý input. Tách phần lặp thành common, cập nhật Registry.
3. Đọc trước các bước của giai đoạn tiếp theo: liệt kê common component / helper cần mà chưa có, thứ cần sửa ở code hiện tại, rủi ro.
4. Ghi kết quả phân tích vào mục "Ghi chú review" của giai đoạn tiếp theo trong file này (thêm, bớt, đổi thứ tự bước nếu cần).
5. Dừng, báo cáo chủ dự án: đã xong gì, đã tách common gì, đề xuất điều chỉnh cho giai đoạn sau.

## Bảng đối chiếu với PLAN §12

| Giai đoạn | Nội dung | PLAN §12 |
|---|---|---|
| 0 | Nền móng dự án | Phase 0 |
| 1 | Domain core | Phase 1 |
| 2 | Bộ UI dùng chung | (mới, tách từ Phase 2) |
| 3 | Quầy grey box | Phase 2 |
| 4 | Title, Onboarding, Kho, Tổng kết, Lưu game | Phase 3 |
| 5 | Tiến trình đầy đủ | Phase 4 |
| 6 | Art, audio, tutorial, cốt truyện | Phase 5 |
| 7 | Mobile hardening, PWA, deploy | Phase 6 |
| 8 | Ngày đặc biệt, cá nhân hoá | Phase 7 |

---

## Giai đoạn 0 — Nền móng dự án

Mục tiêu: dự án chạy được, lint chặn sai kiến trúc, có CI và bản deploy thử.

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [x] 0.1 | Cài dependency theo CLAUDE.md, chuyển PLAN vào `docs/` | `package.json` | `npm run dev` hiện chữ "Quầy Vé Nhỏ" trên nền trời, không lỗi console |
| [x] 0.2 | Kiểm tra rule ESLint của domain | `eslint.config.js` | Tạo tạm `src/domain/x.ts` import `phaser` / dùng `Math.random` / `Date` → lint báo lỗi; xoá file tạm |
| [~] 0.3 | HTTPS trong LAN | `vite.config.ts` | `npm run dev:host` mở được trên điện thoại cùng Wi-Fi — chờ chủ dự án thử trên điện thoại |
| [~] 0.4 | `git init`, `.nvmrc`, GitHub Actions | `.github/workflows/ci.yml` | CI chạy typecheck, lint, test, build và xanh — đã có commit, chờ repo GitHub |
| [~] 0.5 | Deploy thử Cloudflare Pages, viết hướng dẫn vào README | `README.md` | Mở link `*.pages.dev` trên điện thoại — README xong, chờ tài khoản Cloudflare |
| [x] 0.R | Review giai đoạn 0 | — | Theo mẫu Review |

Không tạo sẵn toàn bộ cây thư mục placeholder: file được tạo ở đúng bước dùng tới nó.

---

## Giai đoạn 1 — Domain core (TypeScript thuần, không UI)

Mục tiêu: toàn bộ luật game chạy được chỉ bằng `dispatch` / `tick`, có test.

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [x] 1.1 | Common domain | `domain/common/result.ts` (`ok`/`err`), `invariant.ts`, `math.ts` (`clamp`, `sum`) | Test đủ happy + biên |
| [x] 1.2 | RNG và ShuffleBag | `domain/rng.ts`, `domain/shuffleBag.ts` | Test theo PLAN §13.1 (tái lập, biên `int`, `weighted` ±2%, túi không lặp quá `weight`) |
| [x] 1.3 | Model và dữ liệu | `domain/models.ts`, `data/routes.ts`, `schedule.ts`, `upgrades.ts`, `events.ts`, `days.ts`, `customers.ts` (thoại tạm 1 câu), `strings.ts` | Typecheck xanh; test `getDayConfig(day)` lấy đúng dòng gần nhất và giảm patience từ ngày 11 |
| [x] 1.4 | Đồng hồ, sơ đồ ghế, lịch bay | `domain/clock.ts`, `seatMap.ts`, `schedule.ts` | Test: 08:00 = 480, format 00:30, khung NIGHT/LATE; window/aisle; số chuyến theo ngày, mã ổn định, ghế đại lý khác 40–70% |
| [x] 1.5 | Kinh tế | `domain/economy.ts` (`roundMoney`, giá vốn, doanh thu, tip, transaction log, `summarizeDay`) | Test §5.2, §5.3, invariant tiền, chi Shop ghi ngày sau |
| [x] 1.6 | Kho ghế | `domain/inventory.ts`, `canServe.ts` | Test mua (chiết khấu, giới hạn, thiếu tiền, bias), hold/release/sell, hết hạn cuối ngày, mất do thời tiết |
| [x] 1.7 | Lượng khách và TravelViet | `domain/demand.ts` | Test §3.9: base, bảng factor ở mọi biên, bonus theo tầng, RUSH, trần 300 |
| [x] 1.8 | Chấm điểm | `domain/scoring.ts` | Mỗi `ScoreOutcome` ≥ 1 test; BUSINESS trừ đôi; tip chỉ BUSINESS PERFECT; POOR không thu tiền |
| [x] 1.9 | Sinh đơn và lịch khách đến | `domain/orderGen.ts`, `spawner.ts` | Invariant §8.4 trên 2.000 seed × 30 ngày; mốc đến trong [486, 1110] |
| [x] 1.10 | Nâng cấp, sự kiện, lưới an toàn | `domain/upgrades.ts`, `events.ts`, `safetyNet.ts` | Test modifiers cộng dồn; tỉ lệ sự kiện và thời tiết hội tụ; lưới an toàn đúng ngưỡng |
| [x] 1.11 | Reducer phần ngoài ca | `domain/dayCycle.ts`: `createNewGame`, `PROFILE_SET`, `PREP_*`, `OPEN_COUNTER`, `GO_TO_SHOP`, `SHOP_*`, `NEXT_DAY`, `SETTINGS_UPDATE`, `FLAG_SET` | Test reject đúng phase, NEXT_DAY hai lần chỉ sang 1 ngày |
| [x] 1.12 | Reducer trong ca và `tick` | `domain/dayCycle.ts`: `BUILD_*`, `PRINT_TICKET`, `DELIVER_TICKET`, `REFUSE_CUSTOMER`, tick (đồng hồ, kiên nhẫn, sinh khách, máy in, RESOLVING, CLOSING → SUMMARY) | Test giao vé thắng hết kiên nhẫn cùng tick; delta 5000 bị clamp |
| [x] 1.13 | Facade và test tích hợp | `domain/game.ts`, `domain/__integration__/*` | `fullDay`, `thirtyDays`, `replay` xanh; coverage ≥ 90% lines / 85% branches (cần D10) |
| [x] 1.R | Review giai đoạn 1 | — | Theo mẫu Review. Chú ý: helper lặp giữa `scoring`/`economy`/`inventory` |

Ghi chú review (từ 0.R):
- Bước 1.13: thêm khối `coverage` (provider v8, include `src/domain/**`, ngưỡng 90/85) vào `test` trong `vite.config.ts` và script `test:coverage`.
- Test invariant 2.000 seed × 30 ngày có thể chậm: đặt trong file riêng, nếu > 30 s thì giảm seed ở `npm run test` và giữ số đầy đủ ở một script riêng (hỏi trước khi đổi acceptance).
- `tsx` đọc được path alias từ `tsconfig.json`, dùng cho `scripts/sim.ts` ở bước 5.7.
- Build cảnh báo chunk 1,2 MB (Phaser): để giai đoạn 7 xử lý (tách chunk Phaser hoặc nâng `chunkSizeWarningLimit`), không làm bây giờ.
- Chưa tách common gì ở giai đoạn 0 (chưa có code lặp).

---

## Giai đoạn 2 — Bộ UI dùng chung

Mục tiêu: có sẵn các component Phaser mà ≥ 2 màn sẽ dùng, xem được trong một màn Playground trước khi ráp vào game.

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [x] 2.1 | Nền tảng giao diện | `ui/theme.ts` (màu, cỡ chữ, bo góc, khoảng cách), `ui/textStyles.ts`, `ui/layout.ts` (safe area, vùng chạm 88) , `scenes/BaseScene.ts` | Scene mới kế thừa BaseScene có nền, safe area, font đúng |
| [x] 2.2 | Khối cơ bản | `ui/Button.ts` (nhấn, disabled, khoá sau khi bấm), `ui/Panel.ts` (nền bo góc, dùng cho Card/Dialog/Bubble), `ui/IconLabel.ts` | Hiện trong Playground ở 360×640 và 430×932 |
| [x] 2.3 | Lớp phủ | `ui/BaseOverlay.ts` (làm mờ, chặn input phía dưới, đóng khi chạm ngoài tuỳ chọn), `scenes/overlays/DialogOverlay.ts`, `ui/Toast.ts` | Dialog 1–3 nút; toast xếp hàng không chồng nhau |
| [x] 2.4 | Tương tác | `ui/DragController.ts` (chỉ pointer đầu, `pointerup` trên window), `ui/ScrollList.ts` (kéo/chạm ngưỡng 10 px, ảo hoá > 15 item), `ui/ProgressBar.ts` | Kéo ra ngoài canvas vẫn kết thúc; cuộn không kích hoạt nút |
| [x] 2.5 | Hiệu ứng số | `ui/FloatingText.ts` (tiền bay lên), `ui/CountUpText.ts` (đếm số) | Hiện trong Playground |
| [x] 2.6 | Cầu nối domain | `scenes/sessionBridge.ts` (giữ `GameSession`, `dispatch`, phát `DomainEvent` cho scene đăng ký, gọi `tick`), `platform/visibility.ts`, `scenes/overlays/PauseOverlay.ts` | Ẩn tab → pause; quay lại thấy PauseOverlay |
| [x] 2.7 | UI Playground (chỉ DEV) | `dev/PlaygroundScene.ts` | Mở bằng `?playground`, liệt kê mọi common UI |
| [x] 2.R | Review giai đoạn 2 | — | Theo mẫu Review |

Ghi chú review (từ 2.R):
- Common UI đã đủ cho giai đoạn 3: `TopBar` (3.1) dựng từ `IconLabel` + `Panel`; `SpeechBubble`/`PatienceBar` (3.2) dựng từ `Panel`/`ProgressBar`; `FlightList` (3.3) là một `ScrollList<Flight>` với `renderItem` trả `Container` chứa 2 `Button` (ECO/BIZ); `SeatMapView` (3.4) là lưới `Button`-như (nhấn/chọn) không cần ScrollList; `BaggageSlider` (3.5) dùng `DragController` trên một handle riêng, snap gọi thẳng domain `snapBaggage` (đã export ở `dayCycle.ts`); máy in và kéo vé (3.6) dùng `ProgressBar` + `DragController`; kết quả dùng `showFloatingText`.
- `DialogOverlay`/`PauseOverlay` dùng `TEXT_STYLES.heading` cho tiêu đề — CounterScene/PrepScene cũng nên dùng `TEXT_STYLES` thay vì hardcode style, trừ khi cần cỡ chữ riêng.
- `Button.lock()/unlock()`: gọi `lock()` ngay trước `sessionBridge.dispatch(...)`, `unlock()` khi nhận `DomainEvent` tương ứng (hoặc `COMMAND_REJECTED`) — áp dụng cho nút "In vé", "Giao vé", "Xác nhận nhập ghế" ở giai đoạn 3–4 để chặn double-tap (PLAN §14.2, §14.6).
- Cần thêm vào `data/strings.ts` ở giai đoạn 3: nhãn `MistakeCode`, lý do `COMMAND_REJECTED` hiện toast, thoại khách theo kết quả (§4.6, tạm 1 câu), nhãn 4 bước A-B-C-D cho `StepIndicator`.
- `ScrollList.destroy()` đã tự dọn `DragController` và mask graphics — scene chỉ cần gọi `.destroy()` khi rời màn, không cần dọn thủ công thêm.
- Toạ độ/khoảng cách UI để trong `ui/layout.ts`, không rải số trong scene.

---

## Giai đoạn 3 — Quầy grey box

Mục tiêu: chơi hết một ngày ở Quầy bằng hình khối, với profile và lô ghế cố định (bỏ qua Onboarding và Kho).

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [x] 3.1 | Khung màn Quầy | `scenes/CounterScene.ts`, `ui/TopBar.ts` (dùng lại ở Kho) | Bố cục đúng bảng PLAN §10.6; đồng hồ chạy |
| [x] 3.2 | Khách và hàng đợi | `ui/SpeechBubble.ts` (dùng lại cho thoại Béo), `ui/PatienceBar.ts` (dựa trên ProgressBar), hình khách placeholder | Khách vào hàng, lên quầy, đổi mood, bỏ đi |
| [x] 3.3 | Bước A | `ui/StepIndicator.ts`, `ui/FlightList.ts` (trên ScrollList) | Chọn chuyến + hạng; dòng xám đúng luật |
| [x] 3.4 | Bước B | `ui/SeatMapView.ts` | Chỉ bấm được ghế của mình còn trống |
| [x] 3.5 | Bước C | `ui/BaggageSlider.ts` (trên DragController), `ui/ExtrasToggles.ts` | Snap ≤ 1 kg; kéo ra ngoài canvas kết thúc đúng |
| [x] 3.6 | Bước D, in vé, giao vé | `ui/TicketView.ts`, máy in (ProgressBar), kéo vé (DragController), kết quả (FloatingText) | Thả ngoài → vé quay về; thả vào khách → chấm điểm |
| [x] 3.7 | Nút phụ và hết ngày | Làm lại, Từ chối; tổng kết text thô | Chơi hết ngày 1 trên điện thoại thật |
| [x] 3.R | Review giai đoạn 3 | — | Theo mẫu Review. Chú ý: phần lặp giữa FlightList / SeatMapView / ExtrasToggles (nút chọn có trạng thái) |

Ghi chú review (từ 3.R):
- `sessionBridge.start(session)` (gọi ở BootScene tạm thời) cần thay bằng luồng thật: `save/storage.ts` đọc save có sẵn → `sessionBridge.start(...)`; không có save → `OnboardingScene` → `PROFILE_SET` → `sessionBridge.start(...)`. Xoá `BOOTSTRAP_SEED`/bootstrapFixedSession khỏi BootScene khi có PrepScene thật.
- `TopBar` giờ có 2 chỗ dùng (CounterScene xong, PrepScene sẽ dùng ở 4.5) — khi làm PrepScene, `leftLabel` đổi từ giờ sang "Ngày {n}", `icon` đổi từ ⏸ sang ⚙ (đã có `STRINGS.common.settingsIcon`), `onIconTap` mở `SettingsOverlay` (chưa có, làm ở 5.6) thay vì `PauseOverlay`.
- `src/dev/debug.ts` (expose `sessionBridge` lên `window.__sessionBridge`, chỉ DEV) hữu ích để kiểm bằng Playwright: đọc thẳng state thay vì đoán toạ độ pixel. Dùng tiếp ở các giai đoạn sau khi cần test qua `run_code_unsafe` + `page.evaluate`.
- `FlightList` giờ có `readOnly` — khi làm ShopScene/PrepScene nếu cũng cần danh sách xem-trước, tái dùng cờ này thay vì tạo biến thể mới.
- `StepIndicator` cần `onStepTap`; nếu sau này có nơi khác dùng StepIndicator không cho quay lại (ví dụ tutorial khoá bước), truyền `() => {}`.
- Vé kéo-thả dùng ngưỡng `COUNTER_SURFACE_Y = 650` cố định trong CounterScene — nếu bố cục đổi ở giai đoạn sau, cập nhật cùng lúc với y của "Mặt quầy" trong PLAN §10.6.
- `showDaySummary` hiện là text thô (đúng scope 3.7); SummaryScene thật (4.6) nên tái dùng cấu trúc `lines` này làm khung, thêm `CountUpText` cho hiệu ứng đếm số.
- Rủi ro hiệu năng chưa kiểm: SeatMapView/FlightList dựng lại toàn bộ GameObject mỗi khi build-signature đổi (không pool). PLAN §11.4 chỉ bắt buộc pooling cho particle đồng xu; theo dõi ở Phase 5/6 nếu máy tầm trung giật khi đổi bước liên tục.

---

## Giai đoạn 4 — Title, Onboarding, Kho, Tổng kết, Lưu game

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [x] 4.1 | Lưu trữ an toàn | `save/storage.ts`, `save/schema.ts`, `save/migrate.ts` (v0→v1 giả) | Test round-trip, JSON hỏng → prev, version tương lai, clamp giá trị bẩn |
| [x] 4.2 | Khoá tab | `save/tabLock.ts` | Tab thứ hai hiện "Game đang mở ở tab khác" |
| [x] 4.3 | Boot và Title | `scenes/BootScene.ts`, `PreloadScene.ts`, `TitleScene.ts` | Chơi tiếp / Chơi mới đúng luật §10.3 |
| [x] 4.4 | Onboarding | `ui/TextInput.ts`, `scenes/OnboardingScene.ts` (thoại tạm) | Nhập tên + thương hiệu, validate độ dài |
| [x] 4.5 | Kho | `ui/Stepper.ts`, `scenes/PrepScene.ts` | Mua ghế, chiết khấu, 3 hộp thoại "Mở cửa" |
| [x] 4.6 | Tổng kết | `scenes/SummaryScene.ts` (CountUpText) | Hiện đủ dòng §5.6, chạm để bỏ qua hiệu ứng |
| [x] 4.7 | Mốc lưu và chơi tiếp | nối save với sessionBridge | Acceptance Phase 3 trong PLAN §12 |
| [x] 4.R | Review giai đoạn 4 | — | Theo mẫu Review |

Ghi chú review (từ 4.R):
- **Sai lệch so với PLAN §9 bị code-reviewer bắt được và đã sửa**: key localStorage đổi từ `quayvenho:save`/`:backup` sang đúng `qvn:save`/`qvn:save:prev` (PLAN §9.1); `tabLock.ts` viết lại đúng giao thức HELLO/ALIVE/TAKEOVER (PLAN §9.5) thay vì PING/PONG đơn giản ban đầu — tab thứ hai giờ có nút "Chơi ở đây" thật sự khiến tab cũ dừng lưu và hiện màn "Game đã mở ở tab khác" (đã kiểm bằng Playwright 2 tab thật); thêm `isStorageAvailable()`/`requestPersistentStorage()` gọi lúc Boot (PLAN §9.4/§9.7); `SummaryScene` sửa bug chạm-bỏ-qua-hiệu-ứng không hiện nốt các dòng chưa tới lượt (P1).
- **Quyết định ghi vào DECISIONS.md**: `Math.random()` chấp nhận dùng đúng 1 chỗ (`TitleScene.startNewGame`) làm nguồn entropy biên cho seed ván mới; bỏ key `qvn:lock` (PLAN §9.1 dư, §9.5 không dùng tới).
- **Tự phát hiện thêm 1 bug khi tự kiểm bằng Playwright** (không phải code-reviewer báo): overlay khoá tab (`BaseScene.showTabLockOverlay`) quên `overlay.add(panel)` nên nút "Chơi ở đây" hiện đúng nhưng không bấm được (backdrop phía sau chặn click dù panel vẽ đè lên trên) — đã sửa, đã kiểm lại bằng 2 tab Playwright thật (không phải mô phỏng), xác nhận tab bị chiếm dừng lưu (`sessionBridge.isPaused === true`) và tab kia chơi tiếp bình thường.
- **`ShopScene` chưa tồn tại (Giai đoạn 5)**: `SummaryScene."Tiếp tục"` tạm thời dispatch `GO_TO_SHOP` rồi `NEXT_DAY` liền để bỏ qua Shop — có comment rõ trong code là tạm, Giai đoạn 5 bước 5.1 phải xoá dòng `NEXT_DAY` thừa đó và để người chơi dừng lại ở `ShopScene` thật.
- **`TopBar` icon ⚙ ở Kho** tạm thời vẫn mở `PauseOverlay` (chưa có `SettingsOverlay` — Giai đoạn 5 bước 5.6), đúng như ghi chú đã để lại từ 3.R.
- Đã kiểm bằng Playwright ở 360×640 và 430×932, qua toàn bộ luồng Onboarding → Kho (mua ghế, chiết khấu, xác nhận) → Quầy → Tổng kết (đếm số, mẹo Béo khi lỗ, "Tiếp tục") → Kho ngày 2 → refresh giữ đúng tiến trình → JSON hỏng tự khôi phục + toast → mở 2 tab thật (tab mới hiện "Chơi ở đây", tab cũ dừng lưu) — 0 lỗi console toàn bộ.

---

## Giai đoạn 5 — Tiến trình đầy đủ

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [ ] 5.1 | Shop | `ui/SegmentedControl.ts` (dùng lại cho seat bias ở Kho), `ui/Card.ts`, `scenes/ShopScene.ts` | Mua nâng cấp, mở tuyến, hiện điều kiện |
| [ ] 5.2 | Cơ chế theo ngày | `ui/PassportCard.ts`, bật field đơn theo §4.5 | Mỗi cơ chế chỉ xuất hiện từ đúng ngày |
| [ ] 5.3 | Sự kiện | banner ở Kho, badge ở Quầy, thông báo thời tiết khi mở cửa | Ép SEVERE bằng debug: mất ghế, khách phải từ chối |
| [ ] 5.4 | TravelViet | hiển thị điểm, màn giới thiệu cuối ngày 10 | Số khách thay đổi theo điểm |
| [ ] 5.5 | Lưới an toàn | hộp thoại khi kích hoạt | Ép hết tiền: được tặng ghế |
| [ ] 5.6 | Cài đặt | `ui/Toggle.ts`, `ui/Slider.ts`, `scenes/overlays/SettingsOverlay.ts` | Đổi âm lượng/rung, lưu ngay |
| [ ] 5.7 | Mô phỏng kinh tế | `scripts/sim.ts` (cần D10) | In bảng §13.3, báo cáo, chờ duyệt con số |
| [ ] 5.R | Review giai đoạn 5 | — | Theo mẫu Review |

Ghi chú review: _(điền ở bước 4.R)_

---

## Giai đoạn 6 — Art, audio, tutorial, cốt truyện

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [ ] 6.1 | Chốt phong cách (D2, D3) | `docs/STYLE.md` | Chủ dự án duyệt |
| [ ] 6.2 | Asset và atlas | `public/assets/*`, `CREDITS.md` | Không còn hình khối placeholder ở màn chính |
| [ ] 6.3 | Juice | tween nút, ghế, vé, đồng xu, sao, rung màn | 60 fps trên máy Android |
| [ ] 6.4 | Audio | `platform/audio.ts`, `platform/haptics.ts` | Âm thanh chạy trên Safari iOS sau lần chạm đầu |
| [ ] 6.5 | Tutorial | `scenes/overlays/TutorialOverlay.ts` (dùng SpeechBubble cho Béo) | Đủ bảng §10.11 |
| [ ] 6.6 | Văn bản | thoại Béo, cốt truyện, thoại khách trong `strings.ts` / `customers.ts` | Chủ dự án duyệt (D11) |
| [ ] 6.R | Review giai đoạn 6 | — | Theo mẫu Review |

Ghi chú review: _(điền ở bước 5.R)_

---

## Giai đoạn 7 — Mobile hardening, PWA, deploy

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [ ] 7.1 | PWA | `vite.config.ts` (vite-plugin-pwa), `platform/pwa.ts` | Installable, chơi offline |
| [ ] 7.2 | Thiết bị | `scenes/overlays/RotateOverlay.ts`, nút Back Android, bàn phím ảo | Mục [TAY] tương ứng trong §14 |
| [ ] 7.3 | Xuất/nhập save, persist | `save/exportImport.ts` | Test round-trip, checksum sai bị từ chối |
| [ ] 7.4 | Test tay trên máy thật | `tests/e2e-manual.md` | Toàn bộ §14 tick hoặc có lý do |
| [ ] 7.5 | Deploy production | — | Link production chạy trên iPhone và Android |
| [ ] 7.R | Review giai đoạn 7 | — | Theo mẫu Review |

Ghi chú review: _(điền ở bước 6.R)_

---

## Giai đoạn 8 — Ngày đặc biệt, cá nhân hoá

| # | Bước | File chính | Xong khi |
|---|---|---|---|
| [ ] 8.1 | Cấu trúc dữ liệu | `data/personal.ts` (placeholder, không bịa nội dung) | `enabled = false` chạy như mặc định |
| [ ] 8.2 | Khách đặc biệt và scripted moment | `domain/orderGen.ts`, `dayCycle.ts` | Xuất hiện đúng ngày, luôn phục vụ được |
| [ ] 8.3 | Chạy với dữ liệu thật | chủ dự án điền | Chơi lại các ngày đặc biệt không lỗi |
| [ ] 8.R | Review giai đoạn 8 | — | Theo mẫu Review |

Ghi chú review: _(điền ở bước 7.R)_

---

## Registry — common component

Cập nhật ở mỗi bước Review. "Dùng ở" ghi các nơi đã dùng hoặc đã lên kế hoạch dùng.

### Domain / save / platform

| Component | File | Dùng ở | Giai đoạn tạo | Trạng thái |
|---|---|---|---|---|
| Result `ok`/`err` | `domain/common/result.ts` | inventory, upgrades, save/migrate (4.1) | 1.1 | xong |
| `invariant` | `domain/common/invariant.ts` | dayCycle, inventory, rng, orderGen, schedule, routes | 1.1 | xong |
| `clamp`, `sum`, `roundToTenth` | `domain/common/math.ts` | economy, demand, dayCycle, rng | 1.1 | xong |
| `Rng`, `rngFor`, `hashString` | `domain/rng.ts` | schedule, inventory, events, demand, orderGen, spawner, safetyNet; `hashString` cho checksum save (7.3) | 1.2 | xong |
| `ShuffleBag` | `domain/shuffleBag.ts` | orderGen, (sau này) thoại | 1.2 | xong |
| `roundMoney` | `domain/economy.ts` | mọi phép tính tiền | 1.5 | xong |
| `canServe`, `routeHasAvailableSeat` | `domain/canServe.ts` | orderGen, dayCycle (từ chối) | 1.6 | xong |
| `formatClock`, `matchesTimePref` | `domain/clock.ts` | tick, scoring, TopBar, FlightList, TicketView | 1.4 | xong |
| `getRoute`, `routeNumber` | `domain/routes.ts` | schedule, scoring, safetyNet, UI (tên/màu tuyến) | 1.3 | xong |
| `getDayConfig`, `isMechanicOpen` | `domain/dayConfig.ts` | orderGen, dayCycle, UI (ẩn nút Hộ chiếu/dịch vụ) | 1.3 | xong |
| Test fixtures, bots | `domain/__integration__/fixtures.ts`, `bots.ts` | test domain; bots dùng lại cho `scripts/sim.ts` (5.7) | 1.R | xong |
| Storage an toàn | `save/storage.ts` | BootScene (đọc + kiểm khả dụng), TitleScene (toast khôi phục), sessionBridge (ghi ở mốc checkpoint) | 4.1 | xong |
| `watchTabLock` | `save/tabLock.ts` | main.ts (toàn cục), BaseScene (overlay khoá tab) | 4.2 | xong |
| sessionBridge | `scenes/sessionBridge.ts` | mọi scene gameplay (Prep/Counter/Summary); tự ghi save ở mốc §6.6 | 2.6 | xong |

### UI

| Component | File | Dùng ở | Giai đoạn tạo | Trạng thái |
|---|---|---|---|---|
| theme, textStyles, layout | `ui/theme.ts`, `textStyles.ts`, `layout.ts` | mọi scene/UI | 2.1 | xong |
| BaseScene | `scenes/BaseScene.ts` | mọi scene; từ 4.R còn lo overlay khoá tab (§9.5) + banner "không lưu được" (§9.4) toàn cục qua `game.events` | 2.1 | xong |
| Button | `ui/Button.ts` | mọi scene có nút; `lock()/unlock()` quanh `sessionBridge.dispatch` | 2.2 | xong |
| Panel | `ui/Panel.ts` | Card, Dialog, Pause, Toast, SpeechBubble, PassportCard, TicketView | 2.2 | xong |
| IconLabel | `ui/IconLabel.ts` | TopBar, SpeechBubble, FlightList, Card, Playground | 2.2 | xong |
| BaseOverlay | `ui/BaseOverlay.ts` | Dialog, Pause, Settings, Tutorial, Rotate, PassportCard | 2.3 | xong |
| DialogOverlay | `scenes/overlays/DialogOverlay.ts` | Title, Kho, Pause, Shop, lưới an toàn | 2.3 | xong |
| Toast | `ui/Toast.ts` (`ToastQueue`) | Quầy (lỗi COMMAND_REJECTED), Title, Summary, PWA | 2.3 | xong |
| DragController | `ui/DragController.ts` | ScrollList, BaggageSlider, kéo vé, Slider | 2.4 | xong |
| ScrollList | `ui/ScrollList.ts` | Kho, FlightList, Shop | 2.4 | xong |
| ProgressBar | `ui/ProgressBar.ts` | PatienceBar, máy in, Preload | 2.4 | xong |
| FloatingText | `ui/FloatingText.ts` (`showFloatingText`) | kết quả giao vé, mua ghế, Shop | 2.5 | xong |
| CountUpText | `ui/CountUpText.ts` | SummaryScene (đếm từng dòng tổng kết) | 2.5 | xong |
| registerVisibilityHandler | `platform/visibility.ts` | CounterScene (và mọi scene gameplay khác cần pause) | 2.6 | xong |
| PauseOverlay | `scenes/overlays/PauseOverlay.ts` | mọi scene gameplay; nút ⚙ ở Kho tạm mở PauseOverlay (SettingsOverlay thật ở 5.6) | 2.6 | xong |
| TopBar | `ui/TopBar.ts` | Quầy, Kho | 3.1 | xong |
| SpeechBubble | `ui/SpeechBubble.ts` | khách (Quầy), Béo (Onboarding — thoại tạm); Tutorial (6.5) chưa làm | 3.2 | xong |
| StepIndicator | `ui/StepIndicator.ts` | Quầy | 3.3 | xong |
| FlightList | `ui/FlightList.ts` | Quầy Bước A, có cờ `readOnly` | 3.3 | xong |
| PatienceBar | `ui/PatienceBar.ts` | Quầy | 3.2 | xong |
| debug hook | `dev/debug.ts` | test Playwright (đọc `window.__sessionBridge`) | 3.R | xong |
| SegmentedControl | `ui/SegmentedControl.ts` | Shop (tab); Kho (seat bias, khi có AIRLINE_RELATIONS) chưa làm | 5.1 | xong ở Shop |
| Card | `ui/Card.ts` | Shop (nâng cấp + tuyến bay) | 5.1 | xong |

Component chỉ dùng ở một màn (FlightList, SeatMapView, BaggageSlider, ExtrasToggles, TicketView, PassportCard, Stepper, StepIndicator, TextInput, Toggle, Slider) không nằm trong Registry cho tới khi có chỗ dùng thứ hai.
