// Szenario "Projekte": Abteilungen, Mitarbeitende mit Vorgesetzten, Projekte und Rollen.
// Nach den Beispielen aus Skript 03 (Mitarbeiterin arbeitet in Projekt mit Rolle),
// Skript 04 (rekursive Beziehung: Vorgesetzter ist selbst Mitarbeiter) und
// Skript 05 (Abt_Nr -> Abt_Name als ausgelagerte Relation). Alle Personen sind erfunden.

export const PROJEKTE_SCHEMA = `
CREATE TABLE Abteilung (
  Abt_Nr   NUMBER PRIMARY KEY,
  Abt_Name VARCHAR2(40) NOT NULL,
  Standort VARCHAR2(30)
);
CREATE TABLE Mitarbeiter (
  MA_ID           NUMBER PRIMARY KEY,
  Name            VARCHAR2(40) NOT NULL,
  Abt_Nr          NUMBER REFERENCES Abteilung (Abt_Nr),
  Vorgesetzter_ID NUMBER REFERENCES Mitarbeiter (MA_ID),
  Gehalt          NUMBER(8,2),
  Eintritt        DATE
);
CREATE TABLE Projekt (
  Projekt_Nr  NUMBER PRIMARY KEY,
  Kuerzel     VARCHAR2(10) UNIQUE,
  Projektname VARCHAR2(60) NOT NULL,
  Budget      NUMBER(10,2),
  Startdatum  DATE
);
CREATE TABLE Arbeitet_in (
  MA_ID      NUMBER REFERENCES Mitarbeiter (MA_ID),
  Projekt_Nr NUMBER REFERENCES Projekt (Projekt_Nr),
  Rolle      VARCHAR2(30),
  Stunden    NUMBER(5),
  CONSTRAINT pk_arbeitet_in PRIMARY KEY (MA_ID, Projekt_Nr)
);`;

export const PROJEKTE_RELATIONS = [
  'Abteilung (Abt_Nr, Abt_Name, Standort)',
  'Mitarbeiter (MA_ID, Name, Abt_Nr <fk>, Vorgesetzter_ID <fk → Mitarbeiter>, Gehalt, Eintritt)',
  'Projekt (Projekt_Nr, Kuerzel, Projektname, Budget, Startdatum)',
  'Arbeitet_in (MA_ID <fk>, Projekt_Nr <fk>, Rolle, Stunden)',
];

export const PROJEKTE_A = `
INSERT INTO Abteilung VALUES (1, 'IT', 'Gummersbach');
INSERT INTO Abteilung VALUES (2, 'Vertrieb', 'Köln');
INSERT INTO Abteilung VALUES (3, 'Personal', 'Köln');
INSERT INTO Abteilung VALUES (4, 'Forschung', 'Gummersbach');

INSERT INTO Mitarbeiter VALUES (100, 'Weber', 1, NULL, 6200, DATE '2012-03-01');
INSERT INTO Mitarbeiter VALUES (101, 'Kaya', 1, 100, 4800, DATE '2016-07-15');
INSERT INTO Mitarbeiter VALUES (102, 'Schulz', 1, 100, 3900, DATE '2021-01-10');
INSERT INTO Mitarbeiter VALUES (103, 'Nowak', 2, NULL, 5800, DATE '2014-05-01');
INSERT INTO Mitarbeiter VALUES (104, 'Becker', 2, 103, 3600, DATE '2022-09-01');
INSERT INTO Mitarbeiter VALUES (105, 'Hahn', 2, 103, 6000, DATE '2018-02-15');
INSERT INTO Mitarbeiter VALUES (106, 'Arslan', 3, NULL, 4500, DATE '2019-11-01');
INSERT INTO Mitarbeiter VALUES (107, 'Lindner', 1, 101, 4100, DATE '2023-04-01');

INSERT INTO Projekt VALUES (1, 'DBT', 'DB-Trainer', 120000, DATE '2026-04-01');
INSERT INTO Projekt VALUES (2, 'CRM', 'Kundenportal', 250000, DATE '2025-10-01');
INSERT INTO Projekt VALUES (3, 'HR', 'Recruiting-Tool', 60000, DATE '2026-01-15');
INSERT INTO Projekt VALUES (4, 'LAB', 'Laborautomatisierung', 90000, DATE '2026-09-01');

INSERT INTO Arbeitet_in VALUES (100, 1, 'Leitung', 120);
INSERT INTO Arbeitet_in VALUES (101, 1, 'Entwicklung', 300);
INSERT INTO Arbeitet_in VALUES (107, 1, 'Test', 150);
INSERT INTO Arbeitet_in VALUES (103, 2, 'Leitung', 80);
INSERT INTO Arbeitet_in VALUES (104, 2, 'Vertrieb', 200);
INSERT INTO Arbeitet_in VALUES (101, 2, 'Entwicklung', 100);
INSERT INTO Arbeitet_in VALUES (105, 2, 'Beratung', 160);
INSERT INTO Arbeitet_in VALUES (106, 3, 'Fachexpertin', 90);
INSERT INTO Arbeitet_in VALUES (102, 3, 'Entwicklung', 240);
`;

export const PROJEKTE_B = `
INSERT INTO Abteilung VALUES (1, 'IT', 'Gummersbach');
INSERT INTO Abteilung VALUES (2, 'Vertrieb', 'Köln');
INSERT INTO Abteilung VALUES (5, 'Marketing', 'Bonn');

INSERT INTO Mitarbeiter VALUES (100, 'Weber', 1, NULL, 6400, DATE '2012-03-01');
INSERT INTO Mitarbeiter VALUES (110, 'Yilmaz', 1, 100, 6600, DATE '2017-01-01');
INSERT INTO Mitarbeiter VALUES (111, 'Roth', 1, 110, 4300, DATE '2020-06-01');
INSERT INTO Mitarbeiter VALUES (112, 'Fischer', 2, NULL, 5200, DATE '2015-02-01');
INSERT INTO Mitarbeiter VALUES (113, 'Klein', 2, 112, 5300, DATE '2019-08-01');
INSERT INTO Mitarbeiter VALUES (114, 'Graf', 5, NULL, 4700, DATE '2021-05-01');
INSERT INTO Mitarbeiter VALUES (115, 'Vogt', 5, 114, 3800, DATE '2024-01-15');

INSERT INTO Projekt VALUES (1, 'DBT', 'DB-Trainer', 110000, DATE '2026-04-01');
INSERT INTO Projekt VALUES (5, 'WEB', 'Webshop', 180000, DATE '2025-06-01');
INSERT INTO Projekt VALUES (6, 'ADS', 'Kampagne', 40000, DATE '2026-03-01');
INSERT INTO Projekt VALUES (7, 'BI', 'Reporting', 75000, DATE '2026-07-01');

INSERT INTO Arbeitet_in VALUES (110, 1, 'Leitung', 100);
INSERT INTO Arbeitet_in VALUES (111, 1, 'Entwicklung', 260);
INSERT INTO Arbeitet_in VALUES (100, 5, 'Leitung', 50);
INSERT INTO Arbeitet_in VALUES (113, 5, 'Vertrieb', 140);
INSERT INTO Arbeitet_in VALUES (111, 5, 'Entwicklung', 90);
INSERT INTO Arbeitet_in VALUES (114, 6, 'Leitung', 60);
INSERT INTO Arbeitet_in VALUES (115, 6, 'Grafik', 120);
INSERT INTO Arbeitet_in VALUES (112, 7, 'Analyse', 70);
`;
