import type { WeatherOutcome } from '@domain/models';

export const DAY_EVENT_WEIGHTS = { RUSH: 0.15, WEATHER: 0.25, NONE: 0.6 } as const;

export const RUSH_CUSTOMER_MULT = 1.4;
export const RUSH_PRICE_MULT = 1.2;

export const WEATHER_OUTCOME_WEIGHTS: Record<WeatherOutcome, number> = {
  GOOD: 0.4,
  BAD: 0.4,
  SEVERE: 0.2,
};

/** Share of the forecast route's available seats lost per outcome. */
export const WEATHER_LOSS_SHARE: Record<WeatherOutcome, number> = {
  GOOD: 0,
  BAD: 1 / 3,
  SEVERE: 1,
};
