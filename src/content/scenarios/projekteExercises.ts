import type { SqlExercise } from '../sqlTypes';

const SRC = 'Szenario Projekte nach den Beispielen aus Skript 03–05, Syntax nach den SQL-Syntaxdiagrammen (TH Köln)';
const S = { scenario: 'projekte', source: SRC } as const;

export const projekteExercises: SqlExercise[] = [
  /* ---------- Leicht ---------- */
  {
    ...S,
    id: 'projekte-gehalt',
    topicId: 'sql-select',
    kind: 'dql',
    level: 1,
    title: 'Gut bezahlt',
    topic: 'WHERE mit Vergleich',
    task: 'Gib Name und Gehalt aller Mitarbeitenden aus, die mehr als 4.500 € verdienen.',
    hints: ['Zahlen schreibt man in SQL ohne Tausenderpunkt: 4500.'],
    solution: 'SELECT Name, Gehalt\nFROM Mitarbeiter\nWHERE Gehalt > 4500;',
  },
  {
    ...S,
    id: 'projekte-budget',
    topicId: 'sql-select',
    kind: 'dql',
    level: 1,
    title: 'Mittelgroße Projekte',
    topic: 'BETWEEN',
    task: 'Gib Kürzel und Projektname aller Projekte mit einem Budget zwischen 50.000 und 150.000 € aus (Grenzen eingeschlossen).',
    hints: ['BETWEEN a AND b schließt beide Grenzen ein.'],
    solution: 'SELECT Kuerzel, Projektname\nFROM Projekt\nWHERE Budget BETWEEN 50000 AND 150000;',
  },
  {
    ...S,
    id: 'projekte-anlegen',
    topicId: 'sql-dml',
    kind: 'dml',
    level: 1,
    title: 'Neues Projekt',
    topic: 'INSERT mit Datum',
    task: 'Lege das Projekt 9 an: Kürzel APP, Name Campus-App, Budget 80.000 €, Start am 01.02.2027.',
    hints: ["Datum: TO_DATE('01.02.2027', 'DD.MM.YYYY') oder DATE '2027-02-01'"],
    solution:
      "INSERT INTO Projekt (Projekt_Nr, Kuerzel, Projektname, Budget, Startdatum)\nVALUES (9, 'APP', 'Campus-App', 80000, TO_DATE('01.02.2027', 'DD.MM.YYYY'));",
  },

  /* ---------- Mittel ---------- */
  {
    ...S,
    id: 'projekte-abteilung',
    topicId: 'sql-join',
    kind: 'dql',
    level: 2,
    title: 'Wer arbeitet wo?',
    topic: 'INNER JOIN',
    task: 'Gib für alle Mitarbeitenden den Namen und den Namen ihrer Abteilung aus.',
    hints: ['Verbinde Mitarbeiter und Abteilung über Abt_Nr.'],
    solution: 'SELECT m.Name, a.Abt_Name\nFROM Mitarbeiter m\nJOIN Abteilung a ON m.Abt_Nr = a.Abt_Nr;',
  },
  {
    ...S,
    id: 'projekte-stunden',
    topicId: 'sql-gruppen',
    kind: 'dql',
    level: 2,
    title: 'Aufwand je Projekt',
    topic: 'JOIN, GROUP BY, SUM',
    task: 'Gib für jedes Projekt mit Zuordnungen den Projektnamen und die Summe der geplanten Stunden aus.',
    hints: ['SUM(ai.Stunden) und GROUP BY p.Projektname'],
    solution:
      'SELECT p.Projektname, SUM(ai.Stunden) AS Stunden\nFROM Projekt p\nJOIN Arbeitet_in ai ON p.Projekt_Nr = ai.Projekt_Nr\nGROUP BY p.Projektname;',
  },
  {
    ...S,
    id: 'projekte-schnittgehalt',
    topicId: 'sql-gruppen',
    kind: 'dql',
    level: 2,
    title: 'Teure Abteilungen',
    topic: 'GROUP BY, HAVING, ROUND',
    task: 'Welche Abteilungen haben ein Durchschnittsgehalt über 4.500 €? Gib den Abteilungsnamen und den Durchschnitt auf ganze Euro gerundet aus.',
    hints: ['Bedingungen auf Gruppen gehören in HAVING.', 'ROUND(AVG(m.Gehalt))'],
    solution:
      'SELECT a.Abt_Name, ROUND(AVG(m.Gehalt)) AS Schnitt\nFROM Abteilung a\nJOIN Mitarbeiter m ON a.Abt_Nr = m.Abt_Nr\nGROUP BY a.Abt_Name\nHAVING AVG(m.Gehalt) > 4500;',
  },
  {
    ...S,
    id: 'projekte-gehaltserhoehung',
    topicId: 'sql-dml',
    kind: 'dml',
    level: 2,
    title: 'Gehaltserhöhung',
    topic: 'UPDATE mit Unterabfrage',
    task: 'Alle Mitarbeitenden der Abteilung IT bekommen 5 % mehr Gehalt. Verwende den Abteilungsnamen, nicht die Nummer.',
    hints: ["Die Abteilungsnummer liefert (SELECT Abt_Nr FROM Abteilung WHERE Abt_Name = 'IT').", 'SET Gehalt = Gehalt * 1.05'],
    solution: "UPDATE Mitarbeiter\nSET Gehalt = Gehalt * 1.05\nWHERE Abt_Nr = (SELECT Abt_Nr FROM Abteilung WHERE Abt_Name = 'IT');",
  },

  /* ---------- Schwer ---------- */
  {
    ...S,
    id: 'projekte-vorgesetzte',
    topicId: 'sql-join',
    kind: 'dql',
    level: 3,
    title: 'Wer ist wem unterstellt?',
    topic: 'Self-Join (rekursive Beziehung)',
    task: 'Gib für alle Mitarbeitenden den eigenen Namen und den Namen der vorgesetzten Person aus. Wer keine vorgesetzte Person hat, erscheint trotzdem (mit leerem Feld).',
    hints: [
      'Die Tabelle Mitarbeiter wird zweimal gebraucht: einmal für die Person, einmal für die vorgesetzte Person (zwei Aliase).',
      'LEFT OUTER JOIN Mitarbeiter v ON m.Vorgesetzter_ID = v.MA_ID',
    ],
    solution: 'SELECT m.Name, v.Name AS Vorgesetzt\nFROM Mitarbeiter m\nLEFT OUTER JOIN Mitarbeiter v ON m.Vorgesetzter_ID = v.MA_ID;',
  },
  {
    ...S,
    id: 'projekte-mehr-als-chef',
    topicId: 'sql-join',
    kind: 'dql',
    level: 3,
    title: 'Mehr als die Chefin',
    topic: 'Self-Join mit Vergleich',
    task: 'Wer verdient mehr als die eigene vorgesetzte Person? Gib Name und Gehalt der Person sowie das Gehalt der vorgesetzten Person aus.',
    hints: ['Self-Join wie in der vorigen Aufgabe, diesmal als INNER JOIN.', 'Vergleiche m.Gehalt > v.Gehalt.'],
    solution:
      'SELECT m.Name, m.Gehalt, v.Gehalt AS Gehalt_Vorgesetzt\nFROM Mitarbeiter m\nJOIN Mitarbeiter v ON m.Vorgesetzter_ID = v.MA_ID\nWHERE m.Gehalt > v.Gehalt;',
  },
  {
    ...S,
    id: 'projekte-ohne-leitung',
    topicId: 'sql-unterabfrage',
    kind: 'dql',
    level: 3,
    title: 'Projekte ohne Leitung',
    topic: 'NOT EXISTS',
    task: "Welche Projekte haben niemanden in der Rolle 'Leitung'? Gib die Projektnamen aus. Auch Projekte ganz ohne Zuordnungen zählen.",
    hints: ["NOT EXISTS (SELECT * FROM Arbeitet_in ai WHERE ai.Projekt_Nr = p.Projekt_Nr AND ai.Rolle = 'Leitung')"],
    solution:
      "SELECT p.Projektname\nFROM Projekt p\nWHERE NOT EXISTS (\n  SELECT * FROM Arbeitet_in ai\n  WHERE ai.Projekt_Nr = p.Projekt_Nr AND ai.Rolle = 'Leitung'\n);",
  },
  {
    ...S,
    id: 'projekte-austritt',
    topicId: 'sql-dml',
    kind: 'dml',
    level: 3,
    title: 'Austritt mit Selbstreferenz',
    topic: 'UPDATE und DELETE in der richtigen Reihenfolge',
    task: 'Weber (MA_ID 100) verlässt das Unternehmen.\n\n• Wer Weber direkt unterstellt war, hat danach keine vorgesetzte Person (NULL).\n• Webers Projektzuordnungen werden gelöscht.\n• Zum Schluss wird Weber selbst gelöscht.',
    hints: [
      'Solange noch Zeilen auf Weber verweisen (als Vorgesetzter oder in Arbeitet_in), lässt er sich nicht löschen.',
      'UPDATE Mitarbeiter SET Vorgesetzter_ID = NULL WHERE Vorgesetzter_ID = 100;',
    ],
    solution:
      'UPDATE Mitarbeiter SET Vorgesetzter_ID = NULL WHERE Vorgesetzter_ID = 100;\nDELETE FROM Arbeitet_in WHERE MA_ID = 100;\nDELETE FROM Mitarbeiter WHERE MA_ID = 100;',
  },
];
