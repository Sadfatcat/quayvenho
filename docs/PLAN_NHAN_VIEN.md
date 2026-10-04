# Kế hoạch: nhân viên, lạm phát giá vé, nghỉ việc ngẫu nhiên và marketing

Trạng thái: **kế hoạch đã chốt các quy tắc chính với chủ dự án, chưa code**. Mục 12 là các số tôi tự đặt, cần chủ dự án xem lại.

## 1. Quy tắc đã chốt

**Nhân viên quầy** (tối đa **2 người** cùng lúc; marketing không tính vào 2 người này):

| Nhân viên | Tiền thuê | Lương gốc/ngày | Việc phụ trách |
|---|---|---|---|
| Thực tập sinh | 0 | 300k | Không làm gì (chỉ nuôi) |
| Junior | 30.000k (đã nâng lên) | 1.500k | Rút đúng **hạng vé** |
| Middle | 40.000k (đã nâng lên) | 2.000k | **Đóng dấu điểm đến + giờ bay** (chọn chuyến) và **cân hành lý** (sai ~40%) |
| Senior | 50.000k (đã nâng lên) | 2.300k | **Chọn ghế** (đúng yêu cầu vị trí) và **vé dịch vụ** |

- **Không cộng dồn**: mỗi bậc làm việc mà bậc kia không làm. Muốn đủ quy trình phải gom 2 người khác bậc, phần còn lại người chơi tự làm. Người chơi luôn tự **in và giao vé**, và vẫn là người soi hộ chiếu/từ chối khách.
- Thực tập sinh đủ **30 ngày** đi làm thì tự lên Junior (cơ chế ẩn), lương còn **60% lương Junior** (900k/ngày gốc), không phải trả tiền thuê.
- Thực tập sinh và Junior **mở thuê cùng ngày**; giá thuê Junior/Middle/Senior đặt cao để người chơi có lý do mở thực tập sinh trước.
- Cho nghỉ việc **miễn phí**; thuê lại vẫn mất tiền thuê gốc.
- Lương tăng: **mỗi 3 ngày**, lương mỗi nhân viên tăng thêm **40% phần lợi nhuận/ngày vừa tăng thêm** (chi tiết mục 5).
- **Giá vé gốc tăng mỗi 3 ngày**: giá bán **+8%**, giá vốn ghế **+4%** (mục 6).
- **Nghỉ ngẫu nhiên** (ốm, gia đình có việc, nghỉ thai sản…): báo rõ nhân viên nào, phụ trách việc gì để người chơi tự làm việc đó vào ngày hôm sau (mục 7).
- **Nhân viên marketing**: không tính vào 2 chỗ, tăng khách 10–20%, có thể "dạy việc" để tăng thêm +0,5% mỗi lần với chi phí tăng dần (mục 8).

## 2. Cách nhân viên làm việc (phụ việc, không tự bán)

- Khi khách tới quầy (BUILDING), mỗi nhân viên tự làm **phần việc của mình** trên vé nháp của khách đó; các bước còn lại do người chơi làm. Không bao giờ in hay giao vé hộ.
- Từng việc:
  - **Hạng vé (Junior)**: rút đúng vé thường/thương gia theo đơn.
  - **Dấu + cân (Middle)**: đóng dấu điểm đến đúng tuyến và dấu giờ bay của chuyến sớm nhất khớp khung giờ khách muốn và còn ghế đúng hạng (không có thì để trống để người chơi xử lý); cân hành lý, **40% sai** (số kg lệch quá dung sai).
  - **Ghế + dịch vụ (Senior)**: chọn ghế khớp yêu cầu (cửa sổ/lối đi/đầu/giữa/cuối; chỉ chọn khi vé đã có chuyến và hạng), bật đúng các vé dịch vụ khách yêu cầu. Không sai.
- Thứ tự phụ thuộc: ghế cần có chuyến, chuyến cần dấu. Nếu người giữ dấu vắng mặt thì Senior chờ đến khi người chơi đóng dấu xong.
- Mỗi việc có độ trễ (`stepDelayMs`, mặc định 2–3 giây) với hiệu ứng nhìn thấy được: vé ra khỏi chồng, con dấu tự đóng, thanh cân tự chạy, ghế tự sáng.
- Người chơi tự làm một bước trước thì nhân viên bỏ bước đó (không ghi đè). Người chơi bấm "Làm lại" thì nhân viên không làm lại cho khách đó.
- Người chơi có thể sửa mọi thứ nhân viên làm trước khi in; cân sai thì nhìn số trên vé và cân lại.

