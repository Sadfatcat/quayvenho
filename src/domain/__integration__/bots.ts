import { BAGGAGE_ERROR_PCT } from '@data/staff';
import { checkHire, kindDefOf, presentStaff } from '../staff';
import { rngFor } from '../rng';
import { ROUTES } from '@data/routes';
import { UPGRADES } from '@data/upgrades';
import { counterCustomer, patienceRatioOf } from '../dayCycle';
import { getDayConfig, isMechanicOpen } from '../dayConfig';
import { customersForDay, travelVietScore } from '../demand';
import { matchesTimePref } from '../clock';
import { invariant } from '../common/invariant';
import type { GameSession } from '../game';
import { COST_RISE_PER_STEP } from '@data/pricing';
import { inflationStep } from '../economy';
import { maxPurchasable, pendingKey, pendingTotalCost } from '../inventory';
import type { CabinClass, Command, DayEvent, DomainEvent, GameState, Order, RouteId, SeatId, StaffJob, StaffKind } from '../models';
import { dayDemandProfile, isPricingOpen } from '../pricing';
import { createRng, type Rng } from '../rng';
import { matchesSeatPref, seatsOfCabin } from '../seatMap';
import { isPassportValid } from '../scoring';
import { checkRouteUnlock, checkUpgrade } from '../upgrades';

/** What the bot does with the customer at the counter. */
export type Decision = 'CORRECT' | 'WRONG_CABIN' | 'WRONG_BAGGAGE' | 'REFUSE' | 'IGNORE';
export type Decide = (order: Order, servedIndex: number, state: Readonly<GameState>) => Decision;

