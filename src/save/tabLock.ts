const CHANNEL_NAME = 'qvn';
const HELLO_TIMEOUT_MS = 300;

export interface TabLockCallbacks {
  /** Another tab answered HELLO within the window — this tab is the second one. */
  onSecondTabDetected: () => void;
  /** Another tab sent TAKEOVER — this tab lost and must stop saving. */
  onTakenOver: () => void;
}

export interface TabLock {
  /** Call when the player picks "Chơi ở đây" — tells the older tab to stop. */
  requestTakeover: () => void;
  release: () => void;
}

/**
 * PLAN §9.5: HELLO/ALIVE/TAKEOVER over BroadcastChannel('qvn'). A tab that gets an ALIVE
 * within HELLO_TIMEOUT_MS is the second tab; it may send TAKEOVER to make the older tab
 * stop saving. No localStorage fallback — without BroadcastChannel the lock is skipped
 * (accepted risk, see DECISIONS.md).
 */
export const watchTabLock = (callbacks: TabLockCallbacks): TabLock => {
  if (typeof BroadcastChannel === 'undefined') {
    return { requestTakeover: () => {}, release: () => {} };
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  let receivedAlive = false;

  channel.onmessage = (event: MessageEvent<string>) => {
    if (event.data === 'HELLO') {
      channel.postMessage('ALIVE');
    } else if (event.data === 'ALIVE') {
      receivedAlive = true;
    } else if (event.data === 'TAKEOVER') {
      callbacks.onTakenOver();
    }
  };
  channel.postMessage('HELLO');
  const timer = setTimeout(() => {
    if (receivedAlive) callbacks.onSecondTabDetected();
  }, HELLO_TIMEOUT_MS);

  return {
    requestTakeover: () => channel.postMessage('TAKEOVER'),
    release: () => {
      clearTimeout(timer);
      channel.close();
    },
  };
};
