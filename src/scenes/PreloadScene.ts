import { devError } from '@platform/logger';
import { STRINGS } from '@data/strings';
import { Button } from '@ui/Button';
import { ATLAS_KEY, BEO_ATLAS_KEY } from '@ui/CustomerAvatar';
import { TEXT_STYLES } from '@ui/textStyles';
import { FONT_LOAD_SPECS } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';

const RETRY_BUTTON_Y_OFFSET = 140;

/**
 * Đợi phông chữ tự host và atlas nhân vật tải xong (PLAN §10.1–10.2) rồi mới vào Title; lỗi thì hiện nút
 * "Thử lại", không để màn trắng. Chưa có audio file để tải — thêm `this.load.*` vào `preload()` khi có.
 */
export class PreloadScene extends BaseScene {
  constructor() {
    super('Preload');
    this.backgroundTheme = 'title';
  }

  /** Tải atlas nhân vật (khách, Béo, logo); lỗi tải được báo ở `onCreate` bằng nút "Thử lại". */
  preload(): void {
    this.load.atlas(ATLAS_KEY, 'assets/atlas/characters.png', 'assets/atlas/characters.json');
    this.load.atlas(BEO_ATLAS_KEY, 'assets/atlas/beo.png', 'assets/atlas/beo.json');
  }

  protected onCreate(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.preload.loading, TEXT_STYLES.body).setOrigin(0.5);
    void this.loadFonts();
  }

  private async loadFonts(): Promise<void> {
    try {
      await Promise.all(FONT_LOAD_SPECS.map((spec) => document.fonts.load(spec, 'Việt')));
      if (!this.textures.exists(ATLAS_KEY) || !this.textures.exists(BEO_ATLAS_KEY)) throw new Error('atlas nhân vật không tải được');
    } catch (error) {
      this.showRetry(error);
      return;
    }
    // Scene có thể đã bị đóng nếu người chơi rời tab lúc đang tải.
    if (this.scene.isActive()) this.scene.start('Title');
  }

  private showRetry(error: unknown): void {
    devError('Preload failed', error);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, STRINGS.preload.failed, TEXT_STYLES.label).setOrigin(0.5);
    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + RETRY_BUTTON_Y_OFFSET, {
      label: STRINGS.preload.retry,
      onTap: () => window.location.reload(),
    });
  }
}
