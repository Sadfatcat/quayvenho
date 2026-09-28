import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import type { Extra } from '@domain/models';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface ExtrasTogglesOptions {
  width: number;
  selected: readonly Extra[];
  onToggle: (extra: Extra) => void;
}

const EXTRAS: readonly Extra[] = ['VEG_MEAL', 'WHEELCHAIR', 'INSURANCE'];
const ITEM_HEIGHT = 72;
const GAP = 12;

/** Bước C (phần dịch vụ): 3 nút bật/tắt, chỉ dựng khi cơ chế extras đã mở (kiểm ở CounterScene). */
export class ExtrasToggles extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: ExtrasTogglesOptions) {
    super(scene, x, y);
    const itemWidth = (options.width - GAP * 2) / 3;
    EXTRAS.forEach((extra, index) => {
      const selected = options.selected.includes(extra);
      const itemX = index * (itemWidth + GAP) + itemWidth / 2;
      const rect = scene.add
        .rectangle(itemX, 0, itemWidth, ITEM_HEIGHT, selected ? COLORS.primary : COLORS.cloud)
        .setStrokeStyle(2, COLORS.text, 0.2)
        .setInteractive({ useHandCursor: true });
      rect.on('pointerup', () => options.onToggle(extra));
      const label = scene.add
        .text(itemX, 0, `${STRINGS.counter.extraIcon[extra]} ${STRINGS.counter.extras[extra]}`, {
          fontFamily: FONT_FAMILY,
          fontSize: '19px',
          color: toCssColor(selected ? COLORS.cloud : COLORS.text),
          align: 'center',
          wordWrap: { width: itemWidth - 10 },
        })
        .setOrigin(0.5);
      this.add([rect, label]);
    });
    scene.add.existing(this);
  }
}
