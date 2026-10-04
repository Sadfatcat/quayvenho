import type { GameState } from '@domain/models';
import { devError } from '@platform/logger';
import { migrateSave } from './migrate';
import { gameStateSchema } from './schema';

const SAVE_KEY = 'qvn:save';
const BACKUP_KEY = 'qvn:save:prev';

export type LoadSaveReason = 'EMPTY' | 'CORRUPTED' | 'FUTURE_VERSION';
type RawLoadResult = { ok: true; value: GameState } | { ok: false; reason: LoadSaveReason };
export type LoadSaveResult = { ok: true; value: GameState; recoveredFromBackup: boolean } | { ok: false; reason: LoadSaveReason };

const isMidShift = (phase: GameState['phase']): boolean => phase === 'OPEN' || phase === 'CLOSING';

export const parseSaveJson = (json: string): RawLoadResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'CORRUPTED' };
  }
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'CORRUPTED' };
  }

  const migrated = migrateSave(raw as Record<string, unknown>);
  if (!migrated.ok) {
    return migrated.reason === 'FUTURE_VERSION'
      ? { ok: false, reason: 'FUTURE_VERSION' }
      : { ok: false, reason: 'CORRUPTED' };
  }

  const parsed = gameStateSchema.safeParse(migrated.value);
  if (!parsed.success) {
    return { ok: false, reason: 'CORRUPTED' };
  }
  // Save giữa ca (OPEN/CLOSING) không bao giờ hợp lệ: GameSession từ chối nạp (PLAN §6.6) — coi như hỏng để rơi về bản sao lưu.
  if (isMidShift(parsed.data.phase)) return { ok: false, reason: 'CORRUPTED' };
  return { ok: true, value: parsed.data as GameState };
};

const readKey = (key: string): RawLoadResult => {
  let json: string | null;
  try {
    json = localStorage.getItem(key);
  } catch (error) {
    devError('localStorage không truy cập được', error);
    return { ok: false, reason: 'EMPTY' };
  }
  if (json === null) {
    return { ok: false, reason: 'EMPTY' };
  }
  return parseSaveJson(json);
};

/** Đọc save chính; JSON hỏng hoặc không hợp lệ thì rơi về bản sao lưu gần nhất. */
export const loadSave = (): LoadSaveResult => {
  const primary = readKey(SAVE_KEY);
  if (primary.ok) return { ...primary, recoveredFromBackup: false };
  if (primary.reason === 'FUTURE_VERSION') return primary;

  const backup = readKey(BACKUP_KEY);
  return backup.ok ? { ...backup, recoveredFromBackup: true } : backup;
};

/** Ghi save mới; bản cũ (nếu có) được giữ lại làm backup trước khi ghi đè. */
export const writeSave = (state: GameState): void => {
  // PLAN §6.6: không lưu giữa ca; cờ/cài đặt đổi trong ca sẽ được lưu ở mốc cuối ngày.
  if (isMidShift(state.phase)) return;
  try {
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous !== null) {
      localStorage.setItem(BACKUP_KEY, previous);
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    devError('writeSave thất bại', error);
  }
};

export const clearSave = (): void => {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(BACKUP_KEY);
};

const PROBE_KEY = 'qvn:probe';

/** PLAN §9.4: kiểm tra localStorage khả dụng lúc boot bằng cách ghi/đọc/xoá một key thử. */
export const isStorageAvailable = (): boolean => {
  try {
    localStorage.setItem(PROBE_KEY, '1');
    const ok = localStorage.getItem(PROBE_KEY) === '1';
    localStorage.removeItem(PROBE_KEY);
    return ok;
  } catch {
    return false;
  }
};

/** PLAN §9.7: không chặn luồng, bỏ qua kết quả lỗi. */
export const requestPersistentStorage = (): void => {
  navigator.storage?.persist?.().catch((error: unknown) => devError('persist() thất bại', error));
};
