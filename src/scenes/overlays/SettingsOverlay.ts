import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { Slider } from '@ui/Slider';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { Toggle } from '@ui/Toggle';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { sessionBridge } from '../sessionBridge';

export interface SettingsOverlayOptions {
  /** Only PrepScene needs this — CounterScene already has "Về màn hình chính" in PauseOverlay. */
  onExitToTitle?: () => void;
}

const PANEL_WIDTH = 600;
const PANEL_HEIGHT = 480;
const SLIDER_WIDTH = 440;

/** PLAN §10.9-style settings overlay: đổi âm lượng/rung, lưu ngay (SETTINGS_UPDATE là mốc lưu). */
export class SettingsOverlay extends BaseOverlay {
  constructor(scene: Phaser.Scene, options: SettingsOverlayOptions = {}) {
    super(scene, { closeOnBackdropTap: true });
    const settings = sessionBridge.current.state.settings;

    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: PANEL_HEIGHT });
    const title = scene.add.text(0, -PANEL_HEIGHT / 2 + 50, STRINGS.settings.title, TEXT_STYLES.heading).setOrigin(0.5);

    const musicLabel = scene.add
      .text(-PANEL_WIDTH / 2 + 80, -PANEL_HEIGHT / 2 + 140, STRINGS.settings.musicVolume, { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0.5);
    const musicSlider = new Slider(scene, -SLIDER_WIDTH / 2, -PANEL_HEIGHT / 2 + 190, {
      width: SLIDER_WIDTH,
      initialValue: settings.musicVolume,
      onCommit: (value) => sessionBridge.dispatch({ type: 'SETTINGS_UPDATE', patch: { musicVolume: value } }),
    });

    const sfxLabel = scene.add
      .text(-PANEL_WIDTH / 2 + 80, -PANEL_HEIGHT / 2 + 260, STRINGS.settings.sfxVolume, { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0.5);
    const sfxSlider = new Slider(scene, -SLIDER_WIDTH / 2, -PANEL_HEIGHT / 2 + 310, {
      width: SLIDER_WIDTH,
      initialValue: settings.sfxVolume,
      onCommit: (value) => sessionBridge.dispatch({ type: 'SETTINGS_UPDATE', patch: { sfxVolume: value } }),
    });

    const hapticsLabel = scene.add
      .text(-PANEL_WIDTH / 2 + 80, -PANEL_HEIGHT / 2 + 380, STRINGS.settings.haptics, { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.text) })
      .setOrigin(0, 0.5);
    const hapticsToggle = new Toggle(scene, PANEL_WIDTH / 2 - 100, -PANEL_HEIGHT / 2 + 380, {
      value: settings.haptics,
      onChange: (value) => sessionBridge.dispatch({ type: 'SETTINGS_UPDATE', patch: { haptics: value } }),
    });

    const closeText = scene.add
      .text(PANEL_WIDTH / 2 - 20, -PANEL_HEIGHT / 2 + 20, '✕', { fontFamily: FONT_FAMILY, fontSize: '28px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    closeText.on('pointerup', () => this.close());

    panel.add([title, musicLabel, musicSlider, sfxLabel, sfxSlider, hapticsLabel, hapticsToggle, closeText]);

    if (options.onExitToTitle) {
      const exitButton = new Button(scene, 0, PANEL_HEIGHT / 2 - 60, {
        width: PANEL_WIDTH - 80,
        height: 80,
        label: STRINGS.pause.exitToTitle,
        variant: 'ghost',
        onTap: () => options.onExitToTitle?.(),
      });
      panel.add(exitButton);
    }

    this.add(panel);
  }
}
