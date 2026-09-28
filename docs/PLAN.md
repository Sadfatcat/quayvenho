# Quầy Vé Nhỏ — Đặc tả kỹ thuật và kế hoạch triển khai

Tài liệu này là nguồn sự thật cho toàn bộ dự án. Đọc cùng `CLAUDE.md` ở thư mục gốc.

Mục lục:

1. Mục tiêu và phạm vi
2. Game design: cốt truyện và vòng lặp chính
3. Cơ chế chi tiết
4. Nội dung game (data)
5. Công thức kinh tế và chấm điểm
6. Kiến trúc
7. Data model
8. Sinh đơn hàng và RNG
9. Hệ thống lưu game
10. Scenes và UI
11. Input, mobile, audio
12. Các phase triển khai (task + acceptance criteria)
13. Kế hoạch test
14. Danh sách awful case bắt buộc xử lý
15. Quyết định còn mở (phải hỏi)
16. Cá nhân hoá
17. Backlog (không làm ở bản đầu)

---

## 1. Mục tiêu và phạm vi

### 1.1 Mục tiêu

- Một game hoàn chỉnh, chơi được từ ngày 1 đến ít nhất ngày 30, có các ngày đặc biệt do chủ dự án liệt kê (§16), sau đó chơi tiếp vô hạn.
- Chạy mượt trên trình duyệt điện thoại tầm trung (Safari iOS, Chrome Android), màn dọc 9:16.
- Cài được thành PWA, chơi offline sau lần tải đầu.
- Tiến trình không bao giờ mất vì các thao tác bình thường (tắt tab, khoá máy, chuyển app).
- Một chế độ chơi duy nhất, bán vé khắt khe. Không có chế độ dễ.

### 1.2 Không làm (non-goals)

- Không backend, không tài khoản, không multiplayer, không bảng xếp hạng (trừ khi §15 quyết định khác).
- Không monetization, không quảng cáo, không analytics.
- Không hỗ trợ màn ngang (chỉ hiện overlay yêu cầu xoay dọc).
- Không đa ngôn ngữ. Chỉ tiếng Việt, nhưng mọi chuỗi vẫn gom vào `strings.ts`.
- Không có chế độ Thư giãn, không có màn kết thúc, không có khách đi nhóm.
- Các cơ chế trong §17 (máy bay, cơ trưởng, nhân viên, nợ, phá sản, hoãn chuyến) không làm ở bản đầu.

### 1.3 Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| Tuyến (route) | Cặp điểm đi–điểm đến, ví dụ `HAN-SGN` |
| Chuyến (flight) | Một lần bay cụ thể của một tuyến trong đêm, có giờ cất cánh |
| Lô ghế (allotment) | Tập ghế cụ thể trên một chuyến mà người chơi đã mua trước |
| Hạng (cabin) | `ECONOMY` hoặc `BUSINESS` |
| Đơn (order) | Yêu cầu của một khách. Mỗi khách mua đúng 1 vé |
| Vé (ticket) | Thứ người chơi lắp ra để đáp ứng đơn |
| Xu | Đơn vị tiền trong game, số nguyên |
| Phút game | Đơn vị thời gian trong game. `MS_PER_GAME_MINUTE = 500`: ca 08:00–19:00 (660 phút game) dài 5,5 phút thật |
| Sao | Điểm một khách chấm, 1–5 |
| TravelViet | App đánh giá quầy, mở từ ngày 11. Điểm = trung bình sao của 30 khách gần nhất |

---

## 2. Game design: cốt truyện và vòng lặp chính

### 2.1 Cốt truyện

Người chơi là một bạn genz nổi loạn vừa bỏ việc văn phòng vì chán cảnh "dạ vâng" tám tiếng mỗi ngày. Bạn phát hiện một kẽ hở: các chuyến bay đêm (21:30 đến 01:30) luôn ế, hãng bay bán sỉ ghế giá bèo cho đại lý. Trong khi đó dân du lịch bụi, dân đi làm xa, hội "đi là đi luôn" thì cần vé rẻ. Bạn thuê một góc sảnh sân bay, dựng quầy, đặt cho nó một cái tên thật chất, và bắt đầu "săn vé đêm". Mục tiêu: kiếm tiền bằng sự khác biệt, leo top TravelViet, cho cả xóm thấy con đường không giống ai vẫn đến được đích.

- Nhân vật dẫn truyện: "Béo", bạn thân kiêm đồng sáng lập, nói chuyện kiểu genz. Béo xuất hiện trong tutorial và các thông báo quan trọng.
- Phần mô tả (giới thiệu thế giới, cách chơi, luật mới) được kể qua popup thoại của Béo trong tutorial, không có màn chữ dài riêng.
- Nội dung thoại đầy đủ viết ở Phase 5, gom trong `src/data/strings.ts`.

### 2.2 Onboarding (lần chơi đầu)

Chạy khi bấm "Chơi mới" (`profile = null`):

1. Béo chào và kể cốt truyện ngắn (3–4 popup, chạm để tiếp).
2. Nhập tên người chơi: 1–16 ký tự sau khi trim, không rỗng.
3. Nhập tên thương hiệu quầy: 1–20 ký tự sau khi trim, không rỗng.
4. Béo đọc lại tên thương hiệu, sang PREP ngày 1 kèm tutorial ngày 1.

Tên thương hiệu hiện trên biển quầy (CounterScene), top bar Kho và tiêu đề Tổng kết. Không thay tên game "Quầy Vé Nhỏ", không thay mã chuyến "QV".

### 2.3 Vòng lặp một ngày

```
PREP (Kho) ──► OPEN (Quầy) ──► CLOSING ──► SUMMARY ──► SHOP ──► (ngày+1) PREP
```

- PREP: không có đồng hồ chạy. Người chơi xem các chuyến bay đêm nay, dự báo thời tiết (nếu có), mua lô ghế. Bấm "Mở cửa" để sang OPEN.
- OPEN: đồng hồ chạy từ 08:00 đến 19:00 giờ game. Khách đến theo lịch đến trong ngày (§8.3), người chơi bán vé. Không chuyến nào cất cánh trong ca.
- CLOSING: khi đồng hồ chạm 19:00. Không sinh khách mới. Khách còn trong hàng vẫn được phục vụ đến khi hết khách (khách vẫn có thể bỏ đi vì hết kiên nhẫn). Đồng hồ vẫn chạy (có thể vượt 19:00).
- SUMMARY: mọi ghế chưa bán thành ghế ế, hiện tổng kết ngày, auto-save.
- SHOP: mua nâng cấp, mở tuyến. Chi tiêu ở SHOP được ghi vào ngày hôm sau (§5.6). Bấm "Ngày tiếp theo" để sang PREP của ngày mới.

### 2.4 Vòng lặp một khách

```
Khách vào hàng ─► đến lượt (đứng ở quầy) ─► người chơi đọc đơn
  ─► [tuỳ chọn] mở hộ chiếu kiểm tra ─► Bước A: chọn chuyến
  ─► Bước B: chọn ghế ─► Bước C: hành lý + dịch vụ ─► Bước D: xem lại vé
  ─► In vé ─► kéo vé đưa cho khách ─► chấm điểm ─► khách rời đi
```

Nhánh phụ:
- Bấm "Từ chối" bất kỳ lúc nào: khách rời đi, chấm theo luật từ chối (§5.5).
- Bấm "Làm lại": vé đang lắp reset về Bước A, ghế đã giữ trả về kho.
- Khách hết kiên nhẫn: khách bỏ đi, vé đang lắp bị huỷ, ghế trả về kho, 1 sao.

### 2.5 Tiến trình qua các ngày

- Mỗi ngày mở tối đa một cơ chế mới (bảng §4.5).
- Số khách tăng dần theo ngày (§3.9). Cuối ngày 10 mở TravelViet: từ ngày 11, điểm đánh giá quyết định lượng khách.
- Người chơi mở thêm tuyến và nâng cấp bằng tiền lời.

---

## 3. Cơ chế chi tiết

### 3.1 Máy bay và sơ đồ ghế

- Mọi chuyến dùng chung một sơ đồ: cấu hình 2-2, cột `A B | C D`.
  - `A`, `D`: ghế cửa sổ (WINDOW). `B`, `C`: ghế lối đi (AISLE).
  - Hàng 1–2: BUSINESS (8 ghế). Hàng 3–12: ECONOMY (40 ghế).
- Trên màn chọn ghế, chỉ những ghế thuộc lô của người chơi và chưa bán mới bấm được. Các ghế khác hiện màu xám ("đại lý khác đã bán").

### 3.2 Mua lô ghế (Kho)

- Mỗi chuyến trong đêm hiện một dòng: tuyến, giờ cất cánh, giá vốn mỗi ghế theo hạng, số ghế đã mua.
- Người chơi chọn số lượng ghế ECONOMY (0–12) và BUSINESS (0–4) cho mỗi chuyến bằng stepper `−`/`+`.
- Giá vốn có chiết khấu theo số lượng mua trên cùng một chuyến và hạng (§5.2).
- Khi xác nhận mua, domain chọn ghế cụ thể từ các ghế còn trống của chuyến bằng RNG:
  - Mặc định: random đều trong các ghế còn trống của hạng đó.
  - Có nâng cấp `AIRLINE_RELATIONS`: người chơi chọn thêm tỉ lệ "ưu tiên cửa sổ / cân bằng / ưu tiên lối đi", domain chọn theo tỉ lệ đó.
- Mua là không hoàn tác trong ngày. Stepper chỉ thay đổi số lượng dự định, tiền chỉ bị trừ khi bấm "Xác nhận nhập ghế".
- Có thể mua nhiều lần trong PREP. Không mua được trong OPEN (trừ khi §15 D4 quyết định khác).

### 3.3 Hạn dùng của ghế

- Mọi chuyến cất cánh sau giờ đóng quầy (§4.2), nên không có ghế nào hết hạn trong ca.
- Khi vào SUMMARY, mọi ghế còn `AVAILABLE` chuyển `EXPIRED` và được đếm vào "Ghế ế". Có nâng cấp `REFUND_POLICY` thì hoàn 30% giá vốn các ghế ế.
- Ghế mất do thời tiết (`LOST`, §4.4) không tính là ghế ế và không được hoàn.

### 3.4 Đơn của khách

Mỗi đơn có các trường (cơ chế nào chưa mở theo ngày thì trường đó luôn ở giá trị mặc định):

| Trường | Giá trị | Mặc định | Mở từ ngày |
|---|---|---|---|
| `routeId` | tuyến đã mở | — | 1 |
| `baggageKg` | 0 / 15 / 20 / 30 | 0 | 2 |
| `seatPref` | WINDOW / AISLE / ANY | ANY | 3 |
| `cabin` | ECONOMY / BUSINESS | ECONOMY | 4 |
| `timePref` | NIGHT (21:30–23:30) / LATE (00:30–01:30) / ANY | ANY | 5 |
| `extras` | tập con của VEG_MEAL, WHEELCHAIR, INSURANCE | [] | 5 |
| `passport` | xem §3.7 | luôn hợp lệ | 6 (lỗi mới xuất hiện) |

Bong bóng yêu cầu hiển thị đơn bằng icon + chữ ngắn, ví dụ: `✈ Đà Nẵng · Thương gia · 🧳20kg · 🪟 Cửa sổ · 🌙 Khuya`.

Ràng buộc logic khi sinh đơn (không bao giờ sinh tổ hợp vô lý):
- `WHEELCHAIR` thì `seatPref` phải là `AISLE` hoặc `ANY`.
- `timePref` chỉ được chọn nếu tuyến đó có ít nhất một chuyến (không bị huỷ) trong khung giờ ấy.

### 3.5 Lắp vé: 4 bước

Vùng thao tác phía dưới màn Quầy là một stepper 4 bước. Người chơi có thể bấm vào bước trước để quay lại sửa, nhưng không nhảy tới bước sau khi bước hiện tại chưa hợp lệ.

- Bước A — Chọn chuyến: danh sách các chuyến của mọi tuyến đã mở (không lọc sẵn theo đơn; có ô lọc theo điểm đến sau khi mua nâng cấp `SEARCH_FILTER`). Mỗi dòng: mã chuyến, tuyến, giờ bay, số ghế còn trong lô theo hạng. Chọn một chuyến và một hạng (hai nút ECONOMY/BUSINESS trên dòng; hạng hết ghế thì disable). Chuyến bị huỷ do thời tiết hiện xám, nhãn "Huỷ do thời tiết".
- Bước B — Chọn ghế: sơ đồ ghế của chuyến, chỉ hiện khoang của hạng đã chọn. Chọn đúng 1 ghế.
- Bước C — Hành lý và dịch vụ: thanh kéo hành lý 0–30 kg, có vạch ở 15, 20, 30; thả tay thì snap về vạch gần nhất nếu lệch ≤ 1 kg, còn lại giữ nguyên số kg (số nguyên). Ba nút toggle dịch vụ: Suất chay, Xe lăn, Bảo hiểm (chỉ hiện khi cơ chế extras đã mở).
- Bước D — Xem lại: hiện vé nháp đầy đủ các trường. Nút "In vé".

In vé: thanh tiến trình máy in (thời gian theo nâng cấp, §4.3). Trong lúc in không sửa được vé, nhưng khách vẫn mất kiên nhẫn. In xong, vé xuất hiện; người chơi kéo vé thả vào vùng khách để giao. Thả trượt ra ngoài thì vé bay về chỗ cũ.

Các nút luôn hiện trong lúc có khách ở quầy: "Làm lại", "Từ chối", "Hộ chiếu" (chỉ từ ngày 6).

### 3.6 Kiên nhẫn

