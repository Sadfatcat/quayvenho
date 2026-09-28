export type CabinClass = 'ECONOMY' | 'BUSINESS';
export type SeatPref = 'WINDOW' | 'AISLE' | 'ANY';
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
  | { type: 'RUSH' }
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
}

export type TxType =
  | 'SEAT_PURCHASE'
  | 'TICKET_REVENUE'
  | 'TIP'
  | 'PENALTY'
  | 'REFUND_EXPIRED'
  | 'SUPPORT_GIFT'
  | 'WEATHER_LOSS'
  | 'UPGRADE_PURCHASE'
  | 'ROUTE_UNLOCK';

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
  expiredSeats: number;
  expiredCost: number;
  refunds: number;
  weatherLostSeats: number;
  weatherLostCost: number;
  penalties: number;
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
  queueMax: number;
  refundRate: number;
  seatBias: boolean;
  searchFilter: boolean;
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
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

export interface TodayState {
  moneyStart: number;
  event: DayEvent;
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
  | { type: 'PREP_CLEAR_PENDING' }
  | { type: 'OPEN_COUNTER' }
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
  | { type: 'CUSTOMER_TURNED_AWAY'; customerId: string }
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
  | { type: 'SETTINGS_UPDATED' }
  | { type: 'FLAG_SET'; flag: string };
