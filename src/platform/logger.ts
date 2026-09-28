/** CLAUDE.md: no console.* in committed code except a logger gated by import.meta.env.DEV. Silent in production. */
export const devError = (...args: unknown[]): void => {
  if (import.meta.env.DEV) console.error(...args); // eslint-disable-line no-console
};
