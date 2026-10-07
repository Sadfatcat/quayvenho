import { describe, expect, it } from 'vitest';
import { OVER_CAP_CANCEL_RATE, PRICE_CAP_PCT, PRICE_MAX_PCT, PRICING_UNLOCK_DAY } from '@data/pricing';
import { createNewGame } from './dayCycle';
import { rollDayEvent } from './events';
import { GameSession } from './game';
import type { DayEvent, DomainEvent } from './models';
import { clampPricePct, dayDemandProfile, isOverCap, isPricingOpen, priceDemandFactor } from './pricing';
import { seedWithDay1Event } from './__integration__/fixtures';

const NO_EVENT: DayEvent = { type: 'NONE' };
const HOLIDAY: DayEvent = { type: 'RUSH', holidayId: 'TET', hotRoutes: ['HAN-DAD', 'HAN-SGN'] };
const ROUTES = ['HAN-SGN', 'HAN-DAD'];
const TEST_MONEY = 100_000;

/** Chỉnh giá bị khoá ở những ngày đầu, nên các test giá chạy từ ngày mở khoá. */
const gameWithPricingOpen = (seed: number): GameSession => {
  const state = createNewGame(seed);
  state.day = PRICING_UNLOCK_DAY;
  state.money = TEST_MONEY;
  state.today.moneyStart = TEST_MONEY;
  return new GameSession(state);
};

describe('priceDemandFactor', () => {
  it('cheaper → more customers, pricier → fewer, base price → unchanged', () => {
    expect(priceDemandFactor(0, false)).toBe(1);
    expect(priceDemandFactor(-20, false)).toBeGreaterThan(1);
    expect(priceDemandFactor(20, false)).toBeLessThan(1);
  });

  it('holiday customers are less price-sensitive than normal days', () => {
    expect(priceDemandFactor(20, true)).toBeGreaterThan(priceDemandFactor(20, false));
  });

  it('halves the crowd right above the cap, but not at the cap', () => {
    const atCap = priceDemandFactor(PRICE_CAP_PCT, false);
    const justOver = priceDemandFactor(PRICE_CAP_PCT + 1, false);
    expect(isOverCap(PRICE_CAP_PCT)).toBe(false);
    expect(isOverCap(PRICE_CAP_PCT + 1)).toBe(true);
    expect(justOver).toBeLessThan(atCap * 0.55);
  });

  it('stays within sane bounds at the extremes', () => {
    expect(priceDemandFactor(-1000, false)).toBeLessThanOrEqual(1.6);
    expect(priceDemandFactor(1000, false)).toBeGreaterThan(0);
  });
});

describe('clampPricePct', () => {
  it('rounds to an integer and clamps to the allowed slider range', () => {
    expect(clampPricePct(12.4)).toBe(12);
    expect(clampPricePct(-99)).toBe(-30);
    expect(clampPricePct(99)).toBe(PRICE_MAX_PCT);
  });
});

describe('dayDemandProfile', () => {
  it('is neutral at base prices on a normal day', () => {
    const profile = dayDemandProfile(ROUTES, {}, NO_EVENT);
    expect(profile.averagePriceFactor).toBe(1);
    expect(profile.routeWeightMultiplier).toEqual({ 'HAN-SGN': 1, 'HAN-DAD': 1 });
  });

  it('raising one route lowers its share and the total, others keep their share', () => {
    const profile = dayDemandProfile(ROUTES, { 'HAN-SGN': 30 }, NO_EVENT);
    expect(profile.averagePriceFactor).toBeLessThan(1);
    expect(profile.routeWeightMultiplier['HAN-SGN']).toBeLessThan(profile.routeWeightMultiplier['HAN-DAD'] ?? 0);
  });

  it('boosts hot routes on a holiday', () => {
    const normal = dayDemandProfile(ROUTES, {}, NO_EVENT).routeWeightMultiplier['HAN-DAD'] ?? 0;
    const holiday = dayDemandProfile(ROUTES, {}, HOLIDAY).routeWeightMultiplier['HAN-DAD'] ?? 0;
    expect(holiday).toBeGreaterThan(normal);
  });
});

describe('holiday event', () => {
  it('carries a holiday id and distinct hot routes drawn from the unlocked routes', () => {
    const event = rollDayEvent(seedWithDay1Event('RUSH'), 1, ROUTES);
    expect(event.type).toBe('RUSH');
    if (event.type !== 'RUSH') return;
    expect(event.holidayId).not.toBe('');
    expect(new Set(event.hotRoutes).size).toBe(event.hotRoutes.length);
    expect(event.hotRoutes.every((route) => ROUTES.includes(route))).toBe(true);
  });
});

