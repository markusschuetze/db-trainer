// Entwurf eines Aufgabenpakets im Dozentenmodus (nur im Browser der Lehrperson).
import type { Pack } from './pack';

const KEY = 'dbt:pack-draft';

export const emptyPack = (): Pack => ({ version: 1, chapters: [], topics: [], questions: [], sql: [], scenarios: [], worksheets: [], textTasks: [] });

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

type Key = 'chapters' | 'topics' | 'questions' | 'sql' | 'scenarios' | 'worksheets' | 'textTasks';
const LABEL: Record<Key, string> = {
  chapters: 'Kapitel',
  topics: 'Themen',
  questions: 'Wissensfragen',
  sql: 'SQL-Aufgaben',
  scenarios: 'Fall-Datenbanken',
  worksheets: 'Übungsblätter',
  textTasks: 'Textaufgaben',
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
