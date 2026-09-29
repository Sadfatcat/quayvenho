# D9 — Có hỗ trợ desktop (chuột, bàn phím) như trải nghiệm chính không?

Type: grilling
Status: open

## Question

PLAN §15 D9: "Có hỗ trợ desktop (chuột, bàn phím) như một trải nghiệm chính không?" Phương án mặc định nếu "tuỳ bạn": **Chạy được bằng chuột, không tối ưu riêng**.

Code hiện tại đã khớp mặc định một cách tự nhiên: toàn bộ UI (Giai đoạn 2-4) dùng Phaser pointer events (`pointerdown`/`pointerup`), hoạt động với cả chuột lẫn chạm, không có input riêng cho bàn phím, không có layout riêng cho màn hình rộng — canvas luôn ở tỉ lệ dọc 720×1280 dùng `Phaser.Scale.FIT`.

Nếu câu trả lời là **có, cần tối ưu desktop**: cần thêm layout riêng cho màn ngang/rộng và có thể hỗ trợ bàn phím (Tab/Enter cho `ui/TextInput.ts`, phím tắt) — việc này ảnh hưởng gần như mọi scene đã build, nên cần chủ dự án nói rõ mức độ ưu tiên trước khi làm.

Nếu giữ mặc định: chỉ ghi nhận vào DECISIONS.md.
