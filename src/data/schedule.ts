/** Game minutes. Shop hours 18:00–21:00 (bán buổi tối, trước chuyến bay đầu tiên 21:30). */
export const SHOP_OPEN_MINUTE = 1080;
export const SHOP_CLOSE_MINUTE = 1260;

/** Customer arrivals: first at 18:06, last by 20:30. */
export const FIRST_ARRIVAL_MINUTE = 1086;
export const LAST_ARRIVAL_MINUTE = 1230;
export const PEAK_WINDOWS: readonly (readonly [number, number])[] = [
  [1130, 1160],
  [1220, 1245],
];
export const PEAK_WEIGHT = 1.5;

/** 21:30, 22:30, 23:30, 00:30, 01:30 (same business day). */
export const SLOT_DEPART_AT: readonly number[] = [1290, 1350, 1410, 1470, 1530];
export const BASE_SLOT_INDEXES: readonly number[] = [0, 2, 4];
export const FULL_SCHEDULE_FROM_DAY = 9;
export const FULL_SCHEDULE_MIN_ROUTE_WEIGHT = 3;

/** Share of each cabin already sold by other agents. */
export const OTHER_AGENT_SHARE = { min: 0.4, max: 0.7 } as const;
