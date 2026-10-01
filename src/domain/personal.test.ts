import { describe, expect, it } from 'vitest';
import { applyCustomRoutes, type PersonalConfig, type SpecialCustomer } from '@data/personal';
import { ROUTES } from '@data/routes';
import { makeFlight, makeOrder } from './__integration__/fixtures';
import { canServe } from './canServe';
import { createNewGame } from './dayCycle';
import { GameSession } from './game';
import type { DomainEvent, GameState, OwnedSeat } from './models';
import {
  buildSpecialOrder,
  dayHasPersonalContent,
  ensureServableForSpecial,
  scriptedMomentsFor,
  specialCustomerForArrival,
} from './personal';
import { createRng } from './rng';
import { scoreCustomer } from './scoring';

const special = (patch: Partial<SpecialCustomer> = {}): SpecialCustomer => ({
  id: 'VIP_TEST',
  displayName: 'Khách Thử',
  spriteId: 'c01',
  day: 3,
  atCustomerIndex: 2,
  order: { routeId: 'HAN-DAD', cabin: 'ECONOMY', timePref: 'ANY' },
  lines: { arrive: 'chào', success: 'cảm ơn', fail: 'không sao đâu' },
  tipMultiplier: 3,
  ...patch,
});

const config = (patch: Partial<PersonalConfig> = {}): PersonalConfig => ({
  enabled: true,
  specialCustomers: [special()],
  scriptedMoments: [],
  customRoutes: [],
  ...patch,
});

describe('specialCustomerForArrival', () => {
  it('matches the exact slot on the exact day', () => {
    expect(specialCustomerForArrival(config(), 3, 2, 10)?.id).toBe('VIP_TEST');
    expect(specialCustomerForArrival(config(), 3, 1, 10)).toBeUndefined();
    expect(specialCustomerForArrival(config(), 4, 2, 10)).toBeUndefined();
  });

  it('becomes the last customer when atCustomerIndex is beyond the day total', () => {
    const late = config({ specialCustomers: [special({ atCustomerIndex: 50 })] });
    expect(specialCustomerForArrival(late, 3, 9, 10)?.id).toBe('VIP_TEST');
    expect(specialCustomerForArrival(late, 3, 8, 10)).toBeUndefined();
  });

  it('ignores everything when disabled', () => {
    expect(specialCustomerForArrival(config({ enabled: false }), 3, 2, 10)).toBeUndefined();
  });
});

describe('dayHasPersonalContent / scriptedMomentsFor', () => {
  it('is true for days with a special customer or a scripted moment, false otherwise or when disabled', () => {
    const withMoment = config({ scriptedMoments: [{ id: 'M', day: 5, at: 'PREP', lines: ['a'] }] });
    expect(dayHasPersonalContent(withMoment, 3)).toBe(true);
    expect(dayHasPersonalContent(withMoment, 5)).toBe(true);
    expect(dayHasPersonalContent(withMoment, 4)).toBe(false);
    expect(dayHasPersonalContent(config({ enabled: false }), 3)).toBe(false);
  });

  it('returns the scripted moments of the day at the given phase', () => {
    const moments = [
      { id: 'A', day: 5, at: 'PREP' as const, lines: ['x'] },
      { id: 'B', day: 5, at: 'SUMMARY' as const, lines: ['y'] },
    ];
    expect(scriptedMomentsFor(config({ scriptedMoments: moments }), 5, 'PREP').map((moment) => moment.id)).toEqual(['A']);
    expect(scriptedMomentsFor(config({ scriptedMoments: moments, enabled: false }), 5, 'PREP')).toEqual([]);
  });
});

describe('buildSpecialOrder', () => {
  it('overlays the configured order, uses a valid passport with the display name and marks the order special', () => {
    const base = makeOrder({ spriteId: 'c09', cabin: 'BUSINESS', passport: { name: 'X', bookedName: 'Y', expiresDay: 1 } });
    const order = buildSpecialOrder(base, special({ order: { cabin: 'ECONOMY' } }), 3);
    expect(order).toMatchObject({
      spriteId: 'c01',
      cabin: 'ECONOMY',
      passport: { name: 'Khách Thử', bookedName: 'Khách Thử' },
      special: { id: 'VIP_TEST', tipMultiplier: 3 },
    });
    expect(order.passport.expiresDay).toBeGreaterThanOrEqual(3);
  });
});

