import { PURCHASE_LIMIT_PER_FLIGHT, SEAT_BIAS_PREFERENCE_CHANCE } from '@data/balance';
import { invariant } from './common/invariant';
import { err, ok, type Result } from './common/result';
import { sum } from './common/math';
import { purchaseCost } from './economy';
import type { CabinClass, Flight, OwnedSeat, OwnedSeatState, SeatBias, SeatId } from './models';
import type { Rng } from './rng';
import { getRoute } from './routes';
import { routeOnDay } from './economy';
import { findFlight } from './schedule';
import { isWindow, seatsOfCabin } from './seatMap';

export const pendingKey = (flightId: string, cabin: CabinClass): string => `${flightId}:${cabin}`;

export const parsePendingKey = (key: string): { flightId: string; cabin: CabinClass } => {
  const [flightId, cabin] = key.split(':');
  invariant(flightId && (cabin === 'ECONOMY' || cabin === 'BUSINESS'), `bad pending key ${key}`);
  return { flightId, cabin };
};

const onFlight = (seats: readonly OwnedSeat[], flightId: string, cabin: CabinClass) =>
  seats.filter((seat) => seat.flightId === flightId && seat.cabin === cabin);

export const freeSeatsFor = (flight: Flight, cabin: CabinClass, seats: readonly OwnedSeat[]): SeatId[] => {
  const owned = new Set(onFlight(seats, flight.id, cabin).map((seat) => seat.seat));
  const taken = new Set(flight.takenByOthers);
  return seatsOfCabin(cabin).filter((seat) => !owned.has(seat) && !taken.has(seat));
};

export const maxPurchasable = (flight: Flight, cabin: CabinClass, seats: readonly OwnedSeat[]): number =>
  flight.status !== 'SCHEDULED'
    ? 0
    : Math.max(
        0,
        Math.min(
          PURCHASE_LIMIT_PER_FLIGHT[cabin] - onFlight(seats, flight.id, cabin).length,
          freeSeatsFor(flight, cabin, seats).length,
        ),
      );

const unitCostOf = (flight: Flight, cabin: CabinClass, day: number): number => routeOnDay(getRoute(flight.routeId), day).cost[cabin];

/** `day` quyết định bậc lạm phát giá vốn ghế (mặc định ngày 1 = giá bảng). */
export const pendingTotalCost = (pending: Readonly<Record<string, number>>, flights: readonly Flight[], day = 1): number =>
  sum(
    Object.entries(pending).map(([key, qty]) => {
      const { flightId, cabin } = parsePendingKey(key);
      const flight = findFlight(flights, flightId);
      invariant(flight, `pending on unknown flight ${flightId}`);
      return purchaseCost(unitCostOf(flight, cabin, day), qty);
    }),
  );

const preferredOf = (bias: SeatBias): ((seat: SeatId) => boolean) | null =>
  bias === 'BALANCED' ? null : bias === 'WINDOW' ? isWindow : (seat) => !isWindow(seat);

/** Without replacement; with a bias, each pick prefers the favoured side with 75% chance. */
export const pickSeats = (free: readonly SeatId[], count: number, bias: SeatBias, rng: Rng): SeatId[] => {
  invariant(count <= free.length, 'not enough free seats');
  const preferred = preferredOf(bias);
  if (!preferred) return rng.shuffle(free).slice(0, count);
  let pool = [...free];
  const picked: SeatId[] = [];
  for (let i = 0; i < count; i++) {
    const favoured = pool.filter(preferred);
    const others = pool.filter((seat) => !preferred(seat));
    const group = favoured.length && (rng.chance(SEAT_BIAS_PREFERENCE_CHANCE) || !others.length) ? favoured : others;
    const seat = rng.pick(group);
    picked.push(seat);
    pool = pool.filter((candidate) => candidate !== seat);
  }
  return picked;
};

export interface Purchase {
  flightId: string;
  cabin: CabinClass;
  seats: SeatId[];
  cost: number;
}

export type PurchaseError = 'NOTHING_PENDING' | 'UNKNOWN_FLIGHT' | 'OVER_LIMIT' | 'NOT_ENOUGH_MONEY';

