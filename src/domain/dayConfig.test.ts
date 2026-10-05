import { describe, expect, it } from 'vitest';
import { PATIENCE_MIN_MS, PATIENCE_SCALE } from '@data/days';
import { getDayConfig, isMechanicOpen } from './dayConfig';
import { SEAT_MARGIN_BY_ROUTE } from '@data/balance';
import { getRoute, routeNumber, startingRouteIds } from './routes';

describe('getDayConfig', () => {
  it('uses the exact row when present', () => {
    expect(getDayConfig(4).pBusiness).toBe(0.2);
    expect(getDayConfig(4).patienceBaseMs).toBe(Math.round(44000 * PATIENCE_SCALE));
  });

  it('falls back to the nearest lower row', () => {
    expect(getDayConfig(7).pSeatPref).toBe(0.55);
    expect(getDayConfig(7).day).toBe(7);
    expect(getDayConfig(9).maxComplexity).toBe(5);
  });

  it('decays patience by 2% per day from day 11, floored at PATIENCE_MIN_MS', () => {
    expect(getDayConfig(10).patienceBaseMs).toBe(Math.round(36000 * PATIENCE_SCALE));
    expect(getDayConfig(11).patienceBaseMs).toBe(Math.round(36000 * 0.98 * PATIENCE_SCALE));
    expect(getDayConfig(12).patienceBaseMs).toBe(Math.round(36000 * 0.98 ** 2 * PATIENCE_SCALE));
    expect(getDayConfig(200).patienceBaseMs).toBe(PATIENCE_MIN_MS);
  });

  it('rejects invalid days', () => {
    expect(() => getDayConfig(0)).toThrow();
    expect(() => getDayConfig(1.5)).toThrow();
  });
});

describe('isMechanicOpen', () => {
  it('opens on the configured day', () => {
    expect(isMechanicOpen('badPassport', 5)).toBe(false);
    expect(isMechanicOpen('badPassport', 6)).toBe(true);
  });
});

describe('routes', () => {
  it('looks up routes and their stable numbers', () => {
    expect(getRoute('HAN-DAD').cost.ECONOMY).toBe(Math.round((1100 * (1 - (SEAT_MARGIN_BY_ROUTE['HAN-DAD'] ?? 0))) / 10) * 10);
    expect(routeNumber('HAN-SGN')).toBe(1);
    expect(() => getRoute('XXX')).toThrow();
    expect(startingRouteIds()).toEqual(['HAN-SGN', 'HAN-DAD']);
  });
});