- Mỗi khách có `patienceMax` (ms thật, §5.4). Kiên nhẫn chỉ giảm khi khách đang đứng ở quầy hoặc trong hàng; khách trong hàng mất kiên nhẫn với tốc độ 50%.
- Khuôn mặt khách: `ratio > 0.6` vui, `0.3–0.6` bình thường, `< 0.3` sốt ruột (kèm rung nhẹ bong bóng).
- `ratio = 0`: khách bỏ đi, 1 sao, phạt tiền (§5.5).
- Pause (menu, chuyển tab, khoá màn hình) thì kiên nhẫn đứng yên.

### 3.7 Hộ chiếu (từ ngày 6)

- Bấm nút "Hộ chiếu" hoặc chạm vào khách thì mở card hộ chiếu: ảnh đại diện, họ tên, ngày hết hạn (dạng "Ngày {n}"). Kèm theo là "Tên đặt vé" khách đọc lên, hiện trong bong bóng.
- Hộ chiếu lỗi khi: `expiresDay < currentDay` (hết hạn trước hôm nay; hết hạn đúng hôm nay vẫn hợp lệ), hoặc `passportName !== bookedName`.
- Lỗi tên luôn là khác một thành phần tên rõ ràng (khác tên đệm hoặc tên), không bao giờ chỉ khác dấu tiếng Việt (§15 D5).
- `expiresDay` luôn ≥ 1 (không bao giờ hiện "Ngày âm").
- Tutorial ngày 6 phải giải thích luật hết hạn "đúng hôm nay vẫn hợp lệ".

### 3.8 Hàng đợi

- Tối đa 4 khách đứng chờ phía sau khách ở quầy (6 với `BIGGER_COUNTER`). Khi hàng đã đủ, khách mới đến sẽ bỏ qua (không vào hàng), tính là "Khách bỏ về vì đông" trong tổng kết, không chấm sao, không ảnh hưởng TravelViet.
- Chỉ phục vụ khách đầu hàng. Không đổi thứ tự.
- Rủi ro đã biết: một người chơi giỏi phục vụ khoảng 15–25 khách mỗi ca. Khi số khách trong ngày vượt xa con số này, phần dư chỉ thành "bỏ về vì đông". Chấp nhận ở bản đầu; cơ chế thuê nhân viên (§17) sẽ giải quyết. Sim phải báo cáo tỉ lệ này (§13.3).

### 3.9 Lượng khách mỗi ngày và TravelViet

Số khách gốc, sinh ổn định từ `seed` bằng stream `demand` (§8.1):

```
base(1) = 5
base(d) = base(d−1) + rng.int(1, 3)    với 2 ≤ d ≤ 10
base(d) = base(d−1) + rng.int(1, 2)    với d ≥ 11
```

Kỳ vọng: base(10) ≈ 23, base(30) ≈ 53.

Điểm TravelViet `R` (1.0–5.0, làm tròn 1 chữ số thập phân) = trung bình sao của 30 khách được chấm gần nhất (§5.5). Chưa có khách nào thì `R = 4.0`. Sao được ghi từ ngày 1, nhưng TravelViet chỉ hiện và có tác dụng từ ngày 11 (mở khoá khi kết thúc ngày 10, có tutorial). Ngày `d` dùng `R` tại cuối ngày `d − 1`.

Hệ số theo điểm (chỉ từ ngày 11; trước đó `factor = 1`, `bonus = 0`):

| R | factor | bonus |
|---|---|---|
| < 3.0 | 0.30 | 0 |
| 3.0 – 3.5 | 0.45 | 0 |
| 3.6 – 4.4 | 1.00 | 0 |
| 4.5 – 5.0 | 1.00 | cộng dồn theo bậc bên dưới |

Bonus từ 4.5 trở lên, mỗi bậc 0.1 cộng thêm một số khách random (stream `demand`), cứ 3 bậc thì nhân 3:

| Bậc | R | Cộng thêm mỗi bậc |
|---|---|---|
| Tầng 1 | 4.5, 4.6, 4.7 | `int(8, 12)` |
| Tầng 2 | 4.8, 4.9, 5.0 | `int(25, 35)` |

Ví dụ R = 4.8: bonus = 3 × ~10 + 1 × ~30 ≈ 60. Tối đa (R = 5.0) ≈ 141.

```
customers(d) = clamp( round( (base(d) × factor + bonus) × (RUSH ? 1.4 : 1) ), 2, 300 )
```

Kiểm tra trần: ngày 30, R = 5.0, RUSH: (53 + 141) × 1.4 ≈ 272 < 300. Về sau `base` tiếp tục tăng, trần 300 giữ đúng yêu cầu.

### 3.10 Lưới an toàn chống softlock

Softlock là tình huống người chơi không thể kiếm thêm tiền. Kiểm tra ở đầu PREP mỗi ngày:

```
money < 3 × (giá vốn ECONOMY rẻ nhất trong các tuyến đã mở)
```

Nếu đúng: sự kiện "Hãng bay hỗ trợ đại lý" — tặng 3 ghế ECONOMY miễn phí trên chuyến sớm nhất của tuyến rẻ nhất, Béo hiện hộp thoại giải thích. Không giới hạn số lần.

Tiền không bao giờ âm: mọi khoản phạt bị giới hạn bởi số tiền hiện có (`penalty = min(penalty, money)`). Nợ và phá sản: xem §17.

---

## 4. Nội dung game (data)

Tất cả nằm trong `src/data/`. Các con số dưới đây là giá trị khởi điểm để cân bằng, sẽ được tinh chỉnh bằng `npm run sim` (§13.3).

### 4.1 Tuyến bay — `src/data/routes.ts`

| id | Tên hiển thị | Giá vốn ECO | Giá vốn BIZ | Giá bán ECO | Giá bán BIZ | Trọng số khách | Mở khoá |
|---|---|---|---|---|---|---|---|
| HAN-SGN | TP. Hồ Chí Minh | 70 | 180 | 100 | 260 | 3 | Có sẵn |
| HAN-DAD | Đà Nẵng | 50 | 130 | 75 | 190 | 3 | Có sẵn |
| HAN-CXR | Nha Trang | 60 | 150 | 90 | 220 | 2 | 250 xu |
| HAN-PQC | Phú Quốc | 85 | 210 | 125 | 300 | 2 | 350 xu |
| HAN-DLI | Đà Lạt | 65 | 160 | 95 | 235 | 2 | 350 xu |
| HAN-BKK | Bangkok | 120 | 300 | 175 | 430 | 2 | 800 xu, TravelViet ≥ 3.8 |
| HAN-ICN | Seoul | 160 | 400 | 235 | 580 | 2 | 1200 xu, TravelViet ≥ 4.0 |
| HAN-NRT | Tokyo | 190 | 470 | 280 | 690 | 1 | 1600 xu, TravelViet ≥ 4.2 |
| HAN-CDG | Paris | 320 | 800 | 470 | 1180 | 1 | 2500 xu, TravelViet ≥ 4.5 |

- Tuyến có điều kiện TravelViet chỉ mở được từ ngày 11; trước đó Shop hiện "Cần TravelViet (từ ngày 11)".
- Mỗi tuyến có một icon/màu riêng (dùng trong bong bóng và danh sách chuyến). Tên hiển thị có thể bị thay bằng dữ liệu cá nhân hoá (§16).

### 4.2 Lịch bay — `src/data/schedule.ts`

- Khung giờ cất cánh cố định, mỗi giờ một chuyến: 21:30, 22:30, 23:30, 00:30, 01:30 (sau nửa đêm vẫn tính là chuyến của cùng ngày; `departAt` = 1290, 1350, 1410, 1470, 1530).
- Ngày 1–8: mỗi tuyến đã mở có 3 chuyến: 21:30, 23:30, 01:30.
- Từ ngày 9: tuyến có trọng số 3 có đủ 5 chuyến.
- Khung giờ trong đơn: `NIGHT` = 21:30, 22:30, 23:30; `LATE` = 00:30, 01:30.
- Mã chuyến: `QV` + số 3 chữ số, sinh ổn định từ `routeId + slot` (ví dụ `QV101`). Không random mã chuyến.
- Ghế các đại lý khác đã mua (hiện xám): mỗi chuyến random 40–70% số ghế mỗi hạng là "đã bán" ở đầu ngày (stream `schedule`).

### 4.3 Nâng cấp — `src/data/upgrades.ts`

| id | Tên | Giá | Hiệu ứng | Điều kiện |
|---|---|---|---|---|
| COMFY_CHAIRS | Ghế chờ êm | 200 | `patienceMax` × 1.2 | — |
| FAN | Quạt mát | 150 | `patienceMax` × 1.1 | — |
| FAST_PRINTER | Máy in nhanh | 250 | Thời gian in 3000 ms → 1500 ms | — |
| SEARCH_FILTER | Ô lọc chuyến | 180 | Bước A có ô lọc theo điểm đến | — |
| AIRLINE_RELATIONS | Quan hệ hãng bay | 400 | Chọn tỉ lệ cửa sổ/lối đi khi mua ghế (§3.2) | Ngày ≥ 3 |
| REFUND_POLICY | Chính sách hoàn ghế | 350 | Hoàn 30% giá vốn ghế ế | Ngày ≥ 4 |
| BIGGER_COUNTER | Quầy rộng | 300 | Hàng đợi tối đa 4 → 6 | — |
| LOYALTY_BOARD | Bảng khách quen | 450 | Tip × 1.15 | TravelViet ≥ 4.3 |

Hiệu ứng nhân cộng dồn theo phép nhân: COMFY_CHAIRS + FAN = × 1.2 × 1.1 = × 1.32. Mỗi nâng cấp chỉ mua một lần.

### 4.4 Sự kiện — `src/data/events.ts`

Tối đa một sự kiện mỗi ngày, có từ ngày 1. Chọn ở đầu PREP bằng stream `event`:

| id | Xác suất/ngày | Hiệu ứng |
|---|---|---|
| RUSH | 0.15 | Số khách × 1.4, giá bán × 1.2, banner "Cao điểm lễ hội" |
| WEATHER | 0.25 | Dự báo xấu cho một tuyến (bên dưới) |
| — | 0.60 | Không có sự kiện |

WEATHER:
- Đầu PREP: chọn ngẫu nhiên một tuyến đã mở. Banner ở Kho: "Dự báo thời tiết tại {điểm đến} có xu hướng diễn biến xấu". Người chơi tự quyết có mua ghế tuyến đó hay không.
- Khi bấm "Mở cửa" (`OPEN_COUNTER`): chốt kết quả bằng stream `weather`:

| Kết quả | Xác suất | Hậu quả |
|---|---|---|
| GOOD | 0.40 | Không có gì, bán bình thường |
| BAD | 0.40 | Mất `round(n / 3)` ghế đã mua của tuyến đó (`n` = số ghế AVAILABLE của tuyến, chọn ngẫu nhiên trên mọi chuyến của tuyến) |
| SEVERE | 0.20 | Mọi chuyến của tuyến bị huỷ, mất toàn bộ ghế đã mua của tuyến |

- Ghế mất chuyển `LOST`, không hoàn tiền, không phạt thêm. Béo thông báo kết quả ngay khi mở cửa.
- SEVERE: chuyến chuyển `CANCELLED`; khách hỏi tuyến đó phải bị từ chối (`REFUSED_NO_STOCK`).

Ngày có khách đặc biệt (§16) thì không có sự kiện ngẫu nhiên.

### 4.5 Config theo ngày — `src/data/days.ts`

Ngày không có dòng riêng dùng config của ngày gần nhất nhỏ hơn. Từ ngày 11 trở đi: `patienceBaseMs` giảm 2% mỗi ngày (tối thiểu 24000). Số khách theo §3.9, không nằm trong bảng.

| Ngày | patienceBaseMs | pBaggage | pSeatPref | pBusiness | pTimePref | pExtra | pBadPassport | maxComplexity | Cơ chế mới |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 50000 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Onboarding, cơ bản |
| 2 | 48000 | 0.5 | 0 | 0 | 0 | 0 | 0 | 1 | Hành lý |
| 3 | 46000 | 0.5 | 0.5 | 0 | 0 | 0 | 0 | 2 | Chọn ghế |
| 4 | 44000 | 0.55 | 0.5 | 0.2 | 0 | 0 | 0 | 3 | Hạng thương gia, tip |
| 5 | 42000 | 0.6 | 0.55 | 0.2 | 0.35 | 0.3 | 0 | 4 | Khung giờ + dịch vụ |
| 6 | 40000 | 0.6 | 0.55 | 0.25 | 0.4 | 0.3 | 0.12 | 4 | Hộ chiếu |
| 8 | 38000 | 0.65 | 0.6 | 0.25 | 0.45 | 0.35 | 0.12 | 5 | — |
| 10 | 36000 | 0.65 | 0.6 | 0.3 | 0.45 | 0.4 | 0.15 | 5 | Cuối ngày mở TravelViet |

`maxComplexity` là ngân sách độ khó của một đơn (§8.4). Với maxComplexity = 0 thì đơn chỉ có tuyến.

### 4.6 Khách — `src/data/customers.ts`

- 16 kiểu ngoại hình (sprite id `c01`–`c16`), mỗi kiểu có 3 biểu cảm.
- Danh sách họ (15), tên đệm (20), tên (40) tiếng Việt để ghép họ tên hộ chiếu. Họ tên tối đa 22 ký tự; ghép xong vượt thì ghép lại.
- Câu thoại: mỗi biểu cảm và mỗi kết quả (xuất sắc, tốt, được, kém, sai, bị từ chối đúng, bị từ chối sai, bỏ đi) có 3–5 câu, chọn bằng RNG. Khách BUSINESS có bộ thoại riêng, khó tính hơn.

---

## 5. Công thức kinh tế và chấm điểm

