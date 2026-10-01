# Prompt thiết kế Stitch — Quầy Vé Nhỏ

Cách dùng: dán **Prompt nền (mục 0)** trước mỗi lần tạo màn, rồi dán đoạn riêng của từng màn. Làm theo thứ tự 6 → 7 → 9–13 → 16 trước (các màn chơi chính), sau đó tới asset (mục 21).

Giả định đã dùng khi viết (sửa nếu sai):
- Ngày lễ có tên cụ thể (Tết Nguyên Đán, Giỗ Tổ Hùng Vương, 30/4–1/5, Quốc khánh 2/9, Trung thu, Giáng sinh) và có 2 tuyến "nhu cầu cao". Thông báo hiện ở Shop và Tổng kết của ngày trước, rồi lại ở Kho đúng ngày lễ.
- Giá chỉnh theo từng tuyến bằng thanh phần trăm từ −30% đến +60%, mốc trần đánh dấu ở +30%.
- Tiền tệ là "k" (nghìn đồng), giá vé theo mặt bằng thực tế ở Việt Nam.

---

## 0. Prompt nền (dán ĐẦU mỗi lần)

```
Design a mobile portrait game screen (9:16, 360x640 logical, export 720x1280) for "Quầy Vé Nhỏ" — a cozy
Vietnamese airline-ticket-counter management game for one player. Style: "Chibi Tactile Skeuomorphism"
meets whimsical retro storybook: warm walnut-wood + kraft-paper + cream, pillowy rounded shapes, thick
espresso outlines, solid flat "extruded" shadows (NO blurry drop shadows), pressable 3D pill buttons.
Palette: background #FDF6EC, panel #F5E8D3, card #FFFDF9, primary walnut #6C4F3D (base/outline #4A3525),
secondary terracotta #C86D51 (base #8F4631), tertiary teal #5B8A8C (base #3B5E60), success spruce #6E8B74,
caution amber #B8862B, danger brick #B5503A, muted caramel #8D6E53, kraft #E6D2B5. Never pure black.
Fonts: Be Vietnam Pro 700/800 for titles & buttons, Nunito Sans 500–800 for body & numbers (tabular).
Corners: pills for buttons/chips/HUD, 24–32px for dialogs, 16–20px for cards; no sharp 90° corners.
Cards: 2px #6C4F3D border + solid 4px #4A3525 bottom extrusion. Buttons: 5px extruded base, top inner
highlight, pressed state sinks 3px. Dialog backdrop: espresso sepia 55%. Tickets have semicircle notches
and dashed perforation line. Language: all UI text in Vietnamese. Currency is "k" (nghìn đồng), written
like "1.100k", "6.000k". Minimum touch target 88px (720 scale). Keep 60px top and 50px bottom safe areas.
Mood: slow, gentle, nostalgic airport kiosk at night, hot tea and biscuits. No neon, no gloss.
```

Mỗi màn bên dưới = prompt nền + đoạn riêng. Với mỗi màn, nhờ Stitch xuất cả trạng thái phụ (disabled, pressed, empty, error) nếu có ghi.

---

## 1. Màn tiêu đề (Title)

```
Title screen. Centered big logo "Quầy Vé Nhỏ": a chibi wooden ticket-kiosk with a striped awning and a
tiny paper plane, wordmark in Be Vietnam Pro 800 espresso with cream outline. Warm night-airport
background: soft window glow, runway lights as small amber dots, a few paper-plane doodles. Below: if a
save exists — a recessed info strip "Quầy Săn Vé Đêm · Ngày 7 · 12.450k" above a big terracotta pill
button "Chơi tiếp" and a secondary cream pill "Chơi mới"; if no save — only "Chơi mới" (walnut).
Tiny version text bottom. Also design state B (no save) and state C with a toast "Đã khôi phục từ bản
sao lưu".
```

## 2. Chuyện mở đầu — Béo nói với người chơi (3–4 popup, chạm để tiếp)

```
Onboarding story sequence, 4 screens. Mascot "Béo": a round, chubby, friendly chibi best-friend
character (bear-like, orange-brown, big eyes, tiny scarf), appears bottom-left half body, with 3
expressions across screens (greeting, excited, sly). A large cream speech bubble (2.5px espresso outline,
rounded tail pointing at Béo, name tab "Béo" overlapping top-left) holds the text. Background: a dim
blue-brown night airport hall, faint blurred terminal silhouettes. Bottom center: "Chạm để tiếp" with a
small bobbing arrow, progress dots (4). Texts:
1) "Ê, tỉnh chưa? Nghe vụ này chưa — vé bay đêm ế queo, mà dân đi bụi, dân về quê gấp thì cần rẻ."
2) "Hãng bán sỉ ghế giá bèo cho đại lý. Mình dựng quầy, săn vé, bán lại đúng người cần — ăn chênh
lệch, không ai thiệt."
3) "Dịp lễ thì khách đổ về đông lắm. Lúc đó cậu tự chỉnh giá vé nhé — nhưng đừng hét quá 30%, khách bỏ
chạy hết đó!"
4) "Giờ xưng danh đi. Tên cậu, rồi tên cái quầy này, cho nó chất!"
```

