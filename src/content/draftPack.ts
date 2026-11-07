// Entwurf eines Aufgabenpakets im Dozentenmodus (nur im Browser der Lehrperson).
import type { Pack } from './pack';

const KEY = 'dbt:pack-draft';

export const emptyPack = (): Pack => ({ version: 1, chapters: [], topics: [], questions: [], sql: [], scenarios: [], worksheets: [], textTasks: [], ddl: [], nf: [], phrases: [] });

export function loadDraft(): Pack {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '') as Pack;
    if (p && typeof p === 'object') return { ...emptyPack(), ...p };
  } catch {
    /* ignorieren */
  }
  return emptyPack();
}

export function saveDraft(p: Pack) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignorieren */
  }
}

type Key = 'chapters' | 'topics' | 'questions' | 'sql' | 'scenarios' | 'worksheets' | 'textTasks' | 'ddl' | 'nf' | 'phrases';
const LABEL: Record<Key, string> = {
  chapters: 'Kapitel',
  topics: 'Themen',
  questions: 'Wissensfragen',
  sql: 'SQL-Aufgaben',
  scenarios: 'Fall-Datenbanken',
  worksheets: 'Übungsblätter',
  textTasks: 'Textaufgaben',
  ddl: 'DDL-Aufgaben',
  nf: 'Normalisierungsaufgaben',
  phrases: 'ER-Phrasen',
};
export const KEYS = Object.keys(LABEL) as Key[];
export const keyLabel = (k: Key) => LABEL[k];

/** Eintrag hinzufuegen; gleiche ID ersetzt den vorhandenen Eintrag */
export function addItem(p: Pack, key: Key, item: { id: string }): Pack {
  const list = ((p[key] ?? []) as { id: string }[]).filter((x) => x.id !== item.id);
  return { ...p, [key]: [...list, item] } as Pack;
}

export function removeItem(p: Pack, key: Key, id: string): Pack {
  return { ...p, [key]: ((p[key] ?? []) as { id: string }[]).filter((x) => x.id !== id) } as Pack;
}

/** Zwei Pakete vereinen (importierte Eintraege ersetzen gleiche IDs) */
export function mergePacks(a: Pack, b: Pack): Pack {
  let out = a;
  for (const k of KEYS) for (const item of (b[k] ?? []) as { id: string }[]) out = addItem(out, k, item);
  return out;
}

export const countOf = (p: Pack) => KEYS.reduce((n, k) => n + ((p[k] as unknown[] | undefined)?.length ?? 0), 0);

/** Leere Abschnitte weglassen, damit die Datei schlank bleibt */
export function toFile(p: Pack): string {
  const out: Record<string, unknown> = { version: 1 };
  for (const k of KEYS) if ((p[k] as unknown[] | undefined)?.length) out[k] = p[k];
  return JSON.stringify(out, null, 2) + '\n';
}

export interface ParsedTask {
  id: string;
  text: string;
  hint?: string;
  solution?: string;
}

/**
 * Aufgaben als einfachen Text schreiben. Aufgaben werden durch eine Zeile "===" getrennt.
 * Innerhalb einer Aufgabe: normaler Text, optional eine Zeile "Tipp: ..." und ab einer Zeile
 * "Lösung:" die Musterloesung (SQL) bis zum Ende der Aufgabe.
 */
export function parseTasks(input: string): ParsedTask[] {
  return input
    .split(/^\s*===\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block, i) => {
      const lines = block.split('\n');
      const sol = lines.findIndex((l) => /^\s*Lösung:\s*$/i.test(l) || /^\s*Lösung:\s+\S/i.test(l));
      const head = sol >= 0 ? lines.slice(0, sol) : lines;
      const solutionLines = sol >= 0 ? [lines[sol].replace(/^\s*Lösung:\s*/i, ''), ...lines.slice(sol + 1)] : [];
      const hintLine = head.findIndex((l) => /^\s*Tipp:/i.test(l));
      const hint = hintLine >= 0 ? head[hintLine].replace(/^\s*Tipp:\s*/i, '').trim() : undefined;
      const text = head.filter((_, k) => k !== hintLine).join('\n').trim();
      const solution = solutionLines.join('\n').trim();
      return { id: `a${i + 1}`, text, ...(hint ? { hint } : {}), ...(solution ? { solution } : {}) };
    })
    .filter((t) => t.text);
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

/* ---------- Normalisierungsaufgaben aus Text ---------- */

import type { DepKind, FunctionalDependency, OneNfIssue, Table } from './types';

const splitCells = (line: string) => (line.includes('\t') ? line.split('\t') : line.includes(';') ? line.split(';') : line.split('|')).map((c) => c.trim());

/** Tabelle aus eingefuegtem Text (aus Excel kopiert oder mit ; getrennt): erste Zeile = Spaltennamen */
export function parseTable(text: string, pk: string[]): { table: Table; error?: string } {
  const lines = text.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  if (lines.length < 2) return { table: { columns: [], rows: [], pk }, error: 'Mindestens eine Kopfzeile und eine Datenzeile nötig.' };
  const columns = splitCells(lines[0]);
  const rows = lines.slice(1).map(splitCells);
  const bad = rows.findIndex((r) => r.length !== columns.length);
  if (bad >= 0) return { table: { columns, rows, pk }, error: `Zeile ${bad + 2} hat ${rows[bad].length} statt ${columns.length} Spalten.` };
  const missing = pk.filter((k) => !columns.includes(k));
  if (missing.length) return { table: { columns, rows, pk }, error: `Schlüsselspalte nicht gefunden: ${missing.join(', ')}` };
  return { table: { columns, rows, pk } };
}

/** Abhaengigkeiten: "A, B -> C, D | partiell | Begruendung" je Zeile */
export function parseFds(text: string): { fds: FunctionalDependency[]; error?: string } {
  const fds: FunctionalDependency[] = [];
  for (const [i, raw] of text.split('\n').entries()) {
    if (!raw.trim()) continue;
    const m = raw.match(/^(.+?)\s*(?:->|→)\s*(.+?)\s*\|\s*(voll|partiell|transitiv)\s*\|\s*(.+)$/i);
    if (!m) return { fds, error: `Zeile ${i + 1}: Format „A, B -> C | partiell | Begründung“ erwartet.` };
    const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    fds.push({ lhs: list(m[1]), rhs: list(m[2]), kind: m[3].toLowerCase() as DepKind, why: m[4].trim() });
  }
  return { fds };
}

/** Verletzungen der 1NF: "Spalte | mehrwertig | Begruendung" je Zeile */
export function parseIssues(text: string): { issues: OneNfIssue[]; error?: string } {
  const issues: OneNfIssue[] = [];
  for (const [i, raw] of text.split('\n').entries()) {
    if (!raw.trim()) continue;
    const m = raw.match(/^(.+?)\s*\|\s*(mehrwertig|strukturiert)\s*\|\s*(.+)$/i);
    if (!m) return { issues, error: `Zeile ${i + 1}: Format „Spalte | mehrwertig | Begründung“ erwartet.` };
    issues.push({ column: m[1].trim(), type: m[2].toLowerCase() as OneNfIssue['type'], why: m[3].trim() });
  }
  return { issues };
}

/** Hoechste erfuellte Normalform der 1NF-bereinigten Relation aus den Abhaengigkeiten */
export const highestNfOf = (fds: FunctionalDependency[]): 1 | 2 | 3 =>
  fds.some((f) => f.kind === 'partiell') ? 1 : fds.some((f) => f.kind === 'transitiv') ? 2 : 3;
