import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import type { Order } from '@domain/models';
import { CustomerAvatar } from '@ui/CustomerAvatar';
import { passportProfileOf } from '@ui/passportProfile';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Panel } from '@ui/Panel';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';

const PANEL_WIDTH = 560;
const PANEL_HEIGHT = 420;
const ROWS_TOP = 214;
const ROW_STEP = 50;

/** PLAN §10.7. Chạm ra ngoài hoặc nút ✕ để đóng; mở card không pause kiên nhẫn. */
export class PassportCard extends BaseOverlay {
  constructor(scene: Phaser.Scene, order: Order) {
    super(scene, { closeOnBackdropTap: true });

    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: PANEL_HEIGHT });
    const avatar = new CustomerAvatar(scene, 0, -PANEL_HEIGHT / 2 + 90, 55, order.spriteId);
    const name = scene.add.text(0, -PANEL_HEIGHT / 2 + 160, order.passport.name, TEXT_STYLES.heading).setOrigin(0.5);
    const profile = passportProfileOf(order);
    const rows = [
      { text: `${STRINGS.passport.birthDate}: ${profile.birthDate}`, bold: false },
      { text: `${STRINGS.passport.hometown}: ${profile.hometown}`, bold: false },
      { text: `${STRINGS.passport.bookedName}: ${order.passport.bookedName}`, bold: true },
    ].map((row, index) =>
      scene.add
        .text(0, -PANEL_HEIGHT / 2 + ROWS_TOP + index * ROW_STEP, row.text, { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: row.bold ? 'bold' : 'normal', color: toCssColor(COLORS.text) })
        .setOrigin(0.5),
    );
    const closeText = scene.add
      .text(-PANEL_WIDTH / 2 + 20, -PANEL_HEIGHT / 2 + 20, '✕', { fontFamily: FONT_FAMILY, fontSize: '28px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    closeText.on('pointerup', () => this.close());

    panel.add([avatar, name, ...rows, closeText]);
    this.add(panel);
  }
}
