export type CabinClass = 'ECONOMY' | 'BUSINESS';
export type SeatPref = 'WINDOW' | 'AISLE' | 'FRONT' | 'MIDDLE' | 'BACK' | 'ANY';
export type TimeWindow = 'NIGHT' | 'LATE';
export type TimePref = TimeWindow | 'ANY';
export type Extra = 'VEG_MEAL' | 'WHEELCHAIR' | 'INSURANCE';
export type BaggageKg = 0 | 15 | 20 | 30;
export type Mood = 'HAPPY' | 'NEUTRAL' | 'IMPATIENT';
export type SeatColumn = 'A' | 'B' | 'C' | 'D';
export type SeatId = `${number}${SeatColumn}`;
export type RouteId = string;
export type UpgradeId = string;
export type SeatBias = 'WINDOW' | 'BALANCED' | 'AISLE';
export type BuildStep = 'FLIGHT' | 'SEAT' | 'EXTRAS' | 'REVIEW';
export type CounterState = 'EMPTY' | 'BUILDING' | 'PRINTING' | 'READY_TO_DELIVER' | 'RESOLVING';
export type DayPhase = 'PREP' | 'OPEN' | 'CLOSING' | 'SUMMARY' | 'SHOP';
export type Stars = 1 | 2 | 3 | 4 | 5;
export type WeatherOutcome = 'GOOD' | 'BAD' | 'SEVERE';
export type Mechanic = 'baggage' | 'seatPref' | 'business' | 'timePref' | 'extras' | 'badPassport';

export type DayEvent =
  | { type: 'NONE' }
  | { type: 'RUSH'; holidayId: string; hotRoutes: RouteId[] }
  | { type: 'WEATHER'; routeId: RouteId; outcome: WeatherOutcome | null };

export interface Route {
  id: RouteId;
  name: string;
  cost: Record<CabinClass, number>;
  price: Record<CabinClass, number>;
  weight: number;
  unlock: { cost: number; minTravelViet: number | null } | null;
  color: number;
  icon: string;
  /** Kỷ niệm từ PersonalConfig.customRoutes, hiện khi chạm vào tuyến. */
  flavorText?: string;
}

export interface Flight {
  id: string;
  routeId: RouteId;
  /** Game minutes from 00:00 of the day; 00:30 next day = 1470. */
  departAt: number;
  status: 'SCHEDULED' | 'CANCELLED';
  takenByOthers: SeatId[];
}

export type OwnedSeatState = 'AVAILABLE' | 'HELD' | 'SOLD' | 'EXPIRED' | 'LOST';

export interface OwnedSeat {
  flightId: string;
  seat: SeatId;
  cabin: CabinClass;
  unitCost: number;
  state: OwnedSeatState;
}

export interface Passport {
  name: string;
  bookedName: string;
  expiresDay: number;
}

export interface Order {
  customerId: string;
  spriteId: string;
  routeId: RouteId;
  cabin: CabinClass;
  baggageKg: BaggageKg;
  seatPref: SeatPref;
  timePref: TimePref;
  extras: Extra[];
  passport: Passport;
  complexity: number;
  patienceMaxMs: number;
  /** Khách đặc biệt của PersonalConfig (PLAN §16): luật chấm riêng, không phạt. */
  special?: { id: string; tipMultiplier: number };
}

export interface Customer {
  order: Order;
  patienceLeftMs: number;
  infinitePatience: boolean;
  mood: Mood;
  position: 'QUEUE' | 'COUNTER';
}

export interface TicketDraft {
  step: BuildStep;
  /** Con dấu điểm đến và con dấu giờ bay đã đóng; đủ cả hai (và chuyến còn bay) thì `flightId` được xác định. */
  routeStamp: RouteId | null;
  timeStamp: number | null;
  flightId: string | null;
  cabin: CabinClass | null;
  seat: SeatId | null;
  baggageKg: number;
  extras: Extra[];
}

export type ScoreOutcome =
  | 'PERFECT'
  | 'GOOD'
  | 'OK'
  | 'POOR'
  | 'FAILED'
  | 'SOLD_INVALID'
  | 'REFUSED_CORRECT'
  | 'REFUSED_NO_STOCK'
  | 'REFUSED_WRONG'
  | 'LEFT';

export type MistakeCode =
  | 'WRONG_ROUTE'
  | 'WRONG_CABIN'
  | 'WRONG_TIME'
  | 'WRONG_BAGGAGE'
  | 'WRONG_SEAT_PREF'
  | 'MISSING_EXTRA'
  | 'EXTRA_NOT_REQUESTED'
  | 'INVALID_PASSPORT'
  | 'REFUSED_SERVABLE';

export interface ScoreResult {
  customerId: string;
  outcome: ScoreOutcome;
  stars: Stars;
  revenue: number;
  tip: number;
  penalty: number;
  mistakes: MistakeCode[];
  /** Vé bán với giá vượt trần (có thể bị huỷ lúc tổng kết). */
  overCap: boolean;
  specialId?: string;
}

