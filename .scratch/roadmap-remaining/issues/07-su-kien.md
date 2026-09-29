# 07: Sự kiện RUSH và thời tiết

**What to build:** Sự kiện ngày (RUSH hoặc dự báo/kết quả thời tiết) hiển thị rõ ràng ở cả Kho và Quầy, và tác động đúng luật khi mở cửa (RUSH tăng khách + giá bán; thời tiết BAD/SEVERE làm mất ghế của tuyến bị ảnh hưởng).

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Banner ở Kho khi có RUSH hoặc dự báo thời tiết; badge ở Quầy khi có RUSH hoặc kết quả thời tiết đã chốt
- [ ] RUSH: số khách ×1.4, giá bán ×1.2
- [ ] Thời tiết BAD: tuyến bị ảnh hưởng mất round(n/3) ghế đã mua, không hoàn tiền
- [ ] Thời tiết SEVERE: mọi chuyến của tuyến bị huỷ (status CANCELLED), khách hỏi tuyến đó bị từ chối đúng (REFUSED_NO_STOCK)
- [ ] Debug hook ép được kết quả SEVERE để kiểm bằng Playwright: thấy đúng mất ghế + khách bị từ chối đúng lý do
- [ ] Test đơn vị: RUSH/WEATHER hội tụ đúng tỉ lệ 15%/... (xem PLAN bảng sự kiện), GOOD/BAD/SEVERE hội tụ 40/40/20
