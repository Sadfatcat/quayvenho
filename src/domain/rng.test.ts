import { describe, expect, it } from 'vitest';
import { createRng, deriveSeed, rngFor } from './rng';
import { ShuffleBag } from './shuffleBag';

const sequence = (seed: number, count: number) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('rng', () => {
  it('same seed gives same sequence, different seed differs', () => {
    expect(sequence(42, 20)).toEqual(sequence(42, 20));
    expect(sequence(42, 20)).not.toEqual(sequence(43, 20));
  });

  it('next is in [0, 1)', () => {
    expect(sequence(7, 10_000).every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('int includes both ends and nothing outside', () => {
    const rng = createRng(1);
    const seen = new Set(Array.from({ length: 5_000 }, () => rng.int(3, 6)));
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('int rejects bad ranges', () => {
    expect(() => createRng(1).int(5, 4)).toThrow();
    expect(() => createRng(1).int(0.5, 4)).toThrow();
  });

  it('weighted converges to weights within 2% over 100k draws', () => {
    const rng = createRng(99);
    const counts = { a: 0, b: 0, c: 0 };
    const items = [
      { value: 'a' as const, weight: 1 },
      { value: 'b' as const, weight: 3 },
      { value: 'c' as const, weight: 6 },
    ];
    for (let i = 0; i < 100_000; i++) counts[rng.weighted(items)]++;
    expect(Math.abs(counts.a / 100_000 - 0.1)).toBeLessThan(0.02);
    expect(Math.abs(counts.b / 100_000 - 0.3)).toBeLessThan(0.02);
    expect(Math.abs(counts.c / 100_000 - 0.6)).toBeLessThan(0.02);
  });

  it('pick and weighted reject empty input', () => {
    expect(() => createRng(1).pick([])).toThrow();
    expect(() => createRng(1).weighted([{ value: 'x', weight: 0 }])).toThrow();
  });

  it('shuffle returns a new permutation', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const output = createRng(5).shuffle(input);
    expect(output).not.toBe(input);
    expect([...output].sort()).toEqual(input);
  });

  it('deriveSeed differs per stream, day and base', () => {
    const seeds = new Set([
      deriveSeed(1, 1, 'orders'),
      deriveSeed(1, 1, 'spawn'),
      deriveSeed(1, 2, 'orders'),
      deriveSeed(2, 1, 'orders'),
    ]);
    expect(seeds.size).toBe(4);
    expect(rngFor(1, 1, 'x').next()).toBe(rngFor(1, 1, 'x').next());
  });
});

describe('ShuffleBag', () => {
  it('each full bag holds every value exactly weight times', () => {
    const bag = new ShuffleBag(createRng(3), [
      { value: 'A', weight: 3 },
      { value: 'B', weight: 2 },
      { value: 'C', weight: 1 },
    ]);
    for (let round = 0; round < 5; round++) {
      const drawn = Array.from({ length: 6 }, () => bag.draw());
      expect(drawn.filter((v) => v === 'A')).toHaveLength(3);
      expect(drawn.filter((v) => v === 'B')).toHaveLength(2);
      expect(drawn.filter((v) => v === 'C')).toHaveLength(1);
    }
  });

  it('rejects invalid weights', () => {
    expect(() => new ShuffleBag(createRng(1), [{ value: 'A', weight: 0 }])).toThrow();
    expect(() => new ShuffleBag(createRng(1), [{ value: 'A', weight: 1.5 }])).toThrow();
  });
});
