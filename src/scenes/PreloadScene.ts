import { STRINGS } from '@data/strings';
import { TEXT_STYLES } from '@ui/textStyles';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';

/**
 * Không có atlas/audio/font riêng để tải ở Giai đoạn 4 (grey box) — asset thật
 * vào ở Giai đoạn 6 (`docs/ROADMAP.md` 6.2), lúc đó `this.load.*` sẽ được thêm
 * vào `preload()` và thanh tiến trình này sẽ có gì đó để hiện.
 */
export class PreloadScene extends BaseScene {
  constructor() {
    super('Preload');
  }

  protected onCreate(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.preload.loading, TEXT_STYLES.body).setOrigin(0.5);
    this.scene.start('Title');
  }
}
