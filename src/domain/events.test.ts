import { describe, expect, it } from 'vitest';
import { isRush, resolveWeather, rollDayEvent } from './events';

const ROUTES = ['HAN-SGN', 'HAN-DAD'] as const;
const SAMPLE_SEEDS = 60;
const SAMPLE_DAYS = 40;

describe('rollDayEvent', () => {
  it('never returns more than one event per day (single discriminated result)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const event = rollDayEvent(seed, 1, [...ROUTES]);
      expect(['NONE', 'RUSH', 'WEATHER']).toContain(event.type);
    }
  });

  it('converges to the configured RUSH/WEATHER/NONE weights (0.15/0.25/0.6)', () => {
    const counts = { RUSH: 0, WEATHER: 0, NONE: 0 };
    let total = 0;
    for (let seed = 1; seed <= SAMPLE_SEEDS; seed++) {
      for (let day = 1; day <= SAMPLE_DAYS; day++) {
        counts[rollDayEvent(seed, day, [...ROUTES]).type]++;
        total++;
      }
    }
    expect(counts.RUSH / total).toBeCloseTo(0.15, 1);
    expect(counts.WEATHER / total).toBeCloseTo(0.25, 1);
    expect(counts.NONE / total).toBeCloseTo(0.6, 1);
  });

  it('WEATHER event picks the forecast route from the unlocked routes', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const event = rollDayEvent(seed, 1, [...ROUTES]);
      if (event.type === 'WEATHER') {
        expect(ROUTES).toContain(event.routeId);
        expect(event.outcome).toBeNull();
      }
    }
  });
});

describe('resolveWeather', () => {
  it('converges to the configured GOOD/BAD/SEVERE weights (0.4/0.4/0.2)', () => {
    const counts = { GOOD: 0, BAD: 0, SEVERE: 0 };
    let total = 0;
    for (let seed = 1; seed <= SAMPLE_SEEDS; seed++) {
      for (let day = 1; day <= SAMPLE_DAYS; day++) {
        counts[resolveWeather(seed, day)]++;
        total++;
      }
    }
    expect(counts.GOOD / total).toBeCloseTo(0.4, 1);
    expect(counts.BAD / total).toBeCloseTo(0.4, 1);
    expect(counts.SEVERE / total).toBeCloseTo(0.2, 1);
  });
});

describe('isRush', () => {
  it('is true only for a RUSH event', () => {
    expect(isRush({ type: 'RUSH' })).toBe(true);
    expect(isRush({ type: 'NONE' })).toBe(false);
    expect(isRush({ type: 'WEATHER', routeId: 'HAN-DAD', outcome: null })).toBe(false);
  });
});
