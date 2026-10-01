import { describe, expect, it } from 'vitest';
import { createNewGame } from '@domain/dayCycle';
import { exportSaveCode, importSaveCode } from './exportImport';

const buildState = () => {
  const state = createNewGame(42);
  state.profile = { playerName: 'Mai Đặng', brandName: 'Quầy Săn Vé Đêm' };
  state.money = 1234;
  return state;
};

describe('exportSaveCode / importSaveCode', () => {
  it('round-trips the exact state, including Vietnamese names', () => {
    const state = buildState();
    const result = importSaveCode(exportSaveCode(state));
    expect(result).toEqual({ ok: true, value: state });
  });

  it('rejects a code whose payload was altered (bad checksum) without returning a state', () => {
    const code = exportSaveCode(buildState());
    const [prefix, payload = '', checksum] = code.split('.');
    const tampered = `${prefix}.${payload.slice(0, -4)}AAAA.${checksum}`;
    expect(importSaveCode(tampered)).toEqual({ ok: false, reason: 'BAD_CHECKSUM' });
  });

  it('rejects text that is not a save code', () => {
    expect(importSaveCode('hello')).toEqual({ ok: false, reason: 'BAD_FORMAT' });
    expect(importSaveCode('')).toEqual({ ok: false, reason: 'BAD_FORMAT' });
  });

  it('rejects a code with a valid checksum but an invalid save body', () => {
    const payload = btoa('{"version":1}');
    let hash = 0x811c9dc5;
    for (const char of payload) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
    const code = `QVN1.${payload}.${hash.toString(16).padStart(8, '0')}`;
    expect(importSaveCode(code)).toEqual({ ok: false, reason: 'INVALID_SAVE' });
  });

  it('rejects a wrong prefix and a wrong number of parts', () => {
    const code = exportSaveCode(buildState());
    expect(importSaveCode(code.replace('QVN1', 'XXXX'))).toEqual({ ok: false, reason: 'BAD_FORMAT' });
    expect(importSaveCode(`${code}.extra`)).toEqual({ ok: false, reason: 'BAD_FORMAT' });
  });

  it('rejects a save written by a newer game version with FUTURE_VERSION', () => {
    const newer = { ...createNewGame(42), version: 999 };
    const payload = btoa(JSON.stringify(newer));
    let hash = 0x811c9dc5;
    for (const char of payload) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
    const code = `QVN1.${payload}.${hash.toString(16).padStart(8, '0')}`;
    expect(importSaveCode(code)).toEqual({ ok: false, reason: 'FUTURE_VERSION' });
  });

  it('accepts a code that was split across lines when pasted', () => {
    const state = buildState();
    const code = exportSaveCode(state);
    const wrapped = `${code.slice(0, 40)}
 ${code.slice(40, 90)}
${code.slice(90)}`;
    expect(importSaveCode(wrapped)).toEqual({ ok: true, value: state });
  });

  it('ignores surrounding whitespace when importing', () => {
    const state = buildState();
    expect(importSaveCode(`  ${exportSaveCode(state)}\n`)).toEqual({ ok: true, value: state });
  });
});
