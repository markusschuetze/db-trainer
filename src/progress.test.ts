import { describe, expect, it } from 'vitest';
import { compactForLimit, mastery, mergeProgress, passStreak, type ExamAttempt, type ProgressData } from './progress';

const ALL = ['01', '02', '03', '04', '05', '06', 'SQL'] as ExamAttempt['c'];
const exam = (id: string, t: number, p: number, full = true): ExamAttempt => ({
  id,
  t,
  m: full ? 60 : 30,
  c: full ? ALL : ['05'],
  p,
  x: 40,
  k: {},
});

describe('Fortschritt', () => {
  it('Fragenstatus wie in Fuehrerschein-Apps', () => {
    expect(mastery(undefined)).toBe('neu');
    expect(mastery([1, 0, 0, 1])).toBe('falsch');
    expect(mastery([2, 1, 1, 1])).toBe('gelernt');
    expect(mastery([3, 2, 2, 1])).toBe('sicher');
  });

  it('Serie zaehlt nur vollstaendige, bestandene Klausuren am Ende', () => {
    expect(passStreak([exam('a', 1, 30), exam('b', 2, 10), exam('c', 3, 25), exam('d', 4, 30)])).toBe(2);
    // Teilklausur unterbricht die Serie nicht und zaehlt nicht mit
    expect(passStreak([exam('a', 1, 30), exam('b', 2, 5, false), exam('c', 3, 30)])).toBe(2);
    expect(passStreak([exam('a', 1, 30), exam('b', 2, 10)])).toBe(0);
  });

  it('Zusammenfuehren (Browser + ILU) verliert nichts', () => {
    const a: ProgressData = { v: 1, done: ['nf:x'], items: { 'mc:a': [1, 1, 1, 100] }, exams: [exam('e1', 10, 20)] };
    const b: ProgressData = { v: 1, done: ['ddl:y'], items: { 'mc:a': [2, 2, 2, 200] }, exams: [exam('e2', 5, 30), exam('e1', 10, 20)] };
    const m = mergeProgress(a, b);
    expect(m.done.sort()).toEqual(['ddl:y', 'nf:x']);
    expect(m.items['mc:a']).toEqual([2, 2, 2, 200]); // neuerer Stand gewinnt
    expect(m.exams.map((e) => e.id)).toEqual(['e2', 'e1']); // ohne Doppelte, nach Zeit
  });

  it('passt in SCORM 1.2 (4096 Zeichen), aelteste Klausuren werden zuerst gekuerzt', () => {
    const big: ProgressData = {
      v: 1,
      done: Array.from({ length: 60 }, (_, i) => `sql:aufgabe-${i}`),
      items: Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`mc:frage-${i}`, [3, 2, 1, 1700000000 + i]])),
      exams: Array.from({ length: 40 }, (_, i) => exam(`e${i}`, i, 25)),
    };
    const s = compactForLimit(big, 4096);
    expect(s.length).toBeLessThanOrEqual(4096);
    const back = JSON.parse(s) as ProgressData;
    expect(back.exams.at(-1)!.id).toBe('e39');
    expect(back.done.length).toBe(60);
  });
});
