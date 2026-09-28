# Quầy Vé Nhỏ

Game web mô phỏng quầy bán vé máy bay, chơi trên trình duyệt điện thoại (màn dọc). Một món quà cá nhân — không thương mại, không multiplayer.

## Lối chơi

- **Đầu ngày:** mua trước các lô ghế. Ghế có "hạn dùng" — máy bay cất cánh là ghế chưa bán mất giá trị.
- **Trong ngày:** khách đến quầy với yêu cầu riêng. Đọc yêu cầu, lắp vé cho đúng trước khi khách hết kiên nhẫn.
- **Cuối ngày:** xem tổng kết lời/lỗ, dùng tiền nâng cấp quầy.

Đặc tả đầy đủ: [docs/PLAN.md](docs/PLAN.md).

## Công nghệ

- TypeScript (strict), Vite, Phaser 3
- Vitest, ESLint, Prettier
- zod (validate save/import)
- vite-plugin-pwa (cài lên màn hình chính, chơi offline)
- Lưu game bằng `localStorage`, không có backend
- Deploy tĩnh lên Cloudflare Pages

## Chạy dự án

Yêu cầu: Node.js 24 (xem `.nvmrc`).

```bash
npm install
npm run dev
```

Test trên điện thoại cùng mạng Wi-Fi:

```bash
npm run dev:host
```

Mở địa chỉ LAN được in ra trên điện thoại, chấp nhận chứng chỉ HTTPS tự ký.

## Lệnh

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run dev:host` | Dev server mở ra LAN + HTTPS tự ký |
| `npm run build` | Typecheck + build production vào `dist/` |
| `npm run preview` | Chạy bản build |
| `npm run test` | Chạy test (Vitest) |
| `npm run test:watch` | Test ở chế độ watch |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run sim` | Mô phỏng kinh tế bằng bot, in bảng thống kê |

## Cấu trúc

```
src/
  domain/   # logic game thuần TypeScript, không phụ thuộc Phaser/trình duyệt
  data/     # nội dung game: tuyến bay, config theo ngày, nâng cấp, sự kiện, chuỗi tiếng Việt
  scenes/   # Phaser scenes, chỉ render và chuyển input thành command
docs/
  PLAN.md       # đặc tả game
  STATUS.md     # trạng thái hiện tại
  DECISIONS.md  # nhật ký quyết định kỹ thuật
```

## Deploy

Cloudflare Pages, kết nối repo GitHub:

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → chọn repo.
2. Framework preset: None. Build command: `npm run build`. Build output directory: `dist`.
3. Node version: đọc từ `.nvmrc` (24). Nếu Cloudflare không nhận, thêm biến môi trường `NODE_VERSION=24`.
4. Save and Deploy. Mỗi lần push nhánh chính sẽ tự deploy; link dạng `https://<tên-dự-án>.pages.dev`.

Deploy tay không qua Git: `npm run build`, rồi `npx wrangler pages deploy dist`.

## Dành cho người phát triển / AI agent

Quy tắc kiến trúc, quy trình theo phase và Definition of Done nằm trong [CLAUDE.md](CLAUDE.md).
