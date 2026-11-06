import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { validMappings, fkNotNull } from '../content/erPhrases';
import { CHAPTER_NAME, mcQuestions, type Chapter } from '../content/mcQuestions';
import { buildExam, gradeEstimate, gradeItem, type Answer, type ExamItem } from './exam';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

const ALL = Object.keys(CHAPTER_NAME) as Chapter[];

/** Musterantwort fuer jede Aufgabe */
function perfect(item: ExamItem): Answer {
  switch (item.kind) {
    case 'mc':
      return item.q.correct;
    case 'er':
      return { a12: item.p.c12, a21: item.p.c21 };
    case 'spez':
      return { disjoint: item.s.disjoint, total: item.s.total };
    case 'rel': {
      const m = validMappings(item.p)[0];
      return m === 'zuordnung' ? { mapping: m, pk: 'beide' } : { mapping: m, nullable: !fkNotNull(item.p, m) };
    }
    case 'nf':
      return {
        says1NF: item.ex.oneNF.ok,
        cols: item.ex.oneNF.issues.map((i) => i.column),
        fds: item.ex.fds.map((f) => f.kind),
        highest: item.ex.highestNF,
      };
    case 'ddl':
    case 'sql':
      return item.ex.solution;
  }
}

describe('Probeklausur', () => {
  it('Wissensfragen sind konsistent', () => {
    for (const q of mcQuestions) {
      expect(q.correct.length, q.id).toBeGreaterThan(0);
      expect(q.correct.every((c) => c < q.options.length), q.id).toBe(true);
      expect(!!q.multi, q.id).toBe(q.correct.length > 1);
    }
    expect(new Set(mcQuestions.map((q) => q.id)).size).toBe(mcQuestions.length);
  });

  it('gleicher Seed ergibt gleiche Klausur, alle Kapitel sind vertreten', () => {
    const a = buildExam({ chapters: ALL, minutes: 60, allowRun: false, seed: 42 });
    const b = buildExam({ chapters: ALL, minutes: 60, allowRun: false, seed: 42 });
    expect(a.map((i) => i.id)).toEqual(b.map((i) => i.id));
    expect(new Set(a.map((i) => i.id)).size).toBe(a.length);
    for (const c of ALL) expect(a.some((i) => i.chapter === c), c).toBe(true);
  });

  it('jedes gewaehlte Kapitel kommt vor, auch bei kurzen Klausuren und vielen Seeds', () => {
    for (let seed = 1; seed <= 50; seed++)
      for (const minutes of [30, 60, 90]) {
        const e = buildExam({ chapters: ALL, minutes, allowRun: false, seed });
        for (const c of ALL) expect(e.some((i) => i.chapter === c), `${c} seed ${seed} ${minutes}`).toBe(true);
      }
  });

  it('nur gewaehlte Kapitel', () => {
    const e = buildExam({ chapters: ['05', 'SQL'], minutes: 30, allowRun: false, seed: 1 });
    expect(e.every((i) => i.chapter === '05' || i.chapter === 'SQL')).toBe(true);
  });

  for (const seed of [1, 2, 3, 4, 5]) {
    it(`Musterantworten erreichen volle Punktzahl (Seed ${seed})`, () => {
      const items = buildExam({ chapters: ALL, minutes: 90, allowRun: false, seed });
      for (const item of items) {
        const r = gradeItem(item, perfect(item), SQL);
        expect(r.points, item.id).toBe(r.max);
      }
    });
  }

  it('leere Abgabe ergibt 0 Punkte', () => {
    const items = buildExam({ chapters: ALL, minutes: 60, allowRun: false, seed: 9 });
    expect(items.reduce((s, i) => s + gradeItem(i, undefined, SQL).points, 0)).toBe(0);
  });

  it('Notenorientierung', () => {
    expect(gradeEstimate(100)).toBe('1,0');
    expect(gradeEstimate(50)).toBe('4,0');
    expect(gradeEstimate(49.9)).toBe('5,0');
  });
});
