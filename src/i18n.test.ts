import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from './i18n.en';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !/test|i18n/.test(f) ? [p] : [];
  });

describe('Englische Oberflaeche', () => {
  const used = new Set<string>();
  for (const f of files(new URL('.', import.meta.url).pathname))
    for (const m of readFileSync(f, 'utf8').matchAll(/\b[tL]\(\s*'((?:[^'\\]|\\.)*)'/g)) used.add(m[1].replace(/\\'/g, "'"));

  it('jeder im Code mit t(…) markierte Text hat eine englische Fassung', () => {
    const missing = [...used].filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });
  it('keine leeren Uebersetzungen, lange Texte sind wirklich uebersetzt', () => {
    for (const [de, e] of Object.entries(en)) {
      expect(e.trim(), de).not.toBe('');
      if (de.length > 25) expect(e, de).not.toBe(de);
    }
  });
  it('die Einwilligungstexte sind uebersetzt (kommen aus Konstanten)', () => {
    const src = readFileSync(new URL('./components/ConsentBanner.tsx', import.meta.url), 'utf8');
    const what = src.match(/const WHAT_DE =\s*'((?:[^'\\]|\\.)*)'/s)![1].replace(/\\'/g, "'");
    expect(what in en).toBe(true);
  });
  it('Platzhalter stimmen ueberein', () => {
    for (const [de, e] of Object.entries(en)) expect((e.match(/\{\w+\}/g) ?? []).sort(), de).toEqual((de.match(/\{\w+\}/g) ?? []).sort());
  });
});
