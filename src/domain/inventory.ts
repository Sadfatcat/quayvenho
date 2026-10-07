import { PURCHASE_LIMIT_PER_FLIGHT, SEAT_VALID_DAYS } from '@data/balance';
import { invariant } from './common/invariant';
import { err, ok, type Result } from './common/result';
import { sum } from './common/math';
import { purchaseCost, seatUnitCost } from './economy';
import type { CabinClass, DayEvent, Flight, OwnedSeat, OwnedSeatState, SeatBias, SeatId } from './models';
import type { Rng } from './rng';
import { getRoute } from './routes';
import { findFlight } from './schedule';
import { isWindow, seatsOfCabin } from './seatMap';

/** Ngày cuối cùng ghế mua (hoặc được tặng) vào ngày `day` còn dùng được. */
export const seatExpiryDayFor = (day: number): number => day + SEAT_VALID_DAYS - 1;

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

/** Ghế còn trống phù hợp thiên hướng: chọn cửa sổ/lối đi thì chỉ tính ghế đúng loại (chắc chắn nhận được loại đó). */
export const freeSeatsForBias = (flight: Flight, cabin: CabinClass, seats: readonly OwnedSeat[], bias: SeatBias): SeatId[] => {
  const free = freeSeatsFor(flight, cabin, seats);
  const preferred = preferredOf(bias);
  return preferred ? free.filter(preferred) : free;
};

export const maxPurchasable = (flight: Flight, cabin: CabinClass, seats: readonly OwnedSeat[], bias: SeatBias = 'BALANCED'): number =>
  flight.status !== 'SCHEDULED'
    ? 0
    : Math.max(
        0,
        Math.min(
          PURCHASE_LIMIT_PER_FLIGHT[cabin] - onFlight(seats, flight.id, cabin).length,
          freeSeatsForBias(flight, cabin, seats, bias).length,
        ),
      );

const NO_EVENT: DayEvent = { type: 'NONE' };

const unitCostOf = (flight: Flight, cabin: CabinClass, day: number, event: DayEvent, bias: SeatBias = 'BALANCED'): number =>
  seatUnitCost(getRoute(flight.routeId), cabin, day, event, bias);

/** `day` quyết định bậc lạm phát giá vốn ghế (mặc định ngày 1 = giá bảng); `event` có thể giảm giá tuyến dự báo xấu. */
export const pendingTotalCost = (
  pending: Readonly<Record<string, number>>,
  flights: readonly Flight[],
  day = 1,
  event: DayEvent = NO_EVENT,
  bias: SeatBias = 'BALANCED',
): number =>
  sum(
    Object.entries(pending).map(([key, qty]) => {
      const { flightId, cabin } = parsePendingKey(key);
      const flight = findFlight(flights, flightId);
      invariant(flight, `pending on unknown flight ${flightId}`);
      return purchaseCost(unitCostOf(flight, cabin, day, event, bias), qty);
    }),
  );

const preferredOf = (bias: SeatBias): ((seat: SeatId) => boolean) | null =>
  bias === 'BALANCED' ? null : bias === 'WINDOW' ? isWindow : (seat) => !isWindow(seat);

/** Không lặp ghế: cân bằng thì ngẫu nhiên trong mọi ghế trống, cửa sổ/lối đi thì chỉ bốc trong ghế đúng loại. */
export const pickSeats = (free: readonly SeatId[], count: number, bias: SeatBias, rng: Rng): SeatId[] => {
  const preferred = preferredOf(bias);
  const pool = preferred ? free.filter(preferred) : free;
  invariant(count <= pool.length, 'not enough free seats');
  return rng.shuffle(pool).slice(0, count);
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
  event?: DayEvent;
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
    if (qty > maxPurchasable(flight, cabin, input.seats, input.bias)) return err('OVER_LIMIT');
    plan.push({ flight, cabin, qty });
  }
  const totalCost = sum(plan.map(({ flight, cabin, qty }) => purchaseCost(unitCostOf(flight, cabin, input.day ?? 1, input.event ?? NO_EVENT, input.bias), qty)));
  if (totalCost > input.money) return err('NOT_ENOUGH_MONEY');

  const seats = [...input.seats];
  const purchases = plan.map(({ flight, cabin, qty }) => {
    const picked = pickSeats(freeSeatsFor(flight, cabin, seats), qty, input.bias, input.rng);
    const unitCost = unitCostOf(flight, cabin, input.day ?? 1, input.event ?? NO_EVENT, input.bias);
    seats.push(...picked.map((seat) => ({ flightId: flight.id, seat, cabin, unitCost, expiresDay: seatExpiryDayFor(input.day ?? 1), state: 'AVAILABLE' as const })));
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
  day: number,
): OwnedSeat[] => {
  const free = freeSeatsFor(flight, cabin, seats);
  return pickSeats(free, Math.min(count, free.length), 'BALANCED', rng).map((seat) => ({
    flightId: flight.id,
    seat,
    cabin,
    unitCost: 0,
    expiresDay: seatExpiryDayFor(day),
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
/** Cuối ngày `day`: chỉ ghế đã tới hạn mới hết hạn, ghế còn hạn được giữ sang ngày sau. */
export const expireAvailable = (seats: readonly OwnedSeat[], day: number): OwnedSeat[] =>
  seats.map((seat) => (seat.state === 'AVAILABLE' && seat.expiresDay <= day ? { ...seat, state: 'EXPIRED' as const } : seat));

/** Số ghế còn bán được sẽ hết hạn đúng cuối ngày `day`. */
export const seatsExpiringOn = (seats: readonly OwnedSeat[], day: number): number =>
  seats.filter((seat) => seat.state === 'AVAILABLE' && seat.expiresDay === day).length;

/**
 * Ghế mang sang ngày mới: chỉ ghế còn bán được và còn hạn. Chuyến ngày mới có thể đã bị đại lý khác lấy đúng số ghế đó,
 * nên ghế trùng được đổi sang một ghế còn trống của cùng khoang (số ghế cụ thể chỉ là nhãn, tồn kho tính theo số lượng).
 */
export const carryOverSeats = (seats: readonly OwnedSeat[], currentDay: number, nextFlights: readonly Flight[], rng: Rng): OwnedSeat[] => {
  const carried = seats.filter((seat) => seat.state === 'AVAILABLE' && seat.expiresDay > currentDay);
  const result: OwnedSeat[] = [];
  for (const seat of carried) {
    const flight = findFlight(nextFlights, seat.flightId);
    const taken = flight?.takenByOthers.includes(seat.seat) ?? false;
    if (!flight || !taken) {
      result.push(seat);
      continue;
    }
    const spare = freeSeatsFor(flight, seat.cabin, [...carried, ...result]);
    result.push(spare.length ? { ...seat, seat: rng.pick(spare) } : seat);
  }
  return result;
};

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
