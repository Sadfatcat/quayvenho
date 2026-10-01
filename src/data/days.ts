import type { DayConfig, Mechanic } from '@domain/models';

export const DAY_CONFIGS: readonly DayConfig[] = [
  { day: 1, patienceBaseMs: 50000, pBaggage: 0, pSeatPref: 0, pBusiness: 0, pTimePref: 0, pExtra: 0, pBadPassport: 0, maxComplexity: 0 },
  { day: 2, patienceBaseMs: 48000, pBaggage: 0.5, pSeatPref: 0, pBusiness: 0, pTimePref: 0, pExtra: 0, pBadPassport: 0, maxComplexity: 1 },
  { day: 3, patienceBaseMs: 46000, pBaggage: 0.5, pSeatPref: 0.5, pBusiness: 0, pTimePref: 0, pExtra: 0, pBadPassport: 0, maxComplexity: 2 },
  { day: 4, patienceBaseMs: 44000, pBaggage: 0.55, pSeatPref: 0.5, pBusiness: 0.2, pTimePref: 0, pExtra: 0, pBadPassport: 0, maxComplexity: 3 },
  { day: 5, patienceBaseMs: 42000, pBaggage: 0.6, pSeatPref: 0.55, pBusiness: 0.2, pTimePref: 0.35, pExtra: 0.3, pBadPassport: 0, maxComplexity: 4 },
  { day: 6, patienceBaseMs: 40000, pBaggage: 0.6, pSeatPref: 0.55, pBusiness: 0.25, pTimePref: 0.4, pExtra: 0.3, pBadPassport: 0.12, maxComplexity: 4 },
  { day: 8, patienceBaseMs: 38000, pBaggage: 0.65, pSeatPref: 0.6, pBusiness: 0.25, pTimePref: 0.45, pExtra: 0.35, pBadPassport: 0.12, maxComplexity: 5 },
  { day: 10, patienceBaseMs: 36000, pBaggage: 0.65, pSeatPref: 0.6, pBusiness: 0.3, pTimePref: 0.45, pExtra: 0.4, pBadPassport: 0.15, maxComplexity: 5 },
];

export const MECHANIC_UNLOCK_DAY: Record<Mechanic, number> = {
  baggage: 2,
  seatPref: 3,
  business: 4,
  timePref: 5,
  extras: 5,
  badPassport: 6,
};

/** From this day on, patienceBaseMs shrinks each day. */
export const PATIENCE_DECAY_FROM_DAY = 11;
export const PATIENCE_DECAY_PER_DAY = 0.98;
export const PATIENCE_MIN_MS = 24000;
/** Hệ số nhân kiên nhẫn cơ bản của mọi ngày (cân bằng game). */
export const PATIENCE_SCALE = 1.25;
