import { describe, expect, it } from 'vitest';
import { SEAT_VALID_DAYS } from '@data/balance';
import { canServe, routeHasAvailableSeat } from './canServe';
import { purchaseCost } from './economy';
import { getRoute } from './routes';
import {
  carryOverSeats,
  expireAvailable,
  freeSeatsFor,
  giftSeats,
  holdSeat,
  loseSeats,
  maxPurchasable,
  pendingKey,
  pendingTotalCost,
  pickSeats,
  purchasePending,
  releaseHeld,
  seatExpiryDayFor,
  seatsExpiringOn,
  sellHeld,
} from './inventory';
import { makeFlight } from './__integration__/fixtures';
import type { DayEvent, Flight, OwnedSeat } from './models';
import { createRng } from './rng';
import { isWindow, seatsOfCabin } from './seatMap';

const DAD_ECONOMY_COST = getRoute('HAN-DAD').cost.ECONOMY;

const flight = (patch: Partial<Flight> = {}): Flight => makeFlight({ takenByOthers: ['3A', '3B', '1A'], ...patch });

const owned = (seat: OwnedSeat['seat'], state: OwnedSeat['state'] = 'AVAILABLE', patch: Partial<OwnedSeat> = {}): OwnedSeat => ({
  flightId: 'QV201',
  seat,
  cabin: 'ECONOMY',
  unitCost: 50,
  expiresDay: 3,
  state,
  ...patch,
});

const buy = (pending: Record<string, number>, money = 100000, seats: OwnedSeat[] = [], flights = [flight()]) =>
  purchasePending({ pending, flights, seats, money, bias: 'BALANCED', rng: createRng(1) });

describe('inventory: weather forecast discount', () => {
  it('charges and records half the unit cost on the forecast route', () => {
    const event: DayEvent = { type: 'WEATHER', routeId: 'HAN-DAD', outcome: null };
    const pending = { [pendingKey('QV201', 'ECONOMY')]: 5 };
    const half = Math.round(DAD_ECONOMY_COST * 0.5);
    const result = purchasePending({ pending, flights: [flight()], seats: [], money: 100000, bias: 'BALANCED', rng: createRng(1), event });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalCost).toBe(purchaseCost(half, 5));
    expect(result.value.seats.every((s) => s.unitCost === half)).toBe(true);
    expect(pendingTotalCost(pending, [flight()], 1, event)).toBe(purchaseCost(half, 5));
  });
});

