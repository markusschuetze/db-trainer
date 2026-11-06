// Fall-Datenbank "Hochschule" fuer DQL/DML. Tabellen- und Spaltennamen wie in
// Uebung 05 (Kurs, Student, Anmelden) und Skript 05 (Prof, Fachbereich).
// Alle Personen sind frei erfunden.
//
// Datenbestand A ist sichtbar. Datenbestand B ist verdeckt und wird zusaetzlich
// geprueft: Wer Werte fest eintraegt statt die Bedingung zu formulieren, faellt auf.

export const HOCHSCHULE_SCHEMA = `
CREATE TABLE Fachbereich (
  FB_Nr   NUMBER PRIMARY KEY,
  FB_Name VARCHAR2(60) NOT NULL
);
CREATE TABLE Prof (
  P_Nr  NUMBER PRIMARY KEY,
  Name  VARCHAR2(30) NOT NULL,
  FB_Nr NUMBER REFERENCES Fachbereich (FB_Nr),
  Raum  VARCHAR2(10)
);
CREATE TABLE Student (
  Matrikelnummer NUMBER PRIMARY KEY,
  Namen          VARCHAR2(50) NOT NULL,
  Studiengang    VARCHAR2(30),
  Semester       NUMBER(2),
  Geburtsdatum   DATE
);
CREATE TABLE Kurs (
  Kurs_ID     NUMBER PRIMARY KEY,
  Bezeichnung VARCHAR2(50) NOT NULL,
  ECTS        NUMBER(2),
  P_Nr        NUMBER REFERENCES Prof (P_Nr)
);
CREATE TABLE Anmelden (
  Kurs_ID        NUMBER REFERENCES Kurs (Kurs_ID),
  Matrikelnummer NUMBER REFERENCES Student (Matrikelnummer),
  Anmeldedatum   DATE NOT NULL,
  Note           NUMBER(2,1),
  CONSTRAINT pk_anmelden PRIMARY KEY (Kurs_ID, Matrikelnummer)
);`;

export const HOCHSCHULE_TABLES = ['Fachbereich', 'Prof', 'Student', 'Kurs', 'Anmelden'];

export const DATA_A = `
INSERT INTO Fachbereich VALUES (10, 'Informatik und Ingenieurwissenschaften');
INSERT INTO Fachbereich VALUES (3, 'Informations- und Kommunikationswissenschaften');
INSERT INTO Fachbereich VALUES (5, 'Wirtschafts- und Rechtswissenschaften');

INSERT INTO Prof VALUES (1, 'Albers', 10, 'A1.04');
INSERT INTO Prof VALUES (2, 'Brandt', 10, 'A2.11');
INSERT INTO Prof VALUES (3, 'Celik', 3, 'B0.07');
INSERT INTO Prof VALUES (4, 'Dietrich', 5, NULL);

INSERT INTO Student VALUES (1001, 'Mia Wagner', 'Informatik', 3, '2004-05-12');
INSERT INTO Student VALUES (1002, 'Jonas Becker', 'Wirtschaftsinformatik', 1, '2005-09-30');
INSERT INTO Student VALUES (1003, 'Lea Schmitz', 'Informatik', 5, '2002-01-21');
INSERT INTO Student VALUES (1004, 'Noah Hoffmann', 'Medieninformatik', 3, '2003-11-02');
INSERT INTO Student VALUES (1005, 'Emma Koch', 'Informatik', 1, '2006-03-15');
INSERT INTO Student VALUES (1006, 'Paul Richter', 'Wirtschaftsinformatik', 5, '2001-07-08');
INSERT INTO Student VALUES (1007, 'Marie Klein', 'Medieninformatik', 1, '2005-12-24');
INSERT INTO Student VALUES (1008, 'Ben Wolf', 'Informatik', 7, '2000-02-29');

INSERT INTO Kurs VALUES (101, 'Datenbanksysteme', 6, 1);
INSERT INTO Kurs VALUES (102, 'Programmierung 1', 8, 2);
INSERT INTO Kurs VALUES (103, 'Mathematik 1', 6, 2);
INSERT INTO Kurs VALUES (104, 'Medienrecht', 4, 4);
INSERT INTO Kurs VALUES (105, 'Projektmanagement', 4, NULL);
INSERT INTO Kurs VALUES (106, 'Webtechnologien', 6, 3);

INSERT INTO Anmelden VALUES (101, 1001, '2026-10-01', 1.7);
INSERT INTO Anmelden VALUES (101, 1003, '2026-10-02', 2.3);
INSERT INTO Anmelden VALUES (101, 1004, '2026-10-02', NULL);
INSERT INTO Anmelden VALUES (101, 1006, '2026-10-05', 3.0);
INSERT INTO Anmelden VALUES (102, 1001, '2026-09-28', 2.0);
INSERT INTO Anmelden VALUES (102, 1005, '2026-09-29', NULL);
INSERT INTO Anmelden VALUES (102, 1007, '2026-09-30', 1.3);
INSERT INTO Anmelden VALUES (103, 1003, '2026-10-01', 4.0);
INSERT INTO Anmelden VALUES (103, 1005, '2026-10-03', NULL);
INSERT INTO Anmelden VALUES (104, 1002, '2026-10-07', 2.7);
INSERT INTO Anmelden VALUES (106, 1004, '2026-10-04', 1.0);
INSERT INTO Anmelden VALUES (106, 1007, '2026-10-06', 2.0);
`;

