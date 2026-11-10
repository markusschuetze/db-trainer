// Aufgabenformat des NF-Trainers. Neue Aufgaben = neuer Eintrag in
// exercises.ts, kein weiterer Code noetig. Notation wie in Skript 05.

export type DepKind = 'voll' | 'partiell' | 'transitiv';

export interface Table {
  columns: string[];
  rows: string[][];
  /** Primaerschluessel-Spalten (werden unterstrichen dargestellt) */
  pk: string[];
}

export interface FunctionalDependency {
  lhs: string[];
  rhs: string[];
  kind: DepKind;
  /** Begruendung, die nach der Antwort angezeigt wird */
  why: string;
}

export interface OneNfIssue {
  column: string;
  type: 'mehrwertig' | 'strukturiert';
  why: string;
}

export interface NfExercise {
  id: string;
  /** Thema nach den Vorlesungsfolien, siehe content/topics.ts */
  topicId: string;
  title: string;
  scenario: string;
  /** Optionaler Hinweis, wird nur auf Wunsch angezeigt (darf nichts verraten, was die Aufgabe selbst abfragt) */
  hint?: string;
  /** Bedeutung kurzer Spaltennamen, wird neben der Tabelle angezeigt */
  glossary?: Record<string, string>;
  /** Ausgangsrelation */
  relation: Table;
  oneNF: {
    ok: boolean;
    issues: OneNfIssue[];
    /** Relation nach Aufloesung (nur wenn !ok); Basis fuer die Abhaengigkeiten */
    fixed?: Table;
    fixNote?: string;
  };
  /** Abhaengigkeiten, die der Lernende klassifiziert */
  fds: FunctionalDependency[];
  /** Hoechste erfuellte Normalform der (1NF-bereinigten) Ausgangsrelation */
  highestNF: 1 | 2 | 3;
  /** Zielschema in Vorlesungsnotation, eine Relation pro Zeile */
  target: string[];
  targetNote?: string;
  tags: ('1NF' | '2NF' | '3NF')[];
  /** Quelle/Lizenzhinweis der Aufgabe */
  source: string;
}
