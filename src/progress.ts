// Lernstand: geloeste Uebungen, Ergebnisse je Aufgabe (wie im Fragenkatalog einer
// Fuehrerschein-App) und die Historie der Probeklausuren.
//
// Speicherort:
//   - immer im Browser (localStorage)
//   - zusaetzlich in der Lernplattform, wenn der Trainer als SCORM-Paket laeuft
//     (z. B. in ILU/ILIAS): dann haengt der Fortschritt am Login der Person und ist
//     auf jedem Geraet verfuegbar. Es werden keine Daten an Dritte uebertragen.
//   - Export/Import als Datei fuer den Wechsel zwischen Geraeten ausserhalb von ILU

import { useSyncExternalStore } from 'react';
import { config } from './config';
import type { Chapter } from './content/mcQuestions';
import { readSuspendData, scormActive, suspendLimit, writeSuspendData } from './scorm';

/** [gesehen, richtig, Serie richtig in Folge, zuletzt (Unix-Sekunden)] */
export type ItemStat = [number, number, number, number];

export interface ExamAttempt {
  /** eindeutige ID (Seed + Start) */
  id: string;
  /** Abgabe (Unix-Sekunden) */
  t: number;
  /** Minuten */
  m: number;
  /** Kapitel */
  c: Chapter[];
  /** Punkte, Maximum */
  p: number;
  x: number;
  /** Punkte je Kapitel: [erreicht, maximal] */
  k: Partial<Record<Chapter, [number, number]>>;
}

export interface ProgressData {
  v: 1;
  done: string[];
  items: Record<string, ItemStat>;
  exams: ExamAttempt[];
}

const KEY = 'dbt:progress';
const empty = (): ProgressData => ({ v: 1, done: [], items: {}, exams: [] });

/* ---------------- Laden und Zusammenfuehren ---------------- */

function parse(raw: string | null): ProgressData | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as ProgressData;
    if (d && d.v === 1 && Array.isArray(d.done) && Array.isArray(d.exams) && d.items) return d;
  } catch {
    /* ungueltig */
  }
  return null;
}

/** Vereinigt zwei Staende (z. B. Browser und ILU): nichts geht verloren. */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const items: Record<string, ItemStat> = { ...a.items };
  for (const [k, s] of Object.entries(b.items)) if (!items[k] || s[3] > items[k][3]) items[k] = s;
  const exams = [...a.exams];
  for (const e of b.exams) if (!exams.some((x) => x.id === e.id)) exams.push(e);
  exams.sort((x, y) => x.t - y.t);
  return { v: 1, done: [...new Set([...a.done, ...b.done])], items, exams };
}

function loadLocal(): ProgressData {
  let data: ProgressData | null = null;
  try {
    data = parse(localStorage.getItem(KEY));
    // Uebernahme aus der ersten Prototyp-Version (einzelne Schluessel dbt:done:*)
    if (!data) {
      data = empty();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('dbt:done:')) data.done.push(k.slice(9));
      }
    }
  } catch {
    /* Speicher gesperrt */
  }
  return data ?? empty();
}

let state: ProgressData = empty();
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (initialized) return;
  initialized = true;
  state = loadLocal();
  const remote = parse(readSuspendData());
  if (remote) state = mergeProgress(state, remote);
}

/** Kompakte Fassung fuer SCORM 1.2 (4096 Zeichen): aelteste Klausuren zuerst kuerzen. */
export function compactForLimit(d: ProgressData, limit: number): string {
  let copy: ProgressData = { ...d, exams: [...d.exams] };
  let s = JSON.stringify(copy);
  while (s.length > limit && copy.exams.length > 5) {
    copy.exams.shift();
    s = JSON.stringify(copy);
  }
  if (s.length > limit) {
    // Notfall: aelteste Fragenstatistiken weglassen
    const entries = Object.entries(copy.items).sort((x, y) => y[1][3] - x[1][3]);
    while (s.length > limit && entries.length) {
      entries.pop();
      copy = { ...copy, items: Object.fromEntries(entries) };
      s = JSON.stringify(copy);
    }
  }
  return s;
}

function persist() {
  const json = JSON.stringify(state);
  try {
    localStorage.setItem(KEY, json);
  } catch {
    /* ignorieren */
  }
  if (scormActive()) writeSuspendData(compactForLimit(state, suspendLimit()));
  listeners.forEach((l) => l());
}

