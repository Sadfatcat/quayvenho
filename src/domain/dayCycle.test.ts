import { describe, expect, it } from 'vitest';
import { BAGGAGE_HOLD_SPEED_KG_PER_S, SEAT_VALID_DAYS } from '@data/balance';
import { MS_PER_GAME_MINUTE } from '../config';
import { invariant } from './common/invariant';
import { purchaseCost } from './economy';
import { getRoute } from './routes';
import { canGoToStep, closeEarlyBlockedReason, createNewGame, expectedCustomers, snapBaggage } from './dayCycle';
import { PERSONAL } from '@data/personal';
import { rollDayEvent } from './events';
import { newMember } from './staff';
import { isWindow } from './seatMap';
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
      { type: 'GO_TO_SHOP' },
      { type: 'NEXT_DAY' },
      { type: 'PREP_SET_SEAT_BIAS', bias: 'WINDOW' },
    ];
    for (const command of wrong) expect(rejected(game.dispatch(command)), command.type).toBeTruthy();
  });

  it('PREP_SET_SEAT_BIAS needs AIRLINE_RELATIONS', () => {
    const game = newGame();
    expect(rejected(game.dispatch({ type: 'PREP_SET_SEAT_BIAS', bias: 'WINDOW' }))).toMatchObject({ reason: 'UPGRADE_REQUIRED' });
  });

  it('with AIRLINE_RELATIONS, the chosen bias steers which seats a purchase gets', () => {
    const windowSeatsBought = (bias: 'WINDOW' | 'AISLE'): number => {
      let total = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const game = GameSession.newGame(seed);
        game.state.upgrades.push('AIRLINE_RELATIONS');
        expect(rejected(game.dispatch({ type: 'PREP_SET_SEAT_BIAS', bias }))).toBeFalsy();
        const flightId = firstDadFlight(game.state);
        game.dispatch({ type: 'PREP_SET_QTY', flightId, cabin: 'ECONOMY', qty: 6 });
        game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
        total += game.state.today.seats.filter((owned) => owned.flightId === flightId && isWindow(owned.seat)).length;
      }
      return total;
    };
    expect(windowSeatsBought('WINDOW')).toBeGreaterThan(windowSeatsBought('AISLE'));
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
    expect(game.state.today.clock).toBeCloseTo(480 + 100 / MS_PER_GAME_MINUTE);
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
    expect(game.dispatch({ type: 'PRINT_TICKET' })).toEqual([{ type: 'PRINT_STARTED', durationMs: 2000 }]);
    expect(rejected(game.dispatch({ type: 'DELIVER_TICKET' }))).toBeTruthy();
    tickUntil(game, () => game.state.today.counter.state === 'READY_TO_DELIVER');
    const scored = game.dispatch({ type: 'DELIVER_TICKET' });
    expect(scored[0]).toMatchObject({ type: 'TICKET_SCORED', result: { outcome: 'PERFECT', revenue: 1100 } });
    expect(rejected(game.dispatch({ type: 'DELIVER_TICKET' }))).toBeTruthy();
    expect(game.state.money).toBe(6000 - 3 * DAD_ECO_COST + 1100);
    expect(game.state.today.seats.find((s) => s.seat === seat)?.state).toBe('SOLD');
  });

  it('picking another seat releases the held one; a leaving customer releases it too', () => {
    const game = newGame();
    openWithSeats(game);
    tickUntil(game, () => game.state.today.counter.state === 'BUILDING');
    const flightId = firstDadFlight(game.state);
    const seat = game.state.today.seats[0]?.seat ?? '3A';
    game.dispatch({ type: 'BUILD_SELECT_FLIGHT', flightId, cabin: 'ECONOMY' });
    game.dispatch({ type: 'BUILD_SELECT_SEAT', seat });
    const otherSeat = game.state.today.seats.find((s) => s.seat !== seat && s.cabin === 'ECONOMY' && s.state === 'AVAILABLE')?.seat ?? seat;
    game.dispatch({ type: 'BUILD_SELECT_SEAT', seat: otherSeat });
    expect(game.state.today.seats.filter((s) => s.state === 'HELD')).toHaveLength(1);
    game.dispatch({ type: 'BUILD_SELECT_SEAT', seat });
    const events = tickUntil(game, () => game.state.today.counter.state === 'RESOLVING');
    expect(events).toContainEqual(expect.objectContaining({ type: 'CUSTOMER_LEFT' }));
    expect(game.state.today.results[0]).toMatchObject({ outcome: 'LEFT', stars: 1 });
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

  it('never limits the queue: a burst of arrivals all join and each ends with a result', () => {
    const BURST = 20;
    const game = newGame();
    openWithSeats(game, 0);
    game.state.today.targetCustomers = BURST;
    game.state.today.arrivals = Array<number>(BURST).fill(game.state.today.clock);
    game.state.today.nextArrivalIndex = 0;
    game.tick(100);
    expect(game.state.today.queue).toHaveLength(BURST);
    tickUntil(game, () => game.state.phase === 'SUMMARY');
    expect(game.state.today.turnedAway).toBe(0);
    expect(game.state.today.results).toHaveLength(BURST);
  });

  it('WAITING_LOUNGE makes queued customers lose patience 15% slower', () => {
    const queuedLossOver = (upgrades: string[]): number => {
      const game = newGame('RUSH');
      game.state.upgrades.push(...upgrades);
      openWithSeats(game, 0);
      tickUntil(game, () => game.state.today.queue.length >= 2);
      const waiting = game.state.today.queue[1];
      invariant(waiting?.position === 'QUEUE', 'expected a queued customer');
      const before = waiting.patienceLeftMs;
      for (let i = 0; i < 20; i++) game.tick(100);
      return before - waiting.patienceLeftMs;
    };
    expect(queuedLossOver(['WAITING_LOUNGE']) / queuedLossOver([])).toBeCloseTo(0.85, 2);
  });

  describe('expectedCustomers', () => {
    it('in PREP equals the target customers set on opening, including after a price change', () => {
      const game = newGame('RUSH');
      game.state.today.priceAdjustPct = { 'HAN-DAD': 20 };
      const expected = expectedCustomers(game.state);
      game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
      game.dispatch({ type: 'OPEN_COUNTER' });
      expect(game.state.today.targetCustomers).toBe(expected);
    });

    it('in SHOP equals the next day target once that day is opened', () => {
      const game = newGame();
      openWithSeats(game, 0);
      tickUntil(game, () => game.state.phase === 'SUMMARY');
      game.dispatch({ type: 'GO_TO_SHOP' });
      const expected = expectedCustomers(game.state);
      game.dispatch({ type: 'NEXT_DAY' });
      game.dispatch({ type: 'OPEN_COUNTER' });
      expect(game.state.day).toBe(2);
      expect(game.state.today.targetCustomers).toBe(expected);
    });
  });

  it('closes at 19:00, serves the rest, then SUMMARY; unsold seats are kept for later days', () => {
    const game = newGame();
    openWithSeats(game, 5);
    const events = tickUntil(game, () => game.state.phase === 'SUMMARY');
    const closingAt = events.findIndex((e) => e.type === 'DAY_CLOSING');
    expect(closingAt).toBeGreaterThanOrEqual(0);
    expect(events.at(-1)).toMatchObject({ type: 'DAY_ENDED' });
    expect(game.state.lastSummary?.expiredSeats).toBe(0);
    const unsold = game.state.today.seats.filter((s) => s.state === 'AVAILABLE');
    expect(unsold.length).toBeGreaterThan(0);
    expect(unsold.every((s) => s.expiresDay === SEAT_VALID_DAYS)).toBe(true);
  });

  it('seats bought on day 1 carry to days 2 and 3, then expire at the end of day 3 with the refund', () => {
    const game = newGame();
    openWithSeats(game, 5);
    const stateOf = (state: string): number => game.state.today.seats.filter((s) => s.state === state).length;
    const finishDay = (): void => {
      tickUntil(game, () => game.state.phase === 'SUMMARY');
      game.dispatch({ type: 'GO_TO_SHOP' });
    };

    finishDay();
    const leftAfterDay1 = stateOf('AVAILABLE');
    game.dispatch({ type: 'NEXT_DAY' });
    expect(game.state.day).toBe(2);
    expect(stateOf('AVAILABLE')).toBe(leftAfterDay1);

    game.dispatch({ type: 'OPEN_COUNTER' });
    finishDay();
    const leftAfterDay2 = stateOf('AVAILABLE');
    game.dispatch({ type: 'NEXT_DAY' });
    expect(game.state.day).toBe(3);
    expect(stateOf('AVAILABLE')).toBe(leftAfterDay2);

    game.dispatch({ type: 'OPEN_COUNTER' });
    const availableWhenOpened = stateOf('AVAILABLE');
    finishDay();
    expect(stateOf('AVAILABLE')).toBe(0);
    expect(game.state.lastSummary?.expiredSeats).toBe(stateOf('EXPIRED'));
    expect(stateOf('EXPIRED') + stateOf('SOLD')).toBe(availableWhenOpened);
  });

  it('seats that expire carry no leftovers into the next day', () => {
    const game = newGame();
    openWithSeats(game, 3);
    for (let day = 1; day <= SEAT_VALID_DAYS; day++) {
      tickUntil(game, () => game.state.phase === 'SUMMARY');
      game.dispatch({ type: 'GO_TO_SHOP' });
      game.dispatch({ type: 'NEXT_DAY' });
      if (day < SEAT_VALID_DAYS) game.dispatch({ type: 'OPEN_COUNTER' });
    }
    expect(game.state.day).toBe(SEAT_VALID_DAYS + 1);
    expect(game.state.today.seats.filter((seat) => seat.unitCost > 0)).toEqual([]);
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
  const richGame = (day: number) => {
    const state = createNewGame(seedWithDay1Event('NONE'));
    state.day = day;
    state.money = 500_000;
    state.today.moneyStart = 500_000;
    return new GameSession(state);
  };

  const stockAllFlights = (game: GameSession) => {
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    for (const flight of game.state.today.flights) {
      game.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'ECONOMY', qty: 8 });
      game.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'BUSINESS', qty: 3 });
    }
    game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
  };

  const tickToFirstCustomer = (game: GameSession) => {
    tickUntil(game, () => game.state.today.counter.state === 'BUILDING');
    return game.state.today.queue[0]?.order;
  };

  it('hiring in PREP charges the hire cost now, records it today and names the member', () => {
    const game = richGame(15);

    const events = game.dispatch({ type: 'HIRE_STAFF', kind: 'SENIOR' });

    expect(events).toEqual([{ type: 'STAFF_HIRED', staffId: 's0', kind: 'SENIOR' }]);
    expect(game.state.money).toBe(500_000 - 20_000);
    expect(game.state.today.transactions).toContainEqual({ type: 'STAFF_HIRE', amount: -20_000, day: 15, minute: null, ref: 's0' });
    expect(game.state.staff[0]).toMatchObject({ id: 's0', kind: 'SENIOR', daysWorked: 0 });
  });

  it('rejects hiring a third counter staff, hiring too early and hiring during a shift', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'INTERN' });
    game.dispatch({ type: 'HIRE_STAFF', kind: 'JUNIOR' });
    expect(rejected(game.dispatch({ type: 'HIRE_STAFF', kind: 'MIDDLE' }))).toMatchObject({ reason: 'STAFF_FULL' });
    expect(rejected(richGame(2).dispatch({ type: 'HIRE_STAFF', kind: 'INTERN' }))).toMatchObject({ reason: 'DAY_TOO_EARLY' });

    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    expect(rejected(game.dispatch({ type: 'HIRE_STAFF', kind: 'MARKETING' }))).toMatchObject({ reason: 'WRONG_PHASE' });
  });

  it('firing is free and re-hiring pays the full hire cost again', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'JUNIOR' });
    const afterHire = game.state.money;

    game.dispatch({ type: 'FIRE_STAFF', staffId: 's0' });
    expect(game.state.money).toBe(afterHire);
    expect(game.state.staff).toEqual([]);

    game.dispatch({ type: 'HIRE_STAFF', kind: 'JUNIOR' });
    expect(game.state.money).toBe(afterHire - 10_000);
    expect(game.state.staff[0]?.id).toBe('s1');
  });

  it('Junior takes the right ticket cabin but never prints or delivers', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'JUNIOR' });
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });
    const order = tickToFirstCustomer(game);
    expect(game.state.today.counter.draft?.cabin).toBeNull();

    tickUntil(game, () => game.state.today.counter.draft?.cabin !== null, 200);

    expect(game.state.today.counter.draft?.cabin).toBe(order?.cabin);
    expect(game.state.today.counter.state).toBe('BUILDING');
  });

  it('Middle stamps the matching flight and weighs baggage; Senior then picks the seat and services', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'MIDDLE' });
    game.dispatch({ type: 'HIRE_STAFF', kind: 'SENIOR' });
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });
    const order = tickToFirstCustomer(game);
    game.dispatch({ type: 'BUILD_TAKE_TICKET', cabin: order?.cabin ?? 'ECONOMY' });

    tickUntil(game, () => game.state.today.counter.draft?.seat !== null, 400);

    const draft = game.state.today.counter.draft;
    expect(draft?.routeStamp).toBe(order?.routeId);
    expect(draft?.timeStamp).not.toBeNull();
    expect(draft?.flightId).not.toBeNull();
    expect(draft?.seat).not.toBeNull();
    expect(game.state.today.counter.state).toBe('BUILDING');
  });

  it('Middle chooses the ticket first, then stamps and weighs; Senior waits for that ticket and then adds services and the seat', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'MIDDLE' });
    game.dispatch({ type: 'HIRE_STAFF', kind: 'SENIOR' });
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });
    const order = tickToFirstCustomer(game);
    if (!order) throw new Error('no customer');
    order.extras = ['VEG_MEAL'];

    tickUntil(game, () => game.state.today.counter.draft?.seat !== null, 400);

    const draft = game.state.today.counter.draft;
    expect(draft?.cabin).toBe(order.cabin);
    expect(draft?.routeStamp).toBe(order.routeId);
    expect(draft?.extras).toEqual(['VEG_MEAL']);
    expect(draft?.seat).not.toBeNull();
  });

  it('a Senior working alone does nothing until a ticket is on the desk, then adds services', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'SENIOR' });
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });
    const order = tickToFirstCustomer(game);
    if (!order) throw new Error('no customer');
    order.extras = ['VEG_MEAL'];

    for (let step = 0; step < 100; step++) game.tick(100);
    expect(game.state.today.counter.draft?.cabin).toBeNull();
    expect(game.state.today.counter.draft?.extras).toEqual([]);

    game.dispatch({ type: 'BUILD_TAKE_TICKET', cabin: order.cabin });
    tickUntil(game, () => game.state.today.counter.draft?.extras.length === 1, 400);
    expect(game.state.today.counter.draft?.extras).toEqual(['VEG_MEAL']);
    expect(game.state.today.counter.draft?.seat).toBeNull();
  });

  it('Middle weighs baggage like a held press: announces the hold, then writes the kg only once the hold is over', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'MIDDLE' });
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });
    const order = tickToFirstCustomer(game);
    if (!order) throw new Error('no customer');
    order.baggageKg = 20;

    const events = tickUntil(game, () => game.state.today.counter.draft?.baggageKg !== 0, 600);

    const started = events.find((event) => event.type === 'STAFF_WEIGH_STARTED');
    expect(started).toBeDefined();
    if (started?.type !== 'STAFF_WEIGH_STARTED') throw new Error('missing weigh event');
    expect(started.holdMs).toBe(Math.round((started.kg / BAGGAGE_HOLD_SPEED_KG_PER_S) * 1000));
    expect(game.state.today.counter.draft?.baggageKg).not.toBe(0);
  });

  it('Senior flags a customer whose passport name does not match, and stays quiet for a valid passport', () => {
    const flagged = (passportName: string): boolean => {
      const game = richGame(15);
      game.dispatch({ type: 'HIRE_STAFF', kind: 'SENIOR' });
      stockAllFlights(game);
      game.dispatch({ type: 'OPEN_COUNTER' });
      const order = tickToFirstCustomer(game);
      if (!order) throw new Error('no customer');
      order.passport = { name: passportName, bookedName: 'Lê Văn An' };
      const events = tickUntil(game, () => false, 150);
      return events.some((event) => event.type === 'STAFF_ASSISTED' && event.job === 'PASSPORT');
    };
    expect(flagged('Lê Văn Ân')).toBe(true);
    expect(flagged('Lê Văn An')).toBe(false);
  });

  it('staff work one job at a time: never two jobs finish in the same tick, and the draft still gets completed', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'MIDDLE' });
    game.dispatch({ type: 'HIRE_STAFF', kind: 'SENIOR' });
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });
    tickToFirstCustomer(game);

    let maxJobsInOneTick = 0;
    for (let i = 0; i < 600 && game.state.today.counter.draft?.seat === null; i++) {
      const jobs = game.tick(100).filter((event) => event.type === 'STAFF_ASSISTED').length;
      maxJobsInOneTick = Math.max(maxJobsInOneTick, jobs);
    }

    expect(maxJobsInOneTick).toBe(1);
    expect(game.state.today.counter.draft?.seat).not.toBeNull();
  });

  it('staff do not overwrite a step the player already did', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'JUNIOR' });
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });
    const order = tickToFirstCustomer(game);
    const otherCabin = order?.cabin === 'ECONOMY' ? 'BUSINESS' : 'ECONOMY';

    game.dispatch({ type: 'BUILD_TAKE_TICKET', cabin: otherCabin });
    game.tick(3000);
    expect(game.state.today.counter.draft?.cabin).toBe(otherCabin);
    game.tick(5000);
    expect(game.state.today.counter.draft?.cabin).toBe(otherCabin);
  });

  it('absent staff neither assist nor get paid; wages and work days only count for staff at work', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'JUNIOR' });
    game.dispatch({ type: 'HIRE_STAFF', kind: 'MIDDLE' });
    const junior = game.state.staff[0];
    if (!junior) throw new Error('missing junior');
    junior.absentUntilDay = 15;
    junior.absenceReason = 'SICK';
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });

    tickUntil(game, () => game.state.phase === 'SUMMARY', 60_000);

    expect(game.state.lastSummary?.staffWages).toBe(2000);
    expect(game.state.staff.map((member) => member.daysWorked)).toEqual([0, 1]);
  });

  it('an intern who reaches 8 days becomes a Junior at 60% pay, restarts the day count, and the summary carries a notice', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'INTERN' });
    const intern = game.state.staff[0];
    if (!intern) throw new Error('missing intern');
    intern.daysWorked = 7;
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });

    tickUntil(game, () => game.state.phase === 'SUMMARY', 60_000);

    expect(game.state.staff[0]).toMatchObject({ kind: 'JUNIOR', promoted: true, daysWorked: 0 });
    expect(game.state.lastSummary?.staffNotices).toContainEqual({ type: 'PROMOTED', staffId: intern.id, name: intern.name, toKind: 'JUNIOR' });
  });

  it('wages grow every third day by 40% of the profit growth', () => {
    const game = richGame(15);
    game.dispatch({ type: 'HIRE_STAFF', kind: 'INTERN' });
    game.state.profitHistory.push(100, 100, 100, 100, 100);
    stockAllFlights(game);
    game.dispatch({ type: 'OPEN_COUNTER' });

    tickUntil(game, () => game.state.phase === 'SUMMARY', 60_000);

    // Ngày 15 chia hết cho 3: 3 ngày gần nhất (100, 100, lợi nhuận hôm nay) so với 3 ngày trước (100, 100, 100).
    const profit = game.state.profitHistory.at(-1) ?? 0;
    expect(game.state.wageRaise).toBe(Math.max(0, Math.round((0.4 * ((100 + 100 + profit) / 3 - 100)) / 3)));
  });

  it('marketing raises the day target and teaching adds 0,5% for the quoted price', () => {
    const base = richGame(15);
    base.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    base.dispatch({ type: 'OPEN_COUNTER' });
    const baseTarget = base.state.today.targetCustomers;

    const boosted = richGame(15);
    boosted.dispatch({ type: 'HIRE_STAFF', kind: 'MARKETING' });
    boosted.dispatch({ type: 'TEACH_MARKETING' });
    const moneyAfterTeach = boosted.state.money;
    boosted.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    boosted.dispatch({ type: 'OPEN_COUNTER' });

    expect(boosted.state.staff[0]?.bonusPct).toBe(10.5);
    expect(moneyAfterTeach).toBe(500_000 - 10_000 - 2000);
    expect(boosted.state.today.targetCustomers).toBeGreaterThan(baseTarget);
  });
});