## 3. Thực tập sinh → Junior (cơ chế ẩn)

- Mỗi nhân viên là thực thể có id riêng và `daysWorked`; tăng 1 khi hết ca có nhân viên đó **đi làm** (ngày nghỉ không tính).
- Đủ 30 thì thăng bậc lúc tổng kết: giữ id, thành Junior, lương gốc = 60% lương Junior, nhận phần việc của Junior.
- Màn Nhân viên chỉ hiện thanh "Đang học việc" không kèm số ngày. Khi thăng bậc, Béo báo một dòng ở màn tổng kết.
- Chi phí nuôi thực tập sinh 30 ngày: 9.000k (gốc); sau đó 900k/ngày thay vì 1.500k/ngày và tiết kiệm 30.000k tiền thuê.
- Thực tập sinh chiếm một trong 2 chỗ nên người chơi phải cân nhắc giữa nuôi và thuê người giỏi ngay.

## 4. Mở thuê theo ngày (đề xuất, xem mục 12)

| Nhân viên | Mở từ ngày |
|---|---|
| Thực tập sinh + Junior | 3 |
| Marketing | 8 |
| Middle | 10 |
| Senior | 15 |

## 5. Lương tăng theo lợi nhuận

- Lợi nhuận kinh doanh của ngày `d`: `moneyEnd − moneyStart + shopCost + staffWages` (không tính lương để khỏi tự phản hồi).
- Cứ hết ngày chia hết cho 3 (ngày 3, 6, 9, …): so sánh **trung bình 3 ngày vừa qua** với **trung bình 3 ngày trước đó**. Nếu tăng, `lươngTăngThêm += 40% × phần chênh` (làm tròn k, không âm, không bao giờ giảm).
- `lươngTăngThêm` cộng thẳng vào lương mỗi nhân viên (cùng một số cho mọi người, kể cả thực tập sinh và marketing). Lương mỗi người = lương gốc (hoặc 60% Junior với người được thăng bậc) + `lươngTăngThêm`.
- Hệ quả thực tế: giai đoạn lợi nhuận nhảy từ 20k lên 200k, mỗi bước 3 ngày lương mỗi người tăng khoảng 20–70k (lương gốc 300–2.300k), nên lương tăng chậm hơn lợi nhuận nhiều. Nếu muốn lương nặng hơn thì tăng hệ số 40%.
- Lưu `profitHistory` (6 ngày gần nhất) và `wageRaise` trong save.

## 6. Giá vé tăng mỗi 3 ngày

- `bậc lạm phát = floor((ngày − 1) / 3)`. Ngày 1–3 bậc 0, 4–6 bậc 1, v.v.
- Giá bán gốc = giá bảng × 1,08^bậc; giá vốn ghế = giá bảng × 1,04^bậc. Làm tròn **một chỗ** trong `economy.ts` (luật tiền số nguyên).
- Trần chỉnh giá +30% tính trên giá gốc **đã tăng**, nên người chơi chủ động nâng giá sẽ kiếm nhiều hơn người để giá gốc. Sau 30 ngày giá bán ≈ ×2,1, giá vốn ≈ ×1,5 (lãi gộp mỗi ghế rộng ra).
- Chi phí mở tuyến, nâng cấp, tiền thuê nhân viên **không** tăng theo (chúng ngày càng rẻ so với thu nhập, vì mục tiêu là lợi nhuận hàng ngày tăng, không đi ngang). Xem lại sau khi chạy sim.
- Sửa các nơi đang gọi giá bảng trực tiếp: giá hiển thị ở Mua vé và Giá vé, `fareOf`, chấm điểm vé, mua ghế, hoàn ghế ế, bot sim, test.

## 7. Nhân viên nghỉ ngẫu nhiên

- Quyết định lúc tổng kết ngày `d` cho ngày `d+1` (seed ổn định theo ngày, mỗi nhân viên một lần tung):

| Lý do | Xác suất/ngày/người | Số ngày nghỉ |
|---|---|---|
| Ốm | 4% | 1 |
| Gia đình có việc | 3% | 1 |
| Nghỉ thai sản | 0,5% | 5 |

