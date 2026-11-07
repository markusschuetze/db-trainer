import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error reines JS-Modul
import { createCollector, validate } from './collector.mjs';

let base = '';
let server: ReturnType<typeof createCollector>;
let file = '';
const now = Math.floor(Date.now() / 1000);
const item = { k: 'i', t: now, u: 'ab12cd34ef56ab78', i: 'sql:group-by', tp: 'sql-gruppen', ch: 'SQL', ok: 1, s: 42, a: 2, h: 1, src: 'u' };

beforeAll(async () => {
  file = join(mkdtempSync(join(tmpdir(), 'dbt-')), 'events.jsonl');
  server = createCollector({ token: 'geheim1234', file });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const post = (events: unknown[]) => fetch(`${base}/events`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ events }) });

describe('Sammelserver', () => {
  it('nimmt gueltige Ereignisse an und speichert nur bekannte Felder', async () => {
    const res = await post([{ ...item, name: 'Max Mustermann', sql: 'SELECT 1' }]);
    expect(await res.json()).toEqual({ accepted: 1, rejected: 0 });
    const stored = readFileSync(file, 'utf8');
    expect(stored).not.toContain('Mustermann');
    expect(stored).not.toContain('SELECT');
  });
  it('lehnt ungueltige Ereignisse ab', async () => {
    const res = await post([{ ...item, s: 99999 }, { ...item, u: 'Max Mustermann' }, { ...item, i: '<script>' }, { k: 'x' }, null]);
    expect(await res.json()).toEqual({ accepted: 0, rejected: 5 });
  });
  it('Lesen nur mit Token', async () => {
    expect((await fetch(`${base}/events`)).status).toBe(401);
    expect((await fetch(`${base}/events`, { headers: { Authorization: 'Bearer falsch' } })).status).toBe(401);
    const ok = await fetch(`${base}/events`, { headers: { Authorization: 'Bearer geheim1234' } });
    expect(ok.status).toBe(200);
    expect((await ok.json()).events.length).toBe(1);
  });
  it('Klausur-Ereignis wird geprueft', () => {
    expect(validate({ k: 'e', t: now, u: 'x', p: 20, x: 40, m: 60, ch: ['05'], kc: { '05': [4, 5] } })).not.toBeNull();
    expect(validate({ k: 'e', t: now, u: 'x', p: 20, x: 40, m: 60, ch: ['05'], kc: { '05': [4] } })).toBeNull();
  });
  it('ohne Token startet der Server nicht', () => {
    expect(() => createCollector({ token: '', file })).toThrow();
  });
});
