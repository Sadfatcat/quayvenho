import { describe, expect, it } from 'vitest';
import { BASE_MODIFIERS } from '@data/balance';
import { FAMILY_NAMES, GIVEN_NAMES, MIDDLE_NAMES } from '@data/customers';
import { FIRST_ARRIVAL_MINUTE, LAST_ARRIVAL_MINUTE } from '@data/schedule';
import { canServe, routeHasAvailableSeat } from './canServe';
import { getDayConfig, isMechanicOpen } from './dayConfig';
import { buildRouteBag, generateOrder } from './orderGen';
import type { Flight, Order, OwnedSeat, RouteId } from './models';
import { rngFor, createRng } from './rng';
import { generateFlights } from './schedule';
import { seatsOfCabin } from './seatMap';
import { generateArrivals } from './spawner';

const stripDiacritics = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

/** Random ownership: some flights with a few AVAILABLE seats, some sold out. */
const randomSeats = (seed: number, flights: readonly Flight[]): OwnedSeat[] => {
  const rng = createRng(seed);
  return flights.flatMap((flight) =>
    (['ECONOMY', 'BUSINESS'] as const).flatMap((cabin) =>
      rng.shuffle(seatsOfCabin(cabin).filter((s) => !flight.takenByOthers.includes(s)))
        .slice(0, rng.int(0, 2))
        .map((seat) => ({ flightId: flight.id, seat, cabin, unitCost: 1, state: rng.chance(0.7) ? 'AVAILABLE' : 'SOLD' }) as OwnedSeat),
    ),
  );
};

const ROUTE_SETS: readonly RouteId[][] = [
  ['HAN-SGN', 'HAN-DAD'],
  ['HAN-SGN', 'HAN-DAD', 'HAN-CXR', 'HAN-PQC'],
];

const generateDay = (seed: number, day: number, routes: readonly RouteId[], cancelFirst = false) => {
  const flights = generateFlights(seed, day, routes).map((f, i) => (cancelFirst && i < 3 ? { ...f, status: 'CANCELLED' as const } : f));
  const seats = randomSeats(seed * 31 + day, flights);
  const routeBag = buildRouteBag(rngFor(seed, day, 'routes'), routes, {}, day);
  const ctx = {
    rng: rngFor(seed, day, 'orders'),
    namesRng: rngFor(seed, day, 'names'),
    day,
    cfg: getDayConfig(day),
    flights,
    seats,
    unlockedRoutes: routes,
    routeBag,
    modifiers: BASE_MODIFIERS,
  };
  return { flights, seats, orders: Array.from({ length: 8 }, (_, customerIndex) => generateOrder({ ...ctx, customerIndex })) };
};

const flightsOnRouteHaveNoEconomySeat = (routeId: RouteId, flights: readonly Flight[], seats: readonly OwnedSeat[]): boolean =>
  !flights.some((flight) => flight.routeId === routeId && flight.status === 'SCHEDULED' && seats.some((seat) => seat.flightId === flight.id && seat.cabin === 'ECONOMY' && seat.state === 'AVAILABLE'));

const checkInvariants = (order: Order, day: number, routes: readonly RouteId[], flights: readonly Flight[], seats: readonly OwnedSeat[]) => {
  const cfg = getDayConfig(day);
  expect(routes).toContain(order.routeId);
  expect(order.complexity).toBeLessThanOrEqual(cfg.maxComplexity);
  // Hạng thương gia chỉ xuất hiện trước khi mở cơ chế khi tuyến đó hết ghế phổ thông (khách chỉ hỏi hạng còn vé).
  if (!isMechanicOpen('business', day) && order.cabin === 'BUSINESS') expect(flightsOnRouteHaveNoEconomySeat(order.routeId, flights, seats)).toBe(true);
  if (!isMechanicOpen('baggage', day)) expect(order.baggageKg).toBe(0);
  if (!isMechanicOpen('seatPref', day)) expect(order.seatPref).toBe('ANY');
  if (!isMechanicOpen('timePref', day)) expect(order.timePref).toBe('ANY');
  if (!isMechanicOpen('extras', day)) expect(order.extras).toEqual([]);
  if (!isMechanicOpen('badPassport', day)) {
    expect(order.passport.name).toBe(order.passport.bookedName);
  }
  if (order.extras.includes('WHEELCHAIR')) expect(order.seatPref).not.toBe('WINDOW');
  expect(new Set(order.extras).size).toBe(order.extras.length);
  expect(order.passport.name.length).toBeLessThanOrEqual(22);
};