Tất cả nằm trong `src/domain/economy.ts` và `src/domain/scoring.ts`. Mọi kết quả tiền đi qua hàm `roundMoney(x) = Math.round(x)` (định nghĩa duy nhất trong `economy.ts`) và được đảm bảo là số nguyên ≥ 0.

### 5.1 Tiền khởi đầu

- `STARTING_MONEY = 400`.

### 5.2 Giá vốn khi mua lô ghế

```
unitCost = route.cost[cabin]
discount = qty >= 10 ? 0.10 : qty >= 5 ? 0.05 : 0
total    = roundMoney(unitCost × qty × (1 − discount))
```

`qty` tính trên cùng một chuyến và cùng một hạng trong một lần xác nhận.

### 5.3 Doanh thu một vé

```
fare        = route.price[cabin] × (RUSH ? 1.2 : 1)
baggageFee  = { 0: 0, 15: 20, 20: 25, 30: 35 }[order.baggageKg]
extrasFee   = VEG_MEAL: 5, WHEELCHAIR: 0, INSURANCE: 15 (cộng các extras của ĐƠN)
revenue     = roundMoney(fare + baggageFee + extrasFee)
```

- Doanh thu tính theo đơn của khách (khách trả cho thứ họ yêu cầu).
- Chỉ thu tiền khi kết quả là `PERFECT`, `GOOD` hoặc `OK`. `POOR`, `FAILED`, `SOLD_INVALID` không thu tiền, và ghế đã giao vẫn mất.

### 5.4 Kiên nhẫn

```
patienceMax = (cfg.patienceBaseMs + complexity × 5000) × upgradeMultiplier
```

### 5.5 Chấm điểm một vé

Đầu vào: `order`, `ticket` (hoặc hành động từ chối), `patienceRatio` tại lúc giao, `currentDay`, `modifiers`, `money`.

Bước 1 — Hộ chiếu:
- Hộ chiếu lỗi + người chơi từ chối: `REFUSED_CORRECT`, 4 sao, không doanh thu.
- Hộ chiếu lỗi + người chơi bán vé: `SOLD_INVALID`, 1 sao, phạt 40. Thoại: "Khách bị chặn ở cửa an ninh!".
- Hộ chiếu hợp lệ + người chơi từ chối: nếu `canServe` (§8.5) sai thì `REFUSED_NO_STOCK`, 3 sao, không phạt; nếu đúng thì `REFUSED_WRONG`, 1 sao, phạt 20.

Bước 2 — Lỗi nghiêm trọng (`FAILED`, 1 sao, phạt 25, ghế đã giao vẫn mất):
- Sai tuyến.
- Sai hạng.
- Sai khung giờ (`timePref ≠ ANY` và chuyến không thuộc khung).

Bước 3 — Độ chính xác, bắt đầu từ `accuracy = 1`. Khách BUSINESS khó tính: mọi mức trừ nhân 2.
- Sai hành lý: −0.3 (hành lý đúng khi `|ticket.baggageKg − order.baggageKg| ≤ 1`).
- Sai ưu tiên ghế (ghế không phải WINDOW/AISLE như yêu cầu): −0.2.
- Thiếu mỗi dịch vụ khách yêu cầu: −0.15. Thừa mỗi dịch vụ khách không yêu cầu: −0.05.
- `accuracy = max(0, accuracy)`.

Bước 4 — Kết quả (`speed = patienceRatio` lúc giao, 0..1):

| Điều kiện | Kết quả | Sao | Doanh thu |
|---|---|---|---|
| `accuracy === 1 && speed >= 0.5` | PERFECT | 5 | có |
| `accuracy >= 0.8` | GOOD | 4 | có |
| `accuracy >= 0.5` | OK | 3 | có |
| `accuracy < 0.5` | POOR | 2 | không |

Tip: chỉ khách BUSINESS có kết quả PERFECT:

```
tip = roundMoney(0.8 × fare × tipMultiplier)
```

Mọi trường hợp khác tip = 0.

Bước 5 — Khách bỏ đi vì hết kiên nhẫn: `LEFT`, 1 sao, phạt 10.

Phạt luôn được clamp: `penalty = min(penalty, money)`.

Thứ tự xử lý trong cùng một tick: nếu hành động giao vé và sự kiện hết kiên nhẫn xảy ra cùng tick, giao vé được xử lý trước.

### 5.6 Tổng kết ngày

Tổng kết được tính từ transaction log của ngày (một mảng các giao dịch, không cộng dồn rải rác). Các loại giao dịch:

```
SEAT_PURCHASE (−), TICKET_REVENUE (+), TIP (+), PENALTY (−),
REFUND_EXPIRED (+), SUPPORT_GIFT (0, ghi nhận), WEATHER_LOSS (0, ghi nhận),
UPGRADE_PURCHASE (−), ROUTE_UNLOCK (−)
```

- `moneyStart` của ngày `d` = tiền tại lúc vào SUMMARY của ngày `d − 1` (ngày 1: `STARTING_MONEY`).
- Chi tiêu ở SHOP sau SUMMARY ngày `d − 1` được ghi với `day = d`, nằm trong log của ngày `d`.
- Invariant bắt buộc có test: `moneyStart + Σ(transactions) === moneyEnd`, với `moneyEnd` = tiền lúc vào SUMMARY.

Hiển thị: tổng doanh thu vé, tổng tip, chi mua ghế, chi Shop (từ hôm trước), số ghế ế và giá vốn ghế ế, tiền hoàn, số ghế mất do thời tiết và giá vốn, tiền phạt, lợi nhuận ròng, số khách phục vụ / bỏ đi / bỏ về vì đông, số sao trung bình trong ngày, điểm TravelViet mới (từ ngày 11).

---

## 6. Kiến trúc

### 6.1 Cấu trúc thư mục

```
/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── PLAN.md            # tài liệu này
│   ├── STATUS.md          # trạng thái hiện tại (ghi đè)
│   └── DECISIONS.md       # nhật ký quyết định (append-only)
├── public/
│   ├── icons/             # icon PWA 192, 512, maskable
│   └── assets/            # atlas, audio, font
├── scripts/
│   └── sim.ts             # mô phỏng kinh tế (§13.3)
├── src/
│   ├── main.ts            # tạo Phaser.Game, đăng ký scenes
│   ├── config.ts          # hằng số: kích thước, MS_PER_GAME_MINUTE, v.v.
│   ├── domain/            # TS thuần, KHÔNG import phaser/DOM
│   │   ├── rng.ts             # mulberry32, deriveSeed
│   │   ├── shuffleBag.ts
│   │   ├── models.ts
│   │   ├── clock.ts           # GameClock
│   │   ├── seatMap.ts         # sơ đồ ghế, window/aisle
│   │   ├── schedule.ts        # sinh lịch bay trong ngày
│   │   ├── inventory.ts       # mua ghế, giữ ghế, bán ghế, hết hạn, mất do thời tiết
│   │   ├── canServe.ts        # §8.5, dùng chung cho orderGen và scoring
│   │   ├── demand.ts          # số khách mỗi ngày, TravelViet (§3.9)
│   │   ├── orderGen.ts        # sinh đơn
│   │   ├── spawner.ts         # lịch khách đến trong ngày
│   │   ├── scoring.ts         # chấm vé
│   │   ├── economy.ts         # giá, tip, transaction log, tổng kết
│   │   ├── upgrades.ts        # áp hiệu ứng nâng cấp → modifiers
│   │   ├── events.ts          # chọn sự kiện ngày, chốt thời tiết
│   │   ├── safetyNet.ts       # chống softlock
│   │   ├── dayCycle.ts        # state machine ngày + reducer command
│   │   └── game.ts            # facade: GameSession, điểm vào duy nhất cho scenes
│   ├── data/
│   │   ├── routes.ts
│   │   ├── schedule.ts
│   │   ├── upgrades.ts
│   │   ├── events.ts
│   │   ├── days.ts
│   │   ├── customers.ts
│   │   ├── strings.ts
│   │   └── personal.ts        # cá nhân hoá (§16)
│   ├── save/
│   │   ├── schema.ts          # zod schema các version
│   │   ├── migrate.ts
│   │   ├── storage.ts         # bọc localStorage an toàn
│   │   ├── tabLock.ts         # chống mở 2 tab
│   │   └── exportImport.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── TitleScene.ts
│   │   ├── OnboardingScene.ts # nhập tên, thương hiệu, cốt truyện (§2.2)
│   │   ├── PrepScene.ts       # Kho
│   │   ├── CounterScene.ts    # Quầy
│   │   ├── SummaryScene.ts
│   │   ├── ShopScene.ts
│   │   └── overlays/
│   │       ├── PauseOverlay.ts
│   │       ├── SettingsOverlay.ts
│   │       ├── TutorialOverlay.ts   # gồm popup thoại của Béo
│   │       ├── RotateOverlay.ts
│   │       └── DialogOverlay.ts
│   ├── ui/                    # component Phaser tái sử dụng
│   │   ├── Button.ts
│   │   ├── Card.ts
│   │   ├── Toggle.ts
│   │   ├── Slider.ts          # âm lượng
│   │   ├── SegmentedControl.ts # seat bias, tab Shop
│   │   ├── TextInput.ts       # Phaser DOM element, dùng ở Onboarding
│   │   ├── ScrollList.ts      # cuộn, phân biệt kéo/chạm, ảo hoá
│   │   ├── DragController.ts  # chỉ pointer đầu, pointerup trên window
│   │   ├── TopBar.ts
│   │   ├── Stepper.ts         # −/+ ở Kho
│   │   ├── StepIndicator.ts   # A-B-C-D ở Quầy
│   │   ├── Toast.ts
│   │   ├── SpeechBubble.ts
│   │   ├── PatienceBar.ts
│   │   ├── FlightList.ts
│   │   ├── SeatMapView.ts
│   │   ├── BaggageSlider.ts
│   │   ├── ExtrasToggles.ts
│   │   ├── PassportCard.ts
│   │   ├── TicketView.ts
│   │   └── theme.ts           # màu, font, kích thước chuẩn
│   ├── platform/              # thứ phụ thuộc trình duyệt, bọc lại để dễ mock
│   │   ├── visibility.ts      # visibilitychange → pause
│   │   ├── audio.ts           # unlock audio, âm lượng
│   │   ├── haptics.ts         # navigator.vibrate an toàn
│   │   └── pwa.ts             # đăng ký SW, báo có bản mới
│   └── dev/
│       └── debug.ts           # phím tắt debug (chỉ DEV); eruda nếu được duyệt (§15 D10)
├── tests/
│   └── e2e-manual.md          # checklist test tay trên máy thật
├── index.html
├── vite.config.ts             # gồm cả cấu hình Vitest
├── eslint.config.js
├── tsconfig.json
└── package.json
```

Test domain nằm cạnh file (`*.test.ts`). Test tích hợp domain nằm trong `src/domain/__integration__/`.

### 6.2 Luồng dữ liệu

```
Input (tap/drag)
   │
   ▼
Scene / UI component ──command──► GameSession (domain/game.ts)
                                      │  reducer thuần: (state, command) → (state', events[])
                                      ▼
                                 domain events ──► Scene lắng nghe, chạy animation/âm thanh
                                      │
                                      ▼
                                 Save (chỉ ở các mốc §6.6)
```

- `GameSession` giữ `GameState`. Scene không bao giờ sửa `GameState` trực tiếp.
- `GameSession.dispatch(command)` trả về `DomainEvent[]`. Scene render theo state mới và phát hiệu ứng theo events.
- `GameSession.tick(deltaMs)` được `CounterScene.update()` gọi mỗi frame với `deltaMs` đã clamp tối đa 100 ms. Tick tiến đồng hồ, giảm kiên nhẫn, sinh khách theo lịch đến, tiến máy in, và cũng trả `DomainEvent[]`.

### 6.3 Commands

```ts
type Command =
  | { type: 'PROFILE_SET'; playerName: string; brandName: string }
  | { type: 'PREP_SET_QTY'; flightId: string; cabin: CabinClass; qty: number }
  | { type: 'PREP_SET_SEAT_BIAS'; bias: SeatBias }            // cần AIRLINE_RELATIONS
  | { type: 'PREP_CONFIRM_PURCHASE' }
  | { type: 'PREP_CLEAR_PENDING' }
  | { type: 'OPEN_COUNTER' }
  | { type: 'BUILD_SELECT_FLIGHT'; flightId: string; cabin: CabinClass }
  | { type: 'BUILD_SELECT_SEAT'; seat: SeatId }
  | { type: 'BUILD_SET_BAGGAGE'; kg: number }
  | { type: 'BUILD_TOGGLE_EXTRA'; extra: Extra }
  | { type: 'BUILD_GOTO_STEP'; step: BuildStep }
  | { type: 'BUILD_RESET' }
  | { type: 'PRINT_TICKET' }
  | { type: 'DELIVER_TICKET' }
  | { type: 'REFUSE_CUSTOMER' }
  | { type: 'GO_TO_SHOP' }
  | { type: 'SHOP_BUY_UPGRADE'; upgradeId: UpgradeId }
  | { type: 'SHOP_UNLOCK_ROUTE'; routeId: RouteId }
  | { type: 'NEXT_DAY' }
  | { type: 'SETTINGS_UPDATE'; patch: Partial<Settings> }
  | { type: 'FLAG_SET'; flag: string };                       // tutorialDone_{n}, ...
```

Game mới được tạo bằng `createNewGame(seed)` ngoài reducer (không phải command).

Mọi command không hợp lệ ở phase hiện tại (ví dụ `DELIVER_TICKET` khi chưa in xong, `NEXT_DAY` hai lần) phải bị bỏ qua an toàn và trả về event `COMMAND_REJECTED` kèm lý do. Đây là lớp chống double-tap ở tầng domain; tầng UI vẫn phải disable nút.

