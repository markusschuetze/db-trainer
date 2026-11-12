import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { ddlExercises } from '../content/ddlExercises';
import { runExercise } from './ddlGrading';
import { createDatabase, runScript, splitStatements } from './oracle';
import { Session } from './session';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

describe('Musterloesungen bestehen alle Pruefungen', () => {
  for (const ex of ddlExercises) {
    it(ex.id, () => {
      const run = runExercise(SQL, ex, ex.solution);
      // DROP TABLE am Skriptanfang meldet beim ersten Lauf ORA-00942 (Tabelle existiert noch nicht): erwartet
      const failedStmt = run.results
        .filter((r) => !r.ok && !(r.ora === 'ORA-00942' && /^\s*DROP\s+TABLE/i.test(r.sql)))
        .map((r) => `${r.sql} -> ${r.message}`);
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

describe('Verzögerte Bedingungen (DEFERRABLE INITIALLY DEFERRED)', () => {
  const run = (script: string) => {
    const db = createDatabase(SQL);
    return { db, res: runScript(db, script) };
  };
  const setup = `
    CREATE TABLE m (id NUMBER PRIMARY KEY, g NUMBER);
    ALTER TABLE m ADD CONSTRAINT c_g CHECK (g >= 10) DEFERRABLE INITIALLY DEFERRED;`;
  it('INSERT klappt, erst COMMIT lehnt ab und rollt zurück', () => {
    const s = new Session(SQL, setup);
    const r = s.run('INSERT INTO m VALUES (1, 5); COMMIT; SELECT COUNT(*) FROM m;');
    expect(r[0].ok).toBe(true);
    expect(r[1].ok).toBe(false);
    expect(r[1].ora).toBe('ORA-02091');
    expect(r[2].rows).toEqual([[0]]);
    s.close();
  });
  it('gültige Zeilen werden bestätigt', () => {
    const s = new Session(SQL, setup);
    const r = s.run('INSERT INTO m VALUES (1, 15); COMMIT; ROLLBACK; SELECT COUNT(*) FROM m;');
    expect(r.slice(0, 2).every((x) => x.ok)).toBe(true);
    expect(r[3].rows).toEqual([[1]]);
    s.close();
  });
  it('INITIALLY IMMEDIATE prüft sofort, eine Verletzung beim Anlegen wird gemeldet', () => {
    const { res } = run(`
      CREATE TABLE m (id NUMBER PRIMARY KEY, g NUMBER);
      ALTER TABLE m ADD CONSTRAINT c_g CHECK (g >= 10) DEFERRABLE INITIALLY IMMEDIATE;
      INSERT INTO m VALUES (1, 5);
      INSERT INTO m VALUES (2, 5);
      ALTER TABLE m ADD CONSTRAINT c_h CHECK (g >= 10) DEFERRABLE INITIALLY DEFERRED;`);
    expect(res[2].ok).toBe(false);
    expect(res[2].ora).toBe('ORA-02290');
  });
  it('REGEXP_LIKE', () => {
    const { res } = run(`CREATE TABLE r (e VARCHAR2(20)); INSERT INTO r VALUES ('ab.x@T.de'); SELECT COUNT(*) FROM r WHERE REGEXP_LIKE(e, '^.{2}[.].*@T[.]de$');`);
    expect(res[2].rows).toEqual([[1]]);
  });
});

describe('Tierheim-Aufgaben: falsche Lösungen fallen auf', () => {
  const ex = (id: string) => ddlExercises.find((e) => e.id === id)!;
  it('sofort geprüfte Bedingung statt verspäteter wird erkannt', () => {
    const immediate = ex('tierheim-check-verspaetet').solution.replace(/ DEFERRABLE INITIALLY DEFERRED/g, '');
    const run = runExercise(SQL, ex('tierheim-check-verspaetet'), immediate);
    expect(run.passed).toBe(false);
    expect(run.checks.some((c) => !c.ok && /sollte noch klappen|COMMIT/.test(c.hint ?? ''))).toBe(true);
  });
  it('Gehaltsgrenzen müssen stimmen', () => {
    const wrong = ex('tierheim-check-verspaetet').solution.replace('Gehalt >= 35000', 'Gehalt >= 30000');
    expect(runExercise(SQL, ex('tierheim-check-verspaetet'), wrong).passed).toBe(false);
  });
  it('REGEXP_LIKE statt LIKE ist ebenfalls richtig', () => {
    const alt = `ALTER TABLE Adoptant ADD CONSTRAINT a1 CHECK (Alter_Jahre >= 18);
ALTER TABLE Mitarbeiter ADD CONSTRAINT a2 CHECK (REGEXP_LIKE(Email, '^.{2}[.].*@Tierheim[.]de$'));`;
    expect(runExercise(SQL, ex('tierheim-check-sofort'), alt).passed).toBe(true);
  });
  it('Skript ohne DROP oder mit falscher Reihenfolge ist nicht mehrfach ausführbar', () => {
    const e = ex('tierheim-drop');
    const sol = e.solution;
    const withoutDrop = sol.split('\n').filter((l) => !/^DROP/.test(l)).join('\n');
    expect(runExercise(SQL, e, withoutDrop).passed).toBe(false);
    const wrongOrder = sol.replace(/ CASCADE CONSTRAINTS/g, '');
    const parentFirst = wrongOrder.replace('DROP TABLE Adoptiert;\n', '').replace('DROP TABLE Mitarbeiter;', 'DROP TABLE Mitarbeiter;\nDROP TABLE Adoptiert;');
    expect(runExercise(SQL, e, parentFirst).passed).toBe(false);
  });
});
