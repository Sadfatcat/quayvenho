import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from './audio';
import { isMusicMuted, setMusicMuted } from './musicMute';

const stubLocalStorage = () => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('musicMute', () => {
  it('is not muted by default', () => {
    stubLocalStorage();
    expect(isMusicMuted()).toBe(false);
  });

  it('remembers muted state across reads and tells the audio engine', () => {
    stubLocalStorage();
    const engineSpy = vi.spyOn(audio, 'setMusicMuted');

    setMusicMuted(true);

    expect(isMusicMuted()).toBe(true);
    expect(engineSpy).toHaveBeenCalledWith(true);
  });

  it('remembers unmuting after muting', () => {
    stubLocalStorage();
    setMusicMuted(true);
    setMusicMuted(false);
    expect(isMusicMuted()).toBe(false);
  });

  it('treats unavailable localStorage as not muted and does not throw when saving', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(isMusicMuted()).toBe(false);
    expect(() => setMusicMuted(true)).not.toThrow();
  });
});