### 6.4 Domain events

```ts
type DomainEvent =
  | { type: 'COMMAND_REJECTED'; command: Command['type']; reason: string }
  | { type: 'PROFILE_SET' }
  | { type: 'SEATS_PURCHASED'; flightId: string; cabin: CabinClass; seats: SeatId[]; cost: number }
  | { type: 'SUPPORT_GIFT'; flightId: string; seats: SeatId[] }
  | { type: 'DAY_OPENED'; targetCustomers: number }
  | { type: 'WEATHER_RESOLVED'; routeId: RouteId; outcome: WeatherOutcome; lostSeats: number }
  | { type: 'CLOCK_TICK'; minute: number }                 // chỉ phát khi sang phút game mới
  | { type: 'CUSTOMER_SPAWNED'; customerId: string }
  | { type: 'CUSTOMER_TURNED_AWAY'; customerId: string }  // hàng đầy
  | { type: 'CUSTOMER_AT_COUNTER'; customerId: string }
  | { type: 'CUSTOMER_MOOD_CHANGED'; customerId: string; mood: Mood }
  | { type: 'CUSTOMER_LEFT'; customerId: string }          // hết kiên nhẫn
  | { type: 'PRINT_STARTED'; durationMs: number }
  | { type: 'PRINT_DONE' }
  | { type: 'TICKET_SCORED'; result: ScoreResult }
  | { type: 'DAY_CLOSING' }
  | { type: 'DAY_ENDED'; summary: DaySummary }
  | { type: 'TRAVELVIET_UNLOCKED' }
  | { type: 'UPGRADE_BOUGHT'; upgradeId: UpgradeId }
  | { type: 'ROUTE_UNLOCKED'; routeId: RouteId }
  | { type: 'SCRIPTED_MOMENT'; id: string };               // cá nhân hoá
```

### 6.5 State machine

```
DayPhase: 'PREP' | 'OPEN' | 'CLOSING' | 'SUMMARY' | 'SHOP'

PREP    --OPEN_COUNTER-->        OPEN      (chốt thời tiết, tính số khách, lập lịch đến)
OPEN    --clock >= 1140 (19:00)--> CLOSING
CLOSING --hàng rỗng và không còn khách ở quầy--> SUMMARY   (ghế ế, auto-save)
SUMMARY --GO_TO_SHOP-->          SHOP
SHOP    --NEXT_DAY-->            PREP (day+1)               (sự kiện, lưới an toàn, auto-save)
```

Trong OPEN/CLOSING có state machine con cho khách ở quầy:

```
CounterState: 'EMPTY' | 'BUILDING' | 'PRINTING' | 'READY_TO_DELIVER' | 'RESOLVING'
BuildStep:    'FLIGHT' | 'SEAT' | 'EXTRAS' | 'REVIEW'
```

`RESOLVING` kéo dài 1200 ms (animation khách rời đi), trong lúc đó mọi command build bị reject.

### 6.6 Khi nào lưu

Một luật duy nhất:

- Sau `PROFILE_SET` (state PREP ngày 1).
- Sau mỗi `PREP_CONFIRM_PURCHASE`.
- Khi vào SUMMARY.
- Sau mỗi lần mua ở SHOP.
- Sau `NEXT_DAY` (state ở PREP của ngày mới).
- Sau `SETTINGS_UPDATE` và `FLAG_SET`.
- Không bao giờ lưu trong OPEN/CLOSING.

"Chơi tiếp" mở đúng màn theo `phase` đã lưu: PREP → Kho, SUMMARY → Tổng kết, SHOP → Shop. `profile = null` → Onboarding.

Hệ quả: refresh hoặc tắt tab giữa ca sẽ load lại PREP của chính ngày đó với lô ghế đã mua còn nguyên và tiền đã trừ. Người chơi không thể mua ghế rồi refresh để lấy lại tiền. Các stream `weather`, `demand`, `spawn`, `orders` được seed từ `seed + day`, nên mở cửa lại sẽ ra đúng kết quả thời tiết, số khách, giờ đến; chơi lại với cùng chuỗi thao tác sẽ ra đúng chuỗi khách. Nếu người chơi thao tác khác, các đơn về sau có thể khác vì bước ưu tiên khả thi (§8.4 bước 3) đọc tình trạng kho hiện tại. Điều này chấp nhận được.

---

## 7. Data model — `src/domain/models.ts`

```ts
export type CabinClass = 'ECONOMY' | 'BUSINESS';
export type SeatPref = 'WINDOW' | 'AISLE' | 'ANY';
export type TimePref = 'NIGHT' | 'LATE' | 'ANY';
export type Extra = 'VEG_MEAL' | 'WHEELCHAIR' | 'INSURANCE';
export type Mood = 'HAPPY' | 'NEUTRAL' | 'IMPATIENT';
export type SeatId = `${number}${'A' | 'B' | 'C' | 'D'}`;   // '12A'
export type RouteId = string;                                // 'HAN-SGN'
export type UpgradeId = string;
export type SeatBias = 'WINDOW' | 'BALANCED' | 'AISLE';
export type BuildStep = 'FLIGHT' | 'SEAT' | 'EXTRAS' | 'REVIEW';
export type CounterState = 'EMPTY' | 'BUILDING' | 'PRINTING' | 'READY_TO_DELIVER' | 'RESOLVING';
export type DayPhase = 'PREP' | 'OPEN' | 'CLOSING' | 'SUMMARY' | 'SHOP';
export type Stars = 1 | 2 | 3 | 4 | 5;
export type WeatherOutcome = 'GOOD' | 'BAD' | 'SEVERE';

export type DayEvent =
  | { type: 'NONE' }
  | { type: 'RUSH' }
  | { type: 'WEATHER'; routeId: RouteId; outcome: WeatherOutcome | null };  // null = chưa chốt

export interface Route {
  id: RouteId;
  name: string;
  cost: Record<CabinClass, number>;
  price: Record<CabinClass, number>;
  weight: number;
  unlock: { cost: number; minTravelViet?: number } | null;   // null = có sẵn
  color: number;
  icon: string;
}

export interface Flight {
  id: string;            // 'QV101'
  routeId: RouteId;
  departAt: number;      // phút game tính từ 00:00 của ngày; 00:30 hôm sau = 1470
  status: 'SCHEDULED' | 'CANCELLED';
  takenByOthers: SeatId[];
}

export interface OwnedSeat {
  flightId: string;
  seat: SeatId;
  cabin: CabinClass;
  unitCost: number;
  state: 'AVAILABLE' | 'HELD' | 'SOLD' | 'EXPIRED' | 'LOST';
}

export interface Passport {
  name: string;          // tên trên hộ chiếu
  bookedName: string;    // tên khách đọc khi đặt vé
  expiresDay: number;    // ≥ 1
}

export interface Order {
  customerId: string;
  spriteId: string;
  routeId: RouteId;
  cabin: CabinClass;
  baggageKg: 0 | 15 | 20 | 30;
  seatPref: SeatPref;
  timePref: TimePref;
  extras: Extra[];
  passport: Passport;
  complexity: number;
  patienceMaxMs: number;
  scriptedId?: string;   // có nếu là khách cá nhân hoá
}

export interface Customer {
  order: Order;
  patienceLeftMs: number;
  mood: Mood;
  position: 'QUEUE' | 'COUNTER';
}

export interface TicketDraft {
  step: BuildStep;
  flightId: string | null;
  cabin: CabinClass | null;
  seat: SeatId | null;
  baggageKg: number;
  extras: Extra[];
}

export type ScoreOutcome =
  | 'PERFECT' | 'GOOD' | 'OK' | 'POOR' | 'FAILED'
  | 'SOLD_INVALID' | 'REFUSED_CORRECT' | 'REFUSED_NO_STOCK' | 'REFUSED_WRONG' | 'LEFT';

export interface ScoreResult {
  customerId: string;
  outcome: ScoreOutcome;
  stars: Stars;
  revenue: number;
  tip: number;
  penalty: number;
  mistakes: string[];    // mã lỗi, để UI hiện "Sai hành lý", "Thiếu suất chay"...
}

export type TxType =
  | 'SEAT_PURCHASE' | 'TICKET_REVENUE' | 'TIP' | 'PENALTY'
  | 'REFUND_EXPIRED' | 'SUPPORT_GIFT' | 'WEATHER_LOSS'
  | 'UPGRADE_PURCHASE' | 'ROUTE_UNLOCK';

export interface Transaction {
  type: TxType;
  amount: number;        // có dấu: âm là chi, dương là thu; SUPPORT_GIFT, WEATHER_LOSS = 0
  day: number;
  minute: number | null;
  ref?: string;
}

export interface DaySummary {
  day: number;
  moneyStart: number;
  moneyEnd: number;
  ticketRevenue: number;
  tips: number;
  seatCost: number;
  shopCost: number;
  expiredSeats: number;
  expiredCost: number;
  refunds: number;
  weatherLostSeats: number;
  weatherLostCost: number;
  penalties: number;
  served: number;
  left: number;
  turnedAway: number;
  avgStars: number;
  travelVietAfter: number | null;   // null trước ngày 11
}

export interface Settings {
  musicVolume: number;   // 0..1
  sfxVolume: number;
  haptics: boolean;
}

export interface Profile {
  playerName: string;    // 1–16 ký tự
  brandName: string;     // 1–20 ký tự
}

export interface GameState {
  version: number;
  seed: number;
  day: number;
  phase: DayPhase;
  money: number;
  profile: Profile | null;                    // null = chưa onboarding
  starHistory: Stars[];                       // tối đa 30 phần tử, mới nhất ở cuối
  unlockedRoutes: RouteId[];
  routeUnlockedDay: Record<RouteId, number>;  // cho trọng số × 2 ở §8.2
  upgrades: UpgradeId[];
  settings: Settings;
  flags: Record<string, boolean>;             // tutorialDone_1, travelVietIntro, ...
  today: {
    moneyStart: number;
    event: DayEvent;
    flights: Flight[];
    seats: OwnedSeat[];
    pendingPurchase: Record<string, number>;  // key `${flightId}:${cabin}`
    seatBias: SeatBias;
    purchaseCount: number;                    // số lần xác nhận mua, để derive stream `purchase:{n}`
    transactions: Transaction[];
    targetCustomers: number;
    arrivals: number[];                       // phút game khách đến, đã sort
    nextArrivalIndex: number;
    clock: number;                            // phút game
    queue: Customer[];                        // phần tử 0 là khách ở quầy nếu position=COUNTER
    counter: { state: CounterState; draft: TicketDraft | null; printLeftMs: number; resolveLeftMs: number };
    results: ScoreResult[];
    turnedAway: number;
  };
  nextDayTransactions: Transaction[];         // chi tiêu ở SHOP, chuyển sang today.transactions khi NEXT_DAY
  lastSummary: DaySummary | null;
}
```

Ghi chú:
- `HELD`: ghế đang được chọn trong draft. Khi reset/huỷ/khách bỏ đi, `HELD → AVAILABLE`. Khi giao vé, `HELD → SOLD`.
- Khi vào SUMMARY: `AVAILABLE → EXPIRED`.
- Thời tiết BAD/SEVERE: `AVAILABLE → LOST` (chốt lúc mở cửa nên không có ghế HELD).

---

## 8. Sinh đơn hàng và RNG

### 8.1 RNG — `src/domain/rng.ts`

- Thuật toán mulberry32. API: `next(): number` trong [0,1), `int(min, max)` (bao gồm hai đầu), `chance(p)`, `pick(arr)`, `weighted(items)`, `shuffle(arr)` (Fisher–Yates, trả mảng mới).
- Seed theo ngữ cảnh để các hệ thống không ảnh hưởng nhau:

```ts
export const deriveSeed = (base: number, day: number, stream: string): number
// hash FNV-1a của `${base}:${day}:${stream}`
```

| Stream | Dùng cho |
|---|---|
| `schedule` | ghế của đại lý khác |
| `purchase:{n}` | chọn ghế cụ thể ở lần xác nhận mua thứ `n` trong ngày |
| `event` | sự kiện ngày, tuyến bị dự báo xấu |
| `weather` | chốt kết quả thời tiết, chọn ghế bị mất |
| `demand` | số khách gốc (§3.9, dùng `day` của từng bước cộng dồn), bonus TravelViet |
| `routes` | ShuffleBag chọn tuyến |
| `orders` | sinh đơn |
| `spawn` | giờ khách đến |
| `names` | họ tên, thoại |

Không lưu trạng thái RNG vào save: mọi stream được tạo lại từ `seed`, `day` và bộ đếm có trong state.

### 8.2 ShuffleBag — `src/domain/shuffleBag.ts`

- Bỏ `weight` bản sao mỗi phần tử vào túi, shuffle, rút lần lượt, hết thì nạp lại và shuffle lại.
- Dùng cho chọn tuyến của đơn. Túi được tạo lúc mở cửa từ stream `routes`.
- Tuyến mở khoá trong 2 ngày gần nhất (`day − routeUnlockedDay ≤ 2`) được nhân đôi trọng số.

### 8.3 Lịch khách đến — `spawner.ts`

- Lúc mở cửa, sinh sẵn `targetCustomers` (§3.9) mốc giờ đến trong khoảng 08:06 – 18:30 (phút 486 – 1110), stream `spawn`.
- Mật độ theo giờ: bình thường trọng số 1; cao điểm 11:00–13:00 và 16:30–18:00 trọng số 1.5. Lấy mẫu theo trọng số, sort tăng dần.
- Khách đầu tiên luôn đến lúc 08:06 (3000 ms thật sau khi mở cửa).
- Mỗi tick, sinh mọi khách có mốc ≤ `clock`. Hàng đầy thì khách đó thành "bỏ về vì đông".

