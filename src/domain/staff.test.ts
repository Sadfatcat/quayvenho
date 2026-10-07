import { describe, expect, it } from 'vitest';
import { makeFlight, makeOrder } from './__integration__/fixtures';
import type { OwnedSeat, StaffKind, StaffMember } from './models';
import { createRng } from './rng';
import { matchesSeatPref } from './seatMap';
import {
  buildAssistQueues,
  checkHire,
  checkTeachMarketing,
  dailyWages,
  marketingFactor,
  marketingTeachCost,
  newMember,
  pickStaffFlight,
  pickStaffSeat,
  promoteStaff,
  pushProfit,
  rollAbsences,
  staffBaggageKg,
  wageOf,
  wageRaiseIncrement,
} from './staff';

const member = (kind: StaffKind, patch: Partial<StaffMember> = {}): StaffMember => ({ ...newMember(kind, 0, 1), ...patch });

const unit = (seat: `${number}${'A' | 'B' | 'C' | 'D'}`, patch: Partial<OwnedSeat> = {}): OwnedSeat => ({
  flightId: 'QV201',
  seat,
  cabin: 'ECONOMY',
  unitCost: 730,
  expiresDay: 1,
  state: 'AVAILABLE',
  ...patch,
});

describe('checkHire', () => {
  const rich = { day: 20, money: 1_000_000 };

  it('charges a fixed hire price that never grows with the day (Junior 10tr, Middle 12tr, Senior 15tr)', () => {
    for (const [kind, price] of [['JUNIOR', 10_000], ['MIDDLE', 12_000], ['SENIOR', 15_000]] as const) {
      for (const day of [15, 60, 400]) {
        const result = checkHire(kind, [], { day, money: 1_000_000 });
        expect(result.ok && result.value.hireCost).toBe(price);
      }
    }
  });

  it('rejects hires before the minimum day or without enough money', () => {
    expect(checkHire('SENIOR', [], { day: 14, money: 1_000_000 })).toEqual({ ok: false, reason: 'DAY_TOO_EARLY' });
    expect(checkHire('JUNIOR', [], { day: 20, money: 9_999 })).toEqual({ ok: false, reason: 'NOT_ENOUGH_MONEY' });
    expect(checkHire('INTERN', [], { day: 2, money: 0 })).toEqual({ ok: false, reason: 'DAY_TOO_EARLY' });
  });

  it('lets an intern be hired for free from day 3', () => {
    expect(checkHire('INTERN', [], { day: 3, money: 0 })).toMatchObject({ ok: true });
  });

  it('caps counter staff at 2 but marketing sits outside the cap and only one can be hired', () => {
    const two = [member('INTERN'), member('JUNIOR')];
    expect(checkHire('MIDDLE', two, rich)).toEqual({ ok: false, reason: 'STAFF_FULL' });
    expect(checkHire('MARKETING', two, rich)).toMatchObject({ ok: true });
    expect(checkHire('MARKETING', [...two, member('MARKETING')], rich)).toEqual({ ok: false, reason: 'ALREADY_HIRED' });
  });

  it('allows several staff of the same rank (interns need to be hired repeatedly)', () => {
    expect(checkHire('INTERN', [member('INTERN')], rich)).toMatchObject({ ok: true });
  });
});

describe('wages', () => {
  it('adds the profit-based raise to every member and discounts promoted interns to 60% of the junior wage', () => {
    expect(wageOf(member('JUNIOR'), 0)).toBe(1500);
    expect(wageOf(member('MIDDLE'), 120)).toBe(2120);
    expect(wageOf(member('JUNIOR', { promoted: true }), 0)).toBe(900);
    expect(wageOf(member('MIDDLE', { promoted: true }), 0)).toBe(1200);
    expect(wageOf(member('INTERN'), 50)).toBe(350);
  });

  it('pays only members who are at work that day', () => {
    const staff = [member('JUNIOR'), member('MIDDLE', { absentUntilDay: 5, absenceReason: 'SICK' })];
    expect(dailyWages(staff, 5, 0)).toBe(1500);
    expect(dailyWages(staff, 6, 0)).toBe(3500);
  });
});

describe('marketing', () => {
  it('teaching costs rise by 300k each time starting from 2.000k', () => {
    expect(marketingTeachCost(10)).toBe(2000);
    expect(marketingTeachCost(10.5)).toBe(2300);
    expect(marketingTeachCost(19.5)).toBe(2000 + 300 * 19);
  });

  it('rejects teaching without marketing, at the cap or without money', () => {
    expect(checkTeachMarketing([], 99999)).toEqual({ ok: false, reason: 'NO_MARKETING' });
    expect(checkTeachMarketing([member('MARKETING', { bonusPct: 20 })], 99999)).toEqual({ ok: false, reason: 'MAX_BONUS' });
    expect(checkTeachMarketing([member('MARKETING')], 1999)).toEqual({ ok: false, reason: 'NOT_ENOUGH_MONEY' });
    expect(checkTeachMarketing([member('MARKETING')], 2000)).toMatchObject({ ok: true, value: { cost: 2000 } });
  });

  it('gives the customer factor only while the marketer is at work', () => {
    const marketer = member('MARKETING', { bonusPct: 12.5, absentUntilDay: 4, absenceReason: 'FAMILY' });
    expect(marketingFactor([marketer], 4)).toBe(1);
    expect(marketingFactor([marketer], 5)).toBeCloseTo(1.125);
    expect(marketingFactor([], 5)).toBe(1);
  });
});

