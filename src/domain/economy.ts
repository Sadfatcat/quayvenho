import {
  BAGGAGE_FEES,
  BULK_DISCOUNT_TIERS,
  BUSINESS_TIP_RATIO,
  EXTRA_FEES,
} from '@data/balance';
import { sum } from './common/math';
import type {
  CabinClass,
  DaySummary,
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

/** Giá bán thực tế = giá gốc × (1 + % người chơi chỉnh), làm tròn một chỗ duy nhất (đơn vị k). */
export const fareOf = (route: Route, cabin: CabinClass, pricePct: number): number =>
  roundMoney(route.price[cabin] * (1 + pricePct / 100));

export const ticketRevenue = (order: Order, route: Route, pricePct: number): number =>
  roundMoney(
    fareOf(route, order.cabin, pricePct) +
      BAGGAGE_FEES[order.baggageKg] +
      sum(order.extras.map((extra) => EXTRA_FEES[extra])),
  );

export const businessTip = (fare: number, tipMult: number): number =>
  roundMoney(BUSINESS_TIP_RATIO * fare * tipMult);

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
    shopCost: 0 - totalOf(txs, ['UPGRADE_PURCHASE', 'ROUTE_UNLOCK']),
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
