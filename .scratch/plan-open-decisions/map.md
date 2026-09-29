# Chốt các quyết định còn mở trong PLAN §15

## Destination

Chốt cả 9 quyết định còn mở trong `docs/PLAN.md` §15 (D1, D2, D3, D4, D5, D8, D9, D11, D12 — D10 đã chốt trước đó, không nằm trong map này). Mỗi quyết định ghi kết quả vào `docs/DECISIONS.md`; nếu kết quả khác với "phương án mặc định" mà code hiện tại đang giả định, cập nhật lại `docs/PLAN.md` và phần domain liên quan trong `src/domain/`.

## Notes

- Nguồn: `docs/PLAN.md` §15, `docs/ROADMAP.md`, `docs/STATUS.md`.
- D1 (cloud save), D4 (mua thêm ghế giữa ca), D5 (lỗi tên hộ chiếu chỉ khác dấu), D9 (hỗ trợ desktop) đã quá hạn "hỏi ở phase" ghi trong PLAN (phase 1, 1, 1, 2) — các Giai đoạn đó đã xong theo STATUS.md mà chưa từng hỏi. Code hiện đang chạy đúng theo phương án mặc định của từng câu. Nếu câu trả lời khác mặc định, ticket tương ứng phải nói rõ phần domain nào cần sửa lại trước khi Giai đoạn sau build tiếp lên trên.
- Mọi ticket trả lời bằng tiếng Việt.
- Ghi quyết định vào `docs/DECISIONS.md` theo đúng quy ước append-only của CLAUDE.md dự án (ngày, quyết định, lý do, phương án đã loại).
- D2 và D3 nên làm dạng prototype (mockup so sánh) thay vì hỏi chay, vì là câu hỏi "trông như thế nào".

## Decisions so far

_(chưa có ticket nào đóng)_

## Not yet specified

_(trống — cả 9 câu trong PLAN §15 đã đủ sắc để thành ticket)_

## Out of scope

_(trống)_