## 3. Màn tạo mới — nhập tên người chơi

```
New-game form step 1/2. Béo small at top-left with a bubble "Tên cậu là gì nè?". Center: a wooden
"name plaque" card with label "Tên của bạn", a recessed pill text input (kraft #E6D2B5, inner top shadow,
placeholder "Nhập tên..." caramel), character counter "0/16" bottom right, 2-step progress pills at
top. Bottom: pill button "Tiếp" (disabled state kraft-gray until text entered; enabled state walnut).
Also design: focused input with on-screen keyboard open (card pushed up), error state "Tên không được
để trống" in brick.
```

## 4. Màn tạo mới — đặt tên quầy

```
New-game form step 2/2. Same layout. Label "Tên thương hiệu quầy". Above the input, a live PREVIEW of the
kiosk signboard: a hanging wooden sign with the typed brand name in cream letters (shows long names
20 chars without overflow, auto-shrinks). Placeholder "Nhập tên quầy...", counter "0/20". Hint chips
below with example names: "Săn Vé Đêm", "Bay Là Bay", "Vé Rẻ Mỗi Ngày" (tappable pills). Button "Tiếp".
```

## 5. Béo xác nhận tên quầy → vào ngày 1

```
Béo excited, big bubble: "“Săn Vé Đêm” nghe được đó! Mở quầy thôi!". The kiosk signboard with the brand
name drops in from the top with a small bounce, confetti of tiny paper planes. Button "Bắt đầu ngày 1".
```

---

## 6. Kho (chuẩn bị ca) — màn chính buổi sáng

```
"Kho" prep screen for the day. Top HUD: left "Ngày 7" title; center pill with coin icon "12.450k";
right pill star "4.2"; far-right round settings gear button (44px circle, 3D). Under the HUD, an
ANNOUNCEMENT banner slot (see states):
 State A normal: no banner.
 State B holiday: terracotta-tinted card with a party-flag icon: "🎉 Lễ Quốc khánh 2/9 — nhu cầu đi
 Đà Nẵng và Phú Quốc tăng đột biến! Khách đông hơn, ít nhạy giá. Cân nhắc nâng giá vé."
 State C weather: teal card with cloud-lightning: "Dự báo xấu ở tuyến Đà Nẵng: có thể mất ghế khi mở cửa".
Below: section title "Chuyến bay hôm nay" and a vertical scroll list of FLIGHT CARDS. Each card
shows route name chip, flight code "QV201", departure "21:30 (Tối)", a mini route line "HAN ✈ DAD",
wholesale cost per seat for Phổ thông and Thương gia, quantity steppers (– 3 +) with "đã có 2",
running discount tag "−5%" and the subtotal "Cọc chuyến này: 2.190k".
Between the flight list and bottom buttons: a sticky strip "Dự tính: −8.760k · Còn lại: 3.690k".
Bottom: two pill buttons "Xác nhận nhập ghế" (secondary, disabled until qty>0) and big "Mở cửa" (spruce).
Also design: empty-stock warning dialog ("Kho đang trống, mở cửa luôn?" with "Quay lại"/"Mở cửa"), pending
dialog with 3 buttons ("Huỷ"/"Bỏ & mở cửa"/"Nhập & mở cửa"), and a loading-more fade at list end.
```

## 7. Khối chỉnh giá vé theo tuyến (nằm trong Kho — TÍNH NĂNG MỚI)

