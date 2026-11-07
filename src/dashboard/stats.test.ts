import { describe, expect, it } from 'vitest';
import type { Stored } from '../analytics';
import { computeStats, demoEvents, hardest, itemsToCsv, weekStart } from './stats';

const T = 1_790_000_000;
const ev = (u: string, i: string, ok: 0 | 1, a: number, s: number, extra: Partial<Stored> = {}, t = T): Stored =>
  ({ k: 'i', t, u, i, tp: 'sql-gruppen', ch: 'SQL', ok, s, a, h: 0, src: 'u', ...extra }) as Stored;

describe('Auswertung', () => {
  const data: Stored[] = [
    // A: drei Lernende, zwei beim ersten Versuch richtig, einer nach drei Versuchen
    ev('u1', 'sql:a', 1, 1, 30), ev('u2', 'sql:a', 1, 1, 50), ev('u3', 'sql:a', 0, 1, 40), ev('u3', 'sql:a', 0, 2, 80), ev('u3', 'sql:a', 1, 3, 200, {}, T + 10),
    // B: schwer, drei Lernende scheitern beim ersten Versuch, mit Tipps
    ev('u1', 'sql:b', 0, 1, 90, { h: 2 }), ev('u2', 'sql:b', 0, 1, 70, { h: 1 }), ev('u3', 'sql:b', 0, 1, 60),
    ev('u1', 'sql:b', 1, 2, 300, { h: 2 }, T + 20),
  ];
  const s = computeStats(data, { minGroup: 3, now: T + 100 });

  it('Kennzahlen insgesamt', () => {
    expect(s.learners).toBe(3);
    expect(s.attempts).toBe(9);
    expect(s.active7d).toBe(3);
  });
  it('Erstversuchsquote, Loesungsquote, Median, Versuche, Tipps je Aufgabe', () => {
    const a = s.items.find((i) => i.id === 'sql:a')!;
    expect(a.firstTry).toBeCloseTo(2 / 3);
    expect(a.solved).toBe(1);
    expect(a.medianSeconds).toBe(50); // 30, 50, 200
    expect(a.avgAttempts).toBeCloseTo((1 + 1 + 3) / 3);
    const b = s.items.find((i) => i.id === 'sql:b')!;
    expect(b.firstTry).toBe(0);
    expect(b.solved).toBeCloseTo(1 / 3);
    expect(b.hintShare).toBeCloseTo(2 / 3);
  });
  it('schwierigste Aufgabe zuerst', () => {
    expect(hardest(s.items).map((i) => i.id)).toEqual(['sql:b', 'sql:a']);
  });
  it('Gruppen unter der Mindestgroesse werden unterdrueckt', () => {
    const small = computeStats(data, { minGroup: 4, now: T });
    expect(small.items.every((i) => i.suppressed)).toBe(true);
    expect(hardest(small.items)).toEqual([]);
    const csv = itemsToCsv(small.items, (i) => i);
    expect(csv).toContain('<3');
    expect(csv).not.toMatch(/;"67";/);
  });
  it('falsche Antwortoptionen bei Wissensfragen', () => {
    const mc: Stored[] = [
      ev('u1', 'mc:x', 0, 1, 10, { o: [2] }), ev('u2', 'mc:x', 0, 1, 12, { o: [2] }), ev('u3', 'mc:x', 0, 1, 9, { o: [1] }), ev('u4', 'mc:x', 1, 1, 8, { o: [0] }),
    ];
    expect(computeStats(mc, { minGroup: 1 }).items[0].wrongOptions).toEqual({ 2: 2, 1: 1 });
  });
  it('Klausuren: Bestehensquote, Histogramm, Kapitel', () => {
    const ex: Stored[] = [
      { k: 'e', t: T, u: 'u1', p: 30, x: 40, m: 60, ch: ['05'], kc: { '05': [4, 5] } },
      { k: 'e', t: T, u: 'u2', p: 10, x: 40, m: 60, ch: ['05'], kc: { '05': [1, 5] } },
    ];
    const e = computeStats(ex, { minGroup: 1 }).exams;
    expect(e.count).toBe(2);
    expect(e.passRate).toBe(0.5);
    expect(e.avgPercent).toBe(50);
    expect(e.histogram[7]).toBe(1);
    expect(e.histogram[2]).toBe(1);
    expect(e.byChapter[0].avgPercent).toBe(50);
  });
  it('Wochen beginnen montags', () => {
    expect(new Date(weekStart(Date.UTC(2026, 10, 7) / 1000) * 1000).getUTCDay()).toBe(1); // 7.11.2026 ist ein Samstag
  });
  it('leere Daten bringen nichts zum Absturz, Demo-Daten sind plausibel', () => {
    expect(computeStats([], { minGroup: 5 }).learners).toBe(0);
    const demo = demoEvents([{ id: 'sql:x', topicId: 't', chapter: 'SQL', level: 3 }, { id: 'sql:y', topicId: 't', chapter: 'SQL', level: 1 }]);
    const d = computeStats(demo, { minGroup: 5 });
    const x = d.items.find((i) => i.id === 'sql:x')!;
    const y = d.items.find((i) => i.id === 'sql:y')!;
    expect(y.firstTry).toBeGreaterThan(x.firstTry);
  });
});

import { insights } from './stats';

describe('Auffaelligkeiten in Klartext', () => {
  const mk = (n: number, make: (u: string) => Stored[]): Stored[] => Array.from({ length: n }, (_, i) => make(`u${i}`)).flat();
  const names = { item: (id: string) => `Aufgabe ${id}`, topic: (id: string) => `Thema ${id}`, option: (_id: string, i: number) => (i === 2 ? 'Falsche Option' : undefined) };

  it('nennt schwaechstes und staerkstes Thema', () => {
    const data = [
      ...mk(8, (u) => [ev(u, 'sql:schwer', 0, 1, 90, { tp: 'schwer', h: 1 } as never), ev(u, 'sql:schwer', 1, 2, 200, { tp: 'schwer' } as never, T + 5)]),
      ...mk(8, (u) => [ev(u, 'sql:leicht', 1, 1, 20, { tp: 'leicht' } as never)]),
    ];
    const out = insights(computeStats(data, { minGroup: 5 }), names);
    expect(out[0]).toContain('Schwächstes Thema: „Thema schwer“');
    expect(out[0]).toContain('0 %');
    expect(out.some((l) => l.startsWith('Stärkstes Thema: „Thema leicht“'))).toBe(true);
  });

  it('erkennt einen typischen Denkfehler bei Wissensfragen', () => {
    const data = [
      ...mk(6, (u) => [ev(u, 'mc:x', 0, 1, 10, { tp: 'mc', o: [2] } as never)]),
      ...mk(2, (u) => [ev(`v${u}`, 'mc:x', 0, 1, 10, { tp: 'mc', o: [1] } as never)]),
    ];
    const out = insights(computeStats(data, { minGroup: 5 }), names);
    expect(out.some((l) => l.includes('Typischer Denkfehler') && l.includes('„Falsche Option“'))).toBe(true);
  });

  it('bei zu kleinen Gruppen keine Aussagen ueber einzelne Lernende', () => {
    const data = [ev('u1', 'sql:a', 0, 1, 10), ev('u2', 'sql:a', 0, 1, 10)];
    expect(insights(computeStats(data, { minGroup: 5 }), names)).toEqual([]);
  });
});
