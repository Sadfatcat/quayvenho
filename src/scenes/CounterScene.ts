import Phaser from 'phaser';
import { PERSONAL } from '@data/personal';
import { STRINGS } from '@data/strings';
import { counterCustomer } from '@domain/dayCycle';
import { isTravelVietOpen, travelVietScore } from '@domain/demand';
import { isMechanicOpen } from '@domain/dayConfig';
import { formatClock } from '@domain/clock';
import type { Command, DomainEvent, GameState, ScoreResult, StaffKind } from '@domain/models';
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
import { MIN_TOUCH_SIZE, SCREEN_MARGIN } from '@ui/layout';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { isAbsentOn } from '@domain/staff';
import { kindName } from '@ui/staffText';
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
const HEADER_TEXT_Y = 146;
const PASSPORT_BUTTON = { x: GAME_WIDTH - SCREEN_MARGIN - MIN_TOUCH_SIZE / 2, y: 262 };
const REFUSE_BUTTON = { x: GAME_WIDTH - SCREEN_MARGIN - 84, y: 396, width: 168, height: 56, fontSize: 22 };
const FEEDBACK_Y = 330;
const STAFF_TOAST_MS = 1200;
const STAFF_CHIP_RADIUS = 18;
const STAFF_CHIP_GAP = 8;
const STAFF_CHIP_COLOR: Record<StaffKind, number> = { INTERN: COLORS.textMuted, JUNIOR: COLORS.teal, MIDDLE: COLORS.accent, SENIOR: COLORS.primary, MARKETING: COLORS.moneyGreen };

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
  private refuseButton!: Button;
  private passportButton!: Button;
  private topBar!: TopBar;
  private staffChips!: Phaser.GameObjects.Container;
  private staffChipsSignature = '';

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
    this.staffChips = this.add.container(0, 0);
    this.queueStrip = new QueueStrip(this);
    this.customerCard = new CustomerCard(this);
    this.desk = new CounterDesk(this, { dispatch: (command) => this.dispatch(command) });

    this.refuseButton = new Button(this, REFUSE_BUTTON.x, REFUSE_BUTTON.y, { width: REFUSE_BUTTON.width, height: REFUSE_BUTTON.height, label: STRINGS.counter.desk.refuseButton, fontSize: REFUSE_BUTTON.fontSize, variant: 'danger', onTap: () => this.dispatch({ type: 'REFUSE_CUSTOMER' }) });
    this.refuseButton.setVisible(false);

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
    this.renderStaffChips(state);
    this.queueStrip.update(state.today.queue);
    this.customerCard.update(counter, specialLinesOf(counter?.order.special?.id)?.arrive);
    this.waitingText.setVisible(!counter && queuedCount === 0);
    this.passportButton.setVisible(!!counter && isMechanicOpen('badPassport', state.day));
    this.desk.renderFrame(state);
    this.updateButtons(state);

    if (state.phase === 'SUMMARY') this.scene.start('Summary');
  }

  /** Chip tròn nhỏ cho từng nhân viên ở lề phải hàng đầu: màu theo bậc, mờ đi nếu hôm nay nghỉ. */
  private renderStaffChips(state: GameState): void {
    const signature = state.staff.map((member) => `${member.id}:${member.kind}:${member.absentUntilDay ?? ''}`).join(',') + `@${state.day}`;
    if (signature === this.staffChipsSignature) return;
    this.staffChipsSignature = signature;
    this.staffChips.removeAll(true);
    const absentIds = new Set(state.staff.filter((member) => isAbsentOn(member, state.day)).map((member) => member.id));
    state.staff.forEach((member, index) => {
      const x = GAME_WIDTH - SCREEN_MARGIN - STAFF_CHIP_RADIUS - index * (STAFF_CHIP_RADIUS * 2 + STAFF_CHIP_GAP);
      const absent = absentIds.has(member.id);
      const disc = this.add.graphics();
      disc.fillStyle(STAFF_CHIP_COLOR[member.kind], absent ? 0.35 : 1);
      disc.fillCircle(x, HEADER_TEXT_Y, STAFF_CHIP_RADIUS);
      const initial = this.add.text(x, HEADER_TEXT_Y, member.name.charAt(0), { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: toCssColor(COLORS.cloud) }).setOrigin(0.5);
      this.staffChips.add([disc, initial]);
    });
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
    const counterState = state.today.counter.state;
    const hasCustomer = counterCustomer(state.today) !== undefined;
    const canRefuse = (['BUILDING', 'PRINTING', 'READY_TO_DELIVER'] as const).includes(counterState as never) && hasCustomer;
    this.refuseButton.setVisible(hasCustomer);
    this.refuseButton.setEnabled(canRefuse);
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
      } else if (event.type === 'STAFF_ASSISTED') {
        const member = sessionBridge.current.state.staff.find((candidate) => candidate.id === event.staffId);
        this.toasts.show(`${member?.name ?? kindName(event.kind)}: ${STRINGS.staff.jobDone[event.job] ?? ''}`, STAFF_TOAST_MS);
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
