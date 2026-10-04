# Kế hoạch: hệ thống nhân viên 4 bậc (Thực tập sinh → Junior → Middle → Senior)

Trạng thái: **bản kế hoạch, chưa code**. Cần chủ dự án xác nhận mục 8 trước khi làm.

## 1. Yêu cầu gốc

| Nhân viên | Tiền thuê | Lương/ngày | Khả năng |
|---|---|---|---|
| Thực tập sinh | 0 | 300k | Gần như không làm được gì. Ẩn: đủ 30 ngày thì lên Junior, lương chỉ còn ~50% lương Junior thuê ngoài |
| Junior | 15.000k (15tr) | 1.500k | Chọn hạng vé |
| Middle | 20.000k (20tr) | 2.000k | Của Junior + chọn chuyến và giờ bay + cân hành lý (sai ~40%) |
| Senior | 25.000k (25tr) | 2.300k | Của Middle, nhưng sai cân hành lý chỉ ~20% |

Mục tiêu thiết kế: nhân viên **không ăn hết việc của người chơi**.

## 2. Thay đổi cốt lõi: nhân viên "phụ việc", không còn "tự bán"

Bản nhân viên hiện tại (tập sự/kỳ cựu) nhận khách từ hàng chờ và tự bán trọn vé nên dễ lấy hết việc. Kế hoạch này **thay hẳn** bằng cơ chế phụ việc ngay trên quầy của người chơi:

- Khi một khách tới quầy (trạng thái BUILDING), nhân viên tự làm trước **một số bước** của vé theo khả năng; người chơi làm phần còn lại và luôn là người giao vé.
- Người chơi **luôn tự làm**: chọn ghế (kể cả ghế đầu/giữa/cuối/cửa sổ), vé dịch vụ, soi hộ chiếu/từ chối, in và giao vé. Nhân viên không đụng vào các bước này.
- Phân chia theo bậc:

| Bước trên vé | Thực tập sinh | Junior | Middle | Senior |
|---|---|---|---|---|
| Rút vé đúng hạng (thường/thương gia) | – | Đúng | Đúng | Đúng |
| Đóng dấu điểm đến + dấu giờ bay (chọn chuyến) | – | – | Đúng | Đúng |
| Cân hành lý | – | – | Sai ~40% | Sai ~20% |

- "Sai cân hành lý": nhân viên ghi số kg lệch khỏi yêu cầu của khách quá mức dung sai. Người chơi nhìn thấy số trên vé và có thể cân lại bằng thanh bấm giữ. Không kiểm tra thì khách chấm điểm thấp (WRONG_BAGGAGE như hiện nay).
- Chọn chuyến: nhân viên chọn chuyến sớm nhất khớp tuyến + khung giờ khách muốn và còn ghế đúng hạng. Không có chuyến phù hợp thì để trống hai ô dấu (người chơi tự xử lý hoặc từ chối).
- Thực tập sinh: **không có tác dụng gameplay** (đúng ý "chỉ nuôi"). Đề xuất thêm một hiệu ứng thuần hình ảnh (đứng cạnh quầy) và không có bonus nào.

Hệ quả: nhân viên chỉ rút ngắn thời gian thao tác cho mỗi khách (tối đa vài giây/khách), không thể thay người chơi bán hết khách → đúng mục tiêu "không ăn hết việc".

## 3. Điều khiển nhịp phụ việc

- Mỗi bậc có `assistDelayMs` (thời gian từ lúc khách tới quầy đến lúc nhân viên làm xong từng bước), đề xuất: Junior 2s (hạng vé), Middle 2s + 3s (chuyến) + 3s (cân), Senior nhanh hơn Middle ~30%.
- Các bước chạy lần lượt, có hiệu ứng: vé bay từ chồng ra bàn, con dấu tự đóng, thanh cân tự chạy.
- Nếu người chơi **tự thao tác một bước trước** thì nhân viên bỏ bước đó (không ghi đè lựa chọn của người chơi).
- Người chơi bấm "Làm lại" thì nhân viên **không làm lại** cho khách đó (tránh vòng lặp, và để thưởng cho việc tự sửa).
- Nhiều nhân viên cùng lúc: dùng khả năng tốt nhất cho từng bước (không cộng dồn), lương cộng dồn. Xem câu hỏi 8.1.

