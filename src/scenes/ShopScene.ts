import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { ROUTES } from '@data/routes';
import { UPGRADE_DESCRIPTIONS, UPGRADES } from '@data/upgrades';
import { shopContext } from '@domain/dayCycle';
import type { Route, UpgradeDef } from '@domain/models';
import { checkRouteUnlock, checkUpgrade, type RouteUnlockError, type UpgradeError } from '@domain/upgrades';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { ScrollList } from '@ui/ScrollList';
import { SegmentedControl } from '@ui/SegmentedControl';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

type ShopItem = { kind: 'upgrade'; upgrade: UpgradeDef } | { kind: 'route'; route: Route };
type Tab = 'upgrades' | 'routes';

const LIST_Y = 260;
const CARD_HEIGHT = 190;
const CARD_GAP = 16;
const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP;

const purchasableRoutes = (): Route[] => ROUTES.filter((route) => route.unlock !== null);

/** PLAN §10.9. */
export class ShopScene extends BaseScene {
  private tab: Tab = 'upgrades';
  private list!: ScrollList<ShopItem>;
  private moneyText!: Phaser.GameObjects.Text;
  private nextDayButton!: Button;
  private unsubscribeEvents: (() => void) | null = null;

  constructor() {
    super('Shop');
  }

  protected onCreate(): void {
    this.buildLayout();
    this.unsubscribeEvents = sessionBridge.onEvents(() => this.renderAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeEvents?.());
    this.renderAll();
  }

  private buildLayout(): void {
    this.add.text(GAME_WIDTH / 2, 90, STRINGS.shop.title, TEXT_STYLES.heading).setOrigin(0.5);
    this.moneyText = this.add.text(GAME_WIDTH / 2, 140, '', { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5);

    new SegmentedControl(this, GAME_WIDTH / 2, 200, {
      width: 500,
      height: 72,
      labels: [STRINGS.shop.tabUpgrades, STRINGS.shop.tabRoutes],
      selectedIndex: 0,
      onChange: (index) => {
        this.tab = index === 0 ? 'upgrades' : 'routes';
        this.list.setItems(this.itemsForTab());
      },
    });

    this.list = new ScrollList<ShopItem>(this, {
      x: 20,
      y: LIST_Y,
      width: GAME_WIDTH - 40,
      height: GAME_HEIGHT - LIST_Y - 140,
      itemHeight: ROW_HEIGHT,
      items: this.itemsForTab(),
      renderItem: (item) => this.renderItem(item),
    });

    this.nextDayButton = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 80, {
      width: 360,
      height: 96,
      label: STRINGS.shop.nextDay,
      variant: 'primary',
      onTap: () => this.handleNextDay(),
    });
  }

  private itemsForTab(): ShopItem[] {
    return this.tab === 'upgrades'
      ? UPGRADES.map((upgrade) => ({ kind: 'upgrade', upgrade }) as const)
      : purchasableRoutes().map((route) => ({ kind: 'route', route }) as const);
  }

  private renderAll(): void {
    const state = sessionBridge.current.state;
    this.moneyText.setText(`${state.money} ${STRINGS.common.currencySuffix}`);
    this.list.setItems(this.itemsForTab());
  }

  private renderItem(item: ShopItem): Phaser.GameObjects.Container {
    const state = sessionBridge.current.state;
    const ctx = shopContext(state);
    const width = GAME_WIDTH - 40;

    if (item.kind === 'upgrade') {
      const owned = state.upgrades.includes(item.upgrade.id);
      const result = checkUpgrade(item.upgrade.id, state.upgrades, ctx);
      return new Card(this, 0, 0, {
        width,
        height: CARD_HEIGHT,
        title: item.upgrade.name,
        description: UPGRADE_DESCRIPTIONS[item.upgrade.id] ?? '',
        priceLabel: `${item.upgrade.cost} ${STRINGS.common.currencySuffix}`,
        statusLabel: owned ? STRINGS.shop.owned : result.ok ? '' : this.upgradeStatusText(result.reason, item.upgrade.minDay),
        buttonLabel: STRINGS.shop.buy,
        buttonEnabled: result.ok,
        onBuy: () => this.confirmBuyUpgrade(item.upgrade),
      });
    }

    const unlocked = state.unlockedRoutes.includes(item.route.id);
    const result = checkRouteUnlock(item.route.id, state.unlockedRoutes, ctx);
    const cost = item.route.unlock?.cost ?? 0;
    return new Card(this, 0, 0, {
      width,
      height: CARD_HEIGHT,
      title: item.route.name,
      description: '',
      priceLabel: `${cost} ${STRINGS.common.currencySuffix}`,
      statusLabel: unlocked ? STRINGS.shop.unlocked : result.ok ? '' : this.routeStatusText(result.reason, item.route.unlock?.minTravelViet ?? null),
      buttonLabel: STRINGS.shop.buy,
      buttonEnabled: result.ok,
      onBuy: () => this.confirmUnlockRoute(item.route),
    });
  }

  private upgradeStatusText(reason: UpgradeError, minDay: number | null): string {
    switch (reason) {
      case 'NOT_ENOUGH_MONEY':
        return STRINGS.shop.statusNotEnoughMoney;
      case 'DAY_TOO_EARLY':
        return `${STRINGS.shop.statusDayTooEarly} ${minDay ?? ''}`;
      case 'TRAVELVIET_LOCKED':
        return STRINGS.shop.statusTravelVietLocked;
      case 'TRAVELVIET_TOO_LOW':
        return STRINGS.shop.statusTravelVietTooLow;
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

  private confirmBuyUpgrade(upgrade: UpgradeDef): void {
    new DialogOverlay(this, {
      title: STRINGS.shop.confirmTitle,
      message: upgrade.name,
      buttons: [
        { label: STRINGS.shop.confirmCancel, variant: 'ghost', onTap: () => {} },
        { label: STRINGS.shop.confirmBuy, variant: 'primary', onTap: () => sessionBridge.dispatch({ type: 'SHOP_BUY_UPGRADE', upgradeId: upgrade.id }) },
      ],
    });
  }

  private confirmUnlockRoute(route: Route): void {
    new DialogOverlay(this, {
      title: STRINGS.shop.confirmTitle,
      message: route.name,
      buttons: [
        { label: STRINGS.shop.confirmCancel, variant: 'ghost', onTap: () => {} },
        { label: STRINGS.shop.confirmBuy, variant: 'primary', onTap: () => sessionBridge.dispatch({ type: 'SHOP_UNLOCK_ROUTE', routeId: route.id }) },
      ],
    });
  }

  private handleNextDay(): void {
    this.nextDayButton.lock();
    const events = sessionBridge.dispatch({ type: 'NEXT_DAY' });
    if (events.some((event) => event.type === 'COMMAND_REJECTED')) {
      this.nextDayButton.unlock();
      return;
    }
    this.scene.start('Prep');
  }
}
