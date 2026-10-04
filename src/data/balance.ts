import type { BaggageKg, CabinClass, Extra, Modifiers, ScoreOutcome, Settings, Stars } from '@domain/models';

export const SAVE_VERSION = 2;
export const STARTING_MONEY = 6000;

export const PROFILE_LIMITS = { playerName: 16, brandName: 20 } as const;
export const DEFAULT_SETTINGS: Settings = { musicVolume: 0.7, sfxVolume: 0.8, haptics: true };

// Kho
/** Hệ số nhân giá vốn ghế của mọi tuyến (1 = bảng gốc theo giá vé thật × tỉ lệ vốn cũ). */
export const SEAT_COST_FACTOR = 0.8;
export const PURCHASE_LIMIT_PER_FLIGHT: Record<CabinClass, number> = { ECONOMY: 12, BUSINESS: 4 };
/** Checked in order; first match wins. */
export const BULK_DISCOUNT_TIERS: readonly { minQty: number; rate: number }[] = [
  { minQty: 10, rate: 0.1 },
  { minQty: 5, rate: 0.05 },
];
export const SEAT_BIAS_PREFERENCE_CHANCE = 0.75;

// Doanh thu
export const BAGGAGE_FEES: Record<BaggageKg, number> = { 0: 0, 15: 300, 20: 380, 30: 530 };
export const EXTRA_FEES: Record<Extra, number> = { VEG_MEAL: 80, WHEELCHAIR: 0, INSURANCE: 230 };
export const BUSINESS_TIP_RATIO = 0.8;

// Chấm điểm (accuracy tính bằng điểm phần trăm để tránh sai số số thực)
export const ACCURACY_DEDUCTIONS = {
  WRONG_BAGGAGE: 30,
  WRONG_SEAT_PREF: 20,
  MISSING_EXTRA: 15,
  EXTRA_NOT_REQUESTED: 5,
} as const;
export const BUSINESS_DEDUCTION_MULT = 2;
export const ACCURACY_GOOD = 80;
export const ACCURACY_OK = 50;
export const PERFECT_MIN_SPEED = 0.5;
export const BAGGAGE_TOLERANCE_KG = 1;
export const BAGGAGE_MARKS: readonly BaggageKg[] = [15, 20, 30];
export const BAGGAGE_MAX_KG = 30;
/** Cân hành lý bấm giữ: số kg chạy 0 → 30 → 0 với tốc độ này (kg/giây). */
export const BAGGAGE_HOLD_SPEED_KG_PER_S = 12.5;

export const OUTCOME_STARS: Record<ScoreOutcome, Stars> = {
  PERFECT: 5,
  GOOD: 4,
  OK: 3,
  POOR: 2,
  FAILED: 1,
  SOLD_INVALID: 1,
  REFUSED_CORRECT: 5,
  REFUSED_NO_STOCK: 4,
  REFUSED_WRONG: 1,
  LEFT: 1,
};

export const OUTCOME_PENALTY: Record<ScoreOutcome, number> = {
  PERFECT: 0,
  GOOD: 0,
  OK: 0,
  POOR: 0,
  FAILED: 380,
  SOLD_INVALID: 600,
  REFUSED_CORRECT: 0,
  REFUSED_NO_STOCK: 0,
  REFUSED_WRONG: 300,
  LEFT: 150,
};

// Quầy
export const PATIENCE_PER_COMPLEXITY_MS = 5000;
export const QUEUE_PATIENCE_RATE = 0.5;
export const MOOD_HAPPY_ABOVE = 0.6;
export const MOOD_NEUTRAL_FROM = 0.3;
export const RESOLVE_MS = 1200;
export const MAX_TICK_MS = 100;

export const BASE_MODIFIERS: Modifiers = {
  patienceMult: 1,
  tipMult: 1,
  printMs: 3000,
  queueMax: 4,
  refundRate: 0,
  seatBias: false,
  searchFilter: false,
};

// Lưới an toàn
export const SAFETY_NET_ECO_COST_MULT = 3;
export const SAFETY_NET_GIFT_SEATS = 3;

// Hộ chiếu
export const BAD_PASSPORT_EXPIRED_DAYS = { min: 1, max: 30 } as const;
export const VALID_PASSPORT_EXTRA_DAYS = { min: 0, max: 400 } as const;