describe('SET_ROUTE_PRICE', () => {
  const rejected = (events: DomainEvent[]) => events.find((e) => e.type === 'COMMAND_REJECTED');

  it('allows price changes from day 1', () => {
    const game = new GameSession(createNewGame(3));
    expect(isPricingOpen(1)).toBe(true);
    expect(rejected(game.dispatch({ type: 'SET_ROUTE_PRICE', routeId: 'HAN-DAD', pct: 10 }))).toBeUndefined();
    expect(game.state.today.priceAdjustPct).toEqual({ 'HAN-DAD': 10 });
  });

  it('stores a clamped integer percent for an unlocked route during PREP', () => {
    const game = gameWithPricingOpen(3);
    expect(rejected(game.dispatch({ type: 'SET_ROUTE_PRICE', routeId: 'HAN-DAD', pct: 80 }))).toBeUndefined();
    expect(game.state.today.priceAdjustPct['HAN-DAD']).toBe(PRICE_MAX_PCT);
  });

  it('rejects locked routes, non-numbers and anything outside PREP', () => {
    const game = gameWithPricingOpen(3);
    expect(rejected(game.dispatch({ type: 'SET_ROUTE_PRICE', routeId: 'HAN-CDG', pct: 10 }))).toMatchObject({ reason: 'ROUTE_LOCKED' });
    expect(rejected(game.dispatch({ type: 'SET_ROUTE_PRICE', routeId: 'HAN-DAD', pct: Number.NaN }))).toMatchObject({ reason: 'BAD_PRICE' });
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    expect(rejected(game.dispatch({ type: 'SET_ROUTE_PRICE', routeId: 'HAN-DAD', pct: 10 }))).toMatchObject({ reason: 'WRONG_PHASE' });
  });
});

describe('prices change demand and revenue', () => {
  const targetFor = (pct: number): number => {
    const game = gameWithPricingOpen(seedWithDay1Event('NONE'));
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    for (const routeId of ROUTES) game.dispatch({ type: 'SET_ROUTE_PRICE', routeId, pct });
    game.dispatch({ type: 'OPEN_COUNTER' });
    return game.state.today.targetCustomers;
  };

  it('a +20% price brings fewer customers than base price, -20% brings more', () => {
    expect(targetFor(20)).toBeLessThan(targetFor(0));
    expect(targetFor(-20)).toBeGreaterThan(targetFor(0));
  });

  it('an over-cap price cuts the crowd to about half of what the cap would give', () => {
    expect(targetFor(PRICE_CAP_PCT + 10)).toBeLessThanOrEqual(Math.ceil(targetFor(PRICE_CAP_PCT) * 0.7));
  });
});

describe('over-cap cancellations at day end', () => {
  const playDayAt = (pct: number, seed: number) => {
    const game = gameWithPricingOpen(seed);
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    for (const routeId of ROUTES) game.dispatch({ type: 'SET_ROUTE_PRICE', routeId, pct });
    for (const flight of game.state.today.flights.filter((f) => ROUTES.includes(f.routeId))) {
      game.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'ECONOMY', qty: 1 });
    }
    game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    return game;
  };

  const sellEverything = (game: GameSession): void => {
    for (let guard = 0; guard < 60_000 && game.state.phase !== 'SUMMARY'; guard++) {
      const { today } = game.state;
      if (today.counter.state === 'BUILDING') game.dispatch({ type: 'REFUSE_CUSTOMER' });
      game.tick(100);
    }
  };

  it('never cancels tickets sold at or below the cap', () => {
    const game = playDayAt(PRICE_CAP_PCT, 5);
    sellEverything(game);
    expect(game.state.lastSummary).toMatchObject({ cancelledTickets: 0, cancelRefunds: 0 });
  });

  it('cancel rate constant is a probability and the over-cap flag is recorded on results', () => {
    expect(OVER_CAP_CANCEL_RATE).toBeGreaterThan(0);
    expect(OVER_CAP_CANCEL_RATE).toBeLessThan(1);
    const game = playDayAt(PRICE_CAP_PCT + 10, 5);
    sellEverything(game);
    expect(game.state.today.results.every((result) => result.overCap)).toBe(true);
  });
});

describe('cancellations refund the ticket, keep the money invariant', () => {
  it('refunds cancelled over-cap tickets at day end and counts them in the summary', () => {
    const game = new GameSession(createNewGame(9));
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    const state = game.state as import('./models').GameState;
    const sold = 40;
    const revenue = 1000;
    for (let index = 0; index < sold; index++) {
      state.today.results.push({ customerId: `x${index}`, outcome: 'PERFECT', stars: 5, revenue, tip: 0, penalty: 0, mistakes: [], overCap: true });
      state.today.transactions.push({ type: 'TICKET_REVENUE', amount: revenue, day: 1, minute: 500 });
    }
    state.money += sold * revenue;
    state.today.queue = [];
    state.phase = 'CLOSING';
    game.tick(100);

    const summary = game.state.lastSummary;
    expect(game.state.phase).toBe('SUMMARY');
    expect(summary?.cancelledTickets).toBeGreaterThan(0);
    expect(summary?.cancelledTickets).toBeLessThan(sold);
    expect(summary?.cancelRefunds).toBe((summary?.cancelledTickets ?? 0) * revenue);
    expect(game.state.money).toBe((summary?.moneyEnd ?? -1));
  });
});

describe('cancellations never push money below zero', () => {
  it('refunds only what the till still holds', () => {
    const game = new GameSession(createNewGame(9));
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    const state = game.state as import('./models').GameState;
    for (let index = 0; index < 30; index++) {
      state.today.results.push({ customerId: `y${index}`, outcome: 'PERFECT', stars: 5, revenue: 1000, tip: 0, penalty: 0, mistakes: [], overCap: true });
    }
    state.today.transactions.push({ type: 'TICKET_REVENUE', amount: 30000, day: 1, minute: 500 });
    state.today.transactions.push({ type: 'PENALTY', amount: -29500, day: 1, minute: 600 });
    state.money = state.today.moneyStart + 500;
    state.today.queue = [];
    state.phase = 'CLOSING';
    game.tick(100);
    expect(game.state.money).toBeGreaterThanOrEqual(0);
    expect(game.state.phase).toBe('SUMMARY');
  });
});
