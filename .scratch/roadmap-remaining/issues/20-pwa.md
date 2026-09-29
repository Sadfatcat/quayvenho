# 20: PWA

**What to build:** Game cài đặt được như app (installable) và chơi được khi mất mạng (offline), dùng `vite-plugin-pwa` đã có trong stack.

**Blocked by:** 19

**Status:** ready-for-agent

- [ ] `vite.config.ts` cấu hình `vite-plugin-pwa`; `platform/pwa.ts` mới nếu cần logic riêng
- [ ] Installable trên điện thoại thật (Android Chrome, iOS Safari "Add to Home Screen")
- [ ] Chơi được offline sau lần load đầu tiên
- [ ] Icon PWA 192/512/maskable ở `public/icons`
