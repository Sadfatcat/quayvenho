import Phaser from 'phaser';
import { EXTRA_FEES } from '@data/balance';
import { ROUTES } from '@data/routes';
import { STRINGS } from '@data/strings';
import { counterCustomer } from '@domain/dayCycle';
import { isMechanicOpen } from '@domain/dayConfig';
import { formatClock } from '@domain/clock';
import { computeModifiers } from '@domain/upgrades';
import type { CabinClass, Command, Extra, GameState } from '@domain/models';
import { getRoute } from '@domain/routes';
import { BaggageSlider } from './BaggageSlider';
import { audio } from '@platform/audio';
import { DeskTicket } from './DeskTicket';
import { hasItemImage, serviceImageKey, stampImageKey, ticketStackImageKey, timeStampImageKey } from './itemImages';
import { DragController } from './DragController';
import { formatMoney } from './format';
import { MiniSeatMap } from './MiniSeatMap';
import { Panel } from './Panel';
import { StampButton } from './StampButton';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from './theme';

/** Toạ độ thiết kế (720×1280) của các vùng trên quầy; kéo vé lên trên `DELIVER_LINE_Y` là giao cho khách. */
const LAYOUT = {
  dispenser: { x: 24, y: 440, width: 226, gap: 14 },
  ticketSpot: { x: 266, y: 432, width: 430, height: 208 },
  stampTray: { x: 24, y: 654, width: 416, height: 346 },
  seatPanel: { x: 456, y: 654, width: 240, height: 320 },
  baggage: { x: 60, y: 1050, width: 340 },
  services: { x: 456, y: 990, width: 240, height: 136 },
} as const;
export const DELIVER_LINE_Y = 430;

const STACK_LAYERS = 6;
const STACK_LAYER_OFFSET = 7;
const STACK_CARD_HEIGHT = 96;
const STACK_TOP_PADDING = 6;
const STACK_HEIGHT = STACK_TOP_PADDING + STACK_CARD_HEIGHT + STACK_LAYER_OFFSET * (STACK_LAYERS - 1) + 8;
const STAMP_HEIGHT = 78;
const MIN_STAMP_HEIGHT = 56;
const TIME_SECTION_HEIGHT = 110;
const STAMP_ROW_GAP = 6;
const STAMP_GAP = 8;
const DEST_COLUMNS_BY_ROUTE_COUNT = [{ upTo: 6, columns: 3 }, { upTo: 8, columns: 4 }, { upTo: Infinity, columns: 5 }] as const;
const DEST_MAX_HEIGHT = 96;
const columnsForRouteCount = (routeCount: number): number => DEST_COLUMNS_BY_ROUTE_COUNT.find((tier) => routeCount <= tier.upTo)?.columns ?? 3;
const STACK_IMAGE_HEIGHT = 140;
const SERVICE_IMAGE_HEIGHT = 56;
const TRAY_PADDING = 12;
const TRAY_TITLE_HEIGHT = 32;
const SERVICE_ICON: Record<Extra, string> = { VEG_MEAL: '🥗', WHEELCHAIR: '♿', INSURANCE: '🛡️' };
const SERVICE_ORDER: readonly Extra[] = ['VEG_MEAL', 'WHEELCHAIR', 'INSURANCE'];
const PRINT_BAR = { height: 22, margin: 24 };
const DIM_ALPHA = 0.55;

export interface CounterDeskOptions {
  dispatch: (command: Command) => void;
}

/**
 * Quầy làm việc nhiều vùng (thay cho danh sách vé nhiều bước): kho vé (thường/thương gia), chỗ đặt vé trên bàn, khay
 * con dấu (điểm đến + giờ bay), sơ đồ ghế thu nhỏ, cân hành lý bấm giữ, khay vé dịch vụ.
 * Mọi vùng đều bấm được theo thứ tự tuỳ ý; khi đang in hoặc chờ giao thì chỉ còn vé trên bàn thao tác được.
 */
export class CounterDesk extends Phaser.GameObjects.Container {
  private content: Phaser.GameObjects.Container | null = null;
  private lastSignature = '';
  private lastDraftStamps = { route: null as string | null, time: null as number | null };
  private printFill: Phaser.GameObjects.Rectangle | null = null;
  private readonly dispatch: (command: Command) => void;