export const purchasePending = (input: {
  pending: Readonly<Record<string, number>>;
  flights: readonly Flight[];
  seats: readonly OwnedSeat[];
  money: number;
  bias: SeatBias;
  rng: Rng;
  day?: number;
}): Result<{ seats: OwnedSeat[]; purchases: Purchase[]; totalCost: number }, PurchaseError> => {
  const entries = Object.entries(input.pending)
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return err('NOTHING_PENDING');

  const plan: { flight: Flight; cabin: CabinClass; qty: number }[] = [];
  for (const [key, qty] of entries) {
    const { flightId, cabin } = parsePendingKey(key);
    const flight = findFlight(input.flights, flightId);
    if (!flight) return err('UNKNOWN_FLIGHT');
    if (qty > maxPurchasable(flight, cabin, input.seats)) return err('OVER_LIMIT');
    plan.push({ flight, cabin, qty });
  }
  const totalCost = sum(plan.map(({ flight, cabin, qty }) => purchaseCost(unitCostOf(flight, cabin, input.day ?? 1), qty)));
  if (totalCost > input.money) return err('NOT_ENOUGH_MONEY');

  const seats = [...input.seats];
  const purchases = plan.map(({ flight, cabin, qty }) => {
    const picked = pickSeats(freeSeatsFor(flight, cabin, seats), qty, input.bias, input.rng);
    const unitCost = unitCostOf(flight, cabin, input.day ?? 1);
    seats.push(...picked.map((seat) => ({ flightId: flight.id, seat, cabin, unitCost, state: 'AVAILABLE' as const })));
    return { flightId: flight.id, cabin, seats: picked, cost: purchaseCost(unitCost, qty) };
  });
  return ok({ seats, purchases, totalCost });
};

/** Free seats (unitCost 0) for the safety net and scripted customers. */
export const giftSeats = (
  flight: Flight,
  cabin: CabinClass,
  count: number,
  seats: readonly OwnedSeat[],
  rng: Rng,
): OwnedSeat[] => {
  const free = freeSeatsFor(flight, cabin, seats);
  return pickSeats(free, Math.min(count, free.length), 'BALANCED', rng).map((seat) => ({
    flightId: flight.id,
    seat,
    cabin,
    unitCost: 0,
    state: 'AVAILABLE',
  }));
};

const withState = (
  seats: readonly OwnedSeat[],
  from: OwnedSeatState,
  to: OwnedSeatState,
): OwnedSeat[] => seats.map((seat) => (seat.state === from ? { ...seat, state: to } : seat));

export const releaseHeld = (seats: readonly OwnedSeat[]) => withState(seats, 'HELD', 'AVAILABLE');
export const sellHeld = (seats: readonly OwnedSeat[]) => withState(seats, 'HELD', 'SOLD');
export const expireAvailable = (seats: readonly OwnedSeat[]) => withState(seats, 'AVAILABLE', 'EXPIRED');

/**
 * Giữ một ghế cho vé đang lập. Mọi ghế của khoang đều chọn được: ghế trống (chưa bán/chưa giữ) là hợp lệ miễn là
 * còn ít nhất một ghế tồn kho (AVAILABLE) của chuyến + khoang — tồn kho chỉ là SỐ LƯỢNG, số ghế cụ thể được gán lúc bán.
 */
export const holdSeat = (
  seats: readonly OwnedSeat[],
  flightId: string,
  cabin: CabinClass,
  seatId: SeatId,
): Result<OwnedSeat[], 'SEAT_NOT_AVAILABLE'> => {
  if (!seatsOfCabin(cabin).includes(seatId)) return err('SEAT_NOT_AVAILABLE');
  const released = releaseHeld(seats);
  const inCabin = (seat: OwnedSeat) => seat.flightId === flightId && seat.cabin === cabin;
  const sameSeat = released.findIndex((seat) => inCabin(seat) && seat.seat === seatId);
  if (sameSeat >= 0) {
    // Ghế này đã có bản ghi: chỉ dùng được nếu còn trống trong kho.
    return released[sameSeat]?.state === 'AVAILABLE'
      ? ok(released.map((seat, i) => (i === sameSeat ? { ...seat, state: 'HELD' as const } : seat)))
      : err('SEAT_NOT_AVAILABLE');
  }
  const spare = released.findIndex((seat) => inCabin(seat) && seat.state === 'AVAILABLE');
  if (spare < 0) return err('SEAT_NOT_AVAILABLE');
  return ok(released.map((seat, i) => (i === spare ? { ...seat, seat: seatId, state: 'HELD' as const } : seat)));
};

/** Marks `share` of the AVAILABLE seats on the given flights as LOST (rounded). */
export const loseSeats = (
  seats: readonly OwnedSeat[],
  flightIds: readonly string[],
  share: number,
  rng: Rng,
): { seats: OwnedSeat[]; lost: OwnedSeat[] } => {
  const candidates = seats
    .map((seat, index) => ({ seat, index }))
    .filter(({ seat }) => seat.state === 'AVAILABLE' && flightIds.includes(seat.flightId));
  const count = Math.round(candidates.length * share);
  const chosen = new Set(rng.shuffle(candidates).slice(0, count).map(({ index }) => index));
  const next = seats.map((seat, index) => (chosen.has(index) ? { ...seat, state: 'LOST' as const } : seat));
  return { seats: next, lost: next.filter((_, index) => chosen.has(index)) };
};
