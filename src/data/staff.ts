import type { AbsenceReason, StaffJob, StaffKindDef } from '@domain/models';

/** Tối đa bao nhiêu nhân viên quầy (thực tập sinh, junior, middle, senior) cùng lúc; marketing không tính. */
export const STAFF_CAP = 2;

/**
 * Mỗi bậc phụ trách những việc riêng (không cộng dồn). Người chơi luôn tự in và giao vé.
 * Tiền thuê/lương tính theo "k" (nghìn đồng). Junior/Middle/Senior thuê đắt để người chơi nghĩ tới nuôi thực tập sinh.
 */
export const STAFF_KINDS: readonly StaffKindDef[] = [
  { kind: 'INTERN', hireCost: 0, baseWage: 300, jobs: [], minDay: 3, countsTowardCap: true },
  { kind: 'JUNIOR', hireCost: 30_000, baseWage: 1500, jobs: ['CABIN'], minDay: 3, countsTowardCap: true },
  { kind: 'MIDDLE', hireCost: 40_000, baseWage: 2000, jobs: ['STAMPS', 'BAGGAGE'], minDay: 10, countsTowardCap: true },
  { kind: 'SENIOR', hireCost: 50_000, baseWage: 2300, jobs: ['SEAT', 'SERVICES'], minDay: 15, countsTowardCap: true },
  { kind: 'MARKETING', hireCost: 20_000, baseWage: 1000, jobs: [], minDay: 8, countsTowardCap: false },
];

/** Thời gian (ms) để nhân viên làm xong từng việc trên vé của một khách. */
export const STAFF_JOB_DELAY_MS: Record<StaffJob, number> = {
  CABIN: 2000,
  STAMPS: 3000,
  BAGGAGE: 3000,
  SEAT: 2500,
  SERVICES: 2000,
};

/** Cân hành lý của Middle sai theo xác suất này (%). */
export const BAGGAGE_ERROR_PCT = 40;

/** Thực tập sinh đi làm đủ số ngày này thì tự lên Junior với lương bằng tỉ lệ này của lương Junior. */
export const INTERN_PROMOTE_AFTER_DAYS = 30;
export const PROMOTED_WAGE_RATIO = 0.6;

/** Cứ mỗi `WAGE_RAISE_EVERY_DAYS` ngày, lương mỗi người tăng thêm `WAGE_RAISE_PROFIT_SHARE` × phần lợi nhuận/ngày vừa tăng thêm. */
export const WAGE_RAISE_EVERY_DAYS = 3;
/** Phần tăng lương được chia đều cho tối đa 3 người (2 nhân viên quầy + marketing) để tổng quỹ lương chỉ tăng 40% lợi nhuận tăng thêm. */
export const WAGE_RAISE_SPLIT = 3;
export const WAGE_RAISE_PROFIT_SHARE = 0.4;

export const ABSENCES: readonly { reason: AbsenceReason; chancePct: number; days: number }[] = [
  { reason: 'SICK', chancePct: 4, days: 1 },
  { reason: 'FAMILY', chancePct: 3, days: 1 },
  { reason: 'MATERNITY', chancePct: 0.5, days: 5 },
];

/** Marketing: tăng khách `bonusPct`%; "dạy việc" tăng thêm `stepPct` mỗi lần với chi phí tăng dần. */
export const MARKETING = { startBonusPct: 10, maxBonusPct: 20, stepPct: 0.5, firstTeachCost: 2000, teachCostStep: 300 } as const;