describe('buildAssistQueues', () => {
  it('gives each rank only its own jobs and skips interns and absent staff', () => {
    const staff = [member('JUNIOR'), member('MIDDLE'), member('SENIOR'), member('INTERN'), member('MARKETING')];
    const queues = buildAssistQueues(staff, 20);
    expect(queues.map((queue) => [queue.kind, queue.steps.map((step) => step.job)])).toEqual([
      ['JUNIOR', ['CABIN']],
      ['MIDDLE', ['CABIN', 'STAMPS', 'BAGGAGE']],
      ['SENIOR', ['PASSPORT', 'SERVICES', 'SEAT']],
    ]);
    expect(buildAssistQueues([member('JUNIOR', { absentUntilDay: 20, absenceReason: 'SICK' })], 20)).toEqual([]);
  });
});

describe('staff job helpers', () => {
  const flights = [makeFlight({ id: 'QV203', departAt: 1410 }), makeFlight({ id: 'QV201', departAt: 1290 })];

  it('picks the earliest flight that matches route, time window and has stock in the cabin', () => {
    const seats = [unit('3A', { flightId: 'QV203' }), unit('3A')];
    expect(pickStaffFlight(makeOrder(), flights, seats)?.id).toBe('QV201');
    expect(pickStaffFlight(makeOrder(), flights, [unit('3A', { flightId: 'QV203' })])?.id).toBe('QV203');
    expect(pickStaffFlight(makeOrder({ cabin: 'BUSINESS' }), flights, seats)).toBeUndefined();
    expect(pickStaffFlight(makeOrder({ routeId: 'HAN-SGN' }), flights, seats)).toBeUndefined();
    expect(pickStaffFlight(makeOrder({ timePref: 'LATE' }), flights, seats)).toBeUndefined();
  });

  it('picks a seat matching the position request and skips seats taken by others or sold', () => {
    const flight = makeFlight({ takenByOthers: ['3A', '3D'] });
    const seat = pickStaffSeat(makeOrder({ seatPref: 'WINDOW' }), flight, 'ECONOMY', [unit('4A', { state: 'SOLD' })]);
    expect(seat).toBe('4D');
    const back = pickStaffSeat(makeOrder({ seatPref: 'BACK' }), flight, 'ECONOMY', []);
    expect(back && matchesSeatPref(back, 'BACK')).toBe(true);
  });

  it('weighs baggage wrong about 40% of the time with a mark far from the request', () => {
    const order = makeOrder({ baggageKg: 20 });
    let wrong = 0;
    const trials = 2000;
    const rng = createRng(7);
    for (let i = 0; i < trials; i++) {
      const kg = staffBaggageKg(order, rng);
      if (kg !== 20) {
        wrong++;
        expect(Math.abs(kg - 20)).toBeGreaterThan(1);
      }
    }
    expect(wrong / trials).toBeGreaterThan(0.35);
    expect(wrong / trials).toBeLessThan(0.45);
  });
});

describe('end-of-day staff rules', () => {
  it('promotes an intern after 8 days of work, keeps their id and restarts the day count', () => {
    const intern = member('INTERN', { daysWorked: 8 });
    const staff = [intern, member('INTERN', { daysWorked: 7 })];
    const notices = promoteStaff(staff);
    expect(notices).toEqual([{ type: 'PROMOTED', staffId: intern.id, name: intern.name, toKind: 'JUNIOR' }]);
    expect(staff[0]).toMatchObject({ kind: 'JUNIOR', promoted: true, daysWorked: 0 });
    expect(staff[1]?.kind).toBe('INTERN');
  });

  it('climbs Junior to Middle after 10 days and Middle to Senior after 12 days, while Senior and Marketing never move', () => {
    const staff = [
      member('JUNIOR', { daysWorked: 10 }),
      member('JUNIOR', { daysWorked: 9 }),
      member('MIDDLE', { daysWorked: 12 }),
      member('MIDDLE', { daysWorked: 11 }),
      member('SENIOR', { daysWorked: 99 }),
      member('MARKETING', { daysWorked: 99 }),
    ];
    promoteStaff(staff);
    expect(staff.map((person) => person.kind)).toEqual(['MIDDLE', 'JUNIOR', 'SENIOR', 'MIDDLE', 'SENIOR', 'MARKETING']);
  });

  it('rolls absences deterministically per seed and stores the last absent day', () => {
    const outcomes = new Set<string>();
    for (let seed = 1; seed <= 4000; seed++) {
      const staff = [member('JUNIOR')];
      const first = rollAbsences(staff, seed, 9);
      const again = [member('JUNIOR')];
      expect(rollAbsences(again, seed, 9)).toEqual(first);
      const notice = first[0];
      if (notice?.type === 'ABSENT') {
        outcomes.add(notice.reason);
        expect(notice.untilDay).toBe(notice.reason === 'MATERNITY' ? 13 : 9);
      }
    }
    expect([...outcomes].sort()).toEqual(['FAMILY', 'MATERNITY', 'SICK']);
  });

  it('does not roll a new absence for someone who is already on leave', () => {
    const staff = [member('JUNIOR', { absentUntilDay: 12, absenceReason: 'MATERNITY' })];
    expect(rollAbsences(staff, 1, 10)).toEqual([]);
    expect(staff[0]?.absentUntilDay).toBe(12);
  });

  it('raises each wage by 40% of the profit growth (split across 3 people) between the last two 3-day windows, never below zero', () => {
    expect(wageRaiseIncrement([100, 100, 100])).toBe(0);
    expect(wageRaiseIncrement([100, 100, 100, 400, 400, 400])).toBe(40);
    expect(wageRaiseIncrement([500, 500, 500, 100, 100, 100])).toBe(0);
  });

  it('keeps only the latest 6 days of profit', () => {
    expect(pushProfit([1, 2, 3, 4, 5, 6], 7)).toEqual([2, 3, 4, 5, 6, 7]);
  });
});
