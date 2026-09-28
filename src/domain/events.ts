import { DAY_EVENT_WEIGHTS, WEATHER_OUTCOME_WEIGHTS } from '@data/events';
import type { DayEvent, RouteId, WeatherOutcome } from './models';
import { rngFor } from './rng';

export const rollDayEvent = (seed: number, day: number, unlockedRoutes: readonly RouteId[]): DayEvent => {
  const rng = rngFor(seed, day, 'event');
  const type = rng.weighted(
    (Object.entries(DAY_EVENT_WEIGHTS) as [DayEvent['type'], number][]).map(([value, weight]) => ({ value, weight })),
  );
  if (type === 'WEATHER') return { type, routeId: rng.pick(unlockedRoutes), outcome: null };
  return { type };
};

export const resolveWeather = (seed: number, day: number): WeatherOutcome =>
  rngFor(seed, day, 'weather').weighted(
    (Object.entries(WEATHER_OUTCOME_WEIGHTS) as [WeatherOutcome, number][]).map(([value, weight]) => ({ value, weight })),
  );

export const isRush = (event: DayEvent): boolean => event.type === 'RUSH';