```
Ticket-price control, appears in the Kho screen as a collapsible panel "Bảng giá vé hôm nay" above the
flight list (design collapsed + expanded). For EACH unlocked route one row: route chip + name
("TP. Hồ Chí Minh"), base prices small "Gốc: Phổ thông 1.500k · Thương gia 3.900k", a big chunky wooden
SLIDER from −30% to +60% with a bold marker at +30% labelled "TRẦN +30%" (a red notched fence icon),
the current price result "Đang bán: 1.725k / 4.485k (+15%)", and a live DEMAND METER: 5 small people
icons filling according to expected crowd ("Khách dự kiến: ▮▮▮▮▯ ~ 80%") plus an arrow ↑/↓ hint. Slider
zones: below 0% = green "Rẻ, đông khách"; 0–30% = amber gradient "Cân bằng"; above 30% = red hatched
zone with a warning chip "Vượt trần: khách giảm một nửa, 35% vé bị huỷ + hoàn tiền". On HOLIDAY days the
hot routes show a flame badge "Nhu cầu cao" and a small tooltip "Ít nhạy giá hơn". Include: a "Đặt lại giá
gốc" ghost button, a summary line "Doanh thu ước tính" with a small bar vs yesterday, a quick-preset
chip row (Gốc / +15% / +30% trần). Design normal, holiday, over-cap warning and a locked-route
(greyed with padlock "Mở tuyến ở Shop") variants.
```

## 8. Thông báo ngày lễ (popup, hiện ở Shop/Tổng kết hôm trước và khi vào Kho)

```
Modal dialog "Sắp có lễ!" with Béo pointing. A calendar-page illustration (torn-off page style) with the
holiday name "Quốc khánh 2/9" and flag/lantern doodle depending on holiday (design variants for: Tết
Nguyên Đán, Giỗ Tổ Hùng Vương, 30/4–1/5, Quốc khánh 2/9, Trung thu, Giáng sinh). Below: two "hot route"
postcards (chibi landmark illustrations: Đà Nẵng bridge, Phú Quốc beach) each with a flame chip "Nhu cầu
+200%". Béo bubble: "Khách đông, ít kỹ tính giá — cậu nâng giá được, nhưng đừng quá +30% nha!".
Buttons: "Chỉnh giá ngay" (terracotta) and "Để sau" (ghost).
```

---

## 9. Quầy bán vé — khung chính (đang phục vụ)

```
Main counter screen (the core). Top HUD: left digital clock pill "21:45" with moon icon, centre money
"12.450k", right star "4.2", right round pause button. Below: brand signboard "Săn Vé Đêm" + event
badge ("🎉 Lễ Quốc khánh" / "⛈ Đà Nẵng: thời tiết xấu"). Middle: the CUSTOMER STAGE — a cozy
counter desk (wood top) with the customer chibi avatar large (see asset sheet) behind it, a patience bar
(butter candle that melts / or clock ring) coloured green→amber→red by mood (😊😐😠 mini face), the ORDER
speech bubble above the customer as chip cards: Nơi đến, Hạng (Phổ thông/Thương gia), Hành lý "20kg",
Ghế "Cửa sổ", Khung giờ "Tối", Dịch vụ icons; a small passport button (only after day 6). Right edge:
queue of up to 4–6 smaller customer avatars with tiny patience dots; a "turned away" counter badge.
Below the stage: step indicator with 4 dots "Chuyến · Ghế · Hành lý · Vé" (done = leaf check). Bottom
dock: three pills "Làm lại" (ghost) / "Từ chối" (terracotta) / "Tiếp" (walnut). Design the states: waiting
for customer ("Đang chờ khách..." empty desk with a steaming tea cup), customer happy, customer angry,
queue full.
```

## 10. Bước A — chọn chuyến bay

```
Counter step A. The area under the step indicator shows a scrollable list of today's flights as compact
ticket-stub cards: route chip (colour per route), code "QV201", time "21:30", mini plane line, seats left
badges "Phổ thông 3 · Thương gia 0" as two tappable pills (disabled/greyed when 0). The pill matching the
customer's cabin is highlighted; the one matching the time window has a small clock tick. States:
nothing selected, one selected (ticket stub lifts + walnut border + check), a sold-out flight greyed with
"Hết ghế", and a filter bar (unlockable upgrade) with destination chips "Tất cả · Đà Nẵng · Sài Gòn".
```

## 11. Bước B — chọn ghế (sơ đồ ghế)

```
Counter step B: seat map in a fuselage-shaped cream card. Two layouts: ECONOMY 3-3 (A B C | D E F) with
narrow aisle, BUSINESS 2-2 (A C | D F) with wider seats. Row numbers on the left, small window icons
at the outer columns. Seat tile states with legend: Của bạn/AVAILABLE (walnut), Đã bán (faded + check),
Người khác giữ (kraft grey), Đang chọn (terracotta glowing with pop animation), plus WINDOW and AISLE
markers (little window / aisle icons) and a hint chip showing the customer request "Khách muốn: Cửa sổ".
Under the map: legend row and the selected seat text "Ghế 12A · Cửa sổ ✓". Variants: matches request,
does not match request (amber warning "Khách muốn cửa sổ, ghế này là lối đi"), empty stock.
```

