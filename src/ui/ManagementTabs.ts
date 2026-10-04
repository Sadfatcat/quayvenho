import Phaser from 'phaser';
import { Button } from './Button';

export type ManagementTab = 'TICKETS' | 'PRICES' | 'SUPPORT' | 'STAFF';

export const MANAGEMENT_TAB_ORDER: readonly ManagementTab[] = ['TICKETS', 'PRICES', 'SUPPORT', 'STAFF'];
/** Mỗi mục quản lý là một scene riêng, chia sẻ cùng thanh mục để chuyển qua lại bất cứ lúc nào. */
export const MANAGEMENT_TAB_SCENE: Record<ManagementTab, string> = { TICKETS: 'Prep', PRICES: 'Price', SUPPORT: 'Shop', STAFF: 'Staff' };

export interface ManagementTabsOptions {
  width: number;
  height: number;
  labels: Record<ManagementTab, string>;
  active: ManagementTab;
  /** Mục chưa dùng được lúc này (ví dụ mua vé khi đang ở sau tổng kết). */
  disabled: ReadonlySet<ManagementTab>;
  onSelect: (tab: ManagementTab) => void;
}

const SEGMENT_GAP = 4;

/** Thanh 4 mục của màn quản lý: Mua vé / Giá vé / Đồ hỗ trợ / Nhân viên. */
export class ManagementTabs extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: ManagementTabsOptions) {
    super(scene, x, y);
    const segmentWidth = options.width / MANAGEMENT_TAB_ORDER.length;
    MANAGEMENT_TAB_ORDER.forEach((tab, index) => {
      const button = new Button(scene, -options.width / 2 + segmentWidth * index + segmentWidth / 2, 0, {
        width: segmentWidth - SEGMENT_GAP,
        height: options.height,
        label: options.labels[tab],
        variant: tab === options.active ? 'primary' : 'ghost',
        onTap: () => {
          if (tab !== options.active) options.onSelect(tab);
        },
      });
      button.setEnabled(!options.disabled.has(tab));
      this.add(button);
    });
    scene.add.existing(this);
  }
}
