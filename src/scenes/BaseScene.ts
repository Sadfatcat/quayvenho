import Phaser from 'phaser';
import { COLORS } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/** Every scene extends this: paints the sky background, then calls onCreate(). */
export abstract class BaseScene extends Phaser.Scene {
  constructor(key: string) {
    super(key);
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.sky).setOrigin(0).setScrollFactor(0);
    this.onCreate();
  }

  protected abstract onCreate(): void;
}