### 8.4 Sinh đơn — `orderGen.ts`

```ts
generateOrder(ctx: {
  rng: Rng;
  day: number;
  cfg: DayConfig;
  flights: Flight[];
  seats: OwnedSeat[];
  unlockedRoutes: RouteId[];
  routeBag: ShuffleBag<RouteId>;
  modifiers: Modifiers;
  scripted?: Partial<Order>;
}): Order
```

Thuật toán:

1. Nếu có `scripted`: dùng các trường đã định, các trường còn thiếu sinh bình thường. Bỏ qua ràng buộc khả thi (khách cá nhân hoá luôn phải phục vụ được — §16: tự động cấp ghế nếu thiếu).
2. Chọn tuyến: rút từ `routeBag`.
3. Ưu tiên khả thi: nếu người chơi còn ít nhất một ghế AVAILABLE ở bất kỳ tuyến nào:
   - Ngày 1–2: nếu tuyến vừa rút không còn ghế AVAILABLE, rút lại cho đến khi gặp tuyến còn ghế (tối đa bằng số phần tử trong túi).
   - Từ ngày 3: với xác suất 0.85 làm như trên (tối đa 3 lần rút lại); 0.15 còn lại giữ nguyên tuyến dù không có ghế, tạo tình huống phải từ chối.
4. `complexity = 0`. Xét các thuộc tính theo thứ tự cố định sau, mỗi thuộc tính chỉ được thêm nếu cơ chế đã mở, `rng.chance(p)` đúng, và `complexity < cfg.maxComplexity`; thêm thì `complexity += 1`:
   1. `cabin = BUSINESS` (`pBusiness`)
   2. `baggageKg` ∈ {15, 20, 30} với trọng số {3, 4, 2} (`pBaggage`)
   3. `seatPref` ∈ {WINDOW, AISLE} (`pSeatPref`)
   4. `timePref` ∈ {NIGHT, LATE} (`pTimePref`; chỉ chọn khung có chuyến không bị huỷ)
   5. `extras`: lặp tối đa 2 lần, mỗi lần `chance(pExtra)`, chọn extra chưa có, áp ràng buộc §3.4
5. Hộ chiếu: sinh họ tên từ stream `names`. Với xác suất `pBadPassport`, làm hỏng: 50% hết hạn (`expiresDay = max(1, day − int(1, 30))`, và nếu `day = 1` thì chuyển sang lỗi tên), 50% sai tên (đổi tên đệm hoặc tên thành một giá trị khác trong danh sách). Hộ chiếu hỏng không tính vào complexity. Hộ chiếu hợp lệ có `expiresDay = day + int(0, 400)` (có thể bằng `day`, để test biên).
6. `patienceMaxMs` theo §5.4.

Invariant (test chạy 2.000 seed × 30 ngày):
- Không bao giờ có tuyến chưa mở khoá.
- Không bao giờ có trường của cơ chế chưa mở.
- `complexity ≤ cfg.maxComplexity`.
- Không có tổ hợp vi phạm ràng buộc §3.4.
- `expiresDay ≥ 1`.
- Ngày 1–2: nếu người chơi còn ít nhất một ghế AVAILABLE thì đơn luôn hỏi một tuyến còn ghế AVAILABLE.

### 8.5 Kiểm tra "phục vụ được" — `canServe.ts`

```ts
canServe(order, flights, seats): boolean
```

Đúng khi tồn tại một chuyến của `order.routeId`, trạng thái SCHEDULED, thuộc `timePref`, và có ít nhất một ghế AVAILABLE ở `order.cabin`. Không yêu cầu đúng `seatPref` (đó là lỗi nhẹ, không phải lý do từ chối).

---

## 9. Hệ thống lưu game

### 9.1 Key trong localStorage

| Key | Nội dung |
|---|---|
| `qvn:save` | save chính (JSON) |
| `qvn:save:prev` | bản save trước lần ghi gần nhất (backup) |
| `qvn:lock` | khoá tab (§9.5) |

### 9.2 Schema và version

- `SAVE_VERSION = 1` ở bản đầu. Save gồm `GameState` đầy đủ + `savedAt` (chỉ để hiển thị, không dùng cho logic).
- `save/schema.ts` khai báo zod schema cho từng version (`SaveV1`, sau này `SaveV2`...).
- `migrate(raw: unknown): GameState` đọc `version`, chạy lần lượt các bước `v1→v2→...`, validate ở version cuối. Save có `version` lớn hơn `SAVE_VERSION` của bản đang chạy thì trả lỗi `SAVE_FROM_FUTURE`.

### 9.3 Đọc save

```
đọc qvn:save
  ├─ không có ──► game mới
  ├─ parse lỗi hoặc validate lỗi ──► thử qvn:save:prev
  │       ├─ OK ──► dùng, hiện toast "Đã khôi phục bản lưu trước đó"
  │       └─ lỗi ──► hộp thoại: "Bản lưu bị hỏng. Bắt đầu lại?" (không tự xoá save hỏng; đổi tên thành qvn:save:corrupt:{timestamp})
  ├─ SAVE_FROM_FUTURE ──► hộp thoại "Hãy tải lại trang để cập nhật game", không ghi đè
  └─ OK ──► clamp: money = max(0, int), day ≥ 1, starHistory chỉ giữ giá trị 1–5; NaN → giá trị mặc định
```

### 9.4 Ghi save

- Ghi `qvn:save:prev` = giá trị hiện tại của `qvn:save`, rồi ghi `qvn:save` mới.
- Bọc `try/catch` cho `QuotaExceededError` và `SecurityError` (localStorage bị chặn). Khi lỗi: đặt cờ `storageUnavailable`, hiện banner cố định nhỏ "Tiến trình sẽ không được lưu trên trình duyệt này", game vẫn chạy.
- Kiểm tra localStorage khả dụng lúc boot bằng cách ghi/đọc/xoá một key thử.

### 9.5 Chống mở hai tab

- Dùng `BroadcastChannel('qvn')`. Khi tab khởi động, gửi `HELLO`; tab đang chạy trả lời `ALIVE`. Nếu nhận `ALIVE` trong 300 ms: tab mới hiện màn "Game đang mở ở tab khác" với nút "Chơi ở đây" (bấm thì gửi `TAKEOVER`, tab cũ chuyển sang màn "Game đã mở ở tab khác" và ngừng ghi save).
- Fallback khi không có BroadcastChannel: bỏ qua cơ chế khoá (chấp nhận rủi ro), ghi vào DECISIONS.md.

### 9.6 Xuất / nhập save

- Trong Settings: "Xuất mã lưu" hiện một chuỗi (JSON → UTF-8 → base64url, kèm tiền tố `QVN1.` và 4 ký tự checksum FNV-1a) có nút sao chép. "Nhập mã lưu" nhận chuỗi, kiểm checksum, migrate, validate, hỏi xác nhận "Thay thế tiến trình hiện tại?", backup save cũ vào `qvn:save:prev` trước khi thay.
- Mã sai: báo "Mã lưu không hợp lệ", không đụng save hiện tại.

### 9.7 Persistent storage

Lúc boot, nếu `navigator.storage?.persist` tồn tại thì gọi (không chặn luồng, bỏ qua kết quả lỗi). Ghi kết quả vào debug log.

---

## 10. Scenes và UI

### 10.1 Khung hình

- Kích thước thiết kế: 720 × 1280. `Phaser.Scale.FIT`, `CENTER_BOTH`. Nền ngoài khung game (letterbox) cùng màu nền trời.
- Safe area: không đặt phần tử tương tác trong 60 px trên cùng và 50 px dưới cùng của khung thiết kế.
- Vùng chạm tối thiểu 88 × 88 px (khung thiết kế).
- Font: Nunito (hoặc Baloo 2, xem §15 D2), tự host trong `public/assets/fonts` để chạy offline, có đủ glyph tiếng Việt. PreloadScene phải đợi `document.fonts.load` xong mới chuyển scene.
- Màu (`ui/theme.ts`):

```ts
export const COLORS = {
  sky: 0xbfe3f5, cloud: 0xffffff, primary: 0x4a90d9, primaryDark: 0x2f6fb3,
  accent: 0xffb86b, success: 0x7bc47f, danger: 0xf28b82, warning: 0xffd86b,
  text: 0x2f3b52, textMuted: 0x7a869a, disabled: 0xc9d3de, seatOther: 0xd9dee5,
} as const;
```

### 10.2 BootScene và PreloadScene

- Boot: đọc save, kiểm tra tab lock, kiểm tra localStorage, gọi persist, đăng ký visibility handler, rồi sang Preload.
- Preload: thanh tiến trình, load atlas/audio/font. Lỗi load một asset: hiện nút "Thử lại" (reload trang), không để màn trắng.

### 10.3 TitleScene

- Logo "Quầy Vé Nhỏ", máy bay nhỏ bay ngang trên nền trời đêm có mây trôi.
- Nút "Chơi tiếp" (chỉ khi có save, kèm dòng "{brandName} · Ngày {n} · {money} xu"), "Chơi mới", "Cài đặt".
- "Chơi mới" khi đã có save: hộp thoại xác nhận, backup save cũ vào `qvn:save:prev`, sang Onboarding.
- Chạm lần đầu ở màn này dùng để unlock audio (§11.3).

### 10.4 OnboardingScene

- Popup thoại của Béo kể cốt truyện §2.1 (chạm để tiếp).
- Hai `TextInput`: tên người chơi, tên thương hiệu; kiểm tra độ dài §2.2, nút "Tiếp" disable khi không hợp lệ.
- Bàn phím ảo không được che ô nhập (cuộn ô nhập lên trên khi focus).
- Xong: `PROFILE_SET` → PrepScene ngày 1 kèm tutorial.

### 10.5 PrepScene (Kho)

Bố cục theo trục dọc (toạ độ y trong khung 720×1280):

| Vùng | y | Nội dung |
|---|---|---|
| Top bar | 60–150 | Tên thương hiệu, "Ngày {n}", tiền, TravelViet (từ ngày 11), nút ⚙ |
| Banner sự kiện | 150–230 | Chỉ khi có RUSH hoặc dự báo thời tiết; nền vàng nhạt |
| Danh sách chuyến | 230–1060 | Cuộn dọc, nhóm theo tuyến. Mỗi chuyến 1 card cao 150: mã, giờ, giá vốn ECO/BIZ, stepper ECO, stepper BIZ, số ghế đã sở hữu. Tuyến bị dự báo xấu có icon mây giông |
| Thanh tổng | 1060–1140 | "Dự tính: −{x} xu" (đã tính chiết khấu), tiền còn lại sau khi mua |
| Nút | 1140–1230 | "Xác nhận nhập ghế" (primary), "Mở cửa" (success) |

- Stepper `+` disable khi đạt giới hạn (12 ECO / 4 BIZ trừ số đã sở hữu, trừ ghế đại lý khác) hoặc khi tiền không đủ cho thêm một ghế.
- Nhãn chiết khấu "−5%" / "−10%" hiện cạnh stepper khi đạt ngưỡng.
- Có nâng cấp `AIRLINE_RELATIONS`: thêm segmented control "Cửa sổ / Cân bằng / Lối đi" ở đầu danh sách.
- "Mở cửa" khi chưa có ghế nào: hộp thoại "Kho trống, khách sẽ không mua được vé. Vẫn mở cửa?".
- "Mở cửa" khi còn pending chưa xác nhận: hộp thoại "Bạn chưa xác nhận nhập {n} ghế. Nhập luôn?" với 3 lựa chọn (Nhập và mở cửa / Bỏ và mở cửa / Huỷ).
- Cuộn danh sách bằng kéo dọc; phân biệt kéo và chạm (ngưỡng 10 px) để không bấm nhầm stepper khi cuộn.

### 10.6 CounterScene (Quầy)

| Vùng | y | Nội dung |
|---|---|---|
| Top bar | 60–140 | Đồng hồ (HH:MM), tiền, TravelViet (từ ngày 11), nút ⏸ |
| Biển quầy | 140–220 | Tên thương hiệu; badge RUSH hoặc kết quả thời tiết nếu có |
| Khu khách | 220–600 | Hàng đợi bên phải (nhân vật nhỏ dần), khách ở quầy ở giữa, bong bóng yêu cầu phía trên đầu, thanh kiên nhẫn dưới chân |
| Mặt quầy | 600–660 | Hình mặt bàn; vùng thả vé (drop zone) là toàn bộ khu khách |
| Stepper bước | 660–730 | 4 chấm A-B-C-D có nhãn "Chuyến · Ghế · Hành lý · Vé" |
| Vùng thao tác | 730–1130 | Nội dung của bước hiện tại |
| Hàng nút | 1130–1230 | "Làm lại", "Từ chối", "Hộ chiếu" (từ ngày 6), nút chính theo bước ("Tiếp" / "In vé") |

Chi tiết từng bước:

