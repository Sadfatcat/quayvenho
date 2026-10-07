import type { BaggageKg, CabinClass, Extra, Modifiers, ScoreOutcome, SeatBias, Settings, Stars } from '@domain/models';

export const SAVE_VERSION = 5;
export const STARTING_MONEY = 6000;
/** Ghế mua ngày D dùng được tới hết ngày D + (số này − 1). */
export const SEAT_VALID_DAYS = 3;

export const PROFILE_LIMITS = { playerName: 16, brandName: 20 } as const;
export const DEFAULT_SETTINGS: Settings = { musicVolume: 0.7, sfxVolume: 0.8, haptics: true };

// Kho
/** Biên lợi nhuận trên giá bán gốc của mỗi vé (giá vốn = giá × (1 − biên)): nội địa 15%, quốc tế 25–30%. */
export const SEAT_MARGIN_BY_ROUTE: Readonly<Record<string, number>> = {
  'HAN-SGN': 0.12,
  'HAN-DAD': 0.12,
  'HAN-CXR': 0.12,
  'HAN-PQC': 0.12,
  'HAN-DLI': 0.12,
  'HAN-BKK': 0.22,
  'HAN-ICN': 0.24,
  'HAN-NRT': 0.25,
  'HAN-CDG': 0.27,
};
export const PURCHASE_LIMIT_PER_FLIGHT: Record<CabinClass, number> = { ECONOMY: 12, BUSINESS: 4 };
/** Checked in order; first match wins. */
export const BULK_DISCOUNT_TIERS: readonly { minQty: number; rate: number }[] = [
  { minQty: 10, rate: 0.1 },
  { minQty: 5, rate: 0.05 },
];
/** Chế độ cân bằng: 30% số ghế nhập là ghế cửa sổ, 70% là ghế lối đi (vị trí cụ thể ngẫu nhiên). */
export const BALANCED_WINDOW_SHARE = 0.3;

/** Hệ số giá vốn theo thiên hướng ghế: chọn cửa sổ chắc chắn nhận ghế cửa sổ (đắt hơn ~10% so với lối đi), cân bằng là ngẫu nhiên giá gốc. */
export const SEAT_BIAS_COST_MULT: Readonly<Record<SeatBias, number>> = { BALANCED: 1, WINDOW: 1.05, AISLE: 0.95 };

// Doanh thu
export const BAGGAGE_FEES: Record<BaggageKg, number> = { 0: 0, 15: 300, 20: 380, 30: 530 };
export const EXTRA_FEES: Record<Extra, number> = { VEG_MEAL: 80, WHEELCHAIR: 0, INSURANCE: 230 };
export const BUSINESS_TIP_RATIO = 0.2;

// Chấm điểm (accuracy tính bằng điểm phần trăm để tránh sai số số thực)
export const ACCURACY_DEDUCTIONS = {
  WRONG_BAGGAGE: 30,
  WRONG_SEAT_PREF: 20,
  MISSING_EXTRA: 15,
  EXTRA_NOT_REQUESTED: 5,
} as const;
export const BUSINESS_DEDUCTION_MULT = 2;
export const ACCURACY_GOOD = 70;
export const ACCURACY_OK = 50;
export const PERFECT_MIN_SPEED = 0.7;
export const BAGGAGE_TOLERANCE_KG = 1;
export const BAGGAGE_MARKS: readonly BaggageKg[] = [15, 20, 30];
export const BAGGAGE_MAX_KG = 30;
/** Cân hành lý bấm giữ: số kg chạy 0 → 30 → 0 với tốc độ này (kg/giây). */
export const BAGGAGE_HOLD_SPEED_KG_PER_S = 31.25;

export const OUTCOME_STARS: Record<ScoreOutcome, Stars> = {
  PERFECT: 5,
  GOOD: 4,
  OK: 2,
  POOR: 1,
  FAILED: 1,
  SOLD_INVALID: 1,
  REFUSED_CORRECT: 5,
  REFUSED_NO_STOCK: 4,
  REFUSED_WRONG: 1,
  LEFT: 1,
};

/** Phạt = giá vé của đơn × tỉ lệ này (vé càng đắt phạt càng nặng); làm tròn ở economy.ts. */
/** Những ngày đầu phạt nhẹ để người mới làm quen: tới hết ngày này phạt nhân hệ số bên dưới. */
export const PENALTY_GRACE_UNTIL_DAY = 10;
export const PENALTY_GRACE_MULT = 0.5;

export const OUTCOME_PENALTY_RATE: Record<ScoreOutcome, number> = {
  PERFECT: 0,
  GOOD: 0,
  OK: 0,
  POOR: 0,
  FAILED: 0.25,
  SOLD_INVALID: 0.4,
  REFUSED_CORRECT: 0,
  REFUSED_NO_STOCK: 0,
  REFUSED_WRONG: 0.2,
  LEFT: 0.1,
};

// Quầy
/** Từ ngày này khách khó tính mới đòi vị trí ghế theo hàng (đầu/giữa/cuối khoang), ngoài cửa sổ/lối đi. */
export const FUSSY_SEAT_PREF_FROM_DAY = 7;
export const PATIENCE_PER_COMPLEXITY_MS = 3500;
export const QUEUE_PATIENCE_RATE = 0.3;
export const MOOD_HAPPY_ABOVE = 0.6;
export const MOOD_NEUTRAL_FROM = 0.3;
export const RESOLVE_MS = 1200;
export const MAX_TICK_MS = 100;

export const BASE_MODIFIERS: Modifiers = {
  patienceMult: 1.1,
  tipMult: 1,
  printMs: 2000,
  queuePatienceRateMult: 1,
  refundRate: 0,
  seatBias: false,
};

// Lưới an toàn
export const SAFETY_NET_ECO_COST_MULT = 3;
export const SAFETY_NET_GIFT_SEATS = 3;

// Hộ chiếu
