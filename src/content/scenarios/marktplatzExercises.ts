import type { SqlExercise } from '../sqlTypes';

const SRC = 'Übung 6 (DML) der Vorlesung Datenbanksysteme, Szenario Marktplatz (Nutzer/Artikel/Komponente aus Übung 5)';
const S = { scenario: 'marktplatz', topicId: 'sql-dml', kind: 'dml', source: SRC } as const;

export const marktplatzExercises: SqlExercise[] = [
  {
    ...S,
    scenario: 'marktplatz-leer',
    id: 'markt-daten-einfuegen',
    level: 2,
    title: 'Datensätze einfügen',
    topic: 'INSERT, Reihenfolge wegen Fremdschlüsseln',
    task: 'Die Datenbank ist leer. Füge die Datensätze aus den Tabellen unten ein und beende die Transaktion.\n\nTipp zur Reihenfolge: Ein Fremdschlüssel darf nur auf Zeilen verweisen, die es schon gibt. Ein „-“ in der Tabelle bedeutet: kein Wert (NULL).',
    given: [
      { name: 'Nutzerin', columns: ['ID', 'Name', 'Email'], rows: [['1', 'Lara Jung', 'ljung@web.de'], ['2', 'Carolin Franke', 'cfranke@ulrich.de'], ['3', 'Johannes Graf', 'johgraf@becker.de']] },
      { name: 'Kunde', columns: ['ID', 'Lieferadresse'], rows: [['1', 'Aletshausen,Paderborner Str.6'], ['3', 'Beckingen,Stresemannstr. 72']] },
      { name: 'Hersteller', columns: ['ID', 'IBAN', 'Anzahl_verk_Artikel'], rows: [['2', '9780010517393770123456', '-']] },
      { name: 'Artikel', columns: ['Artikel_ID', 'Titel', 'Kategorie', 'Hersteller'], rows: [['1', 'Kleiner Schrank', 'Haushalt', '2'], ['2', 'Schrauben 50er Pack', 'Haushalt', '2']] },
      { name: 'Komponente', columns: ['Komponenten_ID', 'Bezeichnung', 'Stueckkosten'], rows: [['1', 'Schraube', '0.21'], ['2', 'Holzplatte 800x200x18', '10.8'], ['3', 'Winkelverbinder', '0.75']] },
      { name: 'besteht_aus', columns: ['Komponenten_ID', 'Artikel_ID'], rows: [['2', '1'], ['3', '1'], ['1', '2']] },
      { name: 'kaufen', columns: ['Artikel', 'Kunde', 'Preis'], rows: [['1', '1', '57.99'], ['1', '3', '57.99'], ['2', '1', '10.5']] },
    ],
    hints: [
      'Zuerst die Tabellen, auf die andere verweisen: Nutzerin, dann Kunde und Hersteller.',
      'Danach Artikel und Komponente, zuletzt besteht_aus und kaufen.',
      'Für „-“ schreibst du NULL.',
    ],
    solution: `INSERT INTO Nutzerin VALUES (1, 'Lara Jung', 'ljung@web.de');
INSERT INTO Nutzerin VALUES (2, 'Carolin Franke', 'cfranke@ulrich.de');
INSERT INTO Nutzerin VALUES (3, 'Johannes Graf', 'johgraf@becker.de');
INSERT INTO Kunde VALUES (1, 'Aletshausen,Paderborner Str.6');
INSERT INTO Kunde VALUES (3, 'Beckingen,Stresemannstr. 72');
INSERT INTO Hersteller VALUES (2, '9780010517393770123456', NULL);
INSERT INTO Artikel VALUES (1, 'Kleiner Schrank', 'Haushalt', 2);
INSERT INTO Artikel VALUES (2, 'Schrauben 50er Pack', 'Haushalt', 2);
INSERT INTO Komponente VALUES (1, 'Schraube', 0.21);
INSERT INTO Komponente VALUES (2, 'Holzplatte 800x200x18', 10.8);
INSERT INTO Komponente VALUES (3, 'Winkelverbinder', 0.75);
INSERT INTO besteht_aus VALUES (2, 1);
INSERT INTO besteht_aus VALUES (3, 1);
INSERT INTO besteht_aus VALUES (1, 2);
INSERT INTO kaufen VALUES (1, 1, 57.99);
INSERT INTO kaufen VALUES (1, 3, 57.99);
INSERT INTO kaufen VALUES (2, 1, 10.5);
COMMIT;`,
  },
  {
    ...S,
    id: 'markt-titel',
    level: 1,
    title: 'Packungsgröße ändern',
    topic: 'UPDATE mit WHERE',
    task: 'Die Schrauben-Packung enthält nun nur noch 45 statt 50 Schrauben. Aktualisiere den Titel des Artikels („Schrauben 45er Pack“) und beende die Transaktion.',
    hints: ['UPDATE Artikel SET Titel = … WHERE …', 'Den Artikel findest du über seinen alten Titel.'],
    solution: "UPDATE Artikel\nSET Titel = 'Schrauben 45er Pack'\nWHERE Titel = 'Schrauben 50er Pack';\nCOMMIT;",
  },
  {
    ...S,
    id: 'markt-preise-10',
    level: 1,
    title: 'Preise um 10 % erhöhen',
    topic: 'UPDATE mit Berechnung',
    task: 'Erhöhe die Stückkosten aller Komponenten um 10 % und beende die Transaktion.',
    hints: ['Ohne WHERE werden alle Zeilen geändert.', 'Stueckkosten = Stueckkosten * 1.1'],
    solution: 'UPDATE Komponente\nSET Stueckkosten = Stueckkosten * 1.1;\nCOMMIT;',
  },
  {
    ...S,
    id: 'markt-winkel-5',
    level: 1,
    title: 'Winkelverbinder teurer',
    topic: 'UPDATE mit WHERE und Berechnung',
    task: 'Erhöhe die Stückkosten der Winkelverbinder um 5 % (nur diese Komponente) und beende die Transaktion.',
    hints: ['Die Komponente erkennst du an ihrer Bezeichnung.'],
    solution: "UPDATE Komponente\nSET Stueckkosten = Stueckkosten * 1.05\nWHERE Bezeichnung = 'Winkelverbinder';\nCOMMIT;",
  },
  {
    ...S,
    id: 'markt-zuordnung-loeschen',
    level: 2,
    title: 'Zuordnung löschen',
    topic: 'DELETE mit Unterabfragen',
    task: 'Die neue Version des Kleinen Schranks benötigt keine Winkelverbinder mehr in der Produktion. Lösche diese Zuordnung (nur diese eine) und beende die Transaktion.',
    hints: [
      'Die Zuordnung steht in besteht_aus, mit Nummern statt Namen.',
      'Die Nummern findest du mit einer Unterabfrage über den Namen.',
    ],
    solution:
      "DELETE FROM besteht_aus\nWHERE Komponenten_ID = (SELECT Komponenten_ID FROM Komponente WHERE Bezeichnung = 'Winkelverbinder')\n  AND Artikel_ID = (SELECT Artikel_ID FROM Artikel WHERE Titel = 'Kleiner Schrank');\nCOMMIT;",
  },
  {
    ...S,
    id: 'markt-kaeufe-loeschen',
    level: 1,
    title: 'Alle Käufe erstattet',
    topic: 'DELETE ohne WHERE',
    task: 'Alle Käufe sind erstattet worden. Lösche den Inhalt der Tabelle kaufen (die Tabelle selbst bleibt) und beende die Transaktion.',
    hints: ['DELETE FROM tabelle; entfernt alle Zeilen, DROP TABLE würde die Tabelle entfernen.'],
    solution: 'DELETE FROM kaufen;\nCOMMIT;',
  },
  {
    ...S,
    id: 'markt-hersteller-loeschen',
    level: 3,
    title: 'Herstellerin gibt auf',
    topic: 'DELETE, Reihenfolge, ORA-02292',
    task: 'Carolin Franke gibt ihr Geschäft auf. Lösche sie als Herstellerin mitsamt ihren Artikeln, deren Komponentenzuordnungen und den Käufen dieser Artikel. Als Nutzerin bleibt sie erhalten. Beende die Transaktion.\n\nProbiere ruhig zuerst nur die Herstellerin zu löschen und lies die Fehlermeldung.',
    hints: [
      'Solange etwas auf eine Zeile verweist, lässt sie sich nicht löschen (ORA-02292).',
      'Von unten nach oben: erst kaufen und besteht_aus, dann Artikel, zuletzt Hersteller.',
      'Die Artikel findest du über die Herstellernummer, diese über den Namen der Nutzerin.',
    ],
    solution: `DELETE FROM kaufen
WHERE Artikel IN (SELECT Artikel_ID FROM Artikel
                  WHERE Hersteller = (SELECT ID FROM Nutzerin WHERE Name = 'Carolin Franke'));
DELETE FROM besteht_aus
WHERE Artikel_ID IN (SELECT Artikel_ID FROM Artikel
                     WHERE Hersteller = (SELECT ID FROM Nutzerin WHERE Name = 'Carolin Franke'));
DELETE FROM Artikel
WHERE Hersteller = (SELECT ID FROM Nutzerin WHERE Name = 'Carolin Franke');
DELETE FROM Hersteller
WHERE ID = (SELECT ID FROM Nutzerin WHERE Name = 'Carolin Franke');
COMMIT;`,
  },
  {
    ...S,
    id: 'markt-nutzerin-kundin',
    level: 2,
    title: 'Neue Kundin registrieren',
    topic: 'INSERT in zwei Tabellen',
    task: 'Max Muster (E-Mail max@web.de) registriert sich als Kunde mit der Lieferadresse „Köln,Ring 1“. Lege ihn mit der ID 4 an und beende die Transaktion.',
    hints: ['Kunde verweist auf Nutzerin: zuerst die Nutzerin, dann der Kunde.'],
    solution: "INSERT INTO Nutzerin VALUES (4, 'Max Muster', 'max@web.de');\nINSERT INTO Kunde VALUES (4, 'Köln,Ring 1');\nCOMMIT;",
  },
  {
    ...S,
    id: 'markt-kauf-einfuegen',
    level: 2,
    title: 'Neuer Kauf',
    topic: 'INSERT mit Unterabfragen',
    task: 'Johannes Graf kauft die „Schrauben 50er Pack“ für 10,50 €. Trage den Kauf ein und beende die Transaktion. Die Nummern kennst du nicht auswendig: Hole sie dir über die Namen.',
    hints: ['Statt einer Zahl darf in VALUES eine Unterabfrage stehen, die genau einen Wert liefert.'],
    solution:
      "INSERT INTO kaufen (Artikel, Kunde, Preis)\nVALUES ((SELECT Artikel_ID FROM Artikel WHERE Titel = 'Schrauben 50er Pack'),\n        (SELECT ID FROM Nutzerin WHERE Name = 'Johannes Graf'),\n        10.5);\nCOMMIT;",
  },
  {
    ...S,
    id: 'markt-schrank-preis',
    level: 2,
    title: 'Schrank im Angebot',
    topic: 'UPDATE mit Unterabfrage im WHERE',
    task: 'Senke den Preis aller Käufe des Kleinen Schranks um 10 % und beende die Transaktion.',
    hints: ['Die Artikelnummer findest du über den Titel.'],
    solution:
      "UPDATE kaufen\nSET Preis = Preis * 0.9\nWHERE Artikel = (SELECT Artikel_ID FROM Artikel WHERE Titel = 'Kleiner Schrank');\nCOMMIT;",
  },
  {
    ...S,
    id: 'markt-transaktion',
    level: 2,
    title: 'Rückgängig machen',
    topic: 'COMMIT und ROLLBACK',
    task: 'Lege die Komponente 4 („Dübel“, Stückkosten 0,10) an und mache das mit ROLLBACK rückgängig. Lege dann die Komponente 5 („Leim“, Stückkosten 2,50) an und bestätige mit COMMIT. Am Ende darf nur der Leim in der Tabelle stehen.',
    hints: ['ROLLBACK verwirft alles seit dem letzten COMMIT.'],
    solution:
      "INSERT INTO Komponente VALUES (4, 'Dübel', 0.1);\nROLLBACK;\nINSERT INTO Komponente VALUES (5, 'Leim', 2.5);\nCOMMIT;",
  },
  {
    ...S,
    id: 'markt-anzahl-verkauft',
    level: 3,
    title: 'Verkäufe zählen',
    topic: 'UPDATE mit korrelierter Unterabfrage',
    task: 'Trage bei jeder Herstellerin in Anzahl_verk_Artikel ein, wie oft ihre Artikel insgesamt gekauft wurden (Anzahl der Zeilen in kaufen zu ihren Artikeln). Beende die Transaktion.',
    hints: [
      'Eine Unterabfrage im SET darf auf die äußere Zeile verweisen (korrelierte Unterabfrage).',
      'COUNT(*) über kaufen, verbunden mit Artikel, eingeschränkt auf die Herstellerin.',
    ],
    solution: `UPDATE Hersteller h
SET Anzahl_verk_Artikel = (SELECT COUNT(*)
                           FROM kaufen k JOIN Artikel a ON a.Artikel_ID = k.Artikel
                           WHERE a.Hersteller = h.ID);
COMMIT;`,
  },
];
