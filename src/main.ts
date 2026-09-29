import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { CounterScene } from '@scenes/CounterScene';
import { OnboardingScene } from '@scenes/OnboardingScene';
import { PreloadScene } from '@scenes/PreloadScene';
import { PrepScene } from '@scenes/PrepScene';
import { ShopScene } from '@scenes/ShopScene';
import { SummaryScene } from '@scenes/SummaryScene';
import { SECOND_TAB_LOCK_EVENT, TAKEN_OVER_EVENT } from '@scenes/BaseScene';
import { sessionBridge } from '@scenes/sessionBridge';
import { TitleScene } from '@scenes/TitleScene';
import { devError } from '@platform/logger';
import { watchTabLock } from '@save/tabLock';
import { COLORS } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from './config';

/** Async function instead of top-level await: broader phone/WebView compatibility (PLAN §1.2 target Safari iOS + Chrome Android). */
async function bootstrap(): Promise<void> {
  const scenes: Phaser.Types.Scenes.SceneType[] = [BootScene, PreloadScene, TitleScene, OnboardingScene, PrepScene, CounterScene, SummaryScene, ShopScene];
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

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: COLORS.sky,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    dom: { createContainer: true },
    scene: scenes,
  });

  const tabLock = watchTabLock({
    onSecondTabDetected: () => game.events.emit(SECOND_TAB_LOCK_EVENT, () => tabLock.requestTakeover()),
    onTakenOver: () => {
      sessionBridge.markTakenOver();
      game.events.emit(TAKEN_OVER_EVENT);
    },
  });
}

void bootstrap();
