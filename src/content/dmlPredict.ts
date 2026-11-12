// "Was steht danach in der Tabelle?": Ein DML-Skript lesen und das Ergebnis vorhersagen, ohne SQL zu schreiben.
// Szenario Marktplatz, Datenbestand A. Antwort und Optionen werden in den Tests mit der Datenbank geprüft.

export interface PredictTask {
  id: string;
  title: string;
  script: string[];
  /** Frage in Worten und die Abfrage, die den Wert liefert (wird nicht angezeigt) */
  question: string;
  query: string;
  options: string[];
  answer: string;
  why: string;
}

export const predictTasks: PredictTask[] = [
  {
    id: 'pred-rollback',
    title: 'ROLLBACK',
    script: ['DELETE FROM kaufen WHERE Preis > 20;', 'ROLLBACK;'],
    question: 'Wie viele Zeilen hat die Tabelle kaufen nach dem Skript?',
    query: 'SELECT COUNT(*) FROM kaufen',
    options: ['0', '1', '3', 'Es gibt einen Fehler'],
    answer: '3',
    why: 'Das DELETE löscht zwei Zeilen, das ROLLBACK macht es rückgängig. Es bleiben alle 3 Käufe.',
  },
  {
    id: 'pred-commit',
    title: 'COMMIT',
    script: ['DELETE FROM kaufen WHERE Preis > 20;', 'COMMIT;', 'ROLLBACK;'],
    question: 'Wie viele Zeilen hat die Tabelle kaufen nach dem Skript?',
    query: 'SELECT COUNT(*) FROM kaufen',
    options: ['0', '1', '3', 'Es gibt einen Fehler'],
    answer: '1',
    why: 'Das COMMIT bestätigt das Löschen der zwei Käufe über 20. Das spätere ROLLBACK hat nichts mehr zu verwerfen.',
  },
  {
    id: 'pred-fk-delete',
    title: 'Löschen einer Elternzeile',
    script: ['DELETE FROM Nutzerin WHERE ID = 2;', 'COMMIT;'],
    question: 'Wie viele Zeilen hat die Tabelle Nutzerin nach dem Skript?',
    query: 'SELECT COUNT(*) FROM Nutzerin',
    options: ['2', '3', '0', 'Die Tabelle wird gelöscht'],
    answer: '3',
    why: 'Die Nutzerin 2 ist Herstellerin und hat Artikel. Das DELETE scheitert mit ORA-02292, alle 3 Zeilen bleiben.',
  },
  {
    id: 'pred-check-update',
    title: 'UPDATE gegen eine CHECK-Bedingung',
    script: ['UPDATE kaufen SET Preis = Preis - 60;', 'COMMIT;'],
    question: 'Wie hoch ist die Summe aller Preise in kaufen danach (gerundet auf 2 Stellen)?',
    query: 'SELECT ROUND(SUM(Preis), 2) FROM kaufen',
    options: ['126.48', '-53.52', '-5.52', '66.48'],
    answer: '126.48',
    why: 'Zwei Preise (57,99) würden negativ. Die CHECK-Bedingung Preis >= 0 verletzt die Anweisung, und eine fehlgeschlagene Anweisung ändert gar nichts, auch nicht die Zeile mit 10,50. Die Summe bleibt 126,48.',
  },
  {
    id: 'pred-pk-doppelt',
    title: 'Doppelter Primärschlüssel',
    script: ["INSERT INTO Kunde VALUES (2, 'Köln');", "INSERT INTO Kunde VALUES (2, 'Bonn');", 'COMMIT;'],
    question: 'Welche Lieferadresse hat der Kunde 2 danach?',
    query: 'SELECT Lieferadresse FROM Kunde WHERE ID = 2',
    options: ['Köln', 'Bonn', 'Köln und Bonn (zwei Zeilen)', 'Es gibt keinen Kunden 2'],
    answer: 'Köln',
    why: 'Das erste INSERT gelingt. Das zweite scheitert am Primärschlüssel (ORA-00001), die Zeile bleibt unverändert, und das COMMIT bestätigt die erste.',
  },
  {
    id: 'pred-update-like',
    title: 'UPDATE mit LIKE',
    script: ["UPDATE Artikel SET Kategorie = 'Spielzeug' WHERE Titel LIKE 'Schrauben%';", 'COMMIT;'],
    question: 'Wie viele Artikel haben danach die Kategorie Haushalt?',
    query: "SELECT COUNT(*) FROM Artikel WHERE Kategorie = 'Haushalt'",
    options: ['0', '1', '2', 'Es gibt einen Fehler'],
    answer: '1',
    why: 'Nur der Titel „Schrauben 50er Pack“ passt auf das Muster. Der Kleine Schrank bleibt in Haushalt. „Spielzeug“ ist eine erlaubte Kategorie.',
  },
  {
    id: 'pred-rollback-insert',
    title: 'INSERT, ROLLBACK, INSERT',
    script: ["INSERT INTO Komponente VALUES (4, 'Leim', 2.5);", 'ROLLBACK;', "INSERT INTO Komponente VALUES (5, 'Dübel', 0.1);", 'COMMIT;'],
    question: 'Wie viele Zeilen hat die Tabelle Komponente nach dem Skript?',
    query: 'SELECT COUNT(*) FROM Komponente',
    options: ['3', '4', '5', 'Es gibt einen Fehler'],
    answer: '4',
    why: 'Die Komponente 4 wird mit dem ROLLBACK verworfen. Nur der Dübel kommt zu den 3 vorhandenen Zeilen dazu.',
  },
  {
    id: 'pred-rechnen',
    title: 'UPDATE mit Berechnung',
    script: ["UPDATE Komponente SET Stueckkosten = Stueckkosten * 1.1 WHERE Bezeichnung LIKE '%platte%';", 'COMMIT;'],
    question: 'Welche Stückkosten hat die Holzplatte danach (gerundet auf 2 Stellen)?',
    query: "SELECT ROUND(Stueckkosten, 2) FROM Komponente WHERE Bezeichnung LIKE 'Holz%'",
    options: ['10.8', '11.88', '21.6', '10.91'],
    answer: '11.88',
    why: '10,80 · 1,1 = 11,88. 1,1 bedeutet +10 %, nicht +1 %.',
  },
  {
    id: 'pred-null-plus',
    title: 'Rechnen mit NULL',
    script: ['UPDATE Hersteller SET Anzahl_verk_Artikel = Anzahl_verk_Artikel + 5;', 'COMMIT;'],
    question: 'Welchen Wert hat Anzahl_verk_Artikel der Herstellerin danach (sie hatte zuvor NULL)?',
    query: 'SELECT Anzahl_verk_Artikel FROM Hersteller',
    options: ['5', '0', 'NULL', 'Es gibt einen Fehler'],
    answer: 'NULL',
    why: 'NULL plus eine Zahl ergibt wieder NULL. Erst mit NVL(Anzahl_verk_Artikel, 0) + 5 wäre das Ergebnis 5.',
  },
  {
    id: 'pred-null-nvl',
    title: 'NVL gegen NULL',
    script: ['UPDATE Hersteller SET Anzahl_verk_Artikel = NVL(Anzahl_verk_Artikel, 0) + 5;', 'COMMIT;'],
    question: 'Welchen Wert hat Anzahl_verk_Artikel der Herstellerin danach (sie hatte zuvor NULL)?',
    query: 'SELECT Anzahl_verk_Artikel FROM Hersteller',
    options: ['5', '0', 'NULL', 'Es gibt einen Fehler'],
    answer: '5',
    why: 'NVL ersetzt NULL durch 0, danach wird 5 addiert.',
  },
];
