import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import type { DaySummary } from '@domain/models';
import { Button } from '@ui/Button';
import { CountUpText } from '@ui/CountUpText';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

interface SummaryLine {
  label: string;
  to: number;
  format: (value: number) => string;
}

const LINES_TOP = 320;
const LINE_HEIGHT = 40;
const TOTAL_REVEAL_MS = 3000;
const BUTTON_HEIGHT = 96;
const BUTTON_Y = GAME_HEIGHT - 140;

const money = (value: number): string => `${Math.round(value)} ${STRINGS.common.currencySuffix}`;
const count = (value: number): string => String(Math.round(value));

/** PLAN §10.8/§5.6. Thay overlay tạm trong CounterScene (Giai đoạn 3) bằng scene thật. */
export class SummaryScene extends BaseScene {
  private countUps: CountUpText[] = [];
  private pendingTimers: Phaser.Time.TimerEvent[] = [];
  private continueButton!: Button;

  constructor() {
    super('Summary');
  }

  protected onCreate(): void {
    const state = sessionBridge.current.state;
    const summary = state.lastSummary;
    if (!summary) {
      this.scene.start('Title');
      return;
    }

    this.add.text(GAME_WIDTH / 2, 180, `${state.profile?.brandName ?? ''} — ${STRINGS.title.dayLabel} ${summary.day}`, TEXT_STYLES.heading).setOrigin(0.5);

    const lines = this.buildLines(summary);
    this.revealLines(lines);

    if (summary.moneyEnd - summary.moneyStart < 0) {
      const tips = STRINGS.summary.lossTips;
      const tip = tips[Math.floor(Math.random() * tips.length)] ?? tips[0];
      this.add
        .text(GAME_WIDTH / 2, LINES_TOP + lines.length * LINE_HEIGHT + 50, tip, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: GAME_WIDTH - 120 } })
        .setOrigin(0.5, 0);
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
      .text(GAME_WIDTH / 2, BUTTON_Y + BUTTON_HEIGHT / 2 + 24, STRINGS.summary.tapToSkip, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(0.5);
  }

  private buildLines(summary: DaySummary): SummaryLine[] {
    const lines: SummaryLine[] = [
      { label: STRINGS.summary.moneyStart, to: summary.moneyStart, format: money },
      { label: STRINGS.summary.ticketRevenue, to: summary.ticketRevenue, format: money },
      { label: STRINGS.summary.tips, to: summary.tips, format: money },
      { label: STRINGS.summary.seatCost, to: summary.seatCost, format: money },
    ];
    if (summary.shopCost > 0) lines.push({ label: STRINGS.summary.shopCost, to: summary.shopCost, format: money });
    if (summary.expiredSeats > 0) {
      lines.push({ label: STRINGS.summary.expiredSeats, to: summary.expiredSeats, format: count });
      lines.push({ label: STRINGS.summary.expiredCost, to: summary.expiredCost, format: money });
    }
    if (summary.refunds > 0) lines.push({ label: STRINGS.summary.refunds, to: summary.refunds, format: money });
    if (summary.weatherLostSeats > 0) {
      lines.push({ label: STRINGS.summary.weatherLostSeats, to: summary.weatherLostSeats, format: count });
      lines.push({ label: STRINGS.summary.weatherLostCost, to: summary.weatherLostCost, format: money });
    }
    if (summary.penalties > 0) lines.push({ label: STRINGS.summary.penalties, to: summary.penalties, format: money });
    lines.push({ label: STRINGS.summary.profit, to: summary.moneyEnd - summary.moneyStart, format: money });
    lines.push({ label: STRINGS.summary.served, to: summary.served, format: count });
    lines.push({ label: STRINGS.summary.left, to: summary.left, format: count });
    lines.push({ label: STRINGS.summary.turnedAway, to: summary.turnedAway, format: count });
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
        .text(GAME_WIDTH / 2 - 260, y, line.label, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.textMuted) })
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
      style: { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: toCssColor(COLORS.text) },
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
    const state = sessionBridge.current.state;
    if (summary.day === 10 && !state.flags['travelVietIntro']) {
      sessionBridge.dispatch({ type: 'FLAG_SET', flag: 'travelVietIntro' });
      new DialogOverlay(this, {
        title: STRINGS.summary.travelVietIntroTitle,
        message: STRINGS.summary.travelVietIntroMessage,
        buttons: [{ label: STRINGS.summary.continueButton, variant: 'primary', onTap: () => this.goToNextDay() }],
      });
      return;
    }
    this.goToNextDay();
  }

  /** Tạm thời bỏ qua Shop (chưa build, ticket 05) — đi thẳng GO_TO_SHOP -> NEXT_DAY. */
  private goToNextDay(): void {
    this.continueButton.lock();
    sessionBridge.dispatch({ type: 'GO_TO_SHOP' });
    sessionBridge.dispatch({ type: 'NEXT_DAY' });
    this.scene.start('Prep');
  }
}
