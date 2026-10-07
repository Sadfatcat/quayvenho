import {
  BAGGAGE_HOLD_SPEED_KG_PER_S,
  BAGGAGE_MARKS,
  BAGGAGE_MAX_KG,
  BAGGAGE_TOLERANCE_KG,
  DEFAULT_SETTINGS,
  MAX_TICK_MS,
  MOOD_HAPPY_ABOVE,
  MOOD_NEUTRAL_FROM,
  PROFILE_LIMITS,
  QUEUE_PATIENCE_RATE,
  RESOLVE_MS,
  SAVE_VERSION,
  STARTING_MONEY,
} from '@data/balance';
import { MAX_CUSTOMERS, MIN_CUSTOMERS, TRAVELVIET_FROM_DAY, TRAVELVIET_WINDOW } from '@data/demand';
import { PERSONAL, type PersonalConfig } from '@data/personal';
import { OVER_CAP_CANCEL_RATE } from '@data/pricing';
import { WEATHER_LOSS_SHARE } from '@data/events';
import { SHOP_CLOSE_MINUTE, SHOP_OPEN_MINUTE } from '@data/schedule';
import { canServe } from './canServe';
import { advanceClock } from './clock';
import { invariant } from './common/invariant';
import { clamp } from './common/math';
import { getDayConfig, isMechanicOpen } from './dayConfig';
import { customersForDay, isTravelVietOpen, travelVietScore } from './demand';
import { makeTx, moneyBalances, refundFor, summarizeDay } from './economy';
import { isRush, resolveWeather, rollDayEvent } from './events';
import { clampPricePct, dayDemandProfile, isPricingOpen } from './pricing';
import { buildSpecialOrder, dayHasPersonalContent, ensureServableForSpecial, specialCustomerForArrival } from './personal';
import {
  carryOverSeats,
  expireAvailable,
  holdSeat,
  loseSeats,
  maxPurchasable,
  pendingKey,
  purchasePending,
  releaseHeld,
  sellHeld,
} from './inventory';
import type {
  BuildStep,
  Command,
  CounterSlot,
  DayEvent,
  DaySummary,
  Customer,
  DomainEvent,
  GameState,
  Mood,
  OwnedSeat,
  RouteId,
  ScoreResult,
  StaffJob,
  StaffNotice,
  TicketDraft,
  TodayState,
  Transaction,
} from './models';
import { buildRouteBag, generateOrder } from './orderGen';
import { type Rng, rngFor } from './rng';
import { startingRouteIds } from './routes';
import { needsSupport, supportGift } from './safetyNet';
import { findFlight, generateFlights } from './schedule';
import { isPassportValid, scoreCustomer, type CustomerAction } from './scoring';
import type { ShuffleBag } from './shuffleBag';
import { generateArrivals } from './spawner';
import {
  buildAssistQueues,
  checkHire,
  checkTeachMarketing,
  clearFinishedAbsences,
  dailyWages,
  marketingFactor,
  newMember,
  pickStaffFlight,
  pickStaffSeat,
  presentStaff,
  promoteStaff,
  pushProfit,
  rollAbsences,
  staffBaggageKg,
  wageRaiseIncrement,
  type AssistQueue,
  type AssistStep,
} from './staff';
import { MARKETING, STAFF_WEIGH_SETTLE_MS, WAGE_RAISE_EVERY_DAYS } from '@data/staff';
import { checkRouteUnlock, checkUpgrade, computeModifiers } from './upgrades';

/** Per-shift RNG state; rebuilt deterministically at OPEN_COUNTER, never saved. */
export interface DayRuntime {
  routeBag: ShuffleBag<RouteId>;
  ordersRng: Rng;
  namesRng: Rng;
  /** Phụ việc của nhân viên cho khách đang ở quầy (không lưu; dựng lại khi khách vào quầy). */
  assist: { customerId: string; queues: AssistQueue[] } | null;
}

/** Mutable holder owned by GameSession. Commands and ticks mutate `state` in place. */
export interface Session {
  state: GameState;
  runtime: DayRuntime | null;
  personal: PersonalConfig;
}

export const TUTORIAL_FLAG = 'tutorialDone_1';
const BUILD_STEPS: readonly BuildStep[] = ['FLIGHT', 'SEAT', 'EXTRAS', 'REVIEW'];

const freshDraft = (): TicketDraft => ({ step: 'FLIGHT', routeStamp: null, timeStamp: null, flightId: null, cabin: null, seat: null, baggageKg: 0, extras: [] });
const emptyCounter = (): CounterSlot => ({ state: 'EMPTY', draft: null, printLeftMs: 0, resolveLeftMs: 0 });

const createToday = (
  seed: number,
  day: number,
  unlockedRoutes: readonly RouteId[],
  moneyStart: number,
  transactions: TodayState['transactions'],
  personal: PersonalConfig,
  carriedSeats: readonly OwnedSeat[] = [],
): TodayState => ({
  moneyStart,
  event: dayHasPersonalContent(personal, day) ? { type: 'NONE' } : rollDayEvent(seed, day, unlockedRoutes),
  priceAdjustPct: {},
  flights: generateFlights(seed, day, unlockedRoutes),
  seats: [...carriedSeats],
  pendingPurchase: {},
  seatBias: 'BALANCED',
  purchaseCount: 0,
  transactions,
  targetCustomers: 0,
  arrivals: [],
  nextArrivalIndex: 0,
  clock: SHOP_OPEN_MINUTE,
  queue: [],
  counter: emptyCounter(),
  results: [],
  turnedAway: 0,
});

