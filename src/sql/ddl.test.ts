import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { ddlExercises } from '../content/ddlExercises';
import { runExercise } from './ddlGrading';
import { createDatabase, runScript, splitStatements } from './oracle';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

describe('Musterloesungen bestehen alle Pruefungen', () => {
  for (const ex of ddlExercises) {
    it(ex.id, () => {
      const run = runExercise(SQL, ex, ex.solution);
      const failedStmt = run.results.filter((r) => !r.ok).map((r) => `${r.sql} -> ${r.message}`);
      expect(failedStmt).toEqual([]);
      expect(run.checks.filter((c) => !c.ok)).toEqual([]);
    });
    it(`${ex.id}: leere Abgabe besteht nicht`, () => {
      // Ausnahme: Aufgaben mit reinem Zustands-Check duerfen nicht von allein bestehen
      expect(runExercise(SQL, ex, '-- nichts').passed).toBe(false);
    });
  }
});

describe('Verhaltenspruefung', () => {
  it('fehlende Tabelle zaehlt nicht als korrekte Ablehnung', () => {
    const ex = ddlExercises.find((e) => e.id === 'kurs-student-anmelden')!;
    const run = runExercise(SQL, ex, 'CREATE TABLE Student (Matrikelnummer NUMBER PRIMARY KEY, Namen VARCHAR2(50) NOT NULL);');
    expect(run.checks.find((c) => c.label === 'Anmeldung zu unbekanntem Kurs wird abgelehnt')?.ok).toBe(false);
  });
});

describe('Oracle-Verhalten', () => {
  const run = (script: string) => {
    const db = createDatabase(SQL);
    return { db, res: runScript(db, script) };
  };

  it('Skriptzerlegung ignoriert Kommentare und Semikolons in Strings', () => {
    expect(splitStatements("-- x\nSELECT 'a;b'; /* y */ SELECT 2;")).toEqual(["SELECT 'a;b'", 'SELECT 2']);
  });
  it('Fremdschluessel auf noch nicht existierende Tabelle: ORA-00942', () => {
    const { res } = run('CREATE TABLE a (x NUMBER PRIMARY KEY, y NUMBER REFERENCES b (z));');
    expect(res[0].ok).toBe(false);
    expect(res[0].ora).toBe('ORA-00942');
  });
  it('Fremdschluessel auf Nicht-Schluessel: ORA-02270', () => {
    const { res } = run('CREATE TABLE b (z NUMBER, w NUMBER); CREATE TABLE a (y NUMBER REFERENCES b (z));');
    expect(res[1].ora).toBe('ORA-02270');
  });
  it('DROP Elterntabelle ohne CASCADE: ORA-02449, mit CASCADE CONSTRAINTS ok und Kind bleibt benutzbar', () => {
    const { db, res } = run(`
      CREATE TABLE p (id NUMBER PRIMARY KEY);
      CREATE TABLE c (id NUMBER PRIMARY KEY, pid NUMBER REFERENCES p (id));
      DROP TABLE p;
      DROP TABLE p CASCADE CONSTRAINTS;
      INSERT INTO c (id, pid) VALUES (1, 42);`);
    expect(res[2].ora).toBe('ORA-02449');
    expect(res[3].ok).toBe(true);
    expect(res[4].ok).toBe(true); // FK wurde mit entfernt
    db.close();
  });
  it('kein ON UPDATE, kein RESTRICT, kein AUTOINCREMENT', () => {
    const { res } = run(`
      CREATE TABLE p (id NUMBER PRIMARY KEY);
      CREATE TABLE c (pid NUMBER REFERENCES p (id) ON UPDATE CASCADE);
      CREATE TABLE d (pid NUMBER REFERENCES p (id) ON DELETE RESTRICT);
      CREATE TABLE e (id INTEGER PRIMARY KEY AUTOINCREMENT);`);
    expect(res.slice(1).every((r) => !r.ok)).toBe(true);
  });
  it('ALTER TABLE DROP CONSTRAINT entfernt benannten Constraint', () => {
    const { db, res } = run(`
      CREATE TABLE t (a NUMBER PRIMARY KEY, b NUMBER, CONSTRAINT ch CHECK (b > 0));
      ALTER TABLE t DROP CONSTRAINT ch;
      INSERT INTO t VALUES (1, -5);`);
    expect(res.every((r) => r.ok)).toBe(true);
    db.close();
  });
  it('Fehlertexte sind uebersetzt und tragen ORA-Code', () => {
    const { res } = run(`
      CREATE TABLE t (a NUMBER PRIMARY KEY, b VARCHAR2(5) NOT NULL);
      INSERT INTO t VALUES (1, 'x');
      INSERT INTO t VALUES (1, 'y');
      INSERT INTO t (a) VALUES (2);`);
    expect(res[2].ora).toBe('ORA-00001');
    expect(res[3].ora).toBe('ORA-01400');
  });
});
