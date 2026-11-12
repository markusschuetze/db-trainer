import type { Check, DdlExercise } from './ddlTypes';

const SRC = 'Nach Skript 06 SQL-DDL und Übung 05 (Schaible/Bertelsmeier, TH Köln)';
const SRC_TIERHEIM = 'Übung 6 (DDL), Aufgabe 1: Tierheim, Skript 06 SQL-DDL (Schaible/Schewe/Stratmann, TH Köln)';

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

const TIERHEIM_TABELLEN = `
CREATE TABLE Tier (
  TierID       NUMBER PRIMARY KEY,
  Name         VARCHAR2(50) NOT NULL,
  Geburtsdatum DATE
);
CREATE TABLE Adoptant (
  AdoptantID       NUMBER PRIMARY KEY,
  Vorname          VARCHAR2(30) NOT NULL,
  Nachname         VARCHAR2(30) NOT NULL,
  Lieblingstierart VARCHAR2(50),
  Alter_Jahre      NUMBER NOT NULL
);
CREATE TABLE Mitarbeiter (
  MitarbeiterID   NUMBER PRIMARY KEY,
  Vorname         VARCHAR2(30) NOT NULL,
  Nachname        VARCHAR2(30) NOT NULL,
  Email           VARCHAR2(50) NOT NULL,
  Gehalt          NUMBER NOT NULL,
  Geschlecht      CHAR(1) NOT NULL,
  Aufgabenbereich VARCHAR2(50)
);
CREATE TABLE Adoptiert (
  AdoptantID    NUMBER NOT NULL,
  TierID        NUMBER NOT NULL,
  MitarbeiterID NUMBER NOT NULL,
  Datum         DATE NOT NULL,
  CONSTRAINT pk_adoptiert PRIMARY KEY (AdoptantID, TierID)
);`;
const TIERHEIM_FKS = `
ALTER TABLE Adoptiert ADD CONSTRAINT fk_adoptiert_adoptant FOREIGN KEY (AdoptantID) REFERENCES Adoptant (AdoptantID);
ALTER TABLE Adoptiert ADD CONSTRAINT fk_adoptiert_tier FOREIGN KEY (TierID) REFERENCES Tier (TierID);
ALTER TABLE Adoptiert ADD CONSTRAINT fk_adoptiert_mitarbeiter FOREIGN KEY (MitarbeiterID) REFERENCES Mitarbeiter (MitarbeiterID);`;
const TIERHEIM = `${TIERHEIM_TABELLEN}${TIERHEIM_FKS}`;

const TIERHEIM_MODELL = `Das Relationenmodell des Tierheims (P = Primärschlüssel, F = Fremdschlüssel, * = NOT NULL):

Tier (P* TierID NUMBER, * Name VARCHAR2(50), Geburtsdatum DATE)
Adoptant (P* AdoptantID NUMBER, * Vorname VARCHAR2(30), * Nachname VARCHAR2(30), Lieblingstierart VARCHAR2(50), * Alter_Jahre NUMBER)
Mitarbeiter (P* MitarbeiterID NUMBER, * Vorname VARCHAR2(30), * Nachname VARCHAR2(30), * Email VARCHAR2(50), * Gehalt NUMBER, * Geschlecht CHAR(1), Aufgabenbereich VARCHAR2(50))
Adoptiert (PF* AdoptantID, PF* TierID, F* MitarbeiterID, * Datum DATE)

Adoptiert verweist auf Adoptant, Tier und Mitarbeiter. Hinweis: Das Attribut „Alter“ heißt hier Alter_Jahre, weil ALTER in Oracle ein reserviertes Wort ist.`;

