import { describe, expect, it } from 'vitest';
import { cabinOfSeat, isAisle, isWindow, matchesSeatPref, seatsOfCabin } from './seatMap';
import { flightCode, generateFlights } from './schedule';

describe('seatMap', () => {
  it('has 8 business and 40 economy seats', () => {
    expect(seatsOfCabin('BUSINESS')).toHaveLength(8);
    expect(seatsOfCabin('ECONOMY')).toHaveLength(40);
    expect(seatsOfCabin('BUSINESS')[0]).toBe('1A');
    expect(seatsOfCabin('ECONOMY').at(-1)).toBe('12D');
  });

  it('A/D are window, B/C aisle', () => {
    expect(isWindow('5A')).toBe(true);
    expect(isWindow('5D')).toBe(true);
    expect(isAisle('5B')).toBe(true);
    expect(isAisle('12C')).toBe(true);
    expect(matchesSeatPref('3B', 'WINDOW')).toBe(false);
    expect(matchesSeatPref('3B', 'ANY')).toBe(true);
  });

  it('rows 1–2 are business', () => {
    expect(cabinOfSeat('2D')).toBe('BUSINESS');
    expect(cabinOfSeat('10A')).toBe('ECONOMY');
  });
});

describe('schedule', () => {
  const routes = ['HAN-SGN', 'HAN-DAD', 'HAN-CXR'];

  it('3 flights per route before day 9', () => {
    const flights = generateFlights(1, 5, routes);
    expect(flights).toHaveLength(9);
    expect(flights.filter((f) => f.routeId === 'HAN-SGN').map((f) => f.departAt)).toEqual([1290, 1410, 1530]);
  });

  it('weight-3 routes get 5 flights from day 9', () => {
    const flights = generateFlights(1, 9, routes);
    expect(flights.filter((f) => f.routeId === 'HAN-SGN')).toHaveLength(5);
    expect(flights.filter((f) => f.routeId === 'HAN-CXR')).toHaveLength(3);
  });

  it('flight codes are stable', () => {
    expect(flightCode('HAN-SGN', 0)).toBe('QV101');
    expect(generateFlights(1, 3, routes).map((f) => f.id)).toEqual(generateFlights(99, 7, routes).map((f) => f.id));
  });

  it('other agents take 40–70% of each cabin, deterministic per seed/day', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const flight of generateFlights(seed, 3, routes)) {
        const biz = flight.takenByOthers.filter((s) => cabinOfSeat(s) === 'BUSINESS').length;
        const eco = flight.takenByOthers.filter((s) => cabinOfSeat(s) === 'ECONOMY').length;
        expect(biz).toBeGreaterThanOrEqual(4);
        expect(biz).toBeLessThanOrEqual(5);
        expect(eco).toBeGreaterThanOrEqual(16);
        expect(eco).toBeLessThanOrEqual(28);
        expect(new Set(flight.takenByOthers).size).toBe(flight.takenByOthers.length);
      }
    }
    expect(generateFlights(7, 2, routes)).toEqual(generateFlights(7, 2, routes));
  });
});