## 4. Thực tập sinh → Junior (cơ chế ẩn)

- Mỗi nhân viên là một **thực thể có id riêng** với `daysWorked` (số ngày đã làm xong ca, tăng khi tổng kết ngày).
- Thực tập sinh đạt `daysWorked = 30` thì lên Junior ngay lúc tổng kết ngày đó: giữ id, đổi bậc, lương mới = **50% lương Junior thuê ngoài = 750k/ngày**; tiền thuê không phải trả.
- Cơ chế ẩn: màn Nhân viên không ghi sẽ lên bậc; chỉ hiện thanh "Đang học việc" không có số ngày. Khi lên bậc: Béo báo một dòng bất ngờ ở màn tổng kết.
- Tổng chi phí nuôi thực tập sinh 30 ngày: 9.000k; sau đó 750k/ngày so với 1.500k/ngày khi thuê Junior mới (tiết kiệm 750k/ngày và 15.000k tiền thuê).
- Nhân viên đã lên Junior vẫn là một Junior bình thường: có thể bị cho nghỉ như người khác.

## 5. Kinh tế và cân bằng (số liệu từ `npm run sim`)

Lợi nhuận mỗi ngày (median bot hoàn hảo): ngày 1–5 khoảng 1–5k, ngày 7–10 khoảng 10–22k, từ ngày 11 trở đi 60–300k (do TravelViet mở).

| Mốc | Thực tập sinh 300k | Junior 1.500k | Middle 2.000k | Senior 2.300k |
|---|---|---|---|---|
| Lương so với lợi nhuận ngày 5 | ~15% | ~75% | ~100% | ~115% |
| Lương so với lợi nhuận ngày 10 | ~1,5% | ~7% | ~9% | ~11% |
| Lương so với lợi nhuận ngày 20 | ~0,1% | ~0,6% | ~0,8% | ~1% |

Nhận xét và đề xuất:
- Tiền thuê 15–25tr mua được từ khoảng ngày 7–10 (tiền mặt lúc đó 40–100k). Ngày 11 về sau tiền thuê và lương gần như không đáng kể → **lương không còn là phanh** ở giai đoạn giữa/cuối game. Phanh thật sự là "giới hạn bước nhân viên làm được" ở mục 2, nên giữ cơ chế phụ việc làm trục chính.
- Đề xuất bảo vệ người mới: khi thuê, nếu tiền còn lại sau khi thuê < ngân sách nhập ghế ngày mai thì hiện hộp thoại cảnh báo (vẫn cho thuê).
- Đề xuất tuỳ chọn (chưa bắt buộc): lương tăng theo ngày hoặc theo lượt khách để vẫn là một quyết định ở giai đoạn cuối. Cần chủ dự án chọn, xem 8.5.
- Trần số nhân viên (xem 8.1) là phanh thứ hai để không phụ việc kín cả quầy.
- Mục tiêu sim sau khi làm: nhân viên cải thiện thu nhập bot trung bình ≤ ~+15%, không làm giảm sao trung bình, bot hoàn hảo không bị lỗ hơn ~10% vì lương.

## 6. Thay đổi kỹ thuật

### 6.1 Dữ liệu (`src/data/staff.ts`)
```ts
type StaffKind = 'INTERN' | 'JUNIOR' | 'MIDDLE' | 'SENIOR';
interface StaffKindDef {
  kind: StaffKind;
  hireCost: number;          // 0 | 15000 | 20000 | 25000
  wagePerDay: number;        // 300 | 1500 | 2000 | 2300
  skills: ('CABIN' | 'STAMPS' | 'BAGGAGE')[];
  baggageErrorPct: number;   // 0 | 0 | 40 | 20
  stepDelayMs: Record<'CABIN' | 'STAMPS' | 'BAGGAGE', number>;
  minDay: number;            // mốc mở thuê (JUNIOR 5, MIDDLE 10, SENIOR 15 — đề xuất)
}
const INTERN_PROMOTE_AFTER_DAYS = 30;
const PROMOTED_WAGE_RATIO = 0.5;   // lương Junior × 0,5 sau khi lên bậc
```

