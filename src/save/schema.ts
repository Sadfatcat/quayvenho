import { z } from 'zod';
import { PROFILE_LIMITS } from '@data/balance';
import { MARKETING } from '@data/staff';
import { TRAVELVIET_WINDOW } from '@data/demand';

/**
 * Validates + clamps dữ liệu save đọc từ localStorage. Không đối chiếu với
 * data tĩnh (routes/upgrades hiện có) — chỉ đảm bảo hình dạng và biên giá trị
 * hợp lệ để domain không crash với dữ liệu bẩn (state bị sửa tay, cũ, hỏng).
 */

const cabinClassSchema = z.enum(['ECONOMY', 'BUSINESS']);
const seatPrefSchema = z.enum(['WINDOW', 'AISLE', 'FRONT', 'MIDDLE', 'BACK', 'ANY']);
const timePrefSchema = z.enum(['NIGHT', 'LATE', 'ANY']);
const extraSchema = z.enum(['VEG_MEAL', 'WHEELCHAIR', 'INSURANCE']);
const baggageKgSchema = z.union([z.literal(0), z.literal(15), z.literal(20), z.literal(30)]);
const moodSchema = z.enum(['HAPPY', 'NEUTRAL', 'IMPATIENT']);
const seatIdSchema = z.string().regex(/^\d{1,3}[ABCD]$/);
const seatBiasSchema = z.enum(['WINDOW', 'BALANCED', 'AISLE']);
const buildStepSchema = z.enum(['FLIGHT', 'SEAT', 'EXTRAS', 'REVIEW']);
const counterStateSchema = z.enum(['EMPTY', 'BUILDING', 'PRINTING', 'READY_TO_DELIVER', 'RESOLVING']);
const dayPhaseSchema = z.enum(['PREP', 'OPEN', 'CLOSING', 'SUMMARY', 'SHOP']);
const starsSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const weatherOutcomeSchema = z.enum(['GOOD', 'BAD', 'SEVERE']);
const moneySchema = z.number().finite().transform((n) => Math.round(Math.max(0, n)));
const nonNegIntSchema = z.number().finite().transform((n) => Math.max(0, Math.round(n)));

const dayEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('NONE') }),
  z.object({ type: z.literal('RUSH'), holidayId: z.string(), hotRoutes: z.array(z.string()) }),
  z.object({ type: z.literal('WEATHER'), routeId: z.string(), outcome: z.union([weatherOutcomeSchema, z.null()]) }),
]);

const flightSchema = z.object({
  id: z.string(),
  routeId: z.string(),
  departAt: z.number().finite(),
  status: z.enum(['SCHEDULED', 'CANCELLED']),
  takenByOthers: z.array(seatIdSchema),
});

const ownedSeatSchema = z.object({
  flightId: z.string(),
  seat: seatIdSchema,
  cabin: cabinClassSchema,
  unitCost: moneySchema,
  expiresDay: z.number().int().positive(),
  state: z.enum(['AVAILABLE', 'HELD', 'SOLD', 'EXPIRED', 'LOST']),
});

const passportSchema = z.object({
  name: z.string(),
  bookedName: z.string(),
  expiresDay: z.number().finite(),
});

const orderSchema = z.object({
  customerId: z.string(),
  spriteId: z.string(),
  routeId: z.string(),
  cabin: cabinClassSchema,
  baggageKg: baggageKgSchema,
  seatPref: seatPrefSchema,
  timePref: timePrefSchema,
  extras: z.array(extraSchema),
  passport: passportSchema,
  complexity: z.number().finite(),
  patienceMaxMs: nonNegIntSchema,
});

const customerSchema = z.object({
  order: orderSchema,
  patienceLeftMs: z.number().finite(),
  infinitePatience: z.boolean(),
  mood: moodSchema,
  position: z.enum(['QUEUE', 'COUNTER']),
});

const ticketDraftSchema = z.object({
  step: buildStepSchema,
  routeStamp: z.string().nullable(),
  timeStamp: z.number().finite().nullable(),
  flightId: z.string().nullable(),
  cabin: cabinClassSchema.nullable(),
  seat: seatIdSchema.nullable(),
  baggageKg: z.number(),
  extras: z.array(extraSchema),
});

const scoreResultSchema = z.object({
  customerId: z.string(),
  outcome: z.enum([
    'PERFECT',
    'GOOD',
    'OK',
    'POOR',
    'FAILED',
    'SOLD_INVALID',
    'REFUSED_CORRECT',
    'REFUSED_NO_STOCK',
    'REFUSED_WRONG',
    'LEFT',
  ]),
  stars: starsSchema,
  revenue: moneySchema,
  tip: moneySchema,
  penalty: nonNegIntSchema,
  mistakes: z.array(
    z.enum([
      'WRONG_ROUTE',
      'WRONG_CABIN',
      'WRONG_TIME',
      'WRONG_BAGGAGE',
      'WRONG_SEAT_PREF',
      'MISSING_EXTRA',
      'EXTRA_NOT_REQUESTED',
      'INVALID_PASSPORT',
      'REFUSED_SERVABLE',
    ]),
  ),
  overCap: z.boolean(),
  specialId: z.string().optional(),
});

