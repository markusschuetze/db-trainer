import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { scenarios } from '../content/scenarios';
import { sqlExercises } from '../content/sqlExercises';
import { executeStatement } from './oracle';
import { toDate } from './dialect';
import { runPlayground, runSqlExercise, scenarioDb } from './sqlGrading';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

const byId = (id: string) => sqlExercises.find((e) => e.id === id)!;
const grade = (id: string, sql: string) => runSqlExercise(SQL, byId(id), sql);
const failed = (id: string, sql: string) => grade(id, sql).checks.filter((c) => !c.ok).map((c) => c.label);

describe('Musterloesungen', () => {
  for (const ex of sqlExercises) {
    it(`${ex.id} besteht`, () => {
      const run = runSqlExercise(SQL, ex, ex.solution);
      expect(run.results.filter((r) => !r.ok).map((r) => r.message)).toEqual([]);
      expect(run.checks.filter((c) => !c.ok)).toEqual([]);
    });
    it(`${ex.id}: leere Abgabe besteht nicht`, () => {
      expect(runSqlExercise(SQL, ex, '').passed).toBe(false);
    });
    if (ex.kind === 'dql')
      it(`${ex.id}: Ergebnis ist nicht leer`, () => {
        expect(runSqlExercise(SQL, ex, ex.solution).expected!.rows.length).toBeGreaterThan(0);
      });
  }
});

describe('Szenarien', () => {
  it('jedes Szenario hat je Stufe (Leicht, Mittel, Schwer) mindestens zwei Aufgaben', () => {
    for (const sc of scenarios)
      for (const level of [1, 2, 3])
        expect(
          sqlExercises.filter((e) => (e.scenario ?? 'hochschule') === sc.id && e.level === level).length,
          `${sc.id} Stufe ${level}`,
        ).toBeGreaterThanOrEqual(2);
  });

  it('verdeckter Datenbestand liefert bei jeder Abfrage ein anderes Ergebnis (sonst waere die Pruefung wirkungslos)', () => {
    for (const ex of sqlExercises.filter((e) => e.kind === 'dql')) {
      const sqlStmt = ex.solution.replace(/;\s*$/, '');
      const rows = (d: 'A' | 'B') => {
        const db = scenarioDb(SQL, ex.scenario, d);
        try {
          return JSON.stringify(executeStatement(db, sqlStmt).rows);
        } finally {
          db.close();
        }
      };
      expect(rows('A'), ex.id).not.toBe(rows('B'));
    }
  });
});

describe('typische Fehler werden erkannt', () => {
  it('fest eingetragene Werte fallen auf dem verdeckten Datenbestand auf', () => {
    expect(failed('selektion', 'SELECT Matrikelnummer, Namen FROM Student WHERE Matrikelnummer IN (1001, 1003, 1008)')).toEqual([
      'Stimmt auch auf einem zweiten, verdeckten Datenbestand',
    ]);
    expect(failed('unterabfrage', 'SELECT Bezeichnung, ECTS FROM Kurs WHERE ECTS > 5.67')).toHaveLength(1);
  });
  it('= NULL statt IS NULL', () => {
    expect(failed('null', 'SELECT Kurs_ID, Matrikelnummer FROM Anmelden WHERE Note = NULL')).toContain('Richtige Zeilen');
  });
  it('LIKE unterscheidet Gross-/Kleinschreibung wie Oracle', () => {
    expect(grade('like', "SELECT Namen FROM Student WHERE Namen LIKE 'm%'").passed).toBe(false);
  });
  it('falsche Sortierung', () => {
    expect(failed('sortierung', 'SELECT Namen, Semester FROM Student ORDER BY Semester, Namen')).toEqual(['Richtige Reihenfolge']);
  });
  it('fehlendes GROUP BY: ORA-00937, fehlende Spalte in GROUP BY: ORA-00979', () => {
    expect(grade('group-by', 'SELECT Studiengang, COUNT(*) FROM Student').results[0].ora).toBe('ORA-00937');
    expect(grade('group-by', 'SELECT Studiengang, Namen, COUNT(*) FROM Student GROUP BY Studiengang').results[0].ora).toBe('ORA-00979');
  });
  it('GROUP BY erlaubt Ausdruecke ueber gruppierte Spalten und Aliase', () => {
    expect(grade('group-by', 'SELECT s.Studiengang AS sg, COUNT(*) n FROM Student s GROUP BY s.Studiengang').passed).toBe(true);
    expect(grade('group-by', "SELECT UPPER(Studiengang) || '' x, COUNT(*) FROM Student GROUP BY Studiengang").results[0].ok).toBe(true);
  });
  it('AS beim Tabellenalias und LIMIT sind kein Oracle', () => {
    expect(grade('inner-join', 'SELECT k.Bezeichnung, p.Name FROM Kurs AS k JOIN Prof p ON k.P_Nr = p.P_Nr').passed).toBe(false);
    expect(grade('projektion', 'SELECT Bezeichnung, ECTS FROM Kurs LIMIT 3').results[0].ok).toBe(false);
  });
  it('alternative Loesungen sind gueltig', () => {
    expect(grade('not-exists', 'SELECT Matrikelnummer, Namen FROM Student WHERE Matrikelnummer NOT IN (SELECT Matrikelnummer FROM Anmelden)').passed).toBe(true);
    expect(grade('outer-join', 'SELECT Bezeichnung, Name FROM Kurs k LEFT JOIN Prof p USING (P_Nr)').passed).toBe(true);
    expect(grade('datum', "SELECT Kurs_ID, Matrikelnummer, Anmeldedatum FROM Anmelden WHERE Anmeldedatum >= DATE '2026-10-01'").passed).toBe(true);
  });
  it('DELETE in falscher Reihenfolge laesst Kurs stehen', () => {
    const run = grade('delete-fk', "DELETE FROM Kurs WHERE Bezeichnung = 'Mathematik 1';");
    expect(run.results[0].ok).toBe(false);
    expect(run.passed).toBe(false);
  });
  it('UPDATE ohne WHERE veraendert zu viel', () => {
    expect(grade('update', 'UPDATE Student SET Semester = Semester + 1').passed).toBe(false);
  });
});

describe('Oracle-Funktionen', () => {
  it('TO_DATE mit Formatmasken', () => {
    expect(toDate('14.02.2006', 'DD.MM.YYYY')).toBe('2006-02-14');
    expect(toDate('14.02.06', 'DD.MM.RR')).toBe('2006-02-14');
    expect(() => toDate('2006-02-14', 'DD.MM.YYYY')).toThrow();
  });
  it('NVL, TO_CHAR, DUAL, FETCH FIRST, MINUS', () => {
    const r = runPlayground(
      SQL,
      `SELECT NVL(NULL, 'x'), TO_CHAR(TO_DATE('01.10.2026','DD.MM.YYYY'), 'DD.MM.YYYY'), LPAD('7', 3, '0') FROM DUAL;
       SELECT Kurs_ID FROM Kurs ORDER BY Kurs_ID FETCH FIRST 2 ROWS ONLY;`,
    );
    expect(r[0].rows).toEqual([['x', '01.10.2026', '007']]);
    expect(r[1].rows).toEqual([[101], [102]]);
  });
});
