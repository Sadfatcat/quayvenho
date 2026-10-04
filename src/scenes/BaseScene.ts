import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { audio, type MusicTrack } from '@platform/audio';
import { BaseOverlay } from '@ui/BaseOverlay';
import { addSceneBackground, type BackgroundTheme } from '@ui/SceneBackground';
import { RotateOverlay } from './overlays/RotateOverlay';
import { sessionBridge } from './sessionBridge';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/** Payload: the requestTakeover callback to call if the player picks "Chơi ở đây". */
export const SECOND_TAB_LOCK_EVENT = 'secondTabLock';
export const TAKEN_OVER_EVENT = 'takenOver';
export const BACK_PRESSED_EVENT = 'backPressed';

const PANEL_WIDTH = 560;

/** Every scene extends this: paints the sky background, watches for tab-lock events, then calls onCreate(). */
export abstract class BaseScene extends Phaser.Scene {
  private tabLockOverlay: BaseOverlay | null = null;
  /** Nhạc nền của scene (PLAN §11.3): Kho/Shop 'calm', Quầy 'busy'; null = giữ nhạc hiện tại. */
  protected musicTrack: MusicTrack | null = null;
  /** Nền trang trí của màn (xem `ui/SceneBackground.ts`). */
  protected backgroundTheme: BackgroundTheme = 'prep';

  constructor(key: string) {
    super(key);
  }

  create(): void {
    addSceneBackground(this, this.backgroundTheme);

    if (this.registry.get('storageUnavailable') === true) {
      this.add
        .text(GAME_WIDTH / 2, 16, STRINGS.storageUnavailableBanner, { fontFamily: FONT_FAMILY, fontSize: '16px', color: toCssColor(COLORS.danger) })
        .setOrigin(0.5, 0);
    }

    const onSecondTabLock = (requestTakeover: () => void): void =>
      this.showTabLockOverlay(STRINGS.tabLock.secondTabTitle, STRINGS.tabLock.secondTabMessage, {
        label: STRINGS.tabLock.playHere,
        onTap: requestTakeover,
      });
    const onTakenOver = (): void => this.showTabLockOverlay(STRINGS.tabLock.takenOverTitle, STRINGS.tabLock.takenOverMessage);

    this.game.events.on(SECOND_TAB_LOCK_EVENT, onSecondTabLock);
    this.game.events.on(TAKEN_OVER_EVENT, onTakenOver);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(SECOND_TAB_LOCK_EVENT, onSecondTabLock);
      this.game.events.off(TAKEN_OVER_EVENT, onTakenOver);
    });

    audio.playMusic(this.musicTrack);
    this.watchOrientation();
    this.onCreate();
  }

  /** PLAN §11.2: trên điện thoại (pointer thô), xoay ngang → RotateOverlay + tạm dừng đồng hồ cho tới khi xoay dọc lại. */
  private watchOrientation(): void {
    const isPhone = window.matchMedia('(pointer: coarse)').matches;
    if (!isPhone) return;
    let overlay: RotateOverlay | null = null;
    let releasePause: (() => void) | null = null;
    const apply = (orientation: Phaser.Scale.Orientation): void => {
      const landscape = orientation === Phaser.Scale.Orientation.LANDSCAPE;
      if (landscape && !overlay) {
        overlay = new RotateOverlay(this);
        releasePause = sessionBridge.holdPause();
      } else if (!landscape && overlay) {
        overlay.close();
        overlay = null;
        releasePause?.();
        releasePause = null;
      }
    };
    apply(this.scale.orientation);
    this.scale.on(Phaser.Scale.Events.ORIENTATION_CHANGE, apply);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ORIENTATION_CHANGE, apply);
      releasePause?.();
    });
  }

  /** PLAN §9.5 blocking screens: "Game đang mở ở tab khác" (có nút Chơi ở đây) / "Game đã mở ở tab khác" (không nút). */
  private showTabLockOverlay(title: string, message: string, action?: { label: string; onTap: () => void }): void {
    this.tabLockOverlay?.close();
    const height = action ? 320 : 260;
    const overlay = new BaseOverlay(this, { closeOnBackdropTap: false });
    this.tabLockOverlay = overlay;
    const panel = new Panel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height });
    const titleText = this.add.text(0, -height / 2 + 60, title, TEXT_STYLES.heading).setOrigin(0.5);
    const messageText = this.add
      .text(0, -height / 2 + 130, message, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: toCssColor(COLORS.textMuted),
        align: 'center',
        wordWrap: { width: PANEL_WIDTH - 80 },
      })
      .setOrigin(0.5, 0);
    panel.add([titleText, messageText]);
    if (action) {
      panel.add(
        new Button(this, 0, height / 2 - 70, {
          width: PANEL_WIDTH - 80,
          height: 88,
          label: action.label,
          variant: 'primary',
          onTap: () => {
            action.onTap();
            overlay.close();
            this.tabLockOverlay = null;
          },
        }),
      );
    }
    overlay.add(panel);
  }

  protected abstract onCreate(): void;
}
