import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNewGame } from '@domain/dayCycle';
import { exportSaveCode } from '@save/exportImport';
import { STRINGS } from '@data/strings';
import { loadSave } from '@save/storage';
import { applyImportedSave, showSaveCodeToPlayer } from './saveTransfer';

const stubBrowser = (writeText: (text: string) => Promise<void>) => {
  const alert = vi.fn();
  const prompt = vi.fn();
  vi.stubGlobal('window', { alert, prompt });
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  return { alert, prompt };
};

afterEach(() => vi.unstubAllGlobals());

describe('showSaveCodeToPlayer', () => {
  it('copies the exact save code to the clipboard and confirms, without opening the prompt', async () => {
    const state = createNewGame(7);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { alert, prompt } = stubBrowser(writeText);

    await showSaveCodeToPlayer(state);

    expect(writeText).toHaveBeenCalledWith(exportSaveCode(state));
    expect(alert).toHaveBeenCalledWith(STRINGS.settings.exportCopied);
    expect(prompt).not.toHaveBeenCalled();
  });

  it('falls back to the prompt with the same code when the clipboard is blocked', async () => {
    const state = createNewGame(7);
    const { alert, prompt } = stubBrowser(() => Promise.reject(new Error('NotAllowedError')));

    await showSaveCodeToPlayer(state);

    expect(prompt).toHaveBeenCalledWith(STRINGS.settings.exportPrompt, exportSaveCode(state));
    expect(alert).not.toHaveBeenCalled();
  });
});

describe('applyImportedSave', () => {
  it('writes the imported state so loadSave returns it, then reloads the page', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });
    const state = createNewGame(11);
    state.money = 98765;

    applyImportedSave(state);

    expect(loadSave()).toEqual({ ok: true, value: state, recoveredFromBackup: false });
    expect(reload).toHaveBeenCalledOnce();
  });
});
