// Pruefungsmodus: Zusammenstellung, Speicherung und Bewertung einer Probeklausur.
// Alle Aufgaben stammen aus den Uebungspools; bewertet wird mit denselben Pruefern.

import type { SqlJsStatic } from 'sql.js';
import { ddlExercises } from '../content/ddlExercises';
import type { DdlExercise } from '../content/ddlTypes';
import { fkNotNull, phrases, relPhrases, validMappings, type Card, type Mapping, type Phrase } from '../content/erPhrases';
import { nfExercises } from '../content/exercises';
import { mcQuestions, type Chapter, type McQuestion } from '../content/mcQuestions';
import { specializations, type Specialization } from '../content/specializations';
import { topicsOf } from '../content/topics';
import { dmlExercises, dqlExercises } from '../content/sqlExercises';
import type { SqlExercise } from '../content/sqlTypes';
import type { DepKind, NfExercise } from '../content/types';
import { gradeFds, gradeHighest, gradeOneNf } from '../logic/nfGrading';
import { runExercise } from '../sql/ddlGrading';
import { runSqlExercise } from '../sql/sqlGrading';

export type ExamItem =
  | { kind: 'mc'; id: string; chapter: Chapter; points: number; q: McQuestion }
  | { kind: 'er'; id: string; chapter: Chapter; points: number; p: Phrase }
  | { kind: 'spez'; id: string; chapter: Chapter; points: number; s: Specialization }
  | { kind: 'rel'; id: string; chapter: Chapter; points: number; p: Phrase }
  | { kind: 'nf'; id: string; chapter: Chapter; points: number; ex: NfExercise }
  | { kind: 'ddl'; id: string; chapter: Chapter; points: number; ex: DdlExercise }
  | { kind: 'sql'; id: string; chapter: Chapter; points: number; ex: SqlExercise };

export interface NfAnswer {
  says1NF?: boolean;
  cols?: string[];
  fds?: (DepKind | '')[];
  highest?: number;
}
export type Answer =
  | number[] // mc
  | { a12?: Card; a21?: Card } // er
  | { disjoint?: boolean; total?: boolean } // spez
  | { mapping?: Mapping; nullable?: boolean; pk?: string } // rel
  | NfAnswer
  | string; // ddl/sql

export interface ExamConfig {
  chapters: Chapter[];
  minutes: number;
  allowRun: boolean;
  seed: number;
}

export interface ExamState extends ExamConfig {
  startedAt: number;
  answers: Record<string, Answer>;
  submittedAt?: number;
}

/* ---------------- Zufall mit Seed (gleiche Klausur nach Reload) ---------------- */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(list: T[], n: number, r: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, Math.min(n, copy.length)));
}

/* ---------------- Zusammenstellung ---------------- */

export function buildExam(cfg: ExamConfig): ExamItem[] {
  const r = rng(cfg.seed);
  const f = cfg.minutes / 60;
  const n = (base: number) => Math.max(1, Math.round(base * f));
  const has = (c: Chapter) => cfg.chapters.includes(c);
  const items: ExamItem[] = [];

  // Wissensfragen reihum ueber Kapitel und innerhalb eines Kapitels ueber die Themen
  // der Folien verteilt: jedes gewaehlte Kapitel kommt mindestens einmal vor.
  const mcTotal = Math.max(cfg.chapters.length, Math.round(8 * f));
  const perChapter = cfg.chapters.map((c) => {
    const queues = pick(topicsOf(c), 99, r).map((t) => pick(mcQuestions.filter((q) => q.topicId === t.id), 99, r));
    const order: McQuestion[] = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) order.push(q.shift()!);
    return order;
  });
  const chosen: McQuestion[] = [];
  for (let i = 0; chosen.length < mcTotal && perChapter.some((l) => l.length); i++) {
    const l = perChapter[i % perChapter.length];
    if (l.length) chosen.push(l.shift()!);
  }
  for (const q of chosen) items.push({ kind: 'mc', id: `mc:${q.id}`, chapter: q.chapter, points: q.multi ? 2 : 1, q });

  if (has('02')) for (const p of pick(phrases, n(2), r)) items.push({ kind: 'er', id: `er:${p.id}`, chapter: '02', points: 2, p });
  if (has('03'))
    for (const s of pick(specializations, n(1), r)) items.push({ kind: 'spez', id: `spez:${s.id}`, chapter: '03', points: 2, s });
  if (has('04')) for (const p of pick(relPhrases, n(2), r)) items.push({ kind: 'rel', id: `rel:${p.id}`, chapter: '04', points: 2, p });
  if (has('05'))
    for (const ex of pick(nfExercises, n(1), r))
      items.push({ kind: 'nf', id: `nf:${ex.id}`, chapter: '05', points: 3 + ex.fds.length, ex });
  if (has('06'))
    for (const ex of pick(ddlExercises, n(1), r)) items.push({ kind: 'ddl', id: `ddl:${ex.id}`, chapter: '06', points: 6, ex });
  if (has('SQL')) {
    for (const ex of pick(dqlExercises.filter((e) => e.level > 1), n(2), r))
      items.push({ kind: 'sql', id: `sql:${ex.id}`, chapter: 'SQL', points: 4, ex });
    for (const ex of pick(dmlExercises, n(1), r)) items.push({ kind: 'sql', id: `sql:${ex.id}`, chapter: 'SQL', points: 4, ex });
  }
  return items;
}

