// SQL-DML/DQL im MCT-Modus: ein kleines Skript (Tabellen und Daten), dazu Aussagen "richtig oder falsch".
// Format wie bei mctDdl.ts; zusaetzlich gibt es `claim: 'value'` (Ergebnis der letzten Abfrage). Der Test fuehrt
// jedes Pruefskript in der Datenbank aus, die Loesung ist also nie geraten.

import type { DdlReading } from './mctDdl';

export const sqlReadings: DdlReading[] = [
  {
    id: 'artikel-insert',
    code: `CREATE TABLE Artikel (
  Art_ID INTEGER PRIMARY KEY,
  Bezeichnung VARCHAR2(20) NOT NULL,
  Preis NUMBER(6,2) CHECK (Preis >= 0),
  Kategorie VARCHAR2(10) DEFAULT 'Sonstige'
);`,
    statements: [
      {
        text: "INSERT INTO Artikel (Art_ID, Bezeichnung) VALUES (1, 'Stift'); läuft fehlerfrei.",
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Artikel (Art_ID, Bezeichnung) VALUES (1, 'Stift');",
        why: 'Der Preis darf fehlen (NULL). Die CHECK-Bedingung gilt dann als nicht verletzt.',
      },
      {
        text: "INSERT INTO Artikel VALUES (2, 'Heft', -3, 'Papier'); läuft fehlerfrei.",
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Artikel VALUES (2, 'Heft', -3, 'Papier');",
        why: 'Ein negativer Preis verletzt CHECK (Preis >= 0).',
      },
      {
        text: "Nach INSERT INTO Artikel (Art_ID, Bezeichnung, Preis) VALUES (3, 'Block', 2); hat Kategorie den Wert 'Sonstige'.",
        claim: 'value',
        value: 'Sonstige',
        truth: true,
        probe: "INSERT INTO Artikel (Art_ID, Bezeichnung, Preis) VALUES (3, 'Block', 2);\nSELECT Kategorie FROM Artikel WHERE Art_ID = 3;",
        why: 'Fehlt eine Spalte im INSERT, wird der DEFAULT-Wert eingetragen.',
      },
      {
        text: 'INSERT INTO Artikel (Art_ID, Preis) VALUES (4, 5); läuft fehlerfrei.',
        claim: 'ok',
        truth: false,
        probe: 'INSERT INTO Artikel (Art_ID, Preis) VALUES (4, 5);',
        why: 'Bezeichnung ist NOT NULL und hat keinen DEFAULT. Ohne Wert scheitert der INSERT.',
      },
    ],
  },
  {
    id: 'mitarbeiter-null',
    code: `CREATE TABLE Mitarbeiter (
  MA_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(20) NOT NULL,
  Gehalt NUMBER(8,2),
  Bonus NUMBER(8,2)
);

INSERT INTO Mitarbeiter VALUES (1, 'Ina', 3000, 500);
INSERT INTO Mitarbeiter VALUES (2, 'Jan', 2800, NULL);
INSERT INTO Mitarbeiter VALUES (3, 'Kim', NULL, NULL);`,
    statements: [
      {
        text: 'SELECT COUNT(*) FROM Mitarbeiter WHERE Bonus = NULL; liefert 0.',
        claim: 'value',
        value: '0',
        truth: true,
        probe: 'SELECT COUNT(*) FROM Mitarbeiter WHERE Bonus = NULL;',
        why: 'Ein Vergleich mit NULL ist weder wahr noch falsch (UNKNOWN). Für NULL muss IS NULL stehen.',
      },
      {
        text: 'SELECT COUNT(*) FROM Mitarbeiter WHERE Bonus IS NULL; liefert 2.',
        claim: 'value',
        value: '2',
        truth: true,
        probe: 'SELECT COUNT(*) FROM Mitarbeiter WHERE Bonus IS NULL;',
        why: 'Jan und Kim haben keinen Bonus.',
      },
      {
        text: 'SELECT COUNT(Bonus) FROM Mitarbeiter; liefert 3.',
        claim: 'value',
        value: '3',
        truth: false,
        probe: 'SELECT COUNT(Bonus) FROM Mitarbeiter;',
        why: 'COUNT(Spalte) zählt nur Werte, die nicht NULL sind. Das ist nur 1 (Ina). COUNT(*) würde 3 liefern.',
      },
      {
        text: 'SELECT NVL(Bonus, 0) FROM Mitarbeiter WHERE MA_ID = 2; liefert 0.',
        claim: 'value',
        value: '0',
        truth: true,
        probe: 'SELECT NVL(Bonus, 0) FROM Mitarbeiter WHERE MA_ID = 2;',
        why: 'NVL ersetzt NULL durch den angegebenen Wert.',
      },
    ],
  },
  {
    id: 'bestellung-gruppen',
    code: `CREATE TABLE Bestellung (
  B_ID INTEGER PRIMARY KEY,
  Kunde VARCHAR2(10) NOT NULL,
  Betrag NUMBER(8,2) NOT NULL
);

INSERT INTO Bestellung VALUES (1, 'Aksoy', 20);
INSERT INTO Bestellung VALUES (2, 'Aksoy', 30);
INSERT INTO Bestellung VALUES (3, 'Berg', 10);
INSERT INTO Bestellung VALUES (4, 'Cebi', 60);
INSERT INTO Bestellung VALUES (5, 'Cebi', 40);`,
    statements: [
      {
        text: 'SELECT COUNT(DISTINCT Kunde) FROM Bestellung; liefert 3.',
        claim: 'value',
        value: '3',
        truth: true,
        probe: 'SELECT COUNT(DISTINCT Kunde) FROM Bestellung;',
        why: 'Es gibt die drei verschiedenen Kunden Aksoy, Berg und Cebi.',
      },
      {
        text: "SELECT SUM(Betrag) FROM Bestellung WHERE Kunde = 'Cebi'; liefert 100.",
        claim: 'value',
        value: '100',
        truth: true,
        probe: "SELECT SUM(Betrag) FROM Bestellung WHERE Kunde = 'Cebi';",
        why: '60 + 40 = 100.',
      },
      {
        text: 'SELECT Kunde FROM Bestellung GROUP BY Kunde HAVING SUM(Betrag) >= 50; liefert als erste Zeile Cebi.',
        claim: 'value',
        value: 'Cebi',
        truth: false,
        probe: 'SELECT Kunde FROM Bestellung GROUP BY Kunde HAVING SUM(Betrag) >= 50 ORDER BY Kunde;',
        why: 'Aksoy hat genau 50 und erfüllt >= 50 ebenfalls. In alphabetischer Reihenfolge steht Aksoy vor Cebi.',
      },
      {
        text: 'SELECT Kunde FROM Bestellung GROUP BY Kunde HAVING SUM(Betrag) > 50; liefert Cebi.',
        claim: 'value',
        value: 'Cebi',
        truth: true,
        probe: 'SELECT Kunde FROM Bestellung GROUP BY Kunde HAVING SUM(Betrag) > 50;',
        why: 'Aksoy hat genau 50 und erfüllt > 50 nicht. Nur Cebi mit 100 bleibt übrig.',
      },
    ],
  },
  {
    id: 'abteilung-join',
    code: `CREATE TABLE Abteilung (
  Abt_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(20) NOT NULL
);

CREATE TABLE Mitarbeiter (
  MA_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(20) NOT NULL,
  Abt_ID INTEGER REFERENCES Abteilung (Abt_ID)
);

INSERT INTO Abteilung VALUES (1, 'IT');
INSERT INTO Abteilung VALUES (2, 'Einkauf');
INSERT INTO Abteilung VALUES (3, 'Archiv');
INSERT INTO Mitarbeiter VALUES (1, 'Ina', 1);
INSERT INTO Mitarbeiter VALUES (2, 'Jan', 1);
INSERT INTO Mitarbeiter VALUES (3, 'Kim', 2);
INSERT INTO Mitarbeiter VALUES (4, 'Lea', NULL);`,
    statements: [
      {
        text: 'SELECT COUNT(*) FROM Mitarbeiter m JOIN Abteilung a ON m.Abt_ID = a.Abt_ID; liefert 3.',
        claim: 'value',
        value: '3',
        truth: true,
        probe: 'SELECT COUNT(*) FROM Mitarbeiter m JOIN Abteilung a ON m.Abt_ID = a.Abt_ID;',
        why: 'Lea hat keine Abteilung (NULL) und fällt beim INNER JOIN heraus.',
      },
      {
        text: 'SELECT COUNT(*) FROM Abteilung a LEFT JOIN Mitarbeiter m ON m.Abt_ID = a.Abt_ID; liefert 3.',
        claim: 'value',
        value: '3',
        truth: false,
        probe: 'SELECT COUNT(*) FROM Abteilung a LEFT JOIN Mitarbeiter m ON m.Abt_ID = a.Abt_ID;',
        why: 'Der LEFT JOIN behält auch das Archiv ohne Mitarbeiter. Es sind IT (2), Einkauf (1) und Archiv (1), also 4 Zeilen.',
      },
      {
        text: 'DELETE FROM Abteilung WHERE Abt_ID = 1; läuft fehlerfrei.',
        claim: 'ok',
        truth: false,
        probe: 'DELETE FROM Abteilung WHERE Abt_ID = 1;',
        why: 'Zur IT gehören noch Mitarbeiter. Der Fremdschlüssel verhindert das Löschen (ORA-02292).',
      },
      {
        text: 'DELETE FROM Abteilung WHERE Abt_ID = 3; läuft fehlerfrei.',
        claim: 'ok',
        truth: true,
        probe: 'DELETE FROM Abteilung WHERE Abt_ID = 3;',
        why: 'Im Archiv arbeitet niemand, es verweist also keine Zeile auf die Abteilung.',
      },
    ],
  },
  {
    id: 'produkt-aendern',
    code: `CREATE TABLE Produkt (
  P_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(20) NOT NULL,
  Preis NUMBER(6,2),
  Lager INTEGER
);

INSERT INTO Produkt VALUES (1, 'Tisch', 100, 5);
INSERT INTO Produkt VALUES (2, 'Stuhl', 40, 0);
INSERT INTO Produkt VALUES (3, 'Lampe', 25, 12);`,
    statements: [
      {
        text: 'Nach DELETE FROM Produkt WHERE Lager = 0; hat die Tabelle noch 2 Zeilen.',
        claim: 'value',
        value: '2',
        truth: true,
        probe: 'DELETE FROM Produkt WHERE Lager = 0;\nSELECT COUNT(*) FROM Produkt;',
        why: 'Nur der Stuhl hat Lager 0 und wird gelöscht.',
      },
      {
        text: 'Nach UPDATE Produkt SET Preis = Preis * 2 WHERE Lager > 0; beträgt die Summe aller Preise 215.',
        claim: 'value',
        value: '215',
        truth: false,
        probe: 'UPDATE Produkt SET Preis = Preis * 2 WHERE Lager > 0;\nSELECT SUM(Preis) FROM Produkt;',
        why: 'Verdoppelt werden Tisch (200) und Lampe (50), der Stuhl bleibt bei 40. Die Summe ist 290.',
      },
      {
        text: 'UPDATE Produkt SET Name = NULL WHERE P_ID = 1; läuft fehlerfrei.',
        claim: 'ok',
        truth: false,
        probe: 'UPDATE Produkt SET Name = NULL WHERE P_ID = 1;',
        why: 'Name ist NOT NULL.',
      },
      {
        text: "INSERT INTO Produkt VALUES (3, 'Regal', 80, 2); läuft fehlerfrei.",
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Produkt VALUES (3, 'Regal', 80, 2);",
        why: 'Die P_ID 3 gibt es schon. Der Primärschlüssel muss eindeutig sein.',
      },
    ],
  },
  {
    id: 'student-abfragen',
    code: `CREATE TABLE Student (
  Matr INTEGER PRIMARY KEY,
  Name VARCHAR2(20) NOT NULL,
  Semester INTEGER NOT NULL,
  Note NUMBER(2,1)
);

INSERT INTO Student VALUES (1, 'Aydin', 3, 1.7);
INSERT INTO Student VALUES (2, 'Bauer', 5, NULL);
INSERT INTO Student VALUES (3, 'Cole', 3, 2.3);
INSERT INTO Student VALUES (4, 'Dietz', 7, 3.0);`,
    statements: [
      {
        text: 'SELECT COUNT(*) FROM Student WHERE Note > 2.0; liefert 2.',
        claim: 'value',
        value: '2',
        truth: true,
        probe: 'SELECT COUNT(*) FROM Student WHERE Note > 2.0;',
        why: 'Cole (2,3) und Dietz (3,0). Bauer hat keine Note (NULL) und wird nicht mitgezählt.',
      },
      {
        text: 'SELECT COUNT(*) FROM Student WHERE Note <= 2.0 OR Note > 2.0; liefert 4.',
        claim: 'value',
        value: '4',
        truth: false,
        probe: 'SELECT COUNT(*) FROM Student WHERE Note <= 2.0 OR Note > 2.0;',
        why: 'Für Bauer sind beide Vergleiche UNKNOWN. Es gibt nur 3 Treffer.',
      },
      {
        text: 'SELECT Name FROM Student WHERE Semester = 3 ORDER BY Name DESC; liefert als erste Zeile Cole.',
        claim: 'value',
        value: 'Cole',
        truth: true,
        probe: 'SELECT Name FROM Student WHERE Semester = 3 ORDER BY Name DESC;',
        why: 'Im 3. Semester sind Aydin und Cole. Absteigend steht Cole vorn.',
      },
      {
        text: "SELECT COUNT(*) FROM Student WHERE Name LIKE '%e%'; liefert 3.",
        claim: 'value',
        value: '3',
        truth: true,
        probe: "SELECT COUNT(*) FROM Student WHERE Name LIKE '%e%';",
        why: 'Ein „e“ steckt in Bauer, Cole und Dietz. Aydin hat keins.',
      },
    ],
  },
  {
    id: 'lieferant-teile',
    code: `CREATE TABLE Lieferant (
  Lief_ID INTEGER PRIMARY KEY,
  Name VARCHAR2(20) NOT NULL,
  Email VARCHAR2(30) UNIQUE
);

INSERT INTO Lieferant VALUES (1, 'Nord', 'info@nord.de');
INSERT INTO Lieferant VALUES (2, 'Süd', NULL);`,
    statements: [
      {
        text: "INSERT INTO Lieferant VALUES (3, 'West', 'info@nord.de'); läuft fehlerfrei.",
        claim: 'ok',
        truth: false,
        probe: "INSERT INTO Lieferant VALUES (3, 'West', 'info@nord.de');",
        why: 'Die E-Mail-Adresse ist UNIQUE und gehört schon dem Lieferanten Nord.',
      },
      {
        text: "INSERT INTO Lieferant VALUES (3, 'West', NULL); läuft fehlerfrei, obwohl Süd schon keine E-Mail hat.",
        claim: 'ok',
        truth: true,
        probe: "INSERT INTO Lieferant VALUES (3, 'West', NULL);",
        why: 'UNIQUE erlaubt mehrere NULL-Werte, denn NULL ist mit nichts gleich.',
      },
      {
        text: "Nach UPDATE Lieferant SET Name = 'Mitte' WHERE Lief_ID = 7; läuft das Statement fehlerfrei und ändert 0 Zeilen.",
        claim: 'ok',
        truth: true,
        probe: "UPDATE Lieferant SET Name = 'Mitte' WHERE Lief_ID = 7;",
        why: 'Ein UPDATE ohne Treffer ist kein Fehler.',
      },
      {
        text: 'SELECT COUNT(*) FROM Lieferant WHERE Email IS NOT NULL; liefert 2.',
        claim: 'value',
        value: '2',
        truth: false,
        probe: 'SELECT COUNT(*) FROM Lieferant WHERE Email IS NOT NULL;',
        why: 'Nur Nord hat eine E-Mail-Adresse, das Ergebnis ist 1.',
      },
    ],
  },
  {
    id: 'film-abfragen',
    code: `CREATE TABLE Film (
  Film_ID INTEGER PRIMARY KEY,
  Titel VARCHAR2(30) NOT NULL,
  Genre VARCHAR2(10) NOT NULL,
  Dauer INTEGER NOT NULL
);

INSERT INTO Film VALUES (1, 'Alpha', 'Drama', 120);
INSERT INTO Film VALUES (2, 'Beta', 'Komödie', 90);
INSERT INTO Film VALUES (3, 'Gamma', 'Drama', 150);
INSERT INTO Film VALUES (4, 'Delta', 'Krimi', 100);`,
    statements: [
      {
        text: 'SELECT AVG(Dauer) FROM Film WHERE Genre = \'Drama\'; liefert 135.',
        claim: 'value',
        value: '135',
        truth: true,
        probe: "SELECT AVG(Dauer) FROM Film WHERE Genre = 'Drama';",
        why: '(120 + 150) / 2 = 135.',
      },
      {
        text: 'SELECT COUNT(DISTINCT Genre) FROM Film; liefert 4.',
        claim: 'value',
        value: '4',
        truth: false,
        probe: 'SELECT COUNT(DISTINCT Genre) FROM Film;',
        why: 'Es gibt nur die drei Genres Drama, Komödie und Krimi. Drama kommt doppelt vor.',
      },
      {
        text: 'SELECT COUNT(*) FROM Film WHERE Dauer BETWEEN 100 AND 120; liefert 2.',
        claim: 'value',
        value: '2',
        truth: true,
        probe: 'SELECT COUNT(*) FROM Film WHERE Dauer BETWEEN 100 AND 120;',
        why: 'BETWEEN schließt beide Grenzen ein: Alpha (120) und Delta (100).',
      },
      {
        text: "SELECT Titel FROM Film WHERE Genre IN ('Drama', 'Krimi') ORDER BY Dauer; liefert als erste Zeile Alpha.",
        claim: 'value',
        value: 'Alpha',
        truth: false,
        probe: "SELECT Titel FROM Film WHERE Genre IN ('Drama', 'Krimi') ORDER BY Dauer;",
        why: 'Aufsteigend nach Dauer kommt zuerst der kürzeste Film, Delta mit 100 Minuten.',
      },
    ],
  },
];
