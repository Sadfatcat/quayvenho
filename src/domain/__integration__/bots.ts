import { ROUTES } from '@data/routes';
import { UPGRADES } from '@data/upgrades';
import { counterCustomer } from '../dayCycle';
import { getDayConfig, isMechanicOpen } from '../dayConfig';
import { customersForDay, travelVietScore } from '../demand';
import { matchesTimePref } from '../clock';
import { invariant } from '../common/invariant';
import type { GameSession } from '../game';
import { maxPurchasable, pendingKey, pendingTotalCost } from '../inventory';
import type { CabinClass, Command, DomainEvent, GameState, Order, SeatId } from '../models';
import { createRng, type Rng } from '../rng';
import { matchesSeatPref } from '../seatMap';
import { isPassportValid } from '../scoring';
import { checkRouteUnlock, checkUpgrade } from '../upgrades';

/** What the bot does with the customer at the counter. */
export type Decision = 'CORRECT' | 'WRONG_CABIN' | 'WRONG_BAGGAGE' | 'REFUSE' | 'IGNORE';
export type Decide = (order: Order, servedIndex: number, state: Readonly<GameState>) => Decision;

export const perfectDecide: Decide = (order, _i, state) => {
  const valid = isPassportValid(order.passport, state.day);
  return valid && findTicket(state, order, order.cabin) ? 'CORRECT' : 'REFUSE';
};

export const randomDecide = (rng: Rng): Decide => (order, i, state) => {
  const roll = rng.next();
  if (roll < 0.1) return 'IGNORE';
  if (roll < 0.2) return 'REFUSE';
  if (roll < 0.3) return 'WRONG_BAGGAGE';
  if (roll < 0.35) return 'WRONG_CABIN';
  return perfectDecide(order, i, state);
};

export const findTicket = (
  state: Readonly<GameState>,
  order: Order,
  cabin: CabinClass,
): { flightId: string; seat: SeatId } | null => {
  let fallback: { flightId: string; seat: SeatId } | null = null;
  for (const flight of state.today.flights) {
    if (flight.routeId !== order.routeId || flight.status !== 'SCHEDULED' || !matchesTimePref(flight.departAt, order.timePref)) continue;
    for (const seat of state.today.seats) {
      if (seat.flightId !== flight.id || seat.cabin !== cabin || seat.state !== 'AVAILABLE') continue;
      if (matchesSeatPref(seat.seat, order.seatPref)) return { flightId: flight.id, seat: seat.seat };
      fallback ??= { flightId: flight.id, seat: seat.seat };
    }
  }
  return fallback;
};

export class BotError extends Error {}

const run = (game: GameSession, command: Command): DomainEvent[] => {
  const events = game.dispatch(command);
  const rejected = events.find((event) => event.type === 'COMMAND_REJECTED');
  if (rejected) throw new BotError(`${command.type} rejected: ${JSON.stringify(rejected)}`);
  return events;
};

/** Buys about the expected demand, spread over routes (by weight) and flights, within budget. */
export const buyForDay = (game: GameSession, budgetShare = 0.9, demandScale = 1): void => {
  const { state } = game;
  const { today } = state;
  const avoid = today.event.type === 'WEATHER' ? today.event.routeId : null;
  const routes = ROUTES.filter((route) => state.unlockedRoutes.includes(route.id) && route.id !== avoid);
  if (!routes.length) return;
  const expected = customersForDay({ seed: state.seed, day: state.day, rating: travelVietScore(state.starHistory), rush: today.event.type === 'RUSH' }) * demandScale;
  const pBiz = isMechanicOpen('business', state.day) ? getDayConfig(state.day).pBusiness : 0;
  const totalWeight = routes.reduce((total, route) => total + route.weight, 0);

  const units: { flightId: string; cabin: CabinClass }[] = [];
  for (const route of routes) {
    const demand = (expected * route.weight) / totalWeight;
    const flights = today.flights.filter((flight) => flight.routeId === route.id);
    const wanted: [CabinClass, number][] = [['ECONOMY', Math.ceil(demand * (1 - pBiz))], ['BUSINESS', Math.round(demand * pBiz)]];
    for (const [cabin, count] of wanted) {
      for (let i = 0; i < count; i++) {
        const flight = flights[i % flights.length];
        if (flight) units.push({ flightId: flight.id, cabin });
      }
    }
  }

  const pending: Record<string, number> = {};
  const budget = state.money * budgetShare;
  for (const unit of units) {
    const flight = today.flights.find((f) => f.id === unit.flightId);
    invariant(flight, 'bot flight');
    const key = pendingKey(unit.flightId, unit.cabin);
    const next = (pending[key] ?? 0) + 1;
    if (next > maxPurchasable(flight, unit.cabin, today.seats)) continue;
    if (pendingTotalCost({ ...pending, [key]: next }, today.flights) > budget) continue;
    pending[key] = next;
  }
  for (const [key, qty] of Object.entries(pending)) {
    const [flightId, cabin] = key.split(':') as [string, CabinClass];
    run(game, { type: 'PREP_SET_QTY', flightId, cabin, qty });
  }
  if (Object.keys(pending).length) run(game, { type: 'PREP_CONFIRM_PURCHASE' });
};

