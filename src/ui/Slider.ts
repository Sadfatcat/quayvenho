import Phaser from 'phaser';
import { clamp } from '@domain/common/math';
import { DragController } from './DragController';
import { COLORS } from './theme';

export interface SliderOptions {
  width: number;
  /** 0..1 */
  initialValue: number;
  /** Fired once per drag, on release — avoids spamming a dispatch/save per pixel. */
  onCommit: (value: number) => void;
}

const HANDLE_RADIUS = 24;
const TRACK_HEIGHT = 10;

/** Generic 0..1 slider, reused in SettingsOverlay for music/sfx volume. */
export class Slider extends Phaser.GameObjects.Container {
  private readonly widthValue: number;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly handle: Phaser.GameObjects.Arc;
  private readonly dragController: DragController;
  private value: number;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SliderOptions) {
    super(scene, x, y);
    this.widthValue = options.width;
    this.value = clamp(options.initialValue, 0, 1);

    const track = scene.add.rectangle(0, 0, options.width, TRACK_HEIGHT, COLORS.disabled).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(0, 0, this.widthValue * this.value, TRACK_HEIGHT, COLORS.primary).setOrigin(0, 0.5);
    this.handle = scene.add.circle(this.xFor(this.value), 0, HANDLE_RADIUS, COLORS.primary);
    this.handle.setInteractive();

    this.add([track, this.fill, this.handle]);
    scene.add.existing(this);

    this.dragController = new DragController(this.handle, {
      onDragMove: (point) => {
        const local = this.getLocalPoint(point.x, point.y);
        this.value = clamp(local.x / this.widthValue, 0, 1);
        this.handle.setX(this.xFor(this.value));
        this.fill.setSize(this.widthValue * this.value, TRACK_HEIGHT);
      },
      onDragEnd: () => options.onCommit(this.value),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.dragController.destroy();
    super.destroy(fromScene);
  }

  private xFor(value: number): number {
    return value * this.widthValue;
  }
}
