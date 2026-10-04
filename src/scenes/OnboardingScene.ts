import { STRINGS } from '@data/strings';
import { PROFILE_LIMITS } from '@data/balance';
import { addBeoFigure, type BeoPose } from '@ui/BeoFigure';
import { Button } from '@ui/Button';
import { SpeechBubble } from '@ui/SpeechBubble';
import { TextInput } from '@ui/TextInput';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { sessionBridge } from './sessionBridge';

const BUBBLE_WIDTH = 620;
const BUBBLE_Y = 700;
const BUBBLE_TAIL_X = -170;
const BEO_X = 190;
const BEO_BOTTOM_Y = 1210;
const BEO_HEIGHT = 420;
const HINT_Y = BUBBLE_Y + 150;
const INPUT_WIDTH = 500;
const BUTTON_WIDTH = 300;
const BUTTON_HEIGHT = 96;
const FORM_LABEL_Y = 190;
const FORM_INPUT_Y = 320;
const FORM_BUTTON_Y = 450;
const INTRO_POSES: readonly BeoPose[] = ['greeting', 'pointing', 'sly'];

/** PLAN §10.4/§2.2. Béo đứng nói ở dưới, khung chat phía trên đầu Béo; ô nhập tên nằm nửa trên màn hình. */
export class OnboardingScene extends BaseScene {
  private introIndex = 0;
  private playerName = '';
  private brandName = '';
  private readonly stepObjects: { destroy: () => void }[] = [];
  private nextButton: Button | null = null;

  constructor() {
    super('Onboarding');
    this.backgroundTheme = 'story';
  }

  protected onCreate(): void {
    this.showIntro();
  }

  private clearStep(): void {
    for (const obj of this.stepObjects) obj.destroy();
    this.stepObjects.length = 0;
    this.nextButton = null;
  }

  /** Béo đứng với tư thế `pose` và nói `text` trong khung chat có tên "Béo". */
  private addBeoSpeaking(pose: BeoPose, text: string): void {
    this.stepObjects.push(
      addBeoFigure(this, BEO_X, BEO_BOTTOM_Y, BEO_HEIGHT, pose),
      new SpeechBubble(this, GAME_WIDTH / 2, BUBBLE_Y, { width: BUBBLE_WIDTH, text, speaker: STRINGS.onboarding.speaker, tailX: BUBBLE_TAIL_X }),
    );
  }

  private addTapToContinue(onTap: () => void): void {
    const hint = this.add
      .text(GAME_WIDTH / 2 + 80, HINT_Y, STRINGS.onboarding.tapToContinue, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(0.5);
    const tapZone = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive();
    tapZone.on('pointerup', onTap);
    this.stepObjects.push(hint, tapZone);
  }

  private showIntro(): void {
    this.clearStep();
    const pose = INTRO_POSES[this.introIndex] ?? 'greeting';
    this.addBeoSpeaking(pose, STRINGS.onboarding.introLines[this.introIndex] ?? '');
    this.addTapToContinue(() => this.advanceIntro());
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
    this.showNameStep({
      pose: 'greeting',
      prompt: STRINGS.onboarding.playerNamePrompt,
      label: STRINGS.onboarding.playerNameLabel,
      placeholder: STRINGS.onboarding.playerNamePlaceholder,
      maxLength: PROFILE_LIMITS.playerName,
      initialValue: this.playerName,
      onChange: (value) => {
        this.playerName = value;
      },
      onSubmit: (value) => {
        this.playerName = value;
        this.showBrandNameStep();
      },
    });
  }

  private showBrandNameStep(): void {
    this.showNameStep({
      pose: 'pointing',
      prompt: STRINGS.onboarding.brandNamePrompt,
      label: STRINGS.onboarding.brandNameLabel,
      placeholder: STRINGS.onboarding.brandNamePlaceholder,
      maxLength: PROFILE_LIMITS.brandName,
      initialValue: this.brandName,
      onChange: (value) => {
        this.brandName = value;
      },
      onSubmit: (value) => {
        this.brandName = value;
        this.showConfirmStep();
      },
    });
  }

  private showNameStep(step: NameStep): void {
    this.clearStep();
    this.addBeoSpeaking(step.pose, step.prompt);
    const label = this.add.text(GAME_WIDTH / 2, FORM_LABEL_Y, step.label, TEXT_STYLES.heading).setOrigin(0.5);
    const input = new TextInput(this, {
      x: GAME_WIDTH / 2,
      y: FORM_INPUT_Y,
      width: INPUT_WIDTH,
      maxLength: step.maxLength,
      placeholder: step.placeholder,
      initialValue: step.initialValue,
      onChange: (value) => {
        step.onChange(value);
        this.nextButton?.setEnabled(this.isValidName(value, step.maxLength));
      },
    });
    const button = new Button(this, GAME_WIDTH / 2, FORM_BUTTON_Y, {
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.onboarding.next,
      onTap: () => step.onSubmit(input.value),
    });
    button.setEnabled(this.isValidName(step.initialValue, step.maxLength));
    this.nextButton = button;
    this.stepObjects.push(label, button, input);
    input.focus();
  }

  private showConfirmStep(): void {
    this.clearStep();
    this.addBeoSpeaking('excited', `${STRINGS.onboarding.brandConfirmPrefix}${this.brandName}${STRINGS.onboarding.brandConfirmSuffix}`);
    this.addTapToContinue(() => this.finish());
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

interface NameStep {
  pose: BeoPose;
  prompt: string;
  label: string;
  placeholder: string;
  maxLength: number;
  initialValue: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}
