import Phaser from 'phaser';
import { invariant } from '@domain/common/invariant';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button, type ButtonVariant } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { COLORS, FONT_FAMILY, SPACING, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';

export interface DialogButtonSpec {
  label: string;
  variant?: ButtonVariant;
  onTap: () => void;
}

export interface DialogOptions {
  title: string;
  message: string;
  buttons: readonly DialogButtonSpec[];
}

const PANEL_WIDTH = 600;
const BUTTON_HEIGHT = 88;
const HEADER_HEIGHT = 260;

/** Generic 1–3 button dialog (PLAN §10.9). Caller supplies Vietnamese copy from strings.ts. */
export class DialogOverlay extends BaseOverlay {
  constructor(scene: Phaser.Scene, options: DialogOptions) {
    invariant(options.buttons.length >= 1 && options.buttons.length <= 3, 'DialogOverlay needs 1–3 buttons');
    super(scene, { closeOnBackdropTap: false });

    const buttonsHeight = options.buttons.length * BUTTON_HEIGHT + (options.buttons.length - 1) * SPACING.sm;
    const panelHeight = HEADER_HEIGHT + buttonsHeight;
    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: panelHeight });

    const title = scene.add
      .text(0, -panelHeight / 2 + 60, options.title, {
        fontFamily: FONT_FAMILY,
        fontSize: '36px',
        fontStyle: 'bold',
        color: toCssColor(COLORS.text),
      })
      .setOrigin(0.5);
    const message = scene.add
      .text(0, -panelHeight / 2 + 130, options.message, {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        color: toCssColor(COLORS.textMuted),
        align: 'center',
        wordWrap: { width: PANEL_WIDTH - 80 },
      })
      .setOrigin(0.5, 0);

    const buttonsTop = panelHeight / 2 - buttonsHeight - SPACING.lg;
    const buttons = options.buttons.map(
      (spec, index) =>
        new Button(scene, 0, buttonsTop + BUTTON_HEIGHT / 2 + index * (BUTTON_HEIGHT + SPACING.sm), {
          width: PANEL_WIDTH - 80,
          height: BUTTON_HEIGHT,
          label: spec.label,
          variant: spec.variant ?? 'primary',
          onTap: () => {
            spec.onTap();
            this.close();
          },
        }),
    );

    panel.add([title, message, ...buttons]);
    this.add(panel);
  }
}
