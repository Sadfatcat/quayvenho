import { invariant } from './common/invariant';
import { sum } from './common/math';

export interface WeightedItem<T> {
  value: T;
  weight: number;
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly WeightedItem<T>[]): T;
  shuffle<T>(items: readonly T[]): T[];
}

/** mulberry32 */
export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    invariant(Number.isInteger(min) && Number.isInteger(max) && min <= max, `bad int range ${min}..${max}`);
    return min + Math.floor(next() * (max - min + 1));
  };

  const pick = <T>(items: readonly T[]): T => {
    invariant(items.length > 0, 'pick from empty list');
    return items[int(0, items.length - 1)] as T;
  };

  const weighted = <T>(items: readonly WeightedItem<T>[]): T => {
    const total = sum(items.map((item) => item.weight));
    invariant(total > 0, 'weighted needs a positive total weight');
    let roll = next() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item.value;
    }
    return (items[items.length - 1] as WeightedItem<T>).value;
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = int(0, i);
      [result[i], result[j]] = [result[j] as T, result[i] as T];
    }
    return result;
  };

  return { next, int, chance: (probability) => next() < probability, pick, weighted, shuffle };
};

/** FNV-1a 32-bit */
export const hashString = (text: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export const deriveSeed = (base: number, day: number, stream: string): number =>
  hashString(`${base}:${day}:${stream}`);

export const rngFor = (base: number, day: number, stream: string): Rng =>
  createRng(deriveSeed(base, day, stream));
