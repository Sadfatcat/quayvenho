declare const process: { env: Record<string, string | undefined> };
/**
 * PLAN §13.3 — mô phỏng kinh tế bằng 3 bot (PERFECT/AVERAGE/POOR), in bảng theo ngày,
 * đối chiếu khoảng mục tiêu. Chạy: `npm run sim`.
 *
 * SEEDS_PER_BOT giảm xuống so với PLAN (200) để chạy trong vài phút — mỗi seed bot
 * chậm (POOR, 30s/khách) tốn khá nhiều tick giả lập. Tăng hằng số này để chạy đầy đủ hơn.
 */
import { GameSession } from '@domain/game';
import { enableStaffHiring, makeErrorProneDecide, perfectDecide, playDay, type Decide, type PricingStrategy } from '@domain/__integration__/bots';
import { createRng, type Rng } from '@domain/rng';

const SEEDS_PER_BOT = Number(process.env.SEEDS ?? 200);
/** QUIET=1: bỏ bảng theo ngày, chỉ in phần đối chiếu mục tiêu + dòng METRICS (dùng khi tự chỉnh cân bằng). */
const QUIET = process.env.QUIET === '1';
const DAYS = 30;

interface DayRecord {
  seedIndex: number;
  moneyEnd: number;
  profit: number;
  customers: number;
  served: number;
  turnedAway: number;
  expiredSeats: number;
  weatherLostSeats: number;
  travelViet: number | null;
  upgrades: number;
  safetyNet: number;
  /** Lợi nhuận kinh doanh: không tính tiền chi cho Shop (đầu tư, ghi vào ngày sau). */
  operatingProfit: number;
  bkkOpen: boolean;
  holiday: boolean;
  seatCost: number;
}

interface BotProfile {
  name: string;
  reserve: number;
  /** Upgrade ids bought first, in order; the rest follow cheapest-first. */
  upgradeOrder: readonly string[];
  serveTimeMs: number;
  /** PLAN §13.3: kiên nhẫn khách còn lại lúc giao vé (0.8/0.5/0.25). */
  deliverRatio: number;
  demandJitter: number;
  avoidWeather: boolean;
  pricing: PricingStrategy;
  makeDecide: (rng: Rng) => Decide;
}

const PERFECT_UPGRADE_ORDER = ['COMFY_CHAIRS', 'FAN', 'BIGGER_COUNTER', 'FAST_PRINTER', 'LOYALTY_BOARD'];
/** AVERAGE keeps a bigger cash cushion, so it starts buying upgrades later than PERFECT. */
const AVERAGE_RESERVE = 9000;
const DEFAULT_RESERVE = 3750;

/** PERFECT: ngày thường +15%, ngày lễ nâng sát trần (+30%) ở tuyến nóng và +20% các tuyến còn lại. */
const SAVVY_NORMAL_PCT = 15;
const SAVVY_HOLIDAY_HOT_PCT = 30;
const SAVVY_HOLIDAY_OTHER_PCT = 30;
const savvyPricing: PricingStrategy = ({ event, routeId }) => {
  if (event.type !== 'RUSH') return SAVVY_NORMAL_PCT;
  return event.hotRoutes.includes(routeId) ? SAVVY_HOLIDAY_HOT_PCT : SAVVY_HOLIDAY_OTHER_PCT;
};
/** AVERAGE: một mức giá cố định, không để ý ngày lễ. */
const AVERAGE_FLAT_PCT = 10;
const averagePricing: PricingStrategy = () => AVERAGE_FLAT_PCT;
/** POOR: giá gốc, hay "hét" quá trần vào ngày lễ. */
const POOR_OVER_CAP_PCT = 45;
const poorPricing: PricingStrategy = ({ event }) => (event.type === 'RUSH' ? POOR_OVER_CAP_PCT : 0);

/** FORCE_PCT=n: mọi bot đặt đúng n% cho mọi tuyến (thí nghiệm độ nhạy giá, không dùng khi chạy chuẩn). */
const forcePct = process.env.FORCE_PCT === undefined ? null : Number(process.env.FORCE_PCT);
/** HIRE=1: bot thuê nhân viên khi còn đủ tiền (thí nghiệm kinh tế nhân viên, không dùng khi chạy chuẩn). */if (process.env.HIRE === '1') enableStaffHiring();
const pricingOf = (strategy: PricingStrategy): PricingStrategy => (forcePct === null ? strategy : () => forcePct);

