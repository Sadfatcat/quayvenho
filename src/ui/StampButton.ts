import Phaser from 'phaser';
import { audio } from '@platform/audio';
import { DRAG_TAP_THRESHOLD_PX } from './layout';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface StampButtonOptions {
  width: number;
  height: number;
  label: string;
  color: number;
  /** Con dấu đang được đóng lên vé (viền nổi). */
  active: boolean;
  onTap: () => void;
}

const HANDLE_HEIGHT = 16;
const HANDLE_WIDTH_RATIO = 0.42;
const PRESS_SINK_PX = 8;
const PRESS_MS = 70;

/** Con dấu cao su: cán cầm ở trên, mặt dấu có chữ; bấm vào thì dấu "nhấn xuống" rồi đóng lên vé. */
export class StampButton extends Phaser.GameObjects.Container {
  private readonly stamp: Phaser.GameObjects.Container;
  private downX = 0;
  private downY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, options: StampButtonOptions) {
    super(scene, x, y);
    const { width, height, color } = options;
    const bodyHeight = height - HANDLE_HEIGHT;
    const g = scene.add.graphics();
    g.fillStyle(COLORS.primary, 1);
    g.fillRoundedRect((-width * HANDLE_WIDTH_RATIO) / 2, -height / 2, width * HANDLE_WIDTH_RATIO, HANDLE_HEIGHT + 6, 8);
    g.fillStyle(COLORS.primaryDark, 1);
    g.fillRoundedRect(-width / 2, -height / 2 + HANDLE_HEIGHT + 4, width, bodyHeight, 12);
    g.fillStyle(color, 1);
    g.fillRoundedRect(-width / 2, -height / 2 + HANDLE_HEIGHT, width, bodyHeight, 12);
    g.lineStyle(options.active ? 6 : 3, options.active ? COLORS.text : COLORS.primaryDark, 1);
    g.strokeRoundedRect(-width / 2, -height / 2 + HANDLE_HEIGHT, width, bodyHeight, 12);
    const label = scene.add
      .text(0, -height / 2 + HANDLE_HEIGHT + bodyHeight / 2, options.label, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: toCssColor(COLORS.cloud),
        align: 'center',
        wordWrap: { width: width - 16 },
      })
      .setOrigin(0.5);
    this.stamp = scene.add.container(0, 0, [g, label]);
    const hit = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    this.add([this.stamp, hit]);
    this.setSize(width, height);
    scene.add.existing(this);

    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.downX = pointer.x;
      this.downY = pointer.y;
    });
    hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (Math.hypot(pointer.x - this.downX, pointer.y - this.downY) > DRAG_TAP_THRESHOLD_PX) return;
      audio.playSfx('click');
      scene.tweens.add({ targets: this.stamp, y: PRESS_SINK_PX, duration: PRESS_MS, yoyo: true });
      options.onTap();
    });
  }
}
