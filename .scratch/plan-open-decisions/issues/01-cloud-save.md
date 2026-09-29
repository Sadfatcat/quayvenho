# D1 — Có cần cloud save (chơi nhiều thiết bị) không?

Type: grilling
Status: open

## Question

PLAN §15 D1: "Có cần cloud save (chơi trên nhiều thiết bị) không?" Phương án mặc định nếu "tuỳ bạn": **Không, chỉ localStorage + xuất/nhập mã**.

Code hiện tại (`src/save/storage.ts`, Giai đoạn 4.1) đã build đúng theo mặc định: chỉ `localStorage`, không backend, không đồng bộ nhiều thiết bị. Nếu câu trả lời là **có cần cloud save**, đây là thay đổi kiến trúc lớn (cần backend — trái với CLAUDE.md "Không có backend"), phải hỏi lại chủ dự án về đánh đổi cụ thể trước khi làm, không tự quyết.

Nếu giữ mặc định (không cloud save): chỉ cần ghi nhận vào DECISIONS.md, không đổi code.
