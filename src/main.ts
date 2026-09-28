import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { CounterScene } from '@scenes/CounterScene';
import { devError } from '@platform/logger';
import { COLORS } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from './config';

/** Async function instead of top-level await: broader phone/WebView compatibility (PLAN §1.2 target Safari iOS + Chrome Android). */
async function bootstrap(): Promise<void> {
  const scenes: Phaser.Types.Scenes.SceneType[] = [BootScene, CounterScene];
  if (import.meta.env.DEV) {
    // A failure loading the dev-only Playground must never stop the real game from booting.
    try {
      const { installDebugHooks } = await import('@dev/debug');
      installDebugHooks();
      const { PlaygroundScene } = await import('@dev/PlaygroundScene');
      scenes.push(PlaygroundScene);
    } catch (error) {
      devError('Playground scene failed to load (dev-only, game still boots):', error);
    }
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
