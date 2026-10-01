import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { applyPwaUpdate, isPwaUpdateAvailable } from '@platform/pwa';
import { DialogOverlay } from './DialogOverlay';

let declinedThisSession = false;

/** PLAN §12 Phase 6: hỏi tải lại khi có bản mới, chỉ gọi ở Title/Summary/Shop (không bao giờ giữa ca). */
export const promptForPwaUpdate = (scene: Phaser.Scene): void => {
  if (declinedThisSession || !isPwaUpdateAvailable()) return;
  new DialogOverlay(scene, {
    title: STRINGS.pwa.updateTitle,
    message: STRINGS.pwa.updateMessage,
    buttons: [
      { label: STRINGS.pwa.updateLater, variant: 'ghost', onTap: () => { declinedThisSession = true; } },
      { label: STRINGS.pwa.updateNow, variant: 'primary', onTap: applyPwaUpdate },
    ],
  });
};
