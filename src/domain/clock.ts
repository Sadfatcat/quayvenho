import { MS_PER_GAME_MINUTE } from '../config';
import type { TimePref, TimeWindow } from './models';

export const MINUTES_PER_DAY = 1440;

export const advanceClock = (clock: number, deltaMs: number): number =>
  clock + deltaMs / MS_PER_GAME_MINUTE;

/** 1470 → "00:30" */
export const formatClock = (minute: number): string => {
  const whole = Math.floor(minute) % MINUTES_PER_DAY;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(whole / 60))}:${pad(whole % 60)}`;
};

/** Departures before midnight are NIGHT, after midnight LATE. */
export const timeWindowOf = (departAt: number): TimeWindow =>
  departAt < MINUTES_PER_DAY ? 'NIGHT' : 'LATE';

export const matchesTimePref = (departAt: number, pref: TimePref): boolean =>
  pref === 'ANY' || timeWindowOf(departAt) === pref;
