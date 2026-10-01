import { DAY_EVENT_WEIGHTS, WEATHER_OUTCOME_WEIGHTS } from '@data/events';
import { HOLIDAYS } from '@data/holidays';
import { HOLIDAY_HOT_ROUTE_COUNT } from '@data/pricing';
import type { DayEvent, RouteId, WeatherOutcome } from './models';
import { rngFor, type Rng } from './rng';

/** Các tuyến "nhu cầu cao" của ngày lễ: bốc ngẫu nhiên không trùng trong số tuyến đã mở. */
const pickHotRoutes = (rng: Rng, unlockedRoutes: readonly RouteId[]): RouteId[] => {
  const remaining = [...unlockedRoutes];
  const hot: RouteId[] = [];
  while (hot.length < HOLIDAY_HOT_ROUTE_COUNT && remaining.length > 0) {
    const [picked] = remaining.splice(rng.int(0, remaining.length - 1), 1);
    if (picked) hot.push(picked);
  }
  return hot;
};

export const rollDayEvent = (seed: number, day: number, unlockedRoutes: readonly RouteId[]): DayEvent => {
  const rng = rngFor(seed, day, 'event');
  const type = rng.weighted(
    (Object.entries(DAY_EVENT_WEIGHTS) as [DayEvent['type'], number][]).map(([value, weight]) => ({ value, weight })),
  );
  if (type === 'WEATHER') return { type, routeId: rng.pick(unlockedRoutes), outcome: null };
  if (type === 'RUSH') return { type, holidayId: rng.pick(HOLIDAYS).id, hotRoutes: pickHotRoutes(rng, unlockedRoutes) };
  return { type };
};

export const resolveWeather = (seed: number, day: number): WeatherOutcome =>
  rngFor(seed, day, 'weather').weighted(
    (Object.entries(WEATHER_OUTCOME_WEIGHTS) as [WeatherOutcome, number][]).map(([value, weight]) => ({ value, weight })),
  );

export const isRush = (event: DayEvent): boolean => event.type === 'RUSH';
