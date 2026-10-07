import type { AbsenceReason, StaffJob, StaffKind, StaffKindDef } from '@domain/models';

/** Tối đa bao nhiêu nhân viên quầy (thực tập sinh, junior, middle, senior) cùng lúc; marketing không tính. */
export const STAFF_CAP = 2;

/**
 * Mỗi bậc phụ trách những việc riêng (không cộng dồn). Người chơi luôn tự in và giao vé.
 * Việc nào cũng cần vé trên bàn: ai ra tay trước mà chưa có vé thì tự lấy vé đúng hạng của khách ra bàn rồi làm tiếp.
 * Senior làm vé dịch vụ trước rồi mới chọn ghế, vì chọn ghế phải chờ có chuyến (Middle đóng dấu hoặc người chơi đóng dấu) nên không được chặn việc kia.
 * Tiền thuê/lương tính theo "k" (nghìn đồng). Junior/Middle/Senior thuê đắt để người chơi nghĩ tới nuôi thực tập sinh.
 */
export const STAFF_KINDS: readonly StaffKindDef[] = [
  { kind: 'INTERN', hireCost: 0, baseWage: 300, jobs: [], minDay: 3, countsTowardCap: true },
  { kind: 'JUNIOR', hireCost: 30_000, baseWage: 1500, jobs: ['CABIN'], minDay: 3, countsTowardCap: true },
  { kind: 'MIDDLE', hireCost: 40_000, baseWage: 2000, jobs: ['STAMPS', 'BAGGAGE'], minDay: 10, countsTowardCap: true },
  { kind: 'SENIOR', hireCost: 50_000, baseWage: 2300, jobs: ['SERVICES', 'SEAT'], minDay: 15, countsTowardCap: true },
  { kind: 'MARKETING', hireCost: 20_000, baseWage: 1000, jobs: [], minDay: 8, countsTowardCap: false },
];

/** Thời gian (ms) để nhân viên làm xong từng việc trên vé của một khách (đã giảm ~60% so với bản đầu cho nhanh tay). */
export const STAFF_JOB_DELAY_MS: Record<StaffJob, number> = {
  CABIN: 800,
  STAMPS: 1200,
  BAGGAGE: 1200,
  SEAT: 1000,
  SERVICES: 800,
};

/** Cân hành lý của Middle sai theo xác suất này (%). */
export const BAGGAGE_ERROR_PCT = 40;

/** Làm đủ `afterDays` ngày ở bậc hiện tại thì tự lên bậc `to` (số ngày tính lại từ 0 ở bậc mới); Senior và Marketing không lên nữa. */
export const STAFF_PROMOTIONS: Partial<Record<StaffKind, { afterDays: number; to: StaffKind }>> = {
  INTERN: { afterDays: 8, to: 'JUNIOR' },
  JUNIOR: { afterDays: 10, to: 'MIDDLE' },
  MIDDLE: { afterDays: 12, to: 'SENIOR' },
};
/** Người được thăng bậc lấy tỉ lệ này của lương gốc bậc mới (rẻ hơn thuê ngoài). */
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
