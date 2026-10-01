import { audio } from '@platform/audio';
import Phaser from 'phaser';
import { BAGGAGE_HOLD_SPEED_KG_PER_S, BAGGAGE_MARKS, BAGGAGE_MAX_KG } from '@data/balance';
import { STRINGS } from '@data/strings';
import { clamp } from '@domain/common/math';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface BaggageSliderOptions {
  width: number;
  initialKg: number;
  /** Chỉ gọi khi nhả tay — domain làm tròn ≤1 kg về vạch gần nhất (PLAN §3.5), không bao giờ gọi giữa lúc đang giữ. */
  onCommit: (kg: number) => void;
}

const HANDLE_RADIUS = 26;
const HIT_HEIGHT = 120;
const HINT_Y = 78;
const MS_PER_SECOND = 1000;

/**
 * Cân hành lý: BẤM GIỮ trên thanh, số kg chạy qua lại 0 ⇄ 30 kg; thả tay đúng lúc để chốt (không kéo).
 * Có tiếng "tick" mỗi khi chạy qua một vạch.
 */
export class BaggageSlider extends Phaser.GameObjects.Container {
  private readonly widthValue: number;
  private readonly handle: Phaser.GameObjects.Arc;
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly onCommit: (kg: number) => void;
  private kg: number;
  private direction: 1 | -1 = 1;
  private activePointerId: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, options: BaggageSliderOptions) {
    super(scene, x, y);
    this.widthValue = options.width;
    this.onCommit = options.onCommit;
    this.kg = clamp(options.initialKg, 0, BAGGAGE_MAX_KG);

    const track = scene.add.rectangle(0, 0, options.width, 12, COLORS.disabled).setOrigin(0, 0.5);
    const marks: Phaser.GameObjects.GameObject[] = [];
    for (const mark of BAGGAGE_MARKS) {
      const markX = (mark / BAGGAGE_MAX_KG) * options.width;
      marks.push(scene.add.circle(markX, 0, 4, COLORS.textMuted));
      marks.push(scene.add.text(markX, 22, `${mark}`, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5, 0));
    }
    this.handle = scene.add.circle(this.xFor(this.kg), 0, HANDLE_RADIUS, COLORS.primary);
    this.valueText = scene.add
      .text(options.width / 2, -50, this.labelFor(this.kg), { fontFamily: FONT_FAMILY, fontSize: '26px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0.5);
    const hint = scene.add.text(options.width / 2, HINT_Y, STRINGS.counter.baggageHoldHint, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5, 0);
    const hitZone = scene.add.zone(options.width / 2, 0, options.width + 2 * HANDLE_RADIUS, HIT_HEIGHT).setInteractive({ useHandCursor: true });

    this.add([track, ...marks, this.handle, this.valueText, hint, hitZone]);
    scene.add.existing(this);

    hitZone.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
    scene.input.on('pointerupoutside', this.handlePointerUp, this);
  }

  override destroy(fromScene?: boolean): void {
    this.stopHolding();
    this.scene?.input.off('pointerup', this.handlePointerUp, this);
    this.scene?.input.off('pointerupoutside', this.handlePointerUp, this);
    super.destroy(fromScene);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId !== null) return;
    this.activePointerId = pointer.id;
    this.direction = this.kg >= BAGGAGE_MAX_KG ? -1 : 1;
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.advance, this);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId !== pointer.id) return;
    this.stopHolding();
    this.onCommit(Math.round(this.kg));
  }

  private stopHolding(): void {
    this.activePointerId = null;
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.advance, this);
  }

  private advance(_time: number, deltaMs: number): void {
    const before = this.kg;
    let next = before + this.direction * BAGGAGE_HOLD_SPEED_KG_PER_S * (deltaMs / MS_PER_SECOND);
    if (next >= BAGGAGE_MAX_KG || next <= 0) {
      this.direction = this.direction === 1 ? -1 : 1;
      next = clamp(next, 0, BAGGAGE_MAX_KG);
    }
    this.kg = next;
    if (BAGGAGE_MARKS.some((mark) => (before - mark) * (next - mark) < 0)) audio.playSfx('tick');
    this.handle.setX(this.xFor(next));
    this.valueText.setText(this.labelFor(next));
  }

  private xFor(kg: number): number {
    return (kg / BAGGAGE_MAX_KG) * this.widthValue;
  }

  private labelFor(kg: number): string {
    return `${Math.round(kg)} ${STRINGS.counter.baggageUnit}`;
  }
}
