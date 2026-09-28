import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { STRINGS } from '@data/strings';
import { COLORS, toCssColor } from '@ui/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.gameTitle, {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: toCssColor(COLORS.text),
      })
      .setOrigin(0.5);
  }
}