## 12. Bước C — hành lý & dịch vụ thêm (item extra)

```
Counter step C. Top: BAGGAGE SLIDER — a wooden suitcase handle thumb on a track with tick marks at 15, 20,
30 kg, big value label "20 kg", the customer's requested mark outlined by a dashed ring, a fee chip
"+380k". Below: EXTRAS as three large toggle cards in a row, each with an icon and carved-wood switch:
"Suất ăn chay +80k" (leaf bowl), "Xe lăn hỗ trợ +0k" (wheelchair), "Bảo hiểm +230k" (shield). Selected =
spruce check badge, requested-by-customer = small speech-dot. Summary strip "Phụ phí: +460k". States:
none selected, correct, extra not requested (amber note "Khách không yêu cầu").
```

## 13. Bước D — xem lại, in vé, trao vé

```
Counter step D. A big kraft-paper BOARDING TICKET centered: header "VÉ MÁY BAY", route "HAN → DAD", flight
code, date, time, seat "12A", cabin, passenger name, baggage and extras icons, a barcode strip, scalloped
side notches and dashed perforation, tilt −2°. Three sub-states: (1) REVIEW — ticket with a mini checklist
of ticks next to each line, button "In vé"; (2) PRINTING — a chunky retro printer drawing the ticket out,
progress bar "Đang in...", ticket partly emerging; (3) READY — ticket fully out with a glowing hint
"Kéo vé lên trao cho khách" and an upward arrow, dotted drop-zone over the customer. Include the small
"price paid" stamp on the ticket: "Giá bán: 1.725k (+15%)" with a green stamp if within cap and a RED
"VƯỢT TRẦN" stamp if above cap.
```

## 14. Hộ chiếu

```
Passport overlay (card, tap outside to close). A navy-brown passport booklet opened flat: avatar photo
frame, name "Nguyễn Minh Châu", "Hết hạn: ngày 12", "Tên đặt vé: Nguyen Minh Chau" compared against name,
a big "Hôm nay: ngày 9" ribbon. Show 4 variants: valid, expired (red EXPIRED stamp tilted), name mismatch
(highlighted differing letters), accent-only difference. Buttons "Đóng" and a shortcut "Từ chối khách".
```

## 15. Phản hồi sau khi trao vé

```
Feedback layer over the counter: success — coins burst upwards, floating "+1.725k" in spruce and
"+3.100k tip" in terracotta, 5 stars popping one by one, customer waves; mistake — screen shake lines,
toast card listing mistakes ("Sai hành lý, thiếu suất ăn chay"), 2-star; walk-away — customer huffing with
cloud icon and "-150k"; sold with over-cap price — customer face frowning with a small "Giá cao quá!"
bubble. Special/VIP customer variant: golden ribbon frame and a heartwarming line bubble.
```

---

## 16. Tổng kết ngày

```
Day summary. Title "Săn Vé Đêm — Ngày 7" on a wooden plank. Big 5-star row (animated pop) for average
stars. A receipt-style kraft card with count-up lines (dotted leaders): Tiền đầu ngày, Doanh thu vé, Tiền
tip, Chi mua ghế, Ghế ế (số ghế + giá vốn), Hoàn ghế ế, Ghế mất do thời tiết, Tiền phạt, Vé bị huỷ do giá
quá cao (số vé + tiền hoàn), a thick divider, "Lợi nhuận" (green + / red −) and "Tiền cuối ngày". Under
it: stat chips Phục vụ · Khách bỏ đi · Từ chối · Điểm TravelViet. A "Giá hôm nay" mini chart: bars per route
with a red dashed cap line at +30%. Béo tip card at bottom when loss: "Thử nhập ít ghế hơn cho chuyến
khuya xem sao". Buttons: "Tiếp tục", hint "Chạm để bỏ qua hiệu ứng". Variants: profit day, loss day, day
with cancellations, holiday day.
```

## 17. Shop (nâng cấp + mở tuyến)

```
Shop screen "Xưởng trang trí quầy". Header with money pill and Béo mascot tip card at the bottom. Segmented
tabs "Nâng cấp | Tuyến bay". UPGRADE cards (illustration icon left, name, 1-line effect, price "3.000k", badge
Lv/“Phổ biến”, buy button states: "Mua" / "Chưa đủ tiền" / "Đã sở hữu" teal check / locked "Từ ngày 4"):
Ghế chờ êm, Quạt mát, Máy in nhanh, Ô lọc chuyến, Quan hệ hãng bay, Chính sách hoàn ghế, Quầy rộng,
Bảng khách quen. ROUTE cards: landmark illustration, name, typical price "Phổ thông 1.300k / Thương gia
3.600k", unlock cost "3.750k", requirement chip "Cần TravelViet 3.8 (mở từ ngày 11)", lore/flavour text
line. Confirm dialog "Mua Quạt mát với 2.250k?" ("Huỷ"/"Mua"). Footer pill "Ngày tiếp theo". Include a
tomorrow-teaser strip: "Ngày mai: lễ Giỗ Tổ Hùng Vương".
```