export const perfectDecide: Decide = (order, _i, state) => {
  const valid = isPassportValid(order.passport);
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

export interface ErrorProfile {
  /** Chance to walk away without acting (models a customer lost to a slow/inattentive bot). */
  walkAwayRate: number;
  minorErrorRate: number;
  majorErrorRate: number;
  /** POOR (§13.3): sells anyway even with an invalid passport, instead of refusing. */
  neverRefuse: boolean;
}

/** §13.3 AVERAGE/POOR bots: fixed error/walk-away rates on top of an otherwise-correct decision. */
export const makeErrorProneDecide = (rng: Rng, profile: ErrorProfile): Decide => (order, i, state) => {
  const roll = rng.next();
  if (roll < profile.walkAwayRate) return 'IGNORE';
  const rest = (roll - profile.walkAwayRate) / (1 - profile.walkAwayRate);
  if (rest < profile.majorErrorRate) return 'WRONG_CABIN';
  if (rest < profile.majorErrorRate + profile.minorErrorRate) return 'WRONG_BAGGAGE';
  if (!profile.neverRefuse) return perfectDecide(order, i, state);
  return isPassportValid(order.passport) && !findTicket(state, order, order.cabin) ? 'REFUSE' : 'CORRECT';
};

/** Mọi ghế của khoang đều chọn được; cần còn ít nhất một ghế tồn kho (AVAILABLE) của chuyến + khoang. */
export const findTicket = (
  state: Readonly<GameState>,
  order: Order,
  cabin: CabinClass,
): { flightId: string; seat: SeatId } | null => {
  for (const flight of state.today.flights) {
    if (flight.routeId !== order.routeId || flight.status !== 'SCHEDULED' || !matchesTimePref(flight.departAt, order.timePref)) continue;
    const units = state.today.seats.filter((seat) => seat.flightId === flight.id && seat.cabin === cabin);
    if (!units.some((unit) => unit.state === 'AVAILABLE')) continue;
    const blocked = new Set(units.filter((unit) => unit.state !== 'AVAILABLE').map((unit) => unit.seat));
    const open = seatsOfCabin(cabin).filter((seat) => !blocked.has(seat));
    const seat = open.find((candidate) => matchesSeatPref(candidate, order.seatPref)) ?? open[0];
    if (seat) return { flightId: flight.id, seat };
  }
  return null;
};

export class BotError extends Error {}

const run = (game: GameSession, command: Command): DomainEvent[] => {
  const events = game.dispatch(command);
  const rejected = events.find((event) => event.type === 'COMMAND_REJECTED');
  if (rejected) throw new BotError(`${command.type} rejected: ${JSON.stringify(rejected)}`);
  return events;
};

/** Buys about the expected demand, spread over routes (by weight) and flights, within budget. */
export const buyForDay = (game: GameSession, budgetShare = 0.9, demandScale = 1, avoidWeather = true, stockMargin = 1): void => {
  const { state } = game;
  const { today } = state;
  const avoid = avoidWeather && today.event.type === 'WEATHER' ? today.event.routeId : null;
  const routes = ROUTES.filter((route) => state.unlockedRoutes.includes(route.id) && route.id !== avoid);
  if (!routes.length) return;
  const profile = dayDemandProfile(state.unlockedRoutes, today.priceAdjustPct, today.event);
  const expected = customersForDay({ seed: state.seed, day: state.day, rating: travelVietScore(state.starHistory), rush: today.event.type === 'RUSH' }) * demandScale * profile.averagePriceFactor;
  const badPassportShare = isMechanicOpen('badPassport', state.day) ? getDayConfig(state.day).pBadPassport : 0;
  const pBiz = isMechanicOpen('business', state.day) ? getDayConfig(state.day).pBusiness : 0;
  const weightOf = (route: (typeof routes)[number]): number => route.weight * (profile.routeWeightMultiplier[route.id] ?? 1);
  const totalWeight = routes.reduce((total, route) => total + weightOf(route), 0);

  // Mỗi tuyến một danh sách "đơn vị ghế" cần mua; ghép xen kẽ giữa các tuyến để khi hết ngân sách
  // không tuyến nào bị bỏ đói (trước đây mua lần lượt theo tuyến nên các tuyến cuối không có ghế).
  const perRoute: { flightId: string; cabin: CabinClass }[][] = routes.map((route) => {
    const demand = (expected * weightOf(route) * stockMargin * (1 - badPassportShare)) / totalWeight;
    const flights = today.flights.filter((flight) => flight.routeId === route.id);
    const wanted: [CabinClass, number][] = [['ECONOMY', Math.round(demand * (1 - pBiz))], ['BUSINESS', Math.round(demand * pBiz)]];
    const routeUnits: { flightId: string; cabin: CabinClass }[] = [];
    for (const [cabin, count] of wanted) {
      for (let i = 0; i < count; i++) {
        const flight = flights[i % flights.length];
        if (flight) routeUnits.push({ flightId: flight.id, cabin });
      }
    }
    return routeUnits;
  });
  const units: { flightId: string; cabin: CabinClass }[] = [];
  for (let round = 0; perRoute.some((list) => round < list.length); round++) {
    for (const list of perRoute) {
      const unit = list[round];
      if (unit) units.push(unit);
    }
  }

  const pending: Record<string, number> = {};
  const budget = state.money * budgetShare;
  // Ghế còn hạn mang từ hôm trước đã tính vào nhu cầu hôm nay: chỉ mua phần thiếu.
  const inStock = new Map<string, number>();
  for (const seat of today.seats) {
    if (seat.state !== 'AVAILABLE') continue;
    const key = pendingKey(seat.flightId, seat.cabin);
    inStock.set(key, (inStock.get(key) ?? 0) + 1);
  }
  for (const unit of units) {
    const flight = today.flights.find((f) => f.id === unit.flightId);
    invariant(flight, 'bot flight');
    const key = pendingKey(unit.flightId, unit.cabin);
    const stocked = inStock.get(key) ?? 0;
    if (stocked > 0) {
      inStock.set(key, stocked - 1);
      continue;
    }
    const next = (pending[key] ?? 0) + 1;
    if (next > maxPurchasable(flight, unit.cabin, today.seats)) continue;
    if (pendingTotalCost({ ...pending, [key]: next }, today.flights, state.day, today.event) > budget) continue;
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

const tickExtra = (game: GameSession, events: DomainEvent[], ms: number): void => {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) events.push(...game.tick(100));
};

/** Chờ tới khi kiên nhẫn khách còn `ratio` (PLAN §13.3: bot giao ở patienceRatio 0.8/0.5/0.25) — hoặc khách đã rời đi. */
const tickUntilRatio = (game: GameSession, events: DomainEvent[], ratio: number): void => {
  for (let guard = 0; guard < MAX_RATIO_WAIT_TICKS; guard++) {
    const customer = counterCustomer(game.state.today);
    if (!customer || game.state.today.counter.state !== 'READY_TO_DELIVER' || patienceRatioOf(customer) <= ratio + RATIO_MARGIN) return;
    events.push(...game.tick(100));
  }
};
const MAX_RATIO_WAIT_TICKS = 2000;
/** Dừng chờ ngay trên ngưỡng để ratio 0.5 vẫn đủ điều kiện PERFECT (speed ≥ 0.5). */
const RATIO_MARGIN = 0.01;

/**
 * Runs the shift until SUMMARY. Returns every event emitted.
 * `serveTimeMs` (§13.3): extra real-time delay inserted once a ticket is ready, before delivering —
 * models a bot that takes longer per customer, backing up the queue behind them.
 */
export const playShift = (game: GameSession, decide: Decide, serveTimeMs = 0, deliverRatio: number | null = null): DomainEvent[] => {
  const events: DomainEvent[] = [];
  const decided = new Set<string>();
  let servedIndex = 0;
  for (let guard = 0; game.state.phase === 'OPEN' || game.state.phase === 'CLOSING'; guard++) {
    invariant(guard < 50_000, 'shift did not end');
    const { today } = game.state;
    const customer = counterCustomer(today);
    if (today.counter.state === 'READY_TO_DELIVER') {
      if (deliverRatio !== null) tickUntilRatio(game, events, deliverRatio);
      else if (serveTimeMs > 0) tickExtra(game, events, Math.max(0, serveTimeMs - staffTimeSavedMs(game.state)));
      // A slow bot can let the customer's patience run out while the ticket sits printed —
      // the domain already fires CUSTOMER_LEFT and resets the counter in that case.
      if (game.state.today.counter.state === 'READY_TO_DELIVER') events.push(...run(game, { type: 'DELIVER_TICKET' }));
    } else if (today.counter.state === 'BUILDING' && customer && !decided.has(customer.order.customerId)) {
      decided.add(customer.order.customerId);
      const decision = withStaffMistakes(game.state, customer.order, decide(customer.order, servedIndex++, game.state));
      if (decision === 'REFUSE') events.push(...run(game, { type: 'REFUSE_CUSTOMER' }));
      else if (decision !== 'IGNORE') buildTicket(game, customer.order, decision);
    }
    events.push(...game.tick(100));
  }
  return events;
};

/** Tiền giữ lại không dùng để mua nâng cấp/tuyến (đơn vị k). */
const DEFAULT_RESERVE = 3750;

/** Ước lượng tiền cần để nhập đủ ghế cho ngày mai (giữ lại, không đem đi mua nâng cấp). */
const AVERAGE_SEAT_COST = 950;
const nextDayStockBudget = (state: Readonly<GameState>): number =>
  Math.ceil(
    customersForDay({ seed: state.seed, day: state.day + 1, rating: travelVietScore(state.starHistory), rush: false }) *
      AVERAGE_SEAT_COST *
      (1 + COST_RISE_PER_STEP) ** inflationStep(state.day + 1) *
      STOCK_RESERVE_MARGIN,
  );
const STOCK_RESERVE_MARGIN = 1.1;

/** Thí nghiệm kinh tế nhân viên (bot thuê khi còn đủ tiền dự trữ); tắt khi chạy chuẩn. */
let hireStaffInSim = false;
/** Thí nghiệm: bot không mua nâng cấp (so sánh có/không nâng cấp); tắt khi chạy chuẩn. */
let upgradesDisabledInSim = false;
export const disableUpgrades = (): void => {
  upgradesDisabledInSim = true;
};
export const enableStaffHiring = (): void => {
  hireStaffInSim = true;
};

/** Thời gian người chơi tự làm mỗi việc (ms): nhân viên làm thay thì tiết kiệm đúng chừng đó cho mỗi khách. */
const PLAYER_JOB_TIME_MS: Record<StaffJob, number> = { CABIN: 1500, STAMPS: 4000, BAGGAGE: 4000, SEAT: 3000, SERVICES: 2000, PASSPORT: 1000 };

const presentJobs = (state: Readonly<GameState>): StaffJob[] => presentStaff(state.staff, state.day).flatMap((member) => kindDefOf(member.kind)?.jobs ?? []);

const staffTimeSavedMs = (state: Readonly<GameState>): number => presentJobs(state).reduce((total, job) => total + PLAYER_JOB_TIME_MS[job], 0);

/** Middle cân hành lý sai theo xác suất; bot không kiểm tra lại nên vé bị trừ điểm (mô phỏng người chơi cẩu thả). */
const withStaffMistakes = (state: Readonly<GameState>, order: Order, decision: Decision): Decision => {
  if (decision !== 'CORRECT' || order.baggageKg === 0 || !presentJobs(state).includes('BAGGAGE')) return decision;
  return rngFor(state.seed, state.day, `botstaff:${order.customerId}`).chance(BAGGAGE_ERROR_PCT / 100) ? 'WRONG_BAGGAGE' : decision;
};

const HIRE_PRIORITY: readonly StaffKind[] = ['MARKETING', 'MIDDLE', 'SENIOR', 'JUNIOR'];

const hireAffordableStaff = (game: GameSession, keepForStock: number): void => {
  for (const kind of HIRE_PRIORITY) {
    const { state } = game;
    const def = kindDefOf(kind);
    if (!def) continue;
    const spendable = state.money - keepForStock - def.baseWage * 5;
    if (checkHire(kind, state.staff, { day: state.day + 1, money: spendable }).ok) run(game, { type: 'HIRE_STAFF', kind });
  }
};

/** Buys the cheapest route, then upgrades (listed ids first, then cheapest), keeping a reserve. */
export const shop = (game: GameSession, reserve: number, upgradeOrder: readonly string[] = []): void => {
  run(game, { type: 'GO_TO_SHOP' });
  const keepForStock = Math.max(reserve, nextDayStockBudget(game.state));
  for (;;) {
    const { state } = game;
    const ctx = { day: state.day + 1, money: state.money - keepForStock, travelViet: travelVietScore(state.starHistory) };
    const route = ROUTES.filter((r) => checkRouteUnlock(r.id, state.unlockedRoutes, ctx).ok).sort((a, b) => (a.unlock?.cost ?? 0) - (b.unlock?.cost ?? 0))[0];
    if (route) {
      run(game, { type: 'SHOP_UNLOCK_ROUTE', routeId: route.id });
      continue;
    }
    const rank = (id: string): number => {
      const index = upgradeOrder.indexOf(id);
      return index === -1 ? upgradeOrder.length : index;
    };
    const upgrade = upgradesDisabledInSim ? undefined : UPGRADES.filter((u) => checkUpgrade(u.id, state.upgrades, ctx).ok).sort((a, b) => rank(a.id) - rank(b.id) || a.cost - b.cost)[0];
    if (!upgrade) break;
    run(game, { type: 'SHOP_BUY_UPGRADE', upgradeId: upgrade.id });
  }
  if (hireStaffInSim) hireAffordableStaff(game, keepForStock);
  run(game, { type: 'NEXT_DAY' });
};

/** % chỉnh giá vé mà bot đặt cho một tuyến trong ngày (0 = giá gốc). */
export type PricingStrategy = (context: { event: DayEvent; routeId: RouteId }) => number;

export const FLAT_PRICING: PricingStrategy = () => 0;

const setPrices = (game: GameSession, pricing: PricingStrategy): void => {
  const { state } = game;
  if (!isPricingOpen(state.day)) return;
  for (const routeId of state.unlockedRoutes) run(game, { type: 'SET_ROUTE_PRICE', routeId, pct: pricing({ event: state.today.event, routeId }) });
};

export const playDay = (
  game: GameSession,
  decide: Decide = perfectDecide,
  reserve = DEFAULT_RESERVE,
  demandScale = 1,
  avoidWeather = true,
  serveTimeMs = 0,
  upgradeOrder: readonly string[] = [],
  pricing: PricingStrategy = FLAT_PRICING,
  deliverRatio: number | null = null,
): DomainEvent[] => {
  if (game.state.day === 1) run(game, { type: 'FLAG_SET', flag: 'tutorialDone_1' });
  setPrices(game, pricing);
  buyForDay(game, 0.9, demandScale, avoidWeather);
  run(game, { type: 'OPEN_COUNTER' });
  const events = playShift(game, decide, serveTimeMs, deliverRatio);
  shop(game, reserve, upgradeOrder);
  return events;
};

export const randomBotRng = (seed: number) => createRng(seed ^ 0x5bd1e995);
