import { describe, expect, it } from 'vitest';
import { buildPool, difficultyOf, pickRandom, type Level } from './exam';

const pool = buildPool();

describe('Zufallsmodus', () => {
  it('Pool enthaelt alle Aufgabenarten und alle Schwierigkeitsgrade', () => {
    expect(new Set(pool.map((i) => i.kind)).size).toBe(8);
    expect(new Set(pool.map(difficultyOf))).toEqual(new Set([1, 2, 3]));
    expect(new Set(pool.map((i) => i.id)).size).toBe(pool.length);
  });
  it('mischt Arten: nie zweimal dieselbe Art hintereinander, alle Arten kommen vor', () => {
    const hist: string[] = [];
    const kinds: string[] = [];
    for (let n = 0; n < 400; n++) {
      const it = pickRandom(pool, { levels: [1, 2, 3], programming: true }, hist)!;
      hist.push(it.id);
      kinds.push(it.kind);
    }
    for (let i = 1; i < kinds.length; i++) expect(kinds[i]).not.toBe(kinds[i - 1]);
    expect(new Set(kinds).size).toBe(8);
  });
  it('beachtet Schwierigkeits- und Programmierfilter', () => {
    for (const lv of [1, 2, 3] as Level[]) {
      const hist: string[] = [];
      for (let n = 0; n < 100; n++) {
        const it = pickRandom(pool, { levels: [lv], programming: false }, hist)!;
        hist.push(it.id);
        expect(difficultyOf(it)).toBe(lv);
        expect(['sql', 'ddl']).not.toContain(it.kind);
      }
    }
  });
  it('leere Auswahl liefert null', () => {
    expect(pickRandom([], { levels: [1], programming: true }, [])).toBeNull();
  });
});
