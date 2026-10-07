import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { isMusicMuted, setMusicMuted } from '@platform/musicMute';
import { showSaveCodeToPlayer } from '@platform/saveTransfer';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { Slider } from '@ui/Slider';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { Toggle } from '@ui/Toggle';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { sessionBridge } from '../sessionBridge';
import { ImportSaveOverlay } from './ImportSaveOverlay';

export interface SettingsOverlayOptions {
  /** Only PrepScene needs this — CounterScene already has "Về màn hình chính" in PauseOverlay. */
  onExitToTitle?: () => void;
}

const PANEL_WIDTH = 600;
const PANEL_HEIGHT_BASE = 550;
const EXIT_BUTTON_EXTRA_HEIGHT = 120;
const SAVE_CODE_EXTRA_HEIGHT = 200;
const SAVE_CODE_BUTTON_HEIGHT = 72;
const SLIDER_WIDTH = 440;
const LABEL_STYLE = { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.text) };

/** PLAN §10.9-style settings overlay: đổi âm lượng/rung, lưu ngay (SETTINGS_UPDATE là mốc lưu). */
export class SettingsOverlay extends BaseOverlay {
  constructor(scene: Phaser.Scene, options: SettingsOverlayOptions = {}) {
    super(scene, { closeOnBackdropTap: true });
    const PANEL_HEIGHT = PANEL_HEIGHT_BASE + (options.onExitToTitle ? EXIT_BUTTON_EXTRA_HEIGHT + SAVE_CODE_EXTRA_HEIGHT : 0);
    const settings = sessionBridge.current.state.settings;

    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: PANEL_HEIGHT });
    const title = scene.add.text(0, -PANEL_HEIGHT / 2 + 50, STRINGS.settings.title, TEXT_STYLES.heading).setOrigin(0.5);

    const musicLabel = scene.add
      .text(-PANEL_WIDTH / 2 + 80, -PANEL_HEIGHT / 2 + 140, STRINGS.settings.musicVolume, LABEL_STYLE)
      .setOrigin(0, 0.5);
    const musicSlider = new Slider(scene, -SLIDER_WIDTH / 2, -PANEL_HEIGHT / 2 + 190, {
      width: SLIDER_WIDTH,
      initialValue: settings.musicVolume,
      onCommit: (value) => sessionBridge.dispatch({ type: 'SETTINGS_UPDATE', patch: { musicVolume: value } }),
    });

    const sfxLabel = scene.add
      .text(-PANEL_WIDTH / 2 + 80, -PANEL_HEIGHT / 2 + 260, STRINGS.settings.sfxVolume, LABEL_STYLE)
      .setOrigin(0, 0.5);
    const sfxSlider = new Slider(scene, -SLIDER_WIDTH / 2, -PANEL_HEIGHT / 2 + 310, {
      width: SLIDER_WIDTH,
      initialValue: settings.sfxVolume,
      onCommit: (value) => sessionBridge.dispatch({ type: 'SETTINGS_UPDATE', patch: { sfxVolume: value } }),
    });

    const hapticsLabel = scene.add
      .text(-PANEL_WIDTH / 2 + 80, -PANEL_HEIGHT / 2 + 380, STRINGS.settings.haptics, LABEL_STYLE)
      .setOrigin(0, 0.5);
    const hapticsToggle = new Toggle(scene, PANEL_WIDTH / 2 - 100, -PANEL_HEIGHT / 2 + 380, {
      value: settings.haptics,
      onChange: (value) => sessionBridge.dispatch({ type: 'SETTINGS_UPDATE', patch: { haptics: value } }),
    });

    const musicMuteLabel = scene.add
      .text(-PANEL_WIDTH / 2 + 80, -PANEL_HEIGHT / 2 + 450, STRINGS.settings.musicMute, LABEL_STYLE)
      .setOrigin(0, 0.5);
    const musicMuteToggle = new Toggle(scene, PANEL_WIDTH / 2 - 100, -PANEL_HEIGHT / 2 + 450, {
      value: isMusicMuted(),
      onChange: setMusicMuted,
    });

    const closeText = scene.add
      .text(PANEL_WIDTH / 2 - 20, -PANEL_HEIGHT / 2 + 20, '✕', { fontFamily: FONT_FAMILY, fontSize: '28px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    closeText.on('pointerup', () => this.close());

    panel.add([title, musicLabel, musicSlider, sfxLabel, sfxSlider, hapticsLabel, hapticsToggle, musicMuteLabel, musicMuteToggle, closeText]);

    if (options.onExitToTitle) {
      const exportButton = new Button(scene, 0, PANEL_HEIGHT / 2 - 60 - SAVE_CODE_EXTRA_HEIGHT, {
        width: PANEL_WIDTH - 80,
        height: SAVE_CODE_BUTTON_HEIGHT,
        label: STRINGS.settings.exportCode,
        variant: 'ghost',
        onTap: () => void showSaveCodeToPlayer(sessionBridge.current.state),
      });
      const importButton = new Button(scene, 0, PANEL_HEIGHT / 2 - 60 - SAVE_CODE_EXTRA_HEIGHT / 2, {
        width: PANEL_WIDTH - 80,
        height: SAVE_CODE_BUTTON_HEIGHT,
        label: STRINGS.settings.importCode,
        variant: 'ghost',
        onTap: () => new ImportSaveOverlay(scene),
      });
      panel.add([exportButton, importButton]);
      const exitButton = new Button(scene, 0, PANEL_HEIGHT / 2 - 60, {
        width: PANEL_WIDTH - 80,
        height: 72,
        label: STRINGS.pause.exitToTitle,
        variant: 'ghost',
        onTap: () => options.onExitToTitle?.(),
      });
      panel.add(exitButton);
    }

    this.add(panel);
  }
}
