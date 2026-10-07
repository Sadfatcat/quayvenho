import { describe, expect, it } from 'vitest';
import { makeOrder } from '@domain/__integration__/fixtures';
import { orderSpeech } from './orderRequest';

describe('orderSpeech', () => {
  it('only names the destination and cabin for a plain order, without "no request" filler', () => {
    const speech = orderSpeech(makeOrder({ routeId: 'HAN-DAD' }));
    expect(speech).toContain('Đà Nẵng');
    expect(speech).toContain('phổ thông');
    expect(speech).not.toMatch(/khuya|tối|ngồi|hành lý|thêm|không/);
  });

  it('mentions time, seat zone, baggage and extras naturally when the customer cares about them', () => {
    const speech = orderSpeech(
      makeOrder({ routeId: 'HAN-SGN', cabin: 'BUSINESS', timePref: 'LATE', seatPref: 'BACK', baggageKg: 20, extras: ['VEG_MEAL', 'INSURANCE'] }),
    );
    expect(speech).toContain('thương gia');
    expect(speech).toContain('bay chuyến khuya');
    expect(speech).toContain('ngồi cuối khoang');
    expect(speech).toContain('mang theo 20 kg hành lý');
    expect(speech).toContain('suất ăn chay và bảo hiểm chuyến bay');
    expect(speech.endsWith('.')).toBe(true);
  });

  it('says the same sentence every time for the same customer', () => {
    const order = makeOrder({ routeId: 'HAN-DAD', customerId: 'c-42' });
    expect(orderSpeech(order)).toBe(orderSpeech(order));
  });
});
