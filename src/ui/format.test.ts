import { describe, expect, it } from 'vitest';
import { formatMoney } from './format';

describe('formatMoney', () => {
  it('keeps k below 1.000k', () => {
    expect(formatMoney(0)).toBe('0k');
    expect(formatMoney(730)).toBe('730k');
    expect(formatMoney(999)).toBe('999k');
  });

  it('switches to tr from 1.000k, trimming trailing zeros', () => {
    expect(formatMoney(1000)).toBe('1tr');
    expect(formatMoney(1100)).toBe('1,1tr');
    expect(formatMoney(1408)).toBe('1,41tr');
    expect(formatMoney(1005)).toBe('1,01tr');
    expect(formatMoney(6000)).toBe('6tr');
  });

  it('groups large millions with dots and uses a comma for decimals', () => {
    expect(formatMoney(73425)).toBe('73,43tr');
    expect(formatMoney(1234567)).toBe('1.234,57tr');
  });

  it('shows negatives with a proper minus sign and rounds fractions', () => {
    expect(formatMoney(-2190)).toBe('−2,19tr');
    expect(formatMoney(-250)).toBe('−250k');
    expect(formatMoney(1099.6)).toBe('1,1tr');
    expect(formatMoney(999.6)).toBe('1tr');
  });
});
