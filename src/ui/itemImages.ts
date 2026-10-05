import type Phaser from 'phaser';
import { ROUTES } from '@data/routes';
import { UPGRADES } from '@data/upgrades';
import type { Extra } from '@domain/models';
import { formatClock } from '@domain/clock';

const ITEM_DIRECTORY = 'assets/items';

export const stampImageKey = (routeIcon: string): string => `stamp_${routeIcon}`;
export const markImageKey = (routeIcon: string): string => `mark_${routeIcon}`;
export const timeStampImageKey = (departAt: number): string => `time_${formatClock(departAt).replace(':', '')}`;
export const upgradeImageKey = (upgradeId: string): string => `upgrade_${upgradeId.toLowerCase()}`;
export const ticketStackImageKey = (cabin: 'ECONOMY' | 'BUSINESS'): string => (cabin === 'ECONOMY' ? 'stack_eco' : 'stack_biz');
export const printerImageKey = (upgraded: boolean): string => (upgraded ? 'printer_upgraded' : 'printer_basic');
export const ticketStateImageKey = (printed: boolean): string => (printed ? 'ticket_printed' : 'ticket_draft');
const SERVICE_IMAGE: Record<Extra, string> = { VEG_MEAL: 'service_meal', WHEELCHAIR: 'service_wheelchair', INSURANCE: 'service_insurance' };
export const serviceImageKey = (extra: Extra): string => SERVICE_IMAGE[extra];

/** Ảnh vật phẩm là tuỳ chọn: thiếu ảnh thì UI tự rơi về dạng vẽ bằng hình/chữ. */
export const hasItemImage = (scene: Phaser.Scene, key: string): boolean => scene.textures.exists(key);

export const loadItemImages = (scene: Phaser.Scene): void => {
  const keys = [
    ...ROUTES.flatMap((route) => [stampImageKey(route.icon), markImageKey(route.icon)]),
    ...['2130', '2230', '2330', '0030', '0130'].map((time) => `time_${time}`),
    'stack_eco',
    'stack_biz',
    printerImageKey(false),
    printerImageKey(true),
    ticketStateImageKey(false),
    ticketStateImageKey(true),
    ...Object.values(SERVICE_IMAGE),
    ...UPGRADES.map((upgrade) => upgradeImageKey(upgrade.id)),
  ];
  for (const key of keys) scene.load.image(key, `${ITEM_DIRECTORY}/${key}.png`);
};