export type TxType =
  | 'SEAT_PURCHASE'
  | 'TICKET_REVENUE'
  | 'TIP'
  | 'PENALTY'
  | 'REFUND_EXPIRED'
  | 'TICKET_REFUND'
  | 'SUPPORT_GIFT'
  | 'WEATHER_LOSS'
  | 'UPGRADE_PURCHASE'
  | 'ROUTE_UNLOCK'
  | 'STAFF_HIRE'
  | 'STAFF_WAGE'
  | 'STAFF_TRAIN';

export interface Transaction {
  type: TxType;
  /** Signed: negative = spend. SUPPORT_GIFT and WEATHER_LOSS are 0 (record only). */
  amount: number;
  day: number;
  minute: number | null;
  ref?: string;
}

export interface DaySummary {
  day: number;
  moneyStart: number;
  moneyEnd: number;
  ticketRevenue: number;
  tips: number;
  seatCost: number;
  shopCost: number;
  /** Lương nhân viên trả lúc tổng kết ngày. */
  staffWages: number;
  /** Thông báo cho ngày mai: ai nghỉ, ai được lên bậc. */
  staffNotices: StaffNotice[];
  expiredSeats: number;
  expiredCost: number;
  refunds: number;
  weatherLostSeats: number;
  weatherLostCost: number;
  penalties: number;
  cancelledTickets: number;
  cancelRefunds: number;
  served: number;
  left: number;
  turnedAway: number;
  avgStars: number;
  travelVietAfter: number | null;
}

export interface Settings {
  musicVolume: number;
  sfxVolume: number;
  haptics: boolean;
}

export interface Profile {
  playerName: string;
  brandName: string;
}

export interface DayConfig {
  day: number;
  patienceBaseMs: number;
  pBaggage: number;
  pSeatPref: number;
  pBusiness: number;
  pTimePref: number;
  pExtra: number;
  pBadPassport: number;
  maxComplexity: number;
}

export interface Modifiers {
  patienceMult: number;
  tipMult: number;
  printMs: number;
  /** Nhân vào tốc độ mất kiên nhẫn của khách đang đứng chờ (< 1 = chậm hơn). */
  queuePatienceRateMult: number;
  refundRate: number;
  seatBias: boolean;
}

export interface UpgradeDef {
  id: UpgradeId;
  cost: number;
  minDay: number | null;
  minTravelViet: number | null;
  effect: Partial<Modifiers>;
}

export interface CounterSlot {
  state: CounterState;
  draft: TicketDraft | null;
  printLeftMs: number;
  resolveLeftMs: number;
}

export type StaffKind = 'INTERN' | 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'MARKETING';
/** Việc trên vé mà nhân viên làm thay người chơi (người chơi luôn tự in và giao vé). */
export type StaffJob = 'CABIN' | 'STAMPS' | 'BAGGAGE' | 'SEAT' | 'SERVICES';
export type AbsenceReason = 'SICK' | 'FAMILY' | 'MATERNITY';

export interface StaffKindDef {
  kind: StaffKind;
  hireCost: number;
  baseWage: number;
  jobs: readonly StaffJob[];
  minDay: number;
  /** Marketing không chiếm chỗ trong giới hạn nhân viên quầy. */
  countsTowardCap: boolean;
}

export interface StaffMember {
  id: string;
  kind: StaffKind;
  name: string;
  hiredDay: number;
  /** Số ngày đã đi làm (thực tập sinh đủ ngày thì lên Junior). */
  daysWorked: number;
  /** Thực tập sinh đã lên Junior: lương = tỉ lệ của lương Junior. */
  promoted: boolean;
  /** Ngày cuối cùng còn nghỉ (tính cả ngày đó); null = đang đi làm. */
  absentUntilDay: number | null;
  absenceReason: AbsenceReason | null;
  /** Marketing: % khách tăng thêm. */
  bonusPct: number;
}

export type StaffNotice =
  | { type: 'ABSENT'; staffId: string; name: string; kind: StaffKind; reason: AbsenceReason; untilDay: number }
  | { type: 'PROMOTED'; staffId: string; name: string };

export interface TodayState {
  moneyStart: number;
  event: DayEvent;
  /** % chỉnh giá vé theo tuyến, người chơi đặt ở Kho (mặc định 0 = giá gốc). */
  priceAdjustPct: Partial<Record<RouteId, number>>;
  flights: Flight[];
  seats: OwnedSeat[];
  /** key `${flightId}:${cabin}` */
  pendingPurchase: Record<string, number>;
  seatBias: SeatBias;
  purchaseCount: number;
  transactions: Transaction[];
  targetCustomers: number;
  arrivals: number[];
  nextArrivalIndex: number;
  clock: number;
  /** Element 0 is the customer at the counter when its position is COUNTER. */
  queue: Customer[];
  counter: CounterSlot;
  results: ScoreResult[];
  turnedAway: number;
}

