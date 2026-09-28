export interface VisibilityHandlers {
  onHidden: () => void;
  onVisible: () => void;
}

/** PLAN §11.2: hidden pauses the game; becoming visible only surfaces PauseOverlay, never auto-resumes. */
export const registerVisibilityHandler = (handlers: VisibilityHandlers): (() => void) => {
  const listener = (): void => {
    if (document.hidden) handlers.onHidden();
    else handlers.onVisible();
  };
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
};
