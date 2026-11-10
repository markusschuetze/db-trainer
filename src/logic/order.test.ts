import { describe, expect, it } from 'vitest';
import { mixedOrder } from './order';
import { phrases, relType } from '../content/erPhrases';
import { specMarker, specializations } from '../content/specializations';

const maxRun = (keys: string[]) => {
  let m = 1, c = 1;
  for (let i = 1; i < keys.length; i++) (c = keys[i] === keys[i - 1] ? c + 1 : 1), (m = Math.max(m, c));
  return m;
};

describe('gemischte Reihenfolge', () => {
  it('enthaelt jede Aufgabe genau einmal', () => {
    const o = mixedOrder(phrases, relType);
    expect([...o].sort((a, b) => a - b)).toEqual(phrases.map((_, i) => i));
  });
  it('vermeidet gleiche Typen hintereinander (viele Zufallsreihenfolgen)', () => {
    for (let n = 0; n < 200; n++) {
      expect(maxRun(mixedOrder(phrases, relType).map((i) => relType(phrases[i])))).toBe(1);
      expect(maxRun(mixedOrder(specializations, (s) => specMarker(s)).map((i) => specMarker(specializations[i])))).toBe(1);
    }
  });
  it('beachtet den Typ der zuletzt gezeigten Aufgabe', () => {
    for (let n = 0; n < 100; n++) {
      const o = mixedOrder(specializations, (s) => specMarker(s), 'XV');
      expect(specMarker(specializations[o[0]])).not.toBe('XV');
    }
  });
});
