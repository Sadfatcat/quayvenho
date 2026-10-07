import { describe, expect, it } from 'vitest';
import { makeOrder } from '@domain/__integration__/fixtures';
import { orderSpeech, orderSpeechSegments } from './orderRequest';

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

  it('marks the destination, cabin and every wish as key segments and leaves the filler words unmarked', () => {
    const order = makeOrder({ routeId: 'HAN-SGN', cabin: 'BUSINESS', timePref: 'LATE', seatPref: 'BACK', baggageKg: 20, extras: ['VEG_MEAL'] });
    const key = orderSpeechSegments(order).filter((segment) => segment.key).map((segment) => segment.text);
    expect(key).toEqual(expect.arrayContaining(['thương gia', 'bay chuyến khuya', 'ngồi cuối khoang', 'mang theo 20 kg hành lý', 'suất ăn chay']));
    expect(key.some((text) => text.includes('Sài Gòn') || text.includes('Hồ Chí Minh'))).toBe(true);
    const filler = orderSpeechSegments(order).filter((segment) => !segment.key).map((segment) => segment.text).join('');
    expect(filler).toMatch(/mình/);
    expect(filler).not.toMatch(/khuya|cuối khoang|thương gia/);
  });
});
