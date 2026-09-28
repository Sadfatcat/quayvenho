import {
  BAGGAGE_FEES,
  BULK_DISCOUNT_TIERS,
  BUSINESS_TIP_RATIO,
  EXTRA_FEES,
} from '@data/balance';
import { RUSH_PRICE_MULT } from '@data/events';
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

/** Unrounded; only feeds revenue and tip, which round. */
export const fareOf = (route: Route, cabin: CabinClass, rush: boolean): number =>
  route.price[cabin] * (rush ? RUSH_PRICE_MULT : 1);

export const ticketRevenue = (order: Order, route: Route, rush: boolean): number =>
  roundMoney(
    fareOf(route, order.cabin, rush) +
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
    seatCost: -totalOf(txs, ['SEAT_PURCHASE']),
    shopCost: -totalOf(txs, ['UPGRADE_PURCHASE', 'ROUTE_UNLOCK']),
    expiredSeats: expired.length,
    expiredCost: unitCostSum(expired),
    refunds: totalOf(txs, ['REFUND_EXPIRED']),
    weatherLostSeats: lost.length,
    weatherLostCost: unitCostSum(lost),
    penalties: -totalOf(txs, ['PENALTY']),
    served: results.length - left,
    left,
    turnedAway: input.turnedAway,
    avgStars: results.length === 0 ? 0 : sum(results.map((result) => result.stars)) / results.length,
    travelVietAfter: input.travelVietAfter,
  };
};
