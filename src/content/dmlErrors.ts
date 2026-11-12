// DML-Skripte, bei denen die Studierenden erkennen sollen, ob und wo ein Fehler entsteht
// (Übung 6, Aufgabe 4). Schema und Constraints: Szenario "Marktplatz". Die Aufgaben sind voneinander
// unabhängig, alle Tabellen sind zu Beginn leer. Die Auflösung wird in den Tests mit der Datenbank geprüft.

export type ErrorCode = 'ORA-00001' | 'ORA-02291' | 'ORA-02292' | 'ORA-02290' | 'ORA-01400' | 'ORA-12899';

export const ERROR_CAUSE: Record<ErrorCode, string> = {
  'ORA-00001': 'Primärschlüssel oder UNIQUE verletzt (ORA-00001)',
  'ORA-02291': 'Fremdschlüssel: Die referenzierte Zeile fehlt (ORA-02291)',
  'ORA-02292': 'Fremdschlüssel: Es gibt noch verweisende Zeilen (ORA-02292)',
  'ORA-02290': 'CHECK-Bedingung verletzt (ORA-02290)',
  'ORA-01400': 'NOT NULL verletzt (ORA-01400)',
  'ORA-12899': 'Wert zu lang für die Spalte (ORA-12899)',
};

export interface DmlErrorTask {
  id: string;
  title: string;
  statements: string[];
  /** Zeilen (ab 1), die einen Fehler erzeugen, mit den zulässigen Ursachen (bei mehreren Verstößen in einer Zeile) */
  errors: { line: number; causes: ErrorCode[]; why: string }[];
  /** Erklärung, wenn kein Fehler entsteht oder allgemein */
  why: string;
}

const N = (id: number, name: string, mail: string) => `INSERT INTO NUTZERIN VALUES (${id}, '${name}', '${mail}');`;

