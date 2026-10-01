import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { TUTORIAL_FLAG_PREFIX, TUTORIAL_STEPS, type TutorialScene } from '@data/tutorial';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { CustomerAvatar } from '@ui/CustomerAvatar';
import { SpeechBubble } from '@ui/SpeechBubble';
import { TEXT_STYLES } from '@ui/textStyles';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { sessionBridge } from '../sessionBridge';

const BUBBLE_WIDTH = 600;
const BUBBLE_Y = GAME_HEIGHT / 2 - 40;
const AVATAR_RADIUS = 60;
const AVATAR_Y = BUBBLE_Y - 270;
const SPEAKER_SPRITE_ID = 'beo';
const BUTTON_Y = BUBBLE_Y + 190;

/** Một lời thoại của Béo (PLAN §10.11): bong bóng thoại + nút "Hiểu rồi". Đóng thì ghi cờ để không lặp lại. */
class TutorialOverlay extends BaseOverlay {
  constructor(scene: Phaser.Scene, stepId: string, onDone: () => void) {
    super(scene, { closeOnBackdropTap: false });
    const speaker = new CustomerAvatar(scene, GAME_WIDTH / 2, AVATAR_Y, AVATAR_RADIUS, SPEAKER_SPRITE_ID);
    const name = scene.add.text(GAME_WIDTH / 2, AVATAR_Y + AVATAR_RADIUS + 20, STRINGS.tutorial.speaker, TEXT_STYLES.label).setOrigin(0.5);
    const message = STRINGS.tutorial[stepId as keyof typeof STRINGS.tutorial] ?? '';
    const bubble = new SpeechBubble(scene, GAME_WIDTH / 2, BUBBLE_Y, { width: BUBBLE_WIDTH, text: message });
    const confirm = new Button(scene, GAME_WIDTH / 2, BUTTON_Y, {
      width: 280,
      label: STRINGS.tutorial.gotIt,
      onTap: () => {
        sessionBridge.dispatch({ type: 'FLAG_SET', flag: `${TUTORIAL_FLAG_PREFIX}${stepId}` });
        this.close();
        onDone();
      },
    });
    this.add([speaker, name, bubble, confirm]);
  }
}

/**
 * Hiện lần lượt các hướng dẫn chưa xem áp dụng cho `sceneKey` hôm nay. Tạm dừng đồng hồ khi đang hiện
 * (trừ khi game đã tạm dừng từ trước) để người chơi đọc thoải mái.
 */
export const showPendingTutorials = (scene: Phaser.Scene, sceneKey: TutorialScene): void => {
  const { day, today, flags } = sessionBridge.current.state;
  const pending = TUTORIAL_STEPS.filter((step) => step.scene === sceneKey && step.appliesOn({ day, event: today.event }) && !flags[`${TUTORIAL_FLAG_PREFIX}${step.id}`]);
  if (pending.length === 0) return;

  const wasPaused = sessionBridge.isPaused;
  sessionBridge.setPaused(true);
  const showNext = (index: number): void => {
    const step = pending[index];
    if (!step) {
      sessionBridge.setPaused(wasPaused);
      return;
    }
    new TutorialOverlay(scene, step.id, () => showNext(index + 1));
  };
  showNext(0);
};
