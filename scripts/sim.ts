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
import { resolveWeather } from '@domain/events';
import { createRng, type Rng } from '@domain/rng';
import type { WeatherOutcome } from '@domain/models';

const SEEDS_PER_BOT = Number(process.env.SEEDS ?? 200);
/** QUIET=1: bỏ bảng theo ngày, chỉ in phần đối chiếu mục tiêu + dòng METRICS (dùng khi tự chỉnh cân bằng). */
const QUIET = process.env.QUIET === '1';
/** DAYS=n: số ngày mô phỏng (mặc định 30). */
const DAYS = Number(process.env.DAYS ?? 30);
const BLOCK_DAYS = 5;
const GROWTH_BLOCK_DAYS = 3;
/** Ngưỡng "giàu vô lo": đủ tiền mua hết nâng cấp, tuyến và nhân viên (xem docs/CAN_BANG_KINH_TE.md). */
const RICH_MONEY = 300_000;
const MILESTONE_DAYS = [10, 20, 30, 40, 50, 60, 70] as const;

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
  weatherDay: boolean;
  weatherOutcome: WeatherOutcome | null;
  weatherLostCost: number;
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
const SAVVY_NORMAL_PCT = 10;
const SAVVY_HOLIDAY_HOT_PCT = 20;
const SAVVY_HOLIDAY_OTHER_PCT = 20;
const savvyPricing: PricingStrategy = ({ event, routeId }) => {
  if (event.type !== 'RUSH') return SAVVY_NORMAL_PCT;
  return event.hotRoutes.includes(routeId) ? SAVVY_HOLIDAY_HOT_PCT : SAVVY_HOLIDAY_OTHER_PCT;
};
/** AVERAGE: một mức giá cố định, không để ý ngày lễ. */
const AVERAGE_FLAT_PCT = 5;
const averagePricing: PricingStrategy = () => AVERAGE_FLAT_PCT;
/** POOR: giá gốc, hay "hét" quá trần vào ngày lễ. */
const POOR_OVER_CAP_PCT = 30;
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
      const weatherDay = game.state.today.event.type === 'WEATHER';
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
        weatherDay,
        weatherOutcome: weatherDay ? resolveWeather(seed, day) : null,
        weatherLostCost: summary.weatherLostCost,
      });
    }
  }
  return byDay;
};

const printDailyTable = (name: string, byDay: DayRecord[][]): void => {
  console.log(`\n=== ${name} — theo ngày (median trên ${SEEDS_PER_BOT} seed) ===`);
  console.log('Ngày | Tiền cuối | Lợi nhuận | Khách | Bỏ về đông | Ghế ế | Mất do TT (TB) | TravelViet | Nâng cấp | Lưới AT');
  byDay.forEach((records, index) => {
    if (!records.length) return;
    const m = <K extends keyof DayRecord>(key: K) => median(records.map((r) => r[key] as number));
    const tv = records.some((r) => r.travelViet !== null) ? round1(median(records.filter((r) => r.travelViet !== null).map((r) => r.travelViet as number))) : '—';
    console.log(
      `${String(index + 1).padStart(4)} | ${String(m('moneyEnd')).padStart(9)} | ${String(m('profit')).padStart(9)} | ${String(m('customers')).padStart(5)} | ${String(m('turnedAway')).padStart(10)} | ${String(m('expiredSeats')).padStart(5)} | ${String(round1(records.reduce((sum, r) => sum + r.weatherLostSeats, 0) / records.length)).padStart(9)} | ${String(tv).padStart(10)} | ${String(m('upgrades')).padStart(8)} | ${String(m('safetyNet')).padStart(7)}`,
    );
  });
};

