# 03: Nối mốc lưu game vào đúng luật §6.6

**What to build:** Game tự lưu ở đúng các mốc quy định (sau chọn tên/thương hiệu, sau mỗi lần xác nhận mua ghế, khi vào Tổng kết, sau khi mua ở Shop, sau khi sang ngày mới, sau khi đổi cài đặt) — không bao giờ lưu giữa ca. Refresh hoặc tắt tab giữa chừng không làm mất tiến trình hay tiền đã trừ.

**Blocked by:** 01, 02 (cần đi hết vòng lặp một ngày để test đủ mọi mốc lưu)

**Status:** resolved

- [x] Lưu đúng sau: chọn tên/thương hiệu, mỗi lần xác nhận mua ghế, vào Tổng kết, mua ở Shop (chưa có Shop — dispatch có sẵn, chờ ticket 05), sang ngày mới, đổi cài đặt
- [x] Không lưu khi đang mở quầy hoặc đang đóng quầy (checkpoint theo whitelist command/event, OPEN/CLOSING không nằm trong danh sách)
- [x] "Chơi tiếp" mở đúng màn theo phase đã lưu (đã có từ 4.3: PREP/SUMMARY→Prep/Summary; SHOP→'Shop', chờ ticket 05); `profile = null` → EMPTY → Onboarding
- [x] Refresh giữa ca: `sessionBridge.dispatch`/`tick` ghi save ngay sau mỗi checkpoint nên state trên đĩa luôn khớp state trong bộ nhớ tại mốc gần nhất
- [x] Kiểm tay/Playwright toàn bộ acceptance Phase 3 — dời sang ticket 04 (Review Giai đoạn 4) *(đã kiểm ở review giai đoạn 4, 4.R)*
- [x] Acceptance PLAN §12 Phase 3 bổ sung 2 điểm: JSON hỏng → khôi phục + toast (`recoveredFromBackup` mới thêm vào `LoadSaveResult`), mở tab thứ hai → toast bất kỳ scene nào đang mở (chuyển từ registry sang `game.events`, xem `BaseScene.ts`)

## Answer

Checkpoint lưu nằm ở `sessionBridge.ts` (chỗ duy nhất mọi command/tick đi qua): `dispatch()` lưu nếu `command.type` nằm trong `CHECKPOINT_COMMANDS` và không bị `COMMAND_REJECTED`; `tick()` lưu nếu có event `DAY_ENDED`. `save/storage.ts` thêm field `recoveredFromBackup` vào `LoadSaveResult` để `TitleScene` hiện toast khi save chính hỏng phải dùng bản backup. Tab-lock chuyển từ registry (chỉ đọc 1 lần ở TitleScene) sang `game.events` toàn cục — mọi scene kế thừa `BaseScene` đều nhận được cảnh báo "Game đang mở ở tab khác" bất kể đang ở màn nào. typecheck/lint/test(123)/build đều xanh.
