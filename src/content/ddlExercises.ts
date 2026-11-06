import type { DdlExercise } from './ddlTypes';

const SRC = 'Nach Skript 06 SQL-DDL und Übung 05 (Schaible/Bertelsmeier, TH Köln)';

const KURS_STUDENT_ANMELDEN_PLAIN = `
CREATE TABLE Kurs (
  Kurs_ID NUMBER PRIMARY KEY NOT NULL,
  Bezeichnung VARCHAR2(50)
);
CREATE TABLE Student (
  Matrikelnummer NUMBER PRIMARY KEY NOT NULL,
  Namen VARCHAR2(50) NOT NULL
);
CREATE TABLE Anmelden (
  Kurs_ID NUMBER NOT NULL,
  Matrikelnummer NUMBER NOT NULL,
  Anmeldedatum DATE NOT NULL,
  CONSTRAINT pk_anmelden PRIMARY KEY (Kurs_ID, Matrikelnummer)
);`;

export const ddlExercises: DdlExercise[] = [
  {
    id: 'fitnessstudio',
    topicId: '06-create',
    title: 'Fitnessstudio anlegen',
    level: 1,
    topic: 'CREATE TABLE, Datentypen, NOT NULL, UNIQUE',
    task: `Lege die Relation Fitnessstudio als Tabelle an.

Fitnessstudio (Studio_ID, Name, Strasse, Eroeffnungsdatum, tel_nummer)

• Studio_ID ist der Primärschlüssel (Zahl).
• Name ist ein Pflichtfeld, Text bis 50 Zeichen.
• Strasse: Text bis 50 Zeichen.
• Eroeffnungsdatum ist ein Datum.
• tel_nummer ist eine Zahl und muss eindeutig sein.`,
    starter: '-- Deine CREATE TABLE-Anweisung:\n',
    hints: [
      'Der Aufbau ist CREATE TABLE <name> ( <spalte> <datentyp> [constraint], … );',
      'Oracle-Datentypen aus der Vorlesung: NUMBER, VARCHAR2(n), DATE.',
      'UNIQUE geht als Spaltenconstraint oder als Tabellenconstraint: CONSTRAINT tel_uni UNIQUE (tel_nummer).',
    ],
    solution: `CREATE TABLE Fitnessstudio (
  Studio_ID        NUMBER        PRIMARY KEY,
  Name             VARCHAR2(50)  NOT NULL,
  Strasse          VARCHAR2(50),
  Eroeffnungsdatum DATE,
  tel_nummer       NUMBER,
  CONSTRAINT tel_uni UNIQUE (tel_nummer)
);`,
    checks: [
      { kind: 'table', table: 'Fitnessstudio' },
      { kind: 'column', table: 'Fitnessstudio', column: 'Studio_ID', family: 'number' },
      { kind: 'column', table: 'Fitnessstudio', column: 'Name', family: 'text' },
      { kind: 'column', table: 'Fitnessstudio', column: 'Strasse', family: 'text' },
      { kind: 'column', table: 'Fitnessstudio', column: 'Eroeffnungsdatum', family: 'date' },
      { kind: 'column', table: 'Fitnessstudio', column: 'tel_nummer', family: 'number' },
      { kind: 'pk', table: 'Fitnessstudio', columns: ['Studio_ID'] },
      { kind: 'notnull', table: 'Fitnessstudio', column: 'Name' },
      { kind: 'unique', table: 'Fitnessstudio', columns: ['tel_nummer'] },
    ],
    source: SRC,
  },
  {
    id: 'coworkers',
    topicId: '06-constraints',
    title: 'Spaltenconstraints: COWORKERS',
    level: 1,
    topic: 'Spaltenconstraints, CHECK, DEFAULT',
    task: `Lege die Tabelle COWORKERS an. Alle Bedingungen sollen als Spaltenconstraints definiert werden.

• ID: Zahl, Primärschlüssel.
• NAME: Text bis 20 Zeichen, Pflichtfeld und eindeutig.
• AGE: Zahl mit höchstens 3 Stellen, muss mindestens 18 sein. Der CHECK-Constraint soll ch_age heißen.
• ADDRESS: Text bis 25 Zeichen.
• SALARY: Zahl mit 18 Stellen davon 2 Nachkommastellen, Standardwert 30000, muss größer als 25000 sein.`,
    starter: '-- CREATE TABLE COWORKERS ...\n',
    hints: [
      'CHECK (AGE >= 18) steht direkt hinter dem Datentyp der Spalte.',
      'Einen Constraint benennst du mit CONSTRAINT <name> vor dem Constraint, z. B. CONSTRAINT ch_age CHECK (…).',
      'Reihenfolge in einer Spalte: Datentyp, dann DEFAULT, dann Constraints. SALARY NUMBER(18,2) DEFAULT 30000 CHECK (SALARY > 25000).',
    ],
    solution: `CREATE TABLE COWORKERS (
  ID      NUMBER        PRIMARY KEY,
  NAME    VARCHAR2(20)  NOT NULL UNIQUE,
  AGE     NUMBER(3)     CONSTRAINT ch_age CHECK (AGE >= 18),
  ADDRESS VARCHAR2(25),
  SALARY  NUMBER(18,2)  DEFAULT 30000 CHECK (SALARY > 25000)
);`,
    checks: [
      { kind: 'table', table: 'COWORKERS' },
      { kind: 'pk', table: 'COWORKERS', columns: ['ID'] },
      { kind: 'notnull', table: 'COWORKERS', column: 'NAME' },
      { kind: 'unique', table: 'COWORKERS', columns: ['NAME'] },
      { kind: 'default', table: 'COWORKERS', column: 'SALARY', value: '30000' },
      { kind: 'constraintName', name: 'ch_age' },
      {
        kind: 'behavior',
        label: 'AGE unter 18 wird abgelehnt',
        steps: [{ sql: "INSERT INTO COWORKERS (ID, NAME, AGE) VALUES (1, 'Anna', 17)", expect: 'error' }],
      },
      {
        kind: 'behavior',
        label: 'SALARY unter 25000 wird abgelehnt',
        steps: [{ sql: "INSERT INTO COWORKERS (ID, NAME, AGE, SALARY) VALUES (1, 'Anna', 30, 20000)", expect: 'error' }],
      },
      {
        kind: 'behavior',
        label: 'Gültiger Datensatz bekommt SALARY 30000',
        steps: [{ sql: "INSERT INTO COWORKERS (ID, NAME, AGE) VALUES (1, 'Anna', 30)" }],
        expectValue: { sql: 'SELECT SALARY FROM COWORKERS WHERE ID = 1', equals: '30000' },
      },
      {
        kind: 'behavior',
        label: 'Doppelter NAME wird abgelehnt',
        steps: [
          { sql: "INSERT INTO COWORKERS (ID, NAME, AGE) VALUES (1, 'Anna', 30)" },
          { sql: "INSERT INTO COWORKERS (ID, NAME, AGE) VALUES (2, 'Anna', 31)", expect: 'error' },
        ],
      },
    ],
    source: SRC,
  },
  {
    id: 'kurs-student-anmelden',
    topicId: '06-fk',
    title: 'Kurs, Student und Anmeldung',
    level: 2,
    topic: 'Fremdschlüssel, zusammengesetzter Primärschlüssel, Reihenfolge',
    task: `Setze das Relationenmodell in SQL-DDL um.

Kurs (Kurs_ID, Bezeichnung)
Student (Matrikelnummer, Namen)
Anmelden (Kurs_ID <fk>, Matrikelnummer <fk>, Anmeldedatum)

• Alle Schlüssel sind Zahlen, Bezeichnung und Namen sind Text bis 50 Zeichen, Anmeldedatum ist ein Datum.
• Namen und Anmeldedatum sind Pflichtfelder.
• Anmelden hat einen zusammengesetzten Primärschlüssel aus beiden Fremdschlüsseln.
• Achte auf die Reihenfolge, in der du die Tabellen anlegst.`,
    starter: '-- Tabellen anlegen (Reihenfolge beachten!)\n',
    hints: [
      'Ein zusammengesetzter Primärschlüssel geht nur als Tabellenconstraint: PRIMARY KEY (Kurs_ID, Matrikelnummer).',
      'Ein Fremdschlüssel kann nur auf eine Tabelle zeigen, die schon existiert. Erst Kurs und Student, dann Anmelden.',
      'FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID)',
    ],
    solution: `CREATE TABLE Kurs (
  Kurs_ID NUMBER PRIMARY KEY,
  Bezeichnung VARCHAR2(50)
);

CREATE TABLE Student (
  Matrikelnummer NUMBER PRIMARY KEY,
  Namen VARCHAR2(50) NOT NULL
);

CREATE TABLE Anmelden (
  Kurs_ID NUMBER,
  Matrikelnummer NUMBER,
  Anmeldedatum DATE NOT NULL,
  CONSTRAINT pk_anmelden PRIMARY KEY (Kurs_ID, Matrikelnummer),
  CONSTRAINT fk_kurs FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID),
  CONSTRAINT fk_student FOREIGN KEY (Matrikelnummer) REFERENCES Student (Matrikelnummer)
);`,
    checks: [
      { kind: 'table', table: 'Kurs' },
      { kind: 'table', table: 'Student' },
      { kind: 'table', table: 'Anmelden' },
      { kind: 'notnull', table: 'Student', column: 'Namen' },
      { kind: 'notnull', table: 'Anmelden', column: 'Anmeldedatum' },
      { kind: 'pk', table: 'Anmelden', columns: ['Kurs_ID', 'Matrikelnummer'] },
      { kind: 'fk', table: 'Anmelden', columns: ['Kurs_ID'], refTable: 'Kurs' },
      { kind: 'fk', table: 'Anmelden', columns: ['Matrikelnummer'], refTable: 'Student' },
      {
        kind: 'behavior',
        label: 'Anmeldung zu unbekanntem Kurs wird abgelehnt',
        steps: [
          { sql: "INSERT INTO Student (Matrikelnummer, Namen) VALUES (100, 'Anna')" },
          { sql: "INSERT INTO Anmelden (Kurs_ID, Matrikelnummer, Anmeldedatum) VALUES (99, 100, '2026-11-06')", expect: 'error' },
        ],
      },
      {
        kind: 'behavior',
        label: 'Doppelte Anmeldung wird abgelehnt, gültige funktioniert',
        steps: [
          { sql: "INSERT INTO Kurs (Kurs_ID, Bezeichnung) VALUES (1, 'DB')" },
          { sql: "INSERT INTO Student (Matrikelnummer, Namen) VALUES (100, 'Anna')" },
          { sql: "INSERT INTO Anmelden (Kurs_ID, Matrikelnummer, Anmeldedatum) VALUES (1, 100, '2026-11-06')" },
          { sql: "INSERT INTO Anmelden (Kurs_ID, Matrikelnummer, Anmeldedatum) VALUES (1, 100, '2026-11-07')", expect: 'error' },
        ],
      },
    ],
    source: SRC,
  },
  {
    id: 'alter-fremdschluessel',
    topicId: '06-alter-drop',
    title: 'Fremdschlüssel nachträglich: ALTER TABLE',
    level: 2,
    topic: 'ALTER TABLE ADD CONSTRAINT, Constraint-Namen',
    task: `Die drei Tabellen Kurs, Student und Anmelden existieren bereits, aber Anmelden hat noch keine Fremdschlüssel.

Ergänze sie mit ALTER TABLE:
• fk_kurs: Anmelden.Kurs_ID verweist auf Kurs.
• fk_student: Anmelden.Matrikelnummer verweist auf Student.

Mit ALTER TABLE ist die Reihenfolge, in der die Tabellen angelegt wurden, egal.`,
    setup: KURS_STUDENT_ANMELDEN_PLAIN,
    starter: '-- ALTER TABLE ...\n',
    hints: [
      'ALTER TABLE <tabelle> ADD CONSTRAINT <name> FOREIGN KEY (<spalte>) REFERENCES <ziel> (<spalte>);',
      'Du brauchst zwei ALTER-TABLE-Anweisungen.',
    ],
    solution: `ALTER TABLE Anmelden
  ADD CONSTRAINT fk_kurs FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID);

ALTER TABLE Anmelden
  ADD CONSTRAINT fk_student FOREIGN KEY (Matrikelnummer) REFERENCES Student (Matrikelnummer);`,
    checks: [
      { kind: 'fk', table: 'Anmelden', columns: ['Kurs_ID'], refTable: 'Kurs', refColumns: ['Kurs_ID'] },
      { kind: 'fk', table: 'Anmelden', columns: ['Matrikelnummer'], refTable: 'Student', refColumns: ['Matrikelnummer'] },
      { kind: 'constraintName', name: 'fk_kurs' },
      { kind: 'constraintName', name: 'fk_student' },
      {
        kind: 'behavior',
        label: 'Anmeldung zu unbekanntem Kurs wird abgelehnt',
        steps: [
          { sql: "INSERT INTO Student (Matrikelnummer, Namen) VALUES (100, 'Anna')" },
          { sql: "INSERT INTO Anmelden (Kurs_ID, Matrikelnummer, Anmeldedatum) VALUES (99, 100, '2026-11-06')", expect: 'error' },
        ],
      },
    ],
    source: SRC,
  },
  {
    id: 'check-constraints',
    topicId: '06-constraints',
    title: 'CHECK-Constraints ergänzen',
    level: 2,
    topic: 'CHECK mit Vergleich, BETWEEN, IN, LIKE',
    task: `Ein Onlineshop hat vier Tabellen, aber noch keine Wertebereiche. Ergänze mit ALTER TABLE jeweils einen benannten CHECK-Constraint:

1. kaufen: Preis darf nicht negativ sein (c_preis_check).
2. Komponente: Stueckkosten liegen zwischen 0 und 100 (c_kosten_check).
3. Artikel: Kategorie ist 'Elektronik', 'Haushalt' oder 'Spielzeug' (c_kategorie_check).
4. Nutzerin: Email hat das Muster text@text.text (c_email_check).`,
    setup: `
CREATE TABLE Nutzerin (ID NUMBER PRIMARY KEY, Name VARCHAR2(30), Email VARCHAR2(30) UNIQUE NOT NULL);
CREATE TABLE Komponente (Komponenten_ID NUMBER PRIMARY KEY, Bezeichnung VARCHAR2(50), Stueckkosten NUMBER);
CREATE TABLE Artikel (Artikel_ID NUMBER PRIMARY KEY, Titel VARCHAR2(20), Kategorie VARCHAR2(30), Hersteller NUMBER NOT NULL);
CREATE TABLE kaufen (Artikel NUMBER, Kunde NUMBER, Preis NUMBER NOT NULL, CONSTRAINT pk_kauf PRIMARY KEY (Artikel, Kunde));`,
    starter: '-- vier ALTER TABLE-Anweisungen\n',
    hints: [
      'ALTER TABLE <tabelle> ADD CONSTRAINT <name> CHECK (<bedingung>);',
      'Bedingungen: Preis >= 0, Stueckkosten BETWEEN 0 AND 100, Kategorie IN (…), Email LIKE …',
      'LIKE nutzt % als Platzhalter für beliebig viele Zeichen: Email LIKE \'%@%.%\'.',
    ],
    solution: `ALTER TABLE kaufen ADD CONSTRAINT c_preis_check CHECK (Preis >= 0);
ALTER TABLE Komponente ADD CONSTRAINT c_kosten_check CHECK (Stueckkosten BETWEEN 0 AND 100);
ALTER TABLE Artikel ADD CONSTRAINT c_kategorie_check CHECK (Kategorie IN ('Elektronik', 'Haushalt', 'Spielzeug'));
ALTER TABLE Nutzerin ADD CONSTRAINT c_email_check CHECK (Email LIKE '%@%.%');`,
    checks: [
      { kind: 'constraintName', name: 'c_preis_check' },
      { kind: 'constraintName', name: 'c_kosten_check' },
      { kind: 'constraintName', name: 'c_kategorie_check' },
      { kind: 'constraintName', name: 'c_email_check' },
      {
        kind: 'behavior',
        label: 'Negativer Preis wird abgelehnt, 0 und höher sind erlaubt',
        steps: [
          { sql: 'INSERT INTO kaufen (Artikel, Kunde, Preis) VALUES (1, 1, -5)', expect: 'error' },
          { sql: 'INSERT INTO kaufen (Artikel, Kunde, Preis) VALUES (1, 1, 0)' },
        ],
      },
      {
        kind: 'behavior',
        label: 'Stückkosten nur von 0 bis 100',
        steps: [
          { sql: "INSERT INTO Komponente (Komponenten_ID, Bezeichnung, Stueckkosten) VALUES (1, 'x', 150)", expect: 'error' },
          { sql: "INSERT INTO Komponente (Komponenten_ID, Bezeichnung, Stueckkosten) VALUES (1, 'x', 100)" },
        ],
      },
      {
        kind: 'behavior',
        label: 'Kategorie nur aus der erlaubten Liste',
        steps: [
          { sql: "INSERT INTO Artikel (Artikel_ID, Titel, Kategorie, Hersteller) VALUES (1, 't', 'Moebel', 1)", expect: 'error' },
          { sql: "INSERT INTO Artikel (Artikel_ID, Titel, Kategorie, Hersteller) VALUES (1, 't', 'Haushalt', 1)" },
        ],
      },
      {
        kind: 'behavior',
        label: 'E-Mail braucht @ und einen Punkt danach',
        steps: [
          { sql: "INSERT INTO Nutzerin (ID, Name, Email) VALUES (1, 'a', 'keine-mail')", expect: 'error' },
          { sql: "INSERT INTO Nutzerin (ID, Name, Email) VALUES (1, 'a', 'a@b.de')" },
        ],
      },
    ],
    source: SRC,
  },
  {
    id: 'referentielle-integritaet',
    topicId: '06-fk',
    title: 'Löschverhalten: restriktiv oder kaskadierend',
    level: 3,
    topic: 'Referentielle Integrität, ON DELETE CASCADE',
    task: `Abteilung und Projekt existieren bereits. Lege zwei weitere Tabellen an:

Mitarbeiter (MA_ID, Name, Abt_ID)
• MA_ID ist der Primärschlüssel, Name ein Pflichtfeld (Text bis 30), Abt_ID verweist auf Abteilung.
• Eine Abteilung darf nicht gelöscht werden, solange ihr Mitarbeiter zugeordnet sind (restriktiv, das Standardverhalten).

Aufgabe (Aufgabe_ID, Bezeichnung, Projekt_ID)
• Aufgabe_ID ist der Primärschlüssel, Bezeichnung Text bis 50, Projekt_ID ist ein Pflichtfeld und verweist auf Projekt.
• Wird ein Projekt gelöscht, sollen seine Aufgaben automatisch mitgelöscht werden.`,
    setup: `
CREATE TABLE Abteilung (Abt_ID NUMBER PRIMARY KEY, Name VARCHAR2(30));
CREATE TABLE Projekt (Projekt_ID NUMBER PRIMARY KEY, Titel VARCHAR2(50));`,
    starter: '-- Mitarbeiter und Aufgabe\n',
    hints: [
      'Ohne weitere Angabe ist ein Fremdschlüssel restriktiv: Löschen des Elternsatzes wird abgelehnt.',
      'Kaskadieren: REFERENCES Projekt (Projekt_ID) ON DELETE CASCADE',
      'Oracle kennt kein ON UPDATE und kein ON DELETE RESTRICT.',
    ],
    solution: `CREATE TABLE Mitarbeiter (
  MA_ID NUMBER PRIMARY KEY,
  Name VARCHAR2(30) NOT NULL,
  Abt_ID NUMBER REFERENCES Abteilung (Abt_ID)
);

CREATE TABLE Aufgabe (
  Aufgabe_ID NUMBER PRIMARY KEY,
  Bezeichnung VARCHAR2(50),
  Projekt_ID NUMBER NOT NULL,
  CONSTRAINT fk_projekt FOREIGN KEY (Projekt_ID) REFERENCES Projekt (Projekt_ID) ON DELETE CASCADE
);`,
    checks: [
      { kind: 'pk', table: 'Mitarbeiter', columns: ['MA_ID'] },
      { kind: 'notnull', table: 'Mitarbeiter', column: 'Name' },
      { kind: 'fk', table: 'Mitarbeiter', columns: ['Abt_ID'], refTable: 'Abteilung', onDelete: 'restrict' },
      { kind: 'pk', table: 'Aufgabe', columns: ['Aufgabe_ID'] },
      { kind: 'notnull', table: 'Aufgabe', column: 'Projekt_ID' },
      { kind: 'fk', table: 'Aufgabe', columns: ['Projekt_ID'], refTable: 'Projekt', onDelete: 'cascade' },
      {
        kind: 'behavior',
        label: 'Abteilung mit Mitarbeitern lässt sich nicht löschen',
        steps: [
          { sql: "INSERT INTO Abteilung (Abt_ID, Name) VALUES (1, 'IT')" },
          { sql: "INSERT INTO Mitarbeiter (MA_ID, Name, Abt_ID) VALUES (1, 'Anna', 1)" },
          { sql: 'DELETE FROM Abteilung WHERE Abt_ID = 1', expect: 'error' },
        ],
      },
      {
        kind: 'behavior',
        label: 'Beim Löschen eines Projekts verschwinden seine Aufgaben',
        steps: [
          { sql: "INSERT INTO Projekt (Projekt_ID, Titel) VALUES (1, 'P')" },
          { sql: "INSERT INTO Aufgabe (Aufgabe_ID, Bezeichnung, Projekt_ID) VALUES (1, 'a', 1)" },
          { sql: 'DELETE FROM Projekt WHERE Projekt_ID = 1' },
        ],
        expectValue: { sql: 'SELECT COUNT(*) FROM Aufgabe', equals: '0' },
      },
    ],
    source: SRC,
  },
  {
    id: 'identity',
    topicId: '06-identity',
    title: 'Automatische IDs: Identity Column',
    level: 3,
    topic: 'GENERATED ... AS IDENTITY',
    task: `Lege eine Tabelle Ticket an, deren ID automatisch vergeben wird (Identity Column, neu bei Oracle).

Ticket (Ticket_ID, Titel)
• Ticket_ID: Zahl, wird automatisch erzeugt und ist der Primärschlüssel.
• Titel: Pflichtfeld, Text bis 50 Zeichen.

Beim Einfügen soll nur der Titel angegeben werden müssen.`,
    starter: '-- CREATE TABLE Ticket ...\n',
    hints: [
      'Nach dem Datentyp: GENERATED ALWAYS AS IDENTITY.',
      'Ticket_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
    ],
    solution: `CREATE TABLE Ticket (
  Ticket_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Titel VARCHAR2(50) NOT NULL
);`,
    checks: [
      { kind: 'pk', table: 'Ticket', columns: ['Ticket_ID'] },
      { kind: 'notnull', table: 'Ticket', column: 'Titel' },
      {
        kind: 'behavior',
        label: 'Zwei Tickets ohne ID-Angabe bekommen verschiedene IDs',
        steps: [
          { sql: "INSERT INTO Ticket (Titel) VALUES ('a')" },
          { sql: "INSERT INTO Ticket (Titel) VALUES ('b')" },
        ],
        expectValue: { sql: 'SELECT COUNT(DISTINCT Ticket_ID) FROM Ticket', equals: '2' },
      },
    ],
    source: SRC,
  },
  {
    id: 'drop-reihenfolge',
    topicId: '06-alter-drop',
    title: 'Tabellen löschen: Reihenfolge',
    level: 2,
    topic: 'DROP TABLE, CASCADE CONSTRAINTS',
    task: `Die Tabellen Kurs, Student und Anmelden (mit Fremdschlüsseln) existieren. Lösche alle drei.

Probiere ruhig zuerst Kurs zu löschen und lies die Fehlermeldung. Schreibe dann ein Skript, das fehlerfrei durchläuft. Es gibt zwei Wege: die richtige Reihenfolge oder die Option CASCADE CONSTRAINTS.`,
    setup: `${KURS_STUDENT_ANMELDEN_PLAIN}
ALTER TABLE Anmelden ADD CONSTRAINT fk_kurs FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID);
ALTER TABLE Anmelden ADD CONSTRAINT fk_student FOREIGN KEY (Matrikelnummer) REFERENCES Student (Matrikelnummer);`,
    starter: '-- DROP TABLE ...\n',
    hints: [
      'Eine Tabelle, auf die noch ein Fremdschlüssel verweist, lässt sich nicht löschen (ORA-02449).',
      'Erst die Tabelle mit dem Fremdschlüssel (Anmelden), dann die referenzierten (Kurs, Student).',
      'Alternativ: DROP TABLE Kurs CASCADE CONSTRAINTS; entfernt die Fremdschlüssel gleich mit.',
    ],
    solution: `DROP TABLE Anmelden;
DROP TABLE Kurs;
DROP TABLE Student;`,
    checks: [{ kind: 'noTables' }],
    source: SRC,
  },
];
