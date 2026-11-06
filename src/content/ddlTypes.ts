// Aufgabenformat des DDL-Trainers. Geprueft wird nicht der Text der Loesung,
// sondern das Ergebnis: Struktur (Schluessel, NOT NULL, ...) und Verhalten
// (was passiert beim Einfuegen/Loeschen). So sind alle richtigen Loesungen gueltig.

export type TypeFamily = 'number' | 'text' | 'date';

export type Check = { hint?: string; label?: string } & (
  | { kind: 'table'; table: string }
  | { kind: 'column'; table: string; column: string; family?: TypeFamily }
  | { kind: 'pk'; table: string; columns: string[] }
  | { kind: 'notnull'; table: string; column: string }
  | { kind: 'unique'; table: string; columns: string[] }
  | {
      kind: 'fk';
      table: string;
      columns: string[];
      refTable: string;
      refColumns?: string[];
      onDelete?: 'cascade' | 'setnull' | 'restrict';
    }
  | { kind: 'default'; table: string; column: string; value: string }
  | { kind: 'constraintName'; name: string }
  | { kind: 'noTables' }
  | {
      kind: 'behavior';
      /** Schritte laufen in einer Transaktion, die danach zurueckgerollt wird */
      steps: { sql: string; expect?: 'ok' | 'error' }[];
      /** Optional: Ergebnis einer Abfrage nach den Schritten */
      expectValue?: { sql: string; equals: string };
    }
);

export interface DdlExercise {
  id: string;
  /** Thema nach den Vorlesungsfolien, siehe content/topics.ts */
  topicId: string;
  title: string;
  level: 1 | 2 | 3;
  /** Aufgabentext (einfaches Markdown-freies Format, Absaetze mit Leerzeile) */
  task: string;
  /** Bereits vorhandene Tabellen, werden vor dem Skript des Lernenden ausgefuehrt */
  setup?: string;
  /** Vorlage im Editor */
  starter?: string;
  hints: string[];
  solution: string;
  checks: Check[];
  /** Skript-Bezug */
  topic: string;
  source: string;
}