const PROFILES: BotProfile[] = [
  { name: 'PERFECT', reserve: DEFAULT_RESERVE, upgradeOrder: PERFECT_UPGRADE_ORDER, serveTimeMs: 0, deliverRatio: 0.8, demandJitter: 0, avoidWeather: true, pricing: pricingOf(savvyPricing), makeDecide: () => perfectDecide },
  {
    name: 'AVERAGE',
    reserve: AVERAGE_RESERVE,
    upgradeOrder: [],
    serveTimeMs: 0,
    deliverRatio: 0.5,
    demandJitter: 0.3,
    avoidWeather: false,
    pricing: pricingOf(averagePricing),
    makeDecide: (rng) => makeErrorProneDecide(rng, { walkAwayRate: 0.03, minorErrorRate: 0.2, majorErrorRate: 0.05, neverRefuse: false }),
  },
  {
    name: 'POOR',
    reserve: DEFAULT_RESERVE,
    upgradeOrder: [],
    serveTimeMs: 0,
    deliverRatio: 0.25,
    demandJitter: 0.6,
    avoidWeather: false,
    pricing: pricingOf(poorPricing),
    makeDecide: (rng) => makeErrorProneDecide(rng, { walkAwayRate: 0.12, minorErrorRate: 0.35, majorErrorRate: 0.15, neverRefuse: true }),
  },
];

const percentile = (values: readonly number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[idx] ?? 0;
};
const median = (values: readonly number[]): number => percentile(values, 0.5);
const round1 = (n: number): number => Math.round(n * 10) / 10;

const runBot = (profile: BotProfile): DayRecord[][] => {
  const byDay: DayRecord[][] = Array.from({ length: DAYS }, () => []);
  for (let seedIndex = 0; seedIndex < SEEDS_PER_BOT; seedIndex++) {
    const seed = seedIndex * 7919 + 1;
    const decideRng = createRng(seed);
    const demandRng = createRng(seed ^ 0x1234567);
    const decide = profile.makeDecide(decideRng);
    const game = GameSession.newGame(seed);
    for (let day = 1; day <= DAYS; day++) {
      const demandScale = 1 + (demandRng.next() * 2 - 1) * profile.demandJitter;
      const holiday = game.state.today.event.type === 'RUSH';
      const safetyNet = game.state.today.transactions.some((tx) => tx.type === 'SUPPORT_GIFT') ? 1 : 0;
      playDay(game, decide, profile.reserve, demandScale, profile.avoidWeather, profile.serveTimeMs, profile.upgradeOrder, profile.pricing, profile.deliverRatio);
      const summary = game.state.lastSummary;
      if (!summary) break;
      byDay[day - 1]?.push({
        seedIndex,
        moneyEnd: summary.moneyEnd,
        profit: summary.moneyEnd - summary.moneyStart,
        customers: summary.served + summary.left,
        served: summary.served,
        turnedAway: summary.turnedAway,
        expiredSeats: summary.expiredSeats,
        weatherLostSeats: summary.weatherLostSeats,
        travelViet: summary.travelVietAfter,
        upgrades: game.state.upgrades.length,
        safetyNet,
        operatingProfit: summary.moneyEnd - summary.moneyStart + summary.shopCost,
        bkkOpen: game.state.unlockedRoutes.includes('HAN-BKK'),
        holiday,
        seatCost: summary.seatCost,
      });
    }
  }
  return byDay;
};

const printDailyTable = (name: string, byDay: DayRecord[][]): void => {
  console.log(`\n=== ${name} — theo ngày (median trên ${SEEDS_PER_BOT} seed) ===`);
  console.log('Ngày | Tiền cuối | Lợi nhuận | Khách | Bỏ về đông | Ghế ế | Mất do TT | TravelViet | Nâng cấp | Lưới AT');
  byDay.forEach((records, index) => {
    if (!records.length) return;
    const m = <K extends keyof DayRecord>(key: K) => median(records.map((r) => r[key] as number));
    const tv = records.some((r) => r.travelViet !== null) ? round1(median(records.filter((r) => r.travelViet !== null).map((r) => r.travelViet as number))) : '—';
    console.log(
      `${String(index + 1).padStart(4)} | ${String(m('moneyEnd')).padStart(9)} | ${String(m('profit')).padStart(9)} | ${String(m('customers')).padStart(5)} | ${String(m('turnedAway')).padStart(10)} | ${String(m('expiredSeats')).padStart(5)} | ${String(m('weatherLostSeats')).padStart(9)} | ${String(tv).padStart(10)} | ${String(m('upgrades')).padStart(8)} | ${String(m('safetyNet')).padStart(7)}`,
    );
  });
};

const firstDayAtLeast = (byDay: DayRecord[][], key: keyof DayRecord, threshold: number, percentileValue = 0.5): number | null => {
  for (let i = 0; i < byDay.length; i++) {
    const records = byDay[i];
    if (records && records.length && percentile(records.map((r) => r[key] as number), percentileValue) >= threshold) return i + 1;
  }
  return null;
};

