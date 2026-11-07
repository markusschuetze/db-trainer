import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { addItem, countOf, emptyPack, mergePacks, removeItem, toFile } from './draftPack';
import { CHAPTER_NAME, mcQuestions } from './mcQuestions';
import { applyPack, validatePack, type Pack } from './pack';
import { scenarios } from './scenarios';
import { sqlExercises } from './sqlExercises';
import { topics } from './topics';
import { allWorksheets } from './worksheets';
import { catalog } from '../progressCatalog';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});
const example = () => JSON.parse(readFileSync(new URL('../../public/aufgaben.beispiel.json', import.meta.url), 'utf8')) as Pack;

describe('Entwurfspaket', () => {
  it('Eintraege hinzufuegen, ersetzen, entfernen, vereinen', () => {
    let p = emptyPack();
    p = addItem(p, 'questions', { id: 'a' });
    p = addItem(p, 'questions', { id: 'a', x: 1 } as never);
    p = addItem(p, 'topics', { id: 't' });
    expect(p.questions).toHaveLength(1);
    expect(countOf(p)).toBe(2);
    expect(countOf(mergePacks(p, { questions: [{ id: 'b' }] } as unknown as Pack))).toBe(3);
    expect(countOf(removeItem(p, 'questions', 'a'))).toBe(1);
    expect(Object.keys(JSON.parse(toFile(p)))).toEqual(['version', 'topics', 'questions']);
  });

  it('Probelauf validiert, ohne den Trainer zu veraendern', () => {
    const snapshot = () => [topics.length, mcQuestions.length, scenarios.length, sqlExercises.length, allWorksheets().length, catalog.length, Object.keys(CHAPTER_NAME).length];
    const before = snapshot();
    const r = validatePack(example(), SQL);
    expect(r.problems).toEqual([]);
    expect(r.counts.questions).toBe(2);
    expect(snapshot()).toEqual(before);
    expect(CHAPTER_NAME.tx).toBeUndefined();
    // danach laesst sich dasselbe Paket regulaer anwenden
    expect(applyPack(example(), SQL).counts.questions).toBe(2);
    expect(snapshot()).not.toEqual(before);
  });
});

import { parseTasks, slugify } from './draftPack';

describe('Aufgabentext fuer Uebungsblaetter', () => {
  it('trennt Aufgaben, erkennt Tipp und Loesung', () => {
    const t = parseTasks(`Lege die Tabelle Kunde an.
Mit Primärschlüssel.
Tipp: CREATE TABLE
Lösung:
CREATE TABLE Kunde (id NUMBER PRIMARY KEY);
===
Füge einen Kunden ein.

===
===
Lösung: SELECT 1 FROM DUAL`);
    expect(t).toHaveLength(2); // die dritte Aufgabe hat keinen Text und wird verworfen
    expect(t[0]).toEqual({ id: 'a1', text: 'Lege die Tabelle Kunde an.\nMit Primärschlüssel.', hint: 'CREATE TABLE', solution: 'CREATE TABLE Kunde (id NUMBER PRIMARY KEY);' });
    expect(t[1]).toEqual({ id: 'a2', text: 'Füge einen Kunden ein.' });
    expect(parseTasks('Aufgabe\nLösung: SELECT 1 FROM DUAL')[0].solution).toBe('SELECT 1 FROM DUAL');
  });
  it('Slug aus deutschem Titel', () => {
    expect(slugify('Übungsblatt 7: Größe & Maß')).toBe('uebungsblatt-7-groesse-mass');
  });
});

import { highestNfOf, parseFds, parseIssues, parseTable } from './draftPack';

describe('Normalisierungsaufgabe aus Text', () => {
  it('Tabelle aus Excel- oder Semikolon-Text, mit Fehlermeldungen', () => {
    expect(parseTable('A\tB\n1\tx\n2\ty', ['A']).table).toEqual({ columns: ['A', 'B'], rows: [['1', 'x'], ['2', 'y']], pk: ['A'] });
    expect(parseTable('A;B\n1;x', ['A']).error).toBeUndefined();
    expect(parseTable('A;B\n1;x;z', ['A']).error).toMatch(/Zeile 2/);
    expect(parseTable('A;B\n1;x', ['Z']).error).toMatch(/nicht gefunden/);
    expect(parseTable('A;B', ['A']).error).toMatch(/Kopfzeile/);
  });
  it('Abhaengigkeiten und 1NF-Verletzungen', () => {
    const f = parseFds('A, B -> C | voll | braucht beide\nA → D | partiell | nur A');
    expect(f.fds).toEqual([{ lhs: ['A', 'B'], rhs: ['C'], kind: 'voll', why: 'braucht beide' }, { lhs: ['A'], rhs: ['D'], kind: 'partiell', why: 'nur A' }]);
    expect(parseFds('A -> B | falsch | x').error).toMatch(/Zeile 1/);
    expect(parseIssues('Preis | strukturiert | Zahl und Währung').issues[0]).toMatchObject({ column: 'Preis', type: 'strukturiert' });
    expect(parseIssues('x').error).toMatch(/Zeile 1/);
  });
  it('hoechste Normalform aus den Abhaengigkeiten', () => {
    const fd = (kind: 'voll' | 'partiell' | 'transitiv') => ({ lhs: ['A'], rhs: ['B'], kind, why: 'x' });
    expect(highestNfOf([fd('voll'), fd('partiell')])).toBe(1);
    expect(highestNfOf([fd('voll'), fd('transitiv')])).toBe(2);
    expect(highestNfOf([fd('voll')])).toBe(3);
  });
});
