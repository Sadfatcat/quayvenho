# Kiểm tay trên máy thật (PLAN §14)

Mỗi lần release chạy lại trên: iPhone Safari, iPhone PWA, Android Chrome, Android PWA. Ghi kết quả ở cột cuối (ngày, thiết bị, pass/fail).

Cột "Đã thử" ghi những gì Claude Code đã kiểm được bằng Chromium desktop (Playwright, 360×640); **không thay thế** kiểm trên điện thoại thật.

| Mục | Đã thử (Chromium) | Kết quả máy thật |
|---|---|---|
| **14.1 Lưu game** | | |
| Refresh giữa ca → về PREP của ngày đó, lô ghế giữ nguyên, thời tiết và khách đầu tiên giống hệt | Đã thử Giai đoạn 4: refresh giữ tiến trình | chưa kiểm |
| localStorage bị chặn → vẫn chơi, banner cảnh báo | — | chưa kiểm |
| Hai tab → khoá tab sau, có "Chơi ở đây" | Đã thử Giai đoạn 4: TAKEN_OVER đúng | chưa kiểm |
| "Chơi mới" khi có save → xác nhận, backup | — | chưa kiểm |
| **14.2 Onboarding** | | |
| Bàn phím ảo không che ô nhập; gõ tiếng Việt có dấu (Telex/VNI) hiện đúng | — | chưa kiểm |
| Tên thương hiệu 20 ký tự không vỡ biển quầy, top bar, vé | — | chưa kiểm |
| **14.3 Kho** | | |
| Không mua vượt số tiền / giới hạn ghế | — | chưa kiểm |
| Double tap "Xác nhận nhập ghế" → trừ tiền một lần | — | chưa kiểm |
| Mở cửa khi kho trống → cảnh báo | — | chưa kiểm |
| Mở cửa khi còn pending → hộp thoại 3 lựa chọn | Đã thử: không chạy lại ở Giai đoạn 5 (có ở 4.5) | chưa kiểm |
| Cuộn danh sách không bấm nhầm stepper | — | chưa kiểm |
| **14.4 Khách và đơn** | | |
| **14.5 Lắp vé** | | |
| Kéo slider vượt biên / ra ngoài canvas → clamp, kết thúc đúng | — | chưa kiểm |
| Multi-touch khi kéo → chỉ pointer đầu | — | chưa kiểm |
| Kéo slider không cuộn trang | — | chưa kiểm |
| **14.6 Hộ chiếu** | | |
| Tên dài 22 ký tự không vỡ card | — | chưa kiểm |
| **14.7 Giao vé và chấm điểm** | | |
| Double tap giao / in → một lần | — | chưa kiểm |
| **14.8 Thời gian** | | |
| Chuyển app / khoá máy → pause, quay lại thấy PauseOverlay | Đã thử: đổi tab → pause (Chromium) | chưa kiểm |
| **14.9 Tổng kết, shop, TravelViet** | | |
| **14.10 Sự kiện** | | |
| **14.11 Kỹ thuật và thiết bị** | | |
| Audio iOS sau lần chạm đầu | — | chưa kiểm |
| Xoay ngang → RotateOverlay + pause | — | chưa kiểm |
| Tai thỏ / thanh home không che nút | — | chưa kiểm |
| Offline sau khi cài PWA | Đã thử: SW activated, reload offline vào được (preview build) | chưa kiểm |
| Bản mới → lời nhắc tải lại, không làm gián đoạn giữa ca | — | chưa kiểm |
| Asset lỗi mạng → nút thử lại | — | chưa kiểm |
| Nút Back Android → PauseOverlay, không thoát | Đã thử: history.back() → PauseOverlay (Chromium) | chưa kiểm |
| Không zoom bằng double tap / pinch | — | chưa kiểm |
| Font tiếng Việt hiện đúng ngay từ màn đầu (không nhảy font) | — | chưa kiểm |
| 60 fps trên máy tầm trung | — | chưa kiểm |
| **14.12 Cá nhân hoá** | | |
