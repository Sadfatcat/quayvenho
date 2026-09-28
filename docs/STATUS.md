# STATUS

- Giai đoạn hiện tại: 2 — Bộ UI dùng chung (Review xong, chờ chủ dự án)
- Đã xong giai đoạn 2:
  - 7 bước ROADMAP: theme/textStyles/layout/BaseScene, Button/Panel/IconLabel, BaseOverlay/DialogOverlay/Toast, DragController/ScrollList/ProgressBar, FloatingText/CountUpText, sessionBridge/visibility/PauseOverlay, PlaygroundScene (`?playground`, chỉ DEV)
  - typecheck, lint, 111 test, build đều xanh; production build không kèm PlaygroundScene (12 module, đã kiểm)
  - Kiểm bằng Playwright ở 360×640 và 430×932: layout không lỗi (sửa 1 lỗi chồng chữ), Button/Dialog/PauseOverlay lồng nhau/Toast/ScrollList (kéo + ảo hoá + tap sau khi cuộn) đều đúng, 0 lỗi console suốt phiên thử
  - code-reviewer: 1 P1 (rò rỉ mask Graphics khi ScrollList.destroy) + 1 P3 (trùng style tiêu đề), đã sửa cả hai
- Từ giai đoạn 0 còn chờ: thử `dev:host` trên điện thoại, Cloudflare Pages
- Bước tiếp theo: Giai đoạn 3, bước 3.1 (khung màn Quầy)
