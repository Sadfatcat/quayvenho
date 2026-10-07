import {
  BAGGAGE_FEES,
  BULK_DISCOUNT_TIERS,
  BUSINESS_TIP_RATIO,
  EXTRA_FEES,
  PENALTY_GRACE_MULT,
  PENALTY_GRACE_UNTIL_DAY,
  SEAT_BIAS_COST_MULT,
} from '@data/balance';
import { WEATHER_FORECAST_COST_DISCOUNT } from '@data/events';
import { COST_RISE_PER_STEP, FARE_RISE_EVERY_DAYS, FARE_RISE_PER_STEP } from '@data/pricing';
import { sum } from './common/math';
import type {
  CabinClass,
  DayEvent,
  DaySummary,
  Extra,
  SeatBias,
  Order,
  OwnedSeat,
  Route,
  ScoreResult,
  Transaction,
  TxType,
} from './models';

/** The only rounding point for money: integer, never negative. */
export const roundMoney = (value: number): number => Math.max(0, Math.round(value));

export const bulkDiscountRate = (qty: number): number =>
  BULK_DISCOUNT_TIERS.find((tier) => qty >= tier.minQty)?.rate ?? 0;

export const purchaseCost = (unitCost: number, qty: number): number =>
  roundMoney(unitCost * qty * (1 - bulkDiscountRate(qty)));

/** Bậc lạm phát của ngày: ngày 1–3 là 0, 4–6 là 1, … */
export const inflationStep = (day: number): number => Math.floor((Math.max(1, day) - 1) / FARE_RISE_EVERY_DAYS);

/** Giá bảng (bán và vốn) của tuyến vào một ngày cụ thể, đã tăng theo bậc lạm phát; làm tròn ở đây. */
export const routeOnDay = (route: Route, day: number): Route => {
  const step = inflationStep(day);
  if (step === 0) return route;
  const fareScale = (1 + FARE_RISE_PER_STEP) ** step;
  const costScale = (1 + COST_RISE_PER_STEP) ** step;
  return {
    ...route,
    price: { ECONOMY: roundMoney(route.price.ECONOMY * fareScale), BUSINESS: roundMoney(route.price.BUSINESS * fareScale) },
    cost: { ECONOMY: roundMoney(route.cost.ECONOMY * costScale), BUSINESS: roundMoney(route.cost.BUSINESS * costScale) },
  };
};

/** Giá vốn một ghế vào ngày `day`: giá bảng đã lạm phát, giảm nếu tuyến có dự báo thời tiết xấu; làm tròn ở đây. */
export const seatUnitCost = (route: Route, cabin: CabinClass, day: number, event: DayEvent, bias: SeatBias = 'BALANCED'): number => {
  const cost = routeOnDay(route, day).cost[cabin];
  const forecastBad = event.type === 'WEATHER' && event.routeId === route.id;
  const discounted = forecastBad ? cost * (1 - WEATHER_FORECAST_COST_DISCOUNT) : cost;
  return roundMoney(discounted * SEAT_BIAS_COST_MULT[bias]);
};

/** Giá bán thực tế = giá gốc × (1 + % người chơi chỉnh), làm tròn một chỗ duy nhất (đơn vị k). */
export const fareOf = (route: Route, cabin: CabinClass, pricePct: number): number =>
  roundMoney(route.price[cabin] * (1 + pricePct / 100));

/** Phí hành lý và vé dịch vụ tăng theo cùng bậc lạm phát với giá vé (giữ tỉ trọng phí trong doanh thu); làm tròn ở đây. */
export const scaledFee = (baseFee: number, day: number): number => roundMoney(baseFee * (1 + FARE_RISE_PER_STEP) ** inflationStep(day));

export const extraFeeOf = (extra: Extra, day: number): number => scaledFee(EXTRA_FEES[extra], day);

export const ticketRevenue = (order: Order, route: Route, pricePct: number, day: number): number =>
  roundMoney(
    fareOf(route, order.cabin, pricePct) +
      scaledFee(BAGGAGE_FEES[order.baggageKg], day) +
      sum(order.extras.map((extra) => extraFeeOf(extra, day))),
  );

export const businessTip = (fare: number, tipMult: number): number =>
  roundMoney(BUSINESS_TIP_RATIO * fare * tipMult);

/** Phạt = giá vé × tỉ lệ; ân hạn ở những ngày đầu (`PENALTY_GRACE_*`). */
export const penaltyFor = (fare: number, rate: number, day: number): number =>
  roundMoney(fare * rate * (day <= PENALTY_GRACE_UNTIL_DAY ? PENALTY_GRACE_MULT : 1));

export const clampPenalty = (penalty: number, money: number): number => Math.min(penalty, money);

export const refundFor = (seats: readonly OwnedSeat[], rate: number): number =>
  roundMoney(sum(seats.map((seat) => seat.unitCost)) * rate);

export const makeTx = (
  type: TxType,
  amount: number,
  day: number,
  minute: number | null,
  ref?: string,
): Transaction => (ref === undefined ? { type, amount, day, minute } : { type, amount, day, minute, ref });

const totalOf = (transactions: readonly Transaction[], types: readonly TxType[]): number =>
  sum(transactions.filter((tx) => types.includes(tx.type)).map((tx) => tx.amount));

export const netOf = (transactions: readonly Transaction[]): number =>
  sum(transactions.map((tx) => tx.amount));

export const moneyBalances = (moneyStart: number, transactions: readonly Transaction[], moneyEnd: number): boolean =>
  moneyStart + netOf(transactions) === moneyEnd;

const unitCostSum = (seats: readonly OwnedSeat[]): number => sum(seats.map((seat) => seat.unitCost));

export interface DaySummaryInput {
  day: number;
  moneyStart: number;
  moneyEnd: number;
  transactions: readonly Transaction[];
  seats: readonly OwnedSeat[];
  results: readonly ScoreResult[];
  turnedAway: number;
  travelVietAfter: number | null;
}

export const summarizeDay = (input: DaySummaryInput): DaySummary => {
  const { transactions: txs, seats, results } = input;
  const expired = seats.filter((seat) => seat.state === 'EXPIRED');
  const lost = seats.filter((seat) => seat.state === 'LOST');
  const left = results.filter((result) => result.outcome === 'LEFT').length;
  return {
    day: input.day,
    moneyStart: input.moneyStart,
    moneyEnd: input.moneyEnd,
    ticketRevenue: totalOf(txs, ['TICKET_REVENUE']),
    tips: totalOf(txs, ['TIP']),
    seatCost: 0 - totalOf(txs, ['SEAT_PURCHASE']),
    shopCost: 0 - totalOf(txs, ['UPGRADE_PURCHASE', 'ROUTE_UNLOCK', 'STAFF_HIRE', 'STAFF_TRAIN']),
    staffWages: 0 - totalOf(txs, ['STAFF_WAGE']),
    staffNotices: [],
    expiredSeats: expired.length,
    expiredCost: unitCostSum(expired),
    refunds: totalOf(txs, ['REFUND_EXPIRED']),
    weatherLostSeats: lost.length,
    weatherLostCost: unitCostSum(lost),
    penalties: 0 - totalOf(txs, ['PENALTY']),
    cancelledTickets: txs.filter((tx) => tx.type === 'TICKET_REFUND').length,
    cancelRefunds: 0 - totalOf(txs, ['TICKET_REFUND']),
    served: results.length - left,
    left,
    turnedAway: input.turnedAway,
    avgStars: results.length === 0 ? 0 : sum(results.map((result) => result.stars)) / results.length,
    travelVietAfter: input.travelVietAfter,
  };
};
