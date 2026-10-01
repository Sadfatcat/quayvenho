import { registerSW } from 'virtual:pwa-register';

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let updateAvailable = false;

/** Đăng ký service worker (PLAN §12 Phase 6): chỉ ghi nhận có bản mới, không tự tải lại để không cắt ngang ca chơi. */
export const registerPwa = (): void => {
  updateServiceWorker = registerSW({
    onNeedRefresh: () => {
      updateAvailable = true;
    },
  });
};

export const isPwaUpdateAvailable = (): boolean => updateAvailable;

export const applyPwaUpdate = (): void => {
  void updateServiceWorker?.(true);
};
