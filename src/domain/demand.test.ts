import { describe, expect, it } from 'vitest';
import { baseCustomers, customersForDay, demandFactor, ratingBonus, travelVietScore } from './demand';
import type { Stars } from './models';

describe('baseCustomers', () => {
  it('starts at 5 and grows 1–3/day to day 10, 1–2/day after', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(baseCustomers(seed, 1)).toBe(5);
      for (let day = 2; day <= 40; day++) {
        const growth = baseCustomers(seed, day) - baseCustomers(seed, day - 1);
        expect(growth).toBeGreaterThanOrEqual(1);
        expect(growth).toBeLessThanOrEqual(day <= 10 ? 3 : 2);
      }
    }
  });
});

describe('travelVietScore', () => {
  it('defaults to 4.0 and averages the last 30 stars', () => {
    expect(travelVietScore([])).toBe(4);
    const history: Stars[] = [...Array<Stars>(10).fill(1), ...Array<Stars>(30).fill(5)];
    expect(travelVietScore(history)).toBe(5);
    expect(travelVietScore([5, 4, 4])).toBe(4.3);
  });
});

describe('demandFactor', () => {
  it('matches the table at every boundary', () => {
    expect(demandFactor(1)).toBe(0.3);
    expect(demandFactor(2.9)).toBe(0.3);
    expect(demandFactor(3.0)).toBe(0.45);
    expect(demandFactor(3.5)).toBe(0.45);
    expect(demandFactor(3.6)).toBe(1);
    expect(demandFactor(4.4)).toBe(1);
    expect(demandFactor(5)).toBe(1);
  });
});

describe('ratingBonus', () => {
  it('is 0 up to 4.4, then tiered per 0.1', () => {
    expect(ratingBonus(1, 20, 4.4)).toBe(0);
    for (let seed = 1; seed <= 50; seed++) {
      const at45 = ratingBonus(seed, 20, 4.5);
      expect(at45).toBeGreaterThanOrEqual(8);
      expect(at45).toBeLessThanOrEqual(12);
      const at47 = ratingBonus(seed, 20, 4.7);
      expect(at47).toBeGreaterThanOrEqual(24);
      expect(at47).toBeLessThanOrEqual(36);
      const at48 = ratingBonus(seed, 20, 4.8);
      expect(at48).toBeGreaterThanOrEqual(24 + 25);
      expect(at48).toBeLessThanOrEqual(36 + 35);
      const at50 = ratingBonus(seed, 20, 5);
      expect(at50).toBeGreaterThanOrEqual(24 + 75);
      expect(at50).toBeLessThanOrEqual(36 + 105);
    }
  });
});

describe('customersForDay', () => {
  it('ignores TravelViet before day 11 and adds 20% early-days customers', () => {
    expect(customersForDay({ seed: 1, day: 1, rating: 1, rush: false })).toBe(6);
    expect(customersForDay({ seed: 1, day: 1, rating: 1, rush: true })).toBe(8);
    expect(customersForDay({ seed: 1, day: 10, rating: 5, rush: false })).toBe(Math.round(baseCustomers(1, 10) * 1.2));
  });

  it('applies factor from day 11', () => {
    const base = baseCustomers(1, 11);
    expect(customersForDay({ seed: 1, day: 11, rating: 2.5, rush: false })).toBe(Math.max(2, Math.round(base * 0.3)));
    expect(customersForDay({ seed: 1, day: 11, rating: 4.0, rush: false })).toBe(base);
  });

  it('never exceeds 300 or drops below 2', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const day = 1 + (seed % 200);
      expect(customersForDay({ seed, day, rating: 5, rush: true })).toBeLessThanOrEqual(300);
      expect(customersForDay({ seed, day, rating: 1, rush: false })).toBeGreaterThanOrEqual(2);
    }
    expect(customersForDay({ seed: 1, day: 500, rating: 5, rush: true })).toBe(300);
  });
});