const applySafetyNet = (state: GameState): DomainEvent[] => {
  const { today } = state;
  // Còn ghế bán được (kể cả ghế mang từ hôm trước) thì chưa cần hỗ trợ.
  if (today.seats.some((seat) => seat.state === 'AVAILABLE')) return [];
  if (!needsSupport(state.money, state.unlockedRoutes, state.day)) return [];
  const gift = supportGift(state.seed, state.day, today.flights, today.seats, state.unlockedRoutes);
  if (!gift || !gift.seats.length) return [];
  today.seats.push(...gift.seats);
  today.transactions.push(makeTx('SUPPORT_GIFT', 0, state.day, null, gift.flight.id));
  return [{ type: 'SUPPORT_GIFT', flightId: gift.flight.id, seats: gift.seats.map((seat) => seat.seat) }];
};

export const createNewGame = (seed: number, personal: PersonalConfig = PERSONAL): GameState => {
  const unlockedRoutes = startingRouteIds();
  const state: GameState = {
    version: SAVE_VERSION,
    seed,
    day: 1,
    phase: 'PREP',
    money: STARTING_MONEY,
    profile: null,
    starHistory: [],
    unlockedRoutes,
    routeUnlockedDay: {},
    upgrades: [],
    staff: [],
    staffSerial: 0,
    wageRaise: 0,
    profitHistory: [],
    settings: { ...DEFAULT_SETTINGS },
    flags: {},
    today: createToday(seed, 1, unlockedRoutes, STARTING_MONEY, [], personal),
    nextDayTransactions: [],
    lastSummary: null,
  };
  applySafetyNet(state);
  return state;
};

// ---------- helpers ----------

export const snapBaggage = (kg: number): number => {
  const clamped = clamp(Math.round(kg), 0, BAGGAGE_MAX_KG);
  return BAGGAGE_MARKS.find((mark) => Math.abs(mark - clamped) <= BAGGAGE_TOLERANCE_KG) ?? clamped;
};

const moodOf = (ratio: number): Mood =>
  ratio > MOOD_HAPPY_ABOVE ? 'HAPPY' : ratio >= MOOD_NEUTRAL_FROM ? 'NEUTRAL' : 'IMPATIENT';

export const patienceRatioOf = (customer: Customer): number =>
  customer.infinitePatience ? 1 : clamp(customer.patienceLeftMs / customer.order.patienceMaxMs, 0, 1);

export const counterCustomer = (today: TodayState): Customer | undefined =>
  today.queue[0]?.position === 'COUNTER' ? today.queue[0] : undefined;

const isStepComplete = (draft: TicketDraft, step: BuildStep): boolean =>
  step === 'FLIGHT' ? draft.flightId !== null && draft.cabin !== null : step === 'SEAT' ? draft.seat !== null : true;

/** Có đủ hai con dấu (điểm đến + giờ bay) thì chuyến bay xác định; đổi chuyến thì nhả ghế đang giữ. */
const resolveStampedFlight = (session: Session, draft: TicketDraft): void => {
  const { today } = session.state;
  const flight =
    draft.routeStamp !== null && draft.timeStamp !== null
      ? today.flights.find((candidate) => candidate.routeId === draft.routeStamp && candidate.departAt === draft.timeStamp && candidate.status === 'SCHEDULED')
      : undefined;
  const flightId = flight?.id ?? null;
  if (flightId === draft.flightId) return;
  today.seats = releaseHeld(today.seats);
  draft.seat = null;
  draft.flightId = flightId;
};

export const canGoToStep = (draft: TicketDraft, target: BuildStep): boolean =>
  BUILD_STEPS.slice(0, BUILD_STEPS.indexOf(target)).every((step) => isStepComplete(draft, step));

const isShift = (state: GameState) => state.phase === 'OPEN' || state.phase === 'CLOSING';

const recordResult = (state: GameState, result: ScoreResult): void => {
  const { today } = state;
  const minute = Math.floor(today.clock);
  state.money += result.revenue + result.tip - result.penalty;
  invariant(state.money >= 0, 'money went negative');
  if (result.revenue) today.transactions.push(makeTx('TICKET_REVENUE', result.revenue, state.day, minute, result.customerId));
  if (result.tip) today.transactions.push(makeTx('TIP', result.tip, state.day, minute, result.customerId));
  if (result.penalty) today.transactions.push(makeTx('PENALTY', -result.penalty, state.day, minute, result.customerId));
  state.starHistory = [...state.starHistory, result.stars].slice(-TRAVELVIET_WINDOW);
  today.results.push(result);
};

const scoreAction = (state: GameState, customer: Customer, action: CustomerAction): ScoreResult =>
  scoreCustomer({
    order: customer.order,
    action,
    patienceRatio: patienceRatioOf(customer),
    day: state.day,
    pricePct: state.today.priceAdjustPct[customer.order.routeId] ?? 0,
    tipMult: computeModifiers(state.upgrades).tipMult,
    money: state.money,
  });

/** Scores the counter customer and starts the leave animation. */
const resolveCounter = (state: GameState, customer: Customer, action: CustomerAction): ScoreResult => {
  const result = scoreAction(state, customer, action);
  recordResult(state, result);
  state.today.counter = { state: 'RESOLVING', draft: null, printLeftMs: 0, resolveLeftMs: RESOLVE_MS };
  return result;
};

// ---------- commands ----------

