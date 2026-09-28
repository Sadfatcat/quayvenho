import Phaser from 'phaser';
import { BAGGAGE_MARKS, BAGGAGE_MAX_KG } from '@data/balance';
import { STRINGS } from '@data/strings';
import { clamp } from '@domain/common/math';
import { DragController } from './DragController';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface BaggageSliderOptions {
  width: number;
  initialKg: number;
  /** Only fired on release — domain snaps ≤1 kg to the nearest mark (PLAN §3.5), never mid-drag. */
  onCommit: (kg: number) => void;
}

const HANDLE_RADIUS = 26;

export class BaggageSlider extends Phaser.GameObjects.Container {
  private readonly widthValue: number;
  private readonly handle: Phaser.GameObjects.Arc;
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly dragController: DragController;
  private kg: number;

  constructor(scene: Phaser.Scene, x: number, y: number, options: BaggageSliderOptions) {
    super(scene, x, y);
    this.widthValue = options.width;
    this.kg = clamp(Math.round(options.initialKg), 0, BAGGAGE_MAX_KG);

    const track = scene.add.rectangle(0, 0, options.width, 12, COLORS.disabled).setOrigin(0, 0.5);
    const marks: Phaser.GameObjects.GameObject[] = [];
    for (const mark of BAGGAGE_MARKS) {
      const markX = (mark / BAGGAGE_MAX_KG) * options.width;
      marks.push(scene.add.circle(markX, 0, 4, COLORS.textMuted));
      marks.push(
        scene.add.text(markX, 22, `${mark}`, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5, 0),
      );
    }
    this.handle = scene.add.circle(this.xFor(this.kg), 0, HANDLE_RADIUS, COLORS.primary);
    this.handle.setInteractive();
    this.valueText = scene.add
      .text(options.width / 2, -50, this.labelFor(this.kg), { fontFamily: FONT_FAMILY, fontSize: '26px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0.5);

    this.add([track, ...marks, this.handle, this.valueText]);
    scene.add.existing(this);

    this.dragController = new DragController(this.handle, {
      onDragMove: (point) => {
        const local = this.getLocalPoint(point.x, point.y);
        this.kg = clamp(Math.round((local.x / this.widthValue) * BAGGAGE_MAX_KG), 0, BAGGAGE_MAX_KG);
        this.handle.setX(this.xFor(this.kg));
        this.valueText.setText(this.labelFor(this.kg));
      },
      onDragEnd: () => options.onCommit(this.kg),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.dragController.destroy();
    super.destroy(fromScene);
  }

  private xFor(kg: number): number {
    return (kg / BAGGAGE_MAX_KG) * this.widthValue;
  }

  private labelFor(kg: number): string {
    return `${kg} ${STRINGS.counter.baggageUnit}`;
  }
}
