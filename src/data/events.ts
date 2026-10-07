import type { WeatherOutcome } from '@domain/models';

export const DAY_EVENT_WEIGHTS = { RUSH: 0.15, WEATHER: 0.3, NONE: 0.55 } as const;

/** Tuyến có dự báo thời tiết xấu được giảm giá vốn ghế (bù cho rủi ro mất ghế khi mở cửa). */
export const WEATHER_FORECAST_COST_DISCOUNT = 0.5;

export const RUSH_CUSTOMER_MULT = 1.3;
export const RUSH_PRICE_MULT = 1.2;

export const WEATHER_OUTCOME_WEIGHTS: Record<WeatherOutcome, number> = {
  GOOD: 0.3,
  BAD: 0.5,
  SEVERE: 0.2,
};

/** Share of the forecast route's available seats lost per outcome. */
export const WEATHER_LOSS_SHARE: Record<WeatherOutcome, number> = {
  GOOD: 0,
  BAD: 1 / 3,
  SEVERE: 1,
};
