// Typische Fehler von Studierenden: Oracle lehnt sie ab, SQLite allein nicht.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, runScript } from './oracle';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

const SETUP = `
CREATE TABLE Kurs (Kurs_ID NUMBER PRIMARY KEY, Bezeichnung VARCHAR2(10) NOT NULL, ECTS NUMBER);
CREATE TABLE Anmeldung (Kurs_ID NUMBER REFERENCES Kurs (Kurs_ID), Matrikel NUMBER);
INSERT INTO Kurs VALUES (1, 'Datenbank', 6);
INSERT INTO Kurs VALUES (2, 'Netze', 5);
INSERT INTO Anmeldung VALUES (1, 100);
`;

function last(sql: string) {
  const db = createDatabase(SQL);
  try {
    runScript(db, SETUP);
    const r = runScript(db, sql);
    return r[r.length - 1];
  } finally {
    db.close();
  }
}
const ora = (sql: string) => last(sql).ora;

describe('Fehlermeldungen wie in Oracle', () => {
  it.each([
    ["SELECT * FROM Kurs WHERE Bezeichnung = \"Netze\"", 'ORA-00904'],
    ['SELECT COUNT(*) Kurs', 'ORA-00923'],
    ['SELECT Bezeichnung, ECTS', 'ORA-00923'],
    ['SELECT TOP 3 * FROM Kurs', 'ORA-00923'],
    ["INSERT INTO Kurs VALUES (3,'A',1),(4,'B',2)", 'ORA-00933'],
    ["INSERT INTO Kurs VALUES (3,'A',1), (4,'B',2)", 'ORA-00933'],
    ['SELECT IFNULL(ECTS, 0) FROM Kurs', 'ORA-00904'],
    ['SELECT NOW() FROM DUAL', 'ORA-00904'],
    ['SELECT * FROM Kurs WHERE ECTS == 6', 'ORA-00936'],
    ['CREATE TABLE T (id NUMBER, name VARCHAR2)', 'ORA-00906'],
    ['CREATE TABLE T (id INT AUTO_INCREMENT PRIMARY KEY)', 'ORA-00907'],
    ['CREATE TABLE T (id NUMBER, notiz TEXT)', 'ORA-00902'],
    ["INSERT INTO Kurs VALUES ('abc', 'X', 1)", 'ORA-01722'],
    ["INSERT INTO Kurs VALUES (9, 'ein viel zu langer Text', 1)", 'ORA-12899'],
    ["UPDATE Kurs SET ECTS = 'viele' WHERE Kurs_ID = 1", 'ORA-01722'],
    ['SELECT * FROM Kurs WHERE Kurs_ID = (SELECT Kurs_ID FROM Kurs)', 'ORA-01427'],
    ['INSERT INTO Kurs VALUES (9)', 'ORA-00947'],
    ["INSERT INTO Kurs VALUES (9,'a',1,1)", 'ORA-00913'],
    ['SELECT * FROM Kurs ORDER BY 99', 'ORA-01785'],
    ['SELECT SUBSTR(Bezeichnung) FROM Kurs', 'ORA-00909'],
    ['CREATE TABLE T (a NUMBER, a NUMBER)', 'ORA-00957'],
    ["SELECT * FROM Kurs WHERE Bezeichnung = 'Netze", 'ORA-01756'],
    ['SELECT * FROM Kurs WHERE COUNT(*) > 1', 'ORA-00934'],
    ['SELEKT * FROM Kurs', 'ORA-00900'],
    ['INSERT INTO Anmeldung VALUES (99, 1)', 'ORA-02291'],
    ['DELETE FROM Kurs WHERE Kurs_ID = 1', 'ORA-02292'],
  ])('%s -> %s', (sql, code) => {
    expect(ora(sql)).toBe(code);
  });

  it('rohe englische SQLite-Meldungen tauchen nicht mehr auf', () => {
    for (const sql of ['SELECT * FROM Kurs WHERE x', 'SELECT * FROM Kurs HAVING ECTS > 1', 'SELECT * FROM Kurs WHERE Kurs_ID IN (SELECT * FROM Kurs)']) {
      expect(last(sql).message).not.toMatch(/\b(table|column|clause|no such|misuse|sub-select)\b/i);
    }
  });
});

describe('gueltiges SQL bleibt gueltig', () => {
  it.each([
    "SELECT Bezeichnung AS \"Titel\" FROM Kurs",
    "SELECT * FROM Kurs WHERE Bezeichnung = 'Netze'",
    "SELECT * FROM Kurs WHERE Bezeichnung = 'sagt \"hallo\"'",
    "SELECT * FROM Kurs WHERE Bezeichnung LIKE '%FROM%'",
    'SELECT SYSDATE FROM DUAL',
    "SELECT TO_DATE('01.10.2026','DD.MM.YYYY') FROM DUAL",
    'SELECT * FROM Kurs WHERE ECTS = (SELECT MAX(ECTS) FROM Kurs)',
    'SELECT * FROM Kurs WHERE Kurs_ID IN (SELECT Kurs_ID FROM Anmeldung)',
    'SELECT * FROM Kurs k WHERE ECTS > (SELECT AVG(ECTS) FROM Kurs)',
    "INSERT INTO Kurs VALUES (7, 'Neu', '5')",
    "INSERT INTO Kurs (Kurs_ID, Bezeichnung) VALUES (8, 'Ä')",
    'SELECT * FROM Kurs ORDER BY 2',
    "SELECT UPPER(Bezeichnung), NVL(ECTS, 0), SUBSTR(Bezeichnung, 1, 3), LENGTH(Bezeichnung) FROM Kurs",
  ])('%s', (sql) => {
    const r = last(sql);
    expect(r.ok, `${r.message} (${r.ora})`).toBe(true);
  });
});

describe('ALTER TABLE MODIFY', () => {
  it('aendert den Datentyp und behaelt Daten', () => {
    const db = createDatabase(SQL);
    runScript(db, SETUP);
    const [r] = runScript(db, 'ALTER TABLE Kurs MODIFY (Bezeichnung VARCHAR2(50))');
    expect(r.ok, r.message).toBe(true);
    const ok = runScript(db, "INSERT INTO Kurs VALUES (5, 'ein viel zu langer Text', 1)");
    expect(ok[0].ok, ok[0].message).toBe(true);
    expect(runScript(db, 'SELECT COUNT(*) FROM Kurs')[0].rows).toEqual([[3]]);
    db.close();
  });
  it('unbekannte Spalte', () => {
    expect(ora('ALTER TABLE Kurs MODIFY (Gibtsnicht NUMBER)')).toBe('ORA-00904');
  });
});
