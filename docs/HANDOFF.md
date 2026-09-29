# HANDOFF — tạm dừng theo yêu cầu chủ dự án

Ghi lúc: đang giữa bước 4.5 (Kho / PrepScene) của Giai đoạn 4. Mọi thứ tính tới lúc này đã commit + push lên `Sadfatcat/quayvenho`, nhánh `main`, tại commit `ac0ebc2`.

## Đã xong Giai đoạn 4 (4.1 → 4.4), đã commit + push

- **4.1 — Lưu trữ an toàn**: `src/save/storage.ts`, `schema.ts` (zod), `migrate.ts`. Round-trip localStorage, JSON hỏng → rơi về bản backup gần nhất, version tương lai bị từ chối không ghi đè, zod clamp giá trị bẩn (tiền âm → 0). 9 test.
- **4.2 — Khoá tab**: `src/save/tabLock.ts` (BroadcastChannel, PING/PONG). Tab mở sau tự phát hiện là "tab thứ hai". 3 test.
- **4.3 — Boot và Title**: `BootScene` thật (đọc save qua `loadSave()`, theo dõi tab lock, không còn bootstrap cố định) → `PreloadScene` (chưa có asset thật, chỉ pass-through — sẽ có nội dung thật ở Giai đoạn 6.2) → `TitleScene` ("Chơi tiếp" chỉ hiện khi có save, "Chơi mới" có hộp thoại xác nhận nếu đã có save). Nút "Về màn hình chính" ở PauseOverlay giờ chạy thật (`scene.start('Title')`).
- **4.4 — Onboarding**: `OnboardingScene` (3 popup thoại Béo — nội dung tạm, chốt thật ở 6.6) → nhập tên người chơi → nhập thương hiệu → popup Béo đọc lại tên → `PROFILE_SET` → chuyển sang scene `'Prep'`. `ui/TextInput.ts` mới: bọc `<input>` HTML thật qua `Phaser.GameObjects.DOMElement` (bàn phím ảo hoạt động đúng trên điện thoại thật, không như canvas-vẽ-chữ giả). Cần bật `dom: { createContainer: true }` trong `Phaser.Game` config ở `main.ts` — đã bật.

Cả 4 bước: typecheck/lint/test/build đều xanh, mỗi bước 1 commit riêng.

## Đang dở — 4.5 Kho (PrepScene), CHƯA xong

Đã có, đã commit (`ac0ebc2`):
- `src/ui/Stepper.ts` — control +/− chọn số lượng ghế, thuần trình bày (component không tự validate nghiệp vụ, caller truyền `max` đã tính sẵn).
- `strings.prep.*` trong `src/data/strings.ts` — nhãn Kho, banner sự kiện, 2 hộp thoại "Mở cửa" (kho trống / còn pending chưa xác nhận).

**Chưa viết**: `src/scenes/PrepScene.ts` chưa tồn tại. Chưa đăng ký trong `main.ts`. `TitleScene`/`OnboardingScene` đã trỏ tới scene key `'Prep'` nhưng scene đó chưa được tạo — game sẽ lỗi nếu chạy tới bước đó lúc này.

### Thiết kế đã chốt cho PrepScene (đọc trước khi viết tiếp), theo PLAN §10.5:

