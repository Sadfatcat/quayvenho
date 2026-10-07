import { describe, expect, it } from 'vitest';
import { BUSINESS_TIP_RATIO, OUTCOME_PENALTY_RATE } from '@data/balance';
import { PRICE_CAP_PCT } from '@data/pricing';
import { makeFlight as flight, makeOrder } from './__integration__/fixtures';
import type { Order } from './models';
import { fareOf, penaltyFor, routeOnDay } from './economy';
import { getRoute } from './routes';
import { isPassportValid, scoreCustomer, type DeliveredTicket, type ScoreInput } from './scoring';

const order = (patch: Partial<Order> = {}): Order =>
  makeOrder({ baggageKg: 20, seatPref: 'WINDOW', timePref: 'NIGHT', extras: ['VEG_MEAL'], complexity: 3, ...patch });

const ticket = (patch: Partial<DeliveredTicket> = {}): DeliveredTicket => ({
  flight: flight(), cabin: 'ECONOMY', seat: '5A', baggageKg: 20, extras: ['VEG_MEAL'], ...patch,
});

const score = (patch: Partial<ScoreInput> = {}, orderPatch: Partial<Order> = {}, ticketPatch: Partial<DeliveredTicket> = {}) =>
  scoreCustomer({
    order: order(orderPatch),
    action: { type: 'DELIVER', ticket: ticket(ticketPatch) },
    patienceRatio: 0.9,
    day: 3,
    pricePct: 0,
    tipMult: 1,
    money: 100000,
    ...patch,
  });

const economyFare = (day: number): number => fareOf(routeOnDay(getRoute('HAN-DAD'), day), 'ECONOMY', 0);
const penaltyAt = (day: number, outcome: keyof typeof OUTCOME_PENALTY_RATE): number =>
  penaltyFor(economyFare(day), OUTCOME_PENALTY_RATE[outcome], day);

describe('passport', () => {
  it('expiring today is valid, yesterday is not; names must match', () => {
    const passport = { name: 'A', bookedName: 'A' };
    expect(isPassportValid(passport)).toBe(true);
    expect(isPassportValid({ ...passport, bookedName: 'B' })).toBe(false);
  });
});

