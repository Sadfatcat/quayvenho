# 17: Tutorial

**What to build:** Một overlay hướng dẫn (Béo dùng SpeechBubble) dẫn người chơi qua các bước đầu tiên của từng cơ chế mới, đủ bảng hướng dẫn theo PLAN §10.11.

**Blocked by:** 14

**Status:** ready-for-agent

- [ ] `scenes/overlays/TutorialOverlay.ts` mới, dùng lại `SpeechBubble` đã có
- [ ] Đủ các mốc hướng dẫn trong bảng §10.11 (ví dụ lần đầu có RUSH, lần đầu có dự báo thời tiết...)
- [ ] Không lặp lại hướng dẫn đã xem (dùng `flags` đã có trong GameState)
