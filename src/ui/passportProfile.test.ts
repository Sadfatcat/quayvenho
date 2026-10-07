import { describe, expect, it } from 'vitest';
import { passportProfileOf, shortNameOf } from './passportProfile';

describe('shortNameOf', () => {
  it('keeps only the given name (last word) of a full Vietnamese name', () => {
    expect(shortNameOf('Ngô Gia Giang')).toBe('Giang');
    expect(shortNameOf('Lê Văn An')).toBe('An');
  });

  it('returns a one-word name unchanged', () => {
    expect(shortNameOf('Thảo')).toBe('Thảo');
  });
});

describe('passportProfileOf', () => {
  it('gives the same birth date and hometown for the same customer every time', () => {
    expect(passportProfileOf({ customerId: 'd3-c7' })).toEqual(passportProfileOf({ customerId: 'd3-c7' }));
  });

  it('produces a valid dd/mm/yyyy date for an adult and a non-empty hometown', () => {
    for (let index = 0; index < 200; index++) {
      const { birthDate, hometown } = passportProfileOf({ customerId: `d1-c${index}` });
      const [day, month, year] = birthDate.split('/').map(Number);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(28);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(year).toBeGreaterThanOrEqual(1956);
      expect(year).toBeLessThanOrEqual(2008);
      expect(hometown).not.toBe('');
    }
  });
});
