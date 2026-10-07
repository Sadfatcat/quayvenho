import { STRINGS } from '@data/strings';
import { GameSession } from '@domain/game';
import type { DayPhase, GameState } from '@domain/models';
import { clearSave, type LoadSaveResult } from '@save/storage';
import { Button } from '@ui/Button';
import { isMusicMuted, setMusicMuted } from '@platform/musicMute';
import { createGameSeed } from '@platform/seed';
import { formatMoney } from '@ui/format';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, SPACING, toCssColor } from '@ui/theme';
import { ToastQueue } from '@ui/Toast';
import { GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { ImportSaveOverlay } from './overlays/ImportSaveOverlay';
import { promptForPwaUpdate } from './overlays/UpdatePrompt';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

const BUTTON_WIDTH = 380;
const BUTTON_HEIGHT = 84;

const TITLE_TEXT_Y = 400;
const TITLE_FONT_SIZE = '80px';
const MUSIC_BUTTON = { width: 180, height: 56, fontSize: 22, y: 100 };
const BUTTONS_START_Y = 780;

/** PLAN §10.3. `loadResult` is stashed on the registry by BootScene. */
export class TitleScene extends BaseScene {
  constructor() {
    super('Title');
    this.backgroundTheme = 'title';
  }

  protected onCreate(): void {
    promptForPwaUpdate(this);
    const loadResult = this.registry.get('loadResult') as LoadSaveResult | undefined;

    this.add.text(GAME_WIDTH / 2, TITLE_TEXT_Y, STRINGS.gameTitle, { ...TEXT_STYLES.title, fontSize: TITLE_FONT_SIZE }).setOrigin(0.5);

    this.addMusicButton();

    let y = BUTTONS_START_Y;
    if (loadResult?.ok && loadResult.value.profile) {
      const { profile, day, money } = loadResult.value;
      this.add
        .text(
          GAME_WIDTH / 2,
          y - 90,
          `${profile.brandName} · ${STRINGS.title.dayLabel} ${day} · ${formatMoney(money)}`,
          { fontFamily: FONT_FAMILY, fontSize: '24px', color: toCssColor(COLORS.textMuted) },
        )
        .setOrigin(0.5);
      new Button(this, GAME_WIDTH / 2, y, {
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
        label: STRINGS.title.continue,
        variant: 'primary',
        onTap: () => this.continueGame(loadResult.value),
      });
      y += BUTTON_HEIGHT + SPACING.md;
    }

    new Button(this, GAME_WIDTH / 2, y, {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.title.newGame,
      variant: loadResult?.ok ? 'ghost' : 'primary',
      onTap: () => this.requestNewGame(loadResult),
    });
    y += BUTTON_HEIGHT + SPACING.md;

    new Button(this, GAME_WIDTH / 2, y, {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.settings.importCode,
      variant: 'ghost',
      onTap: () => new ImportSaveOverlay(this),
    });

    if (loadResult?.ok && loadResult.recoveredFromBackup) {
      new ToastQueue(this).show(STRINGS.title.recoveredFromBackup, 4000);
    }
  }

  private addMusicButton(): void {
    const labelFor = (muted: boolean): string => (muted ? STRINGS.title.musicOff : STRINGS.title.musicOn);
    const button = new Button(this, GAME_WIDTH - SPACING.lg - MUSIC_BUTTON.width / 2, MUSIC_BUTTON.y, {
      width: MUSIC_BUTTON.width,
      height: MUSIC_BUTTON.height,
      fontSize: MUSIC_BUTTON.fontSize,
      label: labelFor(isMusicMuted()),
      variant: 'ghost',
      onTap: () => {
        const muted = !isMusicMuted();
        setMusicMuted(muted);
        button.setLabel(labelFor(muted));
      },
    });
  }

  private continueGame(state: GameState): void {
    sessionBridge.start(new GameSession(state));
    this.scene.start(this.sceneKeyFor(state.phase));
  }

  private requestNewGame(loadResult: LoadSaveResult | undefined): void {
    if (!loadResult?.ok) {
      this.startNewGame();
      return;
    }
    new DialogOverlay(this, {
      title: STRINGS.title.newGameConfirmTitle,
      message: STRINGS.title.newGameConfirmMessage,
      buttons: [
        { label: STRINGS.title.newGameConfirmCancel, variant: 'ghost', onTap: () => {} },
        { label: STRINGS.title.newGameConfirmYes, variant: 'danger', onTap: () => this.startNewGame() },
      ],
    });
  }

  private startNewGame(): void {
    clearSave();
    sessionBridge.start(GameSession.newGame(createGameSeed()));
    this.scene.start('Onboarding');
  }

  private sceneKeyFor(phase: DayPhase): string {
    switch (phase) {
      case 'SUMMARY':
        return 'Summary';
      case 'SHOP':
        return 'Shop';
      default:
        return 'Prep';
    }
  }
}
