// Code lesen und beurteilen (MCT-Modus): ein DDL-Skript, dazu Aussagen "richtig oder falsch".
// Jede Aussage hat ein Pruefskript (probe). `claim` sagt, was die Aussage behauptet: das Pruefskript
// laeuft fehlerfrei ('ok') oder bricht mit einem Fehler ab ('error'). Der Test fuehrt jedes Skript in der
// Datenbank aus und vergleicht mit `truth`, damit die Loesung nie von Hand "geraten" ist.

export interface DdlStatement {
  text: string;
  /** 'value': die Aussage behauptet, dass die letzte Abfrage des Pruefskripts genau `value` (erste Zelle) liefert */
  claim: 'ok' | 'error' | 'value';
  value?: string;
  truth: boolean;
  /** Skript, das nach dem Code laeuft; der LETZTE Befehl entscheidet */
  probe: string;
  why: string;
}

export interface DdlReading {
  id: string;
  code: string;
  statements: DdlStatement[];
}

export const ddlReadings: DdlReading[] = [
  {
    id: 'kunde-produkte',
    code: `CREATE TABLE Kunde (
  Kunde_ID INTEGER PRIMARY KEY,
  Kunde_Name VARCHAR2(20) NOT NULL,
  Kunde_Vorname VARCHAR2(20) NOT NULL,
  Email_Adresse VARCHAR2(30) NOT NULL
);

CREATE TABLE Produkte (
  Produkt_ID INTEGER PRIMARY KEY,
  Produkt_Bezeichnung VARCHAR2(100) NOT NULL,
  Preis INTEGER NOT NULL
);

CREATE TABLE Bestellungen (
  Bestellung_ID INTEGER PRIMARY KEY,
  Kunde_ID INTEGER NOT NULL,
  Produkt_ID INTEGER,
  Gesamtpreis INTEGER NOT NULL
);

ALTER TABLE Bestellungen
ADD CONSTRAINT FK_KID
FOREIGN KEY (Kunde_ID) REFERENCES Kunde (Kunde_ID);

ALTER TABLE Bestellungen
ADD CONSTRAINT FK_PID
FOREIGN KEY (Produkt_ID) REFERENCES Produkte (Produkt_ID);`,
    statements: [
      {
        text: "Ein zweiter Datensatz mit dem Wert 98 bei der Produkt_ID kann problemlos in die Tabelle Produkte eingefügt werden.",
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Produkte VALUES (98, 'Tisch', 100);\nINSERT INTO Produkte VALUES (98, 'Stuhl', 50);",
        why: 'Produkt_ID ist Primärschlüssel und muss eindeutig sein. Der zweite INSERT verletzt den Primärschlüssel.',
      },
      {
        text: 'Wird eine Bestellung mit einer Kunde_ID erfasst, die nicht in der Tabelle Kunde steht, schlägt der INSERT fehl.',
        claim: 'error',
        truth: true,
        probe: 'INSERT INTO Bestellungen VALUES (1, 5, NULL, 10);',
        why: 'Der Fremdschlüssel FK_KID verlangt, dass es den Kunden gibt.',
      },
      {
        text: 'Produkt_ID der Tabelle Produkte kann nicht leer sein.',
        claim: 'error',
        truth: true,
        probe: "INSERT INTO Produkte VALUES (NULL, 'Tisch', 100);",
        why: 'Ein Primärschlüssel ist immer auch NOT NULL.',
      },
      {
        text: 'Einer Bestellung kann genau ein oder kein Produkt zugeordnet werden.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Kunde VALUES (1, 'Maier', 'Eva', 'e@m.de');\nINSERT INTO Bestellungen VALUES (1, 1, NULL, 10);",
        why: 'Produkt_ID in Bestellungen ist nicht NOT NULL, kann also leer bleiben. Es gibt nur eine Spalte, also höchstens ein Produkt.',
      },
    ],
  },
  {
    id: 'abteilung-mitarbeiter',
    code: `CREATE TABLE Abteilung (
  Abt_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(30) NOT NULL UNIQUE
);

CREATE TABLE Mitarbeiter (
  MA_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(30) NOT NULL,
  Gehalt NUMBER(8,2) CHECK (Gehalt >= 0),
  Abt_ID INTEGER
);

ALTER TABLE Mitarbeiter
ADD CONSTRAINT fk_abt
FOREIGN KEY (Abt_ID) REFERENCES Abteilung (Abt_ID);`,
    statements: [
      {
        text: 'Zwei verschiedene Abteilungen können denselben Namen haben.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Abteilung VALUES (1, 'IT');\nINSERT INTO Abteilung VALUES (2, 'IT');",
        why: 'Name ist UNIQUE: derselbe Name darf kein zweites Mal vorkommen.',
      },
      {
        text: 'Ein Mitarbeiter ohne Abteilung kann gespeichert werden.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Mitarbeiter VALUES (1, 'Ben', 3000, NULL);",
        why: 'Abt_ID ist ein Fremdschlüssel ohne NOT NULL, NULL ist erlaubt.',
      },
      {
        text: 'Ein Mitarbeiter mit einem Gehalt von -5 kann gespeichert werden.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Mitarbeiter VALUES (1, 'Ben', -5, NULL);",
        why: 'Der CHECK-Constraint verlangt Gehalt >= 0.',
      },
      {
        text: 'Eine Abteilung, der noch Mitarbeiter zugeordnet sind, lässt sich löschen.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Abteilung VALUES (1, 'IT');\nINSERT INTO Mitarbeiter VALUES (1, 'Ben', 3000, 1);\nDELETE FROM Abteilung WHERE Abt_ID = 1;",
        why: 'Der Fremdschlüssel verbietet das Löschen einer Elternzeile, solange Kindzeilen auf sie zeigen.',
      },
    ],
  },
  {
    id: 'student-kurs',
    code: `CREATE TABLE Student (
  Matrikel INTEGER PRIMARY KEY,
  Name VARCHAR2(30) NOT NULL
);

CREATE TABLE Kurs (
  Kurs_ID INTEGER PRIMARY KEY,
  Titel VARCHAR2(40)
);

CREATE TABLE Belegung (
  Matrikel INTEGER,
  Kurs_ID INTEGER,
  Note NUMBER(2,1),
  PRIMARY KEY (Matrikel, Kurs_ID)
);

ALTER TABLE Belegung
ADD CONSTRAINT fk_m FOREIGN KEY (Matrikel) REFERENCES Student (Matrikel);

ALTER TABLE Belegung
ADD CONSTRAINT fk_k FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID);`,
    statements: [
      {
        text: 'Ein Student kann denselben Kurs zweimal belegen.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Student VALUES (1, 'Ada');\nINSERT INTO Kurs VALUES (1, 'DBS');\nINSERT INTO Belegung VALUES (1, 1, NULL);\nINSERT INTO Belegung VALUES (1, 1, NULL);",
        why: 'Der zusammengesetzte Primärschlüssel (Matrikel, Kurs_ID) darf sich nicht wiederholen.',
      },
      {
        text: 'Ein Student kann mehrere verschiedene Kurse belegen.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Student VALUES (1, 'Ada');\nINSERT INTO Kurs VALUES (1, 'DBS');\nINSERT INTO Kurs VALUES (2, 'BWL');\nINSERT INTO Belegung VALUES (1, 1, NULL);\nINSERT INTO Belegung VALUES (1, 2, NULL);",
        why: 'Nur die Kombination muss eindeutig sein, nicht die einzelne Spalte.',
      },
      {
        text: 'Eine Belegung ohne Note kann gespeichert werden.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Student VALUES (1, 'Ada');\nINSERT INTO Kurs VALUES (1, 'DBS');\nINSERT INTO Belegung VALUES (1, 1, NULL);",
        why: 'Note hat kein NOT NULL.',
      },
      {
        text: 'Ein Kurs, der belegt wird, lässt sich löschen.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Student VALUES (1, 'Ada');\nINSERT INTO Kurs VALUES (1, 'DBS');\nINSERT INTO Belegung VALUES (1, 1, NULL);\nDELETE FROM Kurs WHERE Kurs_ID = 1;",
        why: 'Die Belegung verweist per Fremdschlüssel auf den Kurs.',
      },
    ],
  },
  {
    id: 'autor-buch',
    code: `CREATE TABLE Autor (
  A_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(30)
);

CREATE TABLE Buch (
  B_ID INTEGER PRIMARY KEY,
  Titel VARCHAR2(50) NOT NULL,
  A_ID INTEGER NOT NULL
);

ALTER TABLE Buch
ADD CONSTRAINT fk_autor
FOREIGN KEY (A_ID) REFERENCES Autor (A_ID);`,
    statements: [
      {
        text: 'Ein Buch ohne Autor kann eingefügt werden.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Buch VALUES (1, 'SQL', NULL);",
        why: 'A_ID ist NOT NULL.',
      },
      {
        text: 'Ein Autor kann gespeichert werden, ohne dass er ein Buch hat.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Autor VALUES (1, 'Codd');",
        why: 'Die Beziehung wird nur vom Buch aus erzwungen. Ein Autor ohne Buch ist möglich.',
      },
      {
        text: 'Zwei Bücher können denselben Titel haben.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Autor VALUES (1, 'Codd');\nINSERT INTO Buch VALUES (1, 'SQL', 1);\nINSERT INTO Buch VALUES (2, 'SQL', 1);",
        why: 'Titel ist weder UNIQUE noch Primärschlüssel.',
      },
      {
        text: 'Die Tabelle Autor kann gelöscht werden, solange die Tabelle Buch noch existiert.',
        claim: 'ok',
        truth: false,
        probe: 'DROP TABLE Autor;',
        why: 'Buch hat einen Fremdschlüssel auf Autor. Die Tabelle lässt sich erst nach Buch (oder mit CASCADE CONSTRAINTS) löschen.',
      },
    ],
  },
  {
    id: 'tier-alter',
    code: `CREATE TABLE Tier (
  Tier_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(20) NOT NULL,
  Alter_Jahre INTEGER
);

ALTER TABLE Tier
ADD CONSTRAINT c_alter CHECK (Alter_Jahre BETWEEN 0 AND 40);

ALTER TABLE Tier ADD Art VARCHAR2(20);`,
    statements: [
      {
        text: 'Ein Tier ohne Altersangabe (NULL) kann eingefügt werden.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Tier VALUES (1, 'Rex', NULL, 'Hund');",
        why: 'NULL bedeutet „unbekannt“, nicht „kleiner als 0“. Der Vergleich Alter_Jahre BETWEEN 0 AND 40 ergibt bei NULL weder wahr noch falsch, sondern UNKNOWN, und ein CHECK lehnt nur FALSE ab. Ein CHECK ist deshalb kein NOT NULL: NULL verbietet nur NOT NULL.',
      },
      {
        text: 'Ein Tier mit Alter_Jahre 41 kann eingefügt werden.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Tier VALUES (1, 'Rex', 41, 'Hund');",
        why: 'Der CHECK erlaubt nur Werte von 0 bis 40.',
      },
      {
        text: 'Ein Tier mit einer Art kann eingefügt werden, ohne die Spalte Art vorher zu ergänzen.',
        claim: 'error',
        truth: false,
        probe: "INSERT INTO Tier VALUES (1, 'Rex', 3, 'Hund');",
        why: 'Die Spalte Art wurde per ALTER TABLE ... ADD bereits ergänzt. Der INSERT mit vier Werten funktioniert.',
      },
      {
        text: 'Ein Tier ohne Namen (NULL) wird abgelehnt.',
        claim: 'error',
        truth: true,
        probe: "INSERT INTO Tier VALUES (1, NULL, 3, 'Hund');",
        why: 'Name ist NOT NULL.',
      },
    ],
  },
  {
    id: 'person-chef',
    code: `CREATE TABLE Person (
  P_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(30) NOT NULL,
  Chef_ID INTEGER
);

ALTER TABLE Person
ADD CONSTRAINT fk_chef
FOREIGN KEY (Chef_ID) REFERENCES Person (P_ID);`,
    statements: [
      {
        text: 'Die oberste Person ohne Chef kann gespeichert werden.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Person VALUES (1, 'Boss', NULL);",
        why: 'Chef_ID darf leer sein.',
      },
      {
        text: 'Eine Person kann eine Chef_ID haben, die es in der Tabelle nicht gibt.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Person VALUES (1, 'Ben', 99);",
        why: 'Der Fremdschlüssel verweist auf Person selbst. P_ID 99 existiert nicht.',
      },
      {
        text: 'Eine Person mit Chef kann eingefügt werden, sobald der Chef vorher eingefügt wurde.',
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Person VALUES (1, 'Boss', NULL);\nINSERT INTO Person VALUES (2, 'Ben', 1);",
        why: 'Die Chef-Zeile existiert dann bereits.',
      },
      {
        text: 'Der Chef einer Person kann gelöscht werden, während die Person noch auf ihn verweist.',
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Person VALUES (1, 'Boss', NULL);\nINSERT INTO Person VALUES (2, 'Ben', 1);\nDELETE FROM Person WHERE P_ID = 1;",
        why: 'Die Zeile von Ben verweist auf P_ID 1.',
      },
    ],
  },
];
