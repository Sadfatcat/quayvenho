import type { GameState } from '@domain/models';
import { parseSaveJson } from './storage';

const CODE_PREFIX = 'QVN1';
const CODE_SEPARATOR = '.';
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export type ImportSaveError = 'BAD_FORMAT' | 'BAD_CHECKSUM' | 'INVALID_SAVE' | 'FUTURE_VERSION';
export type ImportSaveResult = { ok: true; value: GameState } | { ok: false; reason: ImportSaveError };

/** Checksum FNV-1a 32-bit (hex 8 ký tự) — chỉ để phát hiện chép sai/cắt cụt mã, không phải bảo mật. */
const checksumOf = (payload: string): string => {
  let hash = FNV_OFFSET;
  for (let index = 0; index < payload.length; index++) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

const toBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
};

const fromBase64 = (payload: string): string | null => {
  try {
    const binary = atob(payload);
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch {
    return null;
  }
};

/** Mã save dạng `QVN1.<base64>.<checksum>`, dán được vào ghi chú/tin nhắn để chuyển máy. */
export const exportSaveCode = (state: GameState): string => {
  const payload = toBase64(JSON.stringify(state));
  return [CODE_PREFIX, payload, checksumOf(payload)].join(CODE_SEPARATOR);
};

/** Không ghi gì vào localStorage: người gọi chỉ ghi đè save hiện tại khi `ok`. */
export const importSaveCode = (code: string): ImportSaveResult => {
  const parts = code.replace(/\s+/g, '').split(CODE_SEPARATOR);
  const [prefix, payload, checksum] = parts;
  if (parts.length !== 3 || prefix !== CODE_PREFIX || !payload || !checksum) return { ok: false, reason: 'BAD_FORMAT' };
  if (checksumOf(payload) !== checksum) return { ok: false, reason: 'BAD_CHECKSUM' };
  const json = fromBase64(payload);
  if (json === null) return { ok: false, reason: 'BAD_FORMAT' };
  const parsed = parseSaveJson(json);
  if (parsed.ok) return { ok: true, value: parsed.value };
  return { ok: false, reason: parsed.reason === 'FUTURE_VERSION' ? 'FUTURE_VERSION' : 'INVALID_SAVE' };
};
