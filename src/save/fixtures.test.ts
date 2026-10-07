import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, SEAT_VALID_DAYS } from '@data/balance';
import type { GameState } from '@domain/models';
import { exportSaveCode, importSaveCode } from './exportImport';
import { parseSaveJson } from './storage';

/** Save thật do bản v4 ghi ra (tạo bằng bot chơi nhiều ngày), dùng làm "mẫu vàng": bản mới phải đọc được mà không mất dữ liệu. */
const V4_FIXTURES = ['v4-day1-new', 'v4-day13-prep', 'v4-day8-prep-with-seats', 'v4-day21-shop-staff'] as const;

/** Các trường người chơi quan tâm nhất: mất hay đổi một trong số này là mất tiến trình. */
const PRESERVED_FIELDS = [
  'seed',
  'day',
  'money',
  'phase',
  'profile',
  'upgrades',
  'unlockedRoutes',
  'routeUnlockedDay',
  'staff',
  'staffSerial',
  'wageRaise',
  'profitHistory',
  'starHistory',
  'flags',
  'settings',
] as const;

const FIXTURE_FILES = import.meta.glob<string>('./__fixtures__/*.json', { query: '?raw', import: 'default', eager: true });

const readFixture = (name: string): string => {
  const text = FIXTURE_FILES[`./__fixtures__/${name}.json`];
  if (text === undefined) throw new Error(`thiếu fixture ${name}`);
  return text;
};

const loadFixture = (name: string): { raw: Record<string, unknown>; state: GameState } => {
  const result = parseSaveJson(readFixture(name));
  if (!result.ok) throw new Error(`fixture ${name} không đọc được: ${result.reason}`);
  return { raw: JSON.parse(readFixture(name)) as Record<string, unknown>, state: result.value };
};

describe('save v4 viết bởi bản cũ', () => {
  it.each(V4_FIXTURES)('%s đọc được bằng bản mới và nâng lên đúng SAVE_VERSION', (name) => {
    const { state } = loadFixture(name);
    expect(state.version).toBe(SAVE_VERSION);
  });

  it.each(V4_FIXTURES)('%s giữ nguyên toàn bộ dữ liệu người chơi', (name) => {
    const { raw, state } = loadFixture(name);
    for (const field of PRESERVED_FIELDS) expect(state[field], field).toEqual(raw[field]);
    expect(state.lastSummary).toMatchObject(raw.lastSummary as object);
  });

  it.each(V4_FIXTURES)('%s giữ nguyên từng ghế đang có', (name) => {
    const { raw, state } = loadFixture(name);
    const rawSeats = (raw.today as { seats: object[] }).seats;
    expect(state.today.seats).toHaveLength(rawSeats.length);
    rawSeats.forEach((seat, index) => expect(state.today.seats[index]).toMatchObject(seat));
  });

  it('ghế còn bán được trong save cũ được hưởng hạn dùng 3 ngày', () => {
    const { state } = loadFixture('v4-day8-prep-with-seats');
    const available = state.today.seats.filter((seat) => seat.state === 'AVAILABLE');
    expect(available.length).toBeGreaterThan(0);
    expect(available.every((seat) => seat.expiresDay === state.day + SEAT_VALID_DAYS - 1)).toBe(true);
  });

  it.each(V4_FIXTURES)('%s xuất rồi nhập mã save vẫn nguyên vẹn', (name) => {
    const { state } = loadFixture(name);
    expect(importSaveCode(exportSaveCode(state))).toEqual({ ok: true, value: state });
  });
});
