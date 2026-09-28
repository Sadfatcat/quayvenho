import Phaser from 'phaser';
import { COLORS, RADIUS } from './theme';

export interface PanelOptions {
  width: number;
  height: number;
  radius?: number;
  fill?: number;
  fillAlpha?: number;
  strokeColor?: number;
  strokeAlpha?: number;
  strokeWidth?: number;
}

const DEFAULT_STROKE_ALPHA = 0.2;
const DEFAULT_STROKE_WIDTH = 2;

/** Rounded-rect background; add children on top for Card/Dialog/SpeechBubble/TicketView/etc. */
export class Panel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: PanelOptions) {
    super(scene, x, y);
    this.setSize(options.width, options.height);

    const radius = options.radius ?? RADIUS.md;
    const graphics = scene.add.graphics();
    graphics.fillStyle(options.fill ?? COLORS.cloud, options.fillAlpha ?? 1);
    graphics.fillRoundedRect(-options.width / 2, -options.height / 2, options.width, options.height, radius);
    if (options.strokeColor !== undefined) {
      graphics.lineStyle(options.strokeWidth ?? DEFAULT_STROKE_WIDTH, options.strokeColor, options.strokeAlpha ?? DEFAULT_STROKE_ALPHA);
      graphics.strokeRoundedRect(-options.width / 2, -options.height / 2, options.width, options.height, radius);
    }
    this.add(graphics);
    scene.add.existing(this);
  }
}
