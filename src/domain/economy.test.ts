import { describe, expect, it } from 'vitest';
import {
  bulkDiscountRate,
  businessTip,
  clampPenalty,
  makeTx,
  moneyBalances,
  purchaseCost,
  refundFor,
  roundMoney,
  summarizeDay,
  ticketRevenue,
} from './economy';
import { makeOrder as order } from './__integration__/fixtures';
import type { OwnedSeat, ScoreResult } from './models';
import { getRoute } from './routes';

const seat = (state: OwnedSeat['state'], unitCost: number): OwnedSeat => ({
  flightId: 'QV201',
  seat: '5A',
  cabin: 'ECONOMY',
  unitCost,
  state,
});

describe('economy', () => {
  it('roundMoney is an integer ≥ 0', () => {
    expect(roundMoney(12.5)).toBe(13);
    expect(roundMoney(-3)).toBe(0);
  });

  it('bulk discount at qty 4/5/9/10', () => {
    expect(bulkDiscountRate(4)).toBe(0);
    expect(bulkDiscountRate(5)).toBe(0.05);
    expect(bulkDiscountRate(9)).toBe(0.05);
    expect(bulkDiscountRate(10)).toBe(0.1);
    expect(purchaseCost(50, 4)).toBe(200);
    expect(purchaseCost(50, 5)).toBe(238);
    expect(purchaseCost(50, 10)).toBe(450);
  });

  it('ticket revenue = fare + baggage + extras (§5.3), RUSH ×1.2', () => {
    const dad = getRoute('HAN-DAD');
    expect(ticketRevenue(order(), dad, false)).toBe(75);
    expect(ticketRevenue(order(), dad, true)).toBe(90);
    expect(ticketRevenue(order({ baggageKg: 20, extras: ['VEG_MEAL', 'INSURANCE'] }), dad, false)).toBe(75 + 25 + 20);
    expect(ticketRevenue(order({ cabin: 'BUSINESS', extras: ['WHEELCHAIR'] }), dad, false)).toBe(190);
  });

  it('business tip = 0.8 × fare × tipMult', () => {
    expect(businessTip(190, 1)).toBe(152);
    expect(businessTip(190, 1.15)).toBe(175);
  });

  it('penalty clamps to money', () => {
    expect(clampPenalty(40, 15)).toBe(15);
    expect(clampPenalty(10, 100)).toBe(10);
  });

  it('refund 30% of expired unit costs', () => {
    expect(refundFor([seat('EXPIRED', 50), seat('EXPIRED', 70)], 0.3)).toBe(36);
    expect(refundFor([], 0.3)).toBe(0);
  });

  it('summarizeDay aggregates and keeps the money invariant', () => {
    const txs = [
      makeTx('UPGRADE_PURCHASE', -150, 2, null, 'FAN'),
      makeTx('SEAT_PURCHASE', -200, 2, null),
      makeTx('TICKET_REVENUE', 90, 2, 500),
      makeTx('TIP', 152, 2, 500),
      makeTx('PENALTY', -25, 2, 600),
      makeTx('REFUND_EXPIRED', 15, 2, null),
      makeTx('WEATHER_LOSS', 0, 2, 480, 'HAN-DAD'),
    ];
    const results: ScoreResult[] = [
      { customerId: 'a', outcome: 'PERFECT', stars: 5, revenue: 90, tip: 152, penalty: 0, mistakes: [] },
      { customerId: 'b', outcome: 'LEFT', stars: 1, revenue: 0, tip: 0, penalty: 10, mistakes: [] },
    ];
    const summary = summarizeDay({
      day: 2,
      moneyStart: 500,
      moneyEnd: 382,
      transactions: txs,
      seats: [seat('EXPIRED', 50), seat('LOST', 70), seat('SOLD', 50)],
      results,
      turnedAway: 3,
      travelVietAfter: null,
    });
    expect(moneyBalances(500, txs, 382)).toBe(true);
    expect(summary).toMatchObject({
      ticketRevenue: 90,
      tips: 152,
      seatCost: 200,
      shopCost: 150,
      penalties: 25,
      refunds: 15,
      expiredSeats: 1,
      expiredCost: 50,
      weatherLostSeats: 1,
      weatherLostCost: 70,
      served: 1,
      left: 1,
      turnedAway: 3,
      avgStars: 3,
    });
  });

  it('empty day has avgStars 0', () => {
    const summary = summarizeDay({
      day: 1, moneyStart: 0, moneyEnd: 0, transactions: [], seats: [], results: [], turnedAway: 0, travelVietAfter: null,
    });
    expect(summary.avgStars).toBe(0);
  });
});
