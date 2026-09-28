import { describe, expect, it } from 'vitest';
import { SHOP_CLOSE_MINUTE, SHOP_OPEN_MINUTE } from '@data/schedule';
import { advanceClock, formatClock, matchesTimePref, timeWindowOf } from './clock';

describe('clock', () => {
  it('shop hours are 08:00–19:00', () => {
    expect(formatClock(SHOP_OPEN_MINUTE)).toBe('08:00');
    expect(formatClock(SHOP_CLOSE_MINUTE)).toBe('19:00');
    expect(SHOP_OPEN_MINUTE).toBe(480);
  });

  it('formats after midnight and fractional minutes', () => {
    expect(formatClock(1470)).toBe('00:30');
    expect(formatClock(1530.9)).toBe('01:30');
  });

  it('advances 1 game minute per 500 ms', () => {
    expect(advanceClock(480, 500)).toBe(481);
    expect(advanceClock(480, 100)).toBeCloseTo(480.2);
  });

  it('NIGHT/LATE boundary at midnight', () => {
    expect(timeWindowOf(1410)).toBe('NIGHT');
    expect(timeWindowOf(1470)).toBe('LATE');
    expect(matchesTimePref(1410, 'LATE')).toBe(false);
    expect(matchesTimePref(1470, 'LATE')).toBe(true);
    expect(matchesTimePref(1290, 'ANY')).toBe(true);
  });
});
