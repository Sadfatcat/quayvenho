import { SAVE_VERSION } from '@data/balance';

/**
 * Save v0 (giả định, minh hoạ cách thêm migration thật sau này): chưa có
 * field `flags`. Chuỗi migration chạy tuần tự cho tới `SAVE_VERSION` hiện tại.
 */
const migrations: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {
  0: (old) => ({ ...old, version: 1, flags: old.flags ?? {} }),
};

export type MigrateResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: 'FUTURE_VERSION' | 'UNKNOWN_VERSION' };

/** Nâng dữ liệu save thô lên đúng SAVE_VERSION hiện tại, hoặc báo lỗi nếu không migrate được. */
export const migrateSave = (raw: Record<string, unknown>): MigrateResult => {
  let version = typeof raw.version === 'number' ? raw.version : 0;
  let data = raw;

  if (version > SAVE_VERSION) {
    return { ok: false, reason: 'FUTURE_VERSION' };
  }

  while (version < SAVE_VERSION) {
    const step = migrations[version];
    if (!step) {
      return { ok: false, reason: 'UNKNOWN_VERSION' };
    }
    data = step(data);
    version = typeof data.version === 'number' ? data.version : version + 1;
  }

  return { ok: true, value: data };
};
