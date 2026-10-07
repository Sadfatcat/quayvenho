export const BASE_CUSTOMERS_DAY_1 = 5;
export const EARLY_GROWTH = { untilDay: 10, min: 1, max: 3 } as const;
/** Hệ số khách cho những ngày đầu (trước khi mở TravelViet), để game đỡ vắng lúc mới chơi. */
export const EARLY_DAYS_CUSTOMER_MULT = 1.5;
export const LATE_GROWTH = { min: 1, max: 2 } as const;

export const TRAVELVIET_FROM_DAY = 11;
/** TravelViet (hệ số, thưởng sao) và việc bỏ hệ số khách đầu game được trộn dần trong chừng này ngày để không có cú nhảy ở ngày 11. */
export const TRAVELVIET_RAMP_DAYS = 10;
/** Số sao lưu trong save (giữ 200 để save cũ vẫn hợp lệ). */
export const TRAVELVIET_WINDOW = 200;
/** Điểm TravelViet chỉ tính trên chừng này sao gần nhất: cửa sổ ngắn nên điểm dao động quanh mức thật của người chơi. */
export const TRAVELVIET_SCORE_WINDOW = 60;
export const TRAVELVIET_DEFAULT = 4.0;

/** Rating in tenths (R × 10), upper bound inclusive → demand factor. */
export const DEMAND_FACTORS: readonly { maxTenths: number; factor: number }[] = [
  { maxTenths: 29, factor: 0.3 },
  { maxTenths: 35, factor: 0.45 },
  { maxTenths: 50, factor: 1 },
];

/** Bonus starts above 4.4; each 0.1 step adds a random amount from its tier. */
export const BONUS_FROM_TENTHS = 45;
export const BONUS_TIERS: readonly { steps: number; min: number; max: number }[] = [
  { steps: 3, min: 4, max: 6 },
  { steps: 3, min: 10, max: 15 },
];

export const MIN_CUSTOMERS = 2;
export const MAX_CUSTOMERS = 300;
