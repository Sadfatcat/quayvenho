import {
  BAD_PASSPORT_EXPIRED_DAYS,
  PATIENCE_PER_COMPLEXITY_MS,
  VALID_PASSPORT_EXTRA_DAYS,
} from '@data/balance';
import { CUSTOMER_SPRITES, FAMILY_NAMES, GIVEN_NAMES, MAX_FULL_NAME_LENGTH, MIDDLE_NAMES } from '@data/customers';
import { ROUTES } from '@data/routes';
import { routeHasAvailableSeat } from './canServe';
import { timeWindowOf } from './clock';
import { invariant } from './common/invariant';
import { isMechanicOpen } from './dayConfig';
import type {
  BaggageKg,
  DayConfig,
  Extra,
  Flight,
  Modifiers,
  Order,
  OwnedSeat,
  Passport,
  RouteId,
  SeatPref,
  TimePref,
  TimeWindow,
} from './models';
import type { Rng } from './rng';
import { ShuffleBag } from './shuffleBag';

const FEASIBLE_ROUTE_CHANCE = 0.85;
const FEASIBILITY_REDRAWS = 3;
const ALWAYS_FEASIBLE_UNTIL_DAY = 2;
const RECENT_UNLOCK_DAYS = 2;
const MAX_EXTRAS = 2;
const NAME_ATTEMPTS = 50;
const BAGGAGE_CHOICES: readonly { value: BaggageKg; weight: number }[] = [
  { value: 15, weight: 3 },
  { value: 20, weight: 4 },
  { value: 30, weight: 2 },
];
const EXTRAS: readonly Extra[] = ['VEG_MEAL', 'WHEELCHAIR', 'INSURANCE'];

/** Routes bought in the shop within the last 2 days get double weight. */
export const buildRouteBag = (
  rng: Rng,
  unlockedRoutes: readonly RouteId[],
  routeUnlockedDay: Readonly<Record<RouteId, number>>,
  day: number,
): ShuffleBag<RouteId> =>
  new ShuffleBag(
    rng,
    ROUTES.filter((route) => unlockedRoutes.includes(route.id)).map((route) => {
      const unlockedOn = routeUnlockedDay[route.id];
      const recent = unlockedOn !== undefined && day > unlockedOn && day - unlockedOn <= RECENT_UNLOCK_DAYS;
      return { value: route.id, weight: route.weight * (recent ? 2 : 1) };
    }),
  );

export interface OrderContext {
  rng: Rng;
  namesRng: Rng;
  day: number;
  cfg: DayConfig;
  flights: readonly Flight[];
  seats: readonly OwnedSeat[];
  unlockedRoutes: readonly RouteId[];
  routeBag: ShuffleBag<RouteId>;
  modifiers: Modifiers;
  customerIndex: number;
}

const chooseRoute = (ctx: OrderContext): RouteId => {
  const drawn = ctx.routeBag.draw();
  const hasSeat = (routeId: RouteId) => routeHasAvailableSeat(routeId, ctx.flights, ctx.seats);
  const routesWithSeats = ctx.unlockedRoutes.filter(hasSeat);
  if (!routesWithSeats.length || hasSeat(drawn)) return drawn;

  if (ctx.day <= ALWAYS_FEASIBLE_UNTIL_DAY) {
    // Two bag lengths always cover one full bag, so a route with seats is reached.
    for (let i = 0; i < ctx.routeBag.capacity * 2; i++) {
      const redrawn = ctx.routeBag.draw();
      if (hasSeat(redrawn)) return redrawn;
    }
    invariant(false, 'route bag has no route with seats');
  }
  if (!ctx.rng.chance(FEASIBLE_ROUTE_CHANCE)) return drawn;
  for (let i = 0; i < FEASIBILITY_REDRAWS; i++) {
    const redrawn = ctx.routeBag.draw();
    if (hasSeat(redrawn)) return redrawn;
  }
  return drawn;
};

const openWindows = (routeId: RouteId, flights: readonly Flight[]): TimeWindow[] => [
  ...new Set(
    flights
      .filter((flight) => flight.routeId === routeId && flight.status === 'SCHEDULED')
      .map((flight) => timeWindowOf(flight.departAt)),
  ),
];

const fullName = (family: string, middle: string, given: string) => `${family} ${middle} ${given}`;

