import Phaser from 'phaser';
import { COLORS } from './theme';

const SKIN_TONES = [0xf6d5b8, 0xe9b98f, 0xd9a273, 0xf2c7a5] as const;
const HAIR_COLORS = [0x3b2a20, 0x6b4a32, 0x1f1a1a, 0x8a5a3c, 0x4a3a52] as const;
const OUTLINE_WIDTH = 3;
const BLUSH_COLOR = 0xf19a8a;

/** Hash ổn định từ spriteId (vd "c05") để cùng một sprite luôn ra cùng một gương mặt. */
const hashSpriteId = (spriteId: string): number =>
  [...spriteId].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 7);

/**
 * Gương mặt chibi vẽ bằng Graphics (STYLE §5) — thay hình tròn xám trước khi có tranh minh hoạ thật.
 * Màu da/tóc suy ra từ `spriteId`, nên khách giống nhau ở Quầy và Hộ chiếu.
 */
export class CustomerAvatar extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, radius: number, spriteId: string) {
    super(scene, x, y);
    const hash = hashSpriteId(spriteId);
    const skin = SKIN_TONES[hash % SKIN_TONES.length] ?? SKIN_TONES[0];
    const hair = HAIR_COLORS[Math.floor(hash / 7) % HAIR_COLORS.length] ?? HAIR_COLORS[0];
    const hasBangs = hash % 2 === 0;

    const graphics = scene.add.graphics();
    graphics.fillStyle(hair, 1);
    graphics.fillCircle(0, -radius * 0.08, radius * 1.05);
    graphics.fillStyle(skin, 1);
    graphics.fillCircle(0, radius * 0.1, radius * 0.9);
    if (hasBangs) {
      graphics.fillStyle(hair, 1);
      graphics.fillEllipse(0, -radius * 0.55, radius * 1.6, radius * 0.6);
    }
    graphics.lineStyle(OUTLINE_WIDTH, COLORS.primaryDark, 1);
    graphics.strokeCircle(0, radius * 0.1, radius * 0.9);

    const eyeRadius = radius * 0.1;
    graphics.fillStyle(COLORS.primaryDark, 1);
    graphics.fillCircle(-radius * 0.32, radius * 0.15, eyeRadius);
    graphics.fillCircle(radius * 0.32, radius * 0.15, eyeRadius);
    graphics.fillStyle(BLUSH_COLOR, 0.7);
    graphics.fillCircle(-radius * 0.5, radius * 0.38, radius * 0.13);
    graphics.fillCircle(radius * 0.5, radius * 0.38, radius * 0.13);
    graphics.lineStyle(OUTLINE_WIDTH - 1, COLORS.primaryDark, 1);
    graphics.beginPath();
    graphics.arc(0, radius * 0.38, radius * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
    graphics.strokePath();

    this.add(graphics);
    scene.add.existing(this);
  }
}