- Màn tổng kết hiện hộp thông báo từng người: "Nhân viên <tên bậc> nghỉ <lý do> ngày mai. Phụ trách: <việc>. Bạn cần tự làm việc này." và Prep hiện một banner nhắc lại. Thực tập sinh vắng mặt thì báo "không ảnh hưởng gì".
- Ngày vắng: không trả lương, không tính `daysWorked`, không phụ việc. Hết ngày nghỉ thì tự trở lại.
- Chuỗi nghỉ dài (thai sản) vẫn chiếm một trong 2 chỗ.
- Tên nhân viên (để báo đích danh): mỗi nhân viên có tên riêng lấy từ `src/data/staffNames.ts` (vd. Thảo, Minh…) cùng bậc.

## 8. Nhân viên marketing

- Không tính trong giới hạn 2 người. Thuê một lần, tối đa 1 người.
- Tăng lượng khách theo `marketingBonusPct`, nhân vào số khách mỗi ngày (cùng chỗ với hệ số ngày đầu): lúc mới thuê **10%**, tối đa **20%**.
- **Dạy việc**: mỗi lần bấm tăng `marketingBonusPct` thêm **0,5%** (tổng 20 lần để từ 10% lên 20%), tốn tiền tăng dần. Công thức đề xuất: lần thứ `n` (n = 0…19) tốn `2.000k + 300k × n` → lần đầu 2.000k, lần cuối 7.700k, tổng 97.000k.
- Lương marketing gốc 1.000k/ngày, cũng cộng `lươngTăngThêm`. Marketing cũng có thể nghỉ ngẫu nhiên (ngày đó mất hiệu ứng tăng khách, báo trước như mục 7).
- Giá thuê đề xuất 20.000k, mở từ ngày 8.
- Ở màn Nhân viên: thẻ marketing riêng, hiện "Tăng khách: +10%", nút "Dạy việc (−2.000k)" cập nhật giá, thanh tiến trình tới 20%.

## 9. Thay đổi kỹ thuật

### 9.1 Dữ liệu (`src/data/staff.ts`)
```ts
type StaffKind = 'INTERN' | 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'MARKETING';
type StaffJob = 'CABIN' | 'STAMPS' | 'BAGGAGE' | 'SEAT' | 'SERVICES';
interface StaffKindDef {
  kind: StaffKind;
  hireCost: number;        // 0 | 30000 | 40000 | 50000 | 20000
  baseWage: number;        // 300 | 1500 | 2000 | 2300 | 1000
  jobs: StaffJob[];        // [] | [CABIN] | [STAMPS, BAGGAGE] | [SEAT, SERVICES] | []
  baggageErrorPct: number; // 40 cho MIDDLE
  stepDelayMs: Partial<Record<StaffJob, number>>;
  minDay: number;          // 3 | 3 | 10 | 15 | 8
  countsTowardCap: boolean; // marketing = false
}
const STAFF_CAP = 2;
const INTERN_PROMOTE_AFTER_DAYS = 30;
const PROMOTED_WAGE_RATIO = 0.6;
const WAGE_RAISE_EVERY_DAYS = 3;
const WAGE_RAISE_PROFIT_SHARE = 0.4;
const FARE_RISE_EVERY_DAYS = 3;
const FARE_RISE_PER_STEP = 0.08;
const COST_RISE_PER_STEP = 0.04;
const ABSENCES = [{ reason: 'SICK', chancePct: 4, days: 1 }, { reason: 'FAMILY', chancePct: 3, days: 1 }, { reason: 'MATERNITY', chancePct: 0.5, days: 5 }];
const MARKETING = { startBonusPct: 10, maxBonusPct: 20, stepPct: 0.5, firstTeachCost: 2000, teachCostStep: 300 };
```

