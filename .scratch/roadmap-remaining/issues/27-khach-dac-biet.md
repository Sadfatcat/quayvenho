# 27: Khách đặc biệt và scripted moment

**What to build:** Domain đọc `PersonalConfig` và chèn đúng khách đặc biệt/scripted moment vào đúng ngày, đúng vị trí trong hàng, luôn phục vụ được (tự thêm ghế nếu thiếu, không tính tiền).

**Blocked by:** 26

**Status:** ready-for-agent

- [ ] Khách đặc biệt thay đúng slot `atCustomerIndex` của đúng ngày; nếu vượt số khách trong ngày thì thành khách cuối
- [ ] Không có ghế phù hợp: domain tự thêm ghế, không tính tiền, không ghi transaction chi
- [ ] Làm sai đơn khách đặc biệt: không phạt, tối thiểu 3 sao, dùng thoại `fail` riêng
- [ ] Ngày có khách đặc biệt/scripted moment không sinh thêm sự kiện ngẫu nhiên
- [ ] Test đơn vị cho toàn bộ luật trên với `enabled = true` và dữ liệu giả lập