describe('orderGen invariants (§8.4)', () => {
  it('hold on 2.000 seeds × 30 days', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const routes = ROUTE_SETS[seed % 2] as RouteId[];
      const day = 1 + (seed % 30);
      const { flights, seats, orders } = generateDay(seed, day, routes, seed % 7 === 0);
      const anySeat = routes.some((r) => routeHasAvailableSeat(r, flights, seats));
      for (const order of orders) {
        checkInvariants(order, day, routes, flights, seats);
        if (order.timePref !== 'ANY') {
          expect(flights.some((f) => f.routeId === order.routeId && f.status === 'SCHEDULED')).toBe(true);
        }
        if (day <= 2 && anySeat) expect(routeHasAvailableSeat(order.routeId, flights, seats)).toBe(true);
      }
    }
  });

  it('is deterministic per seed/day', () => {
    expect(generateDay(5, 7, ROUTE_SETS[1] as RouteId[]).orders).toEqual(generateDay(5, 7, ROUTE_SETS[1] as RouteId[]).orders);
  });

  it('bad passports (wrong name) appear from day 6', () => {
    let wrongName = 0;
    for (let seed = 1; seed <= 400; seed++) {
      for (const order of generateDay(seed, 10, ROUTE_SETS[0] as RouteId[]).orders) {
        if (order.passport.name !== order.passport.bookedName) wrongName++;
      }
    }
    expect(wrongName).toBeGreaterThan(100);
  });

  it('wrong names never differ only by diacritics', () => {
    for (const list of [FAMILY_NAMES, MIDDLE_NAMES, GIVEN_NAMES]) {
      expect(new Set(list.map(stripDiacritics)).size).toBe(list.length);
    }
    for (let seed = 1; seed <= 400; seed++) {
      for (const { passport } of generateDay(seed, 12, ROUTE_SETS[0] as RouteId[]).orders) {
        if (passport.name !== passport.bookedName) {
          expect(stripDiacritics(passport.name)).not.toBe(stripDiacritics(passport.bookedName));
        }
      }
    }
  });

  it('doubles weight of routes unlocked in the last 2 days', () => {
    // One full bag: SGN weight 3 + CXR weight 2 (×2 when recent).
    const count = (unlockedDay: number, day: number, bagSize: number) => {
      const bag = buildRouteBag(createRng(1), ['HAN-SGN', 'HAN-CXR'], { 'HAN-CXR': unlockedDay }, day);
      return Array.from({ length: bagSize }, () => bag.draw()).filter((r) => r === 'HAN-CXR').length;
    };
    expect(count(5, 6, 7)).toBe(4);
    expect(count(5, 7, 7)).toBe(4);
    expect(count(5, 8, 5)).toBe(2);
  });

  it('day 1–2 redraws from the bag, keeping route weights among routes with seats', () => {
    const routes = ['HAN-SGN', 'HAN-DAD', 'HAN-CXR'];
    const counts: Record<string, number> = { 'HAN-SGN': 0, 'HAN-DAD': 0, 'HAN-CXR': 0 };
    for (let seed = 1; seed <= 300; seed++) {
      const flights = generateFlights(seed, 2, routes);
      const seats = flights
        .filter((f) => f.routeId !== 'HAN-SGN')
        .map((f) => ({ flightId: f.id, seat: '12D', cabin: 'ECONOMY', unitCost: 1, expiresDay: 2, state: 'AVAILABLE' }) as OwnedSeat);
      const ctx = {
        rng: rngFor(seed, 2, 'orders'), namesRng: rngFor(seed, 2, 'names'), day: 2, cfg: getDayConfig(2),
        flights, seats, unlockedRoutes: routes, routeBag: buildRouteBag(rngFor(seed, 2, 'routes'), routes, {}, 2),
        modifiers: BASE_MODIFIERS,
      };
      for (let i = 0; i < 16; i++) {
        const routeId = generateOrder({ ...ctx, customerIndex: i }).routeId;
        counts[routeId] = (counts[routeId] ?? 0) + 1;
      }
    }
    expect(counts['HAN-SGN']).toBe(0);
    // DAD weight 3 vs CXR weight 2
    expect((counts['HAN-DAD'] ?? 0) / (counts['HAN-CXR'] ?? 1)).toBeCloseTo(1.5, 0);
  });

  it('customers whose route has no seats can be refused as no-stock', () => {
    const { flights, seats, orders } = generateDay(3, 5, ROUTE_SETS[0] as RouteId[]);
    const refusable = orders.filter((o) => !canServe(o, flights, seats));
    expect(refusable.every((o) => !canServe(o, flights, seats))).toBe(true);
  });
});

describe('spawner', () => {
  it('returns count sorted arrivals within 08:06–18:30, first at 08:06', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const arrivals = generateArrivals(createRng(seed), 40);
      expect(arrivals).toHaveLength(40);
      expect(arrivals[0]).toBe(FIRST_ARRIVAL_MINUTE);
      expect(arrivals.every((m, i) => m >= FIRST_ARRIVAL_MINUTE && m <= LAST_ARRIVAL_MINUTE && (i === 0 || m >= (arrivals[i - 1] ?? 0)))).toBe(true);
    }
    expect(generateArrivals(createRng(1), 0)).toEqual([]);
  });

  it('peak hours are denser', () => {
    const arrivals = Array.from({ length: 200 }, (_, seed) => generateArrivals(createRng(seed), 60)).flat();
    const perMinute = (from: number, to: number) => arrivals.filter((m) => m >= from && m < to).length / (to - from);
    expect(perMinute(1130, 1160)).toBeGreaterThan(perMinute(1170, 1215) * 1.3);
  });
});