export const applyCommand = (session: Session, command: Command): DomainEvent[] => {
  const { state } = session;
  const { today } = state;
  const reject = (reason: string): DomainEvent[] => [{ type: 'COMMAND_REJECTED', command: command.type, reason }];
  const building = () => {
    const customer = counterCustomer(today);
    const draft = today.counter.draft;
    return isShift(state) && today.counter.state === 'BUILDING' && customer && draft ? { customer, draft } : null;
  };

  switch (command.type) {
    case 'PROFILE_SET': {
      if (state.profile) return reject('PROFILE_ALREADY_SET');
      const playerName = command.playerName.trim();
      const brandName = command.brandName.trim();
      if (!playerName || playerName.length > PROFILE_LIMITS.playerName) return reject('BAD_PLAYER_NAME');
      if (!brandName || brandName.length > PROFILE_LIMITS.brandName) return reject('BAD_BRAND_NAME');
      state.profile = { playerName, brandName };
      return [{ type: 'PROFILE_SET' }];
    }

    case 'PREP_SET_QTY': {
      if (state.phase !== 'PREP') return reject('WRONG_PHASE');
      const flight = findFlight(today.flights, command.flightId);
      if (!flight) return reject('UNKNOWN_FLIGHT');
      const { qty, cabin } = command;
      if (!Number.isInteger(qty) || qty < 0 || qty > maxPurchasable(flight, cabin, today.seats)) return reject('BAD_QTY');
      const key = pendingKey(flight.id, cabin);
      if (qty === 0) delete today.pendingPurchase[key];
      else today.pendingPurchase[key] = qty;
      return [];
    }

    case 'PREP_SET_SEAT_BIAS': {
      if (state.phase !== 'PREP') return reject('WRONG_PHASE');
      if (!computeModifiers(state.upgrades).seatBias) return reject('UPGRADE_REQUIRED');
      today.seatBias = command.bias;
      return [];
    }

    case 'PREP_CONFIRM_PURCHASE': {
      if (state.phase !== 'PREP') return reject('WRONG_PHASE');
      const result = purchasePending({
        pending: today.pendingPurchase,
        flights: today.flights,
        seats: today.seats,
        money: state.money,
        bias: today.seatBias,
        rng: rngFor(state.seed, state.day, `purchase:${today.purchaseCount}`),
        day: state.day,
        event: today.event,
      });
      if (!result.ok) return reject(result.reason);
      today.seats = result.value.seats;
      state.money -= result.value.totalCost;
      today.pendingPurchase = {};
      today.purchaseCount++;
      return result.value.purchases.map((purchase) => {
        today.transactions.push(makeTx('SEAT_PURCHASE', -purchase.cost, state.day, null, pendingKey(purchase.flightId, purchase.cabin)));
        return { type: 'SEATS_PURCHASED', ...purchase };
      });
    }

    case 'SET_ROUTE_PRICE': {
      if (state.phase !== 'PREP') return reject('WRONG_PHASE');
      if (!isPricingOpen(state.day)) return reject('PRICING_LOCKED');
      if (!state.unlockedRoutes.includes(command.routeId)) return reject('ROUTE_LOCKED');
      if (!Number.isFinite(command.pct)) return reject('BAD_PRICE');
      today.priceAdjustPct = { ...today.priceAdjustPct, [command.routeId]: clampPricePct(command.pct) };
      return [];
    }

    case 'PREP_CLEAR_PENDING': {
      if (state.phase !== 'PREP') return reject('WRONG_PHASE');
      today.pendingPurchase = {};
      return [];
    }

    case 'OPEN_COUNTER': {
      if (state.phase !== 'PREP') return reject('WRONG_PHASE');
      if (Object.keys(today.pendingPurchase).length) return reject('PENDING_NOT_CONFIRMED');
      return openCounter(session);
    }

    case 'BUILD_TAKE_TICKET': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      if (ctx.draft.cabin !== command.cabin) {
        today.seats = releaseHeld(today.seats);
        ctx.draft.seat = null;
      }
      ctx.draft.cabin = command.cabin;
      return [];
    }

    case 'BUILD_STAMP_ROUTE': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      if (!state.unlockedRoutes.includes(command.routeId)) return reject('ROUTE_LOCKED');
      ctx.draft.routeStamp = command.routeId;
      resolveStampedFlight(session, ctx.draft);
      return [];
    }

    case 'BUILD_STAMP_TIME': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      if (!today.flights.some((flight) => flight.departAt === command.departAt)) return reject('BAD_TIME_STAMP');
      ctx.draft.timeStamp = command.departAt;
      resolveStampedFlight(session, ctx.draft);
      return [];
    }

    case 'BUILD_SELECT_FLIGHT': {
      if (!building()) return reject('NOT_BUILDING');
      const flight = findFlight(today.flights, command.flightId);
      if (!flight || flight.status !== 'SCHEDULED') return reject('FLIGHT_UNAVAILABLE');
      const seats = releaseHeld(today.seats);
      const hasSeat = seats.some((s) => s.flightId === flight.id && s.cabin === command.cabin && s.state === 'AVAILABLE');
      if (!hasSeat) return reject('NO_SEAT_IN_CABIN');
      today.seats = seats;
      today.counter.draft = { ...freshDraft(), baggageKg: 0, step: 'SEAT', routeStamp: flight.routeId, timeStamp: flight.departAt, flightId: flight.id, cabin: command.cabin };
      return [];
    }

    case 'BUILD_SELECT_SEAT': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      const { draft } = ctx;
      if (!draft.flightId || !draft.cabin) return reject('NO_FLIGHT_SELECTED');
      const result = holdSeat(today.seats, draft.flightId, draft.cabin, command.seat);
      if (!result.ok) return reject(result.reason);
      today.seats = result.value;
      draft.seat = command.seat;
      return [];
    }

    case 'BUILD_SET_BAGGAGE': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      ctx.draft.baggageKg = snapBaggage(command.kg);
      return [];
    }

    case 'BUILD_TOGGLE_EXTRA': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      if (!isMechanicOpen('extras', state.day)) return reject('MECHANIC_LOCKED');
      const { extras } = ctx.draft;
      ctx.draft.extras = extras.includes(command.extra)
        ? extras.filter((extra) => extra !== command.extra)
        : [...extras, command.extra];
      return [];
    }

    case 'BUILD_GOTO_STEP': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      if (!canGoToStep(ctx.draft, command.step)) return reject('STEP_INCOMPLETE');
      ctx.draft.step = command.step;
      return [];
    }

    case 'PRINT_TICKET': {
      const ctx = building();
      if (!ctx) return reject('NOT_BUILDING');
      if (!ctx.draft.cabin || !ctx.draft.flightId || !ctx.draft.seat) return reject('TICKET_INCOMPLETE');
      const printMs = computeModifiers(state.upgrades).printMs;
      today.counter = { ...today.counter, state: 'PRINTING', printLeftMs: printMs };
      return [{ type: 'PRINT_STARTED', durationMs: printMs }];
    }

    case 'DELIVER_TICKET': {
      const customer = counterCustomer(today);
      const draft = today.counter.draft;
      if (!isShift(state) || today.counter.state !== 'READY_TO_DELIVER' || !customer || !draft) return reject('NOT_READY');
      const flight = draft.flightId ? findFlight(today.flights, draft.flightId) : undefined;
      invariant(flight && draft.cabin && draft.seat, 'printed ticket is incomplete');
      today.seats = sellHeld(today.seats);
      const result = resolveCounter(state, customer, {
        type: 'DELIVER',
        ticket: { flight, cabin: draft.cabin, seat: draft.seat, baggageKg: draft.baggageKg, extras: draft.extras },
      });
      return [{ type: 'TICKET_SCORED', result }];
    }

    case 'REFUSE_CUSTOMER': {
      const customer = counterCustomer(today);
      const refusable = ['BUILDING', 'PRINTING', 'READY_TO_DELIVER'].includes(today.counter.state);
      if (!isShift(state) || !customer || !refusable) return reject('NO_CUSTOMER');
      today.seats = releaseHeld(today.seats);
      const result = resolveCounter(state, customer, {
        type: 'REFUSE',
        canServe: canServe(customer.order, today.flights, today.seats),
      });
      return [{ type: 'TICKET_SCORED', result }];
    }

    case 'CLOSE_EARLY': {
      const blocked = closeEarlyBlockedReason(state, session.personal);
      return blocked ? reject(blocked) : closeEarly(session);
    }

    case 'GO_TO_SHOP': {
      if (state.phase !== 'SUMMARY') return reject('WRONG_PHASE');
      state.phase = 'SHOP';
      return [];
    }

    case 'SHOP_BUY_UPGRADE': {
      if (!canShop(state)) return reject('WRONG_PHASE');
      const result = checkUpgrade(command.upgradeId, state.upgrades, shopContext(state));
      if (!result.ok) return reject(result.reason);
      state.money -= result.value.cost;
      state.upgrades.push(command.upgradeId);
      shopTransactions(state).push(makeTx('UPGRADE_PURCHASE', -result.value.cost, shopTransactionDay(state), null, command.upgradeId));
      return [{ type: 'UPGRADE_BOUGHT', upgradeId: command.upgradeId }];
    }

    case 'SHOP_UNLOCK_ROUTE': {
      if (!canShop(state)) return reject('WRONG_PHASE');
      const result = checkRouteUnlock(command.routeId, state.unlockedRoutes, shopContext(state));
      if (!result.ok) return reject(result.reason);
      state.money -= result.value;
      state.unlockedRoutes.push(command.routeId);
      state.routeUnlockedDay[command.routeId] = state.day;
      shopTransactions(state).push(makeTx('ROUTE_UNLOCK', -result.value, shopTransactionDay(state), null, command.routeId));
      return [{ type: 'ROUTE_UNLOCKED', routeId: command.routeId }];
    }

    case 'HIRE_STAFF': {
      if (!canShop(state)) return reject('WRONG_PHASE');
      const result = checkHire(command.kind, state.staff, shopContext(state));
      if (!result.ok) return reject(result.reason);
      const member = newMember(command.kind, state.staffSerial++, shopTransactionDay(state));
      state.money -= result.value.hireCost;
      state.staff.push(member);
      shopTransactions(state).push(makeTx('STAFF_HIRE', -result.value.hireCost, shopTransactionDay(state), null, member.id));
      return [{ type: 'STAFF_HIRED', staffId: member.id, kind: member.kind }];
    }

    case 'FIRE_STAFF': {
      if (!canShop(state)) return reject('WRONG_PHASE');
      if (!state.staff.some((member) => member.id === command.staffId)) return reject('UNKNOWN_STAFF');
      state.staff = state.staff.filter((member) => member.id !== command.staffId);
      return [{ type: 'STAFF_FIRED', staffId: command.staffId }];
    }

    case 'TEACH_MARKETING': {
      if (!canShop(state)) return reject('WRONG_PHASE');
      const result = checkTeachMarketing(state.staff, state.money);
      if (!result.ok) return reject(result.reason);
      state.money -= result.value.cost;
      result.value.member.bonusPct += MARKETING.stepPct;
      shopTransactions(state).push(makeTx('STAFF_TRAIN', -result.value.cost, shopTransactionDay(state), null, result.value.member.id));
      return [{ type: 'MARKETING_TAUGHT', bonusPct: result.value.member.bonusPct }];
    }

    case 'NEXT_DAY': {
      if (state.phase !== 'SHOP') return reject('WRONG_PHASE');
      invariant(state.lastSummary, 'SHOP without a summary');
      const finishedDay = state.day;
      const finishedDaySeats = state.today.seats;
      state.day += 1;
      state.today = createToday(state.seed, state.day, state.unlockedRoutes, state.lastSummary.moneyEnd, state.nextDayTransactions, session.personal);
      state.today.seats = carryOverSeats(finishedDaySeats, finishedDay, state.today.flights, rngFor(state.seed, state.day, 'carry'));
      state.nextDayTransactions = [];
      state.phase = 'PREP';
      session.runtime = null;
      return applySafetyNet(state);
    }

    case 'SETTINGS_UPDATE': {
      const { musicVolume, sfxVolume, haptics } = { ...state.settings, ...command.patch };
      state.settings = { musicVolume: clamp(musicVolume, 0, 1), sfxVolume: clamp(sfxVolume, 0, 1), haptics };
      return [{ type: 'SETTINGS_UPDATED' }];
    }

    case 'FLAG_SET': {
      state.flags[command.flag] = true;
      return [{ type: 'FLAG_SET', flag: command.flag }];
    }
  }
};

