import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { formatClock } from '@domain/clock';
import { isTravelVietOpen, travelVietScore } from '@domain/demand';
import { bulkDiscountRate, purchaseCost } from '@domain/economy';
import { maxPurchasable, pendingKey, pendingTotalCost } from '@domain/inventory';
import type { CabinClass, Flight, GameState, TodayState } from '@domain/models';
import { getRoute } from '@domain/routes';
import { routeOfFlight } from '@domain/schedule';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { ScrollList } from '@ui/ScrollList';
import { Stepper } from '@ui/Stepper';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { TopBar } from '@ui/TopBar';
import { GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { DialogOverlay } from './overlays/DialogOverlay';
import { PauseOverlay } from './overlays/PauseOverlay';
import { sessionBridge } from './sessionBridge';

const ROW_HEIGHT = 150;
const LIST_Y = 230;
const LIST_HEIGHT = 1060 - LIST_Y;
const TOTAL_Y = 1095;
const BUTTON_ROW_Y = 1180;
const BUTTON_HEIGHT = 88;

/** PLAN §10.5 (Kho). Grey box: nội dung tiếng Việt của banner/hộp thoại xem `strings.prep.*`. */
export class PrepScene extends BaseScene {
  private topBar!: TopBar;
  private bannerText!: Phaser.GameObjects.Text;
  private flightList!: ScrollList<Flight>;
  private totalText!: Phaser.GameObjects.Text;
  private confirmButton!: Button;
  private pauseOverlay: PauseOverlay | null = null;
  private unsubscribeEvents: (() => void) | null = null;

  constructor() {
    super('Prep');
  }

  protected onCreate(): void {
    this.buildLayout();
    this.unsubscribeEvents = sessionBridge.onEvents(() => this.renderAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeEvents?.());
    this.renderAll();
    this.maybeShowSafetyNet();
  }

  /** PLAN §3.10: lưới an toàn đã ghi transaction SUPPORT_GIFT của đúng ngày này — báo cho người chơi biết vì sao. */
  private maybeShowSafetyNet(): void {
    const state = sessionBridge.current.state;
    const gifted = state.today.transactions.some((tx) => tx.type === 'SUPPORT_GIFT');
    if (!gifted) return;
    new DialogOverlay(this, {
      title: STRINGS.safetyNet.title,
      message: STRINGS.safetyNet.message,
      buttons: [{ label: STRINGS.safetyNet.confirm, variant: 'primary', onTap: () => {} }],
    });
  }

  private buildLayout(): void {
    const state = sessionBridge.current.state;

    this.topBar = new TopBar(this, 0, 90, {
      width: GAME_WIDTH,
      leftLabel: `${STRINGS.prep.dayLabel} ${state.day}`,
      money: state.money,
      travelViet: isTravelVietOpen(state.day) ? travelVietScore(state.starHistory) : null,
      icon: STRINGS.common.settingsIcon,
      onIconTap: () => this.openPause(),
    });

    this.bannerText = this.add
      .text(GAME_WIDTH / 2, 190, '', { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.warning), align: 'center', wordWrap: { width: GAME_WIDTH - 80 } })
      .setOrigin(0.5);

    this.flightList = new ScrollList<Flight>(this, {
      x: 20,
      y: LIST_Y,
      width: GAME_WIDTH - 40,
      height: LIST_HEIGHT,
      itemHeight: ROW_HEIGHT,
      items: state.today.flights,
      renderItem: (flight) => this.renderFlightRow(flight),
    });

    this.totalText = this.add
      .text(GAME_WIDTH / 2, TOTAL_Y, '', { fontFamily: FONT_FAMILY, fontSize: '26px', color: toCssColor(COLORS.text) })
      .setOrigin(0.5);

    this.confirmButton = new Button(this, GAME_WIDTH / 2 - 185, BUTTON_ROW_Y, {
      width: 340,
      height: BUTTON_HEIGHT,
      label: STRINGS.prep.confirmPurchase,
      variant: 'primary',
      onTap: () => this.dispatch({ type: 'PREP_CONFIRM_PURCHASE' }),
    });
    new Button(this, GAME_WIDTH / 2 + 185, BUTTON_ROW_Y, {
      width: 340,
      height: BUTTON_HEIGHT,
      label: STRINGS.prep.openCounter,
      variant: 'success',
      onTap: () => this.handleOpenCounter(),
    });
  }

  private renderAll(): void {
    const state = sessionBridge.current.state;
    this.topBar.setLeftLabel(`${STRINGS.prep.dayLabel} ${state.day}`);
    this.topBar.setMoney(state.money);
    this.topBar.setTravelViet(isTravelVietOpen(state.day) ? travelVietScore(state.starHistory) : null);
    this.bannerText.setText(this.bannerFor(state));
    this.flightList.setItems([...state.today.flights]);

    const total = pendingTotalCost(state.today.pendingPurchase, state.today.flights);
    this.totalText.setText(`${STRINGS.prep.estimateLabel}: −${total} ${STRINGS.common.currencySuffix} · ${STRINGS.prep.moneyAfterLabel}: ${state.money - total} ${STRINGS.common.currencySuffix}`);

    const hasPending = Object.keys(state.today.pendingPurchase).length > 0;
    this.confirmButton.setEnabled(hasPending);
  }

  private bannerFor(state: GameState): string {
    const event = state.today.event;
    if (event.type === 'RUSH') return STRINGS.prep.bannerRush;
    if (event.type === 'WEATHER') return STRINGS.prep.bannerWeather;
    return '';
  }

  private renderFlightRow(flight: Flight): Phaser.GameObjects.Container {
    const state = sessionBridge.current.state;
    const today = state.today;
    const route = routeOfFlight(flight);
    const panelWidth = GAME_WIDTH - 40 - 16;
    const row = this.add.container(0, 0);
    const panel = new Panel(this, panelWidth / 2 + 8, ROW_HEIGHT / 2 - 6, { width: panelWidth, height: ROW_HEIGHT - 12, strokeColor: route.color });
    const forecastBad = today.event.type === 'WEATHER' && today.event.routeId === route.id;
    const title = this.add
      .text(28, 12, `${route.name}${forecastBad ? ` ${STRINGS.prep.weatherForecastIcon}` : ''}`, { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0);
    const meta = this.add
      .text(28, 44, `${flight.id} · ${formatClock(flight.departAt)}`, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(0, 0);
    row.add([panel, title, meta]);

    row.add(this.renderCabinRow(flight, 'ECONOMY', 74, today));
    row.add(this.renderCabinRow(flight, 'BUSINESS', 112, today));
    return row;
  }

  private renderCabinRow(flight: Flight, cabin: CabinClass, y: number, today: TodayState): Phaser.GameObjects.GameObject[] {
    const owned = today.seats.filter((seat) => seat.flightId === flight.id && seat.cabin === cabin && seat.state !== 'LOST').length;
    const key = pendingKey(flight.id, cabin);
    const qty = today.pendingPurchase[key] ?? 0;
    const unitCost = getRoute(flight.routeId).cost[cabin];
    const discount = bulkDiscountRate(qty);
    const label = cabin === 'ECONOMY' ? STRINGS.counter.ecoShort : STRINGS.counter.bizShort;
    const ownedLabel = cabin === 'ECONOMY' ? STRINGS.prep.ownedEco : STRINGS.prep.ownedBiz;

    const text = this.add
      .text(28, y, `${label} ${unitCost} ${STRINGS.common.currencySuffix} · ${ownedLabel} ${owned}${discount > 0 ? ` · −${Math.round(discount * 100)}%` : ''}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: toCssColor(COLORS.textMuted),
      })
      .setOrigin(0, 0.5);

    const stepper = new Stepper(this, GAME_WIDTH - 40 - 16 - 90, y, {
      value: qty,
      max: this.maxAffordableQty(flight, cabin, today, sessionBridge.current.state.money),
      onChange: (next) => this.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin, qty: next }),
    });

    return [text, stepper];
  }

  private maxAffordableQty(flight: Flight, cabin: CabinClass, today: TodayState, money: number): number {
    const seatLimit = maxPurchasable(flight, cabin, today.seats);
    if (seatLimit === 0) return 0;
    const key = pendingKey(flight.id, cabin);
    const currentQty = today.pendingPurchase[key] ?? 0;
    const unitCost = getRoute(flight.routeId).cost[cabin];
    const otherPendingCost = pendingTotalCost(today.pendingPurchase, today.flights) - purchaseCost(unitCost, currentQty);
    const moneyLeft = money - otherPendingCost;
    let qty = currentQty;
    while (qty < seatLimit && purchaseCost(unitCost, qty + 1) <= moneyLeft) qty++;
    return qty;
  }

  private handleOpenCounter(): void {
    const state = sessionBridge.current.state;
    const hasPending = Object.keys(state.today.pendingPurchase).length > 0;
    if (hasPending) {
      const pendingCount = Object.values(state.today.pendingPurchase).reduce((a, b) => a + b, 0);
      new DialogOverlay(this, {
        title: STRINGS.prep.pendingTitle,
        message: `${STRINGS.prep.pendingMessagePrefix}${pendingCount}${STRINGS.prep.pendingMessageSuffix}`,
        buttons: [
          { label: STRINGS.prep.pendingCancel, variant: 'ghost', onTap: () => {} },
          { label: STRINGS.prep.pendingDiscardAndOpen, variant: 'danger', onTap: () => { this.dispatch({ type: 'PREP_CLEAR_PENDING' }); this.openCounter(); } },
          { label: STRINGS.prep.pendingConfirmAndOpen, variant: 'primary', onTap: () => { this.dispatch({ type: 'PREP_CONFIRM_PURCHASE' }); this.openCounter(); } },
        ],
      });
      return;
    }
    const hasStock = state.today.seats.some((seat) => seat.state === 'AVAILABLE');
    if (!hasStock) {
      new DialogOverlay(this, {
        title: STRINGS.prep.emptyStockTitle,
        message: STRINGS.prep.emptyStockMessage,
        buttons: [
          { label: STRINGS.prep.emptyStockCancel, variant: 'ghost', onTap: () => {} },
          { label: STRINGS.prep.emptyStockConfirm, variant: 'danger', onTap: () => this.openCounter() },
        ],
      });
      return;
    }
    this.openCounter();
  }

  private openCounter(): void {
    this.dispatch({ type: 'OPEN_COUNTER' });
    this.scene.start('Counter');
  }

  private dispatch(command: Parameters<typeof sessionBridge.dispatch>[0]): void {
    sessionBridge.dispatch(command);
    this.renderAll();
  }

  private openPause(): void {
    if (this.pauseOverlay) return;
    this.pauseOverlay = new PauseOverlay(this, {
      onResume: () => { this.pauseOverlay = null; },
      onExit: () => { this.pauseOverlay = null; this.scene.start('Title'); },
    });
  }
}
