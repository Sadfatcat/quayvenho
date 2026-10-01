import { describe, expect, it } from 'vitest';
import { formatMoney } from './format';

describe('formatMoney', () => {
  it('groups thousands with dots and appends k', () => {
    expect(formatMoney(0)).toBe('0k');
    expect(formatMoney(730)).toBe('730k');
    expect(formatMoney(1100)).toBe('1.100k');
    expect(formatMoney(6000)).toBe('6.000k');
    expect(formatMoney(1234567)).toBe('1.234.567k');
  });

  it('shows negatives with a proper minus sign and rounds fractions', () => {
    expect(formatMoney(-2190)).toBe('−2.190k');
    expect(formatMoney(1099.6)).toBe('1.100k');
  });
});
