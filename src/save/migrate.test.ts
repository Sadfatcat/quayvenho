import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';

describe('migrateSave', () => {
  it('nâng save v0 (thiếu flags) lên v1', () => {
    const v0 = { seed: 1, day: 1, money: 400 };

    const result = migrateSave(v0);

    expect(result).toMatchObject({ ok: true, value: { seed: 1, day: 1, version: 2, flags: {} } });
  });

  it('giữ nguyên save đã đúng version hiện tại', () => {
    const current = { version: 2, seed: 1, day: 1 };

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
        version: 2,
        money: 6000,
        nextDayTransactions: [{ type: 'WEATHER_LOSS', amount: -150, day: 2, minute: null }],
        lastSummary: { day: 1, moneyStart: 6000, moneyEnd: 6975, ticketRevenue: 1500, penalties: 150, cancelledTickets: 0, cancelRefunds: 0 },
        today: {
          moneyStart: 6975,
          event: { type: 'RUSH', holidayId: 'NATIONAL_DAY', hotRoutes: [] },
          priceAdjustPct: {},
          transactions: [{ type: 'TICKET_REVENUE', amount: 1125, day: 2, minute: 500 }],
          seats: [{ flightId: 'F', seat: '1A', cabin: 'ECONOMY', unitCost: 750, state: 'AVAILABLE' }],
          results: [{ customerId: 'c1', revenue: 1125, tip: 0, penalty: 0, overCap: false }],
        },
      },
    });
  });

  it('từ chối save có version lớn hơn bản đang chạy', () => {
    const future = { version: 99, seed: 1 };

    const result = migrateSave(future);

    expect(result).toEqual({ ok: false, reason: 'FUTURE_VERSION' });
  });
});
