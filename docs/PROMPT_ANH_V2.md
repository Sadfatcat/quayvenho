# Prompt tạo lại ảnh (bản 2) — độ phân giải cao, mỗi ảnh một prompt

Thay cho `PROMPT_ANH.md` ở các ảnh sau: **khách (nhất là biểu cảm giận), Béo, logo, icon, nền, nút/bảng**. Rút kinh nghiệm từ sheet đầu: ảnh quá nhỏ (~100px), "angry" không giận, nền trong suốt bị răng cưa.

## 0. Quy tắc chung (đọc trước)

1. **Mỗi lần chạy = 1 ảnh** (hoặc 1 nhóm nhỏ ≤ 6 món cùng loại). Đừng gộp cả sheet 50 ảnh như lần trước.
2. **Độ phân giải:** nhân vật/icon xuất 1024×1024 trở lên; nền 1440×2560 (tỉ lệ 9:16); logo 2048 rộng. Nếu công cụ chỉ ra 1024, dùng "upscale ×2" rồi mới tải.
3. **Tham chiếu phong cách:** đính kèm 1 khách đẹp và Béo từ sheet cũ (`DESIGN/.../ảnh/...png`, ảnh Béo greeting và khách c01 happy) với ghi chú "match this exact art style, line weight and colours".
4. **Nền:** yêu cầu nền trắng tinh `#FFFFFF` (không bóng, không đổ bóng) rồi tôi tách nền bằng công cụ; hoặc nền trong suốt nếu công cụ làm sạch. Không dùng nền có hoạ tiết.
5. **Khối phong cách (S)** dán đầu mọi prompt. **Negative (N)** dán vào ô "negative / avoid" hoặc cuối prompt.

### S — Khối phong cách

```
Cute chibi tactile game art in a warm cozy Vietnamese airport-kiosk theme. Flat colours with a subtle paper
grain, thick warm espresso-brown outline (#4A3525) of uniform weight, rounded pillowy shapes, ONE flat shadow
tone, no gradients, no glossy highlights, no blurry drop shadows, no neon. Palette: cream #FDF6EC, biscuit
#F5E8D3, kraft #E6D2B5, walnut #6C4F3D, terracotta #C86D51, faded teal #5B8A8C, pine green #6E8B74, amber #B8862B.
Big head, small body, large flat eyes with one white highlight, rosy cheeks. Clean crisp edges, high resolution,
centered, generous margin, pure white #FFFFFF background, no ground shadow.
```

### N — Negative

`photo, realistic, 3d render, glossy, neon, harsh black outline, jagged edges, halo, background texture, text, watermark, signature, blurry, low resolution, extra limbs, cropped`

---

## 1. Béo — hà mã dẫn truyện (tạo trước, 1 ảnh/lần, 1024×1024)

**Mô tả cố định (dán vào mọi prompt Béo):**
`Béo: a round chubby friendly hippo mascot, soft mauve-grey skin, cream belly, tiny round ears, small cute nostrils, big shiny dark eyes, rosy cheeks, a small striped teal neckerchief, a tiny blue-teal airline-staff cap tilted on his head, short stubby arms and legs.`

| File | Prompt (sau S + mô tả Béo) |
|---|---|
| `beo_greeting.png` | full body, standing, waving one hand, big warm smile, eyes closed in happy arcs |
| `beo_excited.png` | full body, both hands up, jumping slightly, mouth wide open in joy, gold sparkles around |
| `beo_sly.png` | three-quarter body, one eyebrow raised, sly smirk, hand rubbing chin |
| `beo_worried.png` | three-quarter body, sweat drop, wobbly worried mouth, hands clasped together |
| `beo_pointing.png` | full body, pointing right with one hand, encouraging smile |
| `beo_proud.png` | full body, hands on hips, chest out, confident grin, small star above head |
| `beo_sad.png` | three-quarter body, drooping ears, teary eyes, small frown |
| `beo_thinking.png` | three-quarter body, finger on chin, looking up, small thought bubble with a lightbulb |
| `beo_bust.png` | head-and-shoulders portrait for dialogue box, friendly smile, slightly turned |

Mỗi biểu cảm một lần chạy. Chọn 1 ảnh Béo ưng nhất làm **ảnh tham chiếu nhân vật** (`--cref` / "same character") cho các ảnh còn lại.

---

## 2. Khách hàng — mỗi biểu cảm một ảnh (1024×1024, bust, nhìn chính diện)

Cấu trúc prompt: `[S] Chibi bust portrait (head and shoulders) of [MÔ TẢ], front view, [BIỂU CẢM].`

**Ba biểu cảm — viết đúng như sau, đặc biệt bản giận:**

