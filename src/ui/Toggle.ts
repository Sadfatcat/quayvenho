import Phaser from 'phaser';
import { COLORS } from './theme';

export interface ToggleOptions {
  value: boolean;
  onChange: (value: boolean) => void;
}

const WIDTH = 88;
const HEIGHT = 48;
const KNOB_RADIUS = 20;

/** Reused in SettingsOverlay (haptics) and anywhere else a plain on/off switch is needed. */
export class Toggle extends Phaser.GameObjects.Container {
  private readonly track: Phaser.GameObjects.Rectangle;
  private readonly knob: Phaser.GameObjects.Arc;
  private value: boolean;
  private readonly onChange: (value: boolean) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, options: ToggleOptions) {
    super(scene, x, y);
    this.value = options.value;
    this.onChange = options.onChange;

    this.track = scene.add.rectangle(0, 0, WIDTH, HEIGHT, this.trackColor()).setOrigin(0.5);
    this.knob = scene.add.circle(this.knobX(), 0, KNOB_RADIUS, COLORS.cloud);
    this.add([this.track, this.knob]);
    scene.add.existing(this);

    this.track.setInteractive({ useHandCursor: true });
    this.track.on('pointerup', () => this.toggle());
  }

  private toggle(): void {
    this.value = !this.value;
    this.track.setFillStyle(this.trackColor());
    this.knob.setX(this.knobX());
    this.onChange(this.value);
  }

  private knobX(): number {
    return this.value ? WIDTH / 2 - KNOB_RADIUS - 4 : -WIDTH / 2 + KNOB_RADIUS + 4;
  }

  private trackColor(): number {
    return this.value ? COLORS.success : COLORS.disabled;
  }
}
