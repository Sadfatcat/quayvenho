import { audio } from './audio';
import { devError } from './logger';

const MUSIC_MUTED_KEY = 'qvn:musicMuted';
const MUTED_VALUE = '1';

/** Tắt nhạc nền lưu riêng khỏi save game để áp dụng được cả ở màn Title lúc chưa có save. */
export const isMusicMuted = (): boolean => {
  try {
    return localStorage.getItem(MUSIC_MUTED_KEY) === MUTED_VALUE;
  } catch (error) {
    devError('đọc musicMuted thất bại', error);
    return false;
  }
};

export const setMusicMuted = (muted: boolean): void => {
  audio.setMusicMuted(muted);
  try {
    if (muted) localStorage.setItem(MUSIC_MUTED_KEY, MUTED_VALUE);
    else localStorage.removeItem(MUSIC_MUTED_KEY);
  } catch (error) {
    devError('ghi musicMuted thất bại', error);
  }
};
