export type Ok<T> = { ok: true; value: T };
export type Err<E extends string> = { ok: false; reason: E };
export type Result<T, E extends string = string> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E extends string>(reason: E): Err<E> => ({ ok: false, reason });