const staffKindSchema = z.enum(['INTERN', 'JUNIOR', 'MIDDLE', 'SENIOR', 'MARKETING']);
const absenceReasonSchema = z.enum(['SICK', 'FAMILY', 'MATERNITY']);

const staffMemberSchema = z.object({
  id: z.string(),
  kind: staffKindSchema,
  name: z.string(),
  hiredDay: z.number().int().min(1),
  daysWorked: nonNegIntSchema,
  promoted: z.boolean(),
  absentUntilDay: z.number().int().nullable(),
  absenceReason: absenceReasonSchema.nullable(),
  bonusPct: z.number().finite().min(0).max(MARKETING.maxBonusPct),
});

const staffNoticeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ABSENT'), staffId: z.string(), name: z.string(), kind: staffKindSchema, reason: absenceReasonSchema, untilDay: z.number().finite() }),
  z.object({ type: z.literal('PROMOTED'), staffId: z.string(), name: z.string() }),
]);

const transactionSchema = z.object({
  type: z.enum([
    'SEAT_PURCHASE',
    'TICKET_REVENUE',
    'TIP',
    'PENALTY',
    'REFUND_EXPIRED',
    'TICKET_REFUND',
    'SUPPORT_GIFT',
    'WEATHER_LOSS',
    'UPGRADE_PURCHASE',
    'ROUTE_UNLOCK',
    'STAFF_HIRE',
    'STAFF_WAGE',
    'STAFF_TRAIN',
  ]),
  amount: z.number().finite(),
  day: z.number().finite(),
  minute: z.number().finite().nullable(),
  ref: z.string().optional(),
});

const daySummarySchema = z.object({
  day: z.number().finite(),
  moneyStart: moneySchema,
  moneyEnd: moneySchema,
  ticketRevenue: moneySchema,
  tips: moneySchema,
  seatCost: moneySchema,
  shopCost: moneySchema,
  staffWages: moneySchema,
  staffNotices: z.array(staffNoticeSchema),
  expiredSeats: nonNegIntSchema,
  expiredCost: moneySchema,
  refunds: moneySchema,
  weatherLostSeats: nonNegIntSchema,
  weatherLostCost: moneySchema,
  penalties: moneySchema,
  cancelledTickets: nonNegIntSchema,
  cancelRefunds: moneySchema,
  served: nonNegIntSchema,
  left: nonNegIntSchema,
  turnedAway: nonNegIntSchema,
  avgStars: z.number().finite().min(0).max(5),
  travelVietAfter: z.number().finite().nullable(),
});

const settingsSchema = z.object({
  musicVolume: z.number().finite().min(0).max(1),
  sfxVolume: z.number().finite().min(0).max(1),
  haptics: z.boolean(),
});

const profileSchema = z.object({
  playerName: z.string().trim().min(1).max(PROFILE_LIMITS.playerName),
  brandName: z.string().trim().min(1).max(PROFILE_LIMITS.brandName),
});

const counterSlotSchema = z.object({
  state: counterStateSchema,
  draft: ticketDraftSchema.nullable(),
  printLeftMs: nonNegIntSchema,
  resolveLeftMs: nonNegIntSchema,
});

const todayStateSchema = z.object({
  moneyStart: moneySchema,
  event: dayEventSchema,
  priceAdjustPct: z.record(z.string(), z.number().finite()),
  flights: z.array(flightSchema),
  seats: z.array(ownedSeatSchema),
  pendingPurchase: z.record(z.string(), nonNegIntSchema),
  seatBias: seatBiasSchema,
  purchaseCount: nonNegIntSchema,
  transactions: z.array(transactionSchema),
  targetCustomers: nonNegIntSchema,
  arrivals: z.array(z.number().finite()),
  nextArrivalIndex: nonNegIntSchema,
  clock: z.number().finite(),
  queue: z.array(customerSchema),
  counter: counterSlotSchema,
  results: z.array(scoreResultSchema),
  turnedAway: nonNegIntSchema,
});

export const gameStateSchema = z.object({
  version: z.number(),
  seed: z.number().finite(),
  day: z.number().finite().min(1),
  phase: dayPhaseSchema,
  money: moneySchema,
  profile: profileSchema.nullable(),
  starHistory: z.array(starsSchema).max(TRAVELVIET_WINDOW),
  unlockedRoutes: z.array(z.string()),
  routeUnlockedDay: z.record(z.string(), z.number().finite()),
  upgrades: z.array(z.string()),
  staff: z.array(staffMemberSchema),
  staffSerial: nonNegIntSchema,
  wageRaise: nonNegIntSchema,
  profitHistory: z.array(z.number().finite()).max(6),
  settings: settingsSchema,
  flags: z.record(z.string(), z.boolean()),
  today: todayStateSchema,
  nextDayTransactions: z.array(transactionSchema),
  lastSummary: daySummarySchema.nullable(),
});