export interface GameState {
  version: number;
  seed: number;
  day: number;
  phase: DayPhase;
  money: number;
  profile: Profile | null;
  /** Up to 30 entries, newest last. */
  starHistory: Stars[];
  unlockedRoutes: RouteId[];
  /** Day the route was bought in the shop. */
  routeUnlockedDay: Record<RouteId, number>;
  upgrades: UpgradeId[];
  /** Nhân viên đang làm (trả lương mỗi ngày đi làm). */
  staff: StaffMember[];
  /** Số đếm để đặt id/tên nhân viên mới. */
  staffSerial: number;
  /** Lương mỗi người được cộng thêm theo lợi nhuận (k/ngày), tăng mỗi 3 ngày. */
  wageRaise: number;
  /** Lợi nhuận kinh doanh 6 ngày gần nhất (không tính lương), mới nhất ở cuối. */
  profitHistory: number[];
  settings: Settings;
  flags: Record<string, boolean>;
  today: TodayState;
  nextDayTransactions: Transaction[];
  lastSummary: DaySummary | null;
}

export type Command =
  | { type: 'PROFILE_SET'; playerName: string; brandName: string }
  | { type: 'PREP_SET_QTY'; flightId: string; cabin: CabinClass; qty: number }
  | { type: 'PREP_SET_SEAT_BIAS'; bias: SeatBias }
  | { type: 'PREP_CONFIRM_PURCHASE' }
  | { type: 'SET_ROUTE_PRICE'; routeId: RouteId; pct: number }
  | { type: 'PREP_CLEAR_PENDING' }
  | { type: 'OPEN_COUNTER' }
  | { type: 'BUILD_TAKE_TICKET'; cabin: CabinClass }
  | { type: 'BUILD_STAMP_ROUTE'; routeId: RouteId }
  | { type: 'BUILD_STAMP_TIME'; departAt: number }
  | { type: 'BUILD_SELECT_FLIGHT'; flightId: string; cabin: CabinClass }
  | { type: 'BUILD_SELECT_SEAT'; seat: SeatId }
  | { type: 'BUILD_SET_BAGGAGE'; kg: number }
  | { type: 'BUILD_TOGGLE_EXTRA'; extra: Extra }
  | { type: 'BUILD_GOTO_STEP'; step: BuildStep }
  | { type: 'BUILD_RESET' }
  | { type: 'PRINT_TICKET' }
  | { type: 'DELIVER_TICKET' }
  | { type: 'REFUSE_CUSTOMER' }
  | { type: 'GO_TO_SHOP' }
  | { type: 'SHOP_BUY_UPGRADE'; upgradeId: UpgradeId }
  | { type: 'SHOP_UNLOCK_ROUTE'; routeId: RouteId }
  | { type: 'HIRE_STAFF'; kind: StaffKind }
  | { type: 'FIRE_STAFF'; staffId: string }
  | { type: 'TEACH_MARKETING' }
  | { type: 'NEXT_DAY' }
  | { type: 'SETTINGS_UPDATE'; patch: Partial<Settings> }
  | { type: 'FLAG_SET'; flag: string };

export type DomainEvent =
  | { type: 'COMMAND_REJECTED'; command: Command['type']; reason: string }
  | { type: 'PROFILE_SET' }
  | { type: 'SEATS_PURCHASED'; flightId: string; cabin: CabinClass; seats: SeatId[]; cost: number }
  | { type: 'SUPPORT_GIFT'; flightId: string; seats: SeatId[] }
  | { type: 'DAY_OPENED'; targetCustomers: number }
  | { type: 'WEATHER_RESOLVED'; routeId: RouteId; outcome: WeatherOutcome; lostSeats: number }
  | { type: 'CLOCK_TICK'; minute: number }
  | { type: 'CUSTOMER_SPAWNED'; customerId: string }
  | { type: 'CUSTOMER_AT_COUNTER'; customerId: string }
  | { type: 'CUSTOMER_MOOD_CHANGED'; customerId: string; mood: Mood }
  | { type: 'CUSTOMER_LEFT'; customerId: string }
  | { type: 'PRINT_STARTED'; durationMs: number }
  | { type: 'PRINT_DONE' }
  | { type: 'TICKET_SCORED'; result: ScoreResult }
  | { type: 'DAY_CLOSING' }
  | { type: 'DAY_ENDED'; summary: DaySummary }
  | { type: 'TRAVELVIET_UNLOCKED' }
  | { type: 'UPGRADE_BOUGHT'; upgradeId: UpgradeId }
  | { type: 'ROUTE_UNLOCKED'; routeId: RouteId }
  | { type: 'STAFF_HIRED'; staffId: string; kind: StaffKind }
  | { type: 'STAFF_FIRED'; staffId: string }
  | { type: 'MARKETING_TAUGHT'; bonusPct: number }
  | { type: 'STAFF_ASSISTED'; staffId: string; kind: StaffKind; job: StaffJob }
  | { type: 'SETTINGS_UPDATED' }
  | { type: 'FLAG_SET'; flag: string };
