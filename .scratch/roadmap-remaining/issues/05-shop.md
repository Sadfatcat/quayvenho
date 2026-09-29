# 05: Shop

**What to build:** Sau Tổng kết, người chơi vào Shop để mua nâng cấp và mở tuyến bay mới bằng tiền đã kiếm được, trước khi sang ngày mới.

**Blocked by:** 04

**Status:** resolved

- [x] Hai tab: "Nâng cấp" và "Tuyến bay" (`ui/SegmentedControl.ts` mới, dùng lại được cho seat bias ở Kho sau này)
- [x] Mỗi card hiện tên, mô tả hiệu ứng, giá, trạng thái (đã mua/chưa đủ tiền/chưa đủ điều kiện kèm điều kiện cụ thể) — `ui/Card.ts` mới
- [x] Mua có hộp thoại xác nhận (`DialogOverlay` có sẵn), trừ tiền qua `sessionBridge.dispatch` (domain tự trừ, scene không tự tính tiền); animation chưa làm (giữ nguyên grey-box, animation thuộc Giai đoạn 6 "Juice" — ticket 15)
- [x] Nút "Ngày tiếp theo" khoá ngay sau lần bấm đầu tiên (`button.lock()`)
- [x] Chi tiêu ở Shop được ghi vào ngày hôm sau đúng PLAN §5.6 — domain `SHOP_BUY_UPGRADE`/`SHOP_UNLOCK_ROUTE` đã ghi `nextDayTransactions` từ Giai đoạn 1, không cần sửa
- [x] Kiểm bằng Playwright ở 360×640: 2 tab hiển thị đúng, trạng thái card đúng (chưa đủ tiền / cần TravelViet), "Ngày tiếp theo" chuyển đúng sang Kho ngày mới — 0 lỗi console

## Answer

`src/scenes/ShopScene.ts` mới + 2 component dùng chung mới (`ui/SegmentedControl.ts`, `ui/Card.ts`) + `data/upgrades.ts` thêm `UPGRADE_DESCRIPTIONS` (tách khỏi `UpgradeDef` vì chỉ là văn bản trình bày). Đọc điều kiện mua bằng đúng `checkUpgrade`/`checkRouteUnlock` đã có sẵn từ domain (export thêm `shopContext` từ `dayCycle.ts` để dùng lại, không tự viết lại logic). Sửa `SummaryScene.goToShop()`: bỏ nhánh tạm dispatch `NEXT_DAY` liền sau `GO_TO_SHOP` (đã note "tạm" từ ticket 02) — giờ dừng đúng ở `ShopScene` thật. Đăng ký `ShopScene` trong `main.ts`. typecheck/lint/test(123)/build đều xanh.