describe('staff and shop spending after the summary (phase SHOP)', () => {
  it('hiring in SHOP is charged now but booked on tomorrow, and the money invariant still holds on the next day', () => {
    const state = createNewGame(seedWithDay1Event('NONE'));
    state.day = 15;
    state.money = 500_000;
    state.today.moneyStart = 500_000;
    const game = new GameSession(state);
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    tickUntil(game, () => game.state.phase === 'SUMMARY', 60_000);
    game.dispatch({ type: 'GO_TO_SHOP' });
    const moneyBefore = game.state.money;

    game.dispatch({ type: 'HIRE_STAFF', kind: 'JUNIOR' });
    game.dispatch({ type: 'TEACH_MARKETING' });

    expect(game.state.money).toBe(moneyBefore - 10_000);
    expect(game.state.nextDayTransactions).toContainEqual({ type: 'STAFF_HIRE', amount: -10_000, day: 16, minute: null, ref: 's0' });
    expect(rejected(game.dispatch({ type: 'TEACH_MARKETING' }))).toMatchObject({ reason: 'NO_MARKETING' });

    game.dispatch({ type: 'NEXT_DAY' });
    expect(game.state.day).toBe(16);
    expect(game.state.today.transactions).toContainEqual({ type: 'STAFF_HIRE', amount: -10_000, day: 16, minute: null, ref: 's0' });
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    expect(() => tickUntil(game, () => game.state.phase === 'SUMMARY', 60_000)).not.toThrow();
  });

  describe('CLOSE_EARLY (đóng cửa sớm)', () => {
    const openMidShift = (): GameSession => {
      const game = newGame();
      openWithSeats(game, 5);
      for (let i = 0; i < 40; i++) game.tick(100);
      return game;
    };

    it('kết thúc ngày ngay, bỏ khách đang chờ và khách chưa đến mà không chấm sao hay phạt', () => {
      const game = openMidShift();
      const scoredBefore = game.state.today.results.length;

      const events = game.dispatch({ type: 'CLOSE_EARLY' });

      const closed = events.find((e) => e.type === 'SHIFT_CLOSED_EARLY');
      expect(closed).toMatchObject({ type: 'SHIFT_CLOSED_EARLY' });
      expect(events.at(-1)).toMatchObject({ type: 'DAY_ENDED' });
      expect(game.state.phase).toBe('SUMMARY');
      expect(game.state.today.results).toHaveLength(scoredBefore);
      expect(game.state.today.queue).toEqual([]);
      expect(game.state.lastSummary?.penalties).toBe(0);
      const dropped = closed?.type === 'SHIFT_CLOSED_EARLY' ? closed.dropped : -1;
      expect(dropped + scoredBefore).toBe(game.state.today.targetCustomers);
    });

    it('vẫn trả lương nhân viên', () => {
      const game = openMidShift();
      game.state.staff.push(newMember('JUNIOR', 0, 1));

      game.dispatch({ type: 'CLOSE_EARLY' });

      expect(game.state.lastSummary?.staffWages).toBeGreaterThan(0);
    });

    it('giữ ghế chưa bán cho ngày sau thay vì để hết hạn', () => {
      const game = openMidShift();

      game.dispatch({ type: 'CLOSE_EARLY' });

      expect(game.state.lastSummary?.expiredSeats).toBe(0);
      expect(game.state.today.seats.some((seat) => seat.state === 'AVAILABLE')).toBe(true);
    });

    it('bị từ chối khi chưa mở cửa', () => {
      const game = newGame();
      expect(rejected(game.dispatch({ type: 'CLOSE_EARLY' }))).toMatchObject({ reason: 'WRONG_PHASE' });
    });

    it('bị từ chối ở ngày hướng dẫn đầu tiên', () => {
      const game = newGame();
      game.dispatch({ type: 'OPEN_COUNTER' });
      expect(game.state.phase).toBe('OPEN');
      expect(rejected(game.dispatch({ type: 'CLOSE_EARLY' }))).toMatchObject({ reason: 'TUTORIAL_DAY' });
    });

    it('chờ khi khách ở quầy đang được chốt vé', () => {
      const game = openMidShift();
      game.state.today.counter = { ...game.state.today.counter, state: 'RESOLVING' };
      expect(closeEarlyBlockedReason(game.state)).toBe('CUSTOMER_BEING_RESOLVED');
    });

    it('bị từ chối ở ngày đặc biệt', () => {
      const game = openMidShift();
      const personal = { ...PERSONAL, enabled: true, scriptedMoments: [{ id: 'm', day: game.state.day, at: 'OPEN' as const, lines: ['x'] }] };
      expect(closeEarlyBlockedReason(game.state, personal)).toBe('SPECIAL_DAY');
    });
  });
});
