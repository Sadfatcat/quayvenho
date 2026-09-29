import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';

describe('migrateSave', () => {
  it('nâng save v0 (thiếu flags) lên v1', () => {
    const v0 = { seed: 1, day: 1, money: 400 };

    const result = migrateSave(v0);

    expect(result).toEqual({ ok: true, value: { ...v0, version: 1, flags: {} } });
  });

  it('giữ nguyên save đã đúng version hiện tại', () => {
    const current = { version: 1, seed: 1, day: 1 };

    const result = migrateSave(current);

    expect(result).toEqual({ ok: true, value: current });
  });

  it('từ chối save có version lớn hơn bản đang chạy', () => {
    const future = { version: 99, seed: 1 };

    const result = migrateSave(future);

    expect(result).toEqual({ ok: false, reason: 'FUTURE_VERSION' });
  });
});
