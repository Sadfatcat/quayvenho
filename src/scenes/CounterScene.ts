import Phaser from 'phaser';
import { PERSONAL } from '@data/personal';
import { STRINGS } from '@data/strings';
import { counterCustomer } from '@domain/dayCycle';
import { isTravelVietOpen, travelVietScore } from '@domain/demand';
import { isMechanicOpen } from '@domain/dayConfig';
import { formatClock } from '@domain/clock';
import type { Command, DomainEvent, GameState, ScoreResult } from '@domain/models';
import { getRoute } from '@domain/routes';
import { GAME_WIDTH } from '../config';
import { registerVisibilityHandler } from '@platform/visibility';
import { Button } from '@ui/Button';
import { burstCoins } from '@ui/CoinBurst';
import { CounterDesk } from '@ui/CounterDesk';
import { CustomerCard } from '@ui/CustomerCard';
import { formatMoney } from '@ui/format';
import { QueueStrip } from '@ui/QueueStrip';
import { showFloatingText } from '@ui/FloatingText';
import { buttonRow, MIN_TOUCH_SIZE, SCREEN_MARGIN } from '@ui/layout';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { ToastQueue } from '@ui/Toast';
import { TopBar } from '@ui/TopBar';
import { BACK_PRESSED_EVENT, BaseScene } from './BaseScene';
import { PassportCard } from './overlays/PassportCard';
import { PauseOverlay } from './overlays/PauseOverlay';
import { SettingsOverlay } from './overlays/SettingsOverlay';
import { showPendingTutorials, showScriptedMoments } from './overlays/TutorialOverlay';
import { sessionBridge } from './sessionBridge';

const SHAKE_OUTCOMES: ReadonlySet<ScoreResult['outcome']> = new Set(['POOR', 'FAILED', 'SOLD_INVALID', 'REFUSED_WRONG']);
const SPECIAL_TOAST_MS = 3000;
const GOOD_SPECIAL_OUTCOMES: ReadonlySet<ScoreResult['outcome']> = new Set(['PERFECT', 'GOOD', 'OK']);
const specialLinesOf = (specialId: string | undefined) => PERSONAL.specialCustomers.find((special) => special.id === specialId)?.lines;
const SHAKE_DURATION_MS = 180;
const SHAKE_INTENSITY = 0.006;
const DOCK_Y = 1170;
const HEADER_TEXT_Y = 146;
const PASSPORT_BUTTON = { x: GAME_WIDTH - SCREEN_MARGIN - MIN_TOUCH_SIZE / 2, y: 262 };
const FEEDBACK_Y = 330;

const rejectedLabel = (reason: string): string =>
  (STRINGS.counter.rejectedReasons as Record<string, string>)[reason] ?? STRINGS.counter.rejectedFallback;

export class CounterScene extends BaseScene {
  private toasts!: ToastQueue;
  private brandText!: Phaser.GameObjects.Text;
  private eventBadge!: Phaser.GameObjects.Text;
  private waitingText!: Phaser.GameObjects.Text;
  private queueStrip!: QueueStrip;
  private customerCard!: CustomerCard;
  private desk!: CounterDesk;
  private retryButton!: Button;
  private refuseButton!: Button;
  private mainButton!: Button;
  private passportButton!: Button;
  private topBar!: TopBar;

  private pauseOverlay: PauseOverlay | null = null;
  private unsubscribeEvents: (() => void) | null = null;
  private unsubscribeVisibility: (() => void) | null = null;

  constructor() {
    super('Counter');
    this.backgroundTheme = 'counter';
    this.musicTrack = 'busy';
  }

