import { describe, expect, it } from 'vitest';
import {
  bulkDiscountRate,
  businessTip,
  clampPenalty,
  fareOf,
  inflationStep,
  makeTx,
  moneyBalances,
  purchaseCost,
  refundFor,
  penaltyFor,
  routeOnDay,
  scaledFee,
  seatUnitCost,
  roundMoney,
  summarizeDay,
  ticketRevenue,
} from './economy';
import { makeOrder as order } from './__integration__/fixtures';
import type { DayEvent, OwnedSeat, ScoreResult } from './models';
import { BUSINESS_TIP_RATIO, PENALTY_GRACE_MULT, PENALTY_GRACE_UNTIL_DAY } from '@data/balance';
import { COST_RISE_PER_STEP, FARE_RISE_PER_STEP } from '@data/pricing';
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

  it('ticket revenue = fare + baggage + extras (§5.3)', () => {
    const dad = getRoute('HAN-DAD');
    expect(ticketRevenue(order(), dad, 0, 1)).toBe(1100);
    expect(ticketRevenue(order({ baggageKg: 20, extras: ['VEG_MEAL', 'INSURANCE'] }), dad, 0, 1)).toBe(1100 + 380 + 80 + 230);
    expect(ticketRevenue(order({ cabin: 'BUSINESS', extras: ['WHEELCHAIR'] }), dad, 0, 1)).toBe(2700);
  });

  it('fare follows the player price adjustment, rounded to whole k', () => {
    const dad = getRoute('HAN-DAD');
    expect(fareOf(dad, 'ECONOMY', 30)).toBe(1430);
    expect(fareOf(dad, 'ECONOMY', -20)).toBe(880);
    expect(fareOf(dad, 'ECONOMY', 40)).toBe(1540);
    expect(fareOf(dad, 'ECONOMY', 3)).toBe(1133);
  });

  it('business tip = BUSINESS_TIP_RATIO × fare × tipMult', () => {
    expect(businessTip(190, 1)).toBe(Math.round(BUSINESS_TIP_RATIO * 190));
    expect(businessTip(190, 1.15)).toBe(Math.round(BUSINESS_TIP_RATIO * 190 * 1.15));
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
      makeTx('TICKET_REFUND', -60, 2, 700, 'x'),
      makeTx('TICKET_REFUND', -40, 2, 710, 'y'),
    ];
    const results: ScoreResult[] = [
      { customerId: 'a', outcome: 'PERFECT', stars: 5, revenue: 90, tip: 152, penalty: 0, mistakes: [], overCap: false },
      { customerId: 'b', outcome: 'LEFT', stars: 1, revenue: 0, tip: 0, penalty: 10, mistakes: [], overCap: false },
    ];
    const summary = summarizeDay({
      day: 2,
      moneyStart: 500,
      moneyEnd: 282,
      transactions: txs,
      seats: [seat('EXPIRED', 50), seat('LOST', 70), seat('SOLD', 50)],
      results,
      turnedAway: 3,
      travelVietAfter: null,
    });
    expect(moneyBalances(500, txs, 282)).toBe(true);
    expect(summary).toMatchObject({
      ticketRevenue: 90,
      tips: 152,
      seatCost: 200,
      shopCost: 150,
      penalties: 25,
      cancelledTickets: 2,
      cancelRefunds: 100,
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

describe('routeOnDay (lạm phát giá vé mỗi 3 ngày)', () => {
  const route = getRoute('HAN-DAD');

  it('giữ nguyên giá bảng ở ngày 1–3', () => {
    expect(routeOnDay(route, 1)).toEqual(route);
    expect(routeOnDay(route, 3)).toEqual(route);
  });

  it('tăng giá bán và giá vốn cùng FARE_RISE/COST_RISE mỗi bậc, làm tròn số nguyên', () => {
    const day4 = routeOnDay(route, 4);
    expect(day4.price.ECONOMY).toBe(Math.round(route.price.ECONOMY * (1 + FARE_RISE_PER_STEP)));
    expect(day4.cost.ECONOMY).toBe(Math.round(route.cost.ECONOMY * (1 + COST_RISE_PER_STEP)));
    const day10 = routeOnDay(route, 10);
    expect(day10.price.BUSINESS).toBe(Math.round(route.price.BUSINESS * (1 + FARE_RISE_PER_STEP) ** 3));
    expect(day10.cost.BUSINESS).toBe(Math.round(route.cost.BUSINESS * (1 + COST_RISE_PER_STEP) ** 3));
  });

  it('bậc lạm phát đổi đúng ở ngày 4, 7, 10', () => {
    expect([1, 3, 4, 6, 7, 10].map(inflationStep)).toEqual([0, 0, 1, 1, 2, 3]);
  });
});

describe('seatUnitCost (dự báo thời tiết xấu giảm 50% giá vốn)', () => {
  const dad = getRoute('HAN-DAD');
  const forecastOnDad: DayEvent = { type: 'WEATHER', routeId: 'HAN-DAD', outcome: null };

  it('halves the cost only for the forecast route', () => {
    const base = routeOnDay(dad, 1).cost.ECONOMY;
    expect(seatUnitCost(dad, 'ECONOMY', 1, forecastOnDad)).toBe(Math.round(base * 0.5));
    expect(seatUnitCost(getRoute('HAN-SGN'), 'ECONOMY', 1, forecastOnDad)).toBe(routeOnDay(getRoute('HAN-SGN'), 1).cost.ECONOMY);
  });

  it('keeps full price without a weather event', () => {
    expect(seatUnitCost(dad, 'BUSINESS', 1, { type: 'NONE' })).toBe(routeOnDay(dad, 1).cost.BUSINESS);
  });
});

describe('scaledFee (phí dịch vụ lạm phát cùng giá vé)', () => {
  it('giữ nguyên ở bậc 0 và tăng theo FARE_RISE_PER_STEP mỗi bậc', () => {
    expect(scaledFee(300, 1)).toBe(300);
    expect(scaledFee(300, 4)).toBe(Math.round(300 * (1 + FARE_RISE_PER_STEP)));
    expect(scaledFee(300, 10)).toBe(Math.round(300 * (1 + FARE_RISE_PER_STEP) ** 3));
  });
});

describe('penaltyFor (ân hạn những ngày đầu)', () => {
  it('nhân hệ số ân hạn đến hết ngày PENALTY_GRACE_UNTIL_DAY rồi phạt đủ', () => {
    expect(penaltyFor(1000, 0.2, PENALTY_GRACE_UNTIL_DAY)).toBe(Math.round(1000 * 0.2 * PENALTY_GRACE_MULT));
    expect(penaltyFor(1000, 0.2, PENALTY_GRACE_UNTIL_DAY + 1)).toBe(200);
  });
});