### 6.2 Domain
- `models.ts`: `StaffMember { id, kind, hiredDay, daysWorked }`; `GameState.staff: StaffMember[]`. Bỏ `StaffTask`, `today.staffTasks`, `StaffDef` cũ.
- Command: `HIRE_STAFF { kind }` (sinh id mới, kiểm tra tiền, ngày, trần nhân viên), thêm `FIRE_STAFF { staffId }` (xem 8.2).
- `staff.ts`: `assistPlanFor(customer, flights, seats, staffMembers)` trả danh sách bước `{ skill, applyAt }`; `applyAssistStep(draft, order, step, rng)` đổi `draft` giống các command BUILD_*; `promoteInterns(state)`.
- `dayCycle.ts`: `tickStaff` chạy khi counter ở BUILDING: tính kế hoạch lúc khách vào quầy rồi áp từng bước khi hết thời gian, bỏ qua bước người chơi đã làm. `payStaffWages` giữ nguyên (cộng lương từng người) và gọi `promoteInterns` + tăng `daysWorked`.
- `rngFor(seed, day, 'staff:'+customerId+':'+skill)` để sai số hành lý ổn định theo seed.

### 6.3 Save
- Lên **v4**: `staff` đổi từ `string[]` thành `StaffMember[]`; xoá `today.staffTasks`. Migration v3→v4: mỗi id cũ `TRAINEE` → `JUNIOR`, `VETERAN` → `MIDDLE` (giữ `daysWorked: 0`), xoá `staffTasks`. Có test migration (CLAUDE.md luật 7).

### 6.4 UI
- Mục **Nhân viên** (`StaffScene`): 4 thẻ có ảnh chân dung, các biểu tượng khả năng (🎫 hạng vé, 🔖 chuyến + giờ, ⚖️ cân), dòng "Cân sai ~40%", tiền thuê, lương/ngày; thêm danh sách "Đang làm" (ảnh nhỏ, bậc, nút cho nghỉ).
- Màn **Quầy**: nhân viên hiện bằng ảnh nhỏ bên lề khung làm việc, có bong bóng ngắn khi làm bước ("Lấy vé thường", "Đóng dấu Đà Nẵng", "Cân 15kg"); dòng nhỏ trên con dấu/vé đánh dấu bước do nhân viên làm.
- Tổng kết: dòng "Lương nhân viên" (đã có) + dòng Béo khi có người được lên bậc.
- Tutorial: một thẻ Béo giới thiệu nhân viên ở lần đầu mở mục Nhân viên.

### 6.5 Mô phỏng
- Bot trong `__integration__/bots.ts` cần mô hình "thời gian phục vụ": mỗi bước nhân viên làm giảm `serveTimeMs` của bot; bật bằng `HIRE=1` như hiện nay (có thể thêm `HIRE=JUNIOR|MIDDLE|SENIOR`).

## 7. Thứ tự thực hiện (đề xuất, mỗi bước một commit)

1. Bỏ cơ chế tự bán cũ (`staffTasks`, `tickStaff` cũ), thêm `StaffMember` + data 4 bậc, command thuê/nghỉ, save v4 + migration + test.
2. Logic phụ việc (`assistPlanFor`, `applyAssistStep`) + test từng bước: đúng hạng, chọn chuyến, sai số hành lý, không ghi đè người chơi.
3. Lương theo từng người + thăng bậc thực tập sinh sau 30 ngày + test.
4. Sim: mô hình thời gian phục vụ + chỉnh số.
5. UI Quầy (hiện nhân viên + hiệu ứng) và UI mục Nhân viên (thẻ, danh sách, cho nghỉ).
6. Nhúng ảnh nhân viên, tutorial, tổng kết + cập nhật docs.

## 8. Câu hỏi cần chủ dự án xác nhận

