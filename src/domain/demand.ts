import {
  BASE_CUSTOMERS_DAY_1,
  BONUS_FROM_TENTHS,
  BONUS_TIERS,
  DEMAND_FACTORS,
  EARLY_DAYS_CUSTOMER_MULT,
  EARLY_GROWTH,
  RATING_BONUS_SCALE,
  LATE_GROWTH,
  MAX_CUSTOMERS,
  MIN_CUSTOMERS,
  TRAVELVIET_DEFAULT,
  TRAVELVIET_FROM_DAY,
  TRAVELVIET_RAMP_DAYS,
  TRAVELVIET_SCORE_WINDOW,
} from '@data/demand';
import { RUSH_CUSTOMER_MULT } from '@data/events';
import { invariant } from './common/invariant';
import { clamp, roundToTenth, sum } from './common/math';
import type { Stars } from './models';
import { rngFor } from './rng';

export const isTravelVietOpen = (day: number): boolean => day >= TRAVELVIET_FROM_DAY;

/** Deterministic per seed: 5 on day 1, +1–3/day through day 10, +1–2/day after. */
export const baseCustomers = (seed: number, day: number): number => {
  let base = BASE_CUSTOMERS_DAY_1;
  for (let d = 2; d <= day; d++) {
    const growth = d <= EARLY_GROWTH.untilDay ? EARLY_GROWTH : LATE_GROWTH;
    base += rngFor(seed, d, 'demand').int(growth.min, growth.max);
  }
  return base;
};

/** Average of the last TRAVELVIET_SCORE_WINDOW stars, one decimal; 4.0 when empty. */
export const travelVietScore = (starHistory: readonly Stars[]): number => {
  const recent = starHistory.slice(-TRAVELVIET_SCORE_WINDOW);
  return recent.length === 0 ? TRAVELVIET_DEFAULT : roundToTenth(sum(recent) / recent.length);
};

export const demandFactor = (rating: number): number => {
  const tenths = Math.round(rating * 10);
  const row = DEMAND_FACTORS.find((candidate) => tenths <= candidate.maxTenths);
  invariant(row, `rating out of range ${rating}`);
  return row.factor;
};

/** Each 0.1 above 4.4 adds a random amount from its tier (tier 2 ≈ ×3 tier 1). */
export const ratingBonus = (seed: number, day: number, rating: number): number => {
  const steps = clamp(Math.round(rating * 10) - BONUS_FROM_TENTHS + 1, 0, sum(BONUS_TIERS.map((t) => t.steps)));
  const rng = rngFor(seed, day, 'demand:bonus');
  let remaining = steps;
  let bonus = 0;
  for (const tier of BONUS_TIERS) {
    const taken = Math.min(remaining, tier.steps);
    for (let i = 0; i < taken; i++) bonus += rng.int(tier.min, tier.max);
    remaining -= taken;
  }
  return bonus;
};

/** 0 trước ngày mở TravelViet, tăng đều tới 1 sau `TRAVELVIET_RAMP_DAYS` ngày: tỉ lệ ảnh hưởng của TravelViet lên số khách. */
export const travelVietBlend = (day: number): number =>
  clamp((day - TRAVELVIET_FROM_DAY + 1) / TRAVELVIET_RAMP_DAYS, 0, 1);

const lerp = (from: number, to: number, blend: number): number => from + (to - from) * blend;

/** §3.9. `rating` is TravelViet at the end of the previous day. Từ ngày mở TravelViet, ảnh hưởng của nó được trộn dần (xem `travelVietBlend`). */
export const customersForDay = (input: { seed: number; day: number; rating: number; rush: boolean }): number => {
  const base = baseCustomers(input.seed, input.day);
  const blend = travelVietBlend(input.day);
  const factor = lerp(1, demandFactor(input.rating), blend);
  const bonus = blend > 0 ? ratingBonus(input.seed, input.day, input.rating) * blend * RATING_BONUS_SCALE : 0;
  const earlyMult = lerp(EARLY_DAYS_CUSTOMER_MULT, 1, blend);
  const raw = ((base * factor + bonus) * earlyMult) * (input.rush ? RUSH_CUSTOMER_MULT : 1);
  return clamp(Math.round(raw), MIN_CUSTOMERS, MAX_CUSTOMERS);
};
