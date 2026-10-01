# Triển khai lên Cloudflare Pages

Việc này cần tài khoản Cloudflare của chủ dự án nên Claude Code không tự làm được. Repo đã sẵn sàng: `npm run build` ra `dist/` (có service worker và manifest), `public/_headers` đặt cache đúng cho `sw.js`.

## Các bước (làm một lần)

1. Vào Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, chọn repo `Sadfatcat/quayvenho`.
2. Cấu hình build:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Biến môi trường: `NODE_VERSION` = `22` (hoặc bản đang dùng ở máy: `node --version`)
3. Bấm **Save and Deploy**. Mỗi lần push lên `main` Cloudflare tự build lại.
4. Mở link `https://<tên-dự-án>.pages.dev` trên điện thoại.

## Tên miền (PLAN §15 D8)

Mặc định dùng `*.pages.dev`. Muốn tên miền riêng: Pages → Custom domains → thêm domain, làm theo hướng dẫn DNS.

## Kiểm sau deploy

- Mở trên iPhone (Safari) và Android (Chrome), không lỗi console.
- Cài thử: Android "Thêm vào màn hình chính", iOS Chia sẻ → "Thêm vào MH chính".
- Tắt mạng rồi mở lại: vẫn vào được game.
- Điền kết quả vào `tests/e2e-manual.md`.