/* ---------------- Bewertung ---------------- */

const half = (x: number) => Math.round(x * 2) / 2;

export interface ItemResult {
  points: number;
  max: number;
}

export function gradeItem(item: ExamItem, answer: Answer | undefined, SQL: SqlJsStatic | null): ItemResult {
  const max = item.points;
  switch (item.kind) {
    case 'mc': {
      const a = (answer as number[] | undefined) ?? [];
      const wrong =
        item.q.correct.filter((c) => !a.includes(c)).length + a.filter((c) => !item.q.correct.includes(c)).length;
      return { max, points: wrong === 0 ? max : item.q.multi && wrong === 1 ? 1 : 0 };
    }
    case 'er': {
      const a = (answer as { a12?: Card; a21?: Card } | undefined) ?? {};
      return { max, points: (a.a12 === item.p.c12 ? 1 : 0) + (a.a21 === item.p.c21 ? 1 : 0) };
    }
    case 'spez': {
      const a = (answer as { disjoint?: boolean; total?: boolean } | undefined) ?? {};
      return { max, points: (a.disjoint === item.s.disjoint ? 1 : 0) + (a.total === item.s.total ? 1 : 0) };
    }
    case 'rel': {
      const a = (answer as { mapping?: Mapping; nullable?: boolean; pk?: string } | undefined) ?? {};
      if (!a.mapping || !validMappings(item.p).includes(a.mapping)) return { max, points: 0 };
      const second = a.mapping === 'zuordnung' ? a.pk === 'beide' : a.nullable === !fkNotNull(item.p, a.mapping);
      return { max, points: 1 + (second ? 1 : 0) };
    }
    case 'nf': {
      const a = (answer as NfAnswer | undefined) ?? {};
      let pts = 0;
      if (a.says1NF !== undefined && gradeOneNf(item.ex, a.says1NF, a.cols ?? [])) pts += 2;
      pts += gradeFds(item.ex, a.fds ?? item.ex.fds.map(() => '')).filter(Boolean).length;
      if (a.highest !== undefined && gradeHighest(item.ex, a.highest)) pts += 1;
      return { max, points: pts };
    }
    case 'ddl': {
      if (!SQL || !answer || !String(answer).trim()) return { max, points: 0 };
      const run = runExercise(SQL, item.ex, String(answer));
      return { max, points: half((max * run.checks.filter((c) => c.ok).length) / run.checks.length) };
    }
    case 'sql': {
      if (!SQL || !answer || !String(answer).trim()) return { max, points: 0 };
      const run = runSqlExercise(SQL, item.ex, String(answer));
      if (run.passed) return { max, points: max };
      // Teilpunkte: Anteil erfuellter Anforderungen, ohne den verdeckten Datenbestand
      const relevant = run.checks.filter((c) => !c.label.startsWith('Stimmt auch'));
      return { max, points: half(((max - 1) * relevant.filter((c) => c.ok).length) / Math.max(1, relevant.length)) };
    }
  }
}

/** Notenorientierung (nicht die offizielle Bewertung) */
export function gradeEstimate(percent: number): string {
  const table: [number, string][] = [
    [95, '1,0'],
    [90, '1,3'],
    [85, '1,7'],
    [80, '2,0'],
    [75, '2,3'],
    [70, '2,7'],
    [65, '3,0'],
    [60, '3,3'],
    [55, '3,7'],
    [50, '4,0'],
  ];
  return table.find(([p]) => percent >= p)?.[1] ?? '5,0';
}

/* ---------------- Speicherung ---------------- */

const KEY = 'dbt:exam';
export function loadExam(): ExamState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExamState) : null;
  } catch {
    return null;
  }
}
export function saveExam(s: ExamState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignorieren */
  }
}