const generateName = (rng: Rng): { family: string; middle: string; given: string } => {
  for (let i = 0; i < NAME_ATTEMPTS; i++) {
    const parts = { family: rng.pick(FAMILY_NAMES), middle: rng.pick(MIDDLE_NAMES), given: rng.pick(GIVEN_NAMES) };
    if (fullName(parts.family, parts.middle, parts.given).length <= MAX_FULL_NAME_LENGTH) return parts;
  }
  invariant(false, 'could not generate a short enough name');
};

/** Swaps the middle or given name for a different entry; never a diacritics-only change. */
const misspell = (rng: Rng, parts: { family: string; middle: string; given: string }): string => {
  const swapMiddle = rng.chance(0.5);
  const list = swapMiddle ? MIDDLE_NAMES : GIVEN_NAMES;
  const current = swapMiddle ? parts.middle : parts.given;
  const candidates = list.filter((name) => {
    if (name === current) return false;
    const candidate = swapMiddle
      ? fullName(parts.family, name, parts.given)
      : fullName(parts.family, parts.middle, name);
    return candidate.length <= MAX_FULL_NAME_LENGTH;
  });
  const replacement = rng.pick(candidates);
  return swapMiddle ? fullName(parts.family, replacement, parts.given) : fullName(parts.family, parts.middle, replacement);
};

const generatePassport = (rng: Rng, namesRng: Rng, day: number, cfg: DayConfig): Passport => {
  const parts = generateName(namesRng);
  const bookedName = fullName(parts.family, parts.middle, parts.given);
  const bad = isMechanicOpen('badPassport', day) && rng.chance(cfg.pBadPassport);
  if (!bad) return { name: bookedName, bookedName, expiresDay: day + rng.int(VALID_PASSPORT_EXTRA_DAYS.min, VALID_PASSPORT_EXTRA_DAYS.max) };

  const expired = day > 1 && rng.chance(0.5);
  if (expired) {
    const expiresDay = Math.max(1, day - rng.int(BAD_PASSPORT_EXPIRED_DAYS.min, BAD_PASSPORT_EXPIRED_DAYS.max));
    return { name: bookedName, bookedName, expiresDay };
  }
  return { name: misspell(namesRng, parts), bookedName, expiresDay: day + rng.int(VALID_PASSPORT_EXTRA_DAYS.min, VALID_PASSPORT_EXTRA_DAYS.max) };
};

/** §8.4 */
export const generateOrder = (ctx: OrderContext): Order => {
  const { rng, day, cfg } = ctx;
  const routeId = chooseRoute(ctx);
  let complexity = 0;
  const canAdd = (mechanic: Parameters<typeof isMechanicOpen>[0], probability: number) =>
    isMechanicOpen(mechanic, day) && complexity < cfg.maxComplexity && rng.chance(probability);

  const windows = openWindows(routeId, ctx.flights);
  const cabin = canAdd('business', cfg.pBusiness) ? (complexity++, 'BUSINESS' as const) : 'ECONOMY';
  const baggageKg: BaggageKg = canAdd('baggage', cfg.pBaggage) ? (complexity++, rng.weighted(BAGGAGE_CHOICES)) : 0;
  const seatPref: SeatPref = canAdd('seatPref', cfg.pSeatPref)
    ? (complexity++, rng.pick(['WINDOW', 'AISLE'] as const))
    : 'ANY';
  const timePref: TimePref = windows.length && canAdd('timePref', cfg.pTimePref) ? (complexity++, rng.pick(windows)) : 'ANY';

  const extras: Extra[] = [];
  for (let i = 0; i < MAX_EXTRAS; i++) {
    if (!canAdd('extras', cfg.pExtra)) continue;
    const options = EXTRAS.filter((extra) => !extras.includes(extra) && !(extra === 'WHEELCHAIR' && seatPref === 'WINDOW'));
    if (!options.length) continue;
    extras.push(rng.pick(options));
    complexity++;
  }

  return {
    customerId: `d${day}-c${ctx.customerIndex}`,
    spriteId: rng.pick(CUSTOMER_SPRITES),
    routeId,
    cabin,
    baggageKg,
    seatPref,
    timePref,
    extras,
    passport: generatePassport(rng, ctx.namesRng, day, cfg),
    complexity,
    patienceMaxMs: Math.round((cfg.patienceBaseMs + complexity * PATIENCE_PER_COMPLEXITY_MS) * ctx.modifiers.patienceMult),
  };
};
