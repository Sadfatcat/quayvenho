# D5 — Lỗi tên hộ chiếu có được phép chỉ khác dấu không?

Type: grilling
Status: open

## Question

PLAN §15 D5: "Lỗi tên hộ chiếu có được phép chỉ khác dấu không?" (ví dụ khách đọc "Lê Văn An" nhưng vé ghi "Le Van An" hoặc thiếu dấu — có tính là đúng không?) Phương án mặc định nếu "tuỳ bạn": **Không** (phải khớp tuyệt đối).

Code hiện tại (`src/domain/scoring.ts`/`canServe.ts`, Giai đoạn 1) đã build đúng theo mặc định: so khớp tên tuyệt đối, không có logic khoan dung dấu tiếng Việt.

Nếu câu trả lời là **có cho phép khác dấu**: cần thêm một bước chuẩn hoá chuỗi (bỏ dấu) trước khi so khớp ở `canServe.ts`, kèm test case mới cho các awful case liên quan (PLAN §14) — phần domain này đã có test đầy đủ (Giai đoạn 1, coverage 99%), đổi quy tắc so khớp cần rà lại toàn bộ test liên quan tên khách/hộ chiếu.

Nếu giữ mặc định (Không): chỉ ghi nhận vào DECISIONS.md.
