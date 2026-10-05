import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { formatClock } from '@domain/clock';
import { bulkDiscountRate, purchaseCost, seatUnitCost } from '@domain/economy';
import { maxPurchasable, pendingKey, pendingTotalCost } from '@domain/inventory';
import type { CabinClass, Flight, GameState, TodayState } from '@domain/models';
import { getRoute } from '@domain/routes';
import { routeOfFlight } from '@domain/schedule';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { ScrollList } from '@ui/ScrollList';
import { buttonRow } from '@ui/layout';
import { absentTodayLines } from '@ui/staffText';
import { Stepper } from '@ui/Stepper';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { HOLIDAYS } from '@data/holidays';
import { formatMoney } from '@ui/format';
import { GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { addManagementChrome, requestOpenCounter, type ManagementChrome } from './managementChrome';
import { DialogOverlay } from './overlays/DialogOverlay';
import { showPendingTutorials, showScriptedMoments } from './overlays/TutorialOverlay';
import { sessionBridge } from './sessionBridge';

const ROW_HEIGHT = 230;
const STEPPER_RIGHT_INSET = 120;
const CABIN_PRICE_GAP = 12;
const OWNED_RIGHT_INSET = 16;
const ECONOMY_ROW_Y = 112;
const BUSINESS_ROW_Y = 184;
const LIST_Y = 360;
const BANNER_Y = 300;
const LIST_HEIGHT = 1060 - LIST_Y;
const TOTAL_Y = 1095;
const BUTTON_ROW_Y = 1180;
const BUTTON_HEIGHT = 88;

/** PLAN §10.5 (Kho). Grey box: nội dung tiếng Việt của banner/hộp thoại xem `strings.prep.*`. */
export class PrepScene extends BaseScene {
  private chrome!: ManagementChrome;
  private bannerText!: Phaser.GameObjects.Text;
  private flightList!: ScrollList<Flight>;
  private totalText!: Phaser.GameObjects.Text;
  private confirmButton!: Button;
  private unsubscribeEvents: (() => void) | null = null;

  constructor() {
    super('Prep');
    this.backgroundTheme = 'prep';
    this.musicTrack = 'calm';
  }

  protected onCreate(): void {
    this.buildLayout();
    this.unsubscribeEvents = sessionBridge.onEvents(() => this.renderAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeEvents?.());
    this.renderAll();
    showPendingTutorials(this, 'Prep');
    showScriptedMoments(this, 'PREP');
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

    this.chrome = addManagementChrome(this, 'TICKETS', false);

    this.bannerText = this.add
      .text(GAME_WIDTH / 2, BANNER_Y, '', { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.warning), align: 'center', wordWrap: { width: GAME_WIDTH - 80 } })
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

    const bottomRow = buttonRow(GAME_WIDTH, 2);
    this.confirmButton = new Button(this, bottomRow.centers[0] ?? 0, BUTTON_ROW_Y, {
      width: bottomRow.width,
      height: BUTTON_HEIGHT,
      label: STRINGS.prep.confirmPurchase,
      variant: 'primary',
      onTap: () => this.dispatch({ type: 'PREP_CONFIRM_PURCHASE' }),
    });
    new Button(this, bottomRow.centers[1] ?? 0, BUTTON_ROW_Y, {
      width: bottomRow.width,
      height: BUTTON_HEIGHT,
      label: STRINGS.prep.openCounter,
      variant: 'success',
      onTap: () => requestOpenCounter(this),
    });
  }

  private renderAll(): void {
    const state = sessionBridge.current.state;
    this.chrome.refresh(state);
    this.bannerText.setText(this.bannerFor(state));
    this.flightList.setItems([...state.today.flights]);

    const total = pendingTotalCost(state.today.pendingPurchase, state.today.flights, state.day, state.today.event);
    this.totalText.setText(`${STRINGS.prep.estimateLabel}: ${total > 0 ? '−' : ''}${formatMoney(total)} · ${STRINGS.prep.moneyAfterLabel}: ${formatMoney(state.money - total)}`);

    const hasPending = Object.keys(state.today.pendingPurchase).length > 0;
    this.confirmButton.setEnabled(hasPending);
  }

  private holidayBanner(holidayId: string, hotRoutes: readonly string[]): string {
    const holiday = HOLIDAYS.find((candidate) => candidate.id === holidayId)?.name ?? '';
    const routes = hotRoutes.map((routeId) => getRoute(routeId).name).join(', ');
    return STRINGS.prep.bannerHoliday.replace('{holiday}', holiday).replace('{routes}', routes);
  }

  private bannerFor(state: GameState): string {
    const event = state.today.event;
    const eventLine = event.type === 'RUSH' ? this.holidayBanner(event.holidayId, event.hotRoutes) : event.type === 'WEATHER' ? STRINGS.prep.bannerWeather : '';
    return [eventLine, ...absentTodayLines(state)].filter((line) => line !== '').join('\n');
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
    const ownedText = this.add
      .text(panelWidth + 8 - OWNED_RIGHT_INSET, 12, this.ownedSummary(flight, today), { fontFamily: FONT_FAMILY, fontSize: '18px', fontStyle: 'bold', color: toCssColor(COLORS.text), align: 'right' })
      .setOrigin(1, 0);
    row.add([panel, title, meta, ownedText]);

    row.add(this.renderCabinRow(flight, 'ECONOMY', ECONOMY_ROW_Y, today));
    row.add(this.renderCabinRow(flight, 'BUSINESS', BUSINESS_ROW_Y, today));
    return row;
  }

  private ownedSummary(flight: Flight, today: TodayState): string {
    const countOf = (cabin: CabinClass): number => today.seats.filter((seat) => seat.flightId === flight.id && seat.cabin === cabin && seat.state !== 'LOST').length;
    return `${STRINGS.counter.ecoShort} : ${countOf('ECONOMY')}
${STRINGS.counter.bizShort} : ${countOf('BUSINESS')}`;
  }

  private renderCabinRow(flight: Flight, cabin: CabinClass, y: number, today: TodayState): Phaser.GameObjects.GameObject[] {
    const key = pendingKey(flight.id, cabin);
    const qty = today.pendingPurchase[key] ?? 0;
    const unitCost = seatUnitCost(getRoute(flight.routeId), cabin, sessionBridge.current.state.day, today.event);
    const discount = bulkDiscountRate(qty);
    const label = cabin === 'ECONOMY' ? STRINGS.counter.ecoShort : STRINGS.counter.bizShort;

    const cabinText = this.add
      .text(28, y, label, { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(cabin === 'BUSINESS' ? COLORS.danger : COLORS.text) })
      .setOrigin(0, 0.5);
    const priceText = this.add
      .text(cabinText.x + cabinText.width + CABIN_PRICE_GAP, y, formatMoney(unitCost), { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.moneyGreen) })
      .setOrigin(0, 0.5);
    const discountText = this.add
      .text(priceText.x + priceText.width + CABIN_PRICE_GAP, y, discount > 0 ? `−${Math.round(discount * 100)}%` : '', { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(0, 0.5);

    const stepper = new Stepper(this, GAME_WIDTH - 40 - 16 - STEPPER_RIGHT_INSET, y, {
      value: qty,
      max: this.maxAffordableQty(flight, cabin, today, sessionBridge.current.state.money),
      onChange: (next) => this.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin, qty: next }),
    });

    return [cabinText, priceText, discountText, stepper];
  }

  private maxAffordableQty(flight: Flight, cabin: CabinClass, today: TodayState, money: number): number {
    const seatLimit = maxPurchasable(flight, cabin, today.seats);
    if (seatLimit === 0) return 0;
    const key = pendingKey(flight.id, cabin);
    const currentQty = today.pendingPurchase[key] ?? 0;
    const day = sessionBridge.current.state.day;
    const unitCost = seatUnitCost(getRoute(flight.routeId), cabin, day, today.event);
    const otherPendingCost = pendingTotalCost(today.pendingPurchase, today.flights, day, today.event) - purchaseCost(unitCost, currentQty);
    const moneyLeft = money - otherPendingCost;
    let qty = currentQty;
    while (qty < seatLimit && purchaseCost(unitCost, qty + 1) <= moneyLeft) qty++;
    return qty;
  }

  private dispatch(command: Parameters<typeof sessionBridge.dispatch>[0]): void {
    sessionBridge.dispatch(command);
    this.renderAll();
  }
}