export const dmlErrorTasks: DmlErrorTask[] = [
  {
    id: 'fehler-a',
    title: 'Skript a)',
    statements: [N(7, 'Nicolas Walter', 'walter2@gmail.com'), "INSERT INTO KUNDE VALUES (7 , 'Köln');", 'COMMIT;'],
    errors: [],
    why: 'Erst entsteht die Nutzerin 7, danach darf die Kundin 7 auf sie verweisen. E-Mail und Name erfüllen alle Bedingungen. Es gibt keinen Fehler.',
  },
  {
    id: 'fehler-b',
    title: 'Skript b)',
    statements: [N(7, 'Nicolas Walter', 'walter2@gmail.com'), "INSERT INTO KUNDE VALUES (7 , 'Köln');", "INSERT INTO KUNDE VALUES (9 , 'Köln');", 'COMMIT;'],
    errors: [{ line: 3, causes: ['ORA-02291'], why: 'Es gibt keine Nutzerin mit der ID 9, auf die der Fremdschlüssel Kunde.ID verweisen könnte.' }],
    why: 'Die Zeilen 1 und 2 laufen durch und werden mit COMMIT bestätigt, nur Zeile 3 scheitert.',
  },
  {
    id: 'fehler-c',
    title: 'Skript c)',
    statements: [N(7, 'Nicolas Walter', 'walter2@gmail.com'), N(8, 'Emelie Walter', 'walter87@gmail.com'), N(9, 'Vanessa Walter', 'walter2@gmail.com'), 'COMMIT;'],
    errors: [{ line: 3, causes: ['ORA-00001'], why: 'Die E-Mail walter2@gmail.com gibt es schon (Zeile 1). Die Spalte Email ist UNIQUE.' }],
    why: 'Die IDs sind verschieden, aber die E-Mail-Adresse darf nur einmal vorkommen.',
  },
  {
    id: 'fehler-d',
    title: 'Skript d)',
    statements: [N(7, 'Nicolas Walter', 'walter2@gmail.com'), N(8, 'Emelie Walter', 'walter87@gmail.com'), 'ROLLBACK;', N(9, 'Vanessa Walter', 'walter2@gmail.com'), 'COMMIT;'],
    errors: [],
    why: 'Das ROLLBACK verwirft die Zeilen 1 und 2. Die E-Mail walter2@gmail.com ist danach wieder frei, deshalb funktioniert Zeile 4. Es gibt keinen Fehler.',
  },
  {
    id: 'fehler-e',
    title: 'Skript e)',
    statements: [N(7, 'Nicolas Walter', 'walter2@gmail.com'), 'ROLLBACK;', "INSERT INTO KUNDE VALUES (7 , 'Köln');", 'COMMIT;'],
    errors: [{ line: 3, causes: ['ORA-02291'], why: 'Die Nutzerin 7 wurde durch das ROLLBACK wieder entfernt. Der Kunde 7 hat damit keine Elternzeile mehr.' }],
    why: 'Ein ROLLBACK macht alles seit dem letzten COMMIT rückgängig, auch die Elternzeile.',
  },
  {
    id: 'fehler-f',
    title: 'Skript f)',
    statements: [
      N(7, 'Nicolas Walter', 'walter2@gmail.com'),
      N(8, 'Emelie Walter', 'walter87@gmail.com'),
      "INSERT INTO KUNDE VALUES (7, 'Köln');",
      "INSERT INTO HERSTELLER VALUES (8, 'DE57500095173932341799', 1);",
      "INSERT INTO ARTIKEL VALUES (5, 'Bett', 'Möbel', 8);",
      'INSERT INTO KAUFEN (ARTIKEL, KUNDE) VALUES (5, 7);',
      'COMMIT;',
    ],
    errors: [
      { line: 4, causes: ['ORA-02290'], why: 'Die IBAN beginnt mit DE57, erlaubt ist nur ein Wert, der mit 978 beginnt (CHECK).' },
      { line: 5, causes: ['ORA-02290', 'ORA-02291'], why: 'Die Kategorie „Möbel“ ist nicht erlaubt (CHECK). Außerdem gibt es die Herstellerin 8 nicht, weil Zeile 4 gescheitert ist (Fremdschlüssel).' },
      { line: 6, causes: ['ORA-01400', 'ORA-02291'], why: 'Der Preis fehlt (NOT NULL), und der Artikel 5 existiert nicht (Fremdschlüssel).' },
    ],
    why: 'Die Zeilen 1 bis 3 laufen durch. Danach scheitern drei Zeilen, teils sogar aus zwei Gründen.',
  },
  {
    id: 'fehler-g',
    title: 'Skript g)',
    statements: [
      "INSERT INTO Nutzerin (ID, Name, Email) VALUES (1, 'Bob', 'bob@gmail.com');",
      "INSERT INTO Nutzerin (ID, Name, Email) VALUES (2, 'Max', 'max@gmail.com');",
      "INSERT INTO Hersteller (ID, IBAN, Anzahl_verk_Artikel) VALUES (1, '9789876543210987654321', 30);",
      "INSERT INTO Kunde (ID, Lieferadresse) VALUES (2, 'Köln');",
      "INSERT INTO Artikel (Artikel_ID, Titel, Kategorie, Hersteller) VALUES (1, 'Staubsauger', 'Haushalt', 1);",
      'INSERT INTO kaufen (Artikel, Kunde, Preis) VALUES (1, 2, 0);',
      'COMMIT;',
    ],
    errors: [],
    why: 'Alle Bedingungen sind erfüllt: Die IBAN beginnt mit 978 und hat 22 Zeichen, die Kategorie ist erlaubt, alle Fremdschlüssel finden ihre Elternzeile, und der Preis 0 ist nicht negativ und nicht NULL. Es gibt keinen Fehler.',
  },
  {
    id: 'fehler-h',
    title: 'Skript h)',
    statements: [
      "INSERT INTO Nutzerin (ID, Name, Email) VALUES (3, 'Clara', 'clara@gmail.com');",
      "INSERT INTO Nutzerin (ID, Name, Email) VALUES (4, 'Maria', 'maria@gmail.com');",
      "INSERT INTO Hersteller (ID, IBAN, Anzahl_verk_Artikel) VALUES (3, '1234567890123456789012', 100);",
      "INSERT INTO Kunde (ID, Lieferadresse) VALUES (4, 'Schulstraße 67');",
      "INSERT INTO Artikel (Artikel_ID, Titel, Kategorie, Hersteller) VALUES (2, 'Puppe', 'Spielzeug', 3);",
      'INSERT INTO kaufen (Artikel, Kunde, Preis) VALUES (2, 4, 20.50);',
      'COMMIT;',
    ],
    errors: [
      { line: 3, causes: ['ORA-02290'], why: 'Die IBAN beginnt mit 123 statt mit 978 (CHECK).' },
      { line: 5, causes: ['ORA-02291'], why: 'Die Herstellerin 3 gibt es nicht, weil Zeile 3 gescheitert ist.' },
      { line: 6, causes: ['ORA-02291'], why: 'Der Artikel 2 gibt es nicht, weil Zeile 5 gescheitert ist.' },
    ],
    why: 'Ein Fehler zieht Folgefehler nach sich: Was scheitert, fehlt später als Elternzeile.',
  },
  {
    id: 'fehler-i',
    title: 'Skript i)',
    statements: [
      "INSERT INTO Nutzerin (ID, Name, Email) VALUES (5, 'Lars', 'lars@gmail.com');",
      "INSERT INTO Hersteller (ID, IBAN, Anzahl_verk_Artikel) VALUES (5, '9789876543635987654321', 100);",
      "INSERT INTO Kunde (ID, Lieferadresse) VALUES (5, 'Schulstraße 67');",
      'COMMIT;',
    ],
    errors: [],
    why: 'Eine Nutzerin darf zugleich Herstellerin und Kundin sein. Beide Zeilen verweisen auf die Nutzerin 5, und alle Werte erfüllen die Bedingungen. Es gibt keinen Fehler.',
  },
  {
    id: 'fehler-j',
    title: 'Skript j)',
    statements: [
      "INSERT INTO Nutzerin (ID, Name, Email) VALUES (6, 'Clara', 'clara@gmail.com');",
      "INSERT INTO Nutzerin (ID, Name, Email) VALUES (7, 'Maria', 'maria@gmail.com');",
      "INSERT INTO Hersteller (ID, IBAN, Anzahl_verk_Artikel) VALUES (6, '9789876543635987654321', 100);",
      "INSERT INTO Kunde (ID, Lieferadresse) VALUES (7, 'Schulstraße 67');",
      "INSERT INTO Artikel (Artikel_ID, Titel, Kategorie, Hersteller) VALUES (3, 'Puppe', 'Spielzeug', 6);",
      'INSERT INTO kaufen (Artikel, Kunde, Preis) VALUES (4, 7, 20.50);',
      'COMMIT;',
    ],
    errors: [{ line: 6, causes: ['ORA-02291'], why: 'Es wurde der Artikel 3 angelegt, gekauft wird aber der Artikel 4. Den gibt es nicht.' }],
    why: 'Bis Zeile 5 stimmt alles. Nur der Fremdschlüssel kaufen.Artikel findet seine Elternzeile nicht.',
  },
];