const TIERHEIM_STRUKTUR: Check[] = [
  { kind: 'table', table: 'Tier' },
  { kind: 'table', table: 'Adoptant' },
  { kind: 'table', table: 'Mitarbeiter' },
  { kind: 'table', table: 'Adoptiert' },
  { kind: 'column', table: 'Tier', column: 'Geburtsdatum', family: 'date' },
  { kind: 'column', table: 'Adoptant', column: 'Alter_Jahre', family: 'number' },
  { kind: 'column', table: 'Mitarbeiter', column: 'Gehalt', family: 'number' },
  { kind: 'column', table: 'Mitarbeiter', column: 'Geschlecht', family: 'text' },
  { kind: 'column', table: 'Adoptiert', column: 'Datum', family: 'date' },
  { kind: 'pk', table: 'Tier', columns: ['TierID'] },
  { kind: 'pk', table: 'Adoptant', columns: ['AdoptantID'] },
  { kind: 'pk', table: 'Mitarbeiter', columns: ['MitarbeiterID'] },
  { kind: 'pk', table: 'Adoptiert', columns: ['AdoptantID', 'TierID'] },
  { kind: 'notnull', table: 'Tier', column: 'Name' },
  { kind: 'notnull', table: 'Adoptant', column: 'Vorname' },
  { kind: 'notnull', table: 'Adoptant', column: 'Alter_Jahre' },
  { kind: 'notnull', table: 'Mitarbeiter', column: 'Email' },
  { kind: 'notnull', table: 'Mitarbeiter', column: 'Gehalt' },
  { kind: 'notnull', table: 'Adoptiert', column: 'MitarbeiterID' },
  { kind: 'notnull', table: 'Adoptiert', column: 'Datum' },
  { kind: 'fk', table: 'Adoptiert', columns: ['AdoptantID'], refTable: 'Adoptant' },
  { kind: 'fk', table: 'Adoptiert', columns: ['TierID'], refTable: 'Tier' },
  { kind: 'fk', table: 'Adoptiert', columns: ['MitarbeiterID'], refTable: 'Mitarbeiter' },
];

const MA_INSERT = (id: number, mail: string, gehalt: number, bereich: string | null) =>
  `INSERT INTO Mitarbeiter (MitarbeiterID, Vorname, Nachname, Email, Gehalt, Geschlecht, Aufgabenbereich) VALUES (${id}, 'A', 'B', '${mail}', ${gehalt}, 'w', ${bereich === null ? 'NULL' : `'${bereich}'`})`;
