import { invariant } from './common/invariant';
import type { Rng, WeightedItem } from './rng';

export class ShuffleBag<T> {
  private remaining: T[] = [];
  private readonly rng: Rng;
  private readonly items: readonly WeightedItem<T>[];

  constructor(rng: Rng, items: readonly WeightedItem<T>[]) {
    invariant(
      items.every((item) => Number.isInteger(item.weight) && item.weight >= 0),
      'ShuffleBag weights must be non-negative integers',
    );
    invariant(items.some((item) => item.weight > 0), 'ShuffleBag needs a positive weight');
    this.rng = rng;
    this.items = items;
  }

  draw(): T {
    if (this.remaining.length === 0) {
      this.remaining = this.rng.shuffle(
        this.items.flatMap((item) => Array.from({ length: item.weight }, () => item.value)),
      );
    }
    return this.remaining.pop() as T;
  }
}
