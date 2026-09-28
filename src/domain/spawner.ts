import { FIRST_ARRIVAL_MINUTE, LAST_ARRIVAL_MINUTE, PEAK_WEIGHT, PEAK_WINDOWS } from '@data/schedule';
import type { Rng } from './rng';

const isPeak = (minute: number): boolean => PEAK_WINDOWS.some(([from, to]) => minute >= from && minute < to);

/** Sorted arrival minutes; the first customer always arrives at 08:06. */
export const generateArrivals = (rng: Rng, count: number): number[] => {
  if (count <= 0) return [];
  const arrivals = [FIRST_ARRIVAL_MINUTE];
  while (arrivals.length < count) {
    const minute = rng.int(FIRST_ARRIVAL_MINUTE, LAST_ARRIVAL_MINUTE);
    if (rng.next() < (isPeak(minute) ? PEAK_WEIGHT : 1) / PEAK_WEIGHT) arrivals.push(minute);
  }
  return arrivals.sort((a, b) => a - b);
};
