import { describe, expect, it } from 'vitest';
import { makeOrder } from '@domain/__integration__/fixtures';
import { formatOrderRequest } from './orderRequest';

describe('formatOrderRequest', () => {
  it('says only the route for a plain order', () => {
    expect(formatOrderRequest(makeOrder({ routeId: 'HAN-DAD' }))).toBe('Cho mình vé đi Đà Nẵng.');
  });

  it('adds cabin, baggage, seat and time preferences in a natural sentence', () => {
    const order = makeOrder({ routeId: 'HAN-DAD', cabin: 'BUSINESS', baggageKg: 20, seatPref: 'WINDOW', timePref: 'NIGHT' });
    expect(formatOrderRequest(order)).toBe('Cho mình vé đi Đà Nẵng, hạng thương gia, mang theo 20kg hành lý, ngồi cạnh cửa sổ, chuyến tối.');
  });

  it('lists extras after the main request', () => {
    const order = makeOrder({ routeId: 'HAN-SGN', extras: ['VEG_MEAL', 'INSURANCE'] });
    expect(formatOrderRequest(order)).toBe('Cho mình vé đi TP. Hồ Chí Minh. Cho mình thêm suất ăn chay, bảo hiểm.');
  });
});
