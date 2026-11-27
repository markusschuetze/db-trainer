import { describe, expect, it } from 'vitest';
import { buildMct, mctCounts, erPick, erRel, nf3, nfPk, relPick, specPick, type MctItem } from './mct';

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
  it('Aufbau: eine Frage pro Minute, alle Fragetypen vertreten, nach Kapiteln sortiert', () => {
    for (const n of [20, 30, 45]) {
      const items = buildMct(rng(1), [], n);
      expect(items, String(n)).toHaveLength(n);
      expect(new Set(items.map((i) => i.id)).size).toBe(n);
      expect(items.map((i) => i.chapter)).toEqual([...items.map((i) => i.chapter)].sort());
      for (const ch of ['02', '03', '04', '05', '06', 'SQL']) expect(items.some((i) => i.chapter === ch), `${n} ${ch}`).toBe(true);
    }
    expect(mctCounts(30).reduce((a, b) => a + b, 0)).toBe(30);
    // etwa 30 % SQL, bei 30 Fragen genau 5 Kardinalitaetsfragen (Kraehenfuss)
    for (const seed of [1, 2, 3]) {
      const items = buildMct(rng(seed), [], 30);
      const sql = items.filter((i) => i.chapter === 'SQL' || i.chapter === '06').length;
      const card = items.filter((i) => i.id.startsWith('mct-er-') || i.id.startsWith('mct-ertext-')).length;
      expect(sql / 30, 'SQL-Anteil').toBeGreaterThanOrEqual(0.27);
      expect(sql / 30, 'SQL-Anteil').toBeLessThanOrEqual(0.33);
      expect(card, 'Kardinalitaeten').toBe(5);
    }
    for (const n of [20, 30, 45]) expect(buildMct(rng(2), [], n).reduce((a, i) => a + i.points, 0)).toBe(2 * n);
  });
  it('Auswahlfragen: genau eine richtige, vier verschiedene Antworten', () => {
    for (const s of seeds)
      for (const it of [erPick(rng(s), false), erPick(rng(s), true), relPick(rng(s)), specPick(rng(s))] as Extract<MctItem, { kind: 'pick' }>[]) {
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

  it('Vorlagen wiederholen sich nicht: nicht im selben Test und nicht in den nächsten Tests', () => {
    const items = buildMct(rng(5));
    const srcs = items.map((i) => i.src);
    expect(new Set(srcs).size).toBeGreaterThanOrEqual(srcs.length - 3);
    // zehn Tests hintereinander: die Textaufgaben (Frage 2 und 6) werden reihum benutzt
    let seen: string[] = [];
    const tts: string[] = [];
    for (let k = 0; k < 6; k++) {
      const t = buildMct(rng(100 + k), seen);
      seen = [...seen, ...t.map((i) => i.src)];
      tts.push(...t.filter((i) => i.src.startsWith('tt:')).map((i) => i.src));
    }
    // 6 Tests x 6 Textaufgaben, alle 11 kommen vor
    expect(new Set(tts).size).toBeGreaterThanOrEqual(11);
  });
  it('Spezialisierung: vier verschiedene Kennzeichen, genau eines passt', () => {
    for (const s of seeds) {
      const it = specPick(rng(s)) as Extract<MctItem, { kind: 'pick' }>;
      const marks = it.d.options.map((o) => `${o.spec!.disjoint}${o.spec!.total}`);
      expect(new Set(marks).size).toBe(4);
    }
  });
});