  protected onCreate(): void {
    this.toasts = new ToastQueue(this);
    this.buildLayout();
    this.unsubscribeEvents = sessionBridge.onEvents((events) => this.handleEvents(events));
    this.unsubscribeVisibility = registerVisibilityHandler({
      onHidden: () => sessionBridge.setPaused(true),
      onVisible: () => this.openPause(),
    });
    const onBack = (): void => this.openPause();
    this.game.events.on(BACK_PRESSED_EVENT, onBack);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeEvents?.();
      this.unsubscribeVisibility?.();
      this.game.events.off(BACK_PRESSED_EVENT, onBack);
    });
    this.renderAll();
    showPendingTutorials(this, 'Counter');
    showScriptedMoments(this, 'OPEN');
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

    this.brandText = this.add.text(SCREEN_MARGIN, HEADER_TEXT_Y, state.profile?.brandName ?? '', { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0, 0.5);
    this.eventBadge = this.add.text(GAME_WIDTH / 2, HEADER_TEXT_Y, '', { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.warning) }).setOrigin(0.5);

    this.waitingText = this.add.text(GAME_WIDTH / 2, 290, STRINGS.counter.waitingForCustomer, { fontFamily: FONT_FAMILY, fontSize: '28px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5).setVisible(false);
    this.queueStrip = new QueueStrip(this);
    this.customerCard = new CustomerCard(this);
    this.desk = new CounterDesk(this, { dispatch: (command) => this.dispatch(command) });

    const dock = buttonRow(GAME_WIDTH, 3);
    this.retryButton = new Button(this, dock.centers[0] ?? 0, DOCK_Y, { width: dock.width, height: MIN_TOUCH_SIZE, label: STRINGS.counter.retry, variant: 'ghost', onTap: () => this.dispatch({ type: 'BUILD_RESET' }) });
    this.refuseButton = new Button(this, dock.centers[1] ?? 0, DOCK_Y, { width: dock.width, height: MIN_TOUCH_SIZE, label: STRINGS.counter.refuse, variant: 'danger', onTap: () => this.dispatch({ type: 'REFUSE_CUSTOMER' }) });
    this.mainButton = new Button(this, dock.centers[2] ?? 0, DOCK_Y, { width: dock.width, height: MIN_TOUCH_SIZE, label: STRINGS.counter.print, variant: 'primary', onTap: () => this.onMainAction() });

    this.passportButton = new Button(this, PASSPORT_BUTTON.x, PASSPORT_BUTTON.y, { width: MIN_TOUCH_SIZE, height: MIN_TOUCH_SIZE, label: STRINGS.passport.icon, variant: 'ghost', onTap: () => this.openPassportCard() });
    this.passportButton.setVisible(false);
  }

  private openPassportCard(): void {
    const state = sessionBridge.current.state;
    const customer = counterCustomer(state.today);
    if (!customer) return;
    new PassportCard(this, customer.order, state.day);
  }

  // ---------- per-frame render ----------

  private renderAll(): void {
    const state = sessionBridge.current.state;
    this.topBar.setLeftLabel(formatClock(state.today.clock));
    this.topBar.setMoney(state.money);
    this.topBar.setTravelViet(isTravelVietOpen(state.day) ? travelVietScore(state.starHistory) : null);
    this.brandText.setText(state.profile?.brandName ?? '');
    this.eventBadge.setText(this.eventBadgeText(state));

    const counter = counterCustomer(state.today);
    const queuedCount = state.today.queue.filter((candidate) => candidate.position === 'QUEUE').length;
    this.queueStrip.update(state.today.queue);
    this.customerCard.update(counter, specialLinesOf(counter?.order.special?.id)?.arrive);
    this.waitingText.setVisible(!counter && queuedCount === 0);
    this.passportButton.setVisible(!!counter && isMechanicOpen('badPassport', state.day));
    this.desk.renderFrame(state);
    this.updateButtons(state);

    if (state.phase === 'SUMMARY') this.scene.start('Summary');
  }

  private eventBadgeText(state: GameState): string {
    const event = state.today.event;
    if (event.type === 'RUSH') return STRINGS.counter.eventBadge.rush;
    if (event.type === 'WEATHER' && event.outcome && event.outcome !== 'GOOD') {
      const outcomeLabel = event.outcome === 'SEVERE' ? STRINGS.counter.eventBadge.weatherSevere : STRINGS.counter.eventBadge.weatherBad;
      return `⛈ ${getRoute(event.routeId).name}: ${outcomeLabel}`;
    }
    return '';
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

    this.mainButton.setLabel(STRINGS.counter.print);
    this.mainButton.setEnabled(canBuild && !!draft?.cabin && !!draft.flightId && !!draft.seat);
  }

  private onMainAction(): void {
    if (sessionBridge.current.state.today.counter.state === 'BUILDING') this.dispatch({ type: 'PRINT_TICKET' });
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
    const y = FEEDBACK_Y;
    if (result.revenue > 0) {
      showFloatingText(this, x, y, { text: `+${formatMoney(result.revenue)}`, color: COLORS.success });
      burstCoins(this, x, y, result.revenue);
    }
    if (SHAKE_OUTCOMES.has(result.outcome)) this.cameras.main.shake(SHAKE_DURATION_MS, SHAKE_INTENSITY);
    if (result.tip > 0) showFloatingText(this, x, y - 44, { text: `+${formatMoney(result.tip)} ${STRINGS.counter.tipSuffix}`, color: COLORS.accent });
    const specialLines = specialLinesOf(result.specialId);
    if (specialLines) this.toasts.show(GOOD_SPECIAL_OUTCOMES.has(result.outcome) ? specialLines.success : specialLines.fail, SPECIAL_TOAST_MS);
    else if (result.mistakes.length) this.toasts.show(result.mistakes.map((code) => STRINGS.counter.mistakes[code]).join(', '), 2000);
  }

  private openPause(): void {
    if (this.pauseOverlay) return;
    sessionBridge.setPaused(true);
    this.pauseOverlay = new PauseOverlay(this, {
      onResume: () => {
        sessionBridge.setPaused(false);
        this.pauseOverlay = null;
      },
      onSettings: () => new SettingsOverlay(this),
      onExit: () => {
        this.pauseOverlay = null;
        this.scene.start('Title');
      },
    });
  }
}
