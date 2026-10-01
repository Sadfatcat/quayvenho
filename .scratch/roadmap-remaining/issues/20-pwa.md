# 20: PWA

**What to build:** Game cài đặt được như app (installable) và chơi được khi mất mạng (offline), dùng `vite-plugin-pwa` đã có trong stack.

**Blocked by:** 19

**Status:** resolved — chưa cài thử trên điện thoại thật (ticket 23)

- [ ] `vite.config.ts` cấu hình `vite-plugin-pwa`; `platform/pwa.ts` mới nếu cần logic riêng
- [ ] Installable trên điện thoại thật (Android Chrome, iOS Safari "Add to Home Screen")
- [ ] Chơi được offline sau lần load đầu tiên
- [ ] Icon PWA 192/512/maskable ở `public/icons`

## Kết quả
- [x] `vite.config.ts` cấu hình `vite-plugin-pwa` (`registerType: 'prompt'`, manifest standalone/portrait, precache js/css/html/png/woff2); `platform/pwa.ts` + `scenes/overlays/UpdatePrompt.ts` hỏi "Có bản mới — Tải lại?" chỉ ở Title/Summary/Shop.
- [x] Icon 192, 512, maskable 512, apple-touch 180 ở `public/icons` (sinh bằng `scripts/generateIcons.mjs`).
- [x] Offline: `npm run build` + `preview`, SW `activated`, tải lại khi offline vẫn vào được Title (Playwright, Chromium).
- [ ] Cài đặt trên điện thoại thật (Android Chrome, iOS Add to Home Screen): chưa kiểm, thuộc ticket 23.
