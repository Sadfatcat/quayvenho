import {
  HOLIDAY_HOT_ROUTE_WEIGHT,
  OVER_CAP_DEMAND_MULT,
  PRICE_CAP_PCT,
  PRICE_DEMAND_MAX,
  PRICE_DEMAND_MIN,
  PRICE_ELASTICITY_HOLIDAY,
  PRICE_ELASTICITY_NORMAL,
  PRICE_MAX_PCT,
  PRICE_MIN_PCT,
} from '@data/pricing';
import { ROUTES } from '@data/routes';
import { clamp } from './common/math';
import type { DayEvent, RouteId } from './models';

export type PricePctByRoute = Readonly<Partial<Record<RouteId, number>>>;

export const clampPricePct = (pct: number): number => clamp(Math.round(pct), PRICE_MIN_PCT, PRICE_MAX_PCT);

export const isOverCap = (pct: number): boolean => pct > PRICE_CAP_PCT;

export const isHolidayEvent = (event: DayEvent): boolean => event.type === 'RUSH';

/** Hệ số số khách của một tuyến theo giá: rẻ → đông, đắt → vắng, vượt trần → giảm một nửa nữa. */
export const priceDemandFactor = (pct: number, holiday: boolean): number => {
  const slope = holiday ? PRICE_ELASTICITY_HOLIDAY : PRICE_ELASTICITY_NORMAL;
  const factor = clamp(1 - (slope * pct) / 100, PRICE_DEMAND_MIN, PRICE_DEMAND_MAX);
  return isOverCap(pct) ? factor * OVER_CAP_DEMAND_MULT : factor;
};

export interface DayDemandProfile {
  /** Nhân vào trọng số chọn tuyến của từng tuyến (ngày lễ: tuyến nóng ×3, rồi nhân hệ số giá). */
  routeWeightMultiplier: Record<RouteId, number>;
  /** Trung bình có trọng số của hệ số giá — nhân vào tổng số khách trong ngày. */
  averagePriceFactor: number;
}

export const dayDemandProfile = (
  unlockedRoutes: readonly RouteId[],
  pricePct: PricePctByRoute,
  event: DayEvent,
): DayDemandProfile => {
  const holiday = isHolidayEvent(event);
  const hot = event.type === 'RUSH' ? event.hotRoutes : [];
  const routes = ROUTES.filter((route) => unlockedRoutes.includes(route.id));
  const routeWeightMultiplier: Record<RouteId, number> = {};
  let weighted = 0;
  let total = 0;
  for (const route of routes) {
    const hotWeight = hot.includes(route.id) ? HOLIDAY_HOT_ROUTE_WEIGHT : 1;
    const factor = priceDemandFactor(pricePct[route.id] ?? 0, holiday);
    routeWeightMultiplier[route.id] = hotWeight * factor;
    weighted += route.weight * hotWeight * factor;
    total += route.weight * hotWeight;
  }
  return { routeWeightMultiplier, averagePriceFactor: total === 0 ? 1 : weighted / total };
};

