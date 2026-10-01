declare const process: { env: Record<string, string | undefined> };
/**
 * Soak test: bot ngẫu nhiên (quyết định, giá, chi tiêu) chơi nhiều seed × nhiều ngày, kiểm các bất biến:
 * tiền là số nguyên không âm, domain không ném lỗi, tổng kết khớp. Chạy: `npx tsx scripts/soak.ts`.
 */
import { GameSession } from '@domain/game';
import { playDay, randomBotRng, randomDecide, type PricingStrategy } from '@domain/__integration__/bots';
import { createRng } from '@domain/rng';

const SEEDS = Number(process.env.SEEDS ?? 300);
const DAYS = Number(process.env.DAYS ?? 40);
const MIN_PCT = -30;
const MAX_PCT = 60;

let failures = 0;
let totalDays = 0;
let overCapDays = 0;
let cancelled = 0;
for (let seed = 1; seed <= SEEDS; seed++) {
  try {
    const game = GameSession.newGame(seed * 31 + 7);
    const decide = randomDecide(randomBotRng(seed));
    const priceRng = createRng(seed ^ 0xabc);
    const pricing: PricingStrategy = () => priceRng.int(MIN_PCT, MAX_PCT);
    for (let day = 1; day <= DAYS; day++) {
      playDay(game, decide, priceRng.int(0, 6000), 0.5 + priceRng.next(), priceRng.chance(0.5), 0, [], pricing, priceRng.chance(0.5) ? 0.8 : null);
      const { money, lastSummary } = game.state;
      totalDays++;
      if (!Number.isInteger(money) || money < 0) throw new Error(`money invalid: ${money} (day ${day})`);
      if (lastSummary) {
        cancelled += lastSummary.cancelledTickets;
        if (lastSummary.cancelledTickets > 0) overCapDays++;
        if (lastSummary.moneyEnd < 0) throw new Error('moneyEnd negative');
      }
    }
  } catch (error) {
    failures++;
    console.error(`seed ${seed}:`, error instanceof Error ? error.message : error);
    if (failures >= 10) break;
  }
}
console.log(JSON.stringify({ seeds: SEEDS, days: DAYS, totalDays, failures, daysWithCancellations: overCapDays, cancelledTickets: cancelled }));
if (failures > 0) throw new Error('soak failed');