1. **Số nhân viên tối đa và cho phép trùng bậc?** Đề xuất: tối đa 3 nhân viên cùng lúc, mỗi bậc thuê được nhiều người (vì thực tập sinh phải thuê nhiều lần để lên Junior), khả năng không cộng dồn.
2. **Có cho nhân viên nghỉ việc (sa thải) không?** Đề xuất: có, miễn phí, không hoàn tiền thuê (cần để đổi người khi hết chỗ).
3. **Cách hiểu "phụ việc" ở mục 2 có đúng ý bạn không?** (nhân viên chỉ làm trước một số bước trên vé của khách đang ở quầy, bạn vẫn là người chọn ghế, soi hộ chiếu và giao vé). Nếu bạn muốn nhân viên **tự bán trọn vé** thì kế hoạch này phải đổi, và cần giới hạn kiểu khác (số khách mỗi ngày, chỉ khách đơn giản…).
4. **Thực tập sinh có hiệu ứng gì không?** Đề xuất: không có gì (chỉ nuôi). Phương án phụ: giảm 3% tốc độ mất kiên nhẫn của khách (tinh thần phục vụ), nhưng sẽ phá ý "hầu như chả làm được gì".
5. **Lương có nên tăng theo giai đoạn không?** Lương hiện chỉ đáng kể trước ngày 11 (xem mục 5). Có thể để nguyên, hoặc nhân hệ số theo lượng khách/ngày. Đề xuất: để nguyên ở bản đầu, chơi thử rồi mới quyết.
6. **Mốc mở thuê theo ngày**: Junior ngày 5, Middle ngày 10, Senior ngày 15 (đề xuất); nếu muốn thuê tự do từ đầu thì chỉ phụ thuộc tiền.
7. **Thăng bậc đếm theo ngày nào?** Đề xuất đếm ngày đã chơi hết ca khi đang có nhân viên đó (ngày bỏ dở không tính).

## 9. Prompt tạo ảnh nhân viên

Dùng cùng phong cách ảnh khách/Béo hiện có (xem `docs/PROMPT_ANH_V2.md`). Mỗi nhân viên xuất **một hàng 3 biểu cảm** (đang làm việc / vui / mệt) như ảnh khách để đưa vào atlas `characters`. Nền trắng thuần, mỗi mặt cách nhau rộng.

**Phong cách chung (dán đầu mọi prompt):**
> Chibi cozy game character, flat illustration with soft thick outlines in dark chocolate brown (#4A3525), warm terracotta / kraft-paper palette (cream #FFF6E5, kraft #E6D2B5, terracotta #C86D51, teal #5B8A8C), large head, small body, bust-up portrait facing slightly forward, same style and scale as the customer characters of a cozy shop management game. Pure white background, no text, no watermark. One character per image, three expressions side by side: (1) focused on working, (2) happy and proud, (3) tired and sweaty. Same outfit and hairstyle in all three, wide white gap between the three.

**1. Thực tập sinh:**
> [Phong cách chung] A shy young intern, around 20, oversized beige uniform vest that is slightly too big, name badge reading nothing, holding a clipboard with both hands, messy short black hair, small round glasses, nervous smile, a little paper cup of coffee on the side.

**2. Junior:**
> [Phong cách chung] A cheerful junior ticket clerk, around 24, neat teal uniform vest over a white shirt, small airline pin, short brown hair with a side clip, holding a stack of blank tickets in one hand.

**3. Middle:**
> [Phong cách chung] A confident middle-level ticket agent, around 30, teal uniform blazer with a terracotta scarf, hair tied in a neat ponytail, slim glasses on a chain, holding a rubber stamp in one hand and a tiny luggage scale in the other.

**4. Senior:**
> [Phong cách chung] A calm veteran senior agent, around 40, dark teal blazer with golden trim and two small stripes on the sleeve, short gray-streaked hair, warm gentle smile, a pen behind the ear, a golden name badge, arms relaxed, looks reliable and unhurried.

**Ảnh thẻ trong màn Nhân viên (tuỳ chọn):** mỗi người một ảnh đứng nửa người, nền trong, 1 biểu cảm vui, dùng lại prompt trên và thêm: "single image, bust-up, centered, happy expression only".

Quy cách: PNG, nền trắng, mỗi hàng 3 mặt cách nhau ≥ 64 px, đặt tên `staff_intern.png`, `staff_junior.png`, `staff_middle.png`, `staff_senior.png` để dùng lại pipeline `tools/processTriple.mjs` và `tools/buildAtlas.mjs`.