/** Mua đồ/thuê nhân viên được ở đầu ngày (PREP, có hiệu lực ngay) hoặc sau tổng kết (SHOP, tính cho ngày mai). */
const canShop = (state: GameState): boolean => state.phase === 'PREP' || state.phase === 'SHOP';
const shopTransactions = (state: GameState): Transaction[] => (state.phase === 'PREP' ? state.today.transactions : state.nextDayTransactions);
const shopTransactionDay = (state: GameState): number => (state.phase === 'PREP' ? state.day : state.day + 1);

export const shopContext = (state: GameState) => ({
  day: state.phase === 'SHOP' ? state.day + 1 : state.day,
  money: state.money,
  travelViet: travelVietScore(state.starHistory),
});

/** Công thức số khách của một ngày: dùng chung cho lúc mở cửa và cho bộ đếm "Dự kiến" để hai con số luôn khớp. */
const targetCustomersFor = (state: Readonly<GameState>, day: number, event: DayEvent, averagePriceFactor: number): number => {
  const baseTarget = customersForDay({ seed: state.seed, day, rating: travelVietScore(state.starHistory), rush: isRush(event) });
  return clamp(Math.round(baseTarget * averagePriceFactor * marketingFactor(state.staff, day)), MIN_CUSTOMERS, MAX_CUSTOMERS);
};

