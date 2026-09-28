import Phaser from 'phaser';

export interface CountUpTextOptions {
  from?: number;
  to: number;
  durationMs?: number;
  format?: (value: number) => string;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
  onComplete?: () => void;
}

const DEFAULT_DURATION_MS = 800;
const defaultFormat = (value: number): string => String(Math.round(value));

/** Animates a number from `from` to `to`; skip() jumps straight to the end (PLAN §10.7 tap-to-skip). */
export class CountUpText extends Phaser.GameObjects.Text {
  private readonly toValue: number;
  private readonly formatValue: (value: number) => string;
  private readonly onCompleteCb: (() => void) | undefined;
  private tween: Phaser.Tweens.Tween | null;

  constructor(scene: Phaser.Scene, x: number, y: number, options: CountUpTextOptions) {
    const fromValue = options.from ?? 0;
    const formatValue = options.format ?? defaultFormat;
    super(scene, x, y, formatValue(fromValue), options.style ?? {});
    this.toValue = options.to;
    this.formatValue = formatValue;
    this.onCompleteCb = options.onComplete;
    scene.add.existing(this);

    const proxy = { value: fromValue };
    this.tween = scene.tweens.add({
      targets: proxy,
      value: options.to,
      duration: options.durationMs ?? DEFAULT_DURATION_MS,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.setText(formatValue(proxy.value)),
      onComplete: () => {
        this.tween = null;
        this.onCompleteCb?.();
      },
    });
  }

  skip(): void {
    this.tween?.stop();
    this.tween = null;
    this.setText(this.formatValue(this.toValue));
    this.onCompleteCb?.();
  }
}
