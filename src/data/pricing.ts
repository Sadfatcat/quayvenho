/** Điều chỉnh giá vé (người chơi chỉnh theo từng tuyến, đơn vị: % so với giá gốc). */
export const PRICE_MIN_PCT = -30;
export const PRICE_MAX_PCT = 40;
/** Quá mốc này là "vượt trần": khách giảm một nửa và một phần vé bị huỷ. */
export const PRICE_CAP_PCT = 20;
export const PRICE_STEP_PCT = 5;
/** Chỉnh giá vé mở từ ngày này (ngày 1: mở ngay từ đầu). */
export const PRICING_UNLOCK_DAY = 1;

/** Giá vé gốc tăng theo bậc (mỗi `FARE_RISE_EVERY_DAYS` ngày một bậc): giá bán nhanh hơn giá vốn ghế để lãi hằng ngày tăng dần. */
export const FARE_RISE_EVERY_DAYS = 3;
export const FARE_RISE_PER_STEP = 0.1;
export const COST_RISE_PER_STEP = 0.1;

/** Mỗi +1% giá làm số khách tuyến đó giảm `slope`%; ngày lễ khách ít nhạy giá hơn. */
export const PRICE_ELASTICITY_NORMAL = 1.5;
export const PRICE_ELASTICITY_HOLIDAY = 0.5;
export const PRICE_DEMAND_MIN = 0.1;
export const PRICE_DEMAND_MAX = 1.6;

export const OVER_CAP_DEMAND_MULT = 0.5;
/** Tỉ lệ vé bán vượt trần bị huỷ lúc tổng kết (hoàn tiền, ghế vẫn mất). */
export const OVER_CAP_CANCEL_RATE = 0.35;

/** Tuyến "nhu cầu cao" trong ngày lễ được ưu tiên gấp mấy lần khi chọn tuyến cho khách. */
export const HOLIDAY_HOT_ROUTE_WEIGHT = 3;
export const HOLIDAY_HOT_ROUTE_COUNT = 2;