const AD_INSERT = (id: number, tierart: string, alter: number) =>
  `INSERT INTO Adoptant (AdoptantID, Vorname, Nachname, Lieblingstierart, Alter_Jahre) VALUES (${id}, 'A', 'B', '${tierart}', ${alter})`;

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
  {
    id: 'tierheim-tabellen',
    topicId: '06-create',
    title: 'Tierheim: Tabellen erstellen',
    level: 2,
    topic: 'CREATE TABLE und ALTER TABLE für Fremdschlüssel',
    task: `${TIERHEIM_MODELL}

Schreibe die passenden CREATE TABLE-Befehle. Lege die Fremdschlüssel mit ALTER TABLE an.

Probiere ruhig auch, den Fremdschlüssel gleich in CREATE TABLE zu schreiben, wenn die Elterntabelle noch fehlt, und lies die Fehlermeldung.`,
    starter: '-- 1. CREATE TABLE für alle vier Tabellen\n-- 2. ALTER TABLE für die Fremdschlüssel\n',
    hints: [
      'Ein Fremdschlüssel kann nur auf eine Tabelle verweisen, die es schon gibt. Erst Tier, Adoptant und Mitarbeiter, dann Adoptiert.',
      'Adoptiert hat einen zusammengesetzten Primärschlüssel: CONSTRAINT pk_adoptiert PRIMARY KEY (AdoptantID, TierID).',
      'ALTER TABLE Adoptiert ADD CONSTRAINT fk_name FOREIGN KEY (Spalte) REFERENCES Eltern (Schlüssel);',
    ],
    solution: TIERHEIM.trim(),
    checks: [
      ...TIERHEIM_STRUKTUR,
      {
        kind: 'behavior',
        label: 'Adoptiert verlangt vorhandene Zeilen in Adoptant, Tier und Mitarbeiter',
        steps: [
          { sql: "INSERT INTO Adoptiert (AdoptantID, TierID, MitarbeiterID, Datum) VALUES (1, 1, 1, '2026-11-01')", expect: 'error' },
          { sql: "INSERT INTO Tier (TierID, Name) VALUES (1, 'Bello')" },
          { sql: AD_INSERT(1, 'Hund', 30) },
          { sql: MA_INSERT(1, 'ab.cd@Tierheim.de', 40000, 'Pflege') },
          { sql: "INSERT INTO Adoptiert (AdoptantID, TierID, MitarbeiterID, Datum) VALUES (1, 1, 1, '2026-11-01')" },
        ],
      },
    ],
    source: SRC_TIERHEIM,
  },
  {
    id: 'tierheim-drop',
    topicId: '06-alter-drop',
    title: 'Tierheim: Skript mehrfach ausführbar',
    level: 2,
    topic: 'DROP TABLE am Anfang, Reihenfolge, CASCADE CONSTRAINTS',
    task: `Das folgende Skript legt das Tierheim an, lässt sich aber nur einmal ausführen: Beim zweiten Mal gibt es Fehler, weil die Tabellen schon existieren.

Ergänze am Anfang geeignete DROP TABLE-Befehle, damit das Skript mehrfach hintereinander ausgeführt werden kann.

Beim ersten Lauf melden die DROP-Befehle, dass die Tabellen noch nicht existieren (ORA-00942). Das ist in Ordnung.`,
    starter: `-- DROP TABLE-Befehle hier ergänzen

${TIERHEIM.trim()}
`,
    hints: [
      'Eine Tabelle, auf die noch ein Fremdschlüssel verweist, lässt sich nicht löschen (ORA-02449).',
      'Entweder in umgekehrter Reihenfolge löschen (erst Adoptiert) oder DROP TABLE … CASCADE CONSTRAINTS verwenden.',
    ],
    solution: `DROP TABLE Adoptiert CASCADE CONSTRAINTS;
DROP TABLE Tier CASCADE CONSTRAINTS;
DROP TABLE Adoptant CASCADE CONSTRAINTS;
DROP TABLE Mitarbeiter CASCADE CONSTRAINTS;
${TIERHEIM}`,
    checks: [
      { kind: 'table', table: 'Tier' },
      { kind: 'table', table: 'Adoptant' },
      { kind: 'table', table: 'Mitarbeiter' },
      { kind: 'table', table: 'Adoptiert' },
      { kind: 'fk', table: 'Adoptiert', columns: ['TierID'], refTable: 'Tier' },
      { kind: 'rerun' },
    ],
    source: SRC_TIERHEIM,
  },
  {
    id: 'tierheim-check-sofort',
    topicId: '06-constraints',
    title: 'Tierheim: Bedingungen sofort prüfen',
    level: 2,
    topic: 'CHECK mit Vergleich und LIKE, INITIALLY IMMEDIATE',
    task: `Die Tabellen des Tierheims existieren. Ergänze mit ALTER TABLE zwei Bedingungen, die sofort geprüft werden:

1. Das Alter eines Adoptanten muss 18 Jahre oder älter sein.
2. Die E-Mail eines Mitarbeiters besteht aus 2 Zeichen, gefolgt von einem Punkt, gefolgt von einer beliebigen Anzahl von Zeichen, gefolgt von „@Tierheim.de“ (zum Beispiel ab.mueller@Tierheim.de).`,
    setup: TIERHEIM,
    starter: '-- zwei ALTER TABLE-Anweisungen\n',
    hints: [
      'ALTER TABLE <tabelle> ADD CONSTRAINT <name> CHECK (<bedingung>);',
      "Bei LIKE steht _ für genau ein Zeichen und % für beliebig viele: Email LIKE '__.%@Tierheim.de'.",
      "Alternativ geht REGEXP_LIKE(Email, '^.{2}[.].*@Tierheim[.]de$').",
    ],
    solution: `ALTER TABLE Adoptant ADD CONSTRAINT c_alter CHECK (Alter_Jahre >= 18);
ALTER TABLE Mitarbeiter ADD CONSTRAINT c_email CHECK (Email LIKE '__.%@Tierheim.de');`,
    checks: [
      {
        kind: 'behavior',
        label: 'Adoptanten unter 18 werden abgelehnt, ab 18 sind sie erlaubt',
        steps: [{ sql: AD_INSERT(1, 'Hund', 17), expect: 'error' }, { sql: AD_INSERT(1, 'Hund', 18) }],
      },
      {
        kind: 'behavior',
        label: 'E-Mail: genau 2 Zeichen vor dem Punkt, Endung @Tierheim.de',
        steps: [
          { sql: MA_INSERT(1, 'abc.xyz@Tierheim.de', 40000, null), expect: 'error' },
          { sql: MA_INSERT(1, 'ab@Tierheim.de', 40000, null), expect: 'error' },
          { sql: MA_INSERT(1, 'ab.xyz@gmail.com', 40000, null), expect: 'error' },
          { sql: MA_INSERT(1, 'ab.xyz@Tierheim.de', 40000, null) },
        ],
      },
    ],
    source: SRC_TIERHEIM,
  },
  {
    id: 'tierheim-check-verspaetet',
    topicId: '06-constraints',
    title: 'Tierheim: Bedingungen verspätet prüfen',
    level: 3,
    topic: 'CHECK, DEFERRABLE INITIALLY DEFERRED, COMMIT',
    task: `Die Tabellen des Tierheims existieren. Ergänze mit ALTER TABLE drei Bedingungen, die verspätet geprüft werden, also erst beim COMMIT (DEFERRABLE INITIALLY DEFERRED):

1. Es gibt nur zwei Aufgabenbereiche: Tiervermittlung und Pflege.
2. In der Tiervermittlung beträgt das Gehalt mindestens 30.000 €, in der Pflege mindestens 35.000 €.
3. Die Lieblingstierart eines Adoptanten darf nicht „Krokodil“ oder „Zebra“ sein.

Dein Skript wird so geprüft: Ein Einfügen, das die Bedingung verletzt, wird zuerst angenommen und erst beim COMMIT abgelehnt.`,
    setup: TIERHEIM,
    starter: '-- drei ALTER TABLE-Anweisungen mit DEFERRABLE INITIALLY DEFERRED\n',
    hints: [
      'ALTER TABLE <tabelle> ADD CONSTRAINT <name> CHECK (<bedingung>) DEFERRABLE INITIALLY DEFERRED;',
      "Gehalt: (Aufgabenbereich = 'Tiervermittlung' AND Gehalt >= 30000) OR (Aufgabenbereich = 'Pflege' AND Gehalt >= 35000)",
      'Der Unterschied zu INITIALLY IMMEDIATE: Dort scheitert schon die INSERT-Anweisung, hier erst das COMMIT.',
    ],
    solution: `ALTER TABLE Mitarbeiter ADD CONSTRAINT c_bereich
  CHECK (Aufgabenbereich IN ('Tiervermittlung', 'Pflege')) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE Mitarbeiter ADD CONSTRAINT c_gehalt
  CHECK ((Aufgabenbereich = 'Tiervermittlung' AND Gehalt >= 30000)
      OR (Aufgabenbereich = 'Pflege' AND Gehalt >= 35000)) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE Adoptant ADD CONSTRAINT c_tierart
  CHECK (Lieblingstierart NOT IN ('Krokodil', 'Zebra')) DEFERRABLE INITIALLY DEFERRED;`,
    checks: [
      {
        kind: 'behavior',
        label: 'Aufgabenbereich: ungültiger Bereich wird erst beim COMMIT abgelehnt',
        hint: 'Das Einfügen sollte noch klappen und erst das COMMIT scheitern. Ist die Bedingung DEFERRABLE INITIALLY DEFERRED?',
        steps: [
          { sql: MA_INSERT(1, 'ab.cd@Tierheim.de', 40000, 'Verwaltung') },
          { sql: 'COMMIT', expect: 'error' },
        ],
      },
      {
        kind: 'behavior',
        label: 'Gehalt: Tiervermittlung mindestens 30.000, Pflege mindestens 35.000',
        hint: 'Prüfe beide Bereiche. Das Einfügen klappt, das COMMIT lehnt ein zu niedriges Gehalt ab.',
        steps: [
          { sql: MA_INSERT(1, 'ab.cd@Tierheim.de', 25000, 'Tiervermittlung') },
          { sql: 'COMMIT', expect: 'error' },
        ],
      },
      {
        kind: 'behavior',
        label: 'Gehalt in der Pflege: 34.000 ist zu wenig',
        steps: [
          { sql: MA_INSERT(1, 'ab.cd@Tierheim.de', 34000, 'Pflege') },
          { sql: 'COMMIT', expect: 'error' },
        ],
      },
      {
        kind: 'behavior',
        label: 'Gültige Mitarbeitende werden beim COMMIT bestätigt',
        steps: [
          { sql: MA_INSERT(1, 'ab.cd@Tierheim.de', 30000, 'Tiervermittlung') },
          { sql: MA_INSERT(2, 'ef.gh@Tierheim.de', 35000, 'Pflege') },
          { sql: 'COMMIT' },
        ],
      },
      {
        kind: 'behavior',
        label: 'Lieblingstierart: Krokodil wird erst beim COMMIT abgelehnt',
        steps: [{ sql: AD_INSERT(1, 'Krokodil', 30) }, { sql: 'COMMIT', expect: 'error' }],
      },
      {
        kind: 'behavior',
        label: 'Lieblingstierart: Zebra wird abgelehnt, Hund ist erlaubt',
        steps: [{ sql: AD_INSERT(1, 'Zebra', 30) }, { sql: 'COMMIT', expect: 'error' }],
      },
      {
        kind: 'behavior',
        label: 'Eine erlaubte Tierart wird bestätigt',
        steps: [{ sql: AD_INSERT(1, 'Hund', 30) }, { sql: 'COMMIT' }],
      },
    ],
    source: SRC_TIERHEIM,
  },
];
