import { describe, expect, it } from 'vitest';
import { rollDayEvent, resolveWeather } from './events';
import { needsSupport, supportGift } from './safetyNet';
import { generateFlights } from './schedule';
import { checkRouteUnlock, checkUpgrade, computeModifiers } from './upgrades';

describe('computeModifiers', () => {
  it('base values without upgrades', () => {
    expect(computeModifiers([])).toMatchObject({ patienceMult: 1, tipMult: 1, printMs: 3000, queueMax: 4, refundRate: 0 });
  });

  it('multipliers stack by product, others override', () => {
    const mods = computeModifiers(['COMFY_CHAIRS', 'FAN', 'FAST_PRINTER', 'BIGGER_COUNTER', 'REFUND_POLICY', 'AIRLINE_RELATIONS', 'SEARCH_FILTER', 'LOYALTY_BOARD']);
    expect(mods.patienceMult).toBeCloseTo(1.32);
    expect(mods).toMatchObject({ tipMult: 1.15, printMs: 1500, queueMax: 6, refundRate: 0.3, seatBias: true, searchFilter: true });
  });
});

describe('shop checks', () => {
  const ctx = { day: 5, money: 100000, travelViet: 4.5 };

  it('upgrade: owned once, day and TravelViet conditions, money', () => {
    expect(checkUpgrade('FAN', [], ctx).ok).toBe(true);
    expect(checkUpgrade('FAN', ['FAN'], ctx)).toEqual({ ok: false, reason: 'ALREADY_OWNED' });
    expect(checkUpgrade('AIRLINE_RELATIONS', [], { ...ctx, day: 2 })).toEqual({ ok: false, reason: 'DAY_TOO_EARLY' });
    expect(checkUpgrade('LOYALTY_BOARD', [], ctx)).toEqual({ ok: false, reason: 'TRAVELVIET_LOCKED' });
    expect(checkUpgrade('LOYALTY_BOARD', [], { ...ctx, day: 11, travelViet: 4.2 })).toEqual({ ok: false, reason: 'TRAVELVIET_TOO_LOW' });
    expect(checkUpgrade('LOYALTY_BOARD', [], { ...ctx, day: 11 }).ok).toBe(true);
    expect(checkUpgrade('FAN', [], { ...ctx, money: 2249 })).toEqual({ ok: false, reason: 'NOT_ENOUGH_MONEY' });
    expect(checkUpgrade('NOPE', [], ctx)).toEqual({ ok: false, reason: 'UNKNOWN_UPGRADE' });
  });

  it('route: TravelViet routes locked before day 11', () => {
    const unlocked = ['HAN-SGN', 'HAN-DAD'];
    expect(checkRouteUnlock('HAN-CXR', unlocked, ctx)).toEqual({ ok: true, value: 3750 });
    expect(checkRouteUnlock('HAN-SGN', unlocked, ctx)).toEqual({ ok: false, reason: 'ALREADY_UNLOCKED' });
    expect(checkRouteUnlock('HAN-BKK', unlocked, ctx)).toEqual({ ok: false, reason: 'TRAVELVIET_LOCKED' });
    expect(checkRouteUnlock('HAN-BKK', unlocked, { ...ctx, day: 11, travelViet: 3.7 })).toEqual({ ok: false, reason: 'TRAVELVIET_TOO_LOW' });
    expect(checkRouteUnlock('HAN-BKK', unlocked, { ...ctx, day: 11 })).toEqual({ ok: true, value: 12000 });
    expect(checkRouteUnlock('HAN-PQC', unlocked, { ...ctx, money: 10 })).toEqual({ ok: false, reason: 'NOT_ENOUGH_MONEY' });
    expect(checkRouteUnlock('XXX', unlocked, ctx)).toEqual({ ok: false, reason: 'UNKNOWN_ROUTE' });
  });
});

describe('events', () => {
  it('rates converge: RUSH 15%, WEATHER 25%, NONE 60%; weather 40/40/20', () => {
    const counts = { RUSH: 0, WEATHER: 0, NONE: 0 };
    const weather = { GOOD: 0, BAD: 0, SEVERE: 0 };
    const n = 20_000;
    for (let seed = 1; seed <= n; seed++) {
      const event = rollDayEvent(seed, 1 + (seed % 30), ['HAN-SGN', 'HAN-DAD']);
      counts[event.type]++;
      if (event.type === 'WEATHER') {
        expect(['HAN-SGN', 'HAN-DAD']).toContain(event.routeId);
        expect(event.outcome).toBeNull();
      }
      weather[resolveWeather(seed, 3)]++;
    }
    expect(counts.RUSH / n).toBeCloseTo(0.15, 1);
    expect(counts.WEATHER / n).toBeCloseTo(0.25, 1);
    expect(weather.GOOD / n).toBeCloseTo(0.4, 1);
    expect(weather.SEVERE / n).toBeCloseTo(0.2, 1);
  });

  it('is deterministic', () => {
    expect(rollDayEvent(9, 4, ['HAN-SGN'])).toEqual(rollDayEvent(9, 4, ['HAN-SGN']));
  });
});

describe('safety net', () => {
  const routes = ['HAN-SGN', 'HAN-DAD'];

  it('triggers below 3 × cheapest ECO cost', () => {
    expect(needsSupport(2189, routes)).toBe(true);
    expect(needsSupport(2190, routes)).toBe(false);
  });

  it('gifts 3 free ECO seats on the earliest cheapest-route flight', () => {
    const flights = generateFlights(1, 1, routes);
    const gift = supportGift(1, 1, flights, [], routes);
    expect(gift?.flight.routeId).toBe('HAN-DAD');
    expect(gift?.flight.departAt).toBe(1290);
    expect(gift?.seats).toHaveLength(3);
    expect(gift?.seats.every((s) => s.unitCost === 0 && s.cabin === 'ECONOMY')).toBe(true);
    expect(supportGift(1, 1, flights.map((f) => ({ ...f, status: 'CANCELLED' as const })), [], routes)).toBeNull();
  });
});
