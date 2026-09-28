import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { COLORS, FONT_FAMILY, SPACING, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { DialogOverlay } from './DialogOverlay';

export interface PauseOverlayOptions {
  onResume: () => void;
  onSettings?: () => void;
  onExit?: () => void;
}

const PANEL_WIDTH = 480;
const PANEL_HEIGHT = 420;
const BUTTON_HEIGHT = 88;
const BUTTON_WIDTH = PANEL_WIDTH - 80;

/** PLAN §10.9: opened by the pause button, Android back, or the tab going hidden. */
export class PauseOverlay extends BaseOverlay {
  constructor(scene: Phaser.Scene, options: PauseOverlayOptions) {
    super(scene, { closeOnBackdropTap: false });

    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: PANEL_HEIGHT });
    const title = scene.add
      .text(0, -PANEL_HEIGHT / 2 + 60, STRINGS.pause.title, {
        fontFamily: FONT_FAMILY,
        fontSize: '36px',
        fontStyle: 'bold',
        color: toCssColor(COLORS.text),
      })
      .setOrigin(0.5);

    const resumeButton = new Button(scene, 0, -60, {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.pause.resume,
      variant: 'primary',
      onTap: () => {
        this.close();
        options.onResume();
      },
    });
    const settingsButton = new Button(scene, 0, -60 + (BUTTON_HEIGHT + SPACING.sm), {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.pause.settings,
      variant: 'ghost',
      onTap: () => options.onSettings?.(),
    });
    const exitButton = new Button(scene, 0, -60 + 2 * (BUTTON_HEIGHT + SPACING.sm), {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.pause.exitToTitle,
      variant: 'danger',
      onTap: () => this.confirmExit(scene, options),
    });

    panel.add([title, resumeButton, settingsButton, exitButton]);
    this.add(panel);
  }

  private confirmExit(scene: Phaser.Scene, options: PauseOverlayOptions): void {
    new DialogOverlay(scene, {
      title: STRINGS.pause.exitConfirmTitle,
      message: STRINGS.pause.exitConfirmMessage,
      buttons: [
        { label: STRINGS.pause.exitConfirmCancel, variant: 'ghost', onTap: () => {} },
        {
          label: STRINGS.pause.exitConfirmYes,
          variant: 'danger',
          onTap: () => {
            this.close();
            options.onExit?.();
          },
        },
      ],
    });
  }
}
