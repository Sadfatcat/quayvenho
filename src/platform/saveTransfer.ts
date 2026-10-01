import { STRINGS } from '@data/strings';
import { exportSaveCode, importSaveCode } from '@save/exportImport';
import { writeSave } from '@save/storage';
import type { GameState } from '@domain/models';

/** Hộp thoại gốc của trình duyệt: đơn giản, chạy được trên Safari iOS và Android, không cần dựng thêm ô nhập trong canvas. */
export const showSaveCodeToPlayer = (state: GameState): void => {
  window.prompt(STRINGS.settings.exportPrompt, exportSaveCode(state));
};

/** Hỏi mã, kiểm tra, xác nhận ghi đè rồi tải lại trang. Mã lỗi thì không đổi save hiện tại. */
export const importSaveCodeFromPlayer = (): void => {
  const code = window.prompt(STRINGS.settings.importPrompt);
  if (code === null || code.trim() === '') return;
  const result = importSaveCode(code);
  if (!result.ok) {
    window.alert(result.reason === 'FUTURE_VERSION' ? STRINGS.settings.importFutureVersion : STRINGS.settings.importFailed);
    return;
  }
  if (!window.confirm(STRINGS.settings.importConfirm)) return;
  writeSave(result.value);
  window.location.reload();
};
