import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { COLORS } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from './config';

/** Async function instead of top-level await: broader phone/WebView compatibility (PLAN §1.2 target Safari iOS + Chrome Android). */
async function bootstrap(): Promise<void> {
  const scenes: Phaser.Types.Scenes.SceneType[] = [BootScene];
  if (import.meta.env.DEV) {
    const { PlaygroundScene } = await import('@dev/PlaygroundScene');
    scenes.push(PlaygroundScene);
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: COLORS.sky,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: scenes,
  });
}

void bootstrap();