describe('inventory: purchase', () => {
  it('free seats exclude other agents and owned seats', () => {
    const free = freeSeatsFor(flight(), 'ECONOMY', [owned('4A')]);
    expect(free).not.toContain('3A');
    expect(free).not.toContain('4A');
    expect(free).toHaveLength(32 - 2 - 1);
  });

  it('limit is 12 ECO / 4 BIZ per flight minus owned', () => {
    expect(maxPurchasable(flight(), 'ECONOMY', [])).toBe(12);
    expect(maxPurchasable(flight(), 'BUSINESS', [])).toBe(4);
    expect(maxPurchasable(flight(), 'ECONOMY', [owned('4A'), owned('4B', 'SOLD')])).toBe(10);
    expect(maxPurchasable(flight({ status: 'CANCELLED' }), 'ECONOMY', [])).toBe(0);
    const crowded = flight({ takenByOthers: seatsOfCabin('BUSINESS').slice(0, 6) });
    expect(maxPurchasable(crowded, 'BUSINESS', [])).toBe(2);
  });

  it('buys with discount and fresh AVAILABLE seats', () => {
    const result = buy({ [pendingKey('QV201', 'ECONOMY')]: 5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalCost).toBe(purchaseCost(DAD_ECONOMY_COST, 5));
    expect(result.value.seats).toHaveLength(5);
    expect(result.value.seats.every((s) => s.state === 'AVAILABLE' && s.unitCost === DAD_ECONOMY_COST)).toBe(true);
    expect(pendingTotalCost({ [pendingKey('QV201', 'ECONOMY')]: 5 }, [flight()])).toBe(purchaseCost(DAD_ECONOMY_COST, 5));
  });

  it('rejects nothing pending, over limit, not enough money, unknown flight', () => {
    expect(buy({})).toEqual({ ok: false, reason: 'NOTHING_PENDING' });
    expect(buy({ [pendingKey('QV201', 'ECONOMY')]: 13 })).toEqual({ ok: false, reason: 'OVER_LIMIT' });
    expect(buy({ [pendingKey('QV201', 'ECONOMY')]: 4 }, 199)).toEqual({ ok: false, reason: 'NOT_ENOUGH_MONEY' });
    expect(buy({ [pendingKey('QV999', 'ECONOMY')]: 1 })).toEqual({ ok: false, reason: 'UNKNOWN_FLIGHT' });
  });

  it('WINDOW bias yields more window seats than AISLE bias', () => {
    const free = seatsOfCabin('ECONOMY');
    const windows = (bias: 'WINDOW' | 'AISLE') => {
      let total = 0;
      for (let seed = 0; seed < 200; seed++) total += pickSeats(free, 10, bias, createRng(seed)).filter(isWindow).length;
      return total;
    };
    expect(windows('WINDOW')).toBeGreaterThan(windows('AISLE') * 2);
    expect(new Set(pickSeats(free, 20, 'WINDOW', createRng(3))).size).toBe(20);
  });
});

describe('inventory: seat states', () => {
  it('hold moves one seat to HELD and releases the previous hold', () => {
    const seats = [owned('4A'), owned('4B')];
    const first = holdSeat(seats, 'QV201', 'ECONOMY', '4A');
    expect(first.ok && first.value.map((s) => s.state)).toEqual(['HELD', 'AVAILABLE']);
    if (!first.ok) return;
    const second = holdSeat(first.value, 'QV201', 'ECONOMY', '4B');
    expect(second.ok && second.value.map((s) => s.state)).toEqual(['AVAILABLE', 'HELD']);
  });

  it('reassigns a spare unit to any chosen seat of the cabin', () => {
    const result = holdSeat([owned('4A')], 'QV201', 'ECONOMY', '5A');
    expect(result.ok && result.value.map((s) => [s.seat, s.state])).toEqual([['5A', 'HELD']]);
    expect(holdSeat([owned('4A')], 'QV201', 'ECONOMY', '99A').ok).toBe(false);
  });

  it('cannot hold sold, foreign or wrong-cabin seats', () => {
    expect(holdSeat([owned('4A', 'SOLD')], 'QV201', 'ECONOMY', '4A').ok).toBe(false);
        expect(holdSeat([owned('4A')], 'QV201', 'BUSINESS', '4A').ok).toBe(false);
  });

  it('release, sell, expire', () => {
    const seats = [owned('4A', 'HELD'), owned('4B')];
    expect(releaseHeld(seats).map((s) => s.state)).toEqual(['AVAILABLE', 'AVAILABLE']);
    expect(sellHeld(seats).map((s) => s.state)).toEqual(['SOLD', 'AVAILABLE']);
    expect(expireAvailable(sellHeld(seats), 3).map((s) => s.state)).toEqual(['SOLD', 'EXPIRED']);
  });

  it('weather loss: BAD loses round(n/3), SEVERE loses all, only on given flights', () => {
    const seats = [owned('4A'), owned('4B'), owned('4C'), owned('5A', 'SOLD'), owned('6A', 'AVAILABLE', { flightId: 'QV101' })];
    const bad = loseSeats(seats, ['QV201'], 1 / 3, createRng(1));
    expect(bad.lost).toHaveLength(1);
    const severe = loseSeats(seats, ['QV201'], 1, createRng(1));
    expect(severe.lost).toHaveLength(3);
    expect(severe.seats.find((s) => s.seat === '6A')?.state).toBe('AVAILABLE');
    expect(severe.seats.find((s) => s.seat === '5A')?.state).toBe('SOLD');
    expect(loseSeats([owned('4A')], ['QV201'], 1 / 3, createRng(1)).lost).toHaveLength(0);
  });

  it('gift seats are free and capped by free seats', () => {
    const gift = giftSeats(flight(), 'ECONOMY', 3, [], createRng(2), 1);
    expect(gift).toHaveLength(3);
    expect(gift.every((s) => s.unitCost === 0 && s.state === 'AVAILABLE')).toBe(true);
    const full = flight({ takenByOthers: seatsOfCabin('ECONOMY').slice(0, 31) });
    expect(giftSeats(full, 'ECONOMY', 3, [], createRng(2), 1)).toHaveLength(1);
  });
});

describe('canServe', () => {
  const flights = [flight(), flight({ id: 'QV205', departAt: 1530 })];
  const base = { routeId: 'HAN-DAD', cabin: 'ECONOMY', timePref: 'ANY' } as const;

  it('needs a scheduled flight in window with an AVAILABLE seat of the cabin', () => {
    const seats = [owned('4A', 'AVAILABLE', { flightId: 'QV205' })];
    expect(canServe(base, flights, seats)).toBe(true);
    expect(canServe({ ...base, timePref: 'LATE' }, flights, seats)).toBe(true);
    expect(canServe({ ...base, timePref: 'NIGHT' }, flights, seats)).toBe(false);
    expect(canServe({ ...base, cabin: 'BUSINESS' }, flights, seats)).toBe(false);
    expect(canServe({ ...base, routeId: 'HAN-SGN' }, flights, seats)).toBe(false);
    expect(canServe(base, flights, [owned('4A', 'SOLD', { flightId: 'QV205' })])).toBe(false);
  });

  it('cancelled flights never serve', () => {
    const cancelled = [flight({ status: 'CANCELLED' })];
    expect(canServe(base, cancelled, [owned('4A')])).toBe(false);
    expect(routeHasAvailableSeat('HAN-DAD', cancelled, [owned('4A')])).toBe(false);
    expect(routeHasAvailableSeat('HAN-DAD', [flight()], [owned('4A')])).toBe(true);
  });

  describe('hạn dùng của ghế', () => {
    it('ghế mua ngày D dùng được tới hết ngày D + SEAT_VALID_DAYS - 1', () => {
      expect(seatExpiryDayFor(5)).toBe(5 + SEAT_VALID_DAYS - 1);
    });

    it('purchasePending gán đúng hạn dùng theo ngày mua', () => {
      const result = purchasePending({ pending: { [pendingKey('QV201', 'ECONOMY')]: 2 }, flights: [flight()], seats: [], money: 10_000, bias: 'BALANCED', rng: createRng(1), day: 4 });
      expect(result.ok && result.value.seats.every((seat) => seat.expiresDay === 4 + SEAT_VALID_DAYS - 1)).toBe(true);
    });

    it('cuối ngày chỉ ghế tới hạn mới hết hạn, ghế còn hạn và ghế đã bán giữ nguyên', () => {
      const seats = [owned('4A', 'AVAILABLE', { expiresDay: 2 }), owned('4B', 'AVAILABLE', { expiresDay: 3 }), owned('4C', 'SOLD', { expiresDay: 2 })];
      expect(expireAvailable(seats, 2).map((seat) => seat.state)).toEqual(['EXPIRED', 'AVAILABLE', 'SOLD']);
    });

    it('seatsExpiringOn chỉ đếm ghế còn bán được hết hạn đúng ngày đó', () => {
      const seats = [owned('4A', 'AVAILABLE', { expiresDay: 3 }), owned('4B', 'AVAILABLE', { expiresDay: 3 }), owned('4C', 'AVAILABLE', { expiresDay: 4 }), owned('4D', 'SOLD', { expiresDay: 3 })];
      expect(seatsExpiringOn(seats, 3)).toBe(2);
    });

    it('carryOverSeats chỉ mang ghế còn bán được và còn hạn sang ngày mới', () => {
      const seats = [
        owned('4A', 'AVAILABLE', { expiresDay: 3 }),
        owned('4B', 'AVAILABLE', { expiresDay: 1 }),
        owned('4C', 'SOLD', { expiresDay: 3 }),
        owned('4D', 'EXPIRED', { expiresDay: 3 }),
        owned('5A', 'LOST', { expiresDay: 3 }),
      ];
      const carried = carryOverSeats(seats, 1, [flight()], createRng(1));
      expect(carried.map((seat) => seat.seat)).toEqual(['4A']);
    });

    it('carryOverSeats đổi ghế trùng với ghế đại lý khác đã lấy sang ghế còn trống, không mất ghế nào', () => {
      const seats = [owned('3A', 'AVAILABLE', { expiresDay: 3 }), owned('4A', 'AVAILABLE', { expiresDay: 3 })];
      const nextDay = flight({ takenByOthers: ['3A', '1A'] });
      const carried = carryOverSeats(seats, 1, [nextDay], createRng(1));
      expect(carried).toHaveLength(2);
      expect(carried.every((seat) => !nextDay.takenByOthers.includes(seat.seat))).toBe(true);
      expect(new Set(carried.map((seat) => seat.seat)).size).toBe(2);
      expect(carried.every((seat) => seat.expiresDay === 3 && seat.unitCost === 50)).toBe(true);
    });
  });
});
