import { devError } from '@platform/logger';
import { STRINGS } from '@data/strings';
import { Button } from '@ui/Button';
import { TEXT_STYLES } from '@ui/textStyles';
import { FONT_LOAD_SPECS } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';

const RETRY_BUTTON_Y_OFFSET = 140;

/**
 * Đợi phông chữ tự host tải xong (PLAN §10.1) rồi mới vào Title; lỗi thì hiện nút "Thử lại" (PLAN §10.2),
 * không để màn trắng. Chưa có atlas hình ảnh/audio để tải — thêm `this.load.*` vào đây khi có.
 */
export class PreloadScene extends BaseScene {
  constructor() {
    super('Preload');
  }

  protected onCreate(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.preload.loading, TEXT_STYLES.body).setOrigin(0.5);
    void this.loadFonts();
  }

  private async loadFonts(): Promise<void> {
    try {
      await Promise.all(FONT_LOAD_SPECS.map((spec) => document.fonts.load(spec, 'Việt')));
    } catch (error) {
      this.showRetry(error);
      return;
    }
    // Scene có thể đã bị đóng nếu người chơi rời tab lúc đang tải.
    if (this.scene.isActive()) this.scene.start('Title');
  }

  private showRetry(error: unknown): void {
    devError('Font load failed', error);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, STRINGS.preload.failed, TEXT_STYLES.label).setOrigin(0.5);
    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + RETRY_BUTTON_Y_OFFSET, {
      label: STRINGS.preload.retry,
      onTap: () => window.location.reload(),
    });
  }
}
