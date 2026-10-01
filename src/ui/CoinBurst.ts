import Phaser from 'phaser';
import { COLORS } from './theme';

const COIN_RADIUS = 14;
const COIN_AMOUNT_UNIT = 500;
const COIN_RISE_PX = 120;
const COIN_SPREAD_PX = 70;
const COIN_DURATION_MS = 700;
const COIN_STAGGER_MS = 60;
const MAX_COINS_PER_BURST = 6;
const COIN_DEPTH = 500;

const pools = new WeakMap<Phaser.Scene, Phaser.GameObjects.Arc[]>();

/** Lấy đồng xu từ pool của scene (PLAN §11.4: coin particle có pooling); chỉ tạo mới khi pool rỗng. */
const acquireCoin = (scene: Phaser.Scene): Phaser.GameObjects.Arc => {
  const pool = pools.get(scene) ?? [];
  pools.set(scene, pool);
  const coin = pool.pop() ?? scene.add.circle(0, 0, COIN_RADIUS, COLORS.warning).setStrokeStyle(3, COLORS.primaryDark).setDepth(COIN_DEPTH);
  return coin.setActive(true).setVisible(true).setAlpha(1).setScale(1);
};

const releaseCoin = (scene: Phaser.Scene, coin: Phaser.GameObjects.Arc): void => {
  coin.setActive(false).setVisible(false);
  pools.get(scene)?.push(coin);
};

/** Vài đồng xu bay lên rồi mờ dần tại (x, y). Hiệu ứng thuần hình ảnh nên được dùng `Math.random()` (CLAUDE.md luật 2). */
export const burstCoins = (scene: Phaser.Scene, x: number, y: number, amount: number): void => {
  const count = Math.min(MAX_COINS_PER_BURST, Math.max(1, Math.ceil(amount / COIN_AMOUNT_UNIT)));
  for (let index = 0; index < count; index++) {
    const coin = acquireCoin(scene);
    coin.setPosition(x, y);
    scene.tweens.add({
      targets: coin,
      x: x + (Math.random() * 2 - 1) * COIN_SPREAD_PX,
      y: y - COIN_RISE_PX,
      alpha: 0,
      scale: 0.6,
      delay: index * COIN_STAGGER_MS,
      duration: COIN_DURATION_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => releaseCoin(scene, coin),
    });
  }
};
