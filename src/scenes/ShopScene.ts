import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { ROUTES } from '@data/routes';
import { UPGRADES } from '@data/upgrades';
import { stampImageKey, upgradeImageKey } from '@ui/itemImages';
import { shopContext } from '@domain/dayCycle';
import type { Command, GameState, Route, UpgradeDef } from '@domain/models';
import { checkRouteUnlock, checkUpgrade, type RouteUnlockError, type UpgradeError } from '@domain/upgrades';
import { Card } from '@ui/Card';
import { InfoBox } from '@ui/InfoBox';
import { HOLIDAYS } from '@data/holidays';
import { getRoute } from '@domain/routes';
import { formatMoney } from '@ui/format';
import { ScrollList } from '@ui/ScrollList';
import { SegmentedControl } from '@ui/SegmentedControl';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { addManagementChrome, type ManagementChrome } from './managementChrome';
import { promptForPwaUpdate } from './overlays/UpdatePrompt';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

type ShopItem = { kind: 'upgrade'; upgrade: UpgradeDef } | { kind: 'route'; route: Route };
type Tab = 'upgrades' | 'routes';

const SEGMENT_Y = 306;
const TEASER_TOP = 350;
const TEASER_SIDE_MARGIN = 20;
const LIST_Y = 424;
const LIST_BOTTOM_MARGIN = 170;
const CARD_HEIGHT = 190;
const CARD_GAP = 16;
const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP;

const purchasableRoutes = (): Route[] => ROUTES.filter((route) => route.unlock !== null);

/** PLAN §10.9. */
export class ShopScene extends BaseScene {
  private tab: Tab = 'upgrades';
  private list!: ScrollList<ShopItem>;
  private chrome!: ManagementChrome;
  private teaserBox!: InfoBox;
  private unsubscribeEvents: (() => void) | null = null;

  constructor() {
    super('Shop');
    this.backgroundTheme = 'shop';
    this.musicTrack = 'calm';
  }

  protected onCreate(): void {
    promptForPwaUpdate(this);
    this.buildLayout();
    this.unsubscribeEvents = sessionBridge.onEvents(() => this.renderAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeEvents?.());
    this.renderAll();
  }

  private buildLayout(): void {
    this.chrome = addManagementChrome(this, 'SUPPORT', true);

    new SegmentedControl(this, GAME_WIDTH / 2, SEGMENT_Y, {
      width: 500,
      height: 72,
      labels: [STRINGS.shop.tabUpgrades, STRINGS.shop.tabRoutes],
      selectedIndex: 0,
      onChange: (index) => {
        this.tab = index === 0 ? 'upgrades' : 'routes';
        this.list.setItems(this.itemsForTab());
      },
    });

    this.teaserBox = new InfoBox(this, GAME_WIDTH / 2, TEASER_TOP, { width: GAME_WIDTH - 2 * TEASER_SIDE_MARGIN, tone: 'warning', fontSize: 20, paddingY: 6 });

    this.list = new ScrollList<ShopItem>(this, {
      x: 20,
      y: LIST_Y,
      width: GAME_WIDTH - 40,
      height: GAME_HEIGHT - LIST_Y - LIST_BOTTOM_MARGIN,
      itemHeight: ROW_HEIGHT,
      items: this.itemsForTab(),
      renderItem: (item) => this.renderItem(item),
    });

  }

  private itemsForTab(): ShopItem[] {
    return this.tab === 'upgrades'
      ? UPGRADES.map((upgrade) => ({ kind: 'upgrade', upgrade }) as const)
      : purchasableRoutes().map((route) => ({ kind: 'route', route }) as const);
  }

  private renderAll(): void {
    const state = sessionBridge.current.state;
    this.chrome.refresh(state);
    this.teaserBox.setText(this.tomorrowHolidayTeaser(state));
    this.list.setItems(this.itemsForTab());
  }

  private tomorrowHolidayTeaser(state: GameState): string {
    const holiday = state.today.event;
    if (holiday.type !== 'RUSH') return '';
    const name = HOLIDAYS.find((candidate) => candidate.id === holiday.holidayId)?.name ?? '';
    const routes = holiday.hotRoutes.map((routeId) => getRoute(routeId).name).join(', ');
    return STRINGS.shop.holidayTeaser.replace('{holiday}', name).replace('{routes}', routes);
  }

