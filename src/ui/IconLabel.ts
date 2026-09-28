import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface IconLabelOptions {
  text: string;
  iconColor?: number;
  iconRadius?: number;
  fontSize?: number;
  textColor?: number;
  gap?: number;
}

const DEFAULT_ICON_RADIUS = 14;
const DEFAULT_GAP = 10;

/** Colored dot + label; swap the dot for a real icon sprite once atlases exist (Phase 5/6). */
export class IconLabel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: IconLabelOptions) {
    super(scene, x, y);
    const radius = options.iconRadius ?? DEFAULT_ICON_RADIUS;
    const dot = scene.add.circle(radius, 0, radius, options.iconColor ?? COLORS.primary);
    const label = scene.add
      .text(radius * 2 + (options.gap ?? DEFAULT_GAP), 0, options.text, {
        fontFamily: FONT_FAMILY,
        fontSize: `${options.fontSize ?? 28}px`,
        color: toCssColor(options.textColor ?? COLORS.text),
      })
      .setOrigin(0, 0.5);
    this.add([dot, label]);
    scene.add.existing(this);
  }
}
