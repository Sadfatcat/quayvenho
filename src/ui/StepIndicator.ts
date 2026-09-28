import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import type { BuildStep } from '@domain/models';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export const BUILD_STEP_ORDER: readonly BuildStep[] = ['FLIGHT', 'SEAT', 'EXTRAS', 'REVIEW'];

const DOT_RADIUS = 14;
const GAP = 140;

export interface StepIndicatorOptions {
  /** PLAN §3.5: bấm vào một bước đã hoàn thành trước đó để quay lại sửa. */
  onStepTap: (step: BuildStep) => void;
}

const HIT_RADIUS = 40;

/** 4 dots A-B-C-D, labeled "Chuyến · Ghế · Hành lý · Vé" (PLAN §10.6). */
export class StepIndicator extends Phaser.GameObjects.Container {
  private readonly dots: Phaser.GameObjects.Arc[] = [];
  private readonly labels: Phaser.GameObjects.Text[] = [];
  private readonly hitAreas: Phaser.GameObjects.Zone[] = [];
  private activeIndex = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, options: StepIndicatorOptions) {
    super(scene, x, y);
    BUILD_STEP_ORDER.forEach((step, index) => {
      const dotX = index * GAP;
      const dot = scene.add.circle(dotX, 0, DOT_RADIUS, COLORS.disabled);
      const label = scene.add
        .text(dotX, DOT_RADIUS + 14, STRINGS.counter.stepLabels[index] ?? '', {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          color: toCssColor(COLORS.textMuted),
        })
        .setOrigin(0.5, 0);
      const hitArea = scene.add.zone(dotX, 0, HIT_RADIUS * 2, HIT_RADIUS * 2).setInteractive({ useHandCursor: true });
      hitArea.on('pointerup', () => {
        if (index < this.activeIndex) options.onStepTap(step);
      });
      this.dots.push(dot);
      this.labels.push(label);
      this.hitAreas.push(hitArea);
      this.add([dot, label, hitArea]);
    });
    scene.add.existing(this);
  }

  setCurrentStep(step: BuildStep): void {
    this.activeIndex = BUILD_STEP_ORDER.indexOf(step);
    this.dots.forEach((dot, index) => dot.setFillStyle(index <= this.activeIndex ? COLORS.primary : COLORS.disabled));
    this.labels.forEach((label, index) => label.setColor(toCssColor(index === this.activeIndex ? COLORS.text : COLORS.textMuted)));
  }
}