function update(fn: (d: ProgressData) => ProgressData) {
  ensureInit();
  state = fn(state);
  persist();
}

/* ---------------- Oeffentliche API ---------------- */

export function getProgress(): ProgressData {
  ensureInit();
  return state;
}

export function useProgress(): ProgressData {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getProgress,
    getProgress,
  );
}

export function isDone(id: string): boolean {
  return getProgress().done.includes(id);
}

export function markDone(id: string) {
  if (isDone(id)) return;
  update((d) => ({ ...d, done: [...d.done, id] }));
}

const now = () => Math.floor(Date.now() / 1000);

/** Ergebnis einer Aufgabe (Probeklausur oder Fragen lernen) eintragen */
export function recordItem(id: string, right: boolean) {
  update((d) => {
    const [seen, ok, streak] = d.items[id] ?? [0, 0, 0, 0];
    return { ...d, items: { ...d.items, [id]: [seen + 1, ok + (right ? 1 : 0), right ? streak + 1 : 0, now()] } };
  });
}

/** Probeklausur eintragen (einmalig pro Klausur) inkl. Ergebnis je Aufgabe */
export function recordExam(attempt: ExamAttempt, itemResults: { id: string; right: boolean }[]) {
  ensureInit();
  if (state.exams.some((e) => e.id === attempt.id)) return;
  update((d) => {
    const items = { ...d.items };
    for (const r of itemResults) {
      const [seen, ok, streak] = items[r.id] ?? [0, 0, 0, 0];
      items[r.id] = [seen + 1, ok + (r.right ? 1 : 0), r.right ? streak + 1 : 0, attempt.t];
    }
    return { ...d, items, exams: [...d.exams, attempt] };
  });
}

export function resetProgress() {
  update(() => empty());
}

export function exportProgress(): string {
  return JSON.stringify(getProgress(), null, 1);
}

/** Datei einlesen und mit dem aktuellen Stand zusammenfuehren. Liefert false bei ungueltiger Datei. */
export function importProgress(json: string): boolean {
  const d = parse(json);
  if (!d) return false;
  update((s) => mergeProgress(s, d));
  return true;
}

export function storageLabel(): string {
  return scormActive()
    ? 'Dein Fortschritt wird in der Lernplattform (z. B. ILU) unter deinem Login gespeichert und ist auf jedem Gerät verfügbar.'
    : 'Dein Fortschritt wird nur in diesem Browser gespeichert. Mit „Fortschritt sichern“ nimmst du ihn auf ein anderes Gerät mit.';
}

/* ---------------- Auswertung ---------------- */

export type Mastery = 'neu' | 'falsch' | 'gelernt' | 'sicher';

/** Wie in Fuehrerschein-Apps: zweimal in Folge richtig = sicher */
export function mastery(s?: ItemStat): Mastery {
  if (!s || s[0] === 0) return 'neu';
  if (s[2] >= 2) return 'sicher';
  if (s[2] === 1) return 'gelernt';
  return 'falsch';
}

export const PASS_PERCENT = 50;
export const READY_STREAK = config.readyStreak;
export const READY_SURE_SHARE = config.readySureShare;
export const FULL_CHAPTERS = 7;

export const percentOf = (e: ExamAttempt) => (e.x ? (100 * e.p) / e.x : 0);
export const passed = (e: ExamAttempt) => percentOf(e) >= PASS_PERCENT;
/** Zaehlt fuer die Pruefungsreife: alle Kapitel, mindestens 60 Minuten */
export const isFull = (e: ExamAttempt) => e.c.length >= FULL_CHAPTERS && e.m >= 60;

/** Bestandene vollstaendige Probeklausuren in Folge (die juengsten zuerst) */
export function passStreak(exams: ExamAttempt[]): number {
  let n = 0;
  for (const e of [...exams].filter(isFull).reverse()) {
    if (!passed(e)) break;
    n++;
  }
  return n;
}

/* ---------------- Entwuerfe im Editor (nur lokal) ---------------- */

export function loadDraft(id: string, fallback: string): string {
  try {
    return localStorage.getItem(`dbt:draft:${id}`) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveDraft(id: string, value: string) {
  try {
    localStorage.setItem(`dbt:draft:${id}`, value);
  } catch {
    /* ignorieren */
  }
}
