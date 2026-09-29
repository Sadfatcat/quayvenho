# 09: Lưới an toàn

**What to build:** Khi người chơi bị kẹt (hết tiền và không đủ ghế để mua/phục vụ khách), game tự phát hiện và tặng ghế để tránh softlock, kèm hộp thoại giải thích cho người chơi biết vì sao được tặng.

**Blocked by:** 05, 06

**Status:** ready-for-agent

- [ ] Phát hiện đúng tình huống kẹt (hết tiền, không mua nổi ghế nào)
- [ ] Hộp thoại kích hoạt lưới an toàn hiện rõ ràng, dễ hiểu
- [ ] Ép hết tiền (debug/test): được tặng đúng số ghế theo `SAFETY_NET_GIFT_SEATS`, ghi nhận SUPPORT_GIFT trong transaction log (số 0, chỉ ghi nhận)
- [ ] Test đơn vị cho điều kiện kích hoạt lưới an toàn
