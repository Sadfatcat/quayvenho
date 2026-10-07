import { describe, expect, it } from 'vitest';
import { EARLY_DAYS_CUSTOMER_MULT, TRAVELVIET_FROM_DAY, TRAVELVIET_RAMP_DAYS, TRAVELVIET_SCORE_WINDOW } from '@data/demand';
import { baseCustomers, customersForDay, demandFactor, ratingBonus, travelVietBlend, travelVietScore } from './demand';
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
  it('defaults to 4.0 and averages the last TRAVELVIET_SCORE_WINDOW stars', () => {
    expect(travelVietScore([])).toBe(4);
    const history: Stars[] = [...Array<Stars>(10).fill(1), ...Array<Stars>(TRAVELVIET_SCORE_WINDOW).fill(5)];
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
      expect(at45).toBeGreaterThanOrEqual(4);
      expect(at45).toBeLessThanOrEqual(6);
      const at47 = ratingBonus(seed, 20, 4.7);
      expect(at47).toBeGreaterThanOrEqual(12);
      expect(at47).toBeLessThanOrEqual(18);
      const at48 = ratingBonus(seed, 20, 4.8);
      expect(at48).toBeGreaterThanOrEqual(12 + 10);
      expect(at48).toBeLessThanOrEqual(18 + 15);
      const at50 = ratingBonus(seed, 20, 5);
      expect(at50).toBeGreaterThanOrEqual(12 + 30);
      expect(at50).toBeLessThanOrEqual(18 + 45);
    }
  });
});

describe('customersForDay', () => {
  it('ignores TravelViet before day 11 and adds early-days customer multiplier', () => {
    expect(customersForDay({ seed: 1, day: 1, rating: 1, rush: false })).toBe(Math.round(5 * EARLY_DAYS_CUSTOMER_MULT));
    expect(customersForDay({ seed: 1, day: 1, rating: 1, rush: true })).toBe(11);
    expect(customersForDay({ seed: 1, day: 10, rating: 5, rush: false })).toBe(Math.round(baseCustomers(1, 10) * EARLY_DAYS_CUSTOMER_MULT));
  });

  it('blends TravelViet in over TRAVELVIET_RAMP_DAYS, fully applied afterwards', () => {
    const fullDay = TRAVELVIET_FROM_DAY + TRAVELVIET_RAMP_DAYS - 1;
    expect(travelVietBlend(TRAVELVIET_FROM_DAY - 1)).toBe(0);
    expect(travelVietBlend(TRAVELVIET_FROM_DAY)).toBeGreaterThan(0);
    expect(travelVietBlend(TRAVELVIET_FROM_DAY)).toBeLessThan(1);
    expect(travelVietBlend(fullDay)).toBe(1);
    const base = baseCustomers(1, fullDay);
    expect(customersForDay({ seed: 1, day: fullDay, rating: 2.5, rush: false })).toBe(Math.max(2, Math.round(base * 0.3)));
    expect(customersForDay({ seed: 1, day: fullDay, rating: 4.0, rush: false })).toBe(base);
  });

  it('never lowers the customer count in days 1–10 when there is no holiday', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (let day = 2; day < TRAVELVIET_FROM_DAY; day++) {
        const today = customersForDay({ seed, day, rating: 4, rush: false });
        const yesterday = customersForDay({ seed, day: day - 1, rating: 4, rush: false });
        expect(today).toBeGreaterThanOrEqual(yesterday);
      }
    }
  });

  it('does not jump at day 11 for a high rating', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const before = customersForDay({ seed, day: TRAVELVIET_FROM_DAY - 1, rating: 4.7, rush: false });
      const after = customersForDay({ seed, day: TRAVELVIET_FROM_DAY, rating: 4.7, rush: false });
      expect(after).toBeLessThanOrEqual(Math.ceil(before * 1.3));
    }
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
