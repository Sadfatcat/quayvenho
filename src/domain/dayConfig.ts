import {
  DAY_CONFIGS,
  MECHANIC_UNLOCK_DAY,
  PATIENCE_DECAY_FROM_DAY,
  PATIENCE_DECAY_PER_DAY,
  PATIENCE_MIN_MS,
} from '@data/days';
import { invariant } from './common/invariant';
import type { DayConfig, Mechanic } from './models';

/** Row of the nearest configured day ≤ `day`; patience decays from day 11. */
export const getDayConfig = (day: number): DayConfig => {
  invariant(Number.isInteger(day) && day >= 1, `bad day ${day}`);
  const row = [...DAY_CONFIGS].reverse().find((config) => config.day <= day);
  invariant(row, `no config for day ${day}`);
  const decayDays = Math.max(0, day - PATIENCE_DECAY_FROM_DAY + 1);
  const patienceBaseMs = Math.max(
    PATIENCE_MIN_MS,
    Math.round(row.patienceBaseMs * PATIENCE_DECAY_PER_DAY ** decayDays),
  );
  return { ...row, day, patienceBaseMs };
};

export const isMechanicOpen = (mechanic: Mechanic, day: number): boolean =>
  day >= MECHANIC_UNLOCK_DAY[mechanic];
