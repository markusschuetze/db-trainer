// Constraints prüfen (Übung 6, Aufgabe 3): Die Studierenden verletzen Bedingungen der Datenbank absichtlich
// und manipulieren Datensätze zum anderen korrekt. Szenario "Marktplatz" mit Datenbestand A.

import type { ErrorCode } from './dmlErrors';

export interface ProvokeTask {
  id: string;
  title: string;
  task: string;
  /** Erwartung: ein Fehler mit diesem Code (und diesem Constraint-Namen, falls angegeben) oder fehlerfreie Änderung */
  expect: { error: ErrorCode; constraint?: string } | { ok: true; table: string };
  hints: string[];
  solution: string;
  level: 1 | 2 | 3;
}

export const provokeTasks: ProvokeTask[] = [
  {
    id: 'provoke-pk',
    title: 'Primärschlüssel verletzen',
    level: 1,
    task: 'Lege eine zweite Nutzerin mit der ID 1 an. Die Datenbank soll den Primärschlüssel von Nutzerin verteidigen.',
    expect: { error: 'ORA-00001' },
    hints: ['Die ID 1 gibt es schon. Die E-Mail muss neu sein, sonst verletzt du etwas anderes.'],
    solution: "INSERT INTO Nutzerin VALUES (1, 'Doppelgängerin', 'neu@web.de');",
  },
  {
    id: 'provoke-unique',
    title: 'UNIQUE verletzen',
    level: 1,
    task: 'Lege eine neue Nutzerin mit der ID 10 an, die dieselbe E-Mail-Adresse hat wie Lara Jung (ljung@web.de).',
    expect: { error: 'ORA-00001' },
    hints: ['Diesmal ist die ID neu, aber die E-Mail nicht.'],
    solution: "INSERT INTO Nutzerin VALUES (10, 'Zweite Lara', 'ljung@web.de');",
  },
  {
    id: 'provoke-fk-insert',
    title: 'Fremdschlüssel beim Einfügen verletzen',
    level: 1,
    task: 'Lege einen Kunden mit der ID 99 an. Es gibt keine Nutzerin mit dieser ID.',
    expect: { error: 'ORA-02291' },
    hints: ['Der Fremdschlüssel Kunde.ID verweist auf Nutzerin.ID.'],
    solution: "INSERT INTO Kunde VALUES (99, 'Köln,Ring 1');",
  },
  {
    id: 'provoke-fk-delete',
    title: 'Fremdschlüssel beim Löschen verletzen',
    level: 2,
    task: 'Lösche die Nutzerin Carolin Franke (ID 2). Sie ist Herstellerin und hat Artikel, die Datenbank darf das nicht zulassen.',
    expect: { error: 'ORA-02292' },
    hints: ['Du löschst eine Elternzeile, auf die andere Zeilen noch verweisen.'],
    solution: 'DELETE FROM Nutzerin WHERE ID = 2;',
  },
  {
    id: 'provoke-notnull',
    title: 'NOT NULL verletzen',
    level: 1,
    task: 'Lege den Artikel 3 („Regal“, Kategorie Haushalt) ohne Hersteller an.',
    expect: { error: 'ORA-01400' },
    hints: ['Gib die Spalte Hersteller als NULL an oder lass sie weg.'],
    solution: "INSERT INTO Artikel (Artikel_ID, Titel, Kategorie, Hersteller) VALUES (3, 'Regal', 'Haushalt', NULL);",
  },
  {
    id: 'provoke-check-preis',
    title: 'CHECK: Preis nicht negativ',
    level: 1,
    task: 'Ändere den Preis eines Kaufs so, dass die Bedingung „Preis ≥ 0“ verletzt wird.',
    expect: { error: 'ORA-02290', constraint: 'C_PREIS_CHECK' },
    hints: ['Setze einen negativen Preis, zum Beispiel -5.'],
    solution: 'UPDATE kaufen SET Preis = -5 WHERE Artikel = 2;',
  },
  {
    id: 'provoke-check-kosten',
    title: 'CHECK: Stückkosten zwischen 0 und 100',
    level: 2,
    task: 'Lege eine Komponente 4 („Gold“) mit Stückkosten von 500 an. Erlaubt sind nur Werte von 0 bis 100.',
    expect: { error: 'ORA-02290', constraint: 'C_STUECKKOSTEN_CHECK' },
    hints: ['Die Grenzen 0 und 100 selbst wären noch erlaubt.'],
    solution: "INSERT INTO Komponente VALUES (4, 'Gold', 500);",
  },
  {
    id: 'provoke-check-kategorie',
    title: 'CHECK: erlaubte Kategorien',
    level: 2,
    task: 'Ändere die Kategorie des Kleinen Schranks auf „Möbel“. Erlaubt sind nur Elektronik, Haushalt und Spielzeug.',
    expect: { error: 'ORA-02290', constraint: 'C_KATEGORIE_CHECK' },
    hints: ['Achte auf die genaue Schreibweise der erlaubten Werte, auch Groß- und Kleinschreibung zählt.'],
    solution: "UPDATE Artikel SET Kategorie = 'Möbel' WHERE Titel = 'Kleiner Schrank';",
  },
  {
    id: 'provoke-check-iban',
    title: 'CHECK: IBAN beginnt mit 978',
    level: 2,
    task: 'Ändere die IBAN der Herstellerin 2 auf eine Nummer, die nicht mit 978 beginnt (22 Zeichen).',
    expect: { error: 'ORA-02290', constraint: 'C_IBAN_CHECK' },
    hints: ['Die IBAN ist CHAR(22). Eine zu kurze oder zu lange Angabe wäre ein anderer Fehler.'],
    solution: "UPDATE Hersteller SET IBAN = 'DE57500095173932341799' WHERE ID = 2;",
  },
  {
    id: 'provoke-check-email',
    title: 'CHECK: E-Mail mit @ und Punkt',
    level: 2,
    task: 'Lege eine Nutzerin 10 mit einer E-Mail-Adresse an, die gegen die Bedingung „enthält @ gefolgt von einem Punkt“ verstößt.',
    expect: { error: 'ORA-02290', constraint: 'C_EMAIL_CHECK' },
    hints: ['Zum Beispiel eine Adresse ohne Punkt nach dem @.'],
    solution: "INSERT INTO Nutzerin VALUES (10, 'Test', 'test@web');",
  },
  {
    id: 'provoke-zu-lang',
    title: 'Wert zu lang',
    level: 2,
    task: 'Lege eine Nutzerin 10 an, deren Name länger ist als die 30 Zeichen der Spalte Name.',
    expect: { error: 'ORA-12899' },
    hints: ['Schreibe einen Namen mit mehr als 30 Buchstaben.'],
    solution: "INSERT INTO Nutzerin VALUES (10, 'Maximiliane Alexandra von Hohenzollern', 'lang@web.de');",
  },
  {
    id: 'provoke-korrekt',
    title: 'Korrekt manipulieren',
    level: 1,
    task: 'Das Gegenstück: Lege eine neue Nutzerin 10 an, die alle Bedingungen erfüllt. Es darf kein Fehler auftreten.',
    expect: { ok: true, table: 'Nutzerin' },
    hints: ['Neue ID, neue E-Mail mit @ und Punkt, Name höchstens 30 Zeichen.'],
    solution: "INSERT INTO Nutzerin VALUES (10, 'Max Muster', 'max@muster.de');",
  },
];
