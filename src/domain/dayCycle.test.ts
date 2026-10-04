import { describe, expect, it } from 'vitest';
import { invariant } from './common/invariant';
import { purchaseCost } from './economy';
import { getRoute } from './routes';
import { canGoToStep, createNewGame, snapBaggage } from './dayCycle';
import { rollDayEvent } from './events';
import { GameSession } from './game';
import type { Command, DomainEvent, GameState } from './models';
import { seedWithDay1Event, seedWithWeatherOutcome } from './__integration__/fixtures';

const DAD_ECO_COST = getRoute('HAN-DAD').cost.ECONOMY;
const FIVE_ECO_COST = purchaseCost(DAD_ECO_COST, 5);
const SAFETY_THRESHOLD = 3 * DAD_ECO_COST;

const rejected = (events: DomainEvent[]) => events.find((e) => e.type === 'COMMAND_REJECTED');

const newGame = (type: 'NONE' | 'RUSH' | 'WEATHER' = 'NONE') => GameSession.newGame(seedWithDay1Event(type));
const firstDadFlight = (state: Readonly<GameState>) => state.today.flights.find((f) => f.routeId === 'HAN-DAD')?.id ?? '';

const openWithSeats = (game: GameSession, eco = 3) => {
  game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
  game.dispatch({ type: 'PREP_SET_QTY', flightId: firstDadFlight(game.state), cabin: 'ECONOMY', qty: eco });
  game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
  game.dispatch({ type: 'OPEN_COUNTER' });
};

const tickUntil = (game: GameSession, predicate: () => boolean, limit = 20_000) => {
  const events: DomainEvent[] = [];
  for (let i = 0; i < limit && !predicate(); i++) events.push(...game.tick(100));
  return events;
};

describe('createNewGame', () => {
  it('starts at day 1 PREP with 6.000k and the two starting routes', () => {
    const state = createNewGame(1);
    expect(state).toMatchObject({ day: 1, phase: 'PREP', money: 6000, profile: null, unlockedRoutes: ['HAN-SGN', 'HAN-DAD'] });
    expect(state.today.flights).toHaveLength(6);
  });
});

describe('helpers', () => {
  it('snaps baggage within 1 kg of a mark, clamps 0–30', () => {
    expect(snapBaggage(14)).toBe(15);
    expect(snapBaggage(21)).toBe(20);
    expect(snapBaggage(17)).toBe(17);
    expect(snapBaggage(29.6)).toBe(30);
    expect(snapBaggage(-5)).toBe(0);
    expect(snapBaggage(99)).toBe(30);
  });

  it('cannot jump past an incomplete step', () => {
    const draft = { step: 'FLIGHT' as const, flightId: null, routeStamp: null, timeStamp: null, cabin: null, seat: null, baggageKg: 0, extras: [] };
    expect(canGoToStep(draft, 'FLIGHT')).toBe(true);
    expect(canGoToStep(draft, 'SEAT')).toBe(false);
    expect(canGoToStep({ ...draft, flightId: 'x', cabin: 'ECONOMY' }, 'SEAT')).toBe(true);
    expect(canGoToStep({ ...draft, flightId: 'x', cabin: 'ECONOMY' }, 'EXTRAS')).toBe(false);
  });
});