describe('scoreCustomer', () => {
  it('PERFECT: 5★, full revenue, no tip for economy', () => {
    expect(score()).toMatchObject({ outcome: 'PERFECT', stars: 5, revenue: 1100 + 380 + 80, tip: 0, penalty: 0, mistakes: [], overCap: false });
  });

  it('accurate but slow is GOOD (4★)', () => {
    expect(score({ patienceRatio: 0.49 })).toMatchObject({ outcome: 'GOOD', stars: 4 });
  });

  it('baggage off by 1 kg is fine, 2 kg is wrong (−30 → GOOD)', () => {
    expect(score({}, {}, { baggageKg: 21 }).outcome).toBe('PERFECT');
    expect(score({}, {}, { baggageKg: 22 })).toMatchObject({ outcome: 'GOOD', stars: 4, mistakes: ['WRONG_BAGGAGE'] });
  });

  it('seat pref −20 → GOOD; extra not requested −5; missing extra −15', () => {
    expect(score({}, {}, { seat: '5B' })).toMatchObject({ outcome: 'GOOD', mistakes: ['WRONG_SEAT_PREF'] });
    expect(score({}, {}, { extras: ['VEG_MEAL', 'INSURANCE'] })).toMatchObject({ outcome: 'GOOD', mistakes: ['EXTRA_NOT_REQUESTED'] });
    expect(score({}, {}, { extras: [] })).toMatchObject({ outcome: 'GOOD', mistakes: ['MISSING_EXTRA'] });
  });

  it('exactly 80 stays GOOD (no float drift): missing −15 + extra −5', () => {
    expect(score({}, {}, { extras: ['INSURANCE'] })).toMatchObject({ outcome: 'GOOD' });
  });

  it('POOR (<50): 1★, no revenue', () => {
    expect(score({}, {}, { baggageKg: 0, seat: '5B', extras: [] })).toMatchObject({
      outcome: 'POOR', stars: 1, revenue: 0, tip: 0, penalty: 0,
    });
  });

  it('BUSINESS deductions double; PERFECT BUSINESS tips BUSINESS_TIP_RATIO × fare', () => {
    const biz = { cabin: 'BUSINESS' as const };
    expect(score({}, biz, biz)).toMatchObject({ outcome: 'PERFECT', revenue: 2700 + 380 + 80, tip: Math.round(BUSINESS_TIP_RATIO * 2700) });
    expect(score({}, biz, { ...biz, seat: '1B' })).toMatchObject({ outcome: 'OK', tip: 0 });
    expect(score({ tipMult: 1.15, pricePct: 20 }, biz, biz).tip).toBe(Math.round(BUSINESS_TIP_RATIO * 2700 * 1.2 * 1.15));
  });

  it('FAILED on wrong route / cabin / time window: 1★, penalty scales with fare', () => {
    expect(score({}, {}, { flight: flight({ routeId: 'HAN-SGN' }) })).toMatchObject({
      outcome: 'FAILED', stars: 1, revenue: 0, penalty: penaltyAt(3, 'FAILED'), mistakes: ['WRONG_ROUTE'],
    });
    expect(score({}, {}, { cabin: 'BUSINESS' }).mistakes).toEqual(['WRONG_CABIN']);
    expect(score({}, {}, { flight: flight({ departAt: 1470 }) }).mistakes).toEqual(['WRONG_TIME']);
  });

  it('SOLD_INVALID when selling to a bad passport', () => {
    const misnamed = { passport: { name: 'A', bookedName: 'B' } };
    expect(score({ day: 6 }, misnamed)).toMatchObject({ outcome: 'SOLD_INVALID', stars: 1, penalty: penaltyAt(6, 'SOLD_INVALID'), revenue: 0 });
  });

  it('refusals: correct, no stock, wrong', () => {
    const refuse = (canServe: boolean, orderPatch: Partial<Order> = {}) =>
      scoreCustomer({ order: order(orderPatch), action: { type: 'REFUSE', canServe }, patienceRatio: 1, day: 6, pricePct: 0, tipMult: 1, money: 10000 });
    expect(refuse(true, { passport: { name: 'A', bookedName: 'B' } })).toMatchObject({ outcome: 'REFUSED_CORRECT', stars: 5, tip: 0 });
    expect(refuse(false)).toMatchObject({ outcome: 'REFUSED_NO_STOCK', stars: 4, penalty: 0 });
    expect(refuse(true)).toMatchObject({ outcome: 'REFUSED_WRONG', stars: 1, penalty: penaltyAt(6, 'REFUSED_WRONG') });
  });

  it('LEFT: 1★, penalty scales with fare, clamped to money', () => {
    const left = (money: number) =>
      scoreCustomer({ order: order(), action: { type: 'LEFT' }, patienceRatio: 0, day: 6, pricePct: 0, tipMult: 1, money });
    expect(left(1000)).toMatchObject({ outcome: 'LEFT', stars: 1, penalty: penaltyAt(6, 'LEFT') });
    expect(left(40).penalty).toBe(40);
    expect(left(0).penalty).toBe(0);
  });
});

describe('penalty scales with ticket price', () => {
  it('charges more for a pricier fare and uses the inflated fare of the day', () => {
    const left = (patch: Partial<Order>, pricePct = 0) =>
      scoreCustomer({ order: order(patch), action: { type: 'LEFT' }, patienceRatio: 0, day: 3, pricePct, tipMult: 1, money: 1_000_000 }).penalty;
    expect(left({ cabin: 'BUSINESS' })).toBeGreaterThan(left({}));
    expect(left({}, 20)).toBeGreaterThan(left({}));
    expect(left({ routeId: 'HAN-CDG' })).toBeGreaterThan(left({}));
  });
});

describe('over-cap pricing', () => {
  it('marks tickets sold above the price cap as overCap, still charging the higher fare', () => {
    expect(score({ pricePct: PRICE_CAP_PCT }).overCap).toBe(false);
    const overPct = PRICE_CAP_PCT + 10;
    const over = score({ pricePct: overPct });
    expect(over.overCap).toBe(true);
    expect(over.revenue).toBe(Math.round(1100 * (1 + overPct / 100)) + 380 + 80);
  });
});
