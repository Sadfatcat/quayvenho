import type { CabinClass, SeatColumn, SeatId, SeatPref } from './models';

const COLUMNS: readonly SeatColumn[] = ['A', 'B', 'C', 'D'];
const WINDOW_COLUMNS: readonly SeatColumn[] = ['A', 'D'];
const BUSINESS_LAST_ROW = 2;
const ECONOMY_LAST_ROW = 10;

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

export type SeatZone = 'FRONT' | 'MIDDLE' | 'BACK';

/** Phần ngoài cùng mỗi đầu (1/4 số hàng, tối thiểu 1) là FRONT/BACK; phần còn lại là MIDDLE. Khoang thương gia (2 hàng) không có MIDDLE. */
export const seatZone = (seat: SeatId): SeatZone => {
  const rows = rowsOf(cabinOfSeat(seat));
  const edge = Math.max(1, Math.floor(rows.length / 4));
  const index = rows.indexOf(seatRow(seat));
  if (index < edge) return 'FRONT';
  return index >= rows.length - edge ? 'BACK' : 'MIDDLE';
};

/** Các yêu cầu vị trí ghế hợp lệ cho một khoang (khoang thương gia không có "giữa khoang"). */
export const seatPrefsForCabin = (cabin: CabinClass): readonly SeatPref[] =>
  cabin === 'BUSINESS' ? ['WINDOW', 'AISLE', 'FRONT', 'BACK'] : ['WINDOW', 'AISLE', 'FRONT', 'MIDDLE', 'BACK'];

export const matchesSeatPref = (seat: SeatId, pref: SeatPref): boolean => {
  switch (pref) {
    case 'ANY':
      return true;
    case 'WINDOW':
      return isWindow(seat);
    case 'AISLE':
      return isAisle(seat);
    case 'FRONT':
    case 'MIDDLE':
    case 'BACK':
      return seatZone(seat) === pref;
  }
};
