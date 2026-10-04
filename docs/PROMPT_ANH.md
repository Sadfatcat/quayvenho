# Prompt tạo ảnh asset — Quầy Vé Nhỏ

Dùng cho Stitch / Midjourney / DALL·E / Flux đều được (prompt tiếng Anh vì các công cụ hiểu tốt hơn; chữ trong ảnh viết tiếng Việt khi có ghi).

**Cách làm để các ảnh đồng bộ:**
1. Dán **Khối phong cách (A)** vào ĐẦU mọi prompt.
2. Tạo Béo (mục B) trước, chọn 1 ảnh ưng nhất rồi dùng làm ảnh tham chiếu (image reference / `--cref` / "same character") cho mọi ảnh có Béo.
3. Làm theo từng nhóm: logo → Béo → khách → icon → bưu thiếp tuyến → nâng cấp → nền → thành phần UI.
4. Xuất PNG nền trong suốt cho nhân vật/icon (hoặc nền trơn #FF00FF để tôi tách). Đặt tên file như cột "Tên file".
5. Nếu công cụ cho tạo sprite sheet: yêu cầu lưới đều, mỗi ô cách nhau ≥ 32px, không chạm viền ô.

---

## A. Khối phong cách (dán đầu mọi prompt)

```
Cute chibi tactile game art, whimsical retro storybook illustration, cozy Vietnamese airport-kiosk theme.
Flat colours with a subtle paper-grain texture, thick warm espresso-brown outlines (#4A3525, 3–4px, uniform
weight), rounded pillowy shapes, soft cel shading with ONE flat shadow tone, no gradients, no glossy
highlights, no blurry drop shadows, no neon. Palette: cream #FDF6EC, biscuit #F5E8D3, kraft #E6D2B5,
walnut brown #6C4F3D, terracotta #C86D51, faded teal #5B8A8C, pine green #6E8B74, amber #B8862B.
Big heads, tiny bodies (2–2.5 heads tall), large glossy-but-flat eyes with a small white highlight, rosy cheeks.
Warm, gentle, nostalgic mood. Clean vector-like edges, centered composition, plenty of margin.
```

**Negative prompt (nếu công cụ có):** `photo, realistic, 3d render, glossy, neon, harsh black outline, text errors, extra fingers, watermark, signature, busy background, gradient background, blurry`

---

## B. Béo — mascot dẫn truyện (tạo trước, đồng bộ mọi thứ khác)

Mô tả nhân vật (dùng lại trong mọi prompt có Béo): *"Béo: a round chubby friendly bear-like best-friend mascot, orange-brown fur (#C98A4B) with a cream belly, tiny round ears, big shiny eyes, rosy cheeks, a small striped teal scarf, a tiny airline-staff cap tilted on his head, short stubby arms."*

| Tên file | Kích thước | Prompt (sau khối A) |
|---|---|---|
| `beo_greeting.png` | 1024×1024 | Béo, full body, waving with one paw, big warm smile, eyes happy arcs, standing pose, transparent background |
| `beo_excited.png` | 1024×1024 | Béo, full body, both paws up, jumping slightly, mouth open in joy, sparkles around, transparent background |
| `beo_sly.png` | 1024×1024 | Béo, half body, one eyebrow raised, sly smirk, paw rubbing chin, transparent background |
| `beo_worried.png` | 1024×1024 | Béo, half body, sweat drop, worried wavy mouth, paws clasped, transparent background |
| `beo_pointing.png` | 1024×1024 | Béo, full body, pointing to the right with a paw, encouraging expression, transparent background |
| `beo_bust.png` | 512×512 | Béo head-and-shoulders portrait for dialogue box, friendly smile, transparent background |
| `beo_sheet.png` | 2048×2048 | Character expression sheet of Béo: 3×3 grid, 9 expressions (happy, laughing, surprised, sad, angry, sleepy, thinking, wink, proud), equal cells, transparent background |

---

## C. Logo và icon ứng dụng

| Tên file | Kích thước | Prompt |
|---|---|---|
| `logo_lockup.png` | 1600×800 | Game logo lockup: a tiny chibi wooden ticket kiosk with a striped terracotta-and-cream awning and a little paper plane flying out of its window, wordmark "Quầy Vé Nhỏ" below in a chunky rounded display font (Be Vietnam Pro ExtraBold style), espresso text with a thin cream outline, correct Vietnamese diacritics, small subtitle "săn vé đêm", transparent background |
| `logo_mark.png` | 1024×1024 | Square emblem only (no text): the chibi ticket kiosk with awning and paper plane inside a rounded-square walnut-brown badge with cream inner border |
| `app_icon_512.png` | 512×512 | App icon: cream boarding-ticket with semicircle side notches and a small terracotta stripe, a tiny paper plane on it, on a solid walnut-brown #6C4F3D rounded background, very simple and readable at small size, no text |
| `app_icon_maskable_512.png` | 512×512 | Same icon as above but with extra safe margin: the ticket occupies only the central 60%, background fills the whole square edge to edge |
| `favicon_64.png` | 64×64 | Simplified ticket+plane glyph, 2 colours, bold shapes |

---

## D. Khách hàng — 16 avatar + 2 VIP (bust shot 3 biểu cảm)

Mỗi khách xuất **3 ảnh**: `happy`, `neutral`, `angry`. Kích thước 512×512, nền trong suốt, nhìn chính diện, ngang vai.
Tên file: `cus_c01_happy.png`, `cus_c01_neutral.png`, `cus_c01_angry.png` … đến `c16`; VIP: `cus_vip1_*`, `cus_vip2_*`.

Mẫu prompt (thay phần mô tả): `[Khối A] Chibi bust portrait of [MÔ TẢ], expression: [happy: big smile, cheerful eyes | neutral: calm small mouth | angry: furrowed brows, puffed cheeks, small cloud of steam], front view, transparent background, consistent style with the other customers.`

| ID | Mô tả (thay vào `[MÔ TẢ]`) |
|---|---|
| c01 | young backpacker boy with a huge travel backpack, messy black hair, green hoodie |
| c02 | office worker woman with a neat bob haircut, blue blouse and lanyard badge, tired but polite |
| c03 | cheerful grandma with silver bun, round glasses, floral cardigan, small suitcase handle visible |
| c04 | university student girl with twin ponytails, yellow headphones around neck, tote bag |
| c05 | tourist man in a straw sun hat and Hawaiian shirt, camera around neck |
| c06 | businessman with slicked hair, grey suit, red tie, holding a briefcase |
| c07 | young dad with a baby carrier on chest, stubble, plain t-shirt |
| c08 | stylish woman with big sunglasses on her head, trench coat, red lipstick |
| c09 | elderly grandpa with white moustache, flat cap, walking cane |
| c10 | teenage boy with a baseball cap backwards, headphones, skateboard strapped on backpack |
| c11 | flight-nurse-like woman in a mint scrubs jacket, hair net, friendly |
| c12 | monk-like calm man in a simple saffron-brown robe, shaved head, prayer beads |
| c13 | girl with short pink hair, band T-shirt, guitar case on back |
| c14 | middle-aged woman with a conical hat (nón lá) hanging at her back, market-trader style blouse, big smile |
| c15 | foreign traveler with curly red hair, freckles, big hiking backpack, Vietnamese-flag pin |
| c16 | young woman in áo dài (soft teal) with hair down, elegant and shy |
| vip1 | warm, loving young woman in a cozy red scarf and beret holding a small paper plane, soft golden ornamental frame around the portrait, sparkles |
| vip2 | friendly young man with round glasses holding a bouquet, same golden ornamental frame and sparkles |

Thêm: `cus_queue_silhouettes.png` 1024×256 — 6 tiny chibi customers in a queue seen from the front, different heights/outfits, each 128px tall, transparent background (dùng cho hàng chờ).

---

## E. Bộ icon (64×64 và 128×128, nét nâu #6C4F3D, tô phẳng, bo tròn)

Prompt chung: `[Khối A] Icon set, single icon centered on transparent background, thick rounded espresso outline, flat fill using the palette, simple and readable at 64px, no text:` rồi từng icon bên dưới. Có thể nhờ tạo cả sheet lưới 6 cột (mỗi icon một ô, cách đều).

`icon_coin` (gold coin with a star embossed) · `icon_star` (5-point star, soft rounded) · `icon_star_empty` (outline-only star) · `icon_clock` (round clock, hands at 9:00) · `icon_moon` (crescent with a tiny star) · `icon_plane` (side-view paper-like plane) · `icon_seat` (airplane seat front view) · `icon_seat_window` (seat next to an oval window) · `icon_seat_aisle` (seat with an aisle arrow) · `icon_suitcase` (small suitcase with a luggage tag) · `icon_meal` (leaf-shaped bowl with veggies) · `icon_wheelchair` · `icon_shield` (insurance shield with a check) · `icon_passport` (navy-brown booklet with a crest) · `icon_printer` (retro ticket printer) · `icon_ticket` (boarding ticket with notches) · `icon_calendar_flag` (calendar page with a little flag) · `icon_flame` (small warm flame, for high demand) · `icon_cloud_sun` · `icon_cloud_rain` · `icon_cloud_storm` (lightning) · `icon_sun` · `icon_lock` (padlock) · `icon_gear` · `icon_pause` · `icon_people_meter` (5 tiny person silhouettes in a row) · `icon_fence_cap` (red notched fence/barrier = price cap) · `icon_refund` (circular arrow with coin) · `icon_leaf_check` (leaf-shaped checkmark, pine green) · `icon_crowd` (small group) · `icon_party_flag` (bunting) · `icon_bell` (service bell) · `icon_stamp` (rubber stamp) · `icon_question` (speech bubble with ?) · `icon_info` (circle i) · `icon_warning` (rounded triangle !).

---

## F. Bưu thiếp 9 tuyến bay (chibi landmark, 720×405, khung bưu thiếp có viền kraft)

Prompt mẫu: `[Khối A] Vintage postcard illustration of [CẢNH], chibi miniature diorama feeling, kraft-paper border with a postage stamp in the corner and a tiny dotted stamp mark, warm sunset or night-airport light, no text except the city name in the corner: "[TÊN]".`

| Tên file | CẢNH / TÊN |
|---|---|
| `route_sgn.png` | Ho Chi Minh City: Landmark 81 tower, Notre-Dame cathedral, motorbikes — "TP. Hồ Chí Minh" |
| `route_dad.png` | Da Nang: Dragon Bridge breathing fire, beach, Ba Na hills — "Đà Nẵng" |
| `route_cxr.png` | Nha Trang: Po Nagar towers, turquoise bay, boats — "Nha Trang" |
| `route_pqc.png` | Phu Quoc: palm beach, sunset, pearl-farm hut, boats — "Phú Quốc" |
| `route_dli.png` | Da Lat: pine hills, little French villa, flowers, fog — "Đà Lạt" |
| `route_bkk.png` | Bangkok: Wat Arun, tuk-tuk, floating-market boat — "Bangkok" |
| `route_icn.png` | Seoul: N Seoul Tower, hanok roofs, cherry blossoms — "Seoul" |
| `route_nrt.png` | Tokyo: Tokyo Tower, Mt Fuji in distance, red torii — "Tokyo" |
| `route_cdg.png` | Paris: Eiffel Tower, café table, baguettes — "Paris" |

Thêm 6 ảnh lễ cho thông báo ngày lễ (512×512, trang lịch xé): `holiday_tet.png` (kumquat tree, red envelopes, apricot blossom) · `holiday_hungkings.png` (incense, temple roof, flag) · `holiday_0430.png` (flags and fireworks, "30/4 – 1/5") · `holiday_0209.png` (red flag with yellow star, lanterns, fireworks, "2/9") · `holiday_midautumn.png` (star lantern, mooncake, full moon) · `holiday_christmas.png` (tiny pine tree with paper planes as ornaments). Prompt: `[Khối A] Tear-off calendar page illustration for [TÊN LỄ], centered, transparent background around the page`.

---

## G. Minh hoạ 8 nâng cấp (256×256, nền trong suốt, mỗi món trên một khay tròn kraft)

`up_comfy_chairs.png` velvet waiting chair · `up_fan.png` retro desk fan · `up_fast_printer.png` turbo ticket printer with speed lines · `up_search_filter.png` magnifier over a flight list · `up_airline_relations.png` handshake with a tiny airplane tail logo · `up_refund_policy.png` seat with a return-arrow coin · `up_bigger_counter.png` wide wooden counter with extra stools · `up_loyalty_board.png` wooden board with pinned star notes. Prompt: `[Khối A] Game shop item illustration of [MÓN], on a round kraft tray, transparent background, readable at 128px`.

---

## H. Nền màn hình (720×1280, không chữ)

| Tên file | Prompt |
|---|---|
| `bg_title.png` | `[Khối A] Portrait background: cozy night airport hall seen through a big arched window, runway lights as small amber dots, soft window glow, a few paper planes drifting, warm cream-to-biscuit palette with deep brown silhouettes, empty centre area for a logo, no text` |
| `bg_counter.png` | `[Khối A] Portrait background for a ticket counter: wooden counter top in the lower third, hanging paper lanterns, departure board silhouette in the back with blank panels, warm lamp light, empty middle for characters, no text` |
| `bg_prep.png` | `[Khối A] Portrait background: back-office stockroom with kraft boxes, ticket rolls, a window with morning light, shelves, calm and tidy, large empty centre, no text` |
| `bg_summary.png` | `[Khối A] Portrait background: cozy evening kiosk interior, lamp, steaming tea cup and biscuits on the desk, closed shutter, soft dusk light, empty centre for a receipt card, no text` |
| `bg_shop.png` | `[Khối A] Portrait background: small decoration workshop, wooden shelves with tiny pots and tools, pegboard, warm light, empty centre for item cards, no text` |

---

## I. Thành phần UI và đồ vật (nền trong suốt)

| Tên file | Kích thước | Prompt |
|---|---|---|
| `ticket_template.png` | 720×420 | Boarding-ticket template, kraft paper colour, semicircle notches left and right, dashed perforation vertical line, empty fields with faint guide lines, tiny barcode strip, slight −2° tilt, NO text |
| `stamp_over_cap.png` | 400×200 | Rubber stamp "VƯỢT TRẦN" in brick red #B5503A, double border, slightly tilted −6°, distressed ink edges |
| `stamp_approved.png` | 400×200 | Rubber stamp "ĐÃ DUYỆT" in pine green, tilted +4° |
| `stamp_expired.png` | 400×200 | Rubber stamp "HẾT HẠN" in brick red, tilted −5° |
| `passport_open.png` | 600×420 | Opened navy-brown passport booklet seen from the top, left page with an empty photo frame and gold crest, right page with blank lines, no text |
| `printer.png` | 512×384 | Chunky retro ticket printer with a slot and a roll holder, cream and walnut |
| `counter_desk.png` | 720×300 | Front view of a wooden kiosk counter top with a small brass bell and a tea cup |
| `coin.png` | 128×128 | Single gold coin with a star, front view; plus `coin_spin_1..4.png` 4 frames of a spinning coin |
| `star_big.png` | 256×256 | Big pop star with a cream highlight, used for the summary rating; `star_big_empty.png` empty version |
| `plane_paper.png` | 256×256 | Paper plane flying diagonally with a dotted trail |
| `seat_tiles.png` | 512×256 | 4 seat tiles in a row on a transparent background: available (walnut), sold (faded + check), taken (kraft grey), selected (terracotta with a glow ring) |
| `bubble_9slice.png` | 192×192 | Speech bubble 9-slice with rounded tail variant, cream fill, espresso outline 3px, stretchable centre |
| `button_pill_set.png` | 1024×512 | Pill buttons in rows: walnut, terracotta, teal, spruce, cream-ghost, disabled-grey — each normal and pressed, with the 5px extruded base, NO text |
| `toggle_slider_set.png` | 1024×256 | Carved wooden toggle (off/on), slider track + butter-sphere thumb, stepper minus/plus buttons |
| `panel_9slice.png` | 192×192 | Panel/card 9-slice: biscuit fill, 2px walnut border, solid 4px espresso bottom extrusion, rounded corners 24px |
| `weather_banners.png` | 1440×240 | Three horizontal banners: sunny, rainy, stormy, in the same style, no text |

---

## J. Cân hành lý bấm giữ (thiết kế mới)

```
[Khối A] Game UI element: a "hold-to-weigh" baggage scale gauge. A wide wooden track with a carved groove,
tick marks at 15, 20 and 30 kg with small suitcase icons, a round chunky terracotta thumb with a suitcase
handle shape riding on the track, a big readable number above it, and a soft pulsing ring around the thumb to
show it is being pressed. Provide 3 states in one sheet: idle (walnut thumb), holding (terracotta thumb
enlarged with glowing ring), locked (thumb with a small leaf check). No text except numbers 15, 20, 30 and kg.
Transparent background.
```

---

## K. Nhắc khi nhận ảnh

- Ảnh nào chữ tiếng Việt sai dấu: cứ để chữ trống rồi tôi đặt chữ bằng font trong game.
- Gửi tôi thư mục ảnh (hoặc đường dẫn); tôi sẽ gom thành atlas `public/assets/atlas/*`, ghi nguồn/giấy phép vào `public/assets/CREDITS.md` và thay avatar vẽ bằng code.
