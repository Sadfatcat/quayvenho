# Prompt tạo ảnh: con dấu, vé dịch vụ, chồng vé, dụng cụ nâng cấp

Dùng cho Gemini / ChatGPT / Midjourney. Mỗi lần xuất một **lưới đồng nhất**, nền trắng tinh, các món cách đều nhau, không đổ bóng ra nền. Sau đó đưa file vào `tools/` để cắt (cùng quy trình với ảnh nhân vật).

## 0. Phong cách chung (dán vào đầu mọi prompt)

> Chibi cozy game asset, flat vector-like illustration with soft thick outlines in dark chocolate brown (#4A3525), warm terracotta / kraft-paper palette (cream #FFF6E5, kraft #E6D2B5, terracotta #C86D51, teal #5B8A8C), subtle paper texture, slightly rounded shapes, top-down 3/4 view like a tiny shop counter in a cozy management game. No text unless specified, no watermark, no background, pure white background, each item separated by wide white margin, same scale and same lighting for all items.

## 1. Con dấu điểm đến (9 cái)

Cần dùng cho số lượng điểm đến tăng dần, nên mỗi con dấu = **thân dấu cao su có tay cầm gỗ** (cùng một kiểu, chỉ đổi mặt dấu và màu mực). Mặt dấu in ngược khi nhìn trực diện là không cần; chỉ cần vẽ mặt dấu nhìn từ trên xuống kèm hình in rõ.

> [Phong cách chung] A grid of 9 rubber travel stamps, 3 columns x 3 rows. Each stamp: wooden round handle on top, kraft rubber base below, all identical shape and size. Each base carries a simple bold emblem (single colour ink) of one Vietnamese or international destination, framed in a rounded rectangle:
> 1. Ho Chi Minh City — Landmark 81 tower + lotus, orange ink (#F2994A)
> 2. Da Nang — Dragon Bridge, sky blue ink (#56CCF2)
> 3. Nha Trang — Tháp Bà Ponagar + waves, green ink (#6FCF97)
> 4. Phu Quoc — palm tree on island, deep blue ink (#2D9CDB)
> 5. Da Lat — pine tree + small cottage, purple ink (#BB6BD9)
> 6. Bangkok — golden temple spire (Wat Arun), red ink (#EB5757)
> 7. Seoul — N Seoul Tower + hanok roof, yellow ink (#F2C94C)
> 8. Tokyo — Tokyo Tower + cherry blossom, pink ink (#FF8FAB)
> 9. Paris — Eiffel Tower, violet ink (#9B51E0)
> No letters inside the emblems.

Xuất thêm: **vết đóng dấu** (dấu in lên giấy) của từng điểm đến, cùng lưới 3x3, mực hơi lem, hơi nghiêng 5 độ, nền trắng.

## 2. Con dấu giờ bay (5 cái)

> [Phong cách chung] A row of 5 rubber time stamps, same wooden-handle shape as the destination stamps but base is teal (#5B8A8C). Each base shows a simple clock face / moon icon: 21:30 (dusk, small moon rising), 22:30 (moon), 23:30 (moon + stars), 00:30 (full moon high), 01:30 (moon + sleeping cloud). No digits drawn — the digits are added by the game.

## 3. Vé dịch vụ (3 cái)

> [Phong cách chung] 3 small paper service coupons, ticket-shaped with perforated edge, each with one icon: (1) meal tray with a vegetarian dish, green accent; (2) wheelchair symbol, blue accent; (3) shield with a plane, amber accent. Same size, slightly tilted, paper clip hole at the top.

## 4. Chồng vé (2 chồng, giống chồng cốc)

> [Phong cách chung] 2 stacks of blank airline ticket cards viewed from the front like stacked paper cups: left stack in teal (economy), right stack in terracotta (business) with a thin gold stripe. 8 cards per stack, each card offset slightly upward, rounded corners, a small plane icon on the top card. Two images, stack bases aligned.

## 5. Dụng cụ nâng cấp (8 cái)

Đúng với 8 nâng cấp đang có trong `src/data/upgrades.ts`. Lưới 4x2, icon cùng cỡ.

> [Phong cách chung] 8 shop-upgrade items as separate objects, 4 columns x 2 rows, each on its own small round kraft plate:
> 1. COMFY_CHAIRS — cushioned waiting-room armchair
> 2. FAN — small standing desk fan with ribbon
> 3. FAST_PRINTER — compact ticket printer with a ticket coming out and tiny lightning sparkle
> 4. SEARCH_FILTER — magnifying glass over a list of flights
> 5. AIRLINE_RELATIONS — handshake with a small plane badge
> 6. REFUND_POLICY — coin purse with a return arrow
> 7. BIGGER_COUNTER — wider wooden counter with a bell
> 8. LOYALTY_BOARD — small chalkboard with five stars and a heart

## 6. Quy cách xuất

- PNG, mỗi món cách nhau ≥ 64 px, nền trắng thuần (tool tách nền tự động).
- Kích thước tối thiểu 1024 px mỗi cạnh lưới.
- Giữ nguyên thứ tự trong prompt để tool ghép đúng tên file (`stamp_sgn`, `stamp_dad`, …, `time_2130`, `service_meal`, …, `upgrade_fan`, …).
- Khi có thêm điểm đến mới, chỉ cần vẽ thêm một con dấu đúng kiểu mục 1 (cùng tay cầm, cùng cỡ).