Layout dọc 720×1280:
- TopBar (y≈90): tái dùng `ui/TopBar.ts`, `leftLabel` = `"${STRINGS.prep.dayLabel} ${state.day}"`, `icon` = `STRINGS.common.settingsIcon`, `onIconTap` mở `PauseOverlay` (SettingsOverlay thật chưa có, làm ở Giai đoạn 5.6 — xem ghi chú 3.R trong ROADMAP).
- Banner sự kiện (150–230): chỉ hiện khi `state.today.event.type !== 'NONE'` — `STRINGS.prep.bannerRush` cho RUSH, `STRINGS.prep.bannerWeather` cho WEATHER (kể cả khi `outcome === null`, tức mới là dự báo, chưa chốt — chốt thật lúc `OPEN_COUNTER`).
- Danh sách chuyến (230–1060): `ScrollList<Flight>` (component đã có từ Giai đoạn 2/3, KHÔNG viết `FlightList` mới — Kho cần layout khác FlightList của Quầy vì có Stepper thay vì Button, nên tự viết `renderItem` riêng trong PrepScene chứ không tái dùng `ui/FlightList.ts`). Mỗi dòng cao 150: tên tuyến + màu (`getRoute(flight.routeId)`), mã chuyến + giờ (`formatClock`), giá vốn ECO/BIZ, 2 Stepper (ECO/BIZ) kèm số ghế đã sở hữu, nhãn chiết khấu "−5%/−10%" khi đạt ngưỡng (`bulkDiscountRate(qty)` từ `@domain/economy`, đã export sẵn). Tuyến bị dự báo xấu (event.type WEATHER và routeId trùng) hiện icon `STRINGS.prep.weatherForecastIcon`.
- Thanh tổng (1060–1140): `"${STRINGS.prep.estimateLabel}: −${pendingTotalCost(pending, flights)} xu"` (hàm `pendingTotalCost` đã có sẵn ở `@domain/inventory`, đừng tự cộng tay), và tiền còn lại = `state.money - đó`.
- 2 nút (1140–1230):
  - `"Xác nhận nhập ghế"` → dispatch `PREP_CONFIRM_PURCHASE`. Bấm xong thì gọi lại `setItems` để re-render list (qty pending về 0, owned tăng).
  - `"Mở cửa"` → theo đúng 3 nhánh của PLAN §10.5:
    1. Còn pending chưa xác nhận (`Object.keys(today.pendingPurchase).length > 0`) → `DialogOverlay` 3 nút: "Nhập và mở cửa" (dispatch `PREP_CONFIRM_PURCHASE` rồi `OPEN_COUNTER`), "Bỏ và mở cửa" (dispatch `PREP_CLEAR_PENDING` rồi `OPEN_COUNTER`), "Huỷ".
    2. Không có ghế nào khả dụng (`today.seats` rỗng, hoặc lọc theo `state === 'AVAILABLE'` — cân nhắc lúc code) → `DialogOverlay` xác nhận "Kho trống...".
    3. Ngược lại → dispatch `OPEN_COUNTER` thẳng, chuyển `scene.start('Counter')`.

### Giới hạn Stepper (đã tính sẵn công thức, viết thành hàm trong PrepScene, KHÔNG phải domain):

```ts
// seatLimit từ maxPurchasable() (đã có ở @domain/inventory) — giới hạn theo ghế còn trống + PURCHASE_LIMIT_PER_FLIGHT.
// moneyLimit: qty tối đa mà money hiện có (trừ chi phí pending các dòng KHÁC) mua nổi, tính bằng vòng lặp nhỏ
// gọi purchaseCost() (đã có ở @domain/economy) — KHÔNG tự nhân giá, chiết khấu domain đã lo.
const maxAffordableQty = (flight, cabin, today, money) => {
  const seatLimit = maxPurchasable(flight, cabin, today.seats);
  const key = pendingKey(flight.id, cabin);
  const currentQty = today.pendingPurchase[key] ?? 0;
  const unitCost = getRoute(flight.routeId).cost[cabin];
  const otherPendingCost = pendingTotalCost(today.pendingPurchase, today.flights) - purchaseCost(unitCost, currentQty);
  const moneyLeft = money - otherPendingCost;
  let qty = currentQty;
  while (qty < seatLimit && purchaseCost(unitCost, qty + 1) <= moneyLeft) qty++;
  return qty;
};
```

Đây chỉ là orchestration (gọi hàm domain có sẵn), không phải logic nghiệp vụ mới — không vi phạm luật kiến trúc §1 (scene không tự tính tiền).

### Re-render pattern (giống CounterScene, đã dùng ổn định từ Giai đoạn 3)

