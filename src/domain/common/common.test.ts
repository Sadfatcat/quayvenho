import { describe, expect, it } from 'vitest';
import { err, ok } from './result';
import { invariant } from './invariant';
import { clamp, roundToTenth, sum } from './math';

describe('result', () => {
  it('builds ok and err', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
    expect(err('NOPE')).toEqual({ ok: false, reason: 'NOPE' });
  });
});

describe('invariant', () => {
  it('passes on truthy, throws on falsy', () => {
    expect(() => invariant(1, 'x')).not.toThrow();
    expect(() => invariant(0, 'broken')).toThrow('Invariant failed: broken');
  });
});

describe('math', () => {
  it('clamps at both bounds', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('sums, empty is 0', () => {
    expect(sum([])).toBe(0);
    expect(sum([1, 2, 3])).toBe(6);
  });
  it('rounds to one decimal', () => {
    expect(roundToTenth(4.449)).toBe(4.4);
    expect(roundToTenth(4.45)).toBe(4.5);
  });
});
