import { resolveWeather, rollDayEvent } from '../events';
import type { DayEvent, Flight, Order, WeatherOutcome } from '../models';

export const makeFlight = (patch: Partial<Flight> = {}): Flight => ({
  id: 'QV201',
  routeId: 'HAN-DAD',
  departAt: 1290,
  status: 'SCHEDULED',
  takenByOthers: [],
  ...patch,
});

export const makeOrder = (patch: Partial<Order> = {}): Order => ({
  customerId: 'c1',
  spriteId: 'c01',
  routeId: 'HAN-DAD',
  cabin: 'ECONOMY',
  baggageKg: 0,
  seatPref: 'ANY',
  timePref: 'ANY',
  extras: [],
  passport: { name: 'Lê Văn An', bookedName: 'Lê Văn An', expiresDay: 10 },
  complexity: 0,
  patienceMaxMs: 60000,
  ...patch,
});

/** First seed whose day-1 event has the given type (starting routes). */
export const seedWithDay1Event = (type: DayEvent['type']): number => {
  for (let seed = 1; ; seed++) if (rollDayEvent(seed, 1, ['HAN-SGN', 'HAN-DAD']).type === type) return seed;
};

/** First seed whose day-1 event is WEATHER and resolves to the given outcome. */
export const seedWithWeatherOutcome = (outcome: WeatherOutcome): number => {
  for (let seed = 1; ; seed++) {
    if (rollDayEvent(seed, 1, ['HAN-SGN', 'HAN-DAD']).type === 'WEATHER' && resolveWeather(seed, 1) === outcome) return seed;
  }
};
