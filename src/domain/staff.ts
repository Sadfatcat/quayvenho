import { STAFF } from '@data/staff';
import { err, ok, type Result } from './common/result';
import { matchesTimePref } from './clock';
import { isPassportValid } from './scoring';
import { matchesSeatPref } from './seatMap';
import type { Flight, Order, OwnedSeat, SeatId, SeatPref, StaffDef, StaffId } from './models';

export const findStaff = (staffId: StaffId): StaffDef | undefined => STAFF.find((def) => def.id === staffId);

export type HireError = 'UNKNOWN_STAFF' | 'ALREADY_HIRED' | 'DAY_TOO_EARLY' | 'NOT_ENOUGH_MONEY';

export const checkHire = (staffId: StaffId, hired: readonly StaffId[], ctx: { day: number; money: number }): Result<StaffDef, HireError> => {
  const def = findStaff(staffId);
  if (!def) return err('UNKNOWN_STAFF');
  if (hired.includes(staffId)) return err('ALREADY_HIRED');
  if (ctx.day < def.minDay) return err('DAY_TOO_EARLY');
  if (ctx.money < def.hireCost) return err('NOT_ENOUGH_MONEY');
  return ok(def);
};

const POSITION_PREFS: readonly SeatPref[] = ['FRONT', 'MIDDLE', 'BACK'];

/** Khách mà nhân viên này tự xử lý được: đơn thường, không dịch vụ thêm, hộ chiếu đúng, không phải khách đặc biệt. */
export const isStaffServable = (order: Order, day: number, def: StaffDef): boolean =>
  !order.special &&
  order.extras.length === 0 &&
  isPassportValid(order.passport, day) &&
  (def.handlesSeatPositions || !POSITION_PREFS.includes(order.seatPref));

export interface StaffTicket {
  flight: Flight;
  seat: SeatId;
}

/** Chuyến + ghế còn trống khớp tuyến, hạng, giờ và vị trí ghế của đơn (chuyến sớm nhất, ghế đầu tiên). */
export const findStaffTicket = (order: Order, flights: readonly Flight[], seats: readonly OwnedSeat[]): StaffTicket | undefined => {
  const candidates = flights
    .filter((flight) => flight.status === 'SCHEDULED' && flight.routeId === order.routeId && matchesTimePref(flight.departAt, order.timePref))
    .sort((a, b) => a.departAt - b.departAt);
  for (const flight of candidates) {
    const unit = seats.find((seat) => seat.flightId === flight.id && seat.cabin === order.cabin && seat.state === 'AVAILABLE' && matchesSeatPref(seat.seat, order.seatPref));
    if (unit) return { flight, seat: unit.seat };
  }
  return undefined;
};

/** Đánh dấu đúng ghế đó đã bán (nhân viên bán ngay lúc nhận khách, không đụng ghế người chơi đang giữ). */
export const sellSeat = (seats: readonly OwnedSeat[], flightId: string, seat: SeatId): OwnedSeat[] =>
  seats.map((unit) => (unit.flightId === flightId && unit.seat === seat && unit.state === 'AVAILABLE' ? { ...unit, state: 'SOLD' } : unit));

export const dailyWages = (hired: readonly StaffId[]): number =>
  hired.reduce((total, staffId) => total + (findStaff(staffId)?.wagePerDay ?? 0), 0);
