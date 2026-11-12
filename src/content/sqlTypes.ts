// Aufgabenformat fuer DQL (SELECT) und DML (INSERT/UPDATE/DELETE) auf der
// Fall-Datenbank "Hochschule". Bewertet wird das Ergebnis:
//   DQL: Ergebnismenge der Abfrage im Vergleich zur Musterloesung
//   DML: Tabelleninhalte nach dem Skript im Vergleich zur Musterloesung
// jeweils auf dem sichtbaren und einem verdeckten Datenbestand.

export interface SqlExercise {
  id: string;
  /** Thema nach den Vorlesungsfolien, siehe content/topics.ts */
  topicId: string;
  kind: 'dql' | 'dml';
  /** Fall-Datenbank (content/scenarios.ts), Standard: hochschule */
  scenario?: string;
  title: string;
  topic: string;
  level: 1 | 2 | 3;
  task: string;
  hints: string[];
  solution: string;
  /** DQL: Reihenfolge der Zeilen ist Teil der Aufgabe (ORDER BY) */
  ordered?: boolean;
  starter?: string;
  /** Datensaetze, die in der Aufgabe vorgegeben werden (z. B. zum Einfuegen), als Tabellen */
  given?: { name: string; columns: string[]; rows: string[][] }[];
  source: string;
}
