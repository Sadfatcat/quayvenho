import Phaser from 'phaser';
import { PERSONAL, type ScriptedMoment } from '@data/personal';
import { STRINGS } from '@data/strings';
import { scriptedMomentsFor } from '@domain/personal';
import { TUTORIAL_FLAG_PREFIX, TUTORIAL_STEPS, type TutorialScene } from '@data/tutorial';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { addBeoFigure } from '@ui/BeoFigure';
import { SpeechBubble } from '@ui/SpeechBubble';
import { GAME_WIDTH } from '../../config';
import { sessionBridge } from '../sessionBridge';

const BUBBLE_WIDTH = 620;
const BUBBLE_Y = 520;
const BUBBLE_TAIL_X = -170;
const BEO_X = 190;
const BEO_BOTTOM_Y = 1100;
const BEO_HEIGHT = 400;
const BUTTON_Y = BUBBLE_Y + 190;

/** Một lời thoại của Béo (PLAN §10.11): bong bóng thoại + nút "Hiểu rồi". Đóng thì ghi cờ `flag` để không lặp lại. */
class BeoMessageOverlay extends BaseOverlay {
  constructor(scene: Phaser.Scene, message: string, flag: string | null, onDone: () => void) {
    super(scene, { closeOnBackdropTap: false });
    const speaker = addBeoFigure(scene, BEO_X, BEO_BOTTOM_Y, BEO_HEIGHT, 'greeting');
    const bubble = new SpeechBubble(scene, GAME_WIDTH / 2, BUBBLE_Y, { width: BUBBLE_WIDTH, text: message, speaker: STRINGS.tutorial.speaker, tailX: BUBBLE_TAIL_X });
    const confirm = new Button(scene, GAME_WIDTH / 2, BUTTON_Y, {
      width: 280,
      label: STRINGS.tutorial.gotIt,
      onTap: () => {
        if (flag) sessionBridge.dispatch({ type: 'FLAG_SET', flag });
        this.close();
        onDone();
      },
    });
    this.add([speaker, bubble, confirm]);
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

  const releasePause = sessionBridge.holdPause();
  const showNext = (index: number): void => {
    const step = pending[index];
    if (!step) {
      releasePause();
      return;
    }
    const message = STRINGS.tutorial[step.id as keyof typeof STRINGS.tutorial] ?? '';
    new BeoMessageOverlay(scene, message, `${TUTORIAL_FLAG_PREFIX}${step.id}`, () => showNext(index + 1));
  };
  showNext(0);
};

const SCRIPTED_FLAG_PREFIX = 'moment_';

/** PLAN §16: lời thoại Béo theo ngày/thời điểm trong `PersonalConfig.scriptedMoments`, mỗi lời chỉ hiện một lần. */
export const showScriptedMoments = (scene: Phaser.Scene, at: ScriptedMoment['at']): void => {
  const { day, flags } = sessionBridge.current.state;
  const lines = scriptedMomentsFor(PERSONAL, day, at)
    .filter((moment) => !flags[`${SCRIPTED_FLAG_PREFIX}${moment.id}`])
    .flatMap((moment) => moment.lines.map((line, index, all) => ({ line, flag: index === all.length - 1 ? `${SCRIPTED_FLAG_PREFIX}${moment.id}` : null })));
  if (lines.length === 0) return;

  const releasePause = sessionBridge.holdPause();
  const showNext = (index: number): void => {
    const entry = lines[index];
    if (!entry) {
      releasePause();
      return;
    }
    new BeoMessageOverlay(scene, entry.line, entry.flag, () => showNext(index + 1));
  };
  showNext(0);
};
