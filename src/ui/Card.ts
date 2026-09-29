import Phaser from 'phaser';
import { Button } from './Button';
import { Panel } from './Panel';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface CardOptions {
  width: number;
  height: number;
  title: string;
  description: string;
  priceLabel: string;
  /** Empty when buyable; otherwise shown instead of the buy button (e.g. "Đã mua", "Chưa đủ tiền"). */
  statusLabel: string;
  buttonLabel: string;
  buttonEnabled: boolean;
  onBuy: () => void;
}

const BUTTON_WIDTH = 140;
const BUTTON_HEIGHT = 64;

/** Reused by ShopScene for both upgrade and route cards (5.1). */
export class Card extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: CardOptions) {
    super(scene, x, y);
    const panel = new Panel(scene, options.width / 2, options.height / 2, { width: options.width, height: options.height });
    const title = scene.add
      .text(24, 18, options.title, { fontFamily: FONT_FAMILY, fontSize: '26px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0);
    const description = scene.add
      .text(24, 54, options.description, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: toCssColor(COLORS.textMuted),
        wordWrap: { width: options.width - BUTTON_WIDTH - 60 },
      })
      .setOrigin(0, 0);
    const priceText = scene.add
      .text(24, options.height - 30, options.priceLabel, { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0.5);
    this.add([panel, title, description, priceText]);

    const actionX = options.width - BUTTON_WIDTH / 2 - 20;
    const actionY = options.height - BUTTON_HEIGHT / 2 - 16;
    if (options.statusLabel) {
      this.add(
        scene.add
          .text(actionX, actionY, options.statusLabel, {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            color: toCssColor(COLORS.textMuted),
            align: 'center',
            wordWrap: { width: BUTTON_WIDTH },
          })
          .setOrigin(0.5),
      );
    } else {
      const button = new Button(scene, actionX, actionY, {
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
        label: options.buttonLabel,
        variant: 'primary',
        onTap: options.onBuy,
      });
      button.setEnabled(options.buttonEnabled);
      this.add(button);
    }

    scene.add.existing(this);
  }
}