| Biểu cảm | Đoạn dán vào `[BIỂU CẢM]` |
|---|---|
| `happy` | `big warm smile, eyes curved into happy arcs, raised cheeks, relaxed eyebrows` |
| `neutral` | `calm closed small mouth, relaxed half-open eyes, straight eyebrows, no smile, no frown` |
| `angry` | `clearly ANGRY: eyebrows pulled down and inward in sharp V shape, narrowed eyes, mouth in a tight downward frown (NOT smiling, NO open grin), puffed red cheeks, small steam clouds above the head, a vein-pop mark on the forehead` |

Tên file: `cus_<id>_<biểu cảm>.png`. Mô tả từng khách (giữ nguyên trang phục ở cả 3 biểu cảm — khi tạo biểu cảm 2 và 3 hãy dùng ảnh `happy` làm tham chiếu "same character, same outfit, only change the expression"):

| ID | Mô tả `[MÔ TẢ]` |
|---|---|
| c01 | young backpacker boy, messy dark-brown hair, green hoodie, big backpack straps visible |
| c02 | young woman with a neat bob and a beige cap, brown jacket over cream blouse, tote bag strap |
| c03 | studious boy with round black glasses, short black hair, grey collared shirt |
| c04 | girl with long dark hair and pink over-ear headphones, mustard cardigan |
| c05 | boy in a dark-green knit beanie, olive jacket, scarf |
| c06 | woman with a terracotta beret, long brown hair, orange-brown cardigan |
| c07 | blond curly-haired boy, teal hoodie |
| c08 | girl with short brown bob and round glasses, pink sweater with collar |
| c09 | boy with short black hair, dark teal hoodie, relaxed |
| c10 | girl with a cream bucket hat, long brown hair, soft pink blouse |
| c11 | man in black sunglasses and navy suit with tie, short brown hair |
| c12 | woman with long wavy chestnut hair, rose jacket over cream top |
| c13 | boy in a green baseball cap, dark hoodie |
| c14 | woman with sunglasses pushed up on long brown hair, peach trench coat |
| c15 | boy with curly dark-brown hair, blue polo, freckles |
| c16 | young woman with straight dark hair and bangs, light grey-beige cardigan |
| vip1 | man with slicked hair, black sunglasses, dark suit and tie, thin gold ornamental frame around the portrait, tiny sparkles |
| vip2 | woman with long platinum-blond wavy hair, black sunglasses, cream coat, thin gold ornamental frame, tiny sparkles |

Gợi ý tiết kiệm: tạo `happy` trước cho cả 18 khách, chọn ảnh đẹp, rồi với mỗi khách chạy 2 lần nữa (neutral, giận) bằng ảnh `happy` làm tham chiếu.

`cus_queue.png` (2048×512): `[S] six tiny chibi customers standing in a queue, front view, different heights and outfits (backpacker, suited man, grandma, student, tourist, child), evenly spaced, each about 400px tall, white background`.

---

## 3. Logo và icon ứng dụng

| File | Kích thước | Prompt |
|---|---|---|
| `logo_lockup.png` | 2048×1024 | `[S] Game logo lockup: a tiny chibi wooden ticket kiosk with a striped terracotta-and-cream awning, a small paper plane flying out of the window, below it the wordmark "Quầy Vé Nhỏ" in a chunky rounded display font, dark espresso letters with a thin cream outline, correct Vietnamese diacritics (ầ, é, ỏ), small subtitle "săn vé đêm", clean vector look` |
| `logo_mark.png` | 1024×1024 | `[S] Square emblem only, no text: the chibi ticket kiosk with awning and paper plane inside a rounded-square walnut-brown badge with a cream inner border` |
| `app_icon.png` | 1024×1024 | `Simple app icon: a cream boarding ticket with semicircle side notches and a terracotta stripe, a small paper plane in the centre, on a solid walnut-brown #6C4F3D rounded-square background. Very simple, bold, readable at 48px, no text` |
| `app_icon_maskable.png` | 1024×1024 | `Same icon, but the ticket fills only the central 55%; the walnut-brown background fills the entire square edge to edge` |

---

## 4. Icon (mỗi nhóm ≤ 6 icon, mỗi icon một ô, ảnh 2048×1365, ô cách đều)

Prompt chung: `[S] A set of N game icons in a 3×2 grid on white, each icon centered in its own equal cell with wide spacing, thick rounded espresso outline, flat fill, same size, same line weight, no text:` rồi liệt kê.

