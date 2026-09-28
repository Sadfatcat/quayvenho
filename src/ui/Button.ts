import Phaser from 'phaser';
import { DRAG_TAP_THRESHOLD_PX, MIN_TOUCH_SIZE } from './layout';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'ghost';

const VARIANT_FILL: Record<ButtonVariant, number> = {
  primary: COLORS.primary,
  success: COLORS.success,
  danger: COLORS.danger,
  ghost: COLORS.cloud,
};

const VARIANT_TEXT: Record<ButtonVariant, number> = {
  primary: COLORS.cloud,
  success: COLORS.cloud,
  danger: COLORS.cloud,
  ghost: COLORS.text,
};

export interface ButtonOptions {
  width?: number;
  height?: number;
  label: string;
  variant?: ButtonVariant;
  onTap: () => void;
}

const PRESS_SCALE = 0.95;

/**
 * Tap-to-press button (PLAN §11.1): scales down while held, dims when disabled or locked.
 * Call lock() before dispatching a command and unlock() once the scene handles the result,
 * to block double-tap. A release more than DRAG_TAP_THRESHOLD_PX from the press point never
 * fires onTap, so buttons nested in a ScrollList survive a scroll gesture without a false tap.
 */
export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly variant: ButtonVariant;
  private readonly onTap: () => void;
  private disabledFlag = false;
  private lockedFlag = false;
  private downX = 0;
  private downY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
    super(scene, x, y);
    const width = options.width ?? 220;
    const height = options.height ?? MIN_TOUCH_SIZE;
    this.variant = options.variant ?? 'primary';
    this.onTap = options.onTap;

    this.bg = scene.add.rectangle(0, 0, width, height, VARIANT_FILL[this.variant]);
    this.labelText = scene.add
      .text(0, 0, options.label, {
        fontFamily: FONT_FAMILY,
        fontSize: '30px',
        fontStyle: 'bold',
        color: toCssColor(VARIANT_TEXT[this.variant]),
      })
      .setOrigin(0.5);
    this.add([this.bg, this.labelText]);
    scene.add.existing(this);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', this.handlePointerDown, this);
    this.bg.on('pointerup', this.handlePointerUp, this);
    this.bg.on('pointerupoutside', this.handlePointerCancel, this);
    this.bg.on('pointerout', this.handlePointerCancel, this);
  }

  setLabel(label: string): void {
    this.labelText.setText(label);
  }

  setEnabled(enabled: boolean): void {
    this.disabledFlag = !enabled;
    this.refreshInteractive();
  }

  lock(): void {
    this.lockedFlag = true;
    this.refreshInteractive();
  }

  unlock(): void {
    this.lockedFlag = false;
    this.refreshInteractive();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.downX = pointer.x;
    this.downY = pointer.y;
    this.setScale(PRESS_SCALE);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    this.setScale(1);
    const moved = Math.hypot(pointer.x - this.downX, pointer.y - this.downY);
    if (moved <= DRAG_TAP_THRESHOLD_PX && !this.disabledFlag && !this.lockedFlag) this.onTap();
  }

  private handlePointerCancel(): void {
    this.setScale(1);
  }

  private refreshInteractive(): void {
    const enabled = !this.disabledFlag && !this.lockedFlag;
    this.bg.setFillStyle(enabled ? VARIANT_FILL[this.variant] : COLORS.disabled);
    if (this.bg.input) this.bg.input.enabled = enabled;
  }
}
