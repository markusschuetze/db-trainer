// Uebungsblaetter fuer den Praktikums-Modus (#/praktikum): Eine Datenbank (Schema und
// Daten als SQL-Skript) plus Aufgaben. Anders als in den Einzelaufgaben bleibt die
// Datenbank zwischen den Eingaben erhalten, wie im SQL Developer.

import { scenarios } from './scenarios';
import { sqlExercises } from './sqlExercises';

export interface WorksheetTask {
  id: string;
  text: string;
  /** optionale Musterloesung (wird erst auf Wunsch gezeigt) */
  solution?: string;
  hint?: string;
}

export interface Worksheet {
  id: string;
  title: string;
  description?: string;
  /** SQL-Skript (CREATE TABLE, INSERT, ...), das beim Start der Sitzung ausgefuehrt wird */
  schema: string;
  tasks: WorksheetTask[];
  origin: 'eingebaut' | 'paket' | 'datei';
}

/** Blaetter aus dem Aufgabenpaket und importierte Blaetter */
export const packWorksheets: Worksheet[] = [];

const UEBUNG05: Worksheet = {
  id: 'uebung05-ddl',
  title: 'Übung 05: Kurs, Student, Anmelden (DDL)',
  description: 'Tabellen anlegen, Fremdschlüssel nachträglich ergänzen, CHECK-Constraints. Die Datenbank ist am Anfang leer.',
  schema: '',
  origin: 'eingebaut',
  tasks: [
    {
      id: 'a2a',
      text: 'Lege die Tabellen Kurs (Kurs_ID, Bezeichnung), Student (Matrikelnummer, Namen) und Anmelden (Kurs_ID, Matrikelnummer, Anmeldedatum) an. Anmelden hat einen zusammengesetzten Primärschlüssel und Fremdschlüssel auf Kurs und Student. Achte auf die Reihenfolge.',
      hint: 'Erst die Tabellen, auf die verwiesen wird. Oder ohne Fremdschlüssel anlegen und mit ALTER TABLE ergänzen.',
      solution:
        "CREATE TABLE Kurs (\n  Kurs_ID NUMBER PRIMARY KEY NOT NULL,\n  Bezeichnung VARCHAR2(50)\n);\nCREATE TABLE Student (\n  Matrikelnummer NUMBER PRIMARY KEY NOT NULL,\n  Namen VARCHAR2(50) NOT NULL\n);\nCREATE TABLE Anmelden (\n  Kurs_ID NUMBER NOT NULL,\n  Matrikelnummer NUMBER NOT NULL,\n  Anmeldedatum DATE NOT NULL,\n  CONSTRAINT pk_anmelden PRIMARY KEY (Kurs_ID, Matrikelnummer),\n  CONSTRAINT fk_kurs FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID),\n  CONSTRAINT fk_student FOREIGN KEY (Matrikelnummer) REFERENCES Student (Matrikelnummer)\n);",
    },
    {
      id: 'a2b',
      text: 'Setze die Datenbank zurück und lege die Tabellen diesmal ohne Fremdschlüssel an. Ergänze die Fremdschlüssel fk_kurs und fk_student danach mit ALTER TABLE.',
      solution:
        'ALTER TABLE Anmelden ADD CONSTRAINT fk_kurs FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID);\nALTER TABLE Anmelden ADD CONSTRAINT fk_student FOREIGN KEY (Matrikelnummer) REFERENCES Student (Matrikelnummer);',
    },
    {
      id: 'a3',
      text: 'Füge Testdaten ein: zwei Kurse, zwei Studierende, drei Anmeldungen. Versuche danach, eine Anmeldung zu einem nicht existierenden Kurs einzufügen und lies die Fehlermeldung. Öffne das ER-Fenster und prüfe, in welche Richtung die Fremdschlüssel zeigen.',
      hint: 'Die Fehlermeldung nennt den Code ORA-02291 (Elterndatensatz fehlt).',
    },
    {
      id: 'a4',
      text: 'Ergänze CHECK-Constraints: Anmeldedatum darf nicht in der Zukunft liegen ist hier nicht möglich (kein SYSDATE in CHECK), aber Kurs-Bezeichnungen sollen mindestens 3 Zeichen haben (LENGTH).',
      solution: "ALTER TABLE Kurs ADD CONSTRAINT c_bez_check CHECK (LENGTH(Bezeichnung) >= 3);",
    },
  ],
};

/** Alle Blaetter: Uebung 05, je Fall-Datenbank eines mit den Aufgaben, dazu Paket-Blaetter */
export function allWorksheets(): Worksheet[] {
  const fromScenarios: Worksheet[] = scenarios.map((sc) => ({
    id: `db-${sc.id}`,
    title: `Datenbank ${sc.name}: Abfragen und Änderungen`,
    description: `${sc.description} Die Datenbank bleibt zwischen den Eingaben erhalten, mit „Zurücksetzen“ beginnst du neu.`,
    schema: sc.schema + sc.dataA,
    origin: 'eingebaut' as const,
    tasks: sqlExercises
      .filter((e) => (e.scenario ?? 'hochschule') === sc.id)
      .map((e) => ({ id: e.id, text: e.task, hint: e.hints[0], solution: e.solution })),
  }));
  return [UEBUNG05, ...fromScenarios, ...packWorksheets];
}
