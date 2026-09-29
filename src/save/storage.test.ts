import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewGame } from '@domain/dayCycle';
import { clearSave, loadSave, writeSave } from './storage';

const SAVE_KEY = 'quayvenho:save';

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  } as Storage;
};

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage());
});

describe('storage', () => {
  it('không có save nào thì báo EMPTY', () => {
    expect(loadSave()).toEqual({ ok: false, reason: 'EMPTY' });
  });

  it('round-trip: ghi rồi đọc lại ra đúng state', () => {
    const state = createNewGame(42);

    writeSave(state);
    const result = loadSave();

    expect(result).toEqual({ ok: true, value: state, recoveredFromBackup: false });
  });

  it('JSON hỏng thì rơi về bản sao lưu gần nhất và báo recoveredFromBackup', () => {
    const good = createNewGame(1);
    writeSave(good);
    writeSave(createNewGame(2)); // đẩy `good` xuống backup

    localStorage.setItem(SAVE_KEY, '{not valid json');

    expect(loadSave()).toEqual({ ok: true, value: good, recoveredFromBackup: true });
  });

  it('version tương lai thì báo FUTURE_VERSION, không rơi về backup', () => {
    const good = createNewGame(1);
    writeSave(good);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...good, version: 999 }));

    expect(loadSave()).toEqual({ ok: false, reason: 'FUTURE_VERSION' });
  });

  it('clamp giá trị bẩn: tiền âm bị kẹp về 0', () => {
    const dirty = { ...createNewGame(1), money: -500 };
    localStorage.setItem(SAVE_KEY, JSON.stringify(dirty));

    const result = loadSave();

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.money).toBe(0);
  });

  it('clearSave xoá cả save chính lẫn backup', () => {
    writeSave(createNewGame(1));
    writeSave(createNewGame(2));

    clearSave();

    expect(loadSave()).toEqual({ ok: false, reason: 'EMPTY' });
  });
});
