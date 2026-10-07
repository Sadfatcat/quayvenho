import Phaser from 'phaser';
import { ROUTES } from '@data/routes';
import { STRINGS } from '@data/strings';
import { counterCustomer } from '@domain/dayCycle';
import { extraFeeOf } from '@domain/economy';
import { isMechanicOpen } from '@domain/dayConfig';
import { formatClock } from '@domain/clock';
import { computeModifiers } from '@domain/upgrades';
import type { CabinClass, Command, CounterState, Extra, GameState } from '@domain/models';
import { getRoute } from '@domain/routes';
import { BaggageSlider } from './BaggageSlider';
import { audio } from '@platform/audio';
import { DeskTicket, type DeskTicketOptions } from './DeskTicket';
import { hasItemImage, serviceImageKey, stampImageKey, ticketStackImageKey, ticketStateImageKey, timeStampImageKey } from './itemImages';
import { DragController, type DragPoint } from './DragController';
import { DRAG_TAP_THRESHOLD_PX } from './layout';
import { formatMoney } from './format';
import { MiniSeatMap } from './MiniSeatMap';
import { Panel } from './Panel';
import { Button } from './Button';
import { PrinterStation, type PrinterMode } from './PrinterStation';
import { ScrollList } from './ScrollList';
import { StampButton } from './StampButton';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from './theme';

/** Toạ độ thiết kế (720×1280) của các vùng trên quầy; kéo vé lên trên `DELIVER_LINE_Y` là giao cho khách. */
const LAYOUT = {
  dispenser: { x: 24, y: 440, width: 226, gap: 14 },
  ticketSpot: { x: 266, y: 432, width: 430, height: 208 },
  stampTray: { x: 24, y: 654, width: 416, height: 300 },
  seatPanel: { x: 456, y: 654, width: 240, height: 280 },
  services: { x: 456, y: 944, width: 240, height: 120 },
  baggage: { x: 60, y: 1030, width: 340 },
  printer: { x: 456, y: 1076, width: 240, height: 160 },
  resetButton: { x: 24 + 95, y: 1186, width: 190, height: 72 },
} as const;
export const DELIVER_LINE_Y = 430;