/**
 * Số khách chính xác của ngày sắp mở cửa theo trạng thái hiện tại (đổi giá, nhân viên, tuyến thì số đổi theo).
 * PREP: ngày đang chuẩn bị. SHOP: ngày hôm sau (giá chưa chỉnh nên tính ở 0%). Phase khác: số đã chốt của hôm nay.
 */
export const expectedCustomers = (state: Readonly<GameState>, personal: PersonalConfig = PERSONAL): number => {
  if (state.phase === 'PREP') {
    const { event, priceAdjustPct } = state.today;
    return targetCustomersFor(state, state.day, event, dayDemandProfile(state.unlockedRoutes, priceAdjustPct, event).averagePriceFactor);
  }
  if (state.phase === 'SHOP') {
    const day = state.day + 1;
    const event: DayEvent = dayHasPersonalContent(personal, day) ? { type: 'NONE' } : rollDayEvent(state.seed, day, state.unlockedRoutes);
    return targetCustomersFor(state, day, event, dayDemandProfile(state.unlockedRoutes, {}, event).averagePriceFactor);
  }
  return state.today.targetCustomers;
};

const openCounter = (session: Session): DomainEvent[] => {
  const { state } = session;
  const { today, seed, day } = state;
  const events: DomainEvent[] = [];

  if (today.event.type === 'WEATHER') {
    const { routeId } = today.event;
    const outcome = resolveWeather(seed, day);
    today.event = { ...today.event, outcome };
    const routeFlights = today.flights.filter((flight) => flight.routeId === routeId);
    const { seats, lost } = loseSeats(today.seats, routeFlights.map((f) => f.id), WEATHER_LOSS_SHARE[outcome], rngFor(seed, day, 'weather:loss'));
    today.seats = seats;
    if (outcome === 'SEVERE') {
      today.flights = today.flights.map((flight) => (flight.routeId === routeId ? { ...flight, status: 'CANCELLED' } : flight));
    }
    if (outcome !== 'GOOD') today.transactions.push(makeTx('WEATHER_LOSS', 0, day, SHOP_OPEN_MINUTE, routeId));
    events.push({ type: 'WEATHER_RESOLVED', routeId, outcome, lostSeats: lost.length });
  }

  const demandProfile = dayDemandProfile(state.unlockedRoutes, today.priceAdjustPct, today.event);
  today.targetCustomers = targetCustomersFor(state, day, today.event, demandProfile.averagePriceFactor);
  today.arrivals = generateArrivals(rngFor(seed, day, 'spawn'), today.targetCustomers);
  today.nextArrivalIndex = 0;
  today.clock = SHOP_OPEN_MINUTE;
  session.runtime = {
    routeBag: buildRouteBag(rngFor(seed, day, 'routes'), state.unlockedRoutes, state.routeUnlockedDay, day, demandProfile.routeWeightMultiplier),
    ordersRng: rngFor(seed, day, 'orders'),
    namesRng: rngFor(seed, day, 'names'),
    assist: null,
  };
  state.phase = 'OPEN';
  events.push({ type: 'DAY_OPENED', targetCustomers: today.targetCustomers });
  return events;
};

// ---------- tick ----------

export const advanceTime = (session: Session, deltaMs: number): DomainEvent[] => {
  const { state } = session;
  if (!isShift(state)) return [];
  const runtime = session.runtime;
  invariant(runtime, 'runtime missing during a shift');
  const delta = clamp(deltaMs, 0, MAX_TICK_MS);
  const events: DomainEvent[] = [];

  tickCounter(state, delta, events);
  tickStaff(session, delta, events);
  tickClock(state, delta, events);
  spawnArrivals(state, runtime, session.personal, events);
  dismissQueueWhenSoldOut(state, events);
  if (state.phase === 'OPEN' && state.today.clock >= SHOP_CLOSE_MINUTE) {
    state.phase = 'CLOSING';
    events.push({ type: 'DAY_CLOSING' });
  }
  promoteNextCustomer(session, events);
  tickPatience(state, delta, events);
  endDayIfDone(session, events);
  return events;
};

