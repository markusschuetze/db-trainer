// SQL-DML/DQL im MCT-Modus: ein kleines Skript (Tabellen und Daten), dazu Aussagen "richtig oder falsch".
// Format wie bei mctDdl.ts; zusaetzlich gibt es `claim: 'value'` (Ergebnis der letzten Abfrage). Der Test fuehrt
// jedes Pruefskript in der Datenbank aus, die Loesung ist also nie geraten.

import type { DdlReading } from './mctDdl';

export const sqlReadings: DdlReading[] = [
  {
    id: 'konto-rollback',
    code: `CREATE TABLE Konto (
  Konto_ID INTEGER PRIMARY KEY,
  Inhaber VARCHAR2(30) NOT NULL,
  Stand NUMBER(8,2) NOT NULL
);

INSERT INTO Konto VALUES (1, 'Maier', 100);
INSERT INTO Konto VALUES (2, 'Schulz', 250);
COMMIT;`,
    statements: [
      {
        text: 'Nach UPDATE Konto SET Stand = Stand - 50 WHERE Konto_ID = 1; und ROLLBACK; beträgt der Stand von Konto 1 weiterhin 100.',
        claim: 'value',
        value: '100',
        truth: true,
        probe: 'UPDATE Konto SET Stand = Stand - 50 WHERE Konto_ID = 1;\nROLLBACK;\nSELECT Stand FROM Konto WHERE Konto_ID = 1;',
        why: 'ROLLBACK verwirft die noch nicht bestätigte Änderung. Der Stand ist wieder 100.',
      },
      {
        text: 'Nach UPDATE Konto SET Stand = Stand - 50 WHERE Konto_ID = 1; COMMIT; ROLLBACK; beträgt der Stand von Konto 1 wieder 100.',
        claim: 'value',
        value: '100',
        truth: false,
        probe: 'UPDATE Konto SET Stand = Stand - 50 WHERE Konto_ID = 1;\nCOMMIT;\nROLLBACK;\nSELECT Stand FROM Konto WHERE Konto_ID = 1;',
        why: 'Das COMMIT hat die Änderung bestätigt. Das spätere ROLLBACK hat nichts mehr zu verwerfen, der Stand bleibt 50.',
      },
      {
        text: 'UPDATE Konto SET Stand = 0; ohne WHERE ändert alle Zeilen der Tabelle (danach haben 2 Konten den Stand 0).',
        claim: 'value',
        value: '2',
        truth: true,
        probe: 'UPDATE Konto SET Stand = 0;\nSELECT COUNT(*) FROM Konto WHERE Stand = 0;',
        why: 'Ohne WHERE gilt die Änderung für jede Zeile.',
      },
      {
        text: 'DELETE FROM Konto; ohne WHERE löscht nur die erste Zeile (danach bleibt 1 Konto).',
        claim: 'value',
        value: '1',
        truth: false,
        probe: 'DELETE FROM Konto;\nSELECT COUNT(*) FROM Konto;',
        why: 'Ohne WHERE werden alle Zeilen gelöscht. Es bleibt kein Konto übrig.',
      },
    ],
  },
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
INSERT INTO Mitarbeiter VALUES (3, 'Kim', NULL, NULL);
COMMIT;`,
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
INSERT INTO Bestellung VALUES (5, 'Cebi', 40);
COMMIT;`,
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
INSERT INTO Mitarbeiter VALUES (4, 'Lea', NULL);
COMMIT;`,
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
INSERT INTO Produkt VALUES (3, 'Lampe', 25, 12);
COMMIT;`,
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
INSERT INTO Student VALUES (4, 'Dietz', 7, 3.0);
COMMIT;`,
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
    id: 'kurs-transaktion',
    code: `CREATE TABLE Kurs (
  K_ID INTEGER PRIMARY KEY,
  Titel VARCHAR2(20) NOT NULL,
  Plaetze INTEGER
);

INSERT INTO Kurs VALUES (1, 'Datenbanken', 30);
INSERT INTO Kurs VALUES (2, 'Mathe', 50);
COMMIT;`,
    statements: [
      {
        text: "Nach INSERT INTO Kurs VALUES (3, 'Web', 20); und ROLLBACK; hat die Tabelle 2 Zeilen.",
        claim: 'value',
        value: '2',
        truth: true,
        probe: "INSERT INTO Kurs VALUES (3, 'Web', 20);\nROLLBACK;\nSELECT COUNT(*) FROM Kurs;",
        why: 'Das ROLLBACK nimmt den noch nicht bestätigten INSERT zurück.',
      },
      {
        text: "Nach INSERT INTO Kurs VALUES (3, 'Web', 20); COMMIT; ROLLBACK; hat die Tabelle 2 Zeilen.",
        claim: 'value',
        value: '2',
        truth: false,
        probe: "INSERT INTO Kurs VALUES (3, 'Web', 20);\nCOMMIT;\nROLLBACK;\nSELECT COUNT(*) FROM Kurs;",
        why: 'Das COMMIT hat den INSERT festgeschrieben. Es bleiben 3 Zeilen.',
      },
      {
        text: 'DELETE FROM Kurs WHERE Plaetze > 100; läuft fehlerfrei, auch wenn keine Zeile betroffen ist.',
        claim: 'ok',
        truth: true,
        probe: 'DELETE FROM Kurs WHERE Plaetze > 100;',
        why: 'Ein DELETE ohne Treffer ist kein Fehler. Es werden einfach 0 Zeilen gelöscht.',
      },
      {
        text: "INSERT INTO Kurs (K_ID, Plaetze) VALUES (3, 20); läuft fehlerfrei.",
        claim: 'ok',
        truth: false,
        probe: 'INSERT INTO Kurs (K_ID, Plaetze) VALUES (3, 20);',
        why: 'Titel ist NOT NULL und fehlt im INSERT.',
      },
    ],
  },
];
