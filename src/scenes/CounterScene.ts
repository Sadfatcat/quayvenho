import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { canGoToStep, counterCustomer, patienceRatioOf } from '@domain/dayCycle';
import { isTravelVietOpen, travelVietScore } from '@domain/demand';
import { isMechanicOpen } from '@domain/dayConfig';
import { formatClock } from '@domain/clock';
import type {
  BuildStep,
  Command,
  Customer,
  DaySummary,
  DomainEvent,
  GameState,
  Order,
  ScoreResult,
  TicketDraft,
} from '@domain/models';
import { getRoute } from '@domain/routes';
import { computeModifiers } from '@domain/upgrades';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { registerVisibilityHandler } from '@platform/visibility';
import { BaggageSlider } from '@ui/BaggageSlider';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { DragController } from '@ui/DragController';
import { ExtrasToggles } from '@ui/ExtrasToggles';
import { FlightList } from '@ui/FlightList';
import { showFloatingText } from '@ui/FloatingText';
import { Panel } from '@ui/Panel';
import { PatienceBar } from '@ui/PatienceBar';
import { SeatMapView } from '@ui/SeatMapView';
import { SpeechBubble } from '@ui/SpeechBubble';
import { BUILD_STEP_ORDER, StepIndicator } from '@ui/StepIndicator';
import { TicketView } from '@ui/TicketView';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { ToastQueue } from '@ui/Toast';
import { TopBar } from '@ui/TopBar';
import { BaseScene } from './BaseScene';
import { PauseOverlay } from './overlays/PauseOverlay';
import { sessionBridge } from './sessionBridge';

const COUNTER_SURFACE_Y = 650;
const BUILD_AREA_ORIGIN = { x: 40, y: 730 };
const BUILD_AREA_WIDTH = GAME_WIDTH - 80;

const formatOrderSummary = (order: Order): string => {
  const route = getRoute(order.routeId);
  const parts = [`✈ ${route.name}`];
  if (order.cabin === 'BUSINESS') parts.push(STRINGS.counter.cabin.BUSINESS);
  if (order.baggageKg > 0) parts.push(`🧳${order.baggageKg}${STRINGS.counter.baggageUnit}`);
  const seatIcon = STRINGS.counter.seatPrefIcon[order.seatPref];
  if (seatIcon) parts.push(seatIcon);
  const timeLabel = STRINGS.counter.timePrefLabel[order.timePref];
  if (timeLabel) parts.push(timeLabel);
  for (const extra of order.extras) parts.push(STRINGS.counter.extraIcon[extra]);
  return parts.join(' · ');
};

const nextStepOf = (step: BuildStep): BuildStep =>
  BUILD_STEP_ORDER[Math.min(BUILD_STEP_ORDER.indexOf(step) + 1, BUILD_STEP_ORDER.length - 1)] as BuildStep;

const rejectedLabel = (reason: string): string =>
  (STRINGS.counter.rejectedReasons as Record<string, string>)[reason] ?? STRINGS.counter.rejectedFallback;

export class CounterScene extends BaseScene {
  private toasts!: ToastQueue;
  private brandText!: Phaser.GameObjects.Text;
  private eventBadge!: Phaser.GameObjects.Text;
  private waitingText!: Phaser.GameObjects.Text;
  private customerArea!: Phaser.GameObjects.Container;
  private patienceBar: PatienceBar | null = null;
  private stepIndicator!: StepIndicator;
  private buildArea!: Phaser.GameObjects.Container;
  private printBar: Phaser.GameObjects.Container | null = null;
  private retryButton!: Button;
  private refuseButton!: Button;
  private mainButton!: Button;
  private topBar!: TopBar;

  private pauseOverlay: PauseOverlay | null = null;
  private summaryOverlay: BaseOverlay | null = null;
  private unsubscribeEvents: (() => void) | null = null;
  private unsubscribeVisibility: (() => void) | null = null;

  private lastQueueSignature = '';
  private lastBuildSignature = '';

  constructor() {
    super('Counter');
  }

