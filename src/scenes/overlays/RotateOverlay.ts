import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Panel } from '@ui/Panel';
import { TEXT_STYLES } from '@ui/textStyles';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';

const PANEL_WIDTH = 560;
const PANEL_HEIGHT = 260;
const ROTATE_DEPTH = 2000;
const MESSAGE_PADDING = 60;

/** PLAN §10.1/§11.2: chặn chơi khi xoay ngang (điện thoại), nhắc xoay dọc lại. Nằm trên mọi overlay khác. */
export class RotateOverlay extends BaseOverlay {
  constructor(scene: Phaser.Scene) {
    super(scene, { closeOnBackdropTap: false });
    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: PANEL_HEIGHT });
    const title = scene.add.text(0, -PANEL_HEIGHT / 2 + 70, STRINGS.rotate.title, TEXT_STYLES.heading).setOrigin(0.5);
    const message = scene.add
      .text(0, 30, STRINGS.rotate.message, { ...TEXT_STYLES.label, align: 'center', wordWrap: { width: PANEL_WIDTH - MESSAGE_PADDING } })
      .setOrigin(0.5);
    panel.add([title, message]);
    this.add(panel);
    this.setDepth(ROTATE_DEPTH);
  }
}