  constructor(scene: Phaser.Scene, options: CounterDeskOptions) {
    super(scene, 0, 0);
    this.dispatch = options.dispatch;
    scene.add.existing(this);
  }

  /** Gọi mỗi khung hình: chỉ dựng lại khi trạng thái quầy thay đổi, còn lại cập nhật thanh in. */
  renderFrame(state: GameState): void {
    const signature = this.signatureOf(state);
    if (signature !== this.lastSignature) {
      this.lastSignature = signature;
      this.rebuild(state);
    }
    if (this.printFill && state.today.counter.state === 'PRINTING') {
      const total = computeModifiers(state.upgrades).printMs;
      this.printFill.width = Math.max(0, (LAYOUT.ticketSpot.width - PRINT_BAR.margin * 2) * (1 - state.today.counter.printLeftMs / total));
    }
  }

  private signatureOf(state: GameState): string {
    const { counter, flights, seats } = state.today;
    const draft = counter.draft;
    const unitSig = draft?.flightId && draft.cabin ? seats.filter((s) => s.flightId === draft.flightId && s.cabin === draft.cabin).map((s) => `${s.seat}${s.state}`).join(',') : '';
    return JSON.stringify({ c: counter.state, d: draft, u: unitSig, r: state.unlockedRoutes, t: flights.length, day: state.day, who: counterCustomer(state.today)?.order.customerId ?? null });
  }

  private rebuild(state: GameState): void {
    this.content?.destroy();
    this.printFill = null;
    const scene = this.scene;
    const content = scene.add.container(0, 0);
    this.content = content;
    this.add(content);

    const { counter } = state.today;
    const draft = counter.draft;
    const customer = counterCustomer(state.today);
    const building = counter.state === 'BUILDING' && draft !== null && customer !== undefined;
    const regions = scene.add.container(0, 0);
    content.add(regions);

    this.drawDispenser(regions, state);
    this.drawStampTray(regions, state);
    this.drawSeatPanel(regions, state);
    this.drawBaggage(regions, state);
    this.drawServices(regions, state);

    if (!building) {
      regions.setAlpha(DIM_ALPHA);
      const blocker = scene.add.zone(0, LAYOUT.ticketSpot.y - 8, 720, 1280).setOrigin(0).setInteractive();
      content.add(blocker);
    }
    this.drawTicket(content, state, building);
  }

  // ---------- vé: kho vé + chỗ đặt vé ----------

