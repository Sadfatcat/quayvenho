import { SAVE_VERSION } from '@data/balance';

type RawRecord = Record<string, unknown>;

/** v1 tính tiền theo "xu"; v2 đổi sang "k" (nghìn đồng) với hệ số này. */
const V1_TO_V2_MONEY_SCALE = 15;
const DEFAULT_HOLIDAY_ID = 'NATIONAL_DAY';

const asRecord = (value: unknown): RawRecord | null => (typeof value === 'object' && value !== null ? (value as RawRecord) : null);
const mapRecords = (value: unknown, fn: (item: RawRecord) => RawRecord): unknown =>
  Array.isArray(value) ? value.map((item) => (asRecord(item) ? fn(item as RawRecord) : item)) : value;
const scaleFields = (item: RawRecord, fields: readonly string[]): RawRecord => {
  const copy = { ...item };
  for (const field of fields) if (typeof copy[field] === 'number') copy[field] = Math.round((copy[field] as number) * V1_TO_V2_MONEY_SCALE);
  return copy;
};

const SUMMARY_MONEY_FIELDS = ['moneyStart', 'moneyEnd', 'ticketRevenue', 'tips', 'seatCost', 'shopCost', 'expiredCost', 'refunds', 'weatherLostCost', 'penalties'];

/** v1 → v2: đổi tiền sang "k", thêm chỉnh giá vé theo tuyến, ngày lễ có tên/tuyến nóng, vé vượt trần và huỷ vé. */
function migrateV1ToV2(old: RawRecord): RawRecord {
  const today = asRecord(old.today);
  const summary = asRecord(old.lastSummary);
  const event = asRecord(today?.event);
  return {
    ...scaleFields(old, ['money']),
    version: 2,
    nextDayTransactions: mapRecords(old.nextDayTransactions, (tx) => scaleFields(tx, ['amount'])),
    lastSummary: summary ? { ...scaleFields(summary, SUMMARY_MONEY_FIELDS), cancelledTickets: 0, cancelRefunds: 0 } : old.lastSummary,
    today: today
      ? {
          ...scaleFields(today, ['moneyStart']),
          event: event?.type === 'RUSH' ? { type: 'RUSH', holidayId: DEFAULT_HOLIDAY_ID, hotRoutes: [] } : today.event,
          priceAdjustPct: {},
          transactions: mapRecords(today.transactions, (tx) => scaleFields(tx, ['amount'])),
          seats: mapRecords(today.seats, (seat) => scaleFields(seat, ['unitCost'])),
          results: mapRecords(today.results, (result) => ({ ...scaleFields(result, ['revenue', 'tip', 'penalty']), overCap: false })),
        }
      : old.today,
  };
}

/**
 * Save v0 (giả định, minh hoạ cách thêm migration thật sau này): chưa có
 * field `flags`. Chuỗi migration chạy tuần tự cho tới `SAVE_VERSION` hiện tại.
 */
const migrations: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {
  0: (old) => ({ ...old, version: 1, flags: old.flags ?? {} }),
  1: migrateV1ToV2,
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
