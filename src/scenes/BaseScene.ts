import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { ToastQueue } from '@ui/Toast';
import { COLORS } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const SECOND_TAB_DETECTED_EVENT = 'secondTabDetected';

/** Every scene extends this: paints the sky background, watches for a second tab, then calls onCreate(). */
export abstract class BaseScene extends Phaser.Scene {
  constructor(key: string) {
    super(key);
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.sky).setOrigin(0).setScrollFactor(0);
    const onSecondTab = (): void => {
      new ToastQueue(this).show(STRINGS.title.secondTabWarning, 4000);
    };
    this.game.events.on(SECOND_TAB_DETECTED_EVENT, onSecondTab);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(SECOND_TAB_DETECTED_EVENT, onSecondTab));
    this.onCreate();
  }

  protected abstract onCreate(): void;
}
