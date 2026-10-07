import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';

describe('migrateSave', () => {
  it('nâng save v0 (thiếu flags) lên v1', () => {
    const v0 = { seed: 1, day: 1, money: 400 };

    const result = migrateSave(v0);

    expect(result).toMatchObject({ ok: true, value: { seed: 1, day: 1, version: 5, flags: {} } });
  });

  it('giữ nguyên save đã đúng version hiện tại', () => {
    const current = { version: 5, seed: 1, day: 1 };

    const result = migrateSave(current);

    expect(result).toEqual({ ok: true, value: current });
  });

  it('nâng save v1 lên v2: đổi tiền sang k (×15), thêm chỉnh giá, tên ngày lễ và các trường huỷ vé', () => {
    const v1 = {
      version: 1,
      money: 400,
      nextDayTransactions: [{ type: 'WEATHER_LOSS', amount: -10, day: 2, minute: null }],
      lastSummary: { day: 1, moneyStart: 400, moneyEnd: 465, ticketRevenue: 100, penalties: 10 },
      today: {
        moneyStart: 465,
        event: { type: 'RUSH' },
        transactions: [{ type: 'TICKET_REVENUE', amount: 75, day: 2, minute: 500 }],
        seats: [{ flightId: 'F', seat: '1A', cabin: 'ECONOMY', unitCost: 50, state: 'AVAILABLE' }],
        results: [{ customerId: 'c1', revenue: 75, tip: 0, penalty: 0 }],
      },
    };

    const result = migrateSave(v1);

    expect(result).toEqual({
      ok: true,
      value: {
        version: 5,
        staff: [],
        staffSerial: 0,
        wageRaise: 0,
        profitHistory: [],
        money: 6000,
        nextDayTransactions: [{ type: 'WEATHER_LOSS', amount: -150, day: 2, minute: null }],
        lastSummary: { day: 1, moneyStart: 6000, moneyEnd: 6975, ticketRevenue: 1500, penalties: 150, cancelledTickets: 0, cancelRefunds: 0, staffWages: 0, staffNotices: [] },
        today: {
          moneyStart: 6975,
          event: { type: 'RUSH', holidayId: 'NATIONAL_DAY', hotRoutes: [] },
          priceAdjustPct: {},
          transactions: [{ type: 'TICKET_REVENUE', amount: 1125, day: 2, minute: 500 }],
          seats: [{ flightId: 'F', seat: '1A', cabin: 'ECONOMY', unitCost: 750, expiresDay: 3, state: 'AVAILABLE' }],
          results: [{ customerId: 'c1', revenue: 1125, tip: 0, penalty: 0, overCap: false }],
        },
      },
    });
  });

  it('nâng save v2 lên mới nhất: thêm nhân viên, lương tăng, lịch sử lợi nhuận và thông báo tổng kết', () => {
    const v2 = { version: 2, lastSummary: { day: 1 }, today: { clock: 480 } };

    const result = migrateSave(v2);

    expect(result).toEqual({
      ok: true,
      value: {
        version: 5,
        staff: [],
        staffSerial: 0,
        wageRaise: 0,
        profitHistory: [],
        lastSummary: { day: 1, staffWages: 0, staffNotices: [] },
        today: { clock: 480 },
      },
    });
  });

  it('nâng save v3 lên mới nhất: nhân viên cũ thành thực thể Junior/Middle, bỏ việc tự bán', () => {
    const v3 = { version: 3, staff: ['TRAINEE', 'VETERAN'], lastSummary: { day: 5, staffWages: 600 }, today: { clock: 480, staffTasks: [] } };

    const result = migrateSave(v3);

    expect(result).toMatchObject({
      ok: true,
      value: {
        version: 5,
        staffSerial: 2,
        wageRaise: 0,
        profitHistory: [],
        lastSummary: { day: 5, staffWages: 600, staffNotices: [] },
        today: { clock: 480 },
        staff: [
          { id: 's0', kind: 'JUNIOR', promoted: false, daysWorked: 0, absentUntilDay: null },
          { id: 's1', kind: 'MIDDLE', promoted: false, daysWorked: 0, absentUntilDay: null },
        ],
      },
    });
    expect((result as unknown as { value: { today: Record<string, unknown> } }).value.today).not.toHaveProperty('staffTasks');
  });

  it('nâng save v4 lên v5: ghế còn bán được có hạn 3 ngày, ghế đã dùng giữ hạn trong ngày, không đổi gì khác', () => {
    const seat = (state: string, extra = {}) => ({ flightId: 'QV101', seat: '1A', cabin: 'ECONOMY', unitCost: 700, state, ...extra });
    const v4 = {
      version: 4,
      day: 8,
      money: 12345,
      upgrades: ['FAN'],
      today: { clock: 480, seats: [seat('AVAILABLE'), seat('HELD'), seat('SOLD'), seat('EXPIRED'), seat('LOST')] },
    };

    const result = migrateSave(v4);

    expect(result).toEqual({
      ok: true,
      value: {
        version: 5,
        day: 8,
        money: 12345,
        upgrades: ['FAN'],
        today: {
          clock: 480,
          seats: [seat('AVAILABLE', { expiresDay: 10 }), seat('HELD', { expiresDay: 10 }), seat('SOLD', { expiresDay: 8 }), seat('EXPIRED', { expiresDay: 8 }), seat('LOST', { expiresDay: 8 })],
        },
      },
    });
  });

  it('nâng save v4 không có ghế lên v5 mà không thêm trường thừa', () => {
    const result = migrateSave({ version: 4, day: 1, today: { clock: 480 } });

    expect(result).toEqual({ ok: true, value: { version: 5, day: 1, today: { clock: 480 } } });
  });

  it('từ chối save có version lớn hơn bản đang chạy', () => {
    const future = { version: 99, seed: 1 };

    const result = migrateSave(future);

    expect(result).toEqual({ ok: false, reason: 'FUTURE_VERSION' });
  });
});
