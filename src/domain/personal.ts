import type { PersonalConfig, ScriptedMoment, SpecialCustomer } from '@data/personal';
import { canServe } from './canServe';
import { matchesTimePref } from './clock';
import { giftSeats } from './inventory';
import type { Flight, Order, OwnedSeat } from './models';
import type { Rng } from './rng';

/** Hộ chiếu của khách đặc biệt luôn còn hạn dài, tránh bị coi là hộ chiếu lỗi. */
const SPECIAL_PASSPORT_VALID_DAYS = 30;

/**
 * Slot (chỉ số lượt đến) thật của từng khách đặc biệt trong ngày. `atCustomerIndex` vượt số khách thì thành khách cuối
 * cùng; nhiều khách trùng slot thì khách đến sau lùi về slot trống gần nhất phía trước (PLAN §16).
 */
const slotsOfDay = (config: PersonalConfig, day: number, arrivalCount: number): Map<number, SpecialCustomer> => {
  const lastIndex = arrivalCount - 1;
  const todays = config.specialCustomers
    .filter((special) => special.day === day)
    .sort((a, b) => b.atCustomerIndex - a.atCustomerIndex);
  const slots = new Map<number, SpecialCustomer>();
  for (const special of todays) {
    let slot = Math.min(special.atCustomerIndex, lastIndex);
    while (slots.has(slot) && slot > 0) slot--;
    if (!slots.has(slot)) slots.set(slot, special);
  }
  return slots;
};

/** Khách đặc biệt của ngày `day` ở lượt đến thứ `arrivalIndex` trong tổng `arrivalCount` lượt (PLAN §16). */
export const specialCustomerForArrival = (
  config: PersonalConfig,
  day: number,
  arrivalIndex: number,
  arrivalCount: number,
): SpecialCustomer | undefined => {
  if (!config.enabled || arrivalCount === 0) return undefined;
  return slotsOfDay(config, day, arrivalCount).get(arrivalIndex);
};

/** Ngày có khách đặc biệt hoặc scripted moment thì không có sự kiện ngẫu nhiên (PLAN §16). */
export const dayHasPersonalContent = (config: PersonalConfig, day: number): boolean =>
  config.enabled && (config.specialCustomers.some((special) => special.day === day) || config.scriptedMoments.some((moment) => moment.day === day));

export const scriptedMomentsFor = (config: PersonalConfig, day: number, at: ScriptedMoment['at']): ScriptedMoment[] =>
  config.enabled ? config.scriptedMoments.filter((moment) => moment.day === day && moment.at === at) : [];

/** Đơn sinh ngẫu nhiên được ghi đè bởi đơn cấu hình, kèm hộ chiếu hợp lệ mang tên hiển thị. */
export const buildSpecialOrder = (generated: Order, special: SpecialCustomer, day: number): Order => ({
  ...generated,
  ...special.order,
  customerId: generated.customerId,
  spriteId: special.spriteId,
  passport: { name: special.displayName, bookedName: special.displayName, expiresDay: day + SPECIAL_PASSPORT_VALID_DAYS },
  special: { id: special.id, tipMultiplier: special.tipMultiplier },
});

const earliestMatchingFlight = (order: Order, flights: readonly Flight[]): Flight | undefined =>
  flights
    .filter((flight) => flight.routeId === order.routeId && flight.status === 'SCHEDULED' && matchesTimePref(flight.departAt, order.timePref))
    .sort((a, b) => a.departAt - b.departAt)[0];

/**
 * Ghế miễn phí (unitCost 0, không ghi transaction) để khách đặc biệt luôn phục vụ được. Trả mảng rỗng khi đã
 * phục vụ được hoặc không có chuyến phù hợp. Người gọi tự thêm vào kho ghế.
 */
export const ensureServableForSpecial = (order: Order, flights: readonly Flight[], seats: readonly OwnedSeat[], rng: Rng): OwnedSeat[] => {
  if (canServe(order, flights, seats)) return [];
  const flight = earliestMatchingFlight(order, flights);
  return flight ? giftSeats(flight, order.cabin, 1, seats, rng) : [];
};
