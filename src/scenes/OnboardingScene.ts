import { STRINGS } from '@data/strings';
import { PROFILE_LIMITS } from '@data/balance';
import { Button } from '@ui/Button';
import { SpeechBubble } from '@ui/SpeechBubble';
import { TextInput } from '@ui/TextInput';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { sessionBridge } from './sessionBridge';

const BUBBLE_WIDTH = 600;
const INPUT_WIDTH = 500;
const BUTTON_WIDTH = 300;
const BUTTON_HEIGHT = 96;

/** PLAN §10.4/§2.2. Thoại của Béo ở đây là tạm — nội dung thật chốt ở Giai đoạn 6 (6.6). */
export class OnboardingScene extends BaseScene {
  private introIndex = 0;
  private playerName = '';
  private brandName = '';
  private readonly stepObjects: { destroy: () => void }[] = [];
  private nextButton: Button | null = null;

  constructor() {
    super('Onboarding');
  }

  protected onCreate(): void {
    this.showIntro();
  }

  private clearStep(): void {
    for (const obj of this.stepObjects) obj.destroy();
    this.stepObjects.length = 0;
    this.nextButton = null;
  }

  private showIntro(): void {
    this.clearStep();
    const bubble = new SpeechBubble(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, {
      width: BUBBLE_WIDTH,
      text: STRINGS.onboarding.introLines[this.introIndex] ?? '',
    });
    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, STRINGS.onboarding.tapToContinue, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: toCssColor(COLORS.textMuted),
      })
      .setOrigin(0.5);
    const tapZone = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive();
    tapZone.on('pointerup', () => this.advanceIntro());
    this.stepObjects.push(bubble, hint, tapZone);
  }

  private advanceIntro(): void {
    this.introIndex += 1;
    if (this.introIndex >= STRINGS.onboarding.introLines.length) {
      this.showPlayerNameStep();
      return;
    }
    this.showIntro();
  }

  private showPlayerNameStep(): void {
    this.clearStep();
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, STRINGS.onboarding.playerNameLabel, TEXT_STYLES.heading).setOrigin(0.5);
    const input = new TextInput(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 - 60,
      width: INPUT_WIDTH,
      maxLength: PROFILE_LIMITS.playerName,
      placeholder: STRINGS.onboarding.playerNamePlaceholder,
      initialValue: this.playerName,
      onChange: (value) => {
        this.playerName = value;
        this.nextButton?.setEnabled(this.isValidName(value, PROFILE_LIMITS.playerName));
      },
    });
    const button = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.onboarding.next,
      onTap: () => {
        this.playerName = input.value;
        this.showBrandNameStep();
      },
    });
    button.setEnabled(this.isValidName(this.playerName, PROFILE_LIMITS.playerName));
    this.nextButton = button;
    this.stepObjects.push(label, button, input);
    input.focus();
  }

  private showBrandNameStep(): void {
    this.clearStep();
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, STRINGS.onboarding.brandNameLabel, TEXT_STYLES.heading).setOrigin(0.5);
    const input = new TextInput(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 - 60,
      width: INPUT_WIDTH,
      maxLength: PROFILE_LIMITS.brandName,
      placeholder: STRINGS.onboarding.brandNamePlaceholder,
      initialValue: this.brandName,
      onChange: (value) => {
        this.brandName = value;
        this.nextButton?.setEnabled(this.isValidName(value, PROFILE_LIMITS.brandName));
      },
    });
    const button = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.onboarding.next,
      onTap: () => {
        this.brandName = input.value;
        this.showConfirmStep();
      },
    });
    button.setEnabled(this.isValidName(this.brandName, PROFILE_LIMITS.brandName));
    this.nextButton = button;
    this.stepObjects.push(label, button, input);
    input.focus();
  }

  private showConfirmStep(): void {
    this.clearStep();
    const bubble = new SpeechBubble(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, {
      width: BUBBLE_WIDTH,
      text: `${STRINGS.onboarding.brandConfirmPrefix}${this.brandName}${STRINGS.onboarding.brandConfirmSuffix}`,
    });
    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, STRINGS.onboarding.tapToContinue, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: toCssColor(COLORS.textMuted),
      })
      .setOrigin(0.5);
    const tapZone = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive();
    tapZone.on('pointerup', () => this.finish());
    this.stepObjects.push(bubble, hint, tapZone);
  }

  private isValidName(value: string, maxLength: number): boolean {
    const trimmed = value.trim();
    return trimmed.length >= 1 && trimmed.length <= maxLength;
  }

  private finish(): void {
    sessionBridge.current.dispatch({ type: 'PROFILE_SET', playerName: this.playerName, brandName: this.brandName });
    this.scene.start('Prep');
  }
}
