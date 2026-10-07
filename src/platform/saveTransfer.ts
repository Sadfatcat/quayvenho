import { STRINGS } from '@data/strings';
import { exportSaveCode } from '@save/exportImport';
import { devError } from '@platform/logger';
import { writeSave } from '@save/storage';
import type { GameState } from '@domain/models';

/** Chép mã vào clipboard (một chạm, hợp điện thoại). Clipboard bị chặn/không có thì rơi về hộp thoại để tự chọn và chép. */
export const showSaveCodeToPlayer = async (state: GameState): Promise<void> => {
  const code = exportSaveCode(state);
  try {
    await navigator.clipboard.writeText(code);
    window.alert(STRINGS.settings.exportCopied);
  } catch (error) {
    devError('clipboard.writeText thất bại, dùng prompt', error);
    window.prompt(STRINGS.settings.exportPrompt, code);
  }
};

/** Ghi đè save hiện tại bằng state đã nhập rồi tải lại trang để game nạp save mới. */
export const applyImportedSave = (state: GameState): void => {
  writeSave(state);
  window.location.reload();
};