const STACK_LAYERS = 6;
const STACK_LAYER_OFFSET = 7;
const STACK_CARD_HEIGHT = 96;
const STACK_TOP_PADDING = 6;
const STACK_HEIGHT = STACK_TOP_PADDING + STACK_CARD_HEIGHT + STACK_LAYER_OFFSET * (STACK_LAYERS - 1) + 8;
const STAMP_HEIGHT = 78;
const STAMP_GAP = 8;
/** Khay điểm đến cuộn dọc: mỗi hàng 3 con dấu, thấy 2 hàng cùng lúc, thêm tuyến mới thì vuốt để xem. */
const DEST_COLUMNS = 3;
const DEST_ROW_HEIGHT = 80;
const DEST_STAMP_HEIGHT = 74;
const DEST_VISIBLE_ROWS = 2;
const TIME_SECTION_GAP = 8;
const TICKET_FEED_MS = 320;
const TICKET_FEED_END_SCALE = 0.3;
const TICKET_EJECT_MS = 420;
const TICKET_GHOST_WIDTH = 240;
const RESET_FONT_PX = 24;
const RETURN_AFTER_REJECT_MS = 80;
const STACK_IMAGE_HEIGHT = 140;
const SERVICE_IMAGE_HEIGHT = 56;
const TRAY_PADDING = 12;
const TRAY_TITLE_HEIGHT = 32;
const SERVICE_ICON: Record<Extra, string> = { VEG_MEAL: '🥗', WHEELCHAIR: '♿', INSURANCE: '🛡️' };
const SERVICE_ORDER: readonly Extra[] = ['VEG_MEAL', 'WHEELCHAIR', 'INSURANCE'];
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
  private printer: PrinterStation | null = null;
  private lastCounterState: CounterState = 'EMPTY';
  private destinationScrollY = 0;
  private readonly dispatch: (command: Command) => void;

  constructor(scene: Phaser.Scene, options: CounterDeskOptions) {
    super(scene, 0, 0);
    this.dispatch = options.dispatch;
    scene.add.existing(this);
  }

  /** Gọi mỗi khung hình: chỉ dựng lại khi trạng thái quầy thay đổi, còn lại cập nhật thanh in. */
  renderFrame(state: GameState): void {
    const signature = this.signatureOf(state);
    // Đang chạm/giữ (thanh cân, con dấu…) thì hoãn dựng lại đến lúc nhả để không huỷ nút giữa cử chỉ.
    if (signature !== this.lastSignature && !this.scene.input.activePointer.isDown) {
      this.lastSignature = signature;
      this.rebuild(state);
    }
    if (this.printer && state.today.counter.state === 'PRINTING') {
      const total = computeModifiers(state.upgrades).printMs;
      this.printer.setProgress(1 - state.today.counter.printLeftMs / total);
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
    this.printer = null;
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
    this.drawResetButton(regions, building);

    if (!building) {
      regions.setAlpha(DIM_ALPHA);
      const blocker = scene.add.zone(0, LAYOUT.ticketSpot.y - 8, 720, 1280).setOrigin(0).setInteractive();
      content.add(blocker);
    }
    this.drawPrinter(content, state);
    this.drawTicket(content, state, building);
    this.lastCounterState = counter.state;
  }

  private drawResetButton(parent: Phaser.GameObjects.Container, building: boolean): void {
    const { x, y, width, height } = LAYOUT.resetButton;
    const button = new Button(this.scene, x, y, {
      width,
      height,
      label: STRINGS.counter.desk.resetButton,
      fontSize: RESET_FONT_PX,
      variant: 'ghost',
      onTap: () => this.dispatch({ type: 'BUILD_RESET' }),
    });
    button.setEnabled(building);
    parent.add(button);
  }

  // ---------- máy in vé ----------

  private printerModeOf(state: GameState): PrinterMode {
    const { counter } = state.today;
    if (counter.state === 'PRINTING') return 'PRINTING';
    if (counter.state === 'READY_TO_DELIVER') return 'TICKET_READY';
    const draft = counter.draft;
    if (counter.state !== 'BUILDING' || !draft?.cabin) return 'NEED_TICKET';
    return draft.flightId && draft.seat ? 'READY_TO_PRINT' : 'FILL_TICKET';
  }

  private drawPrinter(parent: Phaser.GameObjects.Container, state: GameState): void {
    const { x, y, width, height } = LAYOUT.printer;
    const station = new PrinterStation(this.scene, x, y, {
      width,
      height,
      upgraded: state.upgrades.includes('FAST_PRINTER'),
      mode: this.printerModeOf(state),
      onTap: () => this.dispatch({ type: 'PRINT_TICKET' }),
    });
    this.printer = station;
    parent.add(station);
  }

  private isOverPrinter(point: { x: number; y: number }): boolean {
    const { x, y, width, height } = LAYOUT.printer;
    return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
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
        .text(centerX, y + STACK_HEIGHT + 22, label, { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: toCssColor(COLORS.text), align: 'center', wordWrap: { width: stackWidth } })
        .setOrigin(0.5);
      const hit = scene.add.zone(centerX, y + (STACK_HEIGHT + 44) / 2, stackWidth, STACK_HEIGHT + 44).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        audio.playSfx('click');
        this.dispatch({ type: 'BUILD_TAKE_TICKET', cabin });
      });
      parent.add([g, mark, caption, hit]);
    });
  }

  private ticketOptions(state: GameState, printed: boolean, freshStamp: DeskTicketOptions['freshStamp']): DeskTicketOptions | null {
    const draft = state.today.counter.draft;
    const customer = counterCustomer(state.today);
    if (!draft?.cabin || !customer) return null;
    const { width, height } = LAYOUT.ticketSpot;
    const flight = draft.flightId ? state.today.flights.find((candidate) => candidate.id === draft.flightId) : undefined;
    return {
      width: width - 16,
      height: height - 16,
      cabin: draft.cabin,
      passengerName: customer.order.passport.bookedName,
      destinationStamp: draft.routeStamp ? getRoute(draft.routeStamp).name : null,
      destinationIcon: draft.routeStamp ? getRoute(draft.routeStamp).icon : null,
      timeStamp: draft.timeStamp !== null ? formatClock(draft.timeStamp) : null,
      flightMissing: draft.routeStamp !== null && draft.timeStamp !== null && !flight,
      seat: draft.seat,
      baggageKg: draft.baggageKg,
      extras: draft.extras,
      freshStamp,
      day: state.day,
      printed,
    };
  }

  private drawTicket(parent: Phaser.GameObjects.Container, state: GameState, building: boolean): void {
    const scene = this.scene;
    const { x, y, width, height } = LAYOUT.ticketSpot;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    parent.add(new Panel(scene, centerX, centerY, { width, height, fill: COLORS.kraft, strokeColor: COLORS.textMuted, fillAlpha: 0.55 }));

    const { counter } = state.today;
    const draft = counter.draft;
    if (!draft?.cabin || !counterCustomer(state.today)) {
      this.addSpotMessage(parent, STRINGS.counter.desk.ticketSpotEmpty);
      return;
    }
    if (counter.state === 'PRINTING') {
      this.addSpotMessage(parent, STRINGS.counter.desk.ticketInPrinter);
      if (this.lastCounterState === 'BUILDING') this.feedTicketIntoPrinter(parent, state);
      return;
    }

    const ready = counter.state === 'READY_TO_DELIVER';
    const options = this.ticketOptions(state, ready, this.freshStamp(draft.routeStamp, draft.timeStamp));
    if (!options) return;
    const ticket = new DeskTicket(scene, centerX, centerY, options);
    parent.add(ticket);

    if (ready) {
      const hint = scene.add
        .text(centerX, y + height + 14, `⬆ ${STRINGS.counter.deliverHint}`, { fontFamily: HEADING_FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
        .setOrigin(0.5);
      const bob = scene.tweens.add({ targets: hint, y: hint.y - 8, duration: 500, yoyo: true, repeat: -1 });
      hint.once(Phaser.GameObjects.Events.DESTROY, () => bob.stop());
      parent.add(hint);
      const enableDelivery = (): void => this.makeDeliverable(ticket, centerX, centerY);
      if (this.lastCounterState === 'PRINTING') this.ejectTicketFromPrinter(ticket, centerX, centerY, enableDelivery);
      else enableDelivery();
      return;
    }
    if (counter.state === 'BUILDING') this.makeDraggableToPrinter(ticket, centerX, centerY);
    if (!building && counter.state === 'BUILDING') ticket.setAlpha(DIM_ALPHA);
  }

  private addSpotMessage(parent: Phaser.GameObjects.Container, message: string): void {
    const { x, y, width, height } = LAYOUT.ticketSpot;
    parent.add(
      this.scene.add
        .text(x + width / 2, y + height / 2, message, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: width - 60 } })
        .setOrigin(0.5),
    );
  }

  /** Vé nháp chui vào máy in: bản sao thu nhỏ bay từ bàn tới khe máy rồi biến mất. */
  private feedTicketIntoPrinter(parent: Phaser.GameObjects.Container, state: GameState): void {
    const options = this.ticketOptions(state, false, null);
    const slot = this.printer?.slotWorldPoint;
    if (!options || !slot) return;
    const { x, y, width, height } = LAYOUT.ticketSpot;
    const imageKey = ticketStateImageKey(false);
    const ghost = hasItemImage(this.scene, imageKey)
      ? this.scene.add.image(x + width / 2, y + height / 2, imageKey).setDisplaySize(TICKET_GHOST_WIDTH, TICKET_GHOST_WIDTH * 0.5)
      : new DeskTicket(this.scene, x + width / 2, y + height / 2, options);
    parent.add(ghost);
    this.scene.tweens.add({
      targets: ghost,
      x: slot.x,
      y: slot.y,
      scale: ghost.scale * TICKET_FEED_END_SCALE,
      alpha: 0,
      duration: TICKET_FEED_MS,
      ease: 'Cubic.easeIn',
      onComplete: () => ghost.destroy(),
    });
  }

  /** Vé đã in tự chui ra từ máy in rồi bay về chỗ cũ trên bàn; xong mới cho kéo giao khách. */
  private ejectTicketFromPrinter(ticket: Phaser.GameObjects.Container, homeX: number, homeY: number, onDone: () => void): void {
    const slot = this.printer?.slotWorldPoint;
    if (!slot) {
      onDone();
      return;
    }
    ticket.setPosition(slot.x, slot.y).setScale(TICKET_FEED_END_SCALE).setAlpha(0.6);
    this.scene.tweens.add({ targets: ticket, x: homeX, y: homeY, scale: 1, alpha: 1, duration: TICKET_EJECT_MS, ease: 'Back.easeOut', onComplete: onDone });
  }

  /** Vé nháp: kéo vào máy in để in (thả ngoài máy thì về chỗ cũ; thiếu thông tin thì quầy báo lý do). */
  private makeDraggableToPrinter(ticket: Phaser.GameObjects.Container, homeX: number, homeY: number): void {
    ticket.setInteractive();
    new DragController(ticket, {
      onDragMove: (point) => ticket.setPosition(point.x, point.y),
      onDragEnd: (point) => {
        if (!this.isOverPrinter(point)) {
          ticket.setPosition(homeX, homeY);
          return;
        }
        this.dispatch({ type: 'PRINT_TICKET' });
        // Nếu lệnh bị từ chối (vé chưa đủ thông tin) quầy không dựng lại, nên trả vé về chỗ cũ.
        this.scene.time.delayedCall(RETURN_AFTER_REJECT_MS, () => {
          if (ticket.active) ticket.setPosition(homeX, homeY);
        });
      },
    });
  }

  /** Vé đã in: kéo (hoặc chạm) để giao cho khách. */
  private makeDeliverable(ticket: Phaser.GameObjects.Container, homeX: number, homeY: number): void {
    ticket.setInteractive();
    let start: DragPoint = { x: homeX, y: homeY };
    new DragController(ticket, {
      onDragStart: (point) => {
        start = point;
      },
      onDragMove: (point) => ticket.setPosition(point.x, point.y),
      onDragEnd: (point) => {
        const tapped = Math.hypot(point.x - start.x, point.y - start.y) <= DRAG_TAP_THRESHOLD_PX;
        if (tapped || point.y < DELIVER_LINE_Y) this.dispatch({ type: 'DELIVER_TICKET' });
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
    const innerWidth = width - TRAY_PADDING * 2;
    const destWidth = (innerWidth - STAMP_GAP * (DEST_COLUMNS - 1)) / DEST_COLUMNS;
    const rows = Array.from({ length: Math.ceil(routes.length / DEST_COLUMNS) }, (_, row) => routes.slice(row * DEST_COLUMNS, (row + 1) * DEST_COLUMNS));
    if (rows.length > DEST_VISIBLE_ROWS) {
      parent.add(scene.add.text(x + width - TRAY_PADDING - 4, y + 20, STRINGS.counter.desk.scrollHint, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.text) }).setOrigin(1, 0.5));
    }
    const destTop = y + TRAY_TITLE_HEIGHT + 4;
    parent.add(
      new ScrollList(scene, {
        x: x + TRAY_PADDING,
        y: destTop,
        width: innerWidth,
        height: DEST_VISIBLE_ROWS * DEST_ROW_HEIGHT,
        itemHeight: DEST_ROW_HEIGHT,
        items: rows,
        initialScrollY: this.destinationScrollY,
        onScrollChange: (scrollY) => {
          this.destinationScrollY = scrollY;
        },
        renderItem: (rowRoutes) => {
          const row = scene.add.container(0, 0);
          rowRoutes.forEach((route, column) => {
            row.add(
              new StampButton(scene, destWidth / 2 + column * (destWidth + STAMP_GAP), DEST_ROW_HEIGHT / 2, {
                width: destWidth,
                height: DEST_STAMP_HEIGHT,
                label: route.name,
                color: COLORS.accent,
                imageKey: stampImageKey(route.icon),
                active: draft?.routeStamp === route.id,
                onTap: () => this.dispatch({ type: 'BUILD_STAMP_ROUTE', routeId: route.id }),
              }),
            );
          });
          return row;
        },
      }),
    );

    const timeTop = destTop + DEST_VISIBLE_ROWS * DEST_ROW_HEIGHT + TIME_SECTION_GAP;
    const times = [...new Set(state.today.flights.filter((flight) => state.unlockedRoutes.includes(flight.routeId)).map((flight) => flight.departAt))].sort((a, b) => a - b);
    parent.add(scene.add.text(x + TRAY_PADDING + 4, timeTop - 2, STRINGS.counter.desk.timeStamps, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.text) }).setOrigin(0, 0.5));
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
    parent.add(scene.add.text(x + width / 2, y - 4, STRINGS.counter.desk.serviceTray, { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0.5));
    const gap = 8;
    const cardWidth = (width - gap * (SERVICE_ORDER.length - 1)) / SERVICE_ORDER.length;
    SERVICE_ORDER.forEach((extra, index) => {
      const chosen = draft?.extras.includes(extra) ?? false;
      const cx = x + cardWidth / 2 + index * (cardWidth + gap);
      const cy = y + 14 + (height - 14) / 2;
      const card = new Panel(scene, cx, cy, { width: cardWidth, height: height - 24, fill: chosen ? COLORS.success : COLORS.cloud, strokeColor: chosen ? COLORS.successDark : COLORS.primary });
      const icon = this.serviceIcon(cx, cy - 22, extra);
      const name = scene.add.text(cx, cy + 14, STRINGS.counter.extras[extra], { fontFamily: FONT_FAMILY, fontSize: '18px', fontStyle: 'bold', color: toCssColor(chosen ? COLORS.cloud : COLORS.text), align: 'center', wordWrap: { width: cardWidth - 8 } }).setOrigin(0.5);
      const price = scene.add.text(cx, cy + 40, `+${formatMoney(extraFeeOf(extra, state.day))}`, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(chosen ? COLORS.cloud : COLORS.text) }).setOrigin(0.5);
      const hit = scene.add.zone(cx, cy, cardWidth, height - 24).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.dispatch({ type: 'BUILD_TOGGLE_EXTRA', extra }));
      parent.add([card, icon, name, price, hit]);
    });
  }
}
