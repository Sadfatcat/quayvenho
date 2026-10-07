import Phaser from 'phaser';
import { TRAVELVIET_FROM_DAY } from '@data/demand';
import { STRINGS } from '@data/strings';
import { seatsExpiringOn } from '@domain/inventory';
import type { DaySummary } from '@domain/models';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { InfoBox } from '@ui/InfoBox';
import { noticeText } from '@ui/staffText';
import { formatMoney } from '@ui/format';
import { CountUpText } from '@ui/CountUpText';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { showPendingTutorials, showScriptedMoments } from './overlays/TutorialOverlay';
import { promptForPwaUpdate } from './overlays/UpdatePrompt';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

interface SummaryLine {
  label: string;
  to: number;
  format: (value: number) => string;
}

const LINES_TOP = 320;
const NOTICE_GAP = 16;
const NOTICE_WIDTH = GAME_WIDTH - 60;
const LINE_HEIGHT = 42;
const LINES_PANEL = { width: 620, padding: 12 };
const LINE_LABEL_FONT_PX = 24;
const LINE_VALUE_FONT_PX = 26;
const STAR_COUNT = 5;
const STAR_Y = 250;
const STAR_GAP = 70;
const STAR_REVEAL_DELAY_MS = 180;
const STAR_POP_MS = 260;
const TOTAL_REVEAL_MS = 3000;
const BUTTON_HEIGHT = 84;
const BUTTON_Y = GAME_HEIGHT - 140;

const money = formatMoney;
const count = (value: number): string => String(Math.round(value));

/** PLAN §10.8/§5.6. Thay overlay tạm trong CounterScene (Giai đoạn 3) bằng scene thật. */
export class SummaryScene extends BaseScene {
  private countUps: CountUpText[] = [];
  private pendingTimers: Phaser.Time.TimerEvent[] = [];
  private continueButton!: Button;
  private noticesShown = false;

  constructor() {
    super('Summary');
    this.backgroundTheme = 'summary';
  }

