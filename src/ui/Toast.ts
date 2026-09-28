import Phaser from 'phaser';
import { CONTENT_BOTTOM } from './layout';
import { Panel } from './Panel';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';
import { GAME_WIDTH } from '../config';

const MAX_VISIBLE = 3;
const TOAST_WIDTH = 600;
const TOAST_HEIGHT = 72;
const TOAST_GAP = 12;
const DEFAULT_DURATION_MS = 2200;
const TOAST_DEPTH = 2000;

interface ActiveToast {
  panel: Panel;
}

/** Stacks messages bottom-up above the safe area; queues extra ones instead of overlapping. */
export class ToastQueue {
  private readonly scene: Phaser.Scene;
  private readonly active: ActiveToast[] = [];
  private readonly pending: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(message: string, durationMs = DEFAULT_DURATION_MS): void {
    if (this.active.length >= MAX_VISIBLE) {
      this.pending.push(message);
      return;
    }
    this.spawn(message, durationMs);
  }

  private spawn(message: string, durationMs: number): void {
    const index = this.active.length;
    const panel = new Panel(this.scene, GAME_WIDTH / 2, this.yFor(index), {
      width: TOAST_WIDTH,
      height: TOAST_HEIGHT,
      fill: COLORS.text,
      fillAlpha: 0.92,
    });
    panel.setDepth(TOAST_DEPTH);
    const text = this.scene.add
      .text(0, 0, message, {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        color: toCssColor(COLORS.cloud),
        align: 'center',
        wordWrap: { width: TOAST_WIDTH - 60 },
      })
      .setOrigin(0.5);
    panel.add(text);
    const entry: ActiveToast = { panel };
    this.active.push(entry);
    this.scene.time.delayedCall(durationMs, () => this.dismiss(entry));
  }

  private dismiss(entry: ActiveToast): void {
    entry.panel.destroy();
    const index = this.active.indexOf(entry);
    if (index >= 0) this.active.splice(index, 1);
    this.relayout();
    const next = this.pending.shift();
    if (next !== undefined) this.spawn(next, DEFAULT_DURATION_MS);
  }

  private relayout(): void {
    this.active.forEach((entry, index) => entry.panel.setY(this.yFor(index)));
  }

  private yFor(index: number): number {
    return CONTENT_BOTTOM - TOAST_HEIGHT / 2 - index * (TOAST_HEIGHT + TOAST_GAP);
  }
}