const tickCounter = (state: GameState, delta: number, events: DomainEvent[]): void => {
  const { today } = state;
  const counter = today.counter;
  if (counter.state === 'PRINTING') {
    counter.printLeftMs -= delta;
    if (counter.printLeftMs <= 0) {
      today.counter = { ...counter, state: 'READY_TO_DELIVER', printLeftMs: 0 };
      events.push({ type: 'PRINT_DONE' });
    }
  } else if (counter.state === 'RESOLVING') {
    counter.resolveLeftMs -= delta;
    if (counter.resolveLeftMs <= 0) {
      today.queue = today.queue.slice(1);
      today.counter = emptyCounter();
    }
  }
};

type AssistOutcome = 'DONE' | 'SKIP' | 'WAIT';

/** Làm một việc của nhân viên trên vé nháp của khách ở quầy: bỏ qua nếu người chơi đã tự làm, chờ nếu chưa đủ điều kiện (vd. chưa có chuyến để chọn ghế). */
const applyAssistStep = (session: Session, customer: Customer, step: AssistStep): AssistOutcome => {
  const { job } = step;
  const { state } = session;
  const { today } = state;
  const draft = today.counter.draft;
  if (!draft) return 'SKIP';
  const { order } = customer;
  // Chưa chọn vé (hạng) thì mọi việc phía sau đều bị chặn, nhân viên đứng chờ cho tới khi có vé trên bàn.
  if (job !== 'CABIN' && job !== 'PASSPORT' && draft.cabin === null) return 'WAIT';
  switch (job) {
    case 'CABIN':
      if (draft.cabin !== null) return 'SKIP';
      draft.cabin = order.cabin;
      return 'DONE';
    case 'STAMPS': {
      if (draft.routeStamp !== null || draft.timeStamp !== null) return 'SKIP';
      const flight = pickStaffFlight(order, today.flights, today.seats);
      if (!flight) return 'SKIP';
      draft.routeStamp = flight.routeId;
      draft.timeStamp = flight.departAt;
      resolveStampedFlight(session, draft);
      return 'DONE';
    }
    case 'BAGGAGE': {
      if (order.baggageKg === 0 || draft.baggageKg !== 0) return 'SKIP';
      draft.baggageKg = snapBaggage(step.weighKg ?? staffBaggageKg(order, rngFor(state.seed, state.day, `staffbag:${order.customerId}`)));
      return 'DONE';
    }
    case 'SEAT': {
      if (draft.seat !== null) return 'SKIP';
      if (!draft.flightId || !draft.cabin) return 'WAIT';
      const flight = findFlight(today.flights, draft.flightId);
      const seat = flight ? pickStaffSeat(order, flight, draft.cabin, today.seats) : undefined;
      if (!seat) return 'SKIP';
      const held = holdSeat(today.seats, draft.flightId, draft.cabin, seat);
      if (!held.ok) return 'SKIP';
      today.seats = held.value;
      draft.seat = seat;
      return 'DONE';
    }
    case 'PASSPORT':
      // Chỉ báo khi hộ chiếu sai tên; người chơi vẫn tự bấm Từ chối.
      return isMechanicOpen('badPassport', state.day) && !isPassportValid(order.passport) ? 'DONE' : 'SKIP';
    case 'SERVICES':
      if (!isMechanicOpen('extras', state.day) || order.extras.length === 0 || draft.extras.length > 0) return 'SKIP';
      draft.extras = [...order.extras];
      return 'DONE';
  }
};

/**
 * Cân hành lý có chuyển động: tới lượt, nhân viên quyết định số kg sẽ nhả tay rồi "giữ thanh cân" đúng thời gian số chạy từ 0 tới đó
 * (như người chơi bấm giữ); hết thời gian đó (cộng một nhịp dừng) mới ghi số vào vé. Trả true nếu vừa bắt đầu giữ.
 */
const startWeighing = (session: Session, customer: Customer, queue: AssistQueue, step: AssistStep, events: DomainEvent[]): boolean => {
  const draft = session.state.today.counter.draft;
  if (step.job !== 'BAGGAGE' || step.weighKg !== undefined || !draft || draft.cabin === null) return false;
  const { order } = customer;
  if (order.baggageKg === 0 || draft.baggageKg !== 0) return false;
  const kg = staffBaggageKg(order, rngFor(session.state.seed, session.state.day, `staffbag:${order.customerId}`));
  const holdMs = Math.round((kg / BAGGAGE_HOLD_SPEED_KG_PER_S) * 1000);
  step.weighKg = kg;
  step.waitMs = holdMs + STAFF_WEIGH_SETTLE_MS;
  events.push({ type: 'STAFF_WEIGH_STARTED', staffId: queue.staffId, kg, holdMs });
  return true;
};

/** Việc chưa làm được vì thiếu điều kiện (chưa có vé trên bàn, chưa có chuyến để chọn ghế): nhân viên đứng chờ, chưa tính giờ. */
const isAssistStepBlocked = (draft: TicketDraft, job: StaffJob): boolean => {
  if (job === 'CABIN' || job === 'PASSPORT') return false;
  return draft.cabin === null || (job === 'SEAT' && !draft.flightId);
};

/**
 * Nhân viên đi làm phụ việc cho khách đang lắp vé, MỖI LẦN CHỈ MỘT VIỆC: việc đang đếm giờ giữ lượt, những người còn lại đứng nhìn
 * cho tới khi xong (việc bị chặn thì bỏ qua, không giữ lượt). Người chơi vẫn luôn là người in và giao vé.
 */
