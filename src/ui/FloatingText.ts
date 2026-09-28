import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface FloatingTextOptions {
  text: string;
  color?: number;
  fontSize?: number;
}

const RISE_PX = 60;
const DURATION_MS = 900;

/** A number/label that floats up and fades out (e.g. "+75", "+152 tip") then destroys itself. */
export const showFloatingText = (scene: Phaser.Scene, x: number, y: number, options: FloatingTextOptions): void => {
  const label = scene.add
    .text(x, y, options.text, {
      fontFamily: FONT_FAMILY,
      fontSize: `${options.fontSize ?? 32}px`,
      fontStyle: 'bold',
      color: toCssColor(options.color ?? COLORS.success),
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: label,
    y: y - RISE_PX,
    alpha: 0,
    duration: DURATION_MS,
    ease: 'Cubic.easeOut',
    onComplete: () => label.destroy(),
  });
};