describe('commands outside the shift', () => {
  it('PROFILE_SET validates trimmed lengths and only once', () => {
    const game = newGame();
    expect(rejected(game.dispatch({ type: 'PROFILE_SET', playerName: '   ', brandName: 'Quầy' }))).toMatchObject({ reason: 'BAD_PLAYER_NAME' });
    expect(rejected(game.dispatch({ type: 'PROFILE_SET', playerName: 'An', brandName: 'x'.repeat(21) }))).toMatchObject({ reason: 'BAD_BRAND_NAME' });
    expect(game.dispatch({ type: 'PROFILE_SET', playerName: ' An ', brandName: 'Săn Vé Đêm' })).toEqual([{ type: 'PROFILE_SET' }]);
    expect(game.state.profile).toEqual({ playerName: 'An', brandName: 'Săn Vé Đêm' });
    expect(rejected(game.dispatch({ type: 'PROFILE_SET', playerName: 'B', brandName: 'C' }))).toBeTruthy();
  });

  it('rejects commands in the wrong phase', () => {
    const game = newGame();
    const wrong: Command[] = [
      { type: 'DELIVER_TICKET' },
      { type: 'PRINT_TICKET' },
      { type: 'REFUSE_CUSTOMER' },
      { type: 'BUILD_RESET' },
      { type: 'GO_TO_SHOP' },
      { type: 'NEXT_DAY' },
      { type: 'PREP_SET_SEAT_BIAS', bias: 'WINDOW' },
    ];
    for (const command of wrong) expect(rejected(game.dispatch(command)), command.type).toBeTruthy();
  });

  it('PREP_SET_QTY enforces limits; confirm deducts once; double confirm is rejected', () => {
    const game = newGame();
    const flightId = firstDadFlight(game.state);
    expect(rejected(game.dispatch({ type: 'PREP_SET_QTY', flightId, cabin: 'ECONOMY', qty: 13 }))).toBeTruthy();
    expect(rejected(game.dispatch({ type: 'PREP_SET_QTY', flightId: 'QV999', cabin: 'ECONOMY', qty: 1 }))).toBeTruthy();
    game.dispatch({ type: 'PREP_SET_QTY', flightId, cabin: 'ECONOMY', qty: 5 });
    const events = game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    expect(events[0]).toMatchObject({ type: 'SEATS_PURCHASED', cost: FIVE_ECO_COST });
    expect(game.state.money).toBe(6000 - FIVE_ECO_COST);
    expect(rejected(game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' }))).toMatchObject({ reason: 'NOTHING_PENDING' });
    expect(game.state.money).toBe(6000 - FIVE_ECO_COST);
  });

  it('cannot buy more than money allows', () => {
    const game = newGame();
    const sgn = game.state.today.flights.filter((f) => f.routeId === 'HAN-SGN');
    for (const flight of sgn) game.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'ECONOMY', qty: 3 });
    expect(rejected(game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' }))).toMatchObject({ reason: 'NOT_ENOUGH_MONEY' });
    game.dispatch({ type: 'PREP_CLEAR_PENDING' });
    expect(game.state.today.pendingPurchase).toEqual({});
  });

  it('OPEN_COUNTER rejects unconfirmed pending seats', () => {
    const game = newGame();
    game.dispatch({ type: 'PREP_SET_QTY', flightId: firstDadFlight(game.state), cabin: 'ECONOMY', qty: 1 });
    expect(rejected(game.dispatch({ type: 'OPEN_COUNTER' }))).toMatchObject({ reason: 'PENDING_NOT_CONFIRMED' });
  });

  it('SETTINGS_UPDATE clamps volumes', () => {
    const game = newGame();
    game.dispatch({ type: 'SETTINGS_UPDATE', patch: { musicVolume: 3, haptics: false } });
    expect(game.state.settings).toMatchObject({ musicVolume: 1, haptics: false });
  });

  it('safety net gifts seats when money is below the threshold', () => {
    const state = createNewGame(seedWithDay1Event('NONE'));
    state.money = 100;
    state.phase = 'SHOP';
    state.lastSummary = { day: 1, moneyStart: 400, moneyEnd: 100 } as GameState['lastSummary'];
    const game = new GameSession(state);
    const events = game.dispatch({ type: 'NEXT_DAY' });
    expect(events).toContainEqual(expect.objectContaining({ type: 'SUPPORT_GIFT' }));
    expect(game.state.today.seats.filter((s) => s.unitCost === 0)).toHaveLength(3);
  });

  it('safety net gives nothing when money is at or above the threshold', () => {
    const state = createNewGame(seedWithDay1Event('NONE'));
    state.money = SAFETY_THRESHOLD;
    state.phase = 'SHOP';
    state.lastSummary = { day: 1, moneyStart: 6000, moneyEnd: SAFETY_THRESHOLD } as GameState['lastSummary'];
    const game = new GameSession(state);
    const events = game.dispatch({ type: 'NEXT_DAY' });
    expect(events.some((e) => e.type === 'SUPPORT_GIFT')).toBe(false);
    expect(game.state.today.seats.some((s) => s.unitCost === 0)).toBe(false);
  });

  it('safety net does not stack when NEXT_DAY is repeated', () => {
    const state = createNewGame(seedWithDay1Event('NONE'));
    state.money = 100;
    state.phase = 'SHOP';
    state.lastSummary = { day: 1, moneyStart: 400, moneyEnd: 100 } as GameState['lastSummary'];
    const game = new GameSession(state);
    game.dispatch({ type: 'NEXT_DAY' });
    const repeated = game.dispatch({ type: 'NEXT_DAY' });
    expect(rejected(repeated)).toBeDefined();
    expect(game.state.today.seats.filter((s) => s.unitCost === 0)).toHaveLength(3);
  });

  it('cannot construct a session mid-shift', () => {
    const state = createNewGame(1);
    state.phase = 'OPEN';
    expect(() => new GameSession(state)).toThrow();
  });
});

describe('shift', () => {
  it('opens at 08:00, spawns the first customer at 08:06 and seats them at the counter', () => {
    const game = newGame();
    openWithSeats(game);
    expect(game.state.phase).toBe('OPEN');
    const events = tickUntil(game, () => game.state.today.counter.state === 'BUILDING');
    expect(events.some((e) => e.type === 'CUSTOMER_SPAWNED')).toBe(true);
    expect(events.some((e) => e.type === 'CUSTOMER_AT_COUNTER')).toBe(true);
    expect(Math.floor(game.state.today.clock)).toBe(486);
  });

  it('clamps huge deltas to 100 ms', () => {
    const game = newGame();
    openWithSeats(game);
    game.tick(5000);
    expect(game.state.today.clock).toBeCloseTo(480.2);
  });

  it('builds, prints and delivers a correct ticket', () => {
    const game = newGame();
    openWithSeats(game);
    tickUntil(game, () => game.state.today.counter.state === 'BUILDING');
    const flightId = firstDadFlight(game.state);
    const seat = game.state.today.seats[0]?.seat ?? '3A';
    const order = game.state.today.queue[0]?.order;
    expect(order?.routeId).toBe('HAN-DAD');
    expect(rejected(game.dispatch({ type: 'PRINT_TICKET' }))).toBeTruthy();
    expect(rejected(game.dispatch({ type: 'BUILD_GOTO_STEP', step: 'REVIEW' }))).toBeTruthy();
    game.dispatch({ type: 'BUILD_SELECT_FLIGHT', flightId, cabin: 'ECONOMY' });
    game.dispatch({ type: 'BUILD_SELECT_SEAT', seat });
    expect(game.state.today.seats.find((s) => s.seat === seat)?.state).toBe('HELD');
    game.dispatch({ type: 'BUILD_GOTO_STEP', step: 'REVIEW' });
    expect(game.dispatch({ type: 'PRINT_TICKET' })).toEqual([{ type: 'PRINT_STARTED', durationMs: 3000 }]);
    expect(rejected(game.dispatch({ type: 'DELIVER_TICKET' }))).toBeTruthy();
    expect(rejected(game.dispatch({ type: 'BUILD_RESET' }))).toBeTruthy();
    tickUntil(game, () => game.state.today.counter.state === 'READY_TO_DELIVER');
    const scored = game.dispatch({ type: 'DELIVER_TICKET' });
    expect(scored[0]).toMatchObject({ type: 'TICKET_SCORED', result: { outcome: 'PERFECT', revenue: 1100 } });
    expect(rejected(game.dispatch({ type: 'DELIVER_TICKET' }))).toBeTruthy();
    expect(game.state.money).toBe(6000 - 3 * DAD_ECO_COST + 1100);
    expect(game.state.today.seats.find((s) => s.seat === seat)?.state).toBe('SOLD');
  });

  it('BUILD_RESET releases the held seat; leaving customer releases it too', () => {
    const game = newGame();
    openWithSeats(game);
    tickUntil(game, () => game.state.today.counter.state === 'BUILDING');
    const flightId = firstDadFlight(game.state);
    const seat = game.state.today.seats[0]?.seat ?? '3A';
    game.dispatch({ type: 'BUILD_SELECT_FLIGHT', flightId, cabin: 'ECONOMY' });
    game.dispatch({ type: 'BUILD_SELECT_SEAT', seat });
    game.dispatch({ type: 'BUILD_RESET' });
    expect(game.state.today.seats.every((s) => s.state === 'AVAILABLE')).toBe(true);
    game.dispatch({ type: 'BUILD_SELECT_FLIGHT', flightId, cabin: 'ECONOMY' });
    game.dispatch({ type: 'BUILD_SELECT_SEAT', seat });
    const events = tickUntil(game, () => game.state.today.counter.state === 'RESOLVING');
    expect(events).toContainEqual(expect.objectContaining({ type: 'CUSTOMER_LEFT' }));
    expect(game.state.today.results[0]).toMatchObject({ outcome: 'LEFT', stars: 1, penalty: 150 });
    expect(game.state.today.seats.every((s) => s.state === 'AVAILABLE')).toBe(true);
  });

  it('delivery wins over patience running out in the same tick', () => {
    const game = newGame();
    openWithSeats(game);
    tickUntil(game, () => game.state.today.counter.state === 'BUILDING');
    game.dispatch({ type: 'BUILD_SELECT_FLIGHT', flightId: firstDadFlight(game.state), cabin: 'ECONOMY' });
    game.dispatch({ type: 'BUILD_SELECT_SEAT', seat: game.state.today.seats[0]?.seat ?? '3A' });
    game.dispatch({ type: 'BUILD_GOTO_STEP', step: 'REVIEW' });
    game.dispatch({ type: 'PRINT_TICKET' });
    tickUntil(game, () => game.state.today.counter.state === 'READY_TO_DELIVER');
    const customer = game.state.today.queue[0];
    if (customer) (customer as { patienceLeftMs: number }).patienceLeftMs = 1;
    const scored = game.dispatch({ type: 'DELIVER_TICKET' });
    expect(scored[0]).toMatchObject({ type: 'TICKET_SCORED', result: { outcome: 'GOOD' } });
    game.tick(100);
    expect(game.state.today.results).toHaveLength(1);
  });

  it('tutorial customer on day 1 never loses patience', () => {
    const game = newGame();
    game.dispatch({ type: 'PREP_SET_QTY', flightId: firstDadFlight(game.state), cabin: 'ECONOMY', qty: 1 });
    game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    tickUntil(game, () => game.state.today.counter.state === 'BUILDING');
    for (let i = 0; i < 2000; i++) game.tick(100);
    expect(game.state.today.queue[0]).toMatchObject({ infinitePatience: true, position: 'COUNTER' });
  });

  it('turns customers away when the queue is full, without stars', () => {
    const game = newGame('RUSH');
    openWithSeats(game, 0);
    const events = tickUntil(game, () => game.state.phase === 'SUMMARY');
    const summary = game.state.lastSummary;
    expect(summary?.served ?? 0).toBeGreaterThanOrEqual(0);
    expect(events.filter((e) => e.type === 'CUSTOMER_TURNED_AWAY')).toHaveLength(game.state.today.turnedAway);
    expect(game.state.today.results.length + game.state.today.turnedAway).toBe(game.state.today.targetCustomers);
  });

  it('closes at 19:00, serves the rest, then SUMMARY with unsold seats expired', () => {
    const game = newGame();
    openWithSeats(game, 5);
    const events = tickUntil(game, () => game.state.phase === 'SUMMARY');
    const closingAt = events.findIndex((e) => e.type === 'DAY_CLOSING');
    expect(closingAt).toBeGreaterThanOrEqual(0);
    expect(events.at(-1)).toMatchObject({ type: 'DAY_ENDED' });
    expect(game.state.lastSummary?.expiredSeats).toBe(5);
    expect(game.state.today.seats.every((s) => s.state === 'EXPIRED')).toBe(true);
  });

  it('SEVERE weather cancels every flight and loses every seat of the forecast route only', () => {
    const seed = seedWithWeatherOutcome('SEVERE');
    const forecast = rollDayEvent(seed, 1, ['HAN-SGN', 'HAN-DAD']);
    invariant(forecast.type === 'WEATHER', 'fixture must forecast WEATHER');
    const otherRoute = forecast.routeId === 'HAN-SGN' ? 'HAN-DAD' : 'HAN-SGN';

    const game = GameSession.newGame(seed);
    const flightOf = (routeId: string) => game.state.today.flights.find((f) => f.routeId === routeId)?.id ?? '';
    game.dispatch({ type: 'PREP_SET_QTY', flightId: flightOf(forecast.routeId), cabin: 'ECONOMY', qty: 2 });
    game.dispatch({ type: 'PREP_SET_QTY', flightId: flightOf(otherRoute), cabin: 'ECONOMY', qty: 2 });
    game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    game.dispatch({ type: 'OPEN_COUNTER' });

    const routeOfSeat = (flightId: string) => game.state.today.flights.find((f) => f.id === flightId)?.routeId;
    const forecastSeats = game.state.today.seats.filter((s) => routeOfSeat(s.flightId) === forecast.routeId);
    const otherSeats = game.state.today.seats.filter((s) => routeOfSeat(s.flightId) === otherRoute);

    expect(game.state.today.flights.filter((f) => f.routeId === forecast.routeId).every((f) => f.status === 'CANCELLED')).toBe(true);
    expect(forecastSeats.every((s) => s.state === 'LOST')).toBe(true);
    expect(otherSeats.every((s) => s.state === 'AVAILABLE')).toBe(true);
    expect(game.state.today.event).toMatchObject({ type: 'WEATHER', outcome: 'SEVERE' });
  });

  it('BAD weather loses about a third of the forecast route seats, leaves the other route untouched', () => {
    const seed = seedWithWeatherOutcome('BAD');
    const forecast = rollDayEvent(seed, 1, ['HAN-SGN', 'HAN-DAD']);
    invariant(forecast.type === 'WEATHER', 'fixture must forecast WEATHER');
    const otherRoute = forecast.routeId === 'HAN-SGN' ? 'HAN-DAD' : 'HAN-SGN';

    const game = GameSession.newGame(seed);
    const flightOf = (routeId: string) => game.state.today.flights.find((f) => f.routeId === routeId)?.id ?? '';
    game.dispatch({ type: 'PREP_SET_QTY', flightId: flightOf(forecast.routeId), cabin: 'ECONOMY', qty: 9 });
    game.dispatch({ type: 'PREP_SET_QTY', flightId: flightOf(otherRoute), cabin: 'ECONOMY', qty: 9 });
    game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    game.dispatch({ type: 'OPEN_COUNTER' });

    const routeOfSeat = (flightId: string) => game.state.today.flights.find((f) => f.id === flightId)?.routeId;
    const forecastSeats = game.state.today.seats.filter((s) => routeOfSeat(s.flightId) === forecast.routeId);
    const otherSeats = game.state.today.seats.filter((s) => routeOfSeat(s.flightId) === otherRoute);
    const forecastLost = forecastSeats.filter((s) => s.state === 'LOST').length;

    expect(forecastLost).toBe(Math.round(forecastSeats.length / 3));
    expect(otherSeats.every((s) => s.state === 'AVAILABLE')).toBe(true);
    expect(game.state.today.flights.filter((f) => f.routeId === forecast.routeId).every((f) => f.status === 'SCHEDULED')).toBe(true);
  });
});

describe('staff', () => {
  const gameOnDay8 = () => {
    const state = createNewGame(seedWithDay1Event('NONE'));
    state.day = 8;
    state.money = 100_000;
    state.today.moneyStart = 100_000;
    return new GameSession(state);
  };

  it('hiring in PREP charges the hire cost immediately and records it today', () => {
    const game = gameOnDay8();

    game.dispatch({ type: 'HIRE_STAFF', staffId: 'TRAINEE' });

    expect(game.state.staff).toEqual(['TRAINEE']);
    expect(game.state.money).toBe(100_000 - 4500);
    expect(game.state.today.transactions).toContainEqual({ type: 'STAFF_HIRE', amount: -4500, day: 8, minute: null, ref: 'TRAINEE' });
    expect(rejected(game.dispatch({ type: 'HIRE_STAFF', staffId: 'TRAINEE' }))).toMatchObject({ reason: 'ALREADY_HIRED' });
  });

  it('rejects hiring during a shift', () => {
    const game = gameOnDay8();
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });

    expect(rejected(game.dispatch({ type: 'HIRE_STAFF', staffId: 'TRAINEE' }))).toMatchObject({ reason: 'WRONG_PHASE' });
  });

  it('serves customers on their own and the wage is charged in the day summary', () => {
    const game = gameOnDay8();
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'HIRE_STAFF', staffId: 'VETERAN' });
    for (const flight of game.state.today.flights) {
      game.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'ECONOMY', qty: 8 });
      game.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'BUSINESS', qty: 3 });
    }
    game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    game.dispatch({ type: 'OPEN_COUNTER' });

    tickUntil(game, () => game.state.phase === 'SUMMARY', 60_000);

    expect(game.state.phase).toBe('SUMMARY');
    expect(game.state.lastSummary?.staffWages).toBe(1500);
    expect(game.state.today.staffTasks).toEqual([]);
    expect(game.state.today.results.some((result) => result.outcome !== 'LEFT')).toBe(true);
  });
});