/** Trung bình trên các seed: tiền lãi mỗi khối 5 ngày (sau mọi chi phí, và riêng phần kinh doanh không tính Shop) + tiền cuối khối. */
const printBlockEarnings = (name: string, byDay: DayRecord[][]): void => {
  console.log(`
--- ${name}: tiền kiếm được trung bình mỗi ${BLOCK_DAYS} ngày (trung bình trên ${SEEDS_PER_BOT} seed) ---`);
  console.log('Ngày        | Lãi ròng TB | Lãi kinh doanh TB | Tiền cuối khối TB');
  const mean = (values: readonly number[]): number => Math.round(values.reduce((sum, value) => sum + value, 0) / (values.length || 1));
  for (let first = 0; first < byDay.length; first += BLOCK_DAYS) {
    const block = byDay.slice(first, first + BLOCK_DAYS);
    const perSeed = Array.from({ length: SEEDS_PER_BOT }, (_, seedIndex) => block.map((records) => records.find((r) => r.seedIndex === seedIndex)));
    const complete = perSeed.filter((rows): rows is DayRecord[] => rows.every((row) => row !== undefined));
    if (!complete.length) continue;
    const net = complete.map((rows) => rows.reduce((sum, r) => sum + r.profit, 0));
    const operating = complete.map((rows) => rows.reduce((sum, r) => sum + r.operatingProfit, 0));
    const moneyEnd = complete.map((rows) => rows[rows.length - 1]?.moneyEnd ?? 0);
    const label = `${first + 1}–${first + block.length}`;
    console.log(`${label.padEnd(11)} | ${String(mean(net)).padStart(11)} | ${String(mean(operating)).padStart(17)} | ${String(mean(moneyEnd)).padStart(17)}`);
  }
};

/** Tăng trưởng tiền mỗi khối 3 ngày = tổng lãi kinh doanh (không tính Shop) / tiền đầu khối, tính từng seed rồi lấy median và mean. */
const printGrowthPerBlock = (name: string, byDay: DayRecord[][]): void => {
  console.log(`
--- ${name}: tăng trưởng tiền mỗi ${GROWTH_BLOCK_DAYS} ngày (lãi kinh doanh / tiền đầu khối) ---`);
  console.log('Ngày        | Median % | Mean % | P25 % | P75 %');
  const round = (value: number): number => Math.round(value * 10) / 10;
  const growthByBlock: number[] = [];
  for (let first = 0; first + GROWTH_BLOCK_DAYS <= byDay.length; first += GROWTH_BLOCK_DAYS) {
    const block = byDay.slice(first, first + GROWTH_BLOCK_DAYS);
    const growth: number[] = [];
    for (let seedIndex = 0; seedIndex < SEEDS_PER_BOT; seedIndex++) {
      const rows = block.map((records) => records.find((r) => r.seedIndex === seedIndex));
      if (!rows.every((row): row is DayRecord => row !== undefined)) continue;
      const [firstRow] = rows;
      if (!firstRow) continue;
      const moneyStart = firstRow.moneyEnd - firstRow.profit;
      growth.push((rows.reduce((sum, r) => sum + r.operatingProfit, 0) / Math.max(moneyStart, 1)) * 100);
    }
    if (!growth.length) continue;
    growthByBlock.push(median(growth));
    const avg = growth.reduce((sum, value) => sum + value, 0) / growth.length;
    const label = `${first + 1}–${first + GROWTH_BLOCK_DAYS}`;
    console.log(`${label.padEnd(11)} | ${String(round(median(growth))).padStart(8)} | ${String(round(avg)).padStart(6)} | ${String(round(percentile(growth, 0.25))).padStart(5)} | ${String(round(percentile(growth, 0.75))).padStart(5)}`);
  }
  console.log(`GROWTH ${name} median-of-blocks ${round(median(growthByBlock))}%`);
};

