/** Game minutes. Shop hours 08:00–19:00. */
export const SHOP_OPEN_MINUTE = 480;
export const SHOP_CLOSE_MINUTE = 1140;

/** Customer arrivals: first at 08:06, last by 18:30. */
export const FIRST_ARRIVAL_MINUTE = 486;
export const LAST_ARRIVAL_MINUTE = 1110;
export const PEAK_WINDOWS: readonly (readonly [number, number])[] = [
  [660, 780],
  [990, 1080],
];
export const PEAK_WEIGHT = 1.5;

/** 21:30, 22:30, 23:30, 00:30, 01:30 (same business day). */
export const SLOT_DEPART_AT: readonly number[] = [1290, 1350, 1410, 1470, 1530];
export const BASE_SLOT_INDEXES: readonly number[] = [0, 2, 4];
export const FULL_SCHEDULE_FROM_DAY = 9;
export const FULL_SCHEDULE_MIN_ROUTE_WEIGHT = 3;

/** Share of each cabin already sold by other agents. */
export const OTHER_AGENT_SHARE = { min: 0.4, max: 0.7 } as const;
