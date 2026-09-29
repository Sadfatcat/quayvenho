const CHANNEL_NAME = 'quayvenho:tabLock';

export interface TabLock {
  release: () => void;
}

/**
 * Phát hiện khi có tab thứ hai của game mở cùng lúc (PLAN §6.6). Tab nào
 * nhận được PONG (nghĩa là đã có tab khác đang mở từ trước) là tab "thứ hai"
 * và được gọi `onSecondTab`.
 */
export const watchTabLock = (onSecondTab: () => void): TabLock => {
  if (typeof BroadcastChannel === 'undefined') {
    return { release: () => {} };
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<string>) => {
    if (event.data === 'PING') {
      channel.postMessage('PONG');
    } else if (event.data === 'PONG') {
      onSecondTab();
    }
  };
  channel.postMessage('PING');

  return { release: () => channel.close() };
};
