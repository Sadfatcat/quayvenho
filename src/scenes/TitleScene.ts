import { STRINGS } from '@data/strings';
import { GameSession } from '@domain/game';
import type { DayPhase, GameState } from '@domain/models';
import { clearSave, type LoadSaveResult } from '@save/storage';
import { Button } from '@ui/Button';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, SPACING, toCssColor } from '@ui/theme';
import { ToastQueue } from '@ui/Toast';
import { GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { promptForPwaUpdate } from './overlays/UpdatePrompt';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

const BUTTON_WIDTH = 420;
const BUTTON_HEIGHT = 100;

/** PLAN §10.3. `loadResult` is stashed on the registry by BootScene. */
export class TitleScene extends BaseScene {
  constructor() {
    super('Title');
  }

  protected onCreate(): void {
    promptForPwaUpdate(this);
    const loadResult = this.registry.get('loadResult') as LoadSaveResult | undefined;

    this.add.text(GAME_WIDTH / 2, 280, STRINGS.gameTitle, TEXT_STYLES.title).setOrigin(0.5);

    let y = 560;
    if (loadResult?.ok && loadResult.value.profile) {
      const { profile, day, money } = loadResult.value;
      this.add
        .text(
          GAME_WIDTH / 2,
          y - 90,
          `${profile.brandName} · ${STRINGS.title.dayLabel} ${day} · ${money} ${STRINGS.common.currencySuffix}`,
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

    if (loadResult?.ok && loadResult.recoveredFromBackup) {
      new ToastQueue(this).show(STRINGS.title.recoveredFromBackup, 4000);
    }
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
    sessionBridge.start(GameSession.newGame(Math.floor(Math.random() * 0x7fffffff)));
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
