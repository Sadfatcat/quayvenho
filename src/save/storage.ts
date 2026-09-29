import type { GameState } from '@domain/models';
import { devError } from '@platform/logger';
import { migrateSave } from './migrate';
import { gameStateSchema } from './schema';

const SAVE_KEY = 'quayvenho:save';
const BACKUP_KEY = 'quayvenho:save:backup';

export type LoadSaveReason = 'EMPTY' | 'CORRUPTED' | 'FUTURE_VERSION';
export type LoadSaveResult = { ok: true; value: GameState } | { ok: false; reason: LoadSaveReason };

const parseAndValidate = (json: string): LoadSaveResult => {
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
  return { ok: true, value: parsed.data as GameState };
};

const readKey = (key: string): LoadSaveResult => {
  const json = localStorage.getItem(key);
  if (json === null) {
    return { ok: false, reason: 'EMPTY' };
  }
  return parseAndValidate(json);
};

/** Đọc save chính; JSON hỏng hoặc không hợp lệ thì rơi về bản sao lưu gần nhất. */
export const loadSave = (): LoadSaveResult => {
  const primary = readKey(SAVE_KEY);
  if (primary.ok || primary.reason === 'FUTURE_VERSION') {
    return primary;
  }
  return readKey(BACKUP_KEY);
};

/** Ghi save mới; bản cũ (nếu có) được giữ lại làm backup trước khi ghi đè. */
export const writeSave = (state: GameState): void => {
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
