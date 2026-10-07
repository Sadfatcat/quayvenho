import Phaser from 'phaser';
import { Button } from './Button';
import { Panel } from './Panel';
import { formatMoney } from './format';
import { SCREEN_MARGIN } from './layout';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

const EDGE_PADDING = SCREEN_MARGIN;
const ICON_BUTTON_SIZE = 72;
const ICON_BUTTON_GAP = 12;
const MONEY_BOX = { width: 210, height: 52 };

export interface TopBarOptions {
  width: number;
  leftLabel: string;
  money: number;
  travelViet: number | null;
  icon: string;
  onIconTap: () => void;
  /** Nút phụ ngay bên trái nút chính (vd. đóng cửa sớm ở màn Quầy). */
  secondaryIcon?: { label: string; onTap: () => void };
}

/** Reused by CounterScene (clock/⏸) and PrepScene (day/⚙): left label + money + rating + right icon button. */
export class TopBar extends Phaser.GameObjects.Container {
  private readonly leftText: Phaser.GameObjects.Text;
  private readonly moneyText: Phaser.GameObjects.Text;
  private readonly travelVietText: Phaser.GameObjects.Text;
  private readonly secondaryButton: Button | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, options: TopBarOptions) {
    super(scene, x, y);
    this.leftText = scene.add
      .text(EDGE_PADDING, 0, options.leftLabel, { fontFamily: FONT_FAMILY, fontSize: '30px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0.5);
    this.moneyText = scene.add
      .text(options.width * 0.42, 0, '', { fontFamily: FONT_FAMILY, fontSize: '30px', fontStyle: 'bold', color: toCssColor(COLORS.moneyGreen) })
      .setOrigin(0.5);
    const moneyBox = new Panel(scene, options.width * 0.42, 0, { width: MONEY_BOX.width, height: MONEY_BOX.height, fill: COLORS.cloud, strokeColor: COLORS.moneyGreen, strokeWidth: 3 });
    this.travelVietText = scene.add
      .text(options.width * 0.68, 0, '', { fontFamily: FONT_FAMILY, fontSize: '26px', color: toCssColor(COLORS.warning) })
      .setOrigin(0.5);
    const iconButton = new Button(scene, options.width - SCREEN_MARGIN - ICON_BUTTON_SIZE / 2, 0, {
      width: ICON_BUTTON_SIZE,
      height: ICON_BUTTON_SIZE,
      label: options.icon,
      variant: 'ghost',
      onTap: options.onIconTap,
    });
    this.add([this.leftText, moneyBox, this.moneyText, this.travelVietText, iconButton]);
    if (options.secondaryIcon) {
      this.secondaryButton = new Button(scene, options.width - SCREEN_MARGIN - ICON_BUTTON_SIZE - ICON_BUTTON_GAP - ICON_BUTTON_SIZE / 2, 0, {
        width: ICON_BUTTON_SIZE,
        height: ICON_BUTTON_SIZE,
        label: options.secondaryIcon.label,
        variant: 'ghost',
        onTap: options.secondaryIcon.onTap,
      });
      this.add(this.secondaryButton);
    }
    scene.add.existing(this);
    this.setMoney(options.money);
    this.setTravelViet(options.travelViet);
  }

  setLeftLabel(text: string): void {
    this.leftText.setText(text);
  }

  setMoney(amount: number): void {
    this.moneyText.setText(formatMoney(amount));
  }

  setSecondaryEnabled(enabled: boolean): void {
    this.secondaryButton?.setEnabled(enabled);
  }

  setTravelViet(value: number | null): void {
    this.travelVietText.setText(value === null ? '' : `⭐ ${value.toFixed(1)}`);
  }
}
