import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseWorksheetFile } from './worksheetFile';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

describe('Uebungsblatt aus Datei', () => {
  it('SQL-Datei wird zu einem Blatt ohne Aufgaben', () => {
    const r = parseWorksheetFile('Kino Schema.sql', 'CREATE TABLE a (x NUMBER); INSERT INTO a VALUES (1);', SQL);
    expect(r.problems).toEqual([]);
    expect(r.sheets[0]).toMatchObject({ id: 'datei-kino-schema', origin: 'datei', tasks: [] });
  });
  it('JSON mit Aufgaben, einzeln oder als Liste', () => {
    const w = { id: 'b1', title: 'Blatt 1', schema: 'CREATE TABLE a (x NUMBER);', tasks: [{ id: 't1', text: 'Fuege etwas ein.' }, { kaputt: true }] };
    expect(parseWorksheetFile('b.json', JSON.stringify(w), SQL).sheets[0].tasks).toHaveLength(1);
    expect(parseWorksheetFile('b.json', JSON.stringify([w, { ...w, id: 'b2' }]), SQL).sheets).toHaveLength(2);
    expect(parseWorksheetFile('b.json', JSON.stringify({ worksheets: [w] }), SQL).sheets).toHaveLength(1);
  });
  it('fehlerhaftes Schema oder kaputtes JSON wird gemeldet statt geladen', () => {
    const bad = parseWorksheetFile('b.json', JSON.stringify({ id: 'x', title: 'X', schema: 'CREATE TABLE a (y NUMBER REFERENCES gibtsnicht (z));', tasks: [] }), SQL);
    expect(bad.sheets).toEqual([]);
    expect(bad.problems[0]).toMatch(/Schema fehlerhaft/);
    expect(parseWorksheetFile('b.json', '{nope', SQL).problems[0]).toMatch(/JSON/);
    expect(parseWorksheetFile('b.json', JSON.stringify({ title: 'ohne id' }), SQL).problems).toHaveLength(1);
  });
});
