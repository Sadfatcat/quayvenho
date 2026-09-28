import { sessionBridge } from '@scenes/sessionBridge';

declare global {
  interface Window {
    __sessionBridge?: typeof sessionBridge;
  }
}

/** DEV-only inspection hook (PLAN §6.1 dev/debug.ts); never reachable in production builds. */
export const installDebugHooks = (): void => {
  window.__sessionBridge = sessionBridge;
};
