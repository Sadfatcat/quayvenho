import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { Button } from './Button';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface TopBarOptions {
  width: number;
  leftLabel: string;
  money: number;
  travelViet: number | null;
  icon: string;
  onIconTap: () => void;
}

/** Reused by CounterScene (clock/⏸) and PrepScene (day/⚙): left label + money + rating + right icon button. */
export class TopBar extends Phaser.GameObjects.Container {
  private readonly leftText: Phaser.GameObjects.Text;
  private readonly moneyText: Phaser.GameObjects.Text;
  private readonly travelVietText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, options: TopBarOptions) {
    super(scene, x, y);
    this.leftText = scene.add
      .text(0, 0, options.leftLabel, { fontFamily: FONT_FAMILY, fontSize: '30px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0.5);
    this.moneyText = scene.add
      .text(options.width * 0.42, 0, '', { fontFamily: FONT_FAMILY, fontSize: '26px', color: toCssColor(COLORS.text) })
      .setOrigin(0.5);
    this.travelVietText = scene.add
      .text(options.width * 0.68, 0, '', { fontFamily: FONT_FAMILY, fontSize: '26px', color: toCssColor(COLORS.warning) })
      .setOrigin(0.5);
    const iconButton = new Button(scene, options.width - 44, 0, {
      width: 72,
      height: 72,
      label: options.icon,
      variant: 'ghost',
      onTap: options.onIconTap,
    });
    this.add([this.leftText, this.moneyText, this.travelVietText, iconButton]);
    scene.add.existing(this);
    this.setMoney(options.money);
    this.setTravelViet(options.travelViet);
  }

  setLeftLabel(text: string): void {
    this.leftText.setText(text);
  }

  setMoney(amount: number): void {
    this.moneyText.setText(`${amount} ${STRINGS.common.currencySuffix}`);
  }

  setTravelViet(value: number | null): void {
    this.travelVietText.setText(value === null ? '' : `⭐ ${value.toFixed(1)}`);
  }
}
