import {
  ACCURACY_DEDUCTIONS,
  ACCURACY_GOOD,
  ACCURACY_OK,
  BAGGAGE_TOLERANCE_KG,
  BUSINESS_DEDUCTION_MULT,
  OUTCOME_PENALTY,
  OUTCOME_STARS,
  PERFECT_MIN_SPEED,
} from '@data/balance';
import { matchesTimePref } from './clock';
import { businessTip, clampPenalty, fareOf, ticketRevenue } from './economy';
import type { CabinClass, Extra, Flight, MistakeCode, Order, Passport, ScoreOutcome, ScoreResult, SeatId, Stars } from './models';
import { getRoute } from './routes';
import { matchesSeatPref } from './seatMap';

export interface DeliveredTicket {
  flight: Flight;
  cabin: CabinClass;
  seat: SeatId;
  baggageKg: number;
  extras: readonly Extra[];
}

export type CustomerAction =
  | { type: 'DELIVER'; ticket: DeliveredTicket }
  | { type: 'REFUSE'; canServe: boolean }
  | { type: 'LEFT' };

export interface ScoreInput {
  order: Order;
  action: CustomerAction;
  patienceRatio: number;
  day: number;
  rush: boolean;
  tipMult: number;
  money: number;
}

/** Expiring today is still valid. */
export const isPassportValid = (passport: Passport, day: number): boolean =>
  passport.expiresDay >= day && passport.name === passport.bookedName;

const severeMistakes = (order: Order, ticket: DeliveredTicket): MistakeCode[] => [
  ...(ticket.flight.routeId !== order.routeId ? (['WRONG_ROUTE'] as const) : []),
  ...(ticket.cabin !== order.cabin ? (['WRONG_CABIN'] as const) : []),
  ...(!matchesTimePref(ticket.flight.departAt, order.timePref) ? (['WRONG_TIME'] as const) : []),
];

/** Accuracy in percentage points (0–100) to avoid float drift. */
const accuracyOf = (order: Order, ticket: DeliveredTicket): { accuracy: number; mistakes: MistakeCode[] } => {
  const mistakes: MistakeCode[] = [];
  if (Math.abs(ticket.baggageKg - order.baggageKg) > BAGGAGE_TOLERANCE_KG) mistakes.push('WRONG_BAGGAGE');
  if (!matchesSeatPref(ticket.seat, order.seatPref)) mistakes.push('WRONG_SEAT_PREF');
  for (const extra of order.extras) if (!ticket.extras.includes(extra)) mistakes.push('MISSING_EXTRA');
  for (const extra of ticket.extras) if (!order.extras.includes(extra)) mistakes.push('EXTRA_NOT_REQUESTED');
  const mult = order.cabin === 'BUSINESS' ? BUSINESS_DEDUCTION_MULT : 1;
  const deducted = mistakes.reduce(
    (total, code) => total + ACCURACY_DEDUCTIONS[code as keyof typeof ACCURACY_DEDUCTIONS] * mult,
    0,
  );
  return { accuracy: Math.max(0, 100 - deducted), mistakes };
};

const outcomeOf = (accuracy: number, speed: number): ScoreOutcome =>
  accuracy === 100 && speed >= PERFECT_MIN_SPEED
    ? 'PERFECT'
    : accuracy >= ACCURACY_GOOD
      ? 'GOOD'
      : accuracy >= ACCURACY_OK
        ? 'OK'
        : 'POOR';

const scoreRegularCustomer = (input: ScoreInput): ScoreResult => {
  const { order, action } = input;
  const result = (outcome: ScoreOutcome, mistakes: MistakeCode[], revenue = 0, tip = 0): ScoreResult => ({
    customerId: order.customerId,
    outcome,
    stars: OUTCOME_STARS[outcome],
    revenue,
    tip,
    penalty: clampPenalty(OUTCOME_PENALTY[outcome], input.money),
    mistakes,
  });

  if (action.type === 'LEFT') return result('LEFT', []);

  const passportValid = isPassportValid(order.passport, input.day);
  if (action.type === 'REFUSE') {
    if (!passportValid) return result('REFUSED_CORRECT', []);
    return action.canServe ? result('REFUSED_WRONG', ['REFUSED_SERVABLE']) : result('REFUSED_NO_STOCK', []);
  }

  if (!passportValid) return result('SOLD_INVALID', ['INVALID_PASSPORT']);
  const severe = severeMistakes(order, action.ticket);
  if (severe.length) return result('FAILED', severe);

  const { accuracy, mistakes } = accuracyOf(order, action.ticket);
  const outcome = outcomeOf(accuracy, input.patienceRatio);
  if (outcome === 'POOR') return result('POOR', mistakes);

  const route = getRoute(order.routeId);
  const revenue = ticketRevenue(order, route, input.rush);
  const tip =
    outcome === 'PERFECT' && order.cabin === 'BUSINESS'
      ? businessTip(fareOf(route, 'BUSINESS', input.rush), input.tipMult)
      : 0;
  return result(outcome, mistakes, revenue, tip);
};

const SPECIAL_MIN_STARS: Stars = 3;
const SPECIAL_TIP_OUTCOME: ScoreOutcome = 'PERFECT';

/**
 * PLAN §16: khách đặc biệt không bao giờ bị phạt, tối thiểu 3 sao, và tip nhân `tipMultiplier` cả khi ECONOMY.
 * Phần còn lại (đúng/sai đơn, doanh thu) chấm như khách thường.
 */
export const scoreCustomer = (input: ScoreInput): ScoreResult => {
  const result = scoreRegularCustomer(input);
  const { special } = input.order;
  if (!special) return result;
  const stars = Math.max(result.stars, SPECIAL_MIN_STARS) as Stars;
  const tip =
    result.outcome === SPECIAL_TIP_OUTCOME && input.action.type === 'DELIVER'
      ? businessTip(fareOf(getRoute(input.order.routeId), input.order.cabin, input.rush), input.tipMult * special.tipMultiplier)
      : result.tip;
  return { ...result, stars, tip, penalty: 0, specialId: special.id };
};