- **Nhóm 1 (tiền/điểm):** gold coin with a star; five-point star (filled); five-point star (outline only); clock showing 9:00; crescent moon with a tiny star; paper plane.
- **Nhóm 2 (ghế/hành lý):** airplane seat front view; seat next to an oval window; seat with an aisle arrow; small suitcase with a tag; leaf-shaped meal bowl; wheelchair.
- **Nhóm 3 (dịch vụ/giấy tờ):** shield with a check (insurance); passport booklet with a crest; retro ticket printer; boarding ticket with notches; calendar page with a little flag; service bell.
- **Nhóm 4 (sự kiện/thời tiết):** small warm flame (high demand); cloud with sun; cloud with rain; cloud with lightning; plain sun; party bunting flag.
- **Nhóm 5 (giao diện):** padlock; gear; pause symbol; row of five tiny person silhouettes (crowd meter); red notched barrier fence (price cap); circular refund arrow with a coin.
- **Nhóm 6 (khác):** leaf-shaped checkmark in pine green; group of three people; rubber stamp; speech bubble with a question mark; round "i" info badge; rounded warning triangle with "!".

---

## 5. Nền màn hình (1440×2560, dọc, KHÔNG chữ, vùng giữa trống cho giao diện)

| File | Prompt |
|---|---|
| `bg_title.png` | `[S, but with a full painted background instead of white] Portrait background: cozy night airport hall seen through a big arched window, small amber runway lights, a few paper planes drifting, warm cream-to-biscuit palette with deep brown silhouettes, upper-middle area calm and empty for a logo, no text, no characters` |
| `bg_counter.png` | `[S, full background] Portrait background for a ticket counter: wooden counter top in the lower third, hanging paper lanterns, a departure board silhouette at the back with blank panels, warm lamp light, empty middle for characters, no text` |
| `bg_prep.png` | `[S, full background] Portrait background: tidy back-office stockroom with kraft boxes, ticket rolls and shelves, window with morning light, large calm empty centre, no text` |
| `bg_summary.png` | `[S, full background] Portrait background: cozy evening kiosk interior with a lamp, steaming tea cup and biscuits on the desk, dusk light, empty centre for a receipt card, no text` |
| `bg_shop.png` | `[S, full background] Portrait background: small decoration workshop with wooden shelves, tiny pots and tools, pegboard, warm light, empty centre for item cards, no text` |

(Với nền không dùng "pure white background" của khối S — thay bằng "full painted background".)

---

## 6. Thành phần giao diện (mỗi ảnh một lần chạy, 1024 px trở lên, nền trắng)

| File | Prompt |
|---|---|
| `ui_buttons.png` | `[S] A column of 6 pill buttons without any text, each with a solid extruded bottom base: walnut brown, terracotta, faded teal, pine green, cream outline, disabled grey. Show normal state on the left and pressed state (sunk 3px) on the right, equal spacing` |
| `ui_panel.png` | `[S] Empty rounded panel/card for UI: biscuit fill, 2px walnut border, solid 4px espresso bottom extrusion, 24px corner radius, no text` |
| `ui_bubble.png` | `[S] Empty cream speech bubble with a thick espresso outline and a short rounded tail at the bottom-left, no text` |
| `ui_toggle_slider.png` | `[S] UI parts: carved wooden toggle switch (off and on), horizontal slider track with a butter-sphere thumb, round minus and plus stepper buttons, equal spacing, no text` |
| `ui_ticket.png` | `[S] Boarding-ticket template in kraft paper colour, semicircle notches on both sides, dashed perforation line, empty fields with faint guide lines, small barcode strip, no text` |
| `ui_stamps.png` | `[S] Three rubber stamps with distressed ink edges: "VƯỢT TRẦN" in brick red tilted −6°, "ĐÃ DUYỆT" in pine green tilted +4°, "HẾT HẠN" in brick red tilted −5°, correct Vietnamese diacritics` |
| `ui_passport.png` | `[S] Opened navy-brown passport booklet seen from above, left page with an empty photo frame and gold crest, right page with blank lines, no text` |
| `ui_printer.png` | `[S] Chunky retro ticket printer with a slot and a roll holder, cream and walnut brown, front three-quarter view` |
| `ui_scale.png` | `[S] Game UI: a hold-to-weigh baggage scale gauge — wide wooden track with a carved groove, tick marks at 15, 20 and 30 with small suitcase icons, a round chunky thumb; three states stacked vertically: idle (walnut thumb), holding (terracotta thumb enlarged with a glowing ring), locked (thumb with a small leaf check). Numbers only, no other text` |

---

## 7. Bưu thiếp 9 tuyến và 6 ảnh ngày lễ

Giữ nguyên prompt ở `docs/PROMPT_ANH.md` mục F (bưu thiếp, 1920×1080) nhưng thêm ở cuối: `high resolution, crisp edges, kraft border, no jagged edges`. Ảnh lễ: xuất 1024×1024, nền trắng.

---

## 8. Khi gửi lại cho tôi

- Đặt tên đúng như cột "File", bỏ vào `DESIGN/stitch_chibi_game_ui_design/ảnh2/` (một thư mục, nhiều file lẻ).
- Tôi sẽ tách nền, gom atlas, thay ảnh trong game và cập nhật `public/assets/CREDITS.md`.
