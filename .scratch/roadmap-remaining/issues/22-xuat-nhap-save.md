# 22: Xuất/nhập save

**What to build:** Người chơi xuất được save thành một mã/file, và nhập lại để khôi phục — hữu ích khi đổi máy hoặc sợ mất tiến trình (thay cho cloud save, theo phương án mặc định D1 nếu D1 giữ nguyên "không cloud save").

**Blocked by:** 19

**Status:** ready-for-agent

- [ ] `save/exportImport.ts` mới: xuất save hiện tại thành chuỗi/file có checksum
- [ ] Nhập lại: checksum sai bị từ chối, không ghi đè save hiện tại
- [ ] Test round-trip xuất rồi nhập lại ra đúng state
- [ ] Nếu D1 (wayfinder map) chốt là "có cloud save", ticket này cần xem lại phạm vi trước khi làm
