import Phaser from 'phaser';
import { Button } from './Button';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface StepperOptions {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
}

const BUTTON_SIZE = 56;
const VALUE_WIDTH = 56;

/** PLAN §10.5: `+`/`−` seat quantity control. Purely presentational — the caller owns validation. */
export class Stepper extends Phaser.GameObjects.Container {
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly minusButton: Button;
  private readonly plusButton: Button;
  private options: StepperOptions;

  constructor(scene: Phaser.Scene, x: number, y: number, options: StepperOptions) {
    super(scene, x, y);
    this.options = options;

    this.minusButton = new Button(scene, -(VALUE_WIDTH / 2 + BUTTON_SIZE / 2 + 6), 0, {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      label: '−',
      variant: 'ghost',
      onTap: () => this.change(-1),
    });
    this.valueText = scene.add
      .text(0, 0, String(options.value), { fontFamily: FONT_FAMILY, fontSize: '28px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0.5);
    this.plusButton = new Button(scene, VALUE_WIDTH / 2 + BUTTON_SIZE / 2 + 6, 0, {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      label: '+',
      variant: 'ghost',
      onTap: () => this.change(1),
    });

    this.add([this.minusButton, this.valueText, this.plusButton]);
    scene.add.existing(this);
    this.refresh();
  }

  /** Re-apply bounds after the caller's onChange may have shifted `max` (e.g. money spent elsewhere). */
  setOptions(options: StepperOptions): void {
    this.options = options;
    this.valueText.setText(String(options.value));
    this.refresh();
  }

  private change(delta: number): void {
    const min = this.options.min ?? 0;
    const next = this.options.value + delta;
    if (next < min || next > this.options.max) return;
    this.options.onChange(next);
  }

  private refresh(): void {
    const min = this.options.min ?? 0;
    this.minusButton.setEnabled(this.options.value > min);
    this.plusButton.setEnabled(this.options.value < this.options.max);
  }
}