  /** Hai chồng vé (thường / thương gia) như chồng cốc: bấm vào chồng để rút một vé đặt lên bàn. */
  private drawDispenser(parent: Phaser.GameObjects.Container, state: GameState): void {
    const scene = this.scene;
    const draft = state.today.counter.draft;
    const { x, y, width, gap } = LAYOUT.dispenser;
    const stackWidth = (width - gap) / 2;
    const stacks: { cabin: CabinClass; label: string; color: number }[] = [
      { cabin: 'ECONOMY', label: STRINGS.counter.desk.economyTicket, color: COLORS.teal },
      { cabin: 'BUSINESS', label: STRINGS.counter.desk.businessTicket, color: COLORS.accent },
    ];
    stacks.forEach(({ cabin, label, color }, index) => {
      const left = x + index * (stackWidth + gap);
      const selected = draft?.cabin === cabin;
      const g = scene.add.graphics();
      const baseTop = y + STACK_TOP_PADDING;
      const stackImageKey = ticketStackImageKey(cabin);
      const stackImage = hasItemImage(scene, stackImageKey) ? scene.add.image(left + stackWidth / 2, y + STACK_HEIGHT / 2, stackImageKey) : null;
      stackImage?.setScale(Math.min((stackWidth - 8) / stackImage.width, STACK_IMAGE_HEIGHT / stackImage.height));
      for (let layer = stackImage ? -1 : STACK_LAYERS - 1; layer >= 0; layer--) {
        const top = baseTop + layer * STACK_LAYER_OFFSET;
        g.fillStyle(layer === 0 ? color : COLORS.cloud, 1);
        g.fillRoundedRect(left + 4, top, stackWidth - 8, STACK_CARD_HEIGHT, 10);
        g.lineStyle(3, COLORS.primaryDark, 1);
        g.strokeRoundedRect(left + 4, top, stackWidth - 8, STACK_CARD_HEIGHT, 10);
      }
      if (selected) {
        g.lineStyle(5, COLORS.success, 1);
        g.strokeRoundedRect(left - 2, y, stackWidth + 4, STACK_HEIGHT, 14);
      }
      const centerX = left + stackWidth / 2;
      const mark = stackImage ?? scene.add.text(centerX, baseTop + STACK_CARD_HEIGHT / 2, '🎫', { fontFamily: FONT_FAMILY, fontSize: '34px' }).setOrigin(0.5);
      const caption = scene.add
        .text(centerX, y + STACK_HEIGHT + 22, label, { fontFamily: FONT_FAMILY, fontSize: '19px', fontStyle: 'bold', color: toCssColor(COLORS.text), align: 'center', wordWrap: { width: stackWidth } })
        .setOrigin(0.5);
      const hit = scene.add.zone(centerX, y + (STACK_HEIGHT + 44) / 2, stackWidth, STACK_HEIGHT + 44).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        audio.playSfx('click');
        this.dispatch({ type: 'BUILD_TAKE_TICKET', cabin });
      });
      parent.add([g, mark, caption, hit]);
    });
  }

  private drawTicket(parent: Phaser.GameObjects.Container, state: GameState, building: boolean): void {
    const scene = this.scene;
    const { x, y, width, height } = LAYOUT.ticketSpot;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const spot = new Panel(scene, centerX, centerY, { width, height, fill: COLORS.kraft, strokeColor: COLORS.textMuted, fillAlpha: 0.55 });
    parent.add(spot);

    const { counter } = state.today;
    const draft = counter.draft;
    const customer = counterCustomer(state.today);
    if (!draft?.cabin || !customer) {
      parent.add(scene.add.text(centerX, centerY, STRINGS.counter.desk.ticketSpotEmpty, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: width - 60 } }).setOrigin(0.5));
      return;
    }
    const flight = draft.flightId ? state.today.flights.find((candidate) => candidate.id === draft.flightId) : undefined;
    const routeStampName = draft.routeStamp ? getRoute(draft.routeStamp).name : null;
    const timeStampLabel = draft.timeStamp !== null ? formatClock(draft.timeStamp) : null;
    const fresh = this.freshStamp(draft.routeStamp, draft.timeStamp);
    const ticket = new DeskTicket(scene, centerX, centerY, {
      width: width - 16,
      height: height - 16,
      cabin: draft.cabin,
      passengerName: customer.order.passport.bookedName,
      destinationStamp: routeStampName,
      destinationIcon: draft.routeStamp ? getRoute(draft.routeStamp).icon : null,
      timeStamp: timeStampLabel,
      flightMissing: draft.routeStamp !== null && draft.timeStamp !== null && !flight,
      seat: draft.seat,
      baggageKg: draft.baggageKg,
      extras: draft.extras,
      freshStamp: fresh,
    });
    parent.add(ticket);

    if (counter.state === 'PRINTING') {
      const barWidth = width - PRINT_BAR.margin * 2;
      const track = scene.add.rectangle(x + PRINT_BAR.margin, y + height - 18, barWidth, PRINT_BAR.height, COLORS.disabled).setOrigin(0, 0.5);
      this.printFill = scene.add.rectangle(x + PRINT_BAR.margin, y + height - 18, 1, PRINT_BAR.height, COLORS.primary).setOrigin(0, 0.5);
      const label = scene.add.text(centerX, y + height - 46, STRINGS.counter.desk.printing, { fontFamily: HEADING_FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0.5);
      parent.add([track, this.printFill, label]);
    }
    if (counter.state === 'READY_TO_DELIVER') {
      this.makeDeliverable(ticket, centerX, centerY);
      const hint = scene.add
        .text(centerX, y + height + 14, `⬆ ${STRINGS.counter.deliverHint}`, { fontFamily: HEADING_FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
        .setOrigin(0.5);
      const bob = scene.tweens.add({ targets: hint, y: hint.y - 8, duration: 500, yoyo: true, repeat: -1 });
      hint.once(Phaser.GameObjects.Events.DESTROY, () => bob.stop());
      parent.add(hint);
    }
    if (!building && counter.state === 'BUILDING') ticket.setAlpha(DIM_ALPHA);
  }

  /** Vé in xong: kéo lên khung khách để giao (hoặc dùng nút "Giao vé"). */
  private makeDeliverable(ticket: Phaser.GameObjects.Container, homeX: number, homeY: number): void {
    ticket.setInteractive();
    new DragController(ticket, {
      onDragMove: (point) => ticket.setPosition(point.x, point.y),
      onDragEnd: (point) => {
        if (point.y < DELIVER_LINE_Y) this.dispatch({ type: 'DELIVER_TICKET' });
        else ticket.setPosition(homeX, homeY);
      },
    });
  }

  private freshStamp(route: string | null, time: number | null): 'destination' | 'time' | null {
    const previous = this.lastDraftStamps;
    this.lastDraftStamps = { route, time };
    if (route !== null && route !== previous.route) return 'destination';
    if (time !== null && time !== previous.time) return 'time';
    return null;
  }

  // ---------- khay con dấu ----------

  private drawStampTray(parent: Phaser.GameObjects.Container, state: GameState): void {
    const scene = this.scene;
    const { x, y, width, height } = LAYOUT.stampTray;
    const draft = state.today.counter.draft;
    parent.add(new Panel(scene, x + width / 2, y + height / 2, { width, height, fill: COLORS.kraft, strokeColor: COLORS.primary }));
    parent.add(scene.add.text(x + TRAY_PADDING + 4, y + 20, STRINGS.counter.desk.stampTray, { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0, 0.5));

    const routes = ROUTES.filter((route) => state.unlockedRoutes.includes(route.id));
    const columns = columnsForRouteCount(routes.length);
    const destRows = Math.max(1, Math.ceil(routes.length / columns));
    const destAreaHeight = height - TRAY_TITLE_HEIGHT - TIME_SECTION_HEIGHT - TRAY_PADDING;
    const destHeight = Math.max(MIN_STAMP_HEIGHT, Math.min(DEST_MAX_HEIGHT, destAreaHeight / destRows - STAMP_ROW_GAP));
    const innerWidth = width - TRAY_PADDING * 2;
    const destWidth = (innerWidth - STAMP_GAP * (columns - 1)) / columns;
    routes.forEach((route, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      parent.add(
        new StampButton(scene, x + TRAY_PADDING + destWidth / 2 + column * (destWidth + STAMP_GAP), y + TRAY_TITLE_HEIGHT + 4 + destHeight / 2 + row * (destHeight + STAMP_ROW_GAP), {
          width: destWidth,
          height: destHeight,
          label: route.name,
          color: COLORS.accent,
          imageKey: stampImageKey(route.icon),
          active: draft?.routeStamp === route.id,
          onTap: () => this.dispatch({ type: 'BUILD_STAMP_ROUTE', routeId: route.id }),
        }),
      );
    });

    const timeTop = y + TRAY_TITLE_HEIGHT + 4 + destRows * (destHeight + STAMP_ROW_GAP) + 6;
    const times = [...new Set(state.today.flights.filter((flight) => state.unlockedRoutes.includes(flight.routeId)).map((flight) => flight.departAt))].sort((a, b) => a - b);
    parent.add(scene.add.text(x + TRAY_PADDING + 4, timeTop - 2, STRINGS.counter.desk.timeStamps, { fontFamily: FONT_FAMILY, fontSize: '16px', color: toCssColor(COLORS.textMuted) }).setOrigin(0, 0.5));
    const timeWidth = Math.min(destWidth, (innerWidth - STAMP_GAP * (times.length - 1)) / Math.max(1, times.length));
    times.forEach((departAt, index) => {
      parent.add(
        new StampButton(scene, x + TRAY_PADDING + timeWidth / 2 + index * (timeWidth + STAMP_GAP), timeTop + 14 + STAMP_HEIGHT / 2, {
          width: timeWidth,
          height: STAMP_HEIGHT,
          label: formatClock(departAt),
          color: COLORS.teal,
          imageKey: timeStampImageKey(departAt),
          active: draft?.timeStamp === departAt,
          onTap: () => this.dispatch({ type: 'BUILD_STAMP_TIME', departAt }),
        }),
      );
    });
  }

  // ---------- ghế, hành lý, vé dịch vụ ----------

  private drawSeatPanel(parent: Phaser.GameObjects.Container, state: GameState): void {
    const { x, y, width, height } = LAYOUT.seatPanel;
    const draft = state.today.counter.draft;
    const hasStock = !!draft?.flightId && !!draft.cabin && state.today.seats.some((seat) => seat.flightId === draft.flightId && seat.cabin === draft.cabin && (seat.state === 'AVAILABLE' || seat.state === 'HELD'));
    parent.add(
      new MiniSeatMap(this.scene, x, y, {
        width,
        height,
        cabin: draft?.cabin ?? null,
        flightId: draft?.flightId ?? null,
        seats: state.today.seats,
        selectedSeat: draft?.seat ?? null,
        hasStock,
        onSelect: (seat) => this.dispatch({ type: 'BUILD_SELECT_SEAT', seat }),
      }),
    );
  }

  private drawBaggage(parent: Phaser.GameObjects.Container, state: GameState): void {
    if (!isMechanicOpen('baggage', state.day)) return;
    const draft = state.today.counter.draft;
    const { x, y, width } = LAYOUT.baggage;
    parent.add(
      new BaggageSlider(this.scene, x, y, {
        width,
        initialKg: draft?.baggageKg ?? 0,
        onCommit: (kg) => this.dispatch({ type: 'BUILD_SET_BAGGAGE', kg }),
      }),
    );
  }

  private serviceIcon(x: number, y: number, extra: Extra): Phaser.GameObjects.GameObject {
    const key = serviceImageKey(extra);
    if (!hasItemImage(this.scene, key)) return this.scene.add.text(x, y, SERVICE_ICON[extra], { fontFamily: FONT_FAMILY, fontSize: '34px' }).setOrigin(0.5);
    const image = this.scene.add.image(x, y, key);
    image.setScale(SERVICE_IMAGE_HEIGHT / image.height);
    return image;
  }

  private drawServices(parent: Phaser.GameObjects.Container, state: GameState): void {
    if (!isMechanicOpen('extras', state.day)) return;
    const scene = this.scene;
    const draft = state.today.counter.draft;
    const { x, y, width, height } = LAYOUT.services;
    parent.add(scene.add.text(x + width / 2, y - 4, STRINGS.counter.desk.serviceTray, { fontFamily: FONT_FAMILY, fontSize: '18px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0.5));
    const gap = 8;
    const cardWidth = (width - gap * (SERVICE_ORDER.length - 1)) / SERVICE_ORDER.length;
    SERVICE_ORDER.forEach((extra, index) => {
      const chosen = draft?.extras.includes(extra) ?? false;
      const cx = x + cardWidth / 2 + index * (cardWidth + gap);
      const cy = y + 14 + (height - 14) / 2;
      const card = new Panel(scene, cx, cy, { width: cardWidth, height: height - 24, fill: chosen ? COLORS.success : COLORS.cloud, strokeColor: chosen ? COLORS.successDark : COLORS.primary });
      const icon = this.serviceIcon(cx, cy - 22, extra);
      const name = scene.add.text(cx, cy + 14, STRINGS.counter.extras[extra], { fontFamily: FONT_FAMILY, fontSize: '14px', fontStyle: 'bold', color: toCssColor(chosen ? COLORS.cloud : COLORS.text), align: 'center', wordWrap: { width: cardWidth - 8 } }).setOrigin(0.5);
      const price = scene.add.text(cx, cy + 40, `+${formatMoney(EXTRA_FEES[extra])}`, { fontFamily: FONT_FAMILY, fontSize: '14px', color: toCssColor(chosen ? COLORS.cloud : COLORS.textMuted) }).setOrigin(0.5);
      const hit = scene.add.zone(cx, cy, cardWidth, height - 24).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.dispatch({ type: 'BUILD_TOGGLE_EXTRA', extra }));
      parent.add([card, icon, name, price, hit]);
    });
  }
}