### 9.2 Domain
- `models.ts`: `StaffMember { id, kind, name, hiredDay, daysWorked, absentUntilDay | null, absenceReason | null }`; `GameState.staff: StaffMember[]`, `wageRaise: number`, `profitHistory: number[]`, `marketingBonusPct: number`. Bỏ `StaffTask`, `today.staffTasks`, `StaffDef` cũ. Điều chỉnh `DaySummary` để tổng kết kèm thông báo nghỉ/thăng bậc.
- Commands: `HIRE_STAFF { kind }`, `FIRE_STAFF { staffId }`, `TEACH_MARKETING`. Ba lệnh chạy ở PREP và SHOP như hiện nay; thuê kiểm tra tiền, ngày, trần 2 người (trừ marketing), marketing tối đa 1.
- `staff.ts`: `assistStepsFor(order, draft, members, flights, seats)`, `applyAssistStep(...)`, `promoteInterns`, `rollAbsences`, `wageOf(member, state)`, `raiseWagesIfDue`, `marketingTeachCost(bonusPct)`.
- `economy.ts`: `inflationStep(day)`, `listedFare(route, cabin, day)`, `listedSeatCost(route, cabin, day)`; thay mọi chỗ đọc `route.price` / `route.cost` trực tiếp.
- `dayCycle.ts`: tính số khách cuối cùng `× (1 + marketingBonusPct/100)` khi marketing không vắng mặt; `tickStaff` chạy phụ việc theo đồng hồ; `endDayIfDone` trả lương theo từng người đi làm, cập nhật `daysWorked`, thăng bậc, tính lợi nhuận ngày, tăng lương mỗi 3 ngày, tung nghỉ cho ngày mai.

### 9.3 Save
- Lên **v4**: `staff` thành `StaffMember[]`, thêm `wageRaise`, `profitHistory`, `marketingBonusPct`; bỏ `today.staffTasks`. Migration v3→v4: `TRAINEE` → `JUNIOR`, `VETERAN` → `MIDDLE` (đặt tên mặc định, `daysWorked: 0`, `wageRaise: 0`, `profitHistory: []`, `marketingBonusPct: 10`). Có test migration.

### 9.4 UI
- `StaffScene`: mục "Quầy" gồm 2 chỗ nhân viên (hiện ảnh, tên, bậc, việc phụ trách, lương hiện tại, nút Cho nghỉ), danh sách thuê (thực tập sinh, junior, middle, senior), thẻ marketing riêng với nút Dạy việc. Chỗ trống/đầy hiển thị rõ "Quầy chỉ chứa 2 nhân viên".
- Màn Quầy: ảnh nhân viên nhỏ bên lề, bong bóng ngắn khi làm việc, đánh dấu bước do nhân viên làm trên vé/dấu/ghế.
- Tổng kết: dòng lương, thông báo nghỉ (nhân viên + việc), thông báo thăng bậc, tiến độ lương tăng.
- Banner Prep: nhắc nhân viên nghỉ hôm nay và việc người chơi phải tự làm.
- Mua vé và Giá vé: hiển thị giá đã lạm phát; thêm nhãn nhỏ "giá bảng tăng ×1,08" ở Giá vé.
- Tutorial: thẻ Béo ở lần đầu mở mục Nhân viên và khi giá vé gốc tăng lần đầu (ngày 4).

### 9.5 Mô phỏng
- Bot cần mô hình thời gian phục vụ: mỗi việc nhân viên làm giảm `serveTimeMs` của bot; tuỳ chọn `HIRE=` theo bậc. Thêm lạm phát vào bot (chúng đang dùng giá bảng cố định) và `AVERAGE_SEAT_COST`.
- Mục tiêu sau khi chỉnh: lợi nhuận hàng ngày **tăng đều** theo ngày (không đi ngang), người chỉnh giá có lợi hơn người để giá gốc, nhân viên không đẩy bot trung bình quá +15% hay làm bot hoàn hảo lỗ quá 10%.

## 10. Thứ tự thực hiện (mỗi bước một commit, đều chạy typecheck + lint + test)

1. **Lạm phát giá vé** (`economy.ts` + mọi chỗ đọc giá) + test + chạy sim chỉnh lại số cân bằng chung.
2. **Nhân viên v4**: dữ liệu 5 loại, `StaffMember`, thuê/nghỉ, trần 2 người, lương theo từng người, save v4 + migration + test; bỏ cơ chế tự bán cũ.
3. **Phụ việc**: 5 việc theo bậc, thứ tự phụ thuộc, sai cân hành lý, không ghi đè người chơi, test từng việc.
4. **Lương tăng** theo lợi nhuận mỗi 3 ngày + `profitHistory` + test.
5. **Thăng bậc thực tập sinh** + **nghỉ ngẫu nhiên** + thông báo + test.
6. **Marketing** + dạy việc + test.
7. **Mô phỏng**: bot có nhân viên, bot có lạm phát, chỉnh số.
8. **UI**: mục Nhân viên, Quầy, Tổng kết, Prep, tutorial.
9. **Ảnh** nhân viên + docs.

