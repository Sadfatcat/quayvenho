import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { DialogOverlay } from '@scenes/overlays/DialogOverlay';
import { PauseOverlay } from '@scenes/overlays/PauseOverlay';
import { BaseScene } from '@scenes/BaseScene';
import { Button, type ButtonVariant } from '@ui/Button';
import { CountUpText } from '@ui/CountUpText';
import { showFloatingText } from '@ui/FloatingText';
import { IconLabel } from '@ui/IconLabel';
import { Panel } from '@ui/Panel';
import { ProgressBar } from '@ui/ProgressBar';
import { ScrollList } from '@ui/ScrollList';
import { ToastQueue } from '@ui/Toast';
import { COLORS, FONT_FAMILY, SPACING, toCssColor } from '@ui/theme';
import { GAME_WIDTH } from '../config';

const SECTION_GAP = 70;
const CONTENT_LEFT = 40;
const BUTTON_VARIANTS: readonly ButtonVariant[] = ['primary', 'success', 'danger', 'ghost'];

/** Dev-only catalogue of every common UI component. Open with `?playground`, never bundled in production. */
export class PlaygroundScene extends BaseScene {
  private toasts!: ToastQueue;
  private cursorY = 40;

  constructor() {
    super('Playground');
  }

  protected onCreate(): void {
    this.toasts = new ToastQueue(this);
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY + dy, 0, this.maxScroll());
    });

    this.addHeading(STRINGS.playground.title);
    this.buildButtonsSection();
    this.buildPanelsSection();
    this.buildOverlaysSection();
    this.buildProgressSection();
    this.buildNumbersSection();
    this.buildListSection();
  }

  private maxScroll(): number {
    return Math.max(0, this.cursorY + SPACING.xl - this.cameras.main.height);
  }

  private addHeading(text: string): void {
    this.add.text(CONTENT_LEFT, this.cursorY, text, {
      fontFamily: FONT_FAMILY,
      fontSize: '40px',
      fontStyle: 'bold',
      color: toCssColor(COLORS.text),
    });
    this.cursorY += 70;
  }

  private addLabel(text: string): void {
    this.add.text(CONTENT_LEFT, this.cursorY, text, { fontFamily: FONT_FAMILY, fontSize: '26px', color: toCssColor(COLORS.textMuted) });
    this.cursorY += 70;
  }

  private buildButtonsSection(): void {
    this.addLabel(STRINGS.playground.buttons);
    BUTTON_VARIANTS.forEach((variant, index) => {
      new Button(this, CONTENT_LEFT + 110 + index * 165, this.cursorY, {
        width: 150,
        height: 72,
        label: variant,
        variant,
        onTap: () => this.toasts.show(`${variant} tapped`),
      });
    });
    this.cursorY += 90;
    new Button(this, CONTENT_LEFT + 110, this.cursorY, {
      width: 200,
      height: 72,
      label: 'disabled',
      onTap: () => this.toasts.show('should not fire'),
    }).setEnabled(false);
    this.cursorY += SECTION_GAP + 20;
  }

  private buildPanelsSection(): void {
    this.addLabel(STRINGS.playground.panels);
    const panel = new Panel(this, CONTENT_LEFT + 260, this.cursorY + 30, { width: 480, height: 90, strokeColor: COLORS.text });
    panel.add(new IconLabel(this, -200, 0, { text: STRINGS.playground.sampleFlight, iconColor: COLORS.accent }));
    this.cursorY += 90 + SECTION_GAP;
  }

  private buildOverlaysSection(): void {
    this.addLabel(STRINGS.playground.overlays);
    new Button(this, CONTENT_LEFT + 100, this.cursorY, {
      width: 180,
      height: 72,
      label: 'Dialog',
      onTap: () =>
        new DialogOverlay(this, {
          title: STRINGS.playground.dialogTitle,
          message: STRINGS.playground.dialogMessage,
          buttons: [
            { label: STRINGS.playground.dialogCancel, variant: 'ghost', onTap: () => {} },
            { label: STRINGS.playground.dialogConfirm, onTap: () => this.toasts.show('confirmed') },
          ],
        }),
    });
    new Button(this, CONTENT_LEFT + 300, this.cursorY, {
      width: 180,
      height: 72,
      label: 'Toast',
      onTap: () => this.toasts.show(STRINGS.playground.toastSample),
    });
    new Button(this, CONTENT_LEFT + 500, this.cursorY, {
      width: 180,
      height: 72,
      label: 'Pause',
      onTap: () => new PauseOverlay(this, { onResume: () => {}, onExit: () => this.toasts.show('exit tapped') }),
    });
    this.cursorY += SECTION_GAP + 10;
  }

  private buildProgressSection(): void {
    this.addLabel(STRINGS.playground.progress);
    new ProgressBar(this, CONTENT_LEFT + 220, this.cursorY, { width: 400, height: 24 }).setProgress(0.6);
    this.cursorY += SECTION_GAP;
  }

  private buildNumbersSection(): void {
    this.addLabel(STRINGS.playground.numbers);
    new Button(this, CONTENT_LEFT + 100, this.cursorY, {
      width: 180,
      height: 72,
      label: 'Float +75',
      onTap: () => showFloatingText(this, CONTENT_LEFT + 100, this.cursorY, { text: STRINGS.playground.floatUp }),
    });
    const countUp = new CountUpText(this, CONTENT_LEFT + 320, this.cursorY, {
      to: 1234,
      durationMs: 1200,
      style: { fontFamily: FONT_FAMILY, fontSize: '32px', color: toCssColor(COLORS.text) },
    });
    countUp.setInteractive(new Phaser.Geom.Rectangle(0, 0, 160, 40), Phaser.Geom.Rectangle.Contains);
    countUp.on('pointerup', () => countUp.skip());
    this.cursorY += SECTION_GAP;
  }

  private buildListSection(): void {
    this.addLabel(STRINGS.playground.list);
    const width = GAME_WIDTH - CONTENT_LEFT * 2;
    const items = Array.from({ length: 20 }, (_, i) => i + 1);
    new ScrollList(this, {
      x: CONTENT_LEFT,
      y: this.cursorY,
      width,
      height: 320,
      itemHeight: 64,
      items,
      renderItem: (item, index) => {
        const row = this.add.container(0, 0);
        const panel = new Panel(this, width / 2, 28, { width: width - 20, height: 56 });
        const label = this.add
          .text(20, 28, `${STRINGS.playground.listItem} ${item}`, { fontFamily: FONT_FAMILY, fontSize: '26px', color: toCssColor(COLORS.text) })
          .setOrigin(0, 0.5);
        const button = new Button(this, width - 100, 28, {
          width: 120,
          height: 44,
          label: STRINGS.playground.select,
          onTap: () => this.toasts.show(`${STRINGS.playground.listItem} ${item} · index ${index}`),
        });
        row.add([panel, label, button]);
        return row;
      },
    });
    this.cursorY += 320 + SECTION_GAP;
  }
}
