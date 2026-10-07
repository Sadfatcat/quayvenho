import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewGame } from '@domain/dayCycle';
import { clearSave, loadSave, writeSave } from './storage';

const SAVE_KEY = 'qvn:save';
const PRE_MIGRATION_KEY = 'qvn:save:before-v5';

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

  it('không ghi save khi đang giữa ca (OPEN/CLOSING)', () => {
    const state = createNewGame(1);
    writeSave(state);
    const midShift = { ...state, phase: 'OPEN' as const, money: 999 };
    writeSave(midShift);
    const loaded = loadSave();
    expect(loaded.ok && loaded.value.money).toBe(state.money);
  });

  it('save giữa ca đã nằm sẵn trong localStorage thì rơi về bản sao lưu hợp lệ', () => {
    const good = createNewGame(1);
    writeSave(good);
    writeSave({ ...good, money: good.money + 1 });
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...good, phase: 'OPEN' }));
    const loaded = loadSave();
    expect(loaded).toMatchObject({ ok: true, recoveredFromBackup: true });
  });

  it('clearSave xoá cả save chính lẫn backup', () => {
    writeSave(createNewGame(1));
    writeSave(createNewGame(2));

    clearSave();

    expect(loadSave()).toEqual({ ok: false, reason: 'EMPTY' });
  });

  describe('nâng cấp save cũ', () => {
    const v4Json = JSON.stringify({ ...createNewGame(7), version: 4, today: { ...createNewGame(7).today, seats: [] } });

    it('chụp một bản gốc nguyên vẹn trước khi nâng cấp, và nâng lên đúng phiên bản', () => {
      localStorage.setItem(SAVE_KEY, v4Json);

      const result = loadSave();

      expect(result).toMatchObject({ ok: true, value: { version: 5, seed: 7 } });
      expect(localStorage.getItem(PRE_MIGRATION_KEY)).toBe(v4Json);
    });

    it('không ghi đè bản gốc khi chơi tiếp và ghi save mới', () => {
      localStorage.setItem(SAVE_KEY, v4Json);
      const loaded = loadSave();
      if (!loaded.ok) throw new Error('save v4 phải đọc được');

      writeSave({ ...loaded.value, money: 999 });
      loadSave();

      expect(localStorage.getItem(PRE_MIGRATION_KEY)).toBe(v4Json);
    });

    it('vẫn giữ bản gốc khi save cũ hỏng không nâng cấp được', () => {
      const broken = JSON.stringify({ version: 4, seed: 1 });
      localStorage.setItem(SAVE_KEY, broken);

      expect(loadSave().ok).toBe(false);
      expect(localStorage.getItem(PRE_MIGRATION_KEY)).toBe(broken);
    });

    it('không chụp gì khi save đã đúng phiên bản hiện tại', () => {
      writeSave(createNewGame(7));

      loadSave();

      expect(localStorage.getItem(PRE_MIGRATION_KEY)).toBeNull();
    });
  });
});
