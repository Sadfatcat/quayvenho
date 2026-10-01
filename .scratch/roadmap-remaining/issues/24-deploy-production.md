# 24: Deploy production

**What to build:** Game chạy thật trên Cloudflare Pages, mở được từ link thật trên điện thoại (Android và iPhone) — đây cũng là việc còn nợ từ Giai đoạn 0.

**Blocked by:** 23

**Status:** chờ chủ dự án — cần tài khoản Cloudflare; hướng dẫn ở docs/DEPLOY.md

- [ ] Deploy `dist/` lên Cloudflare Pages thật (cần chủ dự án có tài khoản Cloudflare — có thể là việc [TAY] chủ dự án tự làm phần đăng nhập/kết nối repo)
- [ ] Áp dụng kết quả D8 ở wayfinder map (`*.pages.dev` hay tên miền riêng)
- [ ] Link production chạy đúng trên cả iPhone và Android, không lỗi console

## Kết quả
- [x] Chuẩn bị: `docs/DEPLOY.md` (các bước Cloudflare Pages), `public/_headers` (no-cache cho `sw.js`/manifest/html, cache dài cho `assets/*`).
- [ ] Deploy thật + kiểm link trên iPhone/Android: cần chủ dự án (tài khoản Cloudflare). D8 mặc định `*.pages.dev`.