const runChecks = (name: string, byDay: DayRecord[][]): void => {
  console.log(`\n--- ${name}: đối chiếu khoảng mục tiêu (PLAN §13.3) ---`);
  const firstUpgradeDay = firstDayAtLeast(byDay, 'upgrades', 1);
  console.log(`Mua nâng cấp đầu tiên: ngày ${firstUpgradeDay ?? 'chưa mua trong 30 ngày'}`);

  const day20 = byDay[19] ?? [];
  if (day20.length) {
    const tv20 = median(day20.filter((r) => r.travelViet !== null).map((r) => r.travelViet as number));
    console.log(`TravelViet ngày 20 (median): ${Number.isNaN(tv20) ? '—' : round1(tv20)}`);
  }

  const safetyNetPerSeed = Array.from({ length: SEEDS_PER_BOT }, (_, seedIndex) =>
    byDay.flat().filter((r) => r.seedIndex === seedIndex).reduce((sum, r) => sum + r.safetyNet, 0),
  );
  console.log(`Số lần lưới an toàn kích hoạt trong ${DAYS} ngày (median trên các seed, mục tiêu POOR ≤3): ${round1(median(safetyNetPerSeed))}`);

  const negativeProfitDays = byDay.flat().filter((r) => r.profit < 0).length;
  const negativeOperatingDays = byDay.flat().filter((r) => r.operatingProfit < 0).length;
  const totalDays = byDay.flat().length;
  console.log(`Tỉ lệ ngày lợi nhuận âm (gồm chi Shop): ${totalDays ? round1((negativeProfitDays / totalDays) * 100) : 0}%`);
  console.log(`Tỉ lệ ngày lợi nhuận âm (kinh doanh, không tính Shop): ${totalDays ? round1((negativeOperatingDays / totalDays) * 100) : 0}%`);
  // Tuyến mua ở cuối ngày N dùng được từ ngày N+1 (shopContext), nên ngày mở = ngày ghi nhận + 1.
  const firstRecordedBkk = byDay.findIndex((records) => records.length > 0 && median(records.map((r) => (r.bkkOpen ? 1 : 0))) >= 0.5) + 1;
  const bkkDay = firstRecordedBkk > 0 ? firstRecordedBkk + 1 : 0;
  console.log(`Mở BKK (ngày dùng được, median): ${bkkDay > 0 ? bkkDay : 'chưa mở trong 30 ngày'}`);

  const totalExpired = byDay.flat().reduce((sum, r) => sum + r.expiredSeats, 0);
  const totalBought = byDay.flat().reduce((sum, r) => sum + r.expiredSeats + r.served + r.weatherLostSeats, 0);
  console.log(`Tỉ lệ ghế ế (ghế ế / ghế đã mua): ${totalBought ? round1((totalExpired / totalBought) * 100) : 0}%`);

  const avgTurnedAwayRatio =
    byDay.flat().reduce((sum, r) => sum + (r.customers > 0 ? r.turnedAway / (r.customers + r.turnedAway) : 0), 0) / (totalDays || 1);
  console.log(`Tỉ lệ khách bỏ về vì đông (chỉ báo cáo, PLAN §15 D10): ${round1(avgTurnedAwayRatio * 100)}%`);
  const tv20 = median((byDay[19] ?? []).filter((r) => r.travelViet !== null).map((r) => r.travelViet as number));
  const roi = (days: DayRecord[]): number => {
    const cost = days.reduce((sum, r) => sum + r.seatCost, 0);
    return cost === 0 ? 0 : round1((days.reduce((sum, r) => sum + r.operatingProfit, 0) / cost) * 100);
  };
  const holidayRoiPct = roi(byDay.flat().filter((r) => r.holiday));
  const normalRoiPct = roi(byDay.flat().filter((r) => !r.holiday));
  const unsoldSeats = totalBought ? round1((totalExpired / totalBought) * 100) : 0;
  console.log(`METRICS ${name} ${JSON.stringify({ firstUpgradeDay, bkkDay, tv20: Number.isNaN(tv20) ? null : round1(tv20), safetyNet: round1(median(safetyNetPerSeed)), negOperatingPct: totalDays ? round1((negativeOperatingDays / totalDays) * 100) : 0, unsoldSeatsPct: unsoldSeats, holidayRoiPct, normalRoiPct, turnedAwayPct: round1(avgTurnedAwayRatio * 100), money30: round1(median((byDay[DAYS - 1] ?? []).map((r) => r.moneyEnd))) })}`);
};

for (const profile of PROFILES) {
  const byDay = runBot(profile);
  if (!QUIET) printDailyTable(profile.name, byDay);
  runChecks(profile.name, byDay);
}