describe('ensureServableForSpecial', () => {
  const flights = [makeFlight({ id: 'F1', routeId: 'HAN-DAD', departAt: 1290 }), makeFlight({ id: 'F2', routeId: 'HAN-DAD', departAt: 1470 })];

  it('adds a free seat (unitCost 0) when the player has none, and the customer becomes servable', () => {
    const order = makeOrder({ routeId: 'HAN-DAD', cabin: 'ECONOMY', timePref: 'ANY' });
    const added = ensureServableForSpecial(order, flights, [], createRng(1));
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ unitCost: 0, state: 'AVAILABLE', cabin: 'ECONOMY' });
    expect(canServe(order, flights, added)).toBe(true);
  });

  it('adds nothing when a matching seat already exists', () => {
    const order = makeOrder({ routeId: 'HAN-DAD', cabin: 'ECONOMY', timePref: 'ANY' });
    const owned: OwnedSeat[] = [{ flightId: 'F1', seat: '1A', cabin: 'ECONOMY', unitCost: 50, state: 'AVAILABLE' }];
    expect(ensureServableForSpecial(order, flights, owned, createRng(1))).toEqual([]);
  });
});

describe('scoreCustomer for special customers', () => {
  const baseInput = { patienceRatio: 1, day: 3, rush: false, tipMult: 1, money: 500 };
  const specialOrder = () => makeOrder({ special: { id: 'VIP_TEST', tipMultiplier: 3 }, passport: { name: 'K', bookedName: 'K', expiresDay: 20 } });

  it('gives a failed ticket no penalty, at least 3 stars and carries the special id', () => {
    const result = scoreCustomer({ ...baseInput, order: specialOrder(), action: { type: 'LEFT' } });
    expect(result).toMatchObject({ penalty: 0, specialId: 'VIP_TEST' });
    expect(result.stars).toBeGreaterThanOrEqual(3);
  });

  it('applies the special tip multiplier even for an ECONOMY PERFECT ticket', () => {
    const order = specialOrder();
    const flight = makeFlight({ routeId: order.routeId });
    const normal = scoreCustomer({
      ...baseInput,
      order: makeOrder({ passport: order.passport }),
      action: { type: 'DELIVER', ticket: { flight, cabin: 'ECONOMY', seat: '1A', baggageKg: 0, extras: [] } },
    });
    const vip = scoreCustomer({
      ...baseInput,
      order,
      action: { type: 'DELIVER', ticket: { flight, cabin: 'ECONOMY', seat: '1A', baggageKg: 0, extras: [] } },
    });
    expect(normal.tip).toBe(0);
    expect(vip.outcome).toBe('PERFECT');
    expect(vip.tip).toBeGreaterThan(0);
  });
});

describe('applyCustomRoutes', () => {
  it('returns the original routes when disabled', () => {
    const custom = config({ enabled: false, customRoutes: [{ replaceRouteId: 'HAN-DAD', name: 'Biển Mình', flavorText: 'ngày đầu' }] });
    expect(applyCustomRoutes(ROUTES, custom)).toBe(ROUTES);
  });

  it('renames only the replaced route and attaches the flavor text when enabled', () => {
    const custom = config({ customRoutes: [{ replaceRouteId: 'HAN-DAD', name: 'Biển Mình', flavorText: 'ngày đầu' }] });
    const routes = applyCustomRoutes(ROUTES, custom);
    expect(routes.find((route) => route.id === 'HAN-DAD')).toMatchObject({ name: 'Biển Mình', flavorText: 'ngày đầu' });
    expect(routes.find((route) => route.id === 'HAN-SGN')?.name).toBe(ROUTES.find((route) => route.id === 'HAN-SGN')?.name);
  });
});

describe('session with personal config', () => {
  const jumpToDay = (state: GameState, day: number): void => {
    state.day = day;
  };

  it('has no random event on a day with a special customer and a free seat is added when the player has no stock', () => {
    const cfg = config({ specialCustomers: [special({ day: 1, atCustomerIndex: 0 })] });
    const state = createNewGame(7, cfg);
    jumpToDay(state, 1);
    const game = new GameSession(state, cfg);
    expect(game.state.today.event.type).toBe('NONE');
    game.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
    game.dispatch({ type: 'OPEN_COUNTER' });
    const events: DomainEvent[] = [];
    for (let i = 0; i < 3000 && !game.state.today.queue.length; i++) events.push(...game.tick(100));
    const customer = game.state.today.queue[0];
    expect(customer?.order.special?.id).toBe('VIP_TEST');
    expect(game.state.today.seats.some((seat) => seat.unitCost === 0)).toBe(true);
    expect(game.state.today.transactions.every((tx) => tx.type !== 'SEAT_PURCHASE')).toBe(true);
  });

  it('plays exactly like the default game when disabled', () => {
    const plain = GameSession.newGame(11);
    const disabled = new GameSession(createNewGame(11), config({ enabled: false }));
    expect(disabled.state.today.event).toEqual(plain.state.today.event);
  });
});