/** Mốc theo ngày (median trên seed): tiền, TravelViet và ngày đầu tiên đạt ngưỡng giàu. */
const printMilestones = (name: string, byDay: DayRecord[][]): void => {
  const moneyAt: Record<number, number> = {};
  const travelVietAt: Record<number, number | null> = {};
  for (const day of MILESTONE_DAYS) {
    const records = byDay[day - 1];
    if (!records?.length) continue;
    moneyAt[day] = Math.round(median(records.map((r) => r.moneyEnd)));
    const ratings = records.filter((r) => r.travelViet !== null).map((r) => r.travelViet as number);
    travelVietAt[day] = ratings.length ? round1(median(ratings)) : null;
  }
  // Ngày giàu theo lãi tích luỹ: ngày đầu tiên tổng lãi kinh doanh của một seed đạt ngưỡng (median trên seed; seed chưa đạt tính là vô cực).
  const crossingDays: number[] = Array.from({ length: SEEDS_PER_BOT }, (_, seedIndex) => {
    let total = 0;
    for (let day = 0; day < byDay.length; day++) {
      total += byDay[day]?.find((r) => r.seedIndex === seedIndex)?.operatingProfit ?? 0;
      if (total >= RICH_MONEY) return day + 1;
    }
    return Number.POSITIVE_INFINITY;
  });
  const richDayProfitRaw = median(crossingDays);
  const richDayProfit = Number.isFinite(richDayProfitRaw) ? richDayProfitRaw : null;
  const richDay = byDay.findIndex((records) => records.length > 0 && median(records.map((r) => r.moneyEnd)) >= RICH_MONEY) + 1;
  console.log(`MILESTONES ${name} ${JSON.stringify({ richDay: richDay > 0 ? richDay : null, richDayProfit, moneyAt, travelVietAt })}`);
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
  const allDays = byDay.flat();
  const weatherDays = allDays.filter((r) => r.weatherDay);
  const share = (count: number, total: number): number => (total ? round1((count / total) * 100) : 0);
  const weatherPct = share(weatherDays.length, totalDays);
  const weatherBadPct = share(weatherDays.filter((r) => r.weatherOutcome === 'BAD').length, totalDays);
  const weatherSeverePct = share(weatherDays.filter((r) => r.weatherOutcome === 'SEVERE').length, totalDays);
  const weatherLostSeatsAvg = totalDays ? round1(allDays.reduce((sum, r) => sum + r.weatherLostSeats, 0) / totalDays) : 0;
  const weatherLostCostAvg = totalDays ? Math.round(allDays.reduce((sum, r) => sum + r.weatherLostCost, 0) / totalDays) : 0;
  const weatherLossDays = allDays.filter((r) => r.weatherLostSeats > 0);
  const weatherLostCostPerHitDay = weatherLossDays.length ? Math.round(weatherLossDays.reduce((sum, r) => sum + r.weatherLostCost, 0) / weatherLossDays.length) : 0;
  const rushPct = share(allDays.filter((r) => r.holiday).length, totalDays);
  console.log(`Sự kiện ngẫu nhiên: ngày lễ ${rushPct}%, ngày có thời tiết ${weatherPct}% (xấu ${weatherBadPct}%, nghiêm trọng ${weatherSeverePct}%)`);
  console.log(`Thiệt hại thời tiết: TB ${weatherLostSeatsAvg} ghế/ngày, ${weatherLostCostAvg} xu/ngày; mỗi ngày bị mất ghế: ${weatherLostCostPerHitDay} xu`);
  const tv20 = median((byDay[19] ?? []).filter((r) => r.travelViet !== null).map((r) => r.travelViet as number));
  const roi = (days: DayRecord[]): number => {
    const cost = days.reduce((sum, r) => sum + r.seatCost, 0);
    return cost === 0 ? 0 : round1((days.reduce((sum, r) => sum + r.operatingProfit, 0) / cost) * 100);
  };
  const holidayRoiPct = roi(byDay.flat().filter((r) => r.holiday));
  const normalRoiPct = roi(byDay.flat().filter((r) => !r.holiday));
  const unsoldSeats = totalBought ? round1((totalExpired / totalBought) * 100) : 0;
  console.log(`METRICS ${name} ${JSON.stringify({ firstUpgradeDay, bkkDay, tv20: Number.isNaN(tv20) ? null : round1(tv20), safetyNet: round1(median(safetyNetPerSeed)), negOperatingPct: totalDays ? round1((negativeOperatingDays / totalDays) * 100) : 0, unsoldSeatsPct: unsoldSeats, holidayRoiPct, normalRoiPct, turnedAwayPct: round1(avgTurnedAwayRatio * 100), rushPct, weatherPct, weatherBadPct, weatherSeverePct, weatherLostSeatsAvg, weatherLostCostAvg, weatherLostCostPerHitDay, money30: round1(median((byDay[DAYS - 1] ?? []).map((r) => r.moneyEnd))) })}`);
};

for (const profile of PROFILES) {
  const byDay = runBot(profile);
  if (!QUIET) printDailyTable(profile.name, byDay);
  runChecks(profile.name, byDay);
  printBlockEarnings(profile.name, byDay);
  printGrowthPerBlock(profile.name, byDay);
  printMilestones(profile.name, byDay);
}