const buildTicket = (game: GameSession, order: Order, decision: Decision): void => {
  const cabin: CabinClass = decision === 'WRONG_CABIN' ? (order.cabin === 'ECONOMY' ? 'BUSINESS' : 'ECONOMY') : order.cabin;
  const ticket = findTicket(game.state, order, cabin);
  if (!ticket) {
    run(game, { type: 'REFUSE_CUSTOMER' });
    return;
  }
  run(game, { type: 'BUILD_SELECT_FLIGHT', flightId: ticket.flightId, cabin });
  run(game, { type: 'BUILD_SELECT_SEAT', seat: ticket.seat });
  run(game, { type: 'BUILD_GOTO_STEP', step: 'EXTRAS' });
  run(game, { type: 'BUILD_SET_BAGGAGE', kg: decision === 'WRONG_BAGGAGE' ? (order.baggageKg === 0 ? 30 : 0) : order.baggageKg });
  for (const extra of order.extras) run(game, { type: 'BUILD_TOGGLE_EXTRA', extra });
  run(game, { type: 'BUILD_GOTO_STEP', step: 'REVIEW' });
  run(game, { type: 'PRINT_TICKET' });
};

/** Runs the shift until SUMMARY. Returns every event emitted. */
export const playShift = (game: GameSession, decide: Decide): DomainEvent[] => {
  const events: DomainEvent[] = [];
  const decided = new Set<string>();
  let servedIndex = 0;
  for (let guard = 0; game.state.phase === 'OPEN' || game.state.phase === 'CLOSING'; guard++) {
    invariant(guard < 50_000, 'shift did not end');
    const { today } = game.state;
    const customer = counterCustomer(today);
    if (today.counter.state === 'READY_TO_DELIVER') events.push(...run(game, { type: 'DELIVER_TICKET' }));
    else if (today.counter.state === 'BUILDING' && customer && !decided.has(customer.order.customerId)) {
      decided.add(customer.order.customerId);
      const decision = decide(customer.order, servedIndex++, game.state);
      if (decision === 'REFUSE') events.push(...run(game, { type: 'REFUSE_CUSTOMER' }));
      else if (decision !== 'IGNORE') buildTicket(game, customer.order, decision);
    }
    events.push(...game.tick(100));
  }
  return events;
};

/** Buys the cheapest route, then the cheapest upgrade, keeping a reserve. */
export const shop = (game: GameSession, reserve: number): void => {
  run(game, { type: 'GO_TO_SHOP' });
  for (;;) {
    const { state } = game;
    const ctx = { day: state.day + 1, money: state.money - reserve, travelViet: travelVietScore(state.starHistory) };
    const route = ROUTES.filter((r) => checkRouteUnlock(r.id, state.unlockedRoutes, ctx).ok).sort((a, b) => (a.unlock?.cost ?? 0) - (b.unlock?.cost ?? 0))[0];
    if (route) {
      run(game, { type: 'SHOP_UNLOCK_ROUTE', routeId: route.id });
      continue;
    }
    const upgrade = UPGRADES.filter((u) => checkUpgrade(u.id, state.upgrades, ctx).ok).sort((a, b) => a.cost - b.cost)[0];
    if (!upgrade) break;
    run(game, { type: 'SHOP_BUY_UPGRADE', upgradeId: upgrade.id });
  }
  run(game, { type: 'NEXT_DAY' });
};

export const playDay = (game: GameSession, decide: Decide = perfectDecide, reserve = 250): DomainEvent[] => {
  if (game.state.day === 1) run(game, { type: 'FLAG_SET', flag: 'tutorialDone_1' });
  buyForDay(game);
  run(game, { type: 'OPEN_COUNTER' });
  const events = playShift(game, decide);
  shop(game, reserve);
  return events;
};

export const randomBotRng = (seed: number) => createRng(seed ^ 0x5bd1e995);
