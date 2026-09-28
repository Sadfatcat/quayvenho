import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

const BACKDROP_ALPHA = 0.5;
const OVERLAY_DEPTH = 1000;

export interface BaseOverlayOptions {
  closeOnBackdropTap?: boolean;
}

/** Full-screen dim layer that blocks input to whatever is behind it. Extend for Dialog/Pause/Settings/etc. */
export class BaseOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, options: BaseOverlayOptions = {}) {
    super(scene, 0, 0);
    const backdrop = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, BACKDROP_ALPHA).setOrigin(0).setInteractive();
    if (options.closeOnBackdropTap) backdrop.on('pointerup', () => this.close());
    this.add(backdrop);
    scene.add.existing(this);
    this.setDepth(OVERLAY_DEPTH);
  }

  close(): void {
    this.destroy();
  }
}
