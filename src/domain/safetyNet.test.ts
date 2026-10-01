import { describe, expect, it } from 'vitest';
import { getRoute } from './routes';
import { makeFlight } from './__integration__/fixtures';
import { needsSupport, supportGift } from './safetyNet';

describe('needsSupport', () => {
  it('is true when money is below 3x the cheapest unlocked route ECONOMY cost', () => {
    // HAN-DAD là tuyến ECONOMY rẻ nhất: ngưỡng = 3 × giá vốn
    const threshold = 3 * getRoute('HAN-DAD').cost.ECONOMY;
    expect(needsSupport(threshold - 1, ['HAN-SGN', 'HAN-DAD'])).toBe(true);
    expect(needsSupport(threshold, ['HAN-SGN', 'HAN-DAD'])).toBe(false);
    expect(needsSupport(threshold + 1, ['HAN-SGN', 'HAN-DAD'])).toBe(false);
  });

  it('picks the cheapest of the unlocked routes for the threshold', () => {
    // Chỉ mở HAN-SGN: ngưỡng = 3 × giá vốn ECONOMY của SGN
    const threshold = 3 * getRoute('HAN-SGN').cost.ECONOMY;
    expect(needsSupport(threshold - 1, ['HAN-SGN'])).toBe(true);
    expect(needsSupport(threshold, ['HAN-SGN'])).toBe(false);
  });
});

describe('supportGift', () => {
  it('gives free (unitCost 0) ECONOMY seats on the earliest scheduled flight of the cheapest route', () => {
    const flights = [
      makeFlight({ id: 'LATE', routeId: 'HAN-DAD', departAt: 1470, status: 'SCHEDULED' }),
      makeFlight({ id: 'EARLY', routeId: 'HAN-DAD', departAt: 1290, status: 'SCHEDULED' }),
      makeFlight({ id: 'OTHER', routeId: 'HAN-SGN', departAt: 1290, status: 'SCHEDULED' }),
    ];
    const gift = supportGift(1, 1, flights, [], ['HAN-SGN', 'HAN-DAD']);
    expect(gift?.flight.id).toBe('EARLY');
    expect(gift?.seats.length).toBe(3);
    expect(gift?.seats.every((seat) => seat.unitCost === 0 && seat.cabin === 'ECONOMY' && seat.state === 'AVAILABLE')).toBe(true);
  });

  it('returns null when the cheapest route has no scheduled flight', () => {
    const flights = [makeFlight({ id: 'CANCELLED', routeId: 'HAN-DAD', status: 'CANCELLED' })];
    expect(supportGift(1, 1, flights, [], ['HAN-SGN', 'HAN-DAD'])).toBeNull();
  });
});
