import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { fkSentences, Session } from './session';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

const count = (s: Session, t: string) => s.preview(t).total;

describe('Praktikums-Sitzung', () => {
  it('Datenbank bleibt zwischen Eingaben erhalten, Fehler stoppen nicht', () => {
    const s = new Session(SQL, '');
    const r1 = s.run('CREATE TABLE a (x NUMBER PRIMARY KEY);');
    expect(r1[0].ok).toBe(true);
    const r2 = s.run("INSERT INTO a VALUES (1); INSERT INTO a VALUES (1); INSERT INTO a VALUES (2);");
    expect(r2.map((r) => r.ok)).toEqual([true, false, true]);
    expect(r2[1].ora).toBe('ORA-00001');
    expect(count(s, 'a')).toBe(2);
  });

  it('ROLLBACK verwirft Aenderungen seit dem letzten COMMIT, DDL bestaetigt implizit', () => {
    const s = new Session(SQL, 'CREATE TABLE a (x NUMBER PRIMARY KEY); INSERT INTO a VALUES (1);');
    s.run("INSERT INTO a VALUES (2); INSERT INTO a VALUES (3);");
    expect(s.pending).toBe(2);
    expect(s.run('ROLLBACK;')[0].message).toMatch(/2 nicht bestätigte/);
    expect(count(s, 'a')).toBe(1);
    s.run('INSERT INTO a VALUES (4); COMMIT; INSERT INTO a VALUES (5); ROLLBACK;');
    expect(count(s, 'a')).toBe(2); // 1 und 4
    s.run('INSERT INTO a VALUES (6); CREATE TABLE b (y NUMBER); ROLLBACK;');
    expect(count(s, 'a')).toBe(3); // 6 wurde durch das DDL bestaetigt
  });

  it('Sitzung laesst sich aus dem Protokoll wiederherstellen', () => {
    const s = new Session(SQL, '');
    s.run('CREATE TABLE a (x NUMBER PRIMARY KEY); INSERT INTO a VALUES (1); COMMIT; INSERT INTO a VALUES (2); ROLLBACK; INSERT INTO a VALUES (3); INSERT INTO a VALUES (3);');
    const again = new Session(SQL, '', s.log);
    expect(again.preview('a').rows).toEqual(s.preview('a').rows);
    expect(again.preview('a').rows).toEqual([[1], [3]]);
  });

  it('Zuruecksetzen stellt das Schema-Skript wieder her', () => {
    const s = new Session(SQL, 'CREATE TABLE a (x NUMBER); INSERT INTO a VALUES (1);');
    s.run('DELETE FROM a; CREATE TABLE b (y NUMBER);');
    s.reset();
    expect(s.tables()).toEqual(['a']);
    expect(count(s, 'a')).toBe(1);
    expect(s.log).toEqual([]);
  });

  it('TRUNCATE leert die Tabelle, bei Fremdschluesseln ORA-02266', () => {
    const s = new Session(SQL, 'CREATE TABLE p (id NUMBER PRIMARY KEY); CREATE TABLE c (pid NUMBER REFERENCES p (id)); INSERT INTO p VALUES (1);');
    expect(s.run('TRUNCATE TABLE p;')[0].ora).toBe('ORA-02266');
    expect(s.run('TRUNCATE TABLE c;')[0].ok).toBe(true);
  });

  it('Fremdschluessel werden als Saetze beschrieben (Richtung FK → PK)', () => {
    const s = new Session(SQL, 'CREATE TABLE kurs (id NUMBER PRIMARY KEY); CREATE TABLE anm (kurs_id NUMBER REFERENCES kurs (id));');
    expect(fkSentences(s.schemaInfo())).toEqual(['anm.kurs_id → kurs.id']);
  });
});
