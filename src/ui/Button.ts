import Phaser from 'phaser';
import { DRAG_TAP_THRESHOLD_PX, MIN_TOUCH_SIZE } from './layout';
import { COLORS, EXTRUSION, HEADING_FONT_FAMILY, toCssColor } from './theme';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'ghost';

const VARIANT_FILL: Record<ButtonVariant, number> = {
  primary: COLORS.primary,
  success: COLORS.success,
  danger: COLORS.accent,
  ghost: COLORS.cloud,
};

const VARIANT_BASE: Record<ButtonVariant, number> = {
  primary: COLORS.primaryDark,
  success: COLORS.successDark,
  danger: COLORS.accentDark,
  ghost: COLORS.primaryDark,
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

const OUTLINE_WIDTH = 2;

/**
 * Tap-to-press pill button (PLAN §11.1, STYLE §4): face sinks onto its extruded base while held, dims when disabled or locked.
 * Call lock() before dispatching a command and unlock() once the scene handles the result,
 * to block double-tap. A release more than DRAG_TAP_THRESHOLD_PX from the press point never
 * fires onTap, so buttons nested in a ScrollList survive a scroll gesture without a false tap.
 */
export class Button extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Graphics;
  private readonly bg: Phaser.GameObjects.Zone;
  private readonly buttonWidth: number;
  private readonly buttonHeight: number;
  private pressed = false;
  private readonly labelText: Phaser.GameObjects.Text;
  private variant: ButtonVariant;
  private readonly onTap: () => void;
  private disabledFlag = false;
  private lockedFlag = false;
  private downX = 0;
  private downY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
    super(scene, x, y);
    this.buttonWidth = options.width ?? 220;
    this.buttonHeight = options.height ?? MIN_TOUCH_SIZE;
    this.variant = options.variant ?? 'primary';
    this.onTap = options.onTap;

    this.face = scene.add.graphics();
    this.bg = scene.add.zone(0, 0, this.buttonWidth, this.buttonHeight);
    this.labelText = scene.add
      .text(0, 0, options.label, {
        fontFamily: HEADING_FONT_FAMILY,
        fontSize: '30px',
        fontStyle: 'bold',
        color: toCssColor(VARIANT_TEXT[this.variant]),
      })
      .setOrigin(0.5);
    this.add([this.face, this.labelText, this.bg]);
    scene.add.existing(this);
    this.redraw();

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', this.handlePointerDown, this);
    this.bg.on('pointerup', this.handlePointerUp, this);
    this.bg.on('pointerupoutside', this.handlePointerCancel, this);
    this.bg.on('pointerout', this.handlePointerCancel, this);
  }

  setLabel(label: string): void {
    this.labelText.setText(label);
  }

  setVariant(variant: ButtonVariant): void {
    this.variant = variant;
    this.labelText.setColor(toCssColor(VARIANT_TEXT[variant]));
    this.refreshInteractive();
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
    this.pressed = true;
    this.redraw();
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    this.pressed = false;
    this.redraw();
    const moved = Math.hypot(pointer.x - this.downX, pointer.y - this.downY);
    if (moved <= DRAG_TAP_THRESHOLD_PX && !this.disabledFlag && !this.lockedFlag) this.onTap();
  }

  private handlePointerCancel(): void {
    this.pressed = false;
    this.redraw();
  }

  private redraw(): void {
    const enabled = !this.disabledFlag && !this.lockedFlag;
    const radius = this.buttonHeight / 2;
    const left = -this.buttonWidth / 2;
    const top = -this.buttonHeight / 2;
    const offset = this.pressed ? EXTRUSION.pressedOffset : 0;
    const base = enabled ? VARIANT_BASE[this.variant] : COLORS.textMuted;
    this.face.clear();
    this.face.fillStyle(base, 1);
    this.face.fillRoundedRect(left, top + EXTRUSION.button, this.buttonWidth, this.buttonHeight, radius);
    this.face.fillStyle(enabled ? VARIANT_FILL[this.variant] : COLORS.disabled, 1);
    this.face.fillRoundedRect(left, top + offset, this.buttonWidth, this.buttonHeight, radius);
    this.face.lineStyle(OUTLINE_WIDTH, base, 1);
    this.face.strokeRoundedRect(left, top + offset, this.buttonWidth, this.buttonHeight, radius);
    this.labelText.setY(offset);
  }

  private refreshInteractive(): void {
    const enabled = !this.disabledFlag && !this.lockedFlag;
    this.redraw();
    if (this.bg.input) this.bg.input.enabled = enabled;
  }
}
