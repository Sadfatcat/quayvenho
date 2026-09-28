import { STRINGS } from '@data/strings';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';

export class BootScene extends BaseScene {
  constructor() {
    super('Boot');
  }

  protected onCreate(): void {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('playground')) {
      this.scene.start('Playground');
      return;
    }
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.gameTitle, {
        fontFamily: FONT_FAMILY,
        fontSize: '64px',
        color: toCssColor(COLORS.text),
      })
      .setOrigin(0.5);
  }
}
