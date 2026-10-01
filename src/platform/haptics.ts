const SUCCESS_MS = 15;
const ERROR_MS = 30;

let enabled = true;

export const setHapticsEnabled = (value: boolean): void => {
  enabled = value;
};

/** PLAN §11.3: rung nhẹ khi giao vé thành công/sai, chỉ khi thiết bị có API và người chơi bật. */
export const vibrate = (kind: 'success' | 'error'): void => {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(kind === 'success' ? SUCCESS_MS : ERROR_MS);
};
