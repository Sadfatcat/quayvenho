import { describe, expect, it } from 'vitest';
import { makeFlight, makeOrder } from './__integration__/fixtures';
import type { OwnedSeat } from './models';
import { checkHire, dailyWages, findStaffTicket, isStaffServable, sellSeat } from './staff';
import { findStaff } from './staff';

const trainee = findStaff('TRAINEE');
const veteran = findStaff('VETERAN');
if (!trainee || !veteran) throw new Error('staff data missing');

const unit = (seat: `${number}${'A' | 'B' | 'C' | 'D'}`, patch: Partial<OwnedSeat> = {}): OwnedSeat => ({ flightId: 'QV201', seat, cabin: 'ECONOMY', unitCost: 730, state: 'AVAILABLE', ...patch });

describe('checkHire', () => {
  it('rejects unknown, already hired, too early and unaffordable hires', () => {
    expect(checkHire('NOPE', [], { day: 10, money: 99999 })).toEqual({ ok: false, reason: 'UNKNOWN_STAFF' });
    expect(checkHire('TRAINEE', ['TRAINEE'], { day: 10, money: 99999 })).toEqual({ ok: false, reason: 'ALREADY_HIRED' });
    expect(checkHire('TRAINEE', [], { day: 2, money: 99999 })).toEqual({ ok: false, reason: 'DAY_TOO_EARLY' });
    expect(checkHire('TRAINEE', [], { day: 3, money: trainee.hireCost - 1 })).toEqual({ ok: false, reason: 'NOT_ENOUGH_MONEY' });
  });

  it('accepts a hire with enough money on or after the minimum day', () => {
    expect(checkHire('TRAINEE', [], { day: 3, money: trainee.hireCost })).toMatchObject({ ok: true });
  });
});

describe('isStaffServable', () => {
  it('serves plain orders but not extras, bad passports or special customers', () => {
    expect(isStaffServable(makeOrder(), 5, trainee)).toBe(true);
    expect(isStaffServable(makeOrder({ extras: ['VEG_MEAL'] }), 5, trainee)).toBe(false);
    expect(isStaffServable(makeOrder({ passport: { name: 'A', bookedName: 'B', expiresDay: 10 } }), 5, trainee)).toBe(false);
    expect(isStaffServable(makeOrder({ special: { id: 's', tipMultiplier: 1 } }), 5, trainee)).toBe(false);
  });

  it('only the veteran handles seat position requests', () => {
    const order = makeOrder({ seatPref: 'FRONT' });
    expect(isStaffServable(order, 5, trainee)).toBe(false);
    expect(isStaffServable(order, 5, veteran)).toBe(true);
  });
});

describe('findStaffTicket', () => {
  const flights = [makeFlight({ id: 'QV203', departAt: 1410 }), makeFlight({ id: 'QV201', departAt: 1290 })];

  it('picks the earliest matching flight and a seat matching the preference', () => {
    const seats = [unit('3B'), unit('3A'), unit('3A', { flightId: 'QV203' })];
    expect(findStaffTicket(makeOrder({ seatPref: 'WINDOW' }), flights, seats)).toMatchObject({ flight: { id: 'QV201' }, seat: '3A' });
  });

  it('returns nothing when no available seat fits the cabin, time or route', () => {
    const seats = [unit('3A', { state: 'HELD' }), unit('4A', { state: 'SOLD' })];
    expect(findStaffTicket(makeOrder(), flights, seats)).toBeUndefined();
    expect(findStaffTicket(makeOrder({ cabin: 'BUSINESS' }), flights, [unit('3A')])).toBeUndefined();
    expect(findStaffTicket(makeOrder({ routeId: 'HAN-SGN' }), flights, [unit('3A')])).toBeUndefined();
    expect(findStaffTicket(makeOrder({ timePref: 'LATE' }), flights, [unit('3A')])).toBeUndefined();
  });
});

describe('sellSeat and wages', () => {
  it('marks only the chosen available unit as sold', () => {
    const seats = sellSeat([unit('3A'), unit('3B')], 'QV201', '3A');
    expect(seats.map((seat) => seat.state)).toEqual(['SOLD', 'AVAILABLE']);
  });

  it('sums wages of the hired staff and ignores unknown ids', () => {
    expect(dailyWages([])).toBe(0);
    expect(dailyWages(['TRAINEE', 'VETERAN', 'NOPE'])).toBe(trainee.wagePerDay + veteran.wagePerDay);
  });
});
