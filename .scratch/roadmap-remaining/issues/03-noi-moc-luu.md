# 03: Nối mốc lưu game vào đúng luật §6.6

**What to build:** Game tự lưu ở đúng các mốc quy định (sau chọn tên/thương hiệu, sau mỗi lần xác nhận mua ghế, khi vào Tổng kết, sau khi mua ở Shop, sau khi sang ngày mới, sau khi đổi cài đặt) — không bao giờ lưu giữa ca. Refresh hoặc tắt tab giữa chừng không làm mất tiến trình hay tiền đã trừ.

**Blocked by:** 01, 02 (cần đi hết vòng lặp một ngày để test đủ mọi mốc lưu)

**Status:** ready-for-agent

- [ ] Lưu đúng sau: chọn tên/thương hiệu, mỗi lần xác nhận mua ghế, vào Tổng kết, mua ở Shop, sang ngày mới, đổi cài đặt
- [ ] Không lưu khi đang mở quầy hoặc đang đóng quầy
- [ ] "Chơi tiếp" mở đúng màn theo phase đã lưu (Kho/Tổng kết/Shop); `profile = null` → Onboarding
- [ ] Refresh giữa ca: quay lại đúng Kho của ngày đó, ghế đã mua và tiền đã trừ còn nguyên
- [ ] Test round-trip mốc lưu (unit test cho phần logic liên quan nếu có, còn lại kiểm tay/Playwright)
- [ ] Acceptance Phase 3 trong PLAN §12 đã kiểm đủ
