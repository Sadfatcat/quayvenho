# 22: Xuất/nhập save

**What to build:** Người chơi xuất được save thành một mã/file, và nhập lại để khôi phục — hữu ích khi đổi máy hoặc sợ mất tiến trình (thay cho cloud save, theo phương án mặc định D1 nếu D1 giữ nguyên "không cloud save").

**Blocked by:** 19

**Status:** resolved

- [ ] `save/exportImport.ts` mới: xuất save hiện tại thành chuỗi/file có checksum
- [ ] Nhập lại: checksum sai bị từ chối, không ghi đè save hiện tại
- [ ] Test round-trip xuất rồi nhập lại ra đúng state
- [ ] Nếu D1 (wayfinder map) chốt là "có cloud save", ticket này cần xem lại phạm vi trước khi làm

## Kết quả
- [x] `save/exportImport.ts`: mã `QVN1.<base64 UTF-8>.<FNV-1a 32>`; `importSaveCode` kiểm checksum rồi validate bằng zod/migrate (dùng chung `parseSaveJson` với `loadSave`) và **không ghi gì** — chỉ khi hợp lệ và người chơi xác nhận mới `writeSave` + tải lại.
- [x] 5 test: round-trip (có tiếng Việt), checksum sai, không phải mã, thân save sai, khoảng trắng thừa.
- [x] D1 giữ "không cloud save" (ghi DECISIONS). UI: 2 nút trong Cài đặt ở Kho.
