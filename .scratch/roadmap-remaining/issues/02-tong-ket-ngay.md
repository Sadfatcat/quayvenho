# 02: Tổng kết ngày (SummaryScene) thật

**What to build:** Sau khi đóng quầy cuối ngày, người chơi thấy một scene Tổng kết riêng (không còn là overlay tạm vẽ trong Quầy) hiện đủ các số liệu của ngày với hiệu ứng đếm số, chạm để bỏ qua hiệu ứng, rồi bấm "Tiếp tục" sang ngày mới.

**Blocked by:** 01 (cần vào được Kho thì mới đi hết một ngày để tới được màn Tổng kết)

**Status:** ready-for-agent

- [ ] Tiêu đề "{brandName} — Ngày {n}"
- [ ] Hiện lần lượt: doanh thu vé, tiền tip, chi mua ghế, chi Shop hôm trước, số ghế ế + giá vốn, tiền hoàn, số ghế mất do thời tiết + giá vốn, tiền phạt, lợi nhuận ròng, số khách phục vụ/bỏ đi/bỏ về vì đông, sao trung bình, điểm TravelViet mới (từ ngày 11) — mỗi số có hiệu ứng đếm lên
- [ ] Chạm màn hình bỏ qua hiệu ứng, hiện ngay kết quả cuối
- [ ] Lợi nhuận âm: Béo đưa một mẹo ngẫu nhiên
- [ ] Cuối ngày 10: có màn giới thiệu TravelViet trước khi sang ngày 11
- [ ] Nút "Tiếp tục" khoá cho tới khi save ghi xong
- [ ] Kiểm bằng Playwright, 0 lỗi console
