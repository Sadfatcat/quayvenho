import {
  ABSENCES,
  BAGGAGE_ERROR_PCT,
  INTERN_PROMOTE_AFTER_DAYS,
  MARKETING,
  PROMOTED_WAGE_RATIO,
  STAFF_CAP,
  STAFF_JOB_DELAY_MS,
  STAFF_KINDS,
  WAGE_RAISE_PROFIT_SHARE,
} from '@data/staff';
import { STAFF_NAMES } from '@data/staffNames';
import { BAGGAGE_MARKS } from '@data/balance';
import { err, ok, type Result } from './common/result';
import { matchesTimePref } from './clock';
import type { Flight, Order, OwnedSeat, SeatId, StaffJob, StaffKind, StaffKindDef, StaffMember, StaffNotice } from './models';
import type { Rng } from './rng';
import { rngFor } from './rng';
import { matchesSeatPref, seatsOfCabin } from './seatMap';

export const kindDefOf = (kind: StaffKind): StaffKindDef | undefined => STAFF_KINDS.find((def) => def.kind === kind);

export const isAbsentOn = (member: StaffMember, day: number): boolean => member.absentUntilDay !== null && day <= member.absentUntilDay;

export const presentStaff = (staff: readonly StaffMember[], day: number): StaffMember[] => staff.filter((member) => !isAbsentOn(member, day));

const countsTowardCap = (member: StaffMember): boolean => kindDefOf(member.kind)?.countsTowardCap ?? true;

/** Lương một ngày đi làm: lương gốc (thực tập sinh đã lên bậc lấy tỉ lệ lương Junior) cộng phần tăng theo lợi nhuận. */
export const wageOf = (member: StaffMember, wageRaise: number): number => {
  const base = member.promoted ? Math.round((kindDefOf('JUNIOR')?.baseWage ?? 0) * PROMOTED_WAGE_RATIO) : (kindDefOf(member.kind)?.baseWage ?? 0);
  return base + wageRaise;
};

/** Tổng lương ngày `day`: chỉ người đi làm hôm đó mới có lương. */
export const dailyWages = (staff: readonly StaffMember[], day: number, wageRaise: number): number =>
  presentStaff(staff, day).reduce((total, member) => total + wageOf(member, wageRaise), 0);

export type HireError = 'UNKNOWN_KIND' | 'DAY_TOO_EARLY' | 'STAFF_FULL' | 'ALREADY_HIRED' | 'NOT_ENOUGH_MONEY';

export const checkHire = (kind: StaffKind, staff: readonly StaffMember[], ctx: { day: number; money: number }): Result<StaffKindDef, HireError> => {
  const def = kindDefOf(kind);
  if (!def) return err('UNKNOWN_KIND');
  if (ctx.day < def.minDay) return err('DAY_TOO_EARLY');
  if (def.countsTowardCap) {
    if (staff.filter(countsTowardCap).length >= STAFF_CAP) return err('STAFF_FULL');
  } else if (staff.some((member) => member.kind === kind)) {
    return err('ALREADY_HIRED');
  }
  if (ctx.money < def.hireCost) return err('NOT_ENOUGH_MONEY');
  return ok(def);
};

export const newMember = (kind: StaffKind, serial: number, day: number): StaffMember => ({
  id: `s${serial}`,
  kind,
  name: STAFF_NAMES[serial % STAFF_NAMES.length] ?? 'Nhân viên',
  hiredDay: day,
  daysWorked: 0,
  promoted: false,
  absentUntilDay: null,
  absenceReason: null,
  bonusPct: kind === 'MARKETING' ? MARKETING.startBonusPct : 0,
});

/** Chi phí lần "dạy việc" kế tiếp: tăng dần theo số lần đã dạy. */
export const marketingTeachCost = (bonusPct: number): number => {
  const timesTaught = Math.round((bonusPct - MARKETING.startBonusPct) / MARKETING.stepPct);
  return MARKETING.firstTeachCost + MARKETING.teachCostStep * timesTaught;
};

export type TeachError = 'NO_MARKETING' | 'MAX_BONUS' | 'NOT_ENOUGH_MONEY';

export const checkTeachMarketing = (staff: readonly StaffMember[], money: number): Result<{ member: StaffMember; cost: number }, TeachError> => {
  const member = staff.find((candidate) => candidate.kind === 'MARKETING');
  if (!member) return err('NO_MARKETING');
  if (member.bonusPct >= MARKETING.maxBonusPct) return err('MAX_BONUS');
  const cost = marketingTeachCost(member.bonusPct);
  if (money < cost) return err('NOT_ENOUGH_MONEY');
  return ok({ member, cost });
};

/** Hệ số khách do marketing mang lại hôm nay (1 = không có hoặc marketing đang nghỉ). */
export const marketingFactor = (staff: readonly StaffMember[], day: number): number => {
  const member = presentStaff(staff, day).find((candidate) => candidate.kind === 'MARKETING');
  return member ? 1 + member.bonusPct / 100 : 1;
};

// ---------- phụ việc trên vé ----------

export interface AssistStep {
  job: StaffJob;
  /** Còn bao lâu (ms) thì nhân viên làm bước này. */
  waitMs: number;
}

export interface AssistQueue {
  staffId: string;
  kind: StaffKind;
  steps: AssistStep[];
}