## 11. Rủi ro

- Lạm phát giá làm mọi test dùng giá bảng cố định đổi theo ngày: cần helper test truyền `day`.
- Chi phí mở tuyến/nâng cấp đứng yên có thể khiến cuối game "mua mọi thứ trong vài ngày"; cần xem trong sim và có thể thêm hệ số riêng cho shop.
- Nhân viên phụ việc đụng vào thao tác của người chơi: phải tránh đua trạng thái (người chơi bấm đúng lúc nhân viên làm) — dùng một hàng đợi bước chạy trong `tickStaff`, domain là nguồn sự thật.
- Nghỉ thai sản 5 ngày + trần 2 người có thể làm người chơi khó chịu; để xác suất thấp (0,5%).

## 12. Số tôi tự đặt, cần chủ dự án xem lại

- Giá thuê: Junior 30.000k, Middle 40.000k, Senior 50.000k, marketing 20.000k.
- Mở thuê: thực tập sinh + Junior ngày 3, marketing ngày 8, Middle ngày 10, Senior ngày 15.
- Lương gốc marketing 1.000k; công thức dạy việc `2.000k + 300k × n`.
- Xác suất và thời gian nghỉ (4% / 3% / 0,5%, 1 / 1 / 5 ngày), ngày nghỉ không lương.
- Senior không sai khi chọn ghế và dịch vụ; Junior không sai khi rút hạng vé; độ trễ mỗi việc 2–3 giây.
- Lương tăng dùng chung một số cho mọi nhân viên, tính trên trung bình 3 ngày.

## 13. Prompt tạo ảnh nhân viên

Dùng chung phong cách với ảnh khách/Béo (`docs/PROMPT_ANH_V2.md`). Mỗi nhân viên một hàng **3 biểu cảm** (đang làm việc / vui / mệt) để đưa vào atlas `characters` bằng `tools/processTriple.mjs` và `tools/buildAtlas.mjs`. Nền trắng thuần.

**Phong cách chung (dán đầu mọi prompt):**
> Chibi cozy game character, flat illustration with soft thick outlines in dark chocolate brown (#4A3525), warm terracotta / kraft-paper palette (cream #FFF6E5, kraft #E6D2B5, terracotta #C86D51, teal #5B8A8C), large head, small body, bust-up portrait facing slightly forward, same style and scale as the customer characters of a cozy shop management game. Pure white background, no text, no watermark. One character per image, three expressions side by side: (1) focused on working, (2) happy and proud, (3) tired and sweaty. Same outfit and hairstyle in all three, wide white gap between the three.

**Thực tập sinh** (`staff_intern.png`):
> [Phong cách chung] A shy young intern, around 20, oversized beige vest slightly too big, clipboard held with both hands, messy short black hair, round glasses, nervous smile, a paper cup of coffee nearby.

**Junior** (`staff_junior.png`) — phụ trách rút vé:
> [Phong cách chung] A cheerful junior ticket clerk, around 24, neat teal vest over a white shirt, small airline pin, short brown hair with a side clip, holding a stack of blank tickets.

**Middle** (`staff_middle.png`) — phụ trách dấu và cân:
> [Phong cách chung] A confident middle-level agent, around 30, teal blazer with a terracotta scarf, hair in a neat ponytail, slim glasses on a chain, a rubber stamp in one hand and a tiny luggage scale in the other.

**Senior** (`staff_senior.png`) — phụ trách ghế và dịch vụ:
> [Phong cách chung] A calm veteran senior agent, around 40, dark teal blazer with golden trim and two sleeve stripes, short gray-streaked hair, warm gentle smile, pen behind the ear, golden name badge, holding a tiny seat map card and a service coupon.

**Marketing** (`staff_marketing.png`):
> [Phong cách chung] An energetic marketing staff, around 27, terracotta jacket, headset, holding a megaphone and a small poster with a plane icon, trendy short wavy hair with a bright hair clip, confident wide smile.

Ảnh thẻ trong màn Nhân viên (tuỳ chọn): dùng lại prompt trên nhưng thêm "single image, bust-up, centered, happy expression only".

Quy cách: PNG, nền trắng, mỗi hàng 3 mặt cách nhau ≥ 64 px.
