import { describe, expect, it } from 'vitest';
import { makeOrder } from '@domain/__integration__/fixtures';
import { orderRequestLines } from './orderRequest';

const valueOf = (lines: ReturnType<typeof orderRequestLines>, label: string): string | undefined => lines.find((line) => line.label === label)?.value;

describe('orderRequestLines', () => {
  it('lists the destination, cabin and says "no request" for everything optional on a plain order', () => {
    const lines = orderRequestLines(makeOrder({ routeId: 'HAN-DAD' }));
    expect(valueOf(lines, 'Điểm đến')).toBe('Đà Nẵng');
    expect(valueOf(lines, 'Hạng vé')).toBe('Phổ thông');
    expect(valueOf(lines, 'Giờ bay')).toBe('Giờ nào cũng được');
    expect(valueOf(lines, 'Chỗ ngồi')).toBe('Không yêu cầu');
    expect(valueOf(lines, 'Hành lý')).toBe('Không có');
    expect(valueOf(lines, 'Yêu cầu thêm')).toBe('Không có');
    expect(lines.filter((line) => line.demanding).map((line) => line.label)).toEqual(['Điểm đến', 'Hạng vé']);
  });

  it('spells out cabin, time, seat zone, baggage and extras and marks them as demanding', () => {
    const lines = orderRequestLines(
      makeOrder({ routeId: 'HAN-SGN', cabin: 'BUSINESS', timePref: 'LATE', seatPref: 'BACK', baggageKg: 20, extras: ['VEG_MEAL', 'INSURANCE'] }),
    );
    expect(valueOf(lines, 'Hạng vé')).toBe('Thương gia');
    expect(valueOf(lines, 'Giờ bay')).toBe('Chuyến khuya');
    expect(valueOf(lines, 'Chỗ ngồi')).toBe('Cuối khoang');
    expect(valueOf(lines, 'Hành lý')).toBe('20 kg');
    expect(valueOf(lines, 'Yêu cầu thêm')).toBe('Suất ăn chay, Bảo hiểm chuyến bay');
    expect(lines.every((line) => line.demanding)).toBe(true);
  });
});