- Bước A: `FlightList` cuộn dọc, mỗi dòng cao 110: màu tuyến, tên điểm đến, mã chuyến, giờ bay, hai nút hạng kèm số ghế còn (`ECO 3`, `BIZ 1`). Dòng xám nếu hết ghế hoặc bị huỷ do thời tiết. Có `SEARCH_FILTER`: thêm hàng chip điểm đến ở đầu.
- Bước B: `SeatMapView` của khoang đã chọn. ECONOMY 10 hàng × 4 ghế, BUSINESS 2 hàng × 4 ghế (ghế to hơn). Ghế sở hữu chưa bán: màu primary. Ghế đã bán cho khách trước: primary nhạt có dấu ✓. Ghế đại lý khác: `seatOther`. Ghế đang chọn: accent, nảy nhẹ. Icon cửa sổ nhỏ cạnh cột A và D.
- Bước C: `BaggageSlider` ngang, rộng 560, vạch 15/20/30 có nhãn, hình vali to dần theo kg; `ExtrasToggles` 3 nút dạng icon + nhãn.
- Bước D: `TicketView` dạng boarding pass: tên khách, tuyến, mã chuyến, giờ, hạng, ghế, hành lý, dịch vụ, tên thương hiệu. Không đánh dấu đúng/sai (người chơi tự đối chiếu).
- In vé: `TicketView` trượt ra từ khe máy in theo thời gian in; xong thì có hiệu ứng lấp lánh và gợi ý "Kéo vé cho khách".
- Kết quả: bong bóng thoại của khách + popup số tiền bay lên (`+{revenue}`, `+{tip} tip`), sao hiện từng ngôi (1–5). Sai thì rung màn hình 150 ms, chớp đỏ nhẹ, danh sách lỗi ngắn ("Sai hành lý", "Thiếu suất chay") hiện 2 giây.
- Khi không có khách: khu khách hiện câu "Đang chờ khách..." và có thể xem trước danh sách chuyến (Bước A chỉ đọc).

### 10.7 PassportCard (overlay)

- Card giữa màn: ảnh (sprite khách), họ tên, "Hết hạn: Ngày {n}", và phía dưới "Tên đặt vé: {bookedName}" để đối chiếu. "Hôm nay: Ngày {day}" ở góc card.
- Đóng bằng chạm ra ngoài hoặc nút ✕. Mở card không pause kiên nhẫn.

### 10.8 SummaryScene

- Tiêu đề "{brandName} — Ngày {n}". Hiện lần lượt từng dòng tổng kết (§5.6) với hiệu ứng đếm số, tổng cộng khoảng 3 giây, chạm để bỏ qua hiệu ứng.
- Lợi nhuận âm: Béo đưa một mẹo ngẫu nhiên (ví dụ "Thử nhập ít ghế hơn cho chuyến khuya").
- Cuối ngày 10: màn giới thiệu TravelViet (tutorial) trước khi sang Shop.
- Nút "Tiếp tục" → ShopScene. Nút bị khoá cho đến khi save ghi xong (thường tức thì).

### 10.9 ShopScene

- Hai tab: "Nâng cấp" và "Tuyến bay". Card: tên, mô tả hiệu ứng, giá, trạng thái (đã mua / chưa đủ tiền / chưa đủ điều kiện kèm điều kiện cụ thể).
- Mua: hộp thoại xác nhận nhỏ, trừ tiền, animation, lưu ngay.
- Nút "Ngày tiếp theo": khoá ngay sau lần bấm đầu tiên.

### 10.10 Overlays

- PauseOverlay: mở bằng nút ⏸, nút Back Android, hoặc tự động khi tab ẩn. Nội dung: Tiếp tục, Cài đặt, Về màn hình chính (hộp thoại: "Tiến trình ngày hôm nay sẽ chơi lại từ đầu ngày").
- SettingsOverlay: âm nhạc, hiệu ứng (slider), rung (toggle), Xuất mã lưu, Nhập mã lưu, phiên bản game.
- TutorialOverlay: làm mờ màn, khoét lỗ highlight phần tử cần bấm, popup thoại của Béo, chỉ cho phép bấm phần tử đó. Mỗi bước tutorial tiến khi domain phát event tương ứng. Xong thì `FLAG_SET tutorialDone_{id}`.
- RotateOverlay: phủ toàn màn khi `innerWidth > innerHeight` trên thiết bị cảm ứng, tự pause.
- DialogOverlay: hộp thoại chung (tiêu đề, nội dung, 1–3 nút).

### 10.11 Tutorial

| Khi nào | Nội dung |
|---|---|
| Ngày 1 | Sau onboarding: Kho → mua 2 ghế HAN-DAD → Mở cửa → đọc đơn → chọn chuyến → chọn ghế → Tiếp → Tiếp → In vé → kéo vé. Khách đầu tiên ngày 1 là khách tutorial, kiên nhẫn vô hạn (domain xử lý qua `flags`) |
| Ngày 2 | Thanh hành lý và vạch |
| Ngày 3 | Ưu tiên ghế, icon cửa sổ |
| Ngày 4 | Hạng thương gia, khách khó tính, tip |
| Ngày 5 | Khung giờ Tối/Khuya, dịch vụ |
| Ngày 6 | Hộ chiếu, luật hết hạn, nút Từ chối |
| Cuối ngày 10 | TravelViet: sao ảnh hưởng lượng khách thế nào |
| Lần đầu có RUSH | Cao điểm lễ hội |
| Lần đầu có dự báo thời tiết | Rủi ro mất ghế, ba kết quả có thể xảy ra |

---

## 11. Input, mobile, audio

### 11.1 Input

- Canvas có `touch-action: none`. Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no`.
- Chỉ xử lý pointer đầu tiên cho thao tác kéo (lưu `pointerId`, bỏ qua pointer khác đến khi pointer đó up).
- Kéo ra ngoài canvas: đăng ký `pointerup` trên `window` để luôn kết thúc thao tác kéo.
- Nút: trạng thái nhấn (scale 0.95), disabled (màu `disabled`, không nhận input). Sau khi bấm một nút gây command, nút khoá cho đến khi scene nhận kết quả.
- Nút Back Android / vuốt back: `history.pushState` một entry khi vào game; bắt `popstate` để mở PauseOverlay và push lại entry.

### 11.2 Vòng đời trang

- `visibilitychange` → hidden: pause game (Phaser `scene.pause` các scene gameplay + `GameSession` ngừng nhận tick), tạm dừng nhạc. Visible: hiện PauseOverlay (không tự chạy tiếp).
- `pagehide`: không làm gì thêm (save đã ở các mốc an toàn).
- `GameSession.tick` clamp `deltaMs ≤ 100`.

### 11.3 Audio

- Nhạc nền: 1 bài lofi cho Kho/Shop, 1 bài nhịp nhanh hơn một chút cho Quầy, loop, crossfade 800 ms khi đổi scene.
- SFX tối thiểu: bấm nút, chọn ghế, kéo hành lý (tick khi qua vạch), in vé (máy in rè), giao vé thành công (ting + đồng xu), sai (bíp trầm), khách bỏ đi, sấm (thời tiết xấu), mua ghế (tiếng máy tính tiền), mở tuyến (fanfare ngắn).
- Unlock: audio context chỉ resume sau lần chạm đầu tiên (TitleScene). Trước đó không phát gì, không báo lỗi.
- Âm lượng lấy từ `settings`. Haptics: `navigator.vibrate(15)` khi sai và khi giao thành công, chỉ khi có API và setting bật.

### 11.4 Hiệu năng

- Mục tiêu 60 fps trên máy Android tầm trung, không bao giờ dưới 30 fps.
- Dùng texture atlas (một hoặc hai atlas), không load ảnh lẻ.
- Không tạo object mới mỗi frame trong `update()`. Pool cho particle đồng xu.
- Danh sách cuộn dài (Kho): chỉ render card trong viewport + 1 card đệm nếu số card > 15.

---

## 11A. Art direction và danh sách asset

- Phong cách: flat vector pastel, bo góc lớn, viền mảnh màu `text` với độ mờ 20%, bóng đổ mềm một hướng. Nhân vật dạng chibi đầu to. Tông sân bay về đêm cho màn Quầy.
- Giai đoạn grey box (Phase 2–4) dùng hình khối và chữ, không chờ asset.
- Nguồn: Kenney.nl (CC0) cho UI và icon, tự vẽ trên Figma/Inkscape xuất SVG → PNG @2x, gom atlas bằng Free Texture Packer. Mọi asset ngoài phải ghi nguồn và license trong `public/assets/CREDITS.md`.

Danh sách asset cần có:

| Nhóm | Asset |
|---|---|
| Nền | Bầu trời đêm + mây (3 lớp parallax nhẹ), sảnh sân bay (Quầy), phòng kho (Kho) |
| Quầy | Mặt quầy, biển tên thương hiệu (9-slice), máy in vé (2 frame) |
| Nhân vật | Béo (3 biểu cảm), 16 khách × 3 biểu cảm, bong bóng thoại 9-slice |
| Vé | Boarding pass (nền), tem "ĐÃ IN" |
| Sơ đồ ghế | Ghế ECO, ghế BIZ, các trạng thái màu (tint), icon cửa sổ |
| Hành lý | Vali 4 kích thước (0/15/20/30), thanh trượt, núm kéo |
| Icon | 9 tuyến, 3 dịch vụ, khung giờ (trăng/cú đêm), tiền, sao, mây giông, TravelViet, pause, settings, hộ chiếu |
| Hiệu ứng | Đồng xu, lấp lánh, dấu ✓, dấu ✕ |
| PWA | Icon 192, 512, maskable 512, apple-touch-icon 180, splash màu nền |

---

## 12. Các phase triển khai

Quy tắc: các phase dưới đây là mốc và acceptance. Thứ tự thực thi chi tiết (giai đoạn, bước nhỏ, Review, Registry common component) nằm ở `docs/ROADMAP.md`. Hết mỗi giai đoạn, cập nhật `docs/STATUS.md`, dừng lại và hỏi trước khi sang giai đoạn tiếp theo (xem CLAUDE.md).

### Phase 0 — Scaffold và deploy thử (mục tiêu: 1 ngày)

Task:
1. Khởi tạo Vite + TypeScript, cài Phaser 3 (pin version), Vitest, ESLint (typescript-eslint), Prettier, zod, vite-plugin-pwa, @vitejs/plugin-basic-ssl.
2. `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, path alias `@domain/*`, `@data/*`, `@ui/*`, `@scenes/*`, `@save/*`, `@platform/*`.
3. ESLint rule `no-restricted-imports`: trong `src/domain/**` cấm import `phaser`, `@scenes/*`, `@ui/*`, `@platform/*`, `@save/*`. Rule `no-restricted-globals` trong domain: cấm `window`, `document`, `localStorage`, `Date`. Rule `no-restricted-properties`: cấm `Math.random` trong domain.
4. Tạo toàn bộ cây thư mục §6.1 với file rỗng có export placeholder.
5. `BootScene` hiện chữ "Quầy Vé Nhỏ" giữa màn, nền `sky`, scale FIT 720×1280.
6. Script npm như CLAUDE.md. `dev:host` = `vite --host --mode https`, basicSsl bật khi mode `https`.
7. `git init`. GitHub Actions: trên push và PR chạy `npm ci`, `typecheck`, `lint`, `test`, `build`.
8. Hướng dẫn deploy Cloudflare Pages trong README (build command `npm run build`, output `dist`, Node version ghi rõ trong `.nvmrc`).
9. Tạo `docs/STATUS.md`, `docs/DECISIONS.md` (ghi version Phaser, lý do các rule ESLint).

Acceptance:
- [ ] `npm run dev` hiện màn "Quầy Vé Nhỏ", không lỗi console
- [ ] `npm run dev:host` mở được từ điện thoại cùng Wi-Fi qua HTTPS
- [ ] Thử import `phaser` trong `src/domain/x.ts` thì `npm run lint` báo lỗi
- [ ] CI xanh
- [ ] Deploy lên Cloudflare Pages, mở được link trên điện thoại

### Phase 1 — Domain core, không UI (mục tiêu: 4–5 ngày)

Task (mỗi module kèm test):
1. `rng.ts`, `shuffleBag.ts`: mulberry32, `deriveSeed` (FNV-1a), `ShuffleBag`. Test: cùng seed cùng chuỗi; `int` bao hai đầu; `weighted` hội tụ đúng tỉ lệ ±2% sau 100.000 lần; shuffle bag không lặp một phần tử quá `weight` lần trong một túi.
2. `models.ts`: toàn bộ type §7.
3. `data/*.ts`: điền đầy đủ bảng §4.1–4.6 (tên khách, thoại có thể tạm 1 câu mỗi loại).
4. `clock.ts`: `GameClock` (phút game từ ms thật, format HH:MM kể cả sau nửa đêm, khung NIGHT/LATE).
5. `seatMap.ts`: danh sách ghế theo hạng, `isWindow`, `isAisle`.
6. `schedule.ts`: sinh chuyến trong ngày theo tuyến đã mở, mã chuyến ổn định, ghế đại lý khác.
7. `inventory.ts`: tính giá (chiết khấu), mua (chọn ghế theo bias), hold/release/sell, hết hạn cuối ngày, mất do thời tiết.
8. `canServe.ts`: §8.5.
9. `demand.ts`: `baseCustomers`, TravelViet, `customersForDay` §3.9.
10. `economy.ts`: `roundMoney`, doanh thu vé, tip, transaction log, `summarizeDay`, clamp phạt.
11. `scoring.ts`: toàn bộ §5.5, trả `ScoreResult` với `mistakes`.
12. `orderGen.ts`, `spawner.ts`: §8.3–8.4.
13. `upgrades.ts`: từ danh sách nâng cấp → `Modifiers { patienceMult, tipMult, printMs, queueMax, refundRate, seatBias, searchFilter }`.
14. `events.ts`: chọn sự kiện ngày, chốt thời tiết.
15. `safetyNet.ts`: §3.10.
16. `dayCycle.ts` + `game.ts`: reducer cho mọi `Command`, `tick(deltaMs)`, state machine §6.5, phát `DomainEvent`.

