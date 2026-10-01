import type { DomainEvent, ScoreOutcome } from '@domain/models';
import { audio, type SfxName } from '@platform/audio';
import { setHapticsEnabled, vibrate } from '@platform/haptics';
import { registerVisibilityHandler } from '@platform/visibility';
import { sessionBridge } from './sessionBridge';

const GOOD_OUTCOMES: ReadonlySet<ScoreOutcome> = new Set(['PERFECT', 'GOOD', 'OK']);
const BAD_OUTCOMES: ReadonlySet<ScoreOutcome> = new Set(['POOR', 'FAILED', 'SOLD_INVALID', 'REFUSED_WRONG']);

const syncSettings = (): void => {
  if (!sessionBridge.hasSession) return;
  const { musicVolume, sfxVolume, haptics } = sessionBridge.current.state.settings;
  audio.setVolumes(musicVolume, sfxVolume);
  setHapticsEnabled(haptics);
};

export const sfxFor = (event: DomainEvent): SfxName | null => {
  switch (event.type) {
    case 'DAY_OPENED':
      return 'open';
    case 'SEATS_PURCHASED':
    case 'UPGRADE_BOUGHT':
      return 'buy';
    case 'ROUTE_UNLOCKED':
      return 'unlock';
    case 'PRINT_STARTED':
      return 'print';
    case 'CUSTOMER_LEFT':
      return 'walkAway';
    case 'WEATHER_RESOLVED':
      return event.outcome === 'GOOD' ? null : 'thunder';
    case 'TICKET_SCORED':
      if (GOOD_OUTCOMES.has(event.result.outcome)) return 'success';
      return BAD_OUTCOMES.has(event.result.outcome) ? 'error' : null;
    default:
      return null;
  }
};

/** Nối sự kiện domain → SFX + rung (PLAN §11.3). Gọi một lần lúc khởi động; âm lượng/rung đọc từ settings. */
export const bindAudioToSession = (): void => {
  sessionBridge.onEvents((events) => {
    syncSettings();
    for (const event of events) {
      const sfx = sfxFor(event);
      if (sfx) audio.playSfx(sfx);
      if (event.type !== 'TICKET_SCORED') continue;
      if (GOOD_OUTCOMES.has(event.result.outcome)) vibrate('success');
      else if (BAD_OUTCOMES.has(event.result.outcome)) vibrate('error');
    }
  });
  registerVisibilityHandler({ onHidden: () => audio.suspend(), onVisible: () => audio.resume() });
  const unlockOnFirstTouch = (): void => {
    audio.unlock();
    syncSettings();
    window.removeEventListener('pointerdown', unlockOnFirstTouch);
  };
  window.addEventListener('pointerdown', unlockOnFirstTouch);
};