`GameSession` mutate state tại chỗ, nên **không diff state cũ/mới** — mỗi lần có domain event (subscribe qua `sessionBridge.onEvents`) hoặc sau mỗi dispatch, đọc lại `sessionBridge.current.state` mới nhất và gọi `list.setItems([...state.today.flights])` để buộc `ScrollList` vẽ lại toàn bộ dòng (xem `ScrollList.setItems` — `forceAll=true`). Đừng cache lại `pendingPurchase`/`seats` trong biến scene, luôn đọc trực tiếp từ `sessionBridge.current.state.today` trong `renderItem`.

## Việc còn lại trong Giai đoạn 4 (sau khi xong 4.5)

- **4.6 — Tổng kết**: `scenes/SummaryScene.ts`, dùng `ui/CountUpText.ts` (đã có từ Giai đoạn 2). Tái dùng cấu trúc `lines` đang nằm tạm trong `CounterScene.showDaySummary()` (xem ghi chú 3.R trong ROADMAP) làm nền, nhưng chuyển thành scene thật riêng thay vì overlay trong Quầy. Cuối ngày 10: giới thiệu TravelViet trước khi sang Shop (Shop chưa có — Giai đoạn 5, nên tạm thời nút "Tiếp tục" có thể chuyển thẳng sang `'Prep'` ngày mới, ghi rõ trong code là tạm, sẽ đổi thành `'Shop'` khi 5.1 xong).
- **4.7 — Mốc lưu và chơi tiếp**: nối `save/storage.ts` (`writeSave`) vào đúng các mốc PLAN §6.6 — sau `PROFILE_SET`, sau mỗi `PREP_CONFIRM_PURCHASE`, khi vào SUMMARY, sau mỗi lần mua ở SHOP, sau `NEXT_DAY`, sau `SETTINGS_UPDATE`/`FLAG_SET`. Cách làm hợp lý nhất: thêm một hàm `persistIfCheckpoint(events: DomainEvent[])` gọi từ `sessionBridge.dispatch()` (chỗ duy nhất mọi command đi qua), kiểm tra `events` có chứa event tương ứng mốc lưu không rồi gọi `writeSave(sessionBridge.current.state)`. Sau bước này: kiểm acceptance Phase 3 trong PLAN §12.
- **4.R — Review**: gọi `code-reviewer` subagent 1 lần (chỉ gửi danh sách file + số mục PLAN, không gửi code), tự kiểm chứng lỗi trước khi sửa, dùng Playwright MCP đúng 1 lượt ở 360×640 và 430×932, cập nhật ROADMAP (tick ô, Registry, ghi chú review cho Giai đoạn 5), STATUS.md, DECISIONS.md nếu có quyết định mới, rồi commit + push.

## Sau Giai đoạn 4

Theo CLAUDE.md: **đổi schema save sau khi Giai đoạn 4 xong phải hỏi chủ dự án trước.** Giai đoạn 5 (Shop, cơ chế theo ngày, sự kiện, TravelViet, Cài đặt, `scripts/sim.ts`) làm theo đúng thứ tự ROADMAP sau đó.

## Vòng lặp tự động

Không có cron job nào đang chạy phiên này (không được yêu cầu đặt lại). Nếu muốn tiếp tục tự động ở phiên sau, gõ `/loop` hoặc yêu cầu tương tự.

## Việc cần làm để tiếp tục

1. Đọc mục "Đang dở — 4.5 Kho" ở trên — đã có đủ thiết kế, công thức, và các hàm domain cần gọi, chỉ cần viết `src/scenes/PrepScene.ts` theo đúng thiết kế đó rồi đăng ký vào `main.ts`.
2. Chạy `npm run typecheck && npm run lint && npm run test` trước khi commit.
3. Không cần quyết định gì thêm — chỉ cần nói "tiếp tục Giai đoạn 4" hoặc "làm tiếp 4.5".