  protected onCreate(): void {
    this.toasts = new ToastQueue(this);
    this.buildLayout();
    this.unsubscribeEvents = sessionBridge.onEvents((events) => this.handleEvents(events));
    this.unsubscribeVisibility = registerVisibilityHandler({
      onHidden: () => sessionBridge.setPaused(true),
      onVisible: () => this.openPause(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeEvents?.();
      this.unsubscribeVisibility?.();
    });
    this.renderAll();
  }

  update(_time: number, delta: number): void {
    sessionBridge.tick(delta);
    this.renderAll();
  }

  // ---------- layout (built once) ----------

  private buildLayout(): void {
    const state = sessionBridge.current.state;

    this.topBar = new TopBar(this, 0, 90, {
      width: GAME_WIDTH,
      leftLabel: formatClock(state.today.clock),
      money: state.money,
      travelViet: isTravelVietOpen(state.day) ? travelVietScore(state.starHistory) : null,
      icon: STRINGS.common.pauseIcon,
      onIconTap: () => this.openPause(),
    });

    this.brandText = this.add.text(GAME_WIDTH / 2, 180, state.profile?.brandName ?? '', { fontFamily: FONT_FAMILY, fontSize: '32px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0.5);
    this.eventBadge = this.add.text(GAME_WIDTH / 2, 214, '', { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.warning) }).setOrigin(0.5);

    this.waitingText = this.add.text(GAME_WIDTH / 2, 400, STRINGS.counter.waitingForCustomer, { fontFamily: FONT_FAMILY, fontSize: '28px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5).setVisible(false);
    this.customerArea = this.add.container(0, 0);

    this.stepIndicator = new StepIndicator(this, GAME_WIDTH / 2 - BUILD_STEP_ORDER.length * 70 + 70, 695, {
      onStepTap: (step) => this.dispatch({ type: 'BUILD_GOTO_STEP', step }),
    });

    this.buildArea = this.add.container(BUILD_AREA_ORIGIN.x, BUILD_AREA_ORIGIN.y);

    this.retryButton = new Button(this, 140, 1170, { width: 210, height: 80, label: STRINGS.counter.retry, variant: 'ghost', onTap: () => this.dispatch({ type: 'BUILD_RESET' }) });
    this.refuseButton = new Button(this, 360, 1170, { width: 210, height: 80, label: STRINGS.counter.refuse, variant: 'danger', onTap: () => this.dispatch({ type: 'REFUSE_CUSTOMER' }) });
    this.mainButton = new Button(this, 590, 1170, { width: 220, height: 80, label: STRINGS.counter.next, variant: 'primary', onTap: () => this.onMainAction() });
  }

  // ---------- per-frame render ----------

  private renderAll(): void {
    const state = sessionBridge.current.state;
    this.topBar.setLeftLabel(formatClock(state.today.clock));
    this.topBar.setMoney(state.money);
    this.topBar.setTravelViet(isTravelVietOpen(state.day) ? travelVietScore(state.starHistory) : null);
    this.brandText.setText(state.profile?.brandName ?? '');
    this.eventBadge.setText(this.eventBadgeText(state));

    this.renderCustomerArea(state);
    this.renderBuildArea(state);

    if (state.phase === 'SUMMARY' && state.lastSummary) this.showDaySummary(state.lastSummary);
  }

  private eventBadgeText(state: GameState): string {
    const event = state.today.event;
    if (event.type === 'RUSH') return '🔥 Cao điểm lễ hội';
    if (event.type === 'WEATHER' && event.outcome && event.outcome !== 'GOOD') return `⛈ ${getRoute(event.routeId).name}: ${event.outcome}`;
    return '';
  }

  // ---------- customer area ----------

  private renderCustomerArea(state: GameState): void {
    const signature = state.today.queue.map((customer) => customer.order.customerId).join(',');
    if (signature === this.lastQueueSignature) {
      this.updateCustomerDynamics(state);
      return;
    }
    this.lastQueueSignature = signature;
    this.customerArea.removeAll(true);
    this.patienceBar = null;

    const counter = counterCustomer(state.today);
    if (counter) this.renderCounterCustomer(counter);
    const queued = state.today.queue.filter((candidate) => candidate.position === 'QUEUE');
    queued.forEach((_customer, index) => this.renderQueuedCustomer(index));

    this.waitingText.setVisible(!counter && queued.length === 0);
  }

  private renderCounterCustomer(customer: Customer): void {
    const centerX = GAME_WIDTH / 2;
    const bubble = new SpeechBubble(this, centerX, 320, { width: 480, text: formatOrderSummary(customer.order) });
    const avatar = this.add.circle(centerX, 440, 50, 0x94a3b8);
    const spriteLabel = this.add.text(centerX, 440, customer.order.spriteId, { fontFamily: FONT_FAMILY, fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    this.patienceBar = new PatienceBar(this, centerX - 100, 520, { width: 200, height: 16 });
    this.patienceBar.setProgress(patienceRatioOf(customer));
    this.patienceBar.setMood(customer.mood);
    this.customerArea.add([bubble, avatar, spriteLabel, this.patienceBar]);
  }

  private renderQueuedCustomer(index: number): void {
    const x = GAME_WIDTH - 80 - index * 70;
    const scale = Math.max(0.5, 1 - index * 0.15);
    this.customerArea.add(this.add.circle(x, 560, 30 * scale, 0xb9c4d0));
  }

  private updateCustomerDynamics(state: GameState): void {
    const counter = counterCustomer(state.today);
    if (counter && this.patienceBar) {
      this.patienceBar.setProgress(patienceRatioOf(counter));
      this.patienceBar.setMood(counter.mood);
    }
  }

  // ---------- build area (Bước A-D, in vé, giao vé) ----------

  private renderBuildArea(state: GameState): void {
    const counter = state.today.counter;
    const draft = counter.draft;
    const signature = JSON.stringify({
      s: counter.state,
      step: draft?.step,
      f: draft?.flightId,
      c: draft?.cabin,
      seat: draft?.seat,
      kg: draft?.baggageKg,
      ex: draft?.extras,
    });

    if (signature === this.lastBuildSignature) {
      if (counter.state === 'PRINTING') this.updatePrintProgress(state);
      this.updateButtons(state);
      return;
    }
    this.lastBuildSignature = signature;
    this.buildArea.removeAll(true);
    this.printBar = null;

    if (counter.state === 'BUILDING' && draft) {
      this.stepIndicator.setCurrentStep(draft.step);
      if (draft.step === 'FLIGHT') this.renderStepFlight(state);
      else if (draft.step === 'SEAT') this.renderStepSeat(state, draft);
      else if (draft.step === 'EXTRAS') this.renderStepExtras(state, draft);
      else this.renderStepReview(state, draft);
    } else if (counter.state === 'PRINTING') {
      this.renderPrinting(state);
    } else if (counter.state === 'READY_TO_DELIVER' && draft) {
      this.renderReadyToDeliver(state, draft);
    } else if (counter.state === 'EMPTY') {
      this.renderStepFlight(state, true);
    }

    this.updateButtons(state);
  }

  private renderStepFlight(state: GameState, readOnly = false): void {
    const list = new FlightList(this, {
      x: 0,
      y: 0,
      width: BUILD_AREA_WIDTH,
      height: 340,
      flights: state.today.flights,
      seats: state.today.seats,
      readOnly,
      onSelect: (flightId, cabin) => this.dispatch({ type: 'BUILD_SELECT_FLIGHT', flightId, cabin }),
    });
    this.buildArea.add(list);
  }

  private renderStepSeat(state: GameState, draft: TicketDraft): void {
    if (!draft.flightId || !draft.cabin) return;
    const flight = state.today.flights.find((candidate) => candidate.id === draft.flightId);
    if (!flight) return;
    const mapWidth = SeatMapView.widthFor(draft.cabin);
    const seatMap = new SeatMapView(this, (BUILD_AREA_WIDTH - mapWidth) / 2, 20, {
      cabin: draft.cabin,
      flight,
      seats: state.today.seats,
      selectedSeat: draft.seat,
      onSelect: (seat) => this.dispatch({ type: 'BUILD_SELECT_SEAT', seat }),
    });
    this.buildArea.add(seatMap);
  }

  private renderStepExtras(state: GameState, draft: TicketDraft): void {
    const slider = new BaggageSlider(this, 40, 40, {
      width: BUILD_AREA_WIDTH - 80,
      initialKg: draft.baggageKg,
      onCommit: (kg) => this.dispatch({ type: 'BUILD_SET_BAGGAGE', kg }),
    });
    this.buildArea.add(slider);
    if (isMechanicOpen('extras', state.day)) {
      const toggles = new ExtrasToggles(this, 20, 160, {
        width: BUILD_AREA_WIDTH - 40,
        selected: draft.extras,
        onToggle: (extra) => this.dispatch({ type: 'BUILD_TOGGLE_EXTRA', extra }),
      });
      this.buildArea.add(toggles);
    }
  }

  private renderStepReview(state: GameState, draft: TicketDraft): void {
    const ticket = this.buildTicketView(state, draft, (BUILD_AREA_WIDTH) / 2, 220);
    if (ticket) this.buildArea.add(ticket);
  }

  private renderPrinting(state: GameState): void {
    const totalMs = computeModifiers(state.upgrades).printMs;
    const track = this.add.rectangle(60, 180, BUILD_AREA_WIDTH - 120, 24, COLORS.disabled).setOrigin(0, 0.5);
    const fill = this.add.rectangle(60, 180, BUILD_AREA_WIDTH - 120, 24, COLORS.primary).setOrigin(0, 0.5);
    fill.width = (BUILD_AREA_WIDTH - 120) * (1 - state.today.counter.printLeftMs / totalMs);
    const label = this.add.text(BUILD_AREA_WIDTH / 2, 130, `${STRINGS.counter.print}...`, { fontFamily: FONT_FAMILY, fontSize: '28px', color: toCssColor(COLORS.text) }).setOrigin(0.5);
    const group = this.add.container(0, 0, [track, fill, label]);
    this.printBar = group;
    this.buildArea.add(group);
  }

  private updatePrintProgress(state: GameState): void {
    if (!this.printBar) return;
    const fill = this.printBar.list[1] as Phaser.GameObjects.Rectangle;
    const totalMs = computeModifiers(state.upgrades).printMs;
    fill.width = (BUILD_AREA_WIDTH - 120) * (1 - state.today.counter.printLeftMs / totalMs);
  }

  private renderReadyToDeliver(state: GameState, draft: TicketDraft): void {
    const originX = BUILD_AREA_WIDTH / 2;
    const originY = 220;
    const ticket = this.buildTicketView(state, draft, originX, originY);
    if (!ticket) return;
    ticket.setSize(560, 440);
    ticket.setInteractive();
    const dragController = new DragController(ticket, {
      onDragMove: (point) => {
        const local = this.buildArea.getLocalPoint(point.x, point.y);
        ticket.setPosition(local.x, local.y);
      },
      onDragEnd: (point) => {
        if (point.y < COUNTER_SURFACE_Y) this.dispatch({ type: 'DELIVER_TICKET' });
        else ticket.setPosition(originX, originY);
      },
    });
    void dragController;
    this.buildArea.add(ticket);
    this.buildArea.add(this.add.text(BUILD_AREA_WIDTH / 2, 20, STRINGS.counter.deliverHint, { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5));
  }

  private buildTicketView(state: GameState, draft: TicketDraft, x: number, y: number): TicketView | null {
    if (!draft.flightId || !draft.cabin) return null;
    const flight = state.today.flights.find((candidate) => candidate.id === draft.flightId);
    const customer = counterCustomer(state.today);
    if (!flight || !customer) return null;
    const route = getRoute(flight.routeId);
    return new TicketView(this, x, y, {
      width: 560,
      brandName: state.profile?.brandName ?? '',
      passengerName: customer.order.passport.bookedName,
      routeName: route.name,
      flightId: flight.id,
      departAt: flight.departAt,
      cabin: draft.cabin,
      seat: draft.seat,
      baggageKg: draft.baggageKg,
      extras: draft.extras,
    });
  }

  // ---------- buttons ----------

  private updateButtons(state: GameState): void {
    const counter = state.today.counter;
    const draft = counter.draft;
    const hasCustomer = counterCustomer(state.today) !== undefined;
    const canBuild = counter.state === 'BUILDING';
    const canRefuse = (['BUILDING', 'PRINTING', 'READY_TO_DELIVER'] as const).includes(counter.state as never) && hasCustomer;

    this.retryButton.setEnabled(canBuild);
    this.refuseButton.setEnabled(canRefuse);

    if (canBuild && draft) {
      if (draft.step === 'REVIEW') {
        this.mainButton.setLabel(STRINGS.counter.print);
        this.mainButton.setEnabled(true);
      } else {
        this.mainButton.setLabel(STRINGS.counter.next);
        this.mainButton.setEnabled(canGoToStep(draft, nextStepOf(draft.step)));
      }
    } else {
      this.mainButton.setLabel(STRINGS.counter.next);
      this.mainButton.setEnabled(false);
    }
  }

  private onMainAction(): void {
    const draft = sessionBridge.current.state.today.counter.draft;
    if (!draft) return;
    if (draft.step === 'REVIEW') this.dispatch({ type: 'PRINT_TICKET' });
    else this.dispatch({ type: 'BUILD_GOTO_STEP', step: nextStepOf(draft.step) });
  }

  // ---------- events, pause, summary ----------

  private dispatch(command: Command): void {
    sessionBridge.dispatch(command);
  }

  private handleEvents(events: readonly DomainEvent[]): void {
    for (const event of events) {
      if (event.type === 'COMMAND_REJECTED') {
        this.toasts.show(STRINGS.counter.rejectedPrefix + rejectedLabel(event.reason));
      } else if (event.type === 'TICKET_SCORED') {
        this.showScoreFeedback(event.result);
      }
    }
  }

  private showScoreFeedback(result: ScoreResult): void {
    const x = GAME_WIDTH / 2;
    const y = 480;
    if (result.revenue > 0) showFloatingText(this, x, y, { text: `+${result.revenue}`, color: COLORS.success });
    if (result.tip > 0) showFloatingText(this, x, y - 44, { text: `+${result.tip} ${STRINGS.counter.tipSuffix}`, color: COLORS.accent });
    if (result.mistakes.length) this.toasts.show(result.mistakes.map((code) => STRINGS.counter.mistakes[code]).join(', '), 2000);
  }

  private openPause(): void {
    if (this.pauseOverlay) return;
    sessionBridge.setPaused(true);
    this.pauseOverlay = new PauseOverlay(this, {
      onResume: () => {
        sessionBridge.setPaused(false);
        this.pauseOverlay = null;
      },
      onExit: () => {
        this.pauseOverlay = null;
        this.scene.start('Title');
      },
    });
  }

  private showDaySummary(summary: DaySummary): void {
    if (this.summaryOverlay) return;
    const lines = [
      `${STRINGS.summary.title} ${summary.day}`,
      `${STRINGS.summary.moneyStart}: ${summary.moneyStart} ${STRINGS.common.currencySuffix}`,
      `${STRINGS.summary.moneyEnd}: ${summary.moneyEnd} ${STRINGS.common.currencySuffix}`,
      `${STRINGS.summary.ticketRevenue}: ${summary.ticketRevenue} ${STRINGS.common.currencySuffix}`,
      `${STRINGS.summary.tips}: ${summary.tips} ${STRINGS.common.currencySuffix}`,
      `${STRINGS.summary.seatCost}: ${summary.seatCost} ${STRINGS.common.currencySuffix}`,
      `${STRINGS.summary.expiredSeats}: ${summary.expiredSeats}`,
      `${STRINGS.summary.served}: ${summary.served}`,
      `${STRINGS.summary.left}: ${summary.left}`,
      `${STRINGS.summary.turnedAway}: ${summary.turnedAway}`,
      `${STRINGS.summary.avgStars}: ${summary.avgStars.toFixed(1)}`,
      ...(summary.travelVietAfter !== null ? [`${STRINGS.summary.travelViet}: ${summary.travelVietAfter.toFixed(1)}`] : []),
    ];
    const overlay = new BaseOverlay(this, { closeOnBackdropTap: false });
    const height = 80 + lines.length * 40;
    const panel = new Panel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: 600, height });
    const text = this.add
      .text(0, -(lines.length * 40) / 2, lines.join('\n'), { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.text), align: 'left', lineSpacing: 12 })
      .setOrigin(0.5, 0);
    panel.add(text);
    overlay.add(panel);
    this.summaryOverlay = overlay;
  }
}