Acceptance:
- [ ] Coverage `src/domain/**` ≥ 90% lines, 85% branches
- [ ] Test integration: script hoá một ngày hoàn chỉnh chỉ bằng `dispatch`/`tick` (mua ghế, mở cửa, phục vụ đúng 3 khách, sai 1, từ chối đúng 1, để 1 khách bỏ đi, đóng ngày) và khớp `DaySummary` mong đợi
- [ ] Invariant tiền `moneyStart + Σtx === moneyEnd` đúng trên 1.000 ngày mô phỏng ngẫu nhiên, kể cả ngày có chi Shop từ hôm trước
- [ ] Toàn bộ invariant §8.4 pass trên 2.000 seed × 30 ngày
- [ ] `customersForDay` không bao giờ vượt 300 trên 2.000 seed × 200 ngày
- [ ] Không file nào trong domain vi phạm rule ESLint

### Phase 2 — Grey box Quầy (mục tiêu: 4–5 ngày)

Task:
1. `ui/Button`, `Toast`, `DialogOverlay`, `DragController`, `ScrollList`, `TopBar`, `StepIndicator`, `theme.ts` bằng hình khối Phaser (Graphics + Text).
2. `CounterScene` với bố cục §10.6, dùng hình chữ nhật và chữ thay cho sprite.
3. `SpeechBubble` hiện đơn bằng chữ + emoji tạm.
4. `PatienceBar`, mood đổi màu.
5. `FlightList`, `SeatMapView`, `BaggageSlider` (kéo, snap, clamp), `ExtrasToggles`, `TicketView`.
6. Stepper 4 bước, nút Làm lại / Từ chối / In vé, kéo thả vé vào drop zone.
7. Nối với `GameSession` qua dispatch/tick. Tạm khởi tạo ngày với profile và lô ghế cố định (bỏ qua Onboarding và Kho).
8. `platform/visibility.ts` + PauseOverlay tối giản.
9. Chạy hết một ngày → hiện tổng kết dạng text thô.

Acceptance:
- [ ] Chơi hết một ngày 1 trên điện thoại thật, không kẹt, không lỗi console
- [ ] Double-tap nhanh mọi nút không gây double command (kiểm tra bằng log domain events)
- [ ] Chuyển app 30 giây rồi quay lại: game đang pause, kiên nhẫn không giảm
- [ ] Kéo vé thả ra ngoài: vé quay về; kéo thanh hành lý ra ngoài canvas rồi thả: thao tác kết thúc đúng

### Phase 3 — Onboarding, Kho, Tổng kết, Lưu game (mục tiêu: 4–5 ngày)

Task:
1. `TitleScene` với Chơi tiếp / Chơi mới.
2. `OnboardingScene` §10.4 (grey box, thoại tạm), `TextInput`.
3. `PrepScene` §10.5 đầy đủ (grey box), `Stepper`, banner sự kiện.
4. `SummaryScene` §10.8.
5. `save/storage.ts`, `schema.ts`, `migrate.ts` (v1, kèm một migration giả v0→v1 để có sẵn khung và test), luồng đọc §9.3, ghi §9.4.
6. `tabLock.ts` §9.5.
7. Mốc lưu §6.6.

Acceptance:
- [ ] Chơi mới: nhập tên và thương hiệu, tên thương hiệu hiện ở Kho, Quầy, Tổng kết
- [ ] Chơi 3 ngày liên tiếp, tắt hẳn trình duyệt, mở lại: đúng ngày, tiền, kho, sao, thương hiệu
- [ ] Refresh giữa ca: quay về PREP của ngày đó, lô ghế đã mua còn nguyên; mở cửa lại ra đúng thời tiết, số khách; lặp lại đúng chuỗi thao tác cũ thì 5 đơn đầu giống hệt
- [ ] Refresh ở Tổng kết / Shop: "Chơi tiếp" mở đúng màn đó
- [ ] Sửa tay `qvn:save` thành JSON hỏng: game khôi phục từ `prev` và hiện toast
- [ ] Sửa `money` thành `-999` hoặc `"abc"`: game load với giá trị đã clamp
- [ ] Mở tab thứ hai: hiện màn "Game đang mở ở tab khác"
- [ ] Chạy trong tab ẩn danh Safari: game chơi được, có banner không lưu được (nếu localStorage lỗi)

### Phase 4 — Tiến trình đầy đủ (mục tiêu: 5 ngày)

Task:
1. `ShopScene` §10.9: nâng cấp và mở tuyến, điều kiện TravelViet.
2. Bật các cơ chế theo ngày §4.5: khung giờ, dịch vụ, hộ chiếu (`PassportCard`), khách BUSINESS khó tính.
3. Sự kiện §4.4: RUSH, dự báo và kết quả thời tiết.
4. TravelViet §3.9: hiển thị, ảnh hưởng lượng khách, mở khoá cuối ngày 10.
5. Lưới an toàn §3.10 với hộp thoại.
6. `SettingsOverlay` bản đầu.
7. `scripts/sim.ts` và lệnh `npm run sim` §13.3.
8. Chạy sim, báo cáo kết quả so với khoảng mục tiêu, đề xuất chỉnh số (không tự sửa bảng cân bằng mà không hỏi).

Acceptance:
- [ ] Chơi grey box từ ngày 1 đến ngày 12 không kẹt
- [ ] Mỗi cơ chế chỉ xuất hiện từ đúng ngày của nó
- [ ] Ép tình huống hết tiền (sửa save): lưới an toàn kích hoạt, chơi tiếp được
- [ ] Ép thời tiết SEVERE (debug): mọi ghế tuyến đó mất, khách tuyến đó phải từ chối và được chấm `REFUSED_NO_STOCK`
- [ ] Output `npm run sim` nằm trong khoảng mục tiêu §13.3, hoặc đã được chủ dự án duyệt con số mới

### Phase 5 — Art, audio, juice, tutorial, cốt truyện (mục tiêu: 5–7 ngày)

Task:
1. Chốt phong cách với chủ dự án (§15), làm style guide nhỏ trong `docs/STYLE.md`.
2. Thay grey box bằng asset theo §11A, gom atlas.
3. Tween cho mọi phản hồi: nút nhấn, ghế chọn, vé trượt ra, đồng xu bay, sao hiện, rung màn khi sai, khách đi vào/đi ra.
4. Audio §11.3, `platform/audio.ts` với unlock.
5. `TutorialOverlay` và nội dung §10.11.
6. Thoại Béo (cốt truyện §2.1, tutorial, thông báo) và thoại khách đầy đủ §4.6. Chủ dự án duyệt văn trước khi chốt (§15 D11).

Acceptance:
- [ ] Không còn hình khối placeholder ở màn chính
- [ ] Âm thanh chạy trên Safari iOS sau lần chạm đầu
- [ ] Người chưa từng chơi hoàn thành onboarding và tutorial ngày 1 không cần hỏi (thử với 1 người thật nếu được)
- [ ] 60 fps ổn định trên máy test Android, kiểm bằng Performance qua `chrome://inspect`

### Phase 6 — Mobile hardening, PWA, deploy (mục tiêu: 3–4 ngày)

Task:
1. `vite-plugin-pwa`: manifest (tên, màu nền `#BFE3F5`, `display: standalone`, `orientation: portrait`, icon), `registerType: 'prompt'`, precache toàn bộ asset.
2. `platform/pwa.ts`: khi có SW mới, toast "Có bản mới — Tải lại?" (chỉ hiện ở Title/Summary/Shop, không làm gián đoạn giữa ca).
3. RotateOverlay, safe area, nút Back Android §11.1, bàn phím ảo ở Onboarding.
4. Xuất/nhập save §9.6, persist §9.7.
5. Đi hết checklist §14 và `tests/e2e-manual.md` trên ít nhất 1 iPhone (Safari + PWA) và 1 Android (Chrome + PWA).
6. Deploy production.

Acceptance:
- [ ] Lighthouse PWA: installable
- [ ] Cài PWA, tắt mạng, mở lại: chơi được
- [ ] Deploy bản mới: người chơi đang mở bản cũ thấy lời nhắc tải lại, save vẫn dùng được
- [ ] Toàn bộ mục §14 đã tick hoặc ghi rõ lý do bỏ qua trong STATUS.md

### Phase 7 — Ngày đặc biệt và cá nhân hoá (mục tiêu: 2–3 ngày)

Task:
1. `data/personal.ts` §16, cơ chế scripted customer, scripted moment.
2. Kiểm tra lại toàn bộ luồng với dữ liệu cá nhân thật (chủ dự án điền danh sách ngày đặc biệt).

Acceptance:
- [ ] Khách đặc biệt xuất hiện đúng ngày, đúng lượt, luôn phục vụ được
- [ ] Ngày đặc biệt không có sự kiện ngẫu nhiên
- [ ] Thiếu dữ liệu cá nhân (để trống) thì game vẫn chạy với nội dung mặc định

### Phase 8 (tuỳ chọn) — Cloud save

Chỉ làm nếu §15 D1 quyết định cần. Supabase: bảng `saves(user_id uuid pk, data jsonb, version int, updated_at timestamptz)`, RLS theo `auth.uid()`, đăng nhập bằng magic link. Offline-first: local luôn là nguồn chính, sync lên khi có mạng, xung đột thì chọn bản có `day` lớn hơn, bằng nhau thì hỏi người chơi.

---

## 13. Kế hoạch test

### 13.1 Unit test (Vitest, bắt buộc)

| Module | Test tối thiểu |
|---|---|
| rng, shuffleBag | tái lập theo seed; biên `int`; tỉ lệ `weighted`; `deriveSeed` khác stream cho seed khác; ShuffleBag phân bố |
| clock | 08:00 = 480; 19:00 = 1140; format 00:30 cho 1470; khung NIGHT/LATE ở biên 23:30/00:30 |
| seatMap | window/aisle đúng cột |
| schedule | đúng số chuyến theo ngày (3, rồi 5 cho tuyến trọng số 3 từ ngày 9); mã ổn định qua nhiều lần gọi; ghế đại lý khác trong khoảng 40–70% |
| inventory | chiết khấu ở qty 4/5/9/10; không mua vượt giới hạn; không mua khi thiếu tiền; bias WINDOW cho tỉ lệ cửa sổ cao hơn; hết hạn khi vào SUMMARY; thời tiết BAD mất `round(n/3)`, SEVERE mất hết, không hoàn tiền |
| canServe | chuyến bị huỷ; hết ghế đúng hạng; sai khung giờ |
| demand | base ngày 1 = 5; tăng 1–3/ngày đến ngày 10, 1–2/ngày sau đó; bảng factor ở biên 2.9/3.0/3.5/3.6/4.4/4.5; bonus đúng tầng; RUSH × 1.4; không vượt 300; trước ngày 11 không áp TravelViet |
| economy | doanh thu theo §5.3; POOR không thu tiền; tip chỉ BUSINESS PERFECT; tiền luôn nguyên; phạt clamp theo tiền; `summarizeDay` khớp invariant kể cả chi Shop |
| scoring | mỗi `ScoreOutcome` có ít nhất một test; sao 1–5 đúng bảng; hành lý lệch 1 kg vẫn đúng, lệch 2 kg sai; BUSINESS trừ gấp đôi; hộ chiếu hết hạn đúng hôm nay là hợp lệ; thừa dịch vụ trừ 0.05 |
| orderGen | invariant §8.4 trên 2.000 seed × 30 ngày; scripted ghi đè đúng trường; tuyến mới mở trọng số × 2 |
| spawner | đúng `targetCustomers` mốc; mọi mốc trong [486, 1110]; khách đầu tiên 486; giờ cao điểm dày hơn (thống kê) |
| upgrades | nhân cộng dồn; mỗi nâng cấp mua 1 lần; điều kiện ngày/TravelViet |
| events | tối đa 1/ngày; tỉ lệ RUSH/WEATHER/NONE hội tụ; thời tiết GOOD/BAD/SEVERE hội tụ 40/40/20; ngày đặc biệt không có sự kiện |
| safetyNet | kích hoạt khi tiền dưới ngưỡng; không kích hoạt khi đủ tiền |
| dayCycle/game | mọi command bị reject đúng phase; NEXT_DAY hai lần chỉ sang 1 ngày; DELIVER khi chưa in bị reject; giao vé và hết kiên nhẫn cùng tick → giao vé thắng; tick với delta 5000 bị clamp; PROFILE_SET validate độ dài |
| save | round-trip GameState; JSON hỏng → prev; version tương lai → lỗi; clamp giá trị bẩn; migrate v0→v1; export/import round-trip; checksum sai bị từ chối |

### 13.2 Test tích hợp domain — `src/domain/__integration__/`

- `day1.integration.test.ts`: kịch bản ngày 1 có tutorial.
- `fullDay.integration.test.ts`: như acceptance Phase 1.
- `thirtyDays.integration.test.ts`: bot hoàn hảo chơi 30 ngày, không có exception, tiền tăng, mở được ít nhất 2 tuyến, TravelViet mở từ ngày 11.
- `replay.test.ts`: cùng seed + cùng chuỗi command → `GameState` cuối giống hệt (deep equal).

### 13.3 Mô phỏng kinh tế — `npm run sim`

`scripts/sim.ts` chạy trên Node (dùng domain trực tiếp) với 3 bot, mỗi bot 200 seed × 30 ngày. Mỗi bot có thời gian phục vụ một khách (giây thật), để mô phỏng hàng đợi và khách bỏ về vì đông:

| Bot | Hành vi |
|---|---|
| PERFECT | Luôn làm đúng, 15 s/khách, giao ở `patienceRatio = 0.8`, mua ghế bằng đúng nhu cầu kỳ vọng mỗi tuyến, tránh tuyến bị dự báo xấu, mua nâng cấp/tuyến rẻ nhất khi đủ tiền và còn dư ≥ tiền mua ghế ngày sau |
| AVERAGE | 20% đơn có một lỗi nhẹ ngẫu nhiên, 5% lỗi nặng, 22 s/khách, giao ở ratio 0.5, mua ghế lệch ±30% nhu cầu, bỏ qua dự báo thời tiết, 3% khách bỏ đi |
| POOR | 35% lỗi nhẹ, 15% lỗi nặng, 30 s/khách, ratio 0.25, mua ghế lệch ±60%, 12% khách bỏ đi, không bao giờ từ chối (kể cả hộ chiếu lỗi) |

