import type { CabinClass, SeatColumn, SeatId, SeatPref } from './models';

const COLUMNS: readonly SeatColumn[] = ['A', 'B', 'C', 'D'];
const WINDOW_COLUMNS: readonly SeatColumn[] = ['A', 'D'];
const BUSINESS_LAST_ROW = 2;
const ECONOMY_LAST_ROW = 12;

const rowsOf = (cabin: CabinClass): number[] => {
  const [first, last] = cabin === 'BUSINESS' ? [1, BUSINESS_LAST_ROW] : [BUSINESS_LAST_ROW + 1, ECONOMY_LAST_ROW];
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
};

export const seatsOfCabin = (cabin: CabinClass): SeatId[] =>
  rowsOf(cabin).flatMap((row) => COLUMNS.map((column) => `${row}${column}` as const));

export const seatColumn = (seat: SeatId): SeatColumn => seat.slice(-1) as SeatColumn;
export const seatRow = (seat: SeatId): number => Number.parseInt(seat, 10);

export const cabinOfSeat = (seat: SeatId): CabinClass =>
  seatRow(seat) <= BUSINESS_LAST_ROW ? 'BUSINESS' : 'ECONOMY';

export const isWindow = (seat: SeatId): boolean => WINDOW_COLUMNS.includes(seatColumn(seat));
export const isAisle = (seat: SeatId): boolean => !isWindow(seat);

export const matchesSeatPref = (seat: SeatId, pref: SeatPref): boolean =>
  pref === 'ANY' || (pref === 'WINDOW' ? isWindow(seat) : isAisle(seat));
