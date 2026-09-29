# 08: TravelViet

**What to build:** Từ ngày 11, điểm TravelViet (1.0–5.0, tính từ lịch sử sao) hiện trên TopBar của Kho và Quầy, và ảnh hưởng số khách đến mỗi ngày theo bảng hệ số trong PLAN §3.9.

**Blocked by:** 06 (cần cơ chế theo-ngày đã bật để lịch sử sao có ý nghĩa đầy đủ trước ngày 11)

**Status:** resolved

- [x] Điểm TravelViet hiện đúng từ ngày 11, ẩn trước đó — `TopBar.setTravelViet` đã dùng đúng `isTravelVietOpen` ở cả Kho (ticket 01) và Quầy (Giai đoạn 3); kiểm lại bằng Playwright ép `day=11` — hiện "⭐ 4.8" đúng
- [x] Số khách mỗi ngày thay đổi đúng theo bảng hệ số/tầng bonus — domain (`demand.ts`) đã làm từ Giai đoạn 1, không cần sửa
- [x] Màn giới thiệu TravelViet lần đầu (cuối ngày 10) — đã làm ở ticket 02 (`SummaryScene`, `flags.travelVietIntro`)
- [x] Test đơn vị: đã có sẵn từ Giai đoạn 1 (`demand.test.ts` dòng 30-43, đúng biên 2.9/3.0/3.5/3.6/4.4/4.5 và bonus tầng) — không cần viết thêm

## Answer

Toàn bộ ticket này đã xong từ các Giai đoạn/ticket trước (domain Giai đoạn 1, UI ticket 01 + Giai đoạn 3, giới thiệu ticket 02) — chỉ cần xác nhận lại bằng Playwright (ép `state.day = 11`, thấy điểm hiện đúng trên TopBar). Không có code mới.
