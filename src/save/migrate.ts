import { SAVE_VERSION } from '@data/balance';

type RawRecord = Record<string, unknown>;

/** v1 tính tiền theo "xu"; v2 đổi sang "k" (nghìn đồng) với hệ số này. */
const V1_TO_V2_MONEY_SCALE = 15;
const DEFAULT_HOLIDAY_ID = 'NATIONAL_DAY';
/** v5: ghế còn bán được lúc nâng cấp save được hưởng hạn dùng mới (3 ngày kể từ ngày đang chơi). */
const V5_SEAT_VALID_DAYS = 3;

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

/** v2 → v3: thêm danh sách nhân viên (dạng id cũ) và lương trong tổng kết. */
function migrateV2ToV3(old: RawRecord): RawRecord {
  const today = asRecord(old.today);
  const summary = asRecord(old.lastSummary);
  return {
    ...old,
    version: 3,
    staff: [],
    lastSummary: summary ? { ...summary, staffWages: 0 } : old.lastSummary,
    today: today ? { ...today, staffTasks: [] } : old.today,
  };
}

/** Nhân viên v3 dùng id cũ (TRAINEE/VETERAN); v4 quy về Junior/Middle với dữ liệu mới. */
const V3_STAFF_TO_KIND: Record<string, string> = { TRAINEE: 'JUNIOR', VETERAN: 'MIDDLE' };
const V3_STAFF_NAMES = ['Thảo', 'Minh'];

/** v3 → v4: nhân viên thành thực thể có id/tên/ngày công, thêm lương tăng + lịch sử lợi nhuận + thông báo tổng kết; bỏ việc tự bán của nhân viên. */
function migrateV3ToV4(old: RawRecord): RawRecord {
  const today = asRecord(old.today);
  const summary = asRecord(old.lastSummary);
  const oldStaff = Array.isArray(old.staff) ? old.staff : [];
  const todayWithoutTasks: RawRecord = { ...today };
  delete todayWithoutTasks.staffTasks;
  return {
    ...old,
    version: 4,
    staff: oldStaff.map((id, index) => ({
      id: `s${index}`,
      kind: V3_STAFF_TO_KIND[String(id)] ?? 'JUNIOR',
      name: V3_STAFF_NAMES[index] ?? 'Nhân viên',
      hiredDay: 1,
      daysWorked: 0,
      promoted: false,
      absentUntilDay: null,
      absenceReason: null,
      bonusPct: 0,
    })),
    staffSerial: oldStaff.length,
    wageRaise: 0,
    profitHistory: [],
    lastSummary: summary ? { ...summary, staffNotices: [] } : old.lastSummary,
    today: today ? todayWithoutTasks : old.today,
  };
}

/** v4 → v5: ghế có hạn dùng (`expiresDay`). Ghế đã bán/hết hạn/mất chỉ giữ hạn trong ngày; ghế còn bán được được 3 ngày. */
function migrateV4ToV5(old: RawRecord): RawRecord {
  const today = asRecord(old.today);
  if (!today || !Array.isArray(today.seats)) return { ...old, version: 5 };
  const day = typeof old.day === 'number' ? old.day : 1;
  const stillUsable = (seat: RawRecord): boolean => seat.state === 'AVAILABLE' || seat.state === 'HELD';
  return {
    ...old,
    version: 5,
    today: { ...today, seats: mapRecords(today.seats, (seat) => ({ ...seat, expiresDay: stillUsable(seat) ? day + V5_SEAT_VALID_DAYS - 1 : day })) },
  };
}

/**
 * Save v0 (giả định, minh hoạ cách thêm migration thật sau này): chưa có
 * field `flags`. Chuỗi migration chạy tuần tự cho tới `SAVE_VERSION` hiện tại.
 */
const migrations: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {
  0: (old) => ({ ...old, version: 1, flags: old.flags ?? {} }),
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
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
    const nextVersion = typeof data.version === 'number' ? data.version : version + 1;
    // Một bước migration quên nâng `version` sẽ làm vòng lặp quay mãi: coi như không migrate được.
    if (nextVersion <= version) return { ok: false, reason: 'UNKNOWN_VERSION' };
    version = nextVersion;
  }

  return { ok: true, value: data };
};