In ra bảng theo ngày (median và p10/p90): tiền cuối ngày, lợi nhuận, số khách, số khách bỏ về vì đông, số ghế ế, số ghế mất do thời tiết, TravelViet, số nâng cấp đã mua, số lần lưới an toàn kích hoạt.

Khoảng mục tiêu:

| Chỉ số | Mục tiêu |
|---|---|
| PERFECT mua được nâng cấp đầu tiên | cuối ngày 2 |
| AVERAGE mua được nâng cấp đầu tiên | cuối ngày 3 (p50), không muộn hơn ngày 4 (p90) |
| PERFECT mở BKK | ngày 11–13 (p50) |
| AVERAGE mở BKK | ngày 13–18 (p50) |
| PERFECT TravelViet ngày 20 | ≥ 4.5 (p50) |
| AVERAGE TravelViet ngày 20 | 3.6–4.4 (p50) |
| POOR: số lần lưới an toàn kích hoạt trong 30 ngày | p50 ≤ 3 |
| AVERAGE: lợi nhuận âm | ≤ 20% số ngày |
| Tỉ lệ ghế ế của AVERAGE | 10–30% |
| Tỉ lệ khách bỏ về vì đông | chỉ báo cáo (§15 D10) |

Nếu kết quả lệch: báo cáo, đề xuất điều chỉnh cụ thể (bảng nào, số nào, lý do), chờ duyệt.

### 13.4 Test tay trên máy thật — `tests/e2e-manual.md`

Tạo file checklist từ §14 (mục có nhãn [TAY]) cộng với luồng chơi đầy đủ. Mỗi lần release chạy lại trên: iPhone Safari, iPhone PWA, Android Chrome, Android PWA. Ghi kết quả (ngày, thiết bị, pass/fail) ngay trong file.

---

## 14. Danh sách awful case bắt buộc xử lý

Nhãn: [UNIT] có unit test, [TAY] kiểm tra trên máy thật, [CẢ HAI].

### 14.1 Lưu game

- [ ] [TAY] Refresh giữa ca → về PREP của ngày đó, lô ghế giữ nguyên, thời tiết và khách đầu tiên giống hệt
- [ ] [UNIT] Save JSON hỏng → khôi phục từ `prev`, toast
- [ ] [UNIT] Save thiếu field → validate lỗi → `prev`
- [ ] [UNIT] Save version cũ → migrate
- [ ] [UNIT] Save version mới hơn bản đang chạy → không ghi đè, hộp thoại tải lại
- [ ] [TAY] localStorage bị chặn → vẫn chơi, banner cảnh báo
- [ ] [UNIT] `QuotaExceededError` khi ghi → không crash
- [ ] [TAY] Hai tab → khoá tab sau, có "Chơi ở đây"
- [ ] [UNIT] Mã nhập rác / checksum sai → từ chối, save cũ nguyên vẹn
- [ ] [UNIT] Giá trị bẩn (tiền âm, NaN, chuỗi) → clamp
- [ ] [TAY] "Chơi mới" khi có save → xác nhận, backup

### 14.2 Onboarding

- [ ] [UNIT] Tên rỗng / toàn dấu cách / quá dài → reject
- [ ] [TAY] Bàn phím ảo không che ô nhập; gõ tiếng Việt có dấu (Telex/VNI) hiện đúng
- [ ] [TAY] Tên thương hiệu 20 ký tự không vỡ biển quầy, top bar, vé

### 14.3 Kho

- [ ] [CẢ HAI] Không mua vượt số tiền / giới hạn ghế
- [ ] [TAY] Double tap "Xác nhận nhập ghế" → trừ tiền một lần
- [ ] [TAY] Mở cửa khi kho trống → cảnh báo
- [ ] [TAY] Mở cửa khi còn pending → hộp thoại 3 lựa chọn
- [ ] [TAY] Cuộn danh sách không bấm nhầm stepper
- [ ] [UNIT] Softlock → lưới an toàn

### 14.4 Khách và đơn

- [ ] [UNIT] Không có tuyến chưa mở, không có cơ chế chưa mở
- [ ] [UNIT] Không có tổ hợp vô lý (§3.4)
- [ ] [UNIT] Không còn ghế nào → khách vẫn đến, từ chối được chấm `REFUSED_NO_STOCK`
- [ ] [UNIT] Hàng đầy → khách bỏ về vì đông, không chấm sao
- [ ] [UNIT] 19:00 → CLOSING, phục vụ nốt, rồi SUMMARY
- [ ] [UNIT] Hai khách tranh ghế cuối → khách trước lấy, khách sau `canServe = false`
- [ ] [UNIT] Scripted và random không trùng slot
- [ ] [UNIT] Số khách không bao giờ vượt 300

### 14.5 Lắp vé

- [ ] [UNIT] Không chọn được ghế không thuộc lô hoặc đã bán
- [ ] [UNIT] Không chọn được chuyến bị huỷ do thời tiết
- [ ] [TAY] Kéo slider vượt biên / ra ngoài canvas → clamp, kết thúc đúng
- [ ] [UNIT] Snap hành lý khi lệch ≤ 1 kg
- [ ] [UNIT] Không sang bước sau khi bước hiện tại chưa hợp lệ
- [ ] [TAY] Multi-touch khi kéo → chỉ pointer đầu
- [ ] [TAY] Kéo slider không cuộn trang
- [ ] [UNIT] Khách bỏ đi giữa lúc lắp → ghế HELD trả về AVAILABLE

### 14.6 Hộ chiếu

- [ ] [UNIT] Hết hạn đúng hôm nay = hợp lệ; hôm qua = lỗi
- [ ] [UNIT] Lỗi tên không bao giờ chỉ khác dấu
- [ ] [UNIT] `expiresDay` không bao giờ < 1
- [ ] [TAY] Tên dài 22 ký tự không vỡ card
- [ ] [UNIT] Không có hộ chiếu lỗi trước ngày 6

### 14.7 Giao vé và chấm điểm

- [ ] [UNIT] Tiền luôn nguyên, không âm
- [ ] [UNIT] Tip chỉ có ở khách BUSINESS PERFECT
- [ ] [UNIT] POOR không thu tiền
- [ ] [UNIT] Giao vé cùng tick với hết kiên nhẫn → giao vé thắng
- [ ] [CẢ HAI] Double tap giao / in → một lần
- [ ] [UNIT] Invariant tổng kết

### 14.8 Thời gian

- [ ] [TAY] Chuyển app / khoá máy → pause, quay lại thấy PauseOverlay
- [ ] [UNIT] Delta lớn bị clamp
- [ ] [UNIT] Pause không trừ kiên nhẫn
- [ ] [UNIT] Không dùng giờ hệ thống cho logic (ESLint đảm bảo)

### 14.9 Tổng kết, shop, TravelViet

- [ ] [UNIT] "Tiếp tục" / "Ngày tiếp theo" bấm hai lần → một lần
- [ ] [UNIT] Mua nâng cấp đã có → reject
- [ ] [UNIT] Mở tuyến thiếu điểm TravelViet hoặc trước ngày 11 → reject, UI hiện điều kiện
- [ ] [UNIT] Chi Shop ghi vào ngày hôm sau, invariant vẫn đúng

### 14.10 Sự kiện

- [ ] [UNIT] Tối đa 1 sự kiện/ngày
- [ ] [UNIT] Thời tiết BAD/SEVERE chỉ ảnh hưởng đúng tuyến được dự báo
- [ ] [UNIT] Thời tiết khi người chơi không mua ghế tuyến đó → không lỗi, `lostSeats = 0`
- [ ] [UNIT] BAD với 1 ghế → `round(1/3) = 0`, không mất ghế

### 14.11 Kỹ thuật và thiết bị

- [ ] [TAY] Audio iOS sau lần chạm đầu
- [ ] [TAY] Xoay ngang → RotateOverlay + pause
- [ ] [TAY] Tai thỏ / thanh home không che nút
- [ ] [TAY] Offline sau khi cài PWA
- [ ] [TAY] Bản mới → lời nhắc tải lại, không làm gián đoạn giữa ca
- [ ] [TAY] Asset lỗi mạng → nút thử lại
- [ ] [TAY] Nút Back Android → PauseOverlay, không thoát
- [ ] [TAY] Không zoom bằng double tap / pinch
- [ ] [TAY] Font tiếng Việt hiện đúng ngay từ màn đầu (không nhảy font)
- [ ] [TAY] 60 fps trên máy tầm trung

### 14.12 Cá nhân hoá

- [ ] [UNIT] Khách scripted luôn phục vụ được (tự cấp ghế nếu thiếu)
- [ ] [UNIT] Làm sai đơn của khách scripted → không phạt, thoại riêng
- [ ] [UNIT] `personal.ts` để trống → dùng mặc định, không crash

---

## 15. Quyết định còn mở (Claude Code phải hỏi trước khi làm phần liên quan)

| # | Câu hỏi | Phương án mặc định nếu chủ dự án bảo "tuỳ bạn" | Hỏi ở phase |
|---|---|---|---|
| D1 | Có cần cloud save (chơi trên nhiều thiết bị) không? | Không, chỉ localStorage + xuất/nhập mã | 3 |
| D2 | Font: Nunito hay Baloo 2? | Nunito cho chữ, Baloo 2 cho tiêu đề | 5 |
| D3 | Phong cách hình ảnh cuối cùng (flat pastel / pixel / vẽ tay) | Flat pastel | 5 |
| D4 | Có cho mua thêm ghế trong ca (OPEN) không, với giá đắt hơn? | Không | 1 |
| D5 | Lỗi tên hộ chiếu có được phép chỉ khác dấu không? | Không | 1 |
| D8 | Tên miền: dùng `*.pages.dev` hay mua tên miền riêng? | `*.pages.dev` | 6 |
| D9 | Có hỗ trợ desktop (chuột, bàn phím) như một trải nghiệm chính không? | Chạy được bằng chuột, không tối ưu riêng | 2 |
| D10 | Dependency ngoài danh sách CLAUDE.md: `@vitest/coverage-v8` (Phase 1), runner cho `npm run sim` như `tsx` (Phase 4), `eruda` (debug trên điện thoại) | Chờ duyệt từng cái | 1 |
| D11 | Duyệt văn cốt truyện và thoại của Béo | — | 5 |
| D12 | Xử lý khách vượt khả năng phục vụ (§3.8) nếu sim cho tỉ lệ bỏ về vì đông quá cao | Báo cáo số liệu, chờ cơ chế nhân viên (§17) | 4 |

Đã chốt (ghi vào `docs/DECISIONS.md`): D6 bỏ chế độ Thư giãn; D7 giữ "Quầy Vé Nhỏ" và mã "QV"; không có màn kết thúc.

---

## 16. Cá nhân hoá — `src/data/personal.ts`

Chủ dự án tự điền danh sách ngày đặc biệt. Claude Code tạo file với cấu trúc và giá trị placeholder, không tự bịa nội dung cá nhân.

```ts
export interface PersonalConfig {
  enabled: boolean;
  specialCustomers: Array<{
    id: string;                          // 'VIP_HER', 'VIP_ME'
    displayName: string;                 // tên trên hộ chiếu
    spriteId: string;                    // sprite riêng nếu có, không thì dùng sprite thường
    day: number;
    atCustomerIndex: number;             // khách thứ mấy trong ngày (0-based)
    order: Partial<Order>;
    lines: { arrive: string; success: string; fail: string };
    tipMultiplier: number;               // vd 3; áp dụng cả khi khách ECONOMY
    music?: string;                      // key audio riêng
  }>;
  scriptedMoments: Array<{
    id: string;
    day: number;
    at: 'PREP' | 'OPEN' | 'SUMMARY';
    lines: string[];                     // Béo nói
  }>;
  customRoutes: Array<{
    replaceRouteId: RouteId;             // thay tên hiển thị/mô tả của tuyến có sẵn
    name: string;
    flavorText: string;                  // kỷ niệm, hiện khi chạm vào tuyến
  }>;
}

export const PERSONAL: PersonalConfig = {
  enabled: false,
  specialCustomers: [],
  scriptedMoments: [],
  customRoutes: [],
};
```

Luật:
- Khách đặc biệt thay thế đúng slot `atCustomerIndex` của ngày `day`. Nếu người chơi không có ghế phù hợp tại thời điểm đó, domain tự thêm ghế (không tính tiền, không ghi transaction chi) để khách luôn phục vụ được.
- Làm sai đơn của khách đặc biệt: không phạt, chấm tối thiểu 3 sao, dùng thoại `fail` (nên dễ thương).
- Ngày có khách đặc biệt hoặc scripted moment không có sự kiện ngẫu nhiên.
- `atCustomerIndex` ≥ số khách của ngày đó: khách đặc biệt thành khách cuối cùng trong ngày.
- `enabled = false`: bỏ qua toàn bộ, game dùng nội dung mặc định.

---

## 17. Backlog (không làm ở bản đầu)

- Mua máy bay, thuê cơ trưởng, thuê nhân viên (nhân viên giải quyết giới hạn khách mỗi ca §3.8). Mỗi giờ từ 21:30 đến 01:30 một chuyến.
- Nợ, vay, màn phá sản khi kinh doanh khủng hoảng và nợ quá nhiều. Khi làm: xem lại lưới an toàn §3.10.
- Sự kiện hoãn chuyến (DELAY).
- Cloud save (Phase 8, phụ thuộc D1).
