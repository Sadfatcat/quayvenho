import { describe, expect, it } from 'vitest';
import { makeFlight } from './__integration__/fixtures';
import { needsSupport, supportGift } from './safetyNet';

describe('needsSupport', () => {
  it('is true when money is below 3x the cheapest unlocked route ECONOMY cost', () => {
    // HAN-DAD ECONOMY cost = 50, threshold = 150
    expect(needsSupport(149, ['HAN-SGN', 'HAN-DAD'])).toBe(true);
    expect(needsSupport(150, ['HAN-SGN', 'HAN-DAD'])).toBe(false);
    expect(needsSupport(151, ['HAN-SGN', 'HAN-DAD'])).toBe(false);
  });

  it('picks the cheapest of the unlocked routes for the threshold', () => {
    // Only HAN-SGN unlocked, ECONOMY cost = 70, threshold = 210
    expect(needsSupport(200, ['HAN-SGN'])).toBe(true);
    expect(needsSupport(210, ['HAN-SGN'])).toBe(false);
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