const tickStaff = (session: Session, delta: number, events: DomainEvent[]): void => {
  const assist = session.runtime?.assist;
  if (!assist) return;
  const { today } = session.state;
  const customer = counterCustomer(today);
  const draft = today.counter.draft;
  if (!customer || !draft || customer.order.customerId !== assist.customerId || today.counter.state !== 'BUILDING') return;
  for (const queue of assist.queues) {
    const step = queue.steps[0];
    if (!step || isAssistStepBlocked(draft, step.job)) continue;
    if (step.waitMs > 0) {
      step.waitMs = Math.max(0, step.waitMs - delta);
      if (step.waitMs > 0) return;
    }
    if (startWeighing(session, customer, queue, step, events)) return;
    const outcome = applyAssistStep(session, customer, step);
    if (outcome === 'WAIT') continue;
    queue.steps.shift();
    if (outcome === 'DONE') {
      events.push({ type: 'STAFF_ASSISTED', staffId: queue.staffId, kind: queue.kind, job: step.job });
      return;
    }
  }
};

const tickClock = (state: GameState, delta: number, events: DomainEvent[]): void => {
  const before = Math.floor(state.today.clock);
  state.today.clock = advanceClock(state.today.clock, delta);
  const after = Math.floor(state.today.clock);
  if (after !== before) events.push({ type: 'CLOCK_TICK', minute: after });
};

/** Còn ghế để bán không (ghế đang giữ cho vé nháp vẫn tính, vì khách ở quầy có thể huỷ). */
const hasSellableSeat = (seats: readonly OwnedSeat[]): boolean => seats.some((seat) => seat.state === 'AVAILABLE' || seat.state === 'HELD');

/** Hết vé hẳn: khách đang chờ trong hàng ra về (khách ở quầy vẫn do người chơi xử lý). */
const dismissQueueWhenSoldOut = (state: GameState, events: DomainEvent[]): void => {
  const { today } = state;
  if (state.phase !== 'OPEN' || hasSellableSeat(today.seats)) return;
  const waiting = today.queue.filter((customer) => customer.position === 'QUEUE');
  if (waiting.length === 0) return;
  today.queue = today.queue.filter((customer) => customer.position !== 'QUEUE');
  events.push({ type: 'CUSTOMERS_DISMISSED', count: waiting.length });
};

const spawnArrivals = (state: GameState, runtime: DayRuntime, personal: PersonalConfig, events: DomainEvent[]): void => {
  const { today } = state;
  if (state.phase !== 'OPEN') return;
  const modifiers = computeModifiers(state.upgrades);
  while (today.nextArrivalIndex < today.arrivals.length && (today.arrivals[today.nextArrivalIndex] ?? Infinity) <= today.clock) {
    const index = today.nextArrivalIndex++;
    const special = specialCustomerForArrival(personal, state.day, index, today.arrivals.length);
    // Hết vé thì không có khách mới tới hỏi (trừ khách đặc biệt đã có ghế riêng).
    if (!special && !hasSellableSeat(today.seats)) continue;
    const generated = generateOrder({
      rng: runtime.ordersRng,
      namesRng: runtime.namesRng,
      day: state.day,
      cfg: getDayConfig(state.day),
      flights: today.flights,
      seats: today.seats,
      unlockedRoutes: state.unlockedRoutes,
      routeBag: runtime.routeBag,
      modifiers,
      customerIndex: index,
    });
    const order = special ? buildSpecialOrder(generated, special) : generated;
    if (special) today.seats.push(...ensureServableForSpecial(order, today.flights, today.seats, rngFor(state.seed, state.day, `special:${special.id}`), state.day));
    today.queue.push({
      order,
      patienceLeftMs: order.patienceMaxMs,
      infinitePatience: state.day === 1 && index === 0 && !state.flags[TUTORIAL_FLAG],
      mood: 'HAPPY',
      position: 'QUEUE',
    });
    events.push({ type: 'CUSTOMER_SPAWNED', customerId: order.customerId });
  }
};

const promoteNextCustomer = (session: Session, events: DomainEvent[]): void => {
  const { state } = session;
  const { today } = state;
  const next = today.queue[0];
  if (today.counter.state !== 'EMPTY' || !next) return;
  next.position = 'COUNTER';
  today.counter = { state: 'BUILDING', draft: freshDraft(), printLeftMs: 0, resolveLeftMs: 0 };
  if (session.runtime) session.runtime.assist = { customerId: next.order.customerId, queues: buildAssistQueues(state.staff, state.day) };
  events.push({ type: 'CUSTOMER_AT_COUNTER', customerId: next.order.customerId });
};

const tickPatience = (state: GameState, delta: number, events: DomainEvent[]): void => {
  const { today } = state;
  const queuePatienceRate = QUEUE_PATIENCE_RATE * computeModifiers(state.upgrades).queuePatienceRateMult;
  const leavers: Customer[] = [];
  today.queue.forEach((customer, index) => {
    const resolving = index === 0 && customer.position === 'COUNTER' && today.counter.state === 'RESOLVING';
    if (customer.infinitePatience || resolving) return;
    customer.patienceLeftMs -= delta * (customer.position === 'COUNTER' ? 1 : queuePatienceRate);
    const mood = moodOf(patienceRatioOf(customer));
    if (mood !== customer.mood) {
      customer.mood = mood;
      events.push({ type: 'CUSTOMER_MOOD_CHANGED', customerId: customer.order.customerId, mood });
    }
    if (customer.patienceLeftMs <= 0) leavers.push(customer);
  });

  for (const customer of leavers) {
    events.push({ type: 'CUSTOMER_LEFT', customerId: customer.order.customerId });
    if (customer.position === 'COUNTER') {
      today.seats = releaseHeld(today.seats);
      events.push({ type: 'TICKET_SCORED', result: resolveCounter(state, customer, { type: 'LEFT' }) });
    } else {
      today.queue = today.queue.filter((candidate) => candidate !== customer);
      const result = scoreAction(state, customer, { type: 'LEFT' });
      recordResult(state, result);
      events.push({ type: 'TICKET_SCORED', result });
    }
  }
};

