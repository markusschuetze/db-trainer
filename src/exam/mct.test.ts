import { describe, expect, it } from 'vitest';
import { buildMct, erPick, erRel, nf3, nfPk, relPick, type MctItem } from './mct';

const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const seeds = [...Array(150).keys()];

describe('MCT-Fragen', () => {
  it('Aufbau wie im Test: 7 Fragen, 24 Punkte', () => {
    const items = buildMct(rng(1));
    expect(items).toHaveLength(7);
    expect(items.map((i) => i.points)).toEqual([1, 4, 6, 6, 1, 8, 3]);
    expect(items.map((i) => i.kind)).toEqual(['pick', 'pick', 'tf', 'tf', 'pick', 'tf', 'tf']);
  });
  it('Auswahlfragen: genau eine richtige, vier verschiedene Antworten', () => {
    for (const s of seeds)
      for (const it of [erPick(rng(s), false), erPick(rng(s), true), relPick(rng(s))] as Extract<MctItem, { kind: 'pick' }>[]) {
        expect(it.d.options).toHaveLength(4);
        expect(it.d.correct).toBeGreaterThanOrEqual(0);
        const keys = it.d.options.map((o) => JSON.stringify(o));
        expect(new Set(keys).size, it.id).toBe(4);
      }
  });
  it('Richtig/Falsch-Fragen: gemischt richtig und falsch, Begründung vorhanden', () => {
    for (const s of seeds)
      for (const it of [nfPk(rng(s)), nf3(rng(s)), erRel(rng(s))] as Extract<MctItem, { kind: 'tf' }>[]) {
        const t = it.d.statements.map((x) => x.truth);
        expect(t.length, it.id).toBeGreaterThanOrEqual(3);
        expect(t.some(Boolean), it.id).toBe(true);
        expect(t.some((x) => !x), it.id).toBe(true);
        for (const st of it.d.statements) expect(st.why.length).toBeGreaterThan(10);
      }
  });
  it('Primärschlüssel-Frage: höchstens ein Antwortmuster pro Attribut, Text nennt jede Abhängigkeit', () => {
    const it = nfPk(rng(7)) as Extract<MctItem, { kind: 'tf' }>;
    expect(it.d.intro).toMatch(/Sp_\d+/);
    expect(it.d.statements.at(-1)!.truth).toBe(false);
  });
  it('gleicher Seed, gleiche Fragen', () => {
    expect(JSON.stringify(buildMct(rng(42)))).toBe(JSON.stringify(buildMct(rng(42))));
  });
});
