import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import type { BuildStep } from '@domain/models';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export const BUILD_STEP_ORDER: readonly BuildStep[] = ['FLIGHT', 'SEAT', 'EXTRAS', 'REVIEW'];

const DOT_RADIUS = 14;
const GAP = 140;

/** 4 dots A-B-C-D, labeled "Chuyến · Ghế · Hành lý · Vé" (PLAN §10.6). */
export class StepIndicator extends Phaser.GameObjects.Container {
  private readonly dots: Phaser.GameObjects.Arc[] = [];
  private readonly labels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    BUILD_STEP_ORDER.forEach((_step, index) => {
      const dotX = index * GAP;
      const dot = scene.add.circle(dotX, 0, DOT_RADIUS, COLORS.disabled);
      const label = scene.add
        .text(dotX, DOT_RADIUS + 14, STRINGS.counter.stepLabels[index] ?? '', {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          color: toCssColor(COLORS.textMuted),
        })
        .setOrigin(0.5, 0);
      this.dots.push(dot);
      this.labels.push(label);
      this.add([dot, label]);
    });
    scene.add.existing(this);
  }

  setCurrentStep(step: BuildStep): void {
    const activeIndex = BUILD_STEP_ORDER.indexOf(step);
    this.dots.forEach((dot, index) => dot.setFillStyle(index <= activeIndex ? COLORS.primary : COLORS.disabled));
    this.labels.forEach((label, index) => label.setColor(toCssColor(index === activeIndex ? COLORS.text : COLORS.textMuted)));
  }
}