export const DATA_B = `
INSERT INTO Fachbereich VALUES (10, 'Informatik und Ingenieurwissenschaften');
INSERT INTO Fachbereich VALUES (7, 'Architektur');

INSERT INTO Prof VALUES (1, 'Albers', 10, 'A1.04');
INSERT INTO Prof VALUES (2, 'Brandt', 10, NULL);
INSERT INTO Prof VALUES (5, 'Engel', 7, 'C3.01');

INSERT INTO Student VALUES (1001, 'Max Peters', 'Informatik', 2, '2004-01-01');
INSERT INTO Student VALUES (1002, 'Sara Yilmaz', 'Informatik', 4, '2003-06-06');
INSERT INTO Student VALUES (1003, 'Tim Braun', 'Medieninformatik', 2, '2005-02-02');
INSERT INTO Student VALUES (1004, 'Mila Frank', 'Wirtschaftsinformatik', 6, '2002-03-03');
INSERT INTO Student VALUES (1005, 'Lukas Vogel', 'Informatik', 8, '2000-04-04');
INSERT INTO Student VALUES (1009, 'Anna Roth', 'Medieninformatik', 4, '2004-07-07');
INSERT INTO Student VALUES (1010, 'Elias Kaiser', 'Architektur', 2, '2005-08-08');
INSERT INTO Student VALUES (1011, 'Nora Lang', 'Informatik', 1, '2006-09-09');
INSERT INTO Student VALUES (1012, 'Ida Busch', 'Medieninformatik', 6, '2003-10-10');

INSERT INTO Kurs VALUES (101, 'Datenbanksysteme', 6, 1);
INSERT INTO Kurs VALUES (103, 'Mathematik 1', 6, 2);
INSERT INTO Kurs VALUES (105, 'Projektmanagement', 4, NULL);
INSERT INTO Kurs VALUES (107, 'Entwerfen', 10, 5);
INSERT INTO Kurs VALUES (108, 'Algorithmen', 5, NULL);

INSERT INTO Anmelden VALUES (101, 1001, '2026-10-01', 2.0);
INSERT INTO Anmelden VALUES (101, 1002, '2026-10-01', 1.0);
INSERT INTO Anmelden VALUES (101, 1009, '2026-10-02', NULL);
INSERT INTO Anmelden VALUES (103, 1001, '2026-10-03', 3.7);
INSERT INTO Anmelden VALUES (103, 1004, '2026-10-04', NULL);
INSERT INTO Anmelden VALUES (107, 1010, '2026-09-25', 1.7);
INSERT INTO Anmelden VALUES (108, 1002, '2026-10-05', 2.3);
INSERT INTO Anmelden VALUES (108, 1003, '2026-10-06', NULL);
INSERT INTO Anmelden VALUES (108, 1005, '2026-10-06', 4.0);
INSERT INTO Anmelden VALUES (108, 1012, '2026-09-20', 2.7);
`;