  private renderItem(item: ShopItem): Phaser.GameObjects.Container {
    const state = sessionBridge.current.state;
    const ctx = shopContext(state);
    const width = GAME_WIDTH - 40;

    if (item.kind === 'upgrade') {
      const upgradeText = STRINGS.upgrades[item.upgrade.id] ?? { name: item.upgrade.id, description: '' };
      const owned = state.upgrades.includes(item.upgrade.id);
      const result = checkUpgrade(item.upgrade.id, state.upgrades, ctx);
      return new Card(this, 0, 0, {
        width,
        height: CARD_HEIGHT,
        title: upgradeText.name,
        description: upgradeText.description.replace('{minTravelViet}', String(item.upgrade.minTravelViet ?? '')),
        priceLabel: formatMoney(item.upgrade.cost),
        statusLabel: owned ? STRINGS.shop.owned : result.ok ? '' : this.upgradeStatusText(result.reason, item.upgrade.minDay, item.upgrade.minTravelViet),
        imageKey: upgradeImageKey(item.upgrade.id),
        buttonLabel: STRINGS.shop.buy,
        buttonEnabled: result.ok,
        onBuy: () => this.confirmPurchase(upgradeText.name, { type: 'SHOP_BUY_UPGRADE', upgradeId: item.upgrade.id }),
      });
    }

    const unlocked = state.unlockedRoutes.includes(item.route.id);
    const result = checkRouteUnlock(item.route.id, state.unlockedRoutes, ctx);
    const cost = item.route.unlock?.cost ?? 0;
    return new Card(this, 0, 0, {
      width,
      height: CARD_HEIGHT,
      title: item.route.name,
      description: item.route.flavorText ?? '',
      priceLabel: formatMoney(cost),
      statusLabel: unlocked ? STRINGS.shop.unlocked : result.ok ? '' : this.routeStatusText(result.reason, item.route.unlock?.minTravelViet ?? null),
      imageKey: stampImageKey(item.route.icon),
      buttonLabel: STRINGS.shop.buy,
      buttonEnabled: result.ok,
      onBuy: () => this.confirmPurchase(item.route.name, { type: 'SHOP_UNLOCK_ROUTE', routeId: item.route.id }),
    });
  }

  private upgradeStatusText(reason: UpgradeError, minDay: number | null, minTravelViet: number | null): string {
    switch (reason) {
      case 'NOT_ENOUGH_MONEY':
        return STRINGS.shop.statusNotEnoughMoney;
      case 'DAY_TOO_EARLY':
        return `${STRINGS.shop.statusDayTooEarly} ${minDay ?? ''}`;
      case 'TRAVELVIET_LOCKED':
        return STRINGS.shop.statusTravelVietLocked;
      case 'TRAVELVIET_TOO_LOW':
        return `${STRINGS.shop.statusTravelVietTooLow} ${minTravelViet ?? ''}`;
      default:
        return '';
    }
  }

  private routeStatusText(reason: RouteUnlockError, minTravelViet: number | null): string {
    switch (reason) {
      case 'NOT_ENOUGH_MONEY':
        return STRINGS.shop.statusNotEnoughMoney;
      case 'TRAVELVIET_LOCKED':
        return STRINGS.shop.statusTravelVietLocked;
      case 'TRAVELVIET_TOO_LOW':
        return `${STRINGS.shop.statusTravelVietTooLow} ${minTravelViet ?? ''}`;
      default:
        return '';
    }
  }

  private confirmPurchase(itemName: string, command: Command): void {
    new DialogOverlay(this, {
      title: STRINGS.shop.confirmTitle,
      message: itemName,
      buttons: [
        { label: STRINGS.shop.confirmCancel, variant: 'ghost', onTap: () => {} },
        { label: STRINGS.shop.confirmBuy, variant: 'primary', onTap: () => sessionBridge.dispatch(command) },
      ],
    });
  }

}
