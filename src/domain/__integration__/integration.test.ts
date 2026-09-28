import { describe, expect, it } from 'vitest';
import { rollDayEvent } from '../events';
import { GameSession } from '../game';
import type { Decision, Decide } from './bots';
import { playDay, playShift, randomBotRng, randomDecide } from './bots';

const seedWithDay1Event = (type: 'NONE' | 'RUSH') => {
  for (let seed = 1; ; seed++) if (rollDayEvent(seed, 1, ['HAN-SGN', 'HAN-DAD']).type === type) return seed;
};

describe('full day (Phase 1 acceptance)', () => {
  it('3 correct, 1 wrong, 1 correct refusal, 2 left → expected DaySummary', () => {
    const game = GameSession.newGame(seedWithDay1Event('RUSH'));
    const dad = game.state.today.flights.find((f) => f.routeId === 'HAN-DAD')?.id ?? '';
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'PREP_SET_QTY', flightId: dad, cabin: 'ECONOMY', qty: 3 });
    game.dispatch({ type: 'PREP_SET_QTY', flightId: dad, cabin: 'BUSINESS', qty: 1 });
    game.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    expect(game.state.today.targetCustomers).toBe(7);

    const plan: Decision[] = ['CORRECT', 'CORRECT', 'CORRECT', 'WRONG_CABIN', 'REFUSE', 'IGNORE', 'IGNORE'];
    const decide: Decide = (_order, index) => plan[index] ?? 'IGNORE';
    playShift(game, decide);

    const outcomes = game.state.today.results.map((r) => r.outcome).sort();
    expect(outcomes).toEqual(['FAILED', 'LEFT', 'LEFT', 'PERFECT', 'PERFECT', 'PERFECT', 'REFUSED_NO_STOCK']);
    expect(game.state.lastSummary).toMatchObject({
      day: 1,
      moneyStart: 400,
      moneyEnd: 400 - 280 + 270 - 45,
      ticketRevenue: 270,
      tips: 0,
      seatCost: 280,
      shopCost: 0,
      penalties: 45,
      expiredSeats: 0,
      served: 5,
      left: 2,
      turnedAway: 0,
      travelVietAfter: null,
    });
  });
});

describe('30 days with the perfect bot', () => {
  it('plays without errors, grows money and unlocks routes', () => {
    const game = GameSession.newGame(12345);
    let travelVietUnlocked = false;
    for (let day = 1; day <= 30; day++) {
      const events = playDay(game);
      travelVietUnlocked ||= events.some((e) => e.type === 'TRAVELVIET_UNLOCKED');
    }
    expect(game.state.day).toBe(31);
    expect(game.state.phase).toBe('PREP');
    expect(travelVietUnlocked).toBe(true);
    expect(game.state.lastSummary?.travelVietAfter).not.toBeNull();
    expect(game.state.money + game.state.upgrades.length).toBeGreaterThan(400);
    expect(game.state.unlockedRoutes.length).toBeGreaterThanOrEqual(4);
  });
});

describe('money invariant', () => {
  it('holds on 1.000 random days (checked inside endDay)', () => {
    let days = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const game = GameSession.newGame(seed);
      const decide = randomDecide(randomBotRng(seed));
      for (let day = 1; day <= 25; day++) {
        playDay(game, decide, 100);
        days++;
        expect(game.state.money).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(game.state.money)).toBe(true);
      }
    }
    expect(days).toBe(1000);
  }, 120_000);
});

describe('replay', () => {
  it('same seed + same commands → identical state', () => {
    const play = () => {
      const game = GameSession.newGame(777);
      for (let day = 1; day <= 5; day++) playDay(game);
      return game.state;
    };
    expect(play()).toEqual(play());
  });
});
