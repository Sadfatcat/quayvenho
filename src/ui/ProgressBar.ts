import Phaser from 'phaser';
import { clamp } from '@domain/common/math';
import { COLORS } from './theme';

export interface ProgressBarOptions {
  width: number;
  height: number;
  trackColor?: number;
  fillColor?: number;
}

/** Horizontal fill bar; used for PatienceBar, the printer, and Preload's loading bar. */
export class ProgressBar extends Phaser.GameObjects.Container {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly barWidth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, options: ProgressBarOptions) {
    super(scene, x, y);
    this.barWidth = options.width;
    const track = scene.add.rectangle(0, 0, options.width, options.height, options.trackColor ?? COLORS.disabled).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(0, 0, options.width, options.height, options.fillColor ?? COLORS.primary).setOrigin(0, 0.5);
    this.add([track, this.fill]);
    scene.add.existing(this);
  }

  setProgress(ratio: number): void {
    this.fill.width = this.barWidth * clamp(ratio, 0, 1);
  }

  setFillColor(color: number): void {
    this.fill.setFillStyle(color);
  }
}