## 18. Hộp thoại đặc biệt

```
Design these dialogs in the same card style, each with Béo expression: (a) Lưới an toàn: "Bạn sắp hết tiền!
Được tặng miễn phí 3 ghế Phổ thông để tiếp tục buôn bán." button "Cảm ơn Béo"; (b) TravelViet mở khoá (cuối
ngày 10) with a star-rating ribbon "TravelViet" and explanation of how stars bring customers; (c) Thời tiết
khi mở cửa: three outcomes banner GOOD (sun, "Trời đẹp, không mất ghế"), BAD (rain, "Mất 1/3 ghế tuyến
Đà Nẵng"), SEVERE (storm, "Huỷ cả chuyến, mất toàn bộ ghế"); (d) Lễ mới mở khoá; (e) xác nhận "Chơi mới
sẽ ghi đè tiến trình, đã tạo bản sao lưu".
```

## 19. Tutorial của Béo

```
Tutorial overlays with a dimmed background and a spotlight "hole" highlighting the target UI element
(pulsing amber ring + finger pointer). Béo bubble at the top with short Vietnamese lines and a "Hiểu rồi"
button. Provide frames for: Kho day 1 (steppers), Quầy day 1 (read order → choose flight → seat → Tiếp →
In vé → kéo vé), day 2 baggage slider, day 3 window/aisle icons, day 4 business & tip, day 5 time-window &
extras, day 6 passport & Từ chối, first holiday (price slider + 30% cap explanation with a red fence), first
weather forecast. Each frame ≤ 2 sentences.
```

## 20. Cài đặt, tạm dừng, lỗi hệ thống

```
(a) Settings dialog "Cài đặt": two chunky wooden sliders "Âm lượng nhạc", "Âm lượng hiệu ứng", carved
switch "Rung", ghost buttons "Xuất mã save", "Nhập mã save", and "Về màn hình chính"; plus an export-code
sheet showing a copyable code box "QVN1.eyJ2...a3f9" with "Sao chép". (b) Pause dialog "Tạm dừng": Tiếp
tục / Cài đặt / Về màn hình chính. (c) Rotate overlay "Xoay dọc nhé" with a phone-turning icon. (d)
Update dialog "Có bản mới — Tải lại?". (e) Tab-lock overlays: "Game đang mở ở tab khác" with button "Chơi ở
đây" and "Game đã mở ở tab khác". (f) Load-error screen with button "Thử lại". (g) Toast styles (info,
success, error) as small cream pills with an icon.
```

---

## 21. Bộ asset (xuất riêng, nền trong suốt)

```
Create asset sheets in the same chibi style, consistent outline #4A3525, flat colours, no gradients:
1) Béo mascot — 3 expressions (greeting, excited, worried) + pointing pose, 512px each.
2) 16 customer chibi avatars (c01–c16), varied age/gender/outfit (backpacker, office worker, grandma,
student, tourist with straw hat, businessman with briefcase, family dad...), each with 3 expressions
(happy, neutral, angry), bust shot 256px, plus 2 VIP characters (golden frame).
3) Icon set 64px: coin, star, clock, plane, seat, window-seat, aisle-seat, suitcase, meal, wheelchair,
shield, passport, printer, ticket, calendar/holiday flag, flame (demand), cloud/rain/storm/sun, padlock,
gear, pause, people-meter, warning fence (cap), refund arrow.
4) Route landmark postcards: Sài Gòn (Landmark 81 / Nhà thờ Đức Bà), Đà Nẵng (Cầu Rồng), Nha Trang (tháp
Bà Ponagar / biển), Phú Quốc (biển + dừa), Đà Lạt (đồi thông), Bangkok (Wat Arun), Seoul (N Seoul Tower),
Tokyo (tháp Tokyo + Fuji), Paris (tháp Eiffel).
5) Upgrade illustrations ×8 and UI parts: wood plank sign, boarding-ticket template with notches,
speech-bubble 9-slice, stamp set (APPROVED, EXPIRED, VƯỢT TRẦN), toggle/slider/stepper parts in pressed and
normal states, app icon 512 (ticket + paper plane on walnut) and a maskable version, logo lockup.
```
