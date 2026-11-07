import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { ddlExercises } from '../content/ddlExercises';
import type { DdlExercise } from '../content/ddlTypes';
import { runExercise } from './ddlGrading';
import { deriveChecks } from './deriveChecks';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

describe('Pruefungen aus der Musterloesung ableiten', () => {
  const sol = `CREATE TABLE Kurs (Kurs_ID NUMBER PRIMARY KEY, Titel VARCHAR2(40) NOT NULL UNIQUE, Preis NUMBER(6,2) DEFAULT 10);
CREATE TABLE Anm (Kurs_ID NUMBER REFERENCES Kurs (Kurs_ID) ON DELETE CASCADE, Tag DATE, CONSTRAINT pk_anm PRIMARY KEY (Kurs_ID, Tag));`;

  it('leitet Struktur-Pruefungen ab', () => {
    const d = deriveChecks(SQL, '', sol);
    expect(d.errors).toEqual([]);
    const kinds = d.checks.map((c) => c.kind);
    for (const k of ['table', 'column', 'pk', 'notnull', 'unique', 'fk', 'default']) expect(kinds, k).toContain(k);
    expect(d.checks.find((c) => c.kind === 'fk')).toMatchObject({ table: 'Anm', refTable: 'Kurs', onDelete: 'cascade' });
    expect(d.checks.find((c) => c.kind === 'pk' && c.table === 'Anm')).toMatchObject({ columns: ['Kurs_ID', 'Tag'] });
    expect(d.checks.find((c) => c.kind === 'column' && c.column === 'Tag')).toMatchObject({ family: 'date' });
  });

  it('die Musterloesung besteht die abgeleiteten Pruefungen, eine leere Abgabe nicht', () => {
    const ex: DdlExercise = { id: 'x', topicId: '06-create', title: 't', level: 1, task: 't', hints: [], solution: sol, checks: deriveChecks(SQL, '', sol).checks, topic: 't', source: 't' };
    expect(runExercise(SQL, ex, sol).passed).toBe(true);
    expect(runExercise(SQL, ex, '').passed).toBe(false);
    // andere, aber gleichwertige Schreibweise (Spaltenconstraint statt Tabellenconstraint) wird akzeptiert
    const alt = `CREATE TABLE Kurs (Kurs_ID NUMBER, Titel VARCHAR2(40) NOT NULL, Preis NUMBER(6,2) DEFAULT 10, PRIMARY KEY (Kurs_ID), UNIQUE (Titel));
CREATE TABLE Anm (Kurs_ID NUMBER, Tag DATE, PRIMARY KEY (Kurs_ID, Tag), FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID) ON DELETE CASCADE);`;
    expect(runExercise(SQL, ex, alt).passed).toBe(true);
    // ohne CASCADE faellt es auf
    expect(runExercise(SQL, ex, alt.replace(' ON DELETE CASCADE', '')).passed).toBe(false);
  });

  it('nur Neues wird geprueft: setup-Tabellen bleiben aussen vor, ALTER wird erkannt', () => {
    const setup = 'CREATE TABLE Kurs (Kurs_ID NUMBER PRIMARY KEY); CREATE TABLE Anm (Kurs_ID NUMBER);';
    const d = deriveChecks(SQL, setup, 'ALTER TABLE Anm ADD CONSTRAINT fk_k FOREIGN KEY (Kurs_ID) REFERENCES Kurs (Kurs_ID);', { requireNames: true });
    expect(d.checks.map((c) => c.kind).sort()).toEqual(['constraintName', 'fk']);
    expect(d.checks.find((c) => c.kind === 'constraintName')).toMatchObject({ name: 'fk_k' });
  });

  it('meldet Fehler in der Musterloesung', () => {
    expect(deriveChecks(SQL, '', 'CREATE TABLE a (x NUMBER REFERENCES nix (y));').errors[0]).toMatch(/Musterlösung/);
  });

  it('auf den eingebauten Aufgaben besteht jede Musterloesung auch die abgeleiteten Pruefungen', () => {
    for (const ex of ddlExercises.filter((e) => !e.checks.some((c) => c.kind === 'noTables'))) {
      const derived = deriveChecks(SQL, ex.setup ?? '', ex.solution);
      const test: DdlExercise = { ...ex, checks: derived.checks };
      expect(derived.errors, ex.id).toEqual([]);
      expect(runExercise(SQL, test, ex.solution).passed, ex.id).toBe(true);
    }
  });
});