  protected onCreate(): void {
    promptForPwaUpdate(this);
    showPendingTutorials(this, 'Summary');
    showScriptedMoments(this, 'SUMMARY');
    const state = sessionBridge.current.state;
    const summary = state.lastSummary;
    if (!summary) {
      this.scene.start('Title');
      return;
    }

    this.add.text(GAME_WIDTH / 2, 180, `${state.profile?.brandName ?? ''} — ${STRINGS.title.dayLabel} ${summary.day}`, TEXT_STYLES.heading).setOrigin(0.5);

    this.showStars(summary.avgStars);
    const lines = this.buildLines(summary, state.today.targetCustomers - state.today.results.length);
    const linesPanelHeight = lines.length * LINE_HEIGHT + 2 * LINES_PANEL.padding;
    const linesPanelTop = LINES_TOP - LINE_HEIGHT / 2 - LINES_PANEL.padding;
    new Panel(this, GAME_WIDTH / 2, linesPanelTop + linesPanelHeight / 2, { width: LINES_PANEL.width, height: linesPanelHeight, fill: COLORS.cloud, strokeColor: COLORS.primary, strokeWidth: 3 });
    this.revealLines(lines);

    let noticeTop = linesPanelTop + linesPanelHeight + NOTICE_GAP;
    const expiringTomorrow = seatsExpiringOn(state.today.seats, summary.day + 1);
    if (expiringTomorrow > 0) {
      const expiryBox = new InfoBox(this, GAME_WIDTH / 2, noticeTop, { width: NOTICE_WIDTH, tone: 'warning', text: STRINGS.summary.seatsExpireTomorrow.replace('{n}', String(expiringTomorrow)) });
      noticeTop += expiryBox.contentHeight + NOTICE_GAP;
    }

    if (summary.moneyEnd - summary.moneyStart < 0) {
      const tips = STRINGS.summary.lossTips;
      const tip = tips[Math.floor(Math.random() * tips.length)] ?? tips[0];
      new InfoBox(this, GAME_WIDTH / 2, noticeTop, { width: NOTICE_WIDTH, tone: 'info', text: tip });
    }

    const tapZone = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive();
    tapZone.on('pointerup', () => this.skipReveal());

    this.continueButton = new Button(this, GAME_WIDTH / 2, BUTTON_Y, {
      width: 360,
      height: BUTTON_HEIGHT,
      label: STRINGS.summary.continueButton,
      variant: 'primary',
      onTap: () => this.handleContinue(summary),
    });

    this.add
      .text(GAME_WIDTH / 2, BUTTON_Y + BUTTON_HEIGHT / 2 + 24, STRINGS.summary.tapToSkip, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(0.5);
  }

  /** Sao trung bình trong ngày hiện lần lượt từng ngôi (PLAN §10.8, ROADMAP 6.3). */
  private showStars(avgStars: number): void {
    const filled = Math.round(avgStars);
    for (let index = 0; index < STAR_COUNT; index++) {
      const star = this.add
        .text(GAME_WIDTH / 2 + (index - (STAR_COUNT - 1) / 2) * STAR_GAP, STAR_Y, '★', { fontFamily: FONT_FAMILY, fontSize: '56px', color: toCssColor(index < filled ? COLORS.accent : COLORS.disabled) })
        .setOrigin(0.5)
        .setScale(0);
      this.tweens.add({ targets: star, scale: 1, delay: index * STAR_REVEAL_DELAY_MS, duration: STAR_POP_MS, ease: 'Back.easeOut' });
    }
  }

  private buildLines(summary: DaySummary, notServed: number): SummaryLine[] {
    const lines: SummaryLine[] = [
      { label: STRINGS.summary.moneyStart, to: summary.moneyStart, format: money },
      { label: STRINGS.summary.ticketRevenue, to: summary.ticketRevenue, format: money },
      { label: STRINGS.summary.tips, to: summary.tips, format: money },
      { label: STRINGS.summary.seatCost, to: summary.seatCost, format: money },
    ];
    if (summary.shopCost > 0) lines.push({ label: STRINGS.summary.shopCost, to: summary.shopCost, format: money });
    if (summary.staffWages > 0) lines.push({ label: STRINGS.summary.staffWages, to: summary.staffWages, format: money });
    if (summary.expiredSeats > 0) {
      lines.push({ label: STRINGS.summary.expiredSeats, to: summary.expiredSeats, format: count });
      lines.push({ label: STRINGS.summary.expiredCost, to: summary.expiredCost, format: money });
    }
    if (summary.refunds > 0) lines.push({ label: STRINGS.summary.refunds, to: summary.refunds, format: money });
    if (summary.weatherLostSeats > 0) {
      lines.push({ label: STRINGS.summary.weatherLostSeats, to: summary.weatherLostSeats, format: count });
      lines.push({ label: STRINGS.summary.weatherLostCost, to: summary.weatherLostCost, format: money });
    }
    if (summary.cancelledTickets > 0) {
      lines.push({ label: STRINGS.summary.cancelledTickets, to: summary.cancelledTickets, format: count });
      lines.push({ label: STRINGS.summary.cancelRefunds, to: summary.cancelRefunds, format: money });
    }
    if (summary.penalties > 0) lines.push({ label: STRINGS.summary.penalties, to: summary.penalties, format: money });
    lines.push({ label: STRINGS.summary.profit, to: summary.moneyEnd - summary.moneyStart, format: money });
    lines.push({ label: STRINGS.summary.served, to: summary.served, format: count });
    lines.push({ label: STRINGS.summary.left, to: summary.left, format: count });
    if (notServed > 0) lines.push({ label: STRINGS.summary.notServed, to: notServed, format: count });
    lines.push({ label: STRINGS.summary.avgStars, to: summary.avgStars, format: (v) => v.toFixed(1) });
    if (summary.travelVietAfter !== null) {
      lines.push({ label: STRINGS.summary.travelViet, to: summary.travelVietAfter, format: (v) => v.toFixed(1) });
    }
    lines.push({ label: STRINGS.summary.moneyEnd, to: summary.moneyEnd, format: money });
    return lines;
  }

  private revealLines(lines: SummaryLine[]): void {
    const stagger = lines.length > 0 ? TOTAL_REVEAL_MS / lines.length : 0;
    lines.forEach((line, index) => {
      const y = LINES_TOP + index * LINE_HEIGHT;
      const label = this.add
        .text(GAME_WIDTH / 2 - 260, y, line.label, { fontFamily: FONT_FAMILY, fontSize: `${LINE_LABEL_FONT_PX}px`, color: toCssColor(COLORS.text) })
        .setOrigin(0, 0.5)
        .setAlpha(0);
      const timer = this.time.delayedCall(index * stagger, () => this.revealLine(label, line, y, Math.min(500, Math.max(150, stagger))));
      this.pendingTimers.push(timer);
    });
  }

  private revealLine(label: Phaser.GameObjects.Text, line: SummaryLine, y: number, durationMs: number): void {
    label.setAlpha(1);
    const value = new CountUpText(this, GAME_WIDTH / 2 + 260, y, {
      to: line.to,
      durationMs,
      format: line.format,
      style: { fontFamily: FONT_FAMILY, fontSize: `${LINE_VALUE_FONT_PX}px`, fontStyle: 'bold', color: toCssColor(COLORS.text) },
    }).setOrigin(1, 0.5);
    this.countUps.push(value);
  }

  private skipReveal(): void {
    for (const timer of this.pendingTimers) {
      if (!timer.hasDispatched) timer.callback.apply(timer.callbackScope, timer.args);
      timer.remove();
    }
    this.pendingTimers = [];
    for (const value of this.countUps) value.skip();
  }

  private handleContinue(summary: DaySummary): void {
    if (summary.staffNotices.length > 0 && !this.noticesShown) {
      this.noticesShown = true;
      new DialogOverlay(this, {
        title: STRINGS.staff.notice.title,
        message: summary.staffNotices.map((notice) => noticeText(notice, summary.day + 1)).join('\n\n'),
        buttons: [{ label: STRINGS.staff.notice.ok, variant: 'primary', onTap: () => this.handleContinue(summary) }],
      });
      return;
    }
    const state = sessionBridge.current.state;
    if (summary.day === TRAVELVIET_FROM_DAY - 1 && !state.flags['travelVietIntro']) {
      sessionBridge.dispatch({ type: 'FLAG_SET', flag: 'travelVietIntro' });
      new DialogOverlay(this, {
        title: STRINGS.summary.travelVietIntroTitle,
        message: STRINGS.summary.travelVietIntroMessage,
        buttons: [{ label: STRINGS.summary.continueButton, variant: 'primary', onTap: () => this.goToShop() }],
      });
      return;
    }
    this.goToShop();
  }

  private goToShop(): void {
    this.continueButton.lock();
    sessionBridge.enterNextDayPrep();
    this.scene.start('Shop');
  }
}