/** Mỗi nhân viên đi làm có một hàng việc theo thứ tự; việc sau chỉ bắt đầu đếm giờ khi việc trước xong. */
export const buildAssistQueues = (staff: readonly StaffMember[], day: number): AssistQueue[] =>
  presentStaff(staff, day)
    .map((member) => ({
      staffId: member.id,
      kind: member.kind,
      steps: (kindDefOf(member.kind)?.jobs ?? []).map((job) => ({ job, waitMs: STAFF_JOB_DELAY_MS[job] })),
    }))
    .filter((queue) => queue.steps.length > 0);

/** Chuyến sớm nhất khớp tuyến + khung giờ khách muốn và còn ghế đúng hạng. */
export const pickStaffFlight = (order: Order, flights: readonly Flight[], seats: readonly OwnedSeat[]): Flight | undefined =>
  flights
    .filter((flight) => flight.status === 'SCHEDULED' && flight.routeId === order.routeId && matchesTimePref(flight.departAt, order.timePref))
    .sort((a, b) => a.departAt - b.departAt)
    .find((flight) => seats.some((seat) => seat.flightId === flight.id && seat.cabin === order.cabin && seat.state === 'AVAILABLE'));

/** Ghế đầu tiên khớp yêu cầu vị trí, chưa bị đại lý khác hay vé khác lấy. */
export const pickStaffSeat = (order: Order, flight: Flight, cabin: Order['cabin'], seats: readonly OwnedSeat[]): SeatId | undefined => {
  const unavailable = new Set<SeatId>(flight.takenByOthers);
  for (const unit of seats) {
    if (unit.flightId === flight.id && (unit.state === 'SOLD' || unit.state === 'EXPIRED' || unit.state === 'LOST')) unavailable.add(unit.seat);
  }
  return seatsOfCabin(cabin).find((seat) => !unavailable.has(seat) && matchesSeatPref(seat, order.seatPref));
};

/** Cân hành lý của Middle: đúng số khách yêu cầu, nhưng sai theo `BAGGAGE_ERROR_PCT` (một mốc cân khác hẳn). */
export const staffBaggageKg = (order: Order, rng: Rng): number => {
  if (!rng.chance(BAGGAGE_ERROR_PCT / 100)) return order.baggageKg;
  return BAGGAGE_MARKS.find((mark) => mark !== order.baggageKg) ?? order.baggageKg;
};

// ---------- cuối ngày: thăng bậc, nghỉ, lương ----------

/** Thực tập sinh đủ ngày đi làm thì lên Junior (giữ id, nhận việc Junior, lương theo tỉ lệ). Trả thông báo. */
export const promoteInterns = (staff: StaffMember[]): StaffNotice[] => {
  const notices: StaffNotice[] = [];
  for (const member of staff) {
    if (member.kind !== 'INTERN' || member.daysWorked < INTERN_PROMOTE_AFTER_DAYS) continue;
    member.kind = 'JUNIOR';
    member.promoted = true;
    notices.push({ type: 'PROMOTED', staffId: member.id, name: member.name });
  }
  return notices;
};

/** Tung nghỉ cho ngày mai (`nextDay`) với từng người đang đi làm. Seed ổn định theo ngày và id. */
export const rollAbsences = (staff: StaffMember[], seed: number, nextDay: number): StaffNotice[] => {
  const notices: StaffNotice[] = [];
  for (const member of staff) {
    if (isAbsentOn(member, nextDay)) continue;
    const roll = rngFor(seed, nextDay, `absence:${member.id}`).next() * 100;
    let threshold = 0;
    for (const absence of ABSENCES) {
      threshold += absence.chancePct;
      if (roll >= threshold) continue;
      member.absentUntilDay = nextDay + absence.days - 1;
      member.absenceReason = absence.reason;
      notices.push({ type: 'ABSENT', staffId: member.id, name: member.name, kind: member.kind, reason: absence.reason, untilDay: member.absentUntilDay });
      break;
    }
  }
  return notices;
};

/** Xoá trạng thái nghỉ đã qua để dữ liệu gọn. */
export const clearFinishedAbsences = (staff: StaffMember[], day: number): void => {
  for (const member of staff) {
    if (member.absentUntilDay !== null && member.absentUntilDay < day) {
      member.absentUntilDay = null;
      member.absenceReason = null;
    }
  }
};

const WAGE_WINDOW_DAYS = 3;
const average = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0) / values.length;

/** Lợi nhuận/ngày trung bình 3 ngày gần nhất so với 3 ngày trước đó; chỉ phần tăng thêm mới làm lương tăng. */
export const wageRaiseIncrement = (profitHistory: readonly number[]): number => {
  if (profitHistory.length < WAGE_WINDOW_DAYS * 2) return 0;
  const recent = average(profitHistory.slice(-WAGE_WINDOW_DAYS));
  const previous = average(profitHistory.slice(-WAGE_WINDOW_DAYS * 2, -WAGE_WINDOW_DAYS));
  return Math.max(0, Math.round(WAGE_RAISE_PROFIT_SHARE * (recent - previous)));
};

/** Giữ 6 ngày lợi nhuận gần nhất. */
export const pushProfit = (history: readonly number[], profit: number): number[] => [...history, profit].slice(-WAGE_WINDOW_DAYS * 2);