/** Lương nhân viên trừ lúc tổng kết; tiền không bao giờ âm nên nếu quỹ không đủ thì chỉ trừ phần còn có. */
const payStaffWages = (state: GameState): void => {
  const wages = Math.min(dailyWages(state.staff, state.day, state.wageRaise), state.money);
  if (wages === 0) return;
  state.money -= wages;
  state.today.transactions.push(makeTx('STAFF_WAGE', -wages, state.day, Math.floor(state.today.clock)));
};

/**
 * Hết ngày: người đi làm tăng ngày công, thực tập sinh đủ ngày lên Junior, ghi lợi nhuận kinh doanh (không tính lương),
 * mỗi 3 ngày lương tăng theo lợi nhuận, rồi tung nghỉ ngẫu nhiên cho ngày mai. Trả thông báo hiện ở màn tổng kết.
 */
const finishStaffDay = (state: GameState, summary: DaySummary): StaffNotice[] => {
  for (const member of presentStaff(state.staff, state.day)) member.daysWorked++;
  const notices: StaffNotice[] = promoteStaff(state.staff);
  state.profitHistory = pushProfit(state.profitHistory, summary.moneyEnd - summary.moneyStart + summary.shopCost + summary.staffWages);
  if (state.day % WAGE_RAISE_EVERY_DAYS === 0) state.wageRaise += wageRaiseIncrement(state.profitHistory);
  clearFinishedAbsences(state.staff, state.day + 1);
  notices.push(...rollAbsences(state.staff, state.seed, state.day + 1));
  return notices;
};

/** Vé bán vượt trần giá: một phần bị huỷ lúc tổng kết — hoàn tiền vé + tip, ghế vẫn đã dùng (không bán lại được). */
const cancelOverCapTickets = (state: GameState): void => {
  const { today } = state;
  const rng = rngFor(state.seed, state.day, 'cancel');
  const minute = Math.floor(today.clock);
  for (const result of today.results) {
    if (!result.overCap || result.revenue === 0 || !rng.chance(OVER_CAP_CANCEL_RATE)) continue;
    // Tiền không bao giờ âm: nếu phạt trong ngày đã làm quỹ nhỏ hơn số hoàn thì chỉ hoàn phần còn có.
    const refund = Math.min(result.revenue + result.tip, state.money);
    if (refund === 0) continue;
    state.money -= refund;
    today.transactions.push(makeTx('TICKET_REFUND', -refund, state.day, minute, result.customerId));
  }
  invariant(state.money >= 0, 'money went negative after cancellations');
};

/**
 * Lý do không được đóng cửa sớm lúc này, hoặc null nếu được. Ngày nào cũng đóng được (kể cả ngày 1); chỉ không cho ở ngày đặc biệt
 * (PLAN §16); đang chốt vé của khách ở quầy thì chờ xong (vài giây).
 */
export const closeEarlyBlockedReason = (state: Readonly<GameState>, personal: PersonalConfig = PERSONAL): string | null => {
  if (state.phase !== 'OPEN') return 'WRONG_PHASE';
  if (dayHasPersonalContent(personal, state.day)) return 'SPECIAL_DAY';
  if (state.today.counter.state === 'RESOLVING') return 'CUSTOMER_BEING_RESOLVED';
  return null;
};

/** Khách chưa được chấm: đang chờ/đang ở quầy cộng khách chưa đến. */
export const customersNotYetServed = (today: Readonly<TodayState>): number => today.queue.length + today.arrivals.length - today.nextArrivalIndex;

/** Đóng cửa sớm: khách đang chờ và khách chưa đến bị bỏ (không sao, không phạt), ghế còn lại giữ cho ngày sau, lương vẫn trả. */
const closeEarly = (session: Session): DomainEvent[] => {
  const { state } = session;
  const { today } = state;
  const dropped = customersNotYetServed(today);
  today.seats = releaseHeld(today.seats);
  today.queue = [];
  today.counter = emptyCounter();
  today.nextArrivalIndex = today.arrivals.length;
  today.clock = SHOP_CLOSE_MINUTE;
  if (session.runtime) session.runtime.assist = null;
  state.phase = 'CLOSING';
  const events: DomainEvent[] = [{ type: 'SHIFT_CLOSED_EARLY', dropped }];
  endDayIfDone(session, events);
  return events;
};

const endDayIfDone = (session: Session, events: DomainEvent[]): void => {
  const { state } = session;
  const { today } = state;
  if (state.phase !== 'CLOSING' || today.queue.length || today.counter.state !== 'EMPTY') return;

  today.seats = expireAvailable(today.seats, state.day);
  const refund = refundFor(
    today.seats.filter((seat) => seat.state === 'EXPIRED'),
    computeModifiers(state.upgrades).refundRate,
  );
  if (refund > 0) {
    state.money += refund;
    today.transactions.push(makeTx('REFUND_EXPIRED', refund, state.day, Math.floor(today.clock)));
  }
  cancelOverCapTickets(state);
  payStaffWages(state);
  invariant(moneyBalances(today.moneyStart, today.transactions, state.money), `money invariant broken on day ${state.day}`);

  const summary = summarizeDay({
    day: state.day,
    moneyStart: today.moneyStart,
    moneyEnd: state.money,
    transactions: today.transactions,
    seats: today.seats,
    results: today.results,
    turnedAway: today.turnedAway,
    travelVietAfter: isTravelVietOpen(state.day) ? travelVietScore(state.starHistory) : null,
  });
  summary.staffNotices = finishStaffDay(state, summary);
  state.lastSummary = summary;
  state.phase = 'SUMMARY';
  session.runtime = null;
  events.push({ type: 'DAY_ENDED', summary });
  if (state.day === TRAVELVIET_FROM_DAY - 1) events.push({ type: 'TRAVELVIET_UNLOCKED' });
};
