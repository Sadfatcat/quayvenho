/**
 * PLAN §13.3 — mô phỏng kinh tế bằng 3 bot (PERFECT/AVERAGE/POOR), in bảng theo ngày,
 * đối chiếu khoảng mục tiêu. Chạy: `npm run sim`.
 *
 * SEEDS_PER_BOT giảm xuống so với PLAN (200) để chạy trong vài phút — mỗi seed bot
 * chậm (POOR, 30s/khách) tốn khá nhiều tick giả lập. Tăng hằng số này để chạy đầy đủ hơn.
 */
import { GameSession } from '@domain/game';
import { makeErrorProneDecide, perfectDecide, playDay, type Decide } from '@domain/__integration__/bots';
import { createRng, type Rng } from '@domain/rng';

const SEEDS_PER_BOT = 20;
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
}

interface BotProfile {
  name: string;
  reserve: number;
  serveTimeMs: number;
  demandJitter: number;
  avoidWeather: boolean;
  makeDecide: (rng: Rng) => Decide;
}

const PROFILES: BotProfile[] = [
  { name: 'PERFECT', reserve: 250, serveTimeMs: 15000, demandJitter: 0, avoidWeather: true, makeDecide: () => perfectDecide },
  {
    name: 'AVERAGE',
    reserve: 250,
    serveTimeMs: 22000,
    demandJitter: 0.3,
    avoidWeather: false,
    makeDecide: (rng) => makeErrorProneDecide(rng, { walkAwayRate: 0.03, minorErrorRate: 0.2, majorErrorRate: 0.05, neverRefuse: false }),
  },
  {
    name: 'POOR',
    reserve: 250,
    serveTimeMs: 30000,
    demandJitter: 0.6,
    avoidWeather: false,
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
      playDay(game, decide, profile.reserve, demandScale, profile.avoidWeather, profile.serveTimeMs);
      const summary = game.state.lastSummary;
      if (!summary) break;
      const safetyNet = game.state.today.transactions.some((tx) => tx.type === 'SUPPORT_GIFT') ? 1 : 0;
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
  const totalDays = byDay.flat().length;
  console.log(`Tỉ lệ ngày lợi nhuận âm: ${totalDays ? round1((negativeProfitDays / totalDays) * 100) : 0}%`);

  const totalExpired = byDay.flat().reduce((sum, r) => sum + r.expiredSeats, 0);
  const totalBought = byDay.flat().reduce((sum, r) => sum + r.expiredSeats + r.served, 0);
  console.log(`Tỉ lệ ghế ế (ghế ế / ghế đã mua): ${totalBought ? round1((totalExpired / totalBought) * 100) : 0}%`);

  const avgTurnedAwayRatio =
    byDay.flat().reduce((sum, r) => sum + (r.customers > 0 ? r.turnedAway / (r.customers + r.turnedAway) : 0), 0) / (totalDays || 1);
  console.log(`Tỉ lệ khách bỏ về vì đông (chỉ báo cáo, PLAN §15 D10): ${round1(avgTurnedAwayRatio * 100)}%`);
};

for (const profile of PROFILES) {
  const byDay = runBot(profile);
  printDailyTable(profile.name, byDay);
  runChecks(profile.name, byDay);
}
